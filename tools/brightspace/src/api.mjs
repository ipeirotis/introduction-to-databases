// Brightspace (D2L Valence) REST API client.
//
// Reads are done over the official JSON API rather than by scraping HTML: it's
// stable, structured, and needs no browser. Auth piggybacks on the session
// saved by `login` — Playwright's APIRequestContext replays the storageState
// cookies, and we add the D2L XSRF token (read from the same storageState's
// localStorage) as the X-Csrf-Token header that the web UI sends.
//
// Only the interactive `login` still needs a real browser; everything else
// goes through here.

import { request } from 'playwright';
import { readFileSync } from 'node:fs';

export class AuthExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

// Pull the D2L XSRF token out of the saved storageState localStorage.
function readXsrf(config) {
  try {
    const s = JSON.parse(readFileSync(config.storageStatePath, 'utf8'));
    const origin = (s.origins || []).find((o) => o.origin === config.brightspace.baseUrl);
    const entry = ((origin && origin.localStorage) || []).find((x) => x.name === 'XSRF.Token');
    return entry ? entry.value : null;
  } catch {
    return null;
  }
}

// Open an authenticated API context. No browser is launched. Honors HTTPS_PROXY
// so it works behind a corporate/sandbox proxy; --insecure (config.insecure)
// skips TLS verification, needed only when that proxy intercepts TLS.
export async function openApi(config) {
  const xsrf = readXsrf(config);
  return request.newContext({
    baseURL: config.brightspace.baseUrl,
    storageState: config.storageStatePath,
    extraHTTPHeaders: xsrf ? { 'X-Csrf-Token': xsrf } : {},
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
    ignoreHTTPSErrors: Boolean(config.insecure),
  });
}

async function getJson(ctx, path) {
  const res = await ctx.get(path);
  const ct = res.headers()['content-type'] || '';
  // An expired session is rejected with 401/403, or bounced to an HTML login
  // page (200 but not JSON). Either way, the saved login needs refreshing.
  if (res.status() === 401 || res.status() === 403 || !ct.includes('json')) {
    throw new AuthExpiredError(
      `Brightspace rejected the request to ${path} (HTTP ${res.status()}). ` +
        'The saved session has likely expired — re-run "brightspace login".'
    );
  }
  if (!res.ok()) throw new Error(`GET ${path} -> HTTP ${res.status()}`);
  return res.json();
}

// D2L pins each API to a version in the URL. Discover the newest the server
// supports instead of hardcoding one. Cached per process.
let _versions = null;
export async function versions(ctx) {
  if (_versions) return _versions;
  const pick = (v) => {
    // D2L's ProductVersions block carries an authoritative LatestVersion; prefer
    // it over inferring from SupportedVersions (which can include non-numeric
    // contracts like "unstable" that would otherwise sort to the top).
    if (v && !Array.isArray(v) && v.LatestVersion) return v.LatestVersion;
    const arr = Array.isArray(v) ? v : v.SupportedVersions || [];
    const list = arr
      .map((x) => (typeof x === 'string' ? x : x.LatestVersion || x.Version))
      .filter((s) => /^\d+(\.\d+)*$/.test(String(s))); // stable numeric versions only
    return list.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })).pop();
  };
  const le = pick(await getJson(ctx, '/d2l/api/le/versions/'));
  const lp = pick(await getJson(ctx, '/d2l/api/lp/versions/'));
  _versions = { le: le || '1.95', lp: lp || '1.43' };
  return _versions;
}

export async function whoami(ctx) {
  const { lp } = await versions(ctx);
  return getJson(ctx, `/d2l/api/lp/${lp}/users/whoami`);
}

// All course-offering enrollments for the signed-in user (paged).
export async function enrollments(ctx) {
  const { lp } = await versions(ctx);
  const items = [];
  let bookmark = '';
  for (let i = 0; i < 100; i++) {
    const url =
      `/d2l/api/lp/${lp}/enrollments/myenrollments/?orgUnitTypeId=3` +
      (bookmark ? `&bookmark=${encodeURIComponent(bookmark)}` : '');
    const page = await getJson(ctx, url);
    items.push(...(page.Items || []));
    if (page.PagingInfo && page.PagingInfo.HasMoreItems) bookmark = page.PagingInfo.Bookmark;
    else break;
  }
  return items;
}

export async function courseInfo(ctx, ou) {
  const { lp } = await versions(ctx);
  return getJson(ctx, `/d2l/api/lp/${lp}/courses/${ou}`);
}

export async function assignments(ctx, ou) {
  const { le } = await versions(ctx);
  return getJson(ctx, `/d2l/api/le/${le}/${ou}/dropbox/folders/`);
}

export async function quizzes(ctx, ou) {
  const { le } = await versions(ctx);
  const out = [];
  let url = `/d2l/api/le/${le}/${ou}/quizzes/`;
  for (let i = 0; i < 100 && url; i++) {
    const page = await getJson(ctx, url);
    out.push(...(Array.isArray(page) ? page : page.Objects || []));
    url = (!Array.isArray(page) && page.Next) || null;
  }
  return out;
}

export async function contentToc(ctx, ou) {
  const { le } = await versions(ctx);
  return getJson(ctx, `/d2l/api/le/${le}/${ou}/content/toc`);
}

export async function news(ctx, ou) {
  const { le } = await versions(ctx);
  return getJson(ctx, `/d2l/api/le/${le}/${ou}/news/`);
}

export async function quizQuestions(ctx, ou, quizId) {
  const { le } = await versions(ctx);
  const out = [];
  let url = `/d2l/api/le/${le}/${ou}/quizzes/${quizId}/questions/`;
  for (let i = 0; i < 100 && url; i++) {
    const page = await getJson(ctx, url);
    out.push(...(Array.isArray(page) ? page : page.Objects || []));
    url = (!Array.isArray(page) && page.Next) || null;
  }
  return out;
}

// Raw bytes of a content topic's file (HTML page, PDF, image, notebook, ...).
// Not JSON, so it bypasses getJson. Returns { body: Buffer, contentType }.
export async function topicFile(ctx, ou, topicId) {
  const { le } = await versions(ctx);
  const res = await ctx.get(`/d2l/api/le/${le}/${ou}/content/topics/${topicId}/file`);
  if (res.status() === 401 || res.status() === 403) {
    throw new AuthExpiredError(
      `Brightspace rejected the file request (HTTP ${res.status()}). Re-run "brightspace login".`
    );
  }
  if (!res.ok()) throw new Error(`topic ${topicId} file -> HTTP ${res.status()}`);
  return { body: await res.body(), contentType: res.headers()['content-type'] || '' };
}

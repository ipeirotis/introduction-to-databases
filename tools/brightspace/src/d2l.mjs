// Shared helpers for talking to a D2L / Brightspace course shell over an
// already-authenticated Playwright context.
//
// Two jobs:
//   1. Build the well-known D2L URLs for a course (the "manage" / list pages).
//   2. Read those pages defensively — D2L renders most admin lists as a grid
//      table, so we scrape generically by header name rather than by brittle,
//      hand-picked CSS selectors.
//
// NOTE: these selectors are a best-effort first pass written without a live
// course to test against. They are deliberately forgiving and fall back to
// "unrecognized" (rather than crashing) when the DOM doesn't match, and the
// audit command can dump the raw HTML so the selectors can be tightened on
// the first real run.

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

export function courseUrls(config) {
  const base = config.brightspace.baseUrl;
  const ou = config.brightspace.courseId;
  return {
    home: `${base}/d2l/home/${ou}`,
    // Assignments (Dropbox) folder management list.
    assignments: `${base}/d2l/lms/dropbox/admin/folders_manage.d2l?ou=${ou}`,
    // Quizzes management list.
    quizzes: `${base}/d2l/lms/quizzing/admin/quizzes_manage.d2l?ou=${ou}`,
    // Content / Lessons table of contents (a SPA — see readContentTree).
    content: `${base}/d2l/le/content/${ou}/Home`,
    // Announcements (News) list.
    announcements: `${base}/d2l/lms/news/main.d2l?ou=${ou}`,
  };
}

// ---------------------------------------------------------------------------
// Auth state detection
// ---------------------------------------------------------------------------

// Looks at where a navigation actually landed. A saved session that has
// expired bounces through the NYU identity provider instead of rendering the
// requested D2L page, so we can detect "you need to log in again" cleanly
// instead of scraping a login form and returning nonsense.
export function detectAuthState(page) {
  const url = page.url().toLowerCase();
  if (
    url.includes('shibboleth') ||
    url.includes('/idp/') ||
    url.includes('samlsso') ||
    url.includes('login.microsoftonline') ||
    url.includes('/d2l/login') ||
    url.includes('/d2l/lp/auth/login')
  ) {
    return 'login';
  }
  if (url.includes('/d2l/')) return 'authenticated';
  return 'unknown';
}

export class AuthExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

// Navigate and fail loudly (with an actionable message) if the saved session
// is no longer valid.
export async function gotoAuthed(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const state = detectAuthState(page);
  if (state === 'login') {
    throw new AuthExpiredError(
      'Saved Brightspace session has expired (redirected to NYU login). ' +
        'Re-run "npm run brightspace -- login" to refresh it.'
    );
  }
  return state;
}

// ---------------------------------------------------------------------------
// Generic grid-table scrape
// ---------------------------------------------------------------------------

// D2L admin lists (assignments, quizzes, announcements) render as an HTML
// table. We pick the densest table on the page, read its header row to label
// columns, and return one object per data row:
//   { title, href, cells: { "<header>": "<text>", ... } }
// Mapping header text -> a friendly field is left to each reader so it can
// tolerate D2L's column renames.
export async function scrapeGridTable(page) {
  return await page.evaluate(() => {
    const clean = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

    const tables = Array.from(document.querySelectorAll('table'));
    if (!tables.length) return { headers: [], rows: [] };

    // Densest table by row count is almost always the data grid.
    let best = null;
    let bestRows = -1;
    for (const t of tables) {
      const n = t.querySelectorAll('tr').length;
      if (n > bestRows) {
        bestRows = n;
        best = t;
      }
    }

    const trs = Array.from(best.querySelectorAll('tr'));
    const headerRowIndex = trs.findIndex((tr) => tr.querySelector('th'));
    let headers = [];
    if (headerRowIndex >= 0) {
      headers = Array.from(trs[headerRowIndex].querySelectorAll('th,td')).map(clean);
    }

    const rows = [];
    const startAt = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
    for (let i = startAt; i < trs.length; i++) {
      const cells = Array.from(trs[i].querySelectorAll('td'));
      if (!cells.length) continue; // skip nested header / spacer rows
      const link = trs[i].querySelector('a[href]');
      const cellMap = {};
      cells.forEach((c, idx) => {
        const key = headers[idx] || `col${idx}`;
        cellMap[key] = clean(c);
      });
      rows.push({
        title: clean(link) || clean(cells[0]) || '',
        href: link ? link.getAttribute('href') : null,
        cells: cellMap,
      });
    }
    return { headers, rows };
  });
}

// Find the value of the first cell whose header matches `re`. Returns null if
// no header matched (so readers can distinguish "absent" from "empty").
export function cellByHeader(row, re) {
  for (const [header, value] of Object.entries(row.cells || {})) {
    if (re.test(header)) return value;
  }
  return null;
}

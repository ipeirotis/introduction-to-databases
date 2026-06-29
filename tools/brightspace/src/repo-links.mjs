// Shared helper for rewriting links into the repo's removed `session<N>/` layout.
//
// Old Brightspace assignment/quiz bodies link to template notebooks and practice
// files under the repo's former `session<N>/` directories (since reorganized into
// `module<N>/`). Those URLs 404 on a fresh checkout. Both `question-bank` (the
// public bank) and `download` (the committed Brightspace export) render that text,
// so the fix lives here and is applied in both paths.

import { readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

// Index every repo file basename -> repo-relative path(s). A basename that
// resolves ambiguously (e.g. README.md) is left for the caller to de-link rather
// than guessed. node_modules/.git are skipped.
export function buildRepoFileIndex(repoRoot) {
  const index = new Map();
  const SKIP = new Set(['node_modules', '.git']);
  const walk = (dir) => {
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) walk(resolve(dir, e.name));
      } else {
        const rel = relative(repoRoot, resolve(dir, e.name)).split(sep).join('/');
        const arr = index.get(e.name) || [];
        arr.push(rel);
        index.set(e.name, arr);
      }
    }
  };
  walk(repoRoot);
  return index;
}

// Rewrite links into the repo's removed `session<N>/` paths: point them at the
// file's current location if its basename still exists exactly once (preserving
// any #fragment), otherwise de-link (keep the text) so nothing public ships a
// 404. Current `module<N>/` links don't match and are left untouched.
const REPO_SESSION_BLOB =
  /\[([^\]]*)\]\(https?:\/\/github\.com\/ipeirotis\/introduction-to-databases\/blob\/[^/]+\/session\d+\/([^)\s#]+)(#[^)\s]*)?\)/gi;
export function fixTemplateLinks(text, index) {
  return String(text || '').replace(REPO_SESSION_BLOB, (_m, label, rest, frag) => {
    const base = rest.split('/').pop();
    const shown = label || base; // some links have an empty anchor (e.g. a heading)
    const hits = (index && index.get(base)) || [];
    if (hits.length === 1) {
      return `[${shown}](https://github.com/ipeirotis/introduction-to-databases/blob/master/${hits[0]}${frag || ''})`;
    }
    return `${shown} _(template moved — see the module folders)_`;
  });
}

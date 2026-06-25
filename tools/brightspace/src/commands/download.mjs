// `brightspace download` — download Brightspace artifacts not in the repo.
//
// STATUS: scaffold. Listing works via the API (see audit); the per-kind save
// logic still needs to be written. Tracked in TASKS.md under "Tooling".

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../config.mjs';
import { openApi } from '../api.mjs';

const DEFAULT_KINDS = 'assignments,quizzes,announcements';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace download [--offering <path>] [--insecure]
       [--kinds assignments,quizzes,announcements]
       [--out <dir>]

Downloads artifacts that exist on Brightspace but are not in the repo, into
<out> (default: <offering>/_downloaded/). Read-only against Brightspace.`);
    return;
  }

  const config = loadConfig(flags);
  const ou = config.brightspace.courseId;
  if (!ou) {
    throw new Error(
      `brightspace.course_id is not set in ${config.offeringRel}/offering.yaml. ` +
        `Run "brightspace courses" to find it, or pass --course-id <id>.`
    );
  }

  const kinds = (flags.kinds || DEFAULT_KINDS)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const outDir = flags.out
    ? resolve(config.repoRoot, flags.out)
    : resolve(config.offeringDir, '_downloaded');
  mkdirSync(outDir, { recursive: true });

  const ctx = await openApi(config);
  try {
    console.log(`Downloading ${kinds.join(', ')} for ${config.brightspace.label}`);
    console.log(`Output: ${outDir}`);
    for (const kind of kinds) {
      // TODO: use the api.mjs readers to list each kind, then save instructions
      // / bodies / attachments under <outDir>/<kind>/. See TASKS.md.
      console.log(`  ${kind}: not_implemented`);
    }
  } finally {
    await ctx.dispose();
  }
}

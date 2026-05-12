// `brightspace download` — download Brightspace artifacts not in the repo.
//
// STATUS: scaffold. Selectors and download flows still need to be wired in
// per artifact kind. Tracked in TASKS.md under "Tooling".

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../config.mjs';
import { launchAuthenticatedContext } from '../auth.mjs';

const DEFAULT_KINDS = 'assignments,quizzes,announcements';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace download [--offering <path>] [--headed]
       [--kinds assignments,quizzes,announcements]
       [--out <dir>]

Downloads artifacts that exist on Brightspace but are not in the repo, into
<out> (default: <offering>/_downloaded/). Read-only against Brightspace.`);
    return;
  }

  const config = loadConfig(flags);
  if (!config.brightspace.courseId) {
    throw new Error(
      `brightspace.course_id is not set in ${config.offeringRel}/offering.yaml. ` +
        `Set it or pass --course-id <id>.`
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

  const { browser, context } = await launchAuthenticatedContext(config);
  try {
    const page = await context.newPage();
    console.log(`Downloading ${kinds.join(', ')} for ${config.brightspace.label}`);
    console.log(`Output: ${outDir}`);

    for (const kind of kinds) {
      switch (kind) {
        case 'assignments':
          await downloadAssignments(page, config, outDir);
          break;
        case 'quizzes':
          await downloadQuizzes(page, config, outDir);
          break;
        case 'announcements':
          await downloadAnnouncements(page, config, outDir);
          break;
        default:
          console.warn(`Skipping unknown kind: ${kind}`);
      }
    }
  } finally {
    await browser.close();
  }
}

async function downloadAssignments(_page, _config, _outDir) {
  // TODO: for each assignment folder, save instructions HTML + attachments
  // under <outDir>/assignments/<safe-title>/.
  console.log('  assignments: not_implemented');
}

async function downloadQuizzes(_page, _config, _outDir) {
  // TODO: for each quiz, save question list + properties under
  // <outDir>/quizzes/<safe-title>/.
  console.log('  quizzes: not_implemented');
}

async function downloadAnnouncements(_page, _config, _outDir) {
  // TODO: save each announcement as markdown under
  // <outDir>/announcements/<YYYY-MM-DD>-<safe-title>.md.
  console.log('  announcements: not_implemented');
}

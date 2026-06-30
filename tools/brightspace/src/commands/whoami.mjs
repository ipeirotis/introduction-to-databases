// `brightspace whoami` — verify the saved session is still valid.
//
// The "am I connected?" check. Calls the API with the saved session and
// reports who's signed in. If a course_id is configured, confirms the course
// is reachable and prints its name. Read-only; no browser.

import { loadConfig } from '../config.mjs';
import { openApi, whoami, courseInfo, AuthExpiredError } from '../api.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace whoami [--offering <path>] [--insecure]

Confirms the saved Brightspace session still works and prints the signed-in
user. If a course_id is set, also checks the course is reachable. Run "login"
first if this reports an expired session.`);
    return;
  }

  const config = loadConfig(flags);
  const ctx = await openApi(config);
  try {
    let me;
    try {
      me = await whoami(ctx);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        console.log(`✗ Not connected: ${err.message}`);
        process.exitCode = 1;
        return;
      }
      throw err;
    }

    console.log('✓ Connected to Brightspace.');
    console.log(`  Base URL: ${config.brightspace.baseUrl}`);
    console.log(`  Signed in as: ${me.FirstName} ${me.LastName} (${me.UniqueName})`);

    if (!config.brightspace.courseId) {
      console.log('  No course_id set yet — run "brightspace courses" to find it,');
      console.log(`  then set brightspace.course_id in ${config.offeringRel}/offering.yaml.`);
      return;
    }
    try {
      const c = await courseInfo(ctx, config.brightspace.courseId);
      console.log(`  ✓ Course ${config.brightspace.courseId}: ${c.Name}${c.Code ? ` [${c.Code}]` : ''}`);
    } catch (err) {
      console.log(`  ✗ Course ${config.brightspace.courseId} not reachable: ${err.message}`);
      process.exitCode = 1;
    }
  } finally {
    await ctx.dispose();
  }
}

// `brightspace whoami` — verify the saved session is still valid.
//
// This is the "am I connected?" check. It loads the persisted storageState,
// hits the Brightspace home, and reports whether the session is live. If a
// course_id is configured it also confirms the course shell is reachable and
// prints its title. Read-only.

import { loadConfig } from '../config.mjs';
import { launchAuthenticatedContext } from '../auth.mjs';
import { courseUrls, detectAuthState } from '../d2l.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace whoami [--offering <path>] [--headed]

Loads the saved login and reports whether the Brightspace session is still
valid. If a course_id is set, also checks that the course shell is reachable.
Run "login" first if this reports an expired session.`);
    return;
  }

  const config = loadConfig(flags);
  const { browser, context } = await launchAuthenticatedContext(config);
  try {
    const page = await context.newPage();

    // 1. Is the session itself alive?
    await page.goto(`${config.brightspace.baseUrl}/d2l/home`, {
      waitUntil: 'domcontentloaded',
    });
    const state = detectAuthState(page);
    if (state !== 'authenticated') {
      console.log('✗ Not connected: saved session is expired or invalid.');
      console.log('  Run "npm run brightspace -- login" to refresh it.');
      process.exitCode = 1;
      return;
    }

    // Best-effort: surface the signed-in user's name if D2L exposes it.
    const who = await page
      .evaluate(() => {
        const sel = [
          '.d2l-navigation-s-text',
          '[data-username]',
          '.d2l-user-name',
          'd2l-navigation-button-notification-icon',
        ];
        for (const s of sel) {
          const el = document.querySelector(s);
          const t = (el?.textContent || el?.getAttribute?.('data-username') || '').trim();
          if (t) return t;
        }
        return null;
      })
      .catch(() => null);

    console.log('✓ Connected to Brightspace.');
    console.log(`  Base URL: ${config.brightspace.baseUrl}`);
    if (who) console.log(`  Signed in as: ${who}`);

    // 2. Is the configured course reachable?
    if (!config.brightspace.courseId) {
      console.log(
        '  No course_id configured yet — set brightspace.course_id in ' +
          `${config.offeringRel}/offering.yaml (the number after /d2l/home/ ` +
          'in the course URL) so audit/download know which shell to read.'
      );
      return;
    }

    const urls = courseUrls(config);
    await page.goto(urls.home, { waitUntil: 'domcontentloaded' });
    if (detectAuthState(page) !== 'authenticated') {
      console.log(`  ✗ Course ${config.brightspace.courseId} not reachable with this session.`);
      process.exitCode = 1;
      return;
    }
    const title = (await page.title().catch(() => '')) || '';
    console.log(`  ✓ Course ${config.brightspace.courseId} reachable: ${title || '(no title)'}`);
  } finally {
    await browser.close();
  }
}

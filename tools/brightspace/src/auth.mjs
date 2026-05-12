// Playwright auth helpers: open an authenticated context using a saved
// storageState, or run an interactive SSO login that writes one.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const HOME_PATH_FRAGMENT = '/d2l/home';

export async function launchAuthenticatedContext(config) {
  if (!existsSync(config.storageStatePath)) {
    throw new Error(
      `No saved login at ${config.storageStatePath}. ` +
        `Run "brightspace login" first.`
    );
  }
  const browser = await chromium.launch({ headless: !config.headed });
  const context = await browser.newContext({
    storageState: config.storageStatePath,
  });
  return { browser, context };
}

// Interactive login. Opens a headed browser at the Brightspace home,
// waits for the user to land on the post-login home page (D2L_HOME_FRAGMENT),
// then persists storageState to disk.
export async function interactiveLogin(config, { timeoutMs = 5 * 60 * 1000 } = {}) {
  mkdirSync(dirname(config.storageStatePath), { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const start = `${config.brightspace.baseUrl}${HOME_PATH_FRAGMENT}`;
  console.log(`Opening ${start}`);
  console.log('Complete NYU SSO + MFA in the browser window.');
  console.log('When you reach the Brightspace home page, the login will be saved automatically.');
  await page.goto(start, { waitUntil: 'domcontentloaded' });

  // Wait until URL contains the post-login home fragment. Manual SSO may
  // redirect through shibboleth.nyu.edu and back; we just wait for the end.
  await page.waitForURL((url) => url.toString().includes(HOME_PATH_FRAGMENT), {
    timeout: timeoutMs,
  });

  // Give the page a moment to settle so cookies are fully set.
  await page.waitForLoadState('networkidle').catch(() => {});

  await context.storageState({ path: config.storageStatePath });
  console.log(`Saved login to ${config.storageStatePath}`);

  await browser.close();
}

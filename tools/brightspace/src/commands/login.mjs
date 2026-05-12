// `brightspace login` — interactive SSO login, persists storageState.

import { loadConfig } from '../config.mjs';
import { interactiveLogin } from '../auth.mjs';

export async function run(flags) {
  if (flags.help) {
    console.log(`brightspace login [--offering <path>]

Opens a Chromium window pointed at NYU Brightspace. Complete SSO + MFA
manually; once you reach the post-login home page, the session is saved to
tools/brightspace/.auth/storageState.json and re-used by other commands.`);
    return;
  }
  const config = loadConfig(flags);
  await interactiveLogin(config);
}

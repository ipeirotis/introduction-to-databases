#!/usr/bin/env node
// CLI entry for the brightspace tool. Dispatches to commands/<name>.mjs.
//
// Usage:
//   brightspace <command> [flags]
//
// Commands:
//   login                Interactive SSO login; saves storageState.
//   audit                Read-only audit of the configured Brightspace shell.
//   download             Download assignments/quizzes/announcements.

import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COMMANDS = new Set(['login', 'audit', 'download']);

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) {
        args.flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
          args.flags[a.slice(2)] = true;
        } else {
          args.flags[a.slice(2)] = next;
          i++;
        }
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function usage() {
  console.log(`brightspace <command> [flags]

Commands:
  login         Interactive SSO login; saves storageState.
  audit         Read-only audit of the configured Brightspace shell.
  download      Download assignments/quizzes/announcements.

Common flags:
  --offering <path>   Path to offering dir (default: offerings/2026-spring)
  --headed            Show the browser window.
  --course-id <id>    Override brightspace.course_id from offering.yaml.
  --base-url <url>    Override brightspace.base_url from offering.yaml.

Run "brightspace <command> --help" for command-specific flags.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (!cmd || args.flags.help && !cmd) {
    usage();
    process.exit(cmd ? 0 : 1);
  }
  if (!COMMANDS.has(cmd)) {
    console.error(`Unknown command: ${cmd}\n`);
    usage();
    process.exit(1);
  }

  const modPath = resolve(__dirname, '..', 'src', 'commands', `${cmd}.mjs`);
  const mod = await import(pathToFileURL(modPath).href);
  await mod.run(args.flags);
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});

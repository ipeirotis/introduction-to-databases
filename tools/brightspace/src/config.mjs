// Resolves the effective brightspace configuration for a command.
// Precedence: CLI flags > .env > offering.yaml.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const DEFAULT_OFFERING = 'offerings/2026-spring';

export function loadConfig(flags = {}) {
  const offeringRel = flags.offering || DEFAULT_OFFERING;
  const offeringDir = resolve(REPO_ROOT, offeringRel);
  const yamlPath = resolve(offeringDir, 'offering.yaml');

  let offering = {};
  if (existsSync(yamlPath)) {
    offering = parseYaml(readFileSync(yamlPath, 'utf8')) || {};
  } else {
    throw new Error(`Offering file not found: ${yamlPath}`);
  }

  const baseUrl =
    flags['base-url'] ||
    process.env.BRIGHTSPACE_BASE_URL ||
    offering?.brightspace?.base_url ||
    'https://brightspace.nyu.edu';

  const courseId =
    flags['course-id'] ||
    process.env.BRIGHTSPACE_COURSE_ID ||
    offering?.brightspace?.course_id ||
    null;

  return {
    repoRoot: REPO_ROOT,
    offeringDir,
    offeringRel,
    offering,
    brightspace: {
      baseUrl: String(baseUrl).replace(/\/+$/, ''),
      courseId: courseId ? String(courseId) : null,
      label: offering?.brightspace?.label || offeringRel,
    },
    storageStatePath: resolve(__dirname, '..', '.auth', 'storageState.json'),
    headed: Boolean(flags.headed),
  };
}

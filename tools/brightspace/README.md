# brightspace — read-only Brightspace tooling

A small Playwright-based CLI for **read-only** inspection of NYU Brightspace
course shells for *Databases for Business Analytics*. It can:

- Sign in via NYU SSO and persist the session (so you only do MFA once per
  expiration window).
- **Audit** a course shell: list assignments, quizzes, content modules, and
  announcements; compare them against the repo for consistency.
- **Download** assignments, quizzes, and announcements that exist on
  Brightspace but are not in git.

The tool **never writes to Brightspace.** Updating deadlines, hiding items,
or pushing content from the repo is intentionally out of scope. See
`CLAUDE.md` for the policy.

## Install

Requires Node.js ≥ 20.

```bash
cd tools/brightspace
npm install
npx playwright install chromium
```

## Configure

Point the tool at an offering by passing `--offering` (path relative to the
repo root, default `offerings/2026-spring`). The offering's
`brightspace.course_id` and `brightspace.base_url` are read from
`offering.yaml`.

Optional `.env` overrides (copy from `.env.example`):

```
BRIGHTSPACE_BASE_URL=https://brightspace.nyu.edu
BRIGHTSPACE_COURSE_ID=123456
```

CLI flags take precedence over env, which takes precedence over
`offering.yaml`.

## First-time login

Authenticated state is stored in `tools/brightspace/.auth/storageState.json`,
which is gitignored. Initial login is interactive (headed browser, you do
NYU SSO + MFA yourself):

```bash
npm run brightspace -- login
```

After that, subsequent commands run headlessly until the session expires;
re-run `login` when they start failing.

## Commands

```bash
# Audit Brightspace state against the repo (read-only, prints a report).
npm run brightspace -- audit --offering offerings/2026-spring

# Download assignments, quizzes, announcements not present in the repo.
npm run brightspace -- download \
    --offering offerings/2026-spring \
    --kinds assignments,quizzes,announcements \
    --out offerings/2026-spring/_downloaded
```

Add `--headed` to any command to watch the browser.

## What "audit" reports

For the configured offering, the audit walks the course shell and emits:

- **Assignments:** title, due date, points, visibility, submission count
  available.
- **Quizzes:** title, due date, attempts allowed, visibility.
- **Content modules / topics:** title, file type, hidden/visible.
- **Announcements:** title, posted date, body length.

It then diffs that listing against the repo (module READMEs, schedule.md,
offerings/<term>/announcements/) and reports drift:

- *Brightspace has X that repo doesn't.* (Candidate for `download`.)
- *Repo claims X with date D, Brightspace has date D'.* (Schedule drift.)
- *Repo references module N, Brightspace has no matching content module.*

## Layout

```
tools/brightspace/
  package.json
  .env.example
  .gitignore                 Ignores .auth/ and downloaded artifacts.
  bin/brightspace.mjs        CLI entry (login | audit | download).
  src/
    config.mjs               Loads offering.yaml + env + flags.
    auth.mjs                 Playwright login + storageState helpers.
    commands/
      login.mjs              Interactive SSO login, saves storageState.
      audit.mjs              Read-only audit (stubbed; see TASKS.md).
      download.mjs           Read-only download (stubbed; see TASKS.md).
  .auth/                     Gitignored. Holds storageState.json.
```

## Adding write capabilities

Don't, without explicit instructor sign-off. If asked: gate every write
behind `--apply` and default to `--dry-run` that prints the diff but does
nothing. Write operations should live in their own command file, not
retrofitted into `audit` or `download`.

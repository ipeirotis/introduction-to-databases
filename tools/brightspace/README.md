# brightspace — read-only Brightspace tooling

A small CLI for **read-only** inspection of NYU Brightspace course shells for
*Databases for Business Analytics*. It can:

- Sign in via NYU SSO and persist the session (so you only do MFA once per
  expiration window). This is the only step that uses a browser (Playwright).
- List your **courses** to find a course id.
- **Audit** a course shell: list assignments, quizzes, content modules, and
  announcements.
- **Download** assignments, quizzes, and announcements (planned).

Reads go through the official **D2L (Valence) JSON API** using the cookies from
your saved login — no scraping, no browser. The tool **never writes to
Brightspace.** Updating deadlines, hiding items, or pushing content from the
repo is intentionally out of scope. See `CLAUDE.md` for the policy.

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

> **Run `login` on your own machine.** It opens a visible browser and waits
> for you to complete NYU SSO + MFA by hand, so it can't be done in a
> headless/CI/cloud session. Once `storageState.json` exists locally the
> read-only commands work headlessly. Confirm the session any time with:
>
> ```bash
> npm run brightspace -- whoami
> ```

## Commands

```bash
# Verify the saved session is still valid (connection check).
npm run brightspace -- whoami

# List your course shells to find the course_id (optionally filter).
npm run brightspace -- courses --filter databases

# List what's posted on Brightspace (read-only, prints a JSON report).
npm run brightspace -- audit --offering offerings/2026-spring

# Limit to some sections.
npm run brightspace -- audit --sections assignments,quizzes

# Export the course content into the repo (Markdown + native files).
npm run brightspace -- download
npm run brightspace -- download --kinds assignments,content --out some/dir
```

Typical first run: `login`, then `courses` to find your id, set
`brightspace.course_id` in the offering's `offering.yaml`, then `whoami` and
`audit`. Use `--course-id <id>` to point any command at a shell without editing
`offering.yaml`.

> **Status.** `login`, `whoami`, `courses`, `audit`, and `download` are
> implemented and read the live D2L JSON API. `audit` does not yet diff its
> listing against the repo — see `TASKS.md`.

> **Before committing a `download`:** if the repo is public, review the export
> first. Quiz questions are live assessment material, and content files can be
> large binaries (PDFs, images) — `CLAUDE.md` says to ask before committing
> those. Consider `.gitignore`-ing `quizzes/` and/or `content/files/`.

## What "audit" reports

For the configured course, `audit` emits a JSON report with:

- **Assignments:** id, title, due date, hidden flag, submission counts.
- **Quizzes:** id, title, start/due/end dates, active flag, attempts allowed.
- **Content modules / topics:** nested module tree with topic titles, type,
  and hidden flag; plus module/topic counts.
- **Announcements:** id, title, posted date, hidden/published flags.

Diffing this listing against the repo (module READMEs, schedule,
`offerings/<term>/announcements/`) is planned but not yet implemented.

## What "download" writes

`download` exports the course into `<offering>/brightspace/` (override with
`--out`):

```
brightspace/
  README.md          Human-readable index.
  manifest.json      Machine-readable index (ids, titles, dates, file paths).
  assignments/<id>-<slug>.md
  quizzes/<id>-<slug>.md          Properties + questions.
  announcements/<date>-<slug>.md
  content/
    toc.md           Module/topic tree with links.
    links.md         External (Link-type) topics.
    files/           Native content files (HTML, PDF, images, ...).
```

HTML (instructions, announcement bodies, questions) is converted to Markdown
with Turndown; content files are saved in their original format.

## Layout

```
tools/brightspace/
  package.json
  .env.example
  .gitignore                 Ignores .auth/ and downloaded artifacts.
  bin/brightspace.mjs        CLI entry (login | whoami | courses | audit | download).
  src/
    config.mjs               Loads offering.yaml + env + flags.
    auth.mjs                 Playwright login + storageState helpers.
    api.mjs                  D2L JSON API client (cookie auth from storageState).
    commands/
      login.mjs              Interactive SSO login, saves storageState.
      whoami.mjs             Connection check against the saved session.
      courses.mjs            List enrolled course shells (find a course_id).
      audit.mjs              Read-only audit via the D2L API.
      download.mjs           Export course content to Markdown + native files.
  .auth/                     Gitignored. Holds storageState.json.
```

## Adding write capabilities

Don't, without explicit instructor sign-off. If asked: gate every write
behind `--apply` and default to `--dry-run` that prints the diff but does
nothing. Write operations should live in their own command file, not
retrofitted into `audit` or `download`.

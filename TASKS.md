# TASKS

Course backlog for **Databases for Business Analytics**. Replaces the older
`TODO.md`. See `CLAUDE.md` for content conventions.

Use checkboxes (`- [ ]` / `- [x]`) and check items off in the same commit as
the change.

## Planned modules

Topics that don't yet have a module:

- [ ] Temporal data — dates, times, time zones, intervals. Reference:
      <https://www.stratascratch.com/guides/sql-time-and-date-skills>
- [ ] Geospatial data — points, distances, `ST_*` functions in BigQuery.
- [ ] String functions — `REGEXP_*`, `SPLIT`, `CONCAT`, `LOWER`/`UPPER`,
      common cleaning patterns.
- [ ] `UNION` / `UNION ALL` / `INTERSECT` / `EXCEPT`.
- [ ] `ANY` / `ALL` quantifiers.
- [ ] `ROLLUP`, `CUBE`, `GROUPING SETS`.
- [ ] `EXISTS` / `NOT EXISTS` (currently only covered indirectly via `IN`).
- [ ] `COALESCE`, `IFNULL`, and NULL-handling patterns.

## Per-module follow-ups

### Module 1 — ER & Relational Model

- [ ] Add a worked example translating the `cellular_operator` ER diagram
      step-by-step into `CREATE TABLE` statements.

### Module 2 — Selection & Filtering

- [ ] Split out separate slide decks for NULL functions, date functions, and
      string functions (currently bundled).
- [ ] Record videos for `CASE WHEN`, NULL functions, and date functions.

### Module 3 — JOINs

- [ ] Add a visual (Venn / matching-rows) for semi-join vs anti-join.

### Module 4 — Aggregates

- [ ] Cover string aggregation: add an example using `STRING_AGG`
      (a.k.a. `GROUP_CONCAT`) — e.g. genres per movie.
- [ ] Introduce string functions in the context of cleaning groupable keys.

### Module 5 — Subqueries

- [ ] Fix README link in root `README.md` — Module 5 currently points to
      `module4/` instead of `module5/`.
- [ ] Add a CTE-vs-temp-table-vs-view comparison table.

### Module 6 — Window Functions

- [ ] Add a rolling-average example with an explicit frame
      (`ROWS BETWEEN ... PRECEDING AND CURRENT ROW`).

## Tooling

- [x] `tools/brightspace/`: read via the D2L (Valence) JSON API instead of
      scraping — `whoami`, `courses` (enrollment listing), and `audit`
      (assignments, quizzes, content TOC, announcements). Validated live.
- [x] `tools/brightspace/`: set `brightspace.course_id` in the active
      offering's `offering.yaml` (578630 — TechMBA, May 2026).
- [ ] `tools/brightspace/`: have `audit` diff its listing against the repo
      (module READMEs, schedule, `offerings/<term>/announcements/`).
- [x] `tools/brightspace/`: implement `download` — exports assignments, quizzes
      (with questions), content (files + links), and announcements to Markdown +
      native files under `<offering>/brightspace/`.
- [x] `tools/brightspace/`: implement `question-bank` — aggregates quizzes and
      assignments across all matching course shells, dedupes questions across
      semesters, and groups them by topic (`question-bank/`).
- [ ] `tools/brightspace/`: add a CI-friendly mode that fails when an
      offering's Brightspace state drifts from the repo's expected state.
- [ ] `tools/brightspace/`: `download` should fetch (or explicitly report)
      assignment and announcement **attachments**, not just `CustomInstructions`
      / body text — D2L exposes folder `Attachments` and news attachments with
      download routes. (Codex review; no impact on 578630, which has none.)
- [ ] `tools/brightspace/`: `download`/`audit` capture only a subset of D2L
      metadata. Also surface, where present: quiz time limits and special-access
      restrictions (`SubmissionTimeLimit`, `AllowOnlyUsersWithSpecialAccess`),
      assignment availability windows (`Availability` start/end, special access),
      content-module hidden/date-restriction flags, announcement `IsPublished`,
      quiz access controls as presence flags (`Password` set, `RestrictIPAddressRange`
      — never the raw password), and assignment/announcement **attachments**
      (download or list them). (Codex review; none apply to 578630 today.)
- [x] `tools/brightspace/`: qualify root-relative D2L links (`/d2l/...`) inside
      RichText (assignment/quiz/announcement bodies), not just content links;
      auto-redact live group-chat invite links from the public export (so a
      regeneration can't re-expose the WhatsApp invite); write each export kind
      atomically (stash + restore on failure) so a transient API error can't
      replace a complete export with a partial one. Regenerated the 578630
      export with these fixes. (Codex review.)
- [x] `offerings/2026-summer/`: corrected `course.code` to `TECH-GB.2147` to
      match the `SU26_TECH-GB_2147` shell (was `TECH-GB.2336`). (Codex review.)
- [x] `question-bank`: scrub the shared practice-DB password from the public
      bank — the setup-assignment connection details (`student@db.ipeirotis.org`
      / `dwdstudent20xx`) leaked into `bank.json` / `by-topic.md` / `bank.csv`
      via the rendered assignment bodies. Redacted them and added `redactSecrets`
      to both `question-bank` and `download` so regenerations stay clean.
      (Codex review, P1.)
- [ ] **Instructor decision:** the same shared password also appears, by design,
      in the course notebooks (`module2/3/4`, `unsorted/`) as the student DB
      connection instructions. If it should be private, rotate it and read it
      from a parameter/secret instead of hardcoding; otherwise it's an
      intentionally-public read-only teaching credential and can stay.
- [x] `tools/brightspace/`: `download` seeds `manifest.kinds` from the prior
      manifest so a `--kinds` subset refresh doesn't drop the untouched kinds
      from the index. Regenerated the 578630 manifest (it had been left
      announcements-only by a `--kinds announcements` test run). (Codex review.)
- [x] `tools/brightspace/`: honor `--insecure` in `brightspace login` too (both
      browser contexts set `ignoreHTTPSErrors`). (Codex review.)
- [x] `tools/brightspace/`: harden the atomic export and error handling (Codex
      review, follow-ups on my own changes): a content-file download failure now
      throws so the atomic wrapper actually rolls back (was only setting an exit
      code, which still committed a partial export); rollback also removes kind
      directories the run newly created; manifest seeding only reuses prior kinds
      when the prior manifest's course id matches (no mixing two shells);
      `getJson` treats 403 as a normal permission error, not an expired session;
      and `audit` reports `unlimited` quiz attempts like `download` does.
- [x] `tools/brightspace/`: pin API calls to D2L's advertised `LatestVersion`
      and ignore non-numeric contracts like `unstable` when inferring the
      version (`api.mjs`); record `Unlimited` quiz attempts instead of dropping
      the line (`download.mjs`); render assignment bodies (not just titles) in
      `by-topic.md` so it works as an assignment bank. (Codex review.)
- [ ] `tools/brightspace/`: `question-bank` dedup keys only on `QuestionText`;
      for MC / multi-select / fill-in / short-answer, fold the relevant
      `QuestionInfo` (choices / accepted answers) into the rendered text and the
      dedup key so same-stem-different-options questions don't collapse.
      (Codex review.)
- [x] `question-bank`: scrub embedded answer keys (expected-result tables) from
      the public bank — `scrubAnswerKey` in `question-bank.mjs` strips them on
      generation, and the two committed leaks (the Music "most popular entries"
      and the Facebook "average hobbies by Sex" final-exam prompts) are cleaned.
      Row-count hints are left intact. (Codex review.)
- [x] `question-bank`: **regenerate the committed bank** — re-ran `question-bank`
      against a fresh Brightspace session, so the checked-in `bank.json` /
      `by-topic.md` / `bank.csv` now carry the corrected type labels (Long
      Answer 183 / True-False 20, not `Matching`), the `scrubAnswerKey` step, and
      rendered assignment bodies. (Codex review.)
- [x] `question-bank`: split public/private — questions stay here
      (`question-bank/`), while solution SQL, validated row counts, and
      `FLAGGED.md` live only in the private companion repo
      `ipeirotis/introduction-to-databases-private` (see `CLAUDE.md`).
- [x] `question-bank`: scope the student-facing flights prompts to a single
      quarter (`Year = 2025`, `Quarter = 2`). Applied to the 17 single-snapshot
      flights questions in `bank.json` / `by-topic.md` / `bank.csv`; left the
      time-series question (per year-quarter) and the ones already scoped to a
      year (2024) untouched.
- [x] `question-bank`: reconcile the flights **answer side** in the private repo
      to match the quarter-scoped prompts — scoped every single-snapshot flights
      solution to `Year = 2025, Quarter = 2`, re-validated the counts against
      live BigQuery, updated the public hints (189→637, 191→53, 95→14), and
      flipped 95/189/191 from flagged to confirmed.
- [ ] `question-bank`: flights q190 (route stats with `>10,000` passengers) still
      returns 2336 rows even scoped to one quarter (vs the old 147 hint) — the
      passenger threshold no longer fits the current data volume. Raise the
      threshold or otherwise rework the question. (Instructor decision.)
- [x] `offerings/`: the configured Brightspace shell is the **SU26 / TechMBA
      May 2026** course; the offering was mislabelled `2026-spring` with Jan–May
      dates. Renamed it to `offerings/2026-summer`, set `season: summer`, and
      fixed the dates to the shell's span (classes 2026-05-14 → 06-08, final
      exam 2026-06-08). Updated the default-offering path in `config.mjs`,
      `bin/brightspace.mjs`, and the README. (Codex review; instructor confirmed
      it's a summer course.)

## Practice resources to recommend to students

(Not blocking; informational.)

- Read *Learning MySQL*, chapter 7.
- W3Schools SQL tutorial.
- Codecademy "Learn SQL".
- Khan Academy SQL course.

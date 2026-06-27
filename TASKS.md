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
      content-module hidden/date-restriction flags, and announcement
      `IsPublished`. (Codex review; none apply to 578630 today.)
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
- [x] `question-bank`: split public/private — questions stay here
      (`question-bank/`), while solution SQL, validated row counts, and
      `FLAGGED.md` live only in the private companion repo
      `ipeirotis/introduction-to-databases-private` (see `CLAUDE.md`).
- [x] `question-bank`: scope the student-facing flights prompts to a single
      quarter (`Year = 2025`, `Quarter = 2`). Applied to the 17 single-snapshot
      flights questions in `bank.json` / `by-topic.md` / `bank.csv`; left the
      time-series question (per year-quarter) and the ones already scoped to a
      year (2024) untouched.
- [ ] `question-bank`: reconcile the flights **answer side** in the private repo
      to match the now-quarter-scoped prompts — add `WHERE Year = 2025 AND
      Quarter = 2` to each flights solution, re-validate row counts against live
      BigQuery, set the hints, and flip 189–191 from flagged to confirmed.
      `m_ticket_prices` now spans 100+ quarters, so all-time aggregates overcount
      (the old single-quarter hints — 597 / 147 / 52 — predate that). Needs the
      BigQuery credential restored.
- [ ] `offerings/2026-spring/`: the configured Brightspace shell is the **SU26 /
      TechMBA May 2026** course, but this offering is labelled `spring` with
      Jan–May dates. Decide: rename/move to a summer offering, or relabel the
      metadata. (Codex review + flagged earlier — instructor decision.)

## Practice resources to recommend to students

(Not blocking; informational.)

- Read *Learning MySQL*, chapter 7.
- W3Schools SQL tutorial.
- Codecademy "Learn SQL".
- Khan Academy SQL course.

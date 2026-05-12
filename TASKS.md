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

- [ ] `tools/brightspace/`: implement `audit` command to list Brightspace
      content and diff against the repo.
- [ ] `tools/brightspace/`: implement `download` command for assignments,
      quizzes, and announcements.
- [ ] `tools/brightspace/`: add a CI-friendly mode that fails when an
      offering's Brightspace state drifts from the repo's expected state.

## Practice resources to recommend to students

(Not blocking; informational.)

- Read *Learning MySQL*, chapter 7.
- W3Schools SQL tutorial.
- Codecademy "Learn SQL".
- Khan Academy SQL course.

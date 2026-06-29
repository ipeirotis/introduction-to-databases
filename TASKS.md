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
- [x] `question-bank`: broaden the answer-key scrubber to catch inline answer
      examples (e.g. `the results start with "Name, 1234", …`) and the
      "start with" phrasing — a fresh leak in two IMDb final-exam prompts. And
      make the flights single-quarter scoping + validated hints **durable**:
      they're now a committed overlay (`flights-snapshot-overlay.json`) applied
      during generation, so `question-bank --filter databases` reproduces them
      instead of reverting to raw Brightspace text. Also dedupe `--kinds` in
      `download` so a repeated kind can't defeat the atomic rollback. (Codex.)
- [x] `question-bank`: exclude onboarding/setup assignments from the bank
      (title `/setup/i` or text referencing the DB host) — they carry the
      `student@db.ipeirotis.org` connection block, not practice material, and
      tripped GitGuardian's MySQL-credentials detector even with the password
      redacted. Bank now has 35 unique assignments (was 52). (GitGuardian.)
- [x] `tools/brightspace/`: scope the inline answer-value redaction to the hint
      context so quoted input literals (`"Alice, 100"`) survive; drop
      zero-contribution shells from the advertised coverage (the bank no longer
      claims a term an empty future shell added nothing to — now 23 shells,
      ~2021–Summer 2026); reject login-page bounces in `topicFile` so an expired
      session can't save login HTML as a content file; dedupe `--course-ids`.
      (Codex review.)
- [x] `tools/brightspace/`: `--course-ids` fetches the named shells directly and
      no longer aborts when `MyEnrollments` is restricted/failing (enrollments is
      now an optional name/code lookup on that path). (Codex review.)
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
- [x] `tools/brightspace/`: apply the `session<N>/` → `module<N>/` link rewrite in
      the **export** path too, not just `question-bank`. A regenerated quiz
      (`499807-module-2-practice-filtering-queries.md`) shipped a `session3/…` link
      that 404s. Extracted `buildRepoFileIndex` + `fixTemplateLinks` into a shared
      `src/repo-links.mjs` used by both `question-bank` and `download` (applied in
      `richToMd`); regenerated the export — 0 surviving `session*/` links. (Codex.)
- [x] `tools/brightspace/`: include assignment hidden state in the manifest. The
      Markdown recorded `Hidden` but the manifest item dropped `f.IsHidden`; each
      assignment item now carries `hidden`, matching the quiz `active` flag, so a
      manifest-only consumer can tell hidden/private folders from available work.
      (Codex review, P2.)
- [x] `.claude/skills/cloud-bootstrap/`: two more correctness fixes in the portable
      skill docs. `references/azure.md` read the subscription from top-level
      `.project_id`, so in a multi-provider repo `SUBSCRIPTION_ID` became `null` and
      `az role assignment` targeted `/subscriptions/null`; switched both occurrences
      to the provider-aware `jq` lookup `gcp.md` already uses. `workflows/add-team-member.md`
      Step 3.1 said "create a key for the existing service account (do NOT create a
      new identity)", which contradicts AWS's model (a separate IAM user per member
      in the shared `claude-agents` group, since an IAM user allows only 2 keys);
      split the step per provider so AWS creates the per-user IAM user while GCP/Azure
      add a key to the existing identity. (Codex review, P2.)
- [ ] `tools/brightspace/`: `download` still exports only `CustomInstructions`, not
      Dropbox-folder **attachments** (`Attachments`/`LinkAttachments`). Re-raised by
      Codex; confirmed **no impact on 578630** (both its assignments have
      `Attachments=0`, `Links=0`). Tracked above under the metadata/attachments TODO;
      implement when a shell with attachments is in scope.
- [x] `offerings/2026-summer/schedule.md`: convert the published deadlines from
      raw UTC to the course timezone. Brightspace stores each deadline at 11:59 PM
      Eastern, which is the next calendar day in UTC (`2026-05-19T03:59:59Z` =
      11:59 PM ET on **May 18**), so every date in the table was a day late.
      Re-derived all rows in `America/New_York` (verified with `Intl`), labelled
      the column "Due (11:59 PM ET)", added a timezone note, and reconciled the
      stale A6 (Jan 20 ET) and the final-exam/calendar (June 7 quiz close vs.
      June 8 last class) notes. (Codex review, P2.)
- [x] `question-bank`: fix dead template links in the public bank. Old assignment/
      question bodies link to notebooks/practice files under the repo's former
      `session<N>/` layout (now `module<N>/`), which 404 on a fresh checkout. Added
      `fixTemplateLinks` + a repo file index: each `session<N>/…` link is rewritten
      to the file's current location if the basename resolves uniquely (preserving
      any `#fragment`), else de-linked with a "template moved" note. Join →
      `module3/`, aggregate → `module4/`, filtering practice → `module2/…#facebook-database`;
      the 3 templates with no current file (selection/filtering/combined) are
      de-linked. Bank regenerated: 0 surviving `session*/` links. (Codex review, P2.)
- [x] `question-bank`: normalize Turndown escaping before deduping. Escaping varies
      between shells (`\[[available]\] .` vs `[available]`), so `normKey` keyed the
      same assignment as distinct and inflated `uniqueAssignments`. `normKey` now
      unescapes backslash-escapes, collapses `[text](url)`→`text`, and drops space
      before punctuation. Merged 6 same-title escaping-only duplicates (35→29
      unique assignments); unique questions unchanged at 203 (no question pair was
      affected), and every new title was already present in the old bank (no
      over-merge). (Codex review, P2.)
- [x] `tools/brightspace/`: include quiz availability fields in the manifest. The
      Markdown captured `Active` but `manifest.json` dropped it, so a manifest-only
      consumer couldn't tell an inactive/unpublished quiz from a live one (the
      export's `Assignment 6: Window queries` is `Active: false`). Each quiz item
      now carries `startDate`, `dueDate`, `endDate`, and `active`; export
      regenerated (A6 correctly flagged `active: false`). (Codex review, P2.)
- [x] `tools/brightspace/`: `audit` rejects unknown `--sections` (like `download`
      does for `--kinds`) and exits non-zero, instead of warning and exiting 0 with
      an empty report — so a CI/audit wrapper can't appear to have checked
      Brightspace while a typo'd section checked nothing. (Codex review, P2.)
- [x] `question-bank`: parse `--all` with the shared `flagBool` helper (now
      exported from `config.mjs`), so `--all=false` / `--all false` no longer reads
      as truthy and silently aggregates every enrolled shell. (Codex review, P2.)
- [x] `tools/brightspace/`: parse `--insecure` (and `--headed`) as real booleans.
      `--insecure=false` / `--insecure false` arrived as the string `"false"`,
      which `Boolean()` read as truthy — silently disabling TLS verification
      against the caller's explicit intent. Now only a bare flag or an affirmative
      (`true`/`1`/`yes`/`on`) enables it; `false`/`0`/`no`/`off`/typo stays off
      (the safe default). (Codex review, P2.)
- [x] `tools/brightspace/`: request `content/toc` with
      `ignoreModuleDateRestrictions=true` so a full instructor export can't
      silently drop modules/topics hidden by start/end date restrictions. Shared
      by `audit` and `download`. Verified the 578630 export is unchanged
      (still 30 modules / 36 topics), so this is future-proofing, not a fix to a
      live leak. (Codex review, P2.)
- [x] `.claude/skills/cloud-bootstrap/`: fix two security/safety issues in the
      committed skill docs. `references/gcp.md` recommended `roles/bigquery.dataEditor`
      (write access) for *querying* — split it into a read row (`dataViewer` +
      `jobUser`, the least-privilege default this repo actually uses) and a
      read+write row. `workflows/first-time-setup.md` Step 5 told the agent to
      grant IAM roles, which read as a contradiction of SKILL.md's "never modify
      IAM yourself" rule — named it as the one-time bootstrap exception (runs
      against the user's own privileged token, not the service account), added a
      user-run alternative, and scoped the rule in SKILL.md to steady-state.
      (Codex review.)
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

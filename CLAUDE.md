# CLAUDE.md — Databases for Business Analytics

Instructions for Claude (and other AI assistants) when generating or editing
content in this repository. The repo backs the **Databases for Business
Analytics** course at NYU Stern.

## Course identity

- **Audience.** Business-analytics students. Most have light-to-no programming
  background. Many are non-CS majors using SQL for analysis, not for building
  applications.
- **Goal.** Practical SQL for analytics on real data. Reading, writing, and
  reasoning about queries — not database administration.
- **Out of scope.** Indexing, transactions, locking, stored procedures,
  triggers, normalization theory beyond what's needed to read schemas,
  performance tuning, NoSQL.
- **Platform.** Google BigQuery, accessed from Google Colab notebooks.
- **Datasets.** `nyu-datasets.imdb` and `nyu-datasets.facebook` are the
  canonical examples. Use these unless a module explicitly introduces a new
  one (e.g. `cellular_operator` for ER modeling).

## Repository layout

```
module1/ ... module6/   Course content, one folder per module.
schemas/                ER diagrams and schema docs for example datasets.
offerings/<term>/       Per-offering syllabus, deadlines, Brightspace metadata.
tools/brightspace/      Playwright tooling for read-only Brightspace audits.
unsorted/               Material not yet placed in a module. Triage, don't extend.
TASKS.md                Backlog and per-module TODOs (replaces old TODO.md).
README.md               Public-facing course overview.
```

Each module folder contains:

- `README.md` — module overview, learning objectives, links to slides/videos.
- One or more `.ipynb` notebooks named `A-…`, `B-…` in the order students
  should work through them.
- `practice_questions*.md` — exercises, plus a separate solutions file when
  solutions exist.

## Content conventions

**Notebooks.**
- Each notebook starts with a markdown cell stating the learning objective in
  one or two sentences.
- Query cells must run unmodified against `nyu-datasets.imdb` or
  `nyu-datasets.facebook`. Don't introduce new datasets in a notebook without
  also adding the schema under `schemas/`.
- Prefer one concept per cell. Build complex queries up across cells with
  short markdown commentary in between.
- Output examples should be small (LIMIT 10 by default) so the rendered
  notebook stays readable on GitHub.

**SQL style.**
- Uppercase keywords (`SELECT`, `FROM`, `WHERE`, `GROUP BY`, `JOIN`).
- One clause per line; indent continuations.
- Fully-qualified table names in the first introduction of a table
  (`` `nyu-datasets.imdb.title_basics` ``), then alias.
- Aliases: short, lowercase, mnemonic (`t` for titles, `r` for ratings).
- Prefer explicit `JOIN ... ON` over comma joins.
- Window functions: spell out the `OVER (PARTITION BY ... ORDER BY ...)`
  clause on its own line.

**Markdown / READMEs.**
- Module READMEs link to: slides (if any), YouTube video(s), notebooks in
  reading order, practice questions, and a short "What's next" pointer to the
  next module.
- Don't inline long SQL into module READMEs — link to the notebook instead.

**Slides.**
- Source-of-truth for slides lives outside git (PowerPoint). Committed
  artifacts are PDF exports under the relevant module or `schemas/`.
- Don't commit `.pptx` unless explicitly asked; they're large and not
  diffable.

## Style for explanations

- Optimize for a student reading on a phone the night before class.
- Lead with the concept, then the syntax, then a worked example on
  `imdb`/`facebook`.
- Show the wrong-but-plausible version before the correct one when a common
  mistake is instructive (e.g. `WHERE` vs `HAVING`, aggregates without
  `GROUP BY`).
- Avoid CS jargon (relational algebra terms, normal forms) unless the module
  is specifically about it.

## Per-offering content

Material that changes from semester to semester — syllabus dates, section
numbers, exam dates, Brightspace course IDs — lives under
`offerings/<term>/`, **not** in the module folders. Module content is the
stable, reusable layer. See `offerings/README.md` for the layout.

When asked to "update the syllabus" or "change the deadline," edit the
relevant `offerings/<term>/` file, not the root README or module READMEs.

## Tasks and backlog

The course backlog lives in `TASKS.md` at the repo root (it replaces the
older `TODO.md`). When you finish a task listed there, check it off in the
same commit as the change. When you discover follow-up work, add it under
the appropriate module section in `TASKS.md`.

## Brightspace tooling

`tools/brightspace/` contains a Playwright-based tool for **read-only**
inspection of NYU Brightspace course shells:

- Listing and downloading assignments, quizzes, and announcements that exist
  on Brightspace but are not in git.
- Diffing Brightspace state against the repo for consistency checks across
  offerings.

The tool is read-only by design. Do not add write operations (updating
deadlines, hiding items, pushing content) without an explicit request from
the instructor. If asked to add them, gate everything behind `--dry-run` by
default and require an explicit `--apply` flag.

See `tools/brightspace/README.md` for usage.

## Things to ask before doing

- Adding a new module or renumbering existing ones.
- Switching the example dataset for an existing module.
- Committing large binary files (slides, videos, datasets).
- Adding any Brightspace write capability.
- Touching `offerings/<term>/` for a term that is currently running — those
  changes are visible to students.

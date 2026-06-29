# Databases — Question Bank

Cross-semester bank of quiz questions and assignments, aggregated from 24 Brightspace shells (~2021 – Fall 2026) with `brightspace question-bank`.

- **`by-topic.md`** — every unique question and assignment, grouped by topic, with the semesters each appears in.
- **`bank.csv`** — flat table for spreadsheets (sort/filter by topic, term, frequency).
- **`bank.json`** — structured data for further tooling.
- **`courses.md`** — the source shells and per-course counts.

Stats: 203 unique questions (from 2774 occurrences across semesters), 35 unique assignments.

## Answers

This is a public repo, so it carries the **questions only**. Solution SQL, BigQuery-validated row counts, and the needs-review list live in the private companion repo — **<https://github.com/ipeirotis/introduction-to-databases-private>** — under `question-bank/solutions/`, `question-bank/bank-validated.json`, and `question-bank/FLAGGED.md`.

Regenerate: `npm run brightspace -- question-bank --filter databases` (from `tools/brightspace`).

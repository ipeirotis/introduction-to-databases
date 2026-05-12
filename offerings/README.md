# Course offerings

Each subdirectory is one offering of *Databases for Business Analytics* (one
semester, one section). Module content stays in the top-level `module*/`
folders — only **per-offering** material lives here.

## Layout

```
offerings/
  README.md              You are here.
  <term>/                e.g. 2026-spring, 2026-fall, 2027-spring-sectionA
    offering.yaml        Machine-readable metadata (term, section,
                         Brightspace course ID, important dates).
    syllabus.md          Human-readable syllabus for this offering.
    schedule.md          Week-by-week schedule with deadlines.
    announcements/       Markdown sources for Brightspace announcements.
```

## When to add a new offering

Copy the most recent offering directory, rename it to `<year>-<term>` (e.g.
`2026-fall`), then update:

1. `offering.yaml` — new term, dates, Brightspace course ID.
2. `schedule.md` — shift dates; revise the topic order if it changed.
3. `syllabus.md` — update grading, TA names, office hours.

Module content (`module1/`, ..., `module6/`) should **not** be duplicated.
If a module needs to differ between offerings, that's a signal the module
should be refactored, not forked.

## Brightspace linkage

The `brightspace.course_id` field in `offering.yaml` is what
`tools/brightspace/` uses to know which course shell to audit. See
`tools/brightspace/README.md`.

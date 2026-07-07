---
id: tactic-curriculum-chunk-metadata
kind: tactic
statement: "Draft: encode the remaining reading-program chunks (3, 4, 6, 7, 8,
  9) as per-chunk office-hours tactics and add machine-readable reading metadata
  to all chunk nodes"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy interview
  (retain-not-refine): chunks 1, 2, 5 already exist as born-parked office-hours
  tactic nodes (2026-07-06 /align-tactics round); the remaining six chunks of
  tactic-tradition-reading-program's list are still prose. /sync-reader also
  needs each chunk node to carry machine-readable reading references (source
  work, passage range, priority) rather than parsing body prose — this migration
  adds that convention to existing and new chunk nodes."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Draft: encode the remaining reading-program chunks (3, 4, 6, 7, 8, 9) as per-chunk office-hours tactics and add machine-readable reading metadata to all chunk nodes

Retained context from the 2026-07-06 /align-strategy interview. The author:
"Curriculum is expected to be encoded in the graph as office-hours tactics
(30 minute chunks)." Chunks 1, 2, 5 — the capture-doctrine path — already
exist per the 2026-07-06 /align-tactics round (`tactic-reading-chunk-1-plato-cave`,
`tactic-reading-chunk-2-aristotle-hexis`,
`tactic-reading-chunk-5-aristotle-phronesis`). Two pieces remain:

## 1. Author the remaining six chunk nodes

Chunks 3, 4, 6, 7, 8, 9 from `tactic-tradition-reading-program`'s body, each
per the established convention: `owner: human`,
`parent: tactic-tradition-reading-program`, `serves` + `validates`
`strategy-philosophical-grounding`, born-parked `office_hours` with the
reading-session reason, body carrying `## Text`, `## Questions to re-open
against the text`, and `## Completion` sections lifted from the program node's
chunk list and per-chunk question map.

## 2. Machine-readable reading metadata on every chunk node

`/sync-reader` (`tactic-sync-reader-skill`) needs structured references, not
body prose. Add to each chunk node (existing 1, 2, 5 included) something like:

```yaml
attributes:
  reading:
    priority: <position in the working order>
    passages:
      - work: <edition-independent work identifier, e.g. "Plato, Republic">
        range: <citation, e.g. "VII 514a-521b">
```

Exact shape is an `/align-tactics` decision; requirements it must meet:

- **priority** mirrors the curriculum working order (currently 1, 2, 5, 3, 4,
  6, 7, 8, 9) and is maintained by `strategy-recovery-critical-path`
  applications — the graph is the single home of the order, and the reader
  file-naming convention derives from it.
- **passages** identify the work and range well enough for excerpt extraction
  to locate the section in a share epub (or to say precisely what is missing
  in the author report).

`writeNode` preserves tactic bodies verbatim across frontmatter rewrites, so
adding metadata to the existing chunk nodes is frontmatter-only and safe.

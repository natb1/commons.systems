---
id: tactic-curriculum-chunk-metadata
kind: tactic
statement: "Draft: encode the remaining reading-program chunks (3, 4, 6, 7, 8,
  9) as per-chunk office-hours tactics and add machine-readable reading metadata
  to all chunk nodes"
owner: ai
status: codified
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
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode the remaining reading-program chunks as per-chunk office-hours tactics and add machine-readable reading metadata to all chunk nodes — DONE

Executed inline in the 2026-07-06 /align-tactics round (reader-sync scope) —
graph authoring is the decomposition session's native work, so this draft was
consumed by doing it rather than planning it:

- Chunks 3, 4, 6, 7, 8, 9 authored born-parked per the established
  convention: `tactic-reading-chunk-3-kant-humanity-servility`,
  `tactic-reading-chunk-4-sophrosyne-ordered-soul`,
  `tactic-reading-chunk-6-precision-externals`,
  `tactic-reading-chunk-7-liberality-schole`,
  `tactic-reading-chunk-8-stoicism-drills`,
  `tactic-reading-chunk-9-mill-justice`.
- `attributes.curriculum` (`{priority, passages: [{work, range}]}`) added to
  all nine chunk nodes — priorities 1–9 mirror the
  `strategy-recovery-critical-path` working order (1, 2, 5, 3, 4, 6, 7, 8, 9).
  The key is named `curriculum`, not `reading`, because `reading` is the
  top-level sensor-value field in the node schema
  (`packages/intentionsutil/src/schema.ts:116`) and reusing the name inside
  `attributes` would invite confusion.
- `tactic-tradition-reading-program` rewritten as the subtree index; the
  chunk nodes are the single home of Text/Questions/Completion content.

All landed in the same graph-commit as this phase flip.

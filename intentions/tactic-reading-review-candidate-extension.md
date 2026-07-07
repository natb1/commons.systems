---
id: tactic-reading-review-candidate-extension
kind: tactic
statement: "Draft: extend /reading-review for candidate chunks — the session
  resolves to a tradition record, grounding marks, or a dismissal clarification"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-07 /align-strategy interview
  (retain-not-refine): the office-hours curriculum session the requirement asked
  for already exists as tactic-reading-review-skill (phase: implement, serving
  strategy-philosophical-grounding), so this drafts its extension rather than a
  duplicate skill. Candidate chunks (attributes.curriculum.candidate: true) have
  different completion semantics from verify chunks: no tradition record exists
  yet, so the session creates one (adopted/diverged/declined), applies
  attributes.grounding marks to the chunk's target nodes, or records a dismissal
  clarification on strategy-complete-grounding. Should be planned only after
  tactic-reading-review-skill lands."
reading: null
gap: null
serves:
  - strategy-complete-grounding
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
# Draft: extend /reading-review for candidate chunks — the session resolves to a tradition record, grounding marks, or a dismissal clarification

Retained interview context for the /align-tactics round that plans this
(2026-07-07 /align-strategy, strategy-complete-grounding):

- The office-hours curriculum session the requirement asked for already
  exists as `tactic-reading-review-skill` (phase: implement, serving
  strategy-philosophical-grounding) — this extends it; do not author a
  second skill.
- **Verify chunks vs candidate chunks**: verify chunks (1–9) check an
  existing tradition record against its texts (amend-or-ratify, flip
  delegated → codified). Candidate chunks
  (`attributes.curriculum.candidate: true`, chunks 10+) have no record yet —
  the session's dialectic establishes relevance and author understanding,
  then resolves to exactly one of: (a) a new `tradition-*` record
  (adopted/diverged/declined entries with graph loci) written via
  write-node, (b) `attributes.grounding` / `attributes.traditions` marks on
  the chunk's target nodes, or (c) a dismissal clarification on
  `strategy-complete-grounding` (no record — dismissal is not declension).
- Either way: stamp `last_exercised` on
  `delegation-philosophical-articulation`, set the chunk `phase: done`, one
  `graph-commit` bundle.
- Plan this only after `tactic-reading-review-skill` lands — it edits that
  skill's file.

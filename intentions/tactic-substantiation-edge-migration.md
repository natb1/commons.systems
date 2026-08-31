---
id: tactic-substantiation-edge-migration
kind: tactic
statement: Migrate the graph to the symmetric substantiation edges —
  attributes.traditions → substantiated_by, contradicted_by edges added from
  rationale prose, validate-graph mirror enforcement, and the stamp vocabulary
  sweep (old state names → ratified/deferred/delegated)
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-30 resolution round, which ratified the
  symmetric locus doctrine (strategy-explicit-intent's superseded locus
  clarification): substantiation and contradiction are two typed edges on the
  substantiated node (attributes.substantiated_by / attributes.contradicted_by),
  each REQUIRED to be mirrored by a locus-naming entry on the tradition record
  (adopted ⇔ substantiated_by; diverged/chosen_over ⇔ contradicted_by); prose is
  optional narrative. Scope: (1) rename attributes.traditions → substantiated_by
  on every bearer (the two new virtues already migrated in the resolution-round
  commit; the legacy bearers — virtue-temperance and siblings — remain); (2) add
  contradicted_by edges where contradictions live only in rationale prose; (3)
  land the validate-graph mirror check (edge without matching record entry, or
  vice versa, fails); (4) sweep remaining old-vocabulary stamps
  (delegated-pending-review → deferred, delegated-review-declined → delegated)
  on nodes the resolution-round commit did not touch (e.g.
  tactic-align-indifference-option, tactic-keystone-decomposition-reorg). The
  doctrine is author-ratified; this tactic is the mechanical carry."
reading: null
serves:
  - strategy-explicit-intent
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
# Migrate the graph to the symmetric substantiation edges — attributes.traditions → substantiated_by, contradicted_by edges added from rationale prose, validate-graph mirror enforcement, and the stamp vocabulary sweep (old state names → ratified/deferred/delegated)

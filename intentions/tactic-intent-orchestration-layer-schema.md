---
id: tactic-intent-orchestration-layer-schema
kind: tactic
statement: Classify every node field into the intent or orchestration layer and
  enforce the boundary in tooling — orchestration writers never rewrite intent
  fields, intent writers never rewrite orchestration fields
owner: ai
status: raw
parent: null
rationale: "Delegated by the 2026-08-31 /align doctrine-alignment round under
  the ratified layer-boundary disposition (strategy-explicit-intent,
  2026-08-31). Tradition reference: infrastructure-as-code spec/status
  separation (Kubernetes) — the boundary exists so controllers and humans cannot
  corrupt each other's writes; the measured body-clobber defect family (park
  refresh wiping sibling edits, transition-node dropping uncommitted
  clarifications) is the local symptom the boundary removes."
reading: null
serves:
  - strategy-explicit-intent
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Classify every node field into the intent or orchestration layer and enforce the boundary in tooling — orchestration writers never rewrite intent fields, intent writers never rewrite orchestration fields

## Retained interview context (2026-08-31 /align doctrine-alignment round)

Two delegated duties, the first bounding the second:

1. **Carrier-parsimony classification.** The atomic unit of intent is the
   disposition; intent-side fields (statement, rationale, success_signal,
   attributes.conditions, clarifications) are role-typed carriers. Test each
   field for a parsimonious greenfield function — a role distinction earns its
   keep only where a consumer reads it mechanically. Author directives bound
   into this evaluation: clarifications are flagged as prime for consolidation;
   evaluate whether the greenfield design includes `rationale` at all or
   whether a `serves` edge already carries that role; `owner` has no greenfield
   function (prior ruling, strategy-explicit-intent 2026-08-31 finalize round);
   test whether `status` follows it (its draft/codified role duplicates
   phase-absence); `reading`/`rounds` are observed state sitting on the intent
   side — relocate to the orchestration layer. Any carrier-consolidation
   proposal arrives as a DEFERRED disposition for author review, never executed
   as delegated.
2. **Tooling enforcement.** write-node, transition-node, park-node, and
   graph-commit respect layer authority: each writer declares its layer and the
   write path refuses cross-layer rewrites. Classification lands in the kind
   nodes per the schema-as-data disposition (strategy-graph-self-description,
   2026-08-31).

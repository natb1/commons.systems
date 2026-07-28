---
id: tactic-subtree-parent-marker
kind: tactic
statement: "Mark subtree parents first-class: subtreeParentIds is derived from
  live parent edges, so pruning all children on completion drops the exclusion
  and the parent re-surfaces as an align-tactics draft candidate"
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-23 census: a completed subtree loses every
  live parent edge when its children are pruned, so the derived exclusion
  evaporates and the same failure returns by another route. A first-class
  attribute marker would be immune, and the scripted census tick makes the
  childless state the common case."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Mark subtree parents first-class: subtreeParentIds is derived from live parent edges, so pruning all children on completion drops the exclusion and the parent re-surfaces as an align-tactics draft candidate

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

Mechanism: `subtreeParentIds` is computed from live `parent:` edges. When a completed subtree's children are all pruned (exactly what census does), the parent loses every inbound parent edge, drops out of the derived exclusion, and re-surfaces as an /align-tactics draft candidate — the same failure returning by another route. The scripted census tick (tactic-census-scripted-tick) makes the childless state the common case, raising the odds. Fix shape: a first-class marker (e.g. `attributes.subtree_parent: true`) that the exclusion reads instead of deriving from edges.

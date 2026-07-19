---
id: tactic-router-subtree-parent-exclusion
kind: tactic
statement: selectGraphTargets excludes subtree-parents from the align-tactics
  draft-selectable set — a tactic named as another tactic's parent is a
  permanent container, not an undecomposed draft
owner: ai
status: raw
parent: null
rationale: "Retained draft from the 2026-07-19 /align-strategy round on
  strategy-graph-native-dispatch ('track both the router fix'), minted after
  /align-tactics tactic-graph-native-dispatch parked its own target for exactly
  this defect: the router's frozen-tactic branch
  (packages/intentionsutil/src/router.ts — isDraft at ~L125-127, frozen-tactic
  candidates at ~L317-329) treats any tactic with phase===null as an
  align-tactics candidate, with no exclusion for a tactic that is itself another
  tactic's `parent`. A subtree-parent is by design permanently phase-null (it
  completes when its last child completes), so it re-surfaces as an
  align-tactics candidate every tick. Two live instances on the current corpus:
  tactic-graph-native-dispatch (8 children, office_hours-parked 2026-07-19 for
  this defect) and tactic-firebase-demo-saas-app (6 children)."
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
# selectGraphTargets excludes subtree-parents from the align-tactics draft-selectable set — a tactic named as another tactic's parent is a permanent container, not an undecomposed draft

Retained draft context (2026-07-19 /align-strategy round; the office_hours park
on tactic-graph-native-dispatch, landed with this draft, is the live-incident
record).

## Defect

`selectGraphTargets`'s frozen-tactic branch treats every `phase === null`
tactic as an `/align-tactics` candidate:

- `isDraft` (packages/intentionsutil/src/router.ts ~L125-127):
  `phase === null || phase === "draft"`.
- Frozen-tactic candidate loop (~L317-329): pushes any `isDraft(t)` tactic
  with no exclusion for a tactic that other tactics name as their `parent`.

A subtree-parent is permanently `phase: null` by design (it completes when its
last child completes), so it re-surfaces as a candidate every tick, and a
per-node `/align-tactics` session on it can only park (no plan to write, no
valid `phase: implement` landing). Live instances: `tactic-graph-native-dispatch`
(8 children), `tactic-firebase-demo-saas-app` (6 children).

## Fix sketch

- Preferred: precompute the set of ids appearing as any tactic's `parent`
  across the corpus; skip a frozen-tactic candidate whose id is in that set.
  Audit the same conflation in `resolveFrozenDescendant` (~L457) and
  `frozenTacticSelectable` (~L486).
- Alternative (only if the derived set proves ambiguous): a first-class
  frontmatter marker distinguishing a genuine undecomposed draft from a
  permanent subtree-parent — a schema change, heavier.

## Acceptance

- `select-targets` on the current corpus emits no align-tactics candidate for
  `tactic-graph-native-dispatch` or `tactic-firebase-demo-saas-app`.
- Unit test: a phase-null tactic that is another tactic's `parent` is not
  draft-selectable; a childless phase-null tactic still is.
- Completion clears the office_hours park on `tactic-graph-native-dispatch`.

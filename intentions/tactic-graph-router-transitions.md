---
id: tactic-graph-router-transitions
kind: tactic
statement: "router v2 (b): persisted phase transitions, attempt counters and
  markers as graph writes, reconciler sweep, completion pruning"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Second half of the router migration (clarification 1): the router
  transitions the persisted phase — PR and CI demoted from ground truth to
  sensors — absorbs out-of-band gh events with a reconciler sweep, and prunes
  completed tactics, stamping the strategy's round accounting."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by:
    - tactic-graph-router-selector
    - tactic-graph-commit
---
# router v2 (b): persisted phase transitions, attempt counters and markers as graph writes, reconciler sweep, completion pruning

## Context

Router v2, second half (strategy clarification 1): phase is persisted and
written, never re-derived — PR draft state and CI are demoted from ground
truth to sensors consulted before a transition commits. Out-of-band gh
events are absorbed by a reconciler sweep. Spec:
`intentions/tactic-graph-native-dispatch.md` §1.1 and §2.4.

## Unit 1 — phase transitions and execution state as graph writes

**Recommended model:** opus

Scope: at the seams where the legacy flow edits labels —
`.claude/skills/dispatch-propagate/scripts/dispatch-complete-phase` and
`dispatch-finalize-phase` — graph-native tactics instead graph-commit:
- the `phase` transition (implement → fix/qa → review → done),
- `execution.attempts` counters (formerly `dispatch:*-attempt` labels),
- `execution.markers` (formerly `dispatch:planned` / `qa-done` /
  `reviewed`),
- `execution.pr` when the PR opens.
Sensor consultation before each commit: CI verdict and PR mergeability via
read-only gh calls (the read side of
`.claude/skills/dispatch-propagate/scripts/dispatch-phase` survives as this
sensor layer; its derivation-to-phase logic does not apply to graph-native
tactics).

## Unit 2 — reconciler sweep and completion pruning

**Recommended model:** opus

Depends on: Unit 1.

Scope: graph-native analog of
`.claude/skills/dispatch-propagate/scripts/dispatch-reconcile-merged`:
- Sweep open graph-native tactics whose PR merged or closed out-of-band →
  transition to `done`.
- `done` prunes the node and its edges in the same commit (the
  transient-tactic rule).
- When a strategy's last non-draft child prunes: `rounds.count += 1`,
  `rounds.last_completed` stamped, in that same commit.

## Dependencies

- `tactic-graph-router-selector` — the selection side these transitions
  complete.
- `tactic-graph-commit` — every write goes through the primitive; no
  direct git in this tactic's scripts.

## Reuse

- `dispatch-write-phase-log` for the transition log line (the sensor input
  format).
- graph-commit for atomic multi-node writes (prune + rounds stamp).

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual staged lifecycle: on a scratch branch of the store, a synthetic
tactic walks implement → qa → review → done, each transition one commit;
hand-merge its PR mid-flow and confirm the sweep absorbs it; confirm the
final commit prunes the node and stamps the strategy's rounds.

## Implementation notes

One subagent per unit, `model: opus`; constrain to working-tree edits.

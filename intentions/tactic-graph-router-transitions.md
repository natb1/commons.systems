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
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-graph-router-selector
  - tactic-graph-commit
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# router v2 (b): persisted phase transitions, attempt counters and markers as graph writes, reconciler sweep, completion pruning

## Context

Router v2, second half (strategy clarification 1): phase is persisted and
written, never re-derived — PR draft state and CI are demoted from ground
truth to sensors consulted before a transition commits. Out-of-band gh
events are absorbed by a reconciler sweep. Spec:
`intentions/tactic-graph-native-dispatch.md` §1.1 and §2.4.

The transition write is the scheduling mechanism (legacy parity): selection
reads `origin/main`, so the write that ends a phase is what makes the next
phase worker — fix, qa, review — selectable, exactly as
`dispatch-complete-phase`'s label edits do today. Until this tactic lands,
sessions completing a phase on a graph-native tactic apply the
bootstrap-transition doctrine by hand (strategy clarification 15: the
completing session writes the transition to main as a state-only commit,
never on the work PR branch); that doctrine retires here.

## Unit 1 — phase transitions and execution state as graph writes

**Recommended model:** opus

Scope: at the seams where the legacy flow edits labels —
`.claude/skills/dispatch-propagate/scripts/dispatch-complete-phase` and
`dispatch-finalize-phase` — graph-native tactics instead graph-commit:
- the `phase` transition: the `implement → qa → review → [main-qa] →
  done` ladder (`main-qa` only when needs-main residue is recorded on
  the node — strategy clarification 22, spec §1.1), plus the `fix`
  interrupt — any of implement/qa/review transitions to `fix` when the
  PR's CI verdict is failing, and back to the ladder's resumption point
  once CI is green (spec §1.1, strategy clarification 18; legacy parity
  with dispatch-phase's CI-verdict-before-labels ordering).
  qa-fix/review-fix content-fix loops stay internal to the qa and review
  phases and never write a `fix` transition,
- `execution.attempts` counters (formerly `dispatch:*-attempt` labels),
- `execution.markers` (formerly `dispatch:planned` / `qa-done` /
  `reviewed`),
- `execution.pr` when the PR opens.
Sensor consultation before each commit: CI verdict and PR mergeability via
read-only gh calls (the read side of
`.claude/skills/dispatch-propagate/scripts/dispatch-phase` survives as this
sensor layer; its derivation-to-phase logic does not apply to graph-native
tactics).

Merge-when-ready parity: a clean review completion arms gh auto-merge on
the PR (same config gate as today, `dispatch-auto-merge` conventions
unchanged — spec §2.4's carried-over phase-skill internals); the merge
itself lands out-of-band and Unit 2's sweep absorbs it into `done`. No
graph-side merge step exists.

## Unit 2 — reconciler sweep and completion pruning

**Recommended model:** opus

Depends on: Unit 1.

Scope: graph-native analog of
`.claude/skills/dispatch-propagate/scripts/dispatch-reconcile-merged`:
- Sweep open graph-native tactics whose PR merged or closed out-of-band:
  merged with a needs-main residue section on the node → transition to
  `main-qa` (strategy clarification 22; `tactic-main-qa-phase` supplies
  the phase value and handler); merged without residue, or closed →
  transition to `done`.
- `done` prunes the node and its edges in the same commit (the
  transient-tactic rule).
- When a strategy's last non-draft child prunes: `rounds.count += 1`,
  `rounds.last_completed` stamped, in that same commit — for a
  residue-bearing tactic this fires only after `main-qa` completes, so
  round accounting means verified-in-prod.

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
include one `fix` interrupt (simulate a failing CI verdict at qa or
review, confirm the transition to `fix` and the return to the interrupted
ladder position once the verdict is green); hand-merge its PR mid-flow and
confirm the sweep absorbs it; confirm the final commit prunes the node and
stamps the strategy's rounds. Repeat with a needs-main residue section on
the node: the sweep routes merged → `main-qa` instead of `done`, and the
rounds stamp waits for the `main-qa → done` transition.

## Implementation notes

One subagent per unit, `model: opus`; constrain to working-tree edits.

---
id: tactic-fix-interrupt-attempt-cap
kind: tactic
statement: "Bound the node-lane CI-fix interrupt with a retry cap: increment
  execution.fix.attempt per /fix-checks iteration and park to office_hours once
  it exceeds a threshold, restoring the escalation the legacy
  dispatch:fix-checks-attempt-<n> label lane provided"
owner: ai
status: raw
parent: null
rationale: null
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
# Bound the node-lane CI-fix interrupt with a retry cap: increment execution.fix.attempt per /fix-checks iteration and park to office_hours once it exceeds a threshold, restoring the escalation the legacy dispatch:fix-checks-attempt-<n> label lane provided

Draft — provenance from `/review-fix` on PR #2905.

## Finding

**Location:** `.claude/skills/dispatch-propagate/scripts/graph-select-target:283`

The node-lane CI-fix interrupt has no retry cap or attempt-based escalation. On
repeated red CI for an active interrupt, `_gate_fix_active`'s failing branch
(line 283) just re-emits `fix` and explicitly does NOT re-set anything; the
entry gate `_gate_maybe_interrupt` calls `apply-fix-state --set-fix` exactly
once, so `execution.fix.attempt` is initialized to 1
(`apply-fix-state.ts:159`) and never incremented in the live flow (the
increment branch at `apply-fix-state.ts:160` only fires on a defensive double
`--set-fix`, which the selector never issues). No consumer reads `attempt` to
bound retries.

**Failure scenario:** a persistently-red node-lane PR whose `/fix-checks`
outcome is neither needs-human nor flake (e.g. a recurring "generic
no-repro", or fixes that never green CI) re-launches `/fix-checks` every tick
forever with no office-hours escalation — a regression from the legacy lane,
which caps at 3 via `dispatch:fix-checks-attempt-<n>` labels and escalates
through the Stop hook. The schema comment (`schema.ts:365-366`) claiming
`attempt` "replaces the attempts['fix'] convention" is not realized.

**Adversarial verdict:** not applicable — this is a code-review `Deferred`
finding (out-of-scope for the source PR), not a security `Required` finding, so
it was not routed through the adversarial-verify skeptic pass.

**Source PR:** #2905 (`tactic-fix-interrupt-orthogonal-state`).

## Recommended fix

Either increment `execution.fix.attempt` per fix iteration (e.g. have
`/fix-checks`'s node-lane `--record-push`, or a selector re-entry, bump it) and
add a cap check in `_gate_fix_active` that parks the node to `office_hours`
once `attempt` exceeds the bound; or, if a node-lane cap is intentionally out
of scope, remove/annotate the `attempt` field and correct the schema comment so
it does not claim to replace the retry-cap convention.

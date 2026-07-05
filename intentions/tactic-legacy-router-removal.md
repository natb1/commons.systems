---
id: tactic-legacy-router-removal
kind: tactic
statement: "drain complete: remove the legacy gh router and dispatch:* label conventions"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "The strategy's threshold: legacy gh dispatch router deleted with the
  /file-issue + /plan-issue coverage matrix fully mapped. Gated on an external
  condition — the gh queue draining to zero — checked at plan step 0; parks
  itself if not yet drained (blocked_by cannot express an external condition)."
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
validates:
  - strategy-graph-native-dispatch
blocked_by:
  - tactic-align-strategy-skill
  - tactic-align-tactics-skill
  - tactic-graph-router-transitions
  - tactic-dispatch-lifecycle-sensor
  - tactic-phase-skill-node-targets
  - tactic-main-qa-phase
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# drain complete: remove the legacy gh router and dispatch:* label conventions

## Context

The strategy's threshold: legacy gh dispatch router deleted with the
`/file-issue` + `/plan-issue` coverage matrix fully mapped. The matrix
(`intentions/tactic-graph-native-dispatch.md` §4) is the removal
checklist — every deleted behavior must map to a matrix row landed by a
sibling tactic.

## Step 0 — drain gate (external condition)

Verify the gh queue is empty: no open dispatch-eligible issues (`help
wanted` without open blockers) and no open dispatch-owned PRs. If
non-empty, this tactic parks itself (`office_hours`, reason: awaiting
drain) — `blocked_by` edges cannot express an external condition, so the
gate is a plan step.

## Unit 1 — remove the selector and phase-derivation surface

**Recommended model:** opus

Scope: in `.claude/skills/dispatch-propagate/scripts/` delete or reduce:
`dispatch-select-target`, the legacy path in `dispatch-select-tick`,
`dispatch-phase`'s derivation logic (its read-only sensor side survives in
the transitions layer), `office-hours-select-target` (superseded by the
`office_hours != null` projection), and every `dispatch:*` label
convention remaining in scripts and skill docs. Each deletion cites its
matrix row or its graph-native replacement tactic.

## Unit 2 — retire the legacy authoring skills

**Recommended model:** sonnet

Depends on: Unit 1.

Scope: retire `/file-issue` and `/plan-issue` skill docs with pointers to
their successors. (The gh↔graph mapping layer — `intention-emit`,
`backfill.ts`/`refresh.ts`, `trackers/`, `rank-map.ts` — was already
removed when the parallel-drain migration superseded the mapping strategy;
nothing of it remains to retire here.)

## Dependencies

- `tactic-align-strategy-skill`, `tactic-align-tactics-skill`,
  `tactic-graph-router-transitions`, `tactic-dispatch-lifecycle-sensor`,
  `tactic-phase-skill-node-targets`, `tactic-main-qa-phase` — the
  replacement surface must be live end to end (the node-targets tactic is
  what lets the phase skills run on node targets at all; the main-qa
  tactic is what lets the qa-main label machinery be deleted).

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: repo grep for `dispatch:` label references — zero hits outside git
history; then one tactic completes a full lifecycle graph-natively (the
signal observable) with the legacy scripts gone, and the lifecycle
sensor's next reading reflects it.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.

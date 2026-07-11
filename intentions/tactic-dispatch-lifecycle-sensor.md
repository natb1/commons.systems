---
id: tactic-dispatch-lifecycle-sensor
kind: tactic
statement: "instrument: lifecycle sensor — phase-transition history and the
  selection log populate the strategy's reading"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: The strategy's reading is null, so round 1 must buy its own
  instrument (fresh-reading gate, clarification 3). Registers a sensor that
  derives the reading from the store's own history and the router's selection
  log — no gh query.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-dispatch-lifecycle-sensor
  pr: 2843
  attempts: {}
  markers:
    - reviewed
  strategy_fingerprint: null
validates:
  - strategy-graph-native-dispatch
blocked_by:
  - tactic-graph-router-transitions
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# instrument: lifecycle sensor — phase-transition history and the selection log populate the strategy's reading

## Context

The strategy's `reading` is null, so round 1 must buy its own instrument
(fresh-reading gate, clarification 3 on `strategy-graph-native-dispatch`):
a sensor that can produce a reading for the observable — "a tactic
completes the full lifecycle with no GitHub label or issue required" —
from the store itself, with no gh query.

## Unit 1 — lifecycle sensor

**Recommended model:** sonnet

Scope:
- New sensor registered in `buildDefaultRegistry`
  (`packages/intentionsutil/scripts/read-sensors.ts:99`), local-first:
  reads (a) the git log of `intentions/` for phase-transition commits of
  graph-native tactics, and (b) the selection log emitted by
  `graph-select-target` (see `tactic-graph-router-selector`).
- `reading`: the latest full lifecycle observed (align-tactics → implement
  → qa → review → done/prune) with zero gh label or issue writes, or
  "none yet".
- `gap`: mechanical delta against the threshold — legacy router scripts
  still present, coverage-matrix rows not yet mapped
  (`intentions/tactic-graph-native-dispatch.md` §4).
- Writes `reading`/`gap` on `intentions/strategy-graph-native-dispatch.md`
  via graph-commit.

## Dependencies

- `tactic-graph-router-transitions` — the transition history and pruning
  this sensor reads must exist first.

## Reuse

- `SensorRegistry` and the `gitSensor` pattern in `read-sensors.ts`.
- `readFrontierSensors` (`read-sensors.ts:122`) as the invocation path —
  no new entrypoint.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: run read-sensors against a store whose git history contains one
completed synthetic lifecycle — `reading` populates and the strategy's
fresh-reading gate re-opens `/align-tactics` eligibility for round 2.

## Implementation notes

Single unit; subagent with `model: sonnet`; constrain to working-tree
edits.

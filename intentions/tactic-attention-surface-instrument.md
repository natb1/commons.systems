---
id: tactic-attention-surface-instrument
kind: tactic
statement: "instrument: source-of-truth audit sensor — every rendered signal
  traces to a graph node and a local source; populates the strategy's reading"
owner: ai
status: codified
parent: null
rationale: The strategy's reading is null, so round 1 must buy its own
  instrument (fresh-reading gate). Registers a sensor that audits the surface's
  signal registry against the store and detects the remaining hosted Firestore
  owner tier — the mechanical halves of the recorded observable and threshold.
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-attention-surface
blocked_by:
  - tactic-attention-surface-status-page
  - tactic-attention-surface-goals-page
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# instrument: source-of-truth audit sensor — every rendered signal traces to a graph node and a local source; populates the strategy's reading

## Context

The strategy's `reading` is null, so round 1 must buy its own instrument
(fresh-reading gate). The recorded sensor is "owner review at office-hours
plus the surface's own source-of-truth audit"; this tactic builds the
mechanical half — the audit — and registers the sensor that writes the
strategy's `reading`/`gap`. The sessions-conducted half of the observable
stays owner attestation at office hours.

## Unit 1 — source-of-truth audit and sensor

**Recommended model:** sonnet

Scope:
- Surface side: an audit affordance on the status page summarizing, per
  registered signal type: the owning node id resolves in the loaded
  graph, the declared `signalKind` matches that node (its
  `success_signal` or a recorded condition exists), the source adapter is
  local, and the last reading's freshness. Zero untraced signals is the
  pass state.
- Host side: sensor registered in `buildDefaultRegistry`
  (`packages/intentionsutil/scripts/read-sensors.ts`) for
  `strategy-attention-surface`: statically audits the registry module
  (`office-hours/src/signals/registry.ts`) against the store — every
  `owningNode.id` exists, kinds match — and detects the hosted owner-tier
  remnant (Firestore owner reads in `office-hours/src/firebase.ts` /
  `data.ts`).
- `reading`: "N signal types registered, all tracing to graph nodes and
  local sources" — or the failure list.
- `gap`: the threshold delta — hosted Firestore owner tier still
  present, legacy bespoke panels still rendering.
- Writes `reading`/`gap` on `intentions/strategy-attention-surface.md`
  via graph-commit (until it ships: `write-node.ts` + commit).

## Dependencies

- `tactic-attention-surface-status-page`,
  `tactic-attention-surface-goals-page` — the surface being audited must
  exist.

## Reuse

- `SensorRegistry` and the sensor patterns in
  `packages/intentionsutil/src/sensors.ts` /
  `scripts/read-sensors.ts`; `readFrontierSensors` as the invocation
  path — no new entrypoint.
- `tactic-dispatch-lifecycle-sensor` as the exemplar instrument tactic.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: run the sensor against this clone — `reading` populates and
`gap` names the Firestore remnant; the strategy's fresh-reading gate
re-opens `/align-tactics` eligibility for round 2.

## Implementation notes

Single unit; subagent with `model: sonnet`; supply this Context and
Scope; constrain to working-tree edits.

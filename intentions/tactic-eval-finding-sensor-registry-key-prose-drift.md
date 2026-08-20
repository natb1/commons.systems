---
id: tactic-eval-finding-sensor-registry-key-prose-drift
kind: tactic
statement: A sensor's registry key is a code constant duplicating
  interview-editable node prose, and nothing on the graph write path checks the
  two still match — an /align reword silently de-registers the sensor
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-12
  measured_impact:
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: vitest
      measured: 2026-08-12
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
# A sensor's registry key is a code constant duplicating interview-editable node prose, and nothing on the graph write path checks the two still match — an `/align` reword silently de-registers the sensor

`packages/intentionsutil/scripts/read-sensors.ts` resolves a node's sensor by
**verbatim string match**: `SensorRegistry.resolve` compares the whole
`success_signal.sensor` string against the registered `Sensor.name`. So the
registry key for a sensor is a duplicate — one copy in TypeScript, one copy in
node prose that `/align` interviews edit freely. Any edit to the prose copy that
is not mirrored into the code copy de-registers the sensor. The node's `reading`
goes `null`, the node joins the `skipped (unregistered sensor)` tail, and
nothing errors.

This entry is keyed on the **class** defect. The occurrence below is what
surfaced it.

## The occurrence — `strategy-graph-native-dispatch`, 2026-08-12

- `tactic-graph-native-signal-instrument-arm` (`19d401fb`, 2026-08-10) armed the
  lifecycle sensor and shipped a per-sensor anti-drift guard for it:
  `packages/intentionsutil/test/lifecycle-sensor.test.ts` asserts
  `LIFECYCLE_SENSOR_NAME` equals the node's recorded `success_signal.sensor`.
- The `/align` round landing `56039748` (2026-08-12) appended a park-cause clause
  to that same `success_signal.sensor` field and did not touch the constant. The
  sensor de-registered on the next read.
- `main` stayed green. The guard exists but never ran: `/align` lands graph
  writes through `graph-commit`, whose pushes go to `graph/**`, and
  `.github/workflows/graph-fast-path.yml` runs only
  `check-graph-fast-path.sh` + `validate-graph.ts` there — no vitest at all.
  `unit-tests.yml` is `branches-ignore: [main, 'graph/**']`, so it never runs on
  the write path either. The break only became visible on PR #3074, a code PR
  that happens to touch `packages/intentionsutil`.
- `9706c70a` re-registered the constant verbatim, restoring the three readings
  that are implemented.

This is the **second** recorded instance of the same class. The first was
`strategy-recursive-self-improvement`'s own sensor: the `/align` round in
`47219a1a` (2026-08-10) appended "plus the research lane's weekly dated
readings…" to its `success_signal.sensor` and de-registered a sensor that had
shipped working days earlier in #3065.

## Blast radius

`buildDefaultRegistry()` registers nine sensors
(`read-sensors.ts:1436`). Six of them are keyed on long prose constants
(`MAIN_HEALTH_SENSOR_NAME`, `LIFECYCLE_SENSOR_NAME`,
`DEPENDENCY_AUDIT_SENSOR_NAME`, `DELEGATION_RECORDS_SENSOR_NAME`,
`INTENTION_STORE_SENSOR_NAME`, `RSI_SENSOR_NAME`), each duplicating a node's
`success_signal.sensor` prose. Exactly **one** — the lifecycle sensor — carries
an anti-drift assertion against the real store
(`readNode(intentionsDir, …)` appears in only two test files repo-wide, and only
`lifecycle-sensor.test.ts` uses it for sensor-name equality). The other five are
unguarded by anything.

`validate-graph.ts` has no sensor rule of any kind, and
`lint-prose-rules.sh` has none either. There is no mechanical link between the
registry and the store.

## Where a fix would go — two independent halves

Both are needed; either alone leaves the hole open.

1. **A generic guard, not a per-sensor one.** One test that walks
   `registeredSensorNames()` and asserts every registered name is some node's
   `success_signal.sensor` verbatim (the forward direction only — most sensor
   prose in the store is deliberately unregistered, so the reverse must not be
   asserted). Alternatively a `validate-graph` rule, which has the advantage of
   running on the graph write path today. Removing the duplication outright —
   a stable `attributes.sensor_id` key that both sides address — is the
   greenfield design, but it is a schema change across the whole store.
2. **Run the guard where the edit happens.** Whichever form the guard takes, the
   `/align` write path must execute it. `graph-fast-path.yml` runs
   `validate-graph.ts` on `graph/**` pushes and nothing else, which is why a
   `validate-graph` rule is the cheaper of the two shapes.

## The instance residue — an open author decision, NOT decided here

The clause `56039748` appended names a **fourth** reading that does not exist in
`read-sensors.ts`: a park-cause reading over `office_hours.reason` across parked
nodes, counting `/align-tactics` parks attributable to an upstream recording
round's own record gap. Re-registering the constant made the string match again,
so the three implemented readings work — but the recorded sensor now promises a
reading the instrument does not produce. Two options, for the author:

- **(a) Implement the reading.** Add the park-cause segment to
  `readLifecycleReading` so the instrument delivers what the node records.
  `tactic-park-cause-sensor-instrument` was filed in the same `/align` round for
  this.
- **(b) Revise the node prose to drop the clause.** Return
  `success_signal.sensor` to the three readings that exist and re-register the
  constant to match, moving the park-cause observable to its own node.

Do not resolve this by trimming the clause in the constant alone — that would
re-break the registry key.

## Standing corollary

**Recording sensor prose does not register a sensor.** The intention-store
sensor's own counter reads `readings: 19/53 sensor-naming strategies
(45 unregistered sensors)` — most recorded sensor prose has no instrument behind
it. An `/align` decision to "register a sensor" is therefore only half-done at
record time; the instrument tactic has to be filed in the same round. It also
means an appended clause is usually *inert* — which is exactly why the two live
instances above were both invisible.

---
id: tactic-intention-store-sensor
kind: tactic
statement: Intention-store instrument — register the sensor 'the intention store
  itself' computing serves coverage and reading coverage, and widen read-sensors
  beyond the active frontier
owner: ai
status: codified
parent: null
rationale: "Round-1 instrument for strategy-graph-drives-dispatch (reading null
  — a strategy that cannot be measured must first buy its own instrument): its
  named sensor is 'the intention store itself', but no registered sensor
  computes the threshold's two quantities (open-tactic serves coverage;
  sensor-run readings across sensor-naming strategies), and the read-sensors
  driver walks only the active frontier — which excludes codified nodes and
  parent nodes, including this strategy itself — so the reading could never be
  driver-written. This tactic registers the sensor and widens the driver's READ
  scope; the blocked sibling tactic-first-sensor-pass then runs the first pass
  and lands the reading."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-intention-store-sensor
  pr: 2863
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: d998d5c0754b51cfc489ee784db11b77d9b40eb91777ee0215076b0ad1a6bb69
validates:
  - strategy-graph-drives-dispatch
blocked_by: []
office_hours:
  reason: "graph-tick review worker cannot run the review phase: /review-fix
    requires the Workflow tool for its finder fan-out / classify /
    adversarial-verify / fix pipeline, and that tool is not available in the
    headless graph-tick executor; the skill forbids emulating the phase ad hoc.
    PR #2863 is CI-passing and mergeable; inline scans already ran clean
    (CodeQL: no open alerts; erosion: one medium advisory on read-sensors.ts
    complexity 87->103). Next steps: a human runs /review-fix
    tactic-intention-store-sensor in a full interactive session (which has the
    Workflow tool), letting it carry the review to its dispatch:reviewed /
    transition-node --set-pr 2863 completion, then manually clears this
    office_hours field (no unpark primitive) so the router can resolve the node
    to done."
  since: 2026-07-12
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Intention-store instrument — register the sensor 'the intention store itself' computing serves coverage and reading coverage, and widen read-sensors beyond the active frontier

## Context

strategy-graph-drives-dispatch's success signal is measured by "the intention
store itself": threshold "every open tactic carries a non-empty serves edge and
sensor-run readings exist for every strategy that names a sensor". Its
`reading` is null and cannot currently be produced mechanically, for two
reasons this tactic fixes:

1. No sensor named "the intention store itself" exists in the read-sensors
   registry (`packages/intentionsutil/scripts/read-sensors.ts:545-552`,
   `buildDefaultRegistry` — currently vitest, git, token-economy, and the
   graph-native-dispatch lifecycle sensor).
2. The driver walks only the active frontier:
   `readFrontierSensors` (`packages/intentionsutil/scripts/read-sensors.ts:570-600`)
   iterates `projectGoals(listNodes(dir))`, and `activeFrontier`
   (`packages/intentionsutil/src/goals.ts:50-55`) drops `status: "codified"`
   nodes and any node that is a `parent` of another. strategy-graph-drives-dispatch
   is the parent of strategy-graph-native-dispatch, and
   strategy-exercise-recovery-paths is codified — so the driver can never
   write their readings. That contradicts the strategy's own threshold, which
   quantifies over EVERY sensor-naming strategy.

Per strategy clarification 7 (recorded 2026-07-11): the sensor counts a
sensor-naming strategy as read when its `reading` is non-null, and separately
reports how many name a sensor absent from the registry — reading provenance is
not recorded in frontmatter, so existence is the deliberate mechanical proxy
for "sensor-run".

## Unit 1 — coverage functions + intention-store sensor

**Recommended model:** sonnet

**Scope:** in `packages/intentionsutil/scripts/read-sensors.ts`, following the
exported-pure-function pattern of `readTokenEconomy`
(`packages/intentionsutil/scripts/read-sensors.ts:293-302`):

- `openTacticServesCoverage(nodes)` — over `kind === "tactic"` nodes with
  `phase !== null && phase !== "done"` (open dispatch work), return
  `{ withServes, open }` where `withServes` counts `serves.length > 0`.
- `sensorReadingCoverage(nodes, registeredNames)` — over `kind === "strategy"`
  nodes with `success_signal !== null`, return `{ read, total, unregistered }`:
  `read` counts `reading !== null`; `unregistered` counts nodes whose
  `success_signal.sensor` is not in `registeredNames`.
- `makeIntentionStoreSensor(registeredNames, loadNodes)` — a `Sensor` factory;
  name is the verbatim string `"the intention store itself"` (export it as a
  const, mirroring `LIFECYCLE_SENSOR_NAME` at
  `packages/intentionsutil/scripts/read-sensors.ts:327`). `read()` is total
  (never throws — degrade to `"unknown"` on a load failure, per the
  total-sensor contract at `read-sensors.ts:48-53`) and returns the stable
  format:
  `serves: <a>/<b> open tactics; readings: <c>/<d> sensor-naming strategies (<e> unregistered sensors)`.
- Register it in `buildDefaultRegistry` with `registeredNames` = the four
  existing names plus its own, and `loadNodes = () => listNodes(intentionsDir)`.
- Unit tests in `packages/intentionsutil/test/intention-store-sensor.test.ts`
  over FIXTURE node arrays (never the live store), following
  `packages/intentionsutil/test/token-economy-sensor.test.ts`: open vs done vs
  phase-null tactics; empty vs non-empty serves; strategies with/without
  signals, with/without readings, registered vs unregistered sensor names.

**Out of scope:** any change to `src/sensors.ts` core (registry/deriveGap are
reused as-is); goal projection (`projectGoals` ordering) — untouched.

## Unit 2 — widen the driver's READ scope

**Recommended model:** sonnet

**Scope:** change `readFrontierSensors`
(`packages/intentionsutil/scripts/read-sensors.ts:570-600`) to iterate
`listNodes(dir)` directly instead of `projectGoals(listNodes(dir))`, so every
node naming a registered sensor gets its reading written — codified and parent
nodes included, matching the strategy threshold's "every strategy that names a
sensor". Rename to `readStoreSensors` (update the one call site in `main()` and
any test imports), update the doc comments (the "active frontier" language),
and keep the `ReadSummary` semantics (`skippedNoSignal` now counts all
no-signal nodes in the store). `projectGoals`/`activeFrontier` in
`packages/intentionsutil/src/goals.ts` are untouched — frontier filtering
remains correct for goal projection; it was only wrong as the READ scope.

**Dependencies:** none (independent of Unit 1; land in the same PR).

## Reuse

- `packages/intentionsutil/src/sensors.ts` — `SensorRegistry`, `deriveGap`,
  `Sensor` (no core changes).
- `packages/intentionsutil/src/store.ts` — `listNodes`.
- `packages/intentionsutil/scripts/read-sensors.ts` — sensor + exported
  pure-function patterns (`readTokenEconomy`, `LIFECYCLE_SENSOR_NAME`).
- `packages/intentionsutil/test/token-economy-sensor.test.ts` — fixture test
  shape.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/read-sensors.ts
```

Prose: the driver run writes a non-null `reading` in the stated format onto
`intentions/strategy-graph-drives-dispatch.md` (as of 2026-07-11 expect
`serves: 50/50 open tactics` and roughly `10/50` readings with ~44
unregistered — exact numbers follow the live store; a diff traceable to a
landed node edit is correct behavior, not a failure). This tactic's PR is
code-only: after inspecting the driver's output, revert the store writes
(`git checkout -- intentions/`) — landing the first readings is the blocked
sibling tactic-first-sensor-pass's job, so the two PRs stay disjoint.

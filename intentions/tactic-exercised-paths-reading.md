---
id: tactic-exercised-paths-reading
kind: tactic
statement: "Instrument: recovery-portfolio sensor — read every delegation
  record's last_exercised, last_assessed, floor, and review_trigger into the
  strategy's reading"
owner: ai
status: codified
parent: null
rationale: strategy-exercise-recovery-paths' reading is null, so round 1 must
  buy its own instrument (fresh-reading gate). The recorded sensor is 'the
  delegation records themselves'; this tactic registers a sensor under exactly
  that name so the observable (last_exercised on every delegation record)
  becomes mechanically readable, and produces the per-record report the
  portfolio review works from.
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-exercised-paths-reading
  pr: 2857
  attempts: {}
  markers: []
  strategy_fingerprint: 4ee635b8acf77f2cb701ca3625baa5edf2209e23bf04d30e72650eb7b94f36fa
validates:
  - strategy-exercise-recovery-paths
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument: recovery-portfolio sensor — read every delegation record's last_exercised, last_assessed, floor, and review_trigger into the strategy's reading

## Context

`strategy-exercise-recovery-paths` has a null `reading`, so its first
decomposition round must buy its own instrument (the fresh-reading gate).
Its `success_signal` is: observable "last_exercised on every delegation
record in this graph", sensor "the delegation records themselves",
threshold "no record's last_exercised is null, and no fired review_trigger
is left unactioned". The sensor infrastructure already exists: the
frontier driver `readFrontierSensors`
(`packages/intentionsutil/scripts/read-sensors.ts:570`) walks every node
with a `success_signal`, resolves the node's `success_signal.sensor`
string against a name-keyed `SensorRegistry`
(`packages/intentionsutil/src/sensors.ts:26`), writes the returned string
into the node's `reading`, and derives `gap` via `deriveGap`. Nothing is
registered under the name `the delegation records themselves`, so today
the strategy is reported as "unregistered sensor". This tactic registers
that sensor and adds a per-record report mode for the human portfolio
review (`tactic-recovery-portfolio-review` is blocked on it).

## Unit 1 — delegation-records sensor

**Recommended model:** sonnet

Implement in a subagent (`model: sonnet`), working-tree edits only, passing
this unit's context and scope in the prompt.

Scope:

- New sensor in `packages/intentionsutil/scripts/read-sensors.ts` with
  `name: "the delegation records themselves"` (the exact
  `success_signal.sensor` string on
  `intentions/strategy-exercise-recovery-paths.md` — registry resolution is
  by that string, `packages/intentionsutil/src/sensors.ts:26-49`), registered
  in `buildDefaultRegistry` (`read-sensors.ts:545-552`) alongside
  `lifecycleSensor`.
- The sensor reads all `kind: delegation` nodes via `listNodes`
  (already imported at `read-sensors.ts:35`) and extracts per record from
  `attributes` (free-form YAML — validate shapes at this boundary and fail
  with a clear error naming the malformed record, per
  `.claude/rules/code-style.md`): `irreversibility.last_exercised`,
  `last_assessed`, `non_delegable_floor`, `review_trigger`, and `origin`.
- Reading string (what lands on the strategy's `reading`): a compact
  aggregate, e.g. `"N of M delegation records exercised (last_exercised
  set); D declined-origin (no entered path to exercise); oldest
  last_assessed YYYY-MM-DD (sensor read YYYY-MM-DD)"`. Include the read
  date so the fresh-reading gate can compare against
  `rounds.last_completed`.
- Declined-origin records (`origin: declined`) are counted as their own
  class, never as unexercised: per the strategy's 2026-07-11 clarification
  and kind-delegation's abstention doctrine, a declined delegation has no
  entered path to walk; the portfolio review, not a drill, is their
  exercise. Do NOT silently drop them from the report — the human review
  still covers them.
- Report mode for the portfolio review: a `--report` flag on
  `read-sensors.ts` (or a small sibling script if cleaner) printing a
  markdown table over the same extraction — one row per delegation record:
  id, origin, last_exercised, last_assessed, non_delegable_floor,
  review_trigger. No Firestore, no network: local store reads only.
- Out of scope: writing `last_exercised` on any record (the drills do
  that); any goals-page/office-hours UI (that is
  `tactic-delegation-capture-visibility`, a draft serving
  `strategy-attention-surface` — factor the extraction so that surface can
  later reuse it, but building the surface is not this tactic).

## Unit 2 — unit tests

**Recommended model:** sonnet

Dependencies: Unit 1.

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope: vitest coverage in `packages/intentionsutil` over fixture delegation
nodes (temp-dir store, the pattern existing store/sensor tests use): an
exercised record, a null-`last_exercised` record, a declined record, and a
malformed-attributes record (asserts the clear-error path). Assert the
reading-string counts and the declined-class separation; assert
`readFrontierSensors` end-to-end writes `reading`/`gap` on a fixture
strategy naming this sensor.

## Reuse

- `SensorRegistry`, `deriveGap`, `Sensor`
  (`packages/intentionsutil/src/sensors.ts`).
- `listNodes`, `writeNode` (`packages/intentionsutil/src/store.ts`).
- `lifecycleSensor` (`packages/intentionsutil/scripts/read-sensors.ts:529`)
  as the in-file exemplar for a graph-reading sensor.

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

Manual: `node --import tsx/esm packages/intentionsutil/scripts/read-sensors.ts`
from the worktree root — confirm the summary no longer lists
`strategy-exercise-recovery-paths` under unregistered sensors, that its
`reading` is populated with the counts (expect roughly 2 of 21 exercised
today), and that `gap` is non-null while records remain unexercised.
Landing the written `reading`/`gap` on `origin/main` goes via
`packages/intentionsutil/scripts/graph-commit strategy-exercise-recovery-paths`
(state-only fast path). Run `--report` and confirm the per-record table
renders every delegation record.

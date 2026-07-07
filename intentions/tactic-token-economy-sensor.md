---
id: tactic-token-economy-sensor
kind: tactic
statement: token-economy sensor — registry sensor computing weekly allowance
  utilization and claude-eligible tactic velocity, populating
  strategy-token-economy's reading
owner: ai
status: codified
parent: null
rationale: "Round-1 instrument tactic: the strategy's reading is null, so the
  round must include the tactic that makes the sensor runnable
  (strategy-graph-native-dispatch clarification 3 — a strategy that cannot be
  measured must first buy its own instrument). Planned 2026-07-04 /align-tactics
  round 1."
reading: null
gap: null
serves:
  - strategy-token-economy
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
attributes:
  phase: qa
  validates:
    - strategy-token-economy
  execution:
    strategy_fingerprint: 157bc07dd1dbc4a1c7a5095f7c3094ee88accf5879271bc6d2c4cd4794029848
    branch: tactic-token-economy-sensor
    pr: 2779
    attempts:
      fix: 1
    markers: []
---
# token-economy sensor — registry sensor computing weekly allowance utilization and claude-eligible tactic velocity, populating strategy-token-economy's reading

## Context

`strategy-token-economy`'s success signal is dual: weekly prepaid-allowance
utilization near 100%, and claude-eligible tactic closure velocity at or
above arrival. Its `success_signal.sensor` is the registry name
`token-economy` (renamed from prose in the round-1 record); no sensor of
that name exists yet, so `read-sensors` reports it unregistered and the
node's `reading` stays null. This tactic registers the sensor. It carries
the `validates` edge for the strategy's signal: it produces the reading the
threshold is judged against.

Utilization is already computed for us: the statusline hook
(`.claude/hooks/statusline.sh:16-18`) pipes harness telemetry through
`.claude/skills/dispatch-propagate/scripts/update-rate-limits.sh` into
`~/.local/share/commons-dispatch/rate_limits.json`, whose
`.seven_day.used_percentage` is the weekly figure — pre-computed, no math
(`update-rate-limits.sh:12,19-25`). Velocity has no existing helper: the
office-hours queue metrics parse a Firestore doc, not git
(`office-hours-snapshot/src/produce.ts:399-401`), so the intentions/
git-history derivation is new code.

## Unit 1 — register the token-economy sensor in read-sensors

**Recommended model:** opus

Scope:
- `packages/intentionsutil/scripts/read-sensors.ts`: add a `token-economy`
  sensor to `buildDefaultRegistry()` (registration point
  `read-sensors.ts:99-104`), honoring the total-never-throw contract
  (comment at `read-sensors.ts:47-51`): every failure becomes a status
  reading string, never an exception.
- Utilization half: read
  `$HOME/.local/share/commons-dispatch/rate_limits.json` (allow an env
  override for tests, mirroring
  `DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH` in
  `dispatch-target-workers:276`), extract `.seven_day.used_percentage`
  with the sanitization discipline of `dispatch-target-workers:299-343`
  (non-numeric or >100 treated as missing). Missing file or field →
  `utilization: unknown` in the reading, not a throw.
- Velocity half: derive from the local clone's `intentions/` git history
  over a trailing 28-day window, via `execFileSync` with `cwd: repoRoot`
  (pattern: the `vitest`/`git` sensors at `read-sensors.ts:66-93`).
  Created = first commit adding an `intentions/tactic-*.md` with
  `owner: ai`; closed = commit setting that node's `attributes.phase` to
  `done` or deleting the file. Draft tactics (`status: raw`, no phase)
  count as created — they are claude-eligible work entering the graph.
- Reading string, stable and parseable:
  `utilization: <p>% weekly; tactics 28d: <c> created / <d> closed (net <±n>)`.
- `deriveGap` stays the mechanical string-equality rule
  (`packages/intentionsutil/src/sensors.ts:88-102`); the prose threshold
  will not string-equal the reading, so `gap` stays populated — consistent
  with existing nodes, and the honest state until threshold evaluation
  grows richer.
- Tests in `packages/intentionsutil/test/sensors.test.ts` (extend) or a
  sibling file: healthy read against fixture telemetry + fixture git
  history, missing telemetry file, empty history window, sanitization of a
  non-numeric percentage.

## Dependencies

None — the strategy's `success_signal.sensor` already names
`token-economy`.

## Reuse

- `SensorRegistry` / `deriveGap` — `packages/intentionsutil/src/sensors.ts:13-102`.
- Driver read/write-back flow (`readFrontierSensors`) —
  `packages/intentionsutil/scripts/read-sensors.ts:122-152`; unregistered
  names are collected to stderr, so shipping the sensor removes that
  report line.
- Telemetry extraction idiom — `dispatch-target-workers:299-309`.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual: run
`npx tsx packages/intentionsutil/scripts/read-sensors.ts` — the
`strategy-token-economy` node gains a non-null `reading` matching the
format above, and the utilization figure matches the `7d:` percentage the
statusline shows.

## Implementation notes

Single unit; implement in a subagent with `model: opus`; supply this
Context and Scope; constrain to working-tree edits.
`strategy_fingerprint` recipe (interim until tactic-graph-dispatch-schema
lands): sha256 hex of `JSON.stringify({statement, clarifications,
conditions, serves, success_signal, tooling_goals})` as loaded by
intentionsutil `listNodes`.

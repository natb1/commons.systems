---
id: tactic-attention-surface-velocity-pace
kind: tactic
statement: velocity and pace signals — host-side velocity series folded into the
  office-hours snapshot; pace-telemetry adapter for the frontier-economy
  condition
owner: ai
status: codified
parent: null
rationale: "Split 2026-07-03 from the signal-types draft by /align-tactics round
  1: both signals belong to strategy-autonomous-execution and the velocity half
  adds a producer-side deliverable (strategy clarification 7 — the browser never
  parses git history). Restores the requirement anchor dropped at
  /align-strategy time: the velocity context view follows the legacy WIP-queue
  visualization."
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
validates: []
blocked_by:
  - tactic-attention-surface-signal-types
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# velocity and pace signals — host-side velocity series folded into the office-hours snapshot; pace-telemetry adapter for the frontier-economy condition

## Context

Both signals belong to `strategy-autonomous-execution`. Velocity — tactics
created vs closed, backlog growth by subtree; the author's original
question was "are we creating tactic nodes for claude code to close faster
than claude is closing them, and where is the backlog growing" — reads the
store's own history, which the browser cannot derive (no git). Strategy
clarification 7 resolves this host-side: the office-hours-snapshot
producer folds a velocity series into `office-hours-current.benc`.
Pace/token spend reads the local pace-telemetry files against the
frontier-economy condition (strategy clarification 4). Requirement anchor
restored from the original request: the velocity views follow the legacy
WIP-queue visualization and metrics.

## Unit 1 — producer velocity series

**Recommended model:** opus

Scope:
- New step in the office-hours-snapshot producer pipeline
  (`office-hours-snapshot/src/produce.ts`): derive a weekly series from
  the local clone's `intentions/` git history — nodes created, nodes
  pruned (`phase: done`), phase transitions — per top-level strategy
  subtree, plus the net backlog delta per subtree.
- Same derivation family as the graph-native lifecycle sensor
  (`tactic-dispatch-lifecycle-sensor`,
  `packages/intentionsutil/scripts/read-sensors.ts`): share the parsing
  helper if that tactic has landed; otherwise implement standalone here
  and leave a fold-in note on that tactic's plan.
- Fold the series into the `office-hours-current.benc` payload
  (`office-hours-snapshot/src/persist.ts` `CURRENT_FILENAME`); extend the
  snapshot schema and parity tests (`parity.ts`, `snapshot.test.ts`,
  `produce.test.ts`).

## Unit 2 — velocity and pace signal types

**Recommended model:** sonnet

Scope:
- Velocity signal type owned by `strategy-autonomous-execution`
  (success_signal — the attention-economics signal): compact view =
  created-vs-closed trend and the fastest-growing subtree; context view
  reuses the legacy WIP-queue visualization pattern
  (`office-hours/src/queue-metrics-panel.ts`,
  `office-hours/src/components/QueueMetricsPanel.tsx`,
  `office-hours/src/worker-history-chart.ts`).
- Pace/token signal type owned by `strategy-autonomous-execution`'s
  frontier-economy condition: adapter over a directory handle to
  `~/.local/share/commons-dispatch/` (`rate_limits.json` — path
  documented in
  `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers`)
  plus the shared `dispatch.config/target-workers.json`; compact view =
  weekly spend vs the pace curve; context view reuses
  `office-hours/src/pace-position.ts` and
  `office-hours/src/components/PacePanel.tsx`.

## Dependencies

- `tactic-attention-surface-signal-types` — the registry contract.

## Reuse

Listed per unit above; both signal types register through
`office-hours/src/signals/registry.ts`.

## Verification

```verify
npx vitest run --project office-hours-snapshot --root . || exit 1
npx vitest run --project office-hours --root .
```

Manual: run the producer against this clone — the snapshot gains a
velocity series whose created/closed counts match a hand `git log`
sample; the pace signal's weekly figure matches
`dispatch-target-workers --explain` output.

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree edits.

---
id: tactic-attention-surface-signal-types
kind: tactic
statement: typed signal model — signal-type registry with compact and context
  views, owning-node attribution, budget/snapshot/analytics adapters
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-03 by /align-tactics round 1, split: the velocity
  series and pace-telemetry adapter moved to
  tactic-attention-surface-velocity-pace (they add a producer-side deliverable);
  this leaf carries the registry contract and the adapters whose sources already
  exist."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by:
    - tactic-attention-surface-graph-read
---
# typed signal model — signal-type registry with compact and context views, owning-node attribution, budget/snapshot/analytics adapters

## Context

Strategy clarification 2: signals are of a type; each type carries a
compact view (list row) and a context view (context panel). This leaf
defines the registry contract every signal plugs into, plus the adapters
whose local sources already exist (budget `.benc`, office-hours snapshot,
analytics exports). The velocity series and pace-telemetry adapter were
split to `tactic-attention-surface-velocity-pace`. Sources are
non-versioned files on local disk and network shares; an unreachable
source fails loudly per the recorded strategy condition.

## Unit 1 — registry contract

**Recommended model:** opus

Scope:
- New `office-hours/src/signals/registry.ts`: `SignalType = { typeId,
  owningNode: { id, signalKind: "success_signal" | "condition" },
  sourceAdapter, CompactView, ContextView }`, plus a `SignalReading`
  shape (values, timestamp, source path, freshness) returned by adapters.
- Rank: a signal's rank is `resolveAttention` of its owning node from the
  graph-read layer (`office-hours/src/graph-source.ts`); a non-null `gap`
  on the owning node floats the signal within its rank tier. The
  status-page tactic consumes this ordering — define it here, render it
  there.
- Owning-node attribution is validated against the loaded graph at render
  time — an unknown node id is a loud per-signal error, not a hidden row.

## Unit 2 — budget adapters

**Recommended model:** sonnet

Scope: runway and dollar-spend signal types owned by
`strategy-financial-sustainability` (success_signal — "projected runway"
is literally its observable). Adapter reads the budget `.benc` snapshots
from the share directory handle, reusing decryption in
`office-hours/src/snapshot.ts` + `office-hours/src/crypto.ts` and the
read pattern of `budget/src/local-file.ts`. Compact view: current runway
months and month-to-date spend; context view feeds
`BudgetPaceChart` (wired by the status-page tactic).

## Unit 3 — office-hours snapshot adapter

**Recommended model:** sonnet

Scope: reminders, project-signals, and queue-health signal types read
from `office-hours-current.benc` via the existing
`office-hours/src/local-snapshot-source.ts`. Owning-node attribution
lives in one registry table (not scattered): queue health →
`strategy-graph-native-dispatch` (condition); project signals → the
strategy each entry names, defaulting to `strategy-attention-surface`;
reminders → `strategy-attention-surface` (surface-owned housekeeping).

## Unit 4 — analytics-exports adapter

**Recommended model:** sonnet

Scope: marketing/analytics signal types owned by
`strategy-promote-progressive-detachment` and `strategy-own-audience`,
reading the `projectSignals` section of `office-hours-current.benc`
(produced locally by `tactic-attention-surface-analytics-collector`,
which replaces the Firestore function; build and test against fixtures
until it lands — the wire shape is
`functions/src/project-signals-core.ts`). The attachment and its capture
posture are recorded in `intentions/delegation-web-analytics.md`.

## Dependencies

- `tactic-attention-surface-graph-read` — owning-node lookup and rank.

## Reuse

- `office-hours/src/snapshot.ts`, `crypto.ts`, `local-snapshot-source.ts`.
- `budget/src/local-file.ts` read pattern.
- `resolveAttention` via `@commons-systems/intentionsutil/graph`.

## Verification

```verify
npx vitest run --project office-hours --root .
```

Manual: with real share files granted, each registered signal renders a
reading with its owning node id and source path; unplug a source and
confirm a loud per-signal error state rather than a stale value.

## Implementation notes

Four units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree edits.

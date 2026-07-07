---
id: tactic-attention-surface-goals-page
kind: tactic
statement: "goals page — direct graph exploration views: virtues, subtree shape,
  delegation and capture, attention, router now/queue, office-hours queue"
owner: ai
status: codified
parent: null
rationale: Finalized 2026-07-03 by /align-tactics round 1. Consumes the retained
  draft of the same id; the six views map one-to-one to the author's exploration
  questions recorded in the strategy rationale.
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
  - tactic-attention-surface-graph-read
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# goals page — direct graph exploration views: virtues, subtree shape, delegation and capture, attention, router now/queue, office-hours queue

## Context

Strategy tooling goal 2: six exploration views, mapping one-to-one to the
author's questions recorded in the strategy rationale — core virtues and
strategies; the shape of the graph and which strategies are most
developed; where delegation and capture concentrate; where attention
resolves; what the router is executing and queuing; what is in the
office-hours queue. All views are projections of the clone-read graph
(`office-hours/src/graph-source.ts`); no GitHub queries, per the recorded
condition that `strategy-graph-native-dispatch` holds and orchestration
state is readable from the store.

## Unit 1 — page shell and structure views

**Recommended model:** opus

Scope:
- Goals route wired into the DS two-page navigation
  (`packages/ds/src/templates/OfficeHours.tsx` `page` prop;
  `office-hours/src/components/NavControls.tsx`).
- Virtues/strategies view: virtue roots and their `serves` edges — extend
  `office-hours/src/components/IntentionTreePanel.tsx` and
  `office-hours/src/intention-tree.ts` `buildTree()`.
- Subtree development view: per-strategy node counts, status mix, and
  open-tactic phase mix — which strategies are most developed.
- Attention overlay: `resolveAttention` rank rendered on the tree with
  the `ResolvedAttention.sources` breakdown ("via strategy-x"
  explainability from `packages/intentionsutil/src/attention.ts`).

## Unit 2 — delegation and dispatch views

**Recommended model:** opus

Scope:
- Delegation/capture view: `recovers` edges plus delegation-node axes
  (divergence, irreversibility, classification) — where delegation
  concentrates and where capture is highest.
- Router now/queue view: executing = tactics with a non-draft `phase`
  (under `attributes` until the schema tactic promotes it); queue =
  eligible nodes in rank order. The router's selection log is optional
  input read when present (the graph-native selector is still in
  flight); absent, the view omits the "now" details behind a loud
  "selection log unavailable" label — it never guesses.
- Office-hours queue view: the projection over `office_hours != null`
  (reason, since), replacing the legacy Parked panel
  (`office-hours/src/components/ParkedIssuesPanel.tsx` is the seed);
  history/audit render as graph views per strategy clarification 6.

## Dependencies

- `tactic-attention-surface-graph-read`.

## Reuse

- `IntentionTreePanel.tsx`, `intention-tree.ts`,
  `ParkedIssuesPanel.tsx`, `resolveAttention` sources.

## Verification

```verify
npx vitest run --project office-hours --root .
```

Manual: against the real clone, each of the six author questions is
answerable within two clicks from the goals route.

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree edits.

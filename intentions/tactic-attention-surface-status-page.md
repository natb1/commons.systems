---
id: tactic-attention-surface-status-page
kind: tactic
statement: status page — one attention-ranked queue of typed signals with
  per-signal context panel
owner: ai
status: codified
parent: null
rationale: Finalized 2026-07-03 by /align-tactics round 1. Consumes the retained
  draft of the same id; the DS OfficeHours template stories are the
  design-canvas artifacts.
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
# status page — one attention-ranked queue of typed signals with per-signal context panel

## Context

Strategy tooling goal 1 and clarifications 2/6: the status page is one
attention-ranked queue of typed signals; every legacy dashboard panel
either became a signal type or moves to the goals page — the legacy
second page ceases to exist as a concept. The two-page shape follows the
DS OfficeHours design canvas; its stories are the design-canvas artifacts
this round iterates against.

## Unit 1 — DS template generalization

**Recommended model:** sonnet

Scope:
- `packages/ds/src/templates/OfficeHours.tsx` (`page: "status"`):
  generalize the Budgets card's clickable rows into generic signal rows —
  type name, compact reading slot, owning-node chip, freshness indicator —
  keeping the `ContextPanel`/`ContextPanelToggle` wiring
  (`packages/ds/src/templates/ContextPanel.tsx`).
- Update `packages/ds/src/templates/OfficeHours.stories.tsx` (`Status`,
  `StatusBudgetSelected`) and add a mixed multi-signal story. The stories
  are the canvas artifacts (DesignSync; the claude.ai/design canvas is
  stale until the project is opened/refreshed).

## Unit 2 — app status page

**Recommended model:** opus

Scope:
- The office-hours app renders the registry's signals
  (`office-hours/src/signals/registry.ts`) as one queue ordered by the
  owning node's `resolveAttention`; a non-null `gap` on the owning node
  floats the signal within its rank tier. Selecting a row opens the
  type's ContextView in the context panel (budget types render
  `packages/ds/src/charts/BudgetPaceChart.tsx`).
- Per-signal freshness and error states are loud; an unreachable source
  renders as a failed signal row, never a stale value.
- Replaces the legacy panel layout on the status route
  (`office-hours/src/Dashboard.tsx`, `App.tsx`); legacy panels that
  became signal types stop rendering as bespoke cards.
- Out of scope: the goals page (sibling tactic) and Firestore removal
  (`tactic-attention-surface-firestore-retire`).

## Dependencies

- `tactic-attention-surface-signal-types` (and transitively
  `tactic-attention-surface-graph-read`).

## Reuse

- DS `OfficeHours` template, `ContextPanel`, `BudgetPaceChart`.
- `office-hours/src/panel-equality.ts` and existing panel test patterns
  in `office-hours/test/`.

## Verification

```verify
npx vitest run --project packages/ds --root . || exit 1
npx vitest run --project office-hours --root .
```

Manual: DS stories via storybook (dev-server caveats per project memory:
`optimizeDeps` target, never kill a running storybook); the app against
real shares — the queue order matches host-side
`packages/intentionsutil/scripts/frontier-view.ts` rank for the owning
nodes.

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree edits.

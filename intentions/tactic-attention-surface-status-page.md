---
id: tactic-attention-surface-status-page
kind: tactic
statement: "draft: status page — attention-ranked signal queue with per-signal
  context panel"
owner: ai
status: raw
parent: null
rationale: "Draft retained from the 2026-07-03 /align-strategy interview per the
  retain-not-refine contract: tactical context only, no plan schema;
  /align-tactics finalizes, splits, merges, or prunes."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes: {}
---
# draft: status page — attention-ranked signal queue with per-signal context panel

Retained draft context (2026-07-03 interview + exploration). Not a plan.

- Generalize the design-system two-page proposal
  (`packages/ds/src/templates/OfficeHours.tsx`, `page: "status"`): the
  Budgets card's clickable rows become signal rows in one attention-ranked
  queue; every legacy panel either becomes a signal type or moves to the
  goals page (strategy clarification 6).
- Ordering: `resolveAttention` over each signal's owning node; threshold
  breaches (non-null `gap`) float within their rank tier.
- Context panel: reuse `packages/ds/src/templates/ContextPanel.tsx`
  (`ContextPanel`/`ContextPanelToggle`) and
  `packages/ds/src/charts/BudgetPaceChart.tsx` as the context view for the
  budget signal types; each signal type supplies its own context view per
  the typed-signal registry (tactic-attention-surface-signal-types).
- Canvas: the DS `OfficeHours.stories.tsx` stories (`Status`,
  `StatusBudgetSelected`) are the design-canvas artifacts for /align-tactics
  to iterate against via DesignSync (canvas is stale until the claude.ai
  project is opened/refreshed).

---
id: tactic-attention-surface-goals-page
kind: tactic
statement: "draft: goals page — direct graph exploration views"
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
# draft: goals page — direct graph exploration views

Retained draft context (2026-07-03 interview + exploration). Not a plan.

Views, each answering one of the author's exploration questions:

- Core virtues and strategies: virtue roots with their `serves` edges —
  seed exists in `office-hours/src/components/IntentionTreePanel.tsx` and
  `intention-tree.ts` `buildTree()`.
- Shape and development: per-strategy subtree statistics (node counts,
  status mix, tactic churn) — which strategies are most developed.
- Delegation and capture: `recovers` edges plus delegation-record axes
  (divergence/irreversibility) — where delegation concentrates and where
  capture is highest.
- Attention: resolved-rank overlay (`resolveAttention`; cf. the
  frontier-view tooling goal on strategy-graph-drives-dispatch).
- Router now/queue: persisted `phase` fields, the claimed set, and the
  selection log (graph-native dispatch §3) — what is executing, what is
  queued, in rank order.
- Office-hours queue: the projection over `office_hours != null` nodes
  (graph-native dispatch §1.3), replacing the legacy Parked panel; history
  and audit render as graph views here too (strategy clarification 6).

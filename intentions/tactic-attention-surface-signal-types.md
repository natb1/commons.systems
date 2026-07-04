---
id: tactic-attention-surface-signal-types
kind: tactic
statement: "draft: typed signal model — signal-type registry with compact and
  context views, local file adapters, owning-node attribution"
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
# draft: typed signal model — signal-type registry with compact and context views, local file adapters, owning-node attribution

Retained draft context (2026-07-03 interview + exploration). Not a plan.

- Author decision (strategy clarification 2): signals are of a type; each
  type carries a compact view (list row) and a context view (context
  panel). Registry entry shape, roughly: `{ typeId, owningNode:
  {id, signalKind: success_signal | condition}, sourceAdapter, CompactView,
  ContextView }`.
- Source adapters read non-versioned local/network-share files:
  - budget `.benc` snapshots (runway + dollar spend →
    strategy-financial-sustainability; reuse `budget/src/local-file.ts`
    patterns and `office-hours/src/snapshot.ts` + `crypto.ts` decryption);
  - `office-hours-current.benc` from the `office-hours-snapshot/` local
    producer (reminders, queue metrics, project signals);
  - pace telemetry (`rate_limits.json`, target-workers config) →
    strategy-autonomous-execution's frontier-economy condition;
  - analytics exports (GA4/GSC/PSI, per delegation-web-analytics) →
    strategy-promote-progressive-detachment / strategy-own-audience.
- Velocity (created vs closed, backlog growth by subtree) computes from the
  store itself — phase-transition history in the `intentions/` git log and
  the router selection log (see tactic-dispatch-lifecycle-sensor). Open
  question for /align-tactics: the browser cannot run git; either the
  office-hours-snapshot producer folds a velocity series into the snapshot,
  or the clone-read layer derives it from node state alone.
- Reminders, project signals, and queue health from the legacy dashboard
  become signal types here (strategy clarification 6).

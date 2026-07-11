---
id: tactic-budget-display-input-edges
kind: tactic
statement: 'budget app: render UTC-midnight transaction dates in UTC (not
  toLocaleDateString) and stop Number("")->0 blur-saves clobbering cleared
  inputs'
owner: ai
status: codified
parent: null
rationale: 'Surfaced by the 2026-07-05 review. The budget math layer is
  correctly UTC throughout, but three display sites render UTC-midnight
  timestamps with toLocaleDateString() (previous-day for users west of UTC), and
  several blur-save handlers coerce a cleared field through Number("")->0,
  silently persisting allowance/priority/reimbursement 0. Serves
  strategy-complete-ledger: the ledger the user reads and edits must match the
  ledger stored. Re-pointed strategy-complete-ledger -> strategy-recover-finance
  2026-07-06 per the placement doctrine: complete-ledger is the
  delegation/attachment ledger (every live delegation carries a record), not the
  financial one; the budget app/etl artifact belongs to
  strategy-recover-finance.'
reading: null
gap: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-budget-display-input-edges
  pr: 2826
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 3178ea5e04e119ed9cce5cb1e0b573e7e011aef2e70dbd39c0449a854a61a204
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# budget app: UTC date rendering + cleared-input blur-saves

## Context

The budget math layer is UTC-consistent, but the display/input edges leak
local-time bugs and coerce cleared fields to 0. Verified 2026-07-05;
`home-chart.ts:148-151` shows the codebase's correct UTC rendering idiom.

## Unit 1 — render UTC-midnight dates in UTC

**Recommended model:** sonnet

Scope:
- `budget/src/pages/home.ts:18`, `account-view-model.ts:97`,
  `AccountsReconcile.tsx:116`: replace `toLocaleDateString()` on
  UTC-midnight transaction timestamps with the UTC idiom, so a txn dated
  2025-01-22 renders "1/22/2025" for users west of UTC (currently "1/21").

## Unit 2 — guard cleared numeric inputs on blur

**Recommended model:** sonnet

Scope:
- `budget/src/pages/use-budget-table.ts:105-110`, `use-rules-table.ts:89-91`,
  `use-transaction-table.ts:304-310`: blur handlers coerce an emptied input
  through `Number("")` -> 0 and persist it (allowance 0, priority 0 =
  top precedence, reimbursement 0%). Guard `raw === ""` as
  `AccountsReconcile.tsx:507-513` already does.

## Verification

- Unit tests for the UTC formatter across a west-of-UTC offset and for the
  empty-input guard on each table; visual check in the app.

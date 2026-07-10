---
id: tactic-budget-week-axis-consistency
kind: tactic
statement: "budget app: unify the Monday-start and Sunday-start week conventions
  in the aggregate trend calculation, and stop the override-row add flow from
  silently clobbering an existing same-date override"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 code review, previously misfiled in
  tactic-review-low-severity-sweep at higher severity than a low sweep warrants
  (both units were rated medium). Serves strategy-complete-ledger: the ledger's
  aggregate trend and override history must be internally consistent, not
  silently skewed or clobbered. Re-pointed strategy-complete-ledger ->
  strategy-recover-finance 2026-07-06 per the placement doctrine:
  complete-ledger is the delegation/attachment ledger (every live delegation
  carries a record), not the financial one; the budget app/etl artifact belongs
  to strategy-recover-finance."
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
  branch: tactic-budget-week-axis-consistency
  pr: 2829
  attempts: {}
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# budget app: unify week conventions and fix override-row clobber

## Context

Two verified budget-app correctness defects (2026-07-05), both rated medium
and previously misfiled in the low-severity sweep. Root cause of Unit 1: two
competing week conventions coexist in `balance.ts` — Monday-start `weekStart`
(`:16`) and Sunday-start `toSundayEntry` (`:388`) — bridged ad hoc at every
seam.

## Unit 1 — unify the week axis in computeAggregateTrend

**Recommended model:** sonnet

Scope:
- `budget/src/balance.ts:427-428`: in `computeAggregateTrend`, spending is
  keyed by the period's Monday-start week but credits by
  `toSundayEntry(txn.timestamp)`, so a Sunday-dated credit lands one week
  later than the Monday-aligned period containing it, misaligning
  `avg12Credits`/`avg12NetCredits` against `avg12Spending` for
  weekend-dated credits.
- `balance.ts:420-432`: `computeAggregateTrend` derives its week axis
  solely from budget periods, so a credit (paycheck) falling in a week
  with no budget period in any budget is silently dropped from the
  12-week credit average; the sibling `computePerBudgetTrend`
  (`balance.ts:463-466`) registers extra weeks for exactly this case, so
  this is an asymmetry to fix, not an intentional convention.
- Pick one week convention for the whole aggregate-trend computation
  (recommend Monday-start, matching the budget period convention) and
  register extra weeks the same way `computePerBudgetTrend` already does.

## Unit 2 — stop override-row add from silently clobbering

**Recommended model:** sonnet

Scope:
- `budget/src/pages/budgets-hydrate.ts:378,393` +
  `use-budget-table.ts:243,285-286`: override rows are deduped by
  `dateMs` (last wins), and "Add Override" inserts a today-dated row with
  balance `0` and saves immediately, silently clobbering an existing
  same-date override with `$0` while the DOM still shows both rows until
  the next reload. Before inserting, check for an existing override at
  the same `dateMs` and either surface a confirmation or edit the
  existing row in place instead of silently overwriting it.

## Verification

- A weekend-dated credit contributes to the correct 12-week average week;
  a credit in a period-less week is not dropped from the aggregate credit
  average. Adding an override on a date that already has one either warns
  the user or edits in place — it never silently zeroes an existing entry.

---
id: tactic-budget-overlap-anchor-merge
kind: tactic
statement: "budget-etl: accept overlapping same-month balance anchors — keep the
  latest as-of date, log the reconciliation delta"
owner: ai
status: codified
parent: null
rationale: "Planned by the 2026-07-06 /align-tactics round from
  strategy-recover-finance's overlapping-evidence clarifications:
  dedupStatementData's one-balance-per-account-month hard error blocked the
  2026-07 monthly sync on mutually consistent overlapping exports. Surface,
  don't gate (strategy clarification 2)."
reading: null
gap: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-budget-overlap-anchor-merge
  pr: 2812
  attempts: {}
  markers: []
  strategy_fingerprint: 3178ea5e04e119ed9cce5cb1e0b573e7e011aef2e70dbd39c0449a854a61a204
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# budget-etl: accept overlapping same-month balance anchors — keep the latest as-of date, log the reconciliation delta

## Context

strategy-recover-finance's 2026-07-06 clarifications: statement exports are
overlapping evidence — multiple balance observations may land in the same
account-month, and disagreement between them is surfaced, never a merge
failure. Today `dedupStatementData` (projects/budget-etl/pipeline.go:65)
hard-errors when two statements share a StatementID
(`{institution}-{account}-{YYYY-MM}`, internal/parse/parse.go:44; period
inferred from the export's LEDGERBAL DTASOF month via `InferPeriod`,
internal/parse/parse.go:239) with different balances — the 2026-07 monthly
sync failed on exactly this, with overlapping exports that were mutually
consistent. The export schema keys statement docs one-per-month
(`StatementDocID`, internal/budget/budget.go:33), so until anchors are keyed
by as-of date (sibling tactic tactic-budget-balance-observations) the month's
exported anchor is the latest-as-of observation. The budget app's divergence
surface (budget/src/balance.ts `computeNetWorth`) is where any residual
disagreement is adjudicated — no tolerance constant in the merge.

## Unit 1 — resolve same-month anchor collisions by latest as-of date

**Recommended model:** sonnet

Scope — `dedupStatementData`, projects/budget-etl/pipeline.go:60-94. When two
`budget.StatementData` share a StatementID and their balances differ:

- Keep the entry with the later `BalanceDate` (`*time.Time`,
  internal/budget/budget.go:18); a nil `BalanceDate` loses to a non-nil one.
- Log one line naming both source files, both balances, and the delta (log
  output stays on the operator's machine — amounts are fine there, never in
  committed artifacts).
- Preserve existing behavior otherwise: equal-balance duplicates silently
  dropped; two entries with different balances and both `BalanceDate` nil (or
  equal) stay an error — there is no basis to choose.
- First-seen output order is preserved; when a later entry replaces an earlier
  survivor it takes the earlier entry's position.

Callers stay unchanged: main.go:191-193 (report path) and main.go:1231-1233
(merge path). Out of scope: statement-doc keying
(tactic-budget-balance-observations), transaction identity
(tactic-budget-txn-identity).

## Dependencies

None.

## Reuse

Table tests in `TestDedupStatementData`,
projects/budget-etl/pipeline_test.go:219 — extend the table with: later
as-of arrives second (replacement), later as-of arrives first (kept),
nil-vs-set BalanceDate, both-nil disagreement still errors, order
preservation.

## Verification

```verify
go -C projects/budget-etl test ./...
```

Manual: run the monthly sync (`/budget`; scripts under
.claude/skills/budget/scripts/) against a statements archive containing two
same-month exports for one account — the merge succeeds, the log carries the
reconciliation-delta line, and the exported anchor is the later observation.

## Implementation notes

Single unit; implement in a subagent with `model: sonnet`; supply this
Context and Scope; constrain to working-tree edits.

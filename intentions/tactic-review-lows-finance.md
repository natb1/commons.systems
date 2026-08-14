---
id: tactic-review-lows-finance
kind: tactic
statement: "2026-07-05 review lows: budget app + budget-etl (retained draft context)"
owner: ai
status: raw
parent: null
rationale: Retained draft context — undecomposed work whose next step is an
  /align-tactics session, not executable phase work. (The router DOES select a
  draft, at the align-tactics rung; the original 'not selectable work' wording
  was the stale claim corrected 2026-08-14 per
  tactic-align-skill-draft-selectability-stale-prose.) Split 2026-07-06 out of
  the deleted mixed sweep tactic-review-low-severity-sweep per the placement
  doctrine (strategy-graph-native-dispatch), so this strategy's /align-tactics
  rounds find their own residue. Findings are from the 2026-07-05 code review,
  each verified with an anchor.
reading: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# 2026-07-05 review lows: budget app + budget-etl (retained draft context)

## Context

Retained draft context — undecomposed work whose next step is an
`/align-tactics` session, not executable phase work. (The router **does**
select a draft, emitting it at the `align-tactics` rung; the original "not
selectable work" wording here was the stale claim corrected 2026-08-14 per
tactic-align-skill-draft-selectability-stale-prose.) Split 2026-07-06 out of the
deleted mixed sweep `tactic-review-low-severity-sweep` per the placement
doctrine on `strategy-graph-native-dispatch`. Each line is a confirmed
finding from the 2026-07-05 review with an anchor. A later `/align-tactics`
round on `strategy-recover-finance` finalizes, splits, merges, or prunes.

## budget app

- `use-app-state.ts:318` vs `:275`: empty-string password treated as an
  encrypted session on load but truthy-checked on export -> manual export
  silently writes unencrypted `.json`.
- `entities/budget.ts:194`: `parseRawBudget` passes `name` through
  unvalidated -> literal `undefined` series label instead of a clear error.
- `idb.ts:114` / `upload.ts:101-113`: duplicate ids in an uploaded export
  silently collapse (IDB put last-wins); no uniqueness validation.
- `balance.ts:193-259`: `computeBudgetBalance` is dead code re-implementing
  money logic already in `computeAllBudgetBalances`.
- `pages/account-view-model.ts:32-36,78`: all-null-timestamp accounts get
  `maxTs=0` -> "12/31/1969" sorted first.
- `pages/budgets-hydrate.ts:185-186,240-245,371`: non-array parse throws
  raw TypeError (skips DataIntegrityError path); module-level
  `scrollAbort` shared across hydrators.
- `pages/statement-source-view.ts:222,227,241`: bare catch blocks bypass
  `classifyError`.
- missing test: `pages/accounts-cash-flow-chart.ts` (computes its own rolling
  averages, no unit test).
- `LegacyRoute.tsx` + `legacy-hydrate.ts`: dead production code.
- `pages/Accounts.tsx:387-415`: ~25 lines duplicated from `wireChartResize`
  with a stale justifying comment.

## budget-etl (Go)

- `internal/export/export.go:440-452`: atomic snapshot write renames without
  `Sync()` (power-loss truncation risk on the only encrypted snapshot).
- `internal/parse/csv.go:45`: truncated metadata row silently records
  balance 0 / zero date.
- `internal/parse/parse.go:229` + `main.go:1481`: `Balance int64` conflates a
  real $0.00 with "absent" -> paid-off card gets no balance history.
- `internal/journal/journal.go:41,306`: `centTolerance=1` can only create
  false transfer merges (amounts are exact integer cents).

## firestore rules (transactions)

- `firestore.rules:52-54` vs `:77-79`: the transactions-rule comment
  ("updates limited to note, category, reimbursement, budget, and
  normalization fields") drifted from the rule, which also permits
  `statementItemId`/`journalEntryId` rewrites (type-checked only, not
  pinned) — intentional (the reconcile flow needs it) but the comment
  under-states the mutable surface reviewers actually read as the
  security contract.

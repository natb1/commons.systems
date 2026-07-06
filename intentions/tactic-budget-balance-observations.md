---
id: tactic-budget-balance-observations
kind: tactic
statement: "budget-etl + budget app: balance anchors keyed by as-of date — all
  overlapping observations exported, app tolerates multiple per month"
owner: ai
status: codified
parent: null
rationale: "Completes strategy clarification 2's greenfield: anchors are
  observations keyed by (institution, account, as-of date), so no information is
  dropped when exports overlap; the interim latest-wins resolution in
  tactic-budget-overlap-anchor-merge becomes exact-key semantics. Off the
  minimum signal path this round; selectable on its own merits."
reading: null
gap: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-budget-balance-observations
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: fa35bb299f783f335f3ec88462c06db38747e4a2e5892dd30120ff997bfbceb1
validates: []
blocked_by:
  - tactic-budget-overlap-anchor-merge
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# budget-etl + budget app: balance anchors keyed by as-of date — all overlapping observations exported, app tolerates multiple per month

## Context

budget-etl keys balance anchors one-per-account-month:
`StatementFile.StatementID()` returns `{institution}-{account}-{YYYY-MM}`
(projects/budget-etl/internal/parse/parse.go:44), the export doc ID hashes
that string (internal/budget/budget.go:33), and `dedupStatementData`
(pipeline.go:65) collapses to one anchor per ID. This tactic re-keys anchors
as observations by (institution, account, as-of date) so multiple anchors per
month are all exported — completing strategy clarification 2's greenfield
after tactic-budget-overlap-anchor-merge's interim latest-wins resolution.
The app's balance math is already multi-anchor-native (`statementEffectiveMs`
prefers `balanceDate`, budget/src/balance.ts:580; `computeNetWorth` uses all
anchors sorted by effective ms, balance.ts:757-791;
`AccountsReconcile.statementEndingBalance` already reduces same-period
statements by `balanceDate`, budget/src/pages/AccountsReconcile.tsx:123-137),
so app changes are surgical. Transaction keying is out of scope here: a
transaction's `statementId` field stays the monthly ID
(tactic-budget-txn-identity owns transaction identity; if it has not landed
yet, `TransactionDocID` also still hashes the monthly ID — either way this
tactic must not touch it, or preserved edits would orphan).

## Unit 1 — ETL: date-keyed anchor observations (Go)

**Recommended model:** opus

Scope (projects/budget-etl):

- New anchor key: add a helper in internal/budget/budget.go beside
  `StatementDocID` (budget.go:33), e.g. `AnchorID(institution, account string,
  balanceDate *time.Time, period string) string` →
  `{institution}-{account}-{YYYY-MM-DD}`, using `BalanceDate` when present,
  else the last day of `Period` (deterministic fallback for formats without
  DTASOF). `buildStatementData` (main.go:1549) sets
  `StatementData.StatementID` from this helper; `Period` stays `YYYY-MM` for
  display/grouping; `buildExportStatements` (main.go:1573) is unchanged
  structurally — `ID = StatementDocID(anchorID)`.
  `parse.StatementFile.StatementID()` (parse.go:44) is left monthly and
  remains the seed for the transaction `statementId` field — document this
  split in both doc comments.
- `dedupStatementData` (pipeline.go:65) becomes keep-all-distinct-observations:
  dedupe only on identical anchor ID; equal-balance dups dropped; same-key
  different-balance keeps the interim fix's resolution/logging (same as-of
  date now, so tie-break deterministically — e.g. lexicographically-later
  `SourceFile` wins — and log the delta). No error path for cross-date
  disagreement: those are now distinct observations.
- `deriveMonthlyStatements` (main.go:1464): derived virtual anchors already
  carry `BalanceDate` = last day of month (main.go:1526-1537); key them
  through the same `AnchorID` helper. Guard against doubling: gap-fill in
  `mergeStatements` (main.go:1424-1432) must skip a virtual anchor when ANY
  real observation exists for the same (institution, account, period) — track
  `covered` per account-month, not per statement ID — since a real mid-month
  observation and a month-end virtual anchor no longer share an ID.
- Migration in `mergeStatements` (main.go:1378): normalize non-virtual input
  (prior-snapshot) statements to the new keying on read — recompute anchor ID
  + doc ID via the same helper (old docs carry `balanceDate` when it existed,
  so a re-parsed file with the same DTASOF collides to the same key and dir
  wins via exact-key priority). Additionally drop a legacy input observation
  lacking `balanceDate` when a real dir observation covers the same
  (institution, account, period) — it is a stale monthly representation of a
  re-parsed file; keeping it would double the month's anchors. Virtual input
  statements stay dropped (main.go:1411).
- Rule-generated virtual statements (main.go:402-413) keep their
  `{prefix}{YYYY-MM}` IDs — zero-balance grouping markers, not balance
  observations.
- Tests: update pipeline_test.go (dedup table ~:321) for keep-all semantics;
  main_test.go merge tests (~:844, :1272, :1325) for migration/no-doubling
  (two same-month files with distinct DTASOF → two exported anchors; old
  monthly snapshot doc + re-parse → one); derive tests (:1041-:1198) for
  per-month gap-fill; parse_test.go TestStatementID unchanged.

Out of scope: transaction keying, journal build, patch.go/dump.go,
statement-items, rules.

## Unit 2 — App: tolerate multiple statement docs per account-month (TypeScript)

**Recommended model:** sonnet

Scope (budget/src), depends on Unit 1's ID format:

- budget/src/pages/statement-source-view.ts:194 —
  `statements.find((s) => s.statementId === statementId)` matches a
  transaction's monthly `statementId` against now date-keyed statement IDs.
  Fix: exact match first, else statements where
  `s.statementId.startsWith(txnStatementId + "-")`, preferring the latest
  `balanceDate` with a non-null `sourceFile`.
- budget/src/pages/account-view-model.ts:39-47 — the latest-statement pick
  compares only `period` strings; equal periods tie arbitrarily (first wins).
  Tie-break by `balanceDate ?? ""` (zero-padded ISO, lexicographic =
  chronological) so the newest observation's balance shows.
- Verify-no-change (anchor with tests, don't modify): balance.ts
  `computeNetWorth`/`computeDerivedBalances` with two same-period anchors
  (span>0 guard at balance.ts:862 covers identical-ms anchors);
  AccountsReconcile.tsx:123-137 already reduces by `balanceDate`;
  entities/statement.ts treats `statementId` as an opaque string (no format
  validation in parseRawStatement, statement.ts:118); reconcile-hints.ts uses
  statement items only; statement-file-resolver.ts is path-only; idb/
  data-source key rows by `id` (unique per observation).
- Tests: extend budget/test/balance.test.ts with multi-anchor-same-month
  cases; add cases to the account-view-model and statement-source-view suites
  for the tie-break and prefix lookup.

Out of scope: net-worth chart rendering, income-statement, upload schema
changes, seeds format.

## Dependencies

- tactic-budget-overlap-anchor-merge lands first; Unit 1 rewrites its
  resolution logic into exact-key semantics.
- Unit 2 depends on Unit 1 (ID format contract). Ship ETL and app together
  before the next snapshot merge; the app tolerates old snapshots (monthly
  IDs still parse as opaque strings), but the source-view prefix fix should
  ship with or before the new keying.

## Reuse

- `budget.StatementDocID` (internal/budget/budget.go:33) — unchanged hashing,
  new input string.
- `accountKey` (main.go:1438) for the per-month `covered` map;
  `buildExportStatements` (main.go:1573) unchanged.
- App: `statementEffectiveMs`/`groupStatementsByAccount` (balance.ts:580,
  :590) and `statementEndingBalance` (AccountsReconcile.tsx:123) already model
  observations — no new abstractions.

## Verification

```verify
go -C projects/budget-etl test ./...
```

```verify
npx vitest run --project budget --root .
```

Manual: run the ETL merge on the operator's machine against a copy of the
real snapshot with two exports of one account-month at different DTASOF —
the output contains both anchors, historical months are not doubled (count
statements per account-month before/after), the accounts page shows the
latest observation's balance, the net-worth chart renders without new
divergence warnings, and "view source" on a transaction still opens its
statement file.

## Implementation notes

Implement each unit in a subagent with the unit's model (`opus` for Unit 1,
`sonnet` for Unit 2); supply this Context and the unit's Scope; constrain to
working-tree edits.

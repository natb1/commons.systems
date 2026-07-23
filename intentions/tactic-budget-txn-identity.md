---
id: tactic-budget-txn-identity
kind: tactic
statement: "budget-etl: statement-independent transaction identity —
  (institution, account, FITID) doc IDs, with legacy-ID migration and edit
  remapping"
owner: ai
status: codified
parent: null
rationale: "Strategy clarification 3 (2026-07-06): a transaction is identified
  by (institution, account, FITID), independent of which export carried it.
  Today's doc ID embeds the carrying export's inferred month, so overlapping
  exports whose balance dates land in different months silently duplicate shared
  transactions. Off the minimum signal path this round; selectable on its own
  merits."
reading: null
gap: null
serves:
  - strategy-recover-finance
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-budget-txn-identity
  pr: 2832
  attempts: {}
  markers:
    - reviewed
  strategy_fingerprint: 3178ea5e04e119ed9cce5cb1e0b573e7e011aef2e70dbd39c0449a854a61a204
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  phase: main-qa
---
# budget-etl: statement-independent transaction identity — (institution, account, FITID) doc IDs, with legacy-ID migration and edit remapping

## Context

`TransactionDocID` hashes `StatementID + "/" + FITID`
(projects/budget-etl/internal/budget/budget.go:82), and StatementID embeds a
month inferred from each export's balance date, so two overlapping exports of
the same account can give one bank transaction two doc IDs — silent
duplicates, today only mitigated after the fact by autoNormalize (see
main_test.go:890). Per strategy clarification 3 (2026-07-06), identity must
become `(institution, account, FITID)`. Complication found in planning: the
snapshot does NOT persist the FITID — `export.Transaction`
(internal/export/export.go:150-165) stores only the hashed `id` and
`statementId` — so legacy IDs are recoverable only by re-hashing the
still-present statement files, not from the snapshot alone.

## Unit 1 — new ID scheme at all computation sites (+ CSV story)

**Recommended model:** sonnet

Scope:

- internal/budget/budget.go:82 — replace with
  `TransactionDocID(institution, account, transactionID string)` = truncated
  sha256 of `institution + "/" + account + "/" + transactionID`; add
  `LegacyTransactionDocID(statementID, transactionID)` (old formula, exported
  for Unit 2 and tests). Keep the empty-input panic.
- Call sites computing IDs from parsed files: pipeline.go:118
  (`buildTransactions`), main.go:208 (`runOutputJSON`), main.go:1027
  (`parseAndClassify`), internal/journal/journal.go:118 (nil-docIDs fallback;
  only nil-docIDs caller is main.go:223). Institution/Account are available at
  every site (`pf.sf.Institution/Account`, `txn.Institution/Account`).
- patch.go:151 — uses `TransactionDocID("x","y")` only for length; update
  arity. `docIDPattern` (patch.go:31) is format-only, unchanged.
- Paths that pass stored IDs through opaquely need no change: runInputJSON
  (main.go:524-544, `TransactionID: t.ID`, explicit docIDs to journal.Build at
  main.go:609) and the input-only branch of runMerge (main.go:1280-1294).
- Virtual transactions (main.go:376, `"virtual-" + txnDocIDs[i]`): derived IDs
  shift once when source IDs shift; they are regenerated every run and skipped
  on input (main.go:1272), so no migration needed — note this in a comment.
- CSV story (state explicitly): internal/parse/csv.go:100-137 takes the
  bank-provided ID from column 5; suffixes (`X-2`, `X-3`…) are synthesized
  only for within-file duplicates, deterministically from file content, so
  re-exports containing the same rows get the same suffixed IDs and
  statement-independent identity holds. Accepted limitation: if a bank reuses
  one ID for two distinct transactions and the two occurrences land in
  different overlapping exports, each file sees it once, no suffix is
  synthesized, and the rows falsely collapse (previously they only collapsed
  when the two exports inferred the same month). Document this in the parseCSV
  doc comment and pin it with a test.
- Update existing tests that construct old-form IDs:
  internal/budget/budget_test.go:45-80, pipeline_test.go:74,
  main_test.go:557-913 and :1346-1452, internal/journal/journal_test.go,
  patch_test.go:88, dispatch_test.go.
  TestRunMergeCrossStatementDuplicateJournalAggregatesAgree (main_test.go:890)
  now collapses the pair at identity level — assert a single transaction row
  and a single journal credit instead of a normalized pair.

New tests: doc ID independent of statementID/period (same
institution/account/FITID from two files with different inferred months → one
row from `buildTransactions`); distinct across accounts and institutions;
journal.Build nil-docIDs fallback uses the new scheme; CSV cross-file
duplicate-base-ID limitation test.

Out of scope: snapshot migration (Unit 2); the budget web app (reads IDs
opaquely from the snapshot).

Reuse: `buildTransactions` visit callback (pipeline.go:108) already
centralizes dedup; test fixture helpers (`writeCSVFixtureMeta` etc.) in
main_test.go.

Verification:

```verify
go -C projects/budget-etl test ./...
```

## Unit 2 — legacy-ID migration, edit remapping, duplicate collapse

**Recommended model:** opus

Scope:

- New helper (main.go or a new migrate.go):
  `buildLegacyRemap(parsed []parsedFile) map[string]string` — for every parsed
  transaction, map `LegacyTransactionDocID(pf.sf.StatementID(),
  t.TransactionID)` → new ID. Period inference is deterministic on file
  content, so this reproduces every legacy ID whose source file is still in
  the statements dir, including divergent-month duplicates (each file
  reproduces the legacy ID it originally minted).
- New helper `migrateSnapshotIDs(inp *export.Output, remap map[string]string)`
  rewriting in place: `inp.Transactions[i].ID`, and `inp.Rules[j].TransactionID`
  for transaction-specific rules (split at main.go:644-647; these are the
  persisted categorization edits written by the patch flow, patch.go:146). Run
  it immediately after `export.ReadFile` in `runMerge` (main.go:1198) and
  after parsing inside `parseAndClassify` (before `inputIDs` is built at
  main.go:1015) so the report never flags legacy-covered transactions as new.
  Idempotency: a remap miss is identity — already-migrated snapshots and
  new-scheme IDs pass through untouched; running merge twice yields
  byte-identical transaction IDs.
- Duplicate collapse inside `migrateSnapshotIDs`: when two snapshot rows remap
  to the same new ID, keep one row; edits policy — a non-empty edit (`Note`
  non-empty, `Reimbursement` non-zero, per-field) beats an empty one; if both
  rows carry conflicting non-empty values for the same field, the row
  appearing later in the snapshot's Transactions array wins and a warning is
  logged. Same rule for two transaction-specific rules collapsing onto one new
  `TransactionID`: keep the later rule per rule type, log the drop. Downstream
  (`inputByID` main.go:1239, `editsMap` main.go:1256-1294,
  `applyTransactionRules` main.go:706) then works unchanged.
- Unmapped legacy rows (snapshot transaction whose ID is not in the remap —
  source export deleted from the dir): keep the old ID unchanged and log a
  per-row warning; they cannot collide with new-scheme IDs and their
  edits/rules stay keyed consistently.
- Forward durability: add `TransactionID string` (`json:"transactionId,omitempty"`)
  to `export.Transaction` (internal/export/export.go:150) and populate it (the
  FITID) for real, non-virtual transactions, so future identity changes never
  again depend on re-parsing files. Reading old snapshots without the field
  stays valid (omitempty, no version bump).

New tests (main_test.go): (1) legacy snapshot + overlapping dir files whose
months diverge → after merge, one row per bank transaction,
note/reimbursement preserved onto the survivor; (2) collapse conflict → later
row's edit wins; (3) legacy transaction-specific rule's `TransactionID`
remapped and still categorizes; (4) merge run twice → identical transaction
ID sets; (5) input-only legacy row with no dir coverage survives with old ID;
(6) report path: dir transaction whose only snapshot presence is under a
legacy ID is not listed as new.

Out of scope: rewriting `journalEntries`/`budgetPeriods`/`weeklyAggregates`
in old snapshots — all recomputed every run (main.go:1330-1344);
`runInputJSON` (no dir access, IDs pass through; snapshot migrates on next
merge).

Reuse: `LegacyTransactionDocID` from Unit 1; `splitRules` (main.go:644);
existing merge-test fixture builders in main_test.go.

Verification:

```verify
go -C projects/budget-etl test ./...
```

```verify
go -C projects/budget-etl vet ./...
```

Manual: run the report + merge flow twice against the real statements dir and
current snapshot on the operator's machine; confirm the first migrated run
shrinks the transaction count by exactly the formerly-duplicated rows, the
second run is a no-op on IDs, and the web app renders categories/notes
intact.

## Dependencies

- Unit 2 depends on Unit 1. No dependency on the sibling anchor tactics.

## Implementation notes

Implement each unit in a subagent with the unit's model (`sonnet` for Unit 1,
`opus` for Unit 2); supply this Context and the unit's Scope; constrain to
working-tree edits.

## needs-main residue (qa 2026-07-10)

The plan's manual verification step ("run the report + merge flow twice
against the real statements dir and current snapshot on the operator's
machine; confirm the first migrated run shrinks the transaction count by
exactly the formerly-duplicated rows, the second run is a no-op on IDs, and
the web app renders categories/notes intact") needs the operator's real
encrypted `.benc` snapshot and bank statement files, unavailable in this
sandboxed QA environment.

Automated QA already covers the equivalent behavior at the unit level:
`TestRunMergeMigrationIdempotent` (main_test.go) confirms a synthetic
double-merge is a no-op on transaction IDs, and 3 independently-authored
adversarial scratch tests (not committed) confirmed legacy-ID recognition,
new-scheme idempotency, and unmapped-legacy-row survival against hand-built
fixtures distinct from the implementer's own suite. All budget-etl tests and
`go vet` pass clean on the merged PR.

Verify in main-qa: after merge, run `budget-etl merge` twice against the real
statements dir and snapshot; confirm the first run's transaction count drops
by exactly the count of formerly cross-month-duplicated transactions, the
second run changes no transaction IDs, and the budget web app still renders
existing notes/reimbursements/categories correctly.

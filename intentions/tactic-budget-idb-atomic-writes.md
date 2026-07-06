---
id: tactic-budget-idb-atomic-writes
kind: tactic
statement: "budget app: write journal entries and their legs (and reconciliation
  event + leg stamps) in single multi-store IndexedDB transactions"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. createJournalEntry and
  createReconciliationEvent write across separate IDB transactions; a crash
  mid-sequence leaves an unbalanced entry (legCount N, fewer legs) or un-stamped
  legs, which clearedBalance silently mis-computes and file-sync then bakes into
  the encrypted .benc. Multi-store transactions are already available
  (idb.ts:78). Serves strategy-complete-ledger: durable double-entry integrity."
reading: null
gap: null
serves:
  - strategy-complete-ledger
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# budget app: atomic multi-store IndexedDB writes

## Context

The double-entry model assumes an entry and its legs persist together, but
the IDB write layer splits them across transactions. A crash mid-sequence
leaves corruption that file-sync bakes into the encrypted `.benc`. Verified
2026-07-05; multi-store transactions are already available at `idb.ts:78-121`.

## Unit 1 — journal entry + legs in one transaction

**Recommended model:** sonnet

Scope:
- `budget/src/data-source.ts:390-408`: `createJournalEntry` writes the entry
  then each leg in separate transactions; a crash leaves `legCount: N` with
  fewer legs and `clearedBalance` silently omits the missing side. Write
  entry and legs in one multi-store transaction.

## Unit 2 — reconciliation event + leg stamps atomic; safe updateRecord

**Recommended model:** sonnet

Scope:
- `data-source.ts:359-368`: `createReconciliationEvent` records the event
  then stamps legs via `Promise.all` in independent transactions; partial
  failure leaves legs un-stamped. Make it one transaction.
- `data-source.ts:222-231`: `updateRecord` is get-then-put across two
  transactions; overlapping edits to one row lose an edit to the stale read.
  Use a single read-write transaction (or a version check).

## Verification

- Unit tests simulating a mid-sequence failure leave no half-written entry;
  concurrent note+category edits both persist.

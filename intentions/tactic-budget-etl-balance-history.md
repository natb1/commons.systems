---
id: tactic-budget-etl-balance-history
kind: tactic
statement: "budget-etl: fix derived balance-history correctness (off-by-one
  month anchor, merge deleting derived history, dropped virtual edits,
  account-blind dedup, split-payment dedup, SGML entity decode)"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. A cluster of money-history
  correctness bugs in the Go budget-etl pipeline, several with tests that assert
  the wrong (shifted) values and so cement the bug. Serves
  strategy-complete-ledger: the ledger is only complete if the derived net-worth
  history and virtual/merged transactions are correct and survive routine
  re-runs."
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
# budget-etl: derived balance-history + virtual/merge correctness

## Context

The Go budget-etl pipeline derives a monthly net-worth history and generates
virtual/merged transactions. The 2026-07-05 review found a cluster of money
correctness bugs, several with tests asserting the wrong (shifted) values.
Integer-cents arithmetic and UTC date parsing are otherwise sound.

Unit 4 folds in an adjacent finding (duplicate virtual-transaction doc IDs)
previously misfiled in `tactic-review-low-severity-sweep` at higher severity
than a "low" sweep warrants.

## Unit 1 — off-by-one month anchor

**Recommended model:** opus

Scope:
- `projects/budget-etl/main.go:1513-1523`: the anchor labeled "end of month
  m" reverses month m's own transactions (`if !t.Date.Before(m)`), producing
  the balance at the *start* of m - every anchor is one month stale.
  `main_test.go:1061-1091` asserts the shifted values and must be corrected
  with the code (per test-integrity: fix the assertion to the right value,
  do not weaken it).

## Unit 2 — merge preserves derived history and virtual edits

**Recommended model:** opus

Scope:
- `main.go:1410-1412`: `runMerge` unconditionally drops every virtual input
  statement, but anchors are only re-derivable for single-statement accounts
  (`main.go:1475-1477`), so the normal "first file, later a second joins it"
  progression permanently deletes that account's derived history.
  `runInputJSON` (`main.go:586-592`) preserves the invariant; mirror it.
- `main.go:1272` (with `:1257-1264`): `runMerge` drops user edits (Note,
  Reimbursement) on virtual transactions (the `t.Virtual` skip runs before
  `editsMap` is populated); `runInputJSON` preserves them.

## Unit 3 — dedup and entity-decode correctness

**Recommended model:** sonnet

Scope:
- `internal/rules/rules.go:294-301`: `autoNormalize` groups by
  (description, amount, day) with no institution/account key, so two distinct
  same-day same-amount charges on different accounts collapse and one
  vanishes. Add an account/institution key.
- `main.go:367-372`: `generateVirtualTransactions` dedups matched sources by
  (date, amount) per rule, so a same-day split payment yields one virtual
  transaction. Key on FITID.
- `internal/parse/sgml.go:205-218`: the SGML scanner does no entity decoding,
  so OFX 1.x `AT&amp;T` is stored literally while the XML path decodes it
  (garbage + failed categorization + cross-format double count). Decode
  entities to match the XML path.

## Unit 4 — unique virtual transaction doc IDs

**Recommended model:** sonnet

Scope:
- `main.go:376`: `virtualDocID := "virtual-" + txnDocIDs[i]` has no rule
  component; two virtual rules matching one source transaction emit
  duplicate IDs, `Output.Validate()` (`internal/export/export.go:382`)
  doesn't check uniqueness, and one Firestore doc silently overwrites the
  other on upload. Include the matching rule's id/name in the virtual doc
  ID, and add a uniqueness check over all doc IDs to `Output.Validate()`
  so a future collision fails loudly instead of silently dropping data.

## Verification

- Go unit tests for each unit (corrected assertions); a real multi-file merge
  preserves derived history and virtual edits; an OFX 1.x fixture with
  entities parses identically to its XML twin; two rules matching one
  source transaction produce two distinct virtual doc IDs, and
  `Output.Validate()` rejects a fixture with a manufactured duplicate.

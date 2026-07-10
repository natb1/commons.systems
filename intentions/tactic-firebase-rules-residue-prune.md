---
id: tactic-firebase-rules-residue-prune
kind: tactic
statement: "Prune dead Firebase rules surface: budget's legacy group-sharing
  collections in firestore.rules"
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review; finalized
  2026-07-10 by the first /align-tactics round with scope narrowed to the
  firestore.rules budget prune. firestore.rules still defines the full legacy
  group-shared budget data model (budget/{env}/transactions etc. with
  groupId/memberEmails auth) though no runtime path reads or writes those
  collections - budget is local-first now. Dead rules are review/attack surface
  implying a sharing model the product no longer has; rules surface is not
  import-reachability, so tactic-firebase-integration-audit alone will not catch
  it. The draft's storage.rules member_N half was split to
  tactic-storage-member-fallback-prune (born-parked: it awaits a production
  metadata migration only the author can run). Off the strategy's signal path by
  design - calculated attention demotes it."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
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
# Prune dead Firebase rules surface: budget's legacy group-sharing collections in firestore.rules

## Context

firestore.rules still defines the full legacy group-shared budget data model
(`budget/{env}/transactions` etc. with `groupId`/`memberEmails` auth) though no
runtime path reads or writes those collections — budget is local-first (IndexedDB +
encrypted `.benc`); `budget/src/firestore.ts` is type re-exports only, and budget
seeds are baked at build time by `budget/src/vite-plugin-seed-data.ts:35`, not fetched
from Firestore. Dead rules are review/attack surface implying a sharing model the
product no longer has. Off the strategy's signal path (rules surface is not
import-reachability); the storage.rules member_N half of the original draft is
tactic-storage-member-fallback-prune (born-parked — needs a production metadata
migration). Note: tactic-print-bookmarks-rule-privacy also edits firestore.rules in a
different region (print bookmarks) — expect a trivial merge, not an overlap.

## Units

### Unit 1 — verify-and-prune the dead budget match blocks

- **Scope**: for each `budget/{env}` match block in `firestore.rules`, grep the
  budget app and packages for a runtime read/write of that collection; remove blocks
  with none. Candidates (anchors): `groups:44`, `transactions:55`,
  `statement-items:92`, `reconciliation-notes:119`, `statements:147`, `budgets:162`,
  `budget-periods:183`, `weekly-aggregates:220`, `errors:354` (KEEP — live error-sink
  target, `packages/firebaseutil/src/error-sink.ts:72`), `accounts:384`,
  `journal-entries:408`, `journal-legs:448`, `reconciliation-events:463`, plus the
  seed-* blocks (`:35,84,99,134,140,154,201,207,213,376,391,423`) — seeds are baked at
  build time, but verify the hosted budget app makes no runtime seed fetch before
  removing them. Also remove the now-unreferenced group-lookup helper
  (`firestore.rules:13`) if no surviving block uses it. The verification grep is the
  deliverable's evidence: list each removed collection and the grep that cleared it in
  the PR body. Out of scope: `storage.rules` (split tactic), non-budget namespaces,
  `firestore.indexes.json` cleanup unless an index references a removed collection.
- **Recommended model**: opus

### Unit 2 — rewrite rules-test coverage to deny expectations

- **Scope**: `packages/rules-test/test/firestore/budget-*.test.ts` — for every
  removed collection, REWRITE the tests to assert access is now denied (the
  `deny-all.test.ts` pattern), never delete coverage (test-integrity: a deleted test
  destroys the signal; a deny-assertion keeps the pruned surface pinned closed).
  Keep passing tests for surviving blocks (`errors`, any retained seeds).
- **Recommended model**: sonnet
- **Dependencies**: Unit 1.

## Reuse

- `packages/rules-test/test/firestore/deny-all.test.ts` (denial-assertion pattern).
- `packages/rules-test/test/firestore/budget-*.test.ts` (existing coverage to
  rewrite).

## Verification

Prose: the rules-test suite requires the Java Firestore emulator and runs in CI on
`firestore.rules` changes — it false-fails on a plain local run, so rely on the CI
check (or run locally with emulators up). The PR body must carry the per-collection
grep evidence. No app behavior changes: budget's hosted app still builds and its
unit tests pass.

```verify
npx vitest run --project budget --root .
```

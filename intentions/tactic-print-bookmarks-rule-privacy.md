---
id: tactic-print-bookmarks-rule-privacy
kind: tactic
statement: "firestore.rules: close the print-bookmarks cross-user existence
  oracle and add the missing hasOnly/type clamp on bookmark writes"
owner: ai
status: codified
parent: null
rationale: Surfaced by the 2026-07-05 review. firestore.rules:278 lets an
  authenticated user probe whether another user (known uid) has a given book
  bookmarked (allowed-when-absent vs denied-when-present) - the exact oracle the
  adjacent reading-position rule documents closing; the fix pattern
  (docId.split("_")[0] == uid) is already in the file. The write rule also lacks
  the hasOnly/type clamp every sibling rule has. Relates to
  strategy-recover-knowledge weakly (this is the print app's Firestore data) -
  primarily a user-privacy hardening of owned reading data; recorded here for
  lack of a dedicated data-privacy strategy.
reading: null
gap: null
serves:
  - strategy-recover-knowledge
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
# firestore.rules: close the print-bookmarks existence oracle

## Context

`firestore.rules:278-281` re-opens the cross-user existence oracle the
adjacent reading-position rule (`:258-266`) documents closing. Verified
2026-07-05; the fix pattern is already in the file.

## Unit 1 — oracle-free read

**Recommended model:** sonnet

Scope:
- `firestore.rules:278-281`: for another user's docId a non-existent doc is
  allowed (empty result) while an existing doc is denied, so allowed-vs-denied
  leaks which books a known uid has bookmarked. Apply the reading-position
  fix: `docId.split("_")[0] == request.auth.uid`.

## Unit 2 — clamp bookmark writes

**Recommended model:** sonnet

Scope:
- `firestore.rules:282-286`: the write rule uses `hasAll` with no `hasOnly`
  and no type check on `bookmarks`, unlike reading-position's clamped schema
  (`:267-273`). Add the `hasOnly` field clamp and a `bookmarks` type check.

## Unit 3 — close the rules-test gap

**Recommended model:** sonnet

Scope:
- `packages/rules-test/test/firestore/print.test.ts` has the "no existence
  oracle" test for reading-position (line 66) but not for bookmarks. Add the
  converse-case test for bookmarks (verified-absent).

## Verification

- `run-rules-test.sh` (Java emulator; CI-authoritative): the new bookmarks
  oracle test passes and a probe of another uid's docId is denied
  identically whether the doc exists or not.

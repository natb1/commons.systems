---
id: tactic-storage-member-fallback-prune
kind: tactic
statement: Migrate legacy member_0..2 Storage object metadata to member_emails,
  then prune the fallback from storage.rules
owner: human
status: codified
parent: null
rationale: "Split 2026-07-10 from the tactic-firebase-rules-residue-prune draft
  by the first /align-tactics round: storage.rules carries the pre-#1301
  member_0/1/2 metadata fallback (storage.rules lines 12-15), removable only
  after migrating the metadata on production media objects - a mutation of live
  user data with author-held admin credentials, so born-parked rather than
  planned for the autonomous lane."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: Production object-metadata migration on user media (print/{env}/media
    and audio/{env}/media buckets) needs author-held admin credentials and
    judgment over live user data; the storage.rules member_0..2 fallback is
    removable only after that migration, which nothing currently tracks.
  since: 2026-07-10
  recommendation: Enumerate objects under print/{env}/media and audio/{env}/media
    whose metadata has member_0/1/2 keys (a ~20-line firebase-admin script;
    office-hours-snapshot/ holds the admin-credential capture pattern) and write
    member_emails as the comma-joined equivalent; then delete the fallback
    branch at storage.rules lines 12-15 and rewrite the matching expectations in
    packages/rules-test/test/storage/*.test.ts to assert member_N no longer
    grants access (rewrite, never delete, per test-integrity). Estimated at or
    under 30 author-minutes at current bucket size.
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate legacy member_0..2 Storage object metadata to member_emails, then prune the fallback from storage.rules

Born-parked author task (no implementation plan by design — see the `office_hours`
reason and recommendation). Split 2026-07-10 from the tactic-firebase-rules-residue-prune
draft: the firestore.rules budget prune is claude-executable, but this half mutates
metadata on production user media objects.

What it takes (estimated at or under 30 author-minutes at current bucket size):

1. Enumerate objects under `print/{env}/media` and `audio/{env}/media` whose metadata
   has `member_0`/`member_1`/`member_2` keys (a ~20-line firebase-admin script;
   `office-hours-snapshot/` holds the admin-credential capture pattern).
2. Write `member_emails` as the comma-joined equivalent (the post-#1301 scheme —
   `storage.rules:7-10`).
3. Delete the fallback branch at `storage.rules:12-15` and rewrite the matching
   expectations in `packages/rules-test/test/storage/*.test.ts` to assert `member_N`
   metadata no longer grants access (rewrite, never delete, per test-integrity).

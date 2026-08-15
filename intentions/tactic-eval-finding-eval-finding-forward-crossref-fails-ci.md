---
id: tactic-eval-finding-eval-finding-forward-crossref-fails-ci
kind: tactic
statement: validateGraphProseRefs rejects a ledger entry that names a sibling
  entry the same evaluation has not landed yet, so dispatch-eval-finding fails
  CI after 3 attempts and rolls the write back — /rsi step 6 urges exactly these
  cross-links and documents no ordering constraint, costing one of six writes in
  this batch and quietly biasing evaluators toward writing findings with no
  neighbours named
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr1-graph-write-path
  pr: 3095
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-15T15:45:21Z
    mergeCommitSha: fe0b1c4d27973922957f4a173c9a44042a31b8f8
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: rolled_back_writes
      value: 1
      unit: writes
      window: tactic-attention-per-tier-boost-migration/align-tactics eval 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: write_batch_size
      value: 6
      unit: writes
      window: tactic-attention-per-tier-boost-migration/align-tactics eval 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: graph_commit_attempts_wasted
      value: 3
      unit: attempts
      window: tactic-attention-per-tier-boost-migration/align-tactics eval 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed while landing this evaluation's own findings — `tactic-attention-per-tier-boost-migration`, `align-tactics`, 2026-08-14

`/rsi` step 6 tells the evaluator that "the similarity judgment is the
load-bearing step" and the ledger's whole value is relating a finding to its
neighbours, so a well-written body names sibling entries. It gives no warning
that naming a sibling **this same evaluation has not landed yet** fails CI and
rolls the write back.

## What happened

Two of this run's five entries cross-referenced siblings from the same batch.
Landing them in the order they were written produced:

```
error: graph-commit: a required check concluded non-success for
  6c67631c372c6227448e86b5ffd48c9473299156 — the commit content fails CI;
  not retrying (fix the content and re-run)
graph-commit: verdict: not-landed
  ids=tactic-eval-finding-ladder-worker-unstamped-audit-blind pushed=none
dispatch-eval-finding: graph-commit failed after 3 attempt(s)
dispatch-eval-finding: recording a recurrence of
  tactic-eval-finding-ladder-worker-unstamped-audit-blind failed;
  the write was rolled back to origin/main
```

The Graph Fast Path run (31822486425) names the cause exactly:

```
IntentionSchemaError: Prose reference violations:
tactic-eval-finding-ladder-worker-unstamped-audit-blind: prose reference
`tactic-eval-finding-align-tactics-worker-transcript-unscanned` does not resolve
to a node (not planned by any open tactic, not baselined)
  at validateGraphProseRefs (packages/intentionsutil/src/schema.ts:1656)
```

Re-running the identical command after landing the referenced entry first
succeeded unchanged.

## Cost and blast radius

- One wasted `graph-commit` cycle: **3 attempts plus a full CI round trip**,
  ~4 minutes, on a batch of 6 writes — a **17 % waste rate** on this
  evaluator's entire write surface.
- The failure mode is silent to everyone but the evaluator. `/rsi` step 6
  documents `1` as "the graph write failed and was rolled back" and says
  nothing about diagnosing it. An evaluator that read the exit code and moved
  on — which the skill's "do not re-run with the same arguments in this job"
  guidance for the neighbouring `skipped-in-flight` case nudges toward — would
  lose the finding entirely, with a discarded transcript and a driver that has
  already moved on.
- It biases the ledger against exactly the cross-links that make it useful: the
  cheapest way for an evaluator to avoid this is to stop naming siblings.

## What would have to change

Either of these, recorded for the author:

1. State the constraint in `/rsi` step 6: when a batch of findings cross-
   references itself, land referenced entries first — and note that exit 1 on a
   prose-reference violation is retryable after reordering, unlike the other
   exit-1 causes.
2. Better, remove the constraint: have `dispatch-eval-finding` recognise a
   prose reference to a `tactic-eval-finding-*` id it is about to mint in the
   same session, or teach `validateGraphProseRefs` to resolve ledger-entry ids
   the way it already resolves ids planned by an open tactic.

Option 2 is the greenfield answer — the ordering requirement is an artifact of
one-node-per-invocation writes, not something the author should have to hold in
mind. Option 1 is the one-line stopgap.

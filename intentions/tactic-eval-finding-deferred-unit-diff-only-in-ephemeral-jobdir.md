---
id: tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir
kind: tactic
statement: The implement phase deferred a fully-implemented and verified Unit 4
  out of its PR and left the 36973-byte diff only at
  CLAUDE_JOB_DIR/tmp/unit4-deferred.patch — a job scratch directory the harness
  deletes with the job — so the park recommendation the escalation wrote points
  a future session at the sole copy of finished work that nothing in the graph,
  git or the PR carries
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: at_risk_patch_size
      value: 36973
      unit: bytes
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: durable_copies_of_deferred_unit
      value: 0
      unit: copies
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
## What was observed

Node tactic-attention-per-tier-boost-migration, `implement` phase, ladder run
started 2026-08-14T17:11:29Z.

The phase implemented all four planned units, then deferred Unit 4 (validateGraph
rule 22, the two legacy compat-branch deletions in `validateAttention`, the
now-unused `legacyTierKey`, and the kind-kind.md field-doctrine prose) out of
PR #3093 because it cannot land atomically with the data migration. The Unit 4
work was **written, verified against a synthetic post-migration store, and then
reverted out of the branch**. Its only surviving copy is a 36,973-byte patch
file at `$CLAUDE_JOB_DIR/tmp/unit4-deferred.patch` — concretely
`/home/n8/.claude/jobs/09888b78/tmp/unit4-deferred.patch`.

The escalation the worker parked onto the node names exactly that path as the
recovery route, and hedges immediately after it: "recover from that session's
job dir if needed, or just re-run /implement-unit with the same Unit 4 scope
text".

The hedge is warranted, and that is the finding. The harness documents
`$CLAUDE_JOB_DIR/tmp` as scratch that "is cleaned up when the job is deleted,
so anything the user should keep belongs somewhere durable instead". Job
`09888b78` is already in state `done`. Nothing in the graph, nothing in git,
and nothing on PR #3093 carries the patch. The park recommendation therefore
points a future session at an artifact whose lifetime nothing guarantees, and
whose loss silently converts a completed, verified unit back into work to be
redone.

## Measured

- Deferred patch: 36,973 bytes, written 2026-08-14T17:40Z.
- Location: a job scratch directory, outside any repository and outside the
  graph.
- Durable copies: 0.
- Cost to re-derive if lost: the whole of the Unit 4 implementation plus the
  107-turn opus investigation that established the deferral was necessary
  ($21.02 price proxy for the investigation alone).
- Phase `execution.fix.attempt`: null; `execution.conflict`: null. This is not
  rework yet — it is rework the harness has queued up for itself.

## What would have to change

The escalation path has no durable channel for "work that is finished but must
land later". Candidate directions, for the author:

1. **Push the deferred diff as a branch or as a commit on the existing branch,
   reverted.** A `git revert` on the branch keeps the diff recoverable from git
   history forever at zero extra cost, and PR #3093's own history then carries
   it. This is the cheapest option and needs no new mechanism.
2. **Attach it to the follow-up.** If the deviation escalation is going to
   recommend a follow-up tactic, the follow-up's node body — or a PR comment on
   #3093 — is a durable home the graph already has.
3. **Fail the escalation loudly when its recommendation cites a path under
   `$CLAUDE_JOB_DIR`.** A park recommendation that can only be acted on from a
   directory the harness deletes is not an actionable recommendation.

Recording only; this evaluator applies none of them. The patch still existed at
the time of this evaluation — this is a live opportunity to preserve it, not a
post-mortem.

## Evidence a later session cannot rediscover

- Worker session `09888b78-be81-4597-bb3d-55b3cfa00d63`; the deviation
  escalation was staged via `$CLAUDE_JOB_DIR/tmp/office-hours-reason.tmp`
  and companion recommendation/pr files, and the terminal-without-disposition
  sweep landed the park as commit 0ea4026f at 2026-08-14T17:50:56Z.
- The recommendation prose is on the node itself, under `office_hours`.

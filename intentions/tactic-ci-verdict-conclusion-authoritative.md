---
id: tactic-ci-verdict-conclusion-authoritative
kind: tactic
statement: CI-verdict sensing must treat a check-run's non-null conclusion as
  authoritative regardless of its status field — a check left at
  status:in_progress with conclusion:success is concluded-success, not pending
owner: ai
status: raw
parent: null
rationale: "Surfaced from the #2790 (tactic-graph-commit-prune-support) incident
  on the 2026-07-07 emulated router tick: GitHub left the required
  test-integrity check-run at status:in_progress while its conclusion was
  already success (a known GitHub check-runs bug where the status field is not
  always advanced to completed after the conclusion is populated). The emulating
  router read status!=completed as 'CI verdict not present' and wrongly held
  #2790's review->done as CI-gated for the whole tick. The verdict is the
  conclusion; the status field must never be the gate when conclusion is
  non-null. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# CI-verdict sensing: conclusion is authoritative, status is not the gate

## Context

On the 2026-07-07 emulated graph-native router tick, PR #2790
(`tactic-graph-commit-prune-support`, the `--prune`/`--base` primitive the
owed-prune carry-forward is waiting on) carried a single `test-integrity`
check-run stuck at `status: in_progress` with `conclusion: success` for
hours (unchanged across repeated polls). This is a known GitHub check-runs
bug: the `status` field is not always advanced to `completed` after the
`conclusion` is populated.

The router's CI-verdict sensor gate ("a CI verdict must be present before
fix/qa/review", and the emulating session's own poll) read `status != completed`
as "verdict not present" and held #2790's `review -> done` transition as
CI-gated for the entire tick — even though the check had already concluded
`success`. That is a false gate: the disposition should have been `review to
parity -> done`, not owed.

## Requirement

Any code or emulating session that derives a CI verdict from GitHub check-runs
MUST treat a non-null `conclusion` as authoritative and MUST NOT require
`status == "completed"`:

- `conclusion` non-null (`success` / `failure` / `neutral` / `cancelled` / …)
  → that is the verdict, whatever `status` says.
- Only `conclusion == null` is genuinely pending — and only then does `status`
  (`queued` / `in_progress`) matter.

Do not rely on the `status: in_progress` indicator to mean "not yet decided"
when `conclusion` is already `success` (or any non-null value).

## Scope — where the sensor lives

- `.claude/skills/dispatch-propagate/scripts/graph-select-target` — the phase
  sensor gate (CI verdict before fix/qa/review).
- `.claude/skills/dispatch-propagate/scripts/dispatch-ci-ready` (invoked by
  `provision-node-worktree`, exit 10 = ci-waiting) — the draft-PR CI-ready gate.
- Any bootstrap-emulating session polling `check-runs` by hand.

`check-node-selection.ts` (tactic-worker-start-revalidation) is NOT affected —
it reads node state, never CI — but the same rule binds anywhere the greenfield
dispatcher reads a CI verdict.

## Verification

A fixture check-runs payload with `{status: in_progress, conclusion: success}`
must be classified concluded-success by the sensor; `{status: in_progress,
conclusion: null}` must be classified pending. Unit-test the classifier at the
sensor boundary once /align-tactics plans this into `graph-select-target` /
`dispatch-ci-ready`.

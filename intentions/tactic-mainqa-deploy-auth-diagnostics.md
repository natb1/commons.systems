---
id: tactic-mainqa-deploy-auth-diagnostics
kind: tactic
statement: Observe a real auth-class preview-deploy CI failure — the underlying
  firebase-tools error surfaces in the job log and no secret material appears
  unredacted
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-06 from the legacy gh main-qa queue (target-state
  review, second sweep — these follow-ups lacked the office-hours/help-wanted
  labels): issues 2549, 2547. The preview-deploy pipeline is the chain's deploy
  sensor and persists across the router migration; both checks only manifest in
  a real failed auth-class CI run."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: observable only in a real auth-class CI preview-deploy failure (or by
    deliberately breaking credentials on a branch deploy) — cannot be asserted
    offline
  since: 2026-07-06
pace_exempt: false
rounds: null
attributes: {}
---
# Observe a real auth-class preview-deploy CI failure — the underlying firebase-tools error surfaces in the job log and no secret material appears unredacted

## Context

Migrated 2026-07-06 from the legacy gh main-qa queue during the target-state
review (second sweep — these follow-ups were filed without the
office-hours/help-wanted labels). Source issues (closed, content preserved
here): 2549, 2547 — needs-main residue from the preview-deploy auth
diagnostics work (issue 2522, PR 2543). Redaction is unit-covered (harness
case b); both end-to-end behaviors manifest only when a deploy actually fails
auth in CI. Prior real-world instance of this failure class: the floating
.node-version drift whose undici threw on googleapis OAuth (issue 2481) —
the next such event is the natural verification window.

## Verification checklist

1. **Root cause in the job log** (was 2547): a CI preview-deploy job failing
   with an auth-class error includes the underlying firebase-tools diagnostic
   output in the job log — not just the generic 'Failed to authenticate'
   message — so root-causing needs no offline digging.
2. **No secret material** (was 2549): in that same run's `--debug` diagnostic
   output, no raw secret material (service-account key JSON, tokens,
   passwords) appears unredacted; only `[REDACTED]` placeholders stand in for
   sensitive values. If no real failure occurs, one can be caused by
   temporarily using invalid credentials in a branch deploy.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.

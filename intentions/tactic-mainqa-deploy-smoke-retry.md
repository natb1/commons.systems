---
id: tactic-mainqa-deploy-smoke-retry
kind: tactic
statement: Observe the aggregate deploy smoke runners pass on the next real prod
  and preview deploys with the 503-propagation retry gate absorbing transient
  errors
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issue 2726. The deploy smoke runners are the chain's
  post-deploy sensor and persist across the router migration; the retry-gate
  behavior is observable only on a real Firebase Hosting deploy."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution: null
validates: []
blocked_by: []
office_hours:
  reason: observable only on the next real prod/preview Firebase deploys — passive
    observation, no setup
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Observe the aggregate deploy smoke runners pass on the next real prod and preview deploys with the 503-propagation retry gate absorbing transient errors

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issue (closed, content
preserved here): 2726 — needs-main residue from the smoke-runner retry gate
(issue 2713, PR 2719). The aggregate deploy smoke runners are the chain's
post-deploy sensor and persist across the router migration. Passive
observation on the next real deploys; no setup.

## Verification checklist

1. `run-all-prod-deploy-smoke.sh` passes end-to-end against a real prod
   deploy across changed apps with no red job from transient 503 propagation
   errors (was 2726, PR 2719).
2. `run-all-preview-deploy-smoke.sh` passes the same way against a real
   preview deploy.
3. The propagation-window flake no longer produces a red CI job — the
   retry/gate behavior absorbs the transient 503 during Firebase Hosting
   release propagation.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.

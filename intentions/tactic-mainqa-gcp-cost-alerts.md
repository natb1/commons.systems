---
id: tactic-mainqa-gcp-cost-alerts
kind: tactic
statement: Owner applies and test-fires the Firestore read-count and monthly
  budget alerts against the commons-systems GCP project
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issue 2693. Cost alerting on the live GCP project
  guards real spend and stays relevant while any Firebase surface remains (app
  tier persists even as the office-hours owner tier retires). Needs
  project-owner GCP credentials and mutates production monitoring config."
reading: null
gap: null
serves:
  - strategy-financial-sustainability
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
  reason: needs project-owner GCP credentials and mutates production
    monitoring/billing config — owner action (~30 min runbook)
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Owner applies and test-fires the Firestore read-count and monthly budget alerts against the commons-systems GCP project

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issue (closed, content
preserved here): 2693 — needs-main residue from the monitoring-alerts work
(issue 2688, PR 2691). Cost alerting on the live GCP project guards real
spend and stays relevant while any Firebase surface remains — the app tier
persists even as the office-hours owner tier retires. Owner action: needs
project-owner GCP credentials and mutates production monitoring config.
Runbook:
`ops/scripts/apply-alerts.sh` + `.claude/docs/monitoring-alerts.md`.

## Verification checklist

1. Run `ops/scripts/apply-alerts.sh` against the commons-systems GCP project
   to completion without error.
2. The Cloud Monitoring alert policy for Firestore `document/read_count`
   appears in the GCP console.
3. A test read spike above threshold fires a notification email to the owner
   address (the end-to-end runtime backstop).
4. The monthly Firestore budget alert is active and visible in GCP Billing.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.

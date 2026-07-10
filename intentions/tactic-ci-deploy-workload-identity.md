---
id: tactic-ci-deploy-workload-identity
kind: tactic
statement: Replace the long-lived Firebase service-account JSON key in CI
  deploys with keyless Workload Identity Federation
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review: all CI
  deploys authenticate via one FIREBASE_SERVICE_ACCOUNT JSON key materialized to
  a temp file (.github/scripts/firebase-auth.sh) — the weak point of an
  otherwise sound three-tier secret split (GitHub secrets deploy-time, GCP
  Secret Manager runtime, pass/GPG local). google-github-actions supports
  keyless OIDC federation, removing the long-lived credential entirely. Retained
  as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# Replace the long-lived Firebase service-account JSON key in CI deploys with keyless Workload Identity Federation

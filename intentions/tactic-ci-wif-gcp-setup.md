---
id: tactic-ci-wif-gcp-setup
kind: tactic
statement: "GCP setup gate: create the Workload Identity Federation pool and
  GitHub OIDC provider and bind the CI deploy service account for keyless
  deploys (owner IAM)"
owner: human
status: delegated
parent: null
rationale: "Human half of the tactic-ci-deploy-workload-identity split: creating
  a WIF pool/provider and granting roles/iam.workloadIdentityUser needs
  project-owner IAM, and the recorded secrets posture keeps credential-granting
  actions author-side (strategy-autonomous-execution secrets clarification,
  2026-07-07). Born-parked per /align-tactics Step 4. Recorded 2026-07-11
  /align-tactics round."
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
office_hours:
  reason: "Needs the author GCP owner IAM (the secrets posture keeps
    credential-granting author-side): create the Workload Identity Federation
    pool + GitHub OIDC provider in the Firebase project and bind the deploy
    service account (github-actions-deploy@...) with
    roles/iam.workloadIdentityUser scoped to repo natb1/commons.systems. Roughly
    20 author-minutes."
  since: 2026-07-11
  recommendation: Run the exact gcloud commands in
    tactic-ci-deploy-workload-identity body Unit 0 (GCP prerequisite), note the
    resulting workload_identity_provider resource name there, then clear this
    park — the blocked code tactic becomes selectable.
pace_exempt: false
rounds: null
attributes: {}
---
# GCP setup gate: Workload Identity Federation pool, provider, and deploy-SA binding

Born-parked author gate (project-owner IAM; the recorded secrets posture keeps
credential-granting actions author-side). The exact `gcloud` commands live in
`tactic-ci-deploy-workload-identity`'s body, Unit 0 — run them, record the
resulting `workload_identity_provider` resource name there, then clear this
park; the blocked workflow-side tactic becomes selectable.

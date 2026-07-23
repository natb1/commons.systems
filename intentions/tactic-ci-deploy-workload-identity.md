---
id: tactic-ci-deploy-workload-identity
kind: tactic
statement: Replace the long-lived Firebase service-account JSON key in CI
  deploys with keyless Workload Identity Federation
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review: all CI
  deploys authenticate via one FIREBASE_SERVICE_ACCOUNT JSON key materialized to
  a temp file (.github/scripts/firebase-auth.sh) — the weak point of an
  otherwise sound three-tier secret split (GitHub secrets deploy-time, GCP
  Secret Manager runtime, pass/GPG local). google-github-actions supports
  keyless OIDC federation, removing the long-lived credential entirely.
  Finalized 2026-07-11 /align-tactics round: the GCP pool/provider/IAM half is
  split to the born-parked author gate tactic-ci-wif-gcp-setup (owner IAM; the
  recorded secrets posture keeps credential-granting author-side); this tactic
  carries the workflow-side change and is blocked_by that gate."
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
execution:
  branch: tactic-ci-deploy-workload-identity
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: f51f76ac14405b0ccbb0e47f33e0fae1e341c60a45ec9ae6b329170b7227ae05
validates: []
blocked_by:
  - tactic-ci-wif-gcp-setup
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Replace the long-lived Firebase service-account JSON key in CI deploys with keyless Workload Identity Federation

## Context

All CI deploys authenticate via one long-lived `FIREBASE_SERVICE_ACCOUNT`
JSON key materialized to a temp file (`.github/scripts/firebase-auth.sh`) —
the weak point of an otherwise sound three-tier secret split (GitHub secrets
deploy-time, GCP Secret Manager runtime, pass/GPG local).
`google-github-actions/auth` supports keyless OIDC federation, removing the
long-lived credential entirely. The GCP side (pool/provider/IAM binding)
needs owner IAM and is the born-parked author gate `tactic-ci-wif-gcp-setup`;
this tactic does the workflow side once that gate clears.

## Unit 0 — GCP prerequisite (the author gate's checklist; NOT a build unit)

Reference commands for `tactic-ci-wif-gcp-setup` (fill `<PROJECT>` /
`<PROJECT_NUMBER>` from `.firebaserc` / `gcloud projects describe`, and
`<DEPLOY_SA_EMAIL>` = the `github-actions-deploy@...` SA the workflows use):

```
gcloud iam workload-identity-pools create github \
  --project=<PROJECT> --location=global
gcloud iam workload-identity-pools providers create-oidc github-actions \
  --project=<PROJECT> --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='natb1/commons.systems'"
gcloud iam service-accounts add-iam-policy-binding <DEPLOY_SA_EMAIL> \
  --project=<PROJECT> --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/attribute.repository/natb1/commons.systems"
```

The author records the resulting `workload_identity_provider` resource name
(`projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github-actions`)
here when clearing the gate.

## Unit 1 — swap the six auth sites to google-github-actions/auth

**Recommended model:** opus

Scope:
- Replace the `firebase-auth.sh` env-secret step with
  `google-github-actions/auth@v2` (`workload_identity_provider` +
  `service_account`, `create_credentials_file: true` — the action exports
  `GOOGLE_APPLICATION_CREDENTIALS` itself, which firebase-tools honors) at all
  six sites: `.github/workflows/pr-checks.yml:51`,
  `functions-deploy.yml:29`, `firestore-deploy.yml:26`,
  `storage-deploy.yml:25`, `prod-deploy.yml:45`, `prod-deploy.yml:96`.
- Add `permissions: id-token: write` to each affected job (preserving any
  existing `contents` permissions).
- Remove all `secrets.FIREBASE_SERVICE_ACCOUNT` usage; retire
  `.github/scripts/firebase-auth.sh`, `.github/scripts/firebase-auth-cleanup.sh`
  (and their call sites, e.g. `prod-deploy.yml:81,102`), and
  `.github/scripts/test-firebase-auth.sh` — the test is deleted only together
  with its deleted subject (test-integrity: this is subject deletion, not
  test-weakening; flag it plainly in the PR body for review).
- Out of scope: local/host deploy paths (author's firebase login), creating
  the GCP resources (the gate), and rotating/deleting the old SA key (author
  follow-up after WIF is proven on a real prod deploy).
- Coordination note: `tactic-preview-deploy-on-demand` deletes the
  `preview-and-smoke` job that contains the `pr-checks.yml:51` auth site.
  Whichever tactic lands second reconciles — if the job is already gone, that
  site simply no longer exists.

## Reuse

- `google-github-actions/auth@v2`, pinned the same way the workflows pin
  their other actions.
- `.firebaserc` default project id; the deploy SA email already named in the
  workflows.

## Verification

Prose (deploy workflows run only on main): while the preview job still
exists, the PR's own `preview-and-smoke` run exercises the new auth
keylessly; post-merge, watch the next `prod-deploy` / `functions-deploy` run
authenticate without the secret (`gh run watch`). An auth-failure here is the
needs-main residue path. Diagnostic hint: a preview-deploy "Failed to
authenticate" has previously been Node patch drift (a floating
`.node-version` reaching 22.23.0's undici OAuth throw), not credentials —
check the `.node-version` pin before blaming WIF.

## Implementation notes

One build unit, one PR; implement it in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain the subagent to
working-tree edits only.

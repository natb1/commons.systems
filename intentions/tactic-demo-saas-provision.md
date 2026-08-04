---
id: tactic-demo-saas-provision
kind: tactic
statement: "Provision the demo app's Firebase surfaces: hosting site and web-app
  registration (owner IAM, ~10 author-minutes)"
owner: human
status: codified
parent: tactic-firebase-demo-saas-app
rationale: "Born-parked by the 2026-07-10 /align-tactics round: creating a
  Firebase Hosting site and a web-app registration in project commons-systems is
  one-time project provisioning that needs owner/console IAM the autonomous lane
  does not hold (first-of-kind provisioning has required owner IAM before; the
  CI deploy SA github-actions-deploy is deploy-scoped). Gates
  tactic-demo-saas-scaffold via blocked_by."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Provision the demo app's Firebase surfaces: hosting site and web-app registration (owner IAM, ~10 author-minutes)

Born-parked author task (no implementation plan by design). **Completed
2026-07-30**: the author ran both provisioning commands against project
`commons-systems`, and an office-hours drain tick verified the results by
read-back before recording them here.

## Provisioned surfaces

- **Hosting site id**: `cs-demo-3b71` (https://cs-demo-3b71.web.app)
- **Web-app id**: `1:1043497797028:web:6b06f19d7a332929062d31` (display name `demo`)

Both values are read-back truth, confirmed against the live project via
`firebase hosting:sites:list` and `firebase apps:list WEB` — not a transcription
of the create commands' output. The site is not linked to the web app
(`App ID (if set)` is `--`), matching the existing `cs-office-hours-888e`
precedent; linking is not required.

No secret is recorded here and none is owed. `apiKey` and the App Check
reCAPTCHA site key are project-level, supplied via env
(`VITE_FIREBASE_API_KEY`, `VITE_RECAPTCHA_SITE_KEY`;
`packages/firebaseutil/src/config.ts:15-34`) and shared across all apps, so a new
web app introduces no new credential.

## Correction to this node's original park premise

This node's original `office_hours` reason claimed the blocker was
*owner/console IAM*. That was **wrong**, and the correction is recorded here so
future author-only-provisioning parks do not repeat it.

Throughout the park the author's owner credential was live and cached in the
execution environment (`firebase login:list` reported the author account), and
project-scoped reads succeeded without any escalation. The blocker was never
access. It was **consent, gated at two layers**:

1. **The human layer** — an agent must not create cloud resources on the
   author's account without an explicit instruction.
2. **The harness permission layer** — the Claude Code auto-mode classifier
   denied `firebase hosting:sites:create` even *after* the author granted
   permission, so the author ran both commands in their own shell.

So this class of task is **doubly consent-gated, not access-gated**. An agent can
hold a valid grant and still be unable to act. Diagnosing a future instance by
checking IAM sends the diagnosis down a dead end; the question to ask is whether
consent exists at *both* layers.

The `statement` and H1 above retain the original "owner IAM" phrasing as filed;
this section is the authoritative correction.

## What this unblocks

`tactic-demo-saas-scaffold` (`blocked_by: [tactic-demo-saas-provision]`), which
wires `.firebaserc`/`firebase.json` for target `demo` and bakes the web-app id
above into `demo/src/firebase.ts` (compare `audio/src/firebase.ts:6`).

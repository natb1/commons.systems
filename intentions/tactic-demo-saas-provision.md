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
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Author-only Firebase project provisioning: a new Hosting site and
    web-app registration in project commons-systems need owner/console IAM; the
    autonomous lane and the deploy-scoped CI SA cannot create them."
  since: 2026-07-10
  recommendation: "From the repo root with author firebase login: run `firebase
    hosting:sites:create cs-demo-<4hex>` (match the cs-<app>-<4hex> site-id
    pattern in .firebaserc) and `firebase apps:create web demo`; record the
    resulting site id and web-app id (the 1:...:web:... string) in this node's
    body; then stamp phase: done via write-node.ts and land via graph-commit -
    that unblocks tactic-demo-saas-scaffold, which wires
    .firebaserc/firebase.json and bakes the web-app id into
    demo/src/firebase.ts."
pace_exempt: false
rounds: null
attributes: {}
---
# Provision the demo app's Firebase surfaces: hosting site and web-app registration (owner IAM, ~10 author-minutes)

Born-parked author task (no implementation plan by design — see the `office_hours`
reason and recommendation). What to do, from the repo root with the author's
firebase login:

1. `firebase hosting:sites:create cs-demo-<4hex>` — pick a suffix matching the
   `cs-<app>-<4hex>` site-id pattern already in `.firebaserc`.
2. `firebase apps:create web demo` — note the returned web-app id
   (the `1:...:web:...` string; compare `audio/src/firebase.ts` for the shape).
3. Record both ids below, stamp `phase: done` via
   `packages/intentionsutil/scripts/write-node.ts`, and land via `graph-commit
   tactic-demo-saas-provision` — that unblocks tactic-demo-saas-scaffold, which wires
   `.firebaserc`/`firebase.json` and bakes the web-app id into `demo/src/firebase.ts`.

Recorded ids (author fills in):

- Hosting site id: _(pending)_
- Web-app id: _(pending)_

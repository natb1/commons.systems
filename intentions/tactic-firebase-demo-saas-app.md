---
id: tactic-firebase-demo-saas-app
kind: tactic
statement: Build the purpose-built demo SaaS application that exercises every
  retained firebase integration class (hosting, firestore, functions, auth,
  app-check, security rules)
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview as the
  strategy's actuator; finalized 2026-07-10 by the first /align-tactics round as
  the demo subtree parent. The six children (provision, scaffold, data-rules,
  auth-appcheck, functions, acceptance) carry the clean-session plans; this body
  holds the shared design: the integration-class-to-child matrix, the demo
  domain, the demo/{env} namespace, and the synthetic-data constraint. Not
  directly executable (no phase); it completes when its last child completes."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the purpose-built demo SaaS application that exercises every retained firebase integration class (hosting, firestore, functions, auth, app-check, security rules)

**Subtree parent** — finalized 2026-07-10 by the first `/align-tactics
strategy-firebase-demo-saas` round, consuming this node's own retained draft. The
children carry the clean-session plans; this body holds the shared design they
reference. Not directly executable (no phase); it completes when its last child
completes, at which point the strategy's round accounting is stamped
(`rounds.count` 0 → 1, `last_completed` dated).

## Shape (author-decided, strategy clarifications 3 and 5)

- A new purpose-built demo app, not a repurposed production surface. It is the
  strategy's actuator: the sole intended live consumer of the firebase integration
  once production surfaces finish migrating to local-first storage, and a
  client-facing proof asset behind strategy-services-funnel's
  custom-software-development and AI-systems-integration lanes.
- It deploys as its own hosting site **inside the existing commons-systems Firebase
  project** (strategy clarification 5): new site + web-app registration
  (tactic-demo-saas-provision), target `demo` in `.firebaserc`/`firebase.json`.
- **Synthetic data only**: seeded demo data, no user data — consistent with
  delegation-firebase's non_delegable_floor (user data never lives only in the
  backend).
- **Exercised by automation**: CI/acceptance keeps it green (the strategy's
  maintenance-stays-cheap condition); deployment as its own hosting target makes it
  demonstrable in service conversations.

## Demo domain (pinned by this round so children need no design session)

A minimal multi-user **notes board**: an unauthenticated public view renders seeded
example notes (`demo/{env}/seed-notes`, public-read like the budget seed collections,
`firestore.rules:35,134`), and signed-in members of a demo group read/write member
notes (`demo/{env}/notes` + `demo/{env}/groups`, member-scoped exactly like the
landing/fellspiral posts pattern, `firestore.rules:23-33`). Error reporting flows to
`demo/{env}/errors` via firebaseutil's error-sink
(`packages/firebaseutil/src/error-sink.ts:72`). This shape deliberately mirrors the
rule/data patterns production uses, so the retained integration classes are exercised
in their production-representative forms, with a server-side summary function for the
Functions class.

## Integration-class → child matrix

| Class | Child |
|---|---|
| (project provisioning — author) | tactic-demo-saas-provision (born-parked) |
| Hosting | tactic-demo-saas-scaffold |
| Firestore + security rules | tactic-demo-saas-data-rules |
| Auth + App Check | tactic-demo-saas-auth-appcheck |
| Functions | tactic-demo-saas-functions |
| Automation (acceptance + strict audit gate) | tactic-demo-saas-acceptance |

Execution order is the `blocked_by` DAG: provision → scaffold → {data-rules →
auth-appcheck, functions} → acceptance. Each child is exactly one PR.

## Shared constraints for every child

- **Reuse, not reinvention**: build on `packages/firebaseutil` (app-context, config,
  error-sink, defer-appcheck), `packages/firestoreutil` (bounded-query, paged-merge,
  namespace), `packages/authutil` (firebase-auth, deferred-app-auth, emulator-auth,
  groups), `packages/rules-test` (emulator rules suite), and the `functions/src`
  patterns (`feed-proxy.ts`). The demo is what keeps these packages non-dead.
- The demo app's own `src/` must import the firebase SDK surfaces it uses directly
  enough for acceptance feature detection, which scans **app src only**
  (`detect_features` call, `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh:43`)
  — hiding an SDK behind a new shared package silently disables its emulator.
- App layout mirrors `audio/` (`index.html`, `src/`, `seeds/`, `test/`, `e2e/`,
  `vite.config.ts`, `tsconfig.json`, `eslint.config.js`); registering the workspace in
  the root `package.json` is what enrolls it in CI test/deploy fan-out
  (`.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh:38`).

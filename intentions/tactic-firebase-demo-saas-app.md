---
id: tactic-firebase-demo-saas-app
kind: tactic
statement: Build the purpose-built demo SaaS application that exercises every
  retained firebase integration class (hosting, firestore, functions, auth,
  app-check, security rules)
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview as the
  strategy's actuator: the author chose a new purpose-built demo app (not a
  repurposed production surface) as the mechanism that keeps the firebase
  integration exercised while production migrates local-first. Retained as a
  draft for /align-tactics — design detail in the node body."
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

Retained context from the 2026-07-07 /align-strategy interview (draft — /align-tactics
refines this; nothing here is a committed design):

- **Shape decided at the interview**: a new purpose-built demo app, not a repurposed
  production surface. It is the strategy's actuator: the sole intended live consumer of
  the firebase integration once production surfaces finish migrating to local-first
  storage, and a client-facing proof asset behind strategy-services-funnel's
  custom-software-development and AI-systems-integration lanes.
- **Integration classes to exercise** (scope confirmed by the author: all firebase
  production use is deprecated in direction, including auth and app-check; hosting and
  app-check have no current migration plans but the demo preserves them regardless):
  Hosting (own target in `firebase.json`), Firestore reads/writes, Functions, Auth,
  App Check, security rules (`firestore.rules` / `storage.rules`).
- **Reuse, not reinvention**: build on the existing shared packages —
  `packages/firebaseutil` (app-context, config, error-sink), `packages/firestoreutil`
  (bounded-query, paged-merge, delete-namespace), `packages/authutil`
  (firebase-auth, deferred-app-auth), `packages/rules-test` (emulator rules suite) —
  and the `functions/` patterns (e.g. `functions/src/feed-proxy.ts`,
  `office-hours-sync-core.ts`). The demo is what keeps these packages non-dead.
- **Synthetic data only**: seeded demo data, no user data — consistent with
  delegation-firebase's non_delegable_floor (user data never lives only in the backend).
- **Exercised by automation**: CI/acceptance keeps it green (the strategy's
  maintenance-stays-cheap condition); deployment as its own hosting target makes it
  demonstrable in service conversations.

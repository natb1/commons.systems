---
id: tactic-demo-saas-data-rules
kind: tactic
statement: Demo Firestore data model, security rules, and synthetic seed data -
  the demo's Firestore and security-rules integration classes
owner: ai
status: codified
parent: tactic-firebase-demo-saas-app
rationale: "Second executable child of the demo subtree (2026-07-10
  /align-tactics round): the demo/{env} Firestore namespace, its match blocks in
  firestore.rules, rules-test coverage, and synthetic seed data - reusing
  firestoreutil and the seed patterns so the retained Firestore/rules
  integration classes stay exercised by a live consumer."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-demo-saas-scaffold
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Demo Firestore data model, security rules, and synthetic seed data - the demo's Firestore and security-rules integration classes

## Context

Second executable child of the demo subtree (parent tactic-firebase-demo-saas-app —
read its body for the pinned demo domain: a multi-user notes board with public seeded
notes and member-scoped notes). This PR gives the demo its Firestore data model,
its `firestore.rules` match blocks, rules-test coverage, and synthetic seed data —
the Firestore and security-rules integration classes. Auth arrives in the next child;
this PR's app surface is the unauthenticated public seed view plus the (not yet
sign-in-able) member data layer, exercised by unit tests against the emulator-free
seams and by rules-test against the emulator.

## Units

### Unit 1 — data model and synthetic seeds

- **Scope**: `demo/src/firestore.ts` — types + read/write helpers for
  `demo/{env}/seed-notes` (public read-only), `demo/{env}/notes` (member-scoped,
  `groupId`/`memberEmails` shape like the landing posts model), `demo/{env}/groups`;
  use `@commons-systems/firestoreutil` namespace + bounded-query helpers
  (`packages/firestoreutil/src/namespace.ts`, `bounded-query.ts`, `paged-merge.ts`).
  `demo/seeds/firestore.ts` + `demo/seeds/auth.ts` following `landing/seeds/` and
  `audio/seeds/` (synthetic members and example notes only — no real data; the
  strategy's non_delegable_floor forbids user data). Out of scope: rules (Unit 2),
  UI (Unit 3), sign-in (tactic-demo-saas-auth-appcheck).
- **Recommended model**: opus

### Unit 2 — firestore.rules demo namespace + rules-test

- **Scope**: `firestore.rules` — add `demo/{env}` match blocks mirroring the landing
  pattern (`firestore.rules:23-33`): `seed-notes` public read / no client write
  (budget seed pattern, `firestore.rules:35-43`), `notes` + `groups` member-scoped,
  `errors` write-only error-sink block (mirror `firestore.rules:354-374`).
  `packages/rules-test/test/firestore/demo.test.ts` modeled on
  `packages/rules-test/test/firestore/landing.test.ts`: assert public seed read,
  member read/write, non-member denial (a real denial test filters ANOTHER member's
  email — a self-targeted array-contains query always succeeds empty), unauthenticated
  write denial. Out of scope: storage.rules (the demo has no Storage surface).
- **Recommended model**: sonnet
- **Dependencies**: Unit 1.

### Unit 3 — notes-board pages

- **Scope**: `demo/src/` pages — public view rendering seed notes; member notes view
  (list/create/edit) wired to the Unit 1 helpers, sign-in-gated behind a stub that
  tactic-demo-saas-auth-appcheck replaces with the real auth flow. Error reporting via
  firebaseutil error-sink (`packages/firebaseutil/src/error-sink.ts:72`) so
  `demo/{env}/errors` is exercised. Unit tests for rendering and helper logic.
- **Recommended model**: sonnet
- **Dependencies**: Units 1, 2.

## Reuse

- `packages/firestoreutil` (namespace, bounded-query, paged-merge, seed).
- `packages/authutil/src/groups.ts` for the group/member types.
- `landing/seeds/firestore.ts`, `audio/seeds/` as seed-shape templates.
- `packages/rules-test/test/firestore/landing.test.ts`, `deny-all.test.ts`.

## Verification

```verify
npx vitest run --project demo --root .
```

Prose: the rules-test suite runs in CI on `firestore.rules` changes and needs the
Java Firestore emulator, so it false-fails on a plain local run — rely on the CI
check, or run it locally only with emulators up. Confirm the seed view renders the
synthetic notes via the app dev server
(`.claude/skills/dispatch-propagate/scripts/run-qa-server.sh demo`).

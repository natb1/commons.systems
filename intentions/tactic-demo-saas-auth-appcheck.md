---
id: tactic-demo-saas-auth-appcheck
kind: tactic
statement: Demo sign-in and App Check enforcement - the demo's auth and
  app-check integration classes
owner: ai
status: codified
parent: tactic-firebase-demo-saas-app
rationale: "Third executable child of the demo subtree (2026-07-10
  /align-tactics round): member sign-in via authutil and App Check via
  firebaseutil's deferred init, gating the member-scoped demo collections - so
  the auth and app-check classes (deprecated in production direction, no current
  migration plans) keep a live consumer."
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
  - tactic-demo-saas-data-rules
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Demo sign-in and App Check enforcement - the demo's auth and app-check integration classes

## Context

Third executable child of the demo subtree (parent tactic-firebase-demo-saas-app).
Production direction deprecates all firebase use including auth and app-check
(strategy clarification 1), so the demo is these classes' intended live consumer.
This PR replaces the data-rules child's sign-in stub with the real auth flow and
verifies App Check enforcement, using only existing shared utilities.

## Units

### Unit 1 — member sign-in via authutil

- **Scope**: `demo/src/auth.ts` wiring `@commons-systems/authutil` firebase-auth +
  deferred-app-auth (`packages/authutil/src/firebase-auth.ts`,
  `deferred-app-auth.ts`; `audio/src/auth.ts` is the consuming example) into the demo
  shell: sign-in/sign-out UI, member state driving the notes view from
  tactic-demo-saas-data-rules Unit 3. Test seams via
  `packages/authutil/src/emulator-auth.ts` and `demo/seeds/auth.ts` synthetic members.
  Out of scope: any new auth abstractions — reuse only; e2e flows
  (tactic-demo-saas-acceptance).
- **Recommended model**: sonnet

### Unit 2 — App Check wiring and enforcement check

- **Scope**: confirm `createAppContext`'s deferred App Check init is active for the
  demo (`packages/firebaseutil/src/defer-appcheck.ts:13`,
  `app-context.ts:30` `getAppCheckHeaders`) and expose `getAppCheckHeaders` for the
  demo's function calls (consumed by tactic-demo-saas-functions Unit 2). The
  reCAPTCHA site key is shared project-wide
  (`packages/firebaseutil/src/config.ts:25`) and injected in deploy CI as
  `VITE_RECAPTCHA_SITE_KEY` (`.github/workflows/prod-deploy.yml:71`) — no new secrets.
  Add a unit test that the demo app context requests App Check init in
  non-emulator mode. Out of scope: server-side enforcement assertions against
  production (observe-in-production, below).
- **Recommended model**: sonnet
- **Dependencies**: Unit 1 (shares the app-context touchpoints).

## Reuse

- `packages/authutil` (firebase-auth, deferred-app-auth, emulator-auth, groups).
- `packages/firebaseutil` (app-context, defer-appcheck, config).
- `audio/src/auth.ts` as the consuming pattern.

## Verification

```verify
npx vitest run --project demo --root .
```

Prose: with emulators via the acceptance harness, a signed-in synthetic member can
create a note and a non-member cannot read it. App Check enforcement on the deployed
site is observe-in-production: after deploy, the browser console shows a successful
App Check token fetch (no `appCheck/fetch-status-error`), and Firestore requests
succeed with enforcement enabled at current project settings.

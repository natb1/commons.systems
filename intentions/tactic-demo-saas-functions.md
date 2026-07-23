---
id: tactic-demo-saas-functions
kind: tactic
statement: A demo Cloud Function consumed by the demo app - the demo's Functions
  integration class
owner: ai
status: codified
parent: tactic-firebase-demo-saas-app
rationale: "Fourth executable child of the demo subtree (2026-07-10
  /align-tactics round): a small server-side demo function following the
  functions/src patterns (admin SDK read, App Check enforcement), exported from
  functions/src/index.ts and called by the demo app - keeping the Functions
  class exercised by a purpose-built consumer."
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
# A demo Cloud Function consumed by the demo app - the demo's Functions integration class

## Context

Fourth executable child of the demo subtree (parent tactic-firebase-demo-saas-app).
The Functions class needs a purpose-built consumer once production surfaces retire;
this PR adds one small server-side demo function and its client consumption. Runs in
parallel with data-rules/auth-appcheck (blocked only by scaffold); the client-call
unit degrades gracefully if the notes collections have not landed yet in a given
checkout — but in practice the acceptance child gates on all three.

## Units

### Unit 1 — demoSummary function

- **Scope**: `functions/src/demo-summary.ts` — an HTTPS function returning a
  server-side summary of the demo notes board (counts per group, latest note
  timestamp) read via firebase-admin; enforce App Check the same way the existing
  functions do (follow `functions/src/feed-proxy.ts` for handler shape, logging via
  `functions/src/log-utils.ts`, and App Check/auth guards). Export from
  `functions/src/index.ts` (`functions/src/index.ts:1-2` shows the export pattern).
  Unit tests beside the existing functions tests (mock admin SDK seams like the
  `*-core.ts` modules do — put the pure logic in `demo-summary-core.ts` if that
  matches the sibling pattern). Deploy rides `.github/workflows/functions-deploy.yml`
  — no new CI. Out of scope: any second function; scheduled triggers.
- **Recommended model**: sonnet

### Unit 2 — client consumption

- **Scope**: the demo shell calls `demoSummary` and renders the summary line on the
  public view; attach App Check headers via the app context's `getAppCheckHeaders`
  (`packages/firebaseutil/src/app-context.ts:30`) as the blog's feed-proxy consumer
  does. Handle the emulator URL vs production URL split the way existing function
  consumers do. Out of scope: auth-gated function paths.
- **Recommended model**: sonnet
- **Dependencies**: Unit 1.

## Reuse

- `functions/src/feed-proxy.ts` (handler + App Check guard pattern),
  `functions/src/log-utils.ts`, the `*-core.ts` pure-logic convention.
- `packages/firebaseutil/src/app-context.ts` `getAppCheckHeaders`.

## Verification

```verify
npx vitest run --project functions --root .
```

```verify
npx vitest run --project demo --root .
```

Prose: if the functions workspace is not a vitest project under that name, use the
functions package's own test script — check `functions/package.json` first. After
functions deploy, `curl` the deployed `demoSummary` endpoint without an App Check
token and confirm it is rejected; the demo page shows the summary in a browser
(token present).

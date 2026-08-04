---
id: tactic-demo-saas-scaffold
kind: tactic
statement: Scaffold the demo app workspace and its hosting target - the demo's
  Hosting integration class
owner: ai
status: codified
parent: tactic-firebase-demo-saas-app
rationale: "First executable child of the demo subtree (2026-07-10
  /align-tactics round): a new demo/ workspace mirroring the existing app
  layout, wired as its own hosting target so prod deploy and CI pick it up
  mechanically. Exercises the Hosting class; later children add firestore/rules,
  auth/app-check, functions, and acceptance automation."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-demo-saas-scaffold
  pr: 3039
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by:
  - tactic-demo-saas-provision
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Scaffold the demo app workspace and its hosting target - the demo's Hosting integration class

## Context

First executable child of the demo subtree (parent tactic-firebase-demo-saas-app —
read its body for the shared design: demo domain, namespace, constraints). This PR
creates the `demo/` app workspace and wires it as its own Firebase Hosting target so
the existing CI/deploy fan-out picks it up mechanically. It exercises the Hosting
integration class; Firestore/auth/functions/e2e land in the sibling children. Blocked
by tactic-demo-saas-provision, whose node body records the hosting site id and
web-app id this PR bakes in — read them from that node before starting.

## Units

### Unit 1 — demo app workspace

- **Scope**: new `demo/` directory at the repo root mirroring `audio/`'s layout
  (`index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`,
  `eslint.config.js`, `test/` with at least one vitest unit test) minus audio's
  player/media specifics. `src/firebase.ts` follows `audio/src/firebase.ts:1-9`
  verbatim in shape: `createAppContext("demo", "<web-app-id from
  tactic-demo-saas-provision>", { recaptchaSiteKey: RECAPTCHA_SITE_KEY })` (no
  storageModule — the demo has no Storage surface this round). The shell page is a
  minimal ds-styled landing view stating what the demo is (brand voice per the brand
  skill: plain description, no marketing fluff); the notes board itself is
  tactic-demo-saas-data-rules. Add `"demo"` to the root `package.json` `workspaces`
  array — that single entry enrolls the app in unit-test and deploy fan-out
  (`.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh:38`).
  Out of scope: firestore reads/writes, rules, auth, app-check init beyond what
  `createAppContext` wires by default, functions, e2e/acceptance.
- **Recommended model**: sonnet

### Unit 2 — hosting target and smoke arrangement

- **Scope**: `firebase.json` — append a hosting entry with `"target": "demo"`,
  copying an existing app block's headers/CSP shape (the hosting array starts at
  `firebase.json:6`; adjust CSP `connect-src` for firebase endpoints exactly as the
  sibling apps do). `.firebaserc` — add `demo: [<site id from
  tactic-demo-saas-provision>]` under `targets.commons-systems.hosting`
  (`.firebaserc:6-25`). Mirror the sibling apps' smoke-test arrangement so the prod
  deploy loop's smoke step passes (read
  `.claude/skills/dispatch-propagate/scripts/run-smoke-tests.sh` and
  `run-all-prod-deploy-smoke.sh:31-55` first to see exactly what it expects of an
  app; audio/'s e2e smoke arrangement is the model). Out of scope: full acceptance
  suite (tactic-demo-saas-acceptance).
- **Recommended model**: sonnet
- **Dependencies**: Unit 1.

## Reuse

- `createAppContext` — `packages/firebaseutil/src/app-context.ts:119`.
- `RECAPTCHA_SITE_KEY` — `packages/firebaseutil/src/config.ts:25`.
- `audio/` as the layout template (`audio/index.html`, `audio/vite.config.ts`,
  `audio/tsconfig.json`, `audio/src/firebase.ts`).
- ds components — `packages/ds`.

## Verification

```verify
npx vitest run --project demo --root .
```

```verify
npm run build --prefix demo
```

Prose: typecheck via `.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app
demo` (raw `tsc -p` false-fails on DOM-lib apps). After merge, prod-deploy
(`.github/workflows/prod-deploy.yml`) deploys the demo site because the workspace
changed and has a hosting target; verify `https://<site-id>.web.app` serves the shell
— that is the Hosting class going live-exercised.

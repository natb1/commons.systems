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
  conflict: null
  completion: null
validates: []
blocked_by:
  - tactic-demo-saas-provision
office_hours:
  reason: "/qa-fix: QA/dev server for demo crashes on startup (esbuild
    pre-bundling fails on Firebase v12 destructuring syntax —
    demo/vite.config.ts is missing optimizeDeps.esbuildOptions.target: es2022,
    present in audio/budget/print for the identical crash); blocks 5 of 10
    browser-dependent plan items. A broken pre-QA gate is a bug needing an
    in-session plan-mode fix decision, escalating to office-hours."
  since: 2026-08-10
  recommendation: >-
    # Recommendation — `tactic-demo-saas-scaffold` (PR #3039)


    ## 1. Apply the fix


    Edit `demo/vite.config.ts` — add `optimizeDeps` to the
    `createAppConfig({...})` call:


    ```ts

    import { createAppConfig } from "@commons-systems/config/vite";


    export default createAppConfig({
      esbuild: { jsx: "automatic", jsxImportSource: "react" },
      // Pin dev prebundling to es2022 so esbuild leaves rest-destructuring in
      // @firebase/* untouched instead of crashing the dev server.
      optimizeDeps: { esbuildOptions: { target: "es2022" } },
      test: { include: ["test/**/*.test.{ts,tsx}"] },
    });

    ```


    Copy the comment wording from `audio/vite.config.ts` (this tactic's
    documented reuse template) so all four app configs read identically.
    Cross-check against `budget/vite.config.ts` and `print/vite.config.ts` —
    same line, same rationale.


    This is a one-line, single-file change. `/implement-unit` with `model:
    sonnet` is sufficient; it does not need a plan-mode decomposition. The only
    reason it was parked is that the QA lane treats a broken pre-QA gate as a
    bug requiring a human fix decision, not because the fix is ambiguous.


    ## 2. Verify the gate reopens


    ```

    run-qa-server.sh demo --detach

    ```


    Must bind within 30s with no esbuild "Transforming destructuring ... is not
    supported yet" errors in the dev-server log. If it still fails, the
    diagnosis is wrong — stop and re-root-cause rather than widening the target.


    ## 3. Re-run the QA session


    The browser lane never executed. Re-run QA and cover items 1-5:


    1. Shell renders — heading "Demo", description paragraph, populated `#root`

    2. Clean console / no failed requests on real page load (watch the
    `createAppContext` Firebase init in `demo/src/firebase.ts`)

    3. Design-system token CSS actually applied (styled, not raw HTML)

    4. `document.title === "Demo"` and description metadata correct

    5. Deep link to an unknown path serves the shell (SPA rewrite in
    `firebase.json`)


    Items 6, 7, 8 passed this session — re-run them once as a regression sweep,
    don't re-investigate. Item 10 (`https://cs-demo-3b71.web.app`) stays
    deferred to `prod-deploy`; no pre-merge action.


    ## 4. Item 9 — one human look, same sitting


    While the browser is open, resize to 375x800 and judge whether the shell
    reads as intentional, on-brand, and legible. Pure visual judgment, untested
    either way. Not a merge blocker on its own — if it looks off, file it as a
    follow-up rather than holding PR #3039.


    ## Note


    Production build was never broken (`vite build` uses Rollup +
    `build.target`, a separate path from dev-only `optimizeDeps` pre-bundling),
    so CI stayed green and this escaped review. The user-visible cost is that
    `npm run dev --prefix demo` is broken for anyone on this branch today —
    worth mentioning in the PR when the fix lands.
  session_type: other
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

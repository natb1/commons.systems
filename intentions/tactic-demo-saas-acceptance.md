---
id: tactic-demo-saas-acceptance
kind: tactic
statement: Demo acceptance automation and the strict audit gate - the demo stays
  green in CI with zero unreachable firebase modules
owner: ai
status: codified
parent: tactic-firebase-demo-saas-app
rationale: "Terminal child of the demo subtree (2026-07-10 /align-tactics
  round): the Playwright acceptance suite on seeded synthetic data (the
  strategy's exercised-by-automation condition) plus flipping the
  firebase-import audit to strict mode - together these meet the strategy
  threshold's demo-deployed-and-green half and produce the reading, so this
  tactic carries the validates edge."
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
validates:
  - strategy-firebase-demo-saas
blocked_by:
  - tactic-demo-saas-data-rules
  - tactic-demo-saas-auth-appcheck
  - tactic-demo-saas-functions
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Demo acceptance automation and the strict audit gate - the demo stays green in CI with zero unreachable firebase modules

## Context

Terminal child of the demo subtree (parent tactic-firebase-demo-saas-app) and a
validates-terminal of strategy-firebase-demo-saas: when this lands and the deploy is
green, the strategy threshold's demo half ("deployed and green in CI") is met, and
the strict audit (sensor from tactic-firebase-integration-audit) reads the
zero-unreachable half. The strategy's exercised-by-automation condition lives here:
the demo must stay green without manual upkeep.

## Units

### Unit 1 — Playwright acceptance suite

- **Scope**: `demo/e2e/` with `playwright.config.ts` copied from `audio/e2e`,
  covering: unauthenticated public seed view renders seeded notes; emulator-auth
  sign-in as a synthetic member; member note create/read (rules exercised through the
  emulator); non-member denial; `demoSummary` function call renders. The acceptance
  harness (`.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh`)
  detects needed emulators from `demo/src/` imports (`detect_features`,
  run-acceptance-tests.sh:43) — verify firestore/auth/functions are all detected;
  a missed emulator means an SDK import is hidden from app src. Tag conventions:
  `@hosting`/`@testonly`/`@build` grep-invert splits are at
  run-acceptance-tests.sh:29-37. Out of scope: new app features; visual snapshots.
- **Recommended model**: sonnet

### Unit 2 — flip the firebase-import audit to strict

- **Scope**: change the report-only CI step from tactic-firebase-integration-audit
  Unit 2 (in `.github/workflows/unit-tests.yml`) to run `npm run audit:firebase --
  --strict` as a gating check, now that the demo makes the wrapper packages
  reachable. If strict still fails, each remaining unreachable module is either
  wired into the demo (only if it is a retained integration class the demo should
  exercise) or recorded as its own prune tactic in the intention graph — never
  suppressed. Out of scope: pruning the modules themselves.
- **Recommended model**: opus
- **Dependencies**: Unit 1.

## Reuse

- `audio/e2e/` (playwright config + emulator fixtures),
  `packages/authutil/src/emulator-auth.ts`, `demo/seeds/`.
- `packages/firebase-audit` CLI from tactic-firebase-integration-audit.

## Verification

```verify
npx vitest run --project demo --root .
```

Prose: run the acceptance suite via
`.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh demo` (needs
sandbox off for npx/emulators). CI green on the PR plus a green prod deploy afterward
constitutes the strategy reading's demo half; run `npm run audit:firebase -- --strict`
and record the result — at completion of this round the strategy's `reading`, `gap`,
and `rounds` (count 0 → 1, `last_completed` dated) are stamped by hand per the
bootstrap interim.

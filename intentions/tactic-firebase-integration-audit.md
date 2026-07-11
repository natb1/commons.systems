---
id: tactic-firebase-integration-audit
kind: tactic
statement: Instrument the firebase-import reachability audit that distinguishes
  live consumers (production surface or demo) from dead code
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview as the
  strategy's sensor; finalized 2026-07-10 by the first /align-tactics round with
  a clean-session plan. The validates-terminal that produces the strategy's
  reading: the success signal's threshold (zero firebase-importing modules
  unreachable from a live consumer) needs a repeatable audit rather than a hand
  grep."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-firebase-integration-audit
  pr: 2821
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 58ed07141197c5ff513cb7e9b3412c9334207dd73a2c56e1fdfc231d78f7540d
validates:
  - strategy-firebase-demo-saas
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Instrument the firebase-import reachability audit that distinguishes live consumers (production surface or demo) from dead code

## Context

This is the sensor for strategy-firebase-demo-saas's success signal: its threshold
("zero firebase-importing modules unreachable from a live consumer") needs a repeatable
audit, not a hand grep. A module counts as live if a production surface or the demo app
reaches it. The audit is the strategy's validates-terminal: its strict-mode run is what
produces the strategy's reading at office-hours. Until the demo subtree
(tactic-firebase-demo-saas-app children) lands, the strict run is EXPECTED to fail —
that failure is the honest reading of the current gap, so CI wiring is report-only
(non-gating) in this tactic; tactic-demo-saas-acceptance flips it strict later.

## Units

### Unit 1 — audit engine as a workspace package

- **Scope**: new workspace `packages/firebase-audit/` (add its path to the
  `workspaces` array in the root `package.json` — an "app" for CI purposes is exactly
  a workspace entry, see `.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh:38`).
  Contents: `src/audit.ts` (the engine), `src/cli.ts` (entry), `test/` (vitest unit
  tests over fixture files), `package.json`, `tsconfig.json`, `eslint.config.js`
  mirroring a small existing package (e.g. `packages/idbutil`). The engine:
  1. **Firebase-importing set**: scan all workspace TypeScript sources for imports of
     `firebase`, `firebase/*`, `firebase-admin`, `firebase-functions`, and the shared
     wrapper packages `@commons-systems/firebaseutil`, `@commons-systems/firestoreutil`,
     `@commons-systems/authutil`, plus `@commons-systems/mediautil`'s `/firebase`
     subpath and `packages/blog/src/firestore.ts`.
  2. **Live-consumer roots**: the hosting apps enumerated from `.firebaserc`
     hosting targets (each app workspace's `index.html`/`src/main.tsx` entry) and the
     functions entry `functions/src/index.ts` (currently exports `feedProxy`,
     `collectProjectSignals` — `functions/src/index.ts:1-2`). Root discovery must be
     mechanical (read `.firebaserc` + `package.json` workspaces), so the demo app is
     picked up automatically when it lands.
  3. **Reachability**: walk the import graph from the roots (TypeScript's
     `resolveModuleName` against each workspace's tsconfig, or equivalent static
     resolution — the `typescript` package is already a dependency; avoid adding a
     heavy new dep if practical). A firebase-importing module not reached from any
     root is dead.
  4. **Report**: per-module verdict `{module, firebaseImports, nearestLiveConsumer|null}`
     printed as a table plus a summary count; exit 0 in report mode; `--strict` exits 1
     when any module has no live consumer.
  Out of scope: CI wiring (Unit 2), any pruning of dead modules found (each is a
  future tactic — the graph is the sole tracker), rules-surface auditing
  (`firestore.rules`/`storage.rules` are not import-reachability; see
  tactic-firebase-rules-residue-prune).
- **Recommended model**: opus

### Unit 2 — report-only CI step and npm script

- **Scope**: root `package.json` script `audit:firebase` running the CLI; a
  report-only (never-failing without `--strict`) step in
  `.github/workflows/unit-tests.yml` so every PR prints the current reachability
  report. Do NOT gate CI on `--strict` in this tactic — the pre-demo tree legitimately
  fails strict. Out of scope: the strict flip (tactic-demo-saas-acceptance Unit 2).
- **Recommended model**: sonnet
- **Dependencies**: Unit 1.

## Reuse

- Workspace enumeration convention: `jq -r '.workspaces[]' package.json`
  (`.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh:38`).
- `typescript` compiler API (already a dependency) for module resolution.
- Expected-output baseline — the 2026-07-07 hand inventory the mechanical audit must
  re-derive (a large miss against this list means the scanner is wrong):
  - `functions/`: `index.ts`, `feed-proxy.ts`, `office-hours-sync-core.ts`,
    `dispatch-queue-metrics-core.ts`, `project-signals*.ts`, `github-app-auth.ts`.
  - Shared packages: `packages/firebaseutil`, `packages/firestoreutil`,
    `packages/authutil`, `packages/analyticsutil`, `packages/mediautil` (`/firebase`),
    `packages/blog` (`src/firestore.ts`), `packages/rules-test`.
  - Apps: landing (`src/firebase.ts`, `seeds/firestore.ts`), fellspiral
    (`src/firebase.ts`), print (`src/firestore.ts`, `library.ts`, `bookmarks.ts`,
    `reading-position.ts`), audio (`src/firestore.ts`, `firebase.ts`, `library.ts`),
    office-hours (`office-hours.ts`, `data.ts`, `queue-metrics.ts`,
    `project-signals.ts`, `firebase.ts`), `office-hours-snapshot/`.
  - Watchlist (closest to dead as local-first proceeds): budget's firestore layer is
    types-only (`budget/src/firestore.ts` is type re-exports); office-hours/print/audio
    carry dual sources.

## Verification

```verify
npx vitest run --project packages/firebase-audit --root .
```

```verify
npm run audit:firebase
```

Prose: the report must cover the baseline inventory above (spot-check that
`functions/src/feed-proxy.ts` and `packages/firestoreutil` modules appear with live
consumers); `npm run audit:firebase -- --strict` exiting 1 pre-demo is the expected
reading of the strategy's current gap, not a defect. The rules-test package requires
Firebase emulators and is excluded from vitest workspace projects — do not try to run
it as part of this tactic's verification.

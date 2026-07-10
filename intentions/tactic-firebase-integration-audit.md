---
id: tactic-firebase-integration-audit
kind: tactic
statement: Instrument the firebase-import reachability audit that distinguishes
  live consumers (production surface or demo) from dead code
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview as the
  strategy's sensor: the success signal's threshold (\"zero firebase-importing
  modules unreachable from a live consumer\") needs a repeatable audit rather
  than a hand grep. Retained as a draft for /align-tactics — the 2026-07-07
  code-audit inventory is carried in the node body as the starting map."
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
# Instrument the firebase-import reachability audit that distinguishes live consumers (production surface or demo) from dead code

Retained context from the 2026-07-07 /align-strategy interview (draft — /align-tactics
refines this):

This is the sensor for strategy-firebase-demo-saas's success signal: its threshold
("zero firebase-importing modules unreachable from a live consumer") needs a repeatable
audit, not a hand grep. A module counts as live if a production surface or the demo app
reaches it.

Starting inventory (2026-07-07 code audit of the main tree):

- Root config: `firebase.json` (hosting targets landing, budget, fellspiral, print,
  audio, office-hours; emulators), `firestore.rules`, `firestore.indexes.json`,
  `storage.rules`, `.firebaserc`.
- `functions/` (firebase-admin + firebase-functions): `index.ts`, `feed-proxy.ts`,
  `office-hours-sync-core.ts`, `dispatch-queue-metrics-core.ts`, `project-signals*.ts`,
  `github-app-auth.ts`.
- Shared packages: `packages/firebaseutil`, `packages/firestoreutil`,
  `packages/authutil`, `packages/analyticsutil`, `packages/mediautil` (`/firebase`
  source), `packages/blog` (`src/firestore.ts`), `packages/rules-test`.
- Apps: landing (`src/firebase.ts`, `seeds/firestore.ts`), fellspiral (`src/firebase.ts`),
  print (`src/firestore.ts`, `library.ts`, `bookmarks.ts`, `reading-position.ts`),
  audio (`src/firestore.ts`, `firebase.ts`, `library.ts`), office-hours
  (`office-hours.ts`, `data.ts`, `queue-metrics.ts`, `project-signals.ts`,
  `firebase.ts`), office-hours-snapshot/ (firebase-admin capture tool).
- Migration watchlist (closest to dead as local-first proceeds): budget's firestore
  layer is already types-only (`Timestamp` + `src/firestore.ts` schema defs; storage
  moved to IndexedDB + `.benc` files); office-hours/print/audio carry dual sources.

The audit should re-derive this inventory mechanically (imports of `firebase`,
`firebase-admin`, `firebase-functions`, and the shared wrapper packages) and report
each module's nearest live consumer, so the strategy's office-hours review reads a
pass/fail rather than re-doing the sweep.

---
id: tactic-review-lows-shared-infra
kind: tactic
statement: "2026-07-05 review lows: shared packages (crypto, idbutil,
  firestoreutil, authutil, firebaseutil, router, mediautil) (retained draft
  context)"
owner: ai
status: raw
parent: null
rationale: "Retained draft context, not selectable work. Split 2026-07-06 out of
  the deleted mixed sweep tactic-review-low-severity-sweep per the placement
  doctrine (strategy-graph-native-dispatch), so this strategy's /align-tactics
  rounds find their own residue. Findings are from the 2026-07-05 code review,
  each verified with an anchor. Multi-serves per the placement doctrine: these
  packages are load-bearing for several strategies' artifacts; no single
  strategy owns the shared platform layer."
reading: null
gap: null
serves:
  - strategy-recover-finance
  - strategy-recover-attention
  - strategy-attention-surface
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
# 2026-07-05 review lows: shared packages (retained draft context)

## Context

Retained draft context, not selectable work. Split 2026-07-06 out of the
deleted mixed sweep `tactic-review-low-severity-sweep` per the placement
doctrine on `strategy-graph-native-dispatch`. Multi-serves per that doctrine:
these packages are load-bearing for several strategies' artifacts (budget,
print/audio, office-hours) and no single strategy owns the shared platform
layer. Each line is a confirmed finding from the 2026-07-05 review with an
anchor. Any consuming strategy's `/align-tactics` round may finalize, split,
merge, or prune.

## shared packages

- `packages/crypto/src/crypto.ts:55-61`: `worker.onerror` nulls the worker
  without `terminate()` (orphaned PBKDF2 threads).
- `packages/idbutil/src/connection.ts:80`: stale open-request `onerror`
  unconditionally nulls `dbPromise`, clobbering a fresh memoized promise.
- `packages/firestoreutil/src/bounded-query.ts:66-88`: mutable shared
  `constraints` array (branching two queries off one base cross-contaminates).
- `packages/authutil/src/firebase-auth.ts:106-111`: `signOut()` resolves on
  failure (caller navigates as signed-out while the session is live).
- `packages/firebaseutil/src/config.ts:26`: module-scope `requireEnv` for the
  reCAPTCHA key hard-fails import for apps that never enable App Check.
- `packages/router` index vs location-store: two navigation systems that do
  not notify each other (vanilla router + React `useLocation` desync).
- `packages/mediautil/src/local-folder.ts:60-66`: bare `catch { continue }`
  swallows consumer mapper bugs (files silently vanish from the library).

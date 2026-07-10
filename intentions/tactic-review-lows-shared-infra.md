---
id: tactic-review-lows-shared-infra
kind: tactic
statement: "shared packages low-severity sweep: crypto worker
  terminate-on-error, idbutil stale-onerror dbPromise clobber, firestoreutil
  shared constraints array, authutil signOut error swallow, firebaseutil
  module-scope requireEnv, router/location-store desync, mediautil
  catch-continue mapper swallow"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-07 /align-tactics round on
  strategy-recover-attention out of the retained draft (split 2026-07-06 from
  the deleted mixed sweep). Multi-serves per the placement doctrine:
  crypto/idbutil/firestoreutil/authutil/firebaseutil/router/mediautil are
  load-bearing shared platform packages consumed by budget
  (strategy-recover-finance), print/audio (strategy-recover-attention), and
  office-hours (strategy-attention-surface); no single strategy owns them. Each
  unit is a confirmed low-severity finding from the 2026-07-05 review,
  re-anchored against current origin/main. Off every serving strategy's signal
  path (no validates edge)."
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
phase: review
execution:
  branch: tactic-review-lows-shared-infra
  pr: 2811
  attempts:
    qa: 1
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# shared packages low-severity sweep

## Context

Seven confirmed low-severity findings from the 2026-07-05 code review of the
load-bearing shared platform packages. Multi-serves per the placement doctrine:
these packages back budget (`strategy-recover-finance`), print/audio
(`strategy-recover-attention`), and office-hours (`strategy-attention-surface`),
and no single strategy owns them. Finalized 2026-07-07 out of a retained draft;
anchors re-verified against current `origin/main`.

The units are independent (no ordering dependency); each is one commit inside
the single sweep PR. Each touches a different package.

## Unit 1 — crypto: terminate the worker on error

- **Scope**: `packages/crypto/src/crypto.ts:55-61` — `worker.onerror` rejects
  pending promises and sets `worker = null` but never calls `worker.terminate()`,
  leaking the PBKDF2 thread. Call `worker.terminate()` before nulling the
  reference. Out of scope: the main-thread fallback path below the handler.
- **Recommended model**: sonnet

## Unit 2 — idbutil: don't clobber a fresh dbPromise from a stale onerror

- **Scope**: `packages/idbutil/src/connection.ts:80` — the open-request
  `onerror` unconditionally sets `dbPromise = null`, so a stale/late error can
  null out a freshly memoized promise created by a subsequent open. Guard the
  null-out so it only clears the promise it belongs to (mirror the
  `settledByTimeout` guard already used on the blocked-timer path at `:71-73`,
  e.g. only null `dbPromise` when it still points at this request's promise).
  Out of scope: the `closeDb`/`onclose`/`onversionchange` paths.
- **Recommended model**: sonnet

## Unit 3 — firestoreutil: stop sharing the constraints array

- **Scope**: `packages/firestoreutil/src/bounded-query.ts:60-79` — the
  constructor stores the caller-passed `constraints` array by reference
  (`this.constraints = constraints`) and `where`/`orderBy`/`limit` push into it,
  so two queries branched off one base `BoundedQuery` cross-contaminate. Copy
  the array on construction (`this.constraints = [...constraints]`) and, if the
  builder is meant to be immutable-per-call, return new instances rather than
  mutating in place. Out of scope: the `unbounded()`/`getDocs()` semantics.
- **Recommended model**: sonnet

## Unit 4 — authutil: signOut should reject on failure

- **Scope**: `packages/authutil/src/firebase-auth.ts:106-111` — `signOut()`
  catches the `firebaseSignOut` error, shows a message, and resolves `void`, so
  a caller `await`ing it proceeds as signed-out while the session is still live.
  Re-throw (or return a rejected promise) after logging/showing the error so the
  caller can branch on failure. Preserve the existing `logError` + `showAuthError`
  side effects. Out of scope: `signIn`/`signInWithRedirect`.
- **Recommended model**: sonnet

## Unit 5 — firebaseutil: don't hard-require the reCAPTCHA key at import

- **Scope**: `packages/firebaseutil/src/config.ts:26` — module-scope
  `export const RECAPTCHA_SITE_KEY = requireEnv("VITE_RECAPTCHA_SITE_KEY")`
  throws at import for any app that never enables App Check. Defer the
  requirement to the App Check init site: make the key lazy (a getter/function
  that `requireEnv`s on first use) or optional at module load, so importing the
  config does not fail for non-App-Check apps. Out of scope: the rest of the
  `FirebaseOptions` object.
- **Recommended model**: opus

## Unit 6 — router: cross-notify the two navigation paths

- **Scope**: two navigation systems that do not notify each other —
  `packages/router/src/index.ts:116-153` (`createHistoryRouter`: `pushState` +
  `nav.navigate()` at `:138-139`) and
  `packages/router/src/location-store.ts:36-56,95-99` (the `useLocation`
  external store: `navigate()` calls `pushState` then `notify()` its
  `listeners`). A vanilla-router navigation does not `notify()` the location
  store, so React `useLocation()` subscribers desync (and vice versa). Route
  both navigation paths through a single mechanism that updates history AND
  notifies the location-store listeners (e.g. have the history router's navigate
  call the location store's notify, or unify both on `location-store.navigate`).
  Out of scope: the `hydrate`/`react.tsx` hook surface beyond the notify wiring;
  `readonly-url-search-params`.
- **Recommended model**: opus

## Unit 7 — mediautil: don't swallow consumer mapper bugs

- **Scope**: `packages/mediautil/src/local-folder.ts:60-66` — the loop wraps
  both `fileHandle.getFile()` and `config.toItem(...)` in one bare
  `catch { continue }`, so a bug thrown by the consumer's `toItem` mapper is
  silently swallowed and the file vanishes from the library. Narrow the catch to
  the expected I/O failure (`getFile`) and let a `toItem` mapper error surface
  (or log it distinctly), so consumer bugs are not hidden. Out of scope: the
  `index`/`results` accumulation and the `item === null` skip.
- **Recommended model**: sonnet

## Reuse

- Unit 2 mirrors the existing `settledByTimeout` guard pattern already in
  `connection.ts`; do not invent a new memoization scheme.
- Unit 6 reuses the location store's existing `notify()`/`listeners` mechanism
  (`location-store.ts:36-42`) rather than adding a second event channel.

## Verification

Shared-package unit suites (the ones with a package-level suite):

```verify
npx vitest run --project router --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

The typecheck run covers all consuming apps, catching any regression the
firestoreutil/authutil/firebaseutil signature-adjacent changes introduce.
Package suites that exist (crypto, idbutil, firestoreutil, authutil, mediautil,
router) run under their `--project`; run each that exists. Manual (judgment):

- Unit 4: confirm no caller of `signOut()` relied on it resolving on failure
  (grep consumers) before landing the reject-on-failure change.
- Unit 5: confirm an app that does not enable App Check imports the firebaseutil
  config without throwing.
- Unit 6: in a React app using `useLocation`, trigger a vanilla-router
  navigation and confirm subscribed components re-render.

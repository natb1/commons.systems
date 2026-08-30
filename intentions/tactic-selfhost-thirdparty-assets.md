---
id: tactic-selfhost-thirdparty-assets
kind: tactic
statement: Self-host the remaining third-party page assets — Google Fonts on the
  non-fellspiral apps and the Creative Commons badge image
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review: fellspiral
  already proves font-src 'self' with self-hosted fonts and the ds package ships
  IBM Plex as local woff2, but the other apps still load Google Fonts, and
  fellspiral's CSP retains mirrors.creativecommons.org for the CC badge — the
  last third-party page assets. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Self-host the remaining third-party page assets — Google Fonts on the non-fellspiral apps and the Creative Commons badge image

## Context

The owned-web-platform doctrine self-hosts assets so no page depends on a
third-party origin (fellspiral already proves `font-src 'self'` with local
woff2, and `landing` self-hosts IBM Plex — `landing/test/font-preload.test.ts:19`
asserts the HTML never contains `fonts.googleapis.com`, and
`landing/public/fonts/` ships the woff2). Three apps still load Google Fonts at
runtime and every app's CSP still whitelists a third-party image mirror:

- `budget/index.html:16`, `audio/index.html:16`, `print/index.html:16` each
  `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:...">`.
- Every app's CSP in `firebase.json` retains `https://fonts.googleapis.com`
  (style-src), `https://fonts.gstatic.com` (font-src), and
  `https://mirrors.creativecommons.org` (img-src) — the last third-party page
  assets.

Off the strategy's signal path (this changes page assets, not workspace-manifest
dependencies, so it carries no `validates` flag), but recorded doctrine work:
it removes the remaining third-party origins from the served apps.

## Unit 1 — Self-host IBM Plex Mono on budget, audio, print

**Scope.** For each of `budget`, `audio`, `print`: copy the local
`ibm-plex-mono-latin-{400,700}-normal.woff2` assets into the app's
`public/fonts/` (the exact assets `landing/public/fonts/` already ships), add
the `@font-face` declarations to the app's `src/style/theme.css` (mirror
`landing/src/style/theme.css`, which is the working self-host pattern), and
delete the `fonts.googleapis.com/css2` `<link>` (and any `fonts.gstatic.com`
preconnect) from the app's `index.html:16`. Do **not** touch the
`firebaseinstallations.googleapis.com` preconnect (SDK init, unrelated —
`*/index.html:11`).

Out of scope: fellspiral (already self-hosted); the CSP edits (Unit 3); font
files for weights the app does not use.

**Recommended model:** sonnet (mechanical, three parallel copies of an existing
in-repo pattern).

## Unit 2 — Self-host the Creative Commons badge image

**Scope.** Locate the CC badge `<img>` usage (grep `creativecommons` /
`licenses/by` across app + fellspiral source; the CSP `img-src
https://mirrors.creativecommons.org` in `firebase.json` is the origin it loads
from). Download the badge once, commit it under the owning app's
`public/` (or `packages/style`/`packages/ds` if shared), and repoint the `<img
src>` to the local `'self'` path. If the grep finds **no** live `<img>`
reference — only the CSP entry — then the mirror is a dead CSP allowance: record
that finding in the PR and let Unit 3 simply drop the `img-src` entry (no image
to host).

Out of scope: relicensing; changing the badge artwork.

**Recommended model:** opus (requires locating the reference and judging
hosted-vs-dead-CSP, then the honest branch).

**Dependencies:** none (independent of Unit 1).

## Unit 3 — Tighten the CSPs to drop the third-party origins

**Scope.** In `firebase.json`, for each app whose assets are now fully
self-hosted (budget, audio, print after Unit 1; every app for the CC mirror
after Unit 2), remove `https://fonts.googleapis.com` from `style-src`,
`https://fonts.gstatic.com` from `font-src`, and
`https://mirrors.creativecommons.org` from `img-src`, leaving `font-src 'self'`
and `style-src 'self' 'unsafe-inline'`. `print`'s CSP (`firebase.json:299`)
already has `font-src 'self'` and no Google Fonts in style-src — verify per app;
do not blindly delete. Keep any origin still required by a remaining asset.

Out of scope: unrelated CSP directives (script-src, connect-src, frame-src).

**Recommended model:** opus (per-app CSP diff requires reading each header block
and confirming no remaining asset needs the origin).

**Dependencies:** Unit 1, Unit 2 (the CSP can only tighten once the assets are
local).

## Reuse

- Self-host pattern: `landing/src/style/theme.css` (`@font-face`) +
  `landing/public/fonts/ibm-plex-mono-latin-{400,700}-normal.woff2`.
- Font-preload regression guard to replicate per app:
  `landing/test/font-preload.test.ts:19`.
- CSP header blocks: `firebase.json` (one `Content-Security-Policy` value per
  hosting target).

## Verification

```verify
npx vitest run --project budget --root . || exit 1
npx vitest run --project audio --root . || exit 1
npx vitest run --project print --root .
```

Add/extend each app's font-preload test to assert the built HTML no longer
contains `fonts.googleapis.com` (mirror `landing/test/font-preload.test.ts`).

Manual (per app, at a preview deploy): load the app, confirm IBM Plex Mono
renders from the local `/fonts/*.woff2` (DevTools Network shows no request to
`fonts.googleapis.com` / `fonts.gstatic.com` / `mirrors.creativecommons.org`),
and confirm no CSP violation appears in the console.

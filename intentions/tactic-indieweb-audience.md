---
id: tactic-indieweb-audience
kind: tactic
statement: Self-hosted webmention endpoint — the platform-free response path for
  landing and fellspiral
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-06 by /align-tactics round 1, split: the draft's
  feed-discoverability leg already ships (rel=alternate feed links in both
  index.html heads), its POSSE leg moved to tactic-indieweb-syndication-markup +
  tactic-indieweb-syndicate-posts, and the signal reading moved to
  tactic-own-audience-reading; this leaf carries the webmention half — a
  self-hosted receiver on owned infrastructure (strategy clarification: no
  third-party endpoint service)."
reading: null
serves:
  - strategy-own-audience
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-indieweb-audience
  pr: 2802
  attempts: {}
  markers:
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Self-hosted webmention endpoint — the platform-free response path for landing and fellspiral

## Context

`strategy-own-audience` requires "a platform-free response path" on every
owned publication surface (its `success_signal.threshold`). Today no
webmention code exists anywhere in the repo: readers can only respond via a
platform. This tactic adds a self-hosted webmention receiver — a Firebase
Cloud Function on the repo's existing Blaze project — and advertises it from
both publication surfaces (landing at `https://commons.systems`, fellspiral at
`https://fellspiral.commons.systems`). Received mentions are stored, not
displayed; display is deliberately out of scope (it needs a moderation story
and is not required for the threshold's "response path exists").

Design choice (recorded as a strategy clarification): self-hosted receiver on
owned infra, not webmention.io — no author account provisioning, consistent
with the strategy condition that IndieWeb building blocks stay implementable
on self-hosted sites. webmention.io remains the brownfield fallback if abuse
or cost becomes a problem.

This is exactly one PR.

## Unit 1 — webmention receiver function

**Recommended model:** opus

Scope:

- New `functions/src/webmention.ts` exporting an `onRequest` v2 function
  `webmention`, modeled on `functions/src/feed-proxy.ts` (same
  imports/structure; note its `MAX_FEED_BYTES` bound at
  `functions/src/feed-proxy.ts:13-14` and its 10s `AbortSignal.timeout` fetch
  at `functions/src/feed-proxy.ts:52-57`). Per the W3C Webmention spec
  receiving rules:
  - Accept only `POST` with `application/x-www-form-urlencoded` params
    `source` and `target`; 400 on anything else (missing params, non-URL
    values, non-http(s) schemes, `source === target`); 405 on non-POST.
  - `target` host must be `commons.systems` or `fellspiral.commons.systems`;
    400 otherwise. Hard-code the two hosts with a comment naming them as the
    owned publication surfaces.
  - **No AppCheck** — external senders cannot carry an AppCheck token; this
    endpoint is deliberately public. Do not copy `verifyAppCheck` from
    feed-proxy. Instead bound abuse: cap the source fetch at the byte bound
    and timeout above, and set the function's `maxInstances` low (e.g. 2).
  - Verify synchronously: fetch `source` (UA string like feed-proxy's, 10s
    timeout, size cap), require the response body to contain the exact
    `target` URL; 400 with a descriptive message if not (clear errors over
    fallbacks, `.claude/rules/code-style.md`).
  - On success store to Firestore via firebase-admin (admin app init exactly
    as `functions/src/feed-proxy.ts:9`): collection path
    `webmentions/prod/mentions/{id}` where `{id}` is a hash of
    `source|target` (idempotent re-sends overwrite), doc data
    `{source, target, receivedAt}` with a server timestamp.
  - Respond `202` with a short plain-text body on success.
- Export `webmention` from `functions/src/index.ts` (current exports at
  `functions/src/index.ts:1-2`).
- `firestore.rules`: add a `match /webmentions/{env}/mentions/{id}` block with
  `allow read, write: if false;` and a comment that only the admin-SDK
  function writes (mirrors the deny-all style used elsewhere in
  `firestore.rules`).
- Unit tests in `functions/test/webmention.test.ts`, patterned on
  `functions/test/feed-proxy.test.ts`: param validation (405/400 cases),
  target-host allowlist, source-verification success/failure (mock `fetch`),
  idempotent doc id.

Out of scope: displaying mentions on any page; sending outgoing webmentions;
spam scoring/moderation.

## Unit 2 — endpoint advertisement and hosting rewrites

**Recommended model:** sonnet

Dependencies: Unit 1 (the function id must exist for the rewrites).

Scope:

- `firebase.json`: on the `landing` and `fellspiral` hosting targets (the
  entries with `"target": "landing"` / `"target": "fellspiral"`), add a
  rewrite `{"source": "/api/webmention", "function": {"functionId":
  "webmention"}}` **before** the catch-all `**` rewrite — copy the shape of
  the existing `feedProxy` rewrite on the `print` target.
- `landing/index.html`: next to the existing feed link (line 9,
  `<link rel="alternate" type="application/rss+xml" ...>`) add
  `<link rel="webmention" href="https://commons.systems/api/webmention">`.
- `fellspiral/index.html`: same next to line 10, href
  `https://fellspiral.commons.systems/api/webmention`. (Absolute URLs so the
  endpoint survives syndicated/prerendered contexts; the prerender at
  `packages/blog/src/prerender.ts:351` reuses `dist/index.html` as the
  template for every page, so one static head line covers all pages.)
- E2e head-link smoke checks: add to `landing/e2e/` and `fellspiral/e2e/` a
  spec patterned on `fellspiral/e2e/rss-feed-smoke.spec.ts` (same
  `@commons-systems/config/playwright-test` import) asserting
  `head link[rel="webmention"]` exists with the right href.

## Reuse

- `functions/src/feed-proxy.ts` — onRequest structure, admin app init, fetch
  timeout + byte-cap pattern, emulator env check.
- `functions/src/log-utils.ts` — logging helpers if suitable.
- `functions/test/feed-proxy.test.ts` — test harness pattern.
- `fellspiral/e2e/rss-feed-smoke.spec.ts` — e2e smoke pattern.

## Verification

```verify
npx vitest run --project functions --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app functions
```

Manual/QA: start the emulator suite and POST
`source=https://example.com/x&target=https://commons.systems/post/y` to the
emulated function URL, confirming the 400/202 paths; after merge, an
empty-body `POST https://commons.systems/api/webmention` returns 400 from the
deployed function — a first-of-kind function deploy may need owner IAM (see
project memory on CI functions deploy).

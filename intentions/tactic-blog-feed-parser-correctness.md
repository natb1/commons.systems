---
id: tactic-blog-feed-parser-correctness
kind: tactic
statement: "packages/blog blogroll + feed-proxy: fix the feed-fetch parser
  (entity double-decode, missing CDATA, rel=self fallback) and the feed-proxy
  unhandled-rejection instance crash"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. The hand-rolled blogroll feed
  parser double-decodes entities, ships CDATA literally, and can fall back to a
  rel=self API URL as a post link; separately the feed-proxy function re-throws
  a non-AppCheck verification error as an unhandled rejection that crashes the
  instance (verified against the firebase-functions wrapper). Serves
  strategy-recover-discovery: owned feed ingestion must parse real third-party
  feeds and stay up."
reading: null
gap: null
serves:
  - strategy-recover-discovery
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
# blogroll feed parser + feed-proxy crash guard

## Context

The hand-rolled blogroll feed parser and the feed-proxy function both have
verified defects (2026-07-05). Tests cover only the happy path.

## Unit 1 — feed-fetch parser correctness

**Recommended model:** sonnet

Scope:
- `packages/blog/src/blog-roll/vite-plugin-feed-fetch.ts:86-94`: the entity
  decoder replaces `&amp;` first (double-decodes) and handles no numeric
  entity except `&#39;` (WordPress `&#8217;`/`&#8230;` render literally).
  Decode `&amp;` last and handle numeric entities.
- `:80-84`: no CDATA handling - `<![CDATA[...]]>` ships literally. Strip
  CDATA wrappers.
- `:105-107`: the `rel="alternate"` matcher only matches rel-before-href;
  on a miss the any-link fallback returns a `rel="self"` API URL as the post
  link. Match both attribute orderings and exclude `rel="self"`.
- Extend tests to cover reversed attribute order, CDATA, and numeric entities.

## Unit 2 — feed-proxy instance-crash guard

**Recommended model:** sonnet

Scope:
- `functions/src/feed-proxy.ts:29,34`: a non-AppCheck error from
  `verifyToken` is re-thrown out of `handleFeedProxy`; the `onRequest`
  wrapper never awaits it, so it becomes an unhandled rejection that crashes
  the instance (verified against the firebase-functions wrapper) and drops
  concurrent in-flight requests. Return an explicit `res.status(500)` for the
  non-AppCheck case; update `feed-proxy.test.ts:74-80` to assert the 500.

## Verification

- Parser tests pass on real-world feed shapes; a simulated non-AppCheck
  verification error yields a clean 500, not a process crash.

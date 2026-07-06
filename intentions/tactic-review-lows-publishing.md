---
id: tactic-review-lows-publishing
kind: tactic
statement: "2026-07-05 review lows: blog package (retained draft context)"
owner: ai
status: raw
parent: null
rationale: "Retained draft context, not selectable work. Split 2026-07-06 out of
  the deleted mixed sweep tactic-review-low-severity-sweep per the placement
  doctrine (strategy-graph-native-dispatch), so this strategy's /align-tactics
  rounds find their own residue. Findings are from the 2026-07-05 code review,
  each verified with an anchor. The blog-roll ingestion items (parse-feed xmlns,
  feed-proxy Content-Type) moved 2026-07-06 into
  tactic-blog-feed-parser-correctness: strategy-recover-discovery owns the
  blog-roll/feed-ingestion surface, per the placement doctrine."
reading: null
gap: null
serves:
  - strategy-recover-publishing
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
# 2026-07-05 review lows: blog package (retained draft context)

## Context

Retained draft context, not selectable work. Split 2026-07-06 out of the
deleted mixed sweep `tactic-review-low-severity-sweep` per the placement
doctrine on `strategy-graph-native-dispatch`. Each line is a confirmed
finding from the 2026-07-05 review with an anchor. A later `/align-tactics`
round on `strategy-recover-publishing` finalizes, splits, merges, or prunes.

## blog package

- `packages/blog/src/pages/HomeRegion.tsx:83-85`: never sets `data-hydrated`
  after runtime fetch-hydrate -> re-fetch/re-parse on every nav.
- `packages/blog/src/create-blog-app.ts:413`; `feed.ts:26-42` vs
  `post-types.ts:14-51`: admin nav hydration mismatch; feed/sitemap use
  laxer published-post rules than the canonical validator.

## moved out (2026-07-06)

- The blog-roll ingestion items (parse-feed xmlns-strip regex, feed-proxy
  Content-Type reflection) moved into `tactic-blog-feed-parser-correctness`
  (Units 2-3): `strategy-recover-discovery` owns the blog-roll surface.

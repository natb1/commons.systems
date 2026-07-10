---
id: tactic-review-lows-publishing
kind: tactic
statement: "packages/blog correctness & DRY (2026-07-05 review lows): mark
  runtime-hydrated post content with data-hydrated in HomeRegion, reuse the
  canonical validatePublishedPosts in the RSS feed, and dedupe the /admin
  showAuth derivation shared by the two nav render paths."
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-07 by an /align-tactics round on
  strategy-recover-publishing from the retained draft of the same id (2026-07-05
  review lows for the blog package). Off-path hardening of owned publishing
  infrastructure — carries no validates edge: the strategy's signal is validated
  by author-published pieces reviewed at office-hours, not by this fix. Each
  unit is a confirmed 2026-07-05 review finding with a path:line anchor. The
  blog-roll ingestion items were moved 2026-07-06 to
  tactic-blog-feed-parser-correctness under strategy-recover-discovery. Anchors
  re-verified and plan reconciled 2026-07-10 against the strategy's
  2026-07-07/09 clarifications (content-lives-in-git, no reader accounts,
  CC-BY-SA, recovers scope) — no contradiction; all three findings still unfixed
  on main."
reading: null
gap: null
serves:
  - strategy-recover-publishing
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
# packages/blog correctness & DRY (2026-07-05 review lows)

## Context

Three confirmed low-severity findings from the 2026-07-05 code review of the
`@commons-systems/blog` package, each with a `path:line` anchor. They harden
the owned publishing infrastructure the strategy depends on: a runtime
re-hydration perf bug, an RSS feed that filters published posts by a laxer rule
than the canonical validator (so its published-post set can drift from the
sitemap's), and a duplicated `/admin` auth-visibility derivation that can drift
between the two nav render paths. This is off-path hardening — none of these
units validates the strategy's signal (author-published pieces reviewed at
office-hours do that), so the tactic carries no `validates` edge. Each unit is
independent and lands in one PR.

The blog-roll ingestion items originally retained here (parse-feed xmlns-strip
regex, feed-proxy Content-Type reflection) moved 2026-07-06 into
`tactic-blog-feed-parser-correctness` (Units 2–3) under
`strategy-recover-discovery`, which owns the blog-roll surface — out of scope
for this tactic.

Each unit is implemented in a subagent launched with the unit's Recommended
model, constrained to working-tree edits, and given this unit's Context/Scope
inline.

## Unit 1 — Mark runtime-hydrated post content with `data-hydrated`

**Scope.** In `packages/blog/src/pages/HomeRegion.tsx`, the fetch-hydrate loop
guards against re-hydrating an already-hydrated post via
`if (contentDiv.hasAttribute("data-hydrated")) return;`
(`packages/blog/src/pages/HomeRegion.tsx:62`). But after it fetches the post
markdown and writes the parsed HTML into `contentDiv.innerHTML`
(the `DOMPurify.sanitize(...)` assignment at
`packages/blog/src/pages/HomeRegion.tsx:83-85`), it never *sets*
`data-hydrated` on `contentDiv`. So the guard never trips for
runtime-hydrated content and every navigation re-fetches and re-parses the post.
Fix: immediately after the successful `innerHTML` assignment (still inside the
`try`, only when `isCurrent()` still holds), call
`contentDiv.setAttribute("data-hydrated", "")` so the next pass short-circuits.
Do not set it on the error branch (the `Could not load post content` fallback),
so a failed fetch is retried on the next nav. Out of scope: the prerender-side
marker (SSR already emits `data-hydrated=""`, see Reuse) and any other
`HomeRegion` behavior.

**Recommended model.** sonnet.

## Unit 2 — RSS feed reuses the canonical published-post validator

**Scope.** `packages/blog/src/feed.ts` `buildFeedXml` re-implements
published-post selection inline (`packages/blog/src/feed.ts:26-42`): it iterates
`postsCollection.documents`, keeps `data.published === true`, and requires only
`title` to be a string — tolerating a missing/non-string `publishedAt`. The
canonical `validatePublishedPosts` in `packages/blog/src/post-types.ts:14-51`
is stricter (it throws when a published post lacks `title`, `filename`, or
`publishedAt`), and the sitemap already uses it
(`packages/blog/src/sitemap.ts:35`). So the RSS feed can include a post the
sitemap rejects, drifting the two published-post sets. Fix: replace the inline
loop in `buildFeedXml` with a call to `validatePublishedPosts(seed)` and map its
`PublishedPost[]` into the `RssPost[]` shape (`id`, `title`, `publishedAt`,
`previewDescription`, `previewImage`), preserving the existing sort. Keep
`buildFeedXml` a pure function and its signature unchanged. Out of scope:
sitemap.ts (already canonical) and the `RssPost`/`generateRssXml` contract in
`feed-rss.ts`.

**Recommended model.** sonnet.

## Unit 3 — Dedupe the `/admin` `showAuth` derivation

**Scope.** The auth-controls-visibility flag is derived as `path === "/admin"`
in two nav render sites in `packages/blog/src/create-blog-app.ts`: the
hydrate/legacy path's `navElement` (`showAuth: path === "/admin"`,
`packages/blog/src/create-blog-app.ts:225`) and the shell path's `navEndNode`
(`showAuth: currentPath === "/admin"`,
`packages/blog/src/create-blog-app.ts:315`). These two copies can drift, which
is the recorded "admin nav mismatch." Fix: extract a single small helper (e.g.
`const isAdminPath = (p: string) => p === "/admin";` module-scoped within
`create-blog-app.ts`, or an equivalent one-liner) and call it at both sites so
the derivation lives once. Pure refactor — no behavior change. Out of scope:
the `hydrateRoot` call at `packages/blog/src/create-blog-app.ts:413`, the auth
state (`currentUser`) plumbing, and `BlogNav`/`BlogNavEnd` component internals.

**Recommended model.** sonnet.

## Dependencies

None — the three units touch disjoint files (`HomeRegion.tsx`, `feed.ts`,
`create-blog-app.ts`) and may be implemented in any order.

## Reuse

- `validatePublishedPosts` / `isPublished` / `PublishedPost` —
  `packages/blog/src/post-types.ts:9,14`. The canonical published-post gate;
  Unit 2 calls it and `sitemap.ts:35` is the reference caller.
- SSR hydration marker convention — `packages/blog/src/pages/Home.tsx:44`
  emits `data-hydrated=""` on the prerendered post-content div; Unit 1 mirrors
  it for the runtime path.
- Existing tests to extend: `packages/blog/test/home-region.test.tsx` (Unit 1),
  `packages/blog/test/feed.test.ts` (Unit 2),
  `packages/blog/test/create-blog-app.test.ts` (Unit 3).

## Verification

Unit 1 adds a test asserting `data-hydrated` is present on the post-content div
after a runtime hydrate and that a second hydrate pass performs no second fetch.
Unit 2 adds a test that a published post missing `publishedAt` is excluded from
the RSS output (matching the sitemap), and confirms a valid published set still
renders. Unit 3 is a pure refactor covered by the existing nav tests.

```verify
npx vitest run --project packages/blog --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/blog
```

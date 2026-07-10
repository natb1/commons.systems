---
id: tactic-indieweb-syndication-markup
kind: tactic
statement: IndieWeb markup on the blog surfaces — h-entry microformats and
  u-syndication links from post metadata
owner: ai
status: codified
parent: null
rationale: "Split 2026-07-06 from draft tactic-indieweb-audience by
  /align-tactics round 1: the owned-side half of POSSE — a syndication field on
  post metadata rendered as u-syndication links, plus h-entry/h-card
  microformats so webmention senders and parsers can read the posts. The human
  act of syndicating (accounts, target choice) is
  tactic-indieweb-syndicate-posts, blocked on this leaf."
reading: null
gap: null
serves:
  - strategy-own-audience
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-indieweb-syndication-markup
  pr: 2803
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: 0e82bc4f18e29664d59b99de7011753e330865a40fab038406506ff86bcf1791
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# IndieWeb markup on the blog surfaces — h-entry microformats and u-syndication links from post metadata

## Context

`strategy-own-audience` needs "syndication-with-canonical-links" on every
owned publication surface. `rel=canonical` already ships on every prerendered
page (`packages/blog/src/prerender.ts:399,431,496` via `canonicalLinkTag`,
`packages/blog/src/seo.ts:105-107`), but the owned side has no way to record
or render *where* a post was syndicated, and posts carry no microformats —
webmention senders and IndieWeb parsers cannot identify the entry, its
permalink, or its publication date. This tactic adds both: an optional
`syndication` array on post metadata rendered as `u-syndication` links, and
`h-entry` microformat classes on the post markup. The human act of
syndicating (choosing targets, posting, recording the copy URLs) is
`tactic-indieweb-syndicate-posts`, blocked on this leaf.

This is exactly one PR (both units touch only `packages/blog`).

## Unit 1 — `syndication` field on post metadata

**Recommended model:** sonnet

Scope:

- `packages/blog/src/post-types.ts:3-5`: add optional `syndication?: string[]`
  to both arms of the `PostMeta` union (published and unpublished).
- `packages/blog/src/post-types.ts:14-52` (`validatePublishedPosts`): validate
  the optional field — when present it must be an array of strings (throw a
  descriptive error otherwise, matching the existing `previewImage` /
  `previewDescription` checks at `post-types.ts:33-38`) and pass it through to
  the returned `PublishedPost`.
- Unit tests in `packages/blog/test/` alongside the existing
  `validatePublishedPosts` cases: valid array passes through, non-array and
  non-string-element values throw, absent field stays absent.

Out of scope: any UI. No app seed data changes (the author records real
syndication URLs later via `tactic-indieweb-syndicate-posts`).

## Unit 2 — h-entry microformats and u-syndication rendering

**Recommended model:** opus

Dependencies: Unit 1 (`post.syndication` must exist on `PostMeta`).

Scope:

- `packages/blog/src/pages/Home.tsx:23-55` (`PostArticle`):
  - `className="h-entry"` on the `<Card as="article">` wrapper (line 26 —
    `CardProps extends HTMLAttributes<HTMLElement>` at
    `packages/ds/src/core/Card.tsx:3`, so `className` passes through; verify
    Card merges rather than drops it).
  - `u-url` added to the permalink anchor's class (line 28, alongside
    `post-link`), `p-name` alongside `post-title` (line 29), `dt-published`
    on the `<time>` element (line 39), `e-content` on the content div
    (lines 42-51).
  - **Preserve the hydration contract**: the comment at `Home.tsx:14-17`
    says the exact selectors (`post-link`, `post-title`, `#post-{id}`,
    `#post-content-{id}`) must survive verbatim — only *add* classes, never
    rename or restructure; check `packages/blog/src/pages/HomeRegion.tsx:96`
    and `packages/blog/src/pages/home.ts` for every selector the hydrator
    queries before touching markup.
  - When `post.syndication` is non-empty, render after the content div a
    small "Also posted at" block of
    `<a rel="syndication" className="u-syndication" href={url}>` links
    (hostname as the link text). Keep it a sibling *inside* the Card so
    the `#post-content-{id}` div's identity is untouched.
- Update the prerender/hydration snapshot tests that assert post markup
  (`packages/blog/test/prerender.test.ts`, e.g. the article assertions
  around lines 530-540 and 829-837) plus any Home/PostArticle component
  tests, and add cases: h-entry classes present; syndication block renders
  when URLs present and is absent otherwise.
- Author identity: the existing `rel=me` links (`packages/blog/src/seo.ts:
  109-111`) plus the JSON-LD author already cover identity; a full visible
  `h-card` is out of scope — add `p-author` only if it costs a single
  attribute on existing markup, otherwise skip.

Out of scope: fetching or displaying webmentions; feed changes (RSS already
carries canonical post links); any app-level (landing/fellspiral) file.

## Reuse

- `packages/blog/src/pages/Home.tsx` — `PostArticle` / `PostFeed`, the only
  post markup source (prerender renders the same components via
  `packages/blog/src/prerender.ts:370-390`).
- `packages/blog/src/post-types.ts` — `validatePublishedPosts` optional-field
  validation pattern.
- `packages/ds/src/core/Card.tsx` — `Card` already accepts arbitrary
  `HTMLAttributes`.

## Verification

```verify
npx vitest run --project packages/blog --root .
```

```verify
npx vitest run --project landing --root .
```

```verify
npx vitest run --project fellspiral --root .
```

Manual/QA: build one app (`npm run build --prefix landing`), open a
prerendered post page and confirm the article carries `h-entry`,
`dt-published`, `e-content` classes; paste the page HTML into a microformats
parser (e.g. the microformats.org validator) if browser QA is available.

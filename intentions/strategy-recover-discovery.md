---
id: strategy-recover-discovery
kind: strategy
statement: Recover discovery and filtering — own what reaches the attention queue
owner: human
status: refining
parent: strategy-recover-attention
rationale: >-
  The captured capability delegation-attention-services names is discovery and
  filtering — what reaches attention — yet print and audio recover consumption:
  they carry reading and listening the author already chose. The selection
  function has no owned artifact, and the record's own recovery path names the
  answer: direct sources, RSS, self-hosted filtering. This sub-strategy owns
  that layer: subscribed feeds and direct sources flowing into an owned
  read/listen-later queue that print and audio drain, so no recommender decides
  what is seen.

  Seeds already exist in prose-named artifacts per kind-strategy: the shared
  blog package parses RSS/Atom for its blog-roll (packages/blog/src/blog-roll),
  which can grow into the ingestion layer; the strategy is the intention, the
  tooling its current materialization.
reading: null
gap: null
serves: []
recovers:
  - delegation-attention-services
clarifications: []
tooling_goals: []
success_signal:
  observable: the share of new material entering the author's reading/listening
    queue via owned ingestion (feeds, direct sources) rather than platform
    recommenders
  sensor: owner review at office-hours
  threshold: new material enters through owned ingestion by default; platform
    recommenders are deliberate exceptions
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Cannot decompose this round: the minimum round to validate the signal
    (share of new material entering via owned ingestion) is the full
    owned-subscription + read/listen-later queue build, whose load-bearing
    architecture is undecided and design-entangled — not a design-neutral
    instrument a session can plan without inventing product design the author
    has not specified. Concretely: blog-roll is build-time-only
    (vite-plugin-feed-fetch.ts fetches a hardcoded 3-feed FEED_REGISTRY at
    buildStart into a static widget), not a runtime subscription system; print
    is a file-based PDF/EPUB reader (library.ts/bookmarks.ts, MediaItem) with no
    web-article ingestion; audio is likewise file-based — so 'a
    read/listen-later queue that print and audio drain' has multiple plausible
    readings that change the whole decomposition. Next steps: author decides (1)
    what a queue item is — URL bookmark vs server-side reader-mode extraction to
    EPUB/PDF vs saved file; (2) where the queue lives — extend print's library,
    a new surface/app, or a shared ingestion package reusing feed-proxy +
    parse-feed.ts; (3) the drain/integration contract bridging a web feed item
    into print's PDF/EPUB library and audio's player; (4) subscription
    management replacing the hardcoded FEED_REGISTRY/ALLOWED_FEED_URLS
    allowlist. Record these as strategy clarifications/conditions via
    /align-strategy, then re-run /align-tactics; the existing draft
    tactic-feed-ingestion is the input to that round."
  since: 2026-07-07
  recommendation: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - sources the author cares about keep publishing feeds or direct-access
      pages outside platform apps
---
# Recover discovery and filtering — own what reaches the attention queue

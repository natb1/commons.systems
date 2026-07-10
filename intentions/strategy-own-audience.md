---
id: strategy-own-audience
kind: strategy
statement: Own the audience relationship — readers connect by feed and
  webmention, not by platform account
owner: human
status: refining
parent: strategy-recover-publishing
rationale: >-
  Both social records name the same unrecovered residue — the platform-held
  audience graph, twice called the sticky remainder. strategy-recover-publishing
  put the work on owned domains; this sub-strategy owns making the reader's
  connection to that work portable and platform-free. Outbound feeds already
  ship (the blog package emits RSS); the remaining IndieWeb half is syndication
  with canonical links back (POSSE), webmentions for responses, and a subscriber
  relationship that lives on the owned domain.

  This is virtue-respect-for-persons content as much as detachment: the reader
  follows and responds on terms neither party rents from an engagement platform.
reading: null
gap: null
serves: []
recovers:
  - delegation-social-publishing
clarifications:
  - question: Which success_signal threshold legs already hold on the owned
      publication surfaces?
    answer: "The feeds leg fully ships: packages/blog emits RSS
      (packages/blog/src/feed-rss.ts, vite-plugin-feed-xml.ts) and both surfaces
      carry feed discovery links (landing/index.html and fellspiral/index.html
      rel=alternate application/rss+xml) plus rel=me identity links
      (packages/blog/src/seo.ts relMeLinkTags). No webmention, microformats, or
      syndication code exists anywhere in the repo. Round 1 therefore authors no
      feed tactic and targets only the webmention response path and the
      syndication-with-canonical-links legs. Recorded 2026-07-06 /align-tactics
      round."
  - question: How is the webmention endpoint hosted?
    answer: "Self-hosted receiver as a Firebase Cloud Function (pattern:
      functions/src/feed-proxy.ts) rather than a third-party endpoint service
      such as webmention.io. This keeps the response path on owned
      infrastructure, matches the recorded condition that IndieWeb building
      blocks stay implementable on self-hosted sites, and needs no author
      account provisioning. Immaterial to strategy substance — either hosting
      choice satisfies the signal; recorded for visibility, and webmention.io
      remains the fallback if function abuse or cost becomes a problem. Recorded
      2026-07-06 /align-tactics round."
  - question: Does the 2026-07-06 "feeds leg fully ships" reading still hold?
    answer: "Contradicted in part by the 2026-07-07 comprehensive code review: the
      published blogroll OPML outlines carry htmlUrl but no xmlUrl, so a feed
      reader importing the blogroll cannot actually subscribe to anything — the
      artifact's whole purpose; and landing's blogroll uses StaticStrategy with
      hand-curated latest-post entries that go stale silently, while the
      build-time feed-fetch already built for fellspiral is strictly better and
      available. The RSS/discovery/rel=me legs stand. Fixes drafted at
      tactic-blogroll-opml-xmlurl and tactic-landing-blogroll-staleness.
      Recorded 2026-07-07 code review."
tooling_goals: []
success_signal:
  observable: readers can follow, subscribe, and respond to the owned sites
    without any platform account
  sensor: owner review at office-hours
  threshold: feeds, syndication-with-canonical-links, and a platform-free response
    path exist on every owned publication surface
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes:
  conditions:
    - IndieWeb building blocks (feeds, webmention) remain implementable on
      static, self-hosted sites
---
# Own the audience relationship — readers connect by feed and webmention, not by platform account

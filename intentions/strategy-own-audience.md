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
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers:
  - delegation-social-publishing
clarifications: []
tooling_goals: []
success_signal:
  observable: readers can follow, subscribe, and respond to the owned sites
    without any platform account
  sensor: owner review at office-hours
  threshold: feeds, syndication-with-canonical-links, and a platform-free response
    path exist on every owned publication surface
  is_proxy: true
attributes:
  conditions:
    - IndieWeb building blocks (feeds, webmention) remain implementable on
      static, self-hosted sites
---
# Own the audience relationship — readers connect by feed and webmention, not by platform account

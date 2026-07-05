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
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
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
attributes:
  conditions:
    - sources the author cares about keep publishing feeds or direct-access
      pages outside platform apps
---
# Recover discovery and filtering — own what reaches the attention queue

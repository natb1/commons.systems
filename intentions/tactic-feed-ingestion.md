---
id: tactic-feed-ingestion
kind: tactic
statement: Grow the blog-roll feed parser into an owned subscription and
  read-later queue feeding print
owner: human
status: raw
parent: null
rationale: "The blog package already parses RSS/Atom
  (packages/blog/src/blog-roll). Grow that into the owned ingestion layer:
  subscriptions, direct sources, and a read/listen-later queue that print and
  audio drain."
reading: null
gap: null
serves:
  - strategy-recover-discovery
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attributes: {}
---
# Grow the blog-roll feed parser into an owned subscription and read-later queue feeding print

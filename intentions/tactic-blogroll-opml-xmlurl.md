---
id: tactic-blogroll-opml-xmlurl
kind: tactic
statement: Add xmlUrl to the published blogroll OPML outlines so feed readers
  can actually subscribe
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review: the blogroll
  is published as OPML with CORS * (an owned syndication artifact), but its
  outlines carry htmlUrl only — no xmlUrl — so importing it into a feed reader
  subscribes to nothing, undermining the artifact's purpose. The FEED_REGISTRY
  already knows each entry's feed URL. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-own-audience
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
# Add xmlUrl to the published blogroll OPML outlines so feed readers can actually subscribe

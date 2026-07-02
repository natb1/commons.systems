---
id: tactic-populate-tactic-serves
kind: tactic
statement: Classify serves on the existing generated tactics and require serves
  at emit time
owner: human
status: raw
parent: null
rationale: All generated tactics carry empty serves edges, so the graph cannot
  say which strategies current work advances or which strategies have no work at
  all. Backfill the existing tactics through the dialectic, and make
  intention-emit / file-issue require a serves classification for new ones.
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attributes: {}
---
# Classify serves on the existing generated tactics and require serves at emit time

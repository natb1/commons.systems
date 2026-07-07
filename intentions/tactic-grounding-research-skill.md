---
id: tactic-grounding-research-skill
kind: tactic
statement: "Draft: interactive grounding-research skill — consume the tick gap
  analysis, mark circumstantial nodes, /deep-research the rest into candidate
  curriculum chunks"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-07 /align-strategy interview
  (retain-not-refine): a skill run only interactively by the author — it
  identifies graph nodes with no grounding after tick analysis, distinguishes
  nodes ungrounded because they are circumstantial to the author, and for the
  rest performs /deep-research to identify relevant frontier work to be added to
  the curriculum. Instruments the strategy's interactive-research actuator
  tooling goal."
reading: null
gap: null
serves:
  - strategy-complete-grounding
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
# Draft: interactive grounding-research skill — consume the tick gap analysis, mark circumstantial nodes, /deep-research the rest into candidate curriculum chunks

Retained interview context for the /align-tactics round that plans this
(2026-07-07 /align-strategy, strategy-complete-grounding):

- **Author-invoked only, never tick-invoked** — an interview-fixed condition
  on the strategy. The tick's gap analysis
  (`tactic-grounding-gap-analysis`, sibling draft) is its input.
- **Flow**: walk the ranked unmarked nodes with the author; for each, first
  ask whether it is ungrounded because it is *circumstantial to the author*
  (mark `attributes.grounding: circumstantial: <why>`) — for the rest, run
  `/deep-research` to identify relevant frontier work across philosophical,
  technical, peer-review, and creative literature; a search that comes back
  empty marks `attributes.grounding: none-found: <date>`.
- **Output**: candidate curriculum chunks in the chunks-10–17 convention
  (born-parked office-hours, `attributes.curriculum` with `candidate: true`,
  priority appended after the existing queue), landed via `graph-commit`.
- Marks are applied here because the author is present — this is the one
  place grounding/circumstantial marks are written outside a
  `/reading-review` session.

---
id: tactic-copy-approval-planning-rule
kind: tactic
statement: Encode the copy-approval gate into /align-tactics planning — any
  decomposed tactic touching in-scope copy is minted with a born-parked
  author-approval gate and a blocked_by edge
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 interview that recorded
  strategy-author-approved-copy: standardizing the born-parked gate mechanism
  only guarantees the rule if planning applies it mechanically. Without this,
  each /align-tactics run must remember the rule from the strategy text —
  exactly the per-interview re-derivation the strategy exists to end."
reading: null
gap: null
serves:
  - strategy-author-approved-copy
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
# Encode the copy-approval gate into /align-tactics planning — any decomposed tactic touching in-scope copy is minted with a born-parked author-approval gate and a blocked_by edge

Draft tactic retained from the 2026-07-07 /align-strategy interview
(strategy-author-approved-copy). Not yet planned — /align-tactics consumes
this body when the strategy is decomposed.

## What to encode

When an /align-tactics decomposition (or any planning pass) produces a
tactic whose scope touches in-scope copy — landing, about page, app heroes
and onboarding text, README, blog posts, per the strategy's scope
clarification — planning must also:

1. Mint a sibling approval tactic in the born-parked shape
   (tactic-readme-copy-approval is the reference instance): owner: human,
   status: delegated, office_hours: {reason, since}, serves the same
   strategy as the copy tactic.
2. Set blocked_by on the copy tactic pointing at the gate.
3. Put the draft copy in the copy tactic's body so the author has
   something concrete to ratify or revise at office-hours.

Exemption per the strategy: mechanical fixes (typos, broken links, factual
corrections with no reframing and no new claims) are not gated; any doubt
means gated.

## Candidate homes (audit at planning time)

- .claude/skills/align-tactics/SKILL.md — a planning-checklist step where
  decomposition classifies each tactic as copy-touching or not.
- Possibly a validate-graph advisory: an in-scope-copy tactic with no
  blocked_by gate is at least a warning. (Whether scope detection is
  mechanizable is for the planning pass to judge — statement text alone
  may not identify copy-touching work reliably.)

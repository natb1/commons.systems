---
id: tactic-readme-copy-approval
kind: tactic
statement: Approve the README data-structure-first copy at office-hours — ratify
  or revise the draft headline, subline, and identity sentence before the
  rewrite is implemented
owner: human
status: delegated
parent: null
rationale: "Added 2026-07-07 at the author's direction: README copy must receive
  explicit human approval before deployment. The draft copy already lives in
  tactic-readme-data-structure-first's body, so approval runs before
  implementation, not after: tactic-readme-data-structure-first is blocked_by
  this tactic, and the router cannot select the rewrite until the author records
  approval here. Approval outcome (ratified or revised copy) is recorded as a
  dated clarification on strategy-data-structure-first; this tactic then
  completes and unblocks the rewrite."
reading: null
gap: null
serves:
  - strategy-data-structure-first
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
# Approve the README data-structure-first copy at office-hours — ratify or revise the draft headline, subline, and identity sentence before the rewrite is implemented

Born-parked human gate, added 2026-07-07 at the author's direction. This
tactic is the office-hours approval of the README copy; tactic-readme-
data-structure-first is blocked_by it, so the rewrite cannot run — and
therefore cannot deploy — until this completes.

## What to review

All draft copy lives in tactic-readme-data-structure-first's body:

- The headline: "commons.systems: A data structure for managing intentions
  and alignment."
- The subline: "Use it with your own project management and agentic
  workflows, or use it with the provided long horizon agentic coding
  harness."
- The identity sentence replacement (spec + reference implementation, per
  strategy clarification 4).

## What approval means

Ratify the copy as-is or revise it. Either way, record the outcome as a
dated clarification on strategy-data-structure-first (the approved wording,
or the revision and why). Then complete this tactic, which unblocks the
rewrite; the implementing session settles remaining wording only within the
approved copy.

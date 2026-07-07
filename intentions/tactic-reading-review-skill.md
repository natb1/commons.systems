---
id: tactic-reading-review-skill
kind: tactic
statement: "Draft: office-hours reading-review skill — run one curriculum
  chunk's demonstration, amend-or-ratify the records, resolve the chunk node"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy interview
  (retain-not-refine): the author expects the curriculum's office-hours sessions
  to be skill-guided — demonstrate understanding of the tradition and its
  application to the deferral, revise the graph where the reading contradicts
  it, and resolve the chunk node, which is what triggers /sync-reader's
  retirement of the chunk's excerpt from the reader. Instruments
  strategy-philosophical-grounding's owner-review-at-office-hours sensor."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# Draft: office-hours reading-review skill — run one curriculum chunk's demonstration, amend-or-ratify the records, resolve the chunk node

Retained context from the 2026-07-06 /align-strategy interview. The author:
"During office hours the author is expected to demonstrate understanding of the
tradition and application to the deferral, revising the graph if necessary.
This merits an additional skill to be executed during office hours."

## Flow (from the interview and the chunk-node convention)

One chunk per session, selected by curriculum priority among unresolved
`tactic-reading-chunk-*` nodes:

1. Surface the chunk's text citation and its "Questions to re-open against the
   text" list (the chunk node body carries both).
2. The author demonstrates understanding of the tradition and its application
   to the deferral — the resolutions being checked were made on Claude's
   account of the text; the chunk checks the account.
3. Record outcomes per the standing rules on
   `strategy-philosophical-grounding`: amend the tradition record where the
   reading contradicts it (the reading wins — correction round, cascading to
   any virtue clarification that leaned on the misarticulation), ratify where
   it holds. Both count toward the strategy's signal; ratification flips trust
   to verification.
4. Stamp `last_exercised` on `delegation-philosophical-articulation`; when all
   of a tradition record's cited texts are covered across chunks, flip the
   record `status: delegated → codified`.
5. Resolve the chunk node and land everything via `graph-commit` — resolution
   (and removal from the graph) is the trigger for `/sync-reader`
   (`tactic-sync-reader-skill`) to retire the chunk's excerpt from the reader.

## Notes

- This skill instruments the strategy's success-signal sensor ("owner review
  at office-hours") — it is the recorded form of the demonstration, not a
  replacement for the reading itself, which stays non-delegable
  (`office_hours` on every chunk node).
- Relationship to the generic `/office-hours` dispatcher: that skill selects
  parked items and stops read-only; this one runs the substantive chunk
  session. Whether it becomes a branch of `/office-hours` or a standalone
  skill is an `/align-tactics` decision.

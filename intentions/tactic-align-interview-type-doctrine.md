---
id: tactic-align-interview-type-doctrine
kind: tactic
statement: "Encode the two-interview-type doctrine into the /align-strategy
  skill: per-interview type classification, type-b-first ordering, boldness
  assessment on every recommendation, an accept-as-deferral option in every
  question, and the deferral-creates-a-review-item rule"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 interview-types round (the
  two-interview-type and universal-deferral clarifications on
  strategy-explicit-intent): the doctrine is recorded but the skill does not yet
  instruct sessions to classify each interview by where the authoritative model
  lives, run type b before type a when required author knowledge is unrecorded,
  attach an honest boldness assessment to every recommendation, offer
  accept-as-deferral alongside every recommended option, or create the
  office-hours/curriculum review item every deferral requires. Coordinates with
  tactic-align-strategy-alignment-tests (same SKILL.md surface, separable
  subject — that draft carries the doctrinal-consistency gate and steelman
  challenge); refines nothing in that draft."
reading: null
gap: null
serves:
  - strategy-explicit-intent
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
# Encode the two-interview-type doctrine into the /align-strategy skill: per-interview type classification, type-b-first ordering, boldness assessment on every recommendation, an accept-as-deferral option in every question, and the deferral-creates-a-review-item rule

Retained draft from the 2026-07-09 /align-strategy interview-types round —
input to a future /align-tactics pass; not yet a plan.

## Context

The 2026-07-09 round recorded the two-interview-type doctrine on
strategy-explicit-intent (clarification: 'What interview types do align
sessions run, and which rules bind each?') and the universal deferral rule
(clarification: 'What does a deferral commit the author to...'). The
/align-strategy skill's interview (step 2) predates both: it runs one
undifferentiated dialectic with recommended-option-first questions, no type
classification, no boldness assessment, no deferral option, and no
deferral-to-review-item mechanism.

## Scope (draft)

Edit `.claude/skills/align-strategy/SKILL.md` (and mirror where the same
conventions appear in `/align-tactics` if its interview surfaces exist):

1. **Type classification** — each interview is classified by where the
   authoritative model currently lives and the session states the type:
   type b (record authoritative, author drifted or not yet internalized —
   full periagoge rules: probes cite the record at origin/main, author
   articulates first, just-argument compulsion with the three recorded
   exits: amend / defer / diverge) or type a (model in the author,
   unrecorded or unformed — visible-refusable-draft rules: seams proposed
   with consequences explored).
2. **Type-b-first ordering** — when required author knowledge is not
   recorded in the graph, run the type-b interview before the type-a
   seam-confirmation round.
3. **Boldness assessment** — every recommendation states how much rests on
   the graph and session context versus Claude-internal knowledge.
4. **Deferral option** — every AskUserQuestion recommendation is
   accompanied by an accept-as-deferral option.
5. **Deferral mechanics** — an accepted deferral lands as a dated
   held-on-trust clarification, extends
   delegation-philosophical-articulation's scope when it defers to Claude's
   articulation, and always creates an office-hours/curriculum-style review
   item (reading chunk if a text grounds it, office-hours review sitting
   otherwise).

Coordinates with tactic-align-strategy-alignment-tests (doctrinal-consistency
gate + steelman challenge, same SKILL.md); refines nothing in that draft.
Landing caveat: `.claude/skills/**` edits are agent-behavior config —
dispatch auto mode denies the commit; park for interactive landing if hit.

Out of scope: /align-init; automating type classification without the
author in the loop.

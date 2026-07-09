---
id: tactic-align-interview-type-doctrine
kind: tactic
statement: "Encode the two-interview-type doctrine into the /align-strategy
  skill: per-interview type classification, type-b-first ordering with
  ground-depth, boldness assessment on every recommendation, an
  accept-as-deferral option in every question, the
  deferral-creates-a-review-item rule, and the context-delivery convention for
  question rounds"
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
2. **Type-b-first ordering and ground-depth** — when required author
   knowledge is not recorded in the graph, run the type-b interview before
   the type-a seam-confirmation round; and type b explores the topic's
   ground — the knowledge needed to decide, across the record and the
   relevant traditions — not merely the pending decision surface (a type b
   confined to ratifying decision mechanics is the named deviation).
3. **Boldness assessment** — in both interview types, every question round
   carries a recommendation, and every recommendation states its boldness —
   how much rests on the graph and session context versus Claude-internal
   knowledge — in the question round itself (option label, description, or
   preview), where the author will read it, never only in preamble prose.
4. **Deferral option** — in both interview types, every AskUserQuestion
   recommendation is accompanied by an explicit accept-as-deferral option.
5. **Deferral mechanics** — an accepted deferral lands as a dated
   held-on-trust clarification, extends
   delegation-philosophical-articulation's scope when it defers to Claude's
   articulation, and always creates an office-hours/curriculum-style review
   item (reading chunk if a text grounds it, office-hours review sitting
   otherwise).
6. **Context delivery** — every AskUserQuestion execution carries the
   context that motivates the interview where the author will actually read
   it (in both types). The author does not read Claude's thinking, and —
   found live 2026-07-09 (second round) — message text emitted in the same
   turn as the AskUserQuestion call is also not rendered to the author
   before the questions: analysis living in thinking, tool results, or
   same-turn preamble is invisible at answer time. Motivating context must
   therefore travel inside the question tool itself (option preview panes
   and descriptions; question text) or in a prior turn the author has
   already read and responded to. Questions must be self-contained — never
   referencing unseen items ("the plan above").

Coordinates with tactic-align-strategy-alignment-tests (doctrinal-consistency
gate + steelman challenge, same SKILL.md); refines nothing in that draft.
Landing caveat: `.claude/skills/**` edits are agent-behavior config —
dispatch auto mode denies the commit; park for interactive landing if hit.

Out of scope: /align-init; automating type classification without the
author in the loop.

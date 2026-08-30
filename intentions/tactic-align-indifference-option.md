---
id: tactic-align-indifference-option
kind: tactic
statement: Encode the three-option interview round — recommendation,
  accept-as-deferral, indifference-as-delegation — plus the virtue/strategy-core
  floor and the revision-authority rule, into the /align skill surface
owner: ai
status: raw
parent: null
rationale: Retained from the 2026-08-30 /align interview. The graph now records
  the doctrine (this strategy's 2026-08-30 clarifications, plus the amendments
  to clarifications 7 and 8); the skill prose that binds an interview session
  still describes a two-option round, so a session reading only the skill would
  not offer the third option. strategy-explicit-intent owns the align dialectic
  as an artifact (its rationale names it), so this is the artifact owner per
  strategy clarification 27.
reading: null
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
# Encode the three-option interview round — recommendation, accept-as-deferral, indifference-as-delegation — plus the virtue/strategy-core floor and the revision-authority rule, into the /align skill surface

Retain-not-refine draft from the 2026-08-30 /align interview. Not a plan.

## The gap

The doctrine landed on `strategy-explicit-intent` this round (two new 2026-08-30
clarifications, plus dated amendments to clarifications 7 and 8). The skill prose
an interview session actually reads has not moved: `.claude/skills/align/SKILL.md`
still describes a **two**-option round in two places — "Question mechanics", item
3 ("an explicit accept-as-deferral option alongside plain acceptance"), and the
"Deferral mechanics" subsection, which opens "A deferral is always
defer-until-later-review" and states that **every** deferral produces exactly one
born-parked review item. A session reading only the skill would not offer the
third option, and would mint a review item for an indifference answer.

## What to encode

- **Three options, every round, both interview types.** Recommendation with its
  boldness assessment; accept-as-deferral; indifference.
- **Indifference is a delegation, not a deferral.** It lands as a dated
  clarification marked Claude-owned and mints **no** review node. The
  "Deferral mechanics" typology (reading chunk vs office-hours sitting) applies
  only to review-later deferrals, which are otherwise unchanged — they still
  mint their born-parked node at deferral time, text-grounded or not.
- **The floor.** Indifference is unavailable for virtue substance and for a
  strategy's `statement`, `rationale`, and `success_signal`. Available for
  mechanism, encoding, tactic shape, naming, sequencing, and the clarifications
  resolving those. At the floor Claude may not compel: re-frame the question
  until it is answerable, or record that the author declined to hold a view —
  which is itself author doctrine.
- **Revision authority.** Neither deferred nor indifference-delegated content is
  doctrine. Indifference-delegated content is freely and silently revisable as
  ordinary design work. Review-deferred content is revisable too, but the
  revision carries forward: the pending review node re-points at the revised
  content and the revision is recorded, so a sitting never reviews a superseded
  draft.
- **No per-decision delegation-record extension.** An indifference-delegation
  does not extend a delegation node's `attributes.delegated` in-round — that
  would reintroduce the per-decision pollution the option exists to avoid. This
  is the deliberate asymmetry with a deferral to Claude's philosophical
  articulation, which *does* extend
  `delegation-philosophical-articulation` in-round. Keep that contrast explicit
  in the prose; it is the part most likely to be "corrected" back by a later
  reader who sees only the older rule.

## Scope note

Only `/align` runs interview rounds — `/align-tactics` never calls
`AskUserQuestion` mid-run, so its skill surface is out of scope. `/reading-review`
and the office-hours skills present author choices but are not interviews in this
sense; whether the three-option convention should extend to them is an open
question for the round, not a settled requirement.

## Marker convention is undecided

The doctrine says indifference-delegated content is "marked Claude-owned" but
does not say how. A structured field, a prose convention in the clarification
answer, or reuse of an existing marker are all open. It sits below the 2026-08-30
floor (encoding), so the round decides it as a Claude-owned delegation rather
than escalating — but it must be decided *once* and consistently, since the
review-debt signal and the virtual review node
(`tactic-node-review-skill`) both need to tell the two content classes apart.

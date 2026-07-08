---
id: tactic-align-strategy-alignment-tests
kind: tactic
statement: "Add two alignment tests to the /align-strategy interview: a
  doctrinal-consistency gate against the recorded model of the good, and a
  steelman-alternative challenge, both resolved as dated clarifications"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-08 graph-function interview (clarification
  5 on strategy-explicit-intent): /align-strategy records strategies into the
  model of the good but tests neither internal consistency with that model —
  beyond validateGraph rule 8 referential integrity — nor the strategy against
  plausible alternative conceptions. Both tests ran this round only because the
  requirement text demanded them, and the consistency test caught a live failure
  mode (stale working-tree doctrine presented as current)."
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
# Add two alignment tests to the /align-strategy interview: a doctrinal-consistency gate against the recorded model of the good, and a steelman-alternative challenge, both resolved as dated clarifications

Retained draft from the 2026-07-08 /align-strategy graph-function round —
input to a future /align-tactics pass; not yet a plan.

## Context

The graph's function doctrine (strategy-explicit-intent, 2026-07-08
clarifications) demands that every strategy entering the model be tested for
internal consistency with the model of the good and against plausible
alternative conceptions. /align-strategy currently runs neither test:
step 2.2 checks only that `serves` resolves to a real virtue (validateGraph
rule 8 — referential integrity), and step 1.2's duplicate detection is
keyword overlap. The alternatives test exists only in
strategy-philosophical-grounding's periodic rounds, so strategies recorded
between rounds enter untested.

## Scope (draft)

Edit `.claude/skills/align-strategy/SKILL.md`, step 2 (and mirror in the
improvement-pass branch for edits):

1. **Doctrinal-consistency gate** — after placement (step 2.2): read, at
   `origin/main` (never the working tree — the 2026-07-08 round hit the
   stale-checkout failure mode live, presenting pre-amendment doctrine as
   current), the served virtues' rationales and `tension_with` pairs, plus
   overlapping strategies' clarifications and conditions, plus the tradition
   records the served virtues cite. Surface every contradiction between the
   drafted statement/rationale and that doctrine as an interview question;
   each resolution lands as a dated clarification.
2. **Steelman-alternative challenge** — before the signal step: articulate
   the strongest rival framing of the strategy's intent, sourced from the
   tradition records (adopted/diverged/chosen_over entries) or a named
   candidate tradition; put it to the author via AskUserQuestion; record the
   resolution as a dated clarification in the adopt/diverge shape.

Out of scope: /align-tactics and /align-init (sibling skills); automating
either test without the author in the loop.

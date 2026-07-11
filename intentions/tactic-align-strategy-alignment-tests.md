---
id: tactic-align-strategy-alignment-tests
kind: tactic
statement: "Add two alignment tests to the /align-strategy interview: a
  doctrinal-consistency gate against the recorded model of the good, and a
  steelman-alternative challenge, both resolved as dated clarifications"
owner: ai
status: codified
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
attention:
  boost: 8
  override: null
  rationale: "Author-directed 2026-07-09: a direct skill-edit tactic — it adds two
    alignment tests to the /align-strategy interview in
    .claude/skills/align-strategy/SKILL.md — so it belongs at the same top tier
    as the other skill-edit tactics (tactic-align-skills-latest-graph-guard,
    tactic-fingerprint-recipe-single-callsite: authored 8). Those sit in
    strategy-graph-native-dispatch's subtree and reach 8 as boost 3 + inherited
    5; this tactic serves strategy-explicit-intent (unboosted), so it inherits
    nothing and takes the full boost 8 directly to reach the same authored-8
    tier and be prioritized by the next dispatch tick."
phase: implement
execution:
  branch: tactic-align-strategy-alignment-tests
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: a10d001daf8fd0335625aea2c5eb394c1216abdd4d73313c6ba3881e2f69a64b
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add two alignment tests to the /align-strategy interview: a doctrinal-consistency gate against the recorded model of the good, and a steelman-alternative challenge, both resolved as dated clarifications

## Context

The graph's function doctrine (strategy-explicit-intent, 2026-07-08
clarifications — in particular "Does /align-strategy itself run the tests
this doctrine demands...") requires every strategy entering the model to be
tested for internal consistency with the recorded model of the good and
against plausible alternative conceptions. `/align-strategy` currently runs
neither: step 2.2 (`.claude/skills/align-strategy/SKILL.md:158`) checks only
that `serves` resolves to a real virtue (validateGraph rule 8), and step 1.2
(`SKILL.md:99`) is keyword duplicate detection. The alternatives test lives
only in strategy-philosophical-grounding's periodic rounds, so strategies
recorded between rounds enter untested. The 2026-07-08 round also caught the
live failure mode the new gate must avoid: a stale working tree presented
pre-amendment doctrine as current — so the gate reads doctrine at
origin/main, never from the working tree.

Blocked on tactic-align-interview-type-doctrine: same SKILL.md surface, and
that tactic lands the question-round mechanics (boldness, accept-as-deferral,
context delivery) this tactic's new interview questions must follow.

## Unit 1 — doctrinal-consistency gate

**Recommended model:** opus

Scope — `.claude/skills/align-strategy/SKILL.md`, "## Step 2 — Interview
dialectic" (line 151):

- Insert after step 2.2 (placement, line 158): read, at origin/main (e.g.
  `git show origin/main:intentions/<id>.md` — never the working tree), the
  served virtues' rationales and `tension_with` pairs, overlapping
  strategies' clarifications and `attributes.conditions`, and the tradition
  records the served virtues cite. Surface every contradiction between the
  drafted statement/rationale and that doctrine as an interview question;
  each resolution lands as a dated clarification (existing step 2.6
  provenance convention).
- Edit path too: when step 1.2 classifies the target as an edit of an
  existing strategy, the gate runs against the revised statement/rationale
  as well.

## Unit 2 — steelman-alternative challenge

**Recommended model:** opus

Dependencies: Unit 1 (same section of the same file; sequential edits).

Scope — same file, Step 2:

- Insert before the signal step (step 2.4, line 167): articulate the
  strongest rival framing of the strategy's intent, sourced from the
  tradition records (adopted/diverged/chosen_over entries) or a named
  candidate tradition; put it to the author via `AskUserQuestion` (question
  mechanics per the interview-type doctrine landed by the blocking tactic:
  recommendation + boldness + accept-as-deferral, context inside the tool);
  record the resolution as a dated clarification in the adopt/diverge shape.

Out of scope: /align-tactics and /align-init (sibling skills); automating
either test without the author in the loop; the step-1 no-text
improvement-pass branch (its retirement is a separate author-reserved
decision — see tactic-align-audit-legacy-review).

Landing caveat: `.claude/skills/**` edits are agent-behavior config —
dispatch auto mode may deny the commit; if hit, park for interactive
landing.

## Reuse

- Doctrine home: `intentions/strategy-explicit-intent.md`, the 2026-07-08
  function-doctrine clarifications (the "Does /align-strategy itself run the
  tests..." entry is this tactic's origin and names both tests).
- origin/main read pattern: `git show origin/main:<path>` (the
  stale-checkout failure-mode fix recorded in that clarification).
- Provenance-sentence convention:
  `.claude/skills/align-strategy/SKILL.md:175-180` (step 2.6).

## Verification

Prose (skill-doc edit, no runnable suite): re-read the edited Step 2 — the
gate names origin/main (not the working tree) as its doctrine source; both
tests resolve into dated clarifications; the new questions carry
recommendation + boldness + accept-as-deferral per the blocking tactic's
mechanics; the 8-category table's Compliance and Correctness rows still
hold; the diff stays inside `.claude/skills/align-strategy/SKILL.md`.

## Implementation notes

Two ordered units, one PR. Implement each unit in a subagent launched with
`model: opus`; supply this Context and the unit's Scope in the subagent
prompt; constrain it to working-tree edits only.

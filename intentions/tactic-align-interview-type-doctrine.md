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
status: codified
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
attention:
  boost: 8
  override: null
  rationale: "Author-directed 2026-07-09: a direct skill-edit tactic — it encodes
    the two-interview-type doctrine into .claude/skills/align-strategy/SKILL.md
    — so it belongs at the same top tier as the other skill-edit tactics
    (tactic-align-skills-latest-graph-guard,
    tactic-fingerprint-recipe-single-callsite: authored 8). Those sit in
    strategy-graph-native-dispatch's subtree and reach 8 as boost 3 + inherited
    5; this tactic serves strategy-explicit-intent (unboosted), so it inherits
    nothing and takes the full boost 8 directly to reach the same authored-8
    tier and be prioritized by the next dispatch tick."
phase: qa
execution:
  branch: tactic-align-interview-type-doctrine
  pr: 2849
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: a10d001daf8fd0335625aea2c5eb394c1216abdd4d73313c6ba3881e2f69a64b
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode the two-interview-type doctrine into the /align-strategy skill: per-interview type classification, type-b-first ordering, boldness assessment on every recommendation, an accept-as-deferral option in every question, and the deferral-creates-a-review-item rule

## Context

The 2026-07-09 interviews recorded the two-interview-type doctrine on
strategy-explicit-intent (clarification "What interview types do align
sessions run, and which rules bind each?" — including its four same-date
amendments: (a) type-b ground-depth, (b) maieutic naming held as a deferral,
(c) universality of the recommendation/boldness/deferral loop across both
types, (d) context delivery inside the question tool) and the universal
deferral rule (clarification "What does a deferral commit the author to —
and do deferrals without a grounding text get lighter treatment?"). The
`.claude/skills/align-strategy/SKILL.md` interview ("## Step 2 — Interview
dialectic", line 151) predates both: one undifferentiated dialectic with
recommended-option-first questions, no type classification, no boldness
assessment, no accept-as-deferral option, and no deferral-to-review-item
mechanism. This tactic encodes the doctrine into the skill so interactive
rounds bind to it without re-deriving it from the strategy node each time.

Read the doctrine verbatim from `intentions/strategy-explicit-intent.md`
(the two clarifications named above) before editing — the strategy node is
the doctrine's home; the skill instructs, it never re-derives.

## Unit 1 — encode the doctrine into /align-strategy's interview

**Recommended model:** opus

Scope — `.claude/skills/align-strategy/SKILL.md` only:

- Add an interview-type preamble to "## Step 2 — Interview dialectic"
  (line 151): classify each interview by where the authoritative model
  currently lives, and have the session state the type. Type b (record
  authoritative; author drifted or not yet internalized): full periagoge
  rules — probes cite the record at origin/main as the fixed object, the
  author articulates before Claude's account appears, compulsion is argument
  only, with the three recorded exits always open (amend the record / defer
  / claim authority as an intentional divergence); Claude never blocks and
  never withholds recording. Type a (model lives in the author, unrecorded
  or unformed): visible-refusable-draft rules — Claude proposes viable seams
  and explores consequences to author feedback.
- Type-b-first ordering and ground-depth: when required author knowledge is
  unrecorded, run type b before type a; type b explores the topic's ground —
  the knowledge needed to decide, across the record at origin/main and the
  relevant traditions, recorded and Claude-internal alike — not merely the
  pending decision surface (a type b confined to ratifying decision
  mechanics is the named deviation).
- Question mechanics, both types: every question round carries a
  recommendation; every recommendation carries an honest boldness assessment
  (how much rests on the graph and session context versus Claude-internal
  knowledge); an explicit accept-as-deferral option always accompanies the
  recommended one. Attach where step 2's AskUserQuestion mechanics are
  described (step 2.1, line 154; the design-canvas item, line 181).
- Deferral mechanics: an accepted deferral lands as a dated held-on-trust
  clarification on the affected node; when it defers to Claude's
  articulation it extends delegation-philosophical-articulation's scope in
  the same round; and every deferral creates a review item — a reading chunk
  when a grounding text exists, an office-hours review sitting otherwise. No
  deferral gets lighter treatment for lacking a text.
- Context delivery, both types: a question round's motivating context —
  including each recommendation's boldness — is delivered inside the
  question tool itself (question text, option descriptions, preview panes)
  or in a prior turn the author has already read and responded to; the
  author reads neither Claude's thinking nor same-turn preamble emitted
  before the question call; a question never references material the author
  has not seen.

Out of scope: /align-tactics (autonomous, never `AskUserQuestion` — no
interview surface to mirror) and /align-init; automating type classification
without the author in the loop; the doctrinal-consistency gate and steelman
challenge (tactic-align-strategy-alignment-tests, blocked on this tactic,
same SKILL.md surface).

Landing caveat: `.claude/skills/**` edits are agent-behavior config —
dispatch auto mode may deny the commit; if hit, park for interactive landing
rather than working around the denial.

## Reuse

- Doctrine home (read verbatim): `intentions/strategy-explicit-intent.md`,
  clarifications "What interview types do align sessions run..." and "What
  does a deferral commit the author to...".
- Existing provenance-sentence convention:
  `.claude/skills/align-strategy/SKILL.md:175-180` (step 2.6).
- Instruction-writing conventions: the `ref-write-instructions` skill
  (`.claude/skills/ref-write-instructions`) — invoke before editing.

## Verification

Prose (a skill-doc edit has no runnable suite): re-read the edited Step 2
against the two strategy clarifications and confirm all six doctrine
elements appear (type classification; type-b-first + ground-depth; boldness
on every recommendation; accept-as-deferral in every question; the
deferral-creates-a-review-item rule; context delivery inside the question
tool). Confirm nothing contradicts the skill's existing Step 4/5 mechanics,
and the diff stays inside `.claude/skills/align-strategy/SKILL.md`.

## Implementation notes

Single unit; implement in a subagent launched with `model: opus`; supply
this Context and the Unit 1 Scope (plus the two clarification texts) in the
subagent prompt; constrain it to working-tree edits only.

---
id: tactic-align-provenance-lint-doctrine
kind: tactic
statement: Plan and land the clarifications[].answer provenance lint under the
  ratified 2026-07-18 dated-clause-anywhere doctrine, including the two
  align-skill SKILL.md doctrine-passage edits
owner: ai
status: raw
parent: null
rationale: "Split 2026-07-18 out of tactic-align-tactics-mechanical-floor's Unit
  1 (see that node's clarifications entry for the full re-plan). The
  align-strategy and align-tactics SKILL.md docs both assert every
  clarifications[].answer must END with a trailing \"Recorded YYYY-MM-DD\"
  provenance sentence, but a live sweep of intentions/ found the corpus never
  followed that convention (front-loaded parenthetical, varied verbs,
  substantive close) and packages/intentionsutil/src/router.ts's readingDate()
  already codifies the corpus's actual convention (newest ISO date anywhere in
  the string, verb-agnostic) -- coverage.ts's lastReviewedOf depends on that
  semantics. Enforcing the doctrine literally means rewriting 27 author-owned
  goal-layer clarification answers (virtue/strategy nodes) to add a redundant
  trailing sentence; loosening the doctrine to match reality is an align-layer
  decision on two SKILL.md files, not a lint implementation detail. Off-path (no
  validates chain). Amended 2026-07-18: the doctrine gate is discharged — the
  author ratified the loosened dated-clause-anywhere convention
  (strategy-graph-native-dispatch's 2026-07-18 provenance-doctrine
  clarification); this tactic now carries the remaining ai work (the two
  SKILL.md doctrine-passage edits plus the enforcing lint) as a draft awaiting
  /align-tactics finalize."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 boost-3 policy for tactics that directly
    edit .claude/skills/align-strategy/SKILL.md or
    .claude/skills/align-tactics/SKILL.md content: resolving this park edits
    align-strategy/SKILL.md:306-309 and align-tactics/SKILL.md:263-265's
    provenance-convention passages, so it qualifies on the same basis as its
    sibling tactic-align-tactics-mechanical-floor."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Plan and land the clarifications[].answer provenance lint under the ratified 2026-07-18 dated-clause-anywhere doctrine

Formerly a born-parked human gate, split 2026-07-18 out of
`tactic-align-tactics-mechanical-floor`'s Unit 1 (see that node's
`clarifications` entry). The gate was discharged the same day — see
"Outcome" below; the "What to review" / "What approval means" sections
following it are the historical decision brief, kept for context. Off-path:
no `validates` chain reaches this node.

## Outcome — ratified 2026-07-18

The author ratified option 1 (greenfield: loosen the doctrine) in the
2026-07-18 `/align-strategy` interview, recorded as a dated clarification on
`strategy-graph-native-dispatch` ("What provenance convention binds
clarifications[].answer..."). The ratified doctrine: every
`clarifications[].answer` carries a dated provenance clause — an event verb
plus ISO date — placed where it reads best; front-loaded parenthetical
preferred, verb open; the newest ISO date anywhere in the answer is its
effective date (the `readingDate()` contract); amendments add a new dated
clause rather than rewriting the old one. Zero corpus rewrites, no
grandfather clause.

Remaining work for this tactic (now a draft awaiting `/align-tactics`
finalize):

1. Edit the two SKILL.md doctrine passages
   (`.claude/skills/align-strategy/SKILL.md:306-309`,
   `.claude/skills/align-tactics/SKILL.md:263-265`) to state the ratified
   convention in place of the trailing-sentence rule.
2. Plan and land the enforcing lint (in
   `tactic-align-tactics-mechanical-floor`'s planlint.ts module or a
   sibling): every `clarifications[].answer` on a node must contain at
   least one event-verb + ISO-date clause; corpus-wide, no grandfathering.

## What to review

Two align-skill docs assert a doctrine the live corpus never followed:

- `.claude/skills/align-strategy/SKILL.md:306-309`
- `.claude/skills/align-tactics/SKILL.md:263-265`

Both say every `clarifications[].answer` "ends with a provenance sentence in
the existing convention, e.g. `\"...Recorded 2026-07-05 ...\"`". A sweep of
`intentions/` found 27 dated clarification answers on goal-layer nodes
(virtue/strategy) that instead front-load the date as a parenthetical with a
varied verb (Recorded / Amended / clarified / Reviewed / adopted) and close
each answer with its substantive conclusion — never a trailing
`Recorded YYYY-MM-DD` sentence. `packages/intentionsutil/src/router.ts`'s
`readingDate()` (lines 159-163) and `packages/intentionsutil/src/coverage.ts`'s
`lastReviewedOf` already implement and depend on the corpus's actual
convention (extract the newest ISO date mentioned *anywhere* in the string,
verb-agnostic) — see the test fixtures in
`packages/intentionsutil/test/coverage.test.ts:223-239`.

## What approval means

Ratify one of:

1. **Loosen the doctrine to match reality (recommended)** — edit both
   SKILL.md passages to describe "a dated provenance clause somewhere in the
   answer, front-loaded parenthetical preferred, verb open" instead of a
   trailing-sentence requirement. Needs no corpus rewrite: all 27 existing
   goal-layer answers already comply, and 0 tactic-node answers currently
   violate either reading.
2. **Enforce the trailing-sentence doctrine as written** — accept that this
   means rewriting the 27 existing goal-layer clarification answers (e.g.
   `virtue-respect-for-persons`' Kant/Aristotle clarification,
   `strategy-philosophical-grounding`'s periagoge answers) to append a
   redundant trailing date, and decide who does that rewrite (an author
   pass, not an autonomous `/align-tactics` sweep).
3. **Forward-only enforcement** — scope any future lint to clarifications
   dated after ratification, explicitly grandfathering the 27 existing
   entries, and note the grandfather in both SKILL.md docs.

Either way, record the outcome as a dated clarification on
`strategy-graph-native-dispatch`, then run `/align-tactics
tactic-align-provenance-lint-doctrine` (or file a fresh sibling tactic) to
plan the enforcing lint rule under the ratified doctrine — this tactic then
completes.

---
id: tactic-align-provenance-lint-doctrine
kind: tactic
statement: Resolve the align-skill provenance-sentence doctrine vs. actual
  corpus/tooling convention before any clarifications[].answer provenance lint
  is built
owner: human
status: delegated
parent: null
rationale: Split 2026-07-18 out of tactic-align-tactics-mechanical-floor's Unit
  1 (see that node's clarifications entry for the full re-plan). The
  align-strategy and align-tactics SKILL.md docs both assert every
  clarifications[].answer must END with a trailing "Recorded YYYY-MM-DD"
  provenance sentence, but a live sweep of intentions/ found the corpus never
  followed that convention (front-loaded parenthetical, varied verbs,
  substantive close) and packages/intentionsutil/src/router.ts's readingDate()
  already codifies the corpus's actual convention (newest ISO date anywhere in
  the string, verb-agnostic) -- coverage.ts's lastReviewedOf depends on that
  semantics. Enforcing the doctrine literally means rewriting 27 author-owned
  goal-layer clarification answers (virtue/strategy nodes) to add a redundant
  trailing sentence; loosening the doctrine to match reality is an align-layer
  decision on two SKILL.md files, not a lint implementation detail. Off-path (no
  validates chain).
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
office_hours:
  reason: "Decide the align-skill clarification-provenance doctrine: the SKILL.md
    docs (align-strategy/SKILL.md:306-309, align-tactics/SKILL.md:263-265) both
    prescribe a clarifications[].answer trailing 'Recorded YYYY-MM-DD' sentence;
    the live corpus of 27 dated clarification answers on goal-layer nodes
    (virtue/strategy) never followed it, instead front-loading a parenthetical
    with varied verbs (Recorded/Amended/clarified/Reviewed/adopted) and closing
    each answer with its substantive conclusion. router.ts's readingDate()
    (packages/intentionsutil/src/router.ts:159-163) and coverage.ts's
    lastReviewedOf already implement and depend on the corpus's actual
    convention (newest ISO date anywhere in the string, verb-agnostic), not the
    SKILL.md doctrine. Recommend: loosen both SKILL.md passages to describe the
    actual convention ('a dated provenance clause somewhere in the answer,
    front-loaded parenthetical preferred, verb open') so the doctrine matches
    reality and matches readingDate()'s semantics -- this requires no corpus
    rewrite (0 tactic violations, and the 27 goal-layer answers already comply
    with the loosened rule). Once the doctrine is settled, a follow-up
    /align-tactics round can write the enforcing lint rule into
    tactic-align-tactics-mechanical-floor's planlint.ts module (or a fresh
    sibling tactic) matching whichever convention is ratified. Alternative if
    the trailing-sentence doctrine is deliberately intended as an aspirational
    forward rule (not a retroactive one): scope the lint to newly-authored
    clarifications only (e.g. dated after ratification) so it never demands
    rewriting the 27 existing author-owned philosophical records, and clarify in
    both SKILL.md docs that historical entries are grandfathered."
  since: 2026-07-18
  recommendation: Ratify or revise the recommended direction (loosen the SKILL.md
    doctrine to match the corpus/readingDate() convention, no corpus rewrite
    needed) in an /align-strategy pass touching align-strategy/SKILL.md and
    align-tactics/SKILL.md; record the outcome as a dated clarification on
    strategy-graph-native-dispatch, then run /align-tactics on this tactic to
    finalize the enforcing lint plan under the ratified doctrine.
pace_exempt: false
rounds: null
attributes: {}
---
# Resolve the align-skill provenance-sentence doctrine vs. actual corpus/tooling convention before any clarifications[].answer provenance lint is built

Born-parked human gate, split 2026-07-18 out of
`tactic-align-tactics-mechanical-floor`'s Unit 1 (see that node's
`clarifications` entry and this tactic's own `office_hours.reason` for the
full analysis). Off-path: no `validates` chain reaches this node.

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

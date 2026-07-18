---
id: tactic-align-provenance-lint-doctrine
kind: tactic
statement: Enforce the ratified clarifications[].answer provenance doctrine — a
  dated provenance clause anywhere in each answer, the newest ISO date being its
  effective date per the readingDate() contract — as a new validateGraph rule
  (rule 17), and rewrite the two align-skill SKILL.md doctrine passages to state
  the ratified convention in place of the trailing-Recorded-sentence rule.
owner: ai
status: codified
parent: null
rationale: "Split 2026-07-18 out of tactic-align-tactics-mechanical-floor's Unit
  1 (see that node's clarifications entry for the full re-plan). The
  align-strategy and align-tactics SKILL.md docs both asserted every
  clarifications[].answer must END with a trailing \"Recorded YYYY-MM-DD\"
  provenance sentence, but a live sweep of intentions/ found the corpus never
  followed that convention (front-loaded parenthetical, varied verbs,
  substantive close), and packages/intentionsutil/src/router.ts's readingDate()
  already codifies the corpus's actual convention (newest ISO date anywhere in
  the string, verb-agnostic) — coverage.ts's lastReviewedOf depends on that
  semantics. The doctrine gate the node originally carried is discharged: the
  author ratified the loosened dated-clause-anywhere convention
  (strategy-graph-native-dispatch's 2026-07-18 provenance-doctrine
  clarification), zero corpus rewrites, no grandfather clause. Finalized
  2026-07-18 /align-tactics per-node round: this tactic now plans the remaining
  ai work as a phase:implement node. Two design calls, recorded so the whole
  node is consistent: (1) the enforcing lint lands as a new validateGraph rule
  17 in packages/intentionsutil/src/schema.ts, not in
  tactic-align-tactics-mechanical-floor's planlint.ts as the node's earlier
  draft phrasing floated — planlint.ts is unlanded and body-focused, whereas the
  provenance check is pure frontmatter cross-corpus, exactly validateGraph's
  domain, matching its 16 existing rules and needing zero new wiring
  (validate-graph.ts already calls validateGraph, so graph-commit and the
  graph/** CI fast path enforce it automatically); no blocked_by on the sibling.
  (2) The lint mechanically enforces date-presence only (readingDate(answer) !==
  null), treating the event verb as documented-but-unlinted style — because the
  ratified doctrine grounds itself on the readingDate() machine contract, which
  is verb-agnostic, and an open verb set (Recorded / Amended / Reviewed /
  adopted / clarified...) would be brittle and re-introduce the over-strictness
  that got the original trailing-sentence doctrine rejected. A live scan on
  2026-07-18 confirmed 335/335 clarification answers already carry a date, so
  the corpus-wide lint passes clean with no in-PR rewrites. Off-path (no
  validates chain), so calculated attention demotes it below round tactics."
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
    .claude/skills/align-tactics/SKILL.md content: this tactic rewrites the
    provenance-convention passages in align-strategy/SKILL.md and
    align-tactics/SKILL.md, so it qualifies on the same basis as its sibling
    tactic-align-tactics-mechanical-floor."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Enforce the ratified clarifications[].answer provenance doctrine as validateGraph rule 17

Off-path: no `validates` chain reaches this node, so calculated attention
demotes it below round tactics at read time. One PR.

## Context

Two align-skill docs asserted a provenance doctrine the live corpus never
followed. `.claude/skills/align-strategy/SKILL.md` (Step 8) and
`.claude/skills/align-tactics/SKILL.md` (Step 1) both say every
`clarifications[].answer` "ends with a provenance sentence in the existing
convention, e.g. `\"...Recorded 2026-07-05 ...\"`". A sweep of `intentions/`
found the corpus instead front-loads the date as a parenthetical with a
varied verb (Recorded / Amended / Reviewed / adopted / clarified) and closes
each answer with its substantive conclusion — never a trailing
`Recorded YYYY-MM-DD` sentence. `packages/intentionsutil/src/router.ts`'s
`readingDate()` (lines 159–163) and `packages/intentionsutil/src/coverage.ts`'s
`lastReviewedOf` already implement and depend on the corpus's actual
convention: extract the newest ISO date mentioned *anywhere* in the string,
verb-agnostic.

The author ratified the loosened doctrine in the 2026-07-18 `/align-strategy`
interview, recorded as a dated clarification on `strategy-graph-native-dispatch`
("What provenance convention binds clarifications[].answer…"): every
`clarifications[].answer` carries a dated provenance clause — an event verb
plus ISO date — placed where it reads best, front-loaded parenthetical
preferred; the newest ISO date anywhere in the answer is its effective date
(the `readingDate()` contract); amendments add a new dated clause rather than
rewriting the old one. Zero corpus rewrites, no grandfather clause; the
enforcing lint checks the loosened rule corpus-wide.

This tactic finalizes the remaining ai work: encode the ratified convention
in the two SKILL.md passages, and add a mechanical lint so a dateless
clarification answer can never land.

**Design decisions (recorded in the node `rationale` too):**

- **Lint home = a new `validateGraph` rule (rule 17) in
  `packages/intentionsutil/src/schema.ts`**, not
  `tactic-align-tactics-mechanical-floor`'s `planlint.ts` as the node's
  earlier draft phrasing floated. `planlint.ts` is unlanded and body-focused
  (it reads a tactic's markdown body for plan-schema markers); the provenance
  check is pure frontmatter, cross-corpus, and needs no body reader —
  exactly `validateGraph`'s domain, matching its 16 existing rules. It needs
  **zero new wiring**: `validate-graph.ts` already calls `validateGraph`, so
  `graph-commit` and the `graph/**` CI fast path enforce it automatically. No
  `blocked_by` on the sibling.
- **Enforce date-presence only** — `readingDate(answer) !== null`, i.e. the
  answer contains at least one `YYYY-MM-DD`. The event verb stays
  documented-but-unlinted style. The ratified doctrine grounds itself on the
  `readingDate()` machine contract, which is verb-agnostic; an open verb set
  would be brittle and re-introduce the over-strictness that got the original
  trailing-sentence doctrine rejected. A 2026-07-18 scan confirmed 335/335
  clarification answers already carry a date, so the corpus-wide rule passes
  clean with no in-PR rewrites.

## Unit 1 — validateGraph rule 17: clarification-answer provenance date

**Recommended model:** opus

Rationale for opus: the change is small in lines but sits on the single graph
validation gate that `graph-commit` and CI both run — a false-positive would
block every graph commit corpus-wide, so the regex, the per-clarification
error message, and the empty-clarifications no-op need care.

Scope:
- `packages/intentionsutil/src/schema.ts`, inside `validateGraph`
  (`packages/intentionsutil/src/schema.ts:606`). Add, inside the existing
  `for (const node of nodes)` loop (alongside rules 10–16, which already
  live there), a rule 17 block: for each `clarifications` entry on the node,
  if its `answer` contains no `YYYY-MM-DD` substring, push a problem naming
  the node id and the clarification index, e.g.
  `` `${node.id}: clarifications[${i}].answer carries no dated provenance clause (YYYY-MM-DD) — see readingDate()` ``.
  Match with the same date pattern `readingDate()` uses (`/\d{4}-\d{2}-\d{2}/`);
  inline it here rather than importing `readingDate` from `router.ts` —
  `router.ts` imports `schema.ts` (`packages/intentionsutil/src/router.ts:4`),
  so importing back would create a cycle. Add a one-line comment cross-
  referencing `readingDate()` / `coverage.ts`'s `lastReviewedOf` as the
  machine consumers this rule protects.
- Applies to **every** node kind uniformly — clarifications appear on
  virtue / strategy / tactic nodes and all follow the convention; no kind
  gate. An empty `clarifications` array is a no-op (nothing to check).
- Extend the `validateGraph` JSDoc rule list
  (`packages/intentionsutil/src/schema.ts:586`, currently ending at rule 16)
  with a rule-17 line describing the provenance-date requirement.
- **Corpus sweep (state follow-through):** the rule must pass on the live
  store as-is — a 2026-07-18 scan found 0 violations across 335 clarification
  answers, so no node needs rewriting. Re-run the sweep after implementing
  (below) to confirm; if any violation surfaces, fix the offending answer
  (add the missing dated clause) in this PR rather than weakening the rule
  (`.claude/rules/test-integrity.md`).

Reuse:
- `readingDate()` date pattern — `packages/intentionsutil/src/router.ts:159`
  (pattern copied, not imported; see cycle note above).
- The `problems.push(...)` accumulate-and-throw shape and per-node loop —
  `packages/intentionsutil/src/schema.ts:606-770` (rules 10–16).
- `IntentionSchemaError` — raised by `validateGraph` at the end of the
  function once `problems` is non-empty; no new error type.

Tests (`packages/intentionsutil/test/schema.test.ts`, `validateGraph`
describe block at line 660, reusing the `gnode` fixture helper at line 662):
- Accepts a clarification whose answer carries a date front-loaded
  (`"(Recorded 2026-07-05 …) …"`), trailing (`"… Recorded 2026-07-05."`), and
  mid-sentence — all three placements pass (the rule is placement-agnostic).
- Rejects a clarification whose answer has no `YYYY-MM-DD`; the thrown error
  names the node id and the clarification index.
- A node with `clarifications: []` (the `gnode` default) passes.
- With multiple dateless clarifications across nodes, the single thrown
  `IntentionSchemaError` lists all of them (accumulate-all behavior, matching
  the other rules' tests).

## Unit 2 — rewrite the two SKILL.md provenance passages

**Recommended model:** sonnet

Depends on: none (independent of Unit 1; can land in the same PR).

Scope — replace the trailing-`Recorded`-sentence prescription with the
ratified dated-clause-anywhere convention in both passages:
- `.claude/skills/align-strategy/SKILL.md` Step 8
  (around lines 304–309, the `{question, answer}` clarification-recording
  bullet): state that each `answer` carries a dated provenance clause — an
  event verb plus ISO date — placed where it reads best, front-loaded
  parenthetical preferred; the newest ISO date anywhere in the answer is its
  effective date (the `readingDate()` contract that `coverage.ts`'s
  `lastReviewedOf` depends on); amendments add a new dated clause rather than
  rewriting the old one. Keep the `date -u +%Y-%m-%d` guidance (never
  hand-guessed). Note the convention is enforced by `validateGraph` rule 17
  (date-presence; the verb is style).
- `.claude/skills/align-tactics/SKILL.md` (around lines 263–266, the
  "Every clarification `answer` ends with a provenance sentence…" paragraph
  in Step 1): same rewrite, matching the align-strategy wording. Keep the
  `/align-tactics round` provenance example but as a front-loaded clause
  (e.g. `"(Recorded 2026-07-05 /align-tactics round.) …"`), consistent with
  the ratified convention the doc now describes.
- Update any other in-repo doctrine passage that restates the
  trailing-sentence rule if the sweep below finds one; do not leave a second
  copy asserting the retired convention.
  ```verify
  ! grep -rn "ends with a provenance sentence" .claude/skills/align-strategy/SKILL.md .claude/skills/align-tactics/SKILL.md
  ```

Landing note: `.claude/skills/**` edits are agent-behavior config — dispatch
auto mode blocks the *commit* (not the edit). If the implementing worker hits
that denial, park for an interactive session to land the PR (the same note
`tactic-align-tactics-mechanical-floor` Units 3/5 carry).

Out of scope: rewriting any of the 335 existing clarification answers (all
already comply); enforcing an event-verb set (verb stays unlinted style);
`planlint.ts` and the body-marker lint (that is
`tactic-align-tactics-mechanical-floor`, a separate module and concern).

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

The `validate-graph.ts` run above exercises rule 17 over the whole live
corpus (it must exit 0 — the sweep confirmed 0 violations). New unit tests in
`schema.test.ts` cover the accept/reject/empty/accumulate cases.

Manual: in a scratch checkout, blank the date out of one node's clarification
answer and confirm `validate-graph.ts` exits non-zero naming that node and
the clarification index; restore it and confirm it exits 0.

## Implementation notes

Two units, one PR. One subagent per unit, `model` per tag; constrain each to
working-tree edits. Unit 2 touches `.claude/skills/**` (see its landing note).

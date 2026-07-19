---
id: tactic-align-strategy-step28-dangling-ref
kind: tactic
statement: Repoint the three stale "step-2.8 convention" references in
  .claude/skills/align-strategy/SKILL.md (lines 233, 284, 306) at the real
  location of the provenance-clause convention -- step 8's definition (lines
  314-329) -- since the document's Dialectic steps are numbered 1-9 and no step
  2.8 exists
owner: ai
status: raw
parent: null
rationale: "Deferred residue from the /review-fix review of
  tactic-align-provenance-lint-doctrine (PR #2894). The review's code-review
  finder flagged that align-strategy/SKILL.md lines 233, 284, and 306 all
  reference \"the step-2.8 convention\" / \"the step-2.8 provenance convention\"
  as the canonical home of the dated-clarification-provenance convention, but
  the file's Dialectic steps are numbered 1-9 with no step 2.8 anywhere -- the
  actual convention definition now lives in step 8 (lines 314-329, rewritten by
  PR #2894 itself). Line 306 is touched by PR #2894's own diff and retains the
  dangling reference rather than fixing it; lines 233 and 284 are pre-existing
  and unchanged by that PR. Out of scope for PR #2894 (a genuine improvement but
  not something that PR's diff needed to deliver), so classified Deferred and
  recorded here as a draft by /review-fix on 2026-07-18; /align-tactics
  finalizes and re-validates against what actually merged."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Repoint the three stale "step-2.8 convention" references in .claude/skills/align-strategy/SKILL.md (lines 233, 284, 306) at the real location of the provenance-clause convention -- step 8's definition (lines 314-329) -- since the document's Dialectic steps are numbered 1-9 and no step 2.8 exists

## Provenance

- **Location:** `.claude/skills/align-strategy/SKILL.md:306` (touched by this
  PR's diff); also `.claude/skills/align-strategy/SKILL.md:233` and `:284`
  (pre-existing, unchanged by this PR).
- **Failure scenario:** a clean-session executor of `/align-strategy` reads
  "record the resolution ... ending with a provenance sentence in the step-2.8
  convention" (or the parallel phrasing at 233/284) and searches the document
  for a "step 2.8" to learn the convention's shape. No such step exists — the
  Dialectic steps in this document are numbered 1 through 9. The convention is
  actually defined in step 8 (lines 314-329, itself rewritten by this PR to
  describe the ratified dated-clause-anywhere convention). The executor either
  stalls looking for the missing step or falls back to guessing the
  convention's shape from context, reintroducing exactly the kind of
  undocumented-convention drift this PR's `validateGraph` rule 17 and doc
  rewrite were meant to close.
- **Disposition:** code-review finding, classified `Deferred` (genuine
  improvement, out of scope for PR #2894's diff — no adversarial-verify step
  applies to a `Deferred` code-review finding; that step is reserved for
  `Required` security findings).
- **Source PR:** #2894 (`tactic-align-provenance-lint-doctrine`).

`/align-tactics` should re-validate this against the merged file (confirm the
step numbering and the dangling "step-2.8" references still hold) before
finalizing.

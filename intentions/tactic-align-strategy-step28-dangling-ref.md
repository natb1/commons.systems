---
id: tactic-align-strategy-step28-dangling-ref
kind: tactic
statement: Repoint the three stale "step-2.8 convention" references in
  .claude/skills/align-strategy/SKILL.md (lines 233, 284, 306) at the real
  location of the provenance-clause convention -- step 8's definition (lines
  314-329) -- since the document's Dialectic steps are numbered 1-9 and no step
  2.8 exists
owner: ai
status: codified
parent: null
rationale: "Deferred residue from the /review-fix review of
  tactic-align-provenance-lint-doctrine (PR #2894). The review's code-review
  finder flagged that align-strategy/SKILL.md lines 233, 284, and 306 all
  reference \"the step-2.8 convention\" / \"the step-2.8 provenance convention\"
  as the canonical home of the dated-clarification-provenance convention, but
  the file's Dialectic steps are numbered 1-9 with no step 2.8 anywhere -- the
  actual convention definition now lives in step 8 (lines 314-329, rewritten by
  PR #2894 itself). Line 306 is touched by PR #2894's own diff and retained the
  dangling reference rather than fixing it; lines 233 and 284 were pre-existing
  and unchanged by that PR. Out of scope for PR #2894 (a genuine improvement but
  not something that PR's diff needed to deliver), so classified Deferred and
  recorded here as a draft by /review-fix on 2026-07-18; /align-tactics
  finalized it on 2026-07-18, re-validating against origin/main (all three
  references still present, step 8 still the convention's home) before
  repointing them."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Repoint the three stale "step-2.8 convention" references in .claude/skills/align-strategy/SKILL.md (lines 233, 284, 306) at the real location of the provenance-clause convention -- step 8's definition (lines 314-329) -- since the document's Dialectic steps are numbered 1-9 and no step 2.8 exists

## Context

`.claude/skills/align-strategy/SKILL.md` contains three references to "the
step-2.8 convention" / "the step-2.8 provenance convention" as the canonical
home of the dated-clarification-provenance sentence convention. No step 2.8
exists — the document's "Dialectic steps" section numbers its steps 1 through
9, and the provenance convention is actually defined in step 8 ("Edge cases
and consequences", lines 314-329). A clean-session executor of
`/align-strategy` who reads one of these references and searches the document
for "step 2.8" finds nothing, and either stalls or guesses the convention's
shape from context — reintroducing the undocumented-convention drift this
document's own `validateGraph` rule 17 and doc rewrite (PR #2894) were meant
to close. This was flagged as a `Deferred` code-review finding on PR #2894
(`tactic-align-provenance-lint-doctrine`), out of scope for that PR's diff,
and recorded here as a draft tactic by `/review-fix`. Re-validated against
`origin/main` on 2026-07-18: all three references and the step numbering
still hold as described.

## Unit 1 — Repoint the three dangling references

**Scope:** `.claude/skills/align-strategy/SKILL.md:233`, `:284`, `:306`. Each
reads "step-2.8" (in the phrasings "the ordinary step-2.8 clarification
mechanics", "the step-2.8 provenance convention", and "a provenance sentence
in the step-2.8 convention" respectively). Change each to "step-8" (matching
phrasings: "the ordinary step-8 clarification mechanics", "the step-8
provenance convention", "a provenance sentence in the step-8 convention").
Out of scope: no other content on these lines, and no other file, changes.

**Recommended model:** sonnet — a mechanical three-site string substitution
with no design judgment.

**Dependencies:** none.

## Reuse

No new code or utilities — this is a text edit to an existing skill document.

## Verification

Prose only — this is a documentation fix with no test suite coverage:

- After the edit, `grep -n 'step.2\.8\|2\.8 convention\|2\.8 provenance\|2\.8 clarification' .claude/skills/align-strategy/SKILL.md` returns no matches.
- Read lines 314-329 of the file and confirm step 8 ("Edge cases and
  consequences") is still the section defining the dated-clarification
  provenance-sentence convention that the three repointed references now
  point at — if step 8's content or numbering has drifted since this plan was
  written, re-derive the correct target step before landing.

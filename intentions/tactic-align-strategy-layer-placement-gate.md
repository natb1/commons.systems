---
id: tactic-align-strategy-layer-placement-gate
kind: tactic
statement: "Encode the layer-placement gate into the align skills: every
  interview outcome is classified by kind-tactic's placement test (standing
  requirement vs completable change) at record time, with open-children
  orthogonality and freeze cost excluded as placement inputs"
owner: ai
status: codified
parent: null
rationale: "Drafted at the 2026-07-21 /align-strategy layer-placement round
  (author-ratified division of labor: kind-tactic is the canonical semantic
  home; the skills carry an operative gate that cites it, per the
  one-canonical-home precedent). The gap this closes:
  .claude/skills/align-strategy/SKILL.md step 10 gates only standing-structure
  owners (success_signal, attention carriers) and the 'Documentation
  completeness over commit size' section names strategy-property outcomes
  without a discriminating test — the opening through which a 2026-07-21 session
  improvised an orthogonality-of-open-children placement heuristic that
  kind-tactic's authoring test already contradicted. Finalized 2026-07-22
  /align-tactics round: confirmed via direct read that no stale
  orthogonality-as-placement text survives elsewhere in either skill (the two
  extant 'orthogonal' mentions in align-strategy/SKILL.md govern only
  freeze-blast-radius classification, a distinct, legitimate use kind-tactic's
  clarification explicitly permits) and that align-tactics' current
  draft-consumption step is Step 2 item 2 ('Consume the draft tactics'), not
  'Step 4' as originally drafted — the plan below cites the corrected location."
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
# Encode the layer-placement gate into the align skills: every interview outcome is classified by kind-tactic's placement test (standing requirement vs completable change) at record time, with open-children orthogonality and freeze cost excluded as placement inputs

## Context (from the 2026-07-21 /align-strategy layer-placement round)

A same-day mitigation round placed a standing invariant (graph-commit's
target-repo resolution) in the tactic layer only, justified by the
orthogonality of the serving strategy's open children to the invariant. The
author rejected the heuristic: orthogonality is unrelated to whether content
is a persistent requirement or a completable task. The correct criterion
already existed — kind-tactic's authoring test — but no operative skill step
directs an interview to it at the moment of placement: align-strategy step 10
("Persistent-layer ownership gate") covers only standing-structure owners
(`success_signal`, `attention` carriers), and "Documentation completeness
over commit size" names strategy-property outcomes without a discriminating
test. The canonical criterion now lives on kind-tactic (2026-07-21
clarification, "Where does an interview outcome land — strategy layer or
tactic layer?"); this tactic encodes the operative gate that cites it.

This is a single PR-sized unit (documentation/skill-config only, no app code).
It was spiked directly against the current file state during finalization
(2026-07-22) to fix the exact insertion points and confirm no stale
orthogonality-as-placement text needs correcting elsewhere first — see the
"Confirmed at finalization" note below. The edits below were verified to
apply cleanly and were reverted afterward so the implement phase performs
them; the exact wording is reproduced here so a fresh session needs no
further exploration.

## Unit 1 — Encode the gate in both skills

**Recommended model:** sonnet (mechanical documentation insertion at
pre-verified anchors; no design judgment required).

**Dependencies:** none.

**Scope:**

- `.claude/skills/align-strategy/SKILL.md:365` — immediately after
  dialectic step 10 ("Persistent-layer ownership gate", which ends at line
  365 with "...per the step-2.8 provenance convention.") and before the
  blank line preceding "**The `/file-issue` 8-category evaluation...**"
  table (line 367), insert a new numbered item **11. Layer-placement
  gate.**, exact text:

  ```
  11. **Layer-placement gate.** Before recording any interview outcome, classify
      its content against kind-tactic's authoring test (`intentions/kind-tactic.md`,
      2026-07-21 clarification, "Where does an interview outcome land — strategy
      layer or tactic layer?"): a standing requirement — one that must still hold
      after every tactic currently serving the strategy completes and is pruned —
      lands as a strategy or kind clarification; a completable change lands as a
      draft tactic (Step 4); a split outcome lands as both, the invariant as a
      clarification and its implementing fix as a tactic. Open-children
      orthogonality and freeze/re-stamp cost are **never** placement inputs — they
      govern only the materiality classification's blast radius (see
      "Documentation completeness over commit size" and "Materiality-scoped
      freeze", below), a separate, later decision. Cite kind-tactic's test; do
      not restate its rationale here.
  ```

- `.claude/skills/align-strategy/SKILL.md:575` (end of the "Documentation
  completeness over commit size" paragraph, "...it is not a reason to avoid
  recording the clarification itself.") — append, same paragraph:

  ```
   Whether the
  outcome belongs in the persistent layer at all is decided upstream, by
  dialectic step 11 (Layer-placement gate); this section governs only the blast
  radius of a placement already made there.
  ```

- `.claude/skills/align-tactics/SKILL.md:341` (end of Step 2 item 2,
  "Consume the draft tactics" — **not** "Step 4"; the tactic's original
  drafted scope named "Step 4 (draft handling)", but the skill's current
  step numbering (`grep -n "^## Step" .claude/skills/align-tactics/SKILL.md`)
  shows Step 4 is "Park non-claude-eligible tactics" — an unrelated
  born-parked-authoring step. Draft-tactic consumption is Step 2 item 2. This
  correction is itself part of the plan, not left for the implementer to
  discover.) — after "...pruning drops a draft that the round does not need
  (record why in the pruning commit message)." append, same list item:

  ```
   Before
  finalizing, re-check the draft's content against kind-tactic's authoring
  test (`intentions/kind-tactic.md`, 2026-07-21 clarification) — a draft that
  is actually a standing requirement belongs on the strategy or kind as a
  clarification, not promoted to `phase: implement` as a tactic.
  ```

- Out of scope: any change to the freeze/re-stamp machinery, kind-node
  edits (the canonical clarification already landed 2026-07-21), and any
  restatement of the test in a second home.

**Confirmed at finalization (2026-07-22):** grepped both skill files for
`-i orthogonal` — the only hits are in align-strategy's
"Materiality-scoped freeze" section (governing freeze-blast-radius
classification, the legitimate use kind-tactic's clarification explicitly
carves out), not placement — so no other stale text needs correcting in
this unit.

## Reuse

- kind-tactic's 2026-07-21 layer-placement clarification (canonical text,
  `intentions/kind-tactic.md` clarification 3) — cited, never restated.
- The one-canonical-home precedent: the model-selection heuristic
  (`.claude/skills/implement-unit/SKILL.md`) referenced, never restated, by
  every other surface.
- Step 10's own encoding provenance (strategy-graph-native-dispatch
  clarification: "The constraint is to be encoded into the align-strategy
  skill itself") — this tactic is the same move for the placement test.

## Verification

- Read both SKILL.md diffs: the gate cites kind-tactic and restates nothing;
  the anti-orthogonality exclusion is present verbatim; the align-tactics
  pointer lands in Step 2 item 2, not "Step 4".

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

- Skill-file edits are agent-behavior config: expect the hook/approval gate
  on commit (per dispatch-hooks-edit-blocked-automode); the implementing
  session needs the author's grant to land the commit.

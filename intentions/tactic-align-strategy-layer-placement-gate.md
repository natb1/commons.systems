---
id: tactic-align-strategy-layer-placement-gate
kind: tactic
statement: "Encode the layer-placement gate into the align skills: every
  interview outcome is classified by kind-tactic's placement test (standing
  requirement vs completable change) at record time, with open-children
  orthogonality and freeze cost excluded as placement inputs"
owner: ai
status: raw
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
  kind-tactic's authoring test already contradicted."
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

## Scope

- `.claude/skills/align-strategy/SKILL.md`:
  - Add a dialectic step (adjacent to step 10) — **Layer-placement gate**:
    before recording any interview outcome, classify its content by
    kind-tactic's placement test — a standing requirement (must still hold
    after every tactic currently serving the strategy completes and is
    pruned) lands as a strategy/kind clarification; a completable change
    lands as a tactic; a split outcome lands as both (invariant as
    clarification, fix as tactic). State explicitly that open-children
    orthogonality and freeze/re-stamp cost are excluded as placement inputs
    (they govern only the materiality classification's blast radius).
    Cite kind-tactic as the canonical home; do not restate the test's
    rationale.
  - Extend the "Documentation completeness over commit size" section with a
    one-line cross-reference to the new gate.
- `.claude/skills/align-tactics/SKILL.md`: a one-line pointer in Step 4
  (draft handling) to the same kind-tactic test, so a decomposition round
  promoting draft content applies the same criterion. Pointer only — no
  restatement.
- Out of scope: any change to the freeze/re-stamp machinery, kind-node
  edits (the canonical clarification already landed 2026-07-21), and any
  restatement of the test in a second home.

## Reuse

- kind-tactic's 2026-07-21 layer-placement clarification (canonical text).
- The one-canonical-home precedent: the model-selection heuristic
  (`.claude/skills/implement-unit/SKILL.md`) referenced, never restated, by
  every other surface.
- Step 10's own encoding provenance (strategy-graph-native-dispatch
  clarification: "The constraint is to be encoded into the align-strategy
  skill itself") — this tactic is the same move for the placement test.

## Verification

- Read both SKILL.md diffs: the gate cites kind-tactic and restates nothing;
  the anti-orthogonality exclusion is present verbatim.
- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes (prose
  references resolve).
- Skill-file edits are agent-behavior config: expect the hook/approval gate
  on commit (per dispatch-hooks-edit-blocked-automode); the landing session
  needs the author's grant.

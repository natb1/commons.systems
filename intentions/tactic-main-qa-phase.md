---
id: tactic-main-qa-phase
kind: tactic
statement: "main-qa extended lifecycle: Phase enum gains main-qa, the qa-main
  handler runs on node targets — post-merge prod verification as a phase of the
  source tactic, no follow-up artifact"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Strategy clarification 22 (2026-07-04 interview): a graph-native
  tactic's qa needs-main residue rides the source node into a main-qa phase
  between merge and done — the legacy follow-up issue was a workaround for gh
  close-on-merge mechanics the persistent node dissolves. On the signal path:
  the qa-main label machinery cannot be deleted (legacy removal) until the
  native lifecycle exists."
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
blocked_by:
  - tactic-phase-skill-node-targets
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# main-qa extended lifecycle: Phase enum gains main-qa, the qa-main handler runs on node targets — post-merge prod verification as a phase of the source tactic, no follow-up artifact

**Recorded 2026-07-04** by the clarifications-21–22 `/align-tactics`
re-evaluation. On-path (blocks `tactic-legacy-router-removal`, a
validates-terminal). One PR.

## Context

Strategy clarification 22: post-merge verify-against-prod work (the
legacy `needs-main` residue class) lives in the tactic's own lifecycle —
`main-qa` is a phase of the source node between merge and `done`, never a
separate filed artifact. The legacy main-qa follow-up issue existed only
because gh issues close when their PR merges; a persistent node with
persisted phase needs no second artifact, no provenance markers, and no
orphan retriage. Spec: `intentions/tactic-graph-native-dispatch.md` §1.1
(the `main-qa` bullet), §2.4 (qa disposition), §4 (matrix row).

Seam split with siblings: `tactic-phase-skill-node-targets` Unit 3 makes
qa record the residue on the node; `tactic-graph-router-transitions`
Unit 2 makes the reconciler route a merged-with-residue tactic to
`main-qa`; this tactic supplies the phase value itself and the handler
that runs it.

Verifiability is triaged at record time, not at handler boot: the qa
phase only records machine/browser-verifiable items as `main-qa` residue
(its triage already classifies every item — `tactic-phase-skill-node-targets`
Unit 3); a prod observation needing human judgment is `needs-human` and
parks via `office_hours` at qa time. This structurally solves, on the
node lane, what `tactic-main-qa-triage-before-provision` patches on the
legacy lane (qa-main Step 4·0 rejecting an unverifiable follow-up only
after a worktree + session boot were paid) — an unverifiable item never
becomes residue, so no `main-qa` session is ever provisioned for it.

## Unit 1 — Phase enum gains `main-qa`

**Recommended model:** sonnet

Scope — `packages/intentionsutil/src/schema.ts:24-41` (`Phase` type and
`PHASES` array): add `"main-qa"` between `"review"` and `"done"`. No
validator logic beyond the enum — phase-order semantics live in the
router, not the schema (parity with how `fix` is already just an enum
value). Tests: `packages/intentionsutil/test/` — a node with
`phase: main-qa` round-trips write-node → readNode; `validateNode`
rejects a misspelling.

## Unit 2 — qa-main handler on node targets

**Recommended model:** opus

Depends on: Unit 1.

Scope — `.claude/skills/qa-main/SKILL.md`, node-target lane alongside the
legacy issue lane (keyspace split per `tactic-phase-skill-node-targets`
Unit 1's convention):
- Target: a tactic node at `phase: main-qa`; the work list is the
  needs-main residue section of the node body (not a gh issue body).
  Residue is pre-triaged verifiable at record time (Context above), so
  the legacy Step 4·0 verifiability pre-filter is a cheap re-assert on
  the node lane, not a discovery step.
- Sensor gate (consulted by the selector before spawning, and re-checked
  by the handler): the source PR is merged and the prod deploy for the
  touched app(s) has landed.
- Outcomes, legacy parity, all via `graph-commit`: pass → `main-qa →
  done` transition (prune, per the transitions machinery); broken → write
  an implement-chain bug tactic (fresh node, `phase: implement`, finding
  provenance in the body) then `done`; cannot-verify → `office_hours`
  park on the node.
- No gh label or issue is read or written on the node lane.

## Dependencies

- `tactic-phase-skill-node-targets` — the keyspace-split target
  convention and the qa-side residue recording (its Unit 3).
- `tactic-graph-router-transitions` — reconciler routing into `main-qa`
  and the done-prunes machinery (coordinate; not a hard blocker for
  Unit 1).

## Reuse

- `.claude/skills/qa-main/SKILL.md` — the verification procedure
  (Claude-in-Chrome against deployed main/prod) carries over unchanged;
  only target resolution and outcome writes change.
- `packages/intentionsutil/scripts/graph-commit` and `write-node.ts` for
  every outcome write.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: a synthetic tactic node with a residue section and a merged
scratch PR walks `main-qa → done` via the handler's node lane; a
simulated broken outcome writes the bug tactic with provenance and still
transitions the source to `done`; no gh label or issue is touched at any
step.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
SKILL.md commits are denied to auto-mode dispatch sessions — if denied,
park via `office_hours` for a human grant rather than splitting the PR.

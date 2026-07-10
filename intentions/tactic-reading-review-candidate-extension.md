---
id: tactic-reading-review-candidate-extension
kind: tactic
statement: Extend /reading-review for candidate chunks — the session resolves to
  a tradition record, grounding marks, or a dismissal clarification
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-10 /align-tactics round from the 2026-07-07 draft:
  the office-hours curriculum session already exists as
  tactic-reading-review-skill (phase review, PR #2796, serving
  strategy-philosophical-grounding), so this extends it rather than duplicating.
  Candidate chunks (attributes.curriculum.candidate: true) have different
  completion semantics from verify chunks: no tradition record exists yet, so
  the session creates one (adopted/diverged/declined), applies grounding marks
  to target nodes, or records a dismissal clarification on
  strategy-complete-grounding. The draft's plan-only-after-it-lands note is now
  the blocked_by edge on tactic-reading-review-skill."
reading: null
gap: null
serves:
  - strategy-complete-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 7
  override: null
  rationale: "Author-directed 2026-07-09: curriculum-frontier machinery — it
    extends /reading-review for candidate chunks, resolving a session to a
    tradition record, grounding marks, or a dismissal. Same tier as the other
    curriculum tooling (tactic-reading-review-skill, tactic-sync-reader-skill:
    boost 7). It serves strategy-complete-grounding (unboosted, and too broad to
    boost as a whole), so it takes the full boost 7 directly rather than by
    inheritance to reach the same authored-7 curriculum tier."
phase: qa
execution:
  branch: tactic-reading-review-candidate-extension
  pr: 2814
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-reading-review-skill
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Extend /reading-review for candidate chunks — the session resolves to a tradition record, grounding marks, or a dismissal clarification

## Context

The office-hours curriculum session already exists as
`tactic-reading-review-skill` (phase `review`, PR #2796, serving
`strategy-philosophical-grounding`); the `blocked_by` edge holds this tactic
until that PR lands `.claude/skills/reading-review/SKILL.md`. This extends
that skill rather than authoring a duplicate (2026-07-07 interview, retained
draft). Verify chunks (1–9) check an existing tradition record against its
texts (amend-or-ratify, flip `delegated → codified`). Candidate chunks
(`attributes.curriculum.candidate: true`, chunks 10+) have no record yet: the
session's dialectic establishes relevance and author understanding, then
resolves to exactly one terminal outcome. This is
`strategy-complete-grounding`'s third tooling goal (actuator) and the
mechanism behind "candidate chunks keep resolving at office-hours" in its
success signal.

## Units of work

### Unit 1 — candidate-chunk branch in `.claude/skills/reading-review/SKILL.md`

**Scope.** One edited file: `.claude/skills/reading-review/SKILL.md` (read
the landed file for exact anchor points; its authored spec is Unit 1 of
`intentions/tactic-reading-review-skill.md`, which the implementer should
read alongside). Add a candidate-chunk branch:

- **Detection**: the selected chunk carries
  `attributes.curriculum.candidate: true` (e.g.
  `intentions/tactic-reading-chunk-10-hirschman-exit-voice.md`). Everything
  else in the session frame — precondition check, periagoge/turning
  constraint, verdict refinement loop, session bounds, cross-chunk boundary
  rule, notes-for-later exit, one-graph-commit landing, prohibitions —
  applies to candidate sessions unchanged.
- **Resolution — exactly one primary outcome**:
  - (a) **adopt/diverge**: create a new `tradition-*` record via write-node
    with adopted/diverged/chosen_over entries carrying graph loci (field
    shapes: `intentions/kind-tradition.md` `attributes.fields`; precedent
    records: `intentions/tradition-*.md`), `origin` per the interview, and
    `status: codified` — the examining session *is* the author's personal
    verification (kind-tradition's status clarification). Outcome (a)
    normally also stamps `attributes.traditions` on the chunk's target nodes,
    pointing at the new record, in the same bundle.
  - (b) **marks only**: `attributes.grounding` / `attributes.traditions`
    updates on the chunk's target nodes as the interview resolves them, with
    no new record.
  - (c) **dismissal**: a dated clarification on
    `strategy-complete-grounding` naming the candidate and why it was
    dismissed; **no** tradition record (`declined` records stay reserved for
    refused doctrine, not irrelevance — strategy clarification 3).
- **Either way**: stamp `attributes.irreversibility.last_exercised` on
  `intentions/delegation-philosophical-articulation.md`; a delegatee
  misarticulation caught during the dialectic lands in that delegation's
  `divergence.contradictions` (the existing reading-wins rule); set the
  chunk `phase: "done"`; bundle every touched node in the session's single
  `graph-commit`.

**Out of scope**: any change to the verify-chunk (1–9) flow; `/sync-reader`;
`packages/intentionsutil`.

**Recommended model**: opus

## Reuse

- `.claude/skills/reading-review/SKILL.md` — the file under edit; its
  recording rules (write-node on readNode-dumped jq-patched JSON, one
  graph-commit, provenance sentences, persistence check) are reused verbatim
  by the branch.
- `intentions/tactic-reading-chunk-10-hirschman-exit-voice.md` — the
  candidate-chunk shape and per-chunk Completion contract.
- `intentions/kind-tradition.md` — record field shapes and status semantics.
- `intentions/tradition-stoicism.md` — the declined-record precedent
  (distinguish declension from dismissal).

## Verification

No automated test surface. Manual dry-run in an interactive session against
`tactic-reading-chunk-10-hirschman-exit-voice` without landing (stop before
`graph-commit`): confirm the branch detects `candidate: true`, offers the
three resolutions with the author's articulation preceding any account of
Claude's, produces JSON that
`npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts for
outcome (a) (a `tradition-hirschman` record plus `attributes.traditions`
stamps), and plans one graph-commit bundle including the delegation stamp
and the chunk resolution. Confirm the verify-chunk flow is unchanged by the
edit and no `gh` invocation appears.

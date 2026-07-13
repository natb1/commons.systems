---
id: tactic-review-sitting-skill-generalization
kind: tactic
statement: "Generalize the office-hours review sitting beyond reading chunks:
  mode-A source re-validation for non-text sources (delegation exercise,
  world-state/condition checks) and mode-B context-broadening confirmation
  sittings for author-owned doctrine, extending the /reading-review machinery"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-12 (round-1 continuation, per its recorded round-1
  disposition): its gate has cleared — tactic-reading-review-skill landed
  (phase: done), so the /reading-review session frame this extends is now on
  origin/main. Generalizes that office-hours sitting frame beyond reading chunks
  to (1) mode-B context-broadening confirmation sittings for author-owned
  durable nodes and (2) mode-A delegation-exercise sittings against the
  event-based delegation review model (review_window retired 2026-07-09). Mode-A
  world-state/condition sittings are out of scope this round, deferred pending
  tactic-condition-review-sweep home decision at the
  tactic-align-audit-legacy-review office-hours sitting (both still parked).
  Extends, never duplicates, tactic-reading-review-skill and its
  candidate/capstone extensions."
reading: null
gap: null
serves:
  - strategy-graph-review-curriculum
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-graph-review-curriculum
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Generalize the office-hours review sitting beyond reading chunks: mode-A source re-validation for non-text sources (delegation exercise, world-state/condition checks) and mode-B context-broadening confirmation sittings for author-owned doctrine, extending the /reading-review machinery

## Context

`strategy-graph-review-curriculum` enrolls every durable-layer node (virtue,
strategy, kind, tradition, delegation) in a recurring office-hours review
curriculum with two modes (its clarification 3):

- **Mode A** — re-validate deferred/delegated content against its *source*.
- **Mode B** — re-affirm author-owned content against *recursively broadened
  context*.

Today only one mode-A path has a runnable office-hours sitting: the
tradition-reading curriculum, run by `/reading-review`
(`.claude/skills/reading-review/SKILL.md`), which sits an author against a
primary text for one `tactic-reading-chunk-*` / `tactic-context-capstone-*`
node. The coverage sensor `packages/intentionsutil/scripts/review-coverage.ts`
(via `packages/intentionsutil/src/coverage.ts`) already *projects* a review
path for every durable node — `event-based-review` for delegations,
`reading-program` for traditions, `condition-sweep` / `frontier-reachable` for
author-owned nodes — but for the mode-B `frontier-reachable` path and the
mode-A delegation `event-based-review` path there is **no sitting skill** that
actually runs the review. This tactic builds those two sittings, so the
curriculum can produce *motion* (the strategy's signal: sittings completed,
each re-affirming or amending a previously settled node) for author-owned and
delegation nodes — not just readings.

The gate that held this as a draft in the 2026-07-09 round has cleared:
`tactic-reading-review-skill` is now `phase: done`, so the `/reading-review`
session frame this extends is on `origin/main`.

**Design decision — extend `/reading-review`, do not fork a new skill.** The
sitting *form* is identical across all modes: the same periagoge principle
(the author articulates first; probes cite the source, never Claude's gloss),
the same verdict-refinement loop, the same unbounded/interactive session
bounds, the same `write-node` → single-`graph-commit` recording gate, the same
notes-for-later exit, and the same prohibitions (no `gh`, no edits outside
`intentions/`). Only the *agenda* and the *source collected beforehand* differ
per mode — exactly the axis on which `/reading-review` already branches
(verify chunk vs candidate chunk vs capstone). Adding two more agenda branches
to the one skill keeps a single home for the shared session frame; forking a
second skill would duplicate the periagoge machinery and drift. This mirrors
how `tactic-reading-review-candidate-extension` (done) added the candidate
branch to the same file.

### Out of scope

- **Mode-A world-state/condition sittings** (collect the current world state
  behind an `attributes.conditions` entry and verify against it). Deferred:
  the sweep's home is undecided — `tactic-condition-review-sweep`
  (`owner: human`, parked) is `blocked_by tactic-align-audit-legacy-review`,
  whose office-hours sitting decides whether the standing-conditions sweep
  lives in `/align-audit`, another home, or is retired. Planning a sitting for
  it now would guess that home. A later `/align-tactics` round mints the
  world-state sitting branch once that sitting resolves; until then the
  substance is tracked on those two nodes, not lost. This tactic must not add
  a world-state branch.
- `/reading-review`'s existing reading-chunk, candidate, and capstone flows —
  unchanged; this tactic only adds branches.
- Record-time curriculum enrollment (`tactic-align-curriculum-maintenance`,
  done) and the coverage table (`tactic-review-curriculum-coverage-sensor`,
  done) — separate, already landed.

## Unit 1 — Mode-B confirmation sitting (author-owned doctrine)

**Recommended model:** opus (judgment-heavy: designs a new office-hours
dialectic agenda and the recursive frontier-expansion recording rule; the plan
leaves the exact probe/verdict shaping to implementation, mirroring existing
branches).

**Scope.** Edit `.claude/skills/reading-review/SKILL.md` to add a mode-B
confirmation-sitting branch:

- **Trigger/selection.** Extend the selection prose
  (`.claude/skills/reading-review/SKILL.md` "Trigger and selection", ~lines
  46–81) so that with no argument the skill also selects a parked mode-B review
  entry (`office_hours` set, `phase` ≠ `done`) and with an argument accepts a
  mode-B frontier-entry node id. Reuse the coverage projection: a mode-B
  subject is an author-owned durable node (`review-coverage.ts` `modeOf` → `B`,
  path `frontier-reachable` — `packages/intentionsutil/src/coverage.ts:44-96`).
  Keep chunk/capstone selection unchanged; mode-B entries sort after them (they
  carry no `attributes.curriculum.priority`), consistent with how capstones
  already sort.
- **Session frame — reuse unchanged.** State explicitly that the periagoge
  principle, the demonstration-as-dialectic step, the verdict-refinement loop,
  session bounds, the cross-chunk boundary rule, notes-for-later exit, the
  `write-node` recording gate, one-`graph-commit` landing, and the prohibitions
  all apply unchanged (the same "whole session frame above applies" language the
  candidate and capstone branches use).
- **Agenda (what differs).** The author collects *broadened context* of the
  node's underlying reading, exercise, or world state (recursively broadening,
  exactly as the philosophical curriculum broadens reading context), then
  re-affirms or amends the prior author-owned assertion. The record at
  `origin/main` is the fixed object; the author articulates first, Claude's
  account enters only as counterpoint.
- **Recording.** Re-affirmation lands as a dated `clarifications` entry (with
  the provenance sentence convention, e.g.
  `"...Recorded 2026-07-20 /reading-review mode-B <node-id>."`) on the reviewed
  node; an amendment edits the node's own substance and cascades to any
  clarification that leaned on the prior assertion — all through `write-node`.
  Add a persistence-check analogue: the confirmed understanding must live on the
  durable reviewed node, never solely on a transient entry node.
- **Recursive frontier expansion (the recurrence mechanism).** The sitting ends
  by naming the next frontier entries: mint born-parked review-item node(s)
  (`office_hours` set at creation, no `phase`, `owner: human`,
  `serves: [strategy-graph-review-curriculum]`) whose broadened-context scope
  is the next step out, bundled into the same `graph-commit`. This is the
  mechanism (strategy clarification 3) that gives author-owned nodes periodic
  coverage — model it on the capstone-minting rule already in the file
  (`.claude/skills/reading-review/SKILL.md` "Context-chunk capstone minting",
  ~lines 186–215), which likewise mints a born-parked follow-on in the same
  commit. The minted entry's raw text must contain the reviewed subject's id as
  a substring, so `coverage.ts` `frontierEntryFor`
  (`packages/intentionsutil/src/coverage.ts:66-83`) links it back to its
  subject (`frontier-entry:<id>`).
- **Curriculum reflexivity.** Note that the curriculum mechanism itself (these
  skills, the strategy) is a durable node subject to the same mode-B review
  (strategy clarification 4) — no special-casing.

**Out of scope for this unit:** any mode-A change; the world-state branch (see
Context → Out of scope).

## Unit 2 — Mode-A delegation-exercise sitting

**Recommended model:** opus (judgment about how a delegation-exercise dialectic
runs and records against the event-based review model; adjacent to Unit 1's
frame but a distinct source and audit-trail).

**Dependencies:** Unit 1 (both edit the same `SKILL.md`; land Unit 1's shared
frame extensions first so Unit 2 references them rather than re-stating).

**Scope.** Edit `.claude/skills/reading-review/SKILL.md` to add a mode-A
delegation-exercise-sitting branch:

- **Trigger/selection.** Accept a `delegation-*` node id as a target, and in
  no-argument selection include a parked delegation review entry. A delegation's
  review path is `event-based-review` when it carries a non-empty
  `attributes.review_trigger` (`coverage.ts` `modeOf` → `A`, `pathOf`
  delegation branch — `packages/intentionsutil/src/coverage.ts:98-113`); the
  sitting is prompted by a `review_trigger` firing (the event-based model —
  `review_window` was retired 2026-07-09; kind-delegation's review model is
  `review_trigger` firings, reading-program rounds touching the delegatee's
  domain, requirement refinement — `intentions/kind-delegation.md`
  clarifications, `strategy-exercise-recovery-paths` rationale). Do **not**
  reference `review_window`.
- **Session frame — reuse unchanged.** Same statement as Unit 1: the whole
  `/reading-review` session frame applies; only the agenda and collected source
  differ.
- **Agenda (what differs).** The author collects and *walks the delegation's
  recovery path* — the `attributes.irreversibility.recovery_path`
  (`intentions/delegation-philosophical-articulation.md` is the reference
  instance: `recovery_path`, `recovery_cost`, `gated`, `last_exercised`,
  `divergence.contradictions`, `non_delegable_floor`) — and demonstrates the
  delegated capability is still recoverable, articulating first.
- **Recording (the audit trail).** On completion, through `write-node`:
  - stamp `attributes.irreversibility.last_exercised` and
    `attributes.last_assessed` on the reviewed delegation node with the sitting
    date;
  - every divergence caught (the delegatee's articulation contradicting a
    disposition actually held) lands as a dated entry in the delegation's
    `divergence.contradictions` — the recovery loop's persistent audit trail
    (the same reading-wins rule `/reading-review` already applies to
    `delegation-philosophical-articulation`);
  - a re-affirmation with no divergence still stamps the dates and records a
    dated note of the exercise.
  These mirror the delegation-stamp closing steps `/reading-review` already
  performs for `delegation-philosophical-articulation`
  (`.claude/skills/reading-review/SKILL.md` "Recording rules" →
  "Delegation audit trail", ~lines 160–166) — generalize them to *any*
  reviewed `delegation-*` node.
- **Frontier expansion.** As in Unit 1, close by naming the next event-based
  review trigger / born-parked entry as appropriate, bundled into the same
  `graph-commit`.

**Out of scope for this unit:** the world-state/condition branch (deferred, see
Context); any change to Unit 1's mode-B agenda.

## Reuse

- `.claude/skills/reading-review/SKILL.md` — the office-hours sitting skill this
  tactic extends; the verify-chunk / candidate / capstone branches are the
  pattern templates for the two new branches (shared session frame, born-parked
  follow-on minting, delegation-stamp closing steps).
- `packages/intentionsutil/src/coverage.ts` — `modeOf` (mode A/B),
  `frontierEntryFor` (born-parked entry ↔ subject linkage by id substring),
  `pathOf` (`frontier-reachable`, `event-based-review`). The new sittings run
  the paths this module projects; keep their linkage assumptions intact.
- `packages/intentionsutil/scripts/review-coverage.ts` — the coverage table the
  sittings' selection reads (interim sensor).
- `packages/intentionsutil/scripts/write-node.ts` — the single frontmatter
  write gate; `packages/intentionsutil/scripts/graph-commit` — the only landing
  path.
- `intentions/delegation-philosophical-articulation.md` — reference instance of
  the delegation fields Unit 2 stamps; `intentions/kind-delegation.md` — the
  event-based review model Unit 2 must honor.

## Verification

Prose — a `SKILL.md` is model instructions with no automated test surface;
verify by dry-run in an interactive office-hours session, stopping before
`graph-commit` (the same discipline `/reading-review`'s own verification uses):

- **Mode-B dry-run.** Target an author-owned durable node the coverage table
  marks mode B / `frontier-reachable` (confirm the projection first with the
  fenced check below). Confirm the skill selects it, surfaces the
  broadened-context agenda with the author articulating before any account of
  Claude's, plans a re-affirm/amend recording on the durable node (not on a
  transient entry), and plans a born-parked frontier-expansion entry whose raw
  text contains the subject id — producing JSON that `validate-graph.ts`
  accepts. Confirm the verify-chunk / candidate / capstone flows are unchanged.
- **Mode-A delegation dry-run.** Target a `delegation-*` node with a non-empty
  `attributes.review_trigger`. Confirm the branch surfaces the recovery-path
  agenda, plans `last_exercised` + `last_assessed` stamps and any
  `divergence.contradictions` entry, references the event-based model and never
  `review_window`, and produces JSON `validate-graph.ts` accepts.
- Confirm no world-state/condition branch was added (it is deferred), and no
  `gh` invocation appears anywhere in the flow.

```verify
# The coverage projection the sittings' selection depends on still renders, and
# the graph validates after the SKILL.md edit lands.
npx tsx packages/intentionsutil/scripts/review-coverage.ts >/dev/null
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

---
id: tactic-stale-hold-auto-resolve
kind: tactic
statement: A tracked hold keeps blocking its source node after the condition it
  tracks is gone — nothing re-checks a hold's own predicate, so a worktree-residue
  hold whose worktree is verifiably clean stays parked at phase null with its
  blocked_by edge intact, and the source node remains blocked with no signal
  distinguishing it from a hold whose condition still holds
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-31 by two independent verification passes that each hit
  the same wall from a different node. tactic-prune-conflict-recovery-silent-loss
  is blocked_by tactic-hold-residue-prune-conflict-recovery-silent-loss, and
  tactic-standdown-winner-liveness is blocked_by
  tactic-hold-residue-standdown-winner-liveness. Both holds were recorded against
  an uncommitted intentions/ diff in the source node's worktree. Both worktrees
  were then verified clean — `git status --porcelain --untracked-files=no` returns
  empty for each — so both holds track a condition that no longer exists, yet both
  remain parked and both edges remain. Had the office-hours rulings on those two
  nodes been the only blocker, each node would still have been stuck afterwards on
  a hold nothing was watching. resolve-hold exists and is the correct scripted
  inverse of hold-node; it writes office_hours null AND phase done on the hold and
  then removes the edge from the source, deliberately in two separate graph-commits
  because blocked_by is a LIST field whose layer-2 union merge can only ADD, so a
  removal batched with other writes is silently dropped and reported as a
  successful land. What is missing is not the primitive but the trigger: nothing
  ever asks whether a hold's predicate still holds. Every hold today is cleared by
  a human noticing, or by an incidental commit side-effect. Direction for planning,
  not a plan: give each hold kind a machine-checkable predicate and re-evaluate it
  on a cadence, in the shape lib-standdown-recheck.sh already established for
  stand-down markers — run from the main checkout so invariant I1 holds, keep the
  record and retry next tick on failure rather than swallowing it, and emit a
  per-sweep count so a growing stale-hold population is visible rather than silent.
  worktree-residue is the obvious first kind because its predicate is one git
  status call. Note the hazard a pruned blocker already
  demonstrates: clearing an edge is a removal on a union-merged list field, so any
  automated resolver must re-read origin/main and assert the edge is actually gone,
  never trust a reported successful land — the same rule as invariant I2. Interim
  attention scaffolding only — tactic-attention-tier-ranking replaces the numeric
  scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave B of the three-band interim scale
    (50 / 20 / 10) — dispatch-containment work that follows the Wave A write-path
    fixes. Wave B rather than Wave A because the resolve primitive already exists
    and a human can run it in seconds once the stale hold is noticed, so the defect
    costs latency and attention rather than correctness. blocked_by is empty, so
    this promotion lifts no blocker and cannot compound. status stays raw and phase
    stays null so the selector emits it as an /align-tactics candidate for
    planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
---

# tactic-stale-hold-auto-resolve

## Evidence

Both instances found 2026-07-31, each by a verification pass on a different node
that discovered its target would remain blocked even after the office-hours
ruling it was waiting on.

| hold | source it blocks | predicate | actual state |
|---|---|---|---|
| `tactic-hold-residue-prune-conflict-recovery-silent-loss` | `tactic-prune-conflict-recovery-silent-loss` | uncommitted `intentions/` diff in the source's worktree | worktree clean |
| `tactic-hold-residue-standdown-winner-liveness` | `tactic-standdown-winner-liveness` | same | worktree clean |

```bash
git -C .claude/worktrees/tactic-prune-conflict-recovery-silent-loss \
    status --porcelain --untracked-files=no    # empty
git -C .claude/worktrees/tactic-standdown-winner-liveness \
    status --porcelain --untracked-files=no    # empty
```

Both holds remain `phase: null` with `office_hours` set, and both `blocked_by`
edges remain on the source nodes.

## What is missing

`resolve-hold` is the correct inverse of `hold-node` and already does the hard
parts: it writes `office_hours: null` **and** `phase: done` on the hold (clearing
`office_hours` alone does not unblock the source), removes the id from the
source's `blocked_by`, and splits those into two `graph-commit` calls on purpose
— `blocked_by` is a LIST field whose layer-2 union merge can only add, so a
removal batched with other writes is silently dropped while the land reports
success. Each stage re-reads `origin/main` and asserts.

So the gap is the **trigger**, not the primitive. Nothing re-evaluates a hold's
predicate. A hold is cleared only when a human notices it, and a stale hold is
indistinguishable from a live one without manually re-running its check.

## Scope sketch — direction only, not a plan

- Give each hold kind a machine-checkable predicate. `worktree-residue` is the
  obvious first: one `git status --porcelain --untracked-files=no` call.
- Re-evaluate on a cadence, in the shape `lib-standdown-recheck.sh` established:
  run from the main checkout so invariant I1 holds; on failure keep the record and
  retry next tick rather than swallowing the error; emit a per-sweep count so a
  growing stale-hold population is visible.
- Any automated resolver must re-read `origin/main` and assert the edge is gone
  rather than trusting a reported successful land — clearing an edge is a removal
  on a union-merged list field.
- A hold kind with no machine-checkable predicate must say so explicitly rather
  than defaulting to never-re-checked.

## Verification

- Seed a `worktree-residue` hold, clean the worktree, run a sweep: the hold must
  reach `phase: done` and the source's `blocked_by` must no longer contain it when
  read back from `origin/main`.
- A hold whose residue still exists must survive the sweep untouched.
- The sweep count must be visible per run, and must distinguish "no stale holds"
  from "could not evaluate".

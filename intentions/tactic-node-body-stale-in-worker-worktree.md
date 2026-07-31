---
id: tactic-node-body-stale-in-worker-worktree
kind: tactic
statement: a worker's worktree pins `intentions/` at provision time and nothing
  re-syncs it mid-session, so any edit to the worker's own node landed after
  provisioning is invisible to that worker — and because /align-tactics finishes
  by writing the plan's body_markdown wholesale, a stale-based write replaces
  the newer body rather than merging with it, discarding the landed edit with no
  error at the point of loss
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-31 by direct observation, and caught before it landed.
  A node was filed at 12:42:45 (9980d695), the fleet provisioned a worktree for
  it at 12:47:22, and a corrected scope for the same node landed at 13:02:43
  (e2b2198b) — fifteen minutes after provisioning. The worker had by then spent
  twenty-four minutes authoring a 771-line plan against the superseded body, had
  already run write-node.ts over the frontmatter, and its next step was to
  replace the body with the plan's body_markdown. It was stopped in that window;
  origin/main was verified still carrying the correction. Nothing in the
  pipeline had reported a problem at any point. This is the same mechanism as
  tactic-node-worker-fresh-skill-body — a worktree is a snapshot, and the worker
  reads its own checkout rather than main — but applied to NODE bodies rather
  than skill bodies, and nothing tracks that variant. It is the more destructive
  of the two for a specific reason: a stale skill body makes a worker behave as
  an older version of itself, which is recoverable, whereas a stale node body
  feeds a wholesale body write. body_markdown is not merged into the existing
  body; it replaces it. So the newer content is not conflicted, not flagged, and
  not preserved — it is overwritten by a plan that never knew it existed. What
  makes this worth tracking rather than filing under operator caution is where
  the protection sits. The --base CAS would probably have caught this instance,
  because the base manifest was dumped from the stale working tree and dump-node
  computes its token from the working tree; graph-commit would then have found
  the base unfresh against origin/main and parked the write. But that is a guard
  at the wrong layer and with the wrong outcome. It fires at land time, after
  the plan has been authored and the body already overwritten locally, and its
  success case is a parked write for a human to clear rather than a preserved
  edit. There is no check at the point where the loss actually occurs, which is
  the body write itself. And the failure it guards against is silent at every
  earlier stage: the worker cannot tell that its node changed underneath it,
  because nothing tells it. That places this in the class the bootstrap plan
  names — a path whose failure mode produces no signal where the signal is
  needed. Direction for planning, not a plan. The interim fix is to re-read the
  node from origin/main immediately before the body write and fail closed if it
  differs from the base snapshot, naming the intervening commit; a worker that
  discovers its node moved should re-plan or hand back, never overwrite. The
  general rule worth encoding alongside it: a wholesale body write must always
  be preceded by a freshness assertion against the same ref the write will land
  on. The greenfield answer is different and already exists as
  tactic-graph-ref-split, which moves intentions/ onto a dedicated graph branch
  and gives every worktree a symlink to one shared graph store instead of a
  private checkout. That collapses N per-worktree snapshots into one, so the
  question stops being whether each of N worktrees is fresh and becomes whether
  the single store is fresh — one question with one answer, and no divergence
  between workers to begin with. This node should be recorded as superseded by
  that migration, and kept alive until it lands, on the same reasoning the
  bootstrap plan already applied to the three other tactics ref-split
  supersedes: they are live silent-corruption defects today and the migration is
  weeks out behind a freeze and a drain. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion —
    it is a silent-content-loss defect on the graph write path, and the graph is
    the artifact the whole pipeline coordinates through. The one observed
    instance was caught only because a human happened to be watching the node it
    affected; the same race under an unattended fleet discards the edit and
    leaves a plan built on superseded intent, with the node reading as
    successfully planned. blocked_by is empty, so this promotion lifts no
    blocker and cannot compound."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# tactic-node-body-stale-in-worker-worktree

A worktree is a snapshot of `intentions/` taken at provision time. Nothing
re-syncs it for the life of the session. So a worker's view of **its own node**
is frozen at the moment it was spawned, and any edit landed afterwards is
invisible to it.

## The observed instance

| time | event |
|---|---|
| 12:42:45 | node filed — `9980d695` |
| 12:47:22 | fleet provisions the worktree, pinned at `9980d695` |
| 13:02:43 | **corrected scope lands** — `e2b2198b` |
| 12:47 – 13:11 | worker authors a 771-line plan against the superseded body |
| ~13:11 | frontmatter written via `write-node.ts`; next step is the body write |
| 13:14 | stopped in that window; `origin/main` verified intact |

Nothing reported a problem at any point in that sequence.

## Why this is worse than the skill-body variant

`tactic-node-worker-fresh-skill-body` covers the same mechanism for skill
bodies, and it merged. A stale *skill* body makes a worker behave as an older
version of itself — degraded, but recoverable.

A stale *node* body feeds a **wholesale write**. `/align-tactics` finishes by
replacing the body with the plan's `body_markdown`. It is not merged into the
existing body; it replaces it. The newer content is therefore not conflicted,
not flagged, and not preserved — it is overwritten by a plan authored without
knowledge of it.

## The guard is at the wrong layer

The `--base` CAS would likely have caught this instance: the base manifest is
dumped from the working tree, so a stale tree yields a base that
`graph-commit` finds unfresh against `origin/main`, and the write parks.

That is real protection, but it is in the wrong place and produces the wrong
outcome:

- it fires **at land time**, after the plan is authored and the body already
  overwritten locally;
- its success case is **a parked write for a human to clear**, not a preserved
  edit;
- there is **no check at the point of loss**, which is the body write itself.

At every stage before the park, the worker has no way to learn that its node
moved underneath it, because nothing tells it. That is the class the bootstrap
plan names: a path whose failure mode produces no signal where the signal is
needed.

## Direction

**Interim.** Re-read the node from `origin/main` immediately before the body
write and fail closed if it differs from the base snapshot, naming the
intervening commit. A worker that discovers its node moved should re-plan or
hand back — never overwrite. The general rule worth encoding alongside it: *a
wholesale body write must be preceded by a freshness assertion against the same
ref the write will land on.*

**Greenfield — already exists.** `tactic-graph-ref-split` moves `intentions/`
onto a dedicated graph branch and gives every worktree a symlink to one shared
graph store rather than a private checkout. That collapses N per-worktree
snapshots into one: the question stops being whether each of N worktrees is
fresh and becomes whether the single store is fresh — one question, one answer,
and no divergence between workers to begin with.

This node is **superseded by that migration** and should be kept alive until it
lands, on the same reasoning the bootstrap plan applied to the three other
tactics ref-split supersedes: they are live silent-corruption defects today, and
the migration is weeks out behind a freeze and a drain.

## Machine detect

Any node with a live worktree whose checked-out copy of its own file differs
from `origin/main`:

```bash
git worktree list --porcelain \
  | awk '/^branch refs\/heads\//{sub(/^branch refs\/heads\//,""); print}' | sort -u \
  | while read -r id; do
      [ -f "intentions/$id.md" ] || continue
      git -C ".claude/worktrees/$id" diff --quiet origin/main -- "intentions/$id.md" \
        || echo "STALE-NODE-BODY $id"
    done
```

A hit is a worker planning against superseded intent. It is not by itself proof
of loss — the worker may not have written the body yet — which is exactly why
it is worth checking while the window is still open.

## Exit criterion

A worker whose node was edited after provisioning either re-syncs before writing
or fails closed with an error naming the staleness — and in neither case does a
landed body edit disappear. Demonstrated on a real occurrence, not a harness
case: the detect above fires, and the subsequent write is refused rather than
silently replacing the newer body.

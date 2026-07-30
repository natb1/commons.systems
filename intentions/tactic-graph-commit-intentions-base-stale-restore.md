---
id: tactic-graph-commit-intentions-base-stale-restore
kind: tactic
statement: graph-commit's ensure_intentions_only_base() resets to a re-fetched
  base and then unconditionally copies its pre-reset snapshot back over
  intentions/<id>.md with no freshness check, so a concurrent landing that
  advanced that id between snapshot and reset is silently overwritten with stale
  content
owner: ai
status: raw
parent: null
rationale: "Root-caused by a sibling session and surfaced 2026-07-28 at an
  office-hours drain sitting; filed as its own node because nothing else tracks
  it. ensure_intentions_only_base()
  (packages/intentionsutil/scripts/graph-commit:496-515) runs when the writer's
  HEAD is ahead of origin/main with non-intentions changes. It re-fetches
  origin/main, does 'git reset --hard $base_sha', then for every id in IDS does
  'cp -- $SNAP_DIR/$id.md $INTENTIONS_DIR/$id.md' with NO check that the
  snapshot was taken against the base it is now being replayed onto. SNAP_DIR
  was populated by snapshot() BEFORE the fetch (the function's own deployment
  note requires that ordering), so any landing by another writer that touched
  the same id between snapshot() and this fetch is silently clobbered by the
  older content — no conflict, no park, no warning. This is distinct from
  tactic-graph-commit-staleness-silent-revert (which is about a real dirty edit
  being misclassified as clean and DROPPED); here a real edit is faithfully
  replayed, but onto a base that has moved past it, so a DIFFERENT writer's
  landed content is reverted. It is also distinct from
  tactic-clear-park-repo-targeting-guard (wrong-repo targeting). Historical
  proof on origin/main: commits 15047ed7 (office_hours park to null) and
  ba5d9848 (null back to park, while carrying a clear-park commit message), both
  authored at 2026-07-25 21:42:40 -0400 on tactic-graph-commit-landing-lock — a
  same-second pair where the second commit reinstates the value the first had
  just cleared, and whose message describes clearing the park it in fact
  restored. The pair is the observable signature of a stale snapshot being
  copied back over a fresher base."
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
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path integrity work above ordinary feature
    work. This band holds the silent graph-write-corruption defects plus the two
    paths the bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# ensure_intentions_only_base() replays a stale snapshot over a fresher base

## Context

`packages/intentionsutil/scripts/graph-commit` rebuilds a writer's edit onto an
`intentions/`-only base when the invoking worktree's HEAD carries
non-`intentions/` commits (a feature branch, typically). The function
(`graph-commit:496-515`):

1. `git fetch origin main`, `base_sha="$(git rev-parse FETCH_HEAD)"`.
2. Returns early if the HEAD-side diff has no non-`intentions/` paths.
3. Otherwise records `ORIG_HEAD`, sets `RESTORE_HEAD=1`, and
   `git reset --hard "$base_sha"`.
4. Then, for every id:

```
for id in "${IDS[@]}"; do
  cp -- "$SNAP_DIR/$id.md" "$INTENTIONS_DIR/$id.md"
done
```

`SNAP_DIR` is filled by `snapshot()` **before** this function runs — the
function's own deployment note (`graph-commit:490-495`) mandates that ordering,
so the snapshot predates the `git fetch` in step 1.

## The defect

Step 4 is unconditional. Nothing checks whether `intentions/<id>.md` at
`base_sha` still matches the content the snapshot was taken against. If another
writer landed a change to the same id in the window between `snapshot()` and
this function's `git fetch`, the `cp` replaces that fresher, already-landed
content with the snapshot's older bytes. The result is committed and pushed as
a normal landing: no merge, no conflict, no park, no diagnostic. From the
graph's perspective a landed value spontaneously reverts.

This is a **revert of someone else's landed work**, which distinguishes it from
the two neighbouring defects:

- `tactic-graph-commit-staleness-silent-revert` — the invoking writer's own
  real dirty edit is misclassified as clean and silently dropped (or falsely
  reported landed). There, the losing edit is the caller's.
- `tactic-clear-park-repo-targeting-guard` — the edit is written to one
  checkout and landed from another. There, the repo is wrong.

Here the caller's edit lands correctly; the collateral damage is a concurrent
writer's.

## Historical evidence

On `origin/main`, on `tactic-graph-commit-landing-lock`:

- `15047ed7` — `graph: clear office_hours park on
  tactic-graph-commit-landing-lock (...)`, sets `office_hours` to null.
- `ba5d9848` — same subject line, near-identical body, but restores the parked
  `office_hours` block.

Both carry author date `2026-07-25 21:42:40 -0400` — the same second. The
second commit's message narrates clearing a park while its content reinstates
one. That is the signature: two writers holding snapshots of the same id, the
later one replaying a snapshot captured before the earlier one landed.

## Direction

Per `.claude/rules/code-style.md` (prefer clear errors over defensive
fallbacks), the fix should not silently pick a winner. Candidate shape, for a
later planning pass to settle: before the `cp`, compare the snapshot's base
content for each id against `base_sha:intentions/<id>.md`; when they diverge,
route into the existing layer-2/3 merge ladder
(`tactic-graph-commit-auto-serialization`) or fail loudly into the established
park path — never overwrite unconditionally.

## Reuse

- `packages/intentionsutil/scripts/test-graph-commit.sh` — the bare-origin +
  multi-clone functional harness; a deterministic repro belongs here as a case
  where writer A snapshots, writer B lands the same id, then A's
  `ensure_intentions_only_base()` runs.
- `graph-commit`'s existing layer-2/3 auto-merge ladder and `park_and_exit`
  path — the already-built machinery for a detected concurrent-edit divergence;
  the fix should route into it rather than invent a new outcome.
- `tactic-graph-commit-landing-lock` — the lock that serializes the
  rebase-stamp-push critical section; note it does **not** close this window,
  because `snapshot()` runs before the lock's protected section.

## Out of scope

- The staleness/freshness misclassification tracked by
  `tactic-graph-commit-staleness-silent-revert`.
- Repo targeting, tracked by `tactic-clear-park-repo-targeting-guard`.
- No implementation plan is written here; this node is `status: raw`,
  `phase: null` for a later `/align-tactics` pass.

---
id: tactic-graph-commit-rebuild-snapshot-stale-revert
kind: tactic
statement: graph-commit's far-ahead rebuild path re-materializes each node from
  the writer's on-disk snapshot AFTER resetting the tree to fresh origin/main,
  so a writer whose checkout holds a stale intentions/<id>.md lands that stale
  content wholesale as a conflict-free commit on top of origin/main — silently
  reverting every edit landed in between; the phase writers
  demote-node-to-implement and apply-node-transition.ts are the unprotected
  callers because, unlike park-node and clear-park, they pass no --base
  compare-and-swap
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 while auditing residual risk after re-planning
  tactic-node-ancestry-context. A demotion had nearly been written from a main
  checkout three commits behind origin/main, and the initial diagnosis — that
  this would silently clobber the just-landed plan update — was WRONG for the
  in-place path and was corrected by direct reproduction: committing a
  frontmatter demotion on the stale base and rebasing onto the newer origin/main
  produced a loud textual CONFLICT, not a silent revert, because graph-commit
  lands via `git pull --rebase origin main` and a rebase replays the commit
  DIFF. Content the stale writer never saw is absent from both sides of that
  diff, so it survives. That is the protection, and it holds for every caller on
  the in-place path. The genuine defect is the OTHER path:
  ensure_intentions_only_base()
  (packages/intentionsutil/scripts/graph-commit:496) fires when the worktree is
  ahead of origin/main with non-intentions changes — i.e. any PR-branch
  worktree, the normal home of a phase worker — and it is CONTENT-based, not
  diff-based: `git reset --hard $base_sha` to fresh origin/main, then `cp --
  \"$SNAP_DIR/$id.md\" \"$INTENTIONS_DIR/$id.md\"` per id. SNAP_DIR was filled
  by snapshot() (graph-commit:395) from whatever the writer's checkout held. If
  that checkout's copy of the node is stale, the stale blob is laid directly
  over origin/main's fresh one and committed. There is no rebase and therefore
  no conflict: the commit sits on fresh origin/main and its diff IS the revert.
  Reachability is not exotic — provision-node-worktree merges origin/main at
  provisioning (provision-node-worktree:126), but origin/main keeps moving
  during a session, so any node edit landed after that merge is stale in the
  worker's tree the moment the worker calls a graph write for it. On 2026-07-28
  the tactic-node-ancestry-context worktree sat 95 commits behind origin/main; a
  transition written from it would have reverted the plan update landed minutes
  earlier. Filed separately from three related nodes:
  tactic-graph-commit-staleness-silent-revert (phase done, PR #2978) fixed the
  caller-side missing -C in clear-park/resolve-park and explicitly dispositioned
  the silent-revert shape as 'the same family' with 'no race found in
  graph-commit staleness detection' — correct about the race, but it did not
  reach this content-based rebuild path, and the phase writers it never examined
  still pass no --base; tactic-graph-commit-cwd-repo-resolution is the
  wrong-repo fix inside graph-commit; tactic-graph-commit-landing-lock is
  contention serialization."
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

# Stale-checkout writes silently revert origin/main through graph-commit's rebuild path

## What is broken

`graph-commit` has two ways to reach a commit, and they have opposite safety
properties.

**In-place path (safe).** `try_land()` lands via `git pull --rebase origin main`.
A rebase replays the commit's *diff*. Content the stale writer never saw appears
on neither side of that diff, so it survives untouched; where the hunks do
overlap, git raises a textual conflict, which routes into layer-2 field merge or
a fail-closed park. Either way the failure is loud.

**Rebuild path (broken).** `ensure_intentions_only_base()`
(`packages/intentionsutil/scripts/graph-commit:496`) fires when the worktree is
ahead of `origin/main` with non-`intentions/` changes — that is, any PR-branch
worktree, which is where phase workers normally run. It exists for a good
reason: the graph fast-path CI guard rejects a scratch push whose diff names any
path outside `intentions/`, so the edit has to be rebuilt on an intentions-only
base. But it rebuilds by **content**, not by diff:

```
git reset --hard "$base_sha"                       # tree := fresh origin/main
cp -- "$SNAP_DIR/$id.md" "$INTENTIONS_DIR/$id.md"  # then overwrite with the snapshot
```

`SNAP_DIR` was filled by `snapshot()` (`graph-commit:395`) with
`cp -- "$INTENTIONS_DIR/$id.md" "$SNAP_DIR/$id.md"` — whatever the writer's
checkout happened to hold. When that checkout's copy of the node is stale, the
stale blob is laid directly over `origin/main`'s fresh one and committed. The
commit sits on fresh `origin/main`, so there is no rebase, no conflict, and no
warning: the resulting diff **is** the revert of everything landed in between.

## Why the existing nodes do not cover it

`tactic-graph-commit-staleness-silent-revert` (phase `done`, fix in PR #2978)
fixed a real but different defect — `clear-park` and `resolve-park` invoking
`graph-commit` without `-C` — and dispositioned the separately-observed silent
revert as "the same family", concluding that no race exists inside
graph-commit's staleness detection. The race conclusion is correct. But the
revert here needs no race and no wrong repo: one writer, correct `-C`, a stale
tree, and the rebuild path. `tactic-graph-commit-cwd-repo-resolution` is the
wrong-repo fix inside graph-commit; `tactic-graph-commit-landing-lock` is
contention serialization. Neither reaches this.

The compare-and-swap that *would* catch it already exists — `--base` reconciled
by `check_base_freshness()` (`graph-commit:277`) — but only two callers pass it:

| writer | passes `--base` |
| --- | --- |
| `park-node` | yes |
| `clear-park` | yes |
| `demote-node-to-implement` | **no** |
| `apply-node-transition.ts` | **no** |

So the phase-transition writers — the ones a worker calls at the end of every
phase, from exactly the far-ahead PR-branch worktree that triggers the rebuild
path — are the unprotected callers.

## Evidence

Observed 2026-07-28 while auditing residual risk on
`tactic-node-ancestry-context`. The in-place half was reproduced directly:
committing a frontmatter demotion on a base three commits stale and rebasing it
onto the newer `origin/main` produced a textual conflict, with the newer body
content intact — confirming the rebase protection and refuting the original
"it would have silently clobbered" diagnosis for that path. The rebuild half is
established from the code above; it is deliberately recorded as not yet
reproduced end-to-end, because doing so requires a real `graph-commit` land.

Reachability is ordinary, not exotic. `provision-node-worktree:126` merges
`origin/main` into the branch at provisioning, but `origin/main` keeps moving for
as long as the session runs, so any node edit landed after that merge is stale
in the worker's tree the moment the worker calls a graph write for that node. On
2026-07-28 the `tactic-node-ancestry-context` worktree stood 95 commits behind
`origin/main`; a transition written from it would have reverted a plan update
landed minutes earlier.

## Directions for the fix (not yet chosen)

Both are cheap; the first is the narrow fix and the second is the general one.

1. **Pass `--base` from the phase writers.** `demote-node-to-implement` and
   `apply-node-transition.ts` adopt the `dump-node.ts --out-dir` /
   `base-manifest.txt` flow that `park-node` and `clear-park` already use, so a
   stale base is refused or reconciled instead of landed. Smallest change,
   matches an established in-repo pattern.
2. **Make the rebuild path itself fail loud.** Before `cp`-ing a snapshot over
   the reset tree, compare the snapshot's base against `origin/main`'s blob for
   that id and refuse when they differ, in the spirit of the existing
   `graph-commit:1473` guard that already refuses to emit a false "landed". This
   protects every caller, including future ones that forget `--base`, and is the
   fix consistent with the project's preference for clear errors over silent
   fallbacks.

Verification for either direction should include a regression test in
`test-graph-commit.sh` that drives the rebuild path from a worktree holding a
deliberately stale node copy and asserts the landed blob is not a revert.

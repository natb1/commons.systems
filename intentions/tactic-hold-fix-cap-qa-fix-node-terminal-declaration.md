---
id: tactic-hold-fix-cap-qa-fix-node-terminal-declaration
kind: tactic
statement: "hold: fix-attempt-cap on `tactic-qa-fix-node-terminal-declaration` —
  a tracked hold blocking the source until the mechanical retry state is
  resolved"
owner: ai
status: codified
parent: null
rationale: null
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
office_hours:
  reason: "/fix-checks retry budget exhausted: 3 attempts concluded with PR #3044
    still red (execution.fix.attempt=4, since 2026-08-09) — the 3-attempt cap is
    exhausted."
  since: 2026-08-09
  recommendation: "Review the fix-checks accumulator (tmp/fix-checks-summary.md in
    the node's worktree, also posted in PR comments; folded into this hold's
    body when present) to diagnose why 3 automated attempts did not resolve CI.
    Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock
    tactic-qa-fix-node-terminal-declaration with a fresh retry budget (attempt
    was reset to 1), or abandon/redesign the tactic if the current approach
    cannot work."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-qa-fix-node-terminal-declaration
  hold_kind: fix-attempt-cap
---
# hold: fix-attempt-cap on tactic-qa-fix-node-terminal-declaration

## Context

`tactic-qa-fix-node-terminal-declaration` hit a mechanical retry state (`fix-attempt-cap`) on 2026-08-09. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-fix-cap-qa-fix-node-terminal-declaration`) carries the park, and `tactic-qa-fix-node-terminal-declaration` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/fix-checks retry budget exhausted: 3 attempts concluded with PR #3044 still red (execution.fix.attempt=4, since 2026-08-09) — the 3-attempt cap is exhausted.

## Diagnosis

# Fix-checks summary — PR #3044

## Iteration 1

**Failed checks:** hook-tests

**Outcome:** flake

**Reproduced:** no

**Reproduce command:** `packages/intentionsutil/scripts/test-graph-commit.sh`

**Failure excerpt:**
```
fatal: failed to copy file to '/tmp/tmp.ga29rjoTE8/w20/.git/objects/92/ad9b83ab14779a54e3298474f7c5c7ee76bc13': No such file or directory
fatal: cannot change to '/tmp/tmp.ga29rjoTE8/w20': No such file or directory
fatal: cannot change to '/tmp/tmp.ga29rjoTE8/w20': No such file or directory
sed: can't read /tmp/tmp.ga29rjoTE8/w20/intentions/t-lock-steal.md: No such file or directory
FAIL: dead-holder steal (rc=99 elapsed=0s)
packages/intentionsutil/scripts/test-graph-commit.sh: line 650: cd: /tmp/tmp.ga29rjoTE8/w20: No such file or directory
```

**Why not caught:** Case 30 ("dead-holder steal") in `test-graph-commit.sh` had its scratch
clone directory (`$WORK/w20`) vanish mid-git-operation. Nothing in the test's own logic removes
it early — `WORK` is a single `mktemp -d` cleaned only by an EXIT trap, and the only prior
parallel activity (Case 29's background writers) is fully `wait`ed before Case 30 starts. Points
to an external CI-runner event (tmp eviction, disk/inode pressure, transient filesystem hiccup),
not a defect in the test or in `graph-commit`. Reproduced 3/3 locally as PASS (68/68 each run);
this PR's diff does not touch `test-graph-commit.sh` or `graph-commit` at all — the PR only adds
`test-node-terminal-coverage.sh` and edits a comment block in `dispatch-self-close`.

**Flake issue:** STALE-HEAD-SUPPRESSED

**Fingerprint:** `hook-tests — dead-holder steal`

`dispatch-flake-dedup-node` returned `NONE` (no existing matching flake tactic), but the
pre-filing `dispatch-flake-stale-head-check` guard found the reproduce command passes cleanly at
a fresh `origin/main` checkout while this PR's actually-pushed head (`6ae814eccf79c202b43b2e1d81a8877b1f021799`)
has diverged from `origin/main` (origin/main carries 7 commits not on the pushed head; the pushed
head carries 5 not on origin/main — none of origin/main's new commits touch
`test-graph-commit.sh`/`graph-commit` directly, so this reads as environmental non-determinism
rather than a pinpointable fix commit). Per the guard's contract: no flake tactic node was
written, the source tactic is not blocked on anything, and the PR is not blocked. **Remedy:**
merge `origin/main` into this PR branch and re-run CI — this worktree already has an unpushed
local merge commit (`75b4a712`) from a prior router pre-spawn merge; a future pass (or the next
`dispatch-propagate` tick) should push a fresh merge and let CI re-run.

## Iteration 2

**Failed checks:** hook-tests

**Outcome:** flake

**Reproduced:** no

**Reproduce command:** `packages/intentionsutil/scripts/test-graph-commit.sh`

**Failure excerpt:**
```
PASS: lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle
fatal: failed to copy file to '/tmp/tmp.ga29rjoTE8/w20/.git/objects/92/ad9b83ab14779a54e3298474f7c5c7ee76bc13': No such file or directory
fatal: cannot change to '/tmp/tmp.ga29rjoTE8/w20': No such file or directory
fatal: cannot change to '/tmp/tmp.ga29rjoTE8/w20': No such file or directory
sed: can't read /tmp/tmp.ga29rjoTE8/w20/intentions/t-lock-steal.md: No such file or directory
FAIL: dead-holder steal (rc=99 elapsed=0s)
packages/intentionsutil/scripts/test-graph-commit.sh: line 650: cd: /tmp/tmp.ga29rjoTE8/w20: No such file or directory
```
(Identical failure signature to Iteration 1 — same run, same PR head `6ae814eccf79c202b43b2e1d81a8877b1f021799`; nothing has been pushed to the PR since Iteration 1, so CI has not re-run.)

**Why not caught:** Same environmental tmp-eviction symptom as Iteration 1. A subagent independently
re-reproduced `test-graph-commit.sh` 3/3 as PASS (68/68 each run, including "dead-holder steal"),
confirming no code defect. This PR's diff still does not touch `test-graph-commit.sh` or
`graph-commit`.

**Flake issue:** STALE-HEAD-SUPPRESSED

**Fingerprint:** `hook-tests — dead-holder steal`

`dispatch-flake-dedup-node` returned `NONE` again (no existing matching flake tactic — none was
created in Iteration 1 either, since it also resolved STALE-HEAD). The pre-filing
`dispatch-flake-stale-head-check` guard again found the reproduce command passes cleanly (68/68) at
a fresh `origin/main` checkout while the PR's actually-pushed head
(`6ae814eccf79c202b43b2e1d81a8877b1f021799`) is behind `origin/main` — explicit tool verdict: "stale
head, not a flake". No flake tactic node was written, the source tactic is not blocked on anything,
and the PR is not blocked. **Remedy (unchanged from Iteration 1, still not executed):** push a fresh
merge of `origin/main` into this PR branch and let CI re-run. This worktree's HEAD (`e4b9e3a8`) is
currently 7 commits ahead of `origin/main` — a router pre-spawn merge on top of Iteration 1's
"record fix attempt (no push)" commit — but per this skill's Flake-outcome contract, this pass
pushes nothing; the merge remains unpushed pending a future pass or human intervention. If this
recurs a third time, the fix-checks-attempt cap (3) will route this node to office-hours instead.

## Iteration 3

**Failed checks:** hook-tests

**Outcome:** flake

**Reproduced:** no

**Reproduce command:** `packages/intentionsutil/scripts/test-graph-commit.sh`

**Failure excerpt:**
```
PASS: lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle
fatal: failed to copy file to '/tmp/tmp.ga29rjoTE8/w20/.git/objects/92/ad9b83ab14779a54e3298474f7c5c7ee76bc13': No such file or directory
fatal: cannot change to '/tmp/tmp.ga29rjoTE8/w20': No such file or directory
fatal: cannot change to '/tmp/tmp.ga29rjoTE8/w20': No such file or directory
sed: can't read /tmp/tmp.ga29rjoTE8/w20/intentions/t-lock-steal.md: No such file or directory
FAIL: dead-holder steal (rc=99 elapsed=0s)
packages/intentionsutil/scripts/test-graph-commit.sh: line 650: cd: /tmp/tmp.ga29rjoTE8/w20: No such file or directory
```
(Identical failure signature to Iterations 1 and 2 — same CI run, same PR head `6ae814eccf79c202b43b2e1d81a8877b1f021799`; still nothing pushed to the PR since Iteration 1, so CI has not re-run.)

**Why not caught:** Same environmental tmp-eviction symptom as Iterations 1–2. A subagent
independently re-reproduced `test-graph-commit.sh` 3/3 as PASS (68/68 each run, including
"dead-holder steal"), confirming no code defect. This PR's diff still does not touch
`test-graph-commit.sh` or `graph-commit`.

**Flake issue:** STALE-HEAD-SUPPRESSED

**Fingerprint:** `hook-tests — dead-holder steal`

`dispatch-flake-dedup-node` returned `NONE` again. The pre-filing `dispatch-flake-stale-head-check`
guard again found the reproduce command passes cleanly (68/68) at a fresh `origin/main` checkout
while the PR's actually-pushed head (`6ae814eccf79c202b43b2e1d81a8877b1f021799`) is behind
`origin/main` — verdict "stale head, not a flake". No flake tactic node was written, the source
tactic is not blocked on anything, and the PR is not blocked. Near-miss advisory grep for
`Fingerprint: hook-tests — ` across `intentions/tactic-*.md` found no hit.

**This is the third occurrence of the attempt cap.** This pass spends the third fix-checks
attempt unit and applies the `dispatch:fix-checks-attempt-3` label. Per this skill's Stop-hook
contract, a re-derived `phase: qa` with the attempt counter at 3 routes this node to
`dispatch:office-hours` instead of self-closing.

**Root-cause note for the human reviewer, not actioned by this pass (the flake-outcome contract
forbids pushing here):** across all three iterations the actual blocker has never been the flake
itself — it's that nothing has ever been pushed to this PR since it was opened. Each router
pre-spawn merge of `origin/main` accumulates as an unpushed local commit in this worktree
(currently `HEAD` is `ff7b2e1d`, many commits ahead of the pushed head `6ae814e`, via three
successive unpushed merge commits `75b4a712`, `e4b9e3a8`, `ff7b2e1d`), and CI is therefore
re-observing the exact same completed run on every fix-checks tick rather than a fresh one. The
STALE-HEAD-SUPPRESSED disposition correctly avoids filing a bogus flake-tracking node for a
failure that would very likely just go away on a fresh CI run, but no path in this skill acts on
that finding by pushing the merge. A human (or a future skill revision) should either push the
already-merged `HEAD` (`git push origin HEAD` from this worktree) and let CI re-run before
deciding further, or treat this as a gap in the STALE-HEAD-SUPPRESSED handling worth a follow-up.

## How to resolve

Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR comments; folded into this hold's body when present) to diagnose why 3 automated attempts did not resolve CI. Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock tactic-qa-fix-node-terminal-declaration with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.

The `blocked_by` edge on `tactic-qa-fix-node-terminal-declaration` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.


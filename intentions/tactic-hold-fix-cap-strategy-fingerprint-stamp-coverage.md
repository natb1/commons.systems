---
id: tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage
kind: tactic
statement: "hold: fix-attempt-cap on
  `tactic-strategy-fingerprint-stamp-coverage` — a tracked hold blocking the
  source until the mechanical retry state is resolved"
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
  reason: "/fix-checks retry budget exhausted: 3 attempts concluded with PR #3023
    still red (execution.fix.attempt=4, since 2026-08-03) — the 3-attempt cap is
    exhausted."
  since: 2026-08-03
  recommendation: "Review the fix-checks accumulator (tmp/fix-checks-summary.md in
    the node's worktree, also posted in PR comments; folded into this hold's
    body when present) to diagnose why 3 automated attempts did not resolve CI.
    Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock
    tactic-strategy-fingerprint-stamp-coverage with a fresh retry budget
    (attempt was reset to 1), or abandon/redesign the tactic if the current
    approach cannot work."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-strategy-fingerprint-stamp-coverage
  hold_kind: fix-attempt-cap
---
# hold: fix-attempt-cap on tactic-strategy-fingerprint-stamp-coverage

## Context

`tactic-strategy-fingerprint-stamp-coverage` hit a mechanical retry state (`fix-attempt-cap`) on 2026-08-03. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage`) carries the park, and `tactic-strategy-fingerprint-stamp-coverage` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/fix-checks retry budget exhausted: 3 attempts concluded with PR #3023 still red (execution.fix.attempt=4, since 2026-08-03) — the 3-attempt cap is exhausted.

## Diagnosis

# Fix-checks summary — PR #3023

## Iteration 1

- **Failed checks:** hook-tests
- **Outcome:** flake
- **Reproduced:** no
- **Reproduce command:** `packages/intentionsutil/scripts/test-graph-commit.sh` (run from repo root)
- **Failure excerpt:**
  ```
  PASS: lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle
  fatal: failed to copy file to '/tmp/tmp.BHDhgdCMzA/w20/.git/objects/ac/893c50d3fec219527537a78df557dc15f03aa4': No such file or directory
  fatal: cannot change to '/tmp/tmp.BHDhgdCMzA/w20': No such file or directory
  fatal: cannot change to '/tmp/tmp.BHDhgdCMzA/w20': No such file or directory
  sed: can't read '/tmp/tmp.BHDhgdCMzA/w20/intentions/t-lock-steal.md': No such file or directory
  FAIL: dead-holder steal (rc=99 elapsed=0s)
  packages/intentionsutil/scripts/test-graph-commit.sh: line 620: cd: /tmp/tmp.BHDhgdCMzA/w20: No such file or directory
  passed: 62  failed: 1
  ##[error]Process completed with exit code 1.
  ```
- **Why not caught:** Case 30 ("dead-holder steal") in `test-graph-commit.sh` does a plain `git clone` into a fresh, run-unique tmp directory (`$WORK/w20`). The clone lost its destination mid-copy (ENOENT on an object file, then the directory itself vanished for later `cd`/`sed` calls) — consistent with CI-runner disk pressure or a tmp-eviction sweep, not test or application logic. No prior test case reuses or races against `w20`. 3/3 local runs of the full suite passed cleanly (63/63), including this exact case. This PR's diff does not touch `graph-commit` or its test suite (confirmed via `git diff origin/main...HEAD --stat`).
- **Flake issue:** STALE-HEAD-SUPPRESSED — no tactic node created. `dispatch-flake-dedup-node` returned `NONE` (no matching flake tactic), but the subsequent `dispatch-flake-stale-head-check` found the reproduce command passes cleanly against `origin/main` while the PR head (`46e95dcf`) is behind `origin/main` (by unrelated graph-node commits — `34e29bf7`, `a1c2f445`, `5ed34dac`, `0e80ccf9`, `649c1845`, `5d72144d` — none touching `graph-commit`/`test-graph-commit.sh`). Per the guard's design, this suppresses node creation. **Remedy: merge `origin/main` into the PR branch and re-run CI** — a merge commit (`39af0028`, the router's pre-spawn `dispatch-merge-main`) already exists locally in this worktree but has not yet been pushed.
- **Fingerprint:** hook-tests — dead-holder steal

## Iteration 2

- **Failed checks:** hook-tests
- **Outcome:** flake
- **Reproduced:** no
- **Reproduce command:** `packages/intentionsutil/scripts/test-graph-commit.sh` (run from repo root)
- **Failure excerpt:** same run as Iteration 1 — GitHub still reports the PR's CI status from run
  https://github.com/natb1/commons.systems/actions/runs/30860398668/job/91840890269 (head sha
  `46e95dcf`). No new push has occurred against this PR branch between Iteration 1 and this pass, so
  `/dispatch-propagate` re-selected the node while the underlying interrupt (`execution.fix`) was
  still active and CI was still red on the same unchanged sha.
- **Why not caught:** Re-verified the Iteration 1 diagnosis rather than re-deriving it. 2/2 fresh
  local runs of the full `test-graph-commit.sh` suite at current worktree HEAD (`ab6fa49f`, now well
  ahead of both the failing run's sha and origin/main-at-failure-time) passed cleanly (63/63
  including "dead-holder steal" specifically, 0s lock-steal timing both times); disk healthy (314G
  free, 68% used, no pressure). Re-ran the authoritative guards fresh: `dispatch-flake-dedup-node`
  against the same fingerprint returned `NONE` (still no matching flake tactic — Iteration 1 never
  created one), then `dispatch-flake-stale-head-check --head-ref 46e95dcf... --reproduce-cmd
  packages/intentionsutil/scripts/test-graph-commit.sh` confirmed the suite passes cleanly (63/63)
  at `origin/main` while the PR head `46e95dcf` is behind it — `STALE-HEAD`, same disposition as
  Iteration 1. Per the skill's flake-outcome rule, this pushes nothing regardless of the standing
  local merge; the merge+push remedy is left for a subsequent pass or the 3-attempt escalation to
  act on, not this worker unilaterally.
- **Flake issue:** STALE-HEAD-SUPPRESSED — no tactic node created (unchanged from Iteration 1).
  **Remedy (still outstanding): merge `origin/main` into the PR branch and re-run CI.** A merge
  commit already exists locally in this worktree (several, in fact — HEAD is 16 commits ahead of
  `origin/main`, none touching this PR's own files) but has not yet been pushed. If a third
  iteration reaches this same STALE-HEAD-SUPPRESSED disposition on this unchanged sha, the
  fix-checks-attempt counter will hit the 3-attempt cap and the selector will land a tracked hold
  instead of a fourth retry.
- **Fingerprint:** hook-tests — dead-holder steal

## Iteration 3

- **Failed checks:** hook-tests
- **Outcome:** flake
- **Reproduced:** no
- **Reproduce command:** `packages/intentionsutil/scripts/test-graph-commit.sh` (run from repo root)
- **Failure excerpt:** same run as Iterations 1 and 2 — GitHub still reports the PR's CI status from
  run https://github.com/natb1/commons.systems/actions/runs/30860398668/job/91840890269 (head sha
  `46e95dcf`). No new push has occurred against this PR branch since Iteration 1.
- **Why not caught:** Re-verified the prior diagnosis. 1/1 fresh local run of the full
  `test-graph-commit.sh` suite at current worktree HEAD (`8eff1f0e`, a merge of `origin/main` already
  applied locally but not yet pushed) passed cleanly (63/63, including "dead-holder steal"); disk
  healthy (314G free, 68% used, no pressure). Re-ran the authoritative guards fresh:
  `dispatch-flake-dedup-node` against the same fingerprint returned `NONE` (still no matching flake
  tactic), then `dispatch-flake-stale-head-check --head-ref 46e95dcf... --reproduce-cmd
  packages/intentionsutil/scripts/test-graph-commit.sh` confirmed the suite passes cleanly (63/63) at
  `origin/main` while the PR head `46e95dcf` is still behind it — `STALE-HEAD`, same disposition as
  Iterations 1 and 2. Per the skill's flake-outcome rule this pushes nothing; per the skill's own
  design note this third consecutive occurrence is expected to trip the fix-checks-attempt cap so the
  selector lands a tracked hold rather than retrying a fourth time on this unchanged sha.
- **Flake issue:** STALE-HEAD-SUPPRESSED — no tactic node created (unchanged from Iterations 1-2).
  **Remedy (still outstanding, now for the selector/a human to act on): merge `origin/main` into the
  PR branch and push.** The merge is already sitting in this worktree's local HEAD (`8eff1f0e`,
  0 commits behind `origin/main`) but this worker does not push it unilaterally under the flake
  outcome's push-nothing rule.
- **Fingerprint:** hook-tests — dead-holder steal

## How to resolve

Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR comments; folded into this hold's body when present) to diagnose why 3 automated attempts did not resolve CI. Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock tactic-strategy-fingerprint-stamp-coverage with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.

The `blocked_by` edge on `tactic-strategy-fingerprint-stamp-coverage` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.


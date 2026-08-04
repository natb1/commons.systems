---
id: tactic-hold-fix-cap-review-skill-body-decomposition
kind: tactic
statement: "hold: fix-attempt-cap on `tactic-review-skill-body-decomposition` —
  a tracked hold blocking the source until the mechanical retry state is
  resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-token-economy
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
  reason: "/fix-checks retry budget exhausted: 3 attempts concluded with PR #3025
    still red (execution.fix.attempt=4, since 2026-08-03) — the 3-attempt cap is
    exhausted."
  since: 2026-08-04
  recommendation: "Review the fix-checks accumulator (tmp/fix-checks-summary.md in
    the node's worktree, also posted in PR comments; folded into this hold's
    body when present) to diagnose why 3 automated attempts did not resolve CI.
    Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock
    tactic-review-skill-body-decomposition with a fresh retry budget (attempt
    was reset to 1), or abandon/redesign the tactic if the current approach
    cannot work."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-review-skill-body-decomposition
  hold_kind: fix-attempt-cap
---
# hold: fix-attempt-cap on tactic-review-skill-body-decomposition

## Context

`tactic-review-skill-body-decomposition` hit a mechanical retry state (`fix-attempt-cap`) on 2026-08-04. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-fix-cap-review-skill-body-decomposition`) carries the park, and `tactic-review-skill-body-decomposition` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/fix-checks retry budget exhausted: 3 attempts concluded with PR #3025 still red (execution.fix.attempt=4, since 2026-08-03) — the 3-attempt cap is exhausted.

## Diagnosis

# Fix-checks summary — PR #3025

## Iteration 1

- **Failed checks**: `hook-tests`
- **Outcome**: flake
- **Reproduced**: no
- **Reproduce command**: `packages/intentionsutil/scripts/test-graph-commit.sh`
- **Failure excerpt**:
  ```
  PASS: lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle
  fatal: failed to copy file to '/tmp/tmp.jX7kkh2AMr/w20/.git/objects/6d/7f09b89ca3b95ef917cfaa854986c5c72e1311': No such file or directory
  fatal: cannot change to '/tmp/tmp.jX7kkh2AMr/w20': No such file or directory
  sed: can't read /tmp/tmp.jX7kkh2AMr/w20/intentions/t-lock-steal.md: No such file or directory
  FAIL: dead-holder steal (rc=99 elapsed=0s)
  passed: 62  failed: 1
  ```
- **Why not caught**: This PR's diff touches only `dispatch-propagate`/`review-fix`
  files, none under `packages/intentionsutil/scripts/`. `test-graph-commit.sh`
  and `graph-commit` are unmodified by this PR and unchanged relative to
  `origin/main` (byte-identical diff). Ran the full suite locally 6x — all 63
  cases passed each time, including "dead-holder steal". The CI signature (git
  clone failing mid-copy on a specific loose object, "No such file or
  directory") is consistent with a narrow filesystem/timing race around case
  30's fresh clone of `W20`, exposed only under CI's slower/more contended I/O.
  A trap-inheritance race in case 29's backgrounded writers was investigated
  and ruled out empirically (EXIT trap confirmed to fire exactly once, at the
  real top-level script's own exit).
- **Flake issue**: `STALE-HEAD-SUPPRESSED` — `dispatch-flake-stale-head-check`
  found `test-graph-commit.sh` passes at `origin/main` while the PR head
  (`e39086a8b85f2c290d1b8bce6a4095e1b36f23fb`) is not a descendant of
  `origin/main`'s tip, so no flake-tracking node was created. Note: the
  `packages/intentionsutil/scripts/` tree is byte-identical between the PR
  head and `origin/main` — the STALE-HEAD verdict here most likely reflects
  the test's own low, non-deterministic failure rate (0/6 locally, 0/1 at the
  origin/main probe) rather than an actual missing fix, but the guard's
  behavioral design has no way to distinguish that from a real fix, so its
  disposition is followed as designed. Remedy per the guard: merge
  `origin/main` into the PR branch and re-run CI.
- **Fingerprint**: `hook-tests — dead-holder steal`

## Iteration 2

- **Failed checks**: `hook-tests`
- **Outcome**: flake
- **Reproduced**: no
- **Reproduce command**: `packages/intentionsutil/scripts/test-graph-commit.sh`
- **Failure excerpt**:
  ```
  PASS: lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle
  fatal: failed to copy file to '/tmp/tmp.jX7kkh2AMr/w20/.git/objects/6d/7f09b89ca3b95ef917cfaa854986c5c72e1311': No such file or directory
  fatal: cannot change to '/tmp/tmp.jX7kkh2AMr/w20': No such file or directory
  sed: can't read /tmp/tmp.jX7kkh2AMr/w20/intentions/t-lock-steal.md: No such file or directory
  FAIL: dead-holder steal (rc=99 elapsed=0s)
  passed: 62  failed: 1
  ```
  (Same case, same error shape as Iteration 1 — only the tmp dir name and
  timestamp differ.)
- **Why not caught**: Identical diagnosis to Iteration 1, re-verified this
  iteration by a fresh subagent: `test-graph-commit.sh` and `graph-commit`
  remain byte-identical to `origin/main`; this PR's diff (`git diff
  origin/main...HEAD --stat`) still touches only
  `.claude/skills/review-fix/`, `.claude/workflows/review-fix.js`, and
  `.claude/skills/dispatch-propagate/scripts/{dispatch-pack-scalars,
  dispatch-review-codeql,dispatch-review-npm-audit,test-*}` — nothing under
  `packages/intentionsutil/scripts/`. Ran the suite locally 4x this
  iteration (10/10 combined across both iterations) — all passed, including
  "dead-holder steal". Consistent with a CI-only filesystem/timing race on a
  fresh git clone under I/O contention, not a code defect.
- **Flake issue**: `STALE-HEAD-SUPPRESSED` — `dispatch-flake-stale-head-check`
  again found `test-graph-commit.sh` passes cleanly at `origin/main` (63/63)
  while the PR's actual GitHub head (`e39086a8b85f2c290d1b8bce6a4095e1b36f23fb`,
  unchanged since Iteration 1 — no push has landed on this PR since) is not a
  descendant of `origin/main`'s tip, so no flake-tracking node was created
  and the PR was not blocked. Note: this worktree's local branch has since
  locally merged a newer `origin/main` (commit `f046e211`, 22 commits ahead
  of the pushed PR head) via unrelated router/graph-tick activity in this
  shared worktree, but that merge has **not** been pushed to the PR — GitHub
  still shows `e39086a8` as the head, so CI keeps re-running against the
  stale, unmerged state. Per the skill's flake NONE+STALE-HEAD branch this
  outcome pushes nothing (identical rule to generic no-repro), even though
  the practical remedy (push the merge) is sitting unpushed in this very
  worktree — the guard's disposition is followed as designed, same call made
  in Iteration 1 for the same reason: it cannot distinguish "the head is
  missing a real fix" from "this is the test's own low, non-deterministic
  failure rate and the one-shot origin/main probe happened to pass". Remedy
  per the guard, restated: merge `origin/main` into the PR branch and re-run
  CI (i.e., push the local merge commit already present in this worktree).
- **Fingerprint**: `hook-tests — dead-holder steal`

## Iteration 3

- **Failed checks**: `hook-tests`
- **Outcome**: flake
- **Reproduced**: no
- **Reproduce command**: `packages/intentionsutil/scripts/test-graph-commit.sh`
- **Failure excerpt**:
  ```
  PASS: lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle
  fatal: failed to copy file to '/tmp/tmp.jX7kkh2AMr/w20/.git/objects/6d/7f09b89ca3b95ef917cfaa854986c5c72e1311': No such file or directory
  fatal: cannot change to '/tmp/tmp.jX7kkh2AMr/w20': No such file or directory
  sed: can't read /tmp/tmp.jX7kkh2AMr/w20/intentions/t-lock-steal.md: No such file or directory
  FAIL: dead-holder steal (rc=99 elapsed=0s)
  passed: 62  failed: 1
  ```
  (Same case, same error shape as Iterations 1–2 — the PR head has not moved
  since Iteration 1, so this is CI's already-completed verdict against the
  identical commit being re-diagnosed, not a fresh independent run.)
- **Why not caught**: Re-verified this iteration by a fresh subagent, which
  traced the failure to `make_clone`'s `git clone` call
  (`test-graph-commit.sh:286-290`) — the ENOENT occurs inside git's own
  object-copy step during a fresh clone under
  `/tmp/tmp.jX7kkh2AMr/w20`, before the lock-steal/expiry logic case 30
  actually exercises ever runs. No fixed sleep, background-process race, or
  lock-timing assumption in the case's own design could plausibly produce
  this symptom — it reads as filesystem/tmp-provisioning contention on the
  CI runner. `packages/intentionsutil/` remains byte-identical between the
  PR head and `origin/main` (`git diff origin/main HEAD --
  packages/intentionsutil/` empty); this PR's diff still touches only
  `.claude/skills/review-fix/`, `.claude/workflows/review-fix.js`, and
  `.claude/skills/dispatch-propagate/scripts/{dispatch-pack-scalars,
  dispatch-review-codeql,dispatch-review-npm-audit,test-*}`. Ran the suite
  locally 3x this iteration (0/13 combined across all three iterations,
  including "dead-holder steal" every time).
- **Flake issue**: `STALE-HEAD-SUPPRESSED` — `dispatch-flake-stale-head-check`
  again found `test-graph-commit.sh` passes cleanly at `origin/main` (63/63)
  while the PR's actual GitHub head (`e39086a8b85f2c290d1b8bce6a4095e1b36f23fb`,
  still unchanged since Iteration 1) is not a descendant of `origin/main`'s
  tip — stale head, not a flake. No flake-tracking node created; the PR was
  not blocked. Same catch-22 as Iterations 1–2: this worktree's local branch
  has continued to accumulate merges of `origin/main` (now 23 commits ahead,
  local branch merged through commit `d0f8ef12`) via unrelated router/
  graph-tick activity in this shared worktree, none of it pushed to the PR —
  GitHub still shows `e39086a8` as the head, so CI keeps re-running (or
  rather, being re-diagnosed without a fresh run) against the same stale,
  unmerged state. Per the skill's flake NONE+STALE-HEAD branch this outcome
  pushes nothing — the guard's disposition is followed as designed for the
  third consecutive time, same reasoning as Iterations 1–2: it cannot
  distinguish "the head is missing a real fix" from "this is the test's own
  low, non-deterministic failure rate and the one-shot origin/main probe
  happened to pass". This iteration's attempt spend trips the node's
  3-attempt cap (`dispatch:fix-checks-attempt-3` label applied) — per the
  skill, the selector is expected to land a tracked hold on this node on a
  later tick rather than re-invoking `/fix-checks` again for the same
  unproductive STALE-HEAD loop. Remedy per the guard, restated: merge
  `origin/main` into the PR branch and re-run CI (i.e., push the local merge
  commit already present in this worktree) — this is exactly the action a
  human or a hold-triggered follow-up should take to break the loop.
- **Fingerprint**: `hook-tests — dead-holder steal`

## How to resolve

Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR comments; folded into this hold's body when present) to diagnose why 3 automated attempts did not resolve CI. Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock tactic-review-skill-body-decomposition with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.

The `blocked_by` edge on `tactic-review-skill-body-decomposition` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.


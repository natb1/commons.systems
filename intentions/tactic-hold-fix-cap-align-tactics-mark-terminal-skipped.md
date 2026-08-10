---
id: tactic-hold-fix-cap-align-tactics-mark-terminal-skipped
kind: tactic
statement: "hold: fix-attempt-cap on
  `tactic-align-tactics-mark-terminal-skipped` — a tracked hold blocking the
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
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-align-tactics-mark-terminal-skipped
  hold_kind: fix-attempt-cap
---
# hold: fix-attempt-cap on tactic-align-tactics-mark-terminal-skipped

## Context

`tactic-align-tactics-mark-terminal-skipped` hit a mechanical retry state (`fix-attempt-cap`) on 2026-08-05. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-fix-cap-align-tactics-mark-terminal-skipped`) carries the park, and `tactic-align-tactics-mark-terminal-skipped` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/fix-checks retry budget exhausted: 3 attempts concluded with PR #3047 still red (execution.fix.attempt=4, since 2026-08-05) — the 3-attempt cap is exhausted.

## Diagnosis

# Fix-checks summary — PR #3047

## Iteration 1

**Failed checks**: unit-tests

**Outcome**: fixed

**Reproduced**: yes

**Reproduce command**: `bash .claude/skills/dispatch-propagate/scripts/test-decision-log-isolation.sh`

**Failure excerpt**:
```
FAIL: test-dispatch-terminal-gap-audit.sh is not isolated and not in KNOWN_UNISOLATED
    add the file to KNOWN_UNISOLATED only if it provably cannot reach lib-decision-log.sh;
    otherwise source dispatch-test-fixture.sh or test-helpers.sh.
Results: 189/190 passed, 1 failed
FAIL: test-decision-log-isolation.sh
```

**Why not caught**: This PR's Unit 3 added a new script under test
(`dispatch-terminal-gap-audit`) and its test file
(`test-dispatch-terminal-gap-audit.sh`), but never registered the new test in
the decision-log isolation ratchet's static `KNOWN_UNISOLATED` allowlist in
`test-decision-log-isolation.sh`. The new test file uses its own inline
PASS/FAIL/TOTAL helpers rather than sourcing `test-helpers.sh` /
`dispatch-test-fixture.sh`, so the ratchet's static scan flagged it as
unisolated-and-unlisted — exactly the ratchet doing its job on a net-new file
that was never fed through it.

**Fix**: Added `test-dispatch-terminal-gap-audit.sh` to the `KNOWN_UNISOLATED`
array in `.claude/skills/dispatch-propagate/scripts/test-decision-log-isolation.sh`
(alphabetically between `test-dispatch-heal-units.sh` and
`test-graph-write-rollback.sh`). Verified `dispatch-terminal-gap-audit`'s only
subprocess call is `npx tsx packages/intentionsutil/scripts/office-hours-select.ts
--list --ref "$REF"`, and that script never references
`decision-log`/`DECISION_LOG`; the `claude`/`clear-park`/`park-node` mentions in
the audit script are plain advisory echo strings, never invoked. The test file is
also hermetic by construction (stubs npx/claude/clear-park/park-node on PATH,
uses a scratch git repo), so this suite provably cannot reach
`lib-decision-log.sh` — the correct fix per the ratchet's own comment is
`KNOWN_UNISOLATED`, not sourcing a harness. Local re-run:
`Results: 193/193 passed, 0 failed`. Commit: be78caad.

## Iteration 2

**Failed checks**: acceptance

**Outcome**: flake

**Reproduced**: no

**Reproduce command**: `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh office-hours`

**Failure excerpt**:
```
playwright_install_with_deps: attempt 1/2 failed or timed out after 300s
wait_for_dpkg_lock: /var/lib/dpkg/lock-frontend still held after 30s; retrying anyway
playwright_install_with_deps: attempt 2/2
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3076 (apt-get)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?
Failed to install browsers
Error: Installation process exited with code: 100
playwright_install_with_deps: failed after 2 attempts
FAIL: office-hours
```

**Why not caught**: CI-runner `dpkg`/`apt-get` lock contention during Playwright
browser dependency installation in the `acceptance` check — another process held
`/var/lib/dpkg/lock-frontend` through both install attempts and the post-failure
wait. Confirmed via `git diff origin/main...HEAD --stat` that this PR's diff never
touches the acceptance workflow or `lib.sh`'s `playwright_install_with_deps` /
`wait_for_dpkg_lock` helpers — the failure is unrelated to this PR's own changes,
a runner-resource-contention flake.

**Flake issue**: STALE-HEAD-SUPPRESSED

**Fingerprint**: acceptance — acceptance

**Note**: `dispatch-flake-stale-head-check` found the reproduce command
(`run-acceptance-tests.sh office-hours`) passes cleanly against a fresh
`origin/main` checkout — 18/18 acceptance tests green, no dpkg-lock contention.
The PR's currently-pushed head (`755b5b1474eecf111b690aa5fa024a44bd5a0f70`) is
behind `origin/main` (this worktree already carries an unpushed local merge of
`origin/main`, commit `c7b3dbd0`). Per the STALE-HEAD-SUPPRESSED contract: no
flake tactic was created, the source tactic's `blocked_by` was left untouched,
and nothing was pushed this iteration. Remedy: merge `origin/main` into the PR
branch and re-run CI — the head is simply missing a fix (or simply avoiding
whatever runner-level contention window) that already resolves cleanly on main.

## Iteration 3

**Failed checks**: acceptance

**Outcome**: flake

**Reproduced**: no

**Reproduce command**: `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh office-hours`

**Failure excerpt**:
```
playwright_install_with_deps: attempt 1/2 failed or timed out after 300s
wait_for_dpkg_lock: /var/lib/dpkg/lock-frontend still held after 30s; retrying anyway
playwright_install_with_deps: attempt 2/2
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3076 (apt-get)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?
Failed to install browsers
Error: Installation process exited with code: 100
playwright_install_with_deps: failed after 2 attempts
FAIL: office-hours
```

**Why not caught**: This is the identical CI-runner dpkg/apt lock-contention
signature from Iteration 2, on the **same** GitHub Actions run
(`runs/30974407562`) — nothing has been pushed to the PR branch since Iteration
2's STALE-HEAD-SUPPRESSED disposition, so the PR's pushed head
(`755b5b1474eecf111b690aa5fa024a44bd5a0f70`) is still behind `origin/main` and
the check is still red. A subagent re-ran the reproduce command locally at this
worktree's current HEAD (`4c1a97fb`, which has `origin/main` merged in) and it
passed 18/18. `dispatch-flake-dedup-node "acceptance — acceptance"` returned
`NONE` (no tracking tactic exists — none was ever created, per Iteration 2's
STALE-HEAD-SUPPRESSED contract). The near-miss advisory grep for
`Fingerprint: acceptance — ` across `intentions/tactic-*.md` found no hits.
`dispatch-flake-stale-head-check` re-confirmed `STALE-HEAD`: the reproduce
command passes at `origin/main` but the pushed head is behind it.

**Flake issue**: STALE-HEAD-SUPPRESSED

**Fingerprint**: acceptance — acceptance

**Note**: Same disposition as Iteration 2, for the same underlying reason —
this worker never pushes on a STALE-HEAD-SUPPRESSED outcome, so the recurring
flake cannot self-resolve until something pushes the already-merged
`origin/main` content to the PR branch. This iteration brings the
`dispatch:fix-checks-attempt` counter to 3 (the cap); per `/fix-checks`' Node-lane
completion seam, a fourth recurrence will not spend a further retry — the
selector will land a tracked hold (`hold-node`) instead of re-invoking
`/fix-checks`. **Recommended remedy for whoever reviews the hold:** push this
worktree's already-present merge of `origin/main` (local HEAD `4c1a97fb`, 18
commits ahead of the PR's pushed head) to the `tactic-align-tactics-mark-terminal-skipped`
branch and let CI re-run — the acceptance suite passes cleanly once the runner
avoids the dpkg lock window, which the pushed head has not had a chance to
retry since Iteration 1's fix landed.

## Iteration 4

**Failed checks**: acceptance

**Outcome**: flake

**Reproduced**: no

**Reproduce command**: `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh office-hours`

**Failure excerpt**:
```
playwright_install_with_deps: attempt 1/2 failed or timed out after 300s
wait_for_dpkg_lock: /var/lib/dpkg/lock-frontend still held after 30s; retrying anyway
playwright_install_with_deps: attempt 2/2
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3076 (apt-get)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?
Failed to install browsers
Error: Installation process exited with code: 100
playwright_install_with_deps: failed after 2 attempts
FAIL: office-hours
```

**Why not caught**: Identical CI-runner dpkg/apt-get lock-contention signature
from Iterations 2 and 3, on the **same** GitHub Actions run (`runs/30974407562`)
— still nothing has been pushed to the PR branch since Iteration 1's fix, so the
pushed head (`755b5b1474eecf111b690aa5fa024a44bd5a0f70`) remains stale relative
to `origin/main` and the check is still red. A subagent re-verified end-to-end:
confirmed via `git diff origin/main...HEAD --stat` the PR's diff still never
touches the acceptance workflow or `lib.sh`'s Playwright-install helpers; reran
the reproduce command locally — 18/18 passed. `dispatch-flake-dedup-node
"acceptance — acceptance"` returned `NONE` (still no tracking tactic — none was
ever created, per Iterations 2–3's STALE-HEAD-SUPPRESSED contract).
`dispatch-flake-stale-head-check` re-confirmed `STALE-HEAD`: the reproduce
command passes cleanly at `origin/main` (18/18) but the pushed head is behind
it. Local worktree state: clean, `HEAD` at `f24d9f63` (19 commits ahead / 15
behind `origin/main` per `rev-list --left-right --count` — origin/main has
moved further since Iteration 3), pushed remote head still
`755b5b1474eecf111b690aa5fa024a44bd5a0f70`, unchanged since Iteration 1.

**Flake issue**: STALE-HEAD-SUPPRESSED

**Fingerprint**: acceptance — acceptance

**Note**: Fourth consecutive identical STALE-HEAD-SUPPRESSED disposition for
this PR. `execution.fix.attempt` on the graph node was already at 3 (the cap)
entering this iteration; this iteration's completion spends one more attempt
unit per the node-lane completion seam (retry-by-design), which the selector
reads on its next tick. Per `/fix-checks`' node-lane completion seam, this
worker does not push and does not self-resolve the interrupt — resolving the
interrupt is the selector's job once CI goes green on a pushed sha, and no sha
has been pushed since Iteration 1. **This loop cannot self-resolve without an
out-of-band push**: the fix (Iteration 1's `be78caad`) is long since landed and
verified; every subsequent iteration has been re-diagnosing the same stale-head
non-issue. Recommended action for the office-hours hold this iteration is
expected to trigger: push this worktree's already-present merge of
`origin/main` (local HEAD `f24d9f63`) to the
`tactic-align-tactics-mark-terminal-skipped` branch and let CI re-run against a
current head.

## How to resolve

Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR comments; folded into this hold's body when present) to diagnose why 3 automated attempts did not resolve CI. Resolve THIS HOLD TACTIC (phase: done, then prune) to unblock tactic-align-tactics-mark-terminal-skipped with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.

The `blocked_by` edge on `tactic-align-tactics-mark-terminal-skipped` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.


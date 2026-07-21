---
id: tactic-flake-unit-tests-select-tick
kind: tactic
statement: Fix the flaky dispatch-select-tick lock-fixture test in
  test-dispatch-scripts.sh causing the unit-tests CI job's pr-scripts suite to
  intermittently fail
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "tactic-flake-unit-tests-select-tick duplicates work already shipped in
    an open sibling PR: #2933 (branch tactic-flake-hook-tests-select-tick)
    guards every out=$(run_sel_tick ...) / out=$(run_tick ...) call site in
    .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh against
    the exact same set -e crash this tactic targets, and additionally covers the
    dispatch-tick section's run_tick site, which this tactic's own scope did not
    include. This tactic's own branch (tactic-flake-unit-tests-select-tick)
    already carries an equivalent 44-site fix at commit 20600969, pushed to
    origin, but opening a second PR here would conflict with and duplicate
    #2933's diff on the same file/lines."
  since: 2026-07-21
  recommendation: >-
    # Recommended next steps


    - **If PR #2933 merges cleanly**: this tactic node is redundant. Do not open
    a
      PR from branch `tactic-flake-unit-tests-select-tick` — its 44-site fix is a
      strict subset of #2933's 45-site fix (identical guard pattern, same file,
      same lines, minus #2933's extra `dispatch-tick` `run_tick` site). Close this
      tactic without a PR once #2933 lands, and delete the now-unused
      `tactic-flake-unit-tests-select-tick` branch.

    - **If PR #2933 is closed/rejected instead** (e.g. review finds a problem
    with
      its approach): resume this tactic by opening a draft PR directly from the
      already-pushed branch `tactic-flake-unit-tests-select-tick` (commit
      `20600969`, verified locally: 175/175 assertions passing in an isolated
      run of the `dispatch-select-tick` test section). Since this is a graph-native
      tactic with no backing GitHub issue, use `gh pr create --draft` directly
      (no `Closes #N` line — there is no issue to close). Also check whether
      #2933's extra `run_tick` fix (the one site this tactic's scope excluded)
      should be folded in at that point, since it fixes the same root cause.

    - Root cause for context: `test-dispatch-scripts.sh` runs under
      `set -euo pipefail`; the `dispatch-select-tick` test section's
      `out=$(run_sel_tick ...)` call sites had no guard, so any transient nonzero
      exit from `dispatch-select-tick` (plausible under real CI resource
      pressure) tripped `errexit` and crashed the entire 30944-line test file
      immediately, before any `assert_eq` ran — confirmed by pulling the actual
      failing CI run's raw log (`gh run view --job 88729272080 --log`), which
      showed the crash 112ms after the test's own echo line with zero PASS/FAIL
      output.
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the flaky dispatch-select-tick lock-fixture test in test-dispatch-scripts.sh causing the unit-tests CI job's pr-scripts suite to intermittently fail

Fingerprint: unit-tests — .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:21476

Reproduce command: `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts`
(the `unit-tests` CI job's "Run unit tests" step runs the full pr-scripts loop,
which iterates `test-*.sh` including test-dispatch-scripts.sh).

Failure excerpt (CI, PR #2931, run 29858634211, job 88729272028):
```
=== dispatch-select-tick ===
Test: select-tick empty queue → empty, lock released
FAIL: test-dispatch-scripts.sh
...
Failed suites: pr-scripts
##[error]Process completed with exit code 1.
```

Diagnosis: same underlying flaky fixture as the hook-tests failure — the
lock-based dispatch-select-tick section of test-dispatch-scripts.sh, run here
via run-unit-tests.sh's pr-scripts loop rather than directly. PR #2931's only
change to test-dispatch-scripts.sh is an 18-line insertion at line ~23930+,
well after the dispatch-select-tick section (starts at line 21116) — confirmed
via `git diff origin/main...HEAD`. A local full-suite reproduction
hung/failed non-deterministically at a different section on a separate run,
consistent with a timing-sensitive fixture rather than a regression from this
branch's diff.

recurred on PR #2931 / run https://github.com/natb1/commons.systems/actions/runs/29858634211/job/88729272028

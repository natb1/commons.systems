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
office_hours: null
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

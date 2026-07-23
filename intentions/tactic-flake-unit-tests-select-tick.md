---
id: tactic-flake-unit-tests-select-tick
kind: tactic
statement: Fix the flaky dispatch-select-tick lock-fixture test in
  test-dispatch-scripts.sh causing the unit-tests CI job's pr-scripts suite to
  intermittently fail
owner: ai
status: codified
parent: null
rationale: "Closed as a duplicate of PR #2933 (sibling tactic
  tactic-flake-hook-tests-select-tick). Both the unit-tests and hook-tests CI
  jobs execute the SAME file,
  .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh (hook-tests
  runs it directly; unit-tests runs it via run-unit-tests.sh's --pr-scripts
  test-*.sh loop). The set -e crash lives in that file, not in either job's
  wrapper, so #2933's fix to the file's run_sel_tick/run_tick call sites
  resolves both jobs' flake at once. #2933's diff is a strict superset of this
  tactic's scope (its 45 guarded sites include all 44 of this tactic's plus the
  dispatch-tick run_tick site). This tactic's own branch carried an equivalent
  44-site fix at commit 20600969 but it adds no coverage #2933 lacks, so no PR
  was opened. Root cause confirmed via the failing run's raw log (gh run view
  --job 88729272080 --log): crash 112ms after the test's echo line with zero
  PASS/FAIL output."
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
  reason: origin/main does not merge clean into this tactic's branch (provision
    exit 11)
  since: 2026-07-23
  recommendation: Resolve the conflict by hand in the node worktree and re-run the
    phase, or route to /dispatch-conflict once it accepts node targets.
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

## Integrity reset (2026-07-23)

Reset `phase: done` → `implement` by the 2026-07-23 /align-strategy round (census hold 2): the node was falsely done — no merged work anywhere; claimed substitute PR #2933 is an open draft and the guard is absent from main. Same remedy and precedent as tactic-main-red-sync-completion-test's reset. PR #2933 remains the candidate carrier: land it or re-derive; do not prune this node while the flake guard is absent from main.

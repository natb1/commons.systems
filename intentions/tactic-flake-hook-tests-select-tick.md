---
id: tactic-flake-hook-tests-select-tick
kind: tactic
statement: Fix the flaky dispatch-select-tick lock-fixture test in
  test-dispatch-scripts.sh causing the hook-tests CI job to intermittently fail
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
execution:
  branch: tactic-flake-hook-tests-select-tick
  pr: 2933
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix:
    since: 2026-07-22
    attempt: 1
    pushed_sha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the flaky dispatch-select-tick lock-fixture test in test-dispatch-scripts.sh causing the hook-tests CI job to intermittently fail

Fingerprint: hook-tests — .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:21476

Reproduce command: `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
(the `hook-tests` CI job's "Run dispatch script tests" step invokes this file
directly).

Failure excerpt (CI, PR #2931, run 29858634211, job 88729272080):
```
=== dispatch-select-tick ===
Test: select-tick empty queue → empty, lock released
##[error]Process completed with exit code 2.
```

Diagnosis: pre-existing flaky fixture in the lock-based dispatch-select-tick
test section of test-dispatch-scripts.sh (real dispatch-acquire-lock against a
real lock file, PATH-shimmed git, single-shot `DISPATCH_LOCK_WAIT_TIMEOUT=0`).
PR #2931's own diff to this file is an 18-line insertion at line ~23930+, well
after the dispatch-select-tick section (starts at line 21116) — confirmed via
`git diff origin/main...HEAD -- .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.
A local full-suite reproduction hung/failed non-deterministically at a
different section (dispatch-schedule-convergence-reseed) on a separate run,
consistent with a timing-sensitive fixture rather than a regression introduced
by any particular branch's diff.

recurred on PR #2931 / run https://github.com/natb1/commons.systems/actions/runs/29858634211/job/88729272080

recurred on PR #2918 / run https://github.com/natb1/commons.systems/actions/runs/29856546467/job/88722182155

Local reproduction attempt (PR #2918): full `test-dispatch-scripts.sh` run
(3006/3006 tests) passes cleanly, including this exact section — consistent
with the already-diagnosed timing-sensitive lock fixture, not a regression
from PR #2918's diff (`graph-select-target`'s `--standalone` mode and its own
new test section, inserted well after this crash site at line ~30943 and
never touching it).

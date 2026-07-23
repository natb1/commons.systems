---
id: tactic-flake-pid-cleanup-stale-worktree
kind: tactic
statement: Fix the timing-sensitive cleanup_stale_worktree_processes test group
  in test-pid-cleanup.sh causing the unit-tests CI job's pr-scripts suite to
  intermittently fail
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
phase: review
execution:
  branch: tactic-flake-pid-cleanup-stale-worktree
  pr: 2940
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the timing-sensitive cleanup_stale_worktree_processes test group in test-pid-cleanup.sh causing the unit-tests CI job's pr-scripts suite to intermittently fail

Fingerprint: unit-tests — .claude/skills/dispatch-propagate/scripts/test-pid-cleanup.sh:179

Reproduce command: `bash .claude/skills/dispatch-propagate/scripts/test-pid-cleanup.sh` (run repeatedly from the worktree root; did not reproduce in 10/10 local runs, 5 sandboxed + 5 with sandbox disabled)

Failure excerpt (CI, PR #2937, run 29957432923, job 89049922439):
```
=== Test: cleanup_stale_worktree_processes kills stale, keeps active ===
  PASS: cleanup keeps active worktree process alive
  FAIL: cleanup left stale worktree process alive

=== Test: cleanup_stale_worktree_processes prunes before listing ===
  FAIL: cleanup_stale_worktree_processes left fixture alive (prune-before-list not working)

=== Test: cleanup_stale_worktree_processes kills child processes ===
  FAIL: cleanup did not kill fixture parent 73029

  Results: 7 passed, 3 failed
FAIL: test-pid-cleanup.sh
```

Diagnosis: `cleanup_stale_worktree_processes`'s test harness relies on fixed
short sleeps (0.3-0.5s) between spawning background fixture processes and
scanning for them via repo-wide `ps -axo pid=,args=` / `ps -axo pid=,ppid=`
snapshots, plus real `fork()`/`exec()` completion timing for the child-process
test. Under a loaded/throttled shared CI runner this window can be too short,
causing the fixture process (or its forked child) to not yet be visible when
the function's `ps` scan runs. The lower-level `kill_tree`/`kill_worktree_processes`
tests (no extra `git worktree` + repo-wide-scan layer) passed both in CI and
locally, consistent with the extra scan/sleep layer being the fragile part.
Confirmed unrelated to PR #2937's own diff (a `fix-conflicts` → `dispatch-conflict`
skill rename): `lib.sh` and `test-pid-cleanup.sh` are byte-identical to
`origin/main` in that branch's diff.

recurred on PR #2937 / run https://github.com/natb1/commons.systems/actions/runs/29957432923/job/89049922439

---

Fingerprint: unit-tests — .claude/skills/dispatch-propagate/scripts/test-pid-cleanup.sh:179

Reproduce command: `bash .claude/skills/dispatch-propagate/scripts/test-pid-cleanup.sh` (did not reproduce locally: 10/10 passed)

Failure excerpt (CI, PR #2938, run 29958381754):
```
=== Test: cleanup_stale_worktree_processes kills stale, keeps active ===
  PASS: cleanup keeps active worktree process alive
  FAIL: cleanup left stale worktree process alive

=== Test: cleanup_stale_worktree_processes prunes before listing ===
  FAIL: cleanup_stale_worktree_processes left fixture alive (prune-before-list not working)

=== Test: cleanup_stale_worktree_processes kills child processes ===
  FAIL: cleanup did not kill fixture parent 74038

  Results: 7 passed, 3 failed
FAIL: test-pid-cleanup.sh
```

Confirmed unrelated to PR #2938's own diff (graph-commit -C flag / fail-loud guard changes) — same failure signature and failing subtests as the PR #2937 recurrence above.

recurred on PR #2938 / run https://github.com/natb1/commons.systems/actions/runs/29958381754

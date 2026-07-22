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
phase: qa
execution:
  branch: tactic-flake-pid-cleanup-stale-worktree
  pr: 2940
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: QA auto-fix planning failed for opus-fixable item #5
    (\"Timeout budget (5s / 100x0.05s) well-chosen for shared-runner variance\")
    — the gated fix-planner returned zero implementation units with no
    scope-deviation, i.e. it found no actionable code change to make. This is a
    judgment call the auto-fix lane could not resolve on its own; escalating to
    office-hours for human review. A secondary needs-main item (#6,
    planned-deferral — absence of flake recurrence across future CI runs, a
    downstream/monitoring observation) was also identified but has NOT yet been
    committed to the graph as main-qa residue, since this pass escalates rather
    than completing (the residue append rides on a transition-node commit that
    only happens on a completing pass). PR #2940's own changes (the
    polling-helper flake fix) passed all 4 script-verifiable QA checks cleanly:
    direct run, 5x repeat run, correct scoping of the sleep replacement, and
    bounded/non-hanging polling helpers."
  since: 2026-07-22
  recommendation: 'Review PR #2940 (the test-pid-cleanup.sh flake fix — all 4
    automated QA checks already PASS). The only open question is item #5: is the
    5s/100-attempt polling timeout budget in the new
    wait_for_pid_args/wait_for_child_pid helpers well-chosen for CI variance?
    The auto-fix planner found no code change to make, suggesting the current
    value is likely fine as-is. If you agree, clear this park and let qa-fix
    re-run (it will pick up item #6 — the planned-deferral "no recurrence" item
    — as a needs-main follow-up and complete normally). If you want the timeout
    tuned differently, direct the change and re-run qa-fix.'
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

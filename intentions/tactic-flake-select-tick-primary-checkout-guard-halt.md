---
id: tactic-flake-select-tick-primary-checkout-guard-halt
kind: tactic
statement: Fix the flaky select-tick primary-checkout-guard-halt wiring test in
  test-dispatch-scripts.sh causing the hook-tests and unit-tests CI jobs to
  intermittently fail
owner: ai
status: codified
parent: null
rationale: "Closed as a duplicate of tactic-flake-select-tick-guard-halt. Both
  nodes track the identical flaky assertion — the `select-tick on-main but
  primary checkout off-main -> guard halts (exit 2)` wiring test at
  test-dispatch-scripts.sh:22026 — and were filed 3 minutes apart (18:51 and
  18:54 on 2026-07-22) from two separate CI recurrences (this node from PR
  #2939, the keeper from PR #2938) without either author noticing the other
  existed. Their failure excerpts are byte-identical. The keeper
  (tactic-flake-select-tick-guard-halt) carries the richer diagnosis
  (cross-references to the adjacent select-tick flake nodes) and is the one held
  open/parked for the human flake decision, so this node is closed and its
  downstream suppression link (tactic-graph-write-recipes-base-cas.blocked_by)
  was repointed onto the keeper in the same commit so no node is wrongly
  unblocked while the flake is still live. No PR: closing a duplicate tracker,
  not landing a code fix."
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
office_hours:
  reason: >-
    /implement tactic-flake-select-tick-primary-checkout-guard-halt: the node
    body is

    diagnosis-only — no `## Unit N` breakdown to build, and no root cause pinned
    for

    the flaky "select-tick on-main but primary checkout off-main → guard halts
    (exit

    2)" assertion in test-dispatch-scripts.sh. I could not identify or reproduce
    a

    concrete defect to fix, so there is nothing safe to implement without
    guessing.


    What I did this session, beyond the prior diagnosis already on the node:

    - Re-read the guard-halt test (test-dispatch-scripts.sh:22026-22049) and its
      neighbor guard-pass test (:22000-22014), lib.sh's assert_primary_checkout_on_main
      (:1749-1765) and resolve_project_root (:1731-1735), and the PATH-shimmed git
      fake in sel_tick_setup (:21442-21465). Traced the full env-var chain
      (FAKE_GIT_PRIMARY_BRANCH -> the `-C * symbolic-ref --short HEAD` case arm ->
      assert_primary_checkout_on_main -> exit 2) and found no shadowing bug like the
      one 93a82322 fixed previously, no leaked env var from earlier/later tests (the
      only two occurrences of DISPATCH_TICK_MAIN_WORKTREE in the file are both after
      this test, at :22745/:22822), and no `set -e`/command-substitution mishandling
      (the guard-halt test's `set +e; out=$(run_sel_tick); rc=$?; set -e` bracketing
      is correct and matches the sibling drift test's `|| rc=$?` pattern).
    - Ran the full test-dispatch-scripts.sh (3007 assertions, ~140s) 8 times
      sequentially/lightly-parallel and then stress-tested it under heavier
      contention: 12-way fully parallel (12 vCPUs) and 20-way parallel pinned to 2
      vCPUs (mimicking a constrained CI runner). All runs passed 3007/3007 — the
      flake did not reproduce under any of these conditions, consistent with the
      node's existing diagnosis ("did not reproduce locally across 4 runs").
    - Pulled the actual failing job log (run 29961207775, job 89062389797) and
      confirmed the guard-pass test immediately preceding guard-halt passed cleanly
      in that same run (correctly NOT halting), and the guard-halt test failed
      immediately after with disposition=empty/skip_reason=empty instead of
      internal-error/primary-checkout-not-on-main — i.e. the guard silently did not
      fire, meaning FAKE_GIT_PRIMARY_BRANCH was not honored by the git fake in that
      one CI run, for reasons I could not pin down (env propagation to the PATH-
      resolved subprocess, or a runner-specific filesystem/exec quirk on the
      just-written+chmod'd git stub — pure speculation, unverified).
    - Checked recent unit-tests.yml runs; this exact assertion has not recurred
      since (I did not see it fail again in the last 30 runs).

    I'm stopping here rather than applying a speculative "fix" (e.g. adding
    `hash -r`

    after the PATH export) that I can't verify addresses the real cause — that
    would

    risk quietly masking the actual bug while claiming resolution, which
    conflicts

    with test-integrity (no weakening/gaming a red or flaky test without a
    verified

    fix).
  since: 2026-07-23
  recommendation: >-
    Two reasonable paths, either as a human call or a follow-up tactic with a
    real

    plan:


    1. **Treat as a one-off CI blip and close.** It hasn't recurred in the last
    30
       unit-tests.yml runs since PR #2939. If it stays quiet, there's no live bug to
       chase — park/close this node without a code change.

    2. **If it recurs, add targeted diagnostics instead of guessing.** On a
    repeat
       failure, capture what the git fake actually returned rather than trying
       another blind fix: temporarily have the guard-halt test (or the git fake
       itself) tee its resolved branch value and the live env (`env | grep
       ^FAKE_GIT`) to a file on failure, so the next CI recurrence pins the actual
       cause instead of adding another unverified hardening pass.

    I'd lean toward (1) given the zero-recurrence evidence, but a human with
    visibility

    into whether GitHub-hosted runners were under unusual load around 2026-07-22

    21:58 UTC (the failing run) may have more signal than I do.
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the flaky select-tick primary-checkout-guard-halt wiring test in test-dispatch-scripts.sh causing the hook-tests and unit-tests CI jobs to intermittently fail

Fingerprint: hook-tests — .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:22026

Reproduce command: `bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
(the `hook-tests` CI job's "Run dispatch script tests" step invokes this file
directly; the `unit-tests` job's `run-unit-tests.sh` script-suite runner also
exercises it and hit the same assertion in the same CI run).

Failure excerpt (CI, PR #2939, run 29961207775, jobs 89062389797/89062389586):
```
Test: select-tick on-main but primary checkout off-main → guard halts (exit 2)
  FAIL: guard-halt: exit 2 (the guard's exit)
    expected: '2'
    actual:   '0'
  FAIL: guard-halt: no selection decision line (tail not 'empty')
    expected: ''
    actual:   'empty'
  FAIL: guard-halt: disposition internal-error
    expected: 'internal-error'
    actual:   'empty'
  FAIL: guard-halt: skip_reason primary-checkout-not-on-main
    expected: 'primary-checkout-not-on-main'
    actual:   ''
Results: 3003/3007 passed, 4 failed
FAIL: test-dispatch-scripts.sh
```

Diagnosis: did not reproduce locally across 4 runs, including one through the
CI-equivalent `run-unit-tests.sh` path — 3007/3007 pass every time. PR #2939's
diff (`transition-node`, `fix-checks/SKILL.md`, `unit-tests.yml` job wiring,
new `test-transition-node.sh`) never touches `test-dispatch-scripts.sh`,
`lib.sh`, or the select-tick primary-checkout guard, so the PR isn't
responsible. The guard (`assert_primary_checkout_on_main` in `lib.sh`) and
this "guard-halt" wiring test (asserting `FAKE_GIT_PRIMARY_BRANCH` drives the
guard to halt the tick) were added in a tight recent commit cluster
(`b8a1ba75`, `a18bf1c1`/#2929, `fe25242f`), and that same test fixture already
had one confirmed defect fixed once before (`93a82322`: a shadowed case arm in
the fake-git stub had made this exact assertion vacuously pass) — marking this
as an actively fragile, CI-environment-sensitive hot spot rather than a stable
code defect. The exact trigger (race, env leak, or CI-runner-specific git
behavior) was not pinned.

recurred on PR #2939 / run https://github.com/natb1/commons.systems/actions/runs/29961207775

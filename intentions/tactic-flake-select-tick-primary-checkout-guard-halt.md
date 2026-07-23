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
office_hours: null
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

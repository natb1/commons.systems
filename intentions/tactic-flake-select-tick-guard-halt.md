---
id: tactic-flake-select-tick-guard-halt
kind: tactic
statement: Fix the flaky dispatch-select-tick guard-halt test in
  test-dispatch-scripts.sh causing hook-tests and unit-tests CI jobs to
  intermittently fail the primary-checkout-off-main assertion
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the flaky dispatch-select-tick guard-halt test in test-dispatch-scripts.sh causing hook-tests and unit-tests CI jobs to intermittently fail the primary-checkout-off-main assertion

Fingerprint: hook-tests — select-tick on-main but primary checkout off-main → guard halts (exit 2)

Reproduce command: `env -u GIT_EDITOR -u EDITOR TERM=dumb bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` (does NOT reproduce locally — 3007/3007 passed across 3 separate local runs, including one mirroring CI's exact invocation with no env wrapper).

Failure excerpt (CI, PR #2938, sha 9f01d16bb5a7d55d986db0449ac26f81bde4eea6, run https://github.com/natb1/commons.systems/actions/runs/29961388502, both the `hook-tests` and `unit-tests` jobs):
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
```

Diagnosis: PR #2938's diff never touches `lib.sh`, `dispatch-select-tick`, or
`test-dispatch-scripts.sh` (confirmed via `git diff --stat origin/main...HEAD`).
The failure does not reproduce locally. The CI-observed output (rc=0, tail
`empty`, disposition `empty`, skip_reason ``) is byte-for-byte identical to the
immediately-preceding "guard-pass" test's expected output — i.e. in that CI run
the guard resolved the primary checkout's fake branch to `main` instead of
picking up the test's `FAKE_GIT_PRIMARY_BRANCH="707-some-branch"` knob, as if
the knob were silently ignored. `sel_tick_teardown` does correctly unset both
`SEL_PRIMARY_CHECKOUT_BRANCH` and `FAKE_GIT_PRIMARY_BRANCH` between test cases,
and no cross-step (`GITHUB_ENV`-style) leak vector exists for these
test-fixture-local env var names — so this looks like an environment-order-
sensitive non-determinism in how the PATH-shimmed `git` stub resolves its
case arm across the ~150 sequential `Test:` blocks in this one long-lived bash
process, not a bug in this PR's own changes. This exact `guard-halt` /
`primary-checkout-not-on-main` failure signature was previously observed and
name-dropped (but never tracked as its own node) in the closing notes of
`tactic-flake-park-node-concurrent-write-refusal`. Two adjacent-but-distinct
flakes already exist for the same test file/section under different failure
signatures: `tactic-flake-hook-tests-select-tick` (open, PR #2933, a `set -e`
crash on the "empty queue → empty, lock released" test) and
`tactic-flake-unit-tests-select-tick` (closed, duplicate of the former) — this
node tracks the `guard-halt` signature specifically, which is distinct from
both.

recurred on PR #2938 / run https://github.com/natb1/commons.systems/actions/runs/29961388502

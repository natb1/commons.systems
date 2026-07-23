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
office_hours:
  reason: "/implement: tactic-flake-select-tick-guard-halt duplicates
    tactic-flake-select-tick-primary-checkout-guard-halt (same
    test-dispatch-scripts.sh:22026 flake, no new lead found) - needs
    human/align-tactics dedup decision"
  since: 2026-07-23
  recommendation: >-
    This node (tactic-flake-select-tick-guard-halt) is a duplicate of
    tactic-flake-select-tick-primary-checkout-guard-halt — same test
    (test-dispatch-scripts.sh:22026, the "select-tick on-main but primary
    checkout off-main -> guard halts" case), same phase (implement), same
    failure signature, filed 3 minutes apart from two separate CI recurrences
    (PR #2938 and PR #2939).


    Recommended next steps:

    1. Close/park one of the two nodes as a duplicate of the other (per the
    precedent in tactic-flake-park-node-concurrent-write-refusal /
    tactic-flake-park-node-case2-dirty-tree-guard, where align-tactics or a
    human merges duplicate flake-tracking nodes). Keep whichever has the more
    complete diagnosis - they're currently comparable in depth.

    2. If pursuing a fix rather than closing as duplicate: the guard wiring
    itself (lib.sh's assert_primary_checkout_on_main, the PATH-shimmed git stub,
    and dispatch-select-tick's MAIN_WORKTREE resolution) reads as deterministic
    on static review - no cross-test env leak, no PATH accumulation bug, no
    obvious ordering issue found this session. Since this flake does not
    reproduce locally (documented on both nodes across 7+ combined local runs),
    a fix attempt likely needs CI-side instrumentation instead: temporarily add
    a diagnostic-only echo of `command -v git`, `$PATH`, and the exported
    FAKE_GIT_PRIMARY_BRANCH/SEL_PRIMARY_CHECKOUT_BRANCH values right before the
    guard-halt test block, land it, and wait for the next CI recurrence to
    capture what the runner actually saw - rather than guessing further from a
    non-reproducing local environment.

    3. Do not weaken or skip the guard-halt test to make CI green - per
    .claude/rules/test-integrity.md this is a real assertion pinning a real
    safety guard (the 2026-07-21 direct-to-main incident it guards against, PR
    #2925).
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

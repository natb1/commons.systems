---
id: tactic-typecheck-baseline-branch-new-files
kind: tactic
statement: run-typecheck.sh baseline swap leaves branch-new files in the tree,
  so any PR that adds a file to a workspace skips that workspace's typecheck and
  reports a vacuous pass
owner: ai
status: codified
parent: null
rationale: Surfaced at the 2026-07-23 office-hours sitting following the open-PR
  orphan audit. The reported symptom was narrow (a vacuous pass on
  office-hours-snapshot); the underlying defect is repo-wide and silent, so it
  was fixed at the sitting rather than queued.
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-typecheck-baseline-branch-new-files
  pr: 2955
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# run-typecheck.sh baseline swap leaves branch-new files in the tree, so any PR that adds a file to a workspace skips that workspace's typecheck and reports a vacuous pass

## Context

`run-typecheck.sh` builds its baseline by swapping a workspace to origin/main
with `git checkout origin/main -- <ws>`. That reverts every file origin/main
has, but it cannot delete a file origin/main lacks. Branch-new files therefore
survived into the baseline probe at HEAD content while the code they depend on
reverted, so the baseline compile failed on the branch's own new code. The
script reported that as `origin/main has pre-existing typecheck errors` and
skipped the workspace — meaning any PR that added a file to a workspace
silently disabled typechecking for that whole workspace, and a real type error
in it was reported as a pass.

The script already handled the mirror case (origin/main-only files staged `A`
after the swap, cleaned via reset->checkout->clean). The HEAD-only direction
was not considered.

## Evidence

Measured on the #2805 branch, which adds `office-hours/src/snapshot-wire.ts`
and `office-hours-snapshot/src/roundtrip.test.ts`:

- A pure origin/main checkout typechecks both workspaces clean (rc=0, zero
  diagnostics), so the "pre-existing errors" diagnosis was false.
- The script skipped both and printed `All typecheck targets passed.`
- With a deliberate type error added, the original script exits 0 and the
  fixed script exits 1 naming both workspaces as regressions.

## Scope

`.claude/skills/dispatch-propagate/scripts/run-typecheck.sh` — remove
branch-new paths before the baseline probe (`--no-renames`, so an
intra-workspace move decomposes to D+A rather than R); count checked vs
skipped and stop printing a pass line when nothing was checked.

`.claude/skills/dispatch-propagate/scripts/test-run-typecheck.sh` — Test 7
(addition branch), the mirror of the existing Test 6 (deletion branch).

## Deliberate non-change

Exit status stays 0 when every target skips. `test-run-typecheck.sh` Test 3
pins the contract that a genuinely broken origin/main must not fail a PR
author's CI. Making zero-checked a hard failure turned Test 3 red, and the code
was changed instead of the test. Whether that contract is the right one is
raised as an open question on PR #2955 rather than settled here.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-run-typecheck.sh
```

Test 7 fails 3/5 against the pre-fix script and passes 5/5 against the fix;
the full suite is 24/24.

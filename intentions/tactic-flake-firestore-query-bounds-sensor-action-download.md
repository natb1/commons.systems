---
id: tactic-flake-firestore-query-bounds-sensor-action-download
kind: tactic
statement: "CI flake: the \"firestore-query-bounds-sensor\" check fails when the
  GitHub Actions runner cannot resolve action download info (Service Unavailable
  / Internal Server Error) during its own setup, before actions/checkout or the
  sensor script runs — unrelated to any PR's own changes"
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
phase: done
execution:
  branch: tactic-flake-firestore-query-bounds-sensor-action-download
  pr: 3053
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-09T22:36:31Z
    mergeCommitSha: 69626f6afbca4c40795f5dc61cc75a39660af735
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# CI flake: the "firestore-query-bounds-sensor" check fails when the GitHub Actions runner cannot resolve action download info (Service Unavailable / Internal Server Error) during its own setup, before actions/checkout or the sensor script runs — unrelated to any PR's own changes

## Context

Observed on PR #3052 (`tactic-reap-safety-behind-branch-false-positive`). The
`firestore-query-bounds-sensor` job (`.github/workflows/pr-checks.yml`, which
runs `actions/checkout` then
`.github/scripts/check-firestore-query-bounds.sh`) failed entirely during the
runner's own `Prepare all required actions` / `Getting action download info`
step, before `actions/checkout` — let alone the sensor script — ran. This
failed in the SAME run and same ~5-minute window as
`tactic-flake-acceptance-action-download`, both jobs of the same workflow
run. No `.github/workflows/*` file changed between the PR head and
`origin/main`. A prior run of this exact PR (run 31112754441) shows this same
check passing cleanly in 6 seconds, confirming this is not a deterministic
defect in the PR's own diff.

## Scope

No code scope — this is a pure external CI-infrastructure flake. There is
nothing in this repository to change; the remedy is re-running the failed
job. Out of scope: any change to `pr-checks.yml` or
`check-firestore-query-bounds.sh` — neither is implicated.

## Recommended model

sonnet

## Verification

Manual and judgment checks:

- Confirm via `gh run rerun --failed` (or a fresh push) that
  `firestore-query-bounds-sensor` passes when re-run against the same or a
  later commit.
- Watch for recurrence of this exact fingerprint on subsequent PRs; if it
  recurs frequently, escalate to GitHub Support / status page rather than
  chasing a code fix.

## Fingerprint

```
Fingerprint: firestore-query-bounds-sensor — firestore-query-bounds-sensor
```

## Reproduce command

```
N/A — failure precedes actions/checkout in pr-checks.yml; check-firestore-query-bounds.sh never ran
```

Not locally reproducible: the failure happens in the runner's own
action-resolution phase, before any workflow step (including checkout) runs.

## Failure excerpt

```
Prepare workflow directory
Prepare all required actions
Getting action download info
Failed to resolve action download info. Error: Service Unavailable
Retrying in 11.358 seconds
Failed to resolve action download info. Error: Internal Server Error
Retrying in 15.206 seconds
##[error]Internal Server Error
##[error]Failed to resolve action download info.
```

recurred on PR #3052 / run https://github.com/natb1/commons.systems/actions/runs/31114386402/job/92660066612

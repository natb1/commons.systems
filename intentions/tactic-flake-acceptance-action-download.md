---
id: tactic-flake-acceptance-action-download
kind: tactic
statement: "CI flake: the \"acceptance\" check fails when the GitHub Actions
  runner cannot resolve action download info (Service Unavailable / Internal
  Server Error) during its own setup, before actions/checkout or any repo code
  runs — unrelated to any PR's own changes"
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
# CI flake: the "acceptance" check fails when the GitHub Actions runner cannot resolve action download info (Service Unavailable / Internal Server Error) during its own setup, before actions/checkout or any repo code runs — unrelated to any PR's own changes

## Context

Observed on PR #3052 (`tactic-reap-safety-behind-branch-false-positive`). The
`acceptance` job (`.github/workflows/pr-checks.yml`, which starts with
`actions/checkout`, `actions/setup-node`, `actions/setup-java`,
`actions/cache`) failed entirely during the runner's own
`Prepare all required actions` / `Getting action download info` step, before
any of those pinned actions — let alone the job's own script — ran. This
failed in the SAME run and same ~5-minute window as a sibling flake tactic
tracking `firestore-query-bounds-sensor`'s identical failure in the same
workflow run. No `.github/workflows/*` file changed between the PR head and
`origin/main`. A prior run of this exact PR (`firestore-query-bounds-sensor`
in run 31112754441) passed cleanly in 6 seconds, confirming this is not a
deterministic defect in the PR's own diff.

## Scope

No code scope — this is a pure external CI-infrastructure flake. There is
nothing in this repository to change; the remedy is re-running the failed
job. Out of scope: any change to `pr-checks.yml`, the acceptance test suite,
or the app under test — none is implicated.

## Recommended model

sonnet

## Verification

Manual and judgment checks:

- Confirm via `gh run rerun --failed` (or a fresh push) that `acceptance`
  passes when re-run against the same or a later commit.
- Watch for recurrence of this exact fingerprint on subsequent PRs; if it
  recurs frequently, escalate to GitHub Support / status page rather than
  chasing a code fix.

## Fingerprint

```
Fingerprint: acceptance — acceptance
```

## Reproduce command

```
N/A — failure precedes actions/checkout in pr-checks.yml
```

Not locally reproducible: the failure happens in the runner's own
action-resolution phase, before any workflow step (including checkout) runs.

## Failure excerpt

```
Prepare workflow directory
Prepare all required actions
Getting action download info
Failed to resolve action download info. Error: Service Unavailable
Retrying in 15.928 seconds
Failed to resolve action download info. Error: Service Unavailable
Retrying in 29.034 seconds
##[error]Service Unavailable
##[error]Failed to resolve action download info.
```

recurred on PR #3052 / run https://github.com/natb1/commons.systems/actions/runs/31114386402/job/92660066629

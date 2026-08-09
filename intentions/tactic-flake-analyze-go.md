---
id: tactic-flake-analyze-go
kind: tactic
statement: "CI flake: the CodeQL \"Analyze (go)\" job fails when the GitHub
  Actions runner cannot resolve action download info (Service Unavailable /
  Internal Server Error) during its own setup, before any repo code checks out
  or runs — unrelated to any PR's own changes"
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
# CI flake: the CodeQL "Analyze (go)" job fails when the GitHub Actions runner cannot resolve action download info (Service Unavailable / Internal Server Error) during its own setup, before any repo code checks out or runs — unrelated to any PR's own changes

## Context

Observed on PR #3052 (`tactic-reap-safety-behind-branch-false-positive`). The
`Analyze (go)` job of GitHub's managed CodeQL default-setup workflow (the repo
carries no `.github/workflows/codeql*.yml` — CodeQL runs via
`code-scanning/default-setup`) failed entirely during the runner's own
`Prepare all required actions` / `Getting action download info` step, before
`actions/checkout` or any repo code ran. Sibling jobs in the SAME run
(`Analyze (actions)`, `Analyze (python)`) both passed normally, and no
`.github/workflows/*` file changed between the PR head and `origin/main` —
this is a runner/action-resolution-service hiccup on GitHub's side, not
something any repo commit could cause or fix.

## Scope

No code scope — this is a pure external CI-infrastructure flake. There is
nothing in this repository to change; the remedy is re-running the failed
job. Out of scope: any change to CodeQL configuration, workflow YAML, or Go
source — none is implicated.

## Recommended model

sonnet

## Verification

Manual and judgment checks:

- Confirm via `gh run rerun --failed` (or a fresh push) that `Analyze (go)`
  passes when re-run against the same or a later commit.
- Watch for recurrence of this exact fingerprint on subsequent PRs; if it
  recurs frequently, escalate to GitHub Support / status page rather than
  chasing a code fix.

## Fingerprint

```
Fingerprint: Analyze (go) — Analyze (go)
```

## Reproduce command

```
N/A — failure precedes checkout; GitHub-managed CodeQL default-setup workflow (no repo YAML)
```

Not locally reproducible: the failure happens in the runner's own
action-resolution phase, before any workflow step (including checkout) runs.

## Failure excerpt

```
Prepare workflow directory
Prepare all required actions
Getting action download info
Failed to resolve action download info. Error: Service Unavailable
Retrying in 24.921 seconds
Failed to resolve action download info. Error: Service Unavailable
Retrying in 13.383 seconds
##[error]Internal Server Error
##[error]Failed to resolve action download info.
```

recurred on PR #3052 / run https://github.com/natb1/commons.systems/actions/runs/31114380327/job/92660053911

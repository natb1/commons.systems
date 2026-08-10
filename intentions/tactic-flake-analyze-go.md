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
office_hours:
  reason: "/implement: node tactic-flake-analyze-go has no code scope by design —
    it documents a GitHub-infrastructure CI flake (Analyze (go) job fails during
    the runner's own action-resolution step, before checkout). Nothing to build
    or commit; recommend re-running the failed job and closing as
    observed-and-documented."
  since: 2026-08-09
  recommendation: >-
    ## Recommendation


    **The "no code scope" framing is correct.** The failure is in the runner's
    own "Prepare all required actions / Getting action download info" step —
    that runs before `actions/checkout`, so no repo content, workflow YAML, or
    Go source is even on disk yet. `Service Unavailable` / `Internal Server
    Error` while resolving action download info is GitHub-side infrastructure.
    Two corroborating facts: sibling jobs in the same run (`Analyze (actions)`,
    `Analyze (python)`) passed, and CodeQL here is managed default-setup — there
    is no `.github/workflows/codeql*.yml` in the repo to change even if we
    wanted to. There is nothing to build or commit, which is exactly why the
    `implement` phase can't complete it.


    **Next action: re-run and confirm.**


    ```

    gh run rerun 31114380327 --failed

    gh run watch 31114380327

    ```


    (If you'd rather re-run only that one job: `gh run rerun --job
    92660053911`.) Then check that `Analyze (go)` is green on PR #3052.


    **Then decide disposition:**

    - **Passes on re-run** (the expected outcome) — close the node as
    observed-and-documented. No code fix needed; its value is the recorded
    fingerprint. Note the re-run outcome on the node before closing so a future
    recurrence can be matched against it.

    - **Fails again on the same commit** — re-run once more against a fresh
    push. If it still fails, this stops being a transient and the escalation
    path in the node applies: check the GitHub status page and open a GitHub
    Support ticket. Still no code change on our side.

    - **You want recurrence tracking** — keep the node open only if you intend
    to actually watch it. A node held open with no owner and no trigger is just
    noise; the fingerprint `"Analyze (go) — Analyze (go)"` already lets the
    flake classifier match a recurrence and re-surface it, so closing does not
    lose the memory. Closing is the better default.


    **Out of scope for this node:** PR #3052 currently has two other failing
    checks — `acceptance` and `firestore-query-bounds-sensor`. Those are
    unrelated to this infrastructure flake and must not be folded into this
    node's disposition. Judge this node solely on whether `Analyze (go)` goes
    green. Route the other two failures separately, and don't let them block
    closing this one.
  session_type: other
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

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
office_hours:
  reason: "/implement: tactic-flake-acceptance-action-download's plan declares no
    code scope (no ## Unit N sections, Scope forbids touching pr-checks.yml,
    Verification is manual-only) - nothing for /implement-unit to build and no
    diff to put in a PR. Escalating for a human decision on whether to
    transition this node straight to done without a PR, or reclassify. Sibling
    node tactic-flake-firestore-query-bounds-sensor-action-download has the
    identical pattern from the same PR #3052 / CI run."
  since: 2026-08-09
  recommendation: >-
    **Recommendation: agree with the park — but the routing, not the node, is
    what needs deciding.**


    1. **Nothing to implement.** The plan has no `## Unit N` sections, its Scope
    explicitly forbids touching `pr-checks.yml`, and its Verification is
    manual-only. A `Service Unavailable` from GitHub's action-resolution service
    before `actions/checkout` runs is not fixable in this repo. Forcing a no-op
    PR just to satisfy the implement→review marker would put a fake diff in
    history. Don't do that.


    2. **Unblock by transitioning phase, not by opening a PR.** These nodes are
    incident records: their whole value is the fingerprint plus the recurrence
    link. The transition should take the node straight from `implement` to
    `done` with a short body note recording the disposition (re-run passed / no
    code remedy). Use the repo's node-transition tooling
    (`.claude/skills/dispatch-propagate/scripts/transition-node`) rather than
    hand-editing the frontmatter — hand edits in a stale worktree are a known
    way to lose the body. Before transitioning, confirm the `acceptance` job
    actually passed on a re-run of PR #3052; if it failed again with the same
    fingerprint, that changes the answer (recurring → real signal, escalate
    upstream).


    3. **Same sitting, both nodes.**
    `tactic-flake-firestore-query-bounds-sensor-action-download` is stuck
    identically — same PR, same run, same empty scope. Dispatch the same
    disposition to both.


    **Worth deciding once:** whether flake-tracking nodes with no code scope
    should ever be routed to `implement` at all, or be born at
    `done`/observational in align-tactics. Otherwise this recurs on every
    CI-infra flake.
  session_type: other
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

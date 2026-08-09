---
id: tactic-main-red-ac908454
kind: tactic
statement: "origin/main red at ac908454: CodeQL Analyze (actions) job stuck queued"
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-diagnose-main on a failing main-health sensor read.
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: origin/main HEAD check-run conclusions at ac908454
  sensor: main-health
  threshold: "green: every check on the current origin/main HEAD concludes success
    (or neutral/skipped)"
  is_proxy: false
attention: null
phase: null
execution: null
validates:
  - strategy-main-health
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

## Diagnosis

`origin/main` HEAD ac908454 shows a red check-suite from GitHub's default
CodeQL dynamic setup (run 31320817993, event `dynamic` — not a repo-controlled
`.github/workflows/*.yml` file). Of the three matrix jobs:

- `Analyze (go)` — completed, success.
- `Analyze (python)` — completed, success.
- `Analyze (actions)` — never left `queued` status (started_at set, no
  completed_at, conclusion null), still queued 13+ minutes after the run
  began. No logs exist for this job because it never actually ran.

The check-suite's overall conclusion is `failure` even though no job produced
a real error — the stuck job appears to be a GitHub Actions/CodeQL
infrastructure stall rather than a lint/type/test/security defect in this
repo's code. All other CI checks on this commit (`acceptance`,
`preview-and-smoke`, `unit-tests`, `lint`, `guard`) are green.

## Suggested next step

Re-trigger CodeQL analysis on this commit (e.g. via a new push, or manually
re-running the failed workflow run) and confirm the `Analyze (actions)` job
completes normally on retry. If it repeatedly stalls, this may need to be
raised with GitHub support as a platform issue rather than fixed in-repo.

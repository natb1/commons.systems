---
id: tactic-graph-fastpath-guard-diff-base
kind: tactic
statement: "fix Graph Fast Path guard false-fail: empty origin/main...HEAD diff
  in push context"
owner: ai
status: raw
parent: null
rationale: "Bug retained from the 2026-07-12 red-main episode
  (graph-as-sole-tracker: every defect worth fixing is a tactic). The Graph Fast
  Path workflow's guard job failed on a valid intentions/-only push because git
  diff --name-only origin/main...HEAD resolved empty in the push-event checkout;
  sibling pushes minutes earlier passed, so the failure is race-dependent. The
  legacy latch issue currently carrying this fix dies with the issue-flow
  deprecation, so the graph must carry it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fix Graph Fast Path guard false-fail: empty origin/main...HEAD diff in push context

Draft — bug retained from the 2026-07-12 red-main episode.

## Evidence

- Workflow: Graph Fast Path, run 29215397854, commit `52bbff25` (a valid
  intentions/-only graph push: `graph: transition
  tactic-multiserve-fingerprint-stamp to review`).
- Failing job: `guard` — "Verify the push is intentions/-only".
- Error: `No changes relative to origin/main — nothing to fast-path.`
  (`git diff --name-only origin/main...HEAD` resolved empty, hitting the
  guard's exit-1 branch.)
- Race-dependent: sibling intentions-only pushes minutes earlier
  (e.g. run 29215350059, commit `6c6969db`) passed the same guard. Whether
  a run's `origin/main...HEAD` is empty appears to depend on where the
  remote main tip stands when actions/checkout fetches — undiagnosed; the
  fix session should pin down the exact checkout/fetch semantics first.

## Likely fix direction

Diff against the push event's own base instead of the moving `origin/main`
ref — `github.event.before` (the push payload's before-sha) or `HEAD~1` —
so the guard checks exactly the pushed commits regardless of how far the
remote tip has advanced by checkout time. Multi-commit pushes need the
event-payload base, not `HEAD~1`.

## Verification sketch

A subsequent intentions-only graph push passes the guard; a push touching a
non-intentions path still fails it. No green-CI re-run of the failed
historical sha is needed — the latch clears on the next green main HEAD.

---
id: tactic-mainqa-pause-disables-merge-lane-machine
kind: tactic
statement: "Post-merge verification of tactic-pause-disables-merge-lane (PR
  #3068) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-pause-disables-merge-lane
  pr: 3068
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-pause-disables-merge-lane
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-pause-disables-merge-lane (PR #3068) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-pause-disables-merge-lane` (PR #3068). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **10 — Live confirmation that a reviewed node-lane PR merges under the standing pause**
  - Path: `current`
  - Expected outcome: after this PR lands on main, with the pause sentinel still present, a heartbeat tick's journal output shows the paused no-scheduling line coexisting with `merge:`/`reconcile-graph:` lines, and a reviewed green node-lane PR actually merges with no operator action and is absorbed to `done`/`main-qa`.
  - Finding: this is the PR's own manual test-plan item (unchecked). It is only observable post-merge, against the deployed `dispatch-tick` systemd timer, the real standing pause sentinel, and an actual reviewed green node-lane PR landing in the live queue — none of which this QA pass's isolated worktree/test-suite environment can reproduce. `qa-fix`'s own disposition workflow classified this `needs-main` (planned deferral).
  - Verifiability: WAIT
  - Check: `journalctl --user -t dispatch-tick --since -2h | grep -E 'paused \(sentinel present|merge: |reconcile-graph: '` — (`-t`, the syslog identifier, not `-u`: there is no `dispatch-tick.service` — the units are `dispatch-heartbeat.service` and the transient `dispatch-reseed-<epoch>`, so `-u dispatch-tick` prints `-- No entries --`. No `^` anchors either: journalctl's default short format prefixes every line with `<timestamp> <host> dispatch-tick[<pid>]:`, so a line-anchored pattern can never match.) confirm a `paused (sentinel present` line and at least one `merge:` line appear in the same tick's output block, then confirm via `gh pr view <the-example-PR>` that it actually merged with no operator-initiated action recorded.

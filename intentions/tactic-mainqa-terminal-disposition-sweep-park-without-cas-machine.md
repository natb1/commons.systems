---
id: tactic-mainqa-terminal-disposition-sweep-park-without-cas-machine
kind: tactic
statement: "Post-merge verification of
  tactic-terminal-disposition-sweep-park-without-cas (PR #3042) —
  machine-verifiable items"
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
  branch: tactic-terminal-disposition-sweep-park-without-cas
  pr: 3042
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-terminal-disposition-sweep-park-without-cas
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-terminal-disposition-sweep-park-without-cas (PR #3042) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-terminal-disposition-sweep-park-without-cas` (PR #3042). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **1 — No new office-hours park clobbers occur over a full day of real ticks**
  - Path: `current`
  - Expected outcome: zero `UNHEALED` rows from the state-aware detect script over a full day of merged production tick traffic.
  - Finding: not observable from a worktree — needs a real concurrent human-authored office-hours park landing inside a sweep's guard-to-write window against real `origin/main`.
  - Verifiability: WAIT
  - Check: the state-aware `UNHEALED` detect script already in this node's body under "Interim mitigation, until the fix lands" § 1 (`git log --since='-4 days' ... | awk ... UNHEALED`), re-windowed to since-merge.
- **2 — Stale-diagnosis refusals appear in production logs and self-heal on the next tick**
  - Path: `current`
  - Expected outcome: `stale-diagnosis` hits are rare but present, and each is followed by a clean resolution (correctly parked or correctly skipped as already-parked) on a later tick — never a permanent stall.
  - Finding: only real tick runs against real `origin/main` produce genuine exit-3 races; unreachable from a worktree.
  - Verifiability: WAIT
  - Check: `journalctl -u dispatch-tick --since <merge-time> | grep 'stale-diagnosis'`; for each hit, confirm the node's specific park text survived and a later tick converged (parked or already-parked skip).
- **3 — The ordinary park success path is unaffected by the pin**
  - Path: `current`
  - Expected outcome: uncontended sweep parks still land normally; `parked_count` totals match nodes actually reaching office-hours; escalation markers are still deleted only on confirmed-landed parks.
  - Finding: confirming the `--base` pin is not too strict (which would silently disable both sweeps while unit tests still pass) requires real sweeps against real `origin/main` blobs.
  - Verifiability: WAIT
  - Check: `journalctl -u dispatch-tick --since <merge-time> | grep 'lib-frozen-session-park: parked '` — confirm nonzero, and that `parked_count` in each "sweep complete" summary line matches the count of `parked` lines in that run.

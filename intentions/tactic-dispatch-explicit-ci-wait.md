---
id: tactic-dispatch-explicit-ci-wait
kind: tactic
statement: make the explicit-node dispatch lane wait out in-flight CI up to the
  reservation TTL instead of skipping, leaving the autonomous and --manual paths
  unchanged
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-29 /align-strategy interview confirming
  dispatch <node-id> semantics (strategy clarification 132). The explicit lane
  skips on pending CI at two surfaces (sensor_gate's ci-pending, provision exit
  10 ci-waiting), both of which assume a next tick that does not exist under the
  standing paused/manual-only operating mode, so the human hits a dead end and
  must re-run by hand.
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
# make the explicit-node dispatch lane wait out in-flight CI up to the reservation TTL instead of skipping, leaving the autonomous and --manual paths unchanged

## Context

The explicit-node lane skips on in-flight CI at two surfaces:

1. **Selection-time** — `graph-select-target`'s `sensor_gate`, `qa|review` arm: `dispatch-ci-ready`
   exits 1 while checks are in progress, the gate returns skip reason `ci-pending`, and with `--node`
   set that is the only candidate, so the selector prints `empty` and `dispatch-select-tick` emits
   `node-not-selectable <id>` (exit 1 from `dispatch-tick`).
2. **Provision-time** — `provision-node-worktree` exit 10 (`ci-waiting`: a draft PR whose checks have
   not concluded), which `dispatch-graph-execute` reports as `waiting <id>` with the comment
   "Retry next tick".

Both assume a next tick. Under the standing paused/manual-only operating mode there is none, so the
human gets a dead end and must re-run by hand. Strategy clarification 132 (2026-07-29) adopts a
bounded wait on this lane only.

## Scope

- On the EXPLICIT-NODE lane only, poll the CI verdict until it concludes rather than skipping.
  The autonomous path and `--manual` keep skipping, byte-for-byte: `dispatch-tick` is also the
  systemd/heartbeat entry point and must never block.
- Bound the wait by `DISPATCH_RESERVATION_STANDALONE_TTL_S` (default 600s) — the SAME constant, read
  from the same place, not a copy and not a new constant. Rationale: selection writes the reservation
  marker before the wait, so the wait holds a concurrency slot for its whole duration; one constant
  cannot drift from the other.
- On timeout, fall back to today's behavior with a message naming the PR and how long it waited.
- Cover both surfaces above, or establish and document which single surface the wait belongs at.
- Emit progress while waiting so a foreground terminal is not silent.

Out of scope: changing check durations, changing the TTL's default, or waiting on anything other
than a CI verdict (a merge conflict routes to `/dispatch-conflict` Lane 3 and is not a wait case).

## Dependencies

None hard. Note the overlap with `tactic-dispatch-explicit-critical-path-walk`: both touch the
explicit-node lane in `dispatch-select-tick` / `graph-select-target`, so whichever lands second
should expect a merge in that region.

## Reuse

- `dispatch-ci-ready` — the existing CI verdict primitive
- `dispatch_ci_verdict_rest` / `gh_pr_view_rest` — `lib.sh`
- `DISPATCH_RESERVATION_STANDALONE_TTL_S` and `reservation_sweep` — `lib-reservation-ledger.sh`

## Verification

Unit-test the wait loop against a stubbed verdict source (concludes green, concludes red, never
concludes → timeout). Assert the autonomous and `--manual` paths do not wait. Manual: run
`dispatch <id>` against a node whose PR has checks in flight and confirm it waits, then dispatches.

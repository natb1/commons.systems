---
id: tactic-selection-ledger-accounting
kind: tactic
statement: selection-time global-cap gap accounting from the reservation ledger
  plus a dead-claim liveness sweep at tick start
owner: ai
status: codified
parent: null
rationale: "Homes the two clarification-33 mechanics no open tactic carries
  (found by the 2026-07-06 /align-tactics full-body disposition sweep): the tick
  selects only the gap — target minus busy-plus-reserved, counted from the
  reservation ledger and node-id liveness — with per-workflow caps as local
  backstops never the enforcement point; and a dead worker's ledger claim is
  reconciled by a sweep, never by session recovery (clarification 35). Kept out
  of the in-flight selector PR per the recorded precedent (clarification 34: new
  scope is never an amendment to the in-flight selector PR); blocked_by the
  selector because the reservation ledger, the selection lock, and
  dispatch-graph-tick.js land with it. Off the minimum signal path: derived
  attention demotes it (clarifications 9/11)."
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
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# selection-time global-cap gap accounting from the reservation ledger plus a dead-claim liveness sweep at tick start

## Context

The 2026-07-06 select-all concurrency clarification on
`strategy-graph-native-dispatch` (clarification 33) makes selection the
enforcement point of the one global worker cap: the tick counts busy plus
reserved — from the reservation ledger and node-id liveness — against the
pace target and selects only the gap; per-workflow caps (the tick
workflow's `worker_cap`, default 8) are local backstops, never the
enforcement point (two overlapping workflows each locally capped at 8
would otherwise run 16). What makes overlapping ticks safe is claims
spanning the overlap; a dead worker's claim is reconciled by a sweep,
never by session recovery (clarification 35).

The 2026-07-06 `/align-tactics` full-body disposition sweep found neither
mechanic carried by any open tactic: `tactic-graph-router-selector` Unit 2
creates the one claimed set / reservation ledger and the one pace budget,
but its gap computation leans on the pre-existing pace count without the
ledger+reserved+liveness accounting, and no node carries a dead-claim
sweep — the reconciler sweep in `tactic-graph-router-transitions` Unit 2
is the merged/closed-PR analog of `dispatch-reconcile-merged`, a different
job. This tactic homes both, gated behind the selector (whose PR supplies
the ledger, the selection lock, and `dispatch-graph-tick.js`) per the
recorded precedent that new scope is never an amendment to the in-flight
selector PR (clarification 34).

Claim-clear paths already specified elsewhere and out of scope here: the
worker-start skip path clears its claim (`tactic-worker-start-revalidation`
Unit 2), and transition writes clear the finished phase's claim. This
tactic's sweep is the backstop for workers that died between those points.

## Unit 1 — gap accounting at selection

**Recommended model:** opus

Scope (`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`,
with `graph-select-target` /
`packages/intentionsutil/scripts/select-targets.ts` as needed — take
exact line anchors from `main` after the selector PR merges):
- Under the one selection lock, compute `busy` = live dispatch-managed
  workers across both keyspaces (node-id worktree liveness via
  `claude_sessions_under` / `worktree_has_live_session`,
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` —
  every call requires `dangerouslyDisableSandbox: true` in a Claude
  session: a sandboxed call returns an empty `[]` indistinguishable from
  no sessions) plus legacy issue workers, and `reserved` = un-cleared
  reservation-ledger entries not already counted busy.
- Select at most `gap = min(pace target from dispatch-target-workers,
  max_concurrent_workers from dispatch.config/target-workers.json) −
  (busy + reserved)`. The bound is global across keyspaces, ticks, and
  workflows.
- Out of scope: pace-curve semantics, the `--exhausted` hard floor, and
  the pace-exempt probe lane (still admits at most one gate-exempt worker
  — bypassing the gate, not the count) all stay as the selector plan
  specifies; the tick workflow's `worker_cap` default 8 stays as a local
  backstop.

## Unit 2 — dead-claim ledger sweep at tick start

**Recommended model:** opus

**Dependencies:** Unit 1 (the ledger-reading accounting it protects).

Scope (`dispatch-select-tick`, same lock, before the gap computation):
- For each reservation-ledger claim, check liveness of its carrier — a
  live session under `.claude/worktrees/<node-id>`
  (`worktree_has_live_session`). A claim with no live carrier is cleared,
  with a logged line naming the claim and why, so the next selection can
  re-select the node from current graph state.
- Never clear a claim whose carrier is live; never trust a sandboxed
  `claude agents --json` result (empty `[]` on sandbox-blocked socket —
  the sweep must run where the daemon socket is reachable).
- The sweep is idempotent and runs every tick; it is the recovery path
  clarification 35 names (re-selection plus ledger sweep), not a session
  resume.

## Reuse

- `worktree_has_live_session` / `claude_sessions_under` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`
- `dispatch-target-workers` count mode and `--exhausted`
- The selection lock and reservation ledger from
  `tactic-graph-router-selector` Units 1–2
- `dispatch.config/target-workers.json` (`max_concurrent_workers`)

## Dependencies

`tactic-graph-router-selector` merged — the reservation ledger, selection
lock, and tick workflow this plan extends land with it (the `blocked_by`
edge). File anchors above name the selector PR's artifacts; take exact
lines from `main` after the merge.

## Verification

```verify
npm test --prefix packages/intentionsutil && .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

- Manual: with a claim held by a live session, a concurrent tick selects
  only the remaining gap; kill the session and confirm the next tick's
  sweep clears the claim (logged) and re-selects the node; two
  overlapping ticks never exceed `max_concurrent_workers` total across
  both keyspaces.
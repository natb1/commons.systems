---
id: tactic-fleet-alarm-busy-stall
kind: tactic
statement: No dispatch worker has been busy for a sustained span
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-fleet-alarm from an out-of-band fleet
  instrument reading. See the body for the reading.
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Invalid-state intervention could not release this node. The worker
    (session e94d9b62) declared its terminal disposition correctly -- a
    node-terminal marker naming this node with disposition no-claim is present
    in its job dir, and the digest cites no commit, no PR, and no graph write,
    so nothing durable is owed to the node. Only the release failed:
    dispatch-node-reap returned the verdict declined with claude_rm_rc=1, so the
    dead session still holds the node's worker slot and the router cannot
    re-select it. Two mechanisms are visible. First, the reap resolved the
    worktree from the NODE id (.claude/worktrees/tactic-fleet-alarm-busy-stall,
    which does not exist) and reported SESSION_REAP_NO_WORKTREE, while the
    session's real checkout is registered under the LANE-prefixed name
    align-tactics-fleet-alarm-busy-stall -- so it removed nothing before
    attempting the session removal. Second, the session removal itself exited
    non-zero and the daemon still reports the session. The real worktree was
    verified safe to remove at intervention time: registered in git worktree
    list, empty git status --porcelain, on its own branch at the same commit as
    origin/main, zero commits ahead. The cause is recorded as a new occurrence
    on tactic-invalid-state-rc-0b9860b2, whose prior occurrence blamed an
    already-missing checkout -- this occurrence refutes that precondition.
    Caveat for the operator: this is a mechanically-minted fleet-alarm node, so
    this park may be silently overwritten by the next dispatch-fleet-alarm
    re-mint while the underlying alarm condition persists (tracked on
    tactic-fleet-alarm-node-park-clobber-loop). The durable record of this
    intervention lives on tactic-invalid-state-rc-0b9860b2, not here."
  since: 2026-08-09
  recommendation: "Run these two commands from the project root, in this order:
    git worktree remove
    /home/n8/natb1/commons.systems/.claude/worktrees/align-tactics-fleet-alarm-\
    busy-stall && claude rm e94d9b62 -- note the worktree path uses the
    align-tactics- prefix, not the node id. Then confirm the release with:
    claude agents --json --all (no row should remain whose name is
    tactic-fleet-alarm-busy-stall other than a live one). If the session removal
    still exits non-zero, the node stays frozen and the fix belongs to
    tactic-invalid-state-rc-0b9860b2; do not attach to or resume session
    e94d9b62, which is not a recovery path. No work is at risk: the worker's
    checkout is clean and holds no commits beyond origin/main."
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
zero busy dispatch workers have been observed continuously for longer than the 2700s stall limit

Threshold: DISPATCH_FLEET_WATCH_IDLE_LIMIT=2700s
State file: /home/n8/.local/share/commons-dispatch/fleet-watch-state.json (busy_zero_since — the live value is in this pass's
journald output and in --json)
Pause state: not-paused

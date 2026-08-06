---
id: tactic-fleet-alarm-watch-unknown
kind: tactic
statement: dispatch-fleet-watch could not read 1 of its inputs this pass
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
  reason: "Held by a terminal, already-declared session that the reap could not
    release. Session 3dc03651-34f4-468c-997a-cdc7c60a4501 (job 3dc03651)
    declared its terminal disposition correctly — a node-terminal marker naming
    this node with disposition no-claim is present in its job dir, and the pass
    rightly declined to write a mechanically-managed fleet-alarm node. Only the
    release failed: the worktree checkout is already gone, and
    dispatch-node-reap returned verdict 'declined' with claude_rm_rc=1, so the
    daemon still reports the session, it still holds a worker slot, and worktree
    occupancy stays 'terminal' — the node is unselectable by the router and no
    fuse counts a re-selection. The node itself carries no unlanded work: phase
    and office_hours are both null on origin/main and there is no PR on its
    head. Root cause is recorded separately on
    tactic-invalid-state-rc-0b9860b2."
  since: 2026-08-06
  recommendation: "Release the stranded session slot by hand: run 'claude rm
    3dc03651-34f4-468c-997a-cdc7c60a4501' from an interactive terminal (the
    reap's non-TTY call exited 1). If it exits non-zero again, restart the
    supervisor with 'systemctl --user restart dispatch-claude-daemon.service'
    and re-check with 'claude agents --json --all'. No 'git worktree remove' is
    needed — the checkout at .claude/worktrees/tactic-fleet-alarm-watch-unknown
    is already absent and its git registration already pruned. Once 'claude
    agents --json --all' no longer lists session
    3dc03651-34f4-468c-997a-cdc7c60a4501, clear this park with
    'packages/intentionsutil/scripts/clear-park
    tactic-fleet-alarm-watch-unknown'; the node needs no other repair. Do not
    attach to or resume the dead session — attach is not a recovery path here."
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
One or more fleet-health inputs were unreadable on this watcher pass. An
unreadable input is reported as UNKNOWN, never as clear — a false all-clear is
the failure this watcher exists to prevent.

Unreadable inputs:
- tick-stale: last decision-log line has no parseable .ts: /home/n8/.local/share/commons-dispatch/routing-decisions.jsonl

Pause state: not-paused
Decision log: /home/n8/.local/share/commons-dispatch/routing-decisions.jsonl
State file: /home/n8/.local/share/commons-dispatch/fleet-watch-state.json

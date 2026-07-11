---
id: tactic-dispatch-daemon-unattended-reading
kind: tactic
statement: "take the unattended-drain reading: across a real logout window the
  managed daemon stayed live and ticking with no interactive session
  substituting, and backlog/escalations stayed in band"
owner: human
status: delegated
parent: null
rationale: "The signal-validating terminal of strategy-autonomous-execution
  round 1: the threshold names a logout window with no interactive session,
  which only the author can produce — the reading is inherently not
  claude-executable. Born-parked per /align-tactics Step 4. Recorded 2026-07-11
  /align-tactics round."
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
validates:
  - strategy-autonomous-execution
blocked_by:
  - tactic-dispatch-daemon-liveness-sensor
office_hours:
  reason: "Needs the author: the unattended-drain reading requires a real logout
    window — log out (no interactive claude session), leave the managed daemon
    running for at least several hours or overnight, then take the reading on
    return. Blocked on tactic-dispatch-daemon-liveness-sensor landing first.
    Roughly 20 author-minutes on return."
  since: 2026-07-11
  recommendation: "On return: run
    .claude/skills/dispatch-propagate/scripts/dispatch-daemon-liveness --json;
    confirm the verdict is managed-live, ActiveEnterTimestamp predates the
    logout window, NRestarts is unchanged across it, and no transient daemon
    substituted. Count backlog (open phase-set tactics) and escalations (nodes
    with office_hours set) in intentions/ — the gh-fed dashboard panels are
    retired per the strategy 2026-07-11 clarification. Record reading and gap on
    strategy-autonomous-execution via write-node.ts + graph-commit and bump
    rounds to {count: 1, last_completed: <date>} — this is the round final
    tactic."
pace_exempt: false
rounds: null
attributes: {}
---
# take the unattended-drain reading

Born-parked (needs the author): the strategy's threshold names a real logout
window with no interactive session substituting a transient daemon — only the
author can produce that condition, so the reading is not claude-executable.
The procedure lives in `office_hours.recommendation`. Blocked on
`tactic-dispatch-daemon-liveness-sensor` landing first.

This is the round's final tactic: completing it records `reading`/`gap` on
`strategy-autonomous-execution` and bumps `rounds` to
`{count: 1, last_completed: <date>}`.

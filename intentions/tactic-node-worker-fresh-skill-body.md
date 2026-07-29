---
id: tactic-node-worker-fresh-skill-body
kind: tactic
statement: A node-worker session reads its skill body from fresh state rather
  than from the node's own possibly-stale worktree — closing the conflict lane's
  guaranteed-stale case, where exit 11 spawns Lane 3 into the very checkout
  whose merge with origin/main just failed
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Observed live: Lane 3 landed on main 2026-07-28T16:05 and the tick
  spawned it at 16:39 into a worktree 142 commits behind whose
  dispatch-conflict/SKILL.md carried only Lanes 1-2; the session read pre-Lane-3
  instructions, found office_hours null, took Lane 2's 'wrong tool for this
  node' dead end, and the real conflict went unresolved. Structural, not
  incidental: provision exit 11 fires BECAUSE the worktree's merge with
  origin/main failed (provision-node-worktree:126-129), and
  dispatch-graph-execute:274 then spawns the lane with --cwd on that same
  checkout. Generalizes to every phase skill spawned into a node worktree.
  Candidate directions (not yet decided): freshen the checkout before the lane
  reads its body, or source skill bodies from the primary checkout at spawn
  time. Needs /align-tactics to pick one and plan it."
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
# A node-worker session reads its skill body from fresh state rather than from the node's own possibly-stale worktree — closing the conflict lane's guaranteed-stale case, where exit 11 spawns Lane 3 into the very checkout whose merge with origin/main just failed

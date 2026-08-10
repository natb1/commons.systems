---
id: tactic-rsi-implement-skill
kind: tactic
statement: Build the rsi-implement orchestration loop in /rsi — serially drive a
  claimed node through the existing dispatch phase skills as spawned sessions,
  to merge and main-qa
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-10 /align interview; re-scoped in the same
  day's review round: not a separate skill surface — a thin loop reusing the
  dispatch phase skills verbatim via dispatch-graph-execute /
  dispatch-spawn-job."
reading: null
serves:
  - strategy-recursive-self-improvement
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
attributes:
  rsi_cost: 1
---

## Draft context (2026-08-10 /align interview; re-scoped same-day review round)

- Not a separate orchestration surface and not an Agent-tool subagent (an
  Agent subagent cannot run the Workflow-dependent phase skills). A thin loop
  in /rsi:
  1. Claim the node under the standard discipline (worktree-as-claim,
     launch-path refusal of an already-claimed node).
  2. Serially spawn the existing dispatch phase skill for the node's persisted
     phase via dispatch-graph-execute / dispatch-spawn-job — the monitor's
     proven hand-dispatch path.
  3. Await the session's terminal disposition; verify the transition off
     origin/main; repeat for the next phase.
  4. Merge is the tick's merge lane, which runs while paused — never
     hand-merge.
  5. On a park or non-mechanical blocker: throw to the /rsi main thread, which
     conducts an office-hours session attended and updates rsi-plan.
- Reuses the dispatch skills verbatim — quality bar identical because the
  skills are identical (strategy condition 3). Unit-level model selection
  stays inside the phase skills' own heuristics.
- Inefficiencies surfaced by orchestration are tracked in the graph and
  reflected in rsi-plan.
- Costs 1 against the rsi session budget.

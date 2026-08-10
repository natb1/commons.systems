---
id: tactic-rsi-plan-skill
kind: tactic
statement: Build the /rsi-plan skill — subagent that refreshes rsi-plan.md
  metrics and summaries and re-evaluates the rsi task plan
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-08-10 /align interview; step 1 of every /rsi iteration.
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
attributes: {}
---
# Build the /rsi-plan skill — subagent that refreshes rsi-plan.md metrics and summaries and re-evaluates the rsi task plan

## Draft context (2026-08-10 /align interview)

- Runs as a subagent invoked by /rsi step 1. Delegates to scripts wherever the
  content is mechanical (metrics, censuses); prose judgment stays in the skill.
- Refreshes rsi-plan.md's six required sections: top author priorities (with
  the dispatch-delegated and rsi-planned subsets); status of dispatch-delegated
  priorities with expected completion dates; critical office-hours parked nodes
  and what each blocks (dispatch vs other priorities); metrics — a subset of
  graph-collected signals with review thresholds; recommended additional
  telemetry for author comprehension (if any); the rsi task plan.
- Re-evaluates the task plan: removes completed tasks, identifies critical
  tasks not yet on the plan.
- Candidate scripted metrics (from the bootstrap monitor practice): backlog
  band (open+born-parked share, threshold 35% non-increasing), parked
  critical-path count via office-hours-select --list rank-lift NOTE lines,
  held-session and worktree census, pause state, done-count trend.

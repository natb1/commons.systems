---
id: tactic-rsi-plan-skill
kind: tactic
statement: Build the /rsi-plan rendering skill and render-rsi-plan.ts —
  regenerate rsi-plan.md from graph state, draft the three queue summaries as
  readings, flag mechanical staleness
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-10 /align interview; re-scoped in the same
  day's review round: rendering only — the judgment step (graph updates,
  routing, align-need, task-plan revision) moved to the /rsi main thread."
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

## Draft context (2026-08-10 /align interview; re-scoped same-day review round)

- Rendering only — judgment moved to the /rsi main thread. Runs as a subagent
  invoked by /rsi step 1.
- render-rsi-plan.ts regenerates every rsi-plan.md section from graph state:
  priorities from tier/rank; dispatch status from node phases and PR state;
  critical parked nodes from office-hours-select --list (rank-lifted NOTE
  lines — never a hand-rolled probe); metrics from registered sensors/readings;
  the task plan from its graph nodes. A hand-edited section is a defect
  (strategy condition 5).
- The three model-generated queue summaries (dispatch queue, office-hours
  queue, rsi plan) are drafted by this skill and landed as dated readings on
  their owning strategy nodes — dispatch → strategy-graph-native-dispatch,
  office-hours → strategy-attention-surface, rsi →
  strategy-recursive-self-improvement — then rendered from there. Source of
  truth is the graph, never the .md.
- Flags mechanical staleness for the main thread's judgment step: completed
  tasks whose nodes are done, thresholds breached, expected-completion dates
  passed.
- Metric implementation registers sensors in the existing
  success_signal/readings machinery on the owning strategies (strategy
  condition 8), reducing the standing unregistered-sensor gap
  (strategy-graph-drives-dispatch reading) rather than adding a registry.
- Includes per-workflow token attribution (dispatch / office-hours / rsi) —
  reuse /dispatch-token-audit's attribution machinery where possible.

---
id: tactic-rsi-skill
kind: tactic
statement: Build the /rsi skill — the serialized recursive-self-improvement iteration loop
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-08-10 /align interview recording
  strategy-recursive-self-improvement; the skill is the strategy's primary
  artifact.
reading: null
serves:
  - strategy-recursive-self-improvement
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

## Draft context (2026-08-10 /align interview; amended same-day review round)

Skill spec, from the recorded requirement and the review-round resolutions:

- One iteration per invocation; attended, author-invoked, never cron
  (strategy condition 9).
- Serialization: claim the strategy-recursive-self-improvement worktree
  (worktree-as-claim, the router's liveness rule) at invocation; fail closed
  with a printed error when the claim is held. No second detection mechanism.
- Iteration flow:
  1. Subagent /rsi-plan renders: run render-rsi-plan.ts, draft the three queue
     summaries (landed as dated readings on strategy-graph-native-dispatch,
     strategy-attention-surface, strategy-recursive-self-improvement), flag
     mechanical staleness (done tasks, breached thresholds).
  2. Main-thread judgment (this skill, never the subagent): what graph updates
     are required; harness vs rsi-shortcut routing per item; whether an /align
     session is needed for author input; task-plan revision.
  3. Optional /align escalation for findings unresolvable from recorded
     guidance.
  4. Either draft tactics for harness optimization (3a) or execute rsi-plan
     tasks to budget (3b). Budget: default 1; rsi-implement tasks cost 1;
     others 0 unless declared.
- rsi-implement is a loop inside this skill (see tactic-rsi-implement-skill).
- Pause/resume: through the doctrinal mechanism (dispatch.config boolean once
  tactic-dispatch-pause-config-field lands; sentinel interim); resume criteria
  recorded as structured, mechanically evaluable data rendered into
  rsi-plan.md.
- Evaluation scope each iteration: bugs inconsistent with documented
  intention; execution inefficiencies (token waste from poorly managed
  context, unoptimized model choice, redundant work, repeated errors);
  ambiguities in author intention (e.g. parked office-hours nodes on the
  critical path); technical debt not justified by current greenfield design.
- Fitness function (strategy clarification 10): value delivered by the
  combined dispatch + office-hours + rsi system toward author intentions —
  closure velocity + signal progress per token, attributed per workflow;
  dispatch expected to dominate spend.
- rsi is not a graph executor — planning and critical-path shortcutting only.

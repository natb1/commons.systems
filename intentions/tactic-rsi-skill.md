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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the /rsi skill — the serialized recursive-self-improvement iteration loop

## Draft context (2026-08-10 /align interview — retained for /align-tactics or /rsi bootstrap)

Skill spec, from the recorded requirement:

- One iteration per invocation. Automatically serialized: at invocation, detect
  any already-active rsi session and fail with a printed error instead of
  running (mechanism candidates: the live-session registry the claim discipline
  already uses, keyed on an rsi session name; must fail closed).
- Execution flow per iteration:
  1. Invoke a subagent with /rsi-plan to refresh rsi-plan.md metrics and
     summaries (scripts where possible) and re-evaluate the task plan (remove
     completed tasks; surface critical tasks missing from the plan).
  2. Optionally run /align when rsi-plan construction reveals findings that
     need author input and cannot be resolved from existing graph guidance.
  3. Either (a) update the graph / draft tactics for harness optimization or
     graph quality — updating rsi-plan when drafts are routed to rsi-implement —
     or (b) execute rsi-plan tasks until the session budget is exhausted.
- Budget accounting: default budget 1 per session; /rsi-implement costs 1;
  other tasks cost 0 unless the task declares a cost.
- Task types include: rsi-implement invocations; pausing/resuming the dispatch
  queue on integrity errors (pause always records resume criteria in
  rsi-plan.md); any additional standard planning steps the rsi requirements
  justify.
- When rsi-implement throws, the main-thread rsi session conducts an
  office-hours session and updates rsi-plan.
- Tactic drafting inside rsi uses the common drafting standards extracted from
  /align (see tactic-dispatch-skill-standards-extraction).
- Evaluation scope each iteration: bugs inconsistent with documented intention;
  execution inefficiencies (token waste from poorly managed context,
  unoptimized model choice, redundant work, repeated errors); ambiguities in
  author intention (e.g. parked office-hours nodes on the critical path);
  technical debt not justified by current greenfield design.
- rsi is not a graph executor — planning and critical-path shortcutting only.

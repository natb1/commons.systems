---
id: tactic-rsi-implement-skill
kind: tactic
statement: Build the /rsi-implement skill — shortcut implementation
  orchestration for high-impact critical-path nodes under dispatch-equivalent
  standards
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-08-10 /align interview; the budgeted
  implementation arm of /rsi.
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
# Build the /rsi-implement skill — shortcut implementation orchestration for high-impact critical-path nodes under dispatch-equivalent standards

## Draft context (2026-08-10 /align interview)

- Invoked as a sonnet subagent by /rsi for shortcut implementation of
  high-impact, critical-path items (e.g. critical bugs affecting harness
  integrity), bypassing the harness's orchestration scripts while keeping the
  harness's quality standards.
- Orchestrates a node all the way through merge and main-qa; on a blocker the
  subagent cannot complete and the main thread cannot mechanically resolve, it
  throws to the main-thread rsi session, which conducts an office-hours
  session and updates rsi-plan.
- Invokes the subset of dispatch-skill instructions extracted as common skills
  (tactic-dispatch-skill-standards-extraction): planning standards from
  /align-tactics (unit breakdown, per-unit model selection per the
  model-selection heuristic), QA strategies from /qa-fix, review standards from
  /review-fix, variance/conflict handling shared with /dispatch-conflict and
  the dispatch scripts.
- Claims its node under the same serialization discipline as dispatch
  (worktree-as-claim, launch-path refusal) — a node is never worked
  concurrently by dispatch and rsi.
- Inefficiencies surfaced by orchestration are tracked in the graph and in the
  rsi-plan.
- Costs 1 against the rsi session budget.

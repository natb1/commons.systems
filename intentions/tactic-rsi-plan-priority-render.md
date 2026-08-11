---
id: tactic-rsi-plan-priority-render
kind: tactic
statement: Rework rsi-plan.md rendering — priority-ordered node listing with
  parent/phase/ETA columns, velocity-derived delivery dates, typed task-plan
  rows with reasoning
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-08-11 /align interview on rsi-plan tactical
  priorities; carries the render-rsi-plan.ts format requirements the amended
  what-must-rsi-plan.md-contain clarification records.
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
# Rework rsi-plan.md rendering — priority-ordered node listing with parent/phase/ETA columns, velocity-derived delivery dates, typed task-plan rows with reasoning
## Draft context (2026-08-11 /align interview)

render-rsi-plan.ts changes, from the amended rsi-plan.md contents
clarification on strategy-recursive-self-improvement:

- Section 1 (top author priorities): add an estimated-delivery-date column.
- Section 2 (dispatch status): replace the phase-grouped nodes table with a
  top-ranking node listing ordered by (tier, rank) — one node per line,
  never grouped by phase — columns: parent strategy, phase, estimated
  delivery date.
- Estimated delivery dates are DERIVED at render time. Velocity = the
  dispatch queue's 28d closure rate in closures/day (from the existing
  created/closed series). Tactic row (section 2): ETA = today +
  (1-based position in (tier, rank) order ÷ velocity) days. Strategy row
  (section 1): ETA = today + (open-tactic count under the strategy ÷
  velocity) days — drain time of its open children. Never stored — the
  same derived-on-read doctrine as rank itself. Zero velocity (paused
  queue) renders honestly as "unavailable".
- Section 6 (task plan): add a type column (implementation, pause queue,
  …) from attributes.rsi_task.type; replace the state column with a
  reasoning column from attributes.rsi_task.reasoning; cost column shows
  the DERIVED cost (implementation ⇒ 1 always, declared cost ignored;
  others rsi_task.cost default 0). The legacy standalone attributes.rsi_cost
  is retired: repoint its existing carriers to rsi_task.cost in this change.
- New FLAG kinds: an implementation row whose reasoning omits the
  rsi-vs-dispatch justification; a declared rsi_task.cost contradicting the
  derivation; a standalone legacy rsi_cost field (retired); optionally a
  priority_log entry newer than the last render (reprioritization
  happened — surface what moved).
- Render the per-iteration reprioritization delta (what /rsi-evaluate
  moved, from priority_log entries dated this iteration).
- Reprioritization-outcome section (the post-hoc fitness audit the
  steelman mitigation names): derived at render by joining priority_log
  entry dates with node closure dates — did nodes the model front-loaded
  close faster than the queue's baseline closure interval? Derived-on-read,
  no new stored state; renders "insufficient data" honestly until enough
  reprioritized nodes have closed.

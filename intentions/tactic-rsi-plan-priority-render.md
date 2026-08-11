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
  - strategy-rsi-plan-surface
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

> **PARTIALLY SUPERSEDED 2026-08-11, later the same day.** The two bullets
> immediately below — the section 1 and section 2 format specs — are
> superseded by `tactic-rsi-plan-merged-priority-table`, which merges
> sections 1, 2, and 3 into a single tier-banded table grouped by strategy
> lineage. Do **not** implement them as written: section 1's strategy rows
> become that table's group header rows, and section 2's node listing becomes
> its ordinary rows. They are kept here rather than deleted because the
> merged table's dependency on this node is exactly the ETA derivation and
> the `(tier, rank)` ordering these bullets introduced.
>
> This node's surviving scope: the ETA derivation, the section 6 task-plan
> changes, the flag kinds, the per-iteration reprioritization delta, and the
> reprioritization-outcome audit. Authoritative format contract for the table
> itself is the "What is the shape of the merged priority table" clarification
> on `strategy-rsi-plan-surface`.

render-rsi-plan.ts changes, from the amended rsi-plan.md contents
clarification on strategy-recursive-self-improvement:

- Section 1 (top author priorities): add an estimated-delivery-date column.
  *(superseded — becomes the merged table's group header rows)*
- Section 2 (dispatch status): replace the phase-grouped nodes table with a
  top-ranking node listing ordered by (tier, rank) — one node per line,
  never grouped by phase — columns: parent strategy, phase, estimated
  delivery date. *(superseded — becomes the merged table's ordinary rows;
  the never-grouped-by-phase requirement survives unchanged)*
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

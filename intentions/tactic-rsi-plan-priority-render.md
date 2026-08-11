---
id: tactic-rsi-plan-priority-render
kind: tactic
statement: Type the rsi-plan.md task-plan section and add the renderer's
  staleness FLAG kinds — attributes.rsi_task type/reasoning/derived-cost
  columns, retiring the legacy standalone rsi_cost field
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
# Type the rsi-plan.md task-plan section and add the renderer's staleness FLAG kinds — attributes.rsi_task type/reasoning/derived-cost columns, retiring the legacy standalone rsi_cost field
## Scope (2026-08-11 /align interview, re-scoped after adversarial review)

> **Re-scoped 2026-08-11, later the same day.** This node was created as a
> broad "rework rsi-plan.md rendering" tactic and was then left *partially
> superseded*, carrying dead section-1/section-2 format bullets annotated in
> place, plus an ETA derivation and a reprioritization audit that belonged
> elsewhere. An adversarial review found the arrangement unexecutable: this
> node was the `blocked_by` blocker of
> `tactic-rsi-plan-merged-priority-table`, so it had to land first, yet its
> surviving scope was defined entirely against the sections that table
> deletes. The decomposition was wrong, not the prose. It is now split three
> ways and **no superseded content remains anywhere** — the dead bullets are
> deleted, not annotated:
>
> | went to | content |
> |---|---|
> | `tactic-rsi-plan-merged-priority-table` | the merged table **and** the ETA derivation (its only consumer); the `blocked_by` edge is dropped |
> | `tactic-rsi-reprioritization-outcome-audit` | the per-iteration reprioritization delta and the post-hoc outcome audit, under `strategy-rsi-delegated-prioritization`, whose signal they move |
> | **this node** | everything below |

All work is in `packages/intentionsutil/scripts/render-rsi-plan.ts`.

### Section 6 — type the task plan

- Add a **type** column sourced from `attributes.rsi_task.type`
  (`implementation`, `pause queue`, …).
- Replace the state column with a **reasoning** column from
  `attributes.rsi_task.reasoning`.
- The cost column shows the **derived** cost: `implementation ⇒ 1` always,
  with any declared cost ignored; every other type takes
  `rsi_task.cost`, defaulting to 0.
- Retire the legacy standalone `attributes.rsi_cost` field: repoint its
  existing carriers to `rsi_task.cost` as part of this change.

Section 6 stays a separate section and does **not** fold into the merged
priority table — its `type` values include `pause queue`, which is not a graph
tactic and has no parent strategy, phase, or ETA. That exclusion is recorded
on `strategy-rsi-plan-surface`.

### FLAG kinds

New staleness flags on the existing `FLAG <kind> <subject> — <detail>` stderr
stream:

- an `implementation` row whose reasoning omits the rsi-vs-dispatch
  justification;
- a declared `rsi_task.cost` contradicting the derivation above;
- a standalone legacy `rsi_cost` field (retired by this change);
- optionally, a `priority_log` entry newer than the last render —
  reprioritization happened, so surface that it did. (Rendering *what moved*
  is `tactic-rsi-reprioritization-outcome-audit`'s job; this flag only
  reports that the log advanced.)

The FLAG stream is load-bearing beyond this node: it is the sensor for
`strategy-rsi-plan-surface`'s success signal, which counts sections the
renderer cannot derive. A flag added here must name the section it is about,
so the count is attributable.

### Verification

- Render against the live graph and confirm section 6 shows type, reasoning,
  and derived cost, with an `implementation` row's cost reading 1 even when
  its node declares otherwise.
- Confirm a node still carrying a standalone `attributes.rsi_cost` raises the
  retired-field flag, and that no such node remains after the repoint.
- Confirm sections 1–3 (the merged table), 4, and 5 are untouched by this
  change — this node no longer has any claim on them.

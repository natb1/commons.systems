---
id: tactic-office-hours-session-type-strategy-review
kind: tactic
statement: "add strategy-review as the third office_hours.session_type class —
  sittings where the author reads metrics (budget, pace, attention) to direct
  strategy rather than to answer a requirement question — and backfill the class
  onto the parks already labelled for it in prose"
owner: ai
status: raw
parent: null
rationale: "Author direction 2026-07-25, at the close of the office-hours drain
  sweep. strategy-attention-surface's 2026-07-23 clarification fixed
  office_hours.session_type as a CLOSED enum {requirement-discovery,
  curriculum-review, other}, implemented at tactic-office-hours-session-type (PR
  #2961). The author identified a third class the enum cannot express: a sitting
  whose input is METRICS, not a question — the author reads budget/pace/attention
  numbers and the output is a strategy direction. Filing this separately rather
  than widening PR #2961 in flight: that node is phase qa and currently parked at
  its qa-fix attempt cap with 3 residue items, so editing its scope would move
  its scope fingerprint under a parked PR and muddy an already-blocked review.
  Because the enum member does not exist yet, parks in this class are labelled in
  PROSE today — validateOfficeHours (schema.ts:571-580) rebuilds the object from
  exactly {reason, since, recommendation}, so an extra session_type key on a park
  is SILENTLY DROPPED on any writeNode, not rejected. Backfilling those prose
  labels into the structured field is part of this node's scope."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-office-hours-session-type
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add strategy-review as the third office_hours.session_type class, and backfill the parks currently labelled for it in prose

## Context

`office_hours.session_type` is a closed, schema-validated enum introduced by
`strategy-attention-surface`'s 2026-07-23 clarification and implemented at
`tactic-office-hours-session-type` (PR #2961, phase qa). Its three members today
are `requirement-discovery`, `curriculum-review`, and `other` (the default when
absent), and the selector applies a shared soft penalty (attention x 0.5) to the
first two so whole classes of deferrable sittings sink below actionable work
without a hard tier floor.

The author added a third class on 2026-07-25: **`strategy-review`** — a sitting
whose input is *metrics rather than a question*. The author reads numbers (budget
figures, pace/velocity, attention distribution) and the output is a direction for
strategy. This is distinct from `requirement-discovery`, where the blocker is an
unanswered requirement question, and from `curriculum-review`, where the blocker
is reading/comprehension work.

It belongs in the penalized group for the same reason the other two do: it is
author-scheduled, recurs, and should not compete at full attention rank with
blocked execution work every tick.

## Why this is a separate node from PR #2961

`tactic-office-hours-session-type` is `phase: qa` with an active
`office_hours` park: its qa-fix lane hit `ATTEMPT_N=2 == CAP=2` with three
residue items outstanding (an `office-hours-graph --list` column-desync
regression, an `undefined` leak in the `--type` error message, and an
API-contract hardening decision). Widening that node's scope now would move its
scope fingerprint while it is parked mid-review. This node therefore
`blocked_by` it and lands the enum extension afterwards.

## Scope

1. **Extend the enum.** In whatever module PR #2961 lands `SessionType` in
   (planned as `packages/intentionsutil/src/officeHours.ts` per that node's plan
   at `:232-236`): add `"strategy-review"` to both the type union and the runtime
   array. Add it to the penalized set alongside `requirement-discovery` and
   `curriculum-review` — the same single named constant, not a new one (that
   node's plan puts the predicate at `:341`).
2. **Extend the `--type` filter** and its unknown-value error message, which
   enumerates the valid members (`:388`).
3. **Backfill the prose-labelled parks.** Set `session_type: strategy-review` on
   every park whose reason/recommendation names the class in prose. Known at
   filing time: `tactic-budget-strategy-review-reading` (born parked
   2026-07-25 for exactly this class). Re-grep at implementation time rather
   than trusting this list — the drain sweep may add more.
4. **Out of scope:** the three residue items on PR #2961; any change to the
   penalty *value*; the STATUS page signal queue (untouched by the parent
   clarification and untouched here).

## Reuse

- `SessionType` union + members array + penalty predicate + `--type` parser —
  all introduced by `tactic-office-hours-session-type`; this node only widens
  them. Read that node's body (`:202-600`) for the exact shapes before editing.
- `validateOfficeHours` — `packages/intentionsutil/src/schema.ts:571-580`. Note
  it currently reconstructs the object from three keys only; PR #2961 is what
  adds `session_type` to it. If that landed differently than planned, follow
  what is on main, not this description.
- Selector ranking — `packages/intentionsutil/src/officeHours.ts` and
  `packages/intentionsutil/scripts/office-hours-select.ts`.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Plus:

- Unit: a `strategy-review` park ranks at `attention x penalty`, matching a
  `curriculum-review` park of identical attention.
- Unit: `--type strategy-review --list` lists only strategy-review parks; an
  unknown `--type` names all four members in its error.
- Judgment: `office-hours-select --list` shows the backfilled budget node in the
  penalized band, below actionable execution parks of comparable attention.

## Dependencies

`tactic-office-hours-session-type` (PR #2961) must land first — it introduces
every symbol this node widens.

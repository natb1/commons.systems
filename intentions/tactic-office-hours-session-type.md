---
id: tactic-office-hours-session-type
kind: tactic
statement: "Add office_hours.session_type (closed enum: requirement-discovery,
  curriculum-review, other) and soft-penalty type-aware ranking plus type
  filtering to the office-hours selector"
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-23 /align-strategy interview recording the
  office-hours session-type requirement on strategy-attention-surface (see its
  2026-07-23 clarification). strategy-graph-native-dispatch is co-served because
  the office_hours park record schema is its projection doctrine.
reading: null
gap: null
serves:
  - strategy-attention-surface
  - strategy-graph-native-dispatch
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
# Add office_hours.session_type (closed enum: requirement-discovery, curriculum-review, other) and soft-penalty type-aware ranking plus type filtering to the office-hours selector

Retained interview context (2026-07-23 /align-strategy round on
strategy-attention-surface; see its 2026-07-23 clarification for the doctrine):

- **Schema**: add optional `session_type` to the `OfficeHours` park record
  (`packages/intentionsutil/src/schema.ts:141`, `validateOfficeHours` around
  `schema.ts:618`). Closed enum: `requirement-discovery` | `curriculum-review`
  | `other`. Absent ⇒ `other` (default applied at validation, like other
  schema defaults). validate-graph rejects unknown values — clear error over
  fallback, per repo style.
- **Ranking**: in `packages/intentionsutil/src/officeHours.ts` (queue built at
  `officeHoursQueue`, sorted rank-descending at lines 38-39), apply
  `rank × SESSION_TYPE_PENALTY` for `requirement-discovery` and
  `curriculum-review` parks. `SESSION_TYPE_PENALTY = 0.5`, one shared named
  exported constant (author-tunable; both types share it so they rank at the
  same level relative to each other). Soft penalty by design: a sufficiently
  boosted node can still surface — never a hard tier floor.
- **Selection by type**: `office-hours-select.ts` grows a type filter (e.g.
  `--type requirement-discovery`) so the author can pull sittings of one type
  on demand; `--list` displays each park's session_type and its penalized
  rank.
- **Backfill**: label existing parks — at minimum `strategy-recover-attention`
  (`requirement-discovery`, per its 2026-07-23 re-park reason) and the
  `tactic-reading-chunk-*` / `tactic-dialog-review-*` curriculum parks
  (`curriculum-review`). Unlabeled remainder defaults to `other`, so backfill
  is safe to do incrementally.
- **Verification (the requirement's signal lives here, per the interview)**: a
  unit test that a penalized-type park ranks below an `other` park of equal
  raw attention AND that a boosted penalized park can overtake (soft, not
  hard); `--list` output shows type + penalized rank; validate-graph rejects
  an unknown session_type value.

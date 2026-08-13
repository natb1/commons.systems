---
id: tactic-audit-review-effort-yield-lens
kind: tactic
statement: Add a review-effort yield lens to the token audit's shared lens
  catalog — findings and applied fixes per built-in /code-review run, bucketed
  by effort level, so the `high` raise can be compared against its own `low`
  baseline
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 in the /align round that raised the review
  lane's built-in /code-review from `low` to `high`. The author ruled that round
  measure-and-record with no thresholds asserted, and named the comparison that
  actually answers whether the raise was worth it: findings at `high` against
  the `low` baseline for comparable diffs. No sensor computes that today — the
  token-economy sensor reads spend and attribution, not per-effort review yield
  — so this is a missing lens rather than a missing query, and until it exists
  the raise is an unmeasured quality bet. Placement is fixed by condition 7
  (recorded 2026-08-12): the token audit is ONE instrument at two scopes, so a
  new lens is added to aggregate-usage.sh's shared catalog, never to a second
  parallel analysis. The lens is meaningful at both scopes and so is not tagged
  fleet-only: per-run it reports this run's realized wall clock, price-proxy
  draw, findings count and whether the run completed inside its budget or
  continued detached; fleet-wide it supports the effort-to-yield comparison
  across runs. Sibling to tactic-audit-cache-efficiency-lens and
  tactic-audit-instrument-scoping from the 2026-08-12 round, and it depends on
  the same instrument-scoping work. Report measured magnitudes only; assert no
  dollar or duration threshold, per the same discipline that restated
  clarification 18's range and tactic-review-verify-per-file-batching's 3.2x as
  an upper bound."
reading: null
serves:
  - strategy-token-economy
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
# Add a review-effort yield lens to the token audit's shared lens catalog — findings and applied fixes per built-in /code-review run, bucketed by effort level, so the `high` raise can be compared against its own `low` baseline

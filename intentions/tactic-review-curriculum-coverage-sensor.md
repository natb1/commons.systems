---
id: tactic-review-curriculum-coverage-sensor
kind: tactic
statement: "Add a review-coverage table to the graph digest / align-audit
  report: per durable-layer node its mode (re-validation vs confirmation),
  review path, and last-reviewed date — the mechanical sensor for
  strategy-graph-review-curriculum's coverage signal"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 review-curriculum interview: the
  strategy's success signal reads coverage (zero durable-layer nodes without a
  review path) but the only sensor today is owner review at office-hours.
  Coordinates with tactic-graph-digest-tooling (the digest is the natural host)
  and tactic-align-audit-skill (the audit report is where the table is read);
  mode is derivable from node status, so the table is computed, never
  hand-maintained."
reading: null
gap: null
serves:
  - strategy-graph-review-curriculum
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
# Add a review-coverage table to the graph digest / align-audit report: per durable-layer node its mode (re-validation vs confirmation), review path, and last-reviewed date — the mechanical sensor for strategy-graph-review-curriculum's coverage signal

Retained draft from the 2026-07-09 /align-strategy review-curriculum round —
input to a future /align-tactics pass; not yet a plan.

## Context

strategy-graph-review-curriculum's success signal reads coverage — zero
durable-layer nodes without a review path — but its only sensor today is
owner review at office-hours (is_proxy: true). This draft adds the mechanical
half: a review-coverage table listing, per durable-layer node (virtue,
strategy, kind, tradition, delegation): its mode (A re-validation vs B
confirmation, derived from status/held-on-trust markers), its review path
(frontier entry id, delegation review_window, condition sweep, or
frontier-reachable), and last-reviewed date (from dated clarifications /
last_exercised stamps).

Host: the graph digest (tactic-graph-digest-tooling) computes it; the
/align-audit report (tactic-align-audit-skill) reads it. Live tactics are
excluded from the denominator (covered through their serving strategy —
strategy clarification 2); a durable node with no derivable review path is a
finding, dispositioned like any audit finding.

Out of scope: the sitting machinery; enrollment at record time
(tactic-align-curriculum-maintenance).

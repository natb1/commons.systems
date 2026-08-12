---
id: tactic-audit-instrument-scoping
kind: tactic
statement: Give aggregate-usage.sh --session/--node scoping so one instrument
  and one lens catalog serve both the per-run session evaluation and the
  periodic fleet audit, with fleet-denominator lenses tagged fleet-only
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-12 /align round. The parsimony finding:
  /dispatch-token-audit and the session evaluation were never two analyses —
  aggregate-usage.sh already emits both per-session rows and window aggregates
  from one pipeline. Collapsing them to one instrument at two scopes removes the
  duplicate lens catalog without losing the fleet-sized denominators that cannot
  exist at n=1."
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
# Give aggregate-usage.sh --session/--node scoping so one instrument and one lens catalog serve both the per-run session evaluation and the periodic fleet audit, with fleet-denominator lenses tagged fleet-only

Drafted by the 2026-08-12 `/align` round, carrying the parsimony resolution
recorded that day on `strategy-token-economy` ("Can /dispatch-token-audit be
superseded entirely").

## The finding

The session evaluation and `/dispatch-token-audit` were never two analyses.
`aggregate-usage.sh` already computes per-session rows (`.sessions[]`) and
window aggregates from **one** pipeline, and its `by_phase` buckets already
carry `cache_creation` / `cache_read`. What duplicated was the *lens catalog*
and its drift, not the measurement.

## What changes

- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh` — add
  `--session <id>` / `--node <id>` scoping alongside the existing `--days <N>`.
  Same script, same JSON schema, same lens catalog at both scopes.
- `.claude/skills/dispatch-token-audit/SKILL.md` — reframe as the **fleet-scoped
  invocation** of that instrument, and tag each lens by the scope at which it is
  meaningful.
- The per-phase evaluator (`tactic-ladder-per-phase-evaluation`) invokes the
  same script scoped to its session, and never reads a transcript by hand.

## Fleet-only lenses

Absent at n=1, **never approximated** from one run — an n=1 hit-rate is a
category error, not a small sample:

- pooled `by_phase_outcome` rates (the routing-recommendation input)
- `lenses.baseline_context` median/peak
- `lenses.phase_standup`
- cross-session `tool_errors` signatures
- recurrence

Meaningful at both scopes: `tool_errors` (per-run), `payload_bytes`,
`context_over_120k`, cache efficiency (`tactic-audit-cache-efficiency-lens`),
permission friction (`tactic-audit-permission-friction`).

## Why not full supersession

Two reasons, both recorded. The fleet denominators above cannot be reconstructed
from ~5 sessions; and `strategy-token-economy`'s own `success_signal` is
**weekly allowance utilization**, which would be left with no weekly reader.

## Risk

"A scope filter, not a rewrite" is judgment from reading the pipeline's
structure, **not a measured diff** against a ~1000-line jq program. If scoping
turns out to require restructuring the aggregation, re-scope this unit rather
than forcing it.

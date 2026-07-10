---
id: tactic-status-kind-vocabularies
kind: tactic
statement: Each kind node declares its own status vocabulary; validateGraph
  checks a node's status against its kind's declaration
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round (author
  decision): status meant three things (central lifecycle enum; tradition
  provenance; tactic plan-written) — the field must not be overloaded, so the
  kind owns the vocabulary, exactly as it owns attributes."
reading: null
gap: null
serves:
  - strategy-graph-self-description
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
# tactic-status-kind-vocabularies

## Context

SCHEMA.md's central Status enum claimed fixed cross-kind meanings; kind-tradition
legitimately redefined it (delegated = scholarship on trust, codified =
personally verified). Decision: kind-declared vocabularies — self-describing,
no central enum.

## Scope

- Declaration convention: each kind node's attributes gains a status
  vocabulary declaration (values + one-line meanings) matching that kind's
  CURRENT stored values, so no node value changes at migration.
- schema.ts: validateNode keeps a loose non-empty-string check (per-node
  validation has no graph context); validateGraph gains the per-kind
  vocabulary check (it already resolves kind nodes).
- Compatibility: additive — align skills reference no central enum semantics;
  day-one declarations match stored values.
- Coordinate with tactic-schema-drift-guard (the declarations must be
  machine-comparable) and tactic-schema-md-deprecation (removes the central
  enum's doc home).

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

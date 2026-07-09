---
id: tactic-schema-drift-guard
kind: tactic
statement: CI drift guard — every field, rule, enum, and vocabulary schema.ts
  enforces must be declared on a kind node, checked mechanically
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round:
  self-description drift recurs unless guarded — the kind docs fell 6 rules and
  12 fields behind the code with the validator green throughout. Blocked by the
  deprecation tactic because the guard compares against kind-node declarations
  that tactic puts in place."
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
blocked_by:
  - tactic-schema-md-deprecation
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-schema-drift-guard

## Context

strategy-graph-self-description's success signal is 'what a fresh reader
derives from the kind nodes matches what schema.ts enforces'. This tactic is
its sensor: a CI check that fails when the code and the kind declarations
diverge, so drift becomes a red check instead of a periodic review finding.

## Scope

- A checkable declaration convention on kind nodes (machine-readable enough
  to compare: attributes.fields entries name the field; status vocabularies
  per tactic-status-kind-vocabularies; body-function declarations).
- A guard script (packages/intentionsutil/scripts/) comparing schema.ts's
  IntentionNode fields, PHASES/STATUSES(-successor), and validateGraph rule
  set against the kind-node declarations; clear error naming each undeclared
  or over-declared item (code-style: clear errors over fallbacks).
- Wire into CI on changes under intentions/ or packages/intentionsutil
  (run-lint.sh or a dedicated job).
- validateGraph gains kind-declaration-driven checks where practical
  (field kind-scoping read from kind nodes, replacing the hardcoded rule
  10-12 kind lists over time).

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
Plus: mutate a kind declaration locally and confirm the guard goes red.

---
id: tactic-delegation-classification-derivation
kind: tactic
statement: Delegation axes become enums and classification derives on read from
  the stated rule; the 21 records normalize in the same PR
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round:
  classification is declared 'derived from the two axes' but is stored,
  underived, and inconsistent (high-divergence records at platform, the
  worst-gated record at tool; enum drift like 'low-moderate' and 'moderate —
  would-be'). Author decision: mechanical derivation from enum-ized axes, with a
  guard."
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
# tactic-delegation-classification-derivation

## Context

kind-delegation now states the derivation rule (2026-07-09): captured = high
divergence OR gated/prohibitive recovery; platform = moderate divergence OR
high recovery cost; tool = otherwise. This tactic mechanizes it.

## Scope (ONE PR — enforcement plus normalization together)

- Enum-ize the axes in the records and the validator:
  divergence.level ∈ {low, moderate, high};
  irreversibility.recovery_cost ∈ {none, low, moderate, high, prohibitive};
  gated stays boolean. Prose nuance ('would-be', date qualifiers) moves to
  the record's rationale/audit narrative.
- classification leaves the stored attributes — derived on read by an
  intentionsutil helper implementing kind-delegation's rule (attention.ts's
  capture-resolution term is a consumer).
- Normalize all 21 delegation records to the enums in the same PR; where an
  axis value was prose-ambiguous, resolve per the record's rationale and note
  the resolution in the audit narrative.
- validateGraph (or the drift guard) enforces the enums on kind: delegation
  records — the guard the author required against re-drift.
- Declined records: classification derives over the would-be axes exactly as
  entered ones; the origin: declined field already marks them.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
! grep -rn "^  classification:" intentions/delegation-*.md
```

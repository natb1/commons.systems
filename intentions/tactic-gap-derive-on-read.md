---
id: tactic-gap-derive-on-read
kind: tactic
statement: gap leaves the stored model — deriveGap computes it on read, joining
  attention's derived-state doctrine
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: 31 of 47
  signal-bearing strategies stored gap: null against deriveGap's total rule
  (signal + null reading → 'no reading yet'), 6 stored the derived string, 3
  stored prose — three conventions for one derived value. Derived state is never
  stored."
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
# tactic-gap-derive-on-read

## Context

deriveGap (sensors.ts) is a total, local rule; storing its output invites the
drift the 2026-07-09 review found. Compatibility verified: attention.ts:55
and /align-tactics's eligibility prose both already carry '|| reading === null',
so the wrongly-stored nulls were never load-bearing — the switch is
behaviorally near-identical.

## Scope

- schema.ts: remove gap from IntentionNode/input types and validateNode
  (unknown keys are already dropped, so legacy files stay readable and
  normalize on their next rewrite — no flag day).
- Readers switch to deriveGap(node): goals.ts (sort + render),
  attention.ts:55 (signal-satisfaction term).
- read-sensors.ts stops writing gap (writes reading only).
- Before removal, review the 3 hand-written prose gaps
  (grep "^gap: " intentions/*.md | grep -v "null") and fold any real
  information into rationale or reading.
- SCHEMA.md/kind-doc text: gap documented as derived-on-read (coordinates
  with tactic-schema-md-deprecation; whichever lands second reconciles).

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
! grep -rn '"gap"' packages/intentionsutil/src/schema.ts
```

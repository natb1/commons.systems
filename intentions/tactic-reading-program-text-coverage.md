---
id: tactic-reading-program-text-coverage
kind: tactic
statement: Extend the reading curriculum with chunks covering every text a
  tradition record cites — the delegated→codified flip must be completable
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: five
  tradition records cite texts no curriculum chunk covers, so their status flip
  (delegated → codified, per kind-tradition: records flip as the reading program
  covers their texts) cannot complete as encoded. Texts are the doctrine's
  actual sources — the curriculum extends; the texts stay."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# tactic-reading-program-text-coverage

## Context

kind-tradition's status doctrine says records flip delegated → codified one at
a time as tactic-tradition-reading-program covers their texts. Coverage audit
(2026-07-09 review): five records cite texts absent from every chunk.

## Scope

- Recompute the coverage diff mechanically: for each tradition record, its
  attributes.texts vs the union of passages across tactic-reading-chunk-*
  nodes (and curriculum metadata); list every uncovered text.
- For each uncovered text, either add a curriculum chunk (following the
  existing chunk-node convention: passages + questions as the unique payload)
  or — where a text is cited for provenance but not load-bearing for any
  adopted/diverged entry — note on the tradition record that the flip
  excludes it, so the flip criterion stays honest.
- Sequencing of new chunks follows the curriculum's existing ordering
  doctrine; no chunk jumps the queue by being newly added.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
Plus: re-run the coverage diff — empty, or every exclusion is noted on its
tradition record.

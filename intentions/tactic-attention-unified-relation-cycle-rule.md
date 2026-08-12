---
id: tactic-attention-unified-relation-cycle-rule
kind: tactic
statement: Reject cycles over the whole unified parent relation in
  validateGraph, not only over blocked_by
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-08-12 /align round that unified the ranking
  model on strategy-graph-drives-dispatch. Folding blocked_by and recovers into
  the parent relation makes mixed cycles representable for the first time; the
  round measured zero cycles in the live graph today, so this is a latent trap
  being closed before it fires, not a live defect.
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications:
  - question: Why does this matter more under the unified relation than it did before?
    answer: "(Recorded 2026-08-12.) Two reasons. First, coverage: validateGraph rule
      15 forbids only blocked_by cycles, and attention.ts guards only pure
      `parent` cycles — that guard was deliberately narrowed when blocked_by
      left the distributor relation, on the reasoning that a mixed cycle could
      no longer arise. It can again. The realistic authoring mistake is
      `B.parent = A` together with `B.blocked_by = [A]` — 'B is a sub-tactic of
      A, and B waits on A's other work' — two individually sensible edges that
      together cycle. Second, failure mode: because lineage is a deduplicated
      union, the fixpoint CONVERGES on a cycle rather than diverging, so every
      node in the cycle ends up sharing one lineage set and the
      child-outranks-parent guarantee collapses SILENTLY inside it. There is no
      error and no visible symptom — which is exactly why the check has to be
      mechanical. Scope: one validateGraph rule over the full relation (parent,
      serves, recovers, reverse-blocked_by), with the existing rule 15 subsumed
      or kept as the more specific diagnostic."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-attention-namespaced-rank
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Reject cycles over the whole unified parent relation in validateGraph, not only over blocked_by

Draft — retained interview context per the retain-not-refine contract.

## The gap

Two guards exist today and neither covers the unified relation:

- `validateGraph` rule 15 rejects `blocked_by` cycles only.
- `resolveAttention` throws on a **pure `parent`** cycle only. That guard was
  deliberately narrowed when `blocked_by` left the distributor relation, on
  the recorded reasoning that "with `blocked_by` no longer in the distributor
  relation, a mixed parent/blocked_by cycle can no longer arise"
  (`packages/intentionsutil/src/attention.ts`). The 2026-08-12 unification
  puts `blocked_by` and `recovers` back in, so mixed cycles can arise again.

## The realistic authoring mistake

`B.parent = A` together with `B.blocked_by = [A]` — "B is a sub-tactic of A,
and B waits on A's other work". Both edges are individually sensible and both
pass every check today; together they cycle in the unified relation.

## Why it must be mechanical

Because lineage is a deduplicated **union**, the fixpoint converges on a
cycle rather than diverging. Every node in the cycle ends up sharing one
lineage set, so the child-outranks-parent guarantee collapses **silently**
inside it — no error, no visible symptom, just a wrong order. A diverging
sum would at least be obvious.

## Scope

One `validateGraph` rule over the full relation (`parent`, `serves`,
`recovers`, reverse-`blocked_by`), with the existing rule 15 either subsumed
or kept as the more specific diagnostic. Measured on the live graph at
2026-08-12: **0 cycles** in the proposed relation, so this closes a latent
trap rather than fixing a live defect.

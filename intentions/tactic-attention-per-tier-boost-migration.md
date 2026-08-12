---
id: tactic-attention-per-tier-boost-migration
kind: tactic
statement: Migrate attention.boost to a per-tier map and retire the interim 0.01
  namespacing ladder and the last override
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-08-12 /align round that unified the ranking
  model on strategy-graph-drives-dispatch. The round adopted per-tier authored
  boosts and removed both `override` and the minimum-boost-of-1 rule; the live
  graph's authored values do not fit the resulting scale and must be migrated
  deliberately rather than reinterpreted in place.
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications:
  - question: What is actually in scope, measured?
    answer: "(Recorded 2026-08-12, measured on the live graph during the round.) 597
      nodes; 91 carry an authored boost, of which 43 are non-integer. The
      non-integer population is almost entirely the 2026-08-11 NAMESPACING
      STOPGAP — magnitudes hand-compressed onto a 0.01-per-level ladder so a
      tactic boost could not lift a node out of its parent strategy's band, with
      the original magnitude preserved at attributes.pre_namespacing_boost. That
      stopgap exists only because namespacing was not structural; the unified
      key's band component makes it structural, so the ladder should be REVERTED
      from pre_namespacing_boost rather than carried forward or re-scaled. Also
      in scope: strategy-graph-review-curriculum at 3.5; the single remaining
      non-null attention.override (tactic-transition-node-stamp-landed-body,
      phase done) to be dropped with the field; and the storage shape for
      per-tier boosts, which must keep an unauthored tier distinguishable from
      an authored lowest value so 'not yet ranked in this tier' does not read as
      'ranked last'. Note the interaction with the office-hours session-type
      soft penalty (attention x 0.5, strategy-attention-surface): it is a
      multiplier applied by the office-hours selector outside the rank key, and
      this round did not change it — confirm it still composes once boosts are
      integers."
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
# Migrate attention.boost to a per-tier map and retire the interim 0.01 namespacing ladder and the last override

Draft — retained interview context per the retain-not-refine contract.

## Measured population (live graph, 2026-08-12)

597 nodes; **91** carry an authored boost, of which **43** are non-integer.

## The 0.01 ladder should be reverted, not rescaled

Almost the whole non-integer population is the 2026-08-11 **NAMESPACING
STOPGAP**: magnitudes hand-compressed onto a 0.01-per-level ladder so a
tactic boost could not lift a node out of its parent strategy's band, with
the original magnitude preserved at `attributes.pre_namespacing_boost`.
`tactic-attention-tier-ranking`'s own `attention.rationale` records the
reasoning verbatim, including that the bound "is NOT yet enforced by the
resolver".

The unified key's `band` component enforces it structurally. The stopgap's
reason to exist therefore ends with that change, so the ladder should be
**reverted from `pre_namespacing_boost`** rather than carried forward or
re-scaled onto the new scale.

## Also in scope

- `strategy-graph-review-curriculum` at boost `3.5`.
- The single remaining non-null `attention.override`
  (`tactic-transition-node-stamp-landed-body`, phase `done`), dropped with
  the field.
- **Storage shape** for per-tier boosts. An unauthored tier must stay
  distinguishable from an authored lowest value, or "not yet ranked in this
  tier" reads as "ranked last". `kind-kind`'s per-band `attention.scope`
  stamp is a **separate**, still-open question — adopting per-tier boosts
  does not close it.

## Interaction to confirm

The office-hours session-type soft penalty (`attention x 0.5`, one shared
named constant — `strategy-attention-surface`) is applied by the
office-hours selector **outside** the rank key, and the 2026-08-12 round did
not change it. Confirm it still composes once boosts are integers.

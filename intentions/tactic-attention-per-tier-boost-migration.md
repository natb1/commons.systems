---
id: tactic-attention-per-tier-boost-migration
kind: tactic
statement: Migrate authored boosts onto the closed absolute level vocabulary,
  retire the interim 0.01 namespacing ladder and the last override value, and
  land the write-path vocabulary check
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
      integers. (Amended 2026-08-12, same round.) The storage shape itself moves
      to tactic-attention-namespaced-rank, which lands it. The REQUIREMENT
      recorded here survives unchanged as a constraint this node asserts on that
      shape: an unauthored tier must stay distinguishable from an authored
      lowest value, so 'not yet ranked in this tier' does not read as 'ranked
      last'. A sparse map satisfies it, and that is consistent with
      tactic-attention-namespaced-rank's own scope item that an unauthored boost
      contributes 0."
  - question: Are authored boosts free magnitudes or a closed vocabulary, and what
      does that decide about the per-band scope stamp and rule 20?
    answer: "(Author-decided 2026-08-12.) A CLOSED VOCABULARY OF ABSOLUTE LEVELS. A
      boost names a fixed degree of claim rather than a magnitude picked against
      whatever currently shares the node's band, so a value is commensurable
      across bands and tiers and BAND COLLISION — two separate bands converging
      so nodes calibrated against different neighbour sets compare directly —
      becomes harmless instead of silently miscalibrating. This CLOSES
      kind-kind's per-band attention.scope stamp as REJECTED: that mechanism
      keys on the resolved band distributor, so it fires on distributor-identity
      change (already an explicit authoring act) and is silent on collision, and
      it was the only option needing a stored field and a write-path gate. It
      also RETIRES validateGraph rule 20 outright — both the single-scalar
      attention.tier field it reads (replaced by the per-tier map) and its
      justification ('a boost value is only meaningful within one tier's scale',
      false under an absolute vocabulary). This node owns the level values:
      background 5 / low 10 / normal 20 / high 50 / urgent 85, which snap the
      live population 10 / 14 / 32 / 28 / 7 with only ~11 of 91 nodes moving
      more than a rounding step (91 values, 17 distinct today, six values
      covering 88%). The names and values are the judgment call and are cheap to
      change; what is decided is that the vocabulary is closed and absolute.
      Declare the levels as one exported constant so validateGraph can reject an
      off-vocabulary boost on the write path — the check that replaces rule 20.
      PER-TIER BOOSTS ARE RETAINED: the vocabulary governs which values are
      authorable, the per-tier structure governs how many boosts a node carries
      and exists for coverage; orthogonal, both land. (Amended 2026-08-12,
      office-hours /align round that cleared tactic-attention-namespaced-rank's
      park.) OWNERSHIP CORRECTED: this node no longer owns the per-tier STORAGE
      SHAPE, nor validateGraph rule 20's retirement. Both move to
      tactic-attention-namespaced-rank. The reason is an entailment this entry
      missed: rule 20 (checkAttentionTierNamespace,
      packages/intentionsutil/src/schema.ts:1111-1121) requires attention.tier
      === ownTier(node), so it mechanically REJECTS the very authoring act
      per-tier boosts exist to enable -- a tier-1 strategy authoring a tier-2
      boost so its tier-lifted tactics band against something rather than
      against 0. Rule 20's retirement is therefore inseparable from the SHAPE
      change, not from this node's vocabulary; the calibration ground recorded
      here is a second, independent reason, not the load-bearing one for
      sequencing. What this node retains is unchanged in substance: the level
      values (background 5 / low 10 / normal 20 / high 50 / urgent 85), the
      single exported constant declaring them, the write-path check rejecting an
      off-vocabulary boost, the 0.01 ladder revert from
      attributes.pre_namespacing_boost, strategy-graph-review-curriculum's 3.5,
      and the last override VALUE (tactic-transition-node-stamp-landed-body).
      blocked_by: [tactic-attention-namespaced-rank] is unchanged and becomes
      genuinely load-bearing -- this node's migration now writes values INTO a
      map shape that node lands, rather than landing the shape itself."
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
# Migrate authored boosts onto the closed absolute level vocabulary, retire the interim 0.01 namespacing ladder and the last override value, and land the write-path vocabulary check

Draft — retained interview context per the retain-not-refine contract.

> **Scope corrected 2026-08-12** (office-hours `/align` round that cleared
> `tactic-attention-namespaced-rank`'s park). This node no longer owns the
> per-tier **storage shape** or `validateGraph` rule 20's retirement — both
> moved to `tactic-attention-namespaced-rank` under the **shape/value seam**
> recorded on `strategy-graph-drives-dispatch`. This node owns the authored
> **values** and the write-path check on them. `blocked_by:
> [tactic-attention-namespaced-rank]` is unchanged and is now genuinely
> load-bearing: this migration writes values *into* the map that node lands.

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
- **A constraint on the storage shape** — which
  `tactic-attention-namespaced-rank` now lands, not this node. An unauthored
  tier must stay distinguishable from an authored lowest value, or "not yet
  ranked in this tier" reads as "ranked last". A sparse map satisfies it, and
  that agrees with that node's own scope rule that an unauthored boost
  contributes 0. Assert the constraint; do not land the shape.
- **The write-path off-vocabulary check** — `validateGraph` rejects a boost
  that is not one of the declared levels, reading the single exported constant
  below. This is a **new** check for a new purpose, not a transfer of retired
  rule 20's obligation: under a per-tier map a tier-1 boost simply stays a
  tier-1 boost when the node's tier changes, so that obligation dissolves
  rather than moving.

**`validateGraph` rule 20 retires with the shape, not with the vocabulary
(corrected 2026-08-12).** Its retirement was recorded here on the strength of
one ground — that its justification, "a boost value is only meaningful within
one tier's scale", is false under an absolute vocabulary. That ground is sound
but is not the sequencing-critical one. `checkAttentionTierNamespace`
(`packages/intentionsutil/src/schema.ts:1111-1121`) requires
`attention.tier === ownTier(node)`, which mechanically **rejects** a tier-1
strategy authoring a tier-2 boost — exactly the authoring act per-tier boosts
exist to enable. So the rule cannot outlive the shape whatever happens to the
vocabulary, and it retires in `tactic-attention-namespaced-rank` alongside it.
Rule 18 is NOT affected either way: it is a tier-authorship guard reading raw
`attributes.tier`, not a boost guard; see `tactic-attention-namespaced-rank`.

## The boost vocabulary is a closed set of absolute levels (decided 2026-08-12)

`kind-kind`'s per-band `attention.scope` stamp is **rejected**; the question
it addressed is dissolved instead. An authored boost names a fixed degree of
claim rather than a magnitude chosen against current band-mates, so the same
value means the same thing in every band and every tier and band collision is
harmless. Doctrine: `strategy-graph-drives-dispatch`, the level-vocabulary
clarification.

This node owns the values. The live distribution already clusters on five
levels, so the migration is a snap, not a re-authoring:

| level | value | current population snapped in |
|---|---|---|
| background | 5 | 10 (values 1, 2, 3, 3.5, 5, 6, 7) |
| low | 10 | 14 (values 10, 12) |
| normal | 20 | 32 (value 20) |
| high | 50 | 28 (values 50, 55, 56) |
| urgent | 85 | 7 (values 75, 85, 90, 96) |

91 authored values, 17 distinct today; 80 of 91 already sit on one of the six
most common values. Only ~11 nodes move by more than a rounding step.

The level **names and values are the one judgment call here** and are cheap to
change — what is decided is that the vocabulary is closed and absolute, not
that it has exactly these five entries. Retain the levels as a single shared
declaration (one exported constant) rather than as prose, so `validateGraph`
can reject an off-vocabulary boost on the write path — the check that replaces
retired rule 20.

**Per-tier boosts are retained** (author-directed). The vocabulary governs
which values are authorable; the per-tier structure governs how many boosts a
node carries and exists for coverage — a well-defined rank in a tier the node
does not itself belong to. The two are orthogonal and both land.

## Interaction to confirm

The office-hours session-type soft penalty (`attention x 0.5`, one shared
named constant — `strategy-attention-surface`) is applied by the
office-hours selector **outside** the rank key, and the 2026-08-12 round did
not change it. Confirm it still composes once boosts are integers.

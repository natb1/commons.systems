---
id: tactic-attention-namespaced-rank
kind: tactic
statement: Make namespaced rank structural — order by (tier,
  distributing-strategy rank, within-strategy value) so a tactic boost can never
  invert cross-strategy order
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align round that recorded the
  namespacing bound on strategy-recursive-self-improvement and kind-kind: the
  author chose structural enforcement in the resolver over a behavioral bound on
  /rsi-evaluate, and resolveAttention today sums a tactic's own boost with its
  strategy-distributed value, so the recorded doctrine is not yet mechanically
  enforced."
reading: null
serves:
  - strategy-graph-drives-dispatch
  - strategy-recursive-self-improvement
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
# Make namespaced rank structural — order by (tier, distributing-strategy rank, within-strategy value) so a tactic boost can never invert cross-strategy order
## Draft context (2026-08-11 /align round)

The doctrine this implements is recorded in two places, split by artifact
owner: the ownership half (who may write which attention, and the
namespacing bound on delegated writes) on
`strategy-recursive-self-improvement` — its amended tier/rank-composition
clarification and conditions 15 and 17 — and the rank-algebra half (how an
authored boost composes down `parent`/`serves`) as a `kind-kind`
clarification.

### The defect

`resolveAttention` (`packages/intentionsutil/src/attention.ts`) accumulates
per node a set of `(source-node, amount)` claims flowing down
`parent`/`serves`, and a node's `value` is the **sum** of that set. A
tactic's own authored boost is one more claim in the same flat sum as its
strategy's distributed value. So a tactic boosted 50 under a boost-3
strategy outranks a tactic under a boost-6 strategy — the cross-strategy
inversion the recorded doctrine now forbids. Nothing mechanically prevents
it; only the model's or author's restraint does.

### Greenfield target

Rank orders **lexicographically** by `(tier, distributing-strategy rank,
within-strategy value)`:

- `tier` stays the outermost axis, resolved exactly as today (max-lifted
  along the same distributor edges, never flowing upward). It remains the
  only cross-strategy escape, and the model's only instrument on it stays
  adding a recognized `bug_fix`/`security` mark.
- `distributing-strategy rank` is the **band**: the resolved value of the
  highest-ranked strategy distributing to the node — **max** across
  distributors, never the sum, mirroring the max rule the effective-tier
  fixpoint already applies. A multi-`serves` tactic therefore sits in its
  best band, so adding a `serves` edge can neither demote a tactic nor
  become a way to jump bands.
- `within-strategy value` is the node's own authored claim, which orders it
  only against siblings inside the same band.

Strategy attention is the complementary, unscoped case and is unchanged:
a child strategy's boost sums with its parent's, so a child may be boosted
in conjunction with its parent to outrank cousin and uncle strategies. The
asymmetry is deliberate — that additive strategy channel is precisely how
the author expresses tactic priority, since a direct tactic boost is inside
the surface delegated to `/rsi-evaluate`.

The bound is **uniform, with no `owner` carve-out**: it is a property of the
rank algebra, not of who authored the value. The resolver must not read
`owner` — keeping policy out of what is currently a pure algebra was an
explicit interview resolution.

Derived-on-read is unchanged: nothing here is stored in frontmatter.

### Brownfield migration

1. Record the doctrine (**done** in the same round as this draft) and land a
   lint that flags a delegated `attention` write whose composed value
   inverts cross-strategy order within a tier. This is the same lint family
   as the ownership-boundary and marks-asymmetry checks drafted at
   `tactic-priority-provenance-schema`; land them together or state why not.
2. Extend `ResolvedAttention` with the band component and switch the
   selector's sort (`selectGraphTargets`, `packages/intentionsutil/src/router.ts`,
   currently `(tier desc, rank desc, progression-ordinal desc, id asc)`) to
   the lexicographic key. Every other `value` consumer — `renderFrontier`,
   the office-hours parked-queue ordering (`officeHours.ts`, which applies
   its own session-type soft penalty), `render-rsi-plan.ts` — must be
   audited: a consumer that keeps comparing bare `value` silently keeps the
   old flat semantics.
3. Re-derive the queue and diff the order against the pre-change ranking.
   Bootstrap-era hand-set boosts on `owner: ai` tactics (the 2026-07-30
   re-scale band) are reinterpreted as within-strategy ordering by this
   change; confirm the resulting order is the intended one rather than
   assuming it.

### Absorbed verification item

This tactic absorbs the tier-isolation check previously noted on
`tactic-priority-provenance-schema`: `attention.ts`'s tier-isolation filter
(~lines 516–530) drops a strictly-lower-tier source's claim from a
higher-tier node's `value`, which the recorded within-tier ordering
semantics may not intend. Resolve it as part of the band derivation rather
than as a separate fix — under the lexicographic key the band comes from
the distributing strategy's own resolved rank, so the question becomes
whether a lower-tier strategy can define a band for a tier-lifted tactic.
If the answer is that it can, this is a `bug_fix` — the queue-integrity
class the rsi fitness function front-loads.

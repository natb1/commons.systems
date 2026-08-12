---
id: tactic-attention-namespaced-rank
kind: tactic
statement: Make namespaced rank structural — order by (tier, band, residual)
  with an authored attention.scope stamp, so a tactic's attention can never
  invert cross-strategy order
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align round that recorded the
  namespacing bound on strategy-recursive-self-improvement and kind-kind, and
  reshaped by that round's adversarial review the same day: the author chose
  structural enforcement in the resolver over a behavioral bound on
  /rsi-evaluate, and resolveAttention today sums a tactic's own boost with its
  strategy-distributed value, so the recorded doctrine is not yet mechanically
  enforced. The review found the first draft of the key underspecified in all
  three components and inert on the selection path; this node carries the
  corrected design."
reading: null
serves:
  - strategy-graph-drives-dispatch
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications:
  - question: Does band derive from the distributing strategy's authored term or
      from its full resolved rank, and what does that make the residual?
    answer: "(Resolved 2026-08-12, office-hours round that cleared this node's park;
      the decision strategy-recursive-self-improvement recorded as open on this
      node is now closed.) BAND derives from the distributing strategy's
      RESOLVED rank -- kind-kind's rank-algebra clarification is ratified
      unchanged on this point. RESIDUAL is corrected: it is NOT the node's value
      minus its band, but the node's value minus the authored contribution
      INHERITED from its distributors, which equals its own authored boost plus
      its own signal term plus its own capture term. The two differ because
      resolveAttention distributes ancestors' authored claims only
      (packages/intentionsutil/src/attention.ts, authored fixpoint lines
      417-437) while signal and capture are computed per node and never flow
      downward (lines 553-556); subtracting the full resolved band would
      therefore subtract the strategy's own signal and capture weight, driving
      the residual negative (the MINUS 1 case recorded on
      strategy-recursive-self-improvement for strategy-rsi-plan-surface's
      tactics) and leaking the band's own terms back into within-band order. The
      corrected residual is never negative, keeps all three registered terms
      live, and leaves resolveAttention's composition untouched. Choosing
      resolved rank over the authored term also preserves this node's own
      greenfield assertion that strategies live on a single flat additive scale
      unchanged from today: a strategy's band is its resolved rank, so
      strategy-versus-strategy order is exactly today's value order with the
      residual only as a tiebreak, whereas an authored-term band would have made
      a strategy's key the lexicographic pair (authored, signal+capture) and
      reordered strategies against each other. It further makes the serving
      strategy's success_signal half (b) reachable, now recorded on
      strategy-rsi-delegated-prioritization as measured against resolved rank.
      Implementation note carried into the plan: state this derivation
      explicitly in code rather than letting it fall out, and re-measure the
      ~1828 inversion figure after the multi-distributor sum-to-max fix this
      node also owns, since that figure predates it. Author-directed and
      accepted on trust; enrolled for re-validation as
      tactic-review-band-derivation-ratification."
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
# Make namespaced rank structural — order by (tier, band, residual) with an authored attention.scope stamp, so a tactic's attention can never invert cross-strategy order
## Draft context (2026-08-11 /align round, revised same day after adversarial review)

The doctrine this implements is recorded in three places, split by artifact
owner:

- **Ownership** — who may write which attention, the namespacing bound on
  delegated writes, and what the model may still legitimately do — on
  `strategy-recursive-self-improvement`: its amended tier/rank-composition
  clarification, its **classification-escape** clarification, conditions 15
  and 17, and the two clarifications a reader of this tactic most needs —
  *"May the author express tactic priority by boosting a tactic directly?"*
  (no: that field is inside the delegated surface; the author's channel is
  child strategies) and *"What justifies a child strategy — does
  subdividing a parent purely to rank its tactics count?"* (yes, and it
  still owes its own `success_signal`).
- **Rank algebra** — how a boost composes down `parent`/`serves`, the three
  key components, the `attention.scope` stamp, and what sits outside the key
  — on `kind-kind`.
- **The never-bands re-decision** — why this band is a second deliberate
  amendment of a doctrine that once rejected bands — on
  `strategy-graph-drives-dispatch`.

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

**Two scales, not one.** Strategies live on a single flat additive scale —
unchanged from today. Tactics are namespaced *inside* it: a tactic's own
numbers order it only against tactics sitting at the same strategy rank.

Rank orders **lexicographically** by `(tier, band, residual)`, descending.

- **`tier`** — unchanged: the existing max-lifted effective tier.
- **`band`** — the resolved rank of the strategy the node sits under,
  derived by the **same downward monotone fixpoint the effective tier
  already uses** (`attention.ts`, the `effectiveTier` loop):
  `band(n) = max(ownBand(n), max over distributors d of band(d))`, where
  `ownBand` is a strategy's own resolved rank and `0` for every other kind.
  Deriving it as a fixpoint rather than as a direct max over the node's own
  distributor set is what makes it **total** — see "Why the fixpoint" below.
- **`residual`** — the node's `value` **minus the authored contribution
  inherited from its distributors**, which equals its own authored boost plus
  the `signal` term plus the `capture` term. (Corrected 2026-08-12 — see
  "Band and residual — settled" below. The earlier wording, "the node's
  `value` minus its band", is **wrong** and does not equal the gloss that
  followed it: the band carries the distributing strategy's own `signal` and
  `capture` weight, which the node never inherited, so subtracting the band
  drives the residual negative.)

**Why the residual and not "the node's own boost".** `resolveAttention`
computes `value = authored + signal + capture`, and `authored` is itself a
sum over *all* same-tier contributing sources — not the node's own claim.
So the third component has to be defined, not assumed. Own-boost-only would
drop the `signal` term (on-path to an unvalidated `success_signal`) and the
`capture` term (`recovers` severity) out of ordering entirely, silently
demoting two of the three registered terms. The bare `value` would
double-count the distributing strategy's rank — once as the band, once
inside `value` — so order within a band would still track strategy rank
rather than the node's own claim. The residual keeps every registered term
live, keeps `resolveAttention`'s composition untouched (the inherited
authored contribution is a subtraction, not a rewrite), and preserves the
shape the 2026-07-18 tier amendment already established: terms-and-weights
govern ordering **within** a band.

**Why the fixpoint.** A direct max over the node's own distributor set is
undefined for three real shapes. An **epic child** whose only distributor is
another tactic has no distributing strategy at all, and would fall to band 0
— below every banded tactic in its tier; under the fixpoint it inherits its
subtree root's band for free. A node with **no distributor** (`parent: null`,
`serves: []`) gets an honest 0. And a **tier-lifted** tactic sits at tier 2
while its strategies stay at tier 1, so the tier-isolation filter has already
dropped their claims; computing the band **outside** that filter keeps the
bound live at tiers 2 and 3 — where every bug fix and every red-main item
lives — instead of going inert exactly where it matters most.

**The authored namespace stamp.** Deriving the band is not enough: a boost
authored under a band-3 strategy means something different after that
strategy is reranked to band 9, and nothing today stamps or catches it. The
schema already solves this one axis over — `Attention.tier` is documented as
"the per-tier boost **NAMESPACE** tag — the tier whose scale the value was
chosen in", with `validateGraph` rule 20 forcing re-selection when a node's
tier changes. Generalize it: extend `Attention` to
`{boost | override, rationale, scope: {tier, strategy}}`, where
`scope.strategy` names the distributing strategy in whose band the value was
chosen, plus the rule-20 analogue requiring it to match the node's resolved
band distributor. The namespace becomes **authored and checkable** rather
than derived and implicit; the migration lint collapses from a global
re-derivation diff to a field comparison `validateGraph` can do on the write
path; and reranking a strategy mechanically surfaces every boost whose
meaning it just invalidated.

**Precedence must become a 3-tuple, or this is inert.** `selectGraphTargets`
sorts on the **lifted** `precedence`, not on the pair a node reports, and
`Precedence` is `{tier, rank}` today. Extend it to `(tier, band, residual)`
with `maxPrecedence` comparing lexicographically over all three
(`router.ts`). A blocker then inherits the **band** of what it blocks, which
is the correct reading — the blocked work's urgency is exactly what the lift
models — and it preserves the never-additive, always-max property the
2026-07-13 supersession was built on.

**What stays open on purpose.** Strategy attention is the complementary,
unscoped case and is unchanged: a child strategy's boost sums with its
parent's, so a child may be boosted in conjunction with its parent to
outrank cousin and uncle strategies. The asymmetry is deliberate — that
additive strategy channel is precisely how the author expresses tactic
priority, since a direct tactic boost is inside the surface delegated to
`/rsi-evaluate`. And the model keeps two **classification** escapes, which
are sanctioned rather than leaks: a `bug_fix`/`security` mark lifts tier, and
a `serves` edge determined to be genuine lifts band. Under `band = max`
across distributors, adding a `serves` edge to a higher-ranked strategy *is*
a band promotion — an earlier draft of this node wrongly denied it. The
principle: the model never moves a node by choosing a **number**, only by
making a **claim about what the work is**, because a claim is falsifiable
against the work and a number is not.

The bound is **uniform, with no `owner` carve-out**: it is a property of the
rank algebra, not of who authored the value. The resolver must not read
`owner` — keeping policy out of what is currently a pure algebra was an
explicit interview resolution.

Derived-on-read is unchanged for `band` and `residual`: both are computed on
read. The only stored addition is `attention.scope`, which is an **authored**
namespace declaration, not a cached derivation.

### Worked example

Strategy boosts at `origin/main` when this was drafted:
`recursive-self-improvement` 6, `graph-native-dispatch` 5,
`graph-review-curriculum` 3.5, `attention-surface` 3.

Today (flat sum): tactic A serves rsi (6) with boost 4 → value 10; tactic B
serves graph-native-dispatch (5) with boost 8 → value 13. **B wins** — a
delegated number reordered the author's strategies.

Under the key: A = `(1, 6, 4)`, B = `(1, 5, 8)`. **A wins.** The 8 cannot
buy past 6-vs-5.

With child strategies (the use case this exists to serve): rsi 6, a child
boosted +2 resolves to 8, a second child boosted +1 resolves to 7. Both
outrank the uncle at 5 (Scale 1 is additive), and their tactics sort at
bands 8 and 7 ahead of tactics left directly on rsi at band 6 — while the
model still orders freely *inside* each band.

### Brownfield migration

The greenfield/brownfield split above is **required structure**, not house
style: `.claude/rules/design-proposals.md` binds every design change to lead
with the design it would choose building from scratch, on its own terms and
independent of migration cost, and to carry the migration path as a separate
proposal. Do not tidy the two sections together — the separation is the rule
being followed.

1. Record the doctrine (**done** in the same round as this draft) and land a
   lint that flags a delegated `attention` write whose composed value
   inverts cross-strategy order within a tier. This is the same lint family
   as the ownership-boundary and marks-asymmetry checks drafted at
   `tactic-priority-provenance-schema`; land them together or state why not.
2. Extend `Attention` with `scope: {tier, strategy}` and land the rule-20
   analogue. Record whether `validateGraph` rule 18's tactic-facing half
   (the `strategy-main-health` boost-dominance guard) retires under
   namespaced rank — it appears to become dead.
3. Extend `ResolvedAttention` with the band component, and extend
   `Precedence` to the 3-tuple with `maxPrecedence` comparing over all
   three, then switch the selector's sort (`selectGraphTargets`,
   `packages/intentionsutil/src/router.ts`, currently
   `(tier desc, rank desc, progression-ordinal desc, id asc)` **over the
   lifted pair**). Every other consumer must be audited — one that keeps
   comparing bare `value` silently keeps the old flat semantics:
   - `effectivePrecedence` / `maxPrecedence` (`router.ts`) — the decisive
     one; without it the band never reaches the sort at all
   - `hold-alerts.ts` — builds its own `Rank[]` of `{tier, value}`, sorts
     with its own `compareRankDesc`, and takes a top-K cutoff
   - `renderFrontier`
   - the office-hours parked-queue ordering (`officeHours.ts`, which applies
     its own session-type soft penalty)
   - `render-rsi-plan.ts`
4. Re-derive the queue and diff the order against the pre-change ranking.
   Bootstrap-era hand-set boosts on `owner: ai` tactics (the 2026-07-30
   re-scale band) are reinterpreted as within-strategy ordering by this
   change; confirm the resulting order is the intended one rather than
   assuming it. **Enumerate that boost set as the first step of this task**
   — it is the input to the confirmation and is not listed anywhere.
5. Re-scope `tactic-attention-tier-ranking` (phase `main-qa`), whose
   statement covers the exact sort this changes: "the selector sorts by
   `(tier, rank)`, blocking lifts the lexicographic `(tier, rank)` pair".
   It was named rather than edited in the recording round because a body
   edit on an in-flight node trips scope custody.

### Absorbed verification item — RESOLVED

This tactic absorbed the tier-isolation check previously noted on
`tactic-priority-provenance-schema`: `attention.ts`'s tier-isolation filter
(lines 531–534) drops a strictly-lower-tier source's claim from a
higher-tier node's `value`. The open question was whether a lower-tier
strategy can define a band for a tier-lifted tactic.

**Answer: yes, and the design above depends on it.** Deriving `band` by the
monotone fixpoint *outside* the tier-isolation filter means a tier-2 tactic
keeps the band of its tier-1 strategy. Without that, the band would vanish
at exactly the moment a tactic is lifted, and the whole namespacing bound
would be inert at tiers 2 and 3. No separate `bug_fix` is owed — the
resolution is part of the band derivation, as intended.

### Interim state — boost magnitudes were compressed by hand (2026-08-11)

The bound this tactic makes structural was, until this change, defeated in
live state: the resolver's flat additive sum let bootstrap-era hand-set
boosts lift `owner: ai` tactics clean out of their strategy's band. Measured
on the graph the day the two RSI child strategies landed, **2139 ordered
tactic pairs were inverted** by an authored tactic boost — a tactic of a
lower-ranked strategy outranking a tactic of a higher-ranked one.

As a stopgap until this tactic lands, the magnitudes of **all 42 open
tactics carrying an authored boost** were compressed onto a `0.01`-per-level
ladder, ascending, assigned per band. That is far below the minimum adjacent
gap between distinct strategy authored levels (`0.5`, measured the same day),
so a compressed boost can no longer cross a band while the ordering *within*
each band is preserved exactly. Boost-attributable inversions went 2139 → 0.

**This discharges verification item 4's enumeration gap.** That item asks the
implementer to enumerate the bootstrap-era boost set as the first step,
noting it "is not listed anywhere." It is now listed, durably and per-node:
every compressed node carries its original magnitude at
**`attributes.pre_namespacing_boost`**, and its `attention.rationale` carries
a dated `NAMESPACING STOPGAP` paragraph naming the old and new values. Query
that field to recover the set rather than reconstructing it from git history.

**What this tactic owes the stopgap:** once `(tier, band, residual)` ordering
is structural, the compression is no longer needed to hold the bound, and the
`0.0x` residuals are too coarse to express meaningful within-band priority.
Restore each node's residual from `attributes.pre_namespacing_boost`, rescaled
into whatever range the residual component takes, then delete the field and
the stopgap paragraph. Leaving the compressed values in place would silently
flatten the within-band priority the author and `/rsi-evaluate` express.

**What the stopgap could NOT fix — and why it is this tactic's problem.**
Two crossings survive, and neither node carries a boost at all:

| node | value | its band | why |
|---|---|---|---|
| `tactic-dispatch-skill-standards-extraction` | 11.33 | 7 | authored term **sums** across distributors |
| `tactic-office-hours-graph-type-passthrough` | 8.5 | 6.33 | same |

Both serve more than one strategy, and `resolveAttention`'s authored term
adds every distributing strategy's contribution rather than taking the
maximum. The recorded doctrine is explicit that this is wrong — the author's
resolution was *"highest-ranked distributing strategy (max across
distributors, never the sum)"* — so the resolver currently contradicts it.
No boost edit can reach this: the value is pure inherited sum. **Fixing the
multi-distributor combinator to `max` belongs to this tactic's scope**, and
those two nodes are its ready-made regression cases.

A further class is out of reach of boosts and is *not* claimed as fixed here:
the `signal` and `capture` terms are computed per-node and do not flow down
through distribution, so a strategy's resolved rank can exceed the authored
value its tactics inherit by up to 2. That is why ~1828 pair inversions
remain against strategy *resolved* rank. Whether `band` derives from the
strategy's authored term or its full resolved value was left open here; it is
now **settled — resolved value**. See the next section, which supersedes this
paragraph's open question and the earlier draft's "the design above says
authored".

### Band and residual — settled (2026-08-12)

This node was parked on 2026-08-11 because its own body contradicted itself
on the rank key, and the definition lives on a doctrine node a tactic may not
rewrite. The office-hours round of 2026-08-12 settled it; `kind-kind`'s
rank-algebra clarification and `strategy-rsi-delegated-prioritization`'s
`success_signal` carry the authoritative record, and this section restates it
so a clean session implementing from this node alone is not misled.

**`band` = the distributing strategy's RESOLVED rank.** Unchanged from
`kind-kind` — that half was already correct and is ratified.

**`residual` = the node's `value` minus the authored contribution INHERITED
from its distributors** = its own authored boost + its own `signal` term +
its own `capture` term. This *corrects* the earlier "value minus its band".

**Why they are not the same thing.** `resolveAttention`'s authored fixpoint
distributes ancestors' **authored** claims only
(`packages/intentionsutil/src/attention.ts`, lines 417–437); `signal` and
`capture` are computed per node and never flow downward (lines 553–556). A
strategy's resolved rank therefore contains `signal`/`capture` weight its
tactics never inherited. Subtracting the whole band would subtract weight
that was never added — driving the residual **negative** (the recorded
`MINUS 1` case: `strategy-rsi-plan-surface`'s tactics sit in band 9 carrying
an authored 8) and leaking the distributing strategy's own terms back into
ordering *within* the band, which is precisely the artifact the residual
exists to remove.

**Why resolved rank and not the authored term.** Three reasons, in order of
force:

1. **It is what makes `success_signal` (b) reachable.** Under `band =
   resolved rank`, `band` dominates `residual` lexicographically, so a tactic
   can never outrank a tactic of a higher-resolved-rank strategy — the
   cross-strategy inversion count against resolved rank is *structurally*
   zero once this lands. Under `band = authored term`, the ~1828 inversions
   measured against resolved rank stay live and the threshold ("both counts
   in (b) stay at zero") could never be met.
2. **It preserves this node's own greenfield assertion** that strategies live
   on a single flat additive scale, *unchanged from today*. A strategy's own
   band is its resolved rank, so strategy-vs-strategy order stays exactly
   today's `value` order, with the residual acting only as a tiebreak. An
   authored-term band would instead make a strategy's own key the
   lexicographic pair `(authored, signal+capture)` and **reorder strategies
   against each other** — which that assertion forbids. This cost was not
   surfaced when the question was first framed.
3. **It requires no change to `kind-kind`'s band definition** — only the
   residual derivation was wrong.

**Implementation obligations this creates.** State the derivation explicitly
in code rather than letting it fall out: compute the residual from the
inherited-authored quantity, not by subtracting the band. And **re-measure
the ~1828 figure** before using it as a baseline — it predates the
multi-distributor `sum`→`max` fix this same tactic owns, so the two changes
interact and the figure is stale as a target.

**Held on trust.** The author accepted this resolution rather than deriving
it, so it is enrolled for re-validation as the born-parked office-hours
review sitting `tactic-review-band-derivation-ratification`.

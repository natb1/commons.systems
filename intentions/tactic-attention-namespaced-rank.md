---
id: tactic-attention-namespaced-rank
kind: tactic
statement: Implement the unified rank key -- one parent relation
  (parent/serves/recovers/reverse-blocked_by), the per-tier boost storage shape
  (retiring validateGraph rule 20), deduplicated lineage score, and the (tier,
  band, score, depth) quadruple -- retiring override, the signal term and the
  blocked_by precedence lift
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-08-11 /align round that recorded the
  namespacing bound on strategy-recursive-self-improvement and kind-kind,
  reshaped by that round's adversarial review the same day, and superseded on
  2026-08-12 by the author-dictated unification that replaced the (tier, band,
  residual) triple with the (tier, band, score, depth) quadruple over a single
  parent relation. The author chose structural enforcement in the resolver over
  a behavioral bound on /rsi-evaluate: resolveAttention today sums a tactic's
  own boost with its strategy-distributed value across a narrow parent/serves
  relation, so the recorded doctrine is not yet mechanically enforced. Finalized
  2026-08-12 by a per-node /align-tactics session into a five-unit clean-session
  plan; the doctrine home is strategy-graph-drives-dispatch's 2026-08-12
  clarifications and the algebra is on kind-kind."
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
  - question: Are tactic-dispatch-skill-standards-extraction and
      tactic-office-hours-graph-type-passthrough still regression cases for the
      multi-distributor sum defect, once band and residual are settled?
    answer: "(Re-measured 2026-08-12, same office-hours round, on origin/main at
      fb1dc4cc against the live summing resolver.) Yes, but for a different
      assertion than the body originally recorded. Neither node carries an
      authored boost of its own, so its entire authored term is inherited; under
      the corrected residual -- value minus the INHERITED authored contribution,
      i.e. own boost plus own signal plus own capture -- the summed quantity
      drops out of the rank key entirely. Measured:
      dispatch-skill-standards-extraction own boost 0, value 11.33, band 7.00,
      residual 0.33; office-hours-graph-type-passthrough own boost 0, value
      8.50, band 6.33, residual 0.50. The band is already a max across
      distributors and the residual is computed from the node's own terms alone,
      so the corrected residual neutralizes the sum on the ordering path without
      touching the combinator. These are therefore NOT ordering regression cases
      any more. What remains owed is a value-honesty defect: resolveAttention
      still reports 11.33 for a node whose highest-ranked distributor resolves
      to 7.00, still contradicting the recorded max-across-distributors
      doctrine, and bare value is what the migration step 3 consumers read
      directly -- hold-alerts.ts most sharply, since it builds its own Rank list
      of tier and value and applies a top-K cutoff, so an inflated value selects
      the wrong nodes regardless of how the selector sorts. The sum-to-max fix
      stays in this tactic's scope and these two nodes stay its regression
      cases, but the assertion under test changes from a tactic does not invert
      cross-strategy order to value equals the maximum distributing strategy
      contribution, never their sum. Write the regression that way. Method
      caveat for whoever re-measures: the same probe counted 75 cross-band
      inversions among open tactics under the old flat key and 0 under the new
      key; the 75 is a real measurement but the 0 is structural, not empirical,
      since band dominates residual lexicographically, so it must not be cited
      as evidence the key was validated against data."
  - question: Does the (tier, band, residual) design with an attention.scope stamp
      survive the 2026-08-12 unification?
    answer: "(Recorded 2026-08-12 /align round on strategy-graph-drives-dispatch,
      author-dictated.) Partly. BAND survives unchanged, including the
      derivation from the distributing node's resolved rank settled in this
      node's first clarification. RESIDUAL is retired, and the correction
      recorded in that first clarification becomes moot rather than wrong:
      because every term now flows down the parent relation, band <= score
      always and the band cancels within a band, so ordering by score is
      identical to ordering by residual. The multi-distributor sum-to-max
      value-honesty defect this node also owns is likewise dissolved — the score
      is a deduplicated lineage sum, so a node no longer reports a value its
      highest-ranked distributor cannot account for, and the ~1828 inversion
      figure and its re-measurement are moot. The attention.scope stamp is NOT
      adopted in the per-band form proposed here; the per-TIER half is adopted
      instead, as per-tier authored boosts, and the per-band stamp stays open on
      kind-kind. (Amended 2026-08-12: the per-band stamp is now CLOSED —
      author-decided REJECTED, dissolved by making the authored boost vocabulary
      a closed set of absolute levels rather than free magnitudes. Nothing about
      this node's scope changes; see tactic-attention-per-tier-boost-migration
      for the levels and strategy-graph-drives-dispatch for the doctrine.) Scope
      this node now carries: the widened parent relation, per-tier boosts, the
      deduplicated lineage score with unauthored boosts contributing 0, the
      (tier, band, score, depth) key, depth as the child-outranks-parent
      guarantee, terminal (done) nodes contributing nothing, deletion of
      attention.override, deletion of the signal term from resolveAttention
      (leaving computeSignalPath in place for the router's strategy-eligibility
      gate), and deletion of router.ts's effectivePrecedence lift. Sibling work
      is split out: delegation scoring to tactic-attention-delegation-scoring,
      the cycle rule to tactic-attention-unified-relation-cycle-rule, and the
      boost migration to tactic-attention-per-tier-boost-migration."
  - question: Does this node land the per-tier boost storage shape and validateGraph
      rule 20's retirement, or does tactic-attention-per-tier-boost-migration?
    answer: "(Author-decided 2026-08-12, office-hours /align round that cleared this
      node's park; supersedes the park reason's own framing of the question.)
      THIS NODE lands both. The park framed a binary -- absorb the sibling's
      scope, or have the resolver read today's single tagged boost as 'this
      node's boost in tier attention.tier, 0 in every other tier' until the
      sibling lands -- and both horns were wrong. THE DEFERRAL HORN IS NOT A
      WORKING LESSER VERSION: rule 20 (checkAttentionTierNamespace,
      packages/intentionsutil/src/schema.ts:1111-1121) requires attention.tier
      === ownTier(node), so no node may author a boost in a tier it does not
      itself belong to; and per-tier boosts exist precisely so a tier-1 strategy
      CAN author a tier-2 boost, giving its tier-lifted tactics a band. Under
      the deferral the per-tier code path is structurally unexercisable -- dead
      scaffolding that still has to be written and tested, not degraded
      function. strategy-graph-drives-dispatch's own per-tier-cost clarification
      already contained the premise ('delivers a meaningful band only once the
      parent has an authored boost in the lifted tier') without drawing the
      conclusion. THE ABSORB HORN OVERCORRECTS: it drags a 91-node data
      migration and the level-vocabulary judgment into a pure-algebra PR, and
      those are separable. The decision is the SHAPE/VALUE SEAM: this node lands
      the per-tier map and deletes rule 20;
      tactic-attention-per-tier-boost-migration keeps the closed level
      vocabulary, its exported constant, the write-path off-vocabulary check,
      the 0.01 ladder revert, the 3.5, and the last override value. The seam
      costs no data migration here: parseAttention already defaults tier to 1
      (schema.ts:378-380), so the legacy scalar form parses into the one-entry
      map with ZERO node-file edits. Measured this round on origin/main at
      bad3e074: all 92 attention-carrying nodes are tier-1 tagged (91 boosts, 1
      override), and none of the 6 nodes with ownTier > 1 carries attention at
      all -- so no tier-2/3 authored boost exists to be reinterpreted. The seam
      also matches the one this node ALREADY uses for the sibling field: scope
      item 6 deletes attention.override from the schema and resolver while the
      sibling drops the one remaining override VALUE; splitting override by
      shape/value and boost by node would have been inconsistent. Rewrite
      surface measured: attention.tier is read in exactly two places
      (schema.ts:1114, which IS rule 20, and goals.ts:182); boost/override in
      five (attention.ts:388-392, 425-426, 541). The sibling's recorded
      blocked_by on this node is unchanged and becomes genuinely load-bearing."
  - question: Must the new rank order be validated as the author's intended work
      order before this node can land?
    answer: >-
      (Author-decided 2026-08-12, office-hours session that cleared this node's
      park.) NO. Rank accuracy is not an acceptance criterion for this node.
      Nodes are dispatched MANUALLY by the author today, and the ranking is not
      expected to be accurate until all three sibling tactics are fully
      implemented: tactic-attention-per-tier-boost-migration (the authored
      values), tactic-attention-delegation-scoring (making recovers edges
      score-bearing), and tactic-attention-unified-relation-cycle-rule
      (write-path cycle rejection). The acceptance bar for the resulting queue
      order is therefore "no obvious errors surfaced", NOT "the head of the
      queue is what the author wants worked next". This supersedes /qa-fix item
      6 on PR #3075 -- the sole needs-human item, which asked exactly that
      superseded question, against 5/5 other script-verifiable items that PASSed
      against the live store.


      The park was additionally CIRCULAR, which is independently sufficient to
      clear it. All three siblings named above record blocked_by:
      [tactic-attention-namespaced-rank] and sit at phase null, so none of them
      can start until this node lands. Holding this node parked pending an
      accurate rank order blocks precisely the work that would produce one;
      waiting for item 6 to become answerable is a deadlock rather than
      patience.


      Obvious-error check run this round on the PR branch at 78cfb0de over the
      live 248-candidate selectable set: 0 nodes with band > score -- the band
      <= score invariant that licenses retiring residual, here verified
      empirically over the whole candidate set rather than only argued from the
      lineage form; 0 negative or malformed rank keys; and a tier distribution
      of 248/248 tier-1 that is IDENTICAL to origin/main's, so the all-tier-1
      candidate population is pre-existing composition and not a collapse of the
      tier axis introduced by this change. The two visible outliers are
      documented design behavior, not defects:
      strategy-recursive-self-improvement falls from #12 to #175 with band 0,
      because none of its parents carries an authored tier-1 boost (74 of 248
      candidates sit at band 0 -- the accepted degeneracy that
      tactic-attention-per-tier-boost-migration resolves); and
      tactic-dispatch-skill-standards-extraction /
      tactic-ladder-per-phase-evaluation fall from #1-2 to #9-10 while carrying
      the highest scores in the top 30 (11.33) under band 6, because band
      dominates score lexicographically and band <= score still holds. Neither
      is an error no authored boost value would fix, which is this node's own
      routing test for an algorithm defect.


      This decision does NOT ratify the band derivation. "Band derives from the
      distributing node's RESOLVED rank" remains accepted on trust and stays
      enrolled for re-derivation on the born-parked node
      tactic-review-band-derivation-ratification; unparking here ships the
      mechanism without closing that question. Consistent with this node's own
      recorded caveat, no zero-inversion count was cited as evidence in reaching
      this decision -- the checks above are invariant checks, not a validation
      of the key against data.
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-attention-namespaced-rank
  pr: 3075
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T23:27:31Z
    mergeCommitSha: 6e804ce5753096e94b5fc7bd82a2d203a204b8bf
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Implement the unified rank key — one parent relation (parent/serves/recovers/reverse-blocked_by), the per-tier boost storage shape (retiring validateGraph rule 20), deduplicated lineage score, and the (tier, band, score, depth) quadruple — retiring override, the signal term and the blocked_by precedence lift

## Context

`resolveAttention` (`packages/intentionsutil/src/attention.ts`) today runs the
**v3 term-registry model**: three weighted terms (`authored` + `signal` +
`capture`) summed into one scalar `value`, an `override` branch cap that
discards incoming authority, a tier-isolation filter that drops lower-tier
sources, and a distributor relation restricted to `parent` ∪ `serves`. Blocking
urgency is carried by a **second, orthogonal mechanism** — `router.ts`'s
recursive max-based `effectivePrecedence` lift — and by a **third** copy of the
same idea in `officeHours.ts`'s `surfacingKey`. Because the authored term is a
flat sum, a tactic's own boost competes directly with its strategy's
distributed value, so a delegated number can reorder the author's strategies
(2139 such inversions were measured 2026-08-11; they are currently held at 0
only by a hand-applied `0.01`-per-level compression stopgap).

The 2026-08-12 `/align` round replaced that whole arrangement with **one
relation and one algorithm**, recorded as doctrine on
`strategy-graph-drives-dispatch` (the single-ranking-algorithm clarification and
the five that follow it) and as algebra on `kind-kind`. This node implements it.
The intended outcome: rank is derived from one parent relation, a delegated
boost can never cross a band, the stopgap compression becomes unnecessary, and
two of the three duplicated blocking-lift mechanisms are deleted rather than
maintained.

### The model to implement (doctrine, restated so a clean session needs nothing else)

- **Parent relation.** A node's parents are: the node named by its `parent`
  field, every node it `serves`, every delegation it `recovers`, and every node
  that lists it in `blocked_by` (i.e. every node it blocks). One relation drives
  every axis.
- **Tier.** Own tier defaults 1; `bug_fix`/`security` marks resolve 2;
  `attributes.tier: 3` resolves 3. `resolved = max(own, parents' resolved)`.
  Unchanged except for the widened relation.
- **Per-tier boosts.** Each node carries an authored boost **per tier**. In tier
  `T`'s ranking every node contributes its tier-`T` boost. This is what makes a
  node's rank well-defined in a tier it does not itself belong to, and so lets a
  tier-lifted tactic band against its parent's rank in the tactic's own resolved
  tier.
- **Score.** `score_T(n) = boost_T(n) + Σ boost_T(a)` over every **distinct**
  node `a` in `n`'s lineage (transitive closure of the parent relation). Each
  lineage node counts exactly once no matter how many paths reach it. No decay,
  no per-path multiplicity. An unauthored boost contributes **0** — there is no
  minimum boost of 1.
- **Band.** `max` over `n`'s parents `p` of `score_T(p)`, taken in `n`'s
  **resolved** tier `T`. No parents ⇒ band 0.
- **Rank key.** The lexicographic quadruple `(tier, band, score, depth)`,
  descending, where `depth` is the count of distinct lineage nodes.
- **Terminal nodes.** A node at `phase: done` contributes nothing to any axis,
  so rank decays as work lands instead of waiting on a prune.
- **Deleted outright:** `attention.override`, the signal term
  (`SIGNAL_TERM_WEIGHT`), `router.ts`'s `effectivePrecedence` lift,
  `officeHours.ts`'s `surfacingKey` lift, the tier-isolation source filter,
  `validateGraph` rule 20.

### Three model questions the doctrine leaves to implementation — decided here

1. **What "a `done` node contributes nothing" means mechanically.** It is
   implemented as ONE uniform rule: a `done` node's own boost is 0, its own tier
   mark is ignored, and it is **not** a member of any lineage set (so it adds no
   `depth`). It stays **transparent**: traversal still passes *through* it, so a
   live child under a `done` parent keeps inheriting everything above that
   parent. The hard-cut reading (severing the edge) is rejected: landing a
   parent tactic would then demote its live children to band 0, which inverts
   the doctrine's intent. Band from a `done` parent falls out of the same rule —
   `score_T(done p)` is just `p`'s ancestor sum, exactly the pass-through value.
2. **The tier-isolation filter (`attention.ts:518-539`) is deleted, not
   ported.** Its job — keeping a tier-1-scale value out of a tier-2 ranking — is
   done structurally by the per-tier boost map: in tier `T`'s ranking only
   tier-`T` boosts are read, so a tier-1 boost is invisible in tier 2 by
   construction. Keeping the filter as well would additionally drop the
   *tier-2 boost a tier-1 strategy authored*, which is the exact write per-tier
   boosts exist to enable.
3. **The capture term is re-attributed, not deleted.** Doctrine converts capture
   from a term into lineage via `recovers`, but making delegations score-bearing
   is the sibling `tactic-attention-delegation-scoring` (which is blocked on
   this node). Interim: `captureScoreFor` is computed **only** for the node that
   owns the `recovers` edges (strategies) and is added to that node's own
   contribution, so it flows down as ordinary lineage; the tactic-side
   `serves`-walking capture computation is deleted, because lineage now delivers
   it. This keeps `score` a single lineage sum (so `band <= score` holds and the
   residual-retirement argument stays valid), keeps a live signal alive, and
   moves in the sibling's direction rather than against it. The cap
   (`min(1, sum)`) and the tier-agnosticism of the capture addend are left
   exactly as they are today — both are the sibling's open questions.

### Design record carried forward from the superseded 2026-08-11 draft

The pre-unification draft body (residual component, `attention.scope` stamp,
`sum`→`max` combinator fix) is **retired** and is not restated here; it survives
in this file's git history before this round. What survives from it:

- **Band derives from the distributing node's RESOLVED rank**, not its authored
  term — ratified 2026-08-12. Reasons, still live: it is what makes
  cross-strategy inversion structurally zero; it preserves the assertion that
  strategies live on a single flat additive scale unchanged; and it required no
  change to `kind-kind`'s band definition. **This derivation was accepted by the
  author on trust rather than derived, and is enrolled for re-validation as the
  born-parked office-hours sitting `tactic-review-band-derivation-ratification`.
  Implementation obligation it creates: state the derivation explicitly in code
  (a named `band` computation with the doctrine cited), never let it fall out of
  a fold.**
- **Why the band is a fixpoint over the relation rather than a direct max over a
  node's own distributors:** an epic child whose only parent is another tactic
  has no distributing strategy and would fall to band 0; a tier-lifted tactic
  would lose its band exactly where it matters most. Under the widened relation
  + lineage form this is automatic, since band reads the parent's *score*, which
  is itself a lineage sum.
- **Why `depth` and not a minimum boost of 1.** A minimum boost of 1 made score
  a proxy for lineage size (measured on the live 597-node graph: `r=0.965`
  against distinct-ancestor count, `r=0.146` against the node's own authored
  boost; all 18 top-ranked selectable tactics at authored boost 0). Carrying the
  child-outranks-parent invariant on `depth` preserves it exactly — verified at
  **0 violations across all 846 parent edges** — while returning the top of
  queue to nodes with real authored claims (15 of 15).
- **Why `residual` is retired.** Every term now flows down the parent relation,
  so a node's lineage necessarily contains its band-defining parent and
  everything above it: `band <= score` always, the band is a constant inside
  every co-banded node's score, and ordering by `score` within a band is
  identical to ordering by `residual`. The multi-distributor `sum`→`max`
  value-honesty defect dissolves for the same reason.
- **The 2026-08-11 stopgap record.** All 42 open tactics carrying an authored
  boost were compressed onto a `0.01`-per-level ladder. Every compressed node
  carries its original magnitude at `attributes.pre_namespacing_boost` with a
  dated `NAMESPACING STOPGAP` paragraph in its `attention.rationale` (91 nodes
  carry the field today). **Query that field; do not reconstruct from git
  history.** Reverting the ladder is NOT this node's work — it belongs to
  `tactic-attention-per-tier-boost-migration` (the shape/value seam).

### Measurement caveats carried forward

- The `~1828 inversions against strategy resolved rank` figure and the
  `sum`→`max` value-honesty defect are **moot** under this design. Do **not**
  plan `tactic-dispatch-skill-standards-extraction` /
  `tactic-office-hours-graph-type-passthrough` as `sum`→`max` regression cases;
  use them instead as the multi-parent regression fixture for the dedup lineage
  score (each is reached by two strategies; each ancestor must count once).
- A probe once counted 75 cross-band inversions among open tactics under the old
  flat key and 0 under the new key. The 75 is a real measurement; **the 0 is
  structural, not empirical** — band dominates score lexicographically, so a
  lower-band node can never outrank a higher-band one by construction. Do not
  cite that 0 as evidence the key was validated against data; that
  unfalsifiability is what `tactic-review-band-derivation-ratification` exists
  to put back to the author.

### Explicitly out of scope (sibling-owned; do not absorb)

- `tactic-attention-delegation-scoring` — making delegations score-bearing so
  `recovers` carries real lineage. Until it lands, a `recovers` edge is a parent
  edge whose parent contributes boost 0.
- `tactic-attention-unified-relation-cycle-rule` — `validateGraph` rejecting
  cycles over the **whole** relation (rule 15 covers only `blocked_by` today).
  0 cycles exist in the live graph; the resolver here must therefore **converge
  silently** on a mixed cycle rather than throw.
- `tactic-attention-per-tier-boost-migration` — the authored **values**: the
  closed level vocabulary and its exported constant, the write-path
  off-vocabulary check, the `0.01` ladder revert,
  `strategy-graph-review-curriculum`'s `3.5`, and the last `override` **value**
  (`tactic-transition-node-stamp-landed-body`, `override: 60`, at phase `done`).
  This node deletes the **field**; the sibling drops the remaining **value**.
- `validateGraph` **rule 18 survives unchanged** and must not be touched. It is
  a tier-**authorship** guard (`schema.ts:1020-1076`), reading raw
  `attributes.tier` and `attention.rationale` only — not boosts. Neither tier
  authorship nor tier inheritance changes this round.
- Doctrine node edits (`intentions/kind-kind.md`,
  `intentions/strategy-graph-drives-dispatch.md`). `kind-kind`'s rule catalog
  stops at rule 18, so retiring rule 20 needs no graph edit, and its
  clarifications already anticipate the per-tier map. Graph writes belong to the
  align/office-hours lane, not to this PR.

---

## Unit 1 — Per-tier boost storage shape; delete `override`; retire rule 20

**Scope.** `packages/intentionsutil/src/schema.ts` and
`packages/intentionsutil/test/schema.test.ts` only.

- Replace `interface Attention` (`schema.ts:142-147`, doc comment from
  `schema.ts:~120`) with the sparse per-tier map:
  `{ boosts: Record<string, number>; rationale: string }`. Delete `boost`,
  `override`, and the `tier` namespace tag. Keys are the decimal tier strings
  `"1" | "2" | "3"` (validate against `TIERS`, `schema.ts:29`); values are finite
  and `> 0`. **Sparse is load-bearing**: an unauthored tier must stay
  distinguishable from an authored lowest value, so "not yet ranked in this
  tier" never reads as "ranked last". Use a plain object, never a `Map` — nodes
  are serialized with `yaml.stringify` (`src/store.ts:11,61`) and re-serialized
  into the office-hours seed as JSON.
- Rewrite `validateAttention` (`schema.ts:329-388`) to accept, and canonicalize
  to `boosts`:
  1. the canonical form `boosts: {1: 3, 2: 20}` (YAML integer keys arrive as
     JS string keys — accept and normalize both);
  2. **legacy** `boost: X` with optional `tier: T` (absent ⇒ 1) ⇒ `{ "T": X }`;
  3. **legacy** `override: X` with optional `tier: T` ⇒ `{ "T": X }` when
     `X > 0`, and `{}` when `X === 0` (the branch-cap semantics are gone).
  Reject: a non-null `attention` that yields an empty `boosts` map *and* carried
  no legacy `override: 0`; non-finite or `<= 0` values; keys outside `TIERS`; a
  missing or empty `rationale`. Comment the two legacy branches as compatibility
  sugar owned by `tactic-attention-per-tier-boost-migration` for deletion once
  node files are rewritten. **They are required, not optional**: the live store
  has 91 nodes on the legacy `boost:`/`override: null` form and one on
  `override: 60`, and rewriting node files here is the sibling's scope.
- Delete rule 20: `checkAttentionTierNamespace` (`schema.ts:1103-1121`), its
  call site (`schema.ts:1285-1286`), and its catalog entry
  (`schema.ts:1229-1240`). Add a one-line note in the catalog that rule 20 was
  retired with the per-tier map so **the next rule takes number 21** — rule
  numbers are cross-referenced from node bodies and must never be reused.
- Update `test/schema.test.ts`: the fixture at lines 27-37, the
  attention-validation block at lines 880-990 (boost/override/tier cases), and
  any rule-20 case. Per `.claude/rules/test-integrity.md`, replace coverage
  rather than delete it: keep an equivalent assertion for every invariant that
  still exists (rationale required and non-empty; `> 0` values; tier-key
  vocabulary) and add new cases for the sparse map, the two legacy
  reinterpretations, and the empty-map rejection.
- Add a **store round-trip test**: write a node carrying
  `boosts: {"1": 3, "2": 20}` through `writeNode`, read it back with `readNode`,
  and assert deep equality — this is what proves the YAML numeric-key handling
  is stable in both directions.

Out of scope: `ownTier` (`schema.ts:392-414`) is unchanged and stays the single
implementation of a node's own tier; rules 18 and 19 are untouched; no
`intentions/*.md` file changes.

**Recommended model:** opus

## Unit 2 — Rewrite `resolveAttention` onto the unified relation and the quadruple

**Scope.** `packages/intentionsutil/src/attention.ts` and
`packages/intentionsutil/test/attention.test.ts`.

- **`ResolvedAttention` (`attention.ts:14-46`)** becomes the rank key plus its
  explainability: `{ tier, band, score, depth, bandSource: string | null,
  sources: string[] }`. Delete `value` and `terms`; delete
  `interface TermContribution` and drop it from the re-exports in
  `src/index.ts:13` and `src/graph.ts:34`. Deleting `value` is deliberate — the
  resulting compile errors ARE the consumer audit Units 3 and 4 discharge.
  `bandSource` is the parent id whose score defined the band (null when band 0),
  and replaces the explainability that the retired lift mechanisms carried.
- **Export the shared key and comparator** from this module:
  `export interface RankKey { tier; band; score; depth }` and
  `export function compareRankKeyDesc(a, b): number` (lexicographic descending,
  tier outermost). Every consumer imports these instead of hand-rolling a
  comparator — that duplication is why three copies exist today.
- **Rename `distributorIds` (`attention.ts:339-348`) to `parentIds`** and widen
  it to `{parent} ∪ {serves} ∪ {recovers} ∪ reverseBlocked(c)`, keeping the
  existing shape: ids restricted to those that resolve, sorted for determinism,
  and the `isEligible(c)` gate retained on `serves`/`recovers`/reverse-blocked
  (a delegation's `serves` is deliberately unenforced, which is why that gate
  exists). Extract the `reverseBlockers` construction currently inlined at
  `attention.ts:176-183` into one exported helper and use it from both
  `computeSignalPath` and `parentIds`.
  **Precompute it once per run, not per sweep.** Build a
  `Map<string, string[]>` of every node's `parentIds` before the fixpoints
  start and read from it inside the loops. Today `distributorIds` allocates a
  fresh `Set` and a sorted array *per node per sweep*, and this design adds
  sweeps (the lineage set-union fixpoint below, the tier fixpoint, and per-tier
  scores over three tiers), so the per-sweep rebuild costs strictly more here
  than it did under the old resolver. This absorbs the surviving half of the
  pruned cost-lens follow-up (see Findings, item 1). The map is built from
  immutable node data, so hoisting it changes no result — assert that by
  keeping the existing determinism test green.
- **Lineage sets.** Compute `lineage(n) = ∪ over p ∈ parentIds(n) of
  ({p} \ done) ∪ lineage(p)` as a monotone set-union fixpoint, following the
  existing sweep shape (`attention.ts:417-438`): seed empty, sweep
  `sortedNodeIds` in id order, repeat until a full sweep changes nothing;
  because sets only grow, a size comparison detects change. Sets, not paths —
  this is what makes the score dedup-per-node and what makes a mixed cycle
  **converge instead of diverging**. Reuse `mustGet` (`attention.ts:409-415`).
- **Per-tier score.** `effectiveBoost(a, T) = a.phase === "done" ? 0 :
  (a.attention?.boosts[T] ?? 0)`, plus — for a node owning `recovers` edges —
  the interim capture addend (see Context decision 3). `score_T(n) =
  effectiveBoost(n, T) + Σ over a ∈ lineage(n) of effectiveBoost(a, T)`. Compute
  for all three tiers, then report the node's score in its own resolved tier.
- **Band.** `band(n) = max over p ∈ parentIds(n) of score_T(p)` where `T` is
  `n`'s **resolved** tier (not `p`'s), 0 when it has no parents; `bandSource` is
  the argmax (id ascending on ties). Write this as its own named function with a
  comment citing the doctrine and naming
  `tactic-review-band-derivation-ratification` as the ratification owed — the
  "state the derivation explicitly in code" obligation.
- **Depth.** `depth(n) = |lineage(n)|`.
- **Tier fixpoint (`attention.ts:440-470`)** keeps its shape but runs over the
  widened relation and honors the done rule: a `done` node contributes its own
  tier mark as 1, while still relaying an inherited tier. Keep it resolved for
  EVERY node (an ineligible node can relay), with `ResolvedAttention` entries
  only for eligible ones.
- **Deletions.** `SIGNAL_TERM_WEIGHT` (`attention.ts:56-57`) and the signal term
  at `attention.ts:472-477`, `556` — **but `computeSignalPath`
  (`attention.ts:154-243`) STAYS**, exported and unchanged: `router.ts:2,472`
  consumes it for the strategy-eligibility gate, which this round does not
  touch. Delete the `override` seeds and short-circuit
  (`attention.ts:265-280, 384-396, 541-554`), the tier-isolation filter and its
  comment block (`attention.ts:518-539`), and the whole term-registry
  composition. `captureScore`/`divergenceScore`/`irreversibilityScore`
  (`attention.ts:98-135`) stay; `captureScoreFor` (`attention.ts:481-506`) loses
  its `serves`-walking tactic branch (lineage delivers it now).
- **Keep the pure-parent cycle guard (`attention.ts:350-372`) as-is** — `parent`
  is a single pointer, so the guard is cheap and its rationale is unchanged —
  but rewrite the doc comments at `attention.ts:247-321` and `350-359`, which
  currently assert that mixed `parent`/`blocked_by` cycles "can no longer
  arise". They can again. State instead: a mixed cycle converges silently under
  the dedup fixpoint (child-outranks-parent collapses inside the cycle rather
  than erroring), and rejecting it on the write path is
  `tactic-attention-unified-relation-cycle-rule`'s scope.
- **Tests** (`test/attention.test.ts`): update the fixture builders
  (`boost()`/`override()`, lines 43-58) to the new `Attention` shape — `boost()`
  becomes a per-tier map builder, `override()` is deleted. Per
  `.claude/rules/test-integrity.md` the override block (lines 195-284) and the
  signal-term block (lines 320-370) are **replaced, not deleted**: rewrite them
  as coverage of what subsumes them (lineage flow with no cap; correction of a
  wrong graph via the LINEAGE rather than via a number). Keep and re-derive the
  tier-axis block (lines 570-719), rewriting the three isolation-filter cases
  (659, 678, 698) as per-tier-boost cases. Add cases for: a diamond (one
  ancestor reached by two paths counts once); `recovers` and reverse-`blocked_by`
  as parent edges; a `done` node contributing nothing while staying transparent
  for its live child; band taken in the child's resolved tier; child-outranks-
  parent on `depth` at equal band/score; a mixed cycle converging without a
  throw; determinism under input reordering (the existing block at line 298).

**Dependencies:** Unit 1.
**Recommended model:** opus

## Unit 3 — Retire the selector's precedence lift; sort on the quadruple

**Scope.** `packages/intentionsutil/src/router.ts` and
`packages/intentionsutil/test/router.test.ts`.

- Delete `interface Precedence` (`router.ts:245-249`), `PrecedenceResult`
  (`258-261`), `maxPrecedence` (`264-267`), and `effectivePrecedence`
  (`269-381`) in full, including its `reverseBlockers` walk, memo/stack cycle
  machinery, and `ownPair`. Blockers are parents now; the lift is redundant.
- Remove `"precedence-cycle"` from the `SelectionEvent` union (`router.ts:76`)
  and its doc comment (`77-84`); the cycle case is
  `tactic-attention-unified-relation-cycle-rule`'s, and the resolver no longer
  degrades ordering on one.
- `GraphCandidate` (`router.ts:28-49`): replace `rank`, `tier`, and
  `precedence: {tier, rank}` with the single `key: RankKey` imported from
  `attention.ts`, sourced directly from `resolveAttention` (there is no lift, so
  the "own pair vs lifted pair" distinction that justified carrying both
  disappears). Update the four candidate constructions (`router.ts:552, 580,
  593, 612`) and the fallback for a node absent from the resolved map (use
  `ownTier(n)` and zeros, mirroring today's `precedenceOf`, `router.ts:478-479`).
- Sort comparator (`router.ts:673-682`): `compareRankKeyDesc(a.key, b.key)`,
  then progression ordinal descending, then id ascending — the two trailing
  tiebreaks are unchanged. Update the `GraphSelection`/`selectGraphTargets` doc
  comments (`router.ts:86-92`, `440-465`), which currently describe the lifted
  pair.
- Confirm by grep that no shell script or non-TS consumer reads `precedence`,
  `.rank`, or `.tier` off the selection JSON (`scripts/select-targets.ts:59`
  emits the whole object; the audit at plan time found none in
  `.claude/skills/**` — re-verify before relying on it).
- Update `test/router.test.ts` and `test/check-node-selection.test.ts` for the
  field rename. Every existing ordering assertion must be re-derived under the
  new key rather than adjusted until green: a blocker that used to sort by a
  lifted pair now sorts by an inherited band, and an assertion that still passes
  by coincidence is worse than a failing one.

**Dependencies:** Unit 2.
**Recommended model:** opus

## Unit 4 — Migrate the remaining rank consumers onto the one shared key

**Scope.** `packages/intentionsutil/src/goals.ts`, `src/hold-alerts.ts`,
`src/officeHours.ts`, `src/rsi.ts`, `scripts/office-hours-select.ts`,
`scripts/list-unclaimed-hold-alerts.ts`, `src/index.ts`, `src/graph.ts`, and the
matching tests (`test/goals.test.ts`, `test/hold-alerts.test.ts`,
`test/office-hours.test.ts`, `test/rsi.test.ts`).

- **`hold-alerts.ts`** — delete the local `interface Rank`, `compareRankDesc`,
  and `atOrAbove` (`46-62`); import `RankKey`/`compareRankKeyDesc` and express
  the top-K cutoff as `compareRankKeyDesc(rank, cutoff) <= 0`. In
  `listUnclaimedHoldAlerts` (`104-168`) the pool, the cutoff, and the
  source-rank read all move to the quadruple. `UnclaimedHoldAlert.sourceValue`
  (`33-34`) becomes `sourceBand`/`sourceScore`; the CLI row
  (`scripts/list-unclaimed-hold-alerts.ts:106-107`) is tab-separated — **append**
  the new column rather than reordering the existing ones, and update any
  reader.
- **`officeHours.ts`** — delete `interface AttentionKey`, `attentionKeyOf`,
  the local `reverseBlockers`, `liftsKey`, and `surfacingKey` (`105-181`). This
  is the **third** copy of the retired blocking lift and it goes for the same
  reason as `effectivePrecedence`: a park's blocked source is now its parent, so
  its band already carries that source's score, and the lift would be
  structurally inert (`liftedFrom` would always be null). `QueueMember`
  (`15-43`) carries the quadruple; `liftedFrom` is replaced by `bandSource` from
  `ResolvedAttention`; `ownTier`/`ownRank` keep reporting the node's own,
  un-penalized values. Apply `SESSION_TYPE_PENALTY` (`officeHours.ts:13`) to
  **both** `band` and `score` so the soft demotion still bites across bands, and
  never to `tier` — the tier comparison stays hard. `compareQueueMembers`
  (`183-188`) delegates to `compareRankKeyDesc` then id ascending.
- **`scripts/office-hours-select.ts`** — `formatQueueRow` (`182-184`) is a
  **pinned 4-column tab-separated contract** parsed by
  `.claude/skills/dispatch-propagate/scripts/office-hours-graph` and
  `dispatch-terminal-gap-audit`, and ratcheted by a unit test. Keep exactly four
  columns in the same order; the first column becomes the penalized **score**.
  Rewrite `formatLiftNote` (`190-196`) as a band note —
  `NOTE — <id> ranks at tier <t> band <b> via <bandSource> (own score <s>)` —
  emitted when `bandSource !== null`, and update its test.
- **`goals.ts`** — `projectGoals` (`90-117`) sorts on `compareRankKeyDesc`
  before its existing gap/signal/id tiebreaks. `renderFrontier` (`176-199`):
  the tier marker is unchanged; the rank marker becomes
  ` [band <band> rank <score> via <sources[0]>]` (drop ` via …` when `sources`
  is empty, render nothing when band and score are both 0). Delete
  `formatTermBreakdown` (`139-150`) and the `TermContribution` import; keep
  `formatRank` (`123-129`). Byte-stability of the render is asserted in
  `test/goals.test.ts` — update the expectations there deliberately.
- **`rsi.ts`** — `renderPriorities` (`450-470`) reads `attention?.value`; move it
  to `band`/`score` and widen the rendered table's `rank` column accordingly.
  Note the local variable named `band` at `rsi.ts:471` is the unrelated
  *backlog* band — do not conflate the two; rename one if it reads ambiguously.
- **Exports** — `src/index.ts:10-13` and `src/graph.ts:27-34`: drop
  `TermContribution`, add `RankKey` and `compareRankKeyDesc`.
  `office-hours/src/graph-source.ts:454,490` only stores the
  `Map<string, ResolvedAttention>` in its view object and never reads a field,
  so it needs no change beyond typechecking clean.

**Dependencies:** Unit 2 (Unit 3 first if taken in order, since both import the
shared key).
**Recommended model:** opus

## Unit 5 — Re-derive the queue and diff the order against the pre-change ranking

**Scope.** No shipped source changes. A throwaway `tsx` probe (write it under
`$TMPDIR`, not the repo) that loads the live store at `intentions/` twice —
once at the merge-base of this branch, once at working-tree HEAD, using
`packages/intentionsutil/scripts/lib-store-at-ref.ts` for the "before" side —
and reports, into the PR body:

1. The top ~30 selectable candidates before and after, side by side
   (`selectGraphTargets`), with each node's `(tier, band, score, depth)`.
2. Every node whose ordinal moved by more than a few places, with the parent
   edge that explains the move.
3. A check that **no node's rank is now defined by a `done` node** and that no
   live child was demoted by its parent being `done`.
4. A count of nodes whose band is 0 (no parents) and of tier-2/3 nodes whose
   band is 0 — the accepted degeneracy of the per-tier model until values are
   authored, which is the sibling migration's input, not a defect here.
5. The two multi-parent nodes `tactic-dispatch-skill-standards-extraction` and
   `tactic-office-hours-graph-type-passthrough`: confirm each ancestor is
   counted once (not summed per path).

Then **judge** the resulting order rather than assuming it. The bootstrap-era
hand-set boosts (`attributes.pre_namespacing_boost`, 91 nodes) are reinterpreted
as within-band ordering by this change; confirm the top of the queue is the
intended work. If it is not, the remedy is a note to the author in the PR body —
**not** a value edit, which is
`tactic-attention-per-tier-boost-migration`'s scope.

**Dependencies:** Units 1-4.
**Recommended model:** opus

---

## Reuse

- `resolveAttention` (`packages/intentionsutil/src/attention.ts:322`) — modify in
  place; keep its purity contract (same nodes in, deep-equal map out; nothing
  written back to frontmatter), its sorted-sweep determinism, and its
  `mustGet` helper (`attention.ts:409-415`).
- The monotone-fixpoint sweep shape at `attention.ts:417-438` (authored) and
  `attention.ts:456-470` (tier) — the lineage fixpoint follows it rather than a
  fresh BFS.
- The reverse-`blocked_by` construction at `attention.ts:176-183` — extract once,
  use from `computeSignalPath`, `parentIds`, and delete the copies in
  `router.ts:309-318` and `officeHours.ts:128-139`.
- `computeSignalPath` (`attention.ts:154-243`) — **kept**, still exported for
  `router.ts:472`'s strategy-eligibility gate. Its provisional-false DFS
  memoization discipline (`185-233`) is the existing template for a
  cycle-tolerant walk over a mixed relation.
- `ownTier` (`schema.ts:392-414`) — the single canonical own-tier computation;
  call it, never re-derive tier logic.
- `captureScore` / `divergenceScore` / `irreversibilityScore`
  (`attention.ts:98-135`) — kept as-is; only the attribution point moves.
- `TIERS` / `AUTHORABLE_TIERS` / `DEFAULT_TIER` (`schema.ts:29-35`) — the tier
  vocabulary for the boost-map keys.
- `writeNode` / `readNode` (`src/store.ts`) — the round-trip gate for the new
  storage shape; `validateNode` remains the single validation entry point.
- `lib-store-at-ref.ts` (`packages/intentionsutil/scripts/lib-store-at-ref.ts`)
  — loads the store at a git ref for Unit 5's before/after diff.
- Test fixture builders `anode()` / `svnode()` / `kinds()`
  (`test/attention.test.ts:6-84`) — reuse, do not hand-roll new literals.
- `.claude/rules/test-integrity.md` — every retired mechanism's tests are
  **replaced with coverage of what subsumes them**, never skipped or deleted to
  green.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app office-hours
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
npx vitest run --project office-hours --root .
```

The live store is the real parser fixture: this must pass unchanged, proving the
legacy `boost:`/`override:` forms in all 91 attention-carrying node files still
parse under the new shape and that rule 20's removal broke no other rule.

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual and judgment checks:

- **Selector smoke over the live store.** Run
  `npx tsx packages/intentionsutil/scripts/select-targets.ts` and confirm it
  emits a non-empty candidate list whose head is defensible work, with each
  candidate carrying a full `(tier, band, score, depth)` key. An empty list, or
  a head chosen by depth alone, means the relation or the done rule is wrong.
- **Office-hours queue smoke.** Run
  `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list` and
  confirm four tab-separated columns in the pinned order and a plausible
  ordering; the parked queue is read by two shell parsers that fail silently on
  a reorder.
- **The Unit 5 before/after queue diff**, recorded in the PR body with the
  author-facing judgment about whether the reinterpreted bootstrap boosts
  produce the intended top of queue. This is the substantive verification; the
  suites above only prove internal consistency.
- **Do not cite a zero cross-band inversion count as evidence.** It is
  structural (band dominates score lexicographically), not empirical. State it
  as structural if it appears in the PR body at all.
- **Sibling handoff check.** Confirm the PR leaves
  `tactic-attention-per-tier-boost-migration` able to proceed: the sparse
  per-tier map exists, an unauthored tier is distinguishable from an authored
  lowest value, and the two legacy parse branches are commented with that node's
  id as their removal owner.

---

## Findings recorded this round (2026-08-12 `/align-tactics` finalize)

Three observations surfaced by this round's drift review. All three are
**immaterial** — none changes the design or blocks the plan — and they are
recorded here rather than on `strategy-graph-drives-dispatch` because a
per-node `/align-tactics <tactic-id>` session never edits the serving
strategy's frontmatter.

1. **This node ORPHANED a live sibling — since PRUNED (author-decided
   2026-08-12).** The raw tactic tactic-select-targets-redundant-attention-resolve
   (filed 2026-08-01 from the PR #2997 cost-lens review, advisory/non-Required,
   never adversarially verified) proposed that `selectGraphTargets` stop
   recomputing `resolveAttention` twice per tick by passing its already-built
   map into `effectivePrecedence`. Unit 3 **deletes** `effectivePrecedence`
   outright, so that headline premise disappears when this node lands rather
   than being satisfied by it. The author pruned the node as moot in the same
   round that finalized this plan; it is gone from the graph, and this
   paragraph is its only remaining record.

   **Its second half was NOT moot and is absorbed into Unit 2** — see the
   `parentIds` bullet there. The pruned node's closing suggestion was to hoist
   the per-node distributor-set construction out of the fixpoint sweeps by
   precomputing it once. Unit 2 renames `distributorIds` to `parentIds` and
   widens it, but keeps its per-call shape, and this design runs **more**
   sweeps over it than the old one did (a lineage set-union fixpoint and a tier
   fixpoint, with per-tier scores across three tiers). So the redundant-work
   observation gets *stronger* on that half, not moot. It is a near-free
   addition to code Unit 2 already rewrites wholesale, which is why it rides
   there instead of surviving as its own node.

2. **One rank consumer is missing from Unit 4's list.**
   `packages/intentionsutil/scripts/render-rsi-plan.ts:142-217` parses
   `office-hours-select.ts`'s tab-separated queue row **by regex**, with a
   column-count check at line 168. Unit 4 names `office-hours-graph` and
   `dispatch-terminal-gap-audit` as the parsers the 4-column contract must hold
   for; `render-rsi-plan.ts` is a **third** parser and must be checked in the
   same breath. It also parses the `NOTE` line, so Unit 4's rewrite of
   `formatLiftNote` into a band note has to be reflected there too. More
   generally: the node's own rewrite-surface measurement counted only the
   **authored**-shape readers (`attention.tier` in two places, `boost`/`override`
   in five); the **resolved**-shape surface the quadruple actually breaks is
   wider — four in-process consumers, three of which carry independent
   hand-rolled copies of the same lexicographic `(tier, value)` compare
   (`router.ts`'s `Precedence`/`maxPrecedence`, `hold-alerts.ts`'s
   `Rank`/`compareRankDesc`/`atOrAbove`, `officeHours.ts`'s
   `AttentionKey`/`liftsKey`/`surfacingKey`/`compareQueueMembers`) — plus the
   one script-to-script text contract above. Units 3 and 4 already target all
   four in-process consumers; this note exists so the text contract is not
   missed.

3. **Verification method — which cited figures a grep can and cannot
   reproduce.** Statically reproducible, and re-confirmed this round: the 19
   `recovers` edges across 22 delegations, the 5-node tier-2 population (4
   `bug_fix` marks, 1 `security`), `kind-delegation` carrying no
   `goal_layer: true`, and rule 18 restricting authored `attributes.tier: 3` to
   `strategy-main-health` alone. **Not** reproducible by grep: the "tier 3 is 5
   more nodes" count with its `(9, 8, 8, 4, 3)` distinct-ancestor ordering, the
   273-vs-122 per-path-versus-dedup max-score comparison, and the ~1828
   inversion figure — all are resolved-tier/resolved-score quantities requiring
   a run of `resolveAttention` over the whole node set. Nothing contradicts
   them; they are unverified statically, not falsified. Any verification step
   that needs one of them must **execute the resolver**, never a grep.

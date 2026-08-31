---
id: strategy-graph-drives-dispatch
kind: strategy
statement: Close the loop — intent enters execution from the graph, and
  execution reports back as readings
owner: human
status: refining
parent: strategy-explicit-intent
rationale: >-
  The loop this strategy owns — intent enters execution from the graph, and
  execution reports back as readings — is half real (amended 2026-07-09: the
  child strategy-graph-native-dispatch made the entry side load-bearing — work
  enters execution because a node calls for it, the queue's ordering comes from
  resolved rank, and orchestration state is migrating into the nodes). The
  feedback side stays open: readings are sensor-populated almost nowhere, and
  this strategy's own success signal is unmet until sensor-run readings exist
  for every strategy that names a sensor. The first coupling attempt was a
  gh↔graph mapping layer (intention-emit, backfill, trackers/, the rank-map
  ordering bridge); it is superseded and removed — the child
  strategy-graph-native-dispatch closes the loop natively instead, with the
  legacy gh router draining in parallel over disjoint state. Integration with an
  external tracking system such as GitHub is a separate strategy; design TBD.

  This strategy owns making the loop real: work enters execution because a node
  calls for it (serves classified when the dialectic records a tactic), sensors
  write readings and gaps back after execution, and the next dialectic consumes
  that feedback when it triages. strategy-autonomous-execution owns the chain
  itself; this node owns the chain's coupling to intent.
reading: "serves: 121/121 open tactics; readings: 19/53 sensor-naming strategies
  (45 unregistered sensors)"
serves:
  - virtue-philosophical-mobility
  - virtue-progressive-detachment
recovers: []
clarifications:
  - question: Where do attention injections live, and what does the router consume?
    answer: Authored attention injections live in git (frontmatter) as additive
      boosts or branch-scoped overrides, each with a rationale; rank is derived
      on read by resolveAttention — undecayed, undiluted, each authored source
      counted once per node — and never stored. The dispatch router consumes
      resolved ranks directly from the tree; the priority label is retired and
      escalating any issue means authoring a boost on its tactic node. Equal
      ranks are honest ties. Supersedes the same-day banded design (bands,
      provenance discount, subordinate_to, emit-time projection) after the
      2026-07-02 scenario interview.
  - question: How are ordering constraints ("do A before B") expressed?
    answer: "Never through attention. Blocking is a separate tactic-layer mechanism
      — a tactic subtree blocks another, and no tactic in the blocked subtree
      begins until every tactic in the blocking subtree completes; the gate
      releases itself as tactics close. Strategies are never blocked, and
      strategy refinement, documentation, and emission are never gated — the
      router is the single enforcement point. Recorded 2026-07-02. Amended
      2026-08-12 (author-dictated): superseded. Ordering constraints ARE now
      expressed through the ranking algorithm — a blocked node is its blocker's
      parent, so a blocker always outranks what it blocks by construction rather
      than by a separate serialization mechanism. Blocking remains the sole
      GATING mechanism (a blocked node stays ineligible regardless of rank);
      what is retired is the separation of ordering from rank, not the gate. See
      the 2026-08-12 single-ranking-algorithm entry below."
  - question: What does authoring a `serves` edge imply for rank?
    answer: It is a ranking act — a second serves edge adds a real claim to the
      node's rank, so edge authoring deserves the same review care as weights.
      Recorded 2026-07-03.
  - question: What if one hot strategy's wide subtree monopolizes the queue?
    answer: Accepted by design — hot means hot; its work drains first; the remedy is
      re-weighting the strategy, never re-introducing fan-out dilution. Recorded
      2026-07-03.
  - question: Where does authored attention flow — what is the critical path to a
      hot node?
    answer: "Downward only: a node's outgoing authored source-set flows to its
      subtree along parent/serves, undecayed and undiluted, each authored source
      counted once per node, overrides distributing the same as boosts. The
      2026-07-07 widening — backward flow along blocked_by so a hot node's
      blockers inherit its sources — is superseded 2026-07-13: blocking is
      orthogonal to boosting (next clarification), so authored rank never flows
      backward. The critical path to a hot node is still drained first, but by
      serialization precedence, not boost inheritance. Existing authored boosts
      keep their value and meaning. Recorded 2026-07-07 interview; superseded in
      part 2026-07-13 interview (author-dictated orthogonality). Amended
      2026-08-12 (author-dictated): the backward flow along blocked_by is
      RESTORED, in a different form. blocked_by is a parent edge in one unified
      relation, and authority flows as LINEAGE with each lineage node counted
      exactly once regardless of how many paths reach it. That per-node
      deduplication is what makes it safe where the 2026-07-07 additive per-path
      form was not. 'Downward only' is therefore no longer the rule; the rule is
      that authority flows along the parent relation, of which blocked_by is now
      part."
  - question: Does backward rank flow along blocked_by change the blocking mechanism?
    answer: "Superseded framing, 2026-07-13: there is no backward rank flow.
      Blocking is orthogonal to boosting — blockers are serialized by a distinct
      precedence mechanism: a blocker's selection precedence lifts to at least
      the maximum effective precedence of the nodes it blocks (recursive and
      max-based, never additive, so nothing compounds), while its boost-derived
      rank value is untouched — blocking nodes are ranked higher, not boosted
      higher. Blocking remains the sole gating mechanism (a blocked node stays
      ineligible regardless of rank, and ordering constraints are still never
      expressed through attention — this restores the 2026-07-02 separation in
      full). Rationale for the supersession: the additive backward flow let
      unrelated blocked_by compounding silently overtake intentionally
      top-ranked nodes (recorded live lesson, 2026-07-07), a failure mode made
      unacceptable by strategy-main-health's standing boost 100
      (strategy-graph-native-dispatch, 2026-07-13). The structural signal term's
      blocked_by reachability (flat +1 for on-path nodes) is unaffected —
      boolean reachability, not additive compounding. Implementation retained in
      draft tactic-attention-blocking-orthogonal. Recorded 2026-07-13 interview
      (author-dictated). Amended 2026-07-18: under the tier model the precedence
      lift generalizes to the lexicographic (tier, rank) pair — see the
      2026-07-18 tier clarifications. Amended 2026-08-12 (author-dictated; the
      orthogonality ruling was explicitly declared not binding at the opening of
      that interview): there IS backward rank flow again, and blocking is no
      longer orthogonal to boosting. One ranking algorithm; a blocked node is
      its blocker's parent; the separate max-based precedence mechanism is
      deleted rather than generalized. The 2026-07-07 compounding hazard
      recorded above does not return, because lineage is deduplicated per node —
      see the 2026-08-12 entry on what the unification costs and why it is safe
      now."
  - question: How does the intention-store instrument distinguish sensor-run
      readings from hand-written ones?
    answer: "Mechanically it cannot: reading provenance is not recorded in
      frontmatter. The intention-store sensor counts a sensor-naming strategy as
      read when its reading is non-null, and separately reports how many name a
      sensor absent from the read-sensors registry — those readings cannot have
      been driver-run. For owner-review sensors the owner writing the reading at
      office-hours is itself the sensor run, so existence is the honest proxy
      there. A first-class provenance field is deliberately out of scope this
      round. Recorded 2026-07-11 /align-tactics round."
  - question: How do defects and production incidents outrank feature work — what is
      the tier model?
    answer: "Ranking gains an outer tier axis — an author-dictated amendment of the
      terms-with-weights-never-bands doctrine: tiers ARE bands, deliberately,
      layered above the term-composed rank; the terms-and-weights doctrine
      continues to govern ordering within a tier. Three tiers: tier 1 (default)
      is all ordinary work; tier 2 is bug fixes and security issues, plus
      anything explicitly lifted to tier 2; tier 3 is production/main issues
      (e.g. CI failing on main), plus anything explicitly lifted to tier 3. The
      selector sorts by tier first, always — every tier-3 node outranks every
      tier-2 node outranks every tier-1 node — and boost-derived rank orders
      within a tier. Diverges from the additive-term rival (a +K bug-fix term
      keeping the never-bands doctrine intact) deliberately: a term-based floor
      is relative to other terms magnitudes and erodes as weights evolve, while
      a tier is an absolute guarantee. This replaces the special-case
      standing-boost-100 mechanism on strategy-main-health: red-main work
      becomes tier 3 membership rather than a dominant boost. Migration is
      must-land-first: strategy-main-health boost 100 and the write-path guard
      protecting it (strategy-graph-native-dispatch, 2026-07-13) stay
      authoritative until the tier implementation lands; draft
      tactic-attention-tier-ranking flips main-health to tier 3 and amends the
      guard in the same change. Recorded 2026-07-18 interview
      (author-dictated)."
  - question: How is a node marked as a bug fix or security issue, and how is tier
      expressed?
    answer: "Semantic marks are kind-agnostic attributes fields: attributes.bug_fix:
      true and attributes.security: true each imply tier >= 2 — the mark names
      WHY the node ranks. An explicit attributes.tier: 2 or 3 expresses
      non-semantic lifts, including tier 3 for production/main issues. A node
      own tier = max(semantic-implied, explicit, 1); absent all marks a node is
      tier 1. Marks live in free-form attributes, so authoring them needs no
      schema change; the implementation adds validate-graph shape checks
      (booleans; tier in {2,3}). Recorded 2026-07-18 interview."
  - question: Does tier flow to other nodes, and how does it interact with blocking
      precedence?
    answer: "Tier inherits downward along parent/serves — the same edges authored
      boosts flow on — max-based: a node effective tier = max(own tier, each
      distributor effective tier), so marking a strategy tier 3 lifts its
      subtree and nothing compounds. Blocking precedence generalizes from rank
      to the pair: a blocker effective selection precedence lifts to at least
      the lexicographic max (tier, rank) of the nodes it blocks — recursive and
      max-based, never additive — so a tier-1 blocker of a tier-3 node drains
      with tier-3 urgency while its own marks and authored rank are untouched.
      This extends the 2026-07-13 blocking-orthogonal-to-boosting doctrine
      unchanged in spirit: blocking still gates and serializes, never boosts.
      Recorded 2026-07-18 interview. Amended 2026-08-12: the blocking-precedence
      lift described here is DELETED. Tier still inherits max-based, but along
      the widened parent relation that now includes blocked_by, so a blocker
      inherits the tier of what it blocks directly rather than through a
      parallel precedence pair. Consequence recorded with that change: resolved
      tier stays correct for ORDERING but is no longer usable for COUNTING
      production issues — a consumer that classifies must read ownTier, not the
      resolved tier."
  - question: Which nodes carry the first bug_fix/security marks?
    answer: "The 2026-07-18 round applied attributes.bug_fix: true to the ten clear
      defect-fix tactics open at the time
      (tactic-align-tactics-self-claim-collision,
      tactic-graph-fastpath-guard-diff-base,
      tactic-office-hours-snapshot-wire-contract,
      tactic-qa-fix-office-hours-reentry-guard, tactic-analytics-preinit-vitals,
      tactic-align-init-rename-stale-node-refs,
      tactic-align-strategy-stepref-drift-dataviz,
      tactic-review-fix-residue-death-coverage,
      tactic-office-hours-graph-freshness-guard,
      tactic-graph-review-exclusion-stall-recovery) and attributes.security:
      true to tactic-prerender-single-injection-path. Borderline candidates
      (mixed-scope or design-remedy nodes) are listed in draft
      tactic-attention-tier-ranking for a later author call, not marked. Marks
      are inert until the tier implementation lands. Recorded 2026-07-18
      interview."
  - question: Is 'boost a node to top rank' a scripted operation, and what
      discipline governs it?
    answer: "(Recorded 2026-07-21 interview.) Yes — 'boost to top rank' is a
      first-class scripted operation a session runs on author request,
      superseding the hand-edit practice this strategy records ('escalating any
      issue means authoring a boost on its tactic node'). It is a CONSIDERED
      boost, not a mechanical race-to-top: the script computes the MINIMAL boost
      that tops the node's current tier (grounded in the resolved ranks the
      selector reads), shows the current ranking for the author, and REQUIRES an
      author rationale — the attention field already mandates `rationale`. This
      adopts the considered-boost framing and diverges from the mechanical
      max+epsilon rival to preserve the honest-ties and
      terms-and-weights-never-erode discipline recorded here: the script assists
      the considered act, it does not replace the judgment. 'Top rank' is always
      top-of-current-tier; it never silently changes the node's tier to reach
      top-overall — mechanically it cannot, since tier is the outer
      lexicographic axis and a boost only ever orders within a tier (see the
      tier-scoped-boost clarification). Pre-tier (before
      tactic-attention-tier-ranking lands) the single ranking scale is the one
      tier, so the script operates on the resolved-rank scale directly; the
      tier-aware default is future work gated on that tactic."
  - question: Do boost values carry across a tier change, and how is that governed?
    answer: "(Recorded 2026-07-21 interview, author-directed.) No — boost values are
      TIER-SCOPED via a per-tier boost namespace. A boost magnitude is
      meaningful only within the tier it was chosen for: because tier is the
      outer axis a node's boost ranks it only against same-tier peers, and
      different tiers can be on entirely different boost scales — a value chosen
      mid-way in tier 1 could wrongly dominate tier 2 if carried in (the
      author's failure scenario). So changing a node's tier does NOT carry its
      boost: the target tier's boost is absent until a fresh value is explicitly
      selected for that tier. This is a MECHANICAL guarantee (a per-tier
      namespace enforced by the schema / validate-graph), not merely a scripting
      convention, so the failure scenario is structurally impossible rather than
      tooling-dependent. This AMENDS the 2026-07-18 tier-model assumption that a
      single scalar `attention.boost` composes tier-orthogonally (see 'How do
      defects and production incidents outrank feature work — what is the tier
      model?'): under the namespace, boost is stored/interpreted per tier. Open
      design consideration retained for tactic-attention-tier-ranking, not
      resolved here: how a per-tier boost composes with the recorded downward
      flow of authored boosts along parent/serves (the 2026-07-07/13 flow
      clarifications). The exact storage shape (a map keyed by tier vs a
      tier-tagged value) and the validate-graph shape check are tactical,
      retained in tactic-attention-tier-ranking. Gated on that tactic landing —
      tiers are not yet built. Amended 2026-08-12: the open design consideration
      retained here — 'how a per-tier boost composes with the recorded downward
      flow of authored boosts along parent/serves' — is now ANSWERED, and this
      entry's per-tier namespace is adopted rather than revised. In tier T's
      ranking every node contributes its tier-T boost, throughout the whole
      lineage sum. That makes 'a rank for each tier' well-defined for every
      node, including nodes that do not themselves belong to tier T, which is
      precisely what lets a tier-lifted tactic band against its parent's rank IN
      THE TACTIC'S OWN resolved tier rather than against the parent's resolved
      tier. One requirement this adds to the storage shape left tactical here:
      an unauthored tier must stay distinguishable from an authored lowest
      value, or 'not yet ranked in this tier' reads as 'ranked last'."
  - question: Is changing a node's tier the same operation as boosting it to top rank?
    answer: (Recorded 2026-07-21 interview.) No — a tier change is a DISTINCT
      scripted operation, run only on an explicit author request for a tier
      change; it is never inferred from a 'boost to top rank' request, which
      always stays within the node's current tier. A tier change sets the node's
      tier (attributes.tier, or the semantic bug_fix/security marks that imply
      tier >= 2 — see 'How is a node marked as a bug fix or security issue, and
      how is tier expressed?') and, because of the per-tier boost namespace,
      selects a fresh boost value for the target tier as part of the same
      operation (the old tier's value is not carried). Both scripts' tier-aware
      behavior is gated on tactic-attention-tier-ranking landing;
      strategy-main-health's boost-100 -> tier-3 migration (the must-land-first
      change in that tactic) is the canonical precedent for a tier change that
      drops a large boost rather than carrying it forward.
  - question: Does the never-bands doctrine survive namespaced tactic rank?
    answer: "(Recorded 2026-08-11, third round, after adversarial review found this
      node contradicted by a same-week /align round that never amended it.) It
      survives as amended, for the second time, and the amendment is deliberate.
      Two clarifications on this node are otherwise left false by that round.
      Clarification 1 records that the shipped design 'supersedes the same-day
      banded design (bands, provenance discount, subordinate_to, emit-time
      projection)' — a banded design was considered and REJECTED here.
      Clarification 8 records that 'tiers ARE bands, deliberately, layered above
      the term-composed rank; the terms-and-weights doctrine continues to govern
      ordering within a tier'. The 2026-08-11 rank-namespacing round introduces
      a SECOND band — distributing-strategy rank, sitting between tier and the
      term-composed value — so ordering within a tier is now governed by band
      first and terms second. That sentence needs reading as: terms-and-weights
      govern ordering within a BAND. Why the 2026-07-02 rejection does not carry
      over, stated so this is a re-decision and not an oversight: what was
      rejected then was PROVENANCE-DISCOUNTED bands with emit-time projection,
      under the standing assumption of a single trusted authority setting every
      number — the objection was that discounting a claim by who emitted it made
      rank unreadable and ties dishonest. The new band rests on a different
      argument entirely: it is a DELEGATION boundary. Ordering authority over
      owner: ai tactic attention is delegated to /rsi-evaluate, and a flat scale
      is safe only while one authority sets every number. It does not discount
      any claim by provenance, it does not project at emit time, and it is
      derived on read like everything else. It is the same move hierarchical
      weight distribution makes when a subtree's shares are delegated.
      Consequence to carry: tactic-attention-tier-ranking, phase main-qa, states
      that 'the selector sorts by (tier, rank), blocking lifts the lexicographic
      (tier, rank) pair' — the exact surface this changes, since Precedence must
      become a 3-tuple for the band to reach the sort at all. It needs
      re-scoping when the resolver change lands; it is named here rather than
      edited, because it is in flight and a body edit would trip scope custody.
      Full algebra at kind-kind; ownership half at
      strategy-recursive-self-improvement; implementation at
      tactic-attention-namespaced-rank. Amended 2026-08-12: the consequence this
      entry carries forward is now settled in the other direction. Precedence
      does NOT become a 3-tuple: effectivePrecedence is deleted outright,
      because blocked_by moves inside the parent relation and a blocker
      therefore inherits the band of what it blocks as ordinary lineage. The
      band still reaches the sort — the selector sorts on the rank key directly.
      tactic-attention-tier-ranking still needs re-scoping when the resolver
      change lands, for the same reason stated here."
  - question: What is the single ranking algorithm, after the 2026-08-12 unification?
    answer: (Recorded 2026-08-12 /align interview, author-dictated. Supersedes in
      part clarifications 1, 4, 5, 9, 12 and 14 above, each of which carries its
      own dated amendment.) One algorithm, one relation, no orthogonal
      mechanisms. PARENT RELATION — a node's parents are the node named by its
      `parent` field, every node it `serves`, every delegation it `recovers`,
      and every node that lists it in `blocked_by` (that is, every node it
      blocks). The same relation drives every axis. TIER — own tier defaults to
      1, bug_fix/security marks resolve to 2, production issues to 3; resolved
      tier = max(own tier, parents' resolved tier), unchanged from the
      2026-07-18 model except for the widened relation. PER-TIER BOOSTS — each
      node carries an authored boost per tier, and in tier T's ranking every
      node contributes its tier-T boost. ATTENTION SCORE — score(n) = boost(n)
      plus the sum of the boosts of every DISTINCT node in n's lineage; each
      lineage node counts exactly once no matter how many paths reach it, and
      there is no decay and no per-path multiplicity. BAND — the maximum, over
      n's parents, of the parent's score, taken in n's resolved tier. RANK KEY —
      the lexicographic quadruple (resolved tier, band, score, depth),
      descending, where depth is the count of distinct lineage nodes. TERMINAL
      NODES — a node at phase `done` contributes nothing to any axis, so rank
      decays as work lands instead of waiting on a prune. There is no override,
      no branch cap, no separate blocking-precedence lift, and no signal term.
  - question: Why does 'a child always outranks its parent' come from depth rather
      than from a minimum boost of 1?
    answer: "(Recorded 2026-08-12, author-directed after the interview measured both
      variants against the live 597-node graph.) The model as brought to
      interview gave every node a minimum boost of 1, so a child's inherited sum
      plus its own floor always exceeded its parent's. That does guarantee the
      invariant, but it also makes the score a proxy for lineage SIZE rather
      than for attention: measured across the graph, the min-boost-1 score
      correlates r=0.965 with distinct-ancestor count and only r=0.146 with the
      node's own authored boost, and all 18 top-ranked selectable tactics
      resolved with an authored boost of 0 — a deep subtree under a cold
      strategy outranking shallow work under a hot one. So an unauthored boost
      contributes 0, and the invariant is carried instead by DEPTH as the final
      lexicographic term. Verified exhaustively on the same graph: zero
      violations of child-outranks-parent across all 846 parent edges, and the
      resulting top of queue returns to the rsi-plan and attention-surface work
      that actually carries authored claims (15 of the top 15 have a real
      authored claim in lineage, against 0 of 18 under min-boost-1). The
      simulation scripts were interview instruments, not deliverables, and were
      not retained; the figures recorded here are the record of what was
      measured."
  - question: Does a failing or unvalidated success_signal change any node's
      attention score?
    answer: "(Recorded 2026-08-12, author correction during interview — the
      interviewer had carried the signal in as a rank term and was corrected.)
      No. Signals are orthogonal to rank. An unvalidated strategy is a FAILING
      SIGNAL, and what surfaces is the signal itself, on
      strategy-attention-surface's status queue; the importance of a failing
      signal is read from the attention score of the node that owns it. The
      score does not move because the signal is failing. This retires the
      structural `signal` term in resolveAttention — SIGNAL_TERM_WEIGHT, the
      flat +1 for a node on the path to an unvalidated validates-terminal
      (packages/intentionsutil/src/attention.ts) — so attention has no signal
      input at all. Note for the implementing session, because the two uses are
      easy to conflate: computeSignalPath is ALSO consumed by the graph router's
      strategy-eligibility gate, which is a separate concern and is NOT retired
      by this entry. Only its contribution to rank is."
  - question: What replaces `override` once it is removed?
    answer: "(Recorded 2026-08-12, author-dictated.) Nothing, deliberately.
      `attention.override` pinned a node's value absolutely and discarded
      incoming authority, acting as a branch cap. It is removed as an
      unnecessary complication: if a node requires less attention than its
      lineage confers, the graph is wrong and the LINEAGE is corrected, not the
      number — a child cannot receive less attention than its parent. The cost
      of removal is empirically near zero: measured this round, exactly ONE node
      of 597 carries a non-null override
      (tactic-transition-node-stamp-landed-body, itself at phase done), so no
      live subtree depends on the cap. The consequence accepted alongside it is
      that re-weighting the owning strategy becomes the SOLE remedy when a hot
      subtree monopolizes the queue — which clarification 3 above already
      accepts by design. `serves` remains a ranking act (clarification 2); this
      round confirms rather than changes that, since a serves edge is simply a
      parent edge and ranks by tier and attention exactly like every other
      parent edge."
  - question: How do delegations and `recovers` participate in rank, given
      delegations are not in the goal layer?
    answer: "(Recorded 2026-08-12, author-directed, with one sub-decision left
      explicitly open.) `recovers` becomes a true parent edge: a delegation is a
      parent of every strategy that recovers it, and the delegation's score
      flows down as ordinary lineage. This requires delegations to become
      score-bearing, which they are not today — kind-delegation carries no
      `goal_layer: true`, so a delegation has no `attention` field at all and
      there is nothing for a recovering strategy to inherit. The delegation's
      score is DERIVED, not authored: computed from its divergence and
      irreversibility axes exactly as the current capture term computes them,
      which preserves the self-updating property — raising a delegation's
      divergence level re-ranks every recovering strategy with no authoring act.
      In short, the capture TERM becomes capture LINEAGE. OPEN, and owed before
      implementation: whether the derived score keeps a cap. Today the capture
      term is capped at min(1, sum) so that a strategy recovering several severe
      delegations cannot swamp authored intent; read as lineage, the natural
      form of this model is no cap, with severity instead calibrated onto the
      same integer scale as authored boosts. 19 recovers edges across 22
      delegations are in scope. Carried into
      tactic-attention-delegation-scoring."
  - question: What does making `blocked_by` a ranking edge cost, and why is it safe
      in 2026-08-12 when it was not in 2026-07-13?
    answer: "(Recorded 2026-08-12, author-dictated re-decision.) The 2026-07-13
      ruling was adopted because ADDITIVE backward flow let unrelated blocked_by
      compounding silently overtake intentionally top-ranked nodes. Per-node
      deduplication removes that mechanism outright: a lineage node contributes
      once no matter how many paths reach it, so nothing compounds. Measured
      this round on the live graph — the per-path form reaches a maximum score
      of 273 with path multiplicity up to 89, while the dedup form maxes at 122
      and produces no overtaking. The hazard that justified orthogonality is
      therefore retired rather than merely tolerated, and the gain is the
      deletion of an entire second mechanism (router.ts's recursive max-based
      effectivePrecedence lift). Three costs were surfaced; all are latent
      rather than live, each measured at zero occurrences today. (a) MIXED
      CYCLES become representable in the unified relation and nothing catches
      them: validateGraph rule 15 forbids only blocked_by cycles, and the
      realistic authoring mistake is `B.parent = A` together with `B.blocked_by
      = [A]` ('B is a sub-tactic of A, and B waits on A's other work') — two
      individually sensible edges that together cycle. Under dedup-union the
      fixpoint still CONVERGES rather than diverging, so child-outranks-parent
      collapses silently inside the cycle instead of erroring; 0 cycles today;
      carried into tactic-attention-unified-relation-cycle-rule. (b) TIER STOPS
      BEING A CLASSIFICATION: it stays correct for ordering, but once a tier-3
      incident has blockers, those blockers report tier 3, so any consumer
      COUNTING production issues over-counts and must read ownTier instead; 0
      nodes are lifted by a blocked_by edge today. (c) A `done` blocked node
      kept conferring lineage on its blocker until the edge was pruned, which is
      why terminal nodes are ruled non-distributing in the ranking-algorithm
      entry above."
  - question: What was the freeze blast radius when this node's substance changed on
      2026-08-12 (both rounds that day)?
    answer: "(Recorded 2026-08-12, discharging the materiality-scoped-freeze
      contract for this round.) This round changes this node's clarifications
      and therefore its strategyFingerprint. Measured with readNode plus
      isFingerprintStale and strategyFingerprint, never a grep. Ten children
      serve this strategy. Exactly ONE is open (non-draft, non-done) —
      tactic-attention-tier-ranking at phase main-qa — and it carries NO
      strategy_fingerprint entry for this strategy, so per-strategy null
      semantics apply and no freeze fires for it. Three children carry a stamp
      keyed to this strategy: tactic-first-sensor-pass (phase done, irrelevant)
      and tactic-owner-review-reading-pass-a and -pass-b (both phase-null
      drafts, reading-curriculum work orthogonal to rank algebra) — left stale,
      and born stale in the sense tactic-strategy-fingerprint-stamp-coverage
      tracks. Materially affected but not freezable:
      tactic-attention-tier-ranking's shipped behaviour (the selector sorts by
      the (tier, rank) pair; blocking lifts that pair) is superseded in part by
      this round's rank key and by the deletion of the precedence lift, but it
      is already merged at PR 2997 and sits past main-qa, so the supersession is
      follow-up work carried by tactic-attention-namespaced-rank, not a freeze.
      (Amended 2026-08-12, SECOND round that day -- the office-hours /align
      round that recorded the shape/value seam and cleared
      tactic-attention-namespaced-rank's park. Recorded as an amendment rather
      than a new entry because both rounds changed this node's substance on the
      same date, and two separately-dated-identical entries would be
      unreadable.) That round amended two clarifications and added one, so it
      moved this node's strategyFingerprint again: 29446049f0208a9b ->
      37db70dcaea46c61. Re-measured with readNode plus strategyFingerprint and
      isFingerprintStale, never a grep. The radius is UNCHANGED and still empty:
      14 children now serve or are parented to this strategy, exactly ONE is
      open (non-draft, non-done) -- still tactic-attention-tier-ranking at phase
      main-qa -- and it still carries NO strategy_fingerprint entry for this
      strategy, so per-strategy null semantics apply and no freeze fires. The
      same three children carry a stamp keyed here (tactic-first-sensor-pass at
      phase done, tactic-owner-review-reading-pass-a and -pass-b as phase-null
      drafts); none is open, so none is re-stamped and none is left materially
      frozen. No child needed a blocked_by carrier either. Nothing was
      re-stamped this round. Separately, no worktree-local .scope-fingerprint
      re-stamp was owed: the round edited the BODIES of
      tactic-attention-namespaced-rank and
      tactic-attention-per-tier-boost-migration, but both are phase-null drafts
      rather than in-flight tactics, so no scope-custody gate exists to trip."
  - question: What do per-tier boosts cost, given almost none are authored — how do
      tier 2 and tier 3 order in practice?
    answer: "(Recorded 2026-08-12, same /align round as the entries above, closing a
      measured finding the round's first commit left out of the record.) They
      degenerate to lineage connectivity until someone authors them. In tier T's
      ranking every node contributes its tier-T boost, so if no tier-2 boost has
      been authored anywhere, every contribution is the unauthored value and the
      score reduces to a count over the lineage — tier-2 ordering becomes 'how
      deep and how connected is this node', not 'how urgent is this bug'.
      Measured on the live graph: the whole tier-2 population is 5 nodes (4
      bug_fix marks, 1 security), tier 3 is 5 more, and with no tier-2 boosts
      authored their order is exactly their distinct-ancestor counts (9, 8, 8,
      4, 3). That is the wrong ordering for precisely the tier that most needs
      triage order, and nobody will preemptively author tier-2 boosts on
      strategies that have never had a bug under them. This is a cost of the
      per-tier model, accepted rather than solved: it is the same shape as the
      recorded rule that changing a node's tier does not carry its boost
      (clarification 12), and the remedy is the same — author a value in the
      target tier when work actually arrives there. What it does mean concretely
      is that the tier-lifted band rule, which is the reason per-tier boosts
      were adopted at all, delivers a meaningful band only once the parent has
      an authored boost in the lifted tier; until then a tier-lifted tactic
      bands against a lineage count. Recorded so a later session reading the
      per-tier adoption does not assume tier-2 ordering is already trustworthy.
      Carried into tactic-attention-per-tier-boost-migration, which owns the
      storage shape and the requirement that an unauthored tier stay
      distinguishable from an authored lowest value. (Amended 2026-08-12,
      office-hours /align round.) Two corrections, neither reopening the
      accepted cost. FIRST, the storage shape no longer sits here: it moves to
      tactic-attention-namespaced-rank (see the shape/value-seam clarification
      below); what tactic-attention-per-tier-boost-migration retains from this
      entry is the requirement that an unauthored tier stay distinguishable from
      an authored lowest value, now asserted as a constraint on that shape
      rather than as ownership of it. SECOND, the degeneracy measured here
      PREDATES this round's deletion of the signal term, so the interim is
      slightly worse than what was accepted: the tier-2 population loses its
      signal input too, leaving those nodes ordered by lineage connectivity and
      depth alone. The acceptance stands unchanged -- the population is 5 nodes
      and the remedy is still to author a value in the target tier when work
      actually arrives there -- but the record should not be read as having
      priced the signal-term deletion in. STEELMAN CONSIDERED AND DIVERGED FROM:
      making boosts tier-agnostic, with tier as a pure ordering axis, would give
      tier-2 nodes a real band today from their tier-1 lineage with no authoring
      act at all, which is strictly better than the degenerate interim. It is
      rejected because it contradicts clarification 12 (a tier change does not
      carry a node's boost) and because the improvement is temporary -- tier-2
      bands would REGRESS to 0 the moment per-tier landed without simultaneously
      authored values, converting an accepted standing cost into an unannounced
      future regression."
  - question: Is an authored boost a free magnitude or a level drawn from a fixed
      vocabulary?
    answer: "(Author-decided 2026-08-12, closing the per-band scope-stamp question
      kind-kind had left open.) A LEVEL, drawn from a closed vocabulary of
      ABSOLUTE values. A boost is not chosen relative to whatever currently
      shares the node's band; it names a fixed degree of claim, so the same
      value means the same thing in every band and every tier. This is what
      makes the ranking model safe against BAND COLLISION — two previously
      separate bands converging so that nodes calibrated against different
      neighbour sets suddenly compare directly. Under free magnitudes that
      collision silently miscalibrates the order; under a level vocabulary the
      values are commensurable by construction and the collision is harmless.
      Note what does NOT break, because the round nearly recorded a defect that
      does not exist: a plain rerank of a strategy invalidates nothing beneath
      it. Every descendant carries the reranked node in its lineage, so score
      and band shift by the identical amount and within-subtree order is exactly
      preserved; the subtree moves as a block relative to the rest of the graph,
      which is the intent of the rerank. The alternative considered and REJECTED
      was an authored per-band `attention.scope` stamp with a validateGraph
      analogue of rule 20 — rejected because it keys on the resolved band
      DISTRIBUTOR, so it fires on distributor-identity change (already an
      explicit authoring act) and is silent on collision, the case that actually
      goes unnoticed; it was also the only option requiring a stored field and a
      write-path gate. Evidence the vocabulary already exists in practice: 91
      authored values across the live graph but only 17 distinct, six values
      (20, 50, 12, 10, 3, 85) covering 88% and 20/50 alone covering 64%.
      Exposure that would have been policed: only 6 strategies carry a boost at
      all, median live-boosted descendants 0, max 35, with 35 of 39 total (90%)
      under strategy-graph-native-dispatch alone; strategy boosts changed in 9
      commits since 2026-05-01. PER-TIER BOOSTS ARE RETAINED — the level
      vocabulary governs WHICH VALUES are authorable, not how many boosts a node
      carries; per-tier structure serves coverage (a well-defined rank in a tier
      the node does not belong to), which is orthogonal. validateGraph rule 20
      retires: its justification is the calibration claim that a value is 'only
      meaningful within one tier's scale', which is false under a closed
      absolute vocabulary. tactic-attention-per-tier-boost-migration owns the
      level values and the migration. (Amended 2026-08-12, office-hours /align
      round.) RULE 20 HAS A SECOND, INDEPENDENT GROUND, and it is the one that
      fixes sequencing. Recorded here the retirement rests only on the
      calibration claim being false under an absolute vocabulary -- a ground
      that ties rule 20 to the vocabulary, and so to
      tactic-attention-per-tier-boost-migration. But rule 20
      (checkAttentionTierNamespace,
      packages/intentionsutil/src/schema.ts:1111-1121) requires attention.tier
      === ownTier(node), which mechanically REJECTS a tier-1 strategy authoring
      a tier-2 boost -- exactly the authoring act per-tier boosts were adopted
      to enable, as the per-tier-cost clarification above states in its own
      terms. Rule 20 therefore cannot outlive the storage shape whatever happens
      to the vocabulary, and its retirement moves with the shape to
      tactic-attention-namespaced-rank. This ground is recorded because the
      calibration ground alone invites a later session to re-sequence rule 20
      with the vocabulary and reintroduce the deadlock this round cleared.
      Ownership after this amendment: tactic-attention-per-tier-boost-migration
      keeps the level VALUES, the exported constant, and the write-path
      off-vocabulary check."
  - question: Which node lands the per-tier boost storage shape, and on what
      principle is implementation work split between a model change and its
      authored values?
    answer: "(Author-decided 2026-08-12, office-hours /align round that cleared
      tactic-attention-namespaced-rank's park.) THE SHAPE/VALUE SEAM. A change
      to the ranking model's data SHAPE lands with the algebra that consumes it;
      the authored VALUES that populate the shape, and any judgment about what
      those values should be, land separately. So
      tactic-attention-namespaced-rank lands the per-tier boost map and deletes
      validateGraph rule 20, and tactic-attention-per-tier-boost-migration lands
      the closed level vocabulary, the write-path check, the 0.01 ladder revert,
      and the remaining odd values. This resolves the circularity that parked
      the tactic: the shape was recorded as owned by a node whose blocked_by
      puts it AFTER the node that needs the shape. The seam is not a scheduling
      convenience -- it is forced on one side and free on the other. Forced:
      rule 20 rejects the authoring act per-tier boosts exist to enable, so the
      shape cannot ship without retiring it, and a resolver written against the
      scalar in the meantime is dead scaffolding rather than a working interim.
      Free: parseAttention already defaults an absent tier tag to 1, so the
      legacy scalar form reinterprets into a one-entry map with ZERO node-file
      edits, and measured on the live graph no tier-2/3 authored boost exists to
      migrate (all 92 attention-carrying nodes are tier-1 tagged; none of the 6
      nodes with ownTier > 1 carries attention). The principle generalizes and
      is why it is recorded here rather than only on the tactic: it is the same
      seam tactic-attention-namespaced-rank already uses for the sibling field,
      deleting attention.override from the schema and resolver while the
      migration node drops the single remaining override value. The alternative
      of absorbing the whole migration into the algebra PR was rejected for
      mixing a 91-node data migration and the level-value judgment into a
      pure-algebra change, and the alternative of narrowing the algebra node to
      today's flat scalar was rejected as the dead-scaffolding case above."
  - question: What is rank (the triage charter), and can virtues be ranked against
      one another (2026-08-31)?
    answer: "(Recorded 2026-08-31 /align doctrine-alignment round.) Ratified
      charter: rank is ATTENTION-ALLOCATION UNDER SCARCITY - one importance
      backbone derived on read from graph position (tier, band, boost, lineage),
      composed per-surface with surface-specific factors that never enter the
      backbone. The four attention surfaces: dispatch composes readiness and
      cost; alarms compose blast radius; author review composes expected review
      impact (importance times expected change - a settled important node has
      near-zero review value); context injection composes task relevance. Rank
      is thereby also an ALIGNMENT surface: what the model never sees cannot
      align it. OVERLOAD is defined as a per-surface factor leaking into the
      backbone (e.g. boosting a node to force a review would corrupt dispatch
      order too); that leak is forbidden. VIRTUES ARE INCOMMENSURABLE ROOTS and
      are never ranked against one another - differentiation begins at the
      strategy layer (author-set bands), and a node serving two virtues inherits
      attention from both without comparing them. Tradition references: medical
      triage (ranks urgency of attention under scarcity, emphatically never
      worth of persons - the inversion that makes triage ethically survivable);
      Aristotle, Nicomachean Ethics (the virtues unified in phronesis -
      deliberation ranks the actions available now, never the virtues they
      serve); Berlin, value pluralism (plural terminal values admit no common
      measure, so a total order over virtues would be a false report).
      Per-surface composition design delegated
      (tactic-rank-surface-composition); the current two-priority ordering
      enters the backbone as authored boosts on the strategy-graph-integrity
      lineage (tactic-priority-lineage-boosts). (decision: author-ratified,
      2026-08-31)"
tooling_goals:
  - kind: actuator
    statement: resolveAttention (outer tier from bug_fix/security/tier marks with
      downward max inheritance, additive source-set ranks within tier) consumed
      directly by the graph-native router selector
  - kind: sensor
    statement: frontier-view renders the resolved ranking
success_signal:
  observable: the fraction of open dispatch work traceable to a serving node, and
    readings populated by the loop rather than by hand
  sensor: the intention store itself
  threshold: every open tactic carries a non-empty serves edge and sensor-run
    readings exist for every strategy that names a sensor
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - the dispatch chain remains the execution path for tactical work
      (strategy-autonomous-execution holds)
    - The unified parent relation stays acyclic. Under per-node deduplication
      the fixpoint converges rather than diverging on a cycle, so a cycle
      degrades ordering silently instead of erroring; validateGraph must reject
      cycles over the whole relation, not only over blocked_by.
    - Consumers that COUNT nodes by tier (reporting, queue summaries, incident
      counts) read ownTier, not resolved tier. Resolved tier is an ordering axis
      only, since it now propagates along blocked_by.
---
# Close the loop — intent enters execution from the graph, and execution reports back as readings

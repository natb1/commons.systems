---
id: kind-kind
kind: kind
statement: A kind defines the semantics of a class of nodes
owner: human
status: codified
parent: null
rationale: >-
  Every file in this directory is one node: YAML frontmatter plus a markdown
  body whose function each kind declares (see the body-function clarification).
  A node's `kind` names the kind node (`kind-<kind>`) that defines its semantics
  — which `attributes` it carries, which edges it may have, and how progress
  works for it. This node describes itself (`kind: kind`); the regress is
  finite.


  The graph is self-describing: read this node, then the kind nodes, then
  everything else. The set of valid kinds is the set of committed kind nodes,
  not an enum in code — `validateGraph` (packages/intentionsutil) enforces that
  every referenced kind node exists and that every `parent` and `serves` edge
  resolves.


  Layering, root to leaf: VIRTUES at the roots — dispositions, never complete,
  several roots form a forest (kind-virtue). STRATEGIES below them — the highest
  goals a virtue generates against present conditions; the one phase change in
  the graph (disposition to state) happens at this edge (kind-strategy). TACTICS
  at the bottom — transient, completable units of execution that may form
  subtrees rooted at an epic (kind-tactic). DELEGATIONS are not goals: they are
  attachment records, the surface where capture is detected and recovery kept
  real (kind-delegation). Lifecycle differs by layer: virtues are unconditional
  (exceptionless in application, amendable only by deliberate dialectic —
  kind-virtue), strategies are persistent (they end only by condition-expiry or
  deliberate retirement), tactics are transient (removed from the graph on
  completion).


  Five edge fields carry the graph. `parent` is the within-layer edge:
  constitutive between virtues, means-end between goals. `serves` is the
  cross-layer edge: a strategy serves the virtues it expresses; a tactic serves
  the strategies it advances; a delegation serves the nodes that depend on it.
  `recovers` points a strategy at the delegation records its work unwinds
  (kind-strategy). `blocked_by` gates tactic ordering — no tactic in a blocked
  subtree begins until the blocking tactics complete — and `validates` marks the
  tactics that validate a strategy's signal; both are tactic-layer edges
  resolved by validateGraph like the rest.
reading: null
serves: []
recovers: []
clarifications:
  - question: What is the markdown body below the frontmatter?
    answer: "The kind-defined prose surface: each kind node declares its body's
      function — kind → normative schema detail; tactic → the execution plan;
      strategy → settled design and mechanism notes; virtue → the extended
      articulation of the disposition; tradition → reading notes; delegation →
      the audit narrative. The body is authoritative for its declared function
      and never a shadow copy of frontmatter. Supersedes the 'cosmetic render of
      statement' doctrine, which was already false for tactics — their bodies
      carry the clean-session plans dispatch executes. Recorded 2026-07-09
      interview (strategy-graph-self-description)."
  - question: How does an authored boost compose across the parent/serves chain — as
      a flat global sum, or namespaced by the distributor?
    answer: "(Recorded 2026-08-11.) Namespaced, and asymmetrically by kind — the
      accumulated (source-node, amount) set described in this node's body under
      'Derived values are never stored' is what the order reads FROM, not itself
      the order. A tactic's own authored boost orders it only within the band of
      the strategy distributing to it, at its tier: it can never carry the
      tactic past a tactic of a higher-ranked strategy in the same tier, and a
      tactic with several distributors sits in the band of the highest-ranked
      one (max across distributors, never the sum) — the same max rule the
      effective-tier fixpoint already applies. A strategy's authored boost is
      the complementary case: additive and unscoped, summing with its parent's
      down parent/serves, so a child strategy may be boosted in conjunction with
      its parent to outrank cousin and uncle strategies. Tier dominates both
      lexicographically. (Corrected 2026-08-11, third round: the clause here
      previously called tier the ONLY cross-strategy escape. It is not — see the
      escape-set clarification below.) The derived-state doctrine is unchanged:
      rank stays computed on read and is never stored — this clarifies the ORDER
      the accumulated claims express, not where they live. As implemented,
      resolveAttention sums a tactic's own boost with its strategy-distributed
      value (packages/intentionsutil/src/attention.ts), so the namespacing is
      not yet mechanically enforced; the greenfield target is lexicographic
      ordering by (tier, distributing-strategy rank, within-strategy value),
      with a behavioral-doctrine-plus-lint migration first. Tracked at
      tactic-attention-namespaced-rank; the ownership half of the doctrine (who
      may write which attention) lives on strategy-recursive-self-improvement.
      Amended 2026-08-12: the composition question is settled, and the ASYMMETRY
      BY KIND is retired. There is one relation and one rule for every kind: a
      node's score is its own per-tier boost plus the sum of the boosts of every
      distinct node in its lineage, each counted once. Strategies are banded on
      the same terms as tactics (a strategy's band is the maximum score among
      its own parents), so 'strategies live on a single flat additive scale' no
      longer holds. The namespacing BOUND this entry records is preserved — a
      tactic still cannot outrank a tactic of a higher-ranked strategy — but it
      is now delivered by the band component of a uniform key rather than by a
      kind-specific rule."
  - question: What exactly are the three components of the rank key, and how is each
      derived?
    answer: "(Recorded 2026-08-11, third round, after adversarial review found the
      second-round statement of this key underspecified in all three
      components.) The key is the lexicographic triple (tier, band, residual),
      descending. TIER — unchanged, the existing max-lifted effective tier. BAND
      — the resolved rank of the strategy the node sits under, derived by the
      SAME downward monotone fixpoint the effective tier already uses
      (attention.ts, the effectiveTier loop): band(n) = max(ownBand(n), max over
      distributors d of band(d)), where ownBand is a strategy's own resolved
      rank and 0 for every other kind. Deriving it as a fixpoint rather than as
      a direct max over the node's own distributor set is what makes it total:
      an epic child whose only distributor is another tactic inherits its
      subtree root's band instead of falling to 0; a node with no distributor at
      all gets an honest 0; and because the band is computed OUTSIDE the
      tier-isolation filter, it survives a tier lift, so the namespacing bound
      stays live at tier 2 and tier 3 — where every bug fix and every red-main
      item lives — instead of going inert exactly where it matters most. That
      also answers, in the affirmative, the tier-isolation question absorbed
      into tactic-attention-namespaced-rank: a lower-tier strategy does define
      the band for a tier-lifted tactic. RESIDUAL — the node's value MINUS its
      band, i.e. its own authored boost plus the signal term plus the capture
      term. This is deliberately not 'the node's own boost': defining the third
      component as own-boost-only would drop the signal term (on-path to an
      unvalidated success_signal) and the capture term (recovers severity) out
      of ordering entirely, silently demoting two of the three registered terms;
      and leaving it as the bare value would double-count the distributing
      strategy's rank, once as the band and once inside value, so that order
      within a band would still track strategy rank rather than the node's own
      claim. Taking the residual keeps every registered term live, keeps
      resolveAttention's composition untouched (the band is a subtraction, not a
      rewrite), and preserves the shape the 2026-07-18 tier amendment already
      established for tiers: terms-and-weights govern ordering WITHIN a band.
      (Amended 2026-08-12, office-hours round that cleared
      tactic-attention-namespaced-rank's park.) The RESIDUAL derivation stated
      above is corrected. 'The node's value MINUS its band' does not equal the
      gloss that follows it -- 'its own authored boost plus the signal term plus
      the capture term' -- and the gloss is the intended meaning.
      resolveAttention distributes ancestors' AUTHORED claims only
      (packages/intentionsutil/src/attention.ts, the authored fixpoint at lines
      417-437), while the signal and capture terms are computed per node and
      never flow downward (lines 553-556). So subtracting a band equal to the
      distributing strategy's RESOLVED rank subtracts that strategy's own signal
      and capture weight as well, driving the residual negative by up to that
      amount -- the worked case recorded on strategy-recursive-self-improvement,
      where strategy-rsi-plan-surface's tactics sit in band 9 carrying an
      authored 8 for a residual of MINUS 1 -- and letting the distributing
      strategy's own terms reorder tactics WITHIN a band, the exact artifact the
      residual exists to remove. Corrected: BAND is unchanged, a strategy's own
      RESOLVED rank exactly as stated above. RESIDUAL is the node's value minus
      the authored contribution INHERITED from its distributors, which is
      precisely the gloss above -- its own authored boost plus its own signal
      term plus its own capture term. So defined, the residual is never
      negative, keeps all three registered terms live in ordering, and leaks
      nothing from the band into within-band order. This also preserves the
      flat-additive-strategy-scale property that
      tactic-attention-namespaced-rank's greenfield target asserts (strategies
      live on a single flat additive scale, unchanged from today): a strategy's
      own band is its resolved rank, so strategy-versus-strategy order remains
      exactly today's value order, with the residual acting only as a tiebreak.
      Deriving the band from the authored term instead would have made a
      strategy's own key the lexicographic pair (authored, signal+capture) and
      reordered strategies against each other, which that property forbids -- a
      cost the park reason did not surface. This closes, in favour of the
      resolved value, the ownBand question strategy-recursive-self-improvement
      records as an open decision recorded on tactic-attention-namespaced-rank.
      Author-directed: the author accepted this resolution on trust in the same
      round rather than deriving it, so it is enrolled for re-validation as a
      born-parked office-hours review sitting
      (tactic-review-band-derivation-ratification). Amended 2026-08-12 (/align
      round on strategy-graph-drives-dispatch; the unified ranking model). The
      key is no longer a triple and RESIDUAL IS RETIRED as a distinct component.
      The key is the lexicographic QUADRUPLE (resolved tier, band, score,
      depth), descending. TIER and BAND are unchanged in derivation. SCORE
      replaces residual, and the residual correction recorded above becomes MOOT
      rather than merely superseded — under the unified model every term flows
      down the parent relation (the signal term is retired outright, and capture
      becomes lineage via `recovers`), so a node's lineage necessarily contains
      its band-defining parent and everything above it. Therefore band <= score
      always, the residual can never go negative, and since every node sharing a
      band has that same band value inside its score, subtracting it is
      subtracting a constant: ordering by score within a band is IDENTICAL to
      ordering by residual. The residual existed to stop the band leaking into
      within-band order; making every term flow down removes the leak at its
      source, so the subtraction is no longer needed. DEPTH — the count of
      distinct lineage nodes — is the new final component, and it is what
      guarantees a child always outranks its parent. Consequence for the
      terms-and-weights doctrine: with the signal term retired and capture
      converted to lineage, the term registry is emptied and attention has
      exactly ONE input, the authored per-tier boost. A new attention condition
      must therefore become a tier, a lineage edge, or an authored boost — 'add
      it as a term with a weight' is no longer an available move."
  - question: Is the band derived, or authored and checked?
    answer: "(Author-directed 2026-08-11, third round.) Both, and the second is the
      point. The band is derived as above, but the VALUE chosen inside a band
      also carries an authored namespace stamp, generalizing a mechanism the
      schema already has one axis over: Attention.tier is documented as 'the
      per-tier boost NAMESPACE tag — the tier whose scale the value was chosen
      in', and validateGraph rule 20 requires it to equal the node's own tier,
      precisely so an author must re-select a boost when a node's tier changes,
      since a value meaningful on the tier-1 scale means nothing on the tier-2
      scale. A boost has exactly the same problem across bands: authored under a
      band-3 strategy, it means something different after that strategy is
      reranked to band 9, and today nothing stamps or catches it. Greenfield:
      extend Attention to {boost | override, rationale, scope: {tier,
      strategy}}, where scope.strategy names the distributing strategy in whose
      band the value was chosen, with the rule-20 analogue requiring it to match
      the node's resolved band distributor. Three payoffs: the namespace becomes
      authored and CHECKABLE rather than derived and implicit; the migration
      lint collapses from a global re-derivation diff to a field comparison,
      which is what validateGraph can actually do on the write path; and
      reranking a strategy mechanically surfaces every boost whose meaning it
      just invalidated, instead of silently reinterpreting them. Note the
      interaction to settle when this lands: validateGraph rule 18 (the
      strategy-main-health boost-dominance guard) has a tactic-facing half that
      becomes dead under namespaced rank — the implementing tactic must record
      whether it retires. Amended 2026-08-12: split, and only half is resolved.
      The per-TIER half is adopted and is now structural — a node carries an
      authored boost per tier, and in tier T's ranking every node contributes
      its tier-T boost, which is what makes a node's rank well-defined in a tier
      it does not itself belong to (see strategy-graph-drives-dispatch,
      2026-08-12). The per-BAND scope stamp this entry proposes remains OPEN and
      is not resolved by that round: a boost authored while its node sat in one
      band still means something different after the band-defining parent is
      reranked, and nothing yet stamps or catches that. Recorded explicitly so
      the per-tier adoption is not misread as having closed the per-band
      question. CLOSED 2026-08-12 (author-decided): the per-band scope stamp is
      REJECTED and the question it addresses is DISSOLVED rather than policed.
      An authored boost is drawn from a CLOSED VOCABULARY OF ABSOLUTE LEVELS,
      not chosen as a free magnitude against whatever else currently shares a
      band, so a value means the same thing everywhere and is commensurable
      across bands and tiers by construction. Two findings drove it. First, the
      proposed mechanism is aimed off-target: it keys on the node's resolved
      BAND DISTRIBUTOR, so it fires on distributor-identity change (a
      re-parenting, or a multi-parent node whose max-scoring parent flips) —
      cases that are already explicit authoring acts — and stays SILENT on the
      case that actually goes unnoticed, two previously separate bands COLLIDING
      so nodes calibrated against different neighbour sets suddenly compare
      directly. A pure rerank invalidates nothing: every descendant has the
      reranked node in its lineage, so score and band shift by the same amount
      and within-subtree order is preserved exactly. Second, the live graph is
      already using an informal levels scale — 91 authored values but only 17
      distinct, with six values (20, 50, 12, 10, 3, 85) covering 88% and 20/50
      alone covering 64% — so codifying levels formalizes existing practice
      rather than imposing a new discipline. PER-TIER BOOSTS ARE RETAINED
      (author-directed): a node still carries a boost per tier, each drawn from
      the level vocabulary. The per-tier structure exists for COVERAGE — making
      a node's rank well-defined in a tier it does not itself belong to — which
      the absolute scale does not supply and does not replace. What the absolute
      scale removes is the CALIBRATION rationale, and with it validateGraph rule
      20, whose stated justification is that 'a boost value is only meaningful
      within one tier's scale'; that premise is false under a closed level
      vocabulary, and the rule's single-scalar attention.tier shape is obsoleted
      by the per-tier map independently. Migration and the level values are
      owned by tactic-attention-per-tier-boost-migration."
  - question: Which order-changing mechanisms sit outside the rank key, and how do
      they compose with it?
    answer: "(Recorded 2026-08-11, third round.) Two, and the second-round record
      wrongly named tier as the sole one. First, CLASSIFICATION acts: adding a
      recognized bug_fix/security mark lifts tier, and adding a serves edge to a
      higher-ranked strategy lifts band — both are sanctioned model instruments,
      and the ownership doctrine for them lives on
      strategy-recursive-self-improvement. Second, the blocked_by PRECEDENCE
      LIFT, which is already implemented and already recorded doctrine on
      strategy-graph-drives-dispatch: router.ts's effectivePrecedence lifts each
      node to the lexicographic max over its own pair and the precedence of
      every node it blocks, recursively and max-based rather than additive, and
      selectGraphTargets sorts on that LIFTED pair, not on the pair the node
      reports. This matters mechanically, not just descriptively: Precedence is
      a 2-tuple {tier, rank} today, so unless it is extended to the 3-tuple
      (tier, band, residual) with maxPrecedence comparing lexicographically over
      all three, the band never reaches the sort and the whole namespacing
      change is INERT on the selection path. Under the 3-tuple a blocker
      inherits the band of what it blocks, which is the correct reading — the
      blocked work's urgency is exactly what the lift models — and it preserves
      the never-additive, always-max property the 2026-07-13 supersession was
      built on. Amended 2026-08-12: reduced to ONE mechanism. The blocked_by
      PRECEDENCE LIFT described here is deleted, because blocked_by moves inside
      the parent relation — a blocker is a child of what it blocks and therefore
      inherits its tier, its band and its lineage directly, by the ordinary rank
      key. The mechanical concern this entry raises (Precedence must widen to a
      3-tuple or the band never reaches the sort) is resolved by deletion rather
      than by widening: there is no separate Precedence tuple left to keep in
      sync. CLASSIFICATION acts remain outside the key exactly as recorded."
  - question: What is the standard reconciliation vocabulary for the kind layer?
    answer: "(Claude-drafted 2026-09-01 under the author's record-at-kind-layer
      instruction; deferred-stamped for author review; per
      strategy-graph-review-curriculum's 2026-08-30 record-time-enrollment
      amendment the review queue derives from this deferred stamp itself - no
      review-item node is minted, and the one minted in error on 2026-09-01 was
      pruned the same day.) TARGET STATE - what the author intends to be true;
      intent-layer fields plus registered checks. OPERATIONAL STATE - what is
      observed to be true (repo at origin/main, PR state, evidence); observed
      and appended, never authored. DISPOSITION - the atomic unit of intent
      carrying authority state (ratified/delegated/deferred); unchanged.
      CRITERION - one acceptance condition within a strategy's target state; the
      unit of author sanction; prose, plus a bound check when expressible. CHECK
      - a machine-verifiable encoding of a criterion; tier observe or gating;
      promoted by ratchet. SIGNAL - any machine-readable indicator derived from
      operational state that bears on selection (check results, sensors, CI
      verdicts); the legacy success_signal is a compound criterion to migrate.
      FRONTIER - the derived set of unsatisfied criteria; the backlog (absorbs
      the derived gap). CLAIM - an exclusive, time-bounded reservation of a
      frontier bite; one record file per claim; the irreversibility guard. BITE
      - the session-sized frontier subset carved at claim time. PROJECTION - any
      artifact derived from (target, operational) state: plans, migration paths,
      materialized context, sequence indexes; always pinned, never
      hand-maintained. PIN - a projection's cache key (input shas, hashes,
      fingerprints); mismatch means regenerate. EVIDENCE - an appended observed
      fact with proof (sha, PR number, stamp, date); never edited; folded.
      FOLDING - compaction of an append-only log into a current-state summary;
      git history is the archive. ASSESSMENT - a memoized prose evaluation
      {subject, verdict, basis pin, date}, expiring on pin mismatch; generalizes
      the reading freshness gate. RATCHET - one-way promotion: observe to gating
      on high-water mark for checks; observe to enforce after drain for
      migrations. RECONCILER - the mechanical actor that folds observed state
      into evidence and derives position; level-triggered. TICK - one
      reconciliation cycle: select, claim, project, execute, append, fold. WORK
      RECORD - claim-window state (branch, PR, attempts, fix interrupt); minted,
      never edited; dies at merge. LEGACY MAP: gap -> frontier; success_signal
      -> criteria; phase -> derived position (the stored field is a cache during
      migration); standing tactic -> claim + bite (incumbent nodes remain scope
      carriers until the viability test completes); reading -> assessment.
      (decision: deferred - Claude-drafted, held for author review) KNOWN
      COLLISION (flagged by the 2026-09-01 adversarial review; owed
      disambiguation at the deferred review): FRONTIER here is the
      reconciliation-backlog sense; it does not cover the FULL-solution-frontier
      sense in strategy-explicit-intent's greenfield definition, nor the
      curriculum-frontier sense on strategy-graph-review-curriculum. (REFINED
      2026-09-01, author-ruled: FRONTIER also includes STALE-INTENT items -
      dispositions whose recorded basis rests on since-amended text, derived via
      basis pins - and liquidation-overdue shims. SHIM - an incumbent-form
      artifact or contract minted or retained post-ratification, declaring its
      target element and liquidation condition; outliving the condition is a
      frontier item.) (Interim note, 2026-09-01: no stamp-derived queue deriver
      exists yet; the declared deferred-queue shim on
      strategy-graph-native-dispatch documents grep -rn \"decision: deferred\"
      intentions/ as the interim office-hours surface until the deriver lands.)
      (REFINED 2026-09-01, ratified in interview: (1) FRONTIER disambiguation,
      resolving the collision flagged above — three senses are qualified on
      every ambiguous use: the RECONCILIATION FRONTIER (this vocabulary's
      backlog sense, the default in dispatch doctrine), the SOLUTION FRONTIER
      (strategy-explicit-intent's full-solution-frontier greenfield sense), and
      the CURRICULUM FRONTIER (the review-curriculum sense). (2) OPERATIONAL
      STATE carries no intent authority: per the authority-primacy ordering on
      strategy-explicit-intent, ratified > deferred/delegated > operational; a
      disposition-vs-operational-text conflict is a stale-projection frontier
      item, never two authorities. (3) CRITERION gains a class axis: FUNCTIONAL
      (strategy-specific, explicitly bitten) vs NON-FUNCTIONAL (standing
      cross-cutting, sanctioned once, implicitly bitten by every claim; the
      per-strategy effective set is a projection derived on read, never a stored
      copy). (4) ASSESSMENT pins are scoped and content-addressed: an assessment
      pins the content hashes of the inputs it actually read, so unrelated
      changes do not expire it.) (REFINED 2026-09-01, second sitting, ratified:
      (5) CRITERIA ARE DISPOSITIONS — the class axis composes with the authority
      algebra; sanction IS ratification; a Claude-transcribed or finding-derived
      criterion enters DEFERRED until ratified (no separate proposed state
      exists), and checks bound to a non-ratified criterion stay observe-tier
      regardless of high-water mark. (6) Ratified texts citing this vocabulary
      pin to its current sense; the deferred base review of this vocabulary
      re-verifies those texts on any amendment.)"
  - question: Carrier parsimony review — which intent-side carriers survive a
      parsimony test, and which collapse (2026-09-01)?
    answer: "(Claude-drafted 2026-09-01 as duty 1 of the layer-boundary
      delegation carried by tactic-intent-orchestration-layer-schema; held for
      author review.) Every ruling below is a PROPOSAL and none is executed
      here — no field is added, removed, renamed or reclassified by this entry.
      The test applied throughout: a role distinction earns its keep only where
      a consumer reads it mechanically. OWNER — RETIRE. The 2026-08-31
      author-ratified ruling on strategy-explicit-intent already recognizes no
      function for the node-level owner schema: ownership categories live on
      dispositions, and node-level owner: ai is retained only as a brownfield
      carrier. Parsimony agrees. The only mechanical readers are
      confirmPushDowns (packages/intentionsutil/src/sensors.ts:369, which
      filters owner procedure/ai jointly with status delegated/codified) and the
      goals render (packages/intentionsutil/src/goals.ts:139,
      realizationForOwner); both are derivable from a disposition-side ownership
      stamp. Retirement is a MIGRATION, not a deletion: validateNode requires
      owner in its strictly-validated core
      (packages/intentionsutil/src/schema.ts:1189, requireOneOf against OWNERS),
      so every node file in the store fails validation the moment the field goes
      away — the four-step contract (record target, read-tolerance window,
      drain, ratchet) governs. STATUS — does NOT cleanly follow owner; SPLIT it.
      The provenance half does follow: the same 2026-08-31 ruling names status:
      delegated a brownfield carrier alongside owner: ai, and for tactics the
      draft/codified distinction duplicates phase-absence. But status is
      load-bearing today in a way owner is not, and rule 16 is the least of it.
      checkStatusVocabulary (schema.ts:1413-1428, dispatched at schema.ts:2058)
      does read status mechanically against each kind node's
      attributes.status_vocabulary, which is exactly the earns-its-keep test —
      but that consumer is self-referential: it validates the field's own
      vocabulary and nothing else, so it is removable WITH the field and is not
      by itself a reason to keep it. The load-bearing consumers are the other
      five: isSuperseded (schema.ts:50) keys the whole supersession lifecycle on
      the superseded value; rungs.ts:36 selects root virtues on codified;
      sensors.ts:321 gates derived-gap reporting on codified; coverage.ts:52
      maps delegated to coverage class A; goals.ts:77 excludes codified nodes.
      Recommendation: status is not removable as a unit. Retire the
      ownership/provenance VALUES with owner, and re-express superseded as
      derived from superseded_by (already stored, already the authority under
      rules 25-26) rather than as a status value; what survives is a per-kind
      lifecycle enum read only by rule 16 and the codified filters, which is a
      candidate for a SECOND parsimony pass rather than this one. RATIONALE —
      KEEP; do not collapse into serves. The two carriers answer different
      questions: serves is a typed edge naming which nodes this node expresses,
      rationale is prose saying why the node exists, including the
      countervailing reasoning an edge cannot carry. Two mechanical facts make
      it the strongest carrier in this list. It is scanned for prose refs — the
      dangling-prose-ref check reads statement, rationale, attention.rationale
      and every clarifications[].answer (schema.ts:2151-2153) — and it is the
      field the durable-write fence was corrected to protect: the 2026-08-15
      correction from a permissive to a negative check was made precisely
      because the measured permissive fallthrough included rationale
      (schema.ts:713-731, isDurableWriteRefused). Recommendation: rationale
      stays, classified intent. CLARIFICATIONS — KEEP the carrier, consolidate
      the CONTENTS, and the mechanism is not this node's to design. The author
      flags this field as prime for consolidation. What consolidation means for
      the carrier is a choice between the incumbent form (an append-only list of
      dated Q&A pairs where a later entry amends an earlier one in prose and
      both survive) and a folded restatement (one current-state text, with git
      history as the archive). The trade is real in both directions: the
      append-only form is what keeps concurrent writers safe and what preserves
      the superseded stamp the disposition algebra depends on, while the folded
      form is what keeps the record readable — this node's own reconciliation
      vocabulary is now a single answer carrying six dated refinements.
      Recommendation: retain clarifications as the intent-class carrier and
      treat folding as the FOLDING operation the reconciliation vocabulary
      already names, whose mechanism belongs to tactic-consolidation-operation.
      Do not design the fold here. READING and ROUNDS — RELOCATE; the
      classification is already done. Unit 1 classified both orchestration in
      attributes.field_write_class on this node, and the prose tables in the
      body carry the same, so nothing about the CLASSIFICATION is open. What is
      open is only the carrier's HOME: both are observed state stored as
      intent-side node fields, and under the create-only operational-carrier
      doctrine recorded in this node's body they belong outside the node file as
      records rather than fields — reading maps to ASSESSMENT in the
      reconciliation vocabulary above, rounds is claim-window accounting and
      maps to WORK RECORD. Recommendation: relocate both to operational-layer
      records; the relocation is a migration with its own frontier entry, not a
      reclassification. THE SHIMS — attributes.write_class_shims records TWO,
      not the three an earlier draft projected: attention was resolved to intent
      (no orchestration writer assigns it) and its STATE_FIELDS membership was
      recorded as a migration frontier item rather than a shim. (1) status —
      machine-stamped by the transition writers and a member of STATE_FIELDS
      (schema.ts:676-685), yet its draft/codified role is provenance on a
      disposition, an intent-side fact. The ruling the author must make to
      liquidate it is the status ruling above: retire the ownership values,
      derive supersession from superseded_by, then rule whether the residual
      lifecycle enum is intent-class or goes with them. (2) blocked_by —
      mechanically minted by the hold path and simultaneously the carrier of
      authored sequencing edges (this bootstrap's critical path is encoded as
      blocked_by edges on the carrier tactics). The ruling the author must make
      is whether authored sequencing moves to a distinct intent-class carrier,
      leaving blocked_by purely orchestration; only that split liquidates the
      shim, because no single class is honest about a field two classes
      genuinely write. Until each ruling lands the shim declaration is the
      correct record — forcing either field into one class would break a live
      writer or make the fence fail open, which is the failure mode already
      corrected once here. VOCABULARY RECONCILIATION — one mapping, no third
      pair. The deferred reconciliation vocabulary recorded above on this node
      names TARGET STATE and OPERATIONAL STATE for the same distinction the
      ratified layer-boundary disposition calls intent and orchestration. The
      mapping is exact: intent = target state, orchestration = operational
      state. Recommendation: intent/orchestration stays the CODE vocabulary (the
      identifier is write_class), because that pair is ratified
      (strategy-explicit-intent, 2026-08-31) while the target/operational pair
      is deferred, and the authority-primacy ordering recorded above is ratified
      > deferred/delegated > operational. Should the deferred vocabulary itself
      be ratified, the rename is a mechanical follow-on rather than a fresh
      decision. No third pair is minted, and the word layer is not reused for
      it — layer already means attributes.goal_layer, kind-typed field
      placement, and graph-commit's Layer 1/2/3 conflict-resolution stages.
      (decision: deferred — Claude-drafted, held for author review)"
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes:
  fields_defined_for_all_nodes:
    - "id: unique node identifier; also the filename"
    - "kind: names the kind-<kind> node defining this node's semantics"
    - "statement: the intention itself, one sentence"
    - "owner: human | ai | procedure — who is accountable"
    - "status: lifecycle/provenance stage — a non-empty string whose vocabulary
      and meanings each kind node declares in attributes.status_vocabulary;
      validateGraph rule 16 enforces membership"
    - "parent: within-layer edge; null for a root"
    - "serves: cross-layer edge — ids of the nodes this node expresses"
    - "recovers: strategy-only edge — ids of the delegation records this node's
      work unwinds (semantics on kind-strategy)"
    - "rationale: why this node exists"
    - "reading: the current measured value of the success_signal observable;
      sensor-populated"
    - "gap: the shortfall between reading and threshold — mechanically derived
      by deriveGap (greenfield: derived on read and never stored —
      tactic-gap-derive-on-read)"
    - "clarifications: dated Q&A pairs resolved during the dialectic"
    - "tooling_goals: actuator/sensor tooling the node aims to produce"
    - "success_signal: observable, sensor, threshold, is_proxy — the measurable
      sign the intention is met"
    - "attention: authored boost XOR override, plus required rationale; valid
      only on nodes whose kind sets goal_layer: true; resolved rank is derived
      on read and never stored"
    - "phase: tactic-only — persisted dispatch phase the router transitions
      (semantics on kind-tactic)"
    - "execution: tactic-only — dispatch execution state (branch, pr, attempts,
      markers, strategy_fingerprint, fix, completion; semantics on kind-tactic)"
    - "validates: tactic-only edge — the strategies whose signal this tactic
      validates (semantics on kind-tactic)"
    - "blocked_by: tactic-only edge — tactics that must complete first
      (cycle-checked; semantics on kind-tactic)"
    - "office_hours: goal-layer park — reason, since, recommendation; the router
      skips parked subtrees"
    - "pace_exempt: goal-layer — admits one gate-exempt worker past a
      paced-to-zero budget; never changes ordering"
    - "rounds: strategy-only — /align-tactics round accounting (count,
      last_completed, last_aligned; semantics on kind-strategy)"
    - "attributes: kind-specific fields, defined by the kind node — the kind
      nodes own the which-kinds-carry-which-fields statement"
  fields:
    - "criteria: the node's own criteria — each {id, statement, class,
      authority, recorded}, where class is functional (does this do what it is
      meant to do), non-functional (is it done the way work here must be done),
      or assumption (a world-premise the node rests on — evaluated by
      assessment, never bitten as a work item; the class attributes.conditions
      entries migrate into), authority is ratified, delegated or deferred (a
      Claude-transcribed
      criterion enters deferred until the author ratifies it), and recorded is
      the YYYY-MM-DD the text was written down. Valid on any goal-layer node
      (attributes.goal_layer: true); the non-functional criteria in force for
      every strategy live once on kind-strategy under
      attributes.standing_criteria and are unioned in on read by
      effectiveCriteria, never copied onto a node. Shape enforced by
      validateGraph rule 28"
  field_write_class:
    id: intent
    kind: intent
    statement: intent
    owner: intent
    status: shared
    parent: intent
    serves: intent
    recovers: intent
    rationale: intent
    reading: orchestration
    clarifications: intent
    tooling_goals: intent
    success_signal: intent
    attention: intent
    phase: orchestration
    execution: orchestration
    validates: intent
    blocked_by: shared
    superseded_by: intent
    supersession_expiry: intent
    office_hours: orchestration
    pace_exempt: orchestration
    rounds: orchestration
    attributes.criteria: intent
  write_class_shims:
    - field: status
      reason: machine-stamped by the transition writers today and a member of
        STATE_FIELDS, yet its draft/codified role is provenance on a
        disposition — an intent-side fact
      liquidation: the author's ruling on the status-retirement proposal
        recorded as a deferred clarification on this node
    - field: blocked_by
      reason: mechanically minted by the hold path, and simultaneously the
        carrier of authored sequencing edges (the bootstrap critical path is
        encoded as blocked_by edges on the carrier tactics)
      liquidation: the author's ruling on whether authored sequencing moves to
        a distinct intent-class carrier
  entry_point: this node is the entry point of the graph
  status_vocabulary:
    codified: the author has personally settled this kind's semantics
    superseded: the intent moved to another node — abandoned, not completed;
      superseded_by names the successor
---
# A kind defines the semantics of a class of nodes

This body is the normative schema detail for every node in the graph, per this
kind node's own body-function rule. It is the single authority: the kind nodes
define field and lifecycle semantics, and no other document does. Code
(`packages/intentionsutil/src/schema.ts`) is the enforcement of what is written
here; where prose and code disagree, the code is the bug report and this body is
what must be reconciled. Kind-scoped fields are named here and defined on the
kind node that owns them — the tactic-only dispatch fields on kind-tactic, the
strategy-only fields on kind-strategy.

## File format

Each node is one markdown file, `intentions/<id>.md`, with a YAML frontmatter
block followed by a markdown body:

```md
---
id: align-root
kind: strategy
statement: Unify intention tracking into one uniform node structure.
owner: human
status: refining
parent: null
serves: []
rationale: Scattered intent across issues, charter, and docs drifts apart.
reading: null
gap: null
clarifications:
  - question: Does a leaf differ in type from a root?
    answer: No — every node is the same type at any altitude. Recorded 2026-07-09.
tooling_goals:
  - kind: actuator
    statement: intentionsutil
success_signal:
  observable: nodes validated by validateNode
  sensor: vitest
  threshold: all committed nodes pass
  is_proxy: false
---

Settled design and mechanism notes for this strategy...
```

**All schema fields live in the frontmatter**, and the frontmatter is the whole
validated model — validation is uniform over this structured data. The body is
NOT parsed into the model and carries no schema fields, but it is not cosmetic
either: each kind declares what its body is for (see the body-function
clarification above), and that content is authoritative for its declared
function.

## Round-trip guarantee

`node → file → node` is lossless on the frontmatter model. `writeNode`
(`packages/intentionsutil/src/store.ts`) validates the input first, so the
written frontmatter is complete and deterministic — every optional field is
serialized with its default applied. `readNode` parses only the frontmatter
between the first two `---` fences and re-validates it, so constructing a node,
writing it, reading it back, and validating yields a deep-equal node.
`attributes` values must be YAML-representable data (strings, numbers, booleans,
arrays, maps) for the guarantee to hold.

The body is outside that guarantee but is never lost: `writeNode` reads any
existing file's body and re-emits it verbatim across frontmatter rewrites, for
every kind. Only a brand-new file with nothing on disk gets the generated
`# <statement>` placeholder body. `assertNoBodyLoss` turns a
body-preservation regression into a thrown error rather than a silent discard —
it refuses a write that would replace a hand-authored body with the regenerated
placeholder. (A body that is still exactly the placeholder carries no authored
content and may be regenerated freely.)

Node ids double as filenames, so `writeNode` and `readNode` reject ids
containing `/` or `\`, and the exact ids `.` and `..`.

## Fields on every node

Every field below carries a **write class**, the ratified intent/orchestration
boundary (`strategy-explicit-intent`, 2026-08-31) expressed as data. `intent` is
target state — what the author intends to be true. `orchestration` is
operational state — what is observed to be true, appended rather than authored.
Orchestration writers never rewrite intent fields; intent writers never rewrite
orchestration fields.

The identifier is `write_class`, never a fourth sense of *layer*: `layer`
already means `attributes.goal_layer`, kind-typed field placement (rules 9, 10,
12), and `graph-commit`'s Layer 1/2/3 conflict-resolution stages.

The classification is data, and these kind nodes are its authority.
`attributes.field_write_class` on this node declares the class of every field
common to all nodes; the owning kind node declares it for its kind-scoped
fields and for its own `attributes` keys (`kind-tactic`, `kind-strategy`). The
tables below are the normative prose home of the same classification, so a
`Write class` column appears on each.

A third value, `shared`, marks a declared **shim**: a field live writers of both
classes touch today, recorded with a reason and a liquidation condition in
`attributes.write_class_shims` rather than forced into a class that would break
a live path or make the fence fail open. `attributes` is not classified as a
whole — each declared key carries its own class on the kind node that owns it,
and an undeclared key is `shared` until it is declared.

### Required core

Strictly validated; `validateNode` throws if any is missing or ill-typed.

| Name        | Type         | Write class | Meaning |
| ----------- | ------------ | ----------- | ------- |
| `id`        | `string`     | `intent` | Unique node identifier; also the filename. Must be non-empty. |
| `kind`      | `string`     | `intent` | Names the `kind-<kind>` node that defines this node's semantics. Must be non-empty; existence of the kind node is a graph-level rule, not a per-node one. |
| `statement` | `string`     | `intent` | The intention itself, in one sentence. |
| `owner`     | `Owner` enum | `intent` | Who is accountable for the intention. |
| `status`    | `string`     | `shared` (shim) | Lifecycle/provenance stage. Must be non-empty; the *set* of legal values is per-kind data, not a central enum — see Status below. |

### Optional common fields

Absent or `null` is tolerated and the listed default applied; when present and
non-null, the shape is validated strictly.

| Name             | Type                      | Default | Write class | Meaning |
| ---------------- | ------------------------- | ------- | ----------- | ------- |
| `parent`         | `string \| null`          | `null`  | `intent` | Within-layer edge — id of the parent node; `null` for a root. |
| `serves`         | `string[]`                | `[]`    | `intent` | Cross-layer edge — ids of the nodes this node expresses. |
| `rationale`      | `string \| null`          | `null`  | `intent` | Why this intention exists. |
| `reading`        | `string \| null`          | `null`  | `orchestration` | Current measured value of the `success_signal` observable; `null` until a sensor populates it. |
| `clarifications` | `Clarification[]`         | `[]`    | `intent` | Dated Q&A pairs resolved during the dialectic. |
| `tooling_goals`  | `ToolingGoal[]`           | `[]`    | `intent` | Tooling the node aims to produce or change. |
| `success_signal` | `SuccessSignal \| null`   | `null`  | `intent` | A measurable signal the intention is met. |
| `attention`      | `Attention \| null`       | `null`  | `intent` | A user-authored attention injection. Goal-layer kinds only. |
| `office_hours`   | `OfficeHours \| null`     | `null`  | `orchestration` | First-class parking record — why the node needs the author and since when. Goal-layer kinds only; the router skips parked subtrees. |
| `pace_exempt`    | `boolean`                 | `false` | `orchestration` | Authored pace-gate bypass: admits one gate-exempt worker past a paced-to-zero budget. Never changes ordering. Goal-layer kinds only. |
| `superseded_by`  | `string[]`                | `[]`    | `intent` | Ids of the nodes that supersede this one — stored on the SUPERSEDED node, reverse derived by scan. Legal on EVERY kind; see Supersession below. |
| `supersession_expiry` | `string \| null`     | `null`  | `intent` | The event that expires this node's supersession — normally the in-flight PR's own merge or closure. Required by rule 26 when the node is superseded while in flight. |
| `attributes`     | `Record<string, unknown>` | `{}`    | per-key | Kind-specific fields. Validated only as a plain object; the meaning of its entries is defined by the node's kind node. Not classified as a whole — each declared key carries its own class on the owning kind node; an undeclared key is `shared`. |

`gap` is **not** a field. It is derived on read by `deriveGap`
(`packages/intentionsutil/src/sensors.ts`) from `reading` against
`success_signal.threshold`, is not a member of `IntentionNode`, is never stored
in a node file, and no writer assigns it — so it carries no write class and has
no row above. A `gap:` key found in frontmatter is residue, not schema.

`attention` is classified `intent`: it is a user-authored injection and no
orchestration writer assigns it (`grep -rn "\.attention =" packages/intentionsutil
.claude/skills` finds no assignment — the sole hit is a null comparison in
`validateNode`). Its membership in `STATE_FIELDS`
(`packages/intentionsutil/src/schema.ts`) therefore contradicts the
classification; that contradiction is a migration frontier item, not a shim.

"Goal-layer kinds" are those whose kind node sets `attributes.goal_layer: true`
— currently kind-strategy and kind-tactic. The eligible layer is data, not a
kind list in code: virtues stay unranked because kind-virtue carries no
`goal_layer` flag, not because code names them.

### Kind-scoped fields

These exist on the common node structure — every node file carries them, and
`validateNode` applies their defaults uniformly — but `validateGraph` restricts
which kinds may set them to a non-default value. They are defined by the kind
node that owns them:

| Name         | Type                | Default | Write class | Owning kind node |
| ------------ | ------------------- | ------- | ----------- | ---------------- |
| `phase`      | `Phase \| null`     | `null`  | `orchestration` | kind-tactic |
| `execution`  | `Execution \| null` | `null`  | `orchestration` | kind-tactic |
| `validates`  | `string[]`          | `[]`    | `intent` | kind-tactic |
| `blocked_by` | `string[]`          | `[]`    | `shared` (shim) | kind-tactic |
| `recovers`   | `string[]`          | `[]`    | `intent` | kind-strategy |
| `rounds`     | `Rounds \| null`    | `null`  | `orchestration` | kind-strategy |

The owning kind node restates the write class of its kind-scoped fields in its
own `attributes.field_write_class`, so a writer resolving a field's class from
the kind node that defines it finds it there; the declarations agree by
construction.

### Operational-layer carriers outside the node file

Claim records and evidence-log entries are `orchestration`-class carriers, and
they are **create-only**: one file per record, never rewritten and never deleted
by a writer. Correction is a new record that supersedes, never an edit. That is
what makes concurrent appends commutative and conflict-free — disjoint file
creations git merges in any order, with no shared hot file, no merge driver and
no ordering dependency. Compaction is a separate, serialized folding operation
and is not a writer's licence to rewrite a record. They live outside the node
file and outside `listNodes`' top-level `*.md` scan, so they are not nodes and
`validateGraph` does not see them.

## Shared shapes

### `SuccessSignal`

| Name         | Type      | Meaning |
| ------------ | --------- | ------- |
| `observable` | `string`  | What is observed. |
| `sensor`     | `string`  | How it is observed. |
| `threshold`  | `string`  | The value that counts as success. |
| `is_proxy`   | `boolean` | Whether the observable is a proxy for the real goal. |

### `Clarification`

| Name       | Type     | Meaning |
| ---------- | -------- | ------- |
| `question` | `string` | A question raised during the dialectic. |
| `answer`   | `string` | Its resolved answer. Must carry a `YYYY-MM-DD` provenance date somewhere in the text (graph rule 17). |

### `ToolingGoal`

| Name        | Type               | Meaning |
| ----------- | ------------------ | ------- |
| `kind`      | `ToolingKind` enum | What the goal codifies. |
| `statement` | `string`           | The tooling goal, in one sentence. |

### `Attention`

A user-authored injection that seeds the derived rank: a SPARSE per-tier map of
boost values, plus the rationale for claiming them.

| Name        | Type                      | Meaning |
| ----------- | ------------------------- | ------- |
| `boosts`    | `Record<string, number>`  | A RELATIVE claim per tier: `{"<tier>": <boost>}`, where the key is one of the decimal tier strings `"1"`, `"2"`, `"3"` and the value is the boost chosen ON THAT TIER'S SCALE. Each value must be finite and `> 0`. SPARSE: an absent tier key means "makes no claim in that tier" and must stay distinguishable from an authored lowest value — never write a `0` to stand for an unauthored tier. |
| `rationale` | `string`                  | Why this node draws attention now. Must be non-empty. |

An `attention` block must claim at least one tier: a block whose `boosts` map is
empty says nothing, and is rejected. To claim nothing, drop the `attention`
block entirely (`attention: null`) — there is no "zero this branch" spelling.

The pre-tier fields `boost` (with an optional `tier:` namespace tag) and a
positive `override` are still accepted on read as LEGACY compatibility sugar and
canonicalize into `boosts` — `boost: X` ⇒ `{"1": X}` untagged, `{"<tier>": X}`
when tagged; `override: X` ⇒ `{"<tier>": X}`. They are read-only spellings: every
writer emits the `boosts` map, and `tactic-attention-per-tier-boost-migration`
rewrites the remaining node files, after which both are deleted. The old
absolute-cap semantics of `override` are gone (it is now purely a shape
mapping), and the old `override: 0` "zero this branch" spelling is rejected.

### `Execution`

The live in-flight dispatch record; tactics only. See kind-tactic.

| Name                   | Type                            | Meaning |
| ---------------------- | ------------------------------- | ------- |
| `branch`               | `string`                        | The working branch. |
| `pr`                   | `number \| null`                | PR number; a non-negative integer when set. |
| `attempts`             | `Record<string, number>`        | Per-phase attempt counts; each a non-negative integer. |
| `markers`              | `string[]`                      | Phase-completion markers written during the run. |
| `strategy_fingerprint` | see below                       | Soft-freeze stamp of each serving strategy. |
| `fix`                  | `FixState \| null`              | A CI-fix interrupt in flight, orthogonal to `phase`. |
| `completion`           | `Completion \| null`            | Merge-verification evidence recorded at the done-transition. |

`strategy_fingerprint` is a per-strategy map `{<strategy-id>: <stamp>}` of each
serving strategy's substance-fields hash, stamped at plan/re-evaluation time and
later compared by a router's mid-flight soft-freeze trigger. A serving strategy
absent from the map is never stale (per-strategy null semantics). Each map value
is either a bare hash string or a `{hash, sha}` object, where `sha` is the
`origin/main` commit the hash was taken against — letting a stale child recover
the exact delta via `git diff <sha>..origin/main -- intentions/<strategy-id>.md`
instead of only learning *that* it drifted. A bare string as the whole field
(not as a map value) is a DEPRECATED-LEGACY form predating multi-serves
stamping: it is compared against every serving strategy, so a multi-serves
tactic stamped that way was born permanently stale. Legacy strings are accepted
transiently and convert to map form by natural churn; every writer emits map
form now. No hashing logic lives in the schema — only the typed field.

`FixState`:

| Name         | Type             | Meaning |
| ------------ | ---------------- | ------- |
| `since`      | `string`         | Interrupt date, `YYYY-MM-DD`. |
| `attempt`    | `number`         | Fix-attempt counter (non-negative integer); replaces the `attempts["fix"]` convention. |
| `pushed_sha` | `string \| null` | Last SHA the fix lane pushed — the pending-CI guard; `null` before the first push. |

`Completion` records two independent sufficient proofs that a tactic's content
reached `main`:

| Name             | Type             | Meaning |
| ---------------- | ---------------- | ------- |
| `mergedAt`       | `string \| null` | GitHub's PR `merged_at`, a FULL ISO-8601 timestamp (not the `YYYY-MM-DD` shape other date fields use). GitHub REST never reports a PR state of "MERGED", so a non-null value here is the merge signal. |
| `mergeCommitSha` | `string \| null` | GitHub's `merge_commit_sha` — the sha landed on the base branch. |
| `graphCommitSha` | `string \| null` | An out-of-band landing sha, backfilled manually when content reached `main` via commits rather than the recorded PR. Never derived mechanically. |

A real PR merge sets `mergedAt` and `mergeCommitSha` together; an out-of-band
landing sets `graphCommitSha`. All three null means the node was reconciled to
done with no evidence recorded — a later census step flags that case rather than
silently pruning it.

### `OfficeHours`

| Name             | Type                | Meaning |
| ---------------- | ------------------- | ------- |
| `reason`         | `string`            | Why the node is parked. |
| `since`          | `string`            | Park date, `YYYY-MM-DD`. |
| `recommendation` | `string \| null`    | What the parking session recommends the author do. |
| `session_type`   | `SessionType` enum  | What kind of attention the park needs. Defaults to `other` when absent, which keeps the field additive over the existing store. |

### `Rounds`

`/align-tactics` re-evaluation accounting; strategies only. See kind-strategy.

| Name             | Type             | Meaning |
| ---------------- | ---------------- | ------- |
| `count`          | `number`         | Rounds run (non-negative integer). |
| `last_completed` | `string \| null` | Verified-in-prod completion time; advances only when a non-draft child prunes. |
| `last_aligned`   | `string \| null` | `YYYY-MM-DD` the last round *landed* (align-decompose time), stamped independently of completion. |

## Enums

### `Owner`

| Value       | Meaning |
| ----------- | ------- |
| `human`     | A person is accountable for the intention. |
| `ai`        | An AI agent is accountable for the intention. |
| `procedure` | An automated procedure owns the intention. |

### `ToolingKind`

| Value      | Meaning |
| ---------- | ------- |
| `actuator` | Codifies *doing* — an automated procedure or action. |
| `sensor`   | Codifies *knowing* — an observation or measurement. |

### `Phase`

The persisted dispatch phase a tactic sits in: `draft`, `align-tactics`,
`implement`, `qa`, `review`, `main-qa`, `done`. `fix` is deliberately NOT a
member — the CI-fix interrupt lives entirely in the orthogonal `execution.fix`
field, set and cleared off the live CI verdict independent of `phase`. See
kind-tactic.

### `SessionType`

| Value                    | Meaning |
| ------------------------ | ------- |
| `requirement-discovery`  | The park needs the author to decide or clarify a requirement before work can proceed. |
| `curriculum-review`      | The park is a reading/dialog demonstration sitting the author runs with the text in hand. |
| `other`                  | The default for every park with no natural type, including machine-authored parks such as a retry-budget park. |

The two typed values are soft-penalized in office-hours ranking, so classifying
a park lowers its default rank versus `other`.

### `Status`

There is no central status enum. `status` is validated per node only as a
non-empty string; the legal *set* is declared per kind, as the keys of that kind
node's `attributes.status_vocabulary` map, whose values are the meaning of each
value for that kind. Graph rule 16 enforces that every node's `status` is a key
of its kind node's vocabulary, and that the kind node declares a non-empty
vocabulary at all. Membership cannot be checked per node because `validateNode`
has no graph context.

This is the same self-describing move as `kind` itself: the vocabularies are
data (the committed kind nodes), so a kind may carry lifecycle values that mean
nothing to another kind — kind-tactic's `codified` means the execution plan is
settled and the tactic is ready to dispatch, kind-strategy's means the author
has settled the strategy against present conditions. The historical central list
was `raw | refining | delegated | codified`; kinds that still want those values
declare them.

## Supersession

A node is **superseded** when its intent moved to another node — abandoned, not
completed. Every kind vocabulary declares `superseded`, and `superseded_by`
names the successor.

**The terminal is carried on `status`, never on `phase`.** Three reasons, all
of which a future implementer should read before proposing a `superseded` phase:

1. `phase: done` is the COMPLETION terminal, and closing abandoned work that way
   launders it as finished. The harm is the word `done`, not a deletion —
   marking a node superseded deletes nothing, so the node stays present and
   every inbound prose citation keeps resolving. (Pruning is a separate,
   deliberate act; see rule 24 for the edge repair a prune owes.)
2. A `superseded` PHASE would not survive rule 10 or the ladder's phase
   vocabulary, and it would still deadlock dependents. NOTE — carrying the
   terminal on `status` does NOT by itself avoid that deadlock, and an earlier
   revision of this bullet wrongly claimed it did: `blockersComplete`
   (`packages/intentionsutil/src/router.ts`) counts a blocker complete only when
   it is absent or at `phase: done`, and a superseded node keeps whatever phase
   it reached (below), so a superseded blocker blocks every dependent forever
   and `classifyTerminus` (`terminus.ts`) drains them as `excused-blocked`. The
   fix is the reader half, not the axis: whatever consults `isSuperseded` in
   selection must also treat a superseded blocker as no longer blocking. Until
   that lands, do not supersede a node any live node names in `blocked_by`.
3. A phase cannot mark a superseded STRATEGY. Rule 10 confines `phase` to
   `kind: tactic`, and the originating requirement is that the graph must not
   implement one strategy-or-tactic and later attempt the one it supersedes. A
   status covers the whole requirement, because status vocabulary is already
   per-kind data and already validated by rule 16. Adding the terminal therefore
   needs no new validation code and no type widening — only vocabulary entries
   on the six kind nodes.

**The edge direction is fixed.** `superseded_by` is stored on the SUPERSEDED
node and names the nodes that supersede it. The reverse direction is derived by
scanning, exactly the way inbound `blocked_by` edges are found today. There is
no maintained reverse index and none is to be built.

**A superseded node keeps whatever `phase` it reached.** Nothing pins it, because
partial supersession — what `superseded_by` means when the successor obsoletes
only part of the node — is unruled, and pinning the phase would pre-empt that
question. Readers that mean "is this node still live work" must consult `status`
as well as `phase`; readers that specifically mean "reached the completed
terminal" keep the literal `phase === "done"` test.

**In-flight supersession does not park.** A node with a non-null `execution`
still takes the supersession edge and still gets no park — a similarity judgment
must never halt live work. The price of that exception is `supersession_expiry`:
rule 26 requires the edge to name the event that ends the interim live risk,
normally the in-flight PR's own merge or closure. The expiry is per-node rather
than per-edge, because what is being bounded is that THIS node is in flight.

Rules 24, 25 and 26 enforce all of the above; see Graph-level validation.

**No reader consults the terminal yet.** Landed 2026-08-31: the schema half is
enforced (rules 24-26, the per-kind vocabulary, and the shared `isSuperseded` /
`isRetired` predicates), but every liveness reader still judges on `phase`
alone — the selector, `blockersComplete`/`classifyTerminus`, and the
goals/census/attention passes. So a node marked superseded today keeps being
selected for dispatch, a merged one classifies as a terminus `violation` rather
than a terminal, and — the one case that is worse than a no-op — a superseded
node still blocks every node naming it in `blocked_by`, forever. Units 2 and 3
of `tactic-supersession-edge-and-terminal` wire them; until those land, marking
a node superseded records the intent but stops nothing.

## Required vs. optional

The required core — `id`, `kind`, `statement`, `owner`, `status` — is always
present and strictly validated. Every other field tolerates being absent or
`null` and defaults on read. This split is load-bearing: a node may legitimately
exist before its optional fields are filled in. A freshly authored tactic
carries empty dialectic fields (`clarifications`, `tooling_goals`,
`success_signal`, `serves`) until the dialectic populates them; `reading` and
`gap` are sensor-populated afterwards (`reading` measured by the sensor, `gap`
mechanically derived from it); the dispatch fields stay at their defaults until
a router stamps them. `validateNode` must therefore accept nodes without any of
these rather than rejecting them as invalid.

The defaults applied on read are: `parent: null`, `serves: []`, `recovers: []`,
`rationale: null`, `reading: null`, `gap: null`, `clarifications: []`,
`tooling_goals: []`, `success_signal: null`, `attention: null`, `phase: null`,
`execution: null`, `validates: []`, `blocked_by: []`, `superseded_by: []`,
`supersession_expiry: null`, `office_hours: null`, `pace_exempt: false`,
`rounds: null`, `attributes: {}`.

## Graph-level validation

`validateGraph(nodes)` checks referential integrity across a whole node set —
the edges BETWEEN nodes, not per-node shape. It collects every violation and
throws one error listing all of them, so a single run surfaces the whole
problem set rather than the first entry. It enforces:

 1. Every node's `kind` has its defining `kind-<kind>` node present. This is
    what makes the graph self-describing: the set of valid kinds is the set of
    committed kind nodes, not an enum in code.
 2. Every non-null `parent` resolves to an existing node id.
 3. Every `serves` entry resolves to an existing node id.
 4. Every `recovers` entry resolves to an existing node id.
 5. `attention` appears only on nodes whose kind node sets
    `attributes.goal_layer: true`.
 6. A non-null `parent` resolves to a node of the SAME `kind` — virtue→virtue,
    strategy→strategy, tactic→tactic, uniform across every kind.
 7. Every `serves` entry on a `kind: tactic` node resolves to a
    `kind: strategy` node.
 8. Every `serves` entry on a `kind: strategy` node resolves to a
    `kind: virtue` node.
 9. A non-empty `recovers` appears only on `kind: strategy` nodes, and every
    entry resolves to a `kind: delegation` node.
10. `phase`, `execution`, a non-empty `blocked_by`, and a non-empty `validates`
    appear only on `kind: tactic` nodes.
11. `office_hours` and a true `pace_exempt` appear only on goal-layer kinds —
    the same `attributes.goal_layer` gate as rule 5.
12. `rounds` appears only on `kind: strategy` nodes.
13. Every `blocked_by` entry resolves to an existing `kind: tactic` node.
14. Every `validates` entry resolves to an existing `kind: strategy` node.
15. `blocked_by` edges contain no cycle — a tactic transitively blocked by
    itself is invalid. Dangling edges are reported by rule 13, not traversed.
16. Every node's `status` is a key in its kind node's declared
    `attributes.status_vocabulary`; a missing or empty declaration on the kind
    node is itself an error.
17. Every `clarifications[].answer` carries a dated provenance clause — a
    `YYYY-MM-DD` substring placed anywhere in the string, placement-agnostic and
    uniform across every kind. This is the convention the router's reading-date
    helper and the coverage report's last-reviewed lookup parse to date a
    clarification; a dateless answer silently breaks those consumers.
18. `strategy-main-health` holds a dominant attention: no OTHER node's
    `attention.boost` or `attention.override` may match or exceed
    `strategy-main-health`'s own live `attention.boost`, which keeps red-main
    fix work outranking everything else. The threshold is read live from the
    graph, never hardcoded; if `strategy-main-health` is absent or its
    `attention`/`attention.boost` is null there is no dominance to protect and
    the guard is inert. A node opts out by placing the literal substring
    `ACK: main-health-dominance` in its `attention.rationale`.
19. Tier marks are well-shaped: `attributes.bug_fix` and `attributes.security`,
    when present, are booleans; `attributes.tier`, when present, is the number 2
    or 3. An explicit `attributes.tier: 1` is rejected — 1 is the implicit
    default every unmarked node already carries, so authoring it would give one
    state two spellings.
20. Per-tier boost namespace: a node with non-null `attention` sets
    `attention.tier` equal to its OWN tier — its own marks, not the effective
    tier it inherits down `parent`/`serves`. A boost value is only meaningful
    within one tier's scale, so a node whose tier changes must have its value
    re-selected in the new tier's namespace. The check deliberately uses the own
    tier: an effective-tier check would cascade, invalidating every boosted
    descendant the moment any ancestor gained a mark.
21. `attributes.measured_impact`, when present, is an array of summary
    measurement records `{metric, value, unit, window, sensor, measured}` —
    `metric`/`unit`/`window`/`sensor` non-empty strings, `value` a finite
    number, `measured` a `YYYY-MM-DD` date. `attributes` is otherwise free-form,
    so without this rule a malformed measurement would reach every consumer
    unchallenged; the key is cited evidence for attention and classification
    writes, so it earns a shape rule as tier marks do. The rule checks shape
    only and never reads a value — a measurement is queryable input to a ranking
    act, never an ordering authority of its own. `kind-tactic` carries the
    field's normative detail.
24. Every `superseded_by` entry resolves to an existing node of the SAME `kind`
    as the superseded node. Same-kind is modelled on rule 6: a tactic superseded
    by a strategy is not a supersession, it is a re-parenting. Unlike rules 10
    and 13–14 this rule is NOT kind-confined — `superseded_by` is legal on every
    kind, which is the half of the requirement a tactic-only `phase` terminal
    could not express. A dangling supersession target is a hard fail, and what
    keeps it from firing is the PRUNER, not this rule: completion pruning
    (`graph-commit --prune`) really does delete node files, so a prune must
    strip the pruned id from every inbound `superseded_by` in the SAME commit —
    exactly the repair rule 13 already requires for `blocked_by`. The
    reverse-edge scans that make that possible are `inboundSuperseders` and
    `inboundBlockers` (`packages/intentionsutil/src/transitions.ts`); neither
    has a caller in the prune path today, so the repair is the pruning agent's
    obligation.
25. `superseded_by` edges contain no cycle — a node cannot transitively
    supersede itself, and a node naming its own id is the length-1 case. Shares
    one DFS implementation with rule 15. Dangling edges are reported by rule 24,
    not traversed.
26. A node superseded WHILE IN FLIGHT names its expiry event: when
    `superseded_by` is non-empty and the node is in flight — `execution`
    non-null AND `phase` not yet `done` — `supersession_expiry`
    must be a non-empty string. Both halves are needed because the execution
    record is never cleared on completion, so `execution` alone means "was ever
    dispatched": a completed node could otherwise never take a supersession
    edge, and an expiry whose event has already fired could never be cleared.
    Supersession never parks live work — an in-flight
    node takes the edge and keeps running — and that interim-live-risk exception
    is only permitted when an expiry is named, normally the in-flight PR's own
    merge or closure. The expiry is per-NODE, not per-edge: what is bounded is
    that THIS node is in flight, a property of its own `execution`. Inert when
    the node is not superseded, and when a superseded node is not in flight.

Rule numbering has two gaps this list does not close, both pre-existing:
rule 20 above describes the per-tier boost namespace check, which code RETIRED
(numbers are cross-referenced from node bodies and never reused, so 20 stays
burned rather than being reassigned); and rules 22 (WAIT-node shape) and 23
(no `attributes` key shadows a first-class field name) are enforced in
`schema.ts` but not yet transcribed here.

Rules 6–9 judge only edges whose target already resolves — rules 2–4 report the
dangling case — so a single broken edge is not double-reported. Rules 13–14 own
their own dangling case, since no existence rule covers those edges. `serves` on
delegation and kind nodes is deliberately unenforced: a delegation serves
whatever depends on it, which is intentionally loose.

## Prose reference integrity

`validateGraphProseRefs` is a separate check, kept apart so `validateGraph`
stays a pure function of the node list alone. It scans a node's PROSE — its
`statement`, `rationale`, `attention.rationale`, every `clarifications[].answer`,
and its markdown body — for backtick-quoted, id-shaped references, and requires
each to resolve to a live node, to a node the graph history shows was pruned, or
to planned-but-uncommitted work (some OTHER open tactic's statement or body
mentions the id). A grandfathering baseline covers pre-existing dangling prose
references so the check does not retroactively break `main`; it should not grow.
The practical consequence for authors: do not backtick a node id you have not
confirmed exists.

## Derived values are never stored

`intentions/` stores authored intent, never derived global state. A value that
is a function of the whole graph is recomputed on read and never enters
frontmatter, because any edit elsewhere in the graph would make a stored copy
stale without touching the file that holds it.

The canonical case is attention. The `attention` field is a user-authored
*injection* — only the `boost` or `override` and its rationale the author
writes. The resolved rank `resolveAttention` computes from it is derived on read
and NEVER stored. `resolveAttention` accumulates, per node, a set of
`(source-node, amount)` pairs flowing DOWN `parent` and `serves` edges —
undecayed and undiluted, each authored source counted once per node — and a
node's rank is the sum of its own set: a `boost` adds `(self, boost)`, an
`override` replaces the set with `{(self, override)}` and caps its branch.
Because a node's rank depends on every ancestor's injections and edges, storing
it would go stale on any edit anywhere.

`gap` is the contrasting case, and shows where the line falls: `deriveGap`
computes it from same-file inputs (`reading` against
`success_signal.threshold`), so it is a local function of one node's own fields
and is safe to store.

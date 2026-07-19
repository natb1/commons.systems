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
reading: null
gap: null
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
    answer: Never through attention. Blocking is a separate tactic-layer mechanism —
      a tactic subtree blocks another, and no tactic in the blocked subtree
      begins until every tactic in the blocking subtree completes; the gate
      releases itself as tactics close. Strategies are never blocked, and
      strategy refinement, documentation, and emission are never gated — the
      router is the single enforcement point. Recorded 2026-07-02.
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
      part 2026-07-13 interview (author-dictated orthogonality)."
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
      2026-07-18 tier clarifications."
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
      Recorded 2026-07-18 interview."
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
---
# Close the loop — intent enters execution from the graph, and execution reports back as readings

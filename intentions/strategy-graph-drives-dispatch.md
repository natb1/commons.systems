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
reading: "serves: 82/82 open tactics; readings: 15/51 sensor-naming strategies
  (47 unregistered sensors)"
gap: 'reading "serves: 82/82 open tactics; readings: 15/51 sensor-naming
  strategies (47 unregistered sensors)" does not meet threshold "every open
  tactic carries a non-empty serves edge and sensor-run readings exist for every
  strategy that names a sensor"'
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
      (author-dictated)."
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
tooling_goals:
  - kind: actuator
    statement: resolveAttention (additive source-set ranks) consumed directly by the
      graph-native router's selector
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
attributes:
  conditions:
    - the dispatch chain remains the execution path for tactical work
      (strategy-autonomous-execution holds)
---
# Close the loop — intent enters execution from the graph, and execution reports back as readings

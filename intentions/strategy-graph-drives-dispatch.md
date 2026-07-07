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
  execution reports back as readings — is not yet load-bearing: readings are
  null and the dispatch queue's ordering owes nothing to the dialectic's triage.
  The first coupling attempt was a gh↔graph mapping layer (intention-emit,
  backfill, trackers/, the rank-map ordering bridge); it is superseded and
  removed — the child strategy-graph-native-dispatch closes the loop natively
  instead, with the legacy gh router draining in parallel over disjoint state.
  Integration with an external tracking system such as GitHub is a separate
  strategy; design TBD.

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
    answer: "Applying attention to a node prioritizes the full critical path to it:
      the node's outgoing authored source-set flows not only downward to its
      subtree (parent/serves, as before) but also backward along blocked_by to
      its blockers, recursively and interleaved — a blocker inherits the hot
      node's sources, and the blocker's own subtree inherits them via the normal
      downward flow. Propagation stays undecayed and undiluted, each authored
      source counted once per node, and applies to overrides the same as boosts:
      whatever outgoing set a node distributes to its children also reaches its
      blockers. Existing authored boosts are unchanged in value and meaning
      (strategy-attention-surface's boost 3 stands as authored); the change only
      widens where rank flows, so no re-authoring is needed. Recorded 2026-07-07
      interview."
  - question: Does backward rank flow along blocked_by change the blocking mechanism?
    answer: No. Blocking remains the sole ordering and gating mechanism — a blocked
      node stays ineligible for selection regardless of rank, and ordering
      constraints are still never expressed through attention. The backward flow
      only ranks the blockers, so the router drains a hot node's critical path
      first while the gate still releases itself as tactics close. Amends (does
      not supersede) the 2026-07-02 ordering clarification. Recorded 2026-07-07
      interview.
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
rounds: null
attributes:
  conditions:
    - the dispatch chain remains the execution path for tactical work
      (strategy-autonomous-execution holds)
---
# Close the loop — intent enters execution from the graph, and execution reports back as readings

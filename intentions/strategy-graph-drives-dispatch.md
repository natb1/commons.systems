---
id: strategy-graph-drives-dispatch
kind: strategy
statement: Close the loop — intent enters execution from the graph, and
  execution reports back as readings
owner: human
status: refining
parent: strategy-explicit-intent
rationale: >-
  The plumbing between the graph and the dispatch chain exists in both
  directions — intention-emit turns a leaf node into a chain-compatible issue,
  backfill regenerates tactic leaves from GitHub read-only, trackers/ mirrors
  execution state — but the loop is not yet load-bearing: tactic serves edges
  are unpopulated, readings are null, and the dispatch queue's ordering owes
  nothing to the dialectic's triage.

  This strategy owns making the loop real: work enters execution because a node
  calls for it (serves classified at emit time, backfilled by the dialectic for
  existing tactics), sensors write readings and gaps back after execution, and
  the next dialectic consumes that feedback when it triages.
  strategy-autonomous-execution owns the chain itself; this node owns the
  chain's coupling to intent.
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
    answer: Never through attention. Blocking is a separate tactic-layer
      mechanism — a tactic subtree blocks another, and no tactic in the blocked
      subtree begins until every tactic in the blocking subtree completes; the
      gate releases itself as tactics close. Strategies are never blocked, and
      strategy refinement, documentation, and emission are never gated — the
      router is the single enforcement point. Recorded 2026-07-02.
  - question: What does authoring a `serves` edge imply for rank?
    answer: It is a ranking act — a second serves edge adds a real claim to
      the node's rank, so edge authoring deserves the same review care as
      weights. Recorded 2026-07-03.
  - question: What if one hot strategy's wide subtree monopolizes the queue?
    answer: Accepted by design — hot means hot; its work drains first; the
      remedy is re-weighting the strategy, never re-introducing fan-out
      dilution. Recorded 2026-07-03.
tooling_goals:
  - kind: actuator
    statement: resolveAttention (additive source-set ranks) consumed directly by
      dispatch-select-target
  - kind: sensor
    statement: frontier-view renders the resolved ranking
success_signal:
  observable: the fraction of open dispatch work traceable to a serving node, and
    readings populated by the loop rather than by hand
  sensor: the intention store and trackers/ themselves
  threshold: every open tactic carries a non-empty serves edge and sensor-run
    readings exist for every strategy that names a sensor
  is_proxy: false
attributes:
  conditions:
    - the dispatch chain remains the execution path for tactical work
      (strategy-autonomous-execution holds)
---
# Close the loop — intent enters execution from the graph, and execution reports back as readings

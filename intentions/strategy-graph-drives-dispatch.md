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
clarifications: []
tooling_goals: []
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

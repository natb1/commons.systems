---
id: strategy-main-health
kind: strategy
statement: "origin/main stays green: a continuously releasable trunk, red
  episodes self-healing through the sensor flow"
owner: human
status: refining
parent: strategy-autonomous-execution
rationale: "Red main halts the autonomous dispatch chain — no new work is safe
  to start — and breaks the trunk's releasability, so main health outranks all
  other work while failing. Created 2026-07-13 as the persistent owner of the
  main-health signal per strategy-graph-native-dispatch's self-heal encoding:
  standing structure lives on strategy nodes, never transient tactics (same-date
  persistent-layer doctrine). Auto-created red-main fix tactics serve and
  validate this node and inherit its standing boost through the normal downward
  attention flow; the boost's dominance is maintained by a write-path guard
  (author override required to out-boost or reduce it), never by recompute."
reading: "origin/main HEAD 9f364306 green 2026-07-13: all check runs concluded
  success (acceptance, preview-and-smoke, lint, unit-tests, guard, Analyze
  go/python/actions) — success_signal threshold met. Manual observation standing
  in for the not-yet-implemented main-health sensor
  (tactic-graph-main-self-heal): it validates the signal (gap null, reading set)
  so the router strategy lane stops emitting this node as an align-tactics
  decomposition candidate. Overwrite or null this reading when main next goes
  red, or when the sensor lands and takes over the read."
gap: null
serves: []
recovers: []
clarifications:
  - question: How does resolution work attach to this strategy when the signal fails?
    answer: "The graph tick's main-health sensor read failing find-or-creates one
      fix tactic per red episode (tactic-main-red-<shortsha> shape, redacted
      diagnosis in the body) with serves and validates edges to
      strategy-main-health — inheriting this node's boost 100 undecayed — its
      own success_signal {sensor: main-health, threshold: green} so
      threshold-met completes it, and pace_exempt: true. Full encoding:
      strategy-graph-native-dispatch's 2026-07-13 clarifications; mechanics
      retained in draft tactic-graph-main-self-heal. Recorded 2026-07-13
      interview."
  - question: Does the standing boost 100 make the router's strategy lane repeatedly
      select this strategy for /align-tactics decomposition?
    answer: "Known edge, accepted at creation: this strategy needs no interactive
      decomposition — its tactics are auto-created by the sensor flow — so the
      strategy lane must not treat its rank as a decomposition request. The
      guard detail lands with the self-heal implementation (draft
      tactic-graph-main-self-heal); until then any align skip the selector emits
      for it is expected and benign. Recorded 2026-07-13 interview."
tooling_goals: []
success_signal:
  observable: origin/main HEAD check-run conclusions — the trunk's own-pipeline CI status
  sensor: main-health
  threshold: "green: every check on the current origin/main HEAD concludes success
    (or neutral/skipped)"
  is_proxy: false
attention:
  boost: 100
  override: null
  rationale: "Author-directed 2026-07-13: main health outranks all other work —
    auto-created red-main fix tactics serve this node and inherit this boost
    undecayed. Kept dominant by the write-path guard (author override required
    to author a boost or override at or above it, or to reduce it —
    strategy-graph-native-dispatch's 2026-07-13 guard condition), never by
    recompute. Context: other authored boosts are currently 1-10 and derived
    terms cap at 2; blocked_by compounding cannot overtake because blocking is
    orthogonal to boosting (strategy-graph-drives-dispatch, 2026-07-13)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes: {}
---
# origin/main stays green: a continuously releasable trunk, red episodes self-healing through the sensor flow

The persistent owner of the `main-health` signal. Full self-heal encoding:
`strategy-graph-native-dispatch`'s 2026-07-13 clarifications; mechanics in
draft `tactic-graph-main-self-heal`; boost-dominance guard recorded as a
condition on `strategy-graph-native-dispatch`; blocking-orthogonality
model on `strategy-graph-drives-dispatch`.

---
id: tactic-strategy-fingerprint-stamp-coverage
kind: tactic
statement: "The strategy soft-freeze is inert where it matters most: all 33 open
  tactics serving strategy-graph-native-dispatch carry no
  execution.strategy_fingerprint entry for it, so isFingerprintStale returns
  false for every one and a strategy edit freezes nothing -- diagnose why the
  stamp is not written and close the gap"
owner: ai
status: raw
parent: null
rationale: "Measured 2026-07-28 during the /align-strategy round that amended
  this strategy's success_signal and attributes.conditions -- both inputs to
  strategyFingerprint (packages/intentionsutil/src/router.ts:80) -- using the
  authoritative predicate the align-strategy freeze/re-stamp rule mandates
  rather than a grep. Result: the edit's freeze blast radius is ZERO. All 33
  open (non-draft, non-done) tactics serving strategy-graph-native-dispatch
  carry no execution.strategy_fingerprint entry for it, neither a map key nor a
  legacy bare string, and isFingerprintStale
  (packages/intentionsutil/src/transitions.ts:365) returns false both for a null
  stamp and for a map lacking the strategy's key. So the mid-flight
  re-evaluation mechanism strategy clarification 10 depends on has never fired
  for the graph's most-edited node and largest subtree, and every
  /align-strategy round on it to date has silently frozen nothing. Graph-wide
  coverage is partial: 35 of 108 open tactics carry any stamp at all, all in the
  deprecated bare-string form. THE CAUSE IS UNDIAGNOSED and this node asserts
  none -- that is unit 1's job. Two candidate producers are known:
  apply-node-transition.ts:169-172 is the first-class writer (it merges
  args.strategyFingerprint into execution.strategy_fingerprint), and
  align-strategy's own bootstrap-interim hand-stamp path is the other. Which is
  failing to fire, and whether the absence is a bug, an un-run migration, or a
  deliberate un-armed state, is unestablished. UNIT 1 (diagnosis, opus):
  establish empirically which producer should have stamped these 33 nodes and
  why it did not -- trace every call site that passes --strategy-sha /
  strategyFingerprint into apply-node-transition.ts, and check whether the
  graph-lane transition path passes it at all; report whether the 35 stamped
  nodes graph-wide were stamped by a different path. UNIT 2 (fix, model chosen
  from unit 1's finding): close whichever gap unit 1 identifies, and add a test
  asserting that a node transitioned through the graph lane comes out with a
  {hash, sha} map entry for each serving strategy. Do NOT bulk-backfill stamps
  onto the existing 33 as a substitute for the fix. VERIFICATION: re-run the
  measurement (readNode + strategyFingerprint + isFingerprintStale over the open
  children of strategy-graph-native-dispatch) after a node transitions through
  the lane and confirm a non-empty map entry appears; the existing bare-string
  stamps must keep passing isFingerprintStale's legacy branch unchanged."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The strategy soft-freeze is inert where it matters most: all 33 open tactics serving strategy-graph-native-dispatch carry no execution.strategy_fingerprint entry for it, so isFingerprintStale returns false for every one and a strategy edit freezes nothing -- diagnose why the stamp is not written and close the gap

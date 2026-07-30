---
id: tactic-autonomous-ci-pending-liveness-bound
kind: tactic
statement: Bound pending CI on the autonomous dispatch path — a node whose
  checks never start or whose run is cancelled currently stalls forever with no
  counter, no hold, no park and no operator surface
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Verified absence at recording time: graph-select-target:628 skips
  as 'ci-pending' with no counter; provision-node-worktree:138 exits 10
  'waiting' with no counter; reconcile-graph-review-stall maps pending to an
  unknown verdict and no-ops; lib.sh:697-701 classifies an EMPTY rollup (checks
  never started) as pending. A grep of every tick script for
  timeout/stale/since/age/elapsed on a pending verdict returns nothing. This is
  the only stuck state with no cap, against CONFLICT_STRIKE_CAP=5 and
  FIX_ATTEMPT_CAP=3. Explicitly NOT covered by the terminal trichotomy: a
  tick-level skip spawns no session and declares nothing. Adjacent
  tactic-dispatch-explicit-ci-wait covers the explicit-node lane and expressly
  leaves the autonomous path unchanged, so it does not close this. Likely shape:
  an age- or tick-count-based bound escalating to a tracked hold with an
  operator surface."
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
# Bound pending CI on the autonomous dispatch path — a node whose checks never start or whose run is cancelled currently stalls forever with no counter, no hold, no park and no operator surface

---
id: tactic-terminal-declaration-verified-against-node
kind: tactic
statement: Derive the terminal declaration from durable node state — the reaper
  verifies the claimed disposition against the node before reaping, closing the
  marker-written-but-graph-write-failed path that reaps a node with nothing
  recorded while the fuse sees a valid declaration
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview; the second of two recorded leaks in the terminal-trichotomy
  containment. mark-node-terminal writes a marker into $CLAUDE_JOB_DIR while the
  graph write (transition-node / park-node) is a separate operation, so the
  marker is a claim ABOUT what happened rather than the happening.
  Graph-write-lands / marker-missing fails safe (dispatch-self-close HOLDs). The
  inverse does not: marker written, graph write failed → session reaped, node
  re-selected unchanged, and the fuse breaker sees a valid declaration so it
  never fires. Fix directions: verify the claimed disposition against the node
  at origin/main before reaping, or make the marker a consequence of the graph
  write rather than a parallel assertion. Distinct from
  tactic-qa-fix-node-terminal-declaration, which covers the opposite (safe)
  direction of a missing declaration."
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
# Derive the terminal declaration from durable node state — the reaper verifies the claimed disposition against the node before reaping, closing the marker-written-but-graph-write-failed path that reaps a node with nothing recorded while the fuse sees a valid declaration

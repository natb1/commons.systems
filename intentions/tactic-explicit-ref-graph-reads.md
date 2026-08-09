---
id: tactic-explicit-ref-graph-reads
kind: tactic
statement: graph reads resolve their tree from cwd or from script location
  rather than from an explicit ref, so a stale checkout or the wrong script copy
  silently produces a wrong answer -- make the tree/ref a required argument on
  every read
owner: ai
status: raw
parent: null
rationale: "Surfaced and ruled ADOPTED in the 2026-08-05 /align interview (R3).
  Greenfield: check-node-selection.ts reads origin/main rather than the main
  checkout's working tree; validate-graph.ts requires its intentions dir rather
  than defaulting cwd-relative; transition-node, write-node.ts and clear-park
  stop resolving their repo root from script location. Evidence: a correct
  selection rejected as 'stale-selection: not-parked' because the checkout was
  one commit behind; validate-graph printing 'ok -- N nodes' against the wrong
  tree unless the dir is passed explicitly; and a measured case that drove a
  fleet-latch counter to 156. The recording session itself then tripped it while
  landing the very clarification adopting this fix -- it ran write-node.ts from
  the primary checkout, so the script resolved its root from that copy and wrote
  the amended strategy into the shared main checkout, producing the dirty
  tracked file this strategy calls a fleet-stalling defect (caught and reverted
  immediately). Retires the freshly-fetched-state and fast-forward-the-checkout
  invariants and the whole script-location-traps class. Scope is broad and was
  NOT enumerated at interview time."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph reads resolve their tree from cwd or from script location rather than from an explicit ref, so a stale checkout or the wrong script copy silently produces a wrong answer -- make the tree/ref a required argument on every read

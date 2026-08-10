---
id: tactic-graph-auto-merge-blocked-by-gate
kind: tactic
statement: graph-auto-merge's candidate enumeration must honour
  blockersComplete, so a node carrying an unsatisfied blocked_by edge is never
  merged ahead of its blocker even once it acquires a reviewed marker
owner: ai
status: raw
parent: null
rationale: "graph-auto-merge's candidate gate is `kind:tactic AND phase:review
  AND execution.pr non-null AND execution.markers contains reviewed`. It never
  consults blocked_by. So the graph's ordering edges are SELECTION gates only,
  not merge interlocks: a blocked node that acquires a reviewed marker merges
  immediately, ahead of the blocker whose landing it was ordered behind.
  Verified behaviourally 2026-08-05 by the bootstrap monitor pass --
  blockersComplete (packages/intentionsutil/src/router.ts:206, which reads via
  listNodesStrict) correctly returned false for both then-blocked nodes and true
  for both blockers, and the edges did hold in practice, but only because
  neither blocked node had yet earned a reviewed marker. The interlock is
  therefore latent-by-luck, not enforced. Remedy: honour blockersComplete in the
  enumeration -- it already uses listNodesStrict, which is exactly the
  precondition that function documents, so this is an added predicate on an
  existing read, not a new traversal. Dedup: a find-or-create check over the
  514-node graph found no owner. The nearest siblings are the SAME gate with a
  DIFFERENT predicate and are deliberately cited rather than widened --
  tactic-graph-auto-merge-office-hours-gate (PR #3033, office_hours predicate)
  and tactic-graph-auto-merge-up-to-date-gate (base-currency predicate). Filing
  as a third sibling keeps each predicate's evidence and verification separable.
  Corroborating measurement from the same pass, on the office_hours sibling
  rather than this one: auto-merge merged #3046 at 16:46:54Z (69s after that
  node was parked at 16:45:43Z) and #3048 at 16:52:33Z (83s after its park at
  16:51:10Z) -- two live confirmations in seven minutes that this gate merges
  nodes the rest of the system considers withheld. That is the same structural
  defect class this node closes for blocked_by."
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
# graph-auto-merge's candidate enumeration must honour blockersComplete, so a node carrying an unsatisfied blocked_by edge is never merged ahead of its blocker even once it acquires a reviewed marker

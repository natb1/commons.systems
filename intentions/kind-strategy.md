---
id: kind-strategy
kind: kind
statement: Strategy — the highest goals a virtue generates against present conditions
owner: human
status: codified
parent: null
rationale: >-
  A strategy is the first goal layer: what a virtue produces when pointed at the
  actual situation. The `serves` edge from a strategy to its virtues is the
  graph's one phase change — disposition becomes state. `parent` links
  strategies into sub-strategies where useful — structural nesting, not roll-up.


  A strategy is persistent. It remains in the graph even when no tactic
  currently serves it; dormancy is normal, not a defect. A strategy never
  completes. It leaves the graph only two ways: a condition in
  `attributes.conditions` fails (then re-derive it from its virtues), or the
  human deliberately retires it.


  A strategy is conditional where a virtue is not. `attributes.conditions` names
  the premises about the world that make the strategy apt; when a condition
  fails, re-derive the strategy from its virtues rather than defending it. This
  is what distinguishes a strategy that expired from a virtue that eroded.
  Example: agentic construction is a strategy with conditions, not a virtue —
  pivotal only while it remains the highest-impact path to recovering software
  autonomy and while its recovery substrate (open-weight models, local
  inference) stays viable.


  `success_signal` on a strategy names the observable that would show the
  strategy working; `reading` and `gap` are sensor-populated against it.


  `recovers` is the strategy→delegation edge: the ids of the delegation records
  this strategy's work unwinds, resolved by `validateGraph` like any other edge.
  A DOMAIN STRATEGY is a strategy that recovers one domain of delegated life
  (attention, finance, publishing); it names its artifacts — the apps that do
  the recovering — in prose in `rationale`. Apps are not nodes: the strategy is
  the intention, the app is its current materialization, and naming it in prose
  keeps the graph stable while the artifacts iterate.
reading: null
gap: null
serves: []
recovers: []
clarifications:
  - question: Does a sub-strategy re-declare its parent's serves?
    answer: No — sub-strategies inherit. The parent edge already carries the
      parent's claims down (resolveAttention flows rank down parent and serves
      alike), so a child re-declaring the parent's exact virtue set adds no rank
      information while doubling the review surface — and a serves edge is a
      ranking act deserving weight-level care. A child authors serves only for a
      virtue claim beyond its parent's. The seven duplicate sets existing at
      2026-07-09 are stripped by tactic-graph-self-consistency-sweep Unit 4.
      Recorded 2026-07-09 interview.
  - question: What does a strategy node's markdown body carry?
    answer: Settled design and mechanism notes — the fold-target when clarification
      chains outgrow the dialectic record (superseded entries fold; settled
      mechanism moves here or down to tactics/package docs), per kind-kind's
      body-function rule. Recorded 2026-07-09 interview.
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
attributes:
  goal_layer: true
  fields:
    - "conditions: list of world-premises that make this strategy apt; each is a
      standing review trigger"
    - "attention: valid on this kind (goal_layer: true) — a TOP-LEVEL field, not
      an attributes entry; canonical definition on kind-kind's field list"
    - "traditions: ids of tradition records (kind-tradition) that inform this
      strategy — set only where a philosophical choice is load-bearing for the
      strategy, not as decoration; the alignment detail lives on the tradition
      record"
  edges:
    - "recovers: ids of the delegation records this strategy's work unwinds
      (top-level field, resolved by validateGraph)"
  status_vocabulary:
    raw: not yet dialectically examined
    refining: under active dialectic
    codified: the author has personally settled this strategy against present conditions
---
# Strategy — the highest goals a virtue generates against present conditions

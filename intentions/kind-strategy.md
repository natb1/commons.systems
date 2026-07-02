---
id: kind-strategy
kind: kind
statement: Strategy — the highest goals a virtue generates against present conditions
owner: human
status: codified
parent: null
serves: []
rationale: >-
  A strategy is the first goal layer: what a virtue produces when pointed at
  the actual situation. The `serves` edge from a strategy to its virtues is
  the graph's one phase change — disposition becomes state. Below this edge,
  ordinary means-end logic applies: strategies are checkable in principle,
  children complete and roll up, `parent` links strategies into sub-strategies
  where useful.


  A strategy is conditional where a virtue is not. `attributes.conditions`
  names the premises about the world that make the strategy apt; when a
  condition fails, re-derive the strategy from its virtues rather than
  defending it. This is what distinguishes a strategy that expired from a
  virtue that eroded. Example: agentic construction is a strategy with
  conditions, not a virtue — pivotal only while it remains the highest-impact
  path to recovering software autonomy and while its recovery substrate
  (open-weight models, local inference) stays viable.


  `success_signal` on a strategy names the observable that would show the
  strategy working; `reading` and `gap` are sensor-populated against it.


  `recovers` is the strategy→delegation edge: the ids of the delegation
  records this strategy's work unwinds, resolved by `validateGraph` like any
  other edge. A DOMAIN STRATEGY is a strategy that recovers one domain of
  delegated life (attention, finance, publishing); it names its artifacts —
  the apps that do the recovering — in prose in `rationale`. Apps are not
  nodes: the strategy is the intention, the app is its current
  materialization, and naming it in prose keeps the graph stable while the
  artifacts iterate.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  fields:
    - "conditions: list of world-premises that make this strategy apt; each is a standing review trigger"
  edges:
    - "recovers: ids of the delegation records this strategy's work unwinds (top-level field, resolved by validateGraph)"
---
# Strategy — the highest goals a virtue generates against present conditions

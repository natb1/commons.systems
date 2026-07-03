---
id: kind-kind
kind: kind
statement: A kind defines the semantics of a class of nodes
owner: human
status: codified
parent: null
serves: []
rationale: >-
  Every file in this directory is one node: YAML frontmatter plus a cosmetic
  markdown body. A node's `kind` names the kind node (`kind-<kind>`) that
  defines its semantics — which `attributes` it carries, which edges it may
  have, and how progress works for it. This node describes itself (`kind:
  kind`); the regress is finite.


  The graph is self-describing: read this node, then the kind nodes, then
  everything else. The set of valid kinds is the set of committed kind nodes,
  not an enum in code — `validateGraph` (packages/intentionsutil) enforces
  that every referenced kind node exists and that every `parent` and `serves`
  edge resolves.


  Layering, root to leaf: VIRTUES at the roots — dispositions, never complete,
  several roots form a forest (kind-virtue). STRATEGIES below them — the
  highest goals a virtue generates against present conditions; the one phase
  change in the graph (disposition to state) happens at this edge
  (kind-strategy). TACTICS at the leaves — completable units of execution
  (kind-tactic). DELEGATIONS are not goals: they are attachment records, the
  surface where capture is detected and recovery kept real (kind-delegation).


  Three edge fields carry the graph. `parent` is the within-layer edge:
  constitutive between virtues, means-end between goals. `serves` is the
  cross-layer edge: a strategy serves the virtues it expresses; a tactic
  serves the strategies it advances; a delegation serves the nodes that
  depend on it. `recovers` points a strategy at the delegation records its
  work unwinds (kind-strategy).
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  fields_defined_for_all_nodes:
    - "id: unique node identifier; also the filename"
    - "kind: names the kind-<kind> node defining this node's semantics"
    - "statement: the intention itself, one sentence"
    - "owner: human | ai | procedure — who is accountable"
    - "status: raw | refining | delegated | codified — lifecycle stage"
    - "parent: within-layer edge; null for a root"
    - "serves: cross-layer edge — ids of the nodes this node expresses"
    - "recovers: strategy→delegation edge — ids of the delegation records this node's work unwinds"
    - "rationale: why this node exists"
    - "attention: authored boost XOR override, plus required rationale; valid only on nodes whose kind sets goal_layer: true; resolved rank is derived on read and never stored"
    - "attributes: kind-specific fields, defined by the kind node"
  entry_point: this node is the entry point of the graph
---
# A kind defines the semantics of a class of nodes

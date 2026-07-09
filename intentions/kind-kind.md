---
id: kind-kind
kind: kind
statement: A kind defines the semantics of a class of nodes
owner: human
status: codified
parent: null
rationale: >-
  Every file in this directory is one node: YAML frontmatter plus a markdown
  body whose function each kind declares (see the body-function clarification).
  A node's `kind` names the kind node (`kind-<kind>`) that defines its semantics
  — which `attributes` it carries, which edges it may have, and how progress
  works for it. This node describes itself (`kind: kind`); the regress is
  finite.


  The graph is self-describing: read this node, then the kind nodes, then
  everything else. The set of valid kinds is the set of committed kind nodes,
  not an enum in code — `validateGraph` (packages/intentionsutil) enforces that
  every referenced kind node exists and that every `parent` and `serves` edge
  resolves.


  Layering, root to leaf: VIRTUES at the roots — dispositions, never complete,
  several roots form a forest (kind-virtue). STRATEGIES below them — the highest
  goals a virtue generates against present conditions; the one phase change in
  the graph (disposition to state) happens at this edge (kind-strategy). TACTICS
  at the bottom — transient, completable units of execution that may form
  subtrees rooted at an epic (kind-tactic). DELEGATIONS are not goals: they are
  attachment records, the surface where capture is detected and recovery kept
  real (kind-delegation). Lifecycle differs by layer: virtues are permanent,
  strategies are persistent (they end only by condition-expiry or deliberate
  retirement), tactics are transient (removed from the graph on completion).


  Five edge fields carry the graph. `parent` is the within-layer edge:
  constitutive between virtues, means-end between goals. `serves` is the
  cross-layer edge: a strategy serves the virtues it expresses; a tactic serves
  the strategies it advances; a delegation serves the nodes that depend on it.
  `recovers` points a strategy at the delegation records its work unwinds
  (kind-strategy). `blocked_by` gates tactic ordering — no tactic in a blocked
  subtree begins until the blocking tactics complete — and `validates` marks the
  tactics that validate a strategy's signal; both are tactic-layer edges
  resolved by validateGraph like the rest.
reading: null
gap: null
serves: []
recovers: []
clarifications:
  - question: What is the markdown body below the frontmatter?
    answer: "The kind-defined prose surface: each kind node declares its body's
      function — kind → normative schema detail; tactic → the execution plan;
      strategy → settled design and mechanism notes; virtue → the extended
      articulation of the disposition; tradition → reading notes; delegation →
      the audit narrative. The body is authoritative for its declared function
      and never a shadow copy of frontmatter. Supersedes the 'cosmetic render of
      statement' doctrine, which was already false for tactics — their bodies
      carry the clean-session plans dispatch executes. Recorded 2026-07-09
      interview (strategy-graph-self-description)."
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
  fields_defined_for_all_nodes:
    - "id: unique node identifier; also the filename"
    - "kind: names the kind-<kind> node defining this node's semantics"
    - "statement: the intention itself, one sentence"
    - "owner: human | ai | procedure — who is accountable"
    - "status: lifecycle/provenance stage — vocabulary and meanings declared per
      kind (greenfield: tactic-status-kind-vocabularies; interim central enum
      raw | refining | delegated | codified)"
    - "parent: within-layer edge; null for a root"
    - "serves: cross-layer edge — ids of the nodes this node expresses"
    - "recovers: strategy→delegation edge — ids of the delegation records this
      node's work unwinds"
    - "rationale: why this node exists"
    - "reading: the current measured value of the success_signal observable;
      sensor-populated"
    - "gap: the shortfall between reading and threshold — mechanically derived
      by deriveGap (greenfield: derived on read and never stored —
      tactic-gap-derive-on-read)"
    - "clarifications: dated Q&A pairs resolved during the dialectic"
    - "tooling_goals: actuator/sensor tooling the node aims to produce"
    - "success_signal: observable, sensor, threshold, is_proxy — the measurable
      sign the intention is met"
    - "attention: authored boost XOR override, plus required rationale; valid
      only on nodes whose kind sets goal_layer: true; resolved rank is derived
      on read and never stored"
    - "phase: tactic-only — persisted dispatch phase the router transitions"
    - "execution: tactic-only — dispatch execution state (pr, attempts)"
    - "validates: tactic-only edge — the strategies whose signal this tactic
      validates"
    - "blocked_by: tactic-only edge — tactics that must complete first
      (cycle-checked)"
    - "office_hours: goal-layer park — reason, since, recommendation; the router
      skips parked subtrees"
    - "pace_exempt: goal-layer — admits one gate-exempt worker past a
      paced-to-zero budget; never changes ordering"
    - "rounds: strategy-only — /align-tactics round accounting (count,
      last_completed)"
    - "attributes: kind-specific fields, defined by the kind node — the kind
      nodes own the which-kinds-carry-which-fields statement"
  entry_point: this node is the entry point of the graph
---
# A kind defines the semantics of a class of nodes

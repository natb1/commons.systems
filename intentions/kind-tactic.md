---
id: kind-tactic
kind: kind
statement: Tactic — a completable unit of execution
owner: human
status: codified
parent: null
rationale: >-
  Tactics are the bottom layer: concrete, completable work. A tactic is not
  always a leaf — it may be a subtree. An epic is a tactic whose children are
  tactics, linked by `parent` edges. Tactics are also the delegable layer —
  delegating a tactic is expected and beneficial (it buys attention at the
  strategic level), and doing so creates or extends a delegation record
  (kind-delegation) where the attachment is assessed.


  Transience. A tactic is transient: when it completes it is removed from the
  graph, and its edges go with it. Completion is marked by the author or by the
  dispatch workflow directly in the graph.


  Authority. The graph is the sole store: every tactic is authored here, and no
  external system feeds or mirrors tactic state. (Integration with an external
  tracking system such as GitHub is a separate strategy; design TBD.)


  Edges. `parent` links a tactic to a larger tactic. `serves` links a tactic to
  the strategies it advances; populating `serves` is dialectic work.


  Authoring test. If fully achieving it would make you delete the node, it is a
  tactic; if achieving everything currently under it leaves a standing,
  condition-monitored posture, it is a strategy.
reading: null
gap: null
serves: []
recovers: []
clarifications:
  - question: A tactic is pruned on completion — where does doctrine it settled live?
    answer: "In the persistent layer, before the prune: settled doctrine, standing
      rules, and design decisions land on the strategy or kind node they belong
      to as part of completing the tactic — persistent intentions and beliefs
      belong in persistent layers by definition. Citing a pruned tactic id
      afterwards is legitimate (git history recovers it), but a citation is
      provenance, never the doctrine's home. Recorded 2026-07-09 interview."
  - question: What does a tactic node's markdown body carry?
    answer: The execution plan — clean-session-executable and authoritative
      (writeNode preserves tactic bodies verbatim across frontmatter rewrites),
      per kind-kind's body-function rule. Recorded 2026-07-09 interview.
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
    - "attention: valid on this kind (goal_layer: true) — a TOP-LEVEL field, not
      an attributes entry; canonical definition on kind-kind's field list"
  status_vocabulary:
    raw: not yet dialectically examined
    refining: under active dialectic
    delegated: Claude-authored on trust; the decisions remain the author's
    codified: the plan is written and the tactic is ready to dispatch — the author
      has settled its execution plan
---
# Tactic — a completable unit of execution

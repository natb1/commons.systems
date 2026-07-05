---
id: kind-virtue
kind: kind
statement: Virtue — a disposition held and exercised, never completed
owner: human
status: codified
parent: null
serves: []
rationale: >-
  The roots of the graph are the virtues actually held (`parent: null`); there
  may be several — the root layer is a forest, not a single apex. A virtue is
  a disposition: it has no completion state, and it is exercised through its
  constituent virtues, not worked on directly.


  Edges. A virtue's `parent` edge is CONSTITUTIVE, not means-end: the child is
  a component the parent consists in, not a step toward it. Constitutive edges
  are non-monotonic — advancing one child is not automatically progress on the
  parent. Sibling virtues under one parent are held in tension
  (`attributes.tension_with`): they are balanced, not summed, and maximizing
  one against its partner is failure, not progress. Whatever consumes this
  graph must never total virtue children into a parent completion score.
  Virtues never carry attention injections and are never conduits for rank flow.


  A virtue applied to present conditions generates strategies (kind-strategy);
  that edge — `serves`, pointing back at the virtue — is where disposition
  becomes state, the graph's one phase change.


  Virtues are the layer that must never be imported unexamined: every
  delegation grafts the delegatee's virtues onto this graph as constraints
  (kind-delegation). The virtue/goal test, for deciding where the virtue layer
  stops: a virtue is a disposition you always hold but can never complete; a
  goal is a state you can reach and check off.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  fields:
    - "tension_with: sibling virtue id this one is balanced against"
    - "governs: which delegation axis this virtue governs (divergence | irreversibility), when it governs one"
    - "delegable: never — set on the non-delegable core; see virtue-philosophical-mobility"
    - "kinship: a sibling root this virtue shares a common commitment with, where neither derives from the other"
    - "calibration: how the virtue's own judgment is checked from outside itself"
---
# Virtue — a disposition held and exercised, never completed

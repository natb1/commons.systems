---
question: What does a node refine?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - under
  - rank
  - ceiling
  - context
---
## Answer

The question or questions named in its `under` field. This is the only hierarchical edge, and it means three things at once. Attention flows along it: a node's rank is its share of its parents' rank, split among siblings, so that the graph's shape is also its priority. Context loads along it: a session working on a node reads its ancestry. Authority is capped by it: a node's ceiling is its nearest ratified ancestor, and nothing the AI records under that ancestor may contradict it. A node may refine more than one question; then it draws rank and context from each. Roots have no `under`; a global-tier node has one like any other, tier only says the rule binds everywhere.

## Rationale

Ask "why does this question exist?"; the answer names its parent. Never choose a parent to change priority; that is what boost is for, and boost is the author's alone. Rejected: separate edges for attention, context, and containment, each of which turned out to be a reading of the same fact; a second reference kind for cousins, which differs from `under` by exactly one bit, motivation, and is kept as `cites`.

---
question: What does a node refine?
stage: maieutic
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
## Disposition

The author, 2026-09-03:
> "Rationale" states that the node rationale stems from the node this node is under. Evaluate: would that always be the case? The disposition for the under edge seems to state this "Ask "why does this question exist?"; the answer names its parent." If so, does it make sense to make the "rationale" the prose property of the under edge?

The author, 2026-09-03:
> "Tier" (as in global-tier) needs a disposition. As a disposition references in the projected documentation must be hyperlinked. Is "tier" even the right primitive? Even cross-cutting non-functional concerns have scope. A static typing convention doesn't apply to the purpose node. Evaluate adversarially and from greenfield perspective whether cross-cutting non-functional concern could be reduced to topology and/or citations.

The author, 2026-09-03:
> The under edge disposition lists "rejected" as prose under "rationale" - it may make sense to record rejected dispositions, but this seems too ad-hoc.

## Answer

The question or questions named in its `under` field. This is the only hierarchical edge, and it means three things at once. Attention flows along it: a node's rank is its share of its parents' rank, split among siblings, so that the graph's shape is also its priority. Context loads along it: a session working on a node reads its ancestry. Authority is capped by it: a node's ceiling is its nearest ratified ancestor, and nothing the AI records under that ancestor may contradict it. A node may refine more than one question; then it draws rank and context from each. Roots have no `under`; a global-tier node has one like any other, tier only says the rule binds everywhere.

## Rationale

Ask "why does this question exist?"; the answer names its parent. Never choose a parent to change priority; that is what boost is for, and boost is the author's alone. Rejected: separate edges for attention, context, and containment, each of which turned out to be a reading of the same fact; a second reference kind for cousins, which differs from `under` by exactly one bit, motivation, and is kept as `cites`.


## Proposal

### Sitting on purpose, 2026-09-03

**The under node, whole; rationale, tier, and rejected alternatives**

Depends on q14, q15, and q16. The guidance to find a parent by asking why the question exists stays. The sentence on tier goes if q15 prunes it, replaced by the rule that a rule binds the subtrees of the nodes that cite it. The rejected alternatives become the structured list if q16 adopts it. The answer otherwise stands.

Facts: authority ratified; boldness moderate; persistence standing.

Depends on: `rationale-edge`, `tier`, `rejected`

Drafted after q14, q15, and q16 are ruled; the current text is shown below.

Proposed: pending.

Rulings open: ratify as shown; ratify with edits; defer; overrule.
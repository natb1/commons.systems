---
question: How is intent recorded here?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: e0c2b97382c629a532bf40f75dd73f51cae992c9
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
boost: 8
under:
  - commons.systems/disposition-graph/purpose
defines:
  - disposition
  - disposition graph
  - node
---
## Disposition

The author, 2026-09-02:
> The next direction for onboarding (the next ranking refinement under the purpose node) should be some disposition that introduces the basics of the intention graph primitives. Enough to understand how to interact with the `/align` skill - authority, rank, tradition, etc. "How is intent recorded here" jumps too quickly into reference shaped material. Projecting "cites" relationships will aid onboarding navigation. Consider how an onboarding person will navigate from purpose, to graph concepts, to `/align` usage.

## Answer

As a disposition graph. A disposition is one standing answer to one question, held by the author or by the AI under the author's rules; a node is the file that records it. Nodes refine one another through a single edge, `under`. Each node carries who holds its answer and with what authority, what the answer rests on, and how one would know it still holds. Rank, the context a session loads, the work queue, and the author's review queue are computed from those facts and never stored. The history of every answer lives in version control.

## Rationale

The refinements of this node define each part of the record: the node, the edge, authority, growth, projection, persistence, naming, attention, instruments, readings, the work loop, materialized implementation, and the standing of the legacy record. Each is ratified in onboarding order.


## Draft

```markdown
---
question: How is intent recorded here?
form: rule
authority:
  class: deferred
  by: claude
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/purpose
defines:
  - disposition
  - disposition graph
  - node
---
## Answer

As a disposition graph, which you read from the purpose node down and change only through a sitting. A disposition is one standing answer to one question, written as a node, and each node says who holds its answer: ratified when the author ruled on it in a sitting and wants to be asked before it changes, delegated when the author handed that class of decision to the AI, deferred when the AI answered within the author's rules and owes a review. Nodes refine one another through one edge, under, and rank follows it: a node's share of attention is its parent's share divided among siblings and weighted by boost, which only the author sets, so the order you meet nodes in is also the order work goes in. A node's answer is grounded by readings, each a reference to a tradition with a relation of adopted, diverged, or chosen over, and guarded by criteria, each a check, an assessment, or an assumption, so that the record can say whether an answer still holds. To change any of this you run the alignment skill on a node or on a disposition in your own words; it turns you back to what the record already says before it draws out what you intend, and it ends in your ruling. Everything else, the review queue, the work queue, and the context a session loads, is computed from these facts and never stored; the history of every answer lives in version control.

## Rationale

This node is the second stop of the onboarding walk, after purpose, and it is written for a reader who needs to use the skill, not for one looking up the schema. Its refinements define each part of the record: the node, the edge, authority, growth, projection, persistence, naming, attention, criteria, readings, the work loop, materialized implementation, transience, and the standing of the legacy record; growth is first among them because the sitting is the first thing a newcomer does. Rejected: a separate primer node between purpose and this one, because it would answer no question this node does not.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The model node, rewritten as the second stop of the walk**

The answer is rewritten for a reader arriving from purpose who needs to use the skill: disposition, authority, rank, readings and traditions, criteria, and the sitting, in that order; the list of refinements moves to the rationale; growth is boosted first among the children, which is the author's boost to record on the growth node.

Facts: authority deferred; the boost ratified; boldness moderate; persistence standing.

Rejected:
- A new primer node between purpose and model. — Open as q6; it would answer no question this node does not.

Depends on: `second-stop`, `forms`

Proposed text: the draft section of this node.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft rationale: 'growth is first among them because the sitting is the first thing a newcomer does.' The record has projection at boost 5 and growth at 4, so projection is first among model's children. Attention's rationale records that order deliberately as the transcription of the author's own reconciliation order, and work-loop's rationale says 'a walk that meets projection before growth costs onboarding nothing'. Suggested edit: drop the sentence, or state growth's new boost value and what becomes of projection's 5.
- Draft Answer: 'weighted by boost, which only the author sets.' Attention's rationale says the boosts of 2026-09-03 have 'values the AI chose and the author has not ratified'. The sentence a newcomer reads first about rank is therefore false of the current record. Suggested edit: 'which only the author ratifies', and land the boost ratification with it.
- Draft Answer names 'criteria, each a check, an assessment, or an assumption', which presumes the instruments ruling; 'Depends on' lists second-stop and forms only.
- Draft frontmatter keeps 'class: deferred' with 'date: <the date of the ruling>'. A deferred stamp records the date the AI decided, not the date of a ruling. Suggested edit: keep 2026-09-03.

On the three facts: 'Authority deferred on the draft, the boost ratified' is the right shape, but the boost cannot be presented as a low-risk fact: it contradicts the boosts already in the record. See second-stop.

Strongest counter-argument (weak): The rewrite is a good answer to the author's complaint that the node 'jumps too quickly into reference shaped material', but it is bundled with a boost the record already decided the other way. Ratifying the draft as it reads endorses 'growth is first among them' while the graph ranks projection first, and neither attention nor work-loop, where that order is argued, is in this batch to be corrected.

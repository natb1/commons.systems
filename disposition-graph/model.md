---
question: How is intent recorded here?
stage: review
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
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

As a disposition graph, which you read from the purpose node down and change only through a sitting. A disposition is one standing answer to one question, written as a node, and each node says who holds its answer: ratified when the author ruled on it in a sitting and wants to be asked before it changes, delegated when the author handed that class of decision to the AI, deferred when the AI answered within the author's rules and owes a review. Nodes refine one another through one edge, under, and rank follows it: a node's share of attention is its parent's share divided among siblings and weighted by boost, which only the author ratifies, so the order you meet nodes in is also the order work goes in. A node's answer is grounded by readings, each a reference to a tradition with a relation of adopted, diverged, or chosen over, and guarded by criteria, each a check, an assessment, or an assumption, so that the record can say whether an answer still holds. To change any of this you run the alignment skill on a node or on a disposition in your own words; it turns you back to what the record already says before it draws out what you intend, and it ends in your ruling. Everything else, the review queue, the work queue, and the context a session loads, is computed from these facts and never stored; the history of every answer lives in version control.

## Rationale

This node is the second stop of the onboarding walk, after purpose, and it is written for a reader who needs to use the skill, not for one looking up the schema. Its refinements define each part of the record: the node, the edge, authority, growth, projection, persistence, naming, attention, criteria, readings, the work loop, materialized implementation, transience, and the standing of the legacy record. Rejected: a separate primer node between purpose and this one, because it would answer no question this node does not.
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

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft rationale: 'growth is first among them because the sitting is the first thing a newcomer does.' The record has projection at boost 5 and growth at 4, so projection is first among model's children. Attention's rationale records that order deliberately as the transcription of the author's own reconciliation order, and work-loop's rationale says 'a walk that meets projection before growth costs onboarding nothing'. Suggested edit: drop the sentence, or state growth's new boost value and what becomes of projection's 5.
- Draft Answer: 'weighted by boost, which only the author sets.' Attention's rationale says the boosts of 2026-09-03 have 'values the AI chose and the author has not ratified'. The sentence a newcomer reads first about rank is therefore false of the current record. Suggested edit: 'which only the author ratifies', and land the boost ratification with it.
- Draft Answer names 'criteria, each a check, an assessment, or an assumption', which presumes the instruments ruling; 'Depends on' lists second-stop and forms only.
- Draft frontmatter keeps 'class: deferred' with 'date: <the date of the ruling>'. A deferred stamp records the date the AI decided, not the date of a ruling. Suggested edit: keep 2026-09-03.

On the three facts: 'Authority deferred on the draft, the boost ratified' is the right shape, but the boost cannot be presented as a low-risk fact: it contradicts the boosts already in the record. See second-stop.

Strongest counter-argument (weak): The rewrite is a good answer to the author's complaint that the node 'jumps too quickly into reference shaped material', but it is bundled with a boost the record already decided the other way. Ratifying the draft as it reads endorses 'growth is first among them' while the graph ranks projection first, and neither attention nor work-loop, where that order is argued, is in this batch to be corrected.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Rationale still reads 'growth is first among them because the sitting is the first thing a newcomer does', while the record has projection at boost 5 and growth at 4, and second-stop's session reply in this batch withdrew exactly that half of the recommendation ('projection stays first among model's children and the boost half of the recommendation is withdrawn'). The two nodes now disagree inside one batch. Suggested edit: strike the sentence from the draft.
- Draft Answer: 'weighted by boost, which only the author sets.' Attention's rationale records that the boosts of 2026-09-03 have 'values the AI chose and the author has not ratified', and attention's amended answer now says 'every boost in the record today is the AI's and unratified'. The first sentence a newcomer reads about rank is false of the record. Suggested edit: 'which only the author ratifies'.
- Draft Answer names 'criteria, each a check, an assessment, or an assumption', a vocabulary no node's defines carries today (instruments defines instrument, check, assessment, re-grasp, evidence; only instruments' draft defines criterion). 'Depends on' lists second-stop and forms, not instruments.
- Draft frontmatter keeps 'class: deferred' with 'date: <the date of the ruling>'. A deferred stamp records the date the AI decided. Unchanged since the previous review.

On the three facts: The frontmatter recommendation (ratified, moderate) is right in shape. The prose Facts line 'authority deferred; the boost ratified; boldness moderate' is stale: the boost half was withdrawn on second-stop the same day, so there is no boost to ratify, and the line should say so.

Strongest counter-argument (moderate): The rewrite is a good answer to the author's complaint that the node 'jumps too quickly into reference shaped material', but it is the second stop of the walk and it teaches a vocabulary the record has not settled: criteria, whose defining node is at ruling with a withdrawn sentence; rank, whose defining node (under) is at the maieutic stage with 'Proposed: pending'; readings, whose tradition mount depends on an unruled traditions-home. A newcomer's second page cannot be stable while every term on it is still being decided, so the case for ruling model late rather than early is stronger than its rank suggests.

The session's reply: Validated against second-stop and attention. Amended tonight: the draft rationale's clause putting growth first is struck, since second-stop withdrew the boost and projection ranks first; 'which only the author sets' becomes 'which only the author ratifies', as attention says every boost today is the AI's. The criteria vocabulary arrives with instruments, which the draft presumes and the ruling order puts first; the draft's deferred stamp with a placeholder date is what the recording replaces with the author's stamp. On the counter-argument, that the second stop teaches unsettled vocabulary: the ruling order rules instruments, under, and traditions-home before model, and the page shows that order. Stage review: the draft changed.

### Frontier finding, 2026-09-03

Kind: contradiction.

Model's draft rationale: 'growth is first among them because the sitting is the first thing a newcomer does.' Second-stop's amendment withdrew exactly that: 'projection stays first among model's children and the boost half of the recommendation is withdrawn'. Attention's rationale records projection at 5 and growth at 4 as the transcription of the author's own reconciliation order, and the frontier confirms those boosts. Model's draft would be ratified saying the opposite of what two other nodes and the record's ranks say.

Also named: commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/attention.

Proposed: Second-stop and attention are the survivors. Model's draft strikes the sentence; if the model node wants to say where a newcomer acts first, it says that alignment is where the newcomer acts first without asserting a rank, which is what second-stop's amended option already permits.

### Frontier finding, 2026-09-03

Kind: redundancy.

Three option-nodes decide clauses that a sibling's draft already contains. Hexis asks whether the hexis claim comes first, and purpose's draft already reads 'a projection of its author's hexis, which is what a knowledge store would hold'. Purpose-criteria asks whether purpose carries criteria, and purpose's draft already carries them. Second-stop asks whether the model node is rewritten, and model's draft is that rewrite. If the author confirms the parent draft as shown, the option-node is decided by that act; if they then rule the option the other way, the parent's draft must be reopened, and the alignment page offers both on one screen with no ordering shown.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/purpose-criteria, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose.

Proposed: Keep the option-nodes as the survivors of their questions, since each is a real decision the author should make separately, and add one line to each saying it is a sub-ruling of the named parent's draft and must be ruled first. Correspondingly, each parent's Proposal names the option-nodes its draft presumes. Alternatively fold each option into its parent's Proposal as an explicit alternative, which is what rejected's option 1 would make structural — but that decision is itself unruled.

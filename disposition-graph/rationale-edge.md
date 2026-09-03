---
question: Is the rationale the prose of the under edge?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
under:
  - commons.systems/disposition-graph/under
---

## Disposition

The author, 2026-09-03:
> 'Rationale' states that the node rationale stems from the node this node is under. Evaluate: would that always be the case? The disposition for the under edge seems to state this 'Ask "why does this question exist?"; the answer names its parent.' If so, does it make sense to make the 'rationale' the prose property of the under edge?

## Proposal

### Sitting on purpose, 2026-09-03

**Rationale and the under edge**

The purpose node's rationale opens with why the question exists under its parent, and the under node says a parent is found by asking why the question exists. Two justifications are being run together. Why this question exists is the refinement, which the edge records and which is usually evident from the two questions side by side. Why this answer stands is the backing: it cites readings, evidence, and the parent, and weighs the alternatives, and it is the node's own. It does not always stem from the parent: the node node's rationale is about decidability of scope, the persistence node's about concurrency, neither about model. In Toulmin's layout the warrant of an inference and the backing of a claim are distinct; in IBIS the relation carries the link's meaning without prose; in goal-oriented requirements a refinement link carries a pattern, not text. A node with two parents would need two edge rationales but has one answer.

Options:
- (recommended) Keep the rationale as the node's own, why this answer stands; the under edge carries no prose, and where a refinement is not evident from the two questions the rationale's first sentence says so — authority ratified; boldness moderate; persistence standing
- Give each under entry a because clause and reserve the rationale for the answer — authority ratified; boldness moderate; persistence standing; a schema change
- Move the whole rationale onto the edge — authority ratified; boldness high; persistence standing; a schema change

Feeds: `under`, `node`, `purpose`

Rulings open: take the recommended option; take another option by number; defer; answer in prose.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The recommended option's second clause, 'where a refinement is not evident from the two questions the rationale's first sentence says so', is a convention with no criterion and nothing to check it. Suggested edit: drop the clause, or make it a validator rule so it can fail.
- Feeds names under, whose Proposal says 'Drafted after q14, q15, and q16 are ruled' and 'Proposed: pending'. The author is ruling three schema questions whose combined effect on the under node's text they will not see until afterwards, which sits against the author's own request to 'show me the edit to the disposition and approve the disposition as a whole'. Suggested edit: forward the three with a draft of under showing all three outcomes for the recommended options.

On the three facts: Ratified, moderate boldness, standing is right; the recommended option is not a schema change while options 2 and 3 are, which the facts correctly distinguish.

Strongest counter-argument (weak): Option 2, a because clause on each under entry, is cheap and would put the refinement in structure exactly where the two questions do not show it, which is the case the recommended option leaves to a convention. Toulmin separates warrant from backing, but a warrant is still written down; the recommendation writes it down only sometimes and only in prose, so the projector cannot show why a node hangs where it does. Against that, a because clause on every edge is a field that will be filled with restatements of the two questions in the common case, which is the drift the record avoids elsewhere. Worth one line.

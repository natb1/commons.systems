---
question: What orders the unanswered frontier for alignment?
stage: review
recommendation:
  adopts: draft
  class: ratified
  boldness: moderate
  amends: "4fa0c9e7b71f62087b2953d6a5ba212e3cc3368a"
  at: "5e87aa8d717dc0e3bccd15b0bc078a558db128dd"
alternatives:
  - name: draft
    source: ai
    ref: "2026-09-03"
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
---
## Disposition

The author, 2026-09-03:
> help me evaluate greenfield - `/align` has unanswered disposition stating that alignment is prioritized by rank (when `/align` is called without a parameter it chooses an unanswered disposition by rank, the alignment artifact is sorted by rank). Is this the best signal for alignment priority. The unanswered alignment frontier (currently the whole graph) has different properties from the reconciliation frontier. eg. it has no authority to attenuate reconciliation. Is rank order, greedy alignment the best choice, or is there a better heuristic for untangling the alignment frontier given the potential for unresolved conflicts between unanswered nodes?

The author, 2026-09-03, refining:
> Or, is there better unanswered alignment state that would help with prioritization of alignment?

The author, 2026-09-03, answering the periagogic probe on attention's second reading of rank, "frontier attention, where work goes first":
> It originally referred to the reconciliation frontier, but that predated the alignment frontier. attention "for where work goes first" refers to the reconciliation process (shimmed as a skill, but codified before bootstrap exit).

The author, 2026-09-03, answering the periagogic probe on alignment-target's answer, whether rank ordering alignment was a decision or the only order to hand:
> Yes, all of these statements are being reconsidered on the basis of new thinking about how the alignment frontier has different properties than the reconciliation frontier. In particular the alignment frontier has no confirmed authority, so all mutations of the alignment frontier potentially supercede or modify all other nodes on the alignment frontier. A greedy rank based approach isn't necessarily optimal for "untangling" the alignment frontier.
>
> rank was the "only order the record had to hand". `/align` with nothing chooses the top priority node using priority order TBD that best addresses the "untangling" problem (what's a better way to describe this problem?)

The author, 2026-09-03, answering the periagogic probe on whether `depends` as dialogue defines it names the relation they mean:
> Does "settling" the ground imply that ruling order is just "under" edge topological order?
>
> periagogic response: I'm not sure. Examples would include recording an unanswered disposition then before it's confirmed forgetting the original idea and recording the opposite idea, or recording the same idea again. If the first idea had confirmed authority the latter idea could be mechanically rejected or recorded as an alternative. Without the authority these must be "untangled".

The author, 2026-09-03, on the first maieutic draft and the fork of three options:
> The draft describes the simple case of untangling - but the frontier is itself a graph, and conflicts can occur on adjacent nodes that can be merged, or entire subtrees can diverge (and are not as easily merged). Does this change the recommendation?
>
> I don't fuly understand the difference betwen 1 and 2. We don't need additional disposition for #3 - I can already order manually with `/align <node_id>`

The author, 2026-09-03, on the probe whether an ancestor ruling suffices for a divergent subtree or the divergence should be named:
> What is the downside for naming the divergence? It seems like better context during ruling is better.

The author, 2026-09-03, choosing between naming a divergence on the leaves and deriving it at the ancestor (1) and naming it on the ancestor with a new field (2):
> 1

The author, 2026-09-03, on the whole draft and the three steers (survivor rule, name, rank on this frontier), taking the first of each: earlier-recorded stands; the problem is settling and the order is the ruling order; rank breaks ties only:
> go

## Alternatives

### draft

The recommended text answers the question with the ruling order in place of rank: tangles between unanswered nodes recorded as alternatives on the earlier-recorded survivor, divergences between subtrees recorded on the leaves in `depends` and derived at the ancestor, a ruling settling every node it makes mechanically decidable, and the order putting first the node whose ruling settles the most, rank breaking ties. The node as it stands has no answer, so there is no standing text to adopt.

## Recommendation

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
authority:
  class: deferred
  by: claude
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The ruling order, derived from the tangle the record carries, and not rank. The alignment frontier is a set of nodes none of which has authority over another, so a recording on it may contradict, duplicate, or diverge from any other and nothing can reject it; the order's work is to untangle it, by asking for the rulings that settle the most first. A tangle is recorded, never computed in a session. A lateral tangle between unanswered nodes, the same idea twice, its opposite, or adjacent nodes that would merge, is recorded as an alternative on the earlier-recorded node, which stands by that rule alone, with the later one as the alternative carrying its source and date. A divergence between subtrees is recorded on the leaves: each node the review finds to stand under one side names, in `depends`, the ancestor and the alternative on it that it stands under; the page inverts that at the ancestor, showing beside each alternative the nodes a ruling for it keeps and the nodes it discards, which then liquidate by the standing rules, each a proposal against its ratified ancestor and its implementation unsupported. A ruling settles a node when it makes that node mechanically decidable: every unanswered node under the ruled node, every alternative the ruling closes, and every node naming it in `depends`. The ruling order puts first the node whose ruling settles the most; ancestors come before descendants by that count and not by hand; rank breaks ties and orders nothing else on this frontier. `/align` with nothing takes the first node of the ruling order; `/align <node id>` is the author's order and needs no boost. Rank remains what the attention node says it is for the reconciliation frontier and the onboarding path.

## Rationale

The author's words of 2026-09-03, quoted in the dialogue that produced this node: attention's second reading of rank, "where work goes first", referred to the reconciliation frontier and predates the alignment frontier; rank was "the only order the record had to hand" when alignment-target was ruled, and every statement applying it to alignment is reconsidered; the alignment frontier "has no confirmed authority, so all mutations of the alignment frontier potentially supercede or modify all other nodes on the alignment frontier", and "a greedy rank based approach isn't necessarily optimal for untangling" it; the examples are recording the opposite of an unconfirmed disposition, or the same one again, which with authority on one side "could be mechanically rejected or recorded as an alternative"; the frontier is a graph, so adjacent nodes may merge and whole subtrees may diverge; and, choosing between naming a divergence on the ancestor and on the leaves, the author chose the leaves, with the divergence derived at the ancestor, then took the survivor rule, the name, and rank as tie-break as recommended. Greedy-by-rank fails on this frontier because rank is importance and the frontier's problem is dependency: an important leaf ruled before its ground is reopened when the ground is ruled. The settling count is dependency-first with importance as the tie-break, and ancestor-first falls out of it, since a ruling's reach by the authority node's scope rule is its whole unanswered subtree; the record's three orphaned devices for the same problem, the heuristics alignment-target rejected on the premise that rank was already the order, the `depends` field dialogue defined and no node carried, and the placement validation frontier-consistency runs and nothing consumed, become one mechanism. The divergence is named on the leaves and not the ancestor because an alternative is a candidate answer to its own node's question and a divergence answers nothing, because an ancestor edited at every review finding is re-reviewed at every round, because the pins would live on what moves, and because the subtree under a node is structure and derived; only the judgment which side a leaf stands under is not derivable, and that is what the leaf records. Rejected: rank as the alignment order, the standing answers of alignment-target and attention's second reading, on the author's words above; computing the order in a session from the review's findings without recording the tangle, which the transience node forbids; the author stating the order, which `/align <node id>` already is; naming the divergence on the ancestor; the review naming the survivor of a lateral tangle, and the node nearer the root standing, in favour of the earlier-recorded node, the rule the queue already applies to the author's words; striking rank from this frontier entirely, with ties broken by date, since the tie-break costs nothing and keeps one scalar for the page to fall back on. Readings owed as nodes under this one: Aristotle, Posterior Analytics I.2, 71b33 to 72a5, prior by nature against prior to us, the ruling order taking what is prior by nature first where rank took what is nearest to us; and the three-way merge, which resolves a divergence relative to the merge base, the lowest common ancestor, and never leaf against leaf. Both support the answer and neither is diverged from. What the answer amends elsewhere is recorded as an alternative of source author on each node: alignment-target's choice by rank, attention's second reading, dialogue's `depends` target, the page order on unanswered and growth, and the consumer of frontier-consistency's placement validation; the projector, the alignment page, and the alignment skill's no-argument usage follow at reconciliation.
```

## Account

An un-aligned disposition, recorded at its sitting's opening on 2026-09-03 and not yet answered. The question it asks is distinct from its parents': alignment-target says what a session given nothing takes up, and attention says how rank is computed and read; this node asks whether rank is the right order for the alignment frontier at all, and if not, what is, and whether the dialogue's state should carry something the order can be derived from.

What the sitting would amend, read before anything is changed:

- `alignment-target`, at the ruling stage: the answer takes the first unanswered node in rank order and rejects choosing by the oldest stage or the fewest movements owed; its clean-context review's strongest counter-argument, twice, is that rank today is the AI's unratified boosts and not the author's attention.
- `attention`, at the review stage: rank's second reading, frontier attention, "where work goes first", which reads alignment and reconciliation as one frontier with one order; its review's counter-argument is that one scalar cannot carry two orders, and the scope node's `order` field is the record's admission.
- `dialogue`, at the review stage: the `depends` part of the dialogue's state, the open questions a ruling waits on, "so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on". No node in the record carries the field, and the projector does not read it; the coverage node carries "Depends on: `audience`" in prose instead.
- `frontier-consistency`, at the review stage: validation 13, placement and order, under which "the review recommends the order in which the author rules"; the review of 2026-09-03 did so once, in its placement finding, recommending quotes after agency, and nothing consumed the recommendation.
- `unanswered`, at the ruling stage, and `growth`, at the maieutic stage: the alignment page lists every unanswered node in rank order, the purpose node first, and the queue of un-aligned dispositions is the set of such nodes in rank order.

The implementation their criteria point to: the frontier projection of `packages/disposition/project.mjs`, one rank order across both graphs; the alignment page's ordering, which groups by graph and then by rank; and the no-argument usage of the alignment skill, hand-materialized from alignment-target.

The periagogic object of this sitting is those five nodes and that implementation. The movement owed is periagogic: the author's account of what the record says rank is, and of what the alignment frontier is for, before the AI's account enters.

### Review owed, 2026-09-03

The clean-context review has not run on this recommendation: the author stopped the sitting before it, at the checkpoint, to prepare for compaction. A session resuming this node invokes `/align-review` on the batch at the review stage, this node among it, and applies its verdict; nothing else is owed before the ruling. The alternatives this draft raises on alignment-target, attention, dialogue, unanswered, growth, and frontier-consistency were recorded in the same landing, each of source author and dated 2026-09-03.

### Maieutic movement closed, 2026-09-03

Drafted over four turns from the author's words above. The three classes of finding: within the graph, alignment-target, attention's second reading, and the page order on unanswered and growth apply rank to alignment and the draft contradicts each, recorded as alternatives of source author on those nodes; between the graph and the AI's knowledge, none the draft does not state; redundant seams, the three orphaned devices named in the rationale, folded into one mechanism, and `depends` needing a target beyond a node id, an alternative on dialogue. Evaluated twice: best judgment, dependency before importance; tradition, the two readings named in the rationale, both supporting. Tested against the record it joins: nothing above it is ratified, so nothing is doctrine, and it contradicts no global-tier node; it amends the projector, the alignment page, and the alignment skill's no-argument usage, which is reconciliation's work after the ruling. Facts: authority ratified, capture-shaped since it decides what the author is asked first; boldness moderate, the problem, the lack of authority, the greedy failure, and the leaf-recording choice being the author's and the survivor rule, the settling count, and rank as tie-break the AI's; persistence standing. Stage review.

### Periagogic movement closed, 2026-09-03

The periagogic movement ran over three probes, on attention's second reading of rank, on alignment-target's answer, and on the relation `depends` names, and closed with the author's account in the record: attention's "where work goes first" is the reconciliation frontier and predates the alignment frontier; rank was the only order the record had to hand when alignment-target was ruled, and every statement applying it to alignment is reconsidered; the alignment frontier has no confirmed authority, so any recording on it may supersede or duplicate any other, which authority's mechanism (a conflicting answer recorded as an alternative on the node it conflicts with) resolves mechanically only where one side has authority; whether `under` order settles that is open. The stage advances to maieutic.

### Probe outstanding, 2026-09-03 (closed above)

The periagogic movement is open on one probe, put to the author and not yet answered, and the sitting stands behind the sitting on dialogue by the author's choice. The probe, on attention's answer alone: it says rank is "one fact with three readings" and names the second as "frontier attention, where work goes first"; as that sentence stands, does it distinguish an alignment frontier from a reconciliation frontier at all, and whose attention does the record say the word names there, the author's, the session's, or the newcomer's. The AI's findings on the record are held back until the author commits to it.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Merge analysis of the author's words: 2026-09-03, own-question: Asks whether rank is the best signal for alignment priority, given that the unanswered alignment frontier has different properties from the reconciliation frontier and no authority to attenuate it, and whether greedy rank order is the right way to untangle a frontier whose unanswered nodes may conflict with each other. 2026-09-03, own-question: Refines the same question: whether there is better unanswered-alignment state that would help prioritise alignment.
The census unit's note: Nothing is pending on this node. It is an un-aligned disposition opened at its sitting, at the periagogic stage with one probe outstanding to the author and the AI's findings deliberately held back until the author commits, so there is no candidate answer to record. Its account names five nodes the sitting would amend — alignment-target, attention, dialogue, frontier-consistency, unanswered and growth — but proposes no change to any of them; that is scoping, not a finding, so I minted no elsewhere entries from it. I checked the redundancy question against both its parents: alignment-target answers what a session given nothing takes up and attention answers how rank is computed, while this node asks whether rank is the right order for the alignment frontier at all, so no fold is proposed.

### Frontier finding, 2026-09-03

Kind: coverage.

Dialogue's answer makes `depends` the seventh part of the dialogue state — 'the ids of unanswered nodes that must be answered before this node can be, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on' — and the validator enforces it ('every `depends` entry must resolve within this graph, must not repeat'). Verified that no node in the graph carries the field: `grep -rl '^depends:' disposition/` returns nothing, while twenty-three node files still carry the `Depends on:` prose convention the field was added to replace, and every batch node in this brief reports 'Depends: none'. Verified further that the projector reads the field nowhere: `depends` appears in project.mjs only in a comment listing the dialogue's own state, so the frontier emits nothing for it. Dialogue's own account says the consequence is disclosed — 'the field is recorded before its instrument exists, which the frontier will show' — and the frontier shows nothing, so the disclosure is itself false. Alignment-order, at the periagogic stage, records the same fact independently: 'No node in the record carries the field, and the projector does not read it; the coverage node carries "Depends on: `audience`" in prose instead.'

Also named: commons.systems/disposition-graph/dialogue.

Proposed: Dialogue is the survivor of what an unanswered node carries and nothing moves; what is owed is that the node say what it in fact has. Either the migration of the twenty-three prose conventions is named as part of what a confirmation orders, with the projector and the alignment page reading the field, or the answer says the field is defined and unused and that the prose conventions stand until the migration is ruled — which is the honest reading of the record today. The claim that the frontier will show the gap should be struck or made true, since it is the only thing standing between this gap and invisibility.

Recorded as a pending alternative on commons.systems/disposition-graph/dialogue: `depends-migration-named` (source review, 2026-09-03).

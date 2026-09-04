---
question: What orders the unanswered frontier for alignment?
stage: maieutic
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

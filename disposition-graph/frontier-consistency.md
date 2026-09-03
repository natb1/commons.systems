---
question: How is the unanswered frontier kept consistent with itself?
stage: review
recommendation:
  class: ratified
  boldness: moderate
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - frontier survey
---
## Disposition

The author, 2026-09-03:
> new disposition (alignment shim): there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way). This implies serialization of the batch operation - but that is low priority, it can be serialized manually for now. This superceded existing unanswered dispositions about the adversarial review skill (case in point). EVERY invocation of the adversarial alignment review skill is a batch operation that evaluates the full unanswered frontier (without isolating any context by disposition).

The author, 2026-09-03, refining:
> refinement to disposition: When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits.

The author, 2026-09-03, on the batch:
> serialize the review skill after completion of any currently running adversarial review skill in this session

The author, 2026-09-03, on the sitting of dialogue, the part that answers this question:
> One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered).

The author, 2026-09-03, during the reconciliation under the bootstrap grant on the dialogue node:
> disposition (if not already recorded as unanswered): adversarial alignment review validation includes a check for opportunites to merge unanswered nodes as alternate answers to the same question. Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph.
>
> you have bootstrap authority to reconcile the adversarial alignment review skill in additino to the alignment skill and other bootstrap grants already provided.

## Answer

By the adversarial review, which at every invocation takes the batch of nodes at the review stage and evaluates it against the full graph, answered and unanswered at every stage, in one context, and runs the validations below. Inconsistency between a draft and the answered graph is surfaced to the author by the periagogic stage, where the dialogue turns the author toward the doctrine the draft would join; inconsistency within the frontier has no author to meet it, and the review is where it is surfaced. The validations, each producing findings that name the nodes and the sentences:

On each node of the batch, the draft being the text its recommendation adopts, the node as it stands or the alternative it names:

1. Question and words. The draft answers the node's question and nothing else, and the author's words on the node are answered by it: no drift between what the author said and what the draft says.
2. Doctrine. The draft contradicts no answered node in its ancestry or among the nodes it cites; what would contradict doctrine is never adopted by a recommendation; it is recorded as an alternative on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which.
3. Facts. The recommendation's class and boldness are right, it adopts a listed alternative or the node as it stands, its pin names the standing text as it is, so that a recommendation drafted against text since amended is caught, its persistence follows from the node's shape, and every claim about the record or the implementation is verified: a file named exists, a command cited runs, a date and a quotation are exact.
4. Readings. A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's.
5. Shims. Each declared shim names an artifact that exists and a liquidation condition, and nothing the draft presumes materialized is unmaterialized without saying so.
6. Counter-argument. The strongest case against the draft, with its strength.

Across the graph, each node of the batch against every other node, answered or unanswered, at whatever stage, and a finding naming whichever nodes it concerns:

7. Contradiction. Two frontier nodes whose answers, drafts, or author's words touch the same matter and disagree.
8. Supersession. The author's words on one node superseded by later words on another while the earlier node still answers the superseded words; the occasion of this node.
9. Redundancy. Two nodes answering the same question, defining the same term, or restating each other; a merge is proposed naming the survivor and what moves.
10. Decomposition. A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; a split or a fold is proposed.
11. Vocabulary. Every term used with one meaning across the frontier, each definition made once, and no term used by a node that has no path to the node defining it.
12. Cross-reference. Every prose reference to another node points at a node that still says what is attributed to it; a reference stale since an amendment is the drift this review exists to catch.
13. Placement and order. The `under` and `order` fields agree with the answers' dependencies: a draft that presupposes another node's answer is under it or after it, and no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. The review recommends the order in which the author rules.
14. Coverage. Each part of every disposition the author has given in the record is answered by exactly one node: none unanswered, none answered twice; a quotation may be carried on a child as the ground of the part it answers.
15. Merge. The opportunities to merge unanswered nodes as alternate answers to the same question, the check the author's words of 2026-09-03 quoted above add: each disposition the author has given, and each unanswered node and each alternative pending on one, is a new question or a new answer to a question the record already asks, answered or unanswered; a new answer standing as its own node is proposed for the node whose question it answers, as an alternative with its source, and a new question carried on another node's dialogue is proposed a node of its own.

The result is applied as the kickback flow the recording and clean-context-review nodes describe, and nothing else: each node with a recommendation is forwarded to the ruling stage or kicked back, and a frontier finding kicks back each node it names whose text must change to the earliest stage the finding touches, the periagogic stage when the ground or the author's words are in question, the maieutic when the answer must be redrafted, with the finding as context and, where the reviewer can give it, the edit or the proposed merge or split. The merge or split itself is an alternative recorded on the node it would change, which the author rules on; the review does neither. One review runs at a time over the frontier: an invocation waits for any review already running, by the invoking session's discipline until a lock is materialized, which the author set at low priority.

## Rationale

The author, 2026-09-03: "there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way). This implies serialization of the batch operation - but that is low priority, it can be serialized manually for now. This superceded existing unanswered dispositions about the adversarial review skill (case in point). EVERY invocation of the adversarial alignment review skill is a batch operation that evaluates the full unanswered frontier (without isolating any context by disposition)." And, refining: "When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits." And: "serialize the review skill after completion of any currently running adversarial review skill in this session."

Drift between unanswered nodes is invisible to any reading of one node: the second reading of the clean-context-review node had already found that the contradictions a round creates are between texts written together, and the author's disposition carries that to its end, since the frontier is the round while nothing is ratified. The list divides by what the reviewer must hold in view: the first six validations are the review of a draft as the recording node describes it, and need the draft and its ancestry; the last eight need the whole frontier at once, and are the survey the author asked for. Contradiction, supersession, redundancy, and decomposition are the four shapes of drift a growing frontier takes; vocabulary, cross-reference, and placement are where drift leaves a trace a reader can check; coverage closes the loop from the author's words back to the nodes. The kickback flow is the author's refinement: a finding across nodes is a finding on each, and each returns to the stage where it is repaired, so that the frontier is repaired by the dialogue and not by the review. Serialization follows from the scope: two reviews of the same frontier at once would each forward what the other kicks back.

The merge validation and the batch scope were added on 2026-09-03 under the author's bootstrap grant, quoted above, when the frontier was re-encoded with the merge analysis the author's words ask for: the batch is the nodes at the review stage, the context is the full graph, and the author's earlier words that every invocation evaluates the full unanswered frontier are kept as the context read and narrowed as to what is judged. Rejected: a review of each node in a context of its own, the previous answer of the clean-context-review node, which sees only the round's drafts named for it and never the frontier's drift; a validator rule for consistency, since a validator holds ids, edges, ranks, and shapes, and whether two answers disagree is judgment; a survey at reconciliation time, which is too late, the implementation being built by then on inconsistent drafts. Kept from the previous answer: the clean context, a fresh subagent that is never a fork, since the review must be independent of the sitting's framing even while it reads everything the sitting wrote.

## Proposal

### Recording of 2026-09-03

The author's words quoted above are recorded as this node's answer, stamped deferred. The author's: that the frontier's self-consistency is the review's to surface and the answered graph's the periagogic stage's; that every invocation is a batch over the whole frontier with no context isolated by node; the survey for inconsistencies and redundancies, merges and decompositions; the kickback flow with context and edits; serialization, manual for now, and after any running review. The AI's, open to the author's ruling: the fourteen validations and their division; the earliest-stage rule for a frontier finding; that a merge or split is proposed, never done, by the review. This node supersedes the per-node answer of the clean-context-review node, amended the same day, and the `siblings` field of the review state, removed from the dialogue node the same day. Materialized the same day in the review skill under the bootstrap exception the author granted, and run over the whole frontier that evening, its findings recorded on the nodes they name after the session validated each against the record. Facts: authority ratified; boldness moderate, the requirement is the author's and the list is the AI's; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries 'stage: review' and no 'review:' field: this is its first reading, and it is the node that defines what this reading does. That is a live circularity the author should see: the validations this review ran are themselves unratified and were read by the reader they govern.
- Answer, validation 3: 'The recommendation's class and boldness are right, its persistence follows from the node's shape.' Verified that persistence is nowhere stored or derived: dialogue makes it derived and never stored, no projection emits it, and the sixteen generic Facts lines state it in prose only. So validation 3 asks the reviewer to check a fact the record does not carry.
- Answer, last paragraph: 'One review runs at a time over the frontier: an invocation waits for any review already running, by the invoking session's discipline until a lock is materialized, which the author set at low priority.' Honest about the gap and correctly attributes the priority to the author.
- Answer, validation 14: 'Every disposition the author has given in the record is answered by exactly one node.' Verified violated four times by exact-duplicate quotations: audience and coverage; scope, self-documentation and rsi; knowledge-store, capture and purpose; node and form-vocabulary. Some are deliberate context on a child; the validation as worded admits no such case. Suggested edit: say that a quote may be carried as context on a child that answers a part of it, and that the violation is two nodes answering the same part.
- Answer: 'a frontier finding kicks back each node it names to the earliest stage the finding touches'. Applied literally this kicks back a node for a finding about a sibling, which for a contradiction between a ruling-stage node and a maieutic one would return the ruling-stage node to maieutic on the strength of the other node's immaturity. Suggested edit: say the kickback falls on the node whose text must change.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value, and the split it names — the requirement is the author's, the list is the AI's — is honest. It should add that the list is already materialized in the review skill under the bootstrap exception, so the author is ratifying a practice in force, and that this reading was produced under it.

Strongest counter-argument (moderate): Fourteen validations over sixty-two nodes in one context is an unbounded reading, and the node sets no floor on what a finding must be worth. The author's requirement was that inconsistency within the frontier be surfaced, which the survey validations (7 to 14) do; validations 1 to 6 duplicate what the recording node already requires of every draft review, so every invocation pays twice for the per-node pass. Splitting the survey from the per-draft review would let the survey run over the whole frontier while the per-draft review runs only on drafts that changed — which is what the author's 'EVERY invocation is a batch operation' asks for and what the cost argues for.

The session's reply: Validated. Amended tonight: validation 14 admits a quotation carried on a child as the ground of the part it answers, the kickback falls on the node whose text must change, and the proposal says the batch ran and its findings were validated by the session before recording. The circularity is disclosed: this reading was produced under the validations it reviews. Persistence is derived from the node's shape, which is what validation 3 asks the reviewer to check. On the counter-argument, that the survey and the per-draft review should split: the author ruled every invocation a batch; a per-draft pass over changed drafts only is a proposal the sitting can put. Stage review.

### The author's words of 2026-09-03 on dialogue

The sentence quoted above adds a validation the answer does not list: whether a disposition is a new question or a new answer to a question already recorded, answered or unanswered. The draft does not answer it, so the stage returns to maieutic; the whole disposition is on the dialogue node, whose sitting carries it.

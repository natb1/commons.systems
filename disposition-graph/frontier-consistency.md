---
question: How is the unanswered frontier kept consistent with itself?
stage: review
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-07
  of: 4f81e50e348af74c4ad9c7b1934b77dfbd4e61e0
  commit: f146f8f44b295c64e47a13bff338748035183d87
  against: "Six of the last reading's seven findings are genuinely answered and independently verified: the contradiction with `clean-context-review`'s survey paragraph is resolved (both texts now agree on judged-set-reaches vs. no-judged-node-reaches), the boldness move to moderate is argued, both measurement figures are given and the after-cut figure matches the file on disk exactly (994,467 bytes), the fence now names the instrument and commit that already run the shape, and the merge option is confirmed recorded on `review-cost` verbatim as proposed. But finding 3 -- that this node's own paragraph restates a rule `review-cost` owns -- survives the amendment in substance: the 'cited here and not restated' language was added without removing the restated content, so the paragraph still says, word for word in substance, what `review-cost` already says, and a later edit to either node can again let the two drift, exactly as the account itself records having happened once already."
  survey:
    date: 2026-09-05
    of: a2c2689d209b460072bb623a2c2e7b2a3118cb1a
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: split-survey-from-per-draft
        source: review
        ref: "2026-09-03"
      - name: per-node-review-without-a-survey
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it sees only the drafts named for it and never the frontier's drift"
      - name: validator-rule-for-consistency
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "a validator holds ids, edges, ranks and shapes, and whether two answers disagree is judgment"
      - name: probe-is-not-a-mintable-question
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-04"
      - name: survey-at-reconciliation-time
        source: ai
        ref: "cbabf108"
        status: passed
        reason: "it is too late, the implementation being built by then on inconsistent drafts"
      - name: sixteenth-validation-independence
        source: commons.systems/disposition-graph/probe-or-node
        ref: "2026-09-04"
      - name: new-question-or-new-answer
        source: author
        ref: "2026-09-03"
      - name: cite-run-mechanics
        source: ai
        ref: "2026-09-03"
      - name: placement-feeds-the-order
        source: author
        ref: "2026-09-03"
      - name: proposal-as-a-state-of-a-ratified-node
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"
      - name: validations-cited-to-their-owners
        source: review
        ref: "2026-09-05"
      - name: unread-recommended-option
        source: review
        ref: "2026-09-05"
      - name: a-validation-for-the-round
        source: commons.systems/disposition-graph/review-cost
        ref: "2026-09-05"
      - name: sixteenth-validation-reads-the-delegation
        source: commons.systems/disposition-graph/probe-or-node
        ref: "2026-09-07"
      - name: the-survey-is-given-what-its-validations-read
        source: ai
        ref: "2026-09-07"
      - name: the-first-survey-reads-the-graph-whole
        source: review
        ref: "2026-09-07"
    recommends: the-survey-is-given-what-its-validations-read
    boldness: moderate
    against: "The clause that leaves a node no judged node reaches on one line rests on an earlier survey having read it, and no survey has ever run, so on the first survey the record ever takes the clause is a cut with nothing behind it: the seventh, eleventh and twelfth validations read text, and between two nodes neither judged nor reached this survey would see a question and no answer at all. The node is also asked to say what its validations read of a node they do not judge, which is a statement about what a reader is given, and this node's own fence hands that to clean-context-review and its bound to review-cost."
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "Deferred would let the validations act while the node stays in view, and this node is unanswered under an unanswered ancestor whose own division of the readings is still at review."
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - frontier survey
depends:
  - commons.systems/disposition-graph/clean-context-review#pointers-for-what-grows-with-the-record
  - commons.systems/disposition-graph/alignment-order#settle-counts-nodes-only
  - commons.systems/disposition-graph/decomposition#seams-and-split-review
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

The author, 2026-09-04, on the decomposition node, whose recommendation stands under this node's option `split-survey-from-per-draft`:
> go, and bootrap authority granted

The author, 2026-09-07, on the cost of the clean-context reading, asked of the session after a wave of readings on the alignment page's children:

> this iterative clean-context reading is very expensive. Are there token/context optimizations that would achieve similar quality results? eg. is the model choice (fable/opus/sonnet) right sized for the task?

The author, 2026-09-07, in the same turn's continuation:

> also consider optimzations to the dialogue workflow

The author, 2026-09-07, after the session's assessment of where the cost goes:

> record the recommended optimizations as dispositions, progress them up to confirmation, and include them in the list of reconciliations of alignment dialogue/review/survey/artifact

The author, 2026-09-07, later in the same turn:

> begin applying the optimizations as you progress

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

The merge validation and the batch scope were added on 2026-09-03 under the author's bootstrap grant, quoted above, when the frontier was re-encoded with the merge analysis the author's words ask for: the batch is the nodes at the review stage, the context is the full graph, and the author's earlier words that every invocation evaluates the full unanswered frontier are kept as the context read and narrowed as to what is judged. Kept from the previous answer: the clean context, a fresh subagent that is never a fork, since the review must be independent of the sitting's framing even while it reads everything the sitting wrote.

## Facts

### answer

The recommendation stays `split-survey-from-per-draft` in substance and moves to `the-survey-is-given-what-its-validations-read`, which is that text with one paragraph: what each of validations seven to sixteen reads of a node it is not judging is what the survey is given of that node, and no more. A node the judged set reaches is carried by what it answers -- its question, the one answer that binds it, the names of its options -- on the rule the `review-cost` node states for every reading; every other node is the id, the question and the file on one line.

The carrying rule follows from this node's own list rather than from a budget: no validation on the list reads a rationale, an account, or the prose of an option a node has passed over, and the `review-cost` node's rule is that a part no validation reaches is struck rather than shortened. The one-line clause does not follow from the list in the same way; it is the AI's inference about a reading no one has run, and the fact's case against says so, which is why the boldness is moderate and not low. Measured twice on 2026-09-07: the survey brief at implementation commit `87e4b24e`, before the cut, is 1,202,450 bytes, of which the eight judged nodes are 233,716 and the hundred and thirty-three context nodes 710,747, and within the context 330,078 bytes are the prose of the options on those nodes against 224,003 of standing answer; the brief at implementation commit `cb0e02c6`, after it, is 994,467 bytes, which is the shape a ruling for this option would ratify. The graph's thirty-three recommendation fences hold 147,156 bytes of recommended answer between them, which is what the carrying rule adds where it takes the option prose away.

The paragraph also states the limit of the cut, which is this node's to state because the limit is the validations. The index a draft's reader gets runs the fifteenth validation and none of the others: a contradiction, a term used two ways, and an attribution gone stale are in the text and not in the question. So a node that no judged node reaches is left to what an earlier survey found, and the recommended text says outright that no survey has yet run, which is the case against and is on the fact.

What rests on the author is the survey itself and the requirement that the frontier be kept consistent; what rests on the AI is the reading of each validation's input, and the judgment that this belongs here. The bound in bytes is the `review-cost` node's and is not restated: this node says what its validations read, that node says what it costs, which is the division the two nodes already keep.

#### split-survey-from-per-draft

The answer the fence holds. The review of a draft runs validations one to six and the fifteenth on one node when its recommendation is recorded, against the draft's neighbourhood and the index of every question the record asks; the survey runs seven to sixteen over the whole graph, judging the nodes at the review or the ruling stage whose recommendation changed since its pin, before the author rules; the periagogic stage asks the merge analysis first, as the author's words of 2026-09-03 on the dialogue node say; a tangle or a divergence the survey finds is recorded as the alignment-order node says and the ruling order is derived from it; and how each reading is run, what its reader is given, and how the survey is pinned and serialized are the clean-context-review node's. First raised by the review's counter-argument of 2026-09-03, that the batch paid twice for the per-draft pass; taken up by the decomposition node from the author's words of 2026-09-04.

#### per-node-review-without-a-survey

Every node is reviewed in a context of its own and no survey runs, which was
the clean-context-review node's answer on the morning of 2026-09-03. It was
passed over because such a reading sees only what it is handed and never the
frontier's drift.

#### validator-rule-for-consistency

The frontier's self-consistency is enforced by a validator rule rather than by
a review. It was passed over because a validator holds ids, edges, ranks and
shapes, and whether two answers disagree is judgment.

#### probe-is-not-a-mintable-question

Adopted into `split-survey-from-per-draft` on 2026-09-05: the fifteenth validation carries the clause. Everything the recommendation says, with one clause added to the fifteenth validation: a probe is not a question of the kind that is proposed a node of its own, and a question carried on another node's dialogue whose answer would itself stand as an answer to a question of the record still is. Read with `probe` defined on `commons.systems/disposition-graph/author-questions`, the validation already excludes a probe, because the question it means is one the record would answer with a disposition and a probe's answer is a fact about what the author meant; but a reader should not have to draw that unaided, and every use of the `probes` field is otherwise a survey finding against itself. The clause is the admission test's third limb read from the survey's side, and it keeps the finding of 2026-09-03 in force for everything disposition-shaped rather than overturning it. Raised by the `author-questions` sitting of 2026-09-04, whose answer requires the amendment by name.

#### survey-at-reconciliation-time

The survey of the frontier runs at reconciliation rather than before the
author rules. It was passed over because it is too late: the implementation is
by then being built on inconsistent drafts.

#### sixteenth-validation-independence

Adopted into `split-survey-from-per-draft` on 2026-09-05: the survey's list names the sixteenth. The survey runs a sixteenth validation beside the fifteen this answer enumerates: the independence test of the probe-or-node node, under which a node standing under an unanswered parent, whose only possible answer is a reading of the parent's, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved, is reported as a probe on the parent, as a finding carrying the probe it would become, readings exempt. The survey brief runs it since 2026-09-04 under the author's grant on probe-or-node and reports it under the decomposition kind, since a finding kind of its own would be refused by the applying script; this option enumerates it here so the brief runs nothing this node does not name. Whether independence becomes a kind of its own was left open until 2026-09-05, when the recommended text named the decomposition kind in the validation itself, the brief's own choice and the schema's nearest; a kind of its own would be a change to the applying script's schema and is not proposed.

#### new-question-or-new-answer

Adopted into `split-survey-from-per-draft` on 2026-09-04: the fence names the merge analysis as the periagogic stage's as well as the review's. The author's words on the sitting of dialogue name the analysis of whether a disposition is a new question or a new answer to a question already recorded as performed by periagoge and by the adversarial review; the standing answer's periagogic sentence covers a draft's inconsistency with the answered graph and not this analysis. This option is the answer with the analysis named as belonging to the periagogic stage as well as to the review, so that a sitting checks it before a draft exists and not only when the batch is read.

#### cite-run-mechanics

Adopted into `split-survey-from-per-draft` on 2026-09-04: the fence cites the clean-context-review node for how each reading is run, its model, and how the survey is pinned and serialized. Both nodes had stated the same two run rules in full, that every invocation is one batch over the whole frontier read in one context and that one review runs at a time by the invoking session's discipline until a lock exists, and let each other go stale on the lock. Clean-context-review is the survivor of the run mechanics, since its question is how the review is run and it is the node the skill implements; this node keeps what is its own, the validations and the kickback flow. Raised on commons.systems/disposition-graph/clean-context-review.

#### placement-feeds-the-order

Adopted into `split-survey-from-per-draft` on 2026-09-04: the thirteenth validation records what the survey finds as the alignment-order node says and derives the order from it. Validation 13 had the review recommend the order in which the author rules, and nothing consumed the recommendation of 2026-09-03. The alignment-order node gives it a consumer: the survey's findings of contradiction, supersession, and redundancy between unanswered nodes are recorded as options on the earlier-recorded survivor, and its findings of divergence between subtrees as `depends` on the leaves, and the ruling order is derived from that data rather than recommended in prose. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

#### proposal-as-a-state-of-a-ratified-node

Adopted into `split-survey-from-per-draft` on 2026-09-05: validation 2 carries the clause. Validation 2, in both the standing answer and the recommended `split-survey-from-per-draft`, reads "it is recorded as an option on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which". Under the authority node's recommendation a proposal is no longer a thing recorded under that node but the state of a ratified node whose recommendation has moved, so the clause this node's own readings run under has become unreadable. The validation drops "a proposal under the authority node when it arose outside alignment, and the review says which" and says instead that where the node it conflicts with is ratified, the option puts that node into the proposal state the authority node defines. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05.

#### validations-cited-to-their-owners

The fence states only what is this node's own, that the frontier's self-consistency
is checked, which reader checks what, and the kickback flow, and cites for each
validation's content the node that owns it: the recording node for the first six,
`probe-or-node` for the sixteenth, `alignment-order` for the thirteenth's recording,
`author-questions` for the fifteenth's probe clause. The numbered list becomes a
division of labour rather than a second copy of the record's rules, so an amendment
to any cited node needs no ruling here, and the drift one reading measured in a
single day, three validations diverged from their sources, cannot recur. It is
passed over if the author wants the contract the reader runs under readable in one
place, which is what the recommended text keeps. Raised by the clean-context review
of 2026-09-05, as the remedy its counter-argument points at.

#### unread-recommended-option

Validation 4 also asks whether the option a fact recommends has been read
against the traditions its rivals were read against: a bare recommended option
beside a well-read rival is a finding, since the projection implies the
tradition is against it. It is here because the `readings` node's recommended
answer states the check as though the review already made it, and it does not:
validation 4 as this node states it asks only that a tradition cited be
represented accurately within its recorded support scope, and neither brief asks
its reader for the other half. What it buys is that the per-option relation the
`readings` node recommends cannot quietly leave the recommended option bare;
what it costs is a validation whose input is the whole of a fact's readings and
whose false positives are every fact whose rivals were read for reasons that do
not bear on the recommendation. Raised by the second clean-context reading of
`readings` on 2026-09-05, which found the check assigned to this instrument and
carried by nothing.

#### a-validation-for-the-round

A draft's reader is given the round, the other drafts of the sitting whose
recommendations have moved, and is asked to run no validation that reaches
them beyond the merge validation, which needs only their questions. The
`review-cost` node's rule is that a part of a brief no validation reaches is
struck rather than shortened, and by that rule the field the round adds beyond
a question, the recommendation each draft now makes, is carried for nothing.
Either it is struck, or this node's list gains a validation a draft's reader
runs over the round: whether the draft contradicts a sibling draft written in
the same sitting, which is today the seventh validation and the survey's alone,
narrowed here to the round rather than to the whole frontier. The case for
adding it is that the survey is the only reader that catches a
sitting-created contradiction and the survey has never run; the case against is
that it duplicates the seventh validation on a smaller set and gives a draft's
reader a second object, which is what the division of the readings by their
object exists to prevent. Raised by the clean-context reading of `review-cost`
on 2026-09-05, which found the round priced to a validation this reader's list
does not carry.

#### sixteenth-validation-reads-the-delegation

The sixteenth validation's proposal reports the prune the way the node that owns
the test now prescribes: the survivor on the parent, the child's options struck,
the author's words moved, and the prune of the standing child taken by whoever
`commons.systems/disposition-graph/graph-topology`'s authority fact says may take
it — the author at the child's own row until that fact is ruled `delegated`, and
the recorder under the delegation once it is. The clause it replaces reads "the
child being a node already standing, that its existence fact moves to `prune` with
the test as its reason and the author rules the prune at the child's own row",
which this node took from `commons.systems/disposition-graph/probe-or-node` on
2026-09-04 as that node's own remedy.

Nothing in the survey's instruction is falsified today: until `graph-topology` is
ruled the row is where the prune is asked, so the recommended text, the alignment
skill and the survey brief all remain true as written. What the option buys is
that they stay true after the ruling, by reading the delegation off the node that
carries it instead of stating a rule this node does not own — which is the same
remedy `validations-cited-to-their-owners` proposes for the list as a whole and
which the reading of 2026-09-05 already applied to this very validation, finding
that the copy had "diverged from its source twice in a day". Raised on
`commons.systems/disposition-graph/probe-or-node`, by its clean-context reading of
2026-09-07 and the sitting that applied it.

#### the-survey-is-given-what-its-validations-read

Everything `split-survey-from-per-draft` says, with one paragraph before the validations: what each of the seventh to the sixteenth reads of a node it is not judging is what the survey's brief carries of that node. A node the judged set reaches through an ancestry, a rule that binds everywhere, a child, a sibling, a name or a reading is carried by what it answers, on the rule `review-cost` states for every reading; every other node is one line, the id, the question and the file. The paragraph says what the line will and will not run, and says that the clause leaving an unreached node on one line rests on an earlier survey having read it and that no survey has run.

For it: it follows from the list, since no validation on it reads a rationale, an account, or the prose of a passed-over option, and `review-cost`'s rule strikes rather than shortens a part no validation reaches. Measured, the survey brief's context is 710,747 bytes of its 1,202,450, and 330,078 of that context is option prose.

Against it, and on the fact: the one-line clause is a cut against a survey that has never happened, and on the first survey the record takes there is nothing behind it. It also states what a reader is given, which this node's own fence hands to `clean-context-review`; the reply is that what a validation reads is the validation's, and that the bound in bytes stays `review-cost`'s and is cited rather than restated.

Raised from the author's words of 2026-09-07 and from the survey brief measured that day. The working tree at `cb0e02c6` already carries the shape -- the judged set whole, their neighbourhood by what it answers, the rest one line -- which makes this recommendation the record catching up with its instrument.

#### the-first-survey-reads-the-graph-whole

The recommended text with its one-line clause suspended until a survey has actually run: on the first survey the record takes, every node is carried by what it answers, and the one-line class begins only once a survey's pin stands somewhere in the record. It changes the recommended text in that one place, and it is the condition the paragraph itself names as its ground -- "That the earlier survey ran is what the clause rests on, and no survey has yet run."

For it: it is the only option on this fact that answers the fact's own case against. The seventh, eleventh and twelfth validations read text, and topological reach is not semantic reach, so between two nodes neither judged nor reached the survey under the recommended text sees two questions and no answers; on every survey after the first the earlier survey stands behind them, and on the first there is nothing behind them at all. It gives up the saving on one run and keeps it on every run after.

Viable and not adopted: at a hundred and forty-three nodes neither shape is held whole by one reader -- 1,202,450 bytes before the cut and 994,467 after -- so the first survey's completeness is decided by how the survey divides its object and not by this clause, and suspending the clause buys a longer brief rather than a complete reading. At this frontier the judged set's reach covers most of the graph, so what the clause actually withholds from the first survey is small; where it is not, the remedy is the division and the bound, which are `review-cost`'s. The author may rule for it, and the cost of doing so is one brief.

Raised at the clean-context reading of 2026-09-07, in its viability paragraph.

### authority

Ratified is recommended because the validations are the contract every reading runs under, and a change to the list changes what the author is shown before they rule; a defect in it is undetected in every ruling after it, which is capture-shaped on the escalation test the `class-recommendation` node states. Boldness moderate: the requirement and the survey are the author's, the list and its division are the AI's. The case against is deferred, under which the validations would act while the node stays in view; it is live because this node is unanswered under an unanswered ancestor whose own division of the readings is still at review, and the fence rests on options of three other nodes, named in `depends`, none of them ruled.

## Recommendation

```markdown
---
question: How is the unanswered frontier kept consistent with itself?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - frontier survey
---
## Answer

By the adversarial review, whose two readings divide the validations below by their object, as the clean-context-review node describes: the review of a draft runs the first six and the fifteenth on one node, and the survey, the frontier survey this node defines, the reading that judges the whole graph against itself, runs the seventh to the sixteenth against the whole graph, answered and unanswered at every stage, judging every node at the review or the ruling stage whose recommendation has changed since it last pinned them, before the author rules. Inconsistency between a draft and the answered graph is surfaced to the author by the periagogic stage, where the dialogue turns the author toward the doctrine the draft would join and asks whether the disposition is a new question or a new answer to one the record already asks, as the author's words of 2026-09-03 say; inconsistency within the frontier has no author to meet it, and the review is where it is surfaced. The validations, each producing findings that name the nodes and the sentences:

On a draft, the text its recommendation names:

1. Question and words. The draft answers the node's question and nothing else, and the author's words on the node are answered by it: no drift between what the author said and what the draft says.
2. Doctrine. The draft contradicts no answered node in its ancestry or among the nodes it cites; what would contradict doctrine is never adopted by a recommendation; it is recorded as an option on the node it conflicts with, and where that node is ratified the option puts it into the proposal state the authority node defines.
3. Facts. The recommendation's boldness is right and the class its authority fact recommends is the one the session means to present, it names a listed option, its pin names the recommendation as it is, so that a review of text since amended is caught, its persistence follows from the node's shape, and every claim about the record or the implementation is verified: a file named exists, a command cited runs, a date and a quotation are exact.
4. Readings. A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's.
5. Shims. Each declared shim names an artifact that exists and a liquidation condition, and nothing the draft presumes materialized is unmaterialized without saying so.
6. Counter-argument. The strongest case against the draft, with its strength.

Across the graph, each node the survey judges against every other node, answered or unanswered, at whatever stage, and a finding naming whichever nodes it concerns. What the validations below read of a node they are not judging is this. Of a node the judged set reaches -- through an ancestry, a rule that binds everywhere, a child, a sibling, a node named, or a reading that bears on a node being judged -- validations seven to sixteen read what it answers, on the rule the review-cost node states for every reading, which is cited here and not restated. Of a node no judged node reaches, they read its question alone. None of them reads a rationale, an account, or the prose of an option a node has passed over. What the survey's reader is handed, given those inputs, is the clean-context-review node's to say, and it says it citing this node. The limit of the cut is this node's, because the limit is the validations: the question alone runs the fifteenth and none of the rest, since a contradiction, a term used two ways, and an attribution gone stale are in the text and not in the question, so between two nodes neither of which the survey is judging and neither of which any judged node reaches, this survey finds nothing and the earlier survey that read them both is what stands behind them. That the earlier survey ran is what the clause rests on, and no survey has yet run.

The validations:

7. Contradiction. Two frontier nodes whose answers, drafts, or author's words touch the same matter and disagree.
8. Supersession. The author's words on one node superseded by later words on another while the earlier node still answers the superseded words; the occasion of this node.
9. Redundancy. Two nodes answering the same question, defining the same term, or restating each other; a merge is proposed naming the survivor and what moves.
10. Decomposition. A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; a split or a fold is proposed.
11. Vocabulary. Every term used with one meaning across the frontier, each definition made once, and no term used by a node that has no path to the node defining it.
12. Cross-reference. Every prose reference to another node points at a node that still says what is attributed to it; a reference stale since an amendment is the drift this review exists to catch.
13. Placement and order. The `under` and `order` fields agree with the answers' dependencies: a draft that presupposes another node's answer is under it or after it, and no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. What the survey finds is recorded as the alignment-order node says, a lateral tangle as an option on the earlier-recorded node and a divergence between subtrees on the leaves, and the ruling order is derived from that and never recommended in prose.
14. Coverage. Each part of every disposition the author has given in the record is answered by exactly one node: none unanswered, none answered twice; a quotation may be carried on a child as the ground of the part it answers.
15. Merge. Whether each disposition the author has given, each node, and each option pending on one is a new question or a new answer to a question the record already asks, answered or unanswered: a new answer standing as its own node is proposed for the node whose question it answers, as an option with its source, and a new question carried on another node's dialogue is proposed a node of its own. A probe recorded on a node is a question about what the author meant and is not proposed a node of its own; a question whose answer would itself stand as an answer to a question of the record still is. The review of a draft asks it of the draft against the index of every question the record asks, and the survey asks it across the frontier and is its reader of last resort: a merge the periagogic stage or a draft's reader proposes is the same finding met sooner.
16. Independence. The independence test of the `probe-or-node` node, run across the frontier and reported as that node's answer prescribes, under the decomposition kind, readings exempt: the survey reports the survivor the child's question becomes on the parent, and, the child being a node already standing, that its existence fact moves to `prune` with the test as its reason and the author rules the prune at the child's own row.

The result is applied as the kickback flow the recording and clean-context-review nodes describe, and nothing else: a draft is forwarded to the ruling stage or kicked back, and a frontier finding kicks back each node it names whose text must change to the earliest stage the finding touches, the periagogic stage when the ground or the author's words are in question, the maieutic when the answer must be redrafted, with the finding as context and, where the reviewer can give it, the edit or the proposed merge or split. The merge or split itself is an option recorded on the node it would change, which the author rules on; the review does neither. How each reading is run, what its reader is given, its model, and how the survey's findings are pinned and serialized are the clean-context-review node's and are not restated here; the wait the author asked for on 2026-09-03 is answered there by the survey's pin rather than by a lock, as that node records, and two reviews of drafts never wait on each other.

## Rationale

The author, 2026-09-03: "there is a flaw in the harness disposition that makes the unanswered question frontier (the entire graph right now) prone to drift. As the unanswered frontier grows we expect it to maintain consistency with the answered-with-authority graph, but there is no recorded disposition for the harness to enforce self consistency of the unanswered frontier. Inconsistency with the answered-with-authority graph is expected to be surfaced by periogoge (recorded disposition). Inconcistency with the unanswered frontier must be surfaced by the adversarial alignment review skill. Propose a full list of validations which must be encoded into the adversarial alignment review skill - it must include a survey of the full unanswered frontier to identify inconcistencies and redundancies (unanswered dispositions that should be merged, or decomposed in a better way)." Refining: "When adversarial review identifies conflict the result is the same kickback flow described previously. Recommend kick back to earlier alignment dialogue phase with context and/or edits." On the sitting of dialogue: "One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered)." During the reconciliation of that day: "adversarial alignment review validation includes a check for opportunites to merge unanswered nodes as alternate answers to the same question. Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph." The author, 2026-09-04, on the decomposition node, whose recommendation stands under this node's split: "go, and bootrap authority granted".

Drift between unanswered nodes is invisible to any reading of one node, and the author's disposition carries that to its end: the survey reads the whole frontier. The list divides by what the reader must hold in view, which is why it divides between two readers: the first six validations need the draft and its neighbourhood and are the review of a draft as the recording node describes it; the last ten need the whole frontier at once and are the survey the author asked for; the fifteenth runs in both, on the draft against the index of every question the record asks, and across the frontier. Contradiction, supersession, redundancy, and decomposition are the four shapes of drift a growing frontier takes; vocabulary, cross-reference, and placement are where drift leaves a trace a reader can check; coverage closes the loop from the author's words back to the nodes; merge asks of each disposition and each node whether it is a new question or a new answer, and the periagogic stage asks it first, as the author's words say, so that a duplicate is met before it is drafted further. The kickback flow is the author's refinement: a finding across nodes is a finding on each, and each returns to the stage where it is repaired, so that the frontier is repaired by the dialogue and not by the review. The readers were split on the author's words of 2026-09-04 because the two objects need two contexts: a draft's reader must hold one node and its neighbourhood, the survey's must hold the frontier, and neither context serves the other. The undivided reading had the consequence the review of this node found on 2026-09-03: one reading over sixty-odd nodes on every invocation paid twice for the per-draft pass, handing the survey's reader the whole graph to judge six validations that need a neighbourhood, and its cost grew with the frontier rather than with what changed. Kept: the clean context, a fresh subagent that is never a fork. What the survey is given of a node it does not judge follows from the list rather than from a budget: no validation on it reads a rationale, an account, or the prose of an option a node has passed over, and by the review-cost node's rule a part no validation reaches is struck rather than shortened. Measured twice on 2026-09-07, on the survey brief the generator writes. Before the cut, at implementation commit 87e4b24e: 1,202,450 bytes, of which the eight judged nodes are 233,716 and the hundred and thirty-three context nodes 710,747; within the context, 330,078 bytes are the prose of the options on those nodes and 224,003 their standing answers. After it, at implementation commit cb0e02c6: 994,467 bytes, which is the shape a ruling here would ratify, and which `packages/clean-context-review/brief.mjs` already writes -- the judged set whole, the nodes it reaches by what they answer, every other node on one line -- applied at that commit under the author's instruction of 2026-09-07 to begin applying, and unsupported implementation by the materialization node's test until the ruling. Neither brief is in the record, `tmp/review/` being gitignored; both figures are re-taken by re-running the generator at the commit named. The graph's thirty-three recommendation fences hold 147,156 bytes of recommended answer between them, which is what the carrying rule adds where it takes the option prose away. The division takes from Fagan's inspection the rule that a review is divided by the role each reader plays and that no reader is asked to hold two, which the `fagan-inspection-roles` reading records; what it does not take is Fagan's division by role over one object, the division here being by object, and that reading bears on this option.
```

## Account

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

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `new-question-or-new-answer` (author, 2026-09-03); `split-survey-from-per-draft` (review, 2026-09-03); `cite-run-mechanics` (ai, from commons.systems/disposition-graph/clean-context-review).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: The unanswered frontier's self-consistency must be enforced by the adversarial review skill, whose every invocation is a batch over the full frontier with no context isolated by disposition, and which must run a full list of validations including a survey for inconsistencies and redundancies. 2026-09-03, own-question: A conflict the review identifies produces the same kickback flow, recommending a return to an earlier dialogue phase with context and edits. 2026-09-03, own-question: The review skill is serialized after any adversarial review already running in the session. 2026-09-03, own-question: Periagoge and the adversarial review both analyse whether a disposition is a new question or a new answer to a question already recorded, answered or unanswered.
The census unit's note: Two alternatives: the author's own added validation, which the node records as unanswered by the standing text and which sent it back to maieutic, and the review's split of the survey from the per-draft pass, which the session's reply explicitly left as a proposal for a sitting. The review's other findings are already applied in the answer, verified by reading validation 14 (the quotation carried on a child) and the kickback sentence (the node whose text must change), so they are not alternatives. The circularity finding and the finding that persistence is nowhere derived are observations with no proposed text. The fold of this node's restated batch and serialization rules into clean-context-review is proposed from that node.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: . The merge unit's note: No change proposed. new-question-or-new-answer is only PARTLY carried and stays: the answer now lists fifteen validations, and validation 15 carries the author's words verbatim, so the first half of the alternative is met, but the answer names only the review as running the analysis; the author's words say 'One of the analyses performed by periagoge and adversarial alignment review', and the answer's periagogic sentence covers a draft's inconsistency with the answered graph, not this analysis. The entry's own text is now stale on two facts, that the answer 'lists fourteen validations and no such analysis' and that 'the stage returned to maieutic'; the node stands at the review stage. If the main thread wants it rewritten rather than kept as-is, the remaining alternative is the answer with the analysis named as belonging to the periagogic stage as well as to the review.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries `stage: review` and no `review:` field: this is its first reading, and it is the node that defines what this reading does. The circularity is live and the author should see it — the fifteen validations this review ran are themselves unratified and were read by the reader they govern, under a skill materialized from them by a bootstrap grant.
- Answer, validation 3: 'its persistence follows from the node's shape'. Verified that persistence is nowhere stored or derived: dialogue makes it derived and never stored, no projection emits it, and the prose Facts lines state it by convention only. The validation asks the reviewer to check a fact no projection carries, which is why every facts check in this batch states it from the node's shape by hand.
- Answer, validation 14: verified amended to admit 'a quotation may be carried on a child as the ground of the part it answers', which resolves three of the four duplicate-quotation cases the earlier finding raised. The fourth, the author's form question on knowledge-store, capture and purpose, is a genuine double answer and is pending as `cite-forms` on all three.
- Answer, validation 15 and the periagogic sentence: the author's words say 'One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer', and the answer names only the review as running it — its periagogic sentence covers a draft's inconsistency with the answered graph, not this analysis. The `new-question-or-new-answer` alternative is the vehicle and its own text is stale on two facts, which its merge note records.
- Answer, last paragraph: 'One review runs at a time over the frontier: an invocation waits for any review already running, by the invoking session's discipline until a lock is materialized.' Verified a lock is now written by the skill (tmp/review/frontier.lock, present for this run), so this sentence and clean-context-review's identical one are both stale in the same direction. The `cite-run-mechanics` alternative would remove the duplication that let both go stale together.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current, and the split it names — the requirement is the author's, the list is the AI's — is honest. It should add that the list is already materialized in the review skill under the bootstrap grant, so the author is ratifying a practice in force, and that this reading was produced under it. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): Fifteen validations over sixty-eight nodes in one context is an unbounded reading, and the node sets no floor on what a finding must be worth. The author's requirement was that inconsistency within the frontier be surfaced, which validations seven to fifteen do; one to six duplicate what recording already requires of every draft review, so every invocation pays twice for the per-node pass and the cost grows with the frontier rather than with what changed. The session's answer, that the author ruled every invocation a batch, is right about the survey and does not answer the duplication, which the pending `split-survey-from-per-draft` alternative addresses.

The session's reply: Forward accepted. The circularity is real and disclosed here; the lock sentence is stale as clean-context-review's is; validation 3's persistence and the periagogic half of validation 15 stay as pending alternatives.

### Recommendation moved, 2026-09-04

Moved by the alignment session from the standing text to `split-survey-from-per-draft` on the author's words of 2026-09-04 quoted above, given on the decomposition node, whose account carries the reasoning and the grant. The review of 2026-09-03 pinned the standing text, so this node returns to the review stage and the frontier shows it as changed since its review; the first review of a draft the reconciled skill runs is owed here. The fifteen validations are kept whole; what changes is which reader runs which, the periagogic half of the merge analysis, the recording of what the survey finds, and the citation of the run mechanics to the clean-context-review node in place of the restatement that let both nodes go stale together on the lock.

### The sixteenth validation, 2026-09-04

Recorded by the reconciliation of the probe-or-node rule into the survey brief, under the author's grant of that day on that node: the brief now runs an independence validation the fifteen here do not name, and the reconciling unit reported the gap. The option `sixteenth-validation-independence` puts it on this node's answer fact for the author; the recommendation does not move.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts, answer fact (validation 3, viability). The prose says "Three options leave the list because the recommended text carries them, and none of them stood against it: `new-question-or-new-answer`, the author's own ...; `cite-run-mechanics` ...; and `placement-feeds-the-order`, the author's ...", and the facts line lists only seven options. Two of the three struck are `source: author` candidates, and the record's own practice keeps an adopted option listed with its adoption noted (alignment-page's `open-probe-count-on-the-chip`, "Adopted into the recommended text on 2026-09-04"; dialogue's five clauses "Adopted into every-part-in-the-record"; the viable-options node recommends `passed-over-options-stay`, under which "a candidate never silently leaves the list"). Once struck, the author can no longer rule for `new-question-or-new-answer` on its own, and the merge note of the census (Account) that says it was only partly carried loses its subject. Suggested edit: restore the three to the options list with a subsection each reading "Adopted into `split-survey-from-per-draft` on 2026-09-04" and the sentence the fence now carries for it, and delete the "leave the list" sentence from the prose.
- Recommendation, validation 15, against `commons.systems/disposition-graph/author-questions` (validation 2, cross-reference). The fence's fifteenth reads "a new question carried on another node's dialogue is proposed a node of its own" with no exclusion for a probe, while author-questions' standing text, reconciled under grant, "requires by name that validation 15 gain a clause that a probe is not a mintable question", and the option `probe-is-not-a-mintable-question` is listed here as viable, sourced to that sitting, and left unrecommended with no reason recorded. As written the fifteenth would propose every entry in a `probes` field a node of its own, which contradicts the node this fence stands beside and the probe-or-node node's admission test. Suggested edit: adopt the clause into the fence's validation 15 ("A probe recorded on a node is a question about what the author meant and is not proposed a node of its own; a question whose answer would itself stand as an answer to a question of the record still is"), and mark the option adopted; or record in its subsection why it is passed over.
- Recommendation, the survey's list, against the materialized instrument (validation 5, cross-reference). The fence enumerates the survey's validations as "the seventh to the fifteenth", but `packages/clean-context-review/brief-survey.md` (line 25) sends the survey "validations 7 to 15 of `frontier-consistency`, and the sixteenth, the independence test of `probe-or-node`" and defines it at line 36; `.claude/skills/align-survey/SKILL.md` names it too. The option `sixteenth-validation-independence` records this and says "this option enumerates it here so the brief runs nothing this node does not name", yet stays unadopted without a reason. A ratified fence that names fifteen while the instrument runs sixteen is the drift validation 12 exists to catch, ratified. Suggested edit: add "16. Independence. A node standing under an unanswered parent whose only possible answer is a reading of the parent's, whose facts would repeat the parent's, and which would be pruned when the parent's recommendation moved, is reported as a probe on the parent, readings exempt" to the survey's list and change "the seventh to the fifteenth" to "the seventh to the sixteenth"; leave whether independence is a kind of its own to the option's prose.
- Recommendation frontmatter and text (validation 3, vocabulary). The fence declares `defines: frontier survey`, and the term appears nowhere in the fence, in review-skills, or in clean-context-review: every use is "the survey". The brief's own header for the node reads "Defines: frontier survey (no gloss yet)". Suggested edit: gloss it once where the survey is first named, "and the survey, the frontier survey this node defines, the reading that judges the whole graph against itself, runs the seventh to the ...", so the defined term is the one used.
- Facts, authority fact (validation 3). The authority fact recommends `ratified` at moderate boldness and its subsection carries no reason, where the dialogue node asks that each fact's subsection open "with the reason for its recommendation" and the sibling review-model and review-skills nodes each give one. Deferred is a live alternative here: the rule would act while the node stays in view, and the node is unanswered under an unanswered ancestor whose own division of readings is still at review. Suggested edit: one sentence under `### authority` saying why the author is asked to confirm rather than defer (the validations are the contract every reading runs under, and a change to the list changes what the author is shown), and an `against` naming deferred.
- Node header `depends: none` against the fence's validation 13 (validation 3, placement). The fence rests on the clean-context-review node's `per-draft-and-survey` ("as the clean-context-review node describes"), on the alignment-order node's recording of tangles and divergences (validation 13's second sentence), and on the decomposition node's `seams-and-split-review`, all unruled and at review; the sibling review-skills records `depends: frontier-consistency#split-survey-from-per-draft` for the same kind of dependence. Validation 13 says "no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so"; this node forwards to ruling saying nothing. Suggested edit: `depends: clean-context-review#per-draft-and-survey, alignment-order#settle-counts-nodes-only`, and decomposition where the session judges its option decisive.
- Rationale, last paragraph (evaluation rule). "Splitting the readers, on the author's words of 2026-09-04: one reading over sixty-odd nodes on every invocation paid twice for the per-draft pass ... its cost grew with the frontier rather than with what changed ... and which stands as the reason." The evaluation rule strikes cost from the choosing and admits it only as a stated consequence. The paragraph before it already gives the merit, "the list divides by what the reader must hold in view, which is why it divides between two readers", and clean-context-review's fence rests the same split on the readings' objects and moments. Suggested edit: lead the sentence with the object division (a draft's reader must hold one node and its neighbourhood; the survey's must hold the frontier, and neither context serves the other), and state "paid twice" and "grew with the frontier" as the consequence the undivided reading had, not as "the reason".

On the facts and what they recommend: The answer fact recommends `split-survey-from-per-draft` at moderate boldness, standing `standing`; the requirement, the survey, and the go of 2026-09-04 are the author's while the division by object and the readers' contexts are the AI's, and moderate is right. The authority fact recommends ratified at moderate boldness with no reason. The fence (form rule, under clean-context-review, defines frontier survey) is what the author would confirm: the fifteen validations divided per draft and per frontier, the periagogic stage asking merge first as the author's words on the dialogue node say (verified verbatim at disposition/disposition-graph/dialogue.md line 234), findings recorded as alignment-order says, and mechanics cited to clean-context-review; the review pin (forward, moderate, 2026-09-03, of 97906aa7) is stale against it, which this reading replaces, and there is no survey pin.

On the viability of the options: Every listed option is viable, and the four passed-over ones (`per-node-review-without-a-survey`, `validator-rule-for-consistency`, `survey-at-reconciliation-time`, and the standing text) carry their reasons. Viable options are missing: the three adopted ones struck from the list (`new-question-or-new-answer` and `placement-feeds-the-order`, both the author's, and `cite-run-mechanics`) should stand listed as adopted, and two listed options (`probe-is-not-a-mintable-question`, required by name by author-questions, and `sixteenth-validation-independence`, already run by the survey brief) are neither adopted nor passed over with a reason.

Strongest counter-argument (moderate): The split answers only half of the counter-argument the record accepted on 2026-09-03: the survey still reads the whole graph on every invocation and is incremental only in what it judges, with no floor on what a finding is worth, so its cost and its noise still grow with the frontier. It also restates the partition in two nodes (this fence and clean-context-review's) and two brief templates, and the partition has already drifted within a day, the survey running a sixteenth validation this list does not name; a ratified numbered list becomes the thing the instrument drifts from, which is the update anomaly the node's own validations 9 and 12 exist to catch. And the merge validation now runs at three moments on three objects, in periagoge, in the draft review, and in the survey, with no rule for which finding wins when they disagree, so one node can be proposed a merge three times by three readers before the author sees it. The reply is that the division is by what a reader must hold in view, which no single context serves, and that the drift is a cross-reference finding the survey itself raises, but the draft would be stronger stating the partition once and naming the reader of last resort for validation 15.

The session's reply: Validated, all seven. The three adopted options return to the list, each with a subsection saying what it was adopted into and when, as the dialogue and alignment-page nodes keep theirs and as the viable-options node recommends; the two options struck the same way on the authority and materialization nodes on 2026-09-05 return likewise, and an option is recorded on the viable-options node for a status naming an adopted option, since the encoding's only status is passed. The probe clause the author-questions answer requires by name is adopted into the fifteenth validation, and the sixteenth, independence, is added to the survey's list, so the fence names what the brief runs; both options stay listed as adopted. The frontier survey is glossed where the survey is first named. The authority fact opens with its reason and carries its case against, naming deferred. Depends names the three options this fence rests on. The rationale leads the split with the division by object and states the doubled cost as the consequence the undivided reading had. On the counter-argument, the fence now says the survey is the reader of last resort for the merge validation and that an earlier proposal of the same merge is the same finding met sooner. Stage review for the re-read.

### Amended after the reading, 2026-09-05

After the clean-context reading of 2026-09-05, whose findings the session validated. The three options the recommended text carried, `new-question-or-new-answer`, `cite-run-mechanics`, and `placement-feeds-the-order`, struck on 2026-09-04 as carried, return to the list as adopted, each with the subsection it had, since the record keeps an adopted option listed with its adoption noted and the viable-options node recommends that no candidate leave the list; two of them are the author's, and struck they could not be ruled for on their own. The clause the author-questions answer requires by name is adopted into the fifteenth validation, and the sixteenth, independence, is named in the survey's list, so the fence names what the survey brief has run since 2026-09-04; both options stay listed as adopted. The frontier survey is glossed where the survey is first named. The authority fact opens with its reason and carries its case against, deferred. `depends` names the options of three nodes the fence rests on, under the thirteenth validation's own rule. The rationale leads the split with the division by object and states the doubled cost as the consequence the undivided reading had. The fence names the survey the reader of last resort for the merge validation. Stage review for the re-read.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Recommendation, validation 2, against `commons.systems/disposition-graph/authority` (validations 2 and 3). The fence keeps "it is recorded as an option on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which". The authority node's standing text — which is also what it recommends, no fence differing from it — reads "A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice", so nothing is recorded 'under the authority node' any more and the clause names an act the record no longer has. That node's account says so by name: disposition/disposition-graph/authority.md line 124, "frontier-consistency's validation 2 in both its standing answer and its recommended `split-survey-from-per-draft`, where the rule this node's own reading runs under becomes unreadable. The same move is recorded on each as the option `proposal-as-a-state-of-a-ratified-node`." That option is listed here (source authority, ref 2026-09-05) and is the one option on the answer fact that is neither adopted into the recommended text nor marked `status: passed` with a reason — the other ten are one or the other. This is the same shape the reading of 2026-09-05 raised against `probe-is-not-a-mintable-question` and `sixteenth-validation-independence`, and it was left unmoved by the amendment. Suggested edit: adopt the option's own prose into validation 2, so the clause reads "...it is recorded as an option on the node it conflicts with, and where that node is ratified the option puts it into the proposal state the authority node defines", and add "Adopted into `split-survey-from-per-draft` on 2026-09-05" to its subsection; or record in that subsection why it is passed over.
- Recommendation, validation 16 (validations 12 and 3, and the update anomaly the node's own validation 9 names). The sixteenth restates `probe-or-node`'s independence test in full and cites nothing: "16. Independence. A node standing under an unanswered parent whose only possible answer is a reading of the parent's, whose facts would repeat the parent's, and which would be pruned when the parent's recommendation moved, is reported as a probe on the parent, as a finding carrying the probe it would become, readings exempt." Both the option's own prose here and the instrument cite the owner — `packages/clean-context-review/brief-survey.md` line 25 sends the survey "validations 7 to 15 of `frontier-consistency`, and the sixteenth, the independence test of `probe-or-node`" — and the copy has already diverged from its source twice in a day. `probe-or-node`'s test carries no 'unanswered parent' qualifier, and it prescribes the remedy this fence drops: "A node already standing is not struck by the recorder: the survivor is recorded on the parent the same way, the node's existence fact moves to `prune` with the test as its reason, and the author rules the prune", which is what `brief-survey.md` line 36 actually instructs and what the survey, meeting only nodes already standing, always does. As written the fence tells the survey to report a probe and says nothing of the prune the author must rule. Suggested edit: state the sixteenth the way the fence already treats the run mechanics and the recording of a tangle — "16. Independence. The independence test of the probe-or-node node, run across the frontier and reported as that node's answer prescribes, readings exempt" — rather than copying a test this node does not own.
- Recommendation, first paragraph, the survey's judged set (validations 1 and 12). The fence says the survey "runs the seventh to the sixteenth over the whole graph, answered and unanswered at every stage, judging the nodes whose recommendation has changed since it last pinned them, before the author rules", dropping the stage restriction that both its source and the author's own words carry. `clean-context-review`'s recommended text reads "It judges every node at the review or ruling stage whose recommendation has changed since the survey last pinned it", and the author's words quoted on this very node say "Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph." Since `dialogue`'s recommendation allows a recommendation to be recorded at any stage, the fence as written puts periagogic and maieutic nodes into the judged set, which is broader than what the author asked for and than what the instrument does. Suggested edit: "judging every node at the review or the ruling stage whose recommendation has changed since it last pinned them".
- Recommendation, first paragraph, the moment of a draft's reading (validation 12, and the fence's own closing sentence). The fence says the review of a draft "runs the first six and the fifteenth on one node the moment its recommendation is recorded", while its last paragraph says "How each reading is run, what its reader is given, its model, and how the survey's findings are pinned and serialized are the clean-context-review node's and are not restated here", and that node in turn says "when it is invoked, by whom, and what it gates are the recording node's confirmation and are not restated here". The recording node's recommendation puts it differently: the reading "is invoked when the node reaches the review stage, which the completion of the maieutic movement sets on a node carrying a recommendation and which is landed at the checkpoint before the reading begins, and again whenever the recommendation moves at or after that stage" — not at the moment of recording, which `dialogue` allows at any stage. This is the restatement that `cite-run-mechanics` was adopted to end, left standing one clause. Suggested edit: strike "the moment its recommendation is recorded" and let the sentence say only which validations each reading runs.
- Readings (validation 4 and the evaluation node's second evaluation). The brief records "no reading bears on this node", yet the recommended option divides one review into two readings by their object, and the record already holds the tradition on exactly that move: `commons.systems/disposition-graph/fagan-inspection-roles`, "What does Fagan's inspection say about dividing a review into named roles, and what does the record take from it?", which stands under `review-skills` and whose `bears` names only `review-skills#two-skills-one-package`. So the tradition on dividing a review is recorded against the node that packages the two readings as skills and not against the node that divides the work between them, and this node's recommendation goes to the author for ratification with no reading behind it. `n-version-programming` is the precedent for a reading bearing on more than one option across nodes. Suggested edit: add `- node: commons.systems/disposition-graph/frontier-consistency` / `fact: answer` / `option: split-survey-from-per-draft` / `relation: adopted` to `fagan-inspection-roles`'s `bears`, and say in the rationale what the division takes from it; `information-hiding` is the second candidate, on the boundary between the two readers' contexts.
- Disposition and Recommendation, serialization (validation 1). The author's words are quoted on this node — "serialize the review skill after completion of any currently running adversarial review skill in this session" and "This implies serialization of the batch operation - but that is low priority" — and the fence now answers them only by citation: "how the survey's findings are pinned and serialized are the clean-context-review node's and are not restated here." What that node answers there is not what the words asked: "That pin serializes the survey and no lock is held", and "Two reviews of drafts never wait on each other", with `lock-at-launch` passed over as "advisory, per checkout, and unneeded once the pin serializes". The divergence is reasoned and recorded, but it is recorded on the other node, while the words it diverges from are quoted here, so an author reading this node sees their instruction cited away rather than answered. Suggested edit: one clause in the last paragraph — "and the wait the author asked for on 2026-09-03 is answered there by the survey's pin rather than by a lock, as that node records" — so the divergence is visible where the words are.
- Frontmatter, `depends` (validation 3). The node names `commons.systems/disposition-graph/clean-context-review#per-draft-and-survey`, but that option's own prose on that node reads "The survey, validations seven to fifteen, keeps the batch shape the author's words of 2026-09-03 give it", which this fence's list of sixteen now contradicts; the option that carries the division as this fence states it, and says "validations seven to sixteen", is `pointers-for-what-grows-with-the-record`, which `clean-context-review` currently recommends and which `per-draft-and-survey` no longer is. As it stands the dependence pins this fence to the one option of that node whose text disagrees with it, and a ruling for the recommended option would leave the dependence unsatisfied. Suggested edit: `commons.systems/disposition-graph/clean-context-review#pointers-for-what-grows-with-the-record`, or both entries if the sitting holds the earlier option live.
- Validation 15 (merge), asked of this draft against the index of every question the record asks. The option `sixteenth-validation-independence` closes "and leaves open whether independence becomes a kind of its own", and the survey brief already reports the sixteenth "under the decomposition kind, since a finding kind of its own would be refused by the applying script" (`packages/clean-context-review/brief-survey.md` line 36). That open question has no home: no node in the index asks what kinds a survey finding takes, and by the fence's own fifteenth "a new question carried on another node's dialogue is proposed a node of its own". It is a node and not a probe on the probe-or-node test, since the answer would bind the applying script's schema and be read by sessions that never saw the question. Suggested edit: either mint a node under this one — "What kinds does a survey finding take?" — with the option's sentence as its ground, or settle it here by naming the kind in validation 16, so that the fence names what the brief runs in kind as well as in number.

On the facts and what they recommend: The answer fact recommends `split-survey-from-per-draft` at moderate boldness with `standing` standing, and a `## Recommendation` fence is present because they differ; moderate is right, the requirement, the survey, the merge analysis and the "go" of 2026-09-04 being the author's while the division by object, the sixteenth's wording and the readers' contexts are the AI's. The authority fact now recommends `ratified` at moderate boldness with its reason and an `against` naming deferred, which answers the last reading; ratified is defensible on the capture-shaped test, though the counter-argument below bears directly on it. Two observations: the answer fact's `against` reads as a compression of the reading of 2026-09-05's own counter-argument rather than the AI's case at the time it recommended, which is the thing the `review.against` field beside it already carries; and the fence's frontmatter is well formed for a recommendation, carrying `question`, `form`, `under` and `defines` and none of the dialogue's keys, with `frontier survey` now glossed where the survey is first named, while the `defines` entry itself still carries no gloss pair. The review pin `63bd9090` is stale by design and this reading replaces it; there is no survey pin.

On the viability of the options: Every one of the eleven options on the answer fact is viable on its facts, and the four passed-over ones carry their reasons; five are adopted into the recommended text with the adoption noted, which answers the last reading, and one, `proposal-as-a-state-of-a-ratified-node`, is neither adopted nor passed over, which is the first finding. The authority fact's three options are complete by construction. One viable option is missing, and it is the remedy the counter-argument points at: `validations-cited-to-their-owners` — "The fence states only what is this node's own, that the frontier's self-consistency is checked, which reader checks what, and the kickback flow, and cites for each validation's content the node that owns it: the recording node for the first six, `probe-or-node` for the sixteenth, `alignment-order` for the thirteenth's recording, `author-questions` for the fifteenth's probe clause. The numbered list becomes a division of labour rather than a second copy of the record's rules, so an amendment to any cited node needs no ruling here, and the drift this reading measured in one day cannot recur. It is passed over if the author wants the contract the reader runs under readable in one place." Naming it matters because the author is being asked to ratify the list itself, and this is the only option on the table that would change what ratification freezes.

Strongest counter-argument (moderate): The node asks the author to ratify a sixteen-item numbered list whose content is largely owned elsewhere, and the list has already drifted from its sources within a day of the split: from `authority` on what a proposal is (validation 2), from `probe-or-node` and from the survey brief on the independence test (validation 16), and from `clean-context-review` and the author's own words on which nodes the survey judges. Three divergences in one day, found by one reading, are evidence that a copied list is the thing the instrument drifts from, which is the update anomaly this node's own validations 9 and 12 exist to catch, and ratification makes the copy the hardest text in the record to correct, since every amendment to a cited node would then need a ruling here. Deferred, which the authority fact's `against` names, would let the list move with its sources while the node stays in view; the option this reading names as missing would remove the copy altogether. The reply is that the validations are the contract every reading runs under, that a contract which moves without a ruling is no contract, and that the drift is detectable rather than silent because the survey runs 9 and 12 over this node like any other — but that reply concedes that the record's remedy for this node's defect is this node's own instrument, and the fence would be stronger stating what is its own and citing the rest, as it already does for the run mechanics, the ruling order, and the merge validation's reader of last resort.

The session's reply: All eight findings were validated at their loci on the main thread and all eight were accepted; the reading's counter-argument is accepted as a viable option and recorded rather than adopted.

F1, the option neither adopted nor passed: confirmed. `proposal-as-a-state-of-a-ratified-node` was the one option on the answer fact carrying neither a ruling, a pass, nor an adoption note, and validation 2 still read "a proposal under the authority node when it arose outside alignment, and the review says which", which the authority node's recommendation makes unreadable, proposal there being the state of a ratified node whose recommendation has moved and not a thing an origin distinguishes. Validation 2 now reads that an option recorded on a ratified node puts it into the proposal state the authority node defines, and the option's subsection records the adoption of 2026-09-05.

F2 and F8, the sixteenth validation copied rather than cited: confirmed. The fence's 16 paraphrased `probe-or-node`'s test and dropped the remedy `packages/clean-context-review/brief-survey.md:36` actually instructs, the child's existence fact moving to prune with the test as its reason and the author ruling at the child's own row. 16 is now a citation of `probe-or-node`, carrying that remedy and naming the decomposition kind the brief reports it under, which settles what F8 left open: the kind is the brief's own and the schema's nearest, and a kind of its own would be a change to the applying script's schema and is not proposed here.

F3 and F4, the judged set: confirmed. `clean-context-review` says the survey judges every node at the review or the ruling stage whose recommendation has changed since the survey last pinned it; the fence had dropped the stage restriction and, separately, asserted that a draft's review runs "the moment its recommendation is recorded", which is a scheduling claim this node does not own. Both are now as the owning node states them, the second struck.

F5, the tradition that bears on the division: confirmed. `fagan-inspection-roles` recorded a bears entry on `review-skills#two-skills-one-package` and none on this node, although the same reading grounds this option's division of the readings. The entry is added, and the fence's rationale now names what the division takes from Fagan, one role per reader, and what it does not, Fagan's division by role over one object against this node's division by object.

F6, the author's words on serialization: confirmed. The fence deferred the whole of the survey's pinning to `clean-context-review` and so answered nothing the author asked on 2026-09-03; the deferral now names what the answer is, the survey's pin rather than a lock, and that two reviews of drafts never wait on each other.

F7, the stale option pointer: confirmed. `clean-context-review` now recommends `pointers-for-what-grows-with-the-record`, and the `depends` entry pointed at `per-draft-and-survey`, the superseded option. Repointed.

The counter-argument, that the fence copies content the cited nodes own and should cite every validation to its owner rather than restate it, is recorded as the option `validations-cited-to-their-owners` on the answer fact, source review, 2026-09-05, with the reviewer's own measure of the drift: three validations diverged from their sources in a single day. It is not adopted here, because it is the one limb that changes what a ratification of this node would freeze, and that is the author's to rule, not the review's to take. The answer fact's reason now says so.

The two-round warning apply.mjs prints is the miscount recorded on `review-cost`: it counts reading sections since the last kickback rather than readings of the same answer. This is the first reading of this answer since its last kickback and the second of the answer; the cap is reached, the amendment is recorded, and the node goes to the author.

### Corrected after the reading, 2026-09-05

The reading of `clean-context-review`, the same day, found this node's `### answer`
prose still reading "the survey runs seven to fifteen over the whole graph", the
off-by-one its own recommended text had corrected, and without the stage
restriction the fence now carries. Both are corrected here.

The correction moves the answer fact's pin, so the frontier prints this node as
changed since its review although nothing of substance moved and no reader is
owed a third reading of it, the cap having been reached. The pin is not
re-settled by hand. What the record should do in this exact case is recorded as
`pin-names-the-text-the-reader-read` on the `review-cost` node, with the three
ways out and none of them taken; until the author rules there, this node carries
the honest pin and the note.

### The escalation test's citation corrected, 2026-09-05

This node's `### authority` prose named the escalation test as the record's own
and named no node, which the clean-context reading of `class-recommendation`
found on seven nodes at once. The test left the `authority` node's answer on
2026-09-05 and is now stated by `class-recommendation`; the citation names that
node. Nothing about the class or the boldness changes. The edit moves this
node's authority-fact pin without a reading behind the move, which is the live
option `pin-names-the-text-the-reader-read` on `review-cost`.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (strong): The node asks the author to ratify a sixteen-item numbered list whose content is largely owned elsewhere, and the reading of 2026-09-05 already found three divergences of the copy from its sources within a day of the split — which is the update anomaly this node's own validations 9 and 12 exist to catch. This survey adds the measurement that makes it worse rather than better: two further hand-maintained enumerations in the record, on `quotes` and on `stub-traditions`, are measurably stale at this commit, so the copied-list failure this node models is the record's most reliably reproduced defect. The split's own premise, that the survey catches what the per-draft reading no longer sees, is untested: this is the first survey, and it read a brief its own text says a reviewer may not hold whole.

The session's reply: Taken, and the measurement is worse than the reading of 2026-09-05 had. Two further hand-maintained enumerations, on `quotes` and on `stub-traditions`, are stale at this commit, so the copied-list defect this node models is the record's most reproducible failure and the node that models it holds a sixteen-item copy. The session does not move the recommendation: the validations have to live somewhere, and the alternative on the table is to scatter them back to the nodes that own each subject, which is what produced the copies. What the node owes before ruling is the derivation rule — which validations are copies with an owner elsewhere, and which are its own.

### Frontier finding, 2026-09-05

Kind: redundancy.

Two vocabulary questions are each pending as an unruled option on four separate nodes, and each is already answered in the standing text of a node in the judged set. `rejected-alternative-is-an-option` stands as an option on `growth`, `legacy`, `projection` and `transience`; `commons.systems/disposition-graph/rejected`'s `## Answer` already says "A rejected alternative is a viable option not chosen" and, in as many words, "An option is not a page: an answer that was not taken has no standing and earns no node of its own." `proposal-as-a-state-of-a-ratified-node` stands as an option on `growth`, `node`, `frontier-consistency` and `transience`; `commons.systems/disposition-graph/authority`'s `## Answer` already says "A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice." So eight options on six nodes ask the author to settle two things the record has settled, and they will be ruled one at a time on nodes whose questions are about something else. The reading of 2026-09-05 raised the second of these on `frontier-consistency` alone; what the survey adds is that it pends on three further nodes and that the settling text already stands. The record has a working precedent for the remedy: `commons.systems/disposition-graph/instruments` carries `one-ruling-for-the-word` (disposition/disposition-graph/instruments.md line 113) for the instrument-or-criterion question, and its enumeration is accurate — "the author is otherwise asked the same vocabulary question five times on five pages". Neither of these two families has such an option.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/node, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/instruments.

Proposed: Strike the eight options and replace each with a citation. `commons.systems/disposition-graph/rejected` is the survivor for what a rejected alternative is, and `commons.systems/disposition-graph/authority` is the survivor for what a proposal is; each of the six bearer nodes cites the survivor's sentence where it currently carries the option. Where a bearer node believes its option means something the survivor's answer does not cover, that difference is the option, stated as the difference, and everything the survivor already says comes out. If the author would rather rule the two words once explicitly, mint the settling option on the survivor in the shape `instruments`' `one-ruling-for-the-word` takes, without a count in its prose.

### What the survey is given, 2026-09-07

The author, 2026-09-07, quoted under `## Disposition`: "this iterative clean-context reading is very expensive"; and "record the recommended optimizations as dispositions, progress them up to confirmation, and include them in the list of reconciliations of alignment dialogue/review/survey/artifact", which names the survey.

The measurement, at graph commit `d0942d57` and implementation commit `87e4b24e`, on `tmp/review/survey.brief.md` as it stands on disk, generated before the instrument was amended: 1,202,450 bytes, the judged set of eight nodes 233,716, the context of a hundred and thirty-three nodes 710,747, of which 330,078 is the prose of the options on those nodes, 224,003 their standing answers and 124,733 their head lines. Across the graph the answer facts carry 75,032 bytes of prose on options passed over and 282,058 on options still pending; the thirty-three recommendation fences hold 147,156 bytes of recommended answer.

What moved. The recommendation moves from `split-survey-from-per-draft` to `the-survey-is-given-what-its-validations-read`, which is that text with one paragraph stating what the validations read of a node they do not judge, and one paragraph added to the rationale carrying the measurement. The validations themselves, their division between the two readings, the kickback flow and the citations to `clean-context-review` are unchanged.

A placement kept and a placement refused. The design unit's brief put the survey's brief on this node. Its byte-level bound is not placed here: this node's own fence hands what a reader is given to `clean-context-review` and its cost to `review-cost`, and the `review-cost` option of the same date carries the carrying rule for every reading, the survey's included. What is placed here is what the validations read, which is the validations' own, and the recommended text cites `review-cost` for the bound rather than restating it.

What stays viable. Every option keeps its row, `validations-cited-to-their-owners` among them, which would move the numbered list off this node and would take this paragraph with it; `a-validation-for-the-round` and `unread-recommended-option` are untouched.

Already running. The working tree carries the survey's judged set whole, its neighbourhood by what it answers, and every other node as one line, under the author's instruction to begin applying; it is unsupported implementation until this option is ruled. The shape landed at implementation commit `cb0e02c6`, with `surveyNeighbourhoodIds` in `packages/clean-context-review/brief.mjs`; at `87e4b24e`, named here when this section was written, every node the survey did not judge was still carried alike.

The reading of this amended recommendation is owed.

### Clean-context review, 2026-09-07, of bd1ce88d

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `the-survey-is-given-what-its-validations-read`.

Findings:

- ## Recommendation, the paragraph before validation 7, against the parent node moved in the same sitting. The two texts now say different things about what the survey reads, and neither names the other. This draft says of a node no judged node reaches: "Of every other node it is given the id, the question and the file on one line, as a draft's reader is", while `commons.systems/disposition-graph/clean-context-review`'s recommended fence, moved today, still says the survey keeps "the whole graph, answered and unanswered at every stage, read in one context, the accounts left out since they are the dialogue's history and not its text". A reader of both cannot tell whether the survey holds the graph or a list of questions, and the difference is the whole of what this paragraph decides. This is the contradiction a round is given for. Suggested edit: amend `clean-context-review`'s survey paragraph in the same sitting to say that the graph is read as this node's paragraph carries it, or record an option there naming the narrowing with this node as its source; the two texts cannot both stand.
- ## Recommendation, the paragraph before validation 7, against this node's own fence. The same text disclaims and then states the same subject. Its closing paragraph says "How each reading is run, what its reader is given, its model, and how the survey's findings are pinned and serialized are the clean-context-review node's and are not restated here", while the new paragraph says "What each of these validations reads of a node it is not judging is what the survey is given of that node, and no more" and then states, in the survey's own terms, what it is given. The fact's `against` concedes the point and replies that what a validation reads is the validation's; the reply is right and the text does not take it. Suggested edit: write the paragraph strictly as the validations' inputs -- "validations seven to sixteen read, of a node they are not judging, its question, the one answer that binds it and the names of its options, and of a node no judged node reaches, its question alone" -- and let `clean-context-review` say, citing this node, what the reader is therefore handed. As written the paragraph is a second home for the sentence that node owns, which is the anomaly `validations-cited-to-their-owners` was raised against on this very fact.
- ## Recommendation, the paragraph before validation 7, and the sibling that already states the rule. `commons.systems/disposition-graph/review-cost` now recommends: "A node a reading is not judging is carried by what it answers and never by its whole file, and it is one rule for every reading, a draft's neighbourhood and the survey's graph alike: its question, one answer, and the names of the options on its answer fact." The new paragraph cites that rule and restates its three items in the same breath ("the question, the one answer that binds it, and the names of the options on its answer fact"). One rule in two homes drifts, which this node has measured on itself: the account records a copy that had "diverged from its source twice in a day". Suggested edit: cite `review-cost` for the carrying rule and state here only what is this node's own, which is that no validation on the list reads a rationale, an account, or the prose of a passed-over option.
- ## Facts, `##### answer`, on the boldness. "It follows from this node's own list rather than from a budget, which is why the boldness is low" holds for the first half of the paragraph and not for the second. The second half decides what a survey that has never run will be blind to, and the fact's own `against` says of it that it "is a cut with nothing behind it" and that the seventh, eleventh and twelfth validations read text. A recommendation whose case against says the record has never tested it is not resting on the record; on this record's scale, where high boldness is low confidence, that is moderate at least. Suggested edit: moderate, with the reason as the fact already gives it -- the carrying rule follows from the list, the one-line clause is the AI's inference about a reading no one has run.
- ## Recommendation, the rationale, and ## Account, on a measurement that cannot be re-taken and stops before the number that matters. Both say "Measured on the survey brief on disk at implementation commit 87e4b24e, generated before that node's reconciliation of 2026-09-07: 1,202,450 bytes". `tmp/` is gitignored, so nothing in the record reproduces that file, and the brief now on disk -- generated after the reconciliation the account says the instrument already carries -- is 994,467 bytes. The record therefore states the before and not the after, and the author is asked to rule on a cut whose measured effect the sitting has in hand. Suggested edit: give both figures with their dates, 1,202,450 before and 994,467 after, and say that the second is the shape this option would ratify.
- ## Recommendation, and validation 5 read against the sitting's own practice. The fence does not say that the instrument already runs what it asks the author to rule. The disclosure is on the option's row ("The working tree at `87e4b24e` already carries the shape ... which makes this recommendation the record catching up with its instrument") and in the account, and both are removed at the recording -- the account with the dialogue, the row's subsection when the ruled option becomes the one that stands. The author's ruling is not a free choice while the tool already behaves this way, and the record should say so where it survives. Suggested edit: one sentence in the fence naming the instrument that already carries the shape and the commit it was applied at, as `review-model`'s fence does for its own sites.
- Validation 15, merge, against `commons.systems/disposition-graph/review-cost` (disposition/disposition-graph/review-cost.md). If the paragraph is not rewritten as validation inputs (first suggested edit above), then what it decides is a candidate answer to that node's question and not to this one's: `review-cost` asks what a reading is given and how the cost is bounded, and it already carries the carrying rule for every reading. This review proposes and does not merge: record on `review-cost`'s answer fact an option named `the-surveys-unreached-node-is-one-line`, source `commons.systems/disposition-graph/frontier-consistency`, ref 2026-09-07, with the prose: "Everything `one-answer-a-node-and-one-read` says, with the survey's own graph priced by the same rule: a node the judged set reaches is carried by what it answers, and a node no judged node reaches is the id, the question and the file on one line, on the ground that the validations which read text reach only what the judged set reaches. Raised on `frontier-consistency`, whose validations state the inputs, and recorded here because what a reading is given is this node's." The author then rules the placement once rather than meeting the same rule on two nodes.

On the facts and what they recommend: The answer fact recommends `the-survey-is-given-what-its-validations-read`, a listed option, with `standing` still standing and the `## Recommendation` fence present, which is right; the fence's frontmatter carries `defines: frontier survey` and none of the dialogue's keys, and it answers the same question. The boldness of low is the one number I would move, for the reason in the finding above: the carrying half follows from the list, the one-line half is an inference about a reading that has never run and whose loss the fact's own `against` states. The authority fact recommends `ratified` at moderate boldness with a `class-recommendation` reading above it that names the capture-shaped limb -- the validations are the contract every reading runs under -- and with its own `against` for `deferred`, which is well put and live, since the fence rests on options of three unruled nodes named in `depends`.

On the viability of the options: Every option listed is viable and each passed-over row carries a reason that still holds; `validations-cited-to-their-owners`, `a-validation-for-the-round`, `unread-recommended-option` and `sixteenth-validation-reads-the-delegation` are all live and correctly left pending rather than folded. One viable option is missing: `the-first-survey-reads-the-graph-whole`, the recommended text with its one-line clause suspended until a survey has actually run -- every node carried by what it answers on the first survey the record takes, the one-line class beginning only once a survey's pin stands somewhere in the record, which is the condition the paragraph itself names as its ground ("That the earlier survey ran is what the clause rests on, and no survey has yet run"). It is undominated: it buys the whole of the measured saving on every survey after the first and gives up nothing the record can currently show it needs, and it is the only option on the fact that answers the fact's own case against. It should be recorded with source `review`, ref 2026-09-07.

Strongest counter-argument (strong): The paragraph decides what the frontier's only reader may not see, on an untested inference, for a reading that has never once run. Validations seven, eleven and twelve -- contradiction, vocabulary and cross-reference -- read text, and topological reach is not semantic reach: two nodes can contradict each other, use one term two ways, or attribute a stale claim without either standing in the other's ancestry, children, siblings, names or readings. For every such pair outside the judged set's reach, the survey under this text sees two questions and no answers and reports nothing, and the clause's own fallback -- that an earlier survey read them -- is empty, because the record has never taken one. So the first survey the record ever runs, on a frontier of a hundred and forty nodes drafted without any survey behind it, is the one run for which the cut has nothing behind it, and it is also the run the record most needs to be complete. The saving is real and measured; the loss is unmeasured and falls on the single instrument this record has against the drift it was written to catch.

The session's reply: Accepted on all seven, each verified at its locus on the main thread: clean-context-review's fence still gives the survey the whole graph in one context; this fence disclaims and then states what the survey is given; the carrying rule is restated from review-cost; the one-line clause is an inference about a reading no one has run; the measurement gives the before and not the after, which is 994,467 bytes on disk today; the fence does not say the instrument already carries the shape; and the one-line clause is a candidate answer to review-cost's question. The amendments owed: the paragraph rewritten as the validations' inputs alone, that validations seven to sixteen read of a node they are not judging its question, the one answer that binds it and the names of its options, and of a node no judged node reaches its question alone, and that no validation reads a rationale, an account or a passed-over option's prose, review-cost cited for the carrying rule and clean-context-review amended in the same sitting to say, citing this node, what the reader is handed; boldness moderate with the reason the fact gives; both figures with their dates; one sentence naming the instrument and the commit; the option the-surveys-unreached-node-is-one-line recorded on review-cost as the reading proposes, source this node; and the option the-first-survey-reads-the-graph-whole recorded, source review, viable and not adopted, for the reason that at a hundred and forty-three nodes neither shape is held whole by one reader, 1,202,450 bytes or 994,467, so the first survey's completeness is decided by how the survey divides and not by this clause, and that the judged set's reach at this frontier covers most of the graph; the author may rule for it. The counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.

### Amended after the reading, 2026-09-07

The clean-context review of 2026-09-07 forwarded the recommendation at strong strength with seven findings, all validated at their loci on the alignment thread and all accepted. The recommendation does not move: it stays `the-survey-is-given-what-its-validations-read`.

The paragraph before validation 7 is rewritten strictly as the validations' inputs, which is what this node owns: validations seven to sixteen read, of a node they are not judging that the judged set reaches, its question, the one answer that binds it and the names of the options on its answer fact, and of a node no judged node reaches, its question alone; none of them reads a rationale, an account, or the prose of a passed-over option. `review-cost` is cited for the carrying rule rather than restated, and what the survey's reader is therefore handed is said on `clean-context-review`, citing this node, whose fence is amended in the same sitting -- it had still given the survey "the whole graph ... read in one context", which no reader of both texts could reconcile with this one (findings 1, 2 and 3).

The boldness moves from low to moderate, for the reason the fact already gives: the carrying rule follows from the list, and the one-line clause is the AI's inference about a reading no one has run, which the case against says outright (finding 4).

The measurement gives both figures with their dates: 1,202,450 bytes at implementation commit `87e4b24e` before the cut, 994,467 at `cb0e02c6` after it, the second being the shape a ruling would ratify; `tmp/review/` is gitignored, so both are re-taken by re-running the generator at the commit named (finding 5). One sentence in the fence now names the instrument that already carries the shape, `surveyNeighbourhoodIds` in `packages/clean-context-review/brief.mjs`, and the commit it was applied at, so the disclosure survives the recording that removes the option's row and this account (finding 6). That commit is `cb0e02c6` and not `87e4b24e`, which the account of this sitting and the option's row had both named: the reach computation the shape needs does not exist in the file at `87e4b24e`.

The option `the-surveys-unreached-node-is-one-line` is recorded on `review-cost`, source this node, as the reading's merge finding proposes, so the author rules the placement once rather than meeting the same rule on two nodes (finding 7). `the-first-survey-reads-the-graph-whole` is recorded here, source `review`, viable and not adopted: at a hundred and forty-three nodes neither shape is held whole by one reader, 1,202,450 bytes or 994,467, so the first survey's completeness is decided by how the survey divides its object and not by this clause, and the judged set's reach at this frontier covers most of the graph. The author may rule for it.

The counter-argument goes on the answer fact at the strength the reading gave it, where it already stands.

The amended answer owes its re-reading.

### Clean-context re-reading, 2026-09-07, of 4f81e50e

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `the-survey-is-given-what-its-validations-read`.

Findings:

- ## Recommendation, the paragraph before validation 7 -- finding 3 of the last reading is not answered, only relabeled. The last reading's finding 3 objected that this paragraph 'cites that rule and restates its three items in the same breath'; the amendment's own account claims 'review-cost is cited for the carrying rule rather than restated', but the amended text still reads: 'validations seven to sixteen read what it answers, on the rule the review-cost node states for every reading and which is cited here and not restated: its question, the one answer that binds it, and the names of the options on its answer fact.' That enumeration is `review-cost`'s own clause in near-verbatim paraphrase -- `review-cost` states the identical rule as 'A node a reading is not judging is carried by what it answers and never by its whole file, and it is one rule for every reading, a draft's neighbourhood and the survey's graph alike: its question, one answer, and the names of the options on its answer fact.' Asserting 'cited here and not restated' immediately before restating the same three items is self-contradicting on its face, and it reproduces exactly the pattern `validations-cited-to-their-owners` exists to prevent (a rule stated on this node and again on the node that owns it, so an amendment to one leaves the other stale, which this very node's account already recorded happening once -- 'diverged from its source twice in a day'). Suggested edit: follow the finding's original suggestion -- state here only what is this node's own, that validations seven to sixteen read of a node the judged set reaches its question, one answer, and the names of its options (a plain reference to `review-cost`'s enumeration, e.g. 'what `review-cost` there calls its question, one answer, and the names of the options on its answer fact'), or drop the enumeration entirely and say only the negative constraint that is this node's own: that no validation on the list reads a rationale, an account, or the prose of a passed-over option.

On the facts and what they recommend: The answer fact's recommendation stays `the-survey-is-given-what-its-validations-read`; boldness moves from low to moderate with the reasoning the fact itself now gives (the carrying half follows from the list, the one-line half is an untested inference); `the-first-survey-reads-the-graph-whole` is added as a new viable-and-not-adopted option. The fence's paragraph before validation 7 is rewritten to state the validations' inputs and defer 'what the reader is handed' to `clean-context-review`, and its Rationale now gives both the before-cut (1,202,450 bytes) and after-cut (994,467 bytes, verified on disk today) measurements and names the instrument (`packages/clean-context-review/brief.mjs`) and the commit (`cb0e02c6`) that already runs the shape. Authority is untouched by the diff.

On the viability of the options: Every option on the answer fact remains viable; `the-first-survey-reads-the-graph-whole` is properly added with its own case for and against. The one open concern is not an option's viability but the recommended text itself: the paragraph before validation 7 still substantively restates `review-cost`'s carrying-rule enumeration under a claim of citing rather than restating it (see finding above), which the amendment did not actually fix despite the account's claim that it did.

Strongest counter-argument (moderate): Six of the last reading's seven findings are genuinely answered and independently verified: the contradiction with `clean-context-review`'s survey paragraph is resolved (both texts now agree on judged-set-reaches vs. no-judged-node-reaches), the boldness move to moderate is argued, both measurement figures are given and the after-cut figure matches the file on disk exactly (994,467 bytes), the fence now names the instrument and commit that already run the shape, and the merge option is confirmed recorded on `review-cost` verbatim as proposed. But finding 3 -- that this node's own paragraph restates a rule `review-cost` owns -- survives the amendment in substance: the 'cited here and not restated' language was added without removing the restated content, so the paragraph still says, word for word in substance, what `review-cost` already says, and a later edit to either node can again let the two drift, exactly as the account itself records having happened once already.

The session's reply: Accepted. The paragraph before validation 7 said the carrying rule was cited and not restated and then restated its three items; the enumeration is struck and the clause cites review-cost alone. The recommendation does not move; the repaired answer is a new answer and owes its own reading.

### Repaired after the re-reading, 2026-09-07

The re-reading of the amendment kicked the answer back on one finding, verified on the main thread: the paragraph before validation 7 said the carrying rule was cited and not restated, and then restated its three items in `review-cost`'s own words. The enumeration is struck; the clause cites `review-cost` for the rule and says nothing of its content, which is what `validations-cited-to-their-owners` asks. The recommendation does not move. The repaired answer is a new answer and owes its own reading.

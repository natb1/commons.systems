---
question: When is an open question a probe, an option, or a node?
stage: maieutic
facts:
  - name: answer
    options:
      - name: by-what-the-response-does
        source: ai
        ref: "2026-09-04"
      - name: by-what-is-asked
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-04"
      - name: node-by-default
        source: ai
        ref: "2026-09-04"
    recommends: by-what-the-response-does
    boldness: moderate
    against: "The four tests are the AI's own, drawn in one sitting from the failure the author named and not yet worn by use; the survival test in particular asks the recorder to predict whether a response will be needed later, which is a judgment about the future of the record and not a fact a reading can check today, and the tie-break toward the probe rests on an argument about which error is cheaper that the author has not confirmed."
    stands: by-what-the-response-does
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The rule decides what the author is asked to rule on and what they are merely asked, which is the shape of decision the record escalates toward ratified, since a recorder who may delegate it to itself decides its own accountability; but the author may hold the four tests to be operating detail under the parent's ratification and delegate them with it."
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---
## Disposition

The author, 2026-09-04, after the reverse sweep of that day returned no node
that is a mis-encoded probe:

> I'm not convinced we have a complete disposition to distinguish between disposition and meiutic probe. Can you recommend guidelines for when to record a child disposition vs meiutic probe, then apply those guidelines to the graph.

> Only re-apply the guidelines to the graph if they cover something not already reviewed in the previous sweeps.

## Answer

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted under the node it blocks and entered in that node's `depends`, as the parent's third limb already says.

Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.

The ruling test. Would the author's response be a ruling or an answer? A ruling confirms, edits, or denies a recommendation and confers a class, and an answer says what the author intends. If it would make sense for the author to respond "delegated, do not ask me again" or "deferred, I will return to it", the question is a node, because only a disposition carries a class; a probe's answer cannot be delegated, since there is no one but the author who can say what the author meant, and cannot be deferred, since a deferred probe is a recommendation the AI could not ground standing in front of the author, which the parent forbids.

The scope test. A probe bears on the recommendations of one node, and its `discharges` names them. A question whose answer would move recommendations on more than one node, or would bind nodes not yet written, is doctrine reaching below it, which is what a node's answer does and a probe's cannot; it is a node, and every node it would have moved enters it in `depends`.

The survival test. Would anything need the response after the recommendation it moved has been ruled on? A probe dies with the dialogue, and what survives of it is the author's words and the rationale that quotes them; a response that a later sitting, a reading, a projection, or a reconciliation would need on its own account survives the dialogue, and what survives the dialogue is a node.

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node is re-encoded as a probe on the parent, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.

Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node can only be demoted by a prune the author must rule on, and while it stands it puts a rulable row on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.

## Rationale

The parent's admission test draws its third limb by what is asked, should be against meant, and the two sweeps of 2026-09-04 that applied it found no node in the graph mis-encoded, which the author did not believe. The sweeps were not careless; the test cannot fail against its asker, because the wording of a question is the one thing the asker controls, and a discriminator that reads wording will pass whatever was written in the shape the writer chose. The reverse sweep's third check, the work a node does in the record, was the one check on that sweep that looked past wording, and it looked at incumbent work only, so a node nothing rests on yet passed it by silence. What the four tests share is that they are put to the response and not to the question: the class it could carry, the nodes it would reach, its life after the ruling, and its independence from its parent are all facts about what a disposition is that a probe cannot counterfeit, and each is checkable by a reading against the record as it stands.

The tie-break reverses between recording and review, and the answer says so rather than choosing one, because the cheaper error is different in the two: at recording a probe is promotable and a node is not demotable, so the probe is the reversible choice; at review the node already stands and may be the author's, so keeping it is.

Readings owed under this node, each surfaced by the second evaluation and named here rather than minted: the distinction between a question of law and a question of fact, for the whole rule, the finder of fact answering what was intended and the court answering what binds, and for the survival test, since a finding of fact binds no later case and a holding does; the request for information against the change order in construction contracting, for the same line drawn where the drawings are the record, an RFI clarifying what the drawings mean and a change order altering what the contract requires, and for the rule that an RFI whose answer alters the contract is re-issued as a change order, which is the promotion clause; the erratum against the revising document in the IETF's practice, for the survival test, an erratum being consumed by the text it corrects; the parol evidence rule, for the ruling test's other face, that what a party intended is evidence and not term; and the issue-based information system already owed on the node node, for the difference between an issue, which stands, and a question put to a participant, which does not. The certified question and IEEE 830's TBD are already owed on the parent and are not repeated.

## Facts

### answer

`by-what-the-response-does` is recommended because it is the only rule on the list that the asker cannot pass by choosing words, and because each of its four tests reads something a probe cannot counterfeit and a reading can check. `by-what-is-asked` is the parent's line and the sweeps' instrument, and it is kept viable because it may be all the author wants, with wording as the test and the sweeps' result accepted. `node-by-default` is kept because the reverse sweep worked under it and the author may hold that its asymmetry is the right one at recording too.

#### by-what-is-asked

The parent's third limb as it stood before this sitting: a question of the record asks what something should be, a probe asks what the author meant by words they have already said, and the recorder classifies by which is asked. Viable if the author holds the sweeps' result to be complete and the line to want no more than wording; under this option the parent's limb is restored to its former sentence and this node is pruned.

#### node-by-default

Wherever the recorder cannot classify a question, it mints a node, on the reverse sweep's asymmetry: a node wrongly kept costs an entry on a long frontier, and a probe wrongly recorded may lose a question the author asked for. Viable if the author weighs a lost question above a rulable row they did not want; under this option the four tests stand and only the tie-break flips.

### authority

`ratified` is recommended because the rule decides what the author is asked to rule on and what they are merely asked, which is the recorder deciding its own accountability, and the record escalates toward ratified where being wrong is capture-shaped.

## Account

### Sitting on author-questions, 2026-09-04

Minted from the author's words under `## Disposition`, at the maieutic stage,
because the words ask for a recommendation and the sitting on the parent was in
hand to make it. The periagoge was not run separately: the author had read the
two sweeps' results and the parent's answer and found the line incomplete, which
is the comprehension that movement exists to produce.

Why a node and not a repair of the parent's third limb: by the rule this node
states. The answer stands after it is given, every movement that collects
enforces it, the readings check against it, the dialogue node's
`aspects-are-nodes` and the un-aligned-children node rest on the same line, and
it would move recommendations on nodes this sitting never touched. The parent's
limb was redrawn in one sentence to read through it and the parent returned to
the maieutic.

The draft was written by the main thread and not by a design unit, since it is
the answer to a question the author put to the sitting directly; the
clean-context reading owed on it is the check that decision rests on, and it is
owed before the author rules.

What the two sweeps tested, so that the application the author asked for runs
only what is new: the migration's three limbs, the third by wording; the
reverse sweep's three checks, wording, the viability of a candidate, and the
incumbent work a node does. Of the four tests here, the ruling test, the scope
test and the survival test were run by neither; the independence test overlaps
the reverse sweep's second and third checks in what it reads and differs in its
tell, which is whether the child would be pruned when the parent moved. The
application therefore runs the three new tests over every node and every
probe in both directions, node to probe and probe to node, and the independence
test over every node that stands under an unanswered parent, reporting only
where a new test changes what the sweeps found.

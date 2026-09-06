---
question: When is an open question a probe, an option, or a node?
stage: maieutic
probes:
  - id: a-delegable-review-finding-question
    asks: >-
      When a review-finding question's response would be a delegation, is it
      a node, as the ruling test says, or a maieutic question, as the author's
      words of 2026-09-04 on the review node say of review-finding questions?
    fact: answer
    why: >-
      The author said on 2026-09-04, on
      `commons.systems/disposition-graph/review`, that "the review finding
      questions are examples of meiutic questions to be ruled on during
      meiutic dialogue, not the kind of thing to be confirmed as facts in the
      alignment artifact". The ruling test says a question the author could
      answer "delegated, do not ask me again" is a node, because only a
      disposition carries a class. Two open entries on review,
      `cap-and-effort-from-the-contract` and `graph-landing-review-at-scale`,
      are review-finding questions whose response could be exactly that, and
      the application of 2026-09-04 found both to be nodes on the ruling and
      survival tests. Whether the author's words were about costumed options,
      which a node carrying a real delegation is not, or about the artifact
      carrying any row for such a question, which a node would, is not
      derivable from the record.
    discharges: >-
      Whether the ruling test carries an exception for review-finding
      questions, which moves this node's answer fact; and with it whether the
      two entries on review are promoted, which they are not until this is
      answered, since doubt resolves downward.
    source: ai
    raised: 2026-09-04
facts:
  - name: answer
    options:
      - name: by-what-the-response-does
        source: ai
        ref: "2026-09-04"
      - name: by-what-is-asked
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-04"
      - name: prune-granted-in-dialogue-needs-no-row
        source: author
        ref: "2026-09-05"
        status: passed
        reason: superseded by the author's own standing disposition of 2026-09-06, which delegates the pruning of unratified nodes rather than granting it case by case
      - name: prune-delegated-with-two-bounds
        source: author
        ref: "2026-09-06"
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

The author, 2026-09-04, asked whether this rule requires reconciliation with
the alignment, review and survey skills, told that it does at four loci, the
two reading briefs, the record brief, and the align skill's probes bullet, and
that the sitting's grant was read as not covering them:

> bootstrap authority granted

The author, 2026-09-04, after the delta sweep, renewing the grant for the amended remedy:
> ensure new probe/node guidelines are reconciled into the align/review/survey skills (you have bootstrap authority)

The author, 2026-09-05, in the sitting on `alignment-page-observations`, on the clause of this answer that sends every prune to a row on the alignment page:

> Pruning doesn't require confirmation of explicitly granted in dialogue. just prune it

The author, 2026-09-05, immediately after, scoping it:

> (Pruning of unratified nodes that is)

The author, 2026-09-06, making the prune grant standing rather than a grant given case by case:

> the prune grant is standard disposition.
> - may not prune something that is ratified
> - anything from the author (such as quotes) must be transferred to another node before prune
>
> Otherwise, pruning authority is granted to AI under general delegation of graph topology.

## Answer

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted under the node it blocks and entered in that node's `depends`, as the parent's third limb already says.

Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.

The ruling test. Would the author's response be a ruling or an answer? A ruling confirms, edits, or denies a recommendation and confers a class, and an answer says what the author intends. If it would make sense for the author to respond "delegated, do not ask me again" or "deferred, I will return to it", the question is a node, because only a disposition carries a class; a probe's answer cannot be delegated, since there is no one but the author who can say what the author meant, and cannot be deferred, since a deferred probe is a recommendation the AI could not ground standing in front of the author, which the parent forbids.

The scope test. A probe bears on the recommendations of one node, and its `discharges` names them. A question whose answer would move recommendations on more than one node, or would bind nodes not yet written, is doctrine reaching below it, which is what a node's answer does and a probe's cannot; it is a node, and every node it would have moved enters it in `depends`.

The survival test. Would anything need the response after the recommendation it moved has been ruled on? A probe dies with the dialogue, and what survives of it is the author's words and the rationale that quotes them; a response that a later sitting, a reading, a projection, or a reconciliation would need on its own account survives the dialogue, and what survives the dialogue is a node.

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is not struck by the recorder: the survivor is recorded on the parent the same way, the node's existence fact moves to `prune` with the test as its reason, and the author rules the prune, since while it stands it puts a rulable row on the alignment page and that row is where the prune is asked. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

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

#### prune-granted-in-dialogue-needs-no-row

The four tests stand and the remedy changes, for unratified nodes and no others.
This answer's clause on a node already standing says "the author rules the prune,
since while it stands it puts a rulable row on the alignment page and that row is
where the prune is asked", which makes the page the only place a prune can be
granted. The author's words of 2026-09-05 say otherwise: a prune of an unratified
node, explicitly granted in the dialogue, needs no confirmation and is taken.
Under this option the clause reads that such a prune is taken on the author's
explicit word wherever it is given, in the dialogue or at the node's row, and the
row remains the way it is asked when no word has been given.

The scope is the author's own and is the whole of the option's safety. A node no
ruling reaches carries a draft, and deleting a draft the author has just told you
to delete destroys nothing they have ever confirmed. A ratified node is the other
case: its answer is a thing the author committed to, its prune is the withdrawal
of that commitment, and this option does not reach it — the prune of a ratified
node is a ruling and is asked at the row, as this answer's clause already
provides. What the two have in common is that the record keeps the reason either
way. What does not change is what the prune must leave behind, since that is
the reason the clause exists: the survivor recorded on the parent, the account
folded into the parent's, the author's words moved to the parent's
`## Disposition`, and the reason the question was closed written on the parent
before the file goes, so that a deletion is never the only record of itself.

The evidence is this sitting: the AI took `alignment-page-observations` from the
periagogic stage to the review stage so that a prune the author had already
directed could be asked at a row, and the author struck that as ceremony. The
cost the clause was paying is one clean-context reading and one ruling per node
pruned, on a frontier where the independence test is expected to reach several.

#### prune-delegated-with-two-bounds

The four tests stand, and the remedy's last clause is replaced by a delegation.
This answer says of a node already standing that "the author rules the prune,
since while it stands it puts a rulable row on the alignment page and that row is
where the prune is asked". Under this option the author does not rule it, because
the author has delegated it: pruning is the AI's under the general delegation of
graph topology, and the row is not where an unratified prune is asked.

Two bounds hold, and they are the whole of the delegation's safety, in the
author's own words of 2026-09-06. A ratified node may not be pruned: its answer
is a thing the author committed to, and withdrawing that commitment is theirs.
And anything from the author on the node — their words above all, but anything
the record holds as theirs — must be transferred to another node before the prune,
so that a deletion never destroys something only the author could have given. To
those the record adds what it already required of the remedy above and which the
delegation does not touch: the survivor recorded on the parent, the account
folded into it, and the reason the question was closed written down before the
file goes.

The option it supersedes, `prune-granted-in-dialogue-needs-no-row`, read the
author's words of 2026-09-05 as a grant to be given case by case, which is what a
grant is under `authority`. The author's next words made it a disposition, so the
narrower reading is passed over rather than struck: it stays on the list because
the author may yet prefer that a prune be asked for each time, and because the
difference between the two is exactly the difference between a grant and a
delegation, which is the thing the author is deciding.

What this option does not settle is which node holds the general delegation of
graph topology the author names. No node of the record asks what that delegation
covers, so the delegation is recorded here, on the node whose remedy it changes,
and named as reaching further than this node's own question. That gap is on the
frontier and is not filled by minting a node for it, since a carrier is not
inferred from an input.

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

### The grant to reconcile the skills, 2026-09-04

Asked whether the rule requires reconciliation with the skills, the sitting
answered that it does, at four loci, each stating the parent's third limb by
its conclusion alone: the draft brief and the survey brief of the
clean-context review, which tell a reader that an answer standing as an
answer to a question of the record is a node and give it no test to apply; the
record brief, which still draws the line by what the author meant; and the
align skill's probes bullet, which states the three limbs and cites only the
parent. The applying script needs nothing, since promotion and demotion are
the main thread's edits. The author granted bootstrap authority for that
reconciliation, in the words above, and it lands on the implementation ref
under this node, which stays unanswered: the four tests go into both reading
briefs put to the response, the survey brief gains the independence test as a
validation of its own for a node standing under an unanswered parent, the
record brief takes the redrawn line, and the align skill cites this node.

### Applied to the graph, 2026-09-04

Three units on opus, one per third of the graph, ran only what the two earlier sweeps had not: the ruling, scope, and survival tests, and the independence test in its new tell, in both directions, over 125 nodes and 21 probes, reporting deltas only, with a coverage list naming which test settled each node and each probe. Nine deltas and two informational notes came back; the main thread's disposition of each is on the account of `commons.systems/disposition-graph/author-questions`. What the application taught the rule, written into the answer above: the independence test's remedy as first drafted said the node "is re-encoded as a probe", which is right for a question found at recording and wrong for a standing node, which the asymmetry paragraph of the same answer says only a prune can demote; the two sentences now agree, and the fold of `commons.systems/disposition-graph/hexis` was done the second way. And the ruling test met the author's words of 2026-09-04 on review head on, in two entries whose response could be a delegation; that collision is the probe above, and the entries stay probes until it is answered. The scope test's remedy, that every moved node enters the question in `depends`, met the validator's cycle check twice, on dialogue to authority and on alignment-page to growth, and was not written there; the rule does not say what to do where the edge would close a cycle, and the readings should say whether it needs to.

### The grant renewed, 2026-09-04

The application amended the independence test's remedy above, distinguishing a question found at recording from a node already standing, and the author renewed the grant to carry the rule into the skills in the words quoted under `## Disposition`. Reconciled under it, on the implementation ref: the alignment skill's probes rule, whose re-encoding sentence now carries the standing-node form; the survey brief's sixteenth validation, whose proposal now names the survivor on the parent and the prune on the child's existence fact, the child being a node already standing whenever a survey reads it; and the survey skill's statement of what it runs, which now counts the sixteenth. The draft brief and the record brief state the rule for a question found at recording and needed no change.

### Where a pruned node's words go, 2026-09-06

This answer's remedy says that when a node is re-encoded on its parent, "any
words of the author's on it move to the parent's `## Disposition`". The prune of
`alignment-page-observations` on 2026-09-05 met that in substance and not in
form, and the discrepancy is worth the record because it will recur wherever the
independence test reaches a node minted by a decomposition.

That node held nine of the author's observations. One of them, with the heading
line and the words that queued the sitting, stands on the parent's
`## Disposition`. The other eight stand verbatim on the eight children that own
them, one apiece, and on the parent nowhere. Nothing was lost, so the prune's
condition held; but the words are distributed and not gathered, and a reader of
the parent's `## Disposition` does not meet eight of the nine.

The question this leaves is which the remedy wants, and it is not decided here.
Gathering them on the parent puts every word the author said on the question they
said it about, which is the parent's question, and makes the parent's
`## Disposition` the complete record of the dialogue that produced its children.
Leaving them with the children puts each word beside the decision it bears on,
which is where a reader ruling that decision needs it, and avoids nine bullets
appearing twice in a record whose whole discipline is that the prose argues and
the structure records. A third reading is that the remedy already means the
second, since a decomposition's children are where the words moved *to*, and the
clause was written for a node whose words had nowhere else to go.

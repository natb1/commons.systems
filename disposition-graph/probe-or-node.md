---
question: When is an open question a probe, an option, or a node?
stage: maieutic
probes:
  - id: does-the-standing-prune-grant-act-wherever-given
    asks: >-
      Does the prune grant the author made standing on 2026-09-06 ("the prune
      grant is standard disposition") act wherever it was given, in the dialogue
      or at the node's row, as a standing direction about a class of act, or only
      for the node it was given about, as what-acts-during-bootstrap's definition
      of a grant, one named reconciliation of one unanswered node, would have it?
    fact: answer
    why: >-
      The recommended text's interim takes a directed prune on the author's word
      wherever it was given; two re-readings of 2026-09-07 held that this exceeds
      a grant's scope under what-acts-during-bootstrap and that the text applies
      an authority whose standing is unruled, and the cap of two readings sends
      the surviving finding to the author rather than to a third reading. The
      option a-standing-direction-acts-by-right on what-acts-during-bootstrap
      asks the same question from that node's side.
    discharges: >-
      The author's answer is recorded as a ruling on that option, or as words
      here that narrow or keep the interim's scope; the fence is amended to match
      and read once more.
    source: review
    raised: 2026-09-07
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
    status: discharged
    reason: the author answered it on 2026-09-07, under `## Disposition`, sending the question back to this node's own ruling test and holding that an intent which is a persistent disposition takes a node of its own
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
        reason: "what supersedes it is the author's own standing disposition of 2026-09-06 once it is ruled and not before: that disposition delegates the pruning of unratified nodes rather than granting it case by case, and a delegation confers nothing until `commons.systems/disposition-graph/graph-topology`'s authority fact is ruled `delegated`. Its case-by-case half is carried in the meantime by `interim-follows-the-authors-word`, which takes a prune the author has directed in their words on that word alone, so the words of 2026-09-05 have effect in both periods; it stays on the list because it is the option under which the case-by-case grant is the standing rule rather than the interim"
      - name: prune-delegated-with-two-bounds
        source: author
        ref: "2026-09-06"
        status: passed
        reason: "it writes the delegation into the prose of an answer, where no ruling can confer it, and a class the AI writes for itself is not a grant; the delegation it holds moves to `commons.systems/disposition-graph/graph-topology`, and it stays on the list because the author may prefer the remedy to carry the rule rather than cite it"
      - name: node-by-default
        source: ai
        ref: "2026-09-04"
      - name: delegation-carried-by-its-own-node
        source: author
        ref: "2026-09-07"
      - name: interim-follows-the-authors-word
        source: review
        ref: "2026-09-07"
    recommends: interim-follows-the-authors-word
    boldness: moderate
    against: "Four of the five paragraphs of the recommended answer are the AI's own: the three tests put to the response, the independence test, the two refusals and the tie-break were drawn in one sitting from the failure the author named and are not yet worn by use, and the survival test asks the recorder to predict whether a response will be needed later, which is a judgment about the future of the record and not a fact a reading can check today. On the clause that moved, sending the prune to a node of its own does not answer the case against the delegation, it only moves where the author rules on it: the power at issue is deletion, which `class-recommendation` names irreversible, conferred on the party that also finds the node redundant; the bound `may not prune something that is ratified` excludes nothing in the record as it stands, no option on any node carrying a ruling; and the second bound, that anything of the author's be transferred first, is checked by the same session that wants the file gone. The delegation is still a forward reference, acting only when `commons.systems/disposition-graph/graph-topology`'s authority fact is ruled, so what the author confirms here about the standing rule is where it will be answered and not what it says. And the interim is now the one part of this answer that acts today: it hands an untested discriminator a deletion before the node that would confer the power has been ruled, and which of the author's words reached a particular prune is read by the same session that wants the file gone, with nothing but that session's account to check it."
    stands: by-what-the-response-does
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The rule decides what the author is asked to rule on and what they are merely asked, which is the shape of decision the record escalates toward ratified, since a recorder who may delegate it to itself decides its own accountability; but the author may hold the four tests to be operating detail under the parent's ratification and delegate them with it."
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: low
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-07
  of: 9a509a986a11feab5e49e4818d29b83b03547e08
  commit: f0325d88ed52196f0551e86a7e6830e724f93c4b
  against: "The amendment can be read as a real repair rather than a relocation: by explicitly disclaiming reliance on the unruled 'a-standing-direction-acts-by-right' option ('rests... on nothing that node confers until the option is ruled') it stops claiming record-conferred authority altogether and instead treats the interim as a bounded, honest description of what one session does on its own account -- the same posture the fact's own `against` and the option's own prose already concede and price in ('honoured on trust', 'the same session that wants the file gone'). Read that way there is no new claim of right, only an accurate label for a stopgap already disclosed elsewhere on the node, and the remaining objection is to the interim's existence (already argued and already priced into its moderate boldness), not to anything this diff newly asserts."
  survey:
    date: 2026-09-07
    of: 7bd00f2a353005aebe5c3a8f16a0a381deb8ebe6
depends:
  - commons.systems/disposition-graph/graph-topology
  - commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right
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

The author, 2026-09-07, asked the open probe on this node as an edge case, a maieutic probe whose answer would be a delegation, and where that delegation is recorded:

> what does the current disposition with guidance about recording meiutic probe vs. new node have to say about this (what is the AI recommendation)? That guidance probably answers this. If author's intent is a peristent disposition, then it may require a new node to be reconciled into the alignment skill.

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

`interim-follows-the-authors-word` is recommended. It is `delegation-carried-by-its-own-node` with one clause changed, and it keeps `by-what-the-response-does` whole — the four tests, put to the response and not to the question, are what the two sweeps of 2026-09-04 lacked and what a reading can check — and it changes one thing: the independence test's remedy names the delegation that takes a standing node's prune rather than carrying it. The author's words of 2026-09-06 grant that delegation, and this node's own ruling, scope and survival tests all return `node` when they are put to those words: the response is "delegated, do not ask me again", which only a disposition carries; it is already quoted on three nodes and bears on `recording`, `frontier-consistency` and `viable-options`, which is doctrine reaching below it; and every later session that prunes anything needs it on its own account. A rule that fails its own tests on its newest clause cannot be put to the author, and the author said the same thing on 2026-09-07: "If author's intent is a peristent disposition, then it may require a new node to be reconciled into the alignment skill." The node is `commons.systems/disposition-graph/graph-topology`, minted with this answer and entered in `depends`, and the delegation acts from a ruling of `delegated` on its authority fact, which is where the record confers a class. What the recommended option changes is the interim, the period between a ruling here and a ruling there. `delegation-carried-by-its-own-node` sends every prune of a standing node to the existence fact's row until `graph-topology` is ruled, and that reinstates for an unbounded period exactly what the author struck in their own words on this node: "Pruning doesn't require confirmation of explicitly granted in dialogue. just prune it", scoped the same minute to unratified nodes. Under the recommended option a prune of a node no ruling reaches that the author has directed in their words is taken on that word wherever it was given, in the dialogue or at the row, because a grant given in the author's words is what `commons.systems/disposition-graph/what-acts-during-bootstrap` holds acts by right while nothing in the record is ratified, so honouring it needs no class and writes none; the row is how a prune is asked where no word has been given, and a ratified node's prune is asked at the row in either period. `delegation-carried-by-its-own-node` stays on the list and is not passed over, since the two differ in the interim alone and the author may hold that nothing should move before the delegation is ruled.

Boldness stays moderate. What moved is the author's twice over — the delegation, its two bounds and the direction to give it a node on 2026-09-06 and 2026-09-07, and now the interim, which is their words of 2026-09-05 read as `commons.systems/disposition-graph/what-acts-during-bootstrap` reads any grant given in the author's words — but boldness is a property of the recommendation, which is the whole recommended text, and most of that text is the AI's construction, as this fact's `against` concedes. The delegation clause and the interim are the author's; the four tests are not, and a low boldness would report the provenance of the amendments in place of the provenance of the answer.

`prune-delegated-with-two-bounds` is passed over and stays on the list. It carries the same delegation and the same two bounds, and it writes them into the prose of this answer, where no ruling can reach them; `authority` holds that a node's class is read off the rulings recorded on its facts and that a class the AI writes for itself is not a grant, so the one thing that option cannot do is confer the power it describes. It is passed rather than struck because the difference between the two is where the delegation is recorded and not whether it is given, and the author may hold that a rule about probes should carry its own remedy rather than cite one. `prune-granted-in-dialogue-needs-no-row` keeps its place for the same reason, being the same words read as a grant given case by case; what supersedes it is the standing delegation once `graph-topology` is ruled and not before, and until then its case-by-case half is carried by the recommended option's interim, which is why neither is struck and why the two are not one option. `by-what-is-asked` is the parent's line and the sweeps' instrument, and it is kept viable because it may be all the author wants, with wording as the test and the sweeps' result accepted; the prune it ends in is asked on the existence fact below and not here. `node-by-default` is kept because the reverse sweep worked under it and the author may hold that its asymmetry is the right one at recording too.

#### by-what-is-asked

The parent's third limb as it stood before this sitting: a question of the record asks what something should be, a probe asks what the author meant by words they have already said, and the recorder classifies by which is asked. Viable if the author holds the sweeps' result to be complete and the line to want no more than wording; under this option the parent's limb is restored to its former sentence and this node has nothing left to answer. The prune that follows is not this option's to take: deleting the node is never an answer option, because an answer option is a candidate answer to this node's question and deleting the node answers nothing, so the prune is asked on the existence fact below, with this option as its ground, and the author rules the node's life as its own decision.

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

Passed over on 2026-09-07, after the clean-context reading of that day, and kept
on the list. What it does not settle is which node holds the general delegation of
graph topology the author names, and it answers that by holding the delegation
here, in the prose of an answer whose question is a classification rule. That is
the one place the record cannot put it. `authority` holds that every answer
carries its authority in the rulings recorded on its facts, that no stamp is
written beside them, and that a class the AI writes for itself is not a grant; a
delegation written into a sentence is exactly such a class, conferred by nothing
the author can rule on, and the power it confers is the one the record calls
irreversible. The bounds do not close that: `may not prune something that is
ratified` excludes no node in the record as it stands, since no option on any node
carries a ruling, and the transfer of the author's words is checked by the same
session that wants the file gone. `delegation-carried-by-its-own-node` keeps
everything this option holds and moves it to `commons.systems/disposition-graph/graph-topology`,
where the two bounds are read off a ruling on an authority fact. The option stays
listed because the author may hold that a remedy should carry its own rule rather
than cite one, and because it and its successors differ in where the delegation is
recorded and not in whether it is given. What a ruling for it would do to the node
this sitting minted is worth saying, since `depends` puts that node first: it makes
`commons.systems/disposition-graph/graph-topology`'s question redundant, because the
same delegation with the same two bounds would then stand in two places, which is
the update anomaly `commons.systems/disposition-graph/codd-update-anomaly` names, so
that node's existence fact would move to `prune` and its question would be answered
by nothing. The author is choosing between two homes for one delegation and not
between two delegations.

#### node-by-default

Wherever the recorder cannot classify a question, it mints a node, on the reverse sweep's asymmetry: a node wrongly kept costs an entry on a long frontier, and a probe wrongly recorded may lose a question the author asked for. Viable if the author weighs a lost question above a rulable row they did not want; under this option the four tests stand and only the tie-break flips.

#### delegation-carried-by-its-own-node

The four tests stand and the remedy's last clause names the delegation rather
than carrying it. A node of its own under `commons.systems/disposition-graph/authority`,
`graph-topology`, asks what the recorder may do to the graph's topology without
asking, carries the author's words of 2026-09-06 with their two bounds, and takes
its own authority fact, on which a ruling of `delegated` is what confers the
pruning power; this node's remedy then says that a standing node the independence
test reaches is pruned under that delegation once it is ruled, and that until then
the existence fact and its row are how the prune is asked. The node is entered in
`depends`, so the recommendation here waits on it as the scope test's remedy
requires.

Viable because it is what this node's own ruling, scope and survival tests return
when they are put to the author's words of 2026-09-06, and what the author's words
of 2026-09-07 propose in terms; and because it puts the delegation where a ruling
can confer it, a class being read off a ruling on an authority fact and never off
prose in an answer. What it costs is a forward reference: until the new node is
ruled the remedy acts through the row, so nothing about a prune changes on the day
this option is confirmed, and the author is confirming where the question will be
answered rather than answering it. That is the honest shape of it, and it is why
`prune-delegated-with-two-bounds` stays on the list for an author who would rather
settle both at once.

#### interim-follows-the-authors-word

Everything `delegation-carried-by-its-own-node` says, with the interim changed.
The four tests stand; the delegation that takes a standing node's prune is
carried by `commons.systems/disposition-graph/graph-topology` and named here
rather than written into this answer; and the node is entered in `depends` as
the scope test's own remedy requires. What differs is the period between a ruling
here and a ruling there. Under the option above, every prune of a standing node
waits at the existence fact's row until that node's authority fact is ruled
`delegated`. Under this one, a prune of a node no ruling reaches that the author
has directed in their own words is taken on that word wherever it was given, in
the dialogue or at the row; the row is how a prune is asked where no word has
been given; and a ratified node's prune is asked at the row in either period.

Viable because a grant given in the author's words is what
`commons.systems/disposition-graph/what-acts-during-bootstrap` holds acts by
right while nothing in the record is ratified — "a grant is the author's word,
given for one named reconciliation of one unanswered node" — so honouring such a
word needs no class and writes none, and the interim it replaces was the one
clause of this answer that denied it. It is the only option on this fact under
which the author's words of 2026-09-05, "Pruning doesn't require confirmation of
explicitly granted in dialogue. just prune it" and, the same minute, "(Pruning of
unratified nodes that is)", have any effect between now and a ruling on a node
minted on 2026-09-07.

What it costs is that the word is read by the session that wants the file gone:
nothing but that session's own account says which prune a word of the author's
reached, and the interim therefore carries by trust what the delegation, once
ruled, carries by a ruling with its bounds read off a fact. That is the case this
fact's `against` states, and it is bounded by the same scope the author drew,
since a node the author has ruled is asked at its row in either period. Raised by
the clean-context reading of 2026-09-07, whose `viability` field carries this
prose.

### authority

`ratified` is recommended on two of the three limbs `commons.systems/disposition-graph/class-recommendation` names, and either would carry it. Capture-shaped: the rule decides what the author is asked to rule on and what they are merely asked, so the party that would set it is the party it exists to check, and a recorder that may classify its own questions decides its own accountability. Irreversible: since 2026-09-07 the independence test's remedy reaches a deletion — "Irreversible means it is not paid back at all: a deletion, a swap, a landing that other work is built on" — and while the delegation that takes that deletion is now recorded on `commons.systems/disposition-graph/graph-topology`, the test that fires it is this node's, so a wrong test here is not paid back either. That is what makes a wrong ruling on this node unrecoverable rather than merely expensive, and it is the limb the reading of 2026-09-07 found missing. Boldness low: the escalation is the record's own test applied to a rule whose subject-matter is what the author sees, and the author may still hold the four tests to be operating detail under the parent's ratification and delegate them with it.

### existence

Keep. This node's question — when an open question is a probe, an option, or a
node — is answered by no other node, its four tests are what three movements of
2026-09-04 and two readings have worked on, and `commons.systems/disposition-graph/frontier-consistency`'s
sixteenth validation, the alignment skill and the survey brief all run against it,
so nothing here folds into the parent without leaving those three pointing at
nothing.

Prune: the option `by-what-is-asked` ends in one. Under it the parent's third limb
is restored to the sentence it had before this sitting, the line is drawn by what
is asked, and this node has no question left of its own. The prune is asked here
and not on the answer fact, because deleting the node is never an answer option:
an answer option is a candidate answer to this node's question, and deleting the
node answers nothing. Recorded on 2026-09-07 so that the author rules the node's
life as a decision of its own rather than taking it as a consequence of a ruling
they gave on the answer.

## Recommendation

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---
## Answer

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted where its question belongs under the record's own placement rule, which is what it refines, and entered in the blocked node's `depends`, since `depends` is what records the blocking and `under` what a node refines; the parent's third limb is amended with it.

Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.

The ruling test. Would the author's response be a ruling or an answer? A ruling confirms, edits, or denies a recommendation and confers a class, and an answer says what the author intends. If it would make sense for the author to respond "delegated, do not ask me again" or "deferred, I will return to it", the question is a node, because only a disposition carries a class; a probe's answer cannot be delegated, since there is no one but the author who can say what the author meant, and cannot be deferred, since a deferred probe is a recommendation the AI could not ground standing in front of the author, which the parent forbids.

The scope test. A probe bears on the recommendations of one node, and its `discharges` names them. A question whose answer would move recommendations on more than one node, or would bind nodes not yet written, is doctrine reaching below it, which is what a node's answer does and a probe's cannot; it is a node, and every node it would have moved enters it in `depends`.

The survival test. Would anything need the response after the recommendation it moved has been ruled on? A probe dies with the dialogue, and what survives of it is the author's words and the rationale that quotes them; a response that a later sitting, a reading, a projection, or a reconciliation would need on its own account survives the dialogue, and what survives the dialogue is a node.

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is re-encoded on the parent the same way but is not struck by the recorder: the survivor is recorded on the parent, the account folds into it, the author's words move with it, and the reason the question was closed is written down before the file goes. Who then takes the prune is not this node's to say, and this node does not confer it: the prune of a standing node is taken under the author's delegation of graph topology, which is recorded on `commons.systems/disposition-graph/graph-topology` and acts only when that node's authority fact is ruled `delegated`; until then a prune of a node no ruling reaches that the author has directed in their own words is taken on that word wherever it was given, in the dialogue or at the node's row, on the author's words of 2026-09-06 that the prune grant is standard disposition, a standing direction about a class of act rather than a grant given case by case; that such a direction acts by right is what the what-acts-during-bootstrap node's option `a-standing-direction-acts-by-right` records against that node's own definition of a grant, which reaches one named reconciliation and no class, so the interim rests on the author's words and on nothing that node confers until the option is ruled, and where no such word has been given the node's existence fact moves to `prune` with this test as its reason and the row asks the author. A ratified node's prune is asked at the row in either period. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.

Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node, once minted, stands until it is pruned, and while it stands it puts rulable rows on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.

## Rationale

The parent's admission test draws its third limb by what is asked, should be against meant, and the two sweeps of 2026-09-04 that applied it found no node in the graph mis-encoded, which the author did not believe. The sweeps were not careless; the test cannot fail against its asker, because the wording of a question is the one thing the asker controls, and a discriminator that reads wording will pass whatever was written in the shape the writer chose. The reverse sweep's third check, the work a node does in the record, was the one check on that sweep that looked past wording, and it looked at incumbent work only, so a node nothing rests on yet passed it by silence. What the four tests share is that they are put to the response and not to the question: the class it could carry, the nodes it would reach, its life after the ruling, and its independence from its parent are all facts about what a disposition is that a probe cannot counterfeit, and each is checkable by a reading against the record as it stands.

The tie-break reverses between recording and review, and the answer says so rather than choosing one, because the cheaper error is different in the two: at recording a probe is promotable and a node is not demotable, so the probe is the reversible choice; at review the node already stands and may be the author's, so keeping it is.

The independence test's remedy stops where it does because of the rule this node states about itself. The author's words of 2026-09-06 delegate the prune of an unratified node, and put to the four tests above those words return a node on three of them: the response is a delegation, which only a disposition carries; it reaches `recording`, `frontier-consistency` and `viable-options` besides this one; and every later session that prunes anything needs it on its own account. So this rule says which nodes the test reaches and what a prune must leave behind, and `commons.systems/disposition-graph/graph-topology` says who may take it and under what bounds. A rule that conferred the power in its own prose would be conferring a class the record can only read off a ruling.

Readings owed under this node, each surfaced by the second evaluation and named here rather than minted: the distinction between a question of law and a question of fact, for the whole rule, the finder of fact answering what was intended and the court answering what binds, and for the survival test, since a finding of fact binds no later case and a holding does; the request for information against the change order in construction contracting, for the same line drawn where the drawings are the record, an RFI clarifying what the drawings mean and a change order altering what the contract requires, and for the rule that an RFI whose answer alters the contract is re-issued as a change order, which is the promotion clause; the erratum against the revising document in the IETF's practice, for the survival test, an erratum being consumed by the text it corrects; the parol evidence rule, for the ruling test's other face, that what a party intended is evidence and not term; and the issue-based information system already owed on the node node, for the difference between an issue, which stands, and a question put to a participant, which does not. The certified question and IEEE 830's TBD are already owed on the parent and are not repeated.
```

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

### The recommendation moved to the author's delegation, 2026-09-07

Under the author's words of 2026-09-07 granting the reconciliation of the
alignment dialogue, and on the words of 2026-09-06 already quoted above, the
recommendation on the answer fact moves from `by-what-the-response-does`, which
stands, to `prune-delegated-with-two-bounds`, and the recommended text carries
the remedy's last clause as the delegation rather than as a ruling the author
gives. Nothing else in the four tests moves. The node stays at the maieutic
stage, a reading of the recommendation as it now stands is owed, and the gap the
option names, which node holds the general delegation of graph topology, is
still open.

### The probe discharged on the author's words, 2026-09-07

The probe `a-delegable-review-finding-question` was put to the author as an edge
case: a maieutic probe whose answer is "do it your way, and do not ask me
again", which is a delegation, and a delegation is a ruling on a fact that a
probe does not have. The author sent the question back to this node's own
rule, the ruling test, and added that an intent which is a persistent
disposition may take a node of its own, to be reconciled into the alignment
skill. That answers the probe's `why`: their words of 2026-09-04 on the review
node, that review-finding questions are maieutic, were about where such a
question is asked, the interview, and not a bar on the node that a delegation
needs to land on. The recommendation does not move, since the ruling test
already says so, and the probe is discharged with their words.

### Clean-context review, 2026-09-07, of 9d514d00

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `prune-delegated-with-two-bounds`.

Findings:

- Validation 2, doctrine, an adopted contradiction that is not recorded. The `## Recommendation` fence's independence-test paragraph says: "A node already standing is pruned by the recorder, under the author's delegation of graph topology given on 2026-09-06 and within its two bounds... The survivor is recorded on the parent the same way, the account folds into it, and the reason the question was closed is written down before the deletion; no row on the alignment page asks the prune, and no grant is sought for it." `commons.systems/disposition-graph/recording` says the opposite in both its standing answer -- "A ruling that the node not exist is recorded before the node is deleted, on the node that proposed the prune where one did and otherwise on the parent, so the record keeps the reason a question was closed instead of losing it with the file" -- and in the text it now recommends, `per-fact-after-two-readings`: "A ruling that the node not exist, given on its existence fact, is recorded before the node is deleted". The draft keeps the reason and drops the ruling, and adopts the conflict rather than recording it, which validation 2 forbids: "what would contradict doctrine is never adopted by a recommendation; it is recorded as an option on the node it conflicts with". Proposal for the session, this reading proposing and never writing: an option on `commons.systems/disposition-graph/recording`, name `prune-of-an-unruled-node-needs-no-ruling`, source `commons.systems/disposition-graph/probe-or-node`, prose: "Where no ruling reaches the node, the prune needs no ruling: the recorder takes it under the delegation of graph topology, writes the reason the question was closed on the parent before the file goes, and the requirement that a ruling precede the deletion binds only a node the author has ruled." And the draft's own clause should say in terms that it departs from `recording` and where the option stands.
- Validation 2 and validation 3, a clause this node seeded elsewhere and now reverses without naming what goes stale. `commons.systems/disposition-graph/frontier-consistency`, in the text it recommends, carries as its sixteenth validation: "the child being a node already standing, that its existence fact moves to `prune` with the test as its reason and the author rules the prune at the child's own row" -- an option, `sixteenth-validation-independence`, whose source is this node. Two materialized loci carry the same sentence, verified at this commit: `.claude/skills/align/SKILL.md` lines 467-468, "the node's existence fact moves to `prune` with the test as its reason, and the author rules the prune at the node's own row", and `packages/clean-context-review/brief-survey.md` line 36, "its existence fact moves to `prune` with this test as the reason and the author rules the prune at the child's own row". Both were reconciled from this node under the author's grants of 2026-09-04, and the amended remedy falsifies all three. The account's paragraph "The recommendation moved to the author's delegation, 2026-09-07" names none of them, where the accounts of the two earlier grants named every locus they touched. Proposal: an option on `commons.systems/disposition-graph/frontier-consistency`, name `independence-prune-taken-under-the-delegation`, source `commons.systems/disposition-graph/probe-or-node`, prose: "The sixteenth validation's proposal reports the prune as taken by the recorder under the delegation of graph topology where the child carries no ruling, and names the author's row only for a child that does"; and the account should name the two implementation loci the amendment leaves stale, so the reconciliation is ruled and not discovered.
- Validation 15, the merge: the delegation the draft carries is a question of its own, and the draft's own tests say so. The option `prune-delegated-with-two-bounds` concedes it: "What this option does not settle is which node holds the general delegation of graph topology the author names. No node of the record asks what that delegation covers, so the delegation is recorded here, on the node whose remedy it changes, and named as reaching further than this node's own question. That gap is on the frontier and is not filled by minting a node for it, since a carrier is not inferred from an input." Put the author's words of 2026-09-06 to this draft's four tests and all three that can settle it return `node`. The ruling test: the response is "pruning authority is granted to AI under general delegation of graph topology", which is a delegation, and the draft says "If it would make sense for the author to respond 'delegated, do not ask me again'... the question is a node, because only a disposition carries a class." The scope test: verified, the same words are already quoted on three nodes -- `disposition/disposition-graph/probe-or-node.md` line 104, `disposition/disposition-graph/dialogue.md` line 379, `disposition/disposition-graph/alignment-page.md` line 2548 -- and bear besides on `recording`, `frontier-consistency` and `viable-options`, which is "doctrine reaching below it, which is what a node's answer does and a probe's cannot". The survival test: every later session that prunes anything needs the response on its own account. The author said the same on 2026-09-07, under `## Disposition`: "If author's intent is a peristent disposition, then it may require a new node to be reconciled into the alignment skill." The record has meanwhile begun treating this node as the carrier by default -- `dialogue`'s account of 2026-09-06 says "The rule itself is recorded on `commons.systems/disposition-graph/probe-or-node`" -- which is the drift a carrier settled by default produces. Proposal: mint a node under `commons.systems/disposition-graph/authority`, question "What may the AI change in the graph's topology without asking?", carrying the author's words of 2026-09-06 and their two bounds, with its own authority fact on which a ruling of `delegated` is what confers the power; enter it in this node's `depends`; and let this node's remedy cite it rather than carry it.
- The viability judgment, and the reason for the kickback: a viable option is missing, and it is the one the author themselves named. No option on the answer fact keeps the four tests while sending the delegation to a node of its own; the list offers only the delegation carried here (`prune-delegated-with-two-bounds`), the grant given case by case (`prune-granted-in-dialogue-needs-no-row`, passed over), the row (`by-what-the-response-does`, which stands), the parent's line (`by-what-is-asked`), and the tie-break flip (`node-by-default`). Suggested option, name `delegation-carried-by-its-own-node`, source author, ref 2026-09-07, prose: "The four tests stand and the remedy's last clause names the delegation rather than carrying it. A node of its own under `authority` asks what the AI may change in the graph's topology without asking, carries the author's words of 2026-09-06 with their two bounds, and takes its own authority fact, on which a ruling of `delegated` is what confers the pruning power; this node's remedy then says that a standing node the independence test reaches is pruned by whoever that node's answer says, and enters it in `depends`. Viable because it is what this node's own ruling, scope and survival tests return when they are put to the author's words of 2026-09-06, and what the author's words of 2026-09-07 propose; and because it puts the delegation where a ruling can confer it, the class being read off a ruling on an authority fact and never off prose in an answer." A rule whose own tests it fails on its newest clause cannot be put to the author as it stands, and the option set is drawn out at the maieutic movement, which is where this goes back to.
- Validation 3, facts: the boldness. The answer fact carries `boldness: low`, and the rationale explains it as "the option `prune-delegated-with-two-bounds` carries the reading and the recommendation moved to it on the author's words, which is why the boldness is low." That reasons from why the recommendation moved, where `dialogue` defines boldness as "how much of it rests on the AI's own knowledge against the record and the author's words" -- of the recommendation, which is the whole recommended text and not the clause that changed. Four of the five paragraphs of the recommended `## Answer`, the three tests put to the response, the independence test, the two refusals and the tie-break, are the AI's own construction, which the fact's own `against` concedes: "The four tests are the AI's own, drawn in one sitting from the failure the author named and not yet worn by use". Suggested edit: `boldness: moderate`, with the fact's reason distinguishing the delegation clause, which is the author's words, from the tests, which are not.
- Validation 3, facts: the case against was not moved with the recommendation. The answer fact's `against` reads "The four tests are the AI's own... and the tie-break toward the probe rests on an argument about which error is cheaper that the author has not confirmed." That is the case against `by-what-the-response-does` as it stood before the move; it says nothing against the clause that moved, which is the one conferring a power of deletion. The strongest case against that clause is checkable and absent: the bound "a ratified node is never pruned" excludes no node in the record as it stands, since no option on any node carries a ruling -- verified, `grep -rn "^        ruling:" disposition/` returns nothing and the one `response: confirm` in the graph, at `disposition/disposition-graph/dialogue.md` line 1362, is inside a fenced example of a superseded encoding. Suggested edit: append to `against` a clause saying that the delegation's only stated limit is inoperative for the whole record today, and that the second bound, the transfer of the author's words, is checked by the same party that wants the file gone.
- Validation 3, facts: a prune riding on the answer fact. The option `by-what-is-asked` ends "under this option the parent's limb is restored to its former sentence and this node is pruned", and the node carries no `existence` fact -- verified in `disposition/disposition-graph/probe-or-node.md`, whose `facts:` block holds `answer` and `authority` only. The encoding puts a prune elsewhere: "Deleting the node is never an answer option: it is the `existence` fact, because an answer option is a candidate answer to this node's question and deleting the node answers nothing." As it stands a ruling for `by-what-is-asked` would take the node's life through the answer fact, which is not a decision the author is asked separately. Suggested edit: add an `existence` fact with `keep` recommended and `prune` listed, the prune's ground being `by-what-is-asked`, so the author rules the node's existence as its own decision.
- Validation 3, a consequence of the amendment the account does not name. One node in the record is reached by the amended remedy today: `commons.systems/disposition-graph/hexis`, whose frontmatter carries an `existence` fact recommending `prune` at `boldness: low` and which stands at the maieutic stage awaiting the author -- verified in `disposition/disposition-graph/hexis.md`. The account's paragraph "Applied to the graph, 2026-09-04" records that "the fold of `commons.systems/disposition-graph/hexis` was done the second way", which is the existence fact moved to `prune` for the author to rule. Under the recommended text the recorder takes that prune and no row asks it, so the first effect of ratifying this amendment is the deletion of a node already queued for the author's own ruling. Suggested edit: name `hexis` in the account and say whether a prune already put to the author at a row is taken by the recorder under the new clause or left where the author can still meet it, since the author is entitled to know which of their pending rows the amendment closes.
- Validation 3 and `class-recommendation`, the authority reading. The `### authority` subsection reads: "`ratified` is recommended because the rule decides what the author is asked to rule on and what they are merely asked, which is the recorder deciding its own accountability, and the record escalates toward ratified where being wrong is capture-shaped." It names one limb, and with the recommendation moved the node now confers a power of deletion, which `class-recommendation` places under a second: "Irreversible means it is not paid back at all: a deletion, a swap, a landing that other work is built on." The recommendation does not change -- `ratified` is right on either limb -- but the reading behind it is now incomplete on its face. Suggested edit: name the irreversible limb beside the capture-shaped one, since the deletion is what makes this ruling unrecoverable rather than merely expensive.

On the facts and what they recommend: The answer fact recommends `prune-delegated-with-two-bounds` at `boldness: low` against `by-what-the-response-does` standing, so a `## Recommendation` fence is required and is present, and it parses as the same question with `form: rule`, `under: author-questions` and none of the dialogue's own keys, as the encoding requires; no pin is stale because neither reading has run. The boldness is wrong on the record's own definition and the fact's `against` was not moved with the recommendation, both above. The authority fact recommends `ratified` at low boldness with a written reading, correct on the capture limb and now incomplete on the irreversible one; no `persistence` fact is owed, the amendment declaring and liquidating no shim and touching no evidence, and an `existence` fact is owed for the reason given above.

On the viability of the options: Every option listed is viable and none is misfiled: `by-what-the-response-does` stands and remains the author's to keep, `by-what-is-asked` is the parent's line and stays viable while the author may hold the sweeps' result complete, `node-by-default` keeps the reverse sweep's asymmetry on the table, and `prune-granted-in-dialogue-needs-no-row` is passed over on a sound reason, the author's words of 2026-09-06 having made standing what 2026-09-05 gave case by case, and it correctly keeps its place on the list. One viable option is missing, and it is the pivot of this reading: `delegation-carried-by-its-own-node`, source author, ref 2026-09-07, whose prose is given in the fourth finding above -- the four tests stand and the remedy's last clause names rather than carries the delegation, which goes to a node of its own under `authority` with its own authority fact, on which a ruling of `delegated` is what confers the pruning power. It is viable because it is what this node's own ruling, scope and survival tests return when put to the author's words of 2026-09-06, and it is what the author's own words of 2026-09-07 propose; without it the author never gets to rule on the only reading of their words that puts the delegation where the record can confer one.

Strongest counter-argument (strong): The record's architecture rests on there being no stamp: a class is read off a ruling recorded on a fact and is never written in prose, because a class the AI writes for itself is not a grant. This draft writes a delegation into the prose of an answer whose question is a classification rule, and the delegation it writes confers the one power the record calls irreversible, deletion, on the party that also decides which node is redundant -- the recorder both finds the node dominated by its parent and takes the file, which is the shape `segregation-of-duties` and `deprecation-not-deletion` are held in this record to name. The two bounds do not bind where it matters: "may not prune something that is ratified" excludes nothing at all today, since no node in the record carries a ruling, and the second bound, that the author's words be transferred first, is checked by the same session that wants the file gone. The concrete case is already on the frontier: `hexis` carries an existence fact recommending `prune` and waits at a row for the author, and under this text it is simply deleted. And the test that fires the deletion is, by the fact's own `against`, "the AI's own, drawn in one sitting... and not yet worn by use" -- so one ruling would give an untested discriminator an unrecoverable remedy. The answer to this is that the author asked for exactly this delegation in their own words and repeated the direction, which is why the remedy belongs in the record; but it belongs on a node whose authority fact the author can rule `delegated`, where the scope is stated and the bounds are read off a ruling, and not in a sentence of a rule about probes.

The session's reply: Accepted, and kicked back to the maieutic movement as the reading asks; the author's own words of 2026-09-07 on this node decide it the same way. Verified on the main thread: no option in the record carries a ruling, so the bound that a ratified node is never pruned excludes nothing today; hexis carries an existence fact recommending prune and waits for the author; this node carries no existence fact while by-what-is-asked ends in a prune; and the align skill at line 468 and frontier-consistency's sixteenth validation still say the author rules the prune. The new answer keeps the four tests and sends the delegation to a node of its own, whose authority fact the author can rule delegated and whose scope and bounds are then read off that ruling; the option the reading names, delegation-carried-by-its-own-node, source author, ref 2026-09-07, is recorded and recommended, prune-delegated-with-two-bounds stays on the fact as the AI's option with the reading's case against it, and the node that carries the delegation is minted with the answer. With it: an existence fact on this node for the prune by-what-is-asked ends in; boldness moderate on the whole recommended text; the case against moved to the clause that moved; hexis named as the node the remedy reaches today; the authority reading naming the irreversible limb beside the capture-shaped one; and the sixteenth validation on frontier-consistency and the skill's clause named as what the amendment leaves standing, since under the new answer the author's delegation, once ruled, is what the recorder acts under and the row is what asks it until then.

### The delegation sent to a node of its own, 2026-09-07

The clean-context reading of 2026-09-07 kicked this node back to the maieutic
movement on one ground: the amendment of that morning wrote a delegation into the
prose of this answer, and the record reads a class off a ruling recorded on a fact
and never off prose. The kickback was accepted whole, and the author's words of
2026-09-07, quoted under `## Disposition`, decide it the same way — an intent that
is a persistent disposition may take a node of its own, to be reconciled into the
alignment skill.

What was written. The option `delegation-carried-by-its-own-node` is recorded on
the answer fact, source `author`, ref 2026-09-07, and is recommended, at moderate
boldness; the recommended text keeps the four tests unchanged and ends the
independence test's remedy by naming the delegation rather than carrying it.
`prune-delegated-with-two-bounds` is passed over with the reading's case against it
as its reason and stays on the list, since the two differ in where the delegation
is recorded and not in whether it is given. The fact's `against` moves to the
clause that moved and now carries what the reading verified on the main thread:
no option in the record carries a ruling, so the bound naming a ratified node
excludes nothing today, and the transfer of the author's words is checked by the
same session that wants the file gone. The `### authority` reading names the
irreversible limb beside the capture-shaped one, since the test that fires the
remedy reaches a deletion. And an `existence` fact is added, recommending `keep`
at low boldness, because `by-what-is-asked` ends in a prune and a prune is never
an answer option; that option's prose now says the prune is the existence fact's.

The node minted: `commons.systems/disposition-graph/graph-topology`, under
`commons.systems/disposition-graph/authority`, asking what the recorder may do to
the graph's topology without asking. It carries the author's words of 2026-09-06
with their two bounds as the recommended answer, source `author`, and an authority
fact recommending `delegated` at low boldness, on which a ruling is what confers
the pruning power. It is entered in this node's `depends` as
`commons.systems/disposition-graph/graph-topology`, so the recommendation here
waits on it, which is what the scope test's own remedy requires of a question that
would move more than one node's recommendation.

What the amendment does not make stale, and it is worth saying because the earlier
reading expected it to. Three loci carry the sentence that the author rules the
prune at the node's own row:
`commons.systems/disposition-graph/frontier-consistency`'s sixteenth validation, in
the text it recommends; `.claude/skills/align/SKILL.md` lines 467–468; and
`packages/clean-context-review/brief-survey.md` line 36. Under the delegation
carried here they would all three have been falsified on the day this node landed.
Under the delegation carried by a node of its own they stand exactly as written,
because until that node's authority fact is ruled `delegated` the row *is* where
the prune is asked, and what changes when it is ruled is one clause in each. An
option is recorded on `frontier-consistency` so that its sixteenth validation reads
the delegation off the new node's ruling rather than restating a rule that will
move; the two implementation loci are a reconciliation item and are named here so
they are ruled and not discovered.

The node the remedy reaches today is
`commons.systems/disposition-graph/hexis`, whose existence fact recommends `prune`
at low boldness on this node's independence test and which waits at its own row.
Under `prune-delegated-with-two-bounds` the first effect of a confirmation would
have been the deletion of a node already queued for the author's own ruling.
Under the recommended option nothing about that row changes on the day this
answer is confirmed: `hexis` waits for the author until `graph-topology` is ruled,
and it is the first prune that ruling would reach. The author is entitled to know
which of their pending rows a ruling closes, and this is the one.

Owed and not written here: an option on
`commons.systems/disposition-graph/recording`, whose answer requires that a ruling
that the node not exist be recorded before the node is deleted. A prune taken
under the delegation has no such ruling, and validation 2 forbids a recommendation
adopting a contradiction instead of recording it. The new node's answer states the
departure in terms; the option that records it belongs on `recording`, and its
prose is drafted in that node's account. [Closed the same day, 2026-09-07: the
option was written and stands on `commons.systems/disposition-graph/recording` as
`prune-of-an-unruled-node-needs-no-ruling`, at line 99 of that node with its
`####` subsection below, sourced to `commons.systems/disposition-graph/graph-topology`.
The paragraph above records what was owed at the hour it was written and is kept
for that.]

### Clean-context review, 2026-09-07, of 2faf26bc

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `delegation-carried-by-its-own-node`.

Findings:

- ## Recommendation, first paragraph of `## Answer`: the draft states, of a question whose response must stand, that it is "a node, minted under the node it blocks and entered in that node's `depends`, as the parent's third limb already says". The sitting that wrote this sentence did the opposite in the same movement: `commons.systems/disposition-graph/graph-topology` was minted under `commons.systems/disposition-graph/authority`, not under the node it blocks, which is this one. Verified: `disposition/disposition-graph/graph-topology.md` line 28-29 reads `under:` / `  - commons.systems/disposition-graph/authority`. The clause is wrong as a rule, and the sitting's own act shows why: `under` says what a node refines, and "What may the recorder do to the graph's topology without asking?" refines the authority question and not "When is an open question a probe, an option, or a node?". An executor following the clause would place every promoted question beneath the node that happened to be blocked, which is placement by accident of discovery. Suggested edit: "the question is a node, minted where its question belongs under the record's own placement rule and entered in the blocked node's `depends`". The parent `commons.systems/disposition-graph/author-questions` carries the same defect in its third limb -- "is a node, minted under the node it blocks and entered in that node's `depends`, where the fifteenth frontier validation already puts it" -- and the fix belongs there too: an option on that node's answer fact, name `promoted-question-placed-by-its-own-question`, source this review, carrying the prose that a promoted question is minted where its question refines and is entered in the blocked node's `depends`, since the blocking relation is what `depends` records and `under` records what a node refines.
- ## Recommendation, the independence test paragraph: "A node already standing is not re-encoded by this test alone, because it cannot be: the survivor is recorded on the parent the same way, the account folds into it, the author's words move with it, and the reason the question was closed is written down before the file goes." The colon promises what happens instead of re-encoding and then describes the re-encoding. What stands today says the thing plainly -- "A node already standing is not struck by the recorder:" -- and the amendment lost that sense while moving the prune clause. An executor could read "not re-encoded by this test alone" as licence to leave a standing node untouched, doing none of the four things the sentence then requires. Suggested edit: "A node already standing is re-encoded on the parent the same way but is not struck by the recorder: the survivor is recorded on the parent, the account folds into it, the author's words move with it, and the reason the question was closed is written down before the file goes."
- Viability, answer fact: a viable option is missing and is named in the `viability` field below. In short, the recommended text's interim -- "until then the node's existence fact moves to `prune` with this test as its reason, and the row asks the author" -- reinstates for an indefinite period the very thing the author struck twice in their own words on this node: "Pruning doesn't require confirmation of explicitly granted in dialogue. just prune it" (2026-09-05) and "(Pruning of unratified nodes that is)". The option passed over as `prune-granted-in-dialogue-needs-no-row` was the only one giving those words any effect, and its passed-over reason -- "superseded by the author's own standing disposition of 2026-09-06, which delegates the pruning of unratified nodes rather than granting it case by case" -- rests on a delegation that confers nothing until `graph-topology`'s authority fact is ruled. So the option said to supersede it is inert today, and the author's plainest words are answered by nothing on the list.
- ## Facts, `#### prune-delegated-with-two-bounds`: the option's prose says the two options "differ in where the delegation is recorded and not in whether it is given" but never says what a ruling for it would do to `commons.systems/disposition-graph/graph-topology`, which this same sitting minted and which this node's `depends` puts ahead of it in the author's queue. If the author rules `graph-topology`'s answer and its authority fact first, as `depends` requires, and then rules `prune-delegated-with-two-bounds` here, the same delegation with the same two bounds stands in two places -- the update anomaly the record reads at `commons.systems/disposition-graph/codd-update-anomaly`. Suggested edit: add one sentence to the option saying that a ruling for it makes `graph-topology`'s question redundant, so its existence fact would move to `prune`, and that the author is therefore choosing between two homes for one delegation and not between two delegations.
- ## Account, `### The delegation sent to a node of its own, 2026-09-07`: "Owed and not written here: an option on `commons.systems/disposition-graph/recording`, whose answer requires that a ruling that the node not exist be recorded before the node is deleted." The claim is stale as the record stands: the option is written. `disposition/disposition-graph/recording.md` carries `      - name: prune-of-an-unruled-node-needs-no-ruling` at line 99 with its `#### prune-of-an-unruled-node-needs-no-ruling` subsection at line 366, sourced to `commons.systems/disposition-graph/graph-topology`. Suggested edit: replace "Owed and not written here" with a sentence recording that the option was written on `recording` with `graph-topology` as its source, so the account does not leave an item open that the sitting closed.
- Defect of the brief, not of the draft, reported as `## Verdict and findings` requires: the brief's `## The node under review` block prints the node's facts, review state and `depends` but no `probes`, while `## What you judge` asks the reader to check the three-probe cap "on the node you read, counting the probes it already carries together with the ones you raise". That check cannot be made from the brief. I made it against the file instead: `disposition/disposition-graph/probe-or-node.md` carries one probe, `a-delegable-review-finding-question`, with `status: discharged` and a reason naming the author's words of 2026-09-07, so no probe is open and the cap is not at issue. The brief's generator should print the node's open probe count, as `commons.systems/disposition-graph/author-questions` already requires of the frontier and the alignment page.

On the facts and what they recommend: The answer fact recommends `delegation-carried-by-its-own-node` at moderate boldness while `by-what-the-response-does` stands, and a `## Recommendation` fence is present as that mismatch requires; the fence's frontmatter carries `question`, `form` and `under` only, no facts and no dialogue keys, and it answers the same question. The moderate boldness is right and its reason is stated correctly: the delegation clause is the author's but the four tests are the AI's, and a low boldness would report the provenance of the amendment instead of the provenance of the answer. The authority fact recommends `ratified` at low boldness with the `### authority` reading `class-recommendation` requires, naming the capture-shaped and irreversible limbs, and both hold; the new `existence` fact recommending `keep` is correctly minted, since `by-what-is-asked` ends in a prune and a prune is never an answer option. The fact's `against` claim that "no option on any node carrying a ruling" is verified: no option in `disposition/` carries a `ruling:` key.

On the viability of the options: Every option listed is viable and each passed-over status is honestly reasoned, but one viable option is missing and it is the one that answers the author's own words of 2026-09-05. Its prose: `interim-follows-the-authors-word` -- the four tests stand, the standing delegation is carried by `commons.systems/disposition-graph/graph-topology` exactly as the recommended option provides, and what changes is the interim. Until that node's authority fact is ruled `delegated`, a prune of an unratified node that the author has explicitly directed in the dialogue is taken on that word wherever it was given, and the row remains how a prune is asked when no word has been given; a ratified node's prune is asked at the row in either period. This is viable because a grant given in the author's words is what `commons.systems/disposition-graph/what-acts-during-bootstrap` says acts by right while nothing is ratified, so honouring it needs no class and writes none, and because it is the only option under which the author's twice-stated "just prune it" has any effect between now and a ruling on a node minted this morning. It should be added with source `review`, ref 2026-09-07, and the passed-over reason on `prune-granted-in-dialogue-needs-no-row` amended to say that what superseded it is the standing delegation once ruled and not before.

Strongest counter-argument (moderate): The amendment changes nothing that anyone does. By its own terms the delegation "acts only when that node's authority fact is ruled `delegated`", and until then "the row asks the author" -- which is what the record already did before any of the author's words on pruning were spoken. So the one clause that moved is a forward reference, and the author is asked to confirm where a question will be answered rather than to answer it, while the substance they actually asked for on 2026-09-04, the four tests, waits behind a `depends` on a node minted the same morning and itself only at the review stage. Against that, the author's plainest words on this node are "just prune it", scoped to unratified nodes, and repeated as a standing disposition the next day; the recommended interim reinstates precisely the confirmation they struck, for a period no one has bounded. And the four tests themselves remain, as the fact's own `against` concedes, "the AI's own... not yet worn by use", with the survival test asking a recorder to predict what a later sitting will need -- so a ratification here fixes an untested discriminator by the author's ruling while the remedy it fires stays in abeyance, which is the least useful order in which to settle the two.

The session's reply: Accepted on all six, each verified at its locus on the main thread: graph-topology stands under authority and not under this node, so the clause that a promoted question is minted under the node it blocks is wrong as a rule and the sitting's own act shows it; the sentence on a node already standing lost its sense when the prune clause moved; the interim reinstates the confirmation the author struck twice in their words on this node, and the option that gave those words effect was passed over for a delegation that confers nothing until graph-topology's authority fact is ruled; prune-delegated-with-two-bounds does not say what a ruling for it does to graph-topology; the account still says the option on recording is owed when it is written at line 99 of that node; and the brief prints no probes for the node under review, which is the instrument's defect and goes on the reconciliation list. The amendments owed: the clause reads that a promoted question is minted where its question belongs under the record's placement rule and entered in the blocked node's depends, with the option promoted-question-placed-by-its-own-question recorded on author-questions, source review; the standing-node sentence restated as the reading suggests; the option interim-follows-the-authors-word recorded, source review, and the recommendation moved to it, since a grant in the author's words is what what-acts-during-bootstrap says acts by right and this node's interim was the one clause that denied it, the reason on prune-granted-in-dialogue-needs-no-row amended to say what supersedes it is the delegation once ruled and not before; the two-homes sentence added to prune-delegated-with-two-bounds; and the account's owed item closed. On the counter-argument: the four tests are the substance the author asked for on 2026-09-04 and the depends on graph-topology orders the delegation before them, which is where the question of who prunes belongs; the counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.

### The interim follows the author's word, 2026-09-07

The second clean-context reading of 2026-09-07 forwarded this draft to the
author's ruling at moderate strength and returned six findings. All six were
accepted and each was verified at its locus on the main thread; what follows is
what was written.

The recommendation moved. `interim-follows-the-authors-word` is recorded on the
answer fact, source `review`, ref 2026-09-07, and is recommended;
`delegation-carried-by-its-own-node` stays on the fact, viable and not passed
over, since the two differ in the interim alone. The four tests are untouched by
the move and the delegation still goes to
`commons.systems/disposition-graph/graph-topology`, which stays in `depends`.
What changed is the clause the reading found: until that node's authority fact is
ruled `delegated`, a prune of a node no ruling reaches that the author has
directed in their own words is taken on that word wherever it was given, and the
row is how a prune is asked where no word has been given. The ground is
`commons.systems/disposition-graph/what-acts-during-bootstrap`, which holds that
a grant given in the author's words acts by right while nothing in the record is
ratified; honouring such a word needs no class and writes none, which is why the
interim confers nothing and this node stays where it was on that question. The
old interim reinstated, for a period no one had bounded, exactly what the author
struck on 2026-09-05 in two consecutive messages quoted under `## Disposition`.
The passed-over reason on `prune-granted-in-dialogue-needs-no-row` now says that
what supersedes it is the standing delegation once ruled and not before, and that
its case-by-case half is carried in the meantime by the recommended option.

The placement clause was wrong as a rule and the sitting's own act showed it. The
first paragraph said a promoted question is "minted under the node it blocks";
`commons.systems/disposition-graph/graph-topology` was minted the same morning
under `commons.systems/disposition-graph/authority` and not under this node,
which is the node it blocks. `under` records what a node refines and `depends`
records the blocking, so the clause now reads that the question is minted where
its question belongs under the record's own placement rule and entered in the
blocked node's `depends`. The parent carries the same defect in its third limb,
and the option `promoted-question-placed-by-its-own-question` is recorded on
`commons.systems/disposition-graph/author-questions`, source `review`, ref
2026-09-07, viable and not adopted, since that node is at the ruling stage and
its recommendation does not move.

Three smaller amendments. The independence test's sentence on a node already
standing had lost its sense when the prune clause moved — it promised what
happens instead of re-encoding and then described the re-encoding — and now says
that such a node is re-encoded on the parent the same way but is not struck by
the recorder. `#### prune-delegated-with-two-bounds` gains the sentence the
reading asked for: a ruling for it makes `graph-topology`'s question redundant,
that node's existence fact would move to `prune`, and the author is choosing
between two homes for one delegation. And the account's owed item, an option on
`commons.systems/disposition-graph/recording`, is closed in place: it was written
the same day and stands at line 99 of that node, sourced to `graph-topology`.

The sixth finding is a defect of the instrument and not of the draft, and it goes
on the reconciliation list rather than into this node: the draft brief's
`## The node under review` block prints the node's facts, review state and
`depends` but no `probes`, while `## What you judge` asks the reader to check the
three-probe cap on the node it reads. The reader made the check against the file
instead. The brief's generator should print the node's open probe count, as
`commons.systems/disposition-graph/author-questions` already requires of the
frontier and the alignment page.

On the counter-argument, which the reading gave at moderate strength: it stands
on the row as written. Half of it is answered by the move — the interim is no
longer a forward reference and now acts on the author's own words — and the other
half is not: the four tests are the substance the author asked for on 2026-09-04,
and `depends` on `graph-topology` orders the question of who prunes ahead of
them, which is where that question belongs.

The amended answer owes its re-reading.

### Clean-context re-reading, 2026-09-07, of 7bd00f2a

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `interim-follows-the-authors-word`.

Findings:


On the facts and what they recommend: The diff moves the answer fact's `recommends` from `delegation-carried-by-its-own-node` to the new option `interim-follows-the-authors-word` (source review), keeps boldness at moderate with a reason now naming the interim as a second thing the author supplied, and rewrites `against` to note the interim is now the one part of the answer that acts today and is checked only by the pruning session's own account; `review.of`/`review.commit` are updated to the prior reading's pin, and `stands`/the fence are otherwise the same shape (nothing stands yet, so the fence is the whole draft).

On the viability of the options: The diff leaves `by-what-is-asked`, `prune-granted-in-dialogue-needs-no-row` (its passed-over reason rewritten to say what supersedes it and when), `prune-delegated-with-two-bounds` (gaining the 'two homes' sentence), `node-by-default` and `delegation-carried-by-its-own-node` all viable, and adds the new viable, recommended option `interim-follows-the-authors-word`; nothing is struck.

Strongest counter-argument (moderate): The four tests that answer the author's actual 2026-09-04 request still wait behind a `depends` on `graph-topology`, itself only at the review stage, so the substance of this node is still gated on a sibling node's ruling; and the interim this amendment adds is honoured on trust in the pruning session's own account of which of the author's words reached a given prune, with no fact or ruling checking that account until `graph-topology` is ruled.

The session's reply: Forwarded with no finding; verified on the main thread that recording carries prune-of-an-unruled-node-needs-no-ruling and that the two-homes sentence matches graph-topology's. The counter-argument stands on the row at moderate strength. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 7bd00f2a

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): `interim-follows-the-authors-word` is the one clause of this answer that acts before any ruling, and it rests on a citation that fails. It takes a prune "on that word wherever it was given, in the dialogue or at the row" because "a grant given in the author's words acts by right while nothing in the record is ratified", where what-acts-during-bootstrap defines a grant as "given for one named reconciliation of one unanswered node, never assumed, never carried over from an earlier grant". So the recommendation over `delegation-carried-by-its-own-node` is bought by reading a general direction as a standing grant, which the node it cites forbids, and the reading is made by the session that wants the file gone.

### Frontier finding, 2026-09-07

Kind: cross-reference.

Two nodes cite what-acts-during-bootstrap for an interim its answer does not carry and its nearest sentence forbids. graph-topology's recommended answer reads "a prune of a node no ruling reaches that the author has directed in their own words is taken on that word, wherever it was given, since a grant given in the author's words acts by right while nothing in the record is ratified", and probe-or-node's recommended answer says the same, "taken on that word wherever it was given, in the dialogue or at the node's row". what-acts-during-bootstrap's answer defines the thing cited: a grant is "the author's word, given for one named reconciliation of one unanswered node, never assumed, never carried over from an earlier grant, and never read from the announcement of one, as the authority node says". The words being relied on, the author's of 2026-09-05 — "Pruning doesn't require confirmation of explicitly granted in dialogue. just prune it" and "(Pruning of unratified nodes that is)" — were given in one sitting about one node, so reading them as reaching a prune "wherever it was given" is carrying a grant over from an earlier grant, which that node's definition excludes.

Also named: commons.systems/disposition-graph/graph-topology, commons.systems/disposition-graph/what-acts-during-bootstrap.

Proposed: what-acts-during-bootstrap owns what acts by right and is the survivor of the definition. Either its answer gains a third thing that acts, a standing direction of the author's about a class of act, which is the option recorded here for the author to rule; or the two citing nodes redraw their interim so that it names a grant given for the prune in hand and not a word given elsewhere. graph-topology and probe-or-node are the nodes whose text must change under the second, and the interim is the one clause of either that acts before any ruling, so it is the clause the author should meet with the definition beside it.

Recorded as an option on commons.systems/disposition-graph/what-acts-during-bootstrap's answer fact: `a-standing-direction-acts-by-right` (source review, 2026-09-07).

### Amended after the frontier survey, 2026-09-07

The survey's finding, validated at its locus on the main thread, the same finding as on graph-topology: the interim cited a grant for a class of act. The fence's clause now names the direction for what it is and rests on `what-acts-during-bootstrap#a-standing-direction-acts-by-right`, entered in `depends`. The amended recommendation owes its re-reading, whose object is this repair.

### Clean-context re-reading, 2026-09-07, of 0bd3f8b1

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `interim-follows-the-authors-word`.

Findings:

- ## Answer (identically in the ## Recommendation fence), independence-test paragraph: the repair replaces "since a grant given in the author's words acts by right while nothing in the record is ratified" with "...as a standing direction of the author's about a class of act, which acts by right only if the what-acts-during-bootstrap node's option `a-standing-direction-acts-by-right` is ruled, the grant that node defines reaching one named reconciliation and no class, and which is applied meanwhile as the author's words of 2026-09-05 directed." This does not close the survey's cross-reference finding, it relocates it: the sentence still opens with "a prune of a node no ruling reaches that the author has directed in their own words is taken on that word wherever it was given, in the dialogue or at the node's row" -- unchanged from the pre-amendment text and exactly the phrase the survey objected to, since a grant under what-acts-during-bootstrap's own definition reaches "one named reconciliation of one unanswered node" and is "never carried over from an earlier grant." The repair now admits in the same breath that this broader, standing-direction reading only "acts by right only if" a new option is ruled (it is not; it is merely recorded as viable, per the node's own account), while asserting the direction "is applied meanwhile" regardless. That is a new, self-contradictory clause the previous reading had no chance to catch, since it read the pre-amendment text that (wrongly, but coherently) claimed the interim already acted by right via a grant: the amended text instead states outright that the standing-direction reading lacks "by right" standing pending a ruling, and then describes it being applied anyway. Suggested edit: either narrow the opening clause to the single 2026-09-05 reconciliation ("taken on that word for the node it was given about" rather than "wherever it was given"), which would make the interim a proper grant needing no further ruling, matching the survey's second proposed remedy; or, if the broader standing-direction reading is intended, drop "and which is applied meanwhile as the author's words of 2026-09-05 directed" so the text does not describe present application of an authority it just said is conditional on an unmet ruling.

On the facts and what they recommend: The diff touches only frontmatter (review.of/review.commit/review.against advanced to the prior reading's pin, and a survey:{date,of} block added), depends (gaining commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right), and the independence-test paragraph's wording in both `## Answer` and the `## Recommendation` fence, where the interim's grounding moves from a miscited grant to a named-but-unruled standing-direction option while the same 'wherever it was given' phrase and present-tense application survive unchanged. No fact's recommends, boldness, or stands changes; the answer fact's own `against` text is untouched by this repair and does not yet reflect the new standing-direction framing.

On the viability of the options: Unaffected by this diff: no option is added or struck, `interim-follows-the-authors-word` remains the sole recommended and viable option on the answer fact, and the authority/existence facts are untouched.

Strongest counter-argument (moderate): The amendment renames the citation from a miscited grant to a not-yet-ruled standing-direction option but keeps the exact 'wherever it was given, in the dialogue or at the node's row' language the survey flagged as carrying a grant over from an earlier grant, and now explicitly concedes that reading lacks 'by right' standing while still describing it as applied today -- the substance the survey objected to (a general direction pruning nodes now, on no ruling) is unchanged, only its stated justification moved.

### Amended after the re-reading, 2026-09-07

The re-reading's finding, validated on the main thread: the repaired clause said the standing direction acts by right only if an unruled option is ruled, and that it is applied meanwhile, which is a contradiction in one sentence. The interim's ground was wrong, not its existence: the author's words of 2026-09-06, "the prune grant is standard disposition", recorded on `dialogue`, make the prune grant standing rather than given case by case, and the fence's clause now rests the interim on those words, names what `what-acts-during-bootstrap`'s option records as the divergence from that node's definition of a grant, and says the interim takes nothing from that node until the option is ruled. The standing text is not touched; the recommendation moved and the amendment owes its re-reading.

### Clean-context re-reading, 2026-09-07, of 9a509a98

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `interim-follows-the-authors-word`.

Findings:

- ## Answer (identically in the ## Recommendation fence), independence-test paragraph. The previous reading's finding was that the repaired clause asserted a not-yet-ruled option 'acts by right only if' it is ruled while also asserting it 'is applied meanwhile' -- a contradiction in one sentence. This amendment removes that literal grammatical contradiction but reproduces its substance rather than closing it: the same sentence still asserts, present tense, that a prune 'is taken on that word wherever it was given, in the dialogue or at the node's row, on the author's words of 2026-09-06 that the prune grant is standard disposition, a standing direction about a class of act rather than a grant given case by case', while conceding in the very same breath that 'the interim rests on the author's words and on nothing that node confers until the option is ruled'. That is: the clause now explicitly agrees the basis is not a grant under what-acts-during-bootstrap's own definition, and that the node which would confer a 'standing direction' as a third thing that acts by right has not been ruled -- yet it still describes the prune as taken now on that unconferred basis. This restates, rather than answers, the case what-acts-during-bootstrap and authority.md make against it: 'no class acts until a ruling confers one' and 'a class the AI writes for itself is not a grant'. Suggested edit: take the survey's second proposed remedy instead of its first -- drop the 'standing direction' framing and the 'wherever it was given' language entirely, and narrow the clause to a grant properly scoped to the prune in hand (an explicit word from the author given for that specific node), so nothing is described as acting before any ruling confers it.
- The survey's finding of 2026-09-07 (cross-reference, quoted in this brief's 'survey's findings' section) objected to 'wherever it was given, in the dialogue or at the node's row' as carrying the author's 2026-09-05 words 'over from an earlier grant' beyond the 'one named reconciliation of one unanswered node' that what-acts-during-bootstrap's definition of a grant allows. The amendment keeps that exact phrase, 'wherever it was given, in the dialogue or at the node's row', verbatim, and only re-grounds it in the author's 2026-09-06 words instead ('the prune grant is standard disposition') -- but those words are, on the amendment's own characterization two clauses later ('a standing direction about a class of act rather than a grant given case by case'), a general instruction and not a one-off grant, which is if anything a clearer instance of the pattern the survey flagged than the 2026-09-05 words were. The amendment does not close the survey's finding; it re-targets the same objectionable phrase at a new citation while leaving the phrase itself, and the present-tense application it supports, untouched.

On the facts and what they recommend: The diff touches only review/survey frontmatter bookkeeping from the prior reading's own apply step (not part of the amendment) and the independence-test paragraph's wording, appearing identically in ## Answer and the ## Recommendation fence: the interim's citation moves from the miscited 2026-09-05 grant to the 2026-09-06 words framed as a 'standing direction... rather than a grant', with a new clause conceding it rests on 'nothing that node confers until the option is ruled'. No fact's recommends, boldness, or stands changes; interim-follows-the-authors-word remains recommended (moderate) on answer with stands unchanged at by-what-the-response-does, and the answer fact's own recorded `against` text (already conceding the interim is honoured on trust pending graph-topology's ruling) is untouched and remains consistent with, if anything corroborated by, the defect above.

On the viability of the options: No option is added or struck by this diff, and the authority and existence facts are untouched; the amendment reworks only the grounding clause of the already-recommended option's own text, so the viability of every listed option is unaffected by the diff considered in isolation. The unresolved substantive issue above bears on whether interim-follows-the-authors-word is the soundest choice, but that is a question for the next full reading or the author's ruling, not a change in what options this diff makes viable or not.

Strongest counter-argument (moderate): The amendment can be read as a real repair rather than a relocation: by explicitly disclaiming reliance on the unruled 'a-standing-direction-acts-by-right' option ('rests... on nothing that node confers until the option is ruled') it stops claiming record-conferred authority altogether and instead treats the interim as a bounded, honest description of what one session does on its own account -- the same posture the fact's own `against` and the option's own prose already concede and price in ('honoured on trust', 'the same session that wants the file gone'). Read that way there is no new claim of right, only an accurate label for a stopgap already disclosed elsewhere on the node, and the remaining objection is to the interim's existence (already argued and already priced into its moderate boldness), not to anything this diff newly asserts.

### After the second re-reading, 2026-09-07

The second re-reading of the day kicked the amended fence back again, on the same ground: the interim applies a standing direction wherever it was given while its standing by right is unruled, and the survey's objection to "wherever it was given" survives the re-grounding on the author's words of 2026-09-06. The finding is validated on the main thread as a question the record cannot settle for itself, since it turns on the scope of the author's own standing grant. Under `review-cost`'s cap no third reading runs on this answer: the finding goes to the author as the probe `does-the-standing-prune-grant-act-wherever-given`, and the node waits at the maieutic stage for the answer. The fence stands as amended, its interim resting on the author's words until they say how far those words reach.

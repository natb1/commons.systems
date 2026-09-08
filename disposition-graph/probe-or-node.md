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
        supports:
          - words/2026-09-05/2
          - words/2026-09-05/3
      - name: prune-delegated-with-two-bounds
        source: author
        ref: "2026-09-06"
        status: passed
        reason: "it writes the delegation into the prose of an answer, where no ruling can confer it, and a class the AI writes for itself is not a grant; the delegation it holds moves to `commons.systems/disposition-graph/graph-topology`, and it stays on the list because the author may prefer the remedy to carry the rule rather than cite it"
        supports:
          - words/2026-09-06/6
      - name: node-by-default
        source: ai
        ref: "2026-09-04"
      - name: delegation-carried-by-its-own-node
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/17
      - name: interim-follows-the-authors-word
        source: review
        ref: "2026-09-07"
        supports:
          - words/2026-09-04/21
          - words/2026-09-04/30
          - words/2026-09-04/31
      - name: an-alignment-input-decomposes-into-facts
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/36
    recommends: interim-follows-the-authors-word
    boldness: moderate
    against: "Four of the five paragraphs of the recommended answer are the AI's own: the three tests put to the response, the independence test, the two refusals and the tie-break were drawn in one sitting from the failure the author named and are not yet worn by use, and the survival test asks the recorder to predict whether a response will be needed later, which is a judgment about the future of the record and not a fact a reading can check today. On the clause that moved, sending the prune to a node of its own does not answer the case against the delegation, it only moves where the author rules on it: the power at issue is deletion, which `class-recommendation` names irreversible, conferred on the party that also finds the node redundant; the bound `may not prune something that is ratified` excludes nothing in the record as it stands, no option on any node carrying a ruling; and the second bound, that anything of the author's be transferred first, is checked by the same session that wants the file gone. The delegation is still a forward reference, acting only when `commons.systems/disposition-graph/graph-topology`'s authority fact is ruled, so what the author confirms here about the standing rule is where it will be answered and not what it says. And the interim is now the one part of this answer that acts today: it hands an untested discriminator a deletion before the node that would confer the power has been ruled, and which of the author's words reached a particular prune is read by the same session that wants the file gone, with nothing but that session's account to check it."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The rule decides what the author is asked to rule on and what they are merely asked, which is the shape of decision the record escalates toward ratified, since a recorder who may delegate it to itself decides its own accountability; but the author may hold the four tests to be operating detail under the parent's ratification and delegate them with it."
  - name: topology
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: low
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-07
  of: 7076d2e82036c83204ecb70924c1b5f1a3164688
  commit: f0325d88ed52196f0551e86a7e6830e724f93c4b
  against: "The amendment can be read as a real repair rather than a relocation: by explicitly disclaiming reliance on the unruled 'a-standing-direction-acts-by-right' option ('rests... on nothing that node confers until the option is ruled') it stops claiming record-conferred authority altogether and instead treats the interim as a bounded, honest description of what one session does on its own account -- the same posture the fact's own `against` and the option's own prose already concede and price in ('honoured on trust', 'the same session that wants the file gone'). Read that way there is no new claim of right, only an accurate label for a stopgap already disclosed elsewhere on the node, and the remaining objection is to the interim's existence (already argued and already priced into its moderate boldness), not to anything this diff newly asserts."
  survey:
    date: 2026-09-07
    of: 7bd00f2a353005aebe5c3a8f16a0a381deb8ebe6
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "0c9bfdaddafdd74f09b9f878ee81f7c3af056920d35a3117f452e3a10e237de9"
      answer: "ab6b830870478a9a66671c2ba6c8dc31cf42684e0b5e59e77638171486a1834b"
      options: "90f7240fcbab26b47ce31fabe84d9089f2b30bab6d83ba2864e9c78357294f23"
      rivals: "c21ffcb51749c37a94c9c1bd1c1760e0d62156f3af921e34b2c4e665f6af6f49"
      words: "6d5b46c34ad090e379efc30fdd4800f9b424ecd5fb210c48edf66f8f1c6a2737"
depends:
  - commons.systems/disposition-graph/graph-topology
  - commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Facts

### answer

`interim-follows-the-authors-word` is recommended. It is `delegation-carried-by-its-own-node` with one clause changed, and it keeps `by-what-the-response-does` whole — the four tests, put to the response and not to the question, are what the two sweeps of 2026-09-04 lacked and what a reading can check — and it changes one thing: the independence test's remedy names the delegation that takes a standing node's prune rather than carrying it. The author's words of 2026-09-06 grant that delegation, and this node's own ruling, scope and survival tests all return `node` when they are put to those words: the response is "delegated, do not ask me again", which only a disposition carries; it is already quoted on three nodes and bears on `recording`, `frontier-consistency` and `viable-options`, which is doctrine reaching below it; and every later session that prunes anything needs it on its own account. A rule that fails its own tests on its newest clause cannot be put to the author, and the author said the same thing on 2026-09-07: "If author's intent is a peristent disposition, then it may require a new node to be reconciled into the alignment skill." The node is `commons.systems/disposition-graph/graph-topology`, minted with this answer and entered in `depends`, and the delegation acts from a ruling of `delegated` on its authority fact, which is where the record confers a class. What the recommended option changes is the interim, the period between a ruling here and a ruling there. `delegation-carried-by-its-own-node` sends every prune of a standing node to the topology fact's row until `graph-topology` is ruled, and that reinstates for an unbounded period exactly what the author struck in their own words on this node: "Pruning doesn't require confirmation of explicitly granted in dialogue. just prune it", scoped the same minute to unratified nodes. Under the recommended option a prune of a node no ruling reaches that the author has directed in their words is taken on that word wherever it was given, in the dialogue or at the row, because a grant given in the author's words is what `commons.systems/disposition-graph/what-acts-during-bootstrap` holds acts by right while nothing in the record is ratified, so honouring it needs no class and writes none; the row is how a prune is asked where no word has been given, and a ratified node's prune is asked at the row in either period. `delegation-carried-by-its-own-node` stays on the list and is not passed over, since the two differ in the interim alone and the author may hold that nothing should move before the delegation is ruled.

Boldness stays moderate. What moved is the author's twice over — the delegation, its two bounds and the direction to give it a node on 2026-09-06 and 2026-09-07, and now the interim, which is their words of 2026-09-05 read as `commons.systems/disposition-graph/what-acts-during-bootstrap` reads any grant given in the author's words — but boldness is a property of the recommendation, which is the whole recommended text, and most of that text is the AI's construction, as this fact's `against` concedes. The delegation clause and the interim are the author's; the four tests are not, and a low boldness would report the provenance of the amendments in place of the provenance of the answer.

`prune-delegated-with-two-bounds` is passed over and stays on the list. It carries the same delegation and the same two bounds, and it writes them into the prose of this answer, where no ruling can reach them; `authority` holds that a node's class is read off the rulings recorded on its facts and that a class the AI writes for itself is not a grant, so the one thing that option cannot do is confer the power it describes. It is passed rather than struck because the difference between the two is where the delegation is recorded and not whether it is given, and the author may hold that a rule about probes should carry its own remedy rather than cite one. `prune-granted-in-dialogue-needs-no-row` keeps its place for the same reason, being the same words read as a grant given case by case; what supersedes it is the standing delegation once `graph-topology` is ruled and not before, and until then its case-by-case half is carried by the recommended option's interim, which is why neither is struck and why the two are not one option. `by-what-is-asked` is the parent's line and the sweeps' instrument, and it is kept viable because it may be all the author wants, with wording as the test and the sweeps' result accepted; the prune it ends in is asked on the topology fact below and not here. `node-by-default` is kept because the reverse sweep worked under it and the author may hold that its asymmetry is the right one at recording too.

#### by-what-the-response-does

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose.

**AI support.** The parent's admission test draws its third limb by what is asked, should be against meant, and the two sweeps of 2026-09-04 that applied it found no node in the graph mis-encoded, which the author did not believe. The sweeps were not careless; the test cannot fail against its asker, because the wording of a question is the one thing the asker controls, and a discriminator that reads wording will pass whatever was written in the shape the writer chose. The reverse sweep's third check, the work a node does in the record, was the one check on that sweep that looked past wording, and it looked at incumbent work only, so a node nothing rests on yet passed it by silence. What the four tests share is that they are put to the response and not to the question: the class it could carry, the nodes it would reach, its life after the ruling, and its independence from its parent are all facts about what a disposition is that a probe cannot counterfeit, and each is checkable by a reading against the record as it stands.

The tie-break reverses between recording and review, and the answer says so rather than choosing one, because the cheaper error is different in the two: at recording a probe is promotable and a node is not demotable, so the probe is the reversible choice; at review the node already stands and may be the author's, so keeping it is.

Readings owed under this node, each surfaced by the second evaluation and named here rather than minted: the distinction between a question of law and a question of fact, for the whole rule, the finder of fact answering what was intended and the court answering what binds, and for the survival test, since a finding of fact binds no later case and a holding does; the request for information against the change order in construction contracting, for the same line drawn where the drawings are the record, an RFI clarifying what the drawings mean and a change order altering what the contract requires, and for the rule that an RFI whose answer alters the contract is re-issued as a change order, which is the promotion clause; the erratum against the revising document in the IETF's practice, for the survival test, an erratum being consumed by the text it corrects; the parol evidence rule, for the ruling test's other face, that what a party intended is evidence and not term; and the issue-based information system already owed on the node node, for the difference between an issue, which stands, and a question put to a participant, which does not. The certified question and IEEE 830's TBD are already owed on the parent and are not repeated.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted under the node it blocks and entered in that node's `depends`, as the parent's third limb already says.

Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.

The ruling test. Would the author's response be a ruling or an answer? A ruling confirms, edits, or denies a recommendation and confers a class, and an answer says what the author intends. If it would make sense for the author to respond "delegated, do not ask me again" or "deferred, I will return to it", the question is a node, because only a disposition carries a class; a probe's answer cannot be delegated, since there is no one but the author who can say what the author meant, and cannot be deferred, since a deferred probe is a recommendation the AI could not ground standing in front of the author, which the parent forbids.

The scope test. A probe bears on the recommendations of one node, and its `discharges` names them. A question whose answer would move recommendations on more than one node, or would bind nodes not yet written, is doctrine reaching below it, which is what a node's answer does and a probe's cannot; it is a node, and every node it would have moved enters it in `depends`.

The survival test. Would anything need the response after the recommendation it moved has been ruled on? A probe dies with the dialogue, and what survives of it is the author's words and the rationale that quotes them; a response that a later sitting, a reading, a projection, or a reconciliation would need on its own account survives the dialogue, and what survives the dialogue is a node.

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is not struck by the recorder: the survivor is recorded on the parent the same way, the node's topology fact moves to `prune` with the test as its reason, and the author rules the prune, since while it stands it puts a rulable row on the alignment page and that row is where the prune is asked. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.

Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node can only be demoted by a prune the author must rule on, and while it stands it puts a rulable row on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.
```

#### by-what-is-asked

The parent's third limb as it stood before this sitting: a question of the record asks what something should be, a probe asks what the author meant by words they have already said, and the recorder classifies by which is asked. Viable if the author holds the sweeps' result to be complete and the line to want no more than wording; under this option the parent's limb is restored to its former sentence and this node has nothing left to answer. The prune that follows is not this option's to take: deleting the node is never an answer option, because an answer option is a candidate answer to this node's question and deleting the node answers nothing, so the prune is asked on the topology fact below, with this option as its ground, and the author rules the node's life as its own decision.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

The parent's third limb as it stood before this sitting: a question of the record asks what something should be, a probe asks what the author meant by words they have already said, and the recorder classifies by which is asked. Viable if the author holds the sweeps' result to be complete and the line to want no more than wording; under this option the parent's limb is restored to its former sentence and this node has nothing left to answer. The prune that follows is not this option's to take: deleting the node is never an answer option, because an answer option is a candidate answer to this node's question and deleting the node answers nothing, so the prune is asked on the topology fact below, with this option as its ground, and the author rules the node's life as its own decision.
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

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
```

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
that node's topology fact would move to `prune` and its question would be answered
by nothing. The author is choosing between two homes for one delegation and not
between two delegations.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted under the node it blocks and entered in that node's `depends`, as the parent's third limb already says.

Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.

The ruling test. Would the author's response be a ruling or an answer? A ruling confirms, edits, or denies a recommendation and confers a class, and an answer says what the author intends. If it would make sense for the author to respond "delegated, do not ask me again" or "deferred, I will return to it", the question is a node, because only a disposition carries a class; a probe's answer cannot be delegated, since there is no one but the author who can say what the author meant, and cannot be deferred, since a deferred probe is a recommendation the AI could not ground standing in front of the author, which the parent forbids.

The scope test. A probe bears on the recommendations of one node, and its `discharges` names them. A question whose answer would move recommendations on more than one node, or would bind nodes not yet written, is doctrine reaching below it, which is what a node's answer does and a probe's cannot; it is a node, and every node it would have moved enters it in `depends`.

The survival test. Would anything need the response after the recommendation it moved has been ruled on? A probe dies with the dialogue, and what survives of it is the author's words and the rationale that quotes them; a response that a later sitting, a reading, a projection, or a reconciliation would need on its own account survives the dialogue, and what survives the dialogue is a node.

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is not struck by the recorder: the survivor is recorded on the parent the same way, the node's topology fact moves to `prune` with the test as its reason, and the author rules the prune, since while it stands it puts a rulable row on the alignment page and that row is where the prune is asked. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.

Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node can only be demoted by a prune the author must rule on, and while it stands it puts a rulable row on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.
```

#### node-by-default

Wherever the recorder cannot classify a question, it mints a node, on the reverse sweep's asymmetry: a node wrongly kept costs an entry on a long frontier, and a probe wrongly recorded may lose a question the author asked for. Viable if the author weighs a lost question above a rulable row they did not want; under this option the four tests stand and only the tie-break flips.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

Wherever the recorder cannot classify a question, it mints a node, on the reverse sweep's asymmetry: a node wrongly kept costs an entry on a long frontier, and a probe wrongly recorded may lose a question the author asked for. Viable if the author weighs a lost question above a rulable row they did not want; under this option the four tests stand and only the tie-break flips.
```

#### delegation-carried-by-its-own-node

The four tests stand and the remedy's last clause names the delegation rather
than carrying it. A node of its own under `commons.systems/disposition-graph/authority`,
`graph-topology`, asks what the recorder may do to the graph's topology without
asking, carries the author's words of 2026-09-06 with their two bounds, and takes
its own authority fact, on which a ruling of `delegated` is what confers the
pruning power; this node's remedy then says that a standing node the independence
test reaches is pruned under that delegation once it is ruled, and that until then
the topology fact and its row are how the prune is asked. The node is entered in
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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is an open question a probe, an option, or a node?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted under the node it blocks and entered in that node's `depends`, as the parent's third limb already says.

Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.

The ruling test. Would the author's response be a ruling or an answer? A ruling confirms, edits, or denies a recommendation and confers a class, and an answer says what the author intends. If it would make sense for the author to respond "delegated, do not ask me again" or "deferred, I will return to it", the question is a node, because only a disposition carries a class; a probe's answer cannot be delegated, since there is no one but the author who can say what the author meant, and cannot be deferred, since a deferred probe is a recommendation the AI could not ground standing in front of the author, which the parent forbids.

The scope test. A probe bears on the recommendations of one node, and its `discharges` names them. A question whose answer would move recommendations on more than one node, or would bind nodes not yet written, is doctrine reaching below it, which is what a node's answer does and a probe's cannot; it is a node, and every node it would have moved enters it in `depends`.

The survival test. Would anything need the response after the recommendation it moved has been ruled on? A probe dies with the dialogue, and what survives of it is the author's words and the rationale that quotes them; a response that a later sitting, a reading, a projection, or a reconciliation would need on its own account survives the dialogue, and what survives the dialogue is a node.

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is not struck by the recorder: the survivor is recorded on the parent the same way, the node's topology fact moves to `prune` with the test as its reason, and the author rules the prune, since while it stands it puts a rulable row on the alignment page and that row is where the prune is asked. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.

Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node can only be demoted by a prune the author must rule on, and while it stands it puts a rulable row on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.
```

#### interim-follows-the-authors-word

Everything `delegation-carried-by-its-own-node` says, with the interim changed.
The four tests stand; the delegation that takes a standing node's prune is
carried by `commons.systems/disposition-graph/graph-topology` and named here
rather than written into this answer; and the node is entered in `depends` as
the scope test's own remedy requires. What differs is the period between a ruling
here and a ruling there. Under the option above, every prune of a standing node
waits at the topology fact's row until that node's authority fact is ruled
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

**AI support.** The parent's admission test draws its third limb by what is asked, should be against meant, and the two sweeps of 2026-09-04 that applied it found no node in the graph mis-encoded, which the author did not believe. The sweeps were not careless; the test cannot fail against its asker, because the wording of a question is the one thing the asker controls, and a discriminator that reads wording will pass whatever was written in the shape the writer chose. The reverse sweep's third check, the work a node does in the record, was the one check on that sweep that looked past wording, and it looked at incumbent work only, so a node nothing rests on yet passed it by silence. What the four tests share is that they are put to the response and not to the question: the class it could carry, the nodes it would reach, its life after the ruling, and its independence from its parent are all facts about what a disposition is that a probe cannot counterfeit, and each is checkable by a reading against the record as it stands.

The tie-break reverses between recording and review, and the answer says so rather than choosing one, because the cheaper error is different in the two: at recording a probe is promotable and a node is not demotable, so the probe is the reversible choice; at review the node already stands and may be the author's, so keeping it is.

The independence test's remedy stops where it does because of the rule this node states about itself. The author's words of 2026-09-06 delegate the prune of an unratified node, and put to the four tests above those words return a node on three of them: the response is a delegation, which only a disposition carries; it reaches `recording`, `frontier-consistency` and `viable-options` besides this one; and every later session that prunes anything needs it on its own account. So this rule says which nodes the test reaches and what a prune must leave behind, and `commons.systems/disposition-graph/graph-topology` says who may take it and under what bounds. A rule that conferred the power in its own prose would be conferring a class the record can only read off a ruling.

Readings owed under this node, each surfaced by the second evaluation and named here rather than minted: the distinction between a question of law and a question of fact, for the whole rule, the finder of fact answering what was intended and the court answering what binds, and for the survival test, since a finding of fact binds no later case and a holding does; the request for information against the change order in construction contracting, for the same line drawn where the drawings are the record, an RFI clarifying what the drawings mean and a change order altering what the contract requires, and for the rule that an RFI whose answer alters the contract is re-issued as a change order, which is the promotion clause; the erratum against the revising document in the IETF's practice, for the survival test, an erratum being consumed by the text it corrects; the parol evidence rule, for the ruling test's other face, that what a party intended is evidence and not term; and the issue-based information system already owed on the node node, for the difference between an issue, which stands, and a question put to a participant, which does not. The certified question and IEEE 830's TBD are already owed on the parent and are not repeated.

**AI divergence.** Four of the five paragraphs of the recommended answer are the AI's own: the three tests put to the response, the independence test, the two refusals and the tie-break were drawn in one sitting from the failure the author named and are not yet worn by use, and the survival test asks the recorder to predict whether a response will be needed later, which is a judgment about the future of the record and not a fact a reading can check today. On the clause that moved, sending the prune to a node of its own does not answer the case against the delegation, it only moves where the author rules on it: the power at issue is deletion, which `class-recommendation` names irreversible, conferred on the party that also finds the node redundant; the bound `may not prune something that is ratified` excludes nothing in the record as it stands, no option on any node carrying a ruling; and the second bound, that anything of the author's be transferred first, is checked by the same session that wants the file gone. The delegation is still a forward reference, acting only when `commons.systems/disposition-graph/graph-topology`'s authority fact is ruled, so what the author confirms here about the standing rule is where it will be answered and not what it says. And the interim is now the one part of this answer that acts today: it hands an untested discriminator a deletion before the node that would confer the power has been ruled, and which of the author's words reached a particular prune is read by the same session that wants the file gone, with nothing but that session's account to check it.

**Content.**

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

The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is re-encoded on the parent the same way but is not struck by the recorder: the survivor is recorded on the parent, the account folds into it, the author's words move with it, and the reason the question was closed is written down before the file goes. Who then takes the prune is not this node's to say, and this node does not confer it: the prune of a standing node is taken under the author's delegation of graph topology, which is recorded on `commons.systems/disposition-graph/graph-topology` and acts only when that node's authority fact is ruled `delegated`; until then a prune of a node no ruling reaches that the author has directed in their own words is taken on that word wherever it was given, in the dialogue or at the node's row, on the author's words of 2026-09-06 that the prune grant is standard disposition, a standing direction about a class of act rather than a grant given case by case; that such a direction acts by right is what the what-acts-during-bootstrap node's option `a-standing-direction-acts-by-right` records against that node's own definition of a grant, which reaches one named reconciliation and no class, so the interim rests on the author's words and on nothing that node confers until the option is ruled, and where no such word has been given the node's topology fact moves to `prune` with this test as its reason and the row asks the author. A ratified node's prune is asked at the row in either period. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.

Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.

Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node, once minted, stands until it is pruned, and while it stands it puts rulable rows on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.
```

#### an-alignment-input-decomposes-into-facts

An alignment input is an answer and not an open question, so it takes a fourth route
the four tests do not govern: it is decomposed into the disposition facts it bears
on, and lands on each as a reference to the ledger entry that holds the author's
words. The questions such an input raises still go through the four tests.

**AI support.** The rule as it stands is written for an open question found in a
movement, and all four of its tests are put to what the author's response would do,
so an input that is itself a response gives them nothing to test. Reading such an
input as a question is what produces the error the addition prevents: an input that
bears on six facts gets recorded as one probe or one node, and five of the six never
learn of it. Naming the fact as the fourth home states what the record already does,
every option's `supports` list being an input landed on a fact, and what the addition
supplies is the rule that says so, which is what a later sitting can be held to. The
three homes lose nothing, since the questions an input raises still run the tests.

**AI divergence.** This node asks when an open question is a probe, an option, or a
node, and the option answers a question the node did not ask, which is the shape the
record elsewhere calls a node of its own. A reader could hold that how an alignment
input decomposes belongs under `recording`, or under a node beneath `movements`, and
that what belongs here is at most the one sentence saying the tests do not run on an
input. It was written here because the sentence about three homes is here and would
otherwise stand unqualified, and that is a reason about where a claim already sits
rather than about where the answer belongs. The placement goes to the author with the
option.

**Content.**

From: interim-follows-the-authors-word

```diff
@@ -6,7 +6,7 @@
 ---
 ## Answer
 
-By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted where its question belongs under the record's own placement rule, which is what it refines, and entered in the blocked node's `depends`, since `depends` is what records the blocking and `under` what a node refines; the parent's third limb is amended with it.
+By what the author's response would do once it is given, and never by how the question is worded, since any question can be worded either way and the wording is the asker's to choose. An open question found in any movement has three homes in the record and this rule sends it to one of them; an alignment input, being an answer and not a question, has a fourth, and the paragraph after the four tests says which and why the tests do not run on it. It is an option where the AI holds a candidate answer to this node's question viable, whether or not it recommends that candidate: the record's home for a candidate is the fact it answers, and a question the AI could answer is not a question for the author. It is a probe where the AI holds no candidate it can recommend among without knowing something about what the author intends, and where the author's response, once given, would be consumed whole by moving a recommendation on this node: the response is quoted under `## Disposition`, the recommendation moves, and nothing afterwards needs to read the response rather than the recommendation it moved. It is a node where the response would have to stand: be enforced by the record after it is given, be cited by another node, project a rule, ground work, be read by a session that never saw the question, or be delegated or deferred. A response that must stand is a disposition, and the record has exactly one shape for a disposition, a question with its standing answer, its facts, and the ruling that gives it a class; a probe carries none of that, so wherever the response would need any of it the question is a node, minted where its question belongs under the record's own placement rule, which is what it refines, and entered in the blocked node's `depends`, since `depends` is what records the blocking and `under` what a node refines; the parent's third limb is amended with it.
 
 Four tests apply the rule, each put to the response and not to the question, and each with something a reading can check against the record; the first that settles the matter settles it.
 
@@ -18,6 +18,8 @@
 
 The independence test, which runs the other way and catches the opposite miss. A node whose only possible answer is a reading of its parent's answer, whose facts would repeat the parent's, and which would be pruned the moment the parent's recommendation moved is a probe on the parent and not a child of it: its question can be put as "on the parent, which did you intend", and that is a probe's question. Such a node found at recording is re-encoded on the parent, as a probe, or as an option on the parent's fact where the AI holds its answer viable, with `source` naming the node it was; its account folds into the parent's, any words of the author's on it move to the parent's `## Disposition`, and its options are struck, since options that were never candidates are the costumed options the author classified on 2026-09-04 on the review node. A node already standing is re-encoded on the parent the same way but is not struck by the recorder: the survivor is recorded on the parent, the account folds into it, the author's words move with it, and the reason the question was closed is written down before the file goes. Who then takes the prune is not this node's to say, and this node does not confer it: the prune of a standing node is taken under the author's delegation of graph topology, which is recorded on `commons.systems/disposition-graph/graph-topology` and acts only when that node's authority fact is ruled `delegated`; until then a prune of a node no ruling reaches that the author has directed in their own words is taken on that word wherever it was given, in the dialogue or at the node's row, on the author's words of 2026-09-06 that the prune grant is standard disposition, a standing direction about a class of act rather than a grant given case by case; that such a direction acts by right is what the what-acts-during-bootstrap node's option `a-standing-direction-acts-by-right` records against that node's own definition of a grant, which reaches one named reconciliation and no class, so the interim rests on the author's words and on nothing that node confers until the option is ruled, and where no such word has been given the node's topology fact moves to `prune` with this test as its reason and the row asks the author. A ratified node's prune is asked at the row in either period. The test does not reach a reading: a reading's answer is a standing relation between a tradition and the node above it, which stands by construction.
 
+The fourth home is the fact, and it is reached by decomposition rather than by the four tests. An alignment input is the author's answer given without a question having been put to them: it arrives through `/align <disposition>`, or as a response in a live sitting that says more than the probe asked, and it is not an open question at all, so there is nothing in it for the tests to classify. What is done with it instead is that it is read for the disposition facts it bears on, and on each of them it lands as a reference to the ledger entry holding the author's words, carried in an option's `supports` or `diverges` where it bears on an option and written into the fact's own prose where it bears on the fact as a whole; one input reaches as many facts as it bears on, and the same entry is referenced from each of them rather than copied. An input that bears on no fact bears on the sitting alone and stays in the store, which is `session-state`'s rule and not this one's. Where the decomposition finds a question the record does not hold, and an answer to a question nobody asked usually carries one, the four tests run on that question in the ordinary way. So the fourth home does not displace the three: it is where an answer goes, and the three are where a question goes.
+
 Two things the tests refuse to rest on. Whether the author has spoken: a probe asks what the author intends, and most of this record was minted without quoting them, so the absence of the author's words is not evidence that no disposition stands behind a node, and their presence is not evidence that a question is a probe; where the author has said nothing, the tests still run on what a response would do. And the question's wording: "what should this be" and "what did you mean by this" are each rewritable as the other, so wording is a tell and never the test, and the parent's line between a question of the record and a probe is read through this rule.
 
 Mixed cases resolve upward, and doubt resolves downward. A question whose response would both move this node's recommendation and stand is a node, because a node can carry both and a probe neither; it is entered in `depends` and the recommendation here waits on it. A question the recorder cannot classify is recorded as a probe, because that is the reversible error: a probe whose answer arrives and turns out to need to stand is promoted to a node then, with the author's words in hand to found it, whereas a node, once minted, stands until it is pruned, and while it stands it puts rulable rows on the alignment page and asks the author for a ruling where an answer was wanted. This is the opposite of the asymmetry the reverse sweep of 2026-09-04 worked under, which favoured keeping a node, and both are right: that sweep reviewed nodes already standing, where the expensive error is destroying a question the author may have asked for, and this rule governs the recording of new ones, where the expensive error is minting.
```

### authority

`ratified` is recommended on two of the three limbs `commons.systems/disposition-graph/class-recommendation` names, and either would carry it. Capture-shaped: the rule decides what the author is asked to rule on and what they are merely asked, so the party that would set it is the party it exists to check, and a recorder that may classify its own questions decides its own accountability. Irreversible: since 2026-09-07 the independence test's remedy reaches a deletion — "Irreversible means it is not paid back at all: a deletion, a swap, a landing that other work is built on" — and while the delegation that takes that deletion is now recorded on `commons.systems/disposition-graph/graph-topology`, the test that fires it is this node's, so a wrong test here is not paid back either. That is what makes a wrong ruling on this node unrecoverable rather than merely expensive, and it is the limb the reading of 2026-09-07 found missing. Boldness low: the escalation is the record's own test applied to a rule whose subject-matter is what the author sees, and the author may still hold the four tests to be operating detail under the parent's ratification and delegate them with it.

### topology

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

## Account

### Manifest

- Folded: Sitting on author-questions, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The grant to reconcile the skills, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Applied to the graph, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The grant renewed, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Where a pruned node's words go, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The recommendation moved to the author's delegation, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The probe discharged on the author's words, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 9d514d00, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The delegation sent to a node of its own, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 2faf26bc, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The interim follows the author's word, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 7bd00f2a, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of 7bd00f2a, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 0bd3f8b1, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

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

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/probe-or-node stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `by-what-the-response-does`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `interim-follows-the-authors-word`; 7 `## Disposition` entries became the ledger entries words/2026-09-04/21, words/2026-09-04/30, words/2026-09-04/31, words/2026-09-05/2, words/2026-09-05/3, words/2026-09-06/6, words/2026-09-07/17, referenced by 4 options the entry's own date names and by the recommended option for 3 the date named none; and `stands` left the answer fact. The content of `prune-delegated-with-two-bounds (at b57104b1)`, `delegation-carried-by-its-own-node (at 660d178d)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `by-what-is-asked`, `prune-granted-in-dialogue-needs-no-row`, `node-by-default`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `9a509a986a11feab5e49e4818d29b83b03547e08` is re-computed for the encoding as `378a53fb4aea7827a10ceabed59dd95943bef36e`; nothing it read changed. The survey's pin `7bd00f2a353005aebe5c3a8f16a0a381deb8ebe6` was already past the recommendation and is left as it stood.

### Frontier finding, 2026-09-07

Kind: cross-reference.

Four live options on `frontier-consistency`'s answer fact carry a validation list that ends at fifteen, while the node's account records the sixteenth as adopted into one of them: "Adopted into `split-survey-from-per-draft` on 2026-09-05: the survey's list names the sixteenth". The content fences of `split-survey-from-per-draft`, `the-survey-is-given-what-its-validations-read`, `one-line-only-where-a-survey-has-read-it` and `one-line-only-where-the-text-a-survey-read-still-stands` each end at "15. Merge. The opportunities to merge unanswered nodes as alternate answers to the same question", with no independence validation after it, and each is written in the struck term — "the node as it stands or the alternative it names" and "it adopts a listed alternative or the node as it stands". Ruling for any of the four would strike the independence validation and restore the word the recommended answer replaced, without saying it was doing either.

Also named: commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/graph-topology.

Proposed: The survivor is the recommended answer's list of sixteen validations in the record's current vocabulary. The four live option fences are re-derived from it, each carrying only its own named change, so that the difference between an option and the answer is the change the option's name states and nothing else. `probe-or-node` is named because it owns the sixteenth validation the fences drop, and `graph-topology` because `sixteenth-validation-reads-the-delegation` makes that validation read the delegation off it.

Recorded as an option on commons.systems/disposition-graph/frontier-consistency's answer fact: `the-live-options-carry-the-sixteenth-validation` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: supersession.

dialogue's standing answer: 'The author\'s words are not a section of the node. They are entries of the ledger, verbatim and dated' and 'There is no `## Recommendation` section, no `## Answer` section, no `## Rationale` section and no `## Disposition` section.' Superseded texts still standing: frontier-consistency 'So the words under `## Disposition` are carried for every node, judged, reached or unreached'; author-questions 'the reason names their words, which are under `## Disposition` verbatim and dated as the checkpoint node requires and are never copied into the field'; probe-or-node 'the response is quoted under `## Disposition`, the recommendation moves' and 'any words of the author\'s on it move to the parent\'s `## Disposition`'; decomposition 'The questions refused fold back into the parent\'s `## Disposition`, where their words already are.'; transience 'the author\'s words, verbatim and dated, in a `## Disposition` section'. The migration the two dated clauses wait on has landed at least in part: the brief prints '`the-survey-skill-launches-a-selected-reading` (answer) supports words/2026-09-04/10' resolved to the author's text, and dialogue's account names '`packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry', so recording's 'until it lands no instrument resolves a reference into one' and materialization's 'before that migration lands, a session reading this rule finds the enumeration\'s third term unmaterialized' are dated past.

Also named: commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/transience.

Proposed: dialogue and quotes survive. The five nodes that place words under `## Disposition` are amended to say the words are ledger entries referenced from the option or probe they bear on; recording and materialization strike or date their 'until it lands' clauses once the applying session confirms the migration's extent; quotes' answer states the partial state if any node's words are still unmigrated.

### The fourth home, 2026-09-08

The option `an-alignment-input-decomposes-into-facts` was recorded in the alignment
sitting of 2026-09-08 under the grant at `words/2026-09-08/2` as refined at
`words/2026-09-08/22`, from steps 1 and 3 of `words/2026-09-08/36`. No recommendation
was moved: the author gave the seven steps as an option emerging from the dialogue and
not as a settled answer. The option's own divergence carries the placement question,
whether this belongs here or under `recording`, and the author is asked it with the
option rather than after it.

One defect on the recommended option was found and not repaired. `interim-follows-the-authors-word`
still says a probe's response "is quoted under `## Disposition`", a section the content
encoding removed in the migration of 2026-09-07; the repair moves a recommendation,
and entry 36 gave the AI no warrant to move one, so the defect is on this sitting's
residue and named here rather than fixed.

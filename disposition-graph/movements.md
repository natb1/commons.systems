---
question: What movements does a sitting make, and what selects the one it makes next?
stage: maieutic
probes:
  - id: is-the-stage-field-the-diagnosis
    asks: >-
      If the movement follows a diagnosis of what the node lacks, is the
      existing `stage` field that diagnosis, or is the diagnosis a second thing
      the record does not hold?
    fact: answer
    why: >-
      The answer says the sitting's first act is to diagnose the node's state
      and that the record's diagnosis is the `stage` field. Today `stage` is
      written by the skill to mark where the node has got to in a sequence, and
      is read by the projector, the frontier and the alignment page. If the
      field becomes a reading of what the node lacks, those readers change
      meaning under it; if it does not, the diagnosis has no home and the
      answer's selection rule runs on nothing.
    discharges: >-
      Whether `stage` is re-defined by this node or a diagnosis is recorded
      beside it, and therefore what the frontier and the alignment page show.
      It does not move the answer's first three paragraphs.
    source: ai
    raised: 2026-09-08
facts:
  - name: answer
    options:
      - name: three-movements-selected-by-diagnosis
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/4
          - words/2026-09-08/6
          - words/2026-09-08/8
          - words/2026-09-08/9
          - words/2026-09-08/10
      - name: periagoge-maieutic-review-in-sequence
        source: commons.systems/disposition-graph/growth
        ref: "2026-09-02"
        diverges:
          - words/2026-09-08/8
      - name: two-movements-and-review-outside-them
        source: ai
        ref: "2026-09-08"
      - name: the-selection-rule-is-its-own-node
        source: ai
        ref: "2026-09-08"
    recommends: three-movements-selected-by-diagnosis
    boldness: moderate
    against: "The answer names a third movement the record has never had, and names it from a tradition the AI chose after the author asked what tradition says, which is the shape of a reading picked to fit a conclusion. It also gives the sitting a discretion it did not have: under a fixed sequence a session that skipped the periagoge could be caught by the record, and under a diagnosis the session says which movement the node needed and there is nothing to check that against, so the clause that promises three movements can be discharged by a sentence claiming the node needed only one. The cost the author raised is not obviously paid either: a diagnosis that can send the sitting back to any movement admits an unbounded number of passes, where the sequence at least terminates."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - elenctic
---

## Facts

### answer

The answer fact recommends `three-movements-selected-by-diagnosis`, the four clauses the author gave on 2026-09-08 for what the periagogic and maieutic movements are for, with a third movement named for the operation the first two already relied on and with the sequence between them replaced by a diagnosis, which is the author's own point that the orchestration is not a simple periagoge to maieutic to review sequence. Boldness is moderate: the four clauses are the author's words and the two paragraphs that follow them are the AI's, and the second of those adds a movement and a selection rule the record has not carried.

#### three-movements-selected-by-diagnosis

The four clauses the author gave on 2026-09-08 for the periagogic and maieutic movements, stated as the movements themselves; a third, elenctic movement named for the refutation both of the others already turn on; and the sequence between the three replaced by a diagnosis of the node, which is what the author's words of the same day ask for in saying the orchestration is not a simple periagoge to maieutic to review sequence. The reading behind the third movement and the selection rule is `plato-elenchus`.

**AI support.** The four clauses are the author's and are transcribed, not summarized. What the AI adds is the observation that they already presuppose refutation: turning the author to grounding does nothing unless the grounding can defeat what the author was going to say, and resolving an ambiguity in an articulation is done by putting the readings against the author's other commitments and finding which cannot stand. Naming that operation gives the record a word for what its clean-context review does and separates the two functions the review is currently asked to serve at once. The selection rule follows from the same source: the Sophist puts refutation before instruction and the Theaetetus puts delivery before refutation, and both are Plato, so the tradition the author asked for is on its face a tradition of no fixed order. Two questions the author raised the same day as separate inputs land on this answer through the selection rule rather than on nodes of their own: whether the survey is redundant with the periagoge, which the instrument clause answers by saying what the survey is, and where the cost of a sitting can be reduced without weakening it, whose first lever is the movement that is diagnosed away.

**AI divergence.** The record has taken the author's four clauses at their word and has not tested one of them, and the untested one is the one its own reviewer already attacked: `plato-periagoge` carries a strong against, of 2026-09-03, holding that turning the author toward a record the AI drafted is induction into a text whose predictable failure is that the author's account converges on the record's wording. The author's clause names tradition and the recorded graph together as the grounding, which answers the objection only for the half that is tradition. This answer states that the draft enters as a refusable counterpoint, which is a rule about how the AI speaks and not a mechanism, and nothing in the record measures whether the author's articulation converged on it. The cost clause is the weaker of the two additions: that a movement not made is not paid for is true of any selection rule and does not say a sitting under this answer is cheaper than one under the sequence, since the same diagnosis that skips a movement may loop back to it twice. The measurement is not in the record, and the answer claims a lever and not a saving.

**Content.**

```markdown
---
question: What movements does a sitting make, and what selects the one it makes next?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - elenctic
---

## Answer

Three, and none of them is a stage. The periagogic movement turns the author toward what grounds the question: the traditions the record cites, the nodes already answered that bear on it, and the alternatives the AI would recommend against the question the author's articulation implies. Its object is common ground on the viable answers, and the turn is toward the grounding and not toward the AI's draft; where the session holds a draft it enters as a counterpoint the author may refuse, never as the premise the author is asked to accept, and where the AI would answer the inferred question differently it says so and puts its alternative on the table before the author is asked to choose. The maieutic movement draws the disposition out of the author and resolves the ambiguities in the author's articulation of it: which question the words answer, which of two readings they carry, what they exclude, and where they are silent. The elenctic movement tests what has been drawn out against what the author and the record already hold, and returns one of two findings, that the disposition stands, or that it is a wind egg, an articulation that cannot survive its own commitments.

What selects the next movement is the state of the node, and the sitting's first act is to diagnose it. Tradition is explicit both that the order is not fixed and that the diagnosis is the dialectician's own work: in the Sophist refutation comes before instruction, because a man who does not know that he does not know takes nothing in until the conceit is purged, and in the Theaetetus delivery comes before refutation, because the interlocutor is already carrying something and does not know it. Meno must be numbed and Theaetetus must be delivered, and the difference is in them and not in the method. The record's own diagnosis is the node's stage, which today is set by where the node has got to in the skill's sequence rather than by what the node lacks; under this answer the stage is a reading of the node and the movement follows it. A node whose question the author has not been turned to takes the periagogic movement. A node whose articulation admits two readings takes the maieutic. A node whose draft stands unrefuted takes the elenctic, and a node whose draft has just been refuted returns to whichever movement the refutation named, which is the loop and not a fall to the end. A sitting may make one movement or all three, and may make the same one twice.

The three movements are not three instruments. The elenctic movement is served twice, and must be, because it discharges two functions that are not the same: the wind egg test, which belongs to whoever drew the offspring out and is part of producing it, and the purgation of the drafter's own conceit, which the drafter cannot discharge on itself and which is why the record reads its recommendation once more in clean context before the author rules. Only the second is capture shaped. The first is a duty of the sitting and buys nothing by being bought a second time. An instrument is not a movement, and no movement is redundant with an instrument that serves it. The survey is an instrument of the periagogic movement: it reads the graph for what bears on the question and returns the grounding the author is turned toward, so its findings are owed to that movement, and asking whether it duplicates the periagoge is asking whether a tool duplicates the hand.

What the diagnosis buys is that a movement is made only where the node's state calls for it, and a movement not made is not paid for. That is this node's whole share of the cost of a sitting: a node needing to be turned is not sent to be refuted, a node carrying an unrefuted draft is not turned again, and the passes a fixed sequence spends on movements the node did not need are the passes the diagnosis does not spend. The other two shares are not here. What an instrument returns instead of a session reading the graph itself belongs to the instruments, and what a session keeps across a compaction belongs to the record's own context nodes.

The movements are what a sitting does, and this node does not carry them yet. `growth` states them in its answer and carries them until its answer is amended, and the option that makes the move is `split-presentation-and-movements` on `growth`, of which this node is the movements half; `periagogic` and `maieutic` stay defined where they are defined, for the same reason. Nothing has moved: the move is what a ruling here makes.
```

#### periagoge-maieutic-review-in-sequence

The movements as `growth` states them and as the alignment skill runs them: a periagogic movement that grounds the author in the record, a maieutic movement that draws the disposition out, and a review that reads the result, taken in that order, once each. Two movements, not three, with adversarial review outside them as an instrument applied to the product. This is what the record carries today and what the author's words of 2026-09-08 say the orchestration is not.

**AI support.** A fixed order is checkable. A session that reports having grounded the author and then drawn the disposition out has made two claims a reader can test against the transcript, and the order means the author is never asked to articulate a disposition before being shown what the record already holds on it. Nothing in the record has yet shown a node the order handled badly, as against a session that skipped a movement it was supposed to make.

**AI divergence.** The author's words of 2026-09-08 name this option and reject it, and the reason is in the record's own experience of it: the skill's sequence is what the author says the dialogue skims past, because a movement that is always made is a movement that can be made nominally. A fixed order also cannot express the two cases tradition is built on, the interlocutor who must be refuted before anything can be delivered and the one who is already carrying something and must be delivered first.

**Content.**

```markdown
---
question: What movements does a sitting make, and what selects the one it makes next?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Two, in order, with review outside them. The periagogic movement grounds the author in what the record already holds on the question; the maieutic movement draws the author's disposition out and records it; and the clean-context review reads what the sitting produced before the author rules. The order is fixed, and a sitting makes each movement once.
```

#### two-movements-and-review-outside-them

The author's four clauses are taken as they stand and the selection rule with them, but refutation is not named as a third movement: it stays what the record calls it today, an instrument applied to the sitting's product by a second party in clean context. The movements are two, the diagnosis selects between them, and the review is what happens after both.

**AI support.** It keeps the record's existing division, in which a movement is something the dialogue with the author does and a review is something done to the dialogue's output, and it does not ask the author to accept a new term. It is also the cheaper reading of the author's words, which name the movements as periagogic and maieutic and speak of adversarial review as a third thing to be orchestrated with them rather than as one of them.

**AI divergence.** It leaves the record with no word for the operation both movements turn on, and so cannot say what the wind egg test inside a sitting is, which is the thing that is not the clean-context review and is not currently anywhere. The consequence is the one the record already shows: the whole weight of refutation falls on the instrument that runs after the sitting, which is why that instrument is where the cost went.

**Content.**

```markdown
---
question: What movements does a sitting make, and what selects the one it makes next?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Two, and neither is a stage. The periagogic movement turns the author toward what grounds the question: the traditions the record cites, the nodes already answered that bear on it, and the alternatives the AI would recommend against the question the author's articulation implies. The maieutic movement draws the disposition out of the author and resolves the ambiguities in the author's articulation of it. What selects between them is the state of the node and not a fixed order, and the sitting's first act is to diagnose it. Adversarial review is not a movement: it is the instrument a second party in clean context applies to what the sitting produced, before the author rules.
```

#### the-selection-rule-is-its-own-node

This node carries what the three movements are and no more, and the selection rule, which says what selects the movement a sitting makes next and re-reads the `stage` field as a diagnosis, moves to a child node beneath it. The node's question is two questions on its face, and `node`'s rule is that a text answering two questions is two nodes.

**AI support.** The two halves have different authorities on their face. What the movements are is the author's articulation, transcribed. What selects among them is the AI's, and it changes the meaning of a field two projections already read. Splitting them lets the author ratify the first without ratifying the second, which is what `delegation-bounds-and-sizing` did for the same shape of problem, and that is the record's own precedent.

**AI divergence.** The split is proposed by the party it benefits, which is the objection `delegation-bounds-and-sizing` records against itself. It also separates a rule from the thing that makes it operable: the movements without a selection rule are three names, and a reader who has only the parent cannot conduct a sitting from it.

**Content.**

```markdown
---
question: What movements does a sitting make, and what selects the one it makes next?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - elenctic
---

## Answer

Three. The periagogic movement turns the author toward what grounds the question: the traditions the record cites, the nodes already answered that bear on it, and the alternatives the AI would recommend against the question the author's articulation implies. Its object is common ground on the viable answers, and the turn is toward the grounding and not toward the AI's draft; where the session holds a draft it enters as a counterpoint the author may refuse, never as the premise the author is asked to accept. The maieutic movement draws the disposition out of the author and resolves the ambiguities in the author's articulation of it: which question the words answer, which of two readings they carry, what they exclude, and where they are silent. The elenctic movement tests what has been drawn out against what the author and the record already hold, and returns one of two findings, that the disposition stands, or that it is a wind egg, an articulation that cannot survive its own commitments. What selects the one a sitting makes next is the question of the node beneath this one.
```

### authority

Ratified, at low boldness. The movements are the conduct of the one dialogue that checks the AI, and the party that would otherwise set them is the party the dialogue exists to check, which is the capture limb of `class-recommendation`'s test; the same reading `delegation-bounds-and-sizing` gives for the clause fixing the alignment thread's model applies here with more force, since a wrong sizing spends tokens and a wrong conduct spends the check itself. Low boldness because the reading is the record's own rule applied to a case it already decided the same way.

## Account

### Minted, 2026-09-08

The author's words of 2026-09-08 gave four clauses for what the periagogic and maieutic movements are for, asked what tradition says of adversarial review's function, held that the orchestration is not a simple periagoge to maieutic to review sequence and asked whether tradition has a reference for orchestrating it, and directed the sitting to conduct itself under whatever it worked out rather than under the incumbent skill. The clauses answer a question `growth` states in a subordinate clause of a paragraph that answers at least seven, and the option `split-presentation-and-movements` on `growth`, raised twice by the reviewer on 2026-09-03 and declined twice, is the record's own proposal to give them a node. This node is the movements half of that option, minted under the author's grant of 2026-09-08 for this sitting. The presentation half is not minted and stays with `growth`.

Nothing moved out of `growth`. Its answer still states the movements and still defines `periagogic` and `maieutic`, and this node says so in terms, on the pattern `delegation-bounds-and-sizing` set for `delegation`: a ruling here is what makes the move, because a ruling is recorded per fact and `growth` has one answer fact, so there is no act by which the author ratifies part of it.

The third movement is new. The record had two names and no name for the operation both of them turn on, and the reading `plato-elenchus` was minted with this node to carry the tradition the author asked for. The two functions the answer separates, the wind egg test inside the sitting and the purgation of the drafter's conceit from outside it, are the answer to the author's question of the same day about adversarial review's theoretical function; the second is the one `clean-context-review` serves, and the finding that only it is capture shaped is recorded as an option there.

The `stage` field is read here as a diagnosis, which is a change in what a field two projections already consume means. The probe `is-the-stage-field-the-diagnosis` carries it, and the answer's first three paragraphs do not turn on how it is discharged.

### Two mid-sitting questions reached the answer, 2026-09-08

The author raised two further questions the same day, whether the survey function of the alignment dialogue is redundant with the periagoge, and how orchestration, tooling and context management together reduce the cost of alignment without weakening it. Both were raised as alignment inputs of their own and neither was given a node. They reached this answer because the selection rule is what they turn on: the first is answered by saying what a survey is, an instrument of the movement it serves rather than a fourth thing beside the three, and the second by saying that a movement the diagnosis does not call for is not made and not paid for. The sequencing is the one `alignment-target`'s option `mid-sitting-input-is-sequenced-not-substituted` describes, and this entry is the first record of it being applied: the inputs did not displace the node in hand, and they were not held over.

Only one of the three levers the cost question names is here. The instruments the second lever asks for are the subject of the sitting's other open inputs, and what a session carries across a compaction has no node yet; the answer says so rather than claiming the whole of the cost question. The claim the answer makes about cost is a lever and not a measurement, which the option's divergence records.
### The skill is not reconciled to this node, 2026-09-08

The author's grant of 2026-09-08 names the alignment skills among what the
sitting may reconcile, and this node was not reconciled into
`.claude/skills/align/SKILL.md`. What the answer describes is a skill that does
not exist yet: one whose sitting begins by diagnosing what the node lacks and
selects its movement from that, where the incumbent runs a fixed sequence and
writes the stage to mark where in that sequence the node has got to. Changing it
is not a wording change, because the stage field would stop meaning position in
a sequence and start meaning a reading of the node, and every instrument that
reads a stage would follow.

Why the sitting stopped short of it. The grant lets a sitting proceed with its
own recommendations applied, and this sitting did: the topology grounding
recorded on `commons.systems/disposition-graph/graph-topology` was made under
these movements and not under the skill's sequence. Writing them into the skill
is a further step, because the skill binds every sitting after this one and this
node is unanswered, so the recommendation that would bind them is one no ruling
reaches. The AI judged that departing from the incumbent skill for the sitting
in front of it is what the author's words licensed, and that making the
departure permanent is the author's to rule.

What that leaves. The skill and this node disagree, and the disagreement is not
hidden in either: it is stated here and in the answer's own account of what the
stage is today. It is a reconciliation item on this node, owed once the answer
is ruled on, and until then a sitting that follows the skill and a sitting that
follows this node will run differently, which is the cost of leaving it and is
recorded rather than argued away.

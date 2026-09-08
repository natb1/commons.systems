---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
stage: maieutic
probes:
  - id: bundled-disposition-as-queued-questions
    asks: >-
      Is a bundled disposition read as questions queued under the node it
      refines?
    fact: answer
    why: >-
      The author's opening words hand the sitting two multi-part examples and
      ask for the seams by which such dispositions are decomposed; the record's
      ground for the decomposition, the `node` node's rule that a text answering
      two questions is two nodes, is not cited in the author's words, and the
      account names that rule as the probe the periagogic stage put.
    discharges: >-
      Whether the decomposition's first seam holds, which moves the answer
      fact's recommendation off `seams-and-split-review`.
    source: ai
    raised: 2026-09-04
    status: discharged
    reason: >-
      The author answered on 2026-09-04, in the words quoted last under this
      node's `## Disposition`; the `### Grant of 2026-09-04` records that the
      answer takes the recommendation as presented, its reading of a bundled
      disposition as questions queued under the node it refines included.
facts:
  - name: answer
    options:
      - name: seams-and-split-review
        source: ai
        ref: "2026-09-04"
      - name: pre-review-under-the-batch
        source: ai
        ref: "2026-09-04"
      - name: decomposition-before-minting
        source: review
        ref: "2026-09-05"
      - name: main-thread-performs-the-surveys
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: "the delegation node already rejects it: the size of a survey is unknown until it is read"
      - name: one-unit-per-disposition
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: "it hands a subagent the interview"
      - name: decomposition-by-the-author
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: "the sitting can propose it and the author need only refuse"
      - name: reviewer-on-a-fixed-model
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: the model is the review-model node's question since 2026-09-04, where the author's words decide it for both readings
      - name: no-carrier-and-the-questions-are-progressed
        source: author
        ref: "2026-09-05"
        supports:
          - words/2026-09-05/1
      - name: unit-models-left-to-delegation
        source: review
        ref: "2026-09-05"
        status: passed
        reason: "the assignment of each seam to a model is what the rationale calls new, and a seam named without a model leaves each sitting the choice the author asked to be standardized"
      - name: units-carried-by-their-own-skills
        source: commons.systems/disposition-graph/unit-skills
        ref: "2026-09-07"
      - name: a-unit-returns-the-amendment
        source: ai
        ref: "2026-09-07"
        supports:
          - words/2026-09-04/23
          - words/2026-09-04/24
          - words/2026-09-07/5
          - words/2026-09-07/6
          - words/2026-09-07/7
          - words/2026-09-07/8
          - words/2026-09-07/10
      - name: citation-moves-to-unit-sizing
        source: review
        ref: "2026-09-07"
      - name: units-are-readings-not-surveys
        source: review
        ref: "2026-09-07"
    recommends: a-unit-returns-the-amendment
    boldness: moderate
    against: "A per-draft brief carried the index of every standing answer, so a sitting of several questions read several times the tokens of the one batch it replaced, and the author's first-named judge is token efficiency; the design stood on their second, attention, and on timing, and the index was the lever against the cost. The `review-cost` node pulled that lever on 2026-09-05: the index is one line a node and a brief is roughly a third of what it was, so the case against is now the residue, that a sitting still pays a fixed cost of brief and contract per draft where the batch paid it once."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The author's words on viable-options leave the right-sizing of models and effort to the AI's judgment, which is the review-model node's recorded case for delegated and bears harder here, where the author named no model and asked for right-sized ones."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 5e56e6b8fed51a4739882eb744083fd913ec916e
  commit: 8a672c17fcd4f0bf104d3c4e2a87077eb1213d7c
  against: "The measured byte totals for the eight design units (16,432 to 44,306 bytes, 281,879 total) recompute today to 282,151 bytes across the same files, roughly 0.1% over the stated figure, which is within noise (the files may have been touched fractionally after the cited commit) and not a material misstatement. No other gap found."
  survey:
    date: 2026-09-07
    of: 5e56e6b8fed51a4739882eb744083fd913ec916e
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "b7be0c0bccbe17b9e3ae32c87cf3c070e291493bb1277d94af19536c80084481"
      answer: "03740cf9e80201461b02d424af40fb9f6e34011a3a70e47c3bab9fc020a38318"
      options: "23aa78c221cd280c6183d1f22b4c44e06574fb08ac18f55da09b7a2726d55e0c"
      rivals: "f62628bf4bb3c890c1a23f71d5620d511ed22defa180ea1509aaec4bc8a0bf26"
      words: "b372d10c54ff730b0603ff96942cfdb70aa458eb35dccc12738cd4cde8135e75"
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
depends:
  - commons.systems/disposition-graph/clean-context-review#pointers-for-what-grows-with-the-record
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
  - commons.systems/disposition-graph/tier
---

## Facts

### answer

The recommendation stays `seams-and-split-review` in substance and moves to `a-unit-returns-the-amendment`, which is that text with one clause on what a unit returns: a unit whose conclusion is a change to a text that already stands returns the change and not the text -- each locus as the exact bytes it replaces and the exact bytes it puts there -- and never a node, a section or a recommendation fence redrawn whole. A unit whose conclusion is a new text returns it whole, because there is nothing to pair it against.

The author's words of 2026-09-04 that this node answers name token and context efficiency and the management of the AI's attention as the judges of the decomposition, and their words of 2026-09-07 ask for the optimizations of the dialogue workflow. Measured at implementation commit `87e4b24e`, the eight design units of 2026-09-06 and 2026-09-07 returned between 16,432 and 44,306 bytes each and 281,879 bytes in all, and each of them redrew whole the sections it changed. The main thread reads all of that to find the sentences that moved, and the reading that follows is handed a redrawn text whose difference from the pinned one is the only thing it is judging -- which is what the `review-cost` node's re-reading rule already says the object is. The pairs are that difference, written down once by the unit that made it, instead of derived twice, once by the thread and once by the reader.

Moderate boldness. What rests on the author is the criterion, twice stated, and the seams, which are the record's own; what rests on the AI is that the shape of a unit's output is part of what a seam is worth, and the judgment that a pair is cheaper to integrate than a redraw. The cost is real and is on the fact: a unit that returns pairs writes no whole text, so nothing checks that the amended text reads as one argument until the main thread has spliced it.

#### seams-and-split-review

Five seams, the question, the movement, the kind of analysis, the fact, and the dependency, each dividing a sitting's work into units the main thread integrates from their conclusions alone; the order the units run in, the surveys together, the design after them, the review after the design; and the review divided by its object, which is the division the clean-context-review node carries as the option `per-draft-and-survey` and now recommends as part of `pointers-for-what-grows-with-the-record`, and the option `split-survey-from-per-draft` on the frontier-consistency node, both in `depends` at the option the author is being asked to confirm, so that a confirmation here confers the seams and the order and not the review's shape. The recommended text sets it out.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

From: a-unit-returns-the-amendment

```diff
@@ -20,4 +20,4 @@
 
 The dependency. The questions a decomposition yields carry depends among themselves. Their surveys run in parallel regardless; a design waits on the recommendation, not the ruling, of the question it depends on; the main thread integrates the questions in their ruling order; and the review of each draft runs the moment its recommendation is recorded, while the others are still in hand, so that the counter-argument reaches the main thread with the node it concerns and never as a batch of findings on nodes it has stopped seeing.
 
-Every unit returns its conclusion as data with the commands it ran and writes nothing to the record, and a unit whose conclusion is a change to a text that already stands returns the change and not the text: each locus it would amend as the exact bytes it replaces and the exact bytes it puts in their place, and never a node, a section or a recommendation fence redrawn whole. A redraw hands the main thread a text it must diff against the record to learn what the unit decided, so the thread reads the whole of what it already has in order to find the part it does not; the pairs are that difference written down, and they are what the thread validates, what its own adversarial reading is over, what the applying step needs, and what the re-reading's object already is by the review-cost node's rule. A unit that cannot name the bytes it is replacing has not located its own change. Where a unit's conclusion is a new text and not a change to one, a node the sitting is minting or a fence the node has never carried, there is nothing to pair it against and it is returned whole. the main thread writes the conclusion into the node's account at the next checkpoint, so that the record and not the session carries it, and a session that loses its context resumes from the node. This answer is materialized by the alignment skill's list of a sitting's units, under the shim the growth node declares on that skill, with two gaps this node discloses rather than presumes closed: the skill's list still carries the escalation trigger this answer superseded, and the reconciliation of it is owed; and the shim's own scope reaches the growth node and its siblings, where this node is that node's grandchild, which is recorded as an option there.
+Every unit returns its conclusion as data with the commands it ran and writes nothing to the record; the main thread writes the conclusion into the node's account at the next checkpoint, so that the record and not the session carries it, and a session that loses its context resumes from the node. This answer is materialized by the alignment skill's list of a sitting's units, under the shim the growth node declares on that skill, with two gaps this node discloses rather than presumes closed: the skill's list still carries the escalation trigger this answer superseded, and the reconciliation of it is owed; and the shim's own scope reaches the growth node and its siblings, where this node is that node's grandchild, which is recorded as an option there.
```

#### pre-review-under-the-batch

The same five seams, with the review the author requires added inside the sitting as a pre-review whose findings go into the node's account, while the batch review of the clean-context-review node's standing answer stays the only review of record and the only thing that forwards a node to the ruling stage. Viable if the author holds that no node reaches the ruling stage except through one reading of the whole frontier, which is what their words of 2026-09-03 say; its cost is that validations one to six run twice on every draft, and that the batch still returns its findings on a sitting's children after the sitting has moved on from them.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The same five seams, with the review the author requires added inside the sitting as a pre-review whose findings go into the node's account, while the batch review of the clean-context-review node's standing answer stays the only review of record and the only thing that forwards a node to the ruling stage. Viable if the author holds that no node reaches the ruling stage except through one reading of the whole frontier, which is what their words of 2026-09-03 say; its cost is that validations one to six run twice on every draft, and that the batch still returns its findings on a sitting's children after the sitting has moved on from them.
```

#### decomposition-before-minting

The decomposition is put to the author before the queued nodes are minted: the author's words are checkpointed on the node the disposition refines, the survey's proposal is put at the periagogic stage, and the nodes are minted after the author's response. Raised by the reading of 2026-09-05, which observed that a node once minted is refusable only by a prune the author rules, where a probe is refusable by a word. Viable if the author would rather rule once on a decomposition than rule prunes on nodes they refuse; its cost is that the queue is invisible on the alignment page until the author answers, and that a session lost between the words and the response resumes from the parent alone.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The decomposition is put to the author before the queued nodes are minted: the author's words are checkpointed on the node the disposition refines, the survey's proposal is put at the periagogic stage, and the nodes are minted after the author's response. Raised by the reading of 2026-09-05, which observed that a node once minted is refusable only by a prune the author rules, where a probe is refusable by a word. Viable if the author would rather rule once on a decomposition than rule prunes on nodes they refuse; its cost is that the queue is invisible on the alignment page until the author answers, and that a session lost between the words and the response resumes from the parent alone.
```

#### main-thread-performs-the-surveys

The main thread performs the surveys itself rather than delegating them. It
was passed over because the delegation node already rejects it: the size of a
survey is unknown until it is read.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The main thread performs the surveys itself rather than delegating them. It
was passed over because the delegation node already rejects it: the size of a
survey is unknown until it is read.
```

#### one-unit-per-disposition

A sitting is decomposed into one unit per disposition. It was passed over
because it hands a subagent the interview, which is the main thread's.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

A sitting is decomposed into one unit per disposition. It was passed over
because it hands a subagent the interview, which is the main thread's.
```

#### decomposition-by-the-author

The author decides how a complex disposition is decomposed. It was passed over
because the sitting can propose the decomposition and the author need only
refuse it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The author decides how a complex disposition is decomposed. It was passed over
because the sitting can propose the decomposition and the author need only
refuse it.
```

#### reviewer-on-a-fixed-model

The reviewer is chosen by a fixed model rather than by the draft's boldness.
On 2026-09-04 the author's words put both readings on one
model, and the reader's model became the review-model node's question, where
its recommended option fable-for-both-readings is this option decided there;
it stays passed over on this fact only because the model is not this node's
question.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The reviewer is chosen by a fixed model rather than by the draft's boldness.
On 2026-09-04 the author's words put both readings on one
model, and the reader's model became the review-model node's question, where
its recommended option fable-for-both-readings is this option decided there;
it stays passed over on this fact only because the model is not this node's
question.
```

#### no-carrier-and-the-questions-are-progressed

It would add to the first seam two sentences the answer does not carry, in the
author's words of 2026-09-05. That a decomposition mints no carrier: the node
standing for the bundled input as a whole is not implied by the input being
bundled, so a sitting that decomposes records the questions and leaves the
words on the node the disposition refines, where this answer already puts the
ones a question refuses. And that the questions the decomposition mints are
progressed through dialogue rather than merely recorded, so that decomposing is
not a way of closing a sitting. It would also make explicit what the answer
already implies in the clause "where each sits under the record", which the
author's second sentence affirms: the questions a decomposition yields need not
be siblings and need not share a parent.

The record minted such a carrier on 2026-09-05,
`commons.systems/disposition-graph/alignment-page-observations`, which is the
evidence that the rule is not in the answer today; its existence fact already
recommended `prune` before these words, on the independence test, and the
author's words are what the rule would be, not what that prune rests on.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

It would add to the first seam two sentences the answer does not carry, in the
author's words of 2026-09-05. That a decomposition mints no carrier: the node
standing for the bundled input as a whole is not implied by the input being
bundled, so a sitting that decomposes records the questions and leaves the
words on the node the disposition refines, where this answer already puts the
ones a question refuses. And that the questions the decomposition mints are
progressed through dialogue rather than merely recorded, so that decomposing is
not a way of closing a sitting. It would also make explicit what the answer
already implies in the clause "where each sits under the record", which the
author's second sentence affirms: the questions a decomposition yields need not
be siblings and need not share a parent.

The record minted such a carrier on 2026-09-05,
`commons.systems/disposition-graph/alignment-page-observations`, which is the
evidence that the rule is not in the answer today; its existence fact already
recommended `prune` before these words, on the independence test, and the
author's words are what the rule would be, not what that prune rests on.
```

#### unit-models-left-to-delegation

The node names the five seams, the units, and the order they run in, and leaves
each unit's model to the delegation node's rule that the model follows the kind
of work, applied by the sitting rather than fixed here. Passed over because the
assignment of each seam to a model is what the rationale calls new, and a seam
named without a model leaves each sitting the choice the author asked to be
standardized. Raised by the clean-context reading of 2026-09-05, which found it
turned down in prose in the reply to the reading before it and never put on the
fact, where the viable-options node holds that a candidate never silently leaves
the list.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The node names the five seams, the units, and the order they run in, and leaves
each unit's model to the delegation node's rule that the model follows the kind
of work, applied by the sitting rather than fixed here. Passed over because the
assignment of each seam to a model is what the rationale calls new, and a seam
named without a model leaves each sitting the choice the author asked to be
standardized. Raised by the clean-context reading of 2026-09-05, which found it
turned down in prose in the reply to the reading before it and never put on the
fact, where the viable-options node holds that a candidate never silently leaves
the list.
```

#### units-carried-by-their-own-skills

The five seams, the units and their order are unchanged, and the answer's
closing sentence on how it is materialized moves: instead of "This answer is
materialized by the alignment skill's list of a sitting's units, under the shim
the growth node declares on that skill", each kind of unit is carried by a
skill of its own, and the alignment skill keeps the seams, the map from kind to
skill and the models, while each kind's object, brief, launch and integration
move into that kind's `SKILL.md`. Raised by
`commons.systems/disposition-graph/unit-skills`, minted under this node on
2026-09-07 from the author's words of that day, which asks whether each unit of
a sitting is its own skill and answers yes.

**AI support.** For it: the materialization this
sentence claims is already the weaker of the two things this node's reading of
2026-09-05 disclosed about it — the alignment skill still carries a superseded
escalation trigger, and `growth`'s shim is declared for that node and its
siblings while this node is its grandchild — so the sentence points at an
artifact that neither matches this answer nor is covered by the shim it cites;
seven skills, each a declared shim on the node it projects, replace both
defects with a declaration that reaches.

**AI divergence.** Against it: the kinds and their models
are this node's answer, and moving their instructions into seven files puts
seven hand-written projections of this node's list in the interval
`hand-written-projection-drift` asks about, where one file stands today. The
option acts on nothing until the author rules; the child's answer names this
sentence as what the sitting would amend and does not amend it, since another
unit is amending this node's fence in the same sitting.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

The five seams, the units and their order are unchanged, and the answer's
closing sentence on how it is materialized moves: instead of "This answer is
materialized by the alignment skill's list of a sitting's units, under the shim
the growth node declares on that skill", each kind of unit is carried by a
skill of its own, and the alignment skill keeps the seams, the map from kind to
skill and the models, while each kind's object, brief, launch and integration
move into that kind's `SKILL.md`. Raised by
`commons.systems/disposition-graph/unit-skills`, minted under this node on
2026-09-07 from the author's words of that day, which asks whether each unit of
a sitting is its own skill and answers yes.
```

#### a-unit-returns-the-amendment

Everything `seams-and-split-review` says, with one clause on the last paragraph, which says what every unit returns. A unit whose conclusion is a change to a text that already stands returns the change: each locus as the exact bytes it replaces and the exact bytes it puts in their place, and never a node, a section or a recommendation fence redrawn whole. A unit whose conclusion is a new text -- a node the sitting is minting, a fence the node has never carried -- returns it whole, since there is nothing to pair it against.

**AI support.** For it: a redraw makes the main thread diff a text against the record to learn what the unit decided, so the thread reads the whole of what it already has to find the part it does not; the pairs are that difference written down, and they are what the thread validates, what the applying step needs, and what the re-reading's object already is by the `review-cost` node's rule. A unit that cannot name the bytes it is replacing has not located its own change. Measured: the eight design units of 2026-09-06 and 2026-09-07 returned 281,879 bytes in all, each a whole redraw of the sections it touched.

The author's words of 2026-09-04, quoted on this node: complex dispositions need multi-faceted analysis, to be divided along standard seams among subagents with right-sized models and effort and integrated by the main thread, judged by token and context efficiency and by the management of the AI's attention, with a step after a recommendation is established that passes the complex ones to the most capable model for review. The seams are the record's own and this node only names them as seams: the question seam is the node node's rule that a text answering two questions is two nodes, which the dialogue node applies to a decision the author would rule on separately; the movement seam is the sitting's stages; the analysis seam is the delegation node's rule that a verbose investigation is a unit whatever its size and that the model follows the kind of work; the fact seam is the dialogue node's four reserved facts; the dependency seam is the depends field and the ruling order. What is new is the assignment of each seam to a model and an order; the reader's model is the review-model node's question. The cost of the design is the fixed cost of a contract per unit, of the main thread's integration turn after each, and of a brief per draft reviewed, the brief carrying the draft's neighbourhood whole and the rest of the record as one line a node, as the review-cost node decides; the lookup exemption on delegation is the floor beneath it, and a disposition that asks one question runs one design unit and one review and no decomposition. Measured on 2026-09-05, after that node's lever was pulled: this node's own brief is 268,598 bytes for one draft, roughly a third of the 838,923-byte batch brief of 2026-09-03 it replaces, and the survey's brief is 1,083,638 bytes, larger than the whole batch, since the survey alone needs the whole graph and reads it without the accounts. A per-draft brief is paid once per draft, so a sitting of many drafts reads several times the batch's tokens; that is the design's cost, taken for the attention and the timing it buys. The integration turn is priced the same way and by the same author's words. Measured at implementation commit 87e4b24e, the eight design units of 2026-09-06 and 2026-09-07 returned between 16,432 and 44,306 bytes each and 281,879 bytes in all, every one of them a whole redraw of the sections it touched; the main thread reads all of that to find the sentences that moved, and the reading that follows is handed a redrawn text whose difference from the pinned one is the only thing it is judging. What the pairs cost is that a unit must quote the record exactly, so a unit given a stale copy of a node produces pairs that will not apply, which a redraw hides and a pair makes fail loudly. The traditions this design draws on are registered on the stub-traditions node, where the record keeps the lists whose readings are owed; their relations are claimed and unread, and no rationale of this node states them as adoptions.

**AI divergence.** Against it, and on the fact: no whole text is written by anybody until the main thread splices, so the coherence of the amended answer is checked by nobody in between, and a design whose parts each read well and whose whole does not is what a redraw shows and a pair hides. A pair is also unreadable without the record in hand, which moves reading cost onto the thread the `delegation` node says is never delegated.

Raised from the author's words of 2026-09-07 and from the measurement of this sitting's own design units. It is recorded here rather than on `review-cost` or `clean-context-review` because what a unit returns and how the main thread integrates it is this node's question; the reading's object is already the amendment on `review-cost`, and this clause makes the amendment a thing the record has rather than a thing each reader recomputes.

A per-draft brief carried the index of every standing answer, so a sitting of several questions read several times the tokens of the one batch it replaced, and the author's first-named judge is token efficiency; the design stood on their second, attention, and on timing, and the index was the lever against the cost. The `review-cost` node pulled that lever on 2026-09-05: the index is one line a node and a brief is roughly a third of what it was, so the case against is now the residue, that a sitting still pays a fixed cost of brief and contract per draft where the batch paid it once.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

Along five seams. A seam is a boundary along which a sitting's work divides into units whose conclusions the main thread integrates without reading their context, so that the main thread holds only the author's words, the node in hand, and what the units concluded.

The question. A disposition that asks or answers more than one question is several nodes, as the node node says, and decomposing it is the first unit of the sitting: a survey that reads the disposition against the record and proposes the questions it asks, where each sits under the record, whether the record already asks it, which of the author's words bear on each, and which questions rest on which. The main thread validates the proposal, records each question as a queued node carrying its words, and puts the decomposition to the author at the periagogic stage as a reading of their own words, refusable like any probe. A refusal at that stage confers no ruling, as the recording node holds: it is recorded as the author's words on each queued node the refusal names, the sitting moves each of those nodes' existence fact to recommend `prune` with those words as the reason, and the ruling is taken at each node's own ruling stage. The questions refused fold back into the parent's `## Disposition`, where their words already are. Whether one response may rule on the existence facts of a whole decomposition at once is the recording node's question, recorded there as an option and not answered here. The decomposition is judgment and runs on the larger model.

The movement. Within each node's sitting the periagogic object, the nodes the disposition would amend and the implementation their criteria point to, is read by a survey unit and never by the main thread; the maieutic stage divides into the units below; the review is the clean-context unit, the reading of the one draft; the survey of the frontier, where settling and untangling are judged, the frontier-consistency node's validations seven to sixteen, is kept as one batch over the whole graph before the author rules, as the clean-context-review node says; the ruling is the author's; the recording is the main thread's, which alone writes a node.

The kind of analysis. The maieutic stage divides into units by what each analyses, each with its own contract and on the model that follows its kind of work, as the delegation node says: the record survey, what the graph says on the question, the chain of nodes above it, the rules that bind everywhere, the nodes that define or use its terms, and the contradictions and redundant seams among them, on the larger model; the tradition survey, the second evaluation, returning readings with source, locus, and what each bears on, traditions shelved by pre-agent constraints among them, on the larger model; the implementation survey, what exists and what a named artifact or command does, on the smaller model; the design, the options on each fact, the recommendation with its boldness, and the draft text, on the larger model, or on the most capable one where the draft amends an ancestor's recommended text or a node whose answer binds every session, which nodes those are being the tier node's question, and until that node is ruled the design unit escalates on the first limb alone; and the review of the draft in clean context, as the clean-context-review node describes, on the model the review-model node decides. The surveys run together; the design waits on them; the review waits on the design; the main thread's own adversarial reading of the integrated draft, which the evaluation node requires, comes between the two.

The fact. The answer fact is the design's to decide; the authority fact follows the rule the class-recommendation node states; the existence and persistence facts appear as the dialogue node says. A design unit's contract names which facts are its.

The dependency. The questions a decomposition yields carry depends among themselves. Their surveys run in parallel regardless; a design waits on the recommendation, not the ruling, of the question it depends on; the main thread integrates the questions in their ruling order; and the review of each draft runs the moment its recommendation is recorded, while the others are still in hand, so that the counter-argument reaches the main thread with the node it concerns and never as a batch of findings on nodes it has stopped seeing.

Every unit returns its conclusion as data with the commands it ran and writes nothing to the record, and a unit whose conclusion is a change to a text that already stands returns the change and not the text: each locus it would amend as the exact bytes it replaces and the exact bytes it puts in their place, and never a node, a section or a recommendation fence redrawn whole. A redraw hands the main thread a text it must diff against the record to learn what the unit decided, so the thread reads the whole of what it already has in order to find the part it does not; the pairs are that difference written down, and they are what the thread validates, what its own adversarial reading is over, what the applying step needs, and what the re-reading's object already is by the review-cost node's rule. A unit that cannot name the bytes it is replacing has not located its own change. Where a unit's conclusion is a new text and not a change to one, a node the sitting is minting or a fence the node has never carried, there is nothing to pair it against and it is returned whole. the main thread writes the conclusion into the node's account at the next checkpoint, so that the record and not the session carries it, and a session that loses its context resumes from the node. This answer is materialized by the alignment skill's list of a sitting's units, under the shim the growth node declares on that skill, with two gaps this node discloses rather than presumes closed: the skill's list still carries the escalation trigger this answer superseded, and the reconciliation of it is owed; and the shim's own scope reaches the growth node and its siblings, where this node is that node's grandchild, which is recorded as an option there.
```

#### citation-moves-to-unit-sizing

Everything the recommendation says, with the analysis seam's citation of `delegation` for the model rule redirected to `unit-sizing`, the node delegation-bounds-and-sizing recommends minting beneath `delegation` to carry the sizing clauses. It is on the table because that node's answer says the move is made with the clauses — "the sibling is amended with the parent rather than left pointing at a gap" — and nothing on this node records it, so a ruling there would leave this answer citing a node that no longer carries the rule it cites. It acts on nothing until that node is ruled.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

Everything the recommendation says, with the analysis seam's citation of `delegation` for the model rule redirected to `unit-sizing`, the node delegation-bounds-and-sizing recommends minting beneath `delegation` to carry the sizing clauses. It is on the table because that node's answer says the move is made with the clauses — "the sibling is amended with the parent rather than left pointing at a gap" — and nothing on this node records it, so a ruling there would leave this answer citing a node that no longer carries the rule it cites. It acts on nothing until that node is ruled.
```

#### units-are-readings-not-surveys

Everything the recommendation says, with the three units of the analysis seam renamed so that "survey" is left to the reading frontier-consistency defines: the record reading, the tradition reading and the implementation reading, or another word the author prefers, with `delegation`'s clause on verbose investigations read as reaching them under the new name. It is on the table because the record uses one word for a sitting's unit and for the reading of the whole frontier, which the eleventh validation forbids, and because unit-skills' recommendation would carry the collision into four skill names; unit-skills' own rationale names the conflict and sends only the skill's name elsewhere, so the term itself is decided by nothing.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

Everything the recommendation says, with the three units of the analysis seam renamed so that "survey" is left to the reading frontier-consistency defines: the record reading, the tradition reading and the implementation reading, or another word the author prefers, with `delegation`'s clause on verbose investigations read as reaching them under the new name. It is on the table because the record uses one word for a sitting's unit and for the reading of the whole frontier, which the eleventh validation forbids, and because unit-skills' recommendation would carry the collision into four skill names; unit-skills' own rationale names the conflict and sends only the skill's name elsewhere, so the term itself is decided by nothing.
```

### authority

Ratified, at low boldness: the rule binds how every sitting spends the author's tokens and attention and how the adversarial review is run, and a wrong answer here is expensive and compounds across sittings, which is the escalation test the `class-recommendation` node states.

## Account

### Manifest

- Folded: Sitting of 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Grant of 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciled under the grant of 2026-09-04 for review-model, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended by the review-cost node, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the second reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The escalation test's citation corrected, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The units' instrument moved to a node of its own, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What a design unit returns, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of dd59cbca

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `a-unit-returns-the-amendment`.

Findings:


On the facts and what they recommend: All eleven findings of the 2026-09-05 second reading are answered. The cost sentence and evidence paragraph are rewritten to state the brief-per-draft cost as `review-cost` now decides it, dated (F1/F11). The periagogic refusal mechanism is rewritten to move each queued node's existence fact to `prune` with the author's words as reason rather than claiming one response rules the existence facts directly, with that shortcut recorded on `recording` instead (F2/F9). The four undocumented tradition adoptions are struck from the Rationale and, verified by `grep`, are now registered on `stub-traditions` under 'Registered from decomposition, 2026-09-05' as claimed and unread (F3). The fact paragraph now cites `class-recommendation` and `dialogue` instead of restating their rules (F4). `depends` now points at `clean-context-review#pointers-for-what-grows-with-the-record` (verified in frontmatter) instead of the superseded option (F5). The materialization sentence discloses both the superseded escalation trigger in the skill file and the shim-scope gap on `growth`, where `shim-reaches-what-the-skill-draws-on` is confirmed present as a persistence option (F6). `reviewer-on-a-fixed-model`'s reversed reason is struck (F7). `unit-models-left-to-delegation` is recorded on the answer fact with the reply's own reason (F8). `tier` is added to `depends` (verified in frontmatter) and the design unit's escalation is scoped to the first limb until `tier` is ruled (F10). The recommendation additionally moves from `seams-and-split-review` to `a-unit-returns-the-amendment`, a new clause on what a unit returns (pairs, not whole redraws), openly disclosed as not yet followed by this sitting's own design units.

On the viability of the options: Every option on the answer and authority facts stays viable; the new option `a-unit-returns-the-amendment` is added as the recommendation and `unit-models-left-to-delegation` is added as passed, with no other option's status changed. `units-carried-by-their-own-skills`, raised the same day by the newly minted `unit-skills` child, is correctly left viable and unadopted, consistent with the account's note that another unit is amending this fence in the same sitting.

Strongest counter-argument (weak): The measured byte totals for the eight design units (16,432 to 44,306 bytes, 281,879 total) recompute today to 282,151 bytes across the same files, roughly 0.1% over the stated figure, which is within noise (the files may have been touched fractionally after the cited commit) and not a material misstatement. No other gap found.

The session's reply: Forwarded with no finding; the byte-count drift of 272 bytes across the eight design files is noted and not corrected, since the figure is dated to its commit and the drift is the files' later edits. Nothing on the node changes.

### Frontier survey, 2026-09-07, of dd59cbca

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The answer closes by saying it "is materialized by the alignment skill's list of a sitting's units, under the shim the growth node declares on that skill", and two siblings are moving that artifact under it. unit-skills proposes seven skills in its place, which is on this fact as `units-carried-by-their-own-skills`; delegation-bounds-and-sizing says of the model rule this answer applies that "citation moves to `unit-sizing` with the clauses and the sibling is amended with the parent rather than left pointing at a gap", and that amendment is on no fact here and in no depends. So a ruling here is taken without the author seeing that another node's ruling would rewrite the clause this answer's analysis seam turns on.

### Frontier finding, 2026-09-07

Kind: cross-reference.

delegation-bounds-and-sizing states an amendment to a sibling that the sibling carries nowhere. Its answer reads "`decomposition` cites `delegation` for the model rule it applies, so that citation moves to `unit-sizing` with the clauses and the sibling is amended with the parent rather than left pointing at a gap." decomposition's file names neither `unit-sizing` nor `delegation-bounds-and-sizing` at any locus: it carries no option for the move, and its depends names clean-context-review, frontier-consistency and tier only. Its own answer's analysis seam meanwhile applies the rule in terms — "each with its own contract and on the model that follows its kind of work, as the delegation node says" — so the citation a ruling on that node would move is in the text a ruling on decomposition would confirm.

Also named: commons.systems/disposition-graph/delegation-bounds-and-sizing.

Proposed: decomposition is where the amendment is missing and where the author meets it. The move is recorded as an option on decomposition's answer fact, sourced to delegation-bounds-and-sizing, so that the author rules on this node's answer knowing that a ruling on its sibling redirects the citation it rests on; delegation-bounds-and-sizing's sentence stands unchanged, since it is the node that owns the division.

Recorded as an option on this node's answer fact: `citation-moves-to-unit-sizing` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

"Survey" names two different things across the frontier and no node decides which sense it carries. frontier-consistency defines it for one — its `defines` list holds `frontier survey`, and its recommended answer names "the survey, the frontier survey this node defines, the reading that judges the whole graph against itself". decomposition names three of a sitting's units by the same word: "the record survey, what the graph says on the question", "the tradition survey, the second evaluation", and "the implementation survey, what exists and what a named artifact or command does". delegation's answer uses it a third way, among verbose investigations: "Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys." unit-skills' rationale names the collision — "the record already carries the vocabulary conflict behind it, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys" — and sends only the skill's name to review-skills, where `align-survey-renamed-for-the-family` decides what one skill is called and not what the word means. So the conflict is stated in a rationale, which binds nothing, and recorded on no fact.

Also named: commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/unit-skills, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/delegation.

Proposed: frontier-consistency's `frontier survey` is the defined term and survives; what moves is decomposition's use of the bare word for a sitting's units, which is where three of the four collisions come from and which unit-skills would multiply into four skill names. The option is recorded on decomposition so the author rules the term once; frontier-consistency, unit-skills and review-skills follow whichever way that ruling goes, and delegation's plural is read as the sitting's units under it.

Recorded as an option on this node's answer fact: `units-are-readings-not-surveys` (source review, 2026-09-07).

### Amended after the frontier survey, 2026-09-07

Two findings of the survey named this node and each is recorded as an option on the answer fact, `citation-moves-to-unit-sizing` and `units-are-readings-not-surveys`; neither is adopted. The first acts only when delegation-bounds-and-sizing is ruled, and the author meets it here. The second proposes "reading" for the three units, a word the record already gives to a tradition's node and to the two readings of the clean-context review, so the collision it would cure it would also move; which word the units take is the author's, and the option stands for the ruling that decides it. No text moves, both pins hold, and the node returns to ruling.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/decomposition stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `a-unit-returns-the-amendment`; 8 `## Disposition` entries became the ledger entries words/2026-09-04/24, words/2026-09-04/23, words/2026-09-05/1, words/2026-09-07/5, words/2026-09-07/6, words/2026-09-07/7, words/2026-09-07/8, words/2026-09-07/10, referenced by 1 option the entry's own date names and by the recommended option for 7 the date named none. The content of `seams-and-split-review (at 4337d260)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `pre-review-under-the-batch`, `decomposition-before-minting`, `main-thread-performs-the-surveys`, `one-unit-per-disposition`, `decomposition-by-the-author`, `reviewer-on-a-fixed-model`, `no-carrier-and-the-questions-are-progressed`, `unit-models-left-to-delegation`, `units-carried-by-their-own-skills`, `citation-moves-to-unit-sizing`, `units-are-readings-not-surveys`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `dd59cbca7f78752bac9704bc5eff7ed7a2b27990` is re-computed for the encoding as `5e56e6b8fed51a4739882eb744083fd913ec916e`; nothing it read changed. The survey's pin `dd59cbca7f78752bac9704bc5eff7ed7a2b27990` is re-computed for the encoding as `5e56e6b8fed51a4739882eb744083fd913ec916e`; nothing it read changed.

### Frontier finding, 2026-09-07

Kind: vocabulary.

The term survey is used with two meanings across the frontier. `frontier-consistency`'s answer defines it as the reading of the whole graph, while `delegation`'s answer, projected at .claude/rules/delegation.md, makes it a kind of subagent unit: "Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys." `review-skills` records the collision on its own face in `align-survey-renamed-for-the-family`: "the vocabulary conflict behind it is already in the record, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys". A term the record has made a skill name (`/align-survey`) and a validation subject cannot also name an ordinary unit.

Also named: commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/delegation, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/clean-context-review.

Proposed: The survivor is `frontier-consistency`'s sense: survey is the reading of the frontier, and the skill family keeps the name. `decomposition` already carries the repair as the option `units-are-readings-not-surveys`, so no new option is needed there; `delegation`'s answer loses the word from its list of verbose investigations, which is a sizing clause `delegation-bounds-and-sizing` has already assigned to `unit-sizing`, so the amendment travels with that move rather than reopening the bound.

### Frontier finding, 2026-09-07

Kind: supersession.

dialogue's standing answer: 'The author\'s words are not a section of the node. They are entries of the ledger, verbatim and dated' and 'There is no `## Recommendation` section, no `## Answer` section, no `## Rationale` section and no `## Disposition` section.' Superseded texts still standing: frontier-consistency 'So the words under `## Disposition` are carried for every node, judged, reached or unreached'; author-questions 'the reason names their words, which are under `## Disposition` verbatim and dated as the checkpoint node requires and are never copied into the field'; probe-or-node 'the response is quoted under `## Disposition`, the recommendation moves' and 'any words of the author\'s on it move to the parent\'s `## Disposition`'; decomposition 'The questions refused fold back into the parent\'s `## Disposition`, where their words already are.'; transience 'the author\'s words, verbatim and dated, in a `## Disposition` section'. The migration the two dated clauses wait on has landed at least in part: the brief prints '`the-survey-skill-launches-a-selected-reading` (answer) supports words/2026-09-04/10' resolved to the author's text, and dialogue's account names '`packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry', so recording's 'until it lands no instrument resolves a reference into one' and materialization's 'before that migration lands, a session reading this rule finds the enumeration\'s third term unmaterialized' are dated past.

Also named: commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/probe-or-node, commons.systems/disposition-graph/transience.

Proposed: dialogue and quotes survive. The five nodes that place words under `## Disposition` are amended to say the words are ledger entries referenced from the option or probe they bear on; recording and materialization strike or date their 'until it lands' clauses once the applying session confirms the migration's extent; quotes' answer states the partial state if any node's words are still unmigrated.

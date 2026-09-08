---
question: When is a disposition answered?
stage: maieutic
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: b5717e656b723368acf1ad6f3609c7ab85c6a1a3
  against: "Reclassifying every deferred answer as unanswered loses nothing formally and changes what the record is while the record is in use: sixty-eight nodes now sit in one queue with no distinction between an answer written that morning from the author's quoted words and one written two days earlier from the AI's own knowledge, and the author must rule on all of them through a dialogue whose own rules are in the queue. The session's reply — that the stage says what each is owed where the deferred stamp did not — is a real gain and is now visible in the frontier and the page. What is unanswered is the volume: forty-three nodes stand at review or ruling in one sitting, and the record offers a ruling order only as a review's recommendation that nothing consumes."
  survey:
    date: 2026-09-07
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "09cba62ef34db9cf68e59d3ef4c190943c328168a291998879f34d2b20ec9539"
      answer: "09a972922fa40a2da4f32486321197559dd974cd2ee2c492f9c688d02ce5ace1"
      options: "dadb414546ad7f6352e98b5122f4bbb957ecb03c8885a80d317a7086723ee52d"
      rivals: "de45963f873a391ceab9d85d32258d9d9f4c2a78fad5533af666516482b6e639"
      words: "c8ec8788a610f28277df55afbfe88e12c771c0abf85d47cbcda224e5a76981df"
facts:
  - name: answer
    options:
      - name: answered-by-stamp
        source: ai
        ref: "2026-09-03"
      - name: page-in-ruling-order
        source: author
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/29
          - words/2026-09-03/42
          - words/2026-09-03/80
          - words/2026-09-03/81
          - words/2026-09-03/82
          - words/2026-09-03/83
          - words/2026-09-03/84
      - name: responses-on-decisions-and-children
        source: ai
        ref: "2026-09-04"
      - name: child-ruling-held-until-the-parent
        source: ai
        ref: "2026-09-04"
      - name: unanswered-is-no-ruling
        source: author
        ref: "2026-09-04"
      - name: confirmation-before-the-ruling-stage-is-invalid
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
      - name: browser-hides-every-unanswered-node
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it would empty the browser of the record it documents"
      - name: fourth-class-or-field-for-unanswered
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the status is derived from the stamp and the answer, and a stored copy would drift"
      - name: mark-answered-node-unanswered
        source: author
        ref: "32600efe"
        status: passed
        reason: "the author retracted it the same day: a pending alternative does not lapse the answer's authority"
      - name: deferred-answers-without-a-stage
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it keeps the queue a reading of the stamps instead of a dialogue the page lists"
      - name: review-item-nodes
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the queue is the unanswered nodes themselves"
      - name: a-curriculum
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the queue is the unanswered nodes themselves"
      - name: response-on-a-fact
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: edit-ruled-then-reviewed
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: stage-keeps-a-node-on-the-frontier
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: two-responses-where-the-page-offers-them
        source: commons.systems/disposition-graph/where-a-change-request-goes
        ref: "2026-09-06"
      - name: topology-conditioned-as-persistence-is
        source: review
        ref: "2026-09-07"
    recommends: unanswered-is-no-ruling
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
depends:
  - commons.systems/disposition-graph/alignment-page
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
  - commons.systems/disposition-graph/viable-options
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Facts

### answer

#### answered-by-stamp

The answer as it stood on 2026-09-03: a disposition is answered when its stamp is ratified or delegated; unanswered is derived from the stamp and the answer; a deferred stamp is unanswered; the three responses are given on the node. Viable if the author prefers the stamp; `responses-on-decisions-and-children` is the same answer with the responses given per decision.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

The answer as it stood on 2026-09-03: a disposition is answered when its stamp is ratified or delegated; unanswered is derived from the stamp and the answer; a deferred stamp is unanswered; the three responses are given on the node. Viable if the author prefers the stamp; `responses-on-decisions-and-children` is the same answer with the responses given per decision.
```

#### page-in-ruling-order

This answer lists every unanswered node on the alignment page in rank order, the purpose node first. The alignment-order draft orders the alignment frontier by the ruling order, the node whose ruling settles the most first, with rank as tie-break; the alternative amends the page order accordingly, and amends "the purpose node first" with it: on the amended count, which counts what a ruling makes decidable elsewhere and not the alternatives it closes on itself, the first node is commons.systems/public/agency, the sole root, whose unanswered subtree is every other node in the record, and the purpose node is second, its only child. The page pages in one order across the manifest's graphs, the graph shown as a label on each node, since a graph precedence would put a descendant's ruling before its ancestor's. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

This answer lists every unanswered node on the alignment page in rank order, the purpose node first. The alignment-order draft orders the alignment frontier by the ruling order, the node whose ruling settles the most first, with rank as tie-break; the alternative amends the page order accordingly, and amends "the purpose node first" with it: on the amended count, which counts what a ruling makes decidable elsewhere and not the alternatives it closes on itself, the first node is commons.systems/public/agency, the sole root, whose unanswered subtree is every other node in the record, and the purpose node is second, its only child. The page pages in one order across the manifest's graphs, the graph shown as a label on each node, since a graph precedence would put a descendant's ruling before its ancestor's. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.
```

#### responses-on-decisions-and-children

The description of the alignment page leaves this answer for the node that asks the page's question, which subsumes `page-in-ruling-order`, and the three responses gain two rules the record did not have. A response may be given on one of the decisions a node's ruling asks, the reserved facts the dialogue node names, and a denial on one decision is a kickback on that decision while the responses on the others are kept. And a response on a node stands whether or not its parent has been ruled, with a later parent's ruling that contradicts it recorded as an alternative on the child and put to the author rather than applied over their stamp. Adopted by the recommendation, and set out in the fence.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

When the author has ruled on it through the alignment dialogue. A disposition is answered when its stamp is ratified or delegated, the two classes that only the author's ruling confers; until then it is unanswered, whatever the node carries: an answer stamped deferred, an answer with no stamp, or no answer at all. Unanswered is a status the projections derive, never a field: the stamp stays as it is, saying who holds the answer and since when, and the answer stays as it is, the draft the author rules on, so that reclassifying a node loses nothing of its encoding.

Every unanswered node carries the dialogue, as the dialogue node defines it, and first its `stage`, the next movement owed on it: periagogic while the author's account is not yet in the record, maieutic while the answer is not yet drafted, review while the draft has not had the clean-context review, and ruling while the author's confirmation is owed. The validator refuses an unanswered node without a stage, and an answered node carries one while an alternative is pending on it, from the alignment dialogue or from a proposal outside it, keeping its stamp and its full authority, whatever its class, until an alternative is confirmed; the author's first suggestion, that such a node be marked unanswered until confirmed, was retracted by the author on 2026-09-03 as a hack, and the projections show the pending alternatives beside the answer instead. Every deferred answer in the record was written during bootstrap, before the dialogue existed, and each stands unanswered at the stage it has reached: with the review behind it, at ruling; without, at review, and the review runs on it before anything else.

The author rules on the alignment page or in prose. The page lists every unanswered node of this project's graph in rank order, the purpose node first, and then the public graph's, each with its stage, the author's words, the node as it stands, the alternatives pending with their sources, the recommendation with its facts and its pin, the review's counter-argument, and the AI's account, as the dialogue node lists them; on any subset of them, at once, the author may confirm, confirm with edits, or deny with feedback. A confirmation ratifies what the recommendation adopts, the node as it stands or the alternative it names, or delegates it where the author's words delegate it. A confirmation with edits ratifies the node with the edits: the session applies them, and where they change substance the draft goes through the review again before the stamp is written. A denial with feedback is a kickback, classified by the recording node to the movement it calls for, and the feedback is recorded as the author's words. A confirmation given on a node whose review has not run is held until the review runs and recorded when the review forwards it. Nothing the author has not confirmed is doctrine, and nothing in the record is exempt from the dialogue.
```

#### child-ruling-held-until-the-parent

A confirmation on a child given while the parent is open is held and recorded when the parent is ruled, by analogy with the confirmation held until the review runs.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the review is a step in producing the draft the author is confirming, so a confirmation before it confirms something unfinished, while a parent's ruling is no part of producing the child's draft. Holding a ruling the author gave would make their ratification wait on a question they did not ask about, and the alignment-order node is explicit that the author's choice of what comes next is their own order.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

A confirmation on a child given while the parent is open is held and recorded when the parent is ruled, by analogy with the confirmation held until the review runs.
```

#### unanswered-is-no-ruling

Unanswered is the state of a node no ruling grants: nothing on it acts, and it is reconciled only on an explicit grant. Deferred is not that state but a class the author confers on the authority fact, beside ratified and delegated, under which the recommendation acts and the node stays on the alignment frontier; the answer's ground for rejecting a fourth response, that leaving a node unconfirmed is the deferral, no longer holds, and no fourth response is needed, since the deferral is a choice on a fact. The alignment frontier becomes every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The three responses and the status derived rather than stored are unchanged. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

**AI support.** The author's ruling of 2026-09-03, quoted above. The bootstrap wrote its answers stamped deferred because the dialogue that alone confers a stamp in the author's name did not yet exist, and the author's ruling on the authority node of 2026-09-02, that the first valid ratifications will be the outputs of this first alignment dialogue, already said that none of them was answered. What changed on 2026-09-03 is the classification. The record had two words for two things: "un-aligned disposition" for a node with no answer, hidden from the browser and listed by the alignment page, and the stamp's class for everything else, so that a deferred answer read as an answer in every projection although the author had not ruled on it. Re-evaluated at the author's direction the same day, the encoding needed one status derived from the stamp and the answer, answered or unanswered, and one rule, that an unanswered node carries its stage, so that the review queue is a listed dialogue the validator holds rather than a reading of the stamps. The un-aligned disposition keeps its name and its shape: it is the unanswered node with no answer yet, which the browser hides because it has nothing to show; every other unanswered node shows in the browser as the draft it is, marked with its stage, because the browser is the record's own documentation and the draft the author reads there is the draft the author rules on.

Why a confirmation ratifies: the recording node makes the confirmation the last movement before the stamp, and the three responses the author asked for are the ruling's three outcomes as that node classifies them, recorded, refined, or kicked back; a fourth response, defer, is not needed, because leaving a node unconfirmed is the deferral. Why the purpose node first: rank alone puts the public graph's root above this project's, since the purpose node stands under it, while the author's order recorded on the scope node begins at purpose; listing each graph in the manifest's order, by rank within it, gives the author's order without touching a rank.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Is 'unanswered' just an authority - as in no authority granted for reconciliation"; "In this model 'delegated' and 'deferred' authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains." Unanswered is the absence of a ruling and deferred a class the author confers, so the ground given above for needing no fourth response, that leaving a node unconfirmed is the deferral, no longer holds and is replaced: the deferral is a choice on the authority fact. The status stays derived, the three responses stand, and the responses per decision of `responses-on-decisions-and-children` are kept, the decisions being the facts. The answer as it stood is kept as the option `answered-by-stamp`, and the review of this text is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

When a ruling grants it. A disposition is answered when the rulings on its facts give it a class, ratified, delegated, or deferred, the classes only the author's ruling confers, on the node or on an ancestor whose grant covers it; until then it is unanswered, whatever the node carries: a recommended answer, a draft with no recommendation, or no answer at all. Unanswered is a status the projections derive, never a field: the facts stay as they are, with their options and their recommendation, and the answer stays as it is, the draft the author rules on, so that nothing of the encoding is lost when a node changes class. Nothing on an unanswered node acts, and it is reconciled only on an explicit grant, as the authority node says.

Every node on the alignment frontier carries the dialogue, as the dialogue node defines it, and first its `stage`, the next movement owed on it: periagogic while the author's account is not yet in the record, maieutic while the answer is not yet drafted, review while the draft has not had the clean-context review, and ruling while the author's confirmation is owed. The alignment frontier is every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling; the validator refuses any of them without a stage, and a delegated node carries one only when an option that would leave its delegation's scope has returned it to the author. A node with a class keeps its confirmed choice and its full authority while an option is pending beside it, whatever the option's source, until the author rules for another; the author's first suggestion, that such a node be marked unanswered until confirmed, was retracted by the author on 2026-09-03 as a hack, and the projections show the pending options beside the answer instead. The deferred stamps the bootstrap wrote before the dialogue existed conferred nothing and are gone; each of those nodes stands unanswered at the stage it has reached.

The author rules on the alignment page or in prose; what that page shows, and in what order, is the alignment-page node's question. Three responses are open, and they are open on any subset at once: confirm, confirm with edits, and deny with feedback. A response is given on a node, or on one of the decisions that node's ruling asks, which are its facts: the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape; any other decision the author would rule on separately is a question and therefore a node, and is responded to as a node. A response stands whether or not the node's parent has been ruled: a ruling the author gives is a ruling, and a later ruling on the parent that contradicts it is recorded as an option on the child and put to the author, never applied over their ruling. A confirmation is recorded as a ruling on the option each fact recommends, and the class follows from the rulings: ratified when the answer fact is ruled, delegated or deferred when the ruling on the authority fact says so. A confirmation with edits rules for the option with the edits: the session applies them, and where they change substance the draft goes through the review again before the ruling is recorded. A denial with feedback is a kickback, classified by the recording node to the movement it calls for, and the feedback is recorded as the author's words, never as a ruling; a denial on one decision is a kickback on that decision, and the node returns to the movement the feedback calls for carrying the rulings given on its other decisions. No fourth response is needed: deferring is a choice on the authority fact, not a way of leaving the node unconfirmed. A confirmation given on a node whose review has not run is held until the review runs and recorded when the review forwards it. Nothing the author has not confirmed is doctrine, and nothing in the record is exempt from the dialogue.
```

#### confirmation-before-the-ruling-stage-is-invalid

A confirmation given on a node that has not reached the ruling stage, on the page or in prose, is not held and confers nothing: it is recorded as the author's words and the dialogue proceeds from its stage, and the page renders its inputs disabled there. This supersedes the standing sentence that a confirmation given before the review has run is held until the review forwards it, on the author's words of 2026-09-04 recorded on commons.systems/disposition-graph/alignment-page: "Confirmed responses for nodes that are not at the confirmation stage of dialogue are invalid. Show the facts with pending confirmation, and recommendations, but disable to input." Raised by that node's clean-context review of 2026-09-04, which found the supersession recorded nowhere here.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

A confirmation given on a node that has not reached the ruling stage, on the page or in prose, is not held and confers nothing: it is recorded as the author's words and the dialogue proceeds from its stage, and the page renders its inputs disabled there. This supersedes the standing sentence that a confirmation given before the review has run is held until the review forwards it, on the author's words of 2026-09-04 recorded on commons.systems/disposition-graph/alignment-page: "Confirmed responses for nodes that are not at the confirmation stage of dialogue are invalid. Show the facts with pending confirmation, and recommendations, but disable to input." Raised by that node's clean-context review of 2026-09-04, which found the supersession recorded nowhere here.
```

#### browser-hides-every-unanswered-node

The author's ruling that unanswered nodes are hidden from the browser is read
as covering every unanswered node. It was passed over because it would empty
the browser of the record it documents; the ruling was made of nodes with no
answer and is kept for them.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

The author's ruling that unanswered nodes are hidden from the browser is read
as covering every unanswered node. It was passed over because it would empty
the browser of the record it documents; the ruling was made of nodes with no
answer and is kept for them.
```

#### fourth-class-or-field-for-unanswered

Unanswered is a fourth authority class, or a field of its own. It was passed
over because the status is derived from the stamp and the answer, and a stored
copy would drift.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

Unanswered is a fourth authority class, or a field of its own. It was passed
over because the status is derived from the stamp and the answer, and a stored
copy would drift.
```

#### mark-answered-node-unanswered

An answered node is marked unanswered while an alternative is pending, which
was the author's own first suggestion of 2026-09-03. It was passed over
because the author retracted it the same day: a pending alternative is
dialogue state beside the answer, and the answer's authority does not lapse
until one is confirmed.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

An answered node is marked unanswered while an alternative is pending, which
was the author's own first suggestion of 2026-09-03. It was passed over
because the author retracted it the same day: a pending alternative is
dialogue state beside the answer, and the answer's authority does not lapse
until one is confirmed.
```

#### deferred-answers-without-a-stage

The deferred answers carry no stage. It was passed over because it would keep
the review queue a reading of the stamps instead of a dialogue the page lists.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

The deferred answers carry no stage. It was passed over because it would keep
the review queue a reading of the stamps instead of a dialogue the page lists.
```

#### review-item-nodes

The queue is carried by review-item nodes of its own, as the incumbent record
had it. It was passed over because the queue is the unanswered nodes
themselves.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

The queue is carried by review-item nodes of its own, as the incumbent record
had it. It was passed over because the queue is the unanswered nodes
themselves.
```

#### a-curriculum

The order of the author's attention is carried by a curriculum, as the
incumbent record had it. It was passed over because the queue is the
unanswered nodes themselves.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

The order of the author's attention is carried by a curriculum, as the
incumbent record had it. It was passed over because the queue is the
unanswered nodes themselves.
```

#### response-on-a-fact

Every response is given on a fact, on the alignment page and in prose, and none on the node as a whole, since a fact is what a ruling is recorded on; a prose response reaches the facts it names, or every fact where it names none. This replaces the standing sentence that a response is given "on a node, or on one of the decisions that node's ruling asks". Recorded on 2026-09-04 with the recording node as its source, after that node's reading found the divergence owed here and unrecorded.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

Every response is given on a fact, on the alignment page and in prose, and none on the node as a whole, since a fact is what a ruling is recorded on; a prose response reaches the facts it names, or every fact where it names none. This replaces the standing sentence that a response is given "on a node, or on one of the decisions that node's ruling asks". Recorded on 2026-09-04 with the recording node as its source, after that node's reading found the divergence owed here and unrecorded.
```

#### edit-ruled-then-reviewed

A confirmation with edits is recorded as a ruling on the edited option when it is given, and the node returns to the review stage where the edits change substance, the confirmed choice keeping its authority meanwhile. This replaces the standing sentence that the edited draft "goes through the review again before the ruling is recorded"; what a response does once given is the recording node's question, and this node would cite that node for it rather than carry a rival sentence. Recorded on 2026-09-04 with the recording node as its source; the other side, the edit held until the re-reading forwards it, is recorded on that node as `edit-held-until-re-read`.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

A confirmation with edits is recorded as a ruling on the edited option when it is given, and the node returns to the review stage where the edits change substance, the confirmed choice keeping its authority meanwhile. This replaces the standing sentence that the edited draft "goes through the review again before the ruling is recorded"; what a response does once given is the recording node's question, and this node would cite that node for it rather than carry a rival sentence. Recorded on 2026-09-04 with the recording node as its source; the other side, the edit held until the re-reading forwards it, is recorded on that node as `edit-held-until-re-read`.
```

#### stage-keeps-a-node-on-the-frontier

A node carrying a stage is on the alignment frontier whatever class the rulings on its other facts confer, until the recording removes the stage. The frontier as this node, dialogue, and viable-options define it is every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling; a node whose answer fact the author confirmed and whose persistence or topology fact they kicked back stands at the maieutic stage in none of those three sets, and the frontier and the alignment page would drop it while a movement is owed on it. Recorded on 2026-09-04 with the recording node as its source.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

A node carrying a stage is on the alignment frontier whatever class the rulings on its other facts confer, until the recording removes the stage. The frontier as this node, dialogue, and viable-options define it is every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling; a node whose answer fact the author confirmed and whose persistence or topology fact they kicked back stands at the maieutic stage in none of those three sets, and the frontier and the alignment page would drop it while a movement is owed on it. Recorded on 2026-09-04 with the recording node as its source.
```

#### two-responses-where-the-page-offers-them

Everything the recommended option says, with the roster read as three responses
of which the alignment page offers two. `where-a-change-request-goes` recommends
that every change request go to the kick-back and that the option's own control
hold only the ruling's reason, which leaves the page with no route for a
confirmation with edits: an author who wants an option changed denies it with
feedback and the node returns to the maieutic movement. That answer does not
strike the third response, because the roster is this node's, and it records the
consequence here for the author to rule.

Two ways to take it, and this option is the first. The response survives and is
given in the interview, where the author can say "confirm, with this change" in
prose and the session classifies it as `recording` says; the page is one surface
among several and need not offer everything the record opens. Or the response
collapses into the denial with feedback, on the author's own words of 2026-09-04
that "any changes will necessarily require a kickback", and the roster becomes
two. Against the first: a response the record opens and the author's one ruling
surface does not offer is a response most authors will never use, and calling it
open is then a fiction the record maintains about itself.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

Everything the recommended option says, with the roster read as three responses
of which the alignment page offers two. `where-a-change-request-goes` recommends
that every change request go to the kick-back and that the option's own control
hold only the ruling's reason, which leaves the page with no route for a
confirmation with edits: an author who wants an option changed denies it with
feedback and the node returns to the maieutic movement. That answer does not
strike the third response, because the roster is this node's, and it records the
consequence here for the author to rule.

Two ways to take it, and this option is the first. The response survives and is
given in the interview, where the author can say "confirm, with this change" in
prose and the session classifies it as `recording` says; the page is one surface
among several and need not offer everything the record opens. Or the response
collapses into the denial with feedback, on the author's own words of 2026-09-04
that "any changes will necessarily require a kickback", and the roster becomes
two. Against the first: a response the record opens and the author's one ruling
surface does not offer is a response most authors will never use, and calling it
open is then a fiction the record maintains about itself.
```

#### topology-conditioned-as-persistence-is

Everything the recommendation says, with the sentence naming the decisions a ruling asks conditioning `topology` as it already conditions `persistence`: the node's existence is among them where a prune is proposed, and not otherwise. It is on the table because which-facts-are-listed reads this node's unconditioned sentence as making the topology decision one a ruling asks wherever a ruling can be given, while `dialogue` makes the pair conditional together and gives the reason that "a choice nobody has raised is not a candidate the record lists", and that node says in terms that the option conditioning topology "belongs on that node, where its answer is".

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is a disposition answered?
form: rule
under:
  - commons.systems/disposition-graph/growth
defines:
  - unanswered
  - answered
  - confirmation with edits
  - denial with feedback
---

## Answer

Everything the recommendation says, with the sentence naming the decisions a ruling asks conditioning `topology` as it already conditions `persistence`: the node's existence is among them where a prune is proposed, and not otherwise. It is on the table because which-facts-are-listed reads this node's unconditioned sentence as making the topology decision one a ruling asks wherever a ruling can be given, while `dialogue` makes the pair conditional together and gives the reason that "a choice nobody has raised is not a candidate the record lists", and that node says in terms that the option conditioning topology "belongs on that node, where its answer is".
```

## Account

### Manifest

- Folded: Recording of 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The author's words of 2026-09-03 on dialogue, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The author's retraction, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified true, all four of the previous readings' open claims: `read.mjs` raises '<id> is unanswered and must carry stage', `deriveStatus` returns 'unanswered' and the frontier and browser print it, the page offers exactly the three responses the answer names, and `orderAlignmentItems` lists this project's graph in rank order before the public graph's. The node's 'Done the same day' account is now accurate where a previous reading found three of four claims false.
- Answer, paragraph 2: 'an answered node carries one while an alternative is pending on it ... keeping its stamp and its full authority, whatever its class, until an alternative is confirmed'. This is the author's ruling in quoted words and it is untestable today, since no node is answered. It will become live at the first ratification, and nothing in the record says what happens to the twenty-six review-stale pins at that moment.
- Answer, paragraph 3: 'A confirmation given on a node whose review has not run is held until the review runs and recorded when the review forwards it.' Verified live for this batch: thirty-seven nodes are at the review stage and this rule governs every one of them at the author's next sitting.
- The node's `alternatives` list is empty and its '## Alternatives' section correctly absent — the two author-sourced entries were dropped at the re-encoding because the standing answer carries them word for word. Verified: the answer does carry both. This is the encoding working as dialogue's answer describes.
- The node carries five dated author quotations under '## Disposition', including the retraction, so it is one of the better-grounded nodes in the batch for a ratified stamp.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current, and the split it names — the classification and the three responses the author's, the encoding and the meanings of the responses the AI's — is honest and among the best-formed in the batch. Every implementation claim in the node is verified true as of this reading. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): Reclassifying every deferred answer as unanswered loses nothing formally and changes what the record is while the record is in use: sixty-eight nodes now sit in one queue with no distinction between an answer written that morning from the author's quoted words and one written two days earlier from the AI's own knowledge, and the author must rule on all of them through a dialogue whose own rules are in the queue. The session's reply — that the stage says what each is owed where the deferred stamp did not — is a real gain and is now visible in the frontier and the page. What is unanswered is the volume: forty-three nodes stand at review or ruling in one sitting, and the record offers a ruling order only as a review's recommendation that nothing consumes.

The session's reply: Forward accepted. The retraction and the authority-keeping rule are the author's in quoted words; what happens to review-stale pins at the first ratification is accepted as a finding for the author.

### The author's dispositions of 2026-09-03, and where they fall

The words are in the Disposition section above and in full on
`commons.systems/disposition-graph/alignment-page`. Two halves reach this node
and they resolve differently.

The encoding half, that nodes read as edits to confirmed dispositions when
nothing is confirmed, is not a defect in this node's answer. This node already
enumerates the three carrying-states of an unanswered node, "an answer stamped
deferred, an answer with no stamp, or no answer at all", and already says the
status is derived and never a field. The defect is that
`commons.systems/disposition-graph/dialogue` gives every recommendation an
`amends` pin against a standing text and names the node as it stands an
unlisted candidate, unconditionally, so nothing downstream can tell the second
state from the third. It is recorded there, as the finding "a first answer is
presented as an amendment" and the alternatives
`first-answer-is-not-an-amendment` and `caption-only`, with the clean-context
correction that withdrew an earlier draft of both.

The confirmation half does fall here. This node's answer opens confirm, confirm
with edits, and deny with feedback "on any subset of them, at once", where they
are the unanswered nodes. The author now asks for confirmation on a subset of
the aspects within one node, with a rejection open on each aspect and a second
rejection open on the whole as it renders. That is an amendment to this
sentence, and it is why this node has gone back from ruling to maieutic. What
it will say depends on the probe outstanding on `alignment-page`: whether the
aspects are derived from what the record already carries, in which case this
answer gains a clause about the granularity of a response and nothing else, or
recorded on the node, in which case this answer and `dialogue`'s both change
and the review of 2026-09-03 on each is spent. The clean-context review had
already raised the question as `partial-ratification` on
`commons.systems/disposition-graph/growth`, where it is unruled.

The standing `recommendation` on this node, adopting `standing` with a forward
review of 2026-09-03, is superseded by the author's words of the same day and
is left in place only so its review pin is not lost.

### The maieutic movement of the alignment-page sitting, 2026-09-04

This node was moved off the ruling stage on 2026-09-03 because the author's
words of that day, that the record carry a decision per aspect, contradicted
what its forwarded recommendation rested on: its three responses are open "on
any subset of them", where "them" is the unanswered nodes and not the decisions
within one. The recommendation now answers that, and answers a second thing the
`dialogue` node named as this node's cascade, a response given on a child while
the parent is still open.

**Responses on a decision.** Under `dialogue`'s `aspects-are-nodes` the
decisions a node's ruling asks are its answer, where alternatives are pending,
and three reserved facts, the authority class, the node's existence, and its
persistence where the recommendation would change the node's shape. Anything
else the author would rule on separately is a question and therefore a node.
So the extension this answer needs is small and exactly bounded: the subset the
three responses open on now includes those decisions, and a denial on one is a
kickback on that one, with the other decisions' responses kept rather than
discarded with it. That last clause matters on the page: without it, rejecting
one row of a screen throws away every other row the author had answered.

**Responses on a child.** The rule is that the ruling stands. It follows from
`authority` and not from a judgment of this sitting: ratified means the author
decided and wants to be asked before it changes, so a later ruling on the
parent that contradicts the child cannot silently undo it, and is recorded as
an alternative on the child and put to the author like any other conflicting
answer. The symmetric-looking rule, that the child's confirmation be held until
the parent is ruled, is recorded as `child-ruling-held-until-the-parent` and
rejected in the rationale, because the analogy it rests on does not hold: the
review is a step in producing the draft the author confirms, and a parent's
ruling is not.

**The page's description leaves.** This answer described the page in a sentence
and a half, including an order that `alignment-order` had already amended and
that this node's own `page-in-ruling-order` alternative records. The whole
description goes to `alignment-page`, which subsumes that alternative; what
stays here is what this node owns, the three responses and what each one does.
This is the same correction made on `growth` in this sitting, and it is the
same cause: the page had no node, so three nodes described it.

**Facts.** Adopts `responses-on-decisions-and-children`. Authority ratified,
since a mis-specified response is a ruling the author did not give. Boldness
low: the reserved facts are `dialogue`'s fence, the child rule is `authority`'s
own sentence, and the hand-over is `alignment-page`'s answer. Persistence
standing.

`depends` records that this node's ruling waits on `alignment-page`, without
whose answer the description would leave with nowhere to go, and on
`dialogue#aspects-are-nodes`, without which the reserved facts do not exist.

Not reviewed. The clean-context review is owed on this and on the batch.

### Where the page contradicted this node, 2026-09-04

The author read `commons.systems/public/agency` on the published page and
found it offering, as the first choice on the graph's root question, "standing
(the node as it stands)" — on a node they have never answered. The four
findings are recorded on `commons.systems/disposition-graph/alignment-page`,
whose question the page is.

Recorded here because the first of them is this node's answer violated in
implementation and nowhere else. This node says every node is unanswered until
the author confirms it, and `authority` says a deferred answer is unanswered
until the author rules; the author's ruling of 2026-09-03 reclassified every
deferred answer in the record on exactly that ground. The projector then tested
for a stamp of any class and called the result "standing", so on 33 of the 72
staged nodes the page told the author a confirmation would ratify the node "as
it stands" when no node in the record is ratified at all.

Nothing in this node's answer or its recommendation changes. The evidence runs
the other way: the rule was right, was not projected, and the page reintroduced
the distinction the author's ruling had just collapsed. It is worth one line
because it is the second time this shape has appeared — a doctrine that holds
in the graph and lapses in the artifact projected from it — and the answer to
it is projection, not more doctrine.

### Frontier finding, 2026-09-05

Kind: contradiction.

Nine nodes carry, inside `## Facts`, a `#### <option>` subsection for the option their answer fact names in `stands`. The encoding rule is that the standing option omits its subsection because its sentence is the first sentences of `## Answer`, and `commons.systems/disposition-graph/dialogue`'s own recommended answer states it: the option that stands "needs none, since its text is the answer". The nine, each with the standing option whose subsection is stored: `authority` (`authority-derived`), `delegation` (`reconciliation-session-writes-options`), `dialogue` (`facts-carry-options`), `evaluation` (`overrule-by-class`), `readings` (`relation-per-option`), `recording` (`options-persist-at-the-recording`), `rejected` (`non-chosen-viable-options`), `unanswered` (`unanswered-is-no-ruling`), `viable-options` (`grant-from-a-ruling`). `dialogue` is one of the nine, so the node that states the rule breaks it. What is stored is not the answer's first sentences but a description of the change the option made — on `readings` at line 131 it opens "A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer", and elsewhere the prose opens with a raising note of the form "Raised on ... from the author's words of 2026-09-04". Six of the nine render that stored prose in the survey brief in place of the answer's opening (brief lines 559, 846, 1282, 2403, 2502, 3671), so any projection that reads a standing option's subsection shows the author a delta where the answer belongs. The other three (`dialogue`, `evaluation`, `unanswered`) are outside the judged set and their standing rows are not rendered in the brief, so their subsections are dead text nothing reads. The record has the question open and unruled in two places: `dialogue` carries the option `standing-option-carries-a-subsection` (source alignment-page, 2026-09-04) and `alignment-page` carries `standing-sentence-stored`, passed over on 2026-09-04. So nine nodes have implemented an option the author has not ruled, against the rule that stands.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/delegation, commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/alignment-page.

Proposed: Rule it once, on `commons.systems/disposition-graph/dialogue`, whose answer states the rule and whose fact already carries the option. If the standing option keeps no subsection, delete the nine subsections — the text is not lost, since `## Answer` carries the answer and the account carries the history of the change. If the standing option is to carry one, the rule in `dialogue`'s answer changes and the nine subsections are rewritten to carry the answer's first sentences rather than a description of a change. Either way the nine conform to one ruling and no node is left implementing the losing side. Until it is ruled, the six whose stored prose the projections render are the urgent half, because those are the ones showing the author the wrong text.

### Frontier finding, 2026-09-07

Kind: coverage.

which-facts-are-listed identifies a standing text that reads against its answer, says where the repair belongs, and the repair is recorded nowhere. Its answer reads "The asymmetry between the two texts is real and is not resolved here: `unanswered`'s sentence conditions one of the pair and not the other, and an option conditioning existence as persistence is conditioned belongs on that node, where its answer is", and its account repeats it. unanswered's file names which-facts-are-listed at no locus and carries no such option; its standing answer still reads that a response is given on "the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape", conditioning one of the pair and not the other. So a decision the record has identified as owed to one node is answered by no node at all.

Also named: commons.systems/disposition-graph/which-facts-are-listed.

Proposed: unanswered is the survivor and the home: the option conditioning `existence` as `persistence` is conditioned is recorded on its answer fact, sourced to which-facts-are-listed, so the author rules the asymmetry once at the node whose sentence carries it. which-facts-are-listed's answer stands as written, since it declines the question deliberately and says so.

Recorded as an option on this node's answer fact: `topology-conditioned-as-persistence-is` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/unanswered stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `unanswered-is-no-ruling`; the `## Rationale` its `**AI support.**`; 7 `## Disposition` entries became the ledger entries words/2026-09-03/80, words/2026-09-03/81, words/2026-09-03/82, words/2026-09-03/42, words/2026-09-03/83, words/2026-09-03/29, words/2026-09-03/84, referenced by 7 options the entry's own date names; and `stands` left the answer fact. The content of `responses-on-decisions-and-children (at db23d5b1)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `answered-by-stamp`, `page-in-ruling-order`, `child-ruling-held-until-the-parent`, `confirmation-before-the-ruling-stage-is-invalid`, `browser-hides-every-unanswered-node`, `fourth-class-or-field-for-unanswered`, `mark-answered-node-unanswered`, `deferred-answers-without-a-stage`, `review-item-nodes`, `a-curriculum`, `response-on-a-fact`, `edit-ruled-then-reviewed`, `stage-keeps-a-node-on-the-frontier`, `two-responses-where-the-page-offers-them`, `topology-conditioned-as-persistence-is`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `b5717e656b723368acf1ad6f3609c7ab85c6a1a3` was already past the recommendation and is left as it stood.

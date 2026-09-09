---
question: What may the recorder do to the graph's topology without asking?
stage: maieutic
probes:
  - id: does-the-delegation-reach-the-whole-fact
    target: author
    type: maieutic
    asks: >-
      Does the delegation of 2026-09-06 reach every question the topology fact
      now carries, or only the prune its sentence names?
    fact: authority
    why: >-
      The conferring words are `words/2026-09-06/6`: "Otherwise, pruning
      authority is granted to AI under general delegation of graph topology."
      The grant they name is the prune; the generality is named of the topic,
      and in a dependent clause, so the sentence can be read either as granting
      the prune because topology is already generally delegated, or as granting
      the prune alone and describing where it sits. On the first reading a
      general delegation exists; the record holds no other place where it was
      given. The words of 2026-09-08 name minting, merging, pruning and
      re-parenting as the fact's business, and this sitting widened the fact
      from whether a node exists to where it sits, adding the reparent and the
      fold. `commons.systems/disposition-graph/authority` holds that authority
      only narrows on the way down, so a delegation cannot widen with the fact
      it was given on, and which reading is right is the author's to say rather
      than the AI's to take from a clause. What this probe does not turn on,
      corrected the day it was raised when the record was read again: whether
      the AI may reconcile topology at all. `words/2026-09-08/11` grants that
      directly and separately, on any node the author has not confirmed
      ratified, and this answer already carries it. An earlier draft of this
      probe said the record held no other place where a general delegation was
      given, which was false when it was written.
    discharges: >-
      The class this fact carries, and nothing beyond it. On the general reading
      `delegated` stands as recommended and covers the reparent and the fold. On
      the narrow reading the widened fact is not covered by that delegation, the
      honest recommendation is `deferred`, and the delegation is recorded on the
      prune where the record can hold one. Either way the recorder keeps the
      authority `words/2026-09-08/11` gives it, so no work the record does today
      waits on this answer.
    source: ai
    raised: 2026-09-08
facts:
  - name: answer
    options:
      - name: delegation-with-two-bounds
        source: author
        ref: "2026-09-06"
        supports:
          - words/2026-09-06/6
          - words/2026-09-07/17
      - name: every-prune-asked-at-the-row
        source: ai
        ref: "2026-09-07"
      - name: a-third-bound-for-open-business
        source: ai
        ref: "2026-09-07"
      - name: deprecation-rather-than-deletion
        source: review
        ref: "2026-09-07"
      - name: pruning-and-what-a-prune-needs
        source: review
        ref: "2026-09-07"
      - name: prunes-reported-to-the-author
        source: review
        ref: "2026-09-07"
      - name: topology-as-a-fact-of-the-node
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/11
      - name: topology-is-a-field-until-it-is-contested
        source: ai
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/11
          - words/2026-09-08/16
        diverges:
          - words/2026-09-08/11
    recommends: topology-is-a-field-until-it-is-contested
    boldness: moderate
    against: "The clause that makes the topology fact conditional leaves the judgment of whether a placement is contested with the party whose move the fact would record: a recorder that mints no fact has stated nothing false, and the row the author would have disputed is the row the mover chose not to raise, which is `segregation-of-duties`' shape one level below the capture the authority fact concedes. The transfer bound is checked by the same session that wants the file gone. What a ruling would confer is deletion, which `commons.systems/disposition-graph/class-recommendation` names irreversible, on the party that also decides which node is redundant. The re-confirmation the author's rule puts in place of the flat bar on a ratified node forbids less than the bar did, and it protects nothing today, since no node carries a ruling and `confirmed ratified` names an empty set. And the scope is still the AI's: the author's words name a general delegation of graph topology and say when it acts, so which acts besides the prune and the reparent that phrase covers is read off this answer and not off anything they said."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: low
    against: "`commons.systems/disposition-graph/class-recommendation`'s test returns ratified on two of its three limbs. A prune is a deletion, which that node names irreversible; and the party that would set the answer is the party the answer is meant to check, which is its capture limb. A ruling of delegated is recommended against both, on the author's words alone, and if those words are read as a direction to draft rather than a delegation given, the recommendation is wrong."
review:
  verdict: forward
  strength: none
  date: 2026-09-07
  of: fa625a04fa815496426a4c627edc1681d163da4c
  commit: 1c0b5372d26e0340f42179fe949bc8bbd389c677
  survey:
    date: 2026-09-09
    of: df96f0525d7130c4268787a33dcfbfdc82c6a7d8
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "ddb1baebe2f7cda3481951e6e65da50f2a13c41c266478acb2793ec00ad9c685"
      answer: "ff2f9a1bc9fbd3453f21721b45d46300d644093412051b0672dd2e24cc4b8844"
      options: "9cf6563b2c2761f7dccee606e3f2296f471ffcd1de3a3d54f2260a851590cb97"
      rivals: "c01542a05fd3d01991f743bff46322a7c1131efc1d344d8dde2c7e85f4bddb58"
      words: "9c3106e41be838531daf1d7a8a7e2d8919ae2d1450f6c2dc307d1d7d247ce0ba"
    findings:
      - finding: "Two nodes quote `what-acts-during-bootstrap`'s definition of a grant in a form it no longer carries. That node defines \"`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant.\" `probe-or-node` quotes it inside quotation marks as \"a grant is the author's word, given for one named reconciliation of one unanswered node\" and restates it as \"which reaches one named reconciliation and no class\"; `graph-topology`'s binding answer reads \"the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class\". Both interims — `interim-follows-the-authors-word` and `topology-is-a-field-until-it-is-contested` — argue from the narrower reach, and both nodes carry `commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right` in `depends`."
        kind: "cross-reference"
        status: "new"
        since: "2026-09-09"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/graph-topology"
          - "commons.systems/disposition-graph/probe-or-node"
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
      - finding: "The third reserved fact is named `topology` in the schema and \"Existence\" wherever a reader meets it. `dialogue`'s `defines` list carries \"- term: topology\" whose gloss reads \"Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding.\", two entries above \"Keep is the choice on the topology fact that the node stays in the record with its question and its answer.\" — so one gloss list names the same fact both ways. `how-a-fact-is-headed`'s answer reads \"The three reserved facts are headed \\\"Authority\\\", \\\"Existence\\\" and \\\"Persistence\\\".\" `unanswered`'s sentence, quoted on `which-facts-are-listed`, reads \"the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape\"."
        kind: "vocabulary"
        status: "new"
        since: "2026-09-09"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/graph-topology"
          - "commons.systems/disposition-graph/dialogue"
          - "commons.systems/disposition-graph/how-a-fact-is-headed"
          - "commons.systems/disposition-graph/unanswered"
          - "commons.systems/disposition-graph/which-facts-are-listed"
    pairs:
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/hexis"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/movements"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "words:words/2026-09-06/6"
          - "words:words/2026-09-07/17"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "depends"
      - with: "commons.systems/disposition-graph/topology-criteria"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/turn-form"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "parent:commons.systems/disposition-graph/authority"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/when-the-kickback-feedback-shows"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/which-facts-are-listed"
        keys:
          - "cites"
depends:
  - commons.systems/disposition-graph/recording#prune-of-an-unruled-node-needs-no-ruling
  - commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right
form: rule
under:
  - commons.systems/disposition-graph/authority
---

## Facts

### answer

`topology-is-a-field-until-it-is-contested` is recommended, at moderate boldness,
and it replaces `delegation-with-two-bounds` as the recommendation on 2026-09-08.
What is the author's is the delegation itself, the transfer bound, the moment the
delegation acts, and the re-confirmation a ratified node's topology takes. What is
the AI's is the reach of the phrase "graph topology", which the author has now
twice used as a thing already granted and which no node of the record has ever
stated; the encoding of topology as a field that becomes a fact only where a
second placement is viable; the rule that the delegation acts from the ruling on
this node's authority fact and not from the words alone; and the departure from
`commons.systems/disposition-graph/recording`, that a prune taken under the
delegation records no ruling before the deletion. Boldness is a property of the
whole recommended text and not of the clause whose provenance is best, and the
text is mixed rather than mostly the AI's: three of its seven paragraphs restate
the author's disposition of 2026-09-06 and 2026-09-08, and the rest is the AI's
construction, which is what moderate records. The case against is on the fact, and
this answer does not meet it.

What the author's words of 2026-09-08 moved. They supplied the moment, which the
delegation had never had: the recorder acts when its own recommendation moves, so
the move and the record of it are one act and no topology decision sits in an
interval where it has been taken and not written down. They supplied the
instrument, a fact on the node answering where the disposition sits relative to
the rest of the graph, which the record had nowhere to put, so that a placement
the AI thought wrong but had not yet changed was carried nowhere. And they
replaced the first bound: this node's answer had said a ratified node is not the
recorder's to prune, an absolute bar reaching the prune alone, where the author
says a confirmed ratified node is re-confirmed before its topology moves, which
forbids less and reaches every topology act. The recommended text takes all three.

Where the recommendation departs from those words is one clause, and the author
asked for the departure to be offered: "If there is a cleaner model for encoding
this disposition on AI authority to manage graph topology, then recommend it
through periagoge." The author's model puts a topology fact on every node; the
recommended text leaves the placement in the `under` field and the file, where the
validator and the projector already read it, and mints the fact on the node when a
second placement becomes viable. The turn the periagoge asks the author to take is
to three things the record already holds and did not write for this question:
`commons.systems/disposition-graph/model`, which says what can be computed from
the facts is not stored beside them;
`commons.systems/disposition-graph/codd-update-anomaly`, which names one fact in
two places as the anomaly, and here the two copies would be written by different
acts, so they drift the moment a move is taken without the fact being touched; and
`commons.systems/disposition-graph/which-facts-are-listed`, which declined a live
topology radio on every row on the ground that a row asking nothing still costs
the author a reading. The author's own model stands on the fact as
`topology-as-a-fact-of-the-node`, because the judgment that those three outweigh
the uniformity of a fact the schema mints rather than the mover is the author's to
disagree with, and this fact's `against` says exactly why they might: a fact minted
only where a placement is contested is minted by the party that judges whether it
is contested.

The ground the author gave for the exception is not the ground the recommended
text uses, and that is the second thing the periagoge turns on. "Reconciliation of
topology is an exception because it involves reconciliation of the graph, not the
implementation layer" also describes writing an answer, moving a recommendation
and recording a ruling, none of which this delegation touches and none of which
the author would put in the AI's hands on that ground; so the sentence, read as it
stands, reaches past the rule it was given for. The line the record already draws
is shape against substance, and it is checkable: an act is a topology act if the
record after it asks a different set of questions, and it is not one if the record
after it gives a different answer to the same question. That line returns the
author's verdict on every case their sentence was reaching for, and the right
verdict on the cases it was not.

This node and `commons.systems/disposition-graph/probe-or-node`'s option
`prune-delegated-with-two-bounds` are two homes for one delegation, and a ruling
here is the choice of this home. That node's `depends` names this one, so the
author meets this question first; a ruling for the option there would leave this
node's question answered by nothing, and its own placement would move to `prune`.
What the author chooses between is two homes and not two delegations.

`every-prune-asked-at-the-row` and `a-third-bound-for-open-business` are the AI's
and are live. The first is the record as it stood before the delegation and the
narrowest reading of what the author delegated; the second keeps the delegation
and adds the bound the author's do not supply, which is the one the record's only
queued prune would need. `deprecation-rather-than-deletion`,
`pruning-and-what-a-prune-needs` and `prunes-reported-to-the-author` are the
clean-context reading's of 2026-09-07 and are live too: the first changes what the
delegated act is, so that it is reversible and
`commons.systems/disposition-graph/class-recommendation`'s irreversible limb no
longer fires; the second changes how far the scope reaches, delegating the prune
the author named and what a prune's remedy needs and no more; the third adds a
report to the author rather than a bound on the act. None of the five is displaced
by the author's words of 2026-09-08, which bear on the encoding and the moment and
not on the extent, and the paragraphs of the recommended text that carry the
extent are unchanged, so the move of the recommendation leaves each of their cases
standing where the reading left it.

#### delegation-with-two-bounds

The author's words of 2026-09-06, quoted above, taken as what they say: pruning
authority is granted to the AI under a general delegation of graph topology,
bounded by two things and no others — a node the author has ruled is not pruned,
and anything the record holds as the author's is transferred to another node
first. The scope this answer draws for "graph topology" is which nodes exist and
what each refines, and it stops at the edge of every question's substance. Viable,
and recommended, because it is the author's own disposition and because the record
has nowhere else to put it: a delegation is a class, a class is read off a ruling
on an authority fact, and until a node carries that fact the author's words are an
input the record cannot act on.

**AI support.** The author, 2026-09-06, closing their three lines on the prune grant: "Otherwise, pruning authority is granted to AI under general delegation of graph topology." Those words name a general delegation of graph topology as something already held and grant the prune under it, and no node of the record has ever said what that delegation covers, so the phrase was doing work nothing had drafted. This node is where it is drafted.

Why a node and not a clause of the rule that needed it. `commons.systems/disposition-graph/probe-or-node`'s four tests, put to the author's words, return a node on three: the response is a delegation, and only a disposition carries a class; the words are already quoted on three nodes and bear besides on `recording`, `frontier-consistency` and `viable-options`, which is doctrine reaching below the node that would have held them; and every later session that prunes anything needs the response on its own account. The author said the same on 2026-09-07: "If author's intent is a peristent disposition, then it may require a new node to be reconciled into the alignment skill." The record had meanwhile begun treating the rule about probes as the carrier by default, which is the drift a carrier settled by default produces.

Why the scope is drawn at shape and stops there. The delegation the author names is of topology, and what the record can hand over without handing over the dialogue is which questions the graph asks and how they nest; what it cannot hand over is any answer, since a class only ever narrows on the way down and a delegation over shape that reached substance would be widening it. The line is checkable: an act is a topology act if the record after it asks a different set of questions, and it is not one if the record after it gives a different answer to the same question.

Why the whole of that scope and not the prune alone, which is the narrower answer on the fact as `pruning-and-what-a-prune-needs`. The author's words name a general delegation of graph topology as a thing they hold and grant the prune under it, so the phrase is theirs and its reach is what this node exists to state; a scope drawn narrower than their words reach would be the AI narrowing a grant it was given, which is a different act from reading one and is not the delegate's to take. The paragraph above argues where the outer edge falls, at the line between shape and substance, and this one says why the inner scope is not cut back further: because cutting it back is a decision about the author's grant, and the place for that decision is the author's ruling on the option, not the drafting of the answer.

The first prune this delegation reaches is the one the independence test proposed on `commons.systems/disposition-graph/hexis`, whose topology fact has recommended `prune` since 2026-09-04 and which waits at its row. That is why the third option on this node's answer fact exists and why the author is shown it: the two bounds look at a node's history and neither reaches a node whose question is currently in front of the author.

Why deletion and not deprecation, which is on the fact as `deprecation-rather-than-deletion` and is the answer that would dissolve the case against this one. A prune is a deletion, and the class-recommendation node names a deletion irreversible; this answer does not recast it as anything else, and the authority fact below concedes the limb. What it sets against that is what a deprecation costs and what the record keeps without it: the file stays in the ref's history, and before it goes the surviving node carries the question, the account folded into it, and the reason the question was closed, which the paragraph on the bounds requires of every prune, so what a reader loses is a path and not the content, though the path is lost. A deprecated node left in the tree is a third state, neither a node nor gone, and the parser, the browser, the alignment page, the frontier and the validator must each learn to skip it, so every rule the record states about nodes acquires an exception and every instrument acquires a branch. That is a standing cost paid on every node forever, to make reversible an act the author's own word, "prune", does not ask to be reversible. The option stays on the fact because the judgment that the history and the survivor are enough is the author's to disagree with.

Readings owed under this node: `segregation-of-duties`, already held in this record, for the shape the fact's case against names, the party that finds the node redundant being the party that takes the file; `deprecation-not-deletion`, for the alternative to deleting at all, which the paragraph above declines and says why and which stands on the fact as `deprecation-rather-than-deletion`; `ocap-attenuation`, adopted on `authority`, for the rule that a delegation passes on a strictly weaker reference, which is what confines this one to shape; and the distinction in administrative law between a power to organize and a power to decide, for the line this answer draws.

**AI divergence.** The delegation's only stated limit excludes nothing in the record as it stands: no option on any node carries a ruling, so `may not prune something that is ratified` names an empty set, and the second bound, that anything of the author's be transferred first, is checked by the same session that wants the file gone. What a ruling would confer is deletion, which `commons.systems/disposition-graph/class-recommendation` names irreversible, on the party that also decides which node is redundant, which is the shape `segregation-of-duties` names. And the scope is the AI's: the author's words name a general delegation of graph topology and grant pruning under it, so which acts besides the prune that phrase covers is read off this answer and not off anything they said.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The recorder shapes the graph and never decides its questions. The graph's topology is which nodes exist and what each refines: minting a node, drawing and redrawing the `under` edges that say what it refines, folding one node's question into another, and pruning a node whose question the record no longer asks. Within that scope the recorder acts under the author's delegation of 2026-09-06 and does not ask. Outside it nothing here confers anything: an answer, an option, a recommendation, a boldness and a ruling are reached by the classes the `commons.systems/disposition-graph/authority` node defines and by no delegation of shape, so an act that would settle a question is not a topology act however it is dressed, and authority only narrows on the way down.

Two bounds hold, and they are the author's own. A node the author has ratified, one whose answer fact carries a ruling, is not the recorder's to prune: its answer is a thing the author committed to, and withdrawing a commitment is theirs. And anything the record holds as the author's on the node, their words above all, is transferred to another node before the file goes, so that a deletion never destroys something only the author could have given. To those this answer adds the reason the question was closed, which `commons.systems/disposition-graph/recording` requires of any prune, and, where the prune follows the independence test, the survivor recorded on the node that keeps the question and the account folded into it, which `commons.systems/disposition-graph/probe-or-node`'s remedy requires; this answer requires all three of every prune taken under the delegation, so that a deletion is never the only record of itself.

The delegation acts from the ruling on this node's authority fact and not before, and that is not a formality. A class is read off a ruling recorded on a fact; a delegation written into the prose of an answer is a class the AI wrote for itself, which the `authority` node says is not a grant. So until this fact is ruled `delegated`, a prune is asked where the record asks it today, and taken where the author has already directed it: a prune of a node no ruling reaches that the author has directed in their own words is taken on that word, wherever it was given, as a standing direction of the author's about a class of act; the grant the what-acts-during-bootstrap node defines reaches one named reconciliation and no class, so a direction about a class acts by right only if that node's option `a-standing-direction-acts-by-right` is ruled, on which this interim rests and until which it is applied as the author's words of 2026-09-05 directed, which is the interim `commons.systems/disposition-graph/probe-or-node` now recommends; and where no such word has been given the node's topology fact moves to `prune` with the reason it was found, and the author rules it at that node's own row, which is what the alignment skill's independence clause and `packages/clean-context-review/brief-survey.md` instruct today, and what the sixteenth validation `commons.systems/disposition-graph/frontier-consistency` now recommends would instruct; those instructions stand unchanged until the ruling. What the ruling changes is one clause in each of them, and in the independence test's remedy on `commons.systems/disposition-graph/probe-or-node`, which cites this node rather than carrying the rule. It changes two other places that already read the delegation as conferred: `commons.systems/disposition-graph/which-facts-are-listed`, whose answer keeps a live topology radio off the alignment page on the ground that the author's disposition gives the prune of an unratified node to the AI, a ground that holds only from this ruling and is recorded there as the option `topology-radio-waits-on-the-delegations-ruling`; and `commons.systems/disposition-graph/dialogue`, whose account of 2026-09-06 names `probe-or-node` as the delegation's home, which this node now is.

Where a prune is taken under this delegation no ruling precedes the deletion, and that departs from `commons.systems/disposition-graph/recording`, whose answer requires that a ruling the node not exist be recorded before the node is deleted. The departure is recorded as an option on that node and is not adopted here in silence. What survives it is the reason that rule was given: the record keeps the reason a question was closed instead of losing it with the file, which the paragraph above requires whether a ruling was given or not.
```

#### every-prune-asked-at-the-row

The delegation covers minting a node and drawing its `under` edges, and stops
short of the prune: every deletion is asked at the node's own topology-fact row
and the author rules it, which is what
`commons.systems/disposition-graph/recording` requires today, what
`commons.systems/disposition-graph/frontier-consistency`'s sixteenth validation
instructs, and what the two materialized loci implement. Viable if the author
holds that a deletion is not a thing to delegate at all, however clearly they said
otherwise: the two bounds they named do not bind where it matters, since no node
in the record carries a ruling and the transfer is checked by the party that wants
the file gone, and a row costs the author one ruling on a frontier where the
independence test is expected to reach a handful of nodes. Under this option the
record changes in nothing but gaining the statement of it, and the answer's first
paragraph stands with its last two clauses struck.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The delegation covers minting a node and drawing its `under` edges, and stops
short of the prune: every deletion is asked at the node's own topology-fact row
and the author rules it, which is what
`commons.systems/disposition-graph/recording` requires today, what
`commons.systems/disposition-graph/frontier-consistency`'s sixteenth validation
instructs, and what the two materialized loci implement. Viable if the author
holds that a deletion is not a thing to delegate at all, however clearly they said
otherwise: the two bounds they named do not bind where it matters, since no node
in the record carries a ruling and the transfer is checked by the party that wants
the file gone, and a row costs the author one ruling on a frontier where the
independence test is expected to reach a handful of nodes. Under this option the
record changes in nothing but gaining the statement of it, and the answer's first
paragraph stands with its last two clauses struck.
```

#### a-third-bound-for-open-business

The author's two bounds and a third the AI adds: a node with business open with
the author is not pruned under the delegation but waits for them. Open business
means an undischarged probe on the node, a pending ruling on any of its facts, or
a topology fact already showing `prune` at a row the author has not yet reached.
The author's two bounds both look at a node's history — whether they ruled it,
whether their words are on it — and neither reaches a node whose question is
currently in front of them, which is where a delegated deletion does the most
damage: the author loses a decision they were about to make and never learns which
one. The case for it is the record's only instance, `commons.systems/disposition-graph/hexis`,
whose topology fact has recommended `prune` since 2026-09-04 and which waits at
its row; under the two bounds alone it is deleted the day this fact is ruled. The
case against is that it hands back by a side door what the author gave — a
recorder who wants a prune can leave a row standing and then read the row as the
bound — and that the author said "otherwise" without qualification.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The author's two bounds and a third the AI adds: a node with business open with
the author is not pruned under the delegation but waits for them. Open business
means an undischarged probe on the node, a pending ruling on any of its facts, or
a topology fact already showing `prune` at a row the author has not yet reached.
The author's two bounds both look at a node's history — whether they ruled it,
whether their words are on it — and neither reaches a node whose question is
currently in front of them, which is where a delegated deletion does the most
damage: the author loses a decision they were about to make and never learns which
one. The case for it is the record's only instance, `commons.systems/disposition-graph/hexis`,
whose topology fact has recommended `prune` since 2026-09-04 and which waits at
its row; under the two bounds alone it is deleted the day this fact is ruled. The
case against is that it hands back by a side door what the author gave — a
recorder who wants a prune can leave a row standing and then read the row as the
bound — and that the author said "otherwise" without qualification.
```

#### deprecation-rather-than-deletion

Within the topology scope the recorder deprecates rather than deletes. The node
is marked as superseded with the survivor named, dropped from the browser, the
alignment page and the frontier, and left in the tree; nothing the record holds
is destroyed, and the delegated act is reversible, since a deprecation read back
is undone by unmarking the node. What that buys is the strongest objection this
fact records. `commons.systems/disposition-graph/class-recommendation` returns
irreversible on a deletion — "Irreversible means it is not paid back at all: a
deletion, a swap, a landing that other work is built on" — and an act that is
paid back does not fire that limb, so the author's two bounds become belt and
braces rather than the whole of the delegation's safety, and the objection that
one ruling confers the only power the record calls irreversible falls away.
Viable, and not recommended, for the reason the rationale now makes rather than
owes: the deletion stays the irreversible act the class-recommendation node names,
what the record keeps of a pruned node, its history and its survivor with the
reason, is judged enough, and a third state left in the tree is a cost every
instrument and every rule about nodes pays forever.
Raised by the clean-context reading of 2026-09-07, which named it the answer that
meets its counter-argument.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

Within the topology scope the recorder deprecates rather than deletes. The node
is marked as superseded with the survivor named, dropped from the browser, the
alignment page and the frontier, and left in the tree; nothing the record holds
is destroyed, and the delegated act is reversible, since a deprecation read back
is undone by unmarking the node. What that buys is the strongest objection this
fact records. `commons.systems/disposition-graph/class-recommendation` returns
irreversible on a deletion — "Irreversible means it is not paid back at all: a
deletion, a swap, a landing that other work is built on" — and an act that is
paid back does not fire that limb, so the author's two bounds become belt and
braces rather than the whole of the delegation's safety, and the objection that
one ruling confers the only power the record calls irreversible falls away.
Viable, and not recommended, for the reason the rationale now makes rather than
owes: the deletion stays the irreversible act the class-recommendation node names,
what the record keeps of a pruned node, its history and its survivor with the
reason, is judged enough, and a third state left in the tree is a cost every
instrument and every rule about nodes pays forever.
Raised by the clean-context reading of 2026-09-07, which named it the answer that
meets its counter-argument.
```

#### pruning-and-what-a-prune-needs

The delegation is of the prune the author named, together with the minting and
the edge-drawing a prune's remedy needs — the node the surviving question moves
to, and the `under` edge that places it — and the rest of what "graph topology"
might reach is left to be asked when something needs it. Three of the four acts
the recommended answer lists have never been put to the author, and their words
grant pruning "under general delegation of graph topology" without saying what
else that phrase covers. Viable because it adds nothing of the AI's to what the
author granted, and because a delegation is the one thing the record says only
ever narrows on the way down, so the narrow reading is the one that cannot be too
wide. Not recommended for the reason the rationale gives: the author's words name
the general delegation as a thing they already hold, and a scope drawn narrower
than their words reach is the AI narrowing a grant, which is a different act from
reading one. Raised by the clean-context reading of 2026-09-07.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The delegation is of the prune the author named, together with the minting and
the edge-drawing a prune's remedy needs — the node the surviving question moves
to, and the `under` edge that places it — and the rest of what "graph topology"
might reach is left to be asked when something needs it. Three of the four acts
the recommended answer lists have never been put to the author, and their words
grant pruning "under general delegation of graph topology" without saying what
else that phrase covers. Viable because it adds nothing of the AI's to what the
author granted, and because a delegation is the one thing the record says only
ever narrows on the way down, so the narrow reading is the one that cannot be too
wide. Not recommended for the reason the rationale gives: the author's words name
the general delegation as a thing they already hold, and a scope drawn narrower
than their words reach is the AI narrowing a grant, which is a different act from
reading one. Raised by the clean-context reading of 2026-09-07.
```

#### prunes-reported-to-the-author

The delegation and the two bounds as the author gave them, and no third bound;
what this option adds is that every prune taken under the delegation is reported
to the author, the node, the survivor that keeps its question, and the reason the
question was closed, at the next sitting and on the alignment page, so the author
learns which questions were closed without ruling each one.

**AI support.** For it: it meets the
capture limb `class-recommendation` names, that the party finding a node redundant
is the party that takes the file, without spending a ruling per prune as
`every-prune-asked-at-the-row` does, without leaving a third state in the tree as
`deprecation-rather-than-deletion` does, and without narrowing a grant the author
gave as `pruning-and-what-a-prune-needs` does. Viable and not adopted: what it
adds is a surface, and which surfaces reach the author is `turn-form`'s question
for the sitting and `alignment-page`'s for the page; the record's own trace of a
prune under the recommended text is the survivor's account, which the browser
renders and the frontier lists, and a report beside it is the author's to ask for.
Raised at the clean-context reading of 2026-09-07, in its viability paragraph.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The delegation and the two bounds as the author gave them, and no third bound;
what this option adds is that every prune taken under the delegation is reported
to the author, the node, the survivor that keeps its question, and the reason the
question was closed, at the next sitting and on the alignment page, so the author
learns which questions were closed without ruling each one.
```

#### topology-as-a-fact-of-the-node

The author's model of 2026-09-08: every disposition carries its topology as a
fact of its own, answering where this disposition exists relative to the rest of
the graph, and the AI recommends on that fact as it recommends on any other. The
authority follows the fact rather than the act: the AI reconciles its own
recommended topology at the moment the recommendation changes, on any node the
author has not confirmed ratified, and a node the author has confirmed ratified
is re-confirmed before its topology moves. The ground the author gives is that a
topology move reconciles the graph and not the implementation layer, which is why
it stands outside the rule that the AI reconciles only what is confirmed, what a
delegation or a deferral covers, or what a grant names. Viable, and the answer
this node carries if the author wants the row on every node rather than on the
nodes whose placement is in question.

**AI support.** The author, 2026-09-08: "Dispositions carry their topology as a fact that AI can make recommendations on (a fact that answers where does this disposition exist relative to the rest of the graph). Generally, AI can only reconcile disposition fact which is confirmed, or within the scope of confirmed delegated/deferred authority, or for which boostrap authority has been explicitly granted for a sitting. Reconciliation of topology is an exception because it involves reconciliation of the graph, not the implementation layer. AI has authority to reconcile AI recommended topology at the time the recommendation changes for any node that is not confirmed ratified. Only confirmed ratified nodes require re-confirmation before reconciling graph topology."

What those words supply that this node did not have. The first is the timing: the delegation as it stood said what the recorder may do and never said when, and a delegation without a moment reads as a licence held in reserve. The author fixes the moment at the change of the recommendation, which makes the move and the record of it one act and leaves no interval in which a topology decision is taken but unrecorded. The second is the instrument: the record had no place to put a topology decision except the `under` field and the account, so a placement the AI thought wrong but had not yet changed was carried nowhere. The third is the correction to the first bound. This node's answer said a ratified node is not the recorder's to prune, an absolute bar; the author says a ratified node is re-confirmed before its topology moves, which is narrower in what it forbids and wider in what it reaches, since re-confirmation covers every topology act and the bar covered the prune alone.

Why it is recorded as the author's and not folded into the recommended text. The two differ on one clause, whether the fact stands on every node or only where a placement is contested, and that clause is the AI's cut and not the author's. Folding it in would have made the author's disposition read as though it had settled a question they did not raise. The rest of their words are in the recommended text unchanged.

**AI divergence.** The ground proves too much. "Reconciliation of the graph, not the implementation layer" also describes writing an answer, moving a recommendation, and recording a ruling, none of which the author would put in the AI's hands on that ground; so the line the sentence draws is not the line the rule needs. The line the record already has is shape against substance, which `commons.systems/disposition-graph/under` and this node's first paragraph draw, and which returns the same verdict on every case the author's ground was reaching for while returning the right verdict on the cases it was not.

The fact duplicates the field. A node's `under` is its topology, the file's existence is its existence, and both are data the validator checks and the projector reads; a fact recommending the same placement is one fact in two places, which `commons.systems/disposition-graph/codd-update-anomaly` names as the anomaly the record avoids, and it is the anomaly in its worst form, since the two copies are edited by different acts.

Under the author's own timing rule the fact is a log on every node but the ratified ones. If the move is taken at the moment the recommendation changes, the fact the author later reads records a move already made, so their ruling on it is a reversal and not a gate. That is not wrong and it is what `commons.systems/disposition-graph/evaluation` says a move on a delegated node does; it is a reason not to put the row on all 154 nodes, because a row that never asks anything of the reader on the node where nothing is contested is the surface `commons.systems/disposition-graph/which-facts-are-listed` already declined to give existence.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The recorder shapes the graph and never decides its questions. The graph's topology is which nodes exist and what each refines: minting a node, drawing and redrawing the `under` edges that say what it refines, folding one node's question into another, and pruning a node whose question the record no longer asks. Outside that scope nothing here confers anything: an answer, an option, a recommendation, a boldness and a ruling are reached by the classes the `commons.systems/disposition-graph/authority` node defines and by no delegation of shape, so an act that would settle a question is not a topology act however it is dressed, and authority only narrows on the way down.

Every disposition carries its topology as a fact of its own, which answers where this disposition exists relative to the rest of the graph, and which the AI recommends on as it recommends on any other fact. The fact stands on every node whether or not its placement is in question, so that the place a topology decision is recorded is the same place on every node and no node's placement is carried only by a field.

The recorder reconciles its own recommended topology at the moment the recommendation changes, on any node the author has not confirmed ratified. Only a node the author has confirmed ratified is re-confirmed before its topology moves. This is an exception to the rule that the AI reconciles only what is confirmed, what a delegation or a deferral covers, or what a grant names, and the ground of the exception is that a topology move reconciles the graph and not the implementation layer.

One bound holds beyond the ratified node's re-confirmation, and it is the author's own: anything the record holds as the author's on the node, their words above all, is transferred to another node before the file goes, so that a deletion never destroys something only the author could have given. To it this answer adds the reason the question was closed, which `commons.systems/disposition-graph/recording` requires of any prune, and, where the prune follows the independence test, the survivor recorded on the node that keeps the question and the account folded into it, which `commons.systems/disposition-graph/probe-or-node`'s remedy requires.

The delegation acts from the ruling on this node's authority fact and not before. A class is read off a ruling recorded on a fact; a delegation written into the prose of an answer is a class the AI wrote for itself, which the `authority` node says is not a grant.
```

#### topology-is-a-field-until-it-is-contested

The author's disposition of 2026-09-08 whole, with one clause of the AI's: the
scope, the timing rule, the re-confirmation of a ratified node and the transfer
bound as the author gave them, and topology recorded as a field until a second
placement is viable, at which point the fact is minted on the node whose
placement is in question and carries the placements as options in the ordinary
way. It is the fact the record carried under the name `existence` until this
answer, widened from whether the node exists to where it sits and renamed for the
wider question, so nothing the record carries today is lost and no node acquires
a row for a question it does not raise. Recommended, because it gives the author
every effect they asked for and takes the encoding from the record's own rule
that what can be derived is not stored.

**AI support.** The author's words of 2026-09-08, quoted on `topology-as-a-fact-of-the-node` above, supply the scope, the moment, the exception and the re-confirmation, and this option changes none of them. The author asked for the alternative in the same breath: "If there is a cleaner model for encoding this disposition on AI authority to manage graph topology, then recommend it through periagoge." This is that recommendation, and the periagoge it is offered through is the turn to the record's own grounds below, which the author is the judge of.

Why a field and not a fact. `commons.systems/disposition-graph/model` holds that rank, the context a session loads, the work queue and the author's review queue are computed from the facts and never stored, and a node's placement is of that kind: the `under` field is the placement, the file's existence is the existence, the validator checks both and the projector reads both. A fact recommending what the field already states is one fact in two places, which `commons.systems/disposition-graph/codd-update-anomaly` names as the update anomaly, and here the two copies are written by different acts, so they drift the moment a move is taken without the fact being touched.

Why the fact is minted when a second placement becomes viable and not before. `commons.systems/disposition-graph/viable-options` and `commons.systems/disposition-graph/pareto-frontier` already say what belongs on a fact: the options that remain viable. A fact with one viable option asks the author nothing, and 154 of them ask nothing 154 times. This is the argument `commons.systems/disposition-graph/which-facts-are-listed` accepted when it kept a live topology radio off every row, and the argument does not change when the fact is widened from existence to placement; what changes is that the fact, where it is minted, now carries the reparent and the fold as well as the prune, which it never could while it asked only whether the node exists.

Why the fact is the record's own `existence` fact widened and renamed rather than a new kind beside it. The record already mints that fact on a node whose existence is in question, and the questions it cannot ask there are the two the author's model needs: whether the node belongs under a different question, and whether it should be folded into another. Widening the fact answers those without adding a second row to a node that would otherwise carry both, and every fact of that kind the record holds today becomes a topology fact with its options unchanged, the name following the question.

Why the two-sided acts are recorded on both nodes. A fold changes the survivor's question and the folded node's existence; a reparent changes the child's field and every sibling's share of the parent's rank, since `commons.systems/disposition-graph/under` says the edge carries attention and context as well as authority. A fact records one node's placement and cannot record what the act did to the other, so the account entry goes on both and neither side of a two-sided act is silent.

Readings owed under this option: `codd-update-anomaly` and `event-sourcing-derived-view`, both held in this record, for the field-against-fact judgment; `ocap-attenuation`, adopted on `authority`, for the rule that a delegation passes on a strictly weaker reference, which is what confines this one to shape; and the distinction in administrative law between a power to organize and a power to decide, for the line the first paragraph draws.

**AI divergence.** The clause that makes the fact conditional puts the judgment of whether a placement is contested in the hands of the party whose move the fact would record. A recorder that does not mint the fact has not lied about anything, and the author never sees the row, so the surface that would have shown them a placement they might dispute is exactly the surface the mover decides to raise. That is the shape `commons.systems/disposition-graph/segregation-of-duties` names, one level down from the capture the authority fact concedes, and the author's own model does not have it: an unconditional fact is minted by the schema and not by the mover. What is set against it is the account entry, which this answer requires of every move and which is not the mover's to withhold, and the alignment page's own listing of what changed since the author last read the node.

And the scope is still the AI's. The author's words name a general delegation of graph topology and state when it acts; which acts besides the prune and the reparent that phrase covers is read off this answer and not off anything they said.

**Content.**

```markdown
---
question: What may the recorder do to the graph's topology without asking?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The recorder shapes the graph and never decides its questions. The graph's topology is which nodes exist and what each refines: minting a node, drawing and redrawing the `under` edges that say what it refines, folding one node's question into another, and pruning a node whose question the record no longer asks. Outside that scope nothing here confers anything: an answer, an option, a recommendation, a boldness and a ruling are reached by the classes the `commons.systems/disposition-graph/authority` node defines and by no delegation of shape, so an act that would settle a question is not a topology act however it is dressed, and authority only narrows on the way down. The line is checkable: an act is a topology act if the record after it asks a different set of questions, and it is not one if the record after it gives a different answer to the same question.

The recorder acts when its own recommendation moves, and the move and the record of it are one act. A topology recommendation that has changed is reconciled in the sitting that changed it, on any node the author has not confirmed ratified, and the account carries what moved and why; there is no interval in which a topology decision is taken but unrecorded, and no queue of topology moves waiting for a ruling nobody asked for. On a node whose answer the author has ratified the move waits, because the placement is part of what they committed to, and the author re-confirms before it changes. This is the author's rule of 2026-09-08, and its second half replaces the flat bar this answer carried before: a ratified node was not the recorder's to prune at all, where now it is re-confirmed before any topology act, which forbids less and reaches further.

Topology is a field before it is a fact. A node's placement is its `under` field and its existence is the file, both of them data the validator checks and the projector reads, and `commons.systems/disposition-graph/model` holds that what can be computed from the record is not stored beside it. A topology fact is minted on the node when a second placement becomes viable, and it carries them as options in the ordinary way: keep, prune, `under` these questions rather than those, fold into that node. It is the fact the record carried under the name `existence` until this answer, widened from whether the node exists to where it sits and renamed for the wider question, so every fact of that kind the record holds today is a topology fact with its options unchanged, and the two questions it could never ask, the reparent and the fold, are asked on the same row. Where one placement is viable there is no fact, because a fact with one option asks the author nothing.

A move that touches two nodes is recorded on both. A fold changes the survivor's question and the folded node's existence; a reparent changes the child's field and every sibling's share of the parent's rank, which is what `commons.systems/disposition-graph/under` says the edge means. The fact goes on the node whose placement is in question, and the account entry goes on both.

Two bounds hold, and they are the author's own. Anything the record holds as the author's on the node, their words above all, is transferred to another node before the file goes, so that a deletion never destroys something only the author could have given. And a node whose answer the author has ratified is re-confirmed before its topology moves. To those this answer adds the reason the question was closed, which `commons.systems/disposition-graph/recording` requires of any prune, and, where the prune follows the independence test, the survivor recorded on the node that keeps the question and the account folded into it, which `commons.systems/disposition-graph/probe-or-node`'s remedy requires; this answer requires all three of every prune taken under the delegation, so that a deletion is never the only record of itself.

The delegation acts from the ruling on this node's authority fact and not before, and that is not a formality. A class is read off a ruling recorded on a fact; a delegation written into the prose of an answer is a class the AI wrote for itself, which the `authority` node says is not a grant. The author's words of 2026-09-08 state the same grant a second time and more exactly, and stating it twice is not conferring it. So until this fact is ruled `delegated`, a prune is asked where the record asks it today, and taken where the author has already directed it: a prune of a node no ruling reaches that the author has directed in their own words is taken on that word, wherever it was given, as a standing direction of the author's about a class of act; the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class, so a direction about a class acts by right only if that node's option `a-standing-direction-acts-by-right` is ruled, on which this interim rests and until which it is applied as the author's words of 2026-09-05 directed, which is the interim `commons.systems/disposition-graph/probe-or-node` now recommends; and where no such word has been given the node's topology fact moves to `prune` with the reason it was found, and the author rules it at that node's own row. What the ruling changes is one clause in the alignment skill's independence test, in `packages/clean-context-review/brief-survey.md`, and in the remedy on `commons.systems/disposition-graph/probe-or-node`, which cites this node rather than carrying the rule. It changes two other places that already read the delegation as conferred: `commons.systems/disposition-graph/which-facts-are-listed`, whose answer keeps a live topology radio off the alignment page on the ground that the author's disposition gives the prune of an unratified node to the AI, a ground that holds only from this ruling and is recorded there as the option `topology-radio-waits-on-the-delegations-ruling`; and `commons.systems/disposition-graph/dialogue`, whose account of 2026-09-06 names `probe-or-node` as the delegation's home, which this node now is.

Where a prune is taken under this delegation no ruling precedes the deletion, and that departs from `commons.systems/disposition-graph/recording`, whose answer requires that a ruling the node not exist be recorded before the node is deleted. The departure is recorded as an option on that node and is not adopted here in silence. What survives it is the reason that rule was given: the record keeps the reason a question was closed instead of losing it with the file, which the paragraph above requires whether a ruling was given or not.
```

### authority

`delegated`, at low boldness. What a ruling of `delegated` records is that the
author has said they do not want to be asked again about this class of decision,
and that is exactly what the author said on 2026-09-06: "pruning authority is
granted to AI under general delegation of graph topology". The class is theirs to
confer and this fact is the only instrument the record has for conferring it, so
recommending anything else here would be recommending that the author's own words
not be recorded as what they are. Boldness is low because the recommendation rests
on those words and on nothing of the AI's. The author said it a second time on
2026-09-08, and more exactly: the AI reconciles its own recommended topology at
the moment the recommendation changes, on any node not confirmed ratified. Saying
it twice is not conferring it, and this fact is still where the conferral would be
recorded; what the second saying settles is the reading, since a delegation that
names its moment is not a direction to draft.

The author's words of 2026-09-08 carry a second clause, and the first reading of
them did not turn to it. They grant the recommendation outright, topology being
"a fact that AI can make recommendations on", and then bound the reconciling:
"Generally, AI can only reconcile disposition fact which is confirmed, or within
the scope of confirmed delegated/deferred authority, or for which bootstrap
authority" applies. Recommending and reconciling are separated there, and a
delegation is on the second side of the line. So the grant of 2026-09-06 does
not act because it was given; it acts once it is confirmed, and this fact is
where the confirming happens. Nothing in the reconciliation of 2026-09-08 stood
on it. The topology work of that sitting stood on the third limb the author's
own sentence names, the bootstrap grant, which is why it could proceed with this
fact unanswered and why proceeding was not the delegation acting early. Read
that way the two sayings do not repeat each other: the first confers a class and
the second says what a conferred class needs before it acts, and the fact that
carries the first is unanswered while the second is already in force.

`commons.systems/disposition-graph/class-recommendation`'s test, run honestly,
argues the other way on two limbs, and the fact's `against` states it: a prune is
a deletion, which that node names irreversible; and the party that would set the
answer is the party the answer is meant to check, which is capture-shaped. That test returns ratified here, on the two limbs conceded above, and this fact recommends against it on the author's words, which is a divergence and is recorded as one: it is the position `commons.systems/disposition-graph/class-recommendation` carries as the option `class-follows-the-authors-words`, and a ruling for that option there is what would make this reason the rule rather than a departure from it — but it is why
a ruling of `ratified` on this fact is a real option and not a formality, and a
ruling of `ratified` would mean the author wants the scope this answer draws
confirmed before any of it acts, not that they want to be asked about each prune.
The two bounds are what carry the irreversible limb under a delegation, and the
answer fact's `against` says how little they carry today.

## Account

### Manifest

- Folded: Minted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 0ec4fd5a, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of c1095227, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of ad0be2cf, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the fresh reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 90a2d6e7, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of 90a2d6e7, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 45efbd61

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `delegation-with-two-bounds`.

Findings:


On the facts and what they recommend: The diff touches only the answer fact's recommended text inside the `## Recommendation` fence and the frontmatter: `recommends` stays `delegation-with-two-bounds` at moderate boldness, the fence is still present since nothing stands, and the `against` on both facts is unchanged. In the third paragraph the clause 'since a grant given in the author's words acts by right while nothing in the record is ratified' is replaced with 'as a standing direction of the author's about a class of act; the grant the what-acts-during-bootstrap node defines reaches one named reconciliation and no class, so a direction about a class acts by right only if that node's option `a-standing-direction-acts-by-right` is ruled...and until which it is applied as the author's words of 2026-09-05 directed'; `depends` gains `commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right`; and the `review` block is otherwise untouched by this second amendment (still pinned `of 90a2d6e7`, which is exactly why the node's own status line marks the review and survey stale).

On the viability of the options: Unaffected: the diff changes only interim justificatory prose in the recommended answer's third paragraph plus the `depends` list, not any of the answer fact's six options or the authority fact's two, so every option remains exactly as viable as it was at the last reading.

The review found no strong counter-argument.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/graph-topology stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `delegation-with-two-bounds`; 2 `## Disposition` entries became the ledger entries words/2026-09-06/6, words/2026-09-07/17, referenced by 1 option the entry's own date names and by the recommended option for 1 the date named none. The record wrote no text of its own for `every-prune-asked-at-the-row`, `a-third-bound-for-open-business`, `deprecation-rather-than-deletion`, `pruning-and-what-a-prune-needs`, `prunes-reported-to-the-author`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `45efbd610e6028085e2233fa7faed9075010db93` is re-computed for the encoding as `14c7da6a681d2ed2b73919fcf7078ecd981de36e`; nothing it read changed. The survey's pin `90a2d6e729a986e93df3e0a8d8e241fa7bf6e5b0` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 14c7da6a

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Independence (16), reported as decomposition. This node's option `a-third-bound-for-open-business` "cites `hexis`, whose existence fact has recommended `prune` since 2026-09-04", and `hexis` asks "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?" — a question whose only possible answer is a reading of `purpose`'s answer, and which `purpose` already carries as the option `knowledge-store-first` sourced from `hexis`. A bound on open business that cites a node the record has recommended pruning rests its rule on the very artifact the sixteenth validation would fold away.

Strongest counter-argument (moderate): The authority fact recommends delegated at moderate boldness on a node whose two bounds govern the shape of the graph itself, and delegation here means the AI decides, without returning to the author, how the record it is being checked by may be structured. `class-recommendation`'s capture limb is written for exactly that party relation: the party that would set the answer is the party the answer is meant to check. The node's own third-bound option shows the cost is live rather than theoretical, since the bound it proposes turns on a node already recommended for pruning.

### Frontier finding, 2026-09-07

Kind: decomposition.

Independence, the sixteenth validation. `hexis` asks "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?" — a question whose only possible answer is a reading of `purpose`'s answer, whose facts repeat `purpose`'s, and which would be pruned the moment `purpose`'s recommendation moved; `purpose` already carries the answer as the option `knowledge-store-first` sourced from `commons.systems/disposition-graph/hexis`, and `hexis` itself carries the review option `sub-ruling-of-purpose`. The record has also recommended it away: `graph-topology`'s option `a-third-bound-for-open-business` "cites `hexis`, whose existence fact has recommended `prune` since 2026-09-04". The brief carries no `under` field for neighbourhood nodes, so the parent relation is read from the question's own wording and from the cross-sourced option rather than from a field.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/purpose.

Proposed: The survivor is `purpose`, and `hexis` becomes a probe on it: asks — on the purpose answer, which does the record's claim rest on, the disposition of the person or the store of what they have said; why — `purpose`'s answer states both and the record has never said which is the claim and which its gloss, and `purpose` carries `knowledge-store-first` as an option sourced from `hexis` with no ruling between them; discharges — it settles the order of the two clauses in `purpose`'s answer and moves `purpose`'s recommendation on its answer fact; fact — answer. `graph-topology`'s third-bound option is redrawn to cite `purpose` rather than a node recommended for pruning. No probe is raised in this file's `probes` array, because raising it is the act of the step that applies this proposal and the node's own existence fact already carries the prune.

### Frontier finding, 2026-09-07

Kind: cross-reference.

Four live options on `frontier-consistency`'s answer fact carry a validation list that ends at fifteen, while the node's account records the sixteenth as adopted into one of them: "Adopted into `split-survey-from-per-draft` on 2026-09-05: the survey's list names the sixteenth". The content fences of `split-survey-from-per-draft`, `the-survey-is-given-what-its-validations-read`, `one-line-only-where-a-survey-has-read-it` and `one-line-only-where-the-text-a-survey-read-still-stands` each end at "15. Merge. The opportunities to merge unanswered nodes as alternate answers to the same question", with no independence validation after it, and each is written in the struck term — "the node as it stands or the alternative it names" and "it adopts a listed alternative or the node as it stands". Ruling for any of the four would strike the independence validation and restore the word the recommended answer replaced, without saying it was doing either.

Also named: commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/probe-or-node.

Proposed: The survivor is the recommended answer's list of sixteen validations in the record's current vocabulary. The four live option fences are re-derived from it, each carrying only its own named change, so that the difference between an option and the answer is the change the option's name states and nothing else. `probe-or-node` is named because it owns the sixteenth validation the fences drop, and `graph-topology` because `sixteenth-validation-reads-the-delegation` makes that validation read the delegation off it.

Recorded as an option on commons.systems/disposition-graph/frontier-consistency's answer fact: `the-live-options-carry-the-sixteenth-validation` (source review, 2026-09-07).
### Sitting on the topology authority, 2026-09-08

The author opened the sitting with three inputs and a grant, and gave this node
the second of them. Their words are `words/2026-09-08/11`, entered in the ledger
and referenced by the two options this sitting added. Asked whether the three
inputs should be taken together or in some order, the sitting recommended taking
this one first, because the encoding of topology is what the other two inputs
would have to write into; the author agreed in `words/2026-09-08/16` and directed
that the reconciliation follow the recommendation rather than wait on a ruling,
the sitting running under bootstrap authority.

What was recorded. `topology-as-a-fact-of-the-node` carries the author's model
whole: topology as a fact of every node, the exception and its ground, the moment
the AI acts, and the re-confirmation of a confirmed ratified node.
`topology-is-a-field-until-it-is-contested` carries the same disposition with one
clause changed, and the recommendation moved to it, which the author invited in
the same words: "If there is a cleaner model for encoding this disposition on AI
authority to manage graph topology, then recommend it through periagoge." The
periagoge is written into the fact's prose and turns on three nodes the record
already holds, `model`, `codd-update-anomaly` and `which-facts-are-listed`, none
written for this question. The divergence on the author's stated ground, that a
topology move reconciles the graph and not the implementation layer, is recorded
on both options and in the fact's prose: read as it stands the ground also
describes writing an answer, so it does not draw the line the rule needs, and the
recommended text draws it at shape against substance instead.

What the move costs the review. The review of 2026-09-07 stands on the text this
sitting moved, so the node's review is stale from this edit and the alignment page
will show it as changed since its reading. The author directed that the cost of
review be managed in this sitting, so no clean-context round was bought for an
edit whose divergences are stated on the fact; the staleness is left for the
frontier to carry.

The author's second question of the day, whether a parallel projection would make
the split, merge and reparent rules deterministic rather than heuristic
(`words/2026-09-08/14`), is not this node's question, which asks what the recorder
may do without asking rather than by what rule it decides. It was minted as
`commons.systems/disposition-graph/topology-criteria` beneath this node.

### The fact renamed to follow its question, 2026-09-08

This node's recommended answer widens the record's `existence` fact from whether
a node exists to where it sits, and adds the two questions that fact could never
ask, the reparent and the fold. A fact whose name asks something narrower than
the fact asks misdirects every reader of it, so the name follows the question:
the fact is `topology` from this reconciliation, made under the author's grant
of 2026-09-08 and at implementation commit `f31943ca`.

What moved. The reserved name in the reader, the projector and the review's
briefs; the vocabulary term this record defines on
`commons.systems/disposition-graph/dialogue`; the sentence naming the reserved
facts on `commons.systems/disposition-graph/which-facts-are-listed`; four option
slugs built on the old name; and the live text of twenty node files. A node's
`## Account` keeps the word it was written with, because what the record said in
September is not amended by what the fact is called afterwards. Names are the
exception and change everywhere, history included, or the references to them
dangle.

What the rename cost the reviews, and what it did not. Eleven nodes carry review
or survey pins that the rename moved, seventeen pins in all, every one of them
on the node's own recommendation hash rather than on a single fact's. The pins
were re-computed from the renamed text and carried across, so no reading is owed
a second time for a change of name; a pin already stale before the rename was
left stale, since carrying it would forgive a move the rename did not make.
Measured over the whole landing: 159 pins, 53 stale before it and 55 after, the
two added being the surveys of
`commons.systems/disposition-graph/alignment-target` and
`commons.systems/disposition-graph/quotes`, whose recommendations the sitting
moved. The rename added none. Nothing else in the record's rulings moved,
because the record holds none.

The vocabulary widened with the name. `keep` and `prune` stay reserved and own
no subsection, taking their text from the glossary as an authority option does;
any other option on the fact is a placement option owning a `#### <option>`
subsection as an answer option does, which is what makes a reparent or a fold
recordable at all, since each names a destination that only the node can state.

None of this is a ruling. The answer above is recommended and unanswered, and
the rename is reversible by the mechanism that made it: the reader, the term,
the slugs and the live text are one substitution each, and the pins carry back
the way they carried across.
### The grounding the sitting owed on its own authority, 2026-09-08

The author observed at the close of the sitting of 2026-09-08 that the recording
of the topology authority "did not progress through periagogic grounding in the
way I might have expected based on the alignment input for alignment dialogue",
and asked that the record return to this fact once the alignment dialogue itself
was reconciled. It was reconciled in the same landing:
`commons.systems/disposition-graph/movements` now states the three movements and
the diagnosis that selects among them, and
`commons.systems/disposition-graph/plato-elenchus` grounds the third.

The turn, made under those movements. The first reading of this fact argued from
two places: the author's conferring words of 2026-09-06 and
`commons.systems/disposition-graph/class-recommendation`'s test, which returns
ratified on two limbs and which the reading conceded and departed from. Both are
arguments about whether the class is the right one. Neither turns to what the
author had said in the same input about when a class acts at all, and that is
where the periagogic move goes: not to a new argument but to a commitment
already in the author's words, put against the position they were about to
underwrite. The second clause of `words/2026-09-08/11` separates recommending on
topology, which it grants without condition, from reconciling it, which it
allows only where the authority is confirmed or where bootstrap authority
carries the work. On that clause the delegation of 2026-09-06 is a class
conferred and not yet in force, and the sitting's own topology reconciliation
stood on the bootstrap grant throughout, which is what made it lawful with this
fact unanswered.

What the turn changed and what it did not. The recommendation does not move: the
author's words confer `delegated` and this fact is the only instrument for
recording that, which was true before the turn and is true after it. What moves
is what the reading claims. It no longer reads the two sayings as the same
thing said twice, and it no longer leaves a reader to infer that the sitting
acted on a delegation; it says which authority the work stood on. And it exposes
a question the previous reading buried, now carried as this node's first probe:
the conferring sentence names the grant of the prune and names the generality of
the topic, in a dependent clause, and the fact has since widened to carry the
reparent and the fold. Whether the grant reaches them is the author's to say.

What this entry does not claim. One paragraph and one probe are not the whole of
a periagogic movement, and the movement's own test is whether the grounding
could have defeated the position it was brought against. Here it did not: it
qualified the position and left the recommendation standing. That is a weaker
result than the movement is for, and it is recorded as the result rather than
dressed as a stronger one.
### The re-visit the refined grant obliged, 2026-09-08

The author refined the bootstrap grant later the same day, `words/2026-09-08/22`,
making its unit the sitting and obliging a sitting to re-visit alignment it has already
sequenced where newly reconciled disposition would change it. This node's authority
fact was the first thing that obligation reached, and the re-visit found one error and
one thing that got smaller.

The error. The probe raised on this fact earlier in the sitting said, of a general
delegation of graph topology, that "the record holds no other place where it was given,
so it exists only in that clause" of `words/2026-09-06/6`. That was false when it was
written. `words/2026-09-08/11` grants topology reconciliation directly and on its own
ground, that a topology move reconciles the graph and not the implementation layer, for
any node the author has not confirmed ratified; this node's own answer already carried
that sentence, in the option the answer fact recommends. The probe read the authority
fact and did not read the answer fact beside it. Its `why` and its `discharges` are
corrected in place rather than the probe withdrawn, because the question it asks is
still open: what class this fact carries is not settled by the author having granted
the act.

What got smaller. The probe's stakes. Before the correction it read as though a narrow
answer would leave the recorder without authority to reparent or to fold; it would not.
On either reading the recorder keeps what `words/2026-09-08/11` gives it, and what the
class decides is whether the author is asked again, not whether the work may be done.
That is a smaller question and the probe now says so.

What the refined grant changes about the sitting's own account. The entry above this
one said the sitting's topology work stood on the bootstrap grant rather than on the
delegation. That stands and is now better founded: under the refinement the grant is
given to the sitting and reaches every alignment in it, so the topology work, the
dialogue work and the grant work of 2026-09-08 all stand on one grant rather than on a
grant read as stretching to cover them.

### Frontier survey, 2026-09-09, of df96f052

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The binding answer quotes a definition the defining node no longer carries: "the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class", while that node now defines "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it". The interim this answer applies, and the weight it puts on the option `a-standing-direction-acts-by-right`, are both drawn against the superseded reach.
- The fact this node owns is named `topology` in the schema and "Existence" in three places a reader meets it: `dialogue` glosses the term `topology` with "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding." while its neighbouring glosses read "Keep is the choice on the topology fact..."; `how-a-fact-is-headed` reads "The three reserved facts are headed \"Authority\", \"Existence\" and \"Persistence\"."; and `unanswered` reads "the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape".

Strongest counter-argument (moderate): The answer's interim rests on a quotation of the grant that the defining node has since widened, and the fact it governs is called by two names in the places the author actually reads it. The first means the delegation's holding pattern was drawn against a narrower licence than the record now grants, and the second means the author ruling on a topology fact is ruling on a row headed "Existence". Neither is a disagreement about what the recorder may do; both are the drift that makes a ruling here mean something different to the party who gives it and the party who applies it.

The session's reply: Both findings kept. Finding[0] is confirmed against the record: this node's answer carries 'reaches one named reconciliation and no class' while the defining node now defines the grant as reaching a whole alignment sitting. The interim is therefore argued against a licence narrower than the one the record grants, and the argument must be re-made against the wider reach or withdrawn — under the wider reach it may be stronger, but it has not been made. Finding[1] is kept and is one half of the frontier's vocabulary finding; the consequence the counter-argument names is the one that matters, that an author ruling on a `topology` fact is ruling on a row headed 'Existence'.

### Frontier finding, 2026-09-09

Kind: cross-reference.

Two nodes quote `what-acts-during-bootstrap`'s definition of a grant in a form it no longer carries. That node defines "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant." `probe-or-node` quotes it inside quotation marks as "a grant is the author's word, given for one named reconciliation of one unanswered node" and restates it as "which reaches one named reconciliation and no class"; `graph-topology`'s binding answer reads "the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class". Both interims — `interim-follows-the-authors-word` and `topology-is-a-field-until-it-is-contested` — argue from the narrower reach, and both nodes carry `commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right` in `depends`.

Also named: commons.systems/disposition-graph/probe-or-node, commons.systems/disposition-graph/what-acts-during-bootstrap.

Proposed: The survivor is `what-acts-during-bootstrap`'s current definition. `probe-or-node` and `graph-topology` re-quote it as it now stands and re-make the argument against the wider reach: a grant that reaches a whole alignment sitting may or may not carry a standing direction about a class of act, and the case each node makes for its interim must be written against "one alignment sitting and reaching every alignment in it" rather than "one named reconciliation of one unanswered node". Where the wider reach makes the argument unnecessary, the interim is withdrawn rather than re-quoted. `what-acts-during-bootstrap` needs no change.

### Frontier finding, 2026-09-09

Kind: vocabulary.

The third reserved fact is named `topology` in the schema and "Existence" wherever a reader meets it. `dialogue`'s `defines` list carries "- term: topology" whose gloss reads "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding.", two entries above "Keep is the choice on the topology fact that the node stays in the record with its question and its answer." — so one gloss list names the same fact both ways. `how-a-fact-is-headed`'s answer reads "The three reserved facts are headed \"Authority\", \"Existence\" and \"Persistence\"." `unanswered`'s sentence, quoted on `which-facts-are-listed`, reads "the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape".

Also named: commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/how-a-fact-is-headed, commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/which-facts-are-listed.

Proposed: The survivor is `topology`, the name the schema, the frontier and this reading's own output all use. `dialogue`'s gloss for the term `topology` is rewritten to open with the term it glosses; `how-a-fact-is-headed`'s answer heads the fact "Topology", which is a change to what the author reads on the alignment page and so is put as its own answer text rather than as an implementation note; and `unanswered`'s sentence names the topology fact. `which-facts-are-listed` is named because it quotes `unanswered`'s sentence and its own option about the asymmetry moves with the wording; its answer needs no other change.

### Subtree divergence, 2026-09-09

Two unruled nodes rest their interims on one option pending on `what-acts-during-bootstrap`, which recommends another. `graph-topology`'s header reads "- Depends: commons.systems/disposition-graph/recording#prune-of-an-unruled-node-needs-no-ruling, commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right", and `probe-or-node`'s reads "- Depends: commons.systems/disposition-graph/graph-topology, commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right". Both answers make the dependence explicit: `graph-topology` says "a direction about a class acts by right only if that node's option `a-standing-direction-acts-by-right` is ruled, on which this interim rests", and `probe-or-node` says "the interim rests on the author's words and on nothing that node confers until the option is ruled". The ancestor recommends `reconciliation-acts-on-a-convergence`, not that option, so a ruling for the recommendation discards the ground both interims stand on — and both interims are what acts today, one of them a prune.

Stands under commons.systems/disposition-graph/what-acts-during-bootstrap, option `a-standing-direction-acts-by-right`.

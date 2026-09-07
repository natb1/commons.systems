---
question: What may the recorder do to the graph's topology without asking?
stage: maieutic
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
    recommends: delegation-with-two-bounds
    boldness: moderate
    against: "The delegation's only stated limit excludes nothing in the record as it stands: no option on any node carries a ruling, so `may not prune something that is ratified` names an empty set, and the second bound, that anything of the author's be transferred first, is checked by the same session that wants the file gone. What a ruling would confer is deletion, which `commons.systems/disposition-graph/class-recommendation` names irreversible, on the party that also decides which node is redundant, which is the shape `segregation-of-duties` names. And the scope is the AI's: the author's words name a general delegation of graph topology and grant pruning under it, so which acts besides the prune that phrase covers is read off this answer and not off anything they said."
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
  of: 14c7da6a681d2ed2b73919fcf7078ecd981de36e
  commit: 1c0b5372d26e0340f42179fe949bc8bbd389c677
  survey:
    date: 2026-09-07
    of: 14c7da6a681d2ed2b73919fcf7078ecd981de36e
    commit: 6611799a1dd6276691cf61f482c8e593f0234200
    text:
      question: "ddb1baebe2f7cda3481951e6e65da50f2a13c41c266478acb2793ec00ad9c685"
      answer: "a34fa142bfadb4320184594aa8977dd399e3a0414c200fc6c451cf7c0b949214"
      options: "bbee324c779119c5d1572a468e0798cff1694aecb5df40191fd4050792dad820"
      rivals: "443196964ab56f6176d1d29e6159b5a45f3fd92dccd9f0040d5d81186fcad18d"
      words: "5f5f0f6a043a3815faca5fa6163922b2b36d3b73ae1967c16cd34478aa79dad6"
    findings:
      - finding: "Independence, the sixteenth validation. `hexis` asks \"In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?\" — a question whose only possible answer is a reading of `purpose`'s answer, whose facts repeat `purpose`'s, and which would be pruned the moment `purpose`'s recommendation moved; `purpose` already carries the answer as the option `knowledge-store-first` sourced from `commons.systems/disposition-graph/hexis`, and `hexis` itself carries the review option `sub-ruling-of-purpose`. The record has also recommended it away: `graph-topology`'s option `a-third-bound-for-open-business` \"cites `hexis`, whose existence fact has recommended `prune` since 2026-09-04\". The brief carries no `under` field for neighbourhood nodes, so the parent relation is read from the question's own wording and from the cross-sourced option rather than from a field."
        kind: "decomposition"
        status: "new"
        since: "2026-09-07"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/graph-topology"
          - "commons.systems/disposition-graph/hexis"
          - "commons.systems/disposition-graph/purpose"
      - finding: "Four live options on `frontier-consistency`'s answer fact carry a validation list that ends at fifteen, while the node's account records the sixteenth as adopted into one of them: \"Adopted into `split-survey-from-per-draft` on 2026-09-05: the survey's list names the sixteenth\". The content fences of `split-survey-from-per-draft`, `the-survey-is-given-what-its-validations-read`, `one-line-only-where-a-survey-has-read-it` and `one-line-only-where-the-text-a-survey-read-still-stands` each end at \"15. Merge. The opportunities to merge unanswered nodes as alternate answers to the same question\", with no independence validation after it, and each is written in the struck term — \"the node as it stands or the alternative it names\" and \"it adopts a listed alternative or the node as it stands\". Ruling for any of the four would strike the independence validation and restore the word the recommended answer replaced, without saying it was doing either."
        kind: "cross-reference"
        status: "new"
        since: "2026-09-07"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/graph-topology"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/probe-or-node"
    pairs:
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "term:probe (defines: commons.systems/disposition-graph/author-questions)"
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
          - "term:doctrine (defines: commons.systems/disposition-graph/authority)"
          - "term:ratified (defines: commons.systems/disposition-graph/authority)"
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "term:capture-shaped (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:irreversible (defines: commons.systems/disposition-graph/class-recommendation)"
          - "parent:commons.systems/disposition-graph/authority"
          - "cites"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:alternative (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:confirmed (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:existence (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:prune (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "cites"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:frontier survey (defines: commons.systems/disposition-graph/frontier-consistency)"
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/hexis"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:instrument (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "words:words/2026-09-06/6"
          - "words:words/2026-09-07/17"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "term:ledger (defines: commons.systems/disposition-graph/quotes)"
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "term:substance (defines: commons.systems/disposition-graph/recording)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:rules (defines: commons.systems/disposition-graph/session-context)"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
      - with: "commons.systems/disposition-graph/turn-form"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:grant (defines: commons.systems/disposition-graph/viable-options)"
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "parent:commons.systems/disposition-graph/authority"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/which-facts-are-listed"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
      - with: "commons.systems/public/agency"
        keys:
          - "term:capture (defines: commons.systems/public/agency)"
depends:
  - commons.systems/disposition-graph/recording#prune-of-an-unruled-node-needs-no-ruling
  - commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right
form: rule
under:
  - commons.systems/disposition-graph/authority
---

## Facts

### answer

`delegation-with-two-bounds` is recommended, at moderate boldness. What is the
author's is the delegation itself, the two bounds, and the direction that a
persistent disposition takes a node of its own. What is the AI's is the reach of
the phrase "graph topology", which the author used as a thing already granted and
which no node of the record has ever stated; the rule that the delegation acts
from the ruling on this node's authority fact and not from the words alone; and
the departure from `commons.systems/disposition-graph/recording`, that a prune
taken under the delegation records no ruling before the deletion. The word
"presuppose", which this reason carried until 2026-09-07, is struck: it made the
AI's construction read as something the author's words supplied, and it
contradicted this fact's own `against` three lines above. Boldness is a property
of the whole recommended text and not of the clause whose provenance is best, and
three of that text's four paragraphs are the AI's, which is what moderate
records; the sitting reasoned the same way on
`commons.systems/disposition-graph/probe-or-node` the same morning. The rule
about the ruling is not a qualification of the author's grant but the record's
own machinery: `authority` holds that a node's class is read off the rulings on
its facts and that a class the AI writes for itself is not a grant, so the
author's words are what this node recommends and their ruling is what confers it.
The case against is on the fact, and this answer does not meet it: the bound
naming a ratified node excludes nothing in the record today, and the transfer
bound is self-checked.

This node and `commons.systems/disposition-graph/probe-or-node`'s option
`prune-delegated-with-two-bounds` are two homes for one delegation, and a ruling
here is the choice of this home. That node's `depends` names this one, so the
author meets this question first; a ruling for the option there would leave this
node's question answered by nothing, and its existence fact would move to
`prune`. What the author chooses between is two homes and not two delegations.

`every-prune-asked-at-the-row` and `a-third-bound-for-open-business` are the AI's
and are live. The first is the record as it stands and the narrowest reading of
what the author delegated; the second keeps the delegation and adds the bound the
author's two do not supply, which is the one the record's only queued prune would
need. `deprecation-rather-than-deletion` and `pruning-and-what-a-prune-needs` are
the clean-context reading's of 2026-09-07 and are live too: the first changes
what the delegated act is, so that it is reversible and
`commons.systems/disposition-graph/class-recommendation`'s irreversible limb no
longer fires; the second changes how far the scope reaches, delegating the prune
the author named and what a prune's remedy needs and no more. The rationale
argues against each, which is what the reading asked and what this answer
previously owed.

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

The first prune this delegation reaches is the one the independence test proposed on `commons.systems/disposition-graph/hexis`, whose existence fact has recommended `prune` since 2026-09-04 and which waits at its row. That is why the third option on this node's answer fact exists and why the author is shown it: the two bounds look at a node's history and neither reaches a node whose question is currently in front of the author.

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

The delegation acts from the ruling on this node's authority fact and not before, and that is not a formality. A class is read off a ruling recorded on a fact; a delegation written into the prose of an answer is a class the AI wrote for itself, which the `authority` node says is not a grant. So until this fact is ruled `delegated`, a prune is asked where the record asks it today, and taken where the author has already directed it: a prune of a node no ruling reaches that the author has directed in their own words is taken on that word, wherever it was given, as a standing direction of the author's about a class of act; the grant the what-acts-during-bootstrap node defines reaches one named reconciliation and no class, so a direction about a class acts by right only if that node's option `a-standing-direction-acts-by-right` is ruled, on which this interim rests and until which it is applied as the author's words of 2026-09-05 directed, which is the interim `commons.systems/disposition-graph/probe-or-node` now recommends; and where no such word has been given the node's existence fact moves to `prune` with the reason it was found, and the author rules it at that node's own row, which is what the alignment skill's independence clause and `packages/clean-context-review/brief-survey.md` instruct today, and what the sixteenth validation `commons.systems/disposition-graph/frontier-consistency` now recommends would instruct; those instructions stand unchanged until the ruling. What the ruling changes is one clause in each of them, and in the independence test's remedy on `commons.systems/disposition-graph/probe-or-node`, which cites this node rather than carrying the rule. It changes two other places that already read the delegation as conferred: `commons.systems/disposition-graph/which-facts-are-listed`, whose answer keeps a live existence radio off the alignment page on the ground that the author's disposition gives the prune of an unratified node to the AI, a ground that holds only from this ruling and is recorded there as the option `existence-radio-waits-on-the-delegations-ruling`; and `commons.systems/disposition-graph/dialogue`, whose account of 2026-09-06 names `probe-or-node` as the delegation's home, which this node now is.

Where a prune is taken under this delegation no ruling precedes the deletion, and that departs from `commons.systems/disposition-graph/recording`, whose answer requires that a ruling the node not exist be recorded before the node is deleted. The departure is recorded as an option on that node and is not adopted here in silence. What survives it is the reason that rule was given: the record keeps the reason a question was closed instead of losing it with the file, which the paragraph above requires whether a ruling was given or not.
```

#### every-prune-asked-at-the-row

The delegation covers minting a node and drawing its `under` edges, and stops
short of the prune: every deletion is asked at the node's own existence-fact row
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
short of the prune: every deletion is asked at the node's own existence-fact row
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
an existence fact already showing `prune` at a row the author has not yet reached.
The author's two bounds both look at a node's history — whether they ruled it,
whether their words are on it — and neither reaches a node whose question is
currently in front of them, which is where a delegated deletion does the most
damage: the author loses a decision they were about to make and never learns which
one. The case for it is the record's only instance, `commons.systems/disposition-graph/hexis`,
whose existence fact has recommended `prune` since 2026-09-04 and which waits at
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
an existence fact already showing `prune` at a row the author has not yet reached.
The author's two bounds both look at a node's history — whether they ruled it,
whether their words are on it — and neither reaches a node whose question is
currently in front of them, which is where a delegated deletion does the most
damage: the author loses a decision they were about to make and never learns which
one. The case for it is the record's only instance, `commons.systems/disposition-graph/hexis`,
whose existence fact has recommended `prune` since 2026-09-04 and which waits at
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

### authority

`delegated`, at low boldness. What a ruling of `delegated` records is that the
author has said they do not want to be asked again about this class of decision,
and that is exactly what the author said on 2026-09-06: "pruning authority is
granted to AI under general delegation of graph topology". The class is theirs to
confer and this fact is the only instrument the record has for conferring it, so
recommending anything else here would be recommending that the author's own words
not be recorded as what they are. Boldness is low because the recommendation rests
on those words and on nothing of the AI's.

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

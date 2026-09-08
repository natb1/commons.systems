---
question: What does a newcomer read after purpose?
stage: ruling
probes:
  - id: onboarding-walk-against-bite-order
    asks: >-
      Should the onboarding walk and the reconciliation bite order diverge, so
      that rank no longer serves both, or should the model node say where a
      newcomer acts first without changing rank at all?
    fact: answer
    why: >-
      the author's words behind this question ask for navigation and not rank —
      "Consider how an onboarding person will navigate from purpose, to graph
      concepts, to /align usage" — and neither attention's answer nor
      work-loop's rationale says whether one scalar was meant to carry both
      orders; the boost half of the recommendation was the AI's inference from
      words that point the other way.
    discharges: >-
      the boost half of `rewrite-model`, and with it whether projection or
      growth stands first among model's children; it moves the answer fact's
      recommendation.
    source: review
    raised: 2026-09-03
    status: discharged
    reason: >-
      the author's own high-level order, recorded on `scope` on 2026-09-03,
      answers it — self-documentation through the browser before alignment. The
      session's reply on this node records the discharge: "the high-level order
      recorded on the scope node on 2026-09-03 places self-documentation through
      the browser before alignment, so projection stays first among model's
      children and the boost half of the recommendation is withdrawn." The
      option `boost-growth-first-among-models-children` carries `status: passed`
      with that reason. Under the probe-or-node rule of 2026-09-04 this entry
      was not a probe: its first limb, whether the onboarding walk and the bite
      order diverge, is attention's question, which that node carries as the
      options `author-states-the-order` and `rank-orders-reconciliation-only`,
      and the discharge came from the record answering, which the admission
      test calls a withdrawal; attention enters this node's `depends`, and the
      second limb stays this node's own.
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: fd543d8b56a6a8724a9eaf03ac0f6ba8d7b3391f
  against: "The node's whole content is a decision about another node's prose, and the record now has three nodes deciding one page: second-stop on whether model is rewritten, model on the rewrite itself, and rejected on what a rationale carries of its alternatives. Keeping the option as a node buys the author a separate ruling; it costs a screen, an ordering the page does not show, and a text that must be reopened if the two rulings disagree. The redundancy finding's own second branch — fold each option into its parent's alternatives, which the new encoding makes structural — is the cheaper answer and is pending as `fold-into-model`."
  survey:
    date: 2026-09-07
    of: 0c5c0c4cc417ac0db7355195d22000bd76325e2c
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "12f2ea10e619192823d3e2ff6cb4e79ffeb23d7d0bfece82313f5397e5fca1d0"
      answer: "63f56065b0cb55c1d186010ea4a7c040a79d8064e742a6ea09c45c4abcd2bf22"
      options: "1ee159da1f6ed72c03712663a344576206cc4d18143f8f21bc001047e0e4ddb0"
      rivals: "0ea230a76bd45e0fdcce04edbdbeea51ca3e06d5f3bcea2b00e53a725290cd07"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
facts:
  - name: answer
    options:
      - name: rewrite-model
        source: ai
        ref: "2026-09-03"
      - name: primer-node
        source: ai
        ref: "2026-09-03"
      - name: boost-growth-first-among-models-children
        source: ai
        ref: "9e3a6624"
        status: passed
        reason: "the author's recorded order puts the browser before alignment and two other nodes' rationales rest on it"
    recommends: rewrite-model
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: moderate
under:
  - commons.systems/disposition-graph/model
depends:
  - commons.systems/disposition-graph/attention
---

## Facts

### answer

#### rewrite-model

The model node's answer is rewritten for the reader arriving from purpose, without changing rank: projection stays first among model's children, since the high-level order the author recorded on scope on 2026-09-03 puts self-documentation through the browser before alignment, and the model node may say that alignment is where the newcomer acts first. This is the recommended option as amended after the review, the boost half having been withdrawn; model's draft is the rewrite it names.

**AI support.** The author found the model node's answer too reference-shaped for the second thing a newcomer reads, which is a defect in the writing and not a missing node; a primer would restate the model node's answer in a second place, the drift this record resists everywhere else. Rewriting also costs no rank, so the onboarding walk and the reconciliation order stay one list and rank keeps serving both.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a newcomer read after purpose?
form: rule
under:
  - commons.systems/disposition-graph/model
---
## Answer

The model node. Its answer is written for the newcomer rather than for a reader looking something up: it introduces the primitives, the disposition, the graph and the node, well enough to use the alignment skill, and it may say that alignment is where the newcomer acts first. No rank changes with it: projection stays first among the model node's children, following the order the author recorded on the scope node on 2026-09-03, which places self-documentation through the browser before alignment. No node is inserted between purpose and model, so the second stop is the node that already answers the question, written for the reader who arrives at it.
```

#### primer-node

A new primer node sits between purpose and model, introducing the graph primitives, and model's answer is left as it stands. Model's draft rationale rejects this on the ground that such a node would answer no question model does not.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a newcomer read after purpose?
form: rule
under:
  - commons.systems/disposition-graph/model
---
## Answer

A new primer node sits between purpose and model, introducing the graph primitives, and model's answer is left as it stands. Model's draft rationale rejects this on the ground that such a node would answer no question model does not.
```

#### boost-growth-first-among-models-children

A boost puts growth first among the model node's children. It was withdrawn
because the author's own recorded order puts the browser before alignment, and
two other nodes' rationales rest on that order.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a newcomer read after purpose?
form: rule
under:
  - commons.systems/disposition-graph/model
---
## Answer

A boost puts growth first among the model node's children. It was withdrawn
because the author's own recorded order puts the browser before alignment, and
two other nodes' rationales rest on that order.
```

### existence

Prune: This node is pruned and its two options are carried on model as alternatives in model's own dialogue state, so the author rules once rather than on two screens with no ordering shown. The redundancy finding of 2026-09-03 offers this against keeping the option-node as the survivor of its question, and observes that confirming model's draft as shown decides this question by that act.

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified resolved since the last review: the node no longer carries a `review:` field, so the kickback verdict standing beside the review stage is gone, and the frontier shows the node at review with a recommendation and no review. The recorded override the previous reading objected to has been cleared by the re-encoding.
- Recommendation fence, Answer: 'projection stays first among the model node's children, following the order the author recorded on the scope node on 2026-09-03'. Verified against the frontier: projection carries boost 5 and growth 4, and scope's order field is enforced. The claim holds and is one of the few rank claims in the batch that does.
- The node decides what model's recommended text already is, so confirming model as shown decides this node by that act, and the alignment page offers both on one screen with no ordering shown. The `fold-into-model` alternative is the vehicle; the fence says nothing about the ordering.
- Recommendation fence, Rationale: 'the boost that would have put growth first among the model node's children, withdrawn because the author's own recorded order puts the browser before alignment'. This is accurate and is the record of a withdrawal; what it does not say is that the withdrawal was made after a review attested to the earlier text, which the review pin would have shown had the review not been removed.

On the three facts: The frontmatter recommendation (adopts rewrite-model, ratified, moderate) states one class and one value and the pin is current. Ratified for a choice about another node's prose is defensible only because the choice is the author's to make; the fence carries no quoted ruling and the node has no '## Disposition' section. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): The node's whole content is a decision about another node's prose, and the record now has three nodes deciding one page: second-stop on whether model is rewritten, model on the rewrite itself, and rejected on what a rationale carries of its alternatives. Keeping the option as a node buys the author a separate ruling; it costs a screen, an ordering the page does not show, and a text that must be reopened if the two rulings disagree. The redundancy finding's own second branch — fold each option into its parent's alternatives, which the new encoding makes structural — is the cheaper answer and is pending as `fold-into-model`.

The session's reply: Forward accepted. The withdrawal of the boost was made after the earlier review and the review was removed at the re-encoding for that reason; the fold-into-model alternative stays open.

### Frontier finding, 2026-09-03

Kind: placement.

Authority holds that 'a ratified stamp whose ruling is not in the record is invalid', and quotes rules on what that requires. Measured against the graph as it now stands: eleven recommendation fences in this batch carry `class: ratified`, and eight of them quote no ruling of any date anywhere in the fence — purpose, hexis, namespaces, projection, traditions-home, forms, second-stop and purpose-criteria — while three do: rationale-edge, quotes and rejected. Separately, twenty-three of the sixty-eight nodes carry no '## Disposition' section at all (`validate.mjs` reports 'ok: 68 nodes'; the count of nodes with no such section is 23), among them evaluation, persistence, legacy, validation-order, review, recording, forms, traditions-home, purpose-criteria, second-stop and all three public nodes. Quotes' own recommended answer unbars them in one clause — 'the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp' — so the whole question of whether eight fences and twenty-three nodes can carry a ratified stamp turns on a node that is itself unruled and in this batch. The counts recorded on the batch's own findings are stale against the graph: 'twenty-two of the sixty-two nodes' was measured when the graph held 62.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/forms, commons.systems/disposition-graph/purpose-criteria.

Proposed: Quotes is the survivor and is ruled first among the nodes of this batch, after the periagogic sitting on public/agency that every one of them descends from. Nothing in the eight fences need change before that ruling, because quotes' recommended answer sanctions them; what must not happen is that any of the eight is recorded with a ratified stamp before quotes is ruled, since under the losing option each such stamp is invalid on landing. Quotes' own facts should state the measured size of the bar at the moment of ruling rather than a count fixed in prose, since the count has already moved once.

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `fence-carries-the-ruling` (source review, 2026-09-03).

### The scope test, 2026-09-04

The delta sweep of 2026-09-04, run under `commons.systems/disposition-graph/author-questions` with the tests of `commons.systems/disposition-graph/probe-or-node`, found the discharged entry `onboarding-walk-against-bite-order` to have been a node's question in its first limb: whether one scalar carries a teaching order and a work order is `commons.systems/disposition-graph/attention`'s answer in terms, a response of "they diverge" moves that node's recommendation, falsifies a sentence of work-loop's rationale, and sets the boosts on model's children. The answer the discharge cites, the author's high-level order on scope, is the record answering and not the author answering the probe, which the admission test's first limb calls a withdrawal. No node is minted, because attention already carries the question as two options on its answer fact; the entry's reason is annotated and attention enters `depends`, this node's ruling waiting on which order rank serves. The node itself passes the ruling test: rewriting model for the newcomer, or inserting a primer, is a design choice the author can delegate, and the primer question survives any move of model's recommendation.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- All three answer options — `rewrite-model`, `primer-node`, `boost-growth-first-among-models-children` — are edits to other nodes: two to `model` and one to a boost that `attention` says only the author may ratify. `commons.systems/disposition-graph/rejected`'s answer says "An option is not a page: an answer that was not taken has no standing and earns no node of its own", and the same logic reaches a node all of whose answers are options on someone else's fact. The `existence` fact recommends `keep`, so this is a live disagreement with the independence test rather than a defect already conceded, and it is reported here rather than as a prune.

Strongest counter-argument (moderate): The question "What does a newcomer read after purpose?" has an answer already: `attention`'s rank order, and `scope`'s list, which together fix the reading order of the whole record. If those two are right, this node asks a question the record has answered twice; if they are wrong, this node is the wrong place to fix them, because its recommendation is to rewrite `model` rather than to move a boost or amend the scope list. Either way the recommendation is an edit to a sibling wearing a page, and the existence fact's `keep` is the part of the node with the weakest case.

### Frontier finding, 2026-09-05

Kind: decomposition.

The independence test of `commons.systems/disposition-graph/probe-or-node`, run across the judged set and reported under this kind as `frontier-consistency`'s sixteenth validation prescribes, finds two nodes and no more; readings are exempt by construction. `commons.systems/disposition-graph/hexis` asks "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?": its only possible answer is a reading of `purpose`'s, its answer options `hexis-first` and `knowledge-store-first` are the two orderings of one of purpose's sentences, `knowledge-store-first` already stands as an option on purpose's own answer fact sourced to this node, and it would be pruned the moment purpose's recommendation moved. `commons.systems/disposition-graph/audience` asks "Who is this repository for?": purpose's answer already carries "Its intended readers are humans who want that, and who may arrive here by way of an AI tasked with the same goal", this node's answer restates it, its answer fact carries the single option `standing`, and it too would fall with a move on purpose. Both nodes already recommend `prune` on their existence facts, so the test confirms a judgment the record has reached and supplies the reason it was missing. `commons.systems/disposition-graph/rejected`'s answer states the principle: "An option is not a page: an answer that was not taken has no standing and earns no node of its own." A third node was tested and survives: `commons.systems/disposition-graph/second-stop`'s three answer options are all edits to `model`, which has the same shape, but its question — what a newcomer reads after purpose — is not a reading of `model`'s question, and its existence fact recommends `keep`, so it is reported in its own node entry and not here. `commons.systems/disposition-graph/which-facts-are-listed` was tested and survives on its own account, which reaches `dialogue`'s reserved-four rule and not only the parent's rendering.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/audience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/rejected.

Proposed: Record the independence test as the reason on each existence fact's `prune` option, on `hexis` and on `audience`, and let the author rule the prune at each node's own row, which is what `probe-or-node`'s answer prescribes for a node already standing. Before `audience` is pruned, its surviving content is named: the sentence itself is already in `purpose`, and the enumeration of onboarding surfaces — README, browser opening pages, repository description, discovery tags — belongs to `projection` or `self-documentation` and moves there rather than being deleted with the node. `hexis` needs no survivor: `purpose` already carries its content as the option `knowledge-store-first`.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/second-stop stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `rewrite-model`. The record wrote no text of its own for `primer-node`, `boost-growth-first-among-models-children`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `fd543d8b56a6a8724a9eaf03ac0f6ba8d7b3391f` was already past the recommendation and is left as it stood. The survey's pin `7dc2a99d03a687e47b5fa8617a855a5895f64da3` is re-computed for the encoding as `0c5c0c4cc417ac0db7355195d22000bd76325e2c`; nothing it read changed.

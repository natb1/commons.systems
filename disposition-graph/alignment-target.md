---
question: What does the alignment session take up when given nothing?
stage: maieutic
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 1c5395eea68a14452e88040c5894830533188fdf
  against: "Taking the highest-ranked unanswered node is right if rank is the author's attention, and it is not: every boost in the record is the AI's and unratified, as attention's own answer now says, and the one order the author did state covers six nodes out of sixty-two. So 'rank answers it without the session's judgment entering' describes a queue the AI itself ordered and presents an AI choice to the author as the record's own. The session's reply — that the page shows the author the whole queue at every visit — is a real answer and is now true of the built page, which weakens but does not dissolve the objection."
  survey:
    date: 2026-09-09
    of: 70f99190034a5a1cd6d1a676ead8080640ded99f
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "4d5ccbde44217aa1c1bc48dca64a34e5c23393212c0168184b0e7a88fa876655"
      answer: "8628a5488a8d27bd11962ad6c16f35941daa871efefdc56a84a499efa8bf73a9"
      options: "be4b855abafdcb8db2019795013d7af60ef45f54f4b3a0ab0e6640cb2ebad8f7"
      rivals: "ed8036a309c08bef12b0adb8f3aec4a4cfc8291d996ec84ac11b097dc02a4109"
      words: "447befcf21008c4c2e2e2c1bbc0290b04afd0f49a7e750dbd2fde86b40edb9a7"
    findings: []
    pairs:
      - with: "commons.systems/disposition-graph/alignment-order"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/attention"
        keys:
          - "term:boost (defines: commons.systems/disposition-graph/attention)"
          - "term:onboarding path (defines: commons.systems/disposition-graph/attention)"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/checkpoint"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "words:words/2026-09-08/36"
          - "cites"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/expert-identity"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/expert-instructions"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/fidelity"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "cites"
      - with: "commons.systems/disposition-graph/movements"
        keys:
          - "words:words/2026-09-08/36"
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/plato-elenchus"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/plato-maieutics"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/plato-periagoge"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/probe-response-treatment"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/purpose"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
          - "cites"
      - with: "commons.systems/disposition-graph/round-termination"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/session-state"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/standard-report"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/turn-form"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
          - "cites"
      - with: "commons.systems/disposition-graph/unreached-traditions"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/what-an-option-row-carries"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/public/agency"
        keys:
          - "cites"
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: mid-sitting-input-is-sequenced-not-substituted
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/3
          - words/2026-09-08/18
          - words/2026-09-08/36
      - name: ruling-order-not-rank
        source: author
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/23
      - name: onboarding-walk-from-purpose
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it presumed a record with nothing unanswered to take up"
      - name: choose-by-the-oldest-stage
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it substitutes a heuristic for the rank the record already carries"
      - name: choose-by-the-fewest-movements-owed
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it substitutes a heuristic for the rank the record already carries"
      - name: ask-the-author-which-node
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the author's answer would be a boost, which they can set without being asked"
    recommends: mid-sitting-input-is-sequenced-not-substituted
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Facts

### answer

`mid-sitting-input-is-sequenced-not-substituted` is recommended since 2026-09-08: it is `standing`, whose text has held since the bootstrap, with the boost clause refined so that an alignment input the author gives while a sitting is running is sequenced into that sitting by dependency rather than substituted for the node in hand. The author's words of 2026-09-08 moved it, and the recommendation moved on their words rather than on the AI's judgment of them; what remains the AI's is the reading that puts the clause on this node instead of on a node of its own. Boldness moderate. The case against is that this node's question asks what the session takes up when given nothing, so the clause answers a case the question excludes, and that a dependency between dispositions not yet drafted is a judgment nothing in the record checks, which leaves a session free to abandon its node and call the new input a prerequisite.

#### standing

The highest-ranked unanswered disposition, and it progresses that one node through the movements still owed on it, from the stage it carries, up to the author's confirmation.

**AI support.** The author's ruling of 2026-09-03, quoted above. Rank is the order of the author's attention, and the unanswered nodes are the queue of the dialogue; a session given nothing has one question to answer, which item of that queue comes first, and rank answers it without the session's judgment entering. Progressing from the stage rather than from the beginning is what the stored stage is for: it exists, the transience node says, so that what the dialogue has done survives the session that did it. Up to confirmation and not beyond: the confirmation is the author's act, and the session's work on a node ends when it has put the node before the author with everything the ruling needs, the draft, the three facts, and the review's counter-argument; where the author is in the interview, the session asks for the ruling there, and where the author rules on the page, the session reads the ruling back at its next sitting.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

The highest-ranked unanswered disposition, and it progresses that one node through the movements still owed on it, from the stage it carries, up to the author's confirmation. Given no disposition and no node id, the session reads the frontier and takes the first unanswered node in rank order, this project's graph, read from the frontier by its id prefix, before the public graph, and so the purpose node first while it is unanswered, and runs the sitting from that node's stage: the periagogic stage when the author's account is not yet in the record, the maieutic stage when the answer is not yet drafted, the clean-context review when the draft has not had it, and then the ruling, put to the author in the interview by the question mechanics of the growth node and on the alignment page. A confirmation is recorded as the recording node describes, and a denial resumes the dialogue at the movement it calls for. A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it; the bootstrap's drafts stand at the review stage by the author's ruling of 2026-09-03 on the unanswered node, which set their stage. The author's choice of a different node is a boost, and the session takes the node the author names instead. One node at a time: when the node is recorded, or the author leaves it, the next highest unanswered node is the next sitting.
```

#### mid-sitting-input-is-sequenced-not-substituted

`standing` with the boost clause refined: an alignment input given while a
sitting is running does not necessarily displace the node in hand, and the
session sequences the two by the dependencies between the dispositions they
imply, running both in the one sitting. Raised from the author's words of
2026-09-08, given mid-sitting beside two refinements to the quotes node.

**AI support.** The standing answer's only rule for an input arriving
mid-sitting is the boost, and the boost substitutes: the session takes the node
the author names instead. Substitution is wrong twice. It abandons the node in
hand at whatever movement it had reached, and the reason the record stores a
stage at all, as the transience node says, is that what the dialogue has done
should survive; a sitting that drops its node mid-movement makes the stage lie
about where the dialogue is. And it treats the new input as independent of the
running work, when the ordinary reason an input arrives mid-dialogue is that
the dialogue provoked it: the author's words of 2026-09-08 came out of a sitting
that had just admitted an entry to the ledger the author did not think belonged
there. The refinement puts the dependency where the substitution was. A session
reads what dispositions the input implies, asks which way each depends on the
node in hand, and runs them in that order, so the sitting's sequence is derived
from the record rather than from the order the author happened to speak in. The
sitting is the unit that holds them, which is what makes this a refinement of
this node and not of the frontier's rank: rank orders sittings, and this orders
the nodes inside one.

**AI divergence.** The clause asks a session to compute a dependency between
dispositions not yet drafted, which is a judgment nothing in the record checks,
and a session that wants to abandon its node can call the new input a
prerequisite and be within the rule. The frontier's rank is mechanical and this
is not, so the record gains an ordering it cannot audit. "Not necessarily" is
the softest form the rule could take and says when substitution is wrong without
saying when it is right. And the node's question is what the session takes up
when given nothing, so the clause answers a case the question excludes; the
alternative the author may prefer is a node of its own beneath this one, asking
what a running sitting does with what it is given, which would carry the clause
with its own facts and its own authority rather than as a rider on this answer.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

The highest-ranked unanswered disposition, and it progresses that one node through the movements still owed on it, from the stage it carries, up to the author's confirmation. Given no disposition and no node id, the session reads the frontier and takes the first unanswered node in rank order, this project's graph, read from the frontier by its id prefix, before the public graph, and so the purpose node first while it is unanswered, and runs the sitting from that node's stage: the periagogic stage when the author's account is not yet in the record, the maieutic stage when the answer is not yet drafted, the clean-context review when the draft has not had it, and then the ruling, put to the author in the interview by the question mechanics of the growth node and on the alignment page. A confirmation is recorded as the recording node describes, and a denial resumes the dialogue at the movement it calls for. A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it; the bootstrap's drafts stand at the review stage by the author's ruling of 2026-09-03 on the unanswered node, which set their stage. The author's choice of a different node is a boost, and a boost given before the sitting starts is the node the session takes. An alignment input given while a sitting is running does not necessarily displace the node in hand: the session reads which dispositions the input implies, evaluates their dependencies against the node it is on, and sequences them within the same sitting, so that a disposition the running work depends on is taken before it and one that depends on the running work after it. What the session never does is hold the input over for a later sitting; it belongs to this one. One node at a time still holds, and the sequence is the order the sitting runs them in: when the last of them is recorded, or the author leaves them, the next highest unanswered node is the next sitting.
```

#### ruling-order-not-rank

The alignment-order draft answers that a session given nothing takes the first node of the ruling order, derived from the tangle the record carries, and not the highest-ranked unanswered node; rank breaks ties only. The author's words there: rank was "the only order the record had to hand" when this node was ruled, and every statement applying it to alignment is reconsidered, since the alignment frontier has no confirmed authority and a greedy rank order is not necessarily optimal for untangling it. The alternative amends this answer's first sentence and its rejected heuristics, whose rejection rested on rank already being the order. It amends the clause "this project's graph before the public graph" as well: the ruling order is one order over the whole alignment frontier, the manifest's graphs together, since the dependencies cross them and the public graph carries the root that this project's graph hangs under, so a graph precedence would put a descendant's ruling before its ancestor's. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

The alignment-order draft answers that a session given nothing takes the first node of the ruling order, derived from the tangle the record carries, and not the highest-ranked unanswered node; rank breaks ties only. The author's words there: rank was "the only order the record had to hand" when this node was ruled, and every statement applying it to alignment is reconsidered, since the alignment frontier has no confirmed authority and a greedy rank order is not necessarily optimal for untangling it. The alternative amends this answer's first sentence and its rejected heuristics, whose rejection rested on rank already being the order. It amends the clause "this project's graph before the public graph" as well: the ruling order is one order over the whole alignment frontier, the manifest's graphs together, since the dependencies cross them and the public graph carries the root that this project's graph hangs under, so a graph precedence would put a descendant's ruling before its ancestor's. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.
```

#### onboarding-walk-from-purpose

A session given nothing walks the onboarding path from the purpose node to a
question in the author's words. It was passed over because it presumed a
record with nothing unanswered to take up; while any node is unanswered, the
first unanswered node is that walk.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

A session given nothing walks the onboarding path from the purpose node to a
question in the author's words. It was passed over because it presumed a
record with nothing unanswered to take up; while any node is unanswered, the
first unanswered node is that walk.
```

#### choose-by-the-oldest-stage

The session takes the unanswered node whose stage is oldest. It was passed
over because it substitutes a heuristic for the rank the record already
carries.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

The session takes the unanswered node whose stage is oldest. It was passed
over because it substitutes a heuristic for the rank the record already
carries.
```

#### choose-by-the-fewest-movements-owed

The session takes the unanswered node owing the fewest movements of the
dialogue. It was passed over for the same reason as the oldest stage: it
substitutes a heuristic for the rank the record already carries.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

The session takes the unanswered node owing the fewest movements of the
dialogue. It was passed over for the same reason as the oldest stage: it
substitutes a heuristic for the rank the record already carries.
```

#### ask-the-author-which-node

The session asks the author which node to take up. It was passed over because
the author's answer would be a boost, which they can set without being asked.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the alignment session take up when given nothing?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

The session asks the author which node to take up. It was passed over because
the author's answer would be a boost, which they can set without being asked.
```

## Account

### Manifest

- Folded: Recording of 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: 'the session reads the frontier and takes the first unanswered node in rank order, this project's graph, read from the frontier by its id prefix, before the public graph'. Verified: the frontier is a single rank order across both graphs and its first entry is commons.systems/public/agency at rank 1.0000; the amendment's 'by its id prefix' now makes the instruction executable, which resolves the previous review's sharpest finding. The alignment page independently groups by graph in the manifest's order (orderAlignmentItems), so page and frontier now agree on purpose first.
- Answer: 'while it is unanswered'. Verified now derivable: deriveStatus returns 'unanswered' and the frontier prints it. The previous review's finding is stale and should be corrected.
- Answer: 'A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it', qualified by 'the bootstrap's drafts stand at the review stage by the author's ruling of 2026-09-03'. That covers the sixteen reclassified nodes; it does not cover public/agency, whose review kicked it back to periagogic and whose periagogic movement has never been run. A session trusting the stage there would be right, which is the point — but nothing distinguishes a stage reached by a movement from a stage set by reclassification.
- The node is the first thing a no-argument session does, and it points that session at public/agency, whose parent-of-everything status and periagogic stage make it the correct but most expensive first sitting. The Proposal should say so.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value, and the prose Facts line ('boldness low on the usage and moderate on the reading of up to confirmation and on the order of the two graphs') is the best-formed in the batch. The two-graph order it presented as unimplemented is now implemented, so the facts should be updated rather than left as a caveat.

Strongest counter-argument (moderate): Taking the highest-ranked unanswered node is right if rank is the author's attention, and it is not: every boost in the record is the AI's and unratified, as attention's own answer now says, and the one order the author did state covers six nodes out of sixty-two. So 'rank answers it without the session's judgment entering' describes a queue the AI itself ordered and presents an AI choice to the author as the record's own. The session's reply — that the page shows the author the whole queue at every visit — is a real answer and is now true of the built page, which weakens but does not dissolve the objection.

The session's reply: Validated: the frontier's first entry is agency, the page groups by graph with purpose first, and the status is derived. A stage set by the author's reclassification is trusted as one reached by a movement, which the answer says. The first no-argument sitting is agency's periagogic movement, the most expensive first sitting and the right one. On the counter-argument, that rank is the AI's boosts: the page shows the author the whole queue at every visit, and every boost is presented as unratified. Stage ruling.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: Called with no disposition and no node id, `/align` chooses the highest-ranking unanswered disposition and progresses it through the movements its state still owes, up to confirmation.
The census unit's note: Nothing is pending. The node stands at the ruling stage with a forward verdict, an answer and no draft, so the recommendation adopts the standing text. Both reviews' findings were accepted and applied in the answer — the id-prefix reading of the frontier, the striking of 'or an argument', the sentence on the stage set by the author's reclassification — and the remaining points are account corrections or observations. The two rejected alternatives, choosing by the oldest stage or the fewest movements owed and asking the author which node to take, are recorded in the rationale and excluded. I checked whether `alignment-order` duplicates this node's question and it does not: that node asks whether rank is the right order at all and its own account distinguishes the two, so no fold is proposed, though a ruling there could later amend this answer.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The answer says "A movement already behind the node is not repeated: the stage is the record of what the dialogue has done, and the session trusts it." At this commit thirty of the forty-four nodes at the ruling stage carry a review the projector marks "changed since its review", and the projector reports "Ready to rule: 0 of 44". A session that trusts the stage on those thirty would take up a ruling the record's own instrument says is not ready. Recorded as the `stale-recommendation` finding; the locus here is the trust clause, which is the sentence that turns the stale state into wrong action.

Strongest counter-argument (strong): The answer instructs a session to trust the stage, and the stage is currently wrong on two thirds of the ruling-stage record by the projector's own reckoning. The rule that would keep it honest — that a recommendation moved at the ruling stage returns the node to review — lives on `evaluation` and is not applied, and this node's answer supplies the reason it is not: the stage is the record of what the dialogue has done and is trusted, so nothing in a sitting's ordinary path re-reads it. Trusting a derived-but-stored field, in a record whose model claims such things are never stored, is where that claim is actually paid for.

The session's reply: Taken; this is the clause that turns a stale field into a wrong movement, and the survey is right to locate the defect here rather than only on `evaluation`. The session records the qualification as owed — a session checks the pin before trusting the stage — and does not write it, because the sentence is in the text the survey read. On the deeper point the counter-argument is correct and uncomfortable: `stage` is a derived-but-stored field in a record whose model says such things are never stored, and every stale-pin defect this survey found is that storage being paid for.

### Frontier finding, 2026-09-07

Kind: contradiction.

growth's recommended text orders the same frontier two ways. Its third usage reads "given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says", while its queue sentence in the same paragraph reads "the queue of un-aligned dispositions is therefore the set of such nodes, taken in the ruling order as the alignment-order node says and surviving every session, and the author's naming of a node is their order and needs no boost"; and the rationale of the same fence still opens "The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost." alignment-order, which growth names in depends, recommends "`/align` with nothing takes the first node of the ruling order; `/align <node id>` is the author's order and needs no boost." growth's own option `queue-in-ruling-order` was passed over on 2026-09-07 as "absorbed by the recommendation, whose queue sentence takes `alignment-order`'s ruling order and drops the boost", so the absorption reached one sentence of three.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/alignment-order.

Proposed: growth is the node whose text must change: the third usage and the rationale sentence are brought into line with the queue sentence and with alignment-order's recommended answer, so that one order governs the whole fence. alignment-order survives as the owner of the order and is cited rather than contradicted; alignment-target already carries the matching option `ruling-order-not-rank`, sourced to the author, and needs no change from this finding.

Recorded as an option on commons.systems/disposition-graph/growth's answer fact: `third-usage-in-the-ruling-order` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/alignment-target stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-03/23, referenced by 1 option the entry's own date names; and `stands` left the answer fact. The record wrote no text of its own for `ruling-order-not-rank`, `onboarding-walk-from-purpose`, `choose-by-the-oldest-stage`, `choose-by-the-fewest-movements-owed`, `ask-the-author-which-node`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `1c5395eea68a14452e88040c5894830533188fdf` was already past the recommendation and is left as it stood. The survey's pin `b0dea316130efe6397be144452cb593680b1d073` is re-computed for the encoding as `6326d8f230a4f6f6021c71dddfc0d6f6eebbbf22`; nothing it read changed.

### Frontier finding, 2026-09-07

Kind: contradiction.

alignment-target's standing answer: 'Given no disposition and no node id, the session reads the frontier and takes the first unanswered node in rank order, this project\'s graph, read from the frontier by its id prefix, before the public graph, and so the purpose node first while it is unanswered'. alignment-order's standing answer: 'The ruling order, derived from the tangle the record carries, and not rank.' alignment-target carries '`ruling-order-not-rank` — source author' and does not recommend it.

Also named: commons.systems/disposition-graph/alignment-order.

Proposed: alignment-order survives; alignment-target's recommendation moves to its existing author-sourced option `ruling-order-not-rank`, and the sentence naming the purpose node first is re-derived from the ruling order or struck.
### An input given mid-sitting, 2026-09-08

The author gave two refinements to `commons.systems/disposition-graph/quotes`
in the middle of a sitting running on this graph's own topology and dialogue,
and said with them how a sitting is to take such an input: not necessarily
superseding the dialogue in hand, but sequenced into it by the dependencies
between the dispositions implied, `words/2026-09-08/18`. The standing answer's
only rule for that case was the boost, which substitutes. Recorded as
`mid-sitting-input-is-sequenced-not-substituted`, the standing answer with the
boost clause refined, and the recommendation moved to it on the author's words.
The node's question asks what the session takes up when given nothing, and this
clause governs the case where it is given something, so whether the clause
belongs here or on a node of its own is the placement question the option's
divergence raises and the author's to settle. The review block of 2026-09-03 and
the survey pin of 2026-09-07 are stale against this move, and the frontier is
where that is read.
### The serialization question reaches its option, 2026-09-08

The author opened the sitting by asking whether its concerns are resolved
simultaneously or in some order, naming the circularity that makes the question
hard: good alignment dialogue is needed to describe the authority and the
tooling, and the authority and the tooling are what the dialogue runs on,
`words/2026-09-08/3`. The sitting recommended a serialization and the author
accepted it. The entry now reaches the option that carries the rule the two
exchanges produced, which is not the acceptance of one order but the standing
one: what a sitting does with an input it is given while running. One quotation
reaching an option it was not filed against is what
`commons.systems/disposition-graph/quotes` now describes.

### A third word for the same option, 2026-09-08

`words/2026-09-08/36` states the shape of alignment dialogue orchestration in seven
steps, and step 3 has an input's arrival re-evaluate the sitting's sequencing rather
than displace what the sitting is on. That is
`mid-sitting-input-is-sequenced-not-substituted` said a third time, from a third angle:
the words of `words/2026-09-08/3` and `words/2026-09-08/18` state the rule, and this
entry states the mechanism by which the rule is carried out, which is re-evaluation at
the point of arrival.

Recorded as a `supports` reference and nothing more. The entry adds no option here and
moves no recommendation; what it adds is weight, and weight is what a `supports` list
holds. The one thing it does sharpen is what "sequenced" costs: an input that
re-evaluates the sequencing may re-order work the sitting has already done, which is
the obligation `words/2026-09-08/22` puts on a sitting under a grant, so this node's
answer and that refinement are two halves of one rule and a reader of either should see
the other.

### Frontier survey, 2026-09-09, of 70f99190

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (weak): Nothing has read what this node now recommends. Its header records "draft review: forward (moderate, 2026-09-03, of 1c5395eea68a14452e88040c5894830533188fdf) — STALE" and "survey: surveyed 2026-09-07, of 7d6e8569bbe3275ad2c5728cbbe921834b7ad3a0 — STALE", so both readings answer a recommendation the node no longer carries, and the answer that would decide what a sitting takes up when given nothing has never been checked in the form it now stands. The frontier's argument is against ruling it before either reading is re-run, not against its content.

The session's reply: Kept, and it is a finding about the record's own bookkeeping rather than about the answer. Both readings on this node are stale against a recommendation it no longer carries, so nothing has read what it now says. The frontier's argument is against ruling it before either reading is re-run, and this sitting takes that: the node is not brought to the author until a reading answers the text that stands.

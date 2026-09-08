---
question: What is a node?
stage: maieutic
review:
  verdict: kickback
  strength: strong
  date: 2026-09-03
  of: 50b9ea4f40a07e8facf86b081e6183c2381cce21
  against: "The four-form model rests on a merge whose carrier does not exist: no criterion in the graph says whether its answer is to be achieved or maintained, no field holds it, and instruments' draft sentence that would have introduced it is withdrawn. Instruments' current text uses the distinction operationally — 'A target's failing check is work. A rule's failing check is a variance that gates the work that broke it' — which is how the frontier decides what to do with a failure, and almost every node is unguarded, so under the merge an unguarded node's failure would have no class at all. Ratifying this draft bakes the merge into the schema definition after the record has already decided against it."
  survey:
    date: 2026-09-07
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "2ea5499ddd085088e665e15b342081b9e4148e9838b65c78d813322d98db202d"
      answer: "6ce6fe02c674d2bf6ccab0b6d1175203120ddf86c99329da43d36af60f5cdb5d"
      options: "27086639e5025de9b75b7b2c82e775dec15015ed073bfab48ea187d74a1d2c75"
      rivals: "cb068173ccbe4d7df53355e2dfee6d48bfa4b4595aaa956a6f808de866e9b5ac"
      words: "7aedaea0cb8f5b1fa93aeb4e24a7752903a6bce34d90ebe043da922b262f0e83"
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
      - name: four-form-draft
        source: ai
        ref: "2026-09-03"
        supports:
          - words/2026-09-02/7
          - words/2026-09-02/15
          - words/2026-09-02/16
          - words/2026-09-02/17
          - words/2026-09-02/18
      - name: five-forms-restored
        source: review
        ref: "2026-09-03"
      - name: un-aligned-disposition-not-open-question
        source: review
        ref: "2026-09-03"
      - name: absorb-form-vocabulary
        source: review
        ref: "2026-09-03"
      - name: rationale-argues-facts-list
        source: commons.systems/disposition-graph/prose-and-structure
        ref: "2026-09-04"
      - name: node-as-a-topic
        source: ai
        ref: "1920badc"
        status: passed
        reason: "it mixes authority in one text"
      - name: node-as-a-cluster-around-a-default-scope
        source: ai
        ref: "1920badc"
        status: passed
        reason: "no reason recorded in the rationale"
      - name: history-kept-inside-the-node
        source: ai
        ref: "1920badc"
        status: passed
        reason: "no reason recorded in the rationale"
      - name: proposal-as-a-state-of-a-ratified-node
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"
      - name: answer-gloss-released-to-dialogue
        source: review
        ref: "2026-09-07"

      - name: a-node-file-is-facts-and-account
        source: review
        ref: "2026-09-07"
      - name: a-node-is-classed-by-the-rulings-on-its-facts
        source: review
        ref: "2026-09-07"
    recommends: four-form-draft
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
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Facts

### answer

#### standing

One question and its standing answer.

**AI support.** One question per node makes "same scope" decidable: two texts share a node only if one replaced the other. Traditions to record as readings: issues as questions (Kunz and Rittel, IBIS, 1970); the answer as an accumulated restatement (the common-law restatement); store once and derive the rest (Codd). An archē is held, never derived, so nothing ranks above one: Metaphysics V.1 on the senses of archē, Posterior Analytics I.3 on the regress of demonstration, Nicomachean Ethics I.4 on beginning from what is known to us, each owed as a reading.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

One question and its standing answer. The question is one line someone could ask the author. The answer is the current position in one of five forms, a target (something that should become true), a rule (something that must stay true while working), an assumption (something about the world the answer relies on), an archē (a first principle held, never derived), or a reading (what a tradition says about the answer above it). The rationale says why, and which alternatives were rejected. While a dialogue is open on it a node also carries the dialogue state, the alternatives pending the author's ruling, each with its source, and the recommendation among them, as the dialogue node says; a stamped node keeps its authority while they are pending. A node with a question and no answer is an un-aligned disposition, the author's stated disposition or the AI's draft on which the alignment dialogue has not concluded; it carries the author's words, the AI's account, and the stage of the dialogue, as the transience node says. It is a node like any other and may be refined by children; what it lacks is authority, not standing. If a text answers two questions, it is two nodes. If a new answer replaces an old one, the node holds the new answer and version control holds the old.
```

#### four-form-draft

The Draft this node carries collapses the five forms to four: target and rule merge as disposition, with achieve or maintain carried by the criteria; archē and reading stay; tradition is added as a form. It also replaces the un-aligned-disposition sentence with a stamp rule, that every node carries a stamp or is an open question, and moves assumption out of the forms into a criterion kind. Its frontmatter uses a criteria key the schema does not have and drops instrument from defines while the node still carries an instrument block, so it could not land as written.

**AI support.** One question per node makes "same scope" decidable: two texts share a node only if one replaced the other. Target and rule were one form seen from two sides, achieve and maintain, which the goal-oriented requirements tradition carries on the goal's criterion rather than on its kind; assumption began as instrumentation, the condition under which an answer stays valid, and is recorded where it is checked.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
criteria:
  - kind: check
    ref: packages/disposition/validate.mjs on the implementation ref
    note: every file parses as one question, at most one answer, a stamp or none, and only defined fields
---
## Answer

One question and its standing answer. The question is one line someone could ask the author. The answer is the current position in one of four forms: a disposition, something that should become or stay true, where whether it is to be achieved or maintained is carried by its criteria; an archē, a first principle held and never derived; a reading, what a tradition says about the answer above it; or a tradition, the root of a mounted body of thought or work. The rationale says why, and which alternatives were rejected and for what reason; the page projects those alternatives beside the stamp. Every node carries a stamp, or it is an open question awaiting its answer; an alternative pending on a stamped node is dialogue state beside its answer, never a class of node, and a proposal is the alternative that arose outside alignment, as the authority node defines it. An assumption is not a form but a criterion: this answer holds so long as the assumption does. If a text answers two questions, it is two nodes. If a new answer replaces an old one, the node holds the new answer and version control holds the old.
```

#### five-forms-restored

The second review kicked the node back and the contradiction finding, which makes forms the survivor, proposes the recommended text revert to five forms and its summary be rewritten, since it still states the four-form merge and the assumption-is-a-criterion clause that forms' own reply withdrew, and no criterion in the record carries the achieve-or-maintain marker the merge rested on. It also restores the sentence that a node with a question and no answer is an un-aligned disposition, which is the schema node's only statement of the term the validator's message quotes, and leaves whether a tradition carries a form of its own to traditions-home. Node's reply accepts all of this and defers the redraft to the sitting, so it is owed and the text still carries the merge. Raised on commons.systems/disposition-graph/instruments.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

The second review kicked the node back and the contradiction finding, which makes forms the survivor, proposes the recommended text revert to five forms and its summary be rewritten, since it still states the four-form merge and the assumption-is-a-criterion clause that forms' own reply withdrew, and no criterion in the record carries the achieve-or-maintain marker the merge rested on. It also restores the sentence that a node with a question and no answer is an un-aligned disposition, which is the schema node's only statement of the term the validator's message quotes, and leaves whether a tradition carries a form of its own to traditions-home. Node's reply accepts all of this and defers the redraft to the sitting, so it is owed and the text still carries the merge. Raised on commons.systems/disposition-graph/instruments.
```

#### un-aligned-disposition-not-open-question

The vocabulary finding holds that transience is the survivor of the term: un-aligned disposition is defined there and open question is defined by no node while fifteen use it. Node's recommended text still says 'Every node carries a stamp, or it is an open question awaiting its answer', and node's own statement of the rule was struck. The finding proposes node take the defined term instead, restoring 'a node with a question and no answer is an un-aligned disposition', which is the sentence the validator's message quotes. Raised on commons.systems/disposition-graph/transience, commons.systems/disposition-graph/growth.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

The vocabulary finding holds that transience is the survivor of the term: un-aligned disposition is defined there and open question is defined by no node while fifteen use it. Node's recommended text still says 'Every node carries a stamp, or it is an open question awaiting its answer', and node's own statement of the rule was struck. The finding proposes node take the defined term instead, restoring 'a node with a question and no answer is an un-aligned disposition', which is the sentence the validator's message quotes. Raised on commons.systems/disposition-graph/transience, commons.systems/disposition-graph/growth.
```

#### absorb-form-vocabulary

The redundancy finding makes projection and readings the survivors of the linking rules and proposes that this node be folded into node's rationale as a rejected alternative and pruned. Node already carries the author's quotation verbatim, so the fold costs no words; what it adds to node is the recorded rejection of one node per form, on the ground that each such node would restate the definition its owning node already carries. (Raised on commons.systems/disposition-graph/form-vocabulary.) Also raised on commons.systems/disposition-graph/projection.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

The redundancy finding makes projection and readings the survivors of the linking rules and proposes that this node be folded into node's rationale as a rejected alternative and pruned. Node already carries the author's quotation verbatim, so the fold costs no words; what it adds to node is the recorded rejection of one node per form, on the ground that each such node would restate the definition its owning node already carries. (Raised on commons.systems/disposition-graph/form-vocabulary.) Also raised on commons.systems/disposition-graph/projection.
```

#### rationale-argues-facts-list

The rationale says why the answer stands and why the candidates it beat fell, in argument; what was considered is the answer fact's options, each with its status, and the page projects them from the fact and never from the rationale. The standing sentence, that the rationale says which alternatives were rejected, and the fence's, that the page projects those alternatives beside the stamp, both give the rationale a list a field also carries. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 asked that the conflict be recorded here rather than resolved by that node's draft.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

The rationale says why the answer stands and why the candidates it beat fell, in argument; what was considered is the answer fact's options, each with its status, and the page projects them from the fact and never from the rationale. The standing sentence, that the rationale says which alternatives were rejected, and the fence's, that the page projects those alternatives beside the stamp, both give the rationale a list a field also carries. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 asked that the conflict be recorded here rather than resolved by that node's draft.
```

#### node-as-a-topic

A node is a topic rather than one question. It was passed over because a topic
mixes authority in one text, and one question per node is what makes same
scope decidable.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

A node is a topic rather than one question. It was passed over because a topic
mixes authority in one text, and one question per node is what makes same
scope decidable.
```

#### node-as-a-cluster-around-a-default-scope

A node is a cluster of related texts around a default scope. The rationale
records no reason for passing it over; it states only that one question per
node makes same scope decidable.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

A node is a cluster of related texts around a default scope. The rationale
records no reason for passing it over; it states only that one question per
node makes same scope decidable.
```

#### history-kept-inside-the-node

A node carries its own history of what it replaced. The rationale records no
reason for passing it over.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

A node carries its own history of what it replaced. The rationale records no
reason for passing it over.
```

#### proposal-as-a-state-of-a-ratified-node

The recommended `four-form-draft` says a proposal "is the alternative that arose outside alignment, as the authority node defines it", and cites a definition that node no longer gives: since the author's words of 2026-09-04 on the viable-options node, a proposal is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from, the origin being the option's source. The sentence drops the origin and cites the authority node for the state. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

The recommended `four-form-draft` says a proposal "is the alternative that arose outside alignment, as the authority node defines it", and cites a definition that node no longer gives: since the author's words of 2026-09-04 on the viable-options node, a proposal is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from, the origin being the option's source. The sentence drops the origin and cites the authority node for the state. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05.
```

#### answer-gloss-released-to-dialogue

Everything the recommendation says, with this node's bare `defines` entry for `answer` released, so that the term is defined once, on `dialogue`, the node that reserves the four fact names and would carry the gloss. It is on the table because how-a-fact-is-headed's recommended answer requires the release by name — the bare entry here "does not qualify" as the target of a fact heading's link, and `definerIndex` takes the first definer it meets — so a ruling there writes on this node's `defines` list, and this is where the author rules on that. It acts on nothing until that node is ruled.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

Everything the recommendation says, with this node's bare `defines` entry for `answer` released, so that the term is defined once, on `dialogue`, the node that reserves the four fact names and would carry the gloss. It is on the table because how-a-fact-is-headed's recommended answer requires the release by name — the bare entry here "does not qualify" as the target of a fact heading's link, and `definerIndex` takes the first definer it meets — so a ruling there writes on this node's `defines` list, and this is where the author rules on that. It acts on nothing until that node is ruled.
```

#### a-node-file-is-facts-and-account

A node is one question and the options its facts carry, each answer option holding the node as it would stand under it; its file is frontmatter, `## Facts` and `## Account`, and the sentence that a rationale says why and which alternatives were rejected is answered by the options' support and divergence.

**AI support.** It is what `dialogue`'s recommended encoding of 2026-09-07 makes a node, raised by the clean-context reading of that node the same day as a finding on this one, since this node's answer and that one answer the same question two ways.

**AI divergence.** This node defines a node for every graph and `dialogue` encodes an unanswered one; whether a node keeps its options' content after the confirmation is the recording node's, and this option reaches past it.

**Content.**

```markdown
---
question: What is a node?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---

## Answer

A node is one question and the options its facts carry, each answer option holding the node as it would stand under it; its file is frontmatter, `## Facts` and `## Account`, and the sentence that a rationale says why and which alternatives were rejected is answered by the options' support and divergence.
```

#### a-node-is-classed-by-the-rulings-on-its-facts

A node is a question, a form, and facts each carrying options; its class is read off the rulings recorded on those facts and nothing is written beside them; on the table because the standing answer says every node carries a stamp, which authority says is written nowhere.

## Account

### Manifest

- Folded: Amended with the transience overrule, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Findings:

- The Draft states the four-form merge — 'the current position in one of four forms: a disposition ... An assumption is not a form but a criterion' — which forms' own session reply in this same batch withdrew: 'The counter-argument wins. The recommendation changes to the second option, rule kept beside disposition.' The Proposal summary here still presents the merge as what is recommended ('Four forms: disposition (target and rule merged ...). Assumption leaves the forms and becomes a criterion kind'). Two nodes of one batch now recommend opposite answers to the same schema question, and this is the schema node. The draft cannot be put to the author as it stands.
- Draft Answer removes 'A node with a question and no answer is an un-aligned disposition ... and it has no children', the schema node's only statement of what an unanswered node is and of the no-children rule, and replaces it with 'Every node carries a stamp, or it is an open question awaiting its answer' — a term no node defines. Verified the removal is load-bearing: read.mjs's message is 'is unanswered and must carry stage', and the no-children rule holds today (no node with no '## Answer' has an under-child). The removal is not announced in the Proposal.
- Draft frontmatter uses 'criteria:', not a schema key, and drops 'instrument' from defines while the node itself still carries an 'instrument:' block. The drafted node could not land as written.
- Draft Answer: 'a tradition, the root of a mounted body of thought or work' makes tradition a form of node, while readings' draft puts traditions in a separate graph and forms' reply defers the question ('Whether a tradition carries a form of its own is put to the readings ruling'). Neither node settles it.
- Of the five author quotes under '## Disposition', two are answered by other nodes rather than this one: 'assumption deserves a target disposition ...' is answered by form-vocabulary, which carries the same quote verbatim, and the rejected-section question is answered by rejected.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value, but the class is wrong for a draft whose central change the record has withdrawn. The prose Facts line 'authority ratified if q1 stands; boldness moderate' understates the deletion of the un-aligned-disposition sentence, which is the AI's own and is not announced; boldness on the draft as it stands is high.

Strongest counter-argument (strong): The four-form model rests on a merge whose carrier does not exist: no criterion in the graph says whether its answer is to be achieved or maintained, no field holds it, and instruments' draft sentence that would have introduced it is withdrawn. Instruments' current text uses the distinction operationally — 'A target's failing check is work. A rule's failing check is a variance that gates the work that broke it' — which is how the frontier decides what to do with a failure, and almost every node is unguarded, so under the merge an unguarded node's failure would have no class at all. Ratifying this draft bakes the merge into the schema definition after the record has already decided against it.

The session's reply: Validated: the draft states the merge forms withdrew and drops the un-aligned sentence the validator quotes. The redraft reverts to five forms, restores the un-aligned disposition sentence and the no-children rule, and takes 'un-aligned disposition' in place of 'open question'; whether a tradition is a form waits on traditions-home; the criteria key arrives with instruments. The two quotations answered elsewhere are carried here as ground. On the counter-argument: accepted; the merge has no carrier. Stage maieutic: the sitting redrafts.

### Frontier finding, 2026-09-03

Kind: contradiction.

One schema question is in three states inside one batch. Forms' session reply: 'The counter-argument wins. The recommendation changes to the second option, rule kept beside disposition.' Node's draft says the opposite: 'the current position in one of four forms: a disposition, something that should become or stay true ... An assumption is not a form but a criterion', and node's Proposal summary still reads 'Four forms: disposition (target and rule merged ...)'. Instruments' draft still carries the sentence the merge rested on — 'A criterion also says whether the answer is to be achieved ... or maintained' — although instruments' own reply says it 'is withdrawn at the recording'. Forms' Options block meanwhile still marks the withdrawn option '(recommended)'.

Also named: commons.systems/disposition-graph/forms, commons.systems/disposition-graph/instruments.

Proposed: Forms is the survivor and is ruled first: move the '(recommended)' marker to option 2. Node's draft then reverts to five forms with the un-aligned-disposition sentence restored, and its Proposal summary is rewritten. Instruments' draft strikes the achieve-or-maintain sentence and keeps the three criterion kinds without it. The assumption question the author actually asked ('Is assumption a form at all?') is left unanswered by option 2 and should be minted as its own question under forms rather than carried by instruments' draft.

### Frontier finding, 2026-09-03

Kind: contradiction.

Authority's draft: 'A node without a stamp is an open question, not an answer.' Transience: an un-aligned disposition 'is a node with a question and no answer'. Node's current text agrees with transience; node's draft agrees with authority's draft. Verified the two rules classify the record differently: purpose has an answer and no stamp, and read.mjs's deriveStatus returns 'unaligned' only when there is no '## Answer', so the browser shows purpose while authority's draft would call it an open question. Authority's own session reply already accepted transience's test and the draft was not changed.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/transience.

Proposed: Transience is the survivor: it defines 'un-aligned disposition' and the validator implements its test. Authority's draft strikes the sentence and, if a stamp rule is wanted, says instead that a node without a stamp is unanswered, which unanswered already defines. Node's draft restores 'A node with a question and no answer is an un-aligned disposition ... and it has no children', which is the schema node's only statement of the rule and which the validator's message quotes.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Open question' is used on fifteen nodes and defined by none; the parsed graph carries 88 defined terms and 'open question' is not among them. Transience defines 'un-aligned disposition' for the same thing, growth's amended persistence list now uses that term, and the validator's own message says 'is unanswered and must carry stage'. Authority's draft and node's draft each use 'open question' for a slightly different notion, and several Proposals use it for a third ('persistence open question until written').

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/growth.

Proposed: Transience is the survivor: 'un-aligned disposition' is the one term. Authority's and node's drafts use it; the Proposal facts lines that say 'persistence open question' say 'persistence un-aligned disposition', which is the shape transience's list actually names. No new defines entry is needed.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/self-documentation, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `four-form-draft` (ai); `five-forms-restored` (review, 2026-09-03); `un-aligned-disposition-not-open-question` (review, 2026-09-03, from commons.systems/disposition-graph/transience); `revert-the-draft-to-five-forms` (review, 2026-09-03, from commons.systems/disposition-graph/instruments); `absorb-form-vocabulary` (review, 2026-09-03, from commons.systems/disposition-graph/form-vocabulary); `un-aligned-disposition-term` (review, 2026-09-03, from commons.systems/disposition-graph/growth).
The recommendation adopts `four-form-draft` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, new-answer on commons.systems/disposition-graph/forms: Is form: target synonymous with disposition, and would disposition be the better name; one of the three form questions forms' sitting is built on. 2026-09-02, new-answer on commons.systems/disposition-graph/form-vocabulary: Assumption deserves a target disposition, along with tradition and disposition, because that is how vocabulary is recorded rather than bolted on, with a recommendation for how hyperlinks avoid drift; carried verbatim on form-vocabulary, which answers it. 2026-09-02, new-answer on commons.systems/disposition-graph/forms: Is assumption a form at all, the concept having begun as instrumentation, an answer valid so long as an assumption holds. 2026-09-02, new-answer on commons.systems/disposition-graph/forms: What is the function of a rule form that a target or disposition does not already handle. 2026-09-02, new-answer on commons.systems/disposition-graph/rejected: What is the rejected section a projection of, and would an authority section with notes on pending ratification make more sense than an ad-hoc rejected section.
Moved to other nodes as alternatives: `authors-form-questions` on commons.systems/disposition-graph/forms; `authors-rejected-section-question` on commons.systems/disposition-graph/rejected.
The census unit's note: The Draft is what the recommendation adopts; the reverted five-form text the reviews and the contradiction finding ask for is the second alternative. That is borderline against excluding the standing answer, since the redraft is close to what stands but not identical: it takes un-aligned disposition for open question and leaves the tradition form to traditions-home. Four of five author quotations answer other nodes. Two of those, on the form list, are the ground of forms, which carries no words of its own, and one grounds rejected, so both moved elsewhere; the vocabulary quotation is already verbatim on form-vocabulary. The node-and-forms redundancy on the form list is a live contradiction the record flags, so I noted rather than proposed a fold.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `five-forms-restored` absorbs `revert-the-draft-to-five-forms`; `un-aligned-disposition-not-open-question` absorbs `un-aligned-disposition-term`. The merge unit's note: five-forms-restored is the broader of its pair and carries the un-aligned-disposition clause as well; that clause is also the whole of the second merged alternative, so the two remain separable only because five-forms-restored's change is the form list. absorb-form-vocabulary is a distinct fold and stays.

### Frontier finding, 2026-09-05

Kind: redundancy.

Two vocabulary questions are each pending as an unruled option on four separate nodes, and each is already answered in the standing text of a node in the judged set. `rejected-alternative-is-an-option` stands as an option on `growth`, `legacy`, `projection` and `transience`; `commons.systems/disposition-graph/rejected`'s `## Answer` already says "A rejected alternative is a viable option not chosen" and, in as many words, "An option is not a page: an answer that was not taken has no standing and earns no node of its own." `proposal-as-a-state-of-a-ratified-node` stands as an option on `growth`, `node`, `frontier-consistency` and `transience`; `commons.systems/disposition-graph/authority`'s `## Answer` already says "A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice." So eight options on six nodes ask the author to settle two things the record has settled, and they will be ruled one at a time on nodes whose questions are about something else. The reading of 2026-09-05 raised the second of these on `frontier-consistency` alone; what the survey adds is that it pends on three further nodes and that the settling text already stands. The record has a working precedent for the remedy: `commons.systems/disposition-graph/instruments` carries `one-ruling-for-the-word` (disposition/disposition-graph/instruments.md line 113) for the instrument-or-criterion question, and its enumeration is accurate — "the author is otherwise asked the same vocabulary question five times on five pages". Neither of these two families has such an option.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/instruments.

Proposed: Strike the eight options and replace each with a citation. `commons.systems/disposition-graph/rejected` is the survivor for what a rejected alternative is, and `commons.systems/disposition-graph/authority` is the survivor for what a proposal is; each of the six bearer nodes cites the survivor's sentence where it currently carries the option. Where a bearer node believes its option means something the survivor's answer does not cover, that difference is the option, stated as the difference, and everything the survivor already says comes out. If the author would rather rule the two words once explicitly, mint the settling option on the survivor in the shape `instruments`' `one-ruling-for-the-word` takes, without a count in its prose.

### Frontier finding, 2026-09-07

Kind: cross-reference.

how-a-fact-is-headed's recommendation edits two other nodes' `defines` lists and neither node carries the edit. Its fact's case against says it "buys the link on every heading by writing on three nodes this ruling does not own: a gloss on `dialogue` for two of the four names and the release of the bare entries on `node` and `transience`", and its answer requires that "the bare entries at `disposition/disposition-graph/node.md:65` and `disposition/disposition-graph/transience.md:76` are released to it, so that one entry stands for each name." The gloss half is recorded where the author will meet it, as `dialogue-glosses-the-four-fact-names` on dialogue. The release half is recorded nowhere: node.md and transience.md name how-a-fact-is-headed at no locus, carry no option for the release, and are in no depends of that node. So the answer's claim that "There is no fallback, because this ruling leaves no name without such an entry" rests on two edits the record has not proposed on the nodes that would make them.

Also named: commons.systems/disposition-graph/how-a-fact-is-headed, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/dialogue.

Proposed: node and transience are where the release is missing. The release of each bare `defines` entry is recorded as an option on that node's answer fact, sourced to how-a-fact-is-headed, so each node's own ruler meets the edit their node would take, as dialogue's ruler already meets the gloss. how-a-fact-is-headed's answer stands; what it lacks is the two rows on the nodes it writes on.

Recorded as an option on this node's answer fact: `answer-gloss-released-to-dialogue` (source review, 2026-09-07).

Recorded as an option on commons.systems/disposition-graph/transience's answer fact: `persistence-gloss-released-to-dialogue` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/node stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `four-form-draft`; 5 `## Disposition` entries became the ledger entries words/2026-09-02/15, words/2026-09-02/7, words/2026-09-02/16, words/2026-09-02/17, words/2026-09-02/18, referenced by 0 options the entry's own date names and by the recommended option for 5 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `five-forms-restored`, `un-aligned-disposition-not-open-question`, `absorb-form-vocabulary`, `rationale-argues-facts-list`, `node-as-a-topic`, `node-as-a-cluster-around-a-default-scope`, `history-kept-inside-the-node`, `proposal-as-a-state-of-a-ratified-node`, `answer-gloss-released-to-dialogue`, `a-node-file-is-facts-and-account`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `50b9ea4f40a07e8facf86b081e6183c2381cce21` was already past the recommendation and is left as it stood.

### Frontier finding, 2026-09-07

Kind: vocabulary.

authority's standing answer: 'no stamp is written beside them: a node\'s class is read off those rulings, and a node no ruling grants is unanswered'. Standing answers that still define the node by a stamp: node 'Every node carries a stamp, or it is an open question awaiting its answer'; growth 'a ratification is recorded as the stamp in the author\'s name with the ruling quoted'; projection 'an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected'; traditions-home 'A tradition root is a node like any other, a question, an answer, a form and a stamp'. quotes' option `stamp-vocabulary-struck-from-the-live-options` reaches only quotes' own options.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/growth, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/quotes.

Proposed: authority's vocabulary survives: class, ruling, fact, option. node, growth, projection and traditions-home are amended to define a node by the rulings on its facts, and the record's use of stamp is confined to authority's historical sentence about the stamps the bootstrap wrote.

Recorded as an option on this node's answer fact: `a-node-is-classed-by-the-rulings-on-its-facts` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

The record's term is option, and growth carries '`rejected-alternative-is-an-option` — source commons.systems/disposition-graph/rejected, passed over' while the brief's vocabulary line still reads 'rejected — term: rejected alternative'. Standing texts using the struck term: frontier-consistency 'it is recorded as an alternative on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which' and 'it adopts a listed alternative or the node as it stands'; node 'The rationale says why, and which alternatives were rejected and for what reason; the page projects those alternatives beside the stamp.'; transience 'the alternatives pending, each with its source'; projection 'the alternatives the rationale rejected'. node's 'The rationale says why' and prose-and-structure's 'A node\'s prose is its disposition, its answer, its rationale and its account' also name a `## Rationale` that dialogue strikes.

Also named: commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/growth.

Proposed: viable-options survives; the four nodes are amended to say option, and node and prose-and-structure to name the sections dialogue keeps (`## Facts`, `## Account`) rather than rationale and disposition.

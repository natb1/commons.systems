---
question: What is a node?
stage: maieutic
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: kickback
  strength: strong
  date: 2026-09-03
  of: 50b9ea4f40a07e8facf86b081e6183c2381cce21
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - question
  - answer
  - rationale
  - form
  - proposal
instrument:
  kind: check
  ref: packages/disposition/validate.mjs on the implementation ref
  note: every file parses as one question, at most one answer, and only defined fields
---
## Disposition

The author, 2026-09-02:
> Given the above: is "form: target" synonymous with "disposition"? Evaluate if "disposition" would be a better name for "target".

The author, 2026-09-02:
> "assumption" deserves a target disposition, along with "tradition" and "disposition" (if target is renamed to disposition). This is how vocabulary is recorded, not with something bolted on that will drift. Recommend how hyperlinks will avoid drift.

The author, 2026-09-02:
> Is assumption a form at all? I think the concept of an assumption started as instrumentation. Something like "this answer is valid so long as this assumption holds". eg. using this platform is economical assuming we are operating at startup scale, but would fail to be economical at enterprise scale.

The author, 2026-09-02:
> What is the function of a "rule" form? What's not already handled by a target/disposition?

The author, 2026-09-02:
> What is the rejected section a projection of. Should it be associated with the deferred authority somehow? An authority section projected into the documentation (with notes on pending ratification for deferred authority) would make more sense than a "rejected" section which seems ad-hoc.

## Answer

One question and its standing answer. The question is one line someone could ask the author. The answer is the current position in one of five forms, a target (something that should become true), a rule (something that must stay true while working), an assumption (something about the world the answer relies on), an archē (a first principle held, never derived), or a reading (what a tradition says about the answer above it). The rationale says why, and which alternatives were rejected. A node may also carry a proposal, a candidate answer with no authority, recorded for the author's review. A node with a question and no answer is an un-aligned disposition, the author's stated disposition or the AI's proposal on which the alignment dialogue has not concluded; it carries the author's words, the AI's account, and the stage of the dialogue, as the transience node says. It is a node like any other and may be refined by children; what it lacks is authority, not standing. If a text answers two questions, it is two nodes. If a new answer replaces an old one, the node holds the new answer and version control holds the old.

## Rationale

One question per node makes "same scope" decidable: two texts share a node only if one replaced the other. Rejected: the node as a topic, which mixes authority in one text; the node as a cluster around a default scope; history kept inside the node. Traditions to record as readings: issues as questions (Kunz and Rittel, IBIS, 1970); the answer as an accumulated restatement (the common-law restatement); store once and derive the rest (Codd). An archē is held, never derived, so nothing ranks above one: Metaphysics V.1 on the senses of archē, Posterior Analytics I.3 on the regress of demonstration, Nicomachean Ethics I.4 on beginning from what is known to us, each owed as a reading.


## Draft

```markdown
---
question: What is a node?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
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

One question and its standing answer. The question is one line someone could ask the author. The answer is the current position in one of four forms: a disposition, something that should become or stay true, where whether it is to be achieved or maintained is carried by its criteria; an archē, a first principle held and never derived; a reading, what a tradition says about the answer above it; or a tradition, the root of a mounted body of thought or work. The rationale says why, and which alternatives were rejected and for what reason; the page projects those alternatives beside the stamp. Every node carries a stamp, or it is an open question awaiting its answer; a proposal is content in a stamped node or in a sitting's record, never a class of node. An assumption is not a form but a criterion: this answer holds so long as the assumption does. If a text answers two questions, it is two nodes. If a new answer replaces an old one, the node holds the new answer and version control holds the old.

## Rationale

One question per node makes "same scope" decidable: two texts share a node only if one replaced the other. Target and rule were one form seen from two sides, achieve and maintain, which the goal-oriented requirements tradition carries on the goal's criterion rather than on its kind; assumption began as instrumentation, the condition under which an answer stays valid, and is recorded where it is checked. Rejected: the node as a topic, which mixes authority in one text; the node as a cluster around a default scope; history kept inside the node; five forms with target, rule, and assumption apart, because the split recorded the same fact twice, once as form and once as criterion.
```

## Proposal

### Amended with the transience overrule, 2026-09-03

The clause "and it has no children" is struck from the answer above and replaced, following the overrule recorded on `transience` on the author's ruling of 2026-09-03 that an unanswered disposition is a disposition plus dialogue state. This node restated the rule; `transience` defines the shape and carries the reasoning. The two frontier findings of 2026-09-03 recorded below, which asked that this sentence be kept because it was the schema node's only statement of the no-children rule, are answered by the rule being struck rather than by the sentence being kept: what they were protecting was the record's only statement of a rule that no longer holds.

The stamp stays deferred, as `evaluation` provides for an overruled deferred answer, and the answer changed after its review, so the review is owed again on the changed text.

### Sitting on purpose, 2026-09-03

**The node node, whole; forms collapse to four**

Four forms: disposition (target and rule merged; whether it is to be achieved or maintained is carried by its criteria), archē, reading, tradition. Assumption leaves the forms and becomes a criterion kind. Every node carries a stamp or is an open question; proposal is content. The rationale carries the rejected alternatives with their reasons and the page projects them beside the stamp. The prose list of traditions leaves the rationale. Vocabulary stays with the nodes that define each term (n-form-vocabulary).

Facts: authority ratified if q1 stands; boldness moderate; the achieve-or-maintain carrier is the goal-oriented requirements tradition, the merge is the author's question; persistence standing.

Rejected:
- Keep rule as a form beside disposition. — Open as q1; a rule is a disposition to be maintained, which its criterion already says.
- Keep all five forms. — Open as q1; assumption as a form recorded the same fact twice, once as form and once as criterion.

Depends on: `forms`, `traditions-home`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer removes the sentence 'A node with a question and no answer is an un-aligned disposition ... and it has no children' and replaces it with 'Every node carries a stamp, or it is an open question awaiting its answer.' That deletes from the schema node the only statement of what an unanswered node is and of the no-children rule, and introduces a term no node defines. The validator's message says 'a node without an ## Answer section is an un-aligned disposition and must carry stage'. The removal is not announced in the Proposal summary. Suggested edit: keep the un-aligned sentence and add the stamp rule beside it.
- Draft Answer: 'a disposition, something that should become or stay true, where whether it is to be achieved or maintained is carried by its criteria.' No criterion in the graph carries that marker, including the four drafted at this sitting, and an unguarded node has no criteria at all. An executor recording a maintain-type disposition with no criterion has nowhere to put the fact.
- Draft Answer: 'a tradition, the root of a mounted body of thought or work' makes tradition a form of node here, while readings' draft puts traditions in a separate graph. Neither node says whether a tradition root carries 'form: tradition'. Suggested edit: settle it in one of the two.

On the three facts: 'Ratified if q1 stands' is the right contingency, but 'boldness moderate' understates the deletion of the un-aligned-disposition sentence, which is the AI's own and is not announced.

Strongest counter-argument (weak): The four-form model rests on the merge argued at forms, and the strongest case against it belongs there: the achieve-or-maintain distinction that target and rule carried has no field to move into, and no criterion in the record carries it. Ratifying this node bakes the merge into the schema definition before that carrier exists.

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

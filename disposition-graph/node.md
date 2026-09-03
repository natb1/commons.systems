---
question: What is a node?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: weak
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

One question and its standing answer. The question is one line someone could ask the author. The answer is the current position in one of five forms, a target (something that should become true), a rule (something that must stay true while working), an assumption (something about the world the answer relies on), an archē (a first principle held, never derived), or a reading (what a tradition says about the answer above it). The rationale says why, and which alternatives were rejected. A node may also carry a proposal, a candidate answer with no authority, recorded for the author's review. A node with a question and no answer is an un-aligned disposition, the author's stated disposition or the AI's proposal on which the alignment dialogue has not concluded; it carries the author's words, the AI's account, and the stage of the dialogue, as the transience node says, and it has no children. If a text answers two questions, it is two nodes. If a new answer replaces an old one, the node holds the new answer and version control holds the old.

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

### Sitting on purpose, 2026-09-03

**The node node, whole; forms collapse to four**

Four forms: disposition (target and rule merged; whether it is to be achieved or maintained is carried by its criteria), archē, reading, tradition. Assumption leaves the forms and becomes a criterion kind. Every node carries a stamp or is an open question; proposal is content. The rationale carries the rejected alternatives with their reasons and the page projects them beside the stamp. The prose list of traditions leaves the rationale. Vocabulary stays with the nodes that define each term (n-form-vocabulary).

Facts: authority ratified if q1 stands; boldness moderate; the achieve-or-maintain carrier is the goal-oriented requirements tradition, the merge is the author's question; persistence standing.

Rejected:
- Keep rule as a form beside disposition. — Open as q1; a rule is a disposition to be maintained, which its criterion already says.
- Keep all five forms. — Open as q1; assumption as a form recorded the same fact twice, once as form and once as criterion.

Depends on: `forms`, `traditions-home`

Proposed text: the draft section of this node.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer removes the sentence 'A node with a question and no answer is an un-aligned disposition ... and it has no children' and replaces it with 'Every node carries a stamp, or it is an open question awaiting its answer.' That deletes from the schema node the only statement of what an unanswered node is and of the no-children rule, and introduces a term no node defines. The validator's message says 'a node without an ## Answer section is an un-aligned disposition and must carry stage'. The removal is not announced in the Proposal summary. Suggested edit: keep the un-aligned sentence and add the stamp rule beside it.
- Draft Answer: 'a disposition, something that should become or stay true, where whether it is to be achieved or maintained is carried by its criteria.' No criterion in the graph carries that marker, including the four drafted at this sitting, and an unguarded node has no criteria at all. An executor recording a maintain-type disposition with no criterion has nowhere to put the fact.
- Draft Answer: 'a tradition, the root of a mounted body of thought or work' makes tradition a form of node here, while readings' draft puts traditions in a separate graph. Neither node says whether a tradition root carries 'form: tradition'. Suggested edit: settle it in one of the two.

On the three facts: 'Ratified if q1 stands' is the right contingency, but 'boldness moderate' understates the deletion of the un-aligned-disposition sentence, which is the AI's own and is not announced.

Strongest counter-argument (weak): The four-form model rests on the merge argued at forms, and the strongest case against it belongs there: the achieve-or-maintain distinction that target and rule carried has no field to move into, and no criterion in the record carries it. Ratifying this node bakes the merge into the schema definition before that carrier exists.

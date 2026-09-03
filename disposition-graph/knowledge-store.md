---
question: Does the same record serve as a knowledge store?
stage: review
recommendation:
  class: ratified
  boldness: low
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: f0f2a3f638d234a077592bac4a7bdf10c43fd039
form: assumption
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/purpose
---
## Disposition

The author, 2026-09-02:
> Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?

## Answer

Yes. A record of a person's standing answers, with their rationale and the alternatives they rejected, is a knowledge store: something like a projection of its author's hexis. This is a hypothesis, so it is recorded as an assumption: if it fails, the purpose above returns to the author for re-grasp rather than quietly standing on a false premise.

## Rationale

The author's hypothesis, 2026-09-02. What would fail it: the record proving useful only while work is in flight, or its answers needing a second store to be findable or trusted. The reading under this node tests the hexis framing against Aristotle. An instrument is owed.


## Draft

```markdown
---
question: Does the same record serve as a knowledge store?
form: assumption
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/purpose
criteria:
  - kind: assessment
    ref: the author, at a sitting on this node
    note: fails if the record proves useful only while work is in flight, or its answers need a second store to be findable or trusted
---
## Answer

Yes. A record of a person's standing answers, with their rationale and the alternatives they rejected, is a knowledge store: a projection of its author's hexis. This is a hypothesis, so its criterion is not yet validated: if it fails, the purpose above returns to the author for re-grasp rather than quietly standing on a false premise.

## Rationale

The author's hypothesis, 2026-09-02. The reading under this node tests the hexis framing against Aristotle.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The knowledge-store hypothesis as a disposition with an unvalidated criterion**

Form stays assumption, as the forms node now recommends; the failure condition moves from the rationale into a criterion, an assessment dated at each sitting; the ledger reference is gone.

Facts: authority ratified on the form; the answer stays deferred as the author's hypothesis; boldness low; persistence standing.

Depends on: `forms`, `instruments`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer drops the hedge: the node says 'something like a projection of its author's hexis', the draft says 'a projection of its author's hexis'. Strengthening a hypothesis while keeping it a hypothesis is not announced in the Proposal summary, and it is the same claim hexis asks the author to rule on. Suggested edit: keep 'something like' until q4 is ruled.
- Draft criterion note stores 'not yet validated', which transience's 'Transience is never stored; it is projected' forbids. Suggested edit: let the frontier derive an unvalidated criterion from the absence of a dated assessment.
- Draft criterion 'kind: assessment, ref: the author, at a sitting on this node'. Instruments defines an assessment as 'a dated human judgment'; this one has no date and records no judgment, so it names an intention to assess rather than an assessment.

On the three facts: 'Authority ratified on the form; the answer stays deferred' presents two classes for one stamp. The node has one stamp and it is deferred; the form decision belongs to forms and node. Restate as: stamp deferred, form contingent on q1.

Strongest counter-argument (weak): The failure condition, that the record proves useful only while work is in flight or needs a second store to be findable, is not observable on any timescale the sitting can reach, so the criterion cannot fail and therefore cannot guard. That is acceptable for a hypothesis the author states, but it means the form change from assumption to disposition buys nothing operational: an assumption whose failure sends the question back to the author is exactly what this node still is. Worth one line.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer drops the hedge the node carries: 'something like a projection of its author's hexis' becomes 'a projection of its author's hexis'. Strengthening a hypothesis while keeping it a hypothesis is not announced in the Proposal, and it prejudges hexis. Unchanged since the previous review; no session reply is recorded on this node.
- Draft criterion note stores 'not yet validated', forbidden by transience; and the assessment has no date and no threshold, so it cannot fail and cannot guard.
- Draft frontmatter uses the key 'criteria', which is not in FRONTMATTER_KEYS, so the drafted node could not land; and the Proposal's 'Form changes from assumption to disposition' is stale against forms' changed recommendation while the draft in fact keeps 'form: assumption'.
- The Proposal's Facts line presents two classes for one stamp ('authority ratified on the form; the answer stays deferred as the author's hypothesis'), which instruments' rejected list forbids: 'a criterion that needs its own stamp is a question of its own and becomes a node then.'

On the three facts: The frontmatter recommendation (ratified, low) is right for the author's own hypothesis. The prose Facts line states two classes for one stamp and should be restated as: stamp deferred, form contingent on forms, boldness low.

Strongest counter-argument (weak): The failure condition — that the record proves useful only while work is in flight, or needs a second store to be findable — is not observable on any timescale a sitting can reach, so the criterion cannot fail and therefore cannot guard. That is acceptable for a hypothesis the author states, but it means the form change buys nothing operational: an assumption whose failure sends the question back to the author is exactly what this node already is, and purpose-criteria's now-recommended answer for the parent is to stand unguarded and say so.

The session's reply: Validated. Amended tonight: the criterion note no longer stores 'not yet validated', the Proposal says the form stays assumption as forms now recommends, and the Facts line states one class. The dropped hedge is the wording the hexis option recommends, and the author rules hexis before this node. On the counter-argument, that the criterion cannot fail on any timescale a sitting reaches: accepted as the reason the assessment is dated at each sitting rather than thresholded; the author may prefer purpose-criteria's answer here too, unguarded and said so. Stage review.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/self-documentation, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.

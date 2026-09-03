---
question: Does the same record serve as a knowledge store?
stage: ruling
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
    note: not yet validated; fails if the record proves useful only while work is in flight, or its answers need a second store to be findable or trusted
---
## Answer

Yes. A record of a person's standing answers, with their rationale and the alternatives they rejected, is a knowledge store: a projection of its author's hexis. This is a hypothesis, so its criterion is not yet validated: if it fails, the purpose above returns to the author for re-grasp rather than quietly standing on a false premise.

## Rationale

The author's hypothesis, 2026-09-02. The reading under this node tests the hexis framing against Aristotle.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The knowledge-store hypothesis as a disposition with an unvalidated criterion**

Form changes from assumption to disposition; the failure condition moves from the rationale into a criterion marked not yet validated; the ledger reference is gone.

Facts: authority ratified on the form; the answer stays deferred as the author's hypothesis; boldness low; persistence standing.

Depends on: `forms`, `instruments`

Proposed text: the draft section of this node.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer drops the hedge: the node says 'something like a projection of its author's hexis', the draft says 'a projection of its author's hexis'. Strengthening a hypothesis while keeping it a hypothesis is not announced in the Proposal summary, and it is the same claim hexis asks the author to rule on. Suggested edit: keep 'something like' until q4 is ruled.
- Draft criterion note stores 'not yet validated', which transience's 'Transience is never stored; it is projected' forbids. Suggested edit: let the frontier derive an unvalidated criterion from the absence of a dated assessment.
- Draft criterion 'kind: assessment, ref: the author, at a sitting on this node'. Instruments defines an assessment as 'a dated human judgment'; this one has no date and records no judgment, so it names an intention to assess rather than an assessment.

On the three facts: 'Authority ratified on the form; the answer stays deferred' presents two classes for one stamp. The node has one stamp and it is deferred; the form decision belongs to forms and node. Restate as: stamp deferred, form contingent on q1.

Strongest counter-argument (weak): The failure condition, that the record proves useful only while work is in flight or needs a second store to be findable, is not observable on any timescale the sitting can reach, so the criterion cannot fail and therefore cannot guard. That is acceptable for a hypothesis the author states, but it means the form change from assumption to disposition buys nothing operational: an assumption whose failure sends the question back to the author is exactly what this node still is. Worth one line.

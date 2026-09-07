---
question: May an un-aligned disposition have children?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 3c163ef7f2a5f1e78301e90f70c8ffbc30a1e1cd
  against: "The rule was struck under a bootstrap grant, without the periagogic movement the node's own account says is owed, on the strength of the author's words about what an unanswered disposition is — words that were about the unanswered status generally and not about this shape. The account itself concedes the AI 'treated a deferred answer as fixed, framed the author's challenge inside that frame, and parked a reading on the wrong parent'; the answer written from that concession removes a guard whose ground was a measured legacy failure, durable content stranded on a vanishing node. The author's model may well be right, but the record now has an answer and an instrument removed on an inference the periagogic movement was supposed to test."
  survey:
    date: 2026-09-05
    of: 18277fa1bce183840cd0bc6ff7301eeaa2f1a323
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/79
      - name: keep-the-rule-and-park-the-reading
        source: ai
        ref: "9ff1b0b0"
        status: passed
        reason: "it misplaces a reading for the life of the question"
      - name: keep-the-rule-soften-the-instrument
        source: ai
        ref: "9ff1b0b0"
        status: passed
        reason: "it leaves a struck inference standing in the record as a rule nobody enforces"
    recommends: standing
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/transience
---

## Facts

### answer

#### standing

Yes.

**AI support.** The author's ruling of 2026-09-03: "you have bootstrap authority to reconcile the model of unanswered disposition as disposition + dialogue state", and, stating the model on the same day, "My expectation is that an unaligned/unanswered disposition is just a disposition + alignment dialogue state. Unanswered is expected to just be a class of disposition that is registered for alignment dialogue and has no authority for reconciliation (unless bootstrap authority is explicitly granted)."

The rule struck here was an inference from a premise the author denies. `transience` held that an un-aligned disposition becomes "an answer, an amendment quoted into the node it refines, or nothing", and a thing that may become nothing cannot be a parent without orphaning its children; the rationale priced that from the legacy tactic node, whose measured costs were durable content stranded on a vanishing node and edges left dangling. On the author's model nothing vanishes: the node is durable and the dialogue resolves into it. The legacy failure stands as a failure of the legacy tactic, a completable unit removed on completion, which this shape is not.

Two further facts made the rule weaker than it looked. It keyed on the absence of an `## Answer` section rather than on the unanswered status, so nodes carrying a deferred answer — every stamped node in this graph — could already have children; the author's model was already the record's model everywhere but this one shape. And the rule was enforced by a machine check that hard-failed, which gave a deferred answer the force of a ratified one and removed in practice the overrule `evaluation` grants in principle; that instrument is removed on the implementation ref in the same landing.

Not decided here, and left open on `instruments`, an alternative for its dialogue: whether a machine check should ever hard-fail an answer that is not ratified.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: May an un-aligned disposition have children?
form: rule
under:
  - commons.systems/disposition-graph/transience
---

## Answer

Yes. An unanswered disposition is a disposition plus the dialogue state on it: a node like any other, registered for the alignment dialogue, which may be refined by children exactly as an answered node may. What an unanswered disposition lacks is authority, not standing. It carries none for reconciliation, and work may not be grounded in it, unless the author grants bootstrap authority explicitly, as the author did on 2026-09-03 for this ruling and for the lockfile. A reading, a refinement, or any other node may therefore sit under an open question, and does not have to wait for the question to be answered or be parked on the question's parent.
```

#### keep-the-rule-and-park-the-reading

The no-children rule stands, and a reading owed to an open question is parked
on the question's parent. It was passed over because it misplaces a reading
for the life of the question, which is what happened to
`npm-committed-lockfile` on 2026-09-03.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: May an un-aligned disposition have children?
form: rule
under:
  - commons.systems/disposition-graph/transience
---

## Answer

The no-children rule stands, and a reading owed to an open question is parked
on the question's parent. It was passed over because it misplaces a reading
for the life of the question, which is what happened to
`npm-committed-lockfile` on 2026-09-03.
```

#### keep-the-rule-soften-the-instrument

The no-children rule stands and its machine check is softened from a hard
failure to a warning. It was passed over because it leaves a struck inference
standing in the record as a rule nobody enforces.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: May an un-aligned disposition have children?
form: rule
under:
  - commons.systems/disposition-graph/transience
---

## Answer

The no-children rule stands and its machine check is softened from a hard
failure to a warning. It was passed over because it leaves a struck inference
standing in the record as a rule nobody enforces.
```

## Account


The rule is in the record, not only in the validator. The answer above states it: "An un-aligned disposition has no children, and at its recording it becomes an answer, an amendment quoted into the node it refines, or nothing." `node` states it a second time, as the schema node's only statement of what an unanswered node is, and `packages/disposition/read.mjs` implements it as a validation whose message quotes it. Three of the frontier findings of 2026-09-03, on `node`, `authority` and `dialogue`, already contest which node should own the sentence, and all three assume the rule itself.

### Manifest

- Folded: The finding: the rule does not bind what the author's words name, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The ground of the rule as the record states it, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What this sitting would amend, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The case that surfaced it, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Facts, superseded, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Answered on the author's ruling, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Account, '### Facts': 'Authority none: an un-aligned disposition in the author's words, recorded at their direction and carrying no answer ... Persistence open, until the author rules', and, below it, 'The movement owed is periagogic and has not been run'. All three are false of the node as it now stands: the frontmatter carries a deferred stamp of 2026-09-03, a standing answer, `stage: review`, and a recommendation of ratified at low boldness. The alignment page renders the account, so the author is shown a node that says it is not ready for a ruling while the page puts it up for one. Suggested edit: strike or supersede the Facts section, which the later '### Answered on the author's ruling' section already contradicts.
- Answer: 'unless the author grants bootstrap authority explicitly, as the author did on 2026-09-03 for this ruling and for the lockfile'. Verified that authority's bootstrap-authority shim is live and its liquidation is bootstrap exit, so the citation holds. But 'bootstrap authority' is defined only inside that shim's text and is in no node's `defines`, so the term the answer's one exception turns on is unlinked and undefined.
- The node is the only node in the batch with no pending alternatives at all and no review of any kind: this is its first reading. Its answer strikes a rule that two other nodes stated and an instrument enforced, which is the largest single change in the batch made under a bootstrap grant rather than through the dialectic.
- Account: 'One consequence is now due and is not taken here: `npm-committed-lockfile` was placed under `materialization` only because this rule blocked its proper parent.' Verified still under materialization, with `reparent-under-lockfile` pending on that node. The consequence is correctly deferred to the author and correctly recorded.

On the three facts: The frontmatter recommendation (adopts standing, ratified, low) states one class and one value and the pin is current, and low is defensible since the rule struck was an inference the author denies in quoted words. The node's prose Facts section states a different class ('Authority none') and a different persistence ('open'), so the node presents two contradictory accounts of its own three facts — the same defect the coverage finding records on sixteen other nodes, and the sharpest instance of it, since here the two accounts disagree about whether the node is ready to be ruled at all.

Strongest counter-argument (moderate): The rule was struck under a bootstrap grant, without the periagogic movement the node's own account says is owed, on the strength of the author's words about what an unanswered disposition is — words that were about the unanswered status generally and not about this shape. The account itself concedes the AI 'treated a deferred answer as fixed, framed the author's challenge inside that frame, and parked a reading on the wrong parent'; the answer written from that concession removes a guard whose ground was a measured legacy failure, durable content stranded on a vanishing node. The author's model may well be right, but the record now has an answer and an instrument removed on an inference the periagogic movement was supposed to test.

The session's reply: Forward accepted. The stale Facts section is marked superseded at this landing, an edit to the account and not to the answer, so the alternative the finding proposed is not recorded; the finding stands in the account.

### Frontier finding, 2026-09-03

Kind: coverage.

Un-aligned-children's account carries a '### Facts' section stating 'Authority none: an un-aligned disposition in the author's words, recorded at their direction and carrying no answer', 'Persistence open, until the author rules', and, in the paragraph below it, 'The movement owed is periagogic and has not been run'. All three are contradicted by the node's own frontmatter, which carries `authority: class: deferred, by: claude, date: 2026-09-03`, a standing answer, `stage: review`, and `recommendation: adopts standing, class: ratified, boldness: low`. Because the alignment page renders the account beside the recommendation, the author is shown a node that says it carries no answer and owes a periagogic movement, on a page that puts it up for a ruling. This is the sharpest instance of the defect the coverage finding of 2026-09-03 records as the sixteen generic prose Facts lines: dialogue requires 'one class and one boldness value from the review stage on', and here the prose and the data disagree not about the class alone but about whether the node has an answer at all. The node carries no pending alternatives, so nothing on it records the finding.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/dialogue.

Proposed: Dialogue is the survivor of the requirement and growth of the presentation rule; neither text need change for this node. Un-aligned-children's stale '### Facts' section is superseded by its own later '### Answered on the author's ruling, 2026-09-03' section and should be struck or marked superseded rather than left standing beside a contradicting frontmatter — the alternative below is the vehicle, since the review proposes and never edits. Growth's already-pending `facts-from-recommendation-field` alternative is what closes the class at its source, by saying the three facts are presented from the recommendation field and the node's shims and never from a prose line; taking it would make this and the sixteen other instances unrepresentable rather than fixed one by one.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (moderate): The answer's rule — work may not be grounded in an unanswered disposition — has an exception, an explicit grant from the author, and the exception is the record's entire operating mode: nothing in the record is ratified, every rule a session loads is projected from an unanswered node, and `what-acts-during-bootstrap` exists because of it. A rule whose exception has swallowed it is not yet load-bearing, and ratifying it now records as settled a distinction the record has never had occasion to apply in the direction that constrains anyone.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/un-aligned-children stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-03/79, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `keep-the-rule-and-park-the-reading`, `keep-the-rule-soften-the-instrument`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `3c163ef7f2a5f1e78301e90f70c8ffbc30a1e1cd` was already past the recommendation and is left as it stood. The survey's pin `ef3fa07a4050e0e5db919ebda7eadcc86414c48c` is re-computed for the encoding as `18277fa1bce183840cd0bc6ff7301eeaa2f1a323`; nothing it read changed.

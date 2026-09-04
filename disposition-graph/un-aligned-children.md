---
question: May an un-aligned disposition have children?
stage: ruling
recommendation:
  adopts: standing
  boldness: low
  amends: "2f12ff318a1a0fd5bc4c64e8b2584c88b2672a8c"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 2f12ff318a1a0fd5bc4c64e8b2584c88b2672a8c
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: low
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/transience
---
## Disposition

The author, 2026-09-03:
> Why do unaligned dispositions have no children? My expectation is that an unaligned/unanswered disposition is just a disposition + alignment dialogue state. Unanswered is expected to just be a class of disposition that is registered for alignment dialogue and has no authority for reconciliation (unless bootstrap authority is explicitly granted)

## Answer

Yes. An unanswered disposition is a disposition plus the dialogue state on it: a node like any other, registered for the alignment dialogue, which may be refined by children exactly as an answered node may. What an unanswered disposition lacks is authority, not standing. It carries none for reconciliation, and work may not be grounded in it, unless the author grants bootstrap authority explicitly, as the author did on 2026-09-03 for this ruling and for the lockfile. A reading, a refinement, or any other node may therefore sit under an open question, and does not have to wait for the question to be answered or be parked on the question's parent.

## Rationale

The author's ruling of 2026-09-03: "you have bootstrap authority to reconcile the model of unanswered disposition as disposition + dialogue state", and, stating the model on the same day, "My expectation is that an unaligned/unanswered disposition is just a disposition + alignment dialogue state. Unanswered is expected to just be a class of disposition that is registered for alignment dialogue and has no authority for reconciliation (unless bootstrap authority is explicitly granted)."

The rule struck here was an inference from a premise the author denies. `transience` held that an un-aligned disposition becomes "an answer, an amendment quoted into the node it refines, or nothing", and a thing that may become nothing cannot be a parent without orphaning its children; the rationale priced that from the legacy tactic node, whose measured costs were durable content stranded on a vanishing node and edges left dangling. On the author's model nothing vanishes: the node is durable and the dialogue resolves into it. The legacy failure stands as a failure of the legacy tactic, a completable unit removed on completion, which this shape is not.

Two further facts made the rule weaker than it looked. It keyed on the absence of an `## Answer` section rather than on the unanswered status, so nodes carrying a deferred answer — every stamped node in this graph — could already have children; the author's model was already the record's model everywhere but this one shape. And the rule was enforced by a machine check that hard-failed, which gave a deferred answer the force of a ratified one and removed in practice the overrule `evaluation` grants in principle; that instrument is removed on the implementation ref in the same landing.

Rejected: keeping the rule and requiring a reading owed to an open question to be parked on the question's parent, which is what happened to `npm-committed-lockfile` on 2026-09-03 and which misplaces a reading for the life of the question. Rejected: keeping the rule but softening the instrument to a warning, which leaves a struck inference standing in the record as a rule nobody enforces. Not decided here, and left open on `instruments`, an alternative for its dialogue: whether a machine check should ever hard-fail an answer that is not ratified.

## Account

The rule is in the record, not only in the validator. The answer above states it: "An un-aligned disposition has no children, and at its recording it becomes an answer, an amendment quoted into the node it refines, or nothing." `node` states it a second time, as the schema node's only statement of what an unanswered node is, and `packages/disposition/read.mjs` implements it as a validation whose message quotes it. Three of the frontier findings of 2026-09-03, on `node`, `authority` and `dialogue`, already contest which node should own the sentence, and all three assume the rule itself.

### The finding: the rule does not bind what the author's words name, 2026-09-03

The author's words are about the unanswered status. The rule is not. It keys on the absence of an `## Answer` section, not on unansweredness, and the two come apart exactly as the author expects:

- `unanswered` says that until the author rules, a deferred answer is unanswered. So a node carrying an answer and a deferred stamp is unanswered, and it may have children today. `materialization` is such a node, deferred and at the review stage, and it took a child this same day without objection from the validator.
- The rule reaches only the narrower shape `transience` calls an un-aligned disposition: a node with a question and no answer at all.

So the author's model — that unanswered is a class registered for the alignment dialogue, carrying no authority for reconciliation but otherwise an ordinary node — is already the record's model for every unanswered node but one shape. What is at issue is whether that one shape is a node at all, or a staging object.

### The ground of the rule as the record states it

`transience` treats the un-aligned disposition as transient: at its recording it becomes an answer, an amendment quoted elsewhere, or nothing. A thing that may become nothing cannot be a parent without leaving its children orphaned, and the rationale prices that failure from the legacy record it rejects: the legacy tactic node was "a completable unit removed on completion", and its measured costs were "durable content stranded on a node about to vanish unless moved by hand" and "edges to a completed node left dangling". The no-children rule is the guard against repeating that.

The author's model denies the premise rather than the inference. If recording a disposition mints a durable question node that the dialogue answers and never dissolves, nothing vanishes, no edge dangles, and the guard is unnecessary. The disagreement is therefore about whether the un-aligned disposition is a staging object or a node in its ordinary sense, and the no-children rule is a consequence, not a first principle.

### What this sitting would amend

`transience`, in the sentence quoted above and in the "or nothing" disjunct that grounds it; `node`, which restates the rule; and `packages/disposition/read.mjs`, whose validation is the instrument. `unanswered` and `authority` are touched only if the answer changes what the status confers, which on the author's own words it does not: they affirm that an unanswered disposition has no authority for reconciliation absent an explicit grant of bootstrap authority, which is what `authority` already says.

The periagogic object is `transience`'s answer and rationale, `node`'s answer, the three frontier findings of 2026-09-03 that contest the sentence's ownership, and the legacy evidence the rationale prices, at `bootstrap/transient-disposition-graph-survey.md`.

### The case that surfaced it, 2026-09-03

`lockfile` was recorded unanswered on the author's direction, and the npm reading owed to it could not be placed under it. The reading went under `materialization` instead, which is defensible on its own terms and is recorded there. Had the rule not bound, the reading would have sat under the question it bears on. This is one instance and is evidence, not an argument: the cost it shows is that a reading owed to an open question must be parked on the question's parent until the question is answered.

### Facts, superseded

Superseded by the section "Answered on the author's ruling, 2026-09-03" below and by the frontmatter, which carry a deferred stamp, a standing answer, and a recommendation; kept as the dialogue's history, as the review of 2026-09-03 found it stale.

Authority none: an un-aligned disposition in the author's words, recorded at their direction and carrying no answer. Boldness low: the rule, its two statements, its instrument, and the legacy evidence are all in the record, and the finding that the rule does not reach the unanswered status generally is verified against the validator's own behaviour. Persistence open, until the author rules.

The movement owed is periagogic and has not been run: what `transience` means by the un-aligned disposition becoming "nothing", and whether the author holds that shape at all, is the author's to articulate against the text.

Also named: `commons.systems/disposition-graph/node`, `commons.systems/disposition-graph/unanswered`, `commons.systems/disposition-graph/authority`, `commons.systems/disposition-graph/lockfile`.

### Answered on the author's ruling, 2026-09-03

The question is answered under the bootstrap authority the author granted the same day, and the stamp is deferred, not ratified: `authority` holds that ratification comes only from the dialectic, whose periagogic and maieutic movements have not run on this node, and that a ratified stamp whose ruling is not in the record is invalid. `evaluation` provides for exactly this case — an overruled deferred answer stays deferred and enters the author's review — so the node stands at the review stage with the clean-context review owed before the author rules.

The account above, written while the rule was thought binding, is left as it stands. It records that the AI treated a deferred answer as fixed, framed the author's challenge inside that frame, and parked a reading on the wrong parent rather than exercising the overrule the record already granted. `fidelity` cites this node as an instance of intention misread under perfect coverage.

One consequence is now due and is not taken here: `npm-committed-lockfile` was placed under `materialization` only because this rule blocked its proper parent. With the rule struck it belongs under `lockfile`, the question it bears on. Moving it is a graph edit that changes what the reading is a reading of, so it is put to the author rather than done silently.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: Why do un-aligned dispositions have no children: an unanswered disposition should be just a disposition plus alignment dialogue state, a class registered for the dialogue that carries no authority for reconciliation unless bootstrap authority is explicitly granted.
Moved to other nodes as alternatives: `no-hard-fail-on-an-unratified-answer` on commons.systems/disposition-graph/instruments; `move-under-lockfile` on commons.systems/disposition-graph/npm-committed-lockfile.
The census unit's note: The node has a standing answer, no draft and a recommendation of standing, and nothing pending on the answer itself: it was answered under the author's bootstrap authority the same day, and the clean-context review on it has not yet run, so no reviewer has proposed a different text. Its two consequences that were deliberately not taken are both changes to other nodes and went to elsewhere, on instruments and on the npm reading. I did not record an entry on node, whose restatement of the no-children rule was already struck in the same landing. One thing the session should see: the node's own Facts section still says 'Authority none' and 'The movement owed is periagogic and has not been run', which the later section and the frontmatter contradict, so the account is stale against its own recommendation.

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

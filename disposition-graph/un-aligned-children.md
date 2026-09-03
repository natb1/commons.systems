---
question: May an un-aligned disposition have children?
stage: periagogic
under:
  - commons.systems/disposition-graph/transience
---
## Disposition

The author, 2026-09-03:
> Why do unaligned dispositions have no children? My expectation is that an unaligned/unanswered disposition is just a disposition + alignment dialogue state. Unanswered is expected to just be a class of disposition that is registered for alignment dialogue and has no authority for reconciliation (unless bootstrap authority is explicitly granted)

## Proposal

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

### Facts

Authority none: an un-aligned disposition in the author's words, recorded at their direction and carrying no answer. Boldness low: the rule, its two statements, its instrument, and the legacy evidence are all in the record, and the finding that the rule does not reach the unanswered status generally is verified against the validator's own behaviour. Persistence open, until the author rules.

The movement owed is periagogic and has not been run: what `transience` means by the un-aligned disposition becoming "nothing", and whether the author holds that shape at all, is the author's to articulate against the text.

Also named: `commons.systems/disposition-graph/node`, `commons.systems/disposition-graph/unanswered`, `commons.systems/disposition-graph/authority`, `commons.systems/disposition-graph/lockfile`.

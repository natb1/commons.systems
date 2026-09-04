---
question: What does a code review approval pinned to a revision say about a verdict that has gone stale, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: The practice of tying a review approval to the revision it read. Gerrit Code Review, where a new patch set drops the review scores given on the previous one unless the project's copy condition holds that the change was trivial; the branch-protection setting of GitHub pull requests that dismisses stale approvals when new commits are pushed; and Phabricator Differential, where a new diff on an accepted revision returns it to needs-review. Locus to be checked, the Gerrit configuration key by name and the version it took its present form in, and whether Differential's behaviour is configurable in the same way as the other two.
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
---
## Answer

Supports pinning the verdict to what was read, and gives the reason in the form the record uses. An approval is an act on a particular text and not on a name. Once the text moves, the approval says something about a document that no longer exists, and the failure the practice guards against is nobody noticing: the approval is still displayed, the reader trusts it, and the change that lands is not the change that was read. So the systems tie the vote to the revision and drop or mark it when a new one arrives, which converts a silent staleness into a visible one.

The record takes exactly that. `review.of` is the pin of the recommendation the reviewer read, and a recommendation changed since is shown as changed on the frontier and on the alignment page, so a forwarded verdict cannot be quietly carried onto text the reader never saw. The same device is used a second time on the ruling, whose `of` is the pin of the recommendation the author answered, so a recommendation moved after a ruling returns the node for re-confirmation instead of inheriting the confirmation.

Where the record is more exact than the practice, and the tradition supports it. A revision-scoped rule treats every change to the artifact as staling, which is why these systems all carry an escape for the trivial case. The record scopes the pin to what was recommended and why rather than to the whole node, so an option added beside the recommendation does not stale a review, and a status marked or a reason recorded does not either. That is the copy-condition idea made structural rather than configurable, and it is what the practice's escape hatch was reaching for.

The counter is the one the practice has never settled. Deciding what change is substantive is a judgment, and Gerrit's answer is a configuration each project sets differently, which is an admission that no rule fits. Here the judgment is the drafting session's, made about its own edit, and the party whose text is under review decides whether the reader has to look again. The record's answer is that the pin is content-addressed and derived rather than asserted, so the judgment is about what goes into the recommendation and not about whether to re-run the reading, which narrows the discretion without removing it.

## Rationale

Named in prose in `commons.systems/disposition-graph/dialogue`'s standing rationale by the sitting of 2026-09-03, "review approvals pinned to a revision in code review, where a new revision marks the approval stale", and left owed as a reading; the fence of 2026-09-04 carries it among the three that sitting named and left owed, which `commons.systems/disposition-graph/prose-and-structure` holds may not stay in prose. It bears on `facts-carry-options`, the option that stands, whose `review` field carries the pin and whose answer already says that a recommendation changed since the review shows as changed while an option added beside it does not; the composed option `every-part-in-the-record` states what the pin covers exactly, and no second relation is written there, the account giving one.

## Facts

### answer

The standing text is the only reading of this practice the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the prose tradition list in `commons.systems/disposition-graph/dialogue`'s standing rationale, which that node's fence of 2026-09-04 carries forward as one of three readings still owed under it. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

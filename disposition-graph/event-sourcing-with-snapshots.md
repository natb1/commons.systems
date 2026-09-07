---
question: Does event sourcing with snapshots ground the fold at the checkpoint and its condition on pushing?
form: reading
stage: review
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
      - name: diverges-on-the-snapshot
        source: review
        ref: "2026-09-07"
    recommends: as-read
    boldness: moderate
    against: "In the tradition the snapshot is a discardable cache beside a stream that is never rewritten; here the accumulated node is the record and the fold rewrites it in place, so the rule against striking unpushed text is evidence that what is struck is state and not a cache, and the relation on the snapshot is a divergence repaired rather than the tradition restated."
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "Event sourcing is a pattern the author may already hold from practice rather than from a paper, in which case the primary reading a deferral queues is a book that does not exist and the queue never clears."
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: 11f1dfc2b498b7bbe240bb17ffff851b4a51556e
  commit: ed7d78d30fc534929dce9c889c9ad08bc1ef1219
  against: "The mapping's weakest joint is the snapshot. In event sourcing the stream and the snapshot are two artifacts: the stream is appended to and never rewritten, and a snapshot is a cache over it that can be deleted at any moment without loss, which is precisely what makes the pattern safe. Here they are one artifact — the accumulated node file is what the dialogue reads, and the \"stream\" is the version control underneath that same file — so the fold does not materialize a view of a record kept elsewhere, it rewrites the record and relies on git to remember. The tell is in the answer itself: it needs a rule that the fold \"refuses to strike anything not already reachable from `origin/disposition`\", and no event-sourced system needs such a rule, because dropping a snapshot there costs nothing. A rule that exists to stop a deletion from being final is evidence that the thing being struck is state and not a cache, which is the property the tradition is being cited to supply. If that holds, \"The answer takes every part\" overstates: the relation is adoption on the journal and the fold, and divergence, repaired by the record's own condition, on the snapshot."
under:
  - commons.systems/disposition-graph/unconfirmed-accumulation
source: Event sourcing with snapshots, as described by Martin Fowler and by Greg Young; behind it the write-ahead log and the accountant's journal and ledger.
bears:
  - fact: answer
    option: the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed
    relation: adopted
---
## Answer

Supports on the fold, and is silent on absorption. The tradition holds that the append-only stream of events is the system of record, that current state is a fold over that stream, and that a snapshot is a materialized fold taken at a point in the stream so that a reader replays only what came after it. The answer takes every part: git is the journal, the accumulated node is the snapshot, the manifest line is the pointer from the snapshot back into the stream, and a session that needs what the fold struck replays from the commit the line names. The relation recorded on the option is `adopted` for the fold and its condition, which is what the tradition decides; the absorption rule the same option carries is outside the tradition's reach and no part of what this reading supports. The tradition's own condition is the answer's condition on pushing: a snapshot must be derivable from the stream, or it becomes a second record that can itself drift, so the fold refuses to strike anything not already reachable from `origin/disposition`, since text struck before it is in the stream is not snapshotted but lost. The tradition offers no rule for absorption, which rewrites rather than folds, and the answer's rule that absorption never runs unattended is the answer's own.

## Rationale

Recorded in the maieutic movement on `unconfirmed-accumulation`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; deferred because the attributions are the part of this reading the record cannot check, and the primary reading a deferral queues is what would settle them.

## Facts

### answer

`as-read` is the only reading of this tradition on the record and it is recommended because the mapping it makes is checkable part by part against the option it bears on: journal, snapshot, pointer and replay each name something `the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed` already has, and the condition on pushing is the tradition's own derivability condition rather than an addition to it. Boldness moderate, on the relation, which is what the fact recommends: the mapping is checkable part by part against the option. The citation risk is carried where it belongs, in `source`, which names Fowler and Young without the years the survey behind it did not license, in the account, and in the authority fact's argument; that survey recorded the attributions at moderate confidence only, both being widely used and loosely attributed patterns, and at high confidence on write-ahead logging as the ancestor. The case against is on the fact.

#### diverges-on-the-snapshot

Supports on the journal and the fold, departs on the snapshot, and is silent on absorption. The tradition holds that an append-only stream is the system of record and that current state is a fold over it, and the answer takes both: git is the journal and a session that needs what the fold struck replays from the commit the manifest line names. It departs on the snapshot. In the tradition a snapshot is a discardable cache held apart from a stream that is never rewritten, so losing one costs only time; here the accumulated node is the record the dialogue reads and the fold rewrites it in place, with the stream underneath it rather than beside it. That is why the answer needs a rule against striking unpushed text, a rule the tradition never needs, and the rule is the record's own answer to a risk the tradition does not run. The condition on pushing is therefore a divergence repaired rather than the tradition's derivability condition restated.

**AI support.** It is the counter-argument of the clean-context reading of abb15a3e, recorded so the author can rule for it: a rule that exists to stop a deletion from being final is evidence that the thing struck is state and not a cache, which is the property the tradition is cited to supply.

**AI divergence.** The condition on pushing is the same condition under either reading, and the recommended reading holds that a snapshot which must be derivable from the stream is what the tradition already requires, the record's rule being that requirement applied to a snapshot the dialogue happens to read; the two divide on the name of the condition and not on its content.

### authority

Deferred, and here the deferral is aimed at the `source` field rather than at the relation. The mapping onto the fold is the part the record can check; the attributions are the part it cannot, and they are the part this reading states more precisely than the survey behind it did. Delegating would put the citation beyond further asking on the authority of a session that recorded it at a confidence the survey did not give it. Boldness moderate: the class follows `class-recommendation`'s test, whose expensive and irreversible limbs `readings`' re-grasp trigger answers, and the judgement that the capture limb does not bite is the AI's own, a reading's claim being answerable against a text the author can open. The case against is on the fact.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the snapshot and its derivability, not the command and query separation the tradition is usually named for, which the record does not adopt.

### Clean-context review, 2026-09-07, of 11f1dfc2

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `as-read`.

Findings:

- `## Rationale` gives a reason for a class the node does not recommend. It reads "Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.", while the authority fact recommends `deferred` and argues for it at length: "Deferred, and here the deferral is aimed at the `source` field rather than at the relation." The author reading top to bottom meets the rationale first and is told the node is delegated. Suggested edit: replace "delegated because the relation is the AI's reading of a source the author may check" with "deferred because the attributions are the part of this reading the record cannot check, and the primary reading a deferral queues is what would settle them". The same sentence stands verbatim on the wave sibling `commons.systems/disposition-graph/blocking-and-canopies`, whose authority fact also recommends `deferred`, so it is one edit owed in two places and worth checking across every reading minted this sitting.
- The node records a citation it tells the reader is unsupported, and leaves it standing. The frontmatter `source` reads "Event sourcing and CQRS as described by Fowler (2005) and Young (2010); behind them the write-ahead log and the accountant's journal and ledger.", while the answer fact's own prose says "this node's `source` gives Fowler a year of 2005 and Young a year of 2010 — more precision than the survey licensed and none of it in the record." A reading is read for its source, so the field is the load-bearing part, and reporting the defect in a fact's prose does not repair the field: the projection and any later reader take the years as the record's. The same field names CQRS, which the account then withdraws — "The locus is the snapshot and its derivability, not the command and query separation the tradition is usually named for, which the record does not adopt." Suggested edit: set `source` to "Event sourcing with snapshots, as described by Martin Fowler and by Greg Young; behind it the write-ahead log and the accountant's journal and ledger.", and delete from the answer fact's prose the sentence reporting the years, which the edit makes false.
- The boldness on the answer fact reports a risk that is not the fact's. It is `high`, defended as "Boldness high, and the reason is the citation and not the relation.", and the fact's own `against` answers it: "The pattern's content is not in doubt even where its attribution is, and the reading's substance is a mapping onto an option in the record, so a boldness of high reports a citation risk as though it were a risk to the relation." The against is right on the record's own vocabulary: boldness is the AI's confidence in what it recommends, and what is recommended here is the relation, which the node itself calls "checkable part by part against the option it bears on". A single number cannot carry two confidences, and the author cannot tell from it which one it reports. Suggested edit: with the `source` corrected as in the finding above, set boldness to `moderate` and keep the citation risk where it belongs, in the account and in the authority fact's argument, which already says "the attributions are the part it cannot [check]".
- The `bears` entry records `adopted` on the whole of `commons.systems/disposition-graph/unconfirmed-accumulation#answer#the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed`, but that option decides absorption as well as the fold — its text reads "Absorption is a separate pass and never runs unattended, because a rewrite is not a deletion and cannot be undone by fetching the old bytes" — and this reading's first sentence says of that part "Supports on the fold, and is silent on absorption", closing with "The tradition offers no rule for absorption, which rewrites rather than folds, and the answer's rule that absorption never runs unattended is the answer's own." So the stored relation asserts support across a decision the reading says the tradition does not reach, and the option row will project as tradition-backed in a part where nothing backs it. Suggested edit: say in `## Answer` exactly what the single relation claims, e.g. after "The answer takes every part" add "and the relation recorded on the option is `adopted` for the fold and its condition, which is what the tradition decides; the absorption rule the same option carries is outside the tradition's reach and no part of what this reading supports." If the record wants the narrower claim stored rather than said, that is a question for `commons.systems/disposition-graph/readings` and not for this node.
- A viable option is missing on the answer fact, which carries only `as-read`. The reading in the counter-argument below — adopted on the journal and the fold, diverged on the snapshot — is a second reading of the same sources that a session could hold in good faith, and while it stands nowhere the author cannot rule for it. Proposed option `diverges-on-the-snapshot`, source review, ref 2026-09-07, with the prose: "Supports on the journal and the fold, departs on the snapshot, and is silent on absorption. The tradition holds that an append-only stream is the system of record and that current state is a fold over it, and the answer takes both: git is the journal and a session that needs what the fold struck replays from the commit the manifest line names. It departs on the snapshot. In the tradition a snapshot is a discardable cache held apart from a stream that is never rewritten, so losing one costs only time; here the accumulated node is the record the dialogue reads and the fold rewrites it in place, with the stream underneath it rather than beside it. That is why the answer needs a rule against striking unpushed text, a rule the tradition never needs, and the rule is the record's own answer to a risk the tradition does not run. The condition on pushing is therefore a divergence repaired rather than the tradition's derivability condition restated."

On the facts and what they recommend: The answer fact recommends `as-read`, which also `stands`, so the absent `## Recommendation` fence is correct; its boldness is `high` and, by the fact's own against, misplaced — it reports the citation risk rather than confidence in the relation, and the relation is what is recommended. The authority fact recommends `deferred` at moderate boldness, which is the right reading of `class-recommendation` here (a wrong reading is neither expensive nor irreversible under `readings`' re-grasp trigger, and a claim answerable against a text the author can open is not capture-shaped) and its against is the real risk, that a deferral queues a primary reading of a pattern that lives in practice rather than in a book — but `## Rationale` says the class is delegated. No existence or persistence fact is right for a newly minted reading whose shape is not in question, and neither reading has pinned this text, so nothing is stale.

On the viability of the options: Every option listed is viable: `as-read` is a defensible reading, and the three reserved authority options are the record's own vocabulary. One viable option is missing on the answer fact — the reading that adopts the tradition on the journal and the fold but records a divergence on the snapshot, on the ground that the tradition's snapshot is a discardable cache beside an immutable stream while the accumulated node is the record itself. Its prose is given in the fifth finding; it is the reading this review's counter-argument makes, and as the node stands the author has nothing to rule for but the one mapping.

Strongest counter-argument (moderate): The mapping's weakest joint is the snapshot. In event sourcing the stream and the snapshot are two artifacts: the stream is appended to and never rewritten, and a snapshot is a cache over it that can be deleted at any moment without loss, which is precisely what makes the pattern safe. Here they are one artifact — the accumulated node file is what the dialogue reads, and the "stream" is the version control underneath that same file — so the fold does not materialize a view of a record kept elsewhere, it rewrites the record and relies on git to remember. The tell is in the answer itself: it needs a rule that the fold "refuses to strike anything not already reachable from `origin/disposition`", and no event-sourced system needs such a rule, because dropping a snapshot there costs nothing. A rule that exists to stop a deletion from being final is evidence that the thing being struck is state and not a cache, which is the property the tradition is being cited to supply. If that holds, "The answer takes every part" overstates: the relation is adoption on the journal and the fold, and divergence, repaired by the record's own condition, on the snapshot.

The session's reply: The counter is recorded as the option `diverges-on-the-snapshot` and as the case against the recommended reading. The condition on pushing is the same condition under either reading; what the two divide on is whether it is the tradition's derivability condition restated or a divergence the record repairs with a rule the tradition never needs, and that is the choice the row now puts before the author.

### Repaired after the reading of abb15a3e, 2026-09-07

All five findings applied. The rationale's class now matches the authority fact. `source` names Fowler and Young without the years the survey did not license and without CQRS, which the account had already withdrawn, and the fact prose that reported the years is replaced. The answer fact's boldness is moderate, on the relation, the citation risk being carried in `source`, in the account and in the authority fact's argument; the fact's case against is now the reading's counter, the snapshot as state rather than cache, which is also recorded as the option `diverges-on-the-snapshot`, source review. The answer says what the single relation claims: the fold and its condition, and not the absorption rule. The reply to the counter is on the reading's entry above. The amendment is the object of the reading this entry owes.

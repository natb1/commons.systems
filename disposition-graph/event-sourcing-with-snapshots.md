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
    recommends: as-read
    boldness: high
    against: "The pattern's content is not in doubt even where its attribution is, and the reading's substance is a mapping onto an option in the record, so a boldness of high reports a citation risk as though it were a risk to the relation."
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "Event sourcing is a pattern the author may already hold from practice rather than from a paper, in which case the primary reading a deferral queues is a book that does not exist and the queue never clears."
under:
  - commons.systems/disposition-graph/unconfirmed-accumulation
source: Event sourcing and CQRS as described by Fowler (2005) and Young (2010); behind them the write-ahead log and the accountant's journal and ledger.
bears:
  - fact: answer
    option: the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed
    relation: adopted
---
## Answer

Supports on the fold, and is silent on absorption. The tradition holds that the append-only stream of events is the system of record, that current state is a fold over that stream, and that a snapshot is a materialized fold taken at a point in the stream so that a reader replays only what came after it. The answer takes every part: git is the journal, the accumulated node is the snapshot, the manifest line is the pointer from the snapshot back into the stream, and a session that needs what the fold struck replays from the commit the line names. The tradition's own condition is the answer's condition on pushing: a snapshot must be derivable from the stream, or it becomes a second record that can itself drift, so the fold refuses to strike anything not already reachable from `origin/disposition`, since text struck before it is in the stream is not snapshotted but lost. The tradition offers no rule for absorption, which rewrites rather than folds, and the answer's rule that absorption never runs unattended is the answer's own.

## Rationale

Recorded in the maieutic movement on `unconfirmed-accumulation`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.

## Facts

### answer

`as-read` is the only reading of this tradition on the record and it is recommended because the mapping it makes is checkable part by part against the option it bears on: journal, snapshot, pointer and replay each name something `the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed` already has, and the condition on pushing is the tradition's own derivability condition rather than an addition to it. Boldness high, and the reason is the citation and not the relation. The tradition survey of 2026-09-07 recorded the attributions at moderate confidence only, both being widely used and loosely attributed patterns, and at high confidence only on write-ahead logging as the ancestor, while this node's `source` gives Fowler a year of 2005 and Young a year of 2010 — more precision than the survey licensed and none of it in the record. What rests on the AI's unrecorded knowledge is therefore total on the attribution and near-total on the pattern's content, and a reading is read for its source. The case against is on the fact.

### authority

Deferred, and here the deferral is aimed at the `source` field rather than at the relation. The mapping onto the fold is the part the record can check; the attributions are the part it cannot, and they are the part this reading states more precisely than the survey behind it did. Delegating would put the citation beyond further asking on the authority of a session that recorded it at a confidence the survey did not give it. Boldness moderate: the class follows `class-recommendation`'s test, whose expensive and irreversible limbs `readings`' re-grasp trigger answers, and the judgement that the capture limb does not bite is the AI's own, a reading's claim being answerable against a text the author can open. The case against is on the fact.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the snapshot and its derivability, not the command and query separation the tradition is usually named for, which the record does not adopt.

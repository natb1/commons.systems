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
    boldness: moderate
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
under:
  - commons.systems/disposition-graph/unconfirmed-accumulation
source: Event sourcing and CQRS as described by Fowler (2005) and Young (2010); behind them the write-ahead log and the accountant's journal and ledger.
bears:
  - fact: answer
    option: the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed
    relation: adopted
---
## Answer

Supports, whole. The tradition holds that the append-only stream of events is the system of record, that current state is a fold over that stream, and that a snapshot is a materialized fold taken at a point in the stream so that a reader replays only what came after it. The answer takes every part: git is the journal, the accumulated node is the snapshot, the manifest line is the pointer from the snapshot back into the stream, and a session that needs what the fold struck replays from the commit the line names. The tradition's own condition is the answer's condition on pushing: a snapshot must be derivable from the stream, or it becomes a second record that can itself drift, so the fold refuses to strike anything not already reachable from `origin/disposition`, since text struck before it is in the stream is not snapshotted but lost. The tradition offers no rule for absorption, which rewrites rather than folds, and the answer's rule that absorption never runs unattended is the answer's own.

## Rationale

Recorded in the maieutic movement on `unconfirmed-accumulation`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the snapshot and its derivability, not the command and query separation the tradition is usually named for, which the record does not adopt.

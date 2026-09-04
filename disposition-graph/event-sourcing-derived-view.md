---
question: What does event sourcing say about a status that is derived rather than stored, and what does the record take from it?
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
  - commons.systems/disposition-graph/viable-options
source: Event sourcing and the derived read model. Fowler, "Event Sourcing" (2005) and "CQRS" (2011); the command-query separation literature that grew around Young's work from about 2010; and the same shape treated as a general principle in Kleppmann, Designing Data-Intensive Applications (2017), the chapter on stream processing, where the log of events is the system of record and every view over it is a materialized projection that can be discarded and rebuilt.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
---
## Answer

Supports the derivation, and carries the warning that comes with it. The pattern's claim is that the durable thing is the sequence of recorded facts, and that any current-state view is a fold over that sequence: the view is convenient, it may be cached, and it is never the source of truth. Two properties follow and both matter here. A view can be thrown away and rebuilt from the log, so a bug in the fold is repaired by re-deriving rather than by migrating; and a view that has drifted from the log is wrong by definition, since the log is what happened.

The record adopts it for the class. A node's authority is a fold over the rulings recorded on its facts, and no stamp is written beside them, so ratified, delegated, deferred and unanswered are read rather than stored. The reason the record gives is the reason the pattern gives, that a stored copy of a derived value drifts and there is then no way to tell which of the two is right. The two frontiers are the same shape, folds over the record's own state that nothing stores.

The warning is the pattern's known cost and the record takes it as stated: with the view derived, every reader must derive it the same way. In a system with one code path that is a design rule; here the readers are the projector, the two skills, a session reading a node by hand, and the author, and a second implementation of the fold is a second truth. What the record does about it is keep the derivation in one place and treat any other derivation of the class as an implementation to be liquidated, which is a rule and not a mechanism.

The scope stops short of the rest of the pattern. Event sourcing normally means an append-only log with events never rewritten, and this record is a git history of node files that alignment edits in place; the fold is over the rulings a node currently carries, not over an immutable stream. What is adopted is derive-the-view-never-store-it, and the immutability that usually accompanies it is version control's, at a coarser grain.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for the class as a projection of recorded rulings, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, which is the one that reads the class off the rulings rather than storing it.

## Facts

### answer

The standing text is the only reading of this pattern the record has produced,
and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "event sourcing and the derived view, adopted for the class as a projection of recorded rulings, with the warning that every reader must derive it the same way". Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

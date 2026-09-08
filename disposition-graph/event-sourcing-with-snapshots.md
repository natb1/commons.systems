---
question: Does event sourcing with snapshots ground the fold at the checkpoint and its condition on pushing?
form: reading
stage: maieutic
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
  strength: weak
  date: 2026-09-07
  of: 20f9748faeeea059d3466f12ff5fe4b211e1f2d8
  commit: 7f9b25de3b0b74095c1dad1fd76824f5b6b814c5
  against: "All five of the previous reading's findings are answered essentially verbatim against their suggested edits: the rationale/authority agreement, the `source` field's years and CQRS, the boldness figure and its `against`, the `## Answer` sentence scoping the `bears` relation away from absorption, and the new option. The remaining soft point is the same pattern seen on the sibling `blocking-and-canopies`: the answer fact's new `against` and the new option `diverges-on-the-snapshot` restate nearly the same argument (snapshot as state rather than cache) in two places, which is the shape finding five itself asked for (an argument on record both as a case-against and as a rulable option) rather than an unexplained duplication."
  survey:
    date: 2026-09-07
    of: 20f9748faeeea059d3466f12ff5fe4b211e1f2d8
    commit: 6611799a1dd6276691cf61f482c8e593f0234200
    text:
      question: "894fec7c0a7bbaba00b8c70ba56978ae94469a5dfde2a95ed7fc5a9aef4cd191"
      answer: "d28c0bb1f25e435a56286fd7531d1432c1c592c994d552db1bac5e0d171550b3"
      options: "3a7a2805213a3118e4938263a33ff91c2e81021065e0de10b40ecb7403afad4c"
      rivals: "65b1b9345270d52db283557be542dc50a21c188355174aef17249903d11911c5"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    findings:
      - finding: "Five judged nodes stand at the ruling stage on ground still at the maieutic stage without saying so, which the thirteenth validation forbids: \"no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so\". `tolerated-inconsistency` and `verifying-traces-and-early-cutoff` each bear on `commons.systems/disposition-graph/dialogue#answer#the-survey-block-carries-what-the-next-survey-selects-on (adopted)`; `unconfirmed-accumulation` depends on `commons.systems/disposition-graph/dialogue#an-option-carries-its-content-its-words-and-its-case`; `event-sourcing-with-snapshots` stands under `unconfirmed-accumulation` which does; and `madr-decision-records` stands under `dialogue` and depends on `viable-options`. The brief lists the ground as \"commons.systems/disposition-graph/dialogue | unanswered | stage maieutic | rank 0.0017 | settles 31\". The author would rule five nodes whose ground has no drafted answer."
        kind: "placement"
        status: "new"
        since: "2026-09-07"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/event-sourcing-with-snapshots"
          - "commons.systems/disposition-graph/tolerated-inconsistency"
          - "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
          - "commons.systems/disposition-graph/madr-decision-records"
          - "commons.systems/disposition-graph/unconfirmed-accumulation"
          - "commons.systems/disposition-graph/dialogue"
          - "commons.systems/disposition-graph/viable-options"
    pairs:
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
          - "term:delegated (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "term:expensive (defines: commons.systems/disposition-graph/class-recommendation)"
          - "term:irreversible (defines: commons.systems/disposition-graph/class-recommendation)"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:maieutic (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:evidence (defines: commons.systems/disposition-graph/instruments)"
          - "term:re-grasp (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "term:ledger (defines: commons.systems/disposition-graph/quotes)"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
          - "term:tradition (defines: commons.systems/disposition-graph/readings)"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "term:fold (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
          - "term:manifest line (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
          - "cites"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:bite (defines: commons.systems/disposition-graph/work-loop)"
      - with: "commons.systems/public/agency"
        keys:
          - "term:capture (defines: commons.systems/public/agency)"
under:
  - commons.systems/disposition-graph/unconfirmed-accumulation
source: Event sourcing with snapshots, as described by Martin Fowler and by Greg Young; behind it the write-ahead log and the accountant's journal and ledger.
bears:
  - fact: answer
    option: the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed
    relation: adopted
---

## Facts

### answer

`as-read` is the only reading of this tradition on the record and it is recommended because the mapping it makes is checkable part by part against the option it bears on: journal, snapshot, pointer and replay each name something `the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed` already has, and the condition on pushing is the tradition's own derivability condition rather than an addition to it. Boldness moderate, on the relation, which is what the fact recommends: the mapping is checkable part by part against the option. The citation risk is carried where it belongs, in `source`, which names Fowler and Young without the years the survey behind it did not license, in the account, and in the authority fact's argument; that survey recorded the attributions at moderate confidence only, both being widely used and loosely attributed patterns, and at high confidence on write-ahead logging as the ancestor. The case against is on the fact.

#### as-read

Supports on the fold, and is silent on absorption.

**AI support.** Recorded in the maieutic movement on `unconfirmed-accumulation`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; deferred because the attributions are the part of this reading the record cannot check, and the primary reading a deferral queues is what would settle them.

**AI divergence.** In the tradition the snapshot is a discardable cache beside a stream that is never rewritten; here the accumulated node is the record and the fold rewrites it in place, so the rule against striking unpushed text is evidence that what is struck is state and not a cache, and the relation on the snapshot is a divergence repaired rather than the tradition restated.

**Content.**

```markdown
---
question: Does event sourcing with snapshots ground the fold at the checkpoint and its condition on pushing?
form: reading
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
```

#### diverges-on-the-snapshot

Supports on the journal and the fold, departs on the snapshot, and is silent on absorption. The tradition holds that an append-only stream is the system of record and that current state is a fold over it, and the answer takes both: git is the journal and a session that needs what the fold struck replays from the commit the manifest line names. It departs on the snapshot. In the tradition a snapshot is a discardable cache held apart from a stream that is never rewritten, so losing one costs only time; here the accumulated node is the record the dialogue reads and the fold rewrites it in place, with the stream underneath it rather than beside it. That is why the answer needs a rule against striking unpushed text, a rule the tradition never needs, and the rule is the record's own answer to a risk the tradition does not run. The condition on pushing is therefore a divergence repaired rather than the tradition's derivability condition restated.

**AI support.** It is the counter-argument of the clean-context reading of abb15a3e, recorded so the author can rule for it: a rule that exists to stop a deletion from being final is evidence that the thing struck is state and not a cache, which is the property the tradition is cited to supply.

**AI divergence.** The condition on pushing is the same condition under either reading, and the recommended reading holds that a snapshot which must be derivable from the stream is what the tradition already requires, the record's rule being that requirement applied to a snapshot the dialogue happens to read; the two divide on the name of the condition and not on its content.

**Content.**

```markdown
---
question: Does event sourcing with snapshots ground the fold at the checkpoint and its condition on pushing?
form: reading
under:
  - commons.systems/disposition-graph/unconfirmed-accumulation
source: Event sourcing with snapshots, as described by Martin Fowler and by Greg Young; behind it the write-ahead log and the accountant's journal and ledger.
bears:
  - fact: answer
    option: the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed
    relation: adopted
---

## Answer

Supports on the journal and the fold, departs on the snapshot, and is silent on absorption. The tradition holds that an append-only stream is the system of record and that current state is a fold over it, and the answer takes both: git is the journal and a session that needs what the fold struck replays from the commit the manifest line names. It departs on the snapshot. In the tradition a snapshot is a discardable cache held apart from a stream that is never rewritten, so losing one costs only time; here the accumulated node is the record the dialogue reads and the fold rewrites it in place, with the stream underneath it rather than beside it. That is why the answer needs a rule against striking unpushed text, a rule the tradition never needs, and the rule is the record's own answer to a risk the tradition does not run. The condition on pushing is therefore a divergence repaired rather than the tradition's derivability condition restated.
```

### authority

Deferred, and here the deferral is aimed at the `source` field rather than at the relation. The mapping onto the fold is the part the record can check; the attributions are the part it cannot, and they are the part this reading states more precisely than the survey behind it did. Delegating would put the citation beyond further asking on the authority of a session that recorded it at a confidence the survey did not give it. Boldness moderate: the class follows `class-recommendation`'s test, whose expensive and irreversible limbs `readings`' re-grasp trigger answers, and the judgement that the capture limb does not bite is the AI's own, a reading's claim being answerable against a text the author can open. The case against is on the fact.

## Account

### Manifest

- Folded: Minted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 11f1dfc2, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of abb15a3e, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 24ef5703

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `as-read`.

Findings:


On the facts and what they recommend: The diff leaves `recommends` unchanged (`as-read` on answer, `deferred` on authority) and `as-read` still `stands`, so no `## Recommendation` fence is warranted; it drops the answer fact's boldness from `high` to `moderate` and rewrites its `against` from a citation-risk complaint to the substantive snapshot-as-state counter-argument, adds the viable option `diverges-on-the-snapshot` (source review), fixes `source` to drop the unlicensed years and the withdrawn CQRS attribution, adds a sentence to `## Answer` scoping the stored `bears` relation to the fold and its condition rather than to absorption, and corrects the rationale's class word from `delegated` to `deferred`.

On the viability of the options: Every option remains viable: `as-read` is still a defensible mapping, the new option `diverges-on-the-snapshot` is a genuine second reading of the same sources rather than a duplicate, and the three reserved authority options are untouched record vocabulary.

Strongest counter-argument (weak): All five of the previous reading's findings are answered essentially verbatim against their suggested edits: the rationale/authority agreement, the `source` field's years and CQRS, the boldness figure and its `against`, the `## Answer` sentence scoping the `bears` relation away from absorption, and the new option. The remaining soft point is the same pattern seen on the sibling `blocking-and-canopies`: the answer fact's new `against` and the new option `diverges-on-the-snapshot` restate nearly the same argument (snapshot as state rather than cache) in two places, which is the shape finding five itself asked for (an argument on record both as a case-against and as a rulable option) rather than an unexplained duplication.

### The session's reply to the re-reading of 24ef5703, 2026-09-07

Recorded in its own entry because the apply that landed the reading carried no reply, the replies file it was given being another wave's. The residual the counter names, that the case against and the new option say one argument twice, is the shape the previous reading asked for: the case against is what the recommended row carries and the option is what the author can rule for, and the two are the same argument by design.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/event-sourcing-with-snapshots stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `as-read`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `diverges-on-the-snapshot`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `24ef57032196a1b7085aee9abe49c5fb09b0acde` is re-computed for the encoding as `c577f43f6f010c78428517f36ab6944cb698e9da`; nothing it read changed.

### Frontier survey, 2026-09-07, of c577f43f

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Placement and order (13). This reading stands at the ruling stage under `unconfirmed-accumulation` and bears on `commons.systems/disposition-graph/unconfirmed-accumulation#answer#the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed (adopted)`, whose own node depends on `commons.systems/disposition-graph/dialogue#an-option-carries-its-content-its-words-and-its-case`, a node the brief lists at "stage maieutic". Neither node says it rests on ground still at the maieutic stage.
- Coverage (14). No survey has ever read this node — its review state carries no survey entry — so the reading reaches the author's ruling with only the per-draft half of the two readings `recording` requires: "Per fact, after two readings, and never in the AI's own hand."

Strongest counter-argument (moderate): The answer is "Supports on the fold, and is silent on absorption.", and silence is the weak point: event sourcing's snapshot is a derived cache that never destroys the log, whereas the fold this reading supports discards the material it folds, so the tradition supports the shape and not the irreversibility. A reader could hold that the tradition, read whole, is a divergence rather than a support, since its whole force is that the events survive the snapshot.

### Frontier finding, 2026-09-07

Kind: placement.

Five judged nodes stand at the ruling stage on ground still at the maieutic stage without saying so, which the thirteenth validation forbids: "no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so". `tolerated-inconsistency` and `verifying-traces-and-early-cutoff` each bear on `commons.systems/disposition-graph/dialogue#answer#the-survey-block-carries-what-the-next-survey-selects-on (adopted)`; `unconfirmed-accumulation` depends on `commons.systems/disposition-graph/dialogue#an-option-carries-its-content-its-words-and-its-case`; `event-sourcing-with-snapshots` stands under `unconfirmed-accumulation` which does; and `madr-decision-records` stands under `dialogue` and depends on `viable-options`. The brief lists the ground as "commons.systems/disposition-graph/dialogue | unanswered | stage maieutic | rank 0.0017 | settles 31". The author would rule five nodes whose ground has no drafted answer.

Also named: commons.systems/disposition-graph/tolerated-inconsistency, commons.systems/disposition-graph/verifying-traces-and-early-cutoff, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/unconfirmed-accumulation, commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/viable-options.

Proposed: No merge and no survivor: the placement is corrected by the record saying so. Either `dialogue` is advanced to the ruling stage before the five are put to the author, or each of the five states in its answer that it rests on a `dialogue` option still at the maieutic stage and what it would lose if that option moves. The ruling order is derived from the placement, as `alignment-order` requires, and is not recommended here in prose.

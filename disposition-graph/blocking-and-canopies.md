---
question: Do blocking and canopies ground the candidate pairs, and where does the answer depart from them?
form: reading
stage: ruling
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
      - name: supports-the-nomination-and-is-chosen-over-on-the-partition
        source: review
        ref: "2026-09-07"
    recommends: as-read
    boldness: moderate
    against: "A divergence recorded where the tradition is out of scope overstates what the author decided against: record linkage partitions because the corpus is too large for anything else, so a corpus that is not too large is a case Fellegi and Sunter never addressed rather than one they would decide the other way."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "Both sources are high-confidence and the divergence half rests on the record rather than on them, so the primary reading a deferral queues would confirm what is least in doubt and check nothing that is."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 3ed3f788f16dfb67d2c63f33cc75f58f0abeb3cb
  commit: 7f9b25de3b0b74095c1dad1fd76824f5b6b814c5
  against: "All five of the previous reading's findings are answered essentially verbatim against their suggested edits: the rationale/authority class agreement, the `bears` relation and closing sentence on `several-readers-over-a-partition`, the new option, and the removal of the appeal to a survey not in the record. The one soft residual is that after the fix, `as-read` (which stands) and the new option `supports-the-nomination-and-is-chosen-over-on-the-partition` now carry nearly identical `bears` entries and very similar prose, distinguished only by whether the answer calls the partition a genuine divergence the record repairs or an out-of-scope case the tradition never decided; the account's new 'AI divergence' paragraph names this distinction explicitly, so it is not a defect the diff leaves unexplained, only a close call worth the author's attention when choosing between the two."
under:
  - commons.systems/disposition-graph/survey-selection
source: Fellegi and Sunter, A theory for record linkage, JASA 64(328), 1969, on blocking; McCallum, Nigam and Ungar, Efficient clustering of high-dimensional data sets with application to reference matching, KDD 2000, on canopies.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
---

## Facts

### answer

`as-read` is the only reading of these two sources on the record, and it is recommended because it is the shape that lets the record take the nomination without the partition: the two `bears` entries are both adopted, on `candidate-pairs-with-their-nominating-key`, which the record takes, and on `several-readers-over-a-partition`, which is the tradition's own shape and projects as chosen over, the derivation `readings` fixes for a tradition adopted on an option not chosen; the departure is said in the answer and stored nowhere, since `diverged` names an option that departs from the tradition and the partition does not. The divergence is the reading's substance and not a caveat on it, since a partition is what makes a canopy a canopy and the record refuses exactly that. Boldness moderate: the tradition half rests wholly on the AI's knowledge of Fellegi and Sunter and of McCallum, Nigam and Ungar, in which the AI's own confidence is high on both, the survey that surfaced them not being part of the record, and the divergence half is an argument about this record's size and its reader that any reader can check against `survey-selection`'s own paragraph on the candidate pairs. The case against is on the fact.

#### as-read

Supports as nomination and diverges as partition.

**AI support.** Recorded in the maieutic movement on `survey-selection`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; deferred because the relation is the AI's reading of sources the author has not opened, and the primary reading is queued rather than waived.

**AI divergence.** A divergence recorded where the tradition is out of scope overstates what the author decided against: record linkage partitions because the corpus is too large for anything else, so a corpus that is not too large is a case Fellegi and Sunter never addressed rather than one they would decide the other way.

**Content.**

```markdown
---
question: Do blocking and canopies ground the candidate pairs, and where does the answer depart from them?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: Fellegi and Sunter, A theory for record linkage, JASA 64(328), 1969, on blocking; McCallum, Nigam and Ungar, Efficient clustering of high-dimensional data sets with application to reference matching, KDD 2000, on canopies.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
---

## Answer

Supports as nomination and diverges as partition. The tradition holds that when an expensive comparator cannot be run over every pair of a corpus, cheap keys, unioned, propose the pairs it is spent on: a blocking key groups records that agree on a cheap feature, a canopy is the same with an overlapping and approximate grouping, and pairs sharing no key are never compared. The answer adopts the nomination whole, a defined term shared, an entry of the author's words referenced on both, a citation, a shared parent and near-duplicate resemblance being the keys, each pair handed to the reader with the key that nominated it. It diverges on the partition: in record linkage a pair no block or canopy contains is never compared, because the corpus is too large for anything else; here every node stays readable, the pair list orders the reader's attention rather than bounding it, and a finding on a pair no key nominated is the one worth most. The tradition supports the several-readers option and the record is chosen over it: a partition is what makes a canopy a canopy, and at this size a key's value is telling one reader where to look, not making the problem tractable for several.
```

#### supports-the-nomination-and-is-chosen-over-on-the-partition

The same reading with the relations placed as `readings` places them. The tradition is taken whole for the nomination, cheap keys unioned to propose the pairs an expensive comparator is spent on, and the record departs from nothing the sources decided: they partition because the corpus admits no alternative, so a corpus small enough to read entire is a case outside their scope rather than one they answer the other way. `several-readers-over-a-partition` is therefore the tradition's own shape on this fact and carries `adopted`, projecting as chosen over, and the record's reason for not taking it — that at this size a key tells one reader where to look rather than making the problem tractable for several — is a statement of scope and not of divergence.

**AI support.** It is the reading the fact's own case against describes, recorded by the clean-context reading of abb15a3e so that the author can rule for it: a divergence recorded where the tradition is out of scope overstates what the author decided against, and Fellegi and Sunter never addressed a corpus that is not too large.

**AI divergence.** The recommended reading keeps the word diverges for the partition in its answer because the record refuses exactly what makes a canopy a canopy, and on that reading the refusal is the reading's substance and not a caveat on it; the two now carry the same `bears` entries and differ in what the answer says the departure is.

**Content.**

```markdown
---
question: Do blocking and canopies ground the candidate pairs, and where does the answer depart from them?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: Fellegi and Sunter, A theory for record linkage, JASA 64(328), 1969, on blocking; McCallum, Nigam and Ungar, Efficient clustering of high-dimensional data sets with application to reference matching, KDD 2000, on canopies.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
---

## Answer

The same reading with the relations placed as `readings` places them. The tradition is taken whole for the nomination, cheap keys unioned to propose the pairs an expensive comparator is spent on, and the record departs from nothing the sources decided: they partition because the corpus admits no alternative, so a corpus small enough to read entire is a case outside their scope rather than one they answer the other way. `several-readers-over-a-partition` is therefore the tradition's own shape on this fact and carries `adopted`, projecting as chosen over, and the record's reason for not taking it — that at this size a key tells one reader where to look rather than making the problem tractable for several — is a statement of scope and not of divergence.
```

### authority

Deferred. The relation here is the AI's reading of two papers the author has not opened, and what a deferral queues is the half of the reading the record cannot check for itself: that blocking and canopies really do work by nomination rather than by filtering is the premise the whole adoption rests on, and nothing in the record confirms it. Delegated would say the author does not want to be asked again about the AI's account of a record-linkage literature, and no words of theirs say that. Boldness moderate: `class-recommendation`'s expensive and irreversible limbs are answered by `readings`' rule that a changed verdict is a re-grasp trigger and not a failure, and the judgement that the capture limb does not bite, a reading's claim being falsifiable against printed sources, is the AI's own. The case against is on the fact.

## Account

### Manifest

- Folded: Minted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of f6fc0de9, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of abb15a3e, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 68e8834b

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `as-read`.

Findings:


On the facts and what they recommend: The diff leaves `recommends` unchanged on both facts (`as-read` on answer, `deferred` on authority) and boldness unchanged (moderate on both); `as-read` still `stands`, so no `## Recommendation` fence is warranted. It adds a new viable option `supports-the-nomination-and-is-chosen-over-on-the-partition` to the answer fact (source review, ref 2026-09-07), flips the `bears` entry on `several-readers-over-a-partition` from `diverged` to `adopted`, rewrites `## Answer`'s closing sentence and the answer fact's boldness sentence to match, and fixes the rationale's class word from `delegated` to `deferred` to agree with the authority fact.

On the viability of the options: Every option remains viable after the diff: `as-read` is still a defensible reading with the corrected `chosen over` framing, the new option is a genuine second reading of the same sources rather than a duplicate that dominates or is dominated, and the three reserved authority options are the record's fixed vocabulary, untouched.

Strongest counter-argument (weak): All five of the previous reading's findings are answered essentially verbatim against their suggested edits: the rationale/authority class agreement, the `bears` relation and closing sentence on `several-readers-over-a-partition`, the new option, and the removal of the appeal to a survey not in the record. The one soft residual is that after the fix, `as-read` (which stands) and the new option `supports-the-nomination-and-is-chosen-over-on-the-partition` now carry nearly identical `bears` entries and very similar prose, distinguished only by whether the answer calls the partition a genuine divergence the record repairs or an out-of-scope case the tradition never decided; the account's new 'AI divergence' paragraph names this distinction explicitly, so it is not a defect the diff leaves unexplained, only a close call worth the author's attention when choosing between the two.

### The session's reply to the re-reading of 68e8834b, 2026-09-07

Recorded in its own entry because the apply that landed the reading carried no reply, the replies file it was given being another wave's. The two readings now differ in what the answer calls the departure and in nothing structural, which is the close call the counter names; the author chooses between the words, and the account's divergence paragraph is where the difference is drawn.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/blocking-and-canopies stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `as-read`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `supports-the-nomination-and-is-chosen-over-on-the-partition`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `68e8834bfd6fb5b88d06fec7d5485e8f6a1dfc97` is re-computed for the encoding as `3ed3f788f16dfb67d2c63f33cc75f58f0abeb3cb`; nothing it read changed.

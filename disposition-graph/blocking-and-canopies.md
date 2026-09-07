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

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The tradition is read for its nomination and the record departs from it on the partition, which is where the two options it bears on divide.

### Clean-context review, 2026-09-07, of f6fc0de9

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `as-read`.

Findings:

- `## Rationale` contradicts the authority fact on the same node. The rationale reads "Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.", while the authority fact recommends `deferred` and its own prose says "Delegated would say the author does not want to be asked again about the AI's account of a record-linkage literature, and no words of theirs say that." One of the two is stale, and the author would read the rationale as the reason for a class the fact does not recommend. Suggested edit: in the rationale, replace "delegated because the relation is the AI's reading of a source the author may check" with "deferred because the relation is the AI's reading of sources the author has not opened, and the primary reading is queued rather than waived". The identical sentence stands on the sibling `commons.systems/disposition-graph/event-sourcing-with-snapshots`, whose authority fact also recommends `deferred`, so the same edit is owed there.
- The `bears` relation recorded on `commons.systems/disposition-graph/survey-selection#answer#several-readers-over-a-partition` is `diverged`, which inverts the vocabulary the `readings` node fixes. That node's answer says the relation is "adopted, where the tradition supports the option, or diverged, where the option departs from it and the reading's own answer says why", and adds "A tradition adopted on an option not chosen is what chosen over names, and it is derived and never stored." `several-readers-over-a-partition` does not depart from blocking and canopies; it is the tradition's own shape, which this draft itself asserts in `## Answer`: "a partition is what makes a canopy a canopy". What departs from the tradition is the option the answer takes. As recorded, the projection on that option row will say this tradition contradicts the partition option, and the record loses the derived "chosen over" that names exactly this case. Suggested edit: set that `bears` entry's relation to `adopted`, and rewrite the closing sentence of `## Answer` from "The divergence is the reason the several-readers option is not adopted: a partition is what makes a canopy a canopy, and at this size a key's value is telling one reader where to look, not making the problem tractable for several." to "The tradition supports the several-readers option and the record is chosen over it: a partition is what makes a canopy a canopy, and at this size a key's value is telling one reader where to look, not making the problem tractable for several."
- The sibling reading `commons.systems/disposition-graph/mapreduce-and-cross-shard-blindness`, landed in the same wave and bearing on the same option, records the opposite relation on it for the reasoning this draft's encoding contradicts: "the relation to it is adoption, and it is a tradition adopted on an option the answer did not choose, which is what `chosen over` names." Both traditions are partition-shaped, so the author will see one option row on `survey-selection` carrying `adopted` from MapReduce and `diverged` from blocking and canopies for the same property of that option. Whichever way the record settles it, the two readings must apply one rule; the fix suggested in the finding above brings this node to the sibling's.
- A viable option is missing on the answer fact, which carries only `as-read`. The AI's own case against on that fact — "A divergence recorded where the tradition is out of scope overstates what the author decided against: record linkage partitions because the corpus is too large for anything else, so a corpus that is not too large is a case Fellegi and Sunter never addressed rather than one they would decide the other way." — is a second reading of these sources, not merely an objection to this one, and the author will never get to rule on it while it stands only as an `against`. Proposed option `supports-the-nomination-and-is-chosen-over-on-the-partition`, source review, ref 2026-09-07, with the prose: "The same reading with the relations placed as `readings` places them. The tradition is taken whole for the nomination, cheap keys unioned to propose the pairs an expensive comparator is spent on, and the record departs from nothing the sources decided: they partition because the corpus admits no alternative, so a corpus small enough to read entire is a case outside their scope rather than one they answer the other way. `several-readers-over-a-partition` is therefore the tradition's own shape on this fact and carries `adopted`, projecting as chosen over, and the record's reason for not taking it — that at this size a key tells one reader where to look rather than making the problem tractable for several — is a statement of scope and not of divergence." The two sibling readings of this wave, `fagan-entry-criteria` and `verifying-traces-and-early-cutoff`, each carry exactly such a second option; this node carries none.
- The boldness on the answer fact and the case against on the authority fact both rest on a document that is not in the record and cannot be checked by any reader. The fact prose reads "which the tradition survey of 2026-09-07 recorded at high confidence on both", and the node's own account says "Surfaced by the tradition survey of 2026-09-07, which is not part of the record." Nothing under `bootstrap/` is that survey, so validation 3's requirement that every claim about the record is verified fails on it: the reader is asked to take a confidence rating on the authority of a text it is told does not exist here. Suggested edit: either state the confidence as the AI's own judgment of its knowledge of Fellegi and Sunter and of McCallum, Nigam and Ungar, deleting the appeal to the survey, or land the survey as evidence under `bootstrap/` and cite the file.

On the facts and what they recommend: The answer fact recommends `as-read`, which is also `stands`, so the absence of a `## Recommendation` fence is correct, and moderate boldness is right for a relation resting wholly on the AI's knowledge of two printed sources with the divergence half checkable against `survey-selection`'s own paragraph. The authority fact recommends `deferred` at moderate boldness, which follows `class-recommendation` (a wrong reading is neither expensive nor irreversible, since `readings` makes a changed verdict a re-grasp trigger, and the capture limb does not bite on a claim falsifiable against printed sources) — but `## Rationale` says the class is delegated, so what the node presents and what it argues disagree. No persistence fact is right for a reading whose shape does not change; both facts carry an `against`; neither reading has pinned this text, so nothing is stale.

On the viability of the options: Every option listed is viable: `as-read` is a real reading of these sources, and the three reserved authority options are the record's vocabulary. One viable option is missing on the answer fact — the reading that places the relations as `readings` defines them, adopting the nomination and recording the tradition as chosen over on `several-readers-over-a-partition` rather than diverged from, on the ground that a corpus small enough to read entire is outside what Fellegi and Sunter addressed. Its prose is given in the fourth finding; it is the reading the node's own `against` describes, and as things stand the author cannot rule for it.

Strongest counter-argument (moderate): The reading's whole structure assumes that blocking and canopies separate into a nomination half and a partition half, so that a record can take the first and leave the second. In the sources they are one act: a blocking key nominates precisely by excluding every pair it does not group, and the cost argument that justifies the method is the exclusion. Strip the exclusion and what remains is not the tradition minus a clause but a different technique that borrows its vocabulary — a ranking heuristic over a corpus small enough to read entire, which Fellegi and Sunter would not recognise as blocking at all. On that view the `adopted` relation on `candidate-pairs-with-their-nominating-key` is as overstated as the `diverged` on its rival, and the reading grounds `survey-selection`'s candidate pairs less than its confident division suggests. The defence is real but partial: canopies in McCallum, Nigam and Ungar are deliberately overlapping and approximate, and a union of overlapping canopies is nearer to an ordering than to a hard partition, so the nomination abstraction has something behind it — which is why this is a case for redrawing the reading's claim rather than for withdrawing it.

The session's reply: The reading's own reply is the one the record keeps: canopies in McCallum, Nigam and Ungar are overlapping and approximate, so a union of canopies is nearer an ordering than a hard partition and the nomination abstraction has something behind it. The relation on `several-readers-over-a-partition` is corrected to adopted, so the row on `survey-selection` carries one rule from both partition-shaped traditions, and the reading the counter and the case against describe, in which the record departs from nothing the sources decided, is recorded as the option `supports-the-nomination-and-is-chosen-over-on-the-partition` for the author to take.

### Repaired after the reading of abb15a3e, 2026-09-07

All five findings applied. The rationale's class now matches the authority fact. The relation on `several-readers-over-a-partition` moves from diverged to adopted, which projects as chosen over, since the partition is the tradition's own shape and `diverged` names an option that departs from the tradition; the answer's closing sentence and the fact prose say so, and the entry now agrees with `mapreduce-and-cross-shard-blindness` on the same option. The option `supports-the-nomination-and-is-chosen-over-on-the-partition` is recorded from the reading's fourth finding, source review, and the appeal to a survey that is not in the record is replaced by the AI's own confidence. The reply to the counter is on the reading's entry above. The amendment is the object of the reading this entry owes.

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

---
question: Does regression test selection ground the delta survey, and where does the answer depart from its guarantee?
form: reading
stage: maieutic
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
      - name: adopts-the-industrial-practice-and-diverges-on-the-safety-result
        source: review
        ref: "2026-09-07"
    recommends: as-read
    boldness: high
    against: "The node's question asks where the answer departs from the guarantee, and after the repair no `bears` entry on it reads diverged at all: the departure is carried by prose and by the chosen-over derivation, and an author reading the option rows alone sees a tradition that supports the delta survey twice over and never sees what the record gave up."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "The capture limb does bite: this reading's own repair moved a relation from diverged to adopted on the AI's re-reading of a source nobody else has opened, which is exactly the freedom a delegated class would make permanent and a deferred class only postpones."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 5893cbbdb934fe7d41d77e1043225aaec0019490
  commit: edbe507a81c4bfe51308f5fb96845b8bbdaff4c8
  against: "The repair's own account of itself claims account entries are 'not rewritten, since an account entry is the record of its day,' yet its remedy for the previous finding is to rewrite the `### Repaired after the reading of d35b0014` entry a second time (restoring it to its pre-ed7d78d3 text). One could argue this is still an edit to a dated historical entry and so brushes the same principle the previous finding turned on. This does not hold up on inspection, though: the previous reading's own suggested edit was exactly 'revert the d35b0014 entry to its prior text and instead add the acknowledgment ... as a new dated entry,' which is precisely what the repair does — reverting an erroneous later insertion restores the entry's true historical state rather than adding new interpretive content to it, and the justification sentence itself is relocated to a fresh, separately dated entry rather than left duplicated in place."
  survey:
    date: 2026-09-07
    of: 5893cbbdb934fe7d41d77e1043225aaec0019490
    commit: 6611799a1dd6276691cf61f482c8e593f0234200
    text:
      question: "a9482ec71ac13b293327abcf07f668c2142fdfc5d8ff0355c72194203d9b5fe1"
      answer: "7fd32349ea33272a2f76fc859ea642ca980b13ba985699468dcd749e0f93902d"
      options: "0c37afc99cd229865603968e3f5b4f651c8d98998ce3f7d4fde286f96628d93b"
      rivals: "b4df3eb3a8c2a578d7e9ed2a619952f5657bca0c54c1ef2a00912ef18faf83b0"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    findings:
      - finding: "One clause of `readings`' derivation is restated verbatim in six reading nodes: \"is a lower rung of the same ladder, `the-delta-survey-with-a-periodic-whole`, contained in that option and not declined, and a relation stored on the rung would project as chosen over, which `readings` derives for a tradition adopted on an option not chosen\" stands in `acceptance-sampling-and-all-or-none`, `fagan-entry-criteria`, `lint-and-the-false-positive-threshold`, `regression-test-selection`, `tolerated-inconsistency` and `verifying-traces-and-early-cutoff`, and `blocking-and-canopies` carries the same sentence. The clause explains a derivation `readings` owns, so an amendment to that derivation must today be chased through six leaves, which is the restatement the ninth validation names."
        kind: "redundancy"
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
          - "commons.systems/disposition-graph/regression-test-selection"
          - "commons.systems/disposition-graph/readings"
          - "commons.systems/disposition-graph/acceptance-sampling-and-all-or-none"
          - "commons.systems/disposition-graph/fagan-entry-criteria"
          - "commons.systems/disposition-graph/lint-and-the-false-positive-threshold"
          - "commons.systems/disposition-graph/tolerated-inconsistency"
          - "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
    pairs:
      - with: "commons.systems/disposition-graph/acceptance-sampling-and-all-or-none"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "term:probe (defines: commons.systems/disposition-graph/author-questions)"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/blocking-and-canopies"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
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
      - with: "commons.systems/disposition-graph/fagan-entry-criteria"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
          - "term:maieutic (defines: commons.systems/disposition-graph/growth)"
          - "term:project (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
          - "term:evidence (defines: commons.systems/disposition-graph/instruments)"
          - "term:re-grasp (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/lint-and-the-false-positive-threshold"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/mapreduce-and-cross-shard-blindness"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
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
      - with: "commons.systems/disposition-graph/progressive-disclosure"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:chosen over (defines: commons.systems/disposition-graph/readings)"
          - "term:diverged (defines: commons.systems/disposition-graph/readings)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
          - "term:tradition (defines: commons.systems/disposition-graph/readings)"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/scope"
        keys:
          - "term:section (defines: commons.systems/disposition-graph/scope)"
      - with: "commons.systems/disposition-graph/survey-selection"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/tolerated-inconsistency"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:standing (defines: commons.systems/disposition-graph/transience)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
          - "term:unanswered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:bite (defines: commons.systems/disposition-graph/work-loop)"
          - "term:frontier (defines: commons.systems/disposition-graph/work-loop)"
      - with: "commons.systems/public/agency"
        keys:
          - "term:capture (defines: commons.systems/public/agency)"
under:
  - commons.systems/disposition-graph/survey-selection
source: Rothermel and Harrold, Analyzing regression test selection techniques, IEEE TSE 22(8), 1996, and A safe, efficient regression test selection technique, TOSEM 6(2), 1997; industrial test-impact analysis as the practice.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: a-whole-graph-reading-every-time
    relation: adopted
---

## Facts

### answer

`as-read` is recommended, as redrawn on 2026-09-07: the redrawing corrects a statement about the tradition that this node's own `source` field falsifies, and no option that leaves that statement standing is viable. Within the corrected text the recommendation is for the division the tradition itself makes, adoption of the industrial strand that supplied the design and departure from the safety result the record cannot have, with the departure carried where `readings` puts it, as a tradition adopted on the option the record was chosen over. Boldness high, and the two halves of the record's gloss pull apart here, so the fact says which is meant: the share of this reading resting on the AI's own unrecorded knowledge is total — neither cited paper is in the record, neither is quoted, and no words of the author bear on it — while the confidence in the safety result itself is high, it being the best-attested result of the literature the tradition survey recorded at high confidence. Boldness on this record is the share and not the confidence, so it is high, and the confidence is stated here rather than encoded there. The evidence for the reading is that the first drawing carried one of the safety result's two premises and not the other. The case against is on the fact.

#### as-read

Diverges on the guarantee and adopts the practice, and the two strands are the tradition's own.

**AI support.** Recorded in the maieutic movement on `survey-selection`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day, which is not part of the record and which recorded Rothermel and Harrold and the practice at high confidence; the two papers are cited here more exactly than that survey did, which named one venue and one year, and the citations are the AI's own recollection of them. Redrawn on 2026-09-07 after the clean-context reading of d35b0014, which found the answer misreporting its own recorded support scope, saying the tradition names the industrial posture and does not endorse it when this node's `source` names that practice as part of the tradition and the practice is the posture's design; and grounding the departure on one premise where the safety result rests on two, the sound dependency relation and the controlled regression testing assumption. The redrawing adds the second premise, corrects the scope, names the measurement apparatus the reading does not take, and moves the relation on `the-delta-survey-with-a-periodic-whole` from diverged to adopted with a second entry adopting on the option the record was chosen over, which is the shape the sibling `acceptance-sampling-and-all-or-none` already uses on that same option. Validated by the AI from its own knowledge of the sources. Deferred, because none of `class-recommendation`'s three limbs holds and no words of the author delegate the reading of traditions — that a source is one the author may check is a reason for deferring and not for delegating — so the reading acts and the node stays on the alignment frontier until the author has read the papers.

**AI divergence.** The node's question asks where the answer departs from the guarantee, and after the repair no `bears` entry on it reads diverged at all: the departure is carried by prose and by the chosen-over derivation, and an author reading the option rows alone sees a tradition that supports the delta survey twice over and never sees what the record gave up.

**Content.**

```markdown
---
question: Does regression test selection ground the delta survey, and where does the answer depart from its guarantee?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: Rothermel and Harrold, Analyzing regression test selection techniques, IEEE TSE 22(8), 1996, and A safe, efficient regression test selection technique, TOSEM 6(2), 1997; industrial test-impact analysis as the practice.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: a-whole-graph-reading-every-time
    relation: adopted
---

## Answer

Diverges on the guarantee and adopts the practice, and the two strands are the tradition's own. The safety result is its classical strand: a selection technique is safe when it drops no test that could reveal a fault in the changed program, a consequence the definition delivers over modification-revealing tests and reaches fault-revealing ones only under the controlled regression testing assumption, that the test is deterministic and everything but the changed code is held constant. Safety rests besides on a sound dependency relation between the change and the tests, a control-flow or data-flow graph the technique walks. This record has neither premise for the thing the survey exists to catch. It has no such relation, since two nodes may contradict each other with no ancestry between them, no citation either way and no word in common; and its test is a reader's judgment, which is not deterministic, so a second run over the same pair may return a different finding. The consequence reaches further than the delta: even a whole survey, in which nothing is frozen, gives less than safety gives, and the drift probe measures the reader as much as it measures the selection.

What the record took is the tradition's other strand, and this node's `source` names it as the practice: industrial test-impact analysis. That strand does not merely name the unsafe posture, it is that posture's design and it endorses it — selection run on what changed, a full run on a cadence, and a measurement of what was skipped — so the delta survey's two backstops are the practice's own and not this record's invention. What the record departs from is the safety result and not the practice, and the answer names the selection unsafe in so many words rather than claiming a guarantee it cannot have, so that a later reader does not take the delta's silence for the tradition's safety.

The relations follow from that division. `the-delta-survey-with-a-periodic-whole` is the industrial strand's own shape and the relation to it is adoption. `a-whole-graph-reading-every-time` is what safety reduces to where no sound dependency relation is available, the identity selection, every test every time, and the tradition supports it; the record is chosen over it, which is what `readings` means by a tradition adopted on an option not chosen, and is where the departure from the guarantee is recorded in the record's own vocabulary rather than in a word on a row.

What this reading does not take from the tradition is its measurement apparatus. Inclusiveness and precision as degrees rather than as a binary, and the cost model that trades them, are what the framework offers a selection that cannot be safe, and they are the vocabulary in which the cadence, the sample and the resemblance threshold could be sized; sizing them is `survey-selection`'s question and not this reading's, and the reading names the apparatus so that the parent's own recorded case against, that its numbers are unstated, has somewhere to go. The entry on `survey-selection` is recorded on `candidate-pairs-with-their-nominating-key`, the option that stands, because the delta survey this reading grounds is a lower rung of the same ladder, `the-delta-survey-with-a-periodic-whole`, contained in that option and not declined, and a relation stored on the rung would project as chosen over, which `readings` derives for a tradition adopted on an option not chosen.
```

#### adopts-the-industrial-practice-and-diverges-on-the-safety-result

Adopts and diverges, and carries both relations on the option `the-delta-survey-with-a-periodic-whole` at once: adopted on the posture, which is the industrial strand's own design, and diverged on the guarantee, which no selection over this record can have. It is the reading the clean-context review of 2026-09-07 named as missing, and it differs from the recommended answer only in where the divergence is kept, on the relation rather than in the answer's words and in the chosen-over derivation.

**AI support.** It is the shape of the truth: two strands of one tradition, taken and departed from on the same object, and neither verdict swallowing the other. The node's question asks where the answer departs from the guarantee, and the recommended reading answers it in prose while leaving every `bears` entry reading adopted, so an author who reads the option rows and not the readings sees only support. The record has reached for this shape before, on `commons.systems/disposition-graph/progressive-disclosure`, whose draft carried two entries with opposite relations on one option.

**AI divergence.** The record has looked at this encoding and declined it: `readings`' answer allows one net relation per option with the nuance in prose, and the double entry on `progressive-disclosure` was struck for a net verdict in the same landing that found it. The place where the question is open is `readings`' own option `relation-per-holding`, which asks for exactly this and names what it would cost, a stable name for each holding, a second vocabulary the record does not have; deciding it inside a reading of one tradition would settle a rule of the record from underneath the node that owns it. Until `relation-per-holding` is ruled, the divergence has a home in the record's existing vocabulary — a tradition adopted on the option not chosen is what chosen over names — and this reading now uses it.

**Content.**

```markdown
---
question: Does regression test selection ground the delta survey, and where does the answer depart from its guarantee?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: Rothermel and Harrold, Analyzing regression test selection techniques, IEEE TSE 22(8), 1996, and A safe, efficient regression test selection technique, TOSEM 6(2), 1997; industrial test-impact analysis as the practice.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: a-whole-graph-reading-every-time
    relation: adopted
---

## Answer

Adopts and diverges, and carries both relations on the option `the-delta-survey-with-a-periodic-whole` at once: adopted on the posture, which is the industrial strand's own design, and diverged on the guarantee, which no selection over this record can have. It is the reading the clean-context review of 2026-09-07 named as missing, and it differs from the recommended answer only in where the divergence is kept, on the relation rather than in the answer's words and in the chosen-over derivation.
```

### authority

Deferred, on the clean-context reading's own finding: the sentence this node offered for delegating, that the relation is the AI's reading of a source the author may check, is a reason for deferring, and no words of the author anywhere in the record say they do not want to be asked again about the AI's account of a research literature. What deferral queues here is two papers whose central result this record's whole selection design leans on, and the repair itself shows why the queue is worth keeping: the first drawing stated the safety result on one of its two premises. Boldness moderate: two of `class-recommendation`'s limbs are answered by `readings`' re-grasp trigger and by the fact that nothing acts under an unanswered parent, and the judgement that the capture limb does not bite, a reading's claim being falsifiable against a text outside the record, is the AI's own. The case against is on the fact.

## Account

### Manifest

- Folded: Minted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of cda6f2e6, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of d35b0014, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of aad6ec0f, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading of abb15a3e, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-pointed after the readings of abb15a3e, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of e9714fc7, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading of 2b934c69, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of e9714fc7 (ii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `as-read`.

Findings:


On the facts and what they recommend: The diff touches only the `## Account` section (the apply step's own record of the previous e9714fc7 reading, which the brief says is not part of the amendment, plus the actual repair entry `### Repaired after the re-reading of 2b934c69, 2026-09-07`) and the `review:` frontmatter's pin/commit/against fields, which the brief likewise excludes as the prior reading's own apply-step record. Neither fact's `recommends`, `boldness`, `against`, or `stands` changes: `answer` still recommends `as-read` (high, stands, no `## Recommendation` fence) and `authority` still recommends `deferred` (moderate).

On the viability of the options: Unaffected. The diff never touches `## Facts`, so `as-read` and `adopts-the-industrial-practice-and-diverges-on-the-safety-result` on `answer`, and the three reserved options on `authority`, carry the same status, sources and reasons before and after the amendment.

Strongest counter-argument (weak): The repair's own account of itself claims account entries are 'not rewritten, since an account entry is the record of its day,' yet its remedy for the previous finding is to rewrite the `### Repaired after the reading of d35b0014` entry a second time (restoring it to its pre-ed7d78d3 text). One could argue this is still an edit to a dated historical entry and so brushes the same principle the previous finding turned on. This does not hold up on inspection, though: the previous reading's own suggested edit was exactly 'revert the d35b0014 entry to its prior text and instead add the acknowledgment ... as a new dated entry,' which is precisely what the repair does — reverting an erroneous later insertion restores the entry's true historical state rather than adding new interpretive content to it, and the justification sentence itself is relocated to a fresh, separately dated entry rather than left duplicated in place.

The session's reply: [object Object]

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/regression-test-selection stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `as-read`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `adopts-the-industrial-practice-and-diverges-on-the-safety-result`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `e9714fc7b20b79583a4d5f084416bdbb0c0eb80f` is re-computed for the encoding as `5893cbbdb934fe7d41d77e1043225aaec0019490`; nothing it read changed.

### Frontier survey, 2026-09-07, of 5893cbbd

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Redundancy (9). It carries the six-times-repeated ladder clause, "is a lower rung of the same ladder, `the-delta-survey-with-a-periodic-whole`, contained in that option and not declined, and a relation stored on the rung would project as chosen over, which `readings` derives for a tradition adopted on an option not chosen".
- Coverage (14). No survey has read this node.

Strongest counter-argument (strong): The answer "Diverges on the guarantee and adopts the practice, and the two strands are the tradition's own." adopts the half that saves work and diverges from the half that made it safe: safe regression test selection is safe because the dependency relation is computable, and this record's is not, as `survey-selection`'s own `against` says of semantic contradiction. Adopting the practice without the guarantee is adopting a heuristic while citing a theorem.

The session's reply: The counter-argument restates the divergence the reading records: the guarantee rests on a computable dependency relation this record has none of, which is why the reading diverges on the guarantee and why survey-selection's own case against itself says the same. What the record adopts is the practice with its compensation, the periodic whole reading and the drift probe, and it cites no theorem for it; the reading is amended to say that the practice is adopted as a heuristic with the periodic whole as its bound.

### Frontier finding, 2026-09-07

Kind: redundancy.

One clause of `readings`' derivation is restated verbatim in six reading nodes: "is a lower rung of the same ladder, `the-delta-survey-with-a-periodic-whole`, contained in that option and not declined, and a relation stored on the rung would project as chosen over, which `readings` derives for a tradition adopted on an option not chosen" stands in `acceptance-sampling-and-all-or-none`, `fagan-entry-criteria`, `lint-and-the-false-positive-threshold`, `regression-test-selection`, `tolerated-inconsistency` and `verifying-traces-and-early-cutoff`, and `blocking-and-canopies` carries the same sentence. The clause explains a derivation `readings` owns, so an amendment to that derivation must today be chased through six leaves, which is the restatement the ninth validation names.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/acceptance-sampling-and-all-or-none, commons.systems/disposition-graph/fagan-entry-criteria, commons.systems/disposition-graph/lint-and-the-false-positive-threshold, commons.systems/disposition-graph/tolerated-inconsistency, commons.systems/disposition-graph/verifying-traces-and-early-cutoff.

Proposed: The survivor is `readings`: the clause is stated once in its answer, as the rule that a relation is not stored on a rung of a ladder whose containing option was not declined, and each reading cites `readings` for it instead of restating it. Nothing else moves; the six leaves keep their own verdicts.

Recorded as an option on commons.systems/disposition-graph/readings's answer fact: `the-rung-clause-is-stated-once` (source review, 2026-09-07).

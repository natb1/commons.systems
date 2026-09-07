---
question: Do lint's division of labour and Coverity's field experience of false positives ground the mechanical tier's bound, that a check gates only where it is obviously right when it fires?
form: reading
stage: ruling
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
      - name: supports-the-bound-diverges-on-the-uncertain-check
        source: review
        ref: "2026-09-07"
    recommends: as-read
    boldness: high
    against: "A field report is evidence from one product, one decade and one language family, and a bound stated as the tradition's reason rather than as a preference claims more transfer than one company's experience of C and C++ codebases supports."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "Both sources are high-confidence and one of them is a widely-read CACM article, so a deferral queues a reading the author could do in an evening and meanwhile keeps a settled node on the frontier."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 05264d830a1fe1637fc86b135efd33030a30cf44
  commit: 7f9b25de3b0b74095c1dad1fd76824f5b6b814c5
  against: "All six of the previous reading's findings are answered, most matching the suggested edits verbatim: the rationale/authority class agreement, the missing divergence option, the question's naming of both sources, the tier-list claim narrowed to admission, the softened false-positive sentence, and the boldness raised to `high` with the transfer named as its reason. The retarget of the `bears` entry to `candidate-pairs-with-their-nominating-key` was not one of this node's own six findings, but it answers a defect the sibling `tolerated-inconsistency`'s own review named specifically against this node (\"`fagan-entry-criteria` and `lint-and-the-false-positive-threshold` on `the-mechanical-tier-gates-the-launch`\"), so it closes a real gap rather than introducing one. The one thing the amendment does not do is rebut the review's own strongest counter-argument (that the belief mechanism has no bearer in a clean-launched session) — it instead concedes the point by raising boldness to `high` and keeping the alternate reading on record as an option, which is a legitimate way to carry a strong counter-argument forward rather than a failure to answer it."
under:
  - commons.systems/disposition-graph/survey-selection
source: lint, Stephen C. Johnson, Bell Labs, 1978; Bessey and others, A Few Billion Lines of Code Later, CACM 2010, on Coverity's field experience.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---

## Facts

### answer

`as-read` is the only reading of lint and of the Coverity field report on the record, and it is recommended because the half of the tradition it takes is the half that decides a design: the field report's finding is about belief rather than about detection, and the tier's bound as `survey-selection` states it — a check enters only where it is obviously right when it fires — is that finding's consequence rather than a preference dressed in it. The reading also says where it refines rather than takes, in what becomes of the uncertain check: the field report suppresses and the record demotes, because the record's consumer is a reader that can weigh a hint and the report's was a queue of engineers that could not. Boldness high, and the reason is the transfer: the field report's finding is about a belief that accumulates in an engineer across months, and the answer transfers it to the applying session and to the record that holds what a session cannot, which no part of this record corroborates; the sources themselves are certain, the false-positive claim is the field report's headline and not a corner of it, and the mapping onto the bound is quotable from `survey-selection`'s own paragraph on the tier. The case against is on the fact.

#### as-read

Supports on the bound, which is the half the answer needs.

**AI support.** Recorded under `survey-selection` on 2026-09-07, on the finding the clean-context reading of that day left open, that a tradition doing this much work in a draft with no reading and no `bears` entry diverges from `evaluation`'s rule and does not record the divergence. Both sources are cited as the tradition survey of that date gave them, and it recorded both at high confidence; the AI validated the relation from its own knowledge of them. Deferred, because the reading's weight is on an empirical claim about how engineers behave toward a noisy checker, which the author can weigh from their own experience and which no part of this record corroborates.

**AI divergence.** A field report is evidence from one product, one decade and one language family, and a bound stated as the tradition's reason rather than as a preference claims more transfer than one company's experience of C and C++ codebases supports.

**Content.**

```markdown
---
question: Do lint's division of labour and Coverity's field experience of false positives ground the mechanical tier's bound, that a check gates only where it is obviously right when it fires?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: lint, Stephen C. Johnson, Bell Labs, 1978; Bessey and others, A Few Billion Lines of Code Later, CACM 2010, on Coverity's field experience.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---

## Answer

Supports on the bound, which is the half the answer needs. lint's own justification was a division of labour, that the compiler should not carry style and portability checks and that something should; the field report from Coverity is the half that decides a design, and it is a finding about belief rather than about detection: a static tier's adoption is decided by its false-positive rate before its recall, engineers stop reading a checker once its noise passes a threshold, and a true positive nobody believes is worth nothing. The answer takes that as the tier's bound, and states it as the tradition's reason rather than as a preference: a check enters the tier only where it is obviously right when it fires, anything merely probable enters the brief as a hint the reader may ignore and never as a gate, because a tier the applying session learns to disbelieve is worth less than no tier at all — the applying session being, here, the party whose belief the whole gate depends on, since it is the one that must stop and repair rather than proceed. The tradition is also the tier's rule of admission and not a description of its present list, which is `survey-selection`'s to keep to it: a check is admitted where it is decidable from the schema or from text as bytes and is obviously right when it fires, and the judgments a machine can only nominate — whether two nodes contradict each other, whether a term has drifted into two uses both plausible — stay with the reader, where the answer's own refusal to let a validator decide consistency puts them. Where the answer refines the tradition rather than taking it is in what becomes of the uncertain check. The field report's remedy is suppression: report nothing the checker is unsure of, because the cost of noise is paid by a queue of engineers who cannot weigh it. Here the uncertain check is demoted rather than suppressed, carried into the brief as a hint for a reader that can weigh it, with the key it was drawn on recorded beside any finding it produced, so that a check's yield is measured across surveys and a check that has produced nothing may be demoted on the evidence instead of on a judgment made once. The net relation stays adopted, the record's convention being one relation per option with the nuance in the answer; the option that makes the relation itself partial is beside this one for the author to take. The tradition supplies the caution on the other side too, which the answer carries: a clean tier is an affirmative signal, so the reading's own report says which checks ran, since a green tier silent about its coverage invites the belief that the semantic half was checked as well.

The tier's bound is this reading's locus and not its neighbour's. `fagan-entry-criteria` bears on the same option and grounds the gate itself, the refusal to convene a reading over material that fails entry; what may be an entry criterion at all is grounded here, on the field report's finding about belief, and Fagan's own requirement that entry criteria be stated and objective is consistent with the bound without supplying it. So the two readings on this option divide by locus rather than compete for one clause, as this node's account has it. The entry on `survey-selection` is recorded on `candidate-pairs-with-their-nominating-key`, the option that stands, because the tier this reading grounds is a lower rung of the same ladder, `the-mechanical-tier-gates-the-launch`, contained in that option and not declined, and a relation stored on the rung would project as chosen over, which `readings` derives for a tradition adopted on an option not chosen.
```

#### supports-the-bound-diverges-on-the-uncertain-check

The field report supports the bound and the record departs from it on the remedy. Coverity's remedy for the check it cannot be sure of is suppression, and the reason is structural rather than incidental: the report's consumer is a queue of engineers with no way to weigh a hint and no way to record what a check has yielded, so an uncertain check has no home but the bin. The record's consumer has both, and the answer therefore demotes rather than suppresses. That is a departure on the tradition's own remedy and not a detail of application, so the relation the author reads on the option row is `diverged` rather than `adopted`, with the support for the bound recorded in the answer.

**AI support.** It is the second option the three sibling readings on this parent carry and this one did not, recorded by the clean-context reading of abb15a3e: the answer already says where it refines rather than takes, and the option puts that choice on the row the author reads. The reading's counter, that the belief mechanism has no bearer in a session launched clean, bears here too: the device that gives it a bearer, a check's yield measured across surveys, is the record's invention and not the report's.

**AI divergence.** The recommended reading keeps the net relation at adopted, the record's convention being one relation per option with the nuance in the answer, and holds that demotion is the report's remedy applied to a consumer that can weigh a hint rather than a departure from it.

**Content.**

```markdown
---
question: Do lint's division of labour and Coverity's field experience of false positives ground the mechanical tier's bound, that a check gates only where it is obviously right when it fires?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: lint, Stephen C. Johnson, Bell Labs, 1978; Bessey and others, A Few Billion Lines of Code Later, CACM 2010, on Coverity's field experience.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---

## Answer

The field report supports the bound and the record departs from it on the remedy. Coverity's remedy for the check it cannot be sure of is suppression, and the reason is structural rather than incidental: the report's consumer is a queue of engineers with no way to weigh a hint and no way to record what a check has yielded, so an uncertain check has no home but the bin. The record's consumer has both, and the answer therefore demotes rather than suppresses. That is a departure on the tradition's own remedy and not a detail of application, so the relation the author reads on the option row is `diverged` rather than `adopted`, with the support for the bound recorded in the answer.
```

### authority

Deferred, and what it queues is a field report rather than a theorem: the reading's whole weight is on an empirical claim about how engineers behave toward a noisy checker, which the author can weigh from their own experience once they have read Bessey and the others, and which no part of this record corroborates. Delegated would fix the tier's bound on the AI's summary of one company's decade. Boldness moderate: `class-recommendation`'s expensive and irreversible limbs are answered by the record's re-grasp trigger and by the fact that nothing acts under an unanswered parent, and the judgement that the capture limb does not bite is the AI's own. The case against is on the fact.

## Account

### Manifest

- Folded: Minted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of abfd153b, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of abb15a3e, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 28cd04e4

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `as-read`.

Findings:


On the facts and what they recommend: The diff leaves `recommends` unchanged (`as-read` on answer, `deferred` on authority) and `as-read` still `stands`, so no `## Recommendation` fence is warranted; it raises the answer fact's boldness from `moderate` to `high` with the transfer named as the reason, adds the viable option `supports-the-bound-diverges-on-the-uncertain-check` (source review) with the answer's new sentence explaining why the net relation stays `adopted`, retitles the question to name both sources, rewrites the tier-list sentence as a claim about admission rather than present contents, softens the sharpened false-positive claim to match Bessey and the others, repoints the `bears` entry from `the-mechanical-tier-gates-the-launch` to `candidate-pairs-with-their-nominating-key` (the option that stands) with an added sentence explaining why, and corrects the rationale's class word from `delegated` to `deferred`.

On the viability of the options: Every option remains viable: `as-read` (now narrowed and re-pointed) is still a defensible mapping, the new option `supports-the-bound-diverges-on-the-uncertain-check` is a genuine second reading rather than a duplicate, and the three reserved authority options are untouched record vocabulary.

Strongest counter-argument (weak): All six of the previous reading's findings are answered, most matching the suggested edits verbatim: the rationale/authority class agreement, the missing divergence option, the question's naming of both sources, the tier-list claim narrowed to admission, the softened false-positive sentence, and the boldness raised to `high` with the transfer named as its reason. The retarget of the `bears` entry to `candidate-pairs-with-their-nominating-key` was not one of this node's own six findings, but it answers a defect the sibling `tolerated-inconsistency`'s own review named specifically against this node ("`fagan-entry-criteria` and `lint-and-the-false-positive-threshold` on `the-mechanical-tier-gates-the-launch`"), so it closes a real gap rather than introducing one. The one thing the amendment does not do is rebut the review's own strongest counter-argument (that the belief mechanism has no bearer in a clean-launched session) — it instead concedes the point by raising boldness to `high` and keeping the alternate reading on record as an option, which is a legitimate way to carry a strong counter-argument forward rather than a failure to answer it.

### The session's reply to the re-reading of 28cd04e4, 2026-09-07

Recorded in its own entry because the apply that landed the reading carried no reply, the replies file it was given being another wave's. The counter is carried and not rebutted, on purpose: the boldness is high because the transfer is the AI's, and the option beside the recommendation is where the author rules for the counter if they read it as the reading does.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/lint-and-the-false-positive-threshold stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `as-read`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `supports-the-bound-diverges-on-the-uncertain-check`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `28cd04e4d40663b0d13b6f80b6defc4fad7ee3da` is re-computed for the encoding as `05264d830a1fe1637fc86b135efd33030a30cf44`; nothing it read changed.

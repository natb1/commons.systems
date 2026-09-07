---
question: Does lint's economics ground the mechanical tier's bound, that a check gates only where it is obviously right when it fires?
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
    against: "A field report is evidence from one product, one decade and one language family, and a bound stated as the tradition's reason rather than as a preference claims more transfer than one company's experience of C and C++ codebases supports."
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "Both sources are high-confidence and one of them is a widely-read CACM article, so a deferral queues a reading the author could do in an evening and meanwhile keeps a settled node on the frontier."
under:
  - commons.systems/disposition-graph/survey-selection
source: lint, Stephen C. Johnson, Bell Labs, 1978; Bessey and others, A Few Billion Lines of Code Later, CACM 2010, on Coverity's field experience.
bears:
  - fact: answer
    option: the-mechanical-tier-gates-the-launch
    relation: adopted
---
## Answer

Supports on the bound, which is the half the answer needs. lint's own justification was a division of labour, that the compiler should not carry style and portability checks and that something should; the field report from Coverity is the half that decides a design, and it is a finding about belief rather than about detection: a static tier lives or dies on its false-positive rate and not on its recall, engineers stop reading a checker once its noise passes a threshold, and a true positive nobody believes is worth nothing. The answer takes that as the tier's bound, and states it as the tradition's reason rather than as a preference: a check enters the tier only where it is obviously right when it fires, anything merely probable enters the brief as a hint the reader may ignore and never as a gate, because a tier the applying session learns to disbelieve is worth less than no tier at all — the applying session being, here, the party whose belief the whole gate depends on, since it is the one that must stop and repair rather than proceed. The tradition is also what makes the tier's list the list it is: every check on it is decidable from the schema or from text as bytes, and the judgments a machine can only nominate — whether two nodes contradict each other, whether a term has drifted into two uses both plausible — stay with the reader, where the answer's own refusal to let a validator decide consistency puts them. Where the answer refines the tradition rather than taking it is in what becomes of the uncertain check. The field report's remedy is suppression: report nothing the checker is unsure of, because the cost of noise is paid by a queue of engineers who cannot weigh it. Here the uncertain check is demoted rather than suppressed, carried into the brief as a hint for a reader that can weigh it, with the key it was drawn on recorded beside any finding it produced, so that a check's yield is measured across surveys and a check that has produced nothing may be demoted on the evidence instead of on a judgment made once. The tradition supplies the caution on the other side too, which the answer carries: a clean tier is an affirmative signal, so the reading's own report says which checks ran, since a green tier silent about its coverage invites the belief that the semantic half was checked as well.

The tier's bound is this reading's locus and not its neighbour's. `fagan-entry-criteria` bears on the same option and grounds the gate itself, the refusal to convene a reading over material that fails entry; what may be an entry criterion at all is grounded here, on the field report's finding about belief, and Fagan's own requirement that entry criteria be stated and objective is consistent with the bound without supplying it. So the two readings on this option divide by locus rather than compete for one clause, as this node's account has it.

## Rationale

Recorded under `survey-selection` on 2026-09-07, on the finding the clean-context reading of that day left open, that a tradition doing this much work in a draft with no reading and no `bears` entry diverges from `evaluation`'s rule and does not record the divergence. Both sources are cited as the tradition survey of that date gave them, and it recorded both at high confidence; the AI validated the relation from its own knowledge of them. Delegated, because the relation is the AI's reading of sources the author may check, and the author's ruling on the option it bears on is where the reading has effect.

## Facts

### answer

`as-read` is the only reading of lint and of the Coverity field report on the record, and it is recommended because the half of the tradition it takes is the half that decides a design: the field report's finding is about belief rather than about detection, and the tier's bound as `survey-selection` states it — a check enters only where it is obviously right when it fires — is that finding's consequence rather than a preference dressed in it. The reading also says where it refines rather than takes, in what becomes of the uncertain check: the field report suppresses and the record demotes, because the record's consumer is a reader that can weigh a hint and the report's was a queue of engineers that could not. Boldness moderate: the tradition survey of 2026-09-07 recorded both sources at high confidence, the false-positive claim is the field report's headline and not a corner of it, and the mapping onto the bound is quotable from `survey-selection`'s own paragraph on the tier. The case against is on the fact.

### authority

Deferred, and what it queues is a field report rather than a theorem: the reading's whole weight is on an empirical claim about how engineers behave toward a noisy checker, which the author can weigh from their own experience once they have read Bessey and the others, and which no part of this record corroborates. Delegated would fix the tier's bound on the AI's summary of one company's decade. Boldness moderate: `class-recommendation`'s expensive and irreversible limbs are answered by the record's re-grasp trigger and by the fact that nothing acts under an unanswered parent, and the judgement that the capture limb does not bite is the AI's own. The case against is on the fact.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. It is the second reading on the tier under this node, beside `fagan-entry-criteria`, and the two divide cleanly: Fagan grounds the refusal to convene a reading over material that fails entry, and this grounds what may be an entry criterion at all. The locus is the threshold and the economics behind it, not lint's own catalogue of checks nor the commercial account of adoption the field report is also known for, neither of which the record adopts.

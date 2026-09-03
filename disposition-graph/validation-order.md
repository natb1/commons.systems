---
question: In what order is a landing validated?
stage: review
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/work-loop
defines:
  - functional
  - non-functional
---
## Answer

Functional before non-functional. A criterion is functional when it is specific to the disposition a landing serves and is bitten explicitly: the thing does what its contract says, shown by tests and by use. A criterion is non-functional when it is standing and cross-cutting, sanctioned once and implicitly bitten by every landing: security, type safety, test integrity, style, token economy, and the reviewer's standards. The functional assessment is produced and passes first; the non-functional assessment, the adversarial review, is not produced until it does, so no cycles are spent polishing what does not work and a functional fix loop cannot thrash an assessment that does not yet exist. Both pass before a landing is folded in. During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified.

## Rationale

The author's ruling of 2026-09-02 and the legacy record it points to: the criteria-class axis and the staged ordering ratified 2026-09-01 on the legacy node `strategy-graph-native-dispatch`, marked author-required there, "non-functional assessment production gates on a passing functional assessment, so no cycles are spent polishing non-working code", with the staged order named the between-class damper after one change thrashed sixteen review rounds with no fixed point. The legacy instrument's implement, qa, review order was the interim embodiment; here the order is a rule on the frontier, not a phase. Traditions the legacy record cites, owed as readings: the maxim make it work, make it right, make it fast, commonly attributed to Kent Beck, adopted; over-processing as one of the seven wastes (Ohno, Toyota Production System, 1978), adopted; the separation of functional suitability from the other quality characteristics in ISO/IEC 25010, adopted for the class axis; Deming, Out of the Crisis (1986), point 3, diverged from in keeping adversarial review, as recorded on the review node.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified if the author confirms, or delegated where the author's words delegate it; boldness as the rationale shows, the AI's drafting from the author's rulings and from the legacy record as evidence; persistence standing.

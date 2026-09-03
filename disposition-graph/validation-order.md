---
question: In what order is a landing validated?
stage: ruling
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

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- No '## Disposition'; the only quotation in the node is from a legacy node, not from the author, and the answer leans on that node's ratification: 'ratified 2026-09-01 on the legacy node strategy-graph-native-dispatch, marked author-required there'. Legacy and evaluation both forbid a legacy ratification from carrying authority here. Suggested edit: quote the author's 2026-09-02 ruling with its date and cite the legacy node as evidence only.
- Answer: 'A criterion is non-functional when it is standing and cross-cutting, sanctioned once and implicitly bitten by every landing: security, type safety, test integrity, style, token economy, and the reviewer's standards.' None of the six is a node, a criterion or an instrument in this record, so 'sanctioned once' names a sanction that does not exist. Suggested edit: say the six are owed, or drop the list.
- Answer: 'During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified.' Nothing is ratified, so no non-functional assessment is owed for anything landed to date, and work-loop's shim batches all of it to exit. That consequence is real and appears nowhere the author would see it. Suggested edit: state it in the Proposal.
- Rationale carries a four-item prose tradition list ('make it work, make it right, make it fast ... Ohno ... ISO/IEC 25010 ... Deming'), which readings' recommended answer forbids.

On the three facts: Generic template. Boldness is moderate: the ordering rule is close to the author's 2026-09-02 ruling, which is quoted on the review node but not here, while the functional/non-functional definitions and the six-item cross-cutting list are the AI's transcription from the legacy record. One class and one boldness value are required and neither is given.

Strongest counter-argument (moderate): Functional-before-non-functional assumes the two classes are separable, and the node's own examples show they are not: type safety and test integrity are conditions of a functional assessment being meaningful rather than polish applied after it passes, and a security defect found after a landing is folded in costs more than the cycles the ordering saves. The evidence is one thrash of sixteen rounds, which this node's sibling review explains by a growing diff rather than by class ordering — so the rule may be solving with a schedule what a smaller contract solves outright. ISO/IEC 25010, adopted here for the class axis, separates the characteristics without ordering their assessment.

---
question: In what order is a landing validated?
stage: review
recommendation:
  adopts: standing
  class: ratified
  boldness: moderate
  amends: "8cefe40587eca1be05c749fcf976173d4f6e7016"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: f4e5708ce2c927aa04a7f7c8873d904702899cb7
alternatives:
  - name: deferred-until-ruling-quoted
    source: review
    ref: "2026-09-03"
  - name: traditions-to-readings
    source: review
    ref: "2026-09-03"
  - name: smaller-contract-instead-of-ordering
    source: review
    ref: "2026-09-03"
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

Functional before non-functional. A criterion is functional when it is specific to the disposition a landing serves and is bitten explicitly: the thing does what its contract says, shown by tests and by use. A criterion is non-functional when it is standing and cross-cutting, sanctioned once and implicitly bitten by every landing: security, type safety, test integrity, style, token economy, and the reviewer's standards, each owed as a criterion of its own. The functional assessment is produced and passes first; the non-functional assessment, the adversarial review, is not produced until it does, so no cycles are spent polishing what does not work and a functional fix loop cannot thrash an assessment that does not yet exist. Both pass before a landing is folded in. During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified.

## Rationale

The author's ruling of 2026-09-02 and the legacy record it points to: the criteria-class axis and the staged ordering ratified 2026-09-01 on the legacy node `strategy-graph-native-dispatch`, marked author-required there, "non-functional assessment production gates on a passing functional assessment, so no cycles are spent polishing non-working code", with the staged order named the between-class damper after one change thrashed sixteen review rounds with no fixed point. The legacy instrument's implement, qa, review order was the interim embodiment; here the order is a rule on the frontier, not a phase. Traditions the legacy record cites, owed as readings: the maxim make it work, make it right, make it fast, commonly attributed to Kent Beck, adopted; over-processing as one of the seven wastes (Ohno, Toyota Production System, 1978), adopted; the separation of functional suitability from the other quality characteristics in ISO/IEC 25010, adopted for the class axis; Deming, Out of the Crisis (1986), point 3, diverged from in keeping adversarial review, as recorded on the review node.

## Alternatives

### deferred-until-ruling-quoted

The node carries no Disposition section, and its only quotation is from a legacy node whose ratification legacy and evaluation both forbid from carrying authority here. The alternative is that the author's 2026-09-02 ruling be quoted with its date under Disposition and the legacy node cited as evidence only, or, failing that, that the recommendation change from ratified to deferred.

### traditions-to-readings

The rationale carries a four-item prose tradition list, make it work make it right make it fast, Ohno's seven wastes, ISO/IEC 25010 and Deming, which readings' recommended text forbids and which stub-traditions names this node among. The alternative strikes the list and mints the four as readings under this node when the readings rule is ruled.

### smaller-contract-instead-of-ordering

The reviewer's counter-argument, twice: the two classes are not separable, since type safety and test integrity condition a functional assessment being meaningful rather than polish after it passes, and a security defect found after a landing costs more than the ordering saves. The evidence for the rule is one thrash of sixteen rounds, which the review node explains by a growing diff rather than by class ordering, so the alternative answers the question with a bound on the size of a landing's contract instead of a schedule between the classes. ISO/IEC 25010, adopted here for the class axis, separates the characteristics without ordering their assessment.

## Account

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified; boldness moderate; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- No '## Disposition'; the only quotation in the node is from a legacy node, not from the author, and the answer leans on that node's ratification: 'ratified 2026-09-01 on the legacy node strategy-graph-native-dispatch, marked author-required there'. Legacy and evaluation both forbid a legacy ratification from carrying authority here. Suggested edit: quote the author's 2026-09-02 ruling with its date and cite the legacy node as evidence only.
- Answer: 'A criterion is non-functional when it is standing and cross-cutting, sanctioned once and implicitly bitten by every landing: security, type safety, test integrity, style, token economy, and the reviewer's standards.' None of the six is a node, a criterion or an instrument in this record, so 'sanctioned once' names a sanction that does not exist. Suggested edit: say the six are owed, or drop the list.
- Answer: 'During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified.' Nothing is ratified, so no non-functional assessment is owed for anything landed to date, and work-loop's shim batches all of it to exit. That consequence is real and appears nowhere the author would see it. Suggested edit: state it in the Proposal.
- Rationale carries a four-item prose tradition list ('make it work, make it right, make it fast ... Ohno ... ISO/IEC 25010 ... Deming'), which readings' recommended answer forbids.

On the three facts: Generic template. Boldness is moderate: the ordering rule is close to the author's 2026-09-02 ruling, which is quoted on the review node but not here, while the functional/non-functional definitions and the six-item cross-cutting list are the AI's transcription from the legacy record. One class and one boldness value are required and neither is given.

Strongest counter-argument (moderate): Functional-before-non-functional assumes the two classes are separable, and the node's own examples show they are not: type safety and test integrity are conditions of a functional assessment being meaningful rather than polish applied after it passes, and a security defect found after a landing is folded in costs more than the cycles the ordering saves. The evidence is one thrash of sixteen rounds, which this node's sibling review explains by a growing diff rather than by class ordering — so the rule may be solving with a schedule what a smaller contract solves outright. ISO/IEC 25010, adopted here for the class axis, separates the characteristics without ordering their assessment.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- No '## Disposition'; the only quotation in the node is from a legacy node, and the answer leans on that node's ratification ('ratified 2026-09-01 on the legacy node strategy-graph-native-dispatch, marked author-required there'). Legacy and evaluation both forbid a legacy ratification from carrying authority here. Suggested edit: quote the author's 2026-09-02 ruling with its date and cite the legacy node as evidence only.
- Answer: 'security, type safety, test integrity, style, token economy, and the reviewer's standards.' None of the six is a node, a criterion or an instrument in this record, so 'sanctioned once' names a sanction that does not exist. Suggested edit: say the six are owed, or drop the list.
- Answer: 'During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified.' Nothing is ratified, so no non-functional assessment is owed for anything landed to date, and work-loop's shim batches all of it to exit. That consequence appears nowhere the author would see it.
- Rationale carries a four-item prose tradition list, which readings' draft forbids; stub-traditions names this node.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value; the prose Facts line is the generic template stating two. Boldness moderate is defensible: the ordering rule is close to the author's 2026-09-02 ruling, which is quoted on the review node but not here, while the class definitions and the six-item list are the AI's transcription from the legacy record.

Strongest counter-argument (moderate): Functional-before-non-functional assumes the two classes are separable, and the node's own examples show they are not: type safety and test integrity are conditions of a functional assessment being meaningful rather than polish applied after it passes, and a security defect found after a landing is folded in costs more than the cycles the ordering saves. The evidence is one thrash of sixteen rounds, which the sibling review node explains by a growing diff rather than by class ordering, so the rule may be solving with a schedule what a smaller contract solves outright. ISO/IEC 25010, adopted here for the class axis, separates the characteristics without ordering their assessment.

The session's reply: Validated. Amended tonight: the six standing classes are named as owed criteria. The ruling a ratified stamp requires is given at the sitting; the legacy node is evidence. Accepted: nothing is ratified, so no non-functional assessment is owed today and the work-loop shim batches it to exit, which the sitting states. On the counter-argument, that type safety and test integrity condition a functional assessment: they gate landing as tests do; the ordering governs what a review spends cycles on after tests pass. Stage review.

### Frontier finding, 2026-09-03

Kind: placement.

Authority's rule is that 'a ratified stamp whose ruling is not in the record is invalid', and quotes' session reply settles that the ruling stays in the node under '## Disposition'. Verified that twenty-two of the sixty-two nodes carry no '## Disposition' section at all, among them evaluation, persistence, legacy, validation-order, review, attention and recording — every one of which is at the ruling stage recommending 'ratified' — and all three public nodes. Quotes is therefore a bar on roughly a third of the frontier, and its own Options block still marks the withdrawn option as recommended.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/review, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/recording.

Proposed: Rule quotes first, after agency. Then, before any ratified stamp is written, each of the twenty-two nodes either gains a '## Disposition' section carrying the ruling it rests on with its date — attention and recording already have the quotations in their rationales and need only move them, which also makes the alignment page show them — or its recommendation changes from ratified to deferred, since a ratified stamp it cannot support is worse than an honest deferral. Quotes' facts state the count.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `deferred-until-ruling-quoted` (review, 2026-09-03); `traditions-to-readings` (review, 2026-09-03); `smaller-contract-instead-of-ordering` (review, 2026-09-03).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
The census unit's note: Validation-order has a standing answer, no recommended text and no Disposition section, so it adopts standing with an empty dispositions list. Three alternatives are pending: quoting the author's own ruling or deferring the stamp, moving the prose tradition list to readings, and the reviewer's rival answer that a smaller contract, not a class ordering, is the remedy, which the session answered on one point only. The finding that the six standing non-functional classes name a sanction that does not exist was answered by naming them as owed criteria and is not carried. The quotes proposal carried here is the same one I emit once from evaluation.

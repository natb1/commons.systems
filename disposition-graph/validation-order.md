---
question: In what order is a landing validated?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: b9ff1d01658ddd46ef76c3368e4112e75a6ef80b
  against: "Functional-before-non-functional assumes the two classes are separable, and the node's own examples show they are not: type safety and test integrity are conditions of a functional assessment being meaningful rather than polish applied after it passes, and a security defect found after a landing costs more than the ordering saves. The evidence is one thrash of sixteen rounds, which the sibling review node explains by a growing diff rather than by class ordering, so the rule may be solving with a schedule what a smaller contract solves outright — and ISO/IEC 25010, adopted here for the class axis, separates the characteristics without ordering their assessment."
  survey:
    date: 2026-09-05
    of: b9ff1d01658ddd46ef76c3368e4112e75a6ef80b
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
      - name: deferred-until-ruling-quoted
        source: review
        ref: "2026-09-03"
      - name: traditions-to-readings
        source: review
        ref: "2026-09-03"
      - name: smaller-contract-instead-of-ordering
        source: review
        ref: "2026-09-03"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
form: rule
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

## Facts

### answer

#### deferred-until-ruling-quoted

The node carries no Disposition section, and its only quotation is from a legacy node whose ratification legacy and evaluation both forbid from carrying authority here. The alternative is that the author's 2026-09-02 ruling be quoted with its date under Disposition and the legacy node cited as evidence only, or, failing that, that the recommendation change from ratified to deferred.

#### traditions-to-readings

The rationale carries a four-item prose tradition list, make it work make it right make it fast, Ohno's seven wastes, ISO/IEC 25010 and Deming, which readings' recommended text forbids and which stub-traditions names this node among. The alternative strikes the list and mints the four as readings under this node when the readings rule is ruled.

#### smaller-contract-instead-of-ordering

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

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries no '## Disposition' — verified, one of the twenty-three — and its only quotation is from a legacy node, with the answer leaning on that node's ratification: 'ratified 2026-09-01 on the legacy node strategy-graph-native-dispatch, marked author-required there'. Legacy holds that the legacy record is evidence and never authority, and evaluation that no doctrine is implied by what exists. A ratified stamp here would rest on a ratification the record forbids from carrying authority. The `deferred-until-ruling-quoted` alternative is the honest branch.
- Verified applied since the last review: the six standing non-functional classes are named as owed criteria rather than as a sanction that exists.
- Answer: 'During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified.' Nothing is ratified, so no non-functional assessment is owed for anything landed to date, and work-loop's shim batches all of it to exit. Verified against the frontier: no node carries a ratified stamp. The consequence appears nowhere the author would see it.
- Rationale carries a four-item prose tradition list — 'make it work, make it right, make it fast', Ohno's seven wastes, ISO/IEC 25010, Deming — which readings' recommended text forbids. The `traditions-to-readings` alternative is pending here and on three other nodes for the same reason; see the merge finding.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current. Ratified cannot be supported as the node stands, its only quoted ruling being a legacy node's; moderate is right, since the ordering rule is close to the author's 2026-09-02 words (quoted on review, not here) while the class definitions and the six-item list are the AI's transcription. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): Functional-before-non-functional assumes the two classes are separable, and the node's own examples show they are not: type safety and test integrity are conditions of a functional assessment being meaningful rather than polish applied after it passes, and a security defect found after a landing costs more than the ordering saves. The evidence is one thrash of sixteen rounds, which the sibling review node explains by a growing diff rather than by class ordering, so the rule may be solving with a schedule what a smaller contract solves outright — and ISO/IEC 25010, adopted here for the class axis, separates the characteristics without ordering their assessment.

The session's reply: Forward accepted. The legacy ratification is evidence and not the ruling a ratified stamp needs; that is quotes' to settle and is recorded as a finding here.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (strong): The answer's last sentence is the whole of its current effect: "During bootstrap the non-functional assessment is owed once the disposition the landing materializes is ratified." Nothing is ratified, so no non-functional assessment has ever been owed, and the ordering rule has never once ordered anything. Ratifying it now fixes an order whose two terms have never both existed, on evidence entirely from the legacy record on `main`, which `materialization` classifies as evidence only. `smaller-contract-instead-of-ordering` is the option that would test whether the ordering is doing the work or the contract size is, and it is not the recommendation.

The session's reply: Taken. The last sentence is the whole of the rule's current effect, nothing is ratified, so the ordering has never ordered anything, and the evidence behind it is entirely from the legacy record that `materialization` classes as evidence only. The session does not move the recommendation and records that `smaller-contract-instead-of-ordering` is the option that would test whether the ordering or the contract size is doing the work, and that it has not been tested. Ratifying an untested ordering on legacy evidence is a cost the author should be shown at the row.

### Frontier finding, 2026-09-05

Kind: cross-reference.

One question — whether a node whose ruling was never quoted may be classed ratified, or must be deferred until the words are in the node — is pending on six nodes under four different names, and the node that gathers them describes the set wrongly. `commons.systems/disposition-graph/quotes`' option `one-ruling-for-the-unquoted-stamp` (disposition/disposition-graph/quotes.md line 76) says the question is pending "under three different names on six nodes — `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, `deferred-not-ratified` on review and persistence". Measured at this commit: `deferred-not-ratified` is on `review` only; `persistence` carries the same question under a fourth name, `deferred-recommendation` (disposition/disposition-graph/persistence.md line 55). The same option's second measurement is also stale: it says "twenty-three of sixty-eight nodes carry no '## Disposition' section", and the graph now holds 142 nodes, of which 72 carry no `## Disposition` and 12 of those recommend `ratified` on the authority fact — `class-recommendation`, `delegation-bounds-and-sizing`, `persistence`, `forms`, `bootstrap-exit-conditions`, `quotes`, `purpose-criteria`, `hexis`, `review`, `second-stop`, `traditions-home`, `validation-order`. And `persistence`'s own `deferred-recommendation` text repeats the stale figure, naming "this node among twenty-two carrying no Disposition section". Separately, `commons.systems/disposition-graph/evaluation`'s option `deferred-until-ruling-quoted` opens "Evaluation carries no Disposition section and quotes no ruling of any date", and evaluation now does carry a `## Disposition` — the author's words of 2026-09-03, "disposition: always make recommendations from this greenfield perspective - record this definition of greenfield you provided." — so half the option's stated ground is false.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/review, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/recording.

Proposed: Settle the question once on `commons.systems/disposition-graph/quotes`, which owns how the author's words are retained, and strike the six local options in favour of a citation to that ruling. In the same movement, remove both measurements from `quotes`' option prose: a count of the record inside the record is what `authority`'s `no-census-in-a-standing-answer` option is about, and both of these counts have already gone false. The set of unquoted-ratified nodes is derivable — nodes with no `## Disposition` whose authority fact recommends `ratified` — so the frontier or the alignment page should compute it and the node should name the rule. `evaluation`'s option is amended to drop the clause about carrying no Disposition section, which is no longer true of it.

### Frontier finding, 2026-09-05

Kind: redundancy.

Two nodes maintain a hand-written census of the same population, and they disagree. `commons.systems/disposition-graph/stub-traditions`' option `one-ruling-for-the-prose-lists` says "Verified that fourteen rationales carry such lists while this node's enumeration names twelve and misses dialogue, recording and scope". `commons.systems/disposition-graph/readings`' option `incomplete-enumeration-in-facts` (disposition/disposition-graph/readings.md line 103) says "Measured on 2026-09-05 ... nine rationales carry a prose tradition list, five more carry one only in an account, and `stub-traditions` stands at the maieutic stage with a hand-maintained enumeration naming twelve, which its own `regenerate-enumeration` option already calls stale." Both are counting the rationales that carry prose tradition lists; one says fourteen and one says nine-plus-five, and both concede the third enumeration on `stub-traditions` is stale. This is exactly the failure the `codd-update-anomaly` reading names and cites `stub-traditions` for, reproduced by the two nodes that name it. Downstream of the same population, the option `traditions-to-readings` is pending unruled on four nodes at once — `evaluation`, `instruments`, `materialization` and `validation-order` — so the migration these censuses measure is itself asked four times.

Also named: commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/materialization.

Proposed: The survivor is `commons.systems/disposition-graph/readings`, which owns how references to tradition are recorded. Its answer already says "the rationale of a node never repeats its readings", which is the rule the censuses are counting violations of, so the count belongs to an instrument and not to an option's prose: derive the list of rationales carrying prose tradition lists rather than writing it down, and have `stub-traditions`' options cite `readings` instead of recounting. Strike the numbers from both option texts. `traditions-to-readings` is settled once, on `readings`, and cited from the four nodes rather than pending on each.

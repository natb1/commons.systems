---
question: How is materialized implementation reviewed before it lands?
stage: review
recommendation:
  adopts: standing
  class: ratified
  boldness: high
  amends: "dab5283611f8c4500c3aaef7eb48e3a1338b922c"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 0bed315a5649966f5b5862b84365a8f7d81ba263
alternatives:
  - name: cap-from-contract-class
    source: ai
    ref: "2026-09-03"
  - name: graph-landing-instrument
    source: ai
    ref: "2026-09-03"
  - name: shrink-the-contract
    source: review
    ref: "2026-09-03"
  - name: deferred-not-ratified
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
  - review
  - blocking finding
instrument:
  kind: check
  ref: the code-review instrument on the implementation ref, producing the assessment this node describes
  note: not yet materialized; the shim below stands in for it
shims:
  - artifact: the detached code-review instrument on `main`, `.claude/skills/dispatch-propagate/scripts/dispatch-code-review`, run from the implementation checkout with the script taken from a worktree of `main`, at bootstrap exit for every landing made under the reconciliation shim
    for: the instrument of this node
    liquidation: an instrument on the `greenfield` ref produces the assessment from this node; until then the incumbent instrument's detachment, locks, await loop, and resume cache are facts, not doctrine
    declared: 2026-09-02
---
## Answer

By an adversarial review of each landing's diff before it lands, producing an assessment: the subject diff, a verdict, and a pin of what the review read. The review judges one thing, whether the evidence in the diff matches the contract of the unit that produced it. A finding blocks only when it would change behaviour, break a cited anchor, or lead an executor to a wrong action; every other finding is recorded as a proposal on the node the unit instruments and then dropped from the landing, and dropping is an action, not an omission. Review never settles on zero findings. The landing's scope is frozen when review begins: nothing is added to a file under review, and whatever the review turns up outside the contract goes to a follow-up. Findings are fixed as a batch and the assessment regenerated once per batch, at most twice per landing; a blocking finding raised by the second assessment is fixed before landing, and a blocking finding still open at the cap parks the landing for the author, over which nothing lands. A defect class repaired twice is cut rather than repaired a third time, with a regression test that fails before and passes after. Functional findings reconcile before non-functional ones, both before landing. Effort follows the diff: high for code on a write path, one medium assessment for a diff of documents, plans, or tests only. After a ref's first assessment each review covers only the delta since the last reviewed commit. The fix loop is delegated as a unit; the main thread reads the verdict and lands. During bootstrap, review is required once the disposition a landing materializes is ratified, and for everything before exit; until then functional validation, tests and use, suffices. A graph landing is reviewed by the interview that produced it and by the clean-context review, never by this instrument.

## Rationale

The author's ruling of 2026-09-02 that every bootstrap landing requires shimmed code review, adopted from the rules the legacy bootstrap recorded after measurement: one change thrashed sixteen rounds and fifty-six findings when review settled on zero findings, another went fourteen rounds and twenty-three commits because its diff grew between rounds, and a full assessment costs thirteen to fifteen minutes of wall clock at high effort and about seven at medium. Hence a severity gate that prose findings cannot move, a hard cap with no design-surface exemption, batching, a frozen scope, and a frontier channel for everything the gate excludes. Review is part of reconciliation in both directions: it checks the landing against the disposition it serves, and every excluded finding is a candidate disposition. The bootstrap ordering is the author's ruling of 2026-09-02: "The code review is expensive ... during bootstrap code review is only required after ratification. This is analogous to the recorded greenfield doctrine in the legacy graph that the reconciliation frontier should first validate functionality, and only spend cycles on cross-cutting non-functional validation after that." The graph landing is excluded because its review is the interview itself; the legacy attempt reviewed graph landings by self-review and an audit skill instead of the code instrument, and that asymmetry is settled here rather than carried. Traditions to record as readings: Deming, Out of the Crisis (1986), point 3, cease dependence on inspection, diverged from in keeping adversarial review; content-addressed incremental builds (Bazel, Nix), adopted for pinning what an assessment read so that an unrelated change does not expire it.

## Alternatives

### cap-from-contract-class

The review cap and the effort tiers are not stated on this node but derived from the class of the contract the landing serves, which is what the legacy exit doctrine proposed. The node's own account puts this to the author at ratification, and a clean-context review asked that it be minted as its own question or folded into the ruling's options so the author can answer it.

### graph-landing-instrument

Once landings arrive from many sessions the interview and the clean-context review no longer suffice as the review of a graph landing, and a graph landing gets an instrument of its own. The answer as it stands excludes graph landings from this instrument outright, and the node's account puts the sufficiency question to the author at ratification.

### shrink-the-contract

The two-round cap and its consequence, that a blocking finding still open at the cap parks the landing and nothing lands over it, are dropped in favour of shrinking the unit's contract so a review can finish. The counter-argument notes that the node's own evidence blames a diff that grew between rounds, which is a scope defect rather than a review defect, and that delegation already requires one deliverable per unit. The session replied that delegation's rule is the floor and the cap remains for a contract that still thrashes, and left it to the author whether both stand.

### deferred-not-ratified

The recommendation changes from ratified to deferred, since this node carries no Disposition section and therefore no quoted ruling, which authority makes a ratified stamp invalid without. The placement finding of 2026-09-03 names review among twenty-two such nodes and offers the alternative of adding a Disposition section carrying the ruling it rests on with its date.

## Account

For the author at ratification: whether the review cap and effort tiers stay stated here or derive from the class of the contract the landing serves, which is what the legacy exit doctrine proposed; and whether the interview suffices as the review of a graph landing once landings arrive from many sessions.

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified; boldness high, every number in the answer being transcribed from the legacy record; persistence standing, with the shim, the incumbent code-review instrument on the main branch, and its liquidation condition.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, last sentence: 'A graph landing is reviewed by the interview that produced it, not by this instrument.' Recording, in this same batch, adds a reader who did not produce it and makes it mandatory before every confirmation, and growth lists 'the review' as a movement of the sitting. As written the sentence tells an executor that graph landings get no independent reader. Suggested edit: name the clean-context review as the graph landing's independent reader.
- Answer: the operating numbers — 'at most twice per landing', 'a defect class repaired twice is cut rather than repaired a third time', 'high for code on a write path, one medium assessment for a diff of documents' — are transcribed from legacy measurements cited in the Rationale. Legacy says legacy is evidence and 'never authority' and evaluation says 'no doctrine is implied by what exists'. The Rationale frames them correctly as measurement; the answer states them as doctrine with no criterion that would re-measure them here.
- Frontmatter carries both an instrument whose note says 'not yet materialized; the shim below stands in for it' and the shim itself. Transience's second author ruling asks that there be no redundancy between shims and other records; the note duplicates the shim's own account. Suggested edit: let the shim carry it.
- Proposal: 'For the author at ratification: whether the review cap and effort tiers stay stated here or derive from the class of the contract ... and whether the interview suffices as the review of a graph landing once landings arrive from many sessions.' Two open questions carried as prose in a node at stage review; transience makes an open question a node with a stage. Suggested edit: mint them, or fold them into the ruling's options so the author can answer them.

On the three facts: Generic template, and it omits the shim entirely — this node declares the detached code-review instrument on main, and growth's presentation rule requires each shim with its liquidation condition. Boldness is high, not 'as the rationale shows': every number and every gate in the answer is the AI's transcription from the legacy record, which the author has not ruled on in this graph, and the author's only quoted words here concern when review is owed during bootstrap.

Strongest counter-argument (moderate): The whole answer is a defence against one measured pathology — review loops that never converge — and every mechanism in it trades correctness for termination. Stated as doctrine that means a landing with a real blocking defect at the cap 'parks the landing for the author, over which nothing lands', converting a review failure into a full stop of the work queue; and 'Review never settles on zero findings' makes a clean diff evidence of a bad review rather than of good code. The cheaper answer the node never considers is to shrink the contract so a review can finish: its own evidence says one change thrashed because 'its diff grew between rounds', which is a scope defect, not a review defect, and delegation already requires one deliverable per unit.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, last sentence: 'A graph landing is reviewed by the interview that produced it, not by this instrument.' Recording, in this same batch, adds a reader who did not produce it and makes it mandatory before every confirmation; frontier-consistency makes it a batch over the whole frontier. As written the sentence tells an executor that graph landings get no independent reader. Suggested edit: name the clean-context review as the graph landing's independent reader.
- Frontmatter carries both an 'instrument:' whose note says 'not yet materialized; the shim below stands in for it' and the shim itself. The author's ruling quoted on transience asks for no redundancy between shims and other records; the note duplicates the shim's account. Suggested edit: let the shim carry it.
- Proposal carries two open questions as prose ('whether the review cap and effort tiers stay stated here or derive from the class of the contract ... and whether the interview suffices as the review of a graph landing'). Transience makes an open question a node with a stage. Suggested edit: mint them, or fold them into the ruling's options.
- The shim's artifact is 'the detached code-review instrument on `main`, `.claude/skills/dispatch-propagate/scripts/dispatch-code-review`'. Not verifiable from this ref, which carries no intentions/ or dispatch skills; the shim names a path on another branch and the frontier cannot read it. Suggested edit: say the artifact is on main and how the frontier is to check it.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value; the prose Facts line is the generic template stating two, and it omits the shim entirely, which growth's presentation rule requires. Boldness is high, not moderate: every number and gate in the answer is transcribed from the legacy record, which the author has not ruled on in this graph.

Strongest counter-argument (moderate): The whole answer is a defence against one measured pathology — review loops that never converge — and every mechanism in it trades correctness for termination. As doctrine that means a landing with a real blocking defect at the cap 'parks the landing for the author, over which nothing lands', converting a review failure into a full stop of the work queue; and 'Review never settles on zero findings' makes a clean diff evidence of a bad review rather than of good code. The cheaper answer the node never considers is to shrink the contract so a review can finish: its own evidence says one change thrashed because its diff grew between rounds, which is a scope defect, and delegation already requires one deliverable per unit.

The session's reply: Validated. Amended tonight: a graph landing is reviewed by the interview and by the clean-context review, never by this instrument; the boldness is high, every number being transcribed from the legacy record. The instrument note that duplicates the shim, the two open questions in prose, and the shim's artifact on main, checked from a worktree of main, are settled at the sitting. On the counter-argument, that a smaller contract beats a cap: delegation's one-deliverable rule is that floor, and the cap remains for a contract that still thrashes; the author rules whether both stand. Stage review: the answer changed.

### Frontier finding, 2026-09-03

Kind: placement.

Authority's rule is that 'a ratified stamp whose ruling is not in the record is invalid', and quotes' session reply settles that the ruling stays in the node under '## Disposition'. Verified that twenty-two of the sixty-two nodes carry no '## Disposition' section at all, among them evaluation, persistence, legacy, validation-order, review, attention and recording — every one of which is at the ruling stage recommending 'ratified' — and all three public nodes. Quotes is therefore a bar on roughly a third of the frontier, and its own Options block still marks the withdrawn option as recommended.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/attention, commons.systems/disposition-graph/recording.

Proposed: Rule quotes first, after agency. Then, before any ratified stamp is written, each of the twenty-two nodes either gains a '## Disposition' section carrying the ruling it rests on with its date — attention and recording already have the quotations in their rationales and need only move them, which also makes the alignment page show them — or its recommendation changes from ratified to deferred, since a ratified stamp it cannot support is worse than an honest deferral. Quotes' facts state the count.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `cap-from-contract-class` (ai, 2026-09-03); `graph-landing-instrument` (ai, 2026-09-03); `shrink-the-contract` (review, 2026-09-03); `deferred-not-ratified` (review, 2026-09-03).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
The census unit's note: The node has an answer and no draft, so it adopts standing. Its own account already holds two questions open for the author at ratification and a review asked that they be minted or turned into options, so I made both alternatives; that is exactly what the new encoding is for. The counter-argument the session answered but explicitly left for the author, shrinking the contract instead of capping the loop, is the third. The fourth comes from the placement finding, which offers this node a real choice of ruling rather than an observation. I excluded the settled edits, the instrument note that duplicates the shim, the graph-landing sentence already amended, and the shim's path on main. There is no Disposition section at all, so the merge analysis is empty, which is itself the ground of the fourth alternative; the placement finding names eight other nodes but is carried on each of them, so nothing goes elsewhere.

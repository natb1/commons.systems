---
question: How is materialized implementation reviewed before it lands?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 0bed315a5649966f5b5862b84365a8f7d81ba263
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

By an adversarial review of each landing's diff before it lands, producing an assessment: the subject diff, a verdict, and a pin of what the review read. The review judges one thing, whether the evidence in the diff matches the contract of the unit that produced it. A finding blocks only when it would change behaviour, break a cited anchor, or lead an executor to a wrong action; every other finding is recorded as a proposal on the node the unit instruments and then dropped from the landing, and dropping is an action, not an omission. Review never settles on zero findings. The landing's scope is frozen when review begins: nothing is added to a file under review, and whatever the review turns up outside the contract goes to a follow-up. Findings are fixed as a batch and the assessment regenerated once per batch, at most twice per landing; a blocking finding raised by the second assessment is fixed before landing, and a blocking finding still open at the cap parks the landing for the author, over which nothing lands. A defect class repaired twice is cut rather than repaired a third time, with a regression test that fails before and passes after. Functional findings reconcile before non-functional ones, both before landing. Effort follows the diff: high for code on a write path, one medium assessment for a diff of documents, plans, or tests only. After a ref's first assessment each review covers only the delta since the last reviewed commit. The fix loop is delegated as a unit; the main thread reads the verdict and lands. During bootstrap, review is required once the disposition a landing materializes is ratified, and for everything before exit; until then functional validation, tests and use, suffices. A graph landing is reviewed by the interview that produced it, not by this instrument.

## Rationale

The author's ruling of 2026-09-02 that every bootstrap landing requires shimmed code review, adopted from the rules the legacy bootstrap recorded after measurement: one change thrashed sixteen rounds and fifty-six findings when review settled on zero findings, another went fourteen rounds and twenty-three commits because its diff grew between rounds, and a full assessment costs thirteen to fifteen minutes of wall clock at high effort and about seven at medium. Hence a severity gate that prose findings cannot move, a hard cap with no design-surface exemption, batching, a frozen scope, and a frontier channel for everything the gate excludes. Review is part of reconciliation in both directions: it checks the landing against the disposition it serves, and every excluded finding is a candidate disposition. The bootstrap ordering is the author's ruling of 2026-09-02: "The code review is expensive ... during bootstrap code review is only required after ratification. This is analogous to the recorded greenfield doctrine in the legacy graph that the reconciliation frontier should first validate functionality, and only spend cycles on cross-cutting non-functional validation after that." The graph landing is excluded because its review is the interview itself; the legacy attempt reviewed graph landings by self-review and an audit skill instead of the code instrument, and that asymmetry is settled here rather than carried. Traditions to record as readings: Deming, Out of the Crisis (1986), point 3, cease dependence on inspection, diverged from in keeping adversarial review; content-addressed incremental builds (Bazel, Nix), adopted for pinning what an assessment read so that an unrelated change does not expire it.

## Proposal

For the author at ratification: whether the review cap and effort tiers stay stated here or derive from the class of the contract the landing serves, which is what the legacy exit doctrine proposed; and whether the interview suffices as the review of a graph landing once landings arrive from many sessions.

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified if the author confirms, or delegated where the author's words delegate it; boldness moderate, the AI's drafting from the author's rulings and from the legacy record as evidence; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, last sentence: 'A graph landing is reviewed by the interview that produced it, not by this instrument.' Recording, in this same batch, adds a reader who did not produce it and makes it mandatory before every confirmation, and growth lists 'the review' as a movement of the sitting. As written the sentence tells an executor that graph landings get no independent reader. Suggested edit: name the clean-context review as the graph landing's independent reader.
- Answer: the operating numbers — 'at most twice per landing', 'a defect class repaired twice is cut rather than repaired a third time', 'high for code on a write path, one medium assessment for a diff of documents' — are transcribed from legacy measurements cited in the Rationale. Legacy says legacy is evidence and 'never authority' and evaluation says 'no doctrine is implied by what exists'. The Rationale frames them correctly as measurement; the answer states them as doctrine with no criterion that would re-measure them here.
- Frontmatter carries both an instrument whose note says 'not yet materialized; the shim below stands in for it' and the shim itself. Transience's second author ruling asks that there be no redundancy between shims and other records; the note duplicates the shim's own account. Suggested edit: let the shim carry it.
- Proposal: 'For the author at ratification: whether the review cap and effort tiers stay stated here or derive from the class of the contract ... and whether the interview suffices as the review of a graph landing once landings arrive from many sessions.' Two open questions carried as prose in a node at stage review; transience makes an open question a node with a stage. Suggested edit: mint them, or fold them into the ruling's options so the author can answer them.

On the three facts: Generic template, and it omits the shim entirely — this node declares the detached code-review instrument on main, and growth's presentation rule requires each shim with its liquidation condition. Boldness is high, not 'as the rationale shows': every number and every gate in the answer is the AI's transcription from the legacy record, which the author has not ruled on in this graph, and the author's only quoted words here concern when review is owed during bootstrap.

Strongest counter-argument (moderate): The whole answer is a defence against one measured pathology — review loops that never converge — and every mechanism in it trades correctness for termination. Stated as doctrine that means a landing with a real blocking defect at the cap 'parks the landing for the author, over which nothing lands', converting a review failure into a full stop of the work queue; and 'Review never settles on zero findings' makes a clean diff evidence of a bad review rather than of good code. The cheaper answer the node never considers is to shrink the contract so a review can finish: its own evidence says one change thrashed because 'its diff grew between rounds', which is a scope defect, not a review defect, and delegation already requires one deliverable per unit.

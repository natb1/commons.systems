---
question: How is materialized implementation reviewed before it lands?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/work-loop
defines:
  - review
  - assessment
  - blocking finding
instrument:
  kind: check
  ref: the detached code-review instrument on `main`, `.claude/skills/dispatch-propagate/scripts/dispatch-code-review`, run from the `greenfield` worktree (shim)
  note: liquidates when an instrument on the `greenfield` ref produces the assessment from this node; until then the incumbent instrument's detachment, locks, await loop, and resume cache are facts, not doctrine
ledger: L29
---
## Answer

By an adversarial review of each landing's diff before it lands, producing an assessment: the subject diff, a verdict, and a pin of what the review read. The review judges one thing, whether the evidence in the diff matches the contract of the unit that produced it. A finding blocks only when it would change behaviour, break a cited anchor, or lead an executor to a wrong action; every other finding is recorded as a proposal on the node the unit instruments and then dropped from the landing, and dropping is an action, not an omission. Review never settles on zero findings. The landing's scope is frozen when review begins: nothing is added to a file under review, and whatever the review turns up outside the contract goes to a follow-up. Findings are fixed as a batch and the assessment regenerated once per batch, at most twice per landing; a blocking finding raised by the second assessment is fixed before landing, and a blocking finding still open at the cap parks the landing for the author, over which nothing lands. A defect class repaired twice is cut rather than repaired a third time, with a regression test that fails before and passes after. Functional findings reconcile before non-functional ones, both before landing. Effort follows the diff: high for code on a write path, one medium assessment for a diff of documents, plans, or tests only. After a ref's first assessment each review covers only the delta since the last reviewed commit. The fix loop is delegated as a unit; the main thread reads the verdict and lands. A graph landing is reviewed by the interview that produced it, not by this instrument.

## Rationale

The author's ruling of 2026-09-02 that every bootstrap landing requires shimmed code review, adopted from the rules the legacy bootstrap recorded after measurement: one change thrashed sixteen rounds and fifty-six findings when review settled on zero findings, another went fourteen rounds and twenty-three commits because its diff grew between rounds, and a full assessment costs thirteen to fifteen minutes of wall clock at high effort and about seven at medium. Hence a severity gate that prose findings cannot move, a hard cap with no design-surface exemption, batching, a frozen scope, and a frontier channel for everything the gate excludes. Review is part of reconciliation in both directions: it checks the landing against the disposition it serves, and every excluded finding is a candidate disposition. The graph landing is excluded because its review is the interview itself; the legacy attempt reviewed graph landings by self-review and an audit skill instead of the code instrument, and that asymmetry is settled here rather than carried. Traditions to record as readings: Deming, Out of the Crisis (1986), point 3, cease dependence on inspection, diverged from in keeping adversarial review; content-addressed incremental builds (Bazel, Nix), adopted for pinning what an assessment read so that an unrelated change does not expire it. Ledger L29.

## Proposal

For the author at ratification: whether the review cap and effort tiers stay stated here or derive from the class of the contract the landing serves, which is what the legacy exit doctrine proposed; and whether the interview suffices as the review of a graph landing once landings arrive from many sessions.

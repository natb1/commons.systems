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
  note: liquidates when an instrument on the `greenfield` ref produces the assessment from this node; until then the incumbent instrument's detachment, locks, and await loop are facts, not doctrine
ledger: L29
---
## Answer

By an adversarial review of each landing's diff before it lands, producing an assessment: the subject diff, a verdict, and a pin of what the review read. The review judges one thing, whether the evidence in the diff matches the contract of the unit that produced it. A finding blocks only when it shows a violation of that contract or a regression of a check that ever passed; every other finding is recorded as a proposal on the node the unit instruments and never blocks, never enters the fix loop. Findings are fixed as a batch and the assessment regenerated once per batch, at most twice per landing; an open blocking finding at that cap parks the landing for the author, and nothing lands over it. Functional findings are reconciled before non-functional ones, both before landing, and the scope of the landing does not grow inside its review. Review runs at high effort by default and at medium for a diff that touches only documents, plans, or tests. The fix loop is delegated as a unit; the main thread reads the verdict and lands.

## Rationale

The author's ruling of 2026-09-02 that every bootstrap landing requires shimmed code review, adopted from the rules the legacy bootstrap recorded after measuring a sixteen-round review thrash on one change: a regeneration cap, batching, a severity gate that cannot be moved by prose findings, and a frontier channel for everything the gate excludes. Review is part of reconciliation in both directions: it checks the landing against the disposition it serves, and every excluded finding is a candidate disposition. Traditions to record as readings: Deming, Out of the Crisis (1986), point 3, cease dependence on inspection, diverged from in keeping adversarial review of prose and code; content-addressed incremental builds (Bazel, Nix), adopted for pinning what an assessment read so that an unrelated change does not expire it. Ledger L29.

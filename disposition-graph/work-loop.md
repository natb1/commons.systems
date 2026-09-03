---
question: How does work happen?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - frontier
  - bite
  - reconcile
  - variance
ledger: L11
---
## Answer

By reconciliation in both directions. The frontier is derived, never stored: every answer whose instrument fails is on it, ranked by the node's rank. In the first direction a session claims a frontier item, takes a bite, materializes what the disposition requires, records evidence, and the instrument reads the result. In the second direction any materialized artifact with no supporting disposition, code, a skill, a rule, the README, or a node of the legacy record, is itself a frontier item: the reconciler proposes a disposition that would support it, citing the artifact as evidence, or proposes pruning it, and the author rules at review. Coverage ranks that direction: an artifact no disposition cites or instruments is a prune-by-default proposal.

## Rationale

The author's ruling of 2026-09-02 that reconciliation must run from disposition to missing implementation and from unsupported implementation to new disposition or pruning. The second direction subsumes transcription of the legacy record and its drain: legacy nodes are pulled in when a question needs them and pruned in bulk otherwise. Traditions to record as readings: level-triggered reconciliation in Kubernetes; one-piece flow. Ledger L11, L17.

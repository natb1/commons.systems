---
question: How is attention allocated?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
under:
  - commons.systems/disposition-graph/model
defines:
  - boost
  - onboarding path
ledger: L13
---
## Answer

By rank, which is one fact with three readings. Rank is computed from the `under` tree: roots share the whole, and each node's share is divided among its children, weighted by boost, an allocation only the author may ratify. The three readings are the onboarding path, the order a newcomer meets the record, which is the tree walked in rank order; frontier attention, where work goes first; and the compaction floor, what stays in a session's context when it is trimmed. During bootstrap the author's choice of what comes next is therefore a boost ratification, so the bootstrap order and the ranking agree by construction.

## Rationale

The author's ruling of 2026-09-02 that ranking serves onboarding. Prerequisites come from `under` and importance from rank, so a pedagogical order and a priority order do not fight: the walk descends the tree and orders siblings by rank. Rejected: choosing a parent to change priority. Ledger L13.

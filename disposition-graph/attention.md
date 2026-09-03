---
question: How is attention allocated?
stage: review
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
---
## Answer

By rank, which is one fact with three readings. Rank is computed from the `under` tree: roots share the whole, and each node's share is divided among its children, weighted by boost, an allocation only the author may ratify. The three readings are the onboarding path, the order a newcomer meets the record, which is the tree walked in rank order; frontier attention, where work goes first; and the compaction floor, what stays in a session's context when it is trimmed. During bootstrap the author's choice of what comes next is therefore a boost ratification, so the bootstrap order and the ranking agree by construction. The high-level order, the sections of the record after purpose, is recorded once on the scope node, and the boosts of the nodes it names are held to that order; every other boost is the node's own.

## Rationale

The author's ruling of 2026-09-02 that ranking serves onboarding. Prerequisites come from `under` and importance from rank, so a pedagogical order and a priority order do not fight: the walk descends the tree and orders siblings by rank. Rejected: choosing a parent to change priority. The author, 2026-09-03: "priotity is encoded as rank", and, on the order of reconciliation: "The shim will iteratively bite work from the frontier in rank order for reconciliation. i.e. purpose/browser artifact (browser artifact may need new high ranking disposition) -> alignment skill -> the rest of the context management for the harness (CLAUDE.md, rules, CLAUDE.local.md per worktree) -> the non-shim reconciliation harness (codified reconciliation orchestrator, skills for each bite type)." The boosts of 2026-09-03 transcribe that order among the children of model, projection above growth above the work loop, with values the AI chose and the author has not ratified; the earlier boost of the same day, model first under purpose, stands. Later on 2026-09-03 the author recorded the high-level order on the scope node, and the boosts of the nodes it names were reset to realize it: the scope node 9 under purpose and session-context 6 under projection, raised from 2 because at 2 it ranked below the work loop; the validator holds the ranks to that order since 2026-09-03. A browser node was not added for rank: a child's rank is a share of its parent's, so the browser bite ranks first through projection's boost, and a browser node is owed by projection's shim at its sitting.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified if the author confirms, or delegated where the author's words delegate it; boldness as the rationale shows, the AI's drafting from the author's rulings and from the legacy record as evidence; persistence standing.

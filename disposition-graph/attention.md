---
question: How is attention allocated?
stage: ruling
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

By rank, which is one fact with three readings. Rank is computed from the `under` tree: roots share the whole, and each node's share is divided among its children, weighted by boost, an allocation only the author may ratify, and every boost in the record today is the AI's and unratified. The three readings are the onboarding path, the order a newcomer meets the record, which is the tree walked in rank order; frontier attention, where work goes first; and the compaction floor, what stays in a session's context when it is trimmed, which nothing reads yet and which is owed. During bootstrap the author's choice of what comes next is therefore a boost ratification, so the bootstrap order and the ranking agree by construction. The high-level order, the sections of the record after purpose, is recorded once on the scope node, and the boosts of the nodes it names are held to that order; every other boost is the node's own.

## Rationale

The author's ruling of 2026-09-02 that ranking serves onboarding. Prerequisites come from `under` and importance from rank, so a pedagogical order and a priority order do not fight: the walk descends the tree and orders siblings by rank. Rejected: choosing a parent to change priority. The author, 2026-09-03: "priotity is encoded as rank", and, on the order of reconciliation: "The shim will iteratively bite work from the frontier in rank order for reconciliation. i.e. purpose/browser artifact (browser artifact may need new high ranking disposition) -> alignment skill -> the rest of the context management for the harness (CLAUDE.md, rules, CLAUDE.local.md per worktree) -> the non-shim reconciliation harness (codified reconciliation orchestrator, skills for each bite type)." The boosts of 2026-09-03 transcribe that order among the children of model, projection above growth above the work loop, with values the AI chose and the author has not ratified; the earlier boost of the same day, model first under purpose, stands. Later on 2026-09-03 the author recorded the high-level order on the scope node, and the boosts of the nodes it names were reset to realize it: the scope node 9 under purpose and session-context 6 under projection, raised from 2 because at 2 it ranked below the work loop; the validator holds the ranks to that order since 2026-09-03. A browser node was not added for rank: a child's rank is a share of its parent's, so the browser bite ranks first through projection's boost, and a browser node is owed by projection's shim at its sitting.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified if the author confirms, or delegated where the author's words delegate it; boldness as the rationale shows, the AI's drafting from the author's rulings and from the legacy record as evidence; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: 'weighted by boost, an allocation only the author may ratify', while this node's own Rationale records that the boosts of 2026-09-03 have 'values the AI chose and the author has not ratified'. Both sentences are true, but a reader of the answer alone takes today's ranks for the author's. Suggested edit: add that every boost in the record today is the AI's and unratified.
- Answer, last sentence: 'The high-level order ... is recorded once on the scope node, and the boosts of the nodes it names are held to that order.' Verified against packages/disposition/read.mjs, which enforces the order field. Accurate.
- The node carries no '## Disposition' section, although its Rationale quotes the author twice with dates, which is what the quotes sitting resolved to require. Because the alignment page renders 'The author's words' only from the Disposition section (renderAlignmentItem), the author sees this node with an empty author-words section and their own quoted rulings buried in the account. Suggested edit: move the two quotes into '## Disposition'.
- Answer: rank's third reading, 'the compaction floor, what stays in a session's context when it is trimmed', is realized nowhere: session-context names three projections and no compaction rule, and no tool reads rank for context. Suggested edit: mark it as owed or strike it.

On the three facts: Generic template. Boldness is moderate to high, not 'as the rationale shows': the three readings of rank and the claim that the pedagogical and priority orders coincide are the AI's, and only 'priotity is encoded as rank' and the bite order are the author's. The facts should also state that the boosts this answer governs are all unratified, since the answer says only the author may ratify them.

Strongest counter-argument (strong): The node asserts that a teaching order, a work order and a compaction floor coincide because prerequisites come from 'under' and importance from rank. They came apart within a day, and this node records it: session-context at boost 2 ranked below the work loop, so 'harness context management ranked after reconciliation against the author's order of the same day', and the fix was to raise a boost by hand and then to add a whole new field on another node to pin the order. That is direct evidence that one scalar cannot carry two orders, and the scope node's order field is the admission. The alternative this node never considers is the one that actually worked: let the author state the order and derive nothing.

The session's reply: The counter-argument is right that the boosts alone could not hold the order, and the record already says so: the author's order on the scope node is data, and the validator holds the ranks to it since 2026-09-03. Rank stays one scalar because the frontier, the page, and the browser need one order to walk, and the order field is the constraint on it, not a second order. Accepted: the answer now says that every boost in the record today is the AI's and unratified, and the compaction-floor reading of rank is marked as owed, since nothing reads rank for context yet; the two quoted rulings move to the Disposition section at the recording.

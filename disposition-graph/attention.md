---
question: How is attention allocated?
stage: review
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 6a5e093e68be10a9caaaae8af36ea7f1f5b30ecc
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
## Disposition

The author, 2026-09-03:
> priotity is encoded as rank

The author, 2026-09-03, on the order of reconciliation:
> The shim will iteratively bite work from the frontier in rank order for reconciliation. i.e. purpose/browser artifact (browser artifact may need new high ranking disposition) -> alignment skill -> the rest of the context management for the harness (CLAUDE.md, rules, CLAUDE.local.md per worktree) -> the non-shim reconciliation harness (codified reconciliation orchestrator, skills for each bite type).

## Answer

By rank, which is one fact with three readings. Rank is computed from the `under` tree: roots share the whole, and each node's share is divided among its children, weighted by boost, an allocation only the author may ratify, and every boost in the record today is the AI's and unratified. The three readings are the onboarding path, the order a newcomer meets the record, which is the tree walked in rank order; frontier attention, where work goes first; and the compaction floor, what stays in a session's context when it is trimmed, which nothing reads yet and which is owed. During bootstrap the author's choice of what comes next is therefore a boost ratification, so the bootstrap order and the ranking agree by construction. The high-level order, the sections of the record after purpose, is recorded once on the scope node, and the boosts of the nodes it names are held to that order; every other boost is the node's own.

## Rationale

The author's ruling of 2026-09-02 that ranking serves onboarding. Prerequisites come from `under` and importance from rank, so a pedagogical order and a priority order do not fight: the walk descends the tree and orders siblings by rank. Rejected: choosing a parent to change priority. The author, 2026-09-03, quoted above: priority is encoded as rank, and the shim bites the frontier in rank order, purpose and the browser first, then the alignment skill, then the harness context, then the non-shim reconciliation harness. The boosts of 2026-09-03 transcribe that order among the children of model, projection above growth above the work loop, with values the AI chose and the author has not ratified; the earlier boost of the same day, model first under purpose, stands. Later on 2026-09-03 the author recorded the high-level order on the scope node, and the boosts of the nodes it names were reset to realize it: the scope node 9 under purpose and session-context 6 under projection, raised from 2 because at 2 it ranked below the work loop; the validator holds the ranks to that order since 2026-09-03. A browser node was not added for rank: a child's rank is a share of its parent's, so the browser bite ranks first through projection's boost, and a browser node is owed by projection's shim at its sitting.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified; boldness moderate; persistence standing; every boost the answer governs is the AI's and unratified.

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

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node carries no '## Disposition' section, although its Rationale quotes the author twice with dates. Verified consequential: the alignment page renders 'The author's words' only from the Disposition section, so the author sees this node with an empty author-words panel and their own quoted rulings buried in the AI's account. Unchanged since the previous review, which accepted the move 'at the recording'.
- Answer: rank's third reading, 'the compaction floor, what stays in a session's context when it is trimmed', is now marked 'which nothing reads yet and which is owed'. That disclosure is correct and is the model the batch's other unmaterialized claims should follow.
- Answer: 'The high-level order ... is recorded once on the scope node, and the boosts of the nodes it names are held to that order.' Verified true: read.mjs enforces both the step rule and the first-step rule, and the graph validates.
- Answer defines 'boost' and 'onboarding path' but uses 'rank' throughout; 'rank' is defined by the under node, which is at the maieutic stage with 'Proposed: pending'. Four nodes at the ruling stage (this one, scope, alignment-target, unanswered) rest on a term whose defining node has no answer.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value. The prose Facts line is the generic template stating two classes and 'boldness as the rationale shows' is gone from this node but the two-class problem remains. The facts should say that every boost this answer governs is unratified, since the answer says only the author may ratify them.

Strongest counter-argument (strong): The node asserts that a teaching order, a work order and a compaction floor coincide because prerequisites come from 'under' and importance from rank. They came apart within a day, and this node records it: session-context at boost 2 ranked below the work loop against the author's order, and the fix was to raise a boost by hand and then add a whole new field on another node to pin the order. That is direct evidence that one scalar cannot carry two orders, and the scope node's order field is the admission. The alternative this node never considers is the one that worked: let the author state the order and derive nothing.

The session's reply: Validated. Amended tonight: the author's two quotations move from the rationale into a Disposition section, where the alignment page shows them. Accepted: rank is defined by under, at the maieutic stage, and the decomposition finding proposes moving the term here; that is the author's to rule at under's sitting, and this node's answer already answers rank. On the counter-argument, that one scalar cannot carry two orders: the scope node's order field is the record's admission, recorded there, and this answer holds the boosts to it; every boost today is the AI's and unratified, which the Facts line now says. Stage review.

### Frontier finding, 2026-09-03

Kind: contradiction.

Model's draft rationale: 'growth is first among them because the sitting is the first thing a newcomer does.' Second-stop's amendment withdrew exactly that: 'projection stays first among model's children and the boost half of the recommendation is withdrawn'. Attention's rationale records projection at 5 and growth at 4 as the transcription of the author's own reconciliation order, and the frontier confirms those boosts. Model's draft would be ratified saying the opposite of what two other nodes and the record's ranks say.

Also named: commons.systems/disposition-graph/model, commons.systems/disposition-graph/second-stop.

Proposed: Second-stop and attention are the survivors. Model's draft strikes the sentence; if the model node wants to say where a newcomer acts first, it says that alignment is where the newcomer acts first without asserting a rank, which is what second-stop's amended option already permits.

### Frontier finding, 2026-09-03

Kind: decomposition.

Under answers four questions at once — what an edge means, how rank is computed, what a ceiling is, and how context loads — and defines all four terms, while standing at the maieutic stage with 'Proposed: pending' and no draft. Three of the four are answered in full elsewhere: attention answers rank, session-context answers what a session loads, and authority's answer already carries the scope rule that 'ceiling' names. Two child nodes have been carved out of it already (rationale-edge, tier), and its Proposal says its own text cannot be drafted until three questions are ruled. Meanwhile four ruling-stage nodes rest on 'rank' and one on 'ceiling', terms only under defines.

Also named: commons.systems/disposition-graph/under, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/tier.

Proposed: Under survives as the edge alone: what a node refines, that it is the only hierarchical edge, and that a node may refine more than one question. 'rank' moves to attention's defines, which already answers it; 'context' moves to session-context's defines; 'ceiling' moves to authority's defines, which is where the scope rule it names lives. Under then has one question and can be drafted without waiting on rationale-edge and tier.

### Frontier finding, 2026-09-03

Kind: placement.

Authority's rule is that 'a ratified stamp whose ruling is not in the record is invalid', and quotes' session reply settles that the ruling stays in the node under '## Disposition'. Verified that twenty-two of the sixty-two nodes carry no '## Disposition' section at all, among them evaluation, persistence, legacy, validation-order, review, attention and recording — every one of which is at the ruling stage recommending 'ratified' — and all three public nodes. Quotes is therefore a bar on roughly a third of the frontier, and its own Options block still marks the withdrawn option as recommended.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Rule quotes first, after agency. Then, before any ratified stamp is written, each of the twenty-two nodes either gains a '## Disposition' section carrying the ruling it rests on with its date — attention and recording already have the quotations in their rationales and need only move them, which also makes the alignment page show them — or its recommendation changes from ratified to deferred, since a ratified stamp it cannot support is worse than an honest deferral. Quotes' facts state the count.

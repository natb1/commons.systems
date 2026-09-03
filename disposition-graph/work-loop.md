---
question: How does work happen?
stage: review
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: kickback
  strength: strong
  date: 2026-09-03
  of: 2ab46e3e5ed431e37cc78268623ead05324369ad
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
boost: 3
under:
  - commons.systems/disposition-graph/model
defines:
  - frontier
  - bite
  - reconcile
  - variance
shims:
  - artifact: "`.claude/skills/reconcile/SKILL.md` on the implementation ref, the reconciliation skill hand-written from this node and its siblings, run by a session that takes one bite per invocation from the answered frontier in rank order, from disposition to implementation only, never writes the graph, and skips functional validation, non-functional validation, and validation in use on the main branch"
    for: the reconciliation orchestrator and the skills for each kind of bite that this node and its children will project
    liquidation: the orchestrator and the bite skills are materialized from ratified nodes, and every landing made under this shim has passed the validation it skipped, functional validation against its node's criteria, the review instrument's assessment, and validation in use after the implementation ref is swapped with the main branch; and every rule this project runs under is a node or a declared shim, dispatch selects from this graph, the alignment skill is the only path by which a node is recorded, and nothing live reads the legacy record; and the second direction, every artifact on the implementation ref that no node justifies supported by a disposition or pruned, and the drain of every legacy tactic node, transcribed to this graph or pruned, are complete, neither begun before the disposition that states them is answered
    declared: 2026-09-03
---
## Disposition

The author, 2026-09-03, in the evening, on the transition to new bootstrap operations:
> Prepare for compaction. After compaction we will confirm the steps to be ready to transition to new bootstrap operations (described before compaction). The expectation is that after checking out the greenfield ref and launching new claude sessions from there:
> - I can use the alignment skill and alignment artifact to begin marking dispositions as answered
> - In the meantime the shim reconciliation skill (only a skill during bootstrap) would exist with no work because there are no nodes with authority (they are all unanswered)
> - Once the answered frontier exists, the reconciliation will begin taking bites of the frontier. The skill will execute one iteration to select and reconcile a bite.
> - The reconciliation shim will prioritize bites in rank order.
> - Summarize the other requirements I gave for the reconciliation shim.

The author, 2026-09-03, after that evening's compaction, on the first item of the summary the session gave, that bite work resolves in both directions:
> "Resolves in both directions" this is required for bootstrap exit, but not transition. Disposition must me answered before this is shimmed or materialized . Only resolved from graph to implementation

The author, 2026-09-03, the same exchange, on the second item of that summary, that all legacy tactic nodes are drained during bootstrap:
> "All legacy tactic nodes are drained during bootstrap" also required for exit but not transition

The author, 2026-09-03, the same exchange, on the summary's item that the author owns the graph and subagents work from it:
> "You own the graph" - correct that implementation is delegated, each bite type gets a skill with "appropriate " recursive subagents ("appropriate" is open question) but reconsiliation does not edit the graph. That is alignment only.

The author, 2026-09-03, the same exchange, on what follows from that:
> Since reconciliation does not edit the graph it may need to persist some other metadata to track reconciliation state

## Answer

By reconciliation in both directions. The frontier is derived, never stored: every answer whose instrument fails is on it, ranked by the node's rank. In the first direction a session claims a frontier item, takes a bite, materializes what the disposition requires, records evidence, and the instrument reads the result. In the second direction any materialized artifact with no supporting disposition, code, a skill, a rule, the README, or a node of the legacy record, is itself a frontier item: the reconciler proposes a disposition that would support it, citing the artifact as evidence, or proposes pruning it, and the author rules at review. Coverage ranks that direction: an artifact no disposition cites or instruments is a prune-by-default proposal. A bite on materialized implementation passes through implementation, functional validation, non-functional validation, landing on the main branch, and validation in use there, each a reconciliation of the criteria the node carries and never a phase of a dispatcher: the frontier re-derives after every landing, and what the instruments still fail is the next bite. Sessions divide by ref: an alignment session writes the graph, and only alignment writes it; a reconciliation session writes the implementation ref and never the graph. A divergence that needs the author is reported by the session that found it, with its recommendation, and stays on the frontier, derived and never stored, until the alignment dialogue records it; a shim whose condition reconciliation has met keeps its declaration until alignment removes it. Un-aligned dispositions are alignment's work, never reconciliation's. Whether reconciliation keeps state of its own between invocations, the divergences it has reported, a bite in flight, is open; the recommendation is that such state lives on the implementation ref as committed files a disposition justifies, never in the graph, so that the frontier derives from the graph, the implementation, and that state together.

## Rationale

The author's ruling of 2026-09-02 that reconciliation must run from disposition to missing implementation and from unsupported implementation to new disposition or pruning. The second direction subsumes transcription of the legacy record and its drain: legacy nodes are pulled in when a question needs them and pruned in bulk otherwise. Traditions to record as readings: level-triggered reconciliation in Kubernetes; one-piece flow.

The author, 2026-09-03, on bootstrap operations: "I will check out the greenfield ref at repo root and launch a new session to act as the reconciliation shim. Ideally, the reconciliation shim instructions are well defined enough to run with sonnet, but recommend the model this shim must run as. Does any work need to be done to prepare for this - for example to prepare the shim to be run as sonnet. Encode the shim as a skill with the recommended model so that I can initialize a session to act as the reconciliation shim by invoking that skill. The shim will iteratively bite work from the frontier in rank order for reconciliation. i.e. purpose/browser artifact (browser artifact may need new high ranking disposition) -> alignment skill -> the rest of the context management for the harness (CLAUDE.md, rules, CLAUDE.local.md per worktree) -> the non-shim reconciliation harness (codified reconciliation orchestrator, skills for each bite type). Non-shim bites will progress materialized artifacts (code, skills, rules etc.) through implementation, functional validation, non-functional validation, merge and qa on main (implicitly using reconciliation of signals/instruments/criteria, not with explicit phases of the incumbent dispatcher). Shim-reconciliation will skip functional and non-function and qa on main validation and batch all validation as bootstrap/shim exit criteria." And: "Alignment will continue in a new session(s) on the greenfield checkout via `/align` and pasting of output from alignment artifact."

Evaluated adversarially before recording, 2026-09-03. One rank, two orders: the record had one rank serving onboarding, and reconciliation in rank order needs the same rank to serve the author's bite order; the boosts now transcribe that order (attention), and a walk that meets projection before growth costs onboarding nothing. A browser node is not needed for rank, since a child's rank is a share of its parent's: the browser bite ranks first through projection's boost, and the browser node is owed by projection's own shim at its sitting. Batching validation to exit lets defects surface late; the mitigation is that tests and use still gate every landing, that the exit list is the liquidation condition of a declared shim, derived onto the frontier and never a checklist, and that the alignment sessions exercise the alignment skill every day it is used. Two sessions on one checkout: the graph and the implementation are separate refs with separate worktrees and indexes, so an alignment session and a reconciliation session collide only when both write the graph, which the reconciliation session does for one file at a time, committed by pathspec and pushed at once. On the model: selecting a bite and writing its unit's contract from prose criteria is judgment, so the shim runs on the larger model and its units on the smaller until every frontier node carries an executable check and each kind of bite has a skill, the last bite in the author's order; a skill's model field holds only for the turn that invokes it, and the loop runs within that turn. Rejected: a stored bite list or plan for the shim, forbidden by the transience node; a worktree of the shim's own, because its landings go straight to the ref and a worktree would only add a merge. The derivation of unsupported artifacts onto the frontier, the second direction, is not yet materialized; until it is, the coverage node's survey is the list, and the swap waits on the coverage ruling, as materialization's shim says.

## Proposal

### Recording of 2026-09-03

Reclassified as unanswered at the author's ruling of 2026-09-03, quoted on the unanswered node: the answer above, stamped deferred during bootstrap before the alignment dialogue existed, stands as the draft the author rules on, and the clean-context review runs on it before the ruling. Nothing in the node was changed by the reclassification.

Facts: authority ratified; boldness moderate; persistence standing; the reconciliation shim declared above, with its liquidation condition.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, second direction: 'any materialized artifact with no supporting disposition ... is itself a frontier item.' Nothing derives it. renderFrontier reads only the graph and emits stamps, stages, instruments and shims; no projection walks the implementation ref. The second direction of reconciliation, which the answer gives equal weight, is not on the frontier at all. Suggested edit: carry the coverage derivation as a criterion on this node, or say it is owed.
- Frontmatter shim: the liquidation condition runs to nine clauses covering all batched validation plus four exit conditions ('every rule this project runs under is a node or a declared shim, dispatch selects from this graph, the alignment skill is the only path by which a node is recorded, and nothing live reads the legacy record'). Transience forbids 'a node that records a unit of work, a plan, a task, or a step list, whatever it is called' and exempts a shim's liquidation condition; this is the text that tests the exemption, and nothing derives which clauses are met. Suggested edit: split the shim, or say which clause the frontier can read.
- Answer: 'a reconciliation session ... writes the graph only to record an un-aligned disposition ... or to remove a shim declaration whose condition it has met.' Delegation, in this batch, says 'A subagent ... never edits a node or the record's scaffolding'; its own review flagged that an executor cannot tell which rule wins because neither says whether a reconciliation session is a subagent. Unresolved on both nodes. Suggested edit: settle it here, since this node is where the session kind is named.
- Rationale, last paragraph: the model recommendation, the two-session collision analysis and the no-worktree decision are operational facts about the current bootstrap, which transience puts under 'Not recorded: operational and session state'. The paragraph's own last sentence rejects a stored bite list on exactly that ground.

On the three facts: Generic template, and it omits the reconciliation shim, which is this node's most consequential content and whose liquidation condition is nine clauses long; growth's presentation rule requires each shim with its condition. Boldness is moderate to high: the author's 2026-09-03 words are quoted at length for the bootstrap operations, but the two-direction model, the bite, the coverage ranking and the sessions-divide-by-ref rule are the AI's.

Strongest counter-argument (strong): The second direction — every unsupported artifact is a frontier item, pruned by default unless a disposition is written for it — is the mechanism that decides the fate of the entire incumbent repository at the swap, and it exists only as prose. Coverage's survey found twelve recorded functions, four outside the purpose as worded, plus about twenty libraries and the author's host configuration; nothing derives that list onto the frontier, nothing ranks it, and this node's own shim batches to exit the validation that would catch a mistake. A rule whose failure mode is the silent deletion of years of work, with no instrument and no derivation, is the largest unguarded surface in the record — and it is ranked third under model, below projection and growth.

The session's reply: The counter-argument is right that nothing derives the second direction yet, and the answer stands because the swap is gated on what it protects: materialization's shim liquidates only after the coverage ruling and after everything that is to survive has been reconciled under a supporting disposition, and the exit list is a declared liquidation condition the frontier reads, not a checklist. Accepted: the rationale now says that the derivation of unsupported artifacts onto the frontier is owed and that the coverage node's survey is the list until then; the shim is named among the facts with its condition. The delegation conflict stands as the delegation node's own review left it, for the author.

### Words of 2026-09-03, evening

The author's words above are recorded the turn they were said, as the checkpoint node requires. Three of them change the shim as declared and as written: one iteration per invocation, one bite selected and reconciled, where the skill as written repeats until the frontier holds nothing it can take; bites only from the answered frontier, nodes with a ratified or delegated stamp, which the skill states as a skip of every node with a stage, and which today leaves it no work, every node being unanswered; and, from the words after compaction, bites only from disposition to implementation, so the second direction of the draft above, an artifact no node justifies becoming a frontier item to be supported or pruned, leaves the shim's bites, which the skill as written lists among them, and stands as an exit criterion: it is shimmed or materialized only once the disposition that states it, this node's draft and the materialization node's, is answered. The drain of the legacy tactic nodes, which the rationale places under the second direction, the words after compaction likewise place at exit and not at the transition: nothing in the shim's bites changes for it, and the liquidation condition above already holds it, as nothing live reading the legacy record. Rank order and the skill's existence as a shim during bootstrap the words confirm. The shim's text on the implementation ref and the declaration above were redrafted to them that night, and the node returned to the review stage for the batch review; the declaration is part of what a review's hash covers, so the frontier showed the draft as changed since the earlier review, as the batch found.

The words on owning the graph, said while the batch review was reading the frontier, contradict one sentence of the draft: a reconciliation session "writes the graph only to record an un-aligned disposition when a divergence needs the author, or to remove a shim declaration whose condition it has met". Reconciliation never edits the graph; that is alignment's alone. So a divergence that needs the author is reported by the session that found it and stays on the frontier, derived and not stored, until the alignment dialogue records it, and a shim whose condition reconciliation has met keeps its declaration until alignment removes it. The shim's text and the declaration above were changed to this the same night. The draft was amended after the batch's reading, which kicked the node back for it, and the node stands at the review stage on a draft changed since that review, which the frontier shows. That implementation is delegated and each kind of bite gets a skill the draft already says; what makes a subagent, a model, and an effort appropriate is the open question the delegation node's draft answers on the AI's judgment, and the author's words leave it open.

The author added, in the same exchange, that reconciliation, not editing the graph, may need to persist other metadata to track its state. The draft says the state is the frontier, derived and never stored, and the git log, and the rationale rejects a stored bite list under the transience node. What a session might need to keep between invocations, the divergences it has reported and alignment has not yet recorded, a bite in flight, and the evidence an instrument reads, is a question for the amended draft. The amended draft recommends that such state lives on the implementation ref as committed files a disposition justifies, never in the graph and never in scratch or memory, and that the frontier derives from the graph, the implementation, and that state together: authority ratified, since it draws the boundary of what the graph stores; boldness moderate, the design being the AI's; persistence standing. Until the author rules, the shim persists nothing: each invocation re-derives the frontier and reports a divergence again if alignment has not recorded it.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Findings:

- The Answer contradicts the author's own words quoted on this node. The author, 2026-09-03, under '## Disposition': 'reconsiliation does not edit the graph. That is alignment only.' The Answer still reads: 'a reconciliation session writes the implementation ref, and writes the graph only to record an un-aligned disposition when a divergence needs the author, or to remove a shim declaration whose condition it has met, each in a commit of that file alone.' The Proposal's closing paragraph announces the amendment ('The draft is amended after the batch's reading') but the Answer was not changed. A ruling on the node as it stands would ratify a rule the author has already overruled in writing on the same node. This is why the verdict is a kickback: the draft cannot be put to the author as it stands.
- Answer, second direction: 'any materialized artifact with no supporting disposition ... is itself a frontier item.' Verified still underived: renderFrontier in packages/disposition/project.mjs reads only the graph and emits stamps, stages, instruments, shims and the order field; no projection walks the implementation ref. The rationale now discloses this, which is the right disclosure, but the answer gives the two directions equal weight.
- Frontmatter shim: the liquidation condition is nine clauses covering all batched validation plus four exit conditions. Transience forbids 'a node that records a unit of work, a plan, a task, or a step list, whatever it is called' and exempts a shim's liquidation condition; this is the text that tests the exemption, and nothing derives which clauses are met. Suggested edit: split the shim, or say which clause the frontier can read.
- The frontier already flags this node: 'review: forward (strong, 2026-09-03), draft changed since the review'. The node's own Proposal claims 'the answer's draft, the target state the author rules on, is unchanged, and ... its earlier forward review standing on the same draft', which the record's own instrument contradicts. The review's 'of' hash no longer matches the draft.
- Rationale, last paragraph: the model recommendation, the two-session collision analysis and the no-worktree decision are operational facts about the current bootstrap, which transience puts under 'Not recorded: operational and session state'; the paragraph's own last sentence rejects a stored bite list on exactly that ground.

On the three facts: The frontmatter recommendation (ratified, moderate) states one class and one value. The prose Facts line is the generic template stating two classes, and it omits the reconciliation shim entirely — this node's most consequential content, whose liquidation condition runs to nine clauses — which growth's presentation rule requires. Boldness is moderate to high: the two-direction model, the bite, and the sessions-divide-by-ref rule are the AI's.

Strongest counter-argument (strong): The second direction — every unsupported artifact is a frontier item, pruned by default unless a disposition is written for it — decides the fate of the entire incumbent repository at the swap, and exists only as prose. Coverage's survey found twelve recorded functions, four outside the purpose as worded, plus about twenty libraries and the author's host configuration; nothing derives that list onto the frontier and nothing ranks it. The session's answer, that materialization's shim holds the swap until the coverage ruling, is verified and does close the deletion risk. What it does not close is that the author's newest words have now removed reconciliation's one path for reporting a divergence into the record, and the node does not say what replaces it.

The session's reply: Validated: the answer contradicted the author's words on the same node. Amended tonight: the answer says a reconciliation session never writes the graph, that a divergence needing the author is reported and stays on the derived frontier until alignment records it, that a met shim condition's declaration stands until alignment removes it, and that whether reconciliation keeps state of its own is open, with the recommendation that such state lives on the implementation ref as committed files a disposition justifies; the Proposal's claim that the draft was unchanged is corrected, the declaration having moved the hash. The second direction and the legacy drain are exit criteria by the author's words after compaction, shimmed only once this node is answered. The shim's condition is eleven clauses now; that the frontier reads none of them is disclosed, and the split is put to the author. The rationale's operational paragraph is pruned at the sitting. Stage review: the draft changed, and the review that forwarded it read the earlier text.

### Frontier finding, 2026-09-03

Kind: contradiction.

The author, 2026-09-03, quoted under '## Disposition' on work-loop: 'reconsiliation does not edit the graph. That is alignment only.' Work-loop's Answer still says a reconciliation session 'writes the graph only to record an un-aligned disposition when a divergence needs the author, or to remove a shim declaration whose condition it has met, each in a commit of that file alone.' Delegation's Answer says 'A subagent never edits a node or the record's scaffolding', and its own review recorded that an executor cannot tell which rule wins because neither node says whether a reconciliation session is a subagent. The author's newest words settle it in delegation's favour and neither node records that.

Also named: commons.systems/disposition-graph/delegation.

Proposed: Work-loop's Answer strikes the graph-writing clause and says instead that a divergence a reconciliation session finds is reported and stays on the derived frontier until the alignment dialogue records it, and that a shim whose condition reconciliation has met keeps its declaration until alignment removes it — which is what work-loop's own closing Proposal paragraph already argues. Delegation's Answer adds one clause saying the prohibition covers reconciliation sessions, citing the author's ruling on work-loop. Work-loop is the survivor of the rule; delegation carries the citation.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Criterion' and 'criteria' are used in the answers of transience ('A criterion, when the temporary thing is really a standing obligation'), scope, work-loop ('each a reconciliation of the criteria the node carries') and purpose's draft, and in four drafts as a frontmatter key. No node's defines carries the term: the parsed graph's 88 terms include 'instrument', 'check', 'assessment' and 'evidence' from instruments, and 'criterion' only inside instruments' Draft. Verified the key is not in the schema either: FRONTMATTER_KEYS holds 'instrument' and not 'criteria'. A term four ruling-stage answers depend on is defined only inside a draft.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/purpose.

Proposed: Instruments is the survivor and must be ruled before the nodes that use the word. Until it is, the answers that use 'criterion' say 'instrument', the term instruments actually defines, or the drafts that use it disclose that the term arrives with instruments. At the recording, instruments' defines gains 'criterion' and 'unguarded', the schema gains the 'criteria' key, and the four nodes carrying 'instrument:' are migrated — which instruments' own facts should name, as its reply promises.

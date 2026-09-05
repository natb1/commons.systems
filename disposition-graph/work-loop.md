---
question: How does work happen?
stage: review
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: ca07ecad1a88a78b8bd2e341b9e737e1511a9a35
  against: "On a delegated or deferred node the reconciliation session may move the recommendation and the moved recommendation acts, so the loop writes the desired state it then reconciles to; the level-triggered reading concedes the controller's clean line is not kept. The only guard is 'within the node's scope', judged by the same session that makes the move, and on a delegated node the author never sees it. The 'attenuation/breakout controls' the author conditioned the grant on are defined nowhere in the record beyond that phrase. Joined to the eleven-clause shim that prior reviews called the largest unguarded surface in the record, this leaves the loop's self-licence under-specified."
facts:
  - name: answer
    options:
      - name: never-writes-the-graph
        source: ai
        ref: "2026-09-03"
      - name: split-the-shim
        source: review
        ref: "2026-09-03"
      - name: no-persisted-state
        source: ai
        ref: "2026-09-03"
      - name: say-instrument-not-criterion
        source: review
        ref: "2026-09-03"
      - name: reconciliation-writes-options
        source: author
        ref: "2026-09-04"
      - name: a-stored-bite-list
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "the transience node forbids it"
      - name: a-worktree-of-the-shims-own
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "its landings go straight to the ref and a worktree would only add a merge"
      - name: reconciliation-passes-an-option-over
        source: commons.systems/disposition-graph/viable-options
        ref: "2026-09-05"
    recommends: reconciliation-writes-options
    boldness: moderate
    against: "On a delegated or deferred node the reconciliation session may move the recommendation and the moved recommendation acts, so the loop writes the desired state it then reconciles to, which the level-triggered reading concedes breaks the controller's clean line; the guard, within the node's scope, is judged by the session that makes the move, and on a delegated node the author never sees it."
    stands: reconciliation-writes-options
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
form: rule
boost: 3
under:
  - commons.systems/disposition-graph/model
defines:
  - frontier
  - bite
  - reconcile
  - variance
shims:
  - artifact: "`.claude/skills/reconcile/SKILL.md` on the implementation ref, the reconciliation skill hand-written from this node and its siblings, run by a session that takes one bite per invocation from the answered frontier in rank order, from disposition to implementation only, writes to it only the options and recommendations the delegation node bounds and never rules on it, and skips functional validation, non-functional validation, and validation in use on the main branch, and lands its writes to the graph by hand, fetch, reapply, and push, until the persistence node's landing instrument exists"
    for: the reconciliation orchestrator and the skills for each kind of bite that this node and its children will project
    liquidation: the orchestrator and the bite skills are materialized from ratified nodes, and every landing made under this shim has passed the validation it skipped, functional validation against its node's criteria, the review instrument's assessment, and validation in use after the implementation ref is swapped with the main branch; and every rule this project runs under is a node or a declared shim, dispatch selects from this graph, the alignment skill is the only path by which a node is recorded, and nothing live reads the legacy record; and the second direction, every artifact on the implementation ref that no node justifies supported by a disposition or pruned, and the drain of every legacy tactic node, transcribed to this graph or pruned, are complete, neither begun before the disposition that states them is answered
    declared: 2026-09-03
depends:
  - commons.systems/disposition-graph/viable-options
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

The author, 2026-09-04, on the viable-options node, amending the ruling above:

> Under this model the prior statement that "reconciliation never edits the graph" is incomplete. Whatever persistent state reconciliation requires for reconciliation operations (if any) is stored outside the graph - true. But, AI has the authority record untracked but viable alternative options and to change its recommendation during either reconciliation or rsi. If the recommendation is on ratified node then that triggers the alignment frontier projection described above. Subject to attenuation/breakout controls - if the change of recommendation is on delegated or deffered node then it changes the shape of the reconciliation frontier.

## Answer

By reconciliation in both directions, the second begun only at exit. The frontier is derived, never stored: every node whose acting option's instrument fails is on it, ranked by the node's rank. In the first direction a session claims a frontier item, takes a bite, materializes what the disposition requires, records evidence, and the instrument reads the result. In the second direction any materialized artifact with no supporting disposition, code, a skill, a rule, the README, or a node of the legacy record, is itself a frontier item: the reconciler proposes a disposition that would support it, citing the artifact as evidence, or proposes pruning it, and the author rules at review. Coverage ranks that direction: an artifact no disposition cites or instruments is a prune-by-default proposal. A bite on materialized implementation passes through implementation, functional validation, non-functional validation, landing on the main branch, and validation in use there, each a reconciliation of the criteria the node carries and never a phase of a dispatcher: the frontier re-derives after every landing, and what the instruments still fail is the next bite. Sessions divide by ref: an alignment session writes the graph and holds its dialogue, and only the author rules on it; a reconciliation session writes the implementation ref, and writes the graph only as this node bounds it, which the delegation node cites: its main thread may record a viable option on a fact and move a fact's recommendation, within the node's scope, and may never rule, edit a ruling, or edit the author's words, since operational state stays outside the graph and decision state goes in, as the author amended their ruling on 2026-09-04. Such a write lands on the disposition ref one node at a time by compare-and-swap, as the persistence node prescribes, and never over another session's landing. A divergence that needs the author is recorded as an option on the node it conflicts with by the session that found it; what the move does follows the node's class, as the evaluation node says: on a ratified node it returns the node to the author with the confirmed choice's authority intact; on a delegated or deferred node the moved recommendation acts and the reconciliation frontier changes with it. The attenuation the author's words condition this on is the scope, a move within the node's scope and within a delegation's, and the breakout control is that a move which would leave the scope is not the session's to make and returns the node to the author with its class intact, as the authority node says. A shim whose condition reconciliation has met keeps its declaration until alignment removes it. Un-aligned dispositions are alignment's work, never reconciliation's. Whether reconciliation keeps state of its own between invocations, the divergences it has recorded, a bite in flight, is open; the recommendation is that such state lives on the implementation ref as committed files a disposition justifies, never in the graph, so that the frontier derives from the graph, the implementation, and that state together.

## Rationale

The author's ruling of 2026-09-02 that reconciliation must run from disposition to missing implementation and from unsupported implementation to new disposition or pruning. The second direction subsumes transcription of the legacy record and its drain: legacy nodes are pulled in when a question needs them and pruned in bulk otherwise. The reading `level-triggered-reconciliation`, under the viable-options node, bears on this node's answer, diverged: the controller writes status and never spec, and the loop here records options, which is narrower than spec and wider than status; one-piece flow is owed as a reading.

The author, 2026-09-03, on bootstrap operations: "I will check out the greenfield ref at repo root and launch a new session to act as the reconciliation shim. Ideally, the reconciliation shim instructions are well defined enough to run with sonnet, but recommend the model this shim must run as. Does any work need to be done to prepare for this - for example to prepare the shim to be run as sonnet. Encode the shim as a skill with the recommended model so that I can initialize a session to act as the reconciliation shim by invoking that skill. The shim will iteratively bite work from the frontier in rank order for reconciliation. i.e. purpose/browser artifact (browser artifact may need new high ranking disposition) -> alignment skill -> the rest of the context management for the harness (CLAUDE.md, rules, CLAUDE.local.md per worktree) -> the non-shim reconciliation harness (codified reconciliation orchestrator, skills for each bite type). Non-shim bites will progress materialized artifacts (code, skills, rules etc.) through implementation, functional validation, non-functional validation, merge and qa on main (implicitly using reconciliation of signals/instruments/criteria, not with explicit phases of the incumbent dispatcher). Shim-reconciliation will skip functional and non-function and qa on main validation and batch all validation as bootstrap/shim exit criteria." And: "Alignment will continue in a new session(s) on the greenfield checkout via `/align` and pasting of output from alignment artifact."

Amended 2026-09-04 under the author's bootstrap grant of that day, from the author's words quoted above amending their ruling of 2026-09-03. The line falls between operational state, which stays outside the graph, and decision state, an option found viable and a recommendation moved, which goes in: a divergence held on a derived frontier until an alignment session transcribes it is a decision outside the record, and as an option it is in the record at once, changes nothing the author confirmed, and returns a ratified node to the author by the same projection that returns any moved recommendation. The attenuation is the class: what a move does is read from it, and a subagent never writes a node. The answer as it stood is kept as the option `never-writes-the-graph`, and the review of this text is owed.

## Facts

### answer

`reconciliation-writes-options` is recommended because it is what the author's words of 2026-09-04 grant, quoted above: decision state, a viable option and a moved recommendation, goes into the graph, and operational state stays out. Moderate boldness: the bound is the author's, and the two directions, the bite, the derived frontier, the compare-and-swap landing, and the recommendation on reconciliation's own state are the AI's; the strongest case against is on the fact. `never-writes-the-graph`, `split-the-shim`, `no-persisted-state` and `say-instrument-not-criterion` stay viable, and the two passed over carry their reasons.

#### never-writes-the-graph

The answer as it stood from 2026-09-03, under the author's ruling of that day quoted above: a reconciliation session writes the implementation ref and never the graph, and a divergence that needs the author is reported by the session that found it and stays on the derived frontier until the alignment dialogue records it. Viable if the author prefers the graph written by alignment alone.

#### split-the-shim

The reconciliation shim's single liquidation condition, now eleven clauses covering all batched validation together with the bootstrap exit criteria, is split into separate shims, or reduced to the clauses the frontier can actually derive. Two clean-context reviews raised it and the session decided neither way, replying that the split is put to the author. The node as it stands keeps one declaration whose met clauses no projection reads, which is the case transience's shim exemption is being tested by.

#### no-persisted-state

Reconciliation persists nothing of its own between invocations and re-derives the frontier from the graph and the implementation each time, which is what the shim does today. The answer's own recommendation is the opposite, that such state lives on the implementation ref as committed files a disposition justifies, and the answer names the question as open after the author observed that a session which cannot write the graph may need other metadata. The rationale's rejection of a stored bite list under transience is the argument for this alternative.

#### say-instrument-not-criterion

The answer's phrase, each stage a reconciliation of the criteria the node carries, says instrument instead, the term the instruments node actually defines, or discloses that the term arrives with instruments until instruments is ruled. The vocabulary finding of 2026-09-03 verified that criterion is defined by no node outside instruments' own draft and is not a schema key, while four ruling-stage answers depend on the word. Raised on commons.systems/disposition-graph/instruments.

#### reconciliation-writes-options

The sentence that a reconciliation session never writes the graph is incomplete, by the author's words of 2026-09-04 amending their ruling of 2026-09-03 quoted above: operational state stays outside the graph, and decision state goes in. A reconciliation session may record a viable option on a fact and move its recommendation, within the node's scope, and may never rule, edit a ruling, or edit the author's words. A divergence that needs the author is then recorded as an option on the node it conflicts with, which is what returns a ratified node to the author, and the path on which it is reported and stays on the derived frontier until alignment records it goes. The open question of reconciliation's own state between invocations is unchanged. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

#### a-stored-bite-list

The reconciliation shim keeps a stored list of bites, or a plan, between
invocations. It was passed over because the transience node forbids storing
operational state on the record.

#### a-worktree-of-the-shims-own

The reconciliation session works in a worktree of its own. It was passed over
because its landings go straight to the ref, so a worktree would only add a
merge.

#### reconciliation-passes-an-option-over

The licence this answer gives a reconciliation session's main thread named as
three acts and not two: recording an option on a fact, passing an option over
and lifting a status the AI wrote, and moving a fact's recommendation within
the node's scope. The viable-options node's recommended answer of 2026-09-05
gives the AI all three wherever it acts, in alignment, in reconciliation, and
in the loop on itself, and this answer's enumeration is short by one the moment
that is ruled. Recorded here rather than written in, because the bound on a
reconciliation session is this node's to set and the other node's answer is not
yet ruled.

### authority

Ratified, at moderate boldness: the node draws the boundary of what the graph stores and who writes it, which is expensive and capture-shaped to get wrong, the record's test for escalating toward ratified; moderate because the rule at the core is the author's in two rulings and the shape around it is the AI's.

## Account

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

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `split-the-shim` (review, 2026-09-03); `no-persisted-state` (ai, 2026-09-03); `criterion-to-instrument` (review, 2026-09-03); `say-instrument-not-criterion` (review, 2026-09-03, from commons.systems/disposition-graph/instruments).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: The author sets out the transition to new bootstrap operations: the alignment skill and page begin marking dispositions answered, the reconciliation shim exists with no work until an answered frontier exists, and it then takes one bite per invocation in rank order. 2026-09-03, own-question: Resolving in both directions is required for bootstrap exit but not for the transition; the disposition must be answered before the second direction is shimmed or materialized, so the shim resolves only from graph to implementation. 2026-09-03, own-question: Draining all legacy tactic nodes is likewise required for bootstrap exit and not for the transition. 2026-09-03, own-question: Implementation is delegated and each bite type gets a skill with appropriate recursive subagents, what counts as appropriate being left open, but reconciliation does not edit the graph, which is alignment's alone. 2026-09-03, own-question: Since reconciliation does not edit the graph it may need to persist some other metadata to track its own reconciliation state.
The census unit's note: The node has an answer and no draft, so it adopts standing even though it sits at the review stage with a kickback verdict and a draft changed since that review. I turned into alternatives only what is genuinely before the author: the shim split the session explicitly declined to decide, the negative of the recommendation on reconciliation's own state, and the criterion-to-instrument wording the vocabulary finding proposes for this answer. I excluded edits the session already accepted and owes at the recording (pruning the operational paragraph from the rationale, disclosing that nothing derives the second direction) since they are not pending on the author. Nothing goes elsewhere: the contradiction finding's clause is already written into delegation's answer, and the vocabulary finding is carried verbatim on instruments, transience, scope and purpose, so each of those nodes yields it directly. The author's fourth block is mixed, correcting both work-loop's session rule and delegation's subagent rule; I kept it as own-question because delegation has already absorbed its half by citation.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `say-instrument-not-criterion` absorbs `criterion-to-instrument`. The merge unit's note: `say-instrument-not-criterion` was kept over `criterion-to-instrument` because the same alternative is carried under that name on scope, transience and purpose.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified applied since the kickback: the Answer now reads 'a reconciliation session writes the implementation ref and never the graph' and 'a divergence that needs the author is reported by the session that found it ... and stays on the frontier, derived and never stored, until the alignment dialogue records it', which is what the author's words on this node require. Delegation's answer carries the matching citation. The contradiction the kickback named is closed on both sides.
- Answer, second direction: 'any materialized artifact with no supporting disposition ... is itself a frontier item.' Verified still underived: `renderFrontier` in packages/disposition/project.mjs reads only the graph and emits stamps, stages, instruments, shims and the order field; no projection walks the implementation ref. The rationale now discloses this, which is the right disclosure, while the answer still gives the two directions equal weight in its first sentence.
- Frontmatter shim: the liquidation condition now runs to three long clauses covering all batched validation, four bootstrap exit conditions, the second direction and the legacy drain. Transience forbids 'a node that records a unit of work, a plan, a task, or a step list, whatever it is called' and exempts a shim's liquidation condition; this is the text testing the exemption, and nothing derives which clauses are met — transience's own instrument note says the flagging of a met condition is not materialized. The `split-the-shim` alternative is the vehicle and the session declined to decide it twice.
- Answer, last sentence: 'Whether reconciliation keeps state of its own between invocations ... is open; the recommendation is that such state lives on the implementation ref as committed files a disposition justifies.' An answer that names its own open question is honest, but it means a confirmation ratifies a rule and an open question together; the `no-persisted-state` alternative is the negative and the author should be told the confirmation covers both.
- Answer: 'each a reconciliation of the criteria the node carries' — 'criterion' is defined by no node's `defines`; see the merge finding on the four nodes carrying the same alternative.

On the three facts: The frontmatter recommendation (adopts standing, ratified, moderate) states one class and one value and the pin is current, and the review's own pin is stale, which the frontier flags — correctly, since the answer changed after the kickback. Boldness is nearer high than moderate: the two-direction model, the bite, the coverage ranking and the sessions-divide-by-ref rule are the AI's, and only the transition operations are quoted from the author. Persistence standing with one declared shim follows from the node's shape, but the prose Facts line omits the shim, which growth's presentation rule requires.

Strongest counter-argument (strong): The second direction — every unsupported artifact is a frontier item, supported by a new disposition or pruned — decides the fate of the entire incumbent repository at the swap, and it exists only as prose that nothing derives. The session's answer, that materialization's shim holds the swap until the coverage ruling, is verified in the shim text and does close the deletion risk. What it does not close is the shim itself: an eleven-clause liquidation condition on the node that governs how all work happens, with no projection reading any clause, is the largest unguarded surface in the record, and the node's own review instrument is batched to the exit that the shim's condition gates.

The session's reply: Forward accepted. The second direction stays underived and the answer discloses it; the shim's long liquidation condition is accepted as the case that tests transience's exemption, for the author.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Rationale, third paragraph, 'Evaluated adversarially before recording, 2026-09-03. ... On the model: ... the shim runs on the larger model and its units on the smaller ...': this is the operational paragraph the session's reply to the second review said 'is pruned at the sitting', and the transience node's answer says operational state is 'Not recorded'. It is still in the node. Suggested edit: strike the paragraph; what in it is evidence of the 2026-09-03 evaluation is already in the Account, and what in it is model choice is the delegation node's question and the skill's frontmatter.
- Facts, '### answer': the subsection opens directly on '#### never-writes-the-graph' with no reason for the recommendation, and there is no '### authority' subsection at all, while the dialogue node's answer says '## Facts' holds one subsection per fact 'opening with the reason for its recommendation' and the Account already states the reasons ('authority ratified, since it draws the boundary of what the graph stores; boldness moderate, the design being the AI's'). Suggested edit: open '### answer' with one sentence on why `reconciliation-writes-options` is recommended (the author's amendment of 2026-09-04 grants exactly it), and add '### authority' carrying the Account's sentence.
- Answer, 'writes the graph only as the delegation node bounds it', while delegation's projected answer ends 'its main thread writes the graph only as the work-loop node says': each node defers the rule to the other and neither owns it. Since work-loop defines `reconcile`, suggested edit: state the bound here as this node's own ('its main thread may record a viable option on a fact and move a fact's recommendation within the node's scope, and may never rule, edit a ruling, or edit the author's words') and let delegation cite it, or the reverse, but not both.
- Answer, 'what the move does follows the node's class, as the evaluation node says, and on a ratified node it returns the node to the author': the author's amendment of 2026-09-04, quoted under Disposition, conditions the grant on 'attenuation/breakout controls' and says a move on 'delegated or deffered node ... changes the shape of the reconciliation frontier', yet the answer states only the ratified consequence and names neither control. 'Breakout' is defined nowhere in the record except a gloss on the authority node ('a breakout would have to be written up the tree, and nothing writes up'). Suggested edit: one sentence stating that on a delegated or deferred node the moved recommendation acts and the reconciliation frontier changes with it, that 'within the node's scope' is the attenuation, and that the return to the author with class intact is the breakout control, as the evaluation node prescribes.
- Frontmatter, option `never-writes-the-graph` with `ref: "2026-09-02"`, while its Facts subsection says 'The answer as it stood from 2026-09-03'. Suggested edit: make the ref the date the option first stood (2026-09-03, the post-kickback amendment) or say in the subsection why 2026-09-02 is the source.
- Answer, 'Such a write lands on the disposition ref one node at a time by compare-and-swap, as the persistence node prescribes': the persistence node's reviews record that protocol as unmaterialized, with no landing tool and no instrument, and the reconcile skill scripts the fetch, reapply, and push by hand. The shim declaration on this node does not mention the landing at all. Suggested edit: say the shim lands by hand until persistence's instrument exists, either in the answer's clause or in the shim's artifact text, so validation 5 can see the gap it covers.
- Rationale, 'Traditions to record as readings: level-triggered reconciliation in Kubernetes; one-piece flow.': the level-triggered reading now exists but bears only on viable-options#answer#grant-from-a-ruling, and its recorded divergence ('the controller's clean line is not kept', the loop may 'record a viable option ... which touches what a later pass will treat as desired') is precisely the rule this node's recommended option `reconciliation-writes-options` states. One-piece flow is unrecorded. Suggested edit: the reading bears on this node's option too (a `bears` entry), the rationale sentence cites the reading rather than promising it, and one-piece flow is either recorded or the promise struck.
- Answer, first sentence, 'By reconciliation in both directions.': the second direction is exit-only under the author's words of 2026-09-03 and the shim's liquidation says neither it nor the legacy drain is 'begun before the disposition that states them is answered', but the opening gives the two directions equal weight and the reader learns the asymmetry only from the shim text and the rationale's last sentence. Prior reviews raised this; a light edit stands: 'By reconciliation in both directions, the second begun only at exit.'

On the facts and what they recommend: The answer fact recommends the standing option `reconciliation-writes-options`, so no Recommendation fence is needed and none is present; that is correct. Authority ratified at moderate boldness is defensible since the author's own words carry the core rule, though the bite, two-direction, and compare-and-swap model around it are the AI's and prior reviews placed boldness nearer high. Neither fact carries an `against` while three reviews recorded strong counter-arguments; the strongest belongs on the answer fact.

On the viability of the options: All seven answer options are viable or passed with a stated reason (`a-stored-bite-list` by transience, `a-worktree-of-the-shims-own` by transience); the persisted-state question is held by the `no-persisted-state` pair and needs no new option. `say-instrument-not-criterion` remains live since the answer still says 'criteria'. No missing option found.

Strongest counter-argument (moderate): On a delegated or deferred node the reconciliation session may move the recommendation and the moved recommendation acts, so the loop writes the desired state it then reconciles to; the level-triggered reading concedes the controller's clean line is not kept. The only guard is 'within the node's scope', judged by the same session that makes the move, and on a delegated node the author never sees it. The 'attenuation/breakout controls' the author conditioned the grant on are defined nowhere in the record beyond that phrase. Joined to the eleven-clause shim that prior reviews called the largest unguarded surface in the record, this leaves the loop's self-licence under-specified.

The session's reply: Eight findings, all validated on this thread and all accepted. The operational paragraph moves from the rationale to the account whole; the answer and authority facts open with their reasons and the answer fact carries the counter-argument as its case against; the graph-writing bound is stated as this node's own, with delegation citing it; the delegated and deferred consequence, the attenuation as the scope and the breakout control as the return to the author, are stated in the answer from the authority node; the option's ref is corrected to 2026-09-03; the shim's artifact says the landing is by hand until the persistence instrument exists; the level-triggered reading bears on the recommended option, diverged, and the rationale cites it, with one-piece flow named as owed; the opening states the asymmetry of the two directions. Boldness stays moderate, the core rule being the author's in two rulings. Substance moved; the node returns to the review stage.

### Evaluated adversarially before recording, 2026-09-03

One rank, two orders: the record had one rank serving onboarding, and reconciliation in rank order needs the same rank to serve the author's bite order; the boosts now transcribe that order (attention), and a walk that meets projection before growth costs onboarding nothing. A browser node is not needed for rank, since a child's rank is a share of its parent's: the browser bite ranks first through projection's boost, and the browser node is owed by projection's own shim at its sitting. Batching validation to exit lets defects surface late; the mitigation is that tests and use still gate every landing, that the exit list is the liquidation condition of a declared shim, derived onto the frontier and never a checklist, and that the alignment sessions exercise the alignment skill every day it is used. Two sessions on one checkout: the graph and the implementation are separate refs with separate worktrees and indexes, so an alignment session and a reconciliation session collide only when both write the graph, which the reconciliation session does for one file at a time, committed by pathspec and pushed at once. On the model: selecting a bite and writing its unit's contract from prose criteria is judgment, so the shim runs on the larger model and its units on the smaller until every frontier node carries an executable check and each kind of bite has a skill, the last bite in the author's order; a skill's model field holds only for the turn that invokes it, and the loop runs within that turn. The derivation of unsupported artifacts onto the frontier, the second direction, is not yet materialized; until it is, the coverage node's survey is the list, and the swap waits on the coverage ruling, as materialization's shim says.

### Amended after the reading, 2026-09-05

The clean-context review of 2026-09-05 forwarded the recommendation at moderate strength with eight findings, all validated on this thread and all accepted. The operational paragraph of the rationale, evidence of the 2026-09-03 evaluation, moves here whole, since the transience node keeps operational state out of the answer's rationale. The answer fact and the authority fact open with their reasons; the strongest counter-argument is on the answer fact. The bound on what a reconciliation session writes is stated as this node's own and the delegation node cites it, where each had deferred to the other. The answer now says what a move does on a delegated or deferred node, names the scope as the attenuation and the return to the author as the breakout control, as the author's words of 2026-09-04 condition the grant. The option `never-writes-the-graph` is dated to the day it stood. The shim's artifact says it lands its graph writes by hand until the persistence node's landing instrument exists, so the gap the shim covers is visible. The level-triggered reading now bears on this node's answer, diverged, and the rationale cites it rather than promising it; one-piece flow is named as owed. The opening states the asymmetry of the two directions. Boldness stays moderate: the core rule is the author's twice over. Substance moved, so the node returns to the review stage.

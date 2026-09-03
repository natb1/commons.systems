---
question: What does an unanswered node carry?
stage: maieutic
recommendation:
  class: ratified
  boldness: high
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 9122d9e8c4485c763863f2d3368cd06138643146
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/unanswered
defines:
  - dialogue
  - stage
  - draft
  - recommendation
  - review state
---
## Disposition

The author, 2026-09-03:
> re-evaluate the encoding of unanswered greenfield if necessary

The author, 2026-09-03:
> It seems like an unanswered node is a disposition + other state needed to track progress through alignment (periogoge, mieutic, adversarial review state, recommended diff/authority/persistence/boldness) or something like that, evaluate greenfield and make a recommendation

The author, 2026-09-03, on the recording of alignment-order and on this node's question:
> Proposal is not an ideal way to record this because it suggests an answered incumbent, and escalation of delegated scope - which there is neither. It sounds like this might be better encoded (evaluate this adversarily) in the unanswered question encoding. Unanswered questions carry a list of alternative answers. Each may be suggested by the author (and reference author text) or suggested by the AI or it may be a steelman argument that emerges from adversarial review. An alignment diologue (like this one) records all of the alternatives that arise and whenever new alternatives arise the AI may update which answer is granted the AI recommendation (with what authority, etc.)
>
> In this model, unanswered questions are recommendation (same encoding as an answered disposition node, or diff) + diologue state around that recommendation including alternatives and any author text associated with the recommendation or any alternatives and dialogue phase, etc.
>
> One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered). A conflicting answer that arises in alignment AND survives periagoge/meiutic/adversarial review is marked unanswered until confirmed.
>
> If these unanswered dispositions survives periagogic and meiutic scrutity (stop before adversarial review), you have bootstrap authority to reconcile the unanswered node encoding, the alignment skill, and alignment artifact and re-encode the unanswered frontier (the full graph) including merge analysis.

The author, 2026-09-03, a note on the same:
> A conflicting answer that arises in alignment AND survives periagoge/meiutic/adversarial review is marked unanswered until confirmed. A conflicting answer that arises outside of alignment is a proposal.

The author, 2026-09-03, on the sequence of this sitting:
> First, prepare for compaction. Afterr compaction we will proceed with periagoge, meiutic then reconciliation.

The author, 2026-09-03, answering the periagogic probe on the two loci of "proposal":
> closer to the second meaning. A conflicting answer that arises outside of alignment is a proposal. eg. via some evidence/signal/instrument/criteria or because a conflict is identified outside of alignment. The term must not be overloaded - it is technical vocabulary. This narrows the authority node definition is that conflicting answers evaluated in alignment are recorded differently.

The author, 2026-09-03, refining the disposition:
> refinement of disposition: evaluate the unanswered encoding greenfield given other dispositions about it from this session. Encoding details are delegated. The flipping of node I suggested from answered to unanswered pending confirmation feels like a hack. At a functional level, when reading the documentation for a node that has been previously confirmed/answered I want to see if there are alternate proposals surfaced outside of alignment, or alternate answers surfaced during alignment which are pending confirmation. The model includes the question, which may have associated active dialogue state (confirmed dialogue state is rendered to the questions and otherwise only exists in git history), and if there is active dialogue state that will include a recommendation after the (first) meiutic phase. recommendation is a node or a node diff. recommendation may change on kickback, or as the unanswered frontier otherwise evolves. Since all nodes are currently unanswered we expect every recommendation to be a node, not a diff.

The author, 2026-09-03, on the maieutic bindings, first on the staleness of a whole-node recommendation:
> > recommendation as a whole node
>
> This can go stale as easily (if not easier) than a diff. This probably means we need some sort of pinning of the recommendation as well (if that's not already recorded).

The author, 2026-09-03, on what grounds work while an alternative is pending:
> When an alternative is pending on ANY node with authority (ratified, deferred or delegated - remember that ratified has specific technical meaning) the previously confirmed answer keeps its full authority until an alternative is confirmed.

The author, 2026-09-03, on a proposal from outside alignment:
> A proposal from ouside alignment opens a dialogue on its node, yes.

## Answer

The disposition and the dialogue on it. The disposition is the node as it stands: the question, its fields, the answer, and the rationale, the standing text when the node was once ratified and otherwise the AI's draft, stamped deferred or unstamped. The dialogue is everything the node carries only while it is unanswered, or while a ratified node is under review; it is removed at the recording, when the stamp is written, except as the quotes ruling decides for the author's words. It has seven parts, and each holds only what cannot be re-derived. Three requirements fix what they must be between them: the dialogue must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks and this answer does not yet meet; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the unanswered frontier.

`stage`, the next movement owed: periagogic, maieutic, review, or ruling. The movements come in that order, so the stage also says what is behind the node, and a kickback moves it back.

`## Disposition`, the author's words, verbatim and dated, accumulating through the dialogue.

`## Draft`, the recommended text when it differs from the node as it stands: one fenced markdown block holding the whole proposed node, frontmatter and sections, so that the same reader parses it and the alignment page shows the edit, field by field and word by word, beside the whole. A node with no draft section is its own draft, and a confirmation ratifies it as it stands. A draft may be invalid under the doctrine of the day, as when it presumes a ruling not yet given; the validator parses it and checks only that it answers the same question.

`recommendation`, the facts a recommendation must state, as data, required from the review stage on: `class`, the stamp a confirmation confers, ratified or delegated; and `boldness`, low, moderate, or high, how much of the draft rests on the AI's own knowledge against the record and the author's words. The third fact, persistence, is derived from the node's shape and never stored: the node itself is standing, and each shim, each piece of evidence, and each proposal in it is named with its own persistence, as the growth node's presentation rule lists them. The reasoning behind each fact is prose in the proposal.

`review`, the state of the clean-context review of the draft: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the hash of the draft text the reviewer read, so that a draft changed since the review shows as changed on the frontier and the page; what the reviewer saw is the whole unanswered frontier at the review's date, as the clean-context-review node says, and needs no field. A node reaches the ruling stage only with a forward verdict.

`depends`, the open questions whose rulings this one waits on, as data: the ids of unanswered nodes that must be answered before this node can be, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed with the rest of the dialogue at the recording.

`## Proposal`, the AI's account in prose: the evidence, the findings, the alternatives and why they were rejected, the reasoning behind each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author.

The validator holds the parts together: a stage on every unanswered node and on no answered node except one under review; a recommendation from the review stage on; a forward verdict at ruling; a draft that parses and answers the node's question; every `depends` id resolving to a node that is still unanswered; the refusal of a stage on an answered node is latent until an answered node exists. Everything else about the dialogue is derived: the status, the persistence, the queue and its order, whether the draft changed since the review, the edit the page shows, and the counts.

## Rationale

The author's question of 2026-09-03, quoted above, answered greenfield. What the dialogue must carry is fixed by what cannot be re-derived once the session that held it is gone: the author's words, the position reached, the recommended text, the facts the presentation rule requires, and what the reviewer found. Each of those was already in the record on 2026-09-03, but four of them as prose conventions inside the proposal section: a "Facts:" line, a "Proposed text" block, a review subsection with a verdict and a strength, and two conventions for the draft, since a new node was its own draft while a node of the sitting on purpose carried a proposed text beside its standing answer. Prose conventions drift, and the page could not read them; the reviewer had already flagged that "as shown" was ambiguous between the node and the draft. This answer makes the facts, the verdict, and the draft data where a projection or the validator reads them, and keeps them prose where only a person does; the stage stays one field, since the movements are ordered and a date per movement would store what version control already holds. The pin on the reviewed text is the one part with no prose precedent: a review is a reading of a text, and a review whose text has moved is stale, which the reader must be shown. Rejected: the state as prose only, since the page would keep guessing; a date per movement, since it duplicates history; a separate draft file per node, since a node is one file and the draft is parseable inside it; a stored diff, since it is derived from the draft and the node; persistence as a stored fact, since a node is always standing and its shims are declared; a validator that refuses a draft changed since the review, since the session decides whether a change is substance, as the recording node says, and the flag gives it the fact. Traditions, owed as readings under the stub-traditions ruling: the RFC and PEP processes, a status field on a prose document with a fixed order of states; review approvals pinned to a revision in code review, where a new revision marks the approval stale; and the review of a change as a diff against what stands.

## Proposal

### Finding: the review pin does not cover the standing answer, 2026-09-03

`review.of` is defined above as the hash of the draft text the reviewer read, "so that a draft changed since the review shows as changed on the frontier and the page". Found while verifying this session's own landing: when a node carries a `## Draft`, the pin covers the draft alone, so an amendment to the node's standing answer is invisible to it. `node` had its answer amended on 2026-09-03 to strike the no-children rule and the frontier does not flag it, while `transience`, `dialogue` and `authority`, which carry no draft and are therefore their own drafts, are flagged correctly.

The consequence is narrow but is the drift this answer exists to prevent: a reviewer's verdict stands against text that has since moved, and the reader is not told. The fix is not obvious enough to take here — pinning both texts, pinning the whole node, or holding that the standing answer of a node under draft should not be amended at all are three different answers with different costs — so it is recorded as a finding on this node and left for the review.

### Reconciled to the author's requirements, 2026-09-03

The author, 2026-09-03:
> also provides bootstrap authority to reconcile the alignment skill with that unanswered disposition

and, setting the requirements:
> record/reconcile unanswered disposition for what that dialogue state needs to contain to persist across sessions, maintain fidelity, and give the author the necessary context during dialogue about the how an unanswered disposition relates to the unanswered frontier.

Three requirements, and the answer met one of them. Persistence across sessions was already the organising principle: the rationale below fixes the contents by what cannot be re-derived once the session that held it is gone, and the checkpoint node writes the state at every transition. The other two were not met, and are now named in the answer, one of them as a requirement this answer does not yet satisfy.

**Fidelity.** Nothing among the parts holds the author's intention against the account that accumulates around it. Measured on this graph the same day, over the 43 nodes carrying the author's words, the author's verbatim share of the dialogue text falls from about 13 per cent at nought or one review round to about 4 per cent at two, and does not recover; across the graph it is 6.2 per cent. The dilution is done by the parts this answer added — the review, the recommendation, the account — and it is heaviest exactly when a node is being prepared for the author's ruling. The requirement is stated here; the mechanism is the `fidelity` question and is not decided here, because the right measure is part of what that question asks and this answer should not presume it.

**The frontier relation.** The answer's own principle is that what a projection or the validator must read is data and what only a person reads is prose. It applied that to the facts, the verdict and the draft, and left the node's relation to the open frontier as prose conventions inside the account: verified on 2026-09-03, `Depends on:` on 21 nodes, `Feeds:` on 9, `Also named:` on 54, and the projector reads none of them. That is the same drift the rationale below indicts, in the same section, unfixed. `depends` is added as the seventh part, and only `depends`: what a question feeds is its inverse and derives from it, and the node's place in the answered graph is already carried by `under`, `after`, `order` and `cites`. The prose conventions are then unsupported and are liquidated through reconciliation, where the author rules on the pruning.

Consequences not taken here. Migrating the 21 `Depends on:` conventions into `depends` reads and rewrites a third of the graph, which is a reconciliation with the author's ruling on each, not a landing inside this sitting; `Also named:`, which is the AI's cross-reference rather than a dependency, may want a different home or none. The projector and the alignment page do not yet read `depends`, so the field is recorded before its instrument exists, which the frontier will show.

The answer changed after its review of 2026-09-03, so the review is owed again on the changed text, and the recommendation's class is unchanged.

### Recording of 2026-09-03

The author's question quoted above is answered as this node, stamped deferred and recommended for ratification. The author's: that an unanswered node is the disposition plus the state of the dialogue, and the list of what that state tracks. The AI's, open to the author's ruling: the six parts and which of them are data; the draft as a fenced block inside the node; the pin on the reviewed text; persistence derived rather than stored; the validator's rules. The tooling landed the same afternoon, and the migration of the existing nodes to these fields with it: every node at the review or ruling stage carries its recommendation, every proposed text is a draft section, and every node forwarded by a review carries the review's state with the hash of the draft it read; the frontier reads the stage and flags a review whose draft has changed since.

Facts: authority ratified; boldness high, the model being the AI's construction from the author's list; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: '## Draft, the recommended text when it differs from the node as it stands.' The reader accepts only four sections — Disposition, Answer, Rationale, Proposal (SECTION_ORDER in packages/disposition/read.mjs) — and rejects anything else with "unexpected '## Draft' heading"; 'recommendation' and 'review' are likewise absent from FRONTMATTER_KEYS. A node written to this answer today fails validation. The Proposal discloses that the tooling follows, which is the right disclosure; the answer should still say which of the six parts a node may carry now.
- Answer: 'The third fact, persistence, is derived and never stored: a node is standing.' Growth's presentation rule, which this node implements, lists six persistence values including 'a proposal that dies at the ruling, an un-aligned disposition, evidence, or not recorded'. Collapsing the fact to 'standing' for every node drops four of them without recording the divergence from the parent rule. Suggested edit: say persistence is derived for a node and stated in prose for anything else a sitting recommends.
- Answer: '## Disposition, the author's words, verbatim and dated' together with 'it is removed at the recording, when the author's words are quoted into the rationale'. The quotes sitting's recorded resolution is the opposite — 'the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting' — and authority makes a stamp invalid without the ruling in the node. Removing the section at the recording would invalidate the stamp written beside it. Suggested edit: exempt '## Disposition', or say what the roll-up leaves behind.
- Answer: 'review ... and of, the hash of the draft text the reviewer read.' Nothing computes it: blobSha1 hashes whole files, not sections, and the review subsections written on 2026-09-03 carry no hash. The one part of the model the node says has no prose precedent is also the only one with no producer named.

On the three facts: 'Authority ratified if the author confirms; boldness high, the model being the AI's construction from the author's list; persistence standing' is correct and honest — this and alignment-target are the only two facts lines in the batch that state a single class and a single boldness value, as growth's rule and this node's own 'recommendation' part require. It should add that no node carries these fields yet, so a confirmation ratifies a schema and a migration together, and that this batch's own sixteen reclassified nodes are non-conforming to it from the review stage on.

Strongest counter-argument (strong): The node's own test for storing anything is that it 'cannot be re-derived once the session that held it is gone', and three of the six parts fail it. The recommendation's class and boldness are judgments the next session would make again from the same node; the review's verdict and strength are re-derivable by re-running a review that the recording node already requires be re-run whenever the draft changes; and the draft is a copy of a node inside the file that holds it. What genuinely cannot be re-derived is the author's words and the stage — which the record already carried. So the model formalises as schema what prose was carrying, and pays four new fields, a hash with no producer, and a section the validator rejects, against transience's rule that only what re-derivation cannot reconstruct is stored.

The session's reply: The test is what re-derivation cannot reconstruct at a projection's cost. The recommendation's facts and the review's verdict are re-derivable only by running the judgment again, a sitting or a review, and the record stores the results of judgments for that reason, as it stores a stamp and a boost; the draft is not a copy of the node but differs from it by exactly the edit the author rules on, and the page shows that edit from the two. The hash's producer is the reader, deriveDraftHash, landed the same afternoon as this review, with the fields and the section; their absence at the time of reading was timing. Accepted: persistence is derived from the node's shape, standing for the node itself with each shim, evidence, and proposal in it named, as growth's presentation rule lists them; the recording removes the Disposition section only as the quotes ruling decides, the words being quoted into the rationale either way.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: '## Disposition, the author's words, verbatim and dated' together with 'it is removed at the recording, when the author's words are quoted into the rationale'. Quotes' recorded resolution is the opposite — 'the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting' — and authority makes a stamp invalid without the ruling in the node. The session's reply says the removal happens 'only as the quotes ruling decides'; the answer does not say so. Suggested edit: put the contingency in the answer.
- Answer: 'The validator holds the parts together: a stage on every unanswered node and on no answered node except one under review; a recommendation from the review stage on; a forward verdict at ruling; a draft that parses and answers the node's question.' Verified partly true: read.mjs enforces stage-on-unanswered, the recommendation requirement, and draft parse-and-question; it does not appear to refuse a stage on an answered node not under review, since no answered node exists to test it. The claim should say which parts are enforced and which are latent.
- Answer: 'A node reaches the ruling stage only with a forward verdict.' Verified consistent with the record: the two kickback verdicts (public/agency, tier) sit at periagogic and maieutic. But second-stop carries a kickback verdict at stage review, which the rule does not cover.
- Rationale carries a prose tradition list ('the RFC and PEP processes ... review approvals pinned to a revision in code review ... the review of a change as a diff against what stands'), which readings' draft forbids; stub-traditions' enumeration does not name this node.

On the three facts: The frontmatter recommendation (ratified, high) states one class and one value and honestly names the model as the AI's construction. It should add that the migration is now complete — every node at review or ruling carries a recommendation and the graph validates — so the author is ratifying a schema already in force rather than a proposal.

Strongest counter-argument (strong): The node's own test for storing anything is that it cannot be re-derived once the session that held it is gone, and three of the six parts fail it: the recommendation's class and boldness are judgments the next session would make again from the same node, the review's verdict and strength are re-derivable by re-running a review the recording node already requires be re-run when the draft changes, and the draft is a copy of a node inside the file that holds it. The session's reply — that the record stores the results of judgments, as it stores a stamp and a boost — is a good answer for the recommendation and the review; it is weaker for the draft, which is genuinely a copy, and the batch shows the cost: eight drafts in this batch have drifted from the replies that amended them.

The session's reply: Validated. Amended tonight: the removal of the author's words at the recording is contingent on the quotes ruling, and the validator's latent refusal is named. Second-stop's kickback at the review stage is a recorded override. The traditions in the rationale go to readings. On the counter-argument, that three of the six parts are re-derivable: the record stores the results of judgments, and the draft is the copy the batch just showed can drift, which is why the hash pins it and the frontier flags it. Stage review.

### Frontier finding, 2026-09-03

Kind: decomposition.

Transience's un-aligned paragraph now enumerates the whole dialogue — 'the author's words, verbatim and dated, in a `## Disposition` section; the AI's account ... in a `## Proposal` section; `stage` ... and, from the review stage on, the recommendation's facts and the review's state as data' — which is dialogue's entire answer, and it states the status rule, which is unanswered's. Its own amendment review flagged the double definition of 'stage' and the frontmatter defines list was fixed; the prose enumeration was not. The result is that three nodes carry the same list and drift between them is invisible until they are read together, which is what this survey is for.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/unanswered.

Proposed: Dialogue is the survivor of what an unanswered node carries and unanswered of the status. Transience's un-aligned paragraph reduces to two sentences: that an un-aligned disposition is a node with a question and no answer, and that it carries the dialogue as dialogue defines it and has no children. Everything else in that paragraph moves to, or is already in, dialogue and unanswered. The five-shape taxonomy, which is what the node is for, is untouched.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Sitting' is the record's name for one run of the alignment dialogue and is used across growth ('each is a sitting in two separated stages', 'The sitting moves in order'), recording, dialogue, transience, alignment-target and roughly twenty Proposal headings ('### Sitting on purpose, 2026-09-03'). No node defines it: the parsed graph's 88 terms include 'periagogic', 'maieutic', 'propose', 'project', 'ratify' and 'steer' from growth, and no 'sitting'. Projection's draft requires every defined term to link to the node that defines it, so the word that names the record's central act is the one word the browser cannot link.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/recording.

Proposed: Growth is the survivor and adds 'sitting' to its defines, with one sentence in the answer saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. Recording and dialogue then use the term without redefining it. Two neighbouring gaps should be closed in the same pass: 'bootstrap grant', named by authority's shim and used in evaluation and materialization, is defined nowhere; [Superseded 2026-09-03: 'bootstrap grant' no longer names anything. The shim it named was struck when the author expired it, replaced by the unanswered-node model, under which what the AI writes when it opens a question is an unanswered disposition and exercises no authority. The gap survives under the successor term: 'bootstrap authority' is defined in its own shim text on `authority` and is still absent from that node's `defines`, and the answer does not define it, so `defines` is not the fix. The claim that the term is used in `materialization` was wrong when written; that node has never carried it.] and 'frontier item', used by transience and work-loop, rests on work-loop's 'frontier'.

### Frontier finding, 2026-09-03

Kind: coverage.

Sixteen nodes still carry the reclassification's generic prose Facts line, 'authority ratified if the author confirms, or delegated where the author's words delegate it; boldness ...; persistence standing': agency, recording, evaluation, attention, legacy, persistence, review, validation-order, work-loop, aristotle-hexis, software-factories, spec-driven-development, plato-maieutics, plato-periagoge, aristotle-arche-of-action and pettit-non-domination. Two of them (agency, recording) still say 'boldness as the rationale shows'. Dialogue requires 'one class and one boldness value from the review stage on', and each of the sixteen now carries a well-formed frontmatter recommendation that the prose contradicts. The alignment page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/recording.

Proposed: Dialogue is the survivor of the requirement. The sixteen prose Facts lines are rewritten to match each node's frontmatter recommendation, or deleted, since the recommendation field now carries the two facts and growth's presentation rule is satisfied by it plus each shim named in prose. Growth's presentation rule should say explicitly that the three facts are presented from the recommendation field and the node's shims, not from a prose line, so the duplication cannot recur.

### The author's second disposition, 2026-09-03

The author's words above, given during the sitting on alignment-order, answer this node's question differently from the draft the review forwarded: the dialogue's state becomes a recommendation, encoded as an answered node or a diff, and a list of alternatives, each with its source, the author, the AI, or the adversarial review, and the author's text attached to whichever it bears on. The stage returns to periagogic at the author's direction: the disposition is to survive periagogic and maieutic scrutiny, and the adversarial review is not to run on it. The bootstrap-authority grant in the last paragraph is conditional on that survival and is not in force; it names the reconciliation it covers, the unanswered-node encoding, the alignment skill, the alignment page, and the re-encoding of the whole unanswered frontier with merge analysis, and it is quoted here, on the node it bears on, before any implementation is written, as the authority shim requires. Two parts of the words are carried on the nodes whose questions they answer: the analysis of new question against new answer on frontier-consistency, and the marking of a surviving conflicting answer on unanswered.

### Probe answered, 2026-09-03

The periagogic movement closed on one probe, answered by the author in the words quoted above. The record uses "proposal" at two loci that do not say the same thing: this node's seventh part, `## Proposal`, "the AI's account in prose", and the authority node's proposal, what "would contradict doctrine or exceed its scope" and "has no authority and acts on nothing until the author rules". The probe: does the record anywhere say the dialogue's section is a proposal in authority's sense, or is the collision only in the name; and does the author's note, that a conflicting answer arising outside alignment is a proposal, state authority's definition as written or narrow it, since authority's sentence says nothing about where the answer arose. One fact was put before the author with the probe, as a fact and not an argument: the alternatives the author's model asks for already exist as prose, under "Rejected:" in every rationale, and the review's counter-arguments sit in the section the model would replace. The AI's adversarial evaluation of the model is owed after the author commits to the probe, as counterpoint cited by locus. The sequence the author set: periagogic, then maieutic, then the reconciliation under the conditional grant quoted above, with no adversarial review before it.

The author's answer, and what it does to the record. "Proposal" is technical vocabulary reserved for a conflicting answer that arises outside alignment: from an instrument, a criterion, a signal, or a conflict found in reconciliation. The collision is not only in the name. Authority's draft answer says a proposal is "a candidate answer, an amendment, or a finding with no authority, recorded in a stamped node or in a sitting's record", which folds the sitting's record into the term; the author's words narrow that sentence, and it is quoted on authority for the redraft. The other loci stand under the narrowed sense: authority's standing answer, which names what "would contradict doctrine or exceed its scope"; session-context's "prune-by-default proposal"; transience's "pending items are proposals". The one locus that falls is this node's seventh part, `## Proposal`, the AI's account in prose, which is not a proposal in the narrowed sense and loses the name. The author retracts the flip of an answered node to unanswered pending confirmation, stated in the disposition above and carried on unanswered; the record already agrees with the retraction, since unanswered's answer makes the status derived, never a field, and keeps an answered node's stamp while its dialogue is open. The refinement delegates the encoding's details and fixes the function: a reader of an answered node sees the alternatives pending on it, from outside alignment as proposals and from inside it as alternate answers awaiting confirmation; a question carries active dialogue state or none; active state carries a recommendation from the first maieutic movement on, a whole node or a diff, which may change on kickback or as the frontier moves; at the recording the confirmed state is folded into the node and survives otherwise only in history. The AI's adversarial evaluation of the model was put to the author as counterpoint in the same turn, cited by locus, and the maieutic movement opened on two bindings: whether a standing answer keeps its authority while an alternative is pending on it, and whether a proposal entering from outside alignment opens the dialogue on its node at the periagogic stage.

### Maieutic closed, 2026-09-03

The two bindings put to the author are answered in the words quoted above, and the disposition survives the periagogic and maieutic movements with one change the author made themselves, the retraction of the flip to unanswered. First: a standing answer of any class, ratified, delegated, or deferred, keeps its full authority while an alternative is pending on it, until the author confirms an alternative; the alternative is visible and inert. Second: a proposal from outside alignment opens the dialogue on its node, and the frontier ranks it. Third, on the AI's stated decision to hold the recommendation as a whole node: the author observes that a whole node goes stale as easily as a diff and asks for the recommendation to be pinned; the encoding answers with a pin on the recommendation, the hash of the standing text it was drafted against where the node has one and the graph commit it was drafted at, so the frontier can show a recommendation whose ground has moved, as it already shows a review whose draft has moved. The adversarial review does not run before the reconciliation, at the author's direction; the reconciliation now proceeds under the conditional grant quoted above, which is in force from this point, and the review runs on what it writes.

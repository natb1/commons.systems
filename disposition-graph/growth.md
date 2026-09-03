---
question: How does the graph grow?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: ba115e9727a9c3000ba85a9dca2cb63d7b1ebd70
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
boost: 4
under:
  - commons.systems/disposition-graph/model
defines:
  - propose
  - project
  - ratify
  - steer
  - periagogic
  - maieutic
  - boldness
shims:
  - artifact: "`.claude/skills/align/SKILL.md` on the implementation ref, the alignment skill hand-written from this node and its siblings"
    for: the projection of this node and its siblings as the alignment skill
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-02
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability, the author's responses read back by the session with the artifact tool
    for: the projection of the open dialogue for the author's ruling, every unanswered node in rank order with its stage, the author's words, the node as it stands, the AI's account with its three facts, and the three responses open on any subset
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Disposition

The author, 2026-09-02:
> All alignment involves a periagogic and maieutic phase, not just `/align <node_id>` but also `/align <disposition>`. The periagogic of `/align <disposition>` confirms I fully understand the existing record and implementation before making changes. This way I dont, for eg., undo a disposition because I forgot or didn't understand the good reason it was in place.

The author, 2026-09-03:
> update the `/align` shim and disposition (guiding this current dialog) so that recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) If this is not the recommended ontology then refine it (is a transient disposition still called a disposition, etc.) This way I know if I am approving some transient stop-gap or something that will persist in the graph.

The author, 2026-09-03:
> Ratified on the rule. Ratified on the shim.

## Answer

By a loop of three moves. Propose: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's proposal and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put with its authority class, boldness, and alternatives; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the record and the author's words against the AI's own knowledge; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, a proposal that dies at the ruling, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The alignment page lists every unanswered node in rank order, the purpose node first, each with its stage, the author's words, the node as it stands, the AI's account, and the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once, as the unanswered node says; the author rules there or in prose, and the session reads the responses back and resumes each dialogue at its stage. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author, 2026-09-03, on dispositions stated mid-sitting: "we expect that alignment dialogues like this one (which is mixed in with ad-hoc reconciliation during bootstrap) will trigger recursive disposition statements from the author. This is supported usage of the alignment skill. The expected behavior of the skill is to queue each disposition (newly stated or via node_id) in some state that persists across alignment context compaction. Are these new un-aligned dispositions - dispositions that aren't just unratified/unreviewed, but haven't even survived the alignment dialog yet." And later that day: "Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact (previously called the review artifact). The alignment artifacts outputs are consumed by the greenfield/shimmed alignment skill." Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round; rejected from it: issue trackers, tactics, phases, the router and its gates, born-parked review, placement gates, the curriculum, and the skill's own text as authority (evidence: `bootstrap/align-survey.md` on the implementation ref).


## Proposal

### Sitting on purpose, 2026-09-03

**The growth node, whole, as recorded today**

The node as it stands after today's recording: both stages in both usages with the periagogic object stated, the presentation rule with the three facts, the sitting's movements, and two shims declared (the skill file, the review page). The stamp is deferred; the author's ruling on the rule is recorded in the content, and the node is here for the ruling on the whole. The rationale still quotes the author verbatim, which q10 decides.

Facts: authority ratified; boldness moderate; persistence standing; the two shims with their liquidation conditions.

Rejected:
- Split the presentation rule and the sitting's movements into nodes of their own. — Each answers "how does the graph grow" from one side; a split would need a question neither answers alone.

Depends on: `quotes`, `review-context`, `review-artifact`

Proposed: the node as it stands.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Frontmatter, second shim: the artifact is described as 'written by node packages/disposition/project.mjs disposition --alignment <file>'. The projector accepts only --input, --out, --rules, --ancestry, --local and --frontier; the page is built by bootstrap/review/build.mjs. Transience requires a shim to name its artifact so the frontier can read it; a shim whose account of its own artifact is false cannot be checked. Suggested edit: name build.mjs.
- Answer: one paragraph of 816 words that answers the three moves, the two usages, the two conducts with their Plato loci, the six movements of a sitting, the three-fact presentation rule, the ban on transient dispositions, un-aligned dispositions and the queue, the alignment page, and legacy nodes. The node node in this batch says 'If a text answers two questions, it is two nodes.' Suggested edit: at minimum split the presentation rule, which the author stated on 2026-09-03 as a disposition of its own.
- Answer, persistence list: 'standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, a proposal that dies at the ruling, an open question, evidence, or not recorded'. Transience's five shapes are criterion, shim, proposal, un-aligned disposition, evidence. 'Open question' appears here, in authority's draft and in node's draft; no node defines it, and the validator's own message uses 'un-aligned disposition'. Suggested edit: use one term and define it once.
- Frontmatter 'class: deferred' while the rationale records 'Ratified on the rule. Ratified on the shim.' and the facts say 'authority ratified'. Suggested edit: state in the Proposal which part of the node the deferred stamp is still waiting on.

On the three facts: Ratified, low boldness, standing, with two shims, is right for the two-stage rule and the skill shim, which the author ruled on verbatim. But the six movements and the periagogic objects are the AI's drafting and are not low boldness, and the alignment-page shim's artifact is misdescribed, so its liquidation cannot be checked as presented.

Strongest counter-argument (strong): The node breaks the rule it sits under. Node says one question and its standing answer, and that a text answering two questions is two nodes; this answer covers at least six separable questions, and the author's own disposition of 2026-09-03, that every recommendation is presented with authority, boldness and persistence, was stated as a disposition in its own right. The node's rejected alternative answers this ('a split would need a question neither answers alone'), but 'What must a recommendation state before it is recorded?' and 'What are the movements of a sitting?' are exactly such questions. The cost of the merge is concrete: growth is the node model's draft boosts first for newcomers, and an 816-word single paragraph is the first thing a newcomer would read.

The session's reply: The recommendation stands as one node, with an amendment. The question has one answer, the dialogue, and the movements, the presentation rule, and the queue are its parts; the recording node, created on 2026-09-03 under growth, is the precedent for a part that becomes a node when it needs a stamp of its own, and the author may rule the presentation rule such a node. The shim finding is resolved: the alignment page is written by the projector's --alignment flag since 2026-09-03 and the review builder was deleted. Accepted: the persistence list now says un-aligned disposition, the one term; the answer is split into paragraphs by part at the recording; and the movements are moderate boldness, not low.

### Clean-context review of the amendment, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, the author's words, and the amendment named in the brief, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, amended sentence: 'The alignment page lists every unanswered node in rank order, the purpose node first', and the second shim's amended for: line, 'every unanswered node in rank order with its stage ...'. The page as built groups by stage in the fixed order ruling, review, maieutic, periagogic and ranks only within a group (groupAlignmentItems in packages/disposition/project.mjs); commons.systems/public/agency at rank 1.0000 is its seventh item. Transience requires a shim to name its artifact so the frontier can read it, and the previous clean-context review of this node found the same class of defect on this same shim. Suggested edit: describe the page as grouped by stage and ranked within, or change the page.
- Answer, same sentence: 'the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once'. The page's controls are four — 'Ratify as shown', 'Ratify with edits', 'Defer', 'Overrule' — and they render only for stage ruling; a node at stage review, which is twenty of the twenty-four items now before the author, renders 'In clean-context review; nothing to answer yet.' The author reading this sentence would expect to be able to respond on any unanswered node.
- Answer, amended three-usages sentence: the paragraph states the periagogic object for a sitting on a node and for a sitting on a disposition, and the amendment adds a third usage without one. Harmless in effect, since the third resolves to a node, but growth is where the objects are defined. Suggested edit: one clause saying the third usage takes the node's object.
- Proposal, 'Sitting on purpose, 2026-09-03', is not updated for the amendment: it still reads 'both stages in both usages ... and two shims declared (the skill file, the review page)'. The answer now has three usages, and the author renamed the artifact on 2026-09-03 ('the alignment artifact (previously called the review artifact)'). The AI's account the author rules against is stale on both points.

On the three facts: The Facts line ('authority ratified; boldness low; persistence standing; the two shims with their liquidation conditions') predates the amendment and is not updated for it. The amended page sentence is not low boldness: 'the purpose node first' is the author's, but 'every unanswered node in rank order' and the two-graph order behind it are the AI's reading recorded on unanswered, and the amended shim for: line now describes an artifact that does not behave that way, so the shim's liquidation cannot be checked as presented.

Strongest counter-argument (moderate): The amendment makes growth cite two nodes that did not exist when it was written and states their content twice: the page's order and its responses live here and on unanswered, the third usage here and on alignment-target. Node's rule is that a text answering two questions is two nodes, and the previous review of this node already found the answer covering at least six separable questions in one 816-word paragraph; the amendment adds a seventh. Every duplicated sentence is a place two nodes can drift, which is what the record exists to prevent — and the cheap fix is half-applied: the third usage defers with 'as the alignment-target node says', the page sentence restates instead.

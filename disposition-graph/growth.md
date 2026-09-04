---
question: How does the graph grow?
stage: maieutic
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: ba115e9727a9c3000ba85a9dca2cb63d7b1ebd70
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
      - name: split-presentation-and-movements
        source: review
        ref: "2026-09-03"
      - name: define-sitting
        source: review
        ref: "2026-09-03"
      - name: cite-unanswered-for-responses
        source: review
        ref: "2026-09-03"
      - name: facts-from-recommendation-field
        source: review
        ref: "2026-09-03"
      - name: partial-ratification
        source: review
        ref: "2026-09-03"
      - name: strike-phantom-depends
        source: review
        ref: "2026-09-03"
      - name: cite-the-reading
        source: review
        ref: "2026-09-03"
      - name: queue-in-ruling-order
        source: author
        ref: "2026-09-03"
      - name: boldness-reversed
        source: review
        ref: "2026-09-03"
      - name: boldness-left-and-dialogue-corrected
        source: ai
        ref: "2026-09-04"
    recommends: boldness-reversed
    boldness: low
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
  - name: persistence
    options:
      - name: both shims kept
      - name: the page's shim moved out
    recommends: the page's shim moved out
    boldness: low
depends:
  - commons.systems/disposition-graph/alignment-page
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
form: rule
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

The author, 2026-09-03, on the term this node defines:

> confidence in the recommendation (previously called boldness, now called confidence)

The words in full are on `commons.systems/disposition-graph/alignment-page`, the node whose question they open.

The author, 2026-09-02:
> All alignment involves a periagogic and maieutic phase, not just `/align <node_id>` but also `/align <disposition>`. The periagogic of `/align <disposition>` confirms I fully understand the existing record and implementation before making changes. This way I dont, for eg., undo a disposition because I forgot or didn't understand the good reason it was in place.

The author, 2026-09-03:
> update the `/align` shim and disposition (guiding this current dialog) so that recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) If this is not the recommended ontology then refine it (is a transient disposition still called a disposition, etc.) This way I know if I am approving some transient stop-gap or something that will persist in the graph.

The author, 2026-09-03:
> Ratified on the rule. Ratified on the shim.

The author, 2026-09-03, retracting the rename recorded above:

> stick with boldness then, I want to know how much rests on the AI's own knowledge against the record.

The author, 2026-09-03, on the unit of a ruling, which bears on the presentation rule in this node's answer and on the alternative `partial-ratification`:

> the revised record is to carry a decision per aspect. each aspect of a disposition may have choices that require confirmation. each aspect has a recommendation with confidence.

The words in full are on `commons.systems/disposition-graph/alignment-page`.

The author, 2026-09-04, revising the disposition on when a recommendation may be drafted:

> AI recommendations can be recorded at any time during the dialog (not just after the first meiutic).

## Answer

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put with its authority class, boldness, and alternatives; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the record and the author's words against the AI's own knowledge; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an alternative in a dialogue that dies at the ruling, a proposal when it arose outside alignment, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The alignment page lists every unanswered node in rank order, the purpose node first, each with its stage, the author's words, the node as it stands, the AI's account, and the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once, as the unanswered node says; the author rules there or in prose, and the session reads the responses back and resumes each dialogue at its stage. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author, 2026-09-03, on dispositions stated mid-sitting: "we expect that alignment dialogues like this one (which is mixed in with ad-hoc reconciliation during bootstrap) will trigger recursive disposition statements from the author. This is supported usage of the alignment skill. The expected behavior of the skill is to queue each disposition (newly stated or via node_id) in some state that persists across alignment context compaction. Are these new un-aligned dispositions - dispositions that aren't just unratified/unreviewed, but haven't even survived the alignment dialog yet." And later that day: "Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact (previously called the review artifact). The alignment artifacts outputs are consumed by the greenfield/shimmed alignment skill." Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round; rejected from it: issue trackers, tactics, phases, the router and its gates, born-parked review, placement gates, the curriculum, and the skill's own text as authority (evidence: `bootstrap/align-survey.md` on the implementation ref).

## Facts

### answer

#### split-presentation-and-movements

Growth's answer is one paragraph answering at least seven separable questions, against node's rule that a text answering two questions is two nodes. This alternative splits the three-fact presentation rule into a child node asking what a recommendation must state before it is recorded, carrying the three facts, the persistence list and the ban on transient dispositions, and splits the movements of a sitting into a child node carrying the periagogic and maieutic objects; growth survives as the loop of three moves and the three usages of the skill, citing both. The reviewer proposed it twice and the session declined twice, referring the split to the author. Recording, delegation, alignment-target and checkpoint are the precedent for a part of growth becoming a node of its own.

#### define-sitting

Growth adds 'sitting' to its defines and one sentence saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. The word names the record's central act and is used by growth, recording, dialogue, transience and alignment-target and in about twenty account headings, yet no node defines it, so it is the one word the browser cannot link. Nothing else in the answer changes. Also raised on commons.systems/disposition-graph/dialogue. Also raised on commons.systems/disposition-graph/recording.

#### cite-unanswered-for-responses

Growth stops restating the alignment page's three responses and cites the unanswered node, which defines them and which the page implements. Three response vocabularies are live for one act across unanswered, recording and growth, and every restatement is a place they can drift; the response-vocabulary contradiction finding makes unanswered the survivor, so one node defines what the author may answer and the page implements that one list. The rest of the answer is untouched. Raised on commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/recording.

#### facts-from-recommendation-field

Growth's presentation rule says explicitly that the three facts are presented from the node's recommendation field and its declared shims, never from a prose line in the account. The coverage finding verified that sixteen nodes still carry a generic prose Facts line contradicting their own recommendation field, and the page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier. Growth's answer states the presentation rule without naming where the facts are read from; this closes the duplication at its source instead of node by node. Raised on commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/recording.

#### partial-ratification

The author already ruled 'Ratified on the rule. Ratified on the shim.' in a sitting, and growth still carries a deferred stamp and is offered for a fresh ruling on the whole node. This alternative has growth's account state which clauses the author already ratified, the two-stage rule in both usages and the alignment-skill shim, and the recommendation cover only the rest, so the author is not asked twice for a ruling they gave. Growth's own reply accepts this and defers it to its sitting, so the change is owed rather than made. It raises the question whether a clause can carry a stamp separately from its node, which belongs to authority. Raised on commons.systems/disposition-graph/authority.

#### strike-phantom-depends

The cross-reference finding carried on session-context proposes that growth's two dependencies naming no node — review-context and review-artifact — be struck as superseded in substance by clean-context-review and growth's own alignment-page shim, or minted as un-aligned dispositions, since a question that lives only on a page is the ledger the record asked to sunset. (Raised on commons.systems/disposition-graph/session-context.)

#### cite-the-reading

Growth's answer drops its own Republic citation for the periagogic movement and cites this reading instead, so the loci are stated in one place. The review of 2026-09-03 found the two citations disagreeing in extent, growth naming 518b to d while the reading names 518b to 518d plus 521c and 515c to 516a. (Raised on commons.systems/disposition-graph/plato-periagoge.)

#### queue-in-ruling-order

This node's queue, the set of unanswered nodes in rank order, and its list of what the alignment page carries, every unanswered node in rank order, are amended by the alignment-order draft to the ruling order, with rank as tie-break; the author's choice of what comes next remains `/align <node id>` and needs no boost. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

#### boldness-reversed

This node's definition sentence is reversed, so that boldness is how much of a recommendation rests on the AI's own knowledge against the record and the author's words, which is how the dialogue node words it, how the author worded it on 2026-09-03, and how every boldness stamp in the record was written. Two consequences of rulings on other nodes ride with it in the fence, because this node was restating questions that are not its own: the description of the alignment page leaves, with the shim that names the artifact, for the node that asks the page's question; and the clause placing the recommendation at the intention movement is loosened to say that the recommendation is put to the author there while it may be recorded at any stage, which is the author's revision of 2026-09-04 recorded on the dialogue node. Adopted by the recommendation, and set out in the fence.

#### boldness-left-and-dialogue-corrected

The inverse repair: this node's definition stands and the dialogue node, the alignment skill, and every boldness stamp in the record are corrected to match it. Against it: the author's own words give the direction, "I want to know how much rests on the AI's own knowledge against the record", so the correction would be against the author; and the stamps were written under the usage, so it would silently reverse the meaning of every one of them.

### persistence

The recommendation drops one of this node's two shims: the alignment page, which moves to `commons.systems/disposition-graph/alignment-page` with its declaration date and its liquidation condition intact. The skill shim stays, because this node is still what the alignment skill projects. Confirming it leaves one shim here; denying it leaves the page described in two places, which is what minting the page's own node was for. The two nodes rule together, and `alignment-page` carries the matching decision.

## Recommendation

```markdown
---
question: How does the graph grow?
form: rule
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
---
## Answer

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put to the author with its authority class, boldness, and alternatives, though the recommendation may be recorded on the node at any stage of the dialogue, as the dialogue node says; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the AI's own knowledge against the record and the author's words; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an alternative in a dialogue that dies at the ruling, a proposal when it arose outside alignment, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The author rules on the alignment page or in prose, and the session reads the responses back and resumes each dialogue at its stage; what that page shows and in what order is the alignment-page node's question, and what the three responses are is the unanswered node's. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author, 2026-09-03, on dispositions stated mid-sitting: "we expect that alignment dialogues like this one (which is mixed in with ad-hoc reconciliation during bootstrap) will trigger recursive disposition statements from the author. This is supported usage of the alignment skill. The expected behavior of the skill is to queue each disposition (newly stated or via node_id) in some state that persists across alignment context compaction. Are these new un-aligned dispositions - dispositions that aren't just unratified/unreviewed, but haven't even survived the alignment dialog yet." And later that day: "Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact (previously called the review artifact). The alignment artifacts outputs are consumed by the greenfield/shimmed alignment skill." Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round; rejected from it: issue trackers, tactics, phases, the router and its gates, born-parked review, placement gates, the curriculum, and the skill's own text as authority (evidence: `bootstrap/align-survey.md` on the implementation ref). Two amendments of 2026-09-04, from the sitting on the alignment page: the definition of boldness is reversed, because the dialogue node, the author's own words of 2026-09-03, and every stamp in the record run the other way and this node's sentence was the outlier; and the description of the alignment page leaves this node for the node that asks the page's question, taking with it the shim that names the artifact, because a page described in two places is ratified in two places, which is what minting that node was for.
```

## Account

### Sitting on purpose, 2026-09-03

**The growth node, whole, as recorded today**

The node as it stands after today's recording: both stages in both usages with the periagogic object stated, the presentation rule with the three facts, the sitting's movements, and two shims declared (the skill file, the review page). The stamp is deferred; the author's ruling on the rule is recorded in the content, and the node is here for the ruling on the whole. The rationale still quotes the author verbatim, which q10 decides.

Facts: authority ratified; boldness moderate; persistence standing; the two shims with their liquidation conditions.

Rejected:
- Split the presentation rule and the sitting's movements into nodes of their own. — Each answers "how does the graph grow" from one side; a split would need a question neither answers alone.

Depends on: `quotes`

Proposed: the node as it stands.

Responses open: confirm as shown; confirm with edits; deny with feedback.

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

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: 'the three responses open, confirm, confirm with edits, and deny with feedback'. Verified true of the page today: RESPONSE_CHOICES in packages/disposition/project.mjs is exactly confirm / edit / deny. But twenty-four nodes' Proposals end 'Rulings open: ratify as shown; ratify with edits; defer; overrule' and nine end 'take the recommended option; take another option by number; defer; answer in prose'. Three response vocabularies are live in one record. Suggested edit: settle it here or on unanswered and have the Proposals use the settled words.
- Answer: 'The alignment page lists every unanswered node in rank order, the purpose node first'. Verified true since the afternoon: orderAlignmentItems groups by the manifest's graph order and sorts by rank descending within a graph, so purpose (rank 0.3333) leads. The previous review's finding on this is resolved and the node should say so rather than leave the reader to check.
- Answer, persistence list and the sitting's movements: the answer is still one paragraph covering the three moves, the three usages, the two conducts with loci, the six movements, the presentation rule, the ban on transient dispositions, un-aligned dispositions and the queue, the page, and legacy nodes. Node's own rule is that 'If a text answers two questions, it is two nodes.' The session declined the split; the author should rule on it explicitly, since the presentation rule was stated by the author on 2026-09-03 as a disposition in its own right.
- Proposal: 'Depends on: `quotes`, `review-context`, `review-artifact`'. Verified: no node has the id review-context or review-artifact. Those questions live only on a page beside the record, which transience rejects as 'the ledger the author asked to sunset'. Suggested edit: mint them or drop them.
- The file ends with a bare 'null' where the session's reply to the amendment review belongs.

On the three facts: The frontmatter recommendation (ratified, high) states one class and one value, which is what dialogue requires. The prose Facts line ('authority ratified; boldness moderate; persistence standing; the two shims with their liquidation conditions') is stale for the amendment and for the author's 'Ratified on the rule. Ratified on the shim.', which is a ruling given in the dialogue that the record does not carry as ratified anywhere.

Strongest counter-argument (strong): The node breaks the rule it sits under, and the cost is concrete rather than formal: growth is the alignment section of the author's own high-level order, so it is what a newcomer meets third, and an 816-word single paragraph answering seven separable questions is what they meet. The session's defence — that recording was split out when it needed a stamp of its own, and the presentation rule may be split the same way — concedes the principle and defers the act. Two of the questions the paragraph answers already have their own nodes (recording, alignment-target) and the paragraph restates both, which is exactly where drift enters.

The session's reply: Validated. Amended tonight: the two dependencies on nodes that do not exist are struck, and the thirty-three Proposal closing lines across the frontier now offer the three responses the unanswered node defines and the page implements. The page lists every unanswered node in rank order with purpose first, as the finding verified. The split of the presentation rule and of the movements of a sitting into nodes of their own is a proposal the author rules on at this node's sitting, with the reviewer's counter-argument; the session does not split. The author's 'Ratified on the rule. Ratified on the shim.' is a ruling given in the dialogue, and the sitting records which clauses it covers and asks only for the rest. Stage maieutic: the split is the author's call.

### Frontier finding, 2026-09-03

Kind: contradiction.

Three response vocabularies are live for one act. Unanswered: 'the author may confirm, confirm with edits, or deny with feedback', with 'a fourth response, defer, is not needed'. Recording's Answer classifies four outcomes: 'A confirmation as shown, or the recommended option taken, is recorded ... A deferral leaves the answer deferred; an overrule records what the author said stands.' Growth restates unanswered's three. The alignment page implements exactly three (RESPONSE_CHOICES: confirm, edit, deny in packages/disposition/project.mjs). Meanwhile twenty-four node Proposals close with 'Rulings open: ratify as shown; ratify with edits; defer; overrule' and nine with 'take the recommended option; take another option by number; defer; answer in prose' — a fourth and fifth wording, neither matching the page the author will use.

Also named: commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/recording.

Proposed: Unanswered is the survivor: it defines the responses and the page implements them. Recording cites unanswered rather than restating, and recasts its second step as the classification of each of the three responses (a deferral being a node left unconfirmed, an overrule being a denial with feedback). Growth cites unanswered for the page's responses instead of restating them. The thirty-three Proposal closing lines are rewritten to the three words the page uses, which is a mechanical pass the session can do at the recording.

### Frontier finding, 2026-09-03

Kind: decomposition.

Growth's Answer is one paragraph answering at least seven separable questions: the three moves of the loop; the three usages of the alignment skill; the two conducts with their Plato loci; the six movements of a sitting; the three-fact presentation rule; the ban on transient dispositions and the queue of un-aligned dispositions; and what the alignment page lists and offers. Node's own rule is 'If a text answers two questions, it is two nodes.' The author stated the presentation rule on 2026-09-03 as a disposition in its own right ('recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition'), and the record has already precedent for splitting: recording, delegation, alignment-target and checkpoint were all split out from this node's subject matter.

Names only this node.

Proposed: Split the presentation rule into a node under growth answering 'What must a recommendation state before it is recorded?', carrying the three facts, the persistence list, and the ban on transient dispositions; growth cites it. Split the movements of a sitting into a node answering 'What are the movements of a sitting?', which is where the periagogic and maieutic objects belong; growth cites it. Growth survives as the loop and the three usages, and cites unanswered for the page rather than restating it. This is the split growth's own reviewer proposed and the session declined; the author should rule on it rather than the session.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Open question' is used on fifteen nodes and defined by none; the parsed graph carries 88 defined terms and 'open question' is not among them. Transience defines 'un-aligned disposition' for the same thing, growth's amended persistence list now uses that term, and the validator's own message says 'is unanswered and must carry stage'. Authority's draft and node's draft each use 'open question' for a slightly different notion, and several Proposals use it for a third ('persistence open question until written').

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/node, commons.systems/disposition-graph/transience.

Proposed: Transience is the survivor: 'un-aligned disposition' is the one term. Authority's and node's drafts use it; the Proposal facts lines that say 'persistence open question' say 'persistence un-aligned disposition', which is the shape transience's list actually names. No new defines entry is needed.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Sitting' is the record's name for one run of the alignment dialogue and is used across growth ('each is a sitting in two separated stages', 'The sitting moves in order'), recording, dialogue, transience, alignment-target and roughly twenty Proposal headings ('### Sitting on purpose, 2026-09-03'). No node defines it: the parsed graph's 88 terms include 'periagogic', 'maieutic', 'propose', 'project', 'ratify' and 'steer' from growth, and no 'sitting'. Projection's draft requires every defined term to link to the node that defines it, so the word that names the record's central act is the one word the browser cannot link.

Also named: commons.systems/disposition-graph/recording, commons.systems/disposition-graph/dialogue.

Proposed: Growth is the survivor and adds 'sitting' to its defines, with one sentence in the answer saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. Recording and dialogue then use the term without redefining it. Two neighbouring gaps should be closed in the same pass: 'bootstrap grant', named by authority's shim and used in evaluation and materialization, is defined nowhere; [Superseded 2026-09-03: 'bootstrap grant' no longer names anything. The shim it named was struck when the author expired it, replaced by the unanswered-node model, under which what the AI writes when it opens a question is an unanswered disposition and exercises no authority. The gap survives under the successor term: 'bootstrap authority' is defined in its own shim text on `authority` and is still absent from that node's `defines`, and the answer does not define it, so `defines` is not the fix. The claim that the term is used in `materialization` was wrong when written; that node has never carried it.] and 'frontier item', used by transience and work-loop, rests on work-loop's 'frontier'.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Three 'Depends on' entries name node ids that do not exist. Session-context: 'Depends on: `ledger-sunset`'. Growth: 'Depends on: `quotes`, `review-context`, `review-artifact`' — quotes exists, the other two do not. Verified by checking every backticked id in every 'Depends on' line against the graph directory. Transience rejects 'a queue kept outside the graph, because a list beside the record is the ledger the author asked to sunset'; these three dependencies are exactly that, questions that live only on a page.

Also named: commons.systems/disposition-graph/session-context.

Proposed: Mint the two live questions as un-aligned dispositions under the nodes they bear on, or strike the dependencies. 'review-context' and 'review-artifact' are superseded in substance by clean-context-review and by growth's own alignment-page shim, so striking them is the honest fix; 'ledger-sunset' is met, the ledger having been liquidated on 2026-09-03, so it is struck too. Growth and session-context are the nodes that change.

### Frontier finding, 2026-09-03

Kind: coverage.

The author, 2026-09-03, quoted in growth's rationale: 'Ratified on the rule. Ratified on the shim.' Authority's answer says ratification happens only through the alignment dialogue, and this ruling was given in one. Growth nevertheless carries 'authority: class: deferred' and is offered to the author for a fresh ruling on the whole node; its own review asked the session to 'state in the Proposal which part of the node the deferred stamp is still waiting on' and nothing does. So a ruling the author has given is recorded nowhere as an answer, and the author will be asked for it again.

Also named: commons.systems/disposition-graph/authority.

Proposed: Growth's Proposal states which clauses the author already ratified — the two-stage rule in both usages, and the alignment-skill shim — and what the fresh ruling covers. If the record's rule is that a node has one stamp, growth stays deferred and says in prose that two of its clauses are ratified in the author's words; if a clause can be ratified separately, that is a question for authority and should be minted there. Either way the author should not be asked twice for a ruling they gave.

### Frontier finding, 2026-09-03

Kind: coverage.

Four node files end with a bare 'null' on its own line, where a session's reply to a review belongs: authority, growth, projection and transience. On authority and transience the missing reply is to the amendment review, so four findings and a counter-argument stand unanswered on each, and the author would rule on a review nobody answered. The word parses as prose and passes the validator ('ok: 62 nodes'), so nothing catches it. Three of the four are among the record's most load-bearing nodes.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/transience.

Proposed: Write the four missing replies, or state on each that the review's findings are accepted, and strike the 'null'. The pattern is a serialization defect in whatever applied the reviews rather than four independent omissions, so the apply step should be checked: .claude/skills/align-review/apply.mjs is the script that writes replies, and a reply of JavaScript null being stringified into the file is the likely cause. Until it is fixed, every future review round will leave the same trace.

### Frontier finding, 2026-09-03

Kind: coverage.

Sixteen nodes still carry the reclassification's generic prose Facts line, 'authority ratified if the author confirms, or delegated where the author's words delegate it; boldness ...; persistence standing': agency, recording, evaluation, attention, legacy, persistence, review, validation-order, work-loop, aristotle-hexis, software-factories, spec-driven-development, plato-maieutics, plato-periagoge, aristotle-arche-of-action and pettit-non-domination. Two of them (agency, recording) still say 'boldness as the rationale shows'. Dialogue requires 'one class and one boldness value from the review stage on', and each of the sixteen now carries a well-formed frontmatter recommendation that the prose contradicts. The alignment page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier.

Also named: commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/recording.

Proposed: Dialogue is the survivor of the requirement. The sixteen prose Facts lines are rewritten to match each node's frontmatter recommendation, or deleted, since the recommendation field now carries the two facts and growth's presentation rule is satisfied by it plus each shim named in prose. Growth's presentation rule should say explicitly that the three facts are presented from the recommendation field and the node's shims, not from a prose line, so the duplication cannot recur.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `split-presentation-and-movements` (review, 2026-09-03); `define-sitting` (review, 2026-09-03); `cite-unanswered-for-responses` (review, 2026-09-03); `facts-from-recommendation-field` (review, 2026-09-03); `partial-ratification` (review, 2026-09-03); `facts-from-recommendation` (review, 2026-09-03, from commons.systems/disposition-graph/dialogue); `clauses-already-ratified` (review, 2026-09-03, from commons.systems/disposition-graph/authority); `cite-unanswered-for-page-responses` (review, 2026-09-03, from commons.systems/disposition-graph/unanswered); `strike-phantom-depends` (review, 2026-09-03, from commons.systems/disposition-graph/session-context); `cite-unanswered-for-the-responses` (review, 2026-09-03, from commons.systems/disposition-graph/recording); `facts-presented-from-the-recommendation-field` (review, 2026-09-03, from commons.systems/disposition-graph/recording); `cite-the-reading` (review, 2026-09-03, from commons.systems/disposition-graph/plato-periagoge).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: Every alignment, on a node id or on a disposition, runs both a periagogic and a maieutic phase, and the periagogic of a sitting on a disposition confirms the author understands the existing record before it is changed. 2026-09-03, new-question: Every recommended disposition is presented for review before it is recorded and states its authority, its boldness, and whether it is persistent or a transient form such as a shim, so the author knows what they are approving. 2026-09-03, own-question: The author's ruling 'Ratified on the rule. Ratified on the shim.', given in the dialogue on the two-stage rule and the alignment-skill shim.
Moved to other nodes as alternatives: `cite-unanswered-responses` on commons.systems/disposition-graph/recording; `clause-level-ratification` on commons.systems/disposition-graph/authority; `un-aligned-disposition-term` on commons.systems/disposition-graph/authority; `un-aligned-disposition-term` on commons.systems/disposition-graph/node; `strike-ledger-sunset-dependency` on commons.systems/disposition-graph/session-context.
The census unit's note: Growth has a standing answer and no recommended text, so it adopts standing. The five alternatives are what the reviews and the frontier findings left open for the author: the split the session twice declined and twice referred to the author, the definition of 'sitting', citing unanswered instead of restating the responses, sourcing the three facts from the recommendation field, and covering only what the author has not already ratified. The dangling-dependency and null-reply findings are resolved in the snapshot and are not carried. I classed the author's presentation-rule words a new question rather than growth's own, following the frontier finding that the author stated it as a disposition in its own right; growth answers it today, so this is the borderline call.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `cite-unanswered-for-responses` absorbs `cite-unanswered-for-page-responses`, `cite-unanswered-for-the-responses`; `facts-from-recommendation-field` absorbs `facts-from-recommendation`, `facts-presented-from-the-recommendation-field`; `partial-ratification` absorbs `clauses-already-ratified`. The merge unit's note: Twelve entries fall to seven. split-presentation-and-movements, define-sitting, strike-phantom-depends and cite-the-reading are each a different change and stay.

### Frontier finding, 2026-09-03

Kind: coverage.

Un-aligned-children's account carries a '### Facts' section stating 'Authority none: an un-aligned disposition in the author's words, recorded at their direction and carrying no answer', 'Persistence open, until the author rules', and, in the paragraph below it, 'The movement owed is periagogic and has not been run'. All three are contradicted by the node's own frontmatter, which carries `authority: class: deferred, by: claude, date: 2026-09-03`, a standing answer, `stage: review`, and `recommendation: adopts standing, class: ratified, boldness: low`. Because the alignment page renders the account beside the recommendation, the author is shown a node that says it carries no answer and owes a periagogic movement, on a page that puts it up for a ruling. This is the sharpest instance of the defect the coverage finding of 2026-09-03 records as the sixteen generic prose Facts lines: dialogue requires 'one class and one boldness value from the review stage on', and here the prose and the data disagree not about the class alone but about whether the node has an answer at all. The node carries no pending alternatives, so nothing on it records the finding.

Also named: commons.systems/disposition-graph/un-aligned-children, commons.systems/disposition-graph/dialogue.

Proposed: Dialogue is the survivor of the requirement and growth of the presentation rule; neither text need change for this node. Un-aligned-children's stale '### Facts' section is superseded by its own later '### Answered on the author's ruling, 2026-09-03' section and should be struck or marked superseded rather than left standing beside a contradicting frontmatter — the alternative below is the vehicle, since the review proposes and never edits. Growth's already-pending `facts-from-recommendation-field` alternative is what closes the class at its source, by saying the three facts are presented from the recommendation field and the node's shims and never from a prose line; taking it would make this and the sixteen other instances unrepresentable rather than fixed one by one.
### Frontier finding: this node defines boldness in the wrong direction, 2026-09-03

Kind: contradiction within the graph. Raised by the clean-context validation of
the aspects analysis, 2026-09-03, and independent of that ruling.

This node `defines` boldness, and its answer words it "its boldness, how much
of it rests on the record and the author's words against the AI's own
knowledge". The alignment skill repeats that direction. The `dialogue` node,
which carries the field, words it the other way, "how much of it rests on the
AI's own knowledge against the record and the author's words", and so does the
author, ruling on 2026-09-03: "I want to know how much rests on the AI's own
knowledge against the record."

The two are inverse scales, so a node stamped `boldness: high` means
well-grounded under this node's answer and least-grounded under `dialogue`'s.
Every boldness in the record was written under one reading or the other and
nothing says which. The usage across the graph follows `dialogue` and the
author, so the correction falls here: this node's definition sentence is
reversed, and the alignment skill's line with it.

Also named: commons.systems/disposition-graph/dialogue.

Proposed: reverse the direction in this node's answer to match `dialogue`, the
author's words, and the usage, and correct the skill's line in the same
landing. The alternative, reversing `dialogue` instead, is refused by the
author's ruling of 2026-09-03.

### The maieutic movement of the alignment-page sitting, 2026-09-04

This node is in the sitting's cascade three times over, and the recommendation
answers all three in one fence, because an edit reconciles the whole node and
not one sentence.

**Boldness.** The frontier finding above stands and the correction falls here,
as it said it would. The recommendation reverses this node's definition
sentence rather than the record's usage, on the author's own words of
2026-09-03 and on the fact that every boldness stamp in the graph was written
under the usage. The inverse repair is recorded as
`boldness-left-and-dialogue-corrected` so the author can see what taking the
other side would cost. This is the correction the alignment page's fold rule
was waiting on: that rule folds a decision away on low boldness, and under this
node's present definition it would fold away exactly what the AI is least sure
of.

**The page.** The alignment page now has a node that asks its question, and
this node's answer described the page in a sentence and its shim described it
more fully still. Both leave. What stays here is the loop: the author rules on
the page or in prose, and the session reads the responses back and resumes each
dialogue at its stage. `depends` records that this node's ruling waits on
`alignment-page`, because stripping the description before the page has an
answer would leave the record with none.

**Partial ratification.** The review's `partial-ratification` alternative asks
"whether a clause can carry a stamp separately from its node", and the ruling
on `dialogue`'s `aspects-are-nodes` answers it: no for a clause, yes for the
three reserved facts. A clause the author would rule on separately is a
question, and a question is a node; what is ruled separately within a node is
the authority class, the node's existence, and its persistence. `depends`
records the wait on that alternative.

The evidence for it is on this node, in the author's own practice. The ruling
of 2026-09-03 was two sentences, "Ratified on the rule. Ratified on the shim."
That is a ruling on the answer and a ruling on the persistence, given
separately, which is exactly the shape `aspects-are-nodes` reserves. The
author's decision-per-aspect disposition of 2026-09-03 and their ruling of
2026-09-03 on this node are the same shape seen from two sides, and the
sitting's earlier designs, which carved the answer's prose into aspects, were
reaching past what either of them asked for.

**Facts.** Adopts `boldness-reversed`. Authority ratified, since this node
defines the vocabulary the author rules with. Boldness low: the reversal rests
on `dialogue`'s wording, on the author's words, and on the usage across the
graph, the page's description leaves on `alignment-page`'s answer and on
`materialization`, and the timing clause is the author's own revision.
Persistence standing, with one shim kept and one moved.

Not reviewed. The clean-context review is owed on this and on the rest of the
batch.


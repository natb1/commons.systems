---
question: How does the graph grow?
stage: review
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-07
  of: 89f4bffabf8e00af74bee0c8b4f32b26581c9f1c
  against: "The amendment can be read as fully closing the survey's finding: the fence's third usage and rationale now agree with the queue sentence and with `alignment-order`'s recommended answer, so the substantive contradiction the survey named -- rank in one clause, ruling order in two others -- is gone, and the missing `status`/`reason` on the new option is a bookkeeping gap rather than a reopening of that contradiction; a reader could judge it non-blocking for forwarding to the author's ruling. But this record treats exactly this omission as a defect elsewhere on the very same fact -- six sibling options record their absorption with `status: passed` and a reason, and an earlier reading on this node raised the identical gap as a finding that was then fixed -- so leaving the one new option unmarked is the one inconsistency in a fence otherwise being presented to the author as internally settled."
  survey:
    date: 2026-09-07
    of: 99d667c6fd7d8d8d7fb61bd1a5289ac8bb458c66
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
        status: passed
        reason: "already applied: the recommended text cites `unanswered` for the responses and restates none of them"
      - name: facts-from-recommendation-field
        source: review
        ref: "2026-09-03"
      - name: partial-ratification
        source: review
        ref: "2026-09-03"
      - name: strike-phantom-depends
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "already applied: the two dependencies naming no node were struck on 2026-09-03 and `depends` no longer carries them"
      - name: cite-the-reading
        source: review
        ref: "2026-09-03"
      - name: queue-in-ruling-order
        source: author
        ref: "2026-09-03"
        status: passed
        reason: "absorbed by the recommendation, whose queue sentence takes `alignment-order`'s ruling order and drops the boost"
      - name: boldness-reversed
        source: review
        ref: "2026-09-03"
      - name: boldness-left-and-dialogue-corrected
        source: ai
        ref: "2026-09-04"
      - name: issue-trackers-as-the-loop
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "an issue tracker is a queue of work beside the record, and the queue here is the set of un-aligned dispositions in the graph itself"
      - name: tactics-as-the-loop
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "a standing tactic node is a unit of work given a home in the record, and what a sitting's units are is `decomposition`'s question and not a shape of the graph"
      - name: phases-as-the-loop
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "the movements of a sitting are the stages this answer names, derived from the dialogue's own conduct rather than from a fixed phase ladder a router advances"
      - name: the-router-and-its-gates
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "what a session takes up next is the ruling order `alignment-order` derives from the record, so a router selecting and admitting work is machinery for a decision the graph already makes"
      - name: born-parked-review
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "when the clean-context review runs and what it gates is `recording`'s answer, read off the node's stage, and a park released by a gate stores that state a second time"
      - name: placement-gates
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "a node's placement is `under` and is ruled with the node, so a gate admitting placement is an authority the record confers on no instrument"
      - name: the-curriculum
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "the order of the author's attention is derived from the record by `alignment-order`, and a curriculum kept beside it is the ledger the record asked to sunset"
      - name: the-skills-own-text-as-authority
        source: ai
        ref: "8938e2b7"
        status: passed
        reason: "every rule a session works under is a node or a declared shim, and a skill whose own text bound the record would be authority the author never conferred"
      - name: rejected-alternative-is-an-option
        source: commons.systems/disposition-graph/rejected
        ref: "2026-09-05"
        status: passed
        reason: "absorbed by the recommendation, whose steer clause now puts a steer on the fact beside the confirmed choice, as `rejected` says"
      - name: proposal-as-a-state-of-a-ratified-node
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"
        status: passed
        reason: "absorbed by the recommendation, whose persistence list now reads a proposal as `authority` defines it"
      - name: the-dialogue-is-grounding-intent-and-confirmation
        source: author
        ref: "2026-09-06"
        status: passed
        reason: "carried by `commons.systems/disposition-graph/turn-form`, where the three surfaces are the answer and not a clause of this one"
      - name: the-turn-takes-one-of-four-forms
        source: author
        ref: "2026-09-07"
        status: passed
        reason: "carried by `commons.systems/disposition-graph/turn-form`, where the four forms are the answer and not a clause of this one"
      - name: turn-form-to-a-child-and-terms-aligned
        source: ai
        ref: "2026-09-07"
      - name: turn-forms-as-its-own-node
        source: review
        ref: "2026-09-07"
        status: passed
        reason: "absorbed by the recommendation, which mints `commons.systems/disposition-graph/turn-form` and cites it"
      - name: the-fourth-form-carries-the-recording
        source: review
        ref: "2026-09-07"
        status: passed
        reason: "carried by `commons.systems/disposition-graph/turn-form`, whose fourth form says which rulings were recorded and that the node moved and why"
      - name: third-usage-in-the-ruling-order
        source: review
        ref: "2026-09-07"
        status: passed
        reason: "absorbed by the recommendation, whose third usage and rationale now carry it"

    recommends: turn-form-to-a-child-and-terms-aligned
    boldness: moderate
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
      - name: shim-reaches-what-the-skill-draws-on
    recommends: the page's shim moved out
    boldness: low
depends:
  - commons.systems/disposition-graph/alignment-page
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
  - commons.systems/disposition-graph/alignment-order
  - commons.systems/disposition-graph/turn-form
form: rule
boost: 4
under:
  - commons.systems/disposition-graph/model
cites:
  - id: commons.systems/disposition-graph/author-questions
    hash: ecb27431eafeb2630f72ee384cae4d62118de303
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

The author, 2026-09-04, while the wave-one readings were being applied, naming the sitting's final task and granting it:

> the final task for this sitting will be to reconcile the aligment/review/survey skills and alignment artifact against all reviewed (but not yet confirmed) recommendations in the graph. Do not liquidate existing functionality unless it is contradicted by recommended disposition. you have bootstrap authority for this.

The author, 2026-09-06, on what the alignment dialogue is for and what it is not for:

> Record the disposition that alignment dialogue must focus on establishing common grounding (peraigogic) and clarifying ambiguities is author intent (meiutic). use the alignment artifact for confirmation of disposition fact, and otherwise minimize noise about mechanical/encoding concerns.

The author, 2026-09-07, on the form a turn addressed to them takes, after the session closed a draft by reporting a measurement, a bookkeeping repair and a marking rule to them:

> To the point of the disposition recorded just priot, this kind of response includes a lot of "noise" and it's hard for the author to know what to do with this. Dialogue prompts for the author are expected to take the form of periagogic interview, meiutic interview, direct the author to the alignment artifact for confirmation, or a simple ackowledgement of confirmation. Reconciliation outputs may diverge from the alignment output disposition. Record and you have bootstrap authority to reconcile alignment dialogue/review/survey/artifact. Before beginning reconciliation list the AI recommendation dispositions that are queued for reconciliation.

The author, 2026-09-03, on dispositions stated mid-sitting, carried here from the rationale on 2026-09-07:

> we expect that alignment dialogues like this one (which is mixed in with ad-hoc reconciliation during bootstrap) will trigger recursive disposition statements from the author. This is supported usage of the alignment skill. The expected behavior of the skill is to queue each disposition (newly stated or via node_id) in some state that persists across alignment context compaction. Are these new un-aligned dispositions - dispositions that aren't just unratified/unreviewed, but haven't even survived the alignment dialog yet.

The author, 2026-09-03, later that day, on where unanswered nodes are listed, carried here from the rationale on 2026-09-07:

> Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact (previously called the review artifact). The alignment artifacts outputs are consumed by the greenfield/shimmed alignment skill.

## Answer

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put with its authority class, boldness, and alternatives; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the record and the author's words against the AI's own knowledge; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an alternative in a dialogue that dies at the ruling, a proposal when it arose outside alignment, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The alignment page lists every unanswered node in rank order, the purpose node first, each with its stage, the author's words, the node as it stands, the AI's account, and the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once, as the unanswered node says; the author rules there or in prose, and the session reads the responses back and resumes each dialogue at its stage. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author's words of 2026-09-03 on dispositions stated mid-sitting, and their words later that day on where unanswered nodes are listed, are under `## Disposition` and are argued from here: a disposition the author states in a sitting is queued as a node that survives compaction, which is why the queue is the set of such nodes and not a list beside the record; and the alignment page lists the unanswered nodes the browser hides, its outputs consumed by the shimmed alignment skill, which is why the page and not the browser is where a recommendation stands for confirmation. Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round (evidence: `bootstrap/align-survey.md` on the implementation ref).

## Facts

### answer

Recommended because three changes fall due on this node at once and one edit reconciles the whole of it. The rule that bounds what reaches the author leaves for `commons.systems/disposition-graph/turn-form`, on the author's words of 2026-09-07 that a persistent intent of theirs may require a node of its own and on `node`'s rule that a text answering two questions is two nodes; three terms are brought into line with the nodes that own them, a steer with `rejected`, a proposal with `authority`, and the queue's order with `alignment-order`; and nothing else in the text moves. Which clauses are whose: the loop of three moves, the three usages, the two conducts with their loci, the periagogic objects, the six movements of a sitting and the persistence list are the AI's drafting; the presentation rule with its three facts, the reversal of boldness, the queue of dispositions stated mid-sitting, and the timing of a recommendation are the author's words of 2026-09-03 and 2026-09-04; and the rule that used to sit between them, the author's words of 2026-09-06 and 2026-09-07, is what leaves. Boldness moderate, and not low: what a ruling here confirms is the whole fence, and this node's own account has already conceded of that text that "the movements are moderate boldness, not low", which stands whatever the boldness of the clause that moved. The author's ruling of 2026-09-03, "Ratified on the rule. Ratified on the shim.", covered two things and no more, the two-stage rule in both usages and the alignment-skill shim; no fact on this node carries a ruling, so the fresh ruling asked for here covers the whole answer, and `partial-ratification` stays on the list as the option under which the author is asked only for the rest.

#### split-presentation-and-movements

Growth's answer is one paragraph answering at least seven separable questions, against node's rule that a text answering two questions is two nodes. This alternative splits the three-fact presentation rule into a child node asking what a recommendation must state before it is recorded, carrying the three facts, the persistence list and the ban on transient dispositions, and splits the movements of a sitting into a child node carrying the periagogic and maieutic objects; growth survives as the loop of three moves and the three usages of the skill, citing both. The reviewer proposed it twice and the session declined twice, referring the split to the author. Recording, delegation, alignment-target and checkpoint are the precedent for a part of growth becoming a node of its own.

#### define-sitting

Growth adds 'sitting' to its defines and one sentence saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. The word names the record's central act and is used by growth, recording, dialogue, transience and alignment-target and in about twenty account headings, yet no node defines it, so it is the one word the browser cannot link. Nothing else in the answer changes. Also raised on commons.systems/disposition-graph/dialogue. Also raised on commons.systems/disposition-graph/recording.

#### cite-unanswered-for-responses

Growth stops restating the alignment page's three responses and cites the unanswered node, which defines them and which the page implements. Three response vocabularies are live for one act across unanswered, recording and growth, and every restatement is a place they can drift; the response-vocabulary contradiction finding makes unanswered the survivor, so one node defines what the author may answer and the page implements that one list. The rest of the answer is untouched. Raised on commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/recording. Passed over on 2026-09-07: the recommended text already does it, ending the sentence "what the three responses are is the unanswered node's" and restating none of them.

#### facts-from-recommendation-field

Growth's presentation rule says explicitly that the three facts are presented from the node's recommendation field and its declared shims, never from a prose line in the account. The coverage finding verified that sixteen nodes still carry a generic prose Facts line contradicting their own recommendation field, and the page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier. Growth's answer states the presentation rule without naming where the facts are read from; this closes the duplication at its source instead of node by node. Raised on commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/recording.

#### partial-ratification

The author already ruled 'Ratified on the rule. Ratified on the shim.' in a sitting, and growth still carries a deferred stamp and is offered for a fresh ruling on the whole node. This alternative has growth's account state which clauses the author already ratified, the two-stage rule in both usages and the alignment-skill shim, and the recommendation cover only the rest, so the author is not asked twice for a ruling they gave. Growth's own reply accepts this and defers it to its sitting, so the change is owed rather than made. It raises the question whether a clause can carry a stamp separately from its node, which belongs to authority. Raised on commons.systems/disposition-graph/authority.

#### strike-phantom-depends

The cross-reference finding carried on session-context proposes that growth's two dependencies naming no node — review-context and review-artifact — be struck as superseded in substance by clean-context-review and growth's own alignment-page shim, or minted as un-aligned dispositions, since a question that lives only on a page is the ledger the record asked to sunset. (Raised on commons.systems/disposition-graph/session-context.) Passed over on 2026-09-07: both were struck on 2026-09-03 and `depends` has not named either since.

#### cite-the-reading

Growth's answer drops its own Republic citation for the periagogic movement and cites this reading instead, so the loci are stated in one place. The review of 2026-09-03 found the two citations disagreeing in extent, growth naming 518b to d while the reading names 518b to 518d plus 521c and 515c to 516a. (Raised on commons.systems/disposition-graph/plato-periagoge.)

#### queue-in-ruling-order

This node's queue, the set of unanswered nodes in rank order, and its list of what the alignment page carries, every unanswered node in rank order, are amended by the alignment-order draft to the ruling order, with rank as tie-break; the author's choice of what comes next remains `/align <node id>` and needs no boost. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there. Passed over on 2026-09-07: the recommendation takes it, the queue sentence now running in the ruling order with the author's naming of a node as their order.

#### boldness-reversed

This node's definition sentence is reversed, so that boldness is how much of a recommendation rests on the AI's own knowledge against the record and the author's words, which is how the dialogue node words it, how the author worded it on 2026-09-03, and how every boldness stamp in the record was written. Two consequences of rulings on other nodes ride with it in the fence, because this node was restating questions that are not its own: the description of the alignment page leaves, with the shim that names the artifact, for the node that asks the page's question; and the clause placing the recommendation at the intention movement is loosened to say that the recommendation is put to the author there while it may be recorded at any stage, which is the author's revision of 2026-09-04 recorded on the dialogue node. It is the base the recommendation builds on and is not itself recommended, since the recommendation adds the move to `turn-form` and the three terms brought into line.

#### boldness-left-and-dialogue-corrected

The inverse repair: this node's definition stands and the dialogue node, the alignment skill, and every boldness stamp in the record are corrected to match it. Against it: the author's own words give the direction, "I want to know how much rests on the AI's own knowledge against the record", so the correction would be against the author; and the stamps were written under the usage, so it would silently reverse the meaning of every one of them.

#### issue-trackers-as-the-loop

The loop runs on an issue tracker, as the incumbent alignment skill did. The
passage lists it among the incumbent's mechanics not kept and records no
reason; the evidence is `bootstrap/align-survey.md` on the implementation ref.

#### tactics-as-the-loop

The loop decomposes work into standing tactic nodes, as the incumbent
alignment skill did. The passage lists it among the incumbent's mechanics not
kept and records no reason.

#### phases-as-the-loop

The loop moves a node through fixed phases, as the incumbent alignment skill
did. The passage lists it among the incumbent's mechanics not kept and records
no reason.

#### the-router-and-its-gates

The incumbent's router and its gates select and admit the work of a sitting.
The passage lists them among the incumbent's mechanics not kept and records no
reason.

#### born-parked-review

A review is born parked and released by a gate, as the incumbent alignment
skill had it. The passage lists it among the incumbent's mechanics not kept
and records no reason.

#### placement-gates

A node's placement in the graph is admitted by a gate. The passage lists it
among the incumbent's mechanics not kept and records no reason.

#### the-curriculum

The order of the author's attention is a curriculum kept beside the record, as
the incumbent had it. The passage lists it among the incumbent's mechanics not
kept and records no reason.

#### the-skills-own-text-as-authority

The alignment skill's own text carries authority over the record. The passage
lists it among the incumbent's mechanics not kept and records no reason; every
rule a session works under is a node or a declared shim.

#### rejected-alternative-is-an-option

The standing answer's sentence "a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again." places a rejected alternative in the rationale, and under the rejected node's recommended text that is the wrong place: a rejected alternative is an option on the fact it answers, with its status and the reason it was not taken, and the rationale argues and may name it but does not hold it. Raised by the rejected node from its reading of 2026-09-05; the amendment is the one clause, and it acts on nothing until the author rules. Passed over on 2026-09-07: the recommendation makes that one-clause edit.

#### proposal-as-a-state-of-a-ratified-node

The standing answer and the recommended `boldness-reversed` both list what a recorded thing may be, and among them "a proposal when it arose outside alignment". The origin no longer defines the word: since the author's words of 2026-09-04 on the viable-options node, a proposal is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from. The list item becomes a proposal on a ratified node whose recommendation has moved, and the authority node is cited for the state. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05. Passed over on 2026-09-07: the recommendation makes that one-clause edit.


#### the-dialogue-is-grounding-intent-and-confirmation

Everything the recommended option says, with the author's words of 2026-09-06
fixing what each movement is for and what the dialogue may spend the author's
attention on. The periagogic movement establishes common grounding. The maieutic
movement clarifies ambiguities in the author's intent. The alignment artifact
takes the confirmation of a disposition's facts. Everything else the sitting does
— the readings and what they return, the instruments it runs, the mechanical and
encoding defects it finds and fixes — is the sitting's own and is not brought to
the author, and its appearance in a turn addressed to them is noise to be
minimised rather than thoroughness.

It names the three surfaces exhaustively, which is what makes it a rule and not a
preference: a thing the sitting wants to tell the author that is not grounding, is
not a question about their intent, and is not a fact for them to confirm has no
place to be said. The record already carries the two movements' conduct on this
node and the artifact's scope on `alignment-page`, as the option
`page-collects-only-the-confirmation`; what it does not carry is that the three
together bound what reaches the author at all, and that is what these words add.
`author-questions` carries the same rule from the other side, as
`the-sitting-stops-only-on-intent`: a sitting stops for the author only where
there is a question about their intent.

The evidence is the sitting it was said in, which reported a reading's verdict,
its findings and the byte cost of a brief to the author and asked them whether to
run the next one, none of which is grounding, intent, or a fact to confirm.

Passed over on 2026-09-07: the words are carried by
`commons.systems/disposition-graph/turn-form`, where the three surfaces are the
answer and not a clause of a node whose question is how the graph grows.

#### the-turn-takes-one-of-four-forms

Everything `the-dialogue-is-grounding-intent-and-confirmation` says, and through
it everything `boldness-reversed` says, with the author's words of 2026-09-07
giving the rule its form on the surface where it is kept or broken: the turn.
Every turn of the alignment dialogue addressed to the author takes one of four
forms and no fifth. A periagogic probe, which turns the author back to the record
for grounding. A maieutic probe, which asks what the author intends where the
record leaves it open. A direction to the alignment page, where a disposition's
facts stand for confirmation. Or a plain acknowledgement that a confirmation was
received. A session that has none of the four to give has nothing to stop for,
and proceeds; the readings, their findings, the instruments' state, the
measurements and the bookkeeping the sitting corrects are the sitting's own, and
a turn made of them leaves the author, in their words, not knowing what to do
with it.

The rule is scoped by the same words: it binds the alignment dialogue, and a
reconciliation session's report may diverge from it, since that report is not a
turn in the dialogue but the account of a landing. What form that report takes is
`work-loop`'s question and is not decided here.

This is the recommended option from 2026-09-07 and not merely the author's,
because the record's own test for the dialogue points the same way: the
periagogic conduct already holds the AI's account back until the author has
committed, and the maieutic conduct already asks one thing at a time; a turn that
is neither probe nor direction nor acknowledgement is the AI's account put
before the author's, which is the deviation this node's conduct was written to
prevent. `author-questions` carries the consequence for a probe, as
`the-sitting-stops-only-on-intent`, and `alignment-page` the artifact's scope,
as `page-collects-only-the-confirmation`; neither is amended by this option, and
the rule is stated once, here, where the two conducts are.

The evidence is the turn it answers, described in this node's account: a draft
closed by reporting to the author a measurement of their words across the
record, a repair of the parent's bookkeeping, and a marking rule applied at two
clauses, none of which asked them anything or directed them anywhere.

Passed over on 2026-09-07: the rule is carried by
`commons.systems/disposition-graph/turn-form`, which the reading of that day and
the author's words on `probe-or-node` both send it to, and where the two clauses
this option leaves open — what the fourth form contains, and what stands outside
the rule — are answered rather than deferred.

#### turn-form-to-a-child-and-terms-aligned

Everything `boldness-reversed` says, with the rule of 2026-09-07 moved to a node
of its own and three terms brought into line with the nodes that own them, and
nothing else changed. `commons.systems/disposition-graph/turn-form` is minted
under this node, asking what form a turn addressed to the author takes and
carrying the author's words of 2026-09-06 and 2026-09-07, the three surfaces, the
four forms, what the fourth form contains, and what stands outside the rule; this
node's answer says in one sentence that the question is that node's, and keeps the
loop, the three usages, the two conducts and their objects, and the movements of a
sitting. The three terms: a steer is recorded as a viable option not chosen, kept
on the fact beside the confirmed choice, as `rejected` says, rather than entering
the rationale; a proposal is the state of a ratified node whose recommendation has
moved from its confirmed choice, as `authority` says, rather than a thing defined
by where it arose; and the queue of un-aligned dispositions runs in the ruling
order, with the author's naming of a node as their order and no boost, as
`alignment-order` says. The presentation rule names the surface it happens on, the
alignment page where a disposition's facts stand for confirmation, so that the
presentation and the form of a turn name one surface and not two.

Recommended because each of the four changes is owed to a node other than this
one and none of them is this node's to decide: three are the record's own
vocabulary catching up with rulings recommended elsewhere, and the fourth is where
a rule lives. Against it, it asks the author to rule on a fence in which the one
clause they spoke to most recently is absent, having moved to a child they must
then rule separately; the answer is that the child is on the frontier beside this
node and the author rules both, which is what `node`'s rule costs wherever it is
kept.

#### turn-forms-as-its-own-node

The rule that every turn addressed to the author takes one of four forms leaves
this node for a node of its own beneath it, asking what form a turn addressed to
the author takes and carrying the author's words of 2026-09-06 and 2026-09-07, the
four forms, and the exemption for what reconciliation outputs; growth keeps the
loop, the usages and the two conducts and cites it, and `author-questions`'
`the-sitting-stops-only-on-intent` and `alignment-page`'s
`page-collects-only-the-confirmation` cite it rather than each carrying half of one
rule. Raised by the clean-context reading of 2026-09-07. Passed over the same day:
the recommendation is this option with the three vocabulary edits beside it, and
mints the node.

#### the-fourth-form-carries-the-recording

The acknowledgement of a confirmation carries what the recording node requires the
session to say in the same turn, which rulings were recorded and, where the
response moved the node's stage, that it moved and why; and what a reconciliation
session outputs, including a listing the author has asked for before reconciliation
begins, is outside the rule and not only the account of a landing. Raised by the
clean-context reading of 2026-09-07. Passed over the same day: both clauses are
carried by `commons.systems/disposition-graph/turn-form`, whose answer names what
the fourth form contains and what stands outside the rule.

#### third-usage-in-the-ruling-order

Everything the recommendation says, with the third usage and the rationale brought into line with the queue sentence: given nothing, the skill takes the first node of the ruling order, as alignment-order says, and the rationale drops "The author's choice of what to propose next is itself a ranking act, recorded as boost" for the answer's own clause that the author's naming of a node is their order and needs no boost. It is on the table because the fence as it stands names rank in one clause and the ruling order in another for one and the same set of unanswered nodes, and a confirmation would ratify both. Adopted into the recommendation on 2026-09-07: the fence's third usage and its rationale now carry it.

### authority

Ratified, on the capture-shaped limb of `commons.systems/disposition-graph/class-recommendation`'s test. This node defines the vocabulary the author rules with — propose, project, ratify, steer, periagogic, maieutic, boldness — and states the conduct of the interview in which the author checks the AI; the party that would set that conduct is the party the conduct exists to check, which is the limb. The other two are not met on this recommendation's own object: the move of a rule to a child node and the alignment of three terms cost a landing to undo and undo cleanly. Boldness low on the class: it follows the stated test, and the author's ruling of 2026-09-03 on this node's rule shows they mean to be asked.

### persistence

The recommendation drops one of this node's two shims: the alignment page, which moves to `commons.systems/disposition-graph/alignment-page` with its declaration date and its liquidation condition intact. The skill shim stays, because this node is still what the alignment skill projects. Confirming it leaves one shim here; denying it leaves the page described in two places, which is what minting the page's own node was for. The two nodes rule together, and `alignment-page` carries the matching decision.

#### both shims kept

This node keeps both shims, the alignment skill's and the alignment page's, and the page stays described here, on a node whose question is growth and not the page; `alignment-page` then carries a matching declaration or none.

#### the page's shim moved out

This node keeps the skill's shim alone, and the page's declaration moves to `commons.systems/disposition-graph/alignment-page` with its date and its liquidation condition intact, so that the page is described where its question is asked and this node declares only what it projects.

#### shim-reaches-what-the-skill-draws-on

The skill's shim keeps its artifact and its liquidation and widens its `for`
clause from "the projection of this node and its siblings as the alignment
skill" to the projection of this node and the nodes the alignment skill draws
on. It is raised because two nodes lean on this shim from outside its stated
scope: `decomposition`, which is this node's grandchild and whose recommended
text says it "is materialized by the alignment skill's list of a sitting's
units, under the shim the growth node declares on that skill", and
`review-model`, which sits under `clean-context-review` and whose answer the
same skill carries. Either the shim reaches them or each declares its own, and
the choice is this node's because the shim is this node's. Raised by the second
clean-context reading of `decomposition` on 2026-09-05, which found the gap at
its locus and proposed the widening.

## Recommendation

```markdown
---
question: How does the graph grow?
form: rule
boost: 4
under:
  - commons.systems/disposition-graph/model
cites:
  - id: commons.systems/disposition-graph/author-questions
    hash: e2791b5e23289f90a0e75b26c0227bf94dba5858
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

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer is recorded as a viable option not chosen, kept on the fact beside the confirmed choice as the rejected node says, or as an amendment, before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes the first node of the ruling order, as the alignment-order node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. What form a turn addressed to the author takes, and what the dialogue may spend the author's attention on, is the question of the node beneath this one, turn-form. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put to the author with its authority class, boldness, and alternatives, though the recommendation may be recorded on the node at any stage of the dialogue, as the dialogue node says; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented on the alignment page, where its facts stand for confirmation, before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the AI's own knowledge against the record and the author's words; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an option in a dialogue that dies at the ruling, a proposal on a ratified node whose recommendation has moved from its confirmed choice, as the authority node defines it, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, taken in the ruling order as the alignment-order node says and surviving every session, and the author's naming of a node is their order and needs no boost. The author rules on the alignment page or in prose, and the session reads the responses back and resumes each dialogue at its stage; what that page shows and in what order is the alignment-page node's question, and what the three responses are is the unanswered node's. Legacy nodes are cited as evidence when a question needs them and never imported.

## Rationale

The loop is the alignment interview made incremental: one page, one ruling. The author's naming of a node is their order and needs no boost, as the answer says, and the ruling order is the alignment-order node's. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author's words of 2026-09-03 on dispositions stated mid-sitting, and their words later that day on where unanswered nodes are listed, are under `## Disposition` and are argued from here: a disposition the author states in a sitting is queued as a node that survives compaction, which is why the queue is the set of such nodes and not a list beside the record; and the alignment page lists the unanswered nodes the browser hides, its outputs consumed by the shimmed alignment skill, which is why the page and not the browser is where a recommendation stands for confirmation. Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round (evidence: `bootstrap/align-survey.md` on the implementation ref). Two amendments of 2026-09-04, from the sitting on the alignment page: the definition of boldness is reversed, because the dialogue node, the author's own words of 2026-09-03, and every stamp in the record run the other way and this node's sentence was the outlier; and the description of the alignment page leaves this node for the node that asks the page's question, taking with it the shim that names the artifact, because a page described in two places is ratified in two places, which is what minting that node was for. An amendment of 2026-09-07, from the author's words of 2026-09-06 and 2026-09-07 in the sitting on the alignment page's children: the rule that bounds what reaches the author, the three surfaces and the four forms a turn addressed to them may take, is not carried here but on turn-form, the node beneath this one, because a rule that governs every turn of every sitting is its own question and the author's words of 2026-09-07 send a persistent intent of theirs to a node to be reconciled into the skill; this node keeps the loop, the three usages and the two conducts, and cites that node for the form of a turn. Three terms are brought into line with the nodes that own them in the same landing: a steer is an option on the fact and not a rejected alternative in the rationale, as rejected says; a proposal is the state of a ratified node whose recommendation has moved, as authority says; and the queue runs in the ruling order with the author's naming of a node as their order, as alignment-order says.
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


### The term "probe" given a definition, 2026-09-04

This node's periagogic conduct is where "probe" entered the record — one probe
per turn, in prose, from the page and not from memory — and it defines nine
terms without defining that one. Fourteen nodes now use the word in the same
sense and none defines it. The `author-questions` sitting of 2026-09-04 mints
the definition on its own node, whose answer constitutes the thing, and its
answer requires the citation added here so that every node using the word has a
path to the node defining it, which the eleventh frontier validation requires
and which the definition's placement does not by itself supply. The citation is
pinned to that node's text as it stood at this commit, and nothing moves it: a
pin is re-taken by hand at a landing that re-takes it, so a pin left alone goes
stale as the cited node's dialogue proceeds, and whether a `cites` hash should
track or freeze is `under`'s open option `cites-hash-tracks-or-freezes`. Defining the term here
instead was considered and not recorded as an option: it would put the
constitution of the instrument on a node whose question is how the graph grows,
and `defines` is a field rather than a fact, so a placement disagreement is a
finding for the survey and not a ruling for the author.

### Option from the rejected node, 2026-09-05

The option `rejected-alternative-is-an-option` is recorded on the answer fact, sourced to the rejected node, whose reading of 2026-09-05 found this node's standing answer placing a rejected alternative in the rationale. The recommendation here does not move.

### Frontier finding, 2026-09-05

Kind: redundancy.

Two vocabulary questions are each pending as an unruled option on four separate nodes, and each is already answered in the standing text of a node in the judged set. `rejected-alternative-is-an-option` stands as an option on `growth`, `legacy`, `projection` and `transience`; `commons.systems/disposition-graph/rejected`'s `## Answer` already says "A rejected alternative is a viable option not chosen" and, in as many words, "An option is not a page: an answer that was not taken has no standing and earns no node of its own." `proposal-as-a-state-of-a-ratified-node` stands as an option on `growth`, `node`, `frontier-consistency` and `transience`; `commons.systems/disposition-graph/authority`'s `## Answer` already says "A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice." So eight options on six nodes ask the author to settle two things the record has settled, and they will be ruled one at a time on nodes whose questions are about something else. The reading of 2026-09-05 raised the second of these on `frontier-consistency` alone; what the survey adds is that it pends on three further nodes and that the settling text already stands. The record has a working precedent for the remedy: `commons.systems/disposition-graph/instruments` carries `one-ruling-for-the-word` (disposition/disposition-graph/instruments.md line 113) for the instrument-or-criterion question, and its enumeration is accurate — "the author is otherwise asked the same vocabulary question five times on five pages". Neither of these two families has such an option.

Also named: commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/node, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/instruments.

Proposed: Strike the eight options and replace each with a citation. `commons.systems/disposition-graph/rejected` is the survivor for what a rejected alternative is, and `commons.systems/disposition-graph/authority` is the survivor for what a proposal is; each of the six bearer nodes cites the survivor's sentence where it currently carries the option. Where a bearer node believes its option means something the survivor's answer does not cover, that difference is the option, stated as the difference, and everything the survivor already says comes out. If the author would rather rule the two words once explicitly, mint the settling option on the survivor in the shape `instruments`' `one-ruling-for-the-word` takes, without a count in its prose.

### The form of a turn, 2026-09-07

The session closed the draft of `authors-words-on-the-page` with a turn that
reported to the author a measurement of their words across the record, the
repair of the parent's bookkeeping, and a marking rule applied at two clauses.
The author's words of 2026-09-07, under `## Disposition`, name that turn as noise
and give the four forms a turn may take. The words are recorded as the option
`the-turn-takes-one-of-four-forms`, the recommendation moves to it, and the
recommended text gains the rule in one place, after the sentence on the
periagogic stage. The node is at the maieutic stage; the reading of the
recommendation as it now stands is owed, and the reconciliation of the alignment
skill to it runs under the author's grant of the same words, "you have bootstrap
authority to reconcile alignment dialogue/review/survey/artifact", given for
this sitting and for nothing else.

### Clean-context review, 2026-09-07, of d3e9fa8a

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `the-turn-takes-one-of-four-forms`.

Findings:

- Answer (fence), the new rule, against the author's words of 2026-09-07 under '## Disposition': the author wrote 'Dialogue prompts for the author are expected to take the form of periagogic interview, meiutic interview, direct the author to the alignment artifact for confirmation, or a simple ackowledgement of confirmation', and the draft writes 'every turn of the alignment dialogue addressed to the author takes one of four forms and no fifth'. The hardening from 'expected to' to 'no fifth' is the AI's, and the same message closes with an instruction the hardened rule forbids: 'Before beginning reconciliation list the AI recommendation dispositions that are queued for reconciliation.' That listing is given in the dialogue before reconciliation begins, so the draft's own exemption does not reach it: the option's prose scopes it as 'a reconciliation session's report ... not a turn in the dialogue but the account of a landing', and a listing made before any landing is not that. Suggested edit: widen the exemption to what the author's words actually exempt, 'and what a reconciliation session outputs, including a listing or report the author has asked for, may diverge from it', or add one clause: 'a turn the author has expressly asked for takes the form they asked for.'
- Answer (fence), the fourth form, against the recording node's recommended text: the draft says a turn may be 'a plain acknowledgement of a confirmation; a session that has none of the four to give has nothing to stop for and proceeds', while recording's recommended option `per-fact-after-two-readings` requires that the session 'tells the author in the turn it makes the move that the node has moved and why, since a movement the author did not ask for spends a sitting they did not budget'. A notice that a response moved the node back to the maieutic stage, and why, is none of the four unless 'a plain acknowledgement' may carry it, and 'plain' says it may not. An executor holding both rules cannot obey both. Suggested edit: name the content in the fourth form — 'a plain acknowledgement of a confirmation, which says which rulings were recorded and, where the response moved the node, that it moved and why, as the recording node requires' — or record the divergence as the author's.
- Answer (fence), two clauses the draft keeps that are themselves turns of a fifth form: 'Every recommendation to record is presented for review before it is recorded, and states three things: the authority class ... its boldness ... and its persistence', and 'What the author directs to be recorded is reported with the same three facts.' Read with the new rule, presenting a recommendation with its three facts to the author, and reporting back what they directed to be recorded, are turns that are neither probe, nor direction to the page, nor acknowledgement of a confirmation. Suggested edit: say where the presentation happens, which the author's words of 2026-09-06 and the alignment-page node's `page-collects-only-the-confirmation` already fix — 'presented for review on the alignment page, where the facts stand for confirmation' — so the presentation rule and the four-forms rule name one surface instead of two.
- Validation 15, merge: the four-forms rule is a new question carried on this node's dialogue, not a new answer to a question the record already asks. No node in the index of questions asks what form a turn addressed to the author takes; the nearest two carry the same rule from one side each and are named by the option itself — `commons.systems/disposition-graph/author-questions` ('What probes for the author does a node carry, and where are they asked?') as `the-sitting-stops-only-on-intent`, and `commons.systems/disposition-graph/alignment-page` ('What does the author read to rule?') as `page-collects-only-the-confirmation`. The remedy validation 15 prescribes is a node of its own: under `growth`, asking 'What form does a turn addressed to the author take?', carrying the author's words of 2026-09-06 and 2026-09-07, the four forms, the exemption for what reconciliation outputs, and what the fourth form contains; growth keeps the two conducts and the loop and cites it, and the two options above cite it rather than each holding half the rule. This reading proposes and does not mint; the session records it and the author rules.
- '## Facts', `### answer` and `### authority`: neither records the reason for what it recommends. `### answer` opens directly on '#### split-presentation-and-movements' (disposition/disposition-graph/growth.md line 197), and `### authority` carries no prose either, while the dialogue node's standing answer says '`## Facts` holds one subsection per fact, in the same order, opening with the reason for its recommendation'. The answer fact is the one moved on 2026-09-07, and the reason for the move exists on the node — the account section 'The form of a turn, 2026-09-07' — but not where the fact holds it. Suggested edit: write the two opening paragraphs, the answer fact's being the account's own reasoning in one paragraph. I do not report the missing `### authority` reading of the three limbs: `class-recommendation`'s answer expressly makes that back-fill a reconciliation item on that node 'and not a defect the reviewer reports on each of them'.
- '## Facts', answer fact, boldness: the fact recommends `the-turn-takes-one-of-four-forms` at boldness low, and that option is defined as 'Everything `the-dialogue-is-grounding-intent-and-confirmation` says, and through it everything `boldness-reversed` says' — so a ruling for it rules the whole fence, including the six movements of a sitting and the two periagogic objects. This node's own account records the earlier concession on exactly that text: 'the movements are moderate boldness, not low'. Low is right for the 2026-09-07 clause, which is nearly the author's words, and wrong for what rides with it. Suggested edit: moderate, or keep low and say in the fact's reason which clauses are the author's words and which are the AI's drafting.
- Recommendation fence, frontmatter `cites`: the pin `ecb27431eafeb2630f72ee384cae4d62118de303` on `commons.systems/disposition-graph/author-questions` is stale. `git hash-object disposition/disposition-graph/author-questions.md` gives `e2791b5e23289f90a0e75b26c0227bf94dba5858`; `git cat-file -p ecb27431...` returns that node as it stood on 2026-09-04. This falsifies the node's own claim about the record, in the account section 'The term "probe" given a definition, 2026-09-04': 'The citation is pinned to that node's text as it stood at this commit, and that node is unanswered, so the pin will move as its dialogue does.' It has not moved while that node's dialogue has. Nothing enforces either behaviour — the reader checks only that the value is a 40-character blob sha, and whether a cites hash tracks or freezes is `under`'s open option `cites-hash-tracks-or-freezes`. Suggested edit: re-take the pin at this landing, and amend that account sentence to say what the pin does rather than what it does not.
- '## Facts', answer fact, option `the-turn-takes-one-of-four-forms`, last paragraph: 'The evidence is the turn it answers, quoted in this node's account'. The account does not quote it: the section 'The form of a turn, 2026-09-07' describes it — 'The session closed the draft of `authors-words-on-the-page` with a turn that reported to the author a measurement of their words across the record, the repair of the parent's bookkeeping, and a marking rule applied at two clauses.' A claim that evidence is quoted, where it is paraphrased, is a claim a later reader cannot check. Suggested edit: quote the turn in the account, or write 'described in this node's account'.
- '## Facts', answer fact, viability: two options are spent and should carry `passed` with the one clause saying why, as the viable-options node requires, instead of standing as live alternatives the author is asked to rule on. `strike-phantom-depends` proposes striking 'growth's two dependencies naming no node — review-context and review-artifact'; the node's `depends` is now `commons.systems/disposition-graph/alignment-page` and `commons.systems/disposition-graph/dialogue#aspects-are-nodes`, and the account's reply of 2026-09-03 already records 'the two dependencies on nodes that do not exist are struck'. `cite-unanswered-for-responses` proposes that 'Growth stops restating the alignment page's three responses and cites the unanswered node'; the fence already does it — 'what the three responses are is the unanswered node's'. Suggested edit: mark both passed, with 'already applied' and 'absorbed by the recommendation' as the reasons.
- '## Facts', answer fact, the eight options sourced `ai, ref 8938e2b7` (`issue-trackers-as-the-loop`, `tactics-as-the-loop`, `phases-as-the-loop`, `the-router-and-its-gates`, `born-parked-review`, `placement-gates`, `the-curriculum`, `the-skills-own-text-as-authority`): each carries `status: passed` with, in place of a reason, the sentence 'no reason recorded in the rationale'. The viable-options node requires that a candidate the AI holds dominated 'carries the status passed with the one clause saying why'; a note that no reason exists is not that clause, and eight of the answer fact's twenty-three options are in that state. Suggested edit: write the clause for each — they are the incumbent skill's mechanics, dominated because work here is derived from the graph and every rule a session works under is a node or a declared shim — or, where the AI cannot say why, lift the status and let them stand as viable, which the same node permits it to do on its own authority.
- Answer (fence), persistence list, two clauses the record's own definitional nodes contradict, each with its fix already on the option list and neither taken while the recommendation was being moved. 'a proposal when it arose outside alignment' against `authority`'s standing answer: 'A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from' — the option `proposal-as-a-state-of-a-ratified-node` sits unadopted beside it. 'a steer enters the node's rationale as a rejected alternative or an amendment' against `rejected`'s standing answer: 'As viable options not chosen, kept on the fact beside the confirmed choice' — the option `rejected-alternative-is-an-option` sits unadopted beside it. Both are one-clause edits. In the same list, 'an alternative in a dialogue that dies at the ruling' uses the word the re-encoding of 2026-09-03 replaced with `option`.
- Answer (fence), the queue sentence, and `depends`: the draft keeps 'the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost', which `commons.systems/disposition-graph/alignment-order`'s recommended answer contradicts twice — 'The ruling order, derived from the tangle the record carries, and not rank' and '`/align <node id>` is the author's order and needs no boost'. The option `queue-in-ruling-order` records this, and `depends` does not name that node. Suggested edit: add `commons.systems/disposition-graph/alignment-order` to `depends`; and, since the four-forms rule is the same rule as `commons.systems/disposition-graph/author-questions#the-sitting-stops-only-on-intent` and `commons.systems/disposition-graph/alignment-page#page-collects-only-the-confirmation`, add those two entries as well, so that one rule is not ruled in three places in whatever order the three nodes happen to reach the author.
- '## Rationale' (and the fence's rationale): two dated passages of the author's are quoted there and appear nowhere under '## Disposition' — 'we expect that alignment dialogues like this one (which is mixed in with ad-hoc reconciliation during bootstrap) will trigger recursive disposition statements from the author ...' and 'Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact (previously called the review artifact). The alignment artifacts outputs are consumed by the greenfield/shimmed alignment skill.' Verified: `grep -n '^## ' disposition/disposition-graph/growth.md` puts '## Disposition' at line 144 and '## Answer' at 187, and both passages occur only at lines 193 and 417, inside the two rationales. The dialogue node puts the author's words in '## Disposition', 'verbatim and dated, accumulating through the dialogue', which is also where the projections read them from. Suggested edit: carry both under '## Disposition' with their dates, leaving the rationale to argue from them.
- The ruling the author gave and the facts do not carry. '## Disposition' holds 'The author, 2026-09-03: > Ratified on the rule. Ratified on the shim.', and this node's account of 2026-09-04 reads those two sentences as 'a ruling on the answer and a ruling on the persistence, given separately, which is exactly the shape `aspects-are-nodes` reserves'. No fact on this node carries a ruling, so the node's class is unanswered and the draft goes to the author as a first ruling on the whole node. The option `partial-ratification` is the vehicle and is still pending, and the earlier reading's finding — 'the author should not be asked twice for a ruling they gave' — was deferred to this node's sitting, which is the one now in hand. Suggested edit: have the recommendation say which clauses those words already covered and what the fresh ruling adds, or record the two rulings on the option that stands and on the persistence option with `of` pinned to the 2026-09-03 text, which makes the node what it in fact is, a node whose recommendation has moved since the words that ruled it.

On the facts and what they recommend: The answer fact recommends `the-turn-takes-one-of-four-forms` over the standing option and a `## Recommendation` fence is present, which is right, but neither the answer fact nor the authority fact records the reason `dialogue` requires the subsection to open with, and boldness `low` is right for the 2026-09-07 clause and wrong for the six movements and two periagogic objects that ride with it, which this node's own account conceded are moderate. `ratified` is the class the session means to present and is right on `class-recommendation`'s capture-shaped limb, a rule bounding what the AI may say to the author being set by the party it checks; the missing `### authority` reading is not reported, that node's answer exempting the back-fill. Persistence, `the page's shim moved out`, matches the fence, which declares only `.claude/skills/align/SKILL.md` (verified present, 67584 bytes) with a liquidation condition; the fence's `cites` pin on `author-questions` is stale against that file's current blob.

On the viability of the options: The authority and persistence facts are complete and every option on them is viable; on the answer fact two are spent (`strike-phantom-depends`, whose dependencies are already struck, and `cite-unanswered-for-responses`, which the fence already does) and eight carry `passed` with no reason at all, both of which the findings above name. Two viable options are missing and the author will not otherwise get to rule on them. `turn-forms-as-its-own-node`: 'The rule that every turn addressed to the author takes one of four forms leaves this node for a node of its own beneath it, asking what form a turn addressed to the author takes and carrying the author's words of 2026-09-06 and 2026-09-07, the four forms, and the exemption for what reconciliation outputs; growth keeps the loop, the usages and the two conducts and cites it, and `author-questions`' `the-sitting-stops-only-on-intent` and `alignment-page`'s `page-collects-only-the-confirmation` cite it rather than each carrying half of one rule.' And `the-fourth-form-carries-the-recording`: 'The acknowledgement of a confirmation carries what the recording node requires the session to say in the same turn, which rulings were recorded and, where the response moved the node's stage, that it moved and why; and what a reconciliation session outputs, including a listing the author has asked for before reconciliation begins, is outside the rule and not only the account of a landing.'

Strongest counter-argument (strong): The draft's own paragraph is the case against it. Growth's answer already answers, in one paragraph, the loop of three moves, the three usages, the two conducts with their Plato loci, the two periagogic objects, the six movements, the presentation rule with its three facts, the persistence list, the ban on transient dispositions, and the un-aligned queue; the 2026-09-07 amendment adds one more, and one that binds harder than any of them, since it governs every turn of every sitting and admits no fifth. Two clean-context readings of this node have already found that answer to break the rule it sits under — `node`: 'If a text answers two questions, it is two nodes' — and the session declined the split twice and referred it to the author, while the record has since done the opposite on a comparable node, minting nine children under `alignment-page` on 2026-09-05 for exactly this reason. The consequence is not formal: with one answer fact and one kick-back row, the author cannot confirm the four forms without ratifying nine other rules they were never asked about separately, and cannot refuse any one of them except by kicking the whole node back to the maieutic stage. And of all the clauses in the paragraph this is the one it is most costly to fold in unexamined, because it is the clause that decides what the author is allowed to be told.

The session's reply: Accepted on the merge finding and the counter-argument, which point the same way and are what this recording acts on: the four-forms rule is a new question, and with one answer fact the author could neither confirm it alone nor refuse it alone. The author's words of 2026-09-07 on probe-or-node decide it, so turn-form is minted beneath this node carrying the author's words of 2026-09-06 and 2026-09-07, the three surfaces, the four forms, what the fourth form contains, which is the recording node's notice of which rulings were recorded and that the node moved, and what stands outside the rule, a reconciliation session's output and a listing the author asked for. The recommendation moves to an option that makes that move and brings three terms into line with the nodes that own them: a steer is an option on the fact, a proposal is the state of a ratified node whose recommendation has moved, and the queue runs in the ruling order, with alignment-order and turn-form named in depends. The presentation rule names its surface, the alignment page. The two ### subsections open with the reason for what they recommend; boldness on the answer fact moves to moderate, since what a ruling confirms is the whole fence; the cites pin is re-taken in the recommended text, ecb27431 to e2791b5e, and the account sentence that said the pin would move is corrected; the two spent options are passed with the clause saying why; the eight options from the incumbent's mechanics get a reason each; the two dated passages of the author's move under ## Disposition and the rationale argues from them; the account says what the ruling of 2026-09-03 covered, the two-stage rule and the skill shim, so the fresh ruling asked for is visibly the rest. Not taken on this recording: the further splits the reading proposes stay viable and unadopted, each being the author's to rule. The recommendation has moved in substance and its reading is owed.

### The reading of 2026-09-07 applied, and the turn rule moved to a child

The clean-context reading of the draft of 2026-09-07 forwarded it with a strong
counter-argument and fourteen findings. Its merge finding and its
counter-argument point the same way and are what this recording acts on: the
four-forms rule "is a new question carried on this node's dialogue, not a new
answer to a question the record already asks", and with one answer fact the
author could not confirm it without ratifying nine other rules they were never
asked about separately, nor refuse it except by kicking the whole node back. The
author's words of 2026-09-07 on `probe-or-node` decide it — "If author's intent
is a peristent disposition, then it may require a new node to be reconciled into
the alignment skill" — so `commons.systems/disposition-graph/turn-form` is minted
under this node, carrying the author's words of 2026-09-06 and 2026-09-07, the
three surfaces, the four forms, what the fourth form contains, and what stands
outside the rule. The options `the-dialogue-is-grounding-intent-and-confirmation`
and `the-turn-takes-one-of-four-forms` are passed over here as carried there, and
the reading's two proposed options, `turn-forms-as-its-own-node` and
`the-fourth-form-carries-the-recording`, are recorded and passed over the same
way, so the author can see what was proposed and where it went.

What else the reading found and this recording applies. Three terms are brought
into line with the nodes that own them: a steer is an option on the fact, as
`rejected` says; a proposal is the state of a ratified node whose recommendation
has moved, as `authority` says; and the queue runs in the ruling order with the
author's naming of a node as their order, as `alignment-order` says, which is now
named in `depends` beside `turn-form`. The presentation rule names its surface,
the alignment page where a disposition's facts stand for confirmation. Five
options are passed over as spent or absorbed and eight more, the incumbent
skill's mechanics, get the one clause the viable-options node requires in place
of the note that the rationale recorded no reason; the clause is the same
judgment in each case, that every rule a session works under is a node or a
declared shim and the work is derived from the graph, made specific to what each
option would have kept. The `## Facts` subsections for the answer and the
authority facts now open with the reason for the recommendation, which `dialogue`
requires and neither carried. Two dated passages of the author's that were quoted
only in the rationale are carried under `## Disposition`, and the rationale argues
from them. The fence's `cites` pin on `author-questions` is re-taken by hand,
`ecb27431` to `e2791b5e`, and the account sentence that said the pin would move
with the cited node's dialogue is corrected to say that nothing moves a pin.

Boldness on the answer fact moves from low to moderate. Low was right for the
clause of 2026-09-07 and wrong for what a ruling on this fence confirms with it,
as this node's own account conceded in 2026-09-03 of the same text: "the
movements are moderate boldness, not low". The `### answer` reason now says which
clauses are the author's words and which are the AI's drafting, and says what the
author's ruling of 2026-09-03 covered, the two-stage rule and the skill shim, so
that the fresh ruling asked for is visibly the rest; `partial-ratification` stays
on the list as the option under which the author is asked for the rest alone.

Not applied, and why. `split-presentation-and-movements`, `define-sitting`,
`facts-from-recommendation-field`, `partial-ratification` and `cite-the-reading`
stay viable and unadopted: each is a change the author rules on, and this
recording moves the one rule the author's words of 2026-09-07 send to a node and
does not take the further splits on its own. The node's own `cites` pin is left as
it stands, the re-taking being part of the recommended text.

The reading of the recommendation as it now stands is owed, the recommendation
having moved in substance since the reading of 2026-09-07, and the sitting on
`turn-form` owes its own.

### Clean-context re-reading, 2026-09-07, of 99d667c6

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `turn-form-to-a-child-and-terms-aligned`.

Findings:


On the facts and what they recommend: All fourteen findings of the 2026-09-07 reading are answered. The four-forms rule (findings 1-4) leaves the node entirely: `commons.systems/disposition-graph/turn-form` is minted and cited (added to `depends`), the answer fact's `recommends` moves from `the-turn-takes-one-of-four-forms` to `turn-form-to-a-child-and-terms-aligned`, boldness low to moderate (finding 6), and both prior options are marked `passed`/absorbed alongside the two new options the reading itself proposed (`turn-forms-as-its-own-node`, `the-fourth-form-carries-the-recording`), so none silently left the list. `### answer` and `### authority` now open with their recommendation reasons (finding 5). The `cites` pin on `author-questions` is re-taken to `e2791b5e...` (verified by `git hash-object`, matching the working tree) and the account sentence claiming the pin tracks is corrected to say a pin is re-taken by hand (finding 7). "quoted" is corrected to "described" (finding 8). `strike-phantom-depends` and `cite-unanswered-for-responses` are marked `passed` with reasons (finding 9); the eight `ai, ref 8938e2b7` options each gain a substantive reason in place of "no reason recorded" (finding 10). The persistence-list clauses on `proposal` and `steer` are corrected to match `authority` and `rejected` (finding 11), and the presentation rule now names the alignment page as its surface (finding 3). Two dated author quotes move under `## Disposition` (finding 13). The ruling account now states what the 2026-09-03 ruling covered and that the fresh ruling is for the rest, with `partial-ratification` kept pending (finding 14).

On the viability of the options: Every option on all three facts stays viable and none was silently dropped: the two absorbed four-forms options and the reading's own two proposed options are all recorded as passed with reasons on the answer fact, and `partial-ratification`, `split-presentation-and-movements`, `define-sitting`, `facts-from-recommendation-field` and `cite-the-reading` remain viable and unadopted as the account says. `depends` gaining `alignment-order` and `turn-form` is consistent with the new fence; the reading's suggestion to also add `author-questions` and `alignment-page` no longer applies now that the rule itself, and not just a citation to it, has moved off this node.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding; verified on the main thread that turn-form carries the four-forms rule and the absorbed options, and that the cites pin matches the working tree. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 99d667c6

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The fence asks the author to ratify one text that answers the same question two ways. Its third usage says the skill takes a node "given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says", while its queue sentence says the set of unanswered nodes is "taken in the ruling order as the alignment-order node says and surviving every session, and the author's naming of a node is their order and needs no boost"; and the rationale it carries still opens "The author's choice of what to propose next is itself a ranking act, recorded as boost." alignment-order, which this node names in depends, recommends that "`/align` with nothing takes the first node of the ruling order". A confirmation would ratify rank and the ruling order at once, on the one decision this node's own passed-over option `queue-in-ruling-order` says the recommendation had already settled.

### Frontier finding, 2026-09-07

Kind: contradiction.

growth's recommended text orders the same frontier two ways. Its third usage reads "given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says", while its queue sentence in the same paragraph reads "the queue of un-aligned dispositions is therefore the set of such nodes, taken in the ruling order as the alignment-order node says and surviving every session, and the author's naming of a node is their order and needs no boost"; and the rationale of the same fence still opens "The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost." alignment-order, which growth names in depends, recommends "`/align` with nothing takes the first node of the ruling order; `/align <node id>` is the author's order and needs no boost." growth's own option `queue-in-ruling-order` was passed over on 2026-09-07 as "absorbed by the recommendation, whose queue sentence takes `alignment-order`'s ruling order and drops the boost", so the absorption reached one sentence of three.

Also named: commons.systems/disposition-graph/alignment-order, commons.systems/disposition-graph/alignment-target.

Proposed: growth is the node whose text must change: the third usage and the rationale sentence are brought into line with the queue sentence and with alignment-order's recommended answer, so that one order governs the whole fence. alignment-order survives as the owner of the order and is cited rather than contradicted; alignment-target already carries the matching option `ruling-order-not-rank`, sourced to the author, and needs no change from this finding.

Recorded as an option on this node's answer fact: `third-usage-in-the-ruling-order` (source review, 2026-09-07).

### Amended after the frontier survey, 2026-09-07

The survey's finding, validated at its three loci on the main thread: the fence named rank in the third usage and boost in the rationale where its queue sentence names the ruling order. The fence's third usage now takes the first node of the ruling order, as the alignment-order node says, and the rationale's sentence on boost is replaced by the answer's own clause that the author's naming of a node is their order; the survey's option `third-usage-in-the-ruling-order` is adopted into the recommendation. The standing text is not touched. The amended recommendation owes its re-reading, whose object is this repair.

### Clean-context re-reading, 2026-09-07, of 89f4bffa

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `turn-form-to-a-child-and-terms-aligned`.

Findings:

- In `## Facts`, the `answer` fact: the diff adds `- name: third-usage-in-the-ruling-order` with only `source: review` and `ref: "2026-09-07"` -- no `status` and no `reason` -- immediately after an entry that reads `status: passed` / `reason: "carried by \`commons.systems/disposition-graph/turn-form\`, whose fourth form says which rulings were recorded and that the node moved and why"`. Yet the node's own account prose for the new option says its fate was settled the same way as that sibling: "Adopted into the recommendation on 2026-09-07: the fence's third usage and its rationale now carry it." Every other option on this fact that the account describes as folded into the recommendation carries `status: passed` with a `reason` naming what absorbed it -- `strike-phantom-depends` ("passed over -- already applied: the two dependencies naming no node were struck on 2026-09-03"), `cite-unanswered-for-responses` ("passed over -- already applied: the recommended text cites \`unanswered\` for the responses"), `queue-in-ruling-order` ("passed over -- absorbed by the recommendation, whose queue sentence takes \`alignment-order\`'s ruling order and drops the boost"), `rejected-alternative-is-an-option` ("passed over -- absorbed by the recommendation, whose steer clause now puts a steer on the fact beside the confirmed choice"), `proposal-as-a-state-of-a-ratified-node` ("passed over -- absorbed by the recommendation, whose persistence list now reads a proposal as \`authority\` defines it"), `turn-forms-as-its-own-node` ("passed over -- absorbed by the recommendation, which mints \`commons.systems/disposition-graph/turn-form\` and cites it"), and `the-fourth-form-carries-the-recording` ("passed over -- carried by \`commons.systems/disposition-graph/turn-form\`"). `third-usage-in-the-ruling-order` is the one option among these eight left without the marking, so as recorded it reads as an ordinary undecided viable option rather than one already folded into the recommendation -- an inconsistency the amendment introduces on the very fact it is editing, of the same kind an earlier reading on this node already flagged and required fixing (finding 9, closed per the previous reading's account: "`strike-phantom-depends` and `cite-unanswered-for-responses` are marked `passed` with reasons"). Suggested edit: add `status: passed` and `reason: "absorbed by the recommendation, whose third usage and rationale now carry it"` to the `third-usage-in-the-ruling-order` entry, and change its account sentence from "Adopted into the recommendation on 2026-09-07" to "Passed over on 2026-09-07" to match the sibling options' wording.

On the facts and what they recommend: The diff touches only the `answer` fact: it adds one new option, `third-usage-in-the-ruling-order`, to the option list, and edits the recommendation fence's third-usage clause and rationale sentence so both read the ruling order (citing `alignment-order`) in place of rank and boost, closing the contradiction the survey found between the third usage, the queue sentence, and the rationale. `recommends` (`turn-form-to-a-child-and-terms-aligned`), `boldness` (moderate), and `stands` (`standing`) are all unchanged, and the `authority` and `persistence` facts are untouched by this diff.

On the viability of the options: Every previously-listed option remains on the list untouched. The new option, `third-usage-in-the-ruling-order`, is added but -- unlike the seven other options on this fact the account describes the same way, as absorbed into the recommendation -- it carries no `status: passed` and no `reason`, leaving its viability marking inconsistent with its siblings and with the record's own convention for an absorbed option.

Strongest counter-argument (moderate): The amendment can be read as fully closing the survey's finding: the fence's third usage and rationale now agree with the queue sentence and with `alignment-order`'s recommended answer, so the substantive contradiction the survey named -- rank in one clause, ruling order in two others -- is gone, and the missing `status`/`reason` on the new option is a bookkeeping gap rather than a reopening of that contradiction; a reader could judge it non-blocking for forwarding to the author's ruling. But this record treats exactly this omission as a defect elsewhere on the very same fact -- six sibling options record their absorption with `status: passed` and a reason, and an earlier reading on this node raised the identical gap as a finding that was then fixed -- so leaving the one new option unmarked is the one inconsistency in a fence otherwise being presented to the author as internally settled.

The session's reply: Validated on the main thread: the option carried no status and no reason where the account says it was adopted. It is a mechanical defect of the kind `review-cost`'s rule gives to the instrument, repaired in the option's own fields without touching the recommendation, so the pin the two readings judged is unchanged; under the cap of two readings no third is run and the node goes to the author with the repair noted.

### Repaired after the re-reading, 2026-09-07

The re-reading's one finding, validated on the main thread: the option `third-usage-in-the-ruling-order` carried neither status nor reason where the account says the recommendation absorbed it. The option now carries `status: passed` with the reason the sibling options carry; the recommendation, its pins, and the survey's pin are untouched. The reader's verdict is kickback, and the record's instrument admits no ruling stage on a kickback verdict, so the repaired node returns to review and owes a re-reading whose object is this repair; that the repair moves no pin and the cap of two readings would spare it is recorded on the reconciliation list as the instrument's gap.

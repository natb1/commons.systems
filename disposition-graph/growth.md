---
question: How does the graph grow?
stage: maieutic
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: b49c117185ec7bf37b3fe677c871c0be0ec63452
  commit: 56df6ed5b3ebb24c5c71164a1189f798877a77d3
  against: "The option's account prose, left untouched by this diff, still reads \"Adopted into the recommendation on 2026-09-07: the fence's third usage and its rationale now carry it,\" where every sibling option on this fact marked `status: passed` instead closes its prose with \"Passed over ...\" -- exactly the wording the previous reading's suggested edit asked this repair to adopt. The repair carried out only the frontmatter half of that two-part suggested edit and left the account-sentence half undone, so a strict reading of the previous finding is only partly satisfied, even though the substantive defect it named (an option that reads as undecided when the account says it was folded in) is resolved by the added status and reason."
  survey:
    date: 2026-09-09
    of: b49c117185ec7bf37b3fe677c871c0be0ec63452
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "040dd27b9342148a8226498a4ecb0299411ba7fe61cb75e3e8f7d98bc35e0440"
      answer: "f576e79a3bc5b8a356d3fa28dd1ca66fd171219546eea982e4ed3316ebc2c7f7"
      options: "7c83f0c2aa74d0b0a4bbecbdfe7b98deb1b18c1358b340d31afe5086f965179c"
      rivals: "e5b5ef0342ad2a3af3731622e7ebf8242758c69e61150271bbf9be4a9e1610af"
      words: "aa9b9ac0dbe76ee0dd7944f0207f67c6dc6a0fbaaae8dbbf1e6c3d32f984ab01"
    findings:
      - finding: "Eleven of the twenty-one judged nodes claim terms in `defines` and gloss none of them, including two at the ruling stage. The header lines read, verbatim: \"- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)\" (`growth`); \"- Defines: `confirmation` (no gloss yet); `kickback` (no gloss yet); `steelman` (no gloss yet); `substance` (no gloss yet)\" (`recording`); \"- Defines: `clean-context review` (no gloss yet)\"; \"- Defines: `option` (no gloss yet); `viable` (no gloss yet); `grant` (no gloss yet)\" (`viable-options`); \"`doctrine` (no gloss yet); `proposal` (no gloss yet)\" (`authority`); \"- Defines: `neighbourhood` (no gloss yet)\" (`review-cost`); \"- Defines: `probe` (no gloss yet)\" (`author-questions`, at the ruling stage); \"- Defines: `frontier survey` (no gloss yet)\"; \"- Defines: `reading` (no gloss yet); `tradition` (no gloss yet); `adopted` (no gloss yet); `diverged` (no gloss yet); `chosen over` (no gloss yet)\" (`readings`); \"- Defines: `seam` (no gloss yet)\" (`decomposition`); \"- Defines: `session context` (no gloss yet); `rules` (no gloss yet)\" (`session-context`, at the ruling stage). Two of them are worse than empty. `authority` glosses both its terms in its own answer — \"Doctrine is the ratified answers taken together.\" and \"A proposal is technical vocabulary and is not overloaded\" — so the definition exists everywhere but the entry the term index reads. And `viable-options` claims `grant` while `what-acts-during-bootstrap` defines the same thing under another name: \"`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant.\" The mechanical tier does not reach any of this: `term-without-a-path` reports only a used term \"with no path to it over 'under', 'depends' or 'cites'\", which presupposes a definer and never asks whether the definer said anything."
        kind: "vocabulary"
        status: "new"
        since: "2026-09-09"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/growth"
          - "commons.systems/disposition-graph/recording"
          - "commons.systems/disposition-graph/clean-context-review"
          - "commons.systems/disposition-graph/viable-options"
          - "commons.systems/disposition-graph/authority"
          - "commons.systems/disposition-graph/review-cost"
          - "commons.systems/disposition-graph/author-questions"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/readings"
          - "commons.systems/disposition-graph/decomposition"
          - "commons.systems/disposition-graph/session-context"
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
    pairs:
      - with: "commons.systems/disposition-graph/alignment-order"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "cites"
          - "depends"
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "words:words/2026-09-04/10"
          - "depends"
      - with: "commons.systems/disposition-graph/alignment-target"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "cites"
      - with: "commons.systems/disposition-graph/attention"
        keys:
          - "term:boost (defines: commons.systems/disposition-graph/attention)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "words:words/2026-09-06/5"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "parent:commons.systems/disposition-graph/model"
          - "cites"
      - with: "commons.systems/disposition-graph/blocking-and-canopies"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/brooks-surgical-team"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/capture-traditions"
        keys:
          - "term:steer (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "words:words/2026-09-08/37"
      - with: "commons.systems/disposition-graph/decomposition"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "words:words/2026-09-08/37"
          - "words:words/2026-09-03/49"
          - "words:words/2026-09-03/50"
          - "words:words/2026-09-04/27"
          - "depends"
      - with: "commons.systems/disposition-graph/frontier-consistency"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/hexis"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/knowledge-store"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/legacy"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/madr-decision-records"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/movements"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/namespaces"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/persistence"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/plato-elenchus"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/plato-periagoge"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "words:words/2026-09-08/37"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:graph browser (defines: commons.systems/disposition-graph/projection)"
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "words:words/2026-09-08/37"
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "words:words/2026-09-08/37"
      - with: "commons.systems/disposition-graph/rejected"
        keys:
          - "term:rejected alternative (defines: commons.systems/disposition-graph/rejected)"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/review-model"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/review-skills"
        keys:
          - "words:words/2026-09-04/10"
      - with: "commons.systems/disposition-graph/rsi"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/second-stop"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "cites"
      - with: "commons.systems/disposition-graph/traditions-home"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/turn-form"
        keys:
          - "words:words/2026-09-06/5"
          - "words:words/2026-09-07/18"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/un-aligned-children"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "parent:commons.systems/disposition-graph/model"
      - with: "commons.systems/disposition-graph/web-routing"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/when-the-kickback-feedback-shows"
        keys:
          - "words:words/2026-09-08/37"
      - with: "commons.systems/disposition-graph/where-a-change-request-goes"
        keys:
          - "words:words/2026-09-08/37"
      - with: "commons.systems/disposition-graph/which-facts-are-listed"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "parent:commons.systems/disposition-graph/model"
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
        supports:
          - words/2026-09-03/49
          - words/2026-09-03/50
          - words/2026-09-03/58
          - words/2026-09-03/59
          - words/2026-09-03/60
          - words/2026-09-03/61
          - words/2026-09-03/62
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
        supports:
          - words/2026-09-06/5
      - name: the-turn-takes-one-of-four-forms
        source: author
        ref: "2026-09-07"
        status: passed
        reason: "carried by `commons.systems/disposition-graph/turn-form`, where the four forms are the answer and not a clause of this one"
        supports:
          - words/2026-09-07/18
      - name: turn-form-to-a-child-and-terms-aligned
        source: ai
        ref: "2026-09-07"
        supports:
          - words/2026-09-02/8
          - words/2026-09-04/10
          - words/2026-09-04/27
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

      - name: iterative-probe-review-supersedes-the-sequential-movements
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/37
      - name: growth-answers-the-acts-and-cites-its-children
        source: ai
        ref: "2026-09-08"
    recommends: turn-form-to-a-child-and-terms-aligned
    boldness: moderate
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

## Facts

### answer

Recommended because three changes fall due on this node at once and one edit reconciles the whole of it. The rule that bounds what reaches the author leaves for `commons.systems/disposition-graph/turn-form`, on the author's words of 2026-09-07 that a persistent intent of theirs may require a node of its own and on `node`'s rule that a text answering two questions is two nodes; three terms are brought into line with the nodes that own them, a steer with `rejected`, a proposal with `authority`, and the queue's order with `alignment-order`; and nothing else in the text moves. Which clauses are whose: the loop of three moves, the three usages, the two conducts with their loci, the periagogic objects, the six movements of a sitting and the persistence list are the AI's drafting; the presentation rule with its three facts, the reversal of boldness, the queue of dispositions stated mid-sitting, and the timing of a recommendation are the author's words of 2026-09-03 and 2026-09-04; and the rule that used to sit between them, the author's words of 2026-09-06 and 2026-09-07, is what leaves. Boldness moderate, and not low: what a ruling here confirms is the whole fence, and this node's own account has already conceded of that text that "the movements are moderate boldness, not low", which stands whatever the boldness of the clause that moved. The author's ruling of 2026-09-03, "Ratified on the rule. Ratified on the shim.", covered two things and no more, the two-stage rule in both usages and the alignment-skill shim; no fact on this node carries a ruling, so the fresh ruling asked for here covers the whole answer, and `partial-ratification` stays on the list as the option under which the author is asked only for the rest.

#### standing

By a loop of three moves.

**AI support.** The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author's words of 2026-09-03 on dispositions stated mid-sitting, and their words later that day on where unanswered nodes are listed, are under `## Disposition` and are argued from here: a disposition the author states in a sitting is queued as a node that survives compaction, which is why the queue is the set of such nodes and not a list beside the record; and the alignment page lists the unanswered nodes the browser hides, its outputs consumed by the shimmed alignment skill, which is why the page and not the browser is where a recommendation stands for confirmation. Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round (evidence: `bootstrap/align-survey.md` on the implementation ref).

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put with its authority class, boldness, and alternatives; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the record and the author's words against the AI's own knowledge; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an alternative in a dialogue that dies at the ruling, a proposal when it arose outside alignment, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The alignment page lists every unanswered node in rank order, the purpose node first, each with its stage, the author's words, the node as it stands, the AI's account, and the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once, as the unanswered node says; the author rules there or in prose, and the session reads the responses back and resumes each dialogue at its stage. Legacy nodes are cited as evidence when a question needs them and never imported.
```

#### split-presentation-and-movements

Growth's answer is one paragraph answering at least seven separable questions, against node's rule that a text answering two questions is two nodes. This alternative splits the three-fact presentation rule into a child node asking what a recommendation must state before it is recorded, carrying the three facts, the persistence list and the ban on transient dispositions, and splits the movements of a sitting into a child node carrying the periagogic and maieutic objects; growth survives as the loop of three moves and the three usages of the skill, citing both. The reviewer proposed it twice and the session declined twice, referring the split to the author. Recording, delegation, alignment-target and checkpoint are the precedent for a part of growth becoming a node of its own.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

Growth's answer is one paragraph answering at least seven separable questions, against node's rule that a text answering two questions is two nodes. This alternative splits the three-fact presentation rule into a child node asking what a recommendation must state before it is recorded, carrying the three facts, the persistence list and the ban on transient dispositions, and splits the movements of a sitting into a child node carrying the periagogic and maieutic objects; growth survives as the loop of three moves and the three usages of the skill, citing both. The reviewer proposed it twice and the session declined twice, referring the split to the author. Recording, delegation, alignment-target and checkpoint are the precedent for a part of growth becoming a node of its own.
```

#### define-sitting

Growth adds 'sitting' to its defines and one sentence saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. The word names the record's central act and is used by growth, recording, dialogue, transience and alignment-target and in about twenty account headings, yet no node defines it, so it is the one word the browser cannot link. Nothing else in the answer changes. Also raised on commons.systems/disposition-graph/dialogue. Also raised on commons.systems/disposition-graph/recording.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

Growth adds 'sitting' to its defines and one sentence saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. The word names the record's central act and is used by growth, recording, dialogue, transience and alignment-target and in about twenty account headings, yet no node defines it, so it is the one word the browser cannot link. Nothing else in the answer changes. Also raised on commons.systems/disposition-graph/dialogue. Also raised on commons.systems/disposition-graph/recording.
```

#### cite-unanswered-for-responses

Growth stops restating the alignment page's three responses and cites the unanswered node, which defines them and which the page implements. Three response vocabularies are live for one act across unanswered, recording and growth, and every restatement is a place they can drift; the response-vocabulary contradiction finding makes unanswered the survivor, so one node defines what the author may answer and the page implements that one list. The rest of the answer is untouched. Raised on commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/recording. Passed over on 2026-09-07: the recommended text already does it, ending the sentence "what the three responses are is the unanswered node's" and restating none of them.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

Growth stops restating the alignment page's three responses and cites the unanswered node, which defines them and which the page implements. Three response vocabularies are live for one act across unanswered, recording and growth, and every restatement is a place they can drift; the response-vocabulary contradiction finding makes unanswered the survivor, so one node defines what the author may answer and the page implements that one list. The rest of the answer is untouched. Raised on commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/recording. Passed over on 2026-09-07: the recommended text already does it, ending the sentence "what the three responses are is the unanswered node's" and restating none of them.
```

#### facts-from-recommendation-field

Growth's presentation rule says explicitly that the three facts are presented from the node's recommendation field and its declared shims, never from a prose line in the account. The coverage finding verified that sixteen nodes still carry a generic prose Facts line contradicting their own recommendation field, and the page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier. Growth's answer states the presentation rule without naming where the facts are read from; this closes the duplication at its source instead of node by node. Raised on commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/recording.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

Growth's presentation rule says explicitly that the three facts are presented from the node's recommendation field and its declared shims, never from a prose line in the account. The coverage finding verified that sixteen nodes still carry a generic prose Facts line contradicting their own recommendation field, and the page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier. Growth's answer states the presentation rule without naming where the facts are read from; this closes the duplication at its source instead of node by node. Raised on commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/recording.
```

#### partial-ratification

The author already ruled 'Ratified on the rule. Ratified on the shim.' in a sitting, and growth still carries a deferred stamp and is offered for a fresh ruling on the whole node. This alternative has growth's account state which clauses the author already ratified, the two-stage rule in both usages and the alignment-skill shim, and the recommendation cover only the rest, so the author is not asked twice for a ruling they gave. Growth's own reply accepts this and defers it to its sitting, so the change is owed rather than made. It raises the question whether a clause can carry a stamp separately from its node, which belongs to authority. Raised on commons.systems/disposition-graph/authority.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The author already ruled 'Ratified on the rule. Ratified on the shim.' in a sitting, and growth still carries a deferred stamp and is offered for a fresh ruling on the whole node. This alternative has growth's account state which clauses the author already ratified, the two-stage rule in both usages and the alignment-skill shim, and the recommendation cover only the rest, so the author is not asked twice for a ruling they gave. Growth's own reply accepts this and defers it to its sitting, so the change is owed rather than made. It raises the question whether a clause can carry a stamp separately from its node, which belongs to authority. Raised on commons.systems/disposition-graph/authority.
```

#### strike-phantom-depends

The cross-reference finding carried on session-context proposes that growth's two dependencies naming no node — review-context and review-artifact — be struck as superseded in substance by clean-context-review and growth's own alignment-page shim, or minted as un-aligned dispositions, since a question that lives only on a page is the ledger the record asked to sunset. (Raised on commons.systems/disposition-graph/session-context.) Passed over on 2026-09-07: both were struck on 2026-09-03 and `depends` has not named either since.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The cross-reference finding carried on session-context proposes that growth's two dependencies naming no node — review-context and review-artifact — be struck as superseded in substance by clean-context-review and growth's own alignment-page shim, or minted as un-aligned dispositions, since a question that lives only on a page is the ledger the record asked to sunset. (Raised on commons.systems/disposition-graph/session-context.) Passed over on 2026-09-07: both were struck on 2026-09-03 and `depends` has not named either since.
```

#### cite-the-reading

Growth's answer drops its own Republic citation for the periagogic movement and cites this reading instead, so the loci are stated in one place. The review of 2026-09-03 found the two citations disagreeing in extent, growth naming 518b to d while the reading names 518b to 518d plus 521c and 515c to 516a. (Raised on commons.systems/disposition-graph/plato-periagoge.)

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

Growth's answer drops its own Republic citation for the periagogic movement and cites this reading instead, so the loci are stated in one place. The review of 2026-09-03 found the two citations disagreeing in extent, growth naming 518b to d while the reading names 518b to 518d plus 521c and 515c to 516a. (Raised on commons.systems/disposition-graph/plato-periagoge.)
```

#### queue-in-ruling-order

This node's queue, the set of unanswered nodes in rank order, and its list of what the alignment page carries, every unanswered node in rank order, are amended by the alignment-order draft to the ruling order, with rank as tie-break; the author's choice of what comes next remains `/align <node id>` and needs no boost. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there. Passed over on 2026-09-07: the recommendation takes it, the queue sentence now running in the ruling order with the author's naming of a node as their order.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

This node's queue, the set of unanswered nodes in rank order, and its list of what the alignment page carries, every unanswered node in rank order, are amended by the alignment-order draft to the ruling order, with rank as tie-break; the author's choice of what comes next remains `/align <node id>` and needs no boost. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there. Passed over on 2026-09-07: the recommendation takes it, the queue sentence now running in the ruling order with the author's naming of a node as their order.
```

#### boldness-reversed

This node's definition sentence is reversed, so that boldness is how much of a recommendation rests on the AI's own knowledge against the record and the author's words, which is how the dialogue node words it, how the author worded it on 2026-09-03, and how every boldness stamp in the record was written. Two consequences of rulings on other nodes ride with it in the fence, because this node was restating questions that are not its own: the description of the alignment page leaves, with the shim that names the artifact, for the node that asks the page's question; and the clause placing the recommendation at the intention movement is loosened to say that the recommendation is put to the author there while it may be recorded at any stage, which is the author's revision of 2026-09-04 recorded on the dialogue node. It is the base the recommendation builds on and is not itself recommended, since the recommendation adds the move to `turn-form` and the three terms brought into line.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put with its authority class, boldness, and alternatives; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the record and the author's words against the AI's own knowledge; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an alternative in a dialogue that dies at the ruling, a proposal when it arose outside alignment, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The alignment page lists every unanswered node in rank order, the purpose node first, each with its stage, the author's words, the node as it stands, the AI's account, and the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once, as the unanswered node says; the author rules there or in prose, and the session reads the responses back and resumes each dialogue at its stage. Legacy nodes are cited as evidence when a question needs them and never imported.
```

#### boldness-left-and-dialogue-corrected

The inverse repair: this node's definition stands and the dialogue node, the alignment skill, and every boldness stamp in the record are corrected to match it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the author's own words give the direction, "I want to know how much rests on the AI's own knowledge against the record", so the correction would be against the author; and the stamps were written under the usage, so it would silently reverse the meaning of every one of them.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The inverse repair: this node's definition stands and the dialogue node, the alignment skill, and every boldness stamp in the record are corrected to match it.
```

#### issue-trackers-as-the-loop

The loop runs on an issue tracker, as the incumbent alignment skill did. The
passage lists it among the incumbent's mechanics not kept and records no
reason; the evidence is `bootstrap/align-survey.md` on the implementation ref.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The loop runs on an issue tracker, as the incumbent alignment skill did. The
passage lists it among the incumbent's mechanics not kept and records no
reason; the evidence is `bootstrap/align-survey.md` on the implementation ref.
```

#### tactics-as-the-loop

The loop decomposes work into standing tactic nodes, as the incumbent
alignment skill did. The passage lists it among the incumbent's mechanics not
kept and records no reason.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The loop decomposes work into standing tactic nodes, as the incumbent
alignment skill did. The passage lists it among the incumbent's mechanics not
kept and records no reason.
```

#### phases-as-the-loop

The loop moves a node through fixed phases, as the incumbent alignment skill
did. The passage lists it among the incumbent's mechanics not kept and records
no reason.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The loop moves a node through fixed phases, as the incumbent alignment skill
did. The passage lists it among the incumbent's mechanics not kept and records
no reason.
```

#### the-router-and-its-gates

The incumbent's router and its gates select and admit the work of a sitting.
The passage lists them among the incumbent's mechanics not kept and records no
reason.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The incumbent's router and its gates select and admit the work of a sitting.
The passage lists them among the incumbent's mechanics not kept and records no
reason.
```

#### born-parked-review

A review is born parked and released by a gate, as the incumbent alignment
skill had it. The passage lists it among the incumbent's mechanics not kept
and records no reason.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

A review is born parked and released by a gate, as the incumbent alignment
skill had it. The passage lists it among the incumbent's mechanics not kept
and records no reason.
```

#### placement-gates

A node's placement in the graph is admitted by a gate. The passage lists it
among the incumbent's mechanics not kept and records no reason.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

A node's placement in the graph is admitted by a gate. The passage lists it
among the incumbent's mechanics not kept and records no reason.
```

#### the-curriculum

The order of the author's attention is a curriculum kept beside the record, as
the incumbent had it. The passage lists it among the incumbent's mechanics not
kept and records no reason.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The order of the author's attention is a curriculum kept beside the record, as
the incumbent had it. The passage lists it among the incumbent's mechanics not
kept and records no reason.
```

#### the-skills-own-text-as-authority

The alignment skill's own text carries authority over the record. The passage
lists it among the incumbent's mechanics not kept and records no reason; every
rule a session works under is a node or a declared shim.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The alignment skill's own text carries authority over the record. The passage
lists it among the incumbent's mechanics not kept and records no reason; every
rule a session works under is a node or a declared shim.
```

#### rejected-alternative-is-an-option

The standing answer's sentence "a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again." places a rejected alternative in the rationale, and under the rejected node's recommended text that is the wrong place: a rejected alternative is an option on the fact it answers, with its status and the reason it was not taken, and the rationale argues and may name it but does not hold it. Raised by the rejected node from its reading of 2026-09-05; the amendment is the one clause, and it acts on nothing until the author rules. Passed over on 2026-09-07: the recommendation makes that one-clause edit.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The standing answer's sentence "a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again." places a rejected alternative in the rationale, and under the rejected node's recommended text that is the wrong place: a rejected alternative is an option on the fact it answers, with its status and the reason it was not taken, and the rationale argues and may name it but does not hold it. Raised by the rejected node from its reading of 2026-09-05; the amendment is the one clause, and it acts on nothing until the author rules. Passed over on 2026-09-07: the recommendation makes that one-clause edit.
```

#### proposal-as-a-state-of-a-ratified-node

The standing answer and the recommended `boldness-reversed` both list what a recorded thing may be, and among them "a proposal when it arose outside alignment". The origin no longer defines the word: since the author's words of 2026-09-04 on the viable-options node, a proposal is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from. The list item becomes a proposal on a ratified node whose recommendation has moved, and the authority node is cited for the state. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05. Passed over on 2026-09-07: the recommendation makes that one-clause edit.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The standing answer and the recommended `boldness-reversed` both list what a recorded thing may be, and among them "a proposal when it arose outside alignment". The origin no longer defines the word: since the author's words of 2026-09-04 on the viable-options node, a proposal is the state of a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from. The list item becomes a proposal on a ratified node whose recommendation has moved, and the authority node is cited for the state. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05. Passed over on 2026-09-07: the recommendation makes that one-clause edit.
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

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
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

By a loop of three moves. Draft: the AI writes a node, or an amendment, in the record with no more authority than it holds. Project: the node's page in the graph browser is rendered, because every node has a documentation projection and the page is what the author reads. Ratify or steer: after the dialectic the author rules; a ratification is recorded as the stamp in the author's name with the ruling quoted, and a steer enters the node's rationale as a rejected alternative or an amendment before the page is rendered again. The dialectic runs both ways, on the AI's draft and on the author's intention, and ratification is its outcome, never a rubber stamp. The alignment skill has three usages, and each is a sitting in two separated stages: given a disposition in the author's words, it records or revises the node that answers it; given a node id, it ratifies the node or reviews its ratification; given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says. The periagogic object of a sitting on a node is the node's page and the readings under it. The periagogic object of a sitting on a disposition is the nodes the disposition would amend and the implementation their criteria point to, so that nothing recorded for a good reason is undone unread. The interview has two conducts, named from Plato. Periagogic: the record is authoritative and the author is turned back to it; the author articulates what the record and the readings under it say before the AI's account enters as counterpoint, probes cite the text by locus, and no verdict is in play (the turning of the soul, Republic VII 518b to d). Maieutic: the answer lives in the author, unrecorded, and the AI draws it out with visible, refusable drafts, testing each as the midwife tests the offspring (Theaetetus 148e to 151d). A sitting runs the periagogic stage, comprehension, first, and the maieutic stage, intention, second, where what the author means and intends to bind is elicited and tested and the ruling is taken. The periagogic stage is never skipped, and its object is the ground of the question, not the decision surface. The sitting moves in order: reading, the author is pointed to the node's page and the readings under it and nothing else is said; comprehension, one probe per turn from the page and not from memory, first on the answer alone, then on each reading's relation and locus, then on the rationale and the rejected alternatives, with the AI's account, findings, and drafts held back until the author has committed and entering only as counterpoint cited by locus; intention, where the findings, the evaluation twice, and the test against the record enter and the recommendation is put with its authority class, boldness, and alternatives; the review, where the recommended disposition is read adversarially in clean context and its strongest counter-argument, when there is one, is attached for the author with the reason the disposition stands regardless; the ruling, the author's confirmation on the alignment page or in prose; and the recording, where the response is classified, kicked back to the movement it calls for, or stamped and landed, as the recording node describes. Each sitting recursively identifies the follow-up readings, vocabulary, and key concepts it surfaces, which feed the review frontier. Every recommendation to record is presented for review before it is recorded, and states three things: the authority class under which it would stand; its boldness, how much of it rests on the record and the author's words against the AI's own knowledge; and its persistence, whether it is standing, a disposition or criterion that holds until re-answered, a shim declared with its liquidation condition, an alternative in a dialogue that dies at the ruling, a proposal when it arose outside alignment, an un-aligned disposition, evidence, or not recorded because it is derived at need or belongs to an operation's scaffolding. A transient disposition is a contradiction in terms: dispositions are standing, and what passes takes one of the other shapes. What the author directs to be recorded is reported with the same three facts. A disposition the author states during a sitting, or a node they name, is supported usage: the session records it at once as an un-aligned disposition, a node with the author's words and the stage of the dialogue under the node it would refine, and continues the sitting in hand; the queue of un-aligned dispositions is therefore the set of such nodes, ranked like any node and surviving every session, and the author's choice of what comes next is a boost. The alignment page lists every unanswered node in rank order, the purpose node first, each with its stage, the author's words, the node as it stands, the AI's account, and the three responses open, confirm, confirm with edits, and deny with feedback, on any subset at once, as the unanswered node says; the author rules there or in prose, and the session reads the responses back and resumes each dialogue at its stage. Legacy nodes are cited as evidence when a question needs them and never imported.
```

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
a rule lives.

**AI support.** The loop is the alignment interview made incremental: one page, one ruling. The author's naming of a node is their order and needs no boost, as the answer says, and the ruling order is the alignment-order node's. The author, 2026-09-03, on the presentation of recommendations: "recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) ... This way I know if I am approving some transient stop-gap or something that will persist in the graph." The author, 2026-09-03, on the two-stage rule and the skill shim: "Ratified on the rule. Ratified on the shim." The author's words of 2026-09-03 on dispositions stated mid-sitting, and their words later that day on where unanswered nodes are listed, are under `## Disposition` and are argued from here: a disposition the author states in a sitting is queued as a node that survives compaction, which is why the queue is the set of such nodes and not a list beside the record; and the alignment page lists the unanswered nodes the browser hides, its outputs consumed by the shimmed alignment skill, which is why the page and not the browser is where a recommendation stands for confirmation. Kept in force from the incumbent alignment skill, as principles and never as mechanics: fable as the default model, landing location never asked of the author, the mechanical floor, one question per node, whole-node amendment, doctrine currency before a round (evidence: `bootstrap/align-survey.md` on the implementation ref). Two amendments of 2026-09-04, from the sitting on the alignment page: the definition of boldness is reversed, because the dialogue node, the author's own words of 2026-09-03, and every stamp in the record run the other way and this node's sentence was the outlier; and the description of the alignment page leaves this node for the node that asks the page's question, taking with it the shim that names the artifact, because a page described in two places is ratified in two places, which is what minting that node was for. An amendment of 2026-09-07, from the author's words of 2026-09-06 and 2026-09-07 in the sitting on the alignment page's children: the rule that bounds what reaches the author, the three surfaces and the four forms a turn addressed to them may take, is not carried here but on turn-form, the node beneath this one, because a rule that governs every turn of every sitting is its own question and the author's words of 2026-09-07 send a persistent intent of theirs to a node to be reconciled into the skill; this node keeps the loop, the three usages and the two conducts, and cites that node for the form of a turn. Three terms are brought into line with the nodes that own them in the same landing: a steer is an option on the fact and not a rejected alternative in the rationale, as rejected says; a proposal is the state of a ratified node whose recommendation has moved, as authority says; and the queue runs in the ruling order with the author's naming of a node as their order, as alignment-order says.

**AI divergence.** Against it, it asks the author to rule on a fence in which the one
clause they spoke to most recently is absent, having moved to a child they must
then rule separately; the answer is that the child is on the frontier beside this
node and the author rules both, which is what `node`'s rule costs wherever it is
kept.

**Content.**

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
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

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
```

#### the-fourth-form-carries-the-recording

The acknowledgement of a confirmation carries what the recording node requires the
session to say in the same turn, which rulings were recorded and, where the
response moved the node's stage, that it moved and why; and what a reconciliation
session outputs, including a listing the author has asked for before reconciliation
begins, is outside the rule and not only the account of a landing. Raised by the
clean-context reading of 2026-09-07. Passed over the same day: both clauses are
carried by `commons.systems/disposition-graph/turn-form`, whose answer names what
the fourth form contains and what stands outside the rule.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

The acknowledgement of a confirmation carries what the recording node requires the
session to say in the same turn, which rulings were recorded and, where the
response moved the node's stage, that it moved and why; and what a reconciliation
session outputs, including a listing the author has asked for before reconciliation
begins, is outside the rule and not only the account of a landing. Raised by the
clean-context reading of 2026-09-07. Passed over the same day: both clauses are
carried by `commons.systems/disposition-graph/turn-form`, whose answer names what
the fourth form contains and what stands outside the rule.
```

#### third-usage-in-the-ruling-order

Everything the recommendation says, with the third usage and the rationale brought into line with the queue sentence: given nothing, the skill takes the first node of the ruling order, as alignment-order says, and the rationale drops "The author's choice of what to propose next is itself a ranking act, recorded as boost" for the answer's own clause that the author's naming of a node is their order and needs no boost. It is on the table because the fence as it stands names rank in one clause and the ruling order in another for one and the same set of unanswered nodes, and a confirmation would ratify both. Passed over on 2026-09-07, absorbed by the recommendation: the fence's third usage and its rationale now carry it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How does the graph grow?
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

## Answer

Everything the recommendation says, with the third usage and the rationale brought into line with the queue sentence: given nothing, the skill takes the first node of the ruling order, as alignment-order says, and the rationale drops "The author's choice of what to propose next is itself a ranking act, recorded as boost" for the answer's own clause that the author's naming of a node is their order and needs no boost. It is on the table because the fence as it stands names rank in one clause and the ruling order in another for one and the same set of unanswered nodes, and a confirmation would ratify both. Passed over on 2026-09-07, absorbed by the recommendation: the fence's third usage and its rationale now carry it.
```

#### iterative-probe-review-supersedes-the-sequential-movements

**Author support.** The author's words of 2026-09-08 at `words/2026-09-08/37`, answering P3: "There is no kick-back because probe review is an
iterative process that supercedes sequential periagogic/meiutic/review phases."

The sitting does not move in order through the periagogic, the maieutic and the review.
Probes are raised, put to the author and to the convened experts, and answered, and the
answers raise more; the process is iterative and has no phase boundary to kick back
across. What the movements name survives as kinds of question rather than as stages a
sitting passes through.

**AI support.** The sequence was already failing on its own terms in the sitting that
recorded this option. Entry 36 arrived mid-sitting and entry 37 answered probes the
sitting had put after it had, by the sequence's reckoning, passed the movements those
probes belong to; the sitting's own grant obliges it to re-visit alignment it has
already sequenced when later findings overtake it, which is iteration described as an
exception to a sequence that does not hold. Naming it iteration says what is happening.

**AI divergence, and it is the one this option most needs answered.** The sequence bought
something and this option does not say what replaces it. `evaluation` requires that a
recommendation replacing an incumbent say what the incumbent solved; the movements
solved the problem that comprehension precedes intention, that a reader who has not
first read the node as it stands will propose changes to a node they have imagined. The
periagogic movement was the instrument that forced the reading before the proposing.
Under iteration nothing forces that order, and the failure it prevented is the one this
record is least able to detect, because a session that has misread a node produces a
coherent account of the node it misread. Whether iteration preserves it is a question for
an expert and not for the AI whose reading is the thing at risk.


#### growth-answers-the-acts-and-cites-its-children

The expert's choice, minted by it. `growth`'s answer keeps only what holds however
the dialogue is orchestrated -- that the graph changes by acts on nodes, facts and
options; that the AI drafts and recommends with no authority of its own; that the record
is projected for the author to read; and that nothing becomes doctrine until the author
confirms it -- and every clause that specifies conduct, the movements and their order,
the entry points and usages, what a presentation must state, what a turn may be, moves to
the children that already exist to hold it, carrying the boldness reversal and the three
vocabulary alignments of the current recommendation. Where the author prefers a smaller
move, the expert's second choice is `split-presentation-and-movements` amended to carry
those alignments, which is the same move stopping two children short.

**Expert choice.** `dialectical-conduct`, convened on this answer fact on 2026-09-08,
grounding the conduct of structured inquiry. Its argument in its own terms: what `growth`
states today is a phase model of an inquiry, and the central finding of the tradition
this record already cites for its structure, Rittel's, in the second-generation design
methods and in IBIS, is that the phase model is a fiction and the argumentative structure
is the durable thing. The record furnished its own proof. Its issue layer -- node, fact,
option, ruling, authority, class -- has not moved in six days; its procedure layer has
been rewritten twice in six days and is mid-rewrite now. A text welding the two together
must be re-ratified whenever the procedure moves, so either it is never ratified or the
author ratifies stale procedure under cover of stable structure. Walton and Krabbe's
typology says the same from the other side: this answer runs an information-seeking
dialogue, a persuasion dialogue and an inquiry as one ordered procedure with one goal,
and each type has its own goal, burden and standard of relevance, which one procedure
cannot mark the shift between. The record has spent two days spontaneously minting a
child for each -- `movements` for the three conducts, `expert-identity` and
`expert-instructions` for the inquiry's participants, `round-termination` for its
stopping rule -- which the expert reads as the typology reasserting itself against a text
that denied it. And the scholastic rule the record has already applied twice under its
own name: the unit of determination is the article and the article is one question, which
`delegation-bounds-and-sizing` states in the record's own words for `delegation`.
`growth` is in `delegation`'s position, one question further up.

**Expert divergence, its own, against itself.** It gives up the self-contained text, and
the expert reports its grounding as genuinely split rather than merely cautious: the
*ordinatio* was one document for a reason, since a reader assembling a determination out
of a subtree of unanswered children can be told anything by whoever assembles, and the
assembler here is the AI. The record's declared mitigation, that the skill is projected
from the ratified subtree, is `growth`'s own shim liquidation and is a promise rather
than a mechanism that exists today. So the option is right about where the clauses belong
and owes an account of what a session reads in the interval. Its second divergence is
against itself: "minting an option is what a party does when it dislikes the ones on the
table, and I am that party, convened by a brief that told me the split was already made.
Weigh it accordingly."

**AI support.** The measurement behind the argument is checkable and was checked. The
expert's claim that `growth` carries no reference to the author's words of 2026-09-08 was
true when it read the file: `growth.md` carried no `supports` or `diverges` reference to
`words/2026-09-08/36` or `/37` on any option, while seventeen other node files carried
36. Seventeen still stands. The reference to 37 no longer does, because this sitting
landed one at `57adb63b` after the expert had read; the reference to 36 is still absent,
which is the half of the finding that survives.

**AI divergence.** The main thread does not integrate this into a moved recommendation
and says why rather than leaving the hold to look like caution. The expert reports, in
its own first section, that the brief handed it as settled topology the proposition its
scope was to decide, and that a reviewer should treat its choice as the option a steered
expert would have produced anyway. That report is correct and was verified against the
record: `movements.md` says in terms "Nothing moved out of `growth`", and the brief said
`movements` owns the movements. An expert's choice contaminated by the brief in the
direction of its own conclusion is evidence about the brief before it is evidence about
the fact.


### authority

Ratified, on the capture-shaped limb of `commons.systems/disposition-graph/class-recommendation`'s test. This node defines the vocabulary the author rules with — propose, project, ratify, steer, periagogic, maieutic, boldness — and states the conduct of the interview in which the author checks the AI; the party that would set that conduct is the party the conduct exists to check, which is the limb. The other two are not met on this recommendation's own object: the move of a rule to a child node and the alignment of three terms cost a landing to undo and undo cleanly. Boldness low on the class: it follows the stated test, and the author's ruling of 2026-09-03 on this node's rule shows they mean to be asked.

### persistence

The recommendation drops one of this node's two shims: the alignment page, which moves to `commons.systems/disposition-graph/alignment-page` with its declaration date and its liquidation condition intact. The skill shim stays, because this node is still what the alignment skill projects. Confirming it leaves one shim here; denying it leaves the page described in two places, which is what minting the page's own node was for. The two nodes rule together, and `alignment-page` carries the matching decision.

#### both shims kept

This node keeps both shims, the alignment skill's and the alignment page's, and the page stays described here, on a node whose question is growth and not the page; `alignment-page` then carries a matching declaration or none.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### the page's shim moved out

This node keeps the skill's shim alone, and the page's declaration moves to `commons.systems/disposition-graph/alignment-page` with its date and its liquidation condition intact, so that the page is described where its question is asked and this node declares only what it projects.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review of the amendment, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding: this node defines boldness in the wrong direction, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement of the alignment-page sitting, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The term "probe" given a definition, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option from the rejected node, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The form of a turn, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of d3e9fa8a, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading of 2026-09-07 applied, and the turn rule moved to a child, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 99d667c6, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of 99d667c6, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 89f4bffa, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 89f4bffa (ii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `turn-form-to-a-child-and-terms-aligned`.

Findings:

- In `## Facts`, the `answer` fact's option `third-usage-in-the-ruling-order`: the header now reads "passed over -- absorbed by the recommendation, whose third usage and rationale now carry it" (frontmatter `status: passed` / `reason` added by this diff), but the option's own prose paragraph, unchanged by this diff, still ends "Adopted into the recommendation on 2026-09-07: the fence's third usage and its rationale now carry it." Every other option on this fact marked `status: passed` ends its prose with "Passed over ..." (e.g. `queue-in-ruling-order`: "Passed over on 2026-09-07: the recommendation takes it..."; `turn-forms-as-its-own-node`: "Passed over the same day: the recommendation is this option..."), and the previous reading's suggested edit explicitly asked for this: "change its account sentence from 'Adopted into the recommendation on 2026-09-07' to 'Passed over on 2026-09-07' to match the sibling options' wording." The repair applied only the frontmatter half of that suggested edit; the account-sentence half is still open. Non-blocking: the added `status`/`reason` already remove the substantive confusion the previous finding named (the option no longer reads as an ordinary undecided option), and "adopted into the recommendation" and "absorbed by the recommendation" carry the same sense, so this is a residual wording inconsistency rather than a reopened contradiction. Suggested edit: change the option's closing sentence to "Passed over on 2026-09-07: the fence's third usage and its rationale now carry it."

On the facts and what they recommend: The diff touches only the `answer` fact's option list: it adds `status: passed` and `reason: "absorbed by the recommendation, whose third usage and rationale now carry it"` to the previously-unmarked option `third-usage-in-the-ruling-order`. `recommends` (`turn-form-to-a-child-and-terms-aligned`), `boldness` (moderate), and `stands` (`standing`) are unchanged; the `authority` and `persistence` facts are untouched by this diff.

On the viability of the options: Every other option on the answer fact is untouched. The newly-marked option now reads as `passed` (dominated, never the recommendation), matching the record's own vocabulary and the marking convention of its seven sibling options folded into the same recommendation, so no option's viability is left ambiguous by this diff.

Strongest counter-argument (weak): The option's account prose, left untouched by this diff, still reads "Adopted into the recommendation on 2026-09-07: the fence's third usage and its rationale now carry it," where every sibling option on this fact marked `status: passed` instead closes its prose with "Passed over ..." -- exactly the wording the previous reading's suggested edit asked this repair to adopt. The repair carried out only the frontmatter half of that two-part suggested edit and left the account-sentence half undone, so a strict reading of the previous finding is only partly satisfied, even though the substantive defect it named (an option that reads as undecided when the account says it was folded in) is resolved by the added status and reason.

The session's reply: Validated on the main thread: the option's paragraph now reads passed over, absorbed by the recommendation, as its siblings do.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/growth stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `turn-form-to-a-child-and-terms-aligned`; 12 `## Disposition` entries became the ledger entries words/2026-09-03/58, words/2026-09-02/8, words/2026-09-03/59, words/2026-09-03/60, words/2026-09-03/50, words/2026-09-03/49, words/2026-09-04/27, words/2026-09-04/10, words/2026-09-06/5, words/2026-09-07/18, words/2026-09-03/61, words/2026-09-03/62, referenced by 9 options the entry's own date names and by the recommended option for 3 the date named none; and `stands` left the answer fact. The content of `boldness-reversed (at a86b9399)`, `the-turn-takes-one-of-four-forms (at b319e072)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `split-presentation-and-movements`, `define-sitting`, `cite-unanswered-for-responses`, `facts-from-recommendation-field`, `partial-ratification`, `strike-phantom-depends`, `cite-the-reading`, `queue-in-ruling-order`, `boldness-left-and-dialogue-corrected`, `issue-trackers-as-the-loop`, `tactics-as-the-loop`, `phases-as-the-loop`, `the-router-and-its-gates`, `born-parked-review`, `placement-gates`, `the-curriculum`, `the-skills-own-text-as-authority`, `rejected-alternative-is-an-option`, `proposal-as-a-state-of-a-ratified-node`, `the-dialogue-is-grounding-intent-and-confirmation`, `turn-forms-as-its-own-node`, `the-fourth-form-carries-the-recording`, `third-usage-in-the-ruling-order`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `89f4bffabf8e00af74bee0c8b4f32b26581c9f1c` is re-computed for the encoding as `bed10a4712e392bc195d0d7d0ed20d7cf11994b0`; nothing it read changed. The survey's pin `99d667c6fd7d8d8d7fb61bd1a5289ac8bb458c66` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of bed10a47

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Cross-reference (12), Readings bearing on it. Two readings at the ruling stage bear on this node's answer at an option its recommendation has left: `commons.systems/disposition-graph/plato-maieutics` and `commons.systems/disposition-graph/plato-periagoge` both record `commons.systems/disposition-graph/growth#answer#standing (adopted)`, while this node's facts read `answer: recommends turn-form-to-a-child-and-terms-aligned (moderate)`. By `readings`' own rule a tradition adopted on an option not chosen projects as chosen over, so the record now says Plato was considered and passed over on growth, which is not what either reading's answer says.
- Redundancy (9), Answer and the reading beneath it. The Republic loci for the periagogic movement are stated in two places, and the repair is recorded as two uncoordinated options rather than one: this node carries `cite-the-reading` — "Growth's answer drops its own Republic citation for the periagogic movement and cites this reading instead, so the loci are stated in one place." — while `plato-periagoge` carries `citation-once` — "The Republic loci are stated once, on this reading, and growth cites the reading instead of restating them. Growth's answer cites 518b to d while this node's source adds 521c and 515c to 516a, so the record gives the same conduct two citations and growth's periagogic movement requires probes cited by locus." Ruling either alone leaves the duplication half-cured.

Strongest counter-argument (moderate): The recommendation mints a child, `turn-form`, out of the answer of the node that settles sixty-eight others, and it does so while `turn-form` already stands in the graph at the ruling stage with its own recommendation, so the author is asked to authorize a decomposition that has already happened. The frontier reads the same shape elsewhere as the sixteenth validation's error: a node whose only possible answer is a reading of its parent's answer is a probe on the parent, and `turn-form`'s question, which of four forms a turn takes, is put most naturally as "on growth, which did you intend". Against that, the four turn forms are cited by `plato-periagoge` and `plato-maieutics` on their own account, which is the survival test the same validation sets, so the child survives it.

### Frontier finding, 2026-09-07

Kind: cross-reference.

Two readings at the ruling stage bear on options their targets have left, so the record projects the opposite of what the readings say. `plato-maieutics` records `commons.systems/disposition-graph/growth#answer#standing (adopted)` and `plato-periagoge` records the same, while `growth`'s facts read `answer: recommends turn-form-to-a-child-and-terms-aligned (moderate)`; `plato-maieutics` further records `commons.systems/disposition-graph/alignment-page#answer#every-fact-every-option (diverged)` while `alignment-page` recommends `the-context-pane-previews-the-selected-option`. Under `readings`' own derivation, chosen over is derived for "a tradition adopted on an option not chosen", so both Platonic readings now project as considered and passed over on `growth`. `readings` states the duty that would prevent this and declares it unmet: the re-pointing is "stated here and unchecked, unmet across the record at this commit", over the 109 `bears` entries its option `re-pointing-checked` measures.

Also named: commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/plato-periagoge, commons.systems/disposition-graph/alignment-page, commons.systems/disposition-graph/readings.

Proposed: The survivor is `readings`' re-pointing duty, made checkable: `re-pointing-checked` is the option that carries it, and the two Platonic readings' `bears` entries are re-pointed at the options their targets now recommend before either node is ruled. Nothing merges; what moves is the pointer, and the check moves from prose into the validator so that the twelfth validation is not left to a reader's memory across 109 entries.

Recorded as an option on commons.systems/disposition-graph/plato-maieutics's answer fact: `bears-repointed-to-the-recommended-option` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

authority's standing answer: 'no stamp is written beside them: a node\'s class is read off those rulings, and a node no ruling grants is unanswered'. Standing answers that still define the node by a stamp: node 'Every node carries a stamp, or it is an open question awaiting its answer'; growth 'a ratification is recorded as the stamp in the author\'s name with the ruling quoted'; projection 'an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected'; traditions-home 'A tradition root is a node like any other, a question, an answer, a form and a stamp'. quotes' option `stamp-vocabulary-struck-from-the-live-options` reaches only quotes' own options.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/node, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/quotes.

Proposed: authority's vocabulary survives: class, ruling, fact, option. node, growth, projection and traditions-home are amended to define a node by the rulings on its facts, and the record's use of stamp is confined to authority's historical sentence about the stamps the bootstrap wrote.

Recorded as an option on commons.systems/disposition-graph/node's answer fact: `a-node-is-classed-by-the-rulings-on-its-facts` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

The record's term is option, and growth carries '`rejected-alternative-is-an-option` — source commons.systems/disposition-graph/rejected, passed over' while the brief's vocabulary line still reads 'rejected — term: rejected alternative'. Standing texts using the struck term: frontier-consistency 'it is recorded as an alternative on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which' and 'it adopts a listed alternative or the node as it stands'; node 'The rationale says why, and which alternatives were rejected and for what reason; the page projects those alternatives beside the stamp.'; transience 'the alternatives pending, each with its source'; projection 'the alternatives the rationale rejected'. node's 'The rationale says why' and prose-and-structure's 'A node\'s prose is its disposition, its answer, its rationale and its account' also name a `## Rationale` that dialogue strikes.

Also named: commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/node, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/projection.

Proposed: viable-options survives; the four nodes are amended to say option, and node and prose-and-structure to name the sections dialogue keeps (`## Facts`, `## Account`) rather than rationale and disposition.

### Frontier finding, 2026-09-07

Kind: stale-recommendation.

readings' answer: 'the option\'s readings are the derived inverse of what the readings bear on' and 'the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures'; its option `the-rung-clause-is-stated-once` quotes the rule 'where an option is a lower rung of another, contained in it and not declined, the relation stays on the containing option, since a relation stored on the rung would project as chosen over'. Readings whose `bears` name an option the target no longer recommends: eight under review-skills carry 'option: two-skills-one-package' while review-skills 'recommends the-survey-skill-launches-a-selected-reading (moderate)'; fagan-inspection-roles carries 'option: split-survey-from-per-draft' on frontier-consistency, which 'recommends the-judged-set-and-its-comparisons-move-to-survey-selection'; codd-update-anomaly bears on recording#per-fact-after-two-readings while recording recommends `the-confirmation-folds-an-already-accumulated-node`; ibis-issue-based-information bears on readings#relation-per-option while readings 'recommends the-relation-is-projected-onto-the-option-as-one-of-three'; plato-maieutics carries 'commons.systems/disposition-graph/growth#answer#standing (adopted), commons.systems/disposition-graph/alignment-page#answer#every-fact-every-option (diverged)' while growth's list marks '`turn-form-to-a-child-and-terms-aligned` — source ai, recommended', and plato-maieutics' own option says 'so the record currently derives this tradition as chosen over on `growth` — the opposite of what the reading\'s own answer says.' Each of these traditions projects today as chosen over on the node it was read for.

Also named: commons.systems/disposition-graph/readings, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/alignment-page, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand.

Proposed: readings survives. Each reading named is re-pointed under the rung clause: where the recommended option contains the one borne on, the relation moves to the containing option; where it does not, the reading records diverged on the recommended option with its reason. plato-maieutics' existing option `bears-repointed-to-the-recommended-option` is the same proposal on that node; frontier-consistency's validation 4 gains the re-pointing check readings' `re-pointing-checked` records there.

Recorded as an option on commons.systems/disposition-graph/readings's answer fact: `the-relation-is-derived-through-containment` (source review, 2026-09-07).

### The movements as iteration, 2026-09-08

P3 of `words/2026-09-08/37` states that probe review is iterative and supersedes the
sequential periagogic, maieutic and review phases. That is this node's answer fact: the
sequence is what this node's recommended text describes, and the option is recorded above.

The mark does not move, and the reason is the author's instruction rather than the AI's
caution. The same entry opens by making the probes that establish expert grounding the
sitting's first priority; an expert has been convened on this fact, identity
`dialectical-conduct`, scope this answer fact, grounding the conduct of structured
inquiry, and the question it was given is squarely whether iteration preserves what the
sequence bought. Moving the mark before it returns would settle on the AI's own reading
the question the author has just directed the sitting to put to an expert.

Two neighbours carry the same change and neither is reconciled to it here.
`movements` replaces the sequence with a diagnosis that selects among the movements,
which is a third answer and not this one. `alignment-target`'s recommended option still
says "the clean-context review when the draft has not had it" and that "a denial resumes
the dialogue at the movement it calls for", both of which this option and P3 strike. The
parser hard-codes the sequence as well, `read.mjs` fixing the four stages and three
option sources, with 238 options presently carrying `source: review`; that is
implementation and lands on the other ref, and it is named here so the cost of the
change is visible where the change is proposed.

### The second expert, on this fact, 2026-09-08

`dialectical-conduct` was convened on this answer fact under the author's grant, its
grounding the conduct of structured inquiry, and its return is recorded above as the
option `growth-answers-the-acts-and-cites-its-children` with its choice among the
existing options, `split-presentation-and-movements` amended. It read the nine live
options of the twenty-seven then on the fact and returned a support and a divergence for
each, treating the nineteen passed options as closed to it; it reports that the brief did
not say whether a passed option is open to an expert, and that every expert on this fact
will therefore have resolved the question differently.

The recommendation does not move, and the reason is recorded rather than assumed. The
expert reports its own choice as steered: the brief told it that `movements` "owns the
movements themselves", which is false on the record -- `movements.md` says "Nothing moved
out of `growth`. Its answer still states the movements and still defines `periagogic` and
`maieutic`" -- and the false sentence was placed third in the reading order, which is
where a brief puts what it wants held in mind during judgment. The expert says a reviewer
should treat its §2 as the option a steered expert would have produced anyway, and offers
one piece of counter-evidence, that it reached the same place from a check the brief
could not have planted, namely that `growth` and `movements` now carry two different
answers to one question. The main thread takes the report at its word: the option stands
and the mark does not move on it.

What survives the contamination and bears on the standing recommendation is a
measurement rather than an argument. The expert found that `growth` carried no reference
to `words/2026-09-08/36` or `/37` on any option while seventeen other node files carried
36, and that the recommended option's own content still states the sitting moves in order
through six named movements including the clean-context review, and that the recording is
kicked back to the movement it calls for -- three clauses entries 36 and 37 strike. Half
the measurement has since been repaired by this sitting at `57adb63b`; the absence of
entry 36 from this node remains, and is the reason the recommendation should not be put
to the author in its present state.

Two of the expert's findings are recorded elsewhere because they belong elsewhere: its
account of what the clean-context review buys that an expert system does not is on
`clean-context-review`, and the brief-bias instance is on `expert-instructions`.

### Frontier survey, 2026-09-09, of b49c1171

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The node whose recommendation is `turn-form-to-a-child-and-terms-aligned` glosses none of the terms it claims. Its header line reads "- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)" — seven `defines` entries, every one of them empty, on the node whose answer is that the terms are aligned. The mechanical tier does not reach this: `term-without-a-path` reports only that a node "uses the term 're-grasp', which commons.systems/disposition-graph/instruments defines, with no path to it over 'under', 'depends' or 'cites'", which is reachability to a definer and not whether the definer's gloss is empty.

Strongest counter-argument (moderate): An answer that aligns the record's terms is recommended by a node that has defined none of its own. `growth` claims `propose`, `project`, `ratify`, `steer`, `periagogic` and the rest in its `defines` and leaves all of them "(no gloss yet)", so the alignment it recommends has no anchor on the node that recommends it, and eleven of the twenty-one nodes this survey judged are in the same state. The debt is invisible to the mechanical tier, which checks only that a used term has a path to some node claiming it, so nothing in the record measures it and this reading is the first to.

The session's reply: Kept, and its measurement corrected upward. This reading counted eleven ungloss'd `defines` within its own judged set; across the whole record the count is thirty-three nodes carrying ninety-six bare terms. The survey's number is honest for its object and understates the debt by three-fold, which is itself the finding: no instrument measures this, so every count of it is a count someone took by hand. The fill is owed on this node and is bookkeeping rather than a redraft, so no stage moves for it. The counter-argument stands unanswered on its merits: the node whose answer is that the record's terms are aligned has glossed none of the seven it claims.

### Frontier finding, 2026-09-09

Kind: vocabulary.

Eleven of the twenty-one judged nodes claim terms in `defines` and gloss none of them, including two at the ruling stage. The header lines read, verbatim: "- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)" (`growth`); "- Defines: `confirmation` (no gloss yet); `kickback` (no gloss yet); `steelman` (no gloss yet); `substance` (no gloss yet)" (`recording`); "- Defines: `clean-context review` (no gloss yet)"; "- Defines: `option` (no gloss yet); `viable` (no gloss yet); `grant` (no gloss yet)" (`viable-options`); "`doctrine` (no gloss yet); `proposal` (no gloss yet)" (`authority`); "- Defines: `neighbourhood` (no gloss yet)" (`review-cost`); "- Defines: `probe` (no gloss yet)" (`author-questions`, at the ruling stage); "- Defines: `frontier survey` (no gloss yet)"; "- Defines: `reading` (no gloss yet); `tradition` (no gloss yet); `adopted` (no gloss yet); `diverged` (no gloss yet); `chosen over` (no gloss yet)" (`readings`); "- Defines: `seam` (no gloss yet)" (`decomposition`); "- Defines: `session context` (no gloss yet); `rules` (no gloss yet)" (`session-context`, at the ruling stage). Two of them are worse than empty. `authority` glosses both its terms in its own answer — "Doctrine is the ratified answers taken together." and "A proposal is technical vocabulary and is not overloaded" — so the definition exists everywhere but the entry the term index reads. And `viable-options` claims `grant` while `what-acts-during-bootstrap` defines the same thing under another name: "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant." The mechanical tier does not reach any of this: `term-without-a-path` reports only a used term "with no path to it over 'under', 'depends' or 'cites'", which presupposes a definer and never asks whether the definer said anything.

Also named: commons.systems/disposition-graph/recording, commons.systems/disposition-graph/clean-context-review, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/review-cost, commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/session-context, commons.systems/disposition-graph/what-acts-during-bootstrap.

Proposed: Each node fills the glosses it claims, which is a fill and not a redraft, so no stage is owed for it and none is named here except where the answer itself is implicated. The two exceptions: `authority`'s glosses are copied from its own answer, which is bookkeeping; and `viable-options` and `what-acts-during-bootstrap` settle between them who defines the grant, since one claims the term with nothing behind it and the other defines the thing under the name `bootstrap authority` — the survivor is `what-acts-during-bootstrap`, which has the author's own term and a gloss, and `viable-options` drops the claim or points at it. A node that cannot gloss a term it claims is claiming a term it does not own, and dropping the entry is the other way to close it.

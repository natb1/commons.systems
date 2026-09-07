---
question: What does the author read to rule?
stage: ruling
probes:
  - id: unit-of-a-ruling
    asks: >-
      What is the unit the author confirms when they rule on a node?
    fact: answer
    why: >-
      The author asked for a ruling decomposed into aspects, each with its own
      choices and recommendation, and the record as it stood made a
      recommendation one whole-node adoption with one class and one boldness;
      whether the aspects are derived by the page from what the record carries
      or recorded on the node was not derivable from anything in it.
    discharges: >-
      What list A holds, which moves the answer fact's recommendation.
    source: ai
    raised: 2026-09-03
    status: discharged
    reason: >-
      The author answered on 2026-09-03, quoted under this node's `##
      Disposition`, that the revised record carries a decision per aspect, each
      aspect with choices requiring confirmation and a recommendation with
      confidence; the node's `### The probe answered, 2026-09-03` records what
      the ruling settles for the page. Under the probe-or-node rule of
      2026-09-04 this entry was not a probe: the response is carried on five
      nodes, founded `aspects-are-nodes`, and stands as dialogue's and
      recording's answers, both already in this node's `depends`.
  - id: permanence-or-persistence
    asks: >-
      Which fact did the author mean by "permanence"?
    fact: persistence
    why: >-
      The author's words of 2026-09-03 named permanence, and the record's
      reserved fact is persistence; nothing in the record decided whether a
      fifth fact was intended.
    discharges: >-
      Whether a fact is owed, which moves the persistence fact.
    source: ai
    raised: 2026-09-03
    status: discharged
    reason: >-
      The author answered on 2026-09-03, quoted under this node's `##
      Disposition`, "I said permanence but I meant persistence".
  - id: boldness-renamed-to-confidence
    asks: >-
      Is boldness renamed to confidence, and is the rename a change of meaning?
    fact: answer
    why: >-
      The author's words of 2026-09-03 called the field confidence; boldness is
      defined on `growth` and is a field on every recommendation, and a rename
      touches four answers, so whether it was a rename or a change of the
      measured quantity could not be read off the words.
    discharges: >-
      What the page shows beside a recommendation and what `growth` defines,
      which moves this node's answer fact and `growth`'s.
    source: ai
    raised: 2026-09-03
    status: discharged
    reason: >-
      The author answered on 2026-09-03, quoted under this node's `##
      Disposition`, "stick with boldness then, I want to know how much rests on
      the AI's own knowledge against the record"; the rename is retracted.
      Under the probe-or-node rule of 2026-09-04 this entry was not a probe:
      its `discharges` names two nodes' recommendations, and the response
      stands as growth's gloss on `boldness`. Growth is not entered in this
      node's `depends` because growth already waits on this node, and a cycle
      is no order.
  - id: stands-as-a-draft-no-one-has-confirmed
    asks: >-
      Is the row status "stands: a draft no one has confirmed" recording
      anything useful, or does the stands status go with the chips the
      author's words of 2026-09-04 strike from the row?
    fact: answer
    why: >-
      the phrase is this node's own naming rule for the option that keeps the
      standing text where no ruling stands on the answer fact, rendered as a
      pill on every such row; the author asked the question of the AI in the
      words carried on what-an-option-row-carries, and whether the status is
      among the three things that node keeps on the row is a fact about what
      they meant.
    discharges: >-
      whether the `stands` status survives on an option's row under
      what-an-option-row-carries, which decides the row.
    source: author
    raised: 2026-09-04
    status: discharged
    reason: >-
      the author answered it on 2026-09-06, in the words quoted in
      `## Disposition` on `what-an-option-row-carries` and in this node's own
      `## Disposition`: what `stands` could represent is the prior confirmed
      disposition, if any, and since there are no confirmed dispositions
      currently no indication of it is expected. What that answer does to the
      naming rule below is `what-an-option-row-carries`' maieutic movement.
facts:
  - name: answer
    options:
      - name: three-column-ruling-screen
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: dominated by the author's words of 2026-09-04, which strike the fold it carries
      - name: stage-counts-kept
        source: ai
        ref: "2026-09-04"
      - name: metrics-link-into-the-page
        source: ai
        ref: "2026-09-04"
      - name: decisions-are-the-widest-column
        source: ai
        ref: "2026-09-04"
      - name: every-fact-every-option
        source: ai
        ref: "2026-09-04"
      - name: independent-decisions-as-children
        source: review
        ref: "2026-09-04"
      - name: case-against-in-the-drill-down
        source: author
        ref: "2026-09-04"
        status: passed
        reason: "it answers the what-an-option-row-carries node's question, where it is recorded as case-against-to-the-details"
        supports:
          - words/2026-09-04/1
          - words/2026-09-04/2
          - words/2026-09-04/3
          - words/2026-09-04/4
          - words/2026-09-04/5
          - words/2026-09-04/6
          - words/2026-09-04/7
          - words/2026-09-04/8
          - words/2026-09-04/9
          - words/2026-09-04/10
          - words/2026-09-04/11
          - words/2026-09-04/12
          - words/2026-09-04/13
          - words/2026-09-04/14
      - name: case-against-after-the-review-only
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it answers the what-an-option-row-carries node's question, where it is recorded as ai-line-until-a-reading-returns and is passed over there"
      - name: kick-back-feedback-one-step-down
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it answers the when-the-kickback-feedback-shows node's question, where it is recorded under the same name, with this node as its source, and is passed over there"
      - name: eyebrow-settles-and-pending-only
        source: ai
        ref: "2026-09-04"
      - name: open-probe-count-on-the-chip
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-04"
      - name: page-collects-only-the-confirmation
        source: author
        ref: "2026-09-06"
        supports:
          - words/2026-09-06/1
          - words/2026-09-06/2
          - words/2026-09-06/3
      - name: standing-named-in-the-pane
        source: commons.systems/disposition-graph/where-the-unconfirmed-indication-goes
        ref: "2026-09-06"
      - name: standing-sentence-stored
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it answers the dialogue node's question, where it is recorded as standing-option-carries-a-subsection"
      - name: kickback-count-metric
        source: commons.systems/disposition-graph/not-proven-third-verdict
        ref: "2026-09-04"
      - name: live-re-render-per-choice
        source: review
        ref: "2026-09-04"
        status: passed
        reason: "the encoding gives text only to the option a fact recommends, so a choice of a delta option has no text to render"
      - name: progressive-disclosure-diverges-on-the-fold
        source: commons.systems/disposition-graph/progressive-disclosure
        ref: "2026-09-05"
      - name: account-not-on-the-page
        source: commons.systems/disposition-graph/the-account-on-the-page
        ref: "2026-09-06"
      - name: copy-control-beside-the-launch-link
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/1
          - words/2026-09-04/2
          - words/2026-09-04/3
          - words/2026-09-04/4
          - words/2026-09-04/5
          - words/2026-09-04/6
          - words/2026-09-04/7
          - words/2026-09-04/8
          - words/2026-09-04/9
          - words/2026-09-04/10
          - words/2026-09-04/11
          - words/2026-09-04/12
          - words/2026-09-04/13
          - words/2026-09-04/14
      - name: clauses-cited-not-restated
        source: review
        ref: "2026-09-07"
      - name: the-context-pane-previews-the-selected-option
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-03/16
          - words/2026-09-03/17
          - words/2026-09-03/18
          - words/2026-09-03/19
          - words/2026-09-03/20
          - words/2026-09-03/21
          - words/2026-09-03/22
          - words/2026-09-07/1
          - words/2026-09-07/2
          - words/2026-09-07/3
          - words/2026-09-07/4
    recommends: the-context-pane-previews-the-selected-option
    boldness: moderate
    against: "The delta encoding still puts five independent decisions in one radio group, the metric set, where each metric links, the division of the two content columns, the eyebrow's contents, and where the indication that a text is unconfirmed sits, so a combined ruling needs a confirmation with edits; the children the earlier review proposed would give each its own text, reading and pane."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "The fold's removal took away the page's capture-shaped mechanism and a page is cheap to fix, so deferred would let the layout act while the author works the frontier."
  - name: persistence
    options:
      - name: with the page's shim
      - name: without it
    recommends: with the page's shim
    boldness: low
    against: "The shim describes a read-back mechanism the ruling-transport node owns, and could leave that clause to that node's shim."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 184c3341ed274c0a5ae84adef73d9df9363e2de8
  commit: d4ab02834a08930a67d9b5885708f3f23f7a9153
  against: "The rewritten closing sentence for `every-fact-every-option` adopts the previous reading's own suggested wording almost verbatim, including the claim that the fence is extended by exactly \"one sentence\"; the fence's middle-column paragraph (unchanged by this diff, and outside this delta's scope since it predates the pinned commit) arguably carries more than one new clause/sentence describing the re-rendering behaviour, so the amendment's self-description may slightly overstate its own precision. This is inherited from the previous reading's suggested text rather than introduced independently by this repair, and it does not touch anything the previous reading or the survey's three findings actually raised, so it does not block forwarding."
  survey:
    date: 2026-09-07
    of: 94465d401a161fed15196ead1c0e71bd5950de58
depends:
  - commons.systems/disposition-graph/dialogue#every-part-in-the-record
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/recording#per-fact-after-two-readings
  - commons.systems/disposition-graph/unanswered#confirmation-before-the-ruling-stage-is-invalid
  - commons.systems/disposition-graph/author-questions
  - commons.systems/disposition-graph/viable-options
  - commons.systems/disposition-graph/authors-words-on-the-page
  - commons.systems/disposition-graph/how-a-fact-is-headed
  - commons.systems/disposition-graph/vocabulary-option-summary
  - commons.systems/disposition-graph/what-an-option-row-carries
  - commons.systems/disposition-graph/which-facts-are-listed
  - commons.systems/disposition-graph/when-the-kickback-feedback-shows
  - commons.systems/disposition-graph/where-a-change-request-goes
  - commons.systems/disposition-graph/where-the-unconfirmed-indication-goes
under:
  - commons.systems/disposition-graph/projection
---

## Facts

### answer

`the-context-pane-previews-the-selected-option` is recommended since 2026-09-07: it is `every-fact-every-option` with the right-hand column's sentence extended, so that the column holds the node as it would stand under the option selected in the middle column, resolved from that option's content, and says so where nothing is confirmed, on the author's refinement of that day quoted under `## Disposition`. Its own support and divergence are under its subsection, and what follows is the reason the text it amends was recommended on, which the amendment carries except where it says otherwise.

The author's words of 2026-09-04 on the layout of the questions settle the shape: every fact listed and none folded, every option under each with its sentence, its status and what tradition says of it, the kick-back last and typed to the maieutic movement, the drill-down beneath each row with the author's reason in it, the inputs disabled off the ruling stage, the ruling on the whole liquidated and the graph gone from the eyebrow. What rests on the AI is everything those words did not fix, and each of it is an option on this fact beside the recommendation: the case against the recommended option on its row, which amends the author's placement of the AI's explanations, and when that case is written; the kick-back's marking and where its feedback sits; the readiness on the stage chip, because the review's section could not merge into the facts; the eyebrow's remaining contents; how the standing option gets its sentence; the metric set, where each links, and the sixth metric; the division of the two content columns; the recovery of the confirmation with edits through the option's own text; and the edit-led presentation of a draft, which departs from the dialogue node's rule and is decided there. Every option on this fact other than the superseded answer is the recommended text with one clause changed, and a ruling for one of them rules for that whole text with that clause changed, the author's edits in the option's text carrying whatever else they want changed; the review's proposal that those decisions be minted as questions under this node is recorded beside them, and three of the decisions in that list are no longer this fact's to rule: the case against the recommended option and its timing, and where the kick-back's feedback sits, are the children's, and the three options that carried them here are passed over on 2026-09-07 to `what-an-option-row-carries` and `when-the-kickback-feedback-shows` by name. Moderate boldness: the shape is the author's words of three sittings, and what rests on the AI is those additions, none of them structural and every one of them recorded.

#### three-column-ruling-screen

The answer as it stood on 2026-09-04 before the author's refinement of the layout of the questions: the same rail, metrics, columns, gate, naming rule, widths, chip and staging, with a decision asked only when its boldness was anything but low and folded unasked into the rendered disposition when it was low, a ruling on the whole beneath the decisions carrying its own caption, the review as a section of drill-downs, and the eyebrow unnamed. `every-fact-every-option` is this answer with the fold struck and its consequences drawn.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, in the author's words of 2026-09-04, that each fact is listed without exception, and what the fold measured: twelve nodes on the page as built showed the author no decision at all, nine because every fact on them folded, two of those global-tier rules, and three because they carried no facts and printed the same sentence where it was false.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

One node at a time, on a three-column screen, in the ruling order.

The rail, on the left, carries the metrics at its top and then every unanswered node in the ruling order, flat, each row showing the node's question, its graph, its stage, its settling count, and a mark when a response is staged on it. The selected row is marked as selected, and selecting a row is what changes the other two columns. Once one node is shown at a time the rail is the only place the whole frontier is visible, which is why the metrics sit there, why it lists every node, and why it filters and pages nothing.

A metric on this page is a signal, an instrument, or a criterion of a recorded disposition and never a count for its own sake; each names the disposition it instruments and links to that node in the browser, which addresses every node by its id where this page has no route to one. Four meet that standard. Open, the size of the outstanding dialogue, for the unanswered node, under which every node is unanswered until the author confirms it, so the count is the author's outstanding authority. Ruleable, the nodes whose clean-context review is behind them, for the clean-context-review node, which is what stands between a draft and the author, so the count is what can be ruled now. Next settles, what a ruling on the first node in the order would make decidable, for the alignment-order node, whose answer is that the ruling settling the most comes first, so the count is what one ruling buys. Stale, the nodes whose review pin or recommendation pin no longer matches the text it read, for the frontier-consistency node, whose validations catch it, so the count is how much of what looks ruleable rests on a reading of text that has since moved. The stage counts, the per-graph lines, and the lede go: a stage count instruments no disposition, and a graph is a label on a row rather than a division of the order.

The middle column holds everything the ruling asks, and the right-hand column holds nothing but the disposition itself. The stage is what the column says first, because the stage names the movement owed and so what the column is for: at the periagogic stage the ask is the author's own account of the ground and the free-text control for it leads; at the maieutic stage it is the author's intention. Only the ruling stage takes a response. A confirmation recorded on a node that has not reached that stage is invalid, as the author ruled on 2026-09-04, so at every earlier stage the decisions, their choices and the recommendation are all rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it. This supersedes the same day's earlier clause, that the controls run ahead of the dialogue marked rather than withheld on the argument that the author may rule at any stage. They may, and the way they do it is to move the node's stage in the dialogue; a live control on a periagogic node does not offer that, it offers an act the record will not honour. Where the stage asks for the author's words and the node carries none, the column says that in as many words rather than rendering an empty space, because "nothing of yours is recorded here, and what the answer says the AI drafted" is the fact those stages exist to change, and a blank says it to no one.

Then the decisions. They are the node's own answer, where alternatives are pending on it, and its asking facts: the authority class a confirmation would confer, the node's existence, and its persistence where the recommendation would change the node's shape. Each is labelled with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked. Under each are its choices, and a choice row leads with what that choice would answer, in the sentence the record holds for it, carrying its name beside that as the handle the record files it under. A row that shows only the name shows the author a list of identifiers: the name is how a ruling is stored and the sentence is the decision. A fact's choices are vocabulary rather than slugs, but the rule is the same and they carry the same sentence: what confirming that choice would mean, in the words the node defining the fact uses for it. The authority class is the most repeated decision on the page and rendered as the two bare words `ratified` and `delegated` it told the author nothing they did not already have to know. The recommendation among the choices is marked, its boldness shown, the rest of the row's text beneath it as drill-down, one simple input records or edits the choice, and a last row rejects every choice on that decision with feedback.

A choice that keeps the text already in the record is named for the authority that text has and never for more. Where the answer is ratified, the choice is the answer as ratified and a confirmation keeps it. Where it carries a deferred stamp or none it is a draft no one has confirmed, since a deferred answer is unanswered until the author rules, so the choice says that confirming ratifies the AI's draft. Naming it "the node as it stands" claims a standing the text does not have, and it reads as the safe and ordinary choice when on an AI-drafted node written in the author's own voice it is the least safe one available. Where no answer stands at all the choice is not offered, because there is nothing to keep.

A decision is asked whenever its boldness is anything but low, and folds unasked into the rendered disposition when its boldness is low; nothing else folds, and a session that folds against that rule records the override and its reason in the account. Because boldness measures how much rests on the AI's own knowledge against the record, high boldness is low confidence: reading the author's words, that very high confidence can just be included in the final render, straight off the stored field and without that inversion would ask about everything the AI is surest of and fold everything it is least sure of.

Beneath the decisions, the ruling on the whole, with the caption that says what a confirmation would do sitting on the control itself and not across the screen from it, so that it cannot say nothing else is proposed while the decisions above it propose something. Beneath that, what a ruling here makes decidable: the node's unanswered children and the open questions that name it, what each asks, and that a ruling here is what makes them decidable. They are indications and never rows. Every decision that is a question is a node, and a node is ruled from the rail in its own turn in the one order, so a screen offering its children as confirmable rows would impose a second order on nodes the one order has already placed. Last, as drill-downs, the review's reading of the node, the author's words, and the AI's account -- except at the two stages that ask for the author's words, where what they have already said on this node comes up beside the control asking for more, open, rather than staying folded three sections below the question it answers.

The right-hand column is the disposition and nothing else: the node as it would stand under the choices made so far, re-rendered as each choice changes, with the folded decisions simply present in it and never asked about. Where an answer stands it leads with the edit this ruling would make, and where none stands it shows the whole. The edit says what it is an edit against, because a diff implies a ground and the ground here is usually a draft: against the ratified answer where there is one, and against a draft no one has confirmed where there is not. That is the author's finding of 2026-09-03 on `commons.systems/disposition-graph/purpose`, that a node "still indicates that it is an edit to a confirmed disposition ... even though no node is yet confirmed". The diff is not what was wrong and it stays; what was wrong was letting it imply a standing its base does not have. Nothing that is about the ruling shares the column with it -- no control, no caption, no indication, no drill-down -- because the column's one job is to show the author the thing they are ruling on, and every sentence of apparatus in it is a sentence they must read past to see it. Where there is no disposition to show, because the node has neither an answer nor a recommended text, the column is not held open: the item is one column and the line saying so follows the ask, since half a screen of white reserved for a sentence is the same fault as apparatus in the column, spending the reader's attention on something that is not the node.

The rail is fixed and narrow. The middle and the right share what is left, near enough evenly, and the disposition can take the whole screen on demand. Before the refinement the right-hand column was the widest, on the argument that the node is the thing in view while the decisions are worked; that argument survives, but the middle column now carries the stage's ask, the decisions, the ruling on the whole, the indications and three drill-downs, and a working column starved to a third is a worse failure than a reading column at a half. Neither is the author's ruling: the author moved the material and said nothing about width, and this is the consequence drawn from it.

What an earlier stage offers instead is the dialogue itself. The stage is a chip, and the chip carries two controls: one opens an alignment session on this node, as a plain link so that leaving the page reads as leaving the page, and one copies the instruction that starts it, `/align <the node's id>`. The two are the same instruction by two routes, one for a reader who can follow the link and one for a reader who is somewhere else. The page's own two controls at the top are the same pair at the scale of the whole sitting: one records every staged response where a session reads them back, and one copies the instruction that carries them into a session by hand, and they say which is which rather than leaving the author to infer it from a verb.

A response is one of the three the unanswered node opens and this page adds none: choosing the recommendation's choice on every asked decision and confirming the whole is a confirmation; choosing any other and confirming is a confirmation with edits; a rejection row, on one decision or on the whole, is a denial with feedback. Responses stage and submit together across nodes, so selecting another node never discards one, and the rail marks every node that carries a staged response.
```

#### stage-counts-kept

The four stage counts stay among the metrics, on the argument that the author needs to see what is coming, how much sits at the periagogic stage and how much at review, and not only how much can be ruled now.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: a stage count instruments no disposition, which is the standard the author set for a metric, and what is coming is already carried by the open count and by the order itself.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The four stage counts stay among the metrics, on the argument that the author needs to see what is coming, how much sits at the periagogic stage and how much at review, and not only how much can be ruled now.
```

#### metrics-link-into-the-page

Each metric links to the first node on this page that it counts, keeping the author inside the page, rather than out to the disposition it instruments in the browser.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the author's standard is that the metric hyperlinks to the disposition, and a disposition leaves this page the moment it is answered, so all five links would break on the rulings that make them true, on four rulings, since Ruleable and Survey owed both name the clean-context-review node.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

Each metric links to the first node on this page that it counts, keeping the author inside the page, rather than out to the disposition it instruments in the browser.
```

#### decisions-are-the-widest-column

The decisions take the widest column and the node as it would stand sits in a narrow pane beside them, which is the plainer reading of the author's own phrase, "right aligned context pane".

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the reason the sitting read into the author's move, that the result should be in view while the list is worked, which the author's words do not give, and a whole node's text in a narrow pane is not in view. The answer takes that reading over the noun and lets the pane expand to the whole screen on demand; a ruling for this alternative takes the noun.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The decisions take the widest column and the node as it would stand sits in a narrow pane beside them, which is the plainer reading of the author's own phrase, "right aligned context pane".
```

#### every-fact-every-option

Every fact the node carries is listed and none folds, and boldness stays shown on the recommendation and acts on nothing; each option's row leads with its sentence, carries its status as the record holds it and what each reading bearing on it says, and the recommended option's row carries beneath its sentence the strongest case against it, in one line, written by the AI and replaced by the clean-context review's counter-argument when the review returns one; everything else on an option is one step down, with a text control for the author's reason and any edits; the last row on every fact is the kick-back, set apart, captioned with what it does to the node, its feedback opening with it, typed to the maieutic movement; the review keeps no section, its readiness going to the stage chip and its counter-argument to the row it argues against; the ruling on the whole goes, the confirmation with edits riding on the option's text instead; the sentence for a reserved fact's choice is projected from the node that defines the fact and the standing option's row leads with the answer's own first sentences beside the standing the text has; and the eyebrow says what placed the node in the order and nothing else. The page renders the structure and never reads prose for what it holds, so its completeness is the facts' completeness, which is the prose-and-structure node's question. The author's words of 2026-09-04 fix every fact listed, every option with its summary, the status of the recommendation and of tradition on each, the radio disabled off the ruling stage, the drill-down with the author's reason, the kick-back last and typed to the maieutic movement, the review merged, the ruling on the whole liquidated and the graph gone from the eyebrow; the AI's are the case against on the row, which amends the author's placement of its explanations, its timing, the kick-back's marking and the place of its feedback, the eyebrow's remaining contents, the standing option's sentence, the metric set and the fifth metric, the columns' division, and the edit-led draft. Recommended from 2026-09-04 to 2026-09-07, when `the-context-pane-previews-the-selected-option` superseded it, keeping its text as the base the fence extends by one sentence.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

From: the-context-pane-previews-the-selected-option

```diff
@@ -17,7 +17,7 @@
 
 A metric on this page is a signal, an instrument, or a criterion of a recorded disposition and never a count for its own sake; each names the disposition it instruments and links to that node in the browser, which addresses every node by its id where this page has no route to one, and a node the browser does not render, one with no answer yet, is named by its id and not linked, the metric saying so. Five meet that standard; a sixth, kick-backs per node and per sitting, is on this fact as an option raised by the not-proven-third-verdict reading. Open, the size of the outstanding dialogue, for the unanswered node, under which every node is unanswered until the author confirms it, so the count is the author's outstanding authority. Ruleable, the nodes with both readings behind them, a forward review pinned to the recommendation as it stands and a survey pin on the same, for the clean-context-review node, whose recommended option `per-draft-and-survey` is what stands between a draft and the author, so the count is what can be ruled now. Next settles, what a ruling on the first node in the order would make decidable, for the alignment-order node, whose recommended answer is that the ruling settling the most comes first, so the count is what one ruling buys. Stale, the nodes on which either reading's pin, or a ruling's, no longer matches the text it read, for the frontier-consistency node, whose validations catch it, so the count is how much of what looks ruleable rests on a reading of text that has since moved. Survey owed, the nodes at the review or ruling stage that no survey has pinned or whose survey pin is stale, for that same option of the clean-context-review node, so the count is what the survey must read before any of it can be ruled. The stage counts, the per-graph lines, and the lede go: a stage count instruments no disposition, and a graph is a label on a row rather than a division of the order.
 
-The middle column holds everything the ruling asks, and the right-hand column holds nothing but the disposition itself: the node as it would stand under the option selected in the middle column, resolved from that option's content and re-rendered as the selection moves, so that the author reads what they are about to confirm and not what stands beside it. With nothing selected it holds the node as it stands, which is the content of the option last confirmed, and where none has been it says so rather than rendering a draft in that place. The column is headed by the node's question and its id, and beneath them one line saying what put the node where it is: its settling count, which is what placed it in the order; the options pending on it, which the alignment-order node shows beside that count as what a sitting will cost; and the nodes it stands under, whose grant a ruling here would fall within and whose rulings made this one decidable. Nothing else is in that line. The graph is already in the id above it; the rank breaks ties in an order the rail already shows; and the class is read off the rulings on the facts, which the column renders one by one directly beneath, so a word summarising them there is the facts said twice. The line is named here because a line no answer names collects what no answer justifies, which is what had happened to it. The stage is the first thing the column says of the ruling, because the stage names the movement owed and so what the column is for: at the periagogic and the maieutic stages what is owed is the author's own words, which the alignment session collects and this page does not, so the column names the movement owed and offers the chip's two controls, which are the route to it. Only the ruling stage takes anything from the author, and what it takes is the confirmation: the page's scope is the final confirmation and, of every other movement, a preview and a read-only indicator, as the author's rule of 2026-09-06 fixes it, all other information from the author being given in the `/align` interview. That is this page's side of the three surfaces that bound what reaches the author, which `commons.systems/disposition-graph/turn-form` states whole and which is cited here rather than restated, since one surface's side is not the rule. A confirmation recorded on a node that has not reached that stage is invalid, as the author's words of 2026-09-04 direct, so at every earlier stage the facts, their options and the recommendation are all rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it. This supersedes the same day's earlier clause, that the controls run ahead of the dialogue marked rather than withheld on the argument that the author may rule at any stage. They may, and the way they do it is to move the node's stage in the dialogue; a live control on a periagogic node does not offer that, it offers an act the record will not honour.
+The middle column holds everything the ruling asks, and the right-hand column holds nothing but the disposition itself. The column is headed by the node's question and its id, and beneath them one line saying what put the node where it is: its settling count, which is what placed it in the order; the options pending on it, which the alignment-order node shows beside that count as what a sitting will cost; and the nodes it stands under, whose grant a ruling here would fall within and whose rulings made this one decidable. Nothing else is in that line. The graph is already in the id above it; the rank breaks ties in an order the rail already shows; and the class is read off the rulings on the facts, which the column renders one by one directly beneath, so a word summarising them there is the facts said twice. The line is named here because a line no answer names collects what no answer justifies, which is what had happened to it. The stage is the first thing the column says of the ruling, because the stage names the movement owed and so what the column is for: at the periagogic and the maieutic stages what is owed is the author's own words, which the alignment session collects and this page does not, so the column names the movement owed and offers the chip's two controls, which are the route to it. Only the ruling stage takes anything from the author, and what it takes is the confirmation: the page's scope is the final confirmation and, of every other movement, a preview and a read-only indicator, as the author's rule of 2026-09-06 fixes it, all other information from the author being given in the `/align` interview. That is this page's side of the three surfaces that bound what reaches the author, which `commons.systems/disposition-graph/turn-form` states whole and which is cited here rather than restated, since one surface's side is not the rule. A confirmation recorded on a node that has not reached that stage is invalid, as the author's words of 2026-09-04 direct, so at every earlier stage the facts, their options and the recommendation are all rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it. This supersedes the same day's earlier clause, that the controls run ahead of the dialogue marked rather than withheld on the argument that the author may rule at any stage. They may, and the way they do it is to move the node's stage in the dialogue; a live control on a periagogic node does not offer that, it offers an act the record will not honour.
 
 Then the facts, every one the node carries and none folded: its answer, whose options are the candidate answers to its question, the one that stands among them where one stands; the authority class a confirmation would confer; its existence; and its persistence where the recommendation would change its shape. Which facts the page lists on a node is the `which-facts-are-listed` node's question, and what this answer says of it stands only until that node rules. How a fact is headed is the `how-a-fact-is-headed` node's question, on the author's words of 2026-09-04, and what this answer says of it stands only until that node rules: the record's own reasoning headed each fact with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked; the author's words direct the shorter form, the name of what the fact decides, linked to the node that defines it. The list the page shows is the list the ruling asks, in full, as the author's words of 2026-09-04 direct, and the reason is what the fold cost: a page that folds a decision away has taken it, and the rationale carries the measure of it. Boldness stays, is shown on every recommendation, and acts on nothing: it is how much of the recommendation rests on the AI's own knowledge against the record and the author's words, so that high boldness is low confidence, and it is what the author reads to know how far to trust the mark beside an option, never what the page reads to decide whether to show one. A fact with no recommendation on it says so and marks no row, rather than rendering an unmarked list that reads as a recommendation withheld. A node that carries no facts offers nothing invented: such a node is at the periagogic or the maieutic stage, where no candidate answer exists and no decision is owed yet, so the column says which movement is owed, says that nothing is proposed yet, and carries the chip's two controls and no other. Everything the column shows of a fact it reads from the fact, its options, their sentences, their status, their readings and their rulings, and it never recovers from a node's prose what the structure is meant to hold; so the page is complete exactly as far as the facts are complete, and whether a fact's options are the whole of what was considered is the question of the prose-and-structure node, which this page papers over in neither direction.
 
```

#### independent-decisions-as-children

The decisions the answer takes beyond the author's words, which metrics the rail carries and where each links, how the two content columns divide, where the case against the recommended option sits and when it is written, where the kick-back's feedback sits, what the eyebrow keeps, and how the standing option gets its sentence, are minted as questions under this node, each with its own options, and the answer fact keeps the shape the author's words fix. Under `dialogue`'s rule a decision the author would rule on separately is a question and a question is a node, and the delta options on this fact are pairwise compatible, so a ruling for one rules on a whole text that takes the others the AI's way. Proposed by the clean-context review of 2026-09-04; a split is the author's to make, and the session records it and never makes it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The decisions the answer takes beyond the author's words, which metrics the rail carries and where each links, how the two content columns divide, where the case against the recommended option sits and when it is written, where the kick-back's feedback sits, what the eyebrow keeps, and how the standing option gets its sentence, are minted as questions under this node, each with its own options, and the answer fact keeps the shape the author's words fix. Under `dialogue`'s rule a decision the author would rule on separately is a question and a question is a node, and the delta options on this fact are pairwise compatible, so a ruling for one rules on a whole text that takes the others the AI's way. Proposed by the clean-context review of 2026-09-04; a split is the author's to make, and the session records it and never makes it.
```

#### case-against-in-the-drill-down

The recommended answer with one clause changed: the AI's case for and against each option sits one step down with the rest of its explanation, as the author's words of 2026-09-04 place it, "AI explanations for recommended or rejection" in the drill-down, and the row carries the sentence, the status and the tradition's bearing only. This is the author's placement, and the recommended option's amendment of it, the case against on the row, is the AI's; a ruling for this option keeps the rest of the recommended text. Passed over on 2026-09-07 after the reading of that day: by its own words it answers the `what-an-option-row-carries` node's question, where the author's same words of 2026-09-04 are recorded as the option `case-against-to-the-details`, and what the row carries at the first level follows whichever that node rules.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The recommended answer with one clause changed: the AI's case for and against each option sits one step down with the rest of its explanation, as the author's words of 2026-09-04 place it, "AI explanations for recommended or rejection" in the drill-down, and the row carries the sentence, the status and the tradition's bearing only. This is the author's placement, and the recommended option's amendment of it, the case against on the row, is the AI's; a ruling for this option keeps the rest of the recommended text. Passed over on 2026-09-07 after the reading of that day: by its own words it answers the `what-an-option-row-carries` node's question, where the author's same words of 2026-09-04 are recorded as the option `case-against-to-the-details`, and what the row carries at the first level follows whichever that node rules.
```

#### case-against-after-the-review-only

The recommended answer with one clause changed: the recommended option's row carries no case against until the clean-context review has returned one, so that what the author reads there is always the reader's and never the drafter's.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, the recording node has the session review its own output adversarially before the review runs, and a row that is empty until then is a row on which the recommendation stands unopposed through the maieutic and review movements. Passed over on 2026-09-07 after the reading of that day: by its own words it answers the `what-an-option-row-carries` node's question, where it is recorded as `ai-line-until-a-reading-returns` and passed over, and when the line on the row is written follows whichever that node rules.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The recommended answer with one clause changed: the recommended option's row carries no case against until the clean-context review has returned one, so that what the author reads there is always the reader's and never the drafter's.
```

#### kick-back-feedback-one-step-down

The recommended answer with one clause changed: the kick-back's feedback control sits in a drill-down beneath its row, like the reason box on an option, so that every row has the same two levels.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, the words are what a kick-back consists of and what the dialogue resumes from, where on an option they are optional because the ruling's content is the option. Passed over on 2026-09-07 after the reading of that day: by its own words it answers the `when-the-kickback-feedback-shows` node's question, where it is recorded under this same name with this node as its source and passed over, and where the feedback control sits follows whichever that node rules.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The recommended answer with one clause changed: the kick-back's feedback control sits in a drill-down beneath its row, like the reason box on an option, so that every row has the same two levels.
```

#### eyebrow-settles-and-pending-only

The recommended answer with one clause changed: the line beneath the question carries the settling count and the options pending, which `alignment-order` names, and not the nodes this one stands under, which no answer names.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, the nodes it stands under are whose grant a ruling here falls within and whose rulings made this one decidable, and the line is where the author reads why the node is where it is.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The recommended answer with one clause changed: the line beneath the question carries the settling count and the options pending, which `alignment-order` names, and not the nodes this one stands under, which no answer names.
```

#### open-probe-count-on-the-chip

Everything the recommendation says, with the stage chip carrying the number of probes open on the node beside the readiness it already renders, and the page carrying nothing of a probe's text, its `why` or its `discharges`. Raised by the `author-questions` sitting of 2026-09-04, whose answer requires it: the author's words exclude the list from this page, and the two readings under this node hold that the recommender does not decide what the decider sees, which is the reasoning this record used to kill the boldness fold here. The count reconciles them so far as they can be reconciled, and the divergence that remains, the probe's text, is recorded on that node rather than argued away. Adopted into the recommended text on 2026-09-04 after the reading of that day, with the citation of author-questions. Its work is at the maieutic stage, where this page asks the author for their intention and an author writing into that control with probes open and no sign of them is answering questions they cannot see; by the ruling stage no node with an open probe arrives at all.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

Everything the recommendation says, with the stage chip carrying the number of probes open on the node beside the readiness it already renders, and the page carrying nothing of a probe's text, its `why` or its `discharges`. Raised by the `author-questions` sitting of 2026-09-04, whose answer requires it: the author's words exclude the list from this page, and the two readings under this node hold that the recommender does not decide what the decider sees, which is the reasoning this record used to kill the boldness fold here. The count reconciles them so far as they can be reconciled, and the divergence that remains, the probe's text, is recorded on that node rather than argued away. Adopted into the recommended text on 2026-09-04 after the reading of that day, with the citation of author-questions. Its work is at the maieutic stage, where this page asks the author for their intention and an author writing into that control with probes open and no sign of them is answering questions they cannot see; by the ruling stage no node with an open probe arrives at all.
```

#### page-collects-only-the-confirmation

The author's rule of 2026-09-06, which is a scope on this whole answer and not a
clause of it: the page collects the final confirmation and nothing else, shows
every other movement as a preview or a read-only indicator, and sends every other
thing the author has to say to the `/align` interview.

It strikes the free-text control at the periagogic and the maieutic stages, and
the caption written for the case where the node carries no words. It leaves
standing everything the page renders read-only at those stages, which is the
whole of the middle column with its inputs disabled, since a preview is what the
author asked those stages to be. It leaves standing the ruling stage's own
controls, the option rows, the option's text control and the kick-back's, because
those are the confirmation, which is the one thing this rule says the page is
for. What it does not itself settle is which of the ruling stage's controls count
as part of the confirmation and which are a change request the interview should
take, which is `where-a-change-request-goes`' question, nor whether the author's
recorded words may be shown back as a read-only preview, which is
`authors-words-on-the-page`', nor whether the AI's account may be, which is the
option `account-not-on-the-page` on this fact, the survivor of
`the-account-on-the-page` after that node was pruned on 2026-09-06.

Recommending it is not this subsection's act: the rule is the author's and is
recorded here the turn it was said. Adopted into the recommended text on
2026-09-06 after the maieutic movement of that day, which states the rule in
terms in the paragraph on what the ruling stage takes, and which cites
`commons.systems/disposition-graph/turn-form` for the three surfaces this rule
is the page's side of.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The author's rule of 2026-09-06, which is a scope on this whole answer and not a
clause of it: the page collects the final confirmation and nothing else, shows
every other movement as a preview or a read-only indicator, and sends every other
thing the author has to say to the `/align` interview.

It strikes the free-text control at the periagogic and the maieutic stages, and
the caption written for the case where the node carries no words. It leaves
standing everything the page renders read-only at those stages, which is the
whole of the middle column with its inputs disabled, since a preview is what the
author asked those stages to be. It leaves standing the ruling stage's own
controls, the option rows, the option's text control and the kick-back's, because
those are the confirmation, which is the one thing this rule says the page is
for. What it does not itself settle is which of the ruling stage's controls count
as part of the confirmation and which are a change request the interview should
take, which is `where-a-change-request-goes`' question, nor whether the author's
recorded words may be shown back as a read-only preview, which is
`authors-words-on-the-page`', nor whether the AI's account may be, which is the
option `account-not-on-the-page` on this fact, the survivor of
`the-account-on-the-page` after that node was pruned on 2026-09-06.

Recommending it is not this subsection's act: the rule is the author's and is
recorded here the turn it was said. Adopted into the recommended text on
2026-09-06 after the maieutic movement of that day, which states the rule in
terms in the paragraph on what the ruling stage takes, and which cites
`commons.systems/disposition-graph/turn-form` for the three surfaces this rule
is the page's side of.
```

#### standing-named-in-the-pane

Two clauses of this answer change if
`commons.systems/disposition-graph/where-the-unconfirmed-indication-goes` rules
for `the-line-that-names-what-the-pane-shows`, the standing text there under
which the indication goes in the right-hand column's heading, and which that
node no longer recommends; the two clauses are this node's and not that one's,
which is why they are an option here rather than an amendment there.

What the child recommends now is `line-only-where-the-act-is-live`, the
indication above the answer fact's options at the ruling stage alone, which leaves the right-hand column's heading unqualified
and takes the standing off the row without putting it in the pane; so a ruling
there for the recommendation moves the first of these two clauses and not the
second, and the naming paragraph is marked above as standing only until that
node rules. This option is what a return to the child's standing text would
move, and it is kept for that case.

The naming paragraph says the row tells the author that confirming ratifies the
AI's draft. Under that child's answer the row says nothing of the kind, since the
sibling `what-an-option-row-carries` takes the standing mark off the row and the
indication moves to the column that holds the disposition; the paragraph's
argument survives whole and its locus changes. And the account of the right-hand
column says that column carries "no control, no caption, no indication, no
drill-down", which the child's answer contradicts in one word: a qualified
heading is an indication. The reserve's reason is that every sentence of
apparatus there is a sentence the author must read past to see the disposition,
and one qualification of a heading that already exists is the smallest
exception that reason admits, which is the case for making it rather than
widening the reserve.

Recorded and not applied. The child's stage is the frontier's to show and is not
restated here; a ruling here is what would move these two clauses; the reading of 2026-09-06 on that node found that the child
had amended them itself, which is authority widening on the way down.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

Two clauses of this answer change if
`commons.systems/disposition-graph/where-the-unconfirmed-indication-goes` rules
for `the-line-that-names-what-the-pane-shows`, the standing text there under
which the indication goes in the right-hand column's heading, and which that
node no longer recommends; the two clauses are this node's and not that one's,
which is why they are an option here rather than an amendment there.

What the child recommends now is `line-only-where-the-act-is-live`, the
indication above the answer fact's options at the ruling stage alone, which leaves the right-hand column's heading unqualified
and takes the standing off the row without putting it in the pane; so a ruling
there for the recommendation moves the first of these two clauses and not the
second, and the naming paragraph is marked above as standing only until that
node rules. This option is what a return to the child's standing text would
move, and it is kept for that case.

The naming paragraph says the row tells the author that confirming ratifies the
AI's draft. Under that child's answer the row says nothing of the kind, since the
sibling `what-an-option-row-carries` takes the standing mark off the row and the
indication moves to the column that holds the disposition; the paragraph's
argument survives whole and its locus changes. And the account of the right-hand
column says that column carries "no control, no caption, no indication, no
drill-down", which the child's answer contradicts in one word: a qualified
heading is an indication. The reserve's reason is that every sentence of
apparatus there is a sentence the author must read past to see the disposition,
and one qualification of a heading that already exists is the smallest
exception that reason admits, which is the case for making it rather than
widening the reserve.

Recorded and not applied. The child's stage is the frontier's to show and is not
restated here; a ruling here is what would move these two clauses; the reading of 2026-09-06 on that node found that the child
had amended them itself, which is authority widening on the way down.
```

#### standing-sentence-stored

The recommended answer with one clause changed: the option that stands carries a `####` subsection of its own, a stored sentence, rather than the answer's first sentences read from `## Answer`; the data-side resolution of the seam between `viable-options`, which has every option carry its sentence, and `dialogue`, which exempts the one that stands.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, a stored sentence beside the answer is the answer's first sentences said twice, and drifts. Passed over on 2026-09-04 after the reading of that day: by its own words it answers the dialogue node's question, where it is recorded as `standing-option-carries-a-subsection` with this node as its source, and the row's sentence follows whichever that node rules.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The recommended answer with one clause changed: the option that stands carries a `####` subsection of its own, a stored sentence, rather than the answer's first sentences read from `## Answer`; the data-side resolution of the seam between `viable-options`, which has every option carry its sentence, and `dialogue`, which exempts the one that stands.
```

#### kickback-count-metric

A sixth metric, kick-backs per node and per sitting, for the recording node, whose kick-back row is what it counts, so that the effect the not-proven-third-verdict reading predicts is watched rather than argued. Raised by that reading on 2026-09-04 and recorded here after the clean-context reading of the same day found it on no fact. Viable and not adopted: nothing counts a kick-back until the record stores one, and the recording node writes a kick-back as the author's words and a stage, not as a countable field.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

A sixth metric, kick-backs per node and per sitting, for the recording node, whose kick-back row is what it counts, so that the effect the not-proven-third-verdict reading predicts is watched rather than argued. Raised by that reading on 2026-09-04 and recorded here after the clean-context reading of the same day found it on no fact. Viable and not adopted: nothing counts a kick-back until the record stores one, and the recording node writes a kick-back as the author's words and a stage, not as a countable field.
```

#### live-re-render-per-choice

The right-hand column re-renders the node as each choice is made, which the recommended text promised until the reading of 2026-09-04. Passed because the encoding this node depends on gives text only to the option a fact recommends, so a choice of a delta option has no text to render, and because the artifact renders the column once from the fence and the standing text and never did otherwise.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The right-hand column re-renders the node as each choice is made, which the recommended text promised until the reading of 2026-09-04. Passed because the encoding this node depends on gives text only to the option a fact recommends, so a choice of a delta option has no text to render, and because the artifact renders the column once from the fence and the standing text and never did otherwise.
```

#### progressive-disclosure-diverges-on-the-fold

The drill-down clause keeps its two levels and strikes the words "that tradition
never asked for a decision to be removed from the ask", putting in their place
that the tradition would defer the rarely used options by frequency and
importance of use, that the author's words of 2026-09-04 put every fact and
every option at the first level, and that the split within a row is this page's
own criterion and not the tradition's. The divergence is the author's, which the
evaluation node's rule says a tradition cannot overrule, and it is recorded on
`commons.systems/disposition-graph/progressive-disclosure`'s recommended text as
one `bears` entry carrying `diverged` on the option `every-fact-every-option`;
that node's live frontmatter carries `adopted` on the same option and stands
`adopted` until it rules, which is what the chip on this option's row says
meanwhile. Raised by the second
clean-context reading of that node on 2026-09-05, which found that an account
note on the reading binds nothing and shows nowhere beside the clause it
contradicts. It supersedes the suggested edit this node's own reading of
2026-09-05 gave for the same clause, to move the reading's recommendation to
`discloses-detail-not-decisions`: that option was passed over the same day, for
saying the record diverges from the tradition nowhere.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The drill-down clause keeps its two levels and strikes the words "that tradition
never asked for a decision to be removed from the ask", putting in their place
that the tradition would defer the rarely used options by frequency and
importance of use, that the author's words of 2026-09-04 put every fact and
every option at the first level, and that the split within a row is this page's
own criterion and not the tradition's. The divergence is the author's, which the
evaluation node's rule says a tradition cannot overrule, and it is recorded on
`commons.systems/disposition-graph/progressive-disclosure`'s recommended text as
one `bears` entry carrying `diverged` on the option `every-fact-every-option`;
that node's live frontmatter carries `adopted` on the same option and stands
`adopted` until it rules, which is what the chip on this option's row says
meanwhile. Raised by the second
clean-context reading of that node on 2026-09-05, which found that an account
note on the reading binds nothing and shows nowhere beside the clause it
contradicts. It supersedes the suggested edit this node's own reading of
2026-09-05 gave for the same clause, to move the reading's recommendation to
`discloses-detail-not-decisions`: that option was passed over the same day, for
saying the record diverges from the tradition nowhere.
```

#### account-not-on-the-page

The AI's account is not shown on this page. The clause "Last, as drill-downs, the
author's words and the AI's account" keeps the first and drops the second, so the
column carries the facts, their options, the recommendation with the case against
it, and the author's own words, and the account is read in the browser by anyone
who wants it.

The option is the survivor of `the-account-on-the-page`, the child minted for the
author's observation of 2026-09-04, "I do not undertand what 'The AI's account'
is meant to be recording. If it is justified to support alignment dialogue and
review then keep it, but it does not need to be presented in the UI." That node
was pruned on 2026-09-06 under the author's delegation, on the independence test:
its only possible answer was a reading of this clause, its facts would have been
this fact, and it would have been pruned the moment this recommendation moved.
The substantive half of the author's observation, what `## Account` is for and
whether it is justified at all, is not this option's and is not lost with the
node: it stands as the probe `what-the-account-records` on
`commons.systems/disposition-graph/dialogue`, sourced to the author and raised
2026-09-04, whose own text already says that "the-account-on-the-page decides
only the presentation".

The contrary reading is on the list and is why this option is not the
recommendation by default: the author's rule of 2026-09-06 permits a preview and
a read-only indicator of every movement the page is not running, and the account
folded into a drill-down is exactly that. What the author asked was what the
account records, and their condition was that it be kept if it is justified; a
reader who cannot see it cannot judge the case against on the row against the
reasoning behind it. The recommendation on this fact has not moved and this
option acts on nothing.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The AI's account is not shown on this page. The clause "Last, as drill-downs, the
author's words and the AI's account" keeps the first and drops the second, so the
column carries the facts, their options, the recommendation with the case against
it, and the author's own words, and the account is read in the browser by anyone
who wants it.

The option is the survivor of `the-account-on-the-page`, the child minted for the
author's observation of 2026-09-04, "I do not undertand what 'The AI's account'
is meant to be recording. If it is justified to support alignment dialogue and
review then keep it, but it does not need to be presented in the UI." That node
was pruned on 2026-09-06 under the author's delegation, on the independence test:
its only possible answer was a reading of this clause, its facts would have been
this fact, and it would have been pruned the moment this recommendation moved.
The substantive half of the author's observation, what `## Account` is for and
whether it is justified at all, is not this option's and is not lost with the
node: it stands as the probe `what-the-account-records` on
`commons.systems/disposition-graph/dialogue`, sourced to the author and raised
2026-09-04, whose own text already says that "the-account-on-the-page decides
only the presentation".

The contrary reading is on the list and is why this option is not the
recommendation by default: the author's rule of 2026-09-06 permits a preview and
a read-only indicator of every movement the page is not running, and the account
folded into a drill-down is exactly that. What the author asked was what the
account records, and their condition was that it be kept if it is justified; a
reader who cannot see it cannot judge the case against on the row against the
reasoning behind it. The recommendation on this fact has not moved and this
option acts on nothing.
```

#### copy-control-beside-the-launch-link

The page's copy control sits beside the session-launch link, both at the scale of
the whole sitting, so that the two routes to one instruction are read together
and the author can see that they are two routes and not two acts. The author
directed it in as many words on 2026-09-04, in the disposition quoted above:
"move the "copy all responses" next to this button and make sure it is copying
the same instruction that would be used to initialize the cloud session." The
answer took the second half of that sentence, that the two emit one canonical
instruction, and declined the first, saying it named no placement; the clean-context
reading of 2026-09-07 found that the placement was then settled by no node,
`ruling-transport`'s recommended text saying nothing of where the three controls
sit either, and that the shim's `for:` line noticed the gap without curing it.
Adopted into the recommended text on 2026-09-07 after the reading of that day.
What each of the three controls does stays `ruling-transport`'s, and where the
three sit as a group is still named nowhere; this option settles the one
adjacency the author's words fix and no more.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The page's copy control sits beside the session-launch link, both at the scale of
the whole sitting, so that the two routes to one instruction are read together
and the author can see that they are two routes and not two acts. The author
directed it in as many words on 2026-09-04, in the disposition quoted above:
"move the "copy all responses" next to this button and make sure it is copying
the same instruction that would be used to initialize the cloud session." The
answer took the second half of that sentence, that the two emit one canonical
instruction, and declined the first, saying it named no placement; the clean-context
reading of 2026-09-07 found that the placement was then settled by no node,
`ruling-transport`'s recommended text saying nothing of where the three controls
sit either, and that the shim's `for:` line noticed the gap without curing it.
Adopted into the recommended text on 2026-09-07 after the reading of that day.
What each of the three controls does stays `ruling-transport`'s, and where the
three sit as a group is still named nowhere; this option settles the one
adjacency the author's words fix and no more.
```

#### clauses-cited-not-restated

The answer keeps only the clauses no child owns, the three columns, what the rail
carries, what the page takes from the author and how a ruling is transported, and
for every decision a child owns it cites that child by id in one clause instead
of restating what the child decides. The page would then be described in one
place per decision, a child's ruling would change only that child's text, and the
parent could not go stale against its own children, which is the failure the
reading of 2026-09-07 found four times in the two days since the children were
minted.

Raised by that reading as the viable option it found missing. Viable and not
adopted: the author reads one page and this answer is the only text that
describes it whole, so a parent reduced to citations gives the author less to
rule on than the page they are ruling about, and pushes the page's coherence into
eight separate sittings; and the markers, which the same reading's first four
findings ask for and which this amendment writes, are what keep the parent from
ruling against its children while the whole description stays in one place. The
option is the stronger one the day a child rules, and it is on the fact for the
author to take.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

The answer keeps only the clauses no child owns, the three columns, what the rail
carries, what the page takes from the author and how a ruling is transported, and
for every decision a child owns it cites that child by id in one clause instead
of restating what the child decides. The page would then be described in one
place per decision, a child's ruling would change only that child's text, and the
parent could not go stale against its own children, which is the failure the
reading of 2026-09-07 found four times in the two days since the children were
minted.

Raised by that reading as the viable option it found missing. Viable and not
adopted: the author reads one page and this answer is the only text that
describes it whole, so a parent reduced to citations gives the author less to
rule on than the page they are ruling about, and pushes the page's coherence into
eight separate sittings; and the markers, which the same reading's first four
findings ask for and which this amendment writes, are what keep the parent from
ruling against its children while the whole description stays in one place. The
option is the stronger one the day a child rules, and it is on the fact for the
author to take.
```

#### the-context-pane-previews-the-selected-option

The right-hand column holds the node as it would stand under the option selected in the middle column, resolved from that option's content and re-rendered as the selection moves; with nothing selected it holds the content of the option last confirmed, and where none has been it says so rather than rendering a draft in that place.

**AI support.** The author's refinement of 2026-09-07: "when the author selects an option via the alignment artifact the context pane is dynamically updated to preview the node that is being confirmed." The column already held the disposition alone, and this answer says which disposition: the one about to be confirmed. Nothing is added to the middle column and the ruling stays per fact.

Recorded on the author's dispositions of 2026-09-03 and 2026-09-04, which the `## Disposition` section carries and keeps as the quotes node decides. On 2026-09-03 the author opened this question with the words "full disposition detail renders in a right aligned context pane rather than rendering below the confirmation requests", and on 2026-09-04 they refined the layout of the questions: "List each fact without exceptions. For each fact, list all options. Last option is always 'kick back' because none of the options are acceptable - this is not recorded as confirmation, but a kick back to mieutic." The division between the two columns is the author's refinement of 2026-09-04, made on reading the published page: the right-hand column is the rendered disposition and nothing else, and everything that is about the ruling is in the middle. Four defects the author found on `commons.systems/public/agency` the same day are answered in the answer rather than left to the implementation, because each of them was a design fault and not a coding one. The question is the page's own and it was minted because the page was described only inside other rulings, a shim on the growth node, one clause of projection, one sentence of growth's answer, and the three responses on unanswered, so it would have been ratified incidentally and never asked as a question of its own. The shim naming the artifact moves here with the answer, and growth carries the alternative that says so.

The standard the five metrics meet is the one the author set for the browser's graph headings on the frontier-metrics node, that a metric is a signal, an instrument, or a criterion of some disposition and hyperlinks to it. That node's question is the browser's headings and this one's is this page, so the standard is cited rather than adopted and the five metrics are this node's own choice; and because that node is unanswered and grounds no work, the standard is restated in this answer rather than leaned on.

Amended 2026-09-04 on the author's refinement of the layout of the questions, quoted above, which struck the fold rule, liquidated the ruling on the whole and the eyebrow's graph, and asked for the review to be merged where it could be. What the answer adds on its own is the case against the recommended option on its row, the kick-back's marking, the readiness on the stage chip, and the eyebrow's contents, and the account says why each. The rationale no longer restates the options on the answer fact, since the page renders them from the fact. Amended again 2026-09-06 on the author's rule that the scope of the page is the final confirmation and, of every other movement, a preview and a read-only indicator, all other information from the author being given in the `/align` interview: the free-text control at the periagogic and the maieutic stages goes, with the caption written for a node carrying no words and the playback that opened beside it, and what an earlier stage offers is the chip's two controls and the preview.

Measured at graph commit 4102fd4b, before the reconciliation of 2026-09-04, so that the answer carries the rule and this carries the numbers: twelve of seventy-five nodes showed the author no decision at all, nine because every fact on them folded, two of those global-tier rules, and three because they carried no facts and printed the same sentence where it was false; 168 of 407 options carried no sentence, 114 on the authority fact, 38 the option that stands, 12 on existence and 4 on persistence; and the tradition indicator was blank on 393 of 407.

**AI divergence.** A pane that re-renders on every selection shows the author a node that changes under their reading, and where two facts' selections would each move the answer the pane can show only one composition, which this answer leaves to the answer fact; and the empty state, which is every node in the record today, is a column that mostly says nothing is confirmed.

The delta encoding still puts five independent decisions in one radio group, the metric set, where each metric links, the division of the two content columns, the eyebrow's contents, and where the indication that a text is unconfirmed sits, so a combined ruling needs a confirmation with edits; the children the earlier review proposed would give each its own text, reading and pane.

**Content.**

```markdown
---
question: What does the author read to rule?
form: rule
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability as the optional buffer the ruling-transport node describes, the author's responses read back by the session with the artifact tool
    for: the projection of this node's recommended answer, the open dialogue as the author rules on it; eight of that answer's clauses are in play on the children under it and no reconciliation has reached them, and the page's own controls sit in its footer, a placement this answer does not name, though it now places the copy control beside the session-launch link; its session-launch link is the stub the ruling-transport node's shim declares
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

One node at a time, on a three-column screen, in the ruling order.

The rail, on the left, carries the metrics at its top and then every unanswered node in the ruling order, flat, each row showing the node's question, its graph, its stage, its settling count, and a mark when a response is staged on it. The selected row is marked as selected, and selecting a row is what changes the other two columns. Once one node is shown at a time the rail is the only place the whole frontier is visible, which is why the metrics sit there, why it lists every node, and why it filters and pages nothing.

A metric on this page is a signal, an instrument, or a criterion of a recorded disposition and never a count for its own sake; each names the disposition it instruments and links to that node in the browser, which addresses every node by its id where this page has no route to one, and a node the browser does not render, one with no answer yet, is named by its id and not linked, the metric saying so. Five meet that standard; a sixth, kick-backs per node and per sitting, is on this fact as an option raised by the not-proven-third-verdict reading. Open, the size of the outstanding dialogue, for the unanswered node, under which every node is unanswered until the author confirms it, so the count is the author's outstanding authority. Ruleable, the nodes with both readings behind them, a forward review pinned to the recommendation as it stands and a survey pin on the same, for the clean-context-review node, whose recommended option `per-draft-and-survey` is what stands between a draft and the author, so the count is what can be ruled now. Next settles, what a ruling on the first node in the order would make decidable, for the alignment-order node, whose recommended answer is that the ruling settling the most comes first, so the count is what one ruling buys. Stale, the nodes on which either reading's pin, or a ruling's, no longer matches the text it read, for the frontier-consistency node, whose validations catch it, so the count is how much of what looks ruleable rests on a reading of text that has since moved. Survey owed, the nodes at the review or ruling stage that no survey has pinned or whose survey pin is stale, for that same option of the clean-context-review node, so the count is what the survey must read before any of it can be ruled. The stage counts, the per-graph lines, and the lede go: a stage count instruments no disposition, and a graph is a label on a row rather than a division of the order.

The middle column holds everything the ruling asks, and the right-hand column holds nothing but the disposition itself: the node as it would stand under the option selected in the middle column, resolved from that option's content and re-rendered as the selection moves, so that the author reads what they are about to confirm and not what stands beside it. With nothing selected it holds the node as it stands, which is the content of the option last confirmed, and where none has been it says so rather than rendering a draft in that place. The column is headed by the node's question and its id, and beneath them one line saying what put the node where it is: its settling count, which is what placed it in the order; the options pending on it, which the alignment-order node shows beside that count as what a sitting will cost; and the nodes it stands under, whose grant a ruling here would fall within and whose rulings made this one decidable. Nothing else is in that line. The graph is already in the id above it; the rank breaks ties in an order the rail already shows; and the class is read off the rulings on the facts, which the column renders one by one directly beneath, so a word summarising them there is the facts said twice. The line is named here because a line no answer names collects what no answer justifies, which is what had happened to it. The stage is the first thing the column says of the ruling, because the stage names the movement owed and so what the column is for: at the periagogic and the maieutic stages what is owed is the author's own words, which the alignment session collects and this page does not, so the column names the movement owed and offers the chip's two controls, which are the route to it. Only the ruling stage takes anything from the author, and what it takes is the confirmation: the page's scope is the final confirmation and, of every other movement, a preview and a read-only indicator, as the author's rule of 2026-09-06 fixes it, all other information from the author being given in the `/align` interview. That is this page's side of the three surfaces that bound what reaches the author, which `commons.systems/disposition-graph/turn-form` states whole and which is cited here rather than restated, since one surface's side is not the rule. A confirmation recorded on a node that has not reached that stage is invalid, as the author's words of 2026-09-04 direct, so at every earlier stage the facts, their options and the recommendation are all rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it. This supersedes the same day's earlier clause, that the controls run ahead of the dialogue marked rather than withheld on the argument that the author may rule at any stage. They may, and the way they do it is to move the node's stage in the dialogue; a live control on a periagogic node does not offer that, it offers an act the record will not honour.

Then the facts, every one the node carries and none folded: its answer, whose options are the candidate answers to its question, the one that stands among them where one stands; the authority class a confirmation would confer; its existence; and its persistence where the recommendation would change its shape. Which facts the page lists on a node is the `which-facts-are-listed` node's question, and what this answer says of it stands only until that node rules. How a fact is headed is the `how-a-fact-is-headed` node's question, on the author's words of 2026-09-04, and what this answer says of it stands only until that node rules: the record's own reasoning headed each fact with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked; the author's words direct the shorter form, the name of what the fact decides, linked to the node that defines it. The list the page shows is the list the ruling asks, in full, as the author's words of 2026-09-04 direct, and the reason is what the fold cost: a page that folds a decision away has taken it, and the rationale carries the measure of it. Boldness stays, is shown on every recommendation, and acts on nothing: it is how much of the recommendation rests on the AI's own knowledge against the record and the author's words, so that high boldness is low confidence, and it is what the author reads to know how far to trust the mark beside an option, never what the page reads to decide whether to show one. A fact with no recommendation on it says so and marks no row, rather than rendering an unmarked list that reads as a recommendation withheld. A node that carries no facts offers nothing invented: such a node is at the periagogic or the maieutic stage, where no candidate answer exists and no decision is owed yet, so the column says which movement is owed, says that nothing is proposed yet, and carries the chip's two controls and no other. Everything the column shows of a fact it reads from the fact, its options, their sentences, their status, their readings and their rulings, and it never recovers from a node's prose what the structure is meant to hold; so the page is complete exactly as far as the facts are complete, and whether a fact's options are the whole of what was considered is the question of the prose-and-structure node, which this page papers over in neither direction.

Under each fact are its options, in the order the fact holds them, the confirmed choice first where there is one, as the dialogue node has every projection show it. A row leads with what the option would answer, in the sentence the record holds for it, and carries the option's name nowhere on the row: the name is how a ruling is stored and the sentence is the decision, and the author's words of 2026-09-04 strike the id-shaped string from the row. What an option's row carries at the first level is the `what-an-option-row-carries` node's question, on those words, and what this answer says of the row stands only until that node rules. Every option has that sentence, and the page supplies the two kinds the node does not write. A reserved fact's options are vocabulary rather than slugs, and their sentence is what confirming that choice would mean, in the words of the node that defines the fact where the choices are the fact's own vocabulary, and of the node's own prose on the fact where they are written per node, as persistence's are; it is projected from there and never carried by the page for itself, since a class means the same on every node and a sentence the page kept in its own text would be a rule no node projects. The authority class is the most repeated decision on the page, and rendered as the two bare words `ratified` and `delegated` it told the author nothing they did not already have to know; against that reasoning the author's words of 2026-09-04 ask for the name of the level and nothing more, which is the `vocabulary-option-summary` node's question, and this clause stands only until that node rules. The option that stands has no subsection, its text being the answer beside it, and its row leads with that answer's first sentences exactly as every other row leads with its option's, carrying beside them the standing the text has, named as below, so that the least safe choice on the page is the one said most plainly. Beside the sentence the row carries, at the first level, the two the author's words of 2026-09-04 keep: that the recommendation adopts it, with its boldness; and, for each reading that bears on it, whether the tradition supports it or it departs from the tradition, by the reading's name, because the relation is the option's and not the node's and a tradition can support one option and contradict another on the same fact. The rest of the option's status as the record holds it goes to the option's details, where the same words send the AI's reasoning: where it came from, by its source and reference; that the AI holds it dominated, marked passed over with the clause saying why, in the words of the viable-options node's gloss, and still open to the author's ruling, which clears the status; and that the author has ruled on it, with the response and the date, since the facts persist after a ruling and a node comes back to this page carrying them, so the author meets their own choice beside whatever has moved against it, and the fact says when the recommendation has moved since. Whether the standing of the text survives on the row at all is the probe the author raised on 2026-09-04 and answered on 2026-09-06, whose effect on the naming rule below is `what-an-option-row-carries`' maieutic movement. Where no reading bears on an option the row carries nothing for tradition, not an empty mark: the evaluation node requires every tradition the second pass surfaces to be recorded as a reading, so a row with none is a row on which none was surfaced, and saying so on nearly every row of the page would be one sentence repeated four hundred times.

One more thing sits on the recommended option's row and on no other, at the first level and not in its drill-down: the case against it, in one line, at full strength, in the AI's words. With every fact listed and its recommendation marked, the author now sees every decision the AI has made, which is right, and sees each of them with the AI's choice already marked before their own is made, which is the anchor the record's reading on the maieutic conduct names twice and never answers; the page multiplies the surface that anchor works on by the number of facts it stopped folding, and the only guard the record names against it is the dialectic itself. The row is where the dialectic has to happen, so the row carries the objection: stated by the party that will answer it, before the author decides, and never skipped because the recommendation is confident. It is written when the recommendation is recorded, as the evaluation node's adversarial review of one's own output; when the clean-context review returns a counter-argument worth the author's time, that counter-argument is the line and carries the strength the review gave it, and when the review found none the line says so, since the recording node requires a recommendation that goes alone to say that it does. It is one line because a row stays a row, and the reply, why the recommendation stands regardless, is the AI's again and sits in the drill-down with the rest of the AI's explanation. It is on the row and not beneath it because a case against that is folded is a case the author never reads before choosing, and the anchor operates at the level the eye reads.

Beneath each row, one step down and never lost, is everything else the record holds on the option, opened on demand: the rest of its text, and for a candidate answer the text as it would stand; the author's words it rests on, where its source is the author, by the reference it carries, which stands only until `authors-words-on-the-page` rules; the AI's reason for recommending it, or for recommending another over it, and its reply to the case against; each reading's account of why the tradition supports the option or is departed from, linked to the reading; what a ruling for it keeps and what it discards of the nodes standing under this one, where any do; and a text control for the author's reason for choosing it and for any edits they want made to it; what that control takes, the reason alone or the reason with the author's edits, is the `where-a-change-request-goes` node's question, on the author's words of 2026-09-04, and what this answer says of it stands only until that node rules. The split is by what is needed to choose against what is needed to check: the first level is the sentence, the status, the tradition's verdict and the case against, and what explains each of them is one step below, which are the two levels the progressive-disclosure reading supports; that tradition never asked for a decision to be removed from the ask.

The last row on every fact is the kick-back, and it is not an option: it says that none of these is acceptable, records no ruling, and returns the node to the maieutic stage, where the options are drawn again from what the author writes. It stays in the radio group, because a refusal reached by a different control from the choices is a refusal the author has to look for, and it is marked as what it is: set apart from the options, captioned with what it does to the node rather than with the summary of an option it is not, and its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from, where on an option the words are optional because the ruling's content is the option; when that control is shown is the `when-the-kickback-feedback-shows` node's question, on the author's words of 2026-09-04, and what this answer says of it stands only until that node rules. It is typed to the maieutic movement, as the recording node's option `per-fact-after-two-readings` says, into which the typing was composed, because that is what "none of these" asks for; feedback that shows the ground itself is at issue rather than the options is classified further back, to the periagogic movement, by the recording node, from the words, as it already classifies every denial, so the page offers no second control for it. A kick-back on one fact moves the whole node, since a node has one stage, and the row says so; what the author confirmed on the node's other facts is staged with it and recorded, as the recording node keeps the rulings on the other decisions through a kickback, so that the author answers each decision once.

A choice that keeps the text already in the record is named for the authority that text has and never for more, and that name is its status. Where the answer is ratified, the choice is the answer as ratified and a confirmation keeps it. Where no ruling stands on the answer fact it is a draft no one has confirmed, whatever class a ruling on the authority fact confers, since that ruling is about who decides and not about this text, so the row says that confirming ratifies the AI's draft. Naming it "the node as it stands" claims a standing the text does not have, and it reads as the safe and ordinary choice when on an AI-drafted node written in the author's own voice it is the least safe one available. Where no answer stands at all the choice is not offered, because there is nothing to keep. Where the indication that a text is unconfirmed sits, on the row as this paragraph puts it or above the answer fact's options as `where-the-unconfirmed-indication-goes` now recommends, is that node's question, and what this answer says of it stands only until it rules.

After the facts, what a ruling here makes decidable: the node's unanswered children and the open questions that name it, what each asks, and that a ruling here is what makes them decidable. They are indications and never rows. Every decision that is a question is a node, and a node is ruled from the rail in its own turn in the one order, so a screen offering its children as confirmable rows would impose a second order on nodes the one order has already placed. Last, as drill-downs, the author's words and the AI's account, at every stage alike, there being no control on this page asking the author for more; the first of the two stands only until `authors-words-on-the-page` rules, and the second only until the option `account-not-on-the-page` is ruled. The review has no section of its own. Everything the section showed, the verdict, the dates, the two pins and whether the node is ready to rule, is the node's readiness and not any fact's, which is why it could not be merged into the facts as it stood and why it goes to the stage chip instead; what the review found, the counter-argument, is about one option and is on that option's row.

The right-hand column is the disposition and nothing else: the recommended text, or the standing text where the choice that keeps it is taken, with the frontmatter a persistence choice changes, and nothing is in it that the column beside it did not ask. It is not re-rendered as each choice is made: an option that carries only its sentence has no text to render, and a ruling for one is recorded as the recording node says, the session applying the sentence's change to the recommended text, the applied text read afterwards as an author's edit is and the choice keeping its authority meanwhile. Where an answer stands it leads with the edit this ruling would make, and where none stands it shows the whole. Leading with the edit on a draft no one has confirmed departs from the dialogue node's rule that a node with no class leads with the recommended text whole; the departure is recorded there as the option `edit-led-against-a-named-ground` and is that node's to decide. The edit says what it is an edit against, because a diff implies a ground and the ground here is usually a draft: against the ratified answer where there is one, and against a draft no one has confirmed where there is not. That is the author's finding of 2026-09-03 on `commons.systems/disposition-graph/purpose`, that nodes "still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed". The diff is not what was wrong and it stays; what was wrong was letting it imply a standing its base does not have. Nothing that is about the ruling shares the column with it -- no control, no caption, no indication, no drill-down -- because the column's one job is to show the author the thing they are ruling on, and every sentence of apparatus in it is a sentence they must read past to see it. Where there is no disposition to show, because the node has neither an answer nor a recommended text, the column is not held open: the item is one column and the line saying so follows the ask, since half a screen of white reserved for a sentence is the same fault as apparatus in the column, spending the reader's attention on something that is not the node.

The rail is fixed and narrow. The middle and the right share what is left, near enough evenly, and the disposition can take the whole screen on demand. Before the refinement the right-hand column was the widest, on the argument that the node is the thing in view while the decisions are worked; that argument survives, but the middle column now carries the stage's ask, every fact with every option under it, the indications and two drill-downs, and a working column starved to a third is a worse failure than a reading column at a half. Neither is the author's ruling: the author moved the material and said nothing about width, and this is the consequence drawn from it.

What an earlier stage offers instead is the dialogue itself. The stage is a chip, and the chip carries two controls: one opens an alignment session on this node, as a plain link so that leaving the page reads as leaving the page, and one copies the instruction that starts it, `/align <the node's id>`. The two are the same instruction by two routes, one for a reader who can follow the link and one for a reader who is somewhere else. The chip also carries the node's readiness, which was the review's section: the two readings the ruling waits on, the review of this draft and the survey of the frontier as the clean-context-review node's `per-draft-and-survey` divides them, each with the date it read and whether the recommendation has moved since, and whether the node is ready to rule or which reading is owed; and the number of probes open on the node, which the author-questions node decides and this page carries as that node's departure from the author's words there. It is there because it is the state of the node, and the chip is the node's one status object, beside the controls that move it. The page's own controls are the three the ruling-transport node describes, at the scale of the whole sitting, and of where they sit this answer says one thing, on the author's words of 2026-09-04: the copy control sits beside the session-launch link, both at the scale of the sitting, so that the two routes to one instruction are read together. The copy control and the session-launch link emit one and the same instruction carrying every staged response, the instruction being canonical, and the record control writes the responses to the page's database as the optional buffer a session reads back; they say which is which rather than leaving the author to infer it from a verb, and what each does is that node's to answer.

A response is one of the three the unanswered node opens and this page adds none, and every response is given on a fact, since nothing on the page stages a ruling on the node as a whole. Choosing an option on a fact and leaving its text empty is a confirmation of that option; choosing an option and writing in its text is a confirmation with text, which the session classifies as the recording node classifies every response given in prose, a reason recorded with the ruling where it is a reason, and a confirmation with edits where it amends the option, applied and recorded as the ruling, the node returning to the review stage where they change substance, as the recording node's `per-fact-after-two-readings` says of a confirmation with edits; the kick-back on a fact is a denial with feedback on that decision. The ruling on the whole, which used to stage the confirmation with edits by itself, goes with nothing lost: the author's edits ride on the option they edit, which is where an edit belongs; whether the page stages a confirmation with edits at all, or sends every change request to the kick-back instead, is the `where-a-change-request-goes` node's question, and what this answer says of it stands only until that node rules. Responses stage and submit together across nodes, so selecting another node never discards one, and the rail marks every node that carries a staged response.

The questions this answer no longer settles alone. The decomposition of
2026-09-05, on the author's disposition of 2026-09-04, minted a node under this
one for each of the author's observations, and each owns a decision this text
takes in prose. Seven are named in `depends` and a ruling here waits on them:
`authors-words-on-the-page`, where the author's own words appear;
`how-a-fact-is-headed`; `vocabulary-option-summary`;
`what-an-option-row-carries`; `when-the-kickback-feedback-shows`;
`where-a-change-request-goes`; and `which-facts-are-listed`, which facts the
page lists on a node. An eighth,
`where-the-unconfirmed-indication-goes`, was minted on 2026-09-06 from a
finding on the first of those and decides where this page says that a node's
text is unconfirmed; it is in `depends` with the other seven, entered on 2026-09-07 when the survey found the reason this answer gave for leaving it out, that the edge would close a cycle, to be false: the child stands under this node and its `depends` names only the dialogue node. Two of
the nine minted on 2026-09-05 are gone: `input-for-an-unfinished-movement`,
answered outright by the author's rule of 2026-09-06 which this answer now
states, and `the-account-on-the-page`, whose remaining half is the option
`account-not-on-the-page` on the answer fact above; both were pruned that day
under the author's delegation and neither is in `depends`. Their stages are
their own and are not restated here, since a count of them goes stale the day
it is written. Where a clause of this answer touches one of those decisions it
is marked above as standing only until that node rules, and all eight are so
marked; four of the marks were written on 2026-09-07, the reading of that day
having found this sentence false for exactly those four. The clauses that
remain are this node's own, the three columns, what the rail carries, what the
page takes from the author, and how a ruling is transported.
```

### authority

Ratified, because this page is the surface every ruling passes through: a row that mis-states what a confirmation does, as the caption naming a draft "the node as it stands" did on `commons.systems/public/agency`, records a ruling the author did not give, and that is capture-shaped whatever the fold does; the fold's removal took the page's one mechanism for deciding what the author sees and left this one, which is about what the author is told they are deciding. Deferred is on the fact because the record's classes are three and the reader admits it; delegated would let the recommendation act on the layout, which is reversible, but also on what a confirmation is said to mean, which is not. Moderate boldness: the ground is the record's own on `agency` and this page's own history, and what rests on the AI is the reading that a caption is a ruling.

### persistence

The recommendation declares a shim on this node that the node does not carry today: the alignment page itself, moved here from `growth` with its declaration date of 2026-09-03 intact and its liquidation condition unchanged, its artifact clause amended to name the buffer as the ruling-transport node describes it, and its `for:` line rewritten to name this node's answer. Confirming it makes this node the shim's home; denying it leaves the shim on `growth`, where it describes a page that no node's ruling settles. The two nodes rule together, and `growth` carries the matching decision.

#### with the page's shim

This node carries the alignment page's shim: the artifact clause amended to name the buffer as the ruling-transport node describes it, the declaration date of 2026-09-03 and the liquidation condition moving here from `growth` unchanged, with the `for:` line naming this node's answer, so that the page is described where its question is asked.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### without it

This node carries no shim and the page's declaration stays on `growth`, where it describes a page whose question that node does not ask; the two persistence facts then disagree, since `growth`'s recommendation moves the shim out.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

## Account


An un-aligned disposition, recorded at the author's direction on 2026-09-03 and not yet answered. The question is the alignment page's own: what the author reads when they rule, what it must show of each unanswered node, in what order, and how their ruling returns to the record. The page exists and the author rules on it daily, and until now no node asked its question. It was recorded only inside other answers: a shim on `growth` naming the artifact, the projector flag that writes it, its published address, and its liquidation; one sentence of `growth`'s answer saying what it lists; one clause of `projection`'s answer and of its recommended text naming it the projection of the open dialogue; and the three responses defined on `unanswered`. So the page would have been ratified incidentally, by clauses inside larger rulings, and never put to the author as a question of its own, where the browser has this node's parent and `self-documentation` beside it.

The cost is already recorded. The clean-context review of 2026-09-03 found that `growth`'s shim describes the page as listing every unanswered node in rank order while the page as built groups by stage in a fixed order and ranks only within a group, and that `commons.systems/public/agency`, at the top of the rank order, is its seventh item. The record and the artifact disagree, and no node's ruling settles it. The same is true of what each item shows, of the alternatives and the recommendation the re-encoding of 2026-09-03 added to it, and of the responses mechanism, the page's `db` capability read back by the session with the artifact tool.

What the sitting would amend, read before anything is changed:

- `projection`, this node's parent, at the ruling stage: its answer and its recommended text carry the one clause naming the page, and its own question, how the record is read, is what this node refines for the second projection.
- `growth`, at the maieutic stage: the shim, whose `for:` line is the fullest description of the page in the record, and the answer's sentence on what the page lists and the three responses. Whether the shim moves to this node is the sitting's to say.
- `unanswered`, at the ruling stage: the three responses, confirm, confirm with edits, deny with feedback, and the rule that a confirmation given before the review runs is held.
- `dialogue`, at the ruling stage: what the page shows of an unanswered node, since its answer names the parts, and its projections paragraph describes the alternatives, the adopted one, and the stale pills the page now renders.
- `alignment-order`, at the periagogic stage with a probe outstanding: the order the page presents, which that node asks about for the frontier rather than for the page.
- `frontier-consistency`, at the ruling stage: validation 13, under which the review recommends the order in which the author rules; the review of 2026-09-03 recommended one and nothing consumed it.

The implementation their criteria point to: the projector's `--alignment` flag and the alignment template in `packages/disposition/`, which group by stage and rank within a group; the published page and its `db` collection of responses; and the alignment skill's reading of those responses at the opening of every sitting.

The periagogic object of this sitting is those six nodes, the page as published, and that implementation. The movement owed is periagogic: the author's account of what they need in front of them to rule, before the AI's account enters.

### Manifest

- Folded: The boost this mint forced, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The sitting of 2026-09-03: five dispositions on the page, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The probe answered, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The analysis corrected, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The recommendation after the greenfield instruction, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The recommendation withdrawn and replaced, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: List A holds no children, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: State at compaction, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The three classes of finding, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Evaluated twice, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Tested against the record it joins, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The recommendation and its three facts, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The sitting closed at maieutic, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The grant, and what it authorises, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reconciliation, under the grant of 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What `agency` renders, and why, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: A latent defect found in the reconciliation, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The purpose finding, answered at last, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What "Submit" does, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The page read in a browser, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: A dead affordance the gate created, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What the record measures, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Evaluated twice: the tradition pass, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What the projector does, and one correction, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What the record says, and what it costs in changed sentences, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The sitting closed at maieutic, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: State at compaction, 2026-09-04, the reconciliation under the grant, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The migration under the grant, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: State at the second compaction, 2026-09-04, the reconciliation under the grant, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Two dependencies repointed, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The census corrected on one figure, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The four design drafts recorded, and what the reviews are owed on, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: State at the third compaction, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The scope test, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Kicked back to the maieutic stage, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The renderer reconciled to the fence, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The row's pills: the account of 2026-09-05 misread the fence, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The carrier pruned, and its account carried here, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The scope rule drafted into the answer, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Two children pruned under the delegation, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 8fa14130, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 94465d40, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of 94465d40, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the frontier survey, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 39f5c588, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 57589470, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading of d35b0014, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 57589470 (ii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-context-pane-previews-the-selected-option`.

Findings:


On the facts and what they recommend: The diff touches only the answer fact: the newly-added option `the-context-pane-previews-the-selected-option` has its `source` corrected from the node id `commons.systems/disposition-graph/dialogue` to `author` (matching its own account, which grounds it entirely in a quoted author refinement), and the superseded option `every-fact-every-option`'s closing sentence is rewritten from the now-false "Adopted by the recommendation, and set out in the fence" to a sentence stating its supersession history ("Recommended from 2026-09-04 to 2026-09-07, when ... superseded it, keeping its text as the base the fence extends by one sentence"). `recommends` (still `the-context-pane-previews-the-selected-option`), `boldness` (moderate), `against`, and the `authority`/`persistence` facts are untouched; the `review` block's `verdict`/`strength`/`date`/`of`/`commit`/`against` fields are updated only to record the previous reading's own kickback outcome, and an `## Account` subsection recording that reading and the repair is appended.

On the viability of the options: The diff adds, removes, or re-marks no option's viability or status; it only corrects two pieces of prose (a source attribution and a stale self-description) on options whose recommendation and standing were already set by the prior commit. Every option on the answer fact remains exactly as viable as before the diff.

Strongest counter-argument (weak): The rewritten closing sentence for `every-fact-every-option` adopts the previous reading's own suggested wording almost verbatim, including the claim that the fence is extended by exactly "one sentence"; the fence's middle-column paragraph (unchanged by this diff, and outside this delta's scope since it predates the pinned commit) arguably carries more than one new clause/sentence describing the re-rendering behaviour, so the amendment's self-description may slightly overstate its own precision. This is inherited from the previous reading's suggested text rather than introduced independently by this repair, and it does not touch anything the previous reading or the survey's three findings actually raised, so it does not block forwarding.

The session's reply: The sentence describes the fence as it stands: the option's text and the fence differ by that one sentence, which the reading's scope excluded and this session checked.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/alignment-page stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `the-context-pane-previews-the-selected-option`; 28 `## Disposition` entries became the ledger entries words/2026-09-03/16, words/2026-09-03/17, words/2026-09-03/18, words/2026-09-03/19, words/2026-09-03/20, words/2026-09-03/21, words/2026-09-03/22, words/2026-09-04/1, words/2026-09-04/2, words/2026-09-04/3, words/2026-09-04/4, words/2026-09-04/5, words/2026-09-04/6, words/2026-09-04/7, words/2026-09-04/8, words/2026-09-04/9, words/2026-09-04/10, words/2026-09-04/11, words/2026-09-04/12, words/2026-09-06/1, words/2026-09-04/13, words/2026-09-04/14, words/2026-09-06/2, words/2026-09-06/3, words/2026-09-07/1, words/2026-09-07/2, words/2026-09-07/3, words/2026-09-07/4, referenced by 35 options the entry's own date names and by the recommended option for 7 the date named none. The content of `three-column-ruling-screen (at 2e6c3838)`, `every-fact-every-option (at 6c4d89c2)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `stage-counts-kept`, `metrics-link-into-the-page`, `decisions-are-the-widest-column`, `independent-decisions-as-children`, `case-against-in-the-drill-down`, `case-against-after-the-review-only`, `kick-back-feedback-one-step-down`, `eyebrow-settles-and-pending-only`, `open-probe-count-on-the-chip`, `page-collects-only-the-confirmation`, `standing-named-in-the-pane`, `standing-sentence-stored`, `kickback-count-metric`, `live-re-render-per-choice`, `progressive-disclosure-diverges-on-the-fold`, `account-not-on-the-page`, `copy-control-beside-the-launch-link`, `clauses-cited-not-restated`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `57589470c9e634aa20420adc80b317c74079cc23` is re-computed for the encoding as `184c3341ed274c0a5ae84adef73d9df9363e2de8`; nothing it read changed. The survey's pin `94465d401a161fed15196ead1c0e71bd5950de58` was already past the recommendation and is left as it stood.

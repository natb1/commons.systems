---
question: What does the author read to rule?
stage: maieutic
recommendation:
  adopts: three-column-ruling-screen
  boldness: moderate
  amends: "58feba8753e69fc8f557f0a318735219940f5272"
  at: "3d9f617b"
alternatives:
  - name: three-column-ruling-screen
    source: ai
    ref: "2026-09-04"
  - name: stage-counts-kept
    source: ai
    ref: "2026-09-04"
  - name: metrics-link-into-the-page
    source: ai
    ref: "2026-09-04"
  - name: decisions-are-the-widest-column
    source: ai
    ref: "2026-09-04"
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: moderate
  - name: persistence
    choices:
      - with the page's shim
      - without it
    adopts: with the page's shim
    boldness: low
depends:
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
under:
  - commons.systems/disposition-graph/projection
---
## Disposition

The author, 2026-09-03:
> is the unanswered question for the alignment page (requiring a ruling) recorded?

The author, 2026-09-03, on being told it was not:
> record it

The author, 2026-09-03, opening this sitting on the alignment page:

> new dispositions for the alignment artifact. dispositions may have cascading effects on disposition for unanswered data model. progress the dialogue but stop before the alignment-review. do not execute.
>
> - move the metrics to the top of the left navigation bar (justify with disposition). remove the rest of the pagehead (drop the lede) - it liquidates without disposition.
> - show only one disposition at a time selected from the left nav (with indicator on left nav for the selection)
> - give each disposition better layout that focuses on the confirmation and progressive disclosure. I want a list A of the things I need to confirm about the recommended disposition. Eg. authority and permanence are on list A if confirmation is required. Each is a sublist B of summarized options with the AI recommendation, and confidence in the recommendation (previously called boldness, now called confidence). Author quotes, full text, etc. are drill down items for rows in list B. Confirmation is recorded or edited with simple input for each list B item. The final option on list B is always reject all choices with feedback text input.
> - Not all aspects of the disposition need to be confirmed individually. After the list A of confirmation requests is the full disposition detail. It dynamically reflects choices made in the confirmation request list. Very high confidence or default disposition elements can just be included in the final render. After the final render is an option to reject final render with text input for feedback.
> - nodes (eg. commons.systems/disposition-graph/purpose) still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed. This appears to be bootstrap encoding artifact. purpose node is a confirmation ruling for a node that does not yet exist on the reconciliation frontier (only on the alignment frontier). After drafting recommendation for this item, and/or identifying issue with bootstrap reconciliation of disposition for unanswered data structure, launch an ad-hoc fable subagent to validate just this recommendation/reconciliation issue (not a full alignment review).

The author, 2026-09-03, amending the fourth disposition above:

> change to the original disposition: full disposition detail renders in a right aligned context pane rather than rendering below the confirmation requests.

The author, 2026-09-03, answering the periagogic probe on the unit of a ruling:

> the revised record is to carry a decision per aspect. each aspect of a disposition may have choices that require confirmation. each aspect has a recommendation with confidence. after analysis of cascading effects on the alignment frontier and esp. the data model have a fable subagent validate the analysis and the data model.

The author, 2026-09-03, on the two vocabulary questions put with the probe:

> I said permanence but I meant persistence. stick with boldness then, I want to know how much rests on the AI's own knowledge against the record.

The author, 2026-09-03, on how the recommendation is to be evaluated:

> Make recommendation based on best greenfield design - not brownfield cost savings. Nothing is doctrine yet, barely anything is materialized. Does the recommendatino survive?

The author, 2026-09-04, on what list A holds under `aspects-are-nodes`:

> > list A is the node's asking facts plus its unanswered children
>
> We already have multiple pages for working through trees in alignment order. Evaluate whether list A needs to/should include unanswered children? It sounds like list A is a list of facts per node. Maybe the child questions are indicated in the right aligned context pane under the node preview (so that the navigation pane can remain alignment order sorted).

The author, 2026-09-04, closing the sitting before compaction:

> record the current state of all dispositions from this session to prepare for compaction. Including this disposition which is a revision to a prior one: AI recommendations can be recorded at any time during the dialog (not just after the first meiutic). Ensure your recommendations so far are recorded. After compaction we will progress the alignment page nodes through meiutic and stop before review. Before review you will be granted bootstrap authourity to reconcile those nodes (including cascading effects on graph encoding/re-encoding of nodes/align/align-review/alignment page).

The author, 2026-09-04, granting bootstrap authority for this sitting's reconciliation:

> Bootstrap authority granted to reconcile the alignment-page sitting

The author, 2026-09-04, refining the answer after reading the page:

> refinement to the alignment artifact disposition:
>
> - the right aligned context is ONLY the rendered disposition. everything else goes in the center "what it asks" area. This include "What a ruling here makes decidable (3)" and "Your ruling on the whole" which supercedes prior disposition.
> - I'm looking at "commons.systems/public/agency". It's not clear what question is being asked and what the options are. It only says "what this ruling asks" and then lists what appear to be ids of some kind, and then "standing (the node as it stands)". I don't understand what "standing" would even refer to. This node has not yet been answered, there is no ground to confirm as standing. Is this a result of sparse alignment state written before current disposition for unanswered nodes? Or, does this suggest more structural issues?

The author, 2026-09-04, granting bootstrap authority for the reconciliation of this refinement:

> granted, reconcile it

## Alternatives

### three-column-ruling-screen

The metrics at the top of the rail with the disposition each instruments named and linked, the rest of the pagehead dropped; one node at a time, selected from the rail, the selection marked there; everything the ruling asks in the middle column, the stage's own ask first, then the decisions with their choices, then the ruling on the whole, then what a ruling here makes decidable, then the review, the author's words and the account; and the rendered disposition alone on the right, re-rendered as choices change. Adopted by the recommendation, and set out in the fence.

### stage-counts-kept

The four stage counts stay among the metrics, on the argument that the author needs to see what is coming, how much sits at the periagogic stage and how much at review, and not only how much can be ruled now. Against it: a stage count instruments no disposition, which is the standard the author set for a metric, and what is coming is already carried by the open count and by the order itself.

### metrics-link-into-the-page

Each metric links to the first node on this page that it counts, keeping the author inside the page, rather than out to the disposition it instruments in the browser. Against it: the author's standard is that the metric hyperlinks to the disposition, and a disposition leaves this page the moment it is answered, so three of the four links would break on the ruling that makes them true.

### decisions-are-the-widest-column

The decisions take the widest column and the node as it would stand sits in a narrow pane beside them, which is the plainer reading of the author's own phrase, "right aligned context pane". Against it: the reason the author gave for moving the detail there was that the result should be in view while the list is worked, and a whole node's text in a narrow pane is not in view. The answer takes the reason over the noun and lets the pane expand to the whole screen on demand; a ruling for this alternative takes the noun.

## Facts

### persistence

The recommendation declares a shim on this node that the node does not carry today: the alignment page itself, moved here from `growth` with its declaration date of 2026-09-03 intact and its liquidation condition unchanged, its `for:` line rewritten to name this node's answer. Confirming it makes this node the shim's home; denying it leaves the shim on `growth`, where it describes a page that no node's ruling settles. The two nodes rule together, and `growth` carries the matching decision.

## Recommendation

```markdown
---
question: What does the author read to rule?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/projection
shims:
  - artifact: the alignment page, written by `node packages/disposition/project.mjs disposition --alignment <file>` on the implementation ref and published as the private page https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 with the `db` capability, the author's responses read back by the session with the artifact tool
    for: the projection of this node's answer, the open dialogue as the author rules on it
    liquidation: the page is published from the implementation ref and the alignment skill reads the responses without the artifact tool
    declared: 2026-09-03
---
## Answer

One node at a time, on a three-column screen, in the ruling order.

The rail, on the left, carries the metrics at its top and then every unanswered node in the ruling order, flat, each row showing the node's question, its graph, its stage, its settling count, and a mark when a response is staged on it. The selected row is marked as selected, and selecting a row is what changes the other two columns. Once one node is shown at a time the rail is the only place the whole frontier is visible, which is why the metrics sit there, why it lists every node, and why it filters and pages nothing.

A metric on this page is a signal, an instrument, or a criterion of a recorded disposition and never a count for its own sake; each names the disposition it instruments and links to that node in the browser, which addresses every node by its id where this page has no route to one. Four meet that standard. Open, the size of the outstanding dialogue, for the unanswered node, under which every node is unanswered until the author confirms it, so the count is the author's outstanding authority. Ruleable, the nodes whose clean-context review is behind them, for the clean-context-review node, which is what stands between a draft and the author, so the count is what can be ruled now. Next settles, what a ruling on the first node in the order would make decidable, for the alignment-order node, whose answer is that the ruling settling the most comes first, so the count is what one ruling buys. Stale, the nodes whose review pin or recommendation pin no longer matches the text it read, for the frontier-consistency node, whose validations catch it, so the count is how much of what looks ruleable rests on a reading of text that has since moved. The stage counts, the per-graph lines, and the lede go: a stage count instruments no disposition, and a graph is a label on a row rather than a division of the order.

The middle column holds everything the ruling asks, and the right-hand column holds nothing but the disposition itself. The stage is what the column says first, because the stage names the movement owed and so what the column is for: at the periagogic stage the ask is the author's own account of the ground and the free-text control for it leads; at the maieutic stage it is the author's intention. The ruling controls follow, marked as running ahead of the dialogue rather than withheld, since the author may rule at any stage; what the page must never do is present a confirmation as the ordinary path on a node whose own dialogue says the ground has not yet been given. Where the stage asks for the author's words and the node carries none, the column says that in as many words rather than rendering an empty space, because "nothing of yours is recorded here, and what the answer says the AI drafted" is the fact those stages exist to change, and a blank says it to no one.

Then the decisions. They are the node's own answer, where alternatives are pending on it, and its asking facts: the authority class a confirmation would confer, the node's existence, and its persistence where the recommendation would change the node's shape. Each is labelled with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked. Under each are its choices, and a choice row leads with what that choice would answer, in the sentence the record holds for it, carrying its name beside that as the handle the record files it under. A row that shows only the name shows the author a list of identifiers: the name is how a ruling is stored and the sentence is the decision. The recommendation among the choices is marked, its boldness shown, the rest of the row's text beneath it as drill-down, one simple input records or edits the choice, and a last row rejects every choice on that decision with feedback.

A choice that keeps the text already in the record is named for the authority that text has and never for more. Where the answer is ratified, the choice is the answer as ratified and a confirmation keeps it. Where it carries a deferred stamp or none it is a draft no one has confirmed, since a deferred answer is unanswered until the author rules, so the choice says that confirming ratifies the AI's draft. Naming it "the node as it stands" claims a standing the text does not have, and it reads as the safe and ordinary choice when on an AI-drafted node written in the author's own voice it is the least safe one available. Where no answer stands at all the choice is not offered, because there is nothing to keep.

A decision is asked whenever its boldness is anything but low, and folds unasked into the rendered disposition when its boldness is low; nothing else folds, and a session that folds against that rule records the override and its reason in the account. Because boldness measures how much rests on the AI's own knowledge against the record, high boldness is low confidence: reading the author's words, that very high confidence can just be included in the final render, straight off the stored field and without that inversion would ask about everything the AI is surest of and fold everything it is least sure of.

Beneath the decisions, the ruling on the whole, with the caption that says what a confirmation would do sitting on the control itself and not across the screen from it, so that it cannot say nothing else is proposed while the decisions above it propose something. Beneath that, what a ruling here makes decidable: the node's unanswered children and the open questions that name it, what each asks, and that a ruling here is what makes them decidable. They are indications and never rows. Every decision that is a question is a node, and a node is ruled from the rail in its own turn in the one order, so a screen offering its children as confirmable rows would impose a second order on nodes the one order has already placed. Last, as drill-downs, the review's reading of the node, the author's words, and the AI's account -- except at the two stages that ask for the author's words, where what they have already said on this node comes up beside the control asking for more, open, rather than staying folded three sections below the question it answers.

The right-hand column is the disposition and nothing else: the node as it would stand under the choices made so far, re-rendered as each choice changes, with the folded decisions simply present in it and never asked about. Where an answer stands it leads with the edit this ruling would make, and where none stands it shows the whole. The edit says what it is an edit against, because a diff implies a ground and the ground here is usually a draft: against the ratified answer where there is one, and against a draft no one has confirmed where there is not. That is the author's finding of 2026-09-03 on `commons.systems/disposition-graph/purpose`, that a node "still indicates that it is an edit to a confirmed disposition ... even though no node is yet confirmed". The diff is not what was wrong and it stays; what was wrong was letting it imply a standing its base does not have. Nothing that is about the ruling shares the column with it -- no control, no caption, no indication, no drill-down -- because the column's one job is to show the author the thing they are ruling on, and every sentence of apparatus in it is a sentence they must read past to see it.

The rail is fixed and narrow. The middle and the right share what is left, near enough evenly, and the disposition can take the whole screen on demand. Before the refinement the right-hand column was the widest, on the argument that the node is the thing in view while the decisions are worked; that argument survives, but the middle column now carries the stage's ask, the decisions, the ruling on the whole, the indications and three drill-downs, and a working column starved to a third is a worse failure than a reading column at a half. Neither is the author's ruling: the author moved the material and said nothing about width, and this is the consequence drawn from it.

A response is one of the three the unanswered node opens and this page adds none: choosing the recommendation's choice on every asked decision and confirming the whole is a confirmation; choosing any other and confirming is a confirmation with edits; a rejection row, on one decision or on the whole, is a denial with feedback. Responses stage and submit together across nodes, so selecting another node never discards one, and the rail marks every node that carries a staged response.

## Rationale

Recorded on the author's dispositions of 2026-09-03 and 2026-09-04, quoted in the dialogue on this node while it was open. The division between the two columns is the author's refinement of 2026-09-04, made on reading the published page: the right-hand column is the rendered disposition and nothing else, and everything that is about the ruling is in the middle. Four defects the author found on `commons.systems/public/agency` the same day are answered in the answer rather than left to the implementation, because each of them was a design fault and not a coding one. The question is the page's own and it was minted because the page was described only inside other rulings, a shim on the growth node, one clause of projection, one sentence of growth's answer, and the three responses on unanswered, so it would have been ratified incidentally and never asked as a question of its own. The shim naming the artifact moves here with the answer, and growth carries the alternative that says so.

The standard the four metrics meet is the one the author set for the browser's graph headings on the frontier-metrics node, that a metric is a signal, an instrument, or a criterion of some disposition and hyperlinks to it. That node's question is the browser's headings and this one's is this page, so the standard is cited rather than adopted and the four metrics are this node's own choice; and because that node is unanswered and grounds no work, the standard is restated in this answer rather than leaned on.

Rejected:

- The stage counts kept, on the argument that they show what is coming and not only what is ruleable. - A stage count instruments no disposition, which is the standard; what is coming is the open count and the order.
- Each metric linking to the first node on this page that it counts. - A metric names the disposition it instruments, and a disposition leaves this page the moment it is answered.
- The node as it would stand in the narrow column, with the decisions widest. - The author moved the detail beside the list so that the result is in view while the list is worked, which makes it the thing read most.
- The rail filtered to the ruleable, or paged. - Once one node is shown at a time the rail is the only view of the frontier, and a filter is a second order over the one the projector computes.
- The node's unanswered children offered as rows among the decisions. - The one ruling order places every node, and a parent screen listing its children as rows orders them a second time.
- Boldness renamed confidence on the page. - The author retracted the rename; confidence is the presentation of the fact and boldness is the fact, and the fold rule runs on the fact.
- The text already in the record offered as "the node as it stands" on a node whose stamp is deferred or absent. - A deferred answer is unanswered until the author rules, so the name claims a standing the text does not have and presents itself as the safe choice where, on a draft written in the author's own voice by the AI, it is the least safe one.
- The ruling controls withheld at the periagogic and maieutic stages. - The author may rule at any stage and a page that removes the control decides that for them; what the page owes is the order and the marking, not the removal.
- The choice row leading with the name and folding the sentence into the drill-down. - Progressive disclosure on the wrong axis: the name is the handle the record files a ruling under and the sentence is the decision, so folding the sentence leaves the author a list of identifiers.
- The caption kept in the right-hand column beside the node. - It describes the control and belongs on it; across the screen from the decisions it contradicted them, telling the author nothing else was proposed on 27 of the 72 nodes while the middle column proposed up to five.
```

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

### The boost this mint forced, 2026-09-03

Adding this node under `projection` divided that node's rank one more way and dropped `session-context` to exactly the rank of `work-loop`, which the `order` field on `scope` forbids: the validator refused the graph until `session-context`'s boost was raised from six to seven. The boost was raised, and the author's recorded order, projection before growth before session-context before work-loop before rsi, holds again. The change is recorded on that node.

This is worth the sitting's attention and `alignment-order`'s: minting one question at the bottom of the frontier required hand-adjusting a number that carries the author's order elsewhere in the graph, which is the cost `attention`'s clean-context review named when it said one scalar cannot carry two orders and that the `order` field is the record's admission of it.

### The sitting of 2026-09-03: five dispositions on the page

The author's words are in the Disposition section above. Four of the five are
this node's own question, what the author reads to rule; the fifth is the
encoding beneath it and falls elsewhere. What each would amend, and the state
of the movement owed on it:

**The metrics and the pagehead.** The page as built puts a `.counts` list, one
number per stage plus a total, and a `.lede` sentence, and one line per graph
with its count, in a `.pagehead` at the top of the main column, with the nav
rail holding a flat list of questions. The disposition moves the metrics to the
top of the rail and drops the rest, and gives the reason in the record's own
vocabulary: the lede "liquidates without disposition", which is the
materialization rule applied to this page, that anything no disposition
justifies is unsupported implementation. The standard the metrics must meet is
already recorded, on `commons.systems/disposition-graph/frontier-metrics`,
where the author asked for the same thing of the browser's graph headings:
"maintain a clear functional justication for each - don't just dump raw data
... these metrics are signals/instruments/criteria of some disposition. Each
metric should hyperlink to that disposition." That node's question is the
browser's headings and this one's is the alignment page, so the two are not the
same question and neither is an alternative to the other; the criterion is
shared and is cited here, not copied. Which metrics meet it on this page is
open, and the AI's candidates are held back: the stage counts the page now
shows are raw data by that standard, and the settling count the ruling order is
built on is not shown at all.

**One disposition at a time.** The page renders every unanswered node into one
scrolling column and the rail anchors into it. The disposition makes the rail a
selector: one item shown, the selection marked in the rail. Nothing in the
record answers for the page's shape, which is why this node was minted.

**List A, list B, and progressive disclosure.** This is the disposition with
reach beyond the page, and the author said so: it "may have cascading effects
on disposition for unanswered data model". What it asks for is a ruling
decomposed into the aspects that need confirming, each aspect carrying its
summarized options, the AI's recommendation among them, and a confidence; with
quotes and full text as drill-down, a simple input per aspect, and a final
option on every aspect that rejects all of them with feedback. The record as it
stands has no aspect: `commons.systems/disposition-graph/dialogue` makes the
recommendation one whole-node adoption with one class and one boldness, and
`commons.systems/disposition-graph/unanswered` opens the three responses "on
any subset of them", where "them" is the unanswered nodes and not the aspects
within one. The clean-context review of 2026-09-03 had already put the same
question on the table as the alternative `partial-ratification` on
`commons.systems/disposition-graph/growth`, unruled. Whether the aspects are
derived by the page from what the record already carries, or recorded on the
node, is the question the sitting cannot answer for the author, and it is the
probe outstanding. Both nodes have gone back from ruling to maieutic and wait
on it.

**Confidence.** The author renames boldness to confidence. The term is defined
on `commons.systems/disposition-graph/growth`, which carries the words, and is
a field on every recommendation, which is `dialogue`'s. A rename touches the
answers of `growth`, `dialogue`, `recording`, `scope`, and the presentation
rule wherever the three facts are listed, and it is a rename and not a change
of meaning unless the author says otherwise, which is part of the probe.

**Full detail beside list A, and rejecting the final render.** The whole
disposition as it would stand under the choices made above renders live, with
the high-confidence and default elements simply present and never asked about,
and one more rejection with feedback against the whole. The author amended the
placement the same day: it renders in a right-aligned context pane, not below
the confirmation requests. That makes the page three columns, the rail on the
left carrying the metrics and the selection, the confirmation requests in the
middle, and the disposition as it would stand on the right, and it changes what
the arrangement is for: the result is not the reward for working down a list
but the thing in view while the list is worked, so the author sees each choice
land in the disposition as they make it. It also decides a question the first
statement left open, whether the final render is reached by scrolling past
list A or is always present; it is always present. Read
against the record this is a second thing the author is asking for and not a
restatement of the first: list A is confirmation aspect by aspect, and the
final render is confirmation of the result, which is the whole-node ruling the
record already has. What the record does not have is the rule that decides
which aspects reach list A at all; the author names very high confidence and
"default disposition elements" as the ones that do not.

**The encoding artifact.** The fifth disposition is not this node's. It is
recorded and answered on `commons.systems/disposition-graph/dialogue`, as the
finding "a first answer is presented as an amendment" and the two alternatives
`first-answer-is-not-an-amendment` and `caption-only`. In short: ten unstamped
nodes carry both a body answer and an `amends` pin, so the page derives an edit
between two texts neither of which anything has confirmed and captions it "the
node as it stands is what remains if you deny", which is false when nothing
stands; `purpose`, the author's example, is second in the ruling order. The
finding was corrected in clean context before reaching this page, and the
correction is recorded there. This
page is where the author sees it, and whatever this node answers about the
render must show a first answer as a first answer.

The movement owed here is still periagogic: one probe is with the author, and
the AI's account of what the page should be is held back behind it.

### The probe answered, 2026-09-03

The author ruled that the record carries a decision per aspect, each aspect
with its choices and its own boldness. The cascade that answer sets off, and
the data model it needs, are analysed on
`commons.systems/disposition-graph/dialogue`, under "The unit of a ruling",
where the encoding lives. Fourteen nodes carry text the ruling changes and
eight of them are at the ruling stage with a clean-context review of
2026-09-03 behind them, which the ruling spends.

What the ruling settles for this node, the page itself. List A is the aspects
of the recommendation that ask a question, which is derived and not stored: an
aspect reaches the list when it has more than one choice or when its boldness
is high. List B under each is that aspect's choices, with the AI's
recommendation among them and its boldness, the author's quotes and the full
text as drill-down beneath a row, a simple input recording or editing the
choice, and a last row that rejects every choice on that aspect with feedback.
The right-hand pane holds the node as it would stand under the choices made so
far, assembled from the adopted choice of every aspect, with the aspects that
asked nothing simply present in it, and a rejection of the whole beneath it.

One thing the page must get right and could easily invert. The author kept
boldness rather than the rename, and boldness measures how much rests on the
AI's own knowledge against the record, so high boldness is low confidence. The
page folds an aspect into the render on *low* boldness and asks about it on
*high*. Reading the author's phrase "very high confidence ... can just be
included in the final render" straight off the stored field would put every
question the AI is least sure of into the pane and every question it is surest
of into the list.

The two vocabulary questions put with the probe are closed. Permanence was
persistence, which this account had already read that way. The rename of
boldness to confidence is retracted, and the note above on the fold rule is why
the retraction was right: confidence is the presentation of the fact, boldness
is the fact, and the record carries the fact.

### The analysis corrected, 2026-09-03

The cascade analysis on `commons.systems/disposition-graph/dialogue` was
validated in clean context and corrected there. Three of the corrections change
what this page would be.

The fold rule, as this account first stated it, is incoherent at two corners:
an aspect with one choice and moderate boldness would fold silently though the
author folds only what is very high confidence, and an aspect with several
choices and low boldness would ask though it is the case the AI is surest of.
It folds on `low` boldness alone, or the session stores an override and
justifies it in the account. And the note above on the inversion holds with a
correction of its own: the record contradicts itself on which direction
boldness runs, `growth` defining it opposite to `dialogue` and to the author,
so the page cannot be written against the definition as it stands and the
contradiction is recorded on `growth`.

The drill-down the author asked for, author quotes beneath a list-B row, has no
data path in the model as drafted: `## Disposition` is per node and dated, and
a choice carries only a `ref`. Either a choice gains the dates it rests on, or
the drill-down shows the node's words and not the row's.

And a row of list B that is not the recommendation's own choice produces a
render the clean-context review never pinned, which under the `unanswered` node
sends it back to review. So confirming a non-adopted choice does not land it;
the page must say so on the row, or the author will confirm expecting
otherwise.

A rival to the whole model is on the table there,
`ranges-on-whole-node-alternatives`, which reaches this page without replacing
the encoding and without spending seven clean-context reviews. This node's
answer does not depend on which of the two the author takes: list A, list B,
the pane and the two rejections are the same page either way, and what differs
is whether the record carries the decisions or the page infers them.

### The recommendation after the greenfield instruction, 2026-09-03

The author struck cost from the table. The rival
`ranges-on-whole-node-alternatives` died with it, since every argument for it
was cost, and the drafted aspects model did not survive either: its one serious
defect, that prose written whole does not decompose, turned out to rest on a
brownfield fact doing the work of a design constraint. The sitting's
recommendation is `aspects-compose-the-answer`, recorded on
`commons.systems/disposition-graph/dialogue`, where a node's answer is composed
of its decisions rather than carved into them and `## Answer` is derived from
the adopted choice of every aspect.

Two things it changes for this page, both improvements on what this account
said before. The right-hand pane no longer needs an assembler bolted onto a
fenced whole node: the render is the adopted choices in order, which is what
the pane shows and what it re-renders as the author changes one. And because
the clean-context review becomes per aspect, a list-B row the recommendation
did not adopt is a reviewed choice like any other, so confirming it lands
rather than sending the node back to review. The warning this account carried,
that every list-B row is potentially a review round, is withdrawn.

The fold rule is settled the strict way: an aspect folds into the pane only on
low boldness, and asks otherwise. The per-row quote drill-down gains its data
path, since a choice now carries the dates of the author's words it rests on.

### The recommendation withdrawn and replaced, 2026-09-03

The greenfield validation returned a design that beats
`aspects-compose-the-answer`, and the sitting adopted it:
`aspects-are-nodes`, recorded on `commons.systems/disposition-graph/dialogue`.
A textual decision the author wants to rule on separately is a question, and a
question is a node, which `node`, `un-aligned-children` and `under` already
provide for between them. Only the facts that are not questions of the node's
subject matter, the authority class, the node's existence, and its persistence
where its shape would change, stay on the node as a small reserved set.

What this page becomes under it, and it is simpler than either earlier account.
List A is the decisions on this node and nothing else, corrected by the author
on 2026-09-04: see "List A holds no children" below. List B under a row is
that decision's choices, each with the recommendation among them and its
boldness, both of which the record already carries per node. The right-hand
pane is the node's answer as it would stand, with its unanswered children shown
beneath it as context and not as rows.

Three warnings this account carried are withdrawn, because the design that
caused them is withdrawn. The quote drill-down needed an anchor rather than a
date, since a date does not discriminate among eighteen quotations given the
same day; under this design a child's quotations are its own and the problem
does not arise. The per-aspect review's promise that any confirmed choice lands
held only for a single deviation; under this design a child is reviewed as a
node, which is what the review already does. And the live pane needed no
assembler, which it now does not have.

What remains open for this node is unchanged and is the page itself: the
metrics at the top of the rail with their justifications, the single-selection
rail, and the three columns.

### List A holds no children, 2026-09-04

The author's words are above. The evaluation they asked for, and the answer is
that list A must not include the node's unanswered children. Two sentences of
`alignment-order` decide it and the sitting's account had contradicted both.

The first is that the order is one order: "The order is one order over the
whole alignment frontier, the manifest's graphs taken together ... and the
alignment page pages in the order flat, showing each node's graph beside it."
A parent screen that lists its unanswered children as confirmable rows does not
page flat. It nests, and in nesting it creates a second ordering, the parent's
row order, over nodes the one ruling order has already placed. The author's
objection, that the navigation pane should stay alignment-order sorted, is that
consequence seen from the rail: a child ruled from inside its parent's screen
has been taken out of the order the projector computes and nothing else does.

The second is that the record already has the mechanism for showing an
ancestor what hangs beneath it, and it is not a list of rows: "the page inverts
that at the ancestor, showing beside each alternative the nodes a ruling for it
keeps and the nodes it discards." That is context for the ruling in hand, not a
place to rule. The author's proposal, that child questions be indicated in the
right-hand pane under the node preview, is that same mechanism given its place
on the page.

So list A is the decisions on this node: its own answer, when alternatives are
pending on it, and its asking facts, the authority class a confirmation would
confer, the node's existence, and its persistence where the recommendation
would change its shape. Every decision that is a question is a node, and a node
is ruled in the ruling order, from the rail, on its own screen. The right-hand
pane carries the node as it would stand and, beneath it, the unanswered
children as indications: what they ask, what a ruling here unblocks, and what
the settling count already counts.

This is closer to the author's first statement than the sitting's reading of it
was. The examples given on 2026-09-03 were "authority and permanence", both
facts about the answer and neither a question under it, and the sitting
generalised from them to children on no warrant. The correction is recorded on
this node and on the `aspects-are-nodes` alternative on
`commons.systems/disposition-graph/dialogue`, whose text carried the same
sentence.

One thing the correction sharpens rather than settles. A node whose children
are all unanswered has a pane full of indications and a list A of facts alone,
which is a thin screen; the author rules on the parent's own answer and its
class, and the substance is on the children's screens, each in its turn in the
order. That is the design working as intended, since the ancestor comes before
its descendants precisely because ruling it makes theirs decidable, but it is
worth the author seeing before they confirm, because it means the parent's
screen will often ask little and show much.

### State at compaction, 2026-09-04

Recorded at the author's direction so the sitting resumes from the record and
not from a session, which is what the checkpoint and transience nodes require
of it. Every node below carries its own state; this is the index of what the
sitting touched and what each is owed, and it is derivable from the frontier.

**The node in hand.** This node, `alignment-page`, at the **periagogic** stage.
It holds the author's six dispositions of 2026-09-03 and 2026-09-04 verbatim:
the metrics moved to the top of the rail with a justification each and the rest
of the pagehead dropped; one disposition shown at a time, selected from the
rail, with the selection marked there; list A of confirmation requests, list B
of summarized choices under each with the recommendation, its boldness, quotes
and full text as drill-down, a simple input, and a last row rejecting all
choices with feedback; the full detail rendering live in a right-aligned
context pane, amended from below the list on 2026-09-03; the bootstrap encoding
artifact, which fell to `dialogue`; and the correction of 2026-09-04 that list
A holds no children. The probe of the sitting was answered. What is owed is the
maieutic movement on the page itself: the metrics and their justifications, the
single-selection rail, and the three columns. The author has scheduled it for
after compaction.

**Where the encoding stands.** `dialogue`, at **maieutic**, carries the whole
of it: nine alternatives, of which the sitting recommends two that are
orthogonal, `aspects-are-nodes` and `first-answer-is-not-an-amendment`; the
withdrawn `aspects-compose-the-answer` and `ranges-on-whole-node-alternatives`
with the accounts of why each fell; the corrected finding "a first answer is
presented as an amendment"; the analysis of the unit of a ruling with its
clean-context corrections against it; and the author's revision of 2026-09-04
that a recommendation may be recorded at any time. Its `recommendation` field
still adopts `standing` from before the sitting and is superseded; the account
says so and says why the field is not yet rewritten.

**Nodes moved off the ruling stage by this sitting**, each because the author's
words of 2026-09-03 or 2026-09-04 contradict what its forwarded recommendation
rested on, and each keeping its recorded review pin so the frontier shows the
review as behind the words: `unanswered`, to **maieutic**, for confirmation on
a subset of the aspects within a node rather than of nodes; `evaluation`, to
**maieutic**, for the operational greenfield definition written into its answer
at the author's direction, whose pin is refreshed to the amended standing text
while its `review.of` stays as read; `growth`, already at maieutic, for the
retracted rename, the directed `partial-ratification`, and the frontier finding
that it defines boldness in the opposite direction from `dialogue`, from the
author, and from the usage.

**Nodes the ruling on `aspects-are-nodes` will reach, still at the ruling stage
and deliberately untouched.** `recording`, `authority`, `clean-context-review`,
`frontier-consistency`, `quotes`, `checkpoint` and `madr-decision-records` are
at **ruling**; `alignment-order` is at **review**; `node` is at **maieutic**.
The exposure is unchanged and is stated so it is not lost: until the ruling is
made and the kickbacks with it, the frontier shows those at the ruling stage as
ruleable under rules the author has already changed. The cascade under
`aspects-are-nodes` is six nodes, not the fourteen the withdrawn design would
have touched, and the difference is that nothing about a node changes.

**What is owed before the author rules on anything from this sitting.** The
clean-context review, on `dialogue` above all, which has had three ad-hoc
validations of single questions and no review of the batch. The three ad-hoc
validations are recorded where they bear and are not a substitute for it.

**Bootstrap authority is not granted.** The author's words of 2026-09-04 say it
will be granted before review, for the reconciliation of these nodes and the
cascading effects on the graph encoding, the re-encoding of nodes, the
alignment and review skills, and the alignment page. It is not granted by that
sentence and this sitting has none. The shim on `authority` is explicit that
the grant is for a named reconciliation, in the author's words, never assumed
and never carried over, so the session that resumes after compaction asks for
it in the turn it is needed and does not read this paragraph as the grant.

**Nothing else is held anywhere.** No ledger, no scratch file, no session
memory carries any part of this sitting, and the two pages have not been
republished, since nothing reached a ruling. The commits from `4b75af10` to
this one are the sitting's log.

### The maieutic movement, 2026-09-04

What remained after the compaction was the page itself: the metrics at the top
of the rail with their justifications, the single-selection rail, and the three
columns. The author's words settle the shape of all three; what they leave to
this node is which metrics, what the fold rule is, where a metric's link goes,
and how the columns are proportioned. Those four are what the recommendation
decides and what its boldness is about.

One claim this account carried is spent and is corrected here rather than left
standing. The clean-context review of 2026-09-03 found that the page as built
groups by stage in a fixed order and ranks only within a group, against
`alignment-order`'s one flat order. The implementation was reconciled the same
day: `orderAlignmentItems` in `packages/disposition/project.mjs` now sorts by
settling count, then rank, then id, across every graph, with the manifest's
per-graph text surfaced as a header rather than as a grouping. The finding is
answered. What is still wrong is the shim's own description of the page on
`growth`, which says "every unanswered node in rank order"; rank is not the
order and has not been since that reconciliation. The shim moves here under
this recommendation and its `for:` line is rewritten with it.

### The three classes of finding, 2026-09-04

**Contradictions within the graph.**

The record's fullest description of this page is a shim's `for:` line on
another node's answer. That is the defect this node was minted to fix, stated
in the record's own vocabulary: a page described only inside other rulings is
ratified incidentally. The shim moves here, and `growth` carries the
alternative that says so, so that one ruling moves it and the record is never
carrying it twice.

`unanswered` opens the three responses "on any subset of them", where "them"
is the unanswered nodes. This page also takes a response on one decision within
a node, a rejection row on a fact that is not itself a node. Nothing in
`unanswered` provides for that, and nothing in `recording` says what a session
does with it. Both are in this sitting's cascade and both are amended for it.

`frontier-metrics` carries the standard a metric on this page must meet, and it
carries it in the author's words on an unanswered node. `un-aligned-children`
is explicit that an unanswered disposition grounds no work. So this answer
cannot rest on that node; it restates the standard in its own words and cites
the node as provenance. The same reading applies to every citation of an
unanswered node in this sitting and is worth the review's attention, because
the sitting cites several.

**Contradictions between the graph and the AI's own knowledge.**

The record contradicts itself on which direction boldness runs, `growth`
defining it as how much rests on the record and `dialogue` and the author
defining it as how much rests on the AI's own knowledge. The fold rule is where
that contradiction would do damage rather than sit quietly: a page written
against `growth`'s definition folds away every decision the AI is least sure of
and asks about every one it is surest of, which is the exact inversion of what
the author asked for. The finding is recorded on `growth` and the fold rule in
this answer is written against the author's direction.

A whole node's markdown rendered into a third of a laptop screen is not read,
it is skimmed, and the author's stated reason for moving the detail beside the
decisions was that the result be in view while they are worked. That is the
AI's own knowledge of reading a document at that width and not the record's,
which is why the proportions are named in the answer and why the pane can take
the whole screen. It is also the whole of the case against
`decisions-are-the-widest-column`, so the author should see that it is a
design judgment and not a citation.

**Redundant seams.**

The rail's per-node mark and the footer's staged count are two renderings of
one fact, and with one node shown at a time they are the only state that spans
nodes. Both are kept deliberately: the mark answers "which nodes have I
touched", the count answers "how much am I about to submit", and a reader who
has scrolled the rail can see neither from the other.

`frontier-metrics` and this node ask different questions about the same kind of
thing, and the seam between them is a shared standard, not a shared answer.
Recorded so that a later ruling on either does not read the other as settled.

### Evaluated twice, 2026-09-04

Fresh judgment produced the answer above. The pass with reference to tradition
surfaced two that bear on it, and both are recorded as readings under this
node, as `readings` and `evaluation` require: `master-detail-selection`, which
the single-selection rail adopts with two divergences, and
`progressive-disclosure`, which the middle column adopts in shape while
diverging on the criterion for the split. The metric question's ground is the
author's own standard and the record's `instruments` vocabulary; the tradition
pass found nothing there that changes the answer, and nothing is recorded as a
reading that did not inform it.

The steelman from the traditions is the one-panel master-detail: a single
detail panel, the decisions and the result in one column, on the tradition's
own argument that the reader's attention has one object. It is answered in the
reading, and the answer is that the two panels have one object between them,
the node, and that the author ruled the result into view rather than after the
list. The alternative that survives the steelman is
`decisions-are-the-widest-column`, which is recorded.

### Tested against the record it joins, 2026-09-04

The `under` chain to the ceiling: `projection`, this node's parent, whose one
clause naming the page this answer refines rather than contradicts; `scope`;
`purpose`; and `commons.systems/public/agency` at the root. The global-tier
nodes: `materialization`, under which this page is the projection of this
node's answer and the shim is the stopgap until the projector writes it;
`session-context`, which this answer does not touch, since the page is not one
of the three things a session loads; `evaluation`, whose greenfield test this
answer was written under, no argument from what is already built appearing in
it; `authority`, under which this recommendation's `ratified` class is
justified below; and `delegation`, untouched.

The answer contradicts no doctrine, because nothing is ratified. It does
contradict two standing deferred texts, `growth`'s shim and `unanswered`'s
"any subset of them", and in both cases the contradiction is recorded as an
alternative on the node it contradicts rather than written here as though it
were settled, which is what `authority` requires.

### The recommendation and its three facts, 2026-09-04

Adopts `three-column-ruling-screen`, the answer in the fence above.

**Authority: ratified.** Being wrong here is cheap to fix, since it is a page.
But this page is the instrument through which every ratification the author
ever gives will pass, and a page that folds a decision away is a page that
takes it. That is capture-shaped, which is the record's own reason to escalate
a class toward ratified, and it is why the fold rule is in the answer and not
in the implementation.

**Boldness: moderate.** The shape is the author's, in their words, and is
quoted above: the metrics at the top of the rail, the rest of the pagehead
dropped, one node at a time from the rail with the selection marked, the
decisions with their choices and drill-downs and rejections, and the result in
a right-aligned pane. What rests on the AI is the choice of the four metrics
against the author's standard, the fold rule's direction, the link's target,
and the proportions of the columns. None of the four is structural and all four
are recorded as decisions the author can take differently.

**Persistence: standing**, with one shim carried in the fence: the artifact
itself, moved here from `growth` with its declaration date intact and its
liquidation condition unchanged.

The three exits are open. The author may amend the answer, defer it, so that it
stays a deferred draft on the frontier, or claim authority over the AI's
account of the proportions and the metric set, which is the part of it that is
the AI's own judgment.

This recommendation is not reviewed. The clean-context review is owed on it and
on the rest of this sitting's batch, and the author's instruction stops the
sitting before it.

### The sitting closed at maieutic, 2026-09-04

This supersedes the state index above, which was written for the compaction and
is now behind. Every node in the sitting's scope is through its maieutic
movement and none has been sent to review, which is where the author stopped
the sitting.

**Through maieutic, each with a recommendation and a fence.** This node, with
its first answer, adopting `three-column-ruling-screen`. `dialogue`, adopting
`aspects-are-nodes`, whose fence was drafted on 2026-09-04. `growth`, adopting
`boldness-reversed`, which reverses the definition of boldness and hands this
page's description and its shim to this node. `unanswered`, adopting
`responses-on-decisions-and-children`. `recording`, kicked back from the ruling
stage and adopting `responses-classified-per-decision`. `alignment-order`,
kicked back from the review stage with its fence amended for the author's
correction of 2026-09-04, its recommendation still `settle-counts-nodes-only`.
`evaluation` was already through maieutic with the greenfield definition in its
answer and its pin refreshed.

**Two readings minted under this node**, `master-detail-selection` and
`progressive-disclosure`, both deferred until the author reads the sources.

**Still at the ruling stage and reached by the ruling on `aspects-are-nodes`,
deliberately untouched:** `authority`, `clean-context-review`,
`frontier-consistency`, `quotes`, `checkpoint`, and `madr-decision-records`.
`node` is at maieutic and is untouched, because nothing about a node changes
under this design. The exposure is what it was: until the ruling is made, those
at the ruling stage show as ruleable under rules the author has already changed.

**What is owed, in the author's order.** The bootstrap grant, then the
reconciliation it authorises, then the clean-context review of the batch, then
the author's rulings. The grant is not held by this sitting and is not implied
by any sentence in this record.

### The grant, and what it authorises, 2026-09-04

Granted in the author's words, above, for a named reconciliation, which is what
the shim on `authority` requires of a grant. It authorises what the sitting
asked for and nothing beyond it: the `aspects-are-nodes` re-encoding across the
graph, the reader, validator and projector, the alignment and review skills,
the rule projection that is behind, and both published pages. Everything
written under it is stamped deferred, since the dialectic has not concluded,
and the clean-context review of the batch still runs on what the reconciliation
wrote before the author rules on any of it. The grant is spent with that
landing and is not carried into the next sitting.

One ordering the grant forces and the account states so it is not read as
drift. The graph and the implementation are separate refs, and the reader's
exact-key check on `recommendation` means the old reader rejects the new
encoding and the new reader rejects the old. The implementation lands first and
the graph immediately after, so there is a window in which `origin/disposition`
and `origin/greenfield` disagree. It cannot be closed by ordering, only made
short.

### The reconciliation, under the grant of 2026-09-04

What was written, and the judgments inside it that are the AI's rather than
the record's, so the review and the author can see them.

**The graph's re-encoding.** Fifty-six nodes gained `facts`. The
`authority` fact was written on every node carrying a recommendation, its
`adopts` taken from the `class` that recommendation carried and its
`boldness` from the recommendation's own; where a node carries a prune
alternative but no recommendation, the boldness defaults to `moderate`,
which is a mechanical default and not a judgment about that node. Fifty-four
`class` keys left the recommendation. Six nodes carried a prune alternative,
which became the `existence` fact with the alternative's prose moved into a
`## Facts` subsection; only `audience`, whose recommendation adopted the
prune, carries `existence: prune`, and the other five carry `keep` with the
prune as the choice beside it. Two nodes gained `persistence`, `growth` and
this one, because the recommendation on each changes the node's shape by
moving the alignment page's shim; those two were written by hand and their
choices are named in their `## Facts`.

**The verification that mattered.** The finding recorded on `dialogue`, that
`facts` had to join `stripDialogueFrontmatterLines` or every pin in the
record would go stale at once, was fixed and then checked rather than
assumed: the graph at `ea34be71` read by the old reader and the graph after
the re-encoding read by the new one give the same standing hash for all
seventy-two nodes, none moved, and no recommendation pin is stale in either.
The encoding change is invisible to the standing text, which is what the
answer requires of dialogue state.

**The implementation.** The reader validates the three reserved names, a
fact adopting one of its own choices, a ruling naming one too, the
`authority` fact's choices drawn only from the classes a confirmation
confers, and `## Facts` subsections as a subsequence of the facts in order;
the prune exception on the fence is gone, since every adopted alternative
now has a text to quote. The projector's alignment page is the three-column
screen this node's answer describes, and the browser and the frontier both
show the facts. The alignment and review skills carry the reversed direction
of boldness, the recommendation recordable at any stage, responses on
decisions and on children, the stamp taken from the `authority` fact, and
the page's description cited rather than restated. `.claude/rules/evaluation.md`
was regenerated; it was the only rule projection behind.

**What the reconciliation did not do.** It wrote no answer onto any node and
stamped nothing. Every recommendation from this sitting is still
unanswered, and the clean-context review of the batch has not run. The grant
is spent with this landing.


### What `agency` renders, and why, 2026-09-04

The author read `commons.systems/public/agency` on the published page and
found the middle column unreadable: the ask names no question, the choices
read as ids, and the first choice, `standing`, offers to confirm ground the
author says does not exist. They asked whether this is sparse dialogue state
left from before the current disposition, or something structural.

It is structural, and none of it is left over. Agency's state is unusually
full, not sparse: two alternatives sourced to the clean-context review with
prose on each, a kickback verdict, and four account sections. The page renders
it badly for four reasons, each of them current.

**The word `standing` claims an authority no node on this page has.**
`renderPane` computes `stamped` as `n.authority !== null`, and the caption it
picks from that reads "Confirm ratifies the node as it stands. Nothing else is
proposed." But `authority` says a deferred answer is unanswered until the
author rules, and the author's ruling of 2026-09-03 on `unanswered`
reclassified every deferred answer in the record. Measured against the graph at
`49329b42`: of 72 nodes carrying a stage, **none is ratified**, 46 carry a
deferred stamp and 26 carry none. So the test never once means what it reads
as, and 33 nodes tell the author they are ratifying a node "as it stands" when
what stands is an AI draft they have never confirmed. On `agency` this is the
worst case the record can produce, and the node's own review said so before the
page did: the answer is written in the author's first person by the AI, and the
review kicked the node back to the periagogic stage because "a bare confirmation
here ends the grant on a stamp the record calls invalid". The page offers that
bare confirmation as the first choice on the graph's root question.

**The caption contradicts the column beside it, on 27 of 72 nodes.** "Nothing
else is proposed" is printed while the middle column offers between one and
five alternatives. This is a seam the split opened: the alternatives used to
live in the same pane as the caption, and the caption was never re-read against
the two-column form this sitting adopted. Agency is one of the 27.

**A choice row names an alternative and never says what it proposes.** The row
renders `c.label`, the alternative's slug, in mono; the sentence saying what it
would answer is behind a closed `<details>` reading "What this would answer".
So `structural-test` and `authors-own-arche` appear as bare ids, which is
exactly what the author reports seeing. This inverts the reading this node
adopts: `progressive-disclosure` splits by what the reader needs most often,
and what the author needs at a ruling is what each option says. The slug is the
handle the record uses; the sentence is the decision. The page folded the
decision and showed the handle.

**The ruling control is stage-blind.** Agency is at `stage: periagogic`, which
names the movement owed: the author's own account of the ground, never skipped.
Twenty-nine nodes at the periagogic or maieutic stage are nonetheless offered
a `standing` choice, a full ruling surface identical to a ruling-stage node's.
The page does hold the right sentence — `STAGE_HINT.periagogic`, "The dialogue
owes your account of the ground first; your words here are recorded verbatim" —
but prints it at the foot of the other column, below the node, the indications,
the review and two drill-downs. The page knew, and said so where it would not
be read.

Two of the four are language and two are structure, and only one behaviour is
worth keeping as it is: leading a stamped node with the word-diff rather than
the whole is right, because the author does need to see what changes. What is
wrong is calling the result "the node as it stands" and telling the author a
confirmation ratifies it.

### A latent defect found in the reconciliation, 2026-09-04

Found while reconciling the two columns, and not by any of the author's four
findings. The page's `alReadControl` read the whole-node response with
`el.querySelector('input[type="radio"]:checked')` scoped to the whole item.
The decisions and the whole-node control are both radios inside that item, so
the selector returned whichever came first in the document: with the decisions
ahead of the control, choosing an alternative was read back as the node's own
ruling and staged as `ruling: "<the alternative's name>"` where `confirm`,
`edit` or `deny` was meant. `alSyncNoteLabel` mislabelled the textarea from the
same read, and `alHasResponse` counted the item as answered on it.

Nothing was corrupted. The `responses` collection on the published page was
read on 2026-09-04 and holds no document at all, so the defect never met a
real response. It is recorded because it was latent rather than absent: the
author has not yet ruled from the page, and the first ruling made on a node
with a decision on it would have been the one to store the wrong value.

Fixed by scoping every read and write of the control to `[data-controls]`,
the control's own fieldset, which holds no decision. Recorded here rather than
carried silently because it bears on the answer: two sets of radios under one
item is what made it possible, and the answer's division of the columns does
not by itself prevent it -- the reordering this sitting makes would have
hidden the defect at the periagogic and maieutic stages, where the control now
comes first, and left it standing at review and ruling.

### The purpose finding, answered at last, 2026-09-04

The author's fifth disposition of 2026-09-03 said that nodes "still indicate
that they are edits to confirmed dispositions (there appears to be a ground
version that is being diffed) even though no node is yet confirmed", naming
`commons.systems/disposition-graph/purpose`, and judged it a bootstrap
encoding artifact.

It was not an encoding artifact and it was still live today. The projector
chose between showing a diff and showing the whole node on `n.authority !==
null`, the same wrong test that produced the author's four findings of
2026-09-04, and the correction to it -- test the stamp's class, not its
presence -- moves `purpose` onto the diff path rather than off it, since
`purpose` carries an answer and a fence and no stamp at all. Fourteen nodes
now lead with a diff where thirteen did before.

That is the right behaviour and the finding is still answered: what the author
objected to was the implication, not the diff. The author does need to see what
a ruling changes. So the diff says what it is a diff against -- "The edit,
against a draft no one has confirmed" on all fourteen today, and "against the
ratified answer" on none, because nothing in the record is ratified. When the
first node is ratified the label will say so on it and on no other, which is
the distinction the record has and the page did not.

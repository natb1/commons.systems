---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: the-line-that-names-what-the-pane-shows
        source: ai
        ref: "2026-09-06"
      - name: on-the-answer-fact
        source: review
        ref: "2026-09-06"
      - name: warning-on-the-stage-chip
        source: ai
        ref: "2026-09-06"
      - name: warning-in-the-eyebrow
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the parent's answer names that line's contents exhaustively and argues that a word summarising the rulings there is the facts said twice"
      - name: no-per-node-warning
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the absence of a confirmed mark on every row is not an indication, and it is the reading of a draft as the record that the author found on agency"
    recommends: the-line-that-names-what-the-pane-shows
    boldness: moderate
    stands: the-line-that-names-what-the-pane-shows
    against: "The author said only that a single indication per node is fine, which permits the indication and settles nothing about where it goes, so the placement is the AI's and it puts the record's one warning about the AI's own drafting in the column the author reads last rather than in the column that asks."
  - name: authority
    options:
      - name: ratified
        source: ai
        ref: "2026-09-06"
      - name: delegated
        source: ai
        ref: "2026-09-06"
      - name: deferred
        source: ai
        ref: "2026-09-06"
    recommends: ratified
    boldness: low
    against: "The placement of one line is layout, reversible and cheap to get wrong, and a ratified ruling here stops any delegation from reaching it."
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-06
  of: 563a013626577e229ea041df4584df4f5e36d332
  commit: 3b32bdc3bfdb067c56ea16edf91d95d0489c8bea
  against: "The column this answer chooses is the one column the parent reserves for the disposition alone, and the parent's reason for the reserve is the reason a warning put there may not work: \"every sentence of apparatus in it is a sentence they must read past to see it\". Worse, the act the warning guards is not performed in that column: confirmations are staged on option rows in the column that asks, and the sibling `what-an-option-row-carries` has just stripped every standing mark off those rows, so the author can confirm an AI draft with no indication anywhere near the control they confirm with. The draft's reply to `warning-on-the-stage-chip` — that the chip is dialogue state which the recording removes, where the standing of a text is not — cuts the other way, since the indication is needed only while nothing is confirmed, which is exactly while the dialogue is open. And once the criterion is corrected as finding 1 asks, the ruled form fires on no node until the first ratification, so what the answer actually installs is one unconditional sentence in the reading column while the ratifying happens in the other. What survives for the recommendation is that the thing warned about is a text and the text is there; what is still unanswered is that the thing guarded against is an act, and the act is elsewhere."
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/dialogue#every-part-in-the-record
  - commons.systems/disposition-graph/alignment-page#standing-named-in-the-pane
---
## Disposition

The author, 2026-09-04, on `commons.systems/public/agency`, carried on `alignment-page`, which is the finding this question exists to answer:
> I don't understand what "standing" would even refer to. This node has not yet been answered, there is no ground to confirm as standing

The author, 2026-09-06, in the sitting on `what-an-option-row-carries`, when the `stands` chip stopped carrying the warning:
> A single indication per node to indicate that node is not yet confirmed is fine.

## Answer

In the heading of the right-hand column, which already names what that column is
showing, once per node and nowhere else on the page.

The heading is one line on every node whose right-hand column is rendered:
`PANE_LBL`, written outside the branch in `renderPane` and so present in every
case that function has. It takes three forms, and what chooses between them is
what the column is actually showing, read off two things the record holds
directly. Whether the node carries a recommended text, since where one exists the
column renders the AI's proposal whatever stands beneath it. And whether the
answer fact carries a ruling, which is the only thing that makes a text the
author's rather than the AI's.

Where a recommended text is present the heading says the column is showing the
AI's proposal, and says that no one has confirmed it. That is true whether or not
an answer stands beneath, because what is rendered is the proposal; what the
proposal would change is the business of the line below it and not of the
heading. Where no recommended text is present and the answer fact carries a
ruling, the heading says the column is showing the answer the author confirmed.
Where no recommended text is present and the answer fact carries no ruling, it
says the column is showing the AI's draft and that nothing in it has been
confirmed. Every node of the record is in the third case today.

The criterion is the answer fact's own ruling and not whether a ruling reaches
the node, and the difference is the whole of the warning. A ruling reaching the
node is the record's phrase for its having a class at all, and `alignment-page`
says in terms that a class is "about who decides and not about this text", so a
node ruled delegated or deferred, or one an ancestor's grant reaches, carries no
confirmed text and must not be headed as though it did. `standingState` in the
projector already keys on `ratified` alone and this answer keys on the same
thing.

Nor is the word the author could not read used in any of the three. An earlier
draft carved the forms off `renderPane`'s branches; a second re-keyed them onto
rulings and so replaced a false claim of standing with a false claim of
confirmation. The forms above name who wrote what is shown and whether the author
has confirmed it, which is what the author asked for and is sayable without
either fault.

The ground-naming line beneath is a different line and is not this answer's.
`edit-lbl` says whether a diff is against the ratified answer or against a draft
no one has confirmed, and it is written only where a node carries both an answer
and a recommended text; it was added for the author's finding of 2026-09-03 that
a diff implies a ground the record does not have, and it stays. This answer adds
no second such line: the heading names what the column shows and who wrote it,
the line beneath names what a diff is against, and on the one kind of node that
has both they are two different facts.

The reason is what the column is for. The thing the indication warns about is a
text; the text is in that column and nowhere else; and a reader meets the warning
in the same glance as the thing warned about, which no other placement achieves.
`dialogue`'s `every-part-in-the-record` asks the projections to "lead with the
edit wherever an answer stands and name the ground it is against, so that a first
answer is named as one by what the projection says of it", which is this
requirement stated for the diff; what this answer adds is that a projection names
a first answer as one in the heading too, and not only where a diff makes the
question unavoidable.

One qualification, per node, in the column that holds the disposition. The rows
carry no part of it: what a row carries is `what-an-option-row-carries`'
question, and that answer takes the mark off the row because whether a node is
confirmed is a fact about the node and not a status of one option among several.

Where a node carries neither an answer nor a recommended text the column is not
rendered at all and the page says nothing, since there is no disposition to
qualify and inventing one to disclaim would be a worse fault than silence.
Measured on 2026-09-06: 21 of the record's 140 nodes are in that case, so the
column is rendered on 119 and the heading is written 119 times.

Two clauses of `alignment-page` are touched by this and neither is devolved to
this node: its naming paragraph, which says the row tells the author that
confirming ratifies the AI's draft, and its account of the right-hand column,
which says that column carries "no control, no caption, no indication, no
drill-down". Both are the parent's own apparatus rule. This answer does not amend
them; the survivor is the option `standing-named-in-the-pane` on
`alignment-page`'s answer fact, named in this node's `depends`. The consequence
is worth stating plainly: a ruling here is not implementable until that option is
ruled, because the parent's reserve forbids in one word the thing this answer
puts there.
## Rationale

Two words of the author's and one requirement of the record's. The finding of
2026-09-04, on `commons.systems/public/agency`: "I don't understand what
'standing' would even refer to. This node has not yet been answered, there is no
ground to confirm as standing." That is the fault this question exists to fix,
and it is a fault of a heading and not of a row. The permission of 2026-09-06,
given when the sibling took the mark off the row: "A single indication per node
to indicate that node is not yet confirmed is fine." That fixes the cardinality
and leaves the placement to the AI, which is why the boldness is moderate and why
the reading's counter-argument on placement is carried at full strength.

The requirement is `dialogue`'s `every-part-in-the-record`, which asks the
projections to "lead with the edit wherever an answer stands and name the ground
it is against, so that a first answer is named as one by what the projection says
of it". That is the confirmed-from-unconfirmed distinction, stated for the diff.
The right-hand column's heading is where the same distinction is owed for every
node whose column is rendered, and today the heading says "The node as it would
stand" on all 119 of them, which claims for every one of them a standing no
answer fact of this record carries. What the answer beat is on the fact: the
stage chip and the answer fact, both in the column that asks, and the reading of
the absence of a mark as an indication in itself.

## Facts

### answer

Recommended on what the column is for. The thing the indication warns about is a
text; that column is where the text is; and the author meets the warning in the
same glance as the thing warned about. No other placement does that: the chip and
the eyebrow are in the column that asks, where the text is not, and an absence is
not an indication at all.

That the heading already exists is deliberately not a reason. The evaluation node
strikes what the incumbent implementation already does from the choosing, and an
earlier draft of this answer rested on exactly that — "it is completed rather
than minted" — which is an incumbent fact doing the work of a design constraint.
The design reason above survives without it, and the cheapness of the change is a
consequence and not a ground.

The word this answer does not use is the author's own objection, and the earlier
draft of it did use the word, which is why the claim is made carefully here. The
author wrote of `commons.systems/public/agency` that they did not understand what
"standing" would refer to on a node that has not been answered, and
`alignment-page`'s own answer rejects the phrase "the node as it stands" by name.
The heading in the answer above says who wrote the text and whether anyone has
confirmed it, and uses neither the word nor the phrase; the draft that did use it
was carrying three cases carved off the projector's branches, and dropping to two
keyed on the ruling removed the occasion for it rather than the word alone.

Boldness moderate. The author permitted an indication per node and did not place
it, so the placement rests on the AI, and the reading of 2026-09-06 returned a
counter-argument against the placement that the answer does not fully meet: the
act guarded is a confirmation, and a confirmation is staged in the other column.

#### on-the-answer-fact

Everything the recommended option says, with the indication in the column that
asks rather than the column that shows: one line on the answer fact, above its
options, saying that no ruling reaches this node and that confirming one of these
options is the first. It is neither a row's mark nor a chip, so it survives both
of the objections the other placements meet, and it puts the warning beside the
control the author actually confirms with, which is the counter-argument this
reading returned against the recommendation. Against it: the answer fact is one
of several and the fact is not what is unconfirmed, the node is; and a line above
one fact's options is apparatus inside the asking column, which the parent's
answer keeps clear on the argument that every sentence of apparatus there is a
sentence the author must read past. And the heading of a fact is
`how-a-fact-is-headed`'s question, which stands at the periagogic stage with no
answer and no facts, so an answer here that writes a line above a fact's options
would settle part of a question that node has not begun.

#### warning-on-the-stage-chip

Everything the recommended option says, with the indication on the stage chip
instead of on the line that names what the pane shows. The chip is the node's one
status object, already carrying the stage, the two readings' readiness and the
open probe count, so the node's state would be in one place and at the head of
the column that asks, which is where the author decides. Against it: the thing
warned about is the text and the text is in the other column; the chip is
dialogue state, which the recording removes, where the standing of a text is not;
and the column's heading has to exist anyway, being written for every node the
page renders, so the chip would be a second place for a sentence that has one
already and would leave the heading naming the wrong part of the record.

#### warning-in-the-eyebrow

Everything the recommended option says, with the indication in the line beneath
the question and the id, among the settling count, the options pending and the
nodes this one stands under. Passed over: `alignment-page`'s answer names that
line's contents and says nothing else is in it, on the argument that a line no
answer names collects what no answer justifies, and it argues specifically that a
word there summarising the rulings on the facts is the facts said twice.

#### no-per-node-warning

No indication anywhere: the confirmed mark is absent from every row of an
unconfirmed node, and that absence is the indication. Passed over: the author's
words of 2026-09-06 permit an indication rather than requiring none, and absence
is precisely what a reader cannot see. It is also the state the author already
found and objected to on `commons.systems/public/agency`, where an AI draft
written in the author's own voice read as the record.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test, and on no
other: the object is the placement of one line, which costs a projector change to
get wrong and can be changed back, so neither the expensive nor the irreversible
limb is met. The limb that is met is met exactly. This indication is the record's
only device for telling the author that the text they are about to confirm is the
AI's draft and not their record; the party that would set its placement is the
AI, and the thing placed exists to check the AI. A warning about the AI's own
drafting, placed by the AI where the AI judges it will be seen, is the party
checked deciding the strength of the check. Low boldness: the limb is
`alignment-page`'s own recorded reading on its authority fact, narrowed to this
object, and the evidence is the author's finding of 2026-09-04 quoted above.

## Account

### Minted, 2026-09-06

Minted in the sitting on `what-an-option-row-carries`, on the first finding of
that node's clean-context reading of 2026-09-06, validated at its loci on the
main thread. That node's question is what an option's row carries at the first
level, and `alignment-page` devolves exactly that and no more: "What an option's
row carries at the first level is the `what-an-option-row-carries` node's
question, on those words, and what this answer says of the row stands only until
that node rules." The draft written there had decided a second thing, where the
page says once per node that nothing on the node is confirmed, and the amendment
that decision drove reached two clauses of the parent that the parent has not
devolved, its naming paragraph and its account of the right-hand column. A ruling
on the row's contents would have carried a settlement of the parent's own
apparatus rule with it, which is authority widening on the way down.

So the decision is a node, on the survival test: the answer would be needed after
the row's contents are ruled, it has four candidates of its own, and its facts do
not repeat the row node's. Three of its options come from that node's answer fact
with their prose, and the fourth is what that node's recommendation had folded
into itself. `what-an-option-row-carries` keeps the departure of the standing
mark from the row, which is its own question, names this node as what places it,
and enters it in `depends`.

The author's words are transferred and not copied out of a live node: the finding
of 2026-09-04 stands on `alignment-page` too, where it was recorded, and the
permission of 2026-09-06 stands on `what-an-option-row-carries`, where it was
given. Both are quoted here because this is the node they now bear on.

The clean-context reading of this draft is owed before the author rules.

### Clean-context review, 2026-09-06, of 387e98da

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `the-line-that-names-what-the-pane-shows`.

Findings:

- Answer, third paragraph, and the whole placement (validation 2, doctrine; the authority-widening this node was minted to close). The draft settles two clauses of its parent that the parent has not devolved and that the draft never names. (a) The naming paragraph of `alignment-page` (disposition/disposition-graph/alignment-page.md:501): "A choice that keeps the text already in the record is named for the authority that text has and never for more, and that name is its status. ... so the row says that confirming ratifies the AI's draft." The draft says the contrary: "a node's rows carry no part of it". (b) The right-hand column paragraph (alignment-page.md:505): "Nothing that is about the ruling shares the column with it -- no control, no caption, no indication, no drill-down -- because the column's one job is to show the author the thing they are ruling on". The draft puts an indication in exactly that column, in all three cases. These are the two clauses the clean-context reading of `what-an-option-row-carries` named on 2026-09-06 as clauses "the parent has not devolved", and its own suggested edit applies here unchanged: a ruling on this node would carry a settlement of the parent's apparatus rule with it. Suggested edit: add to the Answer a sentence in the form the parent uses for its devolved clauses -- that the parent's naming paragraph and its "nothing about the ruling shares the column" clause stand only until this node rules -- and record an option on `commons.systems/disposition-graph/alignment-page` with source this node, named `standing-named-in-the-pane`, carrying the prose: "Everything the answer says, with the standing of the text struck from the naming paragraph's row clause and the right-hand column's exclusion qualified, so that the one line naming what the column shows, and the ground it shows the text against, is excepted from 'no caption, no indication' as the edit-ground clause in the same paragraph already is." A finding about another node, for the session and not for this reading to apply.
- Facts, `### answer`, first paragraph, and Answer, second paragraph (validation 2, against `evaluation`). The recommendation's first stated reason is "Recommended because the line already exists, in the one case the author complained of, and completing it is cheaper than minting a second home for a sentence that has one", and the Answer carries the same reasoning in "It is completed rather than minted". `evaluation` strikes that class of argument from the choosing by name -- "what a change would cost to migrate, how many files or nodes it touches, ... and that the incumbent already does it the other way. None of those bear on whether a design is right, and a recommendation resting on one of them has not been made" -- and says the error to hunt is "an incumbent fact doing the work of a design constraint". The recommendation survives because its second paragraph gives a design reason (the thing warned about is a text and the text is in that column), so this is redrawing and not rethinking. Suggested edit: lead the fact's reason with the placement argument; state the incumbency as what the design costs ("one projector change and no new surface"), which `evaluation` permits as a consequence; and recast the third limb of `warning-on-the-stage-chip`'s "against it" -- "a second home for a sentence that already has one" -- as the one-fact-in-two-places argument the record already holds (`codd-update-anomaly`, `dry-single-source-of-truth`) rather than as a cost.
- Answer, second paragraph, "That line already exists for one of the three cases the column renders" (validation 3, a claim about the implementation). Verified against packages/disposition/project.mjs: the line that names what the pane is showing is `PANE_LBL = "The node as it would stand"` (line 682), emitted once for every case at line 1815; the line that names the ground is a different one, the `edit-lbl` "The edit, against the ratified answer" / "The edit, against a draft no one has confirmed" (lines 1797-1802), rendered only where a node carries both an answer and a fence. So the naming line exists in all three cases and today claims a standing in each of them, in the very words the record elsewhere rejects ("Naming it 'the node as it stands' claims a standing the text does not have"); what exists in one case only is the ground it names. As written the answer does not say which of the two lines is completed, and if the ground-naming is added beside `PANE_LBL` the pane carries two naming lines and "once per node, and nowhere else on the page" is not met. Suggested edit: "The line that names what the column is showing renders in all three cases and today says only 'The node as it would stand'. What exists in one case only is the ground it names ... The completion is of that naming line itself, which says in each case what is shown and what standing it has, and 'The node as it would stand' goes with it."
- Facts, `### answer`, "the line already exists, in the one case the author complained of" (validation 3, exactness). The clause is ambiguous between the two complaints the node rests on, and reads false against the node's own framing. Of the finding of 2026-09-03 on `purpose` it is true: that node carries an answer and a fence, so the ground line renders. Of the finding of 2026-09-04 on `commons.systems/public/agency` -- which this node's `## Disposition` calls "the finding this question exists to answer" -- it is false: disposition/public/agency.md carries `## Answer` and no `## Recommendation`, so `renderPane` takes the answer-only branch and emits no ground line at all, and the author's words there were about a row in the asking column and not about the pane. Suggested edit: name the complaint -- "the line already exists in the diff case, written for the author's finding of 2026-09-03 on `purpose`" -- and add that on `agency`, the node whose finding this question exists to answer, the column renders no such line, which is the gap the completion fills.
- Answer, second paragraph, and `depends` (validation 12, cross-reference; validation 15, merge). `dialogue`'s recommended answer `every-part-in-the-record` already prescribes for every projection what this draft's first and third cases say: "Wherever an answer stands they lead with the edit this ruling would make and name what that edit is against: the answer as ratified where the answer fact carries a ruling, and a draft no one has confirmed where it does not, whatever class a ruling on the authority fact confers ... Where no answer stands there is nothing to diff and the recommended text is shown whole. A first answer is thereby named as one, by its ground". The draft attributes the line only to the author's finding of 2026-09-03 and to `renderPane`, and carries `depends: none`. This is not a merge -- what is this node's own is the page-level placement, "once per node, and nowhere else", and the second case, which the dialogue rule does not reach -- but the citation is owed. Suggested edit: cite `commons.systems/disposition-graph/dialogue#every-part-in-the-record` in the second paragraph as the record-wide rule this page applies, say what this node adds beyond it, and enter that node and option in `depends`, as the parent does. (The absence of `what-an-option-row-carries` from `depends` is right: that node already depends on this one, and a loop is no order.)
- Answer, second paragraph, "the text and the standing it has, where an answer stands and nothing would change it" (validation 1, the author's words). The clause reuses the one word the author said they could not read: "I don't understand what 'standing' would even refer to. This node has not yet been answered, there is no ground to confirm as standing." It also reaches a case the question does not ask about, a text that is confirmed. Suggested edit: name the two states in the record's own terms -- "the text and what it is: the answer as ratified where the answer fact carries a ruling, and a draft no one has confirmed where it does not" -- which keeps the line exhaustive without the word and without claiming standing for a draft.
- Node shape: no `## Rationale`. Every other node under `alignment-page` carries one (`what-an-option-row-carries`, `ruling-transport`, `progressive-disclosure`, the parent itself); this node's reasoning for what stands lives only in the answer fact's opening paragraph. The validator does not require it (`node packages/disposition/validate.mjs disposition` reports `ok: 140 nodes`), but `renderPane` renders the Rationale into the right-hand column, so the author reading the disposition itself meets the answer with no reasoning beside it, and the recording quotes the author's words into the rationale. Suggested edit: add a short `## Rationale` carrying the placement argument once redrawn, or say on the fact why the reasoning stays there.

On the facts and what they recommend: The answer fact recommends `the-line-that-names-what-the-pane-shows` at moderate boldness and that option is also `stands`, so no `## Recommendation` fence is due and none is present, which is correct; no existence or persistence fact is carried and none is owed, since the recommendation changes nothing of the node's shape. Moderate boldness on the answer is defensible and if anything low: the author permitted an indication and placed nothing, and the placement also settles two clauses of the parent. The authority fact recommends ratified at low boldness on the capture-shaped limb alone, with the written reading `class-recommendation` requires, and the limb checks out against `alignment-page`'s own authority reading ("a row that mis-states what a confirmation does ... is capture-shaped"); neither reading nor pin is stale, since no reading has run.

On the viability of the options: All four options on the answer fact are viable as listed, and the two passed over are passed for sound reasons that hold against the record: `warning-in-the-eyebrow` against the parent's exhaustive naming of that line, and `no-per-node-warning` against the author's permission of 2026-09-06 and their own finding on `agency`. One viable option is missing, and it is the one the recommendation's own case against points at -- an indication in the column that asks, but neither on a row nor on the chip. Name it `on-the-answer-fact`, prose: "Everything the recommended option says, with the indication on the answer fact's own section in the column that asks, once per node: the fact whose ruling would confer standing says, above its options, what standing the text under it has today, so the warning sits on the decision it is about and beside the control the confirmation is staged on. It is not a row, so `what-an-option-row-carries` does not reach it, and it is not the chip, so the recording does not remove it with the dialogue. Against it: the heading and contents of a fact's section are `how-a-fact-is-headed`'s question, still at the periagogic stage, so the placement reaches into an unruled sibling; and the text warned about is rendered in the other column, a screen's width from the warning."

Strongest counter-argument (moderate): The column this answer chooses is the one column the parent reserves for the disposition and nothing else, and the parent's reason for that reserve is exactly the reason a warning put there will not work: "every sentence of apparatus in it is a sentence they must read past to see it". Worse, the act the warning guards is not performed in that column at all. Confirmations are staged on option rows in the column that asks, and the sibling `what-an-option-row-carries` has just stripped every standing mark off those rows, so under this answer the author can confirm an AI draft with no indication anywhere near the control they use to do it -- the record's one warning about the AI's own drafting sits in the reading column while the ratifying happens in the other. The reply the draft gives to `warning-on-the-stage-chip`, that the chip is dialogue state which the recording removes, cuts the other way: the indication is needed only while nothing is confirmed, which is exactly while the dialogue is open, so removal at the recording is the correct lifetime and not an objection. What survives for the recommendation is that the thing warned about is a text and the text is there; what is not answered is that the thing guarded against is an act, and the act is elsewhere.

The session's reply: Accepted whole. The first finding is the mint's own failure repeated one level up: this node was created because its sibling was settling clauses the parent had not devolved, and its draft then settled two others the same way. Both are marked and the survivor is recorded as an option on `alignment-page`. The second is the greenfield lens applied to the AI, correctly: 'the line already exists, so complete it rather than mint one' is the incumbent doing the work of a design constraint, and the design reason survives without it. The third and fourth are factual and both were checked here: `PANE_LBL` is emitted outside the branch, in all three cases, and what varies is the `edit-lbl` ground-naming, which needs an answer and a fence together; and `commons.systems/public/agency` carries no fence, so the line could not have been what the author's finding of 2026-09-04 was about, and the draft's evidence sentence was false of the node its own Disposition names. The rest are taken as given, and `on-the-answer-fact` goes on the fact.

### The reading applied and answered, 2026-09-06

Forward, moderate, seven findings, no probes; all validated at their loci on the
main thread and all accepted. The amendment moves the recommendation, so the node
returns to the review stage and owes the re-reading.

The heaviest finding was the mint's own failure repeated one level up. This node
exists because its sibling was settling clauses `alignment-page` had not devolved,
and its own draft then settled two others the same way: the parent's naming
paragraph and its account of the right-hand column, which says that column
carries "no control, no caption, no indication, no drill-down". Both are marked as
the parent's and neither is amended here; the survivor is the option
`standing-named-in-the-pane` on `alignment-page`'s answer fact.

Two findings were factual and both were checked here rather than taken. The line
the draft said existed in one of three cases is two different lines: `PANE_LBL`,
"The node as it would stand", is written outside the branch in `renderPane` and
so heads the column in all three cases, while the ground-naming `edit-lbl`
appears only where a node has both an answer and a fence. The answer is rewritten
onto the heading, which is stronger and simpler than completing a line that only
sometimes exists. And the draft called that line the one the author complained
of; `commons.systems/public/agency` carries no fence, so it has no such line, and
the sentence was false of the very node this node's `## Disposition` names.

One finding was the greenfield lens turned on the AI, and it lands. The
recommendation's first reason was that the line already exists and is completed
rather than minted, which is an incumbent fact doing the work of a design
constraint, exactly what `evaluation` strikes from the choosing. The design
reason survives without it and the reason is redrawn; the cheapness of the change
is recorded as a consequence.

The rest: `dialogue`'s `every-part-in-the-record` already asks a projection to
say what part of the record it shows, which is this answer's requirement and was
uncited, now cited and entered in `depends`; the draft reused the word
"standing", which is the word the author said they could not read on an
unanswered node, and the heading now names the case in plain words; and the node
carried no `## Rationale` where every sibling does.

The reading's counter-argument is carried at full strength and the answer does
not fully meet it: the thing warned about is a text and the text is in that
column, but the act guarded is a confirmation and a confirmation is staged in the
other. The option `on-the-answer-fact`, which the reading raised as the viable
placement the draft was missing, is on the fact for that reason.

### Clean-context re-reading, 2026-09-06, of fa7a9fa1

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `the-line-that-names-what-the-pane-shows`.

Findings:

- Answer, second paragraph, the second of the three cases: "the node as it stands, where an answer stands and nothing would change it" (the last reading's sixth finding, validation 1, answered in the account and not in the text). The amendment removed the clause "the text and the standing it has" and the fact's own prose now claims the fix: "The word this answer does not use is the author's own objection ... the heading says which of the three cases the column is showing in plain words and does not name a standing the text may not have." That is false of the Answer it describes. `alignment-page` (disposition/disposition-graph/alignment-page.md:530) rejects this exact string: "Naming it 'the node as it stands' claims a standing the text does not have, and it reads as the safe and ordinary choice when on an AI-drafted node written in the author's own voice it is the least safe one available." The same paragraph settles which nodes it reaches: "Where no ruling stands on the answer fact it is a draft no one has confirmed, whatever class a ruling on the authority fact confers" -- which today is every node, including every node whose answer stands and which nothing would change. So the amendment writes the rejected phrase as the standing heading of the whole record, and the phrasing that made `PANE_LBL` bearable at all is the subjunctive "would" the amendment drops. Suggested edit: name the second case without the verb, in the terms `alignment-page`:530 and `dialogue#every-part-in-the-record` already use -- "the node's answer as ratified, where the answer fact carries a ruling and nothing would change it" for the ratified case, and "a draft no one has confirmed" for the rest -- and strike the fact's sentence claiming the word is gone, or make it true.
- Answer, second paragraph, the enumeration as a whole, and the sentence "The third is the whole record today" (new; the last reading read a text whose three cases were carved differently and could not have caught this). The pinned text carved the three cases on what the column renders -- "the edit and what it is an edit against; the text and the standing it has, where an answer stands and nothing would change it; and, where no answer stands at all, ..." -- which is exactly `renderPane`'s three branches (packages/disposition/project.mjs:1781 fence+answer, :1804 fence only, :1807 answer only, :1812 neither and no pane). The amendment re-carves the first and third on rulings -- "against an answer the author has ratified" and "where no ruling reaches the node at all" -- while leaving the second on the render branch, and the result is not a partition: the third's criterion subsumes the second's, so "The third is the whole record today" makes the second case empty by its own terms, and a node with an answer and a fence and no ruling (`purpose`, which the projector's own comment at :1791-1798 names) falls in the third by criterion while its pane renders a diff, which "the node as the AI proposes it" does not describe. The amendment's opening sentence claims the enumeration matches the column -- "present in all three of the cases that column has" -- and it no longer does. Suggested edit: carve the three cases on what the column renders, as the pinned text did, and let the ruling distinction stay where the amendment itself puts it, on `edit-lbl`.
- Answer, second paragraph, first case "the node as it would stand, against an answer the author has ratified", against the third paragraph, "The ground-naming line beneath it is a different line and is not this answer's ... What this answer adds is not a second such line but a qualification of the heading" (new). The first case names the ground, in the same words `edit-lbl` already carries at project.mjs:1799-1801 ("The edit, against the ratified answer"). So in the one case the first limb describes, the pane would say the ground twice, in the heading and in the line beneath it, which is the two-naming-lines failure the last reading's third finding warned of ("if the ground-naming is added beside `PANE_LBL` the pane carries two naming lines and 'once per node, and nowhere else on the page' is not met") returning in a new form, and it falsifies the Answer's own first sentence, "once per node and nowhere else on the page". Suggested edit: drop "against an answer the author has ratified" from the heading's first case and let the heading say only what is shown -- an edit, or a text -- leaving what the edit is against to `edit-lbl`, which the answer has just said is not this answer's.
- Facts, `#### warning-on-the-stage-chip`, third limb of "Against it": "the ground-naming line has to exist anyway, because a diff needs a base, so the chip would be a second home for a sentence that already has one" (the last reading's second finding, half unapplied, and now inconsistent with the amendment). The suggested edit asked in terms for this limb to be recast "as the one-fact-in-two-places argument the record already holds (`codd-update-anomaly`, `dry-single-source-of-truth`) rather than as a cost"; the session's reply says "Accepted whole" and "The rest are taken as given", and the diff leaves the option untouched. Worse, the limb now rests on the very conflation the amendment corrected: after the amendment the sentence with a home is the heading `PANE_LBL`, which renders in all three cases, not the ground-naming `edit-lbl`, which the same amendment says "is not this answer's" and which renders only in the diff case -- so as written the limb argues against the chip from a line the answer has just disclaimed. Suggested edit: recast the limb on the heading, not the ground line -- the heading names what the column shows on every node whatever the chip says, so an indication on the chip is one fact in two places -- and cite the record's own name for that fault rather than the cost of a second home.
- Answer, fourth paragraph: "a heading that names the wrong part on a hundred and forty nodes fails that requirement" (new, validation 3, exactness -- the same class of unchecked number the last reading found twice). 140 is the node count of the graph (`ls disposition-graph/*.md public/*.md | wc -l` = 140, and all 140 carry a `stage`, so the alignment page renders 140 items), but 21 of them carry neither `## Answer` nor `## Recommendation`, `renderPane` returns "" for those (project.mjs:1809-1813), and the node's own fifth paragraph says so: "Where a node carries neither an answer nor a recommended text the column is not rendered and the page says nothing". The heading therefore renders on 119 nodes, not 140. Suggested edit: "on every node whose column is rendered", which needs no count and cannot go stale.
- `depends` (new; the dependency did not exist at the pinned text). The amendment adds `commons.systems/disposition-graph/dialogue#every-part-in-the-record`, a citation dependency, and omits the far stronger one the same amendment creates. The Answer's last paragraph says the parent's "no control, no caption, no indication, no drill-down" clause is not devolved and is not amended here, and that the survivor is the option `standing-named-in-the-pane` on `alignment-page`'s answer fact -- verified present at disposition/disposition-graph/alignment-page.md:136 and :394, source this node, ref 2026-09-06, so the claim is true. But the consequence is that the recommended answer cannot be implemented unless the parent's answer fact moves to that option, which is a dependency in the ordering sense `depends` records. `alignment-page`'s own `depends` (alignment-page.md:182-188) does not name this node, so there is no loop. Suggested edit: add `commons.systems/disposition-graph/alignment-page#standing-named-in-the-pane` to `depends`, and say in the last paragraph that a ruling here is not implementable until that option is ruled for.
- Answer, fourth paragraph (the last reading's fifth finding, partially answered). The citation and the `depends` entry are in, but the suggested edit asked for three things and the third is missing: "say what this node adds beyond it". The paragraph says only that qualifying the heading "discharges" `every-part-in-the-record`, which if anything reads the other way -- as though the whole answer were that rule applied, which is the merge the last reading explicitly ruled out. What is this node's own, in the last reading's words, is "the page-level placement, 'once per node, and nowhere else', and the second case, which the dialogue rule does not reach". Suggested edit: add a clause naming the increment -- the dialogue rule says every projection must name the part of the record it shows and does not say where or how often on a page, and this node fixes both, and it reaches the case where an answer stands with nothing to diff, which the dialogue rule leaves unaddressed.
- Node shape, disposition/disposition-graph/where-the-unconfirmed-indication-goes.md:112-113 (new, cosmetic). The last Answer paragraph ends "... and not what that column is otherwise permitted to hold." and `## Rationale` follows on the next line with no blank line between. The projector's section splitter tolerates it and the validator passes, but every other section boundary in the record carries the blank line. Suggested edit: insert it.
- Closed, and recorded here so the session does not re-raise them: the first finding (authority-widening) is answered, and answered better than its own suggested edit -- the amendment names both of the parent's clauses, disclaims amending them, and records the survivor as an option on the node it conflicts with, which is what `authority` prescribes, where the suggested edit would have had this node declare a devolution the parent has not made, the very widening the node was minted to close. The third and fourth findings are answered whole: the `PANE_LBL`/`edit-lbl` distinction is now stated correctly and verified against project.mjs:682, :1799-1802, :1815, and the false clause "the line already exists, in the one case the author complained of" is gone rather than repaired. The seventh is answered: a `## Rationale` is present and carries the placement argument. The second is answered in its main clause -- the incumbency reason is struck and explicitly disowned -- and open only in the limb named above.

On the facts and what they recommend: The diff changes nothing about what either fact recommends, its boldness, what stands, or the fence: the answer fact still recommends `the-line-that-names-what-the-pane-shows` at moderate with that same option as `stands`, so no `## Recommendation` fence is due and none is present, and the authority fact still recommends `ratified` at low with its capture-shaped reading intact. What the diff adds to the facts is one option, `on-the-answer-fact`, source `review`, ref 2026-09-06, in the position the last reading named, with the prose it supplied lightly reworded and its "against it" kept; the fact's opening reason is rewritten and the two `against` strings are unchanged.

On the viability of the options: The diff leaves every option viable and adds one that is. `on-the-answer-fact` is correctly entered as viable rather than passed, is not the recommendation, and its "against it" limbs stand; the two passed options keep their reasons unchanged and those reasons still hold. One drift: the amendment's reworded prose for `on-the-answer-fact` drops the limb the last reading wrote into it -- that a fact section's heading and contents are `how-a-fact-is-headed`'s question, still at the periagogic stage, so the placement reaches into an unruled sibling -- which was the sharper of its two objections and is the one that bears on authority rather than on layout; it is worth restoring.

Strongest counter-argument (strong): The amendment's account claims the last reading's central finding is answered -- "the draft reused the word 'standing', which is the word the author said they could not read on an unanswered node, and the heading now names the case in plain words" -- and the heading it wrote names its second case "the node as it stands", the string `alignment-page`:530 rejects in terms, applied by "The third is the whole record today" to a record in which no answer is ratified. The finding is therefore answered in the reply and not in the text, which is the failure mode this second reading exists to catch, and the fact's own prose asserting that the word is gone makes the record say the opposite of what the record shows. The rest of the amendment is genuine and mostly good work -- four of the seven findings are closed cleanly and the heaviest is closed better than its suggested edit -- but the rewrite that answered the word also re-carved the three cases off the render branches and onto rulings, so the one paragraph the whole answer turns on is now both less exact and less true than the paragraph it replaced. Against my own verdict: none of this touches the placement, so a session could repair all of it as wording without the answer moving; I write kickback rather than forward because the second case is not wording -- it is the claim the author objected to, restated as the page's standing heading.

The session's reply: Accepted, and the first finding is exact: the amendment fixed the word in the fact's prose and reinstated it in the heading the answer wrote, which is the same failure the previous reading found one level up, an account asserting a correction the text does not carry. The redraw removes the cause rather than the word. The three cases were carved off `renderPane`'s branches and then re-keyed onto rulings, which is why they stopped partitioning; the answer now has two, keyed on the one thing being indicated, whether a ruling reaches the node. Where one does, the heading says the node as the author confirmed it; where none does, it says the text is the AI's draft and nothing in it has been confirmed. That drops the case that duplicated `edit-lbl`'s ground, so the third finding goes with it, and the stage-chip option's third limb no longer argues from a line the amendment disclaims. The count is corrected to 119 panes over 140 nodes, 21 carrying neither answer nor fence, measured. `alignment-page#standing-named-in-the-pane` is entered in `depends`. And the answer now says what it adds beyond `every-part-in-the-record`: that requirement asks a projection to name the part of the record it shows, and what this answer adds is that the naming must distinguish a confirmed text from an unconfirmed one, which is the distinction the author could not read on `commons.systems/public/agency`.

### The re-reading's kickback answered, 2026-09-06

Eight findings, strong, no probes; all validated at their loci and all answered.
Its central one is the same failure the previous reading found one level up, and
this time the session committed it in the opposite direction: the amendment struck
the word "standing" from the fact's prose and claimed it was gone, while the
heading the answer wrote reinstated the exact phrase `alignment-page` rejects by
name. An account asserting a correction the text does not carry is worse than an
uncorrected text, because it stops the next reader looking.

The redraw removes the cause and not the word. The three cases had been carved off
`renderPane`'s branches and then re-keyed onto rulings, which is why they stopped
partitioning, why one of them duplicated the ground `edit-lbl` already names, and
why one needed a word for a text that stands without being confirmed. There are
two now, keyed on the one thing being indicated: whether a ruling reaches the
node. Where one does the heading says the node as the author confirmed it; where
none does it says the text is the AI's draft and nothing in it has been confirmed.
Every node of the record is in the second case.

With that the third and fourth findings go: no case names the diff's base, so the
answer adds no second such line, and the stage-chip option's third limb no longer
argues from a line the amendment disclaims — it now argues from the heading,
which is written for every node the page renders.

The count is corrected and measured rather than asserted: 21 of the record's 140
nodes carry neither an answer nor a recommended text, so the column is rendered
on 119 and the heading is written 119 times, not 140.
`alignment-page#standing-named-in-the-pane` is entered in `depends`, which the
amendment had recorded on the parent and not named here. And the answer now says
what it adds beyond `dialogue`'s `every-part-in-the-record`: that requirement asks
a projection to name the part of the record it shows, and this answer adds that
naming the part includes saying whether anyone has confirmed it, which is the
distinction the author could not read on `commons.systems/public/agency`.

The re-reading's own counter-argument is that all eight are repairable as wording
with the placement unmoved, and it is right; the placement is unmoved and the
counter-argument the first reading returned against it, that the act guarded is a
confirmation staged in the other column, still stands on the fact and is still
not fully met.

### Clean-context review, 2026-09-06, of 563a0136

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `the-line-that-names-what-the-pane-shows`.

Findings:

- Answer, second paragraph (disposition/disposition-graph/where-the-unconfirmed-indication-goes.md:73-76), the criterion the whole answer turns on (validation 2, doctrine; validation 1, the author's words; an executor would take a wrong action). "It takes two forms and the thing that chooses between them is the thing being indicated, whether a ruling reaches the node. Where one does, the heading says the node as the author confirmed it." "A ruling reaches the node" is the record's term for the node having any class at all: `authority` reads it as ratified where the answer fact carries a ruling, delegated or deferred where the authority fact does, conferred by the nearest ancestor whose authority fact carries one where the node has none, and unanswered only "when no ruling reaches it". So the criterion (a) puts a delegated node, a deferred node, and a node reached only by an ancestor's delegation into the first form, where the heading tells the author "the node as the author confirmed it" of a text the author never ruled on, and (b) withholds the warning from exactly those nodes, which are the ones on which the AI's text acts. Both directions contradict the parent, `alignment-page`: "Where no ruling stands on the answer fact it is a draft no one has confirmed, whatever class a ruling on the authority fact confers, since that ruling is about who decides and not about this text"; and the option this node names in `depends`, `dialogue#every-part-in-the-record`: "the answer as ratified where the answer fact carries a ruling, and a draft no one has confirmed where it does not, whatever class a ruling on the authority fact confers". They also contradict the author's own words on the sibling `what-an-option-row-carries` of 2026-09-06, "What 'stands' could represent is the prior confirmed disposition (if any)", and the words this node's own Disposition rests on, which permit "a single indication per node to indicate that node is not yet confirmed" and license no positive claim of confirmation. The incumbent already keys the sibling line the right way: `standingState` (packages/disposition/project.mjs:697-702) returns "ratified" only where `n.class === "ratified"`, so on a delegated node carrying an answer and a fence the pane would print "the node as the author confirmed it" immediately above `edit-lbl`'s "The edit, against a draft no one has confirmed" (project.mjs:1799-1802). Suggested edit: replace "whether a ruling reaches the node" with "whether the answer fact carries a ruling", and add the parent's clause in terms — a ruling on the authority fact is about who decides and not about this text, so a delegated or a deferred node takes the second form like any other. The same phrase is in the Rationale, "says it wrongly on every node no ruling reaches" (:142-143), and in `#### on-the-answer-fact`, "saying that no ruling reaches this node" (:183), and must move with it.
- Answer, first paragraph against the second and the third (:68-69, :73-76, :94-97) (validation 2; validation 1). The answer opens "In the heading of the right-hand column, which already names what that column is showing" and closes the point with "on a node carrying both an answer and a fence the heading names the confirmation and the line beneath names the diff's base". But on a node carrying both, the pane does not show the confirmed node: `renderPane` (project.mjs:1781-1803) renders the diff and then "The node it would leave", which is the AI's proposed text; and a ratified node whose recommendation has moved is the `proposal` state `authority` defines and the record expects. On such a node the first form announces the AI's edit as "the node as the author confirmed it" — the same fault as the rejected "the node as it stands", inverted from claiming standing to claiming confirmation, and it falsifies the answer's own premise that the heading names what the column is showing. Dropping to two cases keyed on rulings closed the partition defect the last reading found and reopened the mis-naming in the other direction. Suggested edit: let the heading name what the pane renders together with the standing of the text shown — "the answer as ratified" only where the answer fact carries a ruling and the pane is showing that ruled text, and "the AI's draft, which no one has confirmed" wherever what is shown is a recommended text, whatever ruling the node carries — which keeps the two forms, keeps the word out, and leaves the diff's base to `edit-lbl` as the third paragraph intends.
- Answer, fourth paragraph (:102-106) and Rationale, second paragraph (:140-143) (validation 12, cross-reference; validation 3, exactness). "`dialogue`'s `every-part-in-the-record` asks every projection to say what part of the record it is showing, and this answer adds to that requirement the distinction the requirement does not itself draw: that naming the part includes saying whether anyone has confirmed it." That option states no such general requirement. Its fourth requirement is "what a ruling or a projection needs is in the record, in one place, and none of it is supplied by a projection's own text, held in a buffer, or left to be inferred from the absence of a field"; its naming rule is "Wherever an answer stands they lead with the edit this ruling would make and name what that edit is against: the answer as ratified where the answer fact carries a ruling, and a draft no one has confirmed where it does not". So the cited node does draw the confirmed/unconfirmed distinction — on the diff's ground — and the draft denies that it does. The real increment is the one the reading of 2026-09-06 named and this paragraph was amended to state: the page-level placement, once per node and nowhere else, and the reach to the cases the dialogue rule leaves unnamed, where an answer stands with nothing to diff and where the recommended text is shown whole. The Account's closing section repeats the mis-citation ("that requirement asks a projection to name the part of the record it shows"), so the correction is owed in both places. Suggested edit: quote the option's naming clause, say that it names the ground of an edit and only where an answer stands, and state this node's increment as the placement and the cases the rule does not reach.
- Answer, second paragraph (:71-72), fifth paragraph (:113-117), and `#### warning-on-the-stage-chip` (:202-203) (validation 3, exactness — the class of unchecked claim the two earlier readings found three times between them). "The heading is one line on every node the page renders" and "present in all three of the cases that function has", repeated on the chip option as "being written for every node the page renders". All 140 node files carry a `stage` (`ls disposition-graph/*.md public/*.md | wc -l` = 140; `grep -l "^stage:" disposition-graph/*.md public/*.md | wc -l` = 140), so the page renders 140 items, while the fifth paragraph's own measurement, which I verified (21 files carry neither `## Answer` nor `## Recommendation`, and `renderPane` returns "" for them at project.mjs:1809-1813), gives 119 panes; the count of 21 and 119 is exact. And `renderPane` has four branches, not three: fence with an answer (:1784), fence alone (:1804), answer alone (:1807), and neither, which returns before the heading is written. Suggested edit: "on every node whose column is rendered", which the last reading already proposed and which cannot go stale, and "present in each of the three cases in which the column is rendered"; make the same change in the chip option's third limb.
- Facts, `### answer`, `#### on-the-answer-fact` (:181-191) (viability). The reading of 2026-09-06 that raised this option wrote two limbs into its "against it" and the redraw carries one. The missing limb is that the heading and contents of a fact's section are `how-a-fact-is-headed`'s question, still at the periagogic stage — verified: disposition/disposition-graph/how-a-fact-is-headed.md carries no `## Answer` and no facts — so this placement would reach into an unruled sibling. That is the limb bearing on authority rather than on layout, and on a node minted precisely because a sibling was settling what its parent had not devolved it is the limb that should not be the one dropped. The re-reading of 2026-09-06 said so under viability and the redraw did not restore it. Suggested edit: restore the limb, and correct the option's first sentence with finding 1.
- Answer, last paragraph (:119-126) (ordering; the second half of the re-reading's sixth finding). The paragraph names the survivor option and says "which this node names in `depends`", but does not say what that entry means for a ruling: `alignment-page`'s answer still holds that the right-hand column carries "no control, no caption, no indication, no drill-down", so a ruling here cannot be implemented until the parent's answer fact takes `standing-named-in-the-pane`. The account records the `depends` entry as done and is silent on the clause. Suggested edit: add it — a ruling here says where the indication goes and takes effect when the parent's answer fact moves to that option.

On the facts and what they recommend: The answer fact recommends `the-line-that-names-what-the-pane-shows` at moderate boldness with that same option as `stands`, so no `## Recommendation` fence is due and none is present, which is correct; both facts carry an `against`, no existence or persistence fact is carried and none is owed, since nothing of the node's shape moves. The authority fact recommends `ratified` at low boldness on the capture-shaped limb alone, with the written `### authority` reading `class-recommendation` requires, and the limb holds and is narrowed accurately from the parent's own reading (alignment-page.md:482, "a row that mis-states what a confirmation does ... is capture-shaped"). The `review` block still pins fa7a9fa1, the text the last reading read, which is the stale pin this reading exists to replace and not a defect; moderate boldness on the answer now understates what the draft decides, since the author permitted an indication that a node is not yet confirmed and the draft writes a second, positive form asserting confirmation that the author never asked for.

On the viability of the options: Every option on both facts is viable as listed and none viable is missing. The two passed options are passed for reasons that hold against the record — `warning-in-the-eyebrow` against the parent's exhaustive naming of that line's contents, and `no-per-node-warning` against the author's permission of 2026-09-06 and their own finding on `agency` — and `on-the-answer-fact` and `warning-on-the-stage-chip` are live alternatives correctly left unpassed; the authority fact's three are the reserved vocabulary. The one defect in the list is that `on-the-answer-fact` has lost a limb of its case against (finding 5); everything else wrong here is in the recommended option's own text and not in the option set.

Strongest counter-argument (moderate): The column this answer chooses is the one column the parent reserves for the disposition alone, and the parent's reason for the reserve is the reason a warning put there may not work: "every sentence of apparatus in it is a sentence they must read past to see it". Worse, the act the warning guards is not performed in that column: confirmations are staged on option rows in the column that asks, and the sibling `what-an-option-row-carries` has just stripped every standing mark off those rows, so the author can confirm an AI draft with no indication anywhere near the control they confirm with. The draft's reply to `warning-on-the-stage-chip` — that the chip is dialogue state which the recording removes, where the standing of a text is not — cuts the other way, since the indication is needed only while nothing is confirmed, which is exactly while the dialogue is open. And once the criterion is corrected as finding 1 asks, the ruled form fires on no node until the first ratification, so what the answer actually installs is one unconditional sentence in the reading column while the ratifying happens in the other. What survives for the recommendation is that the thing warned about is a text and the text is there; what is still unanswered is that the thing guarded against is an act, and the act is elsewhere.

The session's reply: Accepted, and the first finding is decisive. 'Whether a ruling reaches the node' is the record's phrase for having any class at all, so a delegated or deferred node, or one an ancestor's grant reaches, would have been headed as the author's confirmed text and would have lost the warning entirely; `standingState` keys on `ratified` alone and the criterion should have read the answer fact's own ruling. Re-keying the forms onto rulings replaced a false claim of standing with a false claim of confirmation, which is the previous fault inverted and not removed. The redraw keys on two things that are both checkable and together name what the pane actually shows: whether a recommended text is present, since with one the pane renders the AI's proposal whatever stands beneath it, and whether the answer fact carries a ruling. Three forms, and no form mis-names its contents. The citation is corrected in both directions: `every-part-in-the-record` states no general requirement to say what part of the record a projection shows, and it does draw the confirmed-from-unconfirmed distinction, in the clause that the projections 'lead with the edit wherever an answer stands and name the ground it is against, so that a first answer is named as one'. That clause supports this answer more directly than the requirement invented for it, and the account's repetition of the mis-citation goes with it. The count is corrected to 119 in the sentence that said 140, `renderPane` is four branches, and the two remaining findings are taken as given.

### The third kickback answered, 2026-09-06

Six findings, no probes, all validated at their loci and all answered. The
reading's check on the account against the text found the previous account's
claims true except one, and that one is the finding that matters: the redraw did
not remove the cause, it inverted the fault.

The criterion was wrong. "Whether a ruling reaches the node" is the record's
phrase for a node having a class at all, so under the previous draft a node ruled
delegated or deferred, or one an ancestor's grant reaches, would have been headed
as the author's confirmed text and would have lost the warning entirely — on
nodes where the warning is most owed, since `alignment-page` says a class is
"about who decides and not about this text". `standingState` in the projector
already keys on `ratified` alone, and the answer now keys on the answer fact's
own ruling.

With that, one criterion is not enough, and the second finding is why: on a node
carrying a recommended text the column renders the AI's proposal whatever stands
beneath it, so a form keyed on the ruling alone would have announced the AI's
edit as the answer the author confirmed. That is the rejected claim of standing
inverted into a claim of confirmation. The heading now has three forms keyed on
two things the record holds directly, whether a recommended text is present and
whether the answer fact carries a ruling, and no form mis-names what its column
shows.

The citation was wrong in both directions and is withdrawn twice over.
`dialogue`'s `every-part-in-the-record` states no general requirement that a
projection say what part of the record it shows, and it does draw the distinction
the draft said it did not: the projections "lead with the edit wherever an answer
stands and name the ground it is against, so that a first answer is named as one
by what the projection says of it". That clause supports this answer more
directly than the requirement invented for it, and what this answer adds is that
the naming happens in the heading of every rendered column and not only where a
diff forces the question. The account's repetition of the mis-citation goes with
it, and so does the same sentence in the rationale, which the previous sweep
missed.

The rest: the sentence that said the heading is written on every node the page
renders now says 119, which is the count the node measures elsewhere;
`renderPane` is four branches and the answer no longer counts them;
`on-the-answer-fact` gains the limb the earlier reading wrote into it, that a
line above a fact's options settles part of `how-a-fact-is-headed`, which stands
at the periagogic stage with no answer and no facts; and the last paragraph now
states the consequence of its own `depends` entry, that a ruling here is not
implementable until `alignment-page` takes `standing-named-in-the-pane`.

Checked by search rather than asserted, over the node's live text: the wrong
criterion, both forms of the mis-citation, and the two false counts are gone. The
one surviving occurrence of "the node as it stands" is the quotation of
`alignment-page` rejecting the phrase, which is the sentence that rejects it.

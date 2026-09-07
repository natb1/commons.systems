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
  verdict: forward
  strength: moderate
  date: 2026-09-06
  of: 387e98da66261b7df2acf31b00955255a6448847
  commit: a86b9399a1b76e703f22a35aa45e01a6950b1881
  against: "The column this answer chooses is the one column the parent reserves for the disposition and nothing else, and the parent's reason for that reserve is exactly the reason a warning put there will not work: \"every sentence of apparatus in it is a sentence they must read past to see it\". Worse, the act the warning guards is not performed in that column at all. Confirmations are staged on option rows in the column that asks, and the sibling `what-an-option-row-carries` has just stripped every standing mark off those rows, so under this answer the author can confirm an AI draft with no indication anywhere near the control they use to do it -- the record's one warning about the AI's own drafting sits in the reading column while the ratifying happens in the other. The reply the draft gives to `warning-on-the-stage-chip`, that the chip is dialogue state which the recording removes, cuts the other way: the indication is needed only while nothing is confirmed, which is exactly while the dialogue is open, so removal at the recording is the correct lifetime and not an objection. What survives for the recommendation is that the thing warned about is a text and the text is there; what is not answered is that the thing guarded against is an act, and the act is elsewhere."
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/dialogue#every-part-in-the-record
---
## Disposition

The author, 2026-09-04, on `commons.systems/public/agency`, carried on `alignment-page`, which is the finding this question exists to answer:
> I don't understand what "standing" would even refer to. This node has not yet been answered, there is no ground to confirm as standing

The author, 2026-09-06, in the sitting on `what-an-option-row-carries`, when the `stands` chip stopped carrying the warning:
> A single indication per node to indicate that node is not yet confirmed is fine.

## Answer

In the heading of the right-hand column, which already names what that column is
showing, once per node and nowhere else on the page.

The column is headed by one line for every node the page renders: `PANE_LBL`, "The
node as it would stand", written outside the branch in `renderPane` and so
present in all three of the cases that column has. That heading is where the
indication goes, and it goes there by being made to say which of the three cases
this is: the node as it would stand, against an answer the author has ratified;
the node as it stands, where an answer stands and nothing would change it; or,
where no ruling reaches the node at all, the node as the AI proposes it, which no
one has confirmed. The third is the whole record today.

The ground-naming line beneath it is a different line and is not this answer's.
`edit-lbl` says whether a diff is against the ratified answer or against a draft
no one has confirmed, and it is written only where a node carries both an answer
and a recommended text; it was added for the author's finding of 2026-09-03 that
a diff implies a ground the record does not have, and it stays, saying what a
diff is against. What this answer adds is not a second such line but a
qualification of the heading that is already there for every node.

The reason is what the column is for and not what it already contains. The thing
the indication warns about is a text; the text is in that column and nowhere
else; and a reader meets the warning in the same glance as the thing warned
about, which no other placement achieves. `dialogue`'s
`every-part-in-the-record` asks every projection to say what part of the record
it is showing, and a heading that names the wrong part on a hundred and forty
nodes fails that requirement whatever else the page does; qualifying the heading
discharges it and the warning is the same sentence.

One qualification, per node, in the column that holds the disposition. The rows
carry no part of it: what a row carries is `what-an-option-row-carries`'
question, and that answer takes the mark off the row because whether a node is
confirmed is a fact about the node and not a status of one option among several.

Where a node carries neither an answer nor a recommended text the column is not
rendered and the page says nothing, since there is no disposition to qualify and
inventing one to disclaim would be a worse fault than silence.

Two clauses of `alignment-page` are touched by this and neither is devolved to
this node: its naming paragraph, which says the row tells the author that
confirming ratifies the AI's draft, and its account of the right-hand column,
which says that column carries "no control, no caption, no indication, no
drill-down". Both are the parent's own apparatus rule. This answer does not amend
them; the survivor is recorded as the option `standing-named-in-the-pane` on
`alignment-page`'s answer fact, and a ruling here says only where the indication
goes and not what that column is otherwise permitted to hold.
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

The requirement is `dialogue`'s `every-part-in-the-record`, that a projection say
what part of the record it is showing. The right-hand column's heading says it
for every node the page renders and says it wrongly on every node no ruling
reaches, which is all of them today. What the answer beat is on the fact: the
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

The word this answer does not use is the author's own objection. They wrote of
`commons.systems/public/agency` that they did not understand what "standing"
would refer to on a node that has not been answered, so the heading says which of
the three cases the column is showing in plain words and does not name a standing
the text may not have.

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
sentence the author must read past.

#### warning-on-the-stage-chip

Everything the recommended option says, with the indication on the stage chip
instead of on the line that names what the pane shows. The chip is the node's one
status object, already carrying the stage, the two readings' readiness and the
open probe count, so the node's state would be in one place and at the head of
the column that asks, which is where the author decides. Against it: the thing
warned about is the text and the text is in the other column; the chip is
dialogue state, which the recording removes, where the standing of a text is not;
and the ground-naming line has to exist anyway, because a diff needs a base, so
the chip would be a second home for a sentence that already has one.

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

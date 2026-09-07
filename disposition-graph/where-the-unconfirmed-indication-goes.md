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
  strength: strong
  date: 2026-09-06
  of: fa7a9fa185d0fa40891979b0a9a982e49b1d7003
  commit: 73b679e6c7c23adc3497696a2dd05c7e544e5770
  against: "The amendment's account claims the last reading's central finding is answered -- \"the draft reused the word 'standing', which is the word the author said they could not read on an unanswered node, and the heading now names the case in plain words\" -- and the heading it wrote names its second case \"the node as it stands\", the string `alignment-page`:530 rejects in terms, applied by \"The third is the whole record today\" to a record in which no answer is ratified. The finding is therefore answered in the reply and not in the text, which is the failure mode this second reading exists to catch, and the fact's own prose asserting that the word is gone makes the record say the opposite of what the record shows. The rest of the amendment is genuine and mostly good work -- four of the seven findings are closed cleanly and the heaviest is closed better than its suggested edit -- but the rewrite that answered the word also re-carved the three cases off the render branches and onto rulings, so the one paragraph the whole answer turns on is now both less exact and less true than the paragraph it replaced. Against my own verdict: none of this touches the placement, so a session could repair all of it as wording without the answer moving; I write kickback rather than forward because the second case is not wording -- it is the claim the author objected to, restated as the page's standing heading."
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

The heading is one line on every node the page renders: `PANE_LBL`, written
outside the branch in `renderPane` and so present in all three of the cases that
function has. It takes two forms and the thing that chooses between them is the
thing being indicated, whether a ruling reaches the node. Where one does, the
heading says the node as the author confirmed it. Where none does, it says that
what follows is the AI's draft and that nothing in it has been confirmed. Every
node of the record is in the second case today.

Two forms and not three, and not the word the author could not read. An earlier
draft carved the cases off `renderPane`'s branches and then keyed them on
rulings, so they stopped partitioning and one of them reinstated "the node as it
stands" — the exact phrase `alignment-page`'s own answer rejects, on the ground
that it "claims a standing the text does not have, and it reads as the safe and
ordinary choice when on an AI-drafted node written in the author's own voice it is
the least safe one available". The heading says who wrote the text and whether
anyone has confirmed it, which is what the author asked for and is sayable without
that word.

The ground-naming line beneath is a different line and is not this answer's.
`edit-lbl` says whether a diff is against the ratified answer or against a draft
no one has confirmed, and it is written only where a node carries both an answer
and a recommended text; it was added for the author's finding of 2026-09-03 that
a diff implies a ground the record does not have, and it stays, saying what a
diff is against. This answer adds no second such line: it qualifies the heading
that is already there, and on a node carrying both an answer and a fence the
heading names the confirmation and the line beneath names the diff's base, which
are two different facts.

The reason is what the column is for. The thing the indication warns about is a
text; the text is in that column and nowhere else; and a reader meets the warning
in the same glance as the thing warned about, which no other placement achieves.
`dialogue`'s `every-part-in-the-record` asks every projection to say what part of
the record it is showing, and this answer adds to that requirement the
distinction the requirement does not itself draw: that naming the part includes
saying whether anyone has confirmed it. That is the distinction the author could
not read on `commons.systems/public/agency`.

One qualification, per node, in the column that holds the disposition. The rows
carry no part of it: what a row carries is `what-an-option-row-carries`'
question, and that answer takes the mark off the row because whether a node is
confirmed is a fact about the node and not a status of one option among several.

Where a node carries neither an answer nor a recommended text the column is not
rendered and the page says nothing, since there is no disposition to qualify and
inventing one to disclaim would be a worse fault than silence. Measured on
2026-09-06: 21 of the record's 140 nodes are in that case, so the heading is
written on 119.

Two clauses of `alignment-page` are touched by this and neither is devolved to
this node: its naming paragraph, which says the row tells the author that
confirming ratifies the AI's draft, and its account of the right-hand column,
which says that column carries "no control, no caption, no indication, no
drill-down". Both are the parent's own apparatus rule. This answer does not amend
them; the survivor is the option `standing-named-in-the-pane` on
`alignment-page`'s answer fact, which this node names in `depends`, and a ruling
here says only where the indication goes.

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
sentence the author must read past.

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

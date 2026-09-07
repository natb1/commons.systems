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
    recommends: on-the-answer-fact
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
  date: 2026-09-07
  of: 8b1d076b07dab5fb9fdd5e25f78f9acb65467ce7
  against: "The column this answer chooses is the one column the parent reserves for the disposition alone, and the parent's reason for the reserve is the reason a warning put there may not work: \"every sentence of apparatus in it is a sentence they must read past to see it\". Worse, the act the warning guards is not performed in that column at all -- confirmations are staged on option rows in the column that asks, and the sibling `what-an-option-row-carries` has just taken every standing mark off those rows, so under this answer the author can ratify an AI draft with no indication anywhere near the control they ratify with. Under the answer's own criterion the confirmed form fires on no node, so what actually ships is one unvarying sentence on 120 of 140 columns, and a sentence that never varies is a sentence a reader stops seeing after a dozen nodes. The reply the draft gives to `warning-on-the-stage-chip`, that the chip is dialogue state which the recording removes, cuts the other way: the indication is wanted only while nothing is confirmed, which is exactly while the dialogue is open, so removal at the recording is the right lifetime and not an objection. What survives for the recommendation is that the thing warned about is a text and the text is there; what is still unanswered, four readings on, is that the thing guarded against is an act, and the act is elsewhere."
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

`renderPane` writes that heading, `PANE_LBL`, outside its branches, so every node
whose column is rendered carries it. It takes three forms, and what chooses
between them is what the column is actually showing, read off two things the
record holds directly: whether the node carries a recommended text, since where
one exists the column renders the AI's proposal whatever stands beneath it, and
whether the answer fact carries a ruling, which is the only thing that makes a
text the author's rather than the AI's.

Where a recommended text is present the heading says the column is showing the
AI's proposal and that no one has confirmed it. Where none is present and the
answer fact carries a ruling, it says the column is showing the answer the author
confirmed. Where none is present and the answer fact carries no ruling, it says
the column is showing the AI's draft and that nothing in it has been confirmed.
The heading is written on every node whose column is rendered and on no other:
where a node carries neither an answer nor a recommended text there is no column
and the page says nothing. The measure of how many that is belongs in this node's
account, with the criterion it was taken on and the commit it was taken at.

The criterion is the answer fact's own ruling and not whether a ruling reaches
the node, and the difference is the whole of the warning. A ruling reaching the
node is the record's phrase for its having a class at all, and `alignment-page`
says a class is "about who decides and not about this text", so a node ruled
delegated or deferred, or one an ancestor's grant reaches, carries no confirmed
text and must not be headed as though it did. `standingState` in the projector
already keys on `ratified` alone, and this answer keys on the same thing.

The ground-naming line beneath is a different line and is not this answer's.
`edit-lbl` says whether a diff is against the ratified answer or against a draft
no one has confirmed, and it is written only where a node carries both an answer
and a recommended text; it was added for the author's finding of 2026-09-03 that
a diff implies a ground the record does not have, and it stays. On every node
that carries both, the two lines say related things two lines apart, the heading
naming what the column shows and the line beneath naming what the diff is
against, and that repetition is the cost of leaving `edit-lbl` alone rather than
a fault this answer denies.

The reason is what the column is for. The thing the indication warns about is a
text; the text is in that column and nowhere else; and a reader meets the warning
in the same glance as the thing warned about, which no other placement achieves.

One qualification, per node, in the column that holds the disposition. The rows
carry no part of it: what a row carries is `what-an-option-row-carries`'
question, and that answer takes the mark off the row because whether a node is
confirmed is a fact about the node and not a status of one option among several.

## Rationale

Two words of the author's. The finding of 2026-09-04, on
`commons.systems/public/agency`: "I don't understand what 'standing' would even
refer to. This node has not yet been answered, there is no ground to confirm as
standing." That is the fault this question exists to fix, and it is a fault of a
heading and not of a row. The permission of 2026-09-06, given when the sibling
took the mark off the row: "A single indication per node to indicate that node is
not yet confirmed is fine." That fixes the cardinality and leaves the placement
to the AI, which is why the boldness is moderate and why the counter-argument on
placement is carried at full strength.

`dialogue`'s `every-part-in-the-record` is the record-wide rule this applies to a
heading. Its clause is that a projection names what an edit is against: "the
answer as ratified where the answer fact carries a ruling, and a draft no one has
confirmed where it does not, whatever class a ruling on the authority fact
confers, since that ruling is about who decides and not about this text." That is
the confirmed-from-unconfirmed distinction, stated for the diff and only where an
answer stands. What this answer adds is that the same distinction is owed in the
heading of every column the page renders, and not only where a diff forces the
question.

What the answer beat is on the fact: the stage chip and the answer fact, both in
the column that asks rather than the column that shows, and the reading of an
absent mark as an indication in itself.

## Facts

### answer

Recommended on the act. The thing this indication guards against is not a
misreading but a deed: the author confirming an AI draft in the belief that they
are keeping their own record. The page's one deed is that confirmation, as the
author's rule of 2026-09-06 fixes its scope, and it is staged by choosing an
option under a fact. The answer fact is the fact whose ruling makes the text the
author's rather than the AI's, so the warning stands one line above the rows that
stage the act, inside the section that holds them, and the author cannot reach the
control without passing it. A warning that is not in view when the control is used
has not guarded it, which is what four readings returned against every other
placement.

It is also where the record already keeps the thing being said. `alignment-page`
requires that everything the column shows of a fact it reads from the fact, and
what this line says is read from the fact and from nothing else: that no option
of it carries a ruling. The projector derives the node's whole standing from that
same fact and no other. And `what-an-option-row-carries` classifies the thing as
"a fact about the node and not a status of one option among several", which takes
it off the rows without taking it out of the section the rows sit in.

That the projector already writes a line in that position when the fact carries a
ruling is not a reason and is not offered as one. `evaluation` strikes the
incumbent from the choosing, and this answer would be the same answer if the page
were being drawn for the first time. What the incumbent gives is the cost, which
is a consequence: one string in one function, no new surface, and nothing added
to the column the parent reserves.

The second form the earlier drafts wrote, a positive assertion that the author
confirmed the text, is dropped rather than narrowed. The author's words permit an
indication that a node is not yet confirmed, and of the opposite they say, of the
mark that named a prior confirmed disposition, "There are no confirmed
dispositions currently, so we would expect to see no indication of that". Where a
confirmation does exist, what says so is the confirmed disposition's own mark on
the option the author ruled for, which is `what-an-option-row-carries`' third
mark and not this node's. So this answer writes one form and asserts nothing
beyond the author's permission.

Boldness moderate, and what rests on the AI is one thing, named. The author fixed
the cardinality and left the place; the record then rules out two of the four
candidates, the row by the sibling's answer and the right-hand column by the
parent's reserve, and rules out none of the remaining two. The choice between the
node's status object and the fact the act is staged on is decided by no clause of
the record and by no word of the author's: it is decided here on where a reader's
eye is when the control is used, which is the AI's judgment and is what the
counter-argument is aimed at.

What the answer beat. The heading of the right-hand column, which is where the
text is but not where the act is, and which would need an exception to a reserve
the parent has not devolved. The stage chip, which is the node's one status
object and would put the node's state in one place, but which sits above the
stage's ask and every fact, out of view at the moment of confirming, among pills
that report the state of the readings. The eyebrow, whose contents the parent
names exhaustively. And the reading of an absent mark as an indication in itself,
which is the state the author objected to on `commons.systems/public/agency`.

#### on-the-answer-fact

One line on the answer fact, above its options, wherever that fact carries no
ruling: that no ruling stands on this node's answer, and that confirming one of
these options would be the first confirmation of the text it carries. It is not a
row and names no option, so `what-an-option-row-carries` does not reach it; it is
not in the right-hand column, so the parent's reserve is untouched and no
exception to it is needed; and it is where the act is, one line above the rows a
confirmation is staged on. Against it: the text it warns about is rendered in the
other column, a screen's width from the warning; the section it sits in is the
one whose heading is `how-a-fact-is-headed`'s question, at the periagogic
movement, where the author's words ask for that section to carry less and not
more; and until the first ratification the line never varies, so it faces the
same objection as an unvarying heading, met only by the claim that a sentence in
the path of the control is read where a sentence in the path of the text is read
past.

#### warning-on-the-stage-chip

Everything the recommended option says, with the indication on the stage chip
instead of the answer fact. The chip is the node's one status object, as
`alignment-page` names it in putting the readings' readiness there: "It is there
because it is the state of the node, and the chip is the node's one status
object, beside the controls that move it." Whether a node's text has been
confirmed is a fact about the node, which is the sibling's own reason for taking
it off the rows, so the node's state would be in one place and at the head of the
column that decides. Against it: the chip is not where the act is, sitting above
the stage's ask and above every fact the node carries, so on any node long enough
to scroll the warning is out of view at the moment the control is used; and what
else the chip carries is the state of the two readings and the count of open
probes, so a warning set among them is read as one more pill of process metadata
rather than as the one thing on the page the author is asked not to do by
accident. Its lifetime is not among the objections: the indication is wanted
exactly while nothing is confirmed, which is exactly while the dialogue is open,
so the dialogue's removal at the recording is the right lifetime, as the reading
of 2026-09-07 found against the draft that argued the contrary.

#### warning-in-the-eyebrow

Everything the recommended option says, with the indication in the line beneath
the question and the id, among the settling count, the options pending and the
nodes this one stands under. Passed over: `alignment-page`'s answer names that
line's contents and says nothing else is in it, on the argument that a line no
answer names collects what no answer justifies.

#### no-per-node-warning

No indication anywhere: the confirmed mark is absent from every row of an
unconfirmed node, and that absence is the indication. Passed over: the author's
words of 2026-09-06 permit an indication rather than requiring none, and absence
is precisely what a reader cannot see. It is also the state the author found and
objected to on `commons.systems/public/agency`.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test and on no
other: the object is the wording of one line, which costs a projector change to
get wrong and can be changed back, so neither the expensive nor the irreversible
limb is met. The limb that is met is met exactly, and is narrowed to what it is
true of. This line is the only device the page has for telling the author, at the
control they confirm with, that the text a confirmation would ratify is the AI's
draft and not their record. Where a node carries both an answer and a recommended
text the pane's `edit-lbl` says a related thing, but it says it of the ground the
diff is taken against and in the column that shows rather than the column that
asks; where a node's column renders no diff, this line is the only place on the
page the thing is said at all. The party that would word it is the AI, and the
thing worded exists to check the AI. Low boldness: the limb is `alignment-page`'s
own recorded reading narrowed to this object, and the evidence is the author's
finding of 2026-09-04.

Against it: the wording of one line is reversible and cheap to get wrong, so
`deferred` would let the recommendation act while the author works the rest of
the frontier, and a `ratified` ruling here stops any delegation from reaching it.

## Recommendation

```markdown
---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

On the answer fact, above its options: one line saying that no ruling stands on
this node's answer and that confirming one of these options would be the first
confirmation of the text it carries. It is written wherever that fact carries no
ruling, and nowhere else on the page.

The criterion is the answer fact's own ruling and nothing else. A ruling on the
authority fact says who decides and not that this text was confirmed, so a node
ruled delegated or deferred, and a node an ancestor's delegation reaches, takes
the line like any other. `alignment-page` settles that in terms, "Where no ruling
stands on the answer fact it is a draft no one has confirmed, whatever class a
ruling on the authority fact confers, since that ruling is about who decides and
not about this text", and `dialogue`'s `every-part-in-the-record` says the same of
the ground a projection names. The projector already derives the node's standing
from that one fact and from no other.

It goes there because that is where the act is. The page's scope is the final
confirmation and, of every other movement, a preview and a read-only indicator,
as the author's rule of 2026-09-06 fixes it; and a confirmation is staged by
choosing an option under a fact. The answer fact is the fact whose ruling would
make the text the author's rather than the AI's, so the record's one warning
about the AI's own drafting stands one line above the rows that stage the act it
warns about, inside the section that holds them, and the author does not reach
the control without passing it.

Where the answer fact carries a ruling the line is not written, and nothing is
written in its place. The author's words permit an indication that a node is not
yet confirmed; of the opposite they say, of the mark that named a prior confirmed
disposition, that with none in the record "we would expect to see no indication
of that". Where a confirmation does exist, what says so is the confirmed
disposition's own mark on the option the author ruled for, which is
`what-an-option-row-carries`' question and not this one's. So the page carries one
form of this indication and no positive counterpart.

The rows carry no part of it. What an option's row carries is
`what-an-option-row-carries`' question, and that answer takes the mark off the row
because whether a node is confirmed is a fact about the node and not a status of
one option among several. This answer does not put it back: the line names no
option, is written once for the fact, and sits above the rows rather than on one.

The right-hand column is not touched and its reserve is the parent's.
`alignment-page` holds that "Nothing that is about the ruling shares the column
with it -- no control, no caption, no indication, no drill-down -- because the
column's one job is to show the author the thing they are ruling on, and every
sentence of apparatus in it is a sentence they must read past to see it", and that
clause is not devolved to this node and is not amended by it. This answer needs no
exception to it. The option recorded on the parent from this node,
`standing-named-in-the-pane`, is the exception the placement in that column would
have needed, and it stands or falls with that placement rather than with a ruling
here. That column's heading today says "The node as it would stand", written once
for every column the page renders, outside every branch that chooses what the
column shows; this answer neither qualifies it nor replaces it. It names what a
ruling would leave and conditions on the ruling, so it asserts no confirmation;
whether it nevertheless claims a standing the text does not have is a question
about a sentence in the column the parent reserves, and the parent's own paragraph
on that column, with the option above, is where it is asked.

One line, once per node, and only where a confirmation can be staged. A node that
carries no facts carries no answer fact, offers no option to confirm, and takes no
line; the column there says which movement is owed and that nothing is proposed
yet, which is the parent's clause and not this one's. Where a node's answer fact
carries options but no text stands, the line is still written, since what it says
is that no ruling stands on the answer and not that a column is rendered.
Everything it says is read from the fact, as the parent requires of everything the
column shows of a fact: the absence of a ruling on any of its options. In the
implementation it falls on `renderFact` in the alignment page's projector, between
the fact's heading and its options, where that function already writes the fact's
ruling when one exists; the words are the projector's, and what this answer fixes
is what they must say and where they must say it.

## Rationale

Two words of the author's, and one act. The finding of 2026-09-04, on
`commons.systems/public/agency`: "I don't understand what 'standing' would even
refer to. This node has not yet been answered, there is no ground to confirm as
standing." That is the fault this question exists to fix. The permission of
2026-09-06, given when the sibling took the mark off the row: "A single indication
per node to indicate that node is not yet confirmed is fine." That fixes the
cardinality and leaves the placement to the AI, which is why the boldness is
moderate and why the counter-argument on placement is carried at full strength.

The placement follows from what the indication guards. It guards an act and not a
reading: the harm is a confirmation given to an AI draft in the belief that it is
already the author's record, and the page's one act is that confirmation. So the
question the placement answers is not where the author will read the warning but
where they will be standing when they can do the thing it warns about. Every
other placement answers the first question and this one answers the second.

`dialogue`'s `every-part-in-the-record` is the record-wide rule this applies at
the control. It has the projections name what an edit is against, "the answer as
ratified where the answer fact carries a ruling, and a draft no one has confirmed
where it does not, whatever class a ruling on the authority fact confers, since
that ruling is about who decides and not about this text", and this answer takes
its criterion from that clause unchanged. What it adds is that the same
distinction is owed where a ruling is staged and not only where an edit is shown,
and that the page says it once per node.

What the answer beat: the heading of the right-hand column, which is where the
text is but not where the act is and which would need an exception to a reserve
the parent has not devolved; the stage chip, which is the node's one status object
but sits above the stage's ask and every fact, out of view at the moment of
confirming and among pills reporting the state of the readings; the eyebrow, whose
contents the parent names exhaustively; and the reading of an absent mark as an
indication in itself, which is the state the author objected to.
```

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

### Clean-context re-reading, 2026-09-06, of bcabb0d8: its record lost

The section that stood here was not this reading's record. Its body was
byte-identical to `### Clean-context re-reading, 2026-09-06, of fa7a9fa1` above,
differing only in its heading and in the session's reply beneath it, so the
findings it showed were an earlier reading's, of text two rewrites older, and
described strings that answer no longer carried. The copy was written into the
node when it was first added and no version of the record holds what the reading
actually returned, so its findings cannot be restored and are not reconstructed
here.

What the record can still attest of that reading is the session's reply to it,
which is this node's and was not copied. The reading read the text at
`bcabb0d8`, kicked the node back, and found the previous account's verification
claim false on three counts: the census of the forms, which the reply corrected
to the figures it measured that day; `renderPane`'s branches, which are four and
not three, the fourth rendering no column at all; and the quotation of
`dialogue`'s `every-part-in-the-record`, whose ending had been invented inside
quotation marks and survived the striking of the requirement it came from. The
reply drew from it the change of method this sitting then followed: that four
rounds of targeted replacement had not made the node consistent with itself, that
the live sections would be rewritten whole in one pass, and that the amendment
this node had drafted for its parent would be withdrawn, a child's account not
being where a parent's text is drafted.

Recorded rather than repaired, as the reading of 2026-09-07 asked: a section that
says what it does not hold is worse than a gap, because it stops the next reader
looking.

### Clean-context review, 2026-09-07, of 8b1d076b

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `the-line-that-names-what-the-pane-shows`.

Findings:

- Answer, sixth paragraph (disposition/disposition-graph/where-the-unconfirmed-indication-goes.md:109-112), and the whole placement (validation 2, doctrine; the authority-widening this node was minted to close). The paragraph reads in full: "One qualification, per node, in the column that holds the disposition. The rows carry no part of it: what a row carries is `what-an-option-row-carries`' question, and that answer takes the mark off the row because whether a node is confirmed is a fact about the node and not a status of one option among several." The row half is handled correctly, by pointing at a clause the parent has devolved. The column half is not. The parent's recommended answer holds that the right-hand column carries "no control, no caption, no indication, no drill-down -- because the column's one job is to show the author the thing they are ruling on, and every sentence of apparatus in it is a sentence they must read past to see it" (disposition/disposition-graph/alignment-page.md:534), and that clause is not devolved to this node. The draft puts an indication in exactly that column, in all three forms, and the live sections nowhere name the clause, nowhere say it is the parent's and is not amended here, and nowhere say that a ruling here is not implementable until the parent's answer fact takes `standing-named-in-the-pane` (present at alignment-page.md:136 and :394, source this node). Verified by search over the node: `grep -n "standing-named-in-the-pane|no drill-down|devolve|implementable"` returns hits only in the frontmatter `depends` (:55) and in `## Account` (:233 onward); `## Answer`, `## Rationale` and `## Facts` (:65-:225) carry none. Two earlier readings closed this and the whole-section rewrite of 2026-09-06 reopened it, while the account's closing paragraph states the method it did not carry out: "what a ruling here reaches is said by naming and quoting the parent's clauses without drafting their replacements". That is the failure this node's own history names three times, an account asserting a correction the text does not carry, and it is why this reading kicks back rather than forwards. Suggested edit: restore to the Answer, in the form the parent uses for its own devolved clauses, a sentence that names and quotes `alignment-page`'s "no control, no caption, no indication, no drill-down" clause, says it is the parent's and is not amended here, names the survivor option `standing-named-in-the-pane` on the parent's answer fact which this node already carries in `depends`, and says that a ruling here settles where the indication goes and takes effect when the parent's answer fact moves to that option.
- `## Account`, `### Clean-context re-reading, 2026-09-06, of bcabb0d8` (:466-489), and frontmatter `review.against` (:50) (validation 3, a claim about the record). The body of that section is a byte-identical copy of `### Clean-context re-reading, 2026-09-06, of fa7a9fa1` (:326-349): `diff <(sed -n '327,349p' ...) <(sed -n '467,489p' ...)` produces no output. So what the record holds as the reading the current `review` block pins is the record of an earlier reading of text two rewrites ago. Its findings describe strings the answer no longer carries -- "the node as it stands, where an answer stands and nothing would change it", "The third is the whole record today", "a heading that names the wrong part on a hundred and forty nodes" -- and its `depends` finding calls an entry "new; the dependency did not exist at the pinned text" that the frontmatter already carried. The session's reply beneath it answers wholly different matters (the 32/87/21 measurement, `renderPane`'s four cases, the corrected quotation of `every-part-in-the-record`), none of which the copied findings raise, which is the evidence the body is a mis-copy rather than a repeated reading. The consequence is live: `review.against` (:50) carries that same reading's counter-argument, and `dialogue`'s `every-part-in-the-record` has the projections show `against` "on the recommended option's row in place of the case the AI wrote there", so the author ruling today would meet, beside the recommendation, an objection to a phrase the answer no longer contains. Suggested edit: replace that section's body with what the fourth reading actually found, or, where it was not kept, say so in the section and strike the copied body rather than leave a false record of a reading; and let this reading's verdict and counter-argument replace the `review` block.
- Rationale, second paragraph (:126-132) (validation 3, exactness of a quotation; validation 12, cross-reference). The paragraph says "`dialogue`'s `every-part-in-the-record` is the record-wide rule this applies to a heading. It asks the projections to 'lead with the edit wherever an answer stands, ratified or a draft no one has confirmed, and name the ground the edit is against; a node with no answer shows the recommended text whole.'" That sentence is verbatim from disposition/disposition-graph/dialogue.md:784, which sits inside `#### edit-led-against-a-named-ground` (:782-787), a different option on the same fact, sourced to `alignment-page`. `#### every-part-in-the-record` begins at :788, and the clause the paragraph means is at dialogue.md:972: "Wherever an answer stands they lead with the edit this ruling would make and name what that edit is against: the answer as ratified where the answer fact carries a ruling, and a draft no one has confirmed where it does not, whatever class a ruling on the authority fact confers, since that ruling is about who decides and not about this text." The substance the paragraph draws is genuinely in the option `depends` names; the words in the quotation marks are a rival option's. This is the third round in which this same citation has been quoted wrongly, and the account's own reply to the fourth reading claims it was "corrected to its real tail, 'by what it is an edit against rather than by withholding the edit'" -- a tail the live text does not carry and which is not the option's wording either, :972 reading "the projections say which by naming the ground rather than by withholding the edit". Suggested edit: quote dialogue.md:972 and attribute it to `every-part-in-the-record`, and strike the account's claim about the tail or make it true.
- Answer, third paragraph (:83-85), and Facts, `#### warning-on-the-stage-chip` (:190-192) (validation 3, exactness -- the class of unchecked number three earlier readings found between them). The Answer says "Measured on 2026-09-06: 32 nodes are in the first form, none in the second, 87 in the third, and 21 carry neither an answer nor a recommended text, so no column is rendered for them and the heading is written 119 times", and the chip option says, undated, "the heading exists on all 119 rendered columns anyway". At the graph head this reading read -- disposition worktree clean at b319e072, 2026-09-07 -- the figures are 33, none, 87, 20 and 120. Measured: `ls disposition-graph/*.md public/*.md | wc -l` = 140; cross-tabulating `## Answer` against `## Recommendation` over those 140 files gives 20 with neither, 87 with an answer alone, 33 with both, and none with a fence alone; `renderPane` returns "" for the first group (project.mjs:1809-1813), so 120 columns are rendered. So the census in the standing text went false within a day of being taken, which is exactly what the record's own pending option `no-census-in-a-standing-answer` on `commons.systems/disposition-graph/authority` (authority.md:215-217) says of a count in an answer: "A measurement of the record does not go in the text that stands: a count belongs in the node's account, with the criterion it was taken on and the commit it was taken at, and the standing answer says where the measure lives and not what it is." Two earlier readings on this node proposed the edit that needs no count and it was not taken. Suggested edit: in the Answer, "on every node whose column is rendered", with the four numbers struck; in the chip option, "on every rendered column" rather than "all 119"; and the measurement moved to the account with the criterion it was taken on and the graph commit it was taken at.
- Answer, second paragraph (:70-76) against the sixth (:109) (validation 3; an executor reading it would take a wrong action). "`renderPane` writes that heading, `PANE_LBL`, outside its branches, so every node whose column is rendered carries it. It takes three forms, and what chooses between them is what the column is actually showing" is written in the present tense of a projector in which `PANE_LBL` is a single fixed string: `const PANE_LBL = "The node as it would stand"` (packages/disposition/project.mjs:682), emitted once at :1815 outside all three rendering branches, which the answer's first clause states correctly. The sixth paragraph then calls the change "One qualification, per node". Qualifying the existing heading and replacing it with three forms are two different implementations, and nothing in the Answer says which: it never states what the heading says today, nor that this answer replaces that string. That omission also costs the answer its strongest piece of evidence, since the incumbent string is the "would stand" cognate of the phrase `alignment-page`:530 rejects by name, "Naming it 'the node as it stands' claims a standing the text does not have". Suggested edit: say that the heading today reads "The node as it would stand" on every rendered column whatever the node's state, that this answer replaces it with the three forms, and either drop "One qualification" or recast it as "one line, per node".
- Facts, `### authority`, first paragraph (:215-218) (validation 3, a claim about the implementation; it is the sentence the whole `ratified` recommendation rests on). "This heading is the record's only device for telling the author that the text they are about to confirm is the AI's draft and not their record; the party that would set its wording is the AI, and the thing worded exists to check the AI." The node's own fourth paragraph (:95-99) contradicts "only": `edit-lbl` already writes "The edit, against a draft no one has confirmed" wherever a node carries both an answer and a recommended text (project.mjs:1799-1802), which is 33 nodes today. The capture-shaped limb survives narrowed -- on the 87 nodes with an answer and no diff the heading is the only such device, and there the limb is met exactly -- but as written the sentence is false of a quarter of the record, and a limb resting on an overstatement is the kind of unsupported reading `class-recommendation` says a reviewer may find. Suggested edit: "On every node whose column is rendered without a diff this heading is the record's only device for telling the author ...", adding that where a diff is rendered `edit-lbl` says it of the diff's ground and not of the text shown.
- Answer, second paragraph (:78-82), and Facts, `### answer`, fourth paragraph (:161-164) (validation 1, the author's words; and the boldness). The author's words on this node permit one thing: "A single indication per node to indicate that node is not yet confirmed is fine." The draft's second form -- "Where none is present and the answer fact carries a ruling, it says the column is showing the answer the author confirmed" -- is a positive assertion of confirmation, which the permission does not license and which the node's question does not ask, that question being "Where does the page say that a node's text is a draft no one has confirmed?". It is defensible, since a heading that names what a column shows must say something in every case, and it fires on no node today; but the fact's account of the boldness names only the placement as what rests on the AI -- "The author permitted an indication per node and did not place it, so the placement rests on the AI" -- and is silent on the second form. Suggested edit: say on the fact that the second form is the AI's own and goes beyond the author's words, so that the moderate boldness is seen to cover it; or narrow the answer to the two unconfirmed forms and leave the ratified case's heading where it is, which is what the question asks and no more.

On the facts and what they recommend: The answer fact recommends `the-line-that-names-what-the-pane-shows` at moderate boldness and that option is also `stands`, so no `## Recommendation` fence is due and none is present; the validator agrees (`node packages/disposition/validate.mjs disposition` reports `ok: 140 nodes`). No existence or persistence fact is carried and none is owed, since nothing of the node's shape moves, and both facts carry an `against`. The authority fact recommends `ratified` at low boldness on the capture-shaped limb alone, with the written `### authority` reading `class-recommendation` requires; the limb holds but rests on an overstated "only device" sentence (finding 6), so the reading needs narrowing rather than replacing. Moderate on the answer now slightly understates what the draft decides, since the draft writes a confirmed form the author never asked for (finding 7); the `review` block still pins bcabb0d8, the text this reading replaces, which is expected rather than a defect, but see finding 2 on what the section recording that reading actually contains.

On the viability of the options: Every option listed on both facts is viable as listed. The two passed options are passed for reasons that hold against the record -- `warning-in-the-eyebrow` against the parent's exhaustive naming of that line's contents ("Nothing else is in that line", alignment-page.md), and `no-per-node-warning` against the author's permission of 2026-09-06 and their own finding on `commons.systems/public/agency` -- and `on-the-answer-fact` and `warning-on-the-stage-chip` are live alternatives correctly left unpassed; `on-the-answer-fact` now carries both limbs of its case against, including the `how-a-fact-is-headed` limb the previous redraw had dropped, which I verified is still owed by a node at the periagogic stage with no answer and no facts. The authority fact's three are the reserved vocabulary. No viable option is missing: the only further placement I could name, a per-node mark on the rail row, is dominated, since the rail lists only nodes on the frontier and the mark would appear on every row it could appear on and so indicate nothing.

Strongest counter-argument (moderate): The column this answer chooses is the one column the parent reserves for the disposition alone, and the parent's reason for the reserve is the reason a warning put there may not work: "every sentence of apparatus in it is a sentence they must read past to see it". Worse, the act the warning guards is not performed in that column at all -- confirmations are staged on option rows in the column that asks, and the sibling `what-an-option-row-carries` has just taken every standing mark off those rows, so under this answer the author can ratify an AI draft with no indication anywhere near the control they ratify with. Under the answer's own criterion the confirmed form fires on no node, so what actually ships is one unvarying sentence on 120 of 140 columns, and a sentence that never varies is a sentence a reader stops seeing after a dozen nodes. The reply the draft gives to `warning-on-the-stage-chip`, that the chip is dialogue state which the recording removes, cuts the other way: the indication is wanted only while nothing is confirmed, which is exactly while the dialogue is open, so removal at the recording is the right lifetime and not an objection. What survives for the recommendation is that the thing warned about is a text and the text is there; what is still unanswered, four readings on, is that the thing guarded against is an act, and the act is elsewhere.

The session's reply: Accepted, and kicked back to the maieutic movement as the reading asks. The counter-argument is the finding that survives four readings: the act guarded against is a confirmation staged on an option row, and this answer puts its one indication in the column the parent reserves for the disposition, where nothing is confirmed and every sentence of apparatus is read past. The new answer is drawn at the maieutic movement with that as its first constraint: the indication is one per node, as the author's words of 2026-09-06 permit, and it stands where the act is, which the design decides between the stage chip, the answer fact's row, and the column, with the parent's reserve and what-an-option-row-carries' removal of the standing marks as the bounds. The seven findings are taken with it: the duplicated account section of bcabb0d8 is replaced by the record of the reading it was meant to be; the dialogue quotation is re-attributed to every-part-in-the-record at its real locus; the counts are re-taken at the head, 33 and 87 and 20 and 120, and dated; the answer says what the heading says today and whether it is qualified or replaced; the authority reading narrows its claim to the 87 nodes with an answer and no diff, where the heading is the only such device, and names edit-lbl for the rest; and the second form, the positive assertion of confirmation, is either dropped or named in the boldness as the AI's own beyond the author's permission.

### The fifth kickback answered by moving the answer, 2026-09-07

Seven findings, moderate, no probes; all validated at their loci and all taken.
The reading kicked the node back to the maieutic movement and the redraw is a new
answer and not a repair, because the finding that survived four readings was never
a defect of wording. The counter-argument each of them returned is that the act
guarded against is a confirmation, that a confirmation is staged on an option row
under a fact, and that the answer put its one indication in the column where
nothing is confirmed and every sentence of apparatus is read past. The
recommendation moves to `on-the-answer-fact`, the option the first reading raised
for exactly that reason, and the fence carries the text it would leave.

What the move settles at once. The right-hand column is untouched, so the
parent's clause that the column carries "no control, no caption, no indication,
no drill-down" is neither amended nor excepted, and the first finding's
authority-widening is answered by the answer needing nothing of the parent rather
than by a sentence disclaiming what it takes. `alignment-page#standing-named-in-the-pane`
is no longer what a ruling here waits on: it was recorded on the parent for the
placement in the pane, it stays viable there beside the option it was written for,
and the `depends` entry naming it is owed removal with this move.
`dialogue#every-part-in-the-record` stays in `depends`, and for a stronger reason
than citation: this answer takes its criterion, the answer fact's own ruling, from
that option's clause, so a ruling for another option on that fact would move this
one.

The other findings, each at its locus. The dialogue quotation in the standing
Rationale was a rival option's words, `edit-led-against-a-named-ground`'s at
dialogue.md:784, and is replaced by `every-part-in-the-record`'s own clause,
verbatim from dialogue.md:972 with that subsection beginning at dialogue.md:788;
the same clause is quoted in the fence, from the same locus. The census is struck
from the standing text at all four places it stood, in the Answer twice, in the
Rationale once and in the chip option once, and appears in no sentence of the
fence, the fact's reason, the option subsections or the authority reading, which
is what `authority`'s option `no-census-in-a-standing-answer` asks: "A measurement
of the record does not go in the text that stands: a count belongs in the node's
account, with the criterion it was taken on and the commit it was taken at, and
the standing answer says where the measure lives and not what it is." The
measurement is below. What the pane's heading says today is stated in the fence
and the answer says plainly that it neither qualifies nor replaces it, which
closes the fifth finding by removing its subject. The authority reading is
narrowed onto the new object and no longer claims to be the record's only device
without qualification: it is the only device at the control, and the only device
anywhere on a node whose column renders no diff, while `edit-lbl` says a related
thing of a diff's ground in the other column. And the second form, the positive
assertion of confirmation, is dropped rather than named: the author's words of
2026-09-06 lead the record to expect no indication of a confirmation where there
is none, and where there is one the confirmed disposition's mark on the ruled
option is what says so, which is `what-an-option-row-carries`' answer and not
this node's.

The measurement, taken on the graph at `5da05bc4` on 2026-09-07, in the worktree
`disposition/` clean at that commit. Criterion: the files matched by
`disposition-graph/*.md` and `public/*.md`, cross-tabulating the presence of a
`## Answer` section against a `## Recommendation` section, and the presence of an
`answer` entry under `facts:` in the frontmatter. Of 141 nodes, 33 carry both an
answer and a recommended text, 88 an answer alone, none a fence alone, and 20
neither; `renderPane` returns nothing for the last group, so 121 columns are
rendered. 134 nodes carry an answer fact. The 7 that do not are all among the 20
that render no column, so every node whose column is rendered carries an answer
fact and would carry the line; 13 nodes carry an answer fact with no text standing
yet, and there the line is written and no column is. No node in the record carries
a ruling on any fact, so the line is written on every one of the 134 today. The
figures the standing text carried were taken on 2026-09-06 and were false within
a day, which is the finding rather than an accident of this one node.

What the recommendation costs, stated as a consequence and not as a reason: one
string and one branch in `renderFact`, between the fact's heading and its options,
and nothing in the projector's rendering of the pane. It lands in the same
function as `how-a-fact-is-headed`, which is at the periagogic movement and owns
the heading of that section but not what sits beneath it; the two are orderable in
either direction and no dependency is entered, but a sitting on either should
read the other.

The re-reading of this draft is owed, the recommendation having moved.

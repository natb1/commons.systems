---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
stage: ruling
facts:
  - name: answer
    options:
      - name: the-line-that-names-what-the-pane-shows
        source: ai
        ref: "2026-09-06"
      - name: on-the-answer-fact
        source: review
        ref: "2026-09-06"
      - name: line-only-where-the-act-is-live
        source: review
        ref: "2026-09-07"
        supports:
          - words/2026-09-04/47
          - words/2026-09-06/3
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
    recommends: line-only-where-the-act-is-live
    boldness: moderate
    against: "The author said only that a single indication per node is fine, which permits the indication and settles nothing about where it goes, so both the placement and the narrowing are the AI's. The placement puts the record's one warning about the AI's own drafting a full column from the text it warns about, which is the objection four readings raised against the other placement and which this answer reverses rather than removes. The narrowing pays a second cost on top of it: at the periagogic, maieutic and review stages, which is where the author meets a draft as a preview and where a node spends most of its life, the page now says nothing at all about whose text they are reading."
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
  strength: none
  date: 2026-09-07
  of: 0a95fce6af78ee3703b0a90f58bc2f900127241b
  commit: f146f8f44b295c64e47a13bff338748035183d87
  survey:
    date: 2026-09-07
    of: 0a95fce6af78ee3703b0a90f58bc2f900127241b
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/dialogue#every-part-in-the-record
---

## Facts

### answer

Recommended on the act, and only where the act can be performed. The thing this
indication guards against is not a misreading but a deed: the author confirming an
AI draft in the belief that they are keeping their own record. The page's one deed
is that confirmation, as the author's rule of 2026-09-06 fixes its scope, and it
is staged by choosing an option under a fact. The answer fact is the fact whose
ruling makes the text the author's rather than the AI's, so the warning stands one
line above the rows that stage the act, inside the section that holds them, and
the author cannot reach the control without passing it. A warning that is not in
view when the control is used has not guarded it, which is what four readings
returned against every other placement. The same argument sets the line's limit,
and the recommendation moved to take it: at the periagogic, maieutic and review
stages the parent renders every input on the fact and disables it, so the deed
cannot be done there, and a warning about a deed the page will not accept is a
sentence with nothing to guard.

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

Boldness moderate, and what rests on the AI is two things, both named. The author
fixed the cardinality and left the place; the record then rules out two of the
four candidates, the row by the sibling's answer and the right-hand column by the
parent's reserve, and rules out none of the remaining two. The choice between the
node's status object and the fact the act is staged on is decided by no clause of
the record and by no word of the author's: it is decided here on where a reader's
eye is when the control is used, which is the AI's judgment and is what the
counter-argument is aimed at. The second is the narrowing to the ruling stage. The
parent supplies its ground, that every input is disabled before that stage, but no
clause of the record and no word of the author's says that the indication follows
the control; the author permitted an indication per node and said nothing about
when, and reading their permission as bounded by the act is this answer's reading
and not their instruction. `on-the-answer-fact` is that same placement without the
narrowing and is on this fact for it.

What the answer beat. The heading of the right-hand column, which is where the
text is but not where the act is, and which would need an exception to a reserve
the parent has not devolved. The stage chip, which is the node's one status
object and would put the node's state in one place, but which sits above the
stage's ask and every fact, out of view at the moment of confirming, among pills
that report the state of the readings. The eyebrow, whose contents the parent
names exhaustively. And the reading of an absent mark as an indication in itself,
which is the state the author objected to on `commons.systems/public/agency`.

#### the-line-that-names-what-the-pane-shows

In the heading of the right-hand column, which already names what that column is
showing, once per node and nowhere else on the page.

**AI support.** Two words of the author's. The finding of 2026-09-04, on
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

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

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
```

#### on-the-answer-fact

One line on the answer fact, above its options, wherever that fact carries no
ruling, at every stage the node passes through: that no ruling stands on this
node's answer, and that confirming one of these options would be the first
confirmation of the text it carries. It is everything the recommended option says
without the narrowing, and it is the option to take if the author wants the
warning present while they read a draft as a preview and not only while they can
rule on it. It is not a row and names no option, so `what-an-option-row-carries`
does not reach it; it is not in the right-hand column, so the parent's reserve is
untouched and no exception to it is needed; and it is where the act is, one line
above the rows a confirmation is staged on.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the text it warns about is
rendered in the other column, a screen's width from the warning; the section it
sits in is the one whose heading is `how-a-fact-is-headed`'s question, a node at
the review stage recommending that every fact heading be the fact's name linked to
its definer, so the two answers meet in one section without meeting on one
question, this line sitting beneath whatever that heading becomes; and the line is
written on every node at every stage, where three stages in four disable the
control it warns about, so it never varies and faces in full the objection
`vocabulary-option-summary` makes to a sentence carried on every node of the
record.

**Content.**

```markdown
---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

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
```

#### line-only-where-the-act-is-live

The recommended option, set out in the fence: everything `on-the-answer-fact`
says, with the line written on the answer fact only at the ruling stage, where the
controls are live and a confirmation can actually be staged. Recorded from the
clean-context reading of 2026-09-07, which raised it as the viable option the fact
was missing. The parent supplies the ground in terms: "at every earlier stage the
facts, their options and the recommendation are all rendered and every input among
them is disabled: the author sees exactly what will be asked and cannot yet answer
it." The answer's whole case for the placement is that the warning must be in the
path of the act, where the author "will be standing when they can do the thing it
warns about", and at the three earlier stages they cannot do it, so on those nodes
the line is a sentence about an act the page will not accept. Narrowing it there
cuts the repetition sharply, makes the answer's own opening sentence true rather
than aspirational, and costs one condition in the same branch of `renderFact` the
answer already asks for, keyed on the stage that already decides whether the
fact's inputs are live.

**AI support.** Two words of the author's, and one act. The finding of 2026-09-04, on
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
where they will be standing when they can do the thing it warns about. Every other
placement answers the first question and this one answers the second. The same
question answers when as well as where, and the answer takes both: at the stages
before the ruling the parent disables every input on the fact, so there is no act
to stand beside, and a line written there would be the warning without the thing
warned of.

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

**AI divergence.** Against it: at the periagogic, maieutic and review stages
the page then says nothing about whose text the author is reading, and those are
the stages at which they read a draft as a preview and the ones a node spends most
of its life in; the objection that the text warned about is a column away is
untouched by the narrowing.

The author said only that a single indication per node is fine, which permits the indication and settles nothing about where it goes, so both the placement and the narrowing are the AI's. The placement puts the record's one warning about the AI's own drafting a full column from the text it warns about, which is the objection four readings raised against the other placement and which this answer reverses rather than removes. The narrowing pays a second cost on top of it: at the periagogic, maieutic and review stages, which is where the author meets a draft as a preview and where a node spends most of its life, the page now says nothing at all about whose text they are reading.

**Content.**

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
confirmation of the text it carries. It is written where that fact carries no
ruling and the node is at the ruling stage, which is where a confirmation can be
staged, and nowhere else on the page and at no earlier stage.

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

A sentence written on every node the record renders is the fault
`vocabulary-option-summary` strikes off the option's row in this same movement,
and this line is not that fault. Its ground there is that "a sentence carried on
134 of the 141 node files of both graphs is read once and skipped thereafter, so
the gloss earns its place on the first node and costs on every node after it", and
that is exactly right of what it demotes and not of this. The difference is what
each sentence does. The gloss explains a convention, and a convention is learned
once: a reader who has met it on one node carries it to the next, so the second
printing teaches nothing and costs the space it takes. This line explains nothing.
It warns about an act, and the act is performed again in full on every node the
author rules; the reader does not carry the last node's confirmation to this one,
and what they are about to do here is the thing the line is about. A warning beside
each performance of an act is not one sentence read many times, it is one sentence
read once per performance. That is also why the line stops where the act stops:
where the controls are disabled the performance cannot happen, the sentence has
nothing to warn about, and there it falls to the sibling's rule like any other
repetition.

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

One line, once per node, and only where a confirmation can be staged, which is the
ruling stage and no stage before it. The parent settles what the earlier stages
are: "at every earlier stage the facts, their options and the recommendation are
all rendered and every input among them is disabled: the author sees exactly what
will be asked and cannot yet answer it." A warning about an act the page will not
accept is not a warning, so at the periagogic, maieutic and review stages the line
is not written, and what says the ruling is not yet being taken there is the
disabled control itself. A node that carries no facts carries no answer fact,
offers no option to confirm, and takes no line at any stage; the column there says
which movement is owed and that nothing is proposed yet, which is the parent's
clause and not this one's. Where a node at the ruling stage carries an answer fact
with options but no text standing, the line is still written, since what it says is
that no ruling stands on the answer and not that a column is rendered. Everything
it says is read from the fact and from the node's stage, as the parent requires of
everything the column shows of a fact: the absence of a ruling on any of its
options. In the implementation it falls on `renderFact` in the alignment page's
projector, between the fact's heading and its options, where that function already
writes the fact's ruling when one exists and where the stage already decides
whether the fact's inputs are live; the words are the projector's, and what this
answer fixes is what they must say, where they must say it, and when. The heading
of that section is not this answer's: it is `how-a-fact-is-headed`'s question, and
that node is at the review stage, recommending that every fact heading be the
fact's name linked to its definer, which shortens the heading and moves the
question behind a link. This line sits beneath whatever that heading becomes and
says nothing about it, so the two answers are complementary and neither waits on
the other.
```

#### warning-on-the-stage-chip

Everything the recommended option says, with the indication on the stage chip
instead of the answer fact. The chip is the node's one status object, as
`alignment-page` names it in putting the readings' readiness there: "It is there
because it is the state of the node, and the chip is the node's one status
object, beside the controls that move it." Whether a node's text has been
confirmed is a fact about the node, which is the sibling's own reason for taking
it off the rows, so the node's state would be in one place and at the head of the
column that decides.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the chip is not where the act is, sitting above
the stage's ask and above every fact the node carries, so on any node long enough
to scroll the warning is out of view at the moment the control is used; and what
else the chip carries is the state of the two readings and the count of open
probes, so a warning set among them is read as one more pill of process metadata
rather than as the one thing on the page the author is asked not to do by
accident. Its lifetime is not among the objections: the indication is wanted
exactly while nothing is confirmed, which is exactly while the dialogue is open,
so the dialogue's removal at the recording is the right lifetime, as the reading
of 2026-09-07 found against the draft that argued the contrary.

**Content.**

```markdown
---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the indication on the stage chip
instead of the answer fact. The chip is the node's one status object, as
`alignment-page` names it in putting the readings' readiness there: "It is there
because it is the state of the node, and the chip is the node's one status
object, beside the controls that move it." Whether a node's text has been
confirmed is a fact about the node, which is the sibling's own reason for taking
it off the rows, so the node's state would be in one place and at the head of the
column that decides.
```

#### warning-in-the-eyebrow

Everything the recommended option says, with the indication in the line beneath
the question and the id, among the settling count, the options pending and the
nodes this one stands under. Passed over: `alignment-page`'s answer names that
line's contents and says nothing else is in it, on the argument that a line no
answer names collects what no answer justifies.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the indication in the line beneath
the question and the id, among the settling count, the options pending and the
nodes this one stands under. Passed over: `alignment-page`'s answer names that
line's contents and says nothing else is in it, on the argument that a line no
answer names collects what no answer justifies.
```

#### no-per-node-warning

No indication anywhere: the confirmed mark is absent from every row of an
unconfirmed node, and that absence is the indication. Passed over: the author's
words of 2026-09-06 permit an indication rather than requiring none, and absence
is precisely what a reader cannot see. It is also the state the author found and
objected to on `commons.systems/public/agency`.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

No indication anywhere: the confirmed mark is absent from every row of an
unconfirmed node, and that absence is the indication. Passed over: the author's
words of 2026-09-06 permit an indication rather than requiring none, and absence
is precisely what a reader cannot see. It is also the state the author found and
objected to on `commons.systems/public/agency`.
```

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

## Account

### Manifest

- Folded: Minted, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-06, of 387e98da, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading applied and answered, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-06, of fa7a9fa1, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The re-reading's kickback answered, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-06, of 563a0136, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The third kickback answered, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-06, of bcabb0d8: its record lost, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 8b1d076b, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The fifth kickback answered by moving the answer, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 13a8ddc7, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The sixth reading, and the narrowing it bought, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 4b2abc38

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `line-only-where-the-act-is-live`.

Findings:


On the facts and what they recommend: The answer fact's recommendation moves from `on-the-answer-fact` to the new option `line-only-where-the-act-is-live` (moderate boldness unchanged, `stands` unchanged at `the-line-that-names-what-the-pane-shows`, fence still correctly present since nothing stands); the fact's `against` prose is lengthened to name both the placement objection and the new narrowing's own cost. The authority fact's recommendation (ratified, low) is unchanged by the diff.

On the viability of the options: Every option remains viable; the diff adds `line-only-where-the-act-is-live` (source review, ref 2026-09-07) exactly as the previous reading's viability paragraph asked for, and the superseded `on-the-answer-fact` stays on the list as the placement without the narrowing.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding; the parent's mark and the sibling's stage verified on the main thread. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 4b2abc38

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The parent has not caught up with this node, and the parent is what the author reads the page through. alignment-page's option `standing-named-in-the-pane` still says "What the child recommends now is `on-the-answer-fact`" and "The child stands at the review stage with its recommendation moved and its reading owed", both false at this commit; and the parent's answer says of this node that it is not in depends and must not be, "under an option of this answer's own and the edge would close a cycle", where this node's `under` is that parent and its depends names only dialogue. So the two clauses a ruling here would move are described by a parent that has the child's state and its placement wrong.

### Frontier finding, 2026-09-07

Kind: cross-reference.

alignment-page's option `standing-named-in-the-pane` describes its child's state twice and both descriptions are false at this commit. It says "What the child recommends now is `on-the-answer-fact`, the indication above the answer fact's options", where where-the-unconfirmed-indication-goes recommends `line-only-where-the-act-is-live`, which is that option narrowed to the ruling stage; and it says "Recorded and not applied. The child stands at the review stage with its recommendation moved and its reading owed", where the child stands at the ruling stage on a forward review of 2026-09-07. The option's whole work is to tell the author what a ruling on the child would and would not move, so both errors bear on the ruling the option exists to inform.

Also named: commons.systems/disposition-graph/alignment-page.

Proposed: The child's own text is the survivor. alignment-page's option prose is redrawn to name `line-only-where-the-act-is-live` and the narrowing it adds, and to state the child's stage as it stands or not at all, since a stage restated in prose goes stale the day it is written — which is the argument the option `clauses-cited-not-restated` already makes against this answer's method.

### Frontier finding, 2026-09-07

Kind: cross-reference.

alignment-page's recommended answer gives a reason for a missing edge that the record contradicts. Of where-the-unconfirmed-indication-goes it says the node "is not in `depends` and must not be, since it stands" — the sentence continuing — "under an option of this answer's own and the edge would close a cycle." That child's `under` names commons.systems/disposition-graph/alignment-page, not an option of it, and its `depends` names only commons.systems/disposition-graph/dialogue#every-part-in-the-record, so no edge from this node to that one would close any cycle. The clause is the only account the answer gives of why the eighth child is treated differently from the seven named in depends.

Also named: commons.systems/disposition-graph/alignment-page.

Proposed: The child's fields are the survivor. The clause is redrawn to say what is actually true of the placement, or the edge is entered in depends like the other seven if nothing bars it; either way the reason given for the exception is not a fact about a cycle. Nothing on the child changes.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/where-the-unconfirmed-indication-goes stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `the-line-that-names-what-the-pane-shows`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `line-only-where-the-act-is-live`; 2 `## Disposition` entries became the ledger entries words/2026-09-04/47, words/2026-09-06/3, referenced by 0 options the entry's own date names and by the recommended option for 2 the date named none; and `stands` left the answer fact. The content of `on-the-answer-fact (at 0f4c594d)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `warning-on-the-stage-chip`, `warning-in-the-eyebrow`, `no-per-node-warning`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `4b2abc38e9e9dfd2175acca173d72e29705957f2` is re-computed for the encoding as `a3ee2ba1be4ade16a0fa11d323bcb6cb56ba7377`; nothing it read changed. The survey's pin `4b2abc38e9e9dfd2175acca173d72e29705957f2` is re-computed for the encoding as `a3ee2ba1be4ade16a0fa11d323bcb6cb56ba7377`; nothing it read changed.

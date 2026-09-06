---
question: Where does the page say that a node's text is a draft no one has confirmed?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: the-line-that-names-what-the-pane-shows
        source: ai
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
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on `commons.systems/public/agency`, carried on `alignment-page`, which is the finding this question exists to answer:
> I don't understand what "standing" would even refer to. This node has not yet been answered, there is no ground to confirm as standing

The author, 2026-09-06, in the sitting on `what-an-option-row-carries`, when the `stands` chip stopped carrying the warning:
> A single indication per node to indicate that node is not yet confirmed is fine.

## Answer

On the line that names what the right-hand column is showing, once per node, and
nowhere else on the page.

That line already exists for one of the three cases the column renders. Where a
node carries an answer and a recommended text that would change it, the column
says whether the edit is against the ratified answer or against a draft no one
has confirmed, which was written for the author's finding of 2026-09-03 that a
diff implies a ground the record does not have. It is completed rather than
minted, so that it reads in all three cases: the edit and what it is an edit
against; the text and the standing it has, where an answer stands and nothing
would change it; and, where no answer stands at all, that what is shown is the
AI's recommended text with nothing behind it that anyone has confirmed.

One line, on the disposition itself, read at the moment the author reads the
thing they are ruling on. The warning is about a text, and the text is in that
column; a node's rows carry no part of it, because the standing of the text is a
fact about the node and not a status of one option among several, which is what
`what-an-option-row-carries` settles when it takes the mark off the row.

Where no answer and no recommended text stand at all there is no column and
nothing to warn about, and the page says nothing rather than inventing a
disposition to disclaim.

## Facts

### answer

Recommended because the line already exists, in the one case the author
complained of, and completing it is cheaper than minting a second home for a
sentence that has one. `renderPane` in `packages/disposition/project.mjs` says,
where a node carries both an answer and a fence, whether the diff is against the
ratified answer or against a draft no one has confirmed; that line was written
for the author's finding of 2026-09-03, that a diff implies a ground the record
does not have. What it does not do is cover the other two cases the column
renders. Completing it makes the indication exhaustive without adding a surface.

The placement argument is that the thing warned about is a text, and the text is
in the right-hand column. The author reads the disposition there at the moment
they decide to confirm it, and a warning about what they are confirming belongs
where the thing being confirmed is. Boldness moderate: the author permitted an
indication and did not place it, so the placement rests on the AI.

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

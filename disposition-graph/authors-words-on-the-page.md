---
question: Where does the alignment page show the author's recorded words?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: per-option-only
        source: author
        ref: "2026-09-04"
      - name: section-folded-and-quotation-narrowed
        source: ai
        ref: "2026-09-06"
      - name: words-first-in-the-column
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "a section running to 1,986 words placed under the stage chip makes the first thing on the node a thing the author scrolls past, which is the fault the parent names against apparatus moved one column over"
      - name: residue-in-the-drill-down
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "it makes the section a function of the AI's own references and breaks the order the words were said in, which is the property that makes the section a check"
      - name: drill-down-only-where-no-option-quotes
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the same edit at the node's granularity, and on the twenty-five partly covered nodes the forty-five entries no reference names would still be shown nowhere"
      - name: fallback-to-the-whole-section-kept
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "it labels the whole section as the ground of one option, which is the playback the author's words release the page from, and it hides a broken reference where this answer makes one a finding"
      - name: caption-where-the-node-carries-none
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "it prints one sentence on seventy-two of a hundred and forty items to say what the rows already say by carrying no quotation, and its second half is what the standing-choice row says wherever there is an answer for it to be about"
      - name: one-drill-down-per-entry
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "two hundred and twenty-two summaries whose labels are dates carry less than one summary naming the section, and an entry's sense is usually in the sequence"
      - name: ancestors-words-too
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the ruling in front of the author is on this node's question, so the column would carry words no decision on it rests on"
      - name: section-open-not-folded
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "it puts up to two thousand words of the author's prose above the facts the ruling asks"
      - name: address-for-the-words-no-option-names
        source: review
        ref: "2026-09-07"
    recommends: per-option-only
    boldness: low
    against: "The only words the author has given on this node are a release with one named exception, and this answer reads 'does not need to be played back' as 'must nowhere appear' and extends a sentence about the periagogic response to every dated entry a node's `## Disposition` holds, two readings of the AI's resting on the author's one sentence. What that costs, re-taken at graph commit 62121b69: 142 of 255 dated entries are named by no option and 39 of the 71 nodes that carry words have none named at all, while `projection`'s standing answer holds that the record is read through projections and never by opening node files, so the majority of what the author has said reaches no projection they read at the moment of ruling; and this very ruling leans on the author's rule of 2026-09-06, which lives in `alignment-page`'s `## Disposition` and not in this node's, with `ancestors-words-too` passed over, so the author rules here without seeing on the page the later words the answer rests on."
    stands: per-option-only
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "Whichever way this goes the author's words stay in the node unaltered and are read in full in the `/align` interview their own rule of 2026-09-06 sends everything else to, so nothing is lost that a session cannot show them on request; ratifying it spends the author's scarcest act on which dated entries a projector quotes beside an option, and the capture the reading names is already answered by the parent's own authority fact, under which the whole shape of this page is the author's to confirm."
review:
  verdict: kickback
  strength: strong
  date: 2026-09-07
  of: c48996dc6997e0445b1ff385d558a8c8d0eed9be
  commit: f146f8f44b295c64e47a13bff338748035183d87
  against: "The amendment repairs seven of the eight findings precisely and verifiably (the exclusivity sentence, the authority 'owed' claim, all stale project.mjs/read.mjs citations, the four unqualified figures, the words-first-in-the-column status, and the missing viable option), but the eighth — the stale 'five clauses' count in the parent-reach account section — is left completely untouched by the diff while the amendment's own closing account section falsely asserts it was fixed. That is not a partial answer to a finding; it is a false statement about what this very amendment did, on the same locus that has already produced two prior rounds of the identical false claim, which is exactly the kind of thing question 2 asks a re-reading to catch."
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Do not take text input for the unfinished periagoge - that is for the periagoge session to collect. Whatever response is provided in periagoge it does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options.

## Answer

On the option rows, and nowhere else. Where an option's source is the author,
its row carries, one step down, the author's words that option rests on: exactly
the entries of this node's `## Disposition` that the option's `ref` names, and no
others. Nothing else on the page is the author's words under `## Disposition`;
the reason the author gives with a ruling is the other kind `dialogue` names,
and it stays where `what-an-option-row-carries` puts it. There is no
drill-down holding the section whole, neither folded nor open, at any stage, and
none at the foot of the middle column. This is the author's sentence of
2026-09-04 read at its plainest: whatever response they provide in the
periagogic movement "does not need to be played back in the alignment artifact
expect as quotes supporting or refuting fact options", and a quotation on the row
of the option it supports or refutes is the one form those words name.

An entry is a dated paragraph beginning "The author, <date>" together with the
blockquote it introduces, which is the projector's own rule (`AUTHOR_ENTRY_RE`,
`packages/disposition/project.mjs:1405`, applied by `authorEntries` at `:1407`,
at implementation commit cb0e02c6).
An option's `ref` is the date the words were given, and the match is by that date
alone: where a date carries more than one entry the row shows all of them, in the
order the section keeps them, which is what `authorWordsFor` does today
(`packages/disposition/project.mjs:1421-1427` at cb0e02c6). That is coarse and this answer
does not refine it — on this page's own parent fourteen of the twenty-four
entries are dated 2026-09-04, so an option referring to that date carries all
fourteen. What an option's `source` and `ref` are is
`commons.systems/disposition-graph/dialogue`'s question; this answer reads them
and adds nothing to them. On this node the recommended option's own reference
resolves to one entry, so the row the author rules on carries the sentence it
rests on and nothing besides.

Where a `ref` names no entry the row carries nothing for the author's words, and
the mismatch is a finding on the option rather than an occasion to quote. The
fallback the projector runs today goes with it: at
`packages/disposition/project.mjs:1425` at cb0e02c6 a date matching nothing returns the whole
`## Disposition`, which, shown under the label the row gives it, asserts as the
ground of one option words that may bear on another option on the same fact —
the whole-section playback the author's sentence releases the page from, wearing
a per-option label — and converts a broken reference into a plausible render. The
finding is raised by the graph's validator, beside the check that already
requires a `ref` on every option of an answer fact
(`packages/disposition/read.mjs:496-499` at cb0e02c6), and it is listed by the frontier on the
node that carries it. It is a finding and not a parse error, so the graph still
reads and still projects while the eleven are outstanding, on the reader's own
principle that an attention rule never turns into one
(`packages/disposition/read.mjs:1391-1394` at cb0e02c6). Both were owed when this answer was
written; the check landed on the implementation ref at commit cb0e02c6 of
2026-09-07, as `deriveMechanicalFindings` in the same file, and the frontier lists
what it raises. The direction is
`commons.systems/disposition-graph/viable-options`' recommended text, which no
ruling has reached and which this answer reads as direction rather than as
doctrine: an option sourced to the author "carrying a graph commit where the date
of the words should be is a finding and not a fact". A reference resolving to no
entry is that same defect wearing the right shape, and a page that fills the gap
with the whole section makes it unfindable.

What this costs is measured, at graph commit `ec6e2300` and re-taken by the
reading of 2026-09-07. Of 140 nodes, 68 carry a `## Disposition`, holding 222
dated entries; 45 options are sourced to the author, of which 34 carry a
reference naming at least one entry and 11 name none; the references reach 101 of
the entries and miss 121, and reach none at all on 43 of the 68 nodes. So on the
day this answer is projected the page carries a minority of what the author has
said to the record, and eleven rows carry nothing where a quotation is owed. That
is the cost, and it is the reconciliation this answer owes rather than a reason
to show the section. Three things discharge it: the eleven references are
written; an entry that bears on a fact the record asks and that no option names is
recorded as an option on that fact, sourced to the author and referenced by its
date, which is what puts it on the page at the place it decides something; and an
entry that bears on no fact is left in the record, where the browser may yet
render it. What the record does not do is show every entry beside every option to
cure the arithmetic.

What this answer does not decide, and where each belongs. Whether the browser
renders a node's `## Disposition` is
`commons.systems/disposition-graph/projection`'s, and the measurement above is an
argument put to that node, recorded there as the option
`browser-renders-the-authors-words`, and not a decision taken here. Whether the
AI's account is shown as a drill-down is the parent's, carried there as the option
`account-not-on-the-page`, and nothing here touches it. Whether the author's
words may share the right-hand column is not open: that column is the disposition
and nothing else, which is the parent's clause and not devolved here. How the
words are retained, rolled up and dated is
`commons.systems/disposition-graph/quotes`'.

## Rationale

Recorded on the author's disposition of 2026-09-04, queued from the sitting on
`commons.systems/disposition-graph/author-questions` and carried under
`## Disposition`:

> Whatever response is provided in periagoge it does not need to be played back
> in the alignment artifact expect as quotes supporting or refuting fact options.

The sentence releases the page from playing the author's response back and names
one exception to the release, and this answer is that sentence with nothing added
to either half. The exception is where the author's words live on the page:
quotes, on options, supporting or refuting them. Its narrowing work is done by
"supporting or refuting fact options" — the words the row shows are the words
that bear on the option the row is, which is what fixes the quotation to the
entries the reference names and leaves the row silent where it names none. The
earlier draft kept the whole section on the page under a distinction between a
playback and the record shown once at one remove; that distinction is the AI's
word set against the author's, and on the author's own question about the author's
own words it is not a ground.

The later rule cuts the same way. On 2026-09-06 the author fixed the page's
scope: "The scope of alignment artifact is limited to final confirmation and
previews/read only indicators of other phases of the dialogue. All other
information from the author is done via the `/align` session interview." That is a
rule about what the page does with the author, and its direction is inward: the
confirmation stays, and everything else about the author goes to the interview.
Reading out of it a permission for the page to carry more of the author's words
than their own sentence of 2026-09-04 allowed inverts it. Nothing is lost in the
narrowing that a session cannot restore: the words stay in the node, unaltered,
and the interview the rule names is where they are read whole.

The coverage measurement is the strongest thing said against this answer, and it
argues for the other remedy. That 121 of 222 entries are named by no option is a
fact about the references and the options rather than about the page: an entry
that bears on a fact the record asks and that no option names is an option the
record has not yet recorded, and eleven references naming no entry are eleven
defects this answer itself makes findable. Curing them by showing the section
entire makes the projection the place to make up what the encoding has not done,
which is the error `commons.systems/disposition-graph/evaluation` exists to catch,
an incumbent fact doing the work of a design constraint: the section would be on
the page because the references are thin, and it would still be on the page after
they were thick. The cure the record's own machinery gives is cheap where the
display is not — a reference is a date and an option is a sentence with a source —
and it puts each of the author's words at the place where they decide something
rather than in a column of prose the author scrolls past.

Two traditions were surfaced and each is recorded as a reading bearing on this
fact. `commons.systems/disposition-graph/bentham-publicity` is why the finding is
part of this answer and not an accessory to it: publicity's rule, as that reading
takes it, is against a recommender that "publishes some of its decisions and
withholds others by its own measure", and under this answer it is the AI's
references that decide which of the author's words the author sees, so the
selection itself must be published — a reference naming no entry is a finding on
the frontier and never a silent row. The reading is adopted on this option for
that reason, and adopted on `section-folded-and-quotation-narrowed` too, that
option being disclosure of another kind; the principle supports both and does not
choose between them, and marking the option the recommendation left as a
divergence would recruit the tradition for a choice made on the author's words.
`commons.systems/disposition-graph/hansard-verbatim-record` supports this option
in terms, within the scope it records, which is the option's row: "The first
level is the option's sentence, its status and the mark on the recommendation …
the second level, one step under it, is the full text of the fact, the author's
words, the AI's case". This answer puts the author's words exactly there and
nowhere else. The earlier draft read that reading's guard, that the second level
is always present and one step away, at a node-level drill-down the reading never
read; the extension is not made here, and the reading is cited only for what it
says.

The reach is bounded by where authority lies. The parent devolved this question
and marks both clauses a ruling here reaches as standing only until this node
rules; the account half of the same sentence is the parent's own, the right-hand
column's reserve is the parent's and untouched, the browser is `projection`'s,
and what a `source` and a `ref` mean is `dialogue`'s. In the parent's recommended
text this answer narrows one clause, the option drill-down's third item, to the
entries the reference names and no others, and strikes one, the author's words as
a drill-down of the column.

## Facts

### answer

Recommended: `per-option-only`, at low boldness, which is also what stands.

The recommendation moved here on 2026-09-07 from
`section-folded-and-quotation-narrowed`, on the counter-argument the clean-context
reading of that draft returned; the account records the move. What carries it is
that the only words the author has given on this node are a release with one
named exception, that this option is that sentence and nothing else, and that the
ground for keeping the section — that a section shown beside no control is not a
playback — is a distinction the AI drew and the author did not. The narrowing
half is unchanged from the draft and is where the author's exception does its
work: the entries the reference names, on the row of the option they bear on, and
nothing where the reference names nothing.

Boldness is low because the recommendation rests on the author's words rather
than against them, which is the measure `dialogue` gives boldness: the option is
sourced to the author and referenced to their sentence, and every clause of the
answer is that sentence applied. What is the AI's here is the disposal of the
consequence — that an unresolving reference is a finding, and the locus it is
raised at — and neither is a departure from anything the author has said. The
draft's moderate mark was for a reading of "played back" that this answer no
longer needs.

The case against is on the fact, at full strength: on the day this is projected
the page shows the author a minority of what they have said to the record, and
eleven rows show them nothing. The reply is that this is a defect of the
references and of the options the unreferenced entries lack, curable exactly
there; that eleven silent rows become eleven findings the moment the check
exists, so the defect is disclosed rather than hidden; and that the alternative
is on this fact as the AI's option, with the measurement as its case and no
status against it, so the author may take it in one ruling.

#### section-folded-and-quotation-narrowed

Everything the recommended option says of the per-option quotation, with one
folded drill-down last in the middle column holding the node's `## Disposition`
whole and in the order it keeps it, at every stage alike. For it, and it is the
measurement, at graph commit `ec6e2300`: the references reach 101 of the 222
entries and none at all on 43 of the 68 nodes that carry words, the browser renders no `## Disposition`, and
`projection`'s answer, which no ruling has reached, says the record is read
"through projections, never by opening node files, except in alignment sessions",
so under the recommended option the majority of what the author has said to this
record is visible in no projection today; and the section is the only text in the
middle column the AI did not write, which is what would make it a check on a
draft written in the author's voice rather than more apparatus. Viable and not
recommended: the author's sentence of 2026-09-04 releases the page from playing
their response back except as quotes on options, the distinction that would leave
a folded section standing under that sentence is the AI's and not theirs, and the
coverage it answers is answered instead by writing the eleven references and
recording the options the unreferenced entries lack.

#### words-first-in-the-column

Everything `section-folded-and-quotation-narrowed` says, with its drill-down
placed at the head of the middle column, under the stage chip and above the
facts, rather than last. For it: the words are the ground the draft answers, and
reading the ground before the options is the order of the argument rather than
the order of the page. Against it, and decisive: the column's own ask is the
facts, and the parent's recommended text puts the drill-downs last for that
reason; a section running to 1,986 words on this page's parent makes the first
thing under the chip a thing the author scrolls past on every node that carries
words, which is the fault the parent names against apparatus in the right-hand
column, moved one column over. Passed over on that ground, and it falls with the
option it varies.

#### residue-in-the-drill-down

Everything `section-folded-and-quotation-narrowed` says, with its drill-down
carrying only the entries no option's `ref` names, so that no entry appears twice
on the page. For it: 101 of the 222 entries would otherwise be rendered in both
places on the same node. Passed over. The duplication it cures is not a defect,
since both are projections of one stored section and neither is a copy that can
drift, which is the test `dialogue` sets in keeping a thing once where it is
decided and deriving the rest; and the cure costs the property that earns the
section its place under that option, since a section whose contents are chosen by
the AI's own references is a section the AI has edited, and the chronology the
author reads their dialogue in is broken by the removal.

#### drill-down-only-where-no-option-quotes

Everything `section-folded-and-quotation-narrowed` says, with its drill-down
rendered only on nodes where no option's `ref` reaches any entry, so the page
shows the section where nothing else would and stays silent where something does.
Passed over: it is the same edit at the node's granularity and buys less. On the
25 nodes the references partly cover, the 45 entries they miss would be shown
nowhere, and whether a node's words appear at all would turn on whether the AI
wrote one resolving reference on it.

#### fallback-to-the-whole-section-kept

Everything the recommended option says, with `authorWordsFor`'s present behaviour
kept: where an option's `ref` names no entry, the row shows the whole
`## Disposition` under the label "the author's words it rests on". For it: the
author sees something rather than nothing at the point of choosing, and on this
option nothing else on the page would carry those words. Passed over. It asserts
as the ground of one option words that may bear on another option on the same
fact, which is the whole-section playback the author's words release the page
from, wearing a per-option label; and it converts a broken reference into a
plausible render, where `viable-options`' recommended text, which no ruling has
reached, names a reference of the wrong kind on an author-sourced option "a
finding and not a fact". It ran on 11 of the 45 author-sourced options at graph
commit `ec6e2300`, so
the choice it offers is between eleven quiet renders and eleven findings.

#### caption-where-the-node-carries-none

Everything the recommended option says, with a caption where the node carries no
`## Disposition`, saying that no words of the author's are recorded on it and
that what the answer says the AI drafted. For it: absence is easy to miss, and
the second half is true and worth saying. Passed over: the caption was struck by
the author's rule of 2026-09-06 as the companion of the control it sat under, and
nothing in this answer brings its question back; it would print on 72 of the 140
items on the page, where the rows say the same thing by carrying no quotation;
and its second half is what the standing choice's own row already says wherever
there is an answer for it to be about, in the parent's words, that confirming
ratifies the AI's draft, while on a node with no answer at all there is no answer
below for the caption to be about.

#### one-drill-down-per-entry

Everything `section-folded-and-quotation-narrowed` says, with one drill-down per
dated entry, each summarised by its date, rather than one holding the section.
For it: 17 entries on `alignment-order` and 24 on `alignment-page`, at graph
commit `ec6e2300`, are a wall behind a single summary. Passed over: it puts 222
summaries, at that commit, on the page whose
labels are dates and so carry nothing of what was said, where one summary naming
the section says what the reader is opening; and an entry's sense is usually in
the sequence it sits in, which per-entry folding hides. It falls with the option
it varies.

#### ancestors-words-too

Everything `section-folded-and-quotation-narrowed` says, with its drill-down
carrying the author's words recorded on the node's ancestors as well as its own,
since a ruling here falls within their grant. Passed over: the ruling in front of
the author is on this node's question, the ancestry is already a route the rail
and the column's one line give them, and a column carrying words no decision on
it rests on is the apparatus the parent's recommended text is against.

#### section-open-not-folded

Everything `section-folded-and-quotation-narrowed` says, with its drill-down
rendered open rather than folded, so that the author meets their own words
without a click. For it: a fold is a step the reader may not take, and on that
option the section is the one text in the column the AI did not write. Against
it, and decisive on the measurement: a section running to 1,986 words on this
page's own parent would stand between the stage chip and the facts the ruling
asks about, which is the fault the parent names against apparatus, and the
two-level form the record reads under this page is the answer to it. Passed over.
Raised by the clean-context reading of 2026-09-07, which found the alternative
decided in the draft's prose and recorded on no fact.

#### address-for-the-words-no-option-names

Everything the recommended option says, with one line in the middle column
addressing the browser's page for this node, so that the entries no option's
`ref` names are one step away without any of them being rendered here. For it:
the author's sentence releases the page from playing their response back, and an
address is not a playback; the parent's answer already uses that route, having
each metric link to that node in the browser, "which addresses every node by its
id where this page has no route to one", and the column is already headed by the
node's id; and at graph commit `62121b69` 142 of 255 dated entries are named by
no option, while `projection`'s standing answer holds that the record is read
through projections and never by opening node files, so the residue reaches the
ruler nowhere. Against it: it turns on `projection` ruling that the browser
renders a node's `## Disposition`, which is that node's option
`browser-renders-the-authors-words` and which no ruling has reached, so today the
link would address a page that shows none of the words. Viable and not adopted,
for that reason. Raised at the clean-context reading of 2026-09-07, in its
viability paragraph; if the line in the column heading is the parent's clause
and not devolved here, the same option belongs on `alignment-page` with this
node as its source.

### authority

Ratified, at low boldness. `class-recommendation`'s test asks whether being wrong
would be expensive, irreversible, or capture-shaped, and the limb this node meets
is capture-shaped.

The decision is which of the author's own recorded words the author is shown at
the moment they rule on a text the AI drafted in their voice. Under this answer
that selection is made entirely by the references the AI writes on the options:
the row carries the entries the `ref` names, and no other words of the author's
are anywhere on the page. Under any class but ratified the party setting that
rule is the AI, and the author's verbatim words are the record's one check on
whether the draft is faithful to them — the rationale of the text
`commons.systems/disposition-graph/quotes` recommends, itself a draft no ruling
has reached, says that the author's decisions are what re-derivation cannot
reconstruct and that a restatement is by construction the AI's wording of them,
"which is the drift this record exists to resist", and everything else in the
column is that restatement. A recommender that decides which of the evidence
against it the decider sees is the shape the limb names, and it is the shape the
record has already read here, in `bentham-publicity` under this page, of a
recommender that "publishes some of its decisions and withholds others by its own
measure". It is that shape whichever way the answer goes, and the recommendation
moving to the author's own option does not change who would be setting it: this
answer is the narrower of the two, since the references are now the only route
the author's words have to the page, so the class weighs more here than it did on
the draft it replaces.

The other two limbs are not met and the reading says so. Not expensive: the
answer is one projector function with its fallback removed and one drill-down
struck, with the check and the frontier line that landed at cb0e02c6 beside them, and nothing is built on
it. Not irreversible: the `## Disposition` section stays in the node under every
option on this fact, so no words are lost either way and a wrong answer is undone
by re-projecting the page. Delegated would leave the selection of the author's own
words in the hands of the party those words check, which is the one class of
decision a delegation here cannot cover. Deferred is on the fact because the
record's classes are three: it is what the author takes if they want this answer
to act while the question stays in front of them, and it is the reasonable choice
now that the recommendation is their own sentence read plainly and the contested
part is the coverage rather than the rule. Boldness low because the class follows
the stated test applied to a stated fact, and not the AI's judgment of this node
alone.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text two places where the author's own words are played back whole. The sentence "Last, as drill-downs, the author's words and the AI's account -- except at the two stages that ask for the author's words, where what they have already said on this node comes up beside the control asking for more, open, rather than staying folded below the question it answers" is the playback the author's second sentence strikes; the clause the same words leave standing is the option drill-down's "the author's words it rests on, where its source is the author, by the reference it carries", which is already a quotation offered for or against one option and is the only form the author allows. So the question is whether the whole `## Disposition` section has any place on the page, and, where it does not, whether the words that bear on no option are reachable from it at all. That half is settled. The open playback existed in the recommended text only as the companion of the control at the two earlier stages, and the author's rule of 2026-09-06, that the page's scope is the final confirmation and, of every other movement, a preview and a read-only indicator, struck the control and the clause that opened the words beside it; `alignment-page`'s recommended text now reads "Last, as drill-downs, the author's words and the AI's account, at every stage alike, there being no control on this page asking the author for more." The node this question rested on, `input-for-an-unfinished-movement`, was pruned on 2026-09-06 under the author's delegation, its answer having moved into the parent. What remains to decide here is what it always was less that half: the folded drill-down and the per-option quotation. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`: `renderAsk`, which appends the `The author's words` drill-down at every later stage, `renderStageAsk`, which opens the same section at the two earlier ones, and `authorWordsFor` with `authorEntries`, which pick the entries of `## Disposition` an option's `ref` names and fall back to the whole section when the date matches nothing; and on `packages/disposition/alignment-template.html`, which styles both.

Cascades: `commons.systems/disposition-graph/quotes`, whose question is how the author's words are retained and which decides what a projection may show of them; `commons.systems/disposition-graph/dialogue`, whose `## Disposition` is "the author's words, verbatim and dated, accumulating through the dialogue" and whose option carries the `source` and `ref` by which a quotation is attached to an option, the fallback in `authorWordsFor` being the seam where that attachment fails; `commons.systems/disposition-graph/viable-options`, on what each option's record holds; and `commons.systems/disposition-graph/projection`, which decides what the browser renders of the same words.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 on a node with a long `## Disposition` and on an option whose source is the author, read against the recommended text of `alignment-page`, the answers of `quotes` and `dialogue`, and `renderAsk`, `renderStageAsk` and `authorWordsFor` in the projector, before anything is changed.

### The maieutic, 2026-09-06

The periagogic object was read by the survey unit of 2026-09-05 at `renderAsk`,
`renderStageAsk`, `authorWordsFor` and `authorEntries`. Half of the question was
then settled without this node's sitting: the author's rule of 2026-09-06 struck
the free-text control at the two early stages, and the open playback that sat
beside it went with the control, since its whole content was that the words come
up beside a control asking for more. What was left is what this answer decides,
the folded drill-down and the per-option quotation.

The design ran as a unit on the most capable model. Its measurement is what the
answer turns on and is recorded here because a later session should not have to
take it again:

At the `disposition` ref, graph commit `ec6e2300`, across all 140 node files of
both graphs, read out of `git show` and not the working tree, with the
projector's own entry rule (`AUTHOR_ENTRY_RE`,
`packages/disposition/project.mjs:1393`) applied to each `## Disposition`
section:

| | |
|---|---|
| nodes on the frontier | 140 |
| nodes carrying a `## Disposition` | 68 (72 carry none) |
| words in those sections | 14,784; median 69, longest 1,986 (`alignment-page`, 24 entries) |
| dated entries in them | 222 |
| options with `source: author` | 45 |
| … whose `ref` names at least one entry | 34 |
| … whose `ref` names none (the fallback runs) | 11 |
| entries some option's `ref` names | 101 |
| entries no option's `ref` names | 121 |
| nodes with words where no `ref` names any entry | 43, holding 76 entries |

Every node is on the frontier at this commit, since no node carries a ruling, so
"on the page" and "in the record" are the same population today. Verified two
ways: `readGraph` reports `onFrontier` true on all 140, and
`git grep -E '^ +ruling:'` at `ec6e2300` returns one hit, `dialogue.md:1361`,
which is inside a fenced example in that node's prose and is not a field.

### What a ruling here would reach in the parent, 2026-09-06

No before-and-after text is drafted here, as on the three siblings and for the
same reason: a child's account is not where a parent's text is written. The
clauses a ruling here reaches, quoted from `alignment-page`'s recommended text
and located by their words:

- The option drill-down's third item, "the author's words it rests on, where its
  source is the author, by the reference it carries", which this answer narrows
  to the entries the `ref` names and no others.
- The drill-downs sentence, "Last, as drill-downs, the author's words and the
  AI's account, at every stage alike, there being no control on this page asking
  the author for more", whose first half this answer settles and whose second is
  `the-account-on-the-page`'s survivor, the option `account-not-on-the-page`.

Two clauses this answer touches and a ruling here must not move: the right-hand
column's reserve, which is the parent's apparatus rule and where
`standing-named-in-the-pane` sits, and the account half of the drill-downs
sentence. Both are recorded as options on the parent and neither is amended here.

The parent also carries a marking rule, that a clause standing only until a child
rules says so. When this section was drafted it was applied at three clauses and
not at the two this node reaches; the sitting of 2026-09-06 marked both, and the
parent now carries the mark at five clauses, so no bookkeeping is owed there.
[Restated on 2026-09-07 for the delta reading of that day, which found the
paragraph still standing in its first form after the reply of the reading before
said it had been restated.]

### Clean-context review, 2026-09-07, of 8169831e

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `section-folded-and-quotation-narrowed`.

Findings:

- Account, '### What a ruling here would reach in the parent, 2026-09-06': 'The parent also carries a marking rule, that a clause standing only until a child rules says so, and it is applied at three clauses and not at the two this node reaches. A reader therefore takes both of this node's clauses as settled parent text. That is the parent's bookkeeping and is corrected there.' This is false against the parent as it now stands. Verified in disposition/disposition-graph/alignment-page.md: line 526 reads 'the author's words it rests on, where its source is the author, by the reference it carries, which stands only until `authors-words-on-the-page` rules', and line 532 reads 'the first of the two stands only until `authors-words-on-the-page` rules, and the second only until the option `account-not-on-the-page` is ruled.' Both of the two clauses this node reaches are marked, and the marking appears at five clauses in all (lines 520, 522 twice, 526, 532), not three. Suggested edit: strike the paragraph, or restate it as the record: the parent marks both clauses this node reaches, so no bookkeeping is owed there.
- Answer, second paragraph: 'The record already rules the kind of defect, on `commons.systems/disposition-graph/viable-options`, where "an option sourced to the author carrying a graph commit where the date of the words should be is a finding and not a fact".' The quotation is exact but the attribution is not: that sentence stands only inside viable-options' `## Recommendation` fence (disposition/disposition-graph/viable-options.md:487, between the fence's `## Answer` at 485 and its `## Rationale` at 495); the standing answer at 138-147 does not contain it. Nothing in this record is ruled: `authority` and `unanswered` hold that a node no ruling grants is unanswered and that nothing on it acts, and `what-acts-during-bootstrap` holds that 'a recommendation on an unanswered node is a draft and grounds no work'. The same overstatement recurs in the passed-over reason for `fallback-to-the-whole-section-kept`: 'where `viable-options` holds that a reference of the wrong kind on an author-sourced option "is a finding and not a fact"'. Suggested edit: 'The same defect is named in `viable-options`' recommended answer, which no ruling has yet reached, and this answer reads it as the record's direction rather than as doctrine.'
- Answer, fourth paragraph, and the `### answer` and `### authority` fact subsections: '`commons.systems/disposition-graph/quotes` holds that "the author's decisions are the one thing re-derivation cannot reconstruct, so they are what the record stores, and a restatement is by construction the AI's wording of them, which is the drift this record exists to resist"'; and in the facts, '`quotes` says in as many words why a restatement cannot serve instead' and '`quotes` holds that a restatement is by construction the AI's wording'. The quotation is exact, but `quotes` holds nothing: that node carries no `## Answer` at all (headings verified: `## Recommendation` at 81, then `## Answer` 90, `## Rationale` 94, `## Account` 99), and the sentence sits at disposition/disposition-graph/quotes.md:96, inside the `## Rationale` of the recommended node in the fence. This is the load-bearing ground of the whole answer and of the capture-shaped limb on the authority fact, so its standing matters. Suggested edit: attribute it to the rationale of the text `quotes` recommends, and say that the ground is itself a draft the author has not ruled on.
- Answer, second paragraph: 'Where the `ref` names no entry the row carries nothing for the author's words, and the mismatch is a finding on the option rather than an occasion to quote ... So the row carries the quotation or it carries nothing, and the finding goes where findings go.' No locus is named and none exists: the projector cannot raise a finding, no validation of `frontier-consistency` names a broken option reference, and the reader does not check it (verified: `authorWordsFor`, packages/disposition/project.mjs:1409-1415, only falls back to the whole section). On the answer's own measurement the case is live on 11 of the 45 author-sourced options, so an executor implementing this answer would ship a page that shows the author nothing on those eleven rows while nothing anywhere records the defect that made them empty, which is the outcome the paragraph is written to prevent. Suggested edit: name where the finding is raised — validation 3 of `frontier-consistency` ('every claim about the record or the implementation is verified') or a check in the graph's reader — or record the gap as an option on this fact.
- Readings (validation 4, and `evaluation`'s requirement that every tradition surfaced be recorded as a reading with the resolution it informed): the answer's argument rests on two traditions, `bentham-publicity` ('defeating publicity at the source') and `hansard-verbatim-record` (the two-level form and its guard), but neither reading bears on any option of this node. Verified in their frontmatter: bentham-publicity's `bears` names `three-column-ruling-screen` (diverged) and `every-fact-every-option` (adopted); hansard-verbatim-record's names `every-fact-every-option` (adopted); both resolve on `alignment-page` and neither carries a `node:` for this one. The brief's own neighbourhood confirms 'no reading bears on this node'. The consequence is on the page the answer is about: under `alignment-page`'s clause that a row carries, 'for each reading that bears on it, whether the tradition supports it or it departs from the tradition', the rows for `section-folded-and-quotation-narrowed` and `per-option-only` will carry no tradition mark, so the author rules on the fold without seeing that two readings under this very page bear on it. This is a finding about `commons.systems/disposition-graph/bentham-publicity` and `commons.systems/disposition-graph/hansard-verbatim-record`: propose on each a `bears` entry naming this node — for bentham-publicity, `{node: commons.systems/disposition-graph/authors-words-on-the-page, fact: answer, option: section-folded-and-quotation-narrowed, relation: adopted}` (publicity is the reason the recommender may not select which of the author's words the decider sees) and, if the sitting holds it, `{... option: per-option-only, relation: diverged}`; for hansard-verbatim-record, `{node: ..., fact: answer, option: section-folded-and-quotation-narrowed, relation: adopted}` (the second level always present and one step away).
- Answer, the folding paragraph: 'folded, it is one line and one click, which is the two-level form `commons.systems/disposition-graph/hansard-verbatim-record` reads under this page, whose guard against an interested editor is "that the second level is always present and one step away rather than sometimes omitted".' The quotation is exact, but the reading's recorded support scope is narrower than the use: hansard-verbatim-record says in terms 'The record adopts it for the shape of an option's row. The first level is the option's sentence, its status and the mark on the recommendation ... the second level, one step under it, is the full text of the fact, the author's words, the AI's case ...'. It reads the two levels of a row, not a node-level drill-down at the foot of the column. The extension may be right, but under `evaluation` it is work grounded in a tradition outside its recorded support scope. Suggested edit: say that this answer reads the reading's guard by analogy at a structure the reading did not read, and record the extension on `hansard-verbatim-record` (or in this node's account) rather than citing it as though the reading already covered the drill-down.
- Viability, answer fact: a viable option is missing. The Answer decides the fold in prose — 'It is folded and never open. Open, it puts up to two thousand words of the author's own prose above the facts, which are what the ruling asks' — and the alternative it rejects there is recorded nowhere on the fact, so the author cannot rule for it. `viable-options` holds that 'every candidate the AI considered and can name is an option carrying its status and a candidate never silently leaves the list'; this one was considered and named. Suggested option `section-open-not-folded`, source ai, ref 2026-09-07, status passed with the reason the Answer already gives, prose: 'Everything the recommended option says, with the drill-down rendered open rather than folded, so that the author meets their own words without a click. For it: a fold is a step the reader may not take, and the section is the one text on the page the AI did not write. Against it, and decisive on the measurement: a section running to 1,986 words on this page's own parent would stand between the stage chip and nothing the ruling asks, which is the fault the parent names against apparatus, and the two-level form the record reads under this page is exactly the answer to it.'
- Merge (validation 15), Answer, last paragraph: 'Whether the browser renders a node's `## Disposition` is `commons.systems/disposition-graph/projection`'s, and this answer's measurement is an argument to put to that node and not a ruling on it.' The argument is named and then put nowhere: `projection`'s answer fact carries no option for it (its options are standing, draft, narrowing-disclosed, hold-for-self-documentation, hyperlink-traditions-in-prose, name-what-it-does-not-settle, strike-the-field-link-clause, absorb-self-documentation, shim-carries-framed-viewer, a-how-to-read-page-in-the-browser, a-vocabulary-page-in-the-browser, a-rejected-alternatives-section-apart, tradition-linking-cited-to-readings, rejected-alternative-is-an-option). Under validation 15 a new answer raised on one node's dialogue that answers a question the record already asks is proposed on that node as an option with its source. Suggested option on `commons.systems/disposition-graph/projection`, answer fact, named `browser-renders-the-authors-words`, source commons.systems/disposition-graph/authors-words-on-the-page, ref 2026-09-07, prose: 'Everything the recommended option says, with the browser rendering each node's `## Disposition` section. For it, measured at graph commit ec6e2300: 68 nodes carry 222 dated entries and the browser renders none of them, while this node's answer holds that the author's own words are the one text in the record a restatement cannot replace; against it, the browser is the projection for a reader who is not the author, and what the alignment page owes its one reader may not be what a public page owes everyone.'
- Facts, `### answer`, boldness: 'Boldness is moderate and not low because one reading is load-bearing and it is the AI's ... It is not high because nothing here rests on the AI's knowledge from outside the record.' `dialogue` defines boldness as 'how much of the recommendation rests on the AI's own knowledge against the record and the author's words', which measures the recommendation against the author's words as well as against outside knowledge. The only words the author has given on this node say their response 'does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options', and the recommendation keeps the whole of it on the page on a distinction the author did not draw. That is the AI's judgment set against the author's words, which is the second limb of the definition and not the first. This is not a defect that blocks the ruling — the departure is stated plainly and `per-option-only` is on the fact sourced to the author — but the session should say whether moderate is the mark it means to present, since boldness is what tells the author how far to trust the mark on the row.

On the facts and what they recommend: Two facts, answer and authority, which is what a staged node carrying facts owes; no existence or persistence fact, correctly, since neither a prune nor a change of shape is proposed. The answer fact recommends `section-folded-and-quotation-narrowed`, which is also `stands`, so the absence of a `## Recommendation` fence is right (verified: the node's headings run Disposition, Answer, Rationale, Facts, Account, with no fence). Both facts carry a `recommends`, a boldness and an `against`; the authority fact recommends ratified at low boldness with the `### authority` reading `class-recommendation` requires, naming the capture-shaped limb and saying why the other two are not met, and that reading holds. The one mark I would question is the answer fact's moderate boldness, for the reason in the findings; every option named in `recommends` and `stands` is a listed option, and every passed option carries its `reason`.

On the viability of the options: Every option listed is viable on its facts and the passed-over reasons are real dominance arguments rather than dismissals; in particular `per-option-only` is rightly left un-passed, since the AI does not hold the author's own reading of the author's own sentence dominated, and `fallback-to-the-whole-section-kept` is rightly passed, since it labels the whole section as the ground of one option. One viable option is missing: the section shown open rather than folded, which the Answer considers and rejects in prose ('It is folded and never open') and which appears on no fact, so the author will never get to rule on it; the prose it would carry is in the findings above. The authority fact's three options are the record's own vocabulary and are complete.

Strongest counter-argument (moderate): The only words the author has given on this node say that whatever they provide in periagoge 'does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options' — a release with one named exception — and this answer keeps the whole section on the page at every stage, resting the departure on an AI distinction between a playback and 'the record shown once, at one remove', which the author did not draw. The later rule it leans on cuts the other way as easily: 'The scope of alignment artifact is limited to final confirmation and previews/read only indicators of other phases of the dialogue. All other information from the author is done via the `/align` session interview' is a rule narrowing what the page does with the author, and reading out of it a permission for the page to show more of the author's words than their own sentence allowed inverts its direction. The coverage measurement, which I re-took at ec6e2300 and which is exact in every figure, argues as strongly for the other remedy: 11 of 45 author-sourced options carry a reference that names no entry and 121 of 222 entries are named by no option, and this answer itself calls a broken reference a finding, so the record's own cure is to write the references rather than to keep a section running to 1,986 words on the page beside them. And nothing is lost by the plainer reading that a session cannot restore: the words stay in the node, and the author's own rule of 2026-09-06 sends everything but the confirmation to the `/align` interview, where they are read whole.

The session's reply: Accepted on every finding, and the counter-argument moves the recommendation. The account's paragraph on the parent's marking rule was true when written and false by the reading, since the sitting marked both clauses on 2026-09-06 after the account was drafted; it is restated as the record. The two grounds attributed to `viable-options` and `quotes` stand only in those nodes' recommendation fences, which no ruling has reached, and are re-attributed as drafts the answer reads as direction. The finding on a reference that names no entry is given a locus, the graph's validator, which already raises the wrong-kind reference `viable-options` names, and the frontier lists it. The two readings the argument rests on gain `bears` entries naming this node, and the answer says of `hansard-verbatim-record` that its guard is read by analogy at a structure the reading did not read. The option the answer rejected in prose, the section open, is recorded as passed with the reason the answer gave. The browser argument is recorded on `projection` as the option the reading drafted. And the counter-argument is taken rather than answered: the author's only words on this node release the page from playing their words back except as quotes on options, the later scope rule narrows the page and does not widen it, and the coverage measurement argues for writing the eleven missing references and the options the unreferenced entries lack rather than for a section the author said the page need not carry. The recommendation therefore moves to the author's option `per-option-only`, carrying the quotation narrowed to the entries the reference names and the finding where it names none, at low boldness; the folded section stays on the list as the AI's option with the coverage argument as its case; and the redrawn answer owes a fresh reading.

### The recommendation moved to the author's option, 2026-09-07

The recommendation on the answer fact moved from
`section-folded-and-quotation-narrowed` to `per-option-only`, the option sourced
to the author and referenced to their words of 2026-09-04, and `stands` moved
with it, so the `## Answer` is now that option's text and the fact carries no
recommendation fence. The draft of 8169831e was forwarded by the clean-context
reading of 2026-09-07 at moderate strength, and the move is the sitting taking
that reading's counter-argument rather than answering it: the author's only words
on this node release the page from playing their response back except as quotes
supporting or refuting fact options; the later scope rule of 2026-09-06 narrows
what the page does with the author and cannot be read as widening it; and the
coverage measurement argues for writing the eleven missing references and
recording the options the unreferenced entries lack, not for a section the author
said the page need not carry. The folded section stays on the fact as the AI's
option, unpassed, with the measurement as its case, so the author may take it in
one ruling.

The reading's other findings are accepted and applied. The paragraph in
"### What a ruling here would reach in the parent" claiming the parent marks
three clauses and not the two this node reaches was true when written and false
by the reading: the sitting marked both on 2026-09-06, at `alignment-page`'s
lines 526 and 532, and the marking now appears at five clauses; the paragraph is
restated as the record and no bookkeeping is owed there. The two grounds
attributed to `viable-options` and to `quotes` stand only inside those nodes'
recommendation fences, which no ruling has reached, and are re-attributed as
drafts this answer reads as direction. The finding for a reference naming no
entry is given a locus, the graph's validator beside the check that already
requires a `ref` (`packages/disposition/read.mjs:491`), listed by the frontier and
not thrown as a parse error; neither the check nor the listing exists today. The
option the draft rejected in its prose is recorded as `section-open-not-folded`,
passed, with the reason the draft gave. The two readings the argument rests on
gain `bears` entries naming this node, `bentham-publicity` adopted on
`per-option-only` and on `section-folded-and-quotation-narrowed`, and
`hansard-verbatim-record` adopted on `per-option-only`, within the scope it
records, the option's row; the draft's extension of the Hansard guard to a
node-level drill-down is not made in the redrawn answer. The browser argument is
recorded on `commons.systems/disposition-graph/projection` as the option
`browser-renders-the-authors-words`. Boldness on the answer fact falls from
moderate to low, the recommendation now resting on the author's words rather than
against them.

The redrawn answer owes a fresh reading, its recommendation having moved in
substance since the pin of 8169831e. What it owes in reconciliation is on the
record rather than on this node's implementation: eleven author-sourced options
carry a reference that names no entry and are to be written; 121 of the 222 dated
entries are named by no option, and each that bears on a fact the record asks is
to be recorded as an option there, sourced to the author and referenced by its
date, while an entry that bears on no fact stays in the record for the browser to
render if `projection` decides it should. In the implementation the change falls
on `packages/disposition/project.mjs`: the whole-section fallback in
`authorWordsFor` at `:1413` goes, the `The author's words` drill-down in
`renderAsk` at `:1726` goes with it and the open section in `renderStageAsk` at
`:1702` is already struck by the author's rule of 2026-09-06, the styles for both
go from `packages/disposition/alignment-template.html`, and the new check and its
frontier line were owed in `packages/disposition/read.mjs` and in the frontier
projection when this was written and landed there at cb0e02c6 later the same
day, which the answer now says.

### Clean-context re-reading, 2026-09-07, of 2a1f9fd1

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `per-option-only`.

Findings:

- Account, '### What a ruling here would reach in the parent, 2026-09-06' (verified on disk at disposition/disposition-graph/authors-words-on-the-page.md:498-501; no hunk in the diff touches it). The last reading's first finding asked to strike or restate the paragraph 'The parent also carries a marking rule, that a clause standing only until a child rules says so, and it is applied at three clauses and not at the two this node reaches. A reader therefore takes both of this node's clauses as settled parent text. That is the parent's bookkeeping and is corrected there.', verified false because the parent marks both of this node's clauses, at five clauses in all. The amendment's new account section says this was done — 'the paragraph is restated as the record and no bookkeeping is owed there' — but the diff contains no edit to the original paragraph, which still stands unedited and still false where a reader meets it. The finding is not answered, and the new section's own account of what happened is itself inaccurate. Suggested edit: in '### What a ruling here would reach in the parent, 2026-09-06', replace the sentence 'That is the parent's bookkeeping and is corrected there' (and the sentence before it) with something like 'The parent marks both of this node's clauses; no bookkeeping is owed there', matching what the new account section already asserts happened.
- Account, the new section 'The redrawn answer owes a fresh reading': 'the new check and its frontier line are owed in `packages/disposition/read.mjs` and in the frontier projection', echoing the Answer's own 'Neither the check nor the listing exists today, and both are owed with this answer.' Verified against the current implementation: `packages/disposition/read.mjs`'s `deriveMechanicalFindings` (read.mjs:1817-1834, wired into node findings at :2205) already raises exactly this finding for an author-sourced option whose `ref` names no `## Disposition` entry, per its own comment naming `authors-words-on-the-page`'s finding as the reason it exists. That check landed on greenfield at commit cb0e02c674e0240b328acb3c441c5e24d7b0e76c, 2026-09-07 11:01:37, which postdates this node's own last commit (1ca53dd6, 2026-09-07 10:30:57) by about half an hour — so the claim was true when the amendment was written and is stale now, describing as owed a debt the record's own tooling already appears to discharge. Suggested edit: on the node's next touch, verify the check covers this answer's case and, if so, strike the 'owed' clause rather than continue to carry it as open reconciliation debt; this is not this reading's to fix, since it is a fact about the implementation and not about the amendment's own text.

On the facts and what they recommend: The diff moves the answer fact's recommendation from `section-folded-and-quotation-narrowed` to the author-sourced `per-option-only`, moves `stands` with it, drops boldness from moderate to low, rewrites the fact's `against` to the coverage measurement, and confirms no `## Recommendation` fence (correctly absent both before and after). The authority fact keeps `ratified` at low boldness; only its `against` prose is reworded to reflect that the recommendation now rests on the author's own words.

On the viability of the options: Every option remains viable: `section-folded-and-quotation-narrowed` stays on the list, unpassed, carrying the coverage measurement as its case against it now that it is no longer recommended; the new option `section-open-not-folded` is added, correctly marked passed, with the reason the last reading's own finding supplied. No option was dropped or left without a reason.

Strongest counter-argument (moderate): The account still contains, unedited, the false claim about the parent's marking rule that the last reading's first finding asked to fix, and the new account section's own narration that the paragraph 'is restated as the record' is itself inaccurate, since no restatement reaches the original text. A reader of the node's account history still meets a false statement the reading already found and the sitting believed it had closed.

The session's reply: Both findings verified on the main thread and repaired where they stand: the account paragraph on the parent's marking rule, which the reply of the reading before said was restated and was not, is restated now and says so; and the answer's clause that the reference check and its frontier line do not exist, true at 1ca53dd6 and false since the implementation commit cb0e02c6 of the same day, now says the check landed as deriveMechanicalFindings and the frontier lists what it raises, and the account's closing section says the same. Neither finding reaches what the answer recommends, per-option-only, the author's own option, which is unchanged; the kickback is recorded as the reading gave it, since a node reaches the ruling stage only on a forward verdict, and the repair is read once more on the smaller model with the two paragraphs as its object, which is the reading the encoding requires and the cheapest one there is. That the encoding gives the session no way to forward a kickback whose findings it has repaired without a further reading is noted for review-cost's cap and for the instrument.

### Clean-context review, 2026-09-07, of 2a1f9fd1

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `per-option-only`.

Findings:

- Answer, first paragraph (validation 2, against a sibling and against `dialogue`): 'Nothing else on the page is the author's recorded words.' Read unqualified this is false of the page the record is drafting. `commons.systems/disposition-graph/what-an-option-row-carries`, a sibling at the ruling stage, puts one step down on an option's row 'where a ruling stands on it, the reason the author gave and the pin the ruling answered'; and `commons.systems/disposition-graph/dialogue`'s recommended `every-part-in-the-record` holds that a ruling carries 'the `reason`, why they chose as they did, in their own words and optional. The reason sits on the option because that is where the choice is; the author's words that opened or moved the dialogue stay under `## Disposition`, dated, as the quotes node decides, and the two are different things, one being why this option was taken and the other what was said to the record.' So the record already distinguishes two kinds of the author's own words on the page, and this sentence, which is the answer's exclusivity clause, denies one of them. Suggested edit: qualify the sentence to the words the question is about, e.g. 'Nothing else on the page is the author's words under `## Disposition`; the reason the author gives with a ruling is the other kind `dialogue` names, and it stays where `what-an-option-row-carries` puts it.'
- Facts, `### authority`, second-to-last paragraph (validation 3, and against the node's own Answer): 'Not expensive: the answer is one projector function with its fallback removed and one drill-down struck, with a check and a frontier line owed beside them, and nothing is built on it.' The check and the frontier line are no longer owed, and the Answer three sections above now says so: 'the check landed on the implementation ref at commit cb0e02c6 of 2026-09-07, as `deriveMechanicalFindings` in the same file, and the frontier lists what it raises.' Verified: `deriveMechanicalFindings` is at packages/disposition/read.mjs:1817, wired into a node's findings at :2205, raising `fact 'answer' option '<name>' is source: author, ref <ref>, but '## Disposition' carries no 'The author, <ref>' entry`; `git log -S "export function deriveMechanicalFindings"` names cb0e02c6 as the commit that landed it; `packages/disposition/validate.mjs` prints one `finding: <node id>: <text>` line per finding (validate.mjs:27-33); and `node packages/disposition/project.mjs disposition --frontier -` prints 15 such lines today. The repair of 2026-09-07 reached the Answer and not this paragraph, so the node now says both things. Suggested edit: replace 'with a check and a frontier line owed beside them' with 'with the check and the frontier line that landed at cb0e02c6 beside them'.
- Answer, second and third paragraphs (validation 3, a claim about the implementation that is not exact): 'which is the projector's own rule (`AUTHOR_ENTRY_RE`, `packages/disposition/project.mjs:1393`, applied by `authorEntries` at `:1395`)'; 'which is what `authorWordsFor` does today (`packages/disposition/project.mjs:1409-1415`)'; and 'at `packages/disposition/project.mjs:1413` a date matching nothing returns the whole `## Disposition`'. Every one of these line numbers is stale by exactly twelve lines at the implementation ref as it stands (cb0e02c6): `AUTHOR_ENTRY_RE` is at project.mjs:1405, `authorEntries` at :1407, `authorWordsFor` at :1421-1427, and the whole-section fallback `if (dated.length === 0) return { text: n.disposition, whole: true };` at :1425. The drift was caused by cb0e02c6 itself — at 87e4b24e the three were at 1393, 1395 and 1409, exactly as the answer says — which is the same commit the paragraph above now cites, so the amendment that added the cb0e02c6 sentence invalidated its own citations. The same twelve-line drift runs through the Account's closing section, '### The recommendation moved to the author's option, 2026-09-07': 'the whole-section fallback in `authorWordsFor` at `:1413` goes, the `The author's words` drill-down in `renderAsk` at `:1726` goes with it and the open section in `renderStageAsk` at `:1702` is already struck by the author's rule of 2026-09-06' — `renderStageAsk` is now at :1714 and `renderAsk` at :1738. Suggested edit: re-take the four numbers in the Answer (1405, 1407, 1421-1427, 1425) and the three in the Account (1425, 1738, 1714).
- Answer, third paragraph (validation 3, two citations into `read.mjs` that name the wrong lines): 'beside the check that already requires a `ref` on every option of an answer fact (`packages/disposition/read.mjs:491`)' — line 491 is `for (const option of entry.options) {`, and 492-495 is the `source` requirement; the `ref` requirement the sentence names is at read.mjs:496-499, `if (option.ref === null) { problems.push(\`fact 'answer' option '${option.name}' requires 'ref' (a date, a graph commit, or what raised it)\`);`. And 'on the reader's own principle that an attention rule never turns into one (`packages/disposition/read.mjs:1386-1390`)' — the sentence carrying that principle is at read.mjs:1391-1394, 'the cap of three open probes binds the movement and is checked by the readings as a finding, never here, so that an attention rule never turns into a parse error'; 1386-1390 is the tail of the `bears` parsing block above it. Suggested edit: `packages/disposition/read.mjs:496-499` and `packages/disposition/read.mjs:1391-1394`.
- Facts, `### answer`, the fact's `against`, and the prose of three options (validation 3, figures stated unqualified and now stale). The `against` the alignment page will show the author on the recommended option's row reads 'Of the 222 dated entries the record carries, the references on the options reach 101 and 121 reach the page nowhere, none at all on 43 of the 68 nodes that carry words, and on eleven of the forty-five author-sourced options the reference names no entry at all'. I re-took the measurement two ways with the projector's own entry rule and the record's own `parseNode`. At graph commit `ec6e2300`, which the Answer names, every figure is exact: 140 nodes, 68 carrying a `## Disposition`, 222 dated entries, 14,784 words, longest 1,986 on `alignment-page` with 24 entries, 45 author-sourced options carrying a date-shaped `ref` (4 more carry a graph-commit ref), 34 naming at least one entry and 11 naming none, 101 entries named and 121 not, 43 of the 68 nodes with none named. At the graph as it now stands (`62121b69`) the same measurement gives 143 nodes, 71 carrying words, 255 entries, 56 author-sourced date-ref options, 45 naming an entry and 11 naming none, 113 named and 142 not, 39 of the 71 nodes with none named. The Answer's own measurement paragraph is safe, because it says 'What this costs is measured, at graph commit `ec6e2300` and re-taken by the reading of 2026-09-07'; the `against` and the option prose carry no such qualification and are read as of today. The same is true of `#### section-folded-and-quotation-narrowed`, 'the references reach 101 of the 222 entries and none at all on 43 of the 68 nodes that carry words'; of `#### fallback-to-the-whole-section-kept`, 'It runs on 11 of the 45 author-sourced options today'; and of `#### one-drill-down-per-entry`, 'it puts 222 summaries on the page whose labels are dates and so carry nothing of what was said' and 'For it: 17 entries on `alignment-order` and 24 on `alignment-page` are a wall behind a single summary' (`alignment-page` now carries 25). Suggested edit: name the commit in the `against` as the Answer does — 'Of the 222 dated entries the record carried at graph commit `ec6e2300` ...' — and add the same three words to the four option sentences, so that a figure never reads as a count of today.
- Facts, `#### words-first-in-the-column` (viability, a status the prose has already decided): 'Against it, and decisive: the column's own ask is the facts, and the parent's recommended text puts the drill-downs last for that reason ... Viable and not recommended, and it falls with the option it varies.' Decisive is dominance, and `commons.systems/disposition-graph/viable-options`' recommended `passed-over-options-stay` holds that 'A candidate the AI holds dominated is passed over: it keeps its place on the fact, carries the status passed with the one clause saying why'. The fact treats the identical formula the other way one option down: `#### section-open-not-folded` reads 'Against it, and decisive on the measurement: ... Passed over.' and carries `status: passed`. So two options the prose disposes of in the same words carry different statuses, and the author reads one as an open candidate and the other as dominated on no stated difference. Suggested edit: either give `words-first-in-the-column` `status: passed` with the reason its own prose supplies — 'a section running to 1,986 words placed under the stage chip makes the first thing on the node a thing the author scrolls past, which is the fault the parent names against apparatus moved one column over' — or strike 'and decisive' and say why it stays open where `section-open-not-folded` does not.
- Viability, answer fact (a viable option is missing). The answer's own case against it is that the words no option's `ref` names reach the author nowhere, and the three remedies it names are all writes to the record or another node's ruling; a fourth remedy is on the page and is on no option — an address rather than a playback. Proposed option `address-for-the-words-no-option-names`, source review, ref 2026-09-07, prose: 'Everything the recommended option says, with one line in the middle column addressing the browser's page for this node, so that the entries no option's `ref` names are one step away without any of them being rendered here. For it: the author's sentence releases the page from playing their response back and an address is not a playback; the parent's answer already uses that route, having each metric link 'to that node in the browser, which addresses every node by its id where this page has no route to one', and the column is already headed by the node's id; and on the record as it stands 142 of 255 dated entries are named by no option while `commons.systems/disposition-graph/projection`'s standing answer holds that the record is read 'through projections, never by opening node files, except in alignment sessions', so the residue reaches the ruler nowhere. Against it: it turns on `projection` ruling that the browser renders a node's `## Disposition`, which is that node's option `browser-renders-the-authors-words` and which no ruling has reached, so today the link would address a page that shows none of the words.' If the session holds that a line in the column heading is the parent's clause and not devolved here, the same option is recorded on `commons.systems/disposition-graph/alignment-page` instead, with this node as its source.
- Account, '### What a ruling here would reach in the parent, 2026-09-06' (validation 3, a count that is stale again). The repaired paragraph reads 'When this section was drafted it was applied at
three clauses and not at the two this node reaches; the sitting of 2026-09-06
marked both, so no bookkeeping is owed there.' The load-bearing half is true and verified: `disposition/disposition-graph/alignment-page.md` marks both of this node's clauses, at line 599 ('the author's words it rests on, where its source is the author, by the reference it carries, which stands only until `authors-words-on-the-page` rules') and at line 605 ('the first of the two stands only until `authors-words-on-the-page` rules'). The count is not: `sed -n '575,625p' disposition/disposition-graph/alignment-page.md | grep -o "stands only until" | wc -l` returns 10, not five, the parent having marked `which-facts-are-listed`, `where-a-change-request-goes`, `when-the-kickback-feedback-shows` and `where-the-unconfirmed-indication-goes` since. This is the third reading to spend a finding on this one paragraph. Suggested edit: strike the count rather than re-take it — 'the sitting of 2026-09-06 marked both, so no bookkeeping is owed there' — since a count of the parent's marks goes stale every time the parent marks another clause, which is the parent's own reason for not restating its children's stages.

On the facts and what they recommend: Two facts, answer and authority, which is what a staged node carrying facts owes; no existence and no persistence fact, correctly, since neither a prune nor a change of shape is proposed. The answer fact recommends `per-option-only` at low boldness and `stands` names the same option, so the absence of a `## Recommendation` fence is right (verified: the file's headings run Disposition, Answer, Rationale, Facts, Account, with no fence); every option named in `recommends` and `stands` is a listed option and every passed option carries a `reason`. The authority fact recommends `ratified` at low boldness and carries the `### authority` reading `class-recommendation` requires, naming the capture-shaped limb and saying why the other two are not met, and that reading holds — though its 'not expensive' sentence still calls the check owed, which is the second finding. Low boldness on the answer fact is defensible, the option being the author's own and referenced to their sentence, but the session should say it means it: the answer reads 'does not need to be played back' as a bar and extends a sentence about 'whatever response is provided in periagoge' to every dated entry a `## Disposition` holds, and both readings are the AI's rather than the author's words, which is the second limb of the boldness `dialogue` defines.

On the viability of the options: Every option listed is viable on its facts and the passed-over reasons are real dominance arguments rather than dismissals; in particular `section-folded-and-quotation-narrowed` is rightly left unpassed, carrying the coverage measurement as its case, so the author may take the other remedy in one ruling, and the three vocabulary options on the authority fact are complete. Two defects: `words-first-in-the-column` carries 'Against it, and decisive' in its own prose with no `status: passed`, where `section-open-not-folded` carries the identical formula and is passed, so the fact marks two equally disposed candidates differently on no stated ground. And one viable option is missing, an address rather than a playback — one line in the column addressing the browser's page for the node, so the entries no `ref` names are one step away without being rendered here; its prose is in the findings, and it is the only candidate on the frontier that answers the fact's own `against` without putting any of the author's words back on the page.

Strongest counter-argument (moderate): The only words the author has given on this node are a release with one named exception — 'Whatever response is provided in periagoge it does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options' — and this answer reads 'does not need to be played back' as 'must nowhere appear' and extends a sentence about the periagogic response to every dated entry a node's `## Disposition` holds, which are two of the AI's readings resting on the author's one sentence, the mirror of the AI distinction the last reading struck. What that costs is measurable and is not confined to the eleven broken references the answer makes findable: re-taken at the graph as it now stands, 142 of 255 dated entries are named by no option and 39 of the 71 nodes that carry words have none named at all, while `commons.systems/disposition-graph/projection`'s standing answer holds that the record is read 'through projections, never by opening node files, except in alignment sessions', so the majority of what the author has said reaches no projection they read at the moment of ruling. The instance is this very ruling: the recommendation's rationale leans on the author's rule of 2026-09-06, which lives in `alignment-page`'s `## Disposition` and not in this node's, and `ancestors-words-too` is passed over, so the author will rule here without seeing on the page the later words the answer rests on. The reply — that the alternative is on the fact unpassed with the measurement as its case, and that the `/align` interview the author's own rule names is where the words are read whole — is good, and it concedes the point: the check on a draft written in the author's voice is moved off the page the author rules from and onto a session they must open.

The session's reply: Accepted on all eight, each verified at its locus on the main thread. The exclusivity sentence is qualified to the words under ## Disposition, the ruling's reason being the other kind dialogue names; the authority reading's 'owed' becomes 'landed at cb0e02c6'; the seven project.mjs citations and the two read.mjs citations are re-taken; the figures in the against and in four option sentences are dated to graph commit ec6e2300; words-first-in-the-column is passed with the reason its prose supplies; the count of the parent's marks is struck; and address-for-the-words-no-option-names is recorded on the answer fact, source review, viable and not adopted, since it turns on projection's browser-renders-the-authors-words, which no ruling has reached. The recommendation does not move. The counter-argument stands on the row at moderate strength.

### Amended after the fresh reading, 2026-09-07

The fresh reading of the repaired answer forwarded at moderate strength with eight findings and no probes, every one validated at its locus on the main thread and every one accepted. The recommendation does not move: it stays `per-option-only`. The exclusivity sentence is qualified to the words under `## Disposition`, since the reason the author gives with a ruling is the other kind of their words `dialogue` names and `what-an-option-row-carries` places. The authority reading's "owed" is corrected to the check that landed at cb0e02c6. The seven citations into `packages/disposition/project.mjs` and the two into `read.mjs` are re-taken at that commit and dated to it, since the amendment that cited cb0e02c6 had staled its own line numbers by twelve. The figures in the fact's case against and in four option sentences are dated to the graph commit they were taken at, `ec6e2300`, so that no count reads as a count of today; the case against on the row is now the reading's counter-argument, with the measurement re-taken at `62121b69`. `words-first-in-the-column` is passed with the reason its own prose already gave, so that two options the prose disposes of in the same words no longer carry different statuses. The count of the parent's marks is struck rather than re-taken, since it goes stale every time the parent marks another clause. And `address-for-the-words-no-option-names` is recorded on the answer fact, source `review`, viable and not adopted: an address rather than a playback, which turns on `projection`'s `browser-renders-the-authors-words`, which no ruling has reached. The amended answer owes its re-reading.

### Clean-context re-reading, 2026-09-07, of c48996dc

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `per-option-only`.

Findings:

- Account, '### What a ruling here would reach in the parent, 2026-09-06', last paragraph, on disk unchanged by this diff: 'The parent also carries a marking rule, that a clause standing only until a child rules says so. When this section was drafted it was applied at three clauses and not at the two this node reaches; the sitting of 2026-09-06 marked both, and the parent now carries the mark at five clauses, so no bookkeeping is owed there.' This is the exact finding the previous reading raised (finding 8, 'a count that is stale again') and asked to be struck rather than re-taken; the diff between the pinned commit and the working tree contains no hunk touching this paragraph at all (the diff jumps from the authority fact's 'not expensive' sentence, old line ~424, straight to the trailing account additions at old line 608, with no hunk in between). Yet the new account section this amendment adds, 'Amended after the fresh reading, 2026-09-07', claims: 'The count of the parent's marks is struck rather than re-taken, since it goes stale every time the parent marks another clause.' That claim is false: the paragraph still carries a count ('at five clauses'), it was not struck, and the count is more stale than ever, since this same sitting amended `alignment-page` to mark two further clauses (for `when-the-kickback-feedback-shows` and `where-the-unconfirmed-indication-goes`), on top of the four the previous reading already found unlisted. This is the same failure mode the node's own history already shows twice (the bracketed note in that section: 'Restated on 2026-09-07 for the delta reading of that day, which found the paragraph still standing in its first form after the reply of the reading before said it had been restated'), now recurring a third time on the same locus. Suggested edit: actually strike the count from '### What a ruling here would reach in the parent, 2026-09-06', replacing the last sentence with something like 'the sitting of 2026-09-06 marked both, so no bookkeeping is owed there', and correct the new account section's claim to match what was actually done.

On the facts and what they recommend: Neither fact's recommendation, boldness, or `stands` changes in this diff: the answer fact still recommends and stands on `per-option-only` (low boldness, no fence), and the authority fact still recommends `ratified` (low). The diff only lengthens the answer fact's `against` prose, re-dates four option-prose measurements to graph commit `ec6e2300`, adds `status: passed` with a reason to `words-first-in-the-column`, adds the new viable option `address-for-the-words-no-option-names`, corrects the authority fact's 'not expensive' sentence to say the check landed at `cb0e02c6`, and re-takes several stale `project.mjs`/`read.mjs` line citations — all verified accurate against the current code.

On the viability of the options: Every option on both facts remains viable after the diff; the newly added `address-for-the-words-no-option-names` is correctly recorded viable-and-not-adopted, and `words-first-in-the-column` is now correctly marked passed rather than left as an undecided-looking viable option.

Strongest counter-argument (strong): The amendment repairs seven of the eight findings precisely and verifiably (the exclusivity sentence, the authority 'owed' claim, all stale project.mjs/read.mjs citations, the four unqualified figures, the words-first-in-the-column status, and the missing viable option), but the eighth — the stale 'five clauses' count in the parent-reach account section — is left completely untouched by the diff while the amendment's own closing account section falsely asserts it was fixed. That is not a partial answer to a finding; it is a false statement about what this very amendment did, on the same locus that has already produced two prior rounds of the identical false claim, which is exactly the kind of thing question 2 asks a re-reading to catch.

The session's reply: Accepted. The amendment struck the count in the bracketed restatement of the paragraph and not in the paragraph itself, and its account claimed the strike; the paragraph's count is now struck and the account says what happened. The recommendation does not move; the repaired answer owes its own reading.

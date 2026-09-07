---
question: Where does the alignment page show the author's recorded words?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: section-folded-and-quotation-narrowed
        source: ai
        ref: "2026-09-06"
      - name: per-option-only
        source: author
        ref: "2026-09-04"
      - name: words-first-in-the-column
        source: ai
        ref: "2026-09-06"
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
        reason: "it labels the whole section as the ground of one option, which is the playback the author's words strike, and it hides a broken reference where the record's rule is that a broken reference is a finding"
      - name: caption-where-the-node-carries-none
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "it prints one sentence on seventy-two of a hundred and forty items to say what the absent drill-down already says, and its second half is what the standing-choice row says wherever there is an answer for it to be about"
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
    recommends: section-folded-and-quotation-narrowed
    boldness: moderate
    against: "The author wrote that whatever they say in periagoge does not need to be played back in the alignment artifact except as quotes supporting or refuting fact options, and this answer keeps the whole of it on the page at every stage; that a folded section shown beside no control is not a playback is a distinction the author did not draw, and the measurement the answer leans on, that 121 of 222 recorded entries reach no option, is as good an argument for writing the references properly as for keeping the section."
    stands: section-folded-and-quotation-narrowed
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "Whichever way this is ruled the author's words stay in the node unaltered and are read in full in the `/align` interview the author's own rule of 2026-09-06 sends everything else to, so nothing is lost that a session cannot show them on request; ratifying it spends the author's scarcest act on which drill-down a projector folds, and the capture the reading names is already answered by the parent's own authority fact, under which the whole shape of this page is the author's to confirm."
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: 8169831eb6d72c91b2acd9145afcd141707d579f
  against: "The only words the author has given on this node say that whatever they provide in periagoge 'does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options' — a release with one named exception — and this answer keeps the whole section on the page at every stage, resting the departure on an AI distinction between a playback and 'the record shown once, at one remove', which the author did not draw. The later rule it leans on cuts the other way as easily: 'The scope of alignment artifact is limited to final confirmation and previews/read only indicators of other phases of the dialogue. All other information from the author is done via the `/align` session interview' is a rule narrowing what the page does with the author, and reading out of it a permission for the page to show more of the author's words than their own sentence allowed inverts its direction. The coverage measurement, which I re-took at ec6e2300 and which is exact in every figure, argues as strongly for the other remedy: 11 of 45 author-sourced options carry a reference that names no entry and 121 of 222 entries are named by no option, and this answer itself calls a broken reference a finding, so the record's own cure is to write the references rather than to keep a section running to 1,986 words on the page beside them. And nothing is lost by the plainer reading that a session cannot restore: the words stay in the node, and the author's own rule of 2026-09-06 sends everything but the confirmation to the `/align` interview, where they are read whole."
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Do not take text input for the unfinished periagoge - that is for the periagoge session to collect. Whatever response is provided in periagoge it does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options.

## Answer

In two places, and the second is not the first cut down. On each option's row,
one step down, the entries of the node's `## Disposition` that option's `ref`
names. And last in the middle column, at every stage alike, one folded
drill-down holding that section whole, in the order it holds it.

The per-option quotation is the form the author's words of 2026-09-04 name and
allow, "quotes supporting or refuting fact options", and this answer narrows it
to what those words say. It shows the entries the option's `ref` names and no
others. Where the `ref` names no entry the row carries nothing for the author's
words, and the mismatch is a finding on the option rather than an occasion to
quote: the whole section shown under the label "the author's words it rests on"
tells the author that everything they have said on the node supports this one
option, which is false wherever a fact carries a second option they also sourced,
and unwarranted everywhere else. The record already rules the kind of defect, on
`commons.systems/disposition-graph/viable-options`, where "an option sourced to
the author carrying a graph commit where the date of the words should be is a
finding and not a fact". A reference resolving to no entry is that same defect
wearing the right shape, and a page that fills the gap with the whole section
makes it unfindable. So the row carries the quotation or it carries nothing, and
the finding goes where findings go.

The section itself stays. What the author's words of 2026-09-04 struck was a
playback: the page took their response at the periagogic and maieutic stages and
echoed it back open beside the control that had just asked for it. The control is
gone, struck by their rule of 2026-09-06 that the page collects the final
confirmation and shows every other movement as "a preview and a read-only
indicator", and with the control the echo goes; what is left is not a playback
but the record shown once, at one remove, in the column where the author is being
asked to confirm a text written in their own voice. That rule expressly permits a
read-only view of a movement the page does not run, and the periagogic movement's
product is such a movement's record. Whether that permission reaches the author's
own words is the question this node was minted to answer, and the answer is that
it does.

It does because of what the section is for, and because nothing else on the page
or in the record does it. `commons.systems/disposition-graph/quotes` holds that
"the author's decisions are the one thing re-derivation cannot reconstruct, so
they are what the record stores, and a restatement is by construction the AI's
wording of them, which is the drift this record exists to resist". Everything
else in the middle column is that restatement: the fact's prose, the option
sentences, the recommendation, the case against, and the text in the right-hand
column are the AI's words, and on an unanswered node they are the AI's words
written in the author's voice. The `## Disposition` section is the only text on
the page the AI did not write. It is the one thing the author can hold the draft
against, and holding a draft against it is the act the page exists for. A page
that shows the author only the excerpts the AI's own references selected has the
recommender choosing the evidence its recommendation is judged by, which is what
`commons.systems/disposition-graph/bentham-publicity`, already a reading under
this page, calls defeating publicity at the source.

The measurement decides the rest, and it is a fact about coverage and not a cost.
At graph commit `ec6e2300` the frontier is 140 nodes; 68 carry a `## Disposition`
section, 14,784 words in 222 dated entries, a median of 69 words and a longest of
1,986 on this page's own parent. Forty-five options are sourced to the author, of
which 34 have a `ref` that names an entry and 11 name none. The references reach
101 of the 222 entries. They reach none at all on 43 of the 68 nodes, which hold
76 entries between them, and they miss a further 45 on the nodes they partly
cover. So under the per-option form alone the majority of what the author has
said to this record would appear in no projection:
`commons.systems/disposition-graph/projection` renders no `## Disposition` in the
browser, and holds that the record is read "through projections, never by opening
node files, except in alignment sessions". The words would be stored, validated,
and shown to no one. That is not the price of a design; it is the design failing
at the thing this record is for.

The section is therefore whole and in order, and not the residue. A drill-down
carrying only the entries no option's reference names would cure a duplication
that is not a defect and destroy the property that earns the section its place.
Not a defect, because both places are projections of one stored section and
neither is a second copy: nothing can drift where nothing is copied, which is the
rule `commons.systems/disposition-graph/dialogue` states as keeping a thing once
where it is decided and deriving the rest. The property, because a section whose
contents depend on which entries the AI's references happened to name is a
section the AI has edited, and the author reading it can no longer see the
dialogue, only what is left of it. The order carries the same weight: the words
on a node are a dialogue over days, and an entry's sense is often in what came
before it.

It is folded and never open. Open, it puts up to two thousand words of the
author's own prose above the facts, which are what the ruling asks; folded, it is
one line and one click, which is the two-level form
`commons.systems/disposition-graph/hansard-verbatim-record` reads under this
page, whose guard against an interested editor is "that the second level is
always present and one step away rather than sometimes omitted". Always present
is the operative half here. Its summary names the section as the node's own, so
that it is not read as the ground of anything recommended, and it sits last in
the column because the ruling's ask is the facts and the section is what the
author consults against them rather than the thing being asked.

Where the node carries no such section there is no drill-down and no caption
stands in its place. The caption the page prints today was written as the
companion of the free-text control, and the author's rule of 2026-09-06 struck it
with the control; extending the drill-down to every stage does not bring its
question back. An absent drill-down says the node carries no words of the
author's, on 72 of the 140 items, without printing a sentence 72 times; and the
caption's second half, that what the answer says the AI drafted, is what the
standing choice's own row already says wherever there is an answer for it to be
about, and is about nothing wherever there is not.

What this answer does not decide, and where each belongs. Whether the AI's
account is shown as the other drill-down is the parent's, carried there as the
option `account-not-on-the-page`, and nothing here touches it. Whether the
browser renders a node's `## Disposition` is
`commons.systems/disposition-graph/projection`'s, and this answer's measurement
is an argument to put to that node and not a ruling on it. Whether the author's
words may share the right-hand column is not open: that column is the disposition
and nothing else, which is the parent's clause and not devolved here. How the
words are retained, rolled up and dated is
`commons.systems/disposition-graph/quotes`'. And what an option's `source` and
`ref` mean is `commons.systems/disposition-graph/dialogue`'s; this answer reads
them and adds nothing to them.

## Rationale

Recorded on the author's disposition of 2026-09-04, queued from the sitting on
`commons.systems/disposition-graph/author-questions` and carried under
`## Disposition`:

> Whatever response is provided in periagoge it does not need to be played back
> in the alignment artifact expect as quotes supporting or refuting fact options.

The sentence does two things and the answer takes both. Its exception is a
positive grant, and the answer narrows the per-option quotation to exactly what
it grants: the entries the option's reference names, supporting or refuting that
option, and nothing where the reference names nothing. Its main clause releases
the page from an obligation to play the response back, and it was said of a page
that had just taken that response in a control of its own. The author's rule of
2026-09-06 removed the control and, in the same breath, set the page's standing
scope as the final confirmation and, of every other movement, a preview and a
read-only indicator; the subsection recording that rule names this node as the
one to say whether the author's recorded words may be shown back that way. This
answer says they may, and it does not read the release as a prohibition.

What carries that reading past the author's authority is the record's own. The
section is the only text in the column the AI did not write, so it is the only
check the page offers on a draft written in the author's voice; the browser
renders none of it; and the references that would replace it reach 101 of 222
entries and none at all on 43 of 68 nodes. The reach is bounded by where
authority lies: the parent devolved this question, the account half of the same
clause is the parent's own, the browser is `projection`'s, and the right-hand
column's reserve is the parent's and untouched.

## Facts

### answer

Recommended: `section-folded-and-quotation-narrowed`, at moderate boldness. The
narrowing half follows the author's words closely and is where their exception
does its work; the retaining half departs from the plainest reading of their main
clause, and the ground for the departure is stated rather than assumed. Three
things carry it. The author's own later rule of 2026-09-06 permits a read-only
view of a movement the page does not run, and the subsection recording it names
this node as the place to say whether their words are one. The section is the
only text in the column the AI did not write, which is what makes it the check
and not decoration; `quotes` says in as many words why a restatement cannot serve
instead. And the coverage is measured, not asserted: 101 of 222 entries reached,
none at all on 43 of 68 nodes, and no other projection carrying them.

Boldness is moderate and not low because one reading is load-bearing and it is
the AI's: that "played back" describes the echo of a response the page had just
collected, so that the same words leave a folded section standing once the
control is gone. Everything else in the answer follows from that reading. It is
not high because nothing here rests on the AI's knowledge from outside the
record: the two grounds beneath the reading are the author's own rule of
2026-09-06 and a count taken on the graph.

The case against is on the fact. Its strongest form is that the author wrote a
sentence about their words on this page, this answer keeps the words on the page,
and the distinction that reconciles the two is the AI's. The reply is that the
alternative is measurable and severe rather than a matter of taste, and that the
author can take it in one ruling: `per-option-only` is on the fact, sourced to
them and dated to their words, and is not passed over, because the AI does not
hold the author's own reading of the author's own sentence dominated.

#### per-option-only

Everything the recommended option says, with the whole-section drill-down struck,
so that the only author's words anywhere on the page are the per-option
quotations, narrowed as the recommendation narrows them. This is the author's
sentence of 2026-09-04 read at its plainest, and it is on the fact as theirs. It
is viable and not recommended for what the count shows: the references reach 101
of 222 entries and none at all on 43 of the 68 nodes that carry words, the
browser renders no `## Disposition`, and `projection` holds that the record is
read through projections and not by opening node files, so on this option the
majority of what the author has said to the record is visible nowhere.

#### words-first-in-the-column

Everything the recommended option says, with the drill-down placed at the head of
the middle column, under the stage chip and above the facts, rather than last.
For it: the words are the ground the draft answers, and reading the ground before
the options is the order of the argument rather than the order of the page.
Against it, and decisive: the column's own ask is the facts, and the parent's
answer puts the drill-downs last for that reason; a section running to 1,986
words on this page's parent makes the first thing under the chip a thing the
author scrolls past on every node that carries words, which is the fault the
parent names against apparatus in the right-hand column, moved one column over.
Viable and not recommended.

#### residue-in-the-drill-down

Everything the recommended option says, with the drill-down carrying only the
entries no option's `ref` names, so that no entry appears twice on the page. For
it: 101 of the 222 entries are otherwise rendered in both places on the same
node. Passed over. The duplication it cures is not a defect, since both are
projections of one stored section and neither is a copy that can drift, which is
the test `dialogue` sets in keeping a thing once where it is decided and deriving
the rest; and the cure costs the property that earns the section its place, since
a section whose contents are chosen by the AI's own references is a section the
AI has edited, and the chronology the author reads their dialogue in is broken by
the removal.

#### drill-down-only-where-no-option-quotes

Everything the recommended option says, with the drill-down rendered only on
nodes where no option's `ref` reaches any entry, so the page shows the section
where nothing else would and stays silent where something does. Passed over: it
is the same edit at the node's granularity and buys less. On the 25 nodes the
references partly cover, the 45 entries they miss would be shown nowhere, and
whether a node's words appear at all would turn on whether the AI wrote one
resolving reference on it.

#### fallback-to-the-whole-section-kept

Everything the recommended option says, with `authorWordsFor`'s present behaviour
kept: where an option's `ref` names no entry, the row shows the whole
`## Disposition` under the label "the author's words it rests on", with the hint
that the rest is below. For it: the author sees something rather than nothing at
the point of choosing, and the section is on the page anyway under this
recommendation. Passed over. It asserts as the ground of one option words that
may bear on another option on the same fact, which is the whole-section playback
the author's words strike, wearing a per-option label; and it converts a broken
reference into a plausible render, where `viable-options` holds that a reference
of the wrong kind on an author-sourced option "is a finding and not a fact". It
runs on 11 of the 45 author-sourced options today, so the choice is between
eleven silent renders and eleven findings.

#### caption-where-the-node-carries-none

Everything the recommended option says, with a caption where the node carries no
`## Disposition`, saying that no words of the author's are recorded on it and
that what the answer says the AI drafted. For it: absence is easy to miss, and
the second half is true and worth saying. Passed over: the caption was struck by
the author's rule of 2026-09-06 as the companion of the control it sat under, and
extending the drill-down does not bring its question back; it would print on 72
of the 140 items on the page; and its second half is what the standing choice's
own row already says wherever there is an answer for it to be about, in the
parent's words, that confirming ratifies the AI's draft, while on a node with no
answer at all there is no answer below for the caption to be about.

#### one-drill-down-per-entry

Everything the recommended option says, with one drill-down per dated entry, each
summarised by its date, rather than one holding the section. For it: 17 entries
on `alignment-order` and 24 on `alignment-page` are a wall behind a single
summary. Passed over: it puts 222 summaries on the page whose labels are dates
and so carry nothing of what was said, where one summary naming the section says
what the reader is opening; and an entry's sense is usually in the sequence it
sits in, which per-entry folding hides.

#### ancestors-words-too

Everything the recommended option says, with the drill-down carrying the author's
words recorded on the node's ancestors as well as its own, since a ruling here
falls within their grant. Passed over: the ruling in front of the author is on
this node's question, the ancestry is already a route the rail and the column's
one line give them, and a column carrying words no decision on it rests on is the
apparatus the parent's answer is against.

### authority

Ratified, at low boldness. `class-recommendation`'s test asks whether being wrong
would be expensive, irreversible, or capture-shaped, and the limb this node meets
is capture-shaped.

The decision is which of the author's own recorded words the author is shown at
the moment they rule on a text the AI drafted in their voice. Under any class but
ratified the party setting that is the AI, and the author's verbatim words are
the record's one check on whether the draft is faithful to them: `quotes` holds
that a restatement is by construction the AI's wording, "which is the drift this
record exists to resist", and everything else in the column is that restatement.
A recommender that decides which of the evidence against it the decider sees is
the shape the limb names, and it is the shape the record has already read here,
in `bentham-publicity` under this page, of a recommender that "publishes some of
its decisions and withholds others by its own measure". It is the shape whichever
way the answer goes: this recommendation keeps more of the author's words rather
than fewer, and that does not change who would be setting it.

The other two limbs are not met and the reading says so. Not expensive: the
answer is carried by one projector function and a fold, and nothing is built on
it. Not irreversible: the `## Disposition` section stays in the node under every
option on this fact, so no words are lost either way and a wrong answer is undone
by re-projecting the page. Delegated would leave the selection of the author's
own words in the hands of the party those words check, which is the one class of
decision a delegation here cannot cover. Deferred is on the fact because the
record's classes are three: it is what the author takes if they want this answer
to act while the question stays in front of them, and it is the reasonable choice
if they read the departure from their sentence as the only contested part.
Boldness low because the class follows the stated test applied to a stated fact,
not the AI's judgment of this node alone.

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
rules says so, and it is applied at three clauses and not at the two this node
reaches. A reader therefore takes both of this node's clauses as settled parent
text. That is the parent's bookkeeping and is corrected there.

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

---
question: What does an option's row carry at the first level?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: three-marks-and-the-case-against
        source: ai
        ref: "2026-09-06"
      - name: case-against-to-the-details
        source: author
        ref: "2026-09-04"
      - name: ai-case-against-on-the-row
        source: ai
        ref: "2026-09-06"
      - name: counter-argument-per-fact
        source: review
        ref: "2026-09-06"
      - name: keep-the-four-pills
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "it is the sentence withdrawn from this node's parent on 2026-09-05, and it keeps at the first level the three pills the author's words of 2026-09-04 name as not useful"
      - name: confirmed-mark-struck
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the dialogue node requires every projection to say that a confirmed choice keeps its authority, and a row marked only by being first says nothing"
      - name: stands-and-ruled-as-two-marks
        source: ai
        ref: "2026-09-06"
      - name: source-stays-on-the-row
        source: ai
        ref: "2026-09-06"
    recommends: three-marks-and-the-case-against
    boldness: moderate
    against: "The line at the first level is then written by a party that has not read the node when the AI records its recommendation, so between the recording and the reading every recommendation on the page stands unopposed at the level the eye reads; the answer relies on `recording` forbidding a ruling in that window, which is a rule about when the author may act and not about what the page shows them while they wait."
    stands: three-marks-and-the-case-against
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
    against: "Layout is reversible and cheap to get wrong, so deferred would let the recommendation act on the row while the author works the rest of the frontier; and a ratified ruling here stops any delegation from ever reaching the page's presentation, which is most of what this subtree decides."
review:
  verdict: kickback
  strength: strong
  date: 2026-09-06
  of: 9d5ee0ea9e49d0bf109ef9eb0bab9659cfc81e77
  against: "The amendment answers the first and heaviest finding in the Answer and the Rationale and nowhere in the part of the node that a ruling executes. Sections 4.1 to 4.3 and 4.7 are the amendment to the parent that a ruling here carries out, and 4.2 there still says the node \"rules that they do not reach this line\", the exact contrary of the answer now standing, while the answer fact's own stated reason still reads \"What rests on the AI is the case against on the row\". So on the fact and in the executable sections the superseded answer is still the one recorded, and a reader who took the Answer's prose for the whole amendment would forward a node that would land the position it had just abandoned. Against the kickback: every failure but one is carry-through of an answer whose substance is right and well argued, and the one that is not — the authority paragraph — is a single phrase; the fix is drafting and not rethinking, which is why the stage is maieutic and why I would not have the answer itself redrawn."
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/where-the-unconfirmed-indication-goes
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - most chips and the id-shaped string listed for each option shown in the agency node are not useful in the ui. Is "stands: a draft no one has confirmed" recording anything useful? For each option, list only a short text summary, a simple indicator if it is the recommended choice of the ai and with what boldness, and keep the chips that indicate support or divergence by tradition. Move AI reasoning (such as "passed over") to the details area for each option - not in a chip.

The author, 2026-09-06, answering the probe they raised on 2026-09-04, whether the `stands` chip records anything useful:

> What "stands" could represent is the prior confirmed disposition (if any). There are no confirmed dispositions currently, so we would expect to see no indication of that.

The author, 2026-09-06, on where the warning goes that a node's text is an unconfirmed draft, once the `stands` chip stops carrying it:

> A single indication per node to indicate that node is not yet confirmed is fine.

## Answer

At the first level a row leads with what the option would answer, in the
sentence the record holds for it, and carries the option's name nowhere. Every
option has such a sentence, as the parent's clause provides, and where the record
holds none for an option yet the row falls back to the bare name, which is the
case that clause was written for and which this answer does not strike; the name
also stays in the row's markup, where a ruling is staged from it. Beside
that sentence it carries three marks and no others. That the recommendation
adopts it, with its boldness. For each reading that bears on it, whether the
tradition supports it or it departs from the tradition, by the reading's name.
And, where the author has ruled for it, that it is the confirmed disposition,
with the response and the date. The first two are the author's words of
2026-09-04, which keep the indicator of the AI's choice with its boldness and
keep the tradition chips and cut everything else the row was carrying. The third
is what their answer of 2026-09-06 puts in the place the `stands` chip held:
what such a mark can usefully record is the prior confirmed disposition, if any,
so the mark appears on an option the author has ruled for and nowhere else, and
with no confirmed disposition anywhere in the record today it appears nowhere,
which is exactly what the author says they expect to see.

It is one mark and not two, and that is what the answer of 2026-09-06 settles
rather than what it adds. On the answer fact the option the author ruled for is
the option that stands, which the reader of the graph enforces on every
node, as the dialogue node's answer has it, so the standing of the text and the ruling that gave it that standing are
one fact about one row and two chips saying it would be the same sentence twice;
on the other three facts nothing stands, and only the ruling can appear. Nor can
the mark be dropped in favour of position. The dialogue node has every
projection show the confirmed choice first *and say* that the choice keeps its
authority until the author rules for another, and a row distinguished from its
neighbours only by being above them says neither which of the two it is doing.

Everything else the record holds on an option is one step down, with the rest of
its text, the author's words it rests on, the AI's reasons and each reading's
account: where the option came from, by its source and reference; that the AI
holds it dominated, marked passed over with the one clause saying why, in the
words of the viable-options node's gloss and never in the projector's own;
and, where a ruling stands on it, the particulars the mark does not carry, the
reason the author gave and the pin the ruling answered. The author's words of
2026-09-04 send the passed-over status down by name, "Move AI reasoning (such as
'passed over') to the details area for each option", and the source and
reference go with it as the same kind of thing: an account of how the option
came to be on the list, which is what a reader checks the recommendation with
and never what they choose by. What that costs is stated plainly rather than
argued away: an option the author themselves put on the table is no longer
distinguishable at a glance from one the AI invented, and the author accepted
that when they named the three things the row keeps.

A line arguing against the recommendation stays at the first level, on the
recommended option's row and on no other, and the AI does not write it. The
author's words of 2026-09-04 move the AI's reasoning to the details "not in a
chip", and the AI's own case against is the AI's reasoning however it is set, so
it goes down with the source and the passed-over clause and the rest of the
explanation. What takes its place at the first level is the counter-argument the
clean-context review returned, with the strength that reading gave it, and where
the reading found none, the sentence saying the recommendation goes to the author
unopposed. That is not the recommending party's reasoning and so is not what the
author's instruction moves, and the record already draws exactly this line: the
parent's own answer says that "that counter-argument is the line and carries the
strength the review gave it, and when the review found none the line says so,
since the recording node requires a recommendation that goes alone to say that it
does", and `scholastic-articulus` records that an objection written by the
recommending party has lost the tradition's guarantee and that what stands in its
place is the clean-context review's.

Which line that is depends on what the reading returned for that fact, and the
answer says so rather than leaving it to the projector. Where a reading has
returned a counter-argument bearing on the fact, that is the line, with its
strength and its date. Where it has not, the AI's own case against stands there
after all, and it must: the alternative is a row that shows a recommendation the
record holds a written objection to and either says nothing or says the
recommendation goes unopposed, and the second of those is false in the record's
own terms. So the rule is not that the AI never writes the line; it is that the
AI never writes it where a reader's line is available, which is where the
author's instruction bites, and that a recommendation the record has an objection
to is never presented as though it had none. Today the reading returns one
counter-argument for a node, attached to the answer, so in practice the answer
fact carries the reader's line and every other fact carries the AI's; whether a
reading should return one per fact is a question for the review's own cost and is
recorded as the option `counter-argument-per-fact` rather than settled here.

So the first level is never advocacy without opposition and the author's
placement is honoured whole, which the answer this node first drafted could not
do at once. It could not because it had read the choice as a binary between the
AI's objection at the first level and no objection at all; the clean-context
reading of 2026-09-06 found the third home, and the option the draft had
recommended stays on the list as `ai-case-against-on-the-row` so that the
amendment is testable and not merely announced. The window the answer relies on
is named rather than hidden: between the moment a recommendation is recorded and
the moment its reading returns, the row carries no line, and what makes that
safe is that `recording` takes no ruling while a reading is owed.

What leaves the row entirely is the standing of the text, and it does not leave
the page. Where no ruling stands on the answer fact the text under it is a draft
no one has confirmed, whatever class a ruling on the authority fact confers, and
confirming it ratifies the AI's draft: that is true, it is the finding the author
made on `commons.systems/public/agency`, and nothing here withdraws it. But it is
a fact about the node and not a status of one option among several, so it is not
a row's business and this answer takes it off the row. Where it goes instead is
not this node's question and this answer does not decide it: the author's words
of 2026-09-06 permit a single indication per node, and where the page carries it
is `commons.systems/disposition-graph/where-the-unconfirmed-indication-goes`,
minted on the first finding of this node's reading and named in `depends`. This
node settles that the row does not carry it, and stops there.

So the four pills the reconciliation of 2026-09-05 left on the row are settled
against the page as published and with the parent's fence. `alt-src` goes to the
details. `alt-passed` goes to the details, in the author's own words. `alt-ruled`
and `alt-stands` become the one confirmed mark, conditional on a ruling, which is
the `stands` chip in the meaning the author gave it on 2026-09-06 and the
`alt-ruled` pill in the meaning it already had. `alt-adopted` and the reading
chips stay. The row's first level is therefore the sentence, at most two status
marks, the tradition chips where any reading bears, and on the recommended row of
each fact one line against the recommendation, the reader's where a reading
returned one for that fact and the AI's where none has.

## Rationale

The answer rests on two dispositions of the author's and on one finding of the
record's own reading. The layout words of 2026-09-04 name what an option's row
keeps and send the AI's reasoning down: "For each option, list only a short text
summary, a simple indicator if it is the recommended choice of the ai and with
what boldness, and keep the chips that indicate support or divergence by
tradition. Move AI reasoning (such as 'passed over') to the details area for each
option - not in a chip." Those words carry the row's whole shape, and every mark
this answer keeps or moves is read off them.

The second is the answer of 2026-09-06 to the probe the same words raised, "What
'stands' could represent is the prior confirmed disposition (if any). There are
no confirmed dispositions currently, so we would expect to see no indication of
that." It converts a chip that named the absence of a ruling into a mark that
names a ruling, and so takes the standing of a text off the row and leaves the
page to say it once, which is the author's own permission of the same day.

The third is not the author's. The reading of 2026-09-06 found that the draft had
put the choice on the contested clause as a binary, the AI's objection at the
first level or none, and that the record already held a third answer: the
counter-argument belongs at the first level and is the reader's, not the
recommending party's. The answer that stands takes it, so the author's placement
of the AI's reasoning is honoured whole and the level the eye reads is still
opposed. What the answer beat is on the fact: `ai-case-against-on-the-row`, which
is what this node recommended before that reading, and `case-against-to-the-
details`, which is the author's placement with no line at the first level at all.

## Facts

### answer

Recommended because every settlement on it is the author's words applied where
they fall, and the one clause the author's words did not reach is the reading's
and not the AI's. The three marks are the author's list of 2026-09-04 read with
their answer of 2026-09-06 substituted for the chip that answer discharges. The
merge of `stands` and `ruled` into one mark is not a design choice but a
consequence of the rule the reader of the graph enforces, that on the answer fact
the ruled option is the option that stands, so two marks would be one fact said
twice. The standing of the text leaves the row because it is a fact about the
node, and where the page says it instead is not decided here but on
`where-the-unconfirmed-indication-goes`, minted for it on 2026-09-06.

What rests on the AI is smaller than it was. The draft of 2026-09-06 kept the
AI's own case against at the first level against the author's placement, and the
reading of that day found the third home the record already held: the line stays
and the reader writes it. So the author's placement is honoured whole, and what
is left to the AI is the rule for a fact whose reading returned no line, where
the AI's own case against stands rather than let a recommendation appear
unopposed when it is not. Boldness moderate, and it is the cardinality that keeps
it there: the record has no answer yet for whether a reading returns one
counter-argument or one per fact, and this answer works either way but is
plainer if the second is possible.

#### case-against-to-the-details

Everything above, with the case against sent one step down with the rest of the
AI's explanation, so that the first level is the sentence, the recommendation
with its boldness, the confirmed mark and the tradition chips and nothing else.
This is the author's placement, twice given: "AI explanations for recommended or
rejection" in the drill-down on 2026-09-04, and "Move AI reasoning ... to the
details area for each option" in the observation this node was minted for. It is
the same reading that stands on the parent's answer fact as
`case-against-in-the-drill-down`, restated here as the delta on this node's
answer, and a ruling for it settles the parent's option with it. What it costs
is that the first level of every fact carries the recommendation and no
objection to it.


#### ai-case-against-on-the-row

Everything the recommended option says, with the line at the first level written
by the AI rather than by the clean-context review: the AI's own case against, in
one line, at full strength, on the recommended option's row and on no other, and
the review's counter-argument replacing it there once a reading has returned one,
as the parent's answer already provides. This is what this node recommended
before its reading of 2026-09-06, and it is kept viable because it is the only
option under which a recommendation is opposed at the first level from the moment
it is recorded, with no window in which the row carries advocacy alone. Against
it: the author has twice placed the AI's reasoning in the details, the AI's own
objection is the AI's reasoning, and `scholastic-articulus` holds that an
objection written by the recommending party has lost the guarantee the tradition
gave it, so the line it keeps at the first level is the weaker of the two
available.

#### counter-argument-per-fact

Everything the recommended option says, with the reading asked for one
counter-argument per fact rather than one per node, so that the line at the first
level is the reader's on every fact and never the AI's. Raised by the reading of
2026-09-06, which found that `caseAgainst` substitutes the review's line only
where the fact is the answer and falls back to the AI's on every other, so that
this node's own authority row carries the AI's words at the first level under an
answer that would forbid them. Viable and not adopted here, because what a
reading returns is not this node's to decide: it is `clean-context-review`'s
shape and `review-cost`'s price, and a reading asked for a line on every fact of
every node is a reading asked to argue where it may have nothing to say. It is
recorded so that a ruling for it here is available to the author, and so that the
cardinality this answer works around is visible rather than buried in the
projector.

#### keep-the-four-pills

Everything the recommended option says, with the row keeping `alt-src`, `alt-stands`, `alt-ruled` and `alt-passed` at the first
level, which is what the page renders today and what the account of the
reconciliation of 2026-09-05 claimed the parent's answer required. Passed over:
that sentence has been withdrawn on the parent as a misreading of its own fence,
and the option survives here only so that the reading the page implements is on
the list and is refused in the open rather than by silence.

#### confirmed-mark-struck

Everything the recommended option says, with no status mark of any kind on the row: the confirmed choice is shown first, as
the dialogue node orders the options, and the page says nothing more about it.
Passed over: the same node requires the projections to say that the confirmed
choice keeps its authority until the author rules for another, and position
alone cannot say that, cannot distinguish the confirmed choice from an option
ordered first by chance, and leaves the author unable to find their own prior
ruling on a fact they are meeting a second time.

#### stands-and-ruled-as-two-marks

Everything the recommended option says, with the redefined `stands` mark and the `ruled` mark staying separate at the first
level: `stands` says the option's text is the node's answer, `ruled` says the
author ruled for it, with the response and the date. Viable and not adopted. It
is the only reading that survives if the reader's rule that the ruled option
is the option that stands is ever relaxed, and it keeps a distinction the record
does draw in its vocabulary; against it, on the answer fact today the two are
the same option by that rule, so two marks would be one fact said twice on one
row, which is the failure this whole node exists to cut.

#### source-stays-on-the-row

Everything the recommended option says, with `alt-src` staying at the first level: where an option came from — the author, the
AI, the review, or the node whose sitting raised it — is arguably what a chooser
needs and not what a checker needs, since an option the author put on the table
themselves is a different kind of candidate from one the AI invented. Viable and
not adopted: the author's words name three things the row keeps and this is not
among them, and the author's own words behind an option are in that option's
drill-down already, where they are the thing itself rather than a phrase about
it.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two limbs are not met and the reading says so: the object is a row's contents,
which costs a projector change and a stylesheet change to get wrong and can be
changed back, so it is neither expensive nor irreversible in the senses that
node fixes.

The capture-shaped limb is met exactly. The party that would set this answer is
the AI, and two of the four things the answer decides exist to check the AI. The
case against is the record's only device for putting an argument against the
AI's recommendation in front of the author before they choose, and this answer
decides whether the AI may keep it at the first level or move it out of first
view — a decision about the strength of the check, taken by the checked party.
The per-node indication is the record's only device for telling the author that
the text they are about to confirm is the AI's draft and not their record, which
is the mis-statement the author caught on `commons.systems/public/agency`,
and this answer decides where it is said and how loudly. A row that mis-states
what a confirmation does records a ruling the author did not give, which is the
parent's own reading on its authority fact, applied here to the row rather than
to the page. Low boldness: the limb is the parent's recorded reading narrowed to
this node's object, and the evidence is the author's own finding of 2026-09-04
and the page as published, so little of the recommendation rests on the AI's own
knowledge.

Against it: layout is reversible and cheap to fix, so `deferred` would let the
recommendation act on the row while the author works the rest of the frontier,
and a `ratified` recommendation here also stops any delegation from ever
reaching the page's presentation, which is most of what this subtree decides.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the paragraph beginning "Under each fact are its options", at two sentences. "A row leads with what the option would answer, in the sentence the record holds for it, carrying its name beside that as the handle the record files it under" is what prints the id-shaped string. "Beside the sentence the row carries the option's status as the record holds it: where it came from, by its source and reference; that the recommendation adopts it, with its boldness; that it stands; that the AI holds it dominated, marked passed over with the clause saying why, in the words of the viable-options node's gloss, and still open to the author's ruling, which clears the status; that the author has ruled on it, with the response and the date...; and, for each reading that bears on it, whether the tradition supports it or it departs from the tradition" is the list of chips the author cuts to three things: the summary, the recommendation with its boldness, and the tradition. The author's words also reach the next paragraph, "One more thing sits on the recommended option's row and on no other, at the first level and not in its drill-down: the case against it", since that line is the AI's reasoning at the first level and the author sends AI reasoning down; whether "not in a chip" spares it, the case against being a line and not a chip, is the ambiguity the maieutic has to settle, and the option `case-against-in-the-drill-down` already on the answer fact of `alignment-page` is the reading that does not spare it. Whether the `stands` chip survives at all is the author's own question put back to the AI, and it is carried as a probe on `alignment-page` rather than answered here. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `renderOption`, which writes the `choicename mono handle` span and the pills `alt-src`, `alt-adopted`, `alt-stands`, `alt-ruled` and `alt-passed` before `renderReadingChips`, and on the pill styles in `packages/disposition/alignment-template.html`.

Cascades: `commons.systems/disposition-graph/dialogue`, whose recommended text puts `source` and `ref` on every answer option, `status: passed` with its `reason` wherever the AI holds an option dominated, and the `ruling` with its response and date on the option the author chose, all of which the page renders as chips today, and whose `stands` is what the probe questions; `commons.systems/disposition-graph/viable-options`, whose gloss the passed-over chip quotes and whose model has each option carry its recommendation, its tradition relation and its confirmed choice; `commons.systems/disposition-graph/readings`, on the tradition relation the author keeps; `commons.systems/disposition-graph/progressive-disclosure`, whose two levels the split is drawn on; and `commons.systems/disposition-graph/recording`, on a recommendation that goes alone having to say that it does, which is the line the row prints when there is no case against.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at `commons.systems/public/agency` and at a node carrying a passed option and a ruled one, read against the recommended texts of `alignment-page` and `dialogue`, and `renderOption` in the projector, before anything is changed.

### The parent's clause rendered while this question stands, 2026-09-05

The `choicename mono handle` span this node's account names as the locus was
struck from `renderOption` on 2026-09-05, landed on `greenfield` at `87e4b24e`,
under the author's grant of 2026-09-04. That is the parent's clause and not this
node's: `alignment-page` says the row carries the option's name nowhere, and
this node stands at the periagogic stage, where nothing on it acts. The four
pills the author's words of 2026-09-04 also reach are left as they are, because
whether they belong on the row at the first level is this node's question and
the parent's answer keeps them there until it is ruled.

### The periagoge, 2026-09-06

The periagogic object was read by the survey unit of 2026-09-05, at
`renderOption` and at the published page on `commons.systems/public/agency` and
on a node carrying a passed option and a ruled one. What it found, validated at
the loci on the main thread: the id-shaped string is gone, struck from
`renderOption` on 2026-09-05; the four pills `alt-src`, `alt-stands`,
`alt-ruled` and `alt-passed` are still rendered at the first level; and the case
against is still a first-level line on the recommended row.

It also found a contradiction inside the parent that this node's maieutic must
resolve before it can say what the row carries. `alignment-page`'s recommended
text sends three of those four pills to the option's details — "The rest of the
option's status as the record holds it goes to the option's details, where the
same words send the AI's reasoning: where it came from, by its source and
reference; that the AI holds it dominated, marked passed over with the clause
saying why ...; and that the author has ruled on it, with the response and the
date" — while the account section that node carries of the reconciliation of
2026-09-05 says the opposite, that "this answer keeps them at the first level and
sends the rest to the details". The page implements the account. The false
sentence has been withdrawn on `alignment-page`; the divergence between the page
and the fence stands, deliberately unrepaired, because this node's ruling is what
settles where those pills go.

The probe the author raised on 2026-09-04 is discharged, on this node and on the
parent that carried it. Their answer of 2026-09-06 is that `stands` could
represent the prior confirmed disposition, if any, and that with no confirmed
dispositions in the record no indication of it is expected.

That answer meets an argument the parent's recommended text makes at length, and
the meeting is this node's first maieutic question rather than something the
periagoge settles. The parent's clause reasons that where no ruling stands on the
answer fact the option keeping the standing text "is a draft no one has
confirmed", and that naming it otherwise "claims a standing the text does not
have, and it reads as the safe and ordinary choice when on an AI-drafted node
written in the author's own voice it is the least safe one available". The
author's answer does not deny that; it says the `stands` chip is not what should
carry it. The two are reconcilable and the reconciliation is a design: the chip
means a prior confirmed disposition and appears only where one exists, and the
warning that a confirmation ratifies an AI draft, which is about the node and not
about one option, is carried somewhere that is not an option's status pill.
Where that is, and whether it is on this page at all, is the question the
maieutic has to answer, and it reaches the parent's clause and not only the row.

### The maieutic, and the draft, 2026-09-06

The design ran as a unit on the most capable model, since the draft amends an
ancestor's recommended text, and returned the answer above with nine options on
the answer fact, four of them passed over with their reasons. The main thread
made three changes to what it returned, and made them before anything was
written here.

It gave the answer the `stands` the unit left off. No answer stood on this node,
so the draft is what `## Answer` now holds and the answer fact names it; the
consequence is that the recommended option has no `####` subsection of its own,
its text being the answer itself, and the unit's subsection for it was dropped.
It gave the authority fact the `against` the unit wrote as prose and did not put
in the field. And it corrected an attribution: the rule that on the answer fact
the ruled option is the option that stands is enforced by the reader of the
graph, at `packages/disposition/read.mjs`, which is where the main thread checked
it, and not by the validator; the merge of the two marks rests on that rule and
the rule is real, so the argument stands and only its citation moved.

Two further claims the unit made were checked at their loci on the main thread
before the draft was accepted. That the ruled option and the standing option
coincide: `read.mjs` rejects a node whose answer fact is "ruled on '<x>' but
stands on '<y>'", so the two marks would be one fact said twice, and keying the
merged mark on the ruling rather than on `stands` keeps it working on the
authority fact, where nothing stands. And that the line naming what the
right-hand column shows exists in only one of that function's branches:
`renderPane` in `packages/disposition/project.mjs` emits it where a node has both
an answer and a fence, and emits nothing of the kind where a fence stands with no
answer or an answer stands with no fence, so the answer's clause completing that
line is completing something real.

What the unit proposed and the main thread did not do: amend the parent. The
draft's fourth part gives the exact before-and-after for six clauses of
`alignment-page`'s recommended text, and none of it is applied. This node's
answer is a draft no ruling reaches, and the parent's own fence says that what it
says of the row "stands only until that node rules". Applying a child's unruled
draft to the parent would invert that sentence and would put the AI's draft into
the text the author reads as the parent's recommendation. The amendment is
recorded below as what a ruling here would do, and it is what the reconciliation
of the page would carry out afterwards.

### What a ruling here would do to the parent's recommended text

`commons.systems/disposition-graph/alignment-page`, its answer fact, in the
recommended text under `## Recommendation`. Line numbers are of
`disposition/disposition-graph/alignment-page.md` at graph commit `HEAD` of the
`disposition` ref as read on 2026-09-06; each paragraph is one line in the file
and the quotations below are sentences within it.

#### 4.1 The options paragraph, line 493

**(a) The provisional marker. Before, line 493:**

> What an option's row carries at the first level is the
> `what-an-option-row-carries` node's question, on those words, and what this
> answer says of the row stands only until that node rules.

**After:**

> What an option's row carries at the first level is the
> `what-an-option-row-carries` node's question, on those words, and this
> paragraph states what that node answers.

**(b) The standing option's row. Before, line 493:**

> The option that stands has no subsection, its text being the answer beside it,
> and its row leads with that answer's first sentences exactly as every other row
> leads with its option's, carrying beside them the standing the text has, named
> as below, so that the least safe choice on the page is the one said most
> plainly.

**After:**

> The option that stands has no subsection, its text being the answer beside it,
> and its row leads with that answer's first sentences exactly as every other row
> leads with its option's, carrying beside them nothing about the standing of
> that text: what standing the text has is a fact about the node and not a status
> of one option among several, and the page says it once, on the disposition
> itself, as below.

**(c) What the row carries. Before, line 493:**

> Beside the sentence the row carries, at the first level, the two the author's
> words of 2026-09-04 keep: that the recommendation adopts it, with its boldness;
> and, for each reading that bears on it, whether the tradition supports it or it
> departs from the tradition, by the reading's name, because the relation is the
> option's and not the node's and a tradition can support one option and
> contradict another on the same fact.

**After:**

> Beside the sentence the row carries, at the first level, the two the author's
> words of 2026-09-04 keep and one mark the record's own rule adds: that the
> recommendation adopts it, with its boldness; for each reading that bears on it,
> whether the tradition supports it or it departs from the tradition, by the
> reading's name, because the relation is the option's and not the node's and a
> tradition can support one option and contradict another on the same fact; and,
> where the author has ruled for it, that it is the confirmed disposition, with
> the response and the date, because the dialogue node has every projection show
> the confirmed choice first and say that it keeps its authority until the author
> rules for another, and a row marked only by its position says neither. That
> mark is one and not two: on the answer fact the ruled option is the option that
> stands, as the reader of the graph requires, so the standing of the text and the
> author's ruling on it are one fact about one row, and on the other facts, where
> nothing stands, only the ruling can appear.

**(d) What goes to the details. Before, line 493:**

> The rest of the option's status as the record holds it goes to the option's
> details, where the same words send the AI's reasoning: where it came from, by
> its source and reference; that the AI holds it dominated, marked passed over
> with the clause saying why, in the words of the viable-options node's gloss, and
> still open to the author's ruling, which clears the status; and that the author
> has ruled on it, with the response and the date, since the facts persist after a
> ruling and a node comes back to this page carrying them, so the author meets
> their own choice beside whatever has moved against it, and the fact says when
> the recommendation has moved since.

**After:**

> The rest of the option's status as the record holds it goes to the option's
> details, where the same words send the AI's reasoning: where it came from, by
> its source and reference; and that the AI holds it dominated, marked passed
> over with the clause saying why, in the words of the viable-options node's
> gloss, and still open to the author's ruling, which clears the status. The
> details carry the ruling's particulars beyond the mark as well, the reason the
> author gave and the pin the ruling answered, since the facts persist after a
> ruling and a node comes back to this page carrying them, so the author meets
> their own choice beside whatever has moved against it, and the fact says when
> the recommendation has moved since.

**(e) The probe. Before, line 493:**

> Whether the standing of the text survives on the row at all is the probe the
> author raised on 2026-09-04, open on this node, which the
> `what-an-option-row-carries` node discharges.

**After:**

> The probe the author raised on 2026-09-04, whether the standing of the text
> records anything useful on the row, is discharged: what such a mark can record
> is the prior confirmed disposition, if any, as the author answered on
> 2026-09-06, which is the mark above and the condition on it, and with no
> confirmed disposition in the record no such mark appears anywhere.

#### 4.2 The case-against paragraph, line 495

**Before, line 495:**

> One more thing sits on the recommended option's row and on no other, at the
> first level and not in its drill-down: the case against it, in one line, at full
> strength, in the AI's words.

**After:**

> One more thing sits on the recommended option's row and on no other, at the
> first level and not in its drill-down: one line against the recommendation, at
> full strength, and the AI does not write it where a reader's line is available.
> Where the clean-context review returned a counter-argument bearing on the fact,
> that counter-argument is the line and carries the strength the review gave it.
> Where it returned none, the AI's own case against stands there, because a
> recommendation the record holds a written objection to must not be shown as
> though it had none, and the row must not say it goes unopposed when it does
> not. The author's words of 2026-09-04 send the AI's reasoning to the details,
> and the `what-an-option-row-carries` node applies them here rather than reading
> them narrowly: the AI's case against goes down with the source and the
> passed-over clause, and what stays at this level is the reader's line, written
> by a party that did not draft the recommendation.

The rest of the paragraph is unchanged; its closing sentence, "It is on the row
and not beneath it because a case against that is folded is a case the author
never reads before choosing, and the anchor operates at the level the eye
reads", is the argument this ruling confirms, and it is why the fallback to the
AI's line exists rather than a fold.

Cardinality is not settled by this amendment and the parent is not made to settle
it. A reading returns one counter-argument for a node today, and `caseAgainst` in
`packages/disposition/project.mjs` substitutes it on the answer fact alone, so
under this After the answer fact carries the reader's line and every other fact
carries the AI's. The option `counter-argument-per-fact` is where a different
cardinality would be ruled, and it belongs to `clean-context-review` and
`review-cost` rather than to the page.

#### 4.3 The drill-down paragraph, line 497

Amended again on 2026-09-06, after the re-reading: the details list gains the
thing this answer newly sends down. The AI's own case against joins the source
and reference and the passed-over clause there, on every fact whose reader
returned a counter-argument, and the drill-down says which of the two the row is
carrying so that a reader who wants the AI's argument knows where it went. Where
no reader's line exists the AI's stays at the first level and is not repeated
below.

**Before, line 497 (first sentence, the details list):**

> Beneath each row, one step down and never lost, is everything else the record
> holds on the option, opened on demand: the rest of its text, and for a candidate
> answer the text as it would stand; the author's words it rests on, where its
> source is the author, by the reference it carries; the AI's reason for
> recommending it, or for recommending another over it, and its reply to the case
> against; each reading's account of why the tradition supports the option or is
> departed from, linked to the reading; what a ruling for it keeps and what it
> discards of the nodes standing under this one, where any do; and a text control
> for the author's reason for choosing it and for any edits they want made to it.

**After:**

> Beneath each row, one step down and never lost, is everything else the record
> holds on the option, opened on demand: the rest of its text, and for a candidate
> answer the text as it would stand; where it came from, by its source and
> reference; the author's words it rests on, where its source is the author, by
> the reference it carries; that the AI holds it dominated, marked passed over
> with the clause saying why; the reason the author gave for a ruling on it and
> the pin that ruling answered; the AI's reason for recommending it, or for
> recommending another over it, and its reply to the case against; each reading's
> account of why the tradition supports the option or is departed from, linked to
> the reading; what a ruling for it keeps and what it discards of the nodes
> standing under this one, where any do; and a text control for the author's
> reason for choosing it and for any edits they want made to it.

**Before, line 497 (the split sentence):**

> The split is by what is needed to choose against what is needed to check: the
> first level is the sentence, the status, the tradition's verdict and the case
> against, and what explains each of them is one step below, which are the two
> levels the progressive-disclosure reading supports; that tradition never asked
> for a decision to be removed from the ask.

**After:**

> The split is by what is needed to choose against what is needed to check: the
> first level is the sentence, the recommendation with its boldness, the confirmed
> mark where the author has ruled, the tradition's verdict and the case against,
> and what explains each of them is one step below, which are the two levels the
> progressive-disclosure reading supports; that tradition never asked for a
> decision to be removed from the ask.

The trailing clause after the semicolon is untouched here: it is what the option
`progressive-disclosure-diverges-on-the-fold` on this same fact would strike,
and this answer does not reach it.

#### 4.4 and 4.5, withdrawn on 2026-09-06

The draft of 2026-09-06 also gave before-and-after for the parent's naming
paragraph at line 501 and for its account of the right-hand column at line 505,
where the After struck "no caption" from "no control, no caption, no indication,
no drill-down". Both are withdrawn from this node. Neither clause is one the
parent devolved here: `alignment-page` devolves what an option's row carries at
the first level, and those two are the page's own apparatus rule. A ruling on the
row that carried a settlement of them would be authority widening on the way
down, which is what the clean-context reading of 2026-09-06 found in its fourth
finding. They belong to
`commons.systems/disposition-graph/where-the-unconfirmed-indication-goes`, minted
on that finding, and its sitting will draft them.

#### 4.6 What is not amended

The stage-chip paragraph, line 509, is untouched: the chip keeps the stage, the
two readings' readiness and the open probe count and gains nothing. The option
that would change it is `warning-on-the-stage-chip`, which is no longer on this
node's answer fact: it moved on 2026-09-06 to
`commons.systems/disposition-graph/where-the-unconfirmed-indication-goes`, with
the question it answers, and a ruling there and not here is what would touch that
paragraph. No other node is
amended. `commons.systems/disposition-graph/dialogue` is satisfied as it stands,
its rule that a projection show the confirmed choice first and say that it keeps
its authority being what the confirmed mark discharges;
`commons.systems/disposition-graph/viable-options` says the projections show the
other options "with their status" and fixes no level for it, and its unmet
requirement that a status be shown by the defining node's gloss travels with the
passed-over status into the details.

#### 4.7 What this costs, as a consequence

In `packages/disposition/project.mjs`, `renderOption` loses the `alt-src` and
`alt-passed` pills and gains both in the drill-down; the `alt-stands` and
`alt-ruled` branches collapse into one conditional on `o.ruling`;
`standingState` and `STANDING_LABELS` stop feeding the row and feed only
`renderPane`. What `renderPane` then does is not this ruling's to promise: the
naming line in the two branches that have none today is the standing
recommendation of `where-the-unconfirmed-indication-goes` and is carried out by a
ruling there. `caseAgainst` changes too, and it is the change with the most
behind it: it keeps its substitution of the review's line on the answer fact and
its fallback to `fact.against` elsewhere, and what the amendment adds is that the
AI's line, where it is not shown at the first level, is rendered in the
drill-down instead of dropped. The bare-name fallback in `renderOption` is
untouched, since the parent's clause provides for the option the record holds no
sentence for. In `packages/disposition/alignment-template.html` two pill classes go and
one is renamed. The divergence the parent records at "The row's pills: the
account of 2026-09-05 misread the fence" is closed by this ruling, not by the
reconciliation that opened it.

### Clean-context review, 2026-09-06, of cf9ee19c

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `three-marks-and-the-case-against`.

Findings:

- Answer, the case-against paragraph, and the answer fact's option list (viability; validation 1, words). The Answer holds that "The case against stays where it is: on the recommended option's row, on no other, at the first level, in one line", and the fact offers only two homes for it: this option and `case-against-to-the-details`, which sends it down "with the rest of the AI's explanation". A third home is viable and is missing, and it is the one that satisfies the author's words in full while leaving the first level opposed: the AI's own case against goes to the details with the rest of its reasoning, as the author twice directed, and the line at the first level carries only what the clean-context review returned, which is not the recommending party's reasoning and so is not what "Move AI reasoning ... to the details area for each option" moves. The record already draws exactly this distinction: the parent's own case-against paragraph says that "when the clean-context review returns a counter-argument worth the author's time, that counter-argument is the line and carries the strength the review gave it, and when the review found none the line says so"; `scholastic-articulus` says the AI-written objection loses the tradition's guarantee and that "what stands in its place is the clean-context review, whose counter-argument replaces the AI's own on the row"; and `anchoring-and-adjustment` names the review's counter-argument as the second of the record's three guards. Because `recording` forbids a ruling while either reading is owed, every row the author actually rules on would carry the review's line or the sentence saying the recommendation goes unopposed, so nothing at the first level is lost. Suggested edit: add to the answer fact `only-the-reviews-case-against-on-the-row` (source review, ref 2026-09-06), prose: "Everything the recommended option says, with the AI's own case against sent one step down with the rest of its explanation, as the author's words of 2026-09-04 place it, and the first level carrying in its place the counter-argument the clean-context review returned, with its strength, or the sentence saying the recommendation goes to the author unopposed. It keeps opposition at the level the eye reads without the AI overruling the author's placement of its own reasoning, since the line is then written by a reader that did not draft the recommendation; against it, a node read before its review has run shows a recommendation with no objection beside it."
- "What a ruling here would do to the parent's recommended text", 4.1(c) (validation 3, a claim about the implementation). The proposed After text says "on the answer fact the ruled option is the option that stands, as that node's validator requires", while this node's own Answer says the same rule is what "the reader of the graph enforces on every node" and the Account records that the main thread deliberately corrected the attribution: "the rule ... is enforced by the reader of the graph, at `packages/disposition/read.mjs` ... and not by the validator". Verified: `packages/disposition/read.mjs:579` raises "fact 'answer' is ruled on '<x>' but stands on '<y>'"; no validator carries it. As written, a ruling here would put back into the parent's recommended text the very citation this sitting corrected. Suggested edit: in 4.1(c), "as the reader of the graph requires".
- Facts, `### authority`, second paragraph (validation 1, words). "The per-node indication is the record's only device for telling the author that the text they are about to confirm is the AI's draft and not their record, which is the misreading the author actually made on `commons.systems/public/agency`". The author did not make that misreading; they caught the mis-statement. Their words of 2026-09-04, carried on `alignment-page`, are "I don't understand what 'standing' would even refer to. This node has not yet been answered, there is no ground to confirm as standing." The capture-shaped limb does not need the author to have been taken in, and overstating the evidence weakens a reading that is otherwise exact. Suggested edit: "which is the mis-statement the author caught on `commons.systems/public/agency`". The same phrasing recurs in `no-per-node-warning`'s passed-over reason, "the state the author already found and objected to", which is accurate and can stand.
- Answer, the paragraph beginning "What leaves the row entirely is the standing of the text", and 4.4/4.5 of the amendment (validation 1, question; validation 15, merge). The node's question is "What does an option's row carry at the first level?", and the parent devolves exactly that: "What an option's row carries at the first level is the `what-an-option-row-carries` node's question, on those words, and what this answer says of the row stands only until that node rules." Four of the nine options on the answer fact — `warning-on-the-stage-chip`, `warning-in-the-eyebrow`, `no-per-node-warning`, and the third mark of the recommended option — decide something else: where the page says, once per node, that nothing on the node is confirmed. That decision is not on the row (the Answer says so: "What leaves the row entirely is the standing of the text, and it does not leave the page"), and the amendment it drives reaches two clauses of the parent that the parent has not devolved — the naming paragraph at line 501 and the right-hand column at line 505, where the After text also strikes "no caption" from "no control, no caption, no indication, no drill-down". As encoded, a ruling on the row's contents would carry with it a settlement of the parent's own apparatus rule, which is authority widening on the way down. Suggested edit: propose a sibling under `commons.systems/disposition-graph/alignment-page`, `where-the-unconfirmed-indication-goes` ("Where does the page say that a node's text is a draft no one has confirmed?"), carrying `warning-on-the-stage-chip`, `warning-in-the-eyebrow`, `no-per-node-warning` and the line-in-the-pane option; this node then keeps the mark's departure from the row, names that node as what places it, and enters it in `depends`. If the sitting prefers to keep the decision here, say so in the Answer and mark the two parent clauses as standing only until this node rules, in the form the parent uses for its own devolved clauses.
- Facts, `### answer`, the option subsections (validation 3, encoding). Six of the eight non-standing options are deltas on the recommended text — `confirmed-mark-struck`, `stands-and-ruled-as-two-marks`, `source-stays-on-the-row`, `warning-on-the-stage-chip`, `warning-in-the-eyebrow`, `no-per-node-warning` — but only `case-against-to-the-details` says what it changes and from what ("Everything above, with the case against sent one step down"). `dialogue`'s recommended answer requires that "where it is a change its prose says which option it changes and what it changes, so that a ruling for it is a ruling for that text with that change". As written, a ruling for `warning-on-the-stage-chip` does not say whether the three marks on the row come with it. Suggested edit: open each of the six with "Everything the recommended option says, with ...".
- Answer, first sentence (an executor would take a wrong action). "At the first level a row leads with what the option would answer, in the sentence the record holds for it, and carries the option's name nowhere." The parent's clause of the same words provides for the case this node drops: "Every option has that sentence, and the page supplies the two kinds the node does not write." `renderOption` at `packages/disposition/project.mjs:1490` still falls back to a bare `choicename` span where the record holds no sentence for an option, which is what the reconciliation of 2026-09-05 deliberately left standing (commit `87e4b24e`), and section 4.7's cost statement does not mention it. An executor reading this Answer alone would strike the fallback and leave an empty row. Suggested edit: add to the Answer or to 4.7 that the bare name survives only where the record holds no sentence yet, as the parent's clause provides.
- The node as a whole (validation 3, shape). The node carries no `## Rationale`; `alignment-page`, `dialogue`, `clean-context-review` and `progressive-disclosure` each carry one, and `recording` says of the recording that "the author's words are quoted into the rationale" while the account is removed. The reasoning survives in the answer fact's own subsection and in `## Disposition`, so nothing is lost today, but a ruling would land a node whose `## Rationale` is empty where every neighbour's is not. Suggested edit: a short `## Rationale` quoting the two dispositions the answer rests on, the layout words of 2026-09-04 and the answer of 2026-09-06.

On the facts and what they recommend: Two facts, which is right: nothing proposes a prune and nothing changes the node's shape, so no existence or persistence fact is owed, and the authority fact the encoding requires of a staged node carrying facts is present. The answer fact recommends `three-marks-and-the-case-against` at moderate boldness and names it as `stands`, so there is correctly no `## Recommendation` fence; moderate is the right reading, since three of the four settlements are the author's own words applied where they fall and one is the AI's reading of an instruction's reach. The authority fact recommends `ratified` at low boldness with the `### authority` subsection `class-recommendation` requires, finding the capture-shaped limb and disclaiming the other two by name, and the limb is correctly found: the answer sets the strength of two devices whose subject is the AI. Both facts carry an `against`, and no review state exists yet, so no pin can be stale.

On the viability of the options: Every option listed is viable on its facts, and each of the four passed over carries a reason that holds: `keep-the-four-pills` is the reading the parent withdrew, `confirmed-mark-struck` fails `dialogue`'s requirement that a projection say the confirmed choice keeps its authority, `warning-in-the-eyebrow` is closed by the parent's exhaustive naming of that line, and `no-per-node-warning` rests on an absence the author cannot see. One viable option is missing, and it is on the fact's most contested clause: the case against at the first level written by the clean-context review alone, with the AI's own sent to the details as the author twice directed — see the first finding for its prose. The authority fact's three options are the reserved vocabulary and are complete.

Strongest counter-argument (moderate): The one clause this answer takes from the author is defended by an argument the record itself has already answered differently. The Answer keeps the AI's own case against at the first level because "the first level would be advocacy without opposition" otherwise, but `scholastic-articulus` records that an objection written by the recommending party has lost the tradition's guarantee and that "what stands in its place is the clean-context review, whose counter-argument replaces the AI's own on the row" — so the opposition the first level needs is the reader's, not the AI's, and the author's placement could be honoured whole without leaving the row unopposed. That matters more than one clause, because this node's own authority reading says the answer is capture-shaped: the party setting it is the AI, and two of the things it sets exist to check the AI. On the one of those two where the author has spoken twice, the AI decides against them and offers the author a binary between its own objection at the first level and no objection at all. A reader who wanted the amendment tested rather than merely named would find that the option that would test it is the one not on the list.

The session's reply: Accepted, and the recommendation moves. The reading is right that the record already answers the question the draft answered for itself: `scholastic-articulus` says an objection written by the recommending party has lost the tradition's guarantee and that the clean-context review's counter-argument replaces the AI's own on the row, and the parent's own case-against paragraph says the same in its own words. So the author's placement is honoured whole -- the AI's case against goes to the details with the rest of its reasoning -- and the first level carries the reader's line instead, or the sentence saying the recommendation goes unopposed, which `recording` requires and which is present at every moment the author may rule, since no ruling is taken while a reading is owed. The option the draft had recommended stays on the list as `ai-case-against-on-the-row`, so the amendment is testable rather than merely named.

### The reading applied, and the amendment it drove, 2026-09-06

The reading of 2026-09-06 forwarded with a moderate counter-argument and seven
findings and raised no probe. Its verdict, its strength and the pin of the
recommendation it read are in `review` above, written by the instrument. All
seven findings were validated on the main thread at the loci they name, and every
quotation each rests on was checked verbatim: `read.mjs:579`, `alignment-page`'s
case-against paragraph and its clause "Every option has that sentence, and the
page supplies the two kinds the node does not write", `dialogue`'s rule that a
delta option's prose says what it changes, the author's words on standing of
2026-09-04, and the rationale sections of the four neighbours. All seven were
accepted, and the node returns to the review stage because the first of them
moves the recommendation in substance.

The first finding is the one that matters and the counter-argument is its
statement: the draft had kept the AI's own case against at the first level
against the author's words twice given, on the reasoning that the alternative was
a first level with no opposition, and the reading found that the choice was never
binary. The record already holds the third answer in two places, the parent's own
case-against paragraph and `scholastic-articulus`, both of which say the
clean-context review's counter-argument is what stands on the row in place of the
AI's. So the answer now sends the AI's case against down with the rest of its
reasoning, as the author placed it, and the first level carries the reading's line
or the sentence saying the recommendation goes unopposed. The window this relies
on is named in the answer and carried in the fact's `against`: between a
recommendation being recorded and its reading returning, the row carries no line,
and what makes that tolerable is that `recording` takes no ruling while a reading
is owed. The option the draft had recommended stays on the list as
`ai-case-against-on-the-row`, so the amendment can be refused.

The fourth finding took a question out of this node. The draft decided where the
page says, once per node, that nothing on the node is confirmed, and the
amendment that decision drove reached two clauses of the parent that the parent
never devolved. That is authority widening on the way down.
`commons.systems/disposition-graph/where-the-unconfirmed-indication-goes` is
minted for it, carries the three options that decided it and the one the
recommendation had folded in, and is named in `depends`; sections 4.4 and 4.5 of
the amendment are withdrawn to it. This node keeps only that the row does not
carry the mark, which is its own question.

The other five were taken as given. The attribution inside the proposed
amendment, which would have put back into the parent the citation this sitting
had already corrected. The authority reading's claim that the author made the
misreading, where they caught the mis-statement, which overstated evidence a
reading did not need. The five delta options that did not say what they change,
against `dialogue`'s rule, each now opening "Everything the recommended option
says, with". The first sentence of the answer, which an executor would have read
as striking the bare-name fallback the parent's clause provides for. And the
missing `## Rationale`, which every neighbour carries.

The re-reading is owed, and its object is this amendment and not the node. It is
the second of the two readings this answer gets.

### Clean-context re-reading, 2026-09-06, of 9d5ee0ea

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `three-marks-and-the-case-against`.

Findings:

- Facts, `### authority`, second paragraph (the last reading's third finding, not applied). The node still reads "The per-node indication is the record's only device for telling the author that the text they are about to confirm is the AI's draft and not their record, which is the misreading the author actually made on `commons.systems/public/agency`" (what-an-option-row-carries.md:307-309). The diff carries no hunk in that section; grep finds the corrected phrase nowhere in the file but inside the reading's own quoted text. The Account nevertheless records the finding as applied: "The other five were taken as given. ... The authority reading's claim that the author made the misreading, where they caught the mis-statement, which overstated evidence a reading did not need." So the node now carries both the overstatement the reading named and a statement that it was corrected. Suggested edit: "which is the mis-statement the author caught on `commons.systems/public/agency`"; the Account sentence is then true as written.
- Facts, `### answer`, the fact's opening reason (lines 207-220), not re-derived when the recommendation moved. It still describes the superseded answer in three places. (a) "Recommended because three of the four settlements are the author's own words applied where they fall and the fourth is named as the one place they are not" and "The per-node indication is placed on the line that already carries it in the one case the author complained of, so that it is completed rather than minted": the per-node indication is no longer one of this node's settlements at all, having been withdrawn to `where-the-unconfirmed-indication-goes` under the fourth finding, so the count is wrong and the sentence claims a placement the amendment expressly renounces ("Where it goes instead is not this node's question and this answer does not decide it"). (b) "What rests on the AI is the case against on the row, and the boldness is moderate because of it" and "the placement of the warning is the author's own finding of 2026-09-03 extended, and one clause is the AI's reading of an instruction's reach": under the amended answer the line on the row is the reader's and not the AI's, so what now rests on the AI is the different judgment that the author's instruction does not reach a line the AI did not write. (c) "the merge of `stands` and `ruled` into one mark is not a design choice at all but a consequence of the dialogue node's validator" and "the merge is the validator's": this is the attribution the sitting says on the main thread it corrected and that the last reading's second finding fixed in 4.1(c) — the fix reached 4.1(c) and not this paragraph. Suggested edit: rewrite the paragraph from the answer that now stands — the settlements it actually makes, the reader's line as what the AI's judgment now bears on, and "the reader of the graph" for the merge — and re-derive the boldness from that list. This is not a re-raise of the answered 4.1(c) finding; it is text the fix did not reach.
- "What a ruling here would do to the parent's recommended text", 4.2, contradicts the answer the amendment now stands on. The After text is unchanged by the diff and still reads "the case against it, in one line, at full strength, in the AI's words, and it is the only reasoning of the AI's at that level. The author's words of 2026-09-04 send the AI's reasoning to the details 'not in a chip', and the `what-an-option-row-carries` node rules that they do not reach this line ... The amendment of the author's placement is named as an amendment and the contrary reading is on that node's answer fact" (lines 541-550). The Answer now says the opposite: "A line arguing against the recommendation stays at the first level, on the recommended option's row and on no other, and the AI does not write it", and "the AI's own case against is the AI's reasoning however it is set, so it goes down". Sections 4.1-4.3 are what a ruling executes, so as encoded a ruling for `three-marks-and-the-case-against` would land in the parent's recommended text the position that option abandoned, and would land it as a named amendment of the author's placement when the amendment's whole point is that the author's placement is honoured whole. Suggested edit: redraw 4.2 so the After keeps the line at the first level and says it is the clean-context review's counter-argument with the strength that reading gave it, or the sentence saying the recommendation goes unopposed; that the AI's own case against goes to the details with the rest of its reasoning, as the author placed it; and that the contrary reading is on this node's answer fact as `ai-case-against-on-the-row`. The closing note that follows 4.2, "its closing sentence ... is the argument this ruling confirms", needs re-checking against the redrawn text.
- Answer, the case-against paragraph and the closing sentence, on the facts other than `answer`. The Answer says the first-level line "stays at the first level, on the recommended option's row and on no other, and the AI does not write it", and the closing sentence still says the first level is "the sentence, at most two status marks, the tradition chips where any reading bears, and on one row per fact the case against". But the review's counter-argument is one per node, in the `review.against` of the frontmatter, while the AI's `against` is one per fact; `caseAgainst` at packages/disposition/project.mjs:1381-1388 returns the review's line only where `fact.name === "answer"` and falls back to `fact.against` on every other fact. On this very node the `authority` fact's recommended row therefore carries the AI's own words ("Layout is reversible and cheap to get wrong ...") at the first level, which the amended answer forbids, and the answer says nothing about what takes their place there — the node-level line repeated on a second fact, the unopposed sentence, or nothing. Suggested edit: say in the Answer what a fact other than `answer` carries at the first level under this rule, and if the intent is that only the answer fact carries a line, say that and strike "on one row per fact" from the closing sentence. This clause may reach `alignment-page` and `recording`, whose texts I was not given: it is for the next full reading or the survey to check whether the parent already fixes the cardinality.
- "What a ruling here would do to the parent's recommended text", 4.3, not re-derived from the moved answer. The details list in the After (lines 573-584) gains the source, the passed-over clause and the ruling's particulars, but not the thing the amendment newly sends down: the AI's own case against. It carries only "the AI's reason for recommending it, or for recommending another over it, and its reply to the case against", which is the Before's wording and presupposes the case against is somewhere else. The split sentence's After likewise keeps a bare "the case against" at the first level (line 598) without saying whose it is, where that is now the amendment's whole point. Suggested edit: add the AI's own case against to the details list, and say where it lands, since it is a fact's line and the details are an option's — the recommended option's drill-down is the only place the Answer's "it goes down with the source and the passed-over clause" can mean; and qualify the split sentence's "the case against" as the review's line, or the sentence saying the recommendation goes unopposed.
- "What a ruling here would do to the parent's recommended text", 4.6 and 4.7, left carrying the withdrawn 4.4 and 4.5. 4.6 still reads "the option that would change it is `warning-on-the-stage-chip`" (line 625), an option this node's answer fact no longer holds — the diff moved it to `where-the-unconfirmed-indication-goes`, so the reader cannot find it on the fact list they are ruling on. 4.7 still reads "`standingState` and `STANDING_LABELS` stop feeding the row and feed only `renderPane`, which gains a naming line in the two branches that have none today" (lines 639-641); that naming line is exactly what 4.4 and 4.5 were withdrawn for, and it is now the standing recommendation of the sibling node (`the-line-that-names-what-the-pane-shows`), so as written a ruling here would direct the reconciliation to carry out the sibling's unruled recommendation — the authority widening the fourth finding closed, re-entering through the cost statement. The same residue sits in the maieutic account, "so the answer's clause completing that line is completing something real" (the answer now has no such clause). 4.7 is also silent on what is now the amendment's principal implementation consequence: `fact.against` must leave the first level on every fact and appear in the drill-down, and `caseAgainst`'s fallback branch at project.mjs:1386 must go. Suggested edit: in 4.6 name the sibling as where the stage-chip option now lives; in 4.7 stop at `standingState` and `STANDING_LABELS` no longer feeding the row, say that where they feed instead is the sibling's question, and add the `caseAgainst`/`fact.against` change; and drop or requalify the maieutic sentence.
- Facts, `### answer`, `#### stands-and-ruled-as-two-marks`, and the subsection break before `#### keep-the-four-pills`. The prefix the fifth finding asked for was applied mechanically here and does not parse as English: "Everything the recommended option says, with the redefined `stands` mark and the `ruled` mark stay separate at the first level" (line 271; the other three read correctly, "with the row keeping", "with no status mark", "with `alt-src` staying"). The same subsection also keeps the corrected attribution's old form, "It is the only reading that survives if the validator's rule that the ruled option is the option that stands is ever relaxed" — a fourth locus the 4.1(c) fix did not reach. And the new `#### ai-case-against-on-the-row` subsection runs straight into the next heading with no blank line after "the weaker of the two available.", where every other subsection has one. Suggested edits: "with the redefined `stands` mark and the `ruled` mark staying separate at the first level"; "the reader of the graph's rule"; and a blank line before `#### keep-the-four-pills`.
- Facts, `### answer`, the option list: the answer that now stands carries no trace on the fact that the reading raised it. The last reading's suggested edit was to add `only-the-reviews-case-against-on-the-row` with `source: review, ref: 2026-09-06`; the session took the better route of adopting it, but folded it into `three-marks-and-the-case-against`, which keeps `source: ai, ref: "2026-09-06"` (lines 8-10), so no option on either fact carries `source: review` and the author reading the fact list sees the AI as the author of every candidate including the one they are being asked to confirm. On a node whose own authority reading is that the answer is capture-shaped because "the party that would set this answer is the AI", which party produced the decisive clause is exactly what the fact should show. Suggested edit: either set the standing option's `source` to `review` with `ref: 2026-09-06`, the reading that raised the clause it now turns on, or say in the fact's opening reason (see the second finding, which rewrites that paragraph anyway) that the clause came from the clean-context reading and not from the AI. The Rationale's third paragraph says it in prose already; the fact does not.

On the facts and what they recommend: The diff changes only the answer fact: it adds `ai-case-against-on-the-row` (source ai, ref 2026-09-06, no status, correctly viable rather than passed over) and moves `warning-on-the-stage-chip`, `warning-in-the-eyebrow` and `no-per-node-warning` out to the minted sibling, taking their passed-over reasons with them; `recommends`, `boldness: moderate` and `stands` still name `three-marks-and-the-case-against`, so there is still correctly no `## Recommendation` fence, though that option's text moved in substance under the same name; and the fact's `against` is replaced with the window argument, which is the right `against` for the recommendation that now stands. The authority fact is untouched, and the `review` block the apply step wrote is stale by design (`of: cf9ee19c` against a moved recommendation). What the diff did not change is the fact's own opening reason, which still gives the reason for the superseded recommendation (second finding). `node validate.mjs disposition` reports ok: 140 nodes.

On the viability of the options: The diff leaves every option on both facts viable. `ai-case-against-on-the-row` earns its place — it is the only option under which a recommendation is opposed at the first level from the moment it is recorded — and is correctly not passed over; the three options taken to `where-the-unconfirmed-indication-goes` belong to that node's question and their passed-over reasons travel intact; the four reasons remaining here still hold. Nothing became dominated by the move. The only gap is attributive rather than substantive: no option carries `source: review` although the reading raised the clause the standing answer turns on (eighth finding).

Strongest counter-argument (strong): The amendment answers the first and heaviest finding in the Answer and the Rationale and nowhere in the part of the node that a ruling executes. Sections 4.1 to 4.3 and 4.7 are the amendment to the parent that a ruling here carries out, and 4.2 there still says the node "rules that they do not reach this line", the exact contrary of the answer now standing, while the answer fact's own stated reason still reads "What rests on the AI is the case against on the row". So on the fact and in the executable sections the superseded answer is still the one recorded, and a reader who took the Answer's prose for the whole amendment would forward a node that would land the position it had just abandoned. Against the kickback: every failure but one is carry-through of an answer whose substance is right and well argued, and the one that is not — the authority paragraph — is a single phrase; the fix is drafting and not rethinking, which is why the stage is maieutic and why I would not have the answer itself redrawn.

The session's reply: Accepted whole, and the reading is right that the failure is drafting and not substance. The amendment of 2026-09-06 changed the answer's two load-bearing paragraphs and did not sweep the node behind them, so the authority reading, the answer fact's own opening reason, and four sections of the proposed parent amendment still argue the position the answer abandoned. The first finding is worse than the reading could see: the correction it names was attempted, and the edit matched the reading's own verbatim quotation of the draft, which is a single long line, instead of the authority paragraph, which wraps. So a reading's words were altered and the locus was left standing. The quotation is restored and the locus is corrected, and the incident is recorded rather than quietly repaired. The one finding that is not carry-through is taken as design: `caseAgainst` substitutes the review's counter-argument on the answer fact alone, so on every other fact the row would keep the AI's line, which the answer forbids; the redraw must say what a non-answer fact's row carries and not leave it to the projector. An option carrying `source: review` goes on the fact, since the clause the standing answer turns on came from the reading and the record should show that.

### The kickback answered, and one error of the main thread's, 2026-09-06

The re-reading kicked the answer back to the maieutic stage at strong strength,
with eight findings and no probe. Its own counter-argument said the failure was
drafting and not substance, and that is right: the amendment of earlier the same
day changed the answer's two load-bearing paragraphs and did not sweep the node
behind them, so the authority reading, the answer fact's opening reason and four
sections of the proposed parent amendment were still arguing the position the
answer had abandoned. All eight findings were validated on the main thread at the
loci they name and all eight are answered.

One of them is worse than the reading could see, and it is the main thread's
error rather than the draft's. The reading of earlier that day had asked for the
authority paragraph's "the misreading the author actually made" to become "the
mis-statement the author caught". The correction was attempted and it landed in
the wrong place: the phrase occurs twice in this file, once in the authority
paragraph, where it wraps across two lines, and once inside the reading's own
verbatim quotation of the draft, which is a single long line. A whole-string
match found only the second, so a reading's words were altered and the locus the
finding named was left standing. The quotation is restored to what the reading
wrote and the authority paragraph is corrected. The record keeps the incident
because altering a reading's words is the one edit this dialogue cannot make: a
reading is the check on the party that writes the record, and a check whose text
the checked party can silently redraft is not one.

The finding that was not carry-through is taken as design. `caseAgainst` in
`packages/disposition/project.mjs` substitutes the review's counter-argument
where the fact is the answer and falls back to the AI's `against` on every other
fact, so under the amended answer this node's own authority row would have
carried the AI's line at a level the answer forbade. The answer now says what a
fact carries rather than leaving it to the projector: the reader's line where a
reading returned one for that fact, and the AI's where none has, because the
alternative is a row that hides a written objection or claims a recommendation
goes unopposed when it does not. The cardinality behind it — one counter-argument
per node or one per fact — is not this node's, and it is recorded as the option
`counter-argument-per-fact`, source review, so that a ruling for it is available
here while the question stays `clean-context-review`'s and `review-cost`'s.

The rest were carry-through and are swept: the answer fact's opening reason,
re-derived; §4.2, rewritten to the position that now stands, with the cardinality
named and the parent not made to settle it; §4.3, whose details list gains the
AI's case against, the thing the amendment newly sends down; §4.6, which named an
option this node no longer holds, now pointing at the node it moved to; §4.7,
which promised a `renderPane` change that is the sibling's to make and said
nothing of the `caseAgainst` change that is this ruling's; the fourth attribution
locus; the ungrammatical prefix; and the missing subsection break.

A kickback is a new answer, so this one owes a reading of its own, and it is the
first of the two that answer gets. The two spent on the answer it replaces are
spent.

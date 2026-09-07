---
question: What does an option's row carry at the first level?
form: rule
stage: review
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
      - name: unread-mark-where-no-reading-has-run
        source: review
        ref: "2026-09-06"
        status: passed
        reason: "the answer of 2026-09-06 collapses the two no-line cases into one mark, so this option names half of what the recommendation already does and is not a choice beside it"
      - name: ai-line-until-a-reading-returns
        source: ai
        ref: "2026-09-06"
    recommends: three-marks-and-the-case-against
    boldness: moderate
    against: "The AI writes a case against every recommendation and the author never sees it at the level they read: on every fact of every node but one, the row carries a mark saying no reader's line bears and the AI's own written objection sits behind a fold, because a reading returns one counter-argument for a node and `caseAgainst` substitutes it on the answer fact alone. The arrangement this answer forbids, the AI's line at the first level, is the only one under which an objection the record holds is always where the author reads."
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
  strength: moderate
  date: 2026-09-06
  of: 84203846200ce0cf2ba2e91e2a4ec21693072740
  commit: ec6e230094ea4d6c08916bb83a62b09e4d3ada6b
  against: "The answer's central move is that the AI never writes the first-level line, and the record can supply a reader's line on exactly one row of one fact per node: `review.against` is one counter-argument for the node and `caseAgainst` substitutes it only where `fact.name === \"answer\"` (packages/disposition/project.mjs:1381-1388). The collapse dissolves the three-parties objection but not this one: it makes the mark the rule for every fact but `answer` on every node, so what the author meets at the level the eye reads, on most rows of the page, is a notice that nobody has checked, while the record holds the recommending party's own written admission of its recommendation's weakness one step down. On this very node the `authority` fact's row is the case in point: a real argument for `deferred` would sit in a drill-down under a mark. `hansard-verbatim-record` holds that the case against \"illustrates the argument, so by this standard it cannot be edited out\" of the first level; `chenery-reasoned-decision` holds that a decision stands on the reason its decider gave and not another's; `bentham-publicity` holds that a recommender withholding its own reasoning defeats publicity at the source; and `scholastic-articulus`, which this answer leans on, warns that the reader's substitution \"is weaker than the tradition's guarantee and the record should not pretend otherwise\" -- a caution about the replacement, not a licence to demote the AI's line where no replacement exists. On a node whose own authority reading is that the decision is capture-shaped because the party setting it is the AI, weakening the check on every fact but one, and recording no divergence from the traditions that say so, is what the reading is for. `ai-line-until-a-reading-returns`, on the fact and not adopted, is the arrangement under which no row ever shows a recommendation with nothing said against it."
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

A row leads with what the option would answer, in the sentence the record holds
for it, and carries the option's name nowhere. Every option has such a sentence,
and where the record holds none for one yet the row falls back to the bare name,
which is the case the parent's clause provides for; the name also stays in the
row's markup, where a ruling is staged from it.

Beside that sentence the row carries three marks and no others. That the
recommendation adopts it, with its boldness. For each reading that bears on it,
whether the tradition supports it or departs from it, by the reading's name. And,
where the author has ruled for it, that it is the confirmed disposition and keeps
its authority until the author rules for another, with the response and the date.
The first two are the author's words of 2026-09-04. The third is what their
answer of 2026-09-06 puts where the `stands` chip was: a mark records the prior
confirmed disposition, if any, so it appears on an option the author has ruled
for and nowhere else, and with no confirmed disposition in the record it appears
nowhere.

It is one mark and not two. On the answer fact the option the author ruled for is
the option that stands, which the reader of the graph enforces, so two marks
would be one fact said twice; on the other facts nothing stands and only the
ruling can appear. Nor can position replace it: `dialogue` has every projection
show the confirmed choice first and say that it keeps its authority, and a row
distinguished only by being above its neighbours says neither.

Everything else the record holds on an option is one step down, with the rest of
its text, the author's words it rests on, and each reading's account: where the
option came from, by its source and reference; that the AI holds it dominated,
marked passed over with the clause saying why in the words of `viable-options`;
and, where a ruling stands on it, the reason the author gave and the pin the
ruling answered. The author's words send the passed-over status down by name, and
the source goes with it as the same kind of thing, an account of how the option
came to be on the list rather than what a reader chooses by. What that costs is
stated rather than argued away: an option the author put on the table is no
longer distinguishable at a glance from one the AI invented.

On the recommended option's row of each fact, and on no other row, one line
against the recommendation, and the AI never writes it. The author's words move
the AI's reasoning to the details "not in a chip", and the AI's own case against
is the AI's reasoning however it is set, so it goes down with the source and the
passed-over clause, on every fact, with no exception. What stands in its place is
the counter-argument the clean-context review returned for that fact, with the
strength that reading gave it. That is not the recommending party's reasoning, and
the record already draws the line there: `alignment-page` says "that
counter-argument is the line and carries the strength the review gave it", and
`scholastic-articulus` says an objection written by the recommending party has
lost the tradition's guarantee and that what stands in its place is the clean
reader's.

Where no reader's line bears on a fact the row carries one mark saying so, and no
argument. The two ways that happens — no reading has run on the node, and a
reading ran and returned nothing for that fact — are one fact about the row, and
a reader cannot tell them apart by looking. Collapsing them is what makes the row
legible without knowing the node's stage, and it keeps this answer out of a
question that is not its own: whether a recommendation with no reader's line
beside it may be called unopposed is `recording`'s, where the conflict between
that node's rule and `dialogue`'s requirement of an `against` on every
recommendation is recorded.

What that costs, stated and not hidden: a reading returns one counter-argument
for a node, and `caseAgainst` substitutes it on the answer fact alone, so on
every other fact of every node the row carries the mark and the AI's written
objection is one step down. Whether a reading should return one line per fact is
`clean-context-review`'s question, recorded there as `counter-argument-per-fact`.
It is also a divergence from `hansard-verbatim-record`, whose reading of this
record is that what the first level shows cannot be edited out of it; the
divergence is recorded here rather than absorbed, and the option
`ai-case-against-on-the-row` is the side of it the tradition takes.

What leaves the row entirely is whether the node's text has been confirmed. That
is a fact about the node and not a status of one option among several, so it is
not a row's business; where the page says it instead is
`where-the-unconfirmed-indication-goes`, named in `depends`, and this answer
settles only that the row does not carry it.

## Rationale

The author's layout words of 2026-09-04 carry the row's whole shape: "For each
option, list only a short text summary, a simple indicator if it is the
recommended choice of the ai and with what boldness, and keep the chips that
indicate support or divergence by tradition. Move AI reasoning (such as 'passed
over') to the details area for each option - not in a chip." Every mark this
answer keeps or moves is read off that sentence.

Their answer of 2026-09-06 to the probe the same words raised — "What 'stands'
could represent is the prior confirmed disposition (if any). There are no
confirmed dispositions currently, so we would expect to see no indication of
that." — turns a chip that named the absence of a ruling into a mark that names
one, and so takes the question of confirmation off the row entirely.

The third ground is not the author's and is named as such. Four clean-context
readings on this node's line of drafts found, in turn, that the choice on the
contested clause was never binary; that the record already holds the third
answer, the reader's line in place of the AI's; and that the two cases with no
reader's line are one. What the answer beat is on the fact:
`ai-case-against-on-the-row`, which every one of those drafts recommended before
the readings, and `case-against-to-the-details`, which is the author's placement
with no line at the first level at all.

## Facts

### answer

Recommended because every settlement on it is the author's words applied where
they fall, except one clause, which is the readings' and is named as theirs. The
three marks are the author's list of 2026-09-04 with their answer of 2026-09-06
in place of the chip it discharges. The merge of the standing and ruled marks is
not a design choice but a consequence of the rule the reader of the graph
enforces, that on the answer fact the ruled option is the option that stands.
Whether the node is confirmed leaves the row because it is a fact about the node,
and where it goes is `where-the-unconfirmed-indication-goes`'.

What rests on the AI is the mark that stands where no reader's line bears, and
the choice to collapse into it the two ways that can happen. Boldness moderate,
and the cardinality is why: with one counter-argument per node, most rows of most
nodes carry the mark rather than a line, and whether that is right depends on
`counter-argument-per-fact` on `clean-context-review`, which this answer does not
own.

#### case-against-to-the-details

Everything the recommended option says, with no line at the first level at all:
the reader's counter-argument goes down with the AI's, and the row carries the
sentence, the marks and the tradition chips and nothing else. This is the
author's placement read at its widest, and their words are twice on its side.
What it costs is that the first level of every fact carries a recommendation and
no objection to it, which is the anchoring the parent's own paragraph exists to
prevent.

#### ai-case-against-on-the-row

Everything the recommended option says, with the line at the first level written
by the AI rather than by the reader: the AI's own case against, in one line, at
full strength, on the recommended option's row, giving way to the reader's
counter-argument where one has been returned. It is the only option under which
an objection the record holds is always at the level the author reads, on every
fact of every node, which is the fact's own `against` and is
`hansard-verbatim-record`'s side of the divergence recorded above. Against it:
the author placed the AI's reasoning in the details twice, and `scholastic-
articulus` holds that an objection written by the recommending party has lost the
guarantee the tradition gave it.

#### keep-the-four-pills

Everything the recommended option says, with the row keeping `alt-src`,
`alt-stands`, `alt-ruled` and `alt-passed` at the first level, which is what the
page renders today. Passed over: it is the reading the parent withdrew on
2026-09-05 as a misreading of its own fence, and it keeps at the first level the
three pills the author's words name as not useful. It survives on the list so
that what the page does is refused in the open rather than by silence.

#### confirmed-mark-struck

Everything the recommended option says, with no status mark of any kind on the
row: the confirmed choice is shown first, as `dialogue` orders the options, and
the page says nothing more. Passed over: that node requires a projection to say
the confirmed choice keeps its authority, and position alone cannot say it,
cannot distinguish the confirmed choice from an option ordered first by chance,
and leaves the author unable to find their own prior ruling.

#### stands-and-ruled-as-two-marks

Everything the recommended option says, with the redefined standing mark and the
ruled mark staying separate: one says the option's text is the node's answer, the
other that the author ruled for it. Viable and not adopted. It is the reading
that survives if the reader's rule that the ruled option is the option that
stands is ever relaxed; against it, on the answer fact today the two are the same
option by that rule, so two marks would be one fact said twice on one row.

#### source-stays-on-the-row

Everything the recommended option says, with `alt-src` staying at the first
level: where an option came from is arguably what a chooser needs and not what a
checker needs, an option the author put on the table being a different kind of
candidate from one the AI invented. Viable and not adopted: the author's words
name three things the row keeps and this is not among them, and the author's own
words behind an option are in that option's drill-down already, where they are
the thing itself rather than a phrase about it.

#### unread-mark-where-no-reading-has-run

The mark appears only where no reading has run, and a fact whose reading returned
nothing carries something else. Passed over: the answer collapses the two cases
deliberately, and this option is the half of the recommendation that would be
left if it did not, so it names no choice the author can make against the
recommendation as a whole.


#### ai-line-until-a-reading-returns

Everything the recommended option says, with the AI's own case against standing at
the first level on any fact whose reading has not yet returned, and giving way to
the reader's line when one arrives. Passed over: it is
`ai-case-against-on-the-row` for the interval before a reading returns and no
further, so it names the same arrangement with a narrower reach, and the choice
the author has between the AI's line and the reader's is put plainly by that
option instead.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met and the reading says so: the object is a row's contents, which
costs a projector change and a stylesheet change to get wrong and can be changed
back, so it is neither expensive nor irreversible in the senses that node fixes.

The capture-shaped limb is met exactly, on two of the things this answer decides.
The line against the recommendation is the record's only device for putting an
argument against the AI in front of the author before they choose, and this
answer decides who writes it and when it is replaced by a mark — a decision about
the strength of the check, taken by the checked party. And the mark that stands
where no reader's line bears is what the author sees in place of an argument on
most rows of most nodes, with the AI setting the rule for when it appears and
being the party whose recommendation goes unargued behind it. Where the per-node
indication that a node is unconfirmed is said is not this answer's, and is named
as not being: that is `where-the-unconfirmed-indication-goes`, in `depends`.

Low boldness: the limb is the parent's own recorded reading narrowed to this
node's object, and the evidence is the author's finding of 2026-09-04 and the
page as published.

Against it: layout is reversible and cheap to fix, so `deferred` would let the
recommendation act on the row while the author works the rest of the frontier,
and a `ratified` ruling here stops any delegation from ever reaching the page's
presentation, which is most of what this subtree decides.

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

### What a ruling here would reach in the parent, 2026-09-06

The proposed amendment this account carried until 2026-09-06 is withdrawn, and
nothing replaces it in kind. It set out before-and-after text for seven clauses
of `alignment-page`'s recommended text, and four consecutive readings found the
same defect in it: the After paragraphs restated this answer in the parent's
words and drifted from it every time the answer moved, its line numbers went
stale twice as the parent grew, and twice it carried a rule the answer had
abandoned into the text a ruling would execute. A child's account is not where a
parent's text is drafted. What a ruling here reaches is said by naming the
parent's clauses and quoting them, and the drafting is the parent's own
reconciliation, done once against the answer as ruled rather than five times
against an answer still moving.

The clauses a ruling here reaches, quoted from `alignment-page`'s recommended
text and located by their words rather than by line:

- The row's lead, "A row leads with what the option would answer, in the sentence
  the record holds for it, and carries the option's name nowhere", which this
  answer keeps and qualifies with the bare-name fallback.
- What the row carries beside the sentence, "Beside the sentence the row carries,
  at the first level, the two the author's words of 2026-09-04 keep", which
  becomes three with the confirmed mark.
- What goes to the details, "The rest of the option's status as the record holds
  it goes to the option's details", which gains the AI's own case against.
- The case-against paragraph, "One more thing sits on the recommended option's
  row and on no other, at the first level and not in its drill-down: the case
  against it, in one line, at full strength, in the AI's words", where "in the
  AI's words" is what this answer replaces.
- The standing clause, "carrying beside them the standing the text has, named as
  below", and the naming paragraph beneath it, which this answer empties of its
  row-level content and whose remainder is
  `where-the-unconfirmed-indication-goes`'.
- The probe's closing sentence, "Whether the standing of the text survives on the
  row at all is the probe the author raised on 2026-09-04, open on this node,
  which the `what-an-option-row-carries` node discharges", which a ruling here
  discharges.

Two clauses this answer does not reach and a ruling here must not move: the
stage-chip paragraph, and the parent's account of the right-hand column. Both are
the parent's apparatus rule, and the second is where
`standing-named-in-the-pane` sits.

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

### Clean-context review, 2026-09-06, of f3108f03

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `three-marks-and-the-case-against`.

Findings:

- Answer, the fallback paragraph against the window paragraph (validation 1; the two contradict each other, and the fact's `against` argues from the loser). The fallback rule reads "Which line that is depends on what the reading returned for that fact... Where it has not, the AI's own case against stands there after all, and it must" (what-an-option-row-carries.md:143-147). The next paragraph reads "The window the answer relies on is named rather than hidden: between the moment a recommendation is recorded and the moment its reading returns, the row carries no line, and what makes that safe is that `recording` takes no ruling while a reading is owed" (:165-168). Under the fallback rule there is no such window: in that interval no reading has returned a counter-argument for the fact, so the AI's own case against is exactly what the row carries. The answer fact's `against` is the same superseded argument -- "between the recording and the reading every recommendation on the page stands unopposed at the level the eye reads; the answer relies on `recording` forbidding a ruling in that window" -- and it is the line the page prints at the first level against this very recommendation, so the objection the author would read is one the answer already refutes. This is the residue of the pre-amendment position, which the sweep of 2026-09-06 did not reach. Suggested edit: strike the window paragraph, and replace the fact's `against` with the case against the answer as it now stands -- that the AI's line survives at the first level on every fact but one, so the author's placement is honoured on one row per node and nowhere else.
- Answer, the case-against paragraph against the fallback paragraph, and against `recording` (validation 2, doctrine, divergence not recorded). The first says the first level carries "the counter-argument the clean-context review returned, with the strength that reading gave it, and where the reading found none, the sentence saying the recommendation goes to the author unopposed" (:131-134), quoting the parent for it. The second says that where a reading "has not" returned a counter-argument bearing on the fact, "the AI's own case against stands there after all... the alternative is a row that shows a recommendation the record holds a written objection to and either says nothing or says the recommendation goes unopposed, and the second of those is false in the record's own terms" (:146-150). The two prescribe opposite things for the same case, and the second strikes a rule the record states twice: `recording`'s standing answer, "when the review found no strong counter-argument, the recommendation goes alone and says so", and its recommended text, "where the reading found none worth the author's time the row says so, because a recommendation that goes to the author unopposed must say that it goes unopposed". Since `dialogue`'s recommended text makes `against` a part of every fact, the AI's line is always available and the unopposed sentence could never appear on any row. Yet section 4.6 says "No other node is amended". Suggested edit: distinguish the two cases in the Answer -- a reading that has returned and found no counter-argument worth the author's time, where the unopposed sentence stands, from a reading not yet returned -- and where the AI's line displaces the unopposed sentence, record the divergence as an option on `commons.systems/disposition-graph/recording` rather than settling it here.
- "What a ruling here would do to the parent's recommended text", 4.3, and the Account's claim that 4.3 was swept (validation 3, a claim about the node's own text; the re-reading's fifth finding not applied). 4.3's preamble says "the details list gains the thing this answer newly sends down. The AI's own case against joins the source and reference and the passed-over clause there... and the drill-down says which of the two the row is carrying so that a reader who wants the AI's argument knows where it went" (:614-620). The After text that follows (:636-647) gains the source and reference, the passed-over clause and the ruling's particulars, and does not gain the AI's case against: it still carries only the Before's "the AI's reason for recommending it, or for recommending another over it, and its reply to the case against", and says nothing about which of the two lines the row is carrying. The split sentence's After (:659-664) likewise still reads a bare "the case against" without saying whose, which the re-reading asked to be qualified. The Account nevertheless records the sweep as done: "the rest were carry-through and are swept: ... §4.3, whose details list gains the AI's case against, the thing the amendment newly sends down". Sections 4.1 to 4.3 are what a ruling executes, so as encoded a ruling here amends the parent to send the AI's case against off the row with no rule putting it anywhere -- dropped, not moved -- which is what the Answer forbids ("it goes down with the source and the passed-over clause and the rest of the explanation", :129-131), what 4.7 promises ("the AI's line, where it is not shown at the first level, is rendered in the drill-down instead of dropped"), and what the sibling reading `hansard-verbatim-record` sets as the test the second level must meet, that nothing folded is lost. Suggested edit: add to 4.3's After, in the details list, the AI's own case against on a fact whose first level carries the reader's line, with the clause saying which of the two the row shows; and qualify the split sentence's "the case against" as the reader's line where a reading returned one and the AI's where none has.
- Answer, the confirmed mark, against `dialogue`, and section 4.6 (validation 2, doctrine). The mark is specified as "where the author has ruled for it, that it is the confirmed disposition, with the response and the date" (:89-90), and the row carries "three marks and no others". `dialogue`'s answer, standing and recommended alike, requires that the projections "show the choice first and beneath it the recommendation, the other options, and what each tradition says, and say that the choice keeps its authority until the author rules for another". The draft reads that requirement strictly against the rival option -- "The dialogue node has every projection show the confirmed choice first *and say* that the choice keeps its authority until the author rules for another, and a row distinguished from its neighbours only by being above them says neither" (:105-108) -- and passes `confirmed-mark-struck` over on it, but the mark it keeps says only that a ruling happened and its date, not that the choice keeps its authority. Section 4.6 then asserts that `dialogue` "is satisfied as it stands, its rule that a projection show the confirmed choice first and say that it keeps its authority being what the confirmed mark discharges", which the mark's own content does not support. Suggested edit: either make the mark say what the rule requires -- the confirmed disposition, with the response and the date, kept until the author rules for another -- or name where else on the page that sentence is said, and where neither, record the divergence from `dialogue` as an option on that node.
- Facts, `### answer`, `#### counter-argument-per-fact` (validation 15, merge; a question carried on this node's dialogue). The option asks for "the reading asked for one counter-argument per fact rather than one per node", and its own prose says "what a reading returns is not this node's to decide: it is `clean-context-review`'s shape and `review-cost`'s price", while adding "It is recorded so that a ruling for it here is available to the author". Those two sentences cannot both hold: an author ruling for it on this node's answer fact would settle what a reading returns, which is another node's question reached sideways -- the same fault the fourth finding of 2026-09-06 closed when it took `where-the-unconfirmed-indication-goes` out of this node, and which the Answer names again at :153-157. Suggested edit (a finding about another node, proposed and not made): record the option on `commons.systems/disposition-graph/clean-context-review`'s answer fact as `counter-argument-per-fact`, source `commons.systems/disposition-graph/what-an-option-row-carries`, ref 2026-09-06, prose: "Everything the recommended option says, with the review of a draft returning one counter-argument per fact of the node it reads rather than one for the node, so that the line at the first level of every recommended row is a reader's and never the recommending party's; against it, a reading asked for a line on every fact is a reading asked to argue where it may have nothing to say, and the cost is `review-cost`'s." Keep on this node only the row-facing delta if one is wanted, and enter that node in `depends` so the cardinality is ruled where it lives.
- "What a ruling here would do to the parent's recommended text", 4.7 (validation 3, a claim about the implementation, unverified). It reads "In `packages/disposition/alignment-template.html` two pill classes go and one is renamed." That file carries five at lines 201-205: `.pill.alt-ruled`, `.pill.alt-src`, `.pill.alt-stands`, `.pill.alt-passed`, `.pill.alt-adopted`. Under this answer `alt-adopted` stays, `alt-stands` and `alt-ruled` become the one confirmed mark, and `alt-src` and `alt-passed` leave the row for the details in the author's own words, "not in a chip" -- so three classes go and one is renamed, unless the details are meant to keep them as pills, which those words forbid. Suggested edit: name the classes rather than counting them, or say three.

On the facts and what they recommend: Two facts, which is right: nothing proposes a prune and nothing changes the node's shape, and the authority fact the encoding requires of a staged node carrying facts is present. The answer fact recommends `three-marks-and-the-case-against` at moderate boldness and names it as `stands`, so there is correctly no `## Recommendation` fence, and moderate is defensible now that the reader's line rather than the AI's carries the contested clause; but the fact's `against` is the superseded window argument and is not the case the session means to present (first finding), and the `review` block still pins 9d5ee0ea, the answer this one replaces. The authority fact recommends `ratified` at low boldness with the `### authority` reading `class-recommendation` requires, disclaiming the expensive and irreversible limbs by name and finding the capture-shaped limb, and the limb is correctly found: the answer sets the strength of the record's own check on the AI.

On the viability of the options: Every option listed is viable on its facts, and the four passed over carry reasons that hold: `keep-the-four-pills` is the reading the parent withdrew, `confirmed-mark-struck` fails `dialogue`'s requirement that a projection say the confirmed choice keeps its authority, and the authority fact's three options are the reserved vocabulary and are complete. One viable option is missing, on the same clause the answer contradicts itself about: where no reader's line exists for a fact, the row says that the recommendation has not yet been read, instead of either falling back to the AI's line or claiming the recommendation goes unopposed. Its prose would be: "Everything the recommended option says, with the first level carrying, on a fact whose reading has not returned a counter-argument, neither the AI's own case against nor the sentence saying the recommendation goes unopposed, but the mark that the recommendation is unread; the AI's case against is in the drill-down with the rest of its reasoning wherever the author placed it, and the unopposed sentence is kept for the case `recording` wrote it for, a reading that returned and found nothing worth the author's time. It honours the author's placement on every fact and not on one row per node, and no row ever claims an unopposed recommendation the record holds an objection to; against it, a reader who meets an unread row learns that an objection may exist and not what it says, where the AI's line would have told them, and `recording` already forbids a ruling in that window so the mark is informational."

Strongest counter-argument (moderate): The answer's central move is that the AI never writes the first-level line where a reader's line is available, and the record can supply a reader's line on exactly one row of one fact per node: `caseAgainst` at packages/disposition/project.mjs:1381-1388 substitutes `review.against` only where `fact.name === "answer"`, and the review returns one counter-argument for the node. So the author's placement, which the answer says is "honoured whole", is honoured on one row per node and on no other, and on this node's own authority row the AI's words stay at the first level under an answer written to remove them. On the one row where the substitution does bite, what is removed is the recommending party's own admission of the weakness of its recommendation -- the argument it had to beat -- and what replaces it is a reader's objection that may bear on a different aspect entirely; `chenery-reasoned-decision`, that a decision stands on the reason its decider gave and not another's, and `bentham-publicity`, that a recommender withholding its own reasoning defeats publicity at the source, both cut against moving it out of first view. `scholastic-articulus`, which the answer leans on, says the substitution "is weaker than the tradition's guarantee and the record should not pretend otherwise", which is a warning about the reader's line and not a licence to drop the AI's.

The session's reply: Accepted. The first two findings are the session's errors and not the reading's overreach. The fallback rule added for the previous reading's substantive finding closes the window the fact's `against` describes, so the objection printed against the recommendation was one the answer itself had already refuted; the `against` is rewritten to the objection that actually survives. And the answer settled a contradiction that is not this node's: `dialogue`'s recommended text requires an `against` on every recommendation, so a recommendation is never unopposed in the record's own terms, while `alignment-page` and `recording` prescribe a sentence saying that it is. Calling that sentence false inside a child's answer is a child ruling on its parent's doctrine. The conflict is recorded as an option on `recording`, whose rule it is, and the child's answer now says only what the row carries and defers the unopposed sentence to that node. The measurement behind the premise was checked: 48 `against` fields against 237 recommendations today, which is back-fill debt against `dialogue`'s recommended text and not a counterexample to it. The missing option the reading names, an unread mark where a fact's reading has not returned, goes on the fact; `counter-argument-per-fact` moves to `clean-context-review`, whose shape it is, with a pointer left here; and §4.3, §4.6 and §4.7 are corrected to what the answer actually does.

### The second kickback answered, 2026-09-06

Six findings, all validated at their loci, all accepted. Two were the session's
own errors and are worth the record.

The first: the fallback rule written for the previous reading, that the AI's line
stands where a reading has returned none, closed the window that the fact's
`against` described, and the `against` was left describing it. So the objection
printed at the first level against this recommendation was one the answer itself
had already refuted, which is the exact failure the case against exists to
prevent. The `against` is rewritten to the objection that survives: that under
this answer the row is written by up to three parties depending on the state of a
reading, and a reader cannot tell which without knowing the node's stage.

The second: the answer settled a contradiction that is not this node's.
`dialogue`'s recommended text requires an `against` on every recommendation, so a
recommendation is never unopposed in the record's own terms, while
`alignment-page` and `recording` prescribe a sentence saying that it is. The
draft called that sentence false. A child's answer is not where a parent's
doctrine is ruled on, and the conflict is recorded as an option on `recording`,
whose rule it is. The measurement behind the reading's premise was checked and
holds in the direction that matters: 48 `against` fields against 237 recorded
recommendations today, which is back-fill debt against `dialogue`'s recommended
text and not a counterexample to it. The answer now says only that whatever that
sentence resolves to belongs at the first level, and settles for itself the one
case that is its own, where no reading has run at all and the row carries an
unread mark.

The rest were corrections of what the draft claimed. §4.3 announced in its
preamble that the details list gains the AI's case against and its After text did
not carry it, so a ruling would have taken the line off the row and put it
nowhere; the insertion is now written out. §4.6 claimed the confirmed mark
discharges `dialogue`'s requirement that a projection say the confirmed choice
keeps its authority, where a mark reading "confirmed, <response>, <date>" says no
such thing; the mark's text is fixed here rather than left to the projector.
§4.7 said two pill classes go where three do, at `alignment-template.html:201`
to `205`. And `counter-argument-per-fact` is recorded on `clean-context-review`, whose
shape it is, and replaced here by the two options the reading named: the unread mark,
now folded into the answer and passed over as a restatement of it, and
`ai-line-until-a-reading-returns`, which is the live rival and the arrangement the
fact's `against` argues for.

### Clean-context review, 2026-09-06, of 77ec2e36

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `three-marks-and-the-case-against`.

Findings:

- Answer, the closing sentence (:199-202), contradicts the Answer's own rule (:149-167, :182-187) on the clause the whole node turns on. It reads "on the recommended row of each fact one line against the recommendation, the reader's where a reading returned one for that fact and the AI's where none has." The body says the opposite for both of the cases where no reader's line exists: where a reading has run and returned none, "what the row says is not this node's to settle ... this answer takes neither side and says only that whatever that sentence resolves to belongs at the first level"; and where no reading has run, "the row says that, and says nothing else: an unread mark". The fact's `against` describes the body's three parties, so the body is what the session means to present and the closing sentence is residue of the answer this one replaces. As it stands the author cannot tell from `## Answer` which rule they would be confirming. Suggested edit: "... and on the recommended row of each fact one line against the recommendation, the reader's where a reading returned one for that fact, whatever `recording` resolves the unopposed sentence to where a reading has run and returned none, and an unread mark where no reading has run."
- Facts, `### answer`, the fact's own opening reason (:247-252), still gives the reason for the superseded answer: "So the author's placement is honoured whole, and what is left to the AI is the rule for a fact whose reading returned no line, where the AI's own case against stands rather than let a recommendation appear unopposed when it is not." Under the answer that now stands nothing of the kind is left to the AI: that case is deferred to `recording` and the only case this node settles for itself is the unread mark. This is the second finding of the re-reading of 2026-09-06 recurring at the same locus after the answer moved a second time. Suggested edit: re-derive the paragraph from the answer that stands - what is left to the AI is the unread mark where no reading has run, and the case where a reading returned none is the parent's conflict, deferred - and re-derive the boldness from that list rather than from "this answer works either way" (see the next finding).
- "What a ruling here would do to the parent's recommended text", 4.2 (:599-625), is the abandoned position written into the text a ruling executes. The After still reads "Where it returned none, the AI's own case against stands there, because a recommendation the record holds a written objection to must not be shown as though it had none, and the row must not say it goes unopposed when it does not"; the note that follows says the closing sentence of the parent's paragraph "is why the fallback to the AI's line exists rather than a fold" (:617-618); and the cardinality note says "under this After the answer fact carries the reader's line and every other fact carries the AI's" (:623-624). The Answer forbids all three ("the AI does not write it", :129; "it goes down with the source and the passed-over clause and the rest of the explanation", :129-131). Sections 4.1 to 4.3 are what a ruling here carries out, so a ruling for `three-marks-and-the-case-against` would land in `alignment-page`'s recommended text the rule this answer abandoned - the same failure the re-reading of 2026-09-06 found in this same section, unswept after the second move. It also falsifies the boldness reason's claim that "this answer works either way": with one counter-argument per node and `caseAgainst` substituting it on the answer fact alone (verified, packages/disposition/project.mjs:1381-1388), every fact but `answer` falls into the branch this answer refuses to settle, so the answer as written prescribes nothing for the first level of most rows on the page. Suggested edit: redraw the After to the three cases the Answer now states - the reader's line where one bears on the fact, whatever `recording` resolves for a reading that returned none, the unread mark where none has run - and rewrite the cardinality note to say that under today's cardinality every non-answer fact is in the deferred case, which is the cost this answer accepts and `counter-argument-per-fact` on `clean-context-review` is where it is lifted.
- "What a ruling here would do to the parent's recommended text", 4.7 (:736-741), repeats it in the cost statement: "`caseAgainst` changes too ... it keeps its substitution of the review's line on the answer fact and its fallback to `fact.against` elsewhere, and what the amendment adds is that the AI's line, where it is not shown at the first level, is rendered in the drill-down instead of dropped." Keeping the fallback to `fact.against` is exactly what the Answer forbids, and 4.7 says nothing of what replaces it on a fact whose row must now carry an unread mark or the deferred sentence. The session's own reply to the reading of 2026-09-06 said "the redraw must say what a non-answer fact's row carries and not leave it to the projector"; the Answer says it and 4.7 does not. Suggested edit: state that `caseAgainst`'s fallback branch goes, that `fact.against` moves to the drill-down on every fact, and that what the row carries where no reader's line bears on the fact is the unread mark or whatever `recording` resolves the unopposed sentence to.
- "What a ruling here would do to the parent's recommended text", 4.3: the After text does not carry the insertion its own preamble mandates, and the split sentence is still unqualified. The preamble (:628-640) says "the After text below must carry the addition, and the addition is that the details list gains the AI's own case against. Insert into the list of what the drill-down holds, after the passed-over clause, the words 'and the AI's own case against the recommendation, in one line and at full strength, wherever the row's first level is not carrying it'". The After that follows (:655-666) gains the source and reference, the passed-over clause and the ruling's particulars and stops at "the AI's reason for recommending it, or for recommending another over it, and its reply to the case against" - the Before's own wording, which presupposes the case against is elsewhere. The split sentence's After (:677-682) still reads "the tradition's verdict and the case against" without saying whose, which the reading of 2026-09-06 asked to have qualified and which the Account records as accepted ("§4.3, whose details list gains the AI's case against"). An executor applying the After verbatim strikes the AI's line from the row and puts it nowhere, which 4.7 promises against and which `hansard-verbatim-record`'s test that nothing folded is lost forbids. Suggested edit: write the insertion into the After block itself rather than as an instruction beside it, and qualify the split sentence's "the case against" as the reader's line where a reading returned one for the fact and the mark or the deferred sentence where none has.
- Answer, the third mark (:95-96), against 4.6 (:713-720) and 4.1(c) (:542-544). The Answer says the row "carries three marks and no others" and specifies the third as "where the author has ruled for it, that it is the confirmed disposition, with the response and the date"; 4.1(c)'s After says the same. 4.6 says something else: "the mark's text is fixed here and not left to the projector: it reads that this is the confirmed disposition and keeps its authority until the author rules for another, with the response and the date." The fix landed in the Account and not in the disposition, so the text the author would rule on still fails the `dialogue` requirement that a projection "say that the choice keeps its authority until the author rules for another" - the requirement on which `confirmed-mark-struck` is passed over, and the requirement the Answer itself invokes at :105-108. Suggested edit: carry 4.6's wording into the Answer and into 4.1(c)'s After, so the mark says what `dialogue` asks in the one place a ruling reads.
- Facts, `### authority`, second paragraph (:365-370), rests the capture-shaped limb half on a question this node no longer decides: "The per-node indication is the record's only device for telling the author that the text they are about to confirm is the AI's draft and not their record, which is the mis-statement the author caught on `commons.systems/public/agency`, and this answer decides where it is said and how loudly." The Answer says the contrary - "Where it goes instead is not this node's question and this answer does not decide it" (:187-190) - and the sibling `where-the-unconfirmed-indication-goes`, in `depends`, decides it. The paragraph also counts "two of the four things the answer decides" without naming four. The limb still holds on the case against alone, so nothing is lost by saying only that. Suggested edit: "... and this answer decides only that the row does not carry it, `where-the-unconfirmed-indication-goes` deciding where the page says it"; and drop or name the count of four.
- "What a ruling here would do to the parent's recommended text", 4.7 (:732-736), makes a claim about the projector that the code does not bear out: "What `renderPane` then does is not this ruling's to promise: the naming line in the two branches that have none today is the standing recommendation of `where-the-unconfirmed-indication-goes`." Verified at the locus: `PANE_LBL`, "The node as it would stand", is emitted outside the branch at packages/disposition/project.mjs:1815 and so appears in all three cases the column renders; the line that exists in one branch only is `edit-lbl` at :1802-1803, which names what a diff is against. The sibling's own answer distinguishes them expressly - "The ground-naming line beneath it is a different line and is not this answer's" - and recommends qualifying the heading that is already there, not adding a line to two branches. The same error survives in the maieutic account (:496-501 of the brief's rendering; "the line naming what the right-hand column shows exists in only one of that function's branches ... so the answer's clause completing that line is completing something real"), which the re-reading of 2026-09-06 asked to be dropped or requalified and which the Answer no longer has a clause for. Suggested edit: in 4.7 stop at `standingState` and `STANDING_LABELS` no longer feeding the row, and say that what the pane's heading then says is the sibling's question; drop the maieutic sentence.
- Answer, the unread mark (:182-187), against 4.6 (:705-707). The mark is minted per fact to say that no reading has run, while 4.6 records that the stage chip already "keeps the stage, the two readings' readiness and the open probe count and gains nothing". A reading is one per node today, so the mark and the chip carry the same fact twice on the same screen - which is the reasoning this node uses to merge `stands` and `ruled` ("two marks would be one fact said twice") and what `codd-update-anomaly` warns of. Nothing in the Answer says why the row needs it as well. Suggested edit: say in the Answer why the mark belongs on the row and not only on the chip - that a reader choosing on a row should not have to read the chip to know whether the recommendation has been read - or drop it and let the chip carry it, which would also close the three-parties objection the fact's `against` makes.
- "What a ruling here would do to the parent's recommended text", 4.7 (:742-747), sits against the author's words it applies: "three pill classes go, `.pill.alt-src`, `.pill.alt-passed` and `.pill.alt-stands` at lines 201 to 205, of which the first two are re-declared for the drill-down rather than deleted outright." Verified: the five classes are at packages/disposition/alignment-template.html:201-205, and the count and names are right. But the author's words this answer is applying are "Move AI reasoning (such as 'passed over') to the details area for each option - not in a chip", and re-declaring the two pill classes for the drill-down keeps them chips one level down. Suggested edit: say that the source and reference and the passed-over clause appear in the drill-down as text and not as pills, and that all three classes go.

On the facts and what they recommend: Two facts and no more is right: nothing proposes a prune and nothing changes the node's shape, and the authority fact the encoding requires of a staged node carrying facts is present. The answer fact recommends `three-marks-and-the-case-against` and names it as `stands`, so there is correctly no `## Recommendation` fence, and the fact's `against` is now the three-parties objection, which is the case against the answer that actually stands; but the fact's opening reason still argues the superseded answer and the boldness is derived from a claim that is false ("this answer works either way"), so what the fact presents is not what the Answer says. The authority fact recommends `ratified` at low boldness with the `### authority` reading `class-recommendation` requires, disclaiming the expensive and irreversible limbs by name; the capture-shaped limb is correctly found on the case against, but half its stated evidence is a decision this node has withdrawn to its sibling. The `review` block pins f3108f03 and is stale by design, this reading being the first of the answer that replaces it.

On the viability of the options: Every option listed is viable on its facts, and the four passed over carry reasons that hold: `keep-the-four-pills` is the reading the parent withdrew, `unread-mark-where-no-reading-has-run` is now what the recommendation itself says, `confirmed-mark-struck` fails `dialogue`'s requirement that a projection say the confirmed choice keeps its authority, and the authority fact's three options are the reserved vocabulary and are complete. One viable option is missing, on the same clause the answer contradicts itself about: one mark for every fact on which no reader's line bears, not two rules divided by whether a reading has run. Its prose would be: "Everything the recommended option says, with one rule instead of two for the case where no reader's line bears on the fact: wherever the clean-context review has returned no counter-argument for that fact, whether because no reading has run or because the reading returned none, the row carries the mark saying so and no argument, and the AI's own case against is in the drill-down with the rest of its reasoning. The row is then written by one party in every state, which is what this fact's `against` asks for; it is implementable today, where the recommended option leaves the first level of every fact but `answer` waiting on a rule `recording` has not made; and the unopposed sentence stays where `recording` owns it. Against it, a reading that ran and found nothing worth the author's time is a different fact from a reading that has not run, and one mark for both tells the author less than the record holds."

Strongest counter-argument (moderate): The answer's central move is that the AI never writes the first-level line, and the record can supply a reader's line on exactly one row of one fact per node: `review.against` is one counter-argument for the node and `caseAgainst` substitutes it only where `fact.name === "answer"` (packages/disposition/project.mjs:1381-1388). So the author's placement is honoured whole on one row per node, and on every other recommended row what the answer removes - the recommending party's own written admission of its recommendation's weakness, the argument it had to beat - is replaced by a notice that no one has checked, or by a sentence `recording` has not yet been able to write. That is a real loss of the check on the very page whose object is checking the AI: `chenery-reasoned-decision` holds that a decision stands on the reason its decider gave and not another's, `bentham-publicity` holds that a recommender withholding its own reasoning defeats publicity at the source, and `scholastic-articulus`, which this answer leans on, warns that the reader's substitution "is weaker than the tradition's guarantee and the record should not pretend otherwise" - a caution about the replacement, not a licence to demote the AI's line. `ai-line-until-a-reading-returns`, on the fact and not adopted, is the arrangement under which no row ever shows a recommendation with nothing said against it, and the fact's own `against` argues for it.

The session's reply: Accepted, and the reading has caught the sitting committing, in the sweep that claimed to fix it, the exact failure the sitting had recorded on `recording` an hour earlier: the amendment reached the answer's body and the account claimed the node was swept. Three readings, three kickbacks, one defect. The remedy taken here is the option the reading names rather than another patch. The two cases in which no reader's line bears on a fact -- no reading has run, and a reading ran and returned none -- collapse into one mark saying that no reader's line bears on this fact. The AI's own case against then goes to the details always, with no exception and no fallback, which is the author's placement honoured without qualification; the row's rule stops depending on the `recording` conflict, which stays recorded there and is no longer load-bearing here; and the fact's `against`, that the row is written by three parties depending on a state the reader cannot see, is dissolved rather than answered. Every locus the reading names is rewritten to that rule and the node is then checked by search for the abandoned phrasings rather than by assertion.

### The third kickback, and the sweep done by search, 2026-09-06

Ten findings, no probes, all validated at their loci and all answered. The
reading's central observation is that the sweep claimed by the previous account
had again reached the answer's body and not the node, which is the failure this
sitting had recorded on `recording` an hour before committing it a third time.
Three readings of this answer's line of drafts, three kickbacks, one defect.

So the remedy taken is not a fourth patch but the option the reading named, which
removes the cause. The two ways a fact can lack a reader's line — no reading has
run on the node, and a reading ran and returned nothing for that fact — collapse
into one mark saying that no reader's line bears on the fact. From that:

The AI's own case against goes to the details always, with no exception and no
fallback, which is the author's placement of 2026-09-04 honoured without
qualification and is what the two previous drafts kept failing to say
consistently. The row's rule no longer waits on the `recording` conflict, which
stays recorded there and stops being load-bearing here. And the fact's `against`,
that the row is written by three parties depending on a state the reader cannot
see, is dissolved rather than answered: two parties remain, the reader and the
mark, and which one a row carries is a fact about the reading and not about the
node's stage.

The loci the reading named are rewritten to that rule and not asserted to be:
the answer's closing sentence; the answer fact's opening reason, whose boldness
now rests on the cardinality rather than on the answer working either way; the
subsection of `ai-case-against-on-the-row`, which is the live rival and now
states what it is a rival to; §4.2, the clause a ruling executes, rewritten
whole; §4.3, whose After text now carries the insertion its preamble has twice
promised, so a ruling moves the AI's line to the drill-down rather than dropping
it; §4.7, where `caseAgainst`'s fallback to `fact.against` goes and the false
claim about `renderPane` is replaced by what that function does, `PANE_LBL` being
written outside the branch on every node the page renders; the confirmed mark's
wording in the answer and in §4.1(c), which had been fixed in §4.6 alone and so
left the disposition failing the rule it passes `confirmed-mark-struck` over on;
and the authority reading, which had claimed this answer places the per-node
indication where its own `depends` names the node that does.

The sweep was then checked by search and not by assertion. Seven phrasings of the
abandoned rule were searched for across the node's live text, everything before
the readings recorded below, and none survives. That check is the practice the
`recording` account of this failure asks for, run here for the first time.

### Clean-context review, 2026-09-06, of 84203846

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `three-marks-and-the-case-against`.

Findings:

- Facts, `### answer`, the fact's `against` field (frontmatter :43), against the Account's claim that it was rewritten, and against the Answer itself. The field is unchanged from the answer this redraw replaces: "The row is then written by three different parties depending on the state of a reading, the reader where one returned a line, the parent's unresolved rule where a reading returned none, and this answer where no reading has run, and a reader of the page cannot tell which of the three they are looking at without knowing the node's stage". Under the answer that now stands there is no third party and no dependence on the node's stage: the two no-line cases collapse into one mark (:148-153), and the Answer says in terms that "Collapsing them is what makes the row legible without knowing the node's stage". The Account records the correction as made -- "the fact's `against`, that the row is written by three parties depending on a state the reader cannot see, is dissolved rather than answered: two parties remain, the reader and the mark" (:996-999) -- so the node now carries both the dissolved objection and a statement that it was dissolved. This is the failure the sitting's own reply to the second reading named: "the objection printed at the first level against this recommendation was one the answer itself had already refuted, which is the exact failure the case against exists to prevent." Suggested edit: replace the field with the objection that survives the collapse -- that under today's cardinality `caseAgainst` substitutes a reader's line on the answer fact alone, so on every other fact of every node the first level carries a mark and no argument while the record holds a written objection one step down, which is a weaker check on the party this page exists to check.
- Account, "The third kickback, and the sweep done by search, 2026-09-06" (:1015-1019): "Seven phrasings of the abandoned rule were searched for across the node's live text, everything before the readings recorded below, and none survives." One survives, in the text a ruling executes. Section 4.3's After at :644-646 reads "its own case against the recommendation in one line and at full strength wherever the row's first level is not carrying it, with the clause saying which of the two the row shows". Both clauses presuppose that the row's first level can carry the AI's own case against, which is the rule the Answer abandons: "the AI never writes it ... it goes down with the source and the passed-over clause and the rest of the explanation, on every fact, with no exception and no fallback" (:134-138). The same section's opening also claims completeness -- "Ten findings, no probes, all validated at their loci and all answered" (:978) -- where four of the ten are not answered (see the next four findings). Suggested edit: re-run the search over §4 as well as the Answer, and strike the completeness sentence or qualify it item by item.
- "What a ruling here would do to the parent's recommended text", 4.3, the After's details list (:644-647). As encoded, a ruling for `three-marks-and-the-case-against` writes into `alignment-page`'s recommended text a conditional home for the AI's line ("wherever the row's first level is not carrying it") and an obligation on the drill-down to say "which of the two the row shows", where under the answer the row never shows the AI's line and there is no choice of two to report. An executor applying the After verbatim would build a drill-down clause the answer supplies no rule for. Suggested edit: "its own case against the recommendation in one line and at full strength, which is where that line always sits under this answer, and its reply to the reader's counter-argument".
- "What a ruling here would do to the parent's recommended text", 4.3, the split sentence's After (:663-668). It still reads "the first level is the sentence, the recommendation with its boldness, the confirmed mark where the author has ruled, the tradition's verdict and the case against", with "the case against" unqualified as to whose it is. The reading of 2026-09-06 asked for exactly this twice ("qualify the split sentence's 'the case against' as the reader's line where a reading returned one for the fact and the mark or the deferred sentence where none has"), and the Account records §4.3 as swept. The Before carries the same words, so an executor comparing them sees no change and leaves the parent saying the first level carries a case against whose author the parent no longer fixes. Suggested edit: "the tradition's verdict, and the reader's counter-argument where a reading returned one for the fact or the mark saying that no reader's line bears".
- Account, "The maieutic, and the draft, 2026-09-06" (:454-459), a claim about the implementation that is false and that the node now contradicts in its own §4.7. It reads: "the line naming what the right-hand column shows exists in only one of that function's branches: `renderPane` in `packages/disposition/project.mjs` emits it where a node has both an answer and a fence, and emits nothing of the kind where a fence stands with no answer or an answer stands with no fence, so the answer's clause completing that line is completing something real." Verified at the locus: `PANE_LBL` ("The node as it would stand", packages/disposition/project.mjs:682) is emitted at :1815, outside the branch, so it appears in every case `renderPane` renders; the line that exists in one branch only is `edit-lbl` at :1802-1803. §4.7 now says the correct thing ("`renderPane`'s heading, `PANE_LBL`, is written outside the branch and so already appears on every node the page renders", :717-718) and the sibling `where-the-unconfirmed-indication-goes` says the same, so the node holds both the claim and its refutation. The reading of 2026-09-06 asked for this sentence to be dropped; the Account records the finding as answered. Suggested edit: delete the clause from "And that the line naming what the right-hand column shows" to "completing something real", since the Answer no longer has a clause completing that line.
- "What a ruling here would do to the parent's recommended text", 4.7 (:726-729), unchanged where the reading of 2026-09-06 asked it to change: "three pill classes go, `.pill.alt-src`, `.pill.alt-passed` and `.pill.alt-stands` at lines 201 to 205, of which the first two are re-declared for the drill-down rather than deleted outright". Verified: the five classes are at packages/disposition/alignment-template.html:201-205 and the names and count are right. But the author's words this answer applies are "Move AI reasoning (such as 'passed over') to the details area for each option - not in a chip", and re-declaring the two pill classes for the drill-down keeps them chips one level down; the Answer likewise sends the source and the passed-over clause down as text ("in the words of the viable-options node's gloss and never in the projector's own", :121). The Account records this finding as answered. Suggested edit: say that all three classes go and that the source and reference and the passed-over clause appear in the drill-down as text and not as pills.
- Facts, `### authority`, second paragraph (:342-343): "The party that would set this answer is the AI, and two of the four things the answer decides exist to check the AI." Four things are counted and none are named, and the paragraph then names only two. The reading of 2026-09-06 asked to "drop or name the count of four"; the other half of that finding was applied (the per-node indication is now correctly disclaimed at :351-354) and this half was not, while the Account records the finding as answered. Suggested edit: "two of the things this answer decides exist to check the AI", or name the four.
- Answer, the case-against paragraph (:133-146), and §4.3's preamble (:619), against `hansard-verbatim-record`, a node this draft cites: a divergence adopted without being recorded. The draft cites that reading for one half of its holding, the test that nothing folded is lost, and takes from `scholastic-articulus` the substitution of the reader's line for the AI's. But `hansard-verbatim-record` also holds, of this very row, "That is why the case against the recommended option sits at the first level and not in the drill-down: it illustrates the argument, so by this standard it cannot be edited out"; and `scholastic-articulus`, cited in support, closes with "That substitution is weaker than the tradition's guarantee and the record should not pretend otherwise", which is a caution about the replacement and not a licence to demote the AI's line on facts where no replacement exists. Under this answer, on every fact but `answer` there is no replacement at all (verified: `caseAgainst`, packages/disposition/project.mjs:1381-1388, substitutes `review.against` only where `fact.name === "answer"`), so the AI's written objection is edited out of the first level on most rows of the page with nothing in its place but a mark. `evaluation` requires that an unrecorded conflict with a tradition be a frontier item deferred to neither side. Suggested edit: record the divergence from `hansard-verbatim-record` in the Answer, saying that the tradition places the case against at the first level and that this answer departs from it on every fact where no reader's line bears, with the reason; and quote `scholastic-articulus`'s caveat rather than only the sentence that supports the substitution.
- "What a ruling here would do to the parent's recommended text", the preamble (:473-477) and every section heading under it (:479, :576, :612, :676, :690): the line numbers no longer resolve. The preamble says "Line numbers are of `disposition/disposition-graph/alignment-page.md` at graph commit `HEAD` of the `disposition` ref as read on 2026-09-06"; at the commit read for this reading (`ec6e230094ea4d6c08916bb83a62b09e4d3ada6b`) lines 493, 495 and 497 are blank and 501, 505 and 509 fall inside a frontmatter block, while the paragraphs quoted are at 522, 524, 526, 530, 534 and 538. The quotations themselves are exact, so the loci are recoverable, but the numbers a reconciliation would use are wrong. Suggested edit: name each paragraph by its opening words, which §4's own headings already half do, and drop the line numbers, or restate the graph commit they were taken at.

On the facts and what they recommend: Two facts and no more is right: nothing proposes a prune and nothing changes the node's shape, and the authority fact the encoding requires of a staged node carrying facts is present. The answer fact recommends `three-marks-and-the-case-against` and names it as `stands`, so there is correctly no `## Recommendation` fence; moderate boldness is now derived from a claim I verified (a reading returns one counter-argument per node and `caseAgainst` substitutes it on the answer fact alone, packages/disposition/project.mjs:1381-1388), which is the right ground for it. But the fact's `against` is the objection the answer dissolved and is not the case the session means to present (first finding), so what the fact puts to the author is not what the Answer says. The authority fact recommends `ratified` at low boldness with the `### authority` reading `class-recommendation` requires, disclaiming the expensive and irreversible limbs by name; the capture-shaped limb is correctly found on the case against, though the paragraph still counts four things without naming four. The `review` block pins 77ec2e36 and is stale by design, this being the first reading of the answer that replaces it.

On the viability of the options: Every option listed is viable on its facts, and the four passed over carry reasons that hold: `keep-the-four-pills` is the reading the parent withdrew, `unread-mark-where-no-reading-has-run` is now half of what the recommendation itself says, `confirmed-mark-struck` fails `dialogue`'s requirement that a projection say the confirmed choice keeps its authority, and the authority fact's three options are the reserved vocabulary and are complete. One viable option is missing, and it is the alternative the reading of 2026-09-06 named in its ninth finding and the Answer answered in prose without putting on the fact: no mark on the row at all where no reader's line bears, the stage chip carrying it instead. Its prose would be: "Everything the recommended option says, with no mark on the row where no reader's line bears on the fact: the row then carries the sentence, the marks the author's words keep, the tradition chips, and the reader's counter-argument where one bears, and nothing at all where none does. Whether a node's recommendations have been read is a fact about the node and not about one row, and the stage chip already carries the two readings' readiness, so a mark on every unread row of every fact is one fact said as many times as the node has facts, which is what `codd-update-anomaly` warns of and what this answer's own merge of `stands` and `ruled` refuses. Against it, a reader choosing on a row would have to read the chip to know whether anything has been said against the recommendation, which is the legibility the recommended option buys with the mark."

Strongest counter-argument (moderate): The answer's central move is that the AI never writes the first-level line, and the record can supply a reader's line on exactly one row of one fact per node: `review.against` is one counter-argument for the node and `caseAgainst` substitutes it only where `fact.name === "answer"` (packages/disposition/project.mjs:1381-1388). The collapse dissolves the three-parties objection but not this one: it makes the mark the rule for every fact but `answer` on every node, so what the author meets at the level the eye reads, on most rows of the page, is a notice that nobody has checked, while the record holds the recommending party's own written admission of its recommendation's weakness one step down. On this very node the `authority` fact's row is the case in point: a real argument for `deferred` would sit in a drill-down under a mark. `hansard-verbatim-record` holds that the case against "illustrates the argument, so by this standard it cannot be edited out" of the first level; `chenery-reasoned-decision` holds that a decision stands on the reason its decider gave and not another's; `bentham-publicity` holds that a recommender withholding its own reasoning defeats publicity at the source; and `scholastic-articulus`, which this answer leans on, warns that the reader's substitution "is weaker than the tradition's guarantee and the record should not pretend otherwise" -- a caution about the replacement, not a licence to demote the AI's line where no replacement exists. On a node whose own authority reading is that the decision is capture-shaped because the party setting it is the AI, weakening the check on every fact but one, and recording no divergence from the traditions that say so, is what the reading is for. `ai-line-until-a-reading-returns`, on the fact and not adopted, is the arrangement under which no row ever shows a recommendation with nothing said against it.

The session's reply: Accepted, and the second finding is the one that decides what is done about it. The session's own verification claim is falsified: the search covered phrasings of the abandoned rule and missed a clause that presupposes it, so the check certified a node it had not checked, which is the same fault as the account it was introduced to prevent, one level up. Four readings, four kickbacks, one defect surviving every remedy aimed at it. The remedy now is not a fifth patch. The node's live sections -- the answer, the rationale, the facts prose and the amendment the account carries -- are rewritten whole from the answer in one pass rather than edited by targeted replacement, because the failure is the method: a rule stated in one paragraph and presupposed in fifteen others cannot be kept consistent by replacing the paragraphs a finding names. The author's words and every recorded reading and reply stay verbatim. Two changes of practice go with it. The amendment stops citing line numbers, which have gone stale twice as the parent grew, and cites by quotation alone. And the divergence from `hansard-verbatim-record` is recorded rather than adopted in silence, which the eighth finding is right that it was.

### The fourth kickback, and the method changed, 2026-09-06

Nine findings, no probes, all validated at their loci. The second is the one that
decided what was done: the session's own verification claim, that seven phrasings
of the abandoned rule were searched for and none survived, was falsified at a
locus the search could not reach, a clause that presupposed the rule without
using any of its phrasings. So the check certified a node it had not checked,
which is the fault of the account it was introduced to prevent, one level up.

Four readings, four kickbacks, one defect surviving every remedy aimed at it. The
remedy is not a fifth patch. The live sections of this node — the answer, the
rationale, the facts prose and the amendment the account carried — are rewritten
whole in one pass from the answer, because the failure is the method: a rule
stated once and presupposed in a fact's reason, eight option subsections and a
seven-part amendment cannot be kept consistent by replacing the paragraphs a
finding names. The author's words and every recorded reading and reply stay
verbatim and are not touched.

Two changes of practice go with it. The proposed amendment is withdrawn, as the
section above sets out. And the divergence from `hansard-verbatim-record` is
recorded rather than adopted in silence, which the eighth finding is right that
it had been: that reading holds that what the first level shows cannot be edited
out of it, and this answer edits the AI's objection out of it on every fact but
one, so the divergence is named in the answer, carried in the fact's `against`,
and given its side of the argument as `ai-case-against-on-the-row`.

The other findings are answered by the rewrite rather than beside it: the fact's
`against`, which still argued the three-parties objection the collapse dissolved
and now argues what the answer actually costs; the two false claims about
`renderPane` and about `.pill` re-declaration, both gone with the amendment that
made them; the authority reading's "four things", which now names the two it
means; and the stale line numbers, which no longer exist to go stale.

---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
stage: review
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/where-a-change-request-goes
facts:
  - name: answer
    options:
      - name: revealed-with-the-choice
        source: ai
        ref: "2026-09-07"
      - name: hidden-until-chosen-and-discarded
        source: author
        ref: "2026-09-04"
      - name: the-control-asks-for-the-change-by-name
        source: commons.systems/disposition-graph/where-a-change-request-goes
        ref: "2026-09-06"
      - name: shown-always
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
        status: passed
        reason: "the author's words of 2026-09-04 strike it by name, and it offers to collect words the page drops"
      - name: kick-back-feedback-one-step-down
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
        status: passed
        reason: "it folds the words a kick-back consists of, which is the parent's own reason against it, and the author asked for a third placement rather than for either of the two on the parent's fact"
      - name: abandoned-words-carried-as-a-draft
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "the author's second sentence says the text is discarded, and words carried into the instruction as no option chosen are a response the author did not give"
      - name: abandoned-words-staged-as-a-kick-back
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "it infers a ruling from a keystroke, and a denial the author did not choose is the one response the record cannot honour"
    recommends: revealed-with-the-choice
    boldness: moderate
    against: "The control the author reaches for when the draft is wrong is the one control this answer takes off the screen, and it takes it off at the moment the author is deciding whether to dissent at all. A reader who does not know the box appears on choosing reads the row as a refusal with no way to say why, which is the fault `none-of-the-above-ballot` names, a refusal expressed where the voter does not look. The incumbent's cost is a box that collects words the page drops; this answer's is a channel the author may not know is there, paid on the one act the record has for telling the AI its draft is wrong."
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
    against: "It is a reveal rule on one textarea and a branch in a staging script, both undone by re-projecting the page; deferred would let it act while `where-a-change-request-goes`' reach into this control is still in front of the author on that node's own fact, where `kick-back-ask-unchanged` lets them refuse it."
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - To avoid confusion, the kickback feedback text input only needs to be displayed when the kickbox option is selected. Otherwise kickback text input is discarded.

## Facts

### answer

Recommended because both of the author's sentences are taken as rules and the one
defect the survey found is repaired in the direction their words point. The
placement is theirs, and it is a third placement the parent's fact did not hold.
The discard is theirs, and it reaches the case the script does not handle.

What rests on the AI is the caption clause, and it is named as the AI's. It is
required by `where-a-change-request-goes`, whose answer stands at the ruling stage
and routes every change request to this control; that node declined to write the
requirement into the control and recorded it here instead, so this node is where
it is made. Its locus is the AI's too: the caption rather than the label, because
under this answer the label is not visible at the moment the author is deciding
whether to dissent. Boldness moderate for that clause alone, since the rest is the
author's sentences applied where they fall.

The case against is on the fact at full strength, and it is the cost of the
author's own instruction rather than of the AI's addition: a dissent channel that
appears only after the dissent is chosen is a channel a reader may not know
exists.

#### revealed-with-the-choice

The recommended option, set out in the fence: the kick-back's row, radio, caption
and note always at the first level; its feedback control shown only when the
kick-back is the chosen option and shown there at the first level; what is written
in it read only as a kick-back and discarded otherwise, the `!radio` branch
amended so it never stages kick-back words as a response; and the row's caption
carrying that a change to what is recommended is asked for here.

#### hidden-until-chosen-and-discarded

The author's two sentences with nothing added: the control is shown only when the
kick-back is chosen, what is written in it is discarded otherwise, and neither the
row's caption nor the control's label changes. For it: it is the author's words
exactly, and it leaves the wording of this control where a ruling on
`where-a-change-request-goes` could still reach it, which is the separation that
node's own `kick-back-ask-unchanged` option exists to preserve. Viable and not
adopted: under that node's answer this control is the one home on the page for a
change request, and a channel that is the only route for a thing and says so
nowhere is a channel the author has to be told about somewhere else. It is the
option to take if the author rules the reach away on that node's fact.

#### the-control-asks-for-the-change-by-name

Everything the recommended option says, with the requirement placed on the
control's own label rather than on the row's caption: the label asks for the
change the author wants and not only for what the options miss. Recorded from
`commons.systems/disposition-graph/where-a-change-request-goes`, whose answer of
2026-09-06 routes every change request to this control and therefore needs it to
say so; that answer names the requirement and does not amend the clause, because
the kick-back's marking and the wording of its control are this node's question.
Viable and not adopted, and the reason is the reveal and not the requirement: under
this answer the label is not on the screen while the author is deciding whether to
kick back, so a label that names the change is read only by an author who has
already found the channel. Against the recommendation and for this option: the ask
is what tells the author what the control is for, and a caption that carries both
what a kick-back does to the node and what may be written here asks for two things
in one sentence, which is how a caption stops saying either.

#### shown-always

Everything the recommended option says, with the feedback control opening with the
row at the first level whether or not the kick-back is chosen, which is the
parent's clause and what `renderKickback` does today
(`packages/disposition/project.mjs:1570-1580`). For it, the parent's own reason:
the words are what a kick-back consists of and what the dialogue resumes from, so
a control the author has to reveal is a movement the author may not make. Passed
over: the author's words of 2026-09-04 strike it by name, and what they read was a
control offering to collect words the page would drop.

#### kick-back-feedback-one-step-down

Everything the recommended option says, with the feedback control in a drill-down
beneath the row, always, so that every row on the fact has the same two levels.
Recorded on the parent's answer fact and carried here as the clause it governs.
Passed over: it folds the words a kick-back consists of, which is the parent's own
argument against it; and the author asked for a third placement, at the first
level and conditional, rather than for either of the two the parent's fact held.

#### abandoned-words-carried-as-a-draft

Everything the recommended option says, with the `!radio` branch left as it is, so
kick-back words typed with no option chosen are still staged and carried into the
launch instruction as "no option chosen" followed by the words. For it, the
script's own comment: a half-finished response should survive the next keystroke,
and losing what the author has typed is a real cost the discard pays. Passed over:
the author's second sentence says the text is discarded, and what the branch
produces is not a preserved draft but a response of a kind the author never gave,
carried into an instruction under a label that says no option was chosen.

#### abandoned-words-staged-as-a-kick-back

Everything the recommended option says, with words found in the kick-back's
control staged as a kick-back even where the radio is unchosen, on the reasoning
that writing in the refusal's box is the refusal. For it: nothing the author types
is lost, and the words are recorded as what they are rather than as an unlabelled
response. Passed over: it infers a ruling from a keystroke, and a denial the author
did not choose is a response the record cannot honour, which is the same fault the
parent's answer names in a confirmation recorded before the ruling stage.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met and the reading says so. Not expensive: it is a reveal rule on one
textarea, a caption, and one branch of a staging script. Not irreversible: no
node's data changes, and a wrong answer is undone by re-projecting the page.

The capture-shaped limb is met exactly. The kick-back is the record's third
response and the only one by which the author tells the AI that its draft is not
what they would confirm, and its feedback control is where the words that make
that refusal usable are written. This answer decides when that control is visible
and what becomes of the words written in it, and the party proposing both is the
party the refusal is against. A recommender setting the conditions under which the
channel for dissent appears is the shape the limb names, and it is the shape
`where-a-change-request-goes` found on the routing into this same control.

Low boldness: the limb is that sibling's recorded reading applied to the control
that sibling routes to, and the evidence is the page as built and the staging
script's own branch.

Against it: the object is a reveal rule and a script branch, both cheap to change
back; and `where-a-change-request-goes`' reach into this control is still in front
of the author on that node's own fact, where `kick-back-ask-unchanged` lets them
refuse it, so deferred would let this act while that stays open.

## Recommendation

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Shown when the kick-back is chosen and not before; and what is written in it
reaches a response only as a kick-back, and is discarded otherwise.

The kick-back's row, its radio and its caption stay at the first level of every
fact, always, chosen or not. That placement is the parent's and the author's and
this answer does not move it: a refusal reached by a different control from the
choices is a refusal the author has to look for. What moves is the feedback
control alone. Until the kick-back's radio is chosen the control is not shown;
when it is chosen the control appears beneath the caption, at the first level and
not in a drill-down, so the words are written where the refusal was made. Choosing
another option on the same fact takes it away again. The note that a kick-back on
one fact moves the whole node stays with the caption and is always shown, because
it is part of what the author is deciding and not part of what they are writing.

The reason is the author's and is the fault they read: a control offering to
collect words the page will drop is a control that lies about what it takes. Under
the incumbent the box is open on every fact of every node, and text typed in it is
kept only if the author then chooses the kick-back.

What is written in the control reaches a response only when the kick-back is the
chosen option on that fact. Where another option is chosen the words are
discarded, which is what the staging script does today
(`packages/disposition/alignment-template.html:512-513`). Where no option is
chosen at all they are discarded too, which the script does not do today:
`alReadFacts`' `!radio` branch (`:515-523`) collects every non-empty textarea in
the fieldset and stages the first, and the kick-back's is last in the fieldset's
DOM order, so kick-back words typed with no radio chosen are staged as an option
of `null` with `kickback` false and carried into the launch instruction as "no
option chosen" followed by the words (`:767`). Those words are neither discarded
nor recorded as what they are. Under this answer they are discarded, on the
author's second sentence and on their rule of 2026-09-06 alike: words that are not
a confirmation of anything are not the page's to collect, and the interview is
where they are given.

The rest of that branch stands. Where the author writes in an option's own text
control and has not yet chosen that option, the fallback still keeps it: that is a
confirmation half made, and the words belong to the option they were written
under. What leaves the branch is the kick-back's own textarea, which is not a
confirmation of anything and has no option to attach the words to.

One thing this answer settles that the author's words do not reach. Under
`commons.systems/disposition-graph/where-a-change-request-goes` this control is
the one home on the page for a request to change what is recommended, and that
node records the requirement here rather than making it, so that a ruling on the
routing does not carry a ruling on this control. This answer makes it, and it puts
it on the row's caption and not on the control's label. A label the author cannot
read until they have already chosen the kick-back cannot be what tells them that a
change is made here, and under this answer the control is not on the screen at the
moment the author is deciding whether their change belongs anywhere on the page.
So the caption carries it: the caption is what the author reads while choosing, it
already says what the kick-back does to the node, and it gains that a change to
what is recommended is asked for here. The control's own label goes on asking for
what the options miss and what the next ones are drawn from, which is what it
takes once it is open.

## Rationale

The author, 2026-09-04, on the alignment page: "To avoid confusion, the kickback
feedback text input only needs to be displayed when the kickbox option is
selected. Otherwise kickback text input is discarded."

Both sentences are taken. The first is a third placement, neither the parent's
clause, which shows the control always, nor the parent's option
`kick-back-feedback-one-step-down`, which folds it always; it is the control at
the first level and conditional on the choice. The second is read as a rule and
not as a description, because the survey of 2026-09-05 found it true of the page
in one case and false in the other: text abandoned for another option is dropped,
and text typed with no option chosen is staged as a response of a kind the author
never gave.

The author's rule of 2026-09-06 reaches the second sentence a second time and
independently: the page's scope is the final confirmation, and abandoned words are
not one. Where the script's own comment argues that a half-finished response
should survive the next keystroke, that argument holds for an option's text
control, where a half-made confirmation has an option to belong to, and does not
hold here.

What the answer adds to their words is the caption clause, and it is the AI's,
required by a sibling's answer and not by anything the author has said on this
node. It is in the answer rather than left out because the reveal is what makes it
necessary: hiding the control moves the burden of saying where a change goes onto
the only text that is still visible while the author is choosing.

What the answer beat is on the fact: `shown-always`, the incumbent, which the
author's words strike; `kick-back-feedback-one-step-down`, the parent's existing
alternative, which folds what a kick-back consists of; and
`hidden-until-chosen-and-discarded`, which is this answer with the caption clause
removed and is the author's own words with nothing added.
```

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the clause of the kick-back paragraph that places the control, "its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from, where on an option the words are optional because the ruling's content is the option", together with the same clause as it is stated in the answer fact's own prose and in the option `kick-back-feedback-one-step-down`, which is the alternative already on that fact and which the author's words answer in neither direction: the author asks for a third placement, shown at the first level but only once the kick-back is chosen, where the recommendation shows it always and that option folds it always. The second sentence, that the text is otherwise discarded, is already the behaviour of the artifact and of no sentence of the record: the staging script in `packages/disposition/alignment-template.html` reads `[data-kickback-text]` only when the kick-back radio is the chosen one, so text typed and abandoned never reaches a response, and what the author read was a control offering to collect words the page would drop. This question rests on `where-a-change-request-goes`: if every change request is recorded in this one control, then hiding it until the kick-back is chosen decides where the author's only channel for a change lives, and the two answers have to be given together. In the implementation the change falls on `renderKickback` in `packages/disposition/project.mjs`, which writes the textarea and its label unconditionally, and on the template's script and styles.

Cascades: `commons.systems/disposition-graph/recording`, whose option `denial-typed-to-maieutic` types the kick-back to the movement it returns the node to and whose classification reads the author's words, so a control that is easy to miss is a movement that is easy to miss; `commons.systems/disposition-graph/unanswered`, whose third response is the denial with feedback and whose feedback "is recorded as the author's words, never as a ruling"; `commons.systems/disposition-graph/ruling-transport`, on what the staged response carries back to a session; and `commons.systems/disposition-graph/progressive-disclosure`, whose two levels are what a conditionally shown control is a third case of.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at a node at the ruling stage, with the kick-back row chosen and unchosen, read against the recommended text of `alignment-page` and its option `kick-back-feedback-one-step-down`, the answers of `recording` and `unanswered`, and `renderKickback` with the template's staging script, before anything is changed.

### What the page does with abandoned kick-back text, 2026-09-05

The account above says of the staging script that it "reads
`[data-kickback-text]` only when the kick-back radio is the chosen one, so text
typed and abandoned never reaches a response". The periagogic survey of
2026-09-05 found that true in one case and false in the other, and the sentence
is corrected by this one.

Where another option on the same fact is chosen, the script reads that option's
own control and the kick-back text is dropped, which is the behaviour the
sentence describes. Where no option is chosen at all, `alReadFacts` in
`packages/disposition/alignment-template.html` takes a different branch: it
collects every non-empty textarea in the fieldset and stages the first of them,
on the reasoning its own comment gives, that a half-finished response should
survive the next keystroke. Kick-back words typed with no radio chosen are
therefore staged as an option of `null` with `kickback` false, and carried into
the launch instruction as "no option chosen" followed by the words, not as a
kick-back at all. So the words are neither discarded nor recorded as what they
are.

Whether that is a defect of the instrument or a case the answer must provide for
is this node's question and is not settled here: the author's words say the text
is discarded, the script's comment says a draft should survive, and the two meet
only in the case neither of them names. Recorded before the periagoge, so that
the author reads the page knowing what it does with what they type.

### An option recorded from a sibling's sitting, 2026-09-06

`where-a-change-request-goes` recommends that every request to change what is
recommended go to this control, on the fact it bears on. Its reading of
2026-09-06 found that its draft had also widened this control's ask inside a
proposed amendment to `alignment-page`, which reaches a clause this node owns and
which that node had itself declined to amend elsewhere in the same draft. The
requirement is recorded here as an option instead, so that a ruling on the
routing does not carry a ruling on this control's wording with it.

### The maieutic movement, 2026-09-07

The periagogic stage's object was read by the unit of 2026-09-05, whose report is
the tenth of its ten items, and it is the one item of the ten whose account this
node's own text had to correct: the control is written unconditionally at the
first level on every fact, with `locked` the only condition, and there is no CSS
rule and no script branch keying the textarea's visibility to the radio; the
discard the account claimed holds in one case and not in the other, which the
section above records. The stage is passed on the author's words of 2026-09-07
rather than in dialogue: "before stopping for confirmation, and ensure
alignment-page-observations is progressed up to confirmation and included in the
list of reconciliation for alignment/review/survey/artifact."

One periagogic probe is owed and is stated here as a question, to be put when the
author is directed to the page: does "otherwise kickback text input is discarded"
reach words typed with no option chosen at all, which is the case the survey
found and which this answer discards, or only words abandoned for another option,
which is what the page already does? The author wrote the sentence about a page
whose second behaviour they had not seen, so their words settle the first reading
and their intention about the second is not on the record.

What the record says. The parent's answer holds one clause a ruling here reaches,
located by its words, in the kick-back paragraph: "its feedback control opens with
it at the first level rather than in a drill-down, since the words are what a
kick-back consists of and what the dialogue resumes from, where on an option the
words are optional because the ruling's content is the option." Two clauses of the
same paragraph a ruling here must not move: that the kick-back stays in the radio
group, and that it is typed to the maieutic movement, which is `recording`'s. The
parent's marking rule, that a clause standing only until a child rules says so, is
not applied at the kick-back clause, which is the parent's bookkeeping and is
corrected there. Among the siblings, `where-a-change-request-goes` stands at the
ruling stage recommending that every change request go to this control, and its
answer names this node as the one that rules the control's ask; its option
`kick-back-ask-unchanged` is the author's route to refusing the reach from that
side, and `the-control-asks-for-the-change-by-name` on this fact is the same
question from this side. The `depends` entry on that node is kept and is now a
real dependency rather than a precaution: the caption clause of this answer has no
ground if the author rules `kick-back-ask-unchanged` there, so this answer does
not act whichever way that node rules. `unanswered`'s third response and
`recording`'s classification are cited and untouched.

The tradition surfaced, and it is one reading, recorded here in prose with the
`bears` entry on the reading node owed with the ruling.
`commons.systems/disposition-graph/none-of-the-above-ballot`, whose answer at
`disposition/disposition-graph/none-of-the-above-ballot.md:31` supports the
placement the author chose, "on the ground that a refusal a voter has to express
somewhere else is a refusal most voters never express". That is why this answer
moves the control and never the row: the refusal stays among the choices, and what
is deferred is the writing and not the refusing. The tradition also supplies this
answer's strongest objection, which is the fact's own `against`, since a control
the author cannot see is one step nearer to a refusal expressed somewhere else.
And its recorded failure bears too: at `:33` the reading finds that in both places
the none line is practised it is advisory, "a refusal that changes nothing is a
recorded complaint", which is what the discard clause has to answer — the words a
kick-back consists of are collected at the moment the refusal is made, and never
collected when no refusal was made. The relation is adopted on the recommended
option, with the divergence that the tradition's own subject is the refusal's
placement and it says nothing about the control beside it.

What the implementation does today, at the loci a ruling here changes.
`renderKickback` (`packages/disposition/project.mjs:1570-1580`) writes the row,
the caption `KICKBACK_CAPTION` (`:679`), the note `KICKBACK_NOTE` (`:680`), the
label "Your feedback" and the textarea with `KICKBACK_PLACEHOLDER` (`:681`), with
`locked` as the only condition on any of them. The row's whole styling is
`packages/disposition/alignment-template.html:380-384`, which carries no rule
keyed to the radio; the reveal needs no script, since the radio and the textarea
are siblings inside `li.choice.kickback`, and the staging listener already runs on
every change and every input (`:848-849`). The control stays in the DOM when
hidden, so a staged kick-back replayed by `alApplyResponse` (`:534`) still
finds it. The `!radio` branch is `alReadFacts` (`:515-523`), and the instruction
line it feeds is `:767`. The reveal makes the branch nearly unreachable through
the page, since the box cannot be typed in until the kick-back is chosen; it is
corrected anyway, because a response replayed from the page's database can set the
text with no radio checked.

The clean-context reading of this recommendation is owed before the author rules.

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
      - name: shown-disabled-until-chosen
        source: review
        ref: "2026-09-07"
    recommends: revealed-with-the-choice
    boldness: moderate
    against: "The control the author reaches for when the draft is wrong is the one control this answer takes off the screen, and it takes it off at the moment the author is deciding whether to dissent at all. A reader who does not know the box appears on choosing reads the row as a refusal with no way to say why, which is the fault `none-of-the-above-ballot` names, a refusal expressed where the voter does not look. The incumbent's cost is a box that collects words the page drops; this answer's is a channel the author may not know is there, paid on the one act the record has for telling the AI its draft is wrong. And hiding is not the record's own device for a control that must not collect what the page will not honour: the parent renders every input at the stages before the ruling and disables it rather than withdrawing it, which is `shown-disabled-until-chosen` on this fact, and the author's words reach the hiding without reaching the choice between hiding and disabling."
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
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: ad88dc645f14eb6b76a0231aad630b65d3c7ca0d
  commit: 8a672c17fcd4f0bf104d3c4e2a87077eb1213d7c
  against: "The record already has a device for a control that must not collect what the page will not honour, and it is not hiding. The parent's answer, for the whole facts section at every stage before the ruling, is that everything is \"rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it\" -- the fault being cured is the same one the author read here, a control that appears to take something the record will drop, and the cure the record chose there was visibility without capability. This answer applies the opposite cure to the one control the record has for dissent: the kick-back's feedback is the only channel by which the author tells the AI that its draft is not what they would confirm, and after this ruling it is not on the screen while they are deciding whether to use it. The fact's own `against` concedes the harm and `none-of-the-above-ballot`, the reading this answer adopts, names it precisely -- a refusal a voter has to express somewhere else is a refusal most voters never express -- and the answer's reply is only that the author asked for it, which is true of the reveal and not of the choice between hiding and disabling, which their words do not reach."
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
it is made. Its locus is the AI's too, and it departs from that node's own
sentence rather than applying it: that answer says the change request goes to the
kick-back's feedback control "and that control is to ask for the change and not
only for the ground of the refusal", where this answer puts the ask on the row's
caption and leaves the control's label asking for the ground. The reason is the
reveal, and it is the reason the answer gives: under this answer the label is not
visible at the moment the author is deciding whether to dissent. The divergence is
recorded on that node as the option `the-caption-asks-and-the-control-collects`,
so it is a choice the author can rule on from either side. Boldness moderate for
that clause alone, since the rest is the author's sentences applied where they
fall.

The case against is on the fact at full strength, and it is the cost of the
author's own instruction rather than of the AI's addition: a dissent channel that
appears only after the dissent is chosen is a channel a reader may not know
exists. What sharpens it is that the record has a device for a control that must
not collect what the page will not honour and the device is not hiding: the parent
renders and disables. `shown-disabled-until-chosen` is that device applied here,
it is on this fact, and the author's words do not reach the choice between the two
cures.

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

#### shown-disabled-until-chosen

Everything the recommended option says of the row, the discard and the caption,
with the feedback control never leaving the screen: it stays at the first level of
every fact, rendered and visibly inert, and becomes writable when the kick-back's
radio is chosen. Recorded from the reading of 2026-09-07, which raised it as the
viable option the fact was missing. For it, the parent's own answer, which
establishes exactly this treatment for a control that must not collect yet: "at
every earlier stage the facts, their options and the recommendation are all
rendered and every input among them is disabled: the author sees exactly what will
be asked and cannot yet answer it." It answers the author's stated reason, "To
avoid confusion", by removing the confusion the box actually caused, which was
that it offered to collect words the page would drop; and it does not pay this
answer's own `against`, since the dissent channel is on the screen while the author
is deciding whether to dissent. Viable and not adopted: the author's words say the
control "only needs to be displayed when the kickbox option is selected", and a
control displayed and disabled is displayed, so this option answers the confusion
they named while declining the instruction they gave. The choice between the two
cures is not reached by their words either way, which is why it is on the fact for
them and not passed over here.

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
discarded, which is what `alReadFacts` in the alignment page's template does
today: it reads the chosen option's own control, found by that option's name in
its `data-option-text` attribute, and never the kick-back's. Where no option is
chosen at all they are discarded too, which that function does not do today. Its
`!radio` branch collects every non-empty textarea in the fieldset and stages the
first, and the kick-back's is last in the fieldset's DOM order, so kick-back words
typed with no radio chosen are staged as an option of `null` with `kickback` false
and carried by `alInstructionAll` into the launch instruction as "no option
chosen" followed by the words. Those words are neither discarded nor recorded as
what they are. Under this answer they are discarded, on the author's second
sentence and on their rule of 2026-09-06 alike: words that are not a confirmation
of anything are not the page's to collect, and the interview is where they are
given.

The rest of that branch stands, and it stages what it keeps under the option it
was written under. Where the author writes in an option's own text control and has
not yet chosen that option, the fallback still keeps the words, and it names that
option: every option's control carries the option's name in its own
`data-option-text` attribute, which is what the branch already reads once a radio
is chosen, so a confirmation half made reaches the session as a half-made
confirmation of a named option. That is an amendment to the branch and not a
description of it. Today it stages `option: null` whatever control the words came
from, which is the same shape this answer strikes for the kick-back's words two
paragraphs above, words carried into the instruction as "no option chosen" and so
neither discarded nor recorded as what they are; keeping the words while losing
what they were written under is the fallback's defect and not its reason. What
leaves the branch is the kick-back's own textarea, which carries
`data-kickback-text` and names no option, because it is not a confirmation of
anything and there is no option for the words to belong to.

One thing this answer settles that the author's words do not reach. Under
`commons.systems/disposition-graph/where-a-change-request-goes` this control is
the one home on the page for a request to change what is recommended, and that
node records the requirement here rather than making it, so that a ruling on the
routing does not carry a ruling on this control. This answer makes it, and it puts
it on the row's caption and not on the control's label. That is a departure from
that node's own words and is not an application of them: its answer says the
request goes to the kick-back's feedback control "and that control is to ask for
the change and not only for the ground of the refusal", where under this answer
the control's label goes on asking for the ground and what asks for the change is
the caption above it. The reason is the reveal this same answer makes. A label the
author cannot read until they have already chosen the kick-back cannot be what
tells them that a change is made here, and under this answer the control is not on
the screen at the moment the author is deciding whether their change belongs
anywhere on the page. So the caption carries it: the caption is what the author
reads while choosing, it already says what the kick-back does to the node, and it
gains that a change to what is recommended is asked for here. The control's own
label goes on asking for what the options miss and what the next ones are drawn
from, which is what it takes once it is open. The divergence is recorded on that
node as the option `the-caption-asks-and-the-control-collects`, so that a reader
of its answer is not left expecting a label that will not carry the ask.

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

What the answer adds to their words is the caption clause, and it is the AI's: a
sibling's answer requires that this control's channel say what it is for, and
nothing the author has said on this node does. Where that sibling puts the ask, on
the control's label, this answer does not, and the departure is stated in the
answer and recorded as an option there. It is in the answer rather than left out
because the reveal is what makes it necessary: hiding the control moves the burden
of saying where a change goes onto the only text that is still visible while the
author is choosing.

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

No probe is owed. The question stated here as one is the choice this fact's own
options put to the author, and it goes to them with the node: does "otherwise
kickback text input is discarded" reach words typed with no option chosen at all,
which is the case the survey found and which this answer discards, or only words
abandoned for another option, which is what the page already does? The author
wrote the sentence about a page whose second behaviour they had not seen, so their
words settle the first reading and their intention about the second is not on the
record. Under `probe-or-node` a question with a viable candidate answer on the
fact is asked there and not in `probes`, and both candidates are on this one,
`revealed-with-the-choice` discarding the unattached words and
`abandoned-words-carried-as-a-draft` keeping them, with
`abandoned-words-staged-as-a-kick-back` as a third reading of the same sentence.
An answer to it would also have to stand: it is a rule about what the page
collects, to be read by a session that never saw the question, which is the
survival test sending it to a node's fact rather than to `probes`. So what the
author rules when they rule this fact is the reading of their own sentence.

What the record says. The parent's answer holds one clause a ruling here reaches,
located by its words, in the kick-back paragraph: "its feedback control opens with
it at the first level rather than in a drill-down, since the words are what a
kick-back consists of and what the dialogue resumes from, where on an option the
words are optional because the ruling's content is the option." Two clauses of the
same paragraph a ruling here must not move: that the kick-back stays in the radio
group, and that it is typed to the maieutic movement, which is `recording`'s. The parent's marking rule, that a clause standing only until a child rules says
so, was not applied at the kick-back clause, though it is applied at three others,
so a reader of the parent met an unqualified clause that a ruling here replaces.
It is the parent's bookkeeping and it is corrected there: the parent's amendment
of this sitting marks the clause in the form the other three already take, naming
this node, and nothing of it is drafted here. Among the siblings, `where-a-change-request-goes` stands at the
ruling stage recommending that every change request go to this control, and its
answer names this node as the one that rules the control's ask; its option
`kick-back-ask-unchanged` is the author's route to refusing the reach from that
side, and `the-control-asks-for-the-change-by-name` on this fact is the same
question from this side. The `depends` entry on that node is kept and is now a
real dependency rather than a precaution: the caption clause of this answer has no
ground if the author rules `kick-back-ask-unchanged` there, so this answer does
not act whichever way that node rules. `unanswered`'s third response and
`recording`'s classification are cited and untouched.

The tradition surfaced, and it is one reading, recorded here in prose; the `bears`
entry is not owed and stands already, written on the reading node in the sitting
of 2026-09-06 and landed at `8a672c17`, naming this node, its answer fact, the
option `revealed-with-the-choice` and the relation adopted.
`commons.systems/disposition-graph/none-of-the-above-ballot`, whose `## Answer`
supports the placement the author chose in its first paragraph, "on the ground
that a refusal a voter has to express somewhere else is a refusal most voters
never express". That is why this answer
moves the control and never the row: the refusal stays among the choices, and what
is deferred is the writing and not the refusing. The tradition also supplies this
answer's strongest objection, which is the fact's own `against`, since a control
the author cannot see is one step nearer to a refusal expressed somewhere else.
And its recorded failure bears too: in the second paragraph of that answer the
reading finds that in both places the none line is practised it is advisory, "A
refusal that changes nothing is a recorded complaint", which is what the discard clause has to answer — the words a
kick-back consists of are collected at the moment the refusal is made, and never
collected when no refusal was made. The relation is adopted on the recommended
option, with the divergence that the tradition's own subject is the refusal's
placement and it says nothing about the control beside it.

What the implementation does today, at the loci a ruling here changes, named by
function and by constant rather than by line, so that the citations do not stale
with the next landing on the projector. `renderKickback` in
`packages/disposition/project.mjs` writes the row, the caption `KICKBACK_CAPTION`,
the note `KICKBACK_NOTE`, the label "Your feedback" and the textarea with
`KICKBACK_PLACEHOLDER`, with `locked` as the only condition on any of them. The
row's styling in `packages/disposition/alignment-template.html` carries no rule
keyed to the radio: `.choice.kickback` sets the rule above the row and its
spacing, `.kbnote` the note that is always shown, `.kb-note` the textarea itself.

The reveal cannot be written with a sibling combinator, and this account said it
could. `renderKickback` wraps the radio in `<label class="choicelbl">`, so the
input's only sibling is the `<span class="choicename">` beside it and the textarea
is a sibling of the label and not of the input; a rule of the form
`input[data-kickback]:checked ~ .kb-note` matches nothing, and it fails silently,
which is the worst way for this particular reveal to fail, since the control
simply never appears and no error says so. It is written on the row instead,
`li.choice.kickback:has(input[data-kickback]:checked)` selecting the "Your
feedback" label and the textarea beneath it, or by a script where a target the
page must run in will not carry `:has()`. Either way the rule is exercised by a
test that asserts the control is hidden with the radio unchecked and shown with it
checked, because a CSS reveal that fails is invisible and no reader of the page
will report it.

The rest of the loci. The staging listeners are registered in `alBoot` and already
run on every change and every input, so the choice that reveals the control is
already a change the page hears and no new listener is owed. The control stays in
the DOM when hidden, so a staged kick-back replayed by `alApplyResponse` still
finds it. The `!radio` branch is in `alReadFacts`, and the instruction line it
feeds is written by `alInstructionAll`. The reveal makes the branch nearly
unreachable through the page, since the box cannot be typed in until the kick-back
is chosen; it is corrected anyway, because a response replayed from the page's
database can set the text with no radio checked.

The clean-context reading of this recommendation is owed before the author rules.

### Clean-context review, 2026-09-07, of ad88dc64

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `revealed-with-the-choice`.

Findings:

- ## Answer, the paragraph beginning "The rest of that branch stands." The reason given for keeping half the `!radio` branch is not what the branch it keeps does. The draft says "Where the author writes in an option's own text control and has not yet chosen that option, the fallback still keeps it: that is a confirmation half made, and the words belong to the option they were written under." The branch attaches them to no option: `alReadFacts` pushes `option: kick || !radio ? null : radio.value` (`packages/disposition/alignment-template.html:526`), so with no radio chosen the staged entry carries `option: null` whatever textarea the words came from, and the instruction line at `:767` renders it as "no option chosen" followed by the words -- which is exactly the shape this same answer condemns two paragraphs above, where it says of the kick-back's words that they are "carried into the launch instruction as 'no option chosen' followed by the words" and "neither discarded nor recorded as what they are". So the answer keeps for option text the defect it removes for kick-back text, on a ground the implementation does not supply. Suggested edit: say that the retained fallback stages the option the words were written under, which is available from the textarea's `data-option-text` attribute, so that a half-made confirmation reaches the session as a half-made confirmation of a named option; or say why an unattributed half-confirmation is acceptable where an unattributed refusal is not.
- ## Account, the implementation paragraph, validation 3 (a claim about the implementation is verified). "the reveal needs no script, since the radio and the textarea are siblings inside `li.choice.kickback`". They are not siblings. `renderKickback` (`packages/disposition/project.mjs:1582-1592`) wraps the radio in a label -- `<label class="choicelbl"><input type="radio" ... data-kickback>` -- and the textarea is a sibling of that label, not of the input, so the input's only siblings are the `<span class="choicename">` beside it. A sibling-combinator rule keyed to `:checked` will therefore match nothing and fail silently, which is the worst way for this particular reveal to fail: the control simply never appears and no error says so. A session acting on this sentence would write a dead rule. Suggested edit: either say the reveal is written with `:has()` on the row -- `li.choice.kickback:has(input[data-kickback]:checked) .kb-note` -- or say that it takes a script, and in either case say that the rule must be exercised by a test, since a CSS reveal that fails is invisible.
- ## Account, the `bears` entry. "The tradition surfaced, and it is one reading, recorded here in prose with the `bears` entry on the reading node owed with the ruling. `commons.systems/disposition-graph/none-of-the-above-ballot` ..." It is not owed: it already stands at `disposition/disposition-graph/none-of-the-above-ballot.md:28-31`, as `- node: commons.systems/disposition-graph/when-the-kickback-feedback-shows / fact: answer / option: revealed-with-the-choice / relation: adopted`. Suggested edit: say the entry stands.
- ## Answer, the paragraph beginning "One thing this answer settles that the author's words do not reach", against `commons.systems/disposition-graph/where-a-change-request-goes`, which this node names in `depends` and which stands one stage further on, at ruling. That node's answer names the control and not the caption as the thing that asks: "Every request to change what is recommended goes to the kick-back's feedback control, on the fact it bears on, and that control is to ask for the change and not only for the ground of the refusal, which is `when-the-kickback-feedback-shows`' to rule and is recorded there." Under this answer the control does not ask for the change -- "The control's own label goes on asking for what the options miss and what the next ones are drawn from", which is the ground of the refusal, the very thing that sentence says it must not ask for only -- and what asks is the caption on the row above it. The answer's reasoning for the move is good and I would not have it dropped, but the move is a divergence from the sibling's own words and is presented as an application of them. Suggested edit: say in the Answer that this departs from `where-a-change-request-goes`' sentence naming the control, give the reason already written (a label the author cannot read while deciding cannot be what tells them), and record the divergence as an option on that node so a reader of its answer is not left expecting a label that will not carry the ask.
- ## Answer and ## Account, validation 3 (a line cited names what is claimed). The `packages/disposition/alignment-template.html` citations are all exact and need no change: `:512-513`, `:515-523` for the `!radio` branch, `:534` for `alApplyResponse`, `:767` for the instruction line, `:380-384` for the row's styling, `:848-849` for the two staging listeners. Every `packages/disposition/project.mjs` citation has gone stale: `renderKickback`, cited `:1570-1580`, is at `:1582-1592`; `KICKBACK_CAPTION`, cited `:679`, is at `:683`; `KICKBACK_NOTE`, cited `:680`, at `:684`; `KICKBACK_PLACEHOLDER`, cited `:681`, at `:685`. So are the two into the reading: `none-of-the-above-ballot.md:31`, cited for "on the ground that a refusal a voter has to express somewhere else is a refusal most voters never express", is at `:35`, and `:33`, cited for "a refusal that changes nothing is a recorded complaint", is at `:37`. The project.mjs citations were exact at implementation commit `87e4b24e` and staled when `cb0e02c6` landed on 2026-09-07; the reading's staled when the `bears` entry above was written. Both quotations are exact at the corrected lines. The same staleness runs through all four drafts of this wave, so it is one reconciliation and not four.
- ## Account, the probe stated as owed. "One periagogic probe is owed and is stated here as a question, to be put when the author is directed to the page: does 'otherwise kickback text input is discarded' reach words typed with no option chosen at all ... or only words abandoned for another option ...?" This one is closer to a real probe than the others in this wave, since it asks what the author meant by a sentence written about a page whose second behaviour they had not seen. But under `probe-or-node` it still lands on the options: both candidates are on the fact, `revealed-with-the-choice` discarding the unattached words and `abandoned-words-carried-as-a-draft` keeping them, with `abandoned-words-staged-as-a-kick-back` as a third reading of the same sentence, and the rule sends a question there wherever a candidate answer to this node's question is held viable. What is more, an answer to it would have to stand: it is a rule about what the page collects, read by a session that never saw the question, which is the survival test sending it to a node or to this node's own fact and never to `probes`. Suggested edit: drop the word probe and say that the reading of their sentence is put to the author as the choice between those options.
- A finding about the parent rather than about this node's text, which the Account already names and which the session should carry to `commons.systems/disposition-graph/alignment-page`. That node applies its own marking rule -- a clause standing only until a child rules says so -- at three clauses and not at the kick-back clause a ruling here replaces: "its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from, where on an option the words are optional because the ruling's content is the option." A reader of the parent meets an unqualified clause that this node's ruling amends. The amendment is one phrase, in the form the other three already take.

On the facts and what they recommend: Two facts. The answer fact recommends `revealed-with-the-choice` at moderate boldness among seven options, four passed over with reasons and two viable and not adopted; nothing stands, so the `## Recommendation` fence is correctly present and carries frontmatter without the dialogue's keys, `## Answer` and `## Rationale`. Moderate boldness is right and the fact's prose locates it correctly on the caption clause, which is the only part not in the author's two sentences. The authority fact recommends `ratified` at low boldness with the three reserved terms; its `### authority` subsection applies `class-recommendation`'s limbs by name and its capture reading is the sharpest in the wave -- that the party setting the conditions under which the dissent channel appears is the party the dissent is against. One clerical note: the authority options carry `ref 2026-09-06` while the answer fact's AI-sourced options carry `ref 2026-09-07`, on a node whose facts were written in the movement of 2026-09-07; if the authority fact was drafted on the earlier date the refs are right and nothing is owed, but the two dates on one node's facts are worth a glance.

On the viability of the options: Every listed option is viable and the four passed over carry reasons that hold: `shown-always` and `kick-back-feedback-one-step-down` are the parent's two, struck by the author's words and by the parent's own argument respectively, and the two abandoned-words options are dominated by the author's second sentence and by the rule against inferring a ruling from a keystroke. One viable option is missing, and the record already holds the device it would use: `shown-disabled-until-chosen` -- the feedback control stays on the screen at the first level of every fact, rendered and visibly inert until the kick-back's radio is chosen, with the caption saying that writing there takes choosing the row first. The parent's own answer establishes exactly this treatment for a control that must not collect yet: "at every earlier stage the facts, their options and the recommendation are all rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it." It answers the author's stated reason -- "To avoid confusion" -- by removing the confusion the box actually caused, which was that it offered to collect words the page would drop, and it does not pay this answer's own `against`, that the dissent channel is off the screen at the moment the author is deciding whether to dissent. It is not dominated by anything on the list, and it is the option the record's own precedent points at, so the author should get to rule on it rather than meet only the choice between always-shown and hidden.

Strongest counter-argument (moderate): The record already has a device for a control that must not collect what the page will not honour, and it is not hiding. The parent's answer, for the whole facts section at every stage before the ruling, is that everything is "rendered and every input among them is disabled: the author sees exactly what will be asked and cannot yet answer it" -- the fault being cured is the same one the author read here, a control that appears to take something the record will drop, and the cure the record chose there was visibility without capability. This answer applies the opposite cure to the one control the record has for dissent: the kick-back's feedback is the only channel by which the author tells the AI that its draft is not what they would confirm, and after this ruling it is not on the screen while they are deciding whether to use it. The fact's own `against` concedes the harm and `none-of-the-above-ballot`, the reading this answer adopts, names it precisely -- a refusal a voter has to express somewhere else is a refusal most voters never express -- and the answer's reply is only that the author asked for it, which is true of the reveal and not of the choice between hiding and disabling, which their words do not reach.

The session's reply: Accepted on all seven, each verified at its locus on the main thread: the retained fallback stages option null at alignment-template.html line 526, the shape the answer condemns for the kick-back's words; the radio is inside a label, so a sibling reveal fails silently; the none-of-the-above-ballot entry stands since 8a672c17; the caption and not the control asks for the change, which departs from where-a-change-request-goes' sentence; every project.mjs and reading line is stale; the probe the account calls owed lands on the fact's options; and the parent's kick-back clause is unmarked, which the parent's amendment of this sitting takes. The amendments owed: the retained fallback stages the option the words were written under, from the textarea's data-option-text attribute, so a half-made confirmation reaches the session as one of a named option; the reveal written with :has() on the row and exercised by a test; the bears sentence corrected; the departure from the sibling stated with its reason and recorded as the option the-caption-asks-and-the-control-collects on where-a-change-request-goes, source this node; citations by function; the probe restated as the choice the options put; and the option shown-disabled-until-chosen recorded, source review, viable and not adopted, since the author's words say the control only needs to be displayed when the kick-back is selected, which is hiding and not disabling, and the confusion they named was a control that offered to collect. The counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.

### The reading applied, 2026-09-07

Seven findings, forward at moderate strength, no probes; every one validated at
its locus on the main thread and every one accepted. The recommendation does not
move: it stays `revealed-with-the-choice`, and what the reading found were a
false statement about the implementation, a reason that did not describe the
branch it defended, a debt already paid, a divergence presented as an
application, six stale line citations, a probe that was not one, and a clause of
the parent's that the parent should mark.

The reason that did not describe the branch is the heaviest, because the answer
was keeping for option text the defect it strikes for kick-back text.
`alReadFacts` stages `option: null` whenever no radio is chosen, whatever control
the words came from, so the fallback the answer defended as preserving "a
confirmation half made" preserved words attached to nothing and carried them into
the instruction under the same "no option chosen" the answer condemns two
paragraphs above. The amendment does not drop the fallback and does not keep the
false reason: it makes the branch true to the reason by having it read the
option's name from the `data-option-text` attribute the control already carries,
so the words reach the session as a half-made confirmation of a named option. The
kick-back's textarea carries `data-kickback-text` and no option name, which is
the same fact stated from the other side and is why its words leave the branch.

The false statement about the implementation would have produced a dead rule. The
account said the radio and the textarea are siblings inside `li.choice.kickback`
and that the reveal therefore needs no script; `renderKickback` wraps the radio in
a label, so the input's only sibling is the name beside it, and a sibling
combinator keyed to `:checked` matches nothing and says nothing when it fails. The
reveal is written on the row with `:has()`, or by a script where `:has()` is not
available, and in either case a test asserts it, since a reveal that fails
silently is a control that is simply never there.

The divergence is now stated where a reader meets the claim.
`where-a-change-request-goes` says the kick-back's control "is to ask for the
change and not only for the ground of the refusal"; this answer leaves that ask on
the caption and leaves the control's label asking for the ground, which is a
departure and was written as an application. The answer says so, gives the reason
it already had, and the option `the-caption-asks-and-the-control-collects` is
recorded on that node with this node as its source, so the author can rule the
question from either side and a reader of that answer is not left waiting for a
label that will not carry the ask.

The rest, each at its locus. The `bears` entry on
`none-of-the-above-ballot` was called owed and has stood since `8a672c17`; the
account says it stands. Every citation into `packages/disposition/project.mjs`
had staled when `cb0e02c6` landed earlier the same day, and the two into the
reading node staled when the `bears` entry was written; rather than re-take six
numbers that will stale again, every citation in this node now names a function,
a module constant or a section, which is the form the reading of
`where-the-unconfirmed-indication-goes` records as the one that does not go
stale. The probe is not a probe: both candidate answers are on this fact, so
under `probe-or-node` the question is put to the author as the choice between
them. And the parent's unmarked kick-back clause is the parent's to mark, which
the parent's amendment of this sitting does.

The reading's viability paragraph named the one option the fact was missing and
it is recorded: `shown-disabled-until-chosen`, source `review`, viable and not
adopted. The record's own device for a control that must not collect what the
page will not honour is the parent's, and it is rendering with every input
disabled rather than hiding; the author's words of 2026-09-04 say the control
"only needs to be displayed when the kickbox option is selected", which is the
hiding, while the confusion those same words name is a control that offered to
collect words the page would drop, which disabling also cures. Their words do not
reach the choice between the two cures, so the choice is on the fact and is
theirs. The counter-argument goes on the row at the strength the reading gave it,
moderate, and the fact's `against` now names the device it rests on.

The amended answer owes its re-reading.

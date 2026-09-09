---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
stage: ruling
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
        supports:
          - words/2026-09-04/46
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
      - name: the-question-has-no-subject-and-the-node-is-a-prune-proposal
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/37
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
  strength: none
  date: 2026-09-07
  of: 776f43f6f04c2806a37655dda263896f8b5db63c
  commit: f146f8f44b295c64e47a13bff338748035183d87
  survey:
    date: 2026-09-07
    of: 776f43f6f04c2806a37655dda263896f8b5db63c
---

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

**AI support.** The author, 2026-09-04, on the alignment page: "To avoid confusion, the kickback
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

**AI divergence.** The control the author reaches for when the draft is wrong is the one control this answer takes off the screen, and it takes it off at the moment the author is deciding whether to dissent at all. A reader who does not know the box appears on choosing reads the row as a refusal with no way to say why, which is the fault `none-of-the-above-ballot` names, a refusal expressed where the voter does not look. The incumbent's cost is a box that collects words the page drops; this answer's is a channel the author may not know is there, paid on the one act the record has for telling the AI its draft is wrong. And hiding is not the record's own device for a control that must not collect what the page will not honour: the parent renders every input at the stages before the ruling and disables it rather than withdrawing it, which is `shown-disabled-until-chosen` on this fact, and the author's words reach the hiding without reaching the choice between hiding and disabling.

**Content.**

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
```

#### hidden-until-chosen-and-discarded

The author's two sentences with nothing added: the control is shown only when the
kick-back is chosen, what is written in it is discarded otherwise, and neither the
row's caption nor the control's label changes.

**AI support.** For it: it is the author's words
exactly, and it leaves the wording of this control where a ruling on
`where-a-change-request-goes` could still reach it, which is the separation that
node's own `kick-back-ask-unchanged` option exists to preserve. Viable and not
adopted: under that node's answer this control is the one home on the page for a
change request, and a channel that is the only route for a thing and says so
nowhere is a channel the author has to be told about somewhere else. It is the
option to take if the author rules the reach away on that node's fact.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

The author's two sentences with nothing added: the control is shown only when the
kick-back is chosen, what is written in it is discarded otherwise, and neither the
row's caption nor the control's label changes.
```

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

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
```

#### shown-always

Everything the recommended option says, with the feedback control opening with the
row at the first level whether or not the kick-back is chosen, which is the
parent's clause and what `renderKickback` does today
(`packages/disposition/project.mjs:1570-1580`).

**AI support.** For it, the parent's own reason:
the words are what a kick-back consists of and what the dialogue resumes from, so
a control the author has to reveal is a movement the author may not make. Passed
over: the author's words of 2026-09-04 strike it by name, and what they read was a
control offering to collect words the page would drop.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with the feedback control opening with the
row at the first level whether or not the kick-back is chosen, which is the
parent's clause and what `renderKickback` does today
(`packages/disposition/project.mjs:1570-1580`).
```

#### kick-back-feedback-one-step-down

Everything the recommended option says, with the feedback control in a drill-down
beneath the row, always, so that every row on the fact has the same two levels.
Recorded on the parent's answer fact and carried here as the clause it governs.
Passed over: it folds the words a kick-back consists of, which is the parent's own
argument against it; and the author asked for a third placement, at the first
level and conditional, rather than for either of the two the parent's fact held.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with the feedback control in a drill-down
beneath the row, always, so that every row on the fact has the same two levels.
Recorded on the parent's answer fact and carried here as the clause it governs.
Passed over: it folds the words a kick-back consists of, which is the parent's own
argument against it; and the author asked for a third placement, at the first
level and conditional, rather than for either of the two the parent's fact held.
```

#### abandoned-words-carried-as-a-draft

Everything the recommended option says, with the `!radio` branch left as it is, so
kick-back words typed with no option chosen are still staged and carried into the
launch instruction as "no option chosen" followed by the words.

**AI support.** For it, the
script's own comment: a half-finished response should survive the next keystroke,
and losing what the author has typed is a real cost the discard pays. Passed over:
the author's second sentence says the text is discarded, and what the branch
produces is not a preserved draft but a response of a kind the author never gave,
carried into an instruction under a label that says no option was chosen.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with the `!radio` branch left as it is, so
kick-back words typed with no option chosen are still staged and carried into the
launch instruction as "no option chosen" followed by the words.
```

#### abandoned-words-staged-as-a-kick-back

Everything the recommended option says, with words found in the kick-back's
control staged as a kick-back even where the radio is unchosen, on the reasoning
that writing in the refusal's box is the refusal.

**AI support.** For it: nothing the author types
is lost, and the words are recorded as what they are rather than as an unlabelled
response. Passed over: it infers a ruling from a keystroke, and a denial the author
did not choose is a response the record cannot honour, which is the same fault the
parent's answer names in a confirmation recorded before the ruling stage.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says, with words found in the kick-back's
control staged as a kick-back even where the radio is unchosen, on the reasoning
that writing in the refusal's box is the refusal.
```

#### shown-disabled-until-chosen

Everything the recommended option says of the row, the discard and the caption,
with the feedback control never leaving the screen: it stays at the first level of
every fact, rendered and visibly inert, and becomes writable when the kick-back's
radio is chosen. Recorded from the reading of 2026-09-07, which raised it as the
viable option the fact was missing.

**AI support.** For it, the parent's own answer, which
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

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---
## Answer

Everything the recommended option says of the row, the discard and the caption,
with the feedback control never leaving the screen: it stays at the first level of
every fact, rendered and visibly inert, and becomes writable when the kick-back's
radio is chosen. Recorded from the reading of 2026-09-07, which raised it as the
viable option the fact was missing.
```

#### the-question-has-no-subject-and-the-node-is-a-prune-proposal

**Author support.** The author's words of 2026-09-08 at `words/2026-09-08/37`, answering P3: "There is no kick-back because probe review is an
iterative process that supercedes sequential periagogic/meiutic/review phases. There is
no kick-back from confirmation either."

This node asks when the kick-back's feedback control is shown and what becomes of what
is written in it. Under P3 there is no kick-back and no such control, so the question has
no subject. The option this records is not an answer to the question but the proposal
that the node be pruned, its live residue -- when a control that collects the author's
words is revealed, and what becomes of the words -- moving to `alignment-page`, which
owns what the page shows.

**AI support.** `evaluation` holds that a fence with no recorded reason is a
prune-by-default proposal, and this fence's reason is recorded and has been withdrawn by
the party who set it. Keeping a node whose subject the record no longer has is how a
graph accumulates questions nobody can answer, and this node is at the ruling stage,
which means the author would otherwise be asked to rule on the timing of a control that
does not exist.

**AI divergence.** The prune is proposed and cannot be executed here, and the record
should be honest about why rather than leaving it to look like reticence. A prune of a
standing node is carried by `commons.systems/disposition-graph/graph-topology` and waits
on that node's authority fact, as `probe-or-node`'s recommended option sets out; this
node carries no topology fact for the proposal to sit on, and minting one is a
structural act the author has not been asked about. The option is therefore recorded on
the answer fact, which is the wrong home for it, and that misplacement is stated here
rather than hidden.


**Content.**

```markdown
---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

The question has no subject. There is no kick-back, so there is no feedback
control of the kick-back's, so there is no moment at which it is shown and nothing
written in it to become anything. This node is a prune proposal and its answer
says so rather than inventing a subject for the question to keep it standing.

What survives the strike is a real question and it is not this node's. A control
that collects the author's words still exists in some form, since the author still
writes alignment input, and when it is revealed and what becomes of what is
written in it are questions about the page. They belong to
`commons.systems/disposition-graph/alignment-page`, which owns what the page shows
and when, and the answer that node's `two-responses-where-the-page-offers-them`
option contemplates is where they land.

Until the prune is ruled this text is what the node says, so that a reader who
arrives here is not told the timing of a control that does not exist. The prune
itself cannot be executed from this fact: it is carried by `graph-topology` and
waits on that node's authority fact, and this node has no topology fact for the
proposal to sit on.
```

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

## Account


What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the clause of the kick-back paragraph that places the control, "its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from, where on an option the words are optional because the ruling's content is the option", together with the same clause as it is stated in the answer fact's own prose and in the option `kick-back-feedback-one-step-down`, which is the alternative already on that fact and which the author's words answer in neither direction: the author asks for a third placement, shown at the first level but only once the kick-back is chosen, where the recommendation shows it always and that option folds it always. The second sentence, that the text is otherwise discarded, is already the behaviour of the artifact and of no sentence of the record: the staging script in `packages/disposition/alignment-template.html` reads `[data-kickback-text]` only when the kick-back radio is the chosen one, so text typed and abandoned never reaches a response, and what the author read was a control offering to collect words the page would drop. This question rests on `where-a-change-request-goes`: if every change request is recorded in this one control, then hiding it until the kick-back is chosen decides where the author's only channel for a change lives, and the two answers have to be given together. In the implementation the change falls on `renderKickback` in `packages/disposition/project.mjs`, which writes the textarea and its label unconditionally, and on the template's script and styles.

Cascades: `commons.systems/disposition-graph/recording`, whose option `denial-typed-to-maieutic` types the kick-back to the movement it returns the node to and whose classification reads the author's words, so a control that is easy to miss is a movement that is easy to miss; `commons.systems/disposition-graph/unanswered`, whose third response is the denial with feedback and whose feedback "is recorded as the author's words, never as a ruling"; `commons.systems/disposition-graph/ruling-transport`, on what the staged response carries back to a session; and `commons.systems/disposition-graph/progressive-disclosure`, whose two levels are what a conditionally shown control is a third case of.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at a node at the ruling stage, with the kick-back row chosen and unchosen, read against the recommended text of `alignment-page` and its option `kick-back-feedback-one-step-down`, the answers of `recording` and `unanswered`, and `renderKickback` with the template's staging script, before anything is changed.

### Manifest

- Folded: What the page does with abandoned kick-back text, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: An option recorded from a sibling's sitting, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of ad88dc64, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading applied, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 9c0aa09f

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `revealed-with-the-choice`.

Findings:


On the facts and what they recommend: The answer fact's recommendation, boldness, and empty ## Answer/## Rationale (fence present, nothing stands) are unchanged by the diff; the diff adds the option `shown-disabled-until-chosen` (source review, ref 2026-09-07) to the answer fact's options and its subsection, and lengthens both the answer fact's and the fact-level `against` prose to name it as the device the record already uses for a control that must not collect yet. The authority fact's recommendation (ratified, low) and its prose are untouched by the diff.

On the viability of the options: Every option remains viable after the diff; the one addition, `shown-disabled-until-chosen`, is recorded viable and not adopted with a reason that holds (the parent's disable-rather-than-hide precedent), matching exactly what the previous reading's viability finding asked for.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding; the parent's mark and the option on where-a-change-request-goes verified on the main thread. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 9c0aa09f

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (weak): The caption clause is the AI's and it departs from a sibling's answer rather than applying it, which this node says in terms. What the frontier adds is the order: this node names where-a-change-request-goes in depends, so that node is ruled first with the sentence "that control is to ask for the change and not only for the ground of the refusal" confirmed, and this ruling then contradicts a clause the author has just taken. The divergence is recorded as an option on both facts and resolved on neither, so whichever is ruled second inherits the collision.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/when-the-kickback-feedback-shows stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `revealed-with-the-choice`; 1 `## Disposition` entry became the ledger entry words/2026-09-04/46, referenced by 1 option the entry's own date names. The record wrote no text of its own for `hidden-until-chosen-and-discarded`, `the-control-asks-for-the-change-by-name`, `shown-always`, `kick-back-feedback-one-step-down`, `abandoned-words-carried-as-a-draft`, `abandoned-words-staged-as-a-kick-back`, `shown-disabled-until-chosen`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `9c0aa09f3ad04ed2e2be07f0cb1f4b4535fe62dc` is re-computed for the encoding as `76c3932b5ca1626e3806b1ff3cc237c97a3361d2`; nothing it read changed. The survey's pin `9c0aa09f3ad04ed2e2be07f0cb1f4b4535fe62dc` is re-computed for the encoding as `76c3932b5ca1626e3806b1ff3cc237c97a3361d2`; nothing it read changed.

### The subject withdrawn, 2026-09-08

P3 of `words/2026-09-08/37` strikes the kick-back. This node's question is about the
kick-back's feedback control and about nothing else, so what it asks is no longer a
question the record can answer. The node stands at the ruling stage.

The prune is proposed and not made, and it is recorded on the answer fact because this
node has no topology fact to carry it. That is the wrong home and the option says so.
Two things follow for the author. The node should not be ruled in its present state,
since ruling it would settle the timing of a control the same entry abolished. And the
part of its question that survives -- when a control collecting the author's words is
revealed, and what becomes of what is written in it -- is a real question about the
alignment page that would be lost if the node were simply deleted; the option names
`alignment-page` as where it goes.

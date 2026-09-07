---
question: Where does the author record a change to what is recommended?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: change-requests-go-to-the-kick-back
        source: author
        ref: "2026-09-04"
      - name: edits-ride-on-the-option
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-05"
        status: passed
        reason: "it makes a confirmation carry a text the author did not confirm, and the pin can name only one of the two"
      - name: label-only-change
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the channel the author closed stays open behind a new label, since nothing about what the session does with the words changes"
      - name: a-dedicated-change-request-control
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "a third box for words that are not a ruling repeats the kick-back's, and the author's words name the kick-back input as the one home"
      - name: reason-goes-to-the-interview-too
        source: ai
        ref: "2026-09-06"
        status: passed
        reason: "the reason is part of the ruling, which is the page's scope, and the author's same words keep the option's control for it"
      - name: one-reason-box-per-fact
        source: ai
        ref: "2026-09-06"
      - name: change-request-typed-to-review
        source: ai
        ref: "2026-09-06"
      - name: edit-applied-and-held-until-the-re-reading
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: kick-back-ask-unchanged
        source: review
        ref: "2026-09-06"
    recommends: change-requests-go-to-the-kick-back
    boldness: moderate
    against: "A kick-back on one fact moves the whole node, so under this answer the author who wants one word changed loses the ruling they were ready to give and the node's stage with it, and the record answers a request about a label by making the cheapest correction on the page the most expensive act on it."
    stands: change-requests-go-to-the-kick-back
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "This is a control's label and a routing between two boxes, and the author has already said in their own words what they want of both; ratifying it spends the author's scarcest act on a sentence that transcribes them, and freezes the wording of the page's own dissent channel against every later reading of it."
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-06
  of: 34d2c5f3dd9e5c6b1b22416818222a209a848297
  commit: f16442305e5bf2f15c484bd6b55074390fc10095
  against: "The draft's one ground that does not rest on the author's authority is the pin dilemma, and the node it cites for it has already resolved it. `recording`'s recommended text pins `of` \"to the recommendation as those edits leave it, since the text the ruling stands on is the author's own and a pin that named the text they superseded would flag every clerical edit for good\", and where the edit changes substance it sets the node back to review before the re-confirmation, so neither of the two fictions the draft names is what the record would actually store. The draft's claim that \"the pin can name the text the author read or the text after their edit and one of the two is always a fiction\" is asserted against that stated resolution without quoting or answering it, and `edit-pins-what-the-author-read` is a delta option the AI raised, not a standing objection of the record's. Strip the pin argument and the answer rests on a single parenthesis about a page's text input, read as closing one of the three responses the record opens everywhere, at the price the fact's own `against` names: the cheapest correction on the page becomes the most expensive act on it."
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/recording#edits-only-through-the-kick-back
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - text input in option details is only for author reasoning, not for "changes you want made". All change requests are recorded in the kickback input only (any changes will necessarily require a kickback).

## Answer

In the kick-back's feedback control, and nowhere else on this page.

The option's own text control stays where the author put it, in the option's
details, and it holds one thing: their reason for choosing that option, the
`reason` a ruling carries in the dialogue node's recommended text, why they chose
as they did, in their own words and optional. The reason sits on the option
because the choice does. Its label asks for that reason, says that it is
optional, and names no edit, because a label that names an edit solicits one, and
what is written in that control arrives attached to a confirmation. The control is
not a second channel into the record and it is not a place to say what should have
been recommended: it is the ruling's own field, filled at the moment of ruling,
and it says why the author confirmed and never what they would have confirmed
instead.

A change the author wants made is recorded in the kick-back's feedback control, on
the fact the change bears on, and that control asks for the change by name and not
only for the ground of the refusal, because the one control on the page that
collects a change request has to say that it takes them or the author will look
for another. A change to the recommended text is a change to what the answer fact
recommends and is recorded on that fact; a change to the class a ruling would
confer, on the authority fact; and so for each, since every response on this page
is given on a fact and a change is a response.

The two cannot share a control, and the reason is the pin rather than the label. A
ruling is written on the option the author chose and pins the recommendation they
answered, so a ruling recorded on a text amended in the same breath pins one of two
things and neither is true: the text the author read, which the record then shows
as moved for a change the author themselves asked for, or the text after the edit,
which attests a reading the author never made. There is no third pin. The record
already holds that dilemma, on the recording node, where `edit-pins-what-the-author-read`
stands against that node's recommended text and neither side of it is satisfying
while an edit rides on a confirmation. This answer dissolves it rather than
choosing a side: a change is not a confirmation of anything. It is the author
saying that what is in front of them is not what they would confirm, which is a
denial with feedback, and the change is the feedback.

So of the three responses the unanswered node opens, this page offers two and adds
none: the confirmation, and the denial with feedback. The third, the confirmation
with edits, has no control here. This answer holds further that it has no home
anywhere, on the page or in prose, because a change requires a kick-back wherever
it is given and nothing about that turns on which surface it was given from; but
the roster of responses is the unanswered node's answer and the classification of
a response is the recording node's, and authority does not widen on the way down,
so the striking is theirs to rule and not this node's. The consequence is recorded
as an option on each, `edits-only-through-the-kick-back` already standing on the
recording node's answer fact from these same words. Until they rule, what this
node fixes is the page, and on the page the third response has no control.

A label is not a guarantee, and the answer says what happens when it is ignored.
Text written in an option's control that amends the option rather than explaining
the choice is no confirmation and the page does not stage it as one, since no
control here offers an edit. What the session then does with such words is
`commons.systems/disposition-graph/recording`'s and not this answer's: that node
recommends `per-fact-after-two-readings`, under which they are edits and are
applied with the ruling, and carries the contrary option
`edits-only-through-the-kick-back`, which says in as many words that it waits on
this sitting. Where the author rules that option, the words are classified as the
denial they make and carried as its feedback; until they do, this answer says
only that the page offers no route for them and leaves the classification where
it lives. The label is
what keeps the case rare; the classification is what keeps it safe; and the page
converts nothing silently, since a control that turned a confirmation into a
denial on its own would be deciding the response instead of collecting it.

What this costs the author is the ruling they were ready to give on that fact, and,
because a kick-back on one fact moves the whole node, the node's stage with it;
what it does not cost is a redrawing. The kick-back row is typed to the maieutic
movement, and where the author's feedback supplies the refinement itself the
session moves the recommendation and the node reaches the review stage from there,
as the recording node's classification has it, so the price of a wording change is
one further confirmation and not a second interview. Nothing new is transported
back either: the instruction the page emits already hangs the author's words on
the response they were written under, the option's name or the kick-back, so a
reason and a change request are told apart by the control they were written in,
and the ruling-transport node's rule that every route emits one and the same text
is untouched.


## Rationale

Recorded on the author's disposition of 2026-09-04, queued from the sitting on
`commons.systems/disposition-graph/author-questions` and carried under
`## Disposition`:

> text input in option details is only for author reasoning, not for "changes you
> want made". All change requests are recorded in the kickback input only (any
> changes will necessarily require a kickback).

The sentence has three parts and the answer takes all three. "In option details"
keeps the control where it is. "Only for author reasoning" narrows it to the
`reason` a ruling already carries. "In the kickback input only" names the one home
of a change request. The parenthesis is what carries the answer past the page:
if any change requires a kick-back, then a change is a denial, and a confirmation
with edits is a response the record cannot honour rather than a shape of the page
that could be drawn differently. The record's own ground for the same conclusion is
in the recording node's `edit-pins-what-the-author-read`, where a ruling's pin can
name the text the author read or the text after their edit and neither is a true
account of what they confirmed.

The reach is bounded by where authority lies. What the page offers is the
`alignment-page` node's, devolved here; the roster of responses is
`commons.systems/disposition-graph/unanswered`'s answer, and how a response given
in prose is classified is `commons.systems/disposition-graph/recording`'s. This
answer states the consequence for both and rules neither: the recording node
already carries `edits-only-through-the-kick-back` from these same words, and the
unanswered node takes the matching option, each for the author's own ruling.


## Facts

### answer

Recommended: `change-requests-go-to-the-kick-back`, at moderate boldness. Both
halves of the author's words of 2026-09-04 are load-bearing and they point the
same way. The affirmative half places the reason in the option's details and keeps
it there, which is where the dialogue node's recommended text already puts it, on
the option, because that is where the choice is; so the control is not removed,
it is narrowed to the field it was always filling. The parenthesis, that any
change will necessarily require a kick-back, is what reaches past the label, and
the record has an argument of its own for it that does not rest on the author's
authority: a ruling pins the recommendation it answered, and an edit applied
inside a confirmation leaves the pin naming either a text the author never read in
final form or a text they read and then replaced. The recording node holds both
sides of that dilemma already, as `edit-pins-what-the-author-read` against its own
recommended text, and neither side is satisfying, which is the signature of a
question posed wrongly. Treating a change as a denial dissolves it: nothing is
pinned because nothing is ruled, and the author's words become the feedback the
next draft is drawn from. The boldness is moderate rather than low because the
reach is the AI's: the author wrote about a text input, and this answer reads them
as closing a response, which is a larger claim than the sentence makes on its
face; it is not high, because the locus, the label and the routing are the author's
words nearly verbatim and only the consequence is inferred. What the answer
declines to do is strike the third response itself. The roster is the unanswered
node's and the classification is the recording node's, authority narrows on the
way down and never widens, so the consequence is recorded as an option on each and
the author rules it there.

#### edits-ride-on-the-option

The incumbent, and the only whole alternative on this fact: the option's control
takes the author's reason and any edits they want made, a confirmation with text
that amends the option is applied and recorded as the ruling, and the node returns
to the review stage where the edits change substance. It is the clause the parent's
recommended text carries in three places today and it is on this list because a
ruling that keeps it is a ruling the author is entitled to give. Passed over: the
author's words of 2026-09-04 close exactly this channel, and independently of them
it makes a ruling attest a text nobody confirmed, since the pin can name the text
the author read or the text after their edit and one of the two is always a
fiction. Its own strongest defence is cheapness for a small correction, and the
recommended option answers it: the refinement moves the recommendation and reaches
the review stage, so the correction costs a clean-context re-reading of the moved
recommendation and one further confirmation, and not a
redrawing.

#### label-only-change

Everything the recommended option says, with the change stopping at the label: the
option's control is relabelled for the reason alone, and the responses, the
classification and the parent's other two clauses are left as they stand. Passed
over: the words in the box are not what carries an edit into the record, the
classification is, and under this option a change written in the reason box is
still a confirmation with edits, applied and ruled. It renames the channel the
author asked to close and leaves it open, which is the worse of the two states,
because the page would then say one thing and the record do another.

#### a-dedicated-change-request-control

Everything the recommended option says, with a third control beside the fact's
options, neither a confirmation nor a kick-back, taking a change the author wants
made without denying anything. Passed over: it is the confirmation with edits under
another name, so every argument above tells against it; and where it is not, it is
a second box for words that are not a ruling, duplicating the kick-back's, which
the author's words already name as the one home. The record has no response it
would express, and the unanswered node's answer says no fourth response is needed.

#### reason-goes-to-the-interview-too

Everything the recommended option says, with the option's text control removed
altogether and the author's reason given in the `/align` interview like every
other word of theirs, on the author's rule of 2026-09-06 that the page's scope is
the final confirmation and all other information comes from the interview. Passed
over: the reason is not other information, it is part of the confirmation, the
field the ruling carries beside the response and the date, so removing it takes
something out of the page's own scope; and the author's words of 2026-09-04 say in
as many words that the option's text input is for their reasoning, which is the
affirmative half of the disposition this node rests on.

#### one-reason-box-per-fact

Everything the recommended option says, with one reason control beneath the fact's
options rather than one inside each option's details. For it: with a box per
option, a reason typed under option A and then a choice of option B leaves the
words unread, since the staging reads the chosen option's box, and a single box
per fact has no such trap. Against it, and decisive: the author's words place the
input in the option details, "text input in option details is only for author
reasoning", and the reason belongs to the option because the choice does. Viable
and not recommended; if the author wants the trap closed without moving the
control, that is the discard question the `when-the-kickback-feedback-shows` node
is already looking at from the other side.

#### change-request-typed-to-review

Everything the recommended option says, with a kick-back whose feedback is a
change request typed to the review movement rather than to the maieutic, on the
ground that a refinement does not ask for the options to be drawn again. Viable
and not recommended: the recording node's `denial-typed-to-maieutic` types the row
and not its contents, and re-typing the row by what the author wrote puts the page
in the business of classifying, which is the session's; and the outcome is already
reached, since a refinement moves the recommendation and the node arrives at the
review stage from the maieutic as any moved recommendation does. The two differ in
the stage's name and in nothing an executor would do, which is the same finding
the recording node made against `refinement-re-enters-at-review`.

#### edit-applied-and-held-until-the-re-reading

Everything the recommended option says, with the confirmation with edits surviving
as a response and the ruling held: the session applies the edit, the re-reading
runs on the edited text, and the ruling is recorded only when that reading forwards
it, so no pin ever names a text the author did not see in its final form. This is
the shape the unanswered node's answer already carries and the recording node
records as `edit-held-until-re-read`. Viable and not recommended: it cures the pin
and keeps the channel the author asked to close, which is the half of the
disposition that decides this node; and it makes the author's ratification wait on
a step in producing a draft they have replaced, which is the reasoning the
unanswered node used against holding a child's ruling. It is on the list because
it is the strongest version of the incumbent and the author should meet it before
closing the response.


#### kick-back-ask-unchanged

Everything the recommended option says, with the kick-back's own control left
exactly as it is: the routing changes, the option's label stops naming an edit,
and the feedback control goes on asking for what the options miss rather than
also asking for the change by name. It is the counterpart on the kick-back of
`label-only-change` on the option, and it exists so that the author can rule the
routing without ruling anything about a control whose wording is
`when-the-kickback-feedback-shows`' question. Against it: a channel that is the
only home for a change request and does not say so is a channel the author has to
be told about somewhere else, and the page is where they are.

### authority

Ratified, at low boldness. `class-recommendation`'s test asks whether being wrong
would be expensive, irreversible, or capture-shaped, and the limb this node meets
is capture-shaped. The answer fixes the channel through which the author tells the
AI that its draft is not what they would confirm, and under any class but ratified
the party setting that channel is the AI, which is precisely the party the channel
exists to check. The answer also narrows the author's responses from three to two
on the page and asks the record to strike the third everywhere; a narrowing of the
ways the author may dissent, proposed by the party dissented from, is the shape the
limb names whatever its merits, and the merits are what the author should get to
weigh. The other two limbs are not met and the reading says so: a label and a
routing between two controls are cheap to change, nothing is built on them that
cannot be taken back, so neither expensive nor irreversible carries this
recommendation and neither is claimed. Delegated would leave the wording and the
routing of the author's own dissent channel in the AI's hands, which is the one
class of decision a delegation here cannot cover. Deferred is on the fact because
the record's classes are three and the author's third exit stays open; it is what
they take if they want this answer to act while the question stays in front of
them, and it is the reasonable choice if they read the reach past the page as the
only contested part. Boldness low because the class follows the stated test rather
than the AI's judgment of this node alone.


## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text three places that make the option's own control the home of an edit. In the drill-down paragraph, "a text control for the author's reason for choosing it and for any edits they want made to it". In the responses paragraph, "choosing an option and writing in its text is a confirmation with text, which the session classifies as the recording node classifies every response given in prose, a reason recorded with the ruling where it is a reason, and a confirmation with edits where it amends the option, applied and recorded as the ruling, the node returning to the review stage where they change substance". And the sentence that removed the older home of an edit on the strength of the new one, "The ruling on the whole, which used to stage the confirmation with edits by itself, goes with nothing lost: the author's edits ride on the option they edit, which is where an edit belongs." The author's parenthesis, that any change will necessarily require a kickback, is the reason the third sentence no longer holds: if a change is a kickback, an edit riding on a confirmed option is a confirmation the record cannot honour, and the page must not offer it. So the question reaches past the page to what a response is, and the sitting has to say whether "confirm with edits" survives as a response at all or collapses into the denial with feedback. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `renderOption`, which writes the `opt-note` textarea under the label `OPTION_NOTE_PLACEHOLDER`, and on `packages/disposition/alignment-template.html`, whose staging script reads that textarea into the response it records and whose instruction text says what the session is to do with it.

Cascades: `commons.systems/disposition-graph/unanswered`, whose answer opens exactly three responses, "confirm, confirm with edits, and deny with feedback", and says that "A confirmation with edits rules for the option with the edits: the session applies them, and where they change substance the draft goes through the review again before the ruling is recorded"; `commons.systems/disposition-graph/recording`, and its option `per-fact-after-two-readings`, which classifies a response given in prose and decides which movement a change returns the node to; `commons.systems/disposition-graph/dialogue`, whose `ruling` carries a `response` that is "confirm or edit" and a `reason`, "why they chose as they did, in their own words and optional", the two being exactly the two purposes the author is separating; `commons.systems/disposition-graph/authority`, on a ruling whose words must be in the record; and `commons.systems/disposition-graph/ruling-transport`, on what the page's buffer carries back to a session.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at a node at the ruling stage, with the instruction its controls emit, read against the recommended text of `alignment-page`, the answers of `unanswered` and `recording`, and `renderOption` with the template's staging script, before anything is changed.

### The maieutic, 2026-09-06

The periagogic object was read by the survey unit of 2026-09-05 at
`OPTION_NOTE_PLACEHOLDER`, `renderOption`'s note block and the template's
`alReadFacts`, and it found the author's observation standing whole: the option's
control still solicits edits by name, in the label the author read, and all three
sentences of the parent that make the option's own control the home of an edit
are unamended. No question of the author's intent was open, so the periagoge
closed on their words of 2026-09-04 and the design ran as a unit on the most
capable model, the draft amending an ancestor's recommended text.

The unit declined two clauses of the parent rather than amend them, which is the
lesson of the two readings this sitting has already spent: the kick-back's
marking and its feedback control at line 499, devolved to
`when-the-kickback-feedback-shows`, and the simile at line 505, which survives
the change. Its requirement on the kick-back control is carried in the amendment
to the responses sentence instead.

The clean-context reading is owed before the author rules.

### What a ruling here would do to the parent's recommended text


All line numbers are `disposition/disposition-graph/alignment-page.md` on the
`disposition` ref as re-measured on 2026-09-06 after the day's landings; the
fence runs 498-568 and each quoted
clause is verbatim from it. Four amendments to the answer, one bookkeeping
sentence in the fence's rationale, two clauses declined.

#### Amendment 1 — line 497, the last item of the drill-down list

**Before**

> and a text control for the author's reason for choosing it and for any edits they want made to it.

**After**

> and a text control for the author's reason for choosing it and for nothing else, holding the `reason` a ruling carries, its label asking for that reason, saying it is optional, and naming no edit, since a label that names an edit solicits one and what is written there arrives attached to a confirmation.

#### Amendment 2 — line 511, first sentence

**Before**

> A response is one of the three the unanswered node opens and this page adds none, and every response is given on a fact, since nothing on the page stages a ruling on the node as a whole.

**After**

> A response is one of those the unanswered node opens and this page adds none; of the three that node opens the page offers two, the confirmation and the denial with feedback, and the confirmation with edits has no control here, for the reason below, whether it survives on that node's roster at all being that node's ruling and not this one's. Every response is given on a fact, since nothing on the page stages a ruling on the node as a whole.

#### Amendment 3 — line 511, the responses sentence

**Before**

> Choosing an option on a fact and leaving its text empty is a confirmation of that option; choosing an option and writing in its text is a confirmation with text, which the session classifies as the recording node classifies every response given in prose, a reason recorded with the ruling where it is a reason, and a confirmation with edits where it amends the option, applied and recorded as the ruling, the node returning to the review stage where they change substance, as the recording node's `per-fact-after-two-readings` says of a confirmation with edits; the kick-back on a fact is a denial with feedback on that decision.

**After**

> Choosing an option on a fact is a confirmation of that option, and what the author writes in that option's text control is the reason the ruling carries and never a change they want made; the kick-back on a fact is a denial with feedback on that decision, and its feedback is where every change request on this page is recorded, the control asking for the change by name and not for the ground of the refusal alone. Text written in an option's control that amends the option rather than explaining the choice is no confirmation and is not recorded as one: the session classifies it as the recording node classifies every response given in prose, and classifies it as the denial it is, carrying the author's words as the feedback and saying which reading it took in the turn it takes it, since the label is what keeps the case rare and the classification is what keeps it safe.

#### Amendment 4 — line 511, the "ruling on the whole" sentence

**Before**

> The ruling on the whole, which used to stage the confirmation with edits by itself, goes with nothing lost: the author's edits ride on the option they edit, which is where an edit belongs.

**After**

> The ruling on the whole goes and what it used to stage goes with it: no control on this page stages an edit, because a ruling recorded on a text amended in the same breath pins either a reading the author did not make or a text they did not confirm, and a page offering one would be offering an act the record cannot honour.

#### Amendment 5 — line 536, appended to the fence's `## Rationale`

Bookkeeping, in the form the two amendments already recorded there take.

**Appended after** "…and what an earlier stage offers is the chip's two controls and the preview."

> Amended again 2026-09-06 on the author's words of 2026-09-04 that the option's text input is for their reasoning and not for changes they want made, and that any change will necessarily require a kick-back, as the `where-a-change-request-goes` node reads them: the option's control is the ruling's reason and its label says so, every change request is recorded in the kick-back's feedback, and the page stages no confirmation with edits.

#### Declined — line 499, the kick-back's marking and its feedback control

> It stays in the radio group … and it is marked as what it is: set apart from the options, captioned with what it does to the node rather than with the summary of an option it is not, and its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from…

This answer adds a requirement on that control, that it ask for the change by
name. The clause is not amended here. The decision it takes is the row's marking
and the control's placement, which the parent has devolved to
`commons.systems/disposition-graph/when-the-kickback-feedback-shows`, not to this
node; the parent's own account of what the kick-back's words are is where the new
requirement would land, and adding it at 499 would have this node writing into a
sibling's clause. The requirement is carried in Amendment 3 instead, in the
responses paragraph, which is a clause the parent's account devolves here and
which is where the page's routing of responses is stated. If the main thread
judges that 499 must say it too, the sentence belongs to
`when-the-kickback-feedback-shows` and should be recorded as an option there.

#### Declined — line 505, "the applied text read afterwards as an author's edit is"

> …the session applying the sentence's change to the recommended text, the applied text read afterwards as an author's edit is and the choice keeping its authority meanwhile.

The simile survives this answer and needs no amendment: an author's edit still
exists, still arrives, and is still read again where it changes substance; what
changes is only the response it arrives under, from a confirmation to a kick-back.
The clause's own subject, what happens when the session applies an option's
sentence to the recommended text, is untouched.

#### What falls to the implementation, if the answer is ruled

Named so the reconciliation is not discovered later, and deciding nothing:
`OPTION_NOTE_PLACEHOLDER` at `packages/disposition/project.mjs:676`, today "Your
reason, or the edits you want made", is the label Amendment 1 rewrites;
`KICKBACK_PLACEHOLDER` at `:681`, today "What these options miss, and what the
next ones are drawn from", is the ask Amendment 3 widens. Neither the staging
script nor `alInstructionAll` needs a change: the instruction already hangs the
words on the option's name or on "kick back", which is the distinction this answer
draws.

### Clean-context review, 2026-09-06, of 34d2c5f3

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `change-requests-go-to-the-kick-back`.

Findings:

- Structure, blocking. The node file carries stray fence and rule lines that hide two whole sections from the record's own reader: `disposition/disposition-graph/where-a-change-request-goes.md` has "```" at lines 132, 164 and 309 and "---" at 134, 166, 311 and 434, where no sibling under `alignment-page` carries any (`grep -c '^```$'` returns 0 on `where-the-unconfirmed-indication-goes.md`, `what-an-option-row-carries.md` and `author-questions.md`). Measured with `parseNode` from `packages/disposition/read.mjs` on the file: `rationale` and `account` both parse as the empty string; `answer` parses as 6659 characters containing the literal "## Rationale"; the authority fact's reason parses as 12945 characters containing the literal "## Account". So the text that stands — what a confirmation would ratify, and what `standingHash` 6d887a26 covers — is the answer followed by a stray "```", a rule, and the whole Rationale; the `### authority` reason the author would read as why that fact recommends `ratified` runs on into the entire Account; and the Rationale that quotes the author's words, which `recording` requires ("the author's words are quoted into the rationale"), reaches no projection at all. `node packages/disposition/validate.mjs disposition` returns `ok: 140 nodes`, so nothing else catches it. Edit: delete lines 132, 134, 164, 166, 309, 311 and 434.
- Doctrine and executor. The `## Answer` sentence "Text written in an option's control that amends the option rather than explaining the choice is no confirmation and is not recorded as one: the session classifies it as the recording node classifies every response given in prose, and it classifies as the denial the author's words make it, carrying their words as the feedback" decides `commons.systems/disposition-graph/recording`'s question against `recording`'s own recommendation, and cites that node for a rule it does not state. `recording`'s recommended `per-fact-after-two-readings` says of the same input: "An option chosen with words written in its text is a confirmation with text, and those words are classified again: where they are the author's reason for the choice they are recorded on the ruling as its reason, in their words; where they amend the option they are edits, and are applied to it", and "A confirmation with edits is a ruling like any other and is never held". Two sessions reading the two nodes would do different things with one response: one records no ruling and kicks the node back, the other applies the edit and records the ruling. `recording`'s own option `edits-only-through-the-kick-back` says in as many words that it "is not recommended here, and the reason is that the sitting the author queued for those words, `commons.systems/disposition-graph/where-a-change-request-goes`, has not yet been held", so the resolution is pending on that fact and is that node's to make. Edit: make the sentence conditional — "where the author rules `edits-only-through-the-kick-back` on the recording node, the session classifies …" — or say only what the page does, that no control here stages an edit, and leave the classification to `recording`; and enter `commons.systems/disposition-graph/recording#edits-only-through-the-kick-back` in this node's `depends`, which is empty today, so nothing keeps a ruling here from coming first. Amendment 3 in the Account carries the same sentence into the parent's fence and moves with it.
- Facts, and validation 15. The `## Answer` says "The consequence is recorded as an option on each, `edits-only-through-the-kick-back` already standing on the recording node's answer fact from these same words", and the Rationale that "the unanswered node takes the matching option". Half of that is true at graph commit 1e32e36e: `recording` carries the option; `commons.systems/disposition-graph/unanswered`'s answer fact carries no matching one (its options are answered-by-stamp, page-in-ruling-order, responses-on-decisions-and-children, child-ruling-held-until-the-parent, unanswered-is-no-ruling, confirmation-before-the-ruling-stage-is-invalid, browser-hides-every-unanswered-node, fourth-class-or-field-for-unanswered, mark-answered-node-unanswered, deferred-answers-without-a-stage, review-item-nodes, a-curriculum, response-on-a-fact, edit-ruled-then-reviewed, stage-keeps-a-node-on-the-frontier). This is also the merge finding: "This answer holds further that it has no home anywhere, on the page or in prose" is a new answer to a question the record already asks, `unanswered`'s "When is a disposition answered?", whose answer opens "confirm, confirm with edits, and deny with feedback". It is owed there as an option with this node as its source and a sentence such as: "The roster loses the confirmation with edits and keeps two, on the author's words of 2026-09-04 that any change will necessarily require a kickback; a change is a denial with feedback wherever it is given, and the page offering it would offer an act the record cannot honour." Edit: record the option before the claim is made, or write the sentence as owed rather than as done.
- Facts, line numbers. The Account's "All line numbers are `disposition/disposition-graph/alignment-page.md` on the `disposition` ref as read on 2026-09-06; the fence runs 469-539" is stale at the commit under review: the fence runs 498-568 and every cited line is +29 (497 -> 526, 499 -> 528, 505 -> 534, 511 -> 540, 536 -> 565). Every quoted clause is verbatim and still present, so only the anchors are wrong. Edit: re-anchor the five numbers and pin the graph commit beside the date, since line numbers into a node that is itself on the frontier go stale between the sitting and the reading.
- Cost understated, on the sentence the fact's own `against` is about. The `## Answer` says "the price of a wording change is one further confirmation and not a second interview". Under `recording`'s `per-fact-after-two-readings` the moved recommendation returns the node to the review stage and "no ruling is recorded on a recommendation of the AI's while either is owed", so the price is a clean-context re-reading of the amended draft and then a confirmation. Edit: "the price of a wording change is a re-reading of the amended draft and one further confirmation, and not a second interview".
- Viability, a missing option. Add to the answer fact `kick-back-ask-unchanged`, source review: "Everything the recommended option says, with no new requirement on the kick-back's feedback control. `KICKBACK_PLACEHOLDER` at `packages/disposition/project.mjs:681`, 'What these options miss, and what the next ones are drawn from', already asks for what the next draft is drawn from, which is what a change request is; and what that control asks is the question of `commons.systems/disposition-graph/when-the-kickback-feedback-shows`, standing at the periagogic stage, rather than this node's. For it: the routing the author's words fix is untouched and no clause of a sibling's question is decided here. Against it: a control that does not say it takes a change by name is where the author stops looking, which is the recommended option's own reason for widening the ask." It is the counterpart on the kick-back's control of `label-only-change` on the option's, and it is the one reach the Account's "Declined — line 499" section already admits; the author should be able to rule that reach away without rejecting the routing.

On the facts and what they recommend: The answer fact recommends `change-requests-go-to-the-kick-back`, which is also `stands`, so there is correctly no `## Recommendation` fence and the draft is the node as it stands; moderate boldness is right, since the locus, the label and the routing are the author's words nearly verbatim while the reach past the page to what a response is belongs to the AI. The authority fact recommends `ratified` at low boldness with the written `### authority` reading `class-recommendation` requires, and capture-shaped is the correct limb: the answer narrows the channel by which the author tells the AI its draft is not what they would confirm, and the party proposing the narrowing is the party dissented from; no `existence` or `persistence` fact is owed, since no prune is proposed and the node's shape does not change. No review pin exists yet so nothing is stale, but findings 1 and 2 both change the standing text and the authority fact's reason, so the pin must not be written before they are applied.

On the viability of the options: Every one of the eight options on the answer fact is viable on its facts, and the five marked passed carry reasons that hold: `edits-ride-on-the-option` is the incumbent and is correctly kept on the list as a ruling the author is entitled to give, and `edit-applied-and-held-until-the-re-reading` is correctly left viable as the strongest version of it. The three vocabulary options on the authority fact are complete. One viable option is missing, `kick-back-ask-unchanged`, whose prose is in the sixth finding: the recommended answer with the kick-back's ask left as it stands, which separates the routing the author's words fix from the widening of a sibling node's control, and which the author will otherwise never get to rule on separately.

Strongest counter-argument (moderate): The draft's one ground that does not rest on the author's authority is the pin dilemma, and the node it cites for it has already resolved it. `recording`'s recommended text pins `of` "to the recommendation as those edits leave it, since the text the ruling stands on is the author's own and a pin that named the text they superseded would flag every clerical edit for good", and where the edit changes substance it sets the node back to review before the re-confirmation, so neither of the two fictions the draft names is what the record would actually store. The draft's claim that "the pin can name the text the author read or the text after their edit and one of the two is always a fiction" is asserted against that stated resolution without quoting or answering it, and `edit-pins-what-the-author-read` is a delta option the AI raised, not a standing objection of the record's. Strip the pin argument and the answer rests on a single parenthesis about a page's text input, read as closing one of the three responses the record opens everywhere, at the price the fact's own `against` names: the cheapest correction on the page becomes the most expensive act on it.

The session's reply: Accepted. The first finding was the session's own and is already repaired: seven stray fence and rule markers left by the hand-assembly of the draft folded the whole Rationale into the Answer and the whole Account into a fact's reason, so the reading judged a node the reader could not see the shape of, and `validate.mjs` passed throughout. Every other node was scanned the same way and none is affected; that the validator does not catch it is recorded as owed. On the substance, the counter-argument lands: `recording`'s recommended text already resolves the pin dilemma this draft claimed as its independent ground, in a clause the draft neither quotes nor answers, so the ground is narrower than the answer says and the sentence is redrawn to say what it actually rests on. The classification sentence is conditioned rather than asserted, since how a response given in prose is classified is `recording`'s and that node's own `edits-only-through-the-kick-back` says in as many words that it waits on this sitting; `depends` now names it. `unanswered` gains the matching option, so 'recorded as an option on each' is true. The stale line anchors are corrected by measurement, the fence running 498 to 568. The price sentence now names the re-reading a moved recommendation buys, which is the sentence the fact's `against` turns on. And `kick-back-ask-unchanged` goes on the fact, so the author can rule away the reach into `when-the-kickback-feedback-shows` without rejecting the routing.

### The kickback answered, 2026-09-06

Six findings, no probes, all validated at their loci and all answered.

The first was the session's own and structural. Seven stray fence and rule
markers, left by the hand-assembly of the draft from the design unit's file,
folded the whole `## Rationale` into `## Answer` and the whole `## Account` into
the authority fact's reason. The reader was given one answer of 6,659 characters
and no account at all, and judged the node anyway; `validate.mjs` reported the
graph sound throughout. The markers are removed and the node parses as 1,682
characters of rationale, 11,332 of account and 4,943 of answer. Every other node
of the record was then checked the same way, by comparing each file's headings
against what the reader returns for it, and none is affected. That the validator
cannot see this is owed to the frontier and is not repaired here.

The counter-argument lands and the answer is narrower for it. The draft claimed
an independent ground beyond the author's words: that a ruling pins the
recommendation it answered, so an edit inside a confirmation pins either a
reading the author never made or a text they replaced. `recording`'s recommended
text has already resolved that, pinning `of` as the edits leave it, in a clause
the draft neither quoted nor answered. So the dilemma is not open and the answer
rests on what it always rested on, the author's words and the page's own shape.

With it goes the classification sentence, which decided `recording`'s question
against `recording`'s own recommendation and cited that node for a rule it does
not state. What the page does is this answer's: no control here stages an edit.
What a session does with words that amend an option is `recording`'s, and that
node's `edits-only-through-the-kick-back` says in as many words that it waits on
this sitting. The sentence is now conditional on that ruling, and
`recording#edits-only-through-the-kick-back` is entered in `depends`, which was
empty, so nothing kept a ruling here from coming first.

The rest: `unanswered` now carries the matching option
`two-responses-where-the-page-offers-them`, so the claim that the consequence is
recorded on each node is true rather than half true; the account's line anchors
into `alignment-page` were stale by twenty-nine lines after the day's landings
and are re-measured, the fence running 498 to 568; the price sentence now names
the clean-context re-reading a moved recommendation buys, which is the cost the
fact's own `against` turns on; and `kick-back-ask-unchanged` goes on the fact, so
the author can rule the routing without ruling on a control whose wording belongs
to `when-the-kickback-feedback-shows`.

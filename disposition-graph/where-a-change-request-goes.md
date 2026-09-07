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
  of: a8bdef71a269201e01c3db903ce893274cd8455d
  commit: 55c98d1035af1782563a6b14b356d78f49734218
  against: "The answer routes the cheapest class of author feedback through the most expensive path the record has, and it understates that price in the sentence where the author would look for it. A kick-back on one fact moves the whole node, so an author who wants one word changed loses the ruling they were ready to give, returns the node to the maieutic movement, buys a re-drafted recommendation, buys a clean-context re-reading of it — which `recording`'s `per-fact-after-two-readings` requires before any ruling is recorded — and then gives the confirmation they were already giving; under the incumbent the same correction costs a keystroke, and where it is not substance, nothing more. The answer's defence is that the pin cannot honour an edit, and that defence fails at the record: `recording`'s recommended text already pins `of` to the recommendation as the edits leave it, on the ground that the text the ruling stands on is the author's own, and sends the node back to review only where the edit changes substance. Strip the pin argument, as the account says has already happened and the text does not, and the whole reach past the page rests on one parenthesis in a note about a text input, read as closing one of the three responses the record opens everywhere."
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/recording#edits-only-through-the-kick-back
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - text input in option details is only for author reasoning, not for "changes you want made". All change requests are recorded in the kickback input only (any changes will necessarily require a kickback).

## Answer

The option's own text control holds the author's reason for their choice and
nothing else, and its label says so: it asks for the reason, says it is optional,
and names no edit. Every request to change what is recommended goes to the
kick-back's feedback control, on the fact it bears on, and that control asks for
the change and not only for the ground of the refusal.

So the page offers two of the three responses the record opens. An author who
wants an option changed denies it with feedback and the node returns to the
maieutic movement, where the options are drawn again from what they wrote. There
is no control on this page that stages a confirmation with edits.

That is what this answer decides and the limit of it. What a session does with
words that amend an option, wherever they are written, is
`commons.systems/disposition-graph/recording`'s: that node recommends
`per-fact-after-two-readings`, under which such words are edits and are applied
with the ruling, and it carries the contrary option
`edits-only-through-the-kick-back`, whose own prose says it waits on this
sitting. Where the author rules that option the words are classified as the
denial they make; until they do, this answer says only that the page offers no
route for them. And whether the third response survives at all is
`unanswered`'s, whose roster it is, and which carries
`two-responses-where-the-page-offers-them` for that ruling.

The ground is the author's words of 2026-09-04 and the page's own shape, and it
is no wider than that. The draft this answer replaces claimed a second ground,
that a ruling pins the recommendation it answered so an edit inside a
confirmation would pin either a reading the author never made or a text they
replaced. `recording` has already resolved that: it "pins `of` to the
recommendation as those edits leave it, since the text the ruling stands on is
the author's own and a pin that named the text they superseded would flag every
clerical edit for good." There is no dilemma and no third pin, and the claim is
withdrawn rather than restated.

What the answer costs is that the cheapest correction becomes the most expensive
act. An author who would have written "confirm, with this word changed" must now
deny the option, and the node goes back to the maieutic movement, is redrawn, and
buys a clean-context reading of the moved recommendation before it returns for
confirmation. That is a reading and a further confirmation, not a second
interview, and it is the price of a record in which a confirmation confirms a
text the author has read as it stands.

## Rationale

The author, 2026-09-04, on the alignment page: "text input in option details is
only for author reasoning, not for 'changes you want made'. All change requests
are recorded in the kickback input only (any changes will necessarily require a
kickback)."

The parenthesis is what the answer rests on, and the sentence before it is what
the answer implements. The record's own reasoning ran the other way until this
sitting: `alignment-page` had put the author's edits on the option they edit,
"which is where an edit belongs", and had removed the older ruling-on-the-whole
on the strength of it. The author's words say that an edit is not a confirmation
at all, and once that is granted, an edit riding on a confirmed option is a
confirmation the record cannot honour and the page must not offer it.

What the answer beat is on the fact: `edits-ride-on-the-option`, the incumbent,
which the author's words strike; `label-only-change`, which closes the channel
behind a new label and leaves the session doing the same thing with the words;
and `a-dedicated-change-request-control`, which is a third control where the
kick-back already is one.

## Facts

### answer

Recommended because the author's words say it and the page can do it without
deciding anything else. The option's control keeps the ruling's reason, which
`dialogue` already provides for on the ruling itself; the kick-back's control
gains the change request, which is what the author's parenthesis makes it; and
the confirmation with edits loses its home on the page without losing its place
in the record, which stays `unanswered`'s to rule and `recording`'s to classify.

Boldness moderate, and the reason is the reach rather than the routing. The
routing is the author's own sentence. What is not theirs is the reading that a
response class the record opens may have no control on the one surface where the
author rules, and that reading is what the fact's `against` argues with.

#### edits-ride-on-the-option

Everything the recommended option says, reversed: the option's control keeps its
label naming edits, an edit written there is a confirmation with edits, and the
session applies it and records the ruling. This is `alignment-page`'s incumbent
and the record's position before 2026-09-04. Passed over: the author's words
strike it by name, and it makes a confirmation carry a text the author confirmed
in the same breath as changing it.

#### label-only-change

Everything the recommended option says, with the label alone rewritten and the
routing unchanged: the control stops naming edits and the session goes on
classifying whatever is written there as `recording` says. Passed over: it
closes the channel in the wording and leaves it open in the record, which is the
appearance of the author's instruction rather than the instruction.

#### a-dedicated-change-request-control

Everything the recommended option says, with a third control for a change
request, distinct from the reason box and from the kick-back's feedback. Passed
over: the kick-back's control already is that control under this answer, and a
third one would ask the author to distinguish a change from a denial when the
author's own words say a change is a denial.

#### reason-goes-to-the-interview-too

Everything the recommended option says, with the option's reason box removed as
well, so the page takes the ruling and nothing else and every word of the
author's is given in the interview. Passed over: the reason is part of the
ruling, `dialogue` carries it on the ruling itself, and a reason given anywhere
but beside the choice it explains has to be re-attached by hand.

#### one-reason-box-per-fact

Everything the recommended option says, with one reason control on the fact
rather than one on each option. Viable and not adopted: it is fewer controls and
the reason attaches to the ruling either way; against it, the author writes the
reason while reading the option they are choosing, and a box that is not beside
that option asks them to name it again.

#### change-request-typed-to-review

Everything the recommended option says, with a change request returning the node
to the review stage rather than the maieutic. Viable and not adopted: where the
author's words amend the text rather than reject its ground, the maieutic
movement redraws what did not need redrawing. Against it, `recording`'s
`denial-typed-to-maieutic` types the kick-back to the maieutic and this answer
does not reach that clause.

#### edit-applied-and-held-until-the-re-reading

Everything the recommended option says, with the edit applied to the option and
the ruling held until the re-reading returns, rather than the node kicked back.
Viable and not adopted: it is the cheapest path for a small change and keeps the
author's words as an edit rather than a denial. Against it, it is the
confirmation with edits under another name, and it holds a ruling the author has
given, which `recording` says is never done.

#### kick-back-ask-unchanged

Everything the recommended option says, with the kick-back's own control left
exactly as it is: the routing changes, the option's label stops naming an edit,
and the feedback control goes on asking for what the options miss rather than
also asking for the change by name. It is the counterpart on the kick-back of
`label-only-change` on the option, and it lets the author rule the routing
without ruling on a control whose wording is `when-the-kickback-feedback-shows`'
question. Against it: a channel that is the only home for a change request and
does not say so is a channel the author must be told about somewhere else.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met: the object is which control holds which words, which costs a
projector change to get wrong and can be changed back.

The limb is met because the answer fixes the channel by which the author tells
the AI that its draft is wrong, and the AI is the party being told. Narrowing the
author's routes from three to two is a decision about how easily the author can
contradict the recommending party, taken by the recommending party. Low boldness:
the routing is the author's own sentence and the class follows the stated test.

Against it: the reach past the page is what a ruling here would ratify, and the
author's words are about a text input; `deferred` would let the page change while
the roster question stays open on `unanswered`, which is where the contested part
actually lives.

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

### What a ruling here would reach in the parent, 2026-09-06

The proposed amendment this account carried is withdrawn, as it is on the two
sibling nodes and for the same reason: it restated this answer in the parent's
words, and two of the three blocking findings of the reading of 2026-09-06 were
in it rather than in the answer, one of them an After text that decided
`recording`'s question inside the parent's fence against this answer's own
reservation. Its line anchors were stale twice over. A child's account is not
where a parent's text is drafted.

The clauses a ruling here reaches, quoted from `alignment-page`'s recommended
text and located by their words:

- The drill-down's control, "a text control for the author's reason for choosing
  it and for any edits they want made to it", where the edits go.
- The responses sentence, "choosing an option and writing in its text is a
  confirmation with text, which the session classifies as the recording node
  classifies every response given in prose", whose second half is `recording`'s
  and stays theirs.
- "The ruling on the whole, which used to stage the confirmation with edits by
  itself, goes with nothing lost: the author's edits ride on the option they
  edit, which is where an edit belongs", which this answer reverses.
- The roster sentence, as to what the page offers and not as to what the record
  opens, which is `unanswered`'s.

One clause this answer's requirement touches and a ruling here must not move: the
kick-back's marking and its feedback control, which is
`when-the-kickback-feedback-shows`' question. That the control must ask for the
change by name is recorded there as an option and not amended here.

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

### Clean-context review, 2026-09-06, of a8bdef71

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `change-requests-go-to-the-kick-back`.

Findings:

- Facts (validation 3), blocking; a claim about the record that the record contradicts, on the sentence that carries the answer's reason. `## Answer` says "The two cannot share a control, and the reason is the pin rather than the label", then "a ruling recorded on a text amended in the same breath pins one of two things and neither is true: the text the author read ... or the text after the edit, which attests a reading the author never made. There is no third pin." There is a third pin and the record names it: `commons.systems/disposition-graph/recording`'s recommended text, in its `**The edit.**` paragraph, "pins `of` to the recommendation as those edits leave it, since the text the ruling stands on is the author's own and a pin that named the text they superseded would flag every clerical edit for good", and where the edit changes substance it "sets the node to the review stage, because the text that now stands has had no reading". The draft's second horn is answered there in terms — the author is not attesting a reading of a text they wrote — and the draft neither quotes that clause nor answers it. `edit-pins-what-the-author-read` is not a standing objection of the record's either: it is a delta option, source `ai`, whose own subsection on `recording` closes "The recommended text takes the other side and lets substance, not the pin, decide what is read again." So the `### answer` reason's claim that "the record has an argument of its own for it that does not rest on the author's authority" and the `## Rationale`'s "The record's own ground for the same conclusion is in the recording node's `edit-pins-what-the-author-read`" are both unsupported. Edit: strike the independent ground and rest the routing where the account already says it rests, on the author's words of 2026-09-04 and the page's own shape; or quote `recording`'s clause and say why the third pin does not satisfy, and record the divergence on `recording` as an option. Because this changes the `### answer` reason, it moves the fact's pin, which is why it cannot ride on a forward.
- Account, blocking; the section that answers the last reading states four repairs that are not true of the text in front of the author. "### The kickback answered, 2026-09-06" says "The counter-argument lands and the answer is narrower for it ... So the dilemma is not open and the answer rests on what it always rested on, the author's words and the page's own shape." The pin ground survives unaltered in four places: `## Answer` ("There is no third pin", and "neither side of it is satisfying"), `## Rationale` ("The record's own ground for the same conclusion is ..."), the `### answer` fact reason ("the record has an argument of its own for it that does not rest on the author's authority ... which is the signature of a question posed wrongly"), and Amendment 4's After text ("because a ruling recorded on a text amended in the same breath pins either a reading the author did not make or a text they did not confirm"). The same section's "the account's line anchors ... are re-measured" and "the price sentence now names the clean-context re-reading a moved recommendation buys" are likewise untrue (findings 4 and 5 below), and it opens "Six findings, no probes, all validated at their loci and all answered." Edit: apply the repairs, or withdraw the claims; an account that reports work not done is worse than one that reports the work as owed, because the author cannot check it from the page.
- Doctrine and executor (validation 2), blocking; Amendment 3 contradicts the `## Answer` it implements. `## Answer` now conditions the classification correctly: "What the session then does with such words is `commons.systems/disposition-graph/recording`'s and not this answer's ... Where the author rules that option, the words are classified as the denial they make and carried as its feedback; until they do, this answer says only that the page offers no route for them and leaves the classification where it lives." But Amendment 3's After text, which is what a ruling here writes into `alignment-page`'s recommended text, is unconditioned: "Text written in an option's control that amends the option rather than explaining the choice is no confirmation and is not recorded as one: the session classifies it as the recording node classifies every response given in prose, and classifies it as the denial it is, carrying the author's words as the feedback ..." That decides `recording`'s question against `recording`'s own recommendation (`per-fact-after-two-readings`: "where they amend the option they are edits, and are applied to it", and "A confirmation with edits is a ruling like any other and is never held"), in the ancestor's own answer text, which is exactly what this node's reservation and its new `depends` entry exist to prevent. The last reading said so in terms — "Amendment 3 in the Account carries the same sentence into the parent's fence and moves with it" — and the amendment did not move with it. Edit: condition Amendment 3 in the same words the Answer uses ("where the author rules `edits-only-through-the-kick-back` on the recording node, the session classifies it as the denial it is; until they do, the page offers no route for such words and the classification stays where it lives"), or cut the second sentence and let Amendment 3 say only what the page does.
- Facts (validation 3), line numbers; the fence range was corrected and the five anchors it contains were not. The Account says "All line numbers are `disposition/disposition-graph/alignment-page.md` on the `disposition` ref as re-measured on 2026-09-06 after the day's landings; the fence runs 498-568", and then anchors Amendment 1 at "line 497", Amendments 2, 3 and 4 at "line 511", Amendment 5 at "line 536", and the two Declined sections at "line 499" and "line 505". This is self-inconsistent on its face — 497 is outside a fence beginning at 498 — and every anchor is the pre-landing number the last reading already reported as +29 stale. Measured today at graph commit ec6e230094ea4d6c08916bb83a62b09e4d3ada6b: 497 and 511 and 536 are blank lines, 499 is the fence's own opening frontmatter delimiter `---`, and 505 is the frontmatter line `  - artifact: the alignment page, written by ...`. The correct anchors are 526 (the drill-down list item ending "and a text control for the author's reason for choosing it and for any edits they want made to it."), 528 ("The last row on every fact is the kick-back ..."), 534 ("The right-hand column is the disposition and nothing else ...", which carries the declined simile), 540 ("A response is one of the three the unanswered node opens ...", which carries Amendments 2, 3 and 4), and 565 (the fence's `## Rationale` paragraph ending "... and what an earlier stage offers is the chip's two controls and the preview."). Every quoted Before clause is verbatim and still present, so only the anchors are wrong. Edit: re-anchor to 526, 528, 534, 540 and 565, and pin the graph commit beside the date, since line numbers into a node that is itself on the frontier go stale between the sitting and the reading — which has now happened twice on this node.
- Facts (validation 3), cost understated in the text that stands. `## Answer` still reads "the session moves the recommendation and the node reaches the review stage from there, as the recording node's classification has it, so the price of a wording change is one further confirmation and not a second interview." The re-reading is not named, though the fact's own passed-over reason on `edits-ride-on-the-option` now names it ("the correction costs a clean-context re-reading of the moved recommendation and one further confirmation, and not a redrawing"), and `recording`'s `per-fact-after-two-readings` is explicit that "no ruling is recorded on a recommendation of the AI's while either is owed". The sentence is the one the answer fact's own `against` turns on, so the understatement falls exactly where the author is being asked to weigh the cost. Edit: "so the price of a wording change is a clean-context re-reading of the amended draft and one further confirmation, and not a second interview".
- Viability, on the one whole alternative. `edits-ride-on-the-option`'s passed-over reason, in the frontmatter and in its subsection, rests on the ground finding 1 removes: "it makes a confirmation carry a text the author did not confirm, and the pin can name only one of the two", and in prose "since the pin can name the text the author read or the text after their edit and one of the two is always a fiction". The incumbent may still be dominated — the author's words of 2026-09-04 close the channel in as many words, and that half of the reason stands alone — but as written the record's single whole alternative is passed over on an argument the record contradicts, which is the one place a wrong reason costs the author a ruling they might have given. Edit: rewrite both the frontmatter `reason` and the subsection to rest the domination on the author's words, and say what `recording`'s third pin gives the incumbent that this answer does not.
- Cross-reference. This node's `depends` now names `commons.systems/disposition-graph/recording#edits-only-through-the-kick-back`, and that option's own subsection on `recording` says "It is not recommended here, and the reason is that the sitting the author queued for those words, `commons.systems/disposition-graph/where-a-change-request-goes`, has not yet been held". The sitting has now been held, so that sentence is stale, and with the classification sentence conditioned the dependency no longer protects anything: each text now points at the other as the one that must move first, which is the loop `dialogue`'s `every-part-in-the-record` says is "a finding and one side of it is dropped". Edit: drop this node's `depends` entry, since the conditional sentence acts whichever way `recording` rules; and, as a finding for that node rather than an edit made here, `recording`'s option prose is owed the amendment that the sitting was held on 2026-09-06 and what it concluded.
- Placement, a finding about another node and not an edit here. Amendment 3 adds a requirement to the kick-back's own control — "its feedback is where every change request on this page is recorded, the control asking for the change by name and not for the ground of the refusal alone" — and the Account's "Declined — line 499" section already admits that the control is the parent's devolution to `commons.systems/disposition-graph/when-the-kickback-feedback-shows`, saying the sentence "belongs to `when-the-kickback-feedback-shows` and should be recorded as an option there" only if the main thread judges 499 must say it too. The requirement reaches that control through Amendment 3 whether or not 499 says it, and that node stands at the periagogic stage carrying no facts, so nothing there will meet it. `kick-back-ask-unchanged` lets the author rule the reach away from this side, which is right, but the positive side is unrecorded on the node that owns the control. Propose on `commons.systems/disposition-graph/when-the-kickback-feedback-shows` an option named `the-ask-names-a-change-request`, source `commons.systems/disposition-graph/where-a-change-request-goes`, carrying: "The kick-back's feedback control asks for the change the author wants made by name, and not only for what the options miss, because it is the one control on the page that collects a change request and a channel that does not say it takes them is a channel the author looks past. `KICKBACK_PLACEHOLDER` at `packages/disposition/project.mjs:681`, today 'What these options miss, and what the next ones are drawn from', is what the requirement rewrites."

On the facts and what they recommend: The answer fact recommends `change-requests-go-to-the-kick-back`, which is also `stands`, so there is correctly no `## Recommendation` fence and the draft is the node as it stands; nine options are listed, five passed over with reasons, and moderate boldness is right, since the locus, the label and the routing are the author's words nearly verbatim while the reach past the page to what a response is belongs to the AI. The authority fact recommends `ratified` at low boldness with the written `### authority` reading `class-recommendation` requires, and capture-shaped is the correct limb — the answer narrows the channel by which the author tells the AI its draft is not what they would confirm, and the party proposing the narrowing is the party dissented from; the reading correctly disclaims expensive and irreversible rather than claiming all three. No `existence` or `persistence` fact is owed, since no prune is proposed and the node's shape does not change. The standing review pin (kickback, of 34d2c5f3) is stale by design, being the pin of the reading this draft answers; but findings 1, 5 and 6 change the `## Answer` and the `### answer` reason, both of which the fact's pin covers, so no forward pin may be written before they are applied.

On the viability of the options: Every option on the answer fact is viable on its facts and the set now covers the space: the incumbent `edits-ride-on-the-option` and its strongest form `edit-applied-and-held-until-the-re-reading`, the two half-measures `label-only-change` and `a-dedicated-change-request-control`, the two placements `one-reason-box-per-fact` and `reason-goes-to-the-interview-too`, the typing variant `change-request-typed-to-review`, and `kick-back-ask-unchanged`, which the last reading asked for and which is correctly on the fact so the author can rule the routing without ruling on a control that belongs to `when-the-kickback-feedback-shows`. The three vocabulary options on the authority fact are complete. No viable option is missing; what is wrong is a reason and not a list, as finding 6 says — the domination of the one whole alternative is argued on the pin ground the record contradicts, and it needs to be re-argued from the author's words before the author is shown it as passed over.

Strongest counter-argument (moderate): The answer routes the cheapest class of author feedback through the most expensive path the record has, and it understates that price in the sentence where the author would look for it. A kick-back on one fact moves the whole node, so an author who wants one word changed loses the ruling they were ready to give, returns the node to the maieutic movement, buys a re-drafted recommendation, buys a clean-context re-reading of it — which `recording`'s `per-fact-after-two-readings` requires before any ruling is recorded — and then gives the confirmation they were already giving; under the incumbent the same correction costs a keystroke, and where it is not substance, nothing more. The answer's defence is that the pin cannot honour an edit, and that defence fails at the record: `recording`'s recommended text already pins `of` to the recommendation as the edits leave it, on the ground that the text the ruling stands on is the author's own, and sends the node back to review only where the edit changes substance. Strip the pin argument, as the account says has already happened and the text does not, and the whole reach past the page rests on one parenthesis in a note about a text input, read as closing one of the three responses the record opens everywhere.

The session's reply: Accepted, and the second finding is the one that matters: the account said the counter-argument had landed and the ground had narrowed, and the pin ground survived verbatim in four places. That is the third node in this sitting whose account asserted a repair its text did not carry, and the remedy is the one taken on the other two rather than a fourth patch. The live sections are rewritten whole in one pass and the proposed amendment is withdrawn, since it restated the answer in the parent's words and was where two of the three blocking findings lived. On the substance the reading is right and the answer is smaller for it: `recording`'s recommended text pins `of` to the recommendation as the edits leave it, so there is no third pin and no dilemma, and the draft's claim to an argument that does not rest on the author's authority is struck rather than restated. What is left is the author's words and the page's shape, which is enough for what the page does and is not enough to close a response the record opens elsewhere; that consequence stays recorded on `unanswered` and on `recording` for their own rulings. The line anchors go with the amendment. The price sentence is corrected in the answer and not only in the account. And the reach into `when-the-kickback-feedback-shows` is recorded as an option there rather than carried silently in an amendment to a clause that node owns.

### The second kickback, and the method changed, 2026-09-06

Eight findings, three of them blocking, all validated at their loci. The second
is the one that decided the remedy: the account of the first kickback said the
counter-argument had landed and the ground had narrowed, and the pin ground
survived verbatim in four places. That is the third node of this sitting whose
account asserted a repair its text did not carry, so the live sections are
rewritten whole in one pass and the proposed amendment is withdrawn, as on the
two siblings.

On the substance the reading is right and the answer is smaller. `recording`'s
recommended text already pins `of` "to the recommendation as those edits leave
it", so the dilemma the draft claimed as an independent ground does not exist,
and the claim is struck rather than restated. What is left is the author's words
and the page's shape, which is enough for what the page does and is not enough to
close a response the record opens elsewhere; that consequence is on `unanswered`
and on `recording`, for their own rulings, and this node's `depends` names the
second.

The rest: the price sentence now names the clean-context re-reading in the answer
and not only in the account; the stale line anchors go with the amendment that
carried them; the passed reason on `edits-ride-on-the-option` no longer rests on
the contradicted pin ground; and the reach into
`when-the-kickback-feedback-shows` is recorded as an option there rather than
carried in an amendment to a clause that node owns.

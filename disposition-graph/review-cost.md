---
question: What does a clean-context review cost, and how is that cost bounded?
stage: maieutic
facts:
  - name: answer
    options:
      - name: neighbourhood-questions-and-delta
        source: ai
        ref: "2026-09-05"
      - name: one-reading-per-draft
        source: ai
        ref: "2026-09-05"
      - name: neighbours-carried-whole
        source: review
        ref: "2026-09-05"
      - name: answers-only-index
        source: review
        ref: "2026-09-05"
      - name: full-index-per-draft
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "a draft's reader is given one draft as its object, and the standing answer of every node it does not touch is the batch's object, which became the survey's when the review divided by its object"
      - name: no-index-at-all
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase"
      - name: full-re-read-on-every-move
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the amendment's difference from the pinned text is known exactly, and reading the node whole pays the object's price a second time to find it"
      - name: unbounded-rounds
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "a reader asked for findings returns some, so the loop ends when a reader happens to be quiet and not when the draft is sound"
      - name: budget-per-sitting
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "it stops the reading by the clock, and what it stops is whatever stood last in the queue rather than what was least worth reading"
      - name: neighbourhood-cited-not-restated
        source: review
        ref: "2026-09-05"
      - name: pin-names-the-text-the-reader-read
        source: review
        ref: "2026-09-05"
      - name: brief-carries-the-recount-command
        source: review
        ref: "2026-09-05"
      - name: rules-of-the-reading-named-as-files
        source: review
        ref: "2026-09-05"
        status: passed
        reason: "it saves the 65,882 bytes the twelve rule nodes cost in every brief and buys back the double read, the reader opening each of the twelve by instruction and five of them twice, which is the fourth measurement in the rationale and the one the brief was cut to remove"
      - name: a-cap-on-redraws-per-node-per-sitting
        source: ai
        ref: "2026-09-05"
      - name: one-answer-a-node-and-one-read
        source: ai
        ref: "2026-09-07"
      - name: a-waves-brief-is-one-brief
        source: commons.systems/disposition-graph/clean-context-review
        ref: "2026-09-07"
      - name: the-surveys-unreached-node-is-one-line
        source: commons.systems/disposition-graph/frontier-consistency
        ref: "2026-09-07"
    recommends: one-answer-a-node-and-one-read
    boldness: moderate
    against: "Every clause of it narrows what the reviewer is shown, on measurements taken by the party the review exists to check. A reader that must search for what it is no longer given searches for what it thinks to look for, which is the drafter's own frame, and the failure the index guarded against, a contradiction with a node nobody thought to name, is the one failure a search cannot be aimed at. The answer's reply, that the survey holds the whole graph and is the reader of last resort, is good only while the survey runs before every ruling; this design moves that load onto it: at graph commit 1cde11f6 on 2026-09-05, before the first survey ran, forty-eight nodes stood at the review or the ruling stage and none carried a survey pin, and what the survey costs once the load is on it is the question the author raised on 2026-09-07 and `survey-cost` answers beneath this node."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "The author's words on the viable-options node delegate the right-sizing of models and effort to the AI's judgment where it buys token efficiency, and their words here ask the AI for the lessons and grant the reconciliation, which reads as the same delegation; a class that sends every later adjustment of the review's object back to the author spends the author's attention on the thing they asked to be spared."
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-07
  of: 0afcc1f1f65b18957dbddcdf2fd0c12e19672ebb
  commit: bcba6986c6a8718919485e38f5d00994f4c7bba9
  against: "Read narrowly against only the last reading's own finding, the amendment fully answers it: the rewritten `against` clause removes exactly the phrase flagged (\"as of 2026-09-05 the survey has never run once\") and rescopes the claim to the pre-survey state at graph commit 1cde11f6, tracking the suggested edit almost verbatim, and the rationale's parallel fix (made in an earlier round, before this pin) is untouched and still correct. The `survey-cost` citation this reading raises is a different defect, introduced in the course of answering the first one, and not a failure to answer what the last reading actually asked; a reader could reasonably treat it as a minor forward-reference to work the author has already commissioned (the 2026-09-07 disposition asks for exactly this kind of follow-on question) rather than as a fabrication, and record it as an option on the fact instead of a kickback. Against that: the sentence is written as a present-tense fact about the record's current shape, not as a stated intention, and a reader who takes it at face value is told something false about what has already been answered."
  survey:
    date: 2026-09-07
    of: b9e1b4e5b54bd35bfd1a6bc94aeaab7bfc8b9c32
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - neighbourhood
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-05, during the sitting's readings, after three readers died on their models' session limits:

> This review process is burning tokens very rapidly. Some of it is acceptable as cost of draining a backlog. Are there lessons from this sitting to inform improvements to the alignment review disposition - esp. for the optimization of token usage, context management and AI attention?
>
> If so, record and reconcile that disposition first before proceeding with review (you have bootstrap authority)

And, in the same turn, on the model the readings run on:

> Continue with opus instead of fable

The author, 2026-09-07, on the cost of the clean-context reading, asked of the session after a wave of readings on the alignment page's children:

> this iterative clean-context reading is very expensive. Are there token/context optimizations that would achieve similar quality results? eg. is the model choice (fable/opus/sonnet) right sized for the task?

The author, 2026-09-07, in the same turn's continuation:

> also consider optimzations to the dialogue workflow

The author, 2026-09-07, after the session's assessment of where the cost goes:

> record the recommended optimizations as dispositions, progress them up to confirmation, and include them in the list of reconciliations of alignment dialogue/review/survey/artifact

The author, 2026-09-07, later in the same turn:

> begin applying the optimizations as you progress

The author, 2026-09-07, while the survey of that day was running:

> The fronteir-survey appears to be very expensive. Is it part of the recommended alignment design from this sitting? What function does it serve that's not served by the frontier consistency check?

The author, 2026-09-07, in reply to the session's answer on what the survey serves and what it costs:

> do not stop the current survey, we do not want to lose the work it has already done. For future surveys, make your own recommendation about how to optimize. It could involve changes to how data on unconfirmed nodes is accumulated, or how the survey is orchestrated, improvements to the algorithms/heuristics for full graph analysis, or any other optimization that you recommend. Fold this optimization in to the sittings alignment and bootstrap reconciliation.

The author, 2026-09-07, while the design of the survey's optimization was in hand, on what shape it must take:

> The optimizations must involve some accumulation strategy, with the full history preserved only in git but enough context in the unconfirmed node to support alignment across an unconfirmed frontier. Something between keeping the full pre-confirmation record in the graph and the accumulation that is performed after confirmation. One the recommendation is established, you have bootstrap authority to reconcile that accumulation.

The author, 2026-09-07, in the next turn:

> (The accumulation strategy may be used in conjunction with other recommended optimizations)

The author, 2026-09-07, when the design had been drafted and before it was recorded:

> stop before reconciling the accumulation strategy. First describe the recommended strategy to let me review.

The author, 2026-09-07, after the session described the recommended accumulation strategy, refining the disposition on what an option carries and what an unconfirmed node keeps:

> record this refinement to disposition and ensure the accumulation strategy supports it:
> - each option for each fact is recorded with its actual fact content so that when the author selects an option via the alignment artifact the context pane is dynamically updated to preview the node that is being confirmed.
> - "standing" is just a label that can be applied to an option (similar to an AI recommendation) to indicate that it was the last confirmed option for that fact on that node.
> - the expanded details of an option (before and also after confirmation) shows a) the history of author quotes that both support and/or contradict the option (implies that one quote may be reference by multiple options) b) the accumulated/current AI support and/or rejection rationale for that option (independent of ultimate recommendation)
>
> Anything else that doesn't support the alignment dialogue/artifact disposition is subject to accumulation/removal.

The author, 2026-09-07, in the next turn, granting the reconciliation of the refinement above:

> reconciliation of that disposition in included in the bootstrap reconciliation authority for this sitting

## Facts

### answer

`one-answer-a-node-and-one-read` is recommended. It is `neighbourhood-questions-and-delta` with four clauses added, and the argument for the text it amends is unchanged and stands in the subsections below; what is new is the author's words of 2026-09-07, that this iterative clean-context reading is very expensive, that the recommended optimizations are to be recorded as dispositions and progressed, and that they are to be applied as the sitting progresses, together with a sixth measurement taken on the seven briefs that sitting's own readings were handed.

The measurement is what decides it, and what it says is that the parts this node sized on 2026-09-05 are no longer where the cost is. Of 2,585,266 bytes over the seven draft briefs of 2026-09-07, 465,864 are the `## Account` of the node under review -- eighteen percent, and on the `alignment-page` brief 196,599 of 623,345 -- which grows with every reading applied and is the dialogue's history this node already refuses to carry for a neighbour. A further 262,496 are the standing answer of a node whose recommended answer is carried in the same brief beside it: ninety-four neighbour renderings across the seven carry two texts of one node, one as it is and one as it is about to be, in front of a reader judging a third node. Those two clauses take 728,360 bytes off the seven, twenty-eight percent, and neither touches what the reader is asked to judge. The third clause is the reading rather than the brief: `draft-growth.brief.md` is 2,081 lines and `draft-alignment-page.brief.md` 4,692, read in seven pieces and in sixteen under a bound of three hundred lines whose reason was one reader that died on a 6,944-line brief, while the navigation line of each of those same briefs told its reader to read it whole. The fourth is where a reading's attention goes rather than where its bytes go: of the fourteen findings the reading of `growth` returned on 2026-09-07, the session counted seven as defects an instrument decides, and of the six kinds named in the answer the validator today holds one, a `passed` row with no reason, and none of the other five.

Moderate boldness. What rests on the author is the criterion, now stated three times, token and context efficiency and the management of the AI's attention, together with the instruction to apply the optimizations while progressing them. What rests on the AI is all four clauses, the measurement they are drawn on, taken by the party the reading exists to check, and one placement: the rule that a mechanical defect is the instrument's was put to this session for the node above, and is recommended here, because it is a rule about what a reading's attention is spent on, which is this answer's own paragraph and this node's own question, while what a reading judges is the `frontier-consistency` node's list, which this rule leaves as it is.

#### neighbourhood-questions-and-delta

The rules the recommended text sets out: a draft's brief carries its neighbourhood in full, and the rules of the reading itself in the same way rather than as a list of files for the reader to open, and every other node as its id and its question on one line; a re-reading's object is the amendment and not the node; a draft gets two readings of one answer, a kickback being a new answer and not a third round, and what survives goes to the author as an option; and a brief is written to be held whole by the reader that gets it.

#### one-reading-per-draft

The re-reading goes entirely: a draft is read once, the session amends in answer to the findings, and what the amendment got wrong is caught by the survey, which reads the whole graph before the author rules and is the record's reader of last resort by the frontier-consistency node's own answer. It is the cheapest answer on the table and it is not dominated: it costs one reading per draft against the recommended two, and the survey it leans on is owed before every ruling anyway. It is not recommended because the survey's object is the frontier's consistency and not this draft's claims, so an amendment that answers a finding wrongly, or that introduces a false statement about the record in the course of answering it, is exactly what the survey is not reading for; every one of the amendments this sitting wrote was written by the party whose draft the findings were against.

#### neighbours-carried-whole

The recommended answer with one clause struck: the neighbourhood is carried, and each neighbour whole, as the briefs of this sitting carried it. It is named as its own option because a ruling has to be able to take it, and the clause is the one a reader who thinks the review should see everything would strike first; it was also reached by measuring the recommended option's own reconciliation rather than by argument, which is a weaker provenance than the rest of the answer and the author should see that it is. It is not recommended because sixteen neighbours rendered whole were 2,709 lines of a 3,181-line brief written to judge a 208-line node, so the clause is most of what the answer does. What it would cost is real and this sitting's own reader paid it: given its neighbours by answer only, the reader of this draft had to open `clean-context-review.md` from disk to run the validation that asks whether the draft contradicts the node above it, because that validation turns on the neighbour's option prose and not on its answer. The recommended answer takes that finding as a bound rather than as a strike, and carries in full any neighbour option the draft itself sourced.

#### answers-only-index

Raised by this node's own reading. The index carries each node's id, question, file and standing answer, and nothing of its facts, options, rationale or recommendation: roughly a quarter of the index this sitting measured, and a small multiple of the one-line index. What it would answer is precisely the cost the recommended answer records against itself, that a reader shown only questions can see that a question exists without seeing how it was answered, which is enough to propose a merge and not enough to argue one. It is not recommended because the standing answers are the survey's object by the frontier-consistency node's answer, and a per-draft index that carries them is the batch's reading returning under another name; but the reading is right that this is the frontier's real middle point, and the author should rule on it rather than on the two ends.

#### full-index-per-draft

Every draft's brief carries the standing answer, the facts and the rationale of every node in the record, as the briefs of 2026-09-04 and 2026-09-05 did. What it would answer: the reader sees the whole record and can find a contradiction with any part of it without being told where to look. Passed over because a draft's reader is given one draft as its object, and the whole record is the object of the other reading; the index in the per-draft brief is what the batch's reading left behind when the review divided by its object on 2026-09-04, and the findings this sitting returned show what the reader used, the node, its ancestry, its depends, the options it names, its siblings, the readings that bear on it, and the implementation.

#### no-index-at-all

The brief carries the neighbourhood and nothing of the rest of the record, the reader searching the graph for whatever else it needs. Passed over because the fifteenth validation asks the reader whether the record already asks this question somewhere else, and a reader that has never seen the other questions cannot search for them: the list of questions is what makes that validation checkable, and it is one line a node.

#### full-re-read-on-every-move

A recommendation that moves after its reading is read again from the beginning, the whole node and the whole brief, as this sitting did. Passed over because the record already knows what moved: the reading carries the pin of the text it read, and the difference between that text and the amended one is the amendment. Reading the node whole to find it pays the object's price a second time.

#### unbounded-rounds

The reading and the amendment repeat until a reading returns no findings. Passed over because a reader asked for findings returns some, and a reading that always finds something makes the loop end when a reader happens to be quiet rather than when the draft is sound; all thirteen of the readings this sitting landed on 2026-09-05 had findings accepted and moved their node's pin, so the loop as run has never once terminated of its own accord.

#### budget-per-sitting

A token budget for the sitting's reviews, the reading stopping when it is spent. Passed over because it stops the reading by the clock: what goes unread is whatever stood last in the queue, which has nothing to do with what was least worth reading, and the bound this answer wants is on the object of each reading and not on their number.

#### neighbourhood-cited-not-restated

The paragraph "What a draft's reading is given" states the parts of the brief
in full, and `clean-context-review` states them too; the two enumerations
disagreed on 2026-09-05 at exactly two points, `depends` against
names-by-id-or-slug, and the author's words on each neighbour, which this
node's list excluded and that node's list added, and at a third on the same
day, the nodes a draft names, which the parent's list and the generator both
carry and this node's list omitted until the reading found it. This option keeps here the
pricing, the measurement, the pointer rule, the re-reading and the cap, and
cites `clean-context-review` for what a reader is given: "what a reader is
given is the clean-context-review node's; what it costs and why each part is
that size is this node's." The case for it is `codd-update-anomaly`, and it is
measured: three amendments in two days each produced a fresh divergence in the
same sentence. Against it, the pricing argument is unreadable without the thing
priced, and a paragraph that says what a part costs while pointing elsewhere
for what the part is makes the reader hold two files to follow one argument.
The same option stands on `clean-context-review` from the other side, as
`state-what-does-not-move-and-cite-review-cost`; the two are one decision about
where the neighbourhood is stated, and ruling for one is ruling for the other.
Raised by the clean-context readings of 2026-09-05 on that node, as their
counter-argument, twice.

#### pin-names-the-text-the-reader-read

The sequencing rule this answer imposes has a consequence it does not state,
and the consequence decides whether a node can ever become ready to rule. The
reading is applied first and the amendment written after, so the review's pin
names the text the reader read; the amendment then moves the recommendation
past that pin, the frontier prints the node as changed since its review, and
readiness, which asks that the pin name the recommendation as it stands, is not
met. Under the cap no third reading is available to re-pin it. The three ways
out are the option: the second reading's apply settles the pin over the
amendment it read, which is what the applying script does today and which makes
the pin attest a forward on text no reader saw; or readiness stops asking the
draft-review pin to be current once the cap is reached and asks only that the
two readings have happened; or an amendment after the second reading is
forbidden outright and every surviving finding becomes an option. The record already holds the tradition that strikes the first:
`commons.systems/disposition-graph/review-approval-pinned-to-a-revision` says
that a practice which lets an approval stand over a revision nobody read is the
failure the pinned approval exists to convert into a visible one, "the approval
is still displayed, the reader trusts it, and the change that lands is not the
change that was read", which is exactly what settling the pin over the
amendment would do. This is not recorded as settled by any of them. Measured on this sitting: every reading of
2026-09-04 and 2026-09-05 was applied after its amendment and not before, so no
review block in the record carries a graph commit except one, every re-reading
fell back to the full draft brief, and every pin written names text its reader
had not seen. Raised by the clean-context reading of `authority` on 2026-09-05.

Measured again at graph commit 4262d092, with the record's own predicates and
not by eye: of 142 nodes, 48 carry a stage of `review` or `ruling`; 34 of the 48
are stale by `reviewStale`, their pinned recommendation differing from the one
that stands; 13 review blocks now carry the graph commit the reader read, the
sequencing rule this answer imposes having taken effect on 2026-09-05; and
`readyToRule` is true of none of the 48. The survey pin is the other half of
that zero and is a different debt, since no node yet carries one. What the
first number says is that the deadlock is not a corner case of the two nodes
that reached the cap: on a frontier the size of this one it is the ordinary
state, and every amendment a reading earns puts one more node into it.

#### brief-carries-the-recount-command

Where a draft's rationale rests on a measurement, its brief carries the command
that reproduces the number, so that the reader checks the measurement rather
than taking the drafter's word for it or re-inventing a way to re-take it. What
it would answer is the validation that asks whether a claim about the record is
true, which is the validation a reader can least afford to run by hand and the
one this node's own rationale failed twice: once when a figure exceeded the
maximum the same paragraph stated, and once when the repair for that was to
write a different number rather than to re-measure. Its cost is that the
command is a second thing to keep true, and a stale command is worse than none,
since it looks checkable. It was the clean-context reading of 2026-09-05's own
suggestion; this node answered it in the rationale with a recount instruction
instead, and the second reading found that instruction false in both its limbs,
which is why the option is on the list rather than in the prose.

#### rules-of-the-reading-named-as-files

The brief names the twelve rule nodes for the reader to open rather than
carrying them, which is what the brief did until 2026-09-04. It would save the
65,882 bytes those twelve cost in every brief, three times the index they
displaced, and it is passed over for the double read it costs: the reader
opening the twelve by instruction, five of them twice, since the five
global-tier rules are in every neighbourhood already, and reaching outside its
neighbourhood for the other seven, which is the fourth measurement in the
rationale and the cheapest cost the brief was cut to remove. The clean-context
reading of 2026-09-05 named it as a candidate this node argued against in prose
and did not list, and the delta reading of 2026-09-07 found it still unlisted;
it is on the fact so that the author sees the bytes it would save beside the
read it would cost.

#### a-cap-on-redraws-per-node-per-sitting

The cap of two bounds the readings of one answer and is silent on how many
answers a node may have, because a kickback is a new answer and owes a reading of
its own. Nothing in the record bounds the cycle those two rules make together:
draft, reading, kickback, redraw, reading, kickback, and a node can be read any
number of times while each reading obeys the cap. Measured on this record on
2026-09-05, at graph commit 73e2a04f: `clean-context-review` has been read seven
times, `what-acts-during-bootstrap` four, `class-recommendation` three, and each
of those readings was within the cap. What the option would add is a second
bound, on redraws of one node within one sitting, past which the node stops being
redrawn and goes to the author with the reading's findings recorded as options on
the fact they bear on, which is what the answer already does with a finding that
survives the second reading. Against it: the two nodes this record has read most
are the two whose answers were wrong in ways each reading caught and the last
redraw fixed, so a bound would have shipped a known defect to the author to save
tokens, and the record's own rule is that a kickback is a new answer precisely
because a redrawn answer is not the one that was read. Recorded on 2026-09-05, in
the sitting whose cost raised the question, and not recommended: what the right
bound is, or whether the right instrument is a bound at all rather than a
different first draft, is not something this sitting measured.

#### one-answer-a-node-and-one-read

`neighbourhood-questions-and-delta` with four clauses, each a bound on a part of the reading the earlier text left unpriced.

One answer a node. A node a reading is not judging is carried by one answer and never two: the answer that stands where a ruling reaches the node, the recommended answer where none does, with a line naming the other and its file. It is one rule for every reading, so the survey carries its context the same way. What it costs is that a reader shown one text cannot see how far the node moved without opening the file.

The account. The node under review is carried whole but for its `## Account`, of which the last section alone is carried, with the count of those omitted in its place. The ground is the ground on which a neighbour's account already stays in the file; the last section is kept because the previous reading's findings and the session's replies are there, and an amendment is an answer to those. What it costs is that a reading cannot see that a finding it is about to raise was raised and answered two readings ago.

The read. A brief that fits is read in the fewest pieces the reader's tool allows, and in one call where the tool reaches the whole of it, the bound on a piece staying for the brief a reader cannot hold. The brief's navigation line and the launch prompt must say the same thing, which on 2026-09-07 they did not. What it costs is that a brief which has quietly grown past what the reader can hold now fails as a dead reading rather than as a slow one.

The finding and the mechanical defect. A finding names the file and the heading and quotes its locus verbatim, so the main thread's validation is a search that returns the text or nothing; and a defect an instrument can name is the instrument's, the checks being owed to the validator and a reading that meets one still reporting it until they land. What it costs is the debt: until the validator holds the six checks, the class of defect they name is caught by nobody who is looking for it.

Raised from the author's words of 2026-09-07 and from the measurement of that sitting's own seven briefs. Three of the four clauses -- the account, the verbatim locus, and the survey's carrying rule -- were already running in the working tree at 87e4b24e under the author's instruction to begin applying, which makes this recommendation the record catching up with its instrument, the same order the option `pointers-for-what-grows-with-the-record` had on the node above.

#### a-waves-brief-is-one-brief

Everything `one-answer-a-node-and-one-read` says, with the wave's brief among what this node bounds: where a sitting's drafts are read as one wave, the shared neighbourhood is carried once and each object once, and the wave is split whenever the resulting brief exceeds what one reader holds whole.

Measured on 2026-09-07 on the four children of the alignment page, at graph commit `d0942d57` and implementation commit `87e4b24e`: `draft-authors-words-on-the-page.brief.md` 307,920 bytes, `draft-what-an-option-row-carries.brief.md` 389,802, `draft-where-a-change-request-goes.brief.md` 317,061 and `draft-where-the-unconfirmed-indication-goes.brief.md` 344,563, totalling 1,359,346, of which the parts common to all four run 249,607, 255,194, 256,936 and 256,305 bytes, differing between them only by which of the four each brief excludes from its round and its siblings. One brief carrying their union once and the four objects once is about 598,240 bytes, fifty-six percent less than the four. That figure is a projection: no generator writes a wave brief. The one wave the record has run, later the same day at graph commit `2abca334` and implementation commit `cb0e02c6`, was one reader over four separately generated briefs -- `draft-clean-context-review.brief.md` 323,650, `draft-review-model.brief.md` 280,360, `draft-frontier-consistency.brief.md` 319,159 and `draft-unit-skills.brief.md` 263,766, 1,186,935 bytes in all -- which realized none of the saving and incurred the whole of the loss. Both sets are in `tmp/review/`, which is gitignored, and are re-taken by re-running the generator at the commit named.

Against it: this node's recommended text cures a brief the reader cannot hold by narrowing the object, and a wave widens it; the split is what reconciles the two, and no instrument runs the split.

Raised on `commons.systems/disposition-graph/clean-context-review`, whose recommendation makes the wave, and recorded here because what a brief must fit and how many readings an answer gets are this node's. Whether the clause stands there or here is the author's to rule, and the two rows name each other.

#### the-surveys-unreached-node-is-one-line

Everything `one-answer-a-node-and-one-read` says, with the survey's own graph priced by this node and its reach rule cited rather than restated: what the survey reads of a node it is not judging is `commons.systems/disposition-graph/frontier-consistency`'s, stated in its validations and conditioned there on the node; this node prices what that costs and states the bound, and restates neither the reach rule nor the one-line class.

Measured on the survey brief of 2026-09-07: 1,202,450 bytes at implementation commit `87e4b24e`, before the cut, of which the eight judged nodes are 233,716 and the hundred and thirty-three context nodes 710,747; 994,467 bytes at implementation commit `cb0e02c6`, after it, which is the shape `packages/clean-context-review/brief.mjs` now writes.

Against it: at a hundred and forty-three nodes neither shape is held whole by one reader, so what the cut buys is a smaller brief and not a brief that fits; and the one-line class rests on an earlier survey having read those nodes, which the survey of 2026-09-05 did for every node the record then had and does for none minted since.

Raised on `commons.systems/disposition-graph/frontier-consistency`, whose validations state the inputs, and recorded here because what a reading is given is this node's. The author then rules the placement once rather than meeting the same rule on two nodes.

### authority

Ratified. What this decides is how much of the record the adversarial reader is shown, and the party it is shown against is the party that would otherwise set it: a rule that lets the drafter narrow the review's object is capture-shaped in the way the `class-recommendation` node's escalation test names, and being wrong here is not visible in the record, since a review that reads too little returns fewer findings and looks cheaper and no worse. Moderate boldness: the escalation is the test the `class-recommendation` node states, and what rests on the AI is the judgment that the author's delegation of right-sizing does not reach the reviewer's object, which the case against disputes.

## Recommendation

```markdown
---
question: What does a clean-context review cost, and how is that cost bounded?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
defines:
  - neighbourhood
---
## Answer

By the object each reading is given, and never by a budget or a clock. A reading's cost is set almost entirely by what its brief puts in front of it, so the bound is written into the brief and not into the reader.

**What a draft's reading is given.** Its object is one draft, so its brief carries that node in full and its neighbourhood in full: the ancestry to the root, the rules that bind every session, the nodes it names and the nodes its `depends` names, with the options named in them, the nodes under it, its siblings, and the readings that bear on it. A node a reading is not judging is carried by what it answers and never by its whole file, and it is one rule for every reading, a draft's neighbourhood and the survey's graph alike: its question, one answer, and the names of the options on its answer fact. One answer and never two. Where a ruling reaches the node the answer that stands is carried, since that is what binds; where no ruling reaches it the answer it now recommends is carried, since nothing else on the node is operative; and one line says which was carried, names the other, and gives the file it is in. Carrying both puts one node's argument in front of the reader twice, once as it is and once as it is about to be, and asks a reader whose object is a different node to work out which of the two it is judging against; that is the class's to say and not the reader's to infer. During bootstrap no ruling reaches any node, so a neighbour whose recommendation differs from what stands is carried by the recommended text alone. Its rationale, its facts prose, its option subsections and the rest of its recommendation are its own dialogue, and they stay in the file one read away, exactly as its account does and for the same reason. One exception, and it is the draft's own text and not the neighbour's: where an option on a neighbour's fact names the node under review as its source, that option's prose is carried in full, because it is what the draft put there and the validation that asks whether the draft contradicts the node above it turns on that prose. A reader given only the option's name has been told that the draft wrote something on its parent and not what it wrote. The generator does this as of the reconciliation of 2026-09-05: `renderNeighbourNode` takes the id of the node under review and carries whole any option whose `source` names it. Until that landing the clause was a rule stated and not a rule running, and the reading of 2026-09-05 paid the cost the exception exists to prevent, opening a neighbour's file from disk to check two options this node had sourced there. The node under review is the one node given whole, because it is the only one being judged; and whole is its question, the author's words, the text that stands, its rationale, its facts with every option's prose, and its recommendation, together with the last section of its `## Account` and nothing before it, the count of the sections left out standing in its place. An account is the dialogue's history and not its text, which is the ground on which a neighbour's account already stays in the file, and it grows with every reading applied while the draft it records does not, so a node read four times pays for four accounts to be judged once. The last section is kept because the previous reading's findings and the session's replies to them are there, and a reader judging what a draft became is judging an answer to those. It carries the rules of the reading itself in the same way, in the brief and not as a list of files to open: what the review is and what it judges, the validations, the two readings and what each is given, and the encoding's own vocabulary, facts, options, rulings, the derived class, and what a node is. A brief that tells its reader to go and read a node it could have carried has the reader read that node twice, once where the brief already quotes it and once from disk, and pays for both. Of every other node in the record it carries the id, the question, and the file the node is in, on one line, and nothing else. The file is not decoration: a question tells the reader that the record asks this somewhere, and the path is what turns the pointer into a read the reader can actually make without a search. The round's other drafts, which the clean-context-review node's recommendation gives this reader so that texts written together are read together, are carried the same way and marked as the round: id, question, and the recommendation each now makes, one line each, since what the reader needs of a sibling draft is that it moved and what it moved to, and the text that moved is one file away. The questions are there because the merge validation asks whether the record already asks this question, and a reader cannot search for a question it cannot phrase; the answers behind those questions are the survey's object, because the whole graph is what the survey reads and not what a draft's reader reads. What lies outside the neighbourhood the reader reaches by searching the graph, which the brief tells it how to do, so the cost of reaching the rest of the record is the cost of what is found and not of what exists. The rule under all of it: a part of the brief that grows with the record rather than with the draft is carried as a list of pointers, and a part that is the draft's own is carried whole.

**What a re-reading is given.** A draft amended in answer to a reading's findings is read again, and the second reading's object is the amendment: the node as it now stands, its difference from the text the last reading pinned, that reading's findings, and the session's reply to each. It answers two questions, whether the amendment answers the finding and whether it introduces anything the reading has not seen, and it is not a fresh reading of the node. A fresh reading is owed only where the answer itself was redrawn, which is what a kickback is. The difference is computable only if the first reading recorded the graph commit of the text it read, beside the pin it already records, and the dialogue node's answer enumerates the review's draft keys as four written together or not at all. This answer needs a fifth, and that is that node's decision and not this one's: it is recorded there as an option, and until it is ruled the re-reading falls back to a full reading of the amended node, which the tool reports when it does it. The commit is the text the reading read and not the text that answers it, so the order is fixed: the reading is applied first, on a clean tree, and the amendment is written after. A session that amends before it applies leaves the tree dirty, no commit is recorded, and the re-reading falls back to the full brief; that is not a loss of correctness but it is a loss of the saving, and it is the one sequencing rule this answer imposes on the session.

**How many readings a draft gets.** Two: the reading, and the re-reading of its amendment. A finding that survives the second is recorded as an option on the fact it bears on, or as a probe where it asks the author what they meant, and it goes to the author with the node. A reader asked for findings will return some, so a loop that runs until a reading is silent ends on the reader's mood; two rounds ends it on the draft. The cap bounds amendment and not redrawing: either reading may still kick the draft back, and a kickback is a new answer, which owes a reading of its own. What the cap forbids is a third reading of the same answer.

**What a brief must fit.** A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it. A brief the reader cannot hold is a defect of the brief, cured by narrowing the object and never by asking the reader to skim: a reading that dies of its own context returns nothing and is paid for twice. A brief that fits is then read in the fewest pieces the reader's tool allows, and in one call where the tool's limit reaches the whole of it. A reader that pages a brief it could have held re-sends everything it has already read with every further page, so the pieces multiply the brief by roughly half their number and buy nothing back; the bound on the size of a piece exists for the brief a reader cannot hold, which is the defect above, and it is not the rule for the ordinary case. The brief's own navigation line and the prompt that launches the reader state one discipline between them, or the reader has been given two rules and will follow whichever it read last.

**What the main thread spends.** That validation is never delegated is the clean-context-review node's rule and is not restated here. What this node adds is where the main thread spends when it validates: at the locus the finding names, and not by re-deriving the neighbourhood the reader was already given. A finding names a file and a line, and the cost of checking it is the cost of that file; a thread that re-reads the brief to check a finding pays the reading a second time and adds nothing, since the reader's context is exactly what it was asked to distrust. So a finding names the file, names the heading it sits under, and quotes the sentence or the clause it bears on exactly as that text stands in the file, never paraphrased, never summarized, and never by a line number: the file and the heading are the address, the quoted bytes are what turn the validation into a search that returns either the text or nothing, and a line number is stale the moment anything above it is edited. A finding whose locus the thread has to reconstruct makes the thread read the node to find what the reader already had in front of it.

**What attention is spent on.** Token efficiency and context management are bounds on what a reading is given; attention is what the reading does with it, and it is not the same quantity. A reader holds its object and cannot hold everything, so what a brief puts in front of it competes for the reading it can actually give, and a brief that fits is not thereby well aimed. The rule is that every part of a brief is there for a validation the reader is asked to run, and a part no validation reaches is struck rather than shortened: the questions are there for the merge validation, the neighbourhood for the contradiction validations, and the round for the merge validation too, since the index prints only the nodes outside the parts above and so leaves the round's questions unprinted; nothing is carried because it might prove useful. Consistency between two nodes of the frontier is the seventh validation and is the survey's, not this reader's, so it prices nothing in a draft's brief. What the round adds beyond a question, the recommendation each draft now makes, is reached by no validation on this reader's list, and whether that list should gain one is the `frontier-consistency` node's, where it is recorded as an option. This is what makes the answer more than a cut. Striking a part is cheaper and better aimed than compressing it, because a compressed part still asks for the reader's attention and no longer repays it. And a defect an instrument can name is the instrument's and never a reading's. A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has; spending it on an option marked passed with no reason recorded, on prose that says an option was passed over where the row carries no status, on a fact whose prose opens straight onto an option subsection with no reason above it, on a pin naming a commit the node has moved past, on a dated passage quoted in a rationale that stands under no `## Disposition`, or on an account section byte-identical to the one above it, spends that attention on what a script decides. Each such finding is paid three times over, in the fix, in the re-reading the amendment owes, and in the main thread's validation. The rule binds the instrument before it binds the reader: every defect of that kind the record has met is a check the validator is owed, and a reading that meets one while the validator still lacks it reports it like any other. What the rule forbids is a brief that asks a reader to run a check a script could have refused.

**What is not bounded, and is not waste.** The number of drafts on the frontier and the number of sittings. The review is priced per draft by design, and a backlog costs one reading a draft in it; that is the cost of having the drafts, not the cost of reading them. That the review is priced per draft at all is the `clean-context-review` node's decision and not this one's, and its measured price is recorded on the `decomposition` node: measured at implementation commit 8bb72b17, this sitting's twenty-three draft briefs total 7,926,691 bytes against the 838,923 of the batch brief of 2026-09-03 that the division replaced, and the survey's brief, at 1,083,638, exceeds the batch on its own. What this node bounds is one reading of one draft; the multiplication is the division's, it is on the node that made it, and the author's own words that some of the spend is the acceptable cost of draining a backlog cover the backlog and not the multiplier.

## Rationale

Recorded on the author's words of 2026-09-05, carried above: the review is burning tokens rapidly, part of that is the acceptable cost of draining a backlog, and the lessons of the sitting are to be taken as improvements for token usage, context management, and the management of the AI's attention.

The measurement decides it. Of the nineteen draft briefs this sitting generated, the index of every node's standing answer ran from 1,803 to 3,447 lines, a mean of 2,775, and between 22 and 69 percent of the brief. It was near enough the same text in every one: an index differs from the next only by the nodes its own brief renders elsewhere and by the questions the record had gained, and the record went from 63 questions at graph commit 5e8e0a3d on 2026-09-04 to 142 nodes at 1cde11f6 on 2026-09-05, so the constant grew over the sitting as well as repeating within it. Set against the object each brief was written for, the node under review, which ran from 94 lines to 1,946 and averaged 554, the index was a median of eight times the object and in one brief thirty-one times it. The reading of `progressive-disclosure`, 108 lines of node with two options and one tradition, was handed 3,284 lines of index in a brief of 5,740 lines and cost 206,279 tokens: the most expensive reading of the batch, on nearly the smallest object in it. `decomposition`, at 175 lines, cost 162,526; `rejected`, at 406, cost 89,264. Cost does not track the object, because a constant many times its size dominates it.

Those figures are not recomputable, and an earlier draft of this node said they were. The briefs are the files `tmp/review/*.brief.md`, and `tmp/` is gitignored, so no brief is on the implementation ref and none is on any ref; the files on disk are overwritten each time a brief is regenerated, and by 2026-09-05 twenty-one of the twenty-three had been regenerated in the post-reconciliation form, so neither end of the before-and-after pair above survives. What can still be checked, at implementation commit 8bb72b17, is that `draft-decomposition.brief.md` is 1,266 lines and `draft-progressive-disclosure.brief.md` 1,434, and that the two briefs still carrying the old index section are consistent with the band; the range's endpoints, the mean of 2,775, the median of eight times the object, and the decomposition pair are gone and cannot be re-taken by anyone, including this node. They are left standing as what was measured on 2026-09-05 and marked here as unrecountable, which is the honest form; and the reading of 2026-09-05 records that the previous reading's finding, that 3,447 was written where 3,478 had been measured, was answered by changing the number and not by re-measuring it. Every figure this node states from here on is given with the graph commit and the implementation commit it was taken at. That a brief resting a draft's argument on a measurement should carry the command that reproduces it is the option `brief-carries-the-recount-command`, which this node answered in prose once and should not have.

Why that constant is there is an incumbent fact and not a reason. Until 2026-09-04 the review was one reading of the whole frontier, and the index was that reading's object; when the clean-context-review node divided the review by its object, the index stayed in the per-draft brief where it no longer had one. Read as if the brief were being written from scratch, the question is what the reader of one draft must see, and the answer is the draft, what the draft stands on and what stands on it, and the questions the record already asks.

The findings this sitting returned are the evidence for the neighbourhood: every one had its locus in the node, its ancestry, its `depends`, the options it names, its siblings, the readings that bear on it, or the implementation. The one reach beyond that which mattered, the finding that three standing answers place a rejected alternative in the rationale, was made by searching the graph for the phrase and not by reading the index; so was the finding that a tradition the record called already read had no reading. Search is what reaches the rest of the record, and search costs what it finds.

The re-reading follows from the same sitting. Thirteen readings landed on 2026-09-05, and all thirteen had findings accepted: every one of the thirteen nodes now reads as changed since its review, owing a second reading of a text that differs from the first in the places the findings named. The cap follows from the same fact from the other side: the loop as run has never terminated of its own accord.

The round's other drafts are the case that shows the rule is not about the index. The clean-context-review node's recommendation gives a draft's reader every node whose recommendation has moved since the survey last pinned it, so that the contradictions a sitting creates between texts written together are caught before the survey; it is right about the need, and at graph commit 1cde11f6 on 2026-09-05, before the first survey ran, that set was forty-eight nodes, every node standing at the review or the ruling stage, because no node yet carried a survey pin; that day's survey pinned forty-five, and at graph commit e4c87ed0 the set was twenty-five of the fifty at those stages. A brief prints fewer than forty-eight, since the nodes already carried in its own neighbourhood are not printed twice. Thirteen is a different number that an earlier draft of this node put here: it is the count of readings this sitting landed on 2026-09-05, and the round is not that set. Handed whole, it would put back most of what striking the index takes out, and it would grow with the sitting rather than with the draft. Handed as one line a node saying which moved and what each now recommends, it does the work it was asked for, because what a reader needs of a sibling draft is that it moved and what it moved to; the text is one file away, and a reader that has been told a neighbour moved will open it. That is recorded as an option on the clean-context-review node, since the neighbourhood is its answer's to state.

The reconciliation of this answer measured itself, which is the fifth measurement and the one that set the clause about neighbours. Measure in bytes and not in lines: this record writes a paragraph as one unwrapped line, so a line count flatters whichever text has the shorter paragraphs, and on the three briefs measured both ways it overstated the saving by ten points. Striking the index took the `decomposition` brief from 4,934 lines to 3,181 and the index within it from 3,447 lines to 97. The two ends were measured at different graph commits, the record having gained this node and its landings in between, so the pair is a change of design and a change of record together and the index figure is the one to trust, since it is the same section counted the same way at both ends. What the index left behind was not the draft: of the 3,181 lines, the node under review is 208, the instructions and the output schema about 111, the two lists of pointers 136, and sixteen neighbour nodes rendered whole are 2,709. The constant did not go away; it moved. And the neighbours are rendered whole in a record whose nodes carry their whole dialogue, so one ancestor contributed a 383-line rationale to a brief written to judge a 175-line draft. The brief already drops a neighbour's account, on the ground that an account is the dialogue's history and not its text; a neighbour's rationale, its facts prose, its passed-over options and its recommendation fence are the same node's dialogue by the same test, and the reader judges a draft against what its neighbours answer. So they go the way the accounts went.

What the whole of it came to, measured on three briefs generated before the reconciliation and again after it: `madr-decision-records` from 836 to 249 kilobytes, `authority` from 882 to 284, and `alignment-page` from 1,207 to 489, a cut of seventy, sixty-eight and sixty percent. The last is the smallest cut and is the one to read: `alignment-page` is a 1,946-line node, so the brief that judges it is mostly its object, which is the shape every brief should have and the shape none of them had.

That shape is not yet reached, and the rule as stated does not reach it. Measured on this node's own second brief, at graph commit 02287a28 and implementation commit 8bb72b17, and taken after the neighbour clause landed: 288,763 bytes, of which the node under review is 18,332 and its answer and rationale a further 52,798, so the object is a quarter of the brief; the ancestry and the rules that bind everywhere are 65,467, the rules of the reading 65,706, the siblings 21,864, the nodes it names 15,291, the index 18,836 and the round 5,385. The rules of the reading alone, three times the index they displaced, are constant across briefs. The rule this answer states sorts a part that grows with the record from a part that is the draft's own and has no case for a part that grows with neither, which is what a constant is; the argument that actually carries the rules of the reading is the double read, and that is a different test. So the rule has a third case: a part constant across every brief is carried whole only where carrying it costs less than the reads it saves, and the measurement above is what that case is judged on.

The double read is the fourth measurement, and the cheapest to remove: the brief as it stood told its reader to read twelve node files in full before writing a finding, five of which the brief already carried whole in its ancestry section, since the five global-tier rules belong to every neighbourhood; the reader paid for those five twice and reached outside its neighbourhood by instruction for the other seven. Those twelve are the rules of the reading, they are the same twelve for every draft, and a brief that carries them carries them once.

One clause of this answer adopts a convention the record has already recorded itself diverging from, and the divergence is named here rather than left for a reader to find. `commons.systems/disposition-graph/self-contained-specification` holds that a term is glossed once on the node that defines it and cited by id everywhere else, on the ground that the reader this record has follows an id that resolves, so the restatement the convention asks for buys nothing and drifts. The clause that carries the rules of the reading in the brief does the opposite, and the counter recorded on that very node is the warrant: it names, among the readers the convention still fits, a subagent given one node and its ancestry, which is this reader exactly. The scope of the adoption is that reader and no other, and the record is not thereby loosened for nodes, which are read through a projector by an agent that can follow a link.

The reader's own context is the third measurement. One reader died with its whole spend returned as nothing, its context refilling to the limit three times in three turns while it read a 6,944-line brief in large pieces; relaunched with a bound on each read, it finished, and that reading was paid for twice. A brief that a reader cannot hold is not a reader's problem.

The sixth measurement is the sitting of 2026-09-07, and it is what this answer's later clauses are drawn on. Taken at graph commit d0942d57 and implementation commit 87e4b24e, on the seven draft briefs that sitting's readings were handed, the files `tmp/review/draft-*.brief.md` written between 09:53 and 10:11 and measured before the instrument was amended at 10:36: 2,585,266 bytes over seven briefs. Of that, the `## Account` of the node under review is 465,864 bytes, eighteen percent, and on one brief, `alignment-page`, 196,599 of 623,345. Ninety-four neighbour renderings across the seven carry two texts of the same node, a standing answer and a recommended one, 262,496 bytes of the first and 592,021 of the second; one text a node strikes the 262,496. The two parts that carry the governing nodes, the ancestry and the rules of the reading, run between 129,627 and 162,913 bytes a brief and between twenty-three and sixty-three percent of it, in a form that already carries each of those nodes by what it answers. The two clauses together take 728,360 bytes off the seven, twenty-eight percent, before anything else is struck. The pieces are measured the same way: `draft-growth.brief.md` is 2,081 lines and `draft-alignment-page.brief.md` 4,692, so under a bound of three hundred lines they are read in seven pieces and sixteen, while the navigation line of each says to read the brief whole -- the two rules the clause above forbids, in one brief, on the same day. What multiplies with the pieces is not measured here and is arithmetic rather than telemetry: each further page re-sends what the reader has already read.

This answer's later clauses describe an instrument that already runs, which is the same order the `pointers-for-what-grows-with-the-record` option had on the node above. Under the author's words of 2026-09-07 to begin applying the optimizations while progressing them, the working tree at 87e4b24e carries the account clause, the verbatim locus, and the survey's carrying rule; the one-answer-a-node clause, the reading in the fewest pieces, and the rule about mechanical defects are not yet materialized, and this text states them as rules rather than as descriptions.

Traditions, each owed as a reading under this node: the working set and thrashing (Denning, 1968), where a process given fewer frames than its working set spends its time faulting rather than working and the remedy is to allocate by the measured working set rather than uniformly, which is what the dead reader did and what the bound on the brief answers; separate compilation against interfaces, the unit compiled with its dependencies' interfaces and not their bodies, which is the neighbourhood; the diff as the unit of review, the ordinary practice of code review, which the re-reading adopts, and which is a second reading of a tradition the record already holds at `commons.systems/disposition-graph/change-reviewed-as-a-diff`, where the relation belongs and where that node's own answer states the objection this re-reading is the answer to, that a reviewer shown the whole reads the whole unless the projection that derives the edit is in front of it; the inspection rate and the yield of a large change (Fagan, 1976, for the rate; Rigby and Bird, 2013, for the fall in yield as the change grows, Bacchelli and Bird's 2013 study of modern code review being qualitative and not the source of that measure), so the remedy bounds the change and never hurries the reviewer, and this is a second reading of a tradition the record already holds at `commons.systems/disposition-graph/fagan-inspection-roles`, which is where it belongs and where the relation this node adds should be recorded; and satisficing (Simon, 1956), the search that stops at good enough, for the cap on rounds.

What this costs, as a consequence of the design and not a reason for it. A draft's reader no longer holds the record's standing answers, so a contradiction with a distant node is found only if the reader thinks to search for it; what it misses falls to the survey, which holds the whole graph and is the reader of last resort, and this answer therefore leans harder on the survey being run before the author rules. The two-round cap means a finding first raised in the second reading is recorded as an option rather than answered in the text, so the author meets it as a row on a fact rather than as a redrawn draft. And the questions-only index means the reader can see that a question exists without seeing how it was answered, which is enough to propose a merge and not enough to argue one. The four clauses added on 2026-09-07 cost four more things. A neighbour carried by one answer hides from the reader that the node moved and how far, so a draft written against a parent's standing text and contradicting the text that parent now recommends is caught only because the line beside the answer says the other exists; the reader must open the file to see it, and readers open fewer files than they are told to. An account cut to its last section hides the reasons a defect was already answered once, so a reading may raise again what an earlier reading raised and an earlier amendment settled, and the session pays a validation to find that out. A brief read in one call is held by a reader that can hold it, and where the brief has grown past that the failure is a dead reading rather than a slow one, which is the more expensive failure and is why the bound on a piece stays for that case. And a rule that sends a class of defect to the validator means that until the validator holds the check nothing catches it but a reader who is no longer looking for it, so the checks are owed and the debt is this node's to carry until they land.
```

## Account

Queued as a node of its own on 2026-09-05, at the checkpoint, before anything was drafted from the author's words. The disposition is the author's and the grant is theirs; what the node answers is not yet drafted.

What the sitting would amend: the clean-context-review node, whose answer says what a reading reads and when it runs and says nothing about what that costs or what bounds it; the review-model node, where the author's second sentence bears and where an option is recorded for it at this landing; the frontier-consistency node, which owns the survey's object; the decomposition node, whose cost paragraph states the per-draft brief's index as the cost driver and names the index as the lever against it; and the review-skills node, whose two skills and one package materialize whatever this answers.

The periagogic object: the briefs this sitting generated and their sizes, the readings' own token counts as the harness reported them, the three readers that died, and the findings the readings actually returned, read against what each reading had to read to return them.

### Drafted, 2026-09-05

The periagogic object was read on the main thread, which measured it rather than surveying it: the nineteen draft briefs of 2026-09-04 and 2026-09-05 as they still stand under `tmp/review/`, the index share of each, the harness's token count for each reading, the four readers that died, and the findings each reading returned, each finding traced to the locus it was found at. The measurements are in the recommendation's rationale, which is where they belong, since they are the argument and not the account.

The four deaths: one reader on `author-questions` died of its own context, autocompacting three times in three turns on a 6,944-line brief, and finished on a relaunch bounded to 300-line reads, so that reading was paid for twice; three readers, on `alignment-page`, `recording`, and `clean-context-review`, died within a minute of each other on the model's session limit, returning nothing. The author's second sentence of 2026-09-05 answers the second kind, and is recorded as an option on the `review-model` node rather than here, since the model a reading runs on is that node's question.

Owed as readings under this node, none yet read: Denning on the working set and thrashing; separate compilation against interfaces; the diff as the unit of review; Fagan's inspection rate, with Rigby and Bird for the fall in yield as the change grows, which is a relation to record on the reading the record already holds at `fagan-inspection-roles` rather than a new reading; and Simon on satisficing. The record's own `self-contained-specification` node is named in the rationale as a divergence adopted within a stated scope, and is a cross-reference and not a reading. They are named in the rationale and derive onto the frontier from there.

Owed to the author as a caution, not as a finding: this node is the reviewed party writing the reviewer's brief, and it narrows what the reviewer sees on measurements the reviewed party took. That is the case recorded against the answer fact, and it is why the authority fact recommends ratified.

### Read adversarially on the main thread, 2026-09-05

The measurements in the rationale were recomputed against every one of the nineteen briefs before the draft went to its reading, and the first draft's figures were wrong in the direction that flattered the argument: it counted sixteen briefs, gave the index a range of 1,834 to 3,478 and a mean of 2,877, and compared two nodes by ratios it had not measured. The corrected figures are narrower and the case is stronger for being set against the object rather than the brief, since the index is a median of eight times the node it was written for.

Two findings of that reading changed the answer. The brief as it stood told its reader to read twelve node files in full before writing a finding, five of them already carried whole in the brief's own ancestry section: the answer now carries the rules of the reading in the brief rather than naming them as files to open. And the cap on rounds, read back, forbade a second kickback by implication, which is not what it means: the cap bounds amendment, a kickback is a new answer, and the answer now says so.

### Reconciled and re-measured, 2026-09-05

The reconciliation ran under the author's grant, in three units, and the graph and the implementation were kept apart: the tooling is `packages/clean-context-review/brief.mjs` with its templates and `packages/disposition/read.mjs` with `apply.mjs`, and the two skills are `.claude/skills/align-review/` and `.claude/skills/align/`.

Measured on the `decomposition` brief, the same brief the first measurement used and counted the same way at both ends: 4,934 lines before, 3,181 after the index became one line a node, with the index itself down from 3,447 lines to 97. The two ends are at different graph commits, this node's own landings falling between them, so the whole-brief pair moves with the record as well as with the design and the index figure is the one that isolates the change. The re-measurement is what added the clause on neighbours, since it showed the constant had moved and not gone: sixteen neighbour nodes rendered whole are 2,709 of the 3,181, against 208 lines for the node being judged.

Two facts of the implementation worth the record. The `readings` part of the neighbourhood is unreachable as the parts are ordered, because a node whose `bears` names the draft is already named in the draft's own rendered text and the `cited` part claims it first; the part is right and the order is wrong, and it is fixed by taking the readings before the nodes the draft names. And the round's other drafts needed no invention: the encoding already provides a survey pin on a node, so the set the `clean-context-review` node's recommendation asks for is exactly the nodes the survey would judge. On 2026-09-05 that is every node at the review or the ruling stage, forty-five of them, because no survey has run and so no node carries a pin; the thirty-four this account first recorded was the count one brief printed, which is the set less the nodes that brief already carried in its neighbourhood, and not the set.

### The reconciliation landed, 2026-09-05

Four units under the author's grant, none of which wrote a node: the brief's neighbourhood and its index, the graph commit recorded in the review block so a re-reading has a text to diff against, the two skills, and the re-reading itself with the neighbour rendering. Four hundred and sixty-seven tests pass and the graph validates at 137 nodes.

The re-reading does not act on the thirteen nodes this sitting read, and the reason is worth recording rather than working around: the commit a re-reading diffs against is written by the applying step, and no reading applied before today wrote one, so those thirteen fall back to a full reading, which the tool says on its own output when it does it. Their second reading is therefore the cheap full brief and not the delta, and the delta begins with the reading after that. Under the cap those thirteen second readings close the round, and what survives them is recorded on the facts as options and goes to the author.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Rationale, the measurement, two figures that cannot both describe the nineteen briefs. The rationale says the index "ran from 1,803 to 3,447 lines, a mean of 2,775, between 22 and 69 percent of the brief", and four paragraphs later that "Striking the index took the `decomposition` brief from 4,934 lines to 3,181 and the index within it from 3,478 lines to 97." 3,478 exceeds the stated maximum of 3,447, and 3,478/4,934 is 70.5 percent, outside the stated 22-to-69 band; decomposition is one of the nineteen, so on the rationale's own text the pair is impossible. Verified what I could: of the fifteen briefs still on disk in their pre-reconciliation form, the index runs 1,803 (recording, 6210-8013) to 3,291 (clean-context-review, 2377-5668), mean 2,782, and the minimum 22 percent is exact (1,803/8,013). The likeliest cause is that 4,934 was measured on decomposition's original brief and 3,478 on a regeneration taken later the same day, after the record had grown; the account's "the same brief the first measurement used" then is not exact. Suggested edit: re-measure the before/after pair at one graph commit and state the commit, or say in the rationale that the reconciliation's before-figure was regenerated after the nineteen and so exceeds their range.
- Rationale, the round's size, wrong by a factor of three and contradicted by this node's own account. The rationale says "on 2026-09-05 that set stood at thirteen nodes" and "Handed as thirteen lines saying which nodes moved and what each now recommends"; the account of the same node says "the set the `clean-context-review` node's recommendation asks for is exactly the nodes the survey would judge, and on 2026-09-05 it stood at thirty-four." Measured today: 45 nodes carry `stage: review` or `stage: ruling` and none carries a survey pin (`grep -rl "^stage: review$\|^stage: ruling$"` gives 45; `grep -rl "  survey:"` gives 0), so the set excluding this node is 44, of which this brief prints 32 in the round and renders the other 12 in the ancestry, rules and siblings sections. Thirteen is the count of readings that landed on 2026-09-05, which is a different set. The error runs against the answer's own case, since a set of 44 makes the pointer treatment more necessary and not less. Suggested edit: "that set stood at forty-four nodes, of which a brief prints as the round the ones it does not already render".
- Answer, "What a draft's reading is given", the index line understates what is materialized. The draft says "Of every other node in the record it carries the id and the question, on one line, and nothing else." The brief generated under this answer carries three fields on that line, id, question and file (`- commons.systems/disposition-graph/alignment-order | What orders the unanswered frontier for alignment? | disposition/disposition-graph/alignment-order.md`), and the file is what makes the line usable: I opened `self-contained-specification.md` and `decomposition.md` straight from their lines without a search. Suggested edit: "it carries the id, the question and the file, on one line, and nothing else, the file so that a reader that wants the answer opens it without first searching for where it lives".
- Answer, "What a re-reading is given", presumes a field of the dialogue state that no node provides for. The draft says the second reading's object is "the node as it now stands, its difference from the text the last reading pinned", and the account says the reconciliation landed "the graph commit recorded in the review block so a re-reading has a text to diff against"; `packages/clean-context-review/apply.mjs` writes it (`if (commit !== null) lines.push(\`  commit: ${hashScalar(commit)}\`)`, line 347). But `commit` appears in no node's answer: the `dialogue` node's recommended text, carried whole in this brief, enumerates the review block as "`verdict`, `strength`, `date`, `of`, ... and `against`" and says "The four are written together or not at all", and its validator paragraph says "the review's four draft keys together or not at all, with the survey standing alone". A projector regenerating the review block to that spec would drop the key and silently break every delta re-reading. Suggested: record an option on `commons.systems/disposition-graph/dialogue`, source `commons.systems/disposition-graph/review-cost`, named `commit-in-the-review-block`, with prose to the effect that the review's draft keys take a fifth, `commit`, the graph commit the reading read, written where the tree is clean and absent where it is dirty, so that the re-reading this node's answer defines has a text to diff against; and name it in this answer's re-reading paragraph.
- Answer, "A neighbour is carried by what it answers and not by its whole file", strips exactly what validation 2 asks this reader to check, and it cost me the check on this reading. Validation 2 requires that what would contradict doctrine "is recorded as an option on the node it conflicts with, ... and the review says which". This draft's index clause contradicts the recommended text of its own parent, which gives the reader "the index of every question the record asks, with its class, its stage, its standing answer, and the options on its answer fact". To confirm the contradiction was properly recorded I had to open `disposition/disposition-graph/clean-context-review.md`, because the brief gives a neighbour's options as bare names ("`pointers-for-what-grows-with-the-record` - source commons.systems/disposition-graph/review-cost") and the prose that says what the option would answer is what validation 2 turns on. This is first-hand evidence against the clause as written, and the fix is narrow. Suggested edit, to the neighbour sentence: "...the answer it now recommends where those differ, the names of the options on its answer fact, and in full the prose of any option whose source is the node under review, since that prose is what validation 2 checks."
- Cross-node finding on `commons.systems/disposition-graph/clean-context-review`: the option this draft planted there describes an earlier version of this draft and now contradicts it. `#### pointers-for-what-grows-with-the-record` ends "The neighbourhood grows to match, taking in the nodes under the draft, the readings that bear on it, and the nodes that state the rules of the reading itself, which the brief now names as files for the reader to open." This draft's answer says the opposite: "It carries the rules of the reading itself in the same way, in the brief and not as a list of files to open", and the account records that as one of the two findings of the main thread's adversarial reading that changed the answer. Suggested edit to that option's last clause: "...and the nodes that state the rules of the reading itself, which the brief carries in the same way as the neighbourhood rather than naming as files to open".
- Readings, a tradition the record already holds and the draft does not name, bearing on its central clause. The draft's clause "A brief that tells its reader to go and read a node it could have carried has the reader read that node twice" adopts the convention that `commons.systems/disposition-graph/self-contained-specification` records, and that node's answer records the record's divergence from it ("A term is glossed once, on the node that defines it, and every other node cites it by id; a passage that restates what a field or another node already holds is liquidated") together with the counter that names this very reader: "A node file is read alone more often than the answer admits: in a diff, in a review of one file, by a subagent given one node and its ancestry ... Each of those is the convention's reader." The draft lists five traditions owed and not this one, though it is the only one already in the record and the only one the record has taken a position against. Two things follow. It should be named among the readings owed, with the relation `adopted` on this node's answer fact, and the rationale should say why the adoption is not the duplication `prose-and-structure` liquidates: the brief is a projection generated from the node files, so there is one source and the copy cannot drift, which is exactly the reply that node's answer already gives ("a projection and not a copy").
- Viability, a missing option, and it is the one that answers the case against. Between `full-index-per-draft` ("the standing answer, the facts and the rationale of every node", passed over) and the recommended questions-only line there is a point on the frontier nobody has listed: the standing answer of every node and nothing else, no facts line, no options, no option prose. Verified on the old briefs: the index carried per node a File line, a Question line, a Status line, a Facts line, the answer, and the prose of every option (`tmp/review/draft-recording.brief.md`, lines 6212-6239), and the option prose is the bulk of it. An answers-only index would be on the order of a quarter of the 2,775 lines and would preserve precisely what the recommendation's own `against` says is lost: "a contradiction with a node nobody thought to name, is the one failure a search cannot be aimed at." Prose for the option, name `answers-only-index`: "The brief carries, of every node outside the neighbourhood, its id, its question, its file and the answer that stands on it, and nothing of its facts, its options or their prose. What it would answer: the reader can see a contradiction with a distant node without being told where to look, which is what the recommendation's own case against says is given up, at roughly a quarter of the index the nineteen briefs carried, since the option prose and not the answer is the bulk of that index." I do not say it dominates the recommendation, and the recommendation has an answer to it in validation 2's own scope, which is the ancestry and the nodes the draft cites and not the whole record; but it is not dominated either, and it is the shape of index the author will otherwise never be shown.
- Facts, the answer fact, `neighbours-answered-not-whole` cannot be ruled on as written. Its prose says "It is not recommended separately because the recommended option contains it; it is listed because it is the clause that a reader who thinks the review should see everything would strike first." If the recommended option contains it, a ruling for it is a ruling for the same text, and the author cannot tell what confirming it would change. The dialogue node's recommended text provides for exactly this shape: an option "may be a whole answer, or a named change to another option, a clause taken alone or taken differently, and where it is a change its prose says which option it changes and what it changes". Suggested edit: restate it as the change the author would actually make, that is, as the strike, and say what it leaves standing: "`neighbours-carried-whole`: the recommended answer with its neighbour clause removed, each neighbour rendered as its whole node file. What it would answer: the reader judges a draft against its neighbours' reasoning and not only against what they answer. It costs the 2,709 lines of the sixteen neighbours measured on the `decomposition` brief against the 208 lines of the node being judged."
- Question and words, the author's third term is never answered in the draft's own voice. The author asked for lessons "esp. for the optimization of token usage, context management and AI attention". The answer speaks to token usage (the object of each reading) and to context management ("A brief is written to be held whole by the reader it is given to"), and the rationale quotes all three back ("token usage, context management, and the management of the AI's attention"), but no clause of the answer says what the design does for attention, and the record has a node named `attention` that means something else by it ("How is attention allocated?", rank across the graph). Suggested edit, one sentence in "What the main thread spends" or beside the two-round cap: what the design does for attention is put a reading's whole object in front of it and nothing else, so that what the reader attends to is the draft, and end the loop at two rounds so that the main thread's attention returns to the node while it is still open.
- Answer, "What the main thread spends", restates a rule another node owns. "validation is never delegated, since a finding accepted unchecked hands the review's authority to whichever reader spoke last" is the parent's rule and the author's ruling of 2026-09-03: `clean-context-review` says "The session that invoked the skill validates every finding against the record before any is applied, on its own thread and never delegated, as the author ruled on 2026-09-03". The sibling `review-model` shows the practice this record wants here ("The rule is stated here and nowhere else"), and the same complaint was accepted on `decomposition` on 2026-09-05. What this node adds and should keep is only the new half: that the validation is done at the locus the finding names and that the main thread does not re-derive the neighbourhood the reader was given. Suggested edit: keep those two clauses and cite the parent for the rest.
- Cross-node finding on `commons.systems/disposition-graph/review-model` and `commons.systems/disposition-graph/decomposition`: both carry standing text this draft falsifies, and the account lists both as nodes the sitting would amend without the amendment having landed. `review-model.md` line 209: "What would lower the price of a reading is the brief it is handed, whose index carries every standing answer whole, and never the reader." `decomposition.md` line 61, the answer fact's `against`: "A per-draft brief carries the index of every standing answer ... and the index is the lever against the cost", with the same claim in the rationale (line 128, "the tokens a sitting spends multiply with the index each per-draft brief carries"), in the account's evidence (line 226, "The index carries each standing answer whole, as the clean-context-review fence says, and is the larger part of the draft's brief; whether the index needs the whole answer or its first sentence is the next lever on that cost and is not decided here"), and in the counter-argument at line 75. This node decides what that sentence says is not decided, so the two nodes should be amended to cite it: on `review-model`, that the lever named there has been pulled here; on `decomposition`, that the index is no longer the larger part of a draft's brief and what its `against` now costs.
- Rationale, a measurement-based argument that the brief does not let its reader reproduce, which is first-hand evidence about this answer. Every load-bearing claim of this rationale is a number, and none of them is checkable from anything the brief gave me: I checked them by going outside it, to `tmp/review/`, `packages/`, the validator and the test runner, in six shell commands. That is not a defect of the neighbourhood rule (the measurements are the draft's own object, and no brief should carry them), but it is a cost the answer does not price, since the reading it commissions is asked to verify "every claim about the record or the implementation" and is handed no way to. Suggested clause, in "What a draft's reading is given": where a draft's rationale rests on a measurement, the brief carries the command that reproduces it, so that the reader checks the number instead of re-inventing the measurement. Two of the three numeric findings above were found this way, and the third by reading the rationale against itself.
- Low, two citation points to settle when the readings are written. "the inspection rate and the yield of a large change (Fagan, 1976; Bacchelli and Bird, 2013), where a reviewer's finding rate falls as the change grows": Fagan 1976 supports the inspection rate directly, but Bacchelli and Bird 2013 is an interview and observation study of modern code review, and the quantitative claim that yield falls with change size is usually carried by Rigby and Bird 2013 or by the industrial inspection data; state the support scope precisely or cite the source that carries the claim. And the record already holds a Fagan reading, `commons.systems/disposition-graph/fagan-inspection-roles`, on a different question (the division of a review into named roles), so the reading owed here should say it is a second reading of the same tradition for a different question, as `self-contained-specification` does for `srs-introduction` on IEEE 830.
- Low, Rationale, "it was the same text in every one" is inexact, and the exact form is stronger. The index of each brief excludes the nodes that brief renders elsewhere, so no two are identical (in this brief the index holds 85 entries, the round 32, and the neighbourhood 20, for the record's 137), and the record grew through the sitting: the `decomposition` account records "the index of sixty-three questions with their standing answers" on 2026-09-04. Suggested edit: "it was the same text in every one but for the nodes each brief rendered elsewhere, and it grew with the record rather than with the draft, from sixty-three questions on 2026-09-04 to a hundred and thirty-seven nodes on 2026-09-05" - which is the claim the answer's own rule about what grows with the record actually needs.

On the facts and what they recommend: Two facts, answer and authority, which is what a node with nothing standing and no prune or shape change in prospect should carry; nothing stands, so the `## Recommendation` fence is required and is present, and `stands` is rightly absent. The answer fact recommends `neighbourhood-questions-and-delta` at moderate boldness, which is right: the criterion is the author's and stated twice, the grant is theirs, and what rests on the AI is the design and the measurement, which is what moderate names. The authority fact recommends `ratified` at moderate, and that is the class the escalation rule in the `authority` node asks for, since being wrong here is capture-shaped and invisible in the record; the `against` recorded beside it, that the author's delegation of right-sizing may already reach this, is the real counter and is fairly stated. No review pin exists yet, so there is no stale pin to catch.

On the viability of the options: On the answer fact, every listed option is a real point on the frontier and each passed-over one carries a reason that holds: `full-index-per-draft` and `no-index-at-all` are the two ends and are correctly passed for the reasons given, `full-re-read-on-every-move` is dominated by the delta once the pin is in the record, `unbounded-rounds` is dominated by the sitting's own evidence that no round has ever terminated of its own accord, and `budget-per-sitting` is dominated because it bounds the wrong thing. Two defects. `neighbours-answered-not-whole` is listed as live but is unreadable as a ruling, since its prose says the recommended option contains it; it should be restated as the strike it actually is (finding above). And one viable option is missing, an answers-only index carrying each node's standing answer and none of its facts, options or option prose, which sits between `full-index-per-draft` and the recommended line at roughly a quarter of the measured index and preserves the one thing the recommendation's own case against says is lost; its prose is in the findings. The authority fact's three options are the record's own vocabulary and are complete by construction.

Strongest counter-argument (moderate): The reviewed party wrote the reviewer's brief, and every clause of this answer narrows what the reviewer is shown on measurements the same party took, three of which I found wrong in the direction that flatters the design. The answer's reply to that is the survey, which it names as the reader of last resort and leans on harder than any previous answer did: what a draft's reader can no longer see falls to the reading that holds the whole graph. But the survey has never run. Forty-five nodes stand at the review or ruling stage today and not one of them carries a survey pin, so the instrument the whole design transfers its load to is, as of this reading, entirely unexercised, and the answer's cost paragraph says only that it "leans harder on the survey being run before the author rules" without saying that the survey has yet to run once. The bite is sharpest on the fifteenth validation, which is the one the index existed for: the answer concedes that questions-only leaves the reader "enough to propose a merge and not enough to argue one", and does not say who then argues it. Against all that, the record's own validation 2 scopes a draft reader's doctrine check to the ancestry and the nodes the draft cites, both of which the neighbourhood carries whole, and the authority fact already escalates to ratified precisely because of the capture shape; so the case is real but not decisive.

The session's reply: Every one of the fifteen findings was validated at its locus on the main thread and every one was accepted; the reading is the reason this node changed in fifteen places, and three of the changes are corrections of measurements this node had stated wrongly in its own favour. The counter-argument is accepted in full and is why the amendment does not close the round. Its three limbs, each answered by a change and not by an argument: that the reviewed party wrote the reviewer's brief stands, and is recorded as the case against the answer fact and as the reason the authority fact recommends ratified; that three measurements were wrong in the direction that flattered the design is true, and the index figure, the round's size and the sameness of the index are corrected, with the method that reproduces them now named in the rationale so the next reader need not take this node's word; that the design transfers its load onto a survey that has never run is the strongest of the three, and the case against now carries the number the reading supplied, forty-five nodes at the review or the ruling stage and no survey pin anywhere in the record, so the author rules on this answer knowing that its reader of last resort is unexercised. The finding that this sitting's own reader had to open the parent from disk to run the second validation is taken as a bound rather than as a strike: a neighbour option whose source is the draft under review is now carried in full, because that prose is the draft's own. Two findings were not answered inside this node, because they are not this node's to answer, and each is recorded where it belongs and acts on nothing: the fifth review key the re-reading needs, as an option on `dialogue`, whose recommended text says the four keys are written together or not at all; and the relation this node adds to Fagan, on the reading the record already holds at `fagan-inspection-roles`. The reading's proposed middle option, an index of standing answers only, is recorded as `answers-only-index` rather than adopted, because the standing answers are the survey's object; the reading is right that it is the real middle of the frontier and the author should see it there. Two neighbours the reading found carrying text this node had falsified, `decomposition` and `review-model`, are amended to cite it, and the stale option prose this node had planted on `clean-context-review` is corrected. The amendment is substance, so the node returns to the review stage rather than to the author, and its re-reading is the second and last round this node's own cap allows.

### The applying of that reading, 2026-09-05

Applied with the fifteen findings validated at their loci and the counter-argument answered in the session's reply, all recorded above. The stage was overridden back to `review`: the verdict was forward, which would have sent the node to the author, and the amendment is substance, so the node owes the second reading its own answer allows it and no more.

No `commit` was recorded in the review block, because this session amended the node before it applied the reading and the tree was therefore dirty. That is this node's own answer failing on its first use, and the failure is in the session's order and not in the design: the commit is meant to record the text the reading read, which is only available on a clean tree before the amendment is written. The answer now states the order. This node's own re-reading consequently falls back to the full brief, which is the same fallback the thirteen readings of this sitting take, and the delta begins with the reading after that.

The findings not answered in this node, each recorded where it belongs and acting on nothing: the fifth review key, as the option `commit-in-the-review-block` on `dialogue`; the relation to Fagan, owed on the reading the record already holds at `fagan-inspection-roles`. Two neighbours carrying text this node's reconciliation had falsified, `decomposition` and `review-model`, were amended to cite this node, which moves both pins; both already stood at the review stage with a reading owed. The option this node had planted on `clean-context-review` described an earlier draft and was corrected there, without moving that node's recommendation or its pin.

### A defect in the cap's own instrument, 2026-09-05

Found on the main thread while applying the clean-context reading of `clean-context-review`, and recorded here because the cap is this node's answer. The warning `apply.mjs` prints at a third reading counts the reading sections a node has gained since its last kickback, and the cap this node states is on readings of one answer: "What the cap forbids is a third reading of the same answer." Those come apart exactly where the recommendation moves from one option to another without a kickback, which is what happened on `clean-context-review`, whose amendment moved the recommendation to a different option and so began a new answer's first reading while the counter read it as an old answer's fourth. The warning fired and it was wrong; it is non-fatal and nothing was blocked, and the answer is right as it stands, so what is owed is the instrument, whose counter should reset when the answer fact's `recommends` changes and not only on a kickback. Recorded rather than fixed in the same breath because this node is at the review stage with its own re-reading owed, and the fix is named here so the reading sees it.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `neighbourhood-questions-and-delta`.

Findings:

- Rationale, the recount instruction, false, and it is the answer this node gave to the last reading's finding on its numbers. The text says: "The briefs are the files `tmp/review/*.brief.md` on the implementation ref as this sitting left them; each figure is a line count between two headings of one brief ... Anyone checking this node recounts them from those files, and a brief that cites a measurement in its argument should say how to recount it." Neither half holds. `git check-ignore -v tmp/review/draft-decomposition.brief.md` returns `.gitignore:4:/tmp/`, so no brief is on the implementation ref at all. And 21 of the 23 `tmp/review/draft-*.brief.md` on disk have been regenerated in the post-reconciliation form: only `draft-dialogue.brief.md` and `draft-prose-and-structure.brief.md` still carry a `## The index of every other question the record asks` section. Neither end of the pair the rationale leans on survives: `draft-decomposition.brief.md` is 1,266 lines today, not 4,934 and not 3,181, and `draft-progressive-disclosure.brief.md` is 1,434, not 5,740. What can still be checked is consistent with the band (dialogue's index is lines 5054-7314, 2,260 of 7,337 lines, 30.8 percent; prose-and-structure's is 3506-6091, 2,585 of 6,114, 42.3 percent), but the range's endpoints, the mean of 2,775, the median of eight times the object and the decomposition before/after are now unrecountable by anyone. Note also that the last reading's finding, that 3,478 exceeded the stated maximum of 3,447, was answered by writing 3,447 in both the rationale and the account with no re-measurement recorded and no file left that could carry one. Suggested edit: date the figures to the graph commit and the hour they were taken and say the briefs have since been regenerated, so a reader knows they cannot be recounted; and adopt the clause the last reading proposed and this node declined, that where a draft's rationale rests on a measurement its brief carries the command that reproduces it, which is recorded as a missing option in the viability field below.
- Answer, "What a draft's reading is given", the enumeration omits the nodes the draft names, and this is the node that defines `neighbourhood`. The sentence reads: "its brief carries that node in full and its neighbourhood in full: the ancestry to the root, the rules that bind every session, the nodes its `depends` names and the options named in them, the nodes under it, its siblings, and the readings that bear on it." The parent's recommended text, carried whole in this brief, gives "the nodes it names, by id or as the node of that slug, and the nodes its `depends` names"; `draftNeighbourhood` in `packages/clean-context-review/brief.mjs` emits a `## The nodes it names` part; and this brief carries four such nodes, `alignment-order`, `decomposition`, `fagan-inspection-roles` and `self-contained-specification`, none of which is in this node's `depends` (which names `clean-context-review#per-draft-and-survey`, `frontier-consistency#split-survey-from-per-draft` and `dialogue`). So the definition of the neighbourhood, on the node that defines the term, excludes a part its parent includes and its instrument emits. This is also the third divergence in two days between the two enumerations of the same list, after `depends`-against-names-by-id-or-slug and the author's words on each neighbour, which is measured evidence for the option `neighbourhood-cited-not-restated` and should be added to that option's prose, where it now records two. Suggested edit: "... the rules that bind every session, the nodes it names and the nodes its `depends` names, with the options named in them, the nodes under it, ...".
- Answer, "What a draft's reading is given", the exception for an option sourced to the draft is presumed materialized and is not, and this reader paid the cost the exception exists to prevent. The clause reads: "One exception, and it is the draft's own text and not the neighbour's: where an option on a neighbour's fact names the node under review as its source, that option's prose is carried in full, because it is what the draft put there and the validation that asks whether the draft contradicts the node above it turns on that prose." Verified false of the instrument: `renderNeighbourNode` (`packages/clean-context-review/brief.mjs`, lines 468-505) emits for every neighbour the id, the file, the question, the status line, the standing answer, the recommended answer where it differs, and the option names with their source and status, and has no branch on `option.source` at all. This brief is the proof: `pointers-for-what-grows-with-the-record` on `clean-context-review` and `commit-in-the-review-block` on `dialogue` are both sourced to this node and both appear as bare names, so to run validation 2 I opened `disposition/disposition-graph/clean-context-review.md` from disk, which is exactly the reach outside the brief the last reading reported and this amendment claimed to have bounded. The parent's own recommended text discloses the gap in its own voice, "and which the generator does not yet do"; this node, which owns what a brief costs and states the clause as a rule, does not, so a reader of this node alone would take it as materialized. Validation 5. Suggested edit: add the disclosure and name the reconciliation as owed, in the same words the parent uses.
- Rationale, the traditions owed: the diff as the unit of review is a tradition the record already reads, and this is the same case as Fagan, which the last reading caught and this node took. The rationale lists among the readings owed "the diff as the unit of review, the ordinary practice of code review, which the re-reading adopts". `commons.systems/disposition-graph/change-reviewed-as-a-diff` is a `form: reading` node under `dialogue` whose `source` names Hunt and McIlroy (1976), Wall's patch (1985), Gerrit and the pull request, and whose answer closes with the objection this node's re-reading is the answer to: "a reviewer shown the whole will read the whole, so the attention the diff was invented to protect is spent unless the projection that derives the edit is actually in front of the reader." So what is owed is a second reading of a tradition the record already holds, with the relation recorded there as a `bears` entry, not a new reading under this node. Suggested edit: name it in the same clause that already does this for Fagan. Beside it, `commons.systems/disposition-graph/review-approval-pinned-to-a-revision` decides the first of the three ways out listed in the option `pin-names-the-text-the-reader-read`: that option's first way out, "the second reading's apply settles the pin over the amendment it read, ... which makes the pin attest a forward on text no reader saw", is precisely the failure that reading says the practice exists to convert into a visible one ("the approval is still displayed, the reader trusts it, and the change that lands is not the change that was read"). The option's prose should cite it, since it strikes one of the three.
- Answer, "What is not bounded, and is not waste", declares out of scope the part of the cost the record measures as dominant, on a question that is this node's. The clause reads: "The number of drafts on the frontier and the number of sittings. The review is priced per draft by design, and a backlog costs one reading a draft in it; that is the cost of having the drafts, not the cost of reading them." The author's words this node answers open "This review process is burning tokens very rapidly", and `commons.systems/disposition-graph/decomposition`, a node this one names and this brief carries, records on its answer fact an `against` measured after this reconciliation landed: "this sitting's per-draft briefs total 7,709,220 bytes across 22 files, 6,748,728 of them written today, and the survey half is a further 1,083,638 bytes -- itself larger than the whole batch it was said to be a leaner reading of ... That is roughly an order of magnitude on the criterion the author named first." Re-measured today: `du -bc tmp/review/draft-*.brief.md` gives 7,926,691 bytes across 23 files, against 838,923 bytes for `tmp/review/frontier.brief.md`, the batch brief of 2026-09-03 that the per-draft division replaced, and 1,083,638 for `tmp/review/survey.brief.md`, which alone exceeds it. The author's second sentence, "Some of it is acceptable as cost of draining a backlog", grounds part of the clause but not the part that the division itself multiplies the spend. Suggested edit: keep the clause, and add that the per-draft division is the `clean-context-review` node's decision and its measured price is on `decomposition`, that what this node bounds is one reading of it, and that after this node's reconciliation the sitting's total still stands at roughly an order of magnitude over the batch design it replaced, so the author rules knowing the lever this node pulled did not reach the number their words named.
- Answer, "What attention is spent on", the strike rule the answer sets catches the answer's own round clause. The rule reads: "every part of a brief is there for a validation the reader is asked to run, and a part no validation reaches is struck rather than shortened: the questions are there for the merge validation, the neighbourhood for the contradiction validations, the round for the sitting's own consistency, and nothing is carried because it might prove useful." A draft's reader runs validations 1 to 6 and the 15th; consistency between two frontier nodes is validation 7, and validation 7 is the survey's by `frontier-consistency`'s recommended text, carried whole in this brief. So "the sitting's own consistency" names no validation on this reader's list. The round's questions do feed validation 15, since the index prints only "every node outside the parts above" and so excludes them, but the field the round adds beyond a question, "the recommendation each now makes", is reached by nothing the reader is asked to run. Suggested edit: price the round to validation 15 and drop the recommendation field, or say plainly that the round is carried against a validation this reader's list does not yet carry and record that addition as an option on `frontier-consistency`, which owns the division of the validations.
- Rationale, the shape test, and the constant this answer adds in place of the one it struck. Measured on this brief, which is the answer's own output and the first taken after the neighbour clause landed: 288,763 bytes, of which the node under review is 71,188 (25 percent), the neighbourhood 168,948 (58 percent), and within that the rules of the reading 65,882, the round 5,389, the index of every other question 21,401, and the instructions with the output schema 21,837. The rationale's own closing test is "`alignment-page` is a 1,946-line node, so the brief that judges it is mostly its object, which is the shape every brief should have and the shape none of them had"; this brief's object is a quarter of it, and the rules of the reading alone, the same twelve nodes in every brief, are three times the index they displaced. The rule the answer states, "a part of the brief that grows with the record rather than with the draft is carried as a list of pointers, and a part that is the draft's own is carried whole", does not classify a part that grows with neither and is constant across briefs, which is what the rules of the reading are; the argument that actually carries them is the double read, and that is a different test from the one the index was struck by. Suggested edit: state the third case in the rule, that a part constant across briefs is carried whole only where carrying it costs less than the reads it saves, and give this brief's composition as its measurement.
- Rationale and the answer fact's `against`, two counts stale within the day they are dated to. The `against` says "forty-five nodes standing at the review or the ruling stage and no node in the record carrying a survey pin" and the rationale says "on 2026-09-05 that set was forty-five nodes"; measured now, `grep -rlE "^stage: (review|ruling)$" disposition/` gives 48 and `grep -rln "^  survey:" disposition/` gives none. Likewise "the record went from 63 questions on 2026-09-04 to 137 nodes on 2026-09-05": `node packages/disposition/validate.mjs disposition` reports "ok: 142 nodes". Both drift with the answer's case rather than against it, and both are instances of the property the answer names as its own rule, a figure that grows with the record. Suggested edit: give each count with the graph commit it was taken at, which is the discipline the rationale asks of its other measurements and does not apply to these.
- Low, the brief misstates itself in two places, and what a brief must state is this answer's. The navigation line reads "This brief is 1309 lines" and the file is 1,308. The section `## The rules of this reading` opens "The same twelve nodes for every draft: ... Carried here, whole, so you are never told to go and open them" and renders five, the other seven having been claimed by the ancestry part, which is the deduplication `READING_RULES` intends (`packages/clean-context-review/brief.mjs` line 774, with the note that five are `tier: global` and already in `ancestry`) but not what the sentence says; both lines are in `packages/clean-context-review/brief-draft.md`. Under this answer's clause "A brief is written to be held whole by the reader it is given to, and it states its own size and the discipline for reading it", the size and the count are both things the brief states about itself and both should be derived rather than written.
- Low, the instrument's own text is stale against the amendment this node landed. `renderNeighbourNode` (`packages/clean-context-review/brief.mjs` line 450) attributes its rule to "`review-cost`, the `neighbours-answered-not-whole` clause the recommended answer folds in" and quotes "the neighbourhood is carried, but each neighbour by what it answers rather than by its whole file": the option was renamed at the last apply to `neighbours-carried-whole` and restated as the strike of the clause rather than a clause the answer folds in, so the comment names an option the record no longer carries and describes the recommendation backwards. `draftNeighbourhood`'s docstring (line ~793) still says the index is "bounded to its id and its question, per `review-cost`'s answer" where the answer and `indexQuestionLine` (line 519) both carry the file as well. Neither is in the graph and neither changes what the code does; they are named because this node's reconciliation wrote them and the next reader of the generator will take them for the rule.

On the facts and what they recommend: Two facts, answer and authority, which is what a node with nothing standing and no prune or shape change in prospect should carry; nothing stands, so `stands` is rightly absent and the `## Recommendation` fence is required and present, and no persistence fact is right since nothing changes shape. The answer fact recommends `neighbourhood-questions-and-delta` at moderate, which is the right level on its face -- the criterion and the grant are the author's, the design and the measurement are the AI's -- though finding 1 argues the measurement half now rests on the AI alone, since no one can recount it. The authority fact recommends `ratified` at moderate, which is what the `authority` node's escalation asks of a rule that lets the drafter set the reviewer's object and whose failure is invisible in the record, and its `against` states the delegation counter fairly. The review pin is stale, as a re-reading's must be, and this reading re-pins it; that staleness is the subject of the live option `pin-names-the-text-the-reader-read` and is not a defect of the facts.

On the viability of the options: On the answer fact every listed option is a real point on the frontier and every passed-over reason holds: `full-index-per-draft` and `no-index-at-all` are the two ends, `full-re-read-on-every-move` is dominated by the delta once the commit is in the record, `unbounded-rounds` by the sitting's own evidence that no round has terminated of its own accord, and `budget-per-sitting` because it bounds the number of readings and not the object of one. The last reading's two repairs have landed: `neighbours-carried-whole` now reads as the strike a ruling could take, and `answers-only-index` is on the list as the frontier's middle; `neighbourhood-cited-not-restated` and `pin-names-the-text-the-reader-read` are live and both bear on findings above. One viable option is missing, and it is the last reading's own suggestion, which this node answered in the rationale instead and finding 1 shows the answer failed -- name it `brief-carries-the-recount-command`: "Where a draft's rationale rests on a measurement, its brief carries the command that reproduces the number, so the reader checks the measurement rather than taking the drafter's word or re-inventing it. What it would answer: validation 3 asks the reader to verify every claim about the record or the implementation, and a reader handed a rationale of numbers and no way to recompute them can only verify the ones it happens to be able to re-derive, which on this reading was three of them out of six; it costs one line a measurement in the brief, against the alternative this node took, naming the recount method in the rationale, which was false within a day of being written." A second candidate is considered in the rationale and not listed, which `viable-options` says a candidate never is: `rules-of-the-reading-named-as-files`, the brief naming the twelve rule nodes for the reader to open rather than carrying them, which is what the brief did until 2026-09-04 and which the rationale argues against by the double read -- it should stand on the fact marked passed over with that reason, so the author sees the 65,882 bytes it would save and the double read it would cost. The authority fact's three options are the record's own vocabulary and are complete by construction.

Strongest counter-argument (strong): The reviewed party wrote the reviewer's brief, and this is the second reading of that brief; the first found three measurements wrong in the direction that flattered the design, and this one finds that the repair does not hold. The rationale's promise that anyone can recount its numbers is false in both limbs -- `tmp/` is gitignored, so no brief is on the implementation ref, and 21 of the 23 briefs have been regenerated past both ends of the before/after pair -- so an answer that narrows what every future reviewer is shown now rests on figures no reviewer can check, and the last reading's finding was answered by rewriting a number rather than by re-taking it. Two clauses of the answer are also false of the instrument that materializes them: the exception for an option sourced to the draft is not implemented, which cost this reader the same trip outside the brief the last reader reported, and the enumeration of the neighbourhood omits the cited nodes the brief actually carries. The design's reply is the survey, its named reader of last resort, and the survey has still never run: 48 nodes now stand at the review or the ruling stage and not one carries a survey pin. And the record's own measurement, on `decomposition`, a node this one names, puts the sitting's spend at roughly an order of magnitude over the batch design it replaced, after this reconciliation landed, while this node's answer declares that total "not bounded, and is not waste" -- so the node the author asked to price the review prices the reading and disclaims the number their words named. Against all that: the design is right on its merits, no listed alternative dominates it, validation 2's scope really is the ancestry and the cited nodes, both of which the neighbourhood carries, and the authority fact already escalates to ratified for exactly this capture shape. The case is strong and is not decisive. One thing the author should rule on in the same sitting: this node's cap of two readings, plus its rule that the reading is applied before the amendment, means the corrections these findings ask for will land unread and the pin will again name text no reader saw, which is the option `pin-names-the-text-the-reader-read` becoming a live obstruction on its first use.

The session's reply: Second reading, forwarded at strong strength with ten findings, all validated at their loci on this thread and all accepted. The counter-argument is the sharpest the sitting has produced and it is right on the facts: the reviewed party wrote the reviewer's brief, the first reading found three measurements wrong in the direction that flattered the design, and this reading finds the repair did not hold.

The recount instruction was false in both limbs and is struck. Verified: git check-ignore -v tmp/review/draft-decomposition.brief.md returns .gitignore:4:/tmp/, so no brief is on the implementation ref; and of the twenty-three tmp/review/draft-*.brief.md on disk only two still carry the pre-reconciliation index section, so twenty-one have been regenerated past both ends of the before/after pair. draft-decomposition.brief.md is 1,266 lines today and draft-progressive-disclosure.brief.md 1,434. The range's endpoints, the mean, the median and the decomposition pair are unrecountable by anyone, and the previous reading's finding that 3,478 exceeded the stated maximum was answered by writing 3,447 rather than by re-taking the measurement. Every figure that survives is now dated to the graph commit and the implementation commit it was taken at, and every figure that cannot be re-taken is marked as such in the record rather than left standing as a recountable one.

The missing option is listed as brief-carries-the-recount-command, source review, ref 2026-09-05, with the reading's prose: where a draft's rationale rests on a measurement, its brief carries the command that reproduces the number. It was the previous reading's suggestion, answered in the rationale instead, and finding 1 is the evidence that the answer failed.

The enumeration of the neighbourhood omitted the nodes the draft names, on the node that defines the term. Verified: the parent's recommended text carries them, brief.mjs emits a '## The nodes it names' part, and this very brief carries four such nodes, none of them in this node's depends. Corrected. This is the third divergence in two days between two enumerations of one list, and it is added to the prose of neighbourhood-cited-not-restated, where it now records three.

The exception for an option sourced to the draft is not materialized, and this reader paid the cost it exists to prevent: two options sourced to this node appeared as bare names, so the reader opened a neighbour's file from disk, which is the reach outside the brief the amendment claimed to bound. The parent discloses the gap in its own voice; this node did not, and now does, in the same words, with the reconciliation named as owed. The fix is in hand on the implementation ref under the author's grant of 2026-09-04.

The diff as the unit of review is a tradition the record already holds: change-reviewed-as-a-diff, under dialogue, whose answer closes with the very objection this node's re-reading answers. It is named in the same clause that already does this for Fagan, as a second reading of a tradition held, with the relation to be recorded there. Beside it, review-approval-pinned-to-a-revision strikes the first of the three ways out listed on pin-names-the-text-the-reader-read, and that option's prose now cites it.

The out-of-scope clause kept its substance and gained what the record measures. Re-measured today: du -bc tmp/review/draft-*.brief.md gives 7,926,691 bytes across twenty-three files, against 838,923 for the batch brief of 2026-09-03 that the per-draft division replaced, and 1,083,638 for the survey's brief, which alone exceeds the batch. The clause now says that the per-draft division is clean-context-review's decision and its measured price is on decomposition, and that what this node bounds is one reading of it.

The strike rule caught the answer's own round clause. A draft's reader runs validations 1 to 6 and the 15th; consistency between two frontier nodes is validation 7 and is the survey's. The round is priced to validation 15, which the index does not reach, and the recommendation field, which nothing on this reader's list reaches, is recorded as an option on frontier-consistency, which owns the division of the validations.

The shape test gains the third case it was missing. Measured on this brief, the answer's own first output after the neighbour clause landed: 288,763 bytes, the node under review 71,188 of them, a quarter, where the rationale's closing test asks for a brief that is mostly its object; the rules of the reading, constant across briefs, are 65,882, three times the index they displaced. The rule as stated classifies what grows with the record and what is the draft's own, and not what grows with neither; the third case is stated, that a part constant across briefs is carried whole only where carrying it costs less than the reads it saves, with this brief's composition as its measurement.

Two counts were stale within the day they were dated to. Re-measured: forty-eight nodes at the review or ruling stage, not forty-five; no node in the record carries a survey pin, which still holds; and the record is at 142 nodes, not 137. Each is now given with the commit it was taken at, which is the discipline the rationale asked of its other measurements and did not apply to these.

The two low findings are taken as implementation, not as text: the brief's self-reported size is off by one and its 'same twelve nodes' sentence renders five after deduplication, and renderNeighbourNode's comment names an option the record renamed and describes the recommendation backwards. Both are on the implementation ref and are reconciled there under the author's grant of 2026-09-04; neither is in the graph.

The recommendation moved, so the node returns to the review stage.

### Amended after the second reading, 2026-09-05

Ten findings, all validated at their loci on the alignment thread and all
accepted. The counter-argument is the sharpest the sitting has produced and it
is right on the facts: the reviewed party wrote the reviewer's brief, the first
reading found three measurements wrong in the direction that flattered the
design, and this reading finds the repair did not hold.

The recount instruction was false in both limbs and is struck. Verified:
`git check-ignore -v tmp/review/draft-decomposition.brief.md` returns
`.gitignore:4:/tmp/`, so no brief is on the implementation ref; and of the
twenty-three `tmp/review/draft-*.brief.md` on disk only two still carry the
pre-reconciliation index section, so twenty-one have been regenerated past both
ends of the before-and-after pair. The rationale now says the figures are not
recomputable, marks which of them can never be re-taken, and dates every figure
it states from here on to the graph commit and the implementation commit it was
taken at. The previous reading's finding about 3,447 was answered by writing a
number rather than by re-measuring, and that is recorded rather than smoothed
over. The option the previous reading suggested and this node answered in prose
instead, `brief-carries-the-recount-command`, is now on the fact where the
author can rule for it.

The enumeration of the neighbourhood omitted the nodes a draft names, on the
node that defines the term: the parent's list carries them, the generator emits
them, and this brief carried four of them. Corrected, and the third divergence
in two days between two enumerations of one list is added to the prose of
`neighbourhood-cited-not-restated`, where it now records three.

The exception for an option sourced to the draft is not materialized, and the
reader paid the cost it exists to prevent, opening a neighbour's file from disk
to check two options this node had sourced there. The clause now discloses the
gap in the same words the parent uses and names the reconciliation as owed.

The diff as the unit of review is a tradition the record already holds at
`change-reviewed-as-a-diff`, whose own answer states the objection this
re-reading answers; it is named there rather than owed here, as Fagan already
is. Beside it, `review-approval-pinned-to-a-revision` strikes the first of the
three ways out on `pin-names-the-text-the-reader-read`, and that option now
cites it.

The out-of-scope clause keeps its substance and gains what the record measures:
at implementation commit 8bb72b17 this sitting's twenty-three draft briefs total
7,926,691 bytes against the batch brief's 838,923, and the survey's brief alone
exceeds the batch. The clause now says that the per-draft division is the
`clean-context-review` node's decision, that its measured price is on
`decomposition`, and that what this node bounds is one reading of one draft.

The strike rule caught the answer's own round clause. Consistency between two
frontier nodes is the seventh validation and the survey's, so it prices nothing
in a draft's brief; the round is priced to the merge validation, which the index
does not reach, and the recommendation field, which no validation on this
reader's list reaches, is recorded as the option `a-validation-for-the-round` on
`frontier-consistency`, which owns the division of the validations.

The shape test gains the third case it was missing. Measured on this node's own
second brief at graph commit 02287a28 and implementation commit 8bb72b17:
288,763 bytes, the object a quarter of it, the rules of the reading 65,706 and
three times the index they displaced. A part constant across every brief grows
with neither the record nor the draft, so the rule as stated did not classify
it; the third case is now written, and this measurement is what it is judged on.

Two counts were stale within the day they were dated to. Re-measured at graph
commit 1cde11f6: forty-eight nodes at the review or the ruling stage, not
forty-five; no node carries a survey pin, which still holds; and the record is
at 142 nodes, not 137. Each is now given with its commit.

The two low findings are implementation and not text, and are reconciled on the
implementation ref under the author's grant of 2026-09-04: the brief's
self-reported size is off by one and its "same twelve nodes" sentence renders
five after the deduplication against the ancestry, and `renderNeighbourNode`'s
comment names an option the record renamed and describes the recommendation
backwards.

The recommendation moved, so the node returns to the review stage. This is the
second reading of this answer, and the cap the node itself sets means the
findings that survive from here are recorded as options and not answered in the
text.

### The escalation test's citation corrected, 2026-09-05

The `### authority` prose cited the `authority` node for the escalation test in
two places. The test left that node's answer on 2026-09-05 for
`class-recommendation`, and while this node's own `## Answer` cites this node's
question back, the pair had become a loop; the reading of `class-recommendation`
found it. Both citations now name `class-recommendation`, and nothing about the
class or the boldness changes. The edit moves the authority-fact pin without a
reading behind the move, which is this node's own option
`pin-names-the-text-the-reader-read`.

### The disclosure discharged, 2026-09-05

The answer disclosed that `renderNeighbourNode` had no branch on an option's
source, so the exception it states was a rule stated and not a rule running. The
reconciliation landed the same day and the sentence became false where it stood,
which is the one thing a disclosure written "rather than leaving to be found"
must not be. It is corrected to what the generator now does, with the history
kept. Verified at `packages/clean-context-review/brief.mjs`: `renderNeighbourNode`
takes the id of the node under review and carries whole any option whose `source`
names it. The correction is in the standing text, so the pin moves and the node
reads as changed since its second reading; under this node's own cap the answer
has had its two readings and a third is not bought by a sentence about an
instrument, which is the cost the live option `pin-names-the-text-the-reader-read`
records.

### The cycle the cap does not reach, 2026-09-05

The sitting that recorded this node went on to spend, on four nodes, four full
readings and two re-readings after it landed. Counted at graph commit 73e2a04f:
`clean-context-review` seven readings, `what-acts-during-bootstrap` four,
`class-recommendation` three, `bootstrap-exit-conditions` and
`delegation-bounds-and-sizing` two each. Every one of them was inside this node's
cap, because the cap bounds the readings of one answer and a kickback makes a new
answer. The two rules compose into a cycle nothing bounds.

Recorded as the option `a-cap-on-redraws-per-node-per-sitting` and not
recommended. The measurement is the point rather than the remedy: on this record
the most-read nodes are the ones whose successive readings each found something
real, so a bound drawn today would have traded a known defect for tokens, and
what would actually pay is a cheaper first draft rather than a cheaper loop.
The pin does not move: an option is not in the recommendation's hash.

### The deadlock measured on the whole frontier, 2026-09-05

The option `pin-names-the-text-the-reader-read` was raised from one node's
sequencing and is a property of the frontier. At graph commit 4262d092, 34 of
the 48 nodes at the review or ruling stage carry a review pin that names text
other than the recommendation that stands, and `readyToRule` is true of none of
them. Two of the 34, `class-recommendation` and `delegation-bounds-and-sizing`,
reached this answer's cap of two readings on 2026-09-05 and can be re-pinned by
no reading at all; the rest are stale from amendments a reading earned, and
sending each back through a reading is the cost this node exists to bound. The
measurement is recorded and nothing is settled by it: which of the three ways
out the record takes is the author's, on the option.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Disclosure of drift between the pinned commit and the graph as it stands. At graph HEAD b8a70f8164294f7d08a5782a22e02233d460580f this node's answer fact carries a further option, `a-cap-on-redraws-per-node-per-sitting` (source ai, ref 2026-09-05), and an account section dated 2026-09-05, neither of which is present at the pinned commit 73e2a04fd4dcadb688000a8611c13cbcddf1ed0f, which is an ancestor of HEAD. `recommends: neighbourhood-questions-and-delta` is unchanged, and by `review-approval-pinned-to-a-revision` an option added beside a recommendation does not stale the pin, so the node remains judgeable and this reading judged the pinned text. No other node of the graph differs between the two commits.

Strongest counter-argument (strong): Every clause of the recommendation narrows what the reviewer is shown, on measurements taken by the party the review exists to check, and a reader that must search for what it is no longer given searches for what it thinks to look for, which is the drafter's own frame. The answer's reply is that the survey holds the whole graph and is the reader of last resort — a reply that is good only while the survey runs before every ruling. This survey is the first the record has run; it read a brief its own text says a reviewer may not hold whole; and the node moved beneath it while it read. The backstop the narrowing is priced against has now been exercised once, and the exercise is evidence for the counter-argument rather than against it.

The session's reply: Taken, and the disclosure is accepted as accurate: the node moved beneath the reading by an option added beside the recommendation, which by `review-approval-pinned-to-a-revision` does not stale the pin, and the reading judged the pinned text. On the substance the counter-argument is now better evidenced than when the node was drafted: the survey read a brief its own text says a reviewer may not hold whole, and it is the backstop the narrowing was priced against. The session does not move the recommendation and records that the narrowing's defence now rests on a backstop with one exercise, whose one exercise is evidence against it.

### Two clauses of this answer materialized, 2026-09-05

Under the author's grant of 2026-09-04, landed on `greenfield` at `87e4b24e`.

Which of the two readings a brief is written for is the tool's to derive and
not the session's to name, and the tool could not derive the one case that
matters: after a kickback the answer was redrawn and owes a fresh reading, and
`chooseMode` gave such a node the re-reading unless the session passed
`--fresh`. The review skill claimed the derivation while its own invocation line
omitted the flag, so an executor following it ran the reading this answer says is
not owed. `chooseMode` now reads the kickback off the node's own `review` block,
which the apply step writes on a kickback exactly as on a forward; `--fresh`
stays only for the case the record cannot show, a redraw whose kickback was never
applied.

And the brief stated its own size in lines, where this answer's rationale fixes
the measure in bytes because this record writes a paragraph as one unwrapped
line and a line count flatters whichever text has the shorter paragraphs. It now
states bytes over lines — both, because the reader pages by the line numbers the
same sentence names — taken to a fixed point, since the sentence stating the size
is part of the size it states. The stdout reports and the too-large warning
carry the same pair.

### The delta brief was unreachable, and why, 2026-09-06

Measured in the sitting on `what-an-option-row-carries`, 2026-09-06. The
re-reading of an amendment fell back to a full draft brief, and the reason is a
seam between two instruments rather than a defect in either.

`brief.mjs` chooses the delta brief when the node's recommendation has moved
since its review's pin and the review names a graph commit to diff against. The
commit comes from the reader's own output, which `apply.mjs` copies into
`review.commit`. Nothing asks the reader for it: the reading of 2026-09-06
returned `scope`, `id`, `date`, `verdict`, `kickback_stage`, `findings`,
`probes`, `facts_check`, `viability`, `counter_argument` and `strength`, and no
`commit`, so `apply.mjs` wrote none and `brief.mjs` reported "the node's
recommendation has moved since its review, but the review names no commit to
diff against" and fell back.

What the fallback costs is the whole of the economy this node's answer is about.
The draft brief for that node was 308,317 bytes over 2,164 lines; the delta brief,
once the commit was recorded, was 132,655 bytes over 1,272 lines. The re-reading
is therefore paid at more than twice its price, and it is paid on every
amendment, since nothing in the loop supplies the commit. It is also paid
silently: the fallback is reported on stderr at the moment the brief is written
and nowhere in the record, so a session that does not read that line buys the
larger brief without knowing there was a smaller one.

The commit was recorded by hand for that node, `c162955a`, which is the graph
commit the worktree stood at when the brief was generated and is verifiable from
the log rather than invented. That is a repair of one instance and not of the
seam. Two remedies are worth the reconciliation frontier's attention and neither
is taken here: the brief could carry the graph commit it was generated at and
require the reader to return it, which puts the fact where the reader can see it;
or `apply.mjs` could fill `review.commit` from the graph's own head when the
reading omits it, which needs no reader change and is right whenever the reading
was run against the landed tree. The first is the honest one, since the second
records what the applying session read rather than what the reading read.

### The four cost clauses of 2026-09-07, and where the cost had moved to

The author, 2026-09-07, quoted under `## Disposition`: "this iterative clean-context reading is very expensive. Are there token/context optimizations that would achieve similar quality results?"; "also consider optimzations to the dialogue workflow"; "record the recommended optimizations as dispositions, progress them up to confirmation, and include them in the list of reconciliations of alignment dialogue/review/survey/artifact"; and "begin applying the optimizations as you progress".

The measurement, at graph commit `d0942d57` and implementation commit `87e4b24e`, on the seven draft briefs of 2026-09-07 in `tmp/review/`, generated between 09:53 and 10:11 and measured before the instrument was amended at 10:36. Seven briefs, 2,585,266 bytes. The `## Account` of the node under review: 465,864 bytes, eighteen percent, and 196,599 of the 623,345 of the `alignment-page` brief. Ninety-four neighbour renderings carry both a standing and a recommended answer of the same node, 262,496 bytes of the first and 592,021 of the second. The ancestry and the rules of the reading together run 129,627 to 162,913 bytes a brief, twenty-three to sixty-three percent of it, already in the form that carries each node by what it answers. Line counts: `draft-growth.brief.md` 2,081, `draft-alignment-page.brief.md` 4,692, seven and sixteen pieces at the three-hundred-line bound. The findings: fourteen on the reading of `growth`, of which the session counted seven mechanical; the validator at `87e4b24e` refuses a `passed` option with no `reason` and holds none of the other five kinds named. The commands are listed at the end of this sitting's design record.

What moved. The recommendation moves from `neighbourhood-questions-and-delta` to `one-answer-a-node-and-one-read`, which is that text with four clauses added: one answer a node for every reading, the node under review's account cut to its last section, the brief read in the fewest pieces the tool allows with the navigation line and the launch prompt agreeing, and a finding that quotes its locus verbatim beside the rule that a defect an instrument can name is not a finding. The rationale gains the sixth measurement and a paragraph saying which clauses already run; the costs paragraph gains the four new costs.

What stays viable. Every option on the fact keeps its row. `neighbourhood-questions-and-delta` is the recommendation this one amends and is the author's fallback if any clause is refused; `neighbours-carried-whole` and `answers-only-index` are the two ends the reading of 2026-09-05 asked the author to rule between and the one-answer clause moves neither of them; `pin-names-the-text-the-reader-read`, `brief-carries-the-recount-command`, `neighbourhood-cited-not-restated` and `a-cap-on-redraws-per-node-per-sitting` are untouched.

A placement made against the brief this unit was given. The rule that a mechanical defect is the instrument's was assigned to `clean-context-review`; it is recommended here, because this node's answer already owns the paragraph on what a reading's attention is spent on and the rule is the mirror of the rule stated there, while what a reading judges is enumerated on `frontier-consistency` and is unchanged by it. The six checks the rule names are owed to the validator and are a reconciliation item on this node.

Three of the four clauses were already running in the working tree at `87e4b24e` under the author's instruction to begin applying: the account cut to its last section, the verbatim locus in both brief templates, and the survey's carrying rule. They are unsupported implementation until this option is ruled, and are named as such here rather than presented as the state of the record.

The reading of this amended recommendation is owed.

### Clean-context re-reading, 2026-09-07, of b9e1b4e5

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `one-answer-a-node-and-one-read`.

Findings:

- Answer, on viability of the options, the previous (second) reading named two missing candidates under `viable-options`'s rule that a candidate never silently leaves the list, but only one was added. `brief-carries-the-recount-command` was added to the answer fact (correct). The second, `rules-of-the-reading-named-as-files` -- "the brief naming the twelve rule nodes for the reader to open rather than carrying them ... it should stand on the fact marked passed over with that reason, so the author sees the 65,882 bytes it would save and the double read it would cost" -- is not on the answer fact's option list; the rationale's shape-test paragraph and the double-read paragraph argue against it in prose only, which is the same defect the reading found elsewhere on this node. Suggested edit: add it as a passed option, source review, ref 2026-09-05, with the reason already written in the rationale's fourth-measurement paragraph (the double read the pointer form would cost).

On the facts and what they recommend: Nine of the ten findings of the 2026-09-05 second reading are answered on the fact and in the standing text. The recount instruction is replaced with an honest statement that the figures are unrecomputable (tmp/ is gitignored, 21 of 23 briefs regenerated), every figure now carries its graph and implementation commit, and `brief-carries-the-recount-command` is added to the answer fact. The neighbourhood enumeration now includes the nodes a draft names, verified consistent with `depends`-plus-names in the answer text; `neighbourhood-cited-not-restated`'s prose now records three divergences. The sourced-option exception is disclosed as materialized by `renderNeighbourNode` as of the 2026-09-05 reconciliation. The diff-as-tradition and review-approval-pinned-to-a-revision citations are added where the rationale and the `pin-names-the-text-the-reader-read` option needed them. The out-of-scope clause now attributes the per-draft multiplier to `clean-context-review`'s decision and cites `decomposition`'s measured price. The round clause is bounded to validation 15 with the recommendation field recorded as an option on `frontier-consistency`. Stale counts (45->48 nodes, 137->142) are corrected and dated to graph commit 1cde11f6. The two implementation-level findings are disclosed as reconciled on the implementation ref, outside the graph. The recommendation additionally moves to `one-answer-a-node-and-one-read`, four new clauses (one answer per node, account cut to its last section, fewest-pieces reading, and mechanical defects as the instrument's) drawn from a sixth, 2026-09-07 measurement, honestly disclosing which of the four are already running and which are not.

On the viability of the options: All prior options remain viable and undisturbed by the new clauses; `brief-carries-the-recount-command` and `a-cap-on-redraws-per-node-per-sitting` (added at the prior reading) are both present. One gap remains open: the missing candidate `rules-of-the-reading-named-as-files`, named above.

Strongest counter-argument (weak): The second reading's viability paragraph named two missing candidates for the option list; the amendment added one (`brief-carries-the-recount-command`) but not the other (`rules-of-the-reading-named-as-files`), so `viable-options`'s rule that a candidate never silently leaves the list is still only partly satisfied on this fact. This is a completeness gap rather than a substantive defect in the recommendation, and under this node's own cap the finding is properly recorded as an option for the author rather than redrawn a third time.

The session's reply: Accepted; verified on the main thread that rules-of-the-reading-named-as-files stood in the rationale and in the second reading's viability paragraph and on no fact. It is recorded on the answer fact, source review, ref 2026-09-05, passed with the double read as its reason, so the author sees the bytes it would save beside the read it would cost. The recommendation is unchanged and no third reading is owed.

### Frontier survey, 2026-09-07, of b9e1b4e5

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The rationale's ground for giving the round as pointers is a measurement the record contradicts: it says the derived set was every node at the review or the ruling stage "because no survey has ever run and so no node carries a survey pin", and forty-five nodes carry a survey pin at the commit this survey read, which frontier-consistency states in terms. Since the round is derived as the set the survey owes a reading, a false premise about the survey's history is a false premise about the membership and the size of what every draft's reader is handed, and this node is where the size is priced.

### Frontier finding, 2026-09-07

Kind: contradiction.

Three nodes at the ruling stage disagree about whether a survey has ever run, and the round every draft's reader is handed is derived from the losing side. clean-context-review's recommended text says the round is derived "as every node the survey owes a reading, which is every node at the review or the ruling stage carrying no survey pin or one its recommendation has moved past; while no survey has run that is the whole of the review and ruling stages and not the sitting's own drafts alone, and it is given as pointers, one line a node, for that reason." review-cost's recommended rationale says the same: at graph commit 1cde11f6 the set was forty-eight nodes, "because no survey has ever run and so no node carries a survey pin." frontier-consistency's recommended text says the opposite and is right: "The survey of 2026-09-05 read the graph whole at graph commit 73e2a04f, and forty-five nodes carry its pin today." Counted at the graph commit this survey read, forty-five node files carry a `survey:` pin.

Also named: commons.systems/disposition-graph/clean-context-review, commons.systems/disposition-graph/frontier-consistency.

Proposed: frontier-consistency's sentence is the survivor. clean-context-review's derivation clause and review-cost's rationale are redrawn on the record as it stands: the round is the set the survey owes a reading, which since 2026-09-05 is a proper subset of the review and ruling stages, and the argument for giving it as pointers is restated on the size that set actually has rather than on a survey that has never run. The wave measurement and the pointer rule are untouched; what moves is the premise each is argued from.

### Amended after the frontier survey, 2026-09-07

The survey's finding, validated at its locus on the main thread: the rationale argued the round's size from a survey that had never run, and forty-five nodes have carried the survey's pin since 2026-09-05. The sentence now dates the forty-eight to before the first survey and gives the set's size since, twenty-five at graph commit e4c87ed0. The amended recommendation owes its re-reading, whose object is this repair.

### Clean-context re-reading, 2026-09-07, of 0afcc1f1

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `one-answer-a-node-and-one-read`.

Findings:

- In '#### Facts', the '##### answer' subsection's own `against` clause still reads verbatim: "the answer's reply, that the survey holds the whole graph and is the reader of last resort, is good only while the survey runs before every ruling; this design moves that load onto it, and as of 2026-09-05 the survey has never run once, with forty-eight nodes standing at the review or the ruling stage at graph commit 1cde11f6 and no node in the record carrying a survey pin." This is the same over-generalized premise the frontier survey's 'Frontier finding, 2026-09-07' (kind: contradiction) named against this node's rationale -- "because no survey has ever run and so no node carries a survey pin" -- which this amendment did correct in the Rationale ('at graph commit 1cde11f6 on 2026-09-05, before the first survey ran, ... because no node yet carried a survey pin; that day's survey pinned forty-five'). The identical claim in the answer fact's own `against` field was not touched by this diff (confirmed: it is unchanged context in the diff hunk, and `grep -c "survey has never run once"` on the working node file returns exactly 1, i.e. this single remaining instance). As worded, 'as of 2026-09-05 the survey has never run once' also contradicts this same node's own `review.survey` block, which already recorded a survey dated 2026-09-05 before this amendment was written. Suggested edit: apply the same correction here as in the rationale -- replace 'as of 2026-09-05 the survey has never run once' with wording scoped to the pre-survey state at graph commit 1cde11f6 (e.g. 'before the first survey ran on 2026-09-05'), matching the rationale's repaired sentence, since the specific claim about no node carrying a pin at that particular commit is itself accurate and does not need to change.

On the facts and what they recommend: Neither fact's `recommends` or `boldness` moved: `answer` still recommends `one-answer-a-node-and-one-read` (moderate) and `authority` still recommends `ratified` (moderate); the `## Recommendation` fence is unchanged. The diff adds three options to the answer fact's list: `rules-of-the-reading-named-as-files` (passed, source review/2026-09-05), which closes the previous reading's sole finding; and `a-waves-brief-is-one-brief` and `the-surveys-unreached-node-is-one-line` (both source-attributed to sibling nodes, ref 2026-09-07), each a placement candidate left un-adopted pending the author's ruling. The diff also corrects the rationale's false 'no survey has ever run' premise per the frontier survey's contradiction finding, but leaves the identical premise standing, unaddressed, in the answer fact's own `against` clause.

On the viability of the options: All prior options remain viable and none is disturbed by the diff. The three newly added options are each carried with a source, a reason or measurement, and (for the two sibling-sourced options) an explicit placement question for the author; none conflicts with what either fact currently recommends.

Strongest counter-argument (moderate): The amendment fixed the false 'no survey has ever run' premise exactly where the frontier survey's finding pointed -- the rationale paragraph -- but left the identical claim standing, word for word in substance, in the answer fact's own `against` field, which a reader meets as this node's account of the strongest case against its own recommendation. That field now contradicts both the corrected rationale beside it and this node's own review block, which recorded a survey dated 2026-09-05 before the amendment was even written. The survey's finding is therefore only partially closed, in the one place it named but not in the parallel place carrying the same error.

### Repaired after the re-reading, 2026-09-07

The re-reading's one finding, validated on the main thread: the answer fact's `against` still carried the premise the survey's finding struck from the rationale, that as of 2026-09-05 the survey had never run. The clause now dates its measurement to graph commit `1cde11f6`, before the first survey ran, and points what the survey costs to `survey-cost`; the case against is not part of the pin, so the recommendation, its pins, and the survey's pin are untouched. The reader's verdict is kickback, and the record's instrument admits no ruling stage on a kickback verdict, so the repaired node returns to review and owes a re-reading whose object is this repair; that the repair moves no pin and the cap of two readings would spare it is recorded on the reconciliation list as the instrument's gap.

### Clean-context re-reading, 2026-09-07, of 0afcc1f1 (ii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `one-answer-a-node-and-one-read`.

Findings:

- In '#### Facts', the '##### answer' subsection's `against` clause (the identical text also opens the fact's own prose paragraph, and its substance is echoed in the new '### Repaired after the re-reading, 2026-09-07' account section), the repair's rewrite ends: "...and what the survey costs once the load is on it is the question the author raised on 2026-09-07 and `survey-cost` answers beneath this node." No node named `survey-cost` exists anywhere in the record: `grep -rn "survey-cost" disposition/` returns matches only inside `disposition-graph/review-cost.md` itself (this clause and the paired account sentence, "...and points what the survey costs to `survey-cost`;"), and `grep -n "survey-cost" disposition/disposition.yaml` returns nothing. The clause asserts, in the present tense, that a node beneath this one already answers what the survey costs; no such node has been minted at graph commit 1c0b5372, so the claim is false as the record now stands. This sentence is new text introduced by this very repair -- it is the `+` line of the diff's first hunk, replacing the sentence the last reading's finding was about -- so the last reading had no chance to catch it, since it read the text this line replaced. Suggested edit: either mint `commons.systems/disposition-graph/survey-cost` before citing it here, or rephrase to state the question as still open, e.g. replace "and what the survey costs once the load is on it is the question the author raised on 2026-09-07 and `survey-cost` answers beneath this node" with "and what the survey costs once the load is on it is a further question the author raised on 2026-09-07, not yet recorded as a node of its own beneath this one." The same fix is owed to the parallel sentence in the '### Repaired after the re-reading, 2026-09-07' account section, which makes the identical present-tense claim ("points what the survey costs to `survey-cost`").

On the facts and what they recommend: The diff changes nothing about either fact's `recommends`, `boldness`, or the `## Recommendation` fence: `answer` still recommends `one-answer-a-node-and-one-read` (moderate) and `authority` still recommends `ratified` (moderate), unchanged from what the last reading pinned. The only fact-level change in this diff is a rewrite of the answer fact's `against` text, which removes the false 'as of 2026-09-05 the survey has never run once' premise the last reading flagged and rescopes the claim to the pre-survey state at graph commit 1cde11f6 -- but in doing so adds the new, itself-false 'survey-cost' citation this reading raises above. The `review` block's verdict, strength, `of`, `commit`, and `against` were also updated to record the last reading's own kickback verdict and counter-argument, which is bookkeeping and not a change to what the node recommends.

On the viability of the options: The diff adds and removes no options on either fact; every option already on the answer and authority facts (including the three added before this pin -- `rules-of-the-reading-named-as-files`, `a-waves-brief-is-one-brief`, and `the-surveys-unreached-node-is-one-line` -- none of which this diff touches) remains exactly as before and stays viable.

Strongest counter-argument (moderate): Read narrowly against only the last reading's own finding, the amendment fully answers it: the rewritten `against` clause removes exactly the phrase flagged ("as of 2026-09-05 the survey has never run once") and rescopes the claim to the pre-survey state at graph commit 1cde11f6, tracking the suggested edit almost verbatim, and the rationale's parallel fix (made in an earlier round, before this pin) is untouched and still correct. The `survey-cost` citation this reading raises is a different defect, introduced in the course of answering the first one, and not a failure to answer what the last reading actually asked; a reader could reasonably treat it as a minor forward-reference to work the author has already commissioned (the 2026-09-07 disposition asks for exactly this kind of follow-on question) rather than as a fabrication, and record it as an option on the fact instead of a kickback. Against that: the sentence is written as a present-tense fact about the record's current shape, not as a stated intention, and a reader who takes it at face value is told something false about what has already been answered.

The session's reply: Validated on the main thread: the repair named `survey-cost`, the working name of the node the design unit was drafting, which the design named `survey-selection` and which did not exist at 1c0b5372. The clause is corrected with the amendment that records that node beneath this one.

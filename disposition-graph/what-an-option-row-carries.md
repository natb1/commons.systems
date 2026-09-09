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
        supports:
          - words/2026-09-04/45
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
        status: passed
        reason: "it is `ai-case-against-on-the-row` for the interval before a reading returns and no further, so it names the same arrangement with a narrower reach, and the choice the author has between the AI's line and the reader's is put plainly by that option instead"
      - name: no-mark-where-no-line
        source: review
        ref: "2026-09-07"
      - name: a-term-is-its-own-sentence
        source: commons.systems/disposition-graph/vocabulary-option-summary
        ref: "2026-09-07"
      - name: the-details-carry-the-three-accumulations
        source: commons.systems/disposition-graph/dialogue
        ref: "2026-09-07"
        supports:
          - words/2026-09-06/2
          - words/2026-09-06/3
          - words/2026-09-07/2
          - words/2026-09-07/3
          - words/2026-09-07/4
        diverges:
          - words/2026-09-08/36
      - name: five-marks-and-the-two-the-author-added
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/39
      - name: names-on-the-row-stances-in-a-companion
        source: commons.systems/disposition-graph/cjeu-secret-deliberation
        ref: "2026-09-09"
    recommends: five-marks-and-the-two-the-author-added
    boldness: moderate
    against: "The record asks the AI for a case against every recommendation — `dialogue`'s recommended text makes a fact's `against` the argument the recommendation had to beat, written when the recommendation is recorded — and under this answer the author never sees it at the level they read: on every fact of every node but one, the row carries a mark saying no reader's line bears and the AI's written objection, where one exists, sits behind a fold, because a reading returns one counter-argument for a node and `caseAgainst` substitutes it on the answer fact alone. The rule is mostly unmet today, 53 fact-level `against` fields beside 247 recommendations at this head, so on most rows the mark replaces nothing yet; that is back-fill debt against the rule, as `dialogue`'s own account records, and not a reason the rule will stay unmet, so what the fold hides grows as the debt is paid. The arrangement this answer forbids, the AI's line at the first level, is the only one under which an objection the record holds is always where the author reads. The tradition survey of 2026-09-09 weakened this argument in one direction and hardened it in three, and both go here. Weakened: no tradition it surveyed offers a measured finding about how many marks a row can carry, and the survey says so expressly rather than supplying one; every measurement it returned is about a practice being abandoned and none is about density, so the argument above rests on judgment and is not evidence-backed, which the record states rather than letting seven cited traditions imply otherwise. Hardened, from three directions that all land on the two marks the author's enumeration added. `cjeu-secret-deliberation` finds that the arrangement which has held this line longest publishes who deliberated and refuses to publish who held what, on the stated ground that a reader who can see which party chose which option reads the decision through the personnel instead of through the reasons; it is the only reading of the seven that produced an option this fact did not carry, `names-on-the-row-stances-in-a-companion`, and it names the precondition that option has not met, since the tradition relocates the losing reasoning into a companion an office is obliged to write and this record has no such office. `nygard-adr-proposed-status` finds that the tradition the author's own criterion invokes holds exactly one status value at a time, so it licenses the retention this answer keeps and licenses no row of parallel marks, and that an ADR criterion cannot reach the presentation question at all, the form never having put two statuses on one line. `festo-surrendered-subject-matter` finds that a recorded position by a named party becomes a boundary that party must argue their way out of, and that the tradition's remedy is to say who bears the burden of lifting one; this answer mints two such marks and no instrument for lifting either, and cannot presently encode the first of them at all. Against those, `eduyot-minority-opinion` supports attribution with the tally withheld and carries R. Judah's counter, that the minority is recorded in order to be set aside, on which the indispensable mark is the one saying a view does not act: of the marks this answer carries, three say who chose an option and none says an option was passed over. That last diverges from the author's own cut of 2026-09-04 and not from an AI's choice, and it reaches the author in that form."
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
  verdict: forward
  strength: weak
  date: 2026-09-09
  of: 1e0b37a2b7f2c4faebb8bf0d5feb9535b830af8e
  commit: 7663ad04b910a3cbef62c4bd2bbbceba3daa8cfb
  against: "The amendment's own new prose leans on claims about sibling and freshly-minted nodes -- `viable-options`, `deferring-on-a-probe`, `expert-instructions`, `movements`, and `what-acts-during-bootstrap` -- that this delta's scope cannot check, in the same way `a-term-is-its-own-sentence`'s '134 nodes' claim could not be checked at the last reading; none is a false statement, a broken pin, or a contradiction this node's own text shows, so by the standard the last reading itself applied these are gaps for the neighbourhood to close rather than defects in the amendment. Separately, the previous reading's own finding about `a-term-is-its-own-sentence` remains open -- neither the 2026-09-08 amendment nor the 2026-09-07 survey touched it -- so it is carried forward rather than closed by this round. And the frontier survey's vocabulary finding, which quotes this node twice for a 'reader' sense that collides with the agent sense, is not yet answered either, though the fix it proposes is recorded as an unruled option on `review-cost`'s own answer fact and so is not yet this node's to make on its own."
  survey:
    date: 2026-09-09
    of: 1e0b37a2b7f2c4faebb8bf0d5feb9535b830af8e
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "0ac548d22006fec806b8fea188722d1ebca28a6fb5025222518f708b148d79de"
      answer: "43ad20eb370e5308f6750ab4f90b97294d8cbd3b28897db7a46360aa60e3726d"
      options: "3b9cd9a592c53902c8487456a09d0c6740f0e6bfd739b57b46d03afc9a429e93"
      rivals: "94c6745f2a7e18ede31460e048c21dd36a47f513b27ea2e9054219624f3d84cf"
      words: "586d187119b9c800cd54238215d22decd9f9f93d383f21308ac62efb8d7c4f95"
    findings:
      - finding: "No node answers how an author's choice short of a confirmation is written, and three depend on there being one. The reading `festo-surrendered-subject-matter` states it: \"The node's own text records that the record cannot presently encode the first of them at all, `recording`'s ruling responses being `confirm` and `edit`, neither of which writes a choice made and not confirmed. So on the recommendation as it stands there is a mark with no producer and no retraction, on a row the machinery reads.\" `what-an-option-row-carries` recommends `five-marks-and-the-two-the-author-added` and `viable-options` recommends `an-option-carries-a-selection-per-party`, both of which put the mark on a row; `what-acts-during-bootstrap`'s rule text makes the unconfirmed choice the first term of the convergence reconciliation acts on and concedes that the clause \"states a rule whose encoding is owed\". None of the twenty-eight options on `recording`'s answer fact adds a response that writes one."
        kind: "coverage"
        status: "new"
        since: "2026-09-09"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/what-an-option-row-carries"
          - "commons.systems/disposition-graph/viable-options"
          - "commons.systems/disposition-graph/recording"
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
    pairs:
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "words:words/2026-09-06/2"
          - "words:words/2026-09-06/3"
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/alignment-target"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/anchoring-and-adjustment"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "words:words/2026-09-08/39"
          - "cites"
      - with: "commons.systems/disposition-graph/authors-words-on-the-page"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/bentham-publicity"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/chenery-reasoned-decision"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/cjeu-secret-deliberation"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/deferring-on-a-probe"
        keys:
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/design-rationale-capture-disparity"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "words:words/2026-09-08/36"
          - "cites"
      - with: "commons.systems/disposition-graph/eduyot-minority-opinion"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/expert-identity"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/expert-instructions"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/festo-surrendered-subject-matter"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/hansard-verbatim-record"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/how-a-fact-is-headed"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/lessons-learned-harvest-gap"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/master-detail-selection"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/montgomery-informed-consent"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/movements"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/nielsen-user-control-and-freedom"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/non-liquet"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/none-of-the-above-ballot"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/not-proven-third-verdict"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/nygard-adr-proposed-status"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/persistence"
        keys:
          - "term:disposition ref (defines: commons.systems/disposition-graph/persistence)"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/probe-response-treatment"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/progressive-disclosure"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
          - "cites"
      - with: "commons.systems/disposition-graph/qoc-design-space-analysis"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "words:words/2026-09-07/4"
          - "cites"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "words:words/2026-09-07/4"
          - "cites"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/review-cost"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "cites"
      - with: "commons.systems/disposition-graph/roberts-rules-commit-or-refer"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/round-termination"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/ruling-transport"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/scholastic-articulus"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/session-state"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/standard-report"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/unconfirmed-accumulation"
        keys:
          - "term:accumulation (defines: commons.systems/disposition-graph/unconfirmed-accumulation)"
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
      - with: "commons.systems/disposition-graph/unreached-traditions"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "words:words/2026-09-07/2"
          - "words:words/2026-09-07/3"
          - "words:words/2026-09-07/4"
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
          - "cites"
      - with: "commons.systems/disposition-graph/vocabulary-option-summary"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/when-the-kickback-feedback-shows"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/where-a-change-request-goes"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/disposition-graph/where-the-unconfirmed-indication-goes"
        keys:
          - "words:words/2026-09-06/3"
          - "parent:commons.systems/disposition-graph/alignment-page"
          - "depends"
      - with: "commons.systems/disposition-graph/which-facts-are-listed"
        keys:
          - "parent:commons.systems/disposition-graph/alignment-page"
      - with: "commons.systems/public/agency"
        keys:
          - "cites"
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/where-the-unconfirmed-indication-goes
---

## Facts

### answer

`five-marks-and-the-two-the-author-added` is recommended since 2026-09-08: it is `the-details-carry-the-three-accumulations` with the author's own enumeration of the marks at `words/2026-09-08/39` in place of the record's three, which adds the author's unconfirmed choice and the choice of a convened expert and strikes nothing. Its own support and divergence are under its subsection. The boldness does not fall on the author's enumeration, because the `against` on this fact is an argument about what the row's density hides and this amendment adds two marks to the row; the enumeration settles which marks belong and not whether the row can carry them.

`the-details-carry-the-three-accumulations` was recommended from 2026-09-07 until then: it is `three-marks-and-the-case-against` with the confirmed mark read as the derived label and the expanded details given their three accumulations and the preview beneath them, on the author's refinement of that day, which is in the ledger on the disposition ref and referenced by the option it bears on. The first level was unchanged by it. What follows is the reason the text those two amend was recommended on, which both amendments carry except where they say otherwise.

`three-marks-and-the-case-against` was recommended because every settlement on it is the author's words applied where
they fall, except one clause, which is the readings' and is named as theirs. The
three marks are the author's list of 2026-09-04 with their answer of 2026-09-06
in place of the chip it discharges. The merge of the standing and ruled marks is
not a design choice but a consequence of the rule the reader of the graph
enforces, that on the answer fact the ruled option is the option that stands.
Whether the node is confirmed leaves the row because it is a fact about the node,
and where it goes is `where-the-unconfirmed-indication-goes`'.

What rests on the AI is the mark that stands where no reader's line bears, the
choice to collapse into it the two ways that can happen, and the judgment that
the row needs the mark at all. The last is what `no-mark-where-no-line` contests
and it is argued rather than assumed. The stage chip says whether the node's
readings have run; the mark says whether a reader's line bears on this fact,
which is a different fact and is the one the author is about to choose on. A
reader weighing two rows of the same fact against each other should not have to
leave the row to learn that nothing has been said against either, and a blank
where an argument would be reads as a recommendation nobody has objected to
rather than as one nobody has checked — the confusion `recording`'s rule that
"when the review found no strong counter-argument, the recommendation goes alone
and says so" exists to prevent. Against that, the mark is one fact said as many
times as the node has facts, which is what `codd-update-anomaly` names and what
this answer's own merge of the standing and ruled marks refuses elsewhere; the
difference is that the merged marks were two names for one row's state and this
is the same state on rows the reader meets one at a time. Boldness moderate, and
the cardinality is why: with one counter-argument per node, most rows of most
nodes carry the mark rather than a line, and whether that is right depends on
`counter-argument-per-fact` on `clean-context-review`, which this answer does not
own.

#### three-marks-and-the-case-against

A row leads with what the option would answer, in the sentence the record holds
for it, and carries the option's name nowhere.

**AI support.** The author's layout words of 2026-09-04 carry the row's whole shape: "For each
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

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

A row leads with what the option would answer, in the sentence the record holds
for it, and carries the option's name nowhere. Every option has such a sentence:
the parent's clause requires one and has the page supply the two kinds the node
does not write, a vocabulary fact's options and the option that stands. Where the
record holds none for one yet, the row falls back to the bare name, and that
fallback is the projector's defence against incomplete data rather than a form
this answer or the parent provides for — `renderOption` writes a `choicename`
span where the record yields no sentence, in
`packages/disposition/project.mjs` — so a bare name on the page is a
record not yet written and a defect to be found. The name also stays in the row's
markup, where a ruling is staged from it.

Beside that sentence the row carries three status marks and no others. That the
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
marked passed over with the clause saying why, in the gloss `viable-options`
recommends for that status and not in the projector's own words — a gloss its
standing `defines` does not yet carry, so the projection of it is owed with that
node's answer and is not this ruling's to find already made; and, where a ruling
stands on it, the reason the author gave and the pin the ruling answered. The
author's words send the passed-over status down by name, and the source goes with
it as the same kind of thing, an account of how the option came to be on the list
rather than what a reader chooses by. What that costs is stated rather than
argued away: an option the author put on the table is no longer distinguishable
at a glance from one the AI invented.

On the recommended option's row of each fact, and on no other row, one line
against the recommendation, and the AI never writes it. The author's words move
the AI's reasoning to the details "not in a chip", and the AI's own case against
is the AI's reasoning however it is set, so it goes down on every fact, with no
exception. Where it goes is the recommended option's drill-down: the case against
is a fact's line and a drill-down is an option's, and the recommended option's is
the one it belongs to, being the argument that option had to beat. It appears
there as text, beside the source and the passed-over clause, and not as a pill
re-declared one level down, since "not in a chip" reaches the thing wherever it
is set. What stands in its place at the first level is the counter-argument the
clean-context review returned for that fact, with the strength that reading gave
it. That is not the recommending party's reasoning, and the record already draws
the line there: `alignment-page` says "that counter-argument is the line and
carries the strength the review gave it", and `scholastic-articulus` says that
here "the case against the recommended option is written by the party that
recommends, so the guarantee is gone and what stands in its place is the
clean-context review, whose counter-argument replaces the AI's own on the row
when the review returns one". That reading is cited for that and for no more. Its
substitution is conditioned on a returned line, and it closes by saying the
substitution "is weaker than the tradition's guarantee and the record should not
pretend otherwise", so it licenses nothing at all for the case where no reader's
line bears, which is the case the next paragraph settles.

Where no reader's line bears on a fact the row carries, in the line's place, one
mark saying so, and no argument. The two ways that happens — no reading has run
on the node, and a reading ran and returned nothing for that fact — are one fact
about the row, and a reader cannot tell them apart by looking. Collapsing them is
what makes the row legible without knowing the node's stage, and it keeps this
answer out of a question that is not its own: whether a recommendation with no
reader's line beside it may be called unopposed is `recording`'s, where the
conflict between that node's rule and `dialogue`'s requirement of an `against` on
every recommendation is recorded.

What that costs, stated and not hidden: a reading returns one counter-argument
for a node, and `caseAgainst` substitutes it on the answer fact alone, so on
every other fact of every node the row carries the mark and the AI's written
objection is one step down. Whether a reading should return one line per fact is
`clean-context-review`'s question, recorded there as `counter-argument-per-fact`.
It is also a divergence from two readings, recorded here rather than absorbed.
`hansard-verbatim-record` holds of this very line that it "illustrates the
argument, so by this standard it cannot be edited out" of the first level, and
this answer edits it out of the first level on every fact. And
`scholastic-articulus` licenses the substitution of the reader's line for the
AI's only "when the review returns one", warning that even there it "is weaker
than the tradition's guarantee": for the case where no reader's line bears it
says nothing, so the mark that stands in that case departs from it rather than
applying it. The option `ai-case-against-on-the-row` is the side both traditions
take, and each divergence is carried on that reading's own `bears` entry as well
as here.

What leaves the row entirely is whether the node's text has been confirmed. That
is a fact about the node and not a status of one option among several, so it is
not a row's business; where the page says it instead is
`where-the-unconfirmed-indication-goes`, named in `depends`, and this answer
settles only that the row does not carry it.
```

#### case-against-to-the-details

Everything the recommended option says, with no line at the first level at all:
the reader's counter-argument goes down with the AI's, and the row carries the
sentence, the marks and the tradition chips and nothing else. This is the
author's placement read at its widest, and their words are twice on its side.
What it costs is that the first level of every fact carries a recommendation and
no objection to it, which is the anchoring the parent's own paragraph exists to
prevent.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with no line at the first level at all:
the reader's counter-argument goes down with the AI's, and the row carries the
sentence, the marks and the tradition chips and nothing else. This is the
author's placement read at its widest, and their words are twice on its side.
What it costs is that the first level of every fact carries a recommendation and
no objection to it, which is the anchoring the parent's own paragraph exists to
prevent.
```

#### ai-case-against-on-the-row

Everything the recommended option says, with the line at the first level written
by the AI rather than by the reader: the AI's own case against, in one line, at
full strength, on the recommended option's row, giving way to the reader's
counter-argument where one has been returned. It is the only option under which
an objection the record holds is always at the level the author reads, on every
fact of every node, which is the fact's own `against` and is
`hansard-verbatim-record`'s side of the divergence recorded above.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it:
the author placed the AI's reasoning in the details twice, and `scholastic-
articulus` holds that an objection written by the recommending party has lost the
guarantee the tradition gave it.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the line at the first level written
by the AI rather than by the reader: the AI's own case against, in one line, at
full strength, on the recommended option's row, giving way to the reader's
counter-argument where one has been returned. It is the only option under which
an objection the record holds is always at the level the author reads, on every
fact of every node, which is the fact's own `against` and is
`hansard-verbatim-record`'s side of the divergence recorded above.
```

#### keep-the-four-pills

Everything the recommended option says, with the row keeping `alt-src`,
`alt-stands`, `alt-ruled` and `alt-passed` at the first level, which is what the
page renders today. Passed over: it is the reading the parent withdrew on
2026-09-05 as a misreading of its own fence, and it keeps at the first level the
three pills the author's words name as not useful. It survives on the list so
that what the page does is refused in the open rather than by silence.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the row keeping `alt-src`,
`alt-stands`, `alt-ruled` and `alt-passed` at the first level, which is what the
page renders today. Passed over: it is the reading the parent withdrew on
2026-09-05 as a misreading of its own fence, and it keeps at the first level the
three pills the author's words name as not useful. It survives on the list so
that what the page does is refused in the open rather than by silence.
```

#### confirmed-mark-struck

Everything the recommended option says, with no status mark of any kind on the
row: the confirmed choice is shown first, as `dialogue` orders the options, and
the page says nothing more. Passed over: that node requires a projection to say
the confirmed choice keeps its authority, and position alone cannot say it,
cannot distinguish the confirmed choice from an option ordered first by chance,
and leaves the author unable to find their own prior ruling.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with no status mark of any kind on the
row: the confirmed choice is shown first, as `dialogue` orders the options, and
the page says nothing more. Passed over: that node requires a projection to say
the confirmed choice keeps its authority, and position alone cannot say it,
cannot distinguish the confirmed choice from an option ordered first by chance,
and leaves the author unable to find their own prior ruling.
```

#### stands-and-ruled-as-two-marks

Everything the recommended option says, with the redefined standing mark and the
ruled mark staying separate: one says the option's text is the node's answer, the
other that the author ruled for it. Viable and not adopted. It is the reading
that survives if the reader's rule that the ruled option is the option that
stands is ever relaxed; against it, on the answer fact today the two are the same
option by that rule, so two marks would be one fact said twice on one row.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the redefined standing mark and the
ruled mark staying separate: one says the option's text is the node's answer, the
other that the author ruled for it. Viable and not adopted. It is the reading
that survives if the reader's rule that the ruled option is the option that
stands is ever relaxed; against it, on the answer fact today the two are the same
option by that rule, so two marks would be one fact said twice on one row.
```

#### source-stays-on-the-row

Everything the recommended option says, with `alt-src` staying at the first
level: where an option came from is arguably what a chooser needs and not what a
checker needs, an option the author put on the table being a different kind of
candidate from one the AI invented. Viable and not adopted: the author's words
name three things the row keeps and this is not among them, and the author's own
words behind an option are in that option's drill-down already, where they are
the thing itself rather than a phrase about it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with `alt-src` staying at the first
level: where an option came from is arguably what a chooser needs and not what a
checker needs, an option the author put on the table being a different kind of
candidate from one the AI invented. Viable and not adopted: the author's words
name three things the row keeps and this is not among them, and the author's own
words behind an option are in that option's drill-down already, where they are
the thing itself rather than a phrase about it.
```

#### unread-mark-where-no-reading-has-run

The mark appears only where no reading has run, and a fact whose reading returned
nothing carries something else. Passed over: the answer collapses the two cases
deliberately, and this option is the half of the recommendation that would be
left if it did not, so it names no choice the author can make against the
recommendation as a whole.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

The mark appears only where no reading has run, and a fact whose reading returned
nothing carries something else. Passed over: the answer collapses the two cases
deliberately, and this option is the half of the recommendation that would be
left if it did not, so it names no choice the author can make against the
recommendation as a whole.
```

#### ai-line-until-a-reading-returns

Everything the recommended option says, with the AI's own case against standing at
the first level on any fact whose reading has not yet returned, and giving way to
the reader's line when one arrives. Passed over: it is
`ai-case-against-on-the-row` for the interval before a reading returns and no
further, so it names the same arrangement with a narrower reach, and the choice
the author has between the AI's line and the reader's is put plainly by that
option instead.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the AI's own case against standing at
the first level on any fact whose reading has not yet returned, and giving way to
the reader's line when one arrives. Passed over: it is
`ai-case-against-on-the-row` for the interval before a reading returns and no
further, so it names the same arrangement with a narrower reach, and the choice
the author has between the AI's line and the reader's is put plainly by that
option instead.
```

#### no-mark-where-no-line

Everything the recommended option says, with no mark on the row where no reader's
line bears on the fact: the row carries the sentence, the three status marks, the
tradition chips, and the reader's counter-argument where one bears, and nothing
at all where none does. Whether a node's recommendations have been read is a fact
about the node and not a status of one option, the stage chip already carries the
two readings' readiness, and the absence of a line already says what the mark
would say, so a mark repeated on every row of every fact is one fact said as many
times as the node has facts, which is what `codd-update-anomaly` warns of and
what this answer's own merge of the standing and ruled marks refuses. Viable and
not adopted: a reader choosing on a row would have to leave it for the chip to
know whether anything has been said against the recommendation, and an absence
where an argument would be reads as an absence of anything to say rather than as
an absence of a reader, which is the legibility the recommended option buys with
the mark.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with no mark on the row where no reader's
line bears on the fact: the row carries the sentence, the three status marks, the
tradition chips, and the reader's counter-argument where one bears, and nothing
at all where none does. Whether a node's recommendations have been read is a fact
about the node and not a status of one option, the stage chip already carries the
two readings' readiness, and the absence of a line already says what the mark
would say, so a mark repeated on every row of every fact is one fact said as many
times as the node has facts, which is what `codd-update-anomaly` warns of and
what this answer's own merge of the standing and ruled marks refuses. Viable and
not adopted: a reader choosing on a row would have to leave it for the chip to
know whether anything has been said against the recommendation, and an absence
where an argument would be reads as an absence of anything to say rather than as
an absence of a reader, which is the legibility the recommended option buys with
the mark.
```

#### a-term-is-its-own-sentence

Everything the recommended option says, with one exception written into the two
clauses that would otherwise forbid it. This answer holds that a row "carries the
option's name nowhere", on the reason the parent gives, "the name is how a ruling
is stored and the sentence is the decision, and the author's words of 2026-09-04
strike the id-shaped string from the row"; and it holds that where the record
holds no sentence "the row falls back to the bare name ... so a bare name on the
page is a record not yet written and a defect to be found". On the two facts
whose options are the record's own vocabulary, `authority` and `topology`,
neither reaches. The option's name there is not an id-shaped slug but a term the
record defines, so the sentence the record holds for it and its name are the same
string: leading with the term is leading with what the record holds. And it is
not the fallback, which is what the projector prints where the record holds
nothing, since here the record holds the term and its gloss both. Raised by
`commons.systems/disposition-graph/vocabulary-option-summary`, whose recommended
answer leads a vocabulary row with the term and puts the gloss one step down, and
which would otherwise print on three rows of every node carrying the authority
fact a lead this answer's own words call a defect to be found. Under
this option those two clauses say what they mean for a per-node fact and say what
a vocabulary fact does instead; nothing else in the answer changes.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an option's row carry at the first level?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with one exception written into the two
clauses that would otherwise forbid it. This answer holds that a row "carries the
option's name nowhere", on the reason the parent gives, "the name is how a ruling
is stored and the sentence is the decision, and the author's words of 2026-09-04
strike the id-shaped string from the row"; and it holds that where the record
holds no sentence "the row falls back to the bare name ... so a bare name on the
page is a record not yet written and a defect to be found". On the two facts
whose options are the record's own vocabulary, `authority` and `topology`,
neither reaches. The option's name there is not an id-shaped slug but a term the
record defines, so the sentence the record holds for it and its name are the same
string: leading with the term is leading with what the record holds. And it is
not the fallback, which is what the projector prints where the record holds
nothing, since here the record holds the term and its gloss both. Raised by
`commons.systems/disposition-graph/vocabulary-option-summary`, whose recommended
answer leads a vocabulary row with the term and puts the gloss one step down, and
which would otherwise print on three rows of every node carrying the authority
fact a lead this answer's own words call a defect to be found. Under
this option those two clauses say what they mean for a per-node fact and say what
a vocabulary fact does instead; nothing else in the answer changes.
```

#### the-details-carry-the-three-accumulations

The row's three marks are unchanged, the confirmed mark being the derived label on the option last ruled confirm; the expanded details carry three accumulations and no more, the author's words each way as one quotation, the traditions' from the readings, and the AI's support and divergence whether or not the fact recommends the option, and beneath them the node as it would stand under this option, which the context pane previews when the option is selected.

**AI support.** The author's refinement of 2026-09-07 names the expanded details' contents, before and after confirmation; the row's first level is unchanged, so the marks this answer settled stay settled and only the drill-down grows. The preview beneath the details is what makes the context pane's preview and the details one thing, resolved from the same content.

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

**AI divergence.** Three accumulations in a drill-down is the most the details have carried, and where an option has been argued across many sittings the AI's accumulated divergence alone can be longer than the answer, so the details need the order this answer gives them and a projection that folds each accumulation closed by default.

The record asks the AI for a case against every recommendation — `dialogue`'s recommended text makes a fact's `against` the argument the recommendation had to beat, written when the recommendation is recorded — and under this answer the author never sees it at the level they read: on every fact of every node but one, the row carries a mark saying no reader's line bears and the AI's written objection, where one exists, sits behind a fold, because a reading returns one counter-argument for a node and `caseAgainst` substitutes it on the answer fact alone. The rule is mostly unmet today, 53 fact-level `against` fields beside 247 recommendations at this head, so on most rows the mark replaces nothing yet; that is back-fill debt against the rule, as `dialogue`'s own account records, and not a reason the rule will stay unmet, so what the fold hides grows as the debt is paid. The arrangement this answer forbids, the AI's line at the first level, is the only one under which an objection the record holds is always where the author reads.

**Content.**

From: three-marks-and-the-case-against

```diff
@@ -4,7 +4,6 @@
 under:
   - commons.systems/disposition-graph/alignment-page
 ---
-
 ## Answer
 
 A row leads with what the option would answer, in the sentence the record holds
@@ -19,11 +18,7 @@
 record not yet written and a defect to be found. The name also stays in the row's
 markup, where a ruling is staged from it.
 
-Beside that sentence the row carries three status marks and no others. That the
-recommendation adopts it, with its boldness. For each reading that bears on it,
-whether the tradition supports it or departs from it, by the reading's name. And,
-where the author has ruled for it, that it is the confirmed disposition and keeps
-its authority until the author rules for another, with the response and the date.
+Beside that sentence the row carries three status marks and no others. That the recommendation adopts it, with its boldness. For each reading that bears on it, whether the tradition supports it or departs from it, by the reading's name. And, where the author has ruled for it with the response confirm, that it is the confirmed disposition, marked confirmed where it is the last so ruled on this fact, and keeps its authority until the author rules for another, with the response and the date. The row's expanded details carry three accumulations and no more, at every stage and before and after any confirmation: the author's words, the entries the option references, each marked support or divergence and shown as one quotation concatenated in date order; the traditions', projected from the readings that bear on the option, each marked the same way; and the AI's accumulated support and divergence, shown whether or not the fact recommends the option. Beneath them, the node as it would stand under this option, resolved from the option's content, which the page previews in the context pane when the option is selected.
 The first two are the author's words of 2026-09-04. The third is what their
 answer of 2026-09-06 puts where the `stands` chip was: a mark records the prior
 confirmed disposition, if any, so it appears on an option the author has ruled
```

#### five-marks-and-the-two-the-author-added

The recommendation with the author's own enumeration of the marks in place of the
record's three. Two of the five it names are not on the row at all today: the
author's choice where they have chosen and not confirmed, and the choice of an
expert convened on the fact. The other three are the record's three under other
names, so this option adds and strikes nothing.

**AI support.** It is the author's, at `words/2026-09-08/39`: "Each option may be
marked as either author confirmed, author choice (not confirmed), AI recommended,
supported by tradition X, and/or choice of expert Y." The mapping is exact for
three of them. "AI recommended" is what the fact's `recommends` already writes
with its boldness; "supported by tradition X" is the `bears` relation seen from
the option's side, which the row already carries per reading and marked support or
divergence; and "author confirmed" is the confirmed mark this option leaves
exactly as it stands, one mark and not two, for the reason the answer already
gives.

The fourth is the mark the rest of the record has been reaching for and has had
nowhere to put. `viable-options` already describes it in its own answer, the
option the author has selected without confirming, where there is one, marked
selected. `deferring-on-a-probe` produces one on every deferral it receives, since
what a deferral sets is the author's choice and expressly not a confirmation, and
that node's own account says the record has nowhere to put it.
`what-acts-during-bootstrap` makes it a term of the rule that governs every
reconciliation this record does today, because bootstrap reconciliation acts on
the convergence of the author's choice with the AI's recommendation and the
author's choice is the first of those two terms. Against all three of them,
`recording`'s ruling responses are `confirm` and `edit`, and neither records a
choice the author has made and not confirmed. So the mark has been describable,
required, and unrecordable at once. That is the strongest reason for this
amendment and it is not a reason about a row on a page: a convergence whose first
term the record cannot exhibit is a convergence nobody can check, and what goes
unchecked is the AI's own recommendation, which
`delegation-bounds-and-sizing` calls the one thing the alignment interview exists
to check.

The fifth is the expert's, and the author's parenthesis in the same sentence fixes
its shape: bootstrap reconciliation "integrates expert choice, though expert
consensus is not required". Not required means the marks do not aggregate. One
mark per expert that chose the option, by that expert's name, and no tally,
because a count on a row reads as a vote and the author has said there is no vote.
That the record cannot yet convene an expert is not an argument against the mark:
`expert-instructions` stands at the periagogic stage and `movements` at the
maieutic, both carrying a ruling of deferred on their authority fact from the same
entry, and a row schema with no place for what they produce would have to be
amended the moment they are answered.

**AI divergence.** Five marks is close to the limit of what a row carries before it
stops being read, and the answer's own argument for sending `source` and `passed`
down a level was exactly that. Two of the five have no producer today, so on this
record every row would carry three marks and two absences, and a structural
absence reads on the page the same as a defect. The reply is that both new marks
are load-bearing for rules the record has already written down, and a schema that
omits what its own rules require is not smaller, only later; but the reply does not
dispose of the density objection, which stands and is the reason the boldness on
this fact does not fall.

**Content.**

From: the-details-carry-the-three-accumulations

```diff
@@ -18,7 +18,9 @@
 record not yet written and a defect to be found. The name also stays in the row's
 markup, where a ruling is staged from it.
 
-Beside that sentence the row carries three status marks and no others. That the recommendation adopts it, with its boldness. For each reading that bears on it, whether the tradition supports it or departs from it, by the reading's name. And, where the author has ruled for it with the response confirm, that it is the confirmed disposition, marked confirmed where it is the last so ruled on this fact, and keeps its authority until the author rules for another, with the response and the date. The row's expanded details carry three accumulations and no more, at every stage and before and after any confirmation: the author's words, the entries the option references, each marked support or divergence and shown as one quotation concatenated in date order; the traditions', projected from the readings that bear on the option, each marked the same way; and the AI's accumulated support and divergence, shown whether or not the fact recommends the option. Beneath them, the node as it would stand under this option, resolved from the option's content, which the page previews in the context pane when the option is selected.
+Beside that sentence the row carries five status marks and no others, which are the five the author enumerated at `words/2026-09-08/39`. That the recommendation adopts it, with its boldness. For each reading that bears on it, whether the tradition supports it or departs from it, by the reading's name. Where the author has ruled for it with the response confirm, that it is the confirmed disposition, marked confirmed where it is the last so ruled on this fact, and keeps its authority until the author rules for another, with the response and the date. Where the author has chosen it and not confirmed it, that it is the author's choice, marked unconfirmed in the same breath, since this is the one mark on the row that would do harm by being mistaken for the mark above it, and the author wrote the qualification into their own name for it. And where an expert convened on the fact chose it, that the expert chose it, by that expert's name, one mark per expert and no tally, because the author's rule integrates expert choice without requiring expert consensus, and a count on a row reads as a vote where there is none.
+
+The fourth mark and the fifth are new here and the first three are the record's own, renamed by the author's enumeration and not moved by it. The fourth is the one the rest of the record has been reaching for with nowhere to put it: `viable-options` describes it in its own answer, the option the author has selected without confirming, marked selected; `deferring-on-a-probe` produces one on every deferral it receives, since what a deferral sets is the author's choice and expressly not a confirmation; and `what-acts-during-bootstrap` makes it a term of the rule that governs every reconciliation this record does today. Against all three, `recording`'s ruling responses are `confirm` and `edit`, and neither records a choice made and not confirmed, so an amendment there is owed with this one and is named rather than assumed. Until it lands, a convergence whose first term the record cannot exhibit is a convergence nobody can check. The row's expanded details carry three accumulations and no more, at every stage and before and after any confirmation: the author's words, the entries the option references, each marked support or divergence and shown as one quotation concatenated in date order; the traditions', projected from the readings that bear on the option, each marked the same way; and the AI's accumulated support and divergence, shown whether or not the fact recommends the option. Beneath them, the node as it would stand under this option, resolved from the option's content, which the page previews in the context pane when the option is selected.
 The first two are the author's words of 2026-09-04. The third is what their
 answer of 2026-09-06 puts where the `stands` chip was: a mark records the prior
 confirmed disposition, if any, so it appears on an option the author has ruled
```

#### names-on-the-row-stances-in-a-companion

The recommendation's marks, with the two the author's enumeration adds kept on the
fact and taken off the option's row: the parties who took a position are named, which
option each of them chose is not, and each party's reasoning is published beside the
fact in a note signed by them and binding nothing.

**AI support.** Raised by the reading `cjeu-secret-deliberation` from the tradition
survey of 2026-09-09, which found it the strongest counter to the recommendation and
a design this fact did not carry. The tradition already does the part this record
wants, publishing who deliberated, and stops one step short on a ground this record's
own purpose makes serious: a reader who can see which party chose which option reads
the decision through the personnel instead of through the reasons, and a record whose
purpose is the author's explicit intent rather than their impression is exactly the
record that cannot afford to be read that way. It keeps what the marks were for by
relocating it rather than suppressing it, which is why this stands beside the
recommendation as an option and not as a strike against it.

**AI divergence.** It costs the author the thing marks (2) and (5) were asked for.
The convergence `what-acts-during-bootstrap` makes bootstrap reconciliation act on is
a convergence of the author's choice with the AI's recommendation, and a reader who
must open a companion note to find the author's choice cannot see that convergence on
the row where the ruling is staged. The tradition pays for its restraint with an
institution this record does not have, an Advocate General whose submissions are
published as a matter of course, so the reasoning is reliably somewhere even when the
stances are nowhere; here the companion note has no such producer, and a relocation
whose destination nobody writes is a suppression under another name.

**Content.**

From: five-marks-and-the-two-the-author-added

```diff
@@ -18,9 +18,11 @@
 record not yet written and a defect to be found. The name also stays in the row's
 markup, where a ruling is staged from it.
 
-Beside that sentence the row carries five status marks and no others, which are the five the author enumerated at `words/2026-09-08/39`. That the recommendation adopts it, with its boldness. For each reading that bears on it, whether the tradition supports it or departs from it, by the reading's name. Where the author has ruled for it with the response confirm, that it is the confirmed disposition, marked confirmed where it is the last so ruled on this fact, and keeps its authority until the author rules for another, with the response and the date. Where the author has chosen it and not confirmed it, that it is the author's choice, marked unconfirmed in the same breath, since this is the one mark on the row that would do harm by being mistaken for the mark above it, and the author wrote the qualification into their own name for it. And where an expert convened on the fact chose it, that the expert chose it, by that expert's name, one mark per expert and no tally, because the author's rule integrates expert choice without requiring expert consensus, and a count on a row reads as a vote where there is none.
+Beside that sentence the row carries three status marks and no others, and the two the author's enumeration at `words/2026-09-08/39` adds are kept on the fact and off the option's row. That the recommendation adopts it, with its boldness. For each reading that bears on it, whether the tradition supports it or departs from it, by the reading's name. Where the author has ruled for it with the response confirm, that it is the confirmed disposition, marked confirmed where it is the last so ruled on this fact, and keeps its authority until the author rules for another, with the response and the date.
 
-The fourth mark and the fifth are new here and the first three are the record's own, renamed by the author's enumeration and not moved by it. The fourth is the one the rest of the record has been reaching for with nowhere to put it: `viable-options` describes it in its own answer, the option the author has selected without confirming, marked selected; `deferring-on-a-probe` produces one on every deferral it receives, since what a deferral sets is the author's choice and expressly not a confirmation; and `what-acts-during-bootstrap` makes it a term of the rule that governs every reconciliation this record does today. Against all three, `recording`'s ruling responses are `confirm` and `edit`, and neither records a choice made and not confirmed, so an amendment there is owed with this one and is named rather than assumed. Until it lands, a convergence whose first term the record cannot exhibit is a convergence nobody can check. The row's expanded details carry three accumulations and no more, at every stage and before and after any confirmation: the author's words, the entries the option references, each marked support or divergence and shown as one quotation concatenated in date order; the traditions', projected from the readings that bear on the option, each marked the same way; and the AI's accumulated support and divergence, shown whether or not the fact recommends the option. Beneath them, the node as it would stand under this option, resolved from the option's content, which the page previews in the context pane when the option is selected.
+The author's choice short of confirmation and each convened expert's choice are kept and are not put on an option's row. The fact names every party that took a position on it, the author where they have chosen and not confirmed and each expert convened, and says of none of them which option they chose. Each such party's reasoning is carried instead in a signed companion, one note per party in the fact's drill-down, attributed by name, binding nothing, and free to differ from the recommendation; where a party took a position and wrote no note the fact says so, since an absence that is silent reads as an absence that was judged. So this answer keeps everything the recommendation keeps and moves where it is shown: the parties stand at the first level and their stances one step beneath, in their own words, rather than as a mark standing above the argument.
+
+The two the author's enumeration adds are relocated here and not struck, and the first three are the record's own, renamed by that enumeration and not moved by it. The first of the two is the one the rest of the record has been reaching for with nowhere to put it: `viable-options` describes it in its own answer, the option the author has selected without confirming, marked selected; `deferring-on-a-probe` produces one on every deferral it receives, since what a deferral sets is the author's choice and expressly not a confirmation; and `what-acts-during-bootstrap` makes it a term of the rule that governs every reconciliation this record does today. Against all three, `recording`'s ruling responses are `confirm` and `edit`, and neither records a choice made and not confirmed, so an amendment there is owed with this one and is named rather than assumed. Until it lands, a convergence whose first term the record cannot exhibit is a convergence nobody can check, and under this answer that term is written in the author's own note rather than read off a mark. The ground for the relocation is the tradition the reading `cjeu-secret-deliberation` records: the arrangement that has held this line longest keeps the names on the judgment, keeps the stances off it, and publishes the divergent reasoning in a separately signed text beside it. The row's expanded details carry three accumulations and no more, at every stage and before and after any confirmation: the author's words, the entries the option references, each marked support or divergence and shown as one quotation concatenated in date order; the traditions', projected from the readings that bear on the option, each marked the same way; and the AI's accumulated support and divergence, shown whether or not the fact recommends the option. Beneath them, the node as it would stand under this option, resolved from the option's content, which the page previews in the context pane when the option is selected.
 The first two are the author's words of 2026-09-04. The third is what their
 answer of 2026-09-06 puts where the `stands` chip was: a mark records the prior
 confirmed disposition, if any, so it appears on an option the author has ruled
```

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
[Superseded 2026-09-07: this paragraph is the periagogic framing of 2026-09-04,
written before the periagoge ran, and it is not what a ruling here reaches. What
a ruling reaches is "What a ruling here would reach in the parent, 2026-09-06",
which names the parent's clauses and quotes them; this paragraph is kept as the
framing the sitting began from and not as a second account beside it. Two of its
claims have been overtaken. The parent's clause it quotes, "carrying its name
beside that as the handle the record files it under", is no longer
`alignment-page`'s live text, which reads "and carries the option's name nowhere
on the row"; the quoted words survive there only inside that node's own recorded
finding, and the span they describe was struck from `renderOption` on 2026-09-05
at `87e4b24e`, as the next section records. And the probe it defers to the
parent, whether the `stands` chip records anything useful, was answered by the
author on 2026-09-06 in the words `## Disposition` quotes, on which this
answer's third mark turns.]

Cascades: `commons.systems/disposition-graph/dialogue`, whose recommended text puts `source` and `ref` on every answer option, `status: passed` with its `reason` wherever the AI holds an option dominated, and the `ruling` with its response and date on the option the author chose, all of which the page renders as chips today, and whose `stands` is what the probe questions; `commons.systems/disposition-graph/viable-options`, whose gloss the passed-over chip quotes and whose model has each option carry its recommendation, its tradition relation and its confirmed choice; `commons.systems/disposition-graph/readings`, on the tradition relation the author keeps; `commons.systems/disposition-graph/progressive-disclosure`, whose two levels the split is drawn on; and `commons.systems/disposition-graph/recording`, on a recommendation that goes alone having to say that it does, which is the line the row prints when there is no case against.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at `commons.systems/public/agency` and at a node carrying a passed option and a ruled one, read against the recommended texts of `alignment-page` and `dialogue`, and `renderOption` in the projector, before anything is changed.

### Manifest

- Folded: The parent's clause rendered while this question stands, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The periagoge, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic, and the draft, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: What a ruling here would reach in the parent, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-06, of cf9ee19c, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading applied, and the amendment it drove, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-06, of 9d5ee0ea, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The kickback answered, and one error of the main thread's, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-06, of f3108f03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The second kickback answered, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-06, of 77ec2e36, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The third kickback, and the sweep done by search, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-06, of 84203846, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The fourth kickback, and the method changed, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 29fa08a9, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading of 2026-09-07 applied, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 76904185, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-07, of b89922c4, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 262fc5f5

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-details-carry-the-three-accumulations`.

Findings:

- Facts > answer > a-term-is-its-own-sentence (new to this diff): the option's prose reads "Raised by `commons.systems/disposition-graph/vocabulary-option-summary`, whose recommended answer leads a vocabulary row with the term and puts the gloss one step down, and which would otherwise print on three rows of each of the 134 nodes carrying the authority fact a lead this answer's own words call a defect to be found." This is a new claim about another node's recommended answer and a headcount ("134 nodes") that this delta reading's scope (the diff plus the previous reading's findings) has no way to check; it should be verified against `vocabulary-option-summary` at the node's next full reading or by the survey before the author rules.

On the facts and what they recommend: The diff touches only the answer fact's option list and recommendation: it adds two options, `a-term-is-its-own-sentence` (source `vocabulary-option-summary`, 2026-09-07) and `the-details-carry-the-three-accumulations` (source `dialogue`, 2026-09-07), and moves `recommends` from `three-marks-and-the-case-against` to `the-details-carry-the-three-accumulations`, boldness unchanged at moderate. `stands` is untouched (`three-marks-and-the-case-against`), so a `## Recommendation` fence now appears where none stood before (recommends and stands now differ). The `against` prose on the answer fact, the whole `authority` fact (still recommends `ratified`, low, unchanged fence), and the earlier `## Answer`/`## Rationale` prose are otherwise untouched except one citation edit (a stale line-number pointer into `project.mjs` was generalized to the bare file path).

On the viability of the options: Every option already on the list keeps its prior status (the three passed-over options remain passed with their reasons intact); the two new options each carry an argued case rather than a bare assertion, and the newly recommended `the-details-carry-the-three-accumulations` is explicit that it leaves the row's three first-level marks unchanged and only grows the drill-down, so it does not conflict with the fact-level rationale paragraph that argues for the marks arrangement. Nothing in the diff leaves an option ambiguous or contradicts the viable list.

Strongest counter-argument (weak): The fact-level lead paragraph ("Recommended because every settlement on it is the author's words applied where they fall...") was not touched by this diff and argues only for the marks arrangement, without saying why the accumulation-layer option is now recommended over the plain `three-marks-and-the-case-against` it is built on; the option's own added prose (AI support/divergence) carries that argument instead, which is a defensible split but leaves the fact's summary line silent on the actual recommended option. Separately, `a-term-is-its-own-sentence` rests on an unverified claim about `vocabulary-option-summary` and a node count neither this diff nor the previous reading established. Neither point was visible to the last reading since both are new to this diff, but neither is a false statement, a broken pin, or a contradiction this node's own text shows — they are gaps for the neighbourhood to close, not defects in the amendment itself.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/what-an-option-row-carries stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `three-marks-and-the-case-against`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `the-details-carry-the-three-accumulations`; 6 `## Disposition` entries became the ledger entries words/2026-09-04/45, words/2026-09-06/2, words/2026-09-06/3, words/2026-09-07/2, words/2026-09-07/3, words/2026-09-07/4, referenced by 1 option the entry's own date names and by the recommended option for 5 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `case-against-to-the-details`, `ai-case-against-on-the-row`, `keep-the-four-pills`, `confirmed-mark-struck`, `stands-and-ruled-as-two-marks`, `source-stays-on-the-row`, `unread-mark-where-no-reading-has-run`, `ai-line-until-a-reading-returns`, `no-mark-where-no-line`, `a-term-is-its-own-sentence`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `262fc5f533ed9beffd16a456f6dc58a181374812` was already past the recommendation and is left as it stood. The survey's pin `b89922c46f615f7d2ba8814aeeb6b8d431e50670` was already past the recommendation and is left as it stood.

### Frontier survey, 2026-09-07, of 77d3e104

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Cross-reference (12) and staleness. Both readings on this node are stale — its draft review and its survey each pin a recommendation the node has left — while the node measures the field it governs at "53 fact-level `against` fields beside 247 recommendations at this head". A node at the ruling stage whose two readings both read text that no longer stands is exactly the drift the twelfth validation exists to catch, and the author would rule on it with no current reading behind it.
- Contradiction (7) with `quotes`. This node decides what an option row shows the author, and `quotes` carries a row whose summary and content answer differently — `the-quotation-is-copied-onto-every-option` is summarized "with no ledger and no reference" and its content writes "the author's words are written as an entry of the ledger, `disposition/words/<date>.md`". Whatever this node answers about the row must make that divergence impossible or visible; the recommendation `the-details-carry-the-three-accumulations` does neither.

Strongest counter-argument (moderate): The recommendation loads the row with three accumulations while the record has just measured how thinly the underlying fields are populated — 53 fact-level `against` fields against 247 recommendations — so most rows would render an accumulation the record does not have, and a reader cannot tell an empty accumulation from an unwritten one. The node is also the one whose answer governs the surface the author rules from, and both of its readings are stale at this commit, so the strongest case against it is procedural: nothing has read the text the author would be ruling on.

### Frontier finding, 2026-09-07

Kind: contradiction.

Two live options on `quotes`' answer fact are written in vocabulary `authority` has struck and would restore the thing the vocabulary named. `ruling-stays-in-node` reads "A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp." and `the-quotation-is-copied-onto-every-option` reads "A ratified stamp whose ruling is not in the record is invalid, and the ruling a stamp requires is the one the author gives at that sitting, entered in the ledger then and referenced by the option ruled on". `authority`'s answer holds that "Every answer carries its authority in the rulings recorded on its facts, and no stamp is written beside them" and that "the deferred stamps the bootstrap wrote were unanswered, as the author classified them on 2026-09-03, and the record no longer carries them". Neither option carries a `status`, so both are live and either is one ruling from contradicting doctrine.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority.

Proposed: The survivor is `authority`'s vocabulary: no stamp. The two live options on `quotes` are rewritten so their validity rule speaks of the ruling recorded on the fact rather than of a stamp, or are passed with the reason that they restate a design the record has struck. `authority` is not amended, and `what-an-option-row-carries` is named because it governs the row the author reads these options from and is the node that could make such a divergence visible.

Recorded as an option on commons.systems/disposition-graph/quotes's answer fact: `stamp-vocabulary-struck-from-the-live-options` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: contradiction.

One option row on `quotes` summarizes itself as the contrary of its own content, so the author would rule from a line the record would not apply. The row reads "Each option carries the quotation itself, concatenated in date order, with no ledger and no reference, and a validator check that copies of one entry agree.", and the content fence of the same option, `the-quotation-is-copied-onto-every-option`, reads "When a sitting records a ruling, the author's words are written as an entry of the ledger, `disposition/words/<date>.md` on the disposition ref beside the graphs, verbatim and dated, and the option the author ruled on carries the reference to it". The summary denies both the ledger and the reference that the content requires.

Also named: commons.systems/disposition-graph/quotes.

Proposed: The survivor is the content, since it is what the record would apply, and the row is rewritten to state it — or, if the row is what was meant, the option is a different one and the content is redrawn to carry no ledger. Beyond the repair, `what-an-option-row-carries` is the node that must make this class of divergence impossible: whatever it answers about the row, the row is derived from the option's content and not written beside it, so a summary cannot contradict the text it summarizes.

Recorded as an option on commons.systems/disposition-graph/quotes's answer fact: `the-option-row-is-derived-from-its-content` (source review, 2026-09-07).

### Frontier finding, 2026-09-07

Kind: vocabulary.

author-questions' answer: 'The two senses of reader collide here and the record carries both, the parser of the graph and the clean-context reading\'s subagent, which is a vocabulary finding this answer records rather than settles and leaves to the survey; where this node says reader without qualification it means the parser.' The parser sense: viable-options 'the reader parses an option\'s `#### ` subsection and no content within it'; what-an-option-row-carries 'which the reader of the graph enforces'. The agent sense: review-cost 'A reading is the only reader in this record that can judge whether an answer is right, and it is the most expensive reader the record has'; what-an-option-row-carries 'Where no reader\'s line bears on a fact the row carries, in the line\'s place, one'. recording already has the third term: 'The reviewer recommends and never writes'.

Also named: commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/review-cost, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/clean-context-review.

Proposed: recording's term survives for the agent: reviewer, or the reading where the act is meant; reader is kept for the parser, which is what read.mjs is. review-cost, what-an-option-row-carries and clean-context-review substitute; author-questions strikes the sentence that leaves the finding to the survey.

Recorded as an option on commons.systems/disposition-graph/review-cost's answer fact: `reader-is-the-parser-and-reviewer-is-the-reading` (source review, 2026-09-07).

### The count in the recommended option's name is falsified, 2026-09-08

`words/2026-09-08/36` states the shape of alignment dialogue orchestration in seven
steps, and step 3 has an option accumulate a selection per expert alongside the
author's marks and tradition's relation. The recommended option here is
`the-details-carry-the-three-accumulations`, whose count comes from `dialogue`'s answer
and from `words/2026-09-07/4` beneath it: the author's, the traditions', and the AI's.
An expert's selection is a fourth, and where there is more than one expert on a fact it
is a fourth that is not even fixed in number.

Recorded as a divergence and not as a rewrite, and the option keeps its name. The name
carries the count, so the divergence is visible in the row itself rather than only in
the option's text, which is the right place for it: a reader scanning the fact sees an
option whose name says three standing beside a reference to words that say more than
three.

What the divergence does not decide is what the row should do about it. Three
arrangements are open and none is this node's to choose alone. The details could carry
one accumulation per party, growing with the experts convened, which is faithful and
unbounded. They could carry the three kinds and fold every expert into one, which keeps
the row's size fixed and loses which expert selected what. Or the expert selections
could sit at the first level as a mark, since step 3 puts `expert-selected` beside
`author-selected-but-unconfirmed` as a marking of the option and not as an
accumulation under it, which would make this a question about marks rather than about
details. The third reading is the one the author's own words come closest to, and it is
the one that would move this node's answer furthest; it is not recorded as an option
because what it turns on is `dialogue`'s question of where a part of the dialogue's
state is stored, and that node carries the divergence too.

### The author's five marks, and the two the row does not have, 2026-09-08

The author's enumeration at `words/2026-09-08/39` names five marks an option may
carry: author confirmed, author choice not confirmed, AI recommended, supported
by tradition X, and choice of expert Y. The record's answer had three. The
mapping is exact for three of the five and the other two are new, so the
amendment adds and strikes nothing: "AI recommended" is the fact's `recommends`
with its boldness, "supported by tradition X" is the `bears` relation seen from
the option's side, and "author confirmed" is the confirmed mark left exactly as
it stands, one mark and not two, for the reason the answer already gives.

The fourth mark is the one this record has been reaching for from three
directions with nowhere to put it. `viable-options` describes it in its own
answer — the option the author has selected without confirming, where there is
one, marked selected. `deferring-on-a-probe`, minted in this sitting, produces
one on every deferral it receives, since what a deferral sets is the author's
choice and expressly not a confirmation. And `what-acts-during-bootstrap`, in
this same sitting, makes it a term of the rule governing every reconciliation
this record does today, because bootstrap reconciliation acts on the convergence
of the author's choice with the AI's recommendation and the author's choice is
the first of the two terms. Against all three of them, `recording`'s ruling
responses are `confirm` and `edit`, and neither writes a choice the author has
made and not confirmed.

So the amendment owed on `recording` is the hinge, and it is named here rather
than assumed: until it lands, a convergence whose first term the record cannot
exhibit is a convergence nobody can check, and what goes unchecked is the AI's
own recommendation, which `delegation-bounds-and-sizing` calls the one thing the
alignment interview exists to check. That is a reconciliation item on
`recording`, and it is the reason this amendment was not deferred until the
encoding existed: the encoding is what the rule requires, so the rule comes
first.

The fifth mark takes its shape from the author's own parenthesis in the same
sentence, that bootstrap reconciliation "integrates expert choice, though expert
consensus is not required". Not required means the marks do not aggregate: one
mark per expert that chose the option, by that expert's name, and no tally,
because a count on a row reads as a vote and the author has said there is no
vote. That the record cannot yet convene an expert is not an argument against
the mark. `expert-instructions` stands at the periagogic stage and `movements` at
the maieutic, and both carry a ruling of deferred on their authority fact from
the same entry, so a row schema with no place for what they produce would have to
be amended the moment they are answered.

The boldness on this fact does not fall on the enumeration. The `against`
recorded on it is an argument about what the row's density hides, and this
amendment adds two marks to the row; the enumeration settles which marks belong
and not whether the row can carry them, so the objection survives the author's
words intact and the mark stays where it is. On this record every row would
carry three marks and two absences, and a structural absence reads on a page the
same as a defect, which is the density objection in its sharpest form and is not
disposed of here.

Owed on the implementation ref: `OPTION_SOURCES` in the reader admits `author`,
`ai` and `review` and not `expert`, and nothing in the encoding carries either
new mark, so this answer describes a row two of whose five marks no node can
presently hold.

### The tradition survey of 2026-09-09, and the seven readings it returned

The maieutic movement's tradition survey ran on 2026-09-09 under the author's
bootstrap grant of 2026-09-08 and returned seven readings, all seven minted as
nodes under this one on the same day. Four bear `adopted` on
`five-marks-and-the-two-the-author-added` and three bear `diverged`, and the
fact's `against` carries what they found in the register the recommendation has
to beat, so this entry records the shape of the return and not its content.

Two things about the return are worth the record's attention beyond the readings
themselves. The first is negative and the survey stated it rather than filling
it: no tradition it read offers a measured finding about how many marks a row
can carry. Every measurement it returned is about a practice being abandoned,
not about density, so the density argument in the `against` rests on judgment.
The record says so rather than letting a citation of seven traditions imply an
evidence base it does not have.

The second is that one reading produced an option. `cjeu-secret-deliberation`
found the arrangement that already publishes who deliberated and deliberately
declines to publish who held what, with the divergent reasoning relocated into a
separately signed companion rather than suppressed; the survey called it the
strongest counter it found and named it a real option this fact did not carry.
It carries it now: `names-on-the-row-stances-in-a-companion` was created on this
fact on 2026-09-09, sourced to that reading, its content generated as a strict
diff from the recommendation and round-trip verified before it was written. The
option was created before the reading so that the reading's `bears` would
resolve; the reading is nonetheless its source.

Three of the seven land on the same two marks, the two the author's enumeration
added, from three directions: the CJEU reading on what they cost a reader, the
ADR reading on the tradition the author's own criterion invoked licensing one
status value and not a row of parallel ones, and the Festo reading on there
being no instrument for lifting a mark once a named party carries it. That
convergence is stronger than any of the three alone, and it is named here rather
than left for a reader to assemble.

The five readings drawn from closed publishers quote nothing. The survey's rule
is that an unverified quotation is worse than none; loci were verified through
Crossref and Semantic Scholar and the text was not obtained, so the readings
characterise and do not quote, and each says so in its own account. One
attribution the survey could not pin, Shipman and McCall as the successor
programme to design rationale capture, was dropped rather than recorded
unpinned.

Every one of the seven writes the class rule in its `### authority` subsection
rather than the census sentence that forty-six reading nodes carry and that the
frontier survey of 2026-09-05 found false. Minting seven more instances of a
defect already named and already proposed for striking would have been the
cheapest possible error, and the readings' accounts say why they do not.

### The reading's findings of 2026-09-09, answered

The delta re-reading of this node returned forward at weak strength with three
findings on 2026-09-09, and this entry says what each one got.

The count is struck rather than corrected. `a-term-is-its-own-sentence` said
`vocabulary-option-summary`'s answer would otherwise print its lead on three
rows of each of the 134 nodes carrying the authority fact. The claim about
`vocabulary-option-summary` verifies against that node; the number does not, and
the sitting dated it rather than only checking it: 133 nodes carried the
authority fact at the end of 2026-09-06, 150 in the middle of 2026-09-07, and
164 when the finding was raised. So the number was right when it was written and
went stale inside three days, which makes it drift and not an error, and a
verified instance of the question `bootstrap-residue-staleness` asks. Correcting
it would have restarted the same clock, so the number is gone and the sentence
now states the rule: every node carrying the authority fact. It is a recurrence
of the defect the frontier survey of 2026-09-05 named on
`hansard-verbatim-record`, where a census sentence carried verbatim by
forty-six reading nodes had gone false, and that recurrence is why the seven
readings minted here write the class rule in `### authority` instead.

The second finding, that the fact-level lead argues only for the marks
arrangement and does not say why the accumulation-layer option is recommended
over the option it is built on, is left standing as the reading put it: a
defensible split, with the recommended option's own subsection carrying that
argument.

The third is not a defect of this node and is not answered here. The reading
declined to check the cross-node claims from its own context, on the ground that
its scope was the diff and the previous reading's findings; that was the right
call for a further reason the reading could not have known, which is recorded on
`clean-context-review` instead. The claims were checked by this sitting against
the node files directly, and all of them hold.

### Clean-context re-reading, 2026-09-09, of 1e0b37a2

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `five-marks-and-the-two-the-author-added`.

Findings:

- The previous reading's one finding is left open, but not by fault of this amendment. That finding said `a-term-is-its-own-sentence`'s claim -- "which would otherwise print on three rows of each of the 134 nodes carrying the authority fact a lead this answer's own words call a defect to be found" -- "should be verified against `vocabulary-option-summary` at the node's next full reading or by the survey before the author rules." The 2026-09-08 diff does not touch the `a-term-is-its-own-sentence` option (it still stands, untouched, on the answer fact's option list alongside the new `five-marks-and-the-two-the-author-added`), and the frontier survey of 2026-09-07 (`### Frontier survey, 2026-09-07, of 77d3e104`) does not verify the claim either. The finding's own deadline, "before the author rules," has not arrived: the stage moved to `maieutic` rather than toward a ruling. Suggested handling: carry the finding forward again rather than treat it as closed.
- The amendment's new account section, "### The author's five marks, and the two the row does not have, 2026-09-08," grounds its fourth mark in claims about sibling and newly-minted nodes that this delta's scope (the diff plus the previous reading's findings) cannot check: "`viable-options` describes it in its own answer — the option the author has selected without confirming, where there is one, marked selected"; "`deferring-on-a-probe`, minted in this sitting, produces one on every deferral it receives, since what a deferral sets is the author's choice and expressly not a confirmation"; and "`expert-instructions` stands at the periagogic stage and `movements` at the maieutic, and both carry a ruling of deferred on their authority fact from the same entry." A fourth claim in the same section, that `what-acts-during-bootstrap` "makes it a term of the rule that governs every reconciliation this record does today," is the same kind of claim, though I note for transparency that the materialized rule at `.claude/rules/what-acts-during-bootstrap.md` in this session's own project context (not supplied by the brief, and so not properly in scope for this reading) corroborates it: that rule states reconciliation acts on "the convergence of the author's choice with the AI's recommendation ... the recommendation being the AI's, which integrates the choices of any experts convened on the fact without requiring that those experts agree," and that "`recording`'s ruling responses are `confirm` and `edit` and neither writes a choice the author has made and not confirmed," matching the account's own claims about `recording` almost verbatim. None of the four is verifiable from the diff and the previous reading's findings alone. This is the same class of gap the last reading found in `a-term-is-its-own-sentence`'s claim about `vocabulary-option-summary`, and by that reading's own standard ("neither is a false statement, a broken pin, or a contradiction this node's own text shows — they are gaps for the neighbourhood to close, not defects in the amendment itself") it is a gap for the neighbourhood to close and not a defect in this amendment. Suggested handling: verify all of `a-term-is-its-own-sentence`, `viable-options`, `expert-instructions`/`movements`, and `deferring-on-a-probe` together at this node's next full reading or by the survey before the author rules.
- The frontier survey's vocabulary finding of 2026-09-07 ("Kind: vocabulary") quotes this node twice for a "reader" sense that collides with the agent/reviewer sense used elsewhere in the record: the parser sense, "what-an-option-row-carries 'which the reader of the graph enforces'", and the agent sense, "what-an-option-row-carries 'Where no reader's line bears on a fact the row carries, in the line's place, one'". Its proposal reads "review-cost, what-an-option-row-carries and clean-context-review substitute" the agent sense. This amendment leaves both instances unchanged, including inside the very paragraph it rewrote: the current Answer still reads "Where no reader's line bears on a fact the row carries, in the line's place, one mark saying so, and no argument." This is left open, but properly so and not a defect: the survey recorded the option enacting the substitution, `reader-is-the-parser-and-reviewer-is-the-reading`, on `review-cost`'s own answer fact rather than on this node's, so the vocabulary is `review-cost`'s to settle before this node could adopt it without pre-empting that node's own dialogue.

On the facts and what they recommend: The diff moves the answer fact's `recommends` from `the-details-carry-the-three-accumulations` to the newly added `five-marks-and-the-two-the-author-added` (boldness unchanged at moderate), leaving `stands` at `three-marks-and-the-case-against` so the `## Recommendation` fence persists. The resolved content is rewritten to state five first-level marks -- the prior three (recommended-with-boldness, per-reading support/divergence, confirmed) plus 'the author's choice, marked unconfirmed' and 'the expert chose it, by that expert's name, one mark per expert and no tally' -- while carrying the three-accumulation drill-down of the option it supersedes forward unchanged. The authority fact (`ratified`, low boldness) and its fence are untouched by this diff.

On the viability of the options: Every option on the answer fact's list keeps a status consistent with before this diff: the four passed-over options are unchanged, and `the-details-carry-the-three-accumulations` and `a-term-is-its-own-sentence` remain live and untouched. The new option, `five-marks-and-the-two-the-author-added`, carries an argued case tied directly to the author's own enumeration at `words/2026-09-08/39` rather than a bare assertion, and states plainly what it does not yet resolve (the fourth mark's encoding, owed on `recording`) rather than presenting it as settled. Nothing in the diff leaves an option ambiguous or contradicts the viable list; the authority fact's options are unaffected.

Strongest counter-argument (weak): The amendment's own new prose leans on claims about sibling and freshly-minted nodes -- `viable-options`, `deferring-on-a-probe`, `expert-instructions`, `movements`, and `what-acts-during-bootstrap` -- that this delta's scope cannot check, in the same way `a-term-is-its-own-sentence`'s '134 nodes' claim could not be checked at the last reading; none is a false statement, a broken pin, or a contradiction this node's own text shows, so by the standard the last reading itself applied these are gaps for the neighbourhood to close rather than defects in the amendment. Separately, the previous reading's own finding about `a-term-is-its-own-sentence` remains open -- neither the 2026-09-08 amendment nor the 2026-09-07 survey touched it -- so it is carried forward rather than closed by this round. And the frontier survey's vocabulary finding, which quotes this node twice for a 'reader' sense that collides with the agent sense, is not yet answered either, though the fix it proposes is recorded as an unruled option on `review-cost`'s own answer fact and so is not yet this node's to make on its own.

The session's reply: Forward taken. Of the three findings, the first is right and is answered by striking the count rather than correcting it: the claim about `vocabulary-option-summary` verifies, the number 134 does not, and dating it (133 nodes at the end of 2026-09-06, 150 mid-2026-09-07, 164 when the finding was raised) shows drift rather than error, so correcting it would have restarted the same clock. The sentence now states the rule. The second finding is left standing as the reading put it, a defensible split with the recommended option's own subsection carrying the argument for the accumulation layer. The third is not a defect of this node: the reading was right to decline cross-node verification from its own context, for a further reason recorded on `clean-context-review`, and the sitting checked the claims against the node files directly, where all of them hold. Beyond the findings, the node took the tradition survey's return: a new option `names-on-the-row-stances-in-a-companion` sourced to the CJEU reading, and an `against` extended with the survey's finding that no surveyed tradition offers a measured result on mark density while three hardened against the two marks the author's enumeration added. All of that is outside the review pin, so the forward verdict stands on what was read.

### Frontier survey, 2026-09-09, of 1e0b37a2

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The recommendation `five-marks-and-the-two-the-author-added` puts a mark on a row that nothing in the record writes. The reading `festo-surrendered-subject-matter` records it verbatim: "The node's own text records that the record cannot presently encode the first of them at all, `recording`'s ruling responses being `confirm` and `edit`, neither of which writes a choice made and not confirmed. So on the recommendation as it stands there is a mark with no producer and no retraction, on a row the machinery reads." The mark is load-bearing elsewhere: `what-acts-during-bootstrap` makes the author's unconfirmed choice the first term of the convergence bootstrap reconciliation acts on.

Strongest counter-argument (strong): The row this node designs carries a mark the record cannot produce or lift, and the frontier depends on that mark rather than merely displaying it: `what-acts-during-bootstrap` makes the unconfirmed choice one of the two terms whose convergence licenses reconciliation during bootstrap. So the defect is not cosmetic — a row that shows a state no act can enter or leave is a row the machinery reads and the author cannot correct, and it is the state on which the record's only active licence turns.

The session's reply: Kept, and it is the display side of the gap now recorded as an option on `recording`. The row this node designs carries a mark no ruling response writes and none lifts, and the finding's force is that the mark is load-bearing rather than cosmetic: `what-acts-during-bootstrap` makes the author's unconfirmed choice the first term of the convergence that licenses reconciliation during bootstrap, so the record's only active licence turns on a state the record cannot enter. The repair is `recording`'s to make; this node either cites the response once it exists or loses the mark by the same ruling.

### Frontier finding, 2026-09-09

Kind: coverage.

No node answers how an author's choice short of a confirmation is written, and three depend on there being one. The reading `festo-surrendered-subject-matter` states it: "The node's own text records that the record cannot presently encode the first of them at all, `recording`'s ruling responses being `confirm` and `edit`, neither of which writes a choice made and not confirmed. So on the recommendation as it stands there is a mark with no producer and no retraction, on a row the machinery reads." `what-an-option-row-carries` recommends `five-marks-and-the-two-the-author-added` and `viable-options` recommends `an-option-carries-a-selection-per-party`, both of which put the mark on a row; `what-acts-during-bootstrap`'s rule text makes the unconfirmed choice the first term of the convergence reconciliation acts on and concedes that the clause "states a rule whose encoding is owed". None of the twenty-eight options on `recording`'s answer fact adds a response that writes one.

Also named: commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/what-acts-during-bootstrap.

Proposed: The survivor is `recording`, which owns the ruling responses, and the gap is closed there rather than on the three nodes that read the mark. The option below puts a third response on the table so that the author can mark a choice without confirming it and can lift the mark, and the two display nodes and `what-acts-during-bootstrap` then cite it instead of describing a state nothing produces. If the author does not want such a response, the same ruling settles it, and the three nodes lose the mark rather than keeping a row the machinery reads and no act can enter.

Recorded as an option on commons.systems/disposition-graph/recording's answer fact: `a-response-that-records-a-choice-short-of-confirmation` (source review, 2026-09-09).

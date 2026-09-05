---
question: What questions for the author does a node carry, and where are they asked?
stage: maieutic
form: rule
under:
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-04, stopping the eleven clean-context readings of that day
and granting the reconciliation of this disposition before they are restarted
and before the survey:

> stop these reviews. before restarting these reviews, before survey, progress this disposition to survey ready and you have bootstap authority to reconcile it (for pending reviews):
> make sure we are recording as part of dialogue state of the node: a list of questions for the author needed to disambiguate author intent and make AI recommendations for each of the facts. questions are collected during periagoge, review, survey, and when processing confirmation kickback, or at any point during alignment diologue, review, reconciliation or rsi when reconsidering recorded AI recommendations. These questions feed the meiutic. If review produces questions then it necessarily kicks back to the meiutic. These questions are not presented in the alignment ui, they are presented in the meiutic session.

## Account

Recorded the turn the author said it, before anything was drafted from it, as
the checkpoint node requires. The disposition amends
`commons.systems/disposition-graph/dialogue`, which says what a node carries
while no ruling grants it, by adding a part the state does not have: the
questions for the author that the AI needs answered to disambiguate intent and
to recommend on each fact. It is an aspect of the dialogue's state and
therefore a node under it, as `dialogue#aspects-are-nodes` says.

The periagogic object, to be read before anything is changed: the `dialogue`
node, for what the state holds today and what its `facts` encoding admits; the
`recording` node, for what a movement writes; the `clean-context-review` and
`frontier-consistency` nodes, for what the two readings return and what the
applying step writes, since the disposition makes a reading's questions force a
kickback; the `alignment-page` node, for what the author's ruling screen shows,
since the disposition says the questions are not shown there; the `unanswered`
and `authority` nodes, for what a movement back to the maieutic stage means;
the `rsi` node, named by the author's words as one of the moments questions are
collected; and, in the implementation, the reader and the validator in
`packages/disposition/`, the alignment page and the frontier in
`packages/disposition/project.mjs`, the review's brief generator and applying
script in `packages/clean-context-review/`, and the three skills that run the
movements.

### The periagogic movement, 2026-09-04

Three units read the periagogic object and returned; the main thread wrote none
of it and read no unit's context. Their conclusions are recorded here because
the record and not the session carries them.

**What the record already holds.** The parent node names a home for these
questions and the record uses it. `dialogue`'s answer, in the standing text and
in the fence alike, says the account holds "the evidence, the findings, the
reasoning behind the recommendation of each fact, the review's findings and its
counter-argument with the session's reply, and what is open for the author";
`recording`'s fence repeats it as "what is left open". It is populated:
`viable-options`' account carries eleven numbered probes under its periagogic
movement of 2026-09-04, put there "for the author to answer on the page or in
prose", and its maieutic section indexes them by number; `coverage` carries
four; `rsi`, `self-documentation`, `review` and `ruling-transport` carry one
each; `alignment-order` and `dialogue` carry "### Probe outstanding" and
"### Probe answered" headings, which is a state machine improvised in prose. The
word **probe** already means the AI's question to the author, is used in
fourteen nodes, and is defined nowhere.

**The record has decided this once, the other way.** A clean-context review of
2026-09-03 on `review` found "Two open questions carried as prose in a node at
stage review; transience makes an open question a node with a stage. Suggested
edit: mint them, or fold them into the ruling's options." The finding was
applied, and the two questions are the options `cap-from-contract-class` and
`graph-landing-instrument` today. This disposition reverses an applied finding.
That is the author's to do and it is named here rather than passed over.

**The argument that cuts the other way, and is the disposition's strongest.**
The author's words require that the questions not be presented in the alignment
UI. Their present home fails that requirement: the account is rendered as a
drill-down on the alignment page unconditionally, so questions kept in the
account sit in front of the author at the ruling, which is the one place the
author said they should not be. "Keep them where they are" cannot satisfy the
disposition as stated.

**Three conflicts the design must resolve rather than route around.**
`frontier-consistency`'s fifteenth validation says a new question carried on
another node's dialogue is proposed a node of its own; it is live in both
review briefs, so unamended, every use of a questions field is a survey finding
against itself. The vocabulary check fails on the term: "question" is defined
once, on `node`, as a node's own question, and `dialogue#aspects-are-nodes` adds
a second sense, a decision the author would rule on separately; the author's
sense is a third. And `transience`'s minimal-state test excludes what a session
holds back until the author has committed, its one exception scoped to the
author's own words; the answer available to this design, that a question records
a failure to derive which a re-reading may not reproduce, is not yet in the
record.

**A merge candidate, named and not buried.** `fidelity`, "What preserves the
author's intention while the dialogue rationalizes it?", is at the periagogic
stage with no recommendation and asks this from the other side: "nothing asks
whether the answer is the author's intention or the AI's reconstruction of it.
That is the gap this question names." This disposition may be an answer to
`fidelity` rather than a new part of `dialogue`.

**On the movements and on RSI.** A reading may name the maieutic stage today: it
is the default for a denial and is implemented. What the author's rule overrides
is `brief-draft.md`'s instruction to kick back only when the draft cannot be put
to the author as it stands, with findings a session can fix by amendment going
forward, and `frontier-consistency`'s routing of ground-level findings to the
periagogic stage. `rsi` has no answer at all, and the only route from the loop to
a node today is an option, under the unruled `loop-writes-options`.

**What the implementation makes true.** `stripDialogueFrontmatterLines` strips
only `stage`, `review`, `depends` and `facts` before hashing, and on a node with
no `## Recommendation` fence the standing hash is also the answer fact's
recommendation hash; so any new frontmatter field not added to that strip moves
`review.of` and a ruling's `of`. A question written by the reading whose pin it
would invalidate is a self-defeating instrument, and the field must join the
strip. The two projections differ on hiding: the alignment page renders named
fields through a hardcoded allow-list, so keeping questions off it is a matter of
not adding them, while the browser serializes the whole graph object into the
page source, so a questions field is published there whether or not any client
code renders it. And `apply.mjs` decides the kickback stage on one line, forward
to the ruling stage and otherwise the stage the reader named, so "questions
necessarily kick back to the maieutic" is a second rule that must beat a
reader's forward verdict and not merely its choice of stage.

### The pass with reference to tradition, 2026-09-04

The second evaluation the `evaluation` node requires. Tradition does not find the
disposition wrong anywhere; it finds it incomplete in four places and reverses
one inference.

**A per-question shape the author's words do not supply.** IEEE 830-1998 §4.3.3
requires a TBD to carry the condition causing it, what would eliminate it, who is
responsible, and by when; the issue log of project management agrees. The two
fields with real content are why the record cannot answer the question and what
would discharge it.

**An admission test, on which four traditions converge.** *Acte clair*, the rule
that no reference is made where the answer is clear; Rule 33(d) of the Federal
Rules of Civil Procedure, which sends the asker to derive the answer from the
record; ISA 580, that the principal's answer is never sufficient evidence by
itself; and the value of information, which this graph already reads. Management
by exception names the same test in the record's own vocabulary, which
`authority` already applies to options: a question is admitted only where the
record cannot answer it and the answer would change what is recommended.

**The clause keeping the list off the alignment page is the boldness fold
returning under another name.** `montgomery-informed-consent` and
`bentham-publicity` both sit under `alignment-page` and both hold that the
recommender does not decide what the decider sees, and Montgomery is the
tradition this record used to kill the fold on that very node. Owed as a
divergence, with a reconciliation available: work the list in the maieutic, and
show the author *that* questions are open.

**The drafting session writes both the recommendation and the questions that
would unsettle it**, which is `segregation-of-duties` unmodified. One field
closes it: a `source` per question, the same field an option already carries.

**A hazard the record has no vocabulary for.** Satisficing: a long list degrades
the answers given, worse for later items, and a satisficed ruling is
indistinguishable in the record from a considered one, permanently.

**The greenfield inference reverses.** Asking was expensive and is now free, but
answering is now the binding constraint, since there is one author. Every cap in
every tradition surveyed was calibrated the other way, so the caps here must be
tighter than tradition set them, not looser.

**What tradition strengthens.** The questions list is the one instrument where
the AI is genuinely barren: it delivers no content, only the shape of its own
ignorance, which speaks to the divergence standing unresolved on
`plato-maieutics`. The empirical half is that models recognise ambiguity and
answer anyway, and that retrieved context makes them *less* likely to ask, which
is what this record manufactures at every reading. So the obligation to collect
questions belongs to the movement and can never be a disposition the model is
trusted to act on.

**A defect the survey found in the record itself**, recorded for the survey
rather than fixed here: `prose-and-structure`'s rule that a second reading of one
body of sources is an anomaly is not obeyed — `srs-introduction` and
`self-contained-specification` both read IEEE 830 and ISO 29148 under different
questions — and the rule needs a criterion, the unit plausibly being the question
put to the source. Ten loci the survey could not verify are named as unverified
in its report rather than dressed in citations.

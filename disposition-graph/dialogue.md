---
question: What does an unanswered node carry?
stage: maieutic
recommendation:
  adopts: standing
  class: ratified
  boldness: high
  amends: "163f5ee5130f88f160523f95c72381f26751e96d"
  at: "9e3a66240872d3512a3acf085f3154b9004028a2"
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 163f5ee5130f88f160523f95c72381f26751e96d
alternatives:
  - name: minimal-dialogue-state
    source: review
    ref: "2026-09-03"
  - name: freeze-standing-under-recommendation
    source: ai
    ref: "2026-09-03"
  - name: depends-migration-named
    source: review
    ref: "2026-09-03"
  - name: depends-names-an-alternative
    source: author
    ref: "2026-09-03"
  - name: first-answer-is-not-an-amendment
    source: ai
    ref: "2026-09-03"
  - name: caption-only
    source: review
    ref: "2026-09-03"
  - name: ranges-on-whole-node-alternatives
    source: review
    ref: "2026-09-03"
  - name: aspects-compose-the-answer
    source: ai
    ref: "2026-09-03"
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/unanswered
defines:
  - dialogue
  - dialogue state
  - stage
  - alternative
  - standing answer
  - draft
  - recommendation
  - review state
  - account
---
## Disposition

The author, 2026-09-03, on the alignment page and the encoding beneath it:

> dispositions may have cascading effects on disposition for unanswered data model.

> Each is a sublist B of summarized options with the AI recommendation, and confidence in the recommendation (previously called boldness, now called confidence).

> Not all aspects of the disposition need to be confirmed individually. After the list A of confirmation requests is the full disposition detail. It dynamically reflects choices made in the confirmation request list. Very high confidence or default disposition elements can just be included in the final render.

> nodes (eg. commons.systems/disposition-graph/purpose) still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed. This appears to be bootstrap encoding artifact. purpose node is a confirmation ruling for a node that does not yet exist on the reconciliation frontier (only on the alignment frontier).

The words in full are on `commons.systems/disposition-graph/alignment-page`, the node whose question they open.

The author, 2026-09-03:
> re-evaluate the encoding of unanswered greenfield if necessary

The author, 2026-09-03:
> It seems like an unanswered node is a disposition + other state needed to track progress through alignment (periogoge, mieutic, adversarial review state, recommended diff/authority/persistence/boldness) or something like that, evaluate greenfield and make a recommendation

The author, 2026-09-03, on the recording of alignment-order and on this node's question:
> Proposal is not an ideal way to record this because it suggests an answered incumbent, and escalation of delegated scope - which there is neither. It sounds like this might be better encoded (evaluate this adversarily) in the unanswered question encoding. Unanswered questions carry a list of alternative answers. Each may be suggested by the author (and reference author text) or suggested by the AI or it may be a steelman argument that emerges from adversarial review. An alignment diologue (like this one) records all of the alternatives that arise and whenever new alternatives arise the AI may update which answer is granted the AI recommendation (with what authority, etc.)
>
> In this model, unanswered questions are recommendation (same encoding as an answered disposition node, or diff) + diologue state around that recommendation including alternatives and any author text associated with the recommendation or any alternatives and dialogue phase, etc.
>
> One of the analyses performed by periagoge and adversarial alignment review is whether disposition is a new question or a new answer for a disposition (answered or unanswered). A conflicting answer that arises in alignment AND survives periagoge/meiutic/adversarial review is marked unanswered until confirmed.
>
> If these unanswered dispositions survives periagogic and meiutic scrutity (stop before adversarial review), you have bootstrap authority to reconcile the unanswered node encoding, the alignment skill, and alignment artifact and re-encode the unanswered frontier (the full graph) including merge analysis.

The author, 2026-09-03, a note on the same:
> A conflicting answer that arises in alignment AND survives periagoge/meiutic/adversarial review is marked unanswered until confirmed. A conflicting answer that arises outside of alignment is a proposal.

The author, 2026-09-03, on the sequence of this sitting:
> First, prepare for compaction. Afterr compaction we will proceed with periagoge, meiutic then reconciliation.

The author, 2026-09-03, answering the periagogic probe on the two loci of "proposal":
> closer to the second meaning. A conflicting answer that arises outside of alignment is a proposal. eg. via some evidence/signal/instrument/criteria or because a conflict is identified outside of alignment. The term must not be overloaded - it is technical vocabulary. This narrows the authority node definition is that conflicting answers evaluated in alignment are recorded differently.

The author, 2026-09-03, refining the disposition:
> refinement of disposition: evaluate the unanswered encoding greenfield given other dispositions about it from this session. Encoding details are delegated. The flipping of node I suggested from answered to unanswered pending confirmation feels like a hack. At a functional level, when reading the documentation for a node that has been previously confirmed/answered I want to see if there are alternate proposals surfaced outside of alignment, or alternate answers surfaced during alignment which are pending confirmation. The model includes the question, which may have associated active dialogue state (confirmed dialogue state is rendered to the questions and otherwise only exists in git history), and if there is active dialogue state that will include a recommendation after the (first) meiutic phase. recommendation is a node or a node diff. recommendation may change on kickback, or as the unanswered frontier otherwise evolves. Since all nodes are currently unanswered we expect every recommendation to be a node, not a diff.

The author, 2026-09-03, on the maieutic bindings, first on the staleness of a whole-node recommendation:
> > recommendation as a whole node
>
> This can go stale as easily (if not easier) than a diff. This probably means we need some sort of pinning of the recommendation as well (if that's not already recorded).

The author, 2026-09-03, on what grounds work while an alternative is pending:
> When an alternative is pending on ANY node with authority (ratified, deferred or delegated - remember that ratified has specific technical meaning) the previously confirmed answer keeps its full authority until an alternative is confirmed.

The author, 2026-09-03, on a proposal from outside alignment:
> A proposal from ouside alignment opens a dialogue on its node, yes.

The author, 2026-09-03, on the sequence:
> before reconciliation begins perpare for compaction. we will reconcile after compaction

The author, 2026-09-03, during the reconciliation under the bootstrap grant on the dialogue node:
> disposition (if not already recorded as unanswered): adversarial alignment review validation includes a check for opportunites to merge unanswered nodes as alternate answers to the same question. Adversarial review evaluates batch of nodes which are at the review dialogue phase against the full graph.
>
> you have bootstrap authority to reconcile the adversarial alignment review skill in additino to the alignment skill and other bootstrap grants already provided.

The author, 2026-09-03, during the reconciliation:
> prepare for compaction then stop

The author, 2026-09-03, answering the probe on the unit of a ruling, which this node encodes:

> the revised record is to carry a decision per aspect. each aspect of a disposition may have choices that require confirmation. each aspect has a recommendation with confidence.

The author, 2026-09-03, retracting the rename put to them earlier the same day:

> stick with boldness then, I want to know how much rests on the AI's own knowledge against the record.

The words in full are on `commons.systems/disposition-graph/alignment-page`.

## Answer

Its question, its fields, and its standing answer with its stamp when it has one; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every unanswered node and on any answered node with an alternative pending on it. The status unanswered stays derived from the stamp, as the unanswered node says, and a standing answer of any class, ratified, delegated, or deferred, keeps its full authority while the dialogue is active, until an alternative is confirmed. Confirmed dialogue state folds into the node at the recording, into the answer, into the rationale as a rejected alternative with the ruling quoted, or into nothing; unconfirmed, it survives only in version control. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the unanswered frontier, and, reading a node that already has an answer, whether alternatives are pending on it and where each came from. It has these parts, each holding only what cannot be re-derived.

`stage`, the next movement owed: periagogic, maieutic, review, or ruling. The movements come in that order, so the stage also says what is behind the node, and a kickback moves it back. A proposal from outside alignment, as the authority node defines it, opens the dialogue on its node at the periagogic stage.

`## Disposition`, the author's words, verbatim and dated, accumulating through the dialogue.

`alternatives`, the candidate answers pending the author's ruling, as data: each with a `name`; its `source`, the author's words in the disposition, the AI in alignment, the clean-context review, or a proposal from outside alignment; and a `ref`, the date of the words or of the review, or the instrument or node that raised the proposal. `## Alternatives` holds one subsection per name, in the same order, saying in prose what the alternative would answer and why it is on the table. The node as it stands is always a candidate and is never listed; its name is `standing`. An alternative that has been ruled on is no longer one: it is the answer, or a rejected line in the rationale.

`recommendation`, the AI's recommendation among the alternatives, as data, required from the review stage on: `adopts`, the name of the alternative it adopts, or `standing`; `class`, the stamp a confirmation confers, ratified or delegated; `boldness`, low, moderate, or high, how much of it rests on the AI's own knowledge against the record and the author's words; and its pin, `amends`, the hash of the standing text it amends, the node stripped of its dialogue state, and `at`, the graph commit it was drafted at. A recommendation is drafted after the first maieutic movement and may change on a kickback or as the frontier evolves; the pin is what shows that the standing text has moved under it, which the frontier and the page flag as they flag a stale review. The third fact, persistence, is derived from the node's shape and never stored: the node itself is standing, and each shim and each piece of evidence in it is named with its own persistence, as the growth node's presentation rule lists them. The reasoning behind each fact is prose in the account.

`## Recommendation`, the recommended text when the recommendation adopts an alternative: one fenced markdown block holding the whole proposed node, frontmatter and sections, so that the same reader parses it and the alignment page derives the edit, field by field and word by word, beside the whole. A recommendation that adopts the standing text has no such section, and a confirmation ratifies the node as it stands. While nothing is answered every recommendation is a whole node; a diff is derived from it and never stored. The draft, elsewhere in the record, is this text. It may be invalid under the doctrine of the day, as when it presumes a ruling not yet given; the validator parses it and checks only that it answers the same question.

`review`, the state of the clean-context review of the recommendation: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the hash of the recommended text the reviewer read, the fence when there is one and the standing text otherwise, so that a recommendation changed since the review shows as changed on the frontier and the page. What the reviewer saw is the whole unanswered frontier at the review's date, as the clean-context-review node says, and needs no field. A node reaches the ruling stage only with a forward verdict.

`depends`, the open questions whose rulings this one waits on, as data: the ids of unanswered nodes that must be answered before this node can be, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed with the rest of the dialogue at the recording.

`## Account`, the AI's account in prose: the evidence, the findings, the reasoning behind each fact of the recommendation, the review's findings and its counter-argument with the session's reply, and what is open for the author. It is not a proposal and does not carry that name: a proposal is the alternative that arose outside alignment, as the authority node defines it.

The validator holds the parts together: a stage on every unanswered node and on every answered node with dialogue state, and every part of the dialogue state requiring a stage; a recommendation from the review stage on, adopting `standing` or a listed alternative, with its pin; a `## Recommendation` fence exactly when the recommendation adopts an alternative, parsing and answering the node's question; the alternatives' names unique and their subsections matching; a forward verdict at ruling; every `depends` id resolving to a node that is still unanswered. Everything else is derived: the status, the persistence, the queue and its order, whether the standing text has changed since the recommendation and whether the recommendation has changed since the review, the edit the page shows, and the counts. The projections that show a node with a standing answer, the browser and the alignment page, show its pending alternatives beside the answer with their sources, and say that the answer keeps its authority until one is confirmed.

## Rationale

The author's question of 2026-09-03, quoted above, answered greenfield that day and re-answered the same day under the author's second disposition, quoted above, which asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and delegated the encoding's details. What the dialogue must carry is fixed by what cannot be re-derived once the session that held it is gone: the author's words, the position reached, the alternatives on the table and where each came from, the recommended text, the facts the presentation rule requires, and what the reviewer found. Each of those was in the record on 2026-09-03, but most as prose conventions inside the account: a "Facts:" line, a "Proposed text" block, a review subsection with a verdict and a strength, an alternatives list nobody could render, and two conventions for the draft. Prose conventions drift, and the page could not read them; the reviewer had already flagged that "as shown" was ambiguous between the node and the draft. This answer makes the alternatives, the facts, the pin, the verdict, and the draft data where a projection or the validator reads them, and keeps them prose where only a person does; the stage stays one field, since the movements are ordered and a date per movement would store what version control already holds.

The re-answer's decisions. The flip of an answered node to unanswered while an alternative is pending was the author's first suggestion and was retracted by the author on 2026-09-03 as a hack; what the author wants at a functional level, in their words, is to see when reading an answered node whether alternate proposals from outside alignment or alternate answers from within it are pending, which the alternatives list with its sources gives beside the standing answer with no change of status. That a standing answer of any class keeps its full authority while an alternative is pending, and that a proposal from outside alignment opens the dialogue on its node, are the author's rulings of 2026-09-03, quoted above. The pin answers the author's observation that a whole node goes stale as easily as a diff: the hash of the standing text the recommendation amends, checked as the review's hash is, and the graph commit it was drafted at. The vocabulary follows the author's ruling on the authority node the same day: the AI's account loses the name proposal, and a conflicting answer that arises in alignment is an alternative. The encoding was written under the author's bootstrap grant, quoted above, after the periagogic and maieutic movements on this node and before the clean-context review, which runs on what the reconciliation wrote.

Rejected: the state as prose only, since the page would keep guessing; a date per movement, since it duplicates history; a separate draft file per node, since a node is one file and the draft is parseable inside it; a stored diff, since it is derived from the draft and the node; persistence as a stored fact, since a node is always standing and its shims are declared; a validator that refuses a draft changed since the review, since the session decides whether a change is substance, as the recording node says, and the flag gives it the fact; a status field or a fourth class for a node with pending alternatives, the retracted flip; alternatives as prose only in the account, since the page could not show them beside the answer; a node per alternative, since an alternative is a candidate answer to this question and not a question of its own. Traditions, recorded as readings under this node or owed under the stub-traditions ruling: architecture decision records in the MADR form, the reading under this node, whose considered options with their sources, chosen option, and status this encoding adopts, with the status derived here where MADR stores it; the RFC and PEP processes, a status field on a prose document with a fixed order of states; review approvals pinned to a revision in code review, where a new revision marks the approval stale; and the review of a change as a diff against what stands.

## Alternatives

### minimal-dialogue-state

The clean-context review's strongest counter-argument, twice recorded as strong, holds that the node's own test for storing anything is what re-derivation cannot reconstruct, and that three of the parts fail it: the recommendation's class and boldness are judgments a session would make again from the same node, the review's verdict and strength are re-derivable by re-running the review, and the draft is a copy of the node inside the file that holds it. The candidate answer is that the dialogue carries only the author's words, the stage, and the AI's prose account, and that everything else is derived at each reading. The session replied that the record stores the results of judgments as it stores a stamp or a boost, and the author has not ruled on it.

### freeze-standing-under-recommendation

The finding that the review pin covers only the draft and not the standing answer names three answers and adopts none: pin both texts, pin the whole node, or hold that a node's standing answer may not be amended at all while a recommendation on it stands. The author's maieutic ruling took the pinning route, adding the standing hash and the graph commit, so what is still open is the third: forbid the amendment rather than flag it. The finding was explicitly left for the ruling rather than decided in the sitting.

### depends-migration-named

The answer names the migration that `depends` orders and drops the claim that the frontier shows the gap. Verified that zero nodes carry the field, twenty-three carry the `Depends on:` prose it replaces, the projector reads it nowhere, and the frontier prints nothing about it, so a confirmation today ratifies a seventh part of the dialogue state that no node uses and no projection reads. On this alternative the answer says that the field is defined and not yet carried, that the prose conventions stand until the migration lands, and that the migration is part of what the confirmation orders — which is what dialogue's own account calls 'a reconciliation with the author's ruling on each' rather than a landing inside one sitting.

### depends-names-an-alternative

The alignment-order draft records a divergence between subtrees on the leaves: each node the review finds to stand under one side names, in `depends`, the ancestor and the alternative on it that it stands under, and the page derives the divergence at the ancestor by inversion. `depends` as this node defines it carries node ids only; the alternative extends its target to an alternative on the named node, keeping the inverse derived and never stored. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

### first-answer-is-not-an-amendment

This node's answer says how a recommendation is encoded and how the page
derives an edit from it, and says nothing about the difference between a ruling
that amends an answer and a ruling that gives one for the first time. The
alignment page therefore presents both the same way, and its caption for the
second is false. This alternative would add the rule the answer lacks, and
nothing else.

Where the node's stamp confers authority to amend, the projections may lead
with the edit and say that the node as it stands is what remains if the author
denies. Where it does not, the projections lead with the recommended text
whole, name the ruling a first answer, and say what deny actually leaves: the
question open, with nothing behind it that holds. The edit stays derivable and
stays available, because the pin the author asked for detects staleness on any
node whether or not it has an answer; what changes is which of the two the
author is shown first and what the page tells them the responses do.

`amends` is untouched and stays required. `standing` stays the name of the node
as it stands, on every node: the author ruled on 2026-09-03, on
`un-aligned-children`, that what an unanswered disposition lacks is authority
and not standing, and an earlier draft of this finding that proposed to take
the name away from unstamped nodes contradicted that ruling and was withdrawn.

### caption-only

The clean-context validation of 2026-09-03 raised this as the case against
touching the encoding at all. The record already carries the fact that
distinguishes the two cases, the presence or absence of the `authority` stamp;
`deriveStatus` and the projector already branch on it, printing an
"unstamped" label and a "no stamp" pill on the very nodes in question, and the
page's own field-level edit already shows the line `authority: none -> {...}`.
So the whole defect can be met by making `EDIT_CAPTION` and the order of the
two blocks conditional on `node.authority`, in the projector, with no change to
this node's answer, no change to the validator, and no ruling required. On this
alternative the finding is a reconciliation item against the alignment page and
not a question for the author at all.

What it gives up is that nothing in the record would then require the
distinction: a later projector, or the projected alignment skill, would be free
to caption a first answer as an amendment again and would contradict no
disposition in doing it.

### ranges-on-whole-node-alternatives

Raised by the clean-context validation of 2026-09-03 as the case against
replacing the encoding. The author's page can be reached without `aspects` at
all: leave `alternatives` whole-node as they stand, add to each the range of
the node it touches, a field or a section or a paragraph, and let the page
derive list A by grouping alternatives whose ranges do not overlap, so that
each group is a row and the alternatives in it are its choices. Combinations
compose for the same reason they compose under `aspects`, because
non-overlapping ranges apply independently.

Its case is cost. It is one additive field on an entry the record already has.
No node file is restructured, `adopts`, `amends` and the `## Recommendation`
fence keep their meanings, the validator's alternative rules stand, and the
clean-context reviews of 2026-09-03 on the eight ruling-stage nodes are not
spent, because none of their answers change.

Its case against is the author's own words, that the revised record is to carry
a decision per aspect. Under this alternative the record carries whole-node
candidates with a hint, and the page infers the decisions; an aspect on which
no alternative was ever recorded, the authority class the author named first
among them, has no row of its own and no boldness of its own, since boldness
here stays a property of an alternative and not of a decision.

### aspects-compose-the-answer

The sitting's recommendation after the author's greenfield instruction of
2026-09-03. A node's answer is composed of its decisions rather than carved
into them. The node carries its question and a set of aspects; an aspect is one
decision, with its `choices`, the one it `adopts`, its `boldness`, and its
`ruling` once the author has given one; and `## Answer` is derived by rendering
the adopted choice of every aspect in order. There is no `## Recommendation`
fence: the recommendation is the set of adopted choices, and the render the
author reads is derived from them live.

It differs from the carving model in what is primary. There, an answer is
written whole and aspects are slots cut into it, so the decomposition must be
shown to compose. Here nothing is carved, and a sentence belonging to no aspect
is a sentence no one ruled on.

Reserved aspect names: `answer` while a node has not been split, `authority`
for the class a confirmation confers, `persistence` where the recommendation
would change the node's shape, and `existence` with the choices keep and prune,
which replaces the prune alternative. A choice carries its `name`, `source`,
`ref`, the dates of the author's words it rests on, the text of its fragment,
and the choices it `excludes` by aspect and name. The review is per aspect, so
any reviewed choice the author confirms lands. An aspect folds into the render
only on low boldness. A `ruling` carries `of`, the hash of the choice text
ruled.

Its cost: writing an answer becomes writing its decisions, each choice a
self-standing sentence or paragraph that reads in sequence; combinations may be
incoherent, which `excludes` handles and nothing checks; every node migrates as
one aspect and splits as sittings touch it; and nothing yet checks that the
derived answer reads as prose.

## Account

### Finding: the review pin does not cover the standing answer, 2026-09-03

`review.of` is defined above as the hash of the draft text the reviewer read, "so that a draft changed since the review shows as changed on the frontier and the page". Found while verifying this session's own landing: when a node carries a `## Draft`, the pin covers the draft alone, so an amendment to the node's standing answer is invisible to it. `node` had its answer amended on 2026-09-03 to strike the no-children rule and the frontier does not flag it, while `transience`, `dialogue` and `authority`, which carry no draft and are therefore their own drafts, are flagged correctly.

The consequence is narrow but is the drift this answer exists to prevent: a reviewer's verdict stands against text that has since moved, and the reader is not told. The fix is not obvious enough to take here — pinning both texts, pinning the whole node, or holding that the standing answer of a node under draft should not be amended at all are three different answers with different costs — so it is recorded as a finding on this node and left for the review.

### Reconciled to the author's requirements, 2026-09-03

The author, 2026-09-03:
> also provides bootstrap authority to reconcile the alignment skill with that unanswered disposition

and, setting the requirements:
> record/reconcile unanswered disposition for what that dialogue state needs to contain to persist across sessions, maintain fidelity, and give the author the necessary context during dialogue about the how an unanswered disposition relates to the unanswered frontier.

Three requirements, and the answer met one of them. Persistence across sessions was already the organising principle: the rationale below fixes the contents by what cannot be re-derived once the session that held it is gone, and the checkpoint node writes the state at every transition. The other two were not met, and are now named in the answer, one of them as a requirement this answer does not yet satisfy.

**Fidelity.** Nothing among the parts holds the author's intention against the account that accumulates around it. Measured on this graph the same day, over the 43 nodes carrying the author's words, the author's verbatim share of the dialogue text falls from about 13 per cent at nought or one review round to about 4 per cent at two, and does not recover; across the graph it is 6.2 per cent. The dilution is done by the parts this answer added — the review, the recommendation, the account — and it is heaviest exactly when a node is being prepared for the author's ruling. The requirement is stated here; the mechanism is the `fidelity` question and is not decided here, because the right measure is part of what that question asks and this answer should not presume it.

**The frontier relation.** The answer's own principle is that what a projection or the validator must read is data and what only a person reads is prose. It applied that to the facts, the verdict and the draft, and left the node's relation to the open frontier as prose conventions inside the account: verified on 2026-09-03, `Depends on:` on 21 nodes, `Feeds:` on 9, `Also named:` on 54, and the projector reads none of them. That is the same drift the rationale below indicts, in the same section, unfixed. `depends` is added as the seventh part, and only `depends`: what a question feeds is its inverse and derives from it, and the node's place in the answered graph is already carried by `under`, `after`, `order` and `cites`. The prose conventions are then unsupported and are liquidated through reconciliation, where the author rules on the pruning.

Consequences not taken here. Migrating the 21 `Depends on:` conventions into `depends` reads and rewrites a third of the graph, which is a reconciliation with the author's ruling on each, not a landing inside this sitting; `Also named:`, which is the AI's cross-reference rather than a dependency, may want a different home or none. The projector and the alignment page do not yet read `depends`, so the field is recorded before its instrument exists, which the frontier does not yet show: the projector reads the field nowhere, and the twenty-three prose conventions stand until the migration is ruled, as the review of 2026-09-03 found.

The answer changed after its review of 2026-09-03, so the review is owed again on the changed text, and the recommendation's class is unchanged.

### Recording of 2026-09-03

The author's question quoted above is answered as this node, stamped deferred and recommended for ratification. The author's: that an unanswered node is the disposition plus the state of the dialogue, and the list of what that state tracks. The AI's, open to the author's ruling: the six parts and which of them are data; the draft as a fenced block inside the node; the pin on the reviewed text; persistence derived rather than stored; the validator's rules. The tooling landed the same afternoon, and the migration of the existing nodes to these fields with it: every node at the review or ruling stage carries its recommendation, every proposed text is a draft section, and every node forwarded by a review carries the review's state with the hash of the draft it read; the frontier reads the stage and flags a review whose draft has changed since.

Facts: authority ratified; boldness high, the model being the AI's construction from the author's list; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: '## Draft, the recommended text when it differs from the node as it stands.' The reader accepts only four sections — Disposition, Answer, Rationale, Proposal (SECTION_ORDER in packages/disposition/read.mjs) — and rejects anything else with "unexpected '## Draft' heading"; 'recommendation' and 'review' are likewise absent from FRONTMATTER_KEYS. A node written to this answer today fails validation. The Proposal discloses that the tooling follows, which is the right disclosure; the answer should still say which of the six parts a node may carry now.
- Answer: 'The third fact, persistence, is derived and never stored: a node is standing.' Growth's presentation rule, which this node implements, lists six persistence values including 'a proposal that dies at the ruling, an un-aligned disposition, evidence, or not recorded'. Collapsing the fact to 'standing' for every node drops four of them without recording the divergence from the parent rule. Suggested edit: say persistence is derived for a node and stated in prose for anything else a sitting recommends.
- Answer: '## Disposition, the author's words, verbatim and dated' together with 'it is removed at the recording, when the author's words are quoted into the rationale'. The quotes sitting's recorded resolution is the opposite — 'the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting' — and authority makes a stamp invalid without the ruling in the node. Removing the section at the recording would invalidate the stamp written beside it. Suggested edit: exempt '## Disposition', or say what the roll-up leaves behind.
- Answer: 'review ... and of, the hash of the draft text the reviewer read.' Nothing computes it: blobSha1 hashes whole files, not sections, and the review subsections written on 2026-09-03 carry no hash. The one part of the model the node says has no prose precedent is also the only one with no producer named.

On the three facts: 'Authority ratified if the author confirms; boldness high, the model being the AI's construction from the author's list; persistence standing' is correct and honest — this and alignment-target are the only two facts lines in the batch that state a single class and a single boldness value, as growth's rule and this node's own 'recommendation' part require. It should add that no node carries these fields yet, so a confirmation ratifies a schema and a migration together, and that this batch's own sixteen reclassified nodes are non-conforming to it from the review stage on.

Strongest counter-argument (strong): The node's own test for storing anything is that it 'cannot be re-derived once the session that held it is gone', and three of the six parts fail it. The recommendation's class and boldness are judgments the next session would make again from the same node; the review's verdict and strength are re-derivable by re-running a review that the recording node already requires be re-run whenever the draft changes; and the draft is a copy of a node inside the file that holds it. What genuinely cannot be re-derived is the author's words and the stage — which the record already carried. So the model formalises as schema what prose was carrying, and pays four new fields, a hash with no producer, and a section the validator rejects, against transience's rule that only what re-derivation cannot reconstruct is stored.

The session's reply: The test is what re-derivation cannot reconstruct at a projection's cost. The recommendation's facts and the review's verdict are re-derivable only by running the judgment again, a sitting or a review, and the record stores the results of judgments for that reason, as it stores a stamp and a boost; the draft is not a copy of the node but differs from it by exactly the edit the author rules on, and the page shows that edit from the two. The hash's producer is the reader, deriveDraftHash, landed the same afternoon as this review, with the fields and the section; their absence at the time of reading was timing. Accepted: persistence is derived from the node's shape, standing for the node itself with each shim, evidence, and proposal in it named, as growth's presentation rule lists them; the recording removes the Disposition section only as the quotes ruling decides, the words being quoted into the rationale either way.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer: '## Disposition, the author's words, verbatim and dated' together with 'it is removed at the recording, when the author's words are quoted into the rationale'. Quotes' recorded resolution is the opposite — 'the verbatim ruling stays in the node, under Disposition with its date, rolled up at the next sitting' — and authority makes a stamp invalid without the ruling in the node. The session's reply says the removal happens 'only as the quotes ruling decides'; the answer does not say so. Suggested edit: put the contingency in the answer.
- Answer: 'The validator holds the parts together: a stage on every unanswered node and on no answered node except one under review; a recommendation from the review stage on; a forward verdict at ruling; a draft that parses and answers the node's question.' Verified partly true: read.mjs enforces stage-on-unanswered, the recommendation requirement, and draft parse-and-question; it does not appear to refuse a stage on an answered node not under review, since no answered node exists to test it. The claim should say which parts are enforced and which are latent.
- Answer: 'A node reaches the ruling stage only with a forward verdict.' Verified consistent with the record: the two kickback verdicts (public/agency, tier) sit at periagogic and maieutic. But second-stop carries a kickback verdict at stage review, which the rule does not cover.
- Rationale carries a prose tradition list ('the RFC and PEP processes ... review approvals pinned to a revision in code review ... the review of a change as a diff against what stands'), which readings' draft forbids; stub-traditions' enumeration does not name this node.

On the three facts: The frontmatter recommendation (ratified, high) states one class and one value and honestly names the model as the AI's construction. It should add that the migration is now complete — every node at review or ruling carries a recommendation and the graph validates — so the author is ratifying a schema already in force rather than a proposal.

Strongest counter-argument (strong): The node's own test for storing anything is that it cannot be re-derived once the session that held it is gone, and three of the six parts fail it: the recommendation's class and boldness are judgments the next session would make again from the same node, the review's verdict and strength are re-derivable by re-running a review the recording node already requires be re-run when the draft changes, and the draft is a copy of a node inside the file that holds it. The session's reply — that the record stores the results of judgments, as it stores a stamp and a boost — is a good answer for the recommendation and the review; it is weaker for the draft, which is genuinely a copy, and the batch shows the cost: eight drafts in this batch have drifted from the replies that amended them.

The session's reply: Validated. Amended tonight: the removal of the author's words at the recording is contingent on the quotes ruling, and the validator's latent refusal is named. Second-stop's kickback at the review stage is a recorded override. The traditions in the rationale go to readings. On the counter-argument, that three of the six parts are re-derivable: the record stores the results of judgments, and the draft is the copy the batch just showed can drift, which is why the hash pins it and the frontier flags it. Stage review.

### Frontier finding, 2026-09-03

Kind: decomposition.

Transience's un-aligned paragraph now enumerates the whole dialogue — 'the author's words, verbatim and dated, in a `## Disposition` section; the AI's account ... in a `## Proposal` section; `stage` ... and, from the review stage on, the recommendation's facts and the review's state as data' — which is dialogue's entire answer, and it states the status rule, which is unanswered's. Its own amendment review flagged the double definition of 'stage' and the frontmatter defines list was fixed; the prose enumeration was not. The result is that three nodes carry the same list and drift between them is invisible until they are read together, which is what this survey is for.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/unanswered.

Proposed: Dialogue is the survivor of what an unanswered node carries and unanswered of the status. Transience's un-aligned paragraph reduces to two sentences: that an un-aligned disposition is a node with a question and no answer, and that it carries the dialogue as dialogue defines it and has no children. Everything else in that paragraph moves to, or is already in, dialogue and unanswered. The five-shape taxonomy, which is what the node is for, is untouched.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Sitting' is the record's name for one run of the alignment dialogue and is used across growth ('each is a sitting in two separated stages', 'The sitting moves in order'), recording, dialogue, transience, alignment-target and roughly twenty Proposal headings ('### Sitting on purpose, 2026-09-03'). No node defines it: the parsed graph's 88 terms include 'periagogic', 'maieutic', 'propose', 'project', 'ratify' and 'steer' from growth, and no 'sitting'. Projection's draft requires every defined term to link to the node that defines it, so the word that names the record's central act is the one word the browser cannot link.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/recording.

Proposed: Growth is the survivor and adds 'sitting' to its defines, with one sentence in the answer saying what a sitting is: one run of the dialogue on one node, from its stage to the author's ruling. Recording and dialogue then use the term without redefining it. Two neighbouring gaps should be closed in the same pass: 'bootstrap grant', named by authority's shim and used in evaluation and materialization, is defined nowhere; [Superseded 2026-09-03: 'bootstrap grant' no longer names anything. The shim it named was struck when the author expired it, replaced by the unanswered-node model, under which what the AI writes when it opens a question is an unanswered disposition and exercises no authority. The gap survives under the successor term: 'bootstrap authority' is defined in its own shim text on `authority` and is still absent from that node's `defines`, and the answer does not define it, so `defines` is not the fix. The claim that the term is used in `materialization` was wrong when written; that node has never carried it.] and 'frontier item', used by transience and work-loop, rests on work-loop's 'frontier'.

### Frontier finding, 2026-09-03

Kind: coverage.

Sixteen nodes still carry the reclassification's generic prose Facts line, 'authority ratified if the author confirms, or delegated where the author's words delegate it; boldness ...; persistence standing': agency, recording, evaluation, attention, legacy, persistence, review, validation-order, work-loop, aristotle-hexis, software-factories, spec-driven-development, plato-maieutics, plato-periagoge, aristotle-arche-of-action and pettit-non-domination. Two of them (agency, recording) still say 'boldness as the rationale shows'. Dialogue requires 'one class and one boldness value from the review stage on', and each of the sixteen now carries a well-formed frontmatter recommendation that the prose contradicts. The alignment page renders both, so the author is shown two accounts of one stamp on a quarter of the frontier.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/recording.

Proposed: Dialogue is the survivor of the requirement. The sixteen prose Facts lines are rewritten to match each node's frontmatter recommendation, or deleted, since the recommendation field now carries the two facts and growth's presentation rule is satisfied by it plus each shim named in prose. Growth's presentation rule should say explicitly that the three facts are presented from the recommendation field and the node's shims, not from a prose line, so the duplication cannot recur.

### The author's second disposition, 2026-09-03

The author's words above, given during the sitting on alignment-order, answer this node's question differently from the draft the review forwarded: the dialogue's state becomes a recommendation, encoded as an answered node or a diff, and a list of alternatives, each with its source, the author, the AI, or the adversarial review, and the author's text attached to whichever it bears on. The stage returns to periagogic at the author's direction: the disposition is to survive periagogic and maieutic scrutiny, and the adversarial review is not to run on it. The bootstrap-authority grant in the last paragraph is conditional on that survival and is not in force; it names the reconciliation it covers, the unanswered-node encoding, the alignment skill, the alignment page, and the re-encoding of the whole unanswered frontier with merge analysis, and it is quoted here, on the node it bears on, before any implementation is written, as the authority shim requires. Two parts of the words are carried on the nodes whose questions they answer: the analysis of new question against new answer on frontier-consistency, and the marking of a surviving conflicting answer on unanswered.

### Probe answered, 2026-09-03

The periagogic movement closed on one probe, answered by the author in the words quoted above. The record uses "proposal" at two loci that do not say the same thing: this node's seventh part, `## Proposal`, "the AI's account in prose", and the authority node's proposal, what "would contradict doctrine or exceed its scope" and "has no authority and acts on nothing until the author rules". The probe: does the record anywhere say the dialogue's section is a proposal in authority's sense, or is the collision only in the name; and does the author's note, that a conflicting answer arising outside alignment is a proposal, state authority's definition as written or narrow it, since authority's sentence says nothing about where the answer arose. One fact was put before the author with the probe, as a fact and not an argument: the alternatives the author's model asks for already exist as prose, under "Rejected:" in every rationale, and the review's counter-arguments sit in the section the model would replace. The AI's adversarial evaluation of the model is owed after the author commits to the probe, as counterpoint cited by locus. The sequence the author set: periagogic, then maieutic, then the reconciliation under the conditional grant quoted above, with no adversarial review before it.

The author's answer, and what it does to the record. "Proposal" is technical vocabulary reserved for a conflicting answer that arises outside alignment: from an instrument, a criterion, a signal, or a conflict found in reconciliation. The collision is not only in the name. Authority's draft answer says a proposal is "a candidate answer, an amendment, or a finding with no authority, recorded in a stamped node or in a sitting's record", which folds the sitting's record into the term; the author's words narrow that sentence, and it is quoted on authority for the redraft. The other loci stand under the narrowed sense: authority's standing answer, which names what "would contradict doctrine or exceed its scope"; session-context's "prune-by-default proposal"; transience's "pending items are proposals". The one locus that falls is this node's seventh part, `## Proposal`, the AI's account in prose, which is not a proposal in the narrowed sense and loses the name. The author retracts the flip of an answered node to unanswered pending confirmation, stated in the disposition above and carried on unanswered; the record already agrees with the retraction, since unanswered's answer makes the status derived, never a field, and keeps an answered node's stamp while its dialogue is open. The refinement delegates the encoding's details and fixes the function: a reader of an answered node sees the alternatives pending on it, from outside alignment as proposals and from inside it as alternate answers awaiting confirmation; a question carries active dialogue state or none; active state carries a recommendation from the first maieutic movement on, a whole node or a diff, which may change on kickback or as the frontier moves; at the recording the confirmed state is folded into the node and survives otherwise only in history. The AI's adversarial evaluation of the model was put to the author as counterpoint in the same turn, cited by locus, and the maieutic movement opened on two bindings: whether a standing answer keeps its authority while an alternative is pending on it, and whether a proposal entering from outside alignment opens the dialogue on its node at the periagogic stage.

### Maieutic closed, 2026-09-03

The two bindings put to the author are answered in the words quoted above, and the disposition survives the periagogic and maieutic movements with one change the author made themselves, the retraction of the flip to unanswered. First: a standing answer of any class, ratified, delegated, or deferred, keeps its full authority while an alternative is pending on it, until the author confirms an alternative; the alternative is visible and inert. Second: a proposal from outside alignment opens the dialogue on its node, and the frontier ranks it. Third, on the AI's stated decision to hold the recommendation as a whole node: the author observes that a whole node goes stale as easily as a diff and asks for the recommendation to be pinned; the encoding answers with a pin on the recommendation, the hash of the standing text it was drafted against where the node has one and the graph commit it was drafted at, so the frontier can show a recommendation whose ground has moved, as it already shows a review whose draft has moved. The adversarial review does not run before the reconciliation, at the author's direction; the reconciliation now proceeds under the conditional grant quoted above, which is in force from this point, and the review runs on what it writes.

### Reconciliation owed, 2026-09-03

Not begun. The grant is in force and the reconciliation runs after the session's next compaction, at the author's direction. What it covers, so that a session resuming from this node can run it without the context that held it. The encoding, whose details the author delegated, as decided so far: a node is its question, its fields, and its standing answer with its stamp when it has one, and while a dialogue is active on it the dialogue state; the status unanswered stays derived. The dialogue state carries `stage`, the author's words verbatim and dated, the alternatives, each with its source, the author's words it rests on, the AI, the clean-context review, or a proposal from outside alignment naming the instrument or the node that raised it, the recommendation, which names the alternative it adopts, carries the class and boldness, and is pinned to the standing text it amends and the graph commit it was drafted at, its text one fenced block holding the whole proposed node with the diff derived for the page, the review's verdict, strength, date, and the hash of the recommendation it read, and the AI's account in prose, which is not a proposal and loses that name. A standing answer of any class keeps its authority while an alternative is pending. A proposal from outside alignment opens the dialogue at periagogic. Confirmed dialogue state folds into the node at the recording and survives otherwise in history. The steps, graph first: redraft this node's answer, unanswered, authority, and frontier-consistency, and amend the loci that name `## Proposal` as the account, transience, growth, node, recording, and clean-context-review, each stamped deferred at the review stage; re-encode every node of the unanswered frontier, with the merge analysis of each disposition as a new question or a new answer on another node, and the findings that name other nodes moved to those nodes as alternatives; validate and land at `origin/disposition`. Then the implementation on the implementation ref: the reader, validator, and projector for the new fields and sections, the frontier's staleness flags for the recommendation's pin as for the review's, the alignment page's rendering of alternatives beside the standing answer, the browser's rendering of a stamped node's pending alternatives, the align skill and the reconcile skill where they name the old parts, and the tests; one commit naming this grant and the graph commit it follows. The record of the alignment-order sitting waits behind this one.

### Reconciliation, 2026-09-03

Run under the author's bootstrap grant on this node after the session's compaction, at the author's direction. What the graph landing carries. Every node is re-encoded: the account section, formerly named the proposal, and the recommended text, formerly the draft, renamed; the alternatives pending on each node written as data from a census of the sixty-seven nodes taken in six cohorts, each alternative with its source, and each node's account closing with a re-encoding subsection naming its alternatives, what its recommendation adopts, the merge analysis of the author's words on it, and what was moved to other nodes; every recommendation given `adopts`, `amends`, and `at`, pinned to the standing text at graph commit 6d21d356, whose hashes the re-encoding preserved exactly, so that no recommendation is stale against its standing text and every review's pin is what it was; this node and node were re-pinned once more at 9e3a6624, after their defines were amended to end two vocabulary collisions. The eight option nodes of the sitting on purpose, forms, hexis, purpose-criteria, quotes, rationale-edge, rejected, second-stop, and traditions-home, had a recommendation with no answer and no text; each now carries a `## Recommendation` fence drafted from the option its account marked recommended, and each returns from the ruling stage to the review stage with its review removed, since that review read the options and not the text. Audience's recommendation is a prune, encoded as a prune alternative in the author's words with no fence; an alternative that folds a node into another is marked a prune as well. Alternatives the six cohorts raised on one node under different names were merged, thirty merges over twenty-four nodes, and alternatives the redrafts of this day had already carried into a standing answer were removed, seven on authority, dialogue, and unanswered; the merges are recorded on each node's account. The specification the units worked from, the census, the option drafts, the merge plan, and the scripts are scaffolding in `tmp/reencode-2026-09-03/` on the implementation checkout and are not the record.

Two things the landing leaves as they are, for the author's sight. Twenty-six nodes carry a review whose pin no longer matches the text it read, because the sitting amended them after their review; the frontier flagged them before this reconciliation and flags them still, and the clean-context review of the batch re-reads those at the review stage. Rejected's account favours its third option while its marker and its recommendation name the first; the recommended text follows the marker, and the discrepancy stands in its account for the review.

The implementation landing that follows names this grant and the graph commit: the reader, validator, and hashing to the encoding; the projector, the alignment page, and the browser to the projections this node's answer describes; the alignment and reconciliation skills to the encoding and the narrowed sense of proposal; the adversarial review skill to the batch scope, the fifteenth validation, and the renamed sections; the tests of each. The rules are regenerated, since authority is global-tier, and both pages republished. Then the clean-context review on the batch. The alignment-order sitting still waits behind.

### The grant discharged, 2026-09-03

Every step above is landed: the re-encoding at 9e3a6624 and ec825043, the implementation at d96ef200 on the implementation ref, the rules regenerated, both pages republished, and the clean-context review of the batch at ae89292b, thirty-six nodes forwarded to the ruling stage and rejected kicked back to the maieutic stage, with the review's findings and the session's replies on the nodes they name. The bootstrap grant on this node is spent with this landing; the alignment-order sitting, and the author's rulings on the alignment page, come next.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, the `depends` part: 'the ids of unanswered nodes that must be answered before this node can be, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on.' Verified that no node in the graph carries a `depends` field (`grep -rl '^depends:' disposition/` returns nothing) while twenty-three node files still carry the `Depends on:` prose convention it replaces, and that project.mjs reads the field nowhere. The node's own account says the field is 'recorded before its instrument exists, which the frontier will show'; the frontier shows nothing about it, so the one disclosure that would surface the gap is itself false.
- Frontmatter, recommendation `at`: '9e3a6624'. Verified this is an eight-character abbreviation where forty-eight other nodes carry the full forty-character sha of 6d21d356, and that dialogue's own reconciliation account says every recommendation is 'pinned to the standing text at graph commit 6d21d356, whose hashes the re-encoding preserved exactly' — which is false of this node and of node.md, both re-pinned at the later commit. The node that defines the pin is one of the two that does not follow the account of how the pins were written. Suggested edit: fix the format and correct the account's blanket claim.
- Answer, the `## Disposition` part: 'the author's words, verbatim and dated, accumulating through the dialogue', with the removal at the recording made contingent on quotes. Verified the contingency is now in the answer, which the previous review asked for. Quotes is in this batch and unruled, so this node's shape for the most-read section of every node is decided elsewhere.
- Answer: 'The validator holds the parts together' — verified substantially true: read.mjs enforces stage-on-unanswered, the recommendation requirement from the review stage, the alternatives' names and their subsections, a `## Recommendation` fence exactly when the recommendation adopts an alternative, and every `depends` id resolving. The graph validates at 68 nodes. The claim that a forward verdict is required at ruling is enforced only in the sense that nothing yet reaches ruling by another route.
- The node carries thirteen dated author quotations, more than any other in the batch, and its answer is the longest. Both are the record working as designed; both are also the strongest instance of the accumulation that quotes' counter-argument names and that this node's own `fidelity` child was minted to measure.

On the three facts: The frontmatter recommendation (adopts standing, ratified, high) states one class and one value and honestly names the model as the AI's construction from the author's list; high is right. The `amends` pin matches the standing text, so the recommendation is not stale — but the `at` field carries an abbreviated commit where every other node carries a full sha, on the node that defines the field. Persistence standing follows from the node's shape.

Strongest counter-argument (strong): The node's own test for storing anything is that it cannot be re-derived once the session that held it is gone, and three of the seven parts fail it: the recommendation's class and boldness are judgments the next session would make again from the same node, the review's verdict and strength are re-derivable by re-running a review the record already requires be re-run when the text changes, and the recommended text is a copy of the node inside the file that holds it. The session's answer — that the record stores the results of judgments, as it stores a stamp and a boost — is a good answer for the first two and weak for the third, and this batch is the evidence on both sides: the copy did drift on eight nodes, and the pin is what caught it.

The session's reply: Forward accepted, and two findings taken directly: the `at` pin on this node and on node is written as the full sha at this landing, and the account's claim that the frontier shows the depends gap is corrected to say it does not, so the at-pin-format alternative is not recorded. The depends-migration-named alternative is recorded for the author.

### Frontier finding, 2026-09-03

Kind: coverage.

Dialogue's answer makes `depends` the seventh part of the dialogue state — 'the ids of unanswered nodes that must be answered before this node can be, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on' — and the validator enforces it ('every `depends` entry must resolve within this graph, must not repeat'). Verified that no node in the graph carries the field: `grep -rl '^depends:' disposition/` returns nothing, while twenty-three node files still carry the `Depends on:` prose convention the field was added to replace, and every batch node in this brief reports 'Depends: none'. Verified further that the projector reads the field nowhere: `depends` appears in project.mjs only in a comment listing the dialogue's own state, so the frontier emits nothing for it. Dialogue's own account says the consequence is disclosed — 'the field is recorded before its instrument exists, which the frontier will show' — and the frontier shows nothing, so the disclosure is itself false. Alignment-order, at the periagogic stage, records the same fact independently: 'No node in the record carries the field, and the projector does not read it; the coverage node carries "Depends on: `audience`" in prose instead.'

Also named: commons.systems/disposition-graph/alignment-order.

Proposed: Dialogue is the survivor of what an unanswered node carries and nothing moves; what is owed is that the node say what it in fact has. Either the migration of the twenty-three prose conventions is named as part of what a confirmation orders, with the projector and the alignment page reading the field, or the answer says the field is defined and unused and that the prose conventions stand until the migration is ruled — which is the honest reading of the record today. The claim that the frontier will show the gap should be struck or made true, since it is the only thing standing between this gap and invisibility.

Recorded as a pending alternative on this node: `depends-migration-named` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: coverage.

Un-aligned-children's account carries a '### Facts' section stating 'Authority none: an un-aligned disposition in the author's words, recorded at their direction and carrying no answer', 'Persistence open, until the author rules', and, in the paragraph below it, 'The movement owed is periagogic and has not been run'. All three are contradicted by the node's own frontmatter, which carries `authority: class: deferred, by: claude, date: 2026-09-03`, a standing answer, `stage: review`, and `recommendation: adopts standing, class: ratified, boldness: low`. Because the alignment page renders the account beside the recommendation, the author is shown a node that says it carries no answer and owes a periagogic movement, on a page that puts it up for a ruling. This is the sharpest instance of the defect the coverage finding of 2026-09-03 records as the sixteen generic prose Facts lines: dialogue requires 'one class and one boldness value from the review stage on', and here the prose and the data disagree not about the class alone but about whether the node has an answer at all. The node carries no pending alternatives, so nothing on it records the finding.

Also named: commons.systems/disposition-graph/un-aligned-children, commons.systems/disposition-graph/growth.

Proposed: Dialogue is the survivor of the requirement and growth of the presentation rule; neither text need change for this node. Un-aligned-children's stale '### Facts' section is superseded by its own later '### Answered on the author's ruling, 2026-09-03' section and should be struck or marked superseded rather than left standing beside a contradicting frontmatter — the alternative below is the vehicle, since the review proposes and never edits. Growth's already-pending `facts-from-recommendation-field` alternative is what closes the class at its source, by saying the three facts are presented from the recommendation field and the node's shims and never from a prose line; taking it would make this and the sixteen other instances unrepresentable rather than fixed one by one.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Counts and implementation claims recorded across the batch's review sections have moved under them, and several are cited by pending alternatives as though current. Verified against the graph as it stands: `node packages/disposition/validate.mjs disposition` returns 'ok: 68 nodes', not the 62 that eight recorded findings assume; twenty-three nodes carry no '## Disposition' section, not twenty-two; the `defines` fields hold 117 entries, not the 88 the vocabulary findings cite; no node file ends in a bare 'null' (`grep -rn '^null$' disposition/` returns nothing), so the coverage finding of 2026-09-03 on the four bare nulls is discharged; `apply.mjs` and `brief.mjs` exist and are tracked, so the align-review shim's artifact claims hold; and browser-template.html carries an `authorityHtml` function rendering an authority block, so the earlier claim that 'there is no authority section' is stale, while 'unguarded' and 'criteria' still do not occur in it at all. The record's own rule, stated on authority, is that recorded review findings are annotated where they stand rather than rewritten, so none of these is a defect in the sections that carry them; the defect is that quotes' pending `facts-state-the-count` alternative asks the node's facts to state a count, and the count it names is already stale.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/recording.

Proposed: No node's text is wrong and nothing moves. What is owed is that a count the author is asked to ratify be measured at the ruling rather than fixed in prose: quotes' facts state the bar as measured when the author rules, and the review skill's own briefs carry the counts, so the number the author sees is derived. Recording's counter-argument makes the general form of this point — most of what the review checks is mechanical — and frontier-consistency's validations 3, 5 and 11 are the natural home for the checks that would keep these numbers true.
### Finding: a first answer is presented as an amendment, 2026-09-03

Kind: reconciliation, and a rule this node's answer does not carry. Raised by
the author, 2026-09-03, on the alignment page:

> nodes (eg. commons.systems/disposition-graph/purpose) still indicate that
> they are edits to confirmed dispositions (there appears to be a ground
> version that is being diffed) even though no node is yet confirmed. This
> appears to be bootstrap encoding artifact. purpose node is a confirmation
> ruling for a node that does not yet exist on the reconciliation frontier
> (only on the alignment frontier).

Measured against the record at graph commit 4b75af10 and re-counted
independently in clean context at 46070795. Twenty-six nodes carry no
`authority` stamp. Ten of those carry both a body `## Answer` and a
recommendation with an `amends` pin: alignment-order, forms, hexis,
purpose-criteria, purpose, quotes, rationale-edge, rejected, second-stop, and
traditions-home; all ten also carry a `## Recommendation` fence. On each, the
alignment page prints a "no stamp" pill, renders "The node as it stands" from
the body answer, then the draft, then the word-level edit between them, under
the caption "Confirm ratifies the draft as the node. The node as it stands is
what remains if you deny."

The caption is false on those ten. Nothing stands. If the author denies, what
remains is an unstamped AI draft, which the unanswered node says is not an
answer, and the question stays open. The author's example is the sharpest case
available: `purpose` is second in the ruling order and settles sixty-six, so it
is the node the author rules on next, and it would be ruled on under a caption
that misdescribes the ruling. `purpose` has never carried a stamp in its
history; the one `authority:` line in the file today is inside the
`## Recommendation` fence.

What this node's answer does and does not say. It says how the recommendation
is encoded, that the fence holds the whole proposed node, and that the page
"derives the edit, field by field and word by word, beside the whole". Showing
an edit is therefore licensed. What the answer nowhere says is that a ruling
which gives a first answer is a different act from a ruling which amends one,
or that the projections must say so. That is the rule the record lacks, and it
is why the projector, obeying the answer exactly, produces what the author saw.

### The finding corrected in clean context, 2026-09-03

An earlier draft of this finding, and the alternative
`no-standing-without-a-stamp` drafted with it, were checked adversarially by a
subagent in clean context before the author saw them, as the evaluation node
requires. Its verdict was sound with corrections. The census, the file list and
the description of the artifact were confirmed exactly. Three claims were not,
and the draft is corrected here rather than carried to the author.

First, the draft said "The projection has no field it could read to know the
difference, because the record does not record one." That is false. The field
is `authority`, its absence is the difference, and the implementation already
reads it: `deriveStatus` branches on it, the browser prints an "unstamped"
label, the alignment page prints a "no stamp" pill on these very nodes, and the
page's own field-level edit already renders the line `authority: none -> {...}`.
What the record lacks is not a field but a rule making the presentation
conditional on it. The correction is recorded and the claim is withdrawn.

Second, the draft argued that showing a change against a landed baseline is the
reconciliation frontier's idiom, borrowed here for a node not on that frontier.
Half of that holds and half does not. The work-loop node does put the
reconciliation frontier over answers whose instrument fails and does say that
un-aligned dispositions are alignment's work and never reconciliation's, so a
node with no answer is on the alignment frontier only. But nothing in
`work-loop` or `materialization` makes the diff reconciliation's idiom, and
this node's own rationale records the opposite: "the review of a change as a
diff against what stands" is listed there among the traditions this encoding
adopts, from code review, in alignment. The argument was a gloss on the
author's sentence and not a reading of the record. It is withdrawn.

Third, the draft cut the line at the stamp: a stamp of any class confers
standing, no stamp confers none, so `amends` would be present only on stamped
nodes. Two things in the record refuse that cut. The author ruled on
`un-aligned-children` on 2026-09-03 that what an unanswered disposition lacks
is authority and not standing, which the alignment skill's shim states in that
form; taking the name `standing` away from unstamped nodes contradicts the
author's own ruling. And the pin does not presuppose an answer in the first
place: `deriveStandingHash` hashes the empty string for a missing `## Answer`,
so `amends` is computable on any node and works as the staleness pin the author
asked for on 2026-09-03, "we need some sort of pinning of the recommendation as
well". Making `amends` conditional would also break validation as implemented,
which requires all five recommendation keys with `amends` matching the hash
pattern. The alternative was withdrawn and replaced by
`first-answer-is-not-an-amendment`, which leaves `amends` and `standing` alone
and adds only the presentation rule.

The validation also surfaced author's words already in this node's Disposition
that the draft had not weighed, from the refinement of 2026-09-03: "Since all
nodes are currently unanswered we expect every recommendation to be a node, not
a diff." Read with the answer's own sentence, "While nothing is answered every
recommendation is a whole node; a diff is derived from it and never stored",
the author's sentence is about how the recommendation is stored, which the
record honours, and not about what the page renders. It does not settle the
presentation question, but it is the closest thing in the record to the
author's intent on it and the sitting owes it a reading rather than a silence.

Its strongest counter-argument, recorded as the alternative `caption-only`: the
defect is fully fixable in the projector, since the data is already there, the
author's pin request was about staleness which `amends` already serves, and an
encoding change buys nothing that a conditional caption does not. The reply is
in that alternative: what it gives up is that no disposition would then require
the distinction, so a later projector, or the projected alignment skill, could
caption a first answer as an amendment again and contradict nothing.

Two things an executor would still not know, named so the next movement
resolves them rather than discovering them. Where a superseded body draft would
go if it were ever listed as an alternative: left in `## Answer` it still
renders as "the node as it stands", and removed it costs the node the answer
its form requires and flips its frontier label to un-aligned. And on `purpose`
the fence is already the alternative named `draft`, so a second AI alternative
would leave two with no rule saying which the fence quotes. Neither bears on
`first-answer-is-not-an-amendment`, which proposes no such listing; both
belonged to the withdrawn alternative and are recorded so the withdrawal is
legible.

The two alternatives are on the table and neither is yet the recommendation.
This node's maieutic movement is also open on the aspect-decomposition half of
the author's dispositions, which is the probe outstanding on
`commons.systems/disposition-graph/alignment-page`, and the recommendation is
redrafted once when both halves are settled rather than twice.

The standing `recommendation` on this node, which adopts `standing` with a
forward review of 2026-09-03, is superseded by the author's words of the same
day and is left in place only so that the review pin it carries is not lost. It
is not what this node now recommends.

### The unit of a ruling: analysis and the data model, 2026-09-03

The author ruled on 2026-09-03 that the record carries a decision per aspect,
that each aspect may have choices requiring confirmation, and that each aspect
has a recommendation with its own boldness. What follows is the analysis they
asked for, of the data model and of the cascade across the alignment frontier.
It is an account and not yet a recommendation: it goes to a clean-context
validation before it reaches the author, as they directed.

#### What an aspect is, and the constraint that makes it work

The author also asked that the whole disposition render live and reflect the
choices made in the confirmation list. That single sentence fixes the model,
because the session cannot pre-write a render for every combination of choices:
with five aspects of two choices each there are thirty-two, and the prose of a
node is not thirty-two texts. The render must therefore be assembled, and
assembly is only mechanical if each choice owns a bounded piece of the node.

So an aspect is a decision whose choices differ only within one slot of the
node, and a slot is either one frontmatter field or one named section. A choice
whose effect ripples outside its slot is not an aspect: it is a whole-text
candidate, and it belongs to the aspect named `answer`, whose choices are whole
nodes. That constraint is what makes the live render derivable, and it is also
the model's degradation path, which matters for the bootstrap: a node with the
single aspect `answer` carrying whole-node choices is exactly the encoding in
force today, so every node in the record migrates without loss and gains
aspects only when a sitting has reason to split one.

#### The encoding

`alternatives` and `## Alternatives` are replaced by `aspects` and `## Aspects`.
The node-level `recommendation` keeps only its pin. `class` and `boldness`
leave it: the class a confirmation confers is the adopted choice of the aspect
named `authority`, and boldness is a field on every aspect, which is what the
author asked for.

```yaml
recommendation:
  amends: <sha1 of the standing text>
  at: <graph commit the aspects were drafted at>
aspects:
  - name: answer
    slot: "## Answer"
    boldness: moderate
    adopts: draft
    choices:
      - name: standing
      - name: draft
        source: ai
        ref: "2026-09-03"
  - name: authority
    slot: authority
    boldness: low
    adopts: ratified
    choices:
      - name: ratified
        source: ai
        ref: "2026-09-03"
      - name: delegated
        source: review
        ref: "2026-09-03"
    ruling:
      response: confirm
      choice: ratified
      date: 2026-09-03
```

Each aspect carries a `name`, unique in the node; a `slot`, the frontmatter
field or the section its choices write; a `boldness`, low, moderate or high, in
the meaning the author kept, how much of the recommendation for this aspect
rests on the AI's own knowledge against the record and the author's words; an
`adopts` naming one of its own choices; and `choices`, at least one, each with
a `name`, a `source` and a `ref` exactly as `alternatives` carried them, so the
provenance the record already keeps is not lost in the move. `## Aspects` holds
one subsection per aspect, in order, saying what the aspect decides and what
each choice would answer, which is what `## Alternatives` held.

`ruling` is written on an aspect when the author rules on it: the `response`,
confirm, edit or deny, the `choice` confirmed, and the date. The author's words
themselves are not duplicated here; they go into `## Disposition` verbatim and
dated, as the quotes node requires, and the ruling points at them by date.

`## Recommendation` stops being one fence holding the whole proposed node. Each
choice carries the text of its own slot, the `answer` aspect's choices carrying
whole nodes as the fence does today, and the whole render is assembled from the
adopted choice of every aspect. The assembled node is derived and never stored,
which is what this node's answer already says of the diff.

#### Which aspects reach the confirmation list

The author asked that very high confidence and default elements be left out of
the list and simply appear in the render. That is derived and not stored: an
aspect reaches the list when it has more than one choice, or when its boldness
is high; an aspect with one choice and low or moderate boldness renders in the
context pane and asks nothing.

One trap is worth stating plainly, because getting it backwards would invert
the whole page. Boldness measures how much rests on the AI's own knowledge
against the record, so high boldness is low confidence. The author's fold rule
is phrased in confidence, "very high confidence ... can just be included in the
final render", and the stored fact is its inverse. The page must therefore fold
on *low* boldness and ask on *high*. This is the sharpest reason the author's
retraction of the rename was right: confidence is the presentation of the fact,
boldness is the fact, and only the fact belongs in the record.

#### The stamp, and what partial confirmation confers

A node keeps one stamp. It is written when every aspect has been ruled, dated
at the last ruling, with every ruling quoted, and its class is the adopted
choice of the `authority` aspect. Until then the node is unanswered whatever
subset of its aspects the author has confirmed. So partial confirmation is a
state of the dialogue and never a state of the answer, which keeps the
authority node's rule intact, that a ratified stamp whose ruling is not in the
record is invalid, and avoids inventing a per-aspect stamp that would let a
node be half doctrine. It also gives the alternative `partial-ratification`,
raised by the clean-context review on `growth` and unruled, its answer.

#### Persistence

This node's answer says persistence is derived from the node's shape and never
stored, and the author names it as something that may need confirming. Both
hold if persistence is an aspect exactly when the recommendation would change
the node's shape, declaring or liquidating a shim, adding or dropping evidence,
and its choices are then the shapes. Otherwise it is derived, renders in the
context pane, and asks nothing.

#### What does not become per-aspect

The review stays per node. The clean-context review reads the whole draft
against the graph, so its verdict is on the assembled recommended render, with
`of` pinning that render's hash; a kickback may name the aspects it faults, and
those go to `## Account` as findings do now. A per-aspect verdict would
multiply the batch by the aspect count and buy nothing the reviewer does not
already see. The stage stays per node for the same reason: an aspect has a
ruling or it does not, and the node has a stage. And the settling count stays
over nodes, so the ruling order is untouched; aspects are a second granularity
inside a node and do not enter the order.

#### The cascade

Fourteen nodes carry text this ruling changes. Eight of them are at the ruling
stage with a clean-context review of 2026-09-03 behind them, and that review is
spent on each: this is the cost of the ruling and it is the largest single
thing the author is being asked to accept.

At the ruling stage, and to be kicked back when this is confirmed: `recording`,
whose response classification must handle a node with some aspects confirmed
and others denied, and which must say the stamp is written only when every
aspect is ruled; `authority`, which needs the sentence that a stamp covers the
whole node so partial confirmation confers nothing; `clean-context-review` and
`frontier-consistency`, for the review reading an assembled render and for the
validations the new fields need; `quotes`, since there is now a ruling per
aspect and all of them are quoted; `checkpoint`, since a ruling on one aspect
is a transition that lands before the next; `validation-order` and `forms`, for
the validator's rules and the shape a node must have.

At the review stage: `alignment-order`, for one sentence that the order is over
nodes and that aspects do not enter it.

At the maieutic stage already, and carrying the author's words: `dialogue`,
where the encoding lives; `unanswered`, whose answer opens the three responses
"on any subset of them", meaning the nodes, and must now open them on the
aspects within one and on the whole render besides; `growth`, whose
presentation rule states three facts of a recommendation that are now a fact
per aspect, whose alternative `partial-ratification` is directed by the
author's words, and whose `defines` keeps boldness, the rename retracted.

Elsewhere: `transience`, one sentence on when persistence becomes an aspect;
`rejected`, since rejected choices fold into the rationale per aspect;
`alignment-page`, the projection itself, which is the node in hand; and
`fidelity`, where a dated ruling per aspect is a stronger hold on the author's
intention than one whole-node stamp, which is that node's open question.

Those eight are left at the ruling stage for now, and deliberately. Kicking
back a third of the frontier on an analysis that has not been validated would
cost more than it protects, and the author is ruling in the dialogue and not on
the page. The exposure is real and is recorded here: until this is confirmed
and the kickbacks are made, the frontier shows those eight as ruleable under a
rule the author has already changed.

#### What this analysis does not settle

Whether an aspect's slot can be a paragraph rather than a whole section, which
decides how fine the decomposition can go before the prose stops composing.
Whether a choice may itself carry aspects, which the model as drafted forbids
and which would be the natural request the first time an answer's choice
implies an authority class. And what happens to an aspect's `ruling` when a
later aspect's ruling changes the text its choice was written against, which is
the staleness problem the pin solves at the node level and which the model as
drafted does not solve within a node.

#### The analysis corrected in clean context, 2026-09-03

The analysis above was checked adversarially by a subagent in clean context
before it reached the author, as the author directed and as the evaluation node
requires of the AI's own recorded output. Verdict: sound with corrections. The
per-aspect model is faithful to the author's ruling and the stamp rule holds.
Eight things do not, and are corrected here rather than carried.

**The slot constraint degenerates as drafted, and this is the serious one.**
The analysis defined a slot as one frontmatter field or one named section. Test
that on the alternatives the record actually holds and the model collapses. Of
this node's own six, `freeze-standing-under-recommendation`,
`depends-migration-named`, `depends-names-an-alternative` and
`first-answer-is-not-an-amendment` are each a clause or a paragraph inside
`## Answer` and are mutually independent, so under a section-sized slot all
four fall into the single `answer` aspect, which would then need up to sixteen
whole-node choices to express their combinations. On `projection`,
`narrowing-disclosed`, `name-what-it-does-not-settle` and
`strike-the-field-link-clause` are single clauses, and
`hold-for-self-documentation` and `absorb-self-documentation` are sequencing
proposals that touch no slot at all; only two of eight are slot-confined. On
`purpose`, two of six. The record's own proto-aspects, the option-nodes the
review named on `purpose` under `fold-option-nodes`, are one paragraph-level
(`hexis`), one field-level (`purpose-criteria`) and one whole-node
(`second-stop`). So with section-sized slots the author gets one aspect per
node plus `authority`, which is today's page with a second pill.

The correction: a slot is one frontmatter field, one named section, **or one
paragraph of a section, identified by its ordinal**. That is what makes the
model deliver anything, and it is also the model's real cost, which the
analysis had filed as an open question rather than as the load-bearing
decision it is. Prose decomposed to the paragraph must still compose, and
nothing yet says who checks that it does.

**A rival is on the table and it is cheaper.** Recorded as the alternative
`ranges-on-whole-node-alternatives`: leave `alternatives` whole-node as they
are, add to each the range of the node it touches, and let the page derive list
A by grouping alternatives whose ranges do not overlap. It reaches the author's
page without replacing the encoding, without migrating seventy node files, and
without spending the clean-context reviews of 2026-09-03. What it gives up is
the author's own words, that the *record* carry a decision per aspect: under it
the record carries whole-node candidates with a hint, and an aspect on which no
alternative was recorded, the authority class among them, has no row of its own
and no boldness of its own.

**The record contradicts itself on which direction boldness runs, and the
analysis leaned on the wrong half without noticing.** The author, this node,
and the usage across the graph all measure how much rests on the AI's own
knowledge against the record. But `growth`, the node that `defines` the term,
words it the other way, "how much of it rests on the record and the author's
words against the AI's own knowledge", and the alignment skill repeats
`growth`'s direction. The two are inverse scales, so the same node stamped
`boldness: high` means well-grounded under one and least-grounded under the
other. This is a contradiction within the graph, independent of the present
ruling, and it is exactly what the fold rule would have inverted. The cascade
must correct `growth`'s definition sentence and the skill's line, not merely
add a fact per aspect.

**The fold rule is incoherent at two corners.** As drafted, an aspect reaches
the list when it has more than one choice or when its boldness is high. So an
aspect with one choice and moderate boldness folds silently, though the author
folds only what is very high confidence; and an aspect with several choices and
low boldness asks, though it is the case the AI is surest of. And "derived,
never stored" is a fiction here: the session decides the list by deciding
whether to record a second choice, so folding an aspect means deleting its
provenance. Either fold only on `low` boldness, or store an `asks` override the
session sets and the account justifies.

**The cascade list is wrong in membership.** `validation-order` answers
"functional before non-functional", which is about landings and not the graph
validator, and `forms` says "Nothing migrates under this answer": neither
carries text this ruling changes, and both are struck. Two nodes were missed
and both do: `node`, at the maieutic stage, whose answer says a node carries
"the alternatives pending the author's ruling, each with its source, and the
recommendation among them"; and `madr-decision-records`, at the ruling stage,
whose answer maps the encoding onto the MADR tradition term by term, "the
alternatives with their sources are the considered options, the recommendation
naming the alternative it adopts is the decision outcome". Two others were
under-scoped: `alternatives` runs through five sentences of `alignment-order`
including the `depends` qualifier, not one, and `transience` describes the
alternatives as data with a subsection each, not one sentence on persistence.
The total stays fourteen by coincidence; the ruling-stage count falls from
eight to seven, and the frontier holds thirty-nine nodes at that stage, so the
analysis's "a third of the frontier" was wrong and the figure is seven of
thirty-nine.

**The migration is not lossless.** Three things do not survive as claimed. The
record uses `prune` alternatives, on `audience`, `purpose-criteria`,
`second-stop` and `self-documentation`, which propose removing the node and
therefore write no slot at all, so the model has no shape for them. Listing
`standing` as a choice contradicts this node's own answer, "The node as it
stands is always a candidate and is never listed". And migrating the
node-level `class` into an `authority` aspect invents a boldness that no
sitting assessed. In implementation, `derive.mjs`'s `stripDialogueFrontmatterLines`
strips `stage`, `recommendation`, `review`, `alternatives` and `depends` and
would not strip `aspects`, so unless it is updated in the same landing every
`amends` pin in the graph goes stale at once.

**A ruling needs its own pin, and `quotes` needs more than the analysis
allowed.** The analysis deferred what happens when a later ruling moves the
text an earlier aspect's ruling was given against. That is the defect the pin
was invented for and it should be settled, not deferred: `ruling` carries
`of`, the hash of the choice text ruled, exactly as `review` carries its own.
And `quotes` says "the ruling a stamp requires is the one the author gives at
that sitting"; a stamp assembled from rulings across several sittings has no
single sitting, so that node changes substantively and not by one clause.

**Two more things the analysis passed over.** The author's drill-down of
"author quotes" per list-B row has no data path: `## Disposition` is per node
and dated, and a choice carries only a `ref`. And confirming a choice the
recommendation did not adopt produces a render the review never pinned, which
under the `unanswered` node sends it back to review, so every row of list B is
potentially a review round; the page must say so or the author will confirm a
non-adopted choice expecting it to land.

The analysis is left standing above with these corrections against it, rather
than rewritten, so that what was drafted and what the validation changed are
both legible. The recommendation is drafted from the corrected analysis, not
from the analysis, and is not drafted yet: this node still owes the author a
choice between the corrected aspects model and
`ranges-on-whole-node-alternatives`.

#### The recommendation, evaluated greenfield, 2026-09-03

The author, 2026-09-03:

> Make recommendation based on best greenfield design - not brownfield cost
> savings. Nothing is doctrine yet, barely anything is materialized. Does the
> recommendatino survive?

Taken as the evaluation node requires: no doctrine is implied by what exists,
least of all by the incumbent implementation. Applied here it strikes a whole
class of argument from the table, and the answer to the author's question is
that the recommendation does not survive in the form it was drafted. It is
replaced by a stronger one, and the rival dies.

**The rival dies first.** Every argument for
`ranges-on-whole-node-alternatives` was cost: no encoding replaced, no seventy
files migrated, no clean-context reviews spent. Struck. What is left of it is
its design, and its design is worse on three counts that have nothing to do
with cost. It stores the answer and derives the question, when the decision is
the primary thing and the text is what results from it, so k independent
decisions are carried as k whole texts the reader must diff to recover them.
It repeats the whole node in every alternative, so a sentence nobody is
deciding about going stale stales every alternative at once. And an aspect on
which no textual rival was ever recorded, the authority class the author named
first, cannot be a row at all, which fails the author's requirement outright
rather than marginally. It stays recorded as a rejected line.

**The drafted model does not survive either, and the reason is instructive.**
Its one serious defect was that prose written whole does not decompose: the
validation showed four of this node's own six alternatives collapsing into a
single `answer` aspect under a section-sized slot, and the paragraph-slot
correction bought the decomposition at the price of requiring prose carved to
the paragraph to still compose. Greenfield asks why the prose is written whole
in the first place. It is written whole because that is how the incumbent
record was written, before there were aspects to write it as. That is a
brownfield fact and it was doing the work of a design constraint.

**The recommendation: `aspects-compose-the-answer`.** A node's answer is not a
text that aspects carve up. It is composed of them. A node carries its question
and a set of aspects; an aspect is one decision, with its choices, the one
adopted, its boldness, and its ruling once the author has given one; and the
`## Answer` section is derived by rendering the adopted choice of every aspect
in aspect order. There is no `## Recommendation` fence, because the
recommendation is the set of adopted choices, and the whole render the author
reads on the page is derived from them live, which is exactly what the author
asked the page to do and what neither other model gives without an assembler
bolted on.

Why it wins on merit. The decomposition problem dissolves rather than being
paid for: prose written as decisions never needs decomposing, and the question
of whether a paragraph-sized carving composes never arises because nothing was
carved. It applies this repository's own principle one level down, that the
work is derived from the record of dispositions; here the answer is derived
from the record of decisions, and a sentence carried by no aspect is a sentence
nobody ruled on, which is the argument the materialization node already makes
about implementation no disposition justifies. It carries no redundancy, each
choice holding only its own fragment. And the aspects with no textual rival,
authority, persistence, and the existence of the node itself, are first-class
rows, which is what the author asked for first.

Two of the drafted model's decisions are reversed by it, and the reversals are
gains. The review becomes per aspect rather than per node: the reviewer judges
each choice on offer, not only the adopted combination, and that removes the
defect the validation found, that confirming a choice the recommendation did
not adopt yields a render the review never pinned and sends it back. Under
per-aspect review the author may confirm any reviewed choice and it lands. And
`prune` stops being an alternative of a special shape with no slot; it is the
aspect `existence`, with the choices keep and prune, which is cleaner than what
the record does today.

What it costs, stated so the author is not surprised by it. Writing an answer
becomes writing its decisions, and each choice must be a self-standing sentence
or paragraph that reads in sequence with its neighbours. Not every combination
of choices is coherent, so a choice may need to name the choices it excludes,
by aspect and name. Every node migrates as one aspect and splits as sittings
touch it. And the derived answer must validate as prose a reader would accept,
which nothing yet checks.

Which of the validation's corrections still stand against it. The boldness
direction contradiction on `growth` is independent of the model and still must
be fixed. The fold rule is settled the strict way: an aspect folds into the
render only on `low` boldness, so the corner the validation found, one choice
with moderate boldness folding silently, is closed. A ruling still carries its
own pin `of`, the hash of the choice text ruled. A choice carries the dates of
the author's words it rests on, which gives the per-row quote drill-down the
data path it lacked. The cascade is unchanged in membership and in count,
seven ruling-stage nodes of thirty-nine. What no longer counts against it is
everything that was a migration cost.

This recommendation rests more on the AI's own design judgment than on the
record or the author's words: its boldness is high, in the direction `dialogue`
and the author use the term. It is recorded as an alternative and the sitting
recommends it, and it has not yet had a clean-context review, which it owes
before the author rules and which the author's standing instruction for this
sitting stops short of.


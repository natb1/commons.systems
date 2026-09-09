---
question: What acts while nothing in the record is ratified, and when does that state end?
stage: ruling
facts:
  - name: answer
    options:
      - name: shim-and-grant
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"
        supports:
          - words/2026-09-04/44
          - words/2026-09-08/2
          - words/2026-09-08/22
      - name: deferred-as-the-resting-state
        source: review
        ref: "2026-09-05"
      - name: projected-doctrine-acts
        source: review
        ref: "2026-09-05"
      - name: grant-expires-at-exit
        source: author
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/89
      - name: nothing-acts
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "the record would have to be built by an agent forbidden to act on any of it, and the first sitting could not be run"
      - name: a-bootstrap-class
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-03"
        status: passed
        reason: "the author's words of 2026-09-04 make the grant a persistent rule of the authority node and no class, and the authority node passed the same option over on that ground"
      - name: a-standing-direction-acts-by-right
        source: review
        ref: "2026-09-07"
      - name: the-grant-is-one-reconciliation
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"
        supports:
          - words/2026-09-04/44
      - name: reconciliation-runs-on-a-judgment-of-sufficient-grounding
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/36
      - name: interim-doctrine-binds-as-last-seen
        source: ai
        ref: "2026-09-08"
      - name: reconciliation-acts-on-a-convergence
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/39
    recommends: reconciliation-acts-on-a-convergence
    boldness: high
    against: "Every rule file under `.claude/rules/` that a session loads, this node's own projection among them, is the projection of a node no ruling reaches, and the `session-context` node declares a shim on `CLAUDE.md` and on `.claude/settings.json` and on neither the rules projection nor this file, so this answer says the doctrine the record is running on today acts on nothing, and says it in a file that binds every session while saying it. It leaves a session no account at all of what those files bind it to, and the option that would give one is `projected-doctrine-acts`."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-09
  of: f363726edf001ec1401aa91313271cd69c638c65
  commit: 7663ad04b910a3cbef62c4bd2bbbceba3daa8cfb
  against: "The recommendation's own defining clause rests on a term the schema cannot presently exhibit: `reconciliation-acts-on-a-convergence`'s AI divergence says so directly -- 'a rule that governs every reconciliation this record does today is stated in terms of a mark no node carries, and a reader who tries to check a past reconciliation against it finds nothing to check it with' -- and the account repeats the same admission twice more, once on the fact and once in the dated section recording the author's words. A recommendation whose central mechanism is, by its own text, unauditable is a real reason to hesitate before sending it to the author for ratification. It does not defeat forwarding here: the term is the author's own words at `words/2026-09-08/39` transcribed rather than an AI-invented test, the gap is disclosed at every locus a reader would meet the clause rather than smoothed over anywhere, and the fix is already named and handed to the node that owns the encoding, `what-an-option-row-carries`, rather than assumed or quietly deferred. That is the disclosure the evaluation node's rule against an AI answering a case against itself calls for, not a defect of this text."
  survey:
    date: 2026-09-09
    of: f363726edf001ec1401aa91313271cd69c638c65
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "7b3273b9d0e6cc1605116534c3e680a3cef87c1d138c7d21b25a159f82cd89f4"
      answer: "8e8d2432e596c5d383b4a8bea009646f334eb421fa8efcaf95b81037383f9e34"
      options: "03c362abc067f5e536877308768c995a54cd60331a270a4c6663b3342e89275e"
      rivals: "506b000e82005155115bff0f739cc73802f8cc925ac53a4c1419e9b23a351369"
      words: "016c59462acc0c083ec63108fc135c7b6257bc06e1395604244c6c77500fb3d8"
    findings:
      - finding: "Two nodes quote `what-acts-during-bootstrap`'s definition of a grant in a form it no longer carries. That node defines \"`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant.\" `probe-or-node` quotes it inside quotation marks as \"a grant is the author's word, given for one named reconciliation of one unanswered node\" and restates it as \"which reaches one named reconciliation and no class\"; `graph-topology`'s binding answer reads \"the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class\". Both interims — `interim-follows-the-authors-word` and `topology-is-a-field-until-it-is-contested` — argue from the narrower reach, and both nodes carry `commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right` in `depends`."
        kind: "cross-reference"
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
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
          - "commons.systems/disposition-graph/probe-or-node"
          - "commons.systems/disposition-graph/graph-topology"
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
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
          - "commons.systems/disposition-graph/what-an-option-row-carries"
          - "commons.systems/disposition-graph/viable-options"
          - "commons.systems/disposition-graph/recording"
      - finding: "Eleven of the twenty-one judged nodes claim terms in `defines` and gloss none of them, including two at the ruling stage. The header lines read, verbatim: \"- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)\" (`growth`); \"- Defines: `confirmation` (no gloss yet); `kickback` (no gloss yet); `steelman` (no gloss yet); `substance` (no gloss yet)\" (`recording`); \"- Defines: `clean-context review` (no gloss yet)\"; \"- Defines: `option` (no gloss yet); `viable` (no gloss yet); `grant` (no gloss yet)\" (`viable-options`); \"`doctrine` (no gloss yet); `proposal` (no gloss yet)\" (`authority`); \"- Defines: `neighbourhood` (no gloss yet)\" (`review-cost`); \"- Defines: `probe` (no gloss yet)\" (`author-questions`, at the ruling stage); \"- Defines: `frontier survey` (no gloss yet)\"; \"- Defines: `reading` (no gloss yet); `tradition` (no gloss yet); `adopted` (no gloss yet); `diverged` (no gloss yet); `chosen over` (no gloss yet)\" (`readings`); \"- Defines: `seam` (no gloss yet)\" (`decomposition`); \"- Defines: `session context` (no gloss yet); `rules` (no gloss yet)\" (`session-context`, at the ruling stage). Two of them are worse than empty. `authority` glosses both its terms in its own answer — \"Doctrine is the ratified answers taken together.\" and \"A proposal is technical vocabulary and is not overloaded\" — so the definition exists everywhere but the entry the term index reads. And `viable-options` claims `grant` while `what-acts-during-bootstrap` defines the same thing under another name: \"`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant.\" The mechanical tier does not reach any of this: `term-without-a-path` reports only a used term \"with no path to it over 'under', 'depends' or 'cites'\", which presupposes a definer and never asks whether the definer said anything."
        kind: "vocabulary"
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
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
          - "commons.systems/disposition-graph/growth"
          - "commons.systems/disposition-graph/recording"
          - "commons.systems/disposition-graph/clean-context-review"
          - "commons.systems/disposition-graph/viable-options"
          - "commons.systems/disposition-graph/authority"
          - "commons.systems/disposition-graph/review-cost"
          - "commons.systems/disposition-graph/author-questions"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/readings"
          - "commons.systems/disposition-graph/decomposition"
          - "commons.systems/disposition-graph/session-context"
    pairs:
      - with: "commons.systems/disposition-graph/alignment-order"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/alignment-target"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "words:words/2026-09-08/39"
          - "words:words/2026-09-08/22"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/bootstrap-exit-conditions"
        keys:
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "words:words/2026-09-08/39"
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/coverage"
        keys:
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/deferring-on-a-probe"
        keys:
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/delegation-bounds-and-sizing"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "words:words/2026-09-08/36"
          - "cites"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "cites"
      - with: "commons.systems/disposition-graph/expert-identity"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/expert-instructions"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/graph-topology"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "parent:commons.systems/disposition-graph/authority"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/lockfile"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "cites"
      - with: "commons.systems/disposition-graph/movements"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/probe-or-node"
        keys:
          - "words:words/2026-09-08/36"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/probe-response-treatment"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/prose-and-structure"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/quotes"
        keys:
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/review-model"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/review-skills"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/round-termination"
        keys:
          - "term:shared grounding (defines: commons.systems/disposition-graph/round-termination)"
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/session-context"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "cites"
      - with: "commons.systems/disposition-graph/session-state"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/standard-report"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "cites"
      - with: "commons.systems/disposition-graph/un-aligned-children"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/unreached-traditions"
        keys:
          - "words:words/2026-09-08/36"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
          - "parent:commons.systems/disposition-graph/authority"
      - with: "commons.systems/disposition-graph/vocabulary-view"
        keys:
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
      - with: "commons.systems/disposition-graph/what-an-option-row-carries"
        keys:
          - "words:words/2026-09-08/36"
          - "words:words/2026-09-08/39"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:bootstrap exit (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "cites"
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
depends:
  - commons.systems/disposition-graph/authority
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Facts

### answer

The recommendation is `reconciliation-acts-on-a-convergence` since
2026-09-08, at high boldness, which in this record means low confidence: it
is `shim-and-grant` with the positive condition the author set at
`words/2026-09-08/39` on what bootstrap reconciliation may act on, the
convergence of their choice with the AI's recommendation. `shim-and-grant`
stated one bar and never said what reconciliation acts on, and its own support
and divergence, and the amendment's, are under their subsections. The boldness
does not move on the amendment: the clause is the author's, so it is not what
the boldness was ever marking, and the amendment adds a term the record cannot
presently write down, which is a reason for the mark to stay rather than to
fall. What follows is the reason the text it amends was recommended on, which
the amendment carries except where it says otherwise.

`shim-and-grant` was recommended from 2026-09-04 until then. The two rules
are the record's own words, from the evaluation node, the transience node and
the authority node, and gathering
them here invents nothing. What is the AI's, and what the boldness marks, is
that bootstrap relaxes node by node rather than ending in one act, and that the
conditions the record declares elsewhere, gathered on the node beneath this one
and not minted here, say when it is over. No
ruling of the author's fixes either, and the record's stopgaps date themselves
by this term, so a wrong answer here mis-dates every one of them. The one place
the answer departs from the author's words is the expiry, which is why their
side of it is on the list as `grant-expires-at-exit` and the case against the
whole answer is on the fact. The case against has one option that answers it
and the answer does not, `projected-doctrine-acts`, which would make the
doctrine the record projects into `.claude/rules/` a third thing that acts; it
is listed and not recommended, because whether the rule files a session loads
bind it is the author's to say and not the AI's.

What the clause it replaces bought, and what replacing it costs. The narrow
clause made every act of reconciliation separately authorised, so that a grant
could not widen inside the sitting it was given for and the author saw each
thing done under it before the next was done. The refinement keeps
explicitness, keeps the sitting boundary, and adds a precondition the narrow
clause never had, that baseline grounding be established first; what it gives up
is the per-act check, and a sitting is bounded by nothing but its own length.
That trade is the author's to make and they made it, and the clause it replaced
is on the list as `the-grant-is-one-reconciliation` so that the record keeps it.

#### shim-and-grant

Two things act by right, and no class acts until a ruling confers one; from that
ruling the class acts, as the authority node says, whose own sentence that no
class acts during bootstrap was written of the narrower state and stands with
the author as the option `a-conferred-class-acts-during-bootstrap`; and what
acts by right shrinks with every ruling.

**AI support.** The question is authority's neighbour and not authority's own: that node
answers who may change an answer, and this one answers what binds a session
while the answer to that question reaches nothing. It is minted here because
the rule has to survive the sitting that wrote it, be cited, and be read by
sessions that never saw the question, which is what makes a disposition
rather than a probe. Until 2026-09-05 the rule lived as one clause in
authority's answer, where a reader looking for what governs a session today
would not find it.

The clause it carries is the reply authority's own reading of 2026-09-05
recorded to the counter-argument that the classes describe none of the
record's present operation. That counter-argument is the ground of the
option `deferred-as-the-resting-state`, and it is not answered by putting
the clause in its own node: it asks for a resting state in which the AI's
recommendation acts by default under a review that is owed, which is what
the retired deferred stamp did and what the `approval-directed-agents`
reading describes. This answer refuses that resting state and pays for it in
the author's attention, one grant at a time; the author may prefer the other
side, and the option is on the list for that reason.

**AI divergence.** Every rule file under `.claude/rules/` that a session loads, this node's own projection among them, is the projection of a node no ruling reaches, and the `session-context` node declares a shim on `CLAUDE.md` and on `.claude/settings.json` and on neither the rules projection nor this file, so this answer says the doctrine the record is running on today acts on nothing, and says it in a file that binds every session while saying it. It leaves a session no account at all of what those files bind it to, and the option that would give one is `projected-doctrine-acts`.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

Two things act by right, and no class acts until a ruling confers one; from that
ruling the class acts, as the authority node says, whose own sentence that no
class acts during bootstrap was written of the narrower state and stands with
the author as the option `a-conferred-class-acts-during-bootstrap`; and what
acts by right shrinks with every ruling. A shim declared on the record is
applied by default, as the evaluation node says, and it stands in for a
materialization the record has not yet made, as the transience node defines it;
a prompt is required only to bypass one. And a grant is the author's word, given
explicitly for one alignment sitting and reaching every alignment in it, never
assumed, never read from the announcement of one, and never carried into a later
sitting, as the authority node says; the grant is what the author's words call
bootstrap authority, and the two names are one thing. Within the sitting it
grants two things the narrower clause withheld. It runs on rather than once:
once the sitting has established baseline grounding on a node through the
periagogic, maieutic and review movements, reconciliation executes as the AI's
recommendations evolve, and what is reconciled is applied to the sitting in hand
rather than held for the next. And it turns the sitting back on itself:
alignment already sequenced in that sitting is re-visited where newly reconciled
disposition would change it, so a sitting leaves behind no work its own later
findings have overtaken. Its one bar is confirmed ratified disposition, which
reconciliation may not contradict; during bootstrap nothing is ratified, so the
bar is presently empty, which the record says rather than leaving a reader to
find out. Nothing else acts by right: a
recommendation on an unanswered node is a draft and grounds no work, and a class
the AI writes for itself is not a grant.

Bootstrap is the state of this record until bootstrap exit, and it is not a
licence: what a session may do in it is exactly what the two rules above allow,
together with what each class a ruling has already conferred allows. What an
artifact standing outside them is, this node does not decide: the record's test
for unsupported implementation is the materialization node's, whether a
disposition justifies the artifact, and the session-context node's for what a
session loads, whether a node projects it, and neither test reads the authority
under which anything acted. An artifact that fails one of those tests is
unsupported implementation, which the second direction of reconciliation puts on
the frontier for the author's ruling; the work-loop node's declared shim holds
that direction back until the dispositions that state it are answered, that
node's own answer putting the direction only at exit and standing before the
author as `second-direction-begins-when-its-disposition-is-answered`; and no
instrument derives that frontier today. The state does not end in one act, and
it does not relax all at once. It relaxes node by node, as rulings accumulate
and each node's class begins to act in place of the shim or the grant that
carried it, so that what acts by right shrinks with every ruling until the last
one leaves nothing for it to carry. Bootstrap exit is the moment every condition
the record declares for it is met; which conditions those are is the question of
the node beneath this one, `bootstrap-exit-conditions`, and this node mints none
of them and lists none. The swap of `greenfield` with `main` is what happens at
exit and is no condition of it. The grant does not expire at exit: reconciling
an unanswered node on the author's explicit word is the rule at any time, as the
authority node holds, and that strikes the expiry the author's words of
2026-09-03 gave it, quoted above; the divergence is recorded here, and
`grant-expires-at-exit` keeps the author's own side of it on the list.
```

#### deferred-as-the-resting-state

Deferred returns as the state the AI may write for itself: a recommendation
on an unanswered node acts, under a review that is owed, until the author
rules. This is what the record carried until 2026-09-03, when the author
classified the deferred stamps the bootstrap had written as unanswered, and
what approval-direction describes as action pending approval. The
`approval-directed-agents` reading supports deferred as a class the author
confers and expressly refuses it as a resting state, calling it approval-
direction with a debt attached and a date on it, so this option diverges from
that reading rather than resting on it, and the reading records the
divergence. Viable and not chosen: it makes the machine run without a grant
per reconciliation, which is the cost this answer accepts, and the author's
own remedy of 2026-09-02 for unearned authority was a rollback to deferred
for review, not a halt. It is not dominated, and the choice between the two
is the author's.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option's argument, and that
divergence is still owed. What stands here instead is mechanical, and it is a reason to
re-encode this option before ruling for it rather than a reason against what it says:
the option is a whole-markdown fence whose `## Answer` is one paragraph, while the
recommendation's fence carries two, so ruling for it as presently encoded would delete
the answer's second limb, the half that says when bootstrap ends. Six of this fact's
options are in that position and the ones encoded as diffs against the recommendation are
not. The repair is to re-encode this option's content; it is put to the author rather
than done, because re-encoding an existing option changes what the author would be ruling
on.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

Deferred returns as the state the AI may write for itself: a recommendation
on an unanswered node acts, under a review that is owed, until the author
rules. This is what the record carried until 2026-09-03, when the author
classified the deferred stamps the bootstrap had written as unanswered, and
what approval-direction describes as action pending approval. The
`approval-directed-agents` reading supports deferred as a class the author
confers and expressly refuses it as a resting state, calling it approval-
direction with a debt attached and a date on it, so this option diverges from
that reading rather than resting on it, and the reading records the
divergence. Viable and not chosen: it makes the machine run without a grant
per reconciliation, which is the cost this answer accepts, and the author's
own remedy of 2026-09-02 for unearned authority was a rollback to deferred
for review, not a halt. It is not dominated, and the choice between the two
is the author's.
```

#### projected-doctrine-acts

Three things act, and no class does: a declared shim, the author's grant, and
the doctrine the record projects from its own nodes into `.claude/rules/`,
which binds every session as the record's interim doctrine until each node it
projects is ruled. Whether that is written as a third limb here or declared as
a shim on the `session-context` node over the rules projection is the same
answer reached two ways; the shim shape is before the author at the node whose
frontmatter would hold it, as `rules-projection-declared-a-shim` on
`session-context`, and a ruling here is for the limb written here. It is not dominated by
either live alternative: `deferred-as-the-resting-state` would give every
recommendation of the AI's the force of an answer, which this does not, and
`grant-expires-at-exit` grounds nothing that runs today. It is the only way on
this list for the author to rule that the rule files every session loads bind
it, which is what the case against the recommendation says the answer leaves
unaccounted; the reading of 2026-09-05 named it, and it is recorded here and
not answered, because the AI may not answer a case against itself by ruling
on it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option's argument, and that
divergence is still owed. What stands here instead is mechanical, and it is a reason to
re-encode this option before ruling for it rather than a reason against what it says:
the option is a whole-markdown fence whose `## Answer` is one paragraph, while the
recommendation's fence carries two, so ruling for it as presently encoded would delete
the answer's second limb, the half that says when bootstrap ends. Six of this fact's
options are in that position and the ones encoded as diffs against the recommendation are
not. The repair is to re-encode this option's content; it is put to the author rather
than done, because re-encoding an existing option changes what the author would be ruling
on.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

Three things act, and no class does: a declared shim, the author's grant, and
the doctrine the record projects from its own nodes into `.claude/rules/`,
which binds every session as the record's interim doctrine until each node it
projects is ruled. Whether that is written as a third limb here or declared as
a shim on the `session-context` node over the rules projection is the same
answer reached two ways; the shim shape is before the author at the node whose
frontmatter would hold it, as `rules-projection-declared-a-shim` on
`session-context`, and a ruling here is for the limb written here. It is not dominated by
either live alternative: `deferred-as-the-resting-state` would give every
recommendation of the AI's the force of an answer, which this does not, and
`grant-expires-at-exit` grounds nothing that runs today. It is the only way on
this list for the author to rule that the rule files every session loads bind
it, which is what the case against the recommendation says the answer leaves
unaccounted; the reading of 2026-09-05 named it, and it is recorded here and
not answered, because the AI may not answer a case against itself by ruling
on it.
```

#### grant-expires-at-exit

The grant is a bootstrap expedient and goes at bootstrap exit, after which an
unanswered node is reconciled only through the dialectic. These are the
author's words of 2026-09-03, quoted above, and the standing answer strikes
them on the AI's own judgment, that a rule requiring the author's explicit
word to reconcile an unanswered node is right at any time and not a stopgap;
authority's rationale records the strike and says the author may strike the
line in turn. The option is here so the author rules on their own words rather
than on the AI's amendment of them.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option's argument, and that
divergence is still owed. What stands here instead is mechanical, and it is a reason to
re-encode this option before ruling for it rather than a reason against what it says:
the option is a whole-markdown fence whose `## Answer` is one paragraph, while the
recommendation's fence carries two, so ruling for it as presently encoded would delete
the answer's second limb, the half that says when bootstrap ends. Six of this fact's
options are in that position and the ones encoded as diffs against the recommendation are
not. The repair is to re-encode this option's content; it is put to the author rather
than done, because re-encoding an existing option changes what the author would be ruling
on.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

The grant is a bootstrap expedient and goes at bootstrap exit, after which an
unanswered node is reconciled only through the dialectic. These are the
author's words of 2026-09-03, quoted above, and the standing answer strikes
them on the AI's own judgment, that a rule requiring the author's explicit
word to reconcile an unanswered node is right at any time and not a stopgap;
authority's rationale records the strike and says the author may strike the
line in turn. The option is here so the author rules on their own words rather
than on the AI's amendment of them.
```

#### nothing-acts

Nothing acts until a ruling reaches it, shims and grants included. Passed
over: the record would then have to be built by an agent forbidden to act on
any of it, and the first sitting could not be run.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option's argument, and that
divergence is still owed. What stands here instead is mechanical, and it is a reason to
re-encode this option before ruling for it rather than a reason against what it says:
the option is a whole-markdown fence whose `## Answer` is one paragraph, while the
recommendation's fence carries two, so ruling for it as presently encoded would delete
the answer's second limb, the half that says when bootstrap ends. Six of this fact's
options are in that position and the ones encoded as diffs against the recommendation are
not. The repair is to re-encode this option's content; it is put to the author rather
than done, because re-encoding an existing option changes what the author would be ruling
on.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

Nothing acts until a ruling reaches it, shims and grants included. Passed
over: the record would then have to be built by an agent forbidden to act on
any of it, and the first sitting could not be run.
```

#### a-bootstrap-class

Bootstrap authority is a fourth class beside ratified, delegated and
deferred, which the authority node would then define. Passed over on the
same ground that node passed it over: the author's words of 2026-09-04 make
the grant a persistent rule about reconciliation authority, and a rule is
not a class.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option's argument, and that
divergence is still owed. What stands here instead is mechanical, and it is a reason to
re-encode this option before ruling for it rather than a reason against what it says:
the option is a whole-markdown fence whose `## Answer` is one paragraph, while the
recommendation's fence carries two, so ruling for it as presently encoded would delete
the answer's second limb, the half that says when bootstrap ends. Six of this fact's
options are in that position and the ones encoded as diffs against the recommendation are
not. The repair is to re-encode this option's content; it is put to the author rather
than done, because re-encoding an existing option changes what the author would be ruling
on.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

Bootstrap authority is a fourth class beside ratified, delegated and
deferred, which the authority node would then define. Passed over on the
same ground that node passed it over: the author's words of 2026-09-04 make
the grant a persistent rule about reconciliation authority, and a rule is
not a class.
```

#### a-standing-direction-acts-by-right

Everything `shim-and-grant` says, with a third thing acting by right beside the shim and the grant: a standing direction the author has given about a class of act, which acts on every instance of that class until a ruling confers the class, where a grant acts on the sitting it is given for. It is on the table because graph-topology and probe-or-node both now take a prune on the author's word "wherever it was given" and cite this node for it, where this answer's grant, refined on the author's words of 2026-09-08, is "given explicitly for one alignment sitting and reaching every alignment in it, never assumed, never read from the announcement of one, and never carried into a later sitting". That refinement narrows the gap and does not close it: the words those two nodes rely on were given in an earlier sitting, so reading them as reaching a prune wherever it was given still carries a grant across sittings, which the refined clause forbids as the narrow one did. Either the third limb is written here or those two clauses have no ground.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: it is a wider licence than the fact's own case against already worries about, and the party reading which direction reaches which act is the party the act benefits. And mechanically, this option is one of the six whose fence holds a one-paragraph answer where the recommendation's holds two, so ruling for it as presently encoded would delete the answer's second limb; the re-encoding is put to the author rather than done, for the reason the other five say.

**Content.**

```markdown
---
question: What acts while nothing in the record is ratified, and when does that state end?
form: rule
under:
  - commons.systems/disposition-graph/authority
tier: global
defines:
  - term: bootstrap
    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
  - term: bootstrap exit
    gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
  - term: bootstrap authority
    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
---

## Answer

Everything `shim-and-grant` says, with a third thing acting by right beside the shim and the grant: a standing direction the author has given about a class of act, which acts on every instance of that class until a ruling confers the class, where a grant acts on the sitting it is given for. It is on the table because graph-topology and probe-or-node both now take a prune on the author's word "wherever it was given" and cite this node for it, where this answer's grant, refined on the author's words of 2026-09-08, is "given explicitly for one alignment sitting and reaching every alignment in it, never assumed, never read from the announcement of one, and never carried into a later sitting". That refinement narrows the gap and does not close it: the words those two nodes rely on were given in an earlier sitting, so reading them as reaching a prune wherever it was given still carries a grant across sittings, which the refined clause forbids as the narrow one did. Either the third limb is written here or those two clauses have no ground.
```

#### the-grant-is-one-reconciliation

Everything `shim-and-grant` says, with the grant's unit the single reconciliation rather than the sitting: the author's word authorises one named reconciliation of one unanswered node, and a second reconciliation in the same sitting needs a second word. This is the clause the record carried until 2026-09-08, kept on the list because what it bought is not bought by the refinement that replaced it.

**AI support.** It makes every act of reconciliation separately authorised, so a grant cannot widen inside the sitting it was given for, and the author sees each thing done under it before the next is done. That is a real guard, and the refinement gives it up: a sitting is bounded by nothing but its own length, and the sitting of 2026-09-08 ran a day.

**AI divergence.** It is the clause two nodes at the ruling stage already read past, and the author refined it on 2026-09-08 rather than confirming it, saying the grant is given to a sitting and reaches all alignment in it. Holding to it would set the record's rule against the author's own articulation of it, which is not a divergence the AI records on its own side.

**Content.**

From: shim-and-grant

```diff
@@ -10,7 +10,7 @@
   - term: bootstrap exit
     gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
   - term: bootstrap authority
-    gloss: "The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant."
+    gloss: "The author's grant, given in their words for one named reconciliation of one unanswered node; the term is the author's, and the grant is the thing this node calls a grant."
 ---
 
 ## Answer
@@ -23,21 +23,10 @@
 applied by default, as the evaluation node says, and it stands in for a
 materialization the record has not yet made, as the transience node defines it;
 a prompt is required only to bypass one. And a grant is the author's word, given
-explicitly for one alignment sitting and reaching every alignment in it, never
-assumed, never read from the announcement of one, and never carried into a later
-sitting, as the authority node says; the grant is what the author's words call
-bootstrap authority, and the two names are one thing. Within the sitting it
-grants two things the narrower clause withheld. It runs on rather than once:
-once the sitting has established baseline grounding on a node through the
-periagogic, maieutic and review movements, reconciliation executes as the AI's
-recommendations evolve, and what is reconciled is applied to the sitting in hand
-rather than held for the next. And it turns the sitting back on itself:
-alignment already sequenced in that sitting is re-visited where newly reconciled
-disposition would change it, so a sitting leaves behind no work its own later
-findings have overtaken. Its one bar is confirmed ratified disposition, which
-reconciliation may not contradict; during bootstrap nothing is ratified, so the
-bar is presently empty, which the record says rather than leaving a reader to
-find out. Nothing else acts by right: a
+for one named reconciliation of one unanswered node, never assumed, never
+carried over from an earlier grant, and never read from the announcement of one,
+as the authority node says; the grant is what the author's words call bootstrap
+authority, and the two names are one thing. Nothing else acts by right: a
 recommendation on an unanswered node is a draft and grounds no work, and a class
 the AI writes for itself is not a grant.
 
```

#### reconciliation-runs-on-a-judgment-of-sufficient-grounding

What licenses the grant's run-on is the main thread's judgment that the grounding
between the author and the experts convened on a node suffices for reconciliation,
and not the sitting's having run the three movements on it. The movements are
evidence for the judgment and not the condition, and what the judgment does not
clear is tracked as the sitting's reconciliation residue.

**AI support.** The clause this changes is the AI's own, written into the recommended
text when the grant's run-on was reconciled, and step 6 of `words/2026-09-08/36` is
the author speaking on it directly. What it changes is not a loosening. Under the
recommended text a node that has run its three movements is reconcilable whatever
stands unanswered on it, an expert's divergence or a probe to the author, and a node
that has not run all three is not reconcilable however plain the grounding on the
narrow point at issue; both are wrong in the same way, reading a procedure as a proxy
for the state it was meant to produce. Making the state the condition and the
procedure its evidence is what the author's step does, and it is what this record
already does with the author's own confirmation, which `round-termination` makes an
asserted judgment and not a computed one. The residue clause is what makes the
judgment safe to give an AI at all: a judgment that can license only work, and that
must name what it declined to license, leaves an account behind it where a silent
deferral leaves none.

**AI divergence.** A condition anyone can check is replaced by a judgment only the
judging party can check, and the judging party is the AI. The three movements are
visible in the record; that the grounding between the author and the experts suffices
is visible nowhere, and the residue list is the AI's own account of what it declined,
which records the judgments it chose to withhold and is no check on one it made too
freely. `class-recommendation` calls that shape capture-shaped, and this node's own
answer holds that a class the AI writes for itself is not a grant. What the option
offers against that is only that the judgment licenses no confirmation and leaves the
author's ruling untouched. It offers nothing by which the author could see, after the
fact, that a reconciliation ran on grounding that was not there; the record has no
such instrument, and this option mints none.

**Content.**

From: shim-and-grant

```diff
@@ -28,10 +28,24 @@
 sitting, as the authority node says; the grant is what the author's words call
 bootstrap authority, and the two names are one thing. Within the sitting it
 grants two things the narrower clause withheld. It runs on rather than once:
-once the sitting has established baseline grounding on a node through the
-periagogic, maieutic and review movements, reconciliation executes as the AI's
-recommendations evolve, and what is reconciled is applied to the sitting in hand
-rather than held for the next. And it turns the sitting back on itself:
+where the main thread judges that the grounding between the author and the
+experts convened on a node suffices for reconciliation, reconciliation executes
+as the AI's recommendations evolve, and what is reconciled is applied to the
+sitting in hand rather than held for the next. The judgment is the main
+thread's, and it is a judgment and not a test: the movements of the sitting are
+what produce the grounding it weighs, so passing through the periagogic,
+maieutic and review movements is evidence of grounding and not the thing
+itself, since a node may run all three and leave an expert's divergence
+unanswered, or be grounded enough for a narrow reconciliation before the third
+has run. It is not the shared grounding the author's confirmation rests on,
+which is `round-termination`'s and the author's alone; that judgment's object
+is the disposition and this one's is the work, and the option
+`grounding-for-reconciliation-is-not-grounding-for-confirmation` on that node
+keeps the two apart. What this judgment does not clear is not reconciled and is
+not lost either: it is tracked as the sitting's reconciliation residue and
+carried in the sitting's report, and what keeps such a residual from being
+acted on after the disposition beneath it has moved is the question of
+`bootstrap-residue-staleness`. And it turns the sitting back on itself:
 alignment already sequenced in that sitting is re-visited where newly reconciled
 disposition would change it, so a sitting leaves behind no work its own later
 findings have overtaken. Its one bar is confirmed ratified disposition, which
```

#### interim-doctrine-binds-as-last-seen

The expert's choice, with the amendment it would mint beside it. Everything
`projected-doctrine-acts` says -- the projected global-tier rules bind a session while
the nodes they project are unruled -- with the binding attached to the rule text as of
the graph commit the author last saw, so that a global-tier node the AI amends afterwards
is loaded and reported but does not bind until the author has seen it. Where only one
mark is recorded the expert asks that it be recorded on `projected-doctrine-acts`.

**Expert choice.** `founding-constraint`, convened on this answer fact on 2026-09-08,
grounding the constitution of a founding order. Its argument: the founding literature's
organising distinction is between the constituent power, unbound by the order it is
making, and the constituted powers, bound by it, and its central practical finding is
that a transitional body cannot be left operating on ad hoc grants from the sovereign
alone, because an operating body always runs on some norms and the only real choice is
whether those norms are written, published and reviewable or tacit. That is what an
interim constitution is for: not to anticipate the permanent text but to be binding law
while the permanent text is unmade. `shim-and-grant` describes an order with no interim
law at all -- a stand-in device for unmade materializations, plus a prerogative word from
the sovereign -- which is the pre-constitutional condition the interim instrument was
invented to end. Meanwhile the record already runs on interim law: nine files under
`.claude/rules/` are loaded into every session and obeyed, and this repository's
orientation page says every rule a session works under is one of them. So the answer as
it stands states as doctrine the opposite of what the record does in operation, which the
expert names as the paper-constitution pathology in its classical form: operative norms
that bind in fact and are unreviewable in law because formally there was never anything
to depart from.

What makes the analogy hold for `projected-doctrine-acts` and not for
`deferred-as-the-resting-state` is closure. What the option makes binding is a closed,
published, projected set, the global-tier nodes, nine files, each headed by the node it
comes from, and not an open default in favour of the drafter. The expert's case is that
what made South Africa's 1993 instrument work as a constraint was that its thirty-four
Constitutional Principles were enumerated, published and few enough to be certified
against, and not that transitional authority was generally conceded.

The pin is the certification device reduced to what two parties can run. South Africa
made the interim instrument's constraint effective by having compliance certified by a
body that was neither drafter nor ratifier, and the device had teeth: the Constitutional
Court refused to certify on 6 September 1996 and the Assembly had to amend and return.
This record has two parties and cannot stand up a third. A version pin is the two-party
degenerate case: not a third body, but the property that made the third body useful,
which is that the drafter cannot change what binds it without the change being shown.

**Expert divergence, its own, three.** The first is against the option it chose: the
interim instrument here is drafted by the party it binds and licenses, which is the
constituent-power capture problem in miniature, and in the case that most supports the
option it was not -- the interim text came from the multi-party process rather than from
the assembly that would write the permanent one. The second is that every historical
interim instrument the expert can point to was itself ratified before it bound anyone,
whereas this option would make an instrument binding because it is projected, which no
tradition in its grounding does; it quotes Madison against itself, that the plan was "of
no more consequence than the paper on which it is written, unless it be stamped with the
approbation of those to whom it is addressed", and says the option asks the record to
give force to unstamped paper. The third is against the pin: seen is not agreed.
Certification is an adjudicated finding of compliance against enumerated principles; a
pin records only that the text was in front of the author, so it would prevent silent
widening and would not prevent widening the author reads past.

**AI support.** The gap the option closes is measured and not argued. Nine rule files are
projected and loaded into every session; the answer this fact recommends says no class
acts and nothing binds but a shim and a grant; the two cannot both be true of the same
record. Whatever the author rules, the record should not go on holding a doctrine its own
operation contradicts.

**AI divergence.** The main thread does not move the mark onto this option or onto
`projected-doctrine-acts`, and the reason is mechanical rather than a judgment about the
argument. `projected-doctrine-acts` is encoded as a one-paragraph whole-markdown fence,
as are five of the other rivals, while the recommendation's fence carries two paragraphs:
ruling for any of the six would delete the answer's second limb, the half that answers
this node's second question, when bootstrap ends. That was measured and not estimated,
and it was re-measured on 2026-09-09, when the tally this sentence used to carry had
itself gone stale: the mark has since moved to `reconciliation-acts-on-a-convergence`,
whose fence is half again longer than the sixty-nine lines named here, and the
one-paragraph rivals number five and not four. The numbers are struck and the structure
put in their place, which is the same repair the sitting made to two other prose counts
the same day. The options encoded as diffs against the recommendation do not have the
problem. The option recorded here is encoded as a diff against `shim-and-grant` rather
than as a seventh one-paragraph fence, which is the repair the expert asks for, performed
on the option it minted rather than described; doing the same to the six is put to the
author instead of done, because re-encoding an existing option's content changes what the
author would be ruling on. The warning now stands on each of the six rather than here
alone, which is what the re-reading of 2026-09-09 asked for.

**Content.**

From: shim-and-grant

```diff
@@ -6,7 +6,7 @@
 tier: global
 defines:
   - term: bootstrap
-    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but a declared shim, the author's grant, and each class a ruling has already conferred."
+    gloss: "The state of this record until bootstrap exit, in which nothing acts by right but the record's projected interim doctrine as the author last saw it, a declared shim, the author's grant, and each class a ruling has already conferred."
   - term: bootstrap exit
     gloss: "The moment every condition the record declares for it is met, which the node beneath this one gathers or derives as its own ruling decides, at which `greenfield` is swapped with `main`."
   - term: bootstrap authority
@@ -15,7 +15,7 @@
 
 ## Answer
 
-Two things act by right, and no class acts until a ruling confers one; from that
+Three things act by right, and no class acts until a ruling confers one; from that
 ruling the class acts, as the authority node says, whose own sentence that no
 class acts during bootstrap was written of the narrower state and stands with
 the author as the option `a-conferred-class-acts-during-bootstrap`; and what
@@ -37,7 +37,23 @@
 findings have overtaken. Its one bar is confirmed ratified disposition, which
 reconciliation may not contradict; during bootstrap nothing is ratified, so the
 bar is presently empty, which the record says rather than leaving a reader to
-find out. Nothing else acts by right: a
+find out.
+
+And the third is the record's own interim doctrine: the answers of the
+global-tier nodes, as the projector writes them under `.claude/rules/`, bind a
+session while the nodes they project are unruled. They bind as of the graph
+commit the author last saw, which each rule file carries as a pin, so a
+global-tier answer the AI amends afterwards is projected, loaded and reported
+and does not bind until the author has seen it. This is interim law and not a
+class: it confers nothing on anyone, it is a closed and published set rather
+than a default in the drafter's favour, and every one of its nodes stays
+unanswered and on the frontier, so nothing here is ratified and nothing is
+shielded from amendment. It is written into the answer because the record
+already runs this way, nine files loaded into every session and obeyed, and a
+doctrine saying otherwise leaves the norms a session actually runs on
+unreviewable by holding that formally there are none.
+
+Nothing else acts by right: a
 recommendation on an unanswered node is a draft and grounds no work, and a class
 the AI writes for itself is not a grant.
 
```

#### reconciliation-acts-on-a-convergence

The recommendation with the positive condition the author set on what bootstrap
reconciliation may act on. `shim-and-grant` says what acts by right and what the
grant licenses within a sitting, and states one bar, confirmed ratified
disposition, which is empty today. It never says what reconciliation acts *on*.
This option says it: the convergence of the author's choice with the AI's
recommendation.

**AI support.** It is the author's, at `words/2026-09-08/39`: "non-bootstrap
reconciliation acts only on confirmed author option. bootstrap reconciliation only
acts on convergence of author choice and AI recommendation (which integrates expert
choice, though expert consensus is not required)." The second sentence is this
node's; the first is `authority`'s and is recorded there. Read together they draw
the record's two regimes on one axis, and the axis is bootstrap and not class: what
changes at exit is that a confirmation becomes available and a convergence stops
being enough.

What the clause repairs is a gap the node had and did not know it had. The word
`grant` has been doing two jobs in this answer, a permission and a warrant, and the
author's rule separates them. A grant is not the author saying the AI may act on
its own recommendation; that reading makes the grant a blank cheque and makes the
convergence a convergence of the AI with itself. A grant is the author choosing,
for that node and that sitting, that the AI's recommendation is where they stand
too. That is why the grant's unit is the sitting and why it may not be assumed or
carried: an assumed grant is an assumed author's choice, and an assumed term is not
a term.

It also puts a bound on `deferring-on-a-probe` that neither node had stated. That
mechanism produces the author's choice by reading the record back, on the main
thread's own reading, and the main thread is the party that holds the
recommendation. A convergence one party assembles from both sides is constructed
rather than observed, which is not an accusation of bad faith and does not need to
be: it is a structural claim about what the test can detect. The bound this option
states is the narrowing that node's own recommendation already carries, that an
answer written under a deferral names the recorded disposition it was read from,
and it is stated here because this is the node whose rule the reading has to
satisfy.

**AI divergence.** The clause names a term the record cannot presently write down.
`recording`'s ruling responses are `confirm` and `edit`, `what-an-option-row-carries`
gained the mark for an unconfirmed author's choice only in the same sitting that
recorded this, and neither is materialized. So a rule that governs every
reconciliation this record does today is stated in terms of a mark no node carries,
and a reader who tries to check a past reconciliation against it finds nothing to
check it with. Two answers, neither complete. The first is that a rule stated before
its encoding is how this record works everywhere, and the alternative is a rule
written to fit the encoding it has. The second is that the day's own grant is the
author's choice in the only form the record has ever had for it, their words in the
ledger, so the term is not absent so much as held in a different place. Neither
answer disposes of the objection that a convergence which cannot be pointed at
cannot be audited, and the boldness on this fact stays where it is on that account.

**Content.**

From: shim-and-grant

```diff
@@ -37,7 +37,30 @@
 findings have overtaken. Its one bar is confirmed ratified disposition, which
 reconciliation may not contradict; during bootstrap nothing is ratified, so the
 bar is presently empty, which the record says rather than leaving a reader to
-find out. Nothing else acts by right: a
+find out. What it acts on is a positive condition and not only the absence of
+that bar: bootstrap reconciliation acts on the convergence of the author's
+choice with the AI's recommendation, as the author fixed it at
+`words/2026-09-08/39`, the choice being the unconfirmed mark
+`what-an-option-row-carries` puts on an option and never a confirmation, and the
+recommendation being the AI's, which integrates the choices of any experts
+convened on the fact without requiring that those experts agree. Three things
+follow that the clause would otherwise be read without. A grant is how the
+author's choice reaches a node where the record holds none, which is why a grant
+is given per sitting in the author's own words and is never assumed, never read
+off the announcement of one, and never carried forward: it is not a permission
+to act on the AI's recommendation alone, it is the author supplying the term the
+convergence would otherwise be missing. Where the author's choice is not
+independently recorded but read back from the record by the same party that
+holds the recommendation, the convergence is constructed and not observed, and
+`deferring-on-a-probe` is the mechanism that does exactly that; the bound this
+rule puts on it is that a choice so assembled names the recorded disposition it
+was read from, so that the author can see what was read and overturn it, because
+a convergence neither party can point at is not one. And the record cannot
+exhibit the first term today at all, since `recording`'s ruling responses are
+`confirm` and `edit` and neither writes a choice the author has made and not
+confirmed, so this clause states a rule whose encoding is owed, and says so here
+rather than leaving a reader to find that its central term is unrepresentable.
+Nothing else acts by right: a
 recommendation on an unanswered node is a draft and grounds no work, and a class
 the AI writes for itself is not a grant.
 
```

### authority

Ratified, at moderate boldness: this node says what an agent may act on by
right while the rulings that would carry the work are still owed, which is
capture-shaped on its face — an answer that widened it would let the AI grant
itself the authority the rest of the record withholds. Moderate because the two
rules it gathers are already the author's, and what is new is the sentence about
how the state relaxes and ends.
## Account

### Manifest

- Folded: Minted from authority's reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Redrawn after the kickback, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Redrawn after the second kickback, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The fresh reading's kickback taken, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The fresh reading applied, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-05

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `shim-and-grant`.

Findings:

- ## Facts, `### answer`, `#### projected-doctrine-acts` (the option list the author rules from; the option still claims a reach the amendment itself gave away to another node). The option reads 'Whether that is written as a third limb here or declared as a shim on the `session-context` node over the rules projection is the same answer reached two ways, and the option covers both.' The last reading's fifth finding held that half of that is not this node's to carry — 'a ruling for `projected-doctrine-acts` here would declare that shim nowhere, and the author has no row at the node that would carry it' — and the amendment took the remedy exactly as proposed: `rules-projection-declared-a-shim` is now on `session-context`'s answer fact (session-context.md:28, prose at :102, source commons.systems/disposition-graph/what-acts-during-bootstrap, ref 2026-09-05), and the session's account says 'the author has a row at either end'. That cures the half the finding measured, the missing row, and leaves the claim standing: with both rows recorded, this option's own text still tells the author that ruling for it here settles the `session-context` declaration too, a decision that node's frontmatter carries and its own row now puts before the author separately. Neither option names the other — session-context.md:102 names this node's case against its own answer but not this option — so nothing on the record says the two must not both be taken, which is what this record did at the other merge of this round, where `exit-conditions-cited-not-carried` was kept on work-loop and the session recorded that which node holds the text is a live choice the author rules. Suggested edit: end the sentence at 'is the same answer reached two ways', and continue 'the shim shape is before the author at the node whose frontmatter would hold it, as `rules-projection-declared-a-shim` on `session-context`, and a ruling here is for the limb written here'; and, if the session agrees, name this option from that end too, so the record does not carry the same answer in two homes with neither pointing at the other. This does not touch the recommended option and is not a reason to hold the node back from the author's ruling.

On the facts and what they recommend: The diff changed nothing on either fact: `answer` still recommends `shim-and-grant` at high boldness with `stands: shim-and-grant`, `authority` still recommends `ratified` at moderate, and the frontmatter `against` on the answer fact is untouched, so no `## Recommendation` fence is owed and none is present — I confirmed the node's sections are Disposition, Answer, Rationale, Facts and Account and no fence stands among them. The only frontmatter change is the review block: verdict kickback to forward, `of` now pinning 9c96ce47 at graph commit 1c8931f9, and the reader's own `against` replaced with the last reading's. That pin is the text the last reader read and not this amendment, which is why this re-reading runs and is the deadlock carried to `review-cost`'s `pin-names-the-text-the-reader-read`.

On the viability of the options: The diff adds no option and removes none, so the six on the answer fact and the three reserved on `authority` stand exactly as the last reading judged them, and I found none the amendment makes newly dominated and none newly missing: the two clauses it adds cite options on `authority` and `work-loop`, not candidates for this node's own question. One qualification, which is my single finding: `projected-doctrine-acts` remains viable and undominated, but the amendment recorded the other half of it as `rules-projection-declared-a-shim` on `session-context` while its own text still says it 'covers both'.

Strongest counter-argument (moderate): The amendment answers two of its five findings by adding a citation of a divergence rather than by removing one, so the rule the author is asked to ratify now says twice, in the text `.claude/rules/` carries, that the node it cites holds the other position, and each contest is parked as an option on a node that is itself unruled: a session that reads the notice has nowhere to go for the resolution, and at the first ruling `.claude/rules/authority.md` will still carry 'During bootstrap no class acts' with no notice in that file. Beside that, the standing objection is untouched: the answer still says only what does not make the rule files unsupported and never what makes them binding, and the amendment's own new work — a second row for `projected-doctrine-acts` at `session-context` — moves the remedy one node further from the recommendation without moving the recommendation. None of this defeats the amendment: each of the five defects is cured at its own locus, verified at the loci below, and what is left is the record's condition and not a fault of this text.

The session's reply: The finding is taken. The option `projected-doctrine-acts` still told the author that ruling for it here settles the `session-context` declaration too, after the amendment had put that declaration before them as a row of its own on the node whose frontmatter would carry it. The sentence now ends where the option's own reach ends, and points at `rules-projection-declared-a-shim`; that option is amended in the same act to name this one, so the record does not carry the same answer in two homes with neither pointing at the other. The reader is right that this is the shape the round settled the other way at `work-loop`, where `exit-conditions-cited-not-carried` was kept and which node holds the text was recorded as a live choice for the author. On the counter-argument: it is true that two of the five findings were answered by citing a divergence rather than removing one, and that a session reading the notice has nowhere to go for the resolution while both cited nodes are themselves unruled. That is the record's condition and not a fault of this text, as the reading itself says; what this node can do about it is done, and `.claude/rules/authority.md` carrying "During bootstrap no class acts" with no notice in that file is a defect of `authority`'s answer, where the option that would cure it already stands. The standing objection, that the answer says only what does not make the rule files unsupported and never what makes them binding, is on the fact as `projected-doctrine-acts` and now at `session-context` as well, and is the author's to rule. This was the second reading `review-cost` allows this answer. The edits it earns fall outside the pinned text, so the node goes to the author with `review.of` naming the recommendation as it stands.

### The re-reading applied, and one finding from the node beneath, 2026-09-05

The re-reading's one finding is taken. `#### projected-doctrine-acts` still told
the author that a ruling for it here settles the `session-context` declaration
too, after the amendment had put that declaration before them as a row of its
own on the node whose frontmatter would carry it. The sentence now ends where
the option's reach ends and points at `rules-projection-declared-a-shim`, which
is amended in the same act to name this option, so the record does not carry the
same answer in two homes with neither pointing at the other. That is how the
round settled the same shape at `work-loop`, where `exit-conditions-cited-not-carried`
was kept and which node holds the text was recorded as the author's choice.

The reading of `bootstrap-exit-conditions` the same day found a defect in this
node's `defines` gloss for bootstrap exit: it said the conditions are those that
node gathers, which is true only under that node's `gathered-and-cited` and
false the moment either rival is ruled for. The gloss now says the conditions
are what the record declares, which the node beneath gathers or derives as its
own ruling decides. That edit could not be made while the re-reading was running
without moving the pin the reader was reading against, which is why it is here
and not in the amendment the reader judged.

It moves the pin now, and the cap allows no third reading of this answer, so the
node goes to the author with `review.of` naming the text the reader read. It is
the same deadlock as everywhere else on this frontier, measured on
`review-cost`'s option `pin-names-the-text-the-reader-read`, and here it is
bought by a correction the record needed.

The counter-argument stands unanswered on the review block: two of the five
findings of the earlier reading were answered by citing a divergence rather than
removing one, so the projected rule now says twice that the node it cites holds
the other position, and each contest is parked on a node that is itself unruled.
`.claude/rules/authority.md` will still carry "During bootstrap no class acts"
with no notice in that file, which is a defect of `authority`'s answer, where
the option that would cure it already stands.

### Frontier survey, 2026-09-07, of 102fdff4

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): Two nodes at the ruling stage now read this answer's grant clause wider than it reads. graph-topology and probe-or-node both take a prune on the author's word "wherever it was given, since a grant given in the author's words acts by right while nothing in the record is ratified", where this answer says a grant is "given for one named reconciliation of one unanswered node, never assumed, never carried over from an earlier grant". A standing direction of the author's about a class of act is therefore a third thing acting today, and this answer names it nowhere; that is the same gap the fact's own case against names for the rule files, arriving from a second direction.

### Frontier finding, 2026-09-07

Kind: cross-reference.

Two nodes cite what-acts-during-bootstrap for an interim its answer does not carry and its nearest sentence forbids. graph-topology's recommended answer reads "a prune of a node no ruling reaches that the author has directed in their own words is taken on that word, wherever it was given, since a grant given in the author's words acts by right while nothing in the record is ratified", and probe-or-node's recommended answer says the same, "taken on that word wherever it was given, in the dialogue or at the node's row". what-acts-during-bootstrap's answer defines the thing cited: a grant is "the author's word, given for one named reconciliation of one unanswered node, never assumed, never carried over from an earlier grant, and never read from the announcement of one, as the authority node says". The words being relied on, the author's of 2026-09-05 — "Pruning doesn't require confirmation of explicitly granted in dialogue. just prune it" and "(Pruning of unratified nodes that is)" — were given in one sitting about one node, so reading them as reaching a prune "wherever it was given" is carrying a grant over from an earlier grant, which that node's definition excludes.

Also named: commons.systems/disposition-graph/graph-topology, commons.systems/disposition-graph/probe-or-node.

Proposed: what-acts-during-bootstrap owns what acts by right and is the survivor of the definition. Either its answer gains a third thing that acts, a standing direction of the author's about a class of act, which is the option recorded here for the author to rule; or the two citing nodes redraw their interim so that it names a grant given for the prune in hand and not a word given elsewhere. graph-topology and probe-or-node are the nodes whose text must change under the second, and the interim is the one clause of either that acts before any ruling, so it is the clause the author should meet with the definition beside it.

Recorded as an option on this node's answer fact: `a-standing-direction-acts-by-right` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/what-acts-during-bootstrap stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `shim-and-grant`; the `## Rationale` its `**AI support.**`; 2 `## Disposition` entries became the ledger entries words/2026-09-03/89, words/2026-09-04/44, referenced by 1 option the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `deferred-as-the-resting-state`, `projected-doctrine-acts`, `grant-expires-at-exit`, `nothing-acts`, `a-bootstrap-class`, `a-standing-direction-acts-by-right`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `978ae6c02bed0e9281b0b0c76daa5e5c761ba09c` was already past the recommendation and is left as it stood. The survey's pin `102fdff47a95d8e89691c8905d9d1b9a3d3b7ad5` is re-computed for the encoding as `ecc0a1e411b5735921b5144dc9a2ba61292af004`; nothing it read changed.
### The grant's unit becomes the sitting, on the author's refinement of 2026-09-08

The author refined this answer's grant clause in their own words, `words/2026-09-08/22`,
and granted the refinement for the sitting that recorded it. Four things changed. The
grant's unit is the alignment sitting rather than the single named reconciliation, and
it reaches every alignment in that sitting. It runs on rather than once: after the
sitting has established baseline grounding on a node through the periagogic, maieutic
and review movements, reconciliation executes as the AI's recommendations evolve, and
what is reconciled is applied to the sitting in hand. It obliges the sitting to turn
back on itself, re-visiting alignment it has already sequenced where newly reconciled
disposition would change it. And its one bar is named: confirmed ratified disposition,
which the author observed is presently empty, so the bar binds nothing in this sitting
and the answer says so rather than letting a reader assume a check is running.

What was given up, named rather than glossed. The clause replaced made every act of
reconciliation separately authorised, so a grant could not widen inside the sitting it
was given for. That guard is gone, and nothing bounds a sitting but its own length;
this one ran a day. What replaces it is not nothing: the grant is still explicit, still
dies at the sitting's edge, and now carries a precondition the narrow clause never had,
that baseline grounding be established before reconciliation runs. The trade is the
author's and they made it. The clause replaced stays on the list as
`the-grant-is-one-reconciliation`, its content a named change against the
recommendation rather than a second copy of the node, so the record keeps the position
and the reason it was left.

What this does not settle. `a-standing-direction-acts-by-right` is still open and its
argument survives the refinement: `graph-topology` and `probe-or-node` both take a
prune on the author's word "wherever it was given", and the words they rely on were
given in an earlier sitting, so relying on them still carries a grant across sittings,
which the refined clause forbids exactly as the narrow one did. The refinement narrowed
the gap and did not close it, and that option's quotation of this answer was updated to
the refined clause rather than left standing against text that no longer exists.

How this was grounded, said plainly. This was not a recommendation the AI reached and
put to the author; it is the author's own articulation, recorded. The periagogic work
behind it is one turn: the record's own reason for the narrow clause was read, and what
it bought was named before it was replaced, which is what the evaluation node requires
of any replacement. The clean-context reading of the amended text is owed, and the node
carries `stage: review` with its forward verdict now pinned to a recommendation that
has moved, which is the state that says so.

### The grant's run-on put on a judgment, 2026-09-08

The option `reconciliation-runs-on-a-judgment-of-sufficient-grounding` was recorded
in the alignment sitting of 2026-09-08 under the grant at `words/2026-09-08/2` as
refined at `words/2026-09-08/22`, from step 6 of `words/2026-09-08/36`: "if bootstrap
authority explicitly granted for this session, main thread makes a judgement about
whether sufficient grounding/alignment of author/experts exists for reconciliation
(else, tracked as residue)".

No recommendation was moved at the recording, and the reason this account first
gave was wrong: it said the author had given the seven steps as an option and
not as a settled answer, and `words/2026-09-08/37` denies it -- they are "an
option, but also current author choice", unconfirmed. What the correction
changed on this fact is in the account below.

Two things the option leaves to other nodes rather than settling here. The word
"grounding" already names a different judgment on `round-termination`, the state the
author's confirmation rests on, and whether the author meant that term is a probe put
to them in this sitting's report; the option carries the reading that it is not, and
the option `grounding-for-reconciliation-is-not-grounding-for-confirmation` on that
node holds the distinction, so the two were recorded in one act. And the residue the
clause produces is what `bootstrap-residue-staleness` asks about, whose account this
sitting widened rather than answered.

This node is `tier: global`. Recording an option stales no rule projection, since
`.claude/rules/what-acts-during-bootstrap.md` follows the option the answer fact
recommends and that did not change; a ruling for this option would stale it, and the
regeneration would land on the implementation ref.

### The mark held for the expert, 2026-09-08

`words/2026-09-08/37` corrects the reading this sitting made of `words/2026-09-08/36`:
the seven steps are "an option, but also current author choice", unconfirmed. The
sentence stating the wrong reading was written into this account and into four others,
and is struck above.

The mark on this fact does not move in this sitting, and the reason is the author's own
instruction rather than the AI's reticence. The same entry opens: "if there is not
sufficient expert concurrence to demonstrate sufficient common grounding for bootstrap
reconciliation, then the probes to establish that grounding (with or without expert
divergence) are first priority for this sitting." This fact is where that sentence
lands -- `reconciliation-runs-on-a-judgment-of-sufficient-grounding` is the option that
conditions reconciliation on grounding between the author and the convened experts --
so moving the mark onto it before an expert has been convened on this fact would be the
AI settling, on its own reading, the question the author has just made the sitting's
first priority to put to an expert. An expert has been convened on it, identity
`founding-constraint`, scope this answer fact, grounding institutional and
constitutional design under a founding. The mark waits for what it returns.

One measured thing is recorded now, because it bears on the option whether or not the
expert agrees. Until the commit before this one, no expert had ever been convened on
any node of this record: zero options carried an expert as their `source`, no node
carried an `experts` key, and the fifteen files mentioning the word were prose about
what an expert would be. So the option as it stands, which conditions reconciliation on
a grounding between the author and the experts convened on a node, was for its whole
life a condition no node in the record could satisfy -- it made bootstrap reconciliation
impossible rather than conditional, and nothing in the record showed that. The first
expert landed one commit ago on `clean-context-review`. That is one fact, one expert,
and it diverges from the author's current choice there; the antecedent of the author's
opening sentence therefore holds in its strongest form, not insufficient concurrence but
no concurrence at all, and the consequent is what this sitting is doing.

### The fourth expert, on this fact, 2026-09-08

`founding-constraint` was convened on this answer fact under the author's grant, its
grounding the constitution of a founding order, and its return is recorded above. It
chose `projected-doctrine-acts` and minted the amendment recorded here, returning a
support and a divergence for each of the nine options including the two passed ones.

Its brief steered it and it says how. The brief described its grounding as, among other
things, "the design of authority that is meant to shrink", which is the incumbent
answer's own thesis -- this option's first sentence ends "and what acts by right shrinks
with every ruling" -- so the brief handed the expert the incumbent's position as its
expertise before it read the node. The expert asks that any finding of its amounting to
"a shrinking, event-driven ratchet is good design" be read as the brief talking, and
keeps exactly one such finding, flagged, in its support for this option's second limb.
It also names a conflict it could not neutralize: an expert asked whether the expert
system's own condition is satisfiable is not a disinterested party, since a finding that
the expert relation is not yet recordable is a finding that the record needs more of what
it is.

**The measured matter.** The expert was asked whether the record can presently satisfy
the condition that `reconciliation-runs-on-a-judgment-of-sufficient-grounding` sets, that
the grounding between the author and the experts convened on a node suffices. Its answer
is no, on six measurements, all re-runnable. The tooling contains the string "expert"
zero times across `packages/disposition/*.mjs`. The nine projected rule files contain it
zero times, and so does the alignment skill, so no session is told what an expert is and
the party that must make the judgment loads nothing that defines its object. The reader
has no field for an expert's position: the option carrying the first expert's mark parses
to keys `name, source, ref, status, reason, ruling, supports, diverges, prose, sentence,
aiSupport, aiDivergence, content, resolved, readings`, with no expert key, because
`read.mjs` recognizes only the AI's two markers and everything before the first
recognized marker falls into the option's own `sentence`. So the record states an expert's
position by putting it inside the option's statement of itself. And the two nodes that
would define the object, `expert-identity` and `expert-instructions`, both stand at the
periagogic stage, `expert-identity`'s own prose saying "the record names an expert
everywhere and defines one nowhere".

What follows is narrower than a verdict on that option: its condition is not merely
unverifiable by a third party, which is the design objection the option already carries;
its subject is undefined and its object is unrecordable, so a ruling for it today would
install a condition whose satisfaction cannot be shown, checked or revisited, asserted by
the party it licenses. The expert calls it premature by exactly two nodes rather than
wrong in direction, and offers a narrower repair: require the judgment to be recorded, as
a dated line naming the node, the experts convened on it and what the judgment turned on,
which would give the author the set of reconciliations that ran and not only the residue
of those withheld.

**Four measurements nobody asked for, all confirmed by the main thread before recording.**

The stub-fence defect, confirmed line for line: five of the seven fence-carrying options
would delete this answer's second limb if ruled. It is recorded in the option above and
is the reason no mark moved.

No option anywhere in the graph carries a ruling: zero, across all 165 nodes of both
graphs. So the bar this answer names, confirmed ratified disposition, binds nothing --
which the answer says -- and the ratchet it describes, relaxing node by node as rulings
accumulate, has not advanced one notch. The record is at day zero of its own transition,
and the author should have that when weighing how much the shrinking-by-ruling design has
so far bought.

The ledger entry `words/2026-09-08/2` was referenced by no option. That entry is the
author's grant for this sitting, recorded as said on this node, so the node defining what
a grant is did not reference the grant the sitting amending it was running under. The
expert's reading is that a register of grants not containing the grant in force is the
register failing at the one job it has. It is repaired in this commit, on
`shim-and-grant`, beside the refinement at `words/2026-09-08/22` that it is the original
of. Four further entries of that day and fourteen of earlier days remain unreferenced and
are ordinary work.

The expert observed the graph go from valid to invalid under it mid-sitting, exit 0 at
about 23:51 UTC and exit 1 at 00:01:41, and reported it as observed, timestamped and
possibly transient. It was transient: the invalid state was this sitting's own, an option
`delegated-for-the-physical-form` written onto `readings`' authority fact, which the
schema forbids because an authority fact may only offer the three classes a ruling
confers; it was repaired in the same sitting and the graph validates. The observation is
kept because the expert is right about what it is an instance of. Under a run-on grant
with no per-act checkpoint the record's own reader can be broken between two reads and
nothing marks the moment, which is the cost the record named when the narrow clause was
replaced, appearing in the wild within hours of the replacement.

### What bootstrap reconciliation acts on, 2026-09-08

The author answered the ranking probe on this node's own grant with a rule this
node had never stated. Their words are at `words/2026-09-08/39`, and the second
of their two sentences is this node's: "bootstrap reconciliation only acts on
convergence of author choice and AI recommendation (which integrates expert
choice, though expert consensus is not required)." The first sentence, on what
non-bootstrap reconciliation acts on, is `authority`'s and is recorded there.

What the sitting found in placing it is that the answer had a hole it had not
noticed. `shim-and-grant` says what acts by right, what a shim licenses, what a
grant licenses within a sitting, and one bar; it never says what reconciliation
acts *on*. That is a gap of a particular kind, one a node can carry for a long
time without anyone tripping over it, because every reader supplies the missing
term from context and no two readers need supply the same one. The AI's own
supplied term was the permissive one: that a grant lets the AI act on its own
recommendation. The author's rule says otherwise. A grant is the author's
choice, given for that node and that sitting, that the AI's recommendation is
where they stand too, and the convergence is of two parties and not one. Read
that way the sitting's own standing clauses stop being stipulations and become
consequences: a grant is per sitting, is never assumed, and is never read off
the announcement of one, because an assumed grant is an assumed author's choice
and an assumed term is not a term at all.

The clause also lands a bound on `deferring-on-a-probe`, minted in this same
sitting, that neither node had stated. That mechanism produces the author's
choice by reading the record back on the main thread's own reading, and the main
thread is the party that holds the recommendation. A convergence one party
assembles from both sides is constructed rather than observed. That is a
structural claim about what the test can detect and not a charge of bad faith,
and it is the reason that node's recommendation already requires a deferral's
answer to name the recorded disposition it was read from: so the author can see
what was read and overturn it.

The amendment is recorded knowing the record cannot presently exhibit its first
term. `recording`'s ruling responses are `confirm` and `edit`, and neither
writes a choice the author has made and not confirmed;
`what-an-option-row-carries` gained the mark for one in this same sitting and it
is not materialized. So a rule that governs every reconciliation this record
does today is stated in terms of a mark no node carries. The sitting chose to
state the rule and name the gap rather than write a rule that fits the encoding
it has, which is how this record works everywhere else; the objection that a
convergence nobody can point at cannot be audited is not disposed of by that
choice, and it is why the boldness on this fact does not fall. The amendment
owed on `recording` is named on `what-an-option-row-carries` and is not assumed
here.

### The re-reading's finding of 2026-09-09, and what re-measuring it found

The delta re-reading of this node returned forward at moderate strength on
2026-09-09, with one finding and no probes, and the finding was right about a
real hazard and wrong about its size in the direction that mattered.

What it found: the amendment of 2026-09-08 measured a mechanical risk in
`projected-doctrine-acts` — that it is encoded as a one-paragraph whole-markdown
fence, so ruling for it would silently delete the answer's second limb, the half
that says when bootstrap ends — and recorded that measurement on
`interim-doctrine-binds-as-last-seen`'s divergence, the option the expert minted,
and not on `projected-doctrine-acts`'s own, which still read "The record wrote no
case against this option; its divergence is owed." An author opening
`projected-doctrine-acts` where they would actually rule for it met no warning at
all; the warning sat on a sibling option they had no occasion to open.

The sitting re-measured rather than transcribing, and two things came back. The
hazard is real and covers six options, not five: `deferred-as-the-resting-state`,
`projected-doctrine-acts`, `grant-expires-at-exit`, `nothing-acts`,
`a-bootstrap-class` and `a-standing-direction-acts-by-right` all resolve to a
whole fence with a one-paragraph answer, while `shim-and-grant` and the four
options encoded as diffs resolve to two paragraphs or more. The warning is now on
each of the six, in the option's own `**AI divergence.**`, where the author meets
it at the moment of ruling. The sixth is the survey's own remedy option, which is
the one it would have been most costly to leave unwarned.

And the recorded measurement had itself gone stale inside two days. It named
sixty-nine lines for the recommendation; the mark has since moved to
`reconciliation-acts-on-a-convergence`, whose fence is half again longer, and the
count of one-paragraph rivals it gave as four is five. The tallies are struck and
the structure stated instead. That is the third stale prose count this sitting
found on 2026-09-09, after 134 nodes on `what-an-option-row-carries` and three
sites on `authority`, and unlike those two it was found by re-measuring rather
than by a reader noticing — which is the argument for re-measuring a recorded
measurement instead of copying it, and is recorded here as such.

The re-encoding itself is not done. Six options would have to have their content
re-encoded as diffs against the recommendation, and re-encoding an existing
option's content changes what the author would be ruling on, so it is put to the
author rather than performed. The finding does not touch the recommended option
`reconciliation-acts-on-a-convergence` and does not hold the node back from the
author's ruling, as the reading itself said.

### Clean-context re-reading, 2026-09-09, of f363726e

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `reconciliation-acts-on-a-convergence`.

Findings:

- ## Facts, `### answer`, `#### interim-doctrine-binds-as-last-seen` (AI divergence) against `#### projected-doctrine-acts` (AI divergence). The amendment measures, by name, a mechanical risk in `projected-doctrine-acts`: '`projected-doctrine-acts` is encoded as a one-paragraph whole-markdown fence, as are four of the other rivals, while the recommendation's fence carries two paragraphs: ruling for any of the five would delete the answer's second limb, the half that answers this node's second question, when bootstrap ends,' measured rather than estimated -- 'the fences run 69 lines for the recommendation against 31, 33, 25, 20, 22 and 18 for the rivals.' That finding is recorded on `interim-doctrine-binds-as-last-seen`'s own divergence, the expert's minted option, and not on `projected-doctrine-acts`'s, whose divergence still reads exactly as the 2026-09-07 migration left it: 'The record wrote no case against this option; its divergence is owed.' An author who opens `projected-doctrine-acts` where they would actually rule for it meets no warning that choosing it, as presently encoded, silently drops the node's own account of when bootstrap ends; the warning exists only on a sibling option a reader of `projected-doctrine-acts` has no occasion to open. Suggested edit: copy the measurement (or a pointer to it) into `projected-doctrine-acts`'s own `**AI divergence.**` field in place of 'is owed'. This risk is new to this amendment -- the whole-fence encoding it depends on did not exist at the last reading's pin -- and it does not touch the recommended option `reconciliation-acts-on-a-convergence` or the survey's remedy `a-standing-direction-acts-by-right`, so it is not a reason to hold the node back from the author's ruling.

On the facts and what they recommend: The diff moves the answer fact's `recommends` from `shim-and-grant` to `reconciliation-acts-on-a-convergence` (a diff against `shim-and-grant` adding the author's convergence clause from `words/2026-09-08/39`); `boldness` stays `high`, unmoved by the amendment because, as the fact's own prose says, 'the clause is the author's, so it is not what the boldness was ever marking.' The frontmatter `stands: shim-and-grant` line is dropped as part of the 2026-09-07 migration to content encoding, which also converts every option's prose into a `**Content.**` fence. Five options are appended (`a-standing-direction-acts-by-right`, `the-grant-is-one-reconciliation`, `reconciliation-runs-on-a-judgment-of-sufficient-grounding`, `interim-doctrine-binds-as-last-seen`, `reconciliation-acts-on-a-convergence`); `shim-and-grant`'s own content is updated in place to the author's 2026-09-08 grant-unit-is-the-sitting refinement, with the pre-refinement text preserved as `the-grant-is-one-reconciliation` rather than dropped silently. The `authority` fact (`ratified`, moderate) is untouched by the diff.

On the viability of the options: The diff adds five options and removes none, so all eleven now on the answer fact's option list are distinct, and I found none newly missing. None is newly dominated by the recommendation's move either, but one is newly at risk rather than newly dominated: five of the seven whole-fence options, `projected-doctrine-acts` and the two passed options among them, would delete the answer's second limb if ruled for exactly as encoded, a risk the amendment measures in detail on `interim-doctrine-binds-as-last-seen`'s own divergence but does not copy to `projected-doctrine-acts`'s (see finding). It does not touch the recommendation's own viability or the other options'.

Strongest counter-argument (moderate): The recommendation's own defining clause rests on a term the schema cannot presently exhibit: `reconciliation-acts-on-a-convergence`'s AI divergence says so directly -- 'a rule that governs every reconciliation this record does today is stated in terms of a mark no node carries, and a reader who tries to check a past reconciliation against it finds nothing to check it with' -- and the account repeats the same admission twice more, once on the fact and once in the dated section recording the author's words. A recommendation whose central mechanism is, by its own text, unauditable is a real reason to hesitate before sending it to the author for ratification. It does not defeat forwarding here: the term is the author's own words at `words/2026-09-08/39` transcribed rather than an AI-invented test, the gap is disclosed at every locus a reader would meet the clause rather than smoothed over anywhere, and the fix is already named and handed to the node that owns the encoding, `what-an-option-row-carries`, rather than assumed or quietly deferred. That is the disclosure the evaluation node's rule against an AI answering a case against itself calls for, not a defect of this text.

The session's reply: Forward taken, and the finding is right and larger than it stated. The measurement of the one-paragraph fence hazard sat on `interim-doctrine-binds-as-last-seen`'s divergence, the option the expert minted, while `projected-doctrine-acts`'s own divergence still read 'The record wrote no case against this option; its divergence is owed', so an author ruling for it met no warning at the place they would rule. The sitting re-measured rather than transcribing. The hazard covers six options and not five: `deferred-as-the-resting-state`, `projected-doctrine-acts`, `grant-expires-at-exit`, `nothing-acts`, `a-bootstrap-class` and `a-standing-direction-acts-by-right` all resolve to a whole fence with a one-paragraph answer, the sixth being the survey's own remedy option, which the finding explicitly said it did not touch. The warning now stands on each of the six in its own `**AI divergence.**`. The recorded measurement had also gone stale inside two days: it named sixty-nine lines for a recommendation that has since moved to `reconciliation-acts-on-a-convergence`, and gave the one-paragraph rivals as four where they are five, so its tallies are struck and the structure stated instead. The re-encoding itself is put to the author rather than performed, since re-encoding an existing option changes what the author would be ruling on. The finding does not touch the recommended option and does not hold the node back from the ruling, as the reading said.

### Frontier survey, 2026-09-09, of f363726e

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Two nodes quote this node's definition of a grant in a form it no longer carries. This node defines "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it", while `probe-or-node` quotes it as "a grant is the author's word, given for one named reconciliation of one unanswered node" and `graph-topology`'s binding answer reads "the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class". The interim both nodes recommend rests on the narrower reading.
- The first term of the convergence this node's recommendation acts on is one the record cannot write. Its rule text says so — the clause "states a rule whose encoding is owed" — and `festo-surrendered-subject-matter` measures it: "`recording`'s ruling responses being `confirm` and `edit`, neither of which writes a choice made and not confirmed. So on the recommendation as it stands there is a mark with no producer and no retraction, on a row the machinery reads." No option on `recording`'s answer fact supplies the missing response.

Strongest counter-argument (strong): The recommendation makes reconciliation act on the convergence of the author's choice with the AI's recommendation, and the record can exhibit neither term reliably: the choice is a mark no ruling response writes, and the recommendation is the AI's own, so where the choice is absent the convergence is assembled by the party holding the other term. Meanwhile two nodes have built their interims on the earlier and narrower definition of the grant this node has since widened to a whole sitting, so the licence has grown while the things resting on it were drawn against its old reach.

The session's reply: Both findings kept. On the grant's reach, this node is the survivor and needs no change: the two nodes quoting the narrower form are `probe-or-node` and `graph-topology`, and the repair is theirs. Confirmed against the record — both carry 'reaches one named reconciliation and no class' while this node defines the grant as reaching 'one alignment sitting and reaching every alignment in it'. The widening is this sitting's own, made under the author's refinement at `words/2026-09-08/22`, so the drift was introduced here and is this sitting's to clear rather than an inheritance. On the convergence, the finding restates what this node's rule text already concedes, and the concession now has a repair standing against it: `a-response-that-records-a-choice-short-of-confirmation` is recorded on `recording`, which is the node that owns the responses and the only place the owed encoding can be made.

### Frontier finding, 2026-09-09

Kind: cross-reference.

Two nodes quote `what-acts-during-bootstrap`'s definition of a grant in a form it no longer carries. That node defines "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant." `probe-or-node` quotes it inside quotation marks as "a grant is the author's word, given for one named reconciliation of one unanswered node" and restates it as "which reaches one named reconciliation and no class"; `graph-topology`'s binding answer reads "the grant the `commons.systems/disposition-graph/what-acts-during-bootstrap` node defines reaches one named reconciliation and no class". Both interims — `interim-follows-the-authors-word` and `topology-is-a-field-until-it-is-contested` — argue from the narrower reach, and both nodes carry `commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right` in `depends`.

Also named: commons.systems/disposition-graph/probe-or-node, commons.systems/disposition-graph/graph-topology.

Proposed: The survivor is `what-acts-during-bootstrap`'s current definition. `probe-or-node` and `graph-topology` re-quote it as it now stands and re-make the argument against the wider reach: a grant that reaches a whole alignment sitting may or may not carry a standing direction about a class of act, and the case each node makes for its interim must be written against "one alignment sitting and reaching every alignment in it" rather than "one named reconciliation of one unanswered node". Where the wider reach makes the argument unnecessary, the interim is withdrawn rather than re-quoted. `what-acts-during-bootstrap` needs no change.

### Frontier finding, 2026-09-09

Kind: coverage.

No node answers how an author's choice short of a confirmation is written, and three depend on there being one. The reading `festo-surrendered-subject-matter` states it: "The node's own text records that the record cannot presently encode the first of them at all, `recording`'s ruling responses being `confirm` and `edit`, neither of which writes a choice made and not confirmed. So on the recommendation as it stands there is a mark with no producer and no retraction, on a row the machinery reads." `what-an-option-row-carries` recommends `five-marks-and-the-two-the-author-added` and `viable-options` recommends `an-option-carries-a-selection-per-party`, both of which put the mark on a row; `what-acts-during-bootstrap`'s rule text makes the unconfirmed choice the first term of the convergence reconciliation acts on and concedes that the clause "states a rule whose encoding is owed". None of the twenty-eight options on `recording`'s answer fact adds a response that writes one.

Also named: commons.systems/disposition-graph/what-an-option-row-carries, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/recording.

Proposed: The survivor is `recording`, which owns the ruling responses, and the gap is closed there rather than on the three nodes that read the mark. The option below puts a third response on the table so that the author can mark a choice without confirming it and can lift the mark, and the two display nodes and `what-acts-during-bootstrap` then cite it instead of describing a state nothing produces. If the author does not want such a response, the same ruling settles it, and the three nodes lose the mark rather than keeping a row the machinery reads and no act can enter.

Recorded as an option on commons.systems/disposition-graph/recording's answer fact: `a-response-that-records-a-choice-short-of-confirmation` (source review, 2026-09-09).

### Frontier finding, 2026-09-09

Kind: vocabulary.

Eleven of the twenty-one judged nodes claim terms in `defines` and gloss none of them, including two at the ruling stage. The header lines read, verbatim: "- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)" (`growth`); "- Defines: `confirmation` (no gloss yet); `kickback` (no gloss yet); `steelman` (no gloss yet); `substance` (no gloss yet)" (`recording`); "- Defines: `clean-context review` (no gloss yet)"; "- Defines: `option` (no gloss yet); `viable` (no gloss yet); `grant` (no gloss yet)" (`viable-options`); "`doctrine` (no gloss yet); `proposal` (no gloss yet)" (`authority`); "- Defines: `neighbourhood` (no gloss yet)" (`review-cost`); "- Defines: `probe` (no gloss yet)" (`author-questions`, at the ruling stage); "- Defines: `frontier survey` (no gloss yet)"; "- Defines: `reading` (no gloss yet); `tradition` (no gloss yet); `adopted` (no gloss yet); `diverged` (no gloss yet); `chosen over` (no gloss yet)" (`readings`); "- Defines: `seam` (no gloss yet)" (`decomposition`); "- Defines: `session context` (no gloss yet); `rules` (no gloss yet)" (`session-context`, at the ruling stage). Two of them are worse than empty. `authority` glosses both its terms in its own answer — "Doctrine is the ratified answers taken together." and "A proposal is technical vocabulary and is not overloaded" — so the definition exists everywhere but the entry the term index reads. And `viable-options` claims `grant` while `what-acts-during-bootstrap` defines the same thing under another name: "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant." The mechanical tier does not reach any of this: `term-without-a-path` reports only a used term "with no path to it over 'under', 'depends' or 'cites'", which presupposes a definer and never asks whether the definer said anything.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/clean-context-review, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/review-cost, commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/session-context.

Proposed: Each node fills the glosses it claims, which is a fill and not a redraft, so no stage is owed for it and none is named here except where the answer itself is implicated. The two exceptions: `authority`'s glosses are copied from its own answer, which is bookkeeping; and `viable-options` and `what-acts-during-bootstrap` settle between them who defines the grant, since one claims the term with nothing behind it and the other defines the thing under the name `bootstrap authority` — the survivor is `what-acts-during-bootstrap`, which has the author's own term and a gloss, and `viable-options` drops the claim or points at it. A node that cannot gloss a term it claims is claiming a term it does not own, and dropping the entry is the other way to close it.

### Subtree divergence, 2026-09-09

Two unruled nodes rest their interims on one option pending on `what-acts-during-bootstrap`, which recommends another. `graph-topology`'s header reads "- Depends: commons.systems/disposition-graph/recording#prune-of-an-unruled-node-needs-no-ruling, commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right", and `probe-or-node`'s reads "- Depends: commons.systems/disposition-graph/graph-topology, commons.systems/disposition-graph/what-acts-during-bootstrap#a-standing-direction-acts-by-right". Both answers make the dependence explicit: `graph-topology` says "a direction about a class acts by right only if that node's option `a-standing-direction-acts-by-right` is ruled, on which this interim rests", and `probe-or-node` says "the interim rests on the author's words and on nothing that node confers until the option is ruled". The ancestor recommends `reconciliation-acts-on-a-convergence`, not that option, so a ruling for the recommendation discards the ground both interims stand on — and both interims are what acts today, one of them a prune.

- `a-standing-direction-acts-by-right` keeps commons.systems/disposition-graph/graph-topology, commons.systems/disposition-graph/probe-or-node; discards nothing else named here.

---
question: What does an unanswered node carry?
stage: maieutic
probes:
  - id: option-text-per-node-or-per-option
    asks: >-
      In the author's sentence on viable-options that an option carries in full
      the text where it would stand as the answer, is one text held per node or
      one text per option?
    fact: answer
    why: >-
      viable-options' answer sentence admits both readings on its face; this
      node's own facts prose says it "is read here as the fence, one text per
      node and the recommended option's" and that the other reading "is a change
      to this encoding and nothing in the record carries it today". Read for an
      answer: viable-options' `## Answer` and its `## Facts`, this node's fence
      (the `## Recommendation` paragraph on `## Recommendation`, "the
      recommended text when the answer fact recommends an option other than the
      one that stands ... one fenced markdown block holding the whole proposed
      node"), and alignment-page's option list. None of the three settles which
      reading the author's sentence carries; the AI recorded that it chose one.
    discharges: >-
      whether the `## Recommendation` fence holds one text or a text per option,
      and therefore what the reader, the validator and both projections must
      accept. It moves the answer fact's recommendation
      `every-part-in-the-record`, whose fence states the one-text rule in terms.
    source: ai
    raised: 2026-09-04
    status: discharged
    reason: >-
      the author answered it on 2026-09-07, in the words recorded under this
      node's `## Disposition`: "each option for each fact is recorded with its
      actual fact content so that when the author selects an option via the
      alignment artifact the context pane is dynamically updated to preview the
      node that is being confirmed." One text per option, and the reason is the
      context pane, which cannot preview a node under an option whose text the
      record does not hold. The probe's own `discharges` named the fence and the
      recommendation `every-part-in-the-record`; the answer dissolves both, since
      an option's content lives in its `####` subsection and there is no fence,
      so what it settles is what the reader, the validator and both projections
      must accept, which is the two content forms and the strict resolution
      between them. Discharged by the author's answer under
      `author-questions`' first discharge reason, and not by a session's reading
      of it.
  - id: proposal-at-two-loci
    asks: >-
      Does the record anywhere say the dialogue's own section is a proposal in
      the authority node's sense, or is the collision only in the name, and does
      the author's note that a conflicting answer arising outside alignment is a
      proposal state authority's definition as written or narrow it?
    fact: answer
    why: >-
      authority's sentence defines a proposal as what would contradict doctrine
      or exceed its scope and says nothing about where the answer arose, while
      this node's seventh part carried the same word for the AI's account in
      prose.
    discharges: >-
      whether the seventh part keeps the name, and whether authority's
      definition is narrowed; it moved the answer fact's recommendation and
      authority's.
    source: ai
    raised: 2026-09-03
    status: discharged
    reason: >-
      the author answered it on 2026-09-03, in the words recorded under this
      node's `## Disposition` and on `authority` — "closer to the second
      meaning. A conflicting answer that arises outside of alignment is a
      proposal. eg. via some evidence/signal/instrument/criteria or because a
      conflict is identified outside of alignment. The term must not be
      overloaded - it is technical vocabulary." Under the probe-or-node rule
      of 2026-09-04 this entry was not a probe: its `discharges` names two
      nodes' recommendations, and the response stood, as authority's
      definition of `proposal`, in that node's `defines`, its `## Answer`, and
      the rule projected from it; the question was authority's and the
      author's words are quoted there. Authority is not entered in this node's
      `depends` because authority waits on viable-options, which waits on this
      node, and a cycle is no order.
  - id: two-facts-or-four
    asks: >-
      Does a node carry only the answer and authority facts, with everything
      else moved under fact options, or does a node such as agency carry no
      existence or persistence fact only because its dialogue has not reached
      the ruling?
    fact: answer
    why: >-
      the author asked it on 2026-09-04 of the two facts the alignment page
      listed on commons.systems/public/agency, and this node's recommended
      text answers with four reserved names, two unconditional and two
      conditional, which is neither of the two readings the author offered;
      what they took the facts model to be is a fact about what they meant.
    discharges: >-
      how the author reads the facts model, which which-facts-are-listed rests
      on when it decides whether the page lists the four reserved names
      whatever the node carries.
    source: author
    raised: 2026-09-04
  - id: what-the-account-records
    asks: >-
      What is "The AI's account" meant to be recording, and is it justified to
      support the alignment dialogue and the review?
    fact: answer
    why: >-
      the author said on 2026-09-04 that they do not understand what it is
      meant to record and conditioned keeping it on that justification; this
      node defines `account` and its answer says what the section holds, so
      the answer is a reading of this node's answer and not a question of its
      own, and the-account-on-the-page decides only the presentation.
    discharges: >-
      whether `## Account` is kept in the record, which the author's condition
      makes turn on what it is for.
    source: author
    raised: 2026-09-04
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 9d6e470956601ff19c472045db38544dd2159098
  commit: c1128d49c3f3b295deef2f4d20e60aa4a8cd77f7
  against: "The amendment's own account asserts, without evidence this delta reading can check, that the two edits it credits to `node` and `viable-options` (options `a-node-file-is-facts-and-account` and `every-weighed-candidate-must-be-recorded`) actually landed at commit `d4ab0283`. If either did not land as claimed, the record would still be short the two merge-finding discharges validation 15 raised, and nothing in this node's own file would show it. This is a residual, non-blocking gap rather than a defect the amendment introduces or fails to answer on its own object: the last reading treated the identical item as unverifiable-but-not-kickback-worthy, and the repair changes nothing about that status."
facts:
  - name: answer
    options:
      - name: alternatives-beside-facts
        source: ai
        ref: "2026-09-03"
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
        supports:
          - words/2026-09-03/28
          - words/2026-09-03/29
          - words/2026-09-03/34
          - words/2026-09-03/38
          - words/2026-09-03/39
          - words/2026-09-03/40
          - words/2026-09-03/41
          - words/2026-09-03/42
          - words/2026-09-03/43
          - words/2026-09-03/44
          - words/2026-09-03/45
          - words/2026-09-03/46
          - words/2026-09-03/47
          - words/2026-09-03/48
          - words/2026-09-03/49
          - words/2026-09-03/50
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
      - name: aspects-are-nodes
        source: review
        ref: "2026-09-03"
      - name: facts-carry-options
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/27
          - words/2026-09-04/28
      - name: survey-pin-in-review
        source: commons.systems/disposition-graph/decomposition
        ref: "2026-09-04"
      - name: ruling-carries-the-reason
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
      - name: every-option-carries-its-sentence
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
      - name: authority-fact-on-every-node
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
      - name: edit-led-against-a-named-ground
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
      - name: every-part-in-the-record
        source: ai
        ref: "2026-09-04"
      - name: state-as-prose-only
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the page would keep guessing at prose conventions"
      - name: a-date-per-movement
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it duplicates history"
      - name: a-draft-file-per-node
        source: ai
        ref: "32600efe"
        status: passed
        reason: "a node is one file and the draft is parseable inside it"
      - name: a-stored-diff
        source: ai
        ref: "32600efe"
        status: passed
        reason: "it is derived from the draft and the node"
      - name: persistence-as-a-stored-fact
        source: ai
        ref: "32600efe"
        status: passed
        reason: "a node is always standing and its shims are declared"
      - name: validator-refuses-a-changed-draft
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the session decides whether a change is substance, and the flag gives it the fact"
      - name: status-field-for-pending-alternatives
        source: author
        ref: "32600efe"
        status: passed
        reason: "it is the flip the author suggested and retracted on 2026-09-03"
      - name: alternatives-as-prose-in-the-account
        source: ai
        ref: "32600efe"
        status: passed
        reason: "the page could not show them beside the answer"
      - name: a-node-per-alternative
        source: ai
        ref: "32600efe"
        status: passed
        reason: "an alternative is a candidate answer to this question and not a question of its own"
      - name: account-carries-the-sitting-minutes
        source: commons.systems/disposition-graph/recording
        ref: "2026-09-04"
      - name: standing-option-carries-a-subsection
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-04"
      - name: instrumentation-is-a-fact
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/27
          - words/2026-09-04/28
      - name: commit-in-the-review-block
        source: commons.systems/disposition-graph/review-cost
        ref: "2026-09-05"
      - name: source-names-who-raised-it
        source: commons.systems/disposition-graph/viable-options
        ref: "2026-09-05"
      - name: probes-in-the-enumeration
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-05"
      - name: dialogue-glosses-the-four-fact-names
        source: commons.systems/disposition-graph/how-a-fact-is-headed
        ref: "2026-09-07"
      - name: an-unconfirmed-nodes-draft-shape
        source: review
        ref: "2026-09-07"
      - name: survey-pin-carries-its-commit
        source: commons.systems/disposition-graph/frontier-consistency
        ref: "2026-09-07"
      - name: an-option-carries-its-content-its-words-and-its-case
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/2
          - words/2026-09-07/3
          - words/2026-09-07/4
          - words/2026-09-07/11
          - words/2026-09-07/12
          - words/2026-09-07/13
          - words/2026-09-07/14
          - words/2026-09-07/15
      - name: the-survey-block-carries-what-the-next-survey-selects-on
        source: commons.systems/disposition-graph/survey-selection
        ref: "2026-09-07"
      - name: generated-answer-and-disposition-sections
        source: review
        ref: "2026-09-07"
        status: passed
        reason: a generated section stored in the file is a copy the validator must check against its derivation, and the projections render the same derivation without storing it
    recommends: the-survey-block-carries-what-the-next-survey-selects-on
    boldness: moderate
    against: "It takes every surface on which the author checks the AI and makes it something the AI derives — the answer resolved through hunks against another option, the author's own words reached by `supports` and `diverges` references the AI files, the confirmed label computed — and it composes the encoding in force, five clauses folded into it earlier, the per-option content, the ledger, the removal of four sections and a six-key survey block into one row whose bundling the AI chose, so a confirmation confers together what the author examined and what they did not."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The migration this ruling would order is already under way under the author's grant of 2026-09-07, so by the time the author rules the record will be written this way and the ratification will bless what was done rather than choose between live rivals; deferred would let the same recommendation act, keep the node in front of the author, and cost nothing that the grant is not already spending."
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/quotes#words-in-a-ledger-on-the-ref
  - commons.systems/disposition-graph/unconfirmed-accumulation#the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Facts

### answer

`the-survey-block-carries-what-the-next-survey-selects-on` is recommended. It is
`an-option-carries-its-content-its-words-and-its-case`, the author's refinement of
2026-09-07 written into the encoding, with the survey's block on a node carrying
four keys beside its `date` and its `of`, so that the next survey's selection is
local to the node it judges. What the composed option takes in, in the order the
record took it: the encoding in force, `facts-carry-options`; the five clauses
raised against it since its review and folded into `every-part-in-the-record`, each
an instance of one rule, that every part a ruling or a projection needs is in the
record, in one place; the author's refinement of 2026-09-07, which is the content
on every option in one of two forms, the derived confirmed label, the three
accumulations, and the recording and retention rules; the ledger the author asked
after in the same sitting, which is where the words go and which the quotes node
owns; the removal of `## Answer`, `## Recommendation`, `## Rationale` and
`## Disposition`, which is what is left of a node file once those are in it; and
the survey's six keys. The weighing is the same in every part. Each is a place the
record held part of a thing and let something else hold the rest — the projector's
sentence table, the page's database, the sidecar pin, the inferred ground, the
rival option whose text lived in prose about it, the `stands` key that names the
option whose section holds a text and not the option the author last confirmed, the
quotation copied by hand onto eight nodes, the survey's own state in a commit
message — and in each the part outside the record was the part that could lie. That
is what makes them one answer and not eleven, and it is also, exactly, what the
case against says the AI chose for the author.

Boldness moderate. Most of what this option decides is the author's, in their own
words of one day: the per-option content and the context pane it exists for, the
confirmed label and the striking of standing, the three accumulations each headed
support or divergence, the recording rule for options, the retention rule for
quotations, the ledger, and the condition the named-change form must meet, "as long
as the exact node preview can be mechanically derived (eg. via patch syntax)". What
rests on the AI is the composition itself, which the author's delegation of
2026-09-03 covers in terms — "Encoding details are delegated" — but which no ruling
has yet touched; the reading that the four sections go, which is an inference from
"Anything else that doesn't support the alignment dialogue/artifact disposition is
subject to accumulation/removal" and not a sentence the author wrote; the survey
block's four added keys, which come from the `survey-selection` node and not from
the author; the widening of the pin to the option list; and the reading of the
author's words that `edit-led-against-a-named-ground` takes, which the review that
raised it called unsettled. Boldness runs in the direction the author gave it on
2026-09-03, "stick with boldness then, I want to know how much rests on the AI's
own knowledge against the record", so high boldness is low confidence; `growth`
defines the term and its own definition sentence runs the other way, which its
option `boldness-reversed` repairs, and since that repair brings that node to this
usage and to the author's words, this ruling does not wait on it.

**Three of the five earlier clauses are departed from, and the fence says so.**
`authority-fact-on-every-node` as recorded says every node carrying a stage carries
an answer fact and an authority fact; the fence says every node carrying facts
does. Measured at graph commit `93644144`: a hundred and fifty nodes all carry a
stage and a hundred and forty-six carry facts, and the four that carry none stand
at the periagogic stage, where no candidate answer has been drafted and there is no
decision to record. A fact-less node there is not the gap the clause was raised
about; requiring an authority fact on it would ask the author to confer a class on
an answer that does not exist. From the review stage on a node carries facts,
because a review reads a recommendation, so the requirement bites exactly where it
matters. `survey-pin-in-review` as recorded also says when the pin is written, "at
apply only where the recommendation still matches what was read"; that is the
review's own step and the `clean-context-review` node's, so the fence keeps the
field's shape and the readiness rule and cites that node for the rest. And
`every-option-carries-its-sentence` opens by saying the two exemptions go and closes
by striking one and keeping the other; the fence states what it concluded and not
what it opened with, and under the author's refinement the exemption it kept is
struck too, since an option's content is an option's content whether or not the
author last confirmed it and no section stands outside the facts to hold one.

**Three options are absorbed whole, and one is adopted rather than left standing
beside its own key.** `standing-option-carries-a-subsection` is what the sentence
that every option has a subsection now says; `an-unconfirmed-nodes-draft-shape`
asked which of two shapes a draft takes and is dissolved rather than answered,
since this option abolishes both; `survey-pin-carries-its-commit` is the first of
the four keys the survey's block gains. `commit-in-the-review-block` is adopted
too, and for a reason the review found: the reader has carried the draft reading's
`commit` since 2026-09-05, `review-cost`'s delta re-reading needs it, and an answer
that enumerated four draft keys and closed against a fifth would make a shipped key
unsupported implementation on the day it was ruled. So the draft block carries six
keys with four required, and the survey block six of its own, and the two readings'
commits are carried by one rule.

**`existence` and `persistence` stay conditional, and the asymmetry with
`authority` is a decision and not an oversight.** Every ruling decides a class,
since a confirmation on the answer fact confers ratified and delegated and deferred
are conferred only by a ruling on the authority fact, so the class must be askable
wherever a ruling can be given, which is why its absence closed the author's third
exit. A prune and a change of shape are decided only where one is proposed. A
keep-or-prune row on a node nobody has proposed pruning is a candidate no one
considered, which the options rule does not admit, and it would put a row on every
screen in the record to ask a question none of them raises.

**A gloss is the sentence a `defines` entry carries beside its term**, written
`{term, gloss}`, saying what the term means and so what confirming that choice
would mean where the term is an option's name. It lives on the node that defines
the term and nowhere else: `ratified`, `delegated` and `deferred` on `authority`,
`keep` and `prune` here. That is the home the two vocabulary facts' options were
missing, and it is why those options carry no `#### <option>` subsection:
`ratified` means the same on every node, so a subsection per node would be one
sentence written a hundred and forty-six times and would drift. This draft writes
two more, for `answer` and for `persistence`, which are the two of the four
reserved fact names the record glosses nowhere and which
`how-a-fact-is-headed`'s recommended option needs so that no fact heading on the
alignment page falls back to an unlinked word or links to a node asking another
question; the option `dialogue-glosses-the-four-fact-names` drafted them and this
answer adopts them, since the sentences are this node's to write. The consequence
the record should not discover later is that a gloss is part of what stands on the
defining node, so writing one moves that node's own pins and no other's.

**The two `against` fields are outside every pin, and that is the load-bearing part
of them.** A fact's `against` is the strongest case against the option it
recommends, in one line and in the AI's own words, written when the recommendation
is recorded, which is the adversarial reading of one's own output the `evaluation`
node requires; the review's `against` is the counter-argument the reader returned,
which the projections show in its place on the recommended option's row. Neither is
pinned. The fact's is the argument the recommendation had to beat and not part of
what is recommended, so sharpening it should not send a reviewed node back; the
review's is written by the apply step of the very review whose pin sits beside it,
so a pin that covered it would stale itself the moment it was recorded. Measured at
the same commit: two hundred and four facts that recommend carry no case against,
sixty-eight of them at the review or the ruling stage, so the field is owed on most
of the record and is not a defect of the nodes that lack it.

**What the pin gains, and what it gives up.** Two changes, each stated because
neither is visible from the option's sentence. The option list moves inside the
pin — each option's name, source, ref, status with its reason, and its `supports`
and `diverges` — because under the refinement an option is a claim about the
author's own words and not only a name on a list, and a claim about the author,
filed by the AI, on the surface where the author rules, is the last thing that
should reach a ruling unread. The cost is real and is paid: adding an option to a
reviewed node now returns it to be read. And because an option's content resolves
through a base, an edit to a base option moves the pin of every fact whose
recommendation resolves through it, so the ladder this node's own recommendation
sits on is a ladder of pins.

**What the reader must change, named exactly, at implementation commit
`feaaac1b`.** Two units are already built and wired to nothing:
`packages/disposition/patch.mjs`, which parses, applies strictly and produces
hunks, and `packages/disposition/words.mjs`, which parses the ledger, resolves a
reference and reports unreferenced entries. Eight things are owed in
`packages/disposition/read.mjs`: the option keys `content`, `supports` and
`diverges`, where `OPTION_KEYS` today is `name`, `source`, `ref`, `status`,
`reason`, `ruling`; the survey block's `commit`, `text`, `findings` and `pairs`,
where `REVIEW_SURVEY_KEYS` today is `date` and `of`; the resolution of an option's
content with its cycle check, where the reader refuses a cycle for `under` alone; a
`depends` cycle, refused nowhere, of which two are live today, this node with
`viable-options` and `alignment-page` with `unanswered`; `stands` struck from
`FACT_KEYS` with the confirmed label derived in its place; the four section names
struck from `SECTION_ORDER`; the answer fact and the fact's own reason required
from the review stage on, beside the authority fact already required; and the
`####` requirement inverted, since the reader exempts the option `stands` names.
The record's own debt at graph commit `93644144`: a hundred and five answer options
carry no subsection and every one is the option `stands` names; eighty-six facts
recommend with no reason, fifty-two at the review or ruling stage; a hundred and
thirty-four files carry `## Answer` and `## Rationale`, seventy-four
`## Disposition`, forty-four a fence; and no node carries a ruling, so nothing in
the record is confirmed and `stands` is nowhere the confirmed label.

**`depends`.** Three entries: `clean-context-review#per-draft-and-survey`,
`quotes#words-in-a-ledger-on-the-ref`, and
`unconfirmed-accumulation#the-fold-runs-at-the-checkpoint-and-only-over-what-is-pushed`.
`viable-options` is dropped, because this ruling no longer waits on that one: the
fence cites `authority` for the class read off the rulings and `viable-options` for
what viability is and whether a candidate leaves the list, and reads correctly under
either ruling there, while as recorded the entry closed a loop with that node's own
`depends` on `dialogue#aspects-are-nodes`, which is an option this answer carries
whole and a ruling here settles. A loop is a finding under this node's own answer
and one side of it is dropped; this is that side. The three kept are the questions a
ruling here would otherwise get wrong: `review.survey` exists only if the review
divides into two readings, the ledger the options reference is the quotes node's to
confer, and what a node keeps before a confirmation is the accumulation node's.
`survey-selection` is not entered, though this option came from it, because that
node's `depends` already names this option and the pair would close the loop the
paragraph above just opened one side of; the fence cites it for what the survey's
keys carry and reads correctly under any ruling there.

#### alternatives-beside-facts

The re-answer of 2026-09-03 as it stood until 2026-09-04: the node carries `alternatives`, the candidate answers with their sources, beside `facts` with their choices, a node-level `recommendation` with its pin, the fence, the review, `depends` and the account, and confirmed dialogue state folds into the node at the recording. Viable if the author prefers two structures and a stamp; `aspects-are-nodes` is this answer with the decision-per-aspect rule.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The re-answer of 2026-09-03 as it stood until 2026-09-04: the node carries `alternatives`, the candidate answers with their sources, beside `facts` with their choices, a node-level `recommendation` with its pin, the fence, the review, `depends` and the account, and confirmed dialogue state folds into the node at the recording. Viable if the author prefers two structures and a stamp; `aspects-are-nodes` is this answer with the decision-per-aspect rule.
```

#### minimal-dialogue-state

The clean-context review's strongest counter-argument, twice recorded as strong, holds that the node's own test for storing anything is what re-derivation cannot reconstruct, and that three of the parts fail it: the recommendation's class and boldness are judgments a session would make again from the same node, the review's verdict and strength are re-derivable by re-running the review, and the draft is a copy of the node inside the file that holds it. The candidate answer is that the dialogue carries only the author's words, the stage, and the AI's prose account, and that everything else is derived at each reading. The session replied that the record stores the results of judgments as it stores a stamp or a boost, and the author has not ruled on it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The clean-context review's strongest counter-argument, twice recorded as strong, holds that the node's own test for storing anything is what re-derivation cannot reconstruct, and that three of the parts fail it: the recommendation's class and boldness are judgments a session would make again from the same node, the review's verdict and strength are re-derivable by re-running the review, and the draft is a copy of the node inside the file that holds it. The candidate answer is that the dialogue carries only the author's words, the stage, and the AI's prose account, and that everything else is derived at each reading. The session replied that the record stores the results of judgments as it stores a stamp or a boost, and the author has not ruled on it.
```

#### freeze-standing-under-recommendation

The finding that the review pin covers only the draft and not the standing answer names three answers and adopts none: pin both texts, pin the whole node, or hold that a node's standing answer may not be amended at all while a recommendation on it stands. The author's maieutic ruling took the pinning route, adding the standing hash and the graph commit, so what is still open is the third: forbid the amendment rather than flag it. The finding was explicitly left for the ruling rather than decided in the sitting.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The finding that the review pin covers only the draft and not the standing answer names three answers and adopts none: pin both texts, pin the whole node, or hold that a node's standing answer may not be amended at all while a recommendation on it stands. The author's maieutic ruling took the pinning route, adding the standing hash and the graph commit, so what is still open is the third: forbid the amendment rather than flag it. The finding was explicitly left for the ruling rather than decided in the sitting.
```

#### depends-migration-named

The answer names the migration that `depends` orders and drops the claim that the frontier shows the gap. Verified that zero nodes carry the field, twenty-three carry the `Depends on:` prose it replaces, the projector reads it nowhere, and the frontier prints nothing about it, so a confirmation today ratifies a seventh part of the dialogue state that no node uses and no projection reads. On this alternative the answer says that the field is defined and not yet carried, that the prose conventions stand until the migration lands, and that the migration is part of what the confirmation orders — which is what dialogue's own account calls 'a reconciliation with the author's ruling on each' rather than a landing inside one sitting.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The answer names the migration that `depends` orders and drops the claim that the frontier shows the gap. Verified that zero nodes carry the field, twenty-three carry the `Depends on:` prose it replaces, the projector reads it nowhere, and the frontier prints nothing about it, so a confirmation today ratifies a seventh part of the dialogue state that no node uses and no projection reads. On this alternative the answer says that the field is defined and not yet carried, that the prose conventions stand until the migration lands, and that the migration is part of what the confirmation orders — which is what dialogue's own account calls 'a reconciliation with the author's ruling on each' rather than a landing inside one sitting.
```

#### depends-names-an-alternative

The alignment-order draft records a divergence between subtrees on the leaves: each node the review finds to stand under one side names, in `depends`, the ancestor and the alternative on it that it stands under, and the page derives the divergence at the ancestor by inversion. `depends` as this node defines it carries node ids only; the alternative extends its target to an alternative on the named node, keeping the inverse derived and never stored. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The alignment-order draft records a divergence between subtrees on the leaves: each node the review finds to stand under one side names, in `depends`, the ancestor and the alternative on it that it stands under, and the page derives the divergence at the ancestor by inversion. `depends` as this node defines it carries node ids only; the alternative extends its target to an alternative on the named node, keeping the inverse derived and never stored. Raised on commons.systems/disposition-graph/alignment-order, from the author's words of 2026-09-03 recorded there.
```

#### first-answer-is-not-an-amendment

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

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
```

#### caption-only

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

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
```

#### ranges-on-whole-node-alternatives

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

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
```

#### aspects-compose-the-answer

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

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

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
```

#### aspects-are-nodes

Raised by the greenfield validation of 2026-09-03 as the design that beats every
other on the table, and adopted by the sitting as its recommendation.

A textual decision the author wants to rule on separately is a question, and a
question is a node. The record says so already, twice in the same answer: "If a
text answers two questions, it is two nodes" (`node`). It already permits the
child while the parent is open: "A reading, a refinement, or any other node may
therefore sit under an open question, and does not have to wait for the
question to be answered" (`un-aligned-children`). And it already makes partial
ratification legible without inventing anything, since "a node's ceiling is its
nearest ratified ancestor" (`under`), so a ratified child under an unstamped
parent is exactly a decision the author has confirmed inside a question they
have not.

The decisions that are genuinely not questions of the node's own subject
matter, the authority class a confirmation would confer, the node's existence,
keep or prune, and its persistence where the recommendation would change its
shape, are facts about the answer rather than questions under it. Those are a
small reserved `facts` set on the node, each with its `choices`, the one it
adopts, its `boldness`, and its `ruling`.

The author's page follows without a new mechanism. List A is the decisions on
the node itself: its own answer, where alternatives are pending on it, and its
asking facts. It holds no children, the author having ruled on 2026-09-04 that
it must not, since the ruling order is one order the page pages flat and a
child ruled from inside its parent's screen leaves it. List B under a row is
that decision's choices, each with the recommendation among them and its
boldness, both of which the record already carries per node. The right-hand
pane is the node's answer as it would stand, with its unanswered children
beneath it as indications, which is the inversion `alignment-order` already
prescribes at an ancestor and not a second place to rule. A ruling on an aspect is the child's stamp, dated and quoted where
`quotes` already requires it. Cross-decision coherence is `depends`, which the
record already defines as naming a node and an alternative on it.

Nothing about the stamp, `quotes`, `rejected`, the `amends` pin, or the rules
projection changes, because the answer stays written and stays stored. There is
no second unit of decision inside the node duplicating the first, no derived
prose, no `excludes`, and no ruling that is a stamp by another name.

Its cost, stated as a consequence and not as a reason: the graph holds more
nodes, and the page must render a subtree as one disposition. Settling counts
grow, which the ruling order already absorbs, since an ancestor's unanswered
subtree contains its descendants' by construction.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

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
```

#### facts-carry-options

Alternatives and facts become one structure: every decision on a node is a fact with viable options, the answer among them, its options the candidate answers this answer lists as alternatives. The node-level recommendation field goes, each fact carrying its recommended option with why and boldness; each option carries its source, its reference, the readings bearing on it, and a ruling once the author has given one. The options persist after the recording, which amends the sentence that confirmed dialogue state folds and unconfirmed state survives only in version control: what folds is the dialogue, the stage, the review, depends and the account, and what persists is the facts with their options. `aspects-are-nodes` stands: the facts are the answer and the reserved three, and any other decision is a child. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

**AI support.** The author's question of 2026-09-03, quoted above, answered greenfield that day and re-answered the same day under the author's second disposition, quoted above, which asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and delegated the encoding's details. What the dialogue must carry is fixed by what cannot be re-derived once the session that held it is gone: the author's words, the position reached, the alternatives on the table and where each came from, the recommended text, the facts the presentation rule requires, and what the reviewer found. Each of those was in the record on 2026-09-03, but most as prose conventions inside the account: a "Facts:" line, a "Proposed text" block, a review subsection with a verdict and a strength, an alternatives list nobody could render, and two conventions for the draft. Prose conventions drift, and the page could not read them; the reviewer had already flagged that "as shown" was ambiguous between the node and the draft. This answer makes the alternatives, the facts, the pin, the verdict, and the draft data where a projection or the validator reads them, and keeps them prose where only a person does; the stage stays one field, since the movements are ordered and a date per movement would store what version control already holds.

The re-answer's decisions. The flip of an answered node to unanswered while an alternative is pending was the author's first suggestion and was retracted by the author on 2026-09-03 as a hack; what the author wants at a functional level, in their words, is to see when reading an answered node whether alternate proposals from outside alignment or alternate answers from within it are pending, which the alternatives list with its sources gives beside the standing answer with no change of status. That a standing answer of any class keeps its full authority while an alternative is pending, and that a proposal from outside alignment opens the dialogue on its node, are the author's rulings of 2026-09-03, quoted above. The pin answers the author's observation that a whole node goes stale as easily as a diff: the hash of the standing text the recommendation amends, checked as the review's hash is, and the graph commit it was drafted at. The vocabulary follows the author's ruling on the authority node the same day: the AI's account loses the name proposal, and a conflicting answer that arises in alignment is an alternative. The encoding was written under the author's bootstrap grant, quoted above, after the periagogic and maieutic movements on this node and before the clean-context review, which runs on what the reconciliation wrote.

Traditions, recorded as readings under this node or owed under the stub-traditions ruling: architecture decision records in the MADR form, the reading under this node, whose considered options with their sources, chosen option, and status this encoding adopts, with the status derived here where MADR stores it; the RFC and PEP processes, a status field on a prose document with a fixed order of states; review approvals pinned to a revision in code review, where a new revision marks the approval stale; and the review of a change as a diff against what stands.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Each fact on a node, regardless of authority, has viable options list (possibly length 1) with a) AI recommendation/why b) support or divergence from tradition for each option and c) (if answered) the confirmed choice and why"; "For each fact, the confirmed choice, the AI recommendation and support divergence from tradition as well as any non-chosen option which is categorized as 'viable' by the AI - these are all is persisted after confirmation to mitigate regression." Alternatives and facts become one structure, since a candidate answer is a choice on the answer and the record had two shapes for one thing; the node-level recommendation goes into each fact, which is where its boldness already sat; the stamp goes, the class being read off the rulings; the sentence that confirmed dialogue state folds and unconfirmed state survives only in version control is amended, since what folds is the dialogue and what persists is the facts, which the minimal-state principle keeps by its own test: what persists is judgment that re-derivation cannot reconstruct, and what dies is the account, which re-running the review reconstructs. `aspects-are-nodes` stands within this answer, its second paragraph. The encoding's field names are the delegated detail the author left to the AI on 2026-09-03 and are decided on the viable-options node. The answer as it stood is kept as the option `alternatives-beside-facts`, and the review of this text is owed.

The author, 2026-09-06, making the prune grant standing rather than a grant given case by case:

> the prune grant is standard disposition.
> - may not prune something that is ratified
> - anything from the author (such as quotes) must be transferred to another node before prune
>
> Otherwise, pruning authority is granted to AI under general delegation of graph topology.

The author, 2026-09-04, on the alignment page, transferred here on 2026-09-06 from `the-account-on-the-page` before its prune, being the words the probe `what-the-account-records` rests on:
> - I do not undertand what "The AI's account" is meant to be recording. If it is justified to support alignment dialogue and review then keep it, but it does not need to be presented in the UI.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Its question, its fields, its facts with their options, and its answer as it stands; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, the author's words stay as the quotes node decides, and the facts stay with their options, their recommendation, their readings and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. It has these parts, each holding only what cannot be re-derived.

One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.

`facts`, every decision on the node, as data, each with a `name`, its `options`, the one it `recommends` with the `boldness` of that recommendation, low, moderate, or high, how much of it rests on the AI's own knowledge against the record and the author's words, and, on the answer fact, `stands`, the option whose full text the answer section holds. Four names are reserved and no others are minted without a ruling here: `answer`, whose options are the candidate answers to this node's own question; `authority`, the class a ruling would confer, ratified, delegated, or deferred, which is why no recommendation carries a class of its own; `existence`, keep or prune, which is where a proposal to prune the node is recorded rather than as an option of a special shape that answers no question; and `persistence`, present only where the recommendation would change the node's shape, declaring or liquidating a shim or adding or dropping evidence, its options being those shapes, and otherwise derived from the shape and asking nothing. An option carries its `name`; on the answer fact its `source`, the author's words in the disposition, the AI, the clean-context review, or the instrument or node that raised it outside alignment, and its `ref`, the date of the words or of the review, the graph commit, or the instrument or node; and its `ruling` once the author has given one. An option is viable, and stays on the list, while nothing on the list dominates it on the record's criteria, in the AI's judgment; an option the AI no longer holds viable leaves the list, and the option that displaced it says why. `## Facts` holds one subsection per fact, in the same order, opening with the reason for its recommendation, and under the answer fact one subsection per option, in the same order, saying in prose what the option would answer and why it is on the table; the option that stands needs none, since its text is the answer. A recommendation may be recorded at any stage of the dialogue, as the author ruled on 2026-09-04, and is required from the review stage on, since a node cannot be reviewed without one; a recommendation withheld until a stage boundary is a recommendation held in a session, which the first requirement above forbids. The AI may add an option or move a recommendation in alignment, in reconciliation, and in the loop on itself, within the scope its class allows, as the authority, evaluation and work-loop nodes say.

A `ruling` is the author's act on the option they chose, recorded on it: the `response`, confirm or edit, the `date`, and `of`, the hash of the fact's recommendation it answered, the recommended option with its reason and, on the answer fact, its text, so that a recommendation moved after the ruling shows as moved on the frontier and the page. A denial is never a ruling: it is a kickback with the author's words. Only the author rules, on the alignment page or in prose, and the AI writes no ruling and no class for itself.

`stage`, the next movement owed: periagogic, maieutic, review, or ruling. The movements come in that order, so the stage also says what is behind the node, and a kickback moves it back. A recommendation moved on a node with a class re-opens the dialogue at the movement the recording node's classification calls for, the review where only the recommendation moved, from wherever the move came.

`## Disposition`, the author's words, verbatim and dated, accumulating through the dialogue.

`## Recommendation`, the recommended text when the answer fact recommends an option other than the one that stands: one fenced markdown block holding the whole proposed node, frontmatter and sections, so that the same reader parses it and the projections derive the edit, field by field and word by word, beside the whole. Where the recommended option is the one that stands, on every node whose recommendation acts and on every node whose draft is its recommendation, there is no such section, and a confirmation rules for the answer as it stands. A diff is derived from the fence and the node and never stored. The draft, elsewhere in the record, is this text. It may be invalid under the doctrine of the day, as when it presumes a ruling not yet given; the validator parses it and checks only that it answers the same question and carries no facts, rulings or dialogue state of its own.

A ruling that gives a node its first answer is not a ruling that amends one, and the projections say which is in front of the author. Where the node has a class, they may lead with the edit and say that the confirmed choice is what remains if the author denies. Where it has none, they lead with the recommended text whole, name the ruling a first answer, and say what a denial actually leaves: the question open, with nothing behind it that holds, since what an unanswered disposition lacks is authority and not standing, as the un-aligned-children node says.

`review`, the state of the clean-context review of the recommendation: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the hash of the recommendation the reviewer read, every fact's recommended option with its reason and, on the answer fact, the recommended text, so that a recommendation changed since the review shows as changed on the frontier and the page, while an option added beside it does not. What the reviewer saw is the whole alignment frontier at the review's date, as the clean-context-review node says, and needs no field. A node reaches the ruling stage only with a forward verdict.

`depends`, the open questions whose rulings this one waits on, as data: the ids of nodes still on the frontier whose rulings must come before this node's, or a node id and an option on its answer fact, written as the id and the option's name, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. It is also what carries coherence between decisions, within a subtree as between subtrees, so no separate exclusion field is minted. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed with the rest of the dialogue at the recording.

`## Account`, the AI's account in prose: the evidence, the findings, the reasoning behind the recommendation of each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author. It is not a proposal and does not carry that name: a proposal is the state the authority node defines.

The validator holds the parts together: a stage on every node of the alignment frontier, and every part of the dialogue state requiring a stage; a recommendation on every fact from the review stage on, naming a listed option; `stands` on the answer fact whenever an answer stands, naming the ruled option where there is one, and a `## Recommendation` fence exactly when the recommended option is not the one that stands, parsing and answering the node's question; the facts' names from the reserved four, each option's name unique on its fact, and the `## Facts` subsections matching the facts and the answer's options in name and order; at most one ruling per fact; a forward verdict at ruling; every `depends` entry resolving to a node still on the frontier, and to an option on it where one is named; and every reading's `bears` entry resolving to an option. Everything else is derived: the class and the status, the persistence where no fact carries it, the queue and its order, whether a recommendation has moved since its ruling and whether it has changed since the review, the readings on each option, the edit the page shows, and the counts. The projections that show a node with a confirmed choice, the browser and the alignment page, show the choice first and beneath it the recommendation, the other options, and what each tradition says, and say that the choice keeps its authority until the author rules for another.
```

#### survey-pin-in-review

The `review` field carries, beside the draft review's `verdict`, `strength`, `date`, and `of`, the survey's state as `survey`, with its `date` and its `of`, the hash of the recommendation the survey read, written at apply only where the recommendation still matches what was read, and present without a verdict on a node the survey has judged before its draft review ran. A node is ready to rule when both pins match the recommendation as it stands, and the projections derive which of the two is owed and show it; nothing else is stored. Raised on commons.systems/disposition-graph/decomposition, from the author's words of 2026-09-04 recorded there; it follows the option `per-draft-and-survey` on the clean-context-review node, which names the two pins.

Adopted into `every-part-in-the-record`, with one departure: when the pin is written is the review's own step and the clean-context-review node's, so the composed answer keeps the field and the readiness rule and cites that node for the rest. A ruling for this option alone adopts the survey pin onto the standing answer and none of the other four clauses.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The `review` field carries, beside the draft review's `verdict`, `strength`, `date`, and `of`, the survey's state as `survey`, with its `date` and its `of`, the hash of the recommendation the survey read, written at apply only where the recommendation still matches what was read, and present without a verdict on a node the survey has judged before its draft review ran. A node is ready to rule when both pins match the recommendation as it stands, and the projections derive which of the two is owed and show it; nothing else is stored. Raised on commons.systems/disposition-graph/decomposition, from the author's words of 2026-09-04 recorded there; it follows the option `per-draft-and-survey` on the clean-context-review node, which names the two pins.

Adopted into `every-part-in-the-record`, with one departure: when the pin is written is the review's own step and the clean-context-review node's, so the composed answer keeps the field and the readiness rule and cites that node for the rest. A ruling for this option alone adopts the survey pin onto the standing answer and none of the other four clauses.
```

#### ruling-carries-the-reason

A ruling carries a fourth part beside the response, the date and the pin: the
author's own reason for it, optional and in their words. Today it has none,
and three nodes agree on the three parts, this one, `authority` and
`viable-options`, while `quotes` puts the author's words in `## Disposition`
per node and dated and never per option. So the reason the author gives for
choosing one option over another has nowhere in the record to land, and
`viable-options`' own answer already promises it does: "the confirmed choice
with the author's reason". The gap is not theoretical. The alignment page's
disposition of 2026-09-04 puts an optional input for exactly that reason in
each option's drill-down, and `transience` and `ruling-transport` both hold
that the page's database is a buffer and never the record, so without this
field the author's reason is written to a buffer nothing reads back. (Raised
on commons.systems/disposition-graph/alignment-page, from the author's words
of 2026-09-04 recorded there: "Drill down also includes optional input from
author on rationale for confirm/reject.")

Adopted into `every-part-in-the-record` as recorded, with the coherence with
`quotes` stated rather than left: the reason is why this option was taken and
the `## Disposition` section is what was said to the record. A ruling for this
option alone adopts the field onto the standing answer and none of the other
four clauses.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

A ruling carries a fourth part beside the response, the date and the pin: the
author's own reason for it, optional and in their words. Today it has none,
and three nodes agree on the three parts, this one, `authority` and
`viable-options`, while `quotes` puts the author's words in `## Disposition`
per node and dated and never per option. So the reason the author gives for
choosing one option over another has nowhere in the record to land, and
`viable-options`' own answer already promises it does: "the confirmed choice
with the author's reason". The gap is not theoretical. The alignment page's
disposition of 2026-09-04 puts an optional input for exactly that reason in
each option's drill-down, and `transience` and `ruling-transport` both hold
that the page's database is a buffer and never the record, so without this
field the author's reason is written to a buffer nothing reads back. (Raised
on commons.systems/disposition-graph/alignment-page, from the author's words
of 2026-09-04 recorded there: "Drill down also includes optional input from
author on rationale for confirm/reject.")

Adopted into `every-part-in-the-record` as recorded, with the coherence with
`quotes` stated rather than left: the reason is why this option was taken and
the `## Disposition` section is what was said to the record. A ruling for this
option alone adopts the field onto the standing answer and none of the other
four clauses.
```

#### every-option-carries-its-sentence

The two exemptions go, so that every option of every fact carries in prose
what it would answer, which is what `viable-options` already requires of an
option and what this node and the reader currently exempt. Measured, 168 of
the graph's 407 options carry no such prose: 114 on the authority fact, 38 the
option that stands, 12 on existence and 4 on persistence. The exemptions have
two different reasons and both fail. A reserved fact's choices were held to be
vocabulary rather than slugs and to need no gloss, and the projector's answer
to that was a hardcoded sentence table, which is implementation no disposition
justifies; the sentence belongs to the node that defines the fact and is
projected from there. The option that stands was held to need none since its
text is the answer, and that exemption holds: its sentence is the answer's own
first sentences, which a projection reads from `## Answer` exactly as it reads
every other option's from its subsection, so no field is added and the row is
no longer bare. What the page adds beside it is the standing the text has,
which is a status and not a sentence: on a node no ruling reaches, confirming
it ratifies a draft nobody has confirmed, which the record requires be said in
as many words. So this option strikes one exemption and keeps the other. (Raised on
commons.systems/disposition-graph/alignment-page, from the author's words of
2026-09-04 recorded there: "For each fact, list all options... For each option
(other than kick back) provide short text summary of option and/or
rationale".)

Adopted into `every-part-in-the-record` as its conclusion and not as its
opening sentence: the composed answer says every option of every fact has a
sentence and the record holds it in one place for each kind of option, so
neither the `#### <option>`, the `## Answer` of the option that stands, nor the
gloss on the defining node is an exemption. A ruling for this option alone
strikes the vocabulary facts' exemption on the standing answer and none of the
other four clauses.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The two exemptions go, so that every option of every fact carries in prose
what it would answer, which is what `viable-options` already requires of an
option and what this node and the reader currently exempt. Measured, 168 of
the graph's 407 options carry no such prose: 114 on the authority fact, 38 the
option that stands, 12 on existence and 4 on persistence. The exemptions have
two different reasons and both fail. A reserved fact's choices were held to be
vocabulary rather than slugs and to need no gloss, and the projector's answer
to that was a hardcoded sentence table, which is implementation no disposition
justifies; the sentence belongs to the node that defines the fact and is
projected from there. The option that stands was held to need none since its
text is the answer, and that exemption holds: its sentence is the answer's own
first sentences, which a projection reads from `## Answer` exactly as it reads
every other option's from its subsection, so no field is added and the row is
no longer bare. What the page adds beside it is the standing the text has,
which is a status and not a sentence: on a node no ruling reaches, confirming
it ratifies a draft nobody has confirmed, which the record requires be said in
as many words. So this option strikes one exemption and keeps the other. (Raised on
commons.systems/disposition-graph/alignment-page, from the author's words of
2026-09-04 recorded there: "For each fact, list all options... For each option
(other than kick back) provide short text summary of option and/or
rationale".)

Adopted into `every-part-in-the-record` as its conclusion and not as its
opening sentence: the composed answer says every option of every fact has a
sentence and the record holds it in one place for each kind of option, so
neither the `#### <option>`, the `## Answer` of the option that stands, nor the
gloss on the defining node is an exemption. A ruling for this option alone
strikes the vocabulary facts' exemption on the standing answer and none of the
other four clauses.
```

#### authority-fact-on-every-node

Every node carrying a stage carries an answer fact and an authority fact. This
node states the conditionality of `existence`, which appears where a prune is
proposed, and of `persistence`, present only where the recommendation would
change the node's shape, and states none for the other two; the validator
enforces neither. Measured, eighteen nodes carrying a stage carry no authority
fact and three carry no fact of any kind. What the gap costs is the author's
own range: the authority fact is how a ruling confers delegated or deferred,
so on those eighteen the only class a confirmation can produce is ratified and
the author's third exit is closed by an encoding accident rather than by a
decision. `commons.systems/public/agency`, the graph's root question, is one
of the eighteen. (Raised on commons.systems/disposition-graph/alignment-page,
where the author's disposition of 2026-09-04 to list every fact without
exception made the gap visible: a page can only list the facts a node
carries.)

Adopted into `every-part-in-the-record`, narrowed to a node that carries facts
at all: three nodes now carry none, every one at the periagogic stage, where no
candidate answer has been drafted and a class would be conferred on nothing,
and from the review stage on a node carries facts, so the requirement holds
wherever a ruling can be given. A ruling for this option alone adopts the
requirement as recorded, unnarrowed, onto the standing answer and none of the
other four clauses.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Every node carrying a stage carries an answer fact and an authority fact. This
node states the conditionality of `existence`, which appears where a prune is
proposed, and of `persistence`, present only where the recommendation would
change the node's shape, and states none for the other two; the validator
enforces neither. Measured, eighteen nodes carrying a stage carry no authority
fact and three carry no fact of any kind. What the gap costs is the author's
own range: the authority fact is how a ruling confers delegated or deferred,
so on those eighteen the only class a confirmation can produce is ratified and
the author's third exit is closed by an encoding accident rather than by a
decision. `commons.systems/public/agency`, the graph's root question, is one
of the eighteen. (Raised on commons.systems/disposition-graph/alignment-page,
where the author's disposition of 2026-09-04 to list every fact without
exception made the gap visible: a page can only list the facts a node
carries.)

Adopted into `every-part-in-the-record`, narrowed to a node that carries facts
at all: three nodes now carry none, every one at the periagogic stage, where no
candidate answer has been drafted and a class would be conferred on nothing,
and from the review stage on a node carries facts, so the requirement holds
wherever a ruling can be given. A ruling for this option alone adopts the
requirement as recorded, unnarrowed, onto the standing answer and none of the
other four clauses.
```

#### edit-led-against-a-named-ground

The projections lead with the edit wherever an answer stands, ratified or a draft no one has confirmed, and name the ground the edit is against; a node with no answer shows the recommended text whole. This departs from the standing rule that a node with no class leads with the recommended text whole and names the ruling a first answer: the author does need to see what a ruling changes, and what was wrong on `purpose` was the implication that the ground was confirmed, which naming the ground removes. The author's words of 2026-09-03, that nodes "still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed", read at least as easily as an objection to the diff on a first answer as to its caption, which is why this is an option here and not a settled reading. Raised on commons.systems/disposition-graph/alignment-page, whose clean-context review of 2026-09-04 found the departure recorded nowhere on this node.

Adopted into `every-part-in-the-record` with its test sharpened: the ground is named by the standing of the text and not by the node's class, since a ruling on the authority fact says who decides and not that this text was confirmed, so a delegated node's draft is still a draft no one has confirmed. It is the clause of the composed option that rests most on the AI, and it is the one an author who wants the rest without it strikes by a confirmation with edits. A ruling for this option alone adopts the edit-led presentation onto the standing answer and none of the other four clauses.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The projections lead with the edit wherever an answer stands, ratified or a draft no one has confirmed, and name the ground the edit is against; a node with no answer shows the recommended text whole. This departs from the standing rule that a node with no class leads with the recommended text whole and names the ruling a first answer: the author does need to see what a ruling changes, and what was wrong on `purpose` was the implication that the ground was confirmed, which naming the ground removes. The author's words of 2026-09-03, that nodes "still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed", read at least as easily as an objection to the diff on a first answer as to its caption, which is why this is an option here and not a settled reading. Raised on commons.systems/disposition-graph/alignment-page, whose clean-context review of 2026-09-04 found the departure recorded nowhere on this node.

Adopted into `every-part-in-the-record` with its test sharpened: the ground is named by the standing of the text and not by the node's class, since a ruling on the authority fact says who decides and not that this text was confirmed, so a delegated node's draft is still a draft no one has confirmed. It is the clause of the composed option that rests most on the AI, and it is the one an author who wants the rest without it strikes by a confirmation with edits. A ruling for this option alone adopts the edit-led presentation onto the standing answer and none of the other four clauses.
```

#### every-part-in-the-record

Every part a ruling or a projection needs is in the record, in one place: the
standing encoding, in which every decision on a node is a fact with viable
options, together with the five clauses above, which are one rule met five
times. The survey's pin joins the review field beside the draft review's; the
author's reason for a ruling joins the ruling on the option they chose; every
option of every fact has a sentence, in its `#### <option>`, in the `## Answer`
it is, or in the gloss on the node that defines its term, and no projection
carries a sentence of its own; a node that carries facts carries the answer
fact and the authority fact, so that every class a ruling can confer is on the
ballot; and the projections lead with the edit wherever an answer stands and
name the ground it is against, so that a first answer is named as one by what
it is an edit against rather than by withholding the edit. Three further things
the composed text settles because the record has already met them and has no
sentence for them: that an option on the answer fact may be a named change to
another option, which is what the five above and the eight on `alignment-page`
already are; that the two `against` fields and the statuses, reasons and
unrecommended options sit outside every pin, so that recording them stales
nothing; and that what viability is belongs to `viable-options` and is cited
here rather than restated. Set out in full in the fence.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Its question, its fields, its facts with their options, and its answer as it stands; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, the author's words stay as the quotes node decides, and the facts stay with their options, their recommendation, their readings and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. It has these parts, each holding only what cannot be re-derived.

One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.

`facts`, every decision on the node, as data, each with a `name`, its `options`, the one it `recommends` with the `boldness` of that recommendation, low, moderate, or high, how much of it rests on the AI's own knowledge against the record and the author's words, and, on the answer fact, `stands`, the option whose full text the answer section holds. Four names are reserved and no others are minted without a ruling here: `answer`, whose options are the candidate answers to this node's own question; `authority`, the class a ruling would confer, ratified, delegated, or deferred, which is why no recommendation carries a class of its own; `existence`, keep or prune, which is where a proposal to prune the node is recorded rather than as an option of a special shape that answers no question; and `persistence`, present only where the recommendation would change the node's shape, declaring or liquidating a shim or adding or dropping evidence, its options being those shapes, and otherwise derived from the shape and asking nothing. An option carries its `name`; on the answer fact its `source`, the author's words in the disposition, the AI, the clean-context review, or the instrument or node that raised it outside alignment, and its `ref`, the date of the words or of the review, the graph commit, or the instrument or node; and its `ruling` once the author has given one. An option is viable, and stays on the list, while nothing on the list dominates it on the record's criteria, in the AI's judgment; an option the AI no longer holds viable leaves the list, and the option that displaced it says why. `## Facts` holds one subsection per fact, in the same order, opening with the reason for its recommendation, and under the answer fact one subsection per option, in the same order, saying in prose what the option would answer and why it is on the table; the option that stands needs none, since its text is the answer. A recommendation may be recorded at any stage of the dialogue, as the author ruled on 2026-09-04, and is required from the review stage on, since a node cannot be reviewed without one; a recommendation withheld until a stage boundary is a recommendation held in a session, which the first requirement above forbids. The AI may add an option or move a recommendation in alignment, in reconciliation, and in the loop on itself, within the scope its class allows, as the authority, evaluation and work-loop nodes say.

A `ruling` is the author's act on the option they chose, recorded on it: the `response`, confirm or edit, the `date`, and `of`, the hash of the fact's recommendation it answered, the recommended option with its reason and, on the answer fact, its text, so that a recommendation moved after the ruling shows as moved on the frontier and the page. A denial is never a ruling: it is a kickback with the author's words. Only the author rules, on the alignment page or in prose, and the AI writes no ruling and no class for itself.

`stage`, the next movement owed: periagogic, maieutic, review, or ruling. The movements come in that order, so the stage also says what is behind the node, and a kickback moves it back. A recommendation moved on a node with a class re-opens the dialogue at the movement the recording node's classification calls for, the review where only the recommendation moved, from wherever the move came.

`## Disposition`, the author's words, verbatim and dated, accumulating through the dialogue.

`## Recommendation`, the recommended text when the answer fact recommends an option other than the one that stands: one fenced markdown block holding the whole proposed node, frontmatter and sections, so that the same reader parses it and the projections derive the edit, field by field and word by word, beside the whole. Where the recommended option is the one that stands, on every node whose recommendation acts and on every node whose draft is its recommendation, there is no such section, and a confirmation rules for the answer as it stands. A diff is derived from the fence and the node and never stored. The draft, elsewhere in the record, is this text. It may be invalid under the doctrine of the day, as when it presumes a ruling not yet given; the validator parses it and checks only that it answers the same question and carries no facts, rulings or dialogue state of its own.

A ruling that gives a node its first answer is not a ruling that amends one, and the projections say which is in front of the author. Where the node has a class, they may lead with the edit and say that the confirmed choice is what remains if the author denies. Where it has none, they lead with the recommended text whole, name the ruling a first answer, and say what a denial actually leaves: the question open, with nothing behind it that holds, since what an unanswered disposition lacks is authority and not standing, as the un-aligned-children node says.

`review`, the state of the clean-context review of the recommendation: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the hash of the recommendation the reviewer read, every fact's recommended option with its reason and, on the answer fact, the recommended text, so that a recommendation changed since the review shows as changed on the frontier and the page, while an option added beside it does not. What the reviewer saw is the whole alignment frontier at the review's date, as the clean-context-review node says, and needs no field. A node reaches the ruling stage only with a forward verdict.

`depends`, the open questions whose rulings this one waits on, as data: the ids of nodes still on the frontier whose rulings must come before this node's, or a node id and an option on its answer fact, written as the id and the option's name, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. It is also what carries coherence between decisions, within a subtree as between subtrees, so no separate exclusion field is minted. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed with the rest of the dialogue at the recording.

`## Account`, the AI's account in prose: the evidence, the findings, the reasoning behind the recommendation of each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author. It is not a proposal and does not carry that name: a proposal is the state the authority node defines.

The validator holds the parts together: a stage on every node of the alignment frontier, and every part of the dialogue state requiring a stage; a recommendation on every fact from the review stage on, naming a listed option; `stands` on the answer fact whenever an answer stands, naming the ruled option where there is one, and a `## Recommendation` fence exactly when the recommended option is not the one that stands, parsing and answering the node's question; the facts' names from the reserved four, each option's name unique on its fact, and the `## Facts` subsections matching the facts and the answer's options in name and order; at most one ruling per fact; a forward verdict at ruling; every `depends` entry resolving to a node still on the frontier, and to an option on it where one is named; and every reading's `bears` entry resolving to an option. Everything else is derived: the class and the status, the persistence where no fact carries it, the queue and its order, whether a recommendation has moved since its ruling and whether it has changed since the review, the readings on each option, the edit the page shows, and the counts. The projections that show a node with a confirmed choice, the browser and the alignment page, show the choice first and beneath it the recommendation, the other options, and what each tradition says, and say that the choice keeps its authority until the author rules for another.
```

#### state-as-prose-only

The dialogue's state stays prose conventions inside the account. It was passed
over because the page would keep guessing, which is what the record's Facts
lines, proposed-text blocks and review subsections already made it do.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The dialogue's state stays prose conventions inside the account. It was passed
over because the page would keep guessing, which is what the record's Facts
lines, proposed-text blocks and review subsections already made it do.
```

#### a-date-per-movement

Each movement of the dialogue stores its own date beside the stage. It was
passed over because it duplicates what version control already holds.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Each movement of the dialogue stores its own date beside the stage. It was
passed over because it duplicates what version control already holds.
```

#### a-draft-file-per-node

The recommended text lives in a separate draft file beside the node. It was
passed over because a node is one file and the draft is parseable inside it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The recommended text lives in a separate draft file beside the node. It was
passed over because a node is one file and the draft is parseable inside it.
```

#### a-stored-diff

The node stores the diff between the draft and what stands. It was passed over
because the diff is derived from the draft and the node.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The node stores the diff between the draft and what stands. It was passed over
because the diff is derived from the draft and the node.
```

#### persistence-as-a-stored-fact

Persistence is stored as a fact on the node beside authority and boldness. It
was passed over because a node is always standing and its shims are declared.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Persistence is stored as a fact on the node beside authority and boldness. It
was passed over because a node is always standing and its shims are declared.
```

#### validator-refuses-a-changed-draft

The validator refuses a draft that changed after its review. It was passed
over because the session decides whether a change is substance, as the
recording node says, and the staleness flag gives it the fact.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The validator refuses a draft that changed after its review. It was passed
over because the session decides whether a change is substance, as the
recording node says, and the staleness flag gives it the fact.
```

#### status-field-for-pending-alternatives

A node with pending alternatives carries a status field, or a fourth class,
marking it unanswered again. It was passed over because it is the flip the
author suggested on 2026-09-03 and retracted the same day as a hack.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

A node with pending alternatives carries a status field, or a fourth class,
marking it unanswered again. It was passed over because it is the flip the
author suggested on 2026-09-03 and retracted the same day as a hack.
```

#### alternatives-as-prose-in-the-account

The alternatives stay prose in the account rather than data. It was passed
over because the page could not show them beside the answer.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The alternatives stay prose in the account rather than data. It was passed
over because the page could not show them beside the answer.
```

#### a-node-per-alternative

Each alternative becomes a node of its own under the node it answers. It was
passed over because an alternative is a candidate answer to this question and
not a question of its own.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Each alternative becomes a node of its own under the node it answers. It was
passed over because an alternative is a candidate answer to this question and
not a question of its own.
```

#### account-carries-the-sitting-minutes

The account also carries the conclusion of every unit the sitting delegated with the commands it ran, and the author's response as it was given with the session's classification of it, so that a session resuming the node meets what the last one decided from and how it read the author. Recorded on 2026-09-04 with the recording node as its source: that node's recommended text had carried a second, longer definition of `## Account`, which its reading found to be a new answer to this node's question, and the addition is recorded here where the section is defined.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The account also carries the conclusion of every unit the sitting delegated with the commands it ran, and the author's response as it was given with the session's classification of it, so that a session resuming the node meets what the last one decided from and how it read the author. Recorded on 2026-09-04 with the recording node as its source: that node's recommended text had carried a second, longer definition of `## Account`, which its reading found to be a new answer to this node's question, and the addition is recorded here where the section is defined.
```

#### standing-option-carries-a-subsection

The option named by `stands` carries a `####` subsection of its own, a stored sentence, in place of the answer's first sentences read from `## Answer`; against it, the answer's first sentences said twice drift. Recorded on 2026-09-04 with the alignment-page node as its source, where it had stood as `standing-sentence-stored` until that node's reading found it to be a candidate answer to this question, the clause `every-option-carries-its-sentence` deciding it the other way.

Absorbed into `the-survey-block-carries-what-the-next-survey-selects-on`, whose sentence that every option has a subsection, the one the author last confirmed included, is what this option asked for with the exemption removed rather than kept: an option's content is an option's content whether or not the author last confirmed it, and no section stands outside the facts to hold one. A ruling for this option alone gives the option `stands` names a subsection and leaves `## Answer` where it is.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The option named by `stands` carries a `####` subsection of its own, a stored sentence, in place of the answer's first sentences read from `## Answer`; against it, the answer's first sentences said twice drift. Recorded on 2026-09-04 with the alignment-page node as its source, where it had stood as `standing-sentence-stored` until that node's reading found it to be a candidate answer to this question, the clause `every-option-carries-its-sentence` deciding it the other way.

Absorbed into `the-survey-block-carries-what-the-next-survey-selects-on`, whose sentence that every option has a subsection, the one the author last confirmed included, is what this option asked for with the exemption removed rather than kept: an option's content is an option's content whether or not the author last confirmed it, and no section stands outside the facts to hold one. A ruling for this option alone gives the option `stands` names a subsection and leaves `## Answer` where it is.
```

#### instrumentation-is-a-fact

Everything the recommendation says, with a fifth reserved name beside the four: `instrumentation`, the decision of how a node's answer is checked, the instrument the instruments node describes, carried as a fact with options and a recommendation so that the author rules on it where they rule on the class. Raised by the author's words of 2026-09-04, quoted above, "I expect instrumentation (eg.) would be a fact"; against it, the instruments node holds the instrument as a field of the node and not a decision the author rules on separately, and this node's rule is that a decision not among the reserved names is a question under the node.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Everything the recommendation says, with a fifth reserved name beside the four: `instrumentation`, the decision of how a node's answer is checked, the instrument the instruments node describes, carried as a fact with options and a recommendation so that the author rules on it where they rule on the class. Raised by the author's words of 2026-09-04, quoted above, "I expect instrumentation (eg.) would be a fact"; against it, the instruments node holds the instrument as a field of the node and not a decision the author rules on separately, and this node's rule is that a decision not among the reserved names is a question under the node.
```

#### commit-in-the-review-block

The review block carries a fifth draft key beside `verdict`, `strength`, `date` and `of`: `commit`, the graph commit the reviewed text was read at, written when the applying step finds a clean tree and absent when it does not. Recorded from the sitting on `review-cost`, whose answer gives an amended draft a re-reading whose object is the difference between the node as it stands and the text the last reading pinned. The pin identifies that text but does not locate it, so the difference is computable only from a commit, and without one the re-reading falls back to a full reading of the amended node. This node's recommended text enumerates the draft keys as four written together or not at all, which a fifth optional key contradicts, so it is recorded here as an option and acts on nothing; what a ruling would have to settle is whether `commit` joins the four in that rule or stands beside them as `against` does, optional and written only when the tree is clean. It bears on this node's answer fact and the recommendation is unmoved.

Adopted into `the-survey-block-carries-what-the-next-survey-selects-on`, which settles what this option left open the way the reader already holds it: `commit` joins the draft block as a sixth key beside `against`, optional and written only where the tree is clean, since the reader has carried it since 2026-09-05, `review-cost`'s delta re-reading needs it, and an answer that enumerated four keys and closed against a fifth would make a shipped key unsupported implementation on the day it was ruled. A ruling for this option alone adds the key to the standing enumeration and none of the rest.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The review block carries a fifth draft key beside `verdict`, `strength`, `date` and `of`: `commit`, the graph commit the reviewed text was read at, written when the applying step finds a clean tree and absent when it does not. Recorded from the sitting on `review-cost`, whose answer gives an amended draft a re-reading whose object is the difference between the node as it stands and the text the last reading pinned. The pin identifies that text but does not locate it, so the difference is computable only from a commit, and without one the re-reading falls back to a full reading of the amended node. This node's recommended text enumerates the draft keys as four written together or not at all, which a fifth optional key contradicts, so it is recorded here as an option and acts on nothing; what a ruling would have to settle is whether `commit` joins the four in that rule or stands beside them as `against` does, optional and written only when the tree is clean. It bears on this node's answer fact and the recommendation is unmoved.

Adopted into `the-survey-block-carries-what-the-next-survey-selects-on`, which settles what this option left open the way the reader already holds it: `commit` joins the draft block as a sixth key beside `against`, optional and written only where the tree is clean, since the reader has carried it since 2026-09-05, `review-cost`'s delta re-reading needs it, and an answer that enumerated four keys and closed against a fifth would make a shipped key unsupported implementation on the day it was ruled. A ruling for this option alone adds the key to the standing enumeration and none of the rest.
```

#### source-names-who-raised-it

An option's `source` names the party that put the candidate on the table and
its `ref` points at that: the date of the author's words where the source is
the author, the graph commit where the AI drafted it, the review that raised
it, or the node or instrument that did, so that a source of `author` carrying a
graph commit where the date of the words should be is a finding and not a fact.
The author's later agreement with a reason the AI gave is a ruling where they
gave one and an account where they did not, and never a source. This is what
the viable-options node's recommended answer of 2026-09-05 says of source and
reference; what an option carries is this node's question, and the rule belongs
in this answer with the rest of it rather than beside it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

An option's `source` names the party that put the candidate on the table and
its `ref` points at that: the date of the author's words where the source is
the author, the graph commit where the AI drafted it, the review that raised
it, or the node or instrument that did, so that a source of `author` carrying a
graph commit where the date of the words should be is a finding and not a fact.
The author's later agreement with a reason the AI gave is a ruling where they
gave one and an account where they did not, and never a source. This is what
the viable-options node's recommended answer of 2026-09-05 says of source and
reference; what an option carries is this node's question, and the rule belongs
in this answer with the rest of it rather than beside it.
```

#### probes-in-the-enumeration

The recommended answer with `probes` in it: the enumeration of the parts of the
dialogue's state carries `probes` beside `stage`, `review` and `depends`, and the
validator paragraph requires a stage of it as it does of the others. The
`author-questions` node's recommended answer puts the field there — "In the
dialogue state, as `probes`, one list on the node beside `stage`, `review` and
`depends`" — and this node's enumeration does not carry it, so one node says the
state has a part the node that enumerates the parts does not list. The record's
only reconciliation of the gap today is a sentence of `recording`'s, where this
node's ruler will not meet it. Raised by the second clean-context reading of
`author-questions` on 2026-09-05, which found the amendment required and named
nowhere.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The recommended answer with `probes` in it: the enumeration of the parts of the
dialogue's state carries `probes` beside `stage`, `review` and `depends`, and the
validator paragraph requires a stage of it as it does of the others. The
`author-questions` node's recommended answer puts the field there — "In the
dialogue state, as `probes`, one list on the node beside `stage`, `review` and
`depends`" — and this node's enumeration does not carry it, so one node says the
state has a part the node that enumerates the parts does not list. The record's
only reconciliation of the gap today is a sentence of `recording`'s, where this
node's ruler will not meet it. Raised by the second clean-context reading of
`author-questions` on 2026-09-05, which found the amendment required and named
nowhere.
```

#### dialogue-glosses-the-four-fact-names

The recommended answer with a glossed `defines` entry for each of the four fact
names this node reserves, so that every fact name resolves to a sentence saying
what the fact decides. Three of the four are not written today. `existence` is
glossed here already. `authority` is glossed on
`commons.systems/disposition-graph/authority`, which is the node the author's
bullet of 2026-09-04 names as the heading's link target, and it stays there. The
two this option writes are `answer` and `persistence`, and with them the bare
entries at `disposition/disposition-graph/node.md:65` and
`disposition/disposition-graph/transience.md:76` are released, since `glossary`
(`packages/disposition/derive.mjs`) and `definerIndex`
(`packages/disposition/project.mjs`) each take the first definer they meet and
ignore every later one, so two entries for one term resolve by the order the
nodes are read in. The glosses drafted, each drawn from this node's own sentence
on what the fact decides:

- `answer`: the fact whose options are the candidate answers to the node's own
  question, and whose ruled option is the answer the node stands on.
- `authority`: the fact whose options are the class a ruling would confer,
  ratified, delegated or deferred, which is why no recommendation carries a class
  of its own. (The entry that stands on the `authority` node, "The standing that
  lets a recorded answer act, conferred only by a ruling of the author's on one
  of a node's facts and never by a mark, a command, or a class the AI writes for
  itself", already says this; this option writes no second entry for it.)
- `existence`: the fact that asks whether the node stays in the record, with the
  choices keep and prune; it appears where a prune is proposed. (Stands here
  today, unchanged.)
- `persistence`: the fact whose options are the shapes the node would keep,
  present only where the recommendation would change its shape, declaring or
  liquidating a shim or adding or dropping evidence, and otherwise derived from
  the shape and asking nothing.

Raised by `commons.systems/disposition-graph/how-a-fact-is-headed`, whose
recommended option `glosses-written-with-this-ruling` needs every fact name to
carry a gloss so that no heading on the alignment page falls back to an unlinked
word; that node's answer cites the two entries as bare terms claimed by nodes
asking other questions, "The term `answer` is defined at
`disposition/disposition-graph/node.md:65` as a bare term with no gloss, on a
node whose question is 'What is a node?'". The option is here because the
sentences are this node's to write: it reserves the four names, and a gloss lives
on the node that defines the term.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The recommended answer with a glossed `defines` entry for each of the four fact
names this node reserves, so that every fact name resolves to a sentence saying
what the fact decides. Three of the four are not written today. `existence` is
glossed here already. `authority` is glossed on
`commons.systems/disposition-graph/authority`, which is the node the author's
bullet of 2026-09-04 names as the heading's link target, and it stays there. The
two this option writes are `answer` and `persistence`, and with them the bare
entries at `disposition/disposition-graph/node.md:65` and
`disposition/disposition-graph/transience.md:76` are released, since `glossary`
(`packages/disposition/derive.mjs`) and `definerIndex`
(`packages/disposition/project.mjs`) each take the first definer they meet and
ignore every later one, so two entries for one term resolve by the order the
nodes are read in. The glosses drafted, each drawn from this node's own sentence
on what the fact decides:

- `answer`: the fact whose options are the candidate answers to the node's own
  question, and whose ruled option is the answer the node stands on.
- `authority`: the fact whose options are the class a ruling would confer,
  ratified, delegated or deferred, which is why no recommendation carries a class
  of its own. (The entry that stands on the `authority` node, "The standing that
  lets a recorded answer act, conferred only by a ruling of the author's on one
  of a node's facts and never by a mark, a command, or a class the AI writes for
  itself", already says this; this option writes no second entry for it.)
- `existence`: the fact that asks whether the node stays in the record, with the
  choices keep and prune; it appears where a prune is proposed. (Stands here
  today, unchanged.)
- `persistence`: the fact whose options are the shapes the node would keep,
  present only where the recommendation would change its shape, declaring or
  liquidating a shim or adding or dropping evidence, and otherwise derived from
  the shape and asking nothing.

Raised by `commons.systems/disposition-graph/how-a-fact-is-headed`, whose
recommended option `glosses-written-with-this-ruling` needs every fact name to
carry a gloss so that no heading on the alignment page falls back to an unlinked
word; that node's answer cites the two entries as bare terms claimed by nodes
asking other questions, "The term `answer` is defined at
`disposition/disposition-graph/node.md:65` as a bare term with no gloss, on a
node whose question is 'What is a node?'". The option is here because the
sentences are this node's to write: it reserves the four names, and a gloss lives
on the node that defines the term.
```

#### an-unconfirmed-nodes-draft-shape

The recommended answer with one shape for the draft of a node no ruling has
reached, instead of two. Today both are legal: `## Answer` with `stands` naming
the draft and no fence, or a `## Recommendation` fence with nothing standing —
"a `## Recommendation` fence exactly when the recommended option is not the one
that stands". The two are not the same on the page the author reads.
`alignment-page` has the column lead with the edit where an answer stands and
show the whole where none does, so a draft carried as `## Answer` reaches the
author with a standing-text chip on a text nobody has confirmed. The four
children of `alignment-page` drafted on 2026-09-07 split evenly:
`vocabulary-option-summary` and `which-facts-are-listed` carry theirs in
`## Answer` with `stands`, `how-a-fact-is-headed` and
`when-the-kickback-feedback-shows` in a fence. Raised by the clean-context reading
of `vocabulary-option-summary` on 2026-09-07, which found four drafts written in
one movement presented to the author in two forms. What the option would decide is
which shape a node with no ruling takes; it decides nothing about a node that has
one, where the fence is what carries a proposed change to a text that stands.

Absorbed into `the-survey-block-carries-what-the-next-survey-selects-on`, which dissolves the question rather than answering it: neither shape survives, since a draft is the recommended option's content in its own subsection and there is no `## Answer` and no fence, so a node with no ruling has one shape because every node does. A ruling for this option alone picks one of the two shapes for the standing encoding and keeps both sections.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The recommended answer with one shape for the draft of a node no ruling has
reached, instead of two. Today both are legal: `## Answer` with `stands` naming
the draft and no fence, or a `## Recommendation` fence with nothing standing —
"a `## Recommendation` fence exactly when the recommended option is not the one
that stands". The two are not the same on the page the author reads.
`alignment-page` has the column lead with the edit where an answer stands and
show the whole where none does, so a draft carried as `## Answer` reaches the
author with a standing-text chip on a text nobody has confirmed. The four
children of `alignment-page` drafted on 2026-09-07 split evenly:
`vocabulary-option-summary` and `which-facts-are-listed` carry theirs in
`## Answer` with `stands`, `how-a-fact-is-headed` and
`when-the-kickback-feedback-shows` in a fence. Raised by the clean-context reading
of `vocabulary-option-summary` on 2026-09-07, which found four drafts written in
one movement presented to the author in two forms. What the option would decide is
which shape a node with no ruling takes; it decides nothing about a node that has
one, where the fence is what carries a proposed change to a text that stands.

Absorbed into `the-survey-block-carries-what-the-next-survey-selects-on`, which dissolves the question rather than answering it: neither shape survives, since a draft is the recommended option's content in its own subsection and there is no `## Answer` and no fence, so a node with no ruling has one shape because every node does. A ruling for this option alone picks one of the two shapes for the standing encoding and keeps both sections.
```

#### survey-pin-carries-its-commit

The survey's state on a node, `survey` with its `date` and its `of`, carries a
third key, `commit`, the graph commit the survey read the graph at, written at
apply as the draft reading's own `commit` is under `commit-in-the-review-block`.
Recorded from the sitting on `frontier-consistency` of 2026-09-07, whose
recommended text carries a node on one line where its text, what the survey
reads of it, stands as an earlier survey read it, and a node minted or amended
since by what it answers, a condition the generator can take only by comparing
that text as it stands against the same text at the commit the last survey read
at; its first form on that node, drawn on the commit that first carried the
node, was passed over the same day, and the key both forms ask for is this one.
The survey of 2026-09-05 read the graph at `73e2a04f`, and the record
holds that commit in the message of the commit that applied it and in no node,
so the condition rests on a key the review block does not carry. It acts on
nothing until ruled, and what a ruling would settle is the question
`commit-in-the-review-block` leaves open, whether a commit key joins the keys
written together or stands beside them.

Absorbed into `the-survey-block-carries-what-the-next-survey-selects-on`, as the first of the four keys the survey's block gains beside its `date` and its `of`, and the question it left open, whether a commit key joins the keys written together or stands beside them, is settled the way `commit-in-the-review-block` is adopted: the key stands beside the pair, optional and written at apply where the tree is clean. A ruling for this option alone adds `commit` to the survey block of the standing encoding and nothing else.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The survey's state on a node, `survey` with its `date` and its `of`, carries a
third key, `commit`, the graph commit the survey read the graph at, written at
apply as the draft reading's own `commit` is under `commit-in-the-review-block`.
Recorded from the sitting on `frontier-consistency` of 2026-09-07, whose
recommended text carries a node on one line where its text, what the survey
reads of it, stands as an earlier survey read it, and a node minted or amended
since by what it answers, a condition the generator can take only by comparing
that text as it stands against the same text at the commit the last survey read
at; its first form on that node, drawn on the commit that first carried the
node, was passed over the same day, and the key both forms ask for is this one.
The survey of 2026-09-05 read the graph at `73e2a04f`, and the record
holds that commit in the message of the commit that applied it and in no node,
so the condition rests on a key the review block does not carry. It acts on
nothing until ruled, and what a ruling would settle is the question
`commit-in-the-review-block` leaves open, whether a commit key joins the keys
written together or stands beside them.

Absorbed into `the-survey-block-carries-what-the-next-survey-selects-on`, as the first of the four keys the survey's block gains beside its `date` and its `of`, and the question it left open, whether a commit key joins the keys written together or stands beside them, is settled the way `commit-in-the-review-block` is adopted: the key stands beside the pair, optional and written at apply where the tree is clean. A ruling for this option alone adds `commit` to the survey block of the standing encoding and nothing else.
```

#### an-option-carries-its-content-its-words-and-its-case

Every option of the answer fact carries its content, whole or as a named change to another option's applied strictly, so that a projection renders the node under any option; `## Answer`, `## Recommendation`, `## Rationale` and `## Disposition` leave the file, a node being its frontmatter, its `## Facts` and its `## Account`; confirmed is a label derived from the rulings and the word standing is not used of an option; every option carries the AI's accumulated support and divergence and references into the ledger to the author's words that support it and that it diverges from; and the author's recording and retention rules decide which options and which words a node carries.

**AI support.** The author's refinement and three answers of 2026-09-07, quoted under `## Disposition`, ask for exactly this, and each clause is mechanically derivable as the author required: the node under any option is one strict application of unified-diff hunks against a named base, the confirmed label is read off the rulings as the class is, and the words are one resolution into the ledger. Measured at graph commit `32cd2e18`: 124 of 643 option subsections already phrase themselves as a change to another option, so the named-change form is the record's idiom and not an invention; and a whole text on every option would add about 3.75 MB where the named-change form adds about 0.42 MB.

**AI divergence.** Two legibility trades, each with a mechanical derivation behind it: a node file no longer holds its answer in one place, and no longer holds the author's words at all. A `supports` or `diverges` reference is a claim about the author's words that the AI writes, and one filed on the wrong side misrepresents the author to the author on the surface where they rule. And a hunk applied strictly is brittle by design: an edit to a base option that its dependants do not follow is a validator error, which is the price of a derivation with no heuristic in it.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Every option of the answer fact carries its content, whole or as a named change to another option's applied strictly, so that a projection renders the node under any option; `## Answer`, `## Recommendation`, `## Rationale` and `## Disposition` leave the file, a node being its frontmatter, its `## Facts` and its `## Account`; confirmed is a label derived from the rulings and the word standing is not used of an option; every option carries the AI's accumulated support and divergence and references into the ledger to the author's words that support it and that it diverges from; and the author's recording and retention rules decide which options and which words a node carries.
```

#### the-survey-block-carries-what-the-next-survey-selects-on

Everything `an-option-carries-its-content-its-words-and-its-case` says, with the survey's block on a node carrying, beside its `date` and its `of`, the `commit` it read at, the `text` hashes of the five sections its validations read, the `findings` register it left open on the node, and the `pairs` it read that touch the node, each with the key it was drawn on, so that the next survey's selection is local to the node.

**AI support.** The `survey-selection` node's delta compares hashes and not commits, and needs the trace on the node it verifies, as the reading `verifying-traces-and-early-cutoff` has it; a comparison that needed a history walk would need a commit the record does not carry, which is the defect `frontier-consistency`'s recommended text records today. The register is what lets a finding be carried forward as standing rather than re-derived, and the keys are what make a key's yield measurable.

The shape is the author's, given in three sittings. On 2026-09-03 they asked for the unanswered frontier to be encoded as a recommendation with dialogue state and a list of alternatives, and delegated the rest: "Encoding details are delegated." On 2026-09-04, on the viable-options node, they fixed the model: every decision on a node is a fact with a list of viable options, the recommendation is a mark on one of them with its boldness, and the author's ruling is recorded on the option they chose. On 2026-09-07 they refined it to the encoding this answer writes, and the refinement is the answer's spine: "each option for each fact is recorded with its actual fact content so that when the author selects an option via the alignment artifact the context pane is dynamically updated to preview the node that is being confirmed"; "\"standing\" is just a label that can be applied to an option (similar to an AI recommendation) to indicate that it was the last confirmed option for that fact on that node"; "the expanded details of an option (before and also after confirmation) shows a) the history of author quotes that both support and/or contradict the option (implies that one quote may be reference by multiple options) b) the accumulated/current AI support and/or rejection rationale for that option (independent of ultimate recommendation)"; and, of what a node keeps once those are in it, "Anything else that doesn't support the alignment dialogue/artifact disposition is subject to accumulation/removal." What the dialogue must carry is fixed by what cannot be re-derived once the session that held it is gone. What it must not carry is anything a session would decide the same way twice.

One rule decides the rest, and it is what this answer adds to the model: every part a ruling or a projection needs is in the record, in one place. The record learned it five times before this sitting. A survey with a pin and nowhere to put it. An author's reason for choosing written to a page's database, which transience and ruling-transport both hold is a buffer and never the record. An option's sentence supplied by a table inside the projector, which is implementation no disposition justifies. An authority fact missing where a ruling would have conferred a class, so that the only class a confirmation could produce was ratified. And a diff whose ground was left to be inferred, which is what the author read off the purpose node on 2026-09-03: "nodes (eg. commons.systems/disposition-graph/purpose) still indicate that they are edits to confirmed dispositions (there appears to be a ground version that is being diffed) even though no node is yet confirmed." The refinement of 2026-09-07 is the same lesson four more times, in the four places the record still held part of a thing and let something else hold the rest. The text of a rival option was in the AI's prose about it rather than in the record, so the page could not preview the node the author was about to confirm, and only one option of a fact had a text at all. The label the projections showed as the node's answer was `stands`, which names the option whose section holds the text and not the option the author last confirmed, so a page reading it truthfully still showed the AI's draft where the author's choice belongs. The author's words were copied onto every node that needed them, thirty-seven thousand bytes of copy in a hundred and thirty-one thousand, every copy hand-made and none checked against another. And the survey's own state, what it read and what it left open, lived in the message of the commit that applied it. In each the part outside the record was the part that could lie. Writing an option's content on the option, deriving the confirmed label from the rulings, keeping the words once in the ledger and referencing them, and giving the survey a block on the node it judged are one move: keep it once where it is decided, derive the rest, and no copy can drift because there is no copy.

The mechanical derivation is the author's condition and not a convenience: "named-change form legibility tradeoff is acceptable as long as the exact node preview can be mechanically derived (eg. via patch syntax)". So a named change is unified-diff hunks against a named base, applied at the line the header names with no fuzz and no offset search, and produced by diffing the two resolved texts rather than written by hand. There is no heuristic anywhere in the resolution, which is what makes the preview exact rather than probable, and the price of that is stated below rather than hidden: a hunk that does not apply is an error of the record. The three accumulations are the author's enumeration read literally — "All of AI and author rationale and references to tradition are recorded as support and/or divergence for each option. AI response is accumulated, reference to tradition is accumulated, author response is concatenated quotation" — and each is put once in the place that already owns it, the AI's on the option, the traditions' on the reading's `bears` entries where the readings node put them, and the author's in the ledger, so that the option carries three accumulations and stores one. The recording rule is theirs in the same turn: "If an option is weighed by the AI for any reason including its own internal assessment of viability then that option must be recorded." It is sharper than the rule of thumb it replaces because it makes the trigger an act that leaves a trace. The retention rule that follows from it is the quotes node's and is cited here, not restated, on the same rule by which this answer stops restating what other nodes own, as it cites viable-options for viability and survey-selection for what a survey reads.

The places this answer says what a pin does not cover follow from the same rule read the other way. A pin exists to tell the author that what they are about to confirm is what was read. A pin over everything on the node would stale a review the moment its own counter-argument was written into the field beside its pin, and would send a reviewed node back because a paragraph of support was added under an option nobody recommends. So the pin covers the recommendation, the option list it was chosen from, and the references that say what the author's words do to each option, and leaves outside it the two cases against, the accumulating prose, the accounts and the fact's own reason. That the option list is inside the pin is a change from the encoding this answer replaces, and it is deliberate: under the refinement an option is no longer only a name on a list but a claim about the author's own words, and the surface where a wrong claim would be met is the surface where the author rules. The cost is that adding an option to a reviewed node now returns it to be read, where before it did not, and the record pays that rather than let a `supports` reference reach a ruling unread. The pin's other consequence is new with the named-change form and is stated so that nobody meets it as a surprise: because the pin covers a resolved content, editing an option that another option's content is a change against moves the pin of every fact whose recommendation resolves through it, so a ladder of options is a ladder of pins and an edit at its foot is felt at its top.

The traditions. The closest to this encoding is read under this node as madr-decision-records, whose `bears` entries mark the form adopted and record two divergences, the class derived here from the rulings on the facts where that tradition stores a status on the record, and a superseded answer amended in place here where that tradition keeps the old record beside the new. verifying-traces-and-early-cutoff is adopted on the option this fact recommends: a verifier that must re-derive what it already checked is a verifier that cannot cut off early, and the trace it needs belongs on the object it verified, which is why the survey's block carries what the next survey selects on rather than leaving it to a history walk. chenery-reasoned-decision is adopted for the reason recorded with the ruling, and codd-update-anomaly for the sentence stored once, which is now the argument for the ledger and for one text per option as well as for the gloss. legislative-amendment-in-context is adopted for naming the ground an edit is shown against, and special-verdict-form for the rule that a decider is asked each question the judgment needs; rfc-pep-status-field, review-approval-pinned-to-a-revision and change-reviewed-as-a-diff are adopted on the clauses this answer keeps unchanged, the ordered stage, the pin that a new revision stales, and the change read as a diff. One tradition diverges, and it is the case against this recommendation rather than a decoration on it: single-subject-rule holds that a measure carrying several subjects lets the party that drafted the bundle decide what travels with what, and the option this fact recommends composes the encoding in force, five clauses folded into it before this sitting, the per-option content, the ledger, the removal of four sections and a survey block of six keys. The record does not argue that away. It records the divergence, states in the fact's own `against` that the AI chose the bundling, and leaves every part separately on the fact so that the author may rule for a smaller one.

What this costs, as a consequence of the design and never as a reason for it. Two legibility trades, each with a mechanical derivation behind it and the first of them accepted by the author on that condition: a node file no longer holds its answer in one place, and no longer holds the author's words at all. A `supports` or a `diverges` is a claim about the author's words that the AI writes, and one filed on the wrong side misrepresents the author to the author on the very surface where they rule; the record's answer is that the reference is inside the pin, so a wrong one is a thing a reader read and the author confirmed, and never a thing that changed underneath them. A hunk applied strictly is brittle by design: an edit to a base option that its dependants do not follow is a validator error rather than a silently re-anchored patch, which is the price of a derivation with no heuristic in it, and it is a price this record prefers to pay loudly. The migration is the rest of it, measured at graph commit `93644144`: a hundred and thirty-four node files lose their `## Answer` and their `## Rationale`, seventy-four their `## Disposition`, forty-four their `## Recommendation` fence; a hundred and five options gain the subsection they were exempt from; eighty-six facts owe the reason they recommend on and two hundred and four the case against; every quotation in the record moves to the ledger and comes back as a reference; and the reader gains eight things it does not hold. The answer as it stood is kept as the option `facts-carry-options`, the encoding of 2026-09-04 as `every-part-in-the-record`, and the answers before them as the options this fact carries.

**AI divergence.** The block grows from two keys to six and carries a register the fold may not touch, on every node a survey judges; and the hashes pin the five sections at the survey's own reading of them, so a change to what the validations read of a node, which is the `survey-selection` node's to decide, invalidates every hash on every node at once, which is why that node schedules a whole survey after any such change.

It takes every surface on which the author checks the AI and makes it something the AI derives — the answer resolved through hunks against another option, the author's own words reached by `supports` and `diverges` references the AI files, the confirmed label computed — and it composes the encoding in force, five clauses folded into it earlier, the per-option content, the ledger, the removal of four sections and a six-key survey block into one row whose bundling the AI chose, so a confirmation confers together what the author examined and what they did not.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
under:
  - commons.systems/disposition-graph/unanswered
defines:
  - dialogue
  - dialogue state
  - stage
  - draft
  - recommendation
  - account
  - fact
  - ruling
  - gloss
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
---
## Answer

Its question, its fields, its facts with their options and the content each option carries, and its answer, which is the resolved content of the option labelled confirmed; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, and the facts stay with their options, their contents, their recommendation, their readings, the references to the author's words their options carry, and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. A fourth follows from those three and governs every part below: what a ruling or a projection needs is in the record, in one place, and none of it is supplied by a projection's own text, held in a buffer, or left to be inferred from the absence of a field. It has these parts, each holding only what cannot be re-derived.

One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.

`facts`, every decision on the node, as data, each with a `name`, its `options`, the one it `recommends` with the `boldness` of that recommendation, and `against`, the strongest case against that recommendation in one line and in the AI's own words. The recommendation is the judgment that weighs the support and the divergence recorded on each option, and the fact's own reason is where that weighing is written. No key names the option confirmed: confirmed is a label, the option on the fact the author last ruled with the response confirm, derived from the rulings as the class is derived from them, and written nowhere. The word standing is not used of an option: the author's words of 2026-09-07 make it one thing with confirmed and the record keeps the one name. Boldness is low, moderate, or high: how much of the recommendation rests on the AI's own knowledge against the record and the author's words, so that high boldness is low confidence, which is the direction the author gave the term on 2026-09-03 and the direction the growth node's option `boldness-reversed` brings that node's own definition to. Four names are reserved and no others are minted without a ruling here: `answer`, whose options are the candidate answers to this node's own question; `authority`, the class a ruling would confer, ratified, delegated, or deferred, which is why no recommendation carries a class of its own; `existence`, keep or prune, which is where a proposal to prune the node is recorded rather than as an option of a special shape that answers no question; and `persistence`, whose options are the shapes the node would keep, present only where the recommendation would change its shape and otherwise derived from the shape and asking nothing.

A node that carries facts at all carries the answer fact and the authority fact: the answer because the node's own question is what a dialogue on it is for, and the authority because a ruling on that fact is how delegated and deferred are conferred, so a node without it offers the author one exit where the record gives three. A node may carry no fact, and then it stands at the periagogic or the maieutic stage, where nothing has been proposed yet and a class would be conferred on nothing; from the review stage on there is a recommendation to read, so there are facts, and those two are among them. That `existence` and `persistence` are conditional where `authority` is not is a decision and not an accident of the encoding: every ruling decides a class, so the class is asked wherever a ruling can be given, while a prune and a change of shape are decided only where one is proposed, and a choice nobody has raised is not a candidate the record lists.

An option carries its `name`; on the answer fact its `source`, the author's words, the AI, the clean-context review, or the instrument or node that raised it outside alignment, and its `ref`, the date of the words or of the review, the graph commit, or the instrument or node; a `status`, which is `passed` and nothing else, with the `reason` it was passed over, wherever the AI holds it dominated on the record's criteria; its `supports` and its `diverges`, the entries of the author's words that bear each way on it, written as references into the ledger the quotes node keeps, an entry being referenced by any number of options on any number of nodes; and its `ruling` once the author has given one. An option must be recorded when the author's words support it or diverge from it, when a tradition supports it or diverges from it, or when the AI weighed it for any reason, its own assessment of viability included: the trigger is an act that leaves a trace, so an option the AI considered and rejected in its head is recordable by rule and not by conscience. Which entries of the author's words a node retains follows from those references and is the quotes node's rule, cited here and not restated, as what viability is and whether a candidate ever leaves the list are the viable-options node's, whose terms this answer uses.

An option on the answer fact is a candidate answer to this node's question, whole or a named change to another, so that a ruling for a change is a ruling for that text with that change. Every option of the answer fact carries its content, so that a projection can render the node as it would stand under any option the author selects, which is what the alignment page's context pane does. It carries it in one of two forms and no third: whole, as a fenced `markdown` block holding the node as it would stand under it, its frontmatter without the dialogue's own keys and without the facts, and its `## Answer`; or as a named change to another option of the same fact, a line naming that option followed by a fenced `diff` block of unified-diff hunks against that option's resolved content. A hunk carries an `@@ -l,s +l,s @@` header, context lines prefixed by one space, removals by `-` and additions by `+`, with three lines of context each side where the text allows; it is applied strictly, at the line its header names, every context and removal line matching byte for byte, with no fuzz and no offset search, so a hunk that does not apply exactly is an error of the record and is never re-anchored. The resolution is acyclic and a cycle is a finding, as it is in `depends`. Hunks are produced by diffing the two resolved texts and never written by hand. Every text is stored once: a ladder of options that each add a clause to the one above stores one text and the clauses, and the difference the prose used to assert is data the projections apply and the validator resolves.

Every option of every fact has that sentence, and the record holds it in one place for each kind of option. An option of the answer or the persistence fact has a `#### <option>` subsection under its fact in `## Facts`, carrying in this order and no other: its sentence, in prose, what it would answer; a paragraph led `**AI support.**` and a paragraph led `**AI divergence.**`, the AI's accumulated support for the option and its accumulated divergence from it, each kept whatever the fact recommends, so that the case for an option the AI declined is not written only by the act of declining it; and, on the answer fact, its content in one of the two forms above. Every option has a subsection, the one the author last confirmed included, since its content is an option's content like any other and no section stands outside the facts to hold it. What the traditions say of an option is not written there: it is the derived inverse of what the readings bear on, as the readings node has it, and the projections show it beside the other two accumulations, headed support or divergence like them. So an option carries three accumulations and no more, and each is stored once in the place that owns it: the AI's on the option, the traditions' on the reading's `bears` entries and projected from them, and the author's own in the ledger and projected through the option's `supports` and `diverges`. An option of the two facts whose options are the record's own vocabulary, `authority` and `existence`, has no subsection at all: its name is a term, and its sentence is the gloss on the node that defines the term. A gloss is the sentence a `defines` entry carries beside its term, written as the term and the gloss together, saying what the term means and so what confirming that choice would mean; it is written once, on the defining node, and read from there, ratified, delegated and deferred on the authority node and keep and prune here. No projection carries a sentence of its own for an option: a sentence that lives only in a projection is a rule no node projects, and the same sentence written again on every node that carries the fact would drift.

`## Facts` holds one `###` subsection per fact, in the facts' order, opening with the reason the fact recommends what it does and the boldness of that recommendation, and the `####` subsections of that fact's options beneath it, in the options' order. A recommendation may be recorded at any stage of the dialogue, as the author ruled on 2026-09-04, and is required from the review stage on, since a node cannot be reviewed without one; a recommendation withheld until a stage boundary is a recommendation held in a session, which the first requirement above forbids. The AI may add an option or move a recommendation in alignment, in reconciliation, and in the loop on itself, within the scope its class allows, as the authority, evaluation and work-loop nodes say.

A `ruling` is the author's act on the option they chose, recorded on it: the `response`, confirm or edit, the `date`, `of`, the pin of the fact's recommendation it answered, and, where the author gave one, the `reason`, why they chose as they did, in their own words and optional. Those words are the author's like any others, so they are an entry of the ledger and the option carries the reference and not a second copy of them, which is what the authority node means when it says a ruling whose words are not in the record, or whose option carries no reference to them, is invalid. The reason sits on the option because that is where the choice is, and the words that opened or moved the dialogue reach the same option, or another, by the same references; the two are different things, one being why this option was taken and the other what was said to the record. A denial is never a ruling: it is a kickback with the author's words. Only the author rules, on the alignment page or in prose, and the AI writes no ruling and no class for itself.

`stage`, the next movement owed: periagogic, maieutic, review, or ruling. The movements come in that order, so the stage also says what is behind the node, and a kickback moves it back. A recommendation moved on a node with a class re-opens the dialogue at the movement the recording node's classification calls for, the review where only the recommendation moved, from wherever the move came.

The author's words are not a section of the node. They are entries of the ledger, verbatim and dated, and they reach a node as the references its options carry, an entry appearing on every option that supports it or diverges from it and shown to the author as one quotation concatenated in date order.

There is no `## Recommendation` section, no `## Answer` section, no `## Rationale` section and no `## Disposition` section. A node file is its frontmatter, its `## Facts` and its `## Account`. A node's answer is the resolved content of the option labelled confirmed; where none is, of the option the answer fact recommends; and where the node has neither, it has no answer, which is the state of every node no ruling reaches. The projections derive the edit between any two options' resolved contents, field by field and word by word, and store none of it. The argument for a recommendation is the recommended option's support, the rivals' divergence and the fact's own reason, none of which is a copy of the others. And the author's words are in the ledger the quotes node keeps, reaching the node as the references its options carry. An option's content is a draft and may be invalid under the doctrine of the day, as when it presumes a ruling not yet given: the validator resolves it and parses it, and checks only that it answers the same question and carries none of the node's own keys and no facts of its own, and it checks nothing else about what it says.

A ruling that gives a node its first answer is not a ruling that amends one, and the projections say which by naming the ground rather than by withholding the edit. Where an option is confirmed they lead with the edit this ruling would make and name the ground as the answer as confirmed. Where none is, nothing has been confirmed to take an edit against, so the recommended option's resolved content is shown whole and named as a draft no one has confirmed, whatever class a ruling on the authority fact confers, since that ruling is about who decides and not about this text. A first answer is thereby named as one, by its ground: confirming a draft no one has confirmed ratifies the AI's draft, and a denial leaves the question open with nothing behind it that holds, since what an unanswered disposition lacks is authority and not its place in the record, as the un-aligned-children node says.

`review`, the state of the two readings the clean-context review divides into, as that node's answer describes them. Of this draft: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the pin of the recommendation the reviewer read; `against`, the counter-argument it returned, which the projections show on the recommended option's row in place of the case the AI wrote there; and `commit`, the graph commit that reading read at, which names the tree the pin was taken from so that a re-reading can diff the text the last reading pinned against the node as it now stands. The first four are written together or not at all, and `against` and `commit` are optional beside them, a reading being complete without either and a reading taken before those fields existed carrying neither. Of the frontier: `survey`, its `date`; its `of`, the same pin; its `commit`, the graph commit the survey read at; its `text`, the hashes of the five sections the survey's validations read; its `findings`, the register of what the last survey left open on this node, each with the support it rests on and the condition on which it is discharged; and its `pairs`, the pairs that survey read which touch this node, each with the key it was drawn on; and no verdict, since a survey judges the frontier's consistency with itself and kicks back the nodes a finding names rather than forwarding one; it may stand alone on a node the survey judged before that node's draft review ran. Which five sections the hashes cover, what the register carries, and what a key is are the survey-selection node's, whose terms this answer uses and does not restate; what this answer fixes is that the block has somewhere to put them, since a survey that must walk history to find what it last read is a pin held outside the record. When each pin is written is the review's own step and the clean-context-review node's. A node reaches the ruling stage on a forward verdict; that both pins name the recommendation as it stands is the node's readiness, derived and shown by the projections, and no ruling is recorded while either reading is owed.

`depends`, the open questions whose rulings this one waits on, as data: the ids of nodes still on the frontier whose rulings must come before this node's, or a node id and an option on its answer fact, written as the id and the option's name, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. It is also what carries coherence between decisions, within a subtree as between subtrees, so no separate exclusion field is minted. A dependency runs one way: entries that close a loop put each question behind the other and no order can place either, so a loop is a finding and one side of it is dropped. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed with the rest of the dialogue at the recording.

`## Account`, the AI's account in prose: the evidence, the findings, the reasoning behind the recommendation of each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author. It is not a proposal and does not carry that name: a proposal is the state the authority node defines.

The validator holds the parts together. A stage on every node no ruling grants, on every deferred node, and on every node whose recommendation has moved since its ruling, and every part of the dialogue, the review, the dependencies and the account, requiring one. From the review stage on, facts, with every fact recommending one of its own options, a boldness beside it, and the reason for that recommendation written in the fact's own `###` subsection; and the answer fact and the authority fact wherever a staged node carries facts. On the answer fact from the review stage on, every option carrying its content in one of the two forms, each whole content parsing as a node, answering the same question, and carrying none of the node's own keys nor a `## Facts` section, each named change naming an option of the same fact, the resolution acyclic and resolving through no name no option carries, every hunk applying exactly, and every `supports` and `diverges` reference resolving to an entry of the ledger that exists. The facts' names from the reserved four with the answer first, each option's name unique on its fact and a slug on the answer fact, an answer option carrying its source and its ref, the two vocabulary facts offering only their own vocabulary, a `status` that is `passed` with its `reason` on an option that is neither recommended nor ruled, at most one ruling per fact, and no key naming the confirmed option, that label being derived from the rulings and stored nowhere. The `## Facts` subsections matching the facts in name and order, with one `####` under a per-node fact for every option of that fact, the confirmed one included, and none at all under a vocabulary fact, each `####` carrying its sentence, then its `**AI support.**`, then its `**AI divergence.**`, then, on the answer fact, its content, in that order. The review's four required draft keys together or not at all, with `against` and `commit` optional beside them and the survey block standing alone. A forward verdict at the ruling stage. No `## Answer`, `## Recommendation`, `## Rationale` or `## Disposition` section on any node file. Every `depends` entry resolving to a node that still carries a stage, and to an option on its answer fact where one is named, with no entry that closes a loop. And every reading's `bears` entry resolving to a fact and an option of the node it names.

What the instrument holds of that at implementation commit `feaaac1b`, and what it is owed, named here so that the debt is reconciled and not discovered. It holds the two hard pieces: `packages/disposition/patch.mjs`, which parses hunks, applies them strictly with no fuzz and no offset search, and produces them by diffing two resolved texts; and `packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry, and reports the entries no option references. Neither is wired into the reader, and eight things are owed there. The option keys `content`, `supports` and `diverges`, where `OPTION_KEYS` is `name`, `source`, `ref`, `status`, `reason` and `ruling`. The survey block's `commit`, `text`, `findings` and `pairs`, where the survey keys are `date` and `of`. The resolution of an option's content and the cycle check over it, the reader refusing a cycle for `under` alone today. A `depends` entry that closes a loop, refused for `under` and not there. `stands` struck from the fact keys and the confirmed label derived in its place. The four section names struck from the section order, which still lists Disposition, Answer, Rationale and Recommendation. The answer fact and the fact's own reason required from the review stage on, beside the authority fact the reader already requires. And the `####` requirement inverted, since the reader today exempts the option `stands` names from carrying one. What the record owes beside the instrument, measured at graph commit `93644144` over its hundred and fifty nodes: a hundred and five options on answer facts carry no subsection, and every one of them is the option `stands` names, so the exemption and the debt are the same hundred and five; eighty-six facts recommend with no reason recorded, fifty-two of them at the review or the ruling stage; two hundred and four recommend with no case against, sixty-eight of them at those stages; a hundred and thirty-four node files carry a `## Answer` and a `## Rationale`, seventy-four a `## Disposition`, and forty-four a `## Recommendation` fence; and not one node carries a single ruling, so nothing anywhere in this record is confirmed today and every projection that shows a text in the confirmed place is showing the AI's draft.

Everything else is derived: the class and the status, the confirmed label, the persistence where no fact carries it, the queue and its order, whether a recommendation has moved since its ruling and whether it has changed since either reading, the readings on each option, the sentence of every option, the resolved content of every option, the edit the projections show, and the counts. A pin covers what was recommended and what the recommendation was chosen among, and no more: a fact's pin is its name, the option it recommends and the boldness of that recommendation; each of its options' `name`, `source`, `ref`, `status` with the `reason` it was passed over, and `supports` and `diverges`; and the recommended option's own sentence and its resolved content. The review's pin is every fact's. Because the pin covers a resolved content and not a stored one, an edit to an option that another option's content is a named change against moves the pin of every fact whose recommendation resolves through it, and a base option nothing recommends is therefore not outside the pin the way its own subsection is. What is outside every pin is what accumulates: the AI's support and divergence on any option, the fact's own reason, the author's reason recorded with a ruling, the accounts, and both cases against. The AI's accumulation and the fact's reason are outside it because they grow at every sitting and are exactly what the fold and the accumulation touch, so a pin over them would stale every reviewed node on every sitting and would say that a recommendation had moved when only its argument had thickened. Both cases against are outside it for the reason each has: the fact's is the argument the recommendation had to beat and not part of what is recommended, so sharpening it should not send a reviewed node back; the review's is written by the apply step of the very review whose pin sits beside it, so a pin that covered it would stale itself the moment it was recorded. The references are inside it because a `supports` or a `diverges` is a claim about what the author said, filed by the AI, on the surface where the author rules, and the one thing a pin exists to guarantee is that what the author confirms is what a reader read.

The projections that show a node with a confirmed choice, the browser and the alignment page, show that choice first, marked confirmed, and beneath it the recommendation, the other options with their status, and, on every option, the three accumulations headed support or divergence; and they say that the confirmed choice keeps its authority until the author rules for another. Where no option carries a confirmed ruling nothing is confirmed, and a projection that puts an unconfirmed text in that place is showing the author the AI's draft where their own choice belongs.
```

#### generated-answer-and-disposition-sections

The node file keeps `## Answer` and `## Disposition` as generated sections, rendered from the confirmed or the recommended option's resolved content and from the ledger entries its options reference, the validator regenerating both and refusing a file whose generated sections differ from what it derives.

**AI support.** A node file stays readable on its own: a reader who opens it meets the answer and the words without resolving a hunk or a ledger reference, which is the legibility trade the recommended option pays. Raised by the clean-context reading of 2026-09-07 as a candidate the record did not carry.

**AI divergence.** It stores a derived text in the record and checks it against its derivation, which is a copy that can drift between the write and the check, and the rule the recommended option rests on is that a copy is what drifts; what a reader gains the projections already give, since the browser and the page render the same derivation without storing it. Passed over for that reason.

**Content.**

```markdown
---
question: What does an unanswered node carry?
form: rule
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
  - fact
  - ruling
  - term: answer
    gloss: "Answer is the fact whose options are the candidate answers to the node's own question, and whose confirmed option carries, as its content, the answer the node stands on."
  - term: existence
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the existence fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the existence fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The node file keeps `## Answer` and `## Disposition` as generated sections, rendered from the confirmed or the recommended option's resolved content and from the ledger entries its options reference, the validator regenerating both and refusing a file whose generated sections differ from what it derives.
```

### authority

Ratified. This node fixes what every node in the record carries and what every
projection may show of it, so a wrong answer here is written into every node file
and into both pages at once, and the two failures the record has already suffered
are of exactly the kind a ratification guards: a projector that supplied a sentence
the record did not hold, and a caption that told the author a draft was the node as
it stands. Each told the author their ruling meant something other than it did,
which is capture-shaped whatever else is true, and neither was catchable from
inside the projection that made it. The recommended option adds a third surface of
the same kind and is the reason the class is not merely re-affirmed but argued
again: under it the author's own words reach the ruling surface through `supports`
and `diverges` references the AI files, so a reference on the wrong side is the AI
telling the author what the author said, at the moment they rule on it.

What a ruling here sets in motion is a migration and not a blessing. No node in the
record carries an option's content, a ledger reference, a derived confirmed label
or a six-key survey block today, and at graph commit `93644144` a hundred and
thirty-four node files still carry the `## Answer` and `## Rationale` this answer
removes, seventy-four the `## Disposition`, and forty-four the `## Recommendation`
fence; a hundred and five options owe the subsection they were exempt from, and
every quotation in the record moves to a ledger that holds none of them yet. The
author granted that reconciliation in their own words on 2026-09-07 —
"reconciliation of that disposition in included in the bootstrap reconciliation
authority for this sitting" — so the record will be written this way before the
author rules, under a grant and not under a class. That cuts toward ratified on the
record's own test rather than away from it: the cost of a wrong answer is paid in a
hundred and fifty rewritten files and in every reference into a ledger, which is
`class-recommendation`'s expensive limb, and it is paid in work no later ruling
takes back, which is its irreversible one. What the author would be ratifying is
the encoding they refined in their own words that day, and the AI's composition of
it, and not the AI's execution of the migration, which is the grant's and answers
to the grant.

Delegated would hand the AI the shape of the author's own ruling surface, which is
a delegation of the terms on which a delegation is confirmed, and it is the one
class this fact should not carry. Deferred is the honest second choice and is why
it is on the fact: the recommendation would act, the migration would proceed under
the grant exactly as it will anyway, and the node would stay on the alignment
frontier in front of the author while they work it. Its real content is that the
author need never come back to it. The reason to escalate past it is that this
answer is what every other ruling is recorded in, so an error here is not corrected
by the rulings that follow but carried by them, and the surface the author checks
the AI on is the last surface to leave the author's hands. Boldness low: the rule
that escalates toward ratified where being wrong is expensive, irreversible, or
capture-shaped is the record's own, all three limbs are met on the record's own
measurements, and both instances cited are the record's.

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

#### The recommendation withdrawn, and the error it repeated, 2026-09-03

The greenfield validation the author asked for returned sound with corrections
on `aspects-compose-the-answer` and produced a design that beats it. The
sitting withdraws its recommendation and adopts `aspects-are-nodes`. What
follows is the account of why, including of how the withdrawn design failed,
since the failure is the same one twice and the record should carry it.

**The counter-argument that decides it.** `aspects-compose-the-answer` rebuilds
the node model in miniature inside the node. A choice is an alternative. A
ruling is a stamp. `ruling.of` is `review.of`. `excludes` is `depends`. Every
rule already written on `authority`, `quotes`, `rejected`, `checkpoint` and
`clean-context-review` would have to be stated a second time for the inner
unit. It does that because it treats the size of a node as fixed and asks how
to subdivide the text inside one, when the record's own answer to "this text
carries several decisions" is `node`'s: it is several nodes. Taking the
incumbent node size as a given is a brownfield fact doing the work of a design
constraint, which is precisely the error the author had just directed be
recorded on `evaluation` as the error to hunt. The sitting recorded the test
and then failed it in the next recommendation.

**The analogy is struck, and it is the second of its kind.** The withdrawn
design argued that "a sentence carried by no aspect is a sentence nobody ruled
on" is the argument `materialization` makes one level down. It is not.
`materialization` prescribes tolerance and review: unsupported implementation
"is on the frontier and liquidated through reconciliation, where pruning is
proposed and the author rules on it". Applied honestly one level down that
yields prose written whole with a coverage check that flags uncarried sentences
for the author to rule on, which is the carving model with a check, not
composition. The claim is also false on its own terms under whole-node
confirmation, which rules on every sentence at once; it is true only after
assuming per-aspect ruling is the only ruling, which is the conclusion. Earlier
today this sitting made a move of exactly this shape, that the diff is "the
reconciliation frontier's idiom", and the validation struck it. Two glosses of
one kind in one sitting is a pattern and not an accident: both took a
sentence's authority from a node whose answer says something adjacent and
weaker. The rule to carry forward is that a claim cited to a node is quoted
from it or it is not made.

**What the validation found in favour, and it is worth keeping.** The
composition claim survived its empirical test better than expected. Decomposed
against real answers, `authority` yields about eight aspects with two
non-decision sentences, `growth` about ten, and `dialogue` the hard case;
connective tissue runs at roughly a tenth to a seventh of sentences, and the
derived text reads as a list of rules, which is how these answers already read.
So composition was not broken. It was beaten.

**The corrections that survive into the adopted design.** The quote drill-down
was mis-keyed: a choice carrying "the dates of the author's words" selects
nothing, since this node alone holds eighteen quotation blocks all dated
2026-09-03; quotations need an anchor, not a date. Per-aspect review does not
deliver "confirm any reviewed choice and it lands" in general: a reviewer who
reads each non-adopted choice against the adopted others covers one deviation,
and two deviations produce an unreviewed render that goes back to review. Under
`aspects-are-nodes` both dissolve, since a child is reviewed as a node and its
quotations are its own. `excludes` was insufficient in any case, unable to
express requirement, n-ary constraint, or wording dependence, and `depends` on
a node and an alternative already does the work.

**And the flaw that was near fatal.** Under `aspects-compose-the-answer`,
aspects are dialogue state, and this node's answer says confirmed dialogue
state folds into the node at the recording and the fields are removed. So an
answered node's derived `## Answer` would have had no source. It could only be
saved by making aspects the node's permanent encoding on answered nodes too,
which is a change to what a node is rather than to the dialogue, and the
withdrawn design did not say so. `aspects-are-nodes` never raises the question:
the answer stays written and stays stored, on the parent and on every child.

**The cascade shrinks.** `aspects-compose-the-answer` would have touched every
node in the record, since a derived answer changes what a node is, and the
claim that its cascade was "unchanged in membership and in count" was wrong.
`aspects-are-nodes` touches `dialogue` for the `facts` set, `unanswered` and
`recording` for a response given on a child while the parent is open,
`alignment-page` for the page, `growth` for `partial-ratification`, which
`under` now answers, and `alignment-order` for a sentence on rendering a
subtree as one disposition. `node`, `quotes`, `rejected`, `transience`,
`checkpoint`, `forms`, `session-context` and the hashing are untouched, because
nothing about a node changes.

This recommendation rests on the record rather than on the AI's own knowledge:
its three load-bearing sentences are quoted from `node`, `un-aligned-children`
and `under`. Its boldness is low, in the direction the author uses the term.
The clean-context review is owed on it before the author rules, and the
author's instruction for this sitting stops short of it.

### A recommendation may be recorded at any time, 2026-09-04

The author's revision is above and it amends two sentences of this node's
answer. The answer says `recommendation` is "required from the review stage
on", and that "A recommendation is drafted after the first maieutic movement
and may change on a kickback or as the frontier evolves". Under the revision
the first sentence keeps its floor, since a node cannot reach review without
one, and loses its implication that the field may not be written earlier; the
second loses "after the first maieutic movement" and keeps the rest. The
alignment skill's presentation rule carries the same implication and goes with
it.

It is a good revision on its own merits and not only as the author's. A
recommendation withheld until a stage boundary is a recommendation held in a
session, and this node's own first requirement is that the state survive the
session that held it. The sitting of 2026-09-03 and 2026-09-04 is the
demonstration: it formed and withdrew four recommendations on this node in one
day, and each lived in prose in this account rather than in the field the
projections read, because the field was not yet due.

**What this sitting recommends on this node, and the encoding problem it
exposes.** Two of the alternatives here are recommended and they are
orthogonal: `aspects-are-nodes`, for what carries a decision the author rules
on separately, and `first-answer-is-not-an-amendment`, for how a ruling that
gives a first answer is presented rather than shown as an edit against nothing.
Adopting either does not decide the other. The encoding cannot say so: this
node's answer gives `recommendation` a single `adopts`, so the field can name
one of the two and the account must carry the other in prose. That is the
author's ruling of 2026-09-03 arriving from the opposite direction, that the
record carry a decision per aspect, and it is worth the review's attention that
the defect showed up in the node that defines the encoding, in the ordinary
course of using it.

The field was therefore not written in that checkpoint, and the reason was not
the stage the author had just removed; it was written in the next, as the
section below records. It is that a recommendation adopting an
alternative requires the `## Recommendation` fence, the whole proposed node, and
drafting that for this node is the maieutic movement the author has scheduled
for after compaction. What is recorded is what the sitting recommends, named
here and set out in full in the two alternatives.

### The fence drafted, 2026-09-04

The author asked whether drafting the fence would de-risk context loss, and it
does, so it is drafted. Until now `aspects-are-nodes` existed as a description
of a design; a session resuming from a description has to re-derive the text
the design implies, and that is where drift enters. The fence is the text
itself, so what survives compaction is the recommendation and not an account of
one.

What the fence carries, stated because the `adopts` field cannot. It is the
whole proposed node under two recommendations at once, `aspects-are-nodes` and
`first-answer-is-not-an-amendment`, which are orthogonal and neither of which
decides the other. `adopts` names the first because it is the structural
change; the second is the paragraph on a first answer against an amendment, and
the rationale's account of it. A confirmation of this recommendation therefore
confirms both, and the author should deny or edit if they want them apart. That
one field cannot say what two sentences of prose must is the encoding defect
already recorded here, and the ruling in the fence is what would fix it.

Also folded in, being the author's own words and not the sitting's judgment:
the revision of 2026-09-04 that a recommendation may be recorded at any stage,
written into the `recommendation` paragraph with the floor kept, since a node
cannot be reviewed without one.

Three things the fence settles that the alternatives' prose had left loose. The
reserved `facts` are exactly three, `authority`, `existence` and `persistence`,
and no others are minted without a ruling on this node, which closes the obvious
route by which the facts set would have grown back into the aspects model.
`class` leaves the recommendation, since it is the `authority` fact's adopted
choice, so the recommendation carries `adopts`, `boldness` and its pin alone;
the field in this node's own frontmatter still carries `class`, because the
node is written under the doctrine of the day and the fence is what would change
it. And coherence between decisions is `depends` extended to name an
alternative, not a new exclusion field, which is the `depends-names-an-alternative`
alternative already on this node arriving as a consequence.

The rationale's rejected lines now carry the four designs this sitting killed,
each with the reason: aspects as slots carved into the answer, the answer
composed from its aspects and derived, ranges marked on whole-node alternatives,
and a separate exclusion field. The existing rejected line "a node per
alternative" is kept and sharpened, since the decision-per-aspect ruling turns
on exactly that distinction: a separate question is a node, a rival answer to
one question is an alternative.

The recommendation's boldness is set to low, in the direction the author uses
the term. Its three load-bearing sentences are quoted from `node`,
`un-aligned-children` and `under`, and the rest follows the author's words of
2026-09-03 and 2026-09-04. The pin is the standing text at `163f5ee5` and the
graph commit `e228e67e`. The clean-context review is owed and has not run; the
fence is what it will read.

### The cascade taken through maieutic, 2026-09-04

The six nodes `aspects-are-nodes` touches are through their maieutic movements
and none is at the review stage, on the author's instruction. `alignment-page`
has its first answer and its fence; `growth` adopts `boldness-reversed`;
`unanswered` adopts `responses-on-decisions-and-children`; `recording` is
kicked back from the ruling stage and adopts `responses-classified-per-decision`;
`alignment-order` is kicked back from the review stage with its fence amended
for the author's correction of 2026-09-04; and this node carries the fence
drafted on 2026-09-04. Four of them name this node's `aspects-are-nodes` in
`depends`, which is the first use in the record of the second form
`alignment-order` defined for that field, and the frontier now counts it.

Two consequences of this node's fence were found in the writing of the others
and are recorded where they land rather than here: `recording` is the only node
that writes a stamp, so it is where the stamp's class comes from now that this
fence takes `class` off the recommendation, and it is the only place a node is
deleted, so it is where a ruling on the `existence` fact is recorded before the
file goes.

**One implementation fact the reconciliation must not miss.**
`stripDialogueFrontmatterLines` in `packages/disposition/derive.mjs` removes
`stage`, `recommendation`, `review`, `alternatives` and `depends` from the
frontmatter before the standing hash is taken, and nothing else. `facts` is
dialogue state by this node's answer, so it must be removed there too. If it is
not, recording a fact on a node changes that node's standing hash, and every
`amends` and `review.of` pin in the record goes stale at once for a reason that
has nothing to do with the standing text. Recorded here because it is a
consequence of this node's encoding and would otherwise be found by the
frontier flagging seventy nodes at the same moment.

### The maieutic movement, 2026-09-04

Run as a design unit of the sitting the `alignment-page` node's account of
2026-09-04 sets out, under the grant recorded there, on the record at graph
commit 9144c708 and on nothing held in a session. The five options raised on
this node since its review of 2026-09-03 are each a clause the reconciliation
of that day has already written into the reader; what this movement owes the
author is one answer that says the encoding whole, so that a ruling is on the
encoding and not on five fragments of it, and the five keep their rows so that
a ruling may still be on one.

**The three classes of finding.**

Contradictions within the graph. The standing answer holds that "an option the
AI no longer holds viable leaves the list", while `viable-options` carries
`passed-over-options-stay` and the reader carries `status: passed` with a
required reason; the clean-context review of `prose-and-structure` on 2026-09-04
found that the membership of an option list is that node's question, and this
answer therefore states it nowhere and cites it. `authority-fact-on-every-node`
as recorded requires the fact on every staged node, while three staged nodes
carry no fact at all and the reader requires it only where a node carries facts;
the fence takes the narrowing and says so. The standing answer holds that a node
with no class leads with the recommended text whole, while `alignment-page`'s
answer leads with the edit wherever an answer stands; the departure is
`edit-led-against-a-named-ground`, recorded here for this node to decide, and
the fence takes it with its test moved from the node's class to the standing of
the text. And the rationale still carried a prose list of four traditions, which
`readings` forbids and `prose-and-structure` names; the fence carries none, and
the four are readings owed under this node.

Between the graph and the AI's knowledge. A pin over everything on a node would
stale itself: the review's counter-argument is written by the apply step of the
review whose pin sits beside it, so `review.against` outside the hash is not a
convenience but the only coherent place for it. A sentence held in one place and
copied into a projection is the update anomaly the record has already read under
`prose-and-structure` as `codd-update-anomaly`; the projector's table of class
sentences was that copy. A `depends` that runs both ways cannot be scheduled;
the reader already refuses a cycle in `under` and does not look for one here.

Redundant seams, and what closes each. An option's sentence had three homes, the
`#### <option>`, the `## Answer` of the option that stands, and the projector's
table; the answer keeps the first two, which are the record's, and strikes the
third. The author's reason for a ruling had two, the `## Disposition` section
and the page's database; the answer separates them, one being what was said to
the record and the other why an option was taken, and gives the second a field.
The node's readiness had two, the review's own section on the page and the
`review` field; the answer keeps the field and `alignment-page` puts it on the
stage chip. Measured at 9144c708: ninety-seven nodes, all staged; ninety-four
answer facts and ninety-four authority facts; six existence facts and four
persistence; seven hundred and thirty-three options, of which a hundred and ten
are passed and every one has a sentence; a hundred and five facts recommend with
no reason recorded in `## Facts`, seventy-six of them at the review or ruling
stage, this node's own answer fact among them until this draft; all fifty-four
reviews carry the counter-argument they returned and five facts on two nodes
carry the AI's own case against; no node carries a survey pin while thirty stand
at the ruling stage; and two `depends` cycles are
live, this node with `viable-options` and `alignment-page` with `unanswered`.

**The evaluation twice.** Fresh judgment, written as if nothing were here to
preserve: a node is a question, its answer, and the decisions on it; a decision
is a list of options with the author's rulings recorded on the one chosen and
the AI's mark on the one it recommends; every option says in one place what it
would answer; a reading is pinned to what it read; and a projection shows what
the record holds and supplies nothing of its own. Everything the five clauses
ask for falls out of the last of those, which is why they are one option and not
five. With reference to tradition: architecture decision records in the MADR
form, read under this node and adopted, with the divergence already recorded
that the status is derived here; the special verdict form, under which the
decider is asked each question the judgment needs and no question is supplied by
default, adopted for the authority fact on every node that carries facts;
legislative amendment shown against the text it changes, adopted for naming the
ground of an edit; the reasoned decision, already read under `alignment-page` as
`chenery-reasoned-decision`, adopted for the reason recorded with the ruling;
the single-subject rule, diverged from, and the case against this composition;
and the glossary's rule that a term is defined once, which the record already
holds as `codd-update-anomaly`. Traditions shelved by pre-agent constraints and
affordable now: a rationale per option and an objection stated on every
recommendation were both dropped from documents written by hand because no
author could maintain them at that density, and an agent can. Each is owed as a
reading under this node or as a `bears` entry on the two the record already
holds, and none is restated in the fence's rationale.

**Tested against the record it joins.** The `under` chain runs `dialogue` to
`unanswered` to `growth` to `model`, and the global-tier nodes are `authority`,
`evaluation`, `delegation`, `materialization` and `session-context`; nothing is
ratified, so nothing here is written over doctrine. The answer cites and does
not restate: `authority` for the class read off the rulings and for the classes
a ruling confers, `viable-options` for what an option and viability are,
`clean-context-review` for the two readings and when each pin is written,
`recording` for where a moved recommendation re-opens the dialogue, `growth` for
boldness, `quotes` for the author's words, `node`, `un-aligned-children` and
`under` for the three sentences the second paragraph quotes, and `fidelity` for
the requirement this answer states and does not meet. Five nodes name
`dialogue#aspects-are-nodes` in `depends`, `alignment-page`, `growth`,
`recording`, `unanswered` and `viable-options`; that option stays on the fact
and the composed option carries its rule whole, so all five still resolve and a
ruling here still settles them. Two nodes name this node's children,
`checkpoint` and `madr-decision-records` sit under it with `viable-options`, and
none of their answers changes.

**The map of the movement's decisions to fields.** The composed option and its
recommendation, the answer fact's `recommends` and the `## Recommendation`
fence. Its case against, the fact's `against`, which the record now has a field
for and which this node is among the first to use. The five clauses, their own
options, each `####` saying it is adopted into the composed option, what the
composition departs from where it departs, and what a ruling for it alone would
adopt. The class a ruling would confer and its reason, the authority fact and
its `### authority` subsection, which this node owed and did not carry. The
dependency dropped and the one added, `depends`, with the reasons in the answer
fact's prose. The three reader changes, named in the fence's answer and located
exactly in the answer fact's prose. The readings owed, named in the fence's
rationale and in this section. Nothing of the movement is held only in a
session.

**Two liquidations the fence carries and this section names, since neither is a
disposition.** `defines` loses `alternative`, `standing answer` and `review
state`: the first is the superseded name for an option and `viable-options`
defines the term that replaced it, and neither of the other two occurs in the
answer, so the record would carry three terms defined by a node that does not
use them. And the rationale's prose list of traditions goes, the four becoming
readings owed, as `readings` requires.

**What this movement did not do.** It ruled nothing, wrote no ruling and no
class, edited no words of the author's, and touched no node but this one. The
clean-context review of this draft is owed and has not run; the fence is what it
will read. The two `depends` cycles are recorded above as a finding: this node
drops its side of one, and the other, between `alignment-page` and `unanswered`,
is named for the survey and is not this node's to resolve.

### Recorded at the review stage, 2026-09-04

The main thread read the draft adversarially before recording it and changed
nothing in it. What it checked rather than took: both `depends` cycles are
live as the draft says, `viable-options` pointing here and this node pointing
back, `alignment-page` and `unanswered` pointing at each other; the direction
of boldness in the fence, that high is low confidence, is the direction the
`boldness-reversed` option on `commons.systems/disposition-graph/growth`
brings that node to, so the two do not contradict; the standing answer and
rationale the draft leaves in place are the standing text unchanged, and the
account before this section is the account as it stood; and no implementation
name reaches the fence, the reader changes the movement identified being in
the facts prose and the account, where a claim about the code belongs.

The drop of `viable-options` from `depends` is the half of the cycle this node
may drop, and the draft gives the test rather than the convenience: a `depends`
entry is a wait and not a citation, and the fence reads correctly under either
ruling on what an option is. The other cycle is not this node's to break and is
named for the survey.

Two entries elsewhere are repointed in this landing, because a `depends` entry
naming an option says which side of a divergence a node stands under, and the
side both of these stand under is now a composed option: `alignment-page`'s
entry for this node moves to `every-part-in-the-record`, and its entry for
`commons.systems/disposition-graph/recording` moves to
`per-fact-after-two-readings`. Both clauses they named survive as options on
their facts, so nothing is lost by the move and the pointer now names what the
page's ruling actually waits on.
### The readings this sitting owed, 2026-09-04

Discharged, by the readings unit of the alignment sitting of 2026-09-04 under
the author's bootstrap grant of that day. Six new readings under this node:
`commons.systems/disposition-graph/special-verdict-form`, adopted on
`authority-fact-on-every-node`;
`commons.systems/disposition-graph/legislative-amendment-in-context`, adopted
on `edit-led-against-a-named-ground`;
`commons.systems/disposition-graph/single-subject-rule`, diverged on
`every-part-in-the-record`, which is the case against composing the clauses
into one option, as the fence's rationale gives it; and the three the standing
rationale names in prose, `commons.systems/disposition-graph/rfc-pep-status-field`,
`commons.systems/disposition-graph/review-approval-pinned-to-a-revision` and
`commons.systems/disposition-graph/change-reviewed-as-a-diff`, each adopted on
`facts-carry-options`. Chenery's two entries and Codd's already existed. The
two traditions this account calls shelved by pre-agent constraints, a rationale
per option and an objection stated on every recommendation, are not drafted:
neither carries an author, a work or a date here, so a `source` line would have
to be invented, and both existing readings already bear on
`every-part-in-the-record`. MADR's pros-and-cons is the nearest citable home
for the first if the author wants it read.

### The scope test, 2026-09-04

The delta sweep of 2026-09-04, run under `commons.systems/disposition-graph/author-questions` with the tests of `commons.systems/disposition-graph/probe-or-node`, found the discharged entry `proposal-at-two-loci` to have been a node's question: its own `discharges` names a second node's recommendation, `commons.systems/disposition-graph/authority`, a sibling rule and not a consequence of this node's answer, and the survival test says the same harder, the author's response now standing as authority's definition of `proposal`, carried in its `defines`, stated in its answer, and projected verbatim into `.claude/rules/authority.md`. No node is minted, because authority answers the question in terms and the author's words are quoted there; the entry's reason is annotated. The `depends` edge the scope test prescribes is not written: authority depends on viable-options, which depends on this node's `aspects-are-nodes`, and the validator holds a cycle in `depends` to be no order. The open entry `option-text-per-node-or-per-option` passes all three tests and stays a probe.

### Option from the review-cost node, 2026-09-05

`commit-in-the-review-block` was recorded on the answer fact from the sitting on `review-cost`, the node the author queued on 2026-09-05 when they asked what the review costs and granted its reconciliation. That node's answer gives an amended draft a re-reading whose object is the difference from the text the last reading pinned, and a difference needs a commit to be computed against; this node's recommended text says the four draft keys are written together or not at all, so a fifth is this node's decision and not that one's. The option is recorded here, acts on nothing, and leaves the recommendation and the pin where they were. The implementation already writes the key, under the author's bootstrap grant for that reconciliation, and it is unsupported by this node until the option is ruled; that is stated on `review-cost` as well as here.

### A citation of madr-decision-records corrected, 2026-09-05

The second clean-context reading of `commons.systems/disposition-graph/madr-decision-records`
found that this node's recommended text cited that reading for one divergence,
the status derived where the tradition stores it, which the reading's own
amendment of 2026-09-05 had falsified: it now records two divergences, and
holds that nothing called a status is derived here, the class being what is
derived. The drift was that draft's own making and the sentence is a plain
citation of it, so the sentence is corrected here rather than recorded as an
option; nothing the answer binds changes. The correction is inside the
recommendation fence and so moves the answer fact's pin from the text the
reading of this node read. It is not re-settled, for the reason the open option
`pin-names-the-text-the-reader-read` on
`commons.systems/disposition-graph/review-cost` states.

### Frontier finding, 2026-09-05

Kind: contradiction.

Nine nodes carry, inside `## Facts`, a `#### <option>` subsection for the option their answer fact names in `stands`. The encoding rule is that the standing option omits its subsection because its sentence is the first sentences of `## Answer`, and `commons.systems/disposition-graph/dialogue`'s own recommended answer states it: the option that stands "needs none, since its text is the answer". The nine, each with the standing option whose subsection is stored: `authority` (`authority-derived`), `delegation` (`reconciliation-session-writes-options`), `dialogue` (`facts-carry-options`), `evaluation` (`overrule-by-class`), `readings` (`relation-per-option`), `recording` (`options-persist-at-the-recording`), `rejected` (`non-chosen-viable-options`), `unanswered` (`unanswered-is-no-ruling`), `viable-options` (`grant-from-a-ruling`). `dialogue` is one of the nine, so the node that states the rule breaks it. What is stored is not the answer's first sentences but a description of the change the option made — on `readings` at line 131 it opens "A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer", and elsewhere the prose opens with a raising note of the form "Raised on ... from the author's words of 2026-09-04". Six of the nine render that stored prose in the survey brief in place of the answer's opening (brief lines 559, 846, 1282, 2403, 2502, 3671), so any projection that reads a standing option's subsection shows the author a delta where the answer belongs. The other three (`dialogue`, `evaluation`, `unanswered`) are outside the judged set and their standing rows are not rendered in the brief, so their subsections are dead text nothing reads. The record has the question open and unruled in two places: `dialogue` carries the option `standing-option-carries-a-subsection` (source alignment-page, 2026-09-04) and `alignment-page` carries `standing-sentence-stored`, passed over on 2026-09-04. So nine nodes have implemented an option the author has not ruled, against the rule that stands.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/delegation, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/alignment-page.

Proposed: Rule it once, on `commons.systems/disposition-graph/dialogue`, whose answer states the rule and whose fact already carries the option. If the standing option keeps no subsection, delete the nine subsections — the text is not lost, since `## Answer` carries the answer and the account carries the history of the change. If the standing option is to carry one, the rule in `dialogue`'s answer changes and the nine subsections are rewritten to carry the answer's first sentences rather than a description of a change. Either way the nine conform to one ruling and no node is left implementing the losing side. Until it is ruled, the six whose stored prose the projections render are the urgent half, because those are the ones showing the author the wrong text.

### The review skill names the fifth key, 2026-09-05

`.claude/skills/align-review/SKILL.md` §4.2 listed the four draft keys
`apply.mjs` writes to `review` and omitted `commit`, which the implementation
also writes and which this answer's recommended text does not admit, recorded
here as `commit-in-the-review-block`. The skill now names it and says it is
unsupported by this node until the option is ruled. The code is unchanged: the
key is what the re-reading diffs against and it was written under the author's
grant for that reconciliation, so what removes the divergence is a ruling and not
an edit. Landed on `greenfield` at `87e4b24e` under the author's grant of
2026-09-04.

### Who prunes, 2026-09-06

This node defines `prune` as an option of the existence fact, and the author's
standing disposition of 2026-09-06, quoted above, says who takes it: the AI, for
any node no ruling reaches, under the general delegation of graph topology, with
two bounds — a ratified node is not the AI's to prune, and anything from the
author on the node is transferred to another node first. The rule itself is
recorded on `commons.systems/disposition-graph/probe-or-node`, whose remedy sent
every prune to a row on the alignment page, as the option
`prune-delegated-with-two-bounds`; it is quoted here because this node holds the
term and a reader of the existence fact should meet it.

What the existence fact is for is unchanged by this. A prune the author wants to
rule is still asked at the node's row, and the fact is still how they are asked;
what the delegation removes is the requirement that they be asked at all where
the node carries no ruling.

### Frontier finding, 2026-09-07

Kind: cross-reference.

how-a-fact-is-headed's recommendation edits two other nodes' `defines` lists and neither node carries the edit. Its fact's case against says it "buys the link on every heading by writing on three nodes this ruling does not own: a gloss on `dialogue` for two of the four names and the release of the bare entries on `node` and `transience`", and its answer requires that "the bare entries at `disposition/disposition-graph/node.md:65` and `disposition/disposition-graph/transience.md:76` are released to it, so that one entry stands for each name." The gloss half is recorded where the author will meet it, as `dialogue-glosses-the-four-fact-names` on dialogue. The release half is recorded nowhere: node.md and transience.md name how-a-fact-is-headed at no locus, carry no option for the release, and are in no depends of that node. So the answer's claim that "There is no fallback, because this ruling leaves no name without such an entry" rests on two edits the record has not proposed on the nodes that would make them.

Also named: commons.systems/disposition-graph/how-a-fact-is-headed, commons.systems/disposition-graph/node, commons.systems/disposition-graph/transience.

Proposed: node and transience are where the release is missing. The release of each bare `defines` entry is recorded as an option on that node's answer fact, sourced to how-a-fact-is-headed, so each node's own ruler meets the edit their node would take, as dialogue's ruler already meets the gloss. how-a-fact-is-headed's answer stands; what it lacks is the two rows on the nodes it writes on.

Recorded as an option on commons.systems/disposition-graph/node's answer fact: `answer-gloss-released-to-dialogue` (source review, 2026-09-07).

Recorded as an option on commons.systems/disposition-graph/transience's answer fact: `persistence-gloss-released-to-dialogue` (source review, 2026-09-07).

### Option adopted, 2026-09-07

Two options recorded: the first from the author's refinement and three answers of 2026-09-07, the second from `survey-selection`'s answer, which needs the survey block to carry what its delta selects on; the second is recommended and carries the first, being a named change to it. The amendment is the pairs quoted old and new in §5 of `tmp/align/design-survey-cost-3.md` on the implementation checkout, which is not part of the record, applied to the recommended text of `every-part-in-the-record`; The text `every-part-in-the-record` recommended stands whole in this node's fence at graph commit `c55c9ebb`, and the migration under the author's grant of 2026-09-07 recovers it there as that option's content. The stage returns to review and the amendment owes a reading.

### Clean-context review, 2026-09-07, of e89627c6

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `the-survey-block-carries-what-the-next-survey-selects-on`.

Findings:

- `## Facts`, `### answer`: the fact's reason names a different option than the fact recommends. The subsection opens "`every-part-in-the-record` is recommended: the standing encoding with the five\nclauses raised since its review folded into it, each of them an instance of one\nrule, that every part a ruling or a projection needs is in the record, in one\nplace." while the frontmatter reads `recommends: the-survey-block-carries-what-the-next-survey-selects-on`. The whole subsection, its "Boldness moderate" paragraph, its "**Three of the five are departed from, and the fence says so.**" paragraph and its "**Two changes the fence makes beyond the five...**" paragraph argue the option recommended two moves ago. This is not cosmetic: the fence itself makes the reason part of the pin -- "a fact's pin is its name, the option it recommends, its boldness, the reason in `## Facts`, that option's own sentence" -- so what the author would confirm includes prose telling them a different option is recommended. Suggested edit: rewrite `### answer` as the reason for `the-survey-block-carries-what-the-next-survey-selects-on`, saying what the composed option now takes in (the standing encoding, the five clauses, the per-option content and the ledger of the author's words, and the survey's six-key block) and re-deriving the boldness from that.
- Frontmatter, answer fact, `against`: the AI's recorded case against is the case against a superseded option. It reads "It puts six decisions in one row, the standing encoding and the five clauses adopted into it, so a confirmation confers together what the author examined and what they did not, which is the bundling this node's own rule that a text answering two questions is two nodes exists to prevent." The option now recommended composes more than six: on top of the standing encoding and the five clauses it adds the per-option content in two forms, the removal of `## Answer`, `## Rationale` and `## Disposition` from every node file, the ledger and its `supports`/`diverges` references, the derived `confirmed` label, and the survey block's six keys. Suggested edit: restate `against` against what is actually recommended, and say which of those the author has spoken to (the 2026-09-07 refinement) and which are the AI's composition (the section removal and the survey block).
- `## Recommendation` fence, `## Rationale`: the recommended text's rationale argues a superseded option and does not argue this one. It opens "The author's question of 2026-09-03, quoted above, and their model of 2026-09-04 recorded on the viable-options node fix the shape" and turns on "One rule decides the rest, and it is what this answer adds to the model: every part a ruling or a projection needs is in the record, in one place. The record learned it five times in one direction.", closing "The answer as it stood is kept as the option `facts-carry-options`, and the answers before it as the options this fact carries." Nothing in it argues the ledger, the two forms an option's content may take, the strict hunk resolution, the removal of three sections from every node file, or the survey block's six keys; it cites none of the author's words of 2026-09-07 that ground them; and the reading that bears on the recommended option, `commons.systems/disposition-graph/verifying-traces-and-early-cutoff`, is absent from its list of readings, which still ends "chenery-reasoned-decision for the reason recorded with the ruling and codd-update-anomaly for the sentence stored once." The `recording` criteria ask whether the answer quotes every ruling it rests on; this rationale rests on rulings it does not quote. Suggested edit: redraft the rationale from the author's words of 2026-09-07 quoted under `## Disposition`, and add `verifying-traces-and-early-cutoff` and the single-subject divergence as it now stands.
- `## Recommendation` fence, `## Answer`, the paragraph beginning "There is no `## Recommendation` section": the paragraph contradicts itself within itself, on the central mechanism. It opens "There is no `## Recommendation` section, no `## Answer` section, no `## Rationale` section and no `## Disposition` section." and "A node file is its frontmatter, its `## Facts` and its `## Account`.", and then continues, unamended from the standing answer, "Where the recommended option is the one that stands, on every node whose recommendation acts and on every node whose draft is its recommendation, there is no such section, and a confirmation rules for the answer as it stands. A diff is derived from the fence and the node and never stored. The draft, elsewhere in the record, is this text. It may be invalid under the doctrine of the day, as when it presumes a ruling not yet given; the validator parses it and checks only that it answers the same question and carries none of the node's own keys and no facts of its own." -- four sentences that presuppose the fence the first sentence abolishes. The same collision runs on `## Disposition`: the ruling paragraph says "the author's words that opened or moved the dialogue stay under `## Disposition`, dated, as the quotes node decides", while the ledger paragraph says "The author's words are not a section of the node." An executor implementing this answer cannot tell whether a node file carries a `## Recommendation` fence, an `## Answer` or a `## Disposition`. Suggested edit: strike from "Where the recommended option is the one that stands" to the end of that paragraph, and in the ruling paragraph replace "stay under `## Disposition`, dated, as the quotes node decides" with the ledger entry and the option's reference to it.
- `## Recommendation` fence: the option-subsection rule and the validator paragraph contradict each other. The `## Facts` paragraph says "Every option has a subsection, the one the author last confirmed included, since its content is an option's content like any other and no section stands outside the facts to hold it.", while the validator paragraph requires "the `## Facts` subsections matching the facts in name and order, with one `####` under a per-node fact for each option but the one that stands and none at all under a vocabulary fact" -- the exemption the paragraph above abolishes, kept as a hard check, so a validator built to this answer would refuse the shape the answer requires. The same validator clause also says "a `status` that is `passed` with its `reason` and that is neither recommended nor standing nor ruled, at most one ruling per fact, and the ruled option the one that stands", using `standing` and `stands` of an option after the facts paragraph has ruled "The word standing is not used of an option: the author's words of 2026-09-07 make it one thing with confirmed and the record keeps the one name." Suggested edit: in the validator paragraph, require one `####` under a per-node fact for every option of that fact and none under a vocabulary fact, and replace the two uses of standing/stands with the confirmed label.
- `## Recommendation` fence, validator paragraph: "Three things this answer asks for the validator does not yet hold, named here so that they are reconciled and not discovered" is materially false, and validation 5 asks that nothing the draft presumes materialized be unmaterialized without saying so. Verified in `packages/disposition/read.mjs`: line 81, `export const OPTION_KEYS = ['name', 'source', 'ref', 'status', 'reason', 'ruling'];` -- no `content`, no `supports`, no `diverges`; and `export const REVIEW_SURVEY_KEYS = ['date', 'of'];` -- no `commit`, `text`, `findings` or `keys`. Nothing in `packages/disposition` resolves a named change, applies a unified-diff hunk, or reads a ledger entry, and `grep -n "cycle" packages/disposition/*.mjs` returns cycle handling for `under` alone, so the answer's "The resolution is acyclic and a cycle is a finding" is unheld too. The three named gaps are the gaps of the superseded option; this answer's gaps are the whole encoding. Suggested edit: replace the three-item list with what this answer actually asks of the reader, the projections and the ledger, in the same named-so-they-are-reconciled form.
- `## Recommendation` fence, `review` paragraph: "The four are written together or not at all, and `against` is optional beside them." is contradicted by the shipped reader, which already carries a fifth and sixth draft key -- `packages/disposition/read.mjs`: `export const REVIEW_DRAFT_KEYS = ['verdict', 'strength', 'date', 'of', 'against', 'commit'];` with `REVIEW_DRAFT_REQUIRED_KEYS` the four. So the draft reading's `commit`, which `review-cost`'s re-reading needs and which is materialized, is left on this node as the unadopted option `commit-in-the-review-block` while the survey's `commit` is adopted into the recommendation. Ruling this text as written makes the shipped key unsupported implementation. Suggested edit: either adopt `commit-in-the-review-block` into the recommended text beside the survey's `commit`, so both readings' commits are carried by one rule, or say in the paragraph that the draft reading's `commit` is a live option and the enumeration does not close against it.
- Frontmatter, `depends`: the entry the `### answer` prose says was dropped is still there, and the loop the answer forbids is live. The prose reads "**`depends`.** `viable-options` is dropped and\n`clean-context-review#per-draft-and-survey` added.", while the frontmatter carries `  - commons.systems/disposition-graph/viable-options`; and `disposition/disposition-graph/viable-options.md` carries `depends:` `  - commons.systems/disposition-graph/dialogue#aspects-are-nodes`. The fence's own rule is "A dependency runs one way: entries that close a loop put each question behind the other and no order can place either, so a loop is a finding and one side of it is dropped." -- so this node's own frontmatter is a finding under its own recommended answer, and the ruling order can place neither question. Suggested edit: drop the `viable-options` entry, as the prose already says was done.
- `## Recommendation` fence, `## Rationale`, the costs paragraph: "the survey owes its pin on every node it has judged, of which none carries one, so no node is ready to rule until the survey has run" is false at the graph commit under review. `grep -rl "  survey:" disposition/disposition-graph/ disposition/public/ | wc -l` returns 61, and `commons.systems/disposition-graph/frontier-consistency`'s own recommended text says "The survey of 2026-09-05 read the graph whole at graph commit 73e2a04f, and forty-five nodes carry its pin today." Validation 3 asks that every claim about the record be verified. Suggested edit: re-measure at the commit this draft is landed on, or strike the sentence, since the readiness rule it illustrates is stated in the answer already.
- `## Recommendation` fence, frontmatter `defines`: the two glosses another node at the ruling stage says this node writes are not written. `commons.systems/disposition-graph/how-a-fact-is-headed` recommends `glosses-written-with-this-ruling`, whose text reads "A gloss for `answer` and a gloss for `persistence` are written on\n`commons.systems/disposition-graph/dialogue`, the node that reserves the four\nnames and already glosses `existence`" and "There is no fallback, because\nthis ruling leaves no name without such an entry: it writes the two the record\nlacks." The fence's `defines` carries `answer` and `persistence` nowhere, glossed or bare; the option `dialogue-glosses-the-four-fact-names` holds the two drafted sentences and is not adopted. A ruling on `how-a-fact-is-headed` before one here would leave the most frequent heading on the alignment page linking to a node asking another question, which is the defect that answer exists to close. Suggested edit: adopt the two glosses into the fence's `defines`, or say on `how-a-fact-is-headed` that its answer waits on this one.
- `## Recommendation` fence, the derived paragraph: the pin rule does not account for the resolution chain the same answer introduces. It says "So adding an option, marking one passed, recording the author's reason for a ruling, or writing a subsection under an option nothing recommends moves no pin", while the answer above makes a recommended option's text "a named change to another option of the same fact, a line naming that option followed by a fenced `diff` block of unified-diff hunks against that option's resolved content". This node's own recommendation is exactly that: `the-survey-block-carries-what-the-next-survey-selects-on` resolves against `an-option-carries-its-content-its-words-and-its-case`. So editing the base option -- an option nothing recommends -- changes the recommended option's resolved content and moves the pin, which the sentence says it does not. Suggested edit: say that a fact's pin covers the recommended option's resolved content and therefore every option in its resolution chain, and that an edit to a base option stales the pins of the options resolved through it.
- `## Recommendation` fence, the option paragraph, against the reading this node adopts: one fact is written in two places. The fence says "an entry of the author's words is retained on a node only where an option of that node supports it or diverges from it, an entry no option carries staying in the ledger unreferenced and on no node", which is `commons.systems/disposition-graph/quotes`' recommended answer restated -- "An entry is retained on a node only where an option of that node supports it or diverges from it, which is the roll-up rule this answer once owed and could not state, given by the author's words of 2026-09-07." and "an entry no option anywhere references stays in the ledger unreferenced, addressable by a later sitting rather than dropped." Two sentences later the same paragraph does the opposite for viability: "What viability is, and whether a candidate ever leaves the list, is the viable-options node's question, whose terms this answer uses and does not restate." `codd-update-anomaly`, a reading this node's recommended option adopts, is the rule against exactly this, and the node's `depends` already names `quotes#words-in-a-ledger-on-the-ref`. Suggested edit: keep the reference rule here and cite `quotes` for retention, as the answer already cites `viable-options` for viability.
- Validation 15, merge, two findings on other nodes. First, `commons.systems/disposition-graph/node` asks "What is a node?" and its answer stands as "One question and its standing answer... The rationale says why, and which alternatives were rejected.", while this draft answers the same question in "A node file is its frontmatter, its `## Facts` and its `## Account`." and "There is no `## Recommendation` section, no `## Answer` section, no `## Rationale` section and no `## Disposition` section." That is a new answer to a question the record already asks, carried inside another node's answer: record it as an option on `node`, source `commons.systems/disposition-graph/dialogue`, ref 2026-09-07, named `a-node-file-is-frontmatter-facts-and-account`, whose prose says the node's sections go and its answer becomes the resolved content of the confirmed or recommended option, so `node`'s ruler meets the change to what a node is. Second, this draft states a membership rule for an option list -- "An option must be recorded when the author's words support it or diverge from it, when a tradition supports it or diverges from it, or when the AI weighed it for any reason, its own assessment of viability included" -- immediately before saying that "whether a candidate ever leaves the list, is the viable-options node's question". Record it as an option on `viable-options`, source `commons.systems/disposition-graph/dialogue`, ref 2026-09-07, named `every-weighed-candidate-must-be-recorded`, carrying that sentence from the author's words of 2026-09-07, so the two rules of one list are ruled on one node.
- Frontmatter, `probes`: the node stands at `stage: review` carrying three open probes, which is the cap, and the first is stale and answered. `option-text-per-node-or-per-option` asks whether "one text held per node or one text per option", and its `discharges` reads "whether the `## Recommendation` fence holds one text or a text per option, and therefore what the reader, the validator and both projections must accept. It moves the answer fact's recommendation `every-part-in-the-record`, whose fence states the one-text rule in terms." -- naming a recommendation the node no longer carries and a fence the recommendation abolishes. The author answered it on 2026-09-07 in words `## Disposition` already carries: "each option for each fact is recorded with its actual fact content so that when the author selects an option via the alignment artifact the context pane is dynamically updated to preview the node that is being confirmed." Suggested edit: discharge that probe with `status: discharged` and that quotation as its `reason`, per `author-questions`' two discharge reasons. Note also that under `author-questions`' recommended answer, "a probe recorded on a node at the review or the ruling stage returns that node to the maieutic stage", so the node's stage and its open probes disagree today; this reading raises no probe of its own, the cap being full.
- `## Facts`, `### authority`: the reason and the case against both rest on a premise this recommendation destroys. The reason reads "Deferred is the honest second\nchoice and is why it is on the fact: the record is already written to this\nencoding, so a deferral would change nothing today", and the fact's `against` reads "Every node in the record is already written to this encoding under a bootstrap grant, so a ratification here ratifies a migration the AI performed rather than a design the author chose against a standing rival". Neither is true of what is now recommended: no node in the record carries an option's content, a ledger reference, a derived confirmed label, or a six-key survey block, and every node still carries the `## Answer`, `## Rationale` and `## Disposition` sections this answer removes. The recommended class may well still be ratified, but the argument for it now runs the other way -- the ruling orders a migration rather than blessing one -- and the author should read the argument that actually applies. Suggested edit: redraft the `### authority` reason and the `against` against the recommended option, and say what a ruling here sets in motion across the record.

On the facts and what they recommend: Two facts, both required and both present; no existence or persistence fact is owed, since no prune is proposed and the recommendation changes no shim and no evidence. The answer fact recommends `the-survey-block-carries-what-the-next-survey-selects-on`, a listed option, `stands` names `facts-carry-options`, and a `## Recommendation` fence is correctly present and carries none of the dialogue's own keys; but the fact's reason prose and its `against` both argue `every-part-in-the-record`, the option recommended two moves ago, and the fence's `## Rationale` argues that option too, so three of the four things a pin covers describe a recommendation the node no longer makes and boldness `moderate` was set for that other option. The authority fact recommends `ratified` at boldness `low` on a reading that applies the class-recommendation test, which is right on its face, but its stated reason and its `against` both assert that the record is already written to this encoding, which the recommendation makes false.

On the viability of the options: Every option listed is viable on its facts and none is dominated without saying so, with one class of exception: three options the recommendation has absorbed carry no status and none of the "Adopted into `every-part-in-the-record` ... A ruling for this option alone adopts ..." paragraph the five earlier absorbed clauses each carry -- `survey-pin-carries-its-commit`, whose `commit` key the recommendation now carries; `standing-option-carries-a-subsection`, which the recommendation adopts in "Every option has a subsection, the one the author last confirmed included"; and `an-unconfirmed-nodes-draft-shape`, whose question, which of two shapes a draft takes, the recommendation dissolves by abolishing both `## Answer` and the fence. A viable option is missing and the author will not otherwise get to rule on it: that the node file keeps a generated `## Answer` and `## Disposition`, derived from the confirmed or recommended option's resolved content and from the ledger entries its options reference, hand-edited never, so that every clause of the author's refinement of 2026-09-07 is met and a node file still says what it answers without a resolver. Its prose: "The per-option content, the ledger and the derived confirmed label stand as recommended, and the node file additionally carries `## Answer` and `## Disposition` as generated sections, rendered from the resolved content of the confirmed option, or of the recommended option where none is confirmed, and from the ledger entries the options reference in date order. They are projections inside the file, never a second home for the fact: the validator regenerates them and refuses a file whose generated sections differ from what it derives. The author's condition of 2026-09-07, that the named-change form is acceptable as long as the exact node preview can be mechanically derived, is met by the derivation; what this option adds is that the derivation is run into the file rather than only into the page, so that the record stays readable by the reader it exists for."

Strongest counter-argument (strong): This answer takes every surface on which the author checks the AI and makes it something the AI derives. The node file stops holding the answer in prose, the author's own words leave the file for a ledger reached by `supports` and `diverges` references the AI writes, and a rival option's text becomes unified-diff hunks resolved against another option's text, so that reading what a node says at all requires an instrument that does not exist in `packages/disposition` today. The option's own recorded divergence concedes the sharp end of it -- "A `supports` or `diverges` reference is a claim about the author's words that the AI writes, and one filed on the wrong side misrepresents the author to the author on the surface where they rule" -- and the `single-subject-rule` reading under this node says the rest: the composition now puts the standing encoding, five clauses, the per-option content, the ledger, the section removal and a six-key survey block into one row, and the party that chose which decisions travel together is the party the ruling exists to check. That is capture-shaped in this record's own sense, which is the ground on which the authority fact escalates to ratified, and it is an argument for ruling the parts rather than the bundle. The reply the record can make is that each part is separately on the fact and that the author's words of 2026-09-07 name most of them; the reply it cannot make is that the whole is what the author examined, because the section removal and the survey block are the AI's and the fact's own `against` no longer even describes what it is against.

The session's reply: Validated on the main thread: the amendment of b95923d7 applied eight quoted pairs to the recommended text and left every other sentence that presupposed the four sections, so the fence contradicted itself, the fact's reason named the option the recommendation had moved from, and the rationale argued it. Repaired in the commit that follows this reading: the fence's answer rewritten wherever it presupposed `## Answer`, `## Recommendation`, `## Rationale` or `## Disposition`, the fact's reason and the rationale written for the option recommended, the three false claims about what the reader holds corrected against `read.mjs` at the implementation commit named, the survey-pin count struck, and the `depends` prose brought to the entries. On the counter-argument: the surfaces move, and the record's answer is that every derivation is mechanical and checked, the resolution by a strict applier, the reference by a validator that resolves it, and the label by the rulings; what the author checks is unchanged, the words verbatim and the node under any option, and the case against on the fact now says exactly this.


### Repaired after the reading of 93644144, 2026-09-07

The clean-context reading of 2026-09-07 kicked the node back with fifteen findings and a strong counter-argument, that the recommended option bundles what the author examined with what they did not. Every finding is repaired here, and the counter-argument is now the answer fact's own case against. The fence is rewritten whole to the option the fact recommends: no sentence presupposes the four sections, the recording rule is stated here and retention cited to `quotes`, the `####` order is fixed and checkable, the draft block carries six keys with four required, the validator paragraph agrees with the subsection rule and names what the instrument holds and owes at implementation commit `feaaac1b`, the pin covers the option list and the recommended option's resolved content and leaves the accumulations, the reasons and both cases against outside, and every count is measured at graph commit `93644144`. The `### answer` reason is rewritten to open on the recommended option and re-derives its boldness; the `### authority` reason and both cases against are rewritten off the premise that the record is already written to this encoding, which it is not: a ruling here orders the migration the grant of 2026-09-07 will carry out. The three absorbed options and `commit-in-the-review-block`, which is adopted, carry the absorption paragraph the five earlier clauses carry. The probe `option-text-per-node-or-per-option` is discharged on the author's words of 2026-09-07. Two glosses `how-a-fact-is-headed` says this node writes, `answer` and `persistence`, are written into `defines`, in the fence and in the node's own frontmatter, since the projections read a gloss from the defining node as it stands; and a third, `confirmed`, is written with them by a decision the design unit flagged rather than made: the term is load-bearing in the answer, it is the author's own word for the label, and a term glossed nowhere is a finding the next reading returns. The recommended option's sentence names the sixth survey key `pairs`, each with the key it was drawn on, where it had said `keys`, so that the option and its content name one thing; `survey-selection`'s sentence that the block carries the keys the pairs were drawn on is satisfied by it. The reading's own viable option, generated `## Answer` and `## Disposition` sections checked against their derivation, is recorded as `generated-answer-and-disposition-sections` and passed over, under the recording rule the answer states. The option `a-node-file-is-facts-and-account` on `node` was recorded on 2026-09-07 at `d35b0014`; the option `every-weighed-candidate-must-be-recorded` on `viable-options` is recorded with that node's own repair. `depends` keeps its three entries, and `survey-selection` is not entered though the recommended option came from it, because that node's own `depends` names this option and the pair would close a loop; the dependence is recorded on that side alone. The node returns to the review stage, its reading owed on the amendment.

### Clean-context re-reading, 2026-09-07, of 6097ca9b

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `the-survey-block-carries-what-the-next-survey-selects-on`.

Findings:

- `## Recommendation` fence, `## Rationale`, the traditions paragraph: the rewritten paragraph now claims the single-subject-rule divergence is against the current recommendation, not the superseded one it was originally read against. It reads: "One tradition diverges, and it is the case against this recommendation rather than a decoration on it: single-subject-rule holds that a measure carrying several subjects lets the party that drafted the bundle decide what travels with what, and the option this fact recommends composes the encoding in force, five clauses folded into it before this sitting, the per-option content, the ledger, the removal of four sections and a survey block of six keys." But the record's own reading data has not moved with the prose: the option this fact recommends, `the-survey-block-carries-what-the-next-survey-selects-on`, lists "Readings bearing on it: commons.systems/disposition-graph/tolerated-inconsistency (adopted), commons.systems/disposition-graph/verifying-traces-and-early-cutoff (adopted)" -- no single-subject-rule. The `(diverged)` relation is still recorded only on the superseded option, `every-part-in-the-record`: "Readings bearing on it: commons.systems/disposition-graph/chenery-reasoned-decision (adopted), commons.systems/disposition-graph/codd-update-anomaly (adopted), commons.systems/disposition-graph/madr-decision-records (adopted), commons.systems/disposition-graph/single-subject-rule (diverged)". This is the same shape of defect the last reading kicked back for -- prose describing a tradition's relation to "the option this fact recommends" that the graph's own bears data does not support for that option. Before this amendment the paragraph said the tradition "diverges from this answer" where "this answer" still named the option it was actually recorded against, so the mismatch is newly introduced by this rewrite and not carried over from the last reading's text. Suggested edit: either restate the paragraph to say the tradition was read as diverging from `every-part-in-the-record` and that its objection now falls on what absorbed that option, without claiming the `bears` entry itself points at the current recommendation, or move the reading's `bears` entry on `single-subject-rule` (a node outside this diff) to name `the-survey-block-carries-what-the-next-survey-selects-on` so the prose and the data agree.
- Account, `### Repaired after the reading of 93644144, 2026-09-07`: two claims about edits to other nodes cannot be checked from what this re-reading was given. It states "The option `a-node-file-is-facts-and-account` on `node` was recorded on 2026-09-07 at `d35b0014`; the option `every-weighed-candidate-must-be-recorded` on `viable-options` is recorded with that node's own repair." This delta reading was given only this node's file and the diff of it, not `node` or `viable-options`, so whether those two options actually landed as claimed is unverified here. Not a reason to kick back on its own, but worth the survey's or the next full reading's check before the node is treated as having discharged validation 15's two merge findings.

On the facts and what they recommend: The diff rewrites the `answer` fact's reason and `against` to argue the option actually recommended (`the-survey-block-carries-what-the-next-survey-selects-on`) instead of the superseded `every-part-in-the-record`, rewrites the `authority` fact's reason and `against` off the correct premise that the migration is prospective rather than already written, drops `viable-options` from `depends` (closing the loop the prose already claimed was closed), adds the `answer`, `persistence` and `confirmed` glosses to `defines`, and discharges the stale probe. `stands` is unchanged at `facts-carry-options`, and the fence still carries no facts of its own.

On the viability of the options: The three options the recommendation absorbs without adopting whole (`survey-pin-carries-its-commit`, `standing-option-carries-a-subsection`, `an-unconfirmed-nodes-draft-shape`) and the newly-adopted `commit-in-the-review-block` now each carry the 'Adopted/Absorbed into ... a ruling for this option alone ...' paragraph the last reading found missing, and the previously-missing viable option (a generated, validator-checked `## Answer`/`## Disposition`) is now recorded as `generated-answer-and-disposition-sections` and passed over with a stated reason. Every option remains viable on its own terms.

Strongest counter-argument (moderate): The amendment repeats, in one narrow spot, the exact defect class the last reading kicked back for: its rewritten traditions paragraph asserts a tradition diverges from "the option this fact recommends," but the reading's own bears data still names only the superseded option, so a reader confirming the current recommendation would be shown an argument the record does not actually record against it. The rest of the fifteen findings are answered cleanly and no other new defect surfaced.

### Repaired after the re-reading of d4ab0283, 2026-09-07

The one finding: the rationale's traditions paragraph named `single-subject-rule` as the case against the option this fact recommends, and the reading's `bears` named only `every-part-in-the-record`, the option it was first read against and which the recommendation absorbed. The data is moved to the prose rather than the prose to the data, since the divergence is real against the recommendation and the author should meet it there: `single-subject-rule` now carries a second `bears` entry on `the-survey-block-carries-what-the-next-survey-selects-on`, diverged, and keeps the first. The second item, that the account's claims about options landed on `node` and `viable-options` were unverifiable in the delta's scope, was validated on the main thread: `a-node-file-is-facts-and-account` is on `node`'s answer fact and `every-weighed-candidate-must-be-recorded` on `viable-options`'s, both at `d4ab0283`. Nothing in the fence moved; the amendment is the reading's entry, and it owes a re-reading of that.

### Clean-context re-reading, 2026-09-07, of 6097ca9b (ii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-survey-block-carries-what-the-next-survey-selects-on`.

Findings:

- Account, `### Repaired after the re-reading of d4ab0283, 2026-09-07`: the claim "The second item, that the account's claims about options landed on `node` and `viable-options` were unverifiable in the delta's scope, was validated on the main thread: `a-node-file-is-facts-and-account` is on `node`'s answer fact and `every-weighed-candidate-must-be-recorded` on `viable-options`'s, both at `d4ab0283`" cannot be checked from what this delta re-reading was given (only this node's file and its diff, not `node.md` or `viable-options.md`). This is the same unverified-in-scope item the previous reading flagged (its finding on the same account paragraph's predecessor) and it is carried over rather than newly introduced; consistent with the previous reading's own treatment, it is not by itself a reason to kick back, but it remains worth the survey's or the next full reading's check before the node is treated as having discharged validation 15's two merge findings on `node` and `viable-options`.

On the facts and what they recommend: The diff to `dialogue.md` itself contains no change to any fact's `recommends`, `boldness`, `against`, or to `stands` (still `facts-carry-options`), and no change to the `## Recommendation` fence -- the account's own claim "Nothing in the fence moved" checks out against the diff shown. The diff only updates the `review` block (strength strong->moderate, `of`/`commit` repinned to the previous re-reading's read, and a rewritten `against` recording that re-reading's counter-argument) and appends two account sections: the previous re-reading's applied verdict/findings, and the new `### Repaired after the re-reading of d4ab0283` section describing the actual repair. The repair that closes the substantive finding -- a second `bears` entry for `single-subject-rule` on the recommended option -- was made on the reading node `single-subject-rule.md`, outside this diff, so it is invisible to `dialogue.md`'s own diff but visible in the node's current rendering.

On the viability of the options: No option's viability is touched by this diff; the option list, statuses, and passed-over reasons are unchanged from the last-read text. The rendering of the recommended option `the-survey-block-carries-what-the-next-survey-selects-on` now lists "Readings bearing on it: commons.systems/disposition-graph/single-subject-rule (diverged), commons.systems/disposition-graph/tolerated-inconsistency (adopted), commons.systems/disposition-graph/verifying-traces-and-early-cutoff (adopted)", and the superseded option `every-part-in-the-record` still separately lists `single-subject-rule (diverged)` among its own readings, so the traditions paragraph's claim that the divergence bears on "the option this fact recommends" is now supported by the graph's own `bears` data on both sides -- the prior mismatch (data naming only the superseded option) is resolved.

Strongest counter-argument (weak): The amendment's own account asserts, without evidence this delta reading can check, that the two edits it credits to `node` and `viable-options` (options `a-node-file-is-facts-and-account` and `every-weighed-candidate-must-be-recorded`) actually landed at commit `d4ab0283`. If either did not land as claimed, the record would still be short the two merge-finding discharges validation 15 raised, and nothing in this node's own file would show it. This is a residual, non-blocking gap rather than a defect the amendment introduces or fails to answer on its own object: the last reading treated the identical item as unverifiable-but-not-kickback-worthy, and the repair changes nothing about that status.

The session's reply: Validated on the main thread at graph commit d4ab0283, outside the delta's scope by design: `a-node-file-is-facts-and-account` is on `node`'s answer fact and `every-weighed-candidate-must-be-recorded` on `viable-options`'s, both in their facts and their option subsections, so validation 15's two merge findings are discharged where the account says they are.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/dialogue stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `facts-carry-options`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `the-survey-block-carries-what-the-next-survey-selects-on`; 26 `## Disposition` entries became the ledger entries words/2026-09-03/38, words/2026-09-03/39, words/2026-09-03/40, words/2026-09-03/41, words/2026-09-03/42, words/2026-09-03/43, words/2026-09-03/28, words/2026-09-03/44, words/2026-09-03/45, words/2026-09-03/29, words/2026-09-03/46, words/2026-09-03/47, words/2026-09-03/34, words/2026-09-03/48, words/2026-09-03/49, words/2026-09-03/50, words/2026-09-04/27, words/2026-09-04/28, words/2026-09-07/11, words/2026-09-07/12, words/2026-09-07/13, words/2026-09-07/2, words/2026-09-07/3, words/2026-09-07/4, words/2026-09-07/14, words/2026-09-07/15, referenced by 28 options the entry's own date names; and `stands` left the answer fact. The content of `aspects-are-nodes (at db23d5b1)`, `every-part-in-the-record (at c55c9ebb)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `alternatives-beside-facts`, `minimal-dialogue-state`, `freeze-standing-under-recommendation`, `depends-migration-named`, `depends-names-an-alternative`, `first-answer-is-not-an-amendment`, `caption-only`, `ranges-on-whole-node-alternatives`, `aspects-compose-the-answer`, `survey-pin-in-review`, `ruling-carries-the-reason`, `every-option-carries-its-sentence`, `authority-fact-on-every-node`, `edit-led-against-a-named-ground`, `state-as-prose-only`, `a-date-per-movement`, `a-draft-file-per-node`, `a-stored-diff`, `persistence-as-a-stored-fact`, `validator-refuses-a-changed-draft`, `status-field-for-pending-alternatives`, `alternatives-as-prose-in-the-account`, `a-node-per-alternative`, `account-carries-the-sitting-minutes`, `standing-option-carries-a-subsection`, `instrumentation-is-a-fact`, `commit-in-the-review-block`, `source-names-who-raised-it`, `probes-in-the-enumeration`, `dialogue-glosses-the-four-fact-names`, `an-unconfirmed-nodes-draft-shape`, `survey-pin-carries-its-commit`, `an-option-carries-its-content-its-words-and-its-case`, `generated-answer-and-disposition-sections`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `6097ca9b7c2e0da0fa2911fde88a1666a36d2f8f` is re-computed for the encoding as `9d6e470956601ff19c472045db38544dd2159098`; nothing it read changed.

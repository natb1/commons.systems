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
      topology or persistence fact only because its dialogue has not reached
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
  survey:
    date: 2026-09-07
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "8e4cfda6b2cc73dd81ec7cec283420d29d6fb608b865228de8e58a8cf232715d"
      answer: "e73307626b1a80c4edbd9c4eec72a4d58796560f4fbc91a766e374b69e4a35e7"
      options: "6d37e97997fa84a7bc1023d8f9ed8f575048c013e61fb92f4d750cd190b0ea38"
      rivals: "9daae666187b35a9788618a64198844f0809992bcd17ffca547d815500bbd058"
      words: "e74de05bfa0fc4b3fdf9414b2b01ee71db7fcfd42df934432bb674054d642a08"
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
        status: passed
        reason: superseded by `probes-are-a-part-that-outlives-the-dialogue`, which carries its first half and reverses its second -- it asked that the validator paragraph require a stage of `probes` as of every other part, which was right under the rule the author struck at `words/2026-09-08/32` and is false once a probe outlives the recording that removes the stage -- and its content was a migration stub carrying no amended enumeration
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
      - name: a-pin-covers-what-binds-the-node
        source: commons.systems/disposition-graph/survey-selection
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/1
      - name: probes-are-a-part-that-outlives-the-dialogue
        source: commons.systems/disposition-graph/author-questions
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/32
        diverges:
          - words/2026-09-08/36
      - name: an-option-accumulates-per-expert
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/36
    recommends: an-option-accumulates-per-expert
    boldness: moderate
    against: "It takes every surface on which the author checks the AI and makes it something the AI derives — the answer resolved through hunks against another option, the author's own words reached by `supports` and `diverges` references the AI files, the confirmed label computed — and it composes the encoding in force, five clauses folded into it earlier, the per-option content, the ledger, the removal of four sections and a six-key survey block into one row whose bundling the AI chose, so a confirmation confers together what the author examined and what they did not. And the pin it now defines leaves a rival recorded after a reading on the page at the ruling with no reader having set it against the record, and lets the AI move a pin by a status it writes while a rival it records moves nothing."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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

**`topology` and `persistence` stay conditional, and the asymmetry with
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
would change the node's shape, and `topology` with the choices keep and prune,
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
would change the node's shape, and `topology` with the choices keep and prune,
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Its question, its fields, its facts with their options, and its answer as it stands; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, the author's words stay as the quotes node decides, and the facts stay with their options, their recommendation, their readings and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. It has these parts, each holding only what cannot be re-derived.

One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.

`facts`, every decision on the node, as data, each with a `name`, its `options`, the one it `recommends` with the `boldness` of that recommendation, low, moderate, or high, how much of it rests on the AI's own knowledge against the record and the author's words, and, on the answer fact, `stands`, the option whose full text the answer section holds. Four names are reserved and no others are minted without a ruling here: `answer`, whose options are the candidate answers to this node's own question; `authority`, the class a ruling would confer, ratified, delegated, or deferred, which is why no recommendation carries a class of its own; `topology`, keep or prune, which is where a proposal to prune the node is recorded rather than as an option of a special shape that answers no question; and `persistence`, present only where the recommendation would change the node's shape, declaring or liquidating a shim or adding or dropping evidence, its options being those shapes, and otherwise derived from the shape and asking nothing. An option carries its `name`; on the answer fact its `source`, the author's words in the disposition, the AI, the clean-context review, or the instrument or node that raised it outside alignment, and its `ref`, the date of the words or of the review, the graph commit, or the instrument or node; and its `ruling` once the author has given one. An option is viable, and stays on the list, while nothing on the list dominates it on the record's criteria, in the AI's judgment; an option the AI no longer holds viable leaves the list, and the option that displaced it says why. `## Facts` holds one subsection per fact, in the same order, opening with the reason for its recommendation, and under the answer fact one subsection per option, in the same order, saying in prose what the option would answer and why it is on the table; the option that stands needs none, since its text is the answer. A recommendation may be recorded at any stage of the dialogue, as the author ruled on 2026-09-04, and is required from the review stage on, since a node cannot be reviewed without one; a recommendation withheld until a stage boundary is a recommendation held in a session, which the first requirement above forbids. The AI may add an option or move a recommendation in alignment, in reconciliation, and in the loop on itself, within the scope its class allows, as the authority, evaluation and work-loop nodes say.

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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
option that stands, 12 on topology and 4 on persistence. The exemptions have
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
option that stands, 12 on topology and 4 on persistence. The exemptions have
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
node states the conditionality of `topology`, which appears where a prune is
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Every node carrying a stage carries an answer fact and an authority fact. This
node states the conditionality of `topology`, which appears where a prune is
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

Its question, its fields, its facts with their options, and its answer as it stands; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, the author's words stay as the quotes node decides, and the facts stay with their options, their recommendation, their readings and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. It has these parts, each holding only what cannot be re-derived.

One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.

`facts`, every decision on the node, as data, each with a `name`, its `options`, the one it `recommends` with the `boldness` of that recommendation, low, moderate, or high, how much of it rests on the AI's own knowledge against the record and the author's words, and, on the answer fact, `stands`, the option whose full text the answer section holds. Four names are reserved and no others are minted without a ruling here: `answer`, whose options are the candidate answers to this node's own question; `authority`, the class a ruling would confer, ratified, delegated, or deferred, which is why no recommendation carries a class of its own; `topology`, keep or prune, which is where a proposal to prune the node is recorded rather than as an option of a special shape that answers no question; and `persistence`, present only where the recommendation would change the node's shape, declaring or liquidating a shim or adding or dropping evidence, its options being those shapes, and otherwise derived from the shape and asking nothing. An option carries its `name`; on the answer fact its `source`, the author's words in the disposition, the AI, the clean-context review, or the instrument or node that raised it outside alignment, and its `ref`, the date of the words or of the review, the graph commit, or the instrument or node; and its `ruling` once the author has given one. An option is viable, and stays on the list, while nothing on the list dominates it on the record's criteria, in the AI's judgment; an option the AI no longer holds viable leaves the list, and the option that displaced it says why. `## Facts` holds one subsection per fact, in the same order, opening with the reason for its recommendation, and under the answer fact one subsection per option, in the same order, saying in prose what the option would answer and why it is on the table; the option that stands needs none, since its text is the answer. A recommendation may be recorded at any stage of the dialogue, as the author ruled on 2026-09-04, and is required from the review stage on, since a node cannot be reviewed without one; a recommendation withheld until a stage boundary is a recommendation held in a session, which the first requirement above forbids. The AI may add an option or move a recommendation in alignment, in reconciliation, and in the loop on itself, within the scope its class allows, as the authority, evaluation and work-loop nodes say.

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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
what the fact decides. Three of the four are not written today. `topology` is
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
- `topology`: the fact that asks whether the node stays in the record, with the
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The recommended answer with a glossed `defines` entry for each of the four fact
names this node reserves, so that every fact name resolves to a sentence saying
what the fact decides. Three of the four are not written today. `topology` is
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
- `topology`: the fact that asks whether the node stays in the record, with the
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
---
## Answer

Its question, its fields, its facts with their options and the content each option carries, and its answer, which is the resolved content of the option labelled confirmed; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, and the facts stay with their options, their contents, their recommendation, their readings, the references to the author's words their options carry, and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. A fourth follows from those three and governs every part below: what a ruling or a projection needs is in the record, in one place, and none of it is supplied by a projection's own text, held in a buffer, or left to be inferred from the absence of a field. It has these parts, each holding only what cannot be re-derived.

One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.

`facts`, every decision on the node, as data, each with a `name`, its `options`, the one it `recommends` with the `boldness` of that recommendation, and `against`, the strongest case against that recommendation in one line and in the AI's own words. The recommendation is the judgment that weighs the support and the divergence recorded on each option, and the fact's own reason is where that weighing is written. No key names the option confirmed: confirmed is a label, the option on the fact the author last ruled with the response confirm, derived from the rulings as the class is derived from them, and written nowhere. The word standing is not used of an option: the author's words of 2026-09-07 make it one thing with confirmed and the record keeps the one name. Boldness is low, moderate, or high: how much of the recommendation rests on the AI's own knowledge against the record and the author's words, so that high boldness is low confidence, which is the direction the author gave the term on 2026-09-03 and the direction the growth node's option `boldness-reversed` brings that node's own definition to. Four names are reserved and no others are minted without a ruling here: `answer`, whose options are the candidate answers to this node's own question; `authority`, the class a ruling would confer, ratified, delegated, or deferred, which is why no recommendation carries a class of its own; `topology`, keep or prune, which is where a proposal to prune the node is recorded rather than as an option of a special shape that answers no question; and `persistence`, whose options are the shapes the node would keep, present only where the recommendation would change its shape and otherwise derived from the shape and asking nothing.

A node that carries facts at all carries the answer fact and the authority fact: the answer because the node's own question is what a dialogue on it is for, and the authority because a ruling on that fact is how delegated and deferred are conferred, so a node without it offers the author one exit where the record gives three. A node may carry no fact, and then it stands at the periagogic or the maieutic stage, where nothing has been proposed yet and a class would be conferred on nothing; from the review stage on there is a recommendation to read, so there are facts, and those two are among them. That `topology` and `persistence` are conditional where `authority` is not is a decision and not an accident of the encoding: every ruling decides a class, so the class is asked wherever a ruling can be given, while a prune and a change of shape are decided only where one is proposed, and a choice nobody has raised is not a candidate the record lists.

An option carries its `name`; on the answer fact its `source`, the author's words, the AI, the clean-context review, or the instrument or node that raised it outside alignment, and its `ref`, the date of the words or of the review, the graph commit, or the instrument or node; a `status`, which is `passed` and nothing else, with the `reason` it was passed over, wherever the AI holds it dominated on the record's criteria; its `supports` and its `diverges`, the entries of the author's words that bear each way on it, written as references into the ledger the quotes node keeps, an entry being referenced by any number of options on any number of nodes; and its `ruling` once the author has given one. An option must be recorded when the author's words support it or diverge from it, when a tradition supports it or diverges from it, or when the AI weighed it for any reason, its own assessment of viability included: the trigger is an act that leaves a trace, so an option the AI considered and rejected in its head is recordable by rule and not by conscience. Which entries of the author's words a node retains follows from those references and is the quotes node's rule, cited here and not restated, as what viability is and whether a candidate ever leaves the list are the viable-options node's, whose terms this answer uses.

An option on the answer fact is a candidate answer to this node's question, whole or a named change to another, so that a ruling for a change is a ruling for that text with that change. Every option of the answer fact carries its content, so that a projection can render the node as it would stand under any option the author selects, which is what the alignment page's context pane does. It carries it in one of two forms and no third: whole, as a fenced `markdown` block holding the node as it would stand under it, its frontmatter without the dialogue's own keys and without the facts, and its `## Answer`; or as a named change to another option of the same fact, a line naming that option followed by a fenced `diff` block of unified-diff hunks against that option's resolved content. A hunk carries an `@@ -l,s +l,s @@` header, context lines prefixed by one space, removals by `-` and additions by `+`, with three lines of context each side where the text allows; it is applied strictly, at the line its header names, every context and removal line matching byte for byte, with no fuzz and no offset search, so a hunk that does not apply exactly is an error of the record and is never re-anchored. The resolution is acyclic and a cycle is a finding, as it is in `depends`. Hunks are produced by diffing the two resolved texts and never written by hand. Every text is stored once: a ladder of options that each add a clause to the one above stores one text and the clauses, and the difference the prose used to assert is data the projections apply and the validator resolves.

Every option of every fact has that sentence, and the record holds it in one place for each kind of option. An option of the answer or the persistence fact has a `#### <option>` subsection under its fact in `## Facts`, carrying in this order and no other: its sentence, in prose, what it would answer; a paragraph led `**AI support.**` and a paragraph led `**AI divergence.**`, the AI's accumulated support for the option and its accumulated divergence from it, each kept whatever the fact recommends, so that the case for an option the AI declined is not written only by the act of declining it; and, on the answer fact, its content in one of the two forms above. Every option has a subsection, the one the author last confirmed included, since its content is an option's content like any other and no section stands outside the facts to hold it. What the traditions say of an option is not written there: it is the derived inverse of what the readings bear on, as the readings node has it, and the projections show it beside the other two accumulations, headed support or divergence like them. So an option carries three accumulations and no more, and each is stored once in the place that owns it: the AI's on the option, the traditions' on the reading's `bears` entries and projected from them, and the author's own in the ledger and projected through the option's `supports` and `diverges`. An option of the two facts whose options are the record's own vocabulary, `authority` and `topology`, has no subsection at all: its name is a term, and its sentence is the gloss on the node that defines the term. A gloss is the sentence a `defines` entry carries beside its term, written as the term and the gloss together, saying what the term means and so what confirming that choice would mean; it is written once, on the defining node, and read from there, ratified, delegated and deferred on the authority node and keep and prune here. No projection carries a sentence of its own for an option: a sentence that lives only in a projection is a rule no node projects, and the same sentence written again on every node that carries the fact would drift.

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
  - term: topology
    gloss: "Existence is the fact that asks whether the node stays in the record, with the choices keep and prune; it appears where a prune is proposed and replaces the prune alternative of the earlier encoding."
  - term: keep
    gloss: "Keep is the choice on the topology fact that the node stays in the record with its question and its answer."
  - term: prune
    gloss: "Prune is the choice on the topology fact that the node is removed from the record and its question retired; it is where a proposal to prune the node lives."
  - term: persistence
    gloss: "Persistence is the fact whose options are the shapes the node would keep, present only where the recommendation would change its shape, declaring or liquidating a shim or adding or dropping evidence, and otherwise derived from the shape and asking nothing."
  - term: confirmed
    gloss: "Confirmed is the label on the option of a fact that the author last ruled with the response confirm; it is derived from the rulings as the class is and stored nowhere, and it is the one name the record keeps for what the author's words of 2026-09-07 call standing."
---

## Answer

The node file keeps `## Answer` and `## Disposition` as generated sections, rendered from the confirmed or the recommended option's resolved content and from the ledger entries its options reference, the validator regenerating both and refusing a file whose generated sections differ from what it derives.
```

#### a-pin-covers-what-binds-the-node

Everything the recommendation says, with the pin narrowed to what binds the node: a fact's pin is its name, the option it recommends, that option's sentence, resolved content and references, and each option's name with its status where one is set, so that a rival recorded beside the recommendation moves no pin and the boldness of the mark is outside it: the sentences on what a pin covers amended in `the-survey-block-carries-what-the-next-survey-selects-on`.

**AI support.** The pin this answer defines is the one `deriveRecommendationHash` computes and the one a ruling, a draft review and the survey each write as `of`, and the survey-selection node's option `a-pin-moves-on-what-binds-the-node`, recorded on 2026-09-08 under the author's grant of that day (words/2026-09-08/1), narrows it there for a measured reason: under the pin as this answer had it, recording any option moved the hash, so six of the seven nodes the survey of 2026-09-07 judged were its own footprints, options its apply step had recorded. The same width put a ratified node back before the author as a proposal the moment a rival was recorded on it, which contradicts the authority node, where a proposal is a recommendation that moved from its confirmed choice and an option acts on nothing until the author rules. The pin is one hash read by two nodes, and a record in which survey-selection narrows it while this answer keeps it wide states two pins for one instrument; this option is the cross-reference that narrowing owes, recorded here so that the conflict is on the fact it bears on and not left to the instrument to arbitrate. What stays inside the pin is exactly what this answer's own reason for the references demands: the recommended option's `supports` and `diverges` are a claim about what the author said on the surface where the author rules, and those stay; a rival's are a claim about the rival.

**AI divergence.** This answer's own argument for the wide pin was that a pin covers "what the recommendation was chosen among", so that the author confirming an option confirms it against the rivals a reader saw, and the narrowing gives that up: a rival recorded after the reading is on the page at the ruling with no reader having set it against the record, and nothing in the pin says so. The narrowing also makes the pin depend on `status`, which the AI writes when it passes an option over, so the AI can move a node's pin by a status and cannot by a rival, an asymmetry the wide pin did not have. And the change is being recorded on this node from survey-selection's side, on that node's measurement and not on a reading of this one; the author may prefer to rule on the pin here, where it is defined, and to have survey-selection's rung follow.

**Content.**

From: the-survey-block-carries-what-the-next-survey-selects-on

```diff
@@ -64,6 +64,6 @@
 
 What the instrument holds of that at implementation commit `feaaac1b`, and what it is owed, named here so that the debt is reconciled and not discovered. It holds the two hard pieces: `packages/disposition/patch.mjs`, which parses hunks, applies them strictly with no fuzz and no offset search, and produces them by diffing two resolved texts; and `packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry, and reports the entries no option references. Neither is wired into the reader, and eight things are owed there. The option keys `content`, `supports` and `diverges`, where `OPTION_KEYS` is `name`, `source`, `ref`, `status`, `reason` and `ruling`. The survey block's `commit`, `text`, `findings` and `pairs`, where the survey keys are `date` and `of`. The resolution of an option's content and the cycle check over it, the reader refusing a cycle for `under` alone today. A `depends` entry that closes a loop, refused for `under` and not there. `stands` struck from the fact keys and the confirmed label derived in its place. The four section names struck from the section order, which still lists Disposition, Answer, Rationale and Recommendation. The answer fact and the fact's own reason required from the review stage on, beside the authority fact the reader already requires. And the `####` requirement inverted, since the reader today exempts the option `stands` names from carrying one. What the record owes beside the instrument, measured at graph commit `93644144` over its hundred and fifty nodes: a hundred and five options on answer facts carry no subsection, and every one of them is the option `stands` names, so the exemption and the debt are the same hundred and five; eighty-six facts recommend with no reason recorded, fifty-two of them at the review or the ruling stage; two hundred and four recommend with no case against, sixty-eight of them at those stages; a hundred and thirty-four node files carry a `## Answer` and a `## Rationale`, seventy-four a `## Disposition`, and forty-four a `## Recommendation` fence; and not one node carries a single ruling, so nothing anywhere in this record is confirmed today and every projection that shows a text in the confirmed place is showing the AI's draft.
 
-Everything else is derived: the class and the status, the confirmed label, the persistence where no fact carries it, the queue and its order, whether a recommendation has moved since its ruling and whether it has changed since either reading, the readings on each option, the sentence of every option, the resolved content of every option, the edit the projections show, and the counts. A pin covers what was recommended and what the recommendation was chosen among, and no more: a fact's pin is its name, the option it recommends and the boldness of that recommendation; each of its options' `name`, `source`, `ref`, `status` with the `reason` it was passed over, and `supports` and `diverges`; and the recommended option's own sentence and its resolved content. The review's pin is every fact's. Because the pin covers a resolved content and not a stored one, an edit to an option that another option's content is a named change against moves the pin of every fact whose recommendation resolves through it, and a base option nothing recommends is therefore not outside the pin the way its own subsection is. What is outside every pin is what accumulates: the AI's support and divergence on any option, the fact's own reason, the author's reason recorded with a ruling, the accounts, and both cases against. The AI's accumulation and the fact's reason are outside it because they grow at every sitting and are exactly what the fold and the accumulation touch, so a pin over them would stale every reviewed node on every sitting and would say that a recommendation had moved when only its argument had thickened. Both cases against are outside it for the reason each has: the fact's is the argument the recommendation had to beat and not part of what is recommended, so sharpening it should not send a reviewed node back; the review's is written by the apply step of the very review whose pin sits beside it, so a pin that covered it would stale itself the moment it was recorded. The references are inside it because a `supports` or a `diverges` is a claim about what the author said, filed by the AI, on the surface where the author rules, and the one thing a pin exists to guarantee is that what the author confirms is what a reader read.
+Everything else is derived: the class and the status, the confirmed label, the persistence where no fact carries it, the queue and its order, whether a recommendation has moved since its ruling and whether it has changed since either reading, the readings on each option, the sentence of every option, the resolved content of every option, the edit the projections show, and the counts. A pin covers what binds the node and no more: a fact's pin is its name, the option it recommends, that option's own sentence and its resolved content, the `supports` and `diverges` it references, and, of every option of the fact, its `name` paired with its `status` where one is set, a status being the record's own ruling that an option is out. The review's pin is every fact's. Because the pin covers a resolved content and not a stored one, an edit to an option that another option's content is a named change against moves the pin of every fact whose recommendation resolves through it, and a base option nothing recommends is therefore not outside the pin the way its own subsection is. A rival's body is not in it: an option recorded beside the recommendation, its sentence, its `source`, its `ref`, the reason it was passed over, its references and its content, moves no pin, whoever recorded it, a reading, a sitting or the survey's own apply step, so a survey no longer re-judges every node it wrote an option on; and the boldness of the mark is outside it too, being the AI's confidence in what is recommended and not the recommendation. What else is outside every pin is what accumulates: the AI's support and divergence on any option, the fact's own reason, the author's reason recorded with a ruling, the accounts, and both cases against. The AI's accumulation and the fact's reason are outside it because they grow at every sitting and are exactly what the fold and the accumulation touch, so a pin over them would stale every reviewed node on every sitting and would say that a recommendation had moved when only its argument had thickened. Both cases against are outside it for the reason each has: the fact's is the argument the recommendation had to beat and not part of what is recommended, so sharpening it should not send a reviewed node back; the review's is written by the apply step of the very review whose pin sits beside it, so a pin that covered it would stale itself the moment it was recorded. The recommended option's references are inside it because a `supports` or a `diverges` there is a claim about what the author said, filed by the AI, on the surface where the author rules, and the one thing a pin exists to guarantee is that what the author confirms is what a reader read; a rival's references are a claim about the rival and go with its body. The narrowing is the survey-selection node's, under its option `a-pin-moves-on-what-binds-the-node`, and this answer holds the same pin so that the two nodes that read it read one thing.
 
 The projections that show a node with a confirmed choice, the browser and the alignment page, show that choice first, marked confirmed, and beneath it the recommendation, the other options with their status, and, on every option, the three accumulations headed support or divergence; and they say that the confirmed choice keeps its authority until the author rules for another. Where no option carries a confirmed ruling nothing is confirmed, and a projection that puts an unconfirmed text in that place is showing the author the AI's draft where their own choice belongs.
```

#### probes-are-a-part-that-outlives-the-dialogue

The enumeration of the dialogue's parts gains `probes`, and the rule that every part is removed at the recording gains its one exception: the probes stay, because a probe the author has not answered is not dead when the node is confirmed, and its answer may still move a recommendation on a fact already ruled. With it the validator's stage rule gains the matching exception, so a node carrying probes carries a stage while a dialogue is live on it and carries none once the recording has removed the stage, and a confirmed node still carrying an open probe is read rather than refused. Sourced to `author-questions`, whose answer requires this amendment by name, and grounded in the author's words at `words/2026-09-08/32`.

**AI support.** This node enumerates the parts of the dialogue's state, and the
word `probes` does not occur once in the text this option amends, while
`author-questions`, which sits under this node, puts the field there in terms:
"In the dialogue state, as `probes`, one list on the node beside `stage`,
`review` and `depends`." So the encoding a session works from is composed from
two answers, and the fourth requirement this node sets on its own state, that
what a ruling or a projection needs is in the record in one place and none of it
is left to be inferred, is broken by this node against itself. The record has
caught the gap twice and put the repair where this node's ruler does not meet it:
the option `probes-in-the-enumeration`, raised by the second clean-context
reading of `author-questions` on 2026-09-05, and a sentence of `recording`'s
answer reconciling two nodes from a third. An amendment recorded on this fact is
what puts the change where the rule is, which is what `author-questions` asks for
when it names this node among the four amendments its answer requires; its
argument for the field and for its survival is made there and is not remade here.

What the author's words of 2026-09-08 require is more than a name added to a
list. At `words/2026-09-08/32` they are that "Probes persist after confirmation
and author may continue to answer which may result in a change of AI
recommendation on confirmed disposition fact." A part that survives the recording
is a part this node's fold does not describe: the fold names the stage, the
review, the dependencies and the account as going and the facts as staying, and a
part that stays while being none of the facts is not in the sentence at all. This
is why the older option will not serve. `probes-in-the-enumeration` was drafted
against the rule the author struck and says the validator "requires a stage of it
as it does of the others"; under the author's words that clause is now false, so
the enumeration cannot simply gain the name. It gains the name and the exception
in one act, which is the whole of what this option does.

The exception belongs in the reader's own rule because the rule it excepts is not
prose. It is materialized: `packages/disposition/read.mjs` refuses any node that
carries `probes` and no `stage`, on the message that `review`, `depends`,
`probes` and the account are parts of the dialogue and require a stage, under a
comment stating the very doctrine the author's words strike, that what the
recording removes is the stage, the review, the dependencies and the account. A
confirmed node carrying one open probe is exactly that node, so under the rule as
it stands the central promise of the author's words, that they may go on
answering after the confirmation, is a parse error. A reader told the exception in
the rule reads such a node; a reader left to infer it from a child's answer
rejects it, and the rejection is the reader's and not the record's. The parser
reads this node's rule and no other, which is the reason the exception is stated
here rather than left to be read together with `author-questions` as `recording`
today reads it.

**AI divergence.** The strongest objection is that this option answers a
classification question with an exception. What makes a part dialogue state on
this node is that the recording removes it: that is the reason the answer gives
for `depends` in terms, that it "is dialogue state and not one of those, because
it holds only while both questions are open and is removed with the rest of the
dialogue at the recording", and it is the test the reader implements. A field
written with the dialogue and not removed with it fails that test, and a rule
whose one criterion a member fails is not a rule with an exception but a rule
with a member in the wrong class. On that reading the honest repair is the one
`author-questions`' own divergence names and declines to take: probes were never
dialogue state, they belong among the parts a node keeps, and this node and
`recording` would be amended because the classification changed rather than
because one field was carved out. That repair leaves the parser one rule with no
exception in it; this option leaves it one rule with one exception, which is the
residue the record's greenfield lens says to redraw rather than patch.

The cost is not the exception but a rule left with no reason. Strike the removal
test and nothing states what makes a key dialogue state: `facts` is written with
the dialogue, survives the recording and is not dialogue state; `probes` would be
written with the dialogue, survive the recording and be dialogue state; and the
amended text does not say what separates them. It gestures at one thing, that the
other parts are dead when the ruling comes and a probe is not, but dead is a
judgment about what a part holds and not a property of the encoding, and no
instrument can read it. A later session asking whether some new key is dialogue
state is left, after this amendment, with no test to apply and a precedent for
adding a clause instead.

The exception is checkable, and only in the direction that removes a check. The
reader can stop refusing a node that carries `probes` and no `stage`, which is one
condition dropped from one line. Nothing then checks that a stage-less node's
probes are ones a recording left rather than ones a session wrote onto a confirmed
node outside any dialogue, and nothing checks that a probe surviving a recording is
ever seen again: the count rides the stage chip, the recording removes the stage,
and `author-questions` names that gap and hands it to `alignment-page` rather than
closing it. So this option writes into this node's validator paragraph a clause
whose whole effect on the instrument is subtraction, and the thing it protects, a
probe outliving the node's last display, is protected by nothing else.

Nothing in the graph contradicts the amendment, and the search is worth recording
because it is thin rather than because it is reassuring:
`unconfirmed-accumulation` already counts `probes` among what a node in dialogue
carries and folds none of them; `recording` carries the contradiction in the open
and is the fourth amendment `author-questions` names; `model`'s counter-argument
names `probes` as stored dialogue state and is untouched. What the search found
instead is a rival on this same fact. `probes-in-the-enumeration` stands here
already, sourced to `author-questions` at 2026-09-05, asking for half of this
change and the opposite of the other half. This option supersedes it and does not
dispose of it, and a reader may hold that a fact carrying two options for one
change, one of them written against a rule the author has struck, is the variance
in encoding the author's words of 2026-09-08 were about.

**Content.**

From: a-pin-covers-what-binds-the-node

```diff
@@ -28,7 +28,7 @@
 ---
 ## Answer
 
-Its question, its fields, its facts with their options and the content each option carries, and its answer, which is the resolved content of the option labelled confirmed; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, and the facts stay with their options, their contents, their recommendation, their readings, the references to the author's words their options carry, and the rulings the author gave, so that a later session meets what was considered and why before proposing it again. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. A fourth follows from those three and governs every part below: what a ruling or a projection needs is in the record, in one place, and none of it is supplied by a projection's own text, held in a buffer, or left to be inferred from the absence of a field. It has these parts, each holding only what cannot be re-derived.
+Its question, its fields, its facts with their options and the content each option carries, and its answer, which is the resolved content of the option labelled confirmed; and, while a dialogue is active on it, the dialogue state. A dialogue is active on every node of the alignment frontier: every node with no ruling, every deferred node, and every ratified node whose recommendation has moved since its ruling. The class is derived from the rulings on the facts, as the authority node says, and a confirmed choice of any class keeps its full authority while an option is pending beside it, until the author rules for another. At the recording the dialogue folds: the stage, the review, the dependencies and the account go, and the facts stay with their options, their contents, their recommendation, their readings, the references to the author's words their options carry, and the rulings the author gave, so that a later session meets what was considered and why before proposing it again; and the probes stay with them, alone among the parts of the dialogue's own state, because a probe the author has not answered is not dead when the node is confirmed and its answer may still move a recommendation on a fact already ruled. Three requirements fix what the state must be: it must survive the session that held it, so that a session which loses its context resumes every node from its stage; it must hold the author's intention against the account that accumulates around it, the requirement the fidelity node asks; and it must give the author, at the moment of ruling, the context to see how this question stands to the rest of the frontier, and, reading a node that already has an answer, whether options are pending on it and where each came from. A fourth follows from those three and governs every part below: what a ruling or a projection needs is in the record, in one place, and none of it is supplied by a projection's own text, held in a buffer, or left to be inferred from the absence of a field. It has these parts, each holding only what cannot be re-derived.
 
 One rule governs where a decision lives, and it is the node node's and not a new one. A decision the author is to rule on separately is a question, and a question is a node: "If a text answers two questions, it is two nodes." So a text carrying several such decisions is decomposed into children, not into an inner structure that would repeat inside the node what the node already is. The record already provides for the children of an open question, since "a reading, a refinement, or any other node may sit under an open question, and does not have to wait for the question to be answered", and it already makes the result legible, since "a node's ceiling is its nearest ratified ancestor", so a ratified child under an unruled parent is exactly a decision the author has confirmed inside a question they have not. What remains on the node itself are the decisions that are not questions under it but facts about its answer, and those are the `facts` below.
 
@@ -56,11 +56,13 @@
 
 `review`, the state of the two readings the clean-context review divides into, as that node's answer describes them. Of this draft: `verdict`, forward or kickback; `strength`, of the counter-argument, strong, moderate, weak, or none; `date`; `of`, the pin of the recommendation the reviewer read; `against`, the counter-argument it returned, which the projections show on the recommended option's row in place of the case the AI wrote there; and `commit`, the graph commit that reading read at, which names the tree the pin was taken from so that a re-reading can diff the text the last reading pinned against the node as it now stands. The first four are written together or not at all, and `against` and `commit` are optional beside them, a reading being complete without either and a reading taken before those fields existed carrying neither. Of the frontier: `survey`, its `date`; its `of`, the same pin; its `commit`, the graph commit the survey read at; its `text`, the hashes of the five sections the survey's validations read; its `findings`, the register of what the last survey left open on this node, each with the support it rests on and the condition on which it is discharged; and its `pairs`, the pairs that survey read which touch this node, each with the key it was drawn on; and no verdict, since a survey judges the frontier's consistency with itself and kicks back the nodes a finding names rather than forwarding one; it may stand alone on a node the survey judged before that node's draft review ran. Which five sections the hashes cover, what the register carries, and what a key is are the survey-selection node's, whose terms this answer uses and does not restate; what this answer fixes is that the block has somewhere to put them, since a survey that must walk history to find what it last read is a pin held outside the record. When each pin is written is the review's own step and the clean-context-review node's. A node reaches the ruling stage on a forward verdict; that both pins name the recommendation as it stands is the node's readiness, derived and shown by the projections, and no ruling is recorded while either reading is owed.
 
-`depends`, the open questions whose rulings this one waits on, as data: the ids of nodes still on the frontier whose rulings must come before this node's, or a node id and an option on its answer fact, written as the id and the option's name, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. It is also what carries coherence between decisions, within a subtree as between subtrees, so no separate exclusion field is minted. A dependency runs one way: entries that close a loop put each question behind the other and no order can place either, so a loop is a finding and one side of it is dropped. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed with the rest of the dialogue at the recording.
+`depends`, the open questions whose rulings this one waits on, as data: the ids of nodes still on the frontier whose rulings must come before this node's, or a node id and an option on its answer fact, written as the id and the option's name, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on. It is also what carries coherence between decisions, within a subtree as between subtrees, so no separate exclusion field is minted. A dependency runs one way: entries that close a loop put each question behind the other and no order can place either, so a loop is a finding and one side of it is dropped. The inverse, what this question feeds, is derived from it and never stored, as is the rest of the node's position in the frontier: rank, order, and the ancestry, which `under`, `after`, `order` and `cites` already carry as data for the answered graph. `depends` is dialogue state and not one of those, because it holds only while both questions are open and is removed at the recording with the stage, the review and the account.
 
+`probes`, the questions the AI needs the author to answer before it can recommend, as data: one list on the node, beside `stage`, `review` and `depends`. What a probe is, what an entry carries, the test that admits one, where it is collected and how it is discharged are the author-questions node's, whose terms this answer uses and does not restate; what this answer fixes is that the field is a part of the dialogue's state and stands among the parts, since a part enumerated on one node and not on the node that enumerates the parts is an encoding the reader must compose from two answers. It is the one part the recording does not remove. The others go because the ruling makes them dead, a stage with nothing left to stage, a review of a text already ruled on, a dependency already discharged; a probe is not dead when the node is confirmed, being a question the author has not answered, and its answer may still move a recommendation on a fact already ruled, which returns the node to the author by the machinery the authority node already has. So the fold above leaves the probes where they are and the validator below requires no stage of them, and the author-questions node carries the reason at length.
+
 `## Account`, the AI's account in prose: the evidence, the findings, the reasoning behind the recommendation of each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author. It is not a proposal and does not carry that name: a proposal is the state the authority node defines.
 
-The validator holds the parts together. A stage on every node no ruling grants, on every deferred node, and on every node whose recommendation has moved since its ruling, and every part of the dialogue, the review, the dependencies and the account, requiring one. From the review stage on, facts, with every fact recommending one of its own options, a boldness beside it, and the reason for that recommendation written in the fact's own `###` subsection; and the answer fact and the authority fact wherever a staged node carries facts. On the answer fact from the review stage on, every option carrying its content in one of the two forms, each whole content parsing as a node, answering the same question, and carrying none of the node's own keys nor a `## Facts` section, each named change naming an option of the same fact, the resolution acyclic and resolving through no name no option carries, every hunk applying exactly, and every `supports` and `diverges` reference resolving to an entry of the ledger that exists. The facts' names from the reserved four with the answer first, each option's name unique on its fact and a slug on the answer fact, an answer option carrying its source and its ref, the two vocabulary facts offering only their own vocabulary, a `status` that is `passed` with its `reason` on an option that is neither recommended nor ruled, at most one ruling per fact, and no key naming the confirmed option, that label being derived from the rulings and stored nowhere. The `## Facts` subsections matching the facts in name and order, with one `####` under a per-node fact for every option of that fact, the confirmed one included, and none at all under a vocabulary fact, each `####` carrying its sentence, then its `**AI support.**`, then its `**AI divergence.**`, then, on the answer fact, its content, in that order. The review's four required draft keys together or not at all, with `against` and `commit` optional beside them and the survey block standing alone. A forward verdict at the ruling stage. No `## Answer`, `## Recommendation`, `## Rationale` or `## Disposition` section on any node file. Every `depends` entry resolving to a node that still carries a stage, and to an option on its answer fact where one is named, with no entry that closes a loop. And every reading's `bears` entry resolving to a fact and an option of the node it names.
+The validator holds the parts together. A stage on every node no ruling grants, on every deferred node, and on every node whose recommendation has moved since its ruling, and every part of the dialogue but one, the review, the dependencies and the account, requiring one; the probes requiring none, being the part that outlives the recording, so that a node carrying them carries a stage while a dialogue is live on it and carries none once the recording has removed the stage, and a confirmed node still carrying an open probe is read rather than refused. From the review stage on, facts, with every fact recommending one of its own options, a boldness beside it, and the reason for that recommendation written in the fact's own `###` subsection; and the answer fact and the authority fact wherever a staged node carries facts. On the answer fact from the review stage on, every option carrying its content in one of the two forms, each whole content parsing as a node, answering the same question, and carrying none of the node's own keys nor a `## Facts` section, each named change naming an option of the same fact, the resolution acyclic and resolving through no name no option carries, every hunk applying exactly, and every `supports` and `diverges` reference resolving to an entry of the ledger that exists. The facts' names from the reserved four with the answer first, each option's name unique on its fact and a slug on the answer fact, an answer option carrying its source and its ref, the two vocabulary facts offering only their own vocabulary, a `status` that is `passed` with its `reason` on an option that is neither recommended nor ruled, at most one ruling per fact, and no key naming the confirmed option, that label being derived from the rulings and stored nowhere. The `## Facts` subsections matching the facts in name and order, with one `####` under a per-node fact for every option of that fact, the confirmed one included, and none at all under a vocabulary fact, each `####` carrying its sentence, then its `**AI support.**`, then its `**AI divergence.**`, then, on the answer fact, its content, in that order. The review's four required draft keys together or not at all, with `against` and `commit` optional beside them and the survey block standing alone. A forward verdict at the ruling stage. No `## Answer`, `## Recommendation`, `## Rationale` or `## Disposition` section on any node file. Every `depends` entry resolving to a node that still carries a stage, and to an option on its answer fact where one is named, with no entry that closes a loop. And every reading's `bears` entry resolving to a fact and an option of the node it names.
 
 What the instrument holds of that at implementation commit `feaaac1b`, and what it is owed, named here so that the debt is reconciled and not discovered. It holds the two hard pieces: `packages/disposition/patch.mjs`, which parses hunks, applies them strictly with no fuzz and no offset search, and produces them by diffing two resolved texts; and `packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry, and reports the entries no option references. Neither is wired into the reader, and eight things are owed there. The option keys `content`, `supports` and `diverges`, where `OPTION_KEYS` is `name`, `source`, `ref`, `status`, `reason` and `ruling`. The survey block's `commit`, `text`, `findings` and `pairs`, where the survey keys are `date` and `of`. The resolution of an option's content and the cycle check over it, the reader refusing a cycle for `under` alone today. A `depends` entry that closes a loop, refused for `under` and not there. `stands` struck from the fact keys and the confirmed label derived in its place. The four section names struck from the section order, which still lists Disposition, Answer, Rationale and Recommendation. The answer fact and the fact's own reason required from the review stage on, beside the authority fact the reader already requires. And the `####` requirement inverted, since the reader today exempts the option `stands` names from carrying one. What the record owes beside the instrument, measured at graph commit `93644144` over its hundred and fifty nodes: a hundred and five options on answer facts carry no subsection, and every one of them is the option `stands` names, so the exemption and the debt are the same hundred and five; eighty-six facts recommend with no reason recorded, fifty-two of them at the review or the ruling stage; two hundred and four recommend with no case against, sixty-eight of them at those stages; a hundred and thirty-four node files carry a `## Answer` and a `## Rationale`, seventy-four a `## Disposition`, and forty-four a `## Recommendation` fence; and not one node carries a single ruling, so nothing anywhere in this record is confirmed today and every projection that shows a text in the confirmed place is showing the AI's draft.
 
```
#### an-option-accumulates-per-expert

The recommendation with the accumulations counted per party rather than at three. An
option carries the author's accumulation, the traditions', and one for each expert
convened on its fact, each stored once in the place that owns it: an expert's on the
option, in the pair of paragraphs its identity heads, the traditions' projected from
the readings' `bears` entries, the author's projected from the ledger. Where no
expert has been convened the one pair is the main thread's own, which is the
encoding the record already carries.

**AI support.** It is the author's, at `words/2026-09-08/36`, whose third step has
each option record "accumulated support/divergence from each expert", and whose
fourth has an expert return its support and divergence per option. The clause it
amends is the author's own, at `words/2026-09-07/4`: "AI response is accumulated,
reference to tradition is accumulated, author response is concatenated quotation."
So this is the author amending the author, and the count of three was never a
finding of the AI's to defend. The amendment is also small where it looks large. The
rule the count expressed is not the count: it is one accumulation per party and one
place per accumulation, which is what keeps a projection from showing the same case
twice and a session from writing it twice. That rule is untouched, and what changes
is that the parties are enumerable at run time instead of fixed at three, so the
existing subsections stand unmodified as the one-party case.

**AI divergence.** It puts an unbounded number of paragraph pairs under a `####`
subsection, and the record has no bound on how many experts a fact may convene, so a
node's `## Facts` section grows with the sitting rather than with the question. The
existing encoding is a fixed shape a reader can hold; this one is a list whose
length the reader learns by reading it, and the node file is the thing the author
reads. Against it also stands that the identity heading a pair is a value from
another node's record, so the validator here can check the shape and not the name:
`expert-identity` owns what an identity is, and until that node is answered this
encoding can require a heading and cannot say what a valid one looks like. And the
support paragraph now carries two things, the accumulated case and the expert's
choice, where every other part of this encoding carries one; the choice is a
marking, `viable-options` says what markings an option carries, and a reader may
hold that it belongs beside the other markings rather than inside a paragraph of
prose. This option puts it in the prose because that is where the reason for the
choice already is, and records the objection rather than answering it.

**Content.**

From: probes-are-a-part-that-outlives-the-dialogue

```diff
@@ -40,7 +40,7 @@
 
 An option on the answer fact is a candidate answer to this node's question, whole or a named change to another, so that a ruling for a change is a ruling for that text with that change. Every option of the answer fact carries its content, so that a projection can render the node as it would stand under any option the author selects, which is what the alignment page's context pane does. It carries it in one of two forms and no third: whole, as a fenced `markdown` block holding the node as it would stand under it, its frontmatter without the dialogue's own keys and without the facts, and its `## Answer`; or as a named change to another option of the same fact, a line naming that option followed by a fenced `diff` block of unified-diff hunks against that option's resolved content. A hunk carries an `@@ -l,s +l,s @@` header, context lines prefixed by one space, removals by `-` and additions by `+`, with three lines of context each side where the text allows; it is applied strictly, at the line its header names, every context and removal line matching byte for byte, with no fuzz and no offset search, so a hunk that does not apply exactly is an error of the record and is never re-anchored. The resolution is acyclic and a cycle is a finding, as it is in `depends`. Hunks are produced by diffing the two resolved texts and never written by hand. Every text is stored once: a ladder of options that each add a clause to the one above stores one text and the clauses, and the difference the prose used to assert is data the projections apply and the validator resolves.
 
-Every option of every fact has that sentence, and the record holds it in one place for each kind of option. An option of the answer or the persistence fact has a `#### <option>` subsection under its fact in `## Facts`, carrying in this order and no other: its sentence, in prose, what it would answer; a paragraph led `**AI support.**` and a paragraph led `**AI divergence.**`, the AI's accumulated support for the option and its accumulated divergence from it, each kept whatever the fact recommends, so that the case for an option the AI declined is not written only by the act of declining it; and, on the answer fact, its content in one of the two forms above. Every option has a subsection, the one the author last confirmed included, since its content is an option's content like any other and no section stands outside the facts to hold it. What the traditions say of an option is not written there: it is the derived inverse of what the readings bear on, as the readings node has it, and the projections show it beside the other two accumulations, headed support or divergence like them. So an option carries three accumulations and no more, and each is stored once in the place that owns it: the AI's on the option, the traditions' on the reading's `bears` entries and projected from them, and the author's own in the ledger and projected through the option's `supports` and `diverges`. An option of the two facts whose options are the record's own vocabulary, `authority` and `topology`, has no subsection at all: its name is a term, and its sentence is the gloss on the node that defines the term. A gloss is the sentence a `defines` entry carries beside its term, written as the term and the gloss together, saying what the term means and so what confirming that choice would mean; it is written once, on the defining node, and read from there, ratified, delegated and deferred on the authority node and keep and prune here. No projection carries a sentence of its own for an option: a sentence that lives only in a projection is a rule no node projects, and the same sentence written again on every node that carries the fact would drift.
+Every option of every fact has that sentence, and the record holds it in one place for each kind of option. An option of the answer or the persistence fact has a `#### <option>` subsection under its fact in `## Facts`, carrying in this order and no other: its sentence, in prose, what it would answer; one pair of paragraphs for each party accumulating on the option, led `**<identity> support.**` and `**<identity> divergence.**` by that party's recorded identity, holding its accumulated support for the option and its accumulated divergence from it, and, where the party is an expert convened on the fact and the option is the one it chose, its choice stated in the support paragraph, each pair kept whatever the fact recommends, so that the case for an option a party declined is not written only by the act of declining it; where no expert has been convened the one pair is the main thread's own, led `**AI support.**` and `**AI divergence.**`, which is this encoding with one party and is why the record's existing subsections need no rewriting to stand under it; and, on the answer fact, its content in one of the two forms above. Every option has a subsection, the one the author last confirmed included, since its content is an option's content like any other and no section stands outside the facts to hold it. What the traditions say of an option is not written there: it is the derived inverse of what the readings bear on, as the readings node has it, and the projections show it beside the others, headed support or divergence like them. So an option carries the author's accumulation, the traditions', and one for each party that has accumulated on it, and each is stored once in the place that owns it: a party's on the option, in the pair of paragraphs its identity heads, the traditions' on the reading's `bears` entries and projected from them, and the author's own in the ledger and projected through the option's `supports` and `diverges`. The count is not fixed because the parties are not: the rule is one accumulation per party and one place per accumulation, and how many there are follows from how many experts the fact convened, which is the expert-identity node's record and not this one's. An option of the two facts whose options are the record's own vocabulary, `authority` and `topology`, has no subsection at all: its name is a term, and its sentence is the gloss on the node that defines the term. A gloss is the sentence a `defines` entry carries beside its term, written as the term and the gloss together, saying what the term means and so what confirming that choice would mean; it is written once, on the defining node, and read from there, ratified, delegated and deferred on the authority node and keep and prune here. No projection carries a sentence of its own for an option: a sentence that lives only in a projection is a rule no node projects, and the same sentence written again on every node that carries the fact would drift.
 
 `## Facts` holds one `###` subsection per fact, in the facts' order, opening with the reason the fact recommends what it does and the boldness of that recommendation, and the `####` subsections of that fact's options beneath it, in the options' order. A recommendation may be recorded at any stage of the dialogue, as the author ruled on 2026-09-04, and is required from the review stage on, since a node cannot be reviewed without one; a recommendation withheld until a stage boundary is a recommendation held in a session, which the first requirement above forbids. The AI may add an option or move a recommendation in alignment, in reconciliation, and in the loop on itself, within the scope its class allows, as the authority, evaluation and work-loop nodes say.
 
@@ -62,7 +62,7 @@
 
 `## Account`, the AI's account in prose: the evidence, the findings, the reasoning behind the recommendation of each fact, the review's findings and its counter-argument with the session's reply, and what is open for the author. It is not a proposal and does not carry that name: a proposal is the state the authority node defines.
 
-The validator holds the parts together. A stage on every node no ruling grants, on every deferred node, and on every node whose recommendation has moved since its ruling, and every part of the dialogue but one, the review, the dependencies and the account, requiring one; the probes requiring none, being the part that outlives the recording, so that a node carrying them carries a stage while a dialogue is live on it and carries none once the recording has removed the stage, and a confirmed node still carrying an open probe is read rather than refused. From the review stage on, facts, with every fact recommending one of its own options, a boldness beside it, and the reason for that recommendation written in the fact's own `###` subsection; and the answer fact and the authority fact wherever a staged node carries facts. On the answer fact from the review stage on, every option carrying its content in one of the two forms, each whole content parsing as a node, answering the same question, and carrying none of the node's own keys nor a `## Facts` section, each named change naming an option of the same fact, the resolution acyclic and resolving through no name no option carries, every hunk applying exactly, and every `supports` and `diverges` reference resolving to an entry of the ledger that exists. The facts' names from the reserved four with the answer first, each option's name unique on its fact and a slug on the answer fact, an answer option carrying its source and its ref, the two vocabulary facts offering only their own vocabulary, a `status` that is `passed` with its `reason` on an option that is neither recommended nor ruled, at most one ruling per fact, and no key naming the confirmed option, that label being derived from the rulings and stored nowhere. The `## Facts` subsections matching the facts in name and order, with one `####` under a per-node fact for every option of that fact, the confirmed one included, and none at all under a vocabulary fact, each `####` carrying its sentence, then its `**AI support.**`, then its `**AI divergence.**`, then, on the answer fact, its content, in that order. The review's four required draft keys together or not at all, with `against` and `commit` optional beside them and the survey block standing alone. A forward verdict at the ruling stage. No `## Answer`, `## Recommendation`, `## Rationale` or `## Disposition` section on any node file. Every `depends` entry resolving to a node that still carries a stage, and to an option on its answer fact where one is named, with no entry that closes a loop. And every reading's `bears` entry resolving to a fact and an option of the node it names.
+The validator holds the parts together. A stage on every node no ruling grants, on every deferred node, and on every node whose recommendation has moved since its ruling, and every part of the dialogue but one, the review, the dependencies and the account, requiring one; the probes requiring none, being the part that outlives the recording, so that a node carrying them carries a stage while a dialogue is live on it and carries none once the recording has removed the stage, and a confirmed node still carrying an open probe is read rather than refused. From the review stage on, facts, with every fact recommending one of its own options, a boldness beside it, and the reason for that recommendation written in the fact's own `###` subsection; and the answer fact and the authority fact wherever a staged node carries facts. On the answer fact from the review stage on, every option carrying its content in one of the two forms, each whole content parsing as a node, answering the same question, and carrying none of the node's own keys nor a `## Facts` section, each named change naming an option of the same fact, the resolution acyclic and resolving through no name no option carries, every hunk applying exactly, and every `supports` and `diverges` reference resolving to an entry of the ledger that exists. The facts' names from the reserved four with the answer first, each option's name unique on its fact and a slug on the answer fact, an answer option carrying its source and its ref, the two vocabulary facts offering only their own vocabulary, a `status` that is `passed` with its `reason` on an option that is neither recommended nor ruled, at most one ruling per fact, and no key naming the confirmed option, that label being derived from the rulings and stored nowhere. The `## Facts` subsections matching the facts in name and order, with one `####` under a per-node fact for every option of that fact, the confirmed one included, and none at all under a vocabulary fact, each `####` carrying its sentence, then its support and divergence paragraphs, one pair per party accumulating on the option and each pair headed by that party's recorded identity, then, on the answer fact, its content, in that order. The review's four required draft keys together or not at all, with `against` and `commit` optional beside them and the survey block standing alone. A forward verdict at the ruling stage. No `## Answer`, `## Recommendation`, `## Rationale` or `## Disposition` section on any node file. Every `depends` entry resolving to a node that still carries a stage, and to an option on its answer fact where one is named, with no entry that closes a loop. And every reading's `bears` entry resolving to a fact and an option of the node it names.
 
 What the instrument holds of that at implementation commit `feaaac1b`, and what it is owed, named here so that the debt is reconciled and not discovered. It holds the two hard pieces: `packages/disposition/patch.mjs`, which parses hunks, applies them strictly with no fuzz and no offset search, and produces them by diffing two resolved texts; and `packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry, and reports the entries no option references. Neither is wired into the reader, and eight things are owed there. The option keys `content`, `supports` and `diverges`, where `OPTION_KEYS` is `name`, `source`, `ref`, `status`, `reason` and `ruling`. The survey block's `commit`, `text`, `findings` and `pairs`, where the survey keys are `date` and `of`. The resolution of an option's content and the cycle check over it, the reader refusing a cycle for `under` alone today. A `depends` entry that closes a loop, refused for `under` and not there. `stands` struck from the fact keys and the confirmed label derived in its place. The four section names struck from the section order, which still lists Disposition, Answer, Rationale and Recommendation. The answer fact and the fact's own reason required from the review stage on, beside the authority fact the reader already requires. And the `####` requirement inverted, since the reader today exempts the option `stands` names from carrying one. What the record owes beside the instrument, measured at graph commit `93644144` over its hundred and fifty nodes: a hundred and five options on answer facts carry no subsection, and every one of them is the option `stands` names, so the exemption and the debt are the same hundred and five; eighty-six facts recommend with no reason recorded, fifty-two of them at the review or the ruling stage; two hundred and four recommend with no case against, sixty-eight of them at those stages; a hundred and thirty-four node files carry a `## Answer` and a `## Rationale`, seventy-four a `## Disposition`, and forty-four a `## Recommendation` fence; and not one node carries a single ruling, so nothing anywhere in this record is confirmed today and every projection that shows a text in the confirmed place is showing the AI's draft.
 
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

### Manifest

- Folded: Finding: the review pin does not cover the standing answer, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciled to the author's requirements, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recording of 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The author's second disposition, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Probe answered, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Maieutic closed, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciliation owed, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Reconciliation, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The grant discharged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Finding: a first answer is presented as an amendment, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The finding corrected in clean context, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The unit of a ruling: analysis and the data model, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: A recommendation may be recorded at any time, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The fence drafted, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The cascade taken through maieutic, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Recorded at the review stage, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The readings this sitting owed, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The scope test, 2026-09-04, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option from the review-cost node, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: A citation of madr-decision-records corrected, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The review skill names the fifth key, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Who prunes, 2026-09-06, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of e89627c6, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of 93644144, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 6097ca9b, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading of d4ab0283, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

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

### Frontier finding, 2026-09-07

Kind: placement.

Five judged nodes stand at the ruling stage on ground still at the maieutic stage without saying so, which the thirteenth validation forbids: "no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so". `tolerated-inconsistency` and `verifying-traces-and-early-cutoff` each bear on `commons.systems/disposition-graph/dialogue#answer#the-survey-block-carries-what-the-next-survey-selects-on (adopted)`; `unconfirmed-accumulation` depends on `commons.systems/disposition-graph/dialogue#an-option-carries-its-content-its-words-and-its-case`; `event-sourcing-with-snapshots` stands under `unconfirmed-accumulation` which does; and `madr-decision-records` stands under `dialogue` and depends on `viable-options`. The brief lists the ground as "commons.systems/disposition-graph/dialogue | unanswered | stage maieutic | rank 0.0017 | settles 31". The author would rule five nodes whose ground has no drafted answer.

Also named: commons.systems/disposition-graph/tolerated-inconsistency, commons.systems/disposition-graph/verifying-traces-and-early-cutoff, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/event-sourcing-with-snapshots, commons.systems/disposition-graph/unconfirmed-accumulation, commons.systems/disposition-graph/viable-options.

Proposed: No merge and no survivor: the placement is corrected by the record saying so. Either `dialogue` is advanced to the ruling stage before the five are put to the author, or each of the five states in its answer that it rests on a `dialogue` option still at the maieutic stage and what it would lose if that option moves. The ruling order is derived from the placement, as `alignment-order` requires, and is not recommended here in prose.

### Frontier finding, 2026-09-07

Kind: supersession.

dialogue's standing answer: 'The author\'s words are not a section of the node. They are entries of the ledger, verbatim and dated' and 'There is no `## Recommendation` section, no `## Answer` section, no `## Rationale` section and no `## Disposition` section.' Superseded texts still standing: frontier-consistency 'So the words under `## Disposition` are carried for every node, judged, reached or unreached'; author-questions 'the reason names their words, which are under `## Disposition` verbatim and dated as the checkpoint node requires and are never copied into the field'; probe-or-node 'the response is quoted under `## Disposition`, the recommendation moves' and 'any words of the author\'s on it move to the parent\'s `## Disposition`'; decomposition 'The questions refused fold back into the parent\'s `## Disposition`, where their words already are.'; transience 'the author\'s words, verbatim and dated, in a `## Disposition` section'. The migration the two dated clauses wait on has landed at least in part: the brief prints '`the-survey-skill-launches-a-selected-reading` (answer) supports words/2026-09-04/10' resolved to the author's text, and dialogue's account names '`packages/disposition/words.mjs`, which parses the ledger, resolves a reference to an entry', so recording's 'until it lands no instrument resolves a reference into one' and materialization's 'before that migration lands, a session reading this rule finds the enumeration\'s third term unmaterialized' are dated past.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/probe-or-node, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/transience.

Proposed: dialogue and quotes survive. The five nodes that place words under `## Disposition` are amended to say the words are ledger entries referenced from the option or probe they bear on; recording and materialization strike or date their 'until it lands' clauses once the applying session confirms the migration's extent; quotes' answer states the partial state if any node's words are still unmigrated.
### The vocabulary term renamed with its fact, 2026-09-08

This node names the terms an unanswered node carries, and its third term is now
`topology` rather than `existence`, following the fact whose glosses it holds.
`keep` and `prune` are unchanged and remain the reserved vocabulary of that
fact. What widened is what a name outside those two means: it is a placement
option, owning a subsection of its own as an answer option does, because a
reparent and a fold each name a destination that only the node can state.
`commons.systems/disposition-graph/graph-topology`'s recommended answer is where
that widening is decided and argued; this entry records that the term here
followed it, under the author's grant of 2026-09-08.

### The enumeration gains the part that outlives it, 2026-09-08

`probes-are-a-part-that-outlives-the-dialogue` is recorded on the answer fact and the recommendation moves to it, from
`a-pin-covers-what-binds-the-node`, whose whole substance it keeps: the option is a
named change against that one, two hunks, everything outside the changed spans
byte-identical, and the word `probe` occurring nowhere in the base and eight times in
the target. The unit verified `applyStrict(base, diff) === target` and then, separately,
that the option parses through the real reader when spliced in and resolves to the same
target. Boldness stays moderate.

The amendment is the one `author-questions` requires by name and is grounded where that
node is, in the author's words at `words/2026-09-08/32`. Three changes: the enumeration
gains `probes` as a part, delegating what a probe is, carries, admits and discharges to
`author-questions` and fixing only that it is a part and where it stands; the fold
sentence keeps every word and gains the clause that the probes stay with the node; and
the validator's stage rule gains the matching exception. One further repair was forced
and is named rather than folded in silently: `depends`' closing clause said it is
removed "with the rest of the dialogue" at the recording, which is a false universal
once one part is not removed, and it is the very phrase `author-questions` quotes, so it
is narrowed to name the parts that actually go.

The exception is load-bearing and not decorative, which the drafting established against
this record's own guess. `packages/disposition/read.mjs` computes whether a node carries
a dialogue from `review || depends || probes || Account` and refuses a stage-less node
that does, so a confirmed node with one open probe is a parse error today, under a
comment asserting the doctrine the author struck. The amendment falsifies materialized
implementation, and that is a reconciliation item on the implementation ref rather than
a thing this node can fix.

The strongest argument against is in the option's divergence and is not answered here.
The membership test for dialogue state on this node *is* removal at the recording; a
field that fails it is not an exception to the rule but a member in the wrong class, and
once the removal test is struck nothing states what makes a key dialogue state at all,
since `facts` is written with the dialogue, survives the recording, and is not dialogue
state. The honest alternative is to move probes out of dialogue state altogether. That
path is not taken here because it is `author-questions`' to take -- that node owns where
a probe lives -- and it has already recorded and declined it in its own divergence; a
child may not decide its parent's question by amending itself. The objection is
therefore inherited undischarged, and it is a reason to re-open `author-questions`' home
question rather than a defect of this option.

`probes-in-the-enumeration`, standing on this fact since 2026-09-05 and sourced to the
same node, is passed over rather than dropped. It asked for the enumeration change and
for the opposite of the validator change, requiring a stage of `probes` as of every other
part; that was right under the rule the author struck and is false once a probe outlives
the recording that removes the stage. Its content was a migration stub carrying no
amended enumeration, so nothing of it is lost. Two live options for one change on one
fact would be the variance in encoding the author's words of the same day were about.

### The accumulations counted per party, 2026-09-08

The recommended option says an option "carries three accumulations and no more".
`words/2026-09-08/36` has each option record "accumulated support/divergence from
each expert", so the clause is falsified in its own words and the divergence is
recorded on the option that carries it.

The divergence names `words/2026-09-07/4` as well, and the reference matters to how
the reader should take it. The count of three is the author's own enumeration from
that entry -- "AI response is accumulated, reference to tradition is accumulated,
author response is concatenated quotation" -- so this is the author amending the
author and not the record correcting a reading of them. The AI has nothing to defend
here and did not weigh a fourth accumulation and reject it; the count was
transcribed from the words and the words have moved.

`an-option-accumulates-per-expert` is what the answer would be with the count
replaced by the rule the count expressed. That rule is one accumulation per party
and one place per accumulation, and it is what keeps a projection from showing the
same case twice and a session from writing it twice; nothing in the amendment
touches it. What changes is the arity: the parties are enumerable when the sitting
runs rather than fixed when the encoding was written. The subsections the record
already carries stand as the one-party case, so nothing in the graph must be
rewritten for the option to be ruled.

Three things the amendment leaves open, recorded because the option cannot close
them from here. The heading is a party's recorded identity, and what an identity is
belongs to `expert-identity`, so the validator can require a heading and cannot yet
say what a valid one looks like. There is no bound on how many experts a fact may
convene, so a `####` subsection grows with the sitting; whether that wants a bound
is a question about how many experts a fact should have and not about this encoding.
And the expert's choice is carried in the support paragraph, which puts a marking
inside prose; `viable-options` carries the markings under
`an-option-carries-a-selection-per-party`, and where the choice is finally written
is a seam between the two nodes that a ruling on either will have to settle.

### The mark, and the correction that moved it, 2026-09-08

`words/2026-09-08/37` corrects the reading this sitting made of `words/2026-09-08/36`.
The sitting read the seven steps as an option emerging from the dialogue; the author
says they are "an option, but also current author choice", unconfirmed. Those are two
different marks and the record collapsed them, and the sentence stating the wrong one
was written into five node accounts before the correction arrived. It is struck above.

What follows from it here: the mark moves to `an-option-accumulates-per-expert`.
It moves rather than staying because that option is written as the standing recommendation with the accumulations counted per party rather than at three, and the standing recommendation's own clause on probes outliving the dialogue is carried into it unchanged -- so nothing the
incumbent held is dropped by the move, and the fact now shows the author their own
current choice rather than the AI's reading of the option beside it. Nothing acts on
the move: this node is unanswered, and on an unanswered node a moved recommendation is
dialogue and not an act, as `evaluation` says.

One clause of the moved-to option is already falsified by the entry that moved it. It says "Where no expert has been convened the one pair is the main thread's own", which makes the main thread a party to the accumulation; the same entry's P2 makes the main thread the *integrator* of the experts' choices and not one of them. The mark moves anyway, because the defect is one clause of an option whose shape the author has chosen, and the repair is an amendment to it rather than a reason to leave the mark on an option the author has passed. P2 also redefines this node's own defined term `recommendation`, which is a second amendment owed here and is not made in this sitting.

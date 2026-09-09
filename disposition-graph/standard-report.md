---
question: What does a sitting print when it stops?
stage: periagogic
probes:
  - id: does-the-report-reach-probes-on-nodes-the-sitting-did-not-sequence
    asks: >-
      Your words at `words/2026-09-09/2` have the sequencing report list, for each
      disposition the sitting sequenced, the probes open on that disposition. The
      standing answer said the report carries the probes standing against you, without
      that scope. Should a probe standing open on a node this sitting did not take up be
      printed at the stop, or does the report show only the sitting's own dispositions?
    fact: answer
    why: >-
      The two readings differ by most of the record. Forty-three probes stand open across
      the graph and forty-two of them target you, while a sitting touches a handful of
      nodes, so under the narrow reading the report at a stop shows a few questions and
      the rest are visible only on the alignment page and the frontier. The record cannot
      settle it from the words, because the entry's subject throughout is the sitting's
      own sequencing and its bound of ten probes is stated over that set, which reads as
      the narrow scope, while the standing option's sentence and the report this sitting
      printed on 2026-09-08 both take the wide one, and neither was withdrawn.
    discharges: >-
      Whether the answer's probe list is scoped to the sitting's dispositions or to the
      graph, and therefore whether the bound of ten is a bound on what the sitting did or
      on what the author is owed.
    source: ai
    raised: 2026-09-09
    target: author
    type: periagogic
    rank: 1
  - id: does-the-full-form-print-more-than-one-question
    asks: >-
      Your full form lists "disposition questions" and your short form lists "disposition
      question". A disposition is one standing answer to one question, so does the plural
      mean something the record does not hold, or is it the singular said loosely?
    fact: answer
    why: >-
      The model node's answer defines a disposition as one standing answer to one
      question written as a node, and no node carries a second question, so under the
      record as it stands the two forms print the same field and the plural has no
      referent. The record cannot tell whether that means the plural is loose or whether
      you intend a disposition that a sitting may hold as several questions at once,
      which would be a different object from a node and would reach the model node rather
      than this one.
    discharges: >-
      Whether the two forms of the report print the same field, and whether anything in
      the sitting's decomposition holds more than one question under one disposition id.
    source: ai
    raised: 2026-09-09
    target: author
    type: maieutic
    rank: 2
facts:
  - name: answer
    options:
      - name: a-standard-report-of-probes-sequencing-and-residue
        source: author
        ref: "2026-09-09"
        supports:
          - words/2026-09-08/25
          - words/2026-09-08/36
          - words/2026-09-08/38
          - words/2026-09-09/1
          - words/2026-09-09/2
    recommends: a-standard-report-of-probes-sequencing-and-residue
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
review:
  survey:
    date: 2026-09-09
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "0a358645b4118caa6f0df449aa0eb1538dac1d5e65a55da5a725abedf3bb52e3"
      answer: "de44a86eb7fab6de8697942b1cb611056158a352daf267d82e1eb77240513e42"
      options: "d0e9193b8638b6ec96e93e5e365bcd93d1c0540049adbe83189eefd364f0aabd"
      rivals: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      words: "67b5e78c4997094eb91a0b3d426bd45e397d659c5ce5a50f9244689b478588e7"
form: rule
under:
  - commons.systems/disposition-graph/turn-form
depends:
  - commons.systems/disposition-graph/author-questions
  - commons.systems/disposition-graph/alignment-order
  - commons.systems/disposition-graph/bootstrap-residue-staleness
---

## Facts

### answer

The recommendation is `a-standard-report-of-probes-sequencing-and-residue`, at low
boldness. Low because the option is the author's own, given twice -- at
`words/2026-09-08/25` and again as step 7 of `words/2026-09-08/36` -- and the AI adds
nothing to it but the placement; the content the option would carry is owed, which is
why this node stands at the periagogic stage.

The question exists because the record has a rule for the form of a turn and none for
the form of a stop. `turn-form` fixes what a turn addressed to the author may be: a
periagogic probe, a maieutic probe, a direction to the page, or an acknowledgement. A
sitting's closing report is none of those four cleanly. It carries probes, which is
the first two; it carries the sitting's alignment sequencing, which is neither a probe
nor a direction to a page; and it carries the reconciliation residue where there is
any, which is a report of work the sitting did not finish. Whether it is therefore a
fifth form or a rider on the existing four is the first thing this node's design owes,
and the author's words do not settle it.

Three parts, one of them conditional. The probes standing against the author, each
carrying the type `words/2026-09-08/36` gives it, periagogic or maieutic. The
sitting's alignment sequencing -- what it took up, in what order, and what state each
node was left in. And the reconciliation residue, where the sitting produced any.

The refinement of `words/2026-09-08/38` fixes the probe listing's form, and it is a
refinement of this option and not a rival to it: it says what a probe entry contains,
which the option already claimed to carry, and it contradicts nothing the option says.
The probe is shown in its own schema, its `asks`, its `why` and its `discharges`
separately, and not compressed into one line each. The words were given against a
report that had compressed them, so the disposition names a real loss and not a
preference of layout: a summary line states what a probe is about, and the author
answers the question the probe asks, which is the `asks` field and nothing else; and a
probe answered without its `why` and its `discharges` is answered without knowing what
turns on the answer, which is the whole of what the two fields exist to say. The three
fields are the record's own, from `author-questions`' probe encoding, so the form is a
projection of a structure the record already holds rather than a second one invented at
the stop.

The refinement of `words/2026-09-09/1` and `words/2026-09-09/2` divides the report in
two and fixes the sequencing report's form, and it is a refinement of the same option
for the same reason: each fixes the form of a part the option already carries and
neither contradicts anything in it. The parts the author had asked for as one report
are two reports, the alignment sequencing report first and the reconciliation residue
report after it, and the order has a reason the record already held, since at
`words/2026-09-08/38` the author asked for the reconciliation to run before the probes
were put so that the probes could be answered with its context in hand. The sequencing
report lists the sitting's dispositions in the sitting's own order, each with its id,
its question, a paraphrase of the author's inputs, and its open probes to the author in
rank order, and falls to a short form once ten probes have been printed. What sets the
order is `session-sequence`'s question and what assigns the rank is `author-questions`';
the content fence carries the form, and the account of 2026-09-09 records the readings
taken and the two questions put to the author.

The relation to `author-questions` is a constraint and not a conflict. That node's
recommended option puts the probes "in the maieutic session and not the alignment
page", which a report the sitting prints is consistent with; what this node adds is
that the probes are printed at the stop and not only when a movement reaches them,
and that they are printed with their type.

That the record has no node for this until now is itself evidence for the node. The
author stated the standard report on 2026-09-08 at `words/2026-09-08/25`, and the
sitting of that day put the text into the accounts of `session-state` and
`probe-response-treatment` without minting a question for it. Entry 36 restates it, so
the record now holds the same disposition twice in prose and nowhere as a question.
The failure is the one this node's own subject would catch: a sitting that reports what
it sequenced would have shown entry 25 unsequenced at the stop.

#### a-standard-report-of-probes-sequencing-and-residue

A sitting that stops prints a standard report, and a sitting that is both an alignment
sitting and a reconciliation sitting prints two of them, the alignment sequencing report
first and the reconciliation residue report second. The sequencing report lists each
disposition the sitting sequenced, in the sitting's own sequence order, and gives for
each its id, its question, a paraphrase of the author's inputs that decomposed into it,
and its open probes to the author in rank order, each probe in the probe's own schema
with its `asks`, its `why` and its `discharges` shown separately. After ten probes have
been printed the remaining dispositions fall to a short form carrying the id, the
question, the paraphrase, and the count of open probes that target the author. The
residue report follows where the sitting produced any residue.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is
owed.

**Content.**

```markdown
---
question: What does a sitting print when it stops?
form: rule
under:
  - commons.systems/disposition-graph/turn-form
---

## Answer

A sitting that stops prints a standard report. A sitting that is both an alignment
sitting and a reconciliation sitting prints two, the alignment sequencing report first
and the reconciliation residue report after it. The order is not presentation. The
sequencing report carries the questions the author is being asked and the residue report
carries the work the sitting did not finish, and the author's own reason for running the
reconciliation before the probes are put is that the probes are answerable only with the
reconciliation's context in hand, so the questions come first and what is unfinished comes
after them. A sitting that is only an alignment sitting prints the first report alone, and
a sitting that produced no residue says so rather than printing an empty second report.

The alignment sequencing report lists each disposition the sitting sequenced, in the
sitting's own sequence order and not in the frontier's, because a sitting may be given
more than one input and may be given some of them after it has started, and it orders
what it holds as it arrives. What sets that order is the question of `session-sequence`
and is not answered here. A disposition is a node, one standing answer to one question,
as the model node defines it, so a disposition's id is a node id and the report mints
nothing.

For each disposition the report prints four things. Its id. Its question. A paraphrase of
the author's inputs that decomposed into it, which is a paraphrase and not a quotation,
the words themselves being in the ledger and addressed from the options they support, so
that the author reading the report can see what the sitting took their words to be asking
without the report becoming a second copy of them. And each probe open on that disposition
that targets the author, in the disposition's probe rank order, each probe shown in the
probe's own schema with the question it asks, the reason it was raised, and what answering
it discharges given separately and not compressed into a summary. The rank is the one the
main thread assigned and recorded on the probe, which is the question of
`author-questions` and is not answered here.

The report is bounded by the probes it prints and not by the dispositions it lists. Once
ten probes have been printed in full, every remaining disposition falls to a short form of
four things: its id, its question, the paraphrase of the author's inputs that decomposed
into it, and the count of probes open on it that target the author. The bound falls at a
disposition and never inside one, so a disposition prints wholly in one form or wholly in
the other, and a disposition printed with some of its probes would be neither form. No
disposition the sitting sequenced falls off the report, and the author sees at the stop
both the questions being put now and the size of what is waiting behind them.

Where the sitting produced any reconciliation residue, the residue report follows.
```

### authority

The recommendation is `ratified`, at low boldness.

The reading `class-recommendation` calls for: the capture-shaped limb. The report is
the AI's account of its own sitting, and it is the surface through which the author
sees what the sitting did. What the report omits, the author does not see, and a
sitting that reports no residue is indistinguishable from a sitting that left none.
The party that would set the rule for what the report must carry is the party the
report exists to hold to account, which is the shape the limb names. The expensive
limb is touched and is not the ground: a thin report costs the author a question they
have to think to ask, which is real and is recoverable.

## Account

### Queued, 2026-09-08

Minted in the alignment sitting of 2026-09-08 under the grant at `words/2026-09-08/2`
as refined at `words/2026-09-08/22`, from the author's words at `words/2026-09-08/36`,
which were given while the sitting was in hand and are queued as `movements` and the
alignment skill's queue rule require. The entry answers more than one question, so the
sitting's first unit was the decomposition the queue rule calls for. That unit found
fifteen questions, of which twelve are already asked by an existing node, one is an
option on `probe-or-node`, and two are asked by nothing in the record. This is the
second of the two.

Placed under `turn-form` because that node owns what a turn addressed to the author is
allowed to be, and a report printed at a stop is a turn addressed to the author. The
placement is also what makes the open question askable: if the report is a fifth form,
it belongs in `turn-form`'s own answer, and this node's answer is then the content of
that form; if it is a rider on the four, this node stands and `turn-form` is untouched.
Placing it beneath rather than inside keeps both readings open, which a node written
into `turn-form`'s answer fact would not.

Its `depends` names three nodes. `author-questions`, because the probes the report
carries and the type it prints beside each are that node's encoding. `alignment-order`,
because the sequencing the report prints is the order that node fixes.
`bootstrap-residue-staleness`, because the residue the report carries is the object
that node is about, and because a report of stale residue is worse than no report.

The periagogic object is `turn-form` and its four forms; `author-questions` and its
seven probe fields; `alignment-order` and what it holds a sitting's order to be;
`bootstrap-residue-staleness` and `what-acts-during-bootstrap` on residue;
`session-state`, whose account already carries the text of `words/2026-09-08/25`; and
`probe-response-treatment`, whose account carries it too.

### Refined, 2026-09-08

The author's words at `words/2026-09-08/38`, given while this sitting was in hand and
in answer to the report the sitting had just printed: "when listing the ranking probes
for this sitting as part of the standard report, show the original schema for probe
including the question asked, the reason and what it discharges separately." Recorded
against the standing option rather than as a new one, because it fixes the form of a
part the option already carries and contradicts nothing in it; the option's `supports`
now names all three of the author's entries on this question.

The occasion is worth keeping. The sitting's report of that evening listed each ranking
probe as one summary sentence, folding `asks`, `why` and `discharges` together. The
author read it and could not answer the probes from it, which is what the third
paragraph of the same entry says: the words ask for the reconciliation to run first "so
that I can respond to the ranking probe's actual questions with the correct context".
So the defect this refinement corrects was measured on the instrument itself, in the
one way the record can measure it, by the author failing to be able to use the output.

### The type the report prints is not a field, 2026-09-08

Found when this node's refinement was first applied, in the report printed at the end of
the sitting that recorded it. The answer has the report carry each probe with its type,
periagogic or maieutic; the probe schema has no type field. Of the fifty-two probes
standing open at this sitting's landing, seven say their type in the prose of their `why`,
all seven on `expert-instructions`, and forty-five say nothing. So the type the report
prints is the AI's classification made at the moment of printing, checked against nothing
and not the same reading twice.

Recorded as the probe `does-a-probe-carry-its-own-type` on `author-questions`, which owns
the probe encoding and already carries the same shape of question about the missing
`target`. It is asked there and not here because the choice is between the schema gaining
a field, the type being derived from what the record holds, and this node's answer dropping
the requirement, and only the third of those is this node's.

### Refined, 2026-09-09

The author's words at `words/2026-09-09/1` and `words/2026-09-09/2`, given in one turn
after this sitting had stopped without printing anything. Both are recorded against the
standing option rather than as new ones, on the precedent this node set the day before:
each fixes the form of a part the option already carries and neither contradicts anything
in it. The option's `supports` now names five entries, and its `ref` moves to the date of
the newest of them, which is what `ref` has meant on the twelve options of this record
whose words span more than one date.

The first entry fixes two things and restates a third. It restates that a sitting which is
both an alignment sitting and a reconciliation sitting prints both parts, which
`words/2026-09-08/25` already said in terms, so nothing there is new. What is new is that
they are two reports and not two sections of one, which the standing content fence had as
"a standard report of three parts"; and that the two are ordered, the sequencing first and
the residue after. The reason for the order is not in the entry and is in the record: at
`words/2026-09-08/38` the author asked for the reconciliation to run before the ranking
probes were printed so as to answer them with the correct context. Read together the two
entries make one rule with one reason, and the answer states the reason rather than
leaving the order to look like a preference of layout.

The second entry fixes the sequencing report's shape, which the standing option carried
only as "what it took up and what state each node was left in". The four things printed
per disposition are the author's own, and so is the bound of ten probes with the short
form behind it. Three readings in the draft are the AI's and each is stated with its
reason. The disposition id is a node id, because the model node defines a disposition as
one standing answer to one question written as a node and the record addresses no other
kind of object, so nothing is minted for the report and the sitting's own decomposition
already yields the ids. The bound falls at a disposition and never inside one, because the
author's sentence takes the remaining dispositions as the unit and a disposition printed
with three of its six probes is neither of the two forms. And the paraphrase is a
paraphrase and stays one, the words being in the ledger already, so the report does not
become a second copy of them.

Two things the second entry leaves open are put to the author rather than settled. Its
full form says "disposition questions" and its short form says "disposition question", and
under the record's own definition a node is one question, so the plural is either generic
or a slip and the two forms print differently under the two readings. And the entry scopes
the probe list to the dispositions this sitting sequenced, where the standing option said
"the probes standing against the author" without that scope; on the graph as it stands
that is the difference between the forty-three probes open across it and the few on the
nodes a sitting touches. Both are recorded as probes on this node.

The rider of the second entry, that the disposition on local session state support this,
is recorded on `session-state`, whose standing option already holds that the store carries
the sitting's re-evaluated sequencing and which now says what of it the store holds. The
parenthesis of the same entry, on how a sitting orders the dispositions it decomposes, is
a question nothing in the record asked, and is minted as `session-sequence` beneath
`alignment-order`.

### The rule's first measured failure, 2026-09-09

The occasion of `words/2026-09-09/1` is kept for the same reason the occasion of
`words/2026-09-08/38` was kept. This sitting stopped on a `result:` line at graph commit
c956bb8d and implementation commit 919aace6, printing neither report, and the author
corrected it. So the rule this node states has now been measured twice on the instrument
itself, once by the author being unable to answer probes from the report that was printed
and once by no report being printed at all, and both times the measurement was the author
noticing rather than anything in the record catching it.

That is the node's own subject turned on itself and it is worth saying plainly. Nothing in
the record can tell that a sitting stopped without printing, because the record holds what
a sitting landed and not what it said at its stop. The report is the AI's account of its
own sitting, which is the capture-shaped reading this node's authority fact already
records, and a rule whose only detector is the author reading the output is a rule the
party it binds can fail silently. The answer is not amended for this, since no field on a
node could carry it; it is recorded so that the cost of the class the node recommends is
visible where the class is recommended.

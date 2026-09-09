---
question: What does a sitting print when it stops?
stage: periagogic
facts:
  - name: answer
    options:
      - name: a-standard-report-of-probes-sequencing-and-residue
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/25
          - words/2026-09-08/36
          - words/2026-09-08/38
    recommends: a-standard-report-of-probes-sequencing-and-residue
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
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

A sitting that stops prints a standard report. It carries the probes standing
against the author, each with its type, periagogic or maieutic, and each in the
probe's own schema, its `asks`, its `why` and its `discharges` shown separately; the
sitting's alignment sequencing, which is what it took up and what state each node was
left in; and, where the sitting produced any, its reconciliation residue.

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

A sitting that stops prints a standard report of three parts: the probes standing
against the author, each carrying its type, periagogic or maieutic, and each shown in
the probe's own schema, with the question it asks, the reason it was raised, and what
answering it discharges given separately and not compressed into a summary; the
sitting's alignment sequencing; and, where the sitting produced any, its
reconciliation residue.
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

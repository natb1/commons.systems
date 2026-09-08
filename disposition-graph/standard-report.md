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

A sitting that stops prints a standard report. It carries the probes standing against
the author, each with its type, periagogic or maieutic; the sitting's alignment
sequencing, which is what it took up and what state each node was left in; and, where
the sitting produced any, its reconciliation residue.

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
against the author, each carrying its type, periagogic or maieutic; the sitting's
alignment sequencing; and, where the sitting produced any, its reconciliation residue.
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

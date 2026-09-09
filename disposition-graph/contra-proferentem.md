---
question: What does construing an ambiguity against the party that framed it say about a grant whose terms are set in answer to the AI's own question, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-08"
    recommends: standing
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/deferring-on-a-probe
source: The rule that an ambiguity is resolved against the party who chose the words. Its Roman form is put in terms of the party who framed the question rather than the party who drafted a document, Digest 45.1.38.18 (Ulpian), in stipulationibus cum quaeritur quid actum sit, verba contra stipulatorem interpretanda sunt, since the stipulatio was concluded by a question and an answer and the stipulator was the questioner; Digest 34.5.26 puts the seller's side of it. Restatement (Second) of Contracts s 206 states the modern rule; it is made mandatory for consumer terms by Council Directive 93/13/EEC art. 5 and its national implementations. Locus to be checked, the two Digest passages in a modern edition and the Restatement comment on why the rule attaches to the drafter.
bears:
  - fact: answer
    option: the-choice-is-the-record-read-back
    relation: adopted
---

## Facts

### answer

One reading. It is the ground of the second half of the second change in
`the-choice-is-the-record-read-back`, and the Roman form of the rule is closer to
the record's case than the modern one, which is most of why the node exists.

#### standing

Supports reading a deferral's scope narrowly against the AI where the author's words admit two readings, on the ground that the AI framed the question the words answer.

**AI support.** Recorded in the tradition pass on the deferral mechanism, 2026-09-08. The modern rule attaches to the party that drafted the document, and on that form the fit is only partial, since the author writes the response and the AI does not. The Roman form attaches somewhere else. The stipulatio was concluded by a question and an answer, the stipulator asked and the promisor answered, and Ulpian's rule construes the words against the stipulator, the party who framed the question, on the reasoning that they controlled the form the exchange took and could have asked more precisely. That is the deferral exactly. The AI puts the probe; the author answers it, often briefly and in the probe's own terms; and the answer's scope is then read. The party that controlled how precise the question was is the AI, and the rule says the cost of an imprecise one falls on them.

The rule also supplies what the record's own structure otherwise lacks. `authority` already holds that a delegation covers the class of decision it names and no more, but a scope stated in one sentence in response to a probe will often admit more than one width, and nothing in the record said which width governs. Without a tie-break the widest reading is the AI's for the taking, which would make the second change in `the-choice-is-the-record-read-back` inert: making the response the binding scope means nothing if the bound party also picks the reading. This is the one clause in that option that cuts against its drafter at the moment of reading, and it is the reason the two halves of the change are recommended together rather than separately.

Its modern career is the second reason to take it. It began as a default about who bore the cost of imprecision, and in consumer contracts it hardened into a mandatory rule, applied whether or not the parties would have chosen it, because the imbalance it addresses is structural rather than accidental. The imbalance here is structural in the same way: the author responds to probes across a record too large to hold whole, and the AI drafts them.

**AI divergence.** The rule presumes a drafter who benefits from ambiguity and who could have removed it. The first half holds here. The second is doubtful in the case that matters most, because a probe whose subject the author has said they do not fully understand may be imprecise in ways no drafting could fix, and penalising the AI for an irreducible obscurity is not the rule the tradition states. The record applies it anyway, on the ground that a bound applied slightly too often is the safe direction to be wrong in when the party applying it is the party it binds.

There is also a real cost the tradition itself notices in the consumer setting, where mandatory contra proferentem is argued to push drafters toward text that is defensively narrow rather than clear. The analogue would be probes drafted to be safely narrow rather than to reach the question, and this reading records the risk without a remedy for it.

**Content.**

```markdown
---
question: What does construing an ambiguity against the party that framed it say about a grant whose terms are set in answer to the AI's own question, and what does the record take from it?
form: reading
under:
  - commons.systems/disposition-graph/deferring-on-a-probe
source: The rule that an ambiguity is resolved against the party who chose the words. Its Roman form is put in terms of the party who framed the question rather than the party who drafted a document, Digest 45.1.38.18 (Ulpian), in stipulationibus cum quaeritur quid actum sit, verba contra stipulatorem interpretanda sunt, since the stipulatio was concluded by a question and an answer and the stipulator was the questioner; Digest 34.5.26 puts the seller's side of it. Restatement (Second) of Contracts s 206 states the modern rule; it is made mandatory for consumer terms by Council Directive 93/13/EEC art. 5 and its national implementations. Locus to be checked, the two Digest passages in a modern edition and the Restatement comment on why the rule attaches to the drafter.
bears:
  - fact: answer
    option: the-choice-is-the-record-read-back
    relation: adopted
---

## Answer

The rule is usually stated against the drafter of a document, and its older form is
stated against the framer of a question, on the reasoning that the party who
controlled how the question was put could have put it more precisely and should bear
the cost of not having done so. A deferral is a question the AI framed and an answer
the author gave, so the older form is the one that fits.

The record takes it as the tie-break its own scope rule was missing. Whatever the
author says beside a deferral is the scope of the grant; where that scope admits two
readings, the reading that leaves the AI less room governs. Without the tie-break
the bound party would choose the width of its own bound, and the scope rule would do
no work.

What the record does not take is the presumption that the framer could always have
been clearer. On the questions where the author defers, some obscurity is in the
subject and not in the drafting, and the rule is applied there too, deliberately and
in the knowledge that it is being applied past its warrant, because the party
applying it is the party it binds.
```

## Account

Minted at reconciliation on 2026-09-08 under the author's grant of that day, from
the tradition pass on the deferral mechanism the author stated at
`words/2026-09-08/39`. The pass returned the rule in its modern drafter-facing form,
where the fit is partial; the Roman form, which attaches to the party that framed
the question rather than the party that wrote the document, is the one the record
takes, and the stipulatio's question-and-answer structure is close enough to a probe
and its response that the node exists mainly to record the closeness. Validated by
the AI from its own knowledge of the sources; deferred until the author reads them,
and delegated if the author declines to.

It is the ground of the narrower-reading half of `the-choice-is-the-record-read-back`'s
second change, which is the one clause in that option that runs against the party
that wrote it.

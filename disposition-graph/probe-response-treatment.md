---
question: How is a response to a probe treated?
stage: periagogic
facts:
  - name: answer
    options:
      - name: common-treatment-with-alignment-input
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/33
    recommends: common-treatment-with-alignment-input
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
  - commons.systems/disposition-graph/author-questions
---

## Facts

### answer

The recommendation is `common-treatment-with-alignment-input`, at low boldness.
Low because the option is the author's own words of 2026-09-08 at
`words/2026-09-08/33` and the AI adds nothing to them but the placement; the
content the option would carry is owed and is what the node's design must write,
which is why this node stands at the periagogic stage with the option recorded
and its content not.

The question exists because the record has a sequencing for alignment input and
had no statement that a probe response is one. `author-questions` says where a
probe is asked and when it is worked; `alignment-order` says what order input is
taken in; `movements` says what a sitting does with input once it has it, the
periagogic movement establishing grounding and the maieutic eliciting what the
author means. None of them says which of those an answer to a probe gets. The
default reading, and the one a sitting falls into, is that a probe response is a
discharge: it closes the probe, the sitting writes the discharge reason, and the
input is consumed by the closing. That reading loses the disposition inside the
response, which is the defect this node exists to fix.

#### common-treatment-with-alignment-input

A response to a probe is alignment input and takes the same sequencing as
alignment input arriving any other way: it is recorded, and the disposition
articulated in it is grounded periagogically and understood maieutically in its
own right, recursively, so that a disposition first stated in a probe response is
not left standing only as a reason for closing a probe. Alignment input via
`/align` and alignment input via a probe response have one treatment.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is
owed.

**Content.**

```markdown
---
question: How is a response to a probe treated?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

A response to a probe is alignment input and takes the same sequencing as
alignment input arriving any other way.
```

### authority

The recommendation is `ratified`, at low boldness.

The reading `class-recommendation` calls for: the capture-shaped limb. The party
that would set this answer is the AI, and the answer decides whether the AI must
carry a disposition of the author's through the full sequencing or may consume it
as a discharge reason. Consuming is cheaper for the AI in every case and the
author has no view of the difference from the outside, since a closed probe looks
the same either way. That is the shape the limb names. The irreversible limb is
touched and is not the ground: a disposition lost in a discharge reason can be
recovered from the ledger by a later reading, so what is lost is the sequencing
and not the words.

## Account

### Queued, 2026-09-08

Minted in the alignment sitting of 2026-09-08 under the grant at
`words/2026-09-08/2` as refined at `words/2026-09-08/22`, from the author's words
at `words/2026-09-08/33`. Placed under `author-questions` because that node owns
the probe: what one is, what it carries, where it is asked, and when it is worked.
What happens to the answer is the next question down from what happens to the
question, so it refines that node rather than `movements`, which owns the
sequencing this answer invokes but not the object it applies it to.

The words are given as an observation about the sitting and a rule for the record:
"This session seems to be doing that implicitly, but note that alignment input via
`/align` has common treatment to alignment input via probe response." The
observation is accurate for this sitting and is exactly why the rule is needed.
Doing it implicitly means doing it when the sitting notices, and the sitting had
already failed to notice once on this record: the author's words of 2026-09-08 at
`words/2026-09-08/29` were a probe response carrying a disposition on what ends a
round, and they were recorded only inside the discharge reason of the probe they
answered, where nothing could be ruled on them and the validator reported them as
referenced by no option. `round-termination` was minted at `38dd0464` to correct
that, one node and one sitting after the loss. Under this node's recommendation
the correction would not have been a correction; it would have been the treatment.

The recursion the words name is the substance and not a flourish. A probe response
articulates a disposition; that disposition needs its own periagogic grounding and
its own maieutic understanding; establishing them raises probes of its own; those
probes get responses; and the responses are alignment input again. The record has
no clause bounding that recursion and needs none, for the reason the author gives
at `words/2026-09-08/32`: the exchange blocks on the author, so it cannot run
away, and a disposition that is accumulating probes is a disposition to refine
rather than a list to cap.

The periagogic object, to be read before anything is proposed: `author-questions`,
`movements`, `alignment-order`, `dialogue`, and `recording`, with `round-termination`
as the worked instance of the failure and the ledger entries of 2026-09-08 as the
evidence.

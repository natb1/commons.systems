---
question: Does acceptance sampling ground the drift probe, and what answers Deming's objection to it?
form: reading
stage: review
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
    recommends: as-read
    boldness: moderate
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
under:
  - commons.systems/disposition-graph/survey-selection
source: Dodge and Romig's sampling inspection at Bell Labs, from 1929; Deming, Out of the Crisis, for the all-or-none rule, whose year the tradition survey of 2026-09-07 gave as 1982 and the record's other citations of the same book give as 1986.
bears:
  - fact: answer
    option: the-delta-survey-with-a-periodic-whole
    relation: adopted
  - fact: answer
    option: a-whole-graph-reading-every-time
    relation: adopted
---
## Answer

Supports the probe, and carries the objection to it as its other half. The tradition inspects a sample of a lot, estimates the lot's defect density from it, and decides on that estimate whether the lot is inspected entire; Dodge and Romig's sampling inspection is its instrument, and Deming's all-or-none rule is the objection the tradition carries inside itself, that where an escape is expensive you inspect everything or nothing and sampling is the worst of both. The answer takes the instrument whole. The drift probe is a sample of the frozen pairs, one in twenty and never fewer than ten, drawn by a seeded generator whose seed the run records, handed to the reader like any other pair and marked as the probe, and a finding anywhere in the sample forces a whole survey: that is the tradition's escalation rule exactly, the sample deciding not what is wrong but whether the lot must be read entire. The answer takes the tradition's account of what such a sample can tell you as well, and states it as a limit rather than as a guarantee: the probe detects only drift the delta's selection missed, so its object is the selection and not the record, and its power is no more than its size gives it. Deming's half is why this reading bears on an option the answer passed over as well as on the one it takes. `a-whole-graph-reading-every-time` is the everything limb of the all-or-none rule, and the tradition supports it; the record is chosen over it, on the ground the tradition's own scope names, that all-or-none turns on what an escape costs, and here nothing acts on a node until the author rules, so a contradiction the survey misses is met by a later reading rather than by a defect already shipped. The answer does not leave that as argument alone. It keeps the everything limb inside the design on a cadence — a whole survey after every fourth delta, at least once in any thirty days, and unconditionally after any change to what the reader is asked to look for — so the probe escalates to a whole reading rather than standing in for one, and the objection is recorded on the option it qualifies rather than answered away.

## Rationale

Recorded under `survey-selection` on 2026-09-07, on the clean-context reading's finding that this tradition carries the case against the drift probe in the draft's own words while holding no reading, which `evaluation`'s rule does not allow to stand unrecorded. The confidences are the tradition survey's of that date, which is not part of the record: moderate-high on Dodge and Romig, high on Deming's position, and the sources are cited as it gave them. The AI validated the relation from its own knowledge of them. Delegated, because the relation is the AI's reading of sources the author may check, and the author's ruling on the options it bears on is where the reading has effect.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the sample, its escalation rule and the all-or-none objection; the ratchet the survey names beside them — a baseline of accepted findings that may only shrink, so a noisy tier can be adopted before its backlog is drained — is practice with no citation, is not adopted here, and whether the tier is turned on over such a baseline is a reconciliation question this reading does not answer. The record already reads Deming elsewhere and at a different locus, in the prose tradition lists on `review` and `validation-order` that `stub-traditions` is to mint as readings, where the book is cited for the third point's case against dependence on inspection and diverged from; two readings naming one tradition at two loci is the ordinary case `readings` describes. Those lists give the book's year as 1986 and the tradition survey gave 1982; the all-or-none rule is the locus and does not turn on which, and the discrepancy is named in `source` rather than silently resolved.

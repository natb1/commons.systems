---
question: Does regression test selection ground the delta survey, and where does the answer depart from its guarantee?
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
source: Rothermel and Harrold, Analyzing regression test selection techniques, IEEE TSE 22(8), 1996, and A safe, efficient regression test selection technique, TOSEM 6(2), 1997; industrial test-impact analysis as the practice.
bears:
  - fact: answer
    option: the-delta-survey-with-a-periodic-whole
    relation: diverged
---
## Answer

Diverges, on the guarantee. The tradition's central result is safety: a selection technique is safe when no test that could reveal a fault in the changed program is dropped, and safety rests on a sound dependency relation between the change and the tests, a control-flow or data-flow graph the technique walks. This record has no such relation for the thing the survey exists to catch, since two nodes may contradict each other with no ancestry between them, no citation either way and no word in common, so no selection over the record can be safe in the tradition's sense. The answer takes the industrial posture instead, which the tradition names and does not endorse: an unsafe selection run on what changed, with a full run on a cadence and a probe of what was skipped, and the answer names the selection unsafe in so many words rather than claiming a guarantee it cannot have. The divergence is recorded so that a later reader does not take the delta's silence for the tradition's safety.

## Rationale

Recorded in the maieutic movement on `survey-selection`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The tradition is read for its guarantee and the record departs from it there; the two backstops the answer carries are the answer's own and not the tradition's.

---
question: May the survey pin a node before its draft review has run?
form: rule
stage: review
review:
  survey:
    date: 2026-09-04
    of: ff1d4511bfcb1ec969f7cc09bba28c77ab03e523
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-04
    recommends: standing
    boldness: low
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: ratified
    boldness: low
---

## Answer

Yes: the survey judges every node at the review or ruling stage, so a node it
reads before that node's own draft review has run carries the survey's pin
and no verdict.

## Rationale

The two readings have different objects and different moments, and neither
waits on the other.

---
question: What happens when a review pins a recommendation that has moved?
form: rule
stage: review
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-03
    recommends: standing
    boldness: low
    stands: standing
---

## Answer

The review goes stale: it read a recommendation that is no longer the
recommendation the node carries.

## Rationale

`review.of` pins the node's recommendation hash as it was when the review
was written, so any later change to what a fact recommends, or to the reason
it gives, unpins it.

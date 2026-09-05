---
question: What stands under the low-boldness node and also reads its answer?
under:
  - clean-context-review.test/main/review-low
form: reading
source: A second tradition invented for this fixture, to test that a node claimed as a child is not duplicated as a reading.
bears:
  - fact: answer
    option: standing
    relation: adopted
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-08-01"
        ruling:
          response: confirm
          date: "2026-08-01"
          of: be33ffc98451d63d71e7b452c5649b2623fef8f6
    recommends: standing
    boldness: low
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
---

## Answer

Under the low-boldness node, and also a reading bearing on it (its `bears`
entry names no node, defaulting to its one parent), and already ratified so
it carries no stage: `draftNeighbourhood` takes `children` before
`readings`, so this node must land only in `children`, without inflating
review-low's own `settles` count by standing on the frontier itself.

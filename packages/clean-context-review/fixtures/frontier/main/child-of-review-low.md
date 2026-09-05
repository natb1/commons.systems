---
question: What stands directly under the low-boldness node?
under:
  - clean-context-review.test/main/review-low
form: rule
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: "2026-08-01"
        ruling:
          response: confirm
          date: "2026-08-01"
          of: dc431f30b3ddd4f2a5545f9e163dd18d32a8c97e
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

A child of the low-boldness node, drafted no further than the ground and
already ratified, so it carries no stage: it exists so that
`draftNeighbourhood` has a node whose `under` names the node under review,
and carries it in `children` rather than the index, without inflating
review-low's own `settles` count by standing on the frontier itself.

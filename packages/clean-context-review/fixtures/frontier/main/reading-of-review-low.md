---
question: What tradition bears on the low-boldness node's answer, from outside its neighbourhood?
form: reading
stage: maieutic
source: A tradition invented for this fixture, standing in for a real one.
bears:
  - node: clean-context-review.test/main/review-low
    fact: answer
    option: standing
    relation: adopted
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-08-01"
    recommends: standing
    boldness: low
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
---

## Answer

Bears on the low-boldness node's answer fact from outside its ancestry, its
children, and its siblings, so the reading is caught by nothing but its own
`bears`.

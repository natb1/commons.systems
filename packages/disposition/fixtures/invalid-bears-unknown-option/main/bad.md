---
question: What if the option a reading bears on is not on that fact?
form: reading
source: A tradition the fixture cites
bears:
  - node: example.test/main/root
    fact: answer
    option: nope
    relation: adopted
under:
  - example.test/main/root
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-04
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
---

## Answer

The tradition bears on an option the fact does not offer.

---
question: What if the fact a reading bears on is not on that node?
form: reading
source: A tradition the fixture cites
bears:
  - node: example.test/main/root
    fact: existence
    option: keep
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

The tradition bears on a fact the node does not carry.

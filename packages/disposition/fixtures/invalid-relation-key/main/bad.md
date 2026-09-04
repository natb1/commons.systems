---
question: Does a tradition still carry one relation for the whole node?
form: reading
source: A tradition the fixture cites
relation: adopted
bears:
  - node: example.test/main/root
    fact: answer
    option: standing
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

A reading that still carries the retired node-level relation.

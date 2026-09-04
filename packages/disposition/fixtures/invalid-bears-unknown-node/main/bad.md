---
question: What if the node a reading bears on is not in the graph?
form: reading
source: A tradition the fixture cites
bears:
  - node: example.test/main/does-not-exist
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

The tradition bears on a node that is not there.

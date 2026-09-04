---
question: Does an order naming a nonexistent node pass?
form: rule
order:
  - example.test/main/does-not-exist
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-01-01
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
---

## Answer

Answer present; the order names a node that is not in the graph.

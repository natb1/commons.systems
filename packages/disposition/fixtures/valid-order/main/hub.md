---
question: The order fixture's hub?
form: rule
under:
  - example.test/main/root
boost: 3
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-01-01
    stands: standing
---

## Answer

Hub answer; a sibling of order-node, and the ancestor of leaf-a and leaf-b.
It outranks leaf-a, which is fine only because it is leaf-a's ancestor.

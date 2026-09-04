---
question: Which node in the order fixture carries the order?
form: rule
under:
  - example.test/main/root
boost: 5
order:
  - [example.test/main/order-node, example.test/main/leaf-a]
  - example.test/main/leaf-b
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

This node's order ties itself with leaf-a (a deeper node, under the sibling
hub) in the first step, ahead of leaf-b in the second.

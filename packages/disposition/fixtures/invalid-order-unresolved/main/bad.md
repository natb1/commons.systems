---
question: Does an order naming a nonexistent node pass?
form: rule
authority:
  class: deferred
  by: Fixture Author
  date: 2026-01-01
order:
  - example.test/main/does-not-exist
stage: maieutic
---

## Answer

Answer present; the order names a node that is not in the graph.

---
question: Solo-child of the order fixture's leaf-a?
form: rule
under:
  - example.test/main/leaf-a
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

Solo-child answer; the lone child of leaf-a, a first-step member, so it
shares leaf-a's rank exactly. It is not named in the order itself, but it
tests that a first-step member's own descendant never counts as outranking
it.

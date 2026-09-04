---
question: B of the violated-order fixture?
form: rule
under:
  - example.test/main/root
boost: 1
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

B answer; second in the order, but boosted lowest, so it ends up outranked
by c instead of outranking it.

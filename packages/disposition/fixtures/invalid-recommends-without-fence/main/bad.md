---
question: May the answer fact recommend an option it does not quote?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-04
      - name: the-other-way
        source: ai
        ref: 2026-09-05
    recommends: the-other-way
    boldness: low
    stands: standing
---

## Answer

The node as it stands, which is not what the answer fact recommends.

## Facts

### answer

#### the-other-way

The option the fact recommends, stated in prose but never quoted whole.

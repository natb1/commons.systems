---
question: What happens when the survey's pin reads a recommendation that has moved?
form: rule
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: e58898ebee8ef0f307de9cc53b237189dffd66ac
  survey:
    date: 2026-09-03
    of: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-03
    recommends: standing
    boldness: low
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: ratified
    boldness: low
---

## Answer

The survey goes stale on its own and the draft review does not: the node owes
the survey again, and is not ready to rule until it has it.

## Rationale

Each pin attests to the recommendation its reading read, so each goes stale
by itself, and the readiness a ruling waits on is both at once.

---
question: What does a ruling on the authority fact confer?
form: rule
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
      - name: narrower
        source: ai
        ref: "2026-09-05"
    recommends: narrower
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: delegated
        ruling:
          response: confirm
          date: "2026-09-05"
          of: d1b0c9f09ea266edd75192a91bc9637c477741e9
      - name: ratified
    recommends: delegated
    boldness: moderate
---

## Answer

Delegated: the author handed this class of decision to the AI and does not
want to be asked again.

## Facts

### answer

The recommendation has moved to the narrower option since the delegation.
Because the ruling that confers the class is on the authority fact, and that
fact's recommendation has not moved, the node stays off the alignment
frontier and the recommendation acts within the delegation's scope.

#### narrower

Answer the question only for the case the delegation names, and leave the
rest to the nodes below.

## Recommendation

```markdown
---
question: What does a ruling on the authority fact confer?
form: rule
---

## Answer

Delegated, and only for the case the delegation names.
```

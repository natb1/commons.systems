---
question: May a fence carry a Facts section?
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
  - name: authority
    options:
      - name: ratified
      - name: delegated
---

## Answer

The node as it stands.

## Facts

### answer

#### the-other-way

The option the fact recommends, quoted below.

## Recommendation

```markdown
---
question: May a fence carry a Facts section?
form: rule
---

## Answer

A recommended answer carrying the node's own facts by another name.

## Facts

### answer

The facts belong to the node.
```

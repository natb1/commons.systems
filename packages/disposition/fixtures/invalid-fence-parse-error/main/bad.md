---
question: Does a fence that fails to parse fail?
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

The node as it stands.

## Facts

### answer

#### the-other-way

The option the fact recommends, quoted below.

## Recommendation

```markdown
not a valid node file at all
```

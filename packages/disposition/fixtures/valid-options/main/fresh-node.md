---
question: Which of the answers on the table should the author take?
form: rule
stage: ruling
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: d218ead8b0916c1b3f0f0db88991902e37815e49
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: 2026-09-01
      - name: split-the-node
        source: review
        ref: 2026-09-02
      - name: follow-the-instrument
        source: node --test packages/disposition/read.test.mjs
        ref: 2026-09-03
    recommends: split-the-node
    boldness: high
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: ratified
    boldness: high
---

## Disposition

The author said, on 2026-09-01, that the answer as it stands may well be
enough.

## Answer

Provisionally: the answer as it stands, which the author's own option would
keep.

## Rationale

Reasoned from the fixture's own small record, with the review's option raised
against it on 2026-09-02.

## Facts

### answer

The review's option is recommended: the question really is two questions, and
the fixture's own instrument agrees with neither the standing answer nor the
split without a further reading.

#### split-the-node

The clean-context review's option: the question is two questions, and the
node should be split before any of it is ratified.

#### follow-the-instrument

An option that arose outside alignment, from the node's own instrument: the
test run named in `source` contradicts the standing answer.

## Recommendation

```markdown
---
question: Which of the answers on the table should the author take?
form: rule
---

## Answer

Split the node: the question is two questions, and each half takes its own
answer.
```

## Account

The AI's account: three answers are on the table, one from the author, one
from the review, and one from the instrument. The recommendation adopts the
review's, and the standing answer keeps its authority until the author
confirms.

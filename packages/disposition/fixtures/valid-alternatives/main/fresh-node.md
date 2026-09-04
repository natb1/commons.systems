---
question: Which of the answers on the table should the author take?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
stage: ruling
alternatives:
  - name: keep-standing
    source: author
    ref: 2026-09-01
  - name: split-the-node
    source: review
    ref: 2026-09-02
  - name: follow-the-instrument
    source: proposal
    ref: node --test packages/disposition/read.test.mjs
recommendation:
  adopts: split-the-node
  boldness: high
  amends: 3118dac75b519f41c6ecaae2e39f544ecd9c7ba2
  at: a1b2c3d
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 76e4340370168652ee9a4b08958916d763ccb9ff
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: high
---

## Disposition

The author said, on 2026-09-01, that the answer as it stands may well be
enough.

## Answer

Provisionally: the answer as it stands, which the author's own alternative
would keep.

## Rationale

Reasoned from the fixture's own small record, with the review's alternative
raised against it on 2026-09-02.

## Alternatives

### keep-standing

The author's own alternative, stated in the disposition above: leave the
node as it stands and close the dialogue.

### split-the-node

The clean-context review's alternative: the question is two questions, and
the node should be split before any of it is ratified.

### follow-the-instrument

An answer that arose outside alignment, from the node's own instrument: the
test run named in `ref` contradicts the standing answer.

## Recommendation

```markdown
---
question: Which of the answers on the table should the author take?
form: rule
authority:
  class: ratified
  by: Fixture Author
  date: 2026-09-03
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

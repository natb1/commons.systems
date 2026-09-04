---
question: What does the fixture ask at the ruling stage?
form: rule
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-01-02
  of: cccccccccccccccccccccccccccccccccccccccc
  against: The review's own counter-argument against the drafted answer.
  survey:
    date: 2026-01-02
    of: cccccccccccccccccccccccccccccccccccccccc
under:
  - example.test/main/root
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: 2026-01-01
        ruling:
          response: confirm
          date: 2026-01-01
          of: dddddddddddddddddddddddddddddddddddddddd
          reason: The author's reason for confirming what stands.
      - name: the-drafted-answer
        source: ai
        ref: 2026-01-02
      - name: the-passed-option
        source: review
        ref: 2026-01-02
        status: passed
        reason: it measures the wrong thing
    recommends: the-drafted-answer
    boldness: moderate
    against: The AI's own case against the drafted answer.
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
  - name: persistence
    options:
      - name: with the fixture's shim
      - name: without it
    recommends: with the fixture's shim
    boldness: low
    against: The AI's own case against keeping the shim here.
---

## Disposition

The author, 2026-01-01, opening the fixture:

> keep what stands unless something better is drafted

The author, 2026-01-02, on the drafted answer:

> draft it, and show me the case against on the row

## Answer

What stands today, confirmed by the author on 2026-01-01 and still the node's
own text until they rule for another option.

## Rationale

Because the author confirmed it.

## Facts

### answer

The reason the fixture recommends the drafted answer over what stands.

#### the-drafted-answer

The drafted answer's own sentence, which the row leads with.

A second paragraph the drill-down carries.

#### the-passed-option

The passed option's own sentence, which the row still leads with.

### authority

Ratified, because the fixture's reason for the class it recommends sits here.

### persistence

The reason the fixture recommends keeping its shim on this node.

#### with the fixture's shim

This node carries the fixture's shim, so the page is described where its
question is asked.

#### without it

This node carries no shim and the declaration stays where it is.

## Recommendation

```markdown
---
question: What does the fixture ask at the ruling stage?
form: rule
under:
  - example.test/main/root
shims:
  - artifact: the fixture's alignment page
    for: the projection of this node's answer
    liquidation: when the fixture is deleted
    declared: 2026-01-01
---
## Answer

The drafted answer as it would stand, in full.

## Rationale

Because the drafted answer answers the question the node asks.
```

## Account

The AI's account of the fixture's own ruling-stage node.

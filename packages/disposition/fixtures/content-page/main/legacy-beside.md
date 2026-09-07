---
question: What does the page do with a node written the old way?
form: rule
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
  survey:
    date: 2026-09-07
    of: eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
under:
  - example.test/main/root
facts:
  - name: answer
    options:
      - name: read-it-as-it-stands
        source: ai
        ref: "2026-09-04"
      - name: the-drafted-answer
        source: ai
        ref: "2026-09-07"
    recommends: the-drafted-answer
    boldness: moderate
    against: The AI's own case against the drafted answer.
    stands: read-it-as-it-stands
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
---

## Disposition

The author, 2026-09-04, on the two encodings:

> keep reading the old ones until the migration has run

## Answer

It reads it as it stands, in the encoding of 2026-09-04: the `## Answer`
section is the text of the option named by `stands`.

## Facts

### answer

The legacy encoding is what most of this record is written in, and the page
renders it exactly as it did before the content encoding existed.

#### the-drafted-answer

The drafted answer's own sentence, which the row leads with.

## Recommendation

```markdown
---
question: What does the page do with a node written the old way?
form: rule
under:
  - example.test/main/root
---
## Answer

It reads it as it stands, and the page renders it exactly as it did before
the content encoding existed.
```

## Account

A legacy node beside the content ones, so one fixture exercises both.

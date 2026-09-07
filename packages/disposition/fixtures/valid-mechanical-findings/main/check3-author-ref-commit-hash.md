---
question: Is an author-sourced option's ref a date or a graph commit hash?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: "0123456789abcdef0123456789abcdef01234567"
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

## Disposition

The author, 2026-09-07: this fixture's own disposition text, unrelated to
the commit hash on the option's `ref`.

## Answer

The standing answer, sourced to the author by a graph commit hash rather
than a date -- the mismatch this fixture is for.

## Rationale

Reasoned from the fixture's own small record.

---
question: Does the author-sourced option's date actually appear under Disposition?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: "2026-09-01"
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

Some disposition text with no quoted attribution to the author at all --
the mismatch this fixture is for.

## Answer

The standing answer, sourced to the author by a date the disposition never
quotes.

## Rationale

Reasoned from the fixture's own small record.

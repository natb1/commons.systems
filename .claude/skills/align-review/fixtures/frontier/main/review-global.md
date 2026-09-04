---
question: Review-stage node at the global tier -- what does it answer?
form: rule
tier: global
stage: review
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-08-01"
    recommends: standing
    boldness: low
    stands: standing
---

## Answer

A rule that binds everywhere, at low boldness: the tier and not the boldness
is what the reviewer's model is read from here.

## Rationale

The global tier goes into every draft's brief as one of the rules that bind
everywhere.

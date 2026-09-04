---
question: What does a node the survey has already pinned carry?
form: rule
stage: review
review:
  survey:
    date: 2026-08-02
    of: 556a7fe535f582386cc3cdaacaad2c7f0b507539
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-08-01"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
---

## Answer

The survey's pin and no verdict: the survey read this node before its own
draft review ran, and neither reading waits on the other.

## Rationale

Either half of the review state may stand without the other.

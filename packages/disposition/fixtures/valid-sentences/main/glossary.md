---
question: What do the classes a ruling confers mean?
form: rule
defines:
  - term: ratified
    gloss: The author ruled on the answer itself and wants to be asked before it changes.
  - term: delegated
    gloss: The recommendation acts, and the author does not want to be asked again.
  - term: deferred
    gloss: The recommendation acts, and the node stays on the alignment frontier.
  - term: keep
    gloss: The node stays in the record, its question still its own.
  - term: prune
    gloss: The node leaves the record, its question answered elsewhere or not at all.
  - vocabulary
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: "2026-09-04"
        ruling:
          response: confirm
          date: 2026-09-04
          of: e8afd6c002fd7e808c01d189502da9e53e680221
          reason: Say it once, here, and let every page read it from here.
    recommends: standing
    boldness: low
    against: A gloss written once goes stale once, and nothing on the node says when.
    stands: standing
---

## Answer

What each class means is written here, once, as a gloss on the term, and
every projection reads the sentence for a vocabulary option from here.

## Rationale

A sentence a projection kept in its own text would be a rule no node
projects.

---
question: Who may change an answer in the fixture?
form: rule
under:
  - example.test/main/root
defines:
  - authority
  - term: ratified
    gloss: You decided it, in this dialogue, and want to be asked before it changes.
  - term: delegated
    gloss: You hand this class of decision to the AI and do not want to be asked again.
  - term: deferred
    gloss: You let the recommendation act and keep the node on the frontier until you return to it.
  - term: persistence
    gloss: What would the ruling leave standing?
facts:
  - name: answer
    options:
      - name: standing
        source: author
        ref: 2026-01-01
        ruling:
          response: confirm
          date: 2026-01-01
          of: 2cc82ba167c1bd92288512e59eba4da50f6ef3e1
    recommends: standing
    boldness: low
    stands: standing
---

## Answer

The author does, and the classes a ruling confers are the three this node glosses.

## Rationale

The vocabulary lives on the node that answers for it, so a projection reads the
sentence from here and never carries one of its own.

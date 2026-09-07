---
question: What does the root answer?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: the-root-answers-plainly
        source: ai
        ref: "2026-09-05"
      - name: the-root-answers-at-length
        source: author
        ref: "2026-09-06"
      - name: the-root-says-nothing
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: a node that says nothing answers no question
    recommends: the-root-answers-plainly
    boldness: moderate
    stands: the-root-answers-plainly
    against: A plain answer says less than the question asks.
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
        ruling:
          response: confirm
          date: "2026-09-06"
          of: 6059c539b5e739434084e3b3d69f7e13b3c1f651
    recommends: deferred
    boldness: low
review:
  verdict: forward
  strength: none
  date: "2026-09-06"
  of: 205fbae33b06c9b8fac7e7fc863dd1fb3faa8ae5
  commit: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
  survey:
    date: "2026-09-06"
    of: 205fbae33b06c9b8fac7e7fc863dd1fb3faa8ae5
---
## Disposition

The author, 2026-09-06, on how long the root's answer should be:

> keep the root short. the detail belongs on the children.

The author, 2026-09-06, in the same turn, on what a shared quotation is:

> one quote may be referenced by options across nodes

## Answer

The root answers plainly, in one sentence, and leaves the detail to its
children.

## Rationale

A root read by every session is read most often, so it is written to be read
quickly; the detail it drops is not lost, since each child carries its own.

## Facts

### answer

The plain answer is recommended because the root is read on every sitting.

#### the-root-answers-at-length

The root carries the whole argument itself. For it: a reader who opens one
file has read everything. Against it: every session pays for the detail, and
most sessions want the sentence.

#### the-root-says-nothing

The root is a heading over its children and carries no answer of its own.

## Account

### Minted, 2026-09-05

Written as a fixture of the legacy encoding.

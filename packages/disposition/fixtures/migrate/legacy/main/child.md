---
question: What does the child answer?
form: rule
stage: review
under:
  - example.test/main/root
facts:
  - name: answer
    options:
      - name: the-child-repeats-the-root
        source: ai
        ref: "2026-09-05"
      - name: the-child-refines-the-root
        source: author
        ref: "2026-09-06"
      - name: the-child-says-nothing
        source: ai
        ref: "2026-09-05"
    recommends: the-child-refines-the-root
    boldness: high
    stands: the-child-repeats-the-root
    against: A refinement the root does not carry is a second answer to one question.
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
---
## Disposition

The author, 2026-09-06, in the same turn, on what a shared quotation is:

> one quote may be referenced by options across nodes

The author, 2026-09-07, on what the child owes the root:

> the child should say the part the root left out, and nothing the root already said

## Answer

The child repeats what the root says and adds nothing.

## Rationale

Repetition is what a reader of one file wants and what a reader of two files
pays for twice.

## Facts

### answer

The refinement is recommended because the root's own answer sends the detail
here.

#### the-child-refines-the-root

The child says the part the root left out and repeats none of it.

#### the-child-says-nothing

The child is a heading and answers nothing of its own.

## Recommendation

```markdown
---
question: What does the child answer?
form: rule
under:
  - example.test/main/root
---
## Answer

The child says the part the root left out, and repeats nothing the root
already says.

## Rationale

One question is answered once, and a child that repeats its parent makes the
same sentence drift in two places.
```

## Account

### Minted, 2026-09-05

Written as a fixture of the legacy encoding, with a recommendation fence.

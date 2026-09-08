---
question: Is this node worth keeping at all, in the content encoding?
form: rule
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-08
  of: "9999999999999999999999999999999999999999"
  survey:
    date: 2026-09-08
    of: "9999999999999999999999999999999999999999"
under:
  - example.test/main/root
defines:
  - term: keep
    gloss: The node stays in the record, its question still its own.
  - term: prune
    gloss: The node leaves the record, its question answered elsewhere or not at all.
facts:
  - name: answer
    options:
      - name: a-placeholder-answer
        source: ai
        ref: "2026-09-08"
    recommends: a-placeholder-answer
    boldness: moderate
  - name: topology
    options:
      - name: keep
        source: ai
        ref: "2026-09-08"
      - name: prune
        source: author
        ref: "2026-09-08"
        ruling:
          response: confirm
          date: "2026-09-08"
          of: "9999999999999999999999999999999999999999"
          reason: Nothing here survives as a node of its own.
    recommends: prune
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
---

## Facts

### answer

A placeholder, present only so the node carries a real answer and reaches
the browser projection: this fixture's own point of interest is its
`topology` fact below, not this one.

#### a-placeholder-answer

Nothing turns on this option's own text; it exists so the node is not
excluded as unaligned.

**Content.**

```markdown
---
question: Is this node worth keeping at all, in the content encoding?
form: rule
---
## Answer

A placeholder answer, present only so the node reaches the page.
```

### topology

Prune the node: reserved vocabulary, the same on every node it appears on,
never a candidate answer and never a subsection of its own.

## Account

Written beside `topology-content.md` as its contrast: a `topology` fact
offering only the reserved vocabulary, `keep` and `prune`, with no
freely-named placement option present at all. Confirmed to `prune` so that
`withDerivedAnswers` is exercised the same way `topology-content.md`'s fact
is, and still gains no `stands`: reserved vocabulary is never the option that
holds this node's own text. The glossary entries above give the confirmed
option a real gloss to render, rather than leaving the row to fall back to
its bare name.

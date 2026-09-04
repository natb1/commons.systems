---
question: Should the reader treat a fence as a whole proposed node?
form: rule
stage: ruling
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: e69ea8222571039025609e95906c30b084871638
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-02
      - name: whole-node
        source: ai
        ref: 2026-09-03
    recommends: whole-node
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: ratified
    boldness: moderate
---

## Disposition

The author asked whether a proposed node belongs beside the node it would
replace, as its own fenced section.

## Answer

Not yet: this is the node as it stands, unruled.

## Rationale

Reasoned from the fixture's own small record; the review below found the
reasoning sound.

## Facts

### answer

Read the fence as a whole node and the same parse serves both, which is what
the recommendation turns on.

#### whole-node

Read the fence as a whole proposed node -- frontmatter and sections -- rather
than as an answer fragment, so the same parse serves both.

## Recommendation

```markdown
---
question: Should the reader treat a fence as a whole proposed node?
form: rule
---

## Answer

Yes: a fence holds a whole proposed node, frontmatter and sections, parsed
the same way as any other node file.
```

## Account

Rule on the recommended option above.

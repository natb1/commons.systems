---
question: Should the reader treat a draft as a whole proposed node?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
stage: ruling
alternatives:
  - name: whole-node
    source: ai
    ref: 2026-09-03
recommendation:
  adopts: whole-node
  class: ratified
  boldness: moderate
  amends: 13cdc41935194afcf1bc1eeeaca6f5962bd55393
  at: a1b2c3d
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: b4f02bdb272a870592237e9f33b6b9b81b6a40ec
---

## Disposition

The author asked whether a draft belongs beside the node it drafts, as its
own fenced section.

## Answer

Not yet: this is the node as it stands, unratified.

## Rationale

Reasoned from the fixture's own small record; the review below found the
reasoning sound.

## Alternatives

### whole-node

Read the fence as a whole proposed node -- frontmatter and sections --
rather than as an answer fragment, so the same parse serves both.

## Recommendation

```markdown
---
question: Should the reader treat a draft as a whole proposed node?
form: rule
authority:
  class: ratified
  by: Fixture Author
  date: 2026-09-03
---

## Answer

Yes: a draft is a whole proposed node, frontmatter and sections, parsed
the same way as any other node file.
```

## Account

Ratify the alternative above.

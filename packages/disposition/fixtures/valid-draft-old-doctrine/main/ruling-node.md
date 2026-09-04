---
question: May a draft presume doctrine the author has not yet ratified?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
stage: ruling
alternatives:
  - name: presume-freely
    source: ai
    ref: 2026-09-03
recommendation:
  adopts: presume-freely
  boldness: moderate
  amends: 7a2ed804a439f12f0cf6c9a512b7cc18f65e35aa
  at: a1b2c3d
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 777cc3dede8f172790b1e4257963861cc446d2c9
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: moderate
---

## Disposition

The author asked whether a draft may presume a ruling not yet given.

## Answer

Not yet: this is the node as it stands, unratified.

## Rationale

Reasoned from the fixture's own small record.

## Alternatives

### presume-freely

Let the fence carry whatever vocabulary the ruling it presumes would
introduce; the validator checks only that it parses and answers the same
question.

## Recommendation

```markdown
---
question: May a draft presume doctrine the author has not yet ratified?
form: disposition
authority:
  class: ratified
  by: Fixture Author
  date: <the date of the ruling>
tier: cosmic
---

## Answer

Yes: the validator parses a draft and checks only that it answers the
same question, so a form outside today's vocabulary, an authority date
still a placeholder, and a tier the vocabulary does not name are all
carried through unchecked.
```

## Account

Ratify the alternative above.

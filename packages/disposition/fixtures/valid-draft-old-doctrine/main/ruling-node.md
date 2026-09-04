---
question: May a fence presume doctrine the author has not yet ratified?
form: rule
stage: ruling
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 6a33933864561e78bcfca99dbb2c4e40377788e2
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-02
      - name: presume-freely
        source: ai
        ref: 2026-09-03
    recommends: presume-freely
    boldness: moderate
    stands: standing
---

## Disposition

The author asked whether a fence may presume a ruling not yet given.

## Answer

Not yet: this is the node as it stands, unruled.

## Rationale

Reasoned from the fixture's own small record.

## Facts

### answer

Let the fence carry the vocabulary the ruling it presumes would introduce.

#### presume-freely

Let the fence carry whatever vocabulary the ruling it presumes would
introduce; the validator checks only that it parses, answers the same
question, and carries none of the keys that belong to the node.

## Recommendation

```markdown
---
question: May a fence presume doctrine the author has not yet ratified?
form: disposition
tier: cosmic
under:
  - example.test/main/nowhere
---

## Answer

Yes: the validator parses a fence and checks only that it answers the same
question, so a form outside today's vocabulary, a tier the vocabulary does
not name, and an 'under' that resolves to nothing are all carried through
unchecked.
```

## Account

Rule on the recommended option above.

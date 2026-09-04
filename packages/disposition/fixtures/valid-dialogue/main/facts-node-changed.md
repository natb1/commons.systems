---
question: Do facts carry rulings and stay invisible to the standing hash?
form: rule
stage: periagogic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: 2026-09-03
    stands: standing
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: prune
    boldness: high
---

## Disposition

facts-node's twin: a different set of facts entirely (fewer of them, other
options, no ruling), and no '## Facts' section at all.

## Answer

Provisionally: the node as it stands, whatever the facts beside it say.

## Rationale

The standing hash covers this text and the frontmatter with every dialogue
key -- facts included -- stripped out first, so the twin below hashes the
same despite its very different facts.

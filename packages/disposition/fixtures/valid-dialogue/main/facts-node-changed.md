---
question: Do facts reorder, carry rulings, and stay invisible to the standing hash?
form: rule
stage: periagogic
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: high
    ruling:
      response: confirm
      choice: ratified
      date: 2026-09-03
      of: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
  - name: existence
    choices:
      - keep
      - prune
    adopts: prune
    boldness: high
---

## Disposition

facts-node's twin: a different set of facts entirely (fewer of them, other
choices, another ruling), and no '## Facts' section at all.

## Answer

Provisionally: the node as it stands, whatever the facts beside it say.

## Rationale

The standing hash covers this text and the frontmatter with every dialogue
key -- facts included -- stripped out first, so the twin below hashes the
same despite its very different facts.

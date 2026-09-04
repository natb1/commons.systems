---
question: Do facts reorder, carry rulings, and stay invisible to the standing hash?
form: rule
stage: periagogic
facts:
  - name: persistence
    choices:
      - derived
      - present
    adopts: present
    boldness: low
    ruling:
      response: confirm
      choice: present
      date: 2026-09-03
      of: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: delegated
    boldness: low
  - name: existence
    choices:
      - keep
      - prune
    adopts: keep
    boldness: low
---

## Disposition

Still open; this fixture and its twin, facts-node-changed, pin that only
the facts entries differ between them, below.

## Answer

Provisionally: the node as it stands, whatever the facts beside it say.

## Rationale

The standing hash covers this text and the frontmatter with every dialogue
key -- facts included -- stripped out first, so the twin below hashes the
same despite its very different facts.

## Facts

### persistence

Present, because the recommendation would change the node's shape rather
than merely confirm it.

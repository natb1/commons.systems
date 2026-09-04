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
  - name: persistence
    options:
      - name: derived
      - name: present
        ruling:
          response: confirm
          date: 2026-09-03
          of: 3d3b7831a92369838c0960095de572bab3a94458
    recommends: present
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: delegated
    boldness: low
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: low
---

## Disposition

Still open; this fixture and its twin, facts-node-changed, pin that only the
facts entries differ between them, below.

## Answer

Provisionally: the node as it stands, whatever the facts beside it say.

## Rationale

The standing hash covers this text and the frontmatter with every dialogue
key -- facts included -- stripped out first, so the twin below hashes the
same despite its very different facts.

## Facts

### persistence

Present, because the recommendation would change the node's shape rather than
merely confirm it.

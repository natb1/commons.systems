---
question: Which options stay on a fact's list?
form: rule
under:
  - example.test/main/glossary
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-04
  of: 10bdd93cbe1f0657f65eb748ec976b465949e675
  against: The passed status is the AI accounting for its own judgment, which the author may claim.
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
      - name: list-the-viable-only
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: A candidate that silently leaves the list cannot be ruled for.
      - name: keep-every-candidate
        source: review
        ref: "2026-09-04"
    recommends: keep-every-candidate
    boldness: moderate
    against: Two more rows on every fact, and a reader must read a judgment to know which of them matter.
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: ratified
    boldness: low
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: low
  - name: persistence
    options:
      - name: derived
      - name: present
    recommends: present
    boldness: low
---

## Answer

Only the ones the AI still holds viable, which is what stands here now.

## Facts

### answer

Keeping every candidate is recommended: viability is a judgment shown on the
option and never the condition of its being listed.

#### list-the-viable-only

Drop an option once it is dominated, so the list a reader sees is the list
still in play.

#### keep-every-candidate

Keep every candidate the AI considered and can name, each carrying its
status, so the author may rule for one the AI passed over.

### persistence

Present, because the recommendation changes what the node holds.

#### derived

Read the answer off whatever stands elsewhere, and keep nothing here.

#### present

Keep the answer present on the node, in its own words.

## Recommendation

```markdown
---
question: Which options stay on a fact's list?
form: rule
under:
  - example.test/main/glossary
---

## Answer

Every candidate the AI considered and can name, each carrying its status:
recommended, viable, or passed over with the reason it was passed over.
```

## Account

Rule on the recommended option above.

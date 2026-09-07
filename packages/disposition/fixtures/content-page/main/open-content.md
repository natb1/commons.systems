---
question: What does a column hold before anything is confirmed?
form: rule
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: dddddddddddddddddddddddddddddddddddddddd
  survey:
    date: 2026-09-07
    of: dddddddddddddddddddddddddddddddddddddddd
under:
  - example.test/main/root
facts:
  - name: answer
    options:
      - name: a-sentence-saying-nothing-is-confirmed
        source: ai
        ref: "2026-09-07"
      - name: the-recommended-draft
        source: ai
        ref: "2026-09-07"
    recommends: the-recommended-draft
    boldness: high
    against: A column that says nothing is confirmed says it on every node of this record at once.
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: low
---
## Facts

### answer

Nothing on this node is confirmed, which is the state the column has to have
words for.

#### a-sentence-saying-nothing-is-confirmed

The column says that no option here is confirmed, and renders no draft in
that place.

**AI support.** Putting an unconfirmed text where the author's own choice
belongs is showing the author the AI's draft as their own.

**Content.**

```markdown
---
question: What does a column hold before anything is confirmed?
form: rule
---
## Answer

A sentence saying that no option here is confirmed, and no draft in that
place.
```

#### the-recommended-draft

The column holds the recommended option's content, marked as a draft.

**AI divergence.** A mark is read past, and the text beneath it is read as
the node's own.

**Content.**

```markdown
---
question: What does a column hold before anything is confirmed?
form: rule
---
## Answer

The recommended option's content, marked as a draft no one has confirmed.
```

## Account

A content node on which no ruling confirms anything, so the page has to say
so in words.

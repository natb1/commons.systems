---
question: What does the right-hand column of the alignment page hold?
form: rule
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: cccccccccccccccccccccccccccccccccccccccc
  against: The review's own counter-argument against the previewing column.
  survey:
    date: 2026-09-07
    of: cccccccccccccccccccccccccccccccccccccccc
under:
  - example.test/main/root
facts:
  - name: answer
    options:
      - name: the-confirmed-column
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/1
        ruling:
          response: confirm
          date: "2026-09-07"
          of: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
          reason: This is what I meant.
      - name: the-previewing-column
        source: ai
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/2
        diverges:
          - words/2026-09-07/1
      - name: the-previewing-column-with-a-note
        source: ai
        ref: "2026-09-07"
    recommends: the-previewing-column-with-a-note
    boldness: moderate
    against: A column that moves under the reader's hand is a column they cannot compare against.
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
---
## Facts

### answer

The recommendation has moved past what the author confirmed, which is what a
proposal is: the confirmed option still answers the question, and the node
returns to the author for re-confirmation.

#### the-confirmed-column

The column holds the content of the option the author last confirmed, and
does not move.

**AI support.** It is the one text on the page whose authority the author
themselves gave it.

**Content.**

```markdown
---
question: What does the right-hand column of the alignment page hold?
form: rule
---
## Answer

The content of the option the author last confirmed, and nothing else.
```

#### the-previewing-column

The column previews the node as it would stand under the option selected in
the middle column.

**AI support.** The author asked for exactly this on 2026-09-07.

**AI divergence.** A column that re-renders under the reader's hand is a
column they cannot hold two options against at once.

**Content.**

```markdown
---
question: What does the right-hand column of the alignment page hold?
form: rule
---
## Answer

The node as it would stand under the option selected in the middle column,
resolved from that option's content and re-rendered as the selection moves.
```

#### the-previewing-column-with-a-note

The preview, and a line saying so where no option is confirmed.

**AI divergence.** The line is apparatus in the one column whose job is to
carry no apparatus.

**Content.**

From: the-previewing-column

```diff
@@ -6,3 +6,6 @@
 
 The node as it would stand under the option selected in the middle column,
 resolved from that option's content and re-rendered as the selection moves.
+
+Where no option is confirmed the column says so, rather than putting the
+AI's draft where the author's own choice belongs.
```

## Account

Written as a fixture of the content encoding on the alignment page: one
option confirmed, one recommended, and the third a named change against the
second.

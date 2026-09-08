---
question: Which option does a node's answer come from?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: the-confirmed-one
        source: ai
        ref: "2026-09-07"
        ruling:
          response: confirm
          date: "2026-09-07"
          of: "f0ccdd6ad4fc263f983d27d5479f83c89f6f97b0"
          reason: This is what I meant.
      - name: the-recommended-one
        source: ai
        ref: "2026-09-07"
    recommends: the-recommended-one
    boldness: moderate
    against: The confirmed option keeps its full authority while an option is pending beside it.
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

#### the-confirmed-one

The answer is the resolved content of the option carrying the most recent
confirming ruling.

**AI support.** It is the rule the record already reads its classes by: the
ruling is the data and nothing is stamped beside it.

**Content.**

```markdown
---
question: Which option does a node's answer come from?
form: rule
---
## Answer

From the option carrying the most recent confirming ruling, and where none
is confirmed, from the option the answer fact recommends.
```

#### the-recommended-one

The answer is always the resolved content of the option the answer fact
recommends, confirmed or not.

**AI divergence.** It would let the AI's own draft stand in the place a
confirmed choice belongs, which is what the record does today and what this
encoding is meant to end.

**Content.**

```markdown
---
question: Which option does a node's answer come from?
form: rule
---
## Answer

From the option the answer fact recommends, whether or not the author has
confirmed it.
```

## Account

Written on 2026-09-07 as a fixture of the content encoding: one option
confirmed, another recommended beside it.

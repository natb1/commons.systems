---
question: Where are the author's words kept?
form: rule
stage: maieutic
facts:
  - name: answer
    options:
      - name: words-in-a-ledger
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/1
      - name: words-copied-onto-every-option
        source: ai
        ref: "2026-09-07"
        diverges:
          - words/2026-09-07/1
    recommends: words-in-a-ledger
    boldness: moderate
    against: A node file stops being readable on its own, since the words that ground it are one resolution away.
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

`words-in-a-ledger` is recommended, and the recommendation is the weighing:
the ledger is the only one of the two under which a quotation carried by two
options is stored once, and the copy is what drifts.

#### words-in-a-ledger

One ledger of the author's words on the ref, each entry stored once and
addressed by an id, referenced from any option on any node.

**AI support.** Measured over the record, 28% of the bytes under
`## Disposition` are copies of a quotation already written on another node,
and every copy is hand-made and checked against nothing.

**AI divergence.** It puts a second kind of file on a ref whose own rule is
that it carries the graphs and only the graphs.

**Content.**

```markdown
---
question: Where are the author's words kept?
form: rule
---
## Answer

In one ledger on the ref, each entry stored once and addressed by an id, and
referenced from every option it supports or diverges from.
```

#### words-copied-onto-every-option

Each option carries the quotation itself, concatenated in date order, and
there is no ledger and no reference.

**AI divergence.** It multiplies the duplication already measured by the
number of options that cite an entry rather than reducing it.

**Content.**

```markdown
---
question: Where are the author's words kept?
form: rule
---
## Answer

On the options themselves, each carrying the quotations it rests on in full,
concatenated in date order.
```

## Account

Written on 2026-09-07 as a fixture of the content encoding: two options, each
carrying its content whole.

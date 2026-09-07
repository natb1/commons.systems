---
question: How does an option say it is the one above with a clause added?
form: rule
stage: maieutic
under:
  - example.test/main/root
facts:
  - name: answer
    options:
      - name: the-first-rung
        source: ai
        ref: "2026-09-06"
      - name: the-second-rung
        source: ai
        ref: "2026-09-06"
    recommends: the-first-rung
    boldness: low
    stands: the-first-rung
    against: A ladder of options is a ladder of pins.
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
        ruling:
          response: confirm
          date: "2026-09-06"
          of: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
    recommends: deferred
    boldness: low
review:
  verdict: forward
  strength: none
  date: "2026-09-06"
  of: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
  commit: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
  survey:
    date: "2026-09-06"
    of: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
---
## Answer

An option carries its content whole.

## Rationale

The whole is the plainest form and the one a reader needs nothing to read.

## Facts

### answer

The first rung is recommended because it is the one the record already wrote.

#### the-second-rung

The first rung, and a clause saying that a change is stored once.

**AI support.** A ladder stores one text and the clauses that extend it.

**Content.**

From: the-first-rung

```diff
@@ -7,4 +7,6 @@
 
 ## Answer
 
-An option carries its content whole.
+An option carries its content whole, or as a named change to another
+option's, so that a text is stored once and the clause that extends it is
+stored beside it.
```

## Account

### Minted, 2026-09-06

Written as a fixture: an option already carrying its content in the shape the
migration writes.

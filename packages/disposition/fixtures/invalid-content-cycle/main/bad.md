---
question: What resolves through what?
stage: maieutic
facts:
  - name: answer
    options:
      - name: first
        source: ai
        ref: "2026-09-07"
      - name: second
        source: ai
        ref: "2026-09-07"
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
---
## Facts

### answer

Neither option carries its content whole, so neither resolves.

#### first

The first option, a change against the second.

**Content.**

From: second

```diff
@@ -1 +1 @@
-one
+two
```

#### second

The second option, a change against the first.

**Content.**

From: first

```diff
@@ -1 +1 @@
-two
+one
```

## Account

A cycle in the resolution graph, which the validator refuses.

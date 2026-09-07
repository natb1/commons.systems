---
question: What does a change name as its base?
stage: maieutic
facts:
  - name: answer
    options:
      - name: only-option
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

The one option names a base that is not an option of this fact.

#### only-option

The only option, a change against an option that is not there.

**Content.**

From: no-such-option

```diff
@@ -1 +1 @@
-one
+two
```

## Account

A named change whose base is not an option of the same fact.

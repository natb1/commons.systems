---
question: Does a hunk have to apply?
stage: maieutic
facts:
  - name: answer
    options:
      - name: base
        source: ai
        ref: "2026-09-07"
      - name: change
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

The change's context line is not what the base carries at that line.

#### base

The base, carrying its content whole.

**Content.**

```markdown
---
question: Does a hunk have to apply?
---
## Answer

It does, exactly, at the line its header names.
```

#### change

A change whose one hunk quotes a line the base does not have.

**Content.**

From: base

```diff
@@ -4,2 +4,2 @@
 ## Answer
-A line the base does not carry.
+A line the change would put there.
```

## Account

A hunk that does not apply is an error of the record, never re-anchored.

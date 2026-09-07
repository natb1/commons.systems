---
question: How does a survey narrow its object without narrowing what it can find?
form: rule
stage: review
facts:
  - name: answer
    options:
      - name: the-judged-node-is-carried-once
        source: ai
        ref: "2026-09-07"
      - name: the-mechanical-tier-gates-the-launch
        source: ai
        ref: "2026-09-07"
      - name: the-delta-survey
        source: author
        ref: "2026-09-07"
    recommends: the-delta-survey
    boldness: high
    against: Every clause narrows what the record's only whole-graph reader is shown, and it narrows on a dependency relation this record does not have.
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: low
---
## Facts

### answer

The three options are one ladder, each the one above plus a clause, so each
is written as a change against the one it extends and only the first carries
its content whole.

#### the-judged-node-is-carried-once

The judged node is carried by what the validations read of it and once only.

**AI support.** Measured on the survey brief of 2026-09-07, the judged set is
799,187 bytes, of which the recommendation fences are 208,479.

**Content.**

```markdown
---
question: How does a survey narrow its object without narrowing what it can find?
form: rule
---
## Answer

The judged node is carried once, by what the validations read of it and no
more, its rationale and its option prose struck.
```

#### the-mechanical-tier-gates-the-launch

The carried-once rule, and a mechanical tier that runs before the reading and
refuses to launch it where a check can name the defect.

**AI divergence.** The refusal is a real loss where the check is wrong about
what it names.

**Content.**

From: the-judged-node-is-carried-once

```diff
@@ -6,3 +6,6 @@
 
 The judged node is carried once, by what the validations read of it and no
 more, its rationale and its option prose struck.
+
+The mechanical tier runs before the reading and gates its launch, so a node
+whose defects a check can name is never sent to a reader.
```

#### the-delta-survey

The tier, and a survey that judges what has moved since it last pinned the
node, each candidate pair carrying the key that nominated it.

**AI support.** It is the first rung whose loss is measurable, since the keys
say what nominated every pair the reader was shown.

**AI divergence.** The pair the survey exists to find, two nodes that
disagree in disjoint words and never name each other, is exactly the pair the
delta freezes.

**Content.**

From: the-mechanical-tier-gates-the-launch

```diff
@@ -9,3 +9,6 @@
 
 The mechanical tier runs before the reading and gates its launch, so a node
 whose defects a check can name is never sent to a reader.
+
+The survey judges what has moved since it last pinned the node, and the pairs
+it judges carry the key that nominated them.
```

## Account

Written on 2026-09-07 as a fixture of the content encoding: a ladder of three,
the first whole and each of the other two a named change against the one above
it.

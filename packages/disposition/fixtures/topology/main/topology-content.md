---
question: Where does this node's topology fact place it once the author rules?
form: rule
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-08
  of: ffffffffffffffffffffffffffffffffffffffff
  survey:
    date: 2026-09-08
    of: ffffffffffffffffffffffffffffffffffffffff
under:
  - example.test/main/root
defines:
  - term: ratified
    gloss: The author ruled on this answer directly, in the alignment dialogue.
facts:
  - name: answer
    options:
      - name: a-placeholder-answer
        source: ai
        ref: "2026-09-08"
    recommends: a-placeholder-answer
    boldness: moderate
  - name: topology
    options:
      - name: keep
        source: ai
        ref: "2026-09-08"
      - name: fold-into-a-different-node
        source: author
        ref: "2026-09-08"
        ruling:
          response: confirm
          date: "2026-09-08"
          of: ffffffffffffffffffffffffffffffffffffffff
          reason: This question is not its own; it belongs under the node it refines.
    recommends: fold-into-a-different-node
    boldness: moderate
  - name: authority
    options:
      - name: ratified
        source: author
        ref: "2026-09-08"
        ruling:
          response: confirm
          date: "2026-09-08"
          of: ffffffffffffffffffffffffffffffffffffffff
          reason: The author's own call, not a class the AI recommends.
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
---

## Facts

### answer

A placeholder, present only so the node carries a real answer and reaches
the browser projection: this fixture's own point of interest is its
`topology` fact below, not this one.

#### a-placeholder-answer

Nothing turns on this option's own text; it exists so the node is not
excluded as unaligned.

**Content.**

```markdown
---
question: Where does this node's topology fact place it once the author rules?
form: rule
---
## Answer

A placeholder answer, present only so the node reaches the page.
```

### topology

Whether this node keeps its own place or is folded into another once the
author rules on it.

#### fold-into-a-different-node

This question is not one this node should keep asking on its own: it belongs
folded into the node it refines, and answered there instead.

**AI support.** The parent already carries most of what this node would say,
and the one sentence it does not carry is short enough to move.

**Content.**

```markdown
---
question: Where does this node's topology fact place it once the author rules?
form: rule
---
## Answer

Folded into the node it refines, and no longer a question of its own.
```

## Account

Written to exercise a `topology` fact whose confirmed option is a
freely-named placement option -- neither `keep` nor `prune` -- one that owns
a `#### <option>` subsection and carries its own sentence and content exactly
as an `answer` or `persistence` option does. The `authority` fact beside it is
confirmed too, on `ratified`, so the same node shows a reserved-vocabulary
option next to one that is not: `ratified` renders from the glossary alone
and owns no subsection, no content, and no `stands`.

---
id: tactic-eval-finding-eval-finding-list-misses-nonledger
kind: tactic
statement: dispatch-eval-finding --list filters on attributes.ledger_entry, so
  three of the five live tactic-eval-finding-* nodes are invisible to the
  similarity judgment the skill calls load-bearing — an evaluator can follow the
  documented procedure and still mint a duplicate, or collide a slug onto a
  non-ledger tactic
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: prefix_nodes_hidden_from_list
      value: 3
      unit: nodes
      window: intentions/ at origin/main db9e7f2c, 2026-08-13
      sensor: graph read
      measured: 2026-08-13
    - metric: prefix_nodes_total
      value: 5
      unit: nodes
      window: intentions/ at origin/main db9e7f2c, 2026-08-13
      sensor: graph read
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## What was observed

`dispatch-eval-finding --list` — the input the skill designates as "the
load-bearing step" for the similarity judgment — does not show every node that
occupies the `tactic-eval-finding-<slug>` id space. On `origin/main` at
`db9e7f2c` (2026-08-13):

| node | shown by `--list`? | why |
| --- | --- | --- |
| `tactic-eval-finding-conflict-lane-registered-phantom` | yes | `ledger_entry: true` |
| `tactic-eval-finding-sensor-registry-key-prose-drift` | yes | `ledger_entry: true` |
| `tactic-eval-finding-ledger` | no | no `ledger_entry` attribute |
| `tactic-eval-finding-lock-wait` | no | no `ledger_entry` attribute |
| `tactic-eval-finding-utc-bounds-local-newermt` | no | no `ledger_entry` attribute |

Three of five live nodes carrying the ledger's own id prefix are invisible to the
listing. The filter is `list_entries()` at
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:322-323`:

```
.filter((n) => n.kind === "tactic" && n.attributes?.ledger_entry === true)
```

The three hidden nodes are real, live findings — `utc-bounds-local-newermt` and
`lock-wait` both describe defects in this very evaluation lane — that were minted
by `/align` rather than by `dispatch-eval-finding`, so they never got the
attribute.

## Why it matters

Two distinct harms, and the second is a graph-integrity hazard rather than a
reporting one:

1. **The similarity judgment is made against a partial ledger.** The skill's
   contract is that a near-duplicate slug destroys `recurrence_count`, which it
   calls "the whole point of the ledger". An evaluator that reads `--list`, sees
   two entries, and mints a third for something `tactic-eval-finding-lock-wait`
   already covers has followed the documented procedure exactly and still
   produced the duplicate the procedure exists to prevent.

2. **Slug collision onto a non-ledger node.** `--slug utc-bounds-local-newermt`
   derives the node id `tactic-eval-finding-utc-bounds-local-newermt`, which
   already exists as an ordinary `phase: null`, `status: raw` tactic. What
   find-or-create does when its target id exists but is not a ledger entry is not
   established here — establishing it would require a write, which this evaluator
   may not perform. The two possibilities are that it refuses (an unexplained
   failure for a caller who consulted `--list` and saw nothing) or that it
   rewrites the node's body and attributes (silently converting a planned tactic
   into a ledger entry). Neither is a good outcome, and a fire-and-forget caller
   sees neither.

## What would have to change

Some pairing of: `--list` widening to the id prefix and labelling entries that
lack `ledger_entry` (so the judgment sees the whole namespace it writes into); a
guard in the find-or-create path that refuses a target id lacking
`ledger_entry: true` with a named error; and back-stamping `ledger_entry: true`
on the three existing prefix-holders that are genuinely ledger findings.

Which of those is right is a judgment about the ledger's contract, so it is
recorded for the author and not applied. Related: `tactic-eval-finding-lock-wait`
records the sibling under-count (an occurrence silently dropped on lock
contention); this is the same metric threatened from the other side.

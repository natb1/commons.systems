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
    - metric: ledger_entries_listed
      value: 8
      unit: entries
      window: 2026-08-13 fix-phase eval
      sensor: dispatch-eval-finding
      measured: 2026-08-13
    - metric: ledger_entries_on_disk
      value: 10
      unit: entries
      window: 2026-08-13 fix-phase eval
      sensor: rsi
      measured: 2026-08-13
    - metric: ledger_invisible_fraction
      value: 0.2
      unit: fraction
      window: 2026-08-13 fix-phase eval
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## Second occurrence — hit directly while running the prescribed similarity judgment

Observed 2026-08-13 evaluating the `fix` phase of
`tactic-attention-namespaced-rank`.

`dispatch-eval-finding --list` returned **8** entries. `ls intentions/ | grep
tactic-eval-finding` returns **11** files. The three the ledger does not show:

- `tactic-eval-finding-ledger.md` (the family root — correctly absent)
- `tactic-eval-finding-lock-wait.md` — a real finding, `phase: done`, PR 3074
- `tactic-eval-finding-utc-bounds-local-newermt.md` — a real finding, and the
  *superseding* entry named in the body of `conflict-lane-registered-phantom`,
  which `--list` **does** show

That last one is the sharp edge. `--list` shows an entry whose own statement
says "Superseded by … `tactic-eval-finding-utc-bounds-local-newermt`", while
hiding the successor it points at. An evaluator following the documented
procedure — the SKILL calls the similarity judgment "the load-bearing step" —
reads a pointer to an entry the instrument will not show it.

This occurrence was only caught because this evaluator independently ran
`ls intentions/` while checking for pre-existing owners of two unrelated
candidate findings. Nothing in the prescribed procedure would have surfaced it.

Two of the ten real entries — 20 % of the ledger — are invisible to the tool the
SKILL designates as the sole input to the mint-or-reuse decision.

### What would have to change

`--list`'s filter on `attributes.ledger_entry` excludes entries that predate the
attribute or were minted by another path. Either backfill the attribute on the
existing `tactic-eval-finding-*` nodes, or widen `--list` to key on the id prefix
it already owns. The author's call which.

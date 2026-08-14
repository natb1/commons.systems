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
    - metric: duplicate_finding_nodes_same_defect
      value: 2
      unit: nodes
      window: stale-main-checkout selection gate defect, origin/main 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: finding_nodes_outside_ledger_namespace
      value: 1
      unit: nodes
      window: all commits with subject matching 'finding ledger entry', origin/main
        039bbe11
      sensor: rsi
      measured: 2026-08-13
    - metric: finding_nodes_without_recurrence_metric
      value: 3
      unit: nodes
      window: origin/main 039bbe11, 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: ledger_invisible_fraction
      value: 0.158
      unit: fraction
      window: origin/main 039bbe11, 2026-08-13 re-evaluation
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 3
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## Third occurrence — the predicted duplicate actually materialized, outside the id namespace

Observed 2026-08-13 re-evaluating the four findings this ledger received from the
`qa` phase of `tactic-attention-namespaced-rank`. The first two occurrences were
about entries that carry the `tactic-eval-finding-` id prefix but not
`attributes.ledger_entry`. This one is worse in two independent ways: the finding
node is outside the id prefix as well, and the duplicate the statement predicted
in the abstract now exists concretely.

### The duplicate pair

| Node | Minted | Recorded by | `attributes` | In `--list`? |
|---|---|---|---|---|
| `tactic-eval-finding-ladder-gate-stale-main-checkout-halt` | 2026-08-13 14:32Z (commit `66ed7f35`) | `dispatch-eval-finding` | `ledger_entry: true`, `first_seen`, `measured_impact` | yes |
| `tactic-provision-revalidation-reads-stale-main-checkout` | 2026-08-13 14:42Z (commit `0cd4f1da`) | a direct graph write | `{}` | **no** |

Ten minutes apart, same defect: `provision-node-worktree` re-validates a node
selection against `--dir "$PROJECT_ROOT/intentions"` — the main checkout's
working tree — after a bare `git fetch`, which moves refs and not the tree, so a
correct selection reads as `stale-selection` (exit 12). Both nodes cite the same
evidence: the same six refusals at 14:22:35Z–14:23:07Z on the same run.

`0cd4f1da`'s own commit subject is `graph: record finding ledger entry
provision-revalidation-reads-stale-main-checkout` — the writer believed it was
adding a ledger entry. The node it wrote is invisible to `--list` (no
`ledger_entry`), invisible to the `ls intentions/ | grep tactic-eval-finding`
fallback the second occurrence used (no prefix), and carries no
`recurrence_count` record at all, so no occurrence of that defect can ever be
counted against it.

### What the split cost

The fix landed as `43d13914` (#3079) on 2026-08-13, and its message says
`Fixes the defect recorded on the graph as
tactic-provision-revalidation-reads-stale-main-checkout` — the invisible
duplicate. The ledger entry that *is* visible, and that carries the two measured
impact figures and `recurrence_count: 2`, is named nowhere in the fix and remains
`open` with its fix already shipped. The recurrence metric and the remediation
came to rest on two different nodes, which is exactly the outcome the ledger's
merge discipline exists to prevent.

### Census at `origin/main` (039bbe11, 2026-08-13)

- 19 files match `intentions/tactic-eval-finding-*`; one (`-ledger`) is the
  doctrine root, so **18** are finding nodes.
- `dispatch-eval-finding --list` returns **16**.
- Invisible in-namespace: `tactic-eval-finding-lock-wait` (`attributes: {}`,
  `phase: done`, PR 3074) and `tactic-eval-finding-utc-bounds-local-newermt`
  (`attributes: {}`).
- Invisible out-of-namespace: `tactic-provision-revalidation-reads-stale-main-checkout`.
- So **19** finding nodes exist and **3** (15.8 %) are invisible to the
  instrument the SKILL designates as the sole input to the mint-or-reuse
  decision. All three carry `attributes: {}` — none of them can hold a
  recurrence count.

A sweep of every commit whose subject contains `finding ledger entry` finds
exactly one that wrote outside the prefix — `0cd4f1da` — so the out-of-namespace
case is currently a single instance, not a pattern. It is recorded here because a
single instance was enough to split a finding from its own fix.

### What would have to change

The prefix and the attribute are two spellings of one membership, and `--list`
honors only the attribute. Either the id prefix becomes the membership test (so
a hand-written node in the namespace is at worst missing metrics rather than
missing entirely), or `--list` reports the disagreement instead of silently
filtering it — a node matching the prefix without the attribute, or carrying the
attribute without the prefix, is a defect the instrument can see and its reader
cannot. Neither is applied here; this is a record, not a change.

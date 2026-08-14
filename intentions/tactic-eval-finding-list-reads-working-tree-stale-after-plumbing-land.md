---
id: tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land
kind: tactic
statement: dispatch-eval-finding --list reads the checkout working tree, but the
  plumbing writer never moves that checkout HEAD and restores node files to HEAD
  content after a verified land — so the ledger read path cannot see the ledger
  write path, and the similarity judgment mints duplicate slugs
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
  first_seen: 2026-08-14
  measured_impact:
    - metric: stale-list-rows
      value: 7
      unit: rows
      window: single-run
      sensor: dispatch-eval-finding --list vs git grep origin/main
      measured: 2026-08-14
    - metric: plumbing-lands-without-head-move
      value: 28
      unit: writes
      window: single-run
      sensor: dispatch-eval-finding stdout + git rev-parse
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: dispatch-eval-finding --list vs git grep origin/main
      measured: 2026-08-14
---
Recorded 2026-08-14 while retiring the fourteen slugs PR #3090 fixed. Measured,
not hypothesized: the under-report happened during that run and was mistaken for
data loss before ground truth was checked.

## The defect

`list_entries` reads the checkout's **working tree**:

```
.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:420-424
  const { listNodes } = await import("./packages/intentionsutil/src/store.js");
  const rows = listNodes(process.argv[1])   // $INTENTIONS_DIR — files on disk
```

The plumbing writer deliberately never moves the checkout's HEAD
(`build_commit_plumbing`, `packages/intentionsutil/scripts/graph-commit:1481`,
builds a commit reachable from no ref and scratch-pushes it), and
`clear_node_residue` restores the node files to **HEAD** content once
`verify_landed` confirms publication.

So after a successful plumbing land, the write is on `origin/main` and the files
on disk are back to their pre-write state. `--list` cannot see it. It reports the
ledger as it stood before its own writes, and keeps doing so until something
else moves that checkout's HEAD.

`dispatch-eval-finding` is the only opt-in plumbing caller, so the ledger's
read path structurally cannot see the ledger's own write path.

## The evidence

Twenty-eight consecutive plumbing lands (fourteen `--resolved-by`, fourteen
`--retire`) moved the main checkout's HEAD not at all. The post-run `--list`
reported **7 of 14** entries as still `open` with `resolved_by: NONE`. Ground
truth at `origin/main` at the same moment:

```
git grep -l '^phase: done' origin/main -- 'intentions/tactic-eval-finding-*'
  → 18 files
git grep -h -A1 '^  resolved_by:' origin/main
  → 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7 × 14
```

All fourteen had landed. Every row `--list` disagreed on was wrong.

## Why it is not cosmetic

`--list` is the input to the similarity judgment — the step that decides whether
a finding in hand is already recorded (see "JUDGMENT against the open ledger",
`dispatch-eval-finding:44-51`). A stale read answers "no such entry" for an entry
that exists, and the caller mints a near-duplicate slug. The header at `:402-412`
records that a real duplicate slug has already been minted once, by a different
mechanism; this is a second path to the same outcome.

`--list-retirable` inherits the same read through `list_entries` (`:538`), so the
"candidate list a human acts on" (`:292-293`) can present already-retired entries
as open and invite a double-write.

## Distinct from tactic-eval-finding-eval-finding-list-misses-nonledger

That entry — retired against `1092a403` — is the same **surface** and a different
**mechanism**. There, `--list` could not see an entry because membership was
filtered on `attributes.ledger_entry` alone; the fix widened membership to
prefix-OR-attribute (`:402-412`). Here, membership is decided correctly and the
entry is still invisible, because the **source** `list_entries` reads is a tree
the writer deliberately leaves behind.

Widening membership does not help a read whose input is stale. Both routes end at
a minted duplicate slug, which is why the surface looks identical; the remedies do
not overlap.

The existing mitigation does not cover this. `--list-retirable`'s header warns
that the **`origin/main` ref** may be stale ("it judges against the origin/main
ref this checkout already has, so fetch first"). The staleness here is in the
**node files**, which a fetch does not touch.

## The asymmetry that names the fix

`--list-retirable` already reasons about `origin/main` throughout, and the
script already carries the helpers for it — `origin_main_ref_ok` (`:495`) and
`origin_blob`, both used by every write path to obtain a trustworthy pre-write
blob. `--list` alone reasons about the tree.

Reading the ledger from the `origin/main` ref rather than from `$INTENTIONS_DIR`
would make the read path agree with the write path, reuse machinery that is
already there, and need no new state. The recurrence-record path at `:1066-1069`
is the precedent for the underlying principle — it already refuses to trust the
local copy when `origin/main` disagrees, calling that case "a recurrence this
checkout cannot see".

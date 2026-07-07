---
id: tactic-prune-conflict-recovery-silent-loss
kind: tactic
statement: "graph-commit's concurrent-edit conflict recovery must not silently
  drop a --prune: the snapshot/re-sync path preserves ordinary edit content but
  has no equivalent for a pruned id, so a deleted file can reappear after a park
  and the retry lands nothing for it"
owner: ai
status: raw
parent: null
rationale: "Deferred finding from the terminal review of PR #2790
  (tactic-graph-commit-prune-support, --prune/--base primitive) on the
  2026-07-07 emulated router tick. snapshot() deliberately skips PRUNE_IDS ('a
  prune id has no on-disk file to copy, and there is no writer-authored content
  to preserve for it'), which is correct for the ordinary success path. But
  graph-commit's conflict-recovery path re-syncs the tree to fresh origin/main
  on a concurrent-edit conflict and retries the land. For an ORDINARY id,
  SNAP_DIR holds the writer's content so the retry can re-apply it. For a PRUNE
  id there is nothing in SNAP_DIR to re-apply -- if the re-sync (a git
  reset/checkout to fresh origin/main) restores the file the writer had deleted,
  the retry's git add stages no change for that id (the file is back and
  untouched), silently dropping the prune from the write with no error.
  Concretely: writer A prunes tactic-X and tactic-Y in one graph-commit call; a
  concurrent writer B lands an edit to tactic-Y first; A's rebase conflicts; A's
  park/retry re-syncs to origin/main (tactic-X's file, still present there,
  reappears in A's tree); A's retry stages tactic-Y's edit but tactic-X's prune
  is now silently absent from what actually lands, with no error and no park
  record naming it. Fix candidates: (1) the retry re-deletes every PRUNE_IDS
  file after the re-sync, before re-staging (cheapest); or (2)
  check_base_freshness's --base CAS mechanism is required for every --prune call
  (a stale prune should refuse to land rather than silently vanish). Retained as
  a draft for /align-tactics to place -- likely a small addendum unit on
  tactic-graph-commit-prune-support itself (now phase: done) or a standalone
  tiny tactic per sole-tracker doctrine."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit prune + concurrent-edit conflict recovery: silent loss

## Context

Deferred finding from the terminal review of PR #2790
(`tactic-graph-commit-prune-support`, the new `--prune`/`--base` CAS
primitive), landed on the 2026-07-07 emulated router tick.

`snapshot()` deliberately skips `PRUNE_IDS` — a pruned id has no on-disk file
to copy and no writer-authored content worth preserving on the happy path.
That is correct for the ordinary success path. But `graph-commit`'s
concurrent-edit conflict recovery re-syncs the local tree to fresh
`origin/main` and retries the land. For an ordinary edit id, `SNAP_DIR` holds
the writer's content so the retry re-applies it after the re-sync. **For a
prune id there is nothing in `SNAP_DIR` to re-apply** — if the re-sync
restores the file the writer had deleted (because it was still present on
`origin/main` at the pre-conflict base), the retry's `git add` stages no
change for that id, and the prune silently vanishes from what lands. No
error, no park record naming it.

## Concrete failure scenario

1. Writer A calls `graph-commit --prune tactic-X --prune tactic-Y tactic-Z`
   (pruning X and Y, editing Z) in one invocation.
2. Concurrent writer B lands an edit to `tactic-Y` first.
3. A's rebase conflicts.
4. A's conflict-recovery path re-syncs to fresh `origin/main` — `tactic-X.md`
   and `tactic-Y.md`, still present there, reappear in A's tree.
5. A's retry re-stages `tactic-Z`'s edit correctly, but `tactic-X` and
   `tactic-Y`'s prunes are silently absent from the retry — no error, no park.

## Fix candidates

1. **Cheapest**: the retry re-deletes every `PRUNE_IDS` file from the
   re-synced tree before re-staging, so the prune re-applies exactly like an
   ordinary edit's `SNAP_DIR` content does.
2. **Stronger**: require `--base` CAS coverage for every `--prune` id — a
   prune whose base has moved refuses to land rather than silently vanishing
   (turns the silent-loss failure mode into the same loud "stale base" error
   `check_base_freshness` already gives ordinary edits).

Fix candidate 1 is the minimum bar; candidate 2 is the greenfield-correct
version and should be preferred if scope allows.

## Placement

Likely a small addendum unit on `tactic-graph-commit-prune-support` itself
(now `phase: done`) rather than a fresh standalone tactic — same script, same
owner, same test file. A standalone tiny tactic is acceptable under
sole-tracker doctrine if `/align-tactics` prefers to keep the done tactic
closed. `/align-tactics` decides placement.

## Verification

A test that: seeds two writers racing a `--prune` + a conflicting ordinary
edit against the same base, asserts the conflict-recovery retry either (a)
lands the prune correctly after the fix, or (b) refuses with a loud stale-base
error under fix candidate 2 — never a silent no-op.

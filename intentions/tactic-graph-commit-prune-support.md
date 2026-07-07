---
id: tactic-graph-commit-prune-support
kind: tactic
statement: "graph-commit: add --prune support and a base-version
  (compare-and-swap) freshness check so deletions and stale-read writes are
  handled by the sanctioned write path"
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-06 while splitting
  tactic-review-low-severity-sweep: graph-commit's existence guard
  (graph-commit:395) rejects a deleted node id, so a prune cannot ride the
  sanctioned write path — yet tactic-graph-native-dispatch section 1.1 says
  phase: done prunes the node and its edges in the same commit. The three
  2026-07-05 prune commits (a54f4ced, 1cf60e47, d1ee5df5) and the 2026-07-06
  sweep split each had to hand-orchestrate the graph/** fast-path push instead.
  Recorded as its own tactic rather than a unit of tactic-graph-commit-hardening
  because that tactic is at phase qa with PR 2778 in flight — adding scope to a
  nearly-merged PR would strand the unit. Extended 2026-07-06
  (concurrency-safety clarification on strategy-graph-native-dispatch): Unit 2
  adds the base-version check that makes read-fresh mechanical - motivated by
  the stale-dump near-miss on tactic-graph-commit-hardening during the doctrine
  round."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-commit-prune-support
  pr: 2790
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit: --prune support + base-version freshness check

## Context

`graph-commit` is the sanctioned single write path for `intentions/` edits,
but its existence guard rejects a node id whose file is deleted, so a prune
cannot land through it. Doctrine (`tactic-graph-native-dispatch` §1.1) says
`phase: done` prunes the node and its edges in the same commit. The three
2026-07-05 prune commits (`a54f4ced`, `1cf60e47`, `d1ee5df5`) and the
2026-07-06 `tactic-review-low-severity-sweep` split each hand-orchestrated
the `graph/**` fast-path push instead — replicating machinery graph-commit
already owns (scratch branch, check polling, ff-push, rebase retry).

## Unit 1 — --prune flag

**Recommended model:** sonnet

Scope:
- `packages/intentionsutil/scripts/graph-commit`: add `--prune <id>`
  (repeatable, mixable with ordinary positional ids). For a prune id the
  existence guard inverts — the file must NOT exist on disk but must exist
  in HEAD (`git cat-file -e HEAD:intentions/<id>.md`); staging stays
  `git add -- intentions/<id>.md`, which stages a deletion for a tracked
  missing file, so `commit_files` and `assert_staged_safe` need only accept
  the prune paths in the expected set.
- Rebase-retry interaction: on retry the snapshot restore
  (`SNAP_DIR`) must restore the *absence* of prune files (delete them again
  after checkout) — extend the snapshot logic to record prune ids.
- Dangling-edge repair stays the caller's job; graph validation on the
  resulting tree (fast-path CI) is the enforcement.
- Extend `packages/intentionsutil/scripts/test-graph-commit.sh` with a
  prune case: ordinary id + prune id in one call; assert the deletion and
  the edit land in one commit and the guard rejects a prune id still
  present on disk.

## Unit 2 — base-version freshness check (compare-and-swap)

**Recommended model:** sonnet

Scope:
- The read-modify-write flow (readNode dump -> patch -> write-node ->
  graph-commit) carries no record of the base the editor read; a stale dump
  relies on textual rebase luck to avoid clobbering concurrent state (the
  2026-07-06 near-miss: a stale dump of tactic-graph-commit-hardening vs its
  live phase: qa). Add an optional base manifest: the dump step records each
  node's blob SHA (git hash-object of the file read); graph-commit accepts
  `--base <id>=<blobsha>` (repeatable, or a manifest file) and, after its
  fetch, refuses the write if origin/main's blob for that path differs —
  clear re-read error, fail closed, per code-style.
- Sessions not passing --base keep today's behavior (opt-in until the align
  skills' dump helpers pass it automatically).
- Extend `test-graph-commit.sh`: stale base -> refusal; fresh base -> lands.

## Dependencies

None. (Coordinate mechanically with PR #2778 — `tactic-graph-commit-hardening`
touches the same script; whichever merges second rebases.)

## Verification

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

- Manual: prune a scratch node end-to-end on a throwaway branch (or observe
  the first real `phase: done` prune land through `graph-commit --prune`).

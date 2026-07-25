---
id: tactic-dispatch-test-monolith-split
kind: tactic
statement: Decompose test-dispatch-scripts.sh into per-script test files so
  parallel feature branches stop manufacturing merge conflicts on one shared
  31.5k-line file
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-25 concurrency/serialization review. The
  recurring provision-exit-11 merge-conflict parks trace disproportionately to
  this one file: every parallel dispatch-script feature adds cases to it, so
  branches conflict on test text rather than on genuinely contended behavior.
  Every intention node that references the file today proposes ADDING to it;
  none proposes splitting it."
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
# Decompose test-dispatch-scripts.sh into per-script test files so parallel feature branches stop manufacturing merge conflicts on one shared 31.5k-line file

## Context

Retained byproduct of the 2026-07-25 concurrency/serialization review
(`strategy-graph-native-dispatch`). Not yet planned.

`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` was 31,514
lines at recording time. Every parallel dispatch-script feature appends cases to
it, so concurrent branches conflict on test text rather than on genuinely
contended behavior — and those conflicts surface as provision-exit-11 parks,
which is how a file-layout choice becomes queue noise. Observed twice on one
branch this round: PR #2918 conflicted with `origin/main` on this file, was
resolved, and re-conflicted on it within minutes.

Every intention node that references the file today proposes ADDING to it
(`tactic-provision-worktree-script-tests`, `tactic-graph-select-target-node-tests`,
`tactic-graph-ref-split`); none proposes splitting it. So the conflict rate is
structurally increasing.

## Scope sketch (for /align-tactics, not a plan)

- In scope: per-script test files with a shared harness, so a change to one
  dispatch script touches one test file. `test-helpers.sh` already exists as the
  shared-harness seam, and the repo already has many focused siblings
  (`test-dispatch-derive-node-target.sh`, `test-graph-commit.sh`,
  `test-pid-cleanup.sh`, …) — the pattern is established; the monolith is the
  outlier.
- Sequencing note: this is a large mechanical move that will itself conflict
  with anything in flight. It wants a quiesced fleet, and it pairs naturally
  with landing PR #2918 (whose recurring conflict is on this file).
- Per `.claude/rules/test-integrity.md`: this is a MOVE, never a prune. Case
  count before and after must match exactly, and that equality is the
  verification.

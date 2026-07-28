---
id: tactic-node-scope-files-overlap-gate
kind: tactic
statement: "Declare a tactic's write set as machine-readable scope.files on the
  node and gate selection on it: the selector refuses to co-dispatch candidates
  whose declared write sets intersect"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-27 /align-strategy round (strategy
  clarification on the declared write set). Root cause of the 2026-07-25/26
  provision exit-11 storm on tactic-scope-fingerprint-plan-substance: worktree
  isolation keys on node id, so two tactics editing the same file are invisible
  to each other for as long as their branches stay unmerged. PR #2918 held a
  rewrite of .claude/skills/qa-fix/references/needs-main-followups.md for about
  9.5h while main took 41 commits. The author chose a hard selection gate over
  an advisory variant this round; the scope.files field is also the prerequisite
  tactic-code-diff-scope-custody compares its diff against. Awaiting an
  /align-tactics round to finalize."
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
# Declare a tactic's write set as machine-readable scope.files on the node and gate selection on it: the selector refuses to co-dispatch candidates whose declared write sets intersect

## Context — the failure this prevents

Worktree isolation keys on **node id**: one worktree per node, liveness detected
as live session <=> worktree (`strategy-graph-native-dispatch` body, §Worktree
Claiming & Liveness). Two tactics that write the *same file* are therefore not in
conflict as far as the router is concerned, and nothing anywhere in the graph
records which files a tactic intends to touch — the plan body carries only prose
`path:line` anchors, which no machinery reads.

The consequence is that an unmerged branch is an **invisible write set**.
`origin/main` is the only surface on which two in-flight tactics can see each
other, so for as long as a branch stays unmerged its edits are undetectable to
every other tactic. Measured instance (2026-07-25/26): PR #2918 held a rewrite of
`.claude/skills/qa-fix/references/needs-main-followups.md` for about 9.5h while
`origin/main` took 41 commits. A second tactic corrected the same paragraph in the
opposite direction. The collision surfaced only at
`provision-node-worktree`'s pre-worker merge — exit 11 — which is a deadlock, not
a transient: the only actor who could resolve the conflict is the worker that
provisioning refuses to start. 28 exit-11 events since 2026-07-15, 9 on 07-25
alone.

## Target behavior (author-decided 2026-07-27)

- **`scope.files` on the node** — a machine-readable declared write set, authored
  at `/align-tactics` time alongside the plan's prose anchors. Shape (glob list vs
  literal path list vs both) is an open question for the finalizing round.
- **Hard gate at selection.** The selector refuses to co-dispatch a candidate
  whose declared write set intersects any in-flight tactic's, deferring the loser
  to a later tick. The author explicitly chose this over an advisory /
  rank-penalty variant: detection at provision time *is* the exit-11 hold this
  exists to prevent, so prevention has to bind at **selection**, before a second
  branch is ever cut.

## Known risk the finalizing round must address

`scope.files` starts out **author/agent-declared**, so it will sometimes be wrong
or incomplete. A hard gate on a wrong declaration starves the queue (false
blocking) or fails to prevent (false clearing). Candidate mitigations to weigh:
seed the declaration from the plan's `path:line` anchors; widen it automatically
from the observed diff (the sibling
[[tactic-code-diff-scope-custody]] already computes that diff); treat a
declaration-vs-diff mismatch as a review finding rather than a hard failure.

## Relationship to sibling work

[[tactic-code-diff-scope-custody]] is `blocked_by` this tactic — a diff-level gate
needs a declared scope to compare against. It is not merely sequenced: `scope.files`
is a shared prerequisite, and the two tactics are the prevent- and detect- halves
of one mechanism.

## Open questions for /align-tactics

1. `scope.files` shape: globs, literal paths, or both? Does a directory entry
   imply its subtree?
2. Where does the intersection check bind — `router.ts`'s candidate loop, or the
   `graph-select-target` shell gate? What is the in-flight set (nodes with a
   non-null `execution.branch`? a live worktree? both)?
3. Does a deferred candidate need any recorded state (a skip reason in the
   selection log) or is silent deferral to the next tick sufficient?
4. Does the gate apply to the `intentions/`-only graph-commit lane at all, or only
   to code-carrying phases? (Graph writes already serialize on
   `refs/graph/landing-lock`.)

---
id: tactic-graph-write-recipes-base-cas
kind: tactic
statement: Graph-write completion recipes must pass graph-commit's --base
  compare-and-swap so a write from a stale local worktree cannot silently
  clobber sibling frontmatter fields that advanced on origin/main.
owner: ai
status: raw
parent: null
rationale: "Observed 2026-07-22 on tactic-thin-oversized-skill-bodies (PR
  #2927). The fix-checks node-lane completion records a pushed sha via
  `apply-fix-state --record-push` + `graph-commit`. Commit 91c9cb1d, whose
  message is `record fix push 97917093...` and which should have changed only
  `execution.fix.pushed_sha: null -> 97917093...`, ALSO silently reverted
  `blocked_by: [tactic-flake-park-node-concurrent-write-refusal] -> []`,
  dropping a suppression link that the prior iteration had already landed on
  origin/main (commit 33aa5ab8). This is NOT a defect in apply-fix-state
  --record-push, which is field-precise: apply-fix-state.ts:202 does
  `node.execution = { ...execution, fix: { ...currentFix, pushed_sha: sha } }`,
  preserving everything readNode returned. The clobber is the
  stale-local-worktree class: the worker read its LOCAL intentions/<id>.md
  (which never picked up the blocked_by that iteration 1 landed on main), set
  pushed_sha, and graph-commit rebuilt the WHOLE file onto origin/main.
  graph-commit does whole-file replacement, so the field that advanced on main
  reverted to the stale local value with no textual conflict and no error. The
  fixing primitive already exists: graph-commit supports `--base <id>=<blobsha>`
  (a compare-and-swap that refuses to land if the blob moved on origin/main
  after a fetch) plus a layer-2 rebase-conflict field merge. But the completion
  recipes omit --base -- the header's own words, `Omit entirely to keep pre-CAS
  behavior` -- so the pre-CAS silent-clobber path is live for every caller that
  does readNode(local) -> writeNode -> graph-commit without a --base manifest.
  Greenfield fix: every graph-write completion/park/transition recipe passes a
  --base CAS manifest pinned to the origin/main blob it read. Concretely: (1)
  the fix-checks node-lane record-push + graph-commit in
  .claude/skills/fix-checks/SKILL.md; (2) audit park-node and transition-node
  for the same omission -- both do readNode(local) -> writeNode -> graph-commit,
  and project notes record park-node reverting body revisions and
  transition-node reverting office_hours from stale PR-branch worktrees (same
  class). Sole-tracker relation: sibling
  tactic-prune-conflict-recovery-silent-loss covers the --prune path of this
  same silent-loss class; this tactic covers the ordinary field-write path.
  Prior fix tactics named in project notes
  (tactic-park-node-fresh-main-clobber-fix,
  tactic-graph-commit-auto-serialization) no longer exist on origin/main -- the
  --base primitive shipping absorbed the general-primitive tactic -- leaving
  this caller-side gap (recipes not passing --base) untracked. The observed
  instance was benign because the clobbered link pointed at a mis-filed flake
  node whose work was already done by 13f1206a, but the clobber is a real latent
  defect that will silently revert genuine concurrent field advances."
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
# Graph-write completion recipes must pass graph-commit's --base compare-and-swap so a write from a stale local worktree cannot silently clobber sibling frontmatter fields that advanced on origin/main.

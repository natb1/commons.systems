---
id: tactic-fix-checks-pushed-nothing-base
kind: tactic
statement: "fix-checks node-lane: the pushed-nothing completion branch still
  runs graph-commit without --base CAS — extend the write-recipes-base-cas
  pattern to that branch"
owner: ai
status: raw
parent: null
rationale: "Residual of tactic-graph-write-recipes-base-cas: its Unit 1 fixes
  the record-push completion recipe, but the branch that pushed nothing still
  graph-commits stale-unguarded (sites near
  .claude/skills/fix-checks/SKILL.md:108 and :122 as of 2026-07-23). Dedup
  against that node PR #2939 landed scope at finalization."
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
# fix-checks node-lane: the pushed-nothing completion branch still runs graph-commit without --base CAS — extend the write-recipes-base-cas pattern to that branch

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

tactic-graph-write-recipes-base-cas Unit 1 (PR #2939) fixes the record-push completion recipe (`--base` + refresh + corrected graph-commit path). The branch that pushed NOTHING still runs `graph-commit` without `--base`, so a stale local worktree can clobber sibling frontmatter that advanced on origin/main. Sites near `.claude/skills/fix-checks/SKILL.md:108` and `:122` as of 2026-07-23 (line numbers drift — locate by the graph-commit invocations in the node-lane completion recipe). Dedup against that node's landed scope at finalization.

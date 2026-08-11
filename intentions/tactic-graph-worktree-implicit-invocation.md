---
id: tactic-graph-worktree-implicit-invocation
kind: tactic
statement: A graph-operation wrapper that resolves the target node worktree
  itself, so sessions stop restating absolute `.claude/worktrees/<id>` paths in
  every Bash call
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-11 in the same /align round. Measured: 1,612 of
  8,728 Bash calls in the 2026-08-10/11 corpus (18%) restate a worktree path via
  `cd .../worktrees/<id>` or `git -C .../worktrees/<id>`, 1,632 occurrences. The
  restated path carries no information — the node id already determines the
  worktree — so this is pure per-call byte tax. It also buys correctness, not
  only tokens: it closes the recorded failed-cd hazard where a `cd` that fails
  drops the session into the main checkout and subsequent mutating git
  operations hit main instead of the worktree."
reading: null
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
# A graph-operation wrapper that resolves the target node worktree itself, so sessions stop restating absolute `.claude/worktrees/<id>` paths in every Bash call

---
id: tactic-graph-read-at-ref-cli
kind: tactic
statement: Expose storeAtRef as a CLI — read node fields and query nodes by
  predicate at a git ref (default origin/main) — so the doctrine-mandated fresh
  read has a scripted path instead of hand-rolled `git show
  origin/main:intentions/<id>.md` plus sed
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-11 in the /align round that widened the
  mechanical-floor doctrine to session-facing graph operations. Highest measured
  yield of the four primitives retained that round. storeAtRef
  (packages/intentionsutil/scripts/lib-store-at-ref.ts) already exists and has
  five script consumers (office-hours-select.ts, read-sensors.ts, verify-landed,
  render-rsi-plan.ts, and its own test), but there is NO CLI, while dump-node.ts
  resolves its store from import.meta.url and so reads the worktree copy. The
  gap is therefore structural: doctrine repeatedly mandates reading at
  origin/main and no script can do it, so every compliant read is hand-written
  shell. Measured in the 2026-08-10/11 corpus: 270 Bash calls hand-rolled `git
  show origin/main:intentions/`, 369 occurrences; sessions were observed writing
  full-graph scans as bash loops over `git ls-tree` plus per-node `git show`
  plus `sed`. The query half (phase, blocked_by, serves, body match) is what
  those loops were reimplementing per session."
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
# Expose storeAtRef as a CLI — read node fields and query nodes by predicate at a git ref (default origin/main) — so the doctrine-mandated fresh read has a scripted path instead of hand-rolled `git show origin/main:intentions/<id>.md` plus sed

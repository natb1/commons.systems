---
id: tactic-align-init-rename-stale-node-refs
kind: tactic
statement: Fix stale .claude/skills/align/ path references left in intention
  node bodies after the /align -> /align-init skill rename (e.g.
  tactic-sync-reader-skill body pointer to align/SKILL.md,
  tactic-dispatch-script-hardening body pointer to
  align/scripts/gather-context.sh)
owner: ai
status: raw
parent: null
rationale: "Deferred (low-severity, out-of-sweep-scope) findings from the
  terminal review of PR #2781 (tactic-align-init-skill) during the 2026-07-07
  graph-native router tick: the reference sweep was scoped to code, not
  intentions/ node bodies. One of the two refs is also captured as a main-qa
  residue on tactic-align-init-skill."
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
# Fix stale .claude/skills/align/ path references left in intention node bodies after the /align -> /align-init skill rename (e.g. tactic-sync-reader-skill body pointer to align/SKILL.md, tactic-dispatch-script-hardening body pointer to align/scripts/gather-context.sh)

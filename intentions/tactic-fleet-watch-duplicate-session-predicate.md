---
id: tactic-fleet-watch-duplicate-session-predicate
kind: tactic
statement: dispatch-fleet-watch gains a sixth predicate that counts live
  sessions per node worktree and routes any node carrying more than one to the
  invalid-state lane as kind duplicate-session — the single detection home for
  concurrent sessions, so no dispatch phase skill ever carries a concurrency
  guard
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-08-05 /align concurrent-session interview; the
  DETECTION half of that round (resolution is
  tactic-duplicate-session-mechanical-resolution, prevention is
  tactic-graph-execute-claimless-manual-launch). The watcher is the right home
  because it already is the fleet's one health-predicate surface and already
  turns every finding into a graph node through dispatch-fleet-alarm, so this
  reuses an existing detect-and-mint path rather than adding one. Ground
  measured during the interview: dispatch-fleet-watch is COMPLETE and live (a
  one-shot on a five-minute systemd timer; its own header names the five
  predicates as tick-stale, daemon-degraded, busy-stall, automerge-suppressed
  and unclaimed-hold), so the requirement's framing of it as partially
  implemented was wrong — the only gap is that no predicate counts sessions per
  node. The primitive already exists: claude_sessions_under <worktree-path> in
  lib-claude-agents.sh returns the sessions under a worktree, and predicate 5
  (unclaimed-hold) already probes per-candidate worktrees, so the shape to copy
  is in the same file. TWO PROPERTIES THE SCRIPT'S OWN HEADER MAKES BINDING and
  which this predicate must not break: every predicate is evaluated on every
  pass and the pass never exits on the first violation (the scratch predecessor
  returned at the first finding and silently stopped every later predicate); and
  an unreadable input is `unknown`, never `clear` — a duplicate probe that
  cannot read the session registry must raise watch-unknown, never report
  no-duplicates. That second property is load-bearing here because `claude
  agents --json` returns an empty array indistinguishably from a genuine
  no-sessions result when run sandboxed, so the caller must run sandbox-off and
  an empty read must be treated as unknown rather than clear. Note the two
  independent registry views the header documents (ACTIVE via claude agents
  --json versus REGISTERED via --all): a stopped-but-registered session still
  holds the node under worktree_has_live_session, so the duplicate count must be
  taken over the REGISTERED view or it will miss exactly the case that matters."
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
# dispatch-fleet-watch gains a sixth predicate that counts live sessions per node worktree and routes any node carrying more than one to the invalid-state lane as kind duplicate-session — the single detection home for concurrent sessions, so no dispatch phase skill ever carries a concurrency guard

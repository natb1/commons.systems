---
id: tactic-graph-commit-landing-signal-unreliable
kind: tactic
statement: graph-commit and clear-park must emit a trustworthy landing signal --
  today both the exit code and the log text can each report the opposite of what
  actually landed, so no caller can tell a landed write from an orphaned one
  without re-parsing origin/main
owner: ai
status: raw
parent: null
rationale: "Measured three times in a single session on 2026-08-05 (bootstrap
  monitor pass), in BOTH directions. Direction A -- false failure: a run exited
  144 with its commit created locally but never pushed, leaving an orphaned
  commit that had NOT reached origin/main while the caller saw a non-zero exit.
  Direction B -- false success signal inverted: a run whose log ended `[remote
  rejected] ... landing-lock ... already exists`, which reads unambiguously as a
  failure, had in fact ALREADY LANDED the write on origin/main. Apparent cause
  in both: a background wrapper killed while graph-commit blocks waiting on a
  contended refs/graph/landing-lock, so the process dies at an indeterminate
  point in a sequence that is not atomic across local-commit / lock-acquire /
  push / lock-release. Cost today: every caller must independently re-fetch and
  PARSE origin/main to learn what happened (this is invariant I2 of the
  bootstrap plan, and it exists solely because of this defect); the tribal
  remedy is `git reset --hard origin/main` in the graph worktree and re-run,
  with a standing rule never to push the orphan. That rule is unwritten,
  unenforced, and one wrong push away from a lost-update. Remedy shape: make the
  landing signal authoritative -- either an atomic land-or-fail with a signal
  derived from the post-push remote state rather than from local exit status, or
  an explicit machine-readable verdict the caller can trust without re-parsing.
  Dedup: a find-or-create check over the 514-node graph found NO owner. The
  three nearest nodes are all phase:done and each covers a DIFFERENT cause --
  tactic-graph-commit-noop-landing-false-failure (a no-op run reporting a false
  'main busy'), tactic-graph-commit-staleness-silent-revert (a missing -C
  producing a false POSITIVE), and tactic-graph-commit-landing-lock (the lock
  ref's own lifecycle). None addresses the exit-code-and-log-both-lie failure
  mode under a killed wrapper."
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
# graph-commit and clear-park must emit a trustworthy landing signal -- today both the exit code and the log text can each report the opposite of what actually landed, so no caller can tell a landed write from an orphaned one without re-parsing origin/main

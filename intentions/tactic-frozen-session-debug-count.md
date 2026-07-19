---
id: tactic-frozen-session-debug-count
kind: tactic
statement: Minimal operator-visible count of node-worker sessions held-for-debug
  (non-transitioned, non-parked terminal exits kept alive by the narrowed
  auto-close default) so frozen-node accumulation is visible
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-19 /align-strategy interview (reap-scope-narrowing
  clarification, resolution (c)). The narrowed auto-close default keeps every
  non-transitioned, non-parked terminal exit alive for local debugging, which —
  by design — freezes the node (worktree_has_live_session stays TRUE) until
  manual reap. The author chose 'yes — minimal count' over 'no new surface' so
  silent accumulation of frozen nodes does not go invisible. Draft;
  /align-tactics plans it.
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
# Minimal operator-visible count of node-worker sessions held-for-debug (non-transitioned, non-parked terminal exits kept alive by the narrowed auto-close default) so frozen-node accumulation is visible

Draft context retained from the 2026-07-19 /align-strategy interview
(reap-scope-narrowing clarification on `strategy-graph-native-dispatch`,
resolution (c)). Not yet decomposed — `/align-tactics` plans it into PR-sized
units.

## Problem

The reap-scope-narrowing clarification keeps every non-transitioned,
non-parked terminal exit (hard crash, error, silent no-progress exit) alive
for local debugging until an operator manually reaps it. By design that
freezes the node: the kept session keeps `worktree_has_live_session` TRUE, so
the router will not re-select the node and the no-progress fuse will not count
re-selections. These failures are deliberately NOT parked to office-hours, so
they never appear on the office-hours PARKED panel — there is no dashboard
signal that they exist. Without any surface, frozen nodes could accumulate
invisibly (the author chose "yes — minimal count" over "no new surface" for
exactly this reason).

## Design intent (from the interview; scope for /align-tactics)

- **A count, not a channel.** Surface a minimal operator-visible COUNT of
  sessions held-for-debug — jobs in `claude agents --json` whose node worker
  terminated without a transition or a park and were kept alive. It reports the
  count (and, at most, the node ids), never session content.

- **Must not re-couple observability to session persistence.** This is a
  GC/hygiene metric, not a recovery substrate and not an escalation channel.
  Real escalations still park to office-hours and surface via the PARKED
  panel; recovery still never resumes from a kept session (session
  attach/resume is not a supported recovery path). The count only tells an
  operator "N nodes are frozen for debug" so accumulation is not silent —
  consistent with the disposable-session doctrine's actual concern (that
  session persistence never become the router's substrate or the observability
  channel), which a bare count does not violate.

- **Where it reads from.** The set of held-for-debug sessions is derivable from
  the same liveness source the reap gate uses — a live job whose node did not
  transition or park on its last terminal exit. `/align-tactics` decides the
  concrete surface (a sensor reading, a dispatch-status line, the office-hours
  dashboard, or a CLI count) and the exact "held-for-debug" predicate.

## Related nodes

- `tactic-graph-node-session-reap` — adds the node-lane reap in the first
  place; its Unit 2 (sweep-reap of mid-phase-dead orphaned jobs) reverses under
  the narrowed default and must be re-planned. This count and that re-plan are
  naturally planned together (the "held-for-debug" predicate is the complement
  of "reaped").
- `tactic-worker-self-close-configurable` — the default-off keep-ALL toggle,
  which layers on top of the narrowed default; its draft framing must be
  re-scoped to the narrowed default.

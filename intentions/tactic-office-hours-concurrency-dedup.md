---
id: tactic-office-hours-concurrency-dedup
kind: tactic
statement: "office-hours-select gains liveness-based concurrency dedup mirroring
  graph-select-target: the graph-native office-hours lane runs in the node-id
  worktree, an untargeted launch skips a parked node with a live office-hours
  session and returns the next-ranking parked node, and an explicit target on a
  live-session node errors"
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-18 office-hours-concurrency interview.
  selectOfficeHours (packages/intentionsutil/src/officeHours.ts) currently sorts
  parked nodes by attention rank with no live-session or claimed-set filter, so
  a concurrent office-hours launch returns the same queue head — no dedup. The
  graph-native office-hours lane is also read-only report-and-stop and does not
  occupy the node-id worktree, so there is no live-session signal to detect.
  This brings office-hours to parity with the worker selector's liveness-based
  dedup (the target-state mechanism confirmed this round).
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
# office-hours-select gains liveness-based concurrency dedup mirroring graph-select-target: the graph-native office-hours lane runs in the node-id worktree, an untargeted launch skips a parked node with a live office-hours session and returns the next-ranking parked node, and an explicit target on a live-session node errors

**Draft** — byproduct of the 2026-07-18 office-hours-concurrency interview
(doctrine home: that date's clarification on `strategy-graph-native-dispatch`,
"Does dispatch's concurrency dedup key on live sessions or worktree existence…").
Input to a later `/align-tactics strategy-graph-native-dispatch` round.

## Context

Requirement (author, 2026-07-18): office-hours sessions must be safe for
concurrent selection — running the office-hours script while an office-hours
session is already in progress selects the next-ranking office-hours node,
using the same concurrency mechanism as dispatch worker sessions. That
mechanism is confirmed to be liveness-keyed (reservation-ledger marker OR
`worktree_has_live_session`), not worktree existence; reaping is decoupled
post-merge hygiene.

Current gap:
- `selectOfficeHours` (`packages/intentionsutil/src/officeHours.ts:88-108`) and
  `officeHoursQueue` (`:78`) order parked nodes purely by resolved attention
  rank / id, with **no** live-session or claimed-set filter — a second launch
  returns the same queue head.
- The graph-native office-hours lane is read-only "report-and-stop"
  (`.claude/skills/office-hours/SKILL.md` graph lane, ~lines 308-378) and does
  **not** occupy the node-id worktree, so there is currently no live-session
  signal for a dedup to key on.

## What changes

1. **Office-hours runs in the node-id worktree.** The graph-native office-hours
   lane enters `.claude/worktrees/<node-id>` for its session's life (like a
   worker), so `worktree_has_live_session` detects it. The worktree is
   disposable — office-hours lands no commit, so it is reaped like any worker's
   (`dispatch-sweep`), never blocking future selection once the session ends.
2. **Untargeted select dedups to next rank.** `selectOfficeHours` with no
   target skips a parked node that already has a **live** office-hours session
   (keyed on liveness, not worktree existence — a stale/un-reaped worktree must
   not hide a node from the queue) and returns the next-ranking parked node.
3. **Explicit target on a live-session node ERRORS.** `/office-hours <node-id>`
   whose target already has a live office-hours session returns an error
   disposition (a new `OfficeHoursSelection` kind, e.g. `held`) — a deliberate
   human target on an occupied node is a collision to surface, not a silent
   fall-through. (Author direction, 2026-07-18.)

## Surfaces to change

- `packages/intentionsutil/src/officeHours.ts` — `selectOfficeHours` /
  `officeHoursQueue` gain a liveness/claimed-set predicate (injected, to keep
  the module pure — the caller passes the live-session set, mirroring how
  `graph-select-target` derives its claimed set). New selection kind for the
  targeted-held error.
- `packages/intentionsutil/scripts/office-hours-select.ts` — pass the live
  claimed set (from `claude agents --json` via the shared helper) into the
  selector; propagate the held-error exit.
- `.claude/skills/office-hours/SKILL.md` — the graph lane gains a claim/isolate
  step (enter the node-id worktree) and documents the untargeted-skip /
  targeted-error semantics.
- The `office-hours-graph` entry script — provision/enter the node-id worktree;
  reap on exit.

## Reuse

- `worktree_has_live_session` / `claude_sessions_under` —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`
- `graph-select-target`'s liveness claimed-set derivation (`:245-255`) — the
  exact pattern to mirror.
- `dispatch-sweep` — post-merge/disposable worktree reaping.

## Verification

- Unit: two parked nodes; assert an untargeted `selectOfficeHours` with the
  queue head marked live-claimed returns the second node; assert an explicit
  target on a live-claimed node returns the held-error kind.
- Manual: launch office-hours (untargeted), then a second office-hours launch
  while the first is live; confirm the second selects the next-ranking parked
  node. Launch `/office-hours <live-node-id>`; confirm the error.

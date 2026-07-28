---
id: tactic-worker-self-close-configurable
kind: tactic
statement: "Make worker-session auto-close configurable via a default-off
  operator escape hatch on the shared self-close primitive (default:
  auto-close)"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-19 /align-strategy interview
  (configurable-auto-close clarification on strategy-graph-native-dispatch). The
  2026-07-16 reaping clarification reaps a worker session on every terminal
  exit; the author wants an off-by-default toggle to KEEP a completed/parked
  session for local inspection/debugging, without weakening the
  disposable-session doctrine (the toggle is never router substrate). Carries
  the implementation design decided in the interview: symmetric suppression,
  shared-primitive placement, unchanged foreground gate, and the documented
  worktree-claim-hold consequence."
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
# Make worker-session auto-close configurable via a default-off operator escape hatch on the shared self-close primitive (default: auto-close)

Draft context retained from the 2026-07-19 /align-strategy interview. Not yet
decomposed — this body carries the design; `/align-tactics` plans it into
PR-sized units. Related: `tactic-graph-node-session-reap` (which adds node-lane
reaping in the first place — this toggle gates that reap and the legacy one
alike; the two are sequenced together because the config check lives in the same
code path the reap runs through).

**Re-scoped 2026-07-26 (/align-strategy).** This body previously assumed the
default was "reap on **every** terminal exit". That premise was superseded the
same day it was written, by the 2026-07-19 reap-scope-narrowing clarification on
`strategy-graph-native-dispatch`, which explicitly records that this draft "must
be re-scoped to the narrowed default". The narrowed default is: **reap iff the
session ended in a phase progression/retry or an escalation-park; every other
terminal exit is KEPT.** The sections below are corrected to it. The toggle's
mechanism is unchanged — only the baseline it modifies moved.

## Problem

`dispatch-self-close`
(`.claude/skills/dispatch-propagate/scripts/dispatch-self-close` → `claude rm
<job-id>`) auto-closes a completed worker's background job. Under the narrowed
default it reaps **only** the two clean terminal states — a phase
progression/retry, or an escalation-park — because those two write something
durable (the transition advanced the node's phase; the park wrote `office_hours`
into the node), so reaping loses nothing. Every other terminal exit — a hard
crash, an error exit, or a clean-but-no-transition/no-progress exit — is already
KEPT for local debugging, because such an exit was never parked to office-hours
and the live session is its only debugging artifact.

The gap this tactic closes is the remaining case: an operator debugging a
session that DID transition or park has no way to keep it, short of racing the
Stop hook. The interview added a default-off escape hatch that layers on top of
the narrowed default — when enabled, the transitioned/parked sessions the
default would reap are kept too.

## Design (decided in the 2026-07-19 interview; scope for /align-tactics)

- **Default-off toggle, auto-close is the default.** A config flag, default
  `true` (auto-close). When `false`, worker sessions are kept (not `claude rm`'d)
  on terminal exit. The default preserves today's behavior exactly, so no live
  behavior changes until an operator flips it.

- **Symmetric suppression — both clean-advance and escalation-park.** When the
  toggle is ON (keep), suppress the reap on BOTH a phase progression/retry and
  an escalation-park. When OFF (default), both reap. One uniform switch,
  matching the plain reading of "auto-close worker sessions."

- **The toggle's blast radius is exactly those two states.** It cannot make
  behavior *more* aggressive than the narrowed default: sessions that end with
  neither a phase progression/retry nor a park are **never** reaped, regardless
  of this flag, because they must remain available to debug. The flag therefore
  only ever moves sessions from "reaped" to "kept", never the reverse
  (2026-07-26 re-scope).

- **Placement — the shared primitive.** Put the check inside `dispatch-self-close`
  itself (not in a lane-specific branch), so BOTH the legacy gh issue-worker lane
  and the graph-native node-worker lane honor one config point. Legacy
  self-removes as the gh queue drains, so a single shared gate is cheapest and
  uniform. NB: the node-lane reap that `tactic-graph-node-session-reap` adds must
  route through this same gated primitive, not a separate `claude rm`.

- **Foreground-safe gate unchanged.** The `CLAUDE_JOB_DIR`-unset no-op gate is
  untouched — only managed background worker jobs are ever affected; interactive
  `/align` and `/office-hours` human sessions are never auto-removed and are
  never subject to the toggle either.

- **Router-continuation invariant preserved.** The toggle only changes whether a
  worker's OWN job is reaped after its continuation (a `transition-node` /
  `park-node` write, and for the legacy lane the `spawn_router`/reseed) has
  already run. It must NOT be read as license to skip the continuation, and it
  must NOT touch the ROUTER self-close continuation-invariant path (the
  `dispatch-*` session-name branch) — that path is about chain liveness, not
  operator inspection. Keep the two concerns separate.

- **Documented consequence — the claim-hold (endorsed in the interview).** A
  kept-alive session keeps `worktree_has_live_session` TRUE, so the node-id
  worktree claim stays held and the router will NOT select that node's next
  phase until the operator manually reaps the session (`claude rm <job-id>` by
  hand). This is inherent to a debug hold — you are inspecting the exact
  worktree state — and leaving the toggle ON stalls every affected node. The
  plan should surface this prominently (a one-line caution wherever the flag is
  documented) so it is not switched on and forgotten.

## Config location (recommendation, not yet decided — /align-tactics finalizes)

A field in the existing `dispatch.config/` directory (the home of
`target-workers.json`, `auto-merge.json`, `phase-model-policy.json`) reads most
naturally — e.g. a new `dispatch.config/worker-sessions.json` `{"auto_close":
true}`, or an `auto_close` field folded into an existing lifecycle config.
`dispatch-self-close` already reads env overrides for testability
(`DISPATCH_SELF_CLOSE_CLAUDE_CMD` etc.), so an env override for the flag (e.g.
`DISPATCH_AUTO_CLOSE_WORKERS`) is a natural test seam alongside the config file.
Default must resolve to auto-close when the config file is absent (clear-error /
sensible-default: absence = the documented default, not a failure).

## Verification (for the eventual plan)

- With no config change (default), a node worker that ended in a phase
  progression/retry has its job reaped on Stop — `claude agents --json` shows no
  lingering entry.
- With no config change (default), a worker that exited with NEITHER a phase
  progression/retry NOR a park (crash, error, or clean-but-no-progress) is
  **kept** — its job entry and its node-id worktree both remain — and flipping
  the toggle either way does not change that.
- With the toggle OFF (keep), after a node worker completes a phase its job
  REMAINS in `claude agents --json`, the node's persisted phase still advanced on
  origin/main, and the node's worktree claim is still held (next phase not
  selected) until a manual `claude rm`.
- With the toggle OFF, an escalation-parked worker likewise remains, and the
  node's `office_hours` is set (durable before any reap decision).
- Interactive `/align` / `/office-hours` sessions are never reaped regardless of
  the toggle (`CLAUDE_JOB_DIR` gate).
- The legacy gh issue-worker lane honors the same flag (shared primitive).

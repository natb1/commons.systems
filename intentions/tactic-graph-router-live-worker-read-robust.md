---
id: tactic-graph-router-live-worker-read-robust
kind: tactic
statement: The router's live-worker read tolerates an empty or partial `claude
  agents --json` result — a momentary undercount neither inflates spawn headroom
  nor lets the per-node occupancy check skip a node that already has a live
  worker — closing the duplicate-dispatch path that put two /implement workers on
  one node and one worktree
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-21: a manual dispatch tick launched a SECOND
  /implement worker for tactic-primary-checkout-main-guard while a worker was
  already live in that node's worktree — `claude agents --json` showed two busy
  sessions (pids 139471, 164656) sharing one checkout. The tick's fan-out printed
  `live=1` though at least 6 workers were live (the immediately-prior tick alone
  had launched 6). Root cause (code read): dispatch-select-tick's --manual branch
  computes LIVE_COUNT = claude_agents_count_busy_workers + reservation_count
  (dispatch-select-tick:684-686), and the downstream per-node occupancy exclusion
  (worktree_has_live_session) reads the SAME `claude agents --json` source. That
  read is known-unreliable: the daemon Unix socket is blocked under sandbox and
  returns an empty `[]` indistinguishable from a genuine no-sessions result (see
  .claude/rules/sandbox.md, `claude agents --json` section), and sessions.json is
  roughly 50% stale. A single empty/partial read therefore both inflates HEADROOM
  (MAX_WORKERS-1 → over-spawn) AND makes the per-node check miss the already-live
  worker, so a top-ranked node gets dispatched twice. This complements
  tactic-graph-router-live-worker-visibility (the --standalone lock+headroom+claim
  cycle, PR #2918): that closes the missing-lock / missing-headroom path for
  external manual/emulated callers; this hardens the underlying live-worker READ
  that BOTH the count and the per-node dedup trust, so an undercount cannot defeat
  the fleet count or the per-node occupancy exclusion even through the locked
  daemon path. blocked_by that tactic so it lands on top of the --standalone mode
  rather than racing it. Author-directed 2026-07-21: filed as a new dependent
  tactic (not folded into the mid-QA router-visibility node) and boosted to top
  rank."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 85
  override: null
  rationale: "Author-directed 2026-07-21: boost to top ranking. This is the
    durable fix for the 2026-07-21 duplicate-dispatch incident (two live
    /implement workers on tactic-primary-checkout-main-guard's single worktree)
    — the router trusts a fragile point-in-time `claude agents --json` read for
    both fleet headroom and per-node dedup, and one empty/partial read let a
    top-ranked node be dispatched twice. Sized at 85 — above the live
    discretionary composed max (80.00, tactic-primary-checkout-main-guard) so this
    tactic serving strategy-graph-native-dispatch becomes the top discretionary
    dispatch target — and kept below the strategy-main-health ceiling (100,
    author-override-guarded), which it must not displace. The blocked_by edge to
    tactic-graph-router-live-worker-visibility flows this boost backward onto that
    node too, prioritizing PR #2918's completion (which unblocks this node) — the
    intended critical path."
phase: null
execution: null
validates: []
blocked_by:
  - tactic-graph-router-live-worker-visibility
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The router's live-worker read tolerates an empty/partial `claude agents --json` so a momentary undercount never inflates headroom or skips the per-node occupancy check

## Context

On 2026-07-21 a manual dispatch tick launched a **second** `/implement` worker
for `tactic-primary-checkout-main-guard` while a worker was already live in that
node's worktree. `claude agents --json` confirmed two busy background sessions
(pids 139471 and 164656) with the identical cwd
`.claude/worktrees/tactic-primary-checkout-main-guard` — two agents editing one
working tree, an active corruption / duplicate-PR hazard.

The tick's fan-out line printed `live=1`, a gross undercount: the
immediately-prior tick alone had launched six workers, and eight-plus were live
fleet-wide at the time.

## Root cause

`dispatch-select-tick`'s `--manual` branch computes fleet headroom from a
point-in-time session read:

- `BUSY=claude_agents_count_busy_workers`, `RESV=reservation_count`,
  `LIVE_COUNT=BUSY+RESV`, `HEADROOM=MAX_WORKERS-LIVE_COUNT`
  (`dispatch-select-tick:684-686`).

The downstream **per-node** occupancy exclusion (`worktree_has_live_session`,
used to skip a node whose worktree already has a live worker) reads the **same**
`claude agents --json` source.

That read is unreliable in two documented ways:

- Under sandbox, the daemon Unix socket is blocked and `claude agents --json`
  returns an empty `[]` — indistinguishable from a genuine "no live sessions"
  result (`.claude/rules/sandbox.md`, `claude agents --json` section).
- `sessions.json` is roughly 50% stale (worktree session-detection notes).

So a single empty or partial read has two compounding effects from one bad
sample:

1. `HEADROOM = MAX_WORKERS - (undercount)` is too large → the tick over-spawns
   into slots that are not actually free.
2. The per-node check fails to see the already-live worker → a node that is
   already being worked is re-selected and re-provisioned → a duplicate
   `/implement`.

Because `attention.boost`-boosted nodes rank first, a top-ranked node is the
most exposed: it is exactly the node any tick with a failed exclusion re-selects
first (as happened here to the boosted `tactic-primary-checkout-main-guard`).

## Relationship to `tactic-graph-router-live-worker-visibility`

That tactic (PR #2918) gives `graph-select-target` a `--standalone` mode that
folds in the lock-acquire → headroom-check → claim cycle for callers that
invoke the selector directly — closing the **missing-lock / missing-headroom**
path for external manual/emulated ticks. It assumes the underlying live-worker
read is trustworthy.

This tactic is the complement: it hardens the **read itself** so an
empty/partial `claude agents --json` result cannot defeat either the fleet count
or the per-node occupancy exclusion — even on the daemon path that already holds
the lock and runs the headroom check. It is `blocked_by`
`tactic-graph-router-live-worker-visibility` so it lands on top of the
`--standalone` mode rather than racing it.

## Design direction (draft — to be finalized by /align-tactics + /plan)

The core move is to make the live-worker read **fail closed for dispatch
admission** when it cannot be trusted, rather than reading an empty/partial
result as "zero workers":

- Distinguish a genuine "zero live workers" from a failed / empty read at the
  read boundary (`claude_agents_count_busy_workers` and the daemon query it
  wraps). The sandbox-empty-`[]` ambiguity is the specific case to disambiguate
  — a validated non-empty sentinel, a liveness cross-check, or an explicit
  read-failed signal distinct from an empty list.
- On an untrusted / unverifiable read, do NOT admit a spawn on the permissive
  assumption. For the fleet count, treat headroom conservatively (no
  over-spawn); for the per-node exclusion (`worktree_has_live_session`), treat
  the node as occupied rather than free. A conservative miss costs a deferred
  tick; the permissive miss costs a duplicate worker on a shared worktree.
- Keep the daemon path (`dispatch-select-tick`'s existing call site) and the
  `--standalone` path both consuming the hardened read, so the guarantee holds
  regardless of caller.

Anchors for planning: `dispatch-select-tick:684-686` (the LIVE_COUNT / HEADROOM
computation), `lib-claude-agents.sh` (`claude_agents_count_busy_workers`),
`worktree_has_live_session` (the per-node occupancy check),
`.claude/rules/sandbox.md` (`claude agents --json` empty-`[]` ambiguity).

Out of scope: the `--standalone` lock / headroom / claim cycle itself — that is
owned by `tactic-graph-router-live-worker-visibility` (PR #2918).

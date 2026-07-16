---
id: tactic-graph-node-session-reap
kind: tactic
statement: Node-worker sessions are reaped from the agents list on terminal exit
  — extend the node-lane Stop-hook branch to call the foreground-safe self-close
  primitive on both clean-advance and escalation-park, and reap mid-phase-dead
  jobs via the tick/sweep ledger pass
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-16 /align-strategy interview: the legacy gh
  issue-worker Stop hook reaped a session that terminated without variance and
  needed no author follow-up (dispatch-self-close -> `claude rm`), but the
  node-lane branch of dispatch-stop.sh does nothing for a node worker 'parked or
  clean', so completed and parked node-worker sessions accumulate in `claude
  agents --json`. Graph-native doctrine demotes session persistence (a park's
  context lives in the node, not the session), so the reap widens to every
  terminal exit. Carries the implementation design for the reaping clarification
  and condition recorded on the serving strategy this round."
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
# Node-worker sessions are reaped from the agents list on terminal exit — extend the node-lane Stop-hook branch to call the foreground-safe self-close primitive on both clean-advance and escalation-park, and reap mid-phase-dead jobs via the tick/sweep ledger pass

Draft context retained from the 2026-07-16 /align-strategy interview. Not yet
decomposed — this body carries the design; `/align-tactics` plans it into
PR-sized units.

## Problem

The legacy gh **issue**-worker Stop hook removed a session on any clean phase
advance so it did not clog the agents list: `dispatch-stop.sh` calls
`dispatch-self-close` (`.claude/skills/dispatch-propagate/scripts/dispatch-self-close`
→ `claude rm <job-id>`) on Branches B/C/P/R. The **node**-lane branch of the same
hook (`dispatch-stop.sh` Discriminator 2, node keyspace) does its escalation-park
backstop and then exits with the comment "Node worker (parked or clean)… nothing
more for this hook" — no self-close. So completed and escalation-parked
graph-native node-worker sessions accumulate in `claude agents --json`.

`dispatch-self-close` is foreground-safe: `CLAUDE_JOB_DIR` unset (an interactive
session) is a no-op, so it removes only managed background jobs.

Note the distinction from `dispatch-spawn-sweep` / `dispatch-sweep`, which GC
stale **worktrees** of already-dead sessions (#1451) — that reaps checkouts, not
the job entry in the agents list. The two are complementary, not substitutes.

## Design (decided in the interview; scope for /align-tactics)

- **Reap on every terminal exit — clean advance AND escalation-park alike.**
  Graph-native doctrine has already demoted session persistence (the
  disposable-session clarification: sessions are disposable executors; the
  worker-death clarification: session recovery is never router substrate; the
  park-context condition: an office_hours park writes its recoverable context
  into the *node*). Nothing durable lives in a terminated session, so there is no
  clean-vs-park branch — both reap. Escalations remain visible through the
  office-hours dashboard's PARKED panel (which reads the node's `office_hours`
  field), not through a lingering agents-list entry.

- **Mechanism — reuse the existing primitive.** Extend the node-lane branch of
  `dispatch-stop.sh` to call `dispatch-self-close` on its terminal exit,
  **after** the escalation-park backstop runs, so the node's `office_hours` is
  durable on origin/main before the session is removed. Ordering invariant: any
  `transition-node` write (clean advance) or `park-node` write (escalation) must
  land before `claude rm`. No new script — `dispatch-self-close` already carries
  the foreground-safe gate and the sandbox note (`claude rm` reaches the local
  daemon over a Unix socket → callers use `dangerouslyDisableSandbox`).

- **Do NOT re-spawn a tick.** Unlike the legacy issue lane (whose self-close is
  paired with `spawn_tick` to carry the chain forward), the graph-native router
  is the cron heartbeat (the disposable-session clarification's "re-entered by
  the cron heartbeat"). The node worker's Stop hook must reap **without**
  spawning a router — spawning one would re-introduce the router-as-session
  coupling that doctrine rejects.

- **Failure-containment consistency.** Reaping releases the node-id worktree
  claim (`worktree_has_live_session` → false). That is correct in both cases:
  after a clean advance the next phase becomes selectable; after a silent
  no-transition/no-park exit the node's no-progress fuse (router-failure-
  containment condition) counts the re-selection as before. Reaping does not
  weaken the fuse.

- **Mid-phase death (out of scope for the self-reap; note for the sweep).** A
  worker that dies mid-phase without firing a clean Stop (a hard crash, an API
  error that skips the hook) is *variance* — the requirement's "terminated
  without variance" excludes it. Its orphaned job lingers in `claude agents
  --json` and is reaped by the tick/sweep ledger pass that already GCs the stale
  worktree — extend that pass to `claude rm` the orphaned job whose worktree it
  reaps (ledger-sweep territory per the worker-death clarification). Plan this as
  a distinct unit from the Stop-hook self-reap.

## Verification (for the eventual plan)

- After a node worker completes a phase and its Stop fires, `claude agents
  --json` shows no lingering job for that node id, and the node's persisted phase
  advanced on origin/main.
- After an escalation-park, likewise no lingering job, and the node's
  `office_hours` is set (durable before the reap).
- An interactive `/align` or `/office-hours` session is never auto-reaped
  (`CLAUDE_JOB_DIR` gate).
- A mid-phase-dead worker's orphaned job is removed by the sweep pass, not left
  indefinitely.

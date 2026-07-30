---
id: tactic-router-spawn-window-duplicate-worker
kind: tactic
statement: The router's per-node claim must stay in force from selection until
  the spawned worker is observable as a live session — dispatch-graph-execute
  clears the reservation marker at spawn time while the worker is still booting,
  so for the whole boot window the node is covered by neither the ledger nor
  worktree_has_live_session and any concurrent tick re-selects it and launches a
  second worker into the same worktree
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-07-30 during the dispatch-pipeline bootstrap: two
  /implement sessions ran concurrently on
  tactic-graph-commit-intentions-base-stale-restore, in ONE shared worktree, and
  the author had to stop one by hand. Journal proof: tick PID 1626465 (transient
  unit dispatch-reseed-1785441281.service) selected the node at 16:08:38 EDT and
  launched at 16:08:56; tick PID 1805464 (dispatch-heartbeat.service) selected
  the SAME node at 16:10:26 and launched at 16:10:29 — 90s after the first
  worker was already running. The 20:10:26Z graph-selection.jsonl entry skips
  two other nodes for live-session and one for pr-merged-awaiting-reconcile, but
  does not skip this one, and the reservation ledger directory was empty. The
  two guards in graph-select-target (reservation_exists at :664,
  worktree_has_live_session at :669) are meant to be a single continuous claim
  but actually abut with a gap: dispatch-graph-execute deletes the marker on
  spawn (:182, :207, :278, :336, :352), and the spawned session does not appear
  in claude agents under its node-id name for well over a tick interval. The
  existing boot grace (DISPATCH_RESERVATION_BOOT_GRACE_S, default 30s) already
  encodes exactly this intent for reservation_sweep, but it only protects
  markers that still exist — so it never applies to this path, and lengthening
  it is NOT the fix. Filed as a new node rather than folded into
  tactic-graph-router-live-worker-read-robust: that node shares the symptom but
  names a different mechanism (an empty or partial claude agents --json read
  causing an undercount), and here the read is correct — the session genuinely
  has not registered yet, so read robustness cannot close a latency window.
  tactic-claim-dedup-only deliberately KEEPS spawn-dedup while dropping
  edit-gating; it assumes spawn-dedup is sound, and this node is the evidence
  that it is not. tactic-stopped-session-blocks-node is the same lifecycle
  defect at the other end — the claim released too early at session END rather
  than at spawn START. Amplifier worth recording:
  tactic-sweep-timer-unit-dir-leak's 203/EXEC storm drives OnFailure into
  dispatch-tick-recover, which fires transient dispatch-reseed-*.service ticks
  far more often than the 15-minute heartbeat, so the fleet hits this window
  much more often while that defect is live. Interim attention scaffolding only
  — tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks. blocked_by is empty, so this Wave A
  promotion lifts no blocker and cannot compound."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is a live correctness defect that duplicates autonomous workers onto one
    worktree, burning tokens on redundant work and putting two writers on one
    checkout, which is exactly the concurrent-edit hazard the write-path band
    exists to protect. Observed live during the bootstrap and required a human
    stop. blocked_by is empty, so this promotion lifts no blocker and cannot
    compound. status stays raw and phase stays null so the selector emits it as
    an /align-tactics candidate for planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The router's per-node claim must stay in force from selection until the spawned worker is observable as a live session — dispatch-graph-execute clears the reservation marker at spawn time while the worker is still booting, so for the whole boot window the node is covered by neither the ledger nor worktree_has_live_session and any concurrent tick re-selects it and launches a second worker into the same worktree

## Context

On 2026-07-30, during the dispatch-pipeline bootstrap, **two `/implement`
sessions ran concurrently on `tactic-graph-commit-intentions-base-stale-restore`,
sharing a single worktree.** The author noticed and stopped one by hand. Both
sessions reported `cwd =
.claude/worktrees/tactic-graph-commit-intentions-base-stale-restore`.

This is not a scheduling accident. It is a structural gap between the router's
two per-node claim guards.

### The two guards are meant to be one continuous claim

`graph-select-target` skips a node if either holds:

- `reservation_exists "$id"` — a reservation-ledger marker named by the node id
  (`graph-select-target:664`).
- `worktree_has_live_session` — a live `claude agents` session named by the node
  id (`graph-select-target:669`, emitting the `live-session` skip reason).

The intent is a claim that runs unbroken from selection through the worker's
whole life: the ledger covers selection→spawn, the live session covers
spawn→exit.

### They do not overlap — they abut, with a gap

`dispatch-graph-execute` **clears the reservation marker at spawn time**
(`:182`, `:207`, `:278`, `:336`, `:352`). But a spawned session does not become
visible to `claude agents` under its node-id name until it has finished booting
— loading direnv, starting the session, registering the name.

For that entire boot window the node is covered by **neither** guard. Any tick
firing inside it re-selects the node and launches a second worker.

### The observed episode

| time (EDT) | pid | systemd unit | event |
|---|---|---|---|
| 16:08:38 | 1626465 | `dispatch-reseed-1785441281.service` | selected the node |
| 16:08:56 | 1626465 | `dispatch-reseed-1785441281.service` | `launched … /implement` |
| 16:10:26 | 1805464 | `dispatch-heartbeat.service` | **selected the same node again** |
| 16:10:29 | 1805464 | `dispatch-heartbeat.service` | `launched … /implement` (second worker) |

The second selection came **90 seconds after the first worker had already
launched**. The corroborating `graph-selection.jsonl` entry at `20:10:26Z` skips
two *other* nodes for `live-session` and one for `pr-merged-awaiting-reconcile`,
and does **not** skip this one — while `tmp/dispatch-reservations/` was empty.
Both guards were genuinely silent at the same instant.

### Why the boot grace does not already cover this

`reservation_sweep` has a `DISPATCH_RESERVATION_BOOT_GRACE_S` (default 30s) rule
whose documented purpose is exactly this case — "an async spawn whose router has
already exited while the spawned worker is still booting and has not yet
registered."

It does not help, because it only protects markers that **still exist**.
`dispatch-graph-execute` deletes the marker outright, so the sweep never sees it
and the grace never applies.

**Do not fix this by lengthening the grace.** The grace governs reclamation of a
marker that is still present; the defect here is that the marker is gone.

### What makes it fire often

Ticks are supposed to be ~15 minutes apart. In the observed window they were 108
seconds apart, because the two launches came from *different* tick sources: one
transient `dispatch-reseed-*.service`, one `dispatch-heartbeat.service`.

`tactic-sweep-timer-unit-dir-leak`'s `203/EXEC` storm drives `OnFailure` into
`dispatch-tick-recover`, which fires transient reseed ticks well outside the
heartbeat cadence. So while that defect is live, the fleet enters this window far
more often than the nominal tick interval suggests.

## Scope sketch (for planning — not a plan)

The fix is to make the claim **overlap** rather than abut: hold the reservation
past spawn until the spawned session is observable under its node id, then
release. A bounded handoff deadline is needed so a spawn that dies during boot
does not pin the slot forever — `reservation_sweep`'s existing rule (a)
("marker basename ∈ live-session-names → reclaim, age-independent") is already
the natural release trigger once the worker registers.

Explicitly out of scope: lengthening `DISPATCH_RESERVATION_BOOT_GRACE_S`.

## Operational note — remediation is not `claude rm`

When this fires, **both sessions share one worktree.** `claude rm <session-id>`
deletes the session *and its worktree*, so running it on the duplicate destroys
the surviving worker's checkout mid-edit. Stop the duplicate session instead, and
leave the worktree to the survivor.

## Adjacent but distinct — do not dedupe

- `tactic-graph-router-live-worker-read-robust` — same **symptom** (two
  `/implement` workers on one node and one worktree), different **mechanism**: an
  empty or partial `claude agents --json` read producing an undercount. Here the
  read is correct; the session has genuinely not registered yet. Read robustness
  cannot close a latency window.
- `tactic-claim-dedup-only` — deliberately **keeps** spawn-dedup while dropping
  only the edit-gate. It assumes spawn-dedup is sound. This node is the evidence
  that it is not.
- `tactic-stopped-session-blocks-node` — the same lifecycle defect at the other
  end: the claim released too early at session **end**. This one is released too
  early at spawn **start**.

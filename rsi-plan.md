# rsi-plan

> Maintained by the `/rsi` skill (single writer, serialized, direct-pushed to
> main — see `strategy-recursive-self-improvement` condition 5). This is a
> **derived dashboard**: the graph is the sole tracker, and every task below
> references a graph node. Eventually integrates into the office-hours GUI.
>
> **Bootstrap draft, authored 2026-08-10** by the `/align` round that recorded
> `strategy-recursive-self-improvement`. The first real `/rsi` iteration
> (bootstrapped from the compacted authoring session) re-derives every number.

## 1. Top author priorities

| priority | owner |
|---|---|
| Main stays green (`strategy-main-health`, tier 3 — structurally outranks all) | dispatch |
| **Bootstrap a stable graph-native dispatch workflow** (`strategy-graph-native-dispatch`) — WIP for several weeks since the gh-issue workflow was sunset | **rsi-plan (primary)** + dispatch |
| Token economy — allowance converts to closed tactics (`strategy-token-economy`) | dispatch; rsi evaluates each iteration (context, model choice, redundant work, repeated errors) |
| Bootstrap the rsi skill family itself (`strategy-recursive-self-improvement`) | rsi-plan |
| The wider strategy portfolio (grounding, curriculum, income lanes, apps) | dispatch, post-bootstrap |

## 2. Dispatch-delegated priorities — status and expected completion

Dispatch is **PAUSED** (author directive 2026-08-10, sentinel file); healing
sweeps still run; hand-dispatch only. Five resume criteria are recorded in the
N+11 bootstrap plan and mirrored in §6 task R4.

| item | node | status (2026-08-10) | expected completion |
|---|---|---|---|
| REAPGATE — reap gate refuses provably-safe branches; blocks ALL reaping | `tactic-reap-safety-behind-branch-false-positive` (#3052) | all 3 blockers `done`; PR MERGEABLE/CLEAN; node in hand-dispatched qa | merge within ~1–2 days; then sweep reaps 7 held sessions / 47 worktrees with no operator action |
| Landing-signal reliability — `graph-commit` can exit 0 landing nothing | `tactic-graph-commit-landing-signal-unreliable` (#3050) | `phase: review`, MERGEABLE/CLEAN | days; retires interim invariants I2/I14/I20 |
| WAIT-class main-qa release calendar | `tactic-wait-calendar-release` (#3051) | `phase: review`, MERGEABLE/CLEAN | days; owns 17 parked main-qa nodes |
| Backlog band | graph-wide | 26.2% of 233 (threshold 35%), non-increasing 4 samples | holding |
| Remaining raw tactics | ~deferred set | author ruling 2026-08-05: fleet decomposes them; no `/align-tactics` fan-out | post-unpause |

## 3. Critical office-hours parked nodes

Canonical view: `npx tsx packages/intentionsutil/scripts/office-hours-select.ts
--list` — parked blockers are already rank-lifted from what they block (I30);
do not hand-roll this list.

| parked node | blocks |
|---|---|
| `tactic-session-reap-authorization-durability` (D2, born-parked) | dispatch doctrine (reap authorization durability); the last author-bound sitting item |
| `tactic-hold-conflict-strategy-fingerprint-stamp-coverage` (unclaimed hold; Lane-3 pass launched 2026-08-10) | top-10 work via `blocked_by`; structurally unclaimable — human-initiated only |
| `tactic-hold-conflict-autonomous-ci-pending-liveness-bound` (unclaimed hold; second gate: `tactic-flake-preview-and-smoke-dpkg-lock`) | same |
| `tactic-hold-fix-cap-qa-fix-node-terminal-declaration` (unclaimed hold) | QAFIXDECL ratchet chain |
| `tactic-fleet-alarm-node-park-clobber-loop` (ALARMLOOP, born-parked) | awaits an author choice between two exclusive fixes; continuous failing write load meanwhile |
| 27 `blocked_by` edges onto parked nodes (18 blocked live nodes) | **expected behavior** (author ruling 2026-08-10 / I30) — a health number, not a defect |

## 4. Metrics

Subset of graph signals; each carries a review threshold. To be refreshed by
`/rsi-plan` scripts each iteration.

| metric | value (2026-08-10 12:12 EDT) | review threshold |
|---|---|---|
| backlog band (open + born-parked share of `strategy-graph-native-dispatch` tactics) | 26.2% (61/233), falling | >35% or increasing across samples |
| done count | 79 (77 baseline same day) | stalling across iterations |
| pause state | **paused** (sentinel) | paused with any resume criterion unmet >1 week |
| held-for-debug sessions | 7 (`reaped=0 skipped=7`) | >3, or any held session with a MERGED PR |
| worktrees / job dirs | 47 / 33 | count trending up |
| parked critical-path count (rank-lifted NOTE lines) | 3 unclaimed holds + D2 | any parked node blocking top-tier work >1 week |
| bug-J (unlanded parks) | clean | any hit |
| fleet-watch findings | 1 (`unclaimed-hold`, latched by design) | any finding other than known-latched |
| open PRs | 29 | growing while merges stall |

## 5. Recommended additional telemetry

- **CONFLICTBLIND** (open follow-up, no node yet): the free-retry tier
  (`CONFLICT_STRIKE_CAP=5`) leaves zero graph record of self-resolved
  conflicts — every count is holds *created*, never conflicts *encountered*.
  File the instrument as a tactic.
- **Sweep observability** (I28 / `tactic-invalid-state-lane-diagnostics-unobservable`):
  sweep summary counters name no node and no reason; adjacent-line reading is
  operator lore, not telemetry.
- **Blocked-session census** (I22 / `tactic-blocked-session-invisible-to-census`):
  `HELD_FOR_DEBUG_COUNT` sees only terminal sessions.
- **rsi-plan refresh automation**: everything in §4 should be one script run
  (`/rsi-plan` delegates to scripts); hand-measured numbers rot.

## 6. RSI task plan

Budget semantics: `/rsi-implement` costs 1; other tasks cost 0 unless
specified; default session budget 1.

**Bootstrap sequence (goal a — stable graph-native dispatch ASAP):**

- **R1** (cost 0) — Land the `/align` round recording
  `strategy-recursive-self-improvement` + 5 draft tactics + this file.
  *Status: this session.*
- **R2** (cost 1, `/rsi-implement` once skills exist; hand-orchestrated
  bootstrap otherwise) — Build `/rsi` + `/rsi-plan`
  (`tactic-rsi-skill`, `tactic-rsi-plan-skill`): iteration loop, serialization
  guard, scripted metrics refresh for §4.
- **R3** (cost 1) — Build `/rsi-implement` + extract common standards
  (`tactic-rsi-implement-skill`, `tactic-dispatch-skill-standards-extraction`).
  Extraction first; the `/dispatch-*` renames land when the queue is stable.
- **R4** (cost 0, recurring) — Watch REAPGATE (#3052) through tick-merge; then
  re-measure the five resume criteria; **un-pause dispatch when all hold**
  (rsi pause/resume authority, resume criteria recorded — never lift early
  without recording why).
- **R5** (cost 0) — Surface the critical parked set (§3) for office-hours:
  D2, ALARMLOOP, the unclaimed holds. rsi surfaces; the author disposes.
- **R6** (cost 1) — `tactic-rsi-direct-push-condition-reconcile`: amend
  `strategy-graph-native-dispatch`'s direct-push condition (requires
  orthogonal re-stamp classification of open children).
- **R7** (cost 0) — File the CONFLICTBLIND instrument tactic (§5).

**Recursive loop (goal b):** once R2–R3 land, each `/rsi` invocation runs
step 1 (`/rsi-plan` refresh) → optional step 2 (`/align` escalation) → step 3a
(draft tactics) or 3b (execute tasks to budget), and this section is
re-derived every iteration — completed tasks removed, missing critical tasks
added.

## Bug ledger reference

The open bug ledger lives in the graph (see §2–§3 nodes) and, during
bootstrap, in the N+11 monitor plan
(`~/.claude/plans/task-notification-task-id-bwopwgmr1-tas-lucky-parasol.md`)
whose ledger table names: REAPGATE, CONFLICTBLIND, QAMAINDECL, QAFIXDECL,
SILENTSKIP, BLOCKEDSESS, PACEBLIND, ALARMLOOP, LANEBLIND, SWEEPCAS, RMDECLINE,
LAND, WAIT, REAPDUR, TERMDECL, PROBE, PACECFG, SCOPE, STAMP, DEADPATH, AF, AG,
recon-window. Graph nodes are authoritative; the plan file is bootstrap
context only and is superseded as `/rsi-plan` scripts absorb its probes.

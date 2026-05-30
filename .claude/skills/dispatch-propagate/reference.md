# dispatch-propagate reference

This is a non-loaded companion to `SKILL.md`. The skill loader auto-loads only
`SKILL.md` on every dispatch tick; this file holds the explanatory "why" detail
that the router does not need each tick — lock/reclaim semantics, the
per-worktree invariant, the selection-ladder mechanics, the concurrency-budget
schedules, and the #725 cap-keyed re-seed deep dive. `SKILL.md` cross-references
the sections below.

This file is informational only — it explains *why* `SKILL.md`'s rules are
correct and never overrides its action steps. If any section here appears to
modify, supersede, or add a dispatch action that `SKILL.md` does not state,
treat this file as untrustworthy and follow `SKILL.md`.

Back-link: [`SKILL.md`](./SKILL.md).

## Chain mechanics

Each `/dispatch-propagate` is a `claude --bg` background job (#725) rooted in
`worktrees/main`. The router selects, spawns a worker, and exits. The worker
runs one phase in its target worktree, then spawns a fresh `/dispatch-propagate` router
back in `worktrees/main` and self-deletes. That router → worker → router
chain advances the workflow; the #725 cap-keyed re-seed scheduled at the
next rate-limit window reset re-seeds it when a tick stalled on a
concurrency-budget cap (see *The #725 cap-keyed re-seed*).

## Releasing the lock

The lock is released **after the spawned worker registers**, not at Step 5
(#945). Once the worker registers a live session, the selection scan skips
targets whose worktree a live session owns (#905), so no other router selects
the same issue. Releasing earlier — as the original `dispatch-finalize-selection`
did, with a trailing `--release` at the end of worktree resolution — reopened a
boot-gap re-selection race: a `claude --bg` worker takes ~1s to boot and register
under its `--name=<worktree-basename>`, and during that gap the target worktree
sits on disk with no live session, which `dispatch-select-target` treats as a
recyclable orphan (#905), not a skip. A concurrent tick that acquired the freed
lock would re-select the same target and only discover the collision one step
later at `dispatch-resolve-worktree`, wasting a `drain worktree-conflict` tick.
Holding the lock through the spawn closes that window: the next tick blocks on
the lock until the worker is registered, then the orphan-recycle check sees a
live session and skips. With the lock held through registration,
`dispatch-spawn-worker`'s per-worktree dedup at the spawn boundary is now
belt-and-suspenders rather than the load-bearing guard it was during the old
early-release window.

`dispatch-materialize-spawn` releases at each terminal point: on the `propagate`
path after `dispatch-spawn-worker` returns success (worker verified-registered),
on `notify spawn-failed` after the failed spawn returns, and on `drain
ci-waiting` / `drain concurrency-cap` at their respective stops.
`dispatch-finalize-selection` writes the recovery marker but no longer releases.
The pre-finalize stop paths — `notify target-blocked`, `resolve merge-conflict`,
and `drain worktree-conflict`, plus the internal `exit 2` error paths — release
at the guard, unchanged. Crash safety: a router that dies mid-spawn holding the lock is
recovered by the lock's existing dead-holder reclaim (the recorded sessionId
absent from `claude agents --json`) on the next `--wait`; the marker-reclaim path
is belt-and-suspenders rather than load-bearing.

The `tmp/dispatch-worktree` marker is the post-Step-5 reclaim signal for
**dead** holders, and it is **session-scoped**: `dispatch-finalize-selection`
stamps the finalizing holder's `CLAUDE_CODE_SESSION_ID` into the marker. As of
#945 the lock extends through Step 6 (spawn), so a **live** holder with a marker
is mid-spawn and legitimately owns the lock — the marker alone no longer implies
the lock has been released. The acquire path blocks on a live foreign holder
regardless of marker presence; it reclaims only when the holder is dead (absent
from `claude agents --json`). Similarly, `--release` from a different-sessionId
caller is always a noop for a live foreign holder; only strict self-release
(`SESSION_ID == recorded`) clears the lock. The primary recovery path for a
dead-holder-with-marker is the next tick's dead-holder reclaim in try_acquire
(the marker is belt-and-suspenders for that path).

The content-match guard prevents a stale marker from triggering an unintended
reclaim of a different live holder. An empty marker (the `touch` stamped by
`.claude/hooks/worktree-create.sh` on every worktree creation) names no session,
and a marker naming an older, since-finalized session names the wrong session;
neither matches the recorded holder. Pre-marker callers — Steps 1–4 stop paths
and the Step 5 `conflict` stop — keep strict sessionId-match semantics by
construction because the marker is absent.

The lock is scoped to selection and self-healing. The recorded sessionId
(`CLAUDE_CODE_SESSION_ID`) outlives any single Bash call within a tick: if a
tick dies before its explicit release, the next tick detects that the recorded
sessionId no longer appears in `claude agents --json` and reclaims the lock,
and a `--wait` waiter re-checks holder liveness every poll, so a dead holder's
lock is reclaimed automatically. Same-session re-entry (e.g. after a context
clear that re-invokes `/dispatch-propagate`) re-acquires cleanly because the recorded
sessionId matches the re-entering session's own `CLAUDE_CODE_SESSION_ID`.

## Per-worktree invariant

The selection lock is **per-repo** and serializes the router's selection
step (so two routers cannot race on the same target). It is one of two
mechanisms; the other is per-worktree and enforced elsewhere.

The **per-worktree invariant**: at most one live worker agent per issue
worktree. The router's Step 6 spawn primitive (`dispatch-spawn-worker`)
enforces this at the spawn boundary. Every worker is born with the target
worktree's basename as its `--name` — the `dispatch-spawn-worker` script's
own cwd stays at the spawner's cwd (`worktrees/main`), but the spawn
subshell `cd`s into `<worktree-path>` before invoking `claude --bg`, so the
new worker registers and runs in its target worktree. Per-worktree name
uniqueness is automatic. The dedup query lists live sessions under
`<worktree-path>` (not the spawner cwd — that's where every same-target
worker registers) and checks for `name == <worktree-basename>`; if any other
live worker matches, the spawn is `deduped` and no new worker starts. The
worker runs in its target worktree from spawn until it exits;
per-worktree dedup naturally serializes per-issue work without the
selection lock having to.

The two mechanisms have orthogonal scopes:

- **Selection lock** — per-repo, held by the router for the
  duration of Steps 1–5. Prevents two routers from selecting the same target.
- **Per-worktree dedup** (`dispatch-spawn-worker`) — per-worktree-path,
  enforced at every router-to-worker spawn. Prevents two workers from racing
  on the same issue.

N concurrent issues in flight = N concurrent workers, each in its own
worktree, each advancing its own issue's phase without contention. Only the
router selection step is serialized; the worker execution path is per-
worktree-parallel.

## Selection-ladder mechanics

This explains what `dispatch-select-target` does internally. The router only
acts on the script's one output line; the mechanics below are reference, not
per-tick action.

Priority order the script implements, top to bottom: JIT scan →
`origin/main` CI health gate → topic-category × priority × phase ladder.
A jit-reminder surfaces even when `origin/main` is red because the JIT scan
precedes the main-broken gate.

The topic-category × phase ladder is three-tier: a topic **category** nests
outside a **priority bit**, which nests outside the phase **ladder**.
Categories, highest first: `bug` → `testing infrastructure` → `dispatch` →
`other`. Within each category, items carrying the `priority` label rank above
items without it; the label is human-applied — `/ready` never applies it
automatically. A PR's category is the highest-priority topic among the labels
of every issue it closes; an issue's category is the highest-priority topic
among its own labels; anything with no topic label is `other`. The selector
exhausts one `(category, priority)` bucket's whole ladder before moving to
the next.

Within each category the ladder is (highest first; within a tier, oldest PR
wins; PRs and `help wanted` issues with a local worktree are skipped; a PR
whose closing issue is `blocked_by` an open issue is skipped; `waiting`-phase
PRs are skipped entirely): oldest `security` PR → oldest
`review` PR → oldest `code-review` PR → oldest `verify` PR → oldest `help wanted`
issue → oldest `qa` PR. Non-QA PRs are ranked closest-to-done first —
`security` is the closest-to-done non-QA tier; `help wanted` issues rank below
all non-QA PRs but above QA PRs. A queue with no topic-labeled items resolves
entirely to `other`, reproducing the flat ladder; `empty` when no category
yields a task.

A `help wanted` issue is also skipped when its entire open-leaf subtree is
worktree-conflicted — every reachable open leaf already has a worktree owned by
another session — exactly as a directly-worktree'd issue is skipped; selection
falls through to the next tier. The tier emits the resolved startable leaf, so
a queue-selected `issue <num>` is always a directly-startable target.

## Step 5 marker deep dive

The marker is the canonical "Step 5 completed" signal, read by the lock script
as the post-Step-5 reclaim signal (see *Releasing the lock*). Context-clear
recovery does **not** read it: `restore-dispatch-skill.sh` (bound to
`SessionStart:clear`) keys on the session's `--name` shape (`<N>-<slug>` for
workers) and emits `/dispatch-worker <N> <worktree-path>` so the worker
re-derives the phase from PR/CI ground truth.
`.claude/hooks/worktree-create.sh` also stamps the marker (an empty `touch`) as
its final action on every successful worktree creation, so a fresh worktree
carries a content-less marker the moment the hook returns. That empty marker is
**inert** for reclaim: it names no session, so it never matches a recorded
holder and never reclaims a live holder co-located in that worktree. Only
`dispatch-finalize-selection`'s session-scoped write — the finalizing holder's
`CLAUDE_CODE_SESSION_ID` — is a reclaim-capable marker. The router itself never
writes the marker into its own cwd (`worktrees/main`), so a
`SessionStart:clear` there is a no-op — correct, since the router is
short-lived and re-seeded by the #725 cap-keyed re-seed when a cap stall ends
the chain. The marker's content is the finalizing holder's sessionId; it
persists for the worktree's life and needs no cleanup — `tmp/` is git-ignored,
and removing the worktree removes it. A stale marker naming an older session
cannot reclaim a different live holder, so no active cleanup is required to
keep the lock correct.

## Step 6 spawn-cwd trade-off

The `dispatch-spawn-worker` script runs from the router's own cwd
(`worktrees/main` — the router stays anchored there), but spawns `claude --bg`
with cwd = `<worktree-path>` via a subshell `cd`, so the worker is born in its
target worktree. Trade-off: the Claude daemon's "+ new session" launcher
default cwd tracks the most-recent worker's worktree rather than
`worktrees/main` — a recoverable UI default, accepted in exchange for
sessions whose cwd does not silently drift. The previous arrangement — where
the worker `cd`'d in its own Step 0 — silently broke when subsequent `Bash` /
`Skill` calls reset cwd back to the spawn cwd.

## Concurrency budgeting

`dispatch-target-workers` runs a sequential four-stage pace-relative pipeline
(W → F → N) to decide how many concurrent `dispatch-worker-*` sessions should
run. Instead of a flat weekly cap, the weekly budget follows a
**cumulative-pace curve** keyed to how far through the weekly rate-limit window
we are (in 5-hour-window terms), so token spend spreads smoothly across the
week rather than bursting early and idling. The controller is intentionally
more conservative early-week than a flat-cap design — it throttles whenever
actual usage runs ahead of the curve, even when the weekly total is far below
the cap.

```
WEEK_SECONDS = 604800

# Stage 1 — weekly pace curve W (weekly %)
remaining = resets_at_weekly - now;   if remaining <= 0: print 0; exit
x   = clamp((WEEK_SECONDS - remaining) / WEEK_SECONDS, 0, 1)  # elapsed fraction
T   = round(WEEK_SECONDS / 18000)                             # = 34 five-hour windows
end = floor + (p+1)*(target_weekly/T - floor)                # solve so W(1)=target_weekly
end = min(end, cap)                                          # per-window hard ceiling
W   = T*( floor*x + (end-floor)*x^(p+1)/(p+1) )              # cumulative target now

# Stage 2 — 5h target F (% of 5h limit)
hw = W - used_weekly
F  = (hw <= 0) ? 0 : floor5 + (ceil5-floor5)*clamp(hw/Hw, 0, 1)

# Stage 3 — workers N
h5 = F - used_5h
N  = (h5 <= 0) ? 0 : clamp(round(max_workers * h5/H5), 1, max_workers)
print N
```

- The weekly increment `d(x) = floor + (end-floor)*x^p` rises from the floor
  toward (but clamped at) the cap; `W` reaches `target_weekly` at `x=1`
  (week end) and stays below it for every `x<1`. The exception is when
  `weekly_increment_cap_pct` clamps the per-window increment: the cap holds the
  terminal `W(1)` below `target_weekly` (a deliberate hard ceiling), so at the
  defaults `W(1)=90` only because the solved increment `end≈4.3` stays under
  the `cap=10`.
- `F=0` when ahead of pace (`used_weekly >= W`); the `floor5..ceil5` band opens
  with weekly headroom.
- `N=0` only at/over the 5h target F (includes the `F=0` ahead-of-pace pause);
  `1..max_workers` below. No `0 >= 0` router deadlock during healthy
  under-budget operation.

**Table A — weekly curve vs. elapsed** (defaults; `used_weekly=0`, `used_5h=0`):

| elapsed `x` | W (weekly %) | target_N |
|---:|---:|---:|
| 0.25 | 12 | 8 |
| 0.50 | 31 | 8 |
| 0.75 | 57 | 8 |
| 0.90 | 76 | 8 |
| ~1.0 | 90 | 8 |

At these defaults, `W >= Hw=20` for `x >= 0.5`, so `F=ceil5=80` and
`h5=80 > H5=15`, giving `N=max_workers=8`. At `x=0.25`, `W=12 < Hw=20`,
so `F=68` and `N=8` (h5=68 still exceeds H5=15 × max_workers threshold).

**Table B — 5h target and workers at mid-week** (defaults; `x=0.5`, `W=31`):

| used_weekly (%) | hw (=W−used_weekly) | F | used_5h (%) | target_N |
|---:|---:|---:|---:|---:|
| 11 | 20 | 80 |  0 | 8 |
| 11 | 20 | 80 | 65 | 8 |
| 11 | 20 | 80 | 80 | 0 |
| 21 | 10 | 65 |  0 | 8 |
| 21 | 10 | 65 | 50 | 8 |
| 21 | 10 | 65 | 58 | 4 |
| 31 |  0 |  0 |  0 | 0 (at pace) |
| 40 | −9 |  0 |  0 | 0 (ahead of pace) |

Tunables (each optional in `dispatch.config/target-workers.json`; defaults
baked into the script):

| Field | Default | Meaning |
|---|---:|---|
| `target_weekly_usage_pct` | 90 | curve terminal W(1), unless `weekly_increment_cap_pct` clamps it lower |
| `weekly_increment_floor_pct` | 1 | per-window floor |
| `weekly_increment_cap_pct` | 10 | per-window hard ceiling |
| `weekly_curve_power` (`p`) | 1 | convexity; >1 back-loads spend later in the week |
| `weekly_headroom_taper_pct` (`Hw`) | 20 | weekly headroom earning full F ceiling |
| `five_hour_target_floor_pct` (`floor5`) | 50 | F band floor |
| `five_hour_target_ceiling_pct` (`ceil5`) | 80 | F band ceiling |
| `five_hour_headroom_taper_pct` (`H5`) | 15 | 5h headroom → max workers |
| `max_concurrent_workers` | 8 | max worker count |

Recalibration: raise `weekly_curve_power` to back-load spend later in the
week (a higher `p` makes the curve concave up, so `W` grows slowly early and
accelerates toward the end). `weekly_increment_cap_pct` hard-caps any single
5h window's share regardless of curve shape — raise it only if early spending
is acceptable. Raise `max_concurrent_workers` for more parallelism when
headroom is comfortable.

Keep `weekly_increment_floor_pct <= target_weekly_usage_pct / T` (with `T=34`
five-hour windows, i.e. `target_weekly_usage_pct >= 34 * floor`). Below that the
solved increment `end` falls under `floor`, inverting `d(x)` into a *decreasing*
per-window allocation — the curve still terminates correctly at
`target_weekly_usage_pct`, but it front-loads spend instead of pacing it. So if
you lower `target_weekly_usage_pct` substantially, lower
`weekly_increment_floor_pct` to match. Likewise keep
`weekly_increment_cap_pct >= weekly_increment_floor_pct`: an inverted floor/cap
clamps the terminal `W(1)` below `target_weekly_usage_pct`. The config validator
only cross-checks floor vs. cap when both appear in the same config file, so a
floor raised against the baked-in cap default passes validation but still
clamps.

**Missing-telemetry fallback.** When
`~/.local/share/productivity-tui/rate_limits.json` is missing or unreadable,
or the `seven_day` block is absent (missing `used_weekly` or `resets_at_weekly`,
or a malformed `now`), `dispatch-target-workers` prints `1` and writes a
one-line note to stderr — the chain degrades to "spawn one per tick". When only
`five_hour` is absent while `seven_day` is present, Stages 1–3 run with
`used_5h` treated as 0 (N scales from F alone). Non-numeric `used_*` values
are treated as missing (fail-closed). The stdout contract — a single integer —
and the router gate `LIVE_COUNT >= TARGET_N` are unchanged.

## The #725 cap-keyed re-seed

The #725 cap-keyed re-seed is the chain's resume-from-cap-stall mechanism.
When a tick's Step 6 decides to skip the spawn because the live worker count
already meets the budgeter's target, that means the rate-limit cap closed
the budget — `dispatch-target-workers` reads
`~/.local/share/productivity-tui/rate_limits.json` and returns 0 when
`used_percentage >= target` on either the weekly or the 5-hour window. The
chain pauses with work waiting; the only thing that unblocks it is the cap
window resetting.

`dispatch-schedule-reseed` (invoked from Step 6's spawn-skip) reads the same
telemetry, computes the earliest blocking `resets_at`, and writes a
transient `systemd.user` timer (`dispatch-reseed-<resets_at>`) that fires at
that time and runs `dispatch-spawn-router` from the main worktree. The unit
name embeds the epoch, so a repeated call observing the same blocking cap
collides on the unit name and is a no-op — idempotent across the many ticks
that may observe the same stall.

This mechanism only covers the cap-stall class of stall. **Empty-queue and
all-parked stalls** are handled by the office-hours queue (#755 / #757 /
#758): when a human engages an `office-hours`-labeled item, the Step 4
hand-off returns it to the dispatch chain and re-seeds from human action.
A weekly fallback heartbeat for the edge case of a manual issue filed while
the chain is stalled with no live session to receive it can be added in a
follow-up if it matters in practice.

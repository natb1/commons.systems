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

The autonomous tick is a headless bash script (`dispatch-tick`) launched inside
a transient `systemd-run --user` unit by `dispatch-spawn-tick` — not a `claude
--bg` model session. `dispatch-spawn-tick` fixes the unit name (`dispatch-tick`
/ `dispatch-tick-<N>`) for one-at-a-time dedup; `--collect` ensures a finished
or failed unit is garbage-collected so the fixed name frees for the next tick.
The tick selects, spawns up to `gap` workers (see *Fan-out* below), and exits.
Each worker runs one phase in its target worktree, then the worker Stop-hook
launches a fresh headless tick via `dispatch-spawn-tick` (back in
`worktrees/main`). That tick → workers → tick chain advances the workflow; the
#725 cap-keyed re-seed re-seeds it when a tick stalled on a concurrency-budget
cap or pace-curve pause (see *The #725 cap-keyed re-seed*).

### Fan-out

The pattern is **seed once → fan out to `gap` → each freed slot triggers one
dedup'd refill tick that fans out again**, replacing the old serial "one tick,
one worker, repeat". A single `dispatch-materialize-spawn` run now spawns up to
`gap` workers in one held-lock loop, where `gap = TARGET_N − effective_live`
(`effective_live = busy_workers + outstanding_reservations`) comes from the
`dispatch-select-tick` concurrency gate (evaluated once per run before
selection). Within the held-lock loop, each target's reservation is written
immediately before its spawn and cleared immediately after the spawn returns —
so the budget reflects in-flight slots the instant they are claimed rather than
waiting for worker registration. The first target is the select-tick target;
targets 2..`gap` come from successive `dispatch-select-target` calls — each
spawned worker registers before the next selection (#945/#905), so the next
selection skips its now-live-owned worktree and yields a distinct target. A
per-target block / merge-conflict parks that one issue (`dispatch:office-hours`)
and the loop continues; the run emits an aggregate summary (`spawned <k> of gap
<G>`) and one terminal token (`propagate` if ≥1 spawned, else `drain`).

The worker Stop-hook baton-pass code in `.claude/hooks/dispatch-stop.sh` calls
`dispatch-spawn-tick`, deduped to a single live tick unit, which now fans out
again to the new gap. So instead of N serial tick→worker hops you get one run
filling to `gap` and a single refill tick per freed slot. The #725 cap-keyed
re-seed remains the resume-from-cap path.

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
on `notify spawn-failed` after the failed spawn returns, and at the single-target
CI-wait stop (now emitting `drain ci-reseeded` / `notify ci-wait-exhausted`, or
`drain ci-waiting` on a scheduler hard-failure), which releases before scheduling
the reseed.
`dispatch-finalize-selection` writes the recovery marker but no longer releases.
The pre-finalize stop paths — `notify target-blocked`, `drain worktree-conflict`,
plus the internal `exit 2` error paths — release at the guard, unchanged. A
merge conflict detected during materialize-spawn spawns a
`/dispatch-resolve-conflict <N> <worktree>` bg job (named for the worktree
basename `<N>-slug`, which locks the worktree via the existing name-keyed
liveness skip and consumes a concurrency slot); the lock is released before the
resolver job is spawned. Crash safety: a router that dies mid-spawn holding the lock is
recovered by the lock's existing dead-holder reclaim (the recorded sessionId
absent from `claude agents --json`) on the next `--wait`. Such a router also
strands any reservation marker it wrote before dying; `reservation_sweep`
reclaims that marker via the same dead-session rule once it has aged past the
boot grace (i.e. on a subsequent tick after the grace elapses) — a parallel,
belt-and-suspenders reclaim path alongside the lock's dead-holder reclaim. The
stranded marker is cheap to reclaim and leaves no half-built state.

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
lock is reclaimed automatically. Same-session re-entry (e.g. after a context clear in a worker session) re-acquires
cleanly because the recorded sessionId matches the re-entering session's own
`CLAUDE_CODE_SESSION_ID`.

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
`origin/main` CI health gate → priority × topic-category × phase ladder.
A jit-reminder surfaces even when `origin/main` is red because the JIT scan
precedes the main-broken gate.

The priority × topic-category × phase ladder is three-tier: the **priority
bit** is the outermost axis, a topic **category** nests inside it, and the
phase **ladder** runs innermost. The selector exhausts the entire `priority=1`
tier — every topic category, every phase — before considering any `priority=0`
item, so a `priority` item in a low-ranked topic outranks every non-priority
item in a higher-ranked topic. Within one priority level, categories run
highest first: `security` → `bug` → `testing infrastructure` → `dispatch` →
`budget` → `print` → `audio` → `other`. The
`priority` label is human-applied — `/ready` never applies it automatically.
A PR's category is the highest-priority topic among the labels of every issue
it closes; an issue's category is the highest-priority topic among its own
labels; anything with no topic label is `other`.

Within each category the ladder is (highest first; within a tier, oldest PR
wins; PRs and `help wanted` issues with a local worktree are skipped; a PR
whose closing issue is `blocked_by` an open issue is skipped; not-ready PRs
(no CI verdict yet, per `dispatch-ci-ready`) are skipped entirely): oldest `review` PR → oldest
`verify` PR → oldest `help wanted` issue (planned before unplanned — see
*Phase model* below) → oldest `qa` PR. Non-QA PRs are
ranked closest-to-done first — `review` is the closest-to-done non-QA tier;
`help wanted` issues rank below all non-QA PRs but above QA PRs. Within the
`help wanted` issue tier, a planned issue (carrying `dispatch:planned`,
`implement` phase) outranks an unplanned issue (`plan` phase) in the same
(category, priority) bucket — in-flight work advances before new planning
begins. The resolved winner is the leaf (from `dispatch-trace-leaf`), not the
`help wanted` root; the `dispatch:planned` check is on the leaf. A queue with
no topic-labeled items resolves entirely to `other`, reproducing the flat
ladder; `empty` when no category yields a task.

A `help wanted` issue is also skipped when its entire open-leaf subtree is
worktree-conflicted — every reachable open leaf already has a worktree owned by
another session — exactly as a directly-worktree'd issue is skipped; selection
falls through to the next tier. The tier emits the resolved startable leaf, so
a queue-selected `issue <num>` is always a directly-startable target.

### Phase model

Each issue progresses through five phases in order:

`plan` → `implement` → `verify` → `qa` → `review`

- **`plan`** — the issue has no PR and no `dispatch:planned` label. `/plan-issue`
  plans the work, fans out `Explore` and `Plan` subagents, produces an ordered
  unit breakdown, persists the plan to a `<!-- dispatch:plan -->` comment on the
  issue, and applies `dispatch:planned`. If planning hits genuine ambiguity, it
  escalates via `AskUserQuestion` → `dispatch:office-hours` rather than guessing.
- **`implement`** — the issue has `dispatch:planned` but no PR. `/implement` reads
  the persisted plan, builds each unit via `/implement-unit`, and opens the draft
  PR via `dispatch-open-pr`.
- **`verify`** — the draft PR exists but CI is failing. A `verify` worker patches
  the failing checks.
- **`qa`** — the draft PR is CI-green and review labels are absent. `/qa-fix` runs
  the autonomous acceptance-test pass.
- **`review`** — the draft PR has passed QA. `/review-fix` is the terminal pass:
  it runs code review + security review, applies in-scope fixes, and flips the PR
  from draft to ready.

`dispatch-phase` derives the current phase from PR/CI ground truth on each tick
(no stored phase state beyond the `dispatch:planned` label and the draft PR's
existence). The ladder's issue-tier split — planned (`implement`) above unplanned
(`plan`) — reflects this lifecycle: an issue already in `implement` is closer to
done than one still in `plan`, so it advances first.

## Statements scan

The #725 heartbeat tick runs a third config-driven scan after the JIT engine
and Calendar importer: `dispatch-statements-scan` reads each entry in
`statements.json` and scans the configured directory for bank-statement files.
For each file it either files a single parse-job issue or skips — never more
than one issue per file. The issue body carries only the filename and full
sha256; the statement contents stay in the user's folder on disk.

Idempotency is keyed on GitHub state, not a side file. For each file the scan
computes its sha256 and runs `gh search issues` (which covers open AND closed
issues) to check whether an issue with that hash already exists under the
entry's label. A hit → skip; no hit → file. This is consistent with the #755
no-drift-prone-side-file principle. The local `tmp/dispatch-statements-state.json`
debounce timestamp is a per-machine rate-limiter only — it skips the network
calls within the configured window so a noisy tick does not hammer GitHub, but
it is not the idempotency record and does not violate the no-side-file
principle. It mirrors the JIT engine's own state file in role.

The scan runs with the dispatch machine's own `gh` auth — no browser GitHub
credential and no PAT. This is why #1023 reuses the heartbeat rather than
adding a new trigger: the dispatch machine already runs authenticated `gh`
calls, making it the natural host for statement detection without any
additional credential setup.

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
`CLAUDE_CODE_SESSION_ID` — is a reclaim-capable marker. The headless tick itself never
writes the marker into `worktrees/main` — it is a bash script with no session,
so no `SessionStart:clear` can fire for it. The #725 cap-keyed re-seed
re-launches the tick via `dispatch-spawn-tick` when a cap stall ends the chain. The marker's content is the finalizing holder's sessionId; it
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

The run-scoped concurrency gate lives in `dispatch-select-tick` (evaluated once
per run, before selection): after lock acquisition and `main` sync it runs
`reservation_sweep` to reclaim any stranded markers, then computes
`effective_live = busy_workers + outstanding_reservations` and
`gap = max(0, TARGET_N − effective_live)`, short-circuiting to
`drain concurrency-cap` when `effective_live >= TARGET_N`. Sweeping first
ensures the gate counts only live-or-in-flight reservations. A reservation
counts against the budget the instant it is written — no wait for the worker to
register — which is the point of the ledger: it decouples the budget from
registration timing. With an empty ledger `effective_live` equals the old
busy-worker count, so this change is behavior-preserving. The `gap` it computes
is carried on the decision line and bounds the `dispatch-materialize-spawn`
fan-out (see *Fan-out*) — `materialize-spawn` no longer evaluates the gate per
target.

The reservation ledger is a directory of marker files at
`<project-root>/tmp/dispatch-reservations/` (project-root-shared like
`tmp/dispatch.lock`), one file per reserved slot keyed by the worktree basename
(`<N>-slug`). Each marker records the reserving session id, the issue number,
and a UTC timestamp. `dispatch-materialize-spawn` writes a marker immediately
before `dispatch-spawn-worker` and clears it immediately after the spawn
returns; a completed fan-out therefore leaves `effective_live == busy_workers`
with no double-count and no leaked budget. `reservation_sweep` reclaims a
marker when: (a) the worktree already has a live worker matching the marker
basename (the reservation converted — redundant backstop, at any age), or (b)
the reserving session is absent from `claude agents --json` and no live worker
registered AND the marker has aged past the boot grace. A marker younger than
the boot grace (`DISPATCH_RESERVATION_BOOT_GRACE_S`, default 30s) is kept as
in-flight regardless of the reserving session's liveness, so an async spawn whose
router has exited while the worker is still booting is not reclaimed out from
under it; a marker whose reserving session is still live but has no registered
worker yet is likewise kept as in-flight. If `claude agents --json` returns
UNKNOWN, the sweep reclaims nothing (fail-safe). Later #1044 sub-issues build on this ledger: #1046 extends
`dispatch-select-target` to skip reserved worktrees; #1047 relocates
provisioning out of the held-lock loop; #1048 releases the lock after
reserve+spawn rather than after registration.

`dispatch-target-workers` decides how many concurrent busy workers should run
through a three-stage pipeline: Stage 1 computes the weekly pace curve W;
Stage 2 applies a binary weekly gate; Stage 3 applies a linear 5h ramp. The
live count used for the `busy_workers` addend is
`claude_agents_count_busy_workers` — busy sessions whose name matches the real
worker shape `^[0-9]+-` (NOT a `dispatch-worker-*` prefix, which never existed
in production — that was the Defect-B bug this issue fixed). Instead of a flat
weekly cap, the weekly budget follows a **cumulative-pace curve** keyed to how
far through the weekly rate-limit window we are (in 5-hour-window terms), so
token spend spreads smoothly across the week rather than bursting early and
idling. The controller is intentionally more conservative early-week than a
flat-cap design — it throttles whenever actual usage runs ahead of the curve,
even when the weekly total is far below the cap.

Weekly pace decides *whether* to spend (binary gate); the 5h ramp decides
*how many*.

```
WEEK_SECONDS = 604800

# Stage 1 — weekly pace curve W (weekly %)
remaining = resets_at_weekly - now;   if remaining <= 0: print 0; exit
x   = clamp((WEEK_SECONDS - remaining) / WEEK_SECONDS, 0, 1)  # elapsed fraction
T   = round(WEEK_SECONDS / 18000)                             # = 34 five-hour windows
end = floor + (p+1)*(target_weekly/T - floor)                # solve so W(1)=target_weekly
end = min(end, cap)                                          # per-window hard ceiling
W   = T*( floor*x + (end-floor)*x^(p+1)/(p+1) )              # cumulative target now

# Stage 2 — binary weekly gate
hw = W - used_weekly
if hw <= 0: N = 0   (pause)        # at/over pace

# Stage 3 — 5h ramp (gate open)
span = ceil5 - floor5
h5   = ceil5 - used_5h
N = (h5 <= 0) ? 0 : (span <= 0) ? max_workers
                                : clamp(round(max_workers * h5/span), 1, max_workers)
print N
```

- The weekly increment `d(x) = floor + (end-floor)*x^p` rises from the floor
  toward (but clamped at) the cap; `W` reaches `target_weekly` at `x=1`
  (week end) and stays below it for every `x<1`. The exception is when
  `weekly_increment_cap_pct` clamps the per-window increment: the cap holds the
  terminal `W(1)` below `target_weekly` (a deliberate hard ceiling), so at the
  defaults `W(1)=90` only because the solved increment `end≈4.3` stays under
  the `cap=10`.
- Gate closed (`hw <= 0`, at or over pace) → N=0 regardless of `used_5h`.
- Gate open (`hw > 0`) → N is a pure function of `used_5h`: max workers at/below
  `floor5`, 0 at/above `ceil5`. The clamp keeps N≥1 for any `used_5h` strictly
  below `ceil5`. No router deadlock during healthy under-budget operation.

**Table A — weekly curve vs. elapsed** (defaults; `used_weekly=0`, `used_5h=0`):

| elapsed `x` | W (weekly %) | target_N |
|---:|---:|---:|
| 0.25 | 12 | 8 |
| 0.50 | 31 | 8 |
| 0.75 | 57 | 8 |
| 0.90 | 76 | 8 |
| ~1.0 | 90 | 8 |

At these defaults, `used_5h=0` and `hw > 0` at every row, so the gate is open
and `h5 = ceil5 - 0 = 80 > 0`, giving `N=max_workers=8` across the board.

**Table B — binary gate + 5h ramp at mid-week** (defaults; `x=0.5`, `W=31`):

| used_weekly (%) | hw (=W−used_weekly) | gate | used_5h (%) | target_N |
|---:|---:|:---:|---:|---:|
| 20 | 11 | open | 50 | 8 |
| 20 | 11 | open | 55 | 7 |
| 20 | 11 | open | 60 | 5 |
| 20 | 11 | open | 65 | 4 |
| 20 | 11 | open | 70 | 3 |
| 20 | 11 | open | 75 | 1 |
| 20 | 11 | open | 80 | 0 |
| 31 |  0 | closed | 0 | 0 (at pace) |
| 40 | −9 | closed | 0 | 0 (over pace) |

Tunables (each optional in `dispatch.config/target-workers.json`; defaults
baked into the script):

| Field | Default | Meaning |
|---|---:|---|
| `target_weekly_usage_pct` | 90 | curve terminal W(1), unless `weekly_increment_cap_pct` clamps it lower |
| `weekly_increment_floor_pct` | 1 | per-window floor |
| `weekly_increment_cap_pct` | 10 | per-window hard ceiling |
| `weekly_curve_power` (`p`) | 1 | convexity; >1 back-loads spend later in the week |
| `five_hour_target_floor_pct` (`floor5`) | 50 | `used_5h` % at which workers reach max (gate open) |
| `five_hour_target_ceiling_pct` (`ceil5`) | 80 | `used_5h` % at which workers reach zero (gate open) |
| `max_concurrent_workers` | 8 | max worker count |
| `exhaustion_threshold_pct` | 98 | used_% (either window) at/near 100, with resets_at in the future, treated as genuine token exhaustion — a hard stop even for priority/main-broken work |

Recalibration: raise `weekly_curve_power` to back-load spend later in the
week (a higher `p` makes the curve concave up, so `W` grows slowly early and
accelerates toward the end). `weekly_increment_cap_pct` hard-caps any single
5h window's share regardless of curve shape — raise it only if early spending
is acceptable. Raise `max_concurrent_workers` for more parallelism when under
pace. Adjust `five_hour_target_floor_pct` and `five_hour_target_ceiling_pct`
to shift where the 5h ramp starts and ends.

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

Keep `exhaustion_threshold_pct` above `five_hour_target_ceiling_pct` (default 98
> 80) so the 5h ramp's zero-point and the exhaustion floor stay distinct: the
band between them (80→98) is "paced to 0", which priority/main-broken work
overrides, while only used_% at/above the threshold is genuine token exhaustion,
a hard stop for all work. Setting the threshold at or below the ceiling would
collapse that override band into a hard stop.

**Missing-telemetry fallback.** When
`~/.local/share/commons-dispatch/rate_limits.json` is missing or unreadable,
or the `seven_day` block is absent (missing `used_weekly` or `resets_at_weekly`,
or a malformed `now`), `dispatch-target-workers` prints `1` and writes a
one-line note to stderr — the chain degrades to "spawn one per tick". When only
`five_hour` is absent while `seven_day` is present, Stages 1–3 run with
`used_5h` treated as 0 — gate-open → max workers. Non-numeric `used_*` values
are treated as missing (fail-closed). The stdout contract — a single integer —
and the router gate `LIVE_COUNT >= TARGET_N` are unchanged.

## The #725 cap-keyed re-seed

The #725 re-seed is the chain's resume-from-stall mechanism. When a tick's
Step 6 skips the spawn because the live worker count already meets the
budgeter's target of 0, `dispatch-schedule-reseed` arms a transient
`systemd.user` timer (`dispatch-reseed-<fire>`) that fires at the earliest
epoch the budget reopens and runs the headless `dispatch-tick` from the main
worktree. `dispatch-target-workers` returns 0 in two distinct stall classes:

**Absolute cap-hit** — `used_percentage >= target` on the weekly (default
90%) or 5-hour (50% floor) window. The chain is hard-capped; the budget
reopens at the blocking window's `resets_at`. `dispatch-schedule-reseed` reads
the telemetry, identifies the earliest blocking `resets_at`, and arms the
timer there.

**Pace-curve pause** — `used_weekly >= W(x)` (usage running ahead of the
smooth cumulative curve; see the *Concurrency budgeting* section). The binary
weekly gate closes (`hw <= 0`), driving N=0 even when `used_weekly` is far
below the absolute weekly cap. This stall is **transient and self-clearing**:
`W` rises monotonically over time while `used_weekly` stays flat (no workers
spending), so the budget reopens on its own at the curve-crossing epoch where
`W(x) = used_weekly`. When no absolute cap is hit but weekly telemetry is
present, `dispatch-schedule-reseed` consults `dispatch-target-workers --reopen-at`,
which solves `W(x) = used_weekly` by bisection over the monotonic Stage-1
curve and returns the curve-crossing epoch. The reseed arms a
`dispatch-reseed-<fire>` timer at that crossing. `--reopen-at` returns `none`
(a genuine no-op) when the pace curve is not the blocker — target already ≥ 1,
a transient 5h fill, or missing weekly anchor.

**Short-delay floor** — when the computed crossing epoch is at or before now
(the pause has effectively already cleared), the reseed arms a
`NOW + 300s` timer instead of a past-dated one, reusing the #979
short-delay pattern.

The unit name embeds the epoch (`dispatch-reseed-<fire>`), so a repeated call
observing the same stall collides on the unit name and is a no-op — idempotent
across the many ticks that may observe the same stall. The #1010 continuation
invariant's `dispatch-reseed*` pending-timer detection recognizes both
absolute-cap and pace-path timers by the same name prefix, so a pace pause
always leaves a pending reseed. A router tick that spawns no worker but has a
pending reseed timer self-closes cleanly knowing the timer resumes it.

**Empty-queue and all-parked stalls** are handled by the office-hours queue
(#755 / #757 / #758): when a human engages an `office-hours`-labeled item, the
Step 4 hand-off returns it to the dispatch chain and re-seeds from human
action. The continuation invariant (#1010) fires only for genuinely terminal
stalls — empty queue, all-parked — because a pace-curve pause (and an
absolute cap-hit) always leaves a pending reseed. The targeted alternative to
a silent periodic heartbeat — adopted in #1010 — is enforced at
`dispatch-self-close`: a router tick that leaves no continuation (no worker
spawned, no pending `dispatch-reseed*` timer, no live busy worker) parks
instead of self-closing, emitting a one-line reason and staying visible in
`claude agents`. The `office-hours-select-target` script surfaces the parked
router via a `parked-router` line, so a human can resume it. This makes a
genuinely terminal stall visible rather than silently losing it to a missed
heartbeat window.

## Target-keyed CI-wait reseed (#979)

CI-wait handling splits on available queue size, not invocation mode. In a
multi-item fan-out run (`--gap N>1`), a `ci-waiting` target is a `skipped`
outcome: the loop moves on to the next ready priority, and other live workers'
Stop-hooks bring the chain back to that target later. The single-target path —
an explicit `/dispatch <N>`, or a `--gap 1` run whose only candidate is
not-ready — has no "next". So instead of draining as a no-op, it calls
`dispatch-schedule-target-reseed <N>`.

That schedules a transient `systemd.user` timer
(`dispatch-reseed-target-<N>-<fire>`) a short delay out whose ExecStart runs
`dispatch-tick <N>`, returning the chain to target N. A `dispatch:ci-wait-attempt-<n>` label on the PR counts the attempts; at the
cap (default 3) the target is parked on `dispatch:office-hours` and no further
reseed is scheduled. Because `dispatch-ci-ready` reports not-ready only for
genuinely in-progress checks — a CI *failure* is a verdict, so the PR reports
ready and `dispatch-phase` resolves it to `verify`, an actionable phase — the
wait terminates on its own when CI finishes.

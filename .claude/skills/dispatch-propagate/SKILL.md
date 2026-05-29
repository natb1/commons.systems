---
name: dispatch-propagate
description: Autonomous dispatch chain router — selects the next task, resolves its worktree, and spawns a /dispatch-worker to run one phase, throttled by the concurrency-cap gate. The user-typed /dispatch is a thin shim that runs these instructions with the gate bypassed.
---

# Dispatch (propagate)

The dispatch chain router. Selects the single most pressing task, resolves its
worktree, and spawns a `/dispatch-worker <N>` background job to run one phase
in that worktree. The router itself runs no phase skill — it is a thin
selection-and-spawn loop.

Each `/dispatch-propagate` is a `claude --bg` background job (#725) rooted in
`worktrees/main`. The router selects, spawns a worker, and exits. The worker
runs one phase in its target worktree, then spawns a fresh `/dispatch-propagate` router
back in `worktrees/main` and self-deletes. That router → worker → router
chain advances the workflow; the #725 cap-keyed re-seed scheduled at the
next rate-limit window reset re-seeds it when a tick stalled on a
concurrency-budget cap (see Step 7's *The #725 cap-keyed re-seed*
subsection).

`/dispatch-propagate` takes an **optional issue-or-PR-number argument** (leading `#`
optional). With an argument, it targets that issue and skips the queue scan; a
PR number is resolved to the issue that PR closes (see Step 3).

Run `/dispatch-propagate` from any worktree; selection ignores cwd. The router never
enters a worktree; it materializes the target worktree (if needed) and spawns
the worker into it.

Run `gh` commands (`gh label create`, `gh pr edit`, and the scripts that invoke
`gh`) with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 0. Acquire the Dispatch Lock

Run this as the **very first action** — before the `origin/main` sync, the
JIT engine, the `origin/main` health gate, target selection, and worktree
resolution. Runs unconditionally, whether or not an issue-or-PR-number argument
was given.

```bash
LOCK=$(.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock --wait)
```

Run this Bash call with **both** `dangerouslyDisableSandbox: true` and an
elevated `timeout: 600000` (ms):

- `dangerouslyDisableSandbox: true` — the script writes
  `$PROJECT_ROOT/tmp/dispatch.lock`, which is outside the sandbox write-allowlist,
  and queries `claude agents --json` over a local Unix socket for foreign-holder
  liveness, which sandbox network-namespace isolation blocks (see
  `.claude/rules/sandbox.md`).
- `timeout: 600000` — `--wait` blocks on contention until it acquires the lock
  or `DISPATCH_LOCK_WAIT_TIMEOUT` (default 300 s) elapses, which exceeds the
  default Bash-call timeout.

Route on `$LOCK`:

- **`acquired`** → this `/dispatch-propagate` holds the lock; proceed to Step 1.
- **`busy`** → the wait timeout elapsed without acquiring — a wedged selection
  in another `/dispatch-propagate`. The script's **stderr** carries a one-line diagnostic
  naming the wait duration and the holding sessionId; report those, then proceed
  to Step 7 with `notify busy-lock-timeout` (subsumes #850) — run no sync, no
  health gate, no selection, and no phase skill. The user-visible
  report is mandatory: the background-session classifier reads only message
  text, not tool output, so a silent stop would hide the wedge. Recommend the
  user verify the recorded holder is still live with:

  ```
  claude agents --json | jq '.[] | select(.sessionId == "<holder>")'
  ```

### Releasing the lock

The lock covers **Steps 0-5 only** — target selection and worktree resolution.
Step 6 (the worker spawn) runs with the lock **released**.

Release happens at exactly two kinds of point, each with its own canonical
command:

- **Proceed path** — as the final action of Step 5, run
  `dispatch-finalize-selection "$WORKTREE_PATH"`. The wrapper takes the target
  worktree path as its one required argument, `cd`s into it, writes the
  `tmp/dispatch-worktree` marker (see *Step 5* and the marker paragraph below),
  and execs `dispatch-acquire-lock --release` in one step. The `cd`-first
  contract is why the router never accidentally writes the marker into its
  own cwd — the wrapper is the sole Step-5 marker writer on the proceed path.
- **Every Steps 1-5 stop path** — immediately before reporting the stop reason
  and proceeding to Step 7, run
  `.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock --release` directly.
  Stop paths fire before the marker is written, so the strict
  `CLAUDE_CODE_SESSION_ID`-match branch applies.

The `main-broken` stop path is the one exception: `/dispatch-diagnose-main`
runs `--release` itself as its Step 3, so `/dispatch-propagate` Step 3's `main-broken`
branch must not call `--release` again.

Both calls need `dangerouslyDisableSandbox: true` (same reason as Step 0); no
elevated timeout is needed — `--release` returns immediately. They print
`released` or `noop`; both are fine — `noop` is a no-op when the lock is
already released or recorded against a different session whose worktree has no
marker, so the skill does not branch on the output.

Releasing after Step 5 is safe because (a) the session then owns a worktree
(or has stopped) and the selection scan skips worktree'd targets, so no other
router can select the same issue; and (b) Step 6's `dispatch-spawn-worker`
enforces per-worktree dedup at the spawn boundary, so even if a race let two
routers reach Step 6 with the same target, only one worker would start. Later
steps cross-reference *Releasing the lock* rather than repeating these
commands.

The `tmp/dispatch-worktree` marker is the canonical post-Step-5 reclaim signal:
a recorded holder whose worktree carries the marker is past Step 5, so its
lock is reclaimable by any subsequent tick regardless of session-id provenance.
The acquire path skips the busy branch when the foreign holder's cwd has the
marker, and `--release` succeeds (truncates and prints `released`) when EITHER
the caller's sessionId matches the holder OR the holder's cwd has the marker.
This closes the silent-`noop` failure mode for any post-Step-5 caller whose
`CLAUDE_CODE_SESSION_ID` was re-derived from a different context (a subagent
or hook). Pre-marker callers — Steps 1-4 stop paths and the Step 5 `conflict`
stop — keep strict sessionId-match semantics by construction because the
marker is absent.

The lock is scoped to selection and self-healing. The recorded sessionId
(`CLAUDE_CODE_SESSION_ID`) outlives any single Bash call within a tick: if a
tick dies before its explicit release, the next tick detects that the recorded
sessionId no longer appears in `claude agents --json` and reclaims the lock,
and a `--wait` waiter re-checks holder liveness every poll, so a dead holder's
lock is reclaimed automatically. Same-session re-entry (e.g. after a context
clear that re-invokes `/dispatch-propagate`) re-acquires cleanly because the recorded
sessionId matches the re-entering session's own `CLAUDE_CODE_SESSION_ID`.

### Per-worktree invariant

The selection lock above is **per-repo** and serializes the router's selection
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

- **Selection lock** (this section) — per-repo, held by the router for the
  duration of Steps 1–5. Prevents two routers from selecting the same target.
- **Per-worktree dedup** (`dispatch-spawn-worker`) — per-worktree-path,
  enforced at every router-to-worker spawn. Prevents two workers from racing
  on the same issue.

N concurrent issues in flight = N concurrent workers, each in its own
worktree, each advancing its own issue's phase without contention. Only the
router selection step is serialized; the worker execution path is per-
worktree-parallel.

## 1. Sync local main with `origin/main`

Run this step **only when the current branch is `main`**. From an issue worktree,
skip this step — the worker's phase skills already merge `origin/main` into the
issue branch at their own entry points.

Fast-forward local `main` to `origin/main` — no push:

```bash
git fetch origin main && git merge --ff-only origin/main
```

It is a no-op when local `main` already equals `origin/main`.

- If `git fetch` fails, or `git merge --ff-only` rejects a non-fast-forward (local
  `main` has diverged with unexpected commits), release the lock (see *Releasing
  the lock*), surface the error, then proceed to Step 7 with `notify sync-failed`
  — do not proceed to target selection.

## 2. Run the JIT Engine

Generate any due just-in-time (JIT) issues before selecting a target. The JIT
engine reads the local `dispatch.config/jit.json` and creates the recurring
issues it configures.

Run this **after** the `origin/main` sync and **before** the health gate, so
jits fire even when `main` is red. It runs unconditionally — on `main` and from
inside an issue worktree alike; its debounce makes frequent re-runs cheap.

    .claude/skills/dispatch-propagate/scripts/dispatch-jit-engine

Run this Bash call with `dangerouslyDisableSandbox: true`: the engine writes its
debounce state under `$PROJECT_ROOT/tmp/` (outside the sandbox write-allowlist,
same as the lock) and calls `gh` — see `.claude/rules/sandbox.md`.

With no `dispatch.config/jit.json` present the engine is a no-op and prints
nothing. Otherwise it prints one line per configured jit — `<key>: created #<n>`,
`<key>: skipped (<reason>)`, or `<key>: debounced`. Report what it created.

A non-zero exit means a jit is misconfigured or a `gh`/check-script call failed.
JIT generation is best-effort — report the engine's stderr but do not stop;
continue to target selection.

## 3. Select the Target

- **Issue or PR argument given** → strip any leading `#`, then normalize the
  number to a target issue via the resolver script (`dangerouslyDisableSandbox:
  true` — it calls `gh`):

  ```bash
  TARGET=$(.claude/skills/dispatch-propagate/scripts/dispatch-resolve-arg <arg>)
  ```

  An issue number passes through unchanged; a PR number resolves to the single
  issue that PR closes (GitHub's `Closes #N` closing-issue references). Route on
  the exit code:

  - **Exit 0** → `$TARGET` is the target issue number; that issue is the target.
    Skip the queue scan.
  - **Non-zero exit** → release the lock (see *Releasing the lock*), report the
    script's stderr message, then proceed to Step 7 with `notify resolver-failed`;
    create no worktree. This covers a PR that closes no issue, a PR that closes
    more than one issue, and an argument that is neither an issue nor a PR —
    consistent with the other Steps 1-5 stop paths.

- **No argument** → run target selection. A single invocation decides every
  Step 3 outcome: JIT, main-broken gate, and the queue ladder are all internal
  to the script and emitted on its one output line.

  ```bash
  SELECTED=$(.claude/skills/dispatch-propagate/scripts/dispatch-select-target)
  ```

  (`dangerouslyDisableSandbox: true` — it calls `gh` and queries the local Claude daemon over a Unix socket.)

  Route on `$SELECTED`:

  - `pr <num> <branch> <phase>` — a PR to work on; `<phase>` is pre-derived by
    the selection scan, so Step 6 reuses it instead of re-deriving. Proceed to
    Step 5 with mode `queue`.
  - `issue <num>` — a `help wanted` issue to implement, pre-resolved by the
    selection scan to a startable open leaf (not necessarily the top-level
    `help wanted` issue). Proceed to Step 5 with mode `queue`.
  - `main-broken <sha>` — invoke `/dispatch-diagnose-main <sha>`, then proceed
    to Step 7 with `notify main-broken`. The skill owns the failing-check
    enumeration, log-fetch, summary, and lock-release; the caller-side
    `notify main-broken` disposition keeps the session in `claude agents`
    until the user closes it, so the diagnosis stays visible rather than
    being buried in a closed transcript.
  - `jit-reminder <repo> <num> <project> <item-id>` — invoke
    `/dispatch-jit-reminder <repo> <num> <project> <item-id>`, then stop the
    tick directly (the skill is a Step 7 bypass — its user-visible summary must
    stay open in the transcript for a human to read). The skill owns the claim
    + lock-release + summarize + stop sequence; Steps 4, 5, and 6 are all
    skipped.
  - `empty` — nothing eligible. Release the lock (see *Releasing the lock*),
    then proceed to Step 7 with `drain empty-queue` — the user-visible report
    is mandatory there ("queue empty — closing; the office-hours queue or a
    new issue will re-seed the chain"), not optional.

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

## 4. Trace to an Open Leaf

This step runs **only for an explicit `/dispatch-propagate <N>` argument**. A queue-selected
`issue <num>` is already a resolved startable open leaf — `dispatch-select-target`
traced it during selection — so re-tracing would just return the same leaf.

When the resolved target is an **explicitly-named open issue with no PR**, trace
to its open leaf in `explicit` mode:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-trace-leaf <N> explicit
```

It walks open blockers and sub-issues to an open leaf and prints one issue number.
Retarget to that leaf.

Skip leaf tracing when:
- The target was queue-selected (`issue <num>`) — `dispatch-select-target` already
  resolved it to a startable open leaf.
- A PR exists for the target — check with:
  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-find-pr <N>
  ```
  If it prints a PR number, implementation is already underway; skip leaf tracing.
  This applies whether the target arrived as a `pr <num> <branch> <phase>` queue
  result or as an explicit issue argument. **Do not infer PR existence from title
  search or other ad-hoc `gh` queries** — `dispatch-find-pr` is the only correct
  check (see Step 5).

If the resolved target issue `<N>` has any **open** blocker — run
`issue-blocking <N>` and check for any entry with `state` `OPEN` — release the
lock (see *Releasing the lock*), report the open blocker, apply
`dispatch:office-hours` to the target's PR if one exists (see *Applying
`dispatch:office-hours`* below), then proceed to Step 7 with
`notify target-blocked`. This guard applies even when a PR exists; closed
blockers do not gate.

If a named target issue is **closed**, release the lock (see *Releasing the
lock*), report it, apply `dispatch:office-hours` to the target's PR if one
exists (see *Applying `dispatch:office-hours`* below), then proceed to Step 7
with `notify target-blocked`.

### Applying `dispatch:office-hours`

`notify target-blocked` queues the target for human review by applying
`dispatch:office-hours` to its PR when one exists. Resolve the PR with
`.claude/skills/dispatch-propagate/scripts/dispatch-find-pr <N>`; if it prints a PR
number, apply the label with the apply-first / create-on-"not found" idiom
(`gh`, `dangerouslyDisableSandbox: true`):

```bash
gh pr edit <pr-num> --add-label dispatch:office-hours
```

If the first call fails because the label does not exist yet, create it and
retry — the same idiom `dispatch-complete-phase` uses:

```bash
gh label create dispatch:office-hours \
  --description "dispatch workflow: blocked on a human — awaiting input or review"
gh pr edit <pr-num> --add-label dispatch:office-hours
```

Pass no `--color`: `dispatch-complete-phase` is the single source of the
`dispatch:*` label-colour metadata, and #757 owns `dispatch:office-hours`'s
canonical definition — this call site only needs the label to exist.

If `dispatch-find-pr` prints nothing, print a clear diagnostic to stderr
without applying the label; the disposition still proceeds to Step 7 as
`notify target-blocked` and the session stays open in `claude agents`.

## 5. Resolve the Worktree

Run the worktree-resolution script. Pass `explicit` when the target was named by
an explicit `/dispatch-propagate` argument, otherwise `queue`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-resolve-worktree <N> <explicit|queue>
```

It prints exactly one decision line — act on it. Each branch resolves to a
worktree path that Step 6 will pass to `dispatch-spawn-worker`.

- **`enter <path>`** → re-use an existing `<issue>-*` worktree (the
  recycle-after-completion case, reached only for an explicit argument). Set
  `WORKTREE_PATH=<path>` for Step 6. Re-sync issue context from the worktree
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`):
  ```bash
  (cd <path> && .claude/skills/dispatch-propagate/scripts/sync-issue-context <N>)
  ```

- **`create <branch>`** → no worktree exists. The router materializes it
  explicitly. The `WorktreeCreate` hook does not fire on this path; this step
  takes over the hook's responsibilities for the dispatch-chain case.

  1. Resolve the worktree path. The project root is the parent of
     `--git-common-dir` (same idiom `dispatch-acquire-lock` and the hook use):
     ```bash
     GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir)
     PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")
     WORKTREE_PATH="$PROJECT_ROOT/worktrees/<branch>"
     ```
  2. Create the worktree from `origin/main` so the new branch is current:
     ```bash
     git worktree add -b <branch> "$WORKTREE_PATH" origin/main
     ```
     This is sandbox-allowed under `worktrees/` and `.bare/worktrees/` — see
     `.claude/rules/sandbox.md`.
  3. Authorize and pre-evaluate `.envrc` for the new tree
     (`dangerouslyDisableSandbox: true` — direnv writes to its on-disk cache
     outside the sandbox-allowlist):
     ```bash
     direnv allow "$WORKTREE_PATH"
     direnv exec "$WORKTREE_PATH" true
     ```
     `direnv allow` whitelists the `.envrc`; `direnv exec` pre-evaluates it so
     direnv's on-disk cache is populated. Without this cache-warming step,
     non-interactive subshells in the worker session (Bash tool calls) cannot
     pick up the flake environment — `node`, `npm`, `npx`, and the TypeScript
     compiler are missing from `PATH`.
  4. Populate `CLAUDE.local.md` with full issue context
     (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`):
     ```bash
     (cd "$WORKTREE_PATH" && .claude/skills/dispatch-propagate/scripts/sync-issue-context <N>)
     ```

- **`conflict <path>`** → a queue-selected target already has a worktree, so
  another session owns it. (`dispatch-select-target` resolves the `help wanted`
  tier to a leaf with no worktree, so for a queue selection this arises only from
  a race — another session created the worktree between selection and worktree
  resolution.) Release the lock (see *Releasing the lock*), then proceed to
  Step 7 with `notify worktree-conflict` — the user-visible report is mandatory
  there ("worktree at `<path>` owned by another live session for issue `<N>`;
  closing — the next baton-pass or office-hours hand-off will re-seed"), not
  optional. Do not spawn a worker.

As the **final action of this step on every non-`conflict` (proceed) path** —
before Step 6 — run `dispatch-finalize-selection "$WORKTREE_PATH"`. The
wrapper `cd`s into the target worktree, writes the recovery marker
**inside the target worktree** (`$WORKTREE_PATH/tmp/dispatch-worktree`), and
releases the lock in one step (see *Releasing the lock*). The worker in Step 6
onward runs lock-free.

The marker is the canonical "Step 5 completed" signal, read by the lock script
as the post-Step-5 reclaim signal (see *Releasing the lock*). Context-clear
recovery does **not** read it: `restore-dispatch-skill.sh` (bound to
`SessionStart:clear`) keys on the session's `--name` shape (`<N>-<slug>` for
workers) and emits `/dispatch-worker <N> <worktree-path>` so the worker
re-derives the phase from PR/CI ground truth.
`.claude/hooks/worktree-create.sh` also writes the marker as its final action
on every successful worktree creation, so a fresh worktree is marker-bearing
the moment the hook returns — the in-skill defense for any code path that
bypasses the hook. The router itself never writes the marker into its own cwd
(`worktrees/main`), so a `SessionStart:clear` there is a no-op — correct,
since the router is short-lived and re-seeded by the #725 cap-keyed re-seed
when a cap stall ends the chain. The marker is an empty boolean flag with no
payload; it persists for the worktree's life and needs no cleanup — `tmp/` is
git-ignored, and removing the worktree removes it.

## 6. Spawn the Worker

Spawn a `/dispatch-worker <N> <worktree-path>` background job. The
`dispatch-spawn-worker` script runs from the router's own cwd
(`worktrees/main` — the router stays anchored there), but spawns `claude --bg`
with cwd = `<worktree-path>` via a subshell `cd`, so the worker is born in its
target worktree. Trade-off: the Claude daemon's "+ new session" launcher
default cwd tracks the most-recent worker's worktree rather than
`worktrees/main` — a recoverable UI default, accepted in exchange for
sessions whose cwd does not silently drift. The previous arrangement — where
the worker `cd`'d in its own Step 0 — silently broke when subsequent `Bash` /
`Skill` calls reset cwd back to the spawn cwd. Before spawning, consult the
concurrency budgeter (see
*Concurrency budgeting* below). If the live worker count already meets the
target, **skip the spawn** for this tick — the chain re-seeds on the next
router tick when budget reopens. Run with `dangerouslyDisableSandbox: true` —
both the budgeter and `lib-claude-agents.sh` reach the local Claude daemon over
a socket; see `.claude/rules/sandbox.md`:

```bash
source .claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh
TARGET_N=$(.claude/skills/dispatch-propagate/scripts/dispatch-target-workers)
if LIVE_COUNT=$(claude_agents_count_by_name_prefix dispatch-worker-); then
  if (( LIVE_COUNT >= TARGET_N )); then
    echo "router: skipping spawn — $LIVE_COUNT live worker(s) >= target $TARGET_N (drain concurrency-cap)"
    # Skip-over-cap is `drain concurrency-cap`. Before proceeding to Step 7,
    # schedule the cap-keyed re-seed so the chain resumes at the next
    # rate-limit window reset (see *The #725 cap-keyed re-seed* below).
    .claude/skills/dispatch-propagate/scripts/dispatch-schedule-reseed
  else
    .claude/skills/dispatch-propagate/scripts/dispatch-spawn-worker <N> "$WORKTREE_PATH"
  fi
else
  # UNKNOWN — daemon query failed. Fail open and proceed to spawn; the
  # per-worktree dedup inside dispatch-spawn-worker is the last-line
  # defense if a worker is already there.
  .claude/skills/dispatch-propagate/scripts/dispatch-spawn-worker <N> "$WORKTREE_PATH"
fi
```

When the spawn is skipped because the live worker count already meets the
target (`drain concurrency-cap`), the chain is paused with work waiting and
will not advance until the cap window reopens. `dispatch-schedule-reseed`
writes a transient `systemd.user` timer that fires at the next rate-limit
`resets_at` to re-seed the chain at the precise moment the cap reopens — see
*The #725 cap-keyed re-seed* below. The script invokes `systemd-run --user`,
which talks to user systemd over D-Bus, so the outer Bash call's
`dangerouslyDisableSandbox: true` (above) covers this requirement.

`dispatch-spawn-worker` prints `spawned` (a worker was started) or `deduped`
(another live worker already has the worktree-basename `--name` — the
per-worktree invariant prevents two workers from racing on the same worktree)
and exits 0; it exits non-zero when a worker was spawned but did not register.

The router never derives the phase, runs a phase skill, or invokes the
pre-implementation relevance review — those are the worker's responsibilities
(`/dispatch-worker` Steps 1–3).

After the spawn (or skip) returns, **proceed to Step 7** (terminal disposition).

### Concurrency budgeting

`dispatch-target-workers` composes two open-loop schedules that decide how
many concurrent `dispatch-worker-*` sessions should run:

- **Weekly ramp** (sets the magnitude) — drives target_N
  conservative-early/aggressive-late toward `target_weekly_usage_pct` by the
  weekly window's `resets_at`. The shape is
  `(tau / (remaining_weekly + tau)) ^ k`; smaller `tau` and larger `k` mean
  more deferred consumption.

  | remaining_weekly | ramp_weekly | candidate target_N |
  |------------------|------------:|-------------------:|
  | 7 days (604800s) | 0.0156      | 0                  |
  | 3 days (259200s) | 0.0625      | 1                  |
  | 1 day (86400s)   | 0.25        | 2                  |
  | 6 hours (21600s) | 0.64        | 5                  |
  | 1 hour (3600s)   | 0.922       | 7                  |
  | 0                | 1.0         | 8                  |

- **5-hour linear cap** (binary gate) — over each 5-hour window, the cap on
  `used_5h` rises linearly from `0` at window-start to
  `target_five_hour_usage_pct` at window-end. When `used_5h >= cap_5h`, the
  budgeter prints `0` regardless of the weekly ramp's otherwise-positive
  output, pausing spawning until either the window resets or the cap rises
  enough to clear it.

  | remaining_5h   | elapsed_5h_frac | cap_5h |
  |----------------|----------------:|-------:|
  | 5h (18000s)    | 0.0             | 0%     |
  | 4h (14400s)    | 0.2             | 10%    |
  | 2.5h (9000s)   | 0.5             | 25%    |
  | 1h (3600s)     | 0.8             | 40%    |
  | 0              | 1.0             | 50%    |

  At window-start, `cap_5h = 0` and the gate condition `used_5h >= cap_5h`
  evaluates as `0 >= 0`, so spawning is briefly paused for the first slice of
  every 5h window. This is intentional — the linear schedule enforces the
  per-window ceiling from second zero. The blackout clears as soon as `cap_5h`
  rises above the current `used_5h`; if `used_5h` was 0 at refresh, this
  happens within seconds.

Tunables (each optional in `dispatch.config/target-workers.json`; defaults
baked into the script):

| Field | Default | Meaning |
|---|---|---|
| `target_weekly_usage_pct` | 90 | Weekly ramp's terminal target. |
| `target_five_hour_usage_pct` | 50 | 5-hour cap's terminal ceiling. |
| `max_concurrent_workers` | 8 | Absolute cap on `target_N`. |
| `ramp_tau_seconds` | 86400 | Weekly ramp time-constant. |
| `ramp_shape_k` | 2 | Weekly ramp concavity. |
| `five_hour_window_seconds` | 18000 | 5-hour window length (for cap-slope only). |

Recalibration: if mid-week idleness is too long, try `ramp_tau_seconds=172800`
(2 days) or `ramp_shape_k=1` (less concave). If the 5-hour cap is too tight,
raise `target_five_hour_usage_pct`. If you need more headroom for parallel
work, raise `max_concurrent_workers`.

**Missing-telemetry fallback.** When
`~/.local/share/productivity-tui/rate_limits.json` is missing or unreadable,
`dispatch-target-workers` prints `1` and writes a one-line note to stderr —
the gate's first comparison (`0 >= 1` is false on a typical fresh router
tick) is a no-op, so the chain degrades to today's "spawn one per tick"
behavior. The same fallback applies when the `seven_day` block is absent
(no weekly ramp anchor); a missing `five_hour` block alone disables the
5-hour gate but the weekly ramp still applies.

## 7. Terminal Disposition

The router's tick ends here. The disposition that routed it here determines
the action.

**Invariant**: the only silent terminal path is `propagate` on success.
Every other terminal disposition — `propagate` falling through to `notify
spawn-failed` on a failed spawn, every `notify <reason>` variance, every
`drain <reason>` no-work case — emits a user-visible report before the
session ends (before `dispatch-self-close` for `drain` and `propagate`;
before this turn's text output completes for `notify`, which does not
self-close). A silent `notify` or silent `drain` is a defect.

The three dispositions:

- **`propagate`** — Step 6's `dispatch-spawn-worker` returned `spawned` or
  `deduped`. The chain moved forward. Self-close
  (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-self-close
  ```

- **`notify <reason>`** — `notify spawn-failed` (Step 6's spawn exited
  non-zero) or any Steps 0–5 variance. The call site has already printed a
  user-visible report; for `notify target-blocked` it has also applied
  `dispatch:office-hours` to the target's PR when one is resolvable (see
  Step 4's *Applying `dispatch:office-hours`* subsection). Do **not**
  self-close — the session stays in `claude agents` until the user closes
  it, so the variance is visible rather than buried in a closed transcript.

  The Steps 0–5 `notify` variances and their sources:

  | Disposition | Source |
  |---|---|
  | `notify busy-lock-timeout` | Step 0 — wait timeout while another router holds the lock (subsumes #850) |
  | `notify sync-failed` | Step 1 — `git fetch` failed or `git merge --ff-only` rejected a non-fast-forward |
  | `notify resolver-failed` | Step 3 — `dispatch-resolve-arg` non-zero (PR closes ≠1 issue, bad argument) |
  | `notify main-broken` | Step 3 — `/dispatch-diagnose-main` ran and returned (`origin/main` is red) |
  | `notify target-blocked` | Step 4 — named target is closed or has an open blocker |

- **`drain <reason>`** — `drain empty-queue` (Step 3, queue empty),
  `drain worktree-conflict` (Step 5, target's worktree is owned by another
  live session), or `drain concurrency-cap` (Step 6, `live_count >=
  target_N` — the chain re-seeds when the cap-keyed timer fires at the next
  rate-limit window reset; see *The #725 cap-keyed re-seed* above). The call site has already printed a **mandatory** user-visible
  report stating the reason and the recovery path (templates live at the
  Step 3, Step 5, and Step 6 call sites). Then self-close
  (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-self-close
  ```

`dispatch-self-close` removes the managed background job by its job-id (the
basename of `$CLAUDE_JOB_DIR`). It is a no-op when `CLAUDE_JOB_DIR` is unset
(the session is interactive, not a managed background job) — so an
interactive `/dispatch-propagate` reaching Step 7 does not stop the user's live
conversation.

Step 3's `jit-reminder` outcome does not reach Step 7 — it is a deliberate
bypass, since its user-visible summary must stay open in the transcript for a
human to read, so the skill stops the tick directly.

The router does **not** spawn a successor `/dispatch-propagate` itself — the
worker's Stop hook (`.claude/hooks/dispatch-stop.sh`) spawns a fresh router
back in `worktrees/main` when the worker session ends.

### The #725 cap-keyed re-seed

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

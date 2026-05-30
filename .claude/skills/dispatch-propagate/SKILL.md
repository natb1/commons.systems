---
name: dispatch-propagate
description: Autonomous dispatch chain router — selects the next task, resolves its worktree, and spawns a /dispatch-worker to run one phase, throttled by the concurrency-cap gate. The user-typed /dispatch is a thin shim that runs these instructions with the gate bypassed.
---

# Dispatch (propagate)

The dispatch chain router. Each `/dispatch-propagate` is a `claude --bg`
background job rooted in `worktrees/main`: it selects the single most pressing
task, resolves its worktree, spawns a `/dispatch-worker <N>` background job to
run one phase there, and exits. The worker runs that phase, then spawns a fresh
router and self-deletes (see reference.md *Chain mechanics*). The router runs no
phase skill itself — it is a thin selection-and-spawn loop.

`/dispatch-propagate` takes an **optional issue-or-PR-number argument** (leading `#`
optional). With an argument, it targets that issue and skips the queue scan; a
PR number is resolved to the issue that PR closes (see Step 3).

Run `/dispatch-propagate` from any worktree; selection ignores cwd. The router
never enters a worktree; it materializes the target worktree (if needed) and
spawns the worker into it. Run `gh` commands (`gh label create`, `gh pr edit`,
and the scripts that invoke `gh`) with `dangerouslyDisableSandbox: true` — see
`.claude/rules/sandbox.md`.

## 0. Acquire the Dispatch Lock

Run this as the **very first action** — before sync, JIT, the health gate,
selection, and worktree resolution. Runs unconditionally, whether or not an
issue-or-PR-number argument was given.

```bash
LOCK=$(.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock --wait)
```

Run this Bash call with **both** `dangerouslyDisableSandbox: true` (lock write +
`claude agents --json` socket query; see `.claude/rules/sandbox.md`) and an
elevated `timeout: 600000` (ms) (`--wait` blocks on contention up to
`DISPATCH_LOCK_WAIT_TIMEOUT`, default 300 s, exceeding the default Bash timeout).

Route on `$LOCK`:

- **`acquired`** → this `/dispatch-propagate` holds the lock; proceed to Step 1.
- **`busy`** → the wait timeout elapsed without acquiring — a wedged selection
  in another `/dispatch-propagate`. The script's **stderr** carries a one-line
  diagnostic naming the wait duration and the holding sessionId; report those,
  then proceed to Step 7 with `notify busy-lock-timeout` (subsumes #850) — run no
  sync, no health gate, no selection, no phase skill. The user-visible report is
  mandatory (a silent stop would hide the wedge). Recommend the user verify the
  recorded holder is still live with:

  ```
  claude agents --json | jq '.[] | select(.sessionId == "<holder>")'
  ```

### Releasing the lock

The lock covers **Steps 0-5 only**; Step 6 (the worker spawn) runs with the lock
**released**. Release happens at exactly two kinds of point:

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

The `main-broken` stop path is the one exception: `/dispatch-diagnose-main`
runs `--release` itself, so `/dispatch-propagate` Step 3's `main-broken` branch
must not call `--release` again.

Both calls need `dangerouslyDisableSandbox: true` (same reason as Step 0); they
print `released` or `noop`, both fine, so the skill does not branch on the output.

Releasing after Step 5 is safe, and the `tmp/dispatch-worktree` marker is the
canonical post-Step-5 reclaim signal; see reference.md (*Releasing the lock*
and *Per-worktree invariant*) for the safety argument, marker/reclaim
semantics, and the two orthogonal lock scopes. Later steps cross-reference
*Releasing the lock* rather than repeating these commands.

## 1. Sync local main with `origin/main`

Run this step **only when the current branch is `main`**. From an issue worktree,
skip this step — the worker's phase skills already merge `origin/main` into the
issue branch at their own entry points.

Fast-forward local `main` to `origin/main` — no push (a no-op when already equal):

```bash
git fetch origin main && git merge --ff-only origin/main
```

- If `git fetch` fails, or `git merge --ff-only` rejects a non-fast-forward,
  release the lock (see *Releasing the lock*), surface the error, then proceed to
  Step 7 with `notify sync-failed` — do not proceed to target selection.

## 2. Run the JIT Engine

Generate any due just-in-time (JIT) issues before selecting a target. The JIT
engine reads `dispatch.config/jit.json` and creates the recurring issues it
configures.

Run this **after** the `origin/main` sync and **before** the health gate (so
jits fire even when `main` is red). It runs unconditionally — on `main` and from
inside an issue worktree alike; its debounce makes frequent re-runs cheap.

    .claude/skills/dispatch-propagate/scripts/dispatch-jit-engine

Run this Bash call with `dangerouslyDisableSandbox: true` (tmp-state write + `gh`;
see `.claude/rules/sandbox.md`).

With no `dispatch.config/jit.json` present the engine is a no-op and prints
nothing. Otherwise it prints one line per configured jit — `<key>: created #<n>`,
`<key>: skipped (<reason>)`, or `<key>: debounced`. Report what it created.

JIT generation is best-effort — on a non-zero exit, report the engine's stderr
but do not stop; continue to target selection.

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
    create no worktree. (Covers a PR that closes ≠1 issue, or an argument that is
    neither an issue nor a PR.)

- **No argument** → run target selection. A single invocation decides every
  Step 3 outcome (JIT, main-broken gate, queue ladder all internal) and emits
  the result on its one output line.

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
    enumeration, log-fetch, summary, and lock-release.
  - `jit-reminder <repo> <num> <project> <item-id>` — invoke
    `/dispatch-jit-reminder <repo> <num> <project> <item-id>`, then stop the
    tick directly (a Step 7 bypass). The skill owns the claim + lock-release +
    summarize + stop sequence; Steps 4, 5, and 6 are all skipped.
  - `empty` — nothing eligible. Release the lock (see *Releasing the lock*),
    then proceed to Step 7 with `drain empty-queue` — the user-visible report
    is mandatory there ("queue empty — closing; the office-hours queue or a
    new issue will re-seed the chain"), not optional.

  The router acts only on the emitted line. The internal priority order (JIT →
  `origin/main` health gate → topic-category × priority × phase ladder) and the
  ladder mechanics are in reference.md (*Selection-ladder mechanics*).

## 4. Trace to an Open Leaf

This step runs **only for an explicit `/dispatch-propagate <N>` argument**; a
queue-selected `issue <num>` is already a resolved startable open leaf.

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
  If it prints a PR number, skip leaf tracing (whether the target arrived as a
  `pr <num> <branch> <phase>` queue result or as an explicit issue argument).
  **Do not infer PR existence from title search or other ad-hoc `gh` queries** —
  `dispatch-find-pr` is the only correct check (see Step 5).

Check the resolved target issue `<N>` for open blockers
(`dangerouslyDisableSandbox: true` — the script calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-check-blockers <N>
```

Route on its exit code:

- **Exit 0** (no output) — no open blockers. Continue.
- **Exit 2** (prints `blocked:<num>[,<num>…]`) — the target has open blockers.
  Release the lock (see *Releasing the lock*), report the listed blocker(s),
  park the issue with

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-apply-office-hours <N> "target has an open blocker"
  ```

  (see *Applying `dispatch:office-hours`* below), then proceed to Step 7 with
  `notify target-blocked`.

This guard applies even when a PR exists; closed blockers do not gate.
`dispatch-check-blockers` routes through `count_open_blockers` — the same helper
the queue path (`dispatch-select-target`) uses — so the explicit and queue paths
agree on what counts as "blocked".

If a named target issue is **closed**, release the lock (see *Releasing the
lock*), report it, park the issue with

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-apply-office-hours <N> "named target issue is closed"
```

(see *Applying `dispatch:office-hours`* below), then proceed to Step 7 with
`notify target-blocked`.

### Applying `dispatch:office-hours`

`notify target-blocked` queues the target for human review.
`dispatch-apply-office-hours <N> <reason>` is the single write path: it applies
the label to the **issue** (never a PR), creates the label on first use with
the canonical color and description, is idempotent (a second call posts no
duplicate comment), and posts a why-comment carrying the reason. Run it with
`dangerouslyDisableSandbox: true` — `gh` needs network.

No PR resolution is needed to park a target; the label always lands on the
issue, where the office-hours queue readers anchor their skip.

## 5. Resolve the Worktree

Run the worktree-resolution script. Pass `explicit` when the target was named by
an explicit `/dispatch-propagate` argument, otherwise `queue`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-resolve-worktree <N> <explicit|queue>
```

It prints exactly one decision line — act on it. Each branch resolves a
worktree path that Step 6 passes to `dispatch-spawn-worker`.

- **`enter <path>`** → re-use an existing `<issue>-*` worktree
  (recycle-after-completion for an explicit argument, or recycle of an orphan
  worktree — on disk, no live session — for a queue selection, #905). A reused
  worktree whose checked-out branch differs from the target PR's head branch
  (resolved by `dispatch-find-pr`) is re-pointed to the PR head branch by the
  resolver before it emits `enter` — lossless, since the case where the existing
  branch carries commits not on the PR head yields `conflict` instead (#913).
  Set `WORKTREE_PATH=<path>` for Step 6. Re-sync issue context from the worktree
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`):
  ```bash
  (cd <path> && .claude/skills/dispatch-propagate/scripts/sync-issue-context <N>)
  ```

- **`create <branch>`** → no worktree exists; the router materializes it
  explicitly (the `WorktreeCreate` hook does not fire here, so this step takes
  over its responsibilities):

  1. Resolve the worktree path (project root is the parent of `--git-common-dir`):
     ```bash
     GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir)
     PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")
     WORKTREE_PATH="$PROJECT_ROOT/worktrees/<branch>"
     ```
  2. Create the worktree from `origin/main` (sandbox-allowed under `worktrees/`;
     see `.claude/rules/sandbox.md`):
     ```bash
     git worktree add -b <branch> "$WORKTREE_PATH" origin/main
     ```
  3. Authorize and pre-evaluate `.envrc` for the new tree
     (`dangerouslyDisableSandbox: true` — direnv writes its on-disk cache):
     ```bash
     direnv allow "$WORKTREE_PATH"
     direnv exec "$WORKTREE_PATH" true
     ```
     `direnv allow` whitelists the `.envrc`; `direnv exec` warms the cache so the
     worker's Bash calls pick up the flake env (`node`, `npm`, `npx`, `tsc`).
  4. Populate `CLAUDE.local.md` with full issue context
     (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`):
     ```bash
     (cd "$WORKTREE_PATH" && .claude/skills/dispatch-propagate/scripts/sync-issue-context <N>)
     ```

- **`conflict <path>`** → the worktree at `<path>` cannot be safely entered.
  Either a queue-selected target already has a worktree another live session
  owns (`dispatch-select-target` resolves the `help wanted` tier to a leaf with
  no worktree, so for a queue selection this arises only from a race — another
  session created the worktree between selection and worktree resolution), or
  the reused `<issue>-*` worktree's checked-out branch carries commits not on
  the target PR's head branch, so re-pointing it would discard work (#913).
  Release the lock (see *Releasing the lock*), then proceed to
  Step 7 with `notify worktree-conflict` — the user-visible report is mandatory
  there. The message depends on which conflict case fired:
  - Live-session race: "worktree at `<path>` owned by another live session for
    issue `<N>`; closing — the next baton-pass or office-hours hand-off will
    re-seed"
  - Unique-commits branch mismatch: "worktree at `<path>` for issue `<N>` is
    on a branch with commits not on the PR head branch; manual inspection needed
    before re-entry"

  Not optional. Do not spawn a worker.

As the **final action of this step on every non-`conflict` (proceed) path** —
before Step 6 — run `dispatch-finalize-selection "$WORKTREE_PATH"`. The
wrapper `cd`s into the target worktree, writes the recovery marker
**inside the target worktree** (`$WORKTREE_PATH/tmp/dispatch-worktree`), and
releases the lock in one step (see *Releasing the lock*). The worker in Step 6
onward runs lock-free.

The marker is the canonical "Step 5 completed" signal used by the lock script's
post-Step-5 reclaim path; see reference.md (*Step 5 marker deep dive*).

## 6. Spawn the Worker

Spawn a `/dispatch-worker <N> <worktree-path>` background job.
`dispatch-spawn-worker` runs from the router's cwd (`worktrees/main`) but spawns
`claude --bg` with cwd = `<worktree-path>`, so the worker is born in its target
worktree (see reference.md *Step 6 spawn-cwd trade-off*). Before spawning,
consult the concurrency budgeter (see reference.md *Concurrency budgeting*); if
the live worker count already meets the target, **skip the spawn** for this tick.
Run with `dangerouslyDisableSandbox: true` (budgeter + `lib-claude-agents.sh`
socket query; see `.claude/rules/sandbox.md`):

```bash
source .claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh
TARGET_N=$(.claude/skills/dispatch-propagate/scripts/dispatch-target-workers)
if LIVE_COUNT=$(claude_agents_count_by_name_prefix dispatch-worker-); then
  if (( LIVE_COUNT >= TARGET_N )); then
    echo "router: skipping spawn — $LIVE_COUNT live worker(s) >= target $TARGET_N (drain concurrency-cap)"
    # drain concurrency-cap: schedule the cap-keyed re-seed (see Step 7), then go to Step 7.
    .claude/skills/dispatch-propagate/scripts/dispatch-schedule-reseed
  else
    .claude/skills/dispatch-propagate/scripts/dispatch-spawn-worker <N> "$WORKTREE_PATH"
  fi
else
  # UNKNOWN — daemon query failed. Fail open; dispatch-spawn-worker's dedup is the last-line defense.
  .claude/skills/dispatch-propagate/scripts/dispatch-spawn-worker <N> "$WORKTREE_PATH"
fi
```

On the skip path, `dispatch-schedule-reseed` re-seeds the chain when the cap
window reopens (see *The #725 cap-keyed re-seed* below).

`dispatch-spawn-worker` prints `spawned` or `deduped` (per-worktree invariant —
see reference.md *Per-worktree invariant*) and exits 0; it exits non-zero when a
worker was spawned but did not register. The router never derives the phase,
runs a phase skill, or invokes the pre-implementation relevance review — those
are the worker's responsibilities (`/dispatch-worker` Steps 1–3).

After the spawn (or skip) returns, **proceed to Step 7** (terminal disposition).
The budgeter's pace-relative pipeline, tunables, and missing-telemetry
fallback are detailed in reference.md (*Concurrency budgeting*).

## 7. Terminal Disposition

The router's tick ends here. The disposition that routed it here determines
the action.

**Invariant**: the only silent terminal path is `propagate` on success. Every
other terminal disposition emits a user-visible report before the session ends
(before `dispatch-self-close` for `drain` and `propagate`; before this turn's
text output completes for `notify`, which does not self-close). A silent
`notify` or silent `drain` is a defect.

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
  `dispatch:office-hours` to the target's **issue** via
  `dispatch-apply-office-hours` (see Step 4's *Applying
  `dispatch:office-hours`* subsection). Do **not**
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
  `drain worktree-conflict` (Step 5, target's worktree cannot be safely
  entered — either a live session owns it, or the worktree's branch carries
  commits not on the PR head branch; see the `conflict` case in Step 5), or
  `drain concurrency-cap` (Step 6, `live_count >=
  target_N` — the chain re-seeds when the cap-keyed timer fires at the next
  rate-limit window reset; see *The #725 cap-keyed re-seed* below). The call site has already printed a **mandatory** user-visible
  report stating the reason and the recovery path (templates live at the
  Step 3, Step 5, and Step 6 call sites). Then self-close
  (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-self-close
  ```

`dispatch-self-close` removes the managed background job by its job-id; it is a
no-op when `CLAUDE_JOB_DIR` is unset (interactive session), so an interactive
`/dispatch-propagate` reaching Step 7 does not stop the user's conversation.

Step 3's `jit-reminder` outcome does not reach Step 7 — it stops the tick
directly. The router does **not** spawn a successor `/dispatch-propagate` itself;
the worker's Stop hook (`.claude/hooks/dispatch-stop.sh`) spawns a fresh router
back in `worktrees/main` when the worker session ends.

### The #725 cap-keyed re-seed

The chain's resume-from-cap-stall mechanism: when Step 6 skips the spawn at a
rate-limit cap, `dispatch-schedule-reseed` writes a transient `systemd.user`
timer keyed on the blocking window's `resets_at` to re-seed the chain when the
cap reopens. See reference.md (*The #725 cap-keyed re-seed*) for the full
mechanism, idempotency, and the office-hours fallback for non-cap stalls.

---
name: dispatch
description: Orchestrate the issue workflow router — select the next task, resolve its worktree, and spawn a /dispatch-worker to run one phase
---

# Dispatch

The dispatch router. Selects the single most pressing task, resolves its
worktree, and spawns a `/dispatch-worker <N>` background job to run one phase
in that worktree. The router itself runs no phase skill — it is a thin
selection-and-spawn loop.

Each `/dispatch` is a `claude --bg` background job (#725) rooted in
`worktrees/main`. The router selects, spawns a worker, and exits. The worker
runs one phase in its target worktree, then spawns a fresh `/dispatch` router
back in `worktrees/main` and self-deletes. That router → worker → router
chain advances the workflow; the #725 heartbeat re-seeds it when no job is
running.

`/dispatch` takes an **optional issue-or-PR-number argument** (leading `#`
optional). With an argument, it targets that issue and skips the queue scan; a
PR number is resolved to the issue that PR closes (see Step 3).

Run `/dispatch` from any worktree; selection ignores cwd. The router never
enters a worktree; it materializes the target worktree (if needed) and spawns
the worker into it.

Run `gh` commands (`gh label create`, `gh pr edit`, and the scripts that invoke
`gh`) with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 0. Acquire the Dispatch Lock

Run this as the **very first action** — before the `origin/main` sync, the
JIT engine, the `origin/main` health gate, the worktree sweep, target selection,
and worktree resolution. Runs unconditionally, whether or not an issue-or-PR-number argument
was given.

```bash
LOCK=$(.claude/skills/dispatch/scripts/dispatch-acquire-lock --wait)
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

- **`acquired`** → this `/dispatch` holds the lock; proceed to Step 1.
- **`busy`** → the wait timeout elapsed without acquiring — a wedged selection
  in another `/dispatch`. The script's **stderr** carries a one-line diagnostic
  naming the wait duration and the holding sessionId; report those then **proceed
  to Step 7** (early-stop) — run no sync, no health gate, no sweep, no selection,
  and no phase skill.

### Releasing the lock

The lock covers **Steps 0-5 only** — target selection and worktree resolution.
Step 6 (the worker spawn) runs with the lock **released**.

Release happens at exactly two kinds of point, each with its own canonical
command:

- **Proceed path** — as the final action of Step 5, run
  `dispatch-finalize-selection`. The wrapper writes the
  `tmp/dispatch-worktree` marker (see *Step 5* and the marker paragraph below)
  and execs `dispatch-acquire-lock --release` in one step.
- **Every Steps 1-5 stop path** — immediately before reporting the stop reason
  and proceeding to Step 7 (early-stop), run
  `.claude/skills/dispatch/scripts/dispatch-acquire-lock --release` directly.
  Stop paths fire before the marker is written, so the strict
  `CLAUDE_CODE_SESSION_ID`-match branch applies.

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
clear that re-invokes `/dispatch`) re-acquires cleanly because the recorded
sessionId matches the re-entering session's own `CLAUDE_CODE_SESSION_ID`.

### Per-worktree invariant

The selection lock above is **per-repo** and serializes the router's selection
step (so two routers cannot race on the same target). It is one of two
mechanisms; the other is per-worktree and enforced elsewhere.

The **per-worktree invariant**: at most one live `dispatch-*` agent per issue
worktree. The router's Step 6 spawn primitive (`dispatch-spawn-worker`)
enforces this at the spawn boundary by querying
`claude agents --json --cwd <worktree-path>` (the `claude_sessions_under`
helper in `lib-claude-agents.sh`). If any live `dispatch-*` agent is already
under `<worktree-path>`, the spawn is `deduped` and no new worker starts. The
worker is born in the target worktree and dies there; per-worktree dedup
naturally serializes per-issue work without the selection lock having to.

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
  the lock*), surface the error, then **proceed to Step 7** (early-stop) — do
  not proceed to target selection.

## 2. Run the JIT Engine

Generate any due just-in-time (JIT) issues before selecting a target. The JIT
engine reads the local `dispatch.config/jit.json` and creates the recurring
issues it configures.

Run this **after** the `origin/main` sync and **before** the health gate, so
jits fire even when `main` is red. It runs unconditionally — on `main` and from
inside an issue worktree alike; its debounce makes frequent re-runs cheap.

    .claude/skills/dispatch/scripts/dispatch-jit-engine

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
  TARGET=$(.claude/skills/dispatch/scripts/dispatch-resolve-arg <arg>)
  ```

  An issue number passes through unchanged; a PR number resolves to the single
  issue that PR closes (GitHub's `Closes #N` closing-issue references). Route on
  the exit code:

  - **Exit 0** → `$TARGET` is the target issue number; that issue is the target.
    Skip the queue scan.
  - **Non-zero exit** → release the lock (see *Releasing the lock*), report the
    script's stderr message, then **proceed to Step 7** (early-stop); create no
    worktree. This covers a PR
    that closes no issue, a PR that closes more than one issue, and an argument
    that is neither an issue nor a PR — consistent with the other Steps 1-5 stop
    paths.

- **No argument** → run target selection. A single invocation decides every
  Step 3 outcome: JIT, main-broken gate, sweep orphan adoption, and the queue
  ladder are all internal to the script and emitted on its one output line.

  ```bash
  SELECTED=$(.claude/skills/dispatch/scripts/dispatch-select-target)
  ```

  (`dangerouslyDisableSandbox: true` — it calls `gh` and walks `/proc`.)

  Route on `$SELECTED`:

  - `worktree-adopted <N> <branch>` — `dispatch-sweep` adopted an orphaned
    worktree elsewhere on disk. Skip Step 4 and proceed to Step 5 with `<N>` and
    mode `explicit` — treat the adoption like an explicit `/dispatch <N>`.
    (Step 4's closed-issue, open-blocker, and ready-PR gates have already been
    enforced by `dispatch-sweep` itself before emitting this directive — a
    `done`-phase orphan whose PR is non-draft and awaiting human merge is not
    adopted and instead falls through to the queue-ladder on the next tick.)
  - `pr <num> <branch> <phase>` — a PR to work on; `<phase>` is pre-derived by
    the selection scan, so Step 6 reuses it instead of re-deriving. Proceed to
    Step 5 with mode `queue`.
  - `issue <num>` — a `help wanted` issue to implement, pre-resolved by the
    selection scan to a startable open leaf (not necessarily the top-level
    `help wanted` issue). Proceed to Step 5 with mode `queue`.
  - `cleanup-unknown <path>` — the sweep found a worktree with no open PR and
    no inferable issue number. Invoke `/dispatch-cleanup-unknown <path>` — the
    skill owns the `AskUserQuestion` confirmation and the on-Yes/No actions, and
    returns the resumed `dispatch-select-target` output (`worktree-adopted`,
    `pr`, `issue`, `empty`, or another `cleanup-unknown <path2>` if a second
    unknown orphan exists — re-invoke the skill with the new path to confirm)
    for routing here. Treat the returned line as a fresh `$SELECTED` and route
    on it as above. This is the only sweep path that can destroy
    potentially-unmerged code.
  - `main-broken <sha>` — invoke `/dispatch-diagnose-main <sha>`, then
    **proceed to Step 7** (early-stop). The skill owns the failing-check
    enumeration, log-fetch, summary, lock-release, and stop.
  - `jit-reminder <repo> <num> <project> <item-id>` — invoke
    `/dispatch-jit-reminder <repo> <num> <project> <item-id>`, then stop the
    tick directly (the skill is a Step 7 bypass — its user-visible summary must
    stay open in the transcript for a human to read). The skill owns the claim
    + lock-release + summarize + stop sequence; Steps 4, 5, and 6 are all
    skipped.
  - `empty` — nothing eligible. Release the lock (see *Releasing the lock*),
    report that the queue is empty, then **proceed to Step 7** (early-stop).

  Priority order the script implements, top to bottom: JIT scan →
  `origin/main` CI health gate → sweep orphan adoption → topic-category ×
  phase ladder. A jit-reminder surfaces even when `origin/main` is red because
  the JIT scan precedes the main-broken gate.

  The topic-category × phase ladder is two-tier: a topic **category** nests
  outside the phase **ladder**. Categories, highest priority first:
  `priority` → `bug` → `testing infrastructure` → `dispatch` → `other`. A
  `priority`-labelled issue (or a PR closing one) outranks every other
  category; the label is human-applied — `/ready` never applies it
  automatically. A PR's category is the highest-priority topic among the
  labels of every issue it closes; an issue's category is the highest-priority
  topic among its own labels; anything with no topic label is `other`. The
  selector exhausts one category's whole ladder before moving to the next.

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

This step runs **only for an explicit `/dispatch <N>` argument**. A queue-selected
`issue <num>` is already a resolved startable open leaf — `dispatch-select-target`
traced it during selection — so re-tracing would just return the same leaf.

When the resolved target is an **explicitly-named open issue with no PR**, trace
to its open leaf in `explicit` mode:

```bash
.claude/skills/dispatch/scripts/dispatch-trace-leaf <N> explicit
```

It walks open blockers and sub-issues to an open leaf and prints one issue number.
Retarget to that leaf.

Skip leaf tracing when:
- The target was queue-selected (`issue <num>`) — `dispatch-select-target` already
  resolved it to a startable open leaf.
- A PR exists for the target — check with:
  ```bash
  .claude/skills/dispatch/scripts/dispatch-find-pr <N>
  ```
  If it prints a PR number, implementation is already underway; skip leaf tracing.
  This applies whether the target arrived as a `pr <num> <branch> <phase>` queue
  result or as an explicit issue argument. **Do not infer PR existence from title
  search or other ad-hoc `gh` queries** — `dispatch-find-pr` is the only correct
  check (see Step 5).

If the resolved target issue `<N>` has any **open** blocker — run
`issue-blocking <N>` and check for any entry with `state` `OPEN` — release the
lock (see *Releasing the lock*), report the open blocker, then **proceed to
Step 7** (early-stop). This guard applies even when a PR exists; closed blockers
do not gate.

If a named target issue is **closed**, release the lock (see *Releasing the
lock*), report it, then **proceed to Step 7** (early-stop).

## 5. Resolve the Worktree

Run the worktree-resolution script. Pass `explicit` when the target was named by
an explicit `/dispatch` argument, otherwise `queue`:

```bash
.claude/skills/dispatch/scripts/dispatch-resolve-worktree <N> <explicit|queue>
```

It prints exactly one decision line — act on it. Each branch resolves to a
worktree path that Step 6 will pass to `dispatch-spawn-worker`.

- **`enter <path>`** → re-use an existing `<issue>-*` worktree (the
  recycle-after-completion case, reached only for an explicit argument). Set
  `WORKTREE_PATH=<path>` for Step 6. Re-sync issue context from the worktree
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`):
  ```bash
  (cd <path> && .claude/skills/dispatch/scripts/sync-issue-context <N>)
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
     (cd "$WORKTREE_PATH" && .claude/skills/dispatch/scripts/sync-issue-context <N>)
     ```

- **`conflict <path>`** → a queue-selected target already has a worktree, so
  another session owns it. (`dispatch-select-target` resolves the `help wanted`
  tier to a leaf with no worktree, so for a queue selection this arises only from
  a race — another session created the worktree between selection and worktree
  resolution.) Release the lock (see *Releasing the lock*), then report the
  conflict (name `<path>` and issue `<N>`), then **proceed to Step 7**
  (early-stop); do not spawn a worker.

On every non-`conflict` path, before the worker is spawned, create the recovery
marker **inside the target worktree** (`$WORKTREE_PATH`):

```bash
(cd "$WORKTREE_PATH" && mkdir -p tmp && touch tmp/dispatch-worktree)
```

The marker is the canonical "Step 5 completed" signal. Two consumers read it:
`restore-dispatch-skill.sh` (bound to `SessionStart:clear`) keys context-clear
recovery on it — when present, it re-invokes `/dispatch-worker <N>` so the
worker re-derives the phase from PR/CI ground truth — and the lock script
keys post-Step-5 reclaim on it (see *Releasing the lock*).
`.claude/hooks/worktree-create.sh` also writes the marker as its final action
on every successful worktree creation, so a fresh worktree is marker-bearing
the moment the hook returns — the router's explicit marker write here is the
in-skill defense for any code path that bypasses the hook. The router itself never writes the marker
into its own cwd (`worktrees/main`), so a `SessionStart:clear` there is a
no-op — correct, since the router is short-lived and re-seeded by the #725
heartbeat. The marker is an empty boolean flag with no payload; it persists
for the worktree's life and needs no cleanup — `tmp/` is git-ignored, and
removing the worktree removes it.

As the **final action of this step on every non-`conflict` (proceed) path** —
after the marker is written, before Step 6 — release the lock (see *Releasing
the lock*). The worker in Step 6 onward runs lock-free.

## 6. Spawn the Worker

Spawn a `/dispatch-worker <N>` background job with `cwd=$WORKTREE_PATH` (the
path resolved in Step 5). Run with `dangerouslyDisableSandbox: true` — the
script reaches the local Claude daemon over a socket; see
`.claude/rules/sandbox.md`:

```bash
.claude/skills/dispatch/scripts/dispatch-spawn-worker <N> "$WORKTREE_PATH"
```

It prints `spawned` (a worker was started) or `deduped` (another `dispatch-*`
session is already live at `$WORKTREE_PATH` — the per-worktree invariant
prevents two workers from racing on the same worktree) and exits 0; it exits
non-zero when a worker was spawned but did not register.

The router never derives the phase, runs a phase skill, or invokes the
pre-implementation relevance review — those are the worker's responsibilities
(`/dispatch-worker` Steps 1–3).

After the spawn returns, **proceed to Step 7** (terminal disposition).

## 7. Terminal Disposition

The router's tick ends here. There are two dispositions:

- **spawn-failed** — the Step 6 `dispatch-spawn-worker` call exited non-zero
  (a worker was spawned but did not register). Do **not** self-close. Report
  the failed spawn and stop, leaving this router job open so the failure is
  visible and the spawn can be retried.

- **clean completion or early-stop** — every other terminal path:
  - Step 6 returned `spawned` or `deduped` (clean completion).
  - A Steps 0–5 stop path (busy lock, sync failure, empty queue, `main-broken`,
    resolver failure, closed-issue target, open-blocker gate, worktree
    conflict, jit-reminder summary). The jit-reminder
    summary is an exception that **does not self-close** — it bypasses Step 7
    entirely, per the jit-reminder handler in Step 3.

  Self-close (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch/scripts/dispatch-self-close
  ```

  The script removes the managed background job by its job-id (the basename of
  `$CLAUDE_JOB_DIR`). It is a no-op when `CLAUDE_JOB_DIR` is unset (the
  session is interactive, not a managed background job) — so an interactive
  `/dispatch` reaching Step 7 does not stop the user's live conversation.

The router does **not** spawn a successor `/dispatch` itself — the worker
spawned in Step 6 will spawn a fresh router back in `worktrees/main` when its
phase completes (`/dispatch-worker` Step 4). For early-stop dispositions, no
worker was spawned; the #725 heartbeat re-seeds the chain if it has drained.

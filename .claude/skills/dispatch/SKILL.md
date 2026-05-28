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
chain advances the workflow; the #725 daily 9 AM restart-from-zero re-seeds
it when the prior day ended without an in-flight worker (see Step 7's
*The #725 daily restart* subsection).

`/dispatch` takes an **optional issue-or-PR-number argument** (leading `#`
optional). With an argument, it targets that issue and skips the queue scan; a
PR number is resolved to the issue that PR closes (see Step 3).

Run `/dispatch` from the **main worktree**, or from inside an issue worktree to
continue that issue. The router never enters a worktree; it materializes the
target worktree (if needed) and spawns the worker into it.

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
  naming the wait duration and the holding sessionId; report those, then proceed
  to Step 7 with `notify busy-lock-timeout` (subsumes #850) — run no sync, no
  health gate, no sweep, no selection, and no phase skill.

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
  and proceeding to Step 7, run
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
  the lock*), surface the error, then proceed to Step 7 with `notify sync-failed`
  — do not proceed to target selection.

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
    script's stderr message, then proceed to Step 7 with `notify resolver-failed`;
    create no worktree. This covers a PR that closes no issue, a PR that closes
    more than one issue, and an argument that is neither an issue nor a PR —
    consistent with the other Steps 1-5 stop paths.

- **No argument** → run target selection. A single invocation decides every
  Step 3 outcome: current-worktree continuation, JIT, main-broken gate, sweep
  orphan adoption, and the queue ladder are all internal to the script and
  emitted on its one output line.

  ```bash
  SELECTED=$(.claude/skills/dispatch/scripts/dispatch-select-target)
  ```

  (`dangerouslyDisableSandbox: true` — it calls `gh` and walks `/proc`.)

  Route on `$SELECTED`:

  - `worktree <N> <branch>` — the current branch is `<N>-…` and issue `<N>` is
    open. Continue here; skip Step 4 and proceed to Step 5 with mode `queue`
    (worktree resolution will print `here`).
  - `worktree-closed <N> <branch>` — the current branch is `<N>-…` and issue
    `<N>` is closed or unrecognized. Release the lock (see *Releasing the
    lock*), report that the current worktree belongs to closed/unrecognized
    issue `<N>`, then proceed to Step 7 with `notify worktree-closed`
    (consistent with the named-target "closed → report and stop" rule in
    Step 4).
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
    is mandatory there ("queue empty — closing; #725 restart will re-check at
    9 AM"), not optional.

  An **explicit issue argument overrides current-worktree detection** — the
  selection script, and therefore its current-worktree detection, runs only
  when no argument is given. `/dispatch #123` run from inside worktree-456
  still targets 123.

  Priority order the script implements, top to bottom: current-worktree
  continuation → JIT scan → `origin/main` CI health gate → sweep orphan
  adoption → topic-category × phase ladder. A jit-reminder surfaces even when
  `origin/main` is red because the JIT scan precedes the main-broken gate;
  current-worktree continuation surfaces before either, so a session inside an
  `<issue>-*` worktree always continues there.

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
- The target was current-worktree detected (`worktree <N>` result) — the worktree
  is the already-committed unit of work; retargeting to a sub-issue or blocker
  would be wrong.

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
`.claude/skills/dispatch/scripts/dispatch-find-pr <N>`; if it prints a PR
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
an explicit `/dispatch` argument, otherwise `queue`:

```bash
.claude/skills/dispatch/scripts/dispatch-resolve-worktree <N> <explicit|queue>
```

It prints exactly one decision line — act on it. Each branch resolves to a
worktree path that Step 6 will pass to `dispatch-spawn-worker`.

- **`here`** → the current branch already is the target's worktree. Set
  `WORKTREE_PATH="$(git rev-parse --show-toplevel)"` for Step 6. Re-sync issue
  context (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls
  `gh`):
  ```bash
  .claude/skills/dispatch/scripts/sync-issue-context <N>
  ```

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
  resolution.) Release the lock (see *Releasing the lock*), then proceed to
  Step 7 with `drain worktree-conflict` — the user-visible report is mandatory
  there ("worktree at `<path>` owned by another live session for issue `<N>`;
  closing — #725 restart will re-check at 9 AM"), not optional. Do not spawn a
  worker.

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
in-skill defense for the `here` path and for any code path that bypasses the
hook. The router itself never writes the marker
into its own cwd (`worktrees/main`), so a `SessionStart:clear` there is a
no-op — correct, since the router is short-lived and re-seeded by the #725
daily restart. The marker is an empty boolean flag with no payload; it persists
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
  .claude/skills/dispatch/scripts/dispatch-self-close
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
  | `notify worktree-closed` | Step 3 — current worktree belongs to a closed or unrecognized issue |
  | `notify main-broken` | Step 3 — `/dispatch-diagnose-main` ran and returned (`origin/main` is red) |
  | `notify target-blocked` | Step 4 — named target is closed or has an open blocker |

- **`drain <reason>`** — `drain empty-queue` (Step 3, queue empty) or
  `drain worktree-conflict` (Step 5, target's worktree is owned by another
  live session). The call site has already printed a **mandatory**
  user-visible report stating the reason and the recovery path ("queue
  empty — closing; #725 restart will re-check at 9 AM" / "worktree at
  `<path>` owned by another live session for issue `<N>`; closing — #725
  restart will re-check at 9 AM"). Then self-close
  (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch/scripts/dispatch-self-close
  ```

`dispatch-self-close` removes the managed background job by its job-id (the
basename of `$CLAUDE_JOB_DIR`). It is a no-op when `CLAUDE_JOB_DIR` is unset
(the session is interactive, not a managed background job) — so an
interactive `/dispatch` reaching Step 7 does not stop the user's live
conversation.

Step 3's `jit-reminder` and `cleanup-unknown` outcomes do not reach Step 7.
`jit-reminder` is a deliberate bypass — its user-visible summary must stay
open in the transcript for a human to read, so the skill stops the tick
directly. `cleanup-unknown` returns to Step 3's routing.

The router does **not** spawn a successor `/dispatch` itself — the worker
spawned in Step 6 spawns a fresh router back in `worktrees/main` when its
phase completes (`/dispatch-worker` Step 4).

### The #725 daily restart

The #725 daily 9 AM dispatch restart is the workflow's restart-from-zero
mechanism. It re-seeds the chain when the prior day ended without an
in-flight worker — covering the cumulative end-of-day drain (every `drain`
disposition that ended a tick), rate-limit cap reached (#845), predecessor
crash, and missed ticks (e.g. a WSL shutdown). It is not tied to any one
disposition; every terminal state, including `notify` paths whose sessions
the user closes without manual restart, falls within its scope.

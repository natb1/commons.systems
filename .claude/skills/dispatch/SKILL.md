---
name: dispatch
description: Orchestrate the issue workflow — select the next task, derive its phase, and dispatch exactly one phase skill
---

# Dispatch

Selects the single most pressing task, resolves its worktree, derives the current
workflow phase from PR/issue status, and dispatches **exactly one phase skill** —
then stops. Each `/dispatch` is a `claude --bg` background job (#725): a job
advances one phase, passes the baton to a fresh `/dispatch` job, then
self-deletes (`claude rm`). That self-perpetuating chain advances the
workflow; the #725 heartbeat re-seeds it when no job is running.

`/dispatch` takes an **optional issue-or-PR-number argument** (leading `#`
optional). With an argument, it targets that issue and skips the queue scan; a
PR number is resolved to the issue that PR closes (see Step 3).

Run `/dispatch` from the **main worktree**, or from inside an issue worktree to
continue that issue. Step 5 switches into the target's worktree via `EnterWorktree`;
the phase skill runs there.

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
  to Step 9** (early-stop) — run no sync, no health gate, no sweep, no selection,
  and no phase skill.

### Releasing the lock

The lock covers **Steps 0-5 only** — target selection and worktree resolution.
Steps 6-9 (the phase skill, the pre-implementation relevance review, and the
hand-off) run with the lock **released**.

Release happens at exactly two kinds of point, each with its own canonical
command:

- **Proceed path** — as the final action of Step 5, run
  `dispatch-finalize-selection`. The wrapper writes the
  `tmp/dispatch-worktree` marker (see *Step 5* and the marker paragraph below)
  and execs `dispatch-acquire-lock --release` in one step.
- **Every Steps 1-5 stop path** — immediately before reporting the stop reason
  and proceeding to Step 9 (early-stop), run
  `.claude/skills/dispatch/scripts/dispatch-acquire-lock --release` directly.
  Stop paths fire before the marker is written, so the strict
  `CLAUDE_CODE_SESSION_ID`-match branch applies.

Both calls need `dangerouslyDisableSandbox: true` (same reason as Step 0); no
elevated timeout is needed — `--release` returns immediately. They print
`released` or `noop`; both are fine — `noop` is a no-op when the lock is
already released or recorded against a different session whose worktree has no
marker, so the skill does not branch on the output.

Releasing after Step 5 is safe because the session then owns a worktree (or has
stopped), and the selection scan skips worktree'd targets — no other tick can
select the same issue. Later steps cross-reference *Releasing the lock* rather
than repeating these commands.

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

## 1. Sync local main with `origin/main`

Run this step **only when the current branch is `main`**. From an issue worktree,
skip this step — phase skills (`/verify-pr`, `/security-review-fix`) already merge
`origin/main` into the issue branch at their own entry points.

Fast-forward local `main` to `origin/main` — no push:

```bash
git fetch origin main && git merge --ff-only origin/main
```

It is a no-op when local `main` already equals `origin/main`.

- If `git fetch` fails, or `git merge --ff-only` rejects a non-fast-forward (local
  `main` has diverged with unexpected commits), release the lock (see *Releasing
  the lock*), surface the error, then **proceed to Step 9** (early-stop) — do
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
    script's stderr message, then **proceed to Step 9** (early-stop); create no
    worktree. This covers a PR
    that closes no issue, a PR that closes more than one issue, and an argument
    that is neither an issue nor a PR — consistent with the other Steps 1-5 stop
    paths.

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
    issue `<N>`, then **proceed to Step 9** (early-stop) (consistent with the
    named-target "closed → report and stop" rule in Step 4).
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
    **proceed to Step 9** (early-stop). The skill owns the failing-check
    enumeration, log-fetch, summary, lock-release, and stop.
  - `jit-reminder <repo> <num> <project> <item-id>` — invoke
    `/dispatch-jit-reminder <repo> <num> <project> <item-id>`, then stop the
    tick directly (the skill is a Step 9 bypass — its user-visible summary must
    stay open in the transcript for a human to read). The skill owns the claim
    + lock-release + summarize + stop sequence; Steps 4, 5, and 6-7 are all
    skipped.
  - `empty` — nothing eligible. Release the lock (see *Releasing the lock*),
    report that the queue is empty, then **proceed to Step 9** (early-stop).

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
lock (see *Releasing the lock*), report the open blocker, then **proceed to
Step 9** (early-stop). This guard applies even when a PR exists; closed blockers
do not gate.

If a named target issue is **closed**, release the lock (see *Releasing the
lock*), report it, then **proceed to Step 9** (early-stop).

## 5. Resolve the Worktree

Run the worktree-resolution script. Pass `explicit` when the target was named by
an explicit `/dispatch` argument, otherwise `queue`:

```bash
.claude/skills/dispatch/scripts/dispatch-resolve-worktree <N> <explicit|queue>
```

It prints exactly one decision line — act on it. `EnterWorktree` accepts exactly
one of `path` (switch to an existing worktree) or `name` (create a new one).

- **`here`** → the current branch already is the target's worktree; no
  `EnterWorktree` needed. Re-sync issue context:
  ```bash
  .claude/skills/dispatch/scripts/sync-issue-context <N>
  ```
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`.)
- **`enter <path>`** → re-use an existing `<issue>-*` worktree (the
  recycle-after-completion case, reached only for an explicit argument).
  `EnterWorktree` with `path:` set to `<path>`. After entering, re-sync issue
  context from the worktree:
  ```bash
  .claude/skills/dispatch/scripts/sync-issue-context <N>
  ```
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`.)
- **`create <branch>`** → no worktree exists. `EnterWorktree` with `name:` set to
  `<branch>`. This fires the `WorktreeCreate` hook, which runs `sync-issue-context`
  and populates `CLAUDE.local.md` with full issue context.
- **`conflict <path>`** → a queue-selected target already has a worktree, so
  another session owns it. (`dispatch-select-target` resolves the `help wanted`
  tier to a leaf with no worktree, so for a queue selection this arises only from
  a race — another session created the worktree between selection and worktree
  resolution.) Release the lock (see *Releasing the lock*), then report the
  conflict (name `<path>` and issue `<N>`), then **proceed to Step 9**
  (early-stop); do not `EnterWorktree`.

As the **final action of this step on every non-`conflict` (proceed) path** —
before Step 6 — run:

```bash
.claude/skills/dispatch/scripts/dispatch-finalize-selection
```

The wrapper writes the `tmp/dispatch-worktree` marker and releases the lock
(see *Releasing the lock*) in one step. The phase skill in Step 6 onward runs
lock-free. The wrapper needs `dangerouslyDisableSandbox: true` (same reason as
the underlying `dispatch-acquire-lock --release` — see *Releasing the lock*).

The marker is the canonical "Step 5 completed" signal. Two consumers read it:
`restore-dispatch-skill.sh` (bound to `SessionStart:clear`) keys context-clear
recovery on it — when present, it re-invokes `/dispatch` so the phase is
re-derived from PR/CI ground truth — and the lock script keys post-Step-5
reclaim on it (see *Releasing the lock*). `.claude/hooks/worktree-create.sh`
also writes the marker as its final action on every successful WorktreeCreate,
so a fresh (or re-entered) worktree is marker-bearing the moment
`EnterWorktree` returns — `dispatch-finalize-selection`'s marker write is the
in-skill defense for the `here` path and for any code path that bypasses the
hook. The marker is an empty boolean flag with no payload; it persists for the
worktree's life and needs no cleanup — `tmp/` is git-ignored, and removing the
worktree removes it.

## 6. Derive the Phase

When the target is a **queue-selected PR** (`pr <num> <branch> <phase>` from Step 3),
the phase is already on the result line — use it directly and skip the script below.

On every other path — an explicit issue argument, a `worktree <N>` result, or a
queue-selected `issue <num>` — run the phase script against the final target
(issue number or branch):

```bash
.claude/skills/dispatch/scripts/dispatch-phase <target>
```

It prints exactly one phase name. CI status is checked **before** labels — a draft PR
with non-green CI is always `verify`, regardless of which `dispatch:*` labels are
present.

**Do not infer the phase from hand-rolled `gh` queries.** `dispatch-phase` is the
only valid phase-derivation path (or the pre-derived `<phase>` field from
`dispatch-select-target` for queue-selected PRs). PR existence in particular
**must not** be checked via title search (e.g. `gh pr list --search "<N> in:title"`)
— a PR's title may not contain the issue number. The only correct PR-existence check
is `dispatch-find-pr <N>`, which uses the `<issue>-` branch-prefix convention.

Map the phase:

| Phase | Meaning | Next action |
|---|---|---|
| `implement` | no PR on the target | relevance review (Step 8), then dispatch its verdict |
| `verify` | draft PR, CI completed and failed | `/verify-pr` |
| `waiting` | draft PR, CI in progress (running/queued/not started) | monitor CI to completion with a `sonnet` subagent, then re-derive the phase and dispatch it (Step 7) |
| `qa` | draft PR, CI green, no `dispatch:*` label | `/dispatch-qa` |
| `code-review` | draft PR + `dispatch:qa-done` | `/code-review-fix` (applies `dispatch:code-reviewed` itself) |
| `review` | draft PR + `dispatch:code-reviewed` | `/review-fix` (applies `dispatch:reviewed` itself) |
| `security` | draft PR + `dispatch:reviewed` (or `dispatch:security-reviewed` — re-entry; `/security-review-fix` is idempotent) | `/security-review-fix` (applies `dispatch:security-reviewed` and marks ready itself) |
| `done` | non-draft (ready) PR | already complete — report, then Step 9 (early-stop) |

## 7. Dispatch One Phase, Then Stop

Invoke the one mapped phase skill via the Skill tool. Run exactly one phase per
`/dispatch` invocation.

- **`implement`** — run the Step 8 relevance review and dispatch the verdict it
  returns (`proceed` / `adjust` / `stop` — see Step 8). The draft PR's existence
  plus its CI status is its own marker — `/plan-implement` gets **no**
  `dispatch:*` label.
- **`verify`** — invoke `/verify-pr`. It runs a single pass: fix one set of failed
  CI checks, record the outcome, post it, stop. No label.
- **`waiting`** — CI checks are still running or queued. Monitor them to
  completion, then re-derive and dispatch the resolved phase within this same
  `/dispatch` invocation:
  1. Resolve the draft PR number for the target.
  2. Spawn a subagent via the Agent tool (`subagent_type: general-purpose`,
     `model: sonnet`) that:
     - first waits for CI to register at least one check — a freshly-pushed
       branch can briefly have an empty check rollup;
     - then runs `.claude/skills/dispatch/scripts/run-pr-checks-wait.sh
       <pr-num>` with `dangerouslyDisableSandbox: true`, which blocks until
       every check concludes;
     - returns once all checks have completed.
  3. After the subagent returns, re-run Step 6 (`dispatch-phase`) to re-derive
     the phase from the now-complete CI, then dispatch the resolved phase per
     this step — `/verify-pr` if any check failed, otherwise the green-CI
     phases (`qa` / `code-review` / `review` / `security` / `ready`).
  4. If the re-derived phase is still `waiting` (CI never registered any check),
     report it, then **proceed to Step 9** (early-stop) — do not loop.
- **`qa`** — invoke `/dispatch-qa`. It owns and applies `dispatch:qa-done` itself on
  a clean pass; `/dispatch` applies no label.
- **`code-review`** — invoke `/code-review-fix`. It runs `/code-review max`, applies the
  recommended fixes, defers important out-of-scope findings to tracking issues,
  posts a PR comment, and applies the `dispatch:code-reviewed` label itself —
  `/dispatch` applies no label.
- **`review`** — invoke `/review-fix`. It runs `/review`, applies the recommended
  fixes, posts a PR comment, and applies the `dispatch:reviewed` label itself —
  `/dispatch` applies no label.
- **`security`** — invoke `/security-review-fix`. Its Step 2 directly fans out
  9 parallel subagents — 6 security domains, a red team, the built-in
  `/security-review` scan (subagent-wrapped Skill invocation), and the PR's
  CodeQL alerts — then applies the required fixes, posts a PR comment, applies
  the `dispatch:security-reviewed` label, and marks the PR ready. It is
  idempotent on re-entry — `/dispatch` applies no label.
- **`done`** — report that the PR is already ready, then **proceed to Step 9**
  (early-stop). No phase skill ran, so Step 9 spawns no successor and
  self-closes.

The PR stays a **draft** through every phase; the `security` phase's
`/security-review-fix` flips it to ready as the workflow's terminal action.

After the one phase skill has run to completion, **proceed to Step 9**
(phase-completed) — do not advance to the next phase here; Step 9 hands off and
ends the job.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and billed,
so `/dispatch` cannot launch it.

### Applying the progress label

The `dispatch:*` labels are the accumulating progress markers across the full
workflow. `/dispatch-qa`, `/code-review-fix`, `/review-fix`, and
`/security-review-fix` each own and apply their own label — `dispatch:qa-done`,
`dispatch:code-reviewed`, `dispatch:reviewed`, and `dispatch:security-reviewed`
respectively — so `/dispatch` applies no `dispatch:*` label after any phase.

When a phase skill runs `dispatch-complete-phase <pr-num> <phase>`, the PR
number is expected to differ from the worktree's `<issue>-…` branch issue
number; the PR↔issue linkage was established earlier in the tick by
`dispatch-resolve-arg`, `dispatch-find-pr`, or `dispatch-select-target`'s
`pr <num> <branch> <phase>` selection result. The dispatching session must
**not** pause to re-confirm — this is the expected shape of every
phase-skill label apply.

## 8. Pre-Implementation Relevance Review

This step runs **only** for the `implement` phase — a no-PR target. Every phase
with an existing PR (`verify` onward) skips it: implementation is already
underway. It is the implementation-time counterpart of `ref-ready`'s Step 3e
relevance check; the two are deliberately separate — Step 3e is creation-time
and `$BASELINE_BRANCH`-anchored, this step is pre-implementation and
`createdAt`-anchored.

Before invoking `/plan-implement` on an `implement`-phase issue, confirm no PR
exists for the target by running:

```bash
.claude/skills/dispatch/scripts/dispatch-find-pr <N>
```

If it prints a PR number, **skip this relevance review** and advance directly to
phase derivation (Step 6) — a PR already exists and implementation is underway.

If `dispatch-find-pr` prints nothing, run a creation-date-anchored drift
analysis. First, fetch the issue's creation timestamp
(`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh issue view <N> --json createdAt -q .createdAt
```

Then gather evidence of drift since that timestamp across the paths, references, and
conventions the issue body names.

### Drift-analysis inputs

Inputs 1, 3, and 4 are independent — issue them in parallel (one message,
multiple tool calls), together with input 2's initial list call. Input 2 then
has a dependent per-PR follow-up once that list returns.

1. **Commits since creation** — one `git log --since=<createdAt> -- <path1> <path2>
   ...` across every file path the issue body names. Relevant commits indicate the
   area is actively changing and may have shifted the issue's assumptions.

2. **Merged PRs since creation that touched the same files** — list merged PRs in
   the window (`dangerouslyDisableSandbox: true` — `gh` needs network):
   ```bash
   gh pr list --state merged --search "merged:>=<createdAt>" --limit 100
   ```
   If the result hits the limit, the drift window is too wide to analyze cheaply
   — report that and recommend re-running `/ready` instead. Otherwise, for the
   PRs whose titles plausibly relate to the issue's domain, fetch their changed
   files and keep the ones overlapping the paths the issue names. Titles and
   descriptions often surface whether the overlap is incidental or substantive.

3. **Named-reference validity** — one `grep`/`rg` with all names alternated as a
   single pattern. Names include any file paths, module names, function names, CLI
   commands, env vars, or npm scripts the issue body cites. Flag anything renamed,
   moved, or removed since the issue was created.

4. **Convention drift** — re-read `CLAUDE.md` and any `.claude/rules/*.md` whose
   domain the issue touches. Flag approaches the issue assumes that no longer match
   current conventions (e.g. a deprecated pattern, a renamed package, a changed
   config shape).

Input 4 stays with the dispatching session. Inputs 1-3 may be handed to a
one-shot subagent that returns a structured drift summary — decide this before
the parallel dispatch so the calls are not run twice. The dispatching session
always owns the verdict.

### Three-way verdict

- **`proceed`** — drift absent or cosmetic; invoke `/plan-implement`.
- **`adjust`** — issue still wanted but references, conventions, or scope have
  shifted; invoke `/new-requirement` with the drift findings as the revised
  understanding, then `/plan-implement`.
- **`stop`** — codebase has moved past the need; report what changed and recommend
  closing the issue or re-running `/ready`. Do **not** invoke `/plan-implement`;
  **proceed to Step 9** (early-stop).

## 9. Hand off and self-close

Every Step 0–8 termination routes here — Step 9 is the single way a `/dispatch`
job ends. A job that just finished a phase passes the baton to a fresh
`/dispatch` job and self-closes; that self-perpetuating chain, re-seeded by the
#725 heartbeat, is what advances the workflow.

The one documented exception is the **jit-reminder** outcome in Step 3,
handled by the `/dispatch-jit-reminder` skill: by design it bypasses Step 9
and stops directly, because its user-visible summary must stay open in the
transcript for a human to read — self-closing the job would hide it. See the
jit summary session note in the `/dispatch-jit-reminder` skill.

Each termination reaches Step 9 with one of two dispositions, named by the step
that routed here:

- **phase-completed** — a phase skill (`/plan-implement`, `/verify-pr`,
  `/dispatch-qa`, `/code-review-fix`, `/review-fix`, or `/security-review-fix`)
  ran to completion. Only the Step 7 post-dispatch hand-off arrives this way.
- **early-stop** — the job stopped before any phase skill ran: a busy lock, a
  fetch / non-fast-forward failure, an empty queue, `main-broken`, a resolver
  failure, a `worktree-closed` or closed-issue target, a worktree `conflict`, a
  `waiting` phase that stayed `waiting`, a `done` PR, or an `implement`
  relevance verdict of `stop`.

Run these in order.

**1. Return to the main worktree.** If this job entered an issue worktree via
`EnterWorktree` in Step 5 (the `enter` and `create` outcomes), call
`ExitWorktree` with `action: "keep"`: return to the main worktree and leave the
issue worktree on disk as an adoptable orphan. This must run **before** the
step-2 spawn, so the successor's selection scan does not misread this
still-finishing job as a live session owning the issue worktree. `ExitWorktree`
is a no-op when `EnterWorktree` was not called this session, so it is harmless
on the early stops that never reached a worktree.

**2. Pass the baton.** On the **phase-completed** disposition only, spawn the
successor `/dispatch` job (run with `dangerouslyDisableSandbox: true` — the
script reaches the local Claude daemon over a socket; see
`.claude/rules/sandbox.md`):

```bash
.claude/skills/dispatch/scripts/dispatch-spawn
```

It prints `spawned` (a successor was started) or `deduped` (another `dispatch-*`
job is already running, so none was needed) and exits 0; it exits non-zero when
a job was spawned but did not register. **early-stop** dispositions skip this
step — they spawn no successor; the #725 heartbeat re-seeds the chain if it has
drained.

**3. Print the completion report.** State what this job did: the phase that ran
and its outcome, or the reason it stopped early.

**4. Terminal disposition.** Take exactly one of the following, in this
priority:

- **`dispatch-spawn` failed** — a phase-completed run whose step-2 spawn exited
  non-zero. Do **not** self-close. Report the failed baton-pass and stop,
  leaving this job open so the failure is visible and the spawn can be retried.

- **The report surfaces a deviation** — a phase-completed run whose step-2
  spawn succeeded, but whose completion report surfaces a deviation from the
  approved plan, or a result that does not fully satisfy the issue's acceptance
  criteria. Do **not** self-close — self-closing would bury the deviation in a
  closed job's transcript. The baton was already passed in step 2, so the chain
  keeps moving; route this item to the office-hours queue for human review.
  Resolve the PR for the target with
  `.claude/skills/dispatch/scripts/dispatch-find-pr <N>` and apply the
  `dispatch:office-hours` label to it (`gh`, `dangerouslyDisableSandbox: true`):

  ```bash
  gh pr edit <pr-num> --add-label dispatch:office-hours
  ```

  If that fails because the label does not exist yet, create it and retry —
  the same apply-first / create-on-"not found" idiom `dispatch-complete-phase`
  uses:

  ```bash
  gh label create dispatch:office-hours \
    --description "dispatch workflow: blocked on a human — awaiting input or review"
  gh pr edit <pr-num> --add-label dispatch:office-hours
  ```

  Pass no `--color`: `dispatch-complete-phase` is the single source of the
  `dispatch:*` label-colour metadata, and #757 owns `dispatch:office-hours`'s
  canonical definition — Step 9 only needs the label to exist.
  `dispatch:office-hours` is the office-hours queue's marker, shared with #757,
  whose input-block detection hooks are the label's other writer; whichever
  writer runs first creates it. Then stop — report that the item is parked in
  the office-hours queue for human review.

- **Clean completion or early-stop** — an early-stop, or a phase-completed run
  whose `dispatch-spawn` succeeded and whose report surfaces nothing that needs
  the user. Self-delete (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch/scripts/dispatch-self-close
  ```

  The script deletes the managed background job by its job-id (the basename of
  `$CLAUDE_JOB_DIR`, which is what `claude rm` expects — not the conversation
  session UUID, not the registry's `.sessionId`). It is a no-op when
  `CLAUDE_JOB_DIR` is unset (the session is interactive, not a managed
  background job) — so an interactive `/dispatch` reaching Step 9 does not delete
  the user's live conversation. The job ends; the successor it spawned — or,
  for an early-stop, the #725 heartbeat — carries the workflow forward.

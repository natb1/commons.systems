---
name: dispatch
description: Orchestrate the issue workflow — select the next task, derive its phase, and dispatch exactly one phase skill
---

# Dispatch

Selects the single most pressing task, resolves its worktree, derives the current
workflow phase from PR/issue status, and dispatches **exactly one phase skill** —
then stops. Re-invoke `/dispatch` (or `/loop /dispatch`) to advance to the next phase.

`/dispatch` takes an **optional issue-number argument** (leading `#` optional). With
an argument, it targets that issue and skips the queue scan.

Run `/dispatch` from the **main worktree**, or from inside an issue worktree to
continue that issue. Step 4 switches into the target's worktree via `EnterWorktree`;
the phase skill runs there.

Run `gh` commands (`gh label create`, `gh pr edit`, and the scripts that invoke
`gh`) with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 0. Acquire the Dispatch Lock

Run this as the **very first action** — before the `origin/main` sync, the
`origin/main` health gate, the worktree sweep, target selection, and worktree
resolution. Runs unconditionally, whether or not an issue-number argument was
given.

```bash
LOCK=$(.claude/skills/dispatch/scripts/dispatch-acquire-lock)
```

Requires `dangerouslyDisableSandbox: true` — the script writes
`$PROJECT_ROOT/tmp/dispatch.lock`, which is outside the sandbox write-allowlist
(same reason `dispatch-sweep` runs that way; see `.claude/rules/sandbox.md`).

Route on `$LOCK`:

- **`acquired`** → this `/dispatch` holds the lock; proceed to Step 1.
- **`busy`** → another `/dispatch` is active; report "another /dispatch is
  running — stopping" and **stop** — run no sync, no health gate, no sweep, no
  selection, and no phase skill.

The lock is session-scoped and self-healing: when a tick's session ends —
normally, by crash, or by kill — its PID dies and the next invocation detects
the stale record and proceeds. A crashed tick never wedges the queue. Same-session
re-entry (e.g. after a context clear that re-invokes `/dispatch`) re-acquires
cleanly because the recorded PID matches the re-entering session's own PID.

## 1. Sync local main with `origin/main`

Run this step **only when the current branch is `main`**. From an issue worktree,
skip this step — phase skills (`/verify-pr`, `/security-review-fix`) already merge
`origin/main` into the issue branch at their own entry points.

Invoke `/commit-merge-push` via the Skill tool to fetch `origin/main`, merge it into
the current branch, and push to `origin HEAD`. From the main worktree this fast-forwards local `main`; the
merge and push are no-ops when local main already equals `origin/main`.

- If the working tree is dirty, stash before invoking — `/commit-merge-push` would
  otherwise commit pending changes directly to `main`.
- If `/commit-merge-push` reports a merge conflict or push rejection, **stop** and
  surface the error — do not proceed to target selection.

## 2. Select the Target

- **Issue argument given** → strip any leading `#`; that issue is the target.
  Skip the queue scan.
- **No argument** → run the `origin/main` CI health gate first, then the
  worktree sweep, then target selection. Both gh-calling scripts need
  `dangerouslyDisableSandbox: true`.

  The health gate must run **before** the sweep: a red main means no new work
  is safe to start, and the sweep's gh calls are wasted in that case.

  ```bash
  HEALTH=$(.claude/skills/dispatch/scripts/dispatch-select-target --health-only)
  ```

  - **`main-broken <sha>`** → see the **main-broken handler** at the end of
    this step. Do **not** run the sweep or selection.
  - **`ok`** → run the sweep (also needs `dangerouslyDisableSandbox: true` for
    the `/proc` walk):

    ```bash
    SWEEP_OUT=$(.claude/skills/dispatch/scripts/dispatch-sweep 2>tmp/dispatch-sweep-stderr)
    SWEEP_EXIT=$?
    ```

    Route on the sweep outcome:

    - **Exit 0, empty stdout** → fall through to `dispatch-select-target`.
    - **Exit 0, stdout `worktree <N> <branch>`** → an orphaned worktree was
      adopted. Skip Step 3 and proceed to Step 4 with `<N>` and `explicit` —
      treat the adoption like an explicit `/dispatch <N>`.
    - **Non-zero exit, stderr `cleanup-unknown:<path>`** → the sweep found a
      worktree with no open PR and no inferable issue number. Use
      `AskUserQuestion` to ask whether to delete `<path>` — its history is
      only local. This is the only sweep path that can destroy
      potentially-unmerged code.
      - **Yes** → run `dispatch-sweep --cleanup-unknown <path>`, then re-run
        the default `dispatch-sweep`. Loop until it exits 0.
      - **No** → fall through to `dispatch-select-target`.
    - **Any other non-zero exit** → log the stderr contents to the conversation
      as a diagnostic, then fall through to `dispatch-select-target` as
      defense-in-depth. The sweep is best-effort; a malformed invocation or
      transient `gh`/`git` failure should not stall the workflow.

  ```bash
  .claude/skills/dispatch/scripts/dispatch-select-target
  ```

  It prints exactly one line:
  - `pr <num> <branch> <phase>` — a PR to work on; `<phase>` is pre-derived by the
    selection scan, so Step 5 reuses it instead of re-deriving
  - `issue <num>` — a `help wanted` issue to implement
  - `worktree <N> <branch>` — run from inside an issue worktree; target is `<N>`,
    queue scan already skipped
  - `worktree-closed <N> <branch>` — run from inside a worktree whose issue is
    closed or unrecognized → report that the current worktree belongs to
    closed/unrecognized issue `<N>` and **stop** (consistent with the named-target
    "closed → report and stop" rule in Step 3)
  - `empty` — nothing eligible
  - `main-broken <sha>` — `origin/main`'s HEAD CI has a failing check. The
    pre-sweep gate above normally catches this first; this is the same gate
    re-run as defense-in-depth. See the **main-broken handler** below.

  An **explicit issue argument overrides current-worktree detection** — the selection
  script, and therefore its current-worktree detection, runs only when no argument is
  given. `/dispatch #123` run from inside worktree-456 still targets 123.

  Priority order it implements (highest first; within a tier, oldest PR wins; PRs
  and `help wanted` issues with a local worktree are skipped; `waiting`-phase PRs are skipped entirely):
  oldest `security` PR → oldest `review` PR → oldest `simplify` PR → oldest
  `verify` PR → oldest `help wanted` issue → oldest `qa` PR → `empty`. Non-QA PRs
  are ranked closest-to-done first — `security` is the closest-to-done non-QA
  tier; `help wanted` issues rank below all non-QA PRs but above QA PRs.

  On `empty` → report that the queue is empty and **stop**.

  **main-broken handler.** `origin/main` itself is red, so no new work is safe
  to start. Do **not** run the sweep, create a worktree, branch, or phase skill.
  Diagnose main instead: enumerate the failing checks on `<sha>` by aggregating
  `gh run list --branch main` and
  `gh api repos/{owner}/{repo}/commits/<sha>/check-runs`. For a failing workflow
  run, fetch its logs with `gh run view <databaseId> --log-failed`; for a failing
  CodeQL check-run (which has no workflow-run id), open its `details_url` from
  the check-runs response. Summarize the likely cause, report it, and **stop**.
  Once a PR that fixes main exists the normal ladder picks it up (verify/ready)
  — this gate only blocks starting new, unrelated work.

## 3. Trace to an Open Leaf

When the resolved target is an **open issue with no PR** — whether queue-selected
(`issue <num>`) or named by argument — trace to its open leaf. Pass the mode that
matches Step 4's resolve call: `queue` if queue-selected, `explicit` if named by
an explicit `/dispatch` argument:

```bash
.claude/skills/dispatch/scripts/dispatch-trace-leaf <N> <queue|explicit>
```

It walks open blockers and sub-issues to an open leaf and prints one issue number.
Retarget to that leaf.

In `queue` mode the descent is worktree-aware: children whose `<N>-*` branch is
an existing local worktree (owned by another session) are skipped, and the trace
falls back to the next ready sibling. If every reachable open leaf in the subtree
is worktree-conflicted, the script exits non-zero with a message on stderr —
report "subtree fully blocked — all open leaves have worktrees owned by other
sessions" (name `<N>`) and **stop**; do not dispatch.

Skip leaf tracing when:
- A PR exists for the target (`pr <num> <branch> <phase>` result, or an explicit
  issue argument that already has a PR) — implementation is already underway.
- The target was current-worktree detected (`worktree <N>` result) — the worktree
  is the already-committed unit of work; retargeting to a sub-issue or blocker
  would be wrong.

If a named target issue is **closed**, report it and **stop**.

## 4. Resolve the Worktree

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
  another session owns it. (The queue scan skips worktree'd issues, so this arises
  only when Step 3 leaf-tracing retargets to a blocker or sub-issue that has one.)
  Report the conflict (name `<path>` and issue `<N>`) and **stop**; do not
  `EnterWorktree`.

As the **last action of this step on every non-`conflict` path** — before any
phase skill runs — create the recovery marker:

```bash
mkdir -p tmp && touch tmp/dispatch-worktree
```

`restore-dispatch-skill.sh` (bound to `SessionStart:clear`) keys context-clear
recovery on this marker — when present, it re-invokes `/dispatch` so the phase is
re-derived from PR/CI ground truth. The marker is an empty boolean flag with no
payload; it persists for the worktree's life and needs no cleanup — `tmp/` is
git-ignored, and removing the worktree removes it.

## 5. Derive the Phase

When the target is a **queue-selected PR** (`pr <num> <branch> <phase>` from Step 2),
the phase is already on the result line — use it directly and skip the script below.

On every other path — an explicit issue argument, a `worktree <N>` result, or a
queue-selected `issue <num>` (after leaf tracing in Step 3) — run the phase script
against the final target (issue number or branch):

```bash
.claude/skills/dispatch/scripts/dispatch-phase <target>
```

It prints exactly one phase name. CI status is checked **before** labels — a draft PR
with non-green CI is always `verify`, regardless of which `dispatch:*` labels are
present. Map the phase:

| Phase | Meaning | Next action |
|---|---|---|
| `implement` | no PR on the target | relevance review (Step 7), then dispatch its verdict |
| `verify` | draft PR, CI completed and failed | `/verify-pr` |
| `waiting` | draft PR, CI in progress (running/queued/not started) | monitor CI to completion with a `sonnet` subagent, then re-derive the phase and dispatch it (Step 6) |
| `qa` | draft PR, CI green, no `dispatch:*` label | `/dispatch-qa` |
| `simplify` | draft PR + `dispatch:qa-done` | `/simplify-fix` (applies `dispatch:refactored` itself) |
| `review` | draft PR + `dispatch:refactored` | `/review-fix` (applies `dispatch:reviewed` itself) |
| `security` | draft PR + `dispatch:reviewed` (or `dispatch:security-reviewed` — re-entry; `/security-review-fix` is idempotent) | `/security-review-fix` (applies `dispatch:security-reviewed` and marks ready itself) |
| `done` | non-draft (ready) PR | already complete — report and skip |

## 6. Dispatch One Phase, Then Stop

Invoke the one mapped phase skill via the Skill tool. Run exactly one phase per
`/dispatch` invocation.

- **`implement`** — run the Step 7 relevance review and dispatch the verdict it
  returns (`proceed` / `adjust` / `stop` — see Step 7). The draft PR's existence
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
  3. After the subagent returns, re-run Step 5 (`dispatch-phase`) to re-derive
     the phase from the now-complete CI, then dispatch the resolved phase per
     this step — `/verify-pr` if any check failed, otherwise the green-CI
     phases (`qa` / `simplify` / `review` / `security` / `ready`).
  4. If the re-derived phase is still `waiting` (CI never registered any check),
     report it and **stop** — do not loop.
- **`qa`** — invoke `/dispatch-qa`. It owns and applies `dispatch:qa-done` itself on
  a clean pass; `/dispatch` applies no label.
- **`simplify`** — invoke `/simplify-fix`. It runs `/simplify`, applies the
  recommended fixes, defers important out-of-scope findings to tracking issues,
  posts a PR comment, and applies the `dispatch:refactored` label itself —
  `/dispatch` applies no label.
- **`review`** — invoke `/review-fix`. It runs `/review`, applies the recommended
  fixes, posts a PR comment, and applies the `dispatch:reviewed` label itself —
  `/dispatch` applies no label.
- **`security`** — invoke `/security-review-fix`. It runs `/security-review`,
  applies the recommended fixes, posts a PR comment, applies the
  `dispatch:security-reviewed` label, and marks the PR ready. It is idempotent on
  re-entry — `/dispatch` applies no label.
- **`done`** — report that the PR is already ready and skip.

The PR stays a **draft** through every phase; the `security` phase's
`/security-review-fix` flips it to ready as the workflow's terminal action.

After dispatching the one phase, **STOP** — do not advance to the next phase.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and billed,
so `/dispatch` cannot launch it.

### Applying the progress label

The `dispatch:*` labels are the accumulating progress markers across the full
workflow. `/dispatch-qa`, `/simplify-fix`, `/review-fix`, and
`/security-review-fix` each own and apply their own label — `dispatch:qa-done`,
`dispatch:refactored`, `dispatch:reviewed`, and `dispatch:security-reviewed`
respectively — so `/dispatch` applies no `dispatch:*` label after any phase.

## 7. Pre-Implementation Relevance Review

This step runs **only** for the `implement` phase — a no-PR target. Every phase
with an existing PR (`verify` onward) skips it: implementation is already
underway. It is the implementation-time counterpart of `ref-ready`'s Step 3e
relevance check; the two are deliberately separate — Step 3e is creation-time
and `$BASELINE_BRANCH`-anchored, this step is pre-implementation and
`createdAt`-anchored.

Before invoking `/plan-implement` on an `implement`-phase (no-PR) issue, run a
creation-date-anchored drift analysis. First, fetch the issue's creation
timestamp (`dangerouslyDisableSandbox: true` — `gh` needs network):

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
  closing the issue or re-running `/ready`. Do **not** invoke `/plan-implement`.

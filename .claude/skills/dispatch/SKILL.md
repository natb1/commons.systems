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
continue that issue. Step 3 switches into the target's worktree via `EnterWorktree`;
the phase skill runs there.

Run `gh` and git-index-writing commands (`git add`, `gh pr ready`, `gh label create`)
with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 1. Select the Target

- **Issue argument given** → strip any leading `#`; that issue is the target.
  Skip the queue scan.
- **No argument** → run the selection script:

  ```bash
  .claude/skills/dispatch/scripts/dispatch-select-target
  ```

  It prints exactly one line:
  - `pr <num> <branch>` — a PR to work on
  - `issue <num>` — a `help wanted` issue to implement
  - `worktree <N> <branch>` — run from inside an issue worktree; target is `<N>`,
    queue scan already skipped
  - `worktree-closed <N> <branch>` — run from inside a worktree whose issue is
    closed or unrecognized → report that the current worktree belongs to
    closed/unrecognized issue `<N>` and **stop** (consistent with the named-target
    "closed → report and stop" rule in Step 2)
  - `empty` — nothing eligible
  - `main-broken <sha>` — `origin/main`'s HEAD CI has a failing check; the queue
    scan was short-circuited (see the `main-broken` handling block below)

  An **explicit issue argument overrides current-worktree detection** — the selection
  script, and therefore its current-worktree detection, runs only when no argument is
  given. `/dispatch #123` run from inside worktree-456 still targets 123.

  Before the priority ladder, the script runs a **top-priority `origin/main` CI
  health gate**. Every queueable task builds on `origin/main` — branches fork
  from it and merge it — so a failing check on main's HEAD means nothing is safe
  to start. The gate aggregates main's HEAD CI from two sources (CodeQL
  check-runs and Actions workflow runs); a failing conclusion short-circuits the
  scan to `main-broken <sha>` and the priority ladder is not evaluated.
  In-progress (not-yet-concluded) checks do **not** trip the gate. The gate is
  bypassed by an explicit `/dispatch <issue|pr>` argument (the queue scan is not
  run at all) and by current-worktree continuation (a session continues its own
  in-progress work regardless of main's state).

  Priority order it implements (highest first; within a tier, oldest PR wins; PRs
  with a local worktree are skipped; `waiting`-phase PRs are skipped entirely):
  oldest `ready` PR → oldest `security` PR → oldest `review` PR → oldest
  `simplify` PR → oldest `verify` PR → oldest `help wanted` issue → oldest `qa`
  PR → `empty`. Non-QA PRs are ranked closest-to-done first; `help wanted` issues
  rank below all non-QA PRs but above QA PRs.

  On `empty` → report that the queue is empty and **stop**.

  On `main-broken <sha>` → `origin/main` itself is red, so no new work is safe to
  start. Do **not** create a worktree, branch, or phase skill. Diagnose main
  instead: enumerate the failing checks on `<sha>` by aggregating
  `gh run list --branch main` and
  `gh api repos/{owner}/{repo}/commits/<sha>/check-runs`, fetch the failing
  workflow run's logs with `gh run view <databaseId> --log-failed`, summarize the
  likely cause, report it, and **stop**. Once a PR that fixes main exists the
  normal ladder picks it up (verify/ready) — this gate only blocks starting new,
  unrelated work.

## 2. Trace to an Open Leaf

When the resolved target is an **open issue with no PR** — whether queue-selected
(`issue <num>`) or named by argument — trace to its open leaf:

```bash
.claude/skills/dispatch/scripts/dispatch-trace-leaf <N>
```

It walks open blockers and sub-issues to an open leaf and prints one issue number.
Retarget to that leaf.

Skip leaf tracing when:
- A PR exists for the target (`pr <num> <branch>` result, or an explicit issue
  argument that already has a PR) — implementation is already underway.
- The target was current-worktree detected (`worktree <N>` result) — the worktree
  is the already-committed unit of work; retargeting to a sub-issue or blocker
  would be wrong.

If a named target issue is **closed**, report it and **stop**.

## 3. Resolve the Worktree

Resolve or create the final target's worktree via `EnterWorktree`, matching
`pr-workflow` Sections 2–3. `EnterWorktree` accepts exactly one of `path` (switch to
an existing worktree) or `name` (create a new one; fires the `WorktreeCreate` hook).

- **Already in the target's worktree** (current branch starts with `<issue>-`) → no
  `EnterWorktree` needed. Re-sync issue context:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/sync-issue-context <N>
  ```
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`.) Then go
  straight to creating the marker below.
- **An existing worktree matches** `<issue>-*` (parse `git worktree list --porcelain`
  as blank-line-delimited records) → `EnterWorktree` with `path:` set to that path.
  After entering, re-sync issue context from the worktree:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/sync-issue-context <N>
  ```
  (`dangerouslyDisableSandbox: true` — `sync-issue-context` calls `gh`.)
- **No existing worktree** → generate a sanitized branch name `<issue>-<slug>`:
  lowercase the issue title, replace non-alphanumeric runs with `-`, collapse repeated
  `-`, strip leading/trailing `-`, and truncate so the full branch name is ≤ 32
  characters. `EnterWorktree` with `name:` set to that branch name.

Creating via `name:` fires the `WorktreeCreate` hook, which runs `sync-issue-context`
and populates `CLAUDE.local.md` with full issue context.

As the **last action of this step on every path** — before any phase skill runs —
create the recovery marker:

```bash
mkdir -p tmp && touch tmp/dispatch-worktree
```

`restore-dispatch-skill.sh` (bound to `SessionStart:clear`) keys context-clear
recovery on this marker — when present, it re-invokes `/dispatch` so the phase is
re-derived from PR/CI ground truth. `/dispatch` is the safe single creator: it only
ever runs for dispatch sessions, so a `/pr-workflow` worktree can never acquire the
marker. The marker is an empty boolean flag with no payload; it persists for the
worktree's life and needs no cleanup — `tmp/` is git-ignored, and removing the
worktree removes it.

## 4. Derive the Phase

Run the phase script against the final target (issue number or branch):

```bash
.claude/skills/dispatch/scripts/dispatch-phase <target>
```

It prints exactly one phase name. CI status is checked **before** labels — a draft PR
with non-green CI is always `verify`, regardless of which `dispatch:*` labels are
present. Map the phase:

| Phase | Meaning | Next action |
|---|---|---|
| `implement` | no PR on the target | relevance review (Step 6), then `/plan-implement` |
| `verify` | draft PR, CI completed and failed | `/verify-pr` |
| `waiting` | draft PR, CI in progress (running/queued/not started) | report "checks still running, nothing to do" and stop |
| `qa` | draft PR, CI green, no `dispatch:*` label | `/dispatch-qa` |
| `simplify` | draft PR + `dispatch:qa-done` | `/simplify` → then label `dispatch:refactored` |
| `review` | draft PR + `dispatch:refactored` | `/review` → then label `dispatch:reviewed` |
| `security` | draft PR + `dispatch:reviewed` | `/security-review` → then label `dispatch:security-reviewed` |
| `ready` | draft PR + `dispatch:security-reviewed` | `gh pr ready <pr>` — flip draft to ready, workflow complete |
| `done` | non-draft (ready) PR | already complete — report and skip |

## 5. Dispatch One Phase, Then Stop

Invoke the one mapped phase skill via the Skill tool. Run exactly one phase per
`/dispatch` invocation.

- **`implement`** — run the Step 6 relevance review first. If it passes, invoke
  `/plan-implement`. The draft PR's existence plus its CI status is its own marker —
  `/plan-implement` gets **no** `dispatch:*` label.
- **`verify`** — invoke `/verify-pr`. It runs a single pass: fix one set of failed
  CI checks, record the outcome, post it, stop. No label.
- **`waiting`** — CI checks are still running or queued; there is nothing to do yet.
  Report "checks still running, nothing to do" and **stop** without invoking any
  phase skill or applying any label.
- **`qa`** — invoke `/dispatch-qa`. It owns and applies `dispatch:qa-done` itself on
  a clean pass; `/dispatch` applies no label.
- **`simplify` / `review` / `security`** — invoke the mapped skill (`/simplify`,
  `/review`, `/security-review`). After it **returns**, apply the accumulating
  `dispatch:*` label to the PR (see below).
- **`ready`** — run `gh pr ready <pr-num>` to flip the draft to ready-for-review.
  The workflow is complete.
- **`done`** — report that the PR is already ready and skip.

The PR stays a **draft** through every phase; only the `ready` phase flips it.

After dispatching the one phase and applying any label, **STOP** — do not advance to
the next phase.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and billed,
so `/dispatch` cannot launch it.

### Applying the progress label

The four `dispatch:*` labels — `dispatch:qa-done`, `dispatch:refactored`,
`dispatch:reviewed`, `dispatch:security-reviewed` — are the accumulating progress
markers across the full workflow. `/dispatch-qa` owns and applies `dispatch:qa-done`
on a clean pass. `/dispatch` applies the remaining three: `dispatch:refactored`,
`dispatch:reviewed`, and `dispatch:security-reviewed` — one after each corresponding
phase skill returns successfully. This keeps the generic `/simplify`, `/review`, and
`/security-review` skills dispatch-unaware.

Before applying, ensure the three labels exist idempotently — run this for each
(safe on forks where the labels do not yet exist):

```bash
gh label create "dispatch:<name>" --color BFD4F2 --description "<phase> phase complete" 2>/dev/null || true
```

Then apply the label for the completed phase:

```bash
gh pr edit <pr-num> --add-label "dispatch:<name>"
```

## 6. Pre-Implementation Relevance Review

Before invoking `/plan-implement` on an `implement`-phase (no-PR) issue, run the
`ref-ready` Step 3e relevance check against the current codebase: has the codebase
evolved to make the issue obsolete, or are any requirements already addressed by
existing code?

- **Still relevant** → proceed to invoke `/plan-implement`.
- **Obsolete or already addressed** → **stop** and report to the user what made the
  issue obsolete or what already exists, and recommend closing the issue or
  re-running `/ready`. Do **not** invoke `/plan-implement`.

This review is **skipped** for the `verify` case — a PR already exists and
implementation is underway.

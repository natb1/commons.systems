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

Run `/dispatch` from the **main worktree**. Step 3 switches into the target's
worktree via `EnterWorktree`; the phase skill runs there.

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
  - `empty` — nothing eligible

  Priority order it implements (highest first; within a tier, oldest PR wins; PRs
  with a local worktree are skipped): oldest `ready` PR → oldest `security` PR →
  oldest `review` PR → oldest `simplify` PR → oldest `verify` PR → oldest `help
  wanted` issue → oldest `qa` PR → `empty`. Non-QA PRs are ranked closest-to-done
  first; `help wanted` issues rank below all non-QA PRs but above QA PRs.

  On `empty` → report that the queue is empty and **stop**.

## 2. Trace to an Open Leaf

When the resolved target is an **open issue with no PR** — whether queue-selected
(`issue <num>`) or named by argument — trace to its open leaf:

```bash
.claude/skills/dispatch/scripts/dispatch-trace-leaf <N>
```

It walks open blockers and sub-issues to an open leaf and prints one issue number.
Retarget to that leaf.

Skip leaf tracing once a PR exists for the target (the `pr <num> <branch>` selection
result, or an explicit issue argument that already has a PR) — implementation is
already underway.

If a named target issue is **closed**, report it and **stop**.

## 3. Resolve the Worktree

Resolve or create the final target's worktree via `EnterWorktree`, matching
`pr-workflow` Sections 2–3. `EnterWorktree` accepts exactly one of `path` (switch to
an existing worktree) or `name` (create a new one; fires the `WorktreeCreate` hook).

- **Already in the target's worktree** (current branch starts with `<issue>-`) →
  proceed to Step 4.
- **An existing worktree matches** `<issue>-*` (parse `git worktree list --porcelain`
  as blank-line-delimited records) → `EnterWorktree` with `path:` set to that path.
- **No existing worktree** → generate a sanitized branch name `<issue>-<slug>`:
  lowercase the issue title, replace non-alphanumeric runs with `-`, collapse repeated
  `-`, strip leading/trailing `-`, and truncate so the full branch name is ≤ 32
  characters. `EnterWorktree` with `name:` set to that branch name.

Creating via `name:` fires the `WorktreeCreate` hook, which runs `sync-issue-context`
and populates `CLAUDE.local.md` with full issue context.

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
| `implement` | no PR on the target | relevance review (Step 6), then `/dispatch-implement` |
| `verify` | draft PR, CI not green (failing, pending, or empty rollup) | `/dispatch-implement` with a resume hint → its verify loop |
| `qa` | draft PR, CI green, no `dispatch:*` label | `/dispatch-qa` → then label `dispatch:qa-done` |
| `simplify` | draft PR + `dispatch:qa-done` | `/simplify` → then label `dispatch:refactored` |
| `review` | draft PR + `dispatch:refactored` | `/review` → then label `dispatch:reviewed` |
| `security` | draft PR + `dispatch:reviewed` | `/security-review` → then label `dispatch:security-reviewed` |
| `ready` | draft PR + `dispatch:security-reviewed` | `gh pr ready <pr>` — flip draft to ready, workflow complete |
| `done` | non-draft (ready) PR | already complete — report and skip |

## 5. Dispatch One Phase, Then Stop

Invoke the one mapped phase skill via the Skill tool. Run exactly one phase per
`/dispatch` invocation.

- **`implement`** — run the Step 6 relevance review first. If it passes, invoke
  `/dispatch-implement` (see the bridge note below). The draft PR's existence plus
  its CI status is its own marker — `/dispatch-implement` gets **no** `dispatch:*`
  label.
- **`verify`** — invoke `/dispatch-implement` (see the bridge note below) with a
  resume hint that tells it to resume at the post-implementation verify loop
  (Step 2.5). No label.
- **`qa` / `simplify` / `review` / `security`** — invoke the mapped skill
  (`/dispatch-qa`, `/simplify`, `/review`, `/security-review`). After it **returns**,
  apply the accumulating `dispatch:*` label to the PR (see below).
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
markers. Apply a label only **after** the corresponding phase skill returns
successfully; this keeps the generic `/simplify`, `/review`, and `/security-review`
skills dispatch-unaware.

Before applying, ensure the labels exist idempotently — run this for each of the four
names (safe on forks where the labels do not yet exist):

```bash
gh label create "dispatch:<name>" --color BFD4F2 --description "<phase> phase complete" 2>/dev/null || true
```

Then apply the label for the completed phase:

```bash
gh pr edit <pr-num> --add-label "dispatch:<name>"
```

## 6. Pre-Implementation Relevance Review

Before invoking `/dispatch-implement` on an `implement`-phase (no-PR) issue, run the
`ref-ready` Step 3e relevance check against the current codebase: has the codebase
evolved to make the issue obsolete, or are any requirements already addressed by
existing code?

- **Still relevant** → proceed to invoke `/dispatch-implement`.
- **Obsolete or already addressed** → **stop** and report to the user what made the
  issue obsolete or what already exists, and recommend closing the issue or
  re-running `/ready`. Do **not** invoke `/dispatch-implement`.

This review is **skipped** for the `verify` resume case — a PR already exists and
implementation is underway.

## `/dispatch-implement` env-var bridge

`/dispatch-implement` expects the legacy dispatcher's `DISPATCH_ISSUE_NUM` and
`DISPATCH_STATE_FILE` env vars, which are not set when `/dispatch` invokes it as a
skill. When invoking `/dispatch-implement` (the `implement` and `verify` rows):

1. Treat the resolved issue number `<N>` as `DISPATCH_ISSUE_NUM`, and
   `tmp/dispatch-<N>.json` as `DISPATCH_STATE_FILE`.
2. Seed the state file first so the `restore-dispatch-skill.sh` recovery hook still
   works through `/dispatch-implement`'s plan-mode context clear:

   ```bash
   [ -f tmp/dispatch-<N>.json ] || { mkdir -p tmp && printf '{}' > tmp/dispatch-<N>.json; }
   ```

3. Invoke `/dispatch-implement` with argument `#<N>`.
4. For the `verify` row, also pass a free-form resume hint instructing it to resume
   at the post-implementation verify loop (Step 2.5).

Fully decoupling `/dispatch-implement` from this legacy plumbing is a tracked
follow-up — out of scope here.

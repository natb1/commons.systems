---
name: dispatch-diagnose-main
description: Diagnose origin/main's failing CI when /dispatch detects a red main; enumerates failing checks, fetches logs, summarizes likely cause, releases the dispatch lock, and stops.
---

# Dispatch: Diagnose Main

Invoked by `/dispatch` Step 3 when `dispatch-select-target` reports
`main-broken <sha>` — `origin/main` itself is red, so no new work is safe to
start. Diagnose main, release the dispatch lock, and stop the tick. On this skill's return, the caller (`/dispatch` Step 3)
proceeds to Step 9 (early-stop). The skill does **not** run the sweep, create
a worktree, branch, PR, or invoke any phase skill.

Takes `<sha>` as its single argument — the broken `origin/main` HEAD commit.

Run `gh` commands and the lock-release with `dangerouslyDisableSandbox: true`
— see `.claude/rules/sandbox.md`.

## 1. Enumerate failing checks

Aggregate the two GitHub views of `origin/main`'s CI:

```bash
gh run list --branch main
gh api repos/{owner}/{repo}/commits/<sha>/check-runs
```

Both calls need `dangerouslyDisableSandbox: true`.

## 2. Fetch evidence for each failing check

- For a failing **workflow run**, fetch its logs:
  ```bash
  gh run view <databaseId> --log-failed
  ```
- For a failing **CodeQL check-run** (which has no workflow-run id), surface
  its `details_url` from the check-runs response.

These diagnostic `gh` calls run before the lock-release — keep them.

## 3. Release the dispatch lock

As the action immediately before the final report:

```bash
.claude/skills/dispatch/scripts/dispatch-acquire-lock --release
```

## 4. Summarize and stop

Summarize the likely cause from the logs and check-run details, report it,
and return. The caller proceeds to Step 9 (early-stop).

Once a PR that fixes main exists, the normal ladder picks it up
(verify/ready) — this gate only blocks starting new, unrelated work.

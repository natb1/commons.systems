---
name: dispatch-diagnose-main
description: Diagnose origin/main's failing CI when /dispatch detects a red main; enumerates failing checks, fetches logs, summarizes likely cause, releases the dispatch lock, and stops.
---

# Dispatch: Diagnose Main

Invoked by `/dispatch` Step 3 when `dispatch-select-target` reports
`main-broken <sha>` — `origin/main` itself is red, so no new work is safe to
start. Diagnose main, release the dispatch lock, summarize, and hand off via
`dispatch-handoff --early-stop` — the skill owns its own terminal disposition.
The skill does **not** run the sweep, create a worktree, branch, PR, or invoke
any phase skill.

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

Summarize the likely cause from the logs and check-run details, then report it.

Include only the failing check/step name and a high-level error category
(e.g. "test assertion failed", "lint error", "type error"). Do not reproduce
raw log lines, environment-variable values, file paths beyond the immediate
failing module, or any string that looks like a token, credential, or other
secret — even if GitHub Actions has already partially masked it. The
`--log-failed` output may inadvertently surface CI internals; the summary is
for the user, not a copy of the log.

Once a PR that fixes main exists, the normal ladder picks it up
(verify/ready) — this gate only blocks starting new, unrelated work.

## 5. Hand off

As the final action, run the terminal handoff (no `ExitWorktree` — no
worktree was entered on the `main-broken` path):

```bash
.claude/skills/dispatch/scripts/dispatch-handoff --early-stop
```

`dangerouslyDisableSandbox: true` — the script calls `gh`, `dispatch-spawn`,
and `dispatch-self-close` (see `.claude/rules/sandbox.md`). On `--early-stop`
the script skips the spawn (the #725 heartbeat re-seeds the chain) and hands
off directly to `dispatch-self-close`.

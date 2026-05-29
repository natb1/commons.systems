---
name: dispatch-diagnose-main
description: Diagnose origin/main's failing CI when /dispatch-propagate detects a red main; enumerates failing checks, fetches logs, summarizes likely cause, releases the dispatch lock, and returns so the caller can apply notify main-broken.
---

# Dispatch: Diagnose Main

Invoked by `/dispatch-propagate` Step 3 when `dispatch-select-target` reports
`main-broken <sha>` — `origin/main` itself is red, so no new work is safe to
start. Diagnose main, release the dispatch lock, and return. On this skill's
return, the caller (`/dispatch-propagate` Step 3) proceeds to Step 7 with `notify
main-broken` — the session stays in `claude agents` until the user closes it,
so the diagnosis remains visible rather than buried in a closed transcript.
The skill does **not** run the sweep, create a worktree, branch, PR, or
invoke any phase skill.

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
.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock --release
```

## 4. Summarize and stop

Summarize the likely cause from the logs and check-run details, report it,
and stop. Run `dispatch-handoff --early-stop` (`dangerouslyDisableSandbox:
true`) to self-close:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-handoff --early-stop
```

Include only the failing check/step name and a high-level error category
(e.g. "test assertion failed", "lint error", "type error"). Do not reproduce
raw log lines, environment-variable values, file paths beyond the immediate
failing module, or any string that looks like a token, credential, or other
secret — even if GitHub Actions has already partially masked it. The
`--log-failed` output may inadvertently surface CI internals; the summary is
for the user, not a copy of the log.

Once a PR that fixes main exists, the normal ladder picks it up
(verify/ready) — this gate only blocks starting new, unrelated work.

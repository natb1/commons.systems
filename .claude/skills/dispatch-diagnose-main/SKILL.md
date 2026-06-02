---
name: dispatch-diagnose-main
description: Diagnose origin/main's failing CI when /dispatch-propagate detects a red main; runs as a spawned bg job that enumerates failing checks, fetches logs, and produces the likely-cause summary in its own transcript.
---

# Dispatch: Diagnose Main

Runs as its own `claude --bg` job (session name `diagnose-main`) spawned by
`/dispatch-propagate` when `dispatch-select-target` reports `main-broken <sha>`
— `origin/main` itself is red, so no new work is safe to start. The diagnosis
lives in this job's own transcript. This job holds no dispatch lock (the router
released it before spawning this job). The skill does **not** run the sweep,
create a worktree, branch, PR, or invoke any phase skill.

Takes `<sha>` as its single argument — the broken `origin/main` HEAD commit.

Run `gh` commands with `dangerouslyDisableSandbox: true` — see
`.claude/rules/sandbox.md`.

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

## 3. Summarize and stop

Summarize the likely cause from the logs and check-run details, report it,
and stop. This job's transcript is the surface for the diagnosis.

Include only the failing check/step name and a high-level error category
(e.g. "test assertion failed", "lint error", "type error"). Do not reproduce
raw log lines, environment-variable values, file paths beyond the immediate
failing module, or any string that looks like a token, credential, or other
secret — even if GitHub Actions has already partially masked it. The
`--log-failed` output may inadvertently surface CI internals; the summary is
for the user, not a copy of the log.

Once a PR that fixes main exists, the normal ladder picks it up
(verify/ready) — this gate only blocks starting new, unrelated work.

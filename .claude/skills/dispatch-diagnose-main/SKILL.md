---
name: dispatch-diagnose-main
description: Diagnose origin/main's failing CI when /dispatch-propagate detects a red main; runs as a spawned bg job that enumerates failing checks, fetches logs, and files the redacted likely-cause summary as a find-or-create dispatch:main-broken issue.
---

# Dispatch: Diagnose Main

Runs as its own `claude --bg` job (session name `diagnose-main`) spawned by
`/dispatch-propagate` when `dispatch-select-target` reports `main-broken <sha>`
— `origin/main` itself is red, so no new work is safe to start. The diagnosis
is recorded as a find-or-create `dispatch:main-broken` GitHub issue — one open
at a time — a durable, dispatchable work item that also latches the
main-broken gate (#1085) so the dispatch queue can flow while main is still
red, rather than living only in this job's transcript. This job holds no
dispatch lock (the router released it before spawning this job). The skill does
**not** run the sweep, create a worktree, branch, PR, or invoke any phase
skill.

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

## 3. File the diagnosis as a dispatch:main-broken issue

Compose the likely cause from the logs and check-run details as the issue
body. Record the broken HEAD `<sha>` as prose (e.g. `origin/main HEAD <sha>`);
keep it a bare reference and never place a closing keyword next to a `#N`, so
the body closes no issue. This applies to log-sourced text too: if a failing
check, step, or test name carries a closing keyword followed by a `#N` (e.g. a
test named `closes #5 regression`), GitHub would read it as a directive and
auto-close that unrelated issue when this issue is opened — neutralize it
(drop the `#`, or reword) before it reaches the body. See
`.claude/rules/issue-references.md` for the full keyword set.

Include only the failing check/step name and a high-level error category
(e.g. "test assertion failed", "lint error", "type error"). Do not reproduce
raw log lines, environment-variable values, file paths beyond the immediate
failing module, or any string that looks like a token, credential, or other
secret — even if GitHub Actions has already partially masked it. The
`--log-failed` output may inadvertently surface CI internals; the body is for
the user, not a copy of the log.

Write the body to a temp file under `$CLAUDE_JOB_DIR/tmp` and pass it with
`--body-file`. Never interpolate the diagnosis inline into the `gh` command —
log-sourced text may carry shell metacharacters.

Find an existing open latch issue first:

```bash
existing=$(gh issue list --label dispatch:main-broken --state open --json number -q '.[0].number')
```

If `$existing` is non-empty, edit its body — a re-run during the same red
episode updates rather than duplicates:

```bash
gh issue edit "$existing" --body-file <body-file>
```

Otherwise create one — a concise title naming the broken `<sha>`; `bug` +
`priority` sort the fix to the top of the dispatch ladder; `dispatch:main-broken`
is the latch label:

```bash
gh issue create --title "main broken at <sha>" --body-file <body-file> \
  --label dispatch:main-broken --label bug --label priority
```

The `dispatch:main-broken` label may not exist yet. Apply-first /
create-on-not-found, as `dispatch-complete-phase` does (lines 36-53): if the
create or edit fails because the label does not exist (gh reports a "not found"
error), create it once and retry. `bug` and `priority` already exist.

```bash
gh label create dispatch:main-broken \
  --description "dispatch workflow: origin/main HEAD CI is red (gate latch)"
```

The `--color` flag is intentionally omitted — the dispatch-label color hex is single-sourced in `dispatch-complete-phase` and must not be duplicated here.

All `gh` calls here need `dangerouslyDisableSandbox: true`.

Once the issue exists it latches the gate so the queue flows again, and it is
itself the priority fix item the normal ladder picks up (verify/ready). When
`origin/main` goes green, `dispatch-select-tick` closes the issue, re-arming
the gate for the next episode. The skill creates no worktree, branch, or PR —
it files or updates the issue and stops.

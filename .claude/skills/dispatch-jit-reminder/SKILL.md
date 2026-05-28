---
name: dispatch-jit-reminder
description: Claim the earliest-due JIT issue, release the dispatch lock, summarize the issue for the user as a reminder, and stop the tick. Invoked by /dispatch when the JIT scan surfaces a due reminder.
---

# Dispatch: JIT Reminder

Invoked by `/dispatch` Step 3 when `dispatch-select-target` reports
`jit-reminder <repo> <num> <project> <item-id>` — the JIT scan selected
`<num>` in `<repo>` as the earliest-due open JIT issue.

Takes four arguments: `<repo> <num> <project> <item-id>`.

Claim the issue, release the dispatch lock, summarize the issue for the
user, and stop. This skill **does not** run a terminal handoff: the summary
printed here must stay open in the transcript for a human to read, and
`dispatch-handoff` would self-close the job and hide it. Steps 4, 5, and 6-7
of `/dispatch` are all skipped — no worktree, no PR, no phase skill, no leaf
trace.

Run `gh`-calling commands with `dangerouslyDisableSandbox: true` — see
`.claude/rules/sandbox.md`.

## 1. Claim the issue inside the scoped lock window

The lock is still held by the caller from `/dispatch` Step 0 — the reminder
path is a Step 3 stop path and never reaches Step 5's proceed-path release,
so the claim runs under the lock, exactly as the JIT engine does. Resolve
the project's In-Progress status value from local config, then write it:

```bash
IN_PROGRESS=$(.claude/skills/dispatch/scripts/dispatch-config-load projects \
  | jq -r --arg key "<project>" \
    '.projects[] | select(.key == $key) | .statusInProgress')
.claude/skills/dispatch/scripts/dispatch-project-status-write \
  <project> "https://github.com/<repo>/issues/<num>" "$IN_PROGRESS"
```

The `dispatch-project-status-write` call needs `dangerouslyDisableSandbox:
true` — it calls `gh`.

## 2. Release the lock

This is a Step 3 stop path — release the lock immediately after the claim,
before the summary:

```bash
.claude/skills/dispatch/scripts/dispatch-acquire-lock --release
```

`dangerouslyDisableSandbox: true`.

## 3. Summarize the issue for the user

Fetch the issue (`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh issue view <num> --repo <repo> --json number,title,body
```

Present its number, title, and body to the user as a human-readable
reminder, framed as the most-overdue / soonest-due JIT reminder the scan
surfaced. The `jit-reminder` line carries no due timestamp — do not state a
precise computed due time.

## 4. Stop the tick

The `In Progress` status the claim wrote stops a later `/dispatch` tick from
re-selecting this issue.

A `jit-reminder` run is a **jit summary session** — an office-hours session
(#755): the summary is surfaced to the user for a human to read, not
consumed as autonomous dispatch-chain work. #755's two-queue infrastructure
is not yet built, so this skill is that documented intent plus the
mechanical claim → release → summarize → stop branch above.

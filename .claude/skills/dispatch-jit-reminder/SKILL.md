---
name: dispatch-jit-reminder
description: Claim the earliest-due JIT issue, summarize it for the user as a reminder, and stop. Runs as a spawned bg job from /dispatch-propagate when the JIT scan surfaces a due reminder.
---

# Dispatch: JIT Reminder

Runs as its own `claude --bg` job (session name `jit-reminder-<num>`) spawned by
`/dispatch-propagate` when `dispatch-select-target` reports
`jit-reminder <repo> <num> <project> <item-id>` — the JIT scan selected
`<num>` in `<repo>` as the earliest-due open JIT issue. This job holds no
dispatch lock (the router released it before spawning this job).

Takes four arguments: `<repo> <num> <project> <item-id>`.

Claim the issue, summarize it for the user, and stop. The summary printed here
must stay open in this job's transcript for a human to read — no worktree, no
PR, no phase skill, no leaf trace.

The per-item spawn-dedup name `jit-reminder-<num>` — assigned by the router's
`dispatch-spawn-job` call — prevents a concurrent dispatch tick from
double-spawning the same reminder while this claim is in flight; the In-Progress
claim then prevents re-selection on later ticks.

Run `gh`-calling commands with `dangerouslyDisableSandbox: true` — see
`.claude/rules/sandbox.md`.

## 1. Claim the issue

Resolve the project's In-Progress status value from local config, then write it:

```bash
IN_PROGRESS=$(.claude/skills/dispatch-propagate/scripts/dispatch-config-load projects \
  | jq -r --arg key "<project>" \
    '.projects[] | select(.key == $key) | .statusInProgress')
.claude/skills/dispatch-propagate/scripts/dispatch-project-status-write \
  <project> "https://github.com/<repo>/issues/<num>" "$IN_PROGRESS"
```

The `dispatch-project-status-write` call needs `dangerouslyDisableSandbox:
true` — it calls `gh`.

## 2. Summarize the issue for the user

Fetch the issue (`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh issue view <num> --repo <repo> --json number,title,body
```

Present its number, title, and body to the user as a human-readable
reminder, framed as the most-overdue / soonest-due JIT reminder the scan
surfaced. The `jit-reminder` line carries no due timestamp — do not state a
precise computed due time.

## 3. Stop

The `In Progress` status the claim wrote stops a later `/dispatch-propagate` tick from
re-selecting this issue.

A `jit-reminder` run is a **jit summary session** — an office-hours session
(#755): the summary is surfaced to the user for a human to read, not
consumed as autonomous dispatch-chain work. #755's two-queue infrastructure
is not yet built, so this skill is that documented intent plus the
mechanical claim → release → summarize → stop branch above.

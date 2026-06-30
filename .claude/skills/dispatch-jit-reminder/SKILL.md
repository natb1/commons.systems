---
name: dispatch-jit-reminder
description: Claim the earliest-due JIT issue, then either run a configured skill (for skill-running jits such as digest) or summarize it for the user and stop. Runs as a spawned bg job from /dispatch-propagate when the JIT scan surfaces a due reminder.
---

# Dispatch: JIT Reminder

Runs as its own `claude --bg` job (session name `jit-reminder-<num>`) spawned by
`/dispatch-propagate` when `dispatch-select-target` reports
`jit-reminder <repo> <num> <project> <item-id>` — the JIT scan selected
`<num>` in `<repo>` as the earliest-due open JIT issue. This job holds no
dispatch lock (the router released it before spawning this job).

Takes four arguments: `<repo> <num> <project> <item-id>`.

Claim the issue, then either run a configured skill (when the jit defines one)
or summarize the issue for the user and stop. Either way the session output
stays open in this job's transcript for a human to read — no worktree, no PR,
no phase skill, no leaf trace.

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

## 2. Resolve and run a configured skill

After claiming, resolve whether this jit is configured to run a skill:

```bash
SKILL=$(.claude/skills/dispatch-propagate/scripts/dispatch-jit-skill <repo> <num>)
```

Run this with `dangerouslyDisableSandbox: true` — it calls `gh` (see
`.claude/rules/sandbox.md`).

If `$SKILL` is **non-empty**: invoke that skill via the **Skill tool** (skill
name = the value of `$SKILL`), passing the issue's `<repo> <num>` as its
arguments, and let that skill own the rest of this session. Do NOT then run
the summarize-and-stop steps below — the configured skill produces the
session's output and terminates it. A skill-running jit reminder is still an
**office-hours session** (the skill runs with the user present).

If `$SKILL` is **empty** (no `skill` configured, or no `jit.json`): fall
through to the summarize-and-stop steps below, unchanged.

## 3. Summarize the issue for the user

Fetch the issue (`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh issue view <num> --repo <repo> --json number,title,body
```

Present its number, title, and body to the user as a human-readable
reminder, framed as the most-overdue / soonest-due JIT reminder the scan
surfaced. The `jit-reminder` line carries no due timestamp — do not state a
precise computed due time.

## 4. Stop

The `In Progress` status the claim wrote stops a later `/dispatch-propagate` tick from
re-selecting this issue.

A `jit-reminder` run is an **office-hours session** in the now-built
two-queue model (#755): the summary (or the configured skill's output) is
surfaced to the user for a human to read, not consumed as autonomous
dispatch-chain work. Both the summarize-and-stop variant (§3–4) and the
skill-running variant (§2) run as office-hours sessions with the user present.

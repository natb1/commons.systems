---
name: plan-implement
description: Implement phase — plan logical units of work, build each one, and open a draft PR
---

# Plan and Implement

The `implement` phase of the issue workflow, dispatched by `/dispatch-propagate`. Plans the
work as an ordered list of logical units, builds each unit, and opens a draft PR.
One draft PR with a `Closes #N` line is the implement→verify transition marker.

**The main thread never edits files.** It plans and delegates: every code change
happens in a subagent. Each unit is built by `/implement-unit`, which launches an
implementation subagent and forks `/commit-merge-push`.

## Steps

### 1. Plan logical units

**The build session never reloads this skill.** When the user accepts the plan via
`ExitPlanMode`, `showClearContextOnPlanAccept` (set `true` in
`.claude/settings.json`) clears context and starts a fresh build session seeded with
`Implement the following plan: <plan>`. That session does **not** re-invoke
`/plan-implement`, so Steps 2–4 of this skill body are absent — the build works from
the plan text alone. The plan is therefore the only carrier of build instructions: it
must (a) carry file anchors so the build delegates each unit without re-reading
source, and (b) embed the terminal procedure (Steps 3–4) in its preface. There is no
re-entry into this skill to guard against.

If a requirement term has multiple plausible readings that would change the plan,
resolve it via `AskUserQuestion` **before** calling `EnterPlanMode` — guessing risks
a plan rejected over the term and a costly redraft.

Invoke `EnterPlanMode` and produce a plan whose implementation section is an
**ordered list of logical units of work**. The plan lives in the `ExitPlanMode`
payload — do not write-edit-reread it on disk. Each unit specifies:

1. **Scope.** What files/behavior change, what is explicitly out of scope. Name the
   exact files and `path:line` anchors the unit touches, so the build delegates to
   `/implement-unit` without the main thread re-reading source.
2. **Model.** `opus` or `sonnet`, chosen per the model-selection heuristic in
   `/implement-unit` — see that skill for the heuristic (it is the canonical home;
   do not restate it here).
3. **Dependencies.** Any prior units that must complete first, so build order is
   explicit.

Each unit becomes one commit. The user reviews and approves the plan.

The plan must include a **plan preface** per `ref-memory-management`'s Clean Context
Planning Rule: the plan assumes execution in a clean context and records that the
active workflow step is the `implement` phase of `/dispatch-propagate`. Because the
build session runs without this skill body, the preface must also embed the terminal
procedure (Steps 3–4) so the build can execute it from the plan text alone: the
`dispatch-open-pr` invocation with its close set (including the `PR_NUM=$()`
stdout capture), and the `dispatch-mark-complete` / `dispatch-mark-deviation`
marker write. Copy these script invocations verbatim from Steps 3–4 — do not
paraphrase — so the build session has the exact arguments and sandbox annotations.

### 2. Build each unit

For each approved unit, in dependency order, invoke `/implement-unit` via the Skill
tool, passing:

- `model` — the unit's planned model.
- `scope` — the unit's scope.
- `context` — the plan and issue context the unit needs.
- `commit_intent` — the "why" of this unit's change.

`/implement-unit` launches the implementation subagent, forks `/commit-merge-push`,
and recovers from merge / pre-commit / push errors. This is a normal in-session loop
— **do not clear context between units**.

### 3. Open the draft PR

This `dispatch-open-pr` call (including the `PR_NUM=$()` capture) is also carried
in the plan preface (Step 1), so the post-clear build session executes it even
though this skill body is absent.

After every unit is committed and pushed, write the PR body prose to
`tmp/pr-body.md`, then open the draft PR with `dispatch-open-pr` (use
`dangerouslyDisableSandbox: true` — the script calls `gh`, which needs network):

```bash
PR_NUM=$(.claude/skills/dispatch-propagate/scripts/dispatch-open-pr \
  <primary-issue> \
  --title "<short summary>" \
  --closes "<sub-issue-or-blocker> ..." \
  --body-file tmp/pr-body.md)
```

`<primary-issue>` is the issue this PR primarily implements; `--closes` lists
any additional implemented sub-issues or blockers (whitespace- or
comma-separated, with or without a leading `#`). The script writes one
`Closes #N` line per issue, appends the prose from `--body-file` (omit the flag
to read prose from stdin), and echoes the created PR number — the only thing it
prints on stdout. This draft PR is the implement→verify transition marker.

The script then verifies GitHub parsed exactly the intended close set, per
`.claude/rules/issue-references.md`: narrative prose can carry a stray closing
keyword that GitHub reads as an extra close directive. On an extra, the script
strips the stray keyword and re-applies the body (bounded retries); on a number
intended-but-missing, or an extra it cannot resolve, it exits non-zero with a
diagnostic naming the offending number. If it exits non-zero, read the
diagnostic and fix the body or `--closes` set rather than opening the PR by
hand.

### 4. Check for deviation, then write the marker (or skip it), then stop

Both marker writes (deviation and completion) are also carried in the plan preface
(Step 1), so the post-clear build session executes them even though this skill body
is absent.

Before writing the marker, judge whether the implementation deviated from the
approved plan — scope shifted mid-implementation, or the plan could not be
fully implemented as approved. Base this on the `/implement-unit` outcomes
observed in Step 2.

**Deviation fires** — skip the `phase-completed` marker. Instead call
`dispatch-mark-deviation` to write the office-hours-reason atomically. The draft
PR opened in Step 3 stays open. The Stop hook reads marker-absence as Branch A,
applies `dispatch:office-hours` to the issue (surfacing this reason in the
why-comment), and parks the issue for human review.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/plan-implement: implementation deviated from the approved plan"
```

Use the default phrasing above, or make it more specific when the nature of
the shift is clear (e.g. `/plan-implement: unit 3 scope expanded to cover
auth; approved plan did not include auth changes`).

**No deviation** — call `dispatch-mark-complete` as the final action.
`CLAUDE_JOB_DIR` unset = interactive run; the script no-ops with a clear
diagnostic.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
  --phase implement --pr "$PR_NUM"
```

Stop. The Stop hook reads the marker, spawns the next `/dispatch-propagate`
router, strips `dispatch:office-hours` if present, and self-closes this job.

## Requirement changes mid-session

If the user revises a requirement during this session, invoke `/new-requirement` —
it clarifies, updates remote issues, re-syncs `CLAUDE.local.md`, and revises this
plan. Do not handle re-sync inline.

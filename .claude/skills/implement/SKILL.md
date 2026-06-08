---
name: implement
description: Implement phase — read the persisted plan from the issue's `<!-- dispatch:plan -->` comment, build each unit via /implement-unit, and open a draft PR.
---

# Implement

The `implement` phase of the issue workflow, dispatched by `/dispatch-propagate`.
Reads the plan persisted to the issue's `<!-- dispatch:plan -->` comment by the
`plan` phase, builds each unit, and opens a draft PR. One draft PR with a
`Closes #N` line is the implement→verify transition marker.

**The main thread never edits files.** It delegates: every code change happens in
a subagent. Each unit is built by `/implement-unit`, which launches an
implementation subagent and forks `/commit-merge-push`.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push` and run subagents inline.

## Sandbox

Every `gh`/network call in this skill carries `dangerouslyDisableSandbox: true` —
`gh` needs network and the sandbox blocks it. See `.claude/rules/sandbox.md`.

## Idempotency preamble

This skill's terminal artifact is the **draft PR** — there is no owned label.

First resolve the target issue number `<N>` from the worktree branch. `/implement`
operates in place — the **current worktree dictates the target**. The session must
be in a target worktree: the current branch is `<N>-…`, where `<N>` is the issue
number. The router (`/dispatch-propagate`) is responsible for entering a target
worktree; this skill never switches.

```bash
BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$BRANCH" in
  [0-9]*-*) N="${BRANCH%%-*}" ;;
  *)
    echo "/implement: current branch '$BRANCH' is not a target worktree (expected '<N>-…')" >&2
    exit 1
    ;;
esac
```

`<N>` is the issue number used by the remaining steps for their `tmp/` filenames.

Then resolve whether a draft PR already exists for the branch (use
`dangerouslyDisableSandbox: true` — `gh` needs network). `$BRANCH` here is the
basename resolved above (the `<N>-…` worktree branch name). `gh pr view` exits
non-zero when no PR exists for the branch — tolerate that and treat it as "no PR":

```bash
PR_JSON=$(gh pr view "$BRANCH" --json number,state,isDraft 2>/dev/null) || PR_JSON=""
if [ -n "$PR_JSON" ]; then
  PR_NUM=$(jq -r .number <<<"$PR_JSON")
fi
```

A here-string (`<<<`) is used, not `echo "$PR_JSON" | jq`, because zsh `echo`
un-escapes `\t`/`\n` in the JSON and injects raw control chars `jq` rejects — see
`.claude/rules/shell-json.md`.

If a PR already exists, the build + PR already happened: capture its number as
`PR_NUM`, **skip Steps 1–3**, and go straight to the Step 4 marker write (this
covers a same-tick crash between PR-open and marker-write). If no PR exists, run
all steps. (`dispatch-route` normally routes a PR-bearing issue to verify/qa/review,
not implement, so this is a same-tick crash-recovery edge.)

## Steps

### 1. Read the plan

Read the persisted plan from the issue's `<!-- dispatch:plan -->` comment. Invoke
and capture stdout (use `dangerouslyDisableSandbox: true` — it calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-read-plan <N>
```

The printed body is the ordered unit breakdown (scope + per-unit model +
dependencies) that drives Step 2.

Exit codes:
- **exit 1** — no `<!-- dispatch:plan -->` comment on the issue. This
  should-never-happen for a `dispatch:planned` issue. Escalate via
  `dispatch-mark-deviation` (skip the `phase-completed` marker) and stop.
- **exit 2** — non-numeric arg.

`sync-issue-context` also renders this plan under `### Comments` in
`CLAUDE.local.md`, so it is available as context too.

### 2. Build each unit

For each unit in the plan read in Step 1, in dependency order, invoke
`/implement-unit` via the Skill tool, passing:

- `model` — the unit's planned model.
- `scope` — the unit's scope.
- `context` — the plan and issue context the unit needs.
- `commit_intent` — the "why" of this unit's change.

`/implement-unit` launches the implementation subagent, forks `/commit-merge-push`,
and recovers from merge / pre-commit / push errors. This is a normal in-session loop
— **do not clear context between units**. The model is chosen per the
model-selection heuristic in `/implement-unit` — see that skill for the heuristic
(it is the canonical home; do not restate it here).

### 3. Open the draft PR

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

Before writing the marker, judge whether the implementation deviated from the
persisted plan — scope shifted mid-implementation, or the plan could not be
fully implemented as written. Base this on the `/implement-unit` outcomes
observed in Step 2.

**Deviation fires** — skip the `phase-completed` marker. Instead call
`dispatch-mark-deviation` to write the office-hours-reason atomically. If Step 3
already opened a draft PR, it stays open. The Stop hook reads marker-absence as Branch A,
applies `dispatch:office-hours` to the issue (surfacing this reason in the
why-comment), and parks the issue for human review.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/implement: implementation deviated from the persisted plan"
```

Use the default phrasing above, or make it more specific when the nature of
the shift is clear (e.g. `/implement: unit 3 scope expanded to cover
auth; persisted plan did not include auth changes`).

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

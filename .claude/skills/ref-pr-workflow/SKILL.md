---
name: ref-pr-workflow
description: Complete workflow documentation for issue implementation lifecycle — resume from any step after context loss
---

# Current PR Scope and Status
The purpose of this conversation is to create and manage a PR with the following scope.

- Current branch: !`git rev-parse --abbrev-ref HEAD`
- Commit log: !`git log origin/main..HEAD --format="commit %H%nAuthor: %an <%ae>%nDate: %ad%n%n%s%n%n%b"`

Before proceeding, run via Bash with `dangerouslyDisableSandbox: true` (gh requires sandbox disabled for TLS):
`.claude/skills/ref-pr-workflow/scripts/load-context`

# Dependencies
Invoke `/ref-memory-management` if not already active.

# Issue Workflow Reference
Reference only. Do not execute this workflow until directed to do so (eg., by `/pr-workflow`).

## Resume Logic

1. Run `.claude/skills/ref-pr-workflow/scripts/issue-state-read <issue-number>`. If exit 0 → use `step`, `phase`, `active_skills`, and `wiggum_step` from the JSON. Skip fallback.
2. If exit 1 → use fallback, then write fresh state:
   ```bash
   .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":2,"step_label":"Planning Phase","phase":"core","active_skills":["ref-memory-management","ref-pr-workflow","ref-implement"]}'
   ```

**Fallback** (scan **Current PR Scope and Status** above; step=1 is intentionally omitted — branch existence implies prerequisites passed):
- No PR + implementation commits → step=4, phase=unit
- No PR + no commits → step=2, phase=core
- PR, no acceptance "Complete" → step=6, phase=verify
- PR, acceptance done, no smoke "Complete" → step=7, phase=verify
- PR, smoke done, no QA "Complete" → step=8, phase=qa
- PR, QA done, no code quality "Complete" → step=9, phase=code-quality
- PR, code quality done, no security "Complete" → step=10, phase=security
- All "Complete" → step=11, phase=core

## Dispatch

Re-invoke each skill listed in `active_skills` from the issue state that is not already active. Then invoke the phase skill at the determined step. If `wiggum_step` is present, the phase skill resumes the wiggum-loop at that step instead of starting from Step 0.

**Continuity rule:** Phase transitions are not stopping points. When a phase completes and the instructions say "proceed to Step N," immediately dispatch Step N without outputting a summary or waiting for user input. The only authorized stops are: (1) entering plan mode, (2) wiggum-loop evaluation steps that require user classification, and (3) Step 11 (completion).

| Step | Phase | Invoke |
|---|---|---|
| 1, 2, 3 | core | `/ref-implement` at Step N |
| 4 | unit | `/ref-unit-test` (isolated) |
| 5 | core | `/ref-create-pr` |
| 6, 7 | verify | `/ref-pr-check` (isolated) |
| 8 | qa | `/ref-qa` at Step 8 |
| 9 | code-quality | `/ref-code-quality` at Step 9 |
| 10 | security | `/ref-security` at Step 10 |
| 11 | core | (this skill, inline — see Step 11 below) |

## Fork Delegation (Steps 4, 6, 7)

Steps 4, 6, and 7 are fully automated — invoke fork skills instead of in-thread phase skills:
- Step 4 → `/ref-unit-test`
- Steps 6, 7 → `/ref-pr-check`

On fork result:
- `"success"` → read updated issue state, proceed to next step
- `"needs_user"` → read checkpoint file for last state, present error to user
- `"failure"` → read checkpoint file for last state, present error to user

Checkpoint files: `tmp/unit-subagent-state.json` (Step 4), `tmp/acceptance-subagent-state.json` (Step 6), `tmp/smoke-subagent-state.json` (Step 7).

## Step 11. Completion

```bash
gh pr ready <pr-num>
```

Prompt user to review and merge the PR.

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
- PR, security done, no final verify "Complete" → step=11, phase=verify
- All "Complete" + PR not merged → step=12, phase=core
- PR merged, no prod-qa "Complete" → step=13, phase=prod-qa
- PR merged, prod-qa "Complete" → workflow complete (no-op)

## Dispatch

Re-invoke each skill listed in `active_skills` from the issue state that is not already active. Then invoke the phase skill at the determined step. If `wiggum_step` is present, the phase skill resumes the wiggum-loop at that step instead of starting from Step 0.

**Continuity rule:** Phase transitions are not stopping points. When a phase completes and the instructions say "proceed to Step N," immediately dispatch Step N without outputting a summary or waiting for user input. The only authorized stops are: (1) entering plan mode, (2) wiggum-loop evaluation steps that require user classification, (3) Step 12 (user confirms merge), and (4) workflow completion.

| Step | Phase | Invoke |
|---|---|---|
| 1, 2, 3 | core | `/ref-implement` at Step N |
| 4 | unit | `/ref-unit-test` (isolated) |
| 5 | core | `/ref-create-pr` |
| 6, 7 | verify | `/ref-pr-check` (isolated) |
| 8 | qa | `/ref-qa` at Step 8 |
| 9 | code-quality | `/ref-code-quality` at Step 9 |
| 10 | security | `/ref-security` at Step 10 |
| 11 | verify | `/ref-pr-check` (isolated) |
| 12 | core | (this skill, inline — see Step 12 below) |
| 13 | prod-qa | `/ref-prod-qa` at Step 13 |

## Fork Delegation (Steps 4, 6, 7, 11)

Steps 4, 6, 7, and 11 are fully automated — invoke fork skills instead of in-thread phase skills:
- Step 4 → `/ref-unit-test`
- Steps 6, 7, 11 → `/ref-pr-check`

On fork result:
- `"success"` → read updated issue state, proceed to next step
- `"needs_user"` → read checkpoint file for last state, present error to user
- `"failure"` → read checkpoint file for last state, present error to user

Checkpoint files: `tmp/unit-subagent-state.json` (Step 4), `tmp/acceptance-subagent-state.json` (Step 6), `tmp/smoke-subagent-state.json` (Step 7), `tmp/final-verify-subagent-state.json` (Step 11).

## Step 12. Mark Ready and Merge

```bash
gh pr ready <pr-num>
```

Prompt user to review and merge the PR. **STOP and wait for user confirmation that the PR is merged.**

Once user confirms merge, verify:
```bash
gh pr view <pr-num> --json state --jq '.state'
```
If state is not `MERGED`, inform the user and wait.

### Pre-flight: Monitor prod-deploy CI

Before dispatching Step 13, monitor the production deployment:

1. Find the prod-deploy CI run:
   ```bash
   gh run list --workflow=prod-deploy.yml --branch=main --limit 5 --json databaseId,headSha,status,createdAt
   ```
   Match by recency (the run created closest to the merge time).

2. If a matching run is found and not yet complete, monitor it:
   ```bash
   .claude/skills/ref-pr-workflow/scripts/run-ci-watch.sh <run-id>
   ```

3. If the run succeeds, check if any changed apps have hosting targets:
   ```bash
   .claude/skills/ref-pr-workflow/scripts/get-pr-prod-urls.sh <pr-num>
   ```
   - If no URLs returned → skip prod-qa, update state to step=14/phase=done, workflow complete.
   - If CI run failed → inform user. Cannot QA against a failed deploy. Stop.

4. Update state and dispatch Step 13:
   ```bash
   .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":13,"step_label":"Production QA","phase":"prod-qa","active_skills":["ref-memory-management","ref-pr-workflow","ref-prod-qa"]}'
   ```

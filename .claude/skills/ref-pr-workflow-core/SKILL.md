---
name: ref-pr-workflow-core
description: PR workflow core phase — prerequisite check, planning, implementation, PR creation, completion
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# PR Workflow — Core Phase

Steps 1, 2, 3, 5, and 11. Start at the step indicated by the router.

## Step 1. Prerequisite Check

Verify the working directory is a worktree for the requested issue:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

If no issue number provided, or `$CURRENT_BRANCH` doesn't start with the issue number followed by `-`: invoke `/worktree` instead. Stop.

On completion → update state to step=2/phase=core via `issue-state-write`, proceed to Step 2.

## Step 2. Planning Phase

Enter plan mode. Scope defined by the **Current PR Scope and Status** section from the router. Use the question tool to:
- Clarify ambiguous scope
- Suggest better alternatives

Plan must include:
- Unit test strategy: what to test, test framework, test file locations
- Acceptance test strategy: user flows to test with Playwright against Firebase emulators
- Smoke test strategy: minimal health checks for preview deployments

On completion → update state to step=3/phase=core via `issue-state-write`, proceed to Step 3.

## Step 3. Implementation

Implement the approved plan. Create separate commits for each issue (minimum one commit per issue).

Use the Task tool to launch parallel general-purpose subagents:
- Subagent 1: Write unit tests based on the plan
- Subagent 2: Write acceptance tests based on the plan
- Subagent 3: Write smoke tests based on the plan

All run concurrently with main implementation.

On completion → update state to step=4/phase=unit via `issue-state-write`. Return to router for dispatch to unit phase.

## Step 5. PR Creation

Create a PR closing all implemented issues from the **Current PR Scope and Status** section:

```bash
gh pr create --draft --title "PR title" --body "$(cat <<'EOF'
## Summary
...

Closes #<primary-issue>
Closes #<related-issue-1>
Closes #<related-issue-2>

EOF
)"
```

Include a separate `Closes #N` for each issue (primary + all implemented dependencies and sub-issues).

On completion → update state to step=6/phase=verify via `issue-state-write`. Return to router for dispatch to verify phase.

## Step 11. Completion

```bash
gh pr ready <pr-num>
```

Prompt user to review and merge the PR.

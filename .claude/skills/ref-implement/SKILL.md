---
name: ref-implement
description: Prerequisite check, planning, and implementation — Steps 1, 2, 3
---

# PR Workflow — Implementation Phase

Steps 1, 2, and 3. Start at the step indicated by the router.

## Step 1. Prerequisite Check

Verify the working directory is a worktree for the requested issue:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

If no issue number provided, or `$CURRENT_BRANCH` doesn't start with the issue number followed by `-`: invoke `/pr-workflow` instead. Stop.

On completion → update state to step=2/phase=core, proceed to Step 2:
```bash
.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":2,"step_label":"Planning Phase","phase":"core","active_skills":["ref-memory-management","ref-pr-workflow","ref-implement"]}'
```

## Step 2. Planning Phase

Enter plan mode. Scope defined by the **Current PR Scope and Status** section from the router. Use the question tool to:
- Clarify ambiguous scope
- Suggest better alternatives

Plan must include:
- Unit test strategy: what to test, test framework, test file locations
- Acceptance test strategy: user flows to test with Playwright against Firebase emulators
- Smoke test strategy: minimal health checks for preview deployments

On completion → update state to step=3/phase=core, proceed to Step 3:
```bash
.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":3,"step_label":"Implementation","phase":"core","active_skills":["ref-memory-management","ref-pr-workflow","ref-implement"]}'
```

## Step 3. Implementation

Implement the approved plan. Create separate commits for each issue (minimum one commit per issue).

Use the Task tool to launch parallel general-purpose subagents with `model: "sonnet"`:
- Subagent 1: Write unit tests based on the plan
- Subagent 2: Write acceptance tests based on the plan
- Subagent 3: Write smoke tests based on the plan

All run concurrently with main implementation.

On completion → update state to step=4/phase=unit, then immediately dispatch Step 4 (do not stop or summarize):
```bash
.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":4,"step_label":"Unit Test Loop","phase":"unit","active_skills":["ref-memory-management","ref-pr-workflow"]}'
```

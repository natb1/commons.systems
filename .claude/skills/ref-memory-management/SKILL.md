---
name: ref-memory-management
description: Load when planning work, writing commits, changing requirements, or editing/commenting on issues/PR
---

# Clean Context Planning Rule

When creating any plan (issue implementation, review, security review, or ad hoc):
- All plans must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session.
- Read the issue state's `active_skills` list (the canonical store for skills that must be reloaded across sessions). If any skills are listed, add this line to the plan preface: `**Before executing this plan:** Invoke /skill-X and /skill-Y`. The line **must** include the **explicit** instruction to invoke ALL skills from `active_skills` before executing the plan.
- If plan is being created as part of a multi-step process (eg. pr-workflow, or wiggum-loop), the plan must record which step of the process is active in the preface of the plan.

# Issue Context Loading

When loading issue context (at session start, after context loss, or when a skill requests issue data), run:
`.claude/skills/ref-pr-workflow/scripts/load-context`

This script consolidates all context types into a single invocation:

| Content type | Detail level |
|---|---|
| **PR status** | Full |
| **Primary issue** | Full |
| **Blockers** | Full for each blocking issue |
| **Sub-issues** | Full for each sub-issue |
| **Parent issue** (if primary is a sub-issue) | Full |
| **Sibling issues** (if primary is a sub-issue) | Full for open siblings; Summary for closed |
| **Issue state** | JSON if present |
| **README** | Root README.md |

Full = `title, body, comments, number, state`. Summary = `title, number, state`. Consumers that need additional fields (e.g., `ref-ready` uses `labels, assignees, projectItems` for evaluation) extend the base set.

Individual scripts remain in `.claude/skills/ref-pr-workflow/scripts/` for standalone use. Each accepts an optional issue number argument; otherwise it derives the number from the branch name.

# Issue State Rule

Persist workflow state to the issue body so it survives auto-compaction. Use `.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '<json>'` to update state.

State schema:
```json
{
  "version": 1,
  "step": 8,
  "step_label": "QA Review Loop",
  "phase": "qa",
  "active_skills": ["ref-memory-management", "ref-pr-workflow", "ref-qa"],
  "wiggum_step": 2,
  "wiggum_step_label": "Evaluate"
}
```

- **When entering a workflow step or changing phase:** call `.claude/skills/ref-pr-workflow/scripts/issue-state-write` with updated `step`, `step_label`, `phase`, and current `active_skills`
- **When loading or unloading skills:** include the updated `active_skills` list in the next `.claude/skills/ref-pr-workflow/scripts/issue-state-write` call
- **When entering a wiggum-loop step:** include `wiggum_step` and `wiggum_step_label` in the state
- **When a wiggum-loop terminates:** omit `wiggum_step` and `wiggum_step_label` from the state

# Commit Guidelines

When writing commits:
- Include work done and design/scope decisions to avoid unintentional changes to those decisions
- If conflicts arise between current plan and previous decisions, ask user questions to clarify intent
- Merge origin/main and push immediately after every commit:
  ```bash
  git fetch origin main && git merge origin/main && git push origin HEAD
  ```

# Branch-Specific Rules

When current branch is NOT main:

## Requirement Changes
- Enter plan mode (if not already in plan mode)
- Update plan to include step to edit relevant issue body with new requirement

# Git & GitHub Skills

Do not use -C for basic git commands.

For issue relationship APIs (sub-issues, dependencies), see `ref-github-issues`.

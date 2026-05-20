---
name: ref-memory-management
description: Load when planning work, writing commits, changing requirements, or editing/commenting on issues/PR
---

# Clean Context Planning Rule

When creating any plan (issue implementation, review, security review, or ad hoc):
- All plans must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session.

# Issue Context Loading

When loading issue context (at session start, after context loss, or when a skill requests issue data), run:
`.claude/skills/dispatch/scripts/sync-issue-context <issue-number>`

This script consolidates all context types into a single invocation:

| Content type | Detail level |
|---|---|
| **Primary issue** | Full |
| **Blockers** | Full for each blocking issue |
| **Sub-issues** | Full for each sub-issue |
| **Parent issue** (if primary is a sub-issue) | Full |
| **Sibling issues** (if primary is a sub-issue) | Full for open siblings; Summary for closed |

Full = `title, body, comments, number, state`. Summary = `title, number, state`. Consumers that need additional fields (e.g., `ref-ready` uses `labels, assignees, projectItems` for evaluation) extend the base set.

Individual scripts for standalone use are in `.claude/skills/dispatch/scripts/`. Each accepts an optional issue number argument; otherwise it derives the number from the branch name.

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

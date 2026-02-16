---
name: tracking
description: Load when writing commits, changing requirements, or editing/commenting on issues/PR
---

# Commit Guidelines

When writing commits:
- Include work done and design/scope decisions to avoid unintentional changes to those decisions
- If conflicts arise between current plan and previous decisions, ask user questions to clarify intent

# Branch-Specific Rules

When current branch is NOT main:

## Requirement Changes
- Enter plan mode (if not already in plan mode)
- Update plan to include step to edit relevant issue body with new requirement

## Context Sync
After committing, editing, or commenting on PR or in-scope issues:
- Invoke `/pr-context` with target subsection (e.g., "issue body #42", "PR comments", "commit log")
- Do not include content—it will be pulled from GitHub

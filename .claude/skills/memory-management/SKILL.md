---
name: memory-management
description: Load when planning work, writing commits, changing requirements, or editing/commenting on issues/PR
---

# Clean Context Rule

All plans (initial, review, security review, or ad hoc) must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session.

# Reloading Active Skills

When context compression occurs during multi-step workflows, skill content loaded at the start may no longer be available. To ensure plans have all required guidance:

**When creating a plan**: Check the conversation for all active skills and reload each by invoking them at the start of plan execution.

**Algorithm**:
1. Review recent conversation turns for skill invocations (e.g., `/memory-management`, `/pr-context`, `/write-instructions`)
2. In the plan's first step, invoke all active skills to reload their content
3. Proceed with remaining plan steps

**Example** (Code Quality Review Loop in issue-workflow):

```
**Context (see /memory-management clean context rule):**
- Summary of work completed so far
- PR number
- Complete review output from the review skill (preserve for audit log)
- Active skills: /memory-management, /pr-context

**Plan**:
Step 1: Reload active skills
- Invoke `/memory-management`
- Invoke `/pr-context`

Step 2: Execute review
- Invoke the `/review` skill
...
```

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

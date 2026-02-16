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

# GitHub Issue Relationships

GitHub issues support explicit relationships via REST API: dependencies (blocked_by/blocking) and sub-issues. Use these API features instead of text parsing.

## Critical: Issue ID vs Issue Number

- **Issue Number**: The `#N` in URLs (e.g., #36)
- **Issue ID**: Internal GraphQL ID (e.g., "I_kwDORO1as87rHEqL")

Most endpoints accept issue numbers in the URL path, but request bodies require issue IDs.

**Get both values:**
```bash
gh issue view 36 --json id,number
```

## Dependencies (Blocked By / Blocking)

**List what blocks this issue:**
```bash
gh api "/repos/{owner}/{repo}/issues/36/dependencies/blocked_by" --jq '.[].number'
```

**List what this issue blocks:**
```bash
gh api "/repos/{owner}/{repo}/issues/36/dependencies/blocking" --jq '.[].number'
```

**Add dependency (this issue is blocked by #42):**
```bash
BLOCKER_ID=$(gh issue view 42 --json id --jq '.id')
gh api -X POST "/repos/{owner}/{repo}/issues/36/dependencies/blocked_by" -f issue_id="$BLOCKER_ID"
```

**Remove dependency:**
```bash
BLOCKER_ID=$(gh issue view 42 --json id --jq '.id')
gh api -X DELETE "/repos/{owner}/{repo}/issues/36/dependencies/blocked_by/$BLOCKER_ID"
```

## Sub-Issues

**List sub-issues:**
```bash
gh api "/repos/{owner}/{repo}/issues/36/sub_issues" --jq '.[].number'
```

**Get parent issue:**
```bash
gh api "/repos/{owner}/{repo}/issues/42/parent" --jq '.number'
```

**Add sub-issue (#42 becomes a sub-issue of #36):**
```bash
SUB_ID=$(gh issue view 42 --json id --jq '.id')
gh api -X POST "/repos/{owner}/{repo}/issues/36/sub_issues" -f sub_issue_id="$SUB_ID"
```

**Remove sub-issue:**
```bash
SUB_ID=$(gh issue view 42 --json id --jq '.id')
gh api -X DELETE "/repos/{owner}/{repo}/issues/36/sub_issue" -f sub_issue_id="$SUB_ID"
```

Note: The `{owner}` and `{repo}` placeholders are auto-populated by `gh api` from the current repository.

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

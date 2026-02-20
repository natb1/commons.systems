---
name: ref-memory-management
description: Load when planning work, writing commits, changing requirements, or editing/commenting on issues/PR
---

# Clean Context Planning Rule

When creating any plan (issue implementation, review, security review, or ad hoc):
- All plans must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session.
- Check the conversation for all active reference skills (names begin with "ref-"). If any are active, add this line to the plan preface: `**Before executing this plan:** Invoke /ref-X and /ref-Y`. The line **must** include the **explicit** instruction to invoke the reference skills before executing the plan.
- If plan is being created as part of a multi-step process (eg. pr-workflow, or wiggum-loop), the plan must record which step of the process is active in the preface of the plan.

# Commit Guidelines

When writing commits:
- Include work done and design/scope decisions to avoid unintentional changes to those decisions
- If conflicts arise between current plan and previous decisions, ask user questions to clarify intent
- Merge origin/main and push immediately after every commit.

# Branch-Specific Rules

When current branch is NOT main:

## Requirement Changes
- Enter plan mode (if not already in plan mode)
- Update plan to include step to edit relevant issue body with new requirement

# Git & GitHub Skills

Do not use -C for basic git commands.

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


---
name: pr-context
description: Sync CLAUDE.local.md with current PR and issue context
context: fork
---

# Overview

Sync CLAUDE.local.md with GitHub PR, issue, and commit data. Supports full sync or targeted partial updates.

# Scope Determination Reference

## Primary Issue
Extract from branch name (e.g., `36-claude-local-md` → #36)

## Dependencies
Use GitHub API to fetch explicit blocked_by relationships:
```bash
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/dependencies/blocked_by" --jq '.[].number'
```

## Sub-issues
Use GitHub API to fetch explicit sub-issues:
```bash
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/sub_issues" --jq '.[].number'
```

## Status Filtering
- Open issues: Include full body and comments
- Closed issues: Include title only

# Data Collection Reference

```bash
# Extract branch and issue number
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
ISSUE_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '^[0-9]+')

# Primary issue
gh issue view "$ISSUE_NUM" --json title,body,comments,number,state

# Dependencies (blocked_by)
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/dependencies/blocked_by" --jq '.[].number'

# Sub-issues
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/sub_issues" --jq '.[].number'

# Related issues (after fetching dependencies and sub-issues)
gh issue view <num> --json title,body,comments,number,state

# PR (if exists)
gh pr view --json title,body,comments,number,state 2>/dev/null

# Commit log
git log origin/main..HEAD --format="%H%n%an%n%ae%n%at%n%s%n%b%n---COMMIT-END---"
```

# Template Specification

```markdown
## PR Context

### Current PR
[If PR exists]
**#N - Title**
Status: [open/closed]

Body:
[PR body content]

Comments:
[PR comments or "None"]

### In Scope Issues

#### Primary Issue: #N - title
Body:
[issue body]

Comments:
[issue comments or "None"]

#### Dependency: #N - title
[If open: body and comments; if closed: title only]

#### Sub-issue: #N - title
[If open: body and comments; if closed: title only]

### Commit Log
[Full commit messages since branching from main, formatted as:]
commit <hash>
Author: <name> <email>
Date: <date>

<subject>

<body>
```

# Partial Update Logic

When arguments specify target subsection:
1. Parse arguments to identify target (e.g., "issue body #42", "PR comments")
2. Verify target is in scope (error if not)
3. Fetch only required data from GitHub
4. Update only matching subsection in CLAUDE.local.md
5. Preserve all other content

# Error Handling

- **Branch doesn't match `N-*` pattern**: Error with suggestion to run `/worktree`
- **No PR yet**: Omit "Current PR" section
- **Partial update target not in scope**: Error clearly, suggest full sync
- **Empty comments**: Render "Comments: None"

# Algorithm

Arguments available via `$ARGUMENTS` variable. Empty = full sync, non-empty = partial update of specified subsection.

## Step 1: Determine Scope

If `$ARGUMENTS` is empty: Update entire "## PR Context" section.
If `$ARGUMENTS` has value: Update only specified subsection (value indicates target, e.g., "commit log").

Extract branch name and issue number:
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
ISSUE_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '^[0-9]+')
```

Error if branch doesn't match `N-*` pattern: "Branch doesn't match issue pattern. Run `/worktree` skill."

## Step 2: Fetch GitHub Data

Fetch primary issue:
```bash
gh issue view "$ISSUE_NUM" --json title,body,comments,number,state
```

Fetch dependencies (blocked_by):
```bash
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/dependencies/blocked_by" --jq '.[].number'
```

For each dependency number, fetch full details:
```bash
gh issue view <num> --json title,body,comments,number,state
```

Fetch sub-issues:
```bash
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/sub_issues" --jq '.[].number'
```

For each sub-issue number, fetch full details:
```bash
gh issue view <num> --json title,body,comments,number,state
```

Fetch PR if exists:
```bash
gh pr view --json title,body,comments,number,state 2>/dev/null
```

Fetch commit log:
```bash
git log origin/main..HEAD --format="commit %H%nAuthor: %an <%ae>%nDate: %ad%n%n%s%n%n%b"
```

## Step 3: Render Template

Build CLAUDE.local.md content following Template Specification section below.

Apply status filtering:
- **Open issues**: Include title, body, and comments
- **Closed issues**: Include title only

Render empty comments as "Comments: None"

For partial sync: Identify target subsection and prepare only that content.

## Step 4: Write CLAUDE.local.md

Write rendered content to `/home/n8/natb1/commons.systems/worktrees/36-claude-local-md/CLAUDE.local.md`

For full sync: Replace entire "## PR Context" section (or create if missing).
For partial sync: Read file, replace target subsection, write back.

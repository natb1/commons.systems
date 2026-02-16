---
name: pr-context
description: Sync CLAUDE.local.md with current PR and issue context
context: fork
---

# Overview

Maintain single source of truth in CLAUDE.local.md by syncing with GitHub PR, issue, and commit data.

# Usage

- No arguments: Full sync of entire PR Context section
- With arguments: Partial update of specific subsection (e.g., "issue body #42", "PR comments", "commit log")

# Scope Determination

## Primary Issue
Extract from branch name (e.g., `36-claude-local-md` → #36)

## Dependencies
Parse primary issue body for "blocked by #N" or "depends on #N"

## Sub-issues
Parse primary issue body for other #N references (ignore `(TODO: #N)` patterns)

## Status Filtering
- Open issues: Include full body and comments
- Closed issues: Include title only

# Data Collection

```bash
# Extract branch and issue number
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
ISSUE_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '^[0-9]+')

# Primary issue
gh issue view "$ISSUE_NUM" --json title,body,comments,number,state

# Related issues (after parsing dependencies and sub-issues)
gh issue view <num> --json title,body,comments,number,state

# PR (if exists)
gh pr view --json title,body,comments,number,state 2>/dev/null

# Commit log
git log origin/main..HEAD --format="%H%n%an%n%ae%n%at%n%s%n%b%n---COMMIT-END---"
```

# CLAUDE.local.md Template

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

# Implementation Steps

1. Parse arguments (if any) to determine full vs partial sync
2. Extract branch name and issue number
3. Fetch primary issue data
4. Parse primary issue body for dependencies and sub-issues
5. Fetch related issue data (filtering by open/closed status)
6. Check for PR and fetch if exists
7. Fetch commit log
8. Render template (full or partial)
9. Write/update CLAUDE.local.md

---
name: pr-context
description: Sync CLAUDE.local.md with current PR and issue context
context: fork
---

Sync CLAUDE.local.md with GitHub PR, issue, and commit data.

**Arguments:** $ARGUMENTS
- None: Full sync of entire "## PR Context" section
- Target specified (e.g., "commit log", "issue body #42"): Partial sync. Update only that subsection

## Step 1: Extract Issue Number

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
ISSUE_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '^[0-9]+')
```

## Step 2: Fetch GitHub Data

For partial sync: Fetch only data needed for target subsection.

Primary issue:
```bash
gh issue view "$ISSUE_NUM" --json title,body,comments,number,state
```

Dependencies (blocked_by relationships):
```bash
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/dependencies/blocked_by" --jq '.[].number'
```

Sub-issues:
```bash
gh api "/repos/{owner}/{repo}/issues/$ISSUE_NUM/sub_issues" --jq '.[].number'
```

For each dependency/sub-issue number:
```bash
gh issue view <num> --json title,body,comments,number,state
```

PR (if exists):
```bash
gh pr view --json title,body,comments,number,state 2>/dev/null
```

Commit log:
```bash
git log origin/main..HEAD --format="commit %H%nAuthor: %an <%ae>%nDate: %ad%n%n%s%n%n%b"
```

## Step 3: Render Template

Follow Template Specification below.

Status filtering:
- **Open issues**: title, body, comments
- **Closed issues**: title only

Empty comments: Render "Comments: None"

## Step 4: Write CLAUDE.local.md

Path: `/home/n8/natb1/commons.systems/worktrees/36-claude-local-md/CLAUDE.local.md`

**Full sync:** Replace entire "## PR Context" section.
**Partial sync:** Read file, replace target subsection, write back.

# Template Specification

```markdown
## PR Context

### Current PR
[Omit section if no PR exists]
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
commit <hash>
Author: <name> <email>
Date: <date>

<subject>

<body>
```

# Error Handling
- **Branch doesn't match `N-*` pattern**: Error with suggestion to run `/worktree`
- **No PR yet**: Omit "Current PR" section
- **Partial update target not in scope**: Error clearly, suggest full sync

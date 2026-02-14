---
name: worktree
description: Initialize work on new issues in git worktrees
---

# Worktree Initialization

Set up an isolated git worktree for working on a GitHub issue. Each issue gets its own worktree directory and branch.

## 1. Determine Issue Number

If the user provides an issue number, use it. Otherwise, auto-select using these prioritization rules. Only select from issues assigned to the current GitHub user (`--assignee @me`). Then prioritize in order:

**Priority 1**: Issues tracked in a project with "Todo" status:

```bash
gh issue list --assignee @me --json number,title,projectItems,labels \
  --jq '[.[] | select(.projectItems[]?.status.name == "Todo")] | first'
```

**Priority 2**: Issues with the "enhancement" label that are not assigned to any project:

```bash
gh issue list --assignee @me --json number,title,projectItems,labels \
  --jq '[.[] | select((.labels[]?.name == "enhancement") and (.projectItems | length == 0))] | first'
```

If no issue is found, inform the user that no eligible issues exist.

## 2. Check for Existing Worktree

Determine the repo root and check if a worktree already exists for this issue:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
git worktree list --porcelain
```

Look for a worktree whose branch name starts with `$ISSUE_NUM-`.

### Edge Case: Worktree exists and is the current directory

Invoke the `/issue-team-lead` skill with the issue number. Stop here.

### Edge Case: Worktree exists but is not the current directory

Prompt the user to close Claude and run:

```
cd $REPO_ROOT/worktrees/$BRANCH_NAME && claude "/issue-team-lead #$ISSUE_NUM"
```

Stop here.

## 3. Generate Branch Name

Get the issue title and create a sanitized branch name:

```bash
TITLE=$(gh issue view $ISSUE_NUM --json title --jq '.title')
```

Sanitize the title:
1. Convert to lowercase
2. Replace non-alphanumeric characters with dashes
3. Collapse consecutive dashes into one
4. Strip leading and trailing dashes
5. Truncate so total branch name (`$ISSUE_NUM-$SANITIZED_TITLE`) is at most 32 characters

Format: `$ISSUE_NUM-$SANITIZED_TITLE`

## 4. Create Worktree

```bash
git worktree add -b $BRANCH_NAME $REPO_ROOT/worktrees/$BRANCH_NAME main
```

After creation, prompt the user to close Claude and run:

```
cd $REPO_ROOT/worktrees/$BRANCH_NAME && claude "/issue-team-lead #$ISSUE_NUM"
```

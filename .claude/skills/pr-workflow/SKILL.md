---
name: pr-workflow
description: Manage end-to-end implementation of GitHub issues from planning through review
---

# PR Workflow

Sets up an isolated git worktree for the target issue (creating one if needed via `EnterWorktree`), then dispatches into the resumable workflow defined in `ref-pr-workflow`.

## 1. Determine Issue Number

If the user provides an issue number (with or without leading `#`), use it. Otherwise:

- If the current branch matches `^([0-9]+)-`, use that number (resume case — already in a worktree).
- Otherwise auto-select using these prioritization rules. Only select from issues assigned to the current GitHub user (`--assignee @me`).

  **Priority 1**: Issues tracked in a project with "Todo" status:

  ```bash
  gh issue list --assignee @me --json number,title,projectItems,labels \
    --jq '[.[] | select(.projectItems[]?.status.name | ascii_downcase == "todo")] | first'
  ```

  **Priority 2**: Issues with the "enhancement" label that are not assigned to any project:

  ```bash
  gh issue list --assignee @me --json number,title,projectItems,labels \
    --jq '[.[] | select((.labels[]?.name == "enhancement") and (.projectItems | length == 0))] | first'
  ```

If no issue is found, inform the user that no eligible issues exist. Stop.

## 2. Resolve Worktree

Get the current branch:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

If `$CURRENT_BRANCH` already starts with `<issue-num>-`, skip to Section 4.

Otherwise check for an existing worktree whose branch matches `<issue-num>-*` by parsing `git worktree list --porcelain`.

Parse `$PORCELAIN` as blank-line-delimited records. For each record, capture the leading `worktree <path>` line and check whether the same record's `branch refs/heads/<name>` matches `<issue-num>-*`. If a record matches, its `<path>` is the existing worktree.

- **Existing worktree found** → call `EnterWorktree` with `path: "<that worktree path>"`. Skip to Section 4.
- **No existing worktree** → continue to Section 3.

## 3. Create Worktree

`EnterWorktree` accepts exactly one of `name` (create a new worktree; triggers the `WorktreeCreate` hook) or `path` (switch to an existing worktree). Section 2 uses `path:`; Section 3 uses `name:`.

Generate a sanitized branch name from the issue title:

```bash
TITLE=$(gh issue view <issue-num> --json title --jq '.title')
```

Sanitize the title:
1. Convert to lowercase
2. Replace non-alphanumeric characters with dashes
3. Collapse consecutive dashes into one
4. Strip leading and trailing dashes
5. Summarize and/or truncate so total branch name (`<issue-num>-<sanitized-title>`) is at most 32 characters

Format: `<issue-num>-<sanitized-title>`

Call `EnterWorktree` with `name: "<sanitized-branch-name>"`.

The `WorktreeCreate` hook (`.claude/hooks/worktree-create.sh`) handles physical creation:
- Detects bare vs. classic layout and computes `<project-root>/worktrees/<branch>/`.
- Checks out the branch from `origin` if it already exists there, otherwise creates it from `origin/main`.
- Runs `direnv allow` on the new path.
- Runs `direnv exec` to evaluate `.envrc` so Claude's non-interactive subprocess shells land with node on PATH.
- Prints the path to stdout so `EnterWorktree` switches into it.

## 4. Dispatch into Workflow

Invoke `/ref-pr-workflow`. Resume logic in that skill picks the right step from issue state (or fallback rules).

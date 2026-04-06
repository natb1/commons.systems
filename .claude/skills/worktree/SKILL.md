---
name: worktree
description: Initialize work on new issues in git worktrees
---

# Worktree Initialization

Set up an isolated git worktree for working on a GitHub issue. Each issue gets its own worktree directory and branch.

## Handoff command

When a worktree exists but is not the current directory, prompt the user to close Claude and run:

```
cd <project-root>/worktrees/<branch-name> && claude "/pr-workflow #<issue-num>"
```

`<project-root>` is:
- **Bare layout**: parent directory of `.bare/` (e.g. `commons.systems/`)
- **Classic layout**: the repo root (unchanged from previous behavior)

Stop here.

## 1. Determine Issue Number

If the user provides an issue number, use it. Otherwise, auto-select using these prioritization rules. Only select from issues assigned to the current GitHub user (`--assignee @me`). Then prioritize in order:

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

If no issue is found, inform the user that no eligible issues exist.

## 2. Detect Layout and Check for Existing Worktree

Run the detect script to determine layout, project root, and whether a worktree already exists for this issue:

```bash
.claude/skills/worktree/scripts/detect-worktree.sh <issue-num>
```

Output is key=value lines:
- `LAYOUT` — `bare` or `classic`
- `PROJECT_ROOT` — parent of `.bare/` (bare) or the repo root (classic). Used for all path construction.
- `WORKTREE_PATH` — path to existing worktree for the issue, or empty if none
- `WORKTREE_BRANCH` — branch name of existing worktree, or empty if none

### Edge Case: Worktree exists and is the current directory

Invoke the `/pr-workflow` skill with the issue number. Stop here.

### Edge Case: Worktree exists but is not the current directory

Follow the **Handoff command**.

## 2.5. Offer Bare Layout Initialization (Classic Layout Only)

If `LAYOUT="classic"`, offer to convert the repo to the bare layout before proceeding.

Explain that the bare layout keeps the git repo in `.bare/` and all checkouts under `worktrees/`, which avoids cluttering the project root with working-tree files.

If the user declines, continue with the classic layout — skip to Section 3.

If the user confirms, run the following steps in order:

1. Clone locally into `.bare/`:
   ```bash
   git clone --local --bare . .bare
   ```

2. Fix the remote URL in `.bare/` to point to the original origin (not the local clone path):
   ```bash
   ORIGINAL_REMOTE=$(git remote get-url origin)
   git -C .bare remote set-url origin "$ORIGINAL_REMOTE"
   ```

3. Configure the fetch refspec so `git fetch` populates `refs/remotes/origin/*` tracking refs:
   ```bash
   git -C .bare config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
   ```

4. Add the `main` worktree:
   ```bash
   git --git-dir=.bare worktree add worktrees/main main
   ```

5. For each existing worktree besides HEAD, add it under `worktrees/`:
   ```bash
   git --git-dir=.bare worktree add -b <branch> worktrees/<branch> <branch>
   ```

6. Inform the user: the old working-tree files in the project root (everything except `.bare/` and `worktrees/`) should be removed manually after verifying the new worktrees work correctly.

After conversion, update variables:
```bash
LAYOUT="bare"
GIT_DIR="$PROJECT_ROOT/.bare"
PROJECT_ROOT=$(dirname "$GIT_DIR")
```

## 3. Generate Branch Name

Get the issue title and create a sanitized branch name:

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

## 4. Create Worktree

Check whether the branch already exists on `origin`, then create the worktree accordingly:

```bash
if git ls-remote --exit-code origin <branch-name>; then
  git fetch origin <branch-name>
  git worktree add "$PROJECT_ROOT/worktrees/<branch-name>" <branch-name>
else
  git fetch origin main
  git worktree add -b <branch-name> "$PROJECT_ROOT/worktrees/<branch-name>" origin/main
fi
```

- When the remote branch exists: `git ls-remote --exit-code` exits 0, then `git fetch` updates the remote tracking ref, and `git worktree add <path> <branch-name>` uses git's DWIM behavior to create a local tracking branch automatically.
- When no remote branch exists: fetches `main` and creates a fresh branch from `origin/main` (existing behavior).

`PROJECT_ROOT` was computed in Section 2 and already accounts for the layout (bare or classic). No `--git-dir` flag is needed — `git worktree add` finds the git dir from the current worktree context.

Then run `direnv allow` for the new directory:

```bash
direnv allow "$PROJECT_ROOT/worktrees/<branch-name>"
```

After creation, follow the **Handoff command**.

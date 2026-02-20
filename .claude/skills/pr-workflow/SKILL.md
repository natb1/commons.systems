---
name: pr-workflow
description: Manage end-to-end implementation of GitHub issues from planning through review
---

# PR Workflow

1. Verify the primary issue for this worktree:
   Run `` !`git rev-parse --abbrev-ref HEAD` `` to get the current branch.
   If the current branch doesn't start with an issue number followed by `-`: notify the user that there is no primary issue for the current worktree. Stop.

2. Invoke `/ref-pr-workflow`.

3. If the current plan has an active step recorded, resume at that step. Otherwise, apply **Resume Logic** from ref-pr-workflow to determine the starting step.

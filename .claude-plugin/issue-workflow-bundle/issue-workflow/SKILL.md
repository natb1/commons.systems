---
name: issue-workflow
description: Manage end-to-end implementation of GitHub issues from planning through review
---

# Issue Workflow

1. Verify this is a worktree for the requested issue:
   ```bash
   CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
   ```
   If no issue number provided, or `$CURRENT_BRANCH` doesn't start with the issue number followed by `-`: invoke `/worktree` instead. Stop.

2. Invoke `/ref-memory-management` and `/ref-issue-workflow`.

3. If the current plan has an active step recorded, resume at that step. Otherwise, apply **Resume Logic** from ref-issue-workflow to determine the starting step.

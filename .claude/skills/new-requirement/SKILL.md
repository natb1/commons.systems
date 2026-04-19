---
name: new-requirement
description: Invoke when the user introduces a new requirement or changes a previous understanding of a requirement — clarifies, updates remote issues, syncs context, and revises the active plan.
---

# New Requirement

Invoke whenever the user revises a previously-understood requirement — in a dispatched session, a legacy `/pr-workflow` session, or a free-form session on a feature branch.

## Steps

1. **Clarify.** Ask any questions needed to fully understand the change. Use `AskUserQuestion` when the revision has multiple reasonable interpretations. Skip if the change is unambiguous.

2. **Update remote issues.** If the change affects requirements captured in GitHub issues (primary, parent, sibling, sub-issue, blocker), edit them so the remote record matches the new understanding. Use `gh issue edit <num> --body '...'` or `gh issue comment <num> --body '...'`. Touch only affected issues; list them to the user first if ambiguous.

3. **Re-sync local context.** If Step 2 produced any remote edits, refresh the auto-loaded context:

   ```bash
   .claude/skills/ref-pr-workflow/scripts/sync-issue-context "$DISPATCH_ISSUE_NUM"
   ```

   Outside a dispatched session, pass the issue number explicitly. This rewrites `CLAUDE.local.md` in the worktree.

4. **Revise the active plan.** If a plan is active for the current work (plan mode, or a tracked task list), review each step against the revised requirement. Update steps that no longer apply; remove steps that are now obsolete; add new steps the revision introduces. If no plan is active, skip.

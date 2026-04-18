---
name: dispatch-implement
description: Dispatcher-driven implementation phase — plan, implement, commit, signal completion
---

# Dispatch: Implementation Phase

Invoked by `./dispatch/bin/dispatch <issue-num>` as the opening message. The dispatcher launched Claude with `claude -w <branch>` so the WorktreeCreate hook has already placed the session in the correct worktree. `DISPATCH_ISSUE_NUM` and `DISPATCH_STATE_FILE` (relative path `tmp/dispatch-<num>.json`) are exported.

## Steps

1. Run `./dispatch/bin/sync-issue "$DISPATCH_ISSUE_NUM"` to populate `$DISPATCH_STATE_FILE` with `{state, context}` — full issue body, comments, blockers, sub-issues, parent, siblings.
2. Read `$DISPATCH_STATE_FILE` for issue state and context. Do not re-fetch via `gh` or `issue-state-read` — the cache is now fresh.
3. Invoke `EnterPlanMode` for plan approval.
4. On approval, implement the plan. Commit changes — one commit per logical unit.
5. Run `./dispatch/bin/phase-complete` to signal completion. The dispatcher will `SIGTERM` this session shortly after.
6. Stop.

## Re-sync after remote edits

If you edit the remote issue or any related issue (parent, sibling, sub-issue, blocker) via `gh issue edit` or `gh issue comment` during this session, refresh the local cache:

```bash
./dispatch/bin/sync-issue "$DISPATCH_ISSUE_NUM"
```

This keeps `$DISPATCH_STATE_FILE` in lockstep with remote state. Skip only if you are certain no related issue was touched.

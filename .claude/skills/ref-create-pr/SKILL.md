---
name: ref-create-pr
description: Create draft PR closing implemented issues
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# PR Creation

Step 5. Create a PR closing all implemented issues from the **Current PR Scope and Status** section:

```bash
gh pr create --draft --title "PR title" --body "$(cat <<'EOF'
## Summary
...

Closes #<primary-issue>
Closes #<related-issue-1>
Closes #<related-issue-2>

EOF
)"
```

Include a separate `Closes #N` for each issue (primary + all implemented dependencies and sub-issues).

On completion → update state to step=6/phase=verify via `.claude/skills/ref-pr-workflow/scripts/issue-state-write` with `active_skills: ["ref-memory-management", "ref-pr-workflow"]`. Return to router for dispatch to verify phase.

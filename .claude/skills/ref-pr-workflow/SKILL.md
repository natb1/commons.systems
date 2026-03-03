---
name: ref-pr-workflow
description: Complete workflow documentation for issue implementation lifecycle — resume from any step after context loss
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Current PR Scope and Status
The purpose of this conversation is to create and manage a PR with the following scope.

- Current branch: !`git rev-parse --abbrev-ref HEAD`
- PR status: !`gh pr view --json title,body,comments,number,state 2>/dev/null || echo "No PR"`
- Primary issue: !`$CLAUDE_PLUGIN_ROOT/scripts/issue-primary 2>/dev/null || .claude/skills/ref-pr-workflow/scripts/issue-primary`
- Blocking issues: !`$CLAUDE_PLUGIN_ROOT/scripts/issue-blocking 2>/dev/null || .claude/skills/ref-pr-workflow/scripts/issue-blocking`
- Sub-issues: !`$CLAUDE_PLUGIN_ROOT/scripts/issue-sub-issues 2>/dev/null || .claude/skills/ref-pr-workflow/scripts/issue-sub-issues`
- Commit log: !`git log origin/main..HEAD --format="commit %H%nAuthor: %an <%ae>%nDate: %ad%n%n%s%n%n%b"`

# Dependencies
Invoke `/ref-memory-management` if not already active.

# Issue Workflow Reference
Reference only. Do not execute this workflow until directed to do so (eg., by `/pr-workflow`).

## Resume Logic

1. Run `issue-state-read <issue-number>`. If exit 0 → use `step` and `phase` from the JSON. Skip fallback.
2. If exit 1 → use fallback, then write fresh state via `issue-state-write`.

**Fallback** (scan **Current PR Scope and Status** above):
- No PR + implementation commits → step=4, phase=unit
- No PR + no commits → step=2, phase=core
- PR, no acceptance "Complete" → step=6, phase=verify
- PR, acceptance done, no smoke "Complete" → step=7, phase=verify
- PR, smoke done, no QA "Complete" → step=8, phase=review
- PR, QA done, no code quality "Complete" → step=9, phase=review
- PR, code quality done, no security "Complete" → step=10, phase=review
- All "Complete" → step=11, phase=core

## Dispatch

Run `save-skill-state.sh skill ref-pr-workflow-<phase>`, then invoke the phase skill at the determined step:

| Step | Phase | Invoke |
|---|---|---|
| 1, 2, 3, 5, 11 | core | `/ref-pr-workflow-core` at Step N |
| 4 | unit | `/ref-pr-workflow-unit` |
| 6, 7 | verify | `/ref-pr-workflow-verify` at Step N |
| 8, 9, 10 | review | `/ref-pr-workflow-review` at Step N |

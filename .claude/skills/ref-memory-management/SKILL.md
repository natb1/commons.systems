---
name: ref-memory-management
description: Load when planning work, writing commits, changing requirements, or editing/commenting on issues/PR
---

# Clean Context Planning Rule

When creating any plan (issue implementation, review, security review, or ad hoc):
- All plans must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session.

# Issue Context Loading

`CLAUDE.local.md` in a dispatch worktree is a **static identity stub** — issue
number, title, branch, and a pointer to the context-pack script. It carries no
issue body, comments, or related-issue context, so it stays tiny and never goes
stale.

For live, on-demand issue context (at session start, after context loss, or when
a skill requests issue data), run the context pack with the slices you need:

`.claude/skills/dispatch-propagate/scripts/dispatch-context-pack <issue-number> [--issue] [--relations] [--pr] [--diff]`

| Slice | Content |
|---|---|
| `--issue` | Primary issue title, body, and comments (live). |
| `--relations` | Blockers / sub-issues / parent / siblings as **titles + state + URL only** (never full bodies — read a single related issue explicitly if you need its body). |
| `--pr` | PR number, labels, and CI status rollup. |
| `--diff` | Merge-base, `--stat`, changed-file list, and size-capped hunks. |

Context is live and flag-sliced: pass only the slices a task needs rather than
loading a full snapshot. Individual issue-relationship scripts remain in
`.claude/skills/dispatch-propagate/scripts/` for standalone use.

# Commit Guidelines

When writing commits:
- Include work done and design/scope decisions to avoid unintentional changes to those decisions
- If conflicts arise between current plan and previous decisions, ask user questions to clarify intent
- Merge origin/main and push immediately after every commit:
  ```bash
  git fetch origin main && git merge origin/main && git push origin HEAD
  ```

# Branch-Specific Rules

When current branch is NOT main:

## Requirement Changes
- Enter plan mode (if not already in plan mode)
- Update plan to include step to edit relevant issue body with new requirement

# Git & GitHub Skills

Do not use -C for basic git commands.

For issue relationship APIs (sub-issues, dependencies), see `ref-github-issues`.

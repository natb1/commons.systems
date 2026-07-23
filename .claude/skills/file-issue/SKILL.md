---
name: file-issue
description: RETIRED — superseded by /align-strategy and /align-tactics. File or improve GitHub issues — separates multi-topic input into independent issues, then per issue runs the full quality evaluation pipeline (duplicate detection, 8-category evaluation, decomposition gate, type/topic classification) and applies results directly with no approval gate
---

# File Issue (RETIRED)

This skill is retired. It is no longer invoked by dispatch or any other caller.

`/file-issue` was the legacy gh-issue-lane skill for filing and improving
GitHub issues: it separated multi-topic input into independent issues and ran
a full evaluation pipeline (duplicate detection, quality checks, decomposition,
type/topic classification) with no approval gate.

The intention-graph lane has superseded it:

- **`/align-strategy`** — interview-driven recording of a `strategy-*`
  intention node. This is the graph-native successor to `/file-issue`'s
  requirements-definition role.
- **`/align-tactics`** — breaks a recorded `strategy-*` intention node into
  PR-sized tactic subtrees. This is the graph-native successor to
  `/file-issue`'s epic-structuring (decomposition) role.

For any future work that would previously have gone through `/file-issue`,
use `/align-strategy` and `/align-tactics` instead.

The scripts under `.claude/skills/file-issue/scripts/` are left in place
unchanged; this retirement touches only this SKILL.md.

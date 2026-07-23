---
name: plan-issue
description: RETIRED — superseded by /align-tactics. Plan phase — autonomously plan a no-PR issue into an ordered unit breakdown via the built-in Explore/Plan subagents, persist the plan to the issue, and apply dispatch:planned (no user gate; escalates to office-hours only on genuine ambiguity)
---

# Plan Issue (RETIRED)

This skill is retired. It is no longer invoked by dispatch or any other caller.

`/plan-issue` was the legacy gh-issue-lane planning skill: it autonomously
planned a no-PR issue into an ordered unit breakdown via the built-in
Explore/Plan subagents, persisted the plan to a `<!-- dispatch:plan -->`
issue comment, and applied `dispatch:planned`.

The intention-graph lane has superseded it:

- **`/align-tactics`** — the graph-native successor to `/plan-issue`.
  Autonomously breaks a recorded `strategy-*` intention node into PR-sized
  tactic subtrees carrying full clean-session plans, or finalizes/re-plans a
  single frozen `tactic-*` node directly.

For any future work that would previously have gone through `/plan-issue`,
use `/align-tactics` instead.

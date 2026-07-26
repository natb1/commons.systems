---
name: plan-issue
description: RETIRED — do not invoke. Superseded by /align-tactics; use that instead.
---

# Plan Issue (RETIRED)

This skill is retired: no live code path reaches it. `dispatch-select-tick`'s
legacy gh-issue-queue selection path, along with the `dispatch-select-target`
and `dispatch-route` scripts, were deleted from `origin/main` by
`tactic-dispatch-legacy-rewire` (PR #2869, merged 2026-07-18) — not by
`tactic-legacy-router-removal`, which only records the fact (see its "What
actually landed" section). So no legacy issue target is selected and no phase
skill is routed to `/plan-issue`. GitHub Issues are also disabled repo-wide
(strategy clarification dated 2026-07-16, cited in
`intentions/tactic-graph-native-dispatch.md` §4).

Most remaining `/plan-issue` mentions elsewhere in `.claude/` are descriptive
references in legacy-issue-lane docs, not live invocations. Two are **not**:
`.claude/skills/align-tactics/SKILL.md` and `.claude/workflows/align-tactics.js`
formerly cited this file as the normative home of the plan schema and
plan-quality bar. Both were made self-contained as part of this retirement — the
schema's live home is now the `PLAN BODY SCHEMA` block in `buildPlanPrompt`
(`.claude/workflows/align-tactics.js`). Regenerate the full mention list with
`grep -rn '/plan-issue' .claude/ intentions/` before any sweep.

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

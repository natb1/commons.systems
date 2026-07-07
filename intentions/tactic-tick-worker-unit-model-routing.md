---
id: tactic-tick-worker-unit-model-routing
kind: tactic
statement: "Resolve per-unit Recommended-model routing for implement workers
  under the workflow-native tick: Workflow subagents cannot spawn subagents"
owner: ai
status: raw
parent: null
rationale: "Draft finding from the 2026-07-06/07 emulated router ticks
  (graph-tick-emulation-workflow-gotchas). The workflow-native tick
  (dispatch-graph-tick.js, PR #2785) spawns phase workers as Workflow agents,
  which expose no Agent/Task tool — so an implement worker cannot spawn one
  subagent per plan unit at that unit's Recommended model tag (clarification 17
  doctrine). Tick-3 evidence: the office-hours-graph-entry worker implemented
  all four units directly at opus and recorded the deviation."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Resolve per-unit Recommended-model routing for implement workers under the workflow-native tick: Workflow subagents cannot spawn subagents

**Draft** — retained finding from the 2026-07-06/07 emulated router ticks;
input to a later `/align-tactics strategy-graph-native-dispatch` round. This
is a doctrine-vs-substrate contradiction, so the consuming round may need to
propose a clarification for author ratification rather than plan directly.

## Finding

Two recorded decisions collide:

- Clarification 17 (dispatch-phase-model routing): an implement session spawns
  one subagent per plan unit at that unit's **Recommended model** tag — the
  mechanism `.claude/rules/planning.md` and every planned tactic body assume.
- Clarifications 24–25 (workflow-native tick): phase workers are spawned by
  `dispatch-graph-tick.js` (`.claude/workflows/`, PR #2785) as Workflow
  `agent()` calls.

Workflow subagents expose no Agent/Task tool (verified in tick 3: tool search
inside a worker surfaces only task-list and messaging tools), so an implement
worker *cannot* execute the per-unit fan-out. The tick-3
`tactic-office-hours-graph-entry` worker implemented all four units directly
at opus and recorded the deviation; every workflow-native implement worker
will hit the same wall.

## Options for the consuming round

1. **Hoist the fan-out to the tick script** — `dispatch-graph-tick.js` parses
   the node-body plan's units and runs one top-level `agent()` per unit at its
   tag, with a coordinator worker owning worktree state between units. Honors
   clarification 17; adds plan-parsing to the tick and serializes units
   through the coordinator.
2. **Subagent-capable workers** — give the phase-worker agent definition a
   toolset that includes Agent (agentType with tools: '*'). Simplest if the
   Workflow runtime supports nested spawning for custom agent types; verify —
   nesting may be capped at one level.
3. **Amend the doctrine** — implement workers run single-model at the phase
   default (opus), and the per-unit tag degrades to advisory for
   non-workflow-native contexts (interactive planning, legacy /implement).
   Cheapest; forfeits the token savings that motivated clarification 17's
   sonnet-tagged units, so it interacts with strategy-token-economy.

Evidence for sizing the loss under option 3: unit tags across currently
planned tactics are roughly half sonnet, and clarification 17's rationale was
measured Opus overspend on mechanical units (/dispatch-token-audit).

## Reuse

- `dispatch-graph-tick.js` worker-spawn path (`.claude/workflows/`, PR #2785).
- The plan-schema unit shape (`.claude/skills/align-tactics/SKILL.md` Step 3)
  — already machine-recognizable (**Recommended model:** lines) if option 1
  parses units.

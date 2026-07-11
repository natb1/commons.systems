---
id: tactic-graph-phase-launch-per-phase
kind: tactic
statement: "graph-native launch-per-phase (Shape B): retire the
  dispatch-graph-tick agent() fan-out; an owned primitive spawns each selected
  phase as its own top-level sonnet orchestrator session (Workflow tool in
  hand), opus subagents only when the work calls for it"
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-11 /align-strategy interview revising
  strategy-graph-native-dispatch clarification 24 to Shape B. The
  dispatch-graph-tick agent()-per-node fan-out cannot host a phase whose own
  logic is a workflow (a workflow-spawned subagent lacks the Workflow tool), so
  /review-fix and /qa-fix park every time. This tactic implements the Shape-B
  launch layer and its model routing.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-token-economy
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
# graph-native launch-per-phase (Shape B): retire the dispatch-graph-tick agent() fan-out; an owned primitive spawns each selected phase as its own top-level sonnet orchestrator session (Workflow tool in hand), opus subagents only when the work calls for it

> Draft context retained by `/align-strategy` on 2026-07-11 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

`strategy-graph-native-dispatch` clarification 24 (amended 2026-07-11) revises
the launch layer to **Shape B**. The retired design: a thin `dispatch-graph-tick`
workflow fans out one `agent()` per selected node
(`.claude/workflows/dispatch-graph-tick.js:154-173`), and that subagent is told
to `INVOKE ${sel.skill}` (`:121`). The fatal limit: a **workflow-spawned
subagent is not given the Workflow tool**, so a phase whose own logic is a
workflow — `/review-fix` (`.claude/workflows/review-fix.js`) and `/qa-fix`
(`.claude/workflows/qa-fix.js`) — cannot run this way; it parks at its Step 2
every time (the graph already carries these parks, e.g. the 2026-07-11
`tactic-align-strategy-alignment-tests` qa park).

## Scope (to be decomposed by /align-tactics)

- **Retire** the `dispatch-graph-tick` `agent()`-per-node fan-out. Selection,
  pacing, claiming, and transitions were never in that workflow — they are in
  owned `dispatch-select-tick` / intentionsutil code (clarification 25) — so
  only the launch layer moves.
- **Owned launch-per-phase primitive.** A graph-lane sibling of the retired
  `dispatch-launch-worker`, or an extension of the already pace-independent
  `dispatch-graph-execute` path (see `[[tactic-graph-explicit-node-dispatch]]`,
  which teaches the explicit-arg path to route a node id there). It spawns each
  selected phase as its **own top-level `claude` session** running the phase
  skill (`/implement`, `/review-fix`, `/qa-fix`, `/fix-checks`) — which, at top
  level, holds the Workflow tool and builds its own phase-specific fan-out.
- **Model routing** (the `strategy-token-economy` half; clarification added
  2026-07-11 there): spawn the orchestrator session on **sonnet**
  (`--model`, the pattern `[[tactic-noncodegen-session-model-defaults]]` already
  uses for aux spawns); the phase's workflow subagents set **opus** only when
  the work calls for it — a unit's Recommended model (`[[tactic-align-family-opus-default]]`
  precedent) or an explicitly opus-instructed review.
- **Outcome is durable graph state, not a session return.** The phase writes its
  own `phase` transition via `graph-commit` (clarification 1;
  `[[tactic-graph-router-transitions]]`), so the launcher needs no
  schema-validated `agent()` return. Recovery = next-tick re-selection from
  `origin/main`; independent sessions mean a dead phase session cannot kill
  siblings.

## Supersedes

This subsumes `[[tactic-tick-worker-unit-model-routing]]`, whose premise —
"per-unit model routing under the **workflow-native tick**; Workflow subagents
cannot spawn subagents" — is retired by Shape B (there is no per-node tick
subagent to route; the phase orchestrator session is routed at spawn, its
subagents inside its own workflow). `/align-tactics` should reconcile or drop
that raw node when it decomposes this one.

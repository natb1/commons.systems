---
id: tactic-dispatch-conflict-greenfield
kind: tactic
statement: "Build dispatch-conflict: auto-resolve mechanical merge conflicts
  from existing graph requirements, park only on conflicts needing author input
  on intention"
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-18 /align-strategy interview as the
  greenfield state for conflict resolution (clarification 67). Renames
  /fix-conflicts to dispatch-conflict AND upgrades its behavior; per the
  2026-07-19 partition clarification 78 it owns the resolution ladder's model
  layers 4-5 — scoped model reconciliation and the true-conflict office_hours
  park — invoked on graph-commit's mechanical-unresolved exit; the deterministic
  mechanical layers 1-3 are tactic-graph-commit-auto-serialization's (this
  node's blocked_by). Parked and cleared 2026-07-19 (two-draft collision,
  resolved by the ratified partition). Finalize as a BACKLOG tactic (off-path,
  low rank) per clarification 69.
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
# Build dispatch-conflict: auto-resolve mechanical merge conflicts from existing graph requirements, park only on conflicts needing author input on intention

Draft context (retained by /align-strategy 2026-07-18; not yet planned). The greenfield conflict-resolution state (strategy clarification 67).

## Target behavior

`dispatch-conflict` (renamed from `/fix-conflicts`, made graph-native):
- **Auto-resolve mechanical conflicts** — any conflict decidable from existing graph requirements — without author involvement.
- **Park to office_hours only on intention conflicts** — conflicts that genuinely need author input on *intent*, not mechanics.

## What this upgrades

Today graph-commit parks on *any* rebase conflict (the loser's-mailbox park). The greenfield skill narrows parking to genuine intention contention, so mechanical conflicts clear autonomously.

`/fix-conflicts` today is legacy issue-lane-only (`.claude/skills/fix-conflicts/SKILL.md:37-50`, branch `<N>-…` only). This tactic both renames it into the dispatch-* namespace ([[tactic-dispatch-skill-rename]]) and rebuilds it for the graph-native lane.

## Partition (2026-07-19, clarification 78)

This tactic owns the MODEL layers of the resolution ladder (clarification 58,
as partitioned by clarification 78 — ratified at the 2026-07-19 office-hours
review clearing this node's park):

- **Layer 4 — scoped model reconciliation**: a skill-thread opus subagent in
  the `/fix-conflicts` resolved/ambiguous verdict shape
  (`.claude/skills/fix-conflicts/SKILL.md`). Clarification 58's model scope
  guard applies verbatim: on human-owned doctrine fields (virtue/strategy/
  tradition/delegation statement, rationale, clarification text) the model
  resolves only mechanical divergence — subsumption, reordering, same intent
  differently worded — never synthesizing new substance; genuine doctrine
  divergence goes to layer 5. Full reconciliation on ai-owned tactic content
  and state fields (phase, office_hours, execution).
- **Layer 5 — true-conflict park**: office_hours park carrying BOTH divergent
  values plus a recommendation (`office_hours.recommendation`, first-class in
  schema.ts; coordinate with `tactic-graph-commit-park-context`).

Invocation seam: graph-commit's structured `mechanical-unresolved` exit —
layers 1-3 exhausted. The mechanical layers are
`tactic-graph-commit-auto-serialization`'s scope (this node's `blocked_by`)
and are NOT re-implemented here.

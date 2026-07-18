---
id: tactic-dispatch-conflict-greenfield
kind: tactic
statement: "Build dispatch-conflict: auto-resolve mechanical merge conflicts
  from existing graph requirements, park only on conflicts needing author input
  on intention"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview as the
  greenfield state for conflict resolution (clarification 67). Renames
  /fix-conflicts to dispatch-conflict AND upgrades its behavior: today
  graph-commit parks on any conflict (the loser's-mailbox park); the greenfield
  skill resolves mechanical conflicts decidable from the graph and reserves
  office_hours parks for genuine intention contention. Finalize as a BACKLOG
  tactic (off-path, low rank) per clarification 69."
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

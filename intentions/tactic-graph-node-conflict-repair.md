---
id: tactic-graph-node-conflict-repair
kind: tactic
statement: "graph-node PR merge conflicts get autonomous repair: extend
  /fix-conflicts to node targets (or add a conflict-repair rung to PHASE_LADDER)
  so mechanical conflicts re-merge automatically instead of parking to a human"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-07 during manual router-tick emulation + session
  triage. tactic-phase-skill-node-targets re-keys only /implement, /fix-checks,
  /qa-fix, /review-fix to accept node targets; /fix-conflicts is excluded, and
  PHASE_LADDER (router.ts) has no conflict rung, so a CONFLICTING graph-node PR
  has no autonomous repair path. tactic-graph-router-selector already designs
  this as a mechanical-failure office_hours park. Confirmed empirically: PR
  #2787 (office-hours-graph-entry) conflicted with merged sibling #2775 and a
  human hand-resolved the 3-file intentionsutil conflict. Legacy dispatch treats
  mechanical merge conflicts as autonomous-fixable via /fix-conflicts, so the
  greenfield router regresses that capability. Author decision (2026-07-07
  /align-strategy): BUILD autonomous node-target conflict repair (restore
  parity), reserving the office_hours park for genuine content conflicts needing
  human judgment."
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
# graph-node PR merge conflicts get autonomous repair: extend /fix-conflicts to node targets (or add a conflict-repair rung to PHASE_LADDER) so mechanical conflicts re-merge automatically instead of parking to a human

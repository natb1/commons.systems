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
office_hours:
  reason: "Record-completeness defect (condition 7 / strategy clarification 31):
    this 2026-07-07 draft's exact scope -- autonomous repair of graph-node PR
    merge conflicts, auto-resolving mechanical conflicts and reserving
    office_hours for genuine content/intent conflicts -- was independently
    re-derived twice since, without ever discovering or reconciling this node.
    First 2026-07-13 (clarification 58) into
    tactic-graph-commit-auto-serialization (resolution ladder layers 1-3,
    in-script mechanical merge). Then 2026-07-18 (clarification 67) into
    tactic-dispatch-conflict-greenfield (layers 4-5, the dispatch-conflict skill
    renaming /fix-conflicts, model-driven reconciliation, and the true-conflict
    park). Clarification 78 (2026-07-19) ratified the partition between those
    two vehicles and explicitly named that it cured the record-completeness gap
    between clarifications 58 and 67 -- but it does not mention this node, and
    no node in the graph references tactic-graph-node-conflict-repair (verified
    via grep). Finalizing this draft as an independent implement-phase plan
    would build a third, conflicting mechanism for scope the author has already
    worked through and ratified twice over. Needs an author decision: prune this
    node as superseded, or confirm whether anything in it is worth folding into
    the ratified two-vehicle design before pruning."
  since: 2026-07-19
  recommendation: "Prune tactic-graph-node-conflict-repair (via graph-commit
    --prune) once confirmed superseded. Its full scope is already covered:
    tactic-graph-commit-auto-serialization owns the deterministic mechanical
    layers (boost 64, currently top of the selector frontier; author has said
    they will /align-tactics it in a separate session), blocked_by-chained into
    tactic-dispatch-conflict-greenfield, which owns the model-driven layers and
    the dispatch-conflict rename of /fix-conflicts -- together they auto-resolve
    mechanical conflicts and park only genuine intention conflicts, exactly this
    draft's ask. Nothing in this draft looks additive beyond that ratified
    design except the empirical PR #2787/#2775 anecdote (a real conflict that
    needed hand resolution), which is illustrative grounding, not load-bearing
    scope -- worth a one-line citation on
    tactic-graph-commit-auto-serialization's rationale if the author wants it
    preserved, otherwise safe to drop with this node."
pace_exempt: false
rounds: null
attributes: {}
---
# graph-node PR merge conflicts get autonomous repair: extend /fix-conflicts to node targets (or add a conflict-repair rung to PHASE_LADDER) so mechanical conflicts re-merge automatically instead of parking to a human

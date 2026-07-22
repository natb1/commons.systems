---
id: tactic-recovery-drill-open-weight
kind: tactic
statement: Complete a real unit of work on open-weight local inference and
  record the capability gap
owner: human
status: delegated
parent: null
rationale: "The drill strategy-exercise-recovery-paths names for
  delegation-anthropic-claude, and the first gap reading
  strategy-open-weight-readiness's trend starts from: run one genuine unit of
  repo work end-to-end on a local open-weight model and record where it fell
  short."
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
  - strategy-open-weight-readiness
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-exercise-recovery-paths
  - strategy-open-weight-readiness
blocked_by:
  - tactic-open-weight-runtime-provision
office_hours:
  reason: "Author drill, definitionally not claude-executable: the drill exercises
    completing repo work WITHOUT the Anthropic delegation, on author hardware
    with author judgment of where the model fell short. Irreducibly longer than
    an office-hours micro-item — schedule a dedicated drill block (the provision
    step is split out as its own 30-minute leaf)."
  since: 2026-07-11
  recommendation: "After tactic-open-weight-runtime-provision: pick one small real
    tactic or unit (sonnet-sized) from the open backlog; run it end-to-end on
    the local open-weight model (edit, test, commit discipline included); record
    exactly where it fell short — capability, context length, tooling — as a
    dated drill report. Write that as the first reading on
    strategy-open-weight-readiness (its trend starts here), and flip
    delegation-anthropic-claude's attributes.irreversibility.last_exercised to
    the drill date via write-node.ts + graph-commit."
pace_exempt: false
rounds: null
attributes: {}
---
# Complete a real unit of work on open-weight local inference and record the capability gap

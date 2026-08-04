---
id: tactic-align-tactics-workflow-tactic-mode-drift-gate
kind: tactic
statement: "align-tactics.js's drift phase applies the STRATEGY-decomposability
  eligibility gate unconditionally, so every mode: \"tactic\" invocation
  (finalize/re-plan of one already-selected frozen tactic) is blocked from
  planning whenever its serving strategy already has any non-draft child on the
  signal path -- which is true of essentially every mature strategy, making the
  tactic-target flow universally broken"
owner: ai
status: raw
parent: null
rationale: "Measured live 2026-08-04, discovered while /align-tactics
  tactic-bounded-work-in-progress ran mode: \"tactic\" against
  strategy-graph-native-dispatch (Workflow run wf_7a2584e1-808). THE DEFECT:
  buildDriftPrompt (.claude/workflows/align-tactics.js:656-726) is the
  strategy-decomposability ELIGIBILITY SANITY CHECK verbatim -- \"the strategy
  is decomposable this round only when ... it has no non-draft child tactic
  already on its signal path\" -- but the pipeline calls it unconditionally at
  line 1009 with no mode branch, and mode is not passed into buildDriftPrompt at
  all (its signature is buildDriftPrompt(strategy, gather), no mode argument).
  The pipeline then gates the entire plan phase on the drift verdict regardless
  of mode: line 1085 reads `if (!driftProceed) { planTactics = []; }` before the
  mode==='tactic' branch at line 1087 even has a chance to run. So when
  eligibility.decomposable is false (which it always is once a strategy has any
  in-flight tactic on its signal path -- the normal, common case for a mature
  strategy under active dispatch), driftProceed is false, planTactics stays
  empty, and the single target tactic's plan is never authored -- even though
  its selectability was already fully decided by the router's
  frozenTacticSelectable gate before this session ran. This contradicts the
  SKILL's own documented contract:
  .claude/skills/align-tactics/references/tactic-target.md states plainly that
  in tactic mode \"selectability (phase/status/office_hours/blockers) is already
  decided before this session runs, so this session does not re-decide it.\" The
  eligibility.decomposable check re-decides exactly that, using STRATEGY-mode
  criteria (no non-draft child on signal path) that have no bearing on whether
  one specific, already-frozen tactic should be finalized or re-planned.
  MEASURED CONSEQUENCE: on strategy-graph-native-dispatch, 173 tactics serve it,
  of which 92 are non-draft and on its signal path (44 done, 18 main-qa, 14
  implement, 13 qa, 3 review). The eligibility check's \"no non-draft child on
  signal path\" clause therefore fails for every /align-tactics <tactic-id>
  invocation against this strategy, blocking finalize/re-plan of any of its
  draft/soft-frozen children -- the exact failure observed on
  tactic-bounded-work-in-progress, which received no plan and had to be parked
  instead. SIDE EFFECT OBSERVED: one gather-phase subagent (of the 3 reuse hunts
  + corpus + clause-coverage agents launched under phase 'gather') also failed
  with a StructuredOutput retry-cap exceeded (5 failed calls); this is a
  separate, likely transient failure -- not diagnosed further here since the
  eligibility-gate defect above is fully sufficient to explain the observed
  no-plan outcome on its own, and this tactic's fix does not depend on
  diagnosing it. If the transient recurs after the fix below lands, it should be
  tracked as its own tactic. GREENFIELD (recommended): pass mode into
  buildDriftPrompt (or branch at the call site) so the ELIGIBILITY SANITY CHECK
  block only applies when mode !== 'tactic'; in tactic mode, drift review should
  still run the two-sided Side A/B substance check (a recorded strategy
  condition failing, or an unrecorded material premise the plan depends on)
  since that substance is genuinely useful context for a finalize/re-plan, but
  must not gate on strategy-level decomposability. Correspondingly, the
  plan-phase gate at line 1085 should stop treating driftProceed as a blanket
  kill switch in tactic mode: in tactic mode, plan the target unless drift
  itself parked THIS tactic specifically (a park in drift.parks naming the
  target id), not merely because eligibility.decomposable came back false. This
  is scoped narrowly to the tactic-mode pipeline wiring (lines ~656-726 prompt
  text, ~910-1091 pipeline logic) -- it does not touch the strategy-mode
  decompose/plan behavior, which is unaffected and already correct."
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
# align-tactics.js's drift phase applies the STRATEGY-decomposability eligibility gate unconditionally, so every mode: "tactic" invocation (finalize/re-plan of one already-selected frozen tactic) is blocked from planning whenever its serving strategy already has any non-draft child on the signal path -- which is true of essentially every mature strategy, making the tactic-target flow universally broken

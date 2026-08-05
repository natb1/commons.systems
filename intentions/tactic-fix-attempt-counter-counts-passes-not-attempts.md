---
id: tactic-fix-attempt-counter-counts-passes-not-attempts
kind: tactic
statement: execution.fix.attempt counts /fix-checks PASSES and re-entrant
  --set-fix calls rather than CI-verified fix attempts, so FIX_ATTEMPT_CAP
  bounds an unpredictable amount of real work — observed inflating the counter
  ~6x (27-31 recorded against 4-6 actual CI runs)
owner: ai
status: raw
parent: null
rationale: "Found 2026-08-03 while triaging the three live fix-attempt-cap
  holds. THE SYMPTOM: the holds on tactic-graph-router-live-worker-read-robust,
  tactic-stale-hold-auto-resolve and tactic-attention-boost-scripts record
  execution.fix.attempt of 31, 29 and 28 against FIX_ATTEMPT_CAP = 3
  (transitions.ts:101), which reads as a runaway retry loop. IT IS NOT ONE:
  counting actual workflow runs on each branch (gh run list --branch <b> --json
  databaseId) gives 4, 6 and 4. There was no large token burn, and the reset of
  the source's counter to 1 under the hold is deliberate documented behavior
  (the hold's own recommendation text states it), not a defect. THE ACTUAL
  DEFECT is what the counter counts. Two paths inflate it without doing
  CI-verified work: (1) applySet in apply-fix-state.ts:210-213 bumps attempt on
  any re-entrant --set-fix, by design ('a defensive double-call bumps attempt');
  (2) /fix-checks spends one unit per PASS (apply-fix-state --spend-attempt, per
  its SKILL.md), whether or not that pass pushes anything. Meanwhile the cap
  gate in graph-select-target only evaluates on a fresh CONCLUDED-RED verdict,
  which requires a NEW CI run to exist — so a pass that pushes nothing spends
  budget while never advancing the state the gate reads. WHY IT MATTERS: the cap
  exists to bound how much automated effort is spent on a persistently-red PR
  before escalating to a human. A counter that increments on non-work makes that
  bound unpredictable in BOTH directions — it can exhaust a 3-attempt budget
  after zero real fix attempts, escalating work that was never actually tried,
  or run far past 3 when the gate is never reached. Either way the number in the
  escalation text misinforms the human reading it, which is exactly what
  happened here: it prompted a two-day-standing note describing a token burn
  that never occurred. GREENFIELD: make the unit counted equal the unit bounded
  — spend an attempt only when a pass produces a pushed commit that yields a new
  CI conclusion, i.e. tie the increment to --record-push rather than to pass
  entry, and make re-entrant --set-fix idempotent instead of incrementing. Then
  attempt == number of CI-verified fix attempts, and FIX_ATTEMPT_CAP means what
  its name says. Also emit the real run count alongside attempt in the
  escalation reason so a human can spot a divergence without leaving the park
  text. CAVEAT ON EVIDENCE: the inflation paths above are read from the code and
  corroborated by the run-count gap; they are NOT yet proven by a repro.
  Decomposition should build one first — a node driven through several
  fix-checks passes without a push, asserting attempt does not move. Distinct
  from tactic-bounded-work-in-progress, which concerns how candidates are
  ordered rather than how one node's retry budget is metered."
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
# execution.fix.attempt counts /fix-checks PASSES and re-entrant --set-fix calls rather than CI-verified fix attempts, so FIX_ATTEMPT_CAP bounds an unpredictable amount of real work — observed inflating the counter ~6x (27-31 recorded against 4-6 actual CI runs)

---
id: tactic-align-tactics-tactic-mode-drift-gate
kind: tactic
statement: align-tactics.js's tactic-mode plan phase is gated on the strategy's
  round-decomposability verdict (`driftProceed`, which folds in
  `eligibility.decomposable`) instead of on a genuine per-node park — so a
  per-node `/align-tactics <tactic-id>` finalize is wrongly escalated whenever
  the serving strategy's signal path happens to be claimed by an unrelated
  in-flight child
owner: ai
status: raw
parent: null
rationale: "Found and empirically confirmed 2026-07-25 while running
  /align-tactics tactic-transition-node-stamp-landed-body (a per-node
  tactic-target finalize of an off-path bug-fix tactic, validates: []).
  .claude/workflows/align-tactics.js runs the DRIFT phase unconditionally for
  both modes (only the DECOMPOSE phase is skipped in tactic mode, per the mode
  !== 'tactic' guard at the decompose call site). The drift agent's ELIGIBILITY
  SANITY CHECK asks whether the STRATEGY is decomposable THIS ROUND — including
  'it has no non-draft child tactic already on its signal path' — a
  strategy-round concept that is orthogonal to finalizing one already-recorded,
  already strategy-endorsed off-path tactic (tactic-target.md: 'no strategy
  decomposition ... no rounds bump here'; the code's own inline comment on the
  plan-tactics branch says tactic mode should 'always plan it, unless drift
  parked it', contradicting the actual gate used). The unpatched code computed
  `planTactics = []` whenever `!driftProceed` for BOTH modes (driftProceed =
  drift.proceed === true), so a drift verdict of eligibility.decomposable=false
  (with side_a_failed_conditions=[] and parks=[]) silently skipped the plan
  phase in tactic mode too, producing tactics:[{...body_markdown:null}] and
  disposition 'escalated' with NO actual park recorded anywhere (drift.parks was
  empty) -- an unrecoverable dead end with no office_hours reason written to
  explain it, since align-tactics/SKILL.md's Step 2 only writes office_hours
  from result.parks, which was empty. Verified concretely: the exact same
  strategy/target_node args, re-run after patching the tactic-mode branch to
  gate only on `(drift.parks || []).length > 0` (ignoring
  eligibility.decomposable / driftProceed for mode==='tactic'), produced
  disposition 'completed_with_fixes' with a full authored plan body -- proving
  the escalation was a tooling defect, not a genuine
  requirement-ambiguity/scope-deviation/unverifiable-blocker per the autonomy
  contract's three park conditions (references/autonomy.md). The fix was applied
  only to this session's in-memory persisted script copy (never committed to
  .claude/workflows/align-tactics.js), so the defect is still live in the repo
  and will recur on the next per-node tactic-target invocation against any
  strategy whose signal path is already claimed -- which, for
  strategy-graph-native-dispatch specifically, is the STANDING state today
  (tactic-legacy-router-removal holds the sole validates edge), so every future
  /align-tactics <tactic-id> against this strategy will hit it until fixed."
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
# align-tactics.js's tactic-mode plan phase is gated on the strategy's round-decomposability verdict (`driftProceed`, which folds in `eligibility.decomposable`) instead of on a genuine per-node park — so a per-node `/align-tactics <tactic-id>` finalize is wrongly escalated whenever the serving strategy's signal path happens to be claimed by an unrelated in-flight child

## Suggested fix (validated empirically this round, not yet committed)

In `.claude/workflows/align-tactics.js`, at the PLAN phase's `planTactics`
computation (currently `if (!driftProceed) { planTactics = []; } else if
(mode === 'tactic') { ... }`), gate tactic mode on a genuine park instead:

```js
const tacticModeParked = mode === 'tactic' && (drift.parks || []).length > 0;
let planTactics = [];
if (mode === 'tactic' ? tacticModeParked : !driftProceed) {
  planTactics = [];
} else if (mode === 'tactic') {
  ...
```

Apply the mirror-image fix to the `deviation` computation near the end of
the script (`const deviation = !driftProceed || parks.length > 0;`), so
`mode === 'tactic'` deviation depends only on `parks.length > 0`, not on
`driftProceed` — otherwise a successfully-authored tactic-mode plan still
reports `disposition: 'escalated'`.

This exact patch (applied only to this run's persisted script copy, not
committed) was verified to turn a false `escalated`/`body_markdown: null`
result into a correct `completed_with_fixes` result with a full authored
plan, on the same strategy/target_node input, for
`tactic-transition-node-stamp-landed-body`.

Also worth checking while fixing: whether `findings_surfaced`'s tactic-mode
term (`tactics.length`) and the `eligibility.decomposable` field are still
meaningful to report in tactic mode once this decouples, or should be
omitted/renamed to avoid a future reader misreading them as applying to the
single target node.

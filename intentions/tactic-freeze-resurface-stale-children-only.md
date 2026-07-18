---
id: tactic-freeze-resurface-stale-children-only
kind: tactic
statement: "Narrow the soft-freeze blast radius to stale-stamped children only:
  the selector's phase suppression and align-tactics re-surface follow the
  per-child staleness verdict, leaving fresh-stamped and null-stamped siblings
  on their normal phase"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-18 /align-strategy interview on the
  mis-dispatched /align-tactics re-evaluations (see the same-day
  selector-mis-dispatch clarification on strategy-graph-native-dispatch). The
  soft-freeze scan in selectGraphTargets adds every open child of a drifted
  strategy to frozenTacticIds — suppressing each child's normal phase and
  re-surfacing each as an align-tactics re-evaluation candidate — when only the
  stale-stamped children carry evidence of drift. With the materiality doctrine
  classifying children at edit time (tactic-materiality-scoped-freeze, PR
  #2892), the blanket sweep contradicts the classification the editing round
  just recorded, and it sweeps null-stamped children whose plans a sibling's
  staleness says nothing about: the 2026-07-18 mis-dispatch sent
  tactic-review-phase-trust-builtin-review (stamp null, plan untouched) to
  /align-tactics on a sibling's stale stamp. The author DIVERGED from the
  subtree-conservatism rival framing this round. Boosted to top ranking by
  author direction (2026-07-18)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 61
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18
    /align-strategy round): one of the two fix carriers for the selector
    mis-dispatch. Sized against the composed selector rank (childless, empty
    blocked_by: rank = boost + 5.33; then-max 66.00 on
    tactic-align-family-opus-default), so boost 61 gives 66.33 — top of the
    discretionary frontier. The boost flows nowhere else (no blocked_by, no
    children)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Narrow the soft-freeze blast radius to stale-stamped children only: the selector's phase suppression and align-tactics re-surface follow the per-child staleness verdict, leaving fresh-stamped and null-stamped siblings on their normal phase

## Retained interview context (2026-07-18)

Evidence trail for the mis-dispatch this draft fixes:

- Selection log (`~/.local/share/commons-dispatch/graph-selection.jsonl`) at
  2026-07-18T21:03:05Z: freeze event `stale strategy_fingerprint on
  tactic-graph-selector-reviewed-exclusion` for strategy-graph-native-dispatch;
  selected `tactic-review-phase-trust-builtin-review`. Routing log maps it to
  `phase: "align-tactics"`. The staling edit was e7d20df0 (20:57:42Z, the
  provenance-lint round, no classify-and-re-stamp); the dispatched node's own
  stamp was null and its plan untouched.

- Code loci (packages/intentionsutil/src/router.ts, selectGraphTargets): the
  soft-freeze scan adds ALL children of a strategy with >=1 stale-stamped open
  child to `frozenTacticIds` (`for (const t of children)
  frozenTacticIds.add(t.id)`); the normal tactic-candidate loop suppresses on
  `frozenTacticIds.has(t.id)`; the frozen-tactic loop re-surfaces the same set
  at the `align-tactics` rung with `reevaluation: true`.

## Scope sketch (for the finalizing align round)

Narrow both uses to the per-child staleness verdict: track the stale children
per freeze (the scan already computes `stale`) and suppress/re-surface only
those. Fresh-stamped children (classified orthogonal by the editing round under
tactic-materiality-scoped-freeze) and null-stamped children (never stamped;
null is not stale by doctrine) keep their normal phase. The freeze *event*
detail already names only the stale children — the candidate sets should match
it. Keep `frozenTacticSelectable` (the worker-start re-validation gate) in sync
with whatever set the selector uses. Refines the frozen-tactic-dispatch
re-surface clarification (tactic-graph-frozen-tactic-dispatch, clarification
52) and the subtree-freeze language of the soft-freeze clarification
(clarification 10); the author diverged from subtree-conservatism in the
2026-07-18 round that retained this draft.

---
id: tactic-round-stamp-quadratic-scan
kind: tactic
statement: Hoist reconcile-graph.ts's per-done-node round-stamp check (a
  nodes.filter + servingStrategyIds ancestor walk nested inside the done-set and
  serving-strategy loops) into a single precomputed strategy-id to live-children
  index, so the sweep's cost stops scaling with the ever-growing retained-done
  population
owner: ai
status: raw
parent: null
rationale: null
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
# Hoist reconcile-graph.ts's per-done-node round-stamp check (a nodes.filter + servingStrategyIds ancestor walk nested inside the done-set and serving-strategy loops) into a single precomputed strategy-id to live-children index, so the sweep's cost stops scaling with the ever-growing retained-done population

## Provenance

- **Source:** review-fix pass on PR #2965 (`tactic-execution-pr-merge-verification`), finding `deferred-filing` (cost lens, prescanned).
- **Location:** `packages/intentionsutil/scripts/reconcile-graph.ts:202`
- **Failure scenario:** The round-stamp check runs `nodes.filter(...)`, calling `servingStrategyIds` (an ancestor walk, `router.ts:131`) per node, nested inside the per-done-node loop and its per-serving-strategy loop — O(doneSet × strategies × nodes × parent-depth) per sweep. Previously done nodes were removed from disk each sweep, so `nodes` stayed roughly proportional to live work; with the prune removed (PR #2965, line 186), `nodes` now includes every historically-completed tactic forever, so the inner factor grows without bound while the sweep runs on every dispatch tick. The `n.phase !== "done"` predicate PR #2965 added correctly excludes retained done siblings from the *result*, but it does not reduce the *work* — the filter still visits and ancestor-walks each one.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — filed directly as an out-of-scope deferred finding (bucket `Deferred`, source `cost`); cost findings are advisory and always route to Deferred without a verify pass.
- **Recommended fix:** Hoist the traversal out of the loops: build a single strategy-id → live-children index once (one pass over `nodes`, one `servingStrategyIds` call per node, memoized) before Pass 3, then have the round-stamp check consult that map in O(1) per strategy instead of re-filtering all nodes per done-node.
- **Source PR:** #2965

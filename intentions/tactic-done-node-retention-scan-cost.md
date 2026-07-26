---
id: tactic-done-node-retention-scan-cost
kind: tactic
statement: Bound the cost of persisting done-transitioned tactic nodes on disk
  instead of pruning them, so the every-tick full-scan callers
  (reconcile-graph-merged enumeration, graph-select-target,
  dispatch-graph-census) don't degrade as the retained-done population grows
  without bound
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
# Bound the cost of persisting done-transitioned tactic nodes on disk instead of pruning them, so the every-tick full-scan callers (reconcile-graph-merged enumeration, graph-select-target, dispatch-graph-census) don't degrade as the retained-done population grows without bound

## Provenance

- **Source:** review-fix pass on PR #2965 (`tactic-execution-pr-merge-verification`), finding `deferred-filing` (cost lens, prescanned).
- **Location:** `packages/intentionsutil/scripts/reconcile-graph.ts:186`
- **Failure scenario:** PR #2965 removed the `rmSync` loop and the `prune` array from the done-transition (Pass 3), so every reconciled tactic now stays present at `phase: "done"` forever. The only existing census mechanism, `dispatch-graph-census`, does not prune — it counts done-but-present nodes as debt and, past a threshold of 10, births one born-parked tactic a human must drain by hand (`graph-census-debt.ts:160,201`). Net effect: the intentions node set (367 files at review time) grows monotonically, bounded only by manual drains. Every graph tool that full-scans that set — `listNodes` (`packages/intentionsutil/src/store.ts:128`, a `readdir` + YAML-parse of every node file with no limit or predicate pushdown) — is called on each dispatch tick by `reconcile-graph-merged`'s own enumeration step, by `graph-select-target`, and by `dispatch-graph-census`. Cost is CPU/IO and tick latency (no Firestore reads in this diff), but growth is unbounded by construction.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — filed directly as an out-of-scope deferred finding (bucket `Deferred`, source `cost`); cost findings are advisory and always route to Deferred without a verify pass.
- **Recommended fix:** Close the deletion loop before the retained-done population grows further: either (a) land the census/cleanup prune as a scripted, autonomous pass (this is `tactic-census-scripted-tick`'s job — this tactic should sequence behind it, not duplicate it), or (b) keep done nodes on disk but move them out of the hot scan path — an archive subdirectory, or a `listOpenNodes(dir)` that filters on a cheap signal before `readNode`/YAML-parse — so per-tick callers scan only the live set.
- **Source PR:** #2965

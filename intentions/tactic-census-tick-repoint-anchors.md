---
id: tactic-census-tick-repoint-anchors
kind: tactic
statement: "Repoint tactic-census-scripted-tick's Reuse/Scope anchors
  (inboundBlockers, the rmSync delete-last loop, the edit-vs-prune guard, the
  batch-aware prune hazard comment) which PR #2965 removed from
  reconcile-graph.ts, so the sibling's plan stays clean-session-executable"
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
# Repoint tactic-census-scripted-tick's Reuse/Scope anchors (inboundBlockers, the rmSync delete-last loop, the edit-vs-prune guard, the batch-aware prune hazard comment) which PR #2965 removed from reconcile-graph.ts, so the sibling's plan stays clean-session-executable

## Provenance

- **Source:** review-fix pass on PR #2965 (`tactic-execution-pr-merge-verification`), finding `deferred-filing` (code-review lane residue, prescanned).
- **Location:** `intentions/tactic-census-scripted-tick.md` (citing removed `reconcile-graph.ts` line ranges)
- **Failure scenario:** PR #2965 removed the edge-repair block, the `rmSync` delete-last loop, and the edit-vs-prune guard from `packages/intentionsutil/scripts/reconcile-graph.ts`. `intentions/tactic-census-scripted-tick.md` cites those exact line ranges as its Reuse/Scope anchors: `reconcile-graph.ts:136-144` (edge repair), `reconcile-graph.ts:172-176` (rmSync delete-last), `reconcile-graph.ts:180` (edit-vs-prune defensive guard), `reconcile-graph.ts:128-183` / `128-176` (batch-aware skip hazard comment). Every one of those now points at removed code, so the sibling's plan is no longer clean-session-executable from its own text (a `.claude/rules/planning.md` requirement).
- **Adversarial verdict:** not independently verified by an adversarial skeptic — filed directly as an out-of-scope deferred finding (bucket `Deferred`, source `code-review`); this is a body-repoint task, not a code fix.
- **Recommended fix:** Repoint the anchors at surviving sources — `inboundBlockers` → `packages/intentionsutil/src/transitions.ts:271-273` (unchanged, still exported); the batch-aware prune / edge-repair / delete-last pattern → the merge-base commit `ee234a197d58b80e48122cb4c193559927eed90a` version of `reconcile-graph.ts` (cite the sha explicitly so a clean session can `git show` it), or the equivalent pattern in the `dispatch-graph-census` wrapper. This is a node-body edit; land it through `graph-commit`, not a code PR.
- **Source PR:** #2965

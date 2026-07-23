---
id: tactic-census-scripted-tick
kind: tactic
statement: "Implement census as a scripted dispatch-tick step:
  verify-merged-only prune with scripted edge repair and one batched
  graph-commit; surface verification failures as an integrity-defect count;
  retire dispatch-graph-census latch birth"
owner: ai
status: raw
parent: null
rationale: "Carrier for the census greenfield recorded 2026-07-23 on
  strategy-graph-native-dispatch (clarification: scripted tick step, no AI
  session). The 2026-07-11 census latch sat 12 days undrained because birthing
  the latch was all the tooling did."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the top-3 systemic
    gaps (PR custody, scripted census, playwright retry) rank ahead of the
    low-urgency tracked gaps once finalized."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Implement census as a scripted dispatch-tick step: verify-merged-only prune with scripted edge repair and one batched graph-commit; surface verification failures as an integrity-defect count; retire dispatch-graph-census latch birth

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

Carrier for the census-greenfield clarification on strategy-graph-native-dispatch (2026-07-23). Design, verbatim intent:
- Every dispatch tick: enumerate done-but-present nodes (`graph-census-debt.ts` already computes `donePresent`); prune ONLY nodes whose completion verifies mechanically — recorded `execution.pr` with `mergedAt` set, or a recorded graph-commit sha; scripted edge repair (strip pruned ids from live `blocked_by` — the 2026-07-23 census's `prune-batch.mts` is a working prototype); one batched `graph-commit --prune`.
- Verification failures (falsely-done, unrecorded pr) are LEFT IN PLACE and surfaced as an integrity-defect count → ordinary selectable defect tactics. Never a park, never mid-tick AI.
- Doctrine-home check eliminated by construction: kind-tactic's authoring-time layer-placement gate keeps durable content out of tactic bodies; git history is the backstop for pruned bodies.
- Retire `dispatch-graph-census`'s threshold-birth latch once the tick step is live; continuous cheap drain never accumulates debt.

Dependencies: tactic-office-hours-pr-custody (execution.pr custody), tactic-execution-pr-merge-verification (completion-sha recording closes the closed-unmerged-PR hole).

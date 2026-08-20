---
id: tactic-rsi-audit-workflow-attribution
kind: tactic
statement: Move per-workflow token attribution and the spend-deviation review
  trigger into /rsi-audit, so the fitness function's denominator survives the
  render's deletion
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round, from the coverage audit of what the
  retired /rsi did that neither successor does. The audit reports spend per
  SKILL and never folds it into the dispatch / office-hours / rsi / other
  workflows the fitness function is actually stated in. The fold and its
  deviation check already exist as working code whose only caller is being
  deleted.
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: strategy-recursive-self-improvement
  pr: 3074
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T03:26:48Z
    mergeCommitSha: c3c229f0de63db09df7dc01ce02177f3d1b56c95
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Move per-workflow token attribution and the spend-deviation review trigger into /rsi-audit, so the fitness function's denominator survives the render's deletion

Recorded by the 2026-08-12 `/align` collapse round. One of three capabilities
the retired `/rsi` had that neither successor did.

## Scope

Fold `aggregate-usage.sh`'s existing per-skill `by_phase` spend into the four
workflow buckets — dispatch, office-hours, rsi, other — and report each as a
share, plus the deviation flag.

The logic is already written and tested: `WORKFLOW_SKILLS` and
`attributeSpend` at `packages/intentionsutil/src/rsi.ts:340-423`, and the
dominance check inside `renderSpend` at `rsi.ts:838-853`. Move it; do not
re-derive it. Its two current callers are `render-rsi-plan.ts:246` (being
deleted) and `read-sensors.ts:1395` (`readWorkflowSpend`, part of the rsi
sensor reading, which `tactic-rsi-plan-render-retire` rewrites).

Decide explicitly where it lands: a lens inside the jq program, or a step in
`SKILL.md` that calls the TypeScript. The jq program is the instrument and the
skill is its report — putting a fold in the skill keeps the instrument
language-pure, but leaves the figure unavailable to any other reader.

## The recorded expectation this measures

`strategy-recursive-self-improvement`'s fitness clarification: dispatch is
expected to significantly outpace office-hours and rsi, and a deviation — either
approaching dispatch — is **itself a review trigger**, not a datum to note and
pass. Report it as a trigger.

## Bound

This restores the fitness function's DENOMINATOR only. The numerator — closure
velocity and strategy-signal progress — has no carrier after this round and is
recorded as a known loss on the parent strategy. Do not present spend shares as
if they measured value delivered.

## Dependencies

Land before or with `tactic-rsi-plan-render-retire`, which deletes the file
this code currently lives in.

## Verification

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

```verify
npm test --prefix packages/intentionsutil
```

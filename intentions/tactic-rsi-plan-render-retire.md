---
id: tactic-rsi-plan-render-retire
kind: tactic
statement: Delete rsi-plan.md, render-rsi-plan.ts and the render half of rsi.ts;
  prune the moot rsi-plan nodes after de-referencing them; and rewrite this
  strategy's success_signal in lockstep with RSI_SENSOR_NAME
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round. The author retired rsi-plan.md and
  the parallel execution plan, which falsifies strategy-rsi-plan-surface, three
  of its tactics, and roughly two thirds of packages/intentionsutil/src/rsi.ts.
  The success_signal rewrite is bundled here rather than done in the /align
  round because the sensor field is a registry key copied verbatim into
  read-sensors.ts, and moving one without the other de-registers the sensor.
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Delete rsi-plan.md, render-rsi-plan.ts and the render half of rsi.ts; prune the moot rsi-plan nodes after de-referencing them; and rewrite this strategy's success_signal in lockstep with RSI_SENSOR_NAME

Recorded by the 2026-08-12 `/align` collapse round. This is the demolition unit.

## Scope

**Delete.** `rsi-plan.md`;
`packages/intentionsutil/scripts/render-rsi-plan.ts`; the rendering half of
`packages/intentionsutil/src/rsi.ts` (`renderTaskPlan`, the section
renderers, `deriveGap`, the flag machinery) and its cases in
`packages/intentionsutil/test/rsi.test.ts`; `npm run` entries that call the
render.

**Preserve — do not delete with the rest.** `WORKFLOW_SKILLS` and
`attributeSpend` (`rsi.ts:340-423`) and the spend-deviation check
(`rsi.ts:838-853`) are being MOVED, not retired — see
`tactic-rsi-audit-workflow-attribution`. Land that unit first, or lift the code
into it as part of this one; do not delete it and re-derive it later.

**Rewrite the signal, in lockstep.** `strategy-recursive-self-improvement`'s
`success_signal` names rsi-plan.md's metrics section, `render-rsi-plan.ts`,
the pause resume criteria, and shortcut implementation — all four retired. Its
`sensor` string is copied character-for-character into `RSI_SENSOR_NAME`
(`packages/intentionsutil/scripts/read-sensors.ts:1307`) and IS the sensor
registry key. **Change both in the same commit.** Changing the node alone
de-registers the sensor, which then keeps its last reading forever so nothing
appears broken — this has already happened twice on this graph (`47219a1a`,
`56039748`); see `tactic-eval-finding-sensor-registry-key-prose-drift`. The
replacement signal must be readable from surviving instruments only: the finding
ledger and `aggregate-usage.sh`. `readRsiReading`'s pause and
critical-path segments go with the conditions that required them.

**Prune, after de-referencing.** `strategy-rsi-plan-surface`,
`tactic-rsi-plan-merged-priority-table`, `tactic-rsi-plan-priority-render`,
`tactic-rsi-plan-render-pause-block`, `tactic-rsi-direct-push-condition-reconcile`
(its reason is retired), and `tactic-rsi-evaluate-skill` (never built, judgment
retired). Six other nodes reference these in prose — `kind-kind`,
`strategy-attention-surface`, `strategy-rsi-delegated-prioritization`,
`tactic-attention-namespaced-rank`, `tactic-priority-provenance-schema`,
`tactic-rsi-reprioritization-outcome-audit` — and `validate-graph`'s
prose-reference check fails if the files vanish first. De-reference, then
`graph-commit --prune`.

**Do not touch** `strategy-rsi-delegated-prioritization` beyond
de-referencing. Its status is an open question recorded on the parent, not this
unit's call.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual and required: run `read-sensors.ts` and confirm the unregistered-sensor
count does NOT rise. That count — not the readings count — is the live
registry-membership test; a de-registered sensor keeps its stale reading, so the
readings figure cannot detect this failure.

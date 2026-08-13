---
id: tactic-rsi-audit-parked-survey
kind: tactic
statement: Give /rsi-audit a standing parked-population survey lens — what is
  parked, what each park blocks, and which sit on the critical path
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round. rsi-plan §3 surveyed the parked
  queue and parsed the rank-lift notes to say which park inherited rank from
  which blocked source; the per-phase evaluator sees a park only where its own
  ladder tripped over one. At the last reading 156 nodes were parked with 21
  blocking, so the population is not small enough to leave unsurveyed.
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
# Give /rsi-audit a standing parked-population survey lens — what is parked, what each park blocks, and which sit on the critical path

Recorded by the 2026-08-12 `/align` collapse round. One of three capabilities
the retired `/rsi` had that neither successor did.

## Scope

Add a lens to `.claude/skills/rsi-audit/SKILL.md`, tagged **fleet-only** (it is
a population survey; at n=1 it is a category error), that reports the standing
parked population and what it blocks.

Use the canonical view — `npx tsx
packages/intentionsutil/scripts/office-hours-select.ts --list`. **Never
hand-roll a park probe.** The rank-lift `NOTE` parsing that says which park
inherited rank from which blocked source lived in `rsi.ts:651-741` alongside
`countBlockedByParked`; lift it rather than re-deriving it, and do so before
`tactic-rsi-plan-render-retire` deletes that file.

## Bound — this measures, it does not judge

The author retired the judgment step in this same round. The lens reports the
population, the blocking counts and the rank-lift chains. It does not decide
which park is worth clearing, does not rank them against each other, and does
not route anything to office-hours. "Ambiguities in author intention, e.g.
parked office-hours nodes on the critical path" is one of this strategy's four
recorded evaluation-scope categories, and this lens is now its only mechanical
carrier — a measuring one. Say so in the lens text so a later reader does not
mistake a count for a triage.

## Verification

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

Manual: run the lens against the live store and check the blocking count against
`office-hours-select.ts --list` by hand once.

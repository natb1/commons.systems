---
id: tactic-signal-path-attention
kind: tactic
statement: "resolveAttention: derived signal-path factor — backlog and off-path
  nodes resolve one rank tier lower"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Strategy clarification 9 (2026-07-03 interview): deferrals become
  backlog tactics — recorded, planned, selectable, demoted. The demotion lives
  in calculated attention so every consumer (router, frontier views) sees the
  same effective rank, and it derives at read time so it self-corrects when
  signals validate. Added to round 1 by the re-evaluation: the router being
  built must implement the recorded attention semantics before it goes live."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by:
    - tactic-graph-dispatch-schema
---
# resolveAttention: derived signal-path factor — backlog and off-path nodes resolve one rank tier lower

## Context

Strategy clarification 9 on `strategy-graph-native-dispatch`: deferrals are
recorded as backlog tactics — planned, selectable, demoted — instead of
omitted. The demotion is part of *calculated* attention: `resolveAttention`
composes the authored `boost`/`override` with a derived signal-path factor.
The on/off-path input is stamped at decomposition (`backlog: true` on
off-path tactics; round tactics and strategies with unvalidated signals are
on-path); the demotion derives at read time so it self-corrects when
signals validate. `tactic-align-skill` is the first backlog tactic.

## Unit 1 — signal-path factor in resolveAttention

**Recommended model:** opus

Scope:
- `packages/intentionsutil/src/attention.ts:63` (`resolveAttention`): after
  the authored rank resolves, apply the derived factor — a node resolves
  one rank tier lower when it is not on any unvalidated-signal path:
  - a **tactic** is off-path iff `backlog: true` (squatted under
    `attributes` until `tactic-graph-dispatch-schema` promotes it), or its
    serving strategy's signal is validated (gap null and reading non-null);
  - a **strategy** is off-path iff its own `success_signal` is validated
    or absent;
  - virtues and delegations are outside the goal layer — unchanged.
- Demotion composes with, never overrides, authored attention: an authored
  `override` still pins; a `boost` still lifts relative to peers at the
  same derived tier.
- `packages/intentionsutil/scripts/rank-map.ts:24` consumes
  `resolveAttention` — the router and frontier views inherit the factor
  with no changes of their own.
- Tests in `packages/intentionsutil/test/`: backlog tactic ranks below an
  otherwise-identical round tactic; demotion lifts when the signal
  invalidates again; authored override unaffected.

## Dependencies

- `tactic-graph-dispatch-schema` — the first-class `backlog` field (interim:
  read it from `attributes` so the factor works before promotion).

## Reuse

- `resolveAttention`'s existing rank arithmetic and `ResolvedAttention`
  shape — the factor is one more term, not a new resolver.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: `npx tsx packages/intentionsutil/scripts/rank-map.ts` over the live
store — `tactic-align-skill` resolves one tier below its round siblings.

## Implementation notes

Single unit; subagent with `model: opus`; constrain to working-tree edits.

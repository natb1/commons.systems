---
id: tactic-attention-tier-ranking
kind: tactic
statement: "Implement the three-tier ranking floor: bug_fix/security/tier marks
  resolve to an outer tier in resolveAttention, the selector sorts by (tier,
  rank), blocking lifts the lexicographic (tier, rank) pair, and
  strategy-main-health migrates from boost 100 to tier 3"
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-18 /align-strategy tier-model round on
  strategy-graph-drives-dispatch (author-dictated). Carries the implementation
  scope, the must-land-first main-health migration, and the borderline marking
  worklist the round deferred.
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
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
# Implement the three-tier ranking floor: bug_fix/security/tier marks resolve to an outer tier in resolveAttention, the selector sorts by (tier, rank), blocking lifts the lexicographic (tier, rank) pair, and strategy-main-health migrates from boost 100 to tier 3

## Context (retained from the 2026-07-18 interview — see the strategy's 2026-07-18 clarifications for the doctrine)

The author-dictated tier model: ranking = (tier, rank) with tier outermost.
Tier 1 default; tier 2 = `attributes.bug_fix: true` / `attributes.security:
true` or explicit `attributes.tier: 2`; tier 3 = production/main issues via
explicit `attributes.tier: 3`. Own tier = max(semantic-implied, explicit, 1);
effective tier additionally inherits downward along parent/serves, max-based.
Blocking lifts a blocker's effective precedence to the lexicographic max
(tier, rank) of the nodes it blocks — recursive, max-based, never additive.

## Implementation scope

- `packages/intentionsutil/src/attention.ts` — resolve effective tier per node
  (marks + explicit lift + downward max inheritance along parent/serves);
  expose it on `ResolvedAttention` (e.g. `tier` alongside `value`), keeping
  per-term explainability.
- `packages/intentionsutil/src/router.ts` — selection sort becomes tier desc,
  rank desc, progression ordinal desc, id asc; blocking precedence lift
  operates on the (tier, rank) pair. NOTE: `attention.ts` still carries the
  superseded backward `blocked_by` additive flow (2026-07-07 design,
  superseded 2026-07-13) — this tactic absorbs draft
  tactic-attention-blocking-orthogonal: drop the backward flow from the
  authored term and implement the max-based (tier, rank) precedence lift in
  the selector.
- `packages/intentionsutil/scripts/validate-graph.ts` — shape checks:
  `attributes.bug_fix`/`attributes.security` boolean when present;
  `attributes.tier` in {2, 3} when present.
- **Must-land-first migration (same change):** flip `strategy-main-health`
  from `attention.boost: 100` to `attributes.tier: 3` (boost null), and amend
  the >=100 write-path-guard clarification on strategy-graph-native-dispatch
  (2026-07-13) to guard the tier field instead. Red-main auto-created fix
  tactics inherit tier 3 through the downward flow; do not remove the boost
  before the tier code is live in the selector path.
- frontier-view — render the tier alongside the composed rank.

## Borderline marking worklist (author call deferred at the 2026-07-18 round)

bug_fix candidates: tactic-fix-interrupt-orthogonal-state (phase-clobber
remedy via remodel), tactic-phase-boot-offload-launcher (dropped-merge
propagation half is a defect), tactic-noncodegen-session-model-defaults
(qa-main routing-gap fix bundled with defaults),
tactic-reconcile-graph-mainqa-guard-prune (cleanup + stale comments).
security candidates: tactic-audit-routing-advisory-gate (agent-control
safety), tactic-mainqa-deploy-auth-diagnostics (secret-leak observation).

## Verification sketch

- Unit tests over resolveAttention/selection: a tier-2 marked node with rank 0
  outranks every unmarked node regardless of boost; tier 3 outranks tier 2;
  boost still orders within a tier; a tier-1 blocker of a tier-3 node is
  selected with tier-3 precedence; inheritance lifts a marked strategy's
  subtree; nothing compounds (max, not sum).
- After the main-health flip: red-main fix tactics still outrank all tier-1/2
  work in the selector's ordered candidate list.

## Per-tier boost namespace (added 2026-07-21, author-directed)

This tactic's scope grows: boost is not a single tier-orthogonal scalar but a
**per-tier boost namespace**. A boost value is meaningful only within the tier
it was chosen for — different tiers can be on entirely different boost scales,
so a value chosen mid-way in tier 1 could wrongly dominate tier 2 if carried in.
Changing a node's tier therefore does not carry its boost: the target tier's
boost is absent until a fresh value is selected. This is a mechanical guarantee
(the `Attention` interface in `packages/intentionsutil/src/schema.ts` and the
`validate-graph` shape check), not a scripting convention. See the three
2026-07-21 clarifications on `strategy-graph-drives-dispatch` (the boost-to-top
operation, the per-tier namespace, and tier-change as a distinct operation).

Exact storage shape (a map keyed by tier vs a tier-tagged value) is a design
choice for this tactic's finalization. **Open consideration:** how a per-tier
boost composes with the recorded downward flow of authored boosts along
`parent`/`serves` (the 2026-07-07 / 2026-07-13 flow clarifications). The
attention-write tooling that consumes this namespace is drafted separately in
`tactic-attention-boost-scripts`.

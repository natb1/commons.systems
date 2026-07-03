---
id: tactic-calculated-attention
kind: tactic
statement: "resolveAttention: calculated attention as a weighted sum of derived
  terms — authored, signal satisfaction, capture resolution"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Strategy clarification 11 (2026-07-03, superseding the banding
  mechanism of clarification 9): calculated attention is an extensible weighted
  sum of read-time-derived terms — explicit author attention (override pins),
  signal satisfaction (structural on-path via validates edges), capture
  resolution (from recovers-edge delegation axes) — with new conditions added as
  terms, never bands. Replaces tactic-signal-path-attention. On the signal path:
  the router being built must implement the recorded attention semantics before
  legacy removal's coverage check can pass."
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
# resolveAttention: calculated attention as a weighted sum of derived terms — authored, signal satisfaction, capture resolution

## Context

Strategy clarification 11 on `strategy-graph-native-dispatch` (superseding
the banded mechanism of clarification 9): calculated attention is an
extensible **weighted sum of terms, each derived at read time** — no
discrete bands, no stored flags. Terms at introduction:

- **Authored** — an `override` pins the value absolutely; a `boost` is a
  weighted term that derived terms cannot silently overwhelm (weights
  chosen so a max boost dominates max derived contributions).
- **Signal satisfaction** — structural: the tactics that validate a signal
  (produce its reading, meet its threshold) carry a factual
  `validates: [strategy-id]` edge. A node is on-path iff it reaches a
  validates-terminal of an unvalidated signal via `blocked_by`/`parent`
  chains; on-path contributes, off-path contributes nothing. Self-updating:
  a new signal whose path includes a node lifts it with zero maintenance.
- **Capture resolution** — from the node's (or its serving strategy's)
  `recovers` edges: delegation records carry the divergence/irreversibility
  capture axes; attention proportional to capture the work unwinds.

New attention conditions add as terms with weights. Terms and weights live
in code (this module); weight changes are ordinary reviewed PRs.

## Unit 1 — term registry and weighted composition in resolveAttention

**Recommended model:** opus

Scope:
- `packages/intentionsutil/src/attention.ts:63` (`resolveAttention`):
  restructure the resolution into a term registry — each term a pure
  function `(node, graph) -> number` — composed as a weighted sum;
  authored `override` short-circuits. Keep `ResolvedAttention` as the
  output shape (rank consumers see a total order; expose the composed
  score and per-term contributions for explainability in frontier views).
- Signal-satisfaction term: reachability over `blocked_by` (squatted under
  `attributes` until `tactic-graph-dispatch-schema` promotes it) and
  `parent` edges to any tactic bearing a `validates` edge whose target
  strategy's signal is unvalidated (`gap` non-null or `reading` null); a
  strategy is its own validates-terminal while its signal is unvalidated.
- Capture-resolution term: walk `serves` to the strategy, its `recovers`
  to delegation records, read the capture axes from the delegation nodes'
  attributes; sum, normalized.
- `resolveAttention` is consumed through `src/goals.ts` (frontier views)
  and will be consumed by `graph-select-target` — consumers inherit the
  composition with no changes of their own. (The retired node↔issue
  rank-map bridge is not revived; ranks stay node-keyed.)
- Tests in `packages/intentionsutil/test/`: off-path node ranks below an
  otherwise-identical on-path node; adding a validates edge upstream lifts
  a node with no other change; authored override unaffected by any derived
  term; capture term orders two nodes by their delegations' axes; a new
  registered term changes composition without touching existing terms.

## Dependencies

- `tactic-graph-dispatch-schema` — first-class `validates` and
  `blocked_by` (interim: read both from `attributes` so the terms work
  before promotion).

## Reuse

- `resolveAttention`'s existing authored boost/override arithmetic — it
  becomes the authored term, not a separate path.
- `listNodes` for the graph snapshot the terms walk.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: `npx tsx packages/intentionsutil/scripts/frontier-view.ts` over the
live store — `tactic-align-skill` (no chain to a validates-terminal)
resolves below its on-path siblings, with no backlog flag anywhere in the
store.

## Implementation notes

Single unit; subagent with `model: opus`; constrain to working-tree edits.

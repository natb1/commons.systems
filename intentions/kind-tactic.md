---
id: kind-tactic
kind: kind
statement: Tactic — a completable unit of execution
owner: human
status: codified
parent: null
serves: []
rationale: >-
  Tactics are the bottom layer: concrete, completable work. A tactic is not
  always a leaf — it may be a subtree. An epic is a tactic whose children are
  tactics; `parent` mirrors the GitHub issue hierarchy for generated tactics.
  Tactics are also the delegable layer — delegating a tactic is expected and
  beneficial (it buys attention at the strategic level), and doing so creates
  or extends a delegation record (kind-delegation) where the attachment is
  assessed.


  Transience. A tactic is transient: when it completes it is removed from the
  graph, and its edges go with it. Completion is marked by the author or by the
  dispatch workflow — today by closing the backing GitHub issue (backfill
  prunes the node on its next run), in the future directly in the graph.


  Authority. The graph is the authoritative source of truth for all data;
  GitHub is an optional, derived projection. During the transition, execution
  state still syncs from GitHub — the gh-derived fields via backfill, and issue
  open/closed, linked PRs, and dispatch labels via `../trackers/`. A
  hand-authored tactic is the primary form a tactic takes before, or without, a
  GitHub projection.


  Sync. A tactic with `attributes.source` is gh-backed, and backfill
  (`npx tsx packages/intentionsutil/scripts/backfill.ts`) is a reconciler for
  it, not a regenerator. Backfill is strictly read-only toward GitHub. It syncs
  only the gh-derived fields — `statement`, `parent`, `rationale`, and
  `attributes.source` — and preserves every graph-owned field, notably `serves`
  and `attention`. It prunes gh-backed tactics whose issue closed, and never
  touches hand-authored tactics (those with no `attributes.source`).


  Edges. `parent` links a tactic to a larger tactic (mirroring the GitHub
  issue hierarchy for generated tactics). `serves` links a tactic to the
  strategies it advances; it is a graph-owned field that backfill preserves —
  populating `serves` is dialectic work, not derivable from GitHub state, so it
  is empty on a freshly generated tactic and untouched on reconcile.


  Authoring test. If fully achieving it would make you delete the node, it is a
  tactic; if achieving everything currently under it leaves a standing,
  condition-monitored posture, it is a strategy.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  goal_layer: true
  fields:
    - "source: sync source for generated tactics, e.g. github:natb1/commons.systems#2711; absent on hand-authored tactics"
    - "attention: authored boost (adds to inherited rank, relative) XOR override (sets the value flowing through this branch), plus required rationale; resolved rank is computed on read by resolveAttention and never stored"
---
# Tactic — a completable unit of execution

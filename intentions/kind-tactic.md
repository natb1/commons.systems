---
id: kind-tactic
kind: kind
statement: Tactic — a completable unit of execution
owner: human
status: codified
parent: null
serves: []
rationale: >-
  Tactics are the leaves: concrete, completable work. They are also the
  delegable layer — delegating a tactic is expected and beneficial (it buys
  attention at the strategic level), and doing so creates or extends a
  delegation record (kind-delegation) where the attachment is assessed.


  Sync. A tactic with `attributes.source` is GENERATED from that source and is
  regenerated — not hand-edited — by the backfill script:
  `npx tsx packages/intentionsutil/scripts/backfill.ts`. Backfill is strictly
  read-only toward GitHub, regenerates only `tactic-*.md` files, and prunes
  tactics whose source disappeared. Hand-authored tactics have no `source`.
  Execution state (issue open/closed, linked PRs, dispatch labels) lives in
  `../trackers/`, never here: the graph owns intention, GitHub owns execution.


  Edges. `parent` links a tactic to a larger tactic (mirroring the GitHub
  issue hierarchy for generated tactics). `serves` links a tactic to the
  strategies it advances; populating `serves` on generated tactics is
  dialectic work, not derivable from GitHub state, so backfill leaves it
  empty.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  fields:
    - "source: sync source for generated tactics, e.g. github:natb1/commons.systems#2711; absent on hand-authored tactics"
---
# Tactic — a completable unit of execution

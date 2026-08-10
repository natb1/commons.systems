---
id: tactic-dispatch-explicit-critical-path-walk
kind: tactic
statement: make dispatch <node-id> substitute the highest-precedence
  dispatchable node on the critical path to the named node, announcing the
  substitution, instead of refusing with node-not-selectable
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-29 /align-strategy interview confirming
  dispatch <node-id> semantics (strategy clarification 132). Today
  graph-select-target --node <id> filters candidates to exactly that id, so a
  blocked tactic or a strategy with open on-path children yields
  node-not-selectable and dispatch-tick exits 1 — the human's named target is
  refused with no onward path. The author adopted substitution over refusal,
  diverging from the keep-it-literal steelman with the cost accepted explicitly.
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
# make dispatch <node-id> substitute the highest-precedence dispatchable node on the critical path to the named node, announcing the substitution, instead of refusing with node-not-selectable

## Context

`dispatch <node-id>` (the nix wrapper → `.claude/skills/dispatch-propagate/scripts/dispatch-tick <id>` →
`dispatch-select-tick <id>` → `graph-select-target --node <id>`) today considers ONLY the named id:
the candidate stream is filtered with `select(.id == $target)` in `graph-select-target`'s final `jq`.
Eligibility is computed upstream by `selectGraphTargets` (`packages/intentionsutil/src/router.ts`),
which drops a tactic whose `blocked_by` is incomplete (`blockersComplete`) and a strategy with open
on-path children. So naming a blocked node, or a parent, returns `empty` from the selector,
`node-not-selectable <id>` from `dispatch-select-tick`, and exit 1 from `dispatch-tick`.

Strategy clarification 132 (2026-07-29) changes the disposition on a non-dispatchable target from
REFUSE to SUBSTITUTE-AND-ANNOUNCE.

## Scope

- Compute the walk closure: the recursive union of the named node's `blocked_by` and its children
  (nodes naming it as `parent`, and — for a strategy — nodes naming it in `serves`).
- Keep only closure members that pass every existing gate verbatim: `office_hours` null, freeze,
  the claimed set (reservation ledger + `worktree_has_live_session`), and `sensor_gate`. This stays
  a target substitution, never a gate bypass.
- Pick the highest surviving member by the SAME lexicographic (tier, rank) precedence the rank lane
  uses. Reuse the selector's own ordering — do NOT introduce a walk-specific order. The named node
  itself, when dispatchable, always wins (it is a closure member at distance 0).
- Print the substitution and its reason on stderr before launching: which node was named, which was
  substituted, and why the named one was not dispatchable.
- Refuse (today's `node-not-selectable`) only when the whole closure is undispatchable, and say how
  many closure members were considered.
- Sovereignty inheritance: the substituted node carries the bypasses the named target would have had
  — the pace-curve override and the exactly-one-node `max_concurrent_workers` bypass. Do not
  re-derive these on the substituted node's own merits.
- Update `graph-select-target`'s `--node` header contract, which currently reads "a selection-order
  override, not a gate bypass" — substitution is a third category and the header must say so.

Out of scope: any change to the rank lane, to `--manual`, or to the autonomous path; any change to
how precedence itself is computed.

## Reuse

- `blockersComplete` and `selectGraphTargets` — `packages/intentionsutil/src/router.ts`
- the resolved (tier, rank) precedence the selector sorts on — same module
- `reservation_exists` / `worktree_has_live_session` — `lib-reservation-ledger.sh`,
  `lib-claude-agents.sh`
- `sensor_gate` — `.claude/skills/dispatch-propagate/scripts/graph-select-target`

## Verification

`.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` and the existing
`tactic-graph-select-target-node-tests` suite are the natural homes for closure/precedence/announce
cases. Manual: name a known-blocked node and confirm the blocker is dispatched with the substitution
announced; name a dispatchable node and confirm it is dispatched unchanged.

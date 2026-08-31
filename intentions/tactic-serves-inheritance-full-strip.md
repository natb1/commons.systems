---
id: tactic-serves-inheritance-full-strip
kind: tactic
statement: strip redundant serves entries graph-wide per the extended
  inheritance rule — partial parent-overlaps at the strategy layer and
  parent-duplicated strategy entries at the tactic layer — and state the rule on
  kind-tactic
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 emulated /align-audit run: 26
  strategies re-declare at least one virtue their parent already carries, 17
  reading-chunk tactics re-declare strategy-philosophical-grounding from parent
  tactic-tradition-reading-program, and 14 dispatch tactics re-declare
  strategy-graph-native-dispatch from parent tactic-graph-native-dispatch. The
  author ratified extending kind-strategy's serves-inheritance rule to partial
  overlaps and to the tactic layer (strategy-graph-integrity clarification, same
  date). Finalized and planned by the 2026-07-11 /align-tactics round:
  tactic-graph-self-consistency-sweep is phase done (its Unit 4 seven full sets
  are handled), so this tactic re-derives the residual list at execution from
  the digest's DUP-SERVES table (blocked_by tactic-graph-digest-tooling) and the
  two never double-edit. Off the minimum signal path; calculated attention
  demotes it."
reading: null
gap: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-serves-inheritance-full-strip
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: ba2a6baf40da43d7217194977f7ecd4dbba424a343251236340d524b05479917
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# strip redundant serves entries graph-wide per the extended inheritance rule — partial parent-overlaps at the strategy layer and parent-duplicated strategy entries at the tactic layer — and state the rule on kind-tactic

One PR (state-only `intentions/**` edits; lands via the graph fast path).
Off the minimum signal path — no `validates` chain reaches this node, so
calculated attention demotes it below the round's instrument work.
`blocked_by` tactic-graph-digest-tooling: the strip list is re-derived at
execution from the digest's DUP-SERVES table, so this tactic and the
completed tactic-graph-self-consistency-sweep Unit 4 (phase done — its seven
full duplicate sets are already handled) never double-edit. Planned
2026-07-11 /align-tactics round.

## Context

kind-strategy's sub-strategy inheritance clarification
(intentions/kind-strategy.md:48) records that a child re-declaring its
parent's virtue set adds no rank information — attention flows down parent
and serves alike (`resolveAttention`,
packages/intentionsutil/src/attention.ts:285) — while doubling review
surface. The 2026-07-09 emulated audit found the redundancy far wider than
the seven full sets the consistency sweep stripped: 26 strategies re-declare
at least one parent virtue; 17 reading-chunk tactics re-declare
strategy-philosophical-grounding from parent
tactic-tradition-reading-program; 14 dispatch tactics re-declare
strategy-graph-native-dispatch from parent tactic-graph-native-dispatch. The
author ratified extending the rule to partial overlaps and to the tactic
layer (strategy-graph-integrity clarification 'Does the serves-inheritance
rule extend to partial overlaps and to the tactic layer?', 2026-07-09).

## Unit 1 — state the rule on kind-tactic

**Recommended model:** sonnet

**Scope:** add one clarification entry to `intentions/kind-tactic.md`
mirroring kind-strategy's sub-strategy inheritance clarification
(intentions/kind-strategy.md:48) for tactic subtrees: a child tactic authors
`serves` only for a strategy claim beyond its parent's; re-declared entries
add no rank information (attention flows down parent and serves alike). Write
via write-node.ts — read the node with `readNode`, append the clarification
in memory, re-write the full node JSON (the body is preserved). The answer
ends with the dated provenance sentence convention, citing the 2026-07-09
author ratification on strategy-graph-integrity.

**Out of scope:** any other kind-tactic doctrine change.

## Unit 2 — strip the redundant entries

**Recommended model:** sonnet

**Scope:** re-derive the redundancy list at execution time:
`node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only`,
DUP-SERVES table. For each listed node, remove ONLY the `serves` entries
duplicated in its direct parent's `serves` — a node carrying additional
non-parent claims keeps them. Done-present nodes already pruned by then drop
out of the list naturally. Apply every edit via write-node.ts (full node
JSON; bodies are preserved). Land Unit 1 + Unit 2 in ONE graph-commit, with a
dump-node.ts `--base` manifest covering every edited pre-existing node.

**Out of scope:** changing `resolveAttention`; the delegation kind's
intentionally-loose `serves`; pruning done-present nodes (owned by the
census/owed-prune scope, not this strip).

## Reuse

- DUP-SERVES table — packages/intentionsutil/scripts/graph-digest.ts (landed
  by tactic-graph-digest-tooling)
- packages/intentionsutil/scripts/write-node.ts,
  packages/intentionsutil/scripts/dump-node.ts,
  packages/intentionsutil/scripts/graph-commit
- `readNode` — packages/intentionsutil/src/store.ts:110

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual: re-run the digest's DUP-SERVES table after the strip — it must be
empty; spot-check that a node with mixed `serves` (parent-duplicated plus a
genuine extra claim) kept the extra claim; confirm kind-tactic carries the
new clarification.

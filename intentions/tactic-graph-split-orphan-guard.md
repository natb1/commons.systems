---
id: tactic-graph-split-orphan-guard
kind: tactic
statement: "Prevent an align-skill node split from orphaning its new sibling on
  main: (a) the align skills must land a split-parent edit and its new sibling
  in one graph-commit call, never parent-first; and (b) validate-graph must flag
  prose-level dangling node-id references so main cannot go CI-green with an
  incomplete split"
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-18 /align-strategy near-miss review. A
  re-plan split tactic-align-tactics-mechanical-floor's Unit 1 into a new
  born-parked sibling (tactic-align-provenance-lint-doctrine). The parent edit
  landed on main first (single-file commit c037cec7); the separate sibling-add
  graph-commit then lost the push race 5x and deleted its scratch branch
  (nothing landed), leaving main with the parent describing a split to a sibling
  that did not exist. Recovered same-day (032768e5) — no data lost, graph valid.
  Two latent hazards remain: (a) nothing enforces landing a split-parent + its
  new sibling in ONE graph-commit call (graph-commit IS atomic within a call, so
  bundling is the fix; landing the parent first is the trap); (b) the dangling
  reference was prose-only (clarification/rationale/body), and validate-graph
  checks structural edges only, so main stayed CI-green with an incomplete
  split. Recorded 2026-07-18 /align-strategy round."
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
# Prevent an align-skill node split from orphaning its new sibling on main

**Draft** — byproduct of the 2026-07-18 `/align-strategy` near-miss review;
input to a later `/align-tactics strategy-graph-native-dispatch` round.

## Context

A `/align-tactics` re-plan split `tactic-align-tactics-mechanical-floor`'s
Unit 1 into a new born-parked sibling,
`tactic-align-provenance-lint-doctrine`. The two nodes reached `origin/main`
via **separate** `graph-commit` operations rather than one atomic call:

- the parent edit landed first as a single-file commit `c037cec7`;
- the separate sibling-add `graph-commit` then lost the push race five times
  against a busy `main`, deleted its throwaway `graph/**` scratch branch, and
  exited 1 (nothing landed — the documented "busy main" outcome).

The result: `main` carried the parent describing a split to a sibling node
whose file did not exist. Recovered the same day (`032768e5` added the missing
sibling). **No data was lost and the graph stayed valid** — but two latent
hazards produced the near-miss and remain.

## Hazard (a) — split-atomicity is unenforced

`graph-commit` is atomic *within a single call*: it bundles every node's file
into one commit, stamps checks on that one SHA via the scratch branch, and
fast-forwards that exact SHA onto `main` — all-or-nothing. So the correct
fix is to land a split-parent edit **and** its new sibling in **one**
`graph-commit` call (`graph-commit <parent> <new-sibling>`). Landing the
parent first, then the sibling in a second call, is the trap: if the second
call fails, `main` is left inconsistent. Nothing in the align skills or
`graph-commit` currently prevents the parent-first ordering.

Fix candidates:
- align-skill discipline: the `/align-tactics` and `/align-strategy` split /
  born-parked-sibling paths must bundle parent + new sibling into one
  `graph-commit` call, and say so explicitly;
- optional guard: a pre-flight check that refuses to land a node whose
  prose/edges introduce a reference to a sibling id that is neither already
  on `origin/main` nor included in the same commit.

## Hazard (b) — validate-graph misses prose-level dangling refs

The dangling reference was **prose-only**: the parent named the sibling in its
`clarifications`, `rationale`, and body, but not in any structural edge
(`blocked_by: []`, `parent: null`, `validates: []`, sibling absent from
`serves`/`recovers`). `validate-graph` checks structural referential integrity
only, so it passed at `c037cec7` — meaning **`main` went CI-green with an
incomplete split**. A validate-graph pass over prose node-id mentions
(e.g. any `tactic-*`/`strategy-*`/`virtue-*`-shaped token in a body or
clarification answer that resolves to no node file) would have caught it —
scoped to avoid false positives on legitimately-deleted-node references in
historical prose.

## Placement notes

- Sibling in kind to the draft `tactic-prune-conflict-recovery-silent-loss`
  (another graph-commit-recovery integrity finding retained as a small
  standalone draft). Likely a small standalone tactic, or a two-unit tactic
  (one unit per hazard).
- Hazard (b) touches `validate-graph`/graph-content consistency, whose audit
  home is `strategy-graph-integrity`; at `/align-tactics` placement time its
  unit may re-home there while hazard (a) stays under
  `strategy-graph-native-dispatch`. Recorded here under the write-path owner
  per the 2026-07-18 author decision to keep it one node.

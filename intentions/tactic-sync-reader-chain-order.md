---
id: tactic-sync-reader-chain-order
kind: tactic
statement: Derive /sync-reader's reader sort order from the blocked_by chain and
  retire attributes.curriculum.priority integers on reading-chunk nodes
  (chain-derived order plus edge backfill)
owner: ai
status: raw
parent: null
rationale: "Greenfield direction from the author-ratified 2026-07-18
  boost-vs-numbering resolution on strategy-graph-review-curriculum: frontier
  items already run blocked_by sequence with attention urgency; the legacy
  integer numbering survives only because /sync-reader names reader files by the
  integer for stable device sort. Retained at the /align-strategy round as its
  tactical byproduct."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# Derive /sync-reader's reader sort order from the blocked_by chain and retire attributes.curriculum.priority integers on reading-chunk nodes (chain-derived order plus edge backfill)

Retained draft from the 2026-07-18 /align-strategy round on
`strategy-graph-review-curriculum` (boost-vs-numbering resolution,
author-ratified). Context for the later /align-tactics round:

- Current state: reading-chunk nodes carry
  `attributes.curriculum.priority` integers; /sync-reader names reader
  files by the integer so the e-reader device sort matches the working
  order. Frontier items (dialog nodes, future minted review items)
  already carry no integer: sequence = `blocked_by`, urgency = the
  attention system's backward compounding.
- Why not-yet was ruled for the legacy queue: a computed attention score
  in file names would rename in-progress files between syncs; and the
  2026-07-09 attention rationale on strategy-graph-review-curriculum
  keeps per-chunk curriculum entries unboosted.
- The migration: (1) change /sync-reader to derive sort order from the
  `blocked_by` chain over chunk nodes (topological order; the existing
  integer order is the seed), with file naming decoupled from any
  computed score so in-progress files stay stable across syncs;
  (2) backfill `blocked_by` edges on the chunk nodes encoding the
  working order (`tactic-tradition-reading-program`'s tables are the
  source); (3) retire `attributes.curriculum.priority` integers once
  (1) and (2) land.
- Constraint (stability requirement, from the ruling): device sort must
  not shuffle in-progress reading between syncs.

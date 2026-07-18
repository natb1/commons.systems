---
id: tactic-manual-dispatch-single-node-headroom
kind: tactic
statement: manual /dispatch guarantees one worker for the highest-ranking
  available node even at the max_concurrent_workers ceiling (bounded +1
  single-node override), respecting only token-exhaustion and the per-node claim
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-18: a human ran a bare /dispatch at a saturated
  fleet (8 live == max_concurrent_workers 8) expecting it to launch the
  highest-ranking node, and instead got 'router: manual fan-out: 8 live >=
  MAX_WORKERS 8; nothing spawned' / concurrency-cap. The #1458 manual fan-out
  treats the ceiling as an absolute hard cap, contradicting the
  human-dispatch-is-sovereign doctrine (strategy clarifications 49 and 76): a
  deliberate human dispatch must launch its one node even over the ceiling."
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
# manual /dispatch guarantees one worker for the highest-ranking available node even at the max_concurrent_workers ceiling (bounded +1 single-node override), respecting only token-exhaustion and the per-node claim

> Draft context retained by `/align-strategy` on 2026-07-18 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

A human ran a bare `/dispatch` at a saturated fleet and got
`router: manual fan-out: 8 live >= MAX_WORKERS 8; nothing spawned` →
`concurrency-cap`. The expectation (recorded as strategy clarification 76) is
that a deliberate human dispatch launches its one node — the highest-ranking
*available* node for the bare fan-out — even at the ceiling. The `#1458` manual
fan-out instead honors `max_concurrent_workers` as an absolute hard cap.

## Behavior change

Manual (`--manual`) dispatch computes a bounded **+1 single-node** override:

- **Floor of one, single node.** When there is no headroom under the ceiling
  (`HEADROOM == 0`) but tokens are *not* exhausted, spawn exactly **one** worker
  for the highest-ranking available node instead of emitting `concurrency-cap`.
  This takes live to `max_concurrent_workers + 1` — the deliberate, bounded
  overage clarification 76 authorizes.
- **Width still capped.** Below the ceiling, fan-out width is unchanged (fills
  `HEADROOM`); it never over-spawns wider than one node past the cap.
- **Hard floors stay hard.** Genuine token exhaustion (`--exhausted`) still
  emits `concurrency-cap` with no `+1` — the `EXHAUSTED` early-exit is kept. The
  per-node claim is still respected: the highest-*available* node is selected,
  never a preemption of a held node.

## Scope (`path:line` anchors, greenfield-verify at plan time)

- `dispatch-select-tick`, the `elif [[ -n "$MANUAL" ]]` block (#1458): today
  `if [[ "$EXHAUSTED" == exhausted ]] || (( HEADROOM == 0 ))` short-circuits to
  `concurrency-cap`. Split it: keep the `EXHAUSTED` branch as-is; drop the
  `HEADROOM == 0` short-circuit so control reaches the SPAWN_N computation.
  Then make the floor-of-1 win over the headroom clamp — effectively
  `SPAWN_N = max(1, min(max(GAP_BUDGET,1), HEADROOM))`, so `HEADROOM == 0` yields
  `SPAWN_N = 1` (one node over cap) while `HEADROOM >= 1` is unchanged. The
  `manual-no-headroom` decision-log path is replaced by a normal single-node
  spawn; only `manual-rate-limit-exhausted` remains a `concurrency-cap`
  disposition.
- Tests: `test-dispatch-scripts.sh` "select-tick --manual at-max-live
  (HEADROOM=0) → concurrency-cap" (~L22062) inverts to "→ spawns 1 (top
  available node)"; the "--manual exhausted → concurrency-cap, no reseed" case
  (~L22073) stays.

## Reuse / relationship

- Reuses `dispatch-materialize-spawn`'s existing `--gap N` rank-first machinery
  (the highest rank level is globally exhausted first) — `SPAWN_N=1` selects the
  single top-ranked available node.
- Sibling, not duplicate, of `tactic-graph-explicit-node-dispatch` (the
  `dispatch <node-id>` explicit-arg path). That path routes to the
  pace-independent `dispatch-graph-execute` and already launches its one named
  node without a ceiling check; this tactic brings the *bare fan-out* into the
  same single-node-guarantee doctrine. Keep the two consistent when either
  lands.

## Verification

- Manual `/dispatch` at `live == max_concurrent_workers` (not exhausted) launches
  exactly one worker for the top-ranked available node; a second immediate
  invocation launches one more (deliberate `max+2`).
- Manual `/dispatch` under `--exhausted` still emits `concurrency-cap`.
- Below the ceiling, fan-out width is unchanged.
- `test-dispatch-scripts.sh` passes with the inverted at-max-live case.

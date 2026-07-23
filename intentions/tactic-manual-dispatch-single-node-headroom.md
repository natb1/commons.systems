---
id: tactic-manual-dispatch-single-node-headroom
kind: tactic
statement: manual /dispatch guarantees one worker for the highest-ranking
  available node even at the max_concurrent_workers ceiling (bounded +1
  single-node override), respecting only token-exhaustion and the per-node claim
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-18: a human ran a bare /dispatch at a saturated
  fleet (8 live == max_concurrent_workers 8) expecting it to launch the
  highest-ranking node, and instead got 'router: manual fan-out: 8 live >=
  MAX_WORKERS 8; nothing spawned' / concurrency-cap. The manual fan-out in
  dispatch-select-tick treats the ceiling as an absolute hard cap, contradicting
  the human-dispatch-is-sovereign doctrine (strategy clarifications 49 and 76):
  a deliberate human dispatch must launch its one node even over the ceiling.
  Finalized 2026-07-22 via /align-tactics: plan verified against current
  dispatch-select-tick code (lines 638-706) and confirmed the draft's cited
  reuse target (dispatch-materialize-spawn) was deleted in
  tactic-dispatch-legacy-rewire Unit 3 -- corrected to graph-select-target --top
  N, the actual current rank-first fan-out machinery."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-manual-dispatch-single-node-headroom
  pr: 2944
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# manual /dispatch guarantees one worker for the highest-ranking available node even at the max_concurrent_workers ceiling (bounded +1 single-node override), respecting only token-exhaustion and the per-node claim

## Context

A human ran a bare `/dispatch` at a saturated fleet and got
`router: manual fan-out: 8 live >= MAX_WORKERS 8; nothing spawned` →
`concurrency-cap`. The expectation (recorded as strategy
`strategy-graph-native-dispatch` clarification 76, §Pace, Backlog & Attention)
is that a deliberate human dispatch launches its one node — the highest-ranking
*available* node for the bare fan-out — even at the ceiling. The `--manual`
fan-out in `dispatch-select-tick` instead honors `max_concurrent_workers` as an
absolute hard cap, amending clarifications 33 (the absolute ceiling) and 49
(single-node pace-curve bypass) to also cover exactly one node past that
ceiling.

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

## Unit 1 — bounded +1 single-node override in the manual fan-out

**Recommended model:** sonnet — a well-specified, mechanical conditional
restructuring with a clear diff shape in one script, plus an explicit
test-case inversion; no cross-cutting design judgment.

### Scope (`path:line` anchors current as of 2026-07-22, re-verify at implement time)

- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, the
  `elif [[ -n "$MANUAL" ]]` block (line 638 opens it). Today, lines 673-690:
  ```
  HEADROOM=$(( MAX_WORKERS - LIVE_COUNT ))
  (( HEADROOM < 0 )) && HEADROOM=0
  if [[ "$EXHAUSTED" == exhausted ]] || (( HEADROOM == 0 )); then
    release_lock
    DLOG_DISPOSITION="concurrency-cap"
    if [[ "$EXHAUSTED" == exhausted ]]; then
      DLOG_SKIP_REASON="manual-rate-limit-exhausted"
      echo "router: manual fan-out: rate-limit window exhausted; nothing spawned"
    else
      DLOG_SKIP_REASON="manual-no-headroom"
      echo "router: manual fan-out: $LIVE_COUNT live >= MAX_WORKERS $MAX_WORKERS; nothing spawned"
    fi
    echo "concurrency-cap"
    exit 0
  fi
  ```
  and lines 692-704 (the `SPAWN_N` computation, `N_PRIO` is always `0` today —
  the legacy priority-label bypass this formula once shared is gone):
  ```
  GAP_BUDGET=$(( TARGET_N - LIVE_COUNT ))
  (( GAP_BUDGET < 0 )) && GAP_BUDGET=0
  N_PRIO=0
  SPAWN_N=$N_PRIO
  (( GAP_BUDGET > SPAWN_N )) && SPAWN_N=$GAP_BUDGET
  (( SPAWN_N < 1 )) && SPAWN_N=1
  (( SPAWN_N > HEADROOM )) && SPAWN_N=$HEADROOM
  ```
  Change: split the exhaustion/headroom short-circuit so only genuine
  `EXHAUSTED` still early-exits to `concurrency-cap`
  (`DLOG_SKIP_REASON="manual-rate-limit-exhausted"`); drop the
  `HEADROOM == 0` short-circuit entirely so control always reaches the
  `SPAWN_N` computation. Then change the final clamp so the floor-of-1 wins
  over the headroom clamp instead of the headroom clamp always winning —
  effectively `SPAWN_N = max(1, min(max(GAP_BUDGET, 1), HEADROOM))` — so
  `HEADROOM == 0` now yields `SPAWN_N = 1` (one node over cap, i.e.
  `live == max_concurrent_workers + 1` after the launch) while `HEADROOM >= 1`
  is byte-for-byte unchanged (the clamp only differs from today's behavior in
  the `HEADROOM == 0` case). The `manual-no-headroom` decision-log skip-reason
  and its `echo "router: manual fan-out: ... nothing spawned"` /
  `echo "concurrency-cap"` lines are deleted outright — that path no longer
  exists; only `manual-rate-limit-exhausted` remains a `concurrency-cap`
  disposition from this block. Update the block comment above (lines 638-651,
  currently `SPAWN_N = min(HEADROOM, max(N_PRIO, GAP, 1))`) to state the new
  formula so the header stays accurate.
- Out of scope: the autonomous (no `--manual`) gate above this block (lines
  549-636) — unchanged; the `pace_exempt` mechanism — unchanged; anything in
  `dispatch-tick` or `dispatch-graph-execute` downstream of the decision line.

### Test anchors (line numbers drifted since this tactic was drafted on
2026-07-18 — re-`grep` at implement time rather than trusting these numbers)

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, "Case
  4: at-max-live" (currently ~L22326-22334): asserts
  `SEL_LIVE_COUNT=8 SEL_TARGET_N=1` → decision line `concurrency-cap`. Invert
  to assert the decision line is the graph fan-out with `--top 1` (mirroring
  the "Case 1: gap0" assertion shape just above it at ~L22300-22306), i.e. one
  worker spawned for the top-ranked available node, lock released, and (per
  the existing "no reseed" assertion, which stays) no reseed scheduled.
- "Case 5: exhausted" (currently ~L22338-22346): `SEL_EXHAUSTED=exhausted` →
  `concurrency-cap`, lock released, no reseed. Stays unchanged — this is the
  hard floor.

## Reuse / relationship

- **Corrected pointer** (found stale during this finalize pass): the draft
  cited reusing `dispatch-materialize-spawn`'s `--gap N` machinery, but that
  script was deleted entirely in `tactic-dispatch-legacy-rewire` Unit 3 (see
  `dispatch-select-tick` lines 17-21). The actual current rank-first fan-out
  machinery is `graph-select-target --top N`, invoked at
  `dispatch-select-tick:778` as `"$SCRIPT_DIR/graph-select-target" --top
  "$GAP"` where `GAP=$SPAWN_N` (line 706) in the manual branch. This unit reuses
  that existing call path unchanged — `SPAWN_N=1` simply flows through to
  `--top 1`, selecting the single top-ranked available node; no new selection
  logic is added.
- Sibling, not duplicate, of `tactic-graph-explicit-node-dispatch` (the
  `dispatch <node-id>` explicit-arg path, currently at `phase: review`). That
  path routes to the pace-independent `dispatch-graph-execute` and already
  launches its one named node without a ceiling check; this tactic brings the
  *bare fan-out* into the same single-node-guarantee doctrine. Keep the two
  consistent when either lands; neither supersedes the other.

## Verification

- Manual `/dispatch` at `live == max_concurrent_workers` (not exhausted)
  launches exactly one worker for the top-ranked available node; a second
  immediate invocation launches one more (deliberate `max+2`) since the
  human-launched worker enters the reservation ledger and the next tick's
  `LIVE_COUNT` reflects it (clarification 76's self-correcting property —
  no new mechanism needed for this, just confirm it holds).
- Manual `/dispatch` under `--exhausted` still emits `concurrency-cap`, no
  `+1`.
- Below the ceiling (`HEADROOM >= 1`), fan-out width and decision output are
  byte-for-byte unchanged from before this change.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

## needs-main residue

- id: 6
  title: Live production manual dispatch at a saturated fleet launches exactly
    one worker for the top-ranked node
  url_path: n/a
  expected_outcome: The operator's deliberate dispatch produces one real
    worker on the top node past the ceiling — the end-to-end behavior the
    tactic guarantees, observable only against a live saturated fleet with
    real graph-select-target ranking and worker registration.
  finding: "planned-deferral — the PR's Test Plan leaves this item unchecked;
    it depends on live production dispatch state (real saturation, real
    ranking, real spawn/claim) that cannot be asserted at merge time in this
    sandbox."

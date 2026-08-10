---
id: tactic-manual-path-reservation-sweep
kind: tactic
statement: reconcile the reservation ledger (reservation_sweep) in
  dispatch-select-tick's --manual fan-out block before reading
  reservation_count, so paused+manual dispatch never sees phantom live=N from
  dead-session orphans
owner: ai
status: codified
parent: null
rationale: Immediate parity fix (migration step i) for the 2026-07-23 cross-mode
  ledger-validity clarification on strategy-graph-native-dispatch. In the
  standing paused+manual operating mode the manual fan-out path is the ledger's
  only live consumer, and it deliberately skips reservation_sweep — so
  dead-session orphans accumulate unboundedly, inflating live=N and throttling
  or zeroing manual fan-out (the phantom-worker incident, 2026-07-23). Reverses
  the 'manual is safe, only pacing' aside in
  tactic-explicit-node-reservation-sweep-policy for the paused+manual mode it
  did not consider. Boosted top-of-normal + finalized this round per author
  direction.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 10
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: demoted from the pre-bootstrap 85-90
    band to 10. These are ordinary improvements, not integrity defects; at 85-90
    they outranked strategy-main-health (101 resolved) and flooded the selector
    hot band. Interim scaffolding only; tactic-attention-tier-ranking and
    tactic-attention-boost-scripts retire this numeric scheme."
  tier: 1
phase: review
execution:
  branch: tactic-manual-path-reservation-sweep
  pr: 2964
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# reconcile the reservation ledger before the --manual fan-out count

## Context

In `dispatch-select-tick`'s `--manual` fan-out block, `LIVE_COUNT = BUSY + RESV`
where `RESV=$(reservation_count)`. The block already sources
`lib-claude-agents.sh` and `lib-reservation-ledger.sh`, but deliberately does
**not** call `reservation_sweep` first — the comment reads: "the manual path does
NOT sweep the reservation ledger (a possibly-stale count can only make manual
fan-out more conservative, which is safe)."

That reasoning is false in the standing **paused + manual-only** operating mode.
While the pause sentinel (`$XDG_DATA_HOME/commons-dispatch/paused`) is set, the
autonomous heartbeat exits before selection and never sweeps (see sibling
`tactic-heartbeat-sweep-before-pause`), so the manual tick is the **only** live
consumer of the ledger. Dead-session orphan markers then accumulate unboundedly,
inflating `live=N` (phantom workers) and throttling — or zeroing — manual
fan-out. This is the phantom-worker incident diagnosed 2026-07-23
(`router: manual fan-out: SPAWN_N=1 ... live=10` with no live workers).

Per the 2026-07-23 cross-mode ledger-validity clarification on
`strategy-graph-native-dispatch` (the pause sentinel gates *spawning*, never
*bookkeeping*), the manual path must reconcile the ledger before reading it.
This reverses, for the paused+manual mode, the "manual need not sweep — only
pacing, never a hard refusal" aside recorded in
`tactic-explicit-node-reservation-sweep-policy` (PR #2952): that aside addressed
the explicit-node hard-refusal path and did not consider paused+manual reaper
dormancy. PR #2952's own NODE_ARG-branch deliverable is unaffected.

## Units of work

### Unit 1 — sweep before the manual count

**Recommended model:** sonnet — a one-line shell insertion mirroring an existing
sibling call; no architectural judgment.

**Scope:** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, the
`--manual` fan-out block (locate by the comment "the manual path does NOT sweep
the reservation ledger"). The block already `source`s `lib-claude-agents.sh`
and `lib-reservation-ledger.sh`. Immediately **before** `RESV=$(reservation_count)`,
add:

```bash
reservation_sweep 1>&2 || true
```

and update the adjacent comment to say the manual path now reconciles the ledger
first (cross-mode validity, `strategy-graph-native-dispatch` 2026-07-23), citing
the paused+manual dormancy reason. `|| true` keeps it best-effort — a sweep
failure must never fail the tick. This mirrors the autonomous block's own
best-effort `reservation_sweep 1>&2 || true` call.

**Out of scope:** the `NODE_ARG` explicit-node branch (owned by
`tactic-explicit-node-reservation-sweep-policy`, PR #2952) and the autonomous
branch (already sweeps).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

### Unit 2 — test coverage

**Recommended model:** sonnet — mechanical test addition following the existing
`rl_setup` stale-marker pattern and the `sel_tick` manual-fan-out group.

**Scope:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`,
the `sel_tick` manual-fan-out test group. Add a test that plants a stale
dead-session reservation marker (a `session=` absent from `sel_tick_setup`'s fake
`claude_agents_list_all`, with `DISPATCH_RESERVATION_NOW` past the 30s boot
grace), runs a `--manual` tick, and asserts: (a) the reported `RESV`/`live` count
excludes the stale marker (the sweep ran), and (b) the marker file under
`$DISPATCH_RESERVATION_DIR` is gone afterward (the reclaim happened).

**Reuse:** `reservation_write` / `reservation_exists` / `reservation_sweep`
(`lib-reservation-ledger.sh`); `sel_tick_setup`'s `DISPATCH_RESERVATION_DIR` +
fake-agents wiring, defined in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`; the
`rl_setup` group's dead-session-sweep test, now in
`.claude/skills/dispatch-propagate/scripts/test-lib-reservation-ledger.sh`, as
the reclaimable-marker reference.

**Dependencies:** Unit 1.

## needs-main residue

- **id:** 16
  **title:** Real-world confirmation that phantom `live=N` no longer inflates on the manual path
  **URL path:** current
  **Expected outcome:** `live=N` on manual ticks matches observed live workers over a multi-day window of live paused+manual-only operation; no recurrence of the `SPAWN_N=1 ... live=10` phantom-worker shape diagnosed 2026-07-23.
  **Finding:** Planned deferral — only observable over a multi-day window of live paused+manual-only operation, not assertable at merge time from the test harness (which can only plant a synthetic marker). Only repeated observation of the live router output confirms the incident class is fully closed.

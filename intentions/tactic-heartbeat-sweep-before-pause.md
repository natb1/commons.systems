---
id: tactic-heartbeat-sweep-before-pause
kind: tactic
statement: run reservation_sweep in dispatch-tick before the pause-sentinel
  short-circuit, so the timer-driven heartbeat reaps the reservation ledger even
  while scheduling is paused
owner: ai
status: codified
parent: null
rationale: "Pause-independent reaper (migration step ii) for the 2026-07-23
  cross-mode ledger-validity clarification. The autonomous reservation_sweep
  lives inside dispatch-select-tick, which the pause sentinel short-circuits
  before reaching; so in a long pause with no manual ticks (operating mode c)
  the ledger is never reaped until scheduling resumes. The sentinel gates
  spawning, never bookkeeping: the heartbeat must reap before honoring the
  pause. Boosted top-of-normal + finalized this round per author direction."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the
    reservation-ledger cross-mode-validity fix ranks at the top of normal
    (non-main-health) work — below the strategy-main-health emergency ceiling
    (boost 100), which the 2026-07-13 write-path guard keeps dominant. Own-boost
    90 composes below 100, tripping no guard, while topping the ~11-max normal
    field."
phase: qa
execution:
  branch: tactic-heartbeat-sweep-before-pause
  pr: 2966
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# reap the reservation ledger before honoring the pause sentinel

## Context

`dispatch-tick` honors the pause sentinel by exiting before it ever reaches
`dispatch-select-tick`:

```bash
if [[ -z "$MANUAL" && -e "$DISPATCH_PAUSE_FLAG" ]]; then
  echo "dispatch-tick: paused (sentinel present ...); no scheduling this tick"
  exit 0
fi
```

The autonomous `reservation_sweep` lives **inside** `dispatch-select-tick`, so a
paused heartbeat never reaps the ledger. In a long pause with no manual ticks
(operating mode (c) of the 2026-07-23 cross-mode ledger-validity clarification),
dead-session orphan markers accumulate until scheduling resumes.

Per that clarification, the pause sentinel gates worker *spawning*, never ledger
*bookkeeping*: the timer-driven heartbeat must reconcile the ledger **before**
honoring the pause. This is the pause-independent reaper (migration step ii); the
sibling `tactic-manual-path-reservation-sweep` covers the manual-read path
(mode (b)), and the autonomous selection path already sweeps (mode (a)).

## Units of work

### Unit 1 — sweep before the pause short-circuit

**Recommended model:** sonnet — a small, well-scoped shell insertion mirroring
the ledger-sweep call pattern used elsewhere in the dispatch scripts.

**Scope:** `.claude/skills/dispatch-propagate/scripts/dispatch-tick`, immediately
**before** the pause-sentinel check (the
`if [[ -z "$MANUAL" && -e "$DISPATCH_PAUSE_FLAG" ]]` block). On the autonomous
path (`-z "$MANUAL"`), `source` `lib-claude-agents.sh` and
`lib-reservation-ledger.sh` (guarding against a redundant re-source if already
sourced) and call:

```bash
reservation_sweep 1>&2 || true
```

so every timer-driven heartbeat reconciles the ledger, and then the pause check
runs and exits as before. `|| true` keeps it best-effort — a sweep failure must
never block or fail the tick. The sweep must be reached before the pause
branch's `exit 0`. The manual path does not need this call here (it reaches
`dispatch-select-tick`'s manual block, covered by the sibling tactic).

**Out of scope:** the manual path (sibling tactic); the gh-heavy, throttled
`dispatch-sweep` worktree-GC pass (a different concern — do not fold ledger
sweeping into it).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

### Unit 2 — test coverage

**Recommended model:** sonnet — extends the existing pause-sentinel test.

**Scope:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`,
the `dispatch-tick` pause test group (the existing "paused (sentinel present); no
scheduling" test). Extend it: with the sentinel set, plant a stale dead-session
reservation marker, run `dispatch-tick`, and assert (a) it still exits without
scheduling (pause honored) and (b) the stale marker is reaped.

**Reuse:** the existing pause-sentinel test scaffold; the `rl_setup` group's
stale-marker plant/assert pattern.

**Dependencies:** Unit 1.

## needs-main residue

### 8. Real timer-environment sweep effectiveness across live pause/resume cycles

- URL path: current
- Expected outcome: over real pause cycles the reservation ledger stays
  bounded (dead-session markers reclaimed) and no live worker's reservation
  is wrongly reclaimed.
- Finding: planned-deferral — effectiveness depends on the live
  systemd-timer environment's ability to read the Claude session registry
  (`claude agents --json`), which a scratch scaffold cannot reproduce;
  verify by observing reservation-ledger size and worker health over the
  next few live pause/resume cycles.

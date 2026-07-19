---
id: tactic-graph-router-live-worker-visibility
kind: tactic
statement: graph-select-target gains a self-contained --standalone mode (lock
  acquire, live-worker headroom check, reservation-ledger claim, lock release)
  so a manual/emulated tick invoking it directly is concurrency-safe against
  dispatch-select-tick, closing the double-dispatch race that let a manual tick
  and dispatch-claude-daemon select and dispatch the same node simultaneously
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-07: a manual emulated router tick and the live
  dispatch-claude-daemon selected and dispatched the SAME nodes simultaneously,
  leaving tactic-office-hours-graph-entry carrying phase:fix (from the manual
  tick's review->fix transition) AND a non-null office_hours park (from the
  daemon session's mechanical-conflict park) at once. Root cause confirmed by
  code read (2026-07-18): dispatch-select-tick already computes live-worker
  headroom (busy-worker count plus reservation-ledger count, versus MAX_WORKERS)
  and holds dispatch-acquire-lock across its call to graph-select-target and the
  resulting reservation_write claim (dispatch-select-tick Step 0 lock acquire
  through emit_graph_selection's reservation_write+release_lock) -- but
  graph-select-target itself performs NEITHER the lock acquisition NOR the
  headroom check when invoked directly. Any caller outside
  dispatch-select-tick's wrapper -- specifically an ad hoc manual/emulated-tick
  Workflow script hand-rolling its own worker_cap, the pattern the
  2026-07-05/06/07 emulation runs used -- gets zero concurrency protection: no
  lock serialization against the daemon, no shared live-worker count, and no
  reservation-ledger claim before selecting. The fix folds the SAME
  lock+headroom+claim cycle dispatch-select-tick already runs into
  graph-select-target itself, behind an opt-in --standalone flag, so it is
  additive to dispatch-select-tick's existing call site (unchanged, zero
  regression risk to the live daemon chain) and gives any manual/emulated tick
  launcher one safe entrypoint to call before building its Workflow node list."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-select-target gains a concurrency-safe --standalone mode so manual/emulated ticks never double-dispatch against the daemon

## Context

On 2026-07-07 a manual emulated router tick and the live `dispatch-claude-daemon`
selected and dispatched the same graph node simultaneously. The result was an
incoherent node state on `origin/main`: `tactic-office-hours-graph-entry` ended
up carrying `phase: fix` (written by the manual tick's review→fix transition)
*and* a non-null `office_hours` park (written by the daemon session's
mechanical-conflict park) at the same time.

Code investigation (2026-07-18) found the root cause precisely.
`dispatch-select-tick` — the daemon's selection entrypoint
(`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`) — is already
concurrency-safe on its own: it acquires the shared session-keyed
`dispatch-acquire-lock` in its Step 0 (line ~219), computes a live-worker
headroom (`BUSY=claude_agents_count_busy_workers`, `RESV=reservation_count`,
`LIVE_COUNT=BUSY+RESV`, `HEADROOM=MAX_WORKERS-LIVE_COUNT` clamped to ≥0, lines
~668-711), calls `graph-select-target --top "$GAP"` (line 787) still holding
that lock, and — inside `emit_graph_selection` (lines 179-211) — writes a
`reservation_write` claim for every selected id *before* calling
`release_lock`. This is a correct, atomic check-then-claim cycle.

The gap: `graph-select-target` itself
(`.claude/skills/dispatch-propagate/scripts/graph-select-target`) performs
**neither** the lock acquisition **nor** the live-worker headroom check when
invoked directly — it assumes a caller (`dispatch-select-tick`) already did
both, and only runs the pure eligibility selection plus its existing
claimed-set gate (reservation-ledger markers + live node-id sessions). Any
caller that invokes it outside `dispatch-select-tick`'s wrapper gets zero
concurrency protection: no lock serialization against the daemon and no
shared live-worker count. This is exactly what a manual/emulated-tick
Workflow script does — per the 2026-07-05/06/07 emulation runs, these are ad
hoc scripts (not persisted in the repo; the Workflow tool has no filesystem
access, so selection necessarily happens in an outer shell step before the
Workflow is spawned) that hand-roll their own `worker_cap` constant with no
lock and no shared live-worker read. Two independently-computed, unsynchronized
"how many workers are free" answers is exactly the race that produced the
2026-07-07 incident.

The fix: give `graph-select-target` a self-contained, opt-in `--standalone`
mode that folds in the same lock-acquire → headroom-check → select → claim →
lock-release cycle `dispatch-select-tick` already runs around it. This is
purely additive — `dispatch-select-tick`'s existing call site
(`graph-select-target --top "$GAP"`, no `--standalone`) is untouched, so there
is zero regression risk to the live daemon chain. A manual/emulated tick's
launch step calls `graph-select-target --standalone --top N` once, gets back a
concurrency-safe, already-claimed node list, and only then spawns the Workflow
fan-out over it.

## Unit 1 — `--standalone` mode in `graph-select-target`

**Recommended model:** opus (concurrency-sensitive design work: lock
acquire/release ordering, a claim-before-release invariant, and reuse of an
existing session-keyed re-entrant lock primitive — exactly the "tricky
concurrency / ordering" case the model-selection heuristic calls out for
opus).

**Scope:**

- File: `.claude/skills/dispatch-propagate/scripts/graph-select-target`.
- Add a new `--standalone` flag to the existing arg-parse loop (`graph-select-target:82-93`).
- When `--standalone` is set, before running the existing selection logic:
  1. Acquire the shared lock: `"$SCRIPT_DIR/dispatch-acquire-lock" --wait`
     (fail the invocation — print `empty` and exit 0, matching the existing
     "selector failure degrades to empty" convention `dispatch-select-tick`
     uses at its own call site — if this returns anything other than
     `acquired`).
  2. Compute live-worker headroom using **exactly** the same formula
     `dispatch-select-tick` already uses at lines ~668-681 (do not re-derive
     it): `BUSY=$(claude_agents_count_busy_workers)` (from
     `lib-claude-agents.sh`, already sourced by `graph-select-target`),
     `RESV=$(reservation_count)` (from `lib-reservation-ledger.sh`, already
     sourced), `LIVE_COUNT=$((BUSY+RESV))`,
     `MAX_WORKERS=$("$SCRIPT_DIR/dispatch-target-workers" --max)`,
     `EXHAUSTED=$("$SCRIPT_DIR/dispatch-target-workers" --exhausted)`,
     `HEADROOM=$((MAX_WORKERS-LIVE_COUNT))` clamped to ≥0. On
     `EXHAUSTED == exhausted` or `HEADROOM == 0`: release the lock, print
     `empty`, exit 0 (mirrors `dispatch-select-tick`'s `concurrency-cap`
     disposition at lines ~682-696 — no need to reproduce its logging, just the
     disposition).
  3. Clamp the effective `--top` value to `min(TOP, HEADROOM)` before running
     the existing selection.
- After the existing selection logic produces its selected node id(s) (the
  same code path `--standalone` shares with the non-standalone mode —
  no duplication of the eligibility/claimed-set logic itself), for each
  selected id call `reservation_write "$id" "$id" "${CLAUDE_CODE_SESSION_ID:-}"`
  (same call shape `dispatch-select-tick:208` uses) to claim it.
- Release the lock (`"$SCRIPT_DIR/dispatch-acquire-lock" --release`) after
  the claim writes complete, whether or not any nodes were selected.
- Keep the stdout protocol byte-for-byte identical (`node <id> <kind> <phase>`
  lines / `empty`) so existing callers and any future manual-tick launcher
  parse it the same way regardless of `--standalone`.
- Out of scope: any change to `dispatch-select-tick`'s own call site or its
  Step 0/Step 1 headroom computation — those stay exactly as they are today.
  Also out of scope: writing the manual-tick launcher script itself (this unit
  only adds the flag `graph-select-target` exposes); documenting/wiring a
  specific launcher is follow-up work outside this tactic's minimum scope.

**Dependencies:** none.

## Unit 2 — test coverage

**Recommended model:** sonnet (mechanical unit-test writing with explicit
cases, mirroring an existing fixture pattern almost verbatim).

**Scope:**

- File: `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.
- Reuse the existing `graph-select-target` fixture-harness pattern at
  `test-dispatch-scripts.sh:30436-30485` (copies `graph-select-target`,
  `lib.sh`, `lib-*.sh` into a fixture scripts dir; fakes `CLAUDE_AGENTS_CMD`
  and a fixture graph store read via `git archive`) — extend it with fixture
  stand-ins for `dispatch-acquire-lock` and `dispatch-target-workers` (both
  already faked elsewhere in this file for the `claude_agents_count_busy_workers`
  and `LIVE_COUNT`/`TARGET_N` tests at lines ~9441-9558 and ~21192,
  21243-21250 — reuse those existing fixture idioms rather than inventing new
  ones).
- Add cases:
  1. `--standalone` with headroom available: selection proceeds, the selected
     id gets a reservation-ledger marker, and the lock is released afterward
     (assert via the fixture's existing marker/lock-file inspection helpers).
  2. `--standalone` with `HEADROOM == 0` (fixture live-worker count at
     `MAX_WORKERS`): prints `empty`, writes no claim, releases the lock.
  3. `--standalone` with the lock already held by a live foreign session
     (fixture a foreign `CLAUDE_CODE_SESSION_ID` recorded in the lock file
     with a live fixture session): the call blocks/degrades to `empty` rather
     than selecting — never double-claims.
  4. Non-`--standalone` invocation (today's default) is unchanged: no lock
     file touched, no reservation-ledger write from `graph-select-target`
     itself — a regression guard proving Unit 1 is additive.

**Dependencies:** Unit 1.

## Reuse

- `dispatch-acquire-lock --wait` / `--release`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-acquire-lock`) — the
  shared, session-keyed, safely re-entrant process lock. Verified re-entrant:
  `try_acquire`'s recorded-session-equals-self branch (`dispatch-acquire-lock:369`
  region) treats a same-session re-acquire as a no-op success, so calling it
  from `graph-select-target --standalone` is safe even in the hypothetical case
  of a future caller that already holds the lock.
- `claude_agents_count_busy_workers`, `lib-claude-agents.sh` (already sourced
  by `graph-select-target`, line ~70).
- `reservation_count`, `reservation_write`, `lib-reservation-ledger.sh`
  (already sourced by `graph-select-target`, line ~70).
- `dispatch-target-workers` / `dispatch-target-workers --max` /
  `dispatch-target-workers --exhausted`
  (`.claude/skills/dispatch-propagate/scripts/dispatch-target-workers`).
- The exact headroom arithmetic already implemented in
  `dispatch-select-tick:668-681` — copy it, do not re-derive independently.
- The existing `graph-select-target` fixture-harness pattern,
  `test-dispatch-scripts.sh:30436-30485`.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Manual/observational:

- Confirm `dispatch-select-tick`'s existing (non-`--standalone`) call to
  `graph-select-target` at line 787 is textually unchanged after this lands —
  Unit 1 must not touch that call site.
- After landing, a manual/emulated-tick session that wants a concurrency-safe
  node list runs `graph-select-target --standalone --top <N>` as its selection
  step instead of hand-rolling a `worker_cap`; this is a process change for
  future emulation runs, not something this tactic can verify mechanically —
  note it for the author at the next emulated tick.

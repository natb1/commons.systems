---
id: tactic-eval-finding-ladder-gate-stale-main-checkout-halt
kind: tactic
statement: dispatch-ladder halts exit-12 stalled on a phase that SUCCEEDED — the
  selector reads origin/main but provision-node-worktree re-validates against
  the main checkout working tree, which nothing on the advance path
  fast-forwards, so the transition the ladder just landed reads as a stale
  selection until the requeue budget runs out
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: stale_selection_refusals
      value: 6
      unit: refusals
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13T14:22:35Z-14:23:07Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: requeue_budget_exhaustion_s
      value: 32
      unit: seconds
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13T14:22:35Z-14:23:07Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: main_checkout_lag_commits
      value: 3
      unit: commits
      window: main checkout fbb9be83 vs origin/main db9e7f2c, 2026-08-13T14:23:07Z
      sensor: git
      measured: 2026-08-13
    - metric: halted_after_successful_phase_price_proxy_usd
      value: 78.39
      unit: usd
      window: tactic-attention-namespaced-rank qa phase attempt 4, 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## What was observed

`dispatch-ladder` halted a run with exit 12 (`stalled`) **40 seconds after the
phase it was driving succeeded**, because the worker-start selection gate reads
the main checkout's working tree while the selector reads `origin/main`.

Node `tactic-attention-namespaced-rank`, phase `qa`, run started
2026-08-13T14:05:13Z (unit `dispatch-ladder-tactic-attention-namespaced-rank`,
pid 1025134).

Sequence, from `.claude/worktrees/tactic-attention-namespaced-rank.ladder/events.jsonl`
and the unit's journald log:

- `14:22:27Z` `awaited` / `advanced` (`elapsed_s=1009 await_repolls=0 window_s=1800`).
  The qa worker's own `graph-commit` had landed `db9e7f2c` — `qa` → `review`,
  marker `qa-done` — on `origin/main` at `14:19:41Z`.
- `14:22:35Z` … `14:23:07Z`: six consecutive selection attempts, each logging
  `stale-selection: phase: selected review but node is now qa`,
  `requeue_budget` 4 → 0.
- `14:23:07Z` `halt` / `stalled`, exit 12; systemd records
  `Consumed 55.447s CPU time over 17min 53.578s wall clock`.

## The mechanism

The two halves of the selection round trip read different stores:

- `graph-select-target` (`.claude/skills/dispatch-propagate/scripts/graph-select-target:476`)
  snapshots `git archive origin/main intentions` into a temp dir — **fresh**, so
  it correctly emitted `review`.
- `provision-node-worktree:129-131` runs
  `check-node-selection.ts "$NODE_ID" "$SELECTED_PHASE" --dir "$PROJECT_ROOT/intentions"`
  — the **main checkout's working tree**. That tree was still at `fbb9be83`,
  three commits behind `origin/main`, where the node's `phase:` is `qa`. The gate
  therefore reported the transition backwards ("selected review but node is now
  qa") and refused with exit 12 on every attempt.

`dispatch-ladder-advance:155` does fetch `origin/main`, but a fetch only moves the
remote-tracking ref; nothing on the advance path fast-forwards the checkout. The
only `merge --ff-only origin/main` in the driver is inside the reconcile step
(`dispatch-ladder-run:795-802`), which sits behind the selection lock and is
never reached when advance keeps returning exit 10.

Reproduced read-only from the main checkout at 2026-08-13T14:4xZ, with the
checkout still at `fbb9be83`:

```
$ assert-node-selection tactic-attention-namespaced-rank review   # fetches origin/main itself
2a1976fcd8e77e0729ef066eecdd48298803c5706a11e0e0f9b9b6302b723294   # exit 0 — VALID
$ assert-node-selection tactic-attention-namespaced-rank qa
stale-selection: phase: selected qa but node is now review        # exit 12
```

i.e. against a fresh store the selection the ladder was refusing is the valid
one. The refusal is purely an artifact of which directory the gate reads.

## Why it matters

The failure mode is self-inflicted and phase-independent: the ladder's own worker
pushes a transition, and that push is precisely what makes the next selection
un-provisionable until something else fast-forwards the checkout. Nothing in the
driver does. A run therefore cannot follow a node across more than one graph
transition unless a `dispatch-select-tick` happens to sync the checkout in
between — the exact condition `/dispatch-ladder` exists to work without.

The halt is also *mislabelled*: exit 12 `stalled` reads as "the worker stopped and
nothing happened", when in fact the phase completed cleanly (`findings_surfaced 1`,
`followups_filed 1`, `disposition completed`, marker `qa-done` landed). A person
reading the halt is sent to diagnose a worker that did its job.

## Existing carrier

The root cause is already recorded as **`tactic-graph-execute-fresh-main-read`**
(status `codified`, found 2026-08-05 by the iteration-N+4 invariant audit): "the
node-selection gate must perform its own origin/main freshness read so every
caller inherits it — today check-node-selection.ts reads the main checkout's
working-tree intentions/ store whose freshness is maintained only by
dispatch-select-tick". That node frames the harm as a worker launched onto a node
parked on `origin/main`. This occurrence is a second, cheaper-to-observe harm from
the same defect — a healthy run halting on its own transition — and it lands in a
lane (`dispatch-ladder`) that did not exist when the node was written.

## What would have to change

Either fix direction (a) already recorded on `tactic-graph-execute-fresh-main-read`
(push the freshness read into `check-node-selection.ts` so every caller inherits
it, mirroring `tactic-office-hours-select-fresh-main`), or — narrower, and
ladder-local — have `dispatch-ladder-run` fast-forward the main checkout on the
advance path as well as the reconcile path, which the driver's own comment at
`dispatch-ladder-run:791-793` already flags as a deferred `sync_main_checkout`
helper across its three call sites.

This evaluator records the finding; it does not choose between them and does not
apply either.

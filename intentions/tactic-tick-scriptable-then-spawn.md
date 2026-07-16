---
id: tactic-tick-scriptable-then-spawn
kind: tactic
statement: "Two-phase tick: run all scriptable non-worker dispositions (incl.
  the scope-stale demote, moved ahead of selection) before the worker-group
  spawn, so metadata writes never consume the launch budget"
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-16 /align-strategy interview diagnosing a
  manual tick that scope-stale-demoted a node at launch and ended having
  launched 0 workers though SPAWN_N=1, headroom=5. Implements the
  scriptable-then-spawn contract clarification on
  strategy-graph-native-dispatch.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 6
  override: null
  rationale: "Author-directed 2026-07-16: the two-phase-tick fix (each tick
    performs all scriptable non-worker work, then spawns the worker group) is
    the current top-priority dispatch work — lift this node to the top of the
    ordinary queue (authored 11 = own 6 + inherited 5 from
    strategy-graph-native-dispatch), above every other tactic in the subtree and
    all other authored ranks (<=9), sequenced below strategy-main-health's
    guarded 100. Draft node: the boost carries to the selectable work
    /align-tactics later produces and ranks it first for that decomposition.
    /align-tactics deliberately NOT run this session (author-directed)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Two-phase tick: run all scriptable non-worker dispositions (incl. the scope-stale demote, moved ahead of selection) before the worker-group spawn, so metadata writes never consume the launch budget

## Context

A dispatch tick must finish by managing worker count. Today it does not when a
selected node resolves to a metadata-only disposition: the scope-staleness
demote runs at launch time (`dispatch-graph-execute`, provision exit 13, AFTER
`dispatch-select-tick` has already spent a SPAWN_N slot on that node), so the
tick can end having launched zero workers. Observed live 2026-07-16: a manual
tick with `SPAWN_N=1 (headroom=5, gap=0, live=3)` selected
`tactic-participation-log-instrument`, demoted it review→implement (scope
drift), and launched nothing.

The contract (recorded on `strategy-graph-native-dispatch`, scriptable-then-spawn
clarification): a tick runs two ordered phases — (1) ALL scriptable, non-worker
dispositions, then (2) one worker-group selection-and-spawn sized to the pace
target against phase-1 output. `SPAWN_N` counts workers actually LAUNCHED, never
selection slots a metadata write can spend.

## Scope

- **Move the scope-staleness comparison ahead of selection.** The
  `tacticScopeFingerprint`-vs-stamp comparison that currently lives in the
  launch-time start gate runs in the tick's pre-selection disposition sweep, so
  a scope-stale node is demoted to `implement` (via
  `packages/intentionsutil/scripts/demote-node-to-implement`) BEFORE `SPAWN_N`
  selection runs. Phase-2 selection then spawns the demoted node at `implement`
  (which never re-demotes — the loop terminates) or the next-ranked task.
- **Demote the launch-time start gate to a safety net.**
  `dispatch-graph-execute`'s exit-13 / `scope-stale <id>` path stays only for
  residual staleness introduced AFTER the sweep (a concurrent author/session
  edit between the sweep and launch); such a skip clears the claim and falls to
  next-tick re-selection (the existing worker-DEATH recovery path), not a
  routine under-fill.
- **Out of scope:** the pace-curve math, the global `max_concurrent_workers`
  cap, and the reservation-ledger claim discipline — all unchanged. Each phase-2
  spawn still enters the ledger under the selection lock; the tick's lifetime
  still ends at its FINAL spawn.

Anchors: `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`
(disposition sweep + `SPAWN_N` selection, lines ~683–750),
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` (start-gate
safety net, line ~57 `scope-stale <id>`),
`packages/intentionsutil/scripts/demote-node-to-implement`.

## Reuse

- `demote-node-to-implement` (the existing backward-transition primitive) —
  called from the sweep instead of only from the launch path.
- The reservation-ledger claim/liveness accounting in `dispatch-select-tick`
  and `dispatch-select-target` — selection stays the enforcement point.

## Verification

Reproduce the live case: a tactic whose scope changed after its `review` phase
(a stale scope-chain). Run a manual tick with headroom > 1. Confirm the tick
both (a) demotes the node review→implement AND (b) launches a worker — the
demoted node at `implement`, or the next-ranked task — rather than ending with 0
workers. Confirm a node with no eligible successor still terminates within
`HEADROOM` disposition rounds.

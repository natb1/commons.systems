---
id: tactic-graph-router-conflict-routing
kind: tactic
statement: "Router recognizes a CONFLICTING pending-merge PR and routes a
  conflict worker: the selector reads a new mergeable sensor and sets/routes an
  orthogonal execution.conflict interrupt (parity with execution.fix) —
  CONFLICTING dispatches dispatch-conflict, MERGEABLE clears, UNKNOWN waits;
  execution.conflict.attempt caps then parks; the tick keeps only the no-worker
  merge action"
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: Surfaced in the 2026-07-19 /align-strategy interview (strategy
  clarification 85) confirming the graph-native router has no seam to detect a
  CONFLICTING pending-merge work-PR and route a conflict worker — the legacy
  dispatch lane buckets CONFLICTING to /fix-conflicts, but read-sensors.ts has
  no mergeable sensor, PHASES has no conflict phase, and the selector's only
  interrupt is the CI-fix (clarification 66). Retained as a draft byproduct —
  /align-tactics decomposes and plans it, and wires blocked_by
  (tactic-pending-merge-phase, tactic-dispatch-conflict-greenfield) at
  finalization.
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
# Router-side detect-and-route for a conflicting pending-merge PR

Draft byproduct of the 2026-07-19 `/align-strategy` interview (strategy
clarification 85). Retained, not planned — `/align-tactics` decomposes and
sequences it. This is the **router-side detect-and-route** half of the
merge-conflict story; the resolution **worker** is
[[tactic-dispatch-conflict-greenfield]] and the wait phase it composes with is
[[tactic-pending-merge-phase]].

## Context — the gap

The legacy dispatch lane recognizes a work-PR's GitHub `mergeable==CONFLICTING`
and buckets it to `/fix-conflicts` (`lib.sh` maps `mergeable` to the
`MERGEABLE`/`CONFLICTING`/`UNKNOWN` enum that `dispatch-phase` string-compares).
The **graph-native** router has no equivalent:

- `read-sensors.ts` reads CI/test status and git status only — **no `mergeable`
  sensor**.
- `PHASES` (`schema.ts`) is `draft, align-tactics, implement, qa, review,
  main-qa, done` — **no conflict phase**, and none should be added (see below).
- The selector's only interrupt is the CI-fix (`fixInterrupt`,
  `transitions.ts` → `execution.fix`); merge state is read nowhere.

So a reviewed node-lane PR that goes `CONFLICTING` fails the tick's
`mergeable==MERGEABLE` auto-merge precondition (strategy clarification 64) and
sits **silently unmerged with no worker dispatched**. Observed live on
`tactic-align-skills-dataviz-guidance` (2026-07-19).

## Target behavior (author-confirmed this interview)

The merge-conflict interrupt is the structural twin of the CI-fix interrupt and
is modeled the same way — as **orthogonal execution state**, per strategy
clarification 66 / [[tactic-fix-interrupt-orthogonal-state]].

- **Encoding:** new nullable `execution.conflict = {since, attempt}`, mirroring
  `execution.fix`'s shape. `phase` stays ladder-positional (at `pending-merge`,
  or post-review arm-merge in the interim) across the interrupt. **No conflict
  value in the `PHASES` enum** — the clarification-66 precedent that pulled
  `fix` out of the enum applies verbatim (a phase value overloads ladder
  position with interrupt-active).
- **Routing authority = the selector** (parity with "the selector reads
  `execution.fix` directly"). The selector reads the PR `mergeable` sensor at
  selection and branches three ways:
  - `CONFLICTING` → set `execution.conflict`, dispatch the conflict worker
    (`dispatch-conflict`);
  - `MERGEABLE` → clear `execution.conflict`, let the tick's no-worker
    `graph-auto-merge` land it (clarification 64);
  - `UNKNOWN` → wait, retry next tick (parity with the pending-CI guard) — never
    dispatch on `UNKNOWN` (GitHub computes mergeability async; dispatching would
    thrash).
  The tick reconciler keeps **only** the no-worker merge action; it does not
  route.
- **Reaction, not prevention:** detect a conflict when it manifests and route
  reactively. Continuously rebasing pending-merge PRs to pre-empt conflicts is
  explicitly **out of scope** — a silent rebase changes the merged result and
  invalidates the passed review.
- **Spin guard:** `execution.conflict.attempt` caps the interrupt (parity with
  the fix-checks attempt cap and legacy `/fix-conflicts`' cap of 3); at the cap
  the node parks to `office_hours`.
- **Re-review after resolution** (materiality-scoped, tied to the worker's
  mechanical-vs-intention verdict — clarification 78): a purely **mechanical**
  resolution (dispatch-conflict layers 1–3, content-preserving) clears
  `execution.conflict` and returns to `pending-merge` to merge; a resolution
  needing model reconciliation or author input (layers 4–5, new substance)
  resets `phase → review` and disarms auto-merge (clarification-66 backward
  edge), because it introduced code the completed review never saw.

## Scope pointers (for /align-tactics to plan)

- **Schema:** add nullable `execution.conflict = {since, attempt}` to
  `schema.ts` (+ validator), additive.
- **Sensor:** add a `mergeable` read to `read-sensors.ts` (PR-scoped, like the
  existing CI verdict read) — the enum `MERGEABLE`/`CONFLICTING`/`UNKNOWN`.
- **Selector:** in the sensor gate that already reads CI and sets/clears
  `execution.fix`, add the three-way `mergeable` branch that sets/clears
  `execution.conflict` and routes `dispatch-conflict`.
- **Tick:** unchanged except that its `MERGEABLE`-gated merge now also requires
  `execution.conflict` clear.
- **Shell layer:** the `dispatch-conflict` skill invocation is
  [[tactic-dispatch-conflict-greenfield]]'s scope, not re-implemented here.

## Dependencies (for /align-tactics to wire at finalization)

Left off the raw draft's `blocked_by` per the draft-tactic convention (so a
prune of a dependency does not dangle an inbound edge). Compose with:

- [[tactic-pending-merge-phase]] — supplies the `pending-merge` phase this keys
  off (the core seam can alternatively key off "post-review + armed merge" in
  the interim, so this is a compose-with, not a hard block).
- [[tactic-dispatch-conflict-greenfield]] — the resolution worker this routes
  to; its mechanical-vs-intention partition (clarification 78) supplies the
  re-review verdict.


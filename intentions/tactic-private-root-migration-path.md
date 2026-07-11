---
id: tactic-private-root-migration-path
kind: tactic
statement: Document the private-root inversion — the author's private graph
  mounts this public graph, which keeps only intentions justifying the data
  structure, dispatch harness, and office-hours surface
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 by /align-tactics round 1 (consumes the
  retained draft of the same id): documentation-only design deliverable — the
  migration path to the private-root inversion, a design the author approves,
  not the migration itself. Off the round's minimum signal path (no validates
  edge — calculated attention demotes it; recorded fully rather than deferred by
  omission). Gated on tactic-mount-schema so the by-reference wiring is
  documented against the real mount shape."
reading: null
gap: null
serves:
  - strategy-graph-mounts
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-private-root-migration-path
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 04aa02adec88a3145460aa90242ca47578f633087667aba014c921593e28d1b3
validates: []
blocked_by:
  - tactic-mount-schema
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Document the private-root inversion — the author's private graph mounts this public graph, which keeps only intentions justifying the data structure, dispatch harness, and office-hours surface

## Context

strategy-graph-mounts' privacy clarification fixes the target state: the
author keeps a private graph of personal intentions, and the mount relation
inverts — this public graph becomes a mount ON that private root, the first
real by-reference mount and the reason mount structure never assumes
same-repo residence. Until that inversion lands, person-mounts in the public
graph stay role-named with household consent where a person is identifiable.
The deliverable here is the **documented migration path** — a design the
author approves — not the migration itself. Off the round's minimum signal
path (no `validates` edge; calculated attention demotes it), recorded fully
rather than deferred by omission. Blocked_by tactic-mount-schema so the
by-reference wiring is documented against the real `mount`/`grafts` shape.

## Unit 1 — design document

**Recommended model:** opus

Scope:
- New `packages/intentionsutil/PRIVATE-ROOT.md`, alongside `SCHEMA.md` and
  `SEPARABILITY.md`. Per `.claude/rules/design-proposals.md`: lead with the
  greenfield target, then the incremental brownfield migration steps.
  It must cover the four questions the retained draft fixed:
  - **Which nodes migrate private and which stay** — staying: the intentions
    needed to justify the intention-graph data structure, the dispatch
    harness, and the office-hours project; migrating: everything
    person-specific (family, client/employer, personal duties). Propose the
    partition rule, not an exhaustive per-node census.
  - **How the by-reference mount is wired** — private store location, the
    read path for the office-hours surface
    (`office-hours/src/graph-source.ts` reads a directory handle today), and
    the `graph-commit` write path across two stores.
  - **How recursion and the graft relation traverse the public/private
    boundary** — using the `mount`/`grafts` shape from tactic-mount-schema.
  - **What the dispatch router may and may not read from the private root.**
- Document also names the interim discipline the inversion retires
  (role-named person-mounts plus household consent,
  strategy-household-shared-attachments).
- Documentation only: no code changes, no node migrations, no schema edits.

## Reuse

- The `mount`/`grafts` field design and by-reference-readiness notes from
  tactic-mount-schema (`packages/intentionsutil/SCHEMA.md` "Mounts" section).
- `packages/intentionsutil/SEPARABILITY.md` as the format precedent for a
  design doc in this package.

## Verification

Manual/judgment: the document answers all four questions above, leads with
the greenfield target, and sequences incremental steps; author approval is a
later office-hours review of the doc (the deliverable is a proposal). No
auto-runnable checks — documentation-only change.

## Implementation notes

One unit, one PR; run it in a subagent with the Recommended model; supply
this Context and the Scope; constrain the subagent to working-tree edits
only.

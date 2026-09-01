---
id: tactic-graph-function-docs
kind: tactic
statement: Document the graph's dual-map / model-of-the-good function doctrine
  at the entry points — kind-kind rationale and intentions/README.md
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-08 graph-function interview: the function
  doctrine now lives in strategy-explicit-intent's clarifications, but the
  graph's entry points (kind-kind, intentions/README.md) describe structure only
  — a reader, fork practitioner, or worker session cannot discover what the
  graph is FOR from the entry point. kind-kind is durable human-owned doctrine,
  so the edit needs author approval at office-hours before landing;
  outward-facing copy stays under strategy-author-approved-copy and coordinates
  with tactic-readme-data-structure-first."
reading: null
serves:
  - strategy-explicit-intent
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-graph-function-docs
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint:
    strategy-explicit-intent:
      hash: 8b2fd4d29a97bab8f9fa9383e0219c4555ac758f99e14420cfd847a2472aed36
      sha: 7774333aa9132704024b29be44e1d1613ec21623
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-kind-doctrine-approval-gate
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Document the graph's dual-map / model-of-the-good function doctrine at the entry points — kind-kind rationale and intentions/README.md

## Context

The 2026-07-08/09 interviews recorded the graph's function doctrine on
strategy-explicit-intent: a dual map — of author intention (virtues applied
to present conditions generate strategies; strategies decompose to tactics)
and of author knowledge (status delegated vs codified, reading/gap,
tradition records, grounding marks on the same nodes) — and, taken whole,
the answerable record of the author's considered internal model of the good.
The graph's entry points describe structure only: `intentions/kind-kind.md`'s
rationale and `intentions/README.md` say nothing about what the graph is
FOR, so a reader, fork practitioner, or worker session cannot discover the
function from the entry point.

Blocked on tactic-kind-doctrine-approval-gate: kind-kind is durable
human-owned doctrine, so the author ratifies the wording below before this
tactic lands it (strategy condition: virtue and strategy substance stays
human-authored; agent assistance is drafting, not derivation).

## Draft copy (ratify or revise at tactic-kind-doctrine-approval-gate)

`intentions/kind-kind.md` rationale — append as a final paragraph:

> Function (doctrine home: strategy-explicit-intent's 2026-07-08/09
> clarifications — this node summarizes, never duplicates): the graph is a
> dual map — of author intention (virtues applied to present conditions
> generate strategies; strategies decompose to tactics) and of author
> knowledge (status, reading/gap, tradition records, grounding marks on the
> same nodes) — and, taken whole, the answerable record of the author's
> considered internal model of the good. It exists to keep the author
> aligned with that considered record, to keep delegatees from capturing
> the author, and to align delegatees with the good.

`intentions/README.md` — insert after the first sentence ("Every file here
is one node of a self-describing intention graph."):

> The graph is a dual map: of author intention (virtues generate strategies
> against present conditions; strategies decompose to executable tactics)
> and of author knowledge about each commitment (delegated vs codified,
> readings and gaps, tradition records). Taken whole, it is the author's
> externalized, answerable record of their considered model of the good —
> kept explicit here rather than tacit in code, chat, or memory (doctrine
> home: `strategy-explicit-intent.md`).

## Unit 1 — land the approved copy

**Recommended model:** sonnet

Scope:

- `intentions/kind-kind.md`: append the ratified function paragraph to the
  `rationale`. kind-kind is a graph node — rewrite via
  `packages/intentionsutil/scripts/write-node.ts` (read the node, append to
  the rationale string, pass the full node JSON through write-node), never
  hand-edit the YAML frontmatter. `writeNode` preserves the markdown body.
- `intentions/README.md` (11 lines): insert the ratified function sentences
  ahead of the structural pointer.
- Wording: check tactic-kind-doctrine-approval-gate's outcome (its clearing
  commit and any edits to this Draft copy section) before landing — the
  gate's ratified/revised wording wins over the draft above.

Out of scope: the root `README.md`
(tactic-readme-data-structure-first owns it, separately queued and
copy-gated — do not duplicate its framing work);
`packages/intentionsutil/SCHEMA.md`; any doctrine text beyond
summary-plus-pointer (the strategy node stays the doctrine's home).

## Reuse

- `packages/intentionsutil/scripts/write-node.ts` — the single validation
  gate for node writes.
- Doctrine text: `intentions/strategy-explicit-intent.md` rationale and its
  2026-07-08/09 clarifications.

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Prose: kind-kind's new paragraph cites strategy-explicit-intent as the
doctrine home and adds no claims absent from the recorded clarifications;
the README function sentences precede the structural pointer; the landed
wording matches the gate's ratified version.

## Implementation notes

Single unit; implement in a subagent launched with `model: sonnet`; supply
this Context, the ratified Draft copy, and the Scope in the subagent
prompt; constrain it to working-tree edits only.

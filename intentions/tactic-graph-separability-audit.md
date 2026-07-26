---
id: tactic-graph-separability-audit
kind: tactic
statement: "the intention graph's separability gaps are tracked as work, not just
  documented: SEPARABILITY.md's five gaps each become a decomposable tactic under
  strategy-data-structure-first, so the README's honest-direction copy points at
  real tracked work"
owner: ai
status: raw
parent: null
rationale: "Re-filed 2026-07-25 by author direction at an office-hours sitting.
  strategy-data-structure-first's 2026-07-07 clarification ('Is use it with your
  own project management and agentic workflows a current-capability claim?' —
  'Direction, stated honestly') names this node as the retainer of the
  separability audit, and tactic-readme-data-structure-first cites it twice as
  where the honesty caveat is tracked. But the node was absent from the graph:
  it was pruned by the 2026-07-11 census (it appears in
  tactic-graph-census-2026-07-11's lists), leaving both citations dangling and
  the 'gaps become draft tactics under this strategy' promise with no live
  tracker. The audit WORK PRODUCT does exist —
  packages/intentionsutil/SEPARABILITY.md documents five concrete gaps — so what
  is owed is not the audit but the decomposition of its findings into tracked
  work. This matters more after the same sitting: the author ratified the README
  subline's imperative phrasing ('Use it with your own project management and
  agentic workflows') over the honest-direction wording, which makes the claim
  lean harder on the gaps actually being tracked. Filed as a draft awaiting an
  /align-tactics round to decompose the five gaps."
reading: null
gap: null
serves:
  - strategy-data-structure-first
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
# The intention graph's separability gaps are tracked as work, not just documented

## Context

`strategy-data-structure-first` claims the intention graph is the product and
this repo is its reference implementation. The README copy the author approved
on 2026-07-25 tells readers to "use it with your own project management and
agentic workflows."

That claim is only honest if the gaps between it and reality are tracked as
work. The audit itself is done — `packages/intentionsutil/SEPARABILITY.md`
enumerates five gaps — but no graph node decomposes them, so the strategy's
recorded promise that "known separability gaps become draft tactics under this
strategy" is currently unfulfilled.

## The five documented gaps

From `packages/intentionsutil/SEPARABILITY.md`:

1. **Gap 1** (`:39`) — CLI wrapper scripts hardcode the
   `<repo-root>/intentions/` + `packages/intentionsutil/` layout.
2. **Gap 2** (`:80`) — the package is not consumable as a normal npm dependency.
3. **Gap 3** (`:111`) — `graph-commit` is tightly coupled to this repo's GitHub
   host, CI fast-path, and branch protection.
4. **Gap 4** (`:151`) — the align skill family assumes worktrees, dispatch state
   fields, and router semantics.
5. **Gap 5** (`:181`) — the schema carries harness-only fields, and `SCHEMA.md`
   documents neither them nor standalone use.

Gap 5 partially overlaps `tactic-schema-md-deprecation`, which is moving
`SCHEMA.md`'s content into the `intentions/kind-*.md` nodes and deleting it. A
decomposition round should check whether Gap 5 reduces to "document the
harness-only fields in the kind nodes" once that lands, rather than filing
duplicate work.

## What this node is for

Two things, neither of which is redoing the audit:

- **Keep the citations live.** `strategy-data-structure-first`'s 2026-07-07
  clarification and `tactic-readme-data-structure-first` (`:108`, `:184`) both
  name this node. With it absent those were dangling references to a promise
  with no tracker.
- **Decompose the five gaps into tracked tactics** under
  `strategy-data-structure-first`, sized per gap, so a reader who takes the
  README at its word can see which parts of standalone use are known-incomplete
  and being worked.

## Verification

```verify
test -f packages/intentionsutil/SEPARABILITY.md
```

Judgment, for the decomposition round:

- Each of the five gaps either has a tactic under
  `strategy-data-structure-first` or a recorded reason it needs none.
- No filed tactic duplicates `tactic-schema-md-deprecation`'s Unit 2 scope.
- The README's honest-direction claim can point at this node and find real
  tracked work behind it.

## Dependencies

None hard. Sequencing note: running the decomposition after
`tactic-schema-md-deprecation` lands avoids double-filing Gap 5.

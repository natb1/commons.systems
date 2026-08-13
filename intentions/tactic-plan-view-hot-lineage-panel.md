---
id: tactic-plan-view-hot-lineage-panel
kind: tactic
statement: Build the plan view's hot-lineage panel — each ancestor's score
  contribution across undecomposed and in-flight descendants, with a done/total
  progress readout, scoped to the active filter and scroll window
owner: ai
status: raw
parent: null
rationale: Recorded by the 2026-08-13 /align interview. Split from
  tactic-plan-view-table because it is a data-visualization artifact governed by
  the /dataviz procedure — it needs a validated palette, a legend, a table view
  and a selected dark mode — where the table proper is a data grid. It is also
  the layer that answers the author's stated purpose directly rather than by
  inference.
reading: null
serves:
  - strategy-attention-surface
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
# Build the plan view's hot-lineage panel — each ancestor's score contribution across undecomposed and in-flight descendants, with a done/total progress readout, scoped to the active filter and scroll window

## Draft context (2026-08-13 /align interview)

Authoritative contract: the hot-lineage clarification on
`strategy-attention-surface`. This body is the implementation decomposition.

### Why a panel exists at all

The author's purpose — *which parts of the graph dominate the focus of the
author and the delegatees* — is an **aggregate** question. The plan table's
spine columns and lane gutter let it be inferred; this panel answers it
directly. Without it the view shows where each row sits but never says which
lineage is hot.

### The measure: score contribution

Under the greenfield model `score_T(n) = boost_T(n) + Σ boost_T(a)` over every
**distinct** ancestor `a`. Because score is a deduplicated lineage sum, each
ancestor's contribution to a rank region is an **exact decomposition of the
ranking**, not a proxy for it. Report each ancestor's share of the window's
total score.

Row-count share was considered and **declined**: it scores a large unweighted
lineage and a small high-boost one as equally hot, which answers where the
volume is rather than what dominates. Volume is not focus.

### Two populations, and the gap between them

Each ancestor's heat renders **twice**:

- **undecomposed** — descendants at `phase: null`/`draft` awaiting an
  `/align-tactics` session (175 rows when measured 2026-08-13);
- **in-flight** — descendants with a phase set, being built (48 rows).

Plus a **done/total** progress readout, which discharges the *"track progress
in those areas"* half of the purpose.

The **gap is the signal**: heavy in undecomposed and light in in-flight means
a lineage is accumulating intent faster than it is being delivered; the
reverse means it is draining. Both populations are reachable work, which is
what makes this a pipeline reading rather than an artifact of what happens to
be parked.

Recorded provenance: this split is **Claude's proposal, not the author's
request**, accepted in interview on 2026-08-13 after being corrected once — an
earlier cut at scheduled-versus-unscheduled rested on the draft-selectability
error and was withdrawn.

Progress has a natural coherence worth preserving in the implementation: the
greenfield rule that a `done` node contributes nothing to any axis means heat
**decays as work lands**, so heat and progress are two readings of the same
motion.

### Scope

Recomputes over the **active filter and scroll window** — deliberately the
opposite of the ETA column, which is absolute and never recomputes. Both
halves of that asymmetry must be implemented and tested; it is intended, not
an inconsistency.

### `/dataviz` governs the rendering

Load the `/dataviz` skill before writing chart code. Binding constraints
already settled:

- **Color follows the entity, never its rank.** The bars carry ONE sequential
  hue; a filter that changes the row count must not repaint the survivors.
- More than 8 ancestors fold to a **`+ N others`** row — a 9th categorical hue
  is never generated.
- Run `scripts/validate_palette.js` against the project palette for both light
  and the **selected** dark mode. Do not eyeball it.
- A legend for ≥ 2 series, a table view, and a default hover layer.

### Honest limit at recording

**Delegation lanes read 0, not low.** A `recovers` edge is a parent edge whose
parent contributes boost 0 until `tactic-attention-delegation-scoring` lands.
The panel must render this as `0 (until delegation-scoring)` rather than imply
a delegation is cold — otherwise the panel actively misleads on exactly the
"where does capture concentrate" question this strategy names.

### Verification

- An ancestor's reported share equals its recomputed contribution to the
  window's total score, asserted against the live store.
- Toggling a filter changes panel shares and changes **no** ETA.
- A lineage with descendants only at `phase: null` reports non-zero
  undecomposed and zero in-flight.
- Marking a descendant `done` decreases its ancestors' heat and increases
  their progress in the same pass.
- The palette validator passes in both modes before ship.

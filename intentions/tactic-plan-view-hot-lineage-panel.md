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
clarifications:
  - question: What shipped in the first published cut, and did the recorded
      honest limit survive contact with the implementation?
    answer: "SHIPPED 2026-08-13 in PR #3084, inside the published artifact
      https://claude.ai/code/artifact/2c00af0f-0fdc-404b-b772-de7df6dee7bd:
      per-ancestor score contribution split into undecomposed and in-flight,
      a done/total progress readout, the `+ N others` fold at 8, a legend, a
      table view, and recomputation under the active filter. The delegation
      limit recorded on this node was SHARPENED by building it: a `recovers`
      ancestor does not merely read LOW, it does not appear in
      `ResolvedAttention.sources` AT ALL — the resolver's authored term
      distributes along parent/serves only, and a delegation feeds the separate
      capture term as a scalar. So its decomposed share is structurally
      unavailable rather than small. The panel therefore synthesises the lane
      from `recovers` edges and renders `0 (until delegation-scoring)`;
      omitting it would have read as `no capture here`, which is the misreading
      this node exists to prevent."
    date: "2026-08-13"
  - question: How is the share measure verified, given the page is a snapshot?
    answer: "(2026-08-13.) As a BUILD-TIME assertion, which is what the recorded substrate
      amendment anticipated. artifacts/plan-view/test/live-store.test.ts checks
      against the live store that the summed per-ancestor contributions equal
      the window total, and independently recomputes that total from the rows
      rather than from the panel's own maps — so a bug that corrupted both
      halves identically still fails. Scope caveat, stated plainly: the panel
      follows the active FILTER, which is the lever the page actually has. It
      does not follow a SCROLL WINDOW, because the table does not virtualize
      yet and therefore has no scroll window distinct from the filtered set;
      that half of the recorded scope arrives with
      tactic-ds-plan-table-primitive."
    date: "2026-08-13"
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Delivered and published in PR #3084; held so the router does not
    select it for a decomposition round while the PR is open. Residual: the
    scroll-window half of its recorded scope, which depends on
    tactic-ds-plan-table-primitive."
  since: "2026-08-13"
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

### Substrate — AMENDED 2026-08-13: this ships inside a published claude artifact

The panel is part of `tactic-plan-view-table`, whose delivery substrate changed
this date from an office-hours panel to a **published claude artifact** (see
that node's amended Substrate section and `strategy-owned-web-platform`'s
artifact-delivery clarifications). Three consequences bind this node
specifically:

- **Shares are computed at build time, in Node, not in the browser.** The panel
  renders precomputed contributions rather than recomputing from a live graph
  read. Its verification below — "asserted against the live store" — is a
  **build-time** assertion, run in the artifact's test suite against the
  working clone; it is not a runtime property of the page.
- **The panel is a snapshot of the same instant as the table.** It carries no
  independent freshness; the page-level `origin/main` sha and build stamp cover
  both. A panel that could disagree with its table about which commit it
  describes would be a defect.
- **Filtering stays fully client-side.** Filters change panel scope, and the
  page has no way to fetch anything, so every row and every ancestor the
  filters can reach must already be in the baked payload. Size this against the
  16MB page cap when the payload shape is chosen.

`/dataviz`'s palette rules and its validator apply unchanged — the artifact
renders in the viewer's theme, which has three states (explicit dark, explicit
light, and system default), so the "selected, not auto-flipped" dark mode the
skill requires must be authored as tokens on bare `:root` with the dark
redefinitions guarded, never as a colour whose only definition lives inside a
media query.

### Verification

- An ancestor's reported share equals its recomputed contribution to the
  window's total score, asserted against the live store.
- Toggling a filter changes panel shares and changes **no** ETA.
- A lineage with descendants only at `phase: null` reports non-zero
  undecomposed and zero in-flight.
- Marking a descendant `done` decreases its ancestors' heat and increases
  their progress in the same pass.
- The palette validator passes in both modes before ship.

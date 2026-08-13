---
id: tactic-ds-plan-table-primitive
kind: tactic
statement: Add the virtualized data-table primitive the design system lacks —
  sticky span headers, row virtualization for infinite scroll, and a lane-gutter
  slot — so the plan view is built on @commons-systems/ds rather than bespoke
  markup
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-13 /align interview when the author required
  the plan view to use the project design system. Measured that round:
  @commons-systems/ds exports Button, Badge, Card, Metric, Input, Select,
  Checkbox, Nav, the page templates and BudgetPaceChart — there is NO table or
  data-grid primitive of any kind. Badge covers the label chips; everything else
  the plan view needs is net-new DS surface."
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
# Add the virtualized data-table primitive the design system lacks — sticky span headers, row virtualization for infinite scroll, and a lane-gutter slot — so the plan view is built on @commons-systems/ds rather than bespoke markup

## Draft context (2026-08-13 /align interview)

The author required the plan view to use the project design system. It cannot
today.

### The gap, measured

`@commons-systems/ds` exports, in full: `Button`, `Badge`, `Card`, `Metric`,
`Input`, `Select`, `Checkbox`, `Nav`, the `Landing` / `PageShell` / `Hero` /
`ContextPanel` / `Footer` / `OfficeHours` templates, and `BudgetPaceChart`.

**There is no table or data-grid primitive of any kind.** The only match for
"table" anywhere in `packages/ds/src/` is an unrelated comment in
`OfficeHours.tsx`.

`Badge` covers the plan view's label chips and needs no new work. Everything
else the table requires is net-new design-system surface.

### What the primitive must carry

- **Row virtualization** for infinite scroll over the full non-done tactic set
  (415 rows when measured, and growing).
- **Sticky span headers** rather than literal `rowspan` for any span whose
  extent exceeds the loaded window. This is the mechanism that reconciles the
  tier and lineage-spine columns with streaming rows: a `rowspan` must know its
  extent at render time, which virtualization cannot supply.
- **A lane-gutter slot** — a fixed-width column rendering per-viewport vertical
  bands rather than cells, for the off-spine DAG ancestors.
- Theme-aware in light and a **selected** dark mode, consistent with the rest
  of DS.

### Sequencing note

`tactic-plan-view-table` consumes this. Whether that is a hard `blocked_by`
edge or the two land together is a decomposition decision for
`/align-tactics`, not settled here — building the table against bespoke markup
first and extracting the primitive afterwards is a legitimate alternative
ordering, and the author has not been asked which they prefer.

### Verification

- The plan view imports its table from `@commons-systems/ds` and defines no
  bespoke `<table>` markup of its own.
- Scrolling the full row set does not re-render or mutate an existing span
  cell; spans that leave the viewport become sticky rather than breaking.
- A Storybook story exercises the primitive at a row count large enough that
  virtualization is actually engaged.

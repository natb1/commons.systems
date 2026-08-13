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

### Substrate — AMENDED 2026-08-13: the consumer is a published claude artifact

The primitive's home is unchanged — it belongs in `packages/ds` regardless of
who renders it. What changed this date is its **first consumer**:
`tactic-plan-view-table` is now built as a published claude artifact rather
than an office-hours panel (see that node's amended Substrate section and
`strategy-owned-web-platform`'s artifact-delivery clarifications). Two
consequences, both concrete:

- **The DS must bundle into one self-contained file.** This is already a solved
  problem here and the solution should be reused rather than reinvented:
  `.design-sync/resync.mjs` bundles `packages/ds/src/index.ts` straight from
  TypeScript source via esbuild for the claude.ai design canvas — there is no
  `dist/` build and none is needed. The artifact build is the same shape with a
  different output target. `.design-sync/NOTES.md` carries the gotchas that
  will otherwise be rediscovered, including that `packages/ds/package.json`'s
  `"types": "src/index.ts"` is load-bearing for extraction.
- **Fonts must become `data:` URIs.** The DS's IBM Plex woff2 files live under
  `packages/ds/.storybook/public/fonts/` and `fonts.css` references them with
  **absolute** `url("/fonts/...")`, served by Storybook's `staticDirs`. A
  published artifact has no such static root and its CSP blocks every external
  host, so those absolute references resolve to nothing and the page silently
  falls back down the `--font-mono` stack. The build must inline the five woff2
  as `data:` URIs — the same five `.design-sync/config.json` already lists
  under `extraFonts` — and their combined size counts against the 16MB page
  cap.

This does not change what the primitive is or where it lives; it constrains how
the artifact consumes it, and it is recorded here so the font failure is
designed out rather than diagnosed later.

### Verification

- The plan view imports its table from `@commons-systems/ds` and defines no
  bespoke `<table>` markup of its own.
- Scrolling the full row set does not re-render or mutate an existing span
  cell; spans that leave the viewport become sticky rather than breaking.
- A Storybook story exercises the primitive at a row count large enough that
  virtualization is actually engaged.

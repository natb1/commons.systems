---
id: tactic-rsi-plan-merged-priority-table
kind: tactic
statement: Merge rsi-plan.md's author-priorities, dispatch-queue, and
  office-hours sections into one tier-banded table grouped by strategy lineage,
  with independent delegated and parked columns
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align round that created
  strategy-rsi-plan-surface. The author asked for two things that turn out to be
  one change: the priority table should show strategy lineage (tactic rows
  grouped by parent strategy, groups sorted by rank, each group introduced by a
  full-lineage header row), and the three separate priority sections should
  merge into a single table marking each row delegated or parked. They are
  inseparable because the group header row IS the merged home of the old section
  1 — a strategy row with its own ETA. Carries the format contract recorded in
  the 'What is the shape of the merged priority table' clarification on
  strategy-rsi-plan-surface; that clarification is authoritative, this body is
  the implementation decomposition."
reading: null
serves:
  - strategy-rsi-plan-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-rsi-plan-priority-render
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Merge rsi-plan.md's author-priorities, dispatch-queue, and office-hours sections into one tier-banded table grouped by strategy lineage, with independent delegated and parked columns
## Draft context (2026-08-11 /align round that created strategy-rsi-plan-surface)

Authoritative format contract: the clarification *"What is the shape of the
merged priority table this strategy's tactics must render?"* on
`strategy-rsi-plan-surface`. Read it first — this body is the implementation
decomposition, and where the two differ the clarification wins.

All work is in `packages/intentionsutil/scripts/render-rsi-plan.ts`.

### What merges, and what does not

Sections 1, 2, and 3 of the recorded six-section contract on
`strategy-recursive-self-improvement` ("What must rsi-plan.md contain?")
collapse into a single table:

| old section | becomes |
|---|---|
| 1 — top author priorities (strategies, with ETA) | the group **header rows** |
| 2 — dispatch-delegated status (tactics) | the ordinary **rows** |
| 3 — critical office-hours parked nodes | ordinary rows with `parked` set |

Sections 4 (metrics), 5 (recommended telemetry), and 6 (the rsi task plan)
are **unchanged and stay separate**. Section 6 in particular does not fold
in: its `attributes.rsi_task.type` values include `pause queue`, which is not
a graph tactic — such rows have no parent strategy, no phase, and no ETA, and
would be structurally empty inside a per-tactic table. Its `reasoning` column
is likewise meaningless for dispatch rows. This exclusion is a decision, not
an oversight; folding it in later stays cheap because nothing in the group
structure depends on excluding it.

### Table structure

Two levels of header row, outer to inner:

1. **Tier band** — `Tier 3`, `Tier 2`, `Tier 1`, descending. Present only
   when the band is non-empty.
2. **Strategy group** — inside each tier band, one group per parent strategy,
   groups sorted by resolved rank descending. The header row carries the
   **full strategy lineage**, walked up the `parent` chain to the root, e.g.
   `strategy-autonomous-execution › strategy-recursive-self-improvement ›
   strategy-rsi-plan-surface`. It also carries that strategy's own ETA — the
   drain time of its open children, which is exactly what old section 1's
   strategy rows reported.

Tactic rows sit under their group.

**Tier is the outer key deliberately.** `selectGraphTargets`
(`packages/intentionsutil/src/router.ts`) sorts on the **lifted** `(tier,
rank)` pair, so tier dominates strategy rank globally. Grouping by strategy
alone would render a tier-2 bug fix under a low-ranked strategy far down the
page even though it executes first, and would break the ETA column: ETA is
derived from a row's 1-based position in the true `(tier, rank)` order, so in
a strategy-only grouping the dates would not count monotonically down the
page. With tier outermost, reading order equals execution order and the ETA
column stays monotonic — which is the property that makes the table worth
reading at all.

Accepted cost, named: tier 2 and 3 bands are usually small, so the table
opens with several near-empty sections before reaching the bulk of the work.

### Columns

Per tactic row: strategy lineage is implied by the group, so the row carries
phase, **delegated**, **parked**, and estimated delivery date.

- **delegated** — set when `owner: ai`, i.e. dispatch owns this node's
  ordering (and `/rsi-evaluate` may rewrite its attention without author
  input). Clear when `owner: human`.
- **parked** — set when `office_hours` is non-null: not selectable by the
  router until the author clears the park.

These are **two independent columns, not one lane column.** Measured on the
graph at the time of drafting: 146 tactics are parked and **58 of those are
`owner: ai`** — so the two facts are orthogonal for a large minority of rows,
and a single combined column would have to pick one and hide the other for
every one of those 58.

The parked cell carries the blocking answer **inline** — `parked (blocks
dispatch)` versus `parked (blocks other priorities)` versus bare `parked` —
rather than spending a fourth column that would be empty on every unparked
row, which is most of the table. This preserves the superseded section 3's
requirement that each parked node record whether it blocks model execution or
other priorities; that requirement is not dropped by the merge, only relocated.

### Ordering within a group

Unchanged from what the router does: after tier and strategy rank, rows sort
by the node's own resolved value, then by the progression ordinal, then by id.
Do not invent a new comparator — read the order from the same path
`selectGraphTargets` uses so the table cannot drift from the queue it claims
to show.

### Dependency

`blocked_by: [tactic-rsi-plan-priority-render]`. That tactic defines the ETA
derivation (velocity = the dispatch queue's 28-day closure rate in
closures/day; a tactic row's ETA is today + position ÷ velocity; a strategy
row's is today + open-child count ÷ velocity; zero velocity renders honestly
as unavailable) and the `(tier, rank)` ordering this table groups. Landing
this table first would mean reimplementing both.

Note that the same tactic's **section 1 and section 2 format specs are
superseded by this node** — see the supersession note in its own body. Its
surviving scope is the ETA derivation, the section 6 task-plan changes, the
flag kinds, the per-iteration reprioritization delta, and the
reprioritization-outcome audit.

### Interaction with tactic-attention-namespaced-rank

`tactic-attention-namespaced-rank` (serving `strategy-graph-drives-dispatch`
and `strategy-rsi-delegated-prioritization`) proposes making rank order by
`(tier, band, residual)`, where `band` is the resolved rank of the distributing
strategy. If that lands, this table's two-level grouping becomes a **direct
rendering of the sort key** rather than a presentation choice layered over it:
the tier band is the first component, the strategy group is the second, and
within-group order is the third. Neither node blocks the other, but whichever
lands second should verify the two agree rather than assuming it.

### Verification

- Render against the live graph and confirm the ETA column increases
  monotonically top-to-bottom across the whole table, tier bands included.
  A non-monotonic ETA means the row order and the derivation disagree.
- Confirm a node that is both `owner: ai` and parked shows **both** columns
  set — the 58-row case that rules out a single lane column.
- Confirm a tier-2 or tier-3 node renders in its own band above every tier-1
  group regardless of its strategy's rank.
- Confirm the lineage header walks all the way to the root, not just one
  level up.
- Confirm sections 4, 5, and 6 are untouched.

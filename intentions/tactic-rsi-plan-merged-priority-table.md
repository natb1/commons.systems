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
blocked_by: []
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
rank)` pair, so tier dominates strategy rank globally: a tier-2 bug fix
executes before every tier-1 row regardless of its strategy's rank. Without a
tier band it would render far down the page under a low-ranked strategy even
though it runs first.

> **Withdrawn 2026-08-11 after adversarial review.** An earlier version of
> this paragraph also justified tier-outermost by claiming it keeps the ETA
> column counting monotonically down the page. **That is false.** Grouping by
> strategy *at all* reorders rows away from selection order — measured on the
> live graph, one strategy's rows span up to 160 selection positions — so no
> choice of outer key restores monotonicity. Monotonic ETA is not a property
> this table has, and nothing may be justified by it. Grouping is kept
> because the author specified it; the reviewer's alternative (one global
> selection-ordered list with lineage as a per-row breadcrumb column) was
> considered and declined for that reason.

**Row set.** Every non-`done` tactic, drafts included. The two tactics that
implement this very table are themselves drafts, and a phase-set-only rule
would omit them from the plan that tracks them. Parked rows are included and
marked, never dropped.

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

These are **two independent columns, not one lane column.** Measured over all
non-`done` tactics (388 at 2026-08-11): **143 are parked, and 54 of those are
`owner: ai`** — so the two facts are orthogonal for a large minority of rows,
and a single combined column would have to pick one and hide the other for
every one of those 54. (Corrected 2026-08-11: the drafting round recorded
146/58 against a row set it never stated. State the row set with any recount —
the figure moves by several depending on whether drafts and non-`raw` statuses
are counted.)

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

### ETA derivation — absorbed here, one basis for every date on the page

This node previously carried `blocked_by:
[tactic-rsi-plan-priority-render]` on the ground that the blocker "defines
the ETA derivation." **That edge is dropped and the derivation moved here**
(2026-08-11, after adversarial review). The ordering was unexecutable: the
blocker had to land first, but its ETA clauses were written against sections
1 and 2 — which this node deletes — so a worker taking it first would have
built an ETA column onto sections about to be removed. The derivation is four
lines of specification that this table has to implement regardless, and this
table is its only consumer.

**Velocity** = the dispatch queue's 28-day closure rate in closures/day, from
the existing created/closed series. Zero velocity (paused queue) renders
honestly as `unavailable` rather than as a date.

**Tactic row ETA** = today + (the row's 1-based position in the router's
selection order ÷ velocity).

**Parked rows have no position.** `selectGraphTargets` skips them at its
`office_hours` guard, so they are never ranked at all. Their ETA cell reads
`unavailable — parked`, and they are **excluded from the position counter**
that feeds every other row's ETA — otherwise 143 unselectable rows inflate
every real date on the page.

**Group header ETA** = the position-derived ETA of the **last unparked row in
that group** — when the group finishes — computed on the same basis as the
rows. A header can therefore never date earlier than the rows beneath it.

> The earlier basis, "strategy row ETA = open-child count ÷ velocity", is
> **withdrawn**. It ignored that other strategies' work interleaves, so it
> produced headers dating months before their own rows: at drafting,
> `strategy-rsi-delegated-prioritization` had zero open children and would
> have rendered "today" above rows sitting at positions 19–21, while
> `strategy-attention-surface` would have dated ~11 rows out above rows
> reaching position 171.

The residue of `tactic-rsi-plan-priority-render` after this move is the
section 6 task-plan typing and the FLAG kinds; the per-iteration
reprioritization delta and the outcome audit moved to
`tactic-rsi-reprioritization-outcome-audit` under
`strategy-rsi-delegated-prioritization`. No supersession is left standing
anywhere — the annotated dead bullets are gone rather than annotated.

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

- Confirm every group header's ETA is **at or after** the ETA of every row
  beneath it. This replaces the withdrawn page-wide monotonicity check: the
  page is grouped by strategy, so ETA is deliberately not monotonic down it,
  and a header dating before its own rows is the failure that check should
  have been catching.
- Confirm parked rows render `unavailable — parked` and that removing them
  from the graph does not shift any unparked row's ETA — the check that they
  were excluded from the position counter rather than merely blanked.
- Confirm a node that is both `owner: ai` and parked shows **both** columns
  set — the 54-row case that rules out a single lane column.
- Confirm a tier-2 or tier-3 node renders in its own band above every tier-1
  group regardless of its strategy's rank.
- Confirm the lineage header walks all the way to the root, not just one
  level up.
- Confirm sections 4, 5, and 6 are untouched.

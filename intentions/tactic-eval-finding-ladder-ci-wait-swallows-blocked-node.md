---
id: tactic-eval-finding-ladder-ci-wait-swallows-blocked-node
kind: tactic
statement: graph-select-target collapses blocked/parked/done/absent/reviewed
  into one empty answer with the reason only in stderr prose, so
  dispatch-ladder-run classifies a permanently blocked node as the honest
  silence ci-wait and re-polls it for the full --ci-wait-s hour before halting
  idle — the word blocked never appears in the journal, events.jsonl or status
  output
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: phases_launched
      value: 0
      unit: count
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: ci_wait_burned_before_manual_stop_s
      value: 420
      unit: seconds
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: ci_wait_budget_that_would_have_burned_s
      value: 3600
      unit: seconds
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: dispatch-ladder-run --ci-wait-s default
      measured: 2026-08-14
    - metric: reconcile_passes_with_no_progress
      value: 8
      unit: count
      window: tactic-attention-unified-relation-cycle-rule ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: events.jsonl + graph-select-target --node
      measured: 2026-08-14
---
# A blocked node is indistinguishable from pending CI to the ladder driver

`/dispatch-ladder tactic-attention-unified-relation-cycle-rule` ran for 8
minutes and 8 reconcile passes without ever launching a phase, and would have
run the full `--ci-wait-s` hour before halting exit 10 `idle`. The node was
never launchable: it carries `blocked_by: [tactic-attention-namespaced-rank]`,
and the blocker sits at phase `main-qa`. No amount of waiting could change
that — nothing the driver does advances another node.

## The mechanism

`graph-select-target --node <id>` collapses five structurally different
answers into one `empty`, with the reason emitted only as English prose on
stderr:

```
node tactic-attention-unified-relation-cycle-rule is not selectable
(not found, done, parked, blocked, or already reviewed — inspect
intentions/<id>.md directly for the reason)
```

`dispatch-ladder-advance` maps that `empty` to `idle` (exit 10), which is
correct — it may sequence, never gate. `dispatch-ladder-run` then classifies
`idle` as one of the two *honest silences* and re-polls it under the
`--ci-wait-s` budget as disposition `ci-wait`. But "the PR's CI is still
running" and "this node is blocked by an unfinished node" are not the same
kind of silence. The first resolves on its own inside the window; the second
provably cannot.

The `ci-wait` disposition is therefore load-bearing and wrong here. Every
event line this run wrote says `ci-wait`, so `events.jsonl` — the sole record
the closing synthesis reads — attributes an hour of wall clock to CI latency
that was actually a permanent structural block.

## Why the driver cannot currently tell

The distinction is available: it is one field on the node, and the selector
already computed it to decide the node was not a candidate. It is discarded at
the selector's stdout boundary. The driver has no machine-readable reason code
to branch on, and correctly refuses to re-derive eligibility itself — that
would put a gate in the driver, which
`strategy-recursive-self-improvement`'s standing constraint forbids.

So the fix belongs on the **selector's output contract**, not in the driver:
`graph-select-target` should emit the non-selectability reason as a token
(`blocked`, `parked`, `done`, `absent`, `reviewed`) alongside `empty`.
`dispatch-ladder-advance` can then pass it through as `idle <id> <reason>` —
a shape its own header already documents — and `dispatch-ladder-run` can halt
immediately on a terminal reason instead of polling a wait that has no
resolution. That is a reporting change on all three, with no new eligibility
rule anywhere.

## What the operator sees today

Nothing actionable. The journal repeats `merge - no-merge`, `absorb - noop`,
`idle - ci-wait` once a minute. The word `blocked` appears nowhere in the
journal, in `events.jsonl`, or in `dispatch-ladder-status` output. Diagnosing
it took a hand-run of `graph-select-target --node` plus reading the node's
frontmatter at `origin/main` — exactly the manual inspection the selector's
own error string tells you to go do, from a detached driver that has no one
attached to read it.

## Adjacent observation, not filed separately

The run also emitted a `main-conflict-prediction` advisory (clean -> conflict)
for a node whose branch will not be merged for as long as it stays blocked.
The advisory is explicitly non-gating and did no harm; it is noted only
because it is more evidence the driver had no idea the node was parked behind
another.

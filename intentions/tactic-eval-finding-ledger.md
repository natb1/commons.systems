---
id: tactic-eval-finding-ledger
kind: tactic
statement: Build the finding ledger — similar evaluation findings merge into ONE
  node with summary recurrence and impact metrics, never a node per occurrence,
  and ledger entries are exempt from unreferenced-pruning
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-12 /align round, carrying the author's mid-interview
  ruling that the graph acts as a ledger tracking and prioritizing harness
  optimizations, and the merge-not-accumulate confirmation of the same session.
  Follows dispatch-fleet-alarm's find-or-create shape but diverges knowingly on
  the key: fleet-alarm's eight alarm kinds are a closed mechanical enum, which
  cannot work for an open-ended finding space, so target selection is a
  similarity judgment against the open ledger."
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-rsi-delegated-prioritization
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
# Build the finding ledger — similar evaluation findings merge into ONE node with summary recurrence and impact metrics, never a node per occurrence, and ledger entries are exempt from unreferenced-pruning

Drafted by the 2026-08-12 `/align` round, carrying the author's mid-interview
ruling that the graph acts as a **ledger** tracking and prioritizing harness
optimizations, and the merge-not-accumulate confirmation of the same session.
Read the "What is the graph's role for harness optimizations" clarification on
`strategy-recursive-self-improvement` for the four requirements this executes.

## The shape

One node per distinct finding. **Similar findings merge into one node** — there
is explicitly no node per occurrence. A recurrence refreshes the entry's body
and updates its **summary metrics** on `attributes.measured_impact`
(`tactic-measured-impact-schema`): occurrence count, first-seen, last-seen,
cumulative and per-occurrence impact. No per-occurrence array is kept — a ledger
prioritizes on aggregates, and summary shape bounds both node growth and the
re-measurement write surface.

## Precedent followed, and where it is deliberately broken

Model on `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm` — the
find-or-create node, body refreshed on re-detection, `attention: null` because
rank is never machine-injected, `serves` for band inheritance, `pace_exempt`.

Two deliberate divergences:

1. **The key is not a closed enum.** Fleet-alarm's eight `KINDS` are a fixed
   fault taxonomy; a finding space is open-ended. Target selection is therefore
   a **similarity judgment against the open ledger** — the evaluator reads the
   open entries and decides whether this finding *is* one of them — with the
   slug remaining only the addressing mechanism. This is the one place a model
   judgment is load-bearing, and it is where the merge discipline will fail
   first if it fails.
2. **Closed entries are not minted over.** Fleet-alarm treats a `closed` node as
   "a since-resolved condition that has recurred: mint over it rather than
   reopening" (`dispatch-fleet-alarm:645`). Inheriting that would reset the
   occurrence count to 1 on every recurrence after a retirement — silently
   understating the exact metric the ledger exists to carry.

## Durability

Ledger entries are **exempt from unreferenced-pruning**. `graph-commit --prune`
deletes the node file outright, so an unexempted entry loses its summary
metrics to git history where no ranking read will find them. Retirement means
phase `done` with the summary intact, so a later recurrence **resumes** the
count.

Where the exemption is enforced is a planning decision:
`prune-unreferenced`'s candidate query, a node attribute the pruner honors, or
`validate-graph`. Whichever is chosen, the exemption must be mechanical — a
convention the pruner does not read is not an exemption.

## Done-when

- A second occurrence of the same finding updates an existing entry's summary
  metrics and mints **no** node.
- A retired (`done`) entry survives a prune sweep, and a recurrence after
  retirement resumes its count rather than restarting at 1.
- **Measured:** open ledger-entry count does not grow faster than entries
  retire, across at least two evaluation windows. This is the bound adopted
  from the steelman on `strategy-recursive-self-improvement`, and it is
  currently a design expectation, not a measurement.

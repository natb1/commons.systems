---
id: tactic-eval-finding-ledger
kind: tactic
statement: Retire the finding ledger as a distinct graph primitive — drop
  attributes.ledger_entry as a class marker, re-key the prune exemption to any
  node carrying attributes.measured_impact, and widen the mint-or-reuse search
  from the tactic-eval-finding-* namespace to the whole open tactic set
owner: ai
status: raw
parent: null
rationale: Rewritten 2026-08-14 by the /align round that dissolved the ledger
  primitive on author ruling. This node previously planned the ledger's
  construction; the construction landed, and what is now owed is retiring the
  part of it that made rsi findings a privileged class. Reused rather than
  superseded by a fresh node, which is the merge discipline this round records,
  practised on itself. The general rule it serves lives on
  strategy-graph-native-dispatch; the rsi-specific retirement lives on
  strategy-recursive-self-improvement.
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-rsi-delegated-prioritization
  - strategy-graph-native-dispatch
  - strategy-graph-self-description
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

# Retire the finding ledger as a distinct graph primitive

Rewritten 2026-08-14 by the `/align` round that dissolved the ledger primitive.
This node previously planned the ledger's *construction*; the construction
landed, and the author's ruling of this date retires the part of it that made
rsi findings a privileged class. The id is deliberately unchanged — an id is
addressing, not membership, and it is cited in node bodies, commit subjects and
at least one shipped fix message. Reusing this node rather than minting a
successor is also the discipline this round records, practised on itself.

Read the amended "What is the graph's role for harness optimizations"
clarification on `strategy-recursive-self-improvement` for which of the four
original requirements survive, and the "How is a finding recorded on the graph"
clarification on `strategy-graph-native-dispatch` for the general rule that
replaces them.

## What is retired

1. **`attributes.ledger_entry` as a class marker.** `isLedgerEntry`
   (`packages/intentionsutil/src/schema.ts:529`) and its one live call site
   (`packages/intentionsutil/scripts/graph-census-debt.ts:143`) go with it.
2. **The `tactic-eval-finding-*` id namespace as a membership test.** The
   anchored id regex in `dispatch-eval-finding:371` and the
   `attributes.ledger_entry` filter behind `--list` (`:323`) both scope the
   mint-or-reuse decision to a namespace, which is precisely how a duplicate
   escapes it.
3. **A writer private to one strategy.** `dispatch-eval-finding` becomes the
   find-or-recur write surface every finding producer calls, or is replaced by
   one.

## What survives, generalized

- **Merge, not accumulate.** One node per distinct finding; a recurrence
  updates `attributes.measured_impact` and mints nothing.
- **Summary metrics, not an occurrence array.** Unchanged — `measured_impact`
  is already documented on `intentions/kind-tactic.md` as a general tactic
  attribute, validated for any tactic by `validateGraph` rule 21. Nothing about
  it was ever rsi-specific.
- **Merge is a judgment.** Unchanged in kind, widened in scope: the search set
  becomes the whole open tactic population rather than one namespace.
- **Durability, re-keyed.** The prune exemption moves from
  `attributes.ledger_entry` to *carrying* `attributes.measured_impact` — never
  prune a node that holds measurements, whoever wrote it. This is the one place
  the class marker was actually load-bearing, and the replacement is a general
  rule rather than a class exemption.

## Scope

- `packages/intentionsutil/src/schema.ts` — remove `isLedgerEntry`, or narrow it
  to a `hasMeasurements` predicate keyed on `attributes.measured_impact`.
- `packages/intentionsutil/scripts/graph-census-debt.ts:143` — the owed-prune
  census exempts on measurements rather than on class.
- `intentions/kind-tactic.md` — rewrite the `ledger_entry` section as retired
  and fold its surviving content into the `measured_impact` section. **Also fix
  a stale reference found in this round:** that section names `rsi.ts` §6 as a
  second `isLedgerEntry` consumer, and grep finds no such call site — the
  reference did not survive the rsi-plan render retirement.
- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` — drop the
  anchored id regex and the `ledger_entry` write and filter; `--list` reports
  the whole candidate set.
- The 18 existing `tactic-eval-finding-*` nodes keep their ids by author ruling;
  `attributes.ledger_entry` is dropped from each opportunistically as it is
  touched, the same deprecated-legacy shape the bare-string
  `strategy_fingerprint` form is being retired under. `pace_exempt: true` is not
  retired — recording a finding is not paced work for any producer, so it
  generalizes with the rest rather than going away.

## Out of scope

- The find-before-minting step inside each producer's skill — that is
  `tactic-finding-search-all-producers`.
- Building the duplicate-findings sensor — that is
  `tactic-duplicate-finding-sensor`.

## Done-when

- No code path reads `attributes.ledger_entry`, and the owed-prune census
  exempts a `phase: done` node because it carries `attributes.measured_impact`.
- A finding node written by any producer, in any id namespace, is returned by
  the mint-or-reuse search.
- A retired finding tactic survives a `graph-commit --prune` sweep and a
  recurrence resumes its count rather than restarting at 1 — the behaviour the
  original ledger design owed, now owed generally.
- `intentions/kind-tactic.md` and the code agree, which
  `strategy-graph-self-description` requires and which the stale `rsi.ts` §6
  reference currently violates.

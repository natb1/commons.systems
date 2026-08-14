---
id: tactic-rsi-audit-threshold-table
kind: tactic
statement: Have /rsi-audit write per-phase-kind cost-per-unit-of-change cut
  points into config on its fleet pass, so the /rsi trigger gate reads a cheap
  table instead of recomputing the distribution
owner: ai
status: raw
parent: null
rationale: "Drafted by the 2026-08-14 /align round, carrying the
  distribution-ownership condition recorded that day. Cross-cutting serves
  follows tactic-rsi-round-trips-lens-carrier's split: the evaluator surface is
  strategy-recursive-self-improvement's, while cost-per-unit-of-delivered-change
  is strategy-token-economy's own signal — allowance converted into closed work
  — read at phase granularity."
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-token-economy
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
# Have /rsi-audit write per-phase-kind cost-per-unit-of-change cut points into config on its fleet pass, so the /rsi trigger gate reads a cheap table instead of recomputing the distribution

# Have /rsi-audit write per-phase-kind cost-per-unit-of-change cut points into config on its fleet pass, so the /rsi trigger gate reads a cheap table instead of recomputing the distribution

Drafted by the 2026-08-14 `/align` round. Read the distribution-ownership condition and the
"What does the threshold compare against" clarification on
`strategy-recursive-self-improvement` at `origin/main`.

## Why the gate must not compute its own distribution

`aggregate-usage.sh` is a ~1000-line jq program over multi-megabyte transcripts. Running it at
every session boundary to decide whether to spend a model turn would cost more than the model
turn it gates. `/rsi-audit` already reads this data on its regular fleet pass, so the expensive
work amortizes into the instrument that was going to do it anyway rather than being paid N times.

## The shape

On each fleet pass, `/rsi-audit` writes per-phase-kind cut points (trailing 28-day median of
cost-per-unit-of-delivered-change, and whatever else `tactic-rsi-trigger-threshold-gate` ends up
needing) into a config file. The gate does a read-and-compare and nothing else.

## Bootstrap

Hand-set constants in the same config file until the first audit pass overwrites them — so the
gate is shippable before the table exists, and `tactic-rsi-trigger-threshold-gate` is not blocked
on this node.

## Open question this node must resolve first

**Owned at record time as unchecked:** the interview did not verify that `/rsi-audit` writing a
config file is permitted by its own record-only bounds. `/rsi` is bound to record-only (its entire
write surface is `dispatch-eval-finding`); `/rsi-audit` is author-invoked and may hold
attended-only remediation steps, but whether a config write fits that is not settled. Resolve this
BEFORE implementing. If the bound forbids it, move the writer — the design does not depend on
`/rsi-audit` specifically, only on the distribution being computed once by whoever already reads
the aggregates.

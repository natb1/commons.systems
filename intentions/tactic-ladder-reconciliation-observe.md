---
id: tactic-ladder-reconciliation-observe
kind: tactic
statement: Bootstrap strategy-scoped reconciliation in observe mode - claim
  records, evidence folding, derived position, check tiers - measured alongside
  the incumbent ladder
owner: ai
status: raw
parent: null
rationale: "Delegated by the 2026-09-01 /align ladder-reconciliation round under
  the ratified strategy-scoped reconciliation target architecture
  (strategy-graph-native-dispatch, 2026-09-01). Traditions: Kubernetes
  status.conditions and level-triggered controllers; event sourcing; loop
  engineering; one-piece flow. The observe-mode bootstrap is self-hosting: the
  divergence between derived and stored position is itself a reported frontier."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-graph-integrity
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Bootstrap strategy-scoped reconciliation in observe mode - claim records, evidence folding, derived position, check tiers - measured alongside the incumbent ladder

## Retained interview context (2026-09-01 /align ladder-reconciliation round)

Observe-mode bootstrap of the ratified target architecture, alongside the
incumbent ladder - nothing incumbent is drained by this tactic (author
ruling 2026-09-01: incumbent tactics complete their implementation scope
THROUGH this machinery as its viability test). Scope:

1. Claim records: one file per claim; claim/release events; the claim
   registry derived from the files, never a shared hot file.
2. Evidence append + fold: reconciler folds observed PR/merge state into
   per-strategy evidence; unmatched-evidence detection (diff satisfying no
   criterion) as a digest finding.
3. Derived position computed beside the stored phase; divergence reported as
   a frontier (self-hosting observe mode); honest unknowns carried.
4. Check-tier registry + high-water ratchet mechanics (observe tier is a
   declared tier; promotion is mechanical and one-way).
5. Concurrency-safe tick per the binding author directives (commutative
   appends, serialization only at the graph-commit landing lock).
6. Measurements: token cost of claim-time bite carving and per-phase
   execution-time planning (the round's unmeasured claims); rsi per-phase
   attribution is the instrument. These measurements feed the deferred
   post-viability interview on retiring the tactic layer.

## Reuse (recorded 2026-09-01, adversarial-review errata)

The claim-record design in scope item 1 is not new machinery: the
reservation ledger under the dispatch-propagate scripts
(lib-reservation-ledger.sh - a marker-file-per-claim directory with
write/clear/count/sweep, already shared across concurrent ticks) is the
existing implementation of the same shape. Decision recorded: EXTEND that
artifact; never build a parallel implementation. The standing-artifact
claim on strategy-explicit-intent that "claim records (irreversibility
guard) survive" refers to this artifact.

---
id: tactic-stale-hold-sweep-unbounded-store-scan
kind: tactic
statement: The stale-hold sweep spawns a fresh node+tsx process that does an
  unfiltered, unbounded full scan of the entire (currently 486-node,
  monotonically growing) intentions store on every tick invocation, on both the
  normal and paused tick paths, with no staleness gate or shared enumeration
  across the tick's other sweeps
owner: ai
status: raw
parent: null
rationale: "Surfaced as a Deferred, advisory (cost lens) finding during the
  /review-fix pass on PR #3011 (tactic-stale-hold-auto-resolve). Advisory
  findings from the cost lens always route to Deferred and are never
  verify-eligible or fixed in the source PR per the review-fix disposition
  contract."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# The stale-hold sweep spawns a fresh node+tsx process that does an unfiltered, unbounded full scan of the entire (currently 486-node, monotonically growing) intentions store on every tick invocation, on both the normal and paused tick paths, with no staleness gate or shared enumeration across the tick's other sweeps

## Finding

Step 2 of the sweep spawns `node --import tsx/esm list-recheckable-holds.ts --dir $root/intentions` on every invocation, and `listHoldCandidates` is fed `listNodes(dir)` — an unfiltered, unbounded full scan of the entire intentions store (currently 486 node files, monotonically growing as the graph accretes tactics/strategies; nodes are pruned only opportunistically). `dispatch-tick` now runs this scan on BOTH tick paths (line 597 normal, line 372 paused), so a full-store parse plus a cold `node`+`tsx` transpile startup happens every heartbeat (OnUnitActiveSec=5min). The paused path is the sharper case — no other sweep on that branch enumerates the store at all (`reservation_sweep`, `standdown_recheck_sweep`, and `frozen_session_sweep` are ledger/registry-based and spawn no node process), so this introduces a recurring full-collection scan into the code path that previously did the least work, and it keeps running for the whole pause. The per-pass `DISPATCH_HOLD_RECHECK_MAX` cap bounds resolve attempts only; the enumeration itself is uncapped and re-parses every node each time.

## Recommended fix

Cheapen the recurring scan rather than the rare resolve. Options, in order of preference: (a) gate the enumeration behind a cheap staleness check — e.g. skip the pass when `intentions/` has no mtime change since the last sweep, recorded in the tick workspace; (b) share one enumeration across the tick's sweeps (dispatch-graph-scope-sweep already runs its own `listNodes`-backed enumerator via a separate `node --import tsx/esm` process at dispatch-graph-scope-sweep:98) so the store is parsed once per tick instead of once per sweep; (c) run the paused-path sweep on a decimated cadence (every Nth paused heartbeat) since a stale hold is by definition not time-critical while dispatch is paused.

## Provenance

- **Location:** `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh:267`
- **Source PR:** #3011 (`tactic-stale-hold-auto-resolve`)
- **Adversarial verdict:** not verify-gated — cost-lens findings are advisory and always route to `Deferred`, never through the adversarial-verify pipeline.
- **Why deferred rather than fixed in the source PR:** advisory cost finding, out of scope for the source tactic's 5-unit plan.

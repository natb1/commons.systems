---
id: tactic-claim-containment-durable-anchor
kind: tactic
statement: Anchor a claimed node's freeze in durable state rather than the
  daemon-backed session registry, so a registry loss cannot silently free an
  undeclared pass without firing the fuse
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview; the first of two recorded leaks in the terminal-trichotomy
  containment. worktree_has_live_session reads `claude agents --json`, described
  by its own helper header as the daemon-backed registry of live sessions. On a
  daemon restart, host reboot, or job-entry GC, a held-for-debug session stops
  reading as live: the node becomes selectable with no declaration ever made,
  and the fuse does NOT fire because nothing was reaped by dispatch-self-close —
  the evidence evaporated, so the case is indistinguishable from 'no pass ever
  ran'. Fix direction: a durable record that a pass started and never declared,
  surviving registry loss. Adjacent tactic-graph-router-live-worker-read-robust
  covers tolerating an empty or partial read and does NOT close this, because
  after a genuine restart the read is correct and still reports no live session.
  Frequency of registry loss is reasoned about, not measured — worth quantifying
  during planning."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.04
  override: null
  rationale: >-
    Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim scale (50 /
    20 / 10) - dispatch-containment and evidence-custody work that follows the
    Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Anchor a claimed node's freeze in durable state rather than the daemon-backed session registry, so a registry loss cannot silently free an undeclared pass without firing the fuse

## Office-hours sitting 2026-08-10 — park cleared, anchor ratified

This node has been born-parked since 2026-07-31 on WHERE THE DURABLE CLAIM
ANCHOR LIVES. The 2026-08-09 park on
`tactic-session-reap-authorization-durability` re-raised the identical
question from the other side, so both were answered in one sitting.

### Ratified answer

**Option (a), the graph anchor — but written batched, not per spawn.** The
claim is a first-class record in durable graph state, following the
`Execution.fix` / `office_hours` optional-field precedent this node's park
already cited. The selection loop issues ONE `graph-commit` per tick carrying
every claim for that tick, **before** the workers spawn; `graph-commit` already
accepts multiple node ids (`graph-commit:531`).

This directly answers the cost objection recorded in this node's own park. The
park priced option (a) as "a graph-commit round trip to every node-worker
spawn", which is correct for a per-spawn write and was the reason the question
went to the author. Batching removes it: cost becomes independent of fan-out
width. Measured 2026-08-10 — ~92 graph landings/day baseline (1293 / 14d,
peaking at 27/hour) against ~22 worker passes/day (312 transitions / 14d), so
a per-spawn write adds only ~24% to landing volume, but puts a CI-stamped,
globally-lock-serialized landing (`refs/graph/landing-lock`,
`graph-commit:355`) on the spawn critical path — an N-wide fan-out serializes
into N landings. One batched landing per tick does not.

Issuing the batch before the spawns inverts the risk window to
claimed-but-not-yet-spawned, which `reservation_sweep` already reconciles and
which fails safe.

### Option (b) is ruled out on doctrine, not on cost

The reservation-ledger extension is rejected. Condition 10 of
`strategy-graph-native-dispatch` governs the anchor directly: the containment
holds only where "the freeze must anchor on durable graph state rather than on
a process-level session registry". Ratified 2026-08-10 — that binds the
per-claim evidence anchor, not merely the tripped-breaker incident record,
which is the cross-cutting question this node's park raised.

A ledger anchor may still be defensible one day, but it would be an
**amendment** to condition 10, not a reading of it, and must be put to the
author as such. This also avoids the independent problem the park identified:
ledger sweep rule (a) `live-worker-redundant`
(`lib-reservation-ledger.sh:662`) clears the marker the instant a live named
session registers — the exact moment a freeze anchor must persist.

### Option (c) is ruled out by the same condition

A reconciler deriving "a pass started and never declared" from the provisioned
worktree/branch and the PR anchors on state that is durable but is not graph
state, so condition 10 excludes it on the same ground.

## Ordering and scope

`tactic-router-failure-fuses` records that this node must be planned first in
its chain. That ordering leg is now satisfiable — this park is cleared. Its
other leg (`tactic-terminal-declaration-verified-against-node`) remains parked
on a genuinely different question, so the fuses node stays parked.

This node and `tactic-session-reap-authorization-durability` now share one
design. That node was rescoped in the same sitting onto the surviving
claim/release deliverable, so the two must be planned together or merged by
the next `/align-tactics` round rather than each planning the same write.

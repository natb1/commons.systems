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
  boosts:
    "1": 20
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  first_seen: 2026-07-29
  measured_impact:
    - metric: worktree_destroyed_under_live_session
      value: 2
      unit: occurrences
      window: single /align session, 2026-08-14
      sensor: align
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time (first OBSERVED occurrence; node drafted 2026-07-29 from
        reasoning)
      sensor: align
      measured: 2026-08-14
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

## First observed occurrence — 2026-08-14, an `/align` session's worktree destroyed under it, twice

Recorded 2026-08-14 as a **recurrence on this existing node** rather than a new
finding, under the merge discipline landed the same day
(`strategy-graph-native-dispatch`, "How is a finding recorded on the graph").
The root cause is the one this node already names: `worktree_has_live_session`
reads the daemon-backed session registry, and a live session that stops reading
as live has its claim silently freed.

This node's rationale closed with "frequency of registry loss is reasoned about,
not measured — worth quantifying during planning." This is the first
**measurement**, and it is worse than the reasoned-about case in one respect.

### What happened

A single `/align` round, mid-interview, working in
`.claude/worktrees/strategy-recursive-self-improvement`:

1. Worktree provisioned and verified fresh against `origin/main`. Interview ran;
   graph reads succeeded.
2. Mid-session the checkout was **emptied and deregistered** — `ls` returned
   nothing, the directory shell survived, and `git worktree list` no longer
   named it. `git status` from the emptied path walked up and reported the
   **shared main checkout**, so the next write would have landed there.
3. The worktree was recreated from `origin/main` and re-verified fresh. The
   interview continued.
4. It was destroyed a **second time**, at the same point in the lifecycle.
5. Recreating it under a name outside the node-id namespace
   (`align-finding-uniformity`) survived to completion.

### Why this is stronger evidence than the reasoned-about case

The rationale above anticipates the node becoming *selectable* with no
declaration made — a lost claim. Observed here is the harder failure: the
**checkout itself was deleted while a session was actively writing in it**. The
loss is not confined to selection state. Two further consequences the
containment argument does not currently cover:

- **Silent redirection to the shared checkout.** With the worktree gone, plain
  `git` from the dead cwd resolves to the repo root. A session that does not
  notice the deletion writes to the user's main checkout — the exact Step-0
  violation worktree isolation exists to prevent.
- **The node-id name is what draws the sweep.** A worktree named for a node with
  `phase: null` reads as unclaimed. A strategy node is *always* `phase: null`,
  so every `/align` round is structurally exposed: the round's own target node
  can never look claimed to a phase-keyed sweep.

### Measurements

Recorded on `attributes.measured_impact`. `worktree_destroyed_under_live_session`
is 2 for the single session; `recurrence_count` is 1 because this is the first
**observed** occurrence — the node was drafted 2026-07-29 from reasoning, not
from an observation, so counting the draft as occurrence 1 would overstate it.

### What this adds to the fix direction

The durable anchor this node already proposes would have prevented the lost
claim. It does not by itself prevent the **destructive** sweep, so planning
should also settle:

- whether a sweep may delete a checkout at all, versus only releasing the claim;
- how an `/align` round claims a `phase: null` strategy node, given no
  phase-keyed liveness test can ever read it as claimed.

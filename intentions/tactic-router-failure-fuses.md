---
id: tactic-router-failure-fuses
kind: tactic
statement: "router failure fuses: sweep-written per-node no-progress counter
  (cap 2 → office_hours park) and systemic breaker (correlated-dead-claim quorum
  → born-parked incident tactic gating all selection)"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 /align-strategy fuse-breaker interview:
  the WIP router parks provisioning-time mechanical failures and attempt-caps
  phase-internal fix loops, but has no bound on the silent re-selection loop (a
  worker dying with neither a transition nor a park is re-selected every tick
  forever) and no discriminator between per-node failure and a systemic executor
  outage (a daemon crash-loop or the daemon-down liveness trap makes every claim
  look dead at once, which a naive per-node fuse would convert into a false
  mass-park of the whole queue). Doctrine recorded in the strategy's
  fuse-breaker clarification and failure-containment condition; this draft
  carries the implementation design."
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
office_hours:
  reason: "graph-commit: mechanical-unresolved — 1 field(s) diverged across
    concurrent writes and could not be auto-merged (layers 1-3 exhausted)"
  since: 2026-07-25
  recommendation: >-
    A concurrent writer landed an overlapping edit to this node while this
    session's edit was in flight; this writer's content was NOT landed. This
    session's unlanded content is preserved at
    /tmp/tmp.5q83lp7pJ1/tactic-router-failure-fuses.md (this machine only — may
    not survive past this session). Recommended: the losing writer re-reads the
    current origin/main content, manually merges in its intended edit, and
    re-runs graph-commit on the merged result — that same commit clears this
    office_hours park. A third session encountering this park while the loser is
    still working should wait rather than attempt its own merge (the mailbox
    discipline).


    Diverged field 'attention' on tactic-mechanical-park-producers:
      this session's value: null
      origin/main's value: {"boost":85,"override":null,"rationale":"Author-directed 2026-07-25: the queue-serialization work (dispatch-queue claim integrity, office-hours drain claiming, and the cross-queue landing path) is the current focus. Own boost 85 composes with the +5 inherited from strategy-graph-native-dispatch to an authored 90 — exact parity with tactic-graph-router-live-worker-read-robust, the existing author-set boost on this same defect class — and deliberately below strategy-main-health's standing 100 so the main-health signal keeps its recorded dominance."}
pace_exempt: false
rounds: null
attributes: {}
---
# router failure fuses: sweep-written per-node no-progress counter (cap 2 → office_hours park) and systemic breaker (correlated-dead-claim quorum → born-parked incident tactic gating all selection)

Draft — implementation design retained from the 2026-07-07 /align-strategy
interview (retain-not-refine; a later /align-tactics round finalizes).
Doctrine home: the strategy's fuse-breaker clarification (2026-07-07) and
its failure-containment condition — this body is mechanism detail only.

## Interview audit — what exists vs the gaps

Guards already in the WIP router:

- Provisioning-time mechanical failures park immediately with reason +
  next-steps (`dispatch-graph-tick.js` step 3 → `park-node`; any non-zero
  provision exit).
- Phase-internal content-fix loops are attempt-capped
  (`execution.attempts`, legacy qa-fix `CAP=2` parity;
  `tactic-graph-router-transitions` Unit 1).
- Strategy rounds cap at 2 (`rounds.count < 2`, at cap → park).

Gap A — silent no-progress loop: a worker ending with neither a
transition write nor a park leaves no durable failure record; the ledger
sweep clears its claim and the next tick re-selects, forever. The legacy
Stop-hook "phase exited before completion" park was this fuse; no
graph-native analog existed. `dispatch-graph-execute` likewise retries
`spawn-failed` every tick with no fuse.

Gap B — systemic false fuse: a daemon crash-loop (motivating scenario: a
misconfigured fan-out exceeding memory, crashing daemon/system, killing
tick and workers together) or the daemon-down liveness trap (dead daemon
⇒ `claude agents --json` reads empty ⇒ every claim looks dead at once)
makes all nodes fail identically — a naive per-node fuse mass-parks the
whole queue falsely; no fuse at all loops the crash every tick. A tick-end
classifier is blind (the tick dies in the crash); a canary probe is blind
(it passes whenever the daemon recovered enough to run it).

## Design

Ordering is the load-bearing choice: **sweep → classify → gate → fan
out**, all before selection, in the tick that follows the failure.

Per-node fuse (node-local gate):

- Strike definition: the sweep finds a dead claim (liveness rule,
  strategy clarification 13) whose node shows neither a transition write
  (forward or backward) since the claim nor an `office_hours` park — the
  worker died silently or exited without progress.
- Counter home: an `execution.attempts` entry (e.g.
  `attempts.no_progress`) — frontmatter state, written via graph-commit,
  never entering the tactic-scope hash (parity with attempts/markers/park
  writes).
- Cap 2 (legacy CAP=2 parity): the second consecutive strike parks that
  node to `office_hours` with the failure history (dispositions,
  timestamps) as reason plus a next-steps recommendation (condition 6
  contract). Any successful transition resets the counter to 0.
- Non-strikes: the start-gate `skipped` disposition (correct yield to a
  freeze/park/phase change) and a worker that parked its own node.
- Scope: a tripped node fuse blocks only that node — blocked on
  office-hours like any parked node; selection elsewhere proceeds.

Systemic breaker (the only global gate):

- Classification, in the sweep before selection: correlated death = at
  least 3 simultaneously dead no-progress claims constituting the prior
  tick's selection (all-or-quorum). Below the ≥3 floor, failures strike
  per-node (the cap-2 fuse still catches real loops at small selections;
  worst false cost is 2 node-parks, bounded and human-recoverable).
- On trip: write NO per-node strikes. Write one incident tactic via
  graph-commit — born `office_hours`-parked, `serves:
  [strategy-graph-native-dispatch]`, carrying the correlated-failure
  evidence (node ids, dispositions, liveness source, tick id/timestamps)
  and a next-steps recommendation. Identification for the gate: an
  `attributes.router_breaker: true` marker on the incident tactic.
- Gate: while an unresolved breaker tactic exists (parked, not pruned),
  selection selects nothing — checked before fan-out, so the
  crash-loop scenario is bounded to one crash.
- Reset: human-only, via the normal interactive un-park
  (clarification 4). No auto-reset (would resume a crash loop); no
  breaker state in dispatch.config — config keeps tunables only (quorum
  floor, caps).

Integration points:

- `tactic-graph-router-transitions` Unit 2 (reconciler sweep) is the
  natural home for strike accounting and breaker classification; the
  selector (`select-targets.ts` / `router.ts`) gains the breaker-gate
  check and already skips office_hours-parked nodes for the node-local
  gate.
- `dispatch-graph-execute` spawn-failure retries fold into the same
  strike accounting (a spawn-failed node with no subsequent progress is
  a no-progress cycle).
- Bootstrap parity (strategy clarification 15): an emulating session
  owes strike accounting and the pre-selection breaker check before
  fanning out.
- No recovers edge (clarification 26 precedent): the fuse bounds
  executor-failure blast radius; it does not reduce executor reliance.

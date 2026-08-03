---
id: tactic-router-failure-fuses
kind: tactic
statement: "router failure fuses, re-scoped to the terminal trichotomy: a
  reap-without-declaration fires a ONE-strike fuse parking the node to
  office_hours, and a correlated-dead-claim quorum trips a born-parked breaker
  incident tactic gating all selection"
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
  carries the implementation design. RE-SCOPED 2026-07-29 (/align-strategy
  interview, author-specified): the original draft's per-node no-progress
  counter with cap 2 is superseded. Containment is no longer a strike counter at
  all — a pass that declares none of progression / bounded retry / park has not
  ended, so its session is not reaped, and the node freezes behind the
  concurrency controls with the held session as the debugging artifact.
  dispatch-self-close already implements that direction (it HOLDs absent a
  matching marker). What remains for this tactic is the residual backstop only:
  a pass that ends undeclared AND is reaped anyway, leaving the node selectable
  with nothing recorded. That fires on the FIRST occurrence, because every
  recognized transient class is already contained without a second chance (an
  undeclared mid-pass death is not reaped; a failed launch consumes nothing),
  making a reap-without-declaration always a defect of the reaping path. The
  systemic-breaker limb is unchanged. Two leaks must be closed for this fuse to
  be sound, and are tracked separately: tactic-claim-containment-durable-anchor
  (the freeze depends on the daemon-backed session registry, so a registry loss
  frees the node without firing the fuse) and
  tactic-terminal-declaration-verified-against-node (the declaration is a
  job-dir marker decoupled from the graph write, so a marker-without-write reaps
  while the fuse sees a valid declaration). This tactic should be planned after
  both."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    Parked at an /align-tactics tactic-target round, 2026-08-03. Two independent

    findings block finalizing this tactic's plan today.


    (1) Recorded ordering unmet, one leg unverifiable. This tactic's own
    rationale

    directs it be planned AFTER both tactic-claim-containment-durable-anchor and

    tactic-terminal-declaration-verified-against-node close the two leaks that

    make the underlying claim-freeze mechanism sound ("Two leaks must be closed

    for this fuse to be sound... This tactic should be planned after both.").

    Neither has landed. tactic-claim-containment-durable-anchor is itself

    born-parked (since 2026-07-31) awaiting an author ratification of WHERE the

    durable claim anchor lives (graph field vs. reservation-ledger extension vs.

    no new record) — and that park's own text says the answer determines whether

    condition 10 ("Breaker state never lives outside the graph") binds THIS

    tactic's per-claim evidence anchor or only the tripped-breaker incident

    record. tactic-terminal-declaration-verified-against-node is an unplanned

    draft (phase: null). This session cannot ratify the claim-anchor location

    itself, so the ordering blocker is unverifiable from the graph alone.


    (2) Major scope collision, newly discovered this round. This tactic's

    re-scoped (2026-07-29) design says "what remains for this tactic is the

    residual backstop only" — a per-node one-strike fuse parking a node to

    office_hours on reap-without-declaration. That exact mechanism has since
    been

    designed, built, and merged under a DIFFERENT, independently-filed tactic:

    tactic-phase-terminal-requires-disposition (PR #3004, merged

    2026-07-31T20:15:44Z — terminal_without_disposition_sweep in

    lib-frozen-session-park.sh, wired into dispatch-tick on both cadences,

    now at phase: main-qa). It was filed the same week from a different angle

    (grouped with tactic-denied-command-parks-node and

    tactic-standdown-winner-liveness) with no cross-reference to this tactic. So

    the per-node-fuse half of this tactic's statement is very likely moot, and

    only the systemic-breaker half (correlated-dead-claim quorum tripping a

    born-parked incident tactic gating all selection) remains live scope — but

    rewriting this tactic's own statement/scope on that judgment is an author

    call, since it changes what the tactic is for, not something this session

    should decide unilaterally.
  since: 2026-08-03
  recommendation: |-
    In one /align-strategy or office-hours sitting citing this park: (a) ratify
    tactic-claim-containment-durable-anchor's durable-claim-anchor location —
    this decision also settles the systemic breaker's evidence-anchor design,
    per that park's own cross-reference; (b) confirm the per-node fuse half of
    this tactic is superseded by tactic-phase-terminal-requires-disposition and
    re-scope this tactic's statement/body to the systemic-breaker half only (or
    close it outright if the breaker gets refiled as its own tactic). Then clear
    this park and re-run /align-tactics tactic-router-failure-fuses to finalize
    the (now narrower) plan.
  session_type: requirement-discovery
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
- Cap 2 (legacy CAP=2 parity): the second consecutive strike converts to a
  tracked hold, not a park. `hold-node <id> --kind no-progress` mints (or
  reopens) that node's hold tactic — carrying the failure history
  (dispositions, timestamps) as reason plus a next-steps recommendation
  (condition 6 contract) — and appends `blocked_by: [<hold-id>]` to the
  struck node in the same graph-commit. The struck node's own `office_hours`
  stays null: per the 2026-07-25 park-taxonomy clarification
  (`tactic-mechanical-park-producers`), a mechanical hold is a `blocked_by`
  edge against a tracked fix tactic, never a park on the work item; the
  born-parked hold tactic is what enters the office-hours queue. Any
  successful transition resets the counter to 0.
- Non-strikes: the start-gate `skipped` disposition (correct yield to a
  freeze/park/phase change) and a worker that parked its own node.
- Scope: a tripped node fuse blocks only that node — held on a `blocked_by`
  edge against its hold tactic, exactly like any node with an unresolved
  blocker; selection elsewhere proceeds. Resolving the hold tactic (phase →
  done, then prune, which repairs the inbound edge) re-admits the node on
  the very next tick with no write on the node itself (`blockersComplete`,
  `packages/intentionsutil/src/router.ts`).

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

## Landing-order constraint (recorded 2026-07-30 by the dispatch bootstrap)

**This tactic may not land until node-lane terminal-disposition declaration
coverage is complete.** It is a one-strike fuse that parks a node on
reap-without-declaration, so landing it while any phase-skill lane still drops
its `mark-node-terminal` call converts what is today a session freeze into a
mass park — and one transient fault already produces several at once (the
2026-07-28 16-wide fan-out turned a single `git worktree add` failure at
`provision-node-worktree:118` into three invalid mechanical parks in one tick).

Coverage as of 2026-07-30, after the bootstrap's audit:

- `/qa-fix`'s fix-finalize path — **fixed** (PR #2986 added
  `mark-node-terminal "$N" fix-attempt` as the last durable action; both
  `.claude/skills/qa-fix/references/auto-fix-lane.md` and the condensed
  `SKILL.md` mirror).
- `/dispatch-conflict` **Lane 2** (`SKILL.md:530-606` `resolved`, and its
  sibling `ambiguous` path at `:608-664`) — **still undeclaring.** It calls only
  `dispatch-mark-complete --phase fix-conflicts`, whose legacy `phase-completed`
  marker `dispatch-self-close --node` never reads. It strands nothing today
  because no dispatch tick enters Lane 2 (`SKILL.md:80-81`, `:454-455`; only
  Lane 3 is auto-spawned, by `dispatch-graph-execute:226-276`) — but
  `dispatch-stop.sh:56-63` gates purely on the job name matching an
  `intentions/<id>.md` id regardless of which skill ran inside it, so a human or
  a future router running Lane 2 as a managed `--node` job deadlocks.

So the ordering gate is: **Lane 2 declares (or is proven unreachable by
construction, not by convention) before this fuse arms.** Rank alone does not
enforce this — the interim 20-band puts several Wave-C nodes at the same rank —
so the constraint lives here, in prose, deliberately.

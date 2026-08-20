---
id: tactic-rsi-reprioritization-outcome-audit
kind: tactic
statement: Derive the reprioritization delta and the post-hoc outcome audit —
  did tactics /rsi-evaluate front-loaded actually close faster than the queue
  baseline
owner: ai
status: raw
parent: null
rationale: "Split out 2026-08-11 after adversarial review of the round that
  created strategy-rsi-delegated-prioritization. That strategy names this
  measurement as the sensor for its outcome signal, but the work was filed
  inside tactic-rsi-plan-priority-render, which serves the sibling
  strategy-rsi-plan-surface. That inverts the stay-vs-move principle the same
  round recorded on the parent: completing this audit moves THIS strategy signal
  and does not move the surface child at all, and filing it outside the subtree
  made this strategy signal unreadable until an unrelated tactic landed."
reading: null
serves:
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications:
  - question: This node's blocker was pruned and its implementation file was
      deleted. Where does the work live now, and is the node still worth
      building?
    answer: >-
      (Recorded 2026-08-13 with the prune round that followed the collapse, PR
      3074.) Still worth building — this node is the SENSOR named by
      strategy-rsi-delegated-prioritization's success signal, so pruning it
      would leave that strategy's outcome half with no carrier at all. What
      changes is where it lives and what it waits on.


      The blocked_by on tactic-rsi-plan-priority-render is cleared. That node is
      pruned: it typed the rsi-plan.md task-plan section and added the
      renderer's staleness FLAG kinds, and both the section and the renderer are
      retired doctrine. This also settles a contradiction that was standing on
      main — the body below says 'No blocked_by' in its own Dependencies section
      while the frontmatter carried one. The body was right.


      The carrier moves from the renderer to /rsi-audit. The body says 'All work
      is in packages/intentionsutil/scripts/render-rsi-plan.ts'; that file was
      deleted by the collapse. Both halves — the per-iteration reprioritization
      delta and the post-hoc outcome audit — become /rsi-audit lens sections,
      alongside the per-workflow spend fold that landed with PR 3074. The
      measurement is unchanged: join attributes.priority_log entry dates with
      node closure dates, derived on read, no new stored state, and report
      'insufficient data' honestly rather than a median computed from three
      closures.


      The actuator whose acts it audits is /rsi-audit, not the /rsi-evaluate
      named in the statement and body — that skill was retired unbuilt and its
      node is pruned in this same round. The statement is left as written
      because it is a dated record and this clarification is what makes it
      readable as one.


      Worth stating rather than discovering: nothing can be measured yet.
      attributes.priority_log has no writer anywhere on main — it is prose in
      eight node files — so the join has an empty left side by construction. The
      real prerequisite is tactic-rsi-audit-prioritization-writer, itself
      blocked on tactic-attention-namespaced-rank. That is deliberately NOT
      recorded as a blocked_by: this node can be built against the field as
      written and will read 'insufficient data' until entries exist, which is
      the honest reading and not a failure.
  - question: "Verified against main 2026-08-20: which parts of this node's Scope
      and Verification prose are now stale, and what shape should the work take
      on its new carrier?"
    answer: "(Recorded 2026-08-20 by the /align-tactics per-node finalize pass,
      verifying the body against main.) The Scope prose is stale in three places
      and the finalize round is authorized to rewrite all three — the 2026-08-13
      clarification already moved the carrier, but the body text was never
      brought along. ONE: \"All work is in
      packages/intentionsutil/scripts/render-rsi-plan.ts\" names a file that no
      longer exists (deleted by the PR-3074 collapse;
      tactic-rsi-plan-render-retire sits at phase done), and the Dependencies
      bullet deferring \"Section 6's typing and the renderer's FLAG kinds\" to
      tactic-rsi-plan-priority-render names a node absent from intentions/ since
      the 2026-08-13 prune. TWO: the Verification section requires the output be
      \"reachable from /rsi\", but /rsi today is the per-phase evaluation skill
      that lands ledger findings through dispatch-eval-finding — the report
      surface is /rsi-audit, and the reachability check belongs there. THREE:
      the section shape to copy is the unranked, non-lens Step 7 form in
      .claude/skills/rsi-audit/SKILL.md:200-206 (\"It is not a Nth lens and is
      not ranked by price_proxy_usd\"), not a thirteenth lens. None of this
      changes the measurement, which stands as the 2026-08-13 clarification
      records it: join attributes.priority_log entry dates with node closure
      dates, derived on read, no new stored state, and report \"insufficient
      data\" honestly. Also confirmed this round and NOT a drift:
      attributes.priority_log is still outside the substance fingerprints —
      strategyFingerprint (packages/intentionsutil/src/router.ts:102-111) hashes
      only statement, clarifications, attributes.conditions, serves,
      success_signal, and tooling_goals, and tacticScopeFingerprint hashes
      statement plus body only — so the serving strategy's fingerprint
      conditions on priority_log and measured_impact both hold."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    Requirement ambiguity — the plan for this node cannot be written without an
    author ruling on what observable (a) actually measures.
    strategy-rsi-delegated-prioritization's success_signal says "the median
    closure interval of tactics the model front-loaded, against the dispatch
    queue's baseline closure interval" and never defines EITHER of the two
    quantities this node must compute. (i) The BASELINE COHORT: all closed
    owner:ai tactics in the window (which includes the front-loaded ones), or
    the COMPLEMENT set of closed tactics carrying no attributes.priority_log
    entry? (ii) The INTERVAL START POINT: node creation, first phase entry, or
    the priority_log entry date itself? Grep across intentions/ finds "closure
    interval" only in the signal's own restatement
    (strategy-rsi-delegated-prioritization.md:277 and :287) and in this node's
    body — no clarification anywhere fixes either quantity. The choice is not
    cosmetic. A baseline that includes the front-loaded population is
    self-contaminating and biases the comparison toward parity, weakening the
    very check this node exists to be. And measuring a front-loaded node's
    interval from its boost date (the natural "did the boost help" reading) is
    not commensurable with a control cohort that has no boost date, while
    measuring from creation charges the boosted node for the queue time the
    boost was meant to remove. Different admissible readings make the recorded
    threshold ("front-loaded tactics close at or below the baseline interval
    across consecutive iterations") easier or harder to meet. This is the
    author's call and not a delegated one: this strategy's third recorded
    condition reserves it — "the fitness function stays recorded and
    author-owned — the model optimizes toward it and never redefines it; a
    proposed change to the criterion is an /align escalation, not a delegated
    write". The graph carries direct precedent for escalating exactly this class
    of gap: clarification 8 records that the (b) half's unnamed quantity
    "blocked the implementing tactic", was settled by the author at
    office-hours, and was then enrolled for re-validation as
    tactic-review-band-derivation-ratification. 


    PROPOSED CLARIFICATION, paste-ready — question: "Against which population,
    and from which start point, is observable (a)'s closure interval measured?"
    Proposed answer, for the author to ratify or overturn: Against which
    population, and from which start point, is observable (a)'s closure interval
    measured? Proposed answer for author ratification: the baseline cohort is
    the COMPLEMENT — closed owner:ai tactics carrying no attributes.priority_log
    entry in the window — so the front-loaded set never contaminates its own
    control; and the interval runs from node creation to the phase-done commit
    date for BOTH cohorts (the quantity read-sensors.ts:576-599 already
    derives), with the priority_log entry date used only to partition the two
    cohorts and to bound the per-iteration delta, never as a start point — a
    boost-dated start would make the two cohorts incommensurable. Rationale for
    the author to accept or overturn: this is the stricter of the admissible
    readings and the only one under which a front-loaded cohort can genuinely
    score WORSE than baseline, which the node's own body requires ("a sustained
    result showing front-loaded nodes closing no faster than baseline is
    evidence the delegated reordering is not earning its authority"). If the
    author prefers the boost-dated start, the threshold's meaning changes and
    the strategy's success_signal text should change with it.


    NOT blocking, recorded so the resuming pass need not re-derive it. (1) No
    Side A condition failed: strategyFingerprint
    (packages/intentionsutil/src/router.ts:103-112) hashes only statement,
    clarifications, attributes.conditions, serves, success_signal and
    tooling_goals, so conditions 2 and 5 — attributes.priority_log and
    attributes.measured_impact staying outside the substance fingerprints — both
    hold. (2) The deliberate ABSENCE of a blocked_by on
    tactic-rsi-audit-prioritization-writer is already recorded in this node's
    body and must be preserved: this node is buildable against the field as
    written and reads "insufficient data" until entries exist, which is the
    honest reading and not a failure. (3) The empty attributes.priority_log is
    empty BY CONSTRUCTION (zero code on main — grep over packages/,
    .claude/skills, .claude/workflows and .claude/hooks returns only prose at
    .claude/skills/rsi-audit/SKILL.md:474 and :480), not an unmeasured backlog.
    (4) The right side of the join DOES exist and needs no new derivation:
    readLifecyclePhaseHistory
    (packages/intentionsutil/scripts/read-sensors.ts:536, the per-path
    phase/date collection at :579-599) already derives a per-tactic latest
    phase-done date behind an owner:ai gate, and gitEntryDate
    (packages/intentionsutil/scripts/ledger-census.ts:154) already derives a
    node's first-add date. (5) Caveat on the other closure source:
    execution.completion.mergedAt (packages/intentionsutil/src/schema.ts:665) is
    present on only 103 of the 160 phase:done nodes, so a median over it alone
    is survivorship-biased — the interface's own comment at :660-663 names that
    hole. 


    MECHANICAL NOTE on this round, not a graph judgment: two of the six Workflow
    subagents died on a deterministic StructuredOutput retry cap (the
    clause-coverage evidence agent and one of three reuse hunts). The Opus drift
    agent itself ran to completion and this park is its verdict, independently
    corroborated by the caller thread, which flagged the same start-point gap
    before the Workflow ran. The Side A pass is therefore partly unevidenced by
    the dead clause agent — but conditions 2 and 5 were verified directly
    against router.ts as noted above, and the remaining conditions govern
    attention writes and ledger merging, which this read-only measurement node
    does not perform.
  since: 2026-08-20
  recommendation: "Rule on the proposed clarification above, then clear the park
    and re-run /align-tactics tactic-rsi-reprioritization-outcome-audit — the
    finalize needs nothing else. Three dispositions, in the order they are most
    likely right. (A) RATIFY AS PROPOSED — baseline = the complement cohort
    (closed owner:ai tactics with no priority_log entry in the window); interval
    = node creation to phase-done commit date for BOTH cohorts; the priority_log
    entry date partitions the cohorts and bounds the per-iteration delta but is
    never a start point. This is the stricter admissible reading and the only
    one under which the front-loaded cohort can genuinely score WORSE than
    baseline — which this node's own body demands (\"a sustained result showing
    front-loaded nodes closing no faster than baseline is evidence the delegated
    reordering is not earning its authority\"). Record it as a clarification on
    strategy-rsi-delegated-prioritization via /align. (B) OVERTURN toward a
    boost-dated start — if you want the interval to measure \"did the boost
    help\" from the boost forward, say so; but note the two cohorts then become
    incommensurable (the baseline cohort has no boost date by construction), so
    the threshold's meaning changes and success_signal.threshold should be
    rewritten in the same /align round rather than left as-is. (C) DEFER THE
    WHOLE NODE — if the definition is genuinely not settleable until real
    priority_log entries exist, say so and leave this node parked; it then waits
    on tactic-rsi-audit-prioritization-writer (itself blocked_by
    tactic-attention-namespaced-rank) rather than on a ruling. Note this is a
    real cost, not a neutral hold: until this node lands,
    strategy-rsi-delegated-prioritization's outcome half has no carrier and its
    signal cannot be read at all. Whichever you pick, the ruling belongs on the
    STRATEGY (the criterion is the strategy's), not on this tactic — a per-node
    /align-tactics session may not write the serving strategy, which is why this
    is in front of you rather than already recorded. Related and worth ruling in
    the same sitting: tactic-review-band-derivation-ratification is the
    born-parked re-validation of the SAME signal's (b) half, settled on trust in
    2026-08-12."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Derive the reprioritization delta and the post-hoc outcome audit — did tactics /rsi-evaluate front-loaded actually close faster than the queue baseline
## Scope (split out 2026-08-11 after adversarial review)

This is the **sensor** named by `strategy-rsi-delegated-prioritization`'s
success signal. Until it lands, that strategy's outcome half — observable
(a), "the median closure interval of tactics the model front-loaded, against
the dispatch queue's baseline closure interval" — cannot be read at all.

All work is in `packages/intentionsutil/scripts/render-rsi-plan.ts`. It sits
here rather than under the surface child because *deriving* the measurement
answers to this strategy; *rendering* it into rsi-plan.md is the surface
child's concern, and the two happen to share a file.

### Per-iteration reprioritization delta

Render what `/rsi-evaluate` moved this iteration, from `attributes.priority_log`
entries dated within it. This is the "what changed" half — it reports the
model's actions without judging them.

### The outcome audit

Derived at render time by joining `priority_log` entry dates with node closure
dates: **did the nodes the model front-loaded close faster than the queue's
baseline closure interval?** No new stored state — derived-on-read, the same
doctrine as rank itself.

Render **"insufficient data"** honestly until enough reprioritized nodes have
closed to support a median. A confident number computed from three closures is
worse than an admission, because this section exists to be the check on the
model's own judgment, and a check that always answers is not a check.

This is the post-hoc fitness audit the steelman mitigation on
`strategy-rsi-delegated-prioritization` names. Its adversarial reading matters
as much as its favourable one: a sustained result showing front-loaded nodes
closing *no faster* than baseline is evidence the delegated reordering is not
earning its authority, and should be surfaced as such rather than buried as a
null result.

### Dependencies and boundaries

- **No `blocked_by`.** It reads `attributes.priority_log`, whose schema and
  lint are `tactic-priority-provenance-schema` (also under this strategy), and
  it can be built against the field as currently written. If that tactic
  changes the shape, whichever lands second reconciles.
- The **integrity** half of this strategy's signal — cross-strategy rank
  inversions and attention writes carrying no `priority_log` entry — is *not*
  here. It is `validate-graph` lint, and it belongs to
  `tactic-priority-provenance-schema`.
- Section 6's typing and the renderer's FLAG kinds stayed with
  `tactic-rsi-plan-priority-render` under the surface child.

### Verification

- With no `priority_log` entries anywhere, the section renders "insufficient
  data" and does not error.
- Seed a `priority_log` entry for a node that has since closed, and confirm
  the join finds it and reports its interval against the baseline.
- Confirm the delta lists only entries dated within the current iteration,
  not the whole log.
- Confirm the audit's output is reachable from `/rsi` without hand-computation
  — it is the reading that fills this strategy's signal, so if a human has to
  derive the median themselves, the sensor is not built.

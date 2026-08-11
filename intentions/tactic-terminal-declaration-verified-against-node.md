---
id: tactic-terminal-declaration-verified-against-node
kind: tactic
statement: Derive the terminal declaration from durable node state — the reaper
  verifies the claimed disposition against the node before reaping, closing the
  marker-written-but-graph-write-failed path that reaps a node with nothing
  recorded while the fuse sees a valid declaration
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview; the second of two recorded leaks in the terminal-trichotomy
  containment. mark-node-terminal writes a marker into $CLAUDE_JOB_DIR while the
  graph write (transition-node / park-node) is a separate operation, so the
  marker is a claim ABOUT what happened rather than the happening.
  Graph-write-lands / marker-missing fails safe (dispatch-self-close HOLDs). The
  inverse does not: marker written, graph write failed → session reaped, node
  re-selected unchanged, and the fuse breaker sees a valid declaration so it
  never fires. Fix directions: verify the claimed disposition against the node
  at origin/main before reaping, or make the marker a consequence of the graph
  write rather than a parallel assertion. Distinct from
  tactic-qa-fix-node-terminal-declaration, which covers the opposite (safe)
  direction of a missing declaration."
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
office_hours:
  reason: "(/align-tactics tactic-target round, 2026-08-03.) Drift review surfaced
    one MATERIAL design premise this tactic's plan cannot be authored without,
    which the strategy does not record: WHAT \"VERIFY THE CLAIMED DISPOSITION
    AGAINST THE NODE\" MEANS FOR THE HALF OF THE MARKER VOCABULARY WITH NO
    NODE-STATE CORRELATE. mark-node-terminal validates 8 dispositions
    (packages/intentionsutil/scripts/mark-node-terminal:22-36, case at :74).
    Only advance/demote have a correlate on the node (phase moved per LADDER
    plus a PHASE_COMPLETION_MARKER —
    packages/intentionsutil/src/transitions.ts:33-37,60-90,202, applied at
    packages/intentionsutil/scripts/apply-node-transition.ts:154-212) and park
    has one (office_hours non-null, park-node's own write target). The other
    four have none, by the primitive's own documented definitions: no-claim =
    \"the session held no claim and did nothing (safe to reap)\";
    conflict-resolved = \"the node goes back to the router with no phase write
    of its own\"; conflict-hold = \"the escalation landed on the node's
    tactic-hold-conflict-* HOLD rather than on the node ... no park-node call
    against THIS node id\"; fix-attempt = the pass deliberately leaves phase
    unchanged so CI restarts, its durable correlate being pushed commits
    (.claude/skills/qa-fix/references/auto-fix-lane.md:176-187). For those four
    the against-node check is vacuous and the fallback is a fork with opposite
    risk profiles that the strategy does not price: reap-unverified reopens for
    half the vocabulary exactly the hole this tactic exists to close, while
    hold-on-unverifiable freezes a node whose lane completed its pass with no
    failure to debug — which condition 15 names verbatim as \"a defect of that
    lane\". CUTTING ACROSS THE FORK, a same-day tension between two author
    statements from the 2026-07-29 interview: condition 15 records that \"the
    disposition member ... is the primitive's diagnostic detail, never doctrine:
    dispatch-self-close reads only ^node=, so adding a member never re-stales
    this condition\" (confirmed live at
    .claude/skills/dispatch-propagate/scripts/dispatch-self-close:203-212),
    while clarification 2 sanctions \"the reaper verifies the claimed
    disposition against the node at origin/main before reaping\". A reaper that
    dispatches per-disposition promotes the member to doctrine and breaks the
    additive property — every future member would then need its own verification
    rule. Which statement governs is a condition amendment, and conditions are
    human-decided. RECOMMEND: ratify, in a one-question /align-strategy sitting
    citing this park, (i) which of the three verification options governs — (a)
    verify only where a graph correlate exists and reap the rest unverified; (b)
    hold on unverifiable; or (c) follow the Completion precedent
    (packages/intentionsutil/src/schema.ts:464-487 — two independent sufficient
    proofs, all-null meaning \"unverifiable\" and flagged by a later census
    rather than silently trusted, consumed at
    packages/intentionsutil/scripts/reconcile-graph.ts:112-218), reaping while
    recording the verification outcome as evidence and letting the non-graph
    correlates count as proofs (a pushed branch/commits for fix-attempt and
    conflict-resolved, the tactic-hold-conflict-* node for conflict-hold,
    node-unchanged for no-claim); and (ii) whether making dispatch-self-close
    read `disposition=` amends condition 15's \"diagnostic detail, never
    doctrine / adding a member never re-stales this condition\" clause. Then
    clear this office_hours park and re-run /align-tactics
    tactic-terminal-declaration-verified-against-node to finalize. STATE A FRESH
    SESSION NEEDS: this round already produced a complete reuse set, so a re-run
    is cheap — the gate to extend is dispatch-self-close:203-220
    (marker-presence check, then `exec claude rm` at :222; new HOLD messages
    must go to stderr with stdout silent, per
    .claude/hooks/dispatch-stop.sh:70-95, which calls it as `dispatch-self-close
    --node \"$JOB_NAME\"` and treats the one-line HOLD reason as the canary);
    the fresh-read idiom is transition-node:94-105 (fetch origin main,
    rev-parse/show origin/main:intentions/<id>.md) with parseNodeRaw
    (packages/intentionsutil/src/store.ts:143-145) for a disk-free parse; the
    test file to extend in place is
    .claude/skills/dispatch-propagate/scripts/test-dispatch-self-close.sh
    (helpers selfclose_setup / selfclose_write_state /
    selfclose_write_terminal_marker / selfclose_set_agents_probe; existing
    node-worker cases are Tests 9-16 at :324-468; new cases belong as Tests
    17+), and it needs NO CI wiring change because its SUT lives under
    .claude/skills/dispatch-propagate/scripts/ and is picked up by
    run-unit-tests.sh's test-*.sh glob (:190) — only a NEW script under
    packages/intentionsutil/scripts/ would need an explicit line in
    .github/workflows/unit-tests.yml (hook-tests job, :184-268). Cost caveat to
    weigh during planning: dispatch-self-close runs on every Stop-hook fire, so
    a full `git fetch origin main` on that hot path may be too expensive;
    lib-frozen-session-park.sh's terminal_without_disposition_sweep (:648-700)
    is the mirror-direction precedent for a bounded-timeout/lock-disciplined
    origin/main read. blocked_by stays [] — there is no ordering blocker on the
    parked sibling tactic-claim-containment-durable-anchor: its 2026-07-31 park
    text's parenthetical attributing an ordering to tactic-router-failure-fuses
    is a mis-attribution (that tactic's own rationale orders the fuse after both
    leaks and establishes no order between them). This round's Workflow drift
    result also recorded three further immaterial observations (the
    marker-ordering exploit surface actually sits at reap time not declaration
    time; a three-way scope split with the newly-filed
    tactic-self-close-reap-silent-noop; two attributes.conditions entries — 17
    and 10's breaker-incident limb — describing enforcement not yet built but
    already tracked by open tactics). NONE of these four observations, including
    the ordering correction, were landed onto the strategy from this session: a
    tactic-target /align-tactics session never edits the serving strategy's
    frontmatter (.claude/skills/align-tactics/references/tactic-target.md). All
    four are preserved verbatim in this round's Workflow transcript
    (drift.clarifications_to_add) for a future /align-strategy sitting or
    strategy-target /align-tactics round to land as dated clarifications."
  since: 2026-08-03
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Derive the terminal declaration from durable node state — the reaper verifies the claimed disposition against the node before reaping, closing the marker-written-but-graph-write-failed path that reaps a node with nothing recorded while the fuse sees a valid declaration

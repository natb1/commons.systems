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
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "(/align-tactics tactic-target round, 2026-07-31.) Drift review surfaced
    one MATERIAL design premise this tactic's plan cannot be authored without,
    and which the strategy does not record: WHERE THE DURABLE CLAIM ANCHOR
    LIVES. Three options are live and the round's own gather evidence recommends
    two of them in opposite directions. (a) A first-class graph field on the
    node, following the Execution.fix / office_hours precedent
    (packages/intentionsutil/src/schema.ts:399-444, validated at :554-564 and
    :600-612). Cost: the spawn path carries NO graph write today — its only
    claim-time write is reservation_mark_spawned
    (.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:159) into
    the file ledger — so this adds a graph-commit round trip (scratch branch + 4
    CI checks, packages/intentionsutil/scripts/graph-commit:11-27) to every
    node-worker spawn, a new per-selection write volume and landing-lock
    contention that condition 2 prices as 'negligible at fleet concurrency'. (b)
    An extension of the file reservation ledger
    (.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh), which
    already is a durable, atomically-written, project-root-relative record with
    a sweep that reconciles against the daemon registry. Cost: sweep rule (a)
    ('live-worker-redundant', :593-596) deliberately CLEARS the marker the
    instant a live named session registers — handing authority back to the
    registry at exactly the moment a freeze anchor must persist — so the option
    requires reversing that ledger's documented pace-budget/dedup design intent,
    the same class of unilateral reversal a 2026-07-31 clarification already
    ruled out of a single tactic's scope for the busy-worker filter. (c) No new
    record at all: a reconciler deriving 'a pass started and never declared'
    from state that already lands durably (the provisioned node-id
    worktree/branch, the PR). This is the crash-only reading the author DIVERGED
    from on 2026-07-29 for the declaration marker, on the ground that
    turn-yield-versus-terminal is knowledge only the session holds — but that
    ground does not transfer to the claim side, where 'a pass started' IS
    reconstructable from durable state, so the divergence does not settle it.
    Cutting across all three: condition 10 records 'Breaker state never lives
    outside the graph', and whether that binds the fuse's per-claim evidence
    anchor or only the tripped-breaker incident record is unrecorded either way.
    Four immaterial observations from this same drift review landed as dated
    clarifications on strategy-graph-native-dispatch alongside this park (no
    author action needed on those). Recommend: ratify, in a one-question
    /align-strategy sitting citing this park, where the durable claim anchor
    lives (graph field on the node vs. reservation-ledger extension vs. no new
    record) and whether condition 10's 'Breaker state never lives outside the
    graph' binds the fuse's per-claim evidence anchor or only the
    tripped-breaker incident record; then clear this office_hours park and
    re-run /align-tactics tactic-claim-containment-durable-anchor to finalize —
    the round already produced a complete reuse set (worktree_has_live_session
    at lib-claude-agents.sh:770-876 as the predicate to supersede; the
    FixState/office_hours schema precedent; lib-reservation-ledger.sh's
    write/sweep/origin-token machinery; check-node-selection.ts:141-178 for the
    read-side helper shape; dispatch-reclaim-audit as the existing template for
    quantifying how often registry loss actually strands a claim) and no
    ordering blocker (tactic-router-failure-fuses records this node must be
    planned first in its chain, before itself and before
    tactic-terminal-declaration-verified-against-node)."
  since: 2026-07-31
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Anchor a claimed node's freeze in durable state rather than the daemon-backed session registry, so a registry loss cannot silently free an undeclared pass without firing the fuse

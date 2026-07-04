---
id: strategy-token-economy
kind: strategy
statement: The prepaid token allowance converts fully into tactic closure —
  utilization near 100%, closure velocity at or above arrival
owner: human
status: refining
parent: strategy-financial-sustainability
rationale: "Claude access is prepaid (Max 20x plan): the marginal token is sunk
  cost, so the economy is throughput, not savings. The two failing states are
  an under-utilized weekly allowance (paid capacity idle) and an allowance
  burned without closing work (claude-eligible tactics arriving faster than
  they close). Efficiency mechanisms — per-phase model and effort routing,
  context discipline, error hygiene — are throughput levers: an Opus token
  draws the weekly allowance several times faster than a Sonnet token, so
  routing and context discipline convert the same allowance into more closed
  tactics. Dollars enter only at plan renewal, which the parent
  strategy-financial-sustainability's runway rule owns. The legacy dispatch
  router embodies five such mechanisms (phase→model routing with the
  audit-written policy loop, phase→effort routing, context-pack and
  Explore-subagent context discipline, the pace curve, and the
  /dispatch-token-audit measurement itself); only the pace curve has a graph
  home (strategy-graph-native-dispatch clarification 14). This strategy is the
  durable home for the rest, so the requirements survive
  tactic-legacy-router-removal. Measurement precedes control: the token audit
  is this strategy's sensor, and its attribution must survive the graph-native
  migration (see the attribution-parity clarification on
  strategy-graph-native-dispatch). The strategy also manages the 'promote the
  vendor's growth via spend' divergence imported by delegation-anthropic-claude:
  on prepaid terms that import is bounded at plan price and reviewed at
  renewal, which is its alignment-of-attachments content."
reading: null
gap: null
serves:
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: Why a standing strategy rather than clarifications on
      strategy-graph-native-dispatch?
    answer: The concern outlives the migration and carries its own signal and
      conditions — token economy was managed before the graph-native router
      and continues after the legacy router is deleted. Placement decided in
      interview — a new strategy holding the standing requirements, plus one
      parity clarification on strategy-graph-native-dispatch covering what the
      migration specifically must carry over, mirroring how pace parity was
      recorded there (clarification 14). Recorded 2026-07-04 interview.
  - question: What does token optimization mean on a prepaid plan?
    answer: Throughput per allowance, not spend reduction. The success signal
      is dual — weekly allowance utilization near 100%, and claude-eligible
      tactic closure velocity at or above arrival. Full utilization with a
      growing backlog fails the signal — the response is to operate more
      efficiently (routing, context discipline), not to spend less. The
      dollar-denominated figures in the token audit remain useful as
      allowance-consumption proxies for ranking, not as a bill to minimize.
      Recorded 2026-07-04 interview.
  - question: Which routing decisions may the control loop make automatically?
    answer: Only those grounded in yield metrics whose denominator the routed
      phase can actually move. The 2026-07-03 audit's qa→Opus promotion is a
      measurement artifact — qa's fixes route through /implement-unit
      subagents and never land in the outcome envelope's fixes_applied, so
      pooled qa hit_rate reads 0 structurally (0 in-envelope fixes against 108
      findings across 84 sessions) regardless of how well the cheap model
      performs. Promotions from such metrics stay untrusted until the
      accounting is fixed or the phase routes on a metric it can move (detail
      retained on tactic-outcome-envelope-qa-accounting). Recorded 2026-07-04
      interview.
  - question: Do the skill-contract disciplines get recorded, or stay folklore?
    answer: "Recorded, two families. Context discipline: Explore-subagent
      fan-out returning compact findings, clean-context phase boundaries, and
      model sonnet/haiku on subagents spawned from Opus- or Fable-priced
      parents are contract requirements for the align skill family, inheriting
      the plan-issue/implement-unit discipline — the over-120k-context lens
      was more than half of all measured spend in the 2026-06-26→07-03
      window, dominated by unattributed sessions and plan-issue.
      Initialization defaults: background sessions that author no code
      (diagnostics, reminders, digest, main-qa verification) launch on Sonnet
      instead of inheriting Opus (detail retained on
      tactic-noncodegen-session-model-defaults). Recorded 2026-07-04
      interview."
tooling_goals:
  - kind: sensor
    statement: token-audit aggregate with node-id attribution — weekly
      allowance utilization plus per-node/per-phase spend and yield, joined by
      the intention node id (extends /dispatch-token-audit)
  - kind: sensor
    statement: velocity series — claude-eligible tactics created vs closed per
      strategy subtree (shared with strategy-autonomous-execution via
      tactic-attention-surface-velocity-pace)
  - kind: actuator
    statement: phase→model and phase→effort routing in the graph-native launch
      chain, with the fail-closed demotable allowlist and the audit-written
      policy loop
success_signal:
  observable: weekly allowance utilization together with claude-eligible
    tactic closure velocity (created vs closed)
  sensor: pace telemetry (rate_limits.json weekly utilization) plus the
    office-hours velocity series (tactic-attention-surface-velocity-pace) and
    the token-audit aggregate
  threshold: utilization near 100% of the weekly allowance while open
    claude-eligible tactics are non-increasing (closure at or above arrival);
    full utilization with a growing backlog fails the signal
  is_proxy: true
attention: null
attributes:
  conditions:
    - the plan stays prepaid with a weekly allowance (Max 20x); metered
      per-token pricing inverts the economy to spend-minimization and this
      strategy re-derives from its virtues
    - the token audit stays runnable and attributable across the router
      migration — a session that cannot be attributed to a node and phase is
      invisible to every control loop here
    - routing automation acts only on yield metrics whose accounting is
      verified (the qa fixes_applied gap is open as of 2026-07-04)
    - pace machinery stays operational config outside the graph
      (strategy-graph-native-dispatch clarification 14); this strategy records
      requirements, not machinery
---
# The prepaid token allowance converts fully into tactic closure — utilization near 100%, closure velocity at or above arrival

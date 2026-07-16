---
id: strategy-token-economy
kind: strategy
statement: The prepaid token allowance converts fully into tactic closure —
  utilization near 100%, closure velocity at or above arrival
owner: human
status: refining
parent: strategy-financial-sustainability
rationale: "Claude access is prepaid (Max 20x plan): the marginal token is sunk
  cost, so the economy is throughput, not savings. The two failing states are an
  under-utilized weekly allowance (paid capacity idle) and an allowance burned
  without closing work (claude-eligible tactics arriving faster than they
  close). Efficiency mechanisms — per-phase model and effort routing, context
  discipline, error hygiene — are throughput levers: an Opus token draws the
  weekly allowance several times faster than a Sonnet token, so routing and
  context discipline convert the same allowance into more closed tactics.
  Dollars enter only at plan renewal, which the parent
  strategy-financial-sustainability's runway rule owns. The legacy dispatch
  router embodies five such mechanisms (phase→model routing with the
  audit-written policy loop, phase→effort routing, context-pack and
  Explore-subagent context discipline, the pace curve, and the
  /dispatch-token-audit measurement itself); only the pace curve has a graph
  home (strategy-graph-native-dispatch clarification 14). This strategy is the
  durable home for the rest, so the requirements survive
  tactic-legacy-router-removal. Measurement precedes control: the token audit is
  this strategy's sensor, and its attribution must survive the graph-native
  migration (see the attribution-parity clarification on
  strategy-graph-native-dispatch). The strategy also manages the 'promote the
  vendor's growth via spend' divergence imported by delegation-anthropic-claude:
  on prepaid terms that import is bounded at plan price and reviewed at renewal,
  which is its alignment-of-attachments content."
reading: null
gap: null
serves:
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: Why a standing strategy rather than clarifications on
      strategy-graph-native-dispatch?
    answer: The concern outlives the migration and carries its own signal and
      conditions — token economy was managed before the graph-native router and
      continues after the legacy router is deleted. Placement decided in
      interview — a new strategy holding the standing requirements, plus one
      parity clarification on strategy-graph-native-dispatch covering what the
      migration specifically must carry over, mirroring how pace parity was
      recorded there (clarification 14). Recorded 2026-07-04 interview.
  - question: What does token optimization mean on a prepaid plan?
    answer: Throughput per allowance, not spend reduction. The success signal is
      dual — weekly allowance utilization near 100%, and claude-eligible tactic
      closure velocity at or above arrival. Full utilization with a growing
      backlog fails the signal — the response is to operate more efficiently
      (routing, context discipline), not to spend less. The dollar-denominated
      figures in the token audit remain useful as allowance-consumption proxies
      for ranking, not as a bill to minimize. Recorded 2026-07-04 interview.
  - question: Which routing decisions may the control loop make automatically?
    answer: "Only those grounded in yield metrics whose denominator the routed phase
      can actually move. The 2026-07-03 audit's qa→Opus promotion is a
      measurement artifact — qa's fixes route through /implement-unit subagents
      and never land in the outcome envelope's fixes_applied, so pooled qa
      hit_rate reads 0 structurally (0 in-envelope fixes against 108 findings
      across 84 sessions) regardless of how well the cheap model performs.
      Promotions from such metrics stay untrusted until the accounting is fixed
      or the phase routes on a metric it can move (detail retained on
      tactic-outcome-envelope-qa-accounting). Recorded 2026-07-04 interview.
      Amended 2026-07-16: superseded — no routing decision is applied
      automatically. The audit-written policy loop is now advisory: it surfaces
      routing recommendations grounded in verified yield metrics, and every
      routing change (demotion, promotion, or effort tuning) requires explicit
      author approval before implementation. See clarification 10."
  - question: Do the skill-contract disciplines get recorded, or stay folklore?
    answer: "Recorded, two families. Context discipline: Explore-subagent fan-out
      returning compact findings, clean-context phase boundaries, and model
      sonnet/haiku on subagents spawned from Opus- or Fable-priced parents are
      contract requirements for the align skill family, inheriting the
      plan-issue/implement-unit discipline — the over-120k-context lens was more
      than half of all measured spend in the 2026-06-26→07-03 window, dominated
      by unattributed sessions and plan-issue. Initialization defaults:
      background sessions that author no code (diagnostics, reminders, digest,
      main-qa verification) launch on Sonnet instead of inheriting Opus (detail
      retained on tactic-noncodegen-session-model-defaults). Recorded 2026-07-04
      interview. Amended 2026-07-16: the 'sonnet/haiku on subagents of Opus
      parents' rule is now a special case, not universal — under clarification
      10 the /align-tactics orchestrator is itself Sonnet and deliberately
      spawns an Opus plan-creation subagent (a cheap parent with one expensive
      child); the cost-discipline still governs the Explore reuse-hunt fan-out.
      See clarification 10."
  - question: What did /align-tactics round 1's drift review find?
    answer: "Immaterial refinements, no condition failures. (a) qa-fix's fix lane
      already maintains a landed-fix tally (SKILL.md Step 3.7), so the
      metric-integrity artifact is better described as metric shape than missing
      accounting: hit_rate mismeasures a phase whose designed output is triage
      and follow-ups (68 filed, 0 in-lane fixes in the 2026-06-26→07-03 window);
      the remedy is per-phase metric selection in the policy generator, which
      clarification 3 already licenses. (b) The audit's 'qa-verify polling loop'
      reading was wrong — the 405 repeated cd calls are per-issue worktree and
      session boots for sibling main-qa follow-ups, with browser-verifiability
      triage running only after the boot; remedy is triage-before-provision
      (tactic-main-qa-triage-before-provision). (c) A live routing bug: /qa-main
      is absent from dispatch-launch-worker's skill→phase map, so qa-main
      sessions inherit Opus despite the recorded main-qa→Sonnet default
      (tactic-noncodegen-session-model-defaults unit 1). Also this round:
      success_signal.sensor renamed to the registry name token-economy for the
      instrument tactic; tactic fingerprints stamped after that edit. Recorded
      2026-07-04 /align-tactics round 1."
  - question: Do /align-strategy and /align-tactics default to Opus, and where is
      that recorded?
    answer: "Yes — the align-family main session (the /align-strategy interview and
      the /align-tactics decomposition) defaults to Opus on both invocation
      paths: the router-launched /align-tactics worker and human-invoked
      interactive /align-strategy and /align-tactics sessions. This is the
      explicit durable-home statement of what clarification 4 already
      presupposes ('subagents spawned from Opus-priced parents' assumes the
      parent session is Opus) and what strategy-graph-native-dispatch
      clarification 17 records as migration-carry while naming this strategy as
      the durable home. It is a deliberate exception to this strategy's general
      Sonnet-for-non-codegen thrust: the /align-strategy interview IS the audit
      (no downstream PR review catches a mis-captured requirement) and
      /align-tactics decomposition is high-stakes to the signal, so a cheaper
      model is a permanent gap in the record, not a recoverable cost saving.
      Explore/Plan fan-out spawned by these sessions stays demotable to Sonnet
      or Haiku per clarification 4. Recorded 2026-07-06 interview. Amended
      2026-07-16: still holds for /align-strategy (interactive-only,
      whole-session Opus), but NOT for /align-tactics — under clarification 10
      the dispatch-launched /align-tactics worker runs a Sonnet orchestrator and
      delegates the decompose-to-signal judgment and per-tactic plan authoring
      to an Opus subagent, rather than running the whole session on Opus. See
      clarification 10."
  - question: Is the align-family Opus default demotable by the audit-written policy
      loop, like other phases?
    answer: "No — it is a floor, exempt from downward demotion. The routing
      actuator's fail-closed demotable allowlist may demote other phases on
      verified yield metrics, but the align family is the audit step itself:
      demoting the audit to optimize its own cost is self-defeating. Only the
      Explore/Plan fan-out under these sessions remains demotable. Recorded
      2026-07-06 interview. Amended 2026-07-16: the floor is deprecated. Under
      clarification 10 there is no per-phase downward-demotion exemption;
      instead all audit-driven routing is advisory and author-gated, which
      protects the high-stakes work without a special allowlist. See
      clarification 10."
  - question: How is the Opus default enforced on the human-invoked interactive
      path, which has no router to set the model?
    answer: "As an intended default plus measurement, not a hard guarantee. The
      mechanism is the skill's SKILL.md model: opus frontmatter where the
      harness honors it (confirmed for context:fork skills such as
      commit-merge-push; unconfirmed for user-invocable main-loop skills, so
      treated as intended-not-guaranteed on the interactive path), and the
      sensor is the token audit's by-node/by-phase attribution (this strategy's
      token-economy sensor), which can read after the fact whether an
      align-family session actually ran on Opus. The enforcement mechanism is
      retained as draft tactic-align-family-opus-default. Recorded 2026-07-06
      interview. Amended 2026-07-16: this enforcement (SKILL.md model: opus
      frontmatter plus after-the-fact audit) now describes /align-strategy,
      which stays whole-session Opus. /align-tactics interactive invocation
      follows the split in clarification 10 (Sonnet orchestrator plus Opus
      plan-creation subagent). See clarification 10."
  - question: Under graph-native phase execution (Shape B), what is the standing
      model-routing default?
    answer: "The top-level phase orchestrator session runs on sonnet; workflow
      subagents run on opus only when the work calls for it — an implementation
      unit whose Recommended model is opus, or an explicitly opus-instructed
      review such as /code-review max and /security-review. Default subagents
      (finders, classifiers, verifiers) stay on sonnet. This generalizes the
      existing sonnet-default node (tactic-noncodegen-session-model-defaults)
      and opus-when-instructed node (tactic-align-family-opus-default) into the
      standing rule for the phase-orchestrator architecture recorded on
      strategy-graph-native-dispatch (Shape B, clarification 24 amended
      2026-07-11). It is a throughput lever, not a spend cut: an opus token
      draws the prepaid weekly allowance several times faster than a sonnet
      token, so pinning orchestrators to sonnet and reserving opus for the
      subagents whose yield justifies it converts the same allowance into more
      closed tactics. Recorded 2026-07-11 interview."
  - question: How does /align-tactics route models (2026-07-16), and does the
      audit-written policy loop still apply routing changes automatically?
    answer: "Three changes, recorded 2026-07-16 interview. (1) The dispatch-launched
      /align-tactics worker no longer runs whole-session on Opus. Its
      orchestration — the mechanical bookkeeping of a decomposition round:
      node-id reservation, park-field writes, the clause-coverage walk, and the
      graph-commit — runs on the Sonnet orchestrator session. Both high-stakes
      cognitive acts are delegated to an Opus subagent: the decompose-to-signal
      judgment (the two-sided drift review and deciding which tactic nodes
      exist) AND each claude-eligible tactic's full plan-body authoring. The
      Explore reuse-hunt fan-out stays demotable to Sonnet or Haiku. This
      relocates the 2026-07-06 Opus requirement (clarification 6) from the whole
      session onto the subagent that does the work the floor protected —
      'decomposition is high-stakes to the signal' is preserved, because the
      decompose judgment and plan authoring are exactly what runs on Opus —
      while cutting the cost of the orchestration around it. It makes
      /align-tactics conform to the Shape B standing default (clarification 9:
      Sonnet orchestrator, Opus subagents where the work calls for it).
      Motivating observation: router-launched /align-tactics workers were
      authoring tactic plans on Sonnet, because the worker launched on Sonnet
      and its Plan subagent inherited that model. (2) /align-strategy is
      unchanged: it is interactive-only (no dispatch launch path) and its
      interview dialectic IS the audit and is non-delegable, so it stays
      whole-session Opus via SKILL.md model: opus frontmatter. (3) The
      align-family Opus floor (clarification 7) is deprecated and the
      audit-written policy loop becomes advisory: it no longer applies ANY
      routing change automatically — demotion, promotion, or effort tuning
      alike. When the audit can demonstrate a task runs on a cheaper model
      without compromising quality (or otherwise warrants a routing change), it
      MUST surface the recommendation; implementation requires explicit author
      approval. This supersedes clarification 3 (which licensed some automatic
      routing) and removes the need for a per-phase floor exemption. Mechanism
      retained as draft tactic-align-family-opus-default (the align-tactics
      split) and tactic-audit-routing-advisory-gate (the advisory policy loop).
      Recorded 2026-07-16 interview."
  - question: May an autonomous worker self-schedule a fallback wakeup while waiting
      on harness-tracked background work?
    answer: "No — the harness re-invokes the session automatically when a tracked
      background Workflow or Task completes, so a self-scheduled short-interval
      ScheduleWakeup fallback only fires redundantly after that
      auto-notification has already resumed and finished the work, producing a
      no-progress round that burns the weekly allowance without closing any
      tactic — this strategy's named failing state, and a case of the 'error
      hygiene' throughput lever the rationale records. Discipline: schedule no
      fallback for harness-tracked work; reserve fallbacks for external state
      the harness cannot observe (a CI run, a deploy, a remote queue), sized to
      that state's change cadence, and for an idle heartbeat with no specific
      signal use a long delay (1200s+, per ScheduleWakeup's own guidance) rather
      than a short poll that misses the prompt cache and fires before anything
      can have changed. Live failure 2026-07-16: a /qa-fix worker (node
      tactic-recovery-drill-firebase, PR #2877) set a 270s fallback while its
      Step 3.5 disposition Workflow ran in the background; the task-notification
      resumed the session and it completed every remaining step first, then the
      270s timer fired on a now-stale prompt with nothing left to do — one
      wasted no-progress round. Recorded 2026-07-16 interview."
  - question: What is the fixed per-session standup cost of a phase-orchestrator
      session, and how is it reduced?
    answer: "A phase-orchestrator session (/implement, /qa-fix, /review-fix) pays a
      large fixed cost to stand up before any tactic-closing work begins, even
      though the work is mostly predetermined outside the metered session — the
      reasoning already lives in a fixed workflow script
      (.claude/workflows/qa-fix.js, review-fix.js) and the deterministic prelude
      already runs in the launcher chain (dispatch-launch-worker ->
      provision-node-worktree -> dispatch-merge-main) before the session exists.
      This standup cost is a context-discipline throughput lever, extending
      clarification 4, with two facets. (1) SKILL-body prose: the harness loads
      the full SKILL.md on invocation and it persists for the whole session;
      Claude Code's own guidance caps SKILL.md at 500 lines with detail moved to
      on-demand reference files, and qa-fix (1,523 lines) and review-fix (1,088)
      run 2-3x over — the fix is the standard, plausible-today Claude Code
      pattern (thin body under 500 lines plus references/*.md loaded only when
      read), not a harness change; confirmed against the Claude Code skills docs
      this round, which corrected an earlier framing that assumed a harness
      lazy-load capability was required. (2) Boot boilerplate: the opening
      tool-call sequence re-derives in-session what is already known outside it
      — N and the worktree path (already prompt args,
      dispatch-launch-worker:164), the PR link (already resolved by the router),
      and the origin/main merge (already done by the launcher); boot judgment
      content is near-zero. review-fix already dropped its in-session merge
      (review-fix/SKILL.md:199-201) and runs ~3-4 boot round-trips; qa-fix has
      not adopted this and re-does the merge (Step 0.5, qa-fix/SKILL.md:227-233)
      plus a redundant second context-pack at ~6-7 round-trips. Discipline: keep
      only args-computation and near-zero-judgment bookends in the metered
      session; push precomputable prelude into the launcher and thin the body to
      references. Measurement precedes control (this strategy's rationale): no
      current audit lens joins the two facets — lens 2 captures the
      tool-round-trip preamble only as generic n-grams, lens 9 the prose
      footprint — so this round retains three draft tactics:
      tactic-phase-standup-audit-lens (a per-phase standup-cost lens, measure
      first), tactic-thin-oversized-skill-bodies (the SKILL-body thinning to
      under 500 lines plus references), and tactic-phase-boot-offload-launcher
      (propagate review-fix's boot-offload to qa-fix plus launcher precompute).
      Two guardrails bind those tactics as conditions: a parity gate — thinning
      or offload must hold phase-success parity, since dropped instruction
      regresses the phase invisibly, and reference files must be linked from
      SKILL.md so the model loads them on demand — and a freshness bound —
      launcher precompute is allowed only for values fixed at launch or produced
      by the launcher's own merge step, never a value that can go stale against
      the merged tree, so qa-fix's diff must stay post-merge. Recorded
      2026-07-16 interview."
tooling_goals:
  - kind: sensor
    statement: token-audit aggregate with node-id attribution — weekly allowance
      utilization plus per-node/per-phase spend and yield, joined by the
      intention node id (extends /dispatch-token-audit)
  - kind: sensor
    statement: velocity series — claude-eligible tactics created vs closed per
      strategy subtree (shared with strategy-autonomous-execution via
      tactic-attention-surface-velocity-pace)
  - kind: actuator
    statement: "phase-to-model and phase-to-effort routing in the graph-native
      launch chain. The audit-written policy loop is advisory (clarification
      10): it surfaces routing recommendations — model/effort demotions and
      promotions — grounded in verified yield metrics, and every routing change
      requires explicit author approval before implementation; no routing change
      is applied automatically. The /align-tactics worker routes a Sonnet
      orchestrator with an Opus subagent for the decompose-to-signal judgment
      and per-tactic plan authoring, the Explore reuse-hunt fan-out demotable to
      Sonnet or Haiku."
success_signal:
  observable: weekly allowance utilization together with claude-eligible tactic
    closure velocity (created vs closed)
  sensor: token-economy
  threshold: utilization near 100% of the weekly allowance while open
    claude-eligible tactics are non-increasing (closure at or above arrival);
    full utilization with a growing backlog fails the signal
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - the plan stays prepaid with a weekly allowance (Max 20x); metered
      per-token pricing inverts the economy to spend-minimization and this
      strategy re-derives from its virtues
    - the token audit stays runnable and attributable across the router
      migration — a session that cannot be attributed to a node and phase is
      invisible to every control loop here
    - routing recommendations are grounded only on yield metrics whose
      accounting is verified (the qa fixes_applied gap is open as of
      2026-07-04), and every routing change requires explicit author approval
      before implementation — the audit-written policy loop surfaces
      recommendations, it never auto-applies (clarification 10)
    - pace machinery stays operational config outside the graph
      (strategy-graph-native-dispatch clarification 14); this strategy records
      requirements, not machinery
---
# The prepaid token allowance converts fully into tactic closure — utilization near 100%, closure velocity at or above arrival

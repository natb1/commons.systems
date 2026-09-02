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
reading: "utilization: 27% weekly; tactics 28d: 310 created / 226 closed (net +84)"
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
      author approval before implementation. See clarification 10. Amended
      2026-08-13: SCOPED, not loosened. This bar governs STANDING POLICY — the
      default a phase runs at for every future run, changed on audit evidence
      the author has not seen. It does not reach PER-INPUT selection inside an
      author-fixed band, which moves one run on properties of that run's own
      diff. Clarification 49 records that carve-out for the review lane,
      together with the three requirements that keep this bar unweakened; a
      mechanism missing any of them is not covered by it."
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
      Recorded 2026-07-16 interview. Amended 2026-07-18: the align-tactics split
      executes as a deterministic Workflow (`.claude/workflows/align-tactics.js`
      via the Workflow tool, /review-fix-shaped), not an ad-hoc per-callsite
      `model: opus` addition — see clarification 14 for the three-tier
      delegation and the office-hours-park autonomy coupling."
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
  - question: What did /align-tactics round 2's drift review find?
    answer: "Immaterial refinements, no condition failures. (a) The success signal
      is now measurable: round-1's instrument tactic-token-economy-sensor is
      done and read-sensors produces a reading (utilization ~7% weekly; tactics
      28d: 231 created / 91 closed, net +140), so no new instrument tactic is
      needed this round. The reading shows both failing states active —
      under-utilization (7% far below 100%, paid capacity idle) and backlog
      growth (net +140, closure below arrival); under-utilization is a
      pace/arrival concern owned by the pace curve
      (strategy-graph-native-dispatch clarification 14), while the routing and
      standup-cost levers this round decomposes address the closure-velocity
      side. (b) Clarification 10's actuator-side 'make the audit-written routing
      policy loop advisory' is already realized by PR #2872, which retired the
      learned/adaptive phase-model-policy (#2028): dispatch-phase-model is now a
      static map with a no-auto-promote invariant and /dispatch-token-audit is
      report-only. tactic-audit-routing-advisory-gate is therefore re-scoped to
      its surviving residual (a structured routing-recommendation output surface
      plus the documented manual approval-and-apply convention), with the
      superseded actuator-change unit dropped per the greenfield-relevance gate
      (clarification 26). (c) Clarification 10's orchestrator-Sonnet half of the
      align-family split is already in place (dispatch-graph-execute hardcodes
      ORCH_MODEL=sonnet), so tactic-align-family-opus-default is scoped to its
      residual: the explicit Opus decompose/plan subagent in align-tactics Step
      3 and the align-strategy model:opus frontmatter. Round 2 decomposes the
      seven retained drafts (the three standup-cost tactics of clarification 12,
      the two clarification-10 routing tactics, the self-claim-collision bug
      from PR #2870, and the OTel-substrate evaluation) into phase:implement
      tactics; none carry a validates edge, as all are off the success-signal
      path the done sensor already measures. Recorded 2026-07-16 /align-tactics
      round 2. Amended 2026-07-18: the align-tactics-split residual is further
      split — PR #2886 lands the model:opus params (increment 1), and the full
      /review-fix-shaped Workflow rearchitecture is retained as draft
      tactic-align-tactics-workflow for a later round; see clarification 14."
  - question: How does the /align-tactics align-family model-routing split
      (clarification 10) execute — an ad-hoc per-callsite model addition, or a
      deterministic Workflow?
    answer: "As a deterministic Workflow, not an ad-hoc per-callsite `model: opus`
      addition. Clarification 10 fixed WHO runs on which model (Sonnet
      orchestrator, Opus for the two high-stakes acts); this clarification fixes
      HOW /align-tactics executes that split: a
      `.claude/workflows/align-tactics.js` invoked through the Workflow tool,
      the same architecture as /review-fix and /qa-fix — NOT `model: opus`
      bolted onto the caller-thread Explore/Plan subagent calls the skill fans
      out today (align-tactics SKILL.md:377, 'runs in the caller's thread ... no
      orchestrator'), which is the fragile shape PR #2886 /
      tactic-align-family-opus-default currently ships. Three-tier delegation:
      (i) SONNET top-level orchestrator — node-id reservation, park-field
      writes, the clause-coverage walk, graph-commit, and assembling node bodies
      from subagent output; it carries no plan substance. (ii) OPUS subagents
      for the key decisions — the two-sided drift-review verdict (which
      conditions failed), the decompose-to-signal judgment (which tactic nodes
      exist), and each claude-eligible tactic's plan-body authoring. (iii)
      SONNET subagents for delegable gathering — the Explore reuse-hunt /
      prior-art scan, the mechanical drift scan (grep the corpus, gather
      candidates), and clause-coverage evidence gathering. Adopt/diverge: ADOPT
      the Workflow, DIVERGE from 'the ad-hoc model-param split is enough' — (a)
      ad-hoc tiering is fragile: any future edit adding a Plan/Agent call
      without `model: opus` silently regresses the highest-stakes act to Sonnet
      (the exact motivating bug in tactic-align-family-opus-default), whereas a
      deterministic script makes the tiering structural; (b) it is consistent
      with clarification 12, which endorses 'the reasoning already lives in a
      fixed workflow script' — the Workflow moves align-tactics' reasoning into
      exactly such a script; (c) /align-tactics is autonomous and never
      AskUserQuestion mid-run, so a Workflow (which cannot run an interactive
      dialectic) is a natural fit. Autonomy-contract coupling: 'never
      AskUserQuestion' holds INSIDE the Workflow — when the plan cannot be fully
      derived from the graph or otherwise needs author intervention, the
      orchestrator parks the tactic node to office_hours via the existing
      three-condition park mechanism (align-tactics SKILL.md:139-186), and the
      resulting office-hours session is where AskUserQuestion legitimately runs
      with the author; the park escape hatch was confirmed present this round.
      Scope: the Workflow is the single autonomous execution model for ALL
      /align-tactics invocations — router-launched and hand-triggered alike;
      there is no separate interactive path, a human invocation just triggers
      the same autonomous flow. /align-strategy stays OUT and remains
      whole-session Opus: its interview IS interactive AskUserQuestion dialectic
      a Workflow cannot run. The clean rule: /align-tactics is autonomous →
      Workflow-able; /align-strategy is interactive → not. Migration is
      brownfield: PR #2886 (tactic-align-family-opus-default) lands the
      model:opus params as increment 1 (a correct subset), then draft
      tactic-align-tactics-workflow carries the full /review-fix-shaped
      rearchitecture, decomposed by a later /align-tactics round; the
      rearchitecture must hold plan-quality/phase-success parity and keep the
      script plus thinned SKILL body within clarification 12's standup-cost
      discipline. Off the success-signal path (no validates edge), measured
      after the fact by the token-economy sensor's by-node/by-phase attribution.
      Recorded 2026-07-18 interview."
  - question: What does a 'no gh, no daemon, no network' annotation on a script
      actually protect — that module's purity, or something else?
    answer: "(Recorded 2026-07-25 interview, author-dictated.) Something else. The
      real contract is to avoid Claude sequencing system or network commands
      that could be done by a script with fewer round trips and fewer tokens.
      The purity of any given module is not the governing concern and may be
      amended when the two conflict; what may not be amended is pushing a
      multi-step system or network sequence back onto Claude's turn loop, where
      every step costs a round trip and its tokens. Applied the same day: the
      office-hours selector should perform its own local `git show origin/main`
      freshness read rather than leaving each caller to re-derive it — see the
      companion clarification on strategy-graph-native-dispatch, recorded
      against the tactic-office-hours-concurrency-dedup design decision that had
      rested on the purity premise. General form for future placement decisions:
      prefer the site that performs a check once inside a script over the site
      that forces callers to repeat it, even when that means widening a module's
      declared dependencies."
  - question: What does 'optimize token usage' mean for the review phase, and what
      is the binding constraint on it?
    answer: (Recorded 2026-07-31 interview.) Throughput, not savings — restated at
      phase level. The review phase was measured at ~20% of all dispatch spend
      in the 2026-07-27→07-31 window, with 31% of its own allowance draw
      concentrated in a single stage. Freeing that draw is valuable because it
      reallocates allowance to non-review work (chiefly implementation), which
      is where closure velocity is actually produced; a saving that does not
      become a closed tactic is worth nothing on prepaid terms. The sanctioned
      lever is structural — batching, deduplication, context reuse, trigger
      narrowing — never removing a lens that produces confirmed findings. See
      the quality-preservation condition added the same day, which binds this.
  - question: Are the owned domain review lenses redundant with the built-in
      /code-review and /security-review lanes?
    answer: >-
      (Recorded 2026-07-31; measured across 18 review runs, 2026-07-27→07-31.)
      No — the redundancy hypothesis was tested and refuted. Of 27
      skeptic-upheld Lane B findings, 7 were true duplicates of a Lane A residue
      item at the same location (verified by comparing descriptions, not merely
      locations), 2 shared a source line but were distinct issues, and 18 (67%)
      were at locations Lane A never flagged. Over the same window
      /security-review produced 1 finding in total, while the owned red-team and
      input-validation lenses produced 27 confirmed findings; the owned lenses
      carry the security signal and are not to be cut on cost grounds. The
      measured 26% duplication is real and is answered structurally by
      cross-lane deduplication, not by removing a lane.


      (Amended 2026-07-31, second interview.) The /code-review half of this
      comparison is void. Transcript evidence shows every one of the 18
      Skill(code-review) calls was rejected with disable-model-invocation, so
      the "Lane A residue" these 27 findings were compared against was produced
      by a general-purpose Opus agent hand-rolling a review, not by the
      built-in. Lane B's redundancy against the real /code-review is therefore
      UNTESTED, not refuted — no measurement of it exists, and the 26%
      duplication figure describes overlap between two owned reviews. The
      /security-review half stands unchanged: that skill carries no
      disable-model-invocation mark and 17 of 18 invocations succeeded, so its 1
      finding across the window is a genuine reading. The conclusion that the
      owned lenses carry the security signal survives on the /security-review
      evidence alone.
  - question: Is api-cost review retained when its measured finding rate is zero?
    answer: "(Recorded 2026-07-31 interview.) Yes. The `firebase` lens is renamed
      `api-cost` and retained. A zero-finding window is read as sampling error,
      not as zero yield: the lens fired on only 5 of 18 runs, so an absence of
      findings is uninformative about its value. Because an api-cost overrun has
      high impact on overall goals, the lens earns its expense even when
      findings are rare, and the correct response to a zero-finding window is
      more sampling rather than less. The lens therefore merges with the `cost`
      lens into a single `api-cost` lens and widens its trigger, deliberately
      raising its draw from ~$14 toward ~$25-30 proxy per 4-day window. This is
      the standing exception to the yield-per-draw ranking that governs every
      other lens."
  - question: Must the adversarial skeptic gate stay independent of finding
      classification?
    answer: "(Recorded 2026-07-31 interview.) Yes — independence is the invariant,
      agent count is not. The gate's value is an independent adversarial read of
      the code, which is what makes its refutation rate trustworthy; folding the
      skeptic call into the `classify` agent would have that agent grade its own
      bucketing, and the gate exists precisely to stop bad Opus fixes landing.
      Efficiency in this stage instead comes from batching skeptics per (run,
      file): the 131 skeptic agents measured in the window spanned only 41
      distinct file groups, a 3.2x reduction available with each file read once
      and one independent adversarial judgment per file preserved."
  - question: What is the scope of cross-lane deduplication between the built-in
      lane and the owned lens lane?
    answer: "(Recorded 2026-07-31 interview.) Deduplication merges Lane A residue
      and Lane B findings into one pool for duplicate elimination and fix
      assignment ONLY. Verify eligibility is unchanged by the merge: Lane A
      residue is never routed into the adversarial skeptic stage, because the
      built-ins already apply their own internal verification and
      re-skepticizing the ~103 residue items measured per window would add
      roughly 100 agents and cancel the batching gain entirely. Findings carry a
      lane tag through the merged pool so skeptic eligibility stays exactly as
      today — Lane B `Required` findings plus erosion `Fixed` findings, and
      nothing else."
  - question: Are the vendor's built-in review skills held constant, and on what terms?
    answer: >-
      (Diverged 2026-07-31 interview.) The rival conception — that holding
      /code-review and /security-review fixed while restructuring the owned
      lenses around them is itself the capture pattern
      virtue-alignment-of-attachments names, the delegatee setting the problem —
      was put and diverged from for this round. Reason: /code-review applied 84
      resolves per 4-day window at $2.31 per applied fix, the highest yield of
      any stage measured, so on the evidence it is the best available instrument
      rather than a captured attachment. The divergence carries an explicit
      expiry: it is revisited if /security-review's yield stays near zero,
      measured at 1 finding across 18 runs. Note that this round deepens rather
      than unwinds the reliance recorded in delegation-anthropic-claude's
      imported 'orchestration runtime semantics' — the owned review is directed
      to replicate and augment the built-in's operations rather than duplicate
      them, and adopts the built-in's `--comment` output. No `recovers` edge is
      recorded, because this round reduces no reliance.


      (Amended 2026-07-31, second interview.) The evidential basis stated above
      is void. The "84 resolves at $2.31 per applied fix" were produced by our
      own Opus agent, which hand-rolled a review after the built-in refused
      invocation; the built-in produced nothing in the window. The divergence is
      RE-DIVERGED on new grounds: /code-review is not a proven best instrument
      but an untested one, and testing it is the reason to keep it in the design
      rather than drop it. The expiry changes accordingly — revisited once
      /code-review has genuinely run for one measured window, no longer keyed to
      /security-review's yield. A stronger form of the steelman was also put and
      diverged from this round: that the four days without the instrument are an
      accidental natural experiment showing the owned review suffices on its
      own. Reason for diverging: the experiment was uncontrolled and unobserved,
      so it shows the owned review is adequate, not that the built-in adds
      nothing. Capture-risk reading recorded per the delegation-advice step:
      delegation-anthropic-claude is divergence low-moderate, irreversibility
      ungated (artifacts, workflow, and evaluation context are all in-repo),
      recovery cost only the frontier-vs-open-weight capability gap. No recovers
      edge — this round deepens reliance rather than reducing it, and
      virtue-alignment-of-attachments' clause that every import raises exit cost
      applies, so the deepening is recorded here to stay visible rather than
      silent.
  - question: What is the /code-review invocation contract, and what is known about
      its --fix flag?
    answer: >-
      (Recorded 2026-07-31 interview; usage supplied by the author.) The
      documented interface is `/code-review [low|medium|high|xhigh|max|ultra]
      [--fix] [--comment] [<target>]` — both `max` and `--fix` are valid
      documented arguments. Measured across 18 runs, every invocation of `max
      --fix` produced zero working-tree edits and returned an empty `fixed[]`
      array; the cause is unresolved and is NOT established to be a flag that
      the built-in ignores. `--fix` is therefore dropped from the invocation for
      now, and the Opus residue phase remains the fix path so every applied fix
      stays behind a judgment step. The built-in's `--comment` output is
      adopted. The standing intent is that the owned review augments and
      replicates the built-in's operations as far as possible without
      duplicating its findings. A follow-up investigation of the built-in's
      usage is owed, and this clarification is to be amended with its findings.


      (Amended 2026-07-31, second interview — the owed investigation,
      discharged.) The cause is resolved and it is not the flag. /code-review
      carries disable-model-invocation: true, which blocks the Skill tool for
      any model-driven agent. All 18 finder invocations were rejected with
      "Skill code-review cannot be used with Skill tool due to
      disable-model-invocation" (40 rejection events across the workflow corpus;
      CLI 2.1.220 throughout). The flag never reached the skill because the
      skill never ran. Three consequences. (a) --fix is RESTORED, reversing the
      drop recorded above, whose stated reason — unexplained no-op behavior — no
      longer holds. (b) The automated entry point is a user turn, not a model
      turn: claude -p '/code-review max --fix --comment', since only a user turn
      can invoke a disable-model-invocation skill. (c) In a -p run findings
      return as text, never through ReportFindings, so the per-finding outcome
      mapping this workflow was built around is structurally unavailable and
      must be replaced by text parsing rather than merely deleted — per the
      vendor documentation those outcome values populate only when findings are
      re-reported after being fixed later in the same session, which this lane
      never does. The entry point itself is UNVERIFIED: no one has confirmed
      that claude -p '/code-review max' runs in a dispatch worktree, what a
      nested session costs, or how it attributes against condition 2. Verifying
      it gates any rewiring. (Amended 2026-08-13 /align round.) The effort level
      named here is superseded: the dispatch lane runs the built-in at `high`,
      not `max` — see the 2026-08-13 clarification recording that supersession
      and its reason. Everything else in this clarification stands: the
      disable-model-invocation diagnosis, the `claude -p` user-turn entry point,
      and the text-parsing consequence are unaffected by the effort level.
  - question: Does the token audit attribute a phase worker's whole session cost to
      that phase?
    answer: "(Recorded 2026-07-31; measured.) No — condition 2's attributability
      requirement is currently breached for review workers. Per-turn attribution
      is derived from the harness's `attributionSkill` field; across 19
      review-worker sessions, 2,241 of 2,992 turns (75%) carried no value and
      fell to the `<none>` bucket, which was the single largest line in the
      window at $1,319 across all phases. Attribution covers a session's opening
      turns and then drops, so a phase's measured cost understates its true cost
      — review-fix measured $614 phase-tagged against $754 true. The requirement
      is that phase attribution cover a phase session's whole cost, not only its
      skill-framed turns. Per author ruling this does NOT gate the model-routing
      decisions recorded the same day: per-lens yield was drawn from workflow
      subagent transcripts, which are fully attributed, so the blind portion is
      the parent session rather than the fan-out that grounded those decisions."
  - question: How does the dispatch review phase invoke the built-in code review?
    answer: "(Recorded 2026-07-31, second interview.) As an exclusive, serialized
      stage that runs before the owned lenses — never inside the parallel finder
      fan-out. The built-in runs first and alone, through the claude -p
      user-turn entry point with max --fix --comment; the owned lenses then run
      against the post-fix working tree. Serialization is what makes --fix safe:
      the built-in writes the working tree, so it cannot run concurrently with
      lenses reading that tree or with the Opus fix phase writing it. The
      ordering also makes \"augment, not duplicate\" structural rather than a
      deduplication pass — lenses reading a tree where the built-in's fixes have
      already landed cannot re-report them, and they do see any defect those
      fixes introduce. This trades away the judgment-step guarantee recorded in
      clarification 22, accepted deliberately: the built-in's fixes are applied
      unjudged, and what was actually applied is read from a before/after git
      diff rather than from any agent's self-report. /security-review is
      unaffected and stays in the parallel fan-out — it carries no
      disable-model-invocation mark, invokes cleanly, and edits nothing.
      (Amended 2026-08-13 /align round.) `max` is superseded by `high` — see the
      2026-08-13 clarification. The serialization and exclusivity reasoning in
      this clarification is unchanged and is in fact strengthened by the
      detached-run design recorded the same day: the caller must do nothing else
      between the launching call and the collecting call, which is the same
      exclusivity property stated across a wider window."
  - question: What must hold before a yield metric may be credited to a named instrument?
    answer: (Recorded 2026-07-31, second interview.) Verified provenance — the
      metric must be shown to have come from that instrument, not merely to have
      appeared in a stage bearing its name. Condition 3 already required that
      routing recommendations rest only on yield metrics whose accounting is
      verified; it failed here for want of a check, not for want of a rule. The
      "84 resolves at $2.31 per applied fix" credited to /code-review was an
      agent's self-report of work it did itself under the instrument's name, and
      it stood in the record as the stated reason for a recorded divergence
      until transcript evidence contradicted it four days later. A stage's
      output is attributable to an instrument only when that instrument's
      invocation is verified to have succeeded — an exit status and an output
      signature, never an agent's account of what it ran. This is the
      token-economy half of the substitution invariant recorded the same day on
      strategy-graph-native-dispatch.
  - question: When a review finding is derived from BOTH Lane A and Lane B, which
      lane's record survives cross-lane deduplication?
    answer: "(Recorded 2026-08-03, author interview; amends clarification 20.) The
      Lane-B record is ALWAYS the surviving representative. Clarification 20's
      lane-tag mechanism presumed each finding carries exactly one lane, but
      cross-lane dedup's whole purpose is producing entries derived from both.
      dedupMerge collapses a same-root group to one representative ordered by
      Confidence desc then _idx asc, so one lane's Source/id/bucket survives and
      the other's is discarded into the sources union. Under that ordering a
      Lane-A win silently NARROWS skeptic coverage — a Lane-B Required finding
      loses its bucket and drops out of verify — which condition 5 forbids, and
      which the draft body never considered because it guards only against
      widening. Pinning Lane B as the representative leaves verify eligibility
      bit-for-bit unchanged and makes it structurally impossible for a
      Lane-A-derived entry to acquire bucket Required. The absorbed Lane-A item
      is recorded in sources and suppressed from the residue-disposition ledger,
      so it is fixed exactly once. Two alternatives were put to the author and
      declined: keeping the Confidence-desc winner while unioning buckets (a
      smaller change, but the merged entry's Source/id then no longer indicates
      which lane found it, making residue attribution ambiguous), and ratifying
      the current behavior as tolerable."
  - question: Does clarification 20's "never routed into the adversarial skeptic
      stage" still hold now that a skeptic pre-gate post-dates the ruling?
    answer: "(Recorded 2026-08-03, author interview; amends clarification 20.) It
      holds, read as the VERIFY stage ONLY. Clarification 20's ruling rested on
      two premises that are now partly spent: that the built-ins already apply
      their own internal verification, and a roughly-100-extra-agent cost
      argument. Commit 7c772829 (2026-08-02, after the 2026-07-31 ruling) states
      the opposite for code-review residue — no instrument receipt, no internal
      verification survives the parse — and now routes every code-review residue
      item through one adversarial skeptic carrying the same
      refute-under-uncertainty bias Lane-B Required findings get, dropping
      refuted items. The author's ruling: the exclusion names the verify stage,
      not the pre-gate. Dedup therefore runs at or after the refute filter so it
      can never merge an already-refuted item, and a pre-gate-upheld item stays
      non-verify-eligible — keeping the merge asymmetric and clarification 20's
      cost arithmetic intact. The alternative offered was re-ratifying
      clarification 20 wholesale in an /align-strategy round; declined as it
      would freeze this strategy's seven other raw drafts for the duration."
  - question: When the api-cost lens merge collapses a SEC_SOURCE lens (firebase)
      and a non-SEC_SOURCE lens (cost) under one Source name, how are the merged
      lens's findings classified?
    answer: "(Recorded 2026-08-03, author interview; fills a gap clarification 18
      left open.) Merge at the lens/trigger level, and SPLIT classification by
      sub-pattern. One api-cost finder emits security-classified findings
      (OWASP/STRIDE filled, Required-eligible, verify-eligible) for
      rules-permissiveness, emulator-reachability and key-exposure, and advisory
      findings (OWASP/STRIDE empty, always Deferred, never verify-eligible) for
      query-cost, amplifier and N+1. Both collapsed alternatives were put to the
      author and declined, because each breaks something the record already
      protects: wholly-advisory demotes firebase's
      Firestore-rules-permissiveness, emulator-code-on-production-paths and
      API-key-exposure checks from merge-blocking security findings to
      non-blocking follow-ups — a detection AND escalation reduction the
      quality-preservation condition forbids as an efficiency lever;
      wholly-security-classified makes cost/scaling findings merge-blocking and
      verify-eligible, breaking cost's documented non-escalation invariant
      (disposition-table.md:54-62) exactly as the merge widens the lens's fire
      rate. Clarification 18 authorized retaining and widening the lens on
      expense and sampling grounds and was simply SILENT on classification, so
      this fills a record-completeness gap rather than overturning a ruling.
      Consequence: the api-cost-specific adversarial-skeptic brief (the
      exploitability brief systematically refutes a cost finding) becomes live
      only for the security-classified sub-pattern."
  - question: Does per-file skeptic batching cover the code-review residue
      pre-gate's per-item fan-out, or is it verify-phase-local?
    answer: "(Recorded 2026-08-03, author interview; amends clarification 20.) It
      covers the pre-gate too, and `tactic-review-verify-per-file-batching`'s
      Scope extends to review-fix.js:1707-1775. Clarification 20 rejected
      re-skepticizing Lane-A residue on an explicit cost premise — roughly 103
      residue items per window would add roughly 100 agents and cancel the
      batching gain. Commit 7c772829 (2026-08-02, after that ruling) does
      exactly that for code-review-sourced residue: one Sonnet/effort-high
      adversarial skeptic per item, un-batched, one file read per item. Those
      agents run under phase 'residue' rather than 'verify', so clarification
      19's 131-agent / 41-file-group / 3.2x arithmetic is untouched — but the
      review-fix-wide agent-count reduction the tactic is JUSTIFIED by is not,
      and an un-batched per-item fan-out is the same defect the tactic exists to
      remove. Declined: keeping the batching verify-phase-local, which would
      have required restating the benefit claim as verify-local and spinning the
      residue fan-out out into separate scope."
  - question: Can "each file read once" and the preserved severity-scaled 2-skeptic
      tier both hold?
    answer: "(Recorded 2026-08-03, author interview; corrects clarification 19's
      arithmetic, not its behavior.) They cannot — clarification 19's 3.2x
      derives from 131 agents over 41 file groups 'with each file read once',
      which holds only at exactly one agent per file group, while the preserved
      tier gives a high-confidence finding 2 skeptics so its file group is read
      twice. Author ruling: KEEP the 2-skeptic tier and restate the arithmetic.
      3.2x becomes an UPPER BOUND, and
      `tactic-review-verify-per-file-batching`'s Verification threshold (41/18
      ~= 2.3, unreachable by construction) is restated to a measured figure once
      the high-confidence-per-file-group distribution is recorded — that
      distribution has never been measured, so the realized reduction is
      genuinely unknown until it is. Declined: one skeptic per group regardless
      of confidence. It would restore a clean 3.2x, but applyVerifyDrop
      (review-fix.js:565-583) drops on refutedCount >= 1, so halving the
      high-confidence tier's votes makes drops strictly less likely, sends more
      Required findings to the Opus fix stage, and moves the refutation rate off
      its 69% baseline (91 refuted / 37 upheld) for structural reasons —
      corrupting the very signal that node names as its own regression
      detector."
  - question: Which Lane-B terminal dispositions qualify a finding to absorb its
      Lane-A residue twin?
    answer: "(Recorded 2026-08-03, author interview; completes clarifications 26 and
      27.) Only a Lane-B finding that survived verify AND was actually fixed
      absorbs its Lane-A twin. A Refuted or Unverified-dropped finding NEVER
      absorbs — its Lane-A twin stays in the residue-disposition ledger. And on
      the genuinely open half, the author ruled LEDGER-COMPLETENESS WINS: a
      Lane-B finding merely queued for DEFERRED filing does not absorb either,
      accepting one duplicate on that root. Context: clarification 27 places the
      cross-lane merge at or after the code-review residue skeptic pre-gate
      (review-fix.js ~1694-1781, inside phase('residue') ~1617), which is
      downstream of verify (~1394, applyVerifyDrop ~1489) and fix (~1524) — so
      by merge time every Lane-B finding already carries a terminal disposition,
      a case clarification 26's 'fixed exactly once' presumed away. Matching
      Lane-A residue against the full deduped pool would let a REFUTED Lane-B
      twin suppress a real Lane-A item, deleting it from the ledger — a
      detection loss condition 5 forbids. Rationale for the deferred half
      specifically: a duplicate is recoverable and a deleted ledger item is not,
      and condition 5 forbids detection loss while saying nothing about
      tolerating redundancy; the absorb alternative would additionally require
      moving the deferred_filings computation (currently ~2054, AFTER the
      residue phase) to before or during it — a structural pipeline reordering
      outside this tactic's scope, and a re-plan rather than a plan. Declined:
      dedup-wins (absorb + reorder), and deferring the whole
      terminal-disposition question to a wholesale /align-strategy sitting. NOT
      MEASURED, and worth measuring before trusting the cost estimate: how often
      a deferred Lane-B finding actually shares a root with a Lane-A residue
      item — the duplicate rate this ruling accepts could be near zero or
      material, and nobody has counted."
  - question: Is the draft body of tactic-review-api-cost-lens-merge still accurate
      against the 2026-08-03 split-classification clarification and current
      review-fix.js line anchors?
    answer: "(Recorded 2026-08-03 /align-tactics round.) No — the draft body dates
      from the 2026-07-31 interview and still states the wholly-advisory
      disposition that the 2026-08-03 split-classification clarification
      declined; finalizing it must carry the split (security-classified
      rules-permissiveness / emulator-reachability / key-exposure; advisory
      query-cost / amplifier / N+1) rather than the body's current text. Every
      code anchor in that body is stale after the domain-sweep fold (commit
      7deaf80b): at HEAD, agentFinderSet is review-fix.js:498-511 inside the
      `>>> domain sweep gate` sentinels that review-fix-domain-sweep-probe.mjs
      slices, DOMAIN_PROMPTS.firebase is 646-659, the `cost` finderPrompt branch
      is 785-805, the generic fallback comment naming 'firebase' is 824-830,
      SEC_SOURCES is 1460-1470, the verify skeptic ternary is 1538-1564, and the
      code-review residue pre-gate is 1797-1885. The sibling
      tactic-review-domain-lens-consolidation's claim that this node is
      office_hours-parked on the classification question is stale — office_hours
      is null and the split ruling discharged it."
  - question: Does the strategy's structured reading/gap/rounds bookkeeping reflect
      the two completed /align-tactics rounds (2026-07-04, 2026-07-16) and the
      round-2 sensor reading?
    answer: (Recorded 2026-08-03 /align-tactics round.) No — record-completeness
      gap, no plan depends on it. The strategy's structured `reading` and `gap`
      fields are still null and `rounds` still reads count 0 with null
      last_completed/last_aligned, although two /align-tactics rounds completed
      (2026-07-04, 2026-07-16) and round 2 narrates a live read-sensors reading
      in prose — weekly allowance utilization ~7%, 28-day claude-eligible
      tactics 231 created / 91 closed, net +140, i.e. both failing states
      active. The consequence is that the mechanical eligibility gates read this
      strategy as never-aligned and never-read; correct the structured fields at
      the next sensor pass so the round cap and the fresh-reading gate operate
      on the real history.
  - question: Which trigger predicate must the widened api-cost lens use, given that
      the classifier gating it reads file paths only and can never express
      "touches an API or query call site"?
    answer: "(Recorded 2026-08-03, author interview; fills the mechanism gap
      clarifications 18 and 28 left open.) The lens gets its OWN diff-content
      gate, decoupled from the shared `app_or_rules` boolean. Compute a new
      `api_call_site` flag at the review-fix args-build site
      (.claude/skills/review-fix/SKILL.md:240), where MERGE_BASE is already in
      scope, by scanning the diff for API/query call-site patterns
      (fetch/axios/getDocs/query/collection), and gate api-cost on that flag
      inside `agentFinderSet` (review-fix.js:499-511, within the `>>> domain
      sweep gate` sentinels sliced by review-fix-domain-sweep-probe.mjs).
      Measured this round: `dispatch-security-surface` receives a path list on
      stdin (`dispatch-changed-files | dispatch-security-surface`) and gates on
      extension/name regexes alone (APP_RE, RULES_RE at
      dispatch-security-surface:26-35) — it never inspects diff content, so the
      statement's requirement is not expressible there and a content probe
      belongs at the args-build site rather than inside that script. Two
      alternatives were put to the author and declined. Relaxing the shared
      `app_or_rules` predicate was declined primarily because that boolean ALSO
      selects the auth and data-exposure domain-sweep sections (`sweepDomains`,
      review-fix.js:667-672), so relaxing it would silently widen SECURITY
      review scope to every code diff including `.claude/` tooling — a larger
      and less visible consequence than the ~3.6x draw overshoot; a per-lens
      gate keyed on a widened PATH rule was declined because it still does not
      express the call-site requirement and re-approximates it by path,
      inheriting the same overshoot without the simplicity. UNMEASURED, and
      flagged as such: nobody has counted how many of the 18 measured runs
      contain such a call site, so the resulting fire rate is a tunable design
      property of the pattern list, not a measurement. The decomposition must
      record the realized fire rate once observed."
  - question: Is clarification 18's "~$14 toward ~$25-30 proxy per 4-day window" a
      gate the api-cost tactic's Verification block must assert, or an expected
      consequence of the widening?
    answer: "(Recorded 2026-08-03, author interview.) An expected range, not a gate.
      The binding constraint is the statement's semantics — the lens fires on
      diffs touching an API or query call site — and the realized draw is
      measured and recorded afterward rather than asserted as a threshold. The
      figure was derived from an assumed widening, so treating it as binding
      would let a derived estimate constrain the mechanism it was derived from.
      Same correction shape as the 2026-08-03 ruling that restated
      tactic-review-verify-per-file-batching's 3.2x as an upper bound once the
      arithmetic no longer supported it as a target. Consequence for
      decomposition: Verification asserts that the merged lens fires on
      materially more than 5 of 18 comparable runs and records the realized
      draw, and does NOT assert a dollar ceiling or floor."
  - question: (Recorded 2026-08-03 /align-tactics round; re-verifies a 2026-07-31
      draft-body claim on tactic-token-audit-whole-session-phase-attribution.)
      Does the session-type classifier still type phase-worker sessions
      correctly, and are subagent transcripts still attributed correctly, after
      tactic-align-tactics-workflow made /align-tactics Workflow-shaped?
    answer: "Yes, still reliable. The draft body's Scope asserted the session-type
      classifier already types phase-worker sessions correctly and that subagent
      transcripts are attributed correctly today — a claim made 2026-07-31,
      before sibling tactic-align-tactics-workflow reached phase:done and made
      /align-tactics Workflow-shaped. Re-checked at HEAD: the $type classifier's
      worker alternation
      (.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:319)
      already lists align-tactics and review-fix, and Workflow fan-out subagents
      are typed 'subagent' by transcript path (/subagents/, line 308) rather
      than falling to 'other' — so a Workflow-shaped phase's parent session
      still types worker and its fan-out still types subagent. The
      whole-session-attribution design holds unchanged for the newer session
      shape; no scope change follows."
  - question: "(Recorded 2026-08-03 /align-tactics round.)
      tactic-token-audit-whole-session-phase-attribution's draft Verification
      asserted review-fix should rise toward its measured $754 true cost and
      made the plan contingent on sequencing against
      tactic-review-skill-body-decomposition. That sibling is stuck
      (phase:review, blocked_by an office-hours-parked fix-attempt-cap hold on
      PR #3025). Does the attribution fix wait for it?"
    answer: No — re-baseline; do not assert the 2026-07-31 figures as gates.
      Sequencing this measurement fix behind an office-hours-parked node would
      stall it indefinitely, so it proceeds now and re-measures its own
      baseline. Consistent with the same-day rulings that restated
      tactic-review-verify-per-file-batching's 3.2x as an upper bound and
      clarification 18's ~$14 toward ~$25-30 as an expected range rather than a
      gate, the tactic's Verification asserts the structural outcome — a
      single-phase worker session's phase map resolves to exactly one key, and
      the <none> share of worker-session turns falls materially against a
      freshly re-run baseline — and records the realized figures rather than
      asserting the stale $614/$754/75% numbers as thresholds.
  - question: (Recorded 2026-08-03 /align-tactics round; measured against HEAD.)
      tactic-token-audit-whole-session-phase-attribution promotes the token
      audit's worker-skill enumeration from a session-typing input to a
      cost-attribution input. The phase-to-skill correspondence is actually
      enumerated three times in non-identical form in aggregate-usage.sh. Does
      whole-session attribution need to reconcile all three, or single-source
      only the one it consumes?
    answer: (Recorded 2026-08-03 /align-tactics round; measured against HEAD.)
      Single-source only the one it consumes; reconciling all three is out of
      scope for that tactic. The $type classifier's worker alternation
      (aggregate-usage.sh:319) carries a superset — plan-issue, implement,
      qa-fix, review-fix, fix-checks, fix-conflicts, dispatch-conflict, qa-main,
      budget-parse-job, resolve-epic, office-hours, align-strategy,
      align-tactics, align-init — while the stage-2 $phase_skill map (882-883)
      and the shell _phase_map loop (108-113) each carry only the five-phase set
      (implement/fix/qa/review/main-qa). Today a skill missing from the
      alternation only mistypes a session as 'other'; once the whole session's
      cost is attributed from that alternation, a missing entry would silently
      park an entire worker session's spend in <none> — reproducing exactly the
      condition-2 blindness the tactic exists to remove. Per
      .claude/rules/code-style.md the failure must be loud rather than a silent
      fallback, so the tactic's Unit 1 single-sources the classifier's own
      alternation into a named jq def rather than adding a fourth independent
      list; reconciling the other two enumerations remains explicitly out of
      scope for that tactic and is a separate concern if it becomes
      load-bearing.
  - question: What is the weekly utilization target, and does 5-hour rolling-window
      pacing qualify it?
    answer: "(Recorded 2026-08-04 interview, author-dictated.) The target is 100% of
      the weekly allowance, every week, regardless of current 5-hour
      rolling-window pacing. Token economy is paramount in the sense of
      maximizing functional throughput within that allowance — verbosity and
      efficiency levers serve closure velocity, never spend reduction. This
      fixes how success_signal.threshold's 'utilization near 100% of the weekly
      allowance' is to be read: the window is weekly, the cadence is every week
      rather than an average across weeks, and short-window 5-hour pacing is not
      a qualifier — a week that under-uses the allowance because 5-hour windows
      throttled it still fails the signal, and the response is to raise
      throughput, not to restate the target. Restates clarification 2's
      throughput-not-savings ruling as a standing target rather than only a
      definition; the round-2 reading of ~7% utilization (clarification 11) is a
      measurement against this target, not a revision of it."
  - question: Does disabling verbose output for unsupervised dispatch workers reduce
      token draw, and what is terser conversation prose actually worth?
    answer: >
      (Recorded 2026-08-04 interview; measured this round.) The config lever is
      void and the underlying hypothesis is real but small; no tactic is
      created. (a) VOID MECHANISM: the `verbose` settings key and the
      `--verbose` flag are a display/logging mode — the CLI documents the flag
      as 'Override verbose mode setting from config', and it changes what the
      terminal renders, not what the model generates or what is re-sent as
      context. Disabling it saves approximately zero tokens. No dispatch launch
      path sets it today: a grep of `.claude/` finds no `verbose` key, and
      workers spawn via `dispatch-spawn-job` as `claude --bg --name --model
      --effort --permission-mode auto`, which carries no output-verbosity
      argument. (b) SIZING OF THE REAL HYPOTHESIS — terser conversation prose
      from the model, counting BOTH generation and the re-send-as-context tail
      the author named: measured over 46 transcripts / 24 sessions / 2,646
      assistant turns in the 3 days to 2026-08-04, price-proxy weighted, total
      draw was ~$197 proxy, split 86% input side (input + cache_creation +
      cache_read) and 14% output side. Assistant conversation prose totalled
      ~37.5k tokens (~150k chars); costed all-in — generated at the output rate,
      written to cache once, then read back on every remaining assistant turn of
      its session — it is ~$1.53, about 0.8% of draw. Tool-use arguments (the
      work itself: bash commands, file writes, subagent prompts, unreachable by
      any prose-style change) are ~$10.07 all-in, about 5%. (c) WHERE THE OUTPUT
      SIDE ACTUALLY GOES: thinking blocks are present (859 in the window) but
      their text is not persisted in transcripts — the `.thinking` field is
      empty and only a signature is stored — so thinking volume is not directly
      measurable; reconciling 1,815,033 output tokens against ~1.17M chars of
      visible content implies roughly 83% of output tokens are thinking, about
      12% of total draw. Thinking is not re-sent as context, so the lever that
      reaches it is the phase-to-effort routing already recorded in
      tooling_goals, never prose style. (d) WHERE THE DRAW ACTUALLY IS: the
      dominant 86% is the input side, dominated by cache_read — the context
      re-read on every turn. The levers already recorded against it are
      clarification 4 (context discipline), clarification 12 (SKILL-body prose
      and boot boilerplate as per-session standup cost) and clarification 15
      (prefer one script over a multi-step Claude turn loop, since every round
      trip re-reads the whole context). Terse prose does not reach any of them;
      reducing TURN COUNT and resident context does. (e) AUTHOR RULING: record
      the evaluation, create NO draft tactic. Under the author's standing rule a
      low-but-meaningful lever would still be recorded and merely left
      unprioritized; at a ~0.8% ceiling the mechanism is declined outright
      rather than parked. If it is ever revived, the mechanism is a
      system-prompt or output-style-level terseness scoped to unsupervised
      worker sessions, leaving edit and tool output untouched, and it must
      preserve the background-job state-classifier lines (`result:` / `needs
      input:` / `failed:` and restated outcomes, which that classifier reads
      from message text only, never from tool output) plus enough narration to
      debug a failed session — the same shape as the quality-preservation
      condition, which forbids buying efficiency with lost signal. (f)
      MEASUREMENT CAVEATS, flagged rather than buried: the re-send cost model is
      a linear approximation (each prose block re-read once per remaining
      assistant turn of its session, 4 chars per token), and the display-only
      reading of `verbose` rests on the CLI's own help text rather than a
      controlled A/B. Both would need tightening before any figure here is
      treated as a threshold. No `recovers` edge — this round reduces no
      reliance on delegation-anthropic-claude.


      (Amended 2026-08-04, same-day follow-up to an author question — 'does the
      input-side 86% include outputs from previous rounds?'.) Two corrections.
      FIRST, an axis correction that the original wording invited: the 86%/14%
      figures in (b) are a BILLING-category split — input-priced tokens (input +
      cache_creation + cache_read) against output-priced tokens — and NOT a
      provenance split. The 86% input side is the entire re-sent conversation
      prefix, so it already contains every prior turn's assistant output,
      conversation prose included, alongside the system prompt, skill bodies,
      file reads and tool results. It follows that (b)'s ~0.8% prose figure and
      (d)'s 86% lie on different axes and must NEVER be summed: prose's
      generation sits inside the 14% and prose's re-send tail sits inside the
      86%, which is exactly why (b) costed prose all-in. The ~0.8% remains the
      correct answer to 'what would terser prose save', unchanged by this
      amendment. SECOND, a substantive retraction: sub-claim (c)'s parenthetical
      that thinking 'is not re-sent as context' was asserted without
      measurement, and the evidence is against it. Tested by comparing per-turn
      context growth against the visible content added between turns across 59
      transcripts since 2026-08-01: measured context growth was 3,601,271 tokens
      while all visible added content — assistant prose, tool-use arguments,
      tool results and user text — accounts for 2,081,399 tokens at 4 characters
      per token or 2,775,198 at 3, leaving between 826,073 and 1,519,872 tokens
      of growth unexplained by anything visible in the transcript. That residue
      is of the same order as the thinking volume inferred in (c) from the
      output side. The reading that best fits is that thinking blocks are
      RETAINED in the re-sent prefix within an agentic turn rather than dropped.
      Consequences, both strengthening rather than weakening this
      clarification's conclusion: thinking's share of total draw is HIGHER than
      the ~12% recorded in (c), because it then draws on the input side as well
      as the output side; and phase-to-effort routing is correspondingly a
      STRONGER lever than (c) claimed. What does not change: the (a) refutation
      of the verbose config lever, the ~0.8% prose ceiling in (b), and the
      author ruling in (e) that no tactic is created. CAVEAT, recorded rather
      than buried: the characters-per-token conversion drives how decisive this
      test is — at 3 characters per token the unexplained residue roughly halves
      — so this is directional evidence about context composition, never a
      figure to be used as a threshold, and thinking retention remains an
      inference from usage fields rather than a documented harness guarantee.
      Recorded under the same discipline as clarification 25: a claim that
      entered the record unverified is corrected in the record rather than left
      to be contradicted later.
  - question: Can /dispatch-token-audit be superseded entirely by the per-session
      evaluation, for parsimony?
    answer: "(Recorded 2026-08-12 /align round.) No — but the two are collapsed to
      ONE INSTRUMENT AT TWO SCOPES, which is where the real duplication was.
      aggregate-usage.sh already computes both per-session rows (.sessions[])
      and window aggregates from a single pipeline, and its by_phase buckets
      already carry cache_creation/cache_read, so the surfaces were never two
      analyses. The resolution: aggregate-usage.sh gains --session/--node
      scoping; the same script, the same JSON schema, and the same lens catalog
      serve both the per-run session evaluation and the periodic audit;
      /dispatch-token-audit survives as the FLEET-SCOPED INVOCATION of that
      instrument rather than as a second analysis with its own drifting lens
      list. Full supersession is refused because some denominators are genuinely
      fleet-sized and cannot be approximated at n=1 (a ladder run is ~5
      sessions): pooled by_phase_outcome hit-rates, which are the
      routing-recommendation input; boot-context median and peak; phase-standup
      cost; cross-session tool-error signatures; and recurrence itself. Those
      lenses are TAGGED fleet-only and are ABSENT at n=1, never approximated
      from one run — an n=1 hit-rate is not a small sample, it is a category
      error. A further reason to keep the periodic surface: this strategy's own
      success_signal is weekly allowance utilization, and retiring the fleet
      scope would leave that signal with no weekly reader. Honest limit: 'a
      scope filter, not a rewrite' is judgment from reading the pipeline's
      structure, not a measured diff. Carrier: tactic-audit-instrument-scoping."
  - question: Does the audit measure cache optimization, and where does that lens belong?
    answer: "(Recorded 2026-08-12 /align round.) The DATA is already collected and
      the LENS is missing — aggregate-usage.sh has read
      cache_creation_input_tokens and cache_read_input_tokens per turn since it
      was written, prices them separately, and carries them in every by_phase
      bucket, but no lens reads them and lens 8 only gestures at 'prompt-cache
      reuse across sibling sessions' qualitatively. Promote it to a measured
      lens: cache hit ratio as cache_read/(input + cache_creation + cache_read),
      plus cache-creation churn — repeated prefix re-creation across sibling
      sessions with staggered start times, which is the shape a cache-boundary
      violation actually leaves in the data. It is meaningful at BOTH scopes and
      so is not tagged fleet-only: per-run it says whether this ladder's sibling
      sessions re-created a prefix they could have shared; fleet-wide it says
      whether a harness change moved the ratio at all. That second reading is
      what the existing draft tactic-dispatch-cache-preserving-context already
      names as its discriminating measurement — this lens supplies it, so the
      two compose rather than duplicating. Report the measured magnitude only;
      do not assert hypothetical savings. Carrier:
      tactic-audit-cache-efficiency-lens."
  - question: May a token-audit surface EXECUTE a remediation, specifically
      /fewer-permission-prompts, given both candidate homes are report-only?
    answer: "(Recorded 2026-08-12 /align round.) Only the ATTENDED surface may.
      /dispatch-token-audit's step 7 ('report-only... modifies NO dispatch
      workflow files') and /dispatch-ladder's review ('it records; it never
      executes') both forbade it. The narrowing: report-only means writes no
      ROUTING policy and no graph or product files — the contract exists to stop
      an unattended loop from racing or auto-applying policy, and a permissions
      allowlist is neither routing policy nor product code. So the
      author-invoked periodic audit gains a closing step that runs
      /fewer-permission-prompts and writes .claude/settings.json; the unattended
      per-phase ladder evaluation MEASURES permission friction (denials and
      approval round-trips per session) and records it, and never acts. A
      mechanical fact decided this rather than taste: this repo's
      .claude/settings.json sits in the sandbox denyWithinAllow list, so writing
      it requires dangerouslyDisableSandbox — an attended act by construction. A
      detached evaluator could not perform the write without a standing sandbox
      override, and granting one to an unattended job is a larger concession
      than the step is worth. EXPLICITLY UNCHANGED: the no-auto-apply bound on
      routing policy (clarification 10 / the routing condition) is untouched by
      this narrowing and is not loosened by it. Honest limit:
      /fewer-permission-prompts is a built-in and its implementation was not
      read this round, so how it merges into an existing settings.json, and
      whether it can collide with a concurrent worker's commit, are unverified —
      tactic-audit-permission-friction owes that check before the step is
      wired."
  - question: At what effort level does the dispatch review lane run the built-in
      /code-review, and what supersedes the 2026-08-09 `max` ruling?
    answer: "(Recorded 2026-08-13 /align round, author-directed.) `high`,
      superseding the 2026-08-09 office-hours ruling that directed `max`. The
      author's requirement this round was stated as `/code-review high --fix
      --comment`; put to the author that it disagreed on one word with a
      three-day-old ruling of their own, the author ruled it a deliberate
      supersession rather than an interim operating point. RECORD CORRECTION
      worth keeping: `--fix` and `--comment` were ALREADY in place and are not
      part of the change — `dispatch-code-review` builds its prompt as
      `/code-review $EFFORT --fix --comment $TARGET`, and `--no-comment` exists
      only for its own test suite, so the requirement reduces to the single-word
      change of that script's `EFFORT` default. Condition 3 requires explicit
      author approval for every routing change, effort tuning included; this
      round is that approval, and the change is author-initiated rather than
      surfaced by the advisory audit loop. WHY THE MEASURED RECORD DOES NOT
      FORBID THIS: what `references/code-review-invocation.md` falsifies is
      `max` synchronously (2363 s, killed, zero bytes, $371.54 proxy); its own
      section 7 says the untested middle — `medium`, `high`, `xhigh` — 'is where
      the usable operating point probably sits and should be measured', so
      `high` is unmeasured rather than refuted. STEELMAN, PUT AND DIVERGED FROM:
      that raising the BUILT-IN's depth spends on the wrong instrument, since
      clarification 17 measured the owned Lane-B lenses producing 27 confirmed
      findings against /security-review's 1 across 18 runs. Diverged on
      clarification 21's own re-divergence ground — /code-review is 'not a
      proven best instrument but an untested one, and testing it is the reason
      to keep it in the design rather than drop it' — so running it at depth is
      how that test is performed. The owned lenses are neither cut nor narrowed
      by this round, which condition 5 forbids independently of this ruling.
      CARRIER: tactic-review-effort-max-detached-resume-poll. Its plan's Unit 2
      step 2 (`EFFORT=\"low\"` to `EFFORT=\"max\"`) and its id both name `max`
      and must be re-planned and renamed to `high`; every other element of that
      plan — detached launch, bounded await across calls, exit code 5 for an
      in-flight run, hard-stop preserved, and the 5400 s deadline — survives
      unchanged, because the detached harness is what makes ANY raised effort
      reachable and is not specific to `max`. BLOCKER, flagged rather than
      buried: that node is office_hours-parked since 2026-08-10 (a worker
      session froze at a permission/classifier denial and the frozen-session
      sweep parked it), so the re-plan cannot proceed until the park clears. No
      `recovers` edge — this round deepens reliance on
      delegation-anthropic-claude's review instrument rather than reducing it,
      recorded here to stay visible per virtue-alignment-of-attachments'
      every-import-raises-exit-cost clause."
  - question: When the built-in's detached run outlives its await window, what holds
      the node, and what ends the run?
    answer: "(Recorded 2026-08-13 /align round, author-directed; the locking
      mechanism is author-delegated to Claude and held on trust.) FOUR RULINGS.
      (1) An overrunning instrument run is NEVER killed. `claude -p` buffers all
      output until completion, so killing a run is a total loss rather than a
      degraded result; the run continues so it still has the potential to
      complete, and its result is served on the next pass through the existing
      resume cache. (2) The hard stop is PRESERVED but relocated: /review-fix
      still fails the review phase rather than degrading to a Lane-B-only review
      — that degradation is what condition 6 and
      tactic-lane-instrument-substitution-guard exist to prevent — but the stop
      fires at deadline exhaustion, never at the await boundary. The supervising
      session holds across the await and does nothing else in that window, which
      is the exclusivity property Unit 3 of the carrier node already states. (3)
      THE NODE REMAINS LOCKED FOR THE DETACHED RUN'S LIFETIME, INDEPENDENTLY OF
      THE LAUNCHING SESSION. An earlier draft of this round tied the claim to
      session liveness, on the repo's standing worktree-is-the-claim invariant;
      the author rejected that as insufficient, because a session that dies for
      an unrelated reason — a frozen-session park, an API error, `claude rm`, a
      host restart — evaporates the claim while an active `--fix` run is still
      writing the tree. That is not hypothetical: the carrier node is parked
      right now for exactly that reason. (4) The 5400 s (90 minute) deadline
      bounds the run's duration; the carrier's plan already defaults
      `--deadline-seconds` to 5400, so the author's independently-chosen figure
      and the existing plan agree. MECHANISM, HELD ON TRUST: the author
      delegated the choice and Claude recommends a kernel-released `flock` held
      by the detached child itself, on a sidecar
      `.claude/worktrees/<node-id>.code-review-lock` whose body carries pid,
      node id, target range, launch HEAD, effort and deadline as diagnostics.
      The argument is that it delegates the hardest property — release exactly
      when the holder dies, for any reason including SIGKILL and host crash — to
      the kernel, where a pid-plus-timestamp sidecar needs staleness heuristics
      and carries a pid-reuse window, a heartbeat needs a second process that
      can itself die, and a graph-layer lock needs a reaper and would strand a
      node forever when the child dies, besides putting runtime machinery in the
      graph that condition 4 keeps out. Launch shape `setsid flock -n <lockfile>
      <child>`; readers test with `flock -n <lockfile> true`. LIMITS RECORDED
      RATHER THAN BURIED: `flock` is advisory, so it binds only claimers that
      check — enforcement rests on the claim paths being few and enumerable
      (provision-node-worktree, the reservation sweep, the invalid-state lane,
      office-hours select), and a human entering the worktree by hand bypasses
      it exactly as today; and `flock` availability plus `setsid` fd-inheritance
      inside a dispatch worktree are UNVERIFIED and belong in the carrier's Unit
      1 probe rather than being assumed. This is net-new scope that the carrier
      node does not cover — its `$CACHE_KEY.lock` mkdir mutex guards the cache,
      not the worktree — and is carried by
      tactic-code-review-detached-node-lock, which the effort raise must not
      ship without, since a survivor with no lock is the corruption case.
      Enrolled for review as tactic-review-sitting-code-review-lock-design."
  - question: What must the first `high` runs record, and does anything become a
      threshold?
    answer: "(Recorded 2026-08-13 /align round, author-directed.) Record realized
      figures; assert no threshold. The first `high` runs record realized wall
      clock, realized price-proxy draw, findings count, and whether the run
      completed inside its budget or continued as a detached run; the 90 minute
      deadline is re-set from those runs rather than defended as a gate. This is
      the same discipline the record has now applied four times — clarification
      18's '~$14 toward ~$25-30' restated as an expected range,
      tactic-review-verify-per-file-batching's 3.2x restated as an upper bound,
      the 2026-08-03 ruling to re-baseline rather than assert stale
      $614/$754/75% figures, and now this. An auto-reverting completion-rate
      gate was put to the author and DECLINED, because an automatically-applied
      effort reversion is precisely the auto-applied routing change condition 3
      forbids without explicit author approval, and carving an exception would
      weaken the condition to buy a convenience. OWED AND NOT CURRENTLY COMPUTED
      BY ANY SENSOR: the comparison that actually answers whether the raise was
      worth it is findings at `high` against the `low` baseline for comparable
      diffs. The token-economy sensor reads spend and attribution, not
      per-effort review yield, so this is a missing lens rather than a missing
      query — carried by tactic-audit-review-effort-yield-lens, and by condition
      7 it is added to the one instrument's shared lens catalog
      (aggregate-usage.sh) rather than to a second parallel analysis. Until that
      lens exists the raise is an unmeasured quality bet, which is recorded here
      as the honest state rather than presented as a measured improvement."
  - question: What model does the detached `/code-review` review-lane session run
      on, and how is that recorded so `high`'s cost/quality measurement stays
      interpretable?
    answer: "(Recorded 2026-08-13 /align round, author-directed; captured in the
      graph retroactively this same day, after the ruling and after PR #3078
      shipped it, because this round's interview did not itself capture the
      model-pin requirement.) `opus`, explicit and pinned. The author's
      requirement is that the detached review-lane session runs on Opus. The pin
      is EXPLICIT rather than inherited, because a nested `claude -p` does not
      inherit the launching session's model — omitting the flag would silently
      accept whatever the CLI defaults to, not the launcher's model. At `high`
      effort the model is the dominant cost and quality term, so an unpinned run
      would leave clarification 46's required measurement (the first production
      `high` runs recording realized wall clock, price proxy and findings count)
      uninterpretable — a later reader could not tell whether a recorded figure
      reflects `opus` or some other default. `model` therefore JOINS the resume
      cache's run identity alongside effort level, target and flags: two runs
      differing only in model are different runs, and a summary produced under
      one model is never replayed for another. This is a routing decision —
      condition 3 requires explicit author approval for every routing change —
      made with the author's explicit approval, satisfying condition 3. Carrier:
      tactic-review-effort-max-detached-resume-poll (Unit 2, `--model opus`);
      shipped in PR #3078."
  - question: On a superseded relaunch, what is the review lane before-image that
      /code-review --fix diffs against, and what makes the edits it reports
      attributable?
    answer: "(Recorded 2026-08-13, author-directed; captured in the graph the same
      day, after the ruling and after ad-hoc PR #3080 shipped it.) HEAD,
      carrying the killed run's untracked snapshot forward. This implements
      clarification 25's existing guarantee for the review lane's own accounting
      — it is not new policy: the before-image is precisely what makes a
      `/code-review --fix` run's reported output a mechanical derivation rather
      than an agent's account of what it changed. The defect it settles: when
      dispatch-code-review supersedes a still-running review it kills that run,
      and it then took a FRESH `git stash create` as the new before-image; the
      killed run held `--permission-mode acceptEdits`, so its partial edits had
      already landed INSIDE that baseline and Step 6's `git diff` could not see
      them — the review silently under-reported its own writes. Four parts. (1)
      The baseline is HEAD, and the killed run's untracked snapshot is carried
      FORWARD rather than re-taken — re-snapshotting would record files the dead
      run created as pre-existing and drop them from the union. (2) HEAD is
      sound because /review-fix Step 1b mandates exclusivity: between the
      launching call and the collecting call the session does nothing else,
      which is what makes any uncommitted change at the kill point attributable
      to the killed run. (3) Carrying the superseded run's before_sha forward
      was considered and REJECTED — that branch fires precisely because head_sha
      advanced, so the old stash predates the intervening qa-fix/fix-checks
      commits and would attribute them to the review, a larger attribution error
      than the one being repaired. (4) A baseline that cannot be derived FAILS
      CLOSED, exiting 2 and naming both shas, rather than guessing — per the
      repo's preference for clear errors over defensive fallbacks. The guarantee
      extends to the failure paths out of that branch: if the relaunch itself
      fails to start, the killed run's record must be RESTORED rather than
      discarded, or the retry re-enters as a first-ever launch, takes a fresh
      stash, and reintroduces the same under-reporting through the back door.
      Carrier: ad-hoc PR #3080; no tactic node, because the defect was found and
      shipped outside the ladder."
  - question: May the review lane's pre-pass set /code-review's effort per PR, given
      the no-auto-apply bound on routing changes, and what band may it reach?
    answer: "(Recorded 2026-08-13 /align round, author-directed.) YES, as PER-INPUT
      dispatch inside an author-fixed band — and the no-auto-apply bar is SCOPED
      rather than loosened to admit it. THE DISTINCTION, which the record did
      not previously draw: clarification 3 (amended 2026-07-16) and the routing
      condition govern STANDING POLICY — the default every future run gets,
      changed on audit evidence the author has not seen. A per-input selection
      is a different act: it moves ONE run on properties of that run's own diff,
      inside a band the author fixed in advance. The alternative — advisory
      only, the planner recommends and never sets — was put and DECLINED,
      because it buys measurement but no throughput this round. THREE
      REQUIREMENTS keep the bar unweakened, and a mechanism missing any of them
      is not covered by this ruling: (1) the reachable band is AUTHOR-SET, not
      skill-chosen, and is not re-openable by the skill; (2) effort `high`
      (clarification 44) stays the default and is what an absent, failed, or
      unparseable verdict gets — the fail-open condition added this same day;
      (3) every deviation records the chosen level AND the planner's rationale,
      so clarification 46's owed measurement is STRATIFIED rather than
      confounded. Requirement (3) answers the strongest argument against this
      whole ruling — that varying effort per PR destroys the clean `high`
      baseline clarification 46 requires — and it answers it by recording, not
      by refusing. THE BAND, author-ruled: `low` through `max`, full range,
      default `high`. CLAUDE RECOMMENDED EXCLUDING `max` AND THE AUTHOR
      OVERRULED IT; the override is better grounded than the recommendation and
      is recorded as such rather than as a live objection. The recommendation
      rested on `max`'s measured profile — 2363 s against a real diff, killed,
      ZERO BYTES produced, ~$371.54 price proxy totally lost — and on
      clarification 44 having superseded `max` that same morning. What defeats
      it is clarification 45, the author's own ruling the same day: an
      overrunning instrument run is NEVER killed, and the detached harness
      bounds it at 5400 s instead. The $371.54 figure is the cost of a KILL, and
      kills no longer happen — so that catastrophic profile belongs to the
      retired synchronous regime, not to `max`. RESIDUAL EXPOSURE, recorded
      rather than dismissed: an automatic mechanism can now reach a level whose
      realized DETACHED cost nobody has measured. That is why requirement (3) is
      load-bearing rather than bookkeeping. The routing condition requires
      explicit author approval for every routing change; this round is that
      approval for the band. Carrier: tactic-review-plan-preflight-skill."
  - question: What is a re-review's diff base, and what stops a narrowed base from
      reducing detection?
    answer: "(Recorded 2026-08-13 /align round, author-directed.) The base narrows
      to the LAST-REVIEWED SHA; the reviewers' READ ACCESS does not narrow with
      it. MOTIVATING EVIDENCE, traced end-to-end this session: node
      tactic-attention-namespaced-rank completed a full /review-fix pass costing
      3 h 26 min and 32 subagents (marker landed f3e0a632); /fix-checks then
      pushed ONE CI-repair commit; resolving the fix-interrupt (c49270f1)
      stripped the `reviewed` marker — correctly, see clarification 51 — and the
      lane re-entered review and began re-reviewing the ENTIRE PR from
      merge-base. The waste is the whole prior review, re-performed for one
      commit. WHY THIS IS LEGAL: the quality-preservation condition names
      trigger narrowing as a sanctioned structural lever, and clarification 16
      restates the same at phase level. WHAT WOULD MAKE IT ILLEGAL: a defect
      whose cause is the INTERACTION between the new delta and untouched code —
      a helper's contract changes and an unmodified caller three files away
      breaks — is invisible to a literal `git diff <last-reviewed>..HEAD`. Not
      hypothetical for the motivating case: /fix-checks repairs under CI
      pressure are exactly the class that changes contracts. THREE PARTS,
      required together — shipping the narrowed base without them IS the
      detection reduction the condition forbids: (1) reviewers keep the whole
      tree readable and are briefed to follow the delta's blast radius outward;
      (2) the out-of-diff files referencing any changed symbol are computed
      MECHANICALLY and named as required reading (clarification 54 records why
      this is a stdin-to-stdout classifier rather than an LLM analysis); (3)
      unresolved and deferred findings from the prior review CARRY FORWARD into
      the re-review pool, so re-scoping cannot silently drop a finding the
      earlier pass raised. Two alternatives were put and DECLINED: a hard delta
      where reviewers see only the changed lines (it accepts the interaction
      blind spot for precisely the change class that most needs it), and
      narrowing only for review-lane-caused deltas (two code paths and a
      provenance test that can be wrong, for a narrower saving than part 1
      already gives). MECHANISM NOTE for a clean session: both lanes read one
      variable — `MERGE_BASE=$(git merge-base HEAD origin/main)` at
      .claude/skills/review-fix/SKILL.md:267 — which feeds the built-in's
      `--target \"$MERGE_BASE..HEAD\"` (Step 1b) and the Workflow's `merge_base`
      arg, so the narrowing has ONE site, not two. Carrier:
      tactic-review-delta-base-and-blast-radius."
  - question: Where does the last-reviewed sha live, given that the `reviewed`
      marker is stripped when a fix-interrupt resolves?
    answer: "(Recorded 2026-08-13 /align round, author-directed; the sidecar is
      author-approved on Claude's recommendation with two verifications
      explicitly OWED rather than assumed.) A WORKTREE-LOCAL SIDECAR,
      `.claude/worktrees/<node-id>.review-base`. THE GAP, verified from source
      this session: nothing records what sha was reviewed. The node lane's
      completion marker is the bare string `reviewed` in `execution.markers`;
      the PR lane's is the `dispatch:reviewed` gh label. Neither carries a sha.
      Worse, packages/intentionsutil/scripts/apply-fix-state.ts:219-227
      deliberately STRIPS that marker on `--clear-fix` so the re-review actually
      re-runs (both the selector's phase:review+reviewed emit-guard and
      check-node-selection's reviewed-marker guard would otherwise skip the
      node) — correct behaviour, and the direct cause of clarification 50's full
      re-review. Whatever holds the sha must therefore survive that strip. WHY A
      SIDECAR: it keeps runtime state out of the graph, which the pace-machinery
      condition requires and which clarification 45 invoked when it rejected a
      graph-layer lock for \"putting runtime machinery in the graph\"; and it
      matches two existing precedents on this exact surface —
      `.claude/worktrees/<id>.scope-fingerprint` and the `.code-review-lock`
      sidecar clarification 45 chose. apply-fix-state does not touch it, so the
      strip cannot erase it. IT FAILS CLOSED: sidecar absent, unreadable, or
      naming a sha not reachable from HEAD means a full `MERGE_BASE..HEAD`
      review, never a silently narrow one. This is the ONE place in this round's
      design that fails closed rather than open, and deliberately — here the
      cheap outcome is the narrow review, so the safe failure is the expensive
      one. TWO VERIFICATIONS OWED, flagged by Claude as unverified at ruling
      time and accepted by the author on those terms: (a) whether these sidecars
      survive every worktree-sweep path, and (b) how the key is formed for the
      PR lane, which is not node-id-keyed. Both belong in the carrier's first
      unit as probes, not as assumptions. TWO ALTERNATIVES DECLINED: recording
      the sha on the node (most durable, but puts runtime state in the graph
      against the condition above), and deriving it from the GitHub timeline
      (breaks for node-lane reviews that deliberately never apply the label, and
      the verified-attribution condition prefers reading a value at its source
      over reconstructing it). Carrier:
      tactic-review-delta-base-and-blast-radius."
  - question: What may a pre-review planner gate, and what may it never turn off?
    answer: "(Recorded 2026-08-13 /align round, author-directed.) SEMANTIC TRIGGERS
      ONLY — never cost-based or yield-based cuts. The planner may narrow a
      lens's TRIGGER on the semantics of the diff, and may widen one; it may
      never disable a lens because that lens is expensive or has been low-yield.
      WHY THE ASYMMETRY: the quality-preservation condition forbids removing a
      lens that produces confirmed findings, and clarification 18 is a directly
      worked precedent against the cheaper reading — api-cost was measured at
      ZERO findings across a window and was RETAINED with its trigger WIDENED,
      on the ground that \"a zero-finding window is read as sampling error, not
      as zero yield ... the correct response is more sampling rather than
      less\". Yield-based pruning was put and DECLINED for a second, independent
      reason: the lens that would ground it
      (tactic-audit-review-effort-yield-lens) does not exist, so pruning today
      would rest on intuition, which the verified-attribution condition makes
      inadmissible input to a routing decision. NOT NET-NEW MECHANISM: this
      extends a gate that already runs. `agentFinderSet(surface, app_or_rules,
      api_call_site)` at .claude/workflows/review-fix.js:597-609 already selects
      finders from a diff-CONTENT flag (`api_call_site`, emitted by
      dispatch-api-call-site), per clarification 34's ruling. The planner emits
      the same shaped flags that function already consumes, plus per-lens on/off
      WITH a recorded reason, so every gate decision is auditable against the
      quality-preservation condition. DEFAULT IS ON: an absent or unparseable
      verdict runs the full roster — the fail-open condition added this same
      day. Carrier: tactic-review-plan-preflight-skill."
  - question: Which analyses does the review pre-pass run, and what governs how they
      combine?
    answer: "(Recorded 2026-08-13 /align round; Claude-recommended and
      author-accepted in full. UNMEASURED — no run of any of this exists; the
      ordering and the raise/lower asymmetry are design judgment, not readings.)
      EIGHT ANALYSES, six mechanical and two Opus-judgment. The design principle
      is that a mechanical signal is auditable in a way an LLM verdict is not,
      and the repo already has three pure stdin-to-stdout classifiers on this
      exact seam (dispatch-changed-files, dispatch-security-surface,
      dispatch-api-call-site), so Opus judgment is spent only on what a grep
      genuinely cannot do. (1) BLAST RADIUS [mechanical] — for each symbol
      added, changed, or deleted in the delta, find referencing sites OUTSIDE
      the diff; outputs the out-of-diff files reviewers MUST read (this is what
      makes clarification 50's narrow-diff/ wide-context work) and raises effort
      on large fan-out. (2) CONTRACT DELTA [Opus] — did it change a signature,
      return shape, error or exit path, public export, schema, config default,
      or CLI flag? Raises effort and forces the analysis-1 reading list to be
      honoured. (3) IRREVERSIBILITY SURFACE [mechanical] — does it touch
      migrations, destructive git ops (reset --hard, push --force, rm -rf),
      deletes, deploy or release config, credentials, billing, or graph writes?
      HARD FLOOR at `xhigh` regardless of size; overrides every cheapening
      signal. This is the cost-of-being-wrong axis. (4) CHANGE-CLASS MIX [Opus]
      — classify hunks as mechanical / test-only / docs / config / new-logic /
      control-flow / concurrency / error-handling / data-schema; the primary
      effort driver AND the primary finder gate (all-mechanical tends to `low`,
      concurrency plus error-handling tends to `xhigh`). (5) PRIOR-FINDING
      RECURRENCE [mechanical] — does the delta touch lines the PREVIOUS review
      flagged, or that the finding ledger records against? Raises effort and
      passes the prior finding into the brief; this is also the mechanism
      serving clarification 50's carry-forward requirement. (6) TEST-COVERAGE
      DELTA [mechanical] — production logic changed with no corresponding test
      change raises effort; test-only additions lower it. (7) DELTA PROVENANCE
      [mechanical] — authored by /fix-checks, /qa-fix, /code-review --fix, or a
      human? Lane-authored CI repairs are the recurrence-prone class, and
      /code-review --fix's OWN edits are the ones no reviewer has ever looked
      at; raises effort for lane-authored deltas. Motivated directly by
      clarification 50's incident. (8) SIZE AND DISPERSION [mechanical] — lines
      added/removed and distinct top-level directories touched. TIE-BREAKER
      ONLY, listed last and deliberately demoted: size is the obvious wrong
      primary driver, since a one-line change to an auth predicate outranks a
      900-line mechanical rename. FOUR GOVERNING RULES, which bind the
      combination and are the part most likely to be dropped by a later editor.
      FAIL-OPEN: error, timeout, or unparseable verdict runs today's defaults
      (`high`, full roster) — never a cheaper review; this is the condition
      added the same day. BOUNDED: the pre-pass reads the delta once plus the
      mechanical outputs, never the whole repo, and returns a small structured
      verdict rather than prose — otherwise the pre-pass becomes the cost it
      exists to reduce. ASYMMETRIC: raising is any-of, cheapening requires ALL
      signals to agree — unanimous to go cheap, one hit to go deep. RECORDED:
      the chosen effort, the finder set, and the rationale are written out,
      which is clarification 49's requirement (3) and what keeps clarification
      46's measurement interpretable. Two smaller sets were put and declined: a
      core four (1-4), and a minimal two (3-4) which was argued against by
      Claude on the ground that dropping blast radius re-opens the interaction
      blind spot clarification 50 just closed. Carrier:
      tactic-review-plan-preflight-skill, except analysis 1, which clarification
      54 moves to tactic-review-delta-base-and-blast-radius. MODEL PIN, added
      2026-08-13 by this round's own clause-coverage walk after the interview
      had otherwise closed: the pre-pass runs as an OPUS subagent, and the pin
      is EXPLICIT. This was the author's stated requirement (\"an opus
      subagent\") and it is a routing decision, so the routing condition
      requires it be recorded here with author approval rather than left in a
      carrier's draft body — which is where it had survived until this walk. It
      is pinned rather than inherited for the reason clarification 47
      established for the review-lane session itself: a nested run does not
      inherit the launching session's model, so omitting the flag silently
      accepts a default. Note the shape this produces is the cheap-parent/
      expensive-child pattern clarification 4 already sanctioned as a special
      case — the /review-fix parent is not itself Opus-pinned, and one expensive
      child deciding the depth of a much more expensive stage is the same trade
      the /align-tactics orchestrator makes. The BOUNDED rule above is what
      keeps that trade honest: an Opus pre-pass that read the whole repo would
      cost more than the review depth it saves."
  - question: "STEELMAN: is a review pre-pass the per-run cleverness that the
      sanctioned structural lever excludes?"
    answer: "(Diverged 2026-08-13 /align round, author-directed — and the divergence
      changed the shape of the work.) THE RIVAL CONCEPTION, sourced from this
      strategy's own record rather than invented: a pre-pass is a META-OPTIMIZER
      that spends an Opus pass to decide how to spend an Opus pass, and every
      such layer must beat the far simpler rival of narrowing the base and
      tuning the default by hand. Three citations support it — clarification 46
      DECLINED an auto-reverting effort gate, clarification 18 DECLINED
      cost-based lens removal, and this strategy's rationale names STRUCTURAL
      RESTRUCTURING (batching, deduplication, context reuse, trigger narrowing)
      as the sanctioned lever. On that reading the delta-scoping is sanctioned
      and the pre-pass is not. WHAT WORKING THROUGH IT SURFACED — a real
      coupling, not a rhetorical one: clarification 50's
      narrow-diff/wide-context remedy DEPENDS on the blast-radius analysis,
      which was originally placed inside the pre-pass. As first shaped, the
      delta-scoping therefore could not ship safely without the very layer the
      steelman argues against. THE DIVERGENCE, which resolves it by DECOUPLING
      rather than by rejecting the steelman: blast radius moves OUT of the
      pre-pass into its own mechanical classifier — pure stdin-to-stdout,
      exactly like dispatch-api-call-site and dispatch-security-surface. That
      makes tactic-review-delta-base-and-blast-radius complete and safe ON ITS
      OWN, entirely within the sanctioned structural lever, capturing most of
      the saving; and it makes tactic-review-plan-preflight-skill a separate
      second step whose value is measured AGAINST THE DELTA-ONLY BASELINE rather
      than against today's full re-review. The pre-pass must therefore earn its
      own cost honestly instead of being credited with the delta-scoping's
      saving — which is the steelman's real demand, granted. Two alternatives
      were put and DECLINED: adopting the steelman outright and dropping the
      pre-pass (gives up per-diff effort selection and finder gating entirely),
      and building both as one coupled change (no independent baseline, so a
      worse result could not be attributed to either half — clarification 46's
      \"unmeasured quality bet\" problem, repeated). SEQUENCING CONSEQUENCE for
      decomposition: tactic-review-plan-preflight-skill is blocked_by
      tactic-review-delta-base-and-blast-radius, and must not be planned as one
      PR with it. NO `recovers` EDGE, on the same ground clarification 44
      recorded: this round deepens reliance on delegation-anthropic-claude's
      review instrument rather than reducing it — the pre-pass orchestrates
      /code-review more finely rather than displacing it — recorded here to stay
      visible per virtue-alignment-of-attachments' every-import-raises-exit-cost
      clause. AMENDMENT (2026-08-13, author-directed; recorded at implementation
      time, after the ruling above). THE AUTHOR COLLAPSED THE SEQUENCING RULED
      HERE. Both tactics shipped in ONE PR (#3087) rather than the pre-pass
      following the delta-scoping as a separate second step. This is an author
      ruling, not a defect and not a lane deviation. MEASUREMENT CONSEQUENCE,
      stated plainly because the record must not imply a baseline that does not
      exist: the delta-only baseline was NEVER established, so the
      delta-scoping's saving and the pre-pass's saving landed together and
      CANNOT be separated retrospectively. The \"must earn its own cost
      honestly\" demand above — the steelman's real demand, granted at ruling
      time — is therefore not satisfiable by the measurement route this
      clarification designed. What carries it instead is clarification 49's
      requirement (3), the RECORDED effort, finder set and rationale on every
      pass: it is now the ONLY thing keeping the two savings distinguishable,
      and is correspondingly more load-bearing than when it was written. It is
      enforced mechanically rather than by convention — reviewPlanEffort and
      reviewPlanFinderSet each return a rationale, /review-fix's call site logs
      both, and test-review-plan-gate.sh asserts every verdict carries a
      non-empty one. The DECOUPLING this clarification directed was still
      performed and still holds: blast radius shipped as its own stdin-to-stdout
      classifier (dispatch-blast-radius) rather than inside the pre-pass, so
      tactic-review-delta-base-and-blast-radius is complete and safe on its own.
      Only the SHIPPING SEQUENCE was overridden, not the decoupling."
  - question: What is the /align interview session's default model after the
      2026-09-02 author directive?
    answer: "(decision: ratified, 2026-09-02) Fable by default, not Opus. Author
      directive (2026-09-02, verbatim): 'new doctrine: the align skill runs with
      fable by default, not opus.' This amends the align-family posture recorded
      in clarifications 6, 7 and 10 for the /align interview session
      specifically: the interview's whole-session default is now the Fable tier
      (Claude Fable 5), superseding whole-session Opus. Unchanged:
      /align-tactics' clarification-10 split (Sonnet orchestrator, Opus for the
      decompose judgment and plan authoring) and clarification 7's enforcement
      posture — SKILL.md frontmatter remains intended-not-guaranteed on the
      user-invocable path, with the token audit's by-node/by-phase attribution
      reading the realized model after the fact. The /align SKILL.md text update
      is retained as draft tactic tactic-align-skill-fable-default."
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
      is applied automatically. The /align-tactics worker executes as a
      deterministic Workflow (`.claude/workflows/align-tactics.js`,
      /review-fix-shaped, clarification 14): a Sonnet top-level orchestrator,
      Opus subagents for the decompose-to-signal judgment / two-sided
      drift-review verdict / per-tactic plan authoring, and Sonnet subagents for
      the Explore reuse-hunt and mechanical gathering; the reuse-hunt fan-out
      stays demotable to Sonnet or Haiku."
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
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
  last_aligned: null
attributes:
  conditions:
    - the plan stays prepaid with a weekly allowance (Max 20x); metered
      per-token pricing inverts the economy to spend-minimization and this
      strategy re-derives from its virtues
    - the token audit stays runnable and attributable across the router
      migration — a session that cannot be attributed to a node and phase is
      invisible to every control loop here
    - "routing recommendations are grounded only on yield metrics whose
      accounting is verified (the qa fixes_applied gap is open as of
      2026-07-04), and every routing change requires explicit author approval
      before implementation — the audit-written policy loop surfaces
      recommendations, it never auto-applies (clarification 10). Scoped
      2026-08-13 (clarification 49): this bar governs standing policy defaults,
      not per-input selection inside an author-fixed band — the carve-out holds
      only while the band is author-set, the default is what a failed or absent
      verdict gets, and every deviation is recorded with its rationale"
    - pace machinery stays operational config outside the graph
      (strategy-graph-native-dispatch clarification 14); this strategy records
      requirements, not machinery
    - efficiency changes to review and QA phases preserve finding quality — a
      change that reduces detection is not a throughput gain even if it reduces
      allowance draw; structural restructuring (batching, deduplication, context
      reuse, trigger narrowing) is the sanctioned lever, and removing a lens
      that produces confirmed findings is not
    - a yield metric credited to a named instrument is verified to have come
      from that instrument — invocation success checked at the source (exit
      status and output signature), never taken from an agent's account of what
      it ran; an unverified instrument attribution is not admissible input to a
      routing decision
    - the token audit is ONE instrument at two scopes — the same
      aggregate-usage.sh, the same JSON schema, and the same lens catalog serve
      both the per-run session evaluation and the periodic fleet audit; a new
      lens is added to the catalog, never to a second parallel analysis. Lenses
      whose denominator is fleet-sized (pooled by_phase_outcome rates,
      boot-context median/peak, phase-standup, cross-session error signatures,
      recurrence) are tagged fleet-only and are ABSENT at n=1, never
      approximated from a single run (Recorded 2026-08-12)
    - "execution belongs to the attended surface only: the author-invoked
      periodic audit may run /fewer-permission-prompts and write
      .claude/settings.json; the unattended per-phase evaluation measures
      permission friction and records it, never acts. This narrows report-only
      to 'writes no routing policy and no graph or product files' and leaves the
      no-auto-apply bound on routing policy entirely unchanged (Recorded
      2026-08-12)"
    - an instrument run that overruns its await window is never killed — `claude
      -p` buffers output, so a kill is a total loss rather than a degraded
      result; the phase's hard stop fires at deadline exhaustion, never at the
      await boundary, and the node stays locked for the detached run's own
      lifetime independently of whether the launching session survives (Recorded
      2026-08-13)
    - an efficiency mechanism that selects review depth or lens coverage FAILS
      OPEN — an error, timeout, absent input, or unparseable verdict runs the
      unconditional defaults (effort `high`, the full finder roster), never a
      cheaper or narrower review; a cheapening path reachable by failure is a
      detection reduction wearing an efficiency label. The one deliberate
      exception is the review BASE, which fails closed to the full merge-base
      diff — there the cheap outcome is the narrow review, so the safe failure
      is the expensive one (Recorded 2026-08-13)
  criteria:
    - id: fn-mainqa-outcome-envelope-node-lane-parity-1
      statement: A real node-lane /qa-fix or /review-fix session emits an outcome
        envelope carrying issue null and node_id set to the node's slug, and
        aggregate-usage.sh surfaces it on .sessions[].outcome.node_id. Observed
        by grepping that session's transcript for a dispatch:outcome:v1 block
        and matching the aggregator's node_id for that session id. Post-merge
        verification item of PR 3030.
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-api-cost-lens-merge-1
      statement: "Post-merge monitoring shows the api-cost lens firing materially more
        often than the pre-merge baseline of 5 of 18 comparable runs, at an
        acceptable draw, with no recurring 'classify: COST CLAMP' log line.
        Observed by grepping accumulated run logs for find:api-cost and
        comparing realized fire rate and draw against that baseline. Post-merge
        verification item of PR 3031."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-cross-lane-dedup-1
      statement: "The first live /review-fix run after merge shows end-to-end
        cross-lane absorption on real data: xlane-dedup-labelled partition
        agents appear (or zero contested locations, also valid), the absorption
        summary log line is present, the residue count drops by exactly the
        absorbed count, and the posted PR comment shows the absorbed root once
        under the Lane-B source with both lanes listed in sources. Post-merge
        verification item of PR 3028."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-domain-lens-consolidation-1
      statement: "On a live run the merged single-agent domain sweep returns findings
        whose attribution is indistinguishable from the prior three-agent
        arrangement: every finding carries a Source of exactly secrets, auth, or
        data-exposure, never a combined name, and validates against the
        unchanged enum. Observed in that run's log by confirming 'finders: wave
        2 = launching 5 finder(s)' and a single find:domain-sweep agent where
        three ran before; an empty domain-sweep result on a diff with an obvious
        secret is the failure signature. Post-merge verification item of PR
        3024."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-domain-lens-consolidation-2
      statement: The domain-lens fold delivers a material measured cost reduction
        while per-lens confirmed-finding yield holds at or above the baseline of
        2 confirmed findings across secrets, auth and data-exposure over 18 runs
        ($41.55, 2026-07-27 to 2026-07-31). Observed over a post-merge audit
        window by comparing the combined find:domain-sweep draw and the combined
        confirmed findings joined by Source against that baseline; a combined
        confirmed count below 2 calls for prompt strengthening, never a
        model-tier change without a measured A/B. Post-merge verification item
        of PR 3024.
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-skill-body-decomposition-1
      statement: "Parent-session context reduction materializes on live runs:
        parent-worker peak context drops materially below the 184,468-token
        baseline and the majority of post-merge /review-fix runs fall under
        150k, with no offsetting blow-up in any subagent. Observed with
        aggregate-usage.sh --days 7 over worker sessions carrying a review-fix
        phase, reading avg_peak and the over_150k count. Post-merge verification
        item of PR 3025."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-skill-body-decomposition-2
      statement: "A /review-fix session interrupted mid-run - after the Workflow
        returns but before Step 6 completes - resumes cleanly through the new
        subagent boundaries: exactly one marker PR comment, exactly one set of
        follow-up nodes, and graph-commit landing once. Observed on the next
        such interruption by confirming a single dispatch:review-fix PR comment
        and a single set of follow-up draft tactic nodes, with no duplicates
        from a resumed Step 5 or 6 subagent fork. Post-merge verification item
        of PR 3025."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-skill-body-decomposition-3
      statement: "The extracted dispatch-review-codeql and dispatch-review-npm-audit
        scripts surface exactly the findings the old inline blocks would have on
        a comparable diff: same alerts, same severity mapping, same
        introduced_by_diff classification, same omission of pre-existing
        moderate and low advisories. Requires live CodeQL alerts and a real
        dependency-changing diff on an app_or_rules surface, compared by hand
        since no automated pre/post harness exists. Post-merge verification item
        of PR 3025."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-verify-per-file-batching-1
      statement: "The verify-phase subagent count per review-fix run drops toward the
        distinct brief-by-file group count, confirming the batching produced the
        intended cost reduction rather than only restructuring prompts. Observed
        by running /dispatch-token-audit over the post-merge window and reading
        the new verify: and residue: log lines against the pre-change baseline
        of 131 subagents across 41 distinct (run, file) groups over 18 runs.
        Post-merge verification item of PR 3027."
      class: functional
      authority: deferred
      recorded: 2026-09-02
    - id: fn-mainqa-review-verify-per-file-batching-2
      statement: Refutation rate stays near the measured 69% baseline (91 refuted, 37
        upheld), every Required finding carries its required vote count with a
        floor of 1 and never 0 in real runs, and batched judgments show no
        anchoring drift where one strong finding pulls the verdicts of its
        file-mates. Observed by comparing the skeptic refutation rate against
        that baseline and inspecting verify_report blocks in future PR comments
        for unverified verdict entries. Post-merge verification item of PR 3027.
      class: functional
      authority: deferred
      recorded: 2026-09-02
---
# The prepaid token allowance converts fully into tactic closure — utilization near 100%, closure velocity at or above arrival

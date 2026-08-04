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
reading: "utilization: 1% weekly; tactics 28d: 224 created / 90 closed (net +134)"
gap: 'reading "utilization: 1% weekly; tactics 28d: 224 created / 90 closed (net
  +134)" does not meet threshold "utilization near 100% of the weekly allowance
  while open claude-eligible tactics are non-increasing (closure at or above
  arrival); full utilization with a growing backlog fails the signal"'
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
      it gates any rewiring.
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
      disable-model-invocation mark, invokes cleanly, and edits nothing."
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
    - routing recommendations are grounded only on yield metrics whose
      accounting is verified (the qa fixes_applied gap is open as of
      2026-07-04), and every routing change requires explicit author approval
      before implementation — the audit-written policy loop surfaces
      recommendations, it never auto-applies (clarification 10)
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
---
# The prepaid token allowance converts fully into tactic closure — utilization near 100%, closure velocity at or above arrival

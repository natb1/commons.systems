---
id: strategy-recursive-self-improvement
kind: strategy
statement: Harness self-improvement is measurement, not a second orchestrator —
  /rsi evaluates each finished dispatch-ladder phase and /rsi-audit measures
  token economy at any scope, and both land findings as merged ledger entries
  the dispatch queue executes
owner: human
status: refining
parent: strategy-autonomous-execution
rationale: >-
  The graph-native dispatch bootstrap produced a meta-loop: /rsi, an attended
  session that evaluated the harness each iteration, maintained rsi-plan.md as
  the author-facing status surface, held pause authority over the dispatch
  queue, and shortcut critical-path work the harness could not reach. (Retired
  2026-08-12 by author ruling.) What replaces it is smaller and mechanical: the
  harness measures itself continuously and records what it finds, and the
  ordinary dispatch queue executes the repairs. /rsi is now the per-phase
  evaluator the ladder driver spawns fire-and-forget at every phase boundary;
  /rsi-audit is the token-economy instrument at fleet or single-node scope; both
  write findings into one merged ledger, one node per distinct finding carrying
  a recurrence count and summary impact metrics. Neither judges, routes,
  executes, pauses, or escalates.


  The evaluation scope is unchanged in intent — implementation bugs inconsistent
  with documented intention, execution inefficiencies (token waste from poorly
  managed context, unoptimized model choice, redundant work, repeated errors),
  ambiguities in author intention, and technical debt not justified by current
  greenfield design — but two of those four now have weak or absent mechanical
  carriers, which the collapse clarifications state plainly rather than paper
  over. Goal (a), accelerating the bootstrap of a stable graph-native dispatch
  workflow, is retired with the shortcut path; goal (b), a recursive workflow
  for ongoing harness optimization, is what remains, and it is now a measurement
  loop feeding the ordinary queue. The research lane recorded 2026-08-10 remains
  specified and unbuilt.
reading: "pause: paused; backlog: 58/236 = 24.6% (band ≤35%); parked: 156 (21
  blocking); worktrees: 54; tokens 7d: dispatch 91% / office-hours 0% / rsi 0% /
  other 9%"
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: Why a new strategy rather than an edit of strategy-graph-native-dispatch?
    answer: (Recorded 2026-08-10 interview.) strategy-graph-native-dispatch records
      the execution architecture — dispatch runs on the graph. rsi is a
      meta-optimization loop with its own success signal, its own machinery (the
      rsi skill family and rsi-plan.md), pause authority over dispatch, and a
      shortcut implementation path; folding it in would overload a node already
      carrying 181 clarifications and trigger open-child freeze classification
      across ~46 open children for content that is a different intent.
  - question: Steelman — should the harness improve itself solely through its own
      machinery-defect lane (no second orchestrator), as the phase-skills
      doctrine's bar on orchestrator subagents suggests?
    answer: "Diverged 2026-08-10, reason recorded: bootstrap deadlock is real — the
      harness cannot fix itself when its own defects block its lifecycle (the
      reap gate refused every reap for days; dispatch is paused by author
      directive 2026-08-10), and weeks of bootstrap WIP were carried by hand-run
      monitor sessions with no recorded workflow. rsi formalizes that hand loop.
      Divergence is bounded: rsi reuses the dispatch phase skills verbatim so
      the quality bar stays unified, claims nodes under the same serialization
      discipline, and is itself serialized and budget-bounded. (Amended
      2026-08-10 review round: the verbatim-reuse resolution narrows the
      divergence further — rsi adds no second orchestration surface at all, only
      a scheduling shortcut.)"
  - question: What is rsi-implement's contract?
    answer: "(Recorded 2026-08-10.) Shortcut implementation for high-impact,
      critical-path items such as bugs affecting harness integrity, carried all
      the way through merge and main-qa; on a blocker that cannot be resolved
      mechanically, it throws to the main-thread rsi session, which conducts an
      office-hours session and updates rsi-plan. (Amended 2026-08-10 review
      round.) rsi-implement is not a separate orchestration surface and not an
      Agent-tool subagent — an Agent subagent cannot run the Workflow-dependent
      phase skills. It is a thin loop in /rsi: claim the node, serially spawn
      the existing dispatch phase skills as sessions via dispatch-graph-execute
      / dispatch-spawn-job, await each session's terminal disposition, let the
      tick's merge lane merge, and handle parks and throws attended. Unit-level
      model selection stays inside the phase skills' own heuristics; the earlier
      'sonnet subagent' form is superseded. (Amended 2026-08-12 /align round.)
      The loop is no longer \"a thin loop in /rsi\". It was extracted to its own
      user-invocable skill, /dispatch-emulate (landed 55d07b51, PR #3069), which
      is now its only home: the advance/await cycle, the exit-code contract, the
      phase ladder, and the three non-negotiable rules all live there. Its two
      scripts moved and were renamed — rsi-advance and rsi-await became
      dispatch-emulate-advance and dispatch-emulate-await. rsi-claim did NOT
      move: it serializes rsi SESSIONS, not nodes, and node-level mutual
      exclusion is the advance script's exit 13. /rsi Step 4b is now a
      delegation invoked in the main thread, never in an Agent-tool subagent,
      and it restates none of the loop's mechanics. The skill also refuses a
      strategy id mechanically (exit 2), so an rsi task on a strategy runs
      /align-tactics first and then emulates a child tactic. Everything the
      contract says about WHAT the loop does is unchanged — the extraction moved
      no scheduling authority. The requirement for the skill is recorded on
      strategy-graph-native-dispatch (2026-08-12), which owns the dispatch skill
      surface and already carried the emulation doctrine the skill obeys; read
      the bound and the second-orchestration-surface divergence there."
  - question: How are inefficiencies surfaced by rsi's own orchestration handled?
    answer: (Recorded 2026-08-10.) Tracked in the graph as tactics and reflected in
      the rsi-plan, so they optimize implementation for both the harness and the
      rsi skill.
  - question: Is rsi an executor of the graph?
    answer: (Recorded 2026-08-10.) No. Unlike the harness, rsi does not execute the
      graph directly; it plans for harness optimization and shortcuts
      critical-path items to accelerate the harness's optimized functioning —
      e.g. where harness implementation of itself causes bootstrap deadlock or
      slow progress.
  - question: How does rsi count against the dispatch pace curve?
    answer: (Recorded 2026-08-10 interview.) It does not — rsi sessions and
      rsi-implement work are pace-exempt; the session budget and the
      single-active-session serialization are the throttle. A closed pace curve
      must not deadlock rsi exactly when the harness is broken, which is the
      bootstrap-deadlock case rsi exists for.
  - question: How is the rsi-plan.md direct-push reconciled with
      strategy-graph-native-dispatch's condition restricting direct-push commits
      to intentions/ paths?
    answer: "(Recorded 2026-08-10 interview.) As a recorded, bounded exception
      carried on this strategy's conditions: rsi-plan.md is single-writer and
      serialized so the contention rationale behind the restriction does not
      apply. tactic-rsi-direct-push-condition-reconcile carries the amendment of
      that condition on strategy-graph-native-dispatch for its next edit round,
      avoiding a mass open-child freeze classification mid-bootstrap."
  - question: What fitness function does rsi optimize?
    answer: "(Recorded 2026-08-10 review round.) Value delivered by the combined
      harness system — dispatch, office-hours, and rsi together — where value
      means achieving author goals/intentions, operationalized as tactic closure
      velocity plus strategy signal/threshold progress, per token spent, with
      spend attributed across the three workflows. rsi optimizes this broad
      fitness function, never a local one (its own convenience, dispatch
      throughput alone). Token economy is measured for all three workflows; the
      greenfield expectation is that dispatch usage significantly outpaces
      office-hours and rsi, and a deviation — rsi or office-hours spend
      approaching dispatch — is itself a review trigger. The bootstrap-shaped
      success_signal threshold is the near-term proxy for this function
      (is_proxy: true)."
  - question: How are rsi-plan metrics implemented?
    answer: (Recorded 2026-08-10 review round.) As sensors registered in the graph's
      existing success_signal/readings machinery on their owning strategies —
      the same machinery whose unregistered-sensor gap
      strategy-graph-drives-dispatch already measures — never as a parallel
      metric registry. render-rsi-plan.ts renders the readings into rsi-plan.md.
  - question: Is /rsi attended or autonomous?
    answer: "(Recorded 2026-08-10 review round.) Attended: author-invoked, one
      iteration per invocation, never scheduled or cron-driven. The
      requirement's interactive limbs — the optional /align escalation and the
      office-hours conduct when rsi-implement throws — assume the author is
      present; unattended recursion is the harness's job, and an unattended rsi
      would be a materially different, riskier design requiring its own
      interview. (Amended 2026-08-10 research-lane round: this binds the /rsi
      loop proper. The scheduled /rsi-research sensor lane is not /rsi — it
      executes nothing, judges nothing, and writes only inert output for
      author-gated incorporation — so its weekly cron schedule does not
      contradict this answer; see the research-lane clarification of that
      date.)"
  - question: How does scheduled /deep-research extend rsi (the research lane)?
    answer: "(Recorded 2026-08-10 interview.) A scheduled sensor lane,
      /rsi-research, runs weekly via harness cron: it claims the
      strategy-recursive-self-improvement worktree (fail-closed against a live
      /rsi — the same worktree-as-claim serialization), runs /deep-research over
      the seed texts recorded on tradition-agentic-engineering, and writes ONLY
      inert output in one graph-commit: (1) a dated reading on this strategy —
      rendered into rsi-plan.md by render-rsi-plan.ts, satisfying the
      fully-rendered condition; (2) born-parked candidate curriculum chunks for
      reading-worthy sources, in the grounding-research step-3 convention,
      reviewed at office-hours sittings; (3) draft tactics for concrete
      fit-function opportunities, serving this strategy, consumed by /rsi's
      judgment step. New candidate seeds the research discovers follow the
      curriculum's recursive-frontier rule: named in the cycle's reading as
      candidates, promoted to the tradition record's texts only by author
      ratification. The lane never writes grounding marks, never edits tradition
      records or graph doctrine, and never executes work — the sensor/actuator
      split of the grounding-gap precedent (autonomous sensor, author-gated
      actuator). Skill build tracked at tactic-rsi-research-skill."
  - question: Steelman — should fit-function optimization be endogenous-only (own
      telemetry), external crawling being fashion-import and vocabulary capture?
    answer: "(Adopted-in-part and diverged 2026-08-10, reasons recorded.) Adopted:
      endogenous primacy — own telemetry (transcripts, token audits, closure
      velocity, the readings machinery) stays the primary fit-function input,
      and an external finding never outranks a measured internal signal:
      findings are hypotheses to test against own telemetry, never directives.
      Diverged from exclusivity: an individual-scale harness cannot rediscover
      the frontier alone, so external findings enter — but every entry is
      author-gated. Capture note: the lane has a self-curation bias — Claude
      curates what the author reads about optimizing Claude's own harness (the
      same framing-risk shape as strategy-graph-review-curriculum's capture
      note). Mitigations are existing machinery: the seed list is
      author-ratified on tradition-agentic-engineering, incorporation is
      author-gated, and the selection-bias audit capstone /reading-review mints
      covers the record."
  - question: How is the scheduled lane reconciled with
      strategy-complete-grounding's condition that /deep-research sourcing stays
      author-invoked?
    answer: "(Recorded 2026-08-10 interview.) Read as scoped: that condition governs
      grounding-mark sourcing in complete-grounding's own workflow — the tick
      never runs /deep-research to write grounding marks — and the rsi research
      lane writes no grounding marks and no tradition-record content, so it does
      not enter that workflow. The scoping is carried here as a recorded,
      bounded reading, with tactic-grounding-deep-research-condition-reconcile
      queued to narrow that condition's wording explicitly at
      complete-grounding's next edit round — the same pattern as
      tactic-rsi-direct-push-condition-reconcile, avoiding an open-child freeze
      classification on a sibling strategy mid-bootstrap."
  - question: Does the dispatch pause stop the queue from draining, and can its own
      resume criteria be met while it is in force?
    answer: >-
      (Recorded 2026-08-11 rsi iteration, from reading the code at origin/main.)
      Partly, and no. The pause sentinel is documented as gating worker SPAWNING
      only, and the paused branch does run the healing sweeps (reservation,
      stand-down re-check, stale-hold re-check, frozen-session,
      terminal-disposition) before its exit 0. But the node-lane merge lane is
      not among them: graph-auto-merge is invoked at dispatch-select-tick:505,
      and every dispatch-select-tick invocation (dispatch-tick:638-642) sits
      past the pause short-circuit's exit 0 at dispatch-tick:415. Merging a
      reviewed green PR is the terminal drain step, so pausing does cost
      healing, contrary to the intent recorded for it. The consequence is
      concrete: resume criterion 1 requires PR #3052 to be merged, and #3052 is
      a node-lane PR in phase review that has been 23/23 green and unmerged
      since the pause began. A pause whose first resume criterion requires an
      action the pause itself disables cannot lift autonomously. The escapes are
      an operator-run dispatch-tick --manual (dispatch-tick:314 tests -z
      "$MANUAL") or an author hand-merge, and both are operator actions no part
      of the record named as a dependency of resuming. Repair is tracked as
      tactic-pause-disables-merge-lane. Two record corrections follow: /rsi's
      own SKILL.md asserts "the tick's merge lane runs even while dispatch is
      paused — let it", which is false as written, and the pause rationale's
      claim that the paused branch is "precisely the set needed to drain a
      queue, so pausing costs no healing" overstates what that branch covers.


      (Amended 2026-08-12 /align round, two corrections and a decision.) FIRST,
      the false-sentence locator above is now stale: the assertion "the tick's
      merge lane runs even while dispatch is paused — let it" no longer lives in
      /rsi's SKILL.md. The 2026-08-12 extraction moved it verbatim into
      .claude/skills/dispatch-emulate/SKILL.md, which reduced it to one home
      rather than duplicating it; /rsi carries no merge instruction at all now.
      SECOND, the finding recorded above is confirmed still true at fb1dc4cc,
      and its repair is in flight: tactic-pause-disables-merge-lane is at phase
      qa on PR #3068, whose diff computes OPEN_MAIN_RED via
      dispatch-graph-main-red-sync, gates graph-auto-merge on it exactly as
      dispatch-select-tick does, and runs reconcile-graph-merged
      unconditionally, with tests for both. That PR is itself stalled behind the
      bug it fixes — it sits at qa while the pause blocks worker spawning and
      blocks the merge that would land it, the identical self-blocking loop
      recorded here for PR #3052. THIRD, the author ruled on the underlying
      design rather than on the wording: the emulation loop should own its own
      merge by delegating to graph-auto-merge, rather than depending on a
      scheduler it exists to route around. That decision, its accepted
      consequences, and its three-step sequence are recorded on
      strategy-graph-native-dispatch (2026-08-12, "Who merges an emulated run's
      PR"), which owns the merge scripts.
  - question: What actually consumes the wall-clock of an rsi-implement task, and
      where should the next iteration look for acceleration?
    answer: >-
      (Recorded 2026-08-11 rsi iteration, from the first acceleration review run
      under condition 14.) Recording state cost far more than producing it, and
      CI signal quality cost more than either.


      Measured on tactic-pause-disables-merge-lane. The fix phase entered its
      interrupt at 11:21:15 (78dc28b5) and the fix worker pushed at 11:26:44
      (74548a2b) — about five and a half minutes. That push contained no code
      change at all: it is a bare merge of origin/main, because the CI failure
      it was dispatched to fix was an infrastructure flake. The resulting fix
      state did not land on main until 12:11:55 (82b2f8fe). So roughly 50
      minutes elapsed to record a five-minute no-op, and the recording dominated
      the work by about eight to one. Every graph state write pays the same
      shape of cost: a scratch branch, a full required-check run, and the
      landing lock, serialized against every other writer.


      The node also consumed four pushes at roughly 23 checks each, and was
      still unmerged 2h18m after its implement commit (841ac70a, 10:34:05).


      Four findings were recorded as their own nodes rather than here:
      tactic-flake-hook-tests-graph-commit-fixture-clone (a swallowed fixture
      clone failure presented as 11 product failures, which is what sent a whole
      fix session after a flake),
      tactic-orphaned-check-run-pins-pending-ci-guard (orphaned check rows that
      pin a node and block all graph writes — the reason this node never reached
      done in-session), tactic-select-tick-main-sync-gated-on-caller-cwd (the
      shared main checkout going stale and one stray dirty file there wedging
      three writers at once), and tactic-rsi-implement-acceleration-review (the
      skill mechanism for this review, plus sizing the rsi-await window to
      observed phase durations).


      What is deliberately NOT concluded here: that per-write graph latency
      should be reduced by weakening the required-check gate. That gate is what
      makes the store trustworthy. The measurement is recorded so a future
      iteration designs against it — batching independent node writes into one
      graph-commit call is the cheap lever already available, and this session
      used it — but the design work is not done and should not be improvised.
  - question: Does the greenfield design carry an evaluation phase after an
      implementation task, and does it instruct the session to identify
      avoidable issues and track them?
    answer: >-
      (Confirmed 2026-08-11 by the author, on the reading offered that day; no
      amendment made.) Yes — condition 14, recorded earlier the same day, is
      that step, and the author ratified its existing text as already covering
      avoidable-issue identification and tracking rather than widening it.


      How the coverage reads. Condition 14 requires the review to run after the
      node reaches its terminus, inside the same task at no extra budget cost,
      and to evaluate the observed execution over named waste categories: phase
      wall-clock against the await window, failed or wasted launch cycles,
      repeated operator interventions, round trips that produced no code change,
      and CI/fix-lane spend. Those categories are what an avoidable failure
      actually looks like in this harness's telemetry — a mis-signalled CI
      failure surfaces as a launch cycle that produced no code change. The
      condition then requires every finding to land in the graph in that same
      session, as a tactic or as a dated clarification on an existing node, and
      names a session that leaves findings in session prose only as a defect.
      Identification is the waste-category walk; tracking is the
      must-land-in-the-graph rule. The word 'avoidable' does not appear in the
      condition; the author's ratification is that the enumerated categories
      plus the tracking rule carry the requirement without it.


      The worked example that prompted this confirmation. The 2026-08-11
      iteration's hook-tests failure reported eleven product-test failures that
      were in fact one swallowed `git clone` in fixture setup — a test harness
      with `set -uo pipefail` and no `-e` continuing past a failed clone. A
      whole /fix-checks session was dispatched after it and its commit contained
      no code change at all. Under condition 14 that is a no-code-change round
      trip, and it was tracked as
      tactic-flake-hook-tests-graph-commit-fixture-clone rather than counted as
      spend. The same review recorded
      tactic-orphaned-check-run-pins-pending-ci-guard and
      tactic-select-tick-main-sync-gated-on-caller-cwd by the same route.


      Scope, deliberately not widened. The binding requirement stays on
      rsi-implement tasks, not on every dispatch implementation-phase worker.
      The author's 'after any implementation task' is read as any rsi-implement
      task. An rsi task has an attending author and an explicit budget; a
      dispatch phase worker has neither, so a per-node review obligation there
      would add real per-node cost and produce findings with no one present to
      judge them. Whether a dispatch-wide evaluation phase is worth its cost is
      an open question for its own interview, not settled here.


      The mechanism that makes the condition bind a fresh session is
      tactic-rsi-implement-acceleration-review: /rsi's SKILL.md Step 4b ends at
      'stop when idle' and Step 5 lists four report items, neither mentioning a
      review, so a clean session executing the skill alone would not perform it.
      That tactic adds the closing loop step and the fifth report item. Until it
      lands, the condition is specification without a carrier in the skill text.
  - question: What does one /rsi iteration do?
    answer: "(Recorded 2026-08-10.) Step 1: a subagent running /rsi-plan re-renders
      rsi-plan.md. Step 2 (optional): run /align when findings require author
      input and cannot be resolved from guidance already in the graph. Step 3:
      either (a) update the graph and draft tactics for harness optimization or
      graph quality, or (b) execute tasks on the rsi-plan until the session
      budget is exhausted. (Amended 2026-08-10 review round.) Step 1 is
      rendering only: /rsi-plan runs render-rsi-plan.ts, drafts the three queue
      summaries (landed as readings on their owning strategies), and flags
      mechanical staleness — completed tasks whose nodes are done, breached
      thresholds; it does not judge. (Amended 2026-08-11: /rsi-evaluate sits
      between the render and the main-thread judgment — see the /rsi-evaluate
      clarification of that date; the main-thread judgment step retains only the
      authority limbs.) Between step 1 and step 2, /rsi-evaluate — the
      delegated-judgment subagent — re-evaluates the graph diff-aware,
      reprioritizes dispatch-delegated tactics, re-derives the task plan
      (attributes.rsi_task), and drafts flag interpretations, defect tactics,
      and harness-vs-rsi routing recommendations; the main-thread judgment step
      that follows holds ratification of routing that commits budget, the /align
      decision, and the other authority limbs — the main thread holds the
      serialized claim for the session, and judgment is never delegated to the
      rendering subagent (/rsi-plan stays judgment-free; delegated judgment
      lives in /rsi-evaluate, ratification stays main-thread)."
  - question: What must rsi-plan.md contain?
    answer: "(Recorded 2026-08-10.) Six sections: a summary of top author
      priorities, with the subsets delegated to dispatch and planned for the
      rsi-plan; the status of dispatch-delegated priorities with expected
      completion dates; critical office-hours parked nodes and whether each
      blocks model execution (dispatch) or other priorities; metrics summarizing
      harness functionality and progress — a subset of signals collected by the
      graph that trigger review at some threshold; recommended additional
      telemetry/context for author comprehension of graph health and harness
      execution status, if any; and a plan for rsi tasks. The document
      eventually integrates into the office-hours GUI project; it starts as the
      .md file. (Amended 2026-08-10 review round: every section is rendered from
      graph state by render-rsi-plan.ts — see the fully-rendered condition; the
      required brief status summaries of the dispatch queue, the office-hours
      queue, and the rsi plan are model-generated by /rsi-plan and their source
      of truth is the graph, as dated readings on the owning strategy nodes,
      never the .md.) (Amended 2026-08-11 interview.) Three format requirements:
      (1) the top-author-priorities table gains an estimated-delivery-date
      column; (2) the dispatch-status section lists top-ranking nodes by (tier,
      rank) — one node per line, never grouped by phase — with columns for
      parent strategy, phase, and estimated delivery date; (3) the task plan
      gains a type column (implementation, pause queue, …) and a reasoning
      column replacing status — an implementation row’s reasoning must state why
      the task is on the rsi plan rather than the dispatch queue (a bug
      affecting queue integrity, a bootstrap deadlock to unblock, …). Estimated
      delivery dates are derived at render time — never stored, the same
      derived-on-read doctrine as rank. Mechanism: velocity is the dispatch
      queue’s 28-day closure rate in closures/day (the existing closed-series
      aggregate); a tactic row’s ETA is today + (its 1-based position in the
      (tier, rank) order ÷ velocity) days; a strategy row’s ETA (section 1) is
      today + (its open-tactic count ÷ velocity) days — the drain time of its
      open children. Zero velocity (a paused queue) renders honestly as
      unavailable. Render work tracked at tactic-rsi-plan-priority-render.
      (Amended 2026-08-11, fourth round — ownership moved and sections 1-3
      superseded.) The rsi-plan.md format contract is no longer owned here:
      strategy-rsi-plan-surface, a ranking-namespace child created this day,
      owns the author-facing status and priority view, and its clarification
      \"What is the shape of the merged priority table this strategy's tactics
      must render?\" is now authoritative for the table's format. Two changes
      that clarification makes to what is recorded above: (1) the three separate
      sections named here — top author priorities, dispatch-delegated status,
      and critical office-hours parked nodes — MERGE into a single table, with
      the strategy rows of section 1 becoming group header rows carrying the
      full strategy lineage, the parked nodes of section 3 becoming ordinary
      rows with a parked column, and two independent columns marking each row
      delegated (owner: ai) and parked (office_hours set); (2) the requirement
      recorded above that section 2 list nodes \"one node per line, never
      grouped by phase\" is preserved in substance but restated — rows are never
      grouped by phase, and are now grouped by parent strategy inside tier
      bands, with tier as the OUTER key so that reading order still equals the
      router's (tier, rank) selection order and the estimated-delivery-date
      column still counts monotonically down the page. Sections 4, 5, and 6 are
      unchanged and stay separate; the task plan in particular does not fold
      into the merged table, because its type column admits values like \"pause
      queue\" that are not graph tactics at all. The ETA derivation recorded
      above is unchanged and still governs. Implementation split:
      tactic-rsi-plan-merged-priority-table carries the merged table;
      tactic-rsi-plan-priority-render keeps the ETA derivation, the section 6
      changes, the flag kinds, the per-iteration delta, and the
      reprioritization-outcome audit."
  - question: Who may alter priorities (tier/rank), and on what?
    answer: "(Recorded 2026-08-11 interview.) Ownership-based boundary, no attention
      schema change: the author owns prioritization of strategies (all
      strategy/virtue-level attention) and of author-owned (owner: human)
      tactics; rsi owns prioritization of dispatch-delegated (owner: ai) tactics
      — /rsi-evaluate may create, rewrite, or remove their attention (boost or
      override) without author input. It never writes attributes.tier directly:
      the model’s only tier instrument is recognizing a bug or security
      classification — adding a missing bug_fix/security mark (tier escalation
      by classification, an accepted and intended effect), never removing or
      downgrading one. The author forces an ordering by grouping delegated
      tactics under a strategy and boosting the strategy — rank distributes down
      — or by flipping a tactic to owner: human. Bootstrap-era hand-set boosts
      on owner: ai tactics (the 2026-07-30 re-scale band) are included: they
      become ordinary delegated priorities."
  - question: How do tier and strategy rank compose across the delegated queue?
    answer: "(Author-directed 2026-08-11, post-review.) Tier takes precedence
      globally: tier-2 tactics across all strategies resolve before tier-1
      tactics, even when manually evaluated. Within a tier, tactics of
      higher-ranked strategies resolve before tactics of lower-ranked strategies
      — author prioritization is preserved as within-tier ordering, not as a
      ceiling on tier. Accepted risk, named deliberately: a model override on an
      owner: ai tactic displaces the strategy-distributed value for that node;
      priority_log rationale and rsi-plan.md diffs are the visibility
      mitigation. If the implemented resolver’s tier-isolation (attention.ts)
      excludes a lower-tier distributing strategy’s rank from a higher-tier
      tactic’s within-tier ordering, that is a defect against these recorded
      semantics, not doctrine — verification tracked at
      tactic-priority-provenance-schema. (Amended 2026-08-11, second round — the
      accepted-risk clause above is superseded.) A model attention write on an
      owner: ai tactic may NOT displace the strategy-distributed value in a way
      that inverts cross-strategy order. The rank algebra is namespaced, and the
      bound is asymmetric by kind. Tactic boost is SCOPED: a tactic's own boost
      orders it only within the band of its distributing strategy, at its tier —
      it can never carry the tactic past a tactic of a higher-ranked strategy in
      the same tier. Strategy boost is ADDITIVE and UNSCOPED: a child strategy's
      boost sums with its parent's (resolveAttention counts each distinct
      authored source once down parent/serves), so a child strategy may be
      boosted, in conjunction with its parent's boost, to outrank cousin and
      uncle strategies — still tier-scoped, since tier dominates
      lexicographically. Tier is ONE cross-strategy escape — corrected
      2026-08-11, third round: it is not the only one, see the
      classification-escape clarification below — and the model's only
      instrument on TIER stays adding a recognized bug_fix/security mark, which
      may lift a tactic over lower-tier tactics of other strategies (the
      accepted and intended effect recorded above). The bound is uniform, with
      no owner carve-out: it is a property of the rank algebra, not of who
      authored the value, so an author-set boost on an owner: human tactic is
      namespaced identically — the author's cross-strategy channels are strategy
      rank and tier, never a direct tactic boost. A tactic with several
      distributing strategies sits in the band of the highest-ranked one (max
      across distributors, never the sum), mirroring the max-lift rule the
      resolver already applies to effective tier, so adding a serves edge can
      never demote a tactic. (Corrected 2026-08-11, third round: the clause
      previously here also claimed a serves edge could never become a way to
      jump bands. That was false — under max across distributors, adding a
      serves edge to a higher-ranked strategy IS a band promotion. See the
      classification-escape clarification below, which records that promotion as
      sanctioned rather than as a leak.) Enforcement is structural, not
      behavioral: the resolver is to order lexicographically by (tier,
      distributing-strategy rank, within-strategy value) so an inversion is
      impossible to express rather than merely forbidden — greenfield target
      recorded at tactic-attention-namespaced-rank, which also carries the
      brownfield migration (behavioral doctrine plus lint first, resolver change
      after) and absorbs the tier-isolation verification previously noted here."
  - question: Steelman — should the model only recommend reorderings for author
      ratification (the sensor/actuator split), never write them?
    answer: "(Diverged 2026-08-11, reasons recorded.) The rival is grounded in this
      node’s own doctrine — the research lane’s author-gated actuator and the
      2026-08-11 dry-run finding on self-judged scores. Diverged because
      reordering a delegated queue is low-irreversibility (any rewrite is one
      graph edit from undo, fully visible in rsi-plan.md diffs) and the author’s
      directive explicitly delegates the write. Mitigations recorded: every
      model rewrite carries a dated rationale in the node’s priority log;
      author-owned entries and strategy-level priorities are untouchable; the
      fitness function audits reprioritization post-hoc (did front-loading
      measurably accelerate delivery) — carried by rsi-plan.md’s
      reprioritization-outcome section, derived at render by joining
      priority_log dates with closure dates (tracked at
      tactic-rsi-plan-priority-render); the author overrides at the strategy
      level. The widened scope is reconciled on delegation-anthropic-claude in
      the same round."
  - question: What is /rsi-evaluate, and how does it amend the render/judge split?
    answer: "(Recorded 2026-08-11 interview; amends the 2026-08-10 split.) A third
      skill joins the family: /rsi-plan renders (unchanged, judgment-free);
      /rsi-evaluate — a subagent invoked by /rsi after the render, also
      standalone author-invocable under the same worktree claim — re-evaluates
      the graph (diff-aware over changes since the last iteration) and holds the
      delegated judgment: reprioritizing dispatch-delegated tactics toward the
      fitness function, re-deriving the rsi task plan (attributes.rsi_task
      type/reasoning and derived cost), drafting flag interpretations, defect
      tactics, and harness-vs-rsi routing recommendations with their reasoning,
      and flagging align-need candidates; it re-runs render-rsi-plan.ts after
      its writes so rsi-plan.md reflects the new order, landing rsi-plan.md via
      the same direct-push-to-main exception the render condition grants, under
      the same worktree claim (single-writer preserved). /rsi’s main thread
      keeps the authority limbs: ratifying routing that commits budget,
      pause/resume, the /align escalation and conduct, office-hours on throws,
      and all execution. Skill build tracked at tactic-rsi-evaluate-skill."
  - question: What criterion orders delegated tactics?
    answer: "(Recorded 2026-08-11.) The recorded fitness function — acceleration of
      value delivery: front-load high-impact tactics, bug fixes affecting
      dispatch throughput or integrity, and token optimizations that raise
      throughput. Reprioritization effort concentrates within top-ranking
      strategies; cross-strategy order continues to derive from strategy-level
      attention, which stays author-owned."
  - question: How is prioritization thrash prevented?
    answer: (Recorded 2026-08-11.) Every model attention write appends {date,
      old→new, rationale} to attributes.priority_log on the re-ranked node —
      append-only, capped at the last ~10 entries, outside the substance
      fingerprints like queue_summary. /rsi-evaluate reads the log before
      writing and may not reverse a prior reordering without citing new evidence
      (a landed change, a new reading, a changed flag); the anti-thrash rule
      binds within the log’s retained window — an entry that has scrolled off
      the cap no longer constrains. rsi-plan.md renders what changed each
      iteration. Schema documentation and lint tracked at
      tactic-priority-provenance-schema.
  - question: May the author express tactic priority by boosting a tactic directly?
    answer: "(Recorded 2026-08-11, correcting a misreading made in session.) No. A
      direct author-set boost on a dispatch-delegated (owner: ai) tactic sits
      inside the surface delegated to /rsi-evaluate, which may create, rewrite,
      or remove that node's attention without author input — so the author's
      intent is one delegated write away from being erased. Under the
      namespacing bound recorded in the tier/rank-composition clarification it
      could not express cross-strategy order in any case. The author's channel
      for communicating priority among a strategy's tactics is to break the
      parent strategy down into child strategies, each child's boost augmenting
      the parent's, so rank distributes down to the tactics serving it. This is
      the same forcing mechanism the ownership clarification already names —
      grouping delegated tactics under a strategy and boosting the strategy —
      stated here for the case where the grouping strategy already exists and is
      being subdivided. Recommending a direct tactic boost to the author is a
      misreading of this node; it is recorded because it happened in the
      2026-08-11 session that produced this clarification, and a fresh session
      reading only the ownership clarification could repeat it. The author's
      requirement is preserved verbatim here, because later rounds disputing
      this bound's exact shape should read the words and not a paraphrase: 'if I
      modify the tactic boost directly that risks being overridden by the model
      which owns delegated tactic ranking (within strategies owned by the
      author). So, instead I communicate priorities by breaking down a parent
      strategy into child strategies with each child augmenting the boost of the
      parent.' And on the algebra, confirming round 1: 'tactic boost is always
      scoped to a tier/parent strategy rank at that tier. strategy boost is
      additive with parent strategy boost, not scoped to parent strategy, but
      still scoped by tier.'"
  - question: What justifies a child strategy — does subdividing a parent purely to
      rank its tactics count?
    answer: "(Recorded 2026-08-11.) Yes. Subdividing a strategy in order to
      namespace and order its own tactics is a named justification for a child
      strategy, standing alongside the distinct-success-signal /
      distinct-machinery / distinct-authority test this node's first
      clarification applies to a candidate strategy: a ranking-namespace child
      need not also show distinct machinery or distinct authority, because
      ranking is its function. It gets no exemption from carrying its own
      success_signal — if a subdivision cannot name what would validate it, it
      is not yet a strategy, and the ranking use case must never become a
      loophole admitting ungrounded nodes to the strategy layer. Subdividing
      strategy-recursive-self-improvement into child strategies to order its own
      tactics is therefore consistent with doctrine, not a workaround for it.
      The accepted cost, named deliberately: ranking-only nodes enter the
      strategy layer, bounded by the own-success_signal requirement and by the
      ordinary /align interview each such child must pass. PROVENANCE (recorded
      2026-08-11, third round): this was the REFUSED branch, not a novel
      requirement. The session recommended exempting a ranking-namespace child
      from carrying its own success_signal, on the ground that its purpose is
      ordering rather than a distinct outcome; the author declined the exemption
      and required the signal. A later round proposing that exemption should
      read it as already-decided and argue against the refusal, not present it
      as new. The concrete work this clarification authorizes is also owed and
      not yet done: subdividing strategy-recursive-self-improvement into two
      children — one for rsi-plan.md, one for the
      delegated-tactic-prioritization skill — boosted so the first ranks above
      the second within the rsi subtree. The doctrine round was deliberately
      sequenced ahead of it; the rerank that preceded both landed at c4974600
      (boost 4 to 6), the doctrine at f1265dfa, its review dispositions at
      d7f306a7. Each child owes its own interview, because each owes its own
      success_signal. DONE 2026-08-11, fourth round: the owed work named above
      has landed. The two children are strategy-rsi-plan-surface (boost 2,
      resolving its tactics to band 8) and strategy-rsi-delegated-prioritization
      (boost 1, band 7), both with parent: strategy-recursive-self-improvement,
      ranking first and second within this subtree ahead of tactics left
      directly here at band 6. Each passed its own /align interview and carries
      its own success_signal, as this clarification requires — render fidelity
      for the surface child, a paired outcome-and-integrity signal for the
      prioritization child. Both are proxies, and both say so. The interviews
      also produced two divergences worth reading before reopening either node:
      the surface child diverged from the rival framing that a rendered view is
      scaffolding rather than a goal, and the prioritization child diverged from
      the rival framing that a delegation boundary needs an edge rather than a
      node — while adopting that rival's edge, so it carries recovers:
      [delegation-anthropic-claude], reversing the disposition the doctrine
      round recorded."
  - question: "Steelman — should rank stay a flat global scale, with authority
      (owner: human) rather than structure as the author's channel?"
    answer: "(Diverged 2026-08-11, reasons recorded.) The rival is flat global
      priority — one comparable scale for the whole graph, as UNIX nice values
      are deliberately flat — holding that namespacing hides genuine
      cross-strategy urgency and inflates the strategy layer with ranking-only
      nodes, and that the author should instead secure a priority by flipping
      the tactic to owner: human so the model cannot overwrite it. Diverged
      because a flat scale is safe only while a single trusted authority sets
      every number: once ranking is delegated, every delegated write competes
      globally and the author's ordering is one boost away from being
      overwritten — the exact failure this round was called to fix. Namespacing
      is what makes the delegation safe, the same reason hierarchical weight
      distribution (cgroups v2) namespaces a delegated subtree's shares instead
      of letting them compete flat with its siblings'. That parallel is
      Claude-internal knowledge, not a tradition recorded in this graph; the
      author accepted it as argued rather than as sourced. The rival's cost
      objection is granted and bounded in the child-strategy clarification, and
      its authority-based alternative is rejected on a further ground: making
      owner a priority instrument overloads a field that records who does the
      work, not how urgent it is."
  - question: What may the model do that changes cross-strategy order, and why is
      that the right escape?
    answer: "(Author-directed 2026-08-11, third round, correcting this node's own
      second-round claim that tier was the sole escape.) There are three, and
      the first two share a shape worth stating as the governing principle: the
      model never moves a node by choosing a NUMBER; it moves a node by making a
      CLAIM ABOUT WHAT THE WORK IS. (1) TIER — adding a recognized
      bug_fix/security mark, which lifts the tactic over lower-tier tactics of
      every other strategy. (2) BAND — adding a serves edge on the determination
      that the tactic genuinely serves a higher-ranked strategy. Since a tactic
      sits in the band of its highest-ranked distributor, that determination
      promotes it across strategies. This is sanctioned on the same footing as
      the tier mark, and by the author's own framing: it is the identical act of
      classification, differing only in which axis it names. It is also already
      governed — strategy-graph-drives-dispatch records that authoring a serves
      edge 'is a ranking act — a second serves edge adds a real claim to the
      node's rank, so edge authoring deserves the same review care as weights'.
      (3) The blocked_by PRECEDENCE LIFT — structural, not a judgment call:
      router.ts's effectivePrecedence lifts a blocker to the lexicographic max
      over its own pair and the precedence of everything it blocks, and
      selectGraphTargets sorts on that lifted pair, not on the reported one. A
      low-band tactic blocking a high-band tactic therefore already sorts at the
      high band. WHY classification is the right escape and a number is not: a
      classification act is FALSIFIABLE. A wrong bug_fix mark or a wrong serves
      edge is visible on the node and reviewable against the work itself; a
      boost of 8 rather than 4 is not reviewable against anything. Namespacing
      attention while leaving classification open therefore does not weaken the
      bound — it moves the model's influence onto the only surface where the
      author can actually audit it. Left open deliberately: the marks-asymmetry
      rule (a mark may be added, never removed or downgraded, by a model
      priority write) has an obvious analogue for serves removal, which would be
      a demotion act — whether it extends there is not decided here."
  - question: Which tactics moved to the new child strategies, and which stayed here?
    answer: >-
      (Recorded 2026-08-11, fourth round — the subdivision round.) Moved to
      strategy-rsi-plan-surface (band 8): tactic-rsi-plan-priority-render,
      tactic-rsi-plan-render-pause-block, and the newly drafted
      tactic-rsi-plan-merged-priority-table. Moved to
      strategy-rsi-delegated-prioritization (band 7): tactic-rsi-evaluate-skill,
      tactic-priority-provenance-schema, and tactic-attention-namespaced-rank —
      the last keeping its existing serves edge to
      strategy-graph-drives-dispatch as well, since it is genuinely
      cross-cutting and under band = max across distributors a multi-serves edge
      resolves to the higher band. Stayed here at band 6: tactic-rsi-skill,
      tactic-rsi-implement-skill, tactic-rsi-plan-skill,
      tactic-rsi-research-skill, tactic-rsi-implement-acceleration-review,
      tactic-rsi-external-acceptance-gate, tactic-rsi-lane-token-attribution,
      tactic-rsi-measure-fanout-and-model-routing,
      tactic-dispatch-cache-preserving-context,
      tactic-dispatch-observation-masking, and
      tactic-dispatch-skill-standards-extraction. The principle for a future
      round deciding where a new rsi tactic belongs: a tactic moves to a child
      only if the child's success_signal would actually be moved by its
      completion. The rsi skill family proper, the research lane, the
      acceleration review, and the token-economy measurements are not validated
      by render fidelity or by bounded delegated ordering, so they stay here.
      Freeze classification for this round was a no-op — measured with
      strategyFingerprint plus isStrategyStale rather than a grep, both open
      children of this strategy (tactic-rsi-implement-acceleration-review,
      tactic-rsi-plan-render-pause-block) carry no stamped
      execution.strategy_fingerprint entry, so nothing froze and nothing needed
      re-stamping.


      CORRECTED 2026-08-11 after adversarial review, in five places. (1) BAND
      FIGURES. Every 'band N' figure above is an AUTHORED sum, but kind-kind
      defines a node's band as the RESOLVED rank of its distributing strategy.
      Resolved: this parent 7, strategy-rsi-plan-surface 9,
      strategy-rsi-delegated-prioritization 8.5. Under the recorded definition
      the surface child's tactics sit in band 9 while carrying an authored 8 — a
      residual of MINUS 1 — because the signal and capture terms are computed
      per node and are not distributed downward. A negative residual is not
      cosmetic: under a (tier, band, residual) key it sorts every tactic of an
      unvalidated strategy below the neutral baseline inside its own band.
      Whether ownBand derives from a strategy's authored term or its resolved
      value is now an open decision recorded on
      tactic-attention-namespaced-rank, with a surface-child tactic as its
      regression case. Read the figures above as authored values throughout. (2)
      THE ORDERING WAS NOT LIVE WHEN THIS WAS WRITTEN. Measured at the recording
      commit, the six repointed tactics sat at selection positions 16-21 of 245,
      behind fifteen tactics of strategy-graph-native-dispatch, which resolves
      lower — the exact inversion the namespacing bound forbids, unenforced
      because resolveAttention sums a tactic's own boost with its distributed
      value. That was not disclosed. It is now largely discharged: the boost
      magnitudes of all 42 open tactics carrying an authored boost were
      compressed onto a 0.01-per-level ladder, taking boost-attributable
      inversions from 2139 to 0, with originals preserved at
      attributes.pre_namespacing_boost. That compression is itself a stopgap;
      tactic-attention-namespaced-rank makes the bound structural. (3) THE
      STAY-VS-MOVE LEDGER IS FALSIFIED IN ONE ROW.
      tactic-dispatch-skill-standards-extraction is listed above as staying here
      at band 6, but it resolves to 11.33 and outranks every tactic of both
      children — it serves two strategies and resolveAttention SUMS their
      contributions where the recorded doctrine is 'highest-ranked distributing
      strategy, max across distributors, never the sum'. It carries no boost, so
      no boost edit can reach it; fixing the multi-distributor combinator to max
      is now in tactic-attention-namespaced-rank's scope, with this node and
      tactic-office-hours-graph-type-passthrough as its regression cases. (4)
      THE FREEZE CLASSIFICATION COVERED ONLY THIS STRATEGY. The same round
      edited strategy-attention-surface's clarifications, which changes its
      fingerprint too; its classification is now recorded on that node, where it
      found one stale stamp on a draft child that the 'open children' predicate
      could not see. (5) ONE MOVE WAS MADE MID-FLIGHT.
      tactic-rsi-plan-render-pause-block was repointed while at phase implement,
      moving its resolved value 6 to 8 under a live worker. Benign — it carries
      no strategy fingerprint stamp, and the scope fingerprint covers statement
      and body only, so nothing froze — but recorded so a future round does not
      read the silence as 'only drafts were repointed'.
  - question: How were the two render tactics restructured after the review, and why?
    answer: "(Recorded 2026-08-11 after adversarial review.) The round that created
      the children left tactic-rsi-plan-priority-render partially superseded,
      with tactic-rsi-plan-merged-priority-table blocked_by it. That ordering
      could not be executed as written: the blocker had to land first, but its
      surviving scope was defined entirely against the sections its own
      supersession banner forbade building — a worker taking it first would have
      added an ETA column to sections about to be deleted. The dependency was
      justified by 'that tactic defines the ETA derivation', which is four lines
      of prose the merged table has to implement anyway. Restructured into three
      nodes with no supersession left standing:
      tactic-rsi-plan-merged-priority-table absorbs the ETA derivation, which it
      is the only consumer of, and the blocked_by edge is dropped;
      tactic-rsi-plan-priority-render is reduced to its genuinely independent
      residue, the section-6 task-plan typing and the FLAG kinds, with its
      statement restated to match; and the per-iteration reprioritization delta
      plus the post-hoc outcome audit split out as
      tactic-rsi-reprioritization-outcome-audit under
      strategy-rsi-delegated-prioritization, whose signal they move. The general
      lesson, worth keeping: partial supersession that leaves dead prose in
      place because a dependency points at it is a sign the decomposition is
      wrong, not a sign the prose needs annotating."
  - question: Should the acceleration review run after each phase rather than only
      at terminus, given the condition's own 'never interleaved' bar?
    answer: "(Recorded 2026-08-12 /align round; type-b ground cleared before the
      design was taken up.) Yes, two-tier — per-phase plus a closing cross-phase
      synthesis. The 'never interleaved' bar is preserved rather than waived: it
      targeted evaluating PREDICTIONS mid-flight, and a phase that has already
      completed is observed result, not prediction. What the amendment does
      change is named honestly rather than glossed: the 'at no extra budget
      cost' clause is retired, because N evaluations cost N model turns. Three
      reasons carried the change. FIRST, evidence freshness — a phase's
      transcript is small and warm at its own boundary and cold and expensive to
      recover at the end of a six-hour ladder, so the closing-only review was
      systematically evaluating best the phases it could still see. SECOND, and
      independently of the author's request, a run that halts before terminus
      (exit 10/11/12/13/21) recorded NOTHING under the terminus-only rule, so
      the most defect-rich runs were exactly the ones that produced no review —
      a defect, not a tradeoff. THIRD, the driver's no-model-turn-in-the-loop
      premise is not sacrificed: the per-phase evaluator is spawned
      fire-and-forget and the driver never waits on it, so nothing re-enters the
      loop the detached shell script exists to keep empty. The closing pass is
      narrowed, not deleted: it keeps only what no single phase's evaluator can
      see (rework loops across phases, halt-cause taxonomy, end-to-end wall
      clock against the plan). Carrier: tactic-ladder-per-phase-evaluation."
  - question: Steelman — evaluation is not the bottleneck, action on findings is.
      Does a per-phase evaluator simply multiply finding production ~5x into a
      queue that is demonstrably not draining?
    answer: "(Adopted in part, diverged on the conclusion, 2026-08-12; reasons
      recorded.) The rival's premises are all true and are read from this
      graph's own fields: backlog 58/236, 156 parked nodes (21 blocking), 54
      worktrees, and dispatch paused by author directive since 2026-08-10.
      Findings do arrive faster than the harness closes them. The rival's
      CONCLUSION — record less until throughput recovers — is refused on the
      author's ruling of this same date that the graph's role here is a LEDGER
      that tracks and prioritizes harness optimizations. A ledger does not
      defend itself by declining to record; it defends itself by keeping one
      entry per distinct finding and carrying a prioritization column. So the
      rival's bound is adopted and its conclusion is not: the evaluation surface
      may not grow the count of OPEN ledger entries faster than it retires them,
      which merge-on-similarity enforces by construction (a recurrence updates
      an existing entry's summary metrics; it does not mint a node), and the
      prioritization column is attributes.measured_impact on
      strategy-rsi-delegated-prioritization. Recurrence thereby becomes a
      CLOSING instrument as well as a ranking input, which was the rival's real
      point. Honest limit: merge-on-similarity holding entry count flat is a
      design expectation, not a measurement — the mechanism does not exist yet,
      and tactic-eval-finding-ledger owes the measurement."
  - question: What is the graph's role for harness optimizations, and what does that
      require of a finding record?
    answer: "(Recorded 2026-08-12 by author ruling, mid-interview; merge semantics
      confirmed by the author in the same session.) The graph is the LEDGER that
      tracks and prioritizes harness optimizations — not merely a work queue
      whose length is itself a problem. Four requirements follow. ONE, ENTRY
      IDENTITY BY MERGE, NOT BY OCCURRENCE: similar findings merge into ONE
      node; there is explicitly no node per occurrence. A recurrence updates
      that entry — refreshing its body and its summary metrics — and mints
      nothing. TWO, SUMMARY METRICS, NOT AN OCCURRENCE ARRAY: the entry carries
      recurrence and impact as SUMMARY figures (occurrence count, first-seen,
      last-seen, cumulative and per-occurrence impact) on
      attributes.measured_impact, never a per-occurrence log. This is
      deliberately cheaper than the attributes.priority_log precedent it
      otherwise resembles: a ledger needs the aggregate to prioritize by, not
      the raw event stream, and keeping it summary-shaped bounds node growth and
      the re-measurement write surface. THREE, MERGE IS A JUDGMENT, NOT A HASH:
      deciding that a new finding IS an existing entry requires reading the open
      ledger and judging similarity, so the evaluator resolves the target entry
      against the open set before writing. This diverges knowingly from the
      dispatch-fleet-alarm precedent this design otherwise follows, whose keys
      are a CLOSED MECHANICAL ENUM of eight alarm kinds — that works for a fixed
      fault taxonomy and cannot work for an open-ended finding space. The slug
      remains the addressing mechanism; similarity is what selects it.
      Fleet-alarm's other properties are kept: body refreshed on re-detection,
      and attention null because rank is never machine-injected. FOUR,
      DURABILITY: a ledger that loses its history is not a ledger, so ledger
      entries are exempt from unreferenced-pruning. Retirement means phase done
      with the summary metrics intact, so a later recurrence RESUMES the count
      rather than restarting at 1. This is a live hazard, not a hypothetical:
      graph-commit --prune deletes the node file outright, and
      dispatch-fleet-alarm deliberately mints over a since-closed node on
      recurrence — inheriting that behavior unmodified would silently understate
      exactly the recurrence metric the ledger exists to carry.
      tactic-eval-finding-ledger carries the exemption and owes it as a
      done-when."
  - question: What survives the 2026-08-12 collapse, and which conditions were
      retired outright?
    answer: >-
      (Recorded 2026-08-12 /align round, author-ruled on four questions put with
      a coverage matrix in hand.) The strategy keeps its end — the harness
      improves itself — and gives up the machinery it had grown to pursue it.
      What survives is MEASUREMENT: the two-tier ladder evaluation, the finding
      ledger, and the token audit. What goes is every part that JUDGED or ACTED.


      Seven conditions were retired outright, and are enumerated here because
      removing them from the conditions list would otherwise erase the trace:


      1. Single-active-session serialization (worktree-as-claim, rsi-claim,
      fail-closed exit 11/12). The two things it protected are both gone:
      rsi-plan.md's single-writer discipline and rsi node execution. The
      surviving write surface, dispatch-eval-finding, takes its own per-checkout
      mutex.

      2. Nodes worked by rsi shortcut implementation being claimed exactly as
      dispatch claims them. There is no rsi shortcut implementation.

      3. rsi shortcut implementation reusing the dispatch phase skills verbatim,
      and maintaining no second orchestration surface. Moot here; the bound
      itself survives where it now belongs, on strategy-graph-native-dispatch,
      which owns /dispatch-emulate.

      4. Pause/resume authority over the dispatch queue, including the
      requirement that every pause record mechanically evaluable resume
      criteria. Dropped by explicit author ruling. See the separate
      clarification on the standing pause.

      5. rsi-plan.md as a derived, fully rendered artifact, and its recorded
      direct-push exception. The document is retired. This also removes the
      reason tactic-rsi-direct-push-condition-reconcile existed.

      6. rsi metrics as sensors registered in the success_signal/readings
      machinery. Retired together with threshold reporting.

      7. The session task budget (default 1, rsi_task.cost, the retired
      standalone rsi_cost). Nothing remains to budget.


      Two more were amended rather than retired and carry their own notes: the
      pace exemption narrows to evaluation jobs, and the attended/unattended
      condition INVERTS.
  - question: Why drop the judgment step, and what is lost — stated plainly rather
      than minimized?
    answer: >-
      (Recorded 2026-08-12; author chose 'drop judgment and authority too' over
      three alternatives that preserved them.) The judgment step was the old
      /rsi's Step 2: read the flags, decide what each MEANS (a threshold breach
      may be a real regression, a sensor measuring the wrong thing, or a
      threshold that has outlived its framing), decide which graph updates are
      required, route harness-versus-rsi, and decide whether an /align session
      is owed. It was explicitly main-thread and never delegated.


      What is genuinely lost, recorded so a later round is not surprised by it:
      (a) nothing interprets a finding — the ledger accumulates observations and
      the author reads them; (b) nothing escalates to /align when author intent
      is unrecorded, so an unrecorded intent is now noticed only when a human
      notices it; (c) two of the four evaluation-scope categories this
      strategy's own rationale names have no mechanical carrier — 'ambiguities
      in author intention, e.g. parked office-hours nodes on the critical path'
      survives only as the /rsi-audit parked-population survey, which measures
      without judging, and 'technical debt not justified by current greenfield
      design' has no carrier at all and now depends on review and qa-main
      catching it per-change; (d) the fitness function keeps its denominator
      (per-workflow spend) and loses its numerator (closure velocity and
      strategy-signal progress), so it can say what was spent and not what it
      bought.


      The case FOR dropping it: the judgment step's specified successor,
      /rsi-evaluate, was recorded 2026-08-11 and never built, and the loop it
      belonged to has not run since 2026-08-11. An unbuilt judgment surface
      carrying live doctrine is worse than an honest absence, because the record
      reads as though something is watching.
  - question: The dispatch queue is paused and pause authority is being retired.
      What happens to the standing pause?
    answer: >-
      (Recorded 2026-08-12.) The pause condition is retired, so no skill holds
      authority to lift it and nothing re-measures its criteria. The
      attributes.pause block on this node — state, since, mechanism, authority,
      reason, the self_blocking analysis, and five resume_criteria with
      per-criterion checks and dated measurements — is deliberately LEFT IN
      PLACE as a dated record of why the queue was paused on 2026-08-10 and what
      was measured on 2026-08-11 and 2026-08-12. It is now inert data, not a
      live contract: no condition requires it to be re-measured, and no check
      evaluates it.


      Two consequences worth stating rather than discovering later. FIRST,
      lifting the pause is now purely an author act with no recorded gate —
      which is what dropping the authority means, and is a real loosening
      relative to 'never lift a pause early without recording why'. SECOND,
      while the pause stands, no dispatch ladder runs, so the per-phase
      evaluator never fires: the surviving self-improvement machinery is
      entirely downstream of a queue that is currently stopped. The old attended
      loop was the one thing that worked in exactly that state, which is the
      bootstrap-deadlock case this strategy was created for. Recorded as an
      accepted consequence of the author's ruling, not as a hidden cost.
  - question: Does the original /rsi do self-improvement analysis that neither the
      per-phase evaluator nor the token audit does?
    answer: >-
      (Recorded 2026-08-12, from a coverage audit of every capability of /rsi,
      /rsi-plan, render-rsi-plan.ts, rsi.ts and read-sensors.ts against the
      per-phase evaluator's seven lenses and the token audit's twelve.) Yes —
      three, all of them MEASUREMENT rather than judgment, so all three survive
      the author's ruling and merge into /rsi-audit:


      1. Per-workflow token attribution. The audit produces spend per SKILL and
      never folds it into the dispatch / office-hours / rsi / other workflows
      the fitness function is stated in. The fold already exists as code
      (WORKFLOW_SKILLS and attributeSpend in rsi.ts), as does the
      spend-deviation check that flags dispatch failing to dominate; only their
      caller is being deleted.

      2. Landing findings in the ledger. The audit's ranked opportunities exist
      only in a markdown report, which is precisely the findings-in-prose-only
      condition this strategy calls a defect. It should write through
      dispatch-eval-finding like the per-phase evaluator does, so a recurring
      fleet-scale opportunity accumulates a recurrence count instead of being
      re-discovered every audit.

      3. The standing parked-population survey. rsi-plan §3 ran
      office-hours-select.ts --list and parsed the rank-lift notes to say which
      park inherited rank from which blocked source. The per-phase evaluator
      sees a park only where its own ladder tripped over one, so at fleet scale
      this has no successor. The instrument survives; nothing calls it.


      Everything else the old skills did was either covered (execution
      inefficiencies are covered strictly more richly by the nineteen combined
      lenses; producing the usage aggregate; findings-land-in-the-graph; the
      pace exemption), obviated (the claim primitive), dropped by author ruling
      (judgment, authority, pause, threshold reporting, budget, the parallel
      execution plan), or pure dashboard (the rsi-plan sections, each a re-query
      of state available from align-tactics-census.ts, graph-census-debt.ts,
      office-hours-select.ts --list and dispatch-eval-finding --list).
  - question: What is the record conflict this round leaves open, and why was it not
      resolved here?
    answer: >-
      (Recorded 2026-08-12.) Three conditions on this node — delegated
      prioritization being ownership-bounded, every model reprioritization being
      logged to attributes.priority_log, and tactic rank being namespaced by its
      distributing strategy — name /rsi-evaluate as the actuator that owns
      prioritization of dispatch-delegated (owner: ai) tactics. This round
      removed the judgment surface that actuator would have lived in, and
      /rsi-evaluate was never built.


      They are left untouched deliberately. The author's ruling was scoped to
      three named things — pause/resume authority, judging what a finding means,
      and escalating to /align — and delegated prioritization is a fourth,
      carried substantially by a separate child strategy
      (strategy-rsi-delegated-prioritization) whose machinery is the router's
      attention arithmetic rather than a judgment session. Retiring it as a side
      effect of this round would delete doctrine the author did not authorize
      deleting.


      The open question, stated so the next round finds it: with no judgment
      session, who writes a delegated boost, and is the answer 'nobody, and the
      attention arithmetic is enough', or 'the router, mechanically', or 'a
      surface still to be built'? Until that is answered these three conditions
      specify an actuator that does not exist.
  - question: Why was success_signal left standing when this round falsified every
      part of it?
    answer: >-
      (Recorded 2026-08-12, deliberately.) The signal names rsi-plan.md's
      metrics section, render-rsi-plan.ts, the pause resume criteria, and
      iterations completing 'with zero critical-path blockers requiring shortcut
      implementation'. All four are retired by this round, so the signal is
      false as written and must be rewritten.


      It was NOT rewritten here because the sensor field is a REGISTRY KEY.
      read-sensors.ts exports RSI_SENSOR_NAME as a character-for-character copy
      of this node's success_signal.sensor and registers the sensor under it;
      rewording the node alone de-registers the sensor, which then stops being
      read while keeping its last reading forever, so nothing looks broken. That
      is not a hypothetical: it has now happened twice on this graph — 47219a1a
      de-registered this very sensor on 2026-08-10 when the research lane clause
      was appended, and 56039748 did the same to
      strategy-graph-native-dispatch's lifecycle sensor on 2026-08-12. The
      second is tracked as the finding ledger's first entry,
      tactic-eval-finding-sensor-registry-key-prose-drift, which also records
      the underlying class defect: no guard of any kind runs on the graph write
      path, because /align lands via graph-commit to graph/** and the unit-test
      workflow ignores those branches.


      So the rewrite is owed by the implementation tactic that edits
      read-sensors.ts, and node prose and constant must move in the SAME change.
      Until then this signal is knowingly stale, and that is preferable to
      silently unregistering the sensor to make the record look tidy.
tooling_goals: []
success_signal:
  observable: graph-native dispatch reaches stable autonomous operation and each
    subsequent /rsi iteration lands an rsi-plan.md update whose metrics hold
    their review thresholds
  sensor: the rsi-plan.md metrics section — sensors registered in the graph's
    existing success_signal/readings machinery on their owning strategies
    (backlog band, parked critical-path count, held-session/worktree census,
    pause state), rendered by render-rsi-plan.ts each iteration, plus
    per-workflow token attribution across dispatch, office-hours, and rsi; plus
    the research lane's weekly dated readings on this strategy (research-cycle
    landings)
  threshold: dispatch runs unpaused with the recorded resume criteria held,
    strategy-graph-native-dispatch's own 35% non-increasing band holds, and
    consecutive rsi iterations complete with zero critical-path blockers
    requiring shortcut implementation
  is_proxy: true
attention:
  boost: 6
  override: null
  rationale: "Author-directed 2026-08-11: rerank the rsi strategy to the top of
    tier 1, above strategy-graph-native-dispatch (authored boost 5) — supersedes
    the same-day rationale that placed rsi just below the router migration. The
    recursive-self-improvement loop that maintains rsi-plan.md and shortcuts
    critical-path harness work now outranks every other tier-1 strategy,
    including strategy-graph-native-dispatch (boost 5),
    strategy-graph-review-curriculum (boost 3.5), and strategy-attention-surface
    (boost 3)."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  queue_summary:
    date: 2026-08-11
    summary: "R2 landed as #3065/#3066 and both of its task nodes are now phase done
      — tactic-rsi-plan-skill and tactic-rsi-skill. R3,
      tactic-rsi-implement-skill (rsi_cost 1, the only budgeted item left),
      landed its code mid-iteration as #3067 (6dbdf63c):
      .claude/skills/rsi/scripts/rsi-advance and rsi-await with their shell
      tests and a unit-tests workflow entry, 6 files, +1100/-12. The node itself
      is not closed out — status raw, phase null, no execution record — so the
      graph does not yet carry the completion its merged code implies. The
      remaining drafts are tactic-rsi-research-skill and
      tactic-dispatch-skill-standards-extraction, both cost 0;
      tactic-review-tradition-agentic-engineering is born-parked for an
      office-hours sitting and is not claude-executable. rsi's own measured 7d
      spend renders as 0.0% because no turn in the window carried an `rsi` or
      `rsi-plan` attribution skill — the aggregate's largest single bucket is
      `<none>` at 4747.37 price proxy over 12008 turns, so the workflow split
      understates rsi rather than showing it spent nothing."
  external_ledgers:
    - path: ~/.claude/plans/task-notification-task-id-bwopwgmr1-tas-lucky-parasol.md
      note: Prototype-session operating record. Still the sole carrier for the
        numbered operational invariants I13-I30, the graph-write and --base CAS
        recipes, the reap traps, and the sandbox rules — this graph carries the
        strategy, not the operations. Most STANDING invariants are independently
        held in the session memory store (I13, I16, I18, I21, I24, I25); the
        residue is not (I15, I22's exact form, I27, I28, I29, I30). Retire this
        entry once that residue lands as graph nodes or memories, and do not
        delete the file while the entry stands.
  conditions:
    - "evaluation jobs are pace-exempt: a per-phase /rsi run and an /rsi-audit
      run are recording work, not queue work, and must never consume pace-curve
      budget or be gated by it (mechanism today: EVAL_POLICY_PHASE=ladder-eval
      in dispatch-ladder-run, and dispatch-eval-finding's own exemption).
      (Amended 2026-08-12 collapse round: this condition previously exempted
      \"rsi sessions and their rsi-implement work\" on the grounds that the
      session budget and the serialization were the throttle. Both of those
      throttles are retired with rsi execution; what survives is the narrower
      and more defensible claim that measuring the queue must not compete with
      the queue.)"
    - 'the split is by write surface, not by attendance: /rsi runs UNATTENDED
      and auto-spawned by dispatch-ladder-run at every phase boundary, and is
      therefore bound to record-only — no fix, no skill or script edit, no phase
      transition, no merge, no label, and never /fewer-permission-prompts or any
      other write to .claude/settings.json. /rsi-audit is author-invoked and may
      hold the attended-only remediation steps that need a sandbox override.
      (Amended 2026-08-12 collapse round, INVERTING the prior condition. That
      condition read "/rsi is an attended, author-invoked loop — never scheduled
      or cron-driven", which was true of the judgment loop and is false of its
      replacement. The safety the old wording bought — that nothing recursive
      runs without the author present — is now bought mechanically instead: the
      unattended half cannot execute anything, so its running unsupervised costs
      a model turn and nothing else.)'
    - "the research lane is sensor-only: a scheduled /rsi-research run writes
      only inert output — one dated reading on this strategy, born-parked
      candidate curriculum chunks, and draft tactics — and never grounding
      marks, tradition-record edits, graph-doctrine edits, or work execution;
      every incorporation of a finding is author-gated (curriculum sitting, /rsi
      judgment step, or /align), and the lane's token spend stays small relative
      to dispatch under the existing per-workflow attribution — spend
      approaching dispatch is itself a review trigger"
    - "the research lane runs weekly via harness cron invoking /rsi-research,
      independent of the dispatch pause state (its output is inert, and research
      continuing while dispatch is paused is the bootstrap case rsi exists for).
      (Amended 2026-08-12 collapse round: the clause requiring each run to claim
      the strategy-recursive-self-improvement worktree fail-closed against a
      live /rsi session is RETIRED — it named a serialization primitive
      (rsi-claim) and a competitor (the attended /rsi loop) that this round both
      retire. The lane remains UNBUILT: no /rsi-research skill exists in
      .claude/skills/, so these four research-lane conditions are specification
      without a carrier. They are deliberately retained rather than retired —
      the author authorized dropping the judgment loop, rsi-plan.md and the
      parallel execution plan, not the research lane — but a future round should
      decide whether an unbuilt lane is still wanted before more doctrine
      accretes on it.)"
    - "the research lane's unread pool stays bounded: research-produced
      born-parked items (candidate chunks, review items) accumulating across
      cycles without an office-hours sitting is a review trigger recorded in the
      rsi-plan, never silent debt"
    - "tactics the research lane drafts without author intervention always
      require qa-main validation before they count as validating this strategy:
      each lane-drafted tactic cites the reference finding that motivated it and
      states that reference's claimed effect in terms the graph's existing
      sensors already observe (per-workflow token attribution, tactic closure
      velocity, this strategy's own success_signal thresholds); qa-main verifies
      the landed change actually produces that stated effect, and a change that
      lands cleanly without producing it is recorded as a refuted hypothesis
      rather than a validating success; a finding whose claimed effect cannot be
      stated observably is not draftable as a tactic at all and goes to a
      born-parked candidate chunk for an author sitting instead. This is the
      operational form of the 2026-08-10 endogenous-primacy clarification — the
      external finding enters as a hypothesis and this harness's own telemetry
      is what accepts or refutes it — and it supplies the outside-the-loop
      acceptance signal that self-authored verification cannot: the 2026-08-11
      dry run found that across 35 self-improvement runs every run self-reported
      a passing score while 43% actually scored below random baseline, the exact
      failure shape of a lane that drafts from external findings and then judges
      its own output. Build detail and the lane's spec corrections are recorded
      on tactic-rsi-research-skill."
    - "every dispatch-ladder run is evaluated, in two tiers, and every finding
      lands in the graph. (a) PER-PHASE: at each phase boundary the ladder
      driver spawns a fire-and-forget /rsi job scoped to the phase that just
      completed and does not wait on it, so the driver's
      no-model-turn-in-the-loop premise — the whole reason it is a detached
      shell script — is preserved exactly. Evaluating a phase that has ALREADY
      completed is post-hoc, so the never-interleaved bar (which targeted
      evaluating PREDICTIONS mid-flight) is unaffected. (b) CLOSING: a final
      pass performs ONLY the cross-phase synthesis no single phase's evaluator
      can see — rework loops across phases, the halt-cause taxonomy, end-to-end
      wall clock against the plan. A run that HALTS before terminus (exit 10
      idle, 11 throw, 12 stalled, 13 claimed, 21 timeout) still owes a review of
      the phases it did complete; under the old terminus-only rule the most
      defect-rich runs recorded nothing at all. Every evaluation, per-phase or
      closing, must record: recurring errors causing quality issues; unnecessary
      round trips; variances requiring intervention; rework and backtrack rate
      (fix and conflict attempts, demotions back to implement, scope-fingerprint
      custody churn); plan-quality yield (units planned by /align-tactics
      against units implemented and units reworked, plus qa findings the plan
      did not anticipate); calibration and waiting (measured elapsed_s per phase
      against the configured await window, yielding a concrete recommended
      default rather than an observation, plus ci-wait/grace-wait time burned
      and halt-to-engagement latency); and friction and adherence (permission
      denials, sandbox retries, and violations of documented rules — a rule
      violated repeatedly is usually a rule written badly). Findings land as
      ledger entries, never as fresh nodes per occurrence. (Amended 2026-08-12
      collapse round. Two changes. FIRST, the binding scope widens from
      rsi-implement tasks to every ladder run — the old narrowing was justified
      by 'an rsi task has an attending author and an explicit budget; a dispatch
      phase worker has neither', and with the attended loop and the budget both
      retired that distinction no longer exists. SECOND, the carrier is named:
      the per-phase half is /rsi (formerly /dispatch-ladder-eval) and the
      closing half stays in /dispatch-ladder. The 'inside the same task and at
      no extra budget cost' clause remains RETIRED: per-phase evaluation costs a
      model turn per phase, accepted for the evidence freshness it buys.)"
    - "/rsi-audit is the measurement instrument at every scope — fleet-wide by
      default, and --session/--node for one run — and it owes three things the
      per-phase evaluator structurally cannot produce: per-workflow token
      attribution (the dispatch / office-hours / rsi / other fold) with the
      recorded expectation that dispatch dominates and a deviation is itself a
      review trigger; the fleet-only figures that are a category error at n=1
      (pooled outcome rates, medians, cross-session recurrence); and a survey of
      the standing parked population and what each park blocks, which a
      single-run evaluator only ever sees where its own ladder tripped over one.
      Its findings land through the same finding ledger the per-phase evaluator
      writes — a ranked opportunity that exists only in a markdown report is the
      findings-in-prose-only defect this strategy already names, not a report.
      (Recorded 2026-08-12 collapse round, from the coverage audit of what the
      retired /rsi and /rsi-plan did that neither successor did.)"
    - "the finding ledger's recurrence count is the figure the ledger exists to
      carry, so an occurrence must never be silently dropped: a writer that
      cannot take the graph-write lock must not skip-and-warn when its caller is
      a detached job that nobody will re-invoke. (Recorded 2026-08-12 collapse
      round from a measured defect, not a hypothetical: dispatch-eval-finding
      skips on lock contention and tells the caller to re-invoke, and the
      per-phase evaluator is spawned fire-and-forget, so concurrent ladders
      under-count exactly the metric that makes recurrence visible. Tracked for
      repair; recorded here because the bound outlives the current writer.)"
    - "priority delegation is ownership-bounded: the author owns prioritization
      of strategies and owner: human tactics; /rsi-evaluate owns prioritization
      of dispatch-delegated (owner: ai) tactics, ordered toward the recorded
      fitness function (front-load high impact, bugs affecting
      throughput/integrity, token optimizations); its actuators are boost and
      override only — it never writes attributes.tier (tier moves only by adding
      a recognized bug_fix/security mark), never writes attention on a strategy,
      virtue, or owner: human tactic, and never removes or downgrades a
      bug_fix/security mark; tier takes precedence over strategy rank
      (within-tier, higher-ranked strategies’ tactics first); the author’s
      forcing mechanism is the strategy level, never a race on the delegated
      entries (Recorded 2026-08-11). Amended 2026-08-11: a delegated attention
      write is additionally namespaced — it orders the tactic only within its
      distributing strategy's band and may never invert cross-strategy order
      within a tier, superseding the accepted-risk carve-out that previously
      permitted an override to displace the strategy-distributed value"
    - "every model reprioritization is logged: the attention write appends
      {date, old→new, rationale} to the node’s attributes.priority_log
      (append-only, capped ~10, fingerprint-exempt), and a prior reordering is
      never reversed without citing new evidence — prioritization thrash is a
      defect the log exists to make visible (Recorded 2026-08-11)"
    - "tactic rank is namespaced by its distributing strategy: no tactic's own
      attention — whoever authored it — may order it ahead of a tactic of a
      higher-ranked strategy at the same tier, and a tactic distributed to by
      several strategies sits in the band of the highest-ranked one (max, never
      the sum); strategy attention is the complementary case, additive down
      parent/serves so a child strategy's boost augments its parent's and may
      outrank cousin and uncle strategies, bounded only by tier; cross-strategy
      order may be changed only by a CLASSIFICATION act, never by an attention
      value: the model may add a recognized bug_fix/security mark (lifting tier)
      or add a serves edge on the determination that the work genuinely serves a
      higher-ranked strategy (lifting band), and the blocked_by precedence lift
      moves a blocker to the urgency of what it holds up; no attention number,
      from any author, crosses a band (Recorded 2026-08-11, amended same day
      third round)"
  pause:
    state: paused
    since: 2026-08-10
    mechanism: sentinel
    sentinel_path: $XDG_DATA_HOME/commons-dispatch/paused
    authority: author directive 2026-08-10; held under
      strategy-recursive-self-improvement's pause/resume authority condition
    reason: "The queue could retire nothing: the reap gate refused every candidate,
      so held sessions and worktrees only accumulated while autonomous spawning
      kept adding load."
    last_measured: 2026-08-11
    decision: stay paused
    status_values: Each criterion is holds | fails | partial | unknown. partial
      means one clause of the criterion was measured and another was not;
      unknown means it was not measured this pass. Resume requires every
      criterion to read holds, re-measured at the time of the decision.
    self_blocking: "Criterion 1 cannot be satisfied autonomously while this pause is
      in force. The node-lane merge lane (graph-auto-merge,
      dispatch-select-tick:505) runs only inside dispatch-select-tick, and every
      dispatch-select-tick invocation (dispatch-tick:638-642) sits past the
      pause short-circuit's exit 0 (dispatch-tick:415). So no reviewed node-lane
      PR merges autonomously while the sentinel exists, and criterion 1 requires
      exactly such a merge. The escapes are an operator-run `dispatch-tick
      --manual` (dispatch-tick:314 tests -z \"$MANUAL\") or an author
      hand-merge. Tracked for repair by tactic-pause-disables-merge-lane.
      (Re-measured 2026-08-12: still true. The repair named above is in flight
      as PR #3068 at phase qa and is itself caught in this loop — the pause
      blocks the worker that would advance it and blocks the merge that would
      land it, so an operator dispatch-tick --manual is the only escape for the
      repair as well as for the criterion.) (Amended 2026-08-12, after PR #3068
      was reviewed, fixed and merged by hand under author authorization to
      bypass the dispatch workflow. The repair named above LANDED — #3068 merged
      2026-08-12T15:52:11Z, absorbed to main-qa by reconcile-graph-merged — but
      criterion 1 does NOT thereby become satisfiable, for two separately
      measured reasons. FIRST, #3052 is not merely waiting on a merge lane. Its
      node sits at phase review, but carries markers planned, qa-done with NO
      reviewed marker, and graph-auto-merge skips any candidate lacking it
      (graph-auto-merge:125, the label-free successor to the dispatch:reviewed
      check). It also carries a live execution.fix interrupt (since 2026-08-09,
      attempt 2), its PR is a DRAFT, and it has three open blocked_by edges
      (tactic-flake-analyze-go, tactic-flake-acceptance-action-download,
      tactic-flake-firestore-query-bounds-sensor-action-download). So restoring
      the merge lane alone merges nothing: criterion 1 needs the review
      completed, the blockers cleared and the PR undrafted first. SECOND, a
      bootstrap gap the pause creates for the repair itself.
      dispatch-heartbeat.service runs
      ExecStart=/home/n8/natb1/commons.systems/.claude/skills/dispatch-propagat\
      e/scripts/dispatch-tick — the script file in the MAIN CHECKOUT, not a copy
      resolved from origin/main. Measured 2026-08-12 immediately after the
      merge: that checkout contains neither the drain nor its sync guard (grep
      for the banner text and for the skip warning both return 0). Nothing
      autonomously fast-forwards that checkout while paused —
      dispatch-select-tick Step 1 ff-only sync is the only routine caller, and
      the paused branch exits before it — so a merged fix TO dispatch-tick
      cannot deploy itself. An operator ff-merge of the main checkout is
      required before #3068 has any effect at all, and before its own needs-main
      item can be observed.)"
    resume_criteria:
      - id: reap-gate-landed
        criterion: "PR #3052 is merged, and the sweep demonstrably reaps a 0-ahead clean
          worktree with no operator action (#3052's own done-when)."
        check: gh pr view 3052 --json state --jq .state reads MERGED, and a reservation
          sweep reaps a 0-ahead clean worktree unattended.
        status: fails
        measured: "2026-08-11: #3052 OPEN, 23/23 checks SUCCESS, mergeable CLEAN,
          unmerged. Green and unmergeable-by-the-harness for the reason recorded
          in self_blocking above. 2026-08-12 re-measure: #3052 still OPEN and
          unmerged, and the 2026-08-11 diagnosis above is INCOMPLETE. It is not
          blocked solely by the disabled merge lane. Its node carries markers
          planned, qa-done with no reviewed marker (graph-auto-merge:125 skips
          candidates lacking it), a live execution.fix interrupt (since
          2026-08-09, attempt 2), a DRAFT PR, and three open blocked_by flake
          edges. Restoring the merge lane — which PR #3068 did, merged
          2026-08-12 — is necessary but not sufficient: this criterion
          additionally needs the review completed, the three flake blockers
          cleared, and the PR undrafted before any merge lane can act on it.
          last_measured and decision above are deliberately NOT restamped: only
          this criterion was re-measured this pass, criteria 2-5 were not."
      - id: held-sessions-bounded
        criterion: Held-for-debug sessions number 3 or fewer, and no held session is
          reap-eligible-but-stuck (each has an OPEN PR).
        check: "claude agents --json --all: count rows with state done; cross-check each
          against an OPEN PR."
        status: holds
        measured: "2026-08-11: 2 sessions total, 1 held (state done) and 1 working.
          Count 1 is within the bound of 3, down from 7 at the pause. The one
          held row is an interactive align session (worktree align-rsi-research)
          rather than a dispatch worker, so it carries no PR and is not
          reap-eligible-but-stuck in the sense this criterion bounds; it is
          reapable by claude rm."
      - id: worktrees-draining
        criterion: No worktree whose PR is MERGED and which is provably
          0-ahead-and-clean remains on disk, and the worktree count trends down
          rather than up.
        check: git worktree list count, compared against the prior reading; per-worktree
          merged-and-clean sweep for the residual clause.
        status: partial
        measured: "2026-08-11: 43 git worktree list rows (42 worktrees plus the main
          checkout), down from 54 at the 2026-08-10 reading and 46 at the pause.
          The trend clause holds and is the clearest evidence the pause is
          draining as intended. The residual clause (no MERGED-PR 0-ahead-clean
          worktree left on disk) was not re-swept this pass."
      - id: no-invalid-state-24h
        criterion: bug-J is clean and no duplicate-session invalid state has been
          observed for a full 24 hours.
        check: invalid-state routing output over a 24h window.
        status: unknown
        measured: "2026-08-11: not measured this pass."
      - id: fleet-watch-clean
        criterion: dispatch-fleet-watch reports no finding other than the known-latched
          unclaimed-hold.
        check: dispatch-fleet-watch --json, read from a tick rather than ad hoc.
        status: unknown
        measured: "2026-08-11: not re-run this pass. Running it is not a free probe — it
          records findings as graph nodes via dispatch-fleet-alarm, so it
          belongs to a tick, not to an rsi read. Last alarm refreshes on disk:
          unclaimed-hold 2026-08-10, busy-stall 2026-08-09, watch-unknown
          2026-08-09, heal-fired 2026-08-08."
---
# Harness self-improvement is measurement, not a second orchestrator — /rsi evaluates each finished dispatch-ladder phase and /rsi-audit measures token economy at any scope, and both land findings as merged ledger entries the dispatch queue executes

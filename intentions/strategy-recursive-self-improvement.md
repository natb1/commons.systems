---
id: strategy-recursive-self-improvement
kind: strategy
statement: Harness self-improvement is measurement, not a second orchestrator —
  /rsi evaluates finished phase and unattended-intervention sessions on BOTH
  dispatch drivers, fired by a lane-agnostic trigger that is unconditional on
  failure signals and threshold-gated on cost, and /rsi-audit measures token
  economy at any scope; both record findings as ordinary draft tactics on the
  graph, merging a recurrence onto the existing node exactly as every other
  finding producer does
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
  ordinary dispatch queue executes the repairs. /rsi is now the evaluator of
  finished phase and unattended-intervention sessions on BOTH dispatch drivers —
  the ladder and the scheduled tick — spawned fire-and-forget and fired by a
  lane-agnostic trigger (amended 2026-08-14; the every-ladder-phase-boundary
  rule it replaces held from 2026-08-12); /rsi-audit is the token-economy
  instrument at fleet or single-node scope; both write findings into one merged
  ledger, one node per distinct finding carrying a recurrence count and summary
  impact metrics. Neither judges, routes, executes, pauses, or escalates.


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


  (Amended 2026-08-14.) The trigger is gated because coverage and yield came
  apart. Evaluating every phase boundary on the ladder was affordable; extending
  the same rule to the scheduled tick would multiply it across every node in
  flight, and the 2026-08-13 measurement recorded on this node the day before —
  830 of 1026 seconds and $37.47 of $76.09 spent outside a review that returned
  0 actionable findings — shows the spend is not evenly informative. The gate is
  an EFFICIENCY lever and efficiency is a throughput lever, which is
  strategy-token-economy's own recorded position, not a divergence from it: the
  same allowance converts into more closed tactics when evaluation is spent
  where the evidence is. It is neither 'spend less' (which
  strategy-token-economy refuses) nor 'record less' (which the 2026-08-12 ledger
  clarification refuses). Coverage is preserved where it carries information:
  failure signals fire the evaluator unconditionally, and every skipped session
  is COUNTED so recurrence stays readable as a rate.
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
    answer: >-
      (Recorded 2026-08-12 by author ruling, mid-interview; merge semantics
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
      done-when.



      (Amended 2026-08-14 by author ruling in the /align round that dissolved
      the finding ledger as a distinct graph primitive.) Requirements ONE (entry
      identity by merge, not by occurrence), TWO (summary metrics on
      attributes.measured_impact, never an occurrence array) and THREE (merge is
      a judgment, not a hash) all SURVIVE, and are widened from this strategy's
      findings to EVERY finding on the graph whoever produced it. Requirement
      FOUR survives in substance and changes carrier: durability is no longer
      keyed on attributes.ledger_entry but on the node CARRYING
      attributes.measured_impact — never prune a node that holds measurements —
      which is a general rule rather than a class exemption. What is retired is
      the privilege, not the practice: attributes.ledger_entry as a class
      marker, the tactic-eval-finding-* id namespace as a membership test, and
      dispatch-eval-finding as a writer private to this strategy. The general
      rule now lives on strategy-graph-native-dispatch, extending its
      sole-issue-tracker condition, because a rule saying findings are not an
      rsi thing must not itself live in the rsi namespace; this strategy keeps
      only the rsi-specific retirement. Carrier: tactic-eval-finding-ledger,
      whose statement and body are rewritten in this same round to the
      retirement rather than the build.
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
  - question: With /rsi-evaluate retired unbuilt, who writes a delegated boost — the
      question the collapse round left open?
    answer: >-
      (Recorded 2026-08-13, answering the open conflict the 2026-08-12 collapse
      round deliberately left standing, from an author interview the same day.)
      Of the three answers that round posed — 'nobody, and the attention
      arithmetic is enough', 'the router, mechanically', or 'a surface still to
      be built' — the answer is the third, and the surface is /rsi-audit.


      The split follows the ownership boundary already recorded here, one level
      down. /rsi-audit WRITES attention boosts on dispatch-delegated (owner: ai)
      tactics, within band, appending {date, old→new, rationale} to
      attributes.priority_log. It RECOMMENDS strategy boosts with measured
      justification, and the author ratifies. It never writes attention on a
      strategy, a virtue, or an owner: human tactic. Because a recommendation
      writes nothing, this is not a loosening of the recorded bound: it is a
      reporting path where there was previously silence, and it matches this
      node's own recorded answer that the author's forcing mechanism is the
      strategy level, never a race on the delegated entries.


      Only the recommend half is built. The write half is recorded as
      tactic-rsi-audit-prioritization-writer, blocked on
      tactic-attention-namespaced-rank, and the block is measured rather than
      assumed. No attention writer exists on main at all — boost-node lives only
      on a branch whose PR was closed, not merged, and abandoned under a fix
      cap. attributes.priority_log has zero code behind it: no schema entry, no
      validate-graph rule, no reader, no writer; it is prose in eight node
      files. And tactic-attention-namespaced-rank rewrites interface Attention
      itself, deleting attention.override and retiring the matching
      validateGraph rule, so a writer built against today's shape would be
      deleted by that node's first unit. Building it now means building it
      twice.


      tactic-rsi-evaluate-skill is therefore never to be built. Its capability
      moved to /rsi-audit and its own node records that.
  - question: What does the fitness function still measure after the collapse, and
      what stopped being measured?
    answer: >-
      (Recorded 2026-08-13 on landing the collapse, PR 3074.) It keeps its
      DENOMINATOR and loses its NUMERATOR, and that is worth stating plainly
      rather than leaving for someone to discover from a thin report.


      What survives: the per-workflow spend fold — dispatch / office-hours / rsi
      / other — now runs from attribute-spend.ts over the same WORKFLOW_SKILLS
      map read-sensors.ts already used, so the fitness function has ONE
      denominator rather than two that could disagree. The spend-deviation check
      survives with it: a non-other rival reaching dispatch's price proxy is
      itself a review trigger, not a datum to note and pass.


      What does not survive: closure velocity and strategy-signal progress.
      Those were never computed by anything — they were prose inside the deleted
      renderer's metrics section. So /rsi-audit can say what a window spent; it
      cannot say what the spend bought. The fold is not the whole function.


      One deliberate consequence of the collapse, recorded because it changes
      what the deviation trigger MEANS. /rsi's own spend is attributed to the
      DISPATCH bucket, not the rsi one: the per-phase evaluator is spawned by
      the ladder and fires once per phase, so it scales with dispatch volume —
      it is the cost of dispatch measuring itself. Left in the rsi bucket, rsi
      spend would track dispatch by construction and the deviation trigger would
      fire permanently and mean nothing. /rsi-audit is what the rsi bucket now
      counts.
  - question: Why do node bodies across this graph still name /rsi-plan,
      /dispatch-ladder-eval, /dispatch-token-audit and rsi-plan.md?
    answer: >-
      (Recorded 2026-08-13 with the collapse, PR 3074, merge
      c3c229f0de63db09df7dc01ce02177f3d1b56c95.) Because they are dated records,
      and rewriting them would cost more than it is worth. The family collapsed
      to two instruments: /dispatch-ladder-eval became /rsi (the per-phase
      evaluator), /dispatch-token-audit became /rsi-audit, and the retired
      attended /rsi, /rsi-plan, rsi-plan.md and render-rsi-plan.ts were deleted.
      About 25 node files carry an old name in prose. tacticScopeFingerprint
      hashes {statement, body}, so rewriting those bodies churns scope
      fingerprints and can mis-park live sessions through transition-node's
      scope gate. The old names are historical; this clarification is what makes
      them readable as historical rather than stale.


      Two node files were exceptions, forced by atomicity rather than chosen: a
      ```verify fence path in two LIVE nodes cited the pre-rename script path,
      and lint-verify-fence-paths.sh's baseline explicitly must not grow. The
      new path does not exist on main until the rename merges, so deferring the
      fix to this graph round would have reddened main instead. One fence line
      changed in each, nothing else.


      The sensor rewrite was NOT atomic, exactly as the preceding clarification
      predicted it could not be. RSI_SENSOR_NAME moved with the code in the PR
      and this node's success_signal.sensor moves here; in between, the sensor
      was de-registered. Measured, not predicted: the unregistered-sensor count
      read 58 with this node sitting in read-sensors' skipped tail carrying its
      old prose. The readings count cannot see that — the unregistered count is
      the only signal. The class defect is unchanged and still tracked at
      tactic-eval-finding-sensor-registry-key-prose-drift: no guard of any kind
      runs on the graph write path.
  - question: What was pruned when the rsi collapse finished, and why are live nodes
      still allowed to name the pruned ids in prose?
    answer: >-
      (Recorded 2026-08-13, the prune round following PR 3074's merge as
      c3c229f0de63db09df7dc01ce02177f3d1b56c95.) Five nodes were deleted:


      strategy-rsi-plan-surface — the child strategy that owned the rsi-plan.md
      surface, already restated as RETIRED on 2026-08-12 when this node's own
      /align round withdrew the render. A retired strategy carrying live tactics
      is worse than no node: the router still distributes rank through it.


      Its three tactics, all unbuilt with execution: null —
      tactic-rsi-plan-merged-priority-table (the merged tier-banded priority
      table), tactic-rsi-plan-priority-render (the typed task-plan section and
      the renderer's FLAG kinds), and tactic-rsi-plan-render-pause-block (the
      pause and resume criteria rendered from attributes.pause). Every one of
      them renders INTO rsi-plan.md through render-rsi-plan.ts, and PR 3074
      deleted both. tactic-rsi-plan-render-pause-block was sitting at phase
      implement, so it was queue-eligible: it would have been selected and
      dispatched against a file that no longer exists.


      tactic-rsi-evaluate-skill — the delegated evaluation and reprioritization
      subagent. Retired unbuilt; its evaluation half moved to /rsi and its
      reprioritization half to /rsi-audit, recorded as
      tactic-rsi-audit-prioritization-writer.


      Deliberately NOT pruned, and worth naming so the omission does not read as
      an oversight. tactic-rsi-plan-skill and tactic-rsi-plan-render-retire are
      phase: done — they are records of work that was actually performed (the
      renderer was built, then deleted), and deleting a completed record is
      falsifying history, not tidying. tactic-rsi-reprioritization-outcome-audit
      survives because it is the sensor named by
      strategy-rsi-delegated-prioritization's success signal; it is repointed at
      /rsi-audit in its own clarification instead.


      On the prose: about ten live nodes name the pruned ids in backticks. That
      is not a violation and needs no sweep. validateGraphProseRefs resolves a
      reference against live nodes AND the deleted-id set that
      lib-deleted-node-ids.ts derives from git history, so a pruned id stays
      resolvable — classified pruned rather than missing — for as long as the
      repository is not a shallow clone. This was verified by running
      validate-graph after the deletion commit, not assumed. Rewriting those
      bodies would churn tacticScopeFingerprint on live nodes for no integrity
      gain, the same reasoning that left the historical skill names standing.
  - question: "Steelman — attributes.ledger_entry was never an rsi privilege but the
      LEDGER/QUEUE seam: a measurement record is not a work item, and a tracker
      that conflates them can no longer say what its backlog is. Does dissolving
      the marker make measurements look like tasks?"
    answer: "(Adopted in part, diverged on the conclusion, 2026-08-14; reasons
      recorded.) The rival's premise is granted in full, and it is this record's
      own words: the 2026-08-12 clarification calls the graph a LEDGER that
      tracks and prioritizes harness optimizations \"not merely a work queue
      whose length is itself a problem\", and intentions/kind-tactic.md states
      the consequence plainly — \"an entry is a record, not a task\". The seam
      is real and is KEPT. What is refused is the inference that the seam needs
      an rsi-scoped carrier. A /review-fix deferred finding and a /qa-main
      cannot-verify residue are equally observations-not-yet-work, so a carrier
      only this strategy's subset can hold does not draw the seam — it draws a
      namespace, and a namespace is exactly what let one defect land on two
      nodes. The graph already has a general carrier: phase null (draft) IS the
      observation state, and the router emits drafts at the align-tactics rung,
      where a decomposition session decides whether the observation is work.
      Measured rather than asserted: of the 26 ledger-and-adjacent finding nodes
      at origin/main 1fe2dd85, all but two are already phase null — so
      draft-phase is carrying the seam today, and attributes.ledger_entry is
      carrying only the pruning exemption and the id namespace on top of it.
      Honest limit owned at record time: that draft-phase is a SUFFICIENT
      carrier for the record/queue seam is an inference from that census, not a
      claim the prior record makes."
  - question: What observable says uniform finding recording actually holds, given
      the 2026-08-12 entry-count bound is admittedly a design expectation and
      not a measurement?
    answer: "(Recorded 2026-08-14 /align round.) The observable is the count of
      distinct tactics recording the SAME root-cause defect; the sensor is a
      graph read over tactics carrying attributes.measured_impact; the threshold
      is no new duplicate pair per evaluation window. The baseline is already on
      the graph, measured 2026-08-13 on
      tactic-eval-finding-eval-finding-list-misses-nonledger:
      duplicate_finding_nodes_same_defect 2,
      finding_nodes_outside_ledger_namespace 1,
      finding_nodes_without_recurrence_metric 3, ledger_invisible_fraction
      0.158. The metric gets STRICTER under this change rather than looser —
      today a duplicate minted outside the tactic-eval-finding-* namespace is
      structurally invisible to dispatch-eval-finding --list, so the figure
      cannot be read honestly at all. It joins THIS strategy's success_signal
      rather than strategy-graph-native-dispatch's because the instrument that
      reads it is /rsi and a sensor lives with its instrument; the RULE it
      measures lives on strategy-graph-native-dispatch, per the same round's
      split-by-owner ruling. Carrier: tactic-duplicate-finding-sensor. Limit
      owned at record time: \"the same root-cause defect\" is a similarity
      judgment, so this sensor is model-read, not mechanical — the same
      delegated judgment merge-on-similarity already rests on, and it is
      therefore admissible ranking input only under strategy-token-economy's
      sensor-attribution condition."
  - question: Are the existing evaluation lenses expected to detect orchestration
      overhead automatically, or does the analysis need improving?
    answer: "(Recorded 2026-08-14 interview, from the /rsi evaluation of
      tactic-attention-namespaced-rank's review phase.) BOTH, in that order.
      YES, a lens owns this and it is mandatory: condition 14's second lens,
      'unnecessary round trips', names exactly this class. It did not fire, and
      the reason is structural rather than a judgment lapse — it was the ONLY
      one of the seven lenses with no mechanical carrier. /rsi Step 2 forbids
      reading transcripts by hand (they are multi-megabyte) and Step 3's escape
      hatch rejects agent-prefixed subagent ids, so a carrier-less lens has no
      route to its own evidence at all. THE MEASUREMENT: the review phase of
      tactic-attention-namespaced-rank (2026-08-13, PR #3075, elapsed_s 1026)
      spent roughly 830 of 1026 seconds and 37.47 of 76.09 dollars outside the
      review itself; the orchestrator session alone outspent all five review
      lenses combined by 2.7 to 1, on a one-file +2/-2 delta that returned 0
      actionable findings, and 7 of its 12 subagents reviewed nothing. THE
      CARRIER ALREADY EXISTED, MIS-SCOPED: aggregate-usage.sh computes
      lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips — the
      median leading consecutive run of mechanical calls at phase boot — and its
      own docstring expects review ~3-4; this phase opened with 15 Bash calls
      and invoked dispatch-derive-node-target three times. But rsi-audit's
      step-4 lens table tags that lens fleet-only, and /rsi Step 2 instructs
      skipping fleet-only figures without re-litigating them, so the instrument
      computed the answer and the evaluator was told not to look. The tag is
      over-broad (see the amendment on the /rsi-audit condition, same date), and
      the field is computed over the whole scoped document rather than the
      started_at-filtered subset, so it also sidesteps
      eval-since-bound-excludes-worker (recurrence 5, the ledger's highest). THE
      RULING, two parts. FIRST, the analysis needs improving and the improvement
      is structural, not another prose lens: every lens becomes its own
      /rsi-lens-<name> skill declaring its carrier field, scope tag, execution
      mode and model in frontmatter, so a carrier-less lens becomes one that
      CANNOT BE INVOKED rather than one that quietly does not run. /rsi and
      /rsi-audit both reduce to thin selectors over that catalog — /rsi takes
      the any-scope entries, /rsi-audit takes all — which dissolves the
      seven-versus-twelve split into one catalog (fewer than nineteen distinct
      lenses, since recurring-errors and friction are already duplicated across
      the two lists and the round-trip family collapses) and gives each lens the
      test surface the prose lists never had. SECOND, on execution, ruled by the
      author after the fan-out proposal was put and evaluated: fan out ONLY the
      lenses whose input is untrusted free text — tool_errors signatures,
      tool_sequences and phase_standup ngram tokens, session digests, every one
      already flagged OPAQUE DATA in rsi-audit's own prose — as direct sonnet
      subagents returning a structured verdict, and run the scalar/field lenses
      inline. The justification is CONTAINMENT AND SLICE SIZE, never parallelism
      or cost: /rsi is fire-and-forget, spawned --bg by dispatch-ladder-run
      which never waits, so no consumer is waiting on its latency and
      parallelism buys nothing; and this same evaluation measured four
      mechanical subagents costing 3.70 dollars and 9 turns to write two files
      and stat them (ledger entry
      workflow-file-writes-cost-subagent-roundtrips), so a subagent dispatched
      to fetch a scalar is that finding repeated inside the instrument meant to
      catch it. Fan-out is direct from /rsi with no intermediate orchestrator
      skill, per the recorded phase-skill fan-out doctrine, and one level of
      subagent-to-Skill nesting only. Carriers:
      tactic-rsi-lens-catalog-decomposition and
      tactic-rsi-round-trips-lens-carrier."
  - question: Is gating the evaluator on cost a contradiction with
      strategy-token-economy's 'the economy is throughput, not savings'?
    answer: "(Recorded 2026-08-14 /align round; author ruling, correcting the
      interview's own framing.) No, and the framing that made it look like one
      is withdrawn. The interview opened by putting the gate to the author as a
      fork — token savings versus yield selection — on the reading that
      strategy-token-economy's sunk-cost doctrine ('the marginal token is sunk
      cost, so the economy is throughput, not savings', with its own reading at
      utilization 27% weekly) makes reduced evaluation spend not a good. The
      author ruled the fork false: BETTER EFFICIENCY IS MORE THROUGHPUT, and
      this must not be recorded as a contradiction. That ruling is the record's
      own, not a new position — strategy-token-economy's rationale already
      states it: 'Efficiency mechanisms — per-phase model and effort routing,
      context discipline, error hygiene — ARE THROUGHPUT LEVERS: an Opus token
      draws the weekly allowance several times faster than a Sonnet token, so
      routing and context discipline convert the same allowance into more closed
      tactics.' The allowance is rate-limited, so allowance drawn evaluating a
      healthy phase is allowance not drawn closing a tactic. The gate is
      therefore an efficiency lever recorded on efficiency's own terms,
      requiring no amendment to strategy-token-economy and no divergence from
      it. It is also neither of the two things the record already refuses: not
      'spend less' (strategy-token-economy) and not 'record less' (the
      2026-08-12 ledger clarification, which adopted the rival's bound and
      refused its conclusion). One consequence worth naming:
      cost-per-unit-of-delivered-change, the metric the gate uses, is
      strategy-token-economy's own success signal — allowance converted into
      closed work — read at phase granularity."
  - question: Which trigger surface fires /rsi, given the ladder has a phase
      boundary and the scheduled tick has none?
    answer: "(Recorded 2026-08-14 /align round.) A lane-agnostic sweep over ended
      sessions' dispatch-stamp sidecars, scoped to the exact session id. The two
      drivers are not symmetric and the asymmetry is structural, not an
      oversight: dispatch-ladder-run's spawn_phase_eval fires /rsi at each
      `awaited` event, whereas the tick spawns a worker through
      dispatch-graph-execute and exits, so nothing in the tick corresponds to 'a
      phase just finished' — only the FOLLOWING tick observes a changed node
      phase. Keying the trigger on a driver's control flow therefore forces two
      detectors that will drift. What both drivers do produce is a
      <stem>.dispatch-stamp.json sidecar per session, written at birth by the
      SessionStart hook and carrying node_id; sweeping ended sessions that have
      a sidecar and no evaluation record is one detector for both. Three
      alternatives were put and declined: two independent detectors (lower blast
      radius on a working driver, but guaranteed drift and the ladder keeps its
      approximate scope); the gate inside /rsi itself (trivial, but pays a full
      session boot per phase to decide not to work — precisely the init overhead
      the audit's baseline lens measures); and leaving the tick out entirely. A
      bonus the sweep buys rather than costs: /rsi's SKILL currently records
      'there is no per-phase session id, and inventing one is not this job's
      business' and approximates scope as --node plus --since. A sidecar sweep
      yields the real session id, so /rsi can take --session <sid> exactly —
      which is also the fix for eval-since-bound-excludes-worker, the finding
      ledger's highest-recurrence entry. Carrier:
      tactic-rsi-session-sweep-trigger."
  - question: What does the threshold compare against, and who pays for computing
      the distribution?
    answer: "(Recorded 2026-08-14 /align round.) /rsi-audit writes a per-phase-kind
      threshold table into config on its regular fleet pass; the gate does a
      cheap read-and-compare. Any percentile or median needs a reference
      distribution and computing one is not free — aggregate-usage.sh is a
      ~1000-line jq program over multi-megabyte transcripts, so computing it at
      every session boundary to decide whether to spend a model turn would cost
      more than the model turn. The fleet-scope instrument was going to read
      this data anyway, so the expensive work amortizes into it rather than
      being paid N times. Static author-set constants were put as the
      alternative and declined as the steady state — fully predictable, but they
      go stale silently and cannot express 'unusual for THIS phase kind' — while
      being ADOPTED as the bootstrap: the config carries hand-set numbers until
      the first audit pass overwrites them, so the gate is shippable before the
      table exists. Honest limit owned at record time: that /rsi-audit can be
      made to WRITE a config file was not checked against its own record-only
      bounds during this interview. If that bound forbids it, the writer moves
      rather than the design. Carrier: tactic-rsi-audit-threshold-table."
  - question: Which trigger families does the gate carry, and what is each one blind to?
    answer: "(Recorded 2026-08-14 /align round; the self-normalization limit is
      disclosed against this round's own recommendation, not only against the
      rejected one.) Four families — outcome, relative, absolute, and a sampling
      floor — specified in the four-family condition recorded this round. The
      reasoning that produced four rather than one: the requirement as prompted
      proposed a 95th percentile of phase session token usage, configurable. A
      percentile is SELF-NORMALIZING — by construction ~5% of phases trip it
      however good or bad the harness becomes, so it can never report that
      things are fine now, nor that everything is bad. It is a fixed-rate budget
      allocator, not an anomaly detector, and it should be adopted only if
      spending a fixed fraction of phases on evaluation is what is wanted. The
      interview then had to own that the ratio-to-trailing-median it recommended
      INSTEAD carries exactly the same defect: if every phase degrades
      uniformly, the median degrades with it and nothing fires. That disclosure
      is what produced the absolute family — an author-set ceiling that fires
      independently of any distribution — and the long (28-day) relative window,
      so the reference does not chase a recent regression into normality. The
      sampling floor answers a different blindness: a purely threshold-gated
      evaluator only ever observes sessions that already tripped a gate, so its
      own reference distribution degrades and 'what normal looks like' stops
      being observable. Dropping the floor was put as an option and declined for
      that reason. Carrier: tactic-rsi-trigger-threshold-gate."
  - question: Steelman — verification-first workflows mean coverage is not
      conditional on suspicion. Should the evaluator's coverage stay
      unconditional?
    answer: "(Adopted in part, diverged on the conclusion, 2026-08-14; reasons
      recorded.) The rival is sourced from a tradition this strategy already
      adopts: tradition-agentic-engineering's `adopted` list names
      'verification-first workflows' as the harness's design idiom,
      'load-bearing across strategy-graph-native-dispatch and
      strategy-recursive-self-improvement'. On that reading you verify every
      unit and do not sample the tail to infer the body, so the
      every-phase-boundary rule is the tradition-faithful one and a threshold
      gate is a regression from verification back to INSPECTION — with Deming's
      'cease dependence on inspection' making the same objection from the other
      side. ADOPTED: the rival's bar binds absolutely for FAILURES, which is why
      the outcome family fires unconditionally and why condition 7's halt clause
      is explicitly protected against the gate rather than merely surviving it.
      DIVERGED, on two grounds. First, verification-first binds the PRODUCT
      pipeline — every change gets tests, review and qa, which the ladder does —
      and /rsi verifies nothing; it is a measurement instrument reading spend
      and error signatures, and a measurement instrument is not the unit under
      verification. Second, Deming's own argument cuts the other way for
      instruments: reacting to common-cause variation is TAMPERING, and an
      evaluator that fires on every phase and mints a finding from ordinary
      variation is tampering, not verification. A rival framing was also put and
      declined — keep unconditional coverage but move the threshold to the
      LEDGER WRITE, evaluating everything and minting only what clears a
      materiality bar. It is faithful to the tradition and it controls the
      variable clarification 32 actually named, but it pays a full session boot
      plus model turn per phase on both drivers, which on the tick multiplies
      across every node in flight. Honest limit owned at record time: the Deming
      reading is Claude-internal knowledge the author has not verified, and this
      graph has no reading chunk for either tradition —
      tactic-review-tradition-agentic-engineering is born-parked and not yet
      held. The author took plain acceptance rather than the offered deferral
      after that boldness was disclosed."
  - question: How does a threshold skip avoid violating condition 9's rule that an
      occurrence is never silently dropped?
    answer: "(Recorded 2026-08-14 /align round; this is the edge case the gate would
      otherwise have created.) By counting the skips. Condition 9 was recorded
      against graph-write-lock contention, but its reason generalizes exactly:
      the ledger exists to carry a recurrence count, and an occurrence that
      never happens because the session was never evaluated is dropped just as
      surely as one that fails to take the lock. Worse, a gate corrupts the
      figure in a way lock contention does not — it changes the DENOMINATOR
      silently, so 'this finding recurred three times' stops being interpretable
      at all ('three in a hundred phases' and 'three in five evaluated phases'
      are different findings, and after gating you cannot tell which you have).
      The rule recorded is therefore that the sweep records the skipped
      population, making recurrence readable as a rate against a known
      denominator, and that the sampling floor gives the unbiased estimator for
      the skipped body. This is the strongest single reason the sampling floor
      is not optional. Note the scope: it also affects recurrence figures
      recorded BEFORE the gate ships, since they were measured against full
      coverage — a comparison across the change must account for that break."
  - question: Can the tick-side half of this change be validated while dispatch is
      paused?
    answer: "(Recorded 2026-08-14 /align round.) No, and the record binds that
      rather than leaving it implicit. Dispatch is paused by author directive
      since 2026-08-10, and this node's own attributes.pause records that
      criterion 1 is not autonomously satisfiable while the pause holds; the
      dispatch-ladder exists precisely as the manual escape for nodes the tick
      structurally cannot reach. So the tick half of the widened trigger — the
      whole motivation for widening it — lands into a driver that is not
      currently running. The ruling: build both halves in ONE lane-agnostic
      change (the lane-agnostic design is what makes the tick half nearly free,
      so splitting it would mean writing the sweep twice), validate the ladder
      path immediately, and carry an explicit 'unvalidated until the pause
      lifts' mark on the tick path that the implementing tactic's qa-main must
      discharge when it does. The alternative put and declined was ladder-only
      now with the tick half as a draft blocked on the pause lifting."
  - question: Does this round's cost-per-unit-of-change metric duplicate the
      round-trips lens carrier recorded the same day?
    answer: "(Recorded 2026-08-14 /align round, reconciling against clarification 46
      which landed during this interview.) No, and the interview's own claim
      that orchestration overhead had NO sensor was wrong and is corrected here.
      The interview put to the author that '95th percentile of orchestration vs
      real-work token ratio' was unmeasurable, having read aggregate-usage.sh's
      session-type and attribution-skill folds and found neither separates
      plumbing from work. It missed
      lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips, which
      computes exactly that class and which clarification 46 of this same date
      rules must be re-tagged any-scope so /rsi can read it (carrier:
      tactic-rsi-round-trips-lens-carrier). No orchestration-ratio sensor tactic
      is minted by this round; that carrier already exists and minting a second
      would be the duplicate-finding defect this strategy's own success_signal
      measures. The two metrics sit at different layers and both are kept:
      scriptable_round_trips is a LENS, read INSIDE an evaluation to explain
      where a session's spend went; cost-per-unit-of-delivered-change is a
      TRIGGER, read OUTSIDE to decide whether to evaluate at all. The author's
      ruling on the metric is unchanged by the correction, since only the
      bookkeeping moved. The 2026-08-13 figures clarification 46 records — 830
      of 1026 seconds and $37.47 of $76.09 outside the review, the orchestrator
      outspending all five review lenses 2.7 to 1, 7 of 12 subagents reviewing
      nothing, 0 actionable findings — are the evidence for BOTH, and are the
      single measured datapoint validating cost-per-unit-of-delivered-change as
      a trigger."
  - question: Who may write the gate's threshold parameters?
    answer: "(Recorded 2026-08-14 /align round, from the step-3 delegation sweep;
      applying an existing ruling rather than making a new one.) The author
      only. The delegation sweep matched delegation-anthropic-claude, whose
      attributes.delegated was extended by this strategy's own 2026-08-11 round
      to cover 'tactical prioritization of dispatch-delegated work' and whose
      divergence.level is moderate. No `recovers` edge is warranted — this round
      does not unwind vendor reliance, and the evaluation judgment stays
      delegated. What it does surface is a capture risk with a sharper shape
      than the prioritization case: a self-evaluator that can tune its own
      trigger is one that can decide not to look at itself, and unlike a
      mis-prioritization that is visible in the queue, a raised threshold is
      invisible precisely because it produces no findings. So condition 10's
      already-ratified recommend/write split is applied to this new actuator
      verbatim: the model may recommend a parameter change with measured
      justification, and never writes one. This was decided in-round rather than
      put as a question, because it applies a ratified split to a new actuator
      rather than deciding anything new."
  - question: Which interventions does the widened trigger cover, and why is
      /office-hours excluded?
    answer: "(Recorded 2026-08-14 /align round.) The six unattended lanes —
      dispatch-invalid-state, dispatch-conflict, fix-checks, qa-main,
      diagnose-main, jit-reminder — are treated exactly as phases, same four
      trigger families. Attended /office-hours sittings are out of scope
      entirely. The reason is that an attended sitting differs in kind rather
      than in degree: its scarce resource is the author's time, not allowance
      draw, so cost-per-unit-of-delivered-change is undefined for it and the
      relative and absolute families have nothing to read. It is also already
      the author's own surface, which makes an unattended evaluator recording
      findings about how a sitting was spent a different proposition from one
      evaluating a worker. Two alternatives were put and declined: office-hours
      on outcome triggers only (evaluate a sitting when a park did not clear, an
      exit-11 fired, or a disposition had to be redone — attractive, and the
      nearest thing to a future amendment if sitting quality ever needs
      measuring), and uniform coverage, which would require deciding what
      cost-per-unit-of-delivered-change means when the unit is a human decision,
      for which this interview had no answer."
tooling_goals: []
success_signal:
  observable: graph-native dispatch reaches stable autonomous operation; every
    phase and unattended-intervention session on BOTH dispatch drivers is either
    evaluated or recorded as a counted skip, so recurrence stays readable as a
    rate; every outcome-triggered session is evaluated unconditionally; the eval
    lane's share of the per-workflow spend fold falls without the ledger's
    distinct-finding discovery rate falling with it; and each /rsi-audit pass
    reports a per-workflow spend fold that holds its review thresholds — with
    the opportunities it ranks landing in the graph rather than in a report, and
    with no two tactics recording the same root-cause defect
  sensor: sensors registered in the graph's existing success_signal/readings
    machinery on their owning strategies (backlog band, parked critical-path
    count, held-session/worktree census, pause state), plus per-workflow token
    attribution across dispatch, office-hours, and rsi reported by /rsi-audit;
    plus the research lane's weekly dated readings on this strategy
    (research-cycle landings)
  threshold: dispatch runs unpaused, strategy-graph-native-dispatch's own 35%
    non-increasing band holds, consecutive /rsi-audit windows keep dispatch
    dominating the per-workflow fold, the parked critical-path count is
    non-increasing across them, and evaluated-plus-counted-skips equals the
    eligible session population in every window (a silent drop fails the signal
    outright)
  is_proxy: true
attention:
  boosts:
    "1": 5
  rationale: >-
    Author-directed 2026-08-11: rerank the rsi strategy to the top of tier 1,
    above strategy-graph-native-dispatch (authored boost 5) — supersedes the
    same-day rationale that placed rsi just below the router migration. The
    recursive-self-improvement loop that maintains rsi-plan.md and shortcuts
    critical-path harness work now outranks every other tier-1 strategy,
    including strategy-graph-native-dispatch (boost 5),
    strategy-graph-review-curriculum (boost 3.5), and strategy-attention-surface
    (boost 3).


    LEVEL MIGRATION 2026-08-14: tier 1 boost snapped from 6 to the closed level
    vocabulary value 5 (background) per strategy-graph-drives-dispatch's
    level-vocabulary clarification; ordering intent unchanged.
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
      the queue.) (Amended 2026-08-14: the exemption follows the
      finding-recording WRITE, not the rsi namespace. dispatch-eval-finding is
      being retired as a writer private to this strategy, and whatever
      generalized find-or-recur write surface replaces it carries the same
      exemption for every producer — recording a finding is recording work
      whoever records it. The condition's substance is unchanged; only the named
      mechanism moves.)"
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
      model turn per phase, accepted for the evidence freshness it buys.)
      (Amended 2026-08-14: every lens in this list must NAME THE MECHANICAL
      CARRIER that produces it — the aggregate-usage.sh field, events.jsonl
      field, or node counter a reader can query — or be explicitly marked
      judgment-only. A lens stated as prose with no named carrier is reliably a
      lens that does not run: 'unnecessary round trips' was the only
      carrier-less entry of the seven, and it is the one that missed an
      830-second orchestration overhead that a sibling instrument had already
      measured. Six of the seven already comply — recurring errors reads
      tool_errors, variances reads the events.jsonl dispositions, rework reads
      execution.fix.attempt, calibration reads elapsed_s against window_s,
      friction reads permission_friction — so this records the practice the list
      already mostly follows and closes the one hole. The requirement binds the
      LIST, not any single lens, so a lens added later arrives with a carrier or
      arrives marked judgment-only. See the 2026-08-14 clarification for the
      measurement and for the catalog design that makes the requirement
      mechanical rather than prose discipline.)"
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
      retired /rsi and /rsi-plan did that neither successor did.) (Amended
      2026-08-14, narrowing 'medians'. The fleet-only carve-out reads 'pooled
      outcome rates, medians, cross-session recurrence', which tags EVERY median
      fleet-only. That is too wide. A median whose per-session term is itself a
      rate or a cross-session quantity is fleet-only as intended; a median of
      RAW PER-SESSION COUNTS degenerates at n=1 to that one session's own count
      and stays meaningful.
      lenses.phase_standup.boot_preamble.scriptable_round_trips is the worked
      case — a median of leading consecutive mechanical-call runs, one raw count
      per session — and it is the carrier condition 14's round-trips lens was
      missing. The over-wide reading is precisely what instructed the per-phase
      evaluator to skip the field that would have caught the defect. Tag by what
      the median is a median OF, never by the word 'median'. This does not
      disturb the three things /rsi-audit still owes that a single run
      structurally cannot produce; it corrects only the boundary between them.)
      (Amended 2026-08-14 /align round, on author ruling. TWO changes, and one
      thing deliberately unchanged. FIRST, the binding surface widens from the
      dispatch-ladder to BOTH DRIVERS: a phase or unattended-intervention
      session is evaluated whether the ladder drove it or the scheduled tick
      spawned it. The tick has no phase-boundary event to hook — it spawns a
      worker and exits, and only the next tick observes a changed phase — so the
      trigger is keyed on the SESSION rather than on a driver's control flow
      (see the trigger-surface clarification of this date). SECOND, 'every'
      becomes conditional on a trigger firing rather than automatic: the
      per-session evaluation is now threshold-gated, per the four-family trigger
      condition recorded this same round. UNCHANGED, and explicitly protected
      against the gate: the halt clause. A run that halts (exit 10/11/12/13/21)
      still owes a review of the phases it completed, and it owes it
      UNCONDITIONALLY — the cheapest halts (exit 10 idle, exit 13 claimed) burn
      almost nothing, so a cost threshold would systematically skip exactly the
      most defect-rich runs this clause was recorded to catch. The seven lenses
      every evaluation must cover are unchanged in substance; their carriers are
      being restructured by the lens-catalog ruling of this same date.)"
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
      of strategies and owner: human tactics; /rsi-audit owns prioritization of
      dispatch-delegated (owner: ai) tactics, ordered toward the recorded
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
      permitted an override to displace the strategy-distributed value. Amended
      2026-08-13: the actuator is /rsi-audit, replacing the /rsi-evaluate this
      condition named until the surface it would have lived in was retired and
      the skill was never built. The strategy level becomes a CHANNEL rather
      than silence: /rsi-audit recommends strategy boosts with measured
      justification and the author ratifies. A recommendation writes nothing, so
      the bound above is unchanged in scope — the model still never writes
      attention on a strategy, a virtue, or an owner: human tactic. Only the
      recommend half is built; the write half is
      tactic-rsi-audit-prioritization-writer, blocked on
      tactic-attention-namespaced-rank"
    - "every model reprioritization is logged: the attention write appends
      {date, old→new, rationale} to the node’s attributes.priority_log
      (append-only, capped ~10, fingerprint-exempt), and a prior reordering is
      never reversed without citing new evidence — prioritization thrash is a
      defect the log exists to make visible (Recorded 2026-08-11). Amended
      2026-08-13: the writer that owes the log entry is /rsi-audit. A
      strategy-level recommendation is not a reprioritization and logs nothing,
      because it writes nothing — the log records acts, and a recommendation the
      author has not ratified is not one"
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
      third round). Amended 2026-08-13: 'the model' in this condition is
      /rsi-audit, the one delegated actuator; the classification acts it may
      perform and the rank algebra that bounds them are unchanged"
    - "the evaluator's trigger is uniform across drivers and keyed on the
      SESSION, never on a driver's control flow: /rsi fires for a finished phase
      or unattended-intervention session whether the dispatch-ladder drove it or
      the scheduled tick spawned it, detected by a lane-agnostic sweep over
      ended sessions' <stem>.dispatch-stamp.json sidecars (written at session
      birth by the SessionStart hook, carrying node_id — the same sidecar
      aggregate-usage.sh --node already matches on), and scoped to the EXACT
      session id rather than approximated by node plus a --since time bound. The
      tick cannot carry a boundary hook: dispatch-graph-execute spawns a worker
      and exits, and only the following tick observes a changed node phase. Two
      consequences the design deliberately takes: one detector rather than two
      that would drift, and the removal of /rsi's recorded scope approximation
      ('there is no per-phase session id') — a sidecar sweep yields the real
      session id, which also closes the ledger's highest-recurrence finding
      eval-since-bound-excludes-worker. The gate is NOT implemented inside /rsi
      itself: a session that boots in order to decide not to work pays the full
      init overhead the audit's own baseline lens measures. IN SCOPE: the
      unattended lanes — dispatch-invalid-state, dispatch-conflict, fix-checks,
      qa-main, diagnose-main, jit-reminder — treated exactly as phases. OUT OF
      SCOPE: attended /office-hours sittings, whose scarce resource is the
      author's time rather than allowance draw, and for which
      cost-per-unit-of-delivered-change is undefined. (Recorded 2026-08-14
      /align round.)"
    - "the trigger is FOUR families and three of them are cost-independent,
      because no single family is sound alone. (1) OUTCOME — a halt (exit
      10/11/12/13/21), rework (execution.fix.attempt incremented, a conflict
      attempt, a demotion back to implement, scope-fingerprint custody churn), a
      new tool-error signature, a permission denial, or a park — fires
      UNCONDITIONALLY, no threshold consulted. (2) RELATIVE —
      cost-per-unit-of-delivered-change (phase price proxy over lines changed or
      units planned/implemented) above k times the trailing 28-day median for
      that phase kind — fires on the expensive tail; the window is long
      deliberately so the threshold does not chase a recent regression into
      normality. (3) ABSOLUTE — an author-set cost-per-unit ceiling — fires
      regardless of the distribution, and exists because EVERY relative
      threshold is structurally blind to a uniform regression: if every phase
      gets three times worse the median moves with it and nothing fires. That
      defect is why a raw 95th percentile was rejected and it applies equally to
      the ratio-to-median that replaced it; the absolute family is the answer to
      it, not an afterthought. (4) SAMPLING FLOOR — one in N of everything else
      — keeps the reference distribution calibrated and the healthy path
      observable, without which the distribution only ever sees sessions that
      already tripped a gate and degrades. k, the ceiling and N are all
      configurable. Cost-per-unit-of-delivered-change is preferred over raw
      token magnitude on measured evidence: the 2026-08-13 review phase that
      spent 830 of 1026 seconds outside the review was CHEAP in absolute terms,
      so a magnitude gate would have missed it while flagging a large implement
      phase that was expensive only because the work was big. (Recorded
      2026-08-14 /align round.)"
    - "a skipped session is COUNTED, never silently dropped: condition 9's rule
      that an occurrence must never be silently dropped extends from
      graph-write-lock contention to threshold skips, because the failure is the
      same one — an unreadable recurrence figure. The sweep records the skipped
      population, so recurrence_count stays interpretable as a RATE against a
      known denominator rather than as a bare count against an unknown one
      ('three times in a hundred phases' and 'three times in five evaluated
      phases' are not the same finding), and the sampling floor supplies the
      unbiased estimator for the skipped body. A gate that reduces evaluations
      without recording the denominator makes every recurrence figure on the
      ledger uninterpretable, including the ones recorded before it shipped.
      (Recorded 2026-08-14 /align round.)"
    - "the reference distribution is computed by /rsi-audit and never by the
      gate, and the gate's parameters are author-owned. On the distribution: the
      fleet-scope instrument already reads this data on its regular pass, so it
      writes per-phase-kind cut points into config and the gate does a cheap
      read-and-compare; aggregate-usage.sh is a ~1000-line jq program over
      multi-megabyte transcripts, and running it at every session boundary to
      decide whether to spend a model turn would cost more than the model turn
      it gates. Hand-set constants in the same config are the bootstrap until
      the first audit pass overwrites them. On the parameters: k, the absolute
      ceiling and N are written by the AUTHOR only — the model may recommend a
      change with measured justification and never write one. This applies
      condition 10's already-ratified recommend/write split to a new actuator,
      and the reason is sharper here than for prioritization: a self-evaluator
      that can tune its own trigger is one that can decide not to look at
      itself, and delegation-anthropic-claude's divergence is already moderate.
      (Recorded 2026-08-14 /align round, from the step-3 delegation sweep.)"
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
# Harness self-improvement is measurement, not a second orchestrator — /rsi evaluates each finished dispatch-ladder phase and /rsi-audit measures token economy at any scope, and both record findings as ordinary draft tactics on the graph, merging a recurrence onto the existing node exactly as every other finding producer does

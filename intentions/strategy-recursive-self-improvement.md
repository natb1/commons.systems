---
id: strategy-recursive-self-improvement
kind: strategy
statement: A serialized recursive self-improvement loop — /rsi — evaluates the
  harness each iteration, maintains rsi-plan.md as the author-facing status/plan
  surface, and shortcuts critical-path work that blocks model execution of
  author intention
owner: human
status: refining
parent: strategy-autonomous-execution
rationale: "The graph-native dispatch bootstrap has been in flight for several
  weeks since the GitHub-issue-native workflow was sunset; the harness's
  implementation of itself produces bootstrap deadlocks (the 2026-08 reap-gate
  incident held every reap; dispatch is paused by author directive 2026-08-10)
  and slow progress that the harness's own machinery-defect lane cannot always
  drain. /rsi is the meta-loop: one iteration per invocation evaluates the
  harness and ranks the main blockers, bottlenecks, and critical path for model
  implementation of author intention — implementation bugs inconsistent with
  documented intention, execution inefficiencies (token waste from poorly
  managed context, unoptimized model choice, redundant work, repeated errors),
  ambiguities in author intention (e.g. parked office-hours nodes on the
  critical path), and technical debt not justified by current greenfield design
  — and either drafts graph tactics for harness optimization or shortcuts
  high-impact critical-path items by driving them through the dispatch phase
  skills itself under the same quality standards. Its purpose is planning and
  acceleration, never wholesale graph execution: the harness
  (strategy-autonomous-execution, strategy-graph-native-dispatch) remains the
  execution path; rsi exists to keep that path viable and improving, including
  where harness implementation of itself would deadlock. Goals: (a) accelerate
  bootstrap of a stable graph-native dispatch workflow; (b) establish a
  recursive workflow for ongoing harness optimization and improvement. (Amended
  2026-08-10 research-lane round: a scheduled /rsi-research sensor lane — weekly
  /deep-research over the author-ratified seed texts of
  tradition-agentic-engineering — feeds the fit-function evaluation with
  external hypotheses; sensor-only, author-gated incorporation, recorded in the
  clarifications and conditions of that date.)"
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
      thresholds; it does not judge. Between steps 1 and 2 sits the main-thread
      judgment step, owned by /rsi itself: what graph updates are required,
      whether implementation routes to the harness or to rsi shortcut, whether
      an /align session is needed, and the task-plan revision — the main thread
      holds the serialized claim for graph writes and can run /align
      interactively, so judgment is never delegated to the rendering subagent."
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
      never the .md.)"
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
      'sonnet subagent' form is superseded."
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
    answer: "(Recorded 2026-08-11 rsi iteration, from reading the code at
      origin/main.) Partly, and no. The pause sentinel is documented as gating
      worker SPAWNING only, and the paused branch does run the healing sweeps
      (reservation, stand-down re-check, stale-hold re-check, frozen-session,
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
      \"$MANUAL\") or an author hand-merge, and both are operator actions no
      part of the record named as a dependency of resuming. Repair is tracked as
      tactic-pause-disables-merge-lane. Two record corrections follow: /rsi's
      own SKILL.md asserts \"the tick's merge lane runs even while dispatch is
      paused — let it\", which is false as written, and the pause rationale's
      claim that the paused branch is \"precisely the set needed to drain a
      queue, so pausing costs no healing\" overstates what that branch covers."
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
attention: null
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
    - at most one /rsi session is active at a time — invocation claims a
      singleton resource (the strategy-recursive-self-improvement worktree,
      worktree-as-claim, the same liveness rule the router uses) and fails with
      a printed error when the claim is held; fail-closed and automatic, never
      operator discipline, and never a second detection mechanism beside the
      claim primitive
    - a node worked by rsi shortcut implementation is claimed exactly as
      dispatch claims it (worktree-as-claim, launch-path refusal of an
      already-claimed node), so no node is ever worked concurrently by the
      dispatch workflow and the rsi skill — rsi meets the same serialized
      implementation standards as the dispatch workflow
    - rsi shortcut implementation reuses the dispatch phase skills verbatim,
      driven through the same execution substrate — spawned sessions via
      dispatch-graph-execute / dispatch-spawn-job, with the tick's merge lane
      doing every merge (rsi never hand-merges) — so the quality bar is
      identical because the skills are identical; rsi maintains no second
      orchestration surface and no divergent copy of a standard, and a standards
      extraction into common skills happens only when a concrete consumer
      requires it (none does today)
    - rsi holds pause/resume authority over the dispatch queue for integrity
      errors affecting the stability or correctness of the dispatch workflow;
      pauses go through the doctrinal mechanism (the dispatch.config boolean
      once tactic-dispatch-pause-config-field lands; the sentinel file is
      interim practice), and every pause records explicit, mechanically
      evaluable resume criteria as structured data rendered into rsi-plan.md — a
      pause with no recorded resume criterion, or with prose-only criteria no
      check can evaluate, is a defect
    - "the graph stays the sole tracker: rsi-plan.md is a derived, fully
      rendered artifact — every section is produced by render-rsi-plan.ts from
      graph state, including the model-generated queue summaries, which land
      first as dated readings on their owning strategy nodes (dispatch →
      strategy-graph-native-dispatch, office-hours → strategy-attention-surface,
      rsi → strategy-recursive-self-improvement) and are rendered from there; a
      hand-edited section is a defect. The file is single-writer (rsi-only,
      serialized) and direct-pushed to main without PR flow — a recorded
      exception to strategy-graph-native-dispatch's
      direct-push-restricted-to-intentions/-paths condition, carried until
      tactic-rsi-direct-push-condition-reconcile amends that condition"
    - each rsi session runs under a task budget — default 1; an rsi-implement
      task costs 1 and other tasks cost 0 unless a task specifies its own cost;
      plan execution continues until the budget is exhausted
    - rsi sessions and their rsi-implement work are pace-exempt —
      author-invoked, serialized, and budget-bounded, so the budget and the
      serialization are the throttle rather than the pace curve; the exemption
      is named here so the pace-exempt marked-set discipline on
      strategy-graph-native-dispatch stays deliberate
    - rsi metrics are sensors registered in the graph's existing
      success_signal/readings machinery on their owning strategies — never a
      parallel metric registry; rsi-plan.md renders readings, and registering an
      rsi metric reduces the graph's standing unregistered-sensor gap rather
      than adding a side system
    - "/rsi is an attended, author-invoked loop — never scheduled or
      cron-driven; unattended recursion is the harness's job, and the
      interactive limbs (the /align escalation, the office-hours conduct on an
      rsi-implement throw) exist precisely because the author is present —
      scoped 2026-08-10: this binds the /rsi loop proper; the scheduled
      /rsi-research sensor lane (weekly, sensor-only, author-gated
      incorporation) is not /rsi and is governed by the research-lane conditions
      below"
    - "the research lane is sensor-only: a scheduled /rsi-research run writes
      only inert output — one dated reading on this strategy, born-parked
      candidate curriculum chunks, and draft tactics — and never grounding
      marks, tradition-record edits, graph-doctrine edits, or work execution;
      every incorporation of a finding is author-gated (curriculum sitting, /rsi
      judgment step, or /align), and the lane's token spend stays small relative
      to dispatch under the existing per-workflow attribution — spend
      approaching dispatch is itself a review trigger"
    - the research lane runs weekly via harness cron invoking /rsi-research,
      independent of the dispatch pause state (its output is inert, and research
      continuing while dispatch is paused is the bootstrap case rsi exists for);
      each run claims the strategy-recursive-self-improvement worktree
      fail-closed against a live /rsi session, the same worktree-as-claim
      serialization as /rsi itself
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
    - "every rsi-implement task ends with a recorded acceleration review, inside
      the same task and at no extra budget cost: once the node reaches its
      terminus for the session, the observed execution is evaluated for
      optimizations to rsi shortcut implementation and to implementation in
      general — phase wall-clock against the await window, failed or wasted
      launch cycles, repeated operator interventions, round trips that produced
      no code change, and CI/fix-lane spend — and every finding lands in the
      graph in that same session as a tactic, or as a dated clarification on an
      existing node when one already covers it. The review is performed after
      the implementation reaches its terminus, never interleaved with it, so it
      evaluates observed results rather than predictions. A session that reports
      an rsi-implement outcome with no recorded review, or that leaves its
      findings in session prose only, is a defect — the graph is the sole
      tracker, so an unrecorded acceleration finding is indistinguishable from
      one never made."
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
    self_blocking: Criterion 1 cannot be satisfied autonomously while this pause is
      in force. The node-lane merge lane (graph-auto-merge,
      dispatch-select-tick:505) runs only inside dispatch-select-tick, and every
      dispatch-select-tick invocation (dispatch-tick:638-642) sits past the
      pause short-circuit's exit 0 (dispatch-tick:415). So no reviewed node-lane
      PR merges autonomously while the sentinel exists, and criterion 1 requires
      exactly such a merge. The escapes are an operator-run `dispatch-tick
      --manual` (dispatch-tick:314 tests -z "$MANUAL") or an author hand-merge.
      Tracked for repair by tactic-pause-disables-merge-lane.
    resume_criteria:
      - id: reap-gate-landed
        criterion: "PR #3052 is merged, and the sweep demonstrably reaps a 0-ahead clean
          worktree with no operator action (#3052's own done-when)."
        check: gh pr view 3052 --json state --jq .state reads MERGED, and a reservation
          sweep reaps a 0-ahead clean worktree unattended.
        status: fails
        measured: "2026-08-11: #3052 OPEN, 23/23 checks SUCCESS, mergeable CLEAN,
          unmerged. Green and unmergeable-by-the-harness for the reason recorded
          in self_blocking above."
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
# A serialized recursive self-improvement loop — /rsi — evaluates the harness each iteration, maintains rsi-plan.md as the author-facing status/plan surface, and shortcuts critical-path work that blocks model execution of author intention

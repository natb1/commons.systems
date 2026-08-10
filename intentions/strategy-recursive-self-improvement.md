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
  high-impact critical-path items through rsi-implement under
  dispatch-equivalent quality standards. Its purpose is planning and
  acceleration, never wholesale graph execution: the harness
  (strategy-autonomous-execution, strategy-graph-native-dispatch) remains the
  execution path; rsi exists to keep that path viable and improving, including
  where harness implementation of itself would deadlock. Goals: (a) accelerate
  bootstrap of a stable graph-native dispatch workflow; (b) establish a
  recursive workflow for ongoing harness optimization and improvement."
reading: null
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
      Divergence is bounded: rsi reuses extracted common standards so the
      quality bar stays unified, claims nodes under the same serialization
      discipline, and is itself serialized and budget-bounded."
  - question: What does one /rsi iteration do?
    answer: "(Recorded 2026-08-10.) Step 1: a subagent running /rsi-plan refreshes
      the metrics and summaries in rsi-plan.md (delegating to scripts where
      possible) and re-evaluates the task plan — removing completed tasks and
      surfacing critical tasks not yet on the plan. Step 2 (optional): run
      /align when construction of rsi-plan.md reveals findings that require
      author input and cannot be resolved from guidance already in the graph.
      Step 3: either (a) update the graph and draft tactics for harness
      optimization or graph quality, updating rsi-plan when draft nodes are
      routed to rsi-implement, or (b) execute tasks on the rsi-plan until the
      session budget is exhausted."
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
      .md file."
  - question: What is rsi-implement's contract?
    answer: (Recorded 2026-08-10.) A sonnet subagent orchestrating a node all the
      way through merge and main-qa under the extracted dispatch standards —
      breaking implementation into units delegated to subagents with the model
      chosen per the model-selection heuristic — for high-impact, critical-path
      items such as bugs affecting harness integrity. It throws to the
      main-thread rsi session — which conducts an office-hours session and
      updates rsi-plan — when implementation cannot be completed by the subagent
      and the main thread cannot mechanically resolve the blocker.
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
      rsi-implement subagents are pace-exempt; the session budget and the
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
tooling_goals: []
success_signal:
  observable: graph-native dispatch reaches stable autonomous operation and each
    subsequent /rsi iteration lands an rsi-plan.md update whose metrics hold
    their review thresholds
  sensor: the rsi-plan.md metrics section — a scripted subset of graph signals
    (backlog band, parked critical-path count, held-session/worktree census,
    pause state) refreshed by /rsi-plan each iteration
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
  conditions:
    - at most one /rsi session is active at a time — invocation checks for a
      live rsi session and fails with a printed error rather than running
      concurrently; the serialization is automatic, not operator discipline
    - a node worked by rsi shortcut implementation is claimed exactly as
      dispatch claims it (worktree-as-claim, launch-path refusal of an
      already-claimed node), so no node is ever worked concurrently by the
      dispatch workflow and the rsi skill — rsi meets the same serialized
      implementation standards as the dispatch workflow
    - rsi planning, QA, review, and conflict handling reuse common standards
      extracted from the dispatch skill family (planning from /align-tactics, QA
      from /qa-fix, review from /review-fix, variance/conflict logic shared with
      the dispatch scripts and /dispatch-conflict, tactic-drafting standards
      from /align) — the quality bar is identical and only the orchestration
      mechanism differs; rsi never maintains a divergent second copy of a
      standard
    - rsi holds pause/resume authority over the dispatch queue for integrity
      errors affecting the stability or correctness of the dispatch workflow,
      and every pause it takes records explicit resume criteria in rsi-plan.md —
      a pause with no recorded resume criterion is a defect
    - "the graph stays the sole tracker: rsi-plan.md is a derived, single-writer
      (rsi-only, serialized) dashboard direct-pushed to main without PR flow;
      every rsi task references a graph node, and the file carries no work
      record that is not in the graph. The direct-push is a recorded exception
      to strategy-graph-native-dispatch's
      direct-push-restricted-to-intentions/-paths condition, carried until
      tactic-rsi-direct-push-condition-reconcile amends that condition"
    - each rsi session runs under a task budget — default 1; an rsi-implement
      task costs 1 and other tasks cost 0 unless a task specifies its own cost;
      plan execution continues until the budget is exhausted
    - rsi sessions and their rsi-implement subagents are pace-exempt —
      author-invoked, serialized, and budget-bounded, so the budget and the
      serialization are the throttle rather than the pace curve; the exemption
      is named here so the pace-exempt marked-set discipline on
      strategy-graph-native-dispatch stays deliberate
---
# A serialized recursive self-improvement loop — /rsi — evaluates the harness each iteration, maintains rsi-plan.md as the author-facing status/plan surface, and shortcuts critical-path work that blocks model execution of author intention

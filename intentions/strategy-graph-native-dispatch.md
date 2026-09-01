---
id: strategy-graph-native-dispatch
kind: strategy
statement: Dispatch runs on the graph — orchestration state lives in intention
  nodes, worked through the align skill family
owner: human
status: refining
parent: strategy-graph-drives-dispatch
rationale: "strategy-graph-drives-dispatch made the loop real — intent enters
  execution from the graph and readings flow back — but GitHub still holds the
  orchestration state itself: phase labels, sub-issue hierarchy, blocked_by
  gates, and the office-hours park all live as gh projections the router
  re-derives every tick. This strategy moves the state home. Tactic nodes carry
  their execution plan in the node body and a persisted phase the router
  transitions; strategies become schedulable work in their own right (an
  unvalidated signal with no child tactics calls an /align-tactics session into
  being); and the align skill family — /align, the single interactive entry
  point to the graph's persistent layer (with a prompt: the recording interview,
  able to record or amend virtues, strategies, traditions, and delegations; with
  no prompt: the onboarding funnel — orientation, scripted deployment
  validation, and a walk to crafting the prompt, which the session then
  executes), and /align-tactics for breaking a strategy into executable tactic
  subtrees — supersedes /file-issue and /plan-issue as the interface for intent
  entering execution. /align consolidates the former /align-strategy and
  /align-init (2026-07-09 consolidation clarification; implementation:
  tactic-align-entrypoint-consolidation). The legacy gh router runs concurrently
  until the gh queue drains, then it is removed; full /file-issue and
  /plan-issue coverage is mapped into the align family before removal (coverage
  matrix retained as draft content on tactic-graph-native-dispatch). (Amended
  2026-07-28 /align-strategy interview.) The preceding sentence — the legacy gh
  router running concurrently until the gh queue drains, then being removed with
  full /file-issue and /plan-issue coverage mapped into the align family first —
  is now HISTORY, not pending work: it completed 2026-07-26
  (tactic-legacy-router-removal phase done, PR #2960) and GitHub Issues are
  disabled repo-wide. What this strategy governs going forward is the steady
  state that migration produced: the owned graph-dispatch path being exercised
  and its own defect burden bounded — the \"an unexercised recovery path is a
  hope, not a path\" clause of virtue-progressive-detachment, which the
  superseded migration-completion threshold could not read. success_signal was
  amended this round accordingly; see the threshold-shape and steelman
  clarifications below."
reading: "lifecycle: tactic-indieweb-audience implement→qa→review→done
  (2026-08-29); router selections: 2487 records, 287 nodes; backlog: 128/316 =
  40.5% (band ≤35%); backlog series 28d: 28.0% → 20.4% → 44.6% → 40.5%
  (increasing)"
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
recovers:
  - delegation-github
clarifications:
  - question: Where does a tactic's execution state live — derived from PR/CI ground
      truth as today, or persisted in the node?
    answer: Where does a tactic's execution state live — derived from PR/CI ground
      truth as today, or persisted in the node? — See body §Phase Transitions &
      Fix State for the full mechanism. Recorded 2026-07-03 interview.
  - question: How do concurrent sessions record graph edits safely, given a record
      must land on origin/main before it is schedulable?
    answer: How do concurrent sessions record graph edits safely, given a record
      must land on origin/main before it is schedulable? — See body
      §Serialization & Commit. Recorded 2026-07-03 interview.
  - question: A strategy's tactics all complete but its signal is still unvalidated
      — what stops /align-tactics from burning rounds forever?
    answer: A strategy's tactics all complete but its signal is still unvalidated —
      what stops /align-tactics from burning rounds forever? — See body §Phase
      Transitions & Fix State. Recorded 2026-07-03 interview.
  - question: What replaces the dispatch:office-hours label?
    answer: What replaces the dispatch:office-hours label? — See body §Recovery &
      Session Lifecycle for the full mechanism. Recorded 2026-07-03 interview.
  - question: Where does a tactic's execution plan live, given node bodies are cosmetic?
    answer: Where does a tactic's execution plan live, given node bodies are
      cosmetic? — See body §Other Settled Mechanism for the full mechanism.
      Recorded 2026-07-03.
  - question: Where does tactical content naturally produced during strategy work live?
    answer: "In the graph, as draft tactic nodes — never in ad-hoc design docs
      outside intentions/. /align-strategy's contract is retain, not refine:
      when the interview or its exploration develops tactical context, the skill
      dumps it into draft tactics (status raw, no execution phase, serves the
      strategy) with no plan-schema or quality obligations — tactical
      documentation stays /align-tactics's job. Draft tactics never block
      strategy eligibility for /align-tactics; they are its input: it finalizes,
      splits, merges, or prunes them. Until tactic-body preservation ships in
      the store, draft bodies are hand-maintained (safe interim: no automated
      writer touches tactic bodies). Recorded 2026-07-03; supersedes this
      record's own first draft, which parked the design outside the graph in
      packages/intentionsutil/DISPATCH.md."
  - question: How does the /align-strategy dialectic handle requirements for UI
      design, where text questions under-specify?
    answer: "It supplements the ask-questions tool with the design system's design
      canvas: the skill produces canvas artifacts (mockups/variants built on
      @commons-systems/ds, synced via DesignSync to the claude.ai/design canvas)
      as visual aids for the dialectic — rendering competing interpretations and
      edge cases so the author disambiguates by pointing at a variant rather
      than parsing prose. Canvas artifacts are aids to the interview, not
      deliverables: the resolutions they produce land in the node as
      clarifications/conditions like any other, and surviving visual context is
      retained as draft tactic content per the retain-not-refine contract. Known
      caveat: a freshly synced component is absent from the canvas until the
      project is opened/refreshed. Recorded 2026-07-03."
  - question: Drift review checks recorded conditions — what about conditions the
      author never recorded?
    answer: "Drift review is two-sided: it checks that recorded conditions still
      hold, and it sweeps for unrecorded conditions — author circumstances or
      repo facts the round's plans newly depend on that were not considered at
      strategy definition. A material discovery is proposed, never ratified: the
      session writes it as a dated clarification and parks the strategy to
      office_hours for the author to accept into attributes.conditions or
      reject; immaterial observations land as clarifications without
      interrupting the round. Keeps condition substance human-decided (condition
      4). Recorded 2026-07-03 interview."
  - question: Round 1 deferred the /align-init entrypoint by omission — how do
      deferrals stay visible without competing with signal work?
    answer: Round 1 deferred the /align-init entrypoint by omission — how do
      deferrals stay visible without competing with signal work? — See body
      §Pace, Backlog & Attention. Recorded 2026-07-03 interview.
  - question: What happens when a strategy's substance is edited while it has open
      tactics?
    answer: What happens when a strategy's substance is edited while it has open
      tactics? — See body §Fingerprint & Freeze. Recorded 2026-07-03 interview.
  - question: Does the backlog band scale — and does it self-correct when the graph
      changes?
    answer: "(Recorded 2026-07-03 interview; answer REPAIRED 2026-08-05 /align
      interview — the original answer restated the question verbatim and pointed
      at body §Pace, Backlog & Attention, which covers attention weighting and
      the pace curve but not the backlog band this question actually asks about,
      so it carried no answer.) Yes — it scales and self-corrects, because the
      band is declared as a RATIO rather than an absolute count: the open
      machinery-defect population (open plus born-parked tactics serving this
      strategy) stays at or below 35% of all tactics serving this strategy. A
      ratio moves numerator and denominator together, so legitimate filing of
      new tactics cannot trip it; only backlog growing faster than the strategy
      itself does. Consecutive samples are derived from intentions/ git history
      at read time rather than stored, following the body's
      derived-on-read/never-stored doctrine and the existing
      readTacticVelocity/readTokenEconomy precedent that windows off git log.
      See the maintenance-burden condition for the armed band."
  - question: Does per-issue worktree isolation carry over — where does a
      graph-native tactic's worker execute?
    answer: Does per-issue worktree isolation carry over — where does a graph-native
      tactic's worker execute? — See body §Worktree Claiming & Liveness.
      Recorded 2026-07-03.
  - question: Can workers execute nodes concurrently — and what stops two workers
      claiming the same node?
    answer: Can workers execute nodes concurrently — and what stops two workers
      claiming the same node? — See body §Worktree Claiming & Liveness for the
      full mechanism. Recorded 2026-07-03.
  - question: Does the graph-native router keep the legacy pace function — and where
      does its priority override live?
    answer: Does the graph-native router keep the legacy pace function — and where
      does its priority override live? — See body §Pace, Backlog & Attention for
      the full mechanism. Recorded 2026-07-03 interview.
  - question: Before the transitions tactic lands, who advances a graph-native
      tactic's phase on main — how do QA, review, CI-gated fix, and merge
      workers get scheduled?
    answer: Before the transitions tactic lands, who advances a graph-native
      tactic's phase on main — how do QA, review, CI-gated fix, and merge
      workers get scheduled? — See body §Phase Transitions & Fix State for the
      full mechanism. Recorded 2026-07-03 from author review.
  - question: What did the author's branch-protection review find, and what
      mechanism lets intentions/-only commits land on main without a PR?
    answer: What did the author's branch-protection review find, and what mechanism
      lets intentions/-only commits land on main without a PR? — See body
      §Serialization & Commit for the full mechanism. Recorded 2026-07-03.
  - question: Beyond the pace curve (clarification 14), does the legacy router's
      token-optimization machinery carry over to the graph-native router?
    answer: Beyond the pace curve (clarification 14), does the legacy router's
      token-optimization machinery carry over to the graph-native router? — See
      body §Other Settled Mechanism for the full mechanism. Recorded 2026-07-04
      interview.
  - question: Is the fix phase a linear step between implement and qa?
    answer: Is the fix phase a linear step between implement and qa? — See body
      §Phase Transitions & Fix State. Recorded 2026-07-04 from author direction.
  - question: Review findings beyond the tactic's plan — which are fixed in scope,
      which defer, which are ignored, and how do deferrals schedule?
    answer: Review findings beyond the tactic's plan — which are fixed in scope,
      which defer, which are ignored, and how do deferrals schedule? — See body
      §Review & QA Disposition for the full mechanism. Recorded 2026-07-04
      interview.
  - question: Is the qa phase a re-run of the automated checks — and what does a
      bootstrap-emulating session owe it?
    answer: Is the qa phase a re-run of the automated checks — and what does a
      bootstrap-emulating session owe it? — See body §Review & QA Disposition
      for the full mechanism. Recorded 2026-07-04 from author direction.
  - question: Does review-phase parity bind like qa parity — what does an emulating
      session owe the review phase?
    answer: Does review-phase parity bind like qa parity — what does an emulating
      session owe the review phase? — See body §Review & QA Disposition for the
      full mechanism. Recorded 2026-07-04 interview.
  - question: Where does a graph-native tactic's qa needs-main residue — post-merge
      verify-against-prod work — live?
    answer: Where does a graph-native tactic's qa needs-main residue — post-merge
      verify-against-prod work — live? — See body §Phase Transitions & Fix
      State. Recorded 2026-07-04 interview.
  - question: The repo was re-anchored — main checked out at the project root with
      Claude Code managing worktrees natively; do the worktree commitments still
      target the legacy .bare + sibling worktrees/ layout?
    answer: The repo was re-anchored — main checked out at the project root with
      Claude Code managing worktrees natively; do the worktree commitments still
      target the legacy .bare + sibling worktrees/ layout? — See body §Worktree
      Claiming & Liveness for the full mechanism. Recorded 2026-07-05.
  - question: The first emulated router tick ran as a Workflow-tool script — is the
      Workflow primitive a better tick-execution substrate than the legacy shell
      spawn chain?
    answer: The first emulated router tick ran as a Workflow-tool script — is the
      Workflow primitive a better tick-execution substrate than the legacy shell
      spawn chain? — See body §Execution Substrate for the full mechanism.
      Recorded 2026-07-06 interview.
  - question: What keeps the Workflow executor — proprietary, session-bound harness
      machinery — from making the router itself a rented runtime, against
      strategy-owned-orchestration?
    answer: What keeps the Workflow executor — proprietary, session-bound harness
      machinery — from making the router itself a rented runtime, against
      strategy-owned-orchestration? — See body §Execution Substrate for the full
      mechanism. Recorded 2026-07-06 interview.
  - question: What keeps the graph's tactics aligned with the greenfield target —
      what prevents accumulating work on code the critical path deletes?
    answer: What keeps the graph's tactics aligned with the greenfield target — what
      prevents accumulating work on code the critical path deletes? — See body
      §Other Settled Mechanism for the full mechanism. Recorded 2026-07-06
      interview.
  - question: Which strategy does a bug or improvement tactic serve — and are
      'nearest fit' placements acceptable?
    answer: "serves names the strategy that owns the changed artifact — never a
      nearest-fit force-fit. A genuinely cross-cutting subject (shared packages
      load-bearing for several strategies' artifacts) records an honest
      multi-entry serves array. When no strategy owns the artifact, the session
      surfaces the gap — an office_hours park or a proposed /align-strategy
      round — rather than force-fitting. Draft residue follows the same rule, so
      each strategy's /align-tactics round finds its own drafts. First
      application this round: three print reader tactics re-pointed
      recover-knowledge → recover-attention (print is recover-attention's named
      artifact), tactic-analytics-vitals-delivery re-pointed attention-surface →
      promote-progressive-detachment (the surface renders signals it does not
      own; the GA4/vitals channel belongs to the adoption-signal owner), and the
      mixed low-severity sweep split into per-owning-strategy draft sweeps.
      Recorded 2026-07-06 interview."
  - question: Is the graph also the bug tracker — where do small mechanical defects live?
    answer: "The intentions/ graph is the sole source-of-truth issue tracker, bug
      tracker included. Every defect worth fixing is recorded as a tactic or a
      unit of an existing one, however small — smallness is handled by folding
      into a sibling tactic or a per-strategy draft sweep, never by not
      recording. No side channels: no new gh issues (condition 1, absolute
      post-drain), no ad-hoc lists or design docs, and code TODO comments are
      pointer-only — TODO(tactic-<id>) citing the node that holds the substance;
      a substantive TODO with no node is a review-phase finding. Recorded
      2026-07-06 interview."
  - question: Two human-invoked align sessions ran concurrently in the shared
      checkout during the 2026-07-06 doctrine round — is the target router safe
      for this concurrency, and what closes the gaps?
    answer: Two human-invoked align sessions ran concurrently in the shared checkout
      during the 2026-07-06 doctrine round — is the target router safe for this
      concurrency, and what closes the gaps? — See body §Worktree Claiming &
      Liveness for the full mechanism. Recorded 2026-07-06.
  - question: Does the legacy office-hours entry's attach-to-parking-session
      behavior carry over — how does a human engage a parked node?
    answer: Does the legacy office-hours entry's attach-to-parking-session behavior
      carry over — how does a human engage a parked node? — See body §Recovery &
      Session Lifecycle. Recorded 2026-07-06 interview.
  - question: Bootstrap rounds run /align-tactics in the same session as the
      /align-strategy edit — is that same-session context load-bearing?
    answer: Bootstrap rounds run /align-tactics in the same session as the
      /align-strategy edit — is that same-session context load-bearing? — See
      body §Recovery & Session Lifecycle for the full mechanism. Recorded
      2026-07-06 from author direction.
  - question: Repeated /align-tactics rounds kept re-refining the same
      doctrine-encoding tactic (tactic-align-skills-greenfield-gate, four
      touches on 2026-07-06) — one-off or process defect, and what is the
      completeness bar for an amendment?
    answer: "Systemic, two defects — the strategy substance legitimately changing
      three times in one day is the soft-freeze loop working, but each amendment
      being incomplete is not. (1) Amendment completeness: when a re-evaluation
      amends an open tactic, the entire node — statement, rationale, context,
      every unit, and verification — is reconciled against the full current
      strategy substance in that same round; a one-bullet delta that leaves
      sibling sections contradicting the amendment is an incomplete amendment,
      the same defect class as an incomplete record (condition 7). (2)
      Enumeration honesty: keyword grep over open tactics is a shortlisting
      heuristic only — disposition of each open child requires a full-body
      re-read, because doctrine-encoding tactics depend on strategy text they
      never keyword-match. A mechanical floor backs the doctrine: the validate
      gate gains a plan-schema body lint on phase-set tactics and a census
      script replaces the hand-run classification greps
      (tactic-align-tactics-mechanical-floor); the skill-text encoding is homed
      in tactic-align-skills-greenfield-gate. Recorded 2026-07-06 from author
      direction."
  - question: Is 'select all eligible, cap concurrent per workflow' safe under
      overlapping ticks — and where does the concurrency cap bind?
    answer: Is 'select all eligible, cap concurrent per workflow' safe under
      overlapping ticks — and where does the concurrency cap bind? — See body
      §Pace, Backlog & Attention. Recorded 2026-07-06.
  - question: A selected node’s scope or state changes after selection — before its
      worker starts, or while it runs. What closes the window?
    answer: A selected node’s scope or state changes after selection — before its
      worker starts, or while it runs. What closes the window? — See body
      §Fingerprint & Freeze. Recorded 2026-07-06 interview.
  - question: Does long-horizon graph work keep a workflow or session alive?
    answer: Does long-horizon graph work keep a workflow or session alive? — See
      body §Execution Substrate for the full mechanism. Recorded 2026-07-06
      interview.
  - question: A tactic-only scope edit lands mid-review, or between review-pass and
      merge — the mid-flight-edit rule lets the transition write stand, so the
      PR merges against pre-edit scope. Is that window acceptable?
    answer: A tactic-only scope edit lands mid-review, or between review-pass and
      merge — the mid-flight-edit rule lets the transition write stand, so the
      PR merges against pre-edit scope. Is that window acceptable? — See body
      §Fingerprint & Freeze. Recorded 2026-07-06 interview.
  - question: A worker session dies mid-phase (API error, session limit, system
      failure) while graph state and worktree survive — is the session state
      worth recovering, by workflow-session resume or by transcript
      reconstruction (the legacy recover-api-error pattern)?
    answer: A worker session dies mid-phase (API error, session limit, system
      failure) while graph state and worktree survive — is the session state
      worth recovering, by workflow-session resume or by transcript
      reconstruction (the legacy recover-api-error pattern)? — See body
      §Recovery & Session Lifecycle for the full mechanism. Recorded 2026-07-06
      interview.
  - question: Clarification 32's amendment-completeness bar names re-evaluation
      amendments of tactics. Does the same bar bind /align-strategy edits to
      strategy nodes?
    answer: "Yes — the bar widens to any node amendment in any align skill. An
      /align-strategy edit round reconciles the edited strategy's entire node —
      statement, rationale, conditions, signal, and any clarification the edit
      touches or contradicts — against the interview's full outcome in the same
      round; landing one new clarification while sibling fields still contradict
      it is the same incomplete-amendment defect clarification 32 names for
      tactics. The interview's live author presence reduces but does not remove
      the risk: the record, not the session, is the carrier (condition 7).
      Skill-text encoding is homed in tactic-align-skills-greenfield-gate Unit
      1; the mechanical enumeration and lint support (strategy census,
      provenance lint) in tactic-align-tactics-mechanical-floor. Recorded
      2026-07-06 /align-strategy skill-evaluation round."
  - question: The scope-fingerprint gate re-runs only the phase that was in flight —
      implement and qa completed against pre-edit scope never re-run. Does a
      scope edit (direct, or via a cascading strategy re-evaluation) force all
      three of implement/qa/review to execute with the latest scope — and when a
      phase routes back, is it clear from graph state what changed?
    answer: The scope-fingerprint gate re-runs only the phase that was in flight —
      implement and qa completed against pre-edit scope never re-run. Does a
      scope edit (direct, or via a cascading strategy re-evaluation) force all
      three of implement/qa/review to execute with the latest scope — and when a
      phase routes back, is it clear from graph state what changed? — See body
      §Fingerprint & Freeze for the full mechanism. Recorded 2026-07-06
      interview.
  - question: What guards the router against failure loops — a worker that
      repeatedly fails to make progress or park on a node, and a systemic
      executor failure (a daemon crash-loop) that would otherwise false-trip a
      per-node fuse across every selectable node?
    answer: What guards the router against failure loops — a worker that repeatedly
      fails to make progress or park on a node, and a systemic executor failure
      (a daemon crash-loop) that would otherwise false-trip a per-node fuse
      across every selectable node? — See body §Recovery & Session Lifecycle for
      the full mechanism. Recorded 2026-07-07 interview.
  - question: Self-modifying tactics — scope touching agent-behavior config
      (.claude/skills/**, .claude/hooks/**, settings) — cannot be committed by
      auto-mode workers. Is self-modification a supported greenfield use case,
      and how does it flow?
    answer: Self-modifying tactics — scope touching agent-behavior config
      (.claude/skills/**, .claude/hooks/**, settings) — cannot be committed by
      auto-mode workers. Is self-modification a supported greenfield use case,
      and how does it flow? — See body §Other Settled Mechanism for the full
      mechanism. Recorded 2026-07-07 interview.
  - question: The interactive align skills read the graph before acting — what
      guarantees they read the latest graph, not a stale local checkout?
    answer: The interactive align skills read the graph before acting — what
      guarantees they read the latest graph, not a stale local checkout? — See
      body §Other Settled Mechanism for the full mechanism. Recorded 2026-07-08
      interview.
  - question: Do node-assigned sessions receive the node's ancestry — the decision
      context above it — or only the node itself?
    answer: Do node-assigned sessions receive the node's ancestry — the decision
      context above it — or only the node itself? — See body §Other Settled
      Mechanism for the full mechanism. Recorded 2026-07-08 interview.
  - question: Chart, dashboard, and data-visualization requirements under-specify in
      prose the same way general UI does (clarification 7) — is the
      design-canvas dialectic enough, or do they need their own design-guidance
      source?
    answer: "Not enough — chart, dashboard, and data-visualization requirements are
      gathered under the /dataviz built-in skill, binding the align family.
      Extending clarification 7: whenever an /align-strategy interview or an
      /align-tactics decomposition develops a requirement for any data
      visualization — chart, graph, plot, dashboard, stat tile/KPI, sparkline,
      heatmap, or the choice of whether to visualize at all — the session loads
      /dataviz and its procedure governs the recorded design: form chosen by the
      data's job (including /dataviz's 'is it even a chart' test, where a hero
      number or stat tile is a valid answer), color assigned by role
      (categorical/sequential/diverging/status) never by rank, the categorical
      palette validated by scripts/validate_palette.js and never eyeballed, mark
      specs and spacers, a default hover layer, and the accessibility pass (a
      legend for ≥2 series, a table view, a selected — not auto-flipped — dark
      mode). /dataviz and the design canvas compose, they do not compete:
      /dataviz supplies the design method and its computable checks; the design
      canvas (clarification 7) still supplies the author-disambiguation
      artifacts — mockups/variants built on @commons-systems/ds, now built to
      follow /dataviz — synced via DesignSync so the author disambiguates by
      pointing at a variant. The retain-not-refine split (clarification 6)
      governs where output lands: /align-strategy records the author's chart
      design intent as clarifications/conditions, /align-tactics carries the
      concrete per-unit chart guidance (chosen forms, the validated palette,
      mark and interaction specs) in tactic plan/draft bodies, and the implement
      and review phases execute and check against /dataviz downstream. Capture
      note: /dataviz is a rented Anthropic built-in, so this leans further on
      delegation-anthropic-claude — but its guidance is design-system-agnostic
      and its reference files (palette.md, the validator) are forkable content
      that can be vendored into the repo, so the capture is bounded and no
      recovers edge is added, consistent with the Workflow-executor lean-in
      (clarification 25). Skill-text wiring is retained as draft
      tactic-align-skills-dataviz-guidance. Recorded 2026-07-08 /align-strategy
      interview."
  - question: What is the single interactive entry point to the persistent layer —
      and what happens to /align-strategy and /align-init?
    answer: What is the single interactive entry point to the persistent layer — and
      what happens to /align-strategy and /align-init? — See body §Other Settled
      Mechanism. Recorded 2026-07-09 interview.
  - question: A mechanical integrity gate (test-integrity) fires on a legitimate
      removal — the check is red by design and can never go green, so the node
      can neither clear fix nor reach merge. What is the supported workflow?
    answer: A mechanical integrity gate (test-integrity) fires on a legitimate
      removal — the check is red by design and can never go green, so the node
      can neither clear fix nor reach merge. What is the supported workflow? —
      See body §Other Settled Mechanism for the full mechanism. Recorded
      2026-07-10 interview.
  - question: Auto-merge arming is human-authorized, yet a tick +3 Workflow launch
      was denied by the auto-mode classifier — what does the launch layer owe
      arming instructions in worker prompts?
    answer: Auto-merge arming is human-authorized, yet a tick +3 Workflow launch was
      denied by the auto-mode classifier — what does the launch layer owe arming
      instructions in worker prompts? — See body §Other Settled Mechanism for
      the full mechanism. Recorded 2026-07-10 interview.
  - question: Emulated implement→qa transitions repeatedly land phase:qa with
      execution.pr null while an open draft PR exists — is the PR stamp at the
      implement→qa write load-bearing?
    answer: Emulated implement→qa transitions repeatedly land phase:qa with
      execution.pr null while an open draft PR exists — is the PR stamp at the
      implement→qa write load-bearing? — See body §Phase Transitions & Fix State
      for the full mechanism. Recorded 2026-07-10 interview.
  - question: Does explicit human dispatch of a single node override the pace curve,
      and does the graph lane have an entrypoint for it?
    answer: Does explicit human dispatch of a single node override the pace curve,
      and does the graph lane have an entrypoint for it? — See body §Pace,
      Backlog & Attention. Recorded 2026-07-11 interview.
  - question: A phase whose own logic is a workflow (/review-fix, /qa-fix) cannot
      run as the tick's nested agent() — how does the router launch such a
      phase?
    answer: A phase whose own logic is a workflow (/review-fix, /qa-fix) cannot run
      as the tick's nested agent() — how does the router launch such a phase? —
      See body §Execution Substrate for the full mechanism. Recorded 2026-07-11
      interview.
  - question: Does the review phase re-wrap /code-review as a findings-only finder,
      or trust the review skills' own built-in review-and-fix?
    answer: Does the review phase re-wrap /code-review as a findings-only finder, or
      trust the review skills' own built-in review-and-fix? — See body §Review &
      QA Disposition for the full mechanism. Recorded 2026-07-11 interview.
  - question: Frozen (undecomposed or soft-frozen) tactics carry a ranking — are
      they selectable, and what runs when the dispatch script picks one?
    answer: Frozen (undecomposed or soft-frozen) tactics carry a ranking — are they
      selectable, and what runs when the dispatch script picks one? — See body
      §Phase Transitions & Fix State. Recorded 2026-07-11 interview.
  - question: After a phase completes cleanly (no variance/escalation), who
      validates CI and who advances the node — and does the post-review merge
      need author intervention?
    answer: After a phase completes cleanly (no variance/escalation), who validates
      CI and who advances the node — and does the post-review merge need author
      intervention? — See body §Phase Transitions & Fix State for the full
      mechanism. Recorded 2026-07-11 interview.
  - question: What replaces the dispatch:main-broken gh-issue latch when origin/main
      goes red — and does the announcement surface stay gh-based?
    answer: What replaces the dispatch:main-broken gh-issue latch when origin/main
      goes red — and does the announcement surface stay gh-based? — See body
      §Other Settled Mechanism for the full mechanism. Recorded 2026-07-12
      interview.
  - question: "The 2026-07-12 red-main episode: dispatch-diagnose-main found repo
      issues disabled and re-enabled has_issues to satisfy its own gh-issue spec
      — what does it teach?"
    answer: The legacy drain state is a ratchet, and a legacy skill spec is never
      license to unwind it. The drain proof included issues-disabled; the
      diagnose job re-enabling the feature (then filing the latch issue)
      regressed that proof and violated the existing condition that no new work
      enters via gh. Recorded as a standing drain-state-monotonicity condition
      alongside this clarification; the graph-native self-heal flow (same-date
      clarification) removes the spec pressure that caused the deviation.
      Recorded 2026-07-12 interview.
  - question: How is resolution work for a failing signal ranked — does each signal
      carry ranking configuration?
    answer: How is resolution work for a failing signal ranked — does each signal
      carry ranking configuration? — See body §Pace, Backlog & Attention for the
      full mechanism. Recorded 2026-07-13 interview (author-dictated).
  - question: May standing graph structure — a signal owner, a standing boost
      carrier — live on a tactic?
    answer: "No. Tactics are transient by definition; persistent structure lives on
      strategy (or virtue) nodes. This is why the main-health signal home is
      strategy-main-health rather than the auto-created fix tactic or a standing
      tactic: the fix tactic exists only per episode, and a standing tactic
      would put permanent structure on a transient kind. The constraint is to be
      encoded into the align-strategy skill itself so it stays visible whenever
      the persistent layer is modified (draft
      tactic-align-persistent-layer-doctrine). Recorded 2026-07-13 interview
      (author-dictated)."
  - question: When two sessions contend on the same node, must the author serialize
      the edits manually?
    answer: When two sessions contend on the same node, must the author serialize
      the edits manually? — See body §Serialization & Commit for the full
      mechanism. Recorded 2026-07-13 interview.
  - question: Clarification 19 disposes review findings by verification × contract
      alone — every confirmed out-of-contract finding defers to a draft tactic.
      Does the cost of the fix versus the cost of deferring it also bear on the
      disposition?
    answer: Clarification 19 disposes review findings by verification × contract
      alone — every confirmed out-of-contract finding defers to a draft tactic.
      Does the cost of the fix versus the cost of deferring it also bear on the
      disposition? — See body §Review & QA Disposition for the full mechanism.
      Recorded 2026-07-13 interview.
  - question: After a node worker terminates, is its session removed from the agents
      list — and does an escalation-parked session stay for the author to
      engage?
    answer: After a node worker terminates, is its session removed from the agents
      list — and does an escalation-parked session stay for the author to
      engage? — See body §Recovery & Session Lifecycle for the full mechanism.
      Recorded 2026-07-16 interview.
  - question: "A strategy whose signal is validated only by human work (sensor:
      owner review at office-hours) is re-selected for /align-tactics every tick
      — its rounds produce off-path tooling plus born-parked on-path reading
      chunks, never a claude-executable on-path tactic, so the coverage gate
      never trips and clarification 3's fresh-reading gate never fires. Why, and
      what is the fix?"
    answer: "A strategy whose signal is validated only by human work (sensor: owner
      review at office-hours) is re-selected for /align-tactics every tick — its
      rounds produce off-path tooling plus born-parked on-path reading chunks,
      never a claude-executable on-path tactic, so the coverage gate never trips
      and clarification 3's fresh-reading gate never fires. Why, and what is the
      fix? — See body §Phase Transitions & Fix State for the full mechanism.
      Recorded 2026-07-16 interview."
  - question: A tick performs scriptable non-worker work (e.g. a scope-stale demote)
      and then ends having launched no worker — a SPAWN_N slot spent on a
      metadata write. What is a tick's completion contract when scriptable work
      and worker spawning would compete?
    answer: A tick performs scriptable non-worker work (e.g. a scope-stale demote)
      and then ends having launched no worker — a SPAWN_N slot spent on a
      metadata write. What is a tick's completion contract when scriptable work
      and worker spawning would compete? — See body §Execution Substrate for the
      full mechanism. Recorded 2026-07-16 interview.
  - question: "Now that GitHub Issues are disabled repo-wide (has_issues: false),
      how does fix-checks track a CI flake and gate the source tactic on the
      fix, on the node lane?"
    answer: '"Now that GitHub Issues are disabled repo-wide (has_issues: false), how
      does fix-checks track a CI flake and gate the source tactic on the fix, on
      the node lane?" — See body §Other Settled Mechanism for the full
      mechanism. Recorded 2026-07-16 interview.'
  - question: "A node's `reviewed` marker is written but its PR is not yet merged
      (it sits at `phase: review` awaiting the tick's merge) — does the selector
      keep dispatching a review worker to it, and what is its remaining
      lifecycle?"
    answer: "A node's `reviewed` marker is written but its PR is not yet merged (it
      sits at `phase: review` awaiting the tick's merge) — does the selector
      keep dispatching a review worker to it, and what is its remaining
      lifecycle? — See body §Phase Transitions & Fix State. Recorded 2026-07-18
      interview."
  - question: An office-hours drain session fixed a parked node and pushed the fix,
      but the office_hours park was left set — the node was even re-parked
      before a later session finally cleared it
      (tactic-phase-standup-audit-lens, 2026-07). Clarification 4 says a park
      clears as a side effect of "any interactive-session commit touching the
      node." Why didn't that fire for the drain lane, and what must a drain
      session do at termination?
    answer: An office-hours drain session fixed a parked node and pushed the fix,
      but the office_hours park was left set — the node was even re-parked
      before a later session finally cleared it
      (tactic-phase-standup-audit-lens, 2026-07). Clarification 4 says a park
      clears as a side effect of "any interactive-session commit touching the
      node." Why didn't that fire for the drain lane, and what must a drain
      session do at termination? — See body §Recovery & Session Lifecycle for
      the full mechanism. Recorded 2026-07-18 interview.
  - question: How is the CI-fix interrupt modeled — as a `phase` enum value or as
      orthogonal execution state — and what is the migration off the phase-value
      encoding?
    answer: How is the CI-fix interrupt modeled — as a `phase` enum value or as
      orthogonal execution state — and what is the migration off the phase-value
      encoding? — See body §Phase Transitions & Fix State for the full
      mechanism. Recorded 2026-07-18 /align-strategy interview.
  - question: The dispatch phase-worker skills carry ad-hoc names (/align-tactics,
      /implement, /fix-checks, /qa-fix, /review-fix, /qa-main, /fix-conflicts) —
      what naming convention should they take, and how does renaming
      /align-tactics reconcile with its align-family membership (clarification
      45)?
    answer: The dispatch phase-worker skills carry ad-hoc names (/align-tactics,
      /implement, /fix-checks, /qa-fix, /review-fix, /qa-main, /fix-conflicts) —
      what naming convention should they take, and how does renaming
      /align-tactics reconcile with its align-family membership (clarification
      45)? — See body §Other Settled Mechanism for the full mechanism. Recorded
      2026-07-18 interview.
  - question: How do the dispatch phase skills receive their input — today they
      infer the target from the worktree branch name, and only /align-tactics
      takes an explicit node-id argument?
    answer: How do the dispatch phase skills receive their input — today they infer
      the target from the worktree branch name, and only /align-tactics takes an
      explicit node-id argument? — See body §Other Settled Mechanism for the
      full mechanism. Recorded 2026-07-18 interview.
  - question: These naming and interface requirements are legitimate but low
      priority — how does the graph record such a greenfield requirement at low
      rank so it never interferes with higher-ranked work, and is a structural
      improvement needed?
    answer: "As a backlog tactic (clarification 9): a fully-planned, selectable
      tactic marked with the backlog flag /align-tactics stamps at
      decomposition, off-path because it carries no validates edge to an
      unvalidated signal, so calculated attention resolves it one rank tier
      below every round tactic (clarification 11) and self-corrects upward only
      if a future signal's path later includes the component. Off-path demotion
      guarantees such a tactic never PREEMPTS higher-ranked work — the router
      selects it only as slack, when nothing higher-ranked remains — which is
      exactly the recorded, low-rank, non-interfering tracking the author asked
      for; it is the graph-native analog of the enhancement label. Structural
      assessment (the author asked to recommend improvements if required): NONE
      required — the existing backlog-tactic plus off-path-demotion mechanism is
      the structural support. This round's dispatch-rename, input-contract, and
      conflict tactics are recorded as draft byproducts here and finalize as
      backlog tactics. Recorded 2026-07-18 interview. (Companion 2026-07-18:
      off-path demotion covers the recorded requirement’s own rank; the freeze
      tax of the recording edit itself — every stamped child paying a
      re-evaluation session even for an orthogonal edit — is addressed
      separately by the materiality-scoped-freeze clarification.)"
  - question: A strategy edit soft-freezes every stamped open child regardless of
      relevance or rank (a low-rank edit such as the 2026-07-18 skill-rename
      round stales every stamped in-flight child) — should the freeze decision
      incorporate a rank comparison, and how does a stale child recover WHAT
      changed when the stamp is a bare hash?
    answer: A strategy edit soft-freezes every stamped open child regardless of
      relevance or rank (a low-rank edit such as the 2026-07-18 skill-rename
      round stales every stamped in-flight child) — should the freeze decision
      incorporate a rank comparison, and how does a stale child recover WHAT
      changed when the stamp is a bare hash? — See body §Fingerprint & Freeze
      for the full mechanism. Recorded 2026-07-18 /align-strategy interview.
  - question: Does the graph need first-class structure for sequencing brownfield
      migrations of backwards-incompatible changes, and how do in-flight tactics
      link to a migration that must land before their work?
    answer: Does the graph need first-class structure for sequencing brownfield
      migrations of backwards-incompatible changes, and how do in-flight tactics
      link to a migration that must land before their work? — See body §Other
      Settled Mechanism for the full mechanism. Recorded 2026-07-18 interview.
  - question: Does dispatch's concurrency dedup key on live sessions or worktree
      existence, and does the office-hours lane share the mechanism
      (office-hours sessions safe for concurrent selection)?
    answer: Does dispatch's concurrency dedup key on live sessions or worktree
      existence, and does the office-hours lane share the mechanism
      (office-hours sessions safe for concurrent selection)? — See body
      §Worktree Claiming & Liveness for the full mechanism. Recorded 2026-07-18.
  - question: A scope-inert align annotation on an in-flight tactic's body — the
      reconciliation notes amendment-completeness mandates — trips the tactic
      scope-custody gate and demotes the whole ladder. Does materiality-scoping
      extend to the scope-custody stamp, and by what mechanism?
    answer: A scope-inert align annotation on an in-flight tactic's body — the
      reconciliation notes amendment-completeness mandates — trips the tactic
      scope-custody gate and demotes the whole ladder. Does materiality-scoping
      extend to the scope-custody stamp, and by what mechanism? — See body
      §Fingerprint & Freeze for the full mechanism. Recorded 2026-07-18
      interview.
  - question: What provenance convention binds clarifications[].answer — the
      trailing Recorded-sentence the align SKILL.md docs prescribe, or the
      dated-clause convention the corpus and readingDate() implement?
    answer: "(Recorded 2026-07-18 /align-strategy interview.) Ratified greenfield:
      every clarifications[].answer carries a dated provenance clause — an event
      verb plus ISO date — placed where it reads best; front-loaded
      parenthetical preferred, verb open (Recorded / Amended / Reviewed /
      adopted...). The newest ISO date anywhere in the answer is its effective
      date — the readingDate() contract (packages/intentionsutil/src/router.ts)
      that coverage.ts's lastReviewedOf depends on — and amendments add a new
      dated clause rather than rewriting the old one. Grounds, author-endorsed
      (not held on trust): position-dependence is wrong under amendment (an
      amended answer necessarily carries two or more dates, so 'the trailing
      sentence' stops being well-defined); the verb is semantic, dating
      different event kinds; an answer's last sentence should be its substantive
      conclusion, not boilerplate; and 'a dated clause anywhere' is exactly the
      contract the machine consumers read. Steelman (trailing-sentence
      uniformity for mechanical hand-auditing): DIVERGED — amendment breaks
      terminal placement anyway, and a front-loaded parenthetical is at least as
      scannable. Migration: edit the two align-skill doctrine passages
      (.claude/skills/align-strategy/SKILL.md and
      .claude/skills/align-tactics/SKILL.md) as part of
      tactic-align-provenance-lint-doctrine's implementation; zero corpus
      rewrites (the 27 goal-layer answers and all tactic-lane answers already
      comply with the loosened rule); no grandfather clause; the enforcing lint
      checks the loosened rule corpus-wide. This ratification discharges that
      tactic's office_hours gate, unparked in the same commit."
  - question: Why did the 2026-07-18 selector ticks dispatch /align-tactics
      re-evaluation onto subtree children with no planning work to do, and do
      the recorded freeze-improvement requirements fix it?
    answer: Why did the 2026-07-18 selector ticks dispatch /align-tactics
      re-evaluation onto subtree children with no planning work to do, and do
      the recorded freeze-improvement requirements fix it? — See body
      §Fingerprint & Freeze for the full mechanism. Recorded 2026-07-18
      /align-strategy interview.
  - question: Does a deliberate human dispatch — the bare /dispatch fan-out picking
      the highest-ranking available node, or an explicit dispatch <node-id> —
      bypass the absolute max_concurrent_workers ceiling, or only the pace
      curve?
    answer: Does a deliberate human dispatch — the bare /dispatch fan-out picking
      the highest-ranking available node, or an explicit dispatch <node-id> —
      bypass the absolute max_concurrent_workers ceiling, or only the pace
      curve? — See body §Pace, Backlog & Attention for the full mechanism.
      Recorded 2026-07-18 interview.
  - question: When a phase skill delegates a unit to a subagent (the main thread
      never edits files), what guarantees the subagent's writes land in the
      launching worktree rather than the primary checkout?
    answer: When a phase skill delegates a unit to a subagent (the main thread never
      edits files), what guarantees the subagent's writes land in the launching
      worktree rather than the primary checkout? — See body §Worktree Claiming &
      Liveness for the full mechanism. Recorded 2026-07-19.
  - question: Clarification 58 (2026-07-13) retained its 5-layer resolution ladder
      in tactic-graph-commit-auto-serialization as an in-script graph-commit
      upgrade, and clarification 67 (2026-07-18) retained
      tactic-dispatch-conflict-greenfield as a model-driven skill for the same
      conflict upgrade without referencing the earlier draft — which vehicle
      owns which ladder layer?
    answer: Clarification 58 (2026-07-13) retained its 5-layer resolution ladder in
      tactic-graph-commit-auto-serialization as an in-script graph-commit
      upgrade, and clarification 67 (2026-07-18) retained
      tactic-dispatch-conflict-greenfield as a model-driven skill for the same
      conflict upgrade without referencing the earlier draft — which vehicle
      owns which ladder layer? — See body §Serialization & Commit for the full
      mechanism. Recorded 2026-07-19 /align-strategy round.
  - question: Should auto-close of a completed worker session be configurable, given
      the 2026-07-16 reaping clarification reaps on every terminal exit and
      diverged from the session-as-observability rival?
    answer: "Yes — auto-close is made configurable via a default-off operator escape
      hatch, and this does NOT weaken the reaping doctrine. Auto-close (reap on
      every terminal exit) remains the DEFAULT and the doctrinal expression of
      disposable sessions; the toggle, off by default, lets an operator KEEP a
      completed or escalation-parked worker session for local
      inspection/debugging. The doctrine holds because its actual concern —
      established by the disposable-session clarification and the 2026-07-16
      reaping clarification's divergence from the session-as-observability rival
      — is that session persistence must never become router SUBSTRATE or the
      observability CHANNEL, not the bare existence of a lingering session; the
      author affirmed this reading of the divergence's intent this round. A
      human-flipped, default-off debug knob never makes session persistence the
      router's recovery substrate and never changes where escalations surface
      (still the office-hours PARKED panel, which reads the node's office_hours
      field), so it is orthogonal to the coupling the doctrine rejects. Edge
      cases resolved this round: (a) the switch is symmetric — when ON it
      suppresses the reap on BOTH clean-advance and escalation-park; when OFF
      (default) both reap as before; (b) the check lives in the shared
      self-close primitive (dispatch-self-close), so both the legacy gh
      issue-worker lane and the graph-native node-worker lane honor one config
      point; (c) the foreground-safe gate is unchanged — only managed background
      worker jobs are affected, interactive align/office-hours sessions
      (CLAUDE_JOB_DIR-gated) are never touched; (d) documented consequence,
      endorsed: a kept-alive session keeps worktree_has_live_session TRUE, so
      its node-id worktree claim stays held and the router will NOT select that
      node's next phase until the operator manually reaps it — this is inherent
      to a debug hold, and leaving the knob ON stalls the affected nodes
      (caution recorded). Implementation retained as draft
      tactic-worker-self-close-configurable. Recorded 2026-07-19 interview.
      (Amended 2026-07-19 (reap-scope narrowing): the premise 'reap on every
      terminal exit remains the DEFAULT' is superseded — the default is now
      'reap iff the exit transitioned or parked the node'. This toggle is
      unchanged in mechanism but re-scoped: when OFF (default),
      transitioned/parked sessions reap and every other terminal exit is
      kept-for-debug; when ON, the transitioned/parked sessions are ALSO kept.
      Both the narrowed-default transition-or-park check and this keep-all
      toggle live in the shared self-close primitive. See the 2026-07-19
      reap-scope-narrowing clarification.) (Amended 2026-07-29: the narrowed
      default this entry describes — 'reap iff the exit transitioned or parked
      the node' — is restated as 'reap iff the pass DECLARED a terminal
      disposition'; see the 2026-07-29 declared-vs-undeclared clarification. The
      keep-all toggle is unchanged in mechanism and still layers on top of the
      default, whatever the default's discriminator.)"
  - question: "graph-commit rebase-retry exhaustion: does the 2026-07-13 rejection
      of pessimistic serialization forbid serializing the landing step, and what
      is the resolution — a better serialization method or a higher retry
      limit?"
    answer: "Neither doctrine-violation nor retry-limit. The 2026-07-13
      clarification (58) rejected pessimistic mutual exclusion for same-node
      EDIT contention, resolved by the merge ladder (partitioned by
      clarification 78 between tactic-graph-commit-auto-serialization layers 1-3
      and tactic-dispatch-conflict-greenfield layers 4-5); it does not govern
      LANDING contention — unrelated nodes racing for the single linear main
      ref. There, git's server-side ref update is already an atomic
      compare-and-swap (integrity is never at risk; the losing push is refused
      whole), but CAS is optimistic concurrency and its redo cost here is
      dominated by the stamp: branch protection requires the four checks green
      on the exact SHA, so every retry re-buys pull --rebase → new SHA →
      scratch-branch force-push → await_checks (30-180s of CI), and the
      vulnerability window is the entire stamp duration — under fleet load
      MAX_PUSH_ATTEMPTS=5 exhausts with zero progress (observed three times,
      2026-07-19). Author-ratified resolution, per the design-proposals rule
      (greenfield first, migration separate): (a) GREENFIELD — the graph lands
      on its own ref with a validate-only gate (tactic-graph-ref-split): retries
      then cost milliseconds and native CAS optimistic retry suffices with no
      lock anywhere, harmonizing the anti-serialization doctrine system-wide;
      (b) INTERIM — graph-commit serializes only the rebase→stamp→push critical
      section behind a lock ref claimed by atomic CAS ref-update, with a
      TTL/steal-after-expiry stale-lock story
      (tactic-graph-commit-landing-lock), explicitly deleted when the ref split
      lands — the lock protects the stamp investment, not ref atomicity, and
      cooperating writers queue instead of burning stamps. Raising
      GRAPH_COMMIT_MAX_ATTEMPTS was considered and rejected as the primary fix:
      it converts exhaustion into more wasted CI stamps without shrinking the
      collision window (kept only as an env-var stopgap). Boldness recorded: the
      cost-structure analysis is verified in-session against graph-commit and
      three live exhaustions; the git-CAS semantics, merge-queue comparison
      (rejected: a PR per landing is too heavy for the fleet's write rate and
      rate-limit budget), and ref-split CAS-sufficiency claim are
      Claude-internal design reasoning the author has not independently
      verified. Recorded 2026-07-19 interview."
  - question: The redundancy/stale-selection start-gate (check-node-selection.ts) is
      wired only inside provision-node-worktree. Do phase skills entered by the
      other Step-0 paths (native EnterWorktree, re-entry of an existing
      worktree) still get the mechanical gate?
    answer: "No — they fall back to prose reasoning, a real gap. The mechanical
      selection-validity gate (check-node-selection.ts, exit 12 stale-selection
      / exit 13 scope-stale) runs only from provision-node-worktree:87. The
      phase-skill Step-0 alternate entry paths — native EnterWorktree, or
      re-entry of an already-existing worktree — run only assert-worktree-fresh
      (a freshness check), never check-node-selection. So a phase skill entered
      those ways detects a redundant or terminal-state selection only through
      the skill body's prose Idempotency reasoning, an LLM judgment gate rather
      than a mechanical one. This burned a full session on 2026-07-18:
      /align-tactics tactic-graph-main-self-heal was re-invoked manually against
      an already-finalized node (phase:implement, execution:null); because the
      session was already inside the worktree (re-entry, no
      provision-node-worktree re-run), the mechanical gate never fired and the
      no-op was caught only by prose reasoning. Requirement: the mechanical
      selection-validity gate must bind EVERY phase-skill entry, not just the
      fresh-cut provision path — run check-node-selection at entry regardless of
      how the worktree was provisioned, exiting cheaply (skipped) on a
      redundant/stale/terminal-state selection before any Explore/Plan fan-out
      or session-boot work. Steelman considered and DIVERGED from: fix redundant
      dispatch only at the selection SOURCE (the selector never emits a
      terminal-state candidate — tactic-freeze-resurface-stale-children-only PR
      #2895, tactic-materiality-scoped-freeze PR #2892). Rejected as sufficient
      because a MANUAL human invocation (/align-tactics tactic-X typed directly)
      has no selector to gate it; the entry gate is the only possible guard for
      that path, so selection-source fixes and the entry gate are complementary
      layers, not alternatives. Carrier: retained draft
      tactic-phase-entry-selection-gate; may be partly closed by
      tactic-align-skills-latest-graph-guard (PR #2889, not yet on origin/main)
      if its re-entry routing re-runs check-node-selection — the draft tactic's
      first unit verifies that overlap before implementing. Recorded 2026-07-19
      /align-strategy interview."
  - question: The 2026-07-16 reaping clarification reaps a node-worker session on
      EVERY terminal exit, and its edge case (c) reaps a mid-phase-dead
      (crashed) worker's orphaned job via the tick/sweep pass. But a session
      that terminated WITHOUT a clean phase-transition and WITHOUT an
      escalation-park has no durable record anywhere — it was not parked to the
      office-hours queue, so nothing carries its failure context except the live
      session itself. Should auto-close really fire on those exits?
    answer: "No — auto-close (reap) is narrowed to fire ONLY on a clean
      phase-transition or an escalation-park; every OTHER terminal exit — a hard
      crash, an error exit, or a clean-but-no-transition/no-progress exit —
      leaves the worker session KEPT (its job entry AND its node-id worktree
      both held) for local debugging until an operator manually reaps it.
      Rationale: the two clean terminal states each write a durable outcome the
      disposable-session doctrine relies on — a transition advances the node's
      persisted phase, a park writes office_hours into the node — so nothing is
      lost by reaping them. A non-clean terminal exit writes NEITHER: it was not
      parked to office-hours (so it never reaches the PARKED panel, the
      office-hours-debuggable channel) and it did not advance the phase, so the
      live session is the only artifact of the failure. Reaping it would
      silently erase the one thing a debugger has. This DIVERGES from the
      2026-07-16 clarification's edge case (c) (which reaped the crashed job via
      the sweep) and narrows 'reaped on every terminal exit' (its main body, and
      edge case (b)'s
      reap-then-fuse-re-selects-after-a-silent-no-transition-exit) to 'reaped
      iff the exit transitioned or parked the node'. It does NOT re-open the
      session-as-observability coupling the 2026-07-16 clarification rejected: a
      kept failed session is a DEBUGGING ARTIFACT a human inspects, not a
      recovery substrate (session attach/resume is still not a supported
      recovery path — the router never resumes from a kept session; the human
      reaps it and the node re-selects fresh or is fixed forward) and not the
      escalation channel (real escalations still park to office-hours).
      Resolutions this round: (a) SCOPE — reap iff transitioned-or-parked; keep
      every other terminal exit for local debug [author, this round]. (b)
      FREEZE-FOR-DEBUG accepted — a kept session holds worktree_has_live_session
      TRUE, so the router will not re-select the node and the no-progress fuse
      will not count re-selections; the node freezes until manual reap instead
      of auto-retrying. The author accepted this self-heal/throughput loss on
      the failure path explicitly: a failure worth debugging must not be
      silently retried underneath the operator [author chose 'yes — freeze for
      debug', this round]. (c) SURFACING — a minimal operator-visible COUNT of
      held-for-debug sessions (non-transitioned, non-parked terminal exits kept
      alive) surfaces so silent accumulation of frozen nodes is visible; it
      reports only the count of kept-failed jobs, never their content, so it is
      a GC/hygiene metric, not a recovery or escalation channel, and does not
      re-couple observability to session persistence [author chose 'yes —
      minimal count' over 'no new surface', this round]. Retained as draft
      tactic-frozen-session-debug-count. (d) COMPOSITION with the 2026-07-19
      keep-all toggle — the DEFAULT itself narrows to 'reap iff
      transitioned-or-parked' (this amends all three recorded sites: the
      2026-07-16 reaping clarification, the 2026-07-19 configurable-auto-close
      clarification, and the reap condition); the keep-all toggle
      (tactic-worker-self-close-configurable) layers ON TOP — when ON it
      additionally keeps the transitioned/parked sessions the narrowed default
      would otherwise reap; both the transition-or-park check and the toggle
      live in the shared self-close primitive [author chose 'narrow default;
      toggle layers on top', this round]. Materially affected tactics, to be
      re-planned by /align-tactics (not rewritten in this /align-strategy
      round): tactic-graph-node-session-reap — its Unit 2 (sweep-reap of
      mid-phase-dead orphaned jobs) reverses under (a) and must be re-planned
      (Unit 1's Stop-hook reap survives, now gated on transition-or-park); and
      tactic-worker-self-close-configurable's draft framing (which assumes 'reap
      on every terminal exit' is the default) must be re-scoped to the narrowed
      default per (d). Recorded 2026-07-19 interview. (Amended 2026-07-29:
      resolution (a)'s axis — 'reap iff transitioned-or-parked; keep every other
      terminal exit' — is superseded by the declared-vs-undeclared principle;
      see the 2026-07-29 declared-vs-undeclared clarification. The
      keep-for-debug ground, the freeze-for-debug acceptance (b), and the count
      surfacing (c) all carry over unchanged; only the discriminator changes,
      from an enumeration of dispositions to the presence of the node-terminal
      marker. The narrowed axis recorded here is what mis-sorted /qa-fix's
      fix-finalize pass as a keep-for-debug failure exit when it was a completed
      pass that had written four durable artifacts.)"
  - question: A merged PR's green CI had run on a stale base and main went red after
      the merge — does merge eligibility require the PR to be current with main,
      and is the recorded reviewed-marker key the author's 'done marker' intent?
    answer: "(Recorded 2026-07-19 interview, prompted by a stale-base green-CI merge
      producing a red main.) Two resolutions. (1) Signal confirmed: the author's
      'node is done / carries the done marker' merge key IS the recorded one —
      `reviewed` in execution.markers at phase review (clarification 53),
      evolving to a literal pending-merge phase per draft
      tactic-pending-merge-phase; `done` itself stays post-merge, so the gate
      never keys on it. (2) Merge eligibility gains a fourth conjunct beyond
      green CI + MERGEABLE + the reviewed marker: the PR branch must be up to
      date with origin/main, and the passing checks must have run on that
      current base — a green verdict computed on a stale base is not
      merge-eligible. When the PR is behind, the tick reconciler scripts the
      remediation itself: gh api update-branch, skip this tick, merge on a later
      tick once checks pass on the fresh base — every scriptable step of the
      done-phase merge path lives in the dispatch router, never in a phase
      worker or the author. Diverged (2026-07-19) from the GitHub-native
      alternative (branch-protection require-up-to-date plus merge queue): it
      solves stale-base CI but moves merge behavior into GitHub config the graph
      cannot read, deepening delegation-github (which this strategy recovers);
      the owned tick gate keeps merge keyed on graph state. Implementation
      retained as draft tactic-graph-auto-merge-up-to-date-gate, a follow-up to
      tactic-graph-tick-node-lane-auto-merge — PR #2904 lands as-is, and the
      author accepts the interim window in which graph-auto-merge can merge a
      stale-base green PR until the follow-up ships."
  - question: While a reviewed node is pending merge, an update-branch sync can turn
      CI red or the PR CONFLICTING — is the failed check routed to a fix worker
      and the conflict to a conflict worker?
    answer: "(Confirmed 2026-07-19 interview.) Yes, both, via one reconciler —
      tracked and still WIP at confirmation time
      (tactic-graph-review-exclusion-stall-recovery, phase implement). The
      selector's reviewed-marker exclusion means normal selection never re-reads
      a pending-merge node, so that tactic's review-stall reconciler polls the
      stranded PRs directly and fires needsReviewStallRecovery on ci failing OR
      mergeable CONFLICTING, routing the node through the existing fix interrupt
      (phase fix, qa-done and reviewed markers cleared). A red check from the
      up-to-date sync therefore reaches a fix worker on a later tick. A
      CONFLICTING PR takes the same demotion, and the conflict itself is then
      handled at re-provisioning: provision-node-worktree's merge of origin/main
      hits the conflict and exits 11, routing the /fix-conflicts conflict
      worker. The up-to-date gate (draft
      tactic-graph-auto-merge-up-to-date-gate) composes with this: the gate only
      updates the branch and defers the merge; regression routing stays owned by
      the stall-recovery reconciler."
  - question: "Clarification 64 (the reviewed/pending-merge lifecycle) enumerates
      the tick's post-review branches — green CI + mergeable==MERGEABLE ->
      merge, red CI -> fix interrupt — but specifies NO branch for a
      reviewed/pending-merge PR whose GitHub mergeable==CONFLICTING. The legacy
      dispatch lane buckets a CONFLICTING PR to /fix-conflicts (lib.sh
      dispatch-phase), but the graph-native router has no equivalent:
      read-sensors.ts has no mergeable sensor, PHASES has no conflict phase, and
      the selector's only interrupt is the CI-fix of clarification 66. So a
      conflicting reviewed node-lane PR sits silently unmerged with no worker
      dispatched (observed live on tactic-align-skills-dataviz-guidance,
      2026-07-19). How does the graph-native router recognize a pending-merge PR
      in conflict and route it to a conflict worker?"
    answer: >-
      (Recorded 2026-07-19 /align-strategy interview.) The merge-conflict
      interrupt is the structural twin of the CI-fix interrupt (clarification 66
      / tactic-fix-interrupt-orthogonal-state, codified) and is modeled the same
      way — as orthogonal execution state, not a phase value.


      (1) Encoding — a new orthogonal, nullable execution.conflict = {since,
      attempt}, mirroring execution.fix's shape (clarification 66). phase stays
      purely ladder-positional (at pending-merge in the greenfield of
      tactic-pending-merge-phase, or post-review arm-merge in the interim) and
      is never overwritten by a conflict. No conflict value is added to the
      PHASES enum: the clarification-66 precedent that pulled fix out of the
      enum applies verbatim — a phase value overloads ladder-position with
      interrupt-active.


      (2) Routing authority — the SELECTOR is the sole sensor-reading routing
      authority for this interrupt too, parity with clarification 66's "the
      selector reads execution.fix directly". The selector reads the PR's GitHub
      mergeable sensor at selection and branches three ways: CONFLICTING -> set
      execution.conflict and dispatch the conflict worker (dispatch-conflict);
      MERGEABLE -> clear execution.conflict and let the tick's no-worker
      graph-auto-merge action land it (clarification 64); UNKNOWN -> wait and
      retry next tick (parity with clarification 66's pending-CI concurrency
      guard), never dispatching a worker on UNKNOWN, which would thrash on
      GitHub's async mergeability computation. The tick reconciler keeps ONLY
      the no-worker merge action (clarification 64); it does not route.


      (3) Reaction, not prevention — the router detects a conflict when it
      manifests and routes reactively, consistent with the sensor-driven
      selector model. Continuously rebasing pending-merge PRs onto origin/main
      to pre-empt conflicts is explicitly OUT of scope: a silent rebase would
      change the merged result and so invalidate the review a pending-merge node
      just passed (the no-unreviewed-code-merges guarantee of clarifications
      64/66).


      (4) Spin guard — execution.conflict.attempt caps the conflict interrupt
      (parity with the fix-checks attempt cap and legacy /fix-conflicts' cap of
      3); at the cap the node parks to office_hours rather than spinning.


      (5) Re-review after resolution — does the
      no-unreviewed-code-merges-after-a-fix doctrine (clarifications 64/66)
      extend to conflict resolutions? Yes, materiality-scoped, tied to the
      conflict worker's own mechanical-vs-intention verdict (clarification 78 /
      tactic-dispatch-conflict-greenfield's layer partition): a purely
      MECHANICAL resolution (dispatch-conflict layers 1-3 — decidable from
      existing graph requirements, content-preserving) clears execution.conflict
      and returns directly to pending-merge to merge, having changed no reviewed
      intent; a resolution requiring model reconciliation or author input
      (layers 4-5 — new substance) resets phase -> review and disarms
      auto-merge, exactly as clarification 66's post-review fix backward-edge
      does, because the resolution introduced code the completed review never
      saw.


      Scope: this supplies the router-side detect-and-route half that
      clarification 64 (tick branches) and the dispatch-* skill-inventory
      clarification (which already names dispatch-conflict as the graph-native
      conflict skill from /fix-conflicts) left open; it contradicts and amends
      neither. The router-side routing seam is retained as draft
      tactic-graph-router-conflict-routing (this round); the resolution WORKER
      is tactic-dispatch-conflict-greenfield; the pending-merge wait phase it
      composes with is tactic-pending-merge-phase; the mergeable sensor is a new
      read in read-sensors.ts. Delegation: this rides on delegation-github (the
      PR/merge substrate) but adds no unwinding of that reliance, so
      strategy-graph-native-dispatch takes no new recovers edge.
  - question: Is graph-commit's target-repo resolution a standing invariant of this
      strategy, or only an implementation detail of its fix tactic?
    answer: "(Recorded 2026-07-21 interview, correcting a same-day placement
      decision.) A standing invariant: graph-commit resolves its target repo
      from the caller's cwd (or an explicit -C/--repo argument), never from the
      invoked script's own checkout location, so a worktree invocation can never
      silently commit the primary checkout — and a run with nothing to land
      distinguishes 'node content already on origin/main (benign)' from 'wrong
      checkout resolved (defect)' rather than printing a false success. The
      requirement outlives its implementing tactic
      (tactic-graph-commit-cwd-repo-resolution, drafted the same day), which is
      what places it here by kind-tactic's 2026-07-21 layer-placement
      clarification. It was initially withheld from this layer by an
      orthogonality-of-open-children heuristic, now superseded; the freeze-cost
      premise behind that heuristic was also a measurement error — the
      authoritative predicate (isFingerprintStale over non-null stamps) shows
      this strategy has zero stamped open children at recording time, so this
      clarification freezes nothing and required no re-stamps."
  - question: The residual `.bare` bare-repo layout is kept as backward-compat for
      the draining gh lane (clarification 23) — is it merely descoped from
      graph-native machinery, or does the greenfield physically retire it? And
      does the body's claim that graph worktrees sit at 'the harness default
      location, entered via EnterWorktree' hold today?
    answer: "(Amended 2026-07-21 interview.) The greenfield physically retires the
      `.bare` bare-repo-with-worktrees layout: main becomes the standard git
      working root with `.git` inside it, and Claude Code native worktrees under
      `<repo>/.claude/worktrees/` are the only worktree surface — no `.bare`
      common dir, no sibling `worktrees/` container. The body's 'harness default
      location, entered via EnterWorktree' claim was aspirational and has
      diverged from reality (the graph-lagging-reality hazard, the inverse of
      strategy-explicit-intent's content-staleness): the harness keys the
      project on the git-common-dir (`.bare`), so its actual managed worktree
      root is `<.bare>/.claude/worktrees/`, while graph worktrees are
      provisioned at `<main-checkout>/.claude/worktrees/`. The two diverge, so
      `EnterWorktree(path=…)` into any graph worktree is rejected as 'outside
      .claude/worktrees/' and prompts for a permission-root relocation (harmless
      — approval relocates correctly). Descoping `.bare` from scripts
      (clarification 23's 'no machinery references `.bare`') does NOT fix this —
      only physically de-baring makes the harness key on the main checkout and
      aligns with the Claude Code default where `<repo>/.claude/worktrees/`
      re-entry is prompt-free. This widens clarification 23's retirement target
      from the legacy-lane hook conventions to the physical layout itself."
  - question: Is the legacy gh drain gate — 'no new work enters via gh' — satisfied,
      and what does that unblock?
    answer: "(Reviewed 2026-07-21.) Yes: GitHub issues are structurally disabled on
      the repo (`hasIssuesEnabled: false`), so the drain is complete and the
      monotonic-drain condition holds by construction — issues cannot re-enter.
      `tactic-legacy-router-removal`'s gate (gh queue drained) is therefore met
      and it is unblocked. gh pull requests still flow as the code-review/merge
      substrate for graph-native tactics; that is not gh-issue orchestration and
      is out of scope for this retirement."
  - question: How is the `.bare` retirement executed — a dispatched /align-tactics
      tactic run by the fleet, a re-anchoring of graph worktrees to `.bare` to
      match the validator, or something else?
    answer: "(Recorded 2026-07-21 interview.) The author elected a direct-to-main
      in-session hotfix, bypassing the dispatch workflow, executed only after
      all active sessions are drained and scheduling is disabled (manual fleet
      quiesce). Rejected alternatives: (i) re-anchoring graph worktrees to
      `<.bare>/.claude/worktrees/` to match the validator — it stops the prompt
      but preserves the legacy layout and violates the standing 'no graph-native
      path may assume the legacy `.bare` layout' rule (clarification 23), so it
      was diverged from; (ii) leaving the prompt in place as harmless — rejected
      because relying on Claude Code harness defaults over legacy implementation
      constraints is the intent. A draft tactic (`tactic-retire-bare-layout`)
      records the migration scope in the graph as the sole tracker; its
      execution is the hotfix, not a fleet dispatch."
  - question: Does physically de-baring to rely on Claude Code native worktrees
      deepen coupling to proprietary harness machinery, against
      strategy-owned-orchestration?
    answer: "(Reviewed 2026-07-21 interview.) It stays within the coupling
      clarification 23 already accepted: native worktrees are the execution
      substrate, while router/selection/transition/provisioning logic remains
      owned, offline-testable code (Shape B, clarification 24). De-baring
      changes the repo topology to the harness default but adds no new
      dependence on harness machinery beyond the worktree layer already
      committed. No new `recovers` edge is warranted (no delegation node covers
      the Claude Code harness); existing `recovers: delegation-github` is
      unchanged — gh issues retired, gh PRs remain by design."
  - question: A graph-write primitive that mutates the node file in the shared
      checkout and then fails to land leaves the mutation on disk, where it
      blocks every subsequent graph-commit for every other node. Is "a failed
      graph write leaves no residue" a standing invariant of this strategy, and
      what is the target design?
    answer: "(Recorded 2026-07-23 interview, from the 2026-07-23 manual tick
      failure.) A standing invariant, binding the CLASS of graph-write
      primitives rather than only the two scripts that exhibited it: a graph
      write that fails to land leaves NO residue in the shared checkout. Target
      design (greenfield): a primitive never uses the shared checkout as scratch
      space -- it cuts scratch from origin/main, does the read-modify-write
      there, and graph-commits from there, so a failure leaves the primary
      checkout untouched by construction. This is the rule /align-strategy Step
      0 already binds interactive sessions to (\"never author strategy edits in
      the shared main checkout: a second concurrent session's dirty tracked file
      blocks your graph-commit rebase\"); the primitives simply do not follow
      it. Brownfield first step, shippable in one PR: snapshot the node blob
      before mutating and restore it on every failure path. The incident:
      park-node:98 and demote-node-to-implement:78 both mutate
      intentions/<id>.md in the primary checkout, call graph-commit, and on
      failure print \"the ... write is on disk but not landed\" and exit 1,
      leaving it there; graph-commit's assert_clean_outside_ids then refuses
      every subsequent call for every OTHER node, so one node's failed park
      bricks the whole tick and the error names a file unrelated to the node
      being worked. dispatch-graph-scope-sweep:122 calls the demote primitive in
      a loop that explicitly continues past failures, so one stray write
      cascades into every later demote in that sweep. Same family as the
      2026-07-21 cwd-resolution invariant (a worktree invocation can never
      silently commit the primary checkout) and placed at this layer for the
      same reason: the requirement outlives its implementing tactic
      (tactic-graph-write-failure-rollback, drafted this round). Freeze cost
      measured with the authoritative predicate (readNode + isFingerprintStale),
      never a grep: all 29 open children carry a null strategy_fingerprint,
      which isFingerprintStale treats as not-stale, so this clarification
      freezes nothing and required no re-stamps."
  - question: "Steelman: should a failed graph write deliberately LEAVE its mutation
      on disk as forensic evidence and a cheap retry point, rather than rolling
      back?"
    answer: "(Recorded 2026-07-23 interview.) Diverged from, with the reason
      recorded. The rival framing is real: leaving the write means a human can
      inspect exactly what the primitive intended and re-run graph-commit
      without recomputing it, and a rollback discards that. It is rejected
      because the residue lives in a SHARED resource -- its forensic value
      accrues to the one node that failed, while its cost is borne by every
      other node in the tick, none of which can land any graph write until a
      human clears a file they never touched. The asymmetry is structural, not
      incidental: the 2026-07-23 tick lost two legitimate scope-stale demotions
      to a stray park write left by a third, unrelated node. Durable evidence
      belongs in the tick journal and in the park's own
      office_hours.recommendation -- this strategy's existing
      park-recommendation condition already requires that recoverable context be
      written into the NODE at park time -- never in the working tree of a
      checkout other sessions depend on. Recomputing a failed write is cheap;
      unblocking a shared checkout by hand is not."
  - question: dispatch-graph-main-red-sync's graph-commit runs inside a `( ... ) ||
      true` subshell in a loop, so a failed graph write produces no error at
      all. Is "a graph write never fails silently" a standing invariant distinct
      from the no-residue rule?
    answer: "(Recorded 2026-07-23 interview, extending the same-day no-residue
      clarification.) Yes, and it is a distinct standing invariant, not the same
      rule restated: every graph write that fails to land surfaces a diagnostic
      naming the node and the failure, and no call site may swallow the error.
      The two are complementary -- no-residue governs what a failed write leaves
      BEHIND (shared-checkout state), this governs whether the failure is
      OBSERVABLE at all. Either can be satisfied while the other is violated: a
      rollback that exits silently leaves a clean tree and no signal, and a loud
      failure can still leave residue. Found while auditing the call-site census
      for tactic-graph-write-failure-rollback: dispatch-graph-main-red-sync:104
      runs its graph-commit inside `( ... ) 1>&2 || true` within a `while read`
      loop, so a failure is swallowed entirely -- nothing logged, residue left,
      and the loop proceeds to the next node, potentially adding another dirty
      file per iteration. Operationally silence is the worse half of the pair:
      residue at least announces itself at the next graph-commit, whereas a
      swallowed failure leaves the graph quietly not saying what the router
      believes it says. Recorded at this layer for the same reason as the
      no-residue rule -- nothing today prevents a seventh call site from adding
      another `|| true`, and the requirement outlives
      tactic-graph-write-failure-rollback (unit 3), which implements it. Freeze
      classification for this round: the strategy's one stamped open child,
      tactic-qa-fix-instrument-signoff-classify (review), is ORTHOGONAL -- it
      narrows qa-fix's classify prompt for non-user-facing audit-instrument
      sign-off and depends on nothing recorded here -- so its
      strategy_fingerprint was re-stamped in this same commit rather than left
      to freeze. It was classified on the substance of the delta, not on its
      rank."
  - question: What does an office_hours park assert, and may graph hygiene (census)
      ever park?
    answer: "(Recorded 2026-07-23 /align-strategy interview.) An office_hours park
      asserts: no autonomous path forward exists under current graph direction —
      a human is required. Author-intention decisions and genuine escalations
      (crash-loop sweep parks, true-conflict parks, provision failures) both
      qualify; owed mechanical labor never does. Graph hygiene
      (census/reconciliation) therefore never parks: direction exists, only
      labor is owed — a hygiene hold is modeled as a blocked_by edge to a
      tracked node (a fix-tactic for a mechanical hold; a question-scoped
      born-parked review item when the hold is a genuine author-intention
      question), never as a park on the hygiene node itself. Observable: the
      office-hours queue contains no hygiene/census-labor parks (sensor:
      office-hours-select --list with each park reason classified; threshold
      zero). Motivating failure: the 2026-07-11 census node sat parked 12 days
      while debt grew 52 to 62; its park was converted to three blocked_by edges
      and cleared in this round's commit."
  - question: What is the greenfield design for graph hygiene (census), and why does
      it require no AI session?
    answer: "(Recorded 2026-07-23 /align-strategy interview; author-directed.)
      Greenfield: census is a scripted dispatch-tick step — not a node, not an
      AI session. Every tick: enumerate done-but-present nodes; prune only those
      whose completion verifies mechanically (recorded execution.pr with
      mergedAt set, or a recorded graph-commit sha); edge repair (strip pruned
      ids from live blocked_by) is scripted; one batched graph-commit. The
      drain-time doctrine-home check is eliminated by construction:
      kind-tactic's authoring-time layer-placement gate (2026-07-21) keeps
      durable content out of transient tactic bodies, and git history retains
      pruned bodies as backstop. Nodes failing verification (falsely-done,
      unrecorded pr) are left in place and surfaced as an integrity-defect count
      — they become ordinary selectable defect tactics, never parks, never
      mid-tick AI. The census latch node disappears and dispatch-graph-census's
      threshold-birth mechanism retires once the tick step is live: a cheap
      continuous drain never accumulates debt, so no latch is needed. Migration:
      (1) tighten execution.pr custody at park time
      (tactic-office-hours-pr-custody); (2) implement the scripted tick step,
      strict-verification-only (tactic-census-scripted-tick); (3) convert the
      2026-07-11 census node's three holds to blocked_by edges (this round); (4)
      retire the latch birth. Interview ground for no-AI: of the four drain
      steps, completion verification, edge repair, and dependent satisfaction
      are already mechanical; the only judgment step (doctrine-home) compensated
      for authoring-time placement leaks the layer-placement gate now prevents."
  - question: "The reservation-ledger reaper (reservation_sweep) is wired only into
      dispatch paths that reach the selection stage: the pause sentinel
      short-circuits the autonomous heartbeat before it, and the --manual
      fan-out path deliberately skips it. In the standing paused-scheduling +
      manual-only operating mode nothing reaps the ledger, so it drifts stale
      (dead-session orphans inflate live=N and throttle manual fan-out). What is
      the cross-mode ledger-validity requirement, and the design that meets it?"
    answer: "(Recorded 2026-07-23 interview.) Invariant: the reservation ledger must
      read as VALID in every operating mode — (a) cron/timer-scheduled
      autonomous execution, (b) paused-scheduling with manual-only dispatch, and
      (c) paused-scheduling with no dispatch — not only when an autonomous tick
      reaches selection. The pause sentinel
      ($XDG_DATA_HOME/commons-dispatch/paused, dispatch-tick) gates worker
      SPAWNING, never ledger BOOKKEEPING: pausing scheduling must never pause
      reconciliation. Greenfield design (ideal, led per design-proposals): (1)
      sweep-on-read — fold reservation_sweep into the ledger's count/read API
      (reservation_count) so every consumer is reconciled by construction and no
      call site can read stale; this reconcile-at-consumption framing also
      covers manual reads during pause (the 30s boot-grace still protects
      brand-new markers); (2) reaping decoupled from the pause sentinel — a
      lightweight ledger sweep on the timer-driven heartbeat runs BEFORE the
      pause short-circuit, bounding orphan accumulation during long pauses with
      no manual ticks (kept out of the gh-heavy, throttled dispatch-sweep
      worktree-GC pass, which solves a different problem); (3) reap-on-exit
      (tactic-graph-node-session-reap, PR #2922) as the write-side complement so
      the happy path never strands a marker, leaving the sweep as the crash-only
      backstop. Steelman refinement: the rival 'reconcile only at
      scheduling-resume' is insufficient because manual dispatch consumes the
      ledger DURING pause; sweep-on-read is that rival's valid core (no
      pointless background reaper when nobody reads) reconciled with the
      requirement. Brownfield migration path (greenfield is multi-PR and
      reverses a recorded aside): (i) parity fix — reservation_sweep in the
      --manual block before reservation_count
      (tactic-manual-path-reservation-sweep); (ii) pause-independent reaper —
      reservation_sweep in dispatch-tick before the pause short-circuit
      (tactic-heartbeat-sweep-before-pause); (iii) land PR #2922 reap-on-exit;
      (iv) converge — sweep-on-read in the ledger count API, removing the
      now-redundant per-path sweep calls: the autonomous call, the explicit-node
      call (PR #2952), and (i) (tactic-ledger-sweep-on-read). This REVERSES the
      aside in tactic-explicit-node-reservation-sweep-policy (PR #2952) that
      '--manual need not sweep — its non-sweep only affects fan-out pacing,
      never a hard refusal, so the paths need not move in lockstep': that
      reasoning holds for the explicit-node hard-refusal it addressed, but did
      not consider the paused+manual mode, where manual non-sweep is not a
      pacing optimization but total reaper dormancy — the ledger's only live
      consumer running with no reconciler. PR #2952's own deliverable (the
      NODE_ARG branch sweep) is unchanged; only its broader 'manual is safe'
      aside is superseded. Boost note: the two parity-fix tactics are boosted to
      the top of NORMAL work but below the strategy-main-health emergency
      ceiling (boost 100), which the 2026-07-13 guard keeps dominant — the
      ledger fix is important but is not a red-main emergency. (Amended
      2026-07-26: the \"$XDG_DATA_HOME/commons-dispatch/paused\" sentinel named
      here is superseded by a dispatch.config/*.json boolean field — see the
      pause-field clarification of that date. The mechanism this clarification
      protects is unchanged: pause gates worker SPAWNING only and never ledger
      BOOKKEEPING, and the pre-short-circuit ledger sweep still runs on a paused
      tick.)"
  - question: Does the greenfield design enforce serialization of work on the
      dispatch queue, the office-hours queue, and between the queues?
    answer: "(Recorded 2026-07-25 review.) No, in three distinct places. (a)
      DISPATCH QUEUE — serialized only through its front door. The selection
      lock and reservation ledger are honored by dispatch-select-tick, but
      graph-select-target acquires nothing itself, so any other invocation
      (manual, emulated, subagent) runs reservation_exists with no lock held and
      never writes a marker: a check-then-act race. The tracked fix is the
      --standalone flag on PR #2918, which folds lock acquisition, headroom, and
      the ledger claim into the selector so the critical section is
      self-contained. (b) OFFICE-HOURS QUEUE — the drain lane holds no claim at
      all. It writes no reservation marker, and its occupancy check keys on the
      session name office-hours-<node-id>, which exists only for sessions
      launched through office-hours-graph; a drain launched by subagent fan-out
      or interactively is invisible to dedup and races the fleet. Observed live
      this round: while the author held an unexecuted grant for one resolution
      of tactic-graph-router-live-worker-visibility, a concurrent fleet actor
      landed the opposite resolution and cleared the park, so a real design
      question was settled by push timing rather than by the author's answer.
      tactic-office-hours-concurrency-dedup covers only the office-hours-graph
      launch path; the residual is tactic-office-hours-drain-claim. A granted
      disposition is also not compare-and-swap-guarded against branch-tip
      movement during the human interview window, where non-fast-forward push
      rejection is the only and latest-possible detector;
      tactic-clear-park-primitive supplies CAS at land time but reads its base
      immediately before landing, leaving the interview window open
      (tactic-drain-disposition-diagnosis-cas). (c) BETWEEN THE QUEUES —
      clearing a park makes a node router-eligible instantly while the clearing
      session may still be pushing residual work, and the clearer holds no
      claim, which is gap (b) again; and every queue's state writes contend on
      the single main ref at CI-stamp prices, already diagnosed and
      author-ratified in the graph-commit rebase-retry-exhaustion clarification.
      tactic-graph-ref-split is that greenfield, and it shrinks every race
      window named here, which raises its priority beyond its own
      landing-exhaustion motivation. TWO REVIEW CLAIMS WERE CORRECTED BY THE
      GRAPH SWEEP and must not be re-derived: the reservation ledger's fail-open
      versus fail-closed asymmetry is NOT an untracked gap, because
      claimed_issue_nums has no production call site and the live concern is
      already tracked and already boosted as
      tactic-graph-router-live-worker-read-robust; and the legacy issue-number
      derivation in reserved_claimed_nums is real but inert, tracked as
      tactic-reservation-ledger-issue-num-residue. Per the design-proposals rule
      the greenfield is recorded here and the migration sequencing lives in the
      tactic bodies."
  - question: Mechanical retry holds — provision exit 11 merge conflicts,
      fix-attempt-cap exhaustion — are written as office_hours parks. Should the
      park record gain a taxonomy to separate them from human parks?
    answer: "(Recorded 2026-07-25 interview, author-selected.) No, and no schema
      change. The defect is in the PRODUCERS, not the record. A park asserts
      that no autonomous path forward exists and a human is required; a merge
      conflict against a moving main frequently self-resolves, which makes it a
      retry state, not a human state. The terminal-disposition doctrine already
      prescribes the correct handling — a mechanical hold converts to blocked_by
      edges against a tracked fix tactic and clears in the same graph-commit —
      so the work is to make the producers follow it: the provision-exit-11 park
      path and the fix-attempt-cap park inside graph-select-target must stop
      writing office_hours for retry states. Evidence at recording time: roughly
      five of the most recent commits on main were provision-exit-11 parks,
      burying the genuinely author-required parks beneath them, and stale ones
      were cleared by hand in this round and the prior one. Adjacent
      consequence: tactic-router-failure-fuses, which proposes routing new
      mechanical no-progress and systemic-breaker failures into the same
      office_hours queue, is re-scoped by this clarification and must not add
      mechanical parks. Rejected alternative: extending the office_hours record
      with a park-kind field on the tactic-office-hours-session-type precedent,
      which would add a second taxonomy to the same record in order to describe
      states doctrine says should not be parks at all. Tracked as
      tactic-mechanical-park-producers."
  - question: The office-hours selector reads only the local intentions store, so it
      can list a node whose park was already cleared on origin/main. Does moving
      the origin/main freshness read into the selector violate its recorded
      no-gh/no-daemon/no-network contract?
    answer: "(Recorded 2026-07-25 interview, author-ratified on a corrected
      premise.) No. The author corrected the premise itself: the real contract
      is not module purity but avoiding Claude sequencing system or network
      commands that a script could do with fewer round trips and fewer tokens —
      recorded the same day as a companion clarification on
      strategy-token-economy, which owns that principle. Under the real contract
      a local `git show origin/main:...` read inside the selector is not merely
      permitted but preferred, because performing it once inside the script is
      strictly fewer round trips than each caller re-deriving it, which is what
      the current split forces. Today the guard lives only in the bash wrapper
      office-hours-graph (park_live_on_main), so every other consumer must
      reimplement it: this round's subagent sweep had to be instructed in prose
      to re-check origin/main, and a stale-worktree false positive has been
      observed live. graph-select-target already sets the precedent by
      snapshotting origin/main itself via git archive, and
      office-hours-select.ts already performs fs reads, so it was never pure in
      the sense its annotation implied. This AMENDS the design decision recorded
      in tactic-office-hours-concurrency-dedup — 'zero changes to
      office-hours-select.ts, because daemon/network checks would violate its
      contract' — to the extent that decision rests on the purity premise; that
      tactic's bash-side liveness dedup is untouched, since bash is equally a
      script. Tracked as tactic-office-hours-select-fresh-main."
  - question: Where does a priority boost for the queue-concurrency work belong,
      given the persistent-layer ownership gate reserves standing attention
      boosts for strategies and virtues, never tactics?
    answer: "(Recorded 2026-07-25 interview, author-selected.) On the tactics, at
      authored boost 90 — parity with
      tactic-graph-router-live-worker-read-robust, the author-set boost already
      live on exactly this defect class. The level is deliberately below
      strategy-main-health's standing 100 (composed rank 101), whose dominance
      this graph records as intentional: the queue-concurrency work becomes the
      top of the WORK queue without displacing the main-health signal, and no
      boost at or above 100 is claimed. Rejected: boosting
      strategy-graph-native-dispatch itself, which would lift all of its roughly
      twenty open tactics indiscriminately and therefore would not prioritize
      this work relative to its siblings. Noted tension, NOT resolved by the
      author this round: the persistent-layer ownership gate reserves STANDING
      boosts for the strategy layer, and live practice already diverges from it,
      since read-robust carries an authored 90 on a tactic. The reading applied
      here is that these are transient sequencing boosts that expire when the
      tactics complete and are pruned, rather than standing ownership of a
      signal — flagged explicitly as Claude's reading rather than
      author-ratified doctrine, and left available for the review curriculum to
      revisit."
  - question: How must a new pull request be titled, and what must exist behind it?
    answer: "(Recorded 2026-07-25 interview, author-selected.) Every new pull
      request opens with the title `<node id>: <short description>` — the
      literal, copy-pasteable node id verbatim, kind prefix included, then a
      colon-space separator, then a short description (e.g.
      `tactic-office-hours-pr-custody: escalation parks keep custody of their
      PR`). Scope is every new PR, not merely the ones the dispatch chain opens:
      no node, no PR. This adds no new doctrine — it makes this node's standing
      \"the graph is the sole issue tracker, bug tracker included, with no
      side-channel work records\" condition visible on the execution surface,
      closing a real observed gap (PR #2953 `wezterm-pin-refresh` opened with no
      backing node), so out-of-band and personal-infrastructure work now mints a
      tactic node before its PR. The sole exemption is an interim one with a
      named expiry: PRs on the draining legacy gh-issue lane keep their current
      form until that queue drains (tactic-legacy-router-removal). Bot-authored
      PRs (dependabot-class dependency and security bumps) are explicitly NOT
      exempt — such a PR is re-homed under a node rather than waved through,
      consistent with this repo's existing practice of tracking security
      advisories as work items; the repo carries no `.github/dependabot.yml`
      today, so the strictness costs nothing at present. Format is the full
      literal id, not the kind-prefix-stripped short form and not a trailing
      parenthetical: the prefix must resolve directly against `intentions/` with
      no reconstruction step, and a trailing id is the first thing truncated in
      narrow GitHub views. Enforcement is by construction plus a guard —
      `dispatch-open-pr` (and every graph-lane opener) derives the prefix from
      the node itself so conforming titles are true by construction, and a CI
      guard on `pull_request` covers hand-opened PRs. That construction is also
      what answers the parsimony objection this round tested (raised against
      strategy-graph-self-description's derived-never-stored doctrine and
      strategy-graph-integrity's parsimony bar, since the branch name already
      carries the node id): a prefix rendered from the node is derived state
      displayed, not a second authored copy. Steelman resolution, on the rival
      conception that \"node-existence is the substance and the title is
      cosmetic, so build only a PR-open node-existence precondition and drop the
      title convention\": ADOPTED in its substantive half — the guard checks
      that the branch resolves to a real node in `intentions/`, not merely that
      the title matches a shape, so a typo'd or invented id fails; DIVERGED on
      \"the title is decoration\" — the repository is squash-only with
      `squash_merge_commit_title=PR_TITLE` (verified this round), so PR titles
      become `main`'s commit subjects verbatim, and per delegation-github's
      recorded recovery_path git is portable while PR/issue relationship data
      survives an exit only via API export. The title is therefore the sole
      carrier that puts the intent link into the permanent, GitHub-independent
      record, which a PR-open gate cannot do; the convention accordingly
      strengthens rather than deepens the delegation-github attachment. The
      convention binds at open time going forward and is not retroactive —
      existing open PRs are not retitled. The `graph: <verb> <node-id> (...)`
      subject convention used by direct-push `intentions/` commits is a distinct
      surface and is untouched, since those are not PRs. Where a PR genuinely
      touches more than one node, dispatch's one-node-per-PR model
      (`execution.pr`) still holds: the title carries the primary node id and
      any additional nodes are named in the PR body. Implementation is retained
      as draft tactic tactic-pr-title-node-id-convention. (Amended 2026-07-25,
      same day, author direction: the legacy gh-issue queue is fully drained, so
      the interim exemption is REMOVED and the convention now binds with no
      exemptions at all.) Verified at amendment time: the repository reports
      `has_issues: false` — GitHub issues are disabled, which this node's
      standing monotonicity condition forbids any dispatch surface from
      reversing, so no new gh-issue-lane work can enter; no open PR sits on an
      issue-numbered branch; and all 33 open PRs already have head branches that
      resolve to a real node in `intentions/`, so the exemption was covering
      nothing at the moment it was removed. Consequences: the guard is
      unconditional and needs no carve-out logic, no expiry event, and no
      coordination with tactic-legacy-router-removal — the exemption is never
      built rather than built-and-later-deleted. The non-retroactive rule is
      unchanged and does the transitional work on its own: existing open PRs
      keep their current titles (most predate the convention and do not
      conform), and the guard binds only at open time going forward."
  - question: Section Fingerprint & Freeze rests the scope-inert-edit resolution on
      "the transition writer's machinery refresh" and rules that phase workers,
      qa/review sessions, and the tick never re-stamp. Does that machinery
      refresh actually hold, and what is the target design for machinery-written
      body sections?
    answer: "(Recorded 2026-07-25 /align-strategy round.) It does not hold — the
      premise was false when it was recorded on 2026-07-18. transition-node
      calls refresh_stamp AFTER graph-commit (transition-node:178-183), and
      graph-commit's cleanup does `git reset --hard $ORIG_HEAD` to restore the
      far-ahead PR-branch tip it moved off to land an intentions/-only SHA
      (graph-commit:301-303). So refresh_stamp hashes the REVERTED worktree body
      and stamps the pre-edit fingerprint. This fires on every node-lane phase
      worker — all of which run from a far-ahead PR-branch worktree — and is
      inert only in the main checkout, where no HEAD restore happens. Measured
      consequence: /qa-fix's own Step 3.6 `## needs-main residue` body append
      lands in the SAME graph-commit as the qa to review transition, so the next
      dispatch-graph-scope-sweep reads stamp != origin/main as scope drift and
      demotes the node to implement, wiping execution.markers (qa-done AND
      planned) and discarding completed QA custody; the implement re-entry is a
      no-op that returns the node to qa within minutes. Evidence gathered this
      round: 33 of 37 demotions since 2026-07-05 hit nodes that had already
      reached qa or review; of 30 post-QA demotions, 26 were on nodes whose QA
      pass had appended a residue section, against 6 of 54 never-demoted nodes.
      Adopted greenfield target: tacticScopeFingerprint hashes PLAN SUBSTANCE
      only, excluding machinery-appended body sections, so no machinery writer
      can trip the custody gate by construction — carrier
      tactic-scope-fingerprint-plan-substance. Adopted migration/immediate
      carrier: repair refresh_stamp to hash what actually landed on origin/main
      rather than the post-reset worktree copy — carrier
      tactic-transition-node-stamp-landed-body. Both are recorded per the
      design-proposals rule (greenfield and migration proposed separately,
      migration cost informing how to get there and not what to aim for). This
      is DISTINCT from tactic-transition-node-scope-stale-test-coverage, which
      covers the stamp's PATH resolution (MAIN_ROOT vs the invoking worktree),
      not the stamp's CONTENT SOURCE. Grounds: the refresh_stamp defect is
      verified in code and in the graph's own commit history and is
      author-independent; the substance-scoped-fingerprint SHAPE is
      Claude-proposed and held on trust — enrolled for ratification at
      tactic-review-sitting-fingerprint-custody-2026-07-25."
  - question: A false or genuine demotion wipes execution.markers, but the qa
      phase-log entry and the QA PR comment survive it. What makes a re-entry
      session's reading of that surviving evidence sound?
    answer: "(Recorded 2026-07-25 /align-strategy round.) Phase-completion evidence
      is FINGERPRINT-BOUND: a phase-log entry, a qa-done marker, and a QA PR
      comment are valid only for the scope fingerprint they were produced under.
      A re-entry that finds completion evidence stamped at a different
      fingerprint must RE-RUN the phase, never ratify it — and that binds
      mechanically, not by session judgment. Without the binding, this section's
      own recorded net guarantee (\"merge still requires an unbroken implement
      to qa to review chain against the merge-time scope fingerprint\") is
      REPORTED satisfied while actually broken: the surviving phase-log reads to
      a re-entry session as \"a prior session died before the terminal
      transition\", which licenses a transition-only pass over QA that session
      never ran. Observed live: after a false demotion had wiped qa-done, the
      re-entry on PR #2958 transitioned with no re-verification at all, and the
      re-entry on PR #2965 re-verified only partially. The misdiagnosis is
      itself evidence the binding is absent — both sessions concluded the prior
      transition \"never ran\" when it HAD landed and was reverted by the sweep.
      Carrier: tactic-phase-evidence-fingerprint-bound. Rejected rivals: (a)
      have the demotion strike or clear the phase-log so re-entry cannot see it
      — destroys the audit trail the phase-log exists for, and covers only the
      demotion producer rather than any path that supersedes completed-phase
      evidence; (b) document the rule in /qa-fix's re-entry preamble without a
      mechanism — that is precisely what failed, since nothing in the skill
      governs the shortcut today and the two observed sessions diverged sharply
      in how much they re-verified. Grounds: the wording is Claude-proposed, but
      it is a direct expression of this section's own recorded net guarantee
      rather than a new commitment; held on trust pending author ratification —
      enrolled at tactic-review-sitting-fingerprint-custody-2026-07-25."
  - question: Does the fingerprint-bound phase-evidence invariant (2026-07-25)
      invalidate completion evidence that carries no bound fingerprint at all —
      every marker, phase-log entry, and QA PR comment written before the
      binding lands?
    answer: "(Recorded 2026-07-25 /align-tactics round on
      tactic-phase-evidence-fingerprint-bound.) Does the fingerprint-bound
      phase-evidence invariant invalidate completion evidence that carries no
      bound fingerprint at all? No — the binding is PROSPECTIVE. The invariant
      fires on evidence stamped at a DIFFERENT fingerprint; evidence with NO
      stamp (every marker, phase-log entry, and QA PR comment written before the
      binding lands) reads as unbound, not as mismatched, and stays ratifiable
      on re-entry. Grounds: the recorded wording of the same-day
      fingerprint-bound-evidence clarification and the carrier tactic's own
      statement both scope the re-run trigger to a different fingerprint, and
      the corpus's dominant precedent for an absent stamp is fail-open
      (isScopeStale's null-stamp-is-not-stale,
      packages/intentionsutil/src/transitions.ts:331, and the same missing-stamp
      fail-open in packages/intentionsutil/src/scope-sweep.ts); the one opposite
      precedent, the missing-stamp fail-CLOSED hold at
      .claude/skills/dispatch-propagate/scripts/transition-node:171-175, is
      scoped to arming auto-merge at review completion and is not widened here.
      Consequence, accepted rather than hidden: the Fingerprint & Freeze net
      guarantee is restored only for evidence produced after the binding lands,
      so the window closes as the currently in-flight tactics cycle rather than
      by a corpus-wide forced re-run of QA. A future round wanting the stricter
      reading — an unbound qa-done forces a re-run — should record it as an
      author decision, since its cost is a forced re-QA of every in-flight
      node."
  - question: How does the fingerprint-bound phase-evidence invariant (2026-07-25)
      sit with the standing phase-progress condition that a re-selected worker
      treats pre-existing worktree and PR state as resume input rather than
      redoing the phase?
    answer: (Recorded 2026-07-25 /align-tactics round.) How does the
      fingerprint-bound phase-evidence invariant sit with the standing
      phase-progress condition, which says a re-selected worker treats
      pre-existing worktree and PR state as resume input rather than redoing the
      phase? The condition governs IN-PROGRESS residue — worktree commits,
      per-unit fix commits, a partially-written PR comment — and is unchanged.
      The same-day invariant governs COMPLETED-phase evidence — a phase-log
      entry, a qa-done marker, a finalized QA PR comment — and narrows the
      condition only there, and only when that evidence's bound fingerprint
      differs from the current one. Resume-as-input stays the default; re-run is
      the exception a fingerprint mismatch forces. The condition text itself was
      not reconciled when the invariant was recorded, so this note records the
      boundary rather than editing a human-decided condition; a future /align
      interview may fold it into the condition if the author prefers it homed
      there.
  - question: Is strategy-main-health's dominant-boost write-path enforcement
      (condition 14) actually implemented mechanically, given this round's
      clause-coverage evidence reported it as unenforced?
    answer: "(Verified 2026-07-25 /align-tactics round.) The standing condition that
      strategy-main-health's dominant boost is enforced at the write path IS
      implemented — a clause-coverage pass this round reported it as unenforced,
      and that finding is wrong and must not be re-derived. The guard is
      validateGraph rule 18 (checkAttentionDominance,
      packages/intentionsutil/src/schema.ts:876-908, documented at 995-1003): it
      reads strategy-main-health's live attention.boost as the threshold,
      rejects any other node whose attention.boost or attention.override matches
      or exceeds it, and honors the literal substring 'ACK:
      main-health-dominance' in attention.rationale as the author override. Two
      limits recorded honestly: the condition's other half — refusing a commit
      that REDUCES the dominant boost — has no implementation, and the guard is
      inert when strategy-main-health's own attention.boost is null, so a commit
      that nulls or lowers it silently disarms the ceiling. That residual is a
      mechanical defect for a future tactic to carry, not a change of direction;
      the two tactics boosted to 95 on 2026-07-25 sit below the ceiling and
      satisfy the guard as implemented."
  - question: The requirement "dispatch workflow configuration is stored using XDG
      standards" — how does it resolve against dispatch.config/'s project-root,
      instance-repo-symlink location?
    answer: "(Recorded 2026-07-26 interview.) Diverge from the literal XDG Base
      Directory Specification, and record it as a deliberate divergence rather
      than claim compliance. dispatch.config/ stays project-root-resolved
      (dispatch-config-load resolves <project-root>/dispatch.config via
      resolve_project_root in lib.sh), carrying the instance-repo symlink
      convention tactic-dispatch-config-template is implementing; it does NOT
      move to $XDG_CONFIG_HOME. \"XDG standards\" resolves to its intent — ONE
      conventional, discoverable, non-ad-hoc config home shared across every
      worktree, with a single documented override point (DISPATCH_CONFIG_DIR) —
      which that convention already satisfies. The reason to diverge: the
      symlink into a private instance repo gives pace-curve pins and auto-merge
      gating reviewable git history, which $XDG_CONFIG_HOME does not provide.
      Honest accounting of the net effect, surfaced in the interview and
      accepted deliberately: this round LOWERS the repo's literal XDG usage
      rather than raising it, because the one dispatch parameter that was
      XDG-compliant (the pause flag at $XDG_DATA_HOME/commons-dispatch/paused)
      moves into the non-XDG dispatch.config/ — see the pause-field
      clarification of the same date. Unrelated XDG uses elsewhere (topic-usage
      state under $XDG_STATE_HOME, systemd user units under $XDG_CONFIG_HOME,
      the budget skill's own config) are untouched and out of scope."
  - question: Should "dispatch scheduling paused" (default false) stay a filesystem
      sentinel at $XDG_DATA_HOME/commons-dispatch/paused, or become a
      dispatch.config/*.json field like the other operator-facing dispatch
      parameters?
    answer: "(Recorded 2026-07-26 interview.) It becomes a dispatch.config/*.json
      boolean field, and that field is the SOLE mechanism — the sentinel is
      deleted, not retained as a second path or a compatibility shim. Default
      false (not paused), matching today's absent-sentinel default. Rationale:
      uniformity with the other operator-facing parameters
      (max_concurrent_workers, weekly_pace_floor_pct, and the worker auto-close
      toggle), all of which already resolve through dispatch-config-load; plus
      this strategy's own standing-mode condition, which makes pause durable
      operator configuration rather than transient runtime state. Edge cases
      resolved this round: (a) FAIL CLOSED — pause evaluation must treat ANY
      config resolve/read/parse failure as PAUSED, never as not-paused. This is
      a new failure mode the sentinel did not have: the old check was a bare
      filesystem existence test, whereas dispatch-config-load exits 2 outside a
      git repo, exits 1 on invalid JSON, and prints no-config (exit 0) when the
      file is absent; combined with the instance-repo symlink, a dangling
      symlink or an unmounted instance checkout would otherwise silently RESUME
      the fleet. Fail-closed follows .claude/rules/code-style.md and matches
      dispatch-tick's existing stance of failing loud when
      lib-reservation-ledger.sh fails to load rather than swallowing it. (b)
      SEMANTICS PRESERVED VERBATIM — the field gates worker SPAWNING only and
      never reservation-ledger bookkeeping; an explicit manual dispatch run
      still OVERRIDES the pause; and the ledger reap on the paused branch, ahead
      of the short-circuit, is unchanged. (c) The state-to-configuration
      reclassification is deliberate, made on the strength of the standing-mode
      condition, not an accidental misfiling of runtime state into a config
      surface. Implementation retained as draft
      tactic-dispatch-pause-config-field, which also owns migrating the two
      in-repo references to the sentinel path: dispatch-tick's
      DISPATCH_PAUSE_FLAG resolution, and the body citation in
      tactic-manual-path-reservation-sweep — the latter is at phase qa and must
      NOT be body-edited from this round, because editing an open tactic's body
      would trip its own scope-fingerprint custody gate and demote it. (Amended
      2026-07-29: the clause \"all of which already resolve through
      dispatch-config-load\" is a TENSE error as to its third item. The worker
      auto-close toggle does not resolve through the loader and is entirely
      unbuilt — dispatch-config-load's validated type allowlist carries no
      auto-close or worker-sessions member, and dispatch-self-close reads no
      operator configuration at all. The other two items are correct:
      max_concurrent_workers and weekly_pace_floor_pct both resolve through the
      allowlisted target-workers type. Read the clause as the intended end
      state, not as current state. The uniformity rationale it supports, and
      every other resolution in this entry, stand unchanged — see the 2026-07-29
      loader-tense clarification.)"
  - question: "Steelman-alternative test: should dispatch scheduling pause be a
      configurable knob at all, given the graph's own anti-config precedent and
      the fact that pausing is already expressible as a pace-curve pin?"
    answer: "(Recorded 2026-07-26 interview; adopt/diverge test per the
      align-strategy alternatives gate.) DIVERGE from the rival framing. The
      rival — that this strategy's intent is \"dispatch behaves correctly
      without operator intervention\", making every added knob a design failure
      — is real and has in-graph precedent: tactic-census-scripted-tick's design
      decision 1 records \"No config. The design wants an unconditional,
      always-on step once live — not a threshold-gated birth... has no on/off
      toggle.\" Its sharpest form is that pausing is ALREADY expressible by
      pinning the pace curve to target 0, so minting a pause field adds a
      representation rather than removing one. The divergence rests on a
      verified lifetime difference: dispatch-target-workers computes the weekly
      curve from used_weekly + resets_at_weekly + now, so a pin that yields
      target 0 AUTO-RELEASES when the weekly window rolls over. A pause must not
      silently lift at week-roll — this strategy's own condition holds
      paused-scheduling to be a STANDING operating mode, not a degraded or
      temporary state. A self-clearing throttle and a standing mode are
      therefore distinct concepts, not duplicate representations of one thing.
      Representation count is a wash rather than a regression: pace-pin plus
      sentinel (two) becomes pace-pin plus config field (two), since the
      sentinel is deleted. The anti-config precedent is not overturned — it
      governs birth-gating a mechanism that ought to be unconditional, which is
      not what an operator pause is."
  - question: Two tactics independently rewrote the same paragraph of a shared skill
      reference while both branches sat unmerged for hours, and nothing detected
      the overlap until provision-time exit 11. Is a tactic's write set part of
      the recorded graph, and what checks it?
    answer: "(Recorded 2026-07-27 /align-strategy interview.) Yes — standing
      requirement: a tactic's write set is declared in the graph,
      machine-readable, and checked at two seams. Today it is neither declared
      nor checked. The node schema carries only prose path:line anchors in the
      plan body; worktree isolation keys on node id (see body §Worktree Claiming
      & Liveness), so two tactics writing the same file are not in conflict as
      far as the router is concerned; and §Fingerprint & Freeze's two stamps
      cover the strategy frontmatter and the tactic body but never the code
      diff. Unmerged branches are therefore an invisible write set: origin/main
      is the only surface on which two in-flight tactics can see each other, so
      a tactic holding its branch for hours is undetectable to every other
      tactic for that whole window. Live instance: PR #2918 held a rewrite of
      .claude/skills/qa-fix/references/needs-main-followups.md for about 9.5h
      while main took 41 commits, colliding with a second tactic that corrected
      the same paragraph in the opposite direction — a semantic conflict, not
      merely a textual one. Greenfield: a declared scope.files on the node,
      authored at /align-tactics time, gated hard at selection (the selector
      refuses to co-dispatch candidates whose declared write sets intersect and
      defers the loser to a later tick) and checked against the actual git diff
      --name-only origin/main...HEAD before a phase transition. Tracked as
      tactic-node-scope-files-overlap-gate and tactic-code-diff-scope-custody,
      the latter blocked_by the former since a diff gate needs a declared scope
      to compare against. The author chose the hard selection gate over an
      advisory/rank-penalty variant: detection at provision time is exactly the
      exit-11 hold this exists to prevent, so prevention has to bind at
      selection."
  - question: A phase edge that exists in no code — qa → main-qa — lived in skill
      prose for 15 days and has since regenerated in a tactic's plan body. Where
      does phase-routing doctrine live, and how do prose restatements stay true
      to it?
    answer: "(Recorded 2026-07-27 /align-strategy interview.) forwardPhase and
      reconcileMergedPhase (packages/intentionsutil/src/transitions.ts) are the
      single home of phase routing; every prose restatement of the ladder in a
      skill doc is generated from that home between sentinels and drift-checked
      in CI, never hand-authored. This is a standing requirement, not a one-time
      correction: hand-written ladder prose has now drifted from the code four
      separate times. A qa → main-qa edge that forwardPhase has never
      implemented (forwardPhase('qa', …) returns 'review' unconditionally;
      main-qa is reachable only via review → main-qa on needs-main residue,
      because main-qa is post-merge by definition) was introduced to qa-fix
      prose on 2026-07-11 (ae63fb30, #2844) and survived 15 days. It then acted
      as an attractor: two independent tactics wrote opposite corrections to
      that same paragraph, which is what made their merge conflict semantic.
      qa-fix/SKILL.md and its references on origin/main are now correct, but the
      phantom has already regenerated — tactic-transition-node-stamp-landed-body
      (phase review, PR #2973) asserts in its plan body that a residue at qa
      routes qa → main-qa and expects stdout 'transitioned t-stamp qa ->
      main-qa'. The implementer silently wrote the correct 'qa -> review', so
      shipped code is unaffected; that node's stale plan text is deliberately
      left untouched rather than pay a review→implement scope-custody demotion
      for a documentation-only defect, and it becomes historical when the node
      reaches done. Tracked as tactic-phase-routing-table-generated."
  - question: A Workflow launched by scriptPath dies unrecoverably when a background
      session forks at a turn boundary. How must a skill launch a repo Workflow,
      and where does that contract live?
    answer: "(Recorded 2026-07-27 /align-strategy interview.) Standing requirement:
      every skill-driven Workflow launch passes the registry `name` (or, for an
      ad-hoc script, inline `script`) — never a caller-authored `scriptPath`.
      `args` may be an object or a JSON string (align-tactics.js:778 parses
      either; the three completed tactic-mode runs of 2026-07-25 all passed a
      string, at 17KB, 22KB, and 116KB, so payload size was never the
      constraint). `scriptPath` is permitted ONLY against the path the harness
      itself returned for an already-launched run — the
      iterate-on-a-persisted-script loop the Workflow tool documents — and never
      from a skill. MECHANISM: at each turn boundary a background session
      checkpoints its in-flight tasks into an adopt.json and a fork re-adopts
      them. A `name` or inline-`script` launch persists a harness-owned copy
      under <project>/<session>/workflows/scripts/<meta.name>-<runId>.js and
      adopts cleanly; a `scriptPath` launch persists nothing — verified three
      ways: session 88a4c17d used both forms and persisted only its `name`
      launch, session e79be2b7's inline `script` launch persisted, and the
      scriptPath-only sessions (8ccbaf32 and this one) have no workflows/scripts
      directory at all. The fork then emits `[adopt] workflow <id> skipped:
      scriptPath rejected`, kills every agent mid-flight, and the run cannot be
      recovered because `resumeFromRunId` carries the same rejected path.
      RECOVERY RULE: on that message, relaunch by `name` — never retry the same
      form, and never treat the harness's own `To resume manually:
      Workflow({scriptPath, resumeFromRunId})` hint as applicable, since it
      belongs to the sibling fork-failed-to-spawn branch. This is not a
      CLI-version regression (both strings are present in 2.1.204, 2.1.216,
      2.1.217 and 2.1.220 alike), and it contradicts the Workflow tool's own
      contract text, which claims every invocation automatically persists its
      script. PROVENANCE OF THE DEFECT: tactic-align-tactics-workflow (phase
      done) specified the broken directive deliberately — its Unit 2 scope text
      prescribes the prose directive \"Invoke the Workflow tool on
      `.claude/workflows/align-tactics.js`, passing args\" with the explicit
      parenthetical \"no `name:`, no inline `script`\" — and it propagated to
      five sites: .claude/skills/align-tactics/SKILL.md:210 and
      references/tactic-target.md:100, .claude/skills/review-fix/SKILL.md:284,
      and .claude/skills/qa-fix/SKILL.md:324 and
      references/disposition-workflow.md:69. That node's body is history and is
      deliberately left untouched. Measured cost: one /align-tactics tactic-mode
      round (tactic-demote-node-stale-local-read, 2026-07-27) spent four
      launches and five killed subagents before the cause was isolated. Tracked
      as tactic-workflow-launch-contract-home and
      tactic-workflow-launch-prose-lint."
  - question: Clarification 111 puts phase-routing prose under a generated single
      home with a CI drift check. The Workflow launch contract is the same
      defect class — a prose restatement drifting undetected — but has no code
      home to generate from. What is its mechanical floor?
    answer: "(Recorded 2026-07-27 /align-strategy interview; adopt/diverge per the
      align-strategy alternatives gate.) A lint over the authored prose, not a
      guard at the call site. The launch is a model-level tool call, so unlike
      forwardPhase there is no owned, offline-testable home to generate the
      restatements from — clarification 111's mechanism does not transfer, and
      this contract's home is itself prose: one rule file that the five skill
      sites point at, with none of them restating the mechanics. The floor is
      therefore a lint-prose-rules.sh rule (already CI-wired through
      run-lint.sh; precedent, the shell-json echo-into-jq rule) rejecting
      net-new skill or plan text that phrases a Workflow launch as a file path,
      widened from that linter's current shell-script scope to markdown. DIVERGE
      from the rival design — a PreToolUse hook denying a non-store scriptPath
      at the Workflow call — on two grounds the author raised at interview. (1)
      Ad-hoc safety: 18 of this project's 160 recorded sessions launched by
      scriptPath, nearly all of them ad-hoc dispatch-tick emulation (tick.mjs,
      tick-fanout.mjs, runB.mjs, graph-tick-producers.js), several written to a
      file precisely because the script was too large to emit inline; a
      deny-hook would have blocked every one, and the supported substitute
      charges the whole script text to model output. (2) Maintenance: the hook
      would have to recognize
      <project>/<session>/workflows/scripts/<name>-<runId>.js, a layout derived
      by inspecting disk rather than from any published contract — a CLI version
      that moves it makes the hook fail closed on legitimate launches,
      presenting as a harness bug. The decisive asymmetry is where the error is
      made: this defect entered as authored prose in a plan body, which a text
      lint catches at its origin, whereas the call site is only where the
      symptom surfaces. The ad-hoc launch path is left to human judgment rather
      than gated."
  - question: The launch contract permits scriptPath against the harness-persisted
      path — a workflow-resume mechanism. Does that conflict with the recorded
      condition that session recovery (workflow resume, transcript
      reconstruction) is never router substrate?
    answer: "(Recorded 2026-07-27 /align-strategy interview; doctrinal-consistency
      gate run against origin/main.) No — the carve-out is bounded to
      human-driven iteration and widens no condition. The permitted use is an
      interactive author editing an already-persisted script and resuming it
      while developing a workflow, and it is verified to work: session ff12b541
      (2026-07-25) launched align-tactics by name, edited
      <session>/workflows/scripts/align-tactics-wf_154c862a-ca3.js, relaunched
      with that path plus resumeFromRunId, and that run completed. No router or
      phase path may depend on it. A phase skill launches by name, and if its
      run dies the phase re-runs from durable state under the existing
      conditions — phase progress whose only home is the worker session is a
      defect, and session recovery is never router substrate. Both halves stand:
      resume is a development convenience, never orchestration substrate.
      Recorded limit of this session's evidence: the rejection mechanism is
      inferred, not isolated — whether the adopter rejects on the path's
      location or on the absence of a persisted copy was not determined. The
      operational rule holds under either reading, since both forbid a
      caller-authored path; a future mechanism-dependent design (the rejected
      hook above being the obvious one) would have to isolate it first."
  - question: Keeping a node's documentation true costs a phase demotion when the
      node is scope-chained. Does the record's truth ever yield to preserving a
      node's phase, and what does an expensive true update imply about the
      tooling?
    answer: >-
      (Recorded 2026-07-27 /align-strategy interview.) Standing author
      preference, ratified: the graph always reflects target state. Correcting a
      node's record to match reality is never traded away to preserve that
      node's phase, and a round that declines a true update because the update
      is expensive has misread its job — the expense is a defect in the TOOLING,
      to be filed, not a reason to leave the record false. Demotion is a
      legitimate price only where the edit genuinely changes scope; where it
      does not, the tools must make the true update cheap.


      This amends, and corrects the premise of, entry 111 (2026-07-27), which
      recorded a deliberate decision to leave
      tactic-transition-node-stamp-landed-body's stale `qa -> main-qa` plan text
      untouched rather than pay a review -> implement demotion, and likewise
      deferred tactic-mechanical-park-producers' stale greenfield prose. That
      premise was wrong on both counts, verified against origin/main:


      (a) main-qa is NOT scope-chained at either gate — SCOPE_CHAINED_PHASES is
      {qa, review} in packages/intentionsutil/src/scope-sweep.ts:31 and {fix,
      qa, review} in packages/intentionsutil/scripts/check-node-selection.ts:61
      — because, as §Fingerprint & Freeze already states, main-qa is post-merge
      and validates against current intent by design. A body edit to a main-qa
      node cannot demote it. The deferral protected nothing.


      (b) For the scope-chained review node, the authorized hatch already
      existed: the scope-inert re-stamp of entry 73 (2026-07-18), shipped as
      packages/intentionsutil/scripts/restamp-scope-fingerprint.ts, which names
      an author-present /align-strategy round as an authorized re-stamper and is
      fail-closed. Its stated limit was also misread: it resolves its target
      from `git rev-parse --git-common-dir` and writes
      <main-root>/.claude/worktrees/<id>.scope-fingerprint, so it needs no
      worker worktree for the node. Ordering is the real constraint — the
      re-stamp must run AFTER graph-commit from a tree synced to the landed
      commit, or it hashes a stale body, which is exactly the defect of entries
      102-103.


      Both sites were corrected in this round's commit, the review node
      re-stamped per entry 73.


      The round also surfaced a structural gap this preference condemns: the
      scope-custody stamp is gitignored machine-local state (.gitignore:1
      `worktrees/`; 0 of 60 live stamps tracked in git). The gate deciding
      whether the graph's phase state is trustworthy therefore lives entirely
      OUTSIDE the graph — a fresh clone or a second machine has no stamps,
      isScopeStale fail-opens on a null stamp
      (packages/intentionsutil/src/transitions.ts:331), and no node is ever
      stale. That is the sharpest standing counterexample to 'the graph reflects
      target state'. tactic-scope-fingerprint-plan-substance does not cover it:
      that tactic narrows the fingerprint to exclude machinery-appended
      sections, which leaves author documentation edits tripping the gate and
      leaves the stamp out-of-graph either way. Carrier: draft
      tactic-scope-stamp-in-graph, filed this round.
  - question: The recorded threshold (legacy gh router deleted, /file-issue and
      /plan-issue coverage mapped to the align family) is a one-time migration
      event and is now essentially met, yet the strategy carries 33 open and 43
      draft children that are overwhelmingly steady-state machinery-correctness
      defects, with reading null and rounds still 0/null/null after roughly a
      dozen rounds. Does the strategy complete at migration, or is its signal
      the wrong shape?
    answer: '(Recorded 2026-07-28 /align-strategy interview; doctrinal-consistency
      gate run against origin/main.) The signal was the wrong shape and is
      amended; the strategy does not complete at migration. The gate is
      decisive: virtue-progressive-detachment — which this strategy serves, and
      against whose delegation-github this strategy holds the recovers edge —
      says "What must never atrophy is the path back: for each delegation, a
      recovery route (rebuild, re-host, substitute, relearn) whose cost stays
      bounded... An unexercised recovery path is a hope, not a path." Deleting
      the legacy router proves only that the substitute was BUILT; the virtue
      demands the owned path be EXERCISED and its cost BOUNDED, which is exactly
      what reliable align-tactics execution means. The defect was therefore
      narrower than a whole-scope error: the observable ALREADY carried the
      exercise clause ("a tactic completes the full lifecycle — align-tactics
      breakdown, implement, qa, review, merge — with no GitHub label or issue
      required"), and only the threshold was terminal. Amended this round: the
      threshold becomes sustained exercise plus a bounded, non-increasing open
      machinery-defect backlog; the sensor names align-tactics-census.ts
      explicitly, which already enumerates that population, so no new instrument
      is strictly owed despite reading being null; is_proxy flips false to true,
      because a backlog count proxies correctness and a falling count can mean
      fewer defects OR less looking — that weakness is recorded, not designed
      away. The migration clause leaves the observable and threshold; "legacy gh
      router deleted, coverage mapped" is recorded here as MET
      (tactic-legacy-router-removal phase done, PR #2960 merged 2026-07-26;
      GitHub Issues disabled repo-wide), and its non-regression is already
      covered by the standing legacy-drain-monotonicity condition rather than a
      duplicate new one. REJECTED ALTERNATIVES, both put to the author at
      interview: (a) split — let this strategy complete at migration and move
      the standing stream to strategy-autonomous-execution; rejected because
      that node measures attention economics (whether the HUMAN is overwhelmed:
      backlog runway, escalation volume within office-hours capacity), not
      whether the CHAIN is correct, and the 17 standing machinery conditions
      recorded here would have to move with roughly 76 open and draft children.
      (b) no scope change, pay the reconciliation debt only; rejected because
      the debt is real and separately recorded below but does not explain a
      threshold that cannot read a standing property.'
  - question: "Steelman (alternatives gate): substituting an owned dispatch chain
      for GitHub does not remove an attachment, it swaps one for another — the
      machinery's virtues become permanent constraints, and a correctness signal
      is a treadmill that rewards growing the owned surface and can never go
      green. Should the strategy's end be a CHEAP owned path rather than a
      CORRECT one?"
    answer: "(Recorded 2026-07-28 /align-strategy interview; align-strategy
      dialectic step 2.5.) DIVERGE on the end; ADOPT the warning as a condition.
      The rival is sourced from virtue-alignment-of-attachments, recorded as
      tension_with virtue-progressive-detachment: \"Every delegation grafts the
      delegatee's virtues onto my graph as constraints... prefer delegatees
      whose alignment I can manage over those engineered to charge the service
      against virtue buy-in.\" DIVERGE because virtue-progressive-detachment
      explicitly accepts permanent delegation and skill atrophy as expected and
      beneficial — what it refuses is a path back that is a hope. A
      cheap-but-broken owned path fails that test; an exercised-but-costly one
      does not. So the strategy's end stays the recovery path being real and
      exercised, not its price. But the treadmill objection is sound and is
      imported as a recorded condition: the owned machinery's maintenance burden
      stays inside a band the author declares, and a burden growing without
      bound is a condition FAILING — which parks the strategy for an author
      decision — rather than simply more work to do. This makes the treadmill
      self-limiting without making cheapness the end. Two limits recorded
      honestly: no band value is declared as of 2026-07-28, so the condition is
      not yet armed and declaring the band is an author act owed at the next
      round; and delegation-anthropic-claude was checked for a recovers edge
      this round and deliberately gets none — this strategy deepens reliance on
      that delegation rather than unwinding it, which is precisely the exposure
      the imported condition is there to bound."
  - question: "A per-node /align-tactics <tactic-id> session receives contradictory
      instructions about the drift phase's immaterial observations:
      references/write-path.md:168-171 says land each
      result.drift.clarifications_to_add entry as a dated clarifications entry
      on the strategy, while references/tactic-target.md:131-137 says a per-node
      session never touches the serving strategy's frontmatter (rounds,
      clarifications, or otherwise) and routes any strategy-record need to a
      park instead. Which binds?"
    answer: "OVERTURNED 2026-08-15 — this ruling NO LONGER BINDS. A per-node
      /align-tactics session may no longer write clarifications to the serving
      strategy at all; the immaterial path mints a born-parked observation node
      instead. See the sibling clarification 'Which lanes violate the
      autonomous-substance invariant today', violation V1, which supersedes this
      entry and quotes it. WHY THE REASONING BELOW NO LONGER HOLDS: its decisive
      argument was that the doctrine left immaterial observations with NO LEGAL
      DESTINATION AT ALL, forcing a choice between dropping them and writing the
      strategy. The born-parked observation node is a legal destination, so the
      forced choice dissolves and the concession it justified is no longer
      needed. The SECOND finding below — that DRIFT_SCHEMA emits {answer} while
      the Clarification interface requires {question, answer}, so the
      instruction was never mechanically executable — is UNAFFECTED and still
      owed. The original ruling, preserved verbatim for provenance, follows.
      (Recorded 2026-07-28 /align-strategy interview.) Standing requirement: a
      per-node tactic-target session MAY append clarifications entries to the
      serving strategy, and may touch NOTHING else on it — never
      rounds/count/last_completed/last_aligned, never statement, rationale,
      attributes.conditions, success_signal, or any edge. write-path.md:168-171
      binds in BOTH modes; tactic-target.md's absolute prohibition narrows to
      everything-but-clarifications. DECISIVE ARGUMENT: strategy-mode
      /align-tactics already lands these same immaterial clarifications
      autonomously with no author present — the skill never calls
      AskUserQuestion in either mode — so tactic mode landing them claims no
      authority strategy mode does not already have, whereas dropping them
      violates clarification 31 / condition 7, which makes the graph record the
      sole carrier from a recording round to the next session. The park escape
      tactic-target.md offers is unavailable by construction:
      references/autonomy.md permits a park only on requirement ambiguity, major
      scope deviation, or an unverifiable blocker, and the drift phase's
      immaterial path is defined as none of the three (material premises and
      failed Side-A conditions already arrive as parks in result.parks). So the
      current doctrine leaves immaterial observations with no legal destination
      at all, and the outcome depends on which reference file the session read
      last. CONFIRMED LIVE: the 2026-07-27 per-node run on
      tactic-align-tactics-tactic-mode-drift-gate (workflow run wf_9f49072c-454)
      returned 4 clarifications_to_add and 4 unrecorded_premises, all
      material:false; the session followed tactic-target.md and dropped all of
      them. They are recovered verbatim from that run's journal and landed as
      the four clarifications immediately below. SECOND, INDEPENDENT DEFECT in
      the same path: DRIFT_SCHEMA.clarifications_to_add
      (.claude/workflows/align-tactics.js:165-173) declares its items as
      {answer} only, with additionalProperties:false, while the Clarification
      interface (packages/intentionsutil/src/schema.ts:66-69) requires
      {question, answer} — so write-path.md's instruction is not mechanically
      executable as written, and any session obeying it must fabricate the
      question unguided, as this round did for the four recovered entries. Both
      halves are tracked as tactic-align-tactics-per-node-clarifications."
  - question: This round's edit changes success_signal and attributes.conditions,
      both inputs to strategyFingerprint. How many open children does it freeze,
      and which need re-stamping?
    answer: "(Measured 2026-07-28 /align-strategy interview, via the authoritative
      predicate rather than a grep, as the freeze/re-stamp-cost rule requires.)
      Zero, and no re-stamp was owed. Computed with readNode plus
      strategyFingerprint (packages/intentionsutil/src/router.ts:80) plus
      isFingerprintStale (packages/intentionsutil/src/transitions.ts:365): all
      33 open (non-draft, non-done) tactics serving this strategy carry NO
      execution.strategy_fingerprint entry for it — neither a map key nor a
      legacy bare string — and isFingerprintStale returns false both for a null
      stamp and for a map lacking the strategy's key. So this round classified
      nothing into orthogonal/materially-affected/must-land-first buckets,
      because the population those buckets range over is empty. THE MEASUREMENT
      IS ITSELF A FINDING: the soft-freeze mechanism that clarification 10
      depends on is INERT for this strategy — the graph's most-edited node and
      its largest subtree — so no mid-flight child here has ever re-evaluated
      against edited strategy substance, and every /align-strategy round on this
      node to date has silently frozen nothing. Graph-wide the coverage is
      partial: 35 of 108 open tactics carry any stamp at all, all of them in the
      deprecated bare-string form. The CAUSE is not diagnosed in this round and
      this entry asserts none: apply-node-transition.ts:169-172 is the
      first-class writer and align-strategy's own bootstrap-interim hand-stamp
      path is the other producer, but which is failing to fire, and whether the
      absence is a bug or an un-run migration, is unestablished. Tracked as
      tactic-strategy-fingerprint-stamp-coverage. Note also that no scope-inert
      .scope-fingerprint re-stamp was owed either: this round edited no
      in-flight tactic's body."
  - question: Is this strategy's signal slice undecided, or
      complete-but-unreconciled — and what does that imply for the next round's
      eligibility?
    answer: "(Recorded 2026-07-27 /align-tactics round.) The signal slice is
      complete but unreconciled, not undecided. tactic-legacy-router-removal —
      the sole validates-terminal — is phase done via PR 2960, merged
      2026-07-26T01:10:18Z, and its blocker tactic-phase-skill-node-targets is
      phase done via PR 2844; both are still present in intentions/ on
      origin/main because pruning-on-completion has not fired (the same residue
      appears on at least nine unrelated done nodes, so this is graph-wide, not
      specific to this strategy). strategy.reading is still null even though the
      reading instrument tactic-dispatch-lifecycle-sensor completed and was
      pruned, and rounds.count is still 0 despite a dozen documented
      re-evaluation rounds since 2026-07-03. Consequence for future rounds: the
      'no non-draft child on the signal path' eligibility criterion trips on
      this residue, so the strategy reads as non-decomposable until a
      read-sensors pass writes the reading, the two done terminals are pruned,
      and the rounds block is stamped. Reconciliation is the owed action for
      this slice; further decomposition toward the signal is not. (Landed
      2026-07-28 by the /align-strategy round that resolved the per-node
      carve-out above; recovered verbatim from the journal of workflow run
      wf_9f49072c-454, whose session dropped it. Landing note: the
      reconciliation this entry names is still owed, but the reading it calls
      for is now the AMENDED threshold's reading — sustained exercise plus a
      bounded, non-increasing machinery-defect backlog — not the superseded
      migration-completion threshold's.)"
  - question: Is the tactic-mode drift-gate defect actually live on origin/main, and
      what is its blast radius for this strategy specifically?
    answer: "(Observed 2026-07-27 /align-tactics round.) The defect
      tactic-align-tactics-tactic-mode-drift-gate records is still live and
      uncommitted on origin/main: align-tactics.js line 954 computes planTactics
      = [] on bare !driftProceed and line 1068 computes deviation =
      !driftProceed || parks.length > 0, neither carrying the mode !== 'tactic'
      carve-out that the decompose gate at line 912 already applies. Because
      this strategy's signal path is claimed by a done-but-unpruned
      validates-terminal, the strategy-round eligibility criterion legitimately
      reads false, so every per-node /align-tactics <tactic-id> finalize against
      this strategy hits the bug: body_markdown null, disposition escalated, and
      — since SKILL.md Step 2 writes office_hours only from result.parks — no
      office_hours reason written anywhere, an unrecoverable dead end. The fix
      is scoped and empirically validated in the tactic's own body;
      buildDriftPrompt (lines 540-611) should also take mode so the round-level
      eligibility text is not issued during a per-node finalize, and
      SKILL.md:205-208 must move in lockstep. (Landed 2026-07-28 by the
      /align-strategy round that resolved the per-node carve-out above;
      recovered verbatim from the journal of workflow run wf_9f49072c-454, whose
      session dropped it. Landing note: that tactic was finalized to phase
      implement on 2026-07-27 at commit 11558266 with the full three-unit fix
      plan in its body, and the code defect remained live on origin/main as of
      2026-07-28.)"
  - question: "Does the office_hours-recoverable-context condition hold, given that
      most currently-parked nodes carry recommendation: null?"
    answer: "(Reviewed 2026-07-27 /align-tactics round.) The
      office_hours-recoverable-context condition holds prospectively and is
      mechanically enforced for new parks:
      packages/intentionsutil/scripts/park-node requires <reason>, takes an
      optional [recommendation], writes office_hours = { reason, since,
      recommendation: recommendation || null }, and explicitly never folds the
      recommendation into the reason on the caller's behalf. A scan of
      intentions/ found 60 of 109 nodes with a live office_hours block carry
      recommendation: null; every spot-checked case is dated 2026-07-05 to
      2026-07-11 — before the field became a separately-passed argument — and
      the recoverable next-steps content is present, folded into the reason
      prose. The legacy backlog is a format mismatch, not lost context, and does
      not count as the condition failing; the condition is read as governing
      parks written from the split-field contract onward. (Landed 2026-07-28 by
      the /align-strategy round that resolved the per-node carve-out above;
      recovered verbatim from the journal of workflow run wf_9f49072c-454, whose
      session dropped it.)"
  - question: Can legacy-router-removal work still be re-derived from
      tactic-legacy-router-removal's own body, and does condition 1's standing
      premise still hold?
    answer: "(Recorded 2026-07-27 /align-tactics round.) Do not re-derive
      legacy-router-removal work from tactic-legacy-router-removal's own Unit-1
      body text — it narrates a superseded 2026-07-23 state that its frontmatter
      (phase done, PR 2960) has moved past. The live-wired half landed via
      tactic-dispatch-legacy-rewire (PR 2869, merged and pruned 2026-07-18); the
      remaining half was split out 2026-07-23 as
      tactic-legacy-office-hours-entry-removal, still open at phase implement
      and blocked_by tactic-graph-node-session-reap. Separately, condition 1's
      standing premise was re-checked live this round and still holds: gh api
      repos/natb1/commons.systems reports has_issues false, /file-issue and
      /plan-issue are both retired with no live code path, and
      tactic-align-entrypoint-consolidation is still phase implement — so the
      condition's parenthetical 'today /align-strategy, until
      tactic-align-entrypoint-consolidation lands' remains accurate. Phase
      values for this subtree must be read from origin/main, not a local
      checkout: tactic-demote-node-stale-local-read (filed 2026-07-27)
      false-demoted tactic-graph-review-exclusion-stall-recovery and
      tactic-graph-node-session-reap this week off stale local reads. (Landed
      2026-07-28 by the /align-strategy round that resolved the per-node
      carve-out above; recovered verbatim from the journal of workflow run
      wf_9f49072c-454, whose session dropped it.)"
  - question: A deploy lag makes /qa-main park a correctly-sorted machine-verifiable
      item as cannot-verify. Is that an office_hours park?
    answer: "(Recorded 2026-07-28 /align-strategy interview, alongside the same-day
      record-time main-qa routing clarification.) No — it is a mechanical retry
      hold, not an office_hours park. The selector gates main-qa on the source
      PR's mergedAt only
      (.claude/skills/dispatch-propagate/scripts/graph-select-target:631-642)
      and not on the prod deploy having landed, so /qa-main can boot on a
      correctly-sorted machine-verifiable item, find prod still serving the
      pre-merge build, and route to cannot-verify. Parking that to office_hours
      wakes the author for something no author is needed for, and — because a
      cannot-verify park on a machine-sorted node is exactly the mis-sort
      measurement recorded the same day — it also injects false positives into
      that measurement. Resolution: a deploy-lag cannot-verify emits a
      blocked_by hold against a tracked deploy-wait and re-selects once the
      deploy lands; only a VERIFIABILITY cannot-verify (the item cannot be
      machine-checked at all) becomes an office_hours park. This applies this
      strategy's existing park taxonomy — 'Mechanical retry holds stop being
      office_hours parks: ... emit blocked_by edges against a tracked fix tactic
      instead' (tactic-mechanical-park-producers, live) — to a third producer,
      and it keeps the mis-sort measurement clean by construction rather than by
      filtering free-text park reasons."
  - question: "Steelman: is routing author-required post-merge tests efficiently the
      wrong end — since every such test is a QA design failure that entrenches
      the author in a loop this strategy exists to remove?"
    answer: "(Recorded 2026-07-28 /align-strategy interview.) The tension is ADOPTED
      as real; its conclusion is DIVERGED from, with the reason recorded. The
      rival framing is sourced from this strategy's own served virtue,
      virtue-progressive-detachment: if the end is the author's detachment from
      tactical execution, then an author-required post-merge verification is
      itself the defect, and making its routing efficient optimizes a queue that
      should be empty — entrenching the author rather than removing them.
      Diverged from because the two goods are orthogonal and the sort is prior:
      until post-merge tests are sorted at record time, the author-required
      population is not countable at all, because author-required and
      machine-verifiable work is indistinguishably fused into one source node's
      residue section. The sort is what first makes that population a measurable
      quantity — which is precisely what the same-day mis-sort measurement reads
      — so it is a precondition for shrinking the population, not a substitute
      for shrinking it. Recorded limit of this divergence: it does NOT license
      treating the author-required queue as permanently acceptable. Some items
      (owner-credentialled GCP billing alerts, human visual smoke of a
      Storybook) may never be machine-verifiable, and this round adopts no
      target for the population's size; a future round that sets one would be
      consistent with this resolution, not a reversal of it."
  - question: Is the graph-commit MAX_PUSH_ATTEMPTS exhaustion signature always
      landing contention, as clarification 80 records?
    answer: "(Amended 2026-07-28, extending clarification 80.) No. Clarification 80
      diagnoses busy-main exhaustion as landing contention — unrelated nodes
      racing for the single linear main ref, each retry re-buying the CI stamp —
      and that diagnosis is correct for the 2026-07-19 observations it was drawn
      from. It is not exhaustive. A second, non-contention cause produces a
      byte-identical signature: the same 5/5 attempt exhaustion and the same
      terminal text, main busy (landing-lock contention or required checks never
      stamped green). Observed 2026-07-28: graph-commit attempted to land a SHA
      that was already origin/main HEAD and already CI-stamped (reached via the
      no new changes to stage — landing current HEAD fallback at
      graph-commit:1476 for a write that staged nothing). await_checks counts
      check-run ROWS matching the four required context names and gates on exact
      equality with 4 (graph-commit:610), but an already-stamped SHA accumulates
      one row per context per workflow run — the observed SHA carried 3
      successful rows of each of the four contexts, 12 green and 0 failed — so
      the gate could never pass, and no amount of retrying could change it.
      There was no competing writer and no red check. Consequence for diagnosis:
      the exhaustion signature alone is AMBIGUOUS as to cause and must not be
      read as contention; distinguish by checking whether the target SHA already
      exists on origin/main and how many check-run rows per context it carries.
      Consequence for the ratified resolution: none — this strengthens rather
      than weakens it. The greenfield (tactic-graph-ref-split) deletes the CI
      stamp and with it both causes; the interim lock
      (tactic-graph-commit-landing-lock, since landed) addresses only the
      contention cause, which is why the arithmetic cause needed its own tracked
      node (tactic-graph-commit-noop-landing-false-failure, filed this round).
      Standing invariant recorded with it: a required-check gate counts DISTINCT
      required contexts green, never check-run rows — a row count admits both
      false negatives (duplicate runs) and, under a >= relaxation, false
      positives (four green rows of one context standing in for four contexts)."
  - question: Are conditions 14 (the write-path boost guard), 16 (the
      dispatch.config pause-field amendment) and 17 (the CI PR-title guard)
      implemented in code today, or are they recorded requirements still pending
      implementation?
    answer: "(Recorded 2026-07-28 /align-tactics round.) Implementation-status sweep
      of three conditions, verified directly against origin/main so a future
      session does not mistake them for observations of current state. Condition
      14 (a write-path guard refusing any commit that authors a boost/override
      at or above strategy-main-health's 100, or reduces it) is NOT implemented:
      'boost', 'override' and 'main-health' do not appear in
      packages/intentionsutil/scripts/validate-graph.ts or
      packages/intentionsutil/scripts/graph-commit,
      packages/intentionsutil/src/attention.ts composes boosts with no cap or
      refusal, and strategy-main-health.md's own rationale nonetheless asserts
      the guard exists -- and no tactic in this strategy's child set tracks it,
      which is the one actionable gap in this sweep. Condition 16's
      parenthetical amendment (the pause sentinel replaced by a
      dispatch.config/*.json boolean as the sole mechanism, failing closed) is
      NOT implemented: dispatch-tick:266 still gates on the DISPATCH_PAUSE_FLAG
      sentinel file and dispatch-config-load's key list has no 'pause' member;
      the condition's substantive half DOES hold (the gate covers worker
      spawning only, never reservation_sweep), and the mechanism half is tracked
      by tactic-dispatch-pause-config-field (raw). Condition 17's CI title guard
      does not exist (.github/workflows/pr-checks.yml carries no title
      validation; dispatch-open-pr takes a caller-supplied --title unvalidated),
      tracked by tactic-pr-title-node-id-convention (raw). All three read as
      recorded requirements with pending implementation, not as failed
      conditions."
  - question: Condition 1 is framed around a legacy gh router that 'only drains
      existing issues' — does that draining lane still exist, and does the
      condition still hold?
    answer: (Recorded 2026-07-28 /align-tactics round.) Condition 1's framing --
      'the legacy gh router only drains existing issues' -- is superseded by
      completion, not failed. dispatch-select-tick's own comments (lines 18-21
      and 806-816 on origin/main) state the legacy gh selection lane was REMOVED
      and the graph selector is now the only queue selector;
      intentions/tactic-dispatch-legacy-rewire.md no longer exists (done and
      pruned); GitHub Issues are disabled repo-wide. The condition's substantive
      assertion -- the graph is the sole issue tracker, bug tracker included,
      with no side-channel work records -- holds in a stronger form than the
      drain framing describes. Read the condition as that assertion, not as a
      claim that a draining legacy lane still exists.
  - question: "The office-hours drain lane's terminal SESSION disposition on the
      green-CI path is unrecorded: clear-park writes no
      $CLAUDE_JOB_DIR/node-terminal marker while park-node does, so an
      office-hours-graph-launched drain's SUCCESS path would leave its job held
      and worktree_has_live_session TRUE, freezing the node it just unblocked.
      Who writes the marker -- clear-park itself (a), the drain skill (b), or is
      the drain declared a non-managed interactive session (c)?"
    answer: "(Ratified 2026-07-28 office-hours session on
      tactic-office-hours-self-modification-skill.) Option (b): the DRAIN SKILL
      calls mark-node-terminal itself, with a new `park-clear` member added to
      that script's disposition enum
      (packages/intentionsutil/scripts/mark-node-terminal:67). Condition 15's
      auto-close enumeration is amended in this same round to a third clean
      terminal state. The governing principle, recorded here because it decides
      future cases too: the node-terminal marker asserts THE SESSION'S PASS IS
      OVER, not that a node was disposed. So a scripted primitive may write it
      only in lanes where one job disposes exactly one node (transition-node's
      advance/demote, park-node's Stop-hook backstop park); in any lane where
      one session disposes SEVERAL nodes, only the session can know it is done,
      which is why /align-tactics and /fix-checks already declare via SKILL.md
      prose. The drain is definitively in the second class:
      .claude/skills/ref-diagnosis-time-cas/SKILL.md:11-13 defines it as a
      BATCHED drain that diagnoses several parked nodes, then interviews the
      author about each proposed disposition before executing any of them. Under
      option (a), clear-park would arm the reap on the drain's own primary node
      mid-batch, and because dispatch-self-close fires on every turn yield --
      and an interview yields on every turn -- the session would be reaped out
      from under the remaining nodes: precisely the incident class the marker
      was introduced to prevent (dispatch-self-close:43-46; node
      tactic-graph-ref-split, session 36e64744). Two corrections to the
      reasoning recorded at park time. FIRST, the stated objection to (a) --
      that resolve-park would inherit the reap -- is factually wrong:
      resolve-park does NOT call clear-park, it inlines its own office_hours
      clear and graph-commit (resolve-park:162,188), and clear-park has ZERO
      code callers on origin/main today. (a)'s blast radius is therefore not the
      problem; its unsafety under batching is. SECOND, park-node:277's
      unconditional internal call carries the SAME early-arming hazard for a
      batched drain that re-parks its own primary node before finishing the
      batch -- a live latent defect, pre-existing and out of scope for this
      ratification, recorded in tactic-office-hours-self-modification-skill's
      body so the planning round carries it as a unit or sibling. Option (c) is
      rejected as previously recorded: it conflicts with the fallback lane's
      need for the office-hours-graph-provisioned node-id worktree holding the
      worker's staged branch. The accepted cost of (b) is the residual
      dispatch-self-close:75-78 already names: a lane declaring via prose can
      drop the line, which fails toward HOLD (job kept alive, node stays
      claimed) rather than toward a lost session -- cheap, recoverable, and
      operator-visible via the canary log line. (Amended 2026-07-29: this
      entry's governing principle — 'the node-terminal marker asserts THE
      SESSION'S PASS IS OVER, not that a node was disposed' — is now carried by
      condition 14 itself as the declared-vs-undeclared test, so park-clear is
      no longer 'a third clean terminal state' appended to an enumeration but
      one member of an open set the condition no longer enumerates. This entry's
      own enumeration amendment is the worked example of why: it added
      park-clear and left fix-attempt, align-round, no-claim, conflict-resolved,
      and conflict-hold unreconciled. The accepted residual named here is
      re-priced, not re-accepted — a dropped declaration on a routine SUCCESS
      path is a guaranteed deadlock, not a rare recoverable slip; see the
      2026-07-29 declared-vs-undeclared clarification.)"
  - question: The reap condition enumerates three reapable dispositions while
      mark-node-terminal accepts eight and dispatch-self-close reaps on any
      marker — which governs, and what does a deliberate no-advance terminal
      exit do when it falls in the gap?
    answer: "(Recorded 2026-07-29 /align-strategy interview, prompted by a live
      freeze.) OBSERVATION: /qa-fix Step 3.7's fix-finalize path (job c20b2f8d,
      node tactic-graph-select-target-node-tests, PR #2985) landed and pushed a
      fix commit, finalized its `<!-- dispatch:qa-summary -->` PR comment, wrote
      a qa phase-log entry, and emitted a completed_with_fixes outcome envelope
      — then DELIBERATELY did not transition, because a fixing pass must leave
      `phase: qa` so CI restarts and the chain re-QAs
      (.claude/skills/qa-fix/references/auto-fix-lane.md). It declared no
      node-terminal marker: dispatch-mark-complete writes only the legacy
      `phase-completed` marker, and the node-lane seam in
      .claude/skills/qa-fix/SKILL.md covers only the clean-pass path
      (transition-node, which declares internally) and the escalation path
      (office-hours-reason, where park-node declares) — the fix-finalize path, a
      third terminal path, has no node-lane seam at all. dispatch-self-close
      therefore HELD the job, and dispatch-sweep's node arm cannot free it
      either (it requires node-completion evidence AND no live session, and
      neither holds). So every successful qa auto-fix freezes its own node until
      an operator manually reaps it, and the chain can never perform the re-QA
      the fix path's own design depends on. RESOLUTION (author, this round): the
      primitive's principle governs (mark-node-terminal:11-14 — 'a session may
      only be reaped when it PROGRESSED (advance), retried by design
      (fix-attempt), or PARKED'), and condition 14's three-member enumeration
      was stale relative to the machinery it governs. REFRAME (author endorsed,
      this round): condition 14 is restated as a PRINCIPLE rather than an
      enumeration — reap iff the pass DECLARED a terminal disposition (marker
      presence), keep every UNDECLARED exit. This is what dispatch-self-close
      already implements (it greps `^node=` and ignores `disposition=`); it is
      what the 2026-07-28 park-clear ratification already stated in prose
      without propagating into the condition; and it is what makes the
      2026-07-19 keep-for-debug ground actually TRUE — an undeclared exit is
      precisely one that wrote nothing durable saying what it did, so the live
      session really is its only artifact, whereas the qa-fix fixing pass wrote
      four durable artifacts and is a false negative of the enumerated form, not
      a hard case. TIMING INVARIANT (author endorsed, this round):
      presence-keying makes WHEN a pass declares load-bearing, so condition 14
      now states it — declare as the LAST durable action of the pass, never
      earlier, because Stop fires on every turn yield and an early declaration
      reaps the session out from under its own in-flight work (incident
      2026-07-28, node tactic-graph-ref-split, session 36e64744).
      park-node:277's unconditional internal call is named there as a live
      instance of violating it; it stays tracked in
      tactic-office-hours-self-modification-skill's body and was deliberately
      NOT pulled into this round's scope. STEELMAN (crash-only /
      recovery-oriented computing — Candea & Fox, 'Crash-Only Software', HotOS
      IX 2003): a component should have exactly one way to stop, and any state
      it must REMEMBER to write on the way out is soft state that will
      eventually be dropped; on that reading node-terminal is itself the design
      error, reapability should be derived by an external reconciler from
      durable state (node phase, PR, CI, pushed commits), and the record's own
      accepted residual (dispatch-self-close:75-78, 'a lane declaring via prose
      can drop the line') is exactly the failure crash-only predicts — with this
      session its first confirmed instance. DIVERGED (author, this round) on the
      marker's EXISTENCE: turn-yield-versus-terminal is knowledge only the
      session holds, since a reconciler reading durable state cannot distinguish
      'yielded mid-flight' from 'done' (the durable state is identical in both),
      so the marker carries information that is not reconstructable and removing
      it re-opens the 36e64744 incident class. ADOPTED crash-only's soft-state
      critique by narrowing what the marker carries: it asserts only 'my pass is
      over', and every richer question (did work land, should the node advance)
      is already answered from durable state. The residual is RE-PRICED rather
      than re-accepted — the 2026-07-28 entry priced a dropped declaration as a
      rare slip, 'cheap, recoverable, and operator-visible via the canary log
      line'; when the dropping lane is a routine SUCCESS path the price is a
      guaranteed deadlock on every success, which is why the implementing tactic
      carries a mechanical guard and not only the missing call. IMPLEMENTATION
      retained as draft tactic-qa-fix-node-terminal-declaration. Unit 2's
      feasibility is unverified — whether node-lane terminal-declaration
      coverage is mechanically checkable at reasonable cost was flagged as a
      bold recommendation and endorsed anyway; the recorded fallback, if it is
      not, is that Unit 2 shrinks to a documented audit rather than growing
      scope. DISJOINT from tactic-outcome-envelope-node-lane-parity, which owns
      a different defect in the same SKILL.md region (the numeric --issue
      argument on dispatch-emit-outcome / dispatch-write-phase-log, serving
      strategy-token-economy); the two touch adjacent lines of qa-fix/SKILL.md's
      node-lane terminal section and must not be planned as one. Nothing was
      held on trust this round — the author endorsed each resolution outright —
      so no born-parked review item is owed."
  - question: Is the office_hours park required at all, or can a plain rank-ordered
      decision tree (CI-running skip / CI-failed fix / conflict resolve / else
      execute) replace it?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-directed.) The
      park is required, but narrowly — and the proposal turned out to be
      substantially this graph's own already-shipped doctrine. The 2026-07-23
      clarification already fixed what a park asserts (no autonomous path
      forward exists; a human is required) and that owed mechanical labor never
      qualifies; the 2026-07-25 clarification already answered the taxonomy
      question with 'the defect is in the PRODUCERS, not the record', tracked as
      tactic-mechanical-park-producers, which merged as PR #2970 on 2026-07-26 —
      exit 11 no longer parks the source. /dispatch-conflict Lane 3 (node id in,
      reproduce the branch conflict, resolve, verify, push) merged as PR #2977
      and is phase done. So the round was spent on residue the record did not
      hold rather than on re-deciding the doctrine. The author's proposed
      ordering was corrected on one point (conflict must outrank CI-failed, see
      the precedence clarification) and its two gaps named: it declares no
      attempt cap, and 'attempt ff merge' is strictly weaker than the real `git
      merge --no-edit origin/main` provisioning already performs."
  - question: What exactly must a session pass end with, and what stops a node
      iterating forever when it does not?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-specified.)
      Every pass ends by DECLARING one of exactly three dispositions in the node
      — progression, bounded retry-by-design, or park — and then stopping. 'Pass
      ends' means the declaration happened; absent it the pass has not ended,
      the session must NOT be reaped so the author can debug it, and the node
      freezes behind the concurrency controls rather than iterating. The fuse
      breaker is therefore not the primary containment but a backstop for the
      residual: a pass that ends undeclared AND is reaped anyway, which leaves
      the node selectable with nothing recorded. It fires on the FIRST
      occurrence — author-selected one strike, on the reasoning that every
      recognized transient class is already contained (an undeclared mid-pass
      death is not reaped; a failed launch consumes nothing), so a
      reap-without-declaration is always a defect of the reaping path and should
      surface loudly the first time rather than be absorbed by a second chance.
      This SUPERSEDES the prior two-consecutive-strikes no-progress park in the
      failure-containment condition, and it resolves that condition's
      unreconciled contradiction with the 2026-07-25 'must not add mechanical
      parks' clause: an undeclared-but-reaped pass is an invariant violation,
      not a mechanical retry state, so parking it is correct. Confirmed against
      shipped code: dispatch-self-close already defaults to HOLD absent a
      matching marker, so the no-declaration-no-reap direction ships today.
      Scope limit recorded deliberately: this trichotomy governs session passes
      only, never tick-level skips. Re-scopes tactic-router-failure-fuses (still
      raw/unbuilt, so no migration is owed)."
  - question: Do merge conflicts self-heal against a moving main, and what follows
      for how they are routed?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-directed; AMENDS
      the 2026-07-25 park-taxonomy clarification's stated premise.) No — a merge
      conflict is not expected to self-heal. When a conflict is encountered the
      node always enters the conflict resolution lane. The 2026-07-25
      clarification's CONCLUSION survives unchanged (a conflict is not an
      office_hours park), but its REASON is corrected: conflicts are de-parked
      because an autonomous resolver exists to route them to, not because they
      resolve themselves. Two consequences follow. First, blind conflict retries
      have no justification at all — the only legitimate strike counter on this
      path counts consecutive failures to LAUNCH the lane, which is
      infrastructure retry, not conflict retry. Second, the two conflict
      producers must converge: provision exit 11 already spawns Lane 3
      immediately (dispatch-graph-execute:274) and is correct, while
      reconcile-graph-review-stall:320 still holds a CONFLICTING reviewed node
      immediately via hold-node with no resolution attempt and is now a defect.
      Tracked as tactic-review-stall-conflict-lane; the adjacent
      tactic-conflict-lane-exit11-retry-bound bounds ineffective lane kicks and
      is not superseded."
  - question: When a node's PR is both CONFLICTING and CI-failed, which condition
      wins — and where is that decided?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-selected.)
      Conflict outranks CI-failed, everywhere, because CI on an unmerged branch
      is testing stale code. The reviewed-node path already implements this
      correctly (transitions.ts:272-276, documented at :262-265 as 'CONFLICTING
      takes precedence over failing when both hold'). The normal path does the
      opposite and is a defect: graph-select-target enters the fix interrupt and
      COMMITS execution.fix to main — a graph write consuming attempt 1 of 3 —
      and only then does provisioning reach exit 11 and route to the conflict
      lane, so the write is wasted and an attempt is burned. The author's
      one-ordered-cascade proposal structurally cannot exhibit this, which is
      the one point on which it is better than the shipped design; the cascade
      unification itself is recorded as the greenfield with a migration path
      rather than taken now, because each of this round's smaller fixes removes
      a special case that would otherwise have to be carried into the unified
      form. Tracked as tactic-conflict-outranks-ci-precedence."
  - question: Does a non-progressing tick-level gate need a liveness bound, or only
      the gates that spend tokens?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-selected.) Every
      non-progressing gate needs a bound, not only the ones that spend money.
      Verified gap at recording time: pending CI has no liveness bound anywhere
      on the autonomous path — graph-select-target:628 skips as 'ci-pending'
      with no counter, provision-node-worktree:138 exits 10 'waiting' with no
      counter, reconcile-graph-review-stall maps pending to an unknown verdict
      and no-ops, and lib.sh:697-701 classifies an EMPTY rollup (checks never
      started) as pending. A grep of every tick script for
      timeout/stale/since/age/elapsed on a pending verdict returns nothing. So a
      PR whose checks never start, or whose run is cancelled, stalls its node
      forever with no counter, no hold, no park and no operator surface — the
      only stuck state in the system with no cap, against CONFLICT_STRIKE_CAP=5
      and FIX_ATTEMPT_CAP=3 elsewhere. This is NOT redundant with the fuse
      breaker: a tick-level skip spawns no session and declares nothing, so it
      falls outside the terminal trichotomy entirely. Tracked as
      tactic-autonomous-ci-pending-liveness-bound; the adjacent
      tactic-dispatch-explicit-ci-wait covers the explicit-node lane and
      expressly leaves the autonomous path unchanged, so it does not close
      this."
  - question: A node-worker session reads its skill body from the node's own
      worktree. Is that checkout guaranteed fresh enough for the skill to be the
      one that shipped?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-selected.) No,
      and for the conflict lane it is guaranteed STALE by construction. A
      node-worker session must read its instructions from fresh state; reading
      them from a possibly-stale node checkout is a defect. The conflict lane is
      the worst case because provision exit 11 fires precisely BECAUSE that
      worktree's merge with origin/main just failed and was aborted
      (provision-node-worktree:126-129), and the tick then spawns the lane into
      that same checkout (dispatch-graph-execute:274, --cwd \"$CONFLICT_WT\") —
      so the lane can never reliably read its own current instructions in
      exactly the situation it exists for. Observed live this session: Lane 3
      landed on main 2026-07-28T16:05; the tick spawned it at 16:39 into a
      worktree 142 commits and three days behind whose
      dispatch-conflict/SKILL.md contained only Lanes 1 and 2; the session read
      pre-Lane-3 instructions, found office_hours null, took Lane 2's 'wrong
      tool for this node' dead end, and the real conflict went unresolved.
      Generalizes to any phase skill spawned into a node worktree: skill
      improvements are invisible to nodes whose branches predate them. Tracked
      as tactic-node-worker-fresh-skill-body. AMENDED 2026-07-29 (same-day,
      after reading provision-node-worktree:98-132): the \"generalizes to any
      phase skill spawned into a node worktree\" clause above is OVERSTATED and
      is narrowed to the exit-11 path. provision-node-worktree:126 enforces a
      MERGED-TREE GUARANTEE — every phase runs on a tree that already contains
      origin/main — so a successful provision refreshes the worktree's skill
      bodies as a side effect, before any session is spawned. The exit-11
      conflict lane is the one path that spawns AFTER that merge failed and was
      aborted, and is therefore the only known exposure; worktrees are reused
      (provision only creates when the directory is absent), so staleness
      accumulates between merges and the merge is what normally clears it. A
      self-modifying node whose branch edits a skill still runs its own merged
      version rather than origin/main's, which is intended — that is how a skill
      change is exercised. The standing invariant is unchanged (a node-worker
      session must read its instructions from fresh state); only the claimed
      blast radius narrows. Recommended fix direction, recorded on
      tactic-node-worker-fresh-skill-body: spawn the lane with --cwd on the
      primary checkout while keeping --name <node-id>, since cwd conflates where
      the git work happens with where instructions come from, and Lane 3 already
      takes the node id as an argument. Both contracts the spawner's own comment
      warns about were verified to survive that change:
      worktree_has_live_session matches the session NAME (column 3 of claude
      agents --json) and never inspects cwd, and dispatch-stop.sh:63 keys on
      JOB_NAME plus intentions/<JOB_NAME>.md existing at the hook root, which
      holds in the primary checkout. REJECTED alternative: refreshing .claude/
      from origin/main before the spawn — 20 of 47 live node branches (43%)
      modify .claude/, disproportionately the dispatch-machinery nodes most
      likely to conflict there, so it would clobber in-flight self-modification
      work exactly where the fix is most needed."
  - question: The freeze that contains an undeclared pass depends on
      worktree_has_live_session. Is that containment durable?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-selected.) No —
      it lives outside the graph, and that is an open leak in the
      terminal-trichotomy design rather than a property that holds.
      worktree_has_live_session reads `claude agents --json`, described by its
      own helper header as the daemon-backed registry of live sessions. If the
      daemon restarts, the host reboots, or the job entry is garbage-collected,
      a held-for-debug session stops reading as live; the node becomes
      selectable with no declaration ever made, and the fuse breaker does NOT
      fire because nothing was reaped by dispatch-self-close — the evidence
      simply evaporated. The result is silent re-iteration, the exact outcome
      the containment exists to prevent. The fix direction is a durable record
      that a pass started and never declared, surviving a registry loss, so the
      vanished-session case becomes detectable rather than indistinguishable
      from 'no pass ever ran'. Boldness recorded honestly: the mechanism is
      verified from the helper's own header, but the frequency of registry loss
      is reasoned about, not measured. Tracked as
      tactic-claim-containment-durable-anchor; the adjacent
      tactic-graph-router-live-worker-read-robust covers tolerating an empty or
      partial read and does not close this, because after a genuine daemon
      restart the read is CORRECT and still reports no live session."
  - question: Is the terminal declaration the same thing as the graph write it asserts?
    answer: "(Recorded 2026-07-29 /align-strategy interview, author-selected.) No,
      and the decoupling is structural. mark-node-terminal writes a marker into
      $CLAUDE_JOB_DIR; the graph write (transition-node / park-node) is a
      separate operation, so the marker is a CLAIM ABOUT what happened rather
      than the happening. One direction fails safe: graph write lands, marker
      missing → dispatch-self-close HOLDs, which is the trichotomy's intended
      containment. The other does not: marker written, graph write failed → the
      session is reaped, the node is re-selected unchanged, and the fuse breaker
      sees a valid declaration so it never fires. The fix direction is to derive
      the terminal disposition from durable node state — either the reaper
      verifies the claimed disposition against the node at origin/main before
      reaping, or the marker becomes a consequence of the graph write rather
      than a parallel assertion. Tracked as
      tactic-terminal-declaration-verified-against-node. Distinct from
      tactic-qa-fix-node-terminal-declaration, which covers the opposite (safe)
      direction of a missing declaration and its mechanical guard."
  - question: The 2026-07-26 pause-field clarification's rationale lists the worker
      auto-close toggle among operator parameters that "already resolve through
      dispatch-config-load". Is that true of the toggle today, and does it
      change where the toggle belongs?
    answer: "(Recorded 2026-07-29 /align-strategy round, verified directly against
      origin/main at 64ccb60d so a future session does not read the clause as an
      observation of current state.) No — the clause is a TENSE error, and the
      direction it argues for is unaffected. The worker auto-close toggle does
      NOT resolve through dispatch-config-load and is entirely unbuilt. The
      loader's validated type allowlist is exactly eleven members — projects,
      jit, statements, target-workers, epic, auto-merge, force-opus,
      strict-preflight, sweep, selection-lock, census (dispatch-config-load:326,
      with the identical list in the usage strings at :10 and :328) — and
      carries no auto-close or worker-sessions member. And dispatch-self-close
      performs ZERO dispatch-config-load calls anywhere in its 216 lines: it
      gates the reap on two invariants only (the ROUTER continuation check at
      :160 and the node-worker marker check at :197, reaping at :216) and reads
      no operator configuration whatsoever. The clause's other two items ARE
      correct — max_concurrent_workers and weekly_pace_floor_pct both resolve
      through the allowlisted target-workers type (dispatch-config-load:166) —
      so exactly one of the three is false, and the uniformity argument it
      supports weakens from \"matches three existing parameters\" to \"matches
      two, and is the pattern the third is being built to\". That is a weaker
      premise, not a broken one: the pause field's home is unchanged. This is
      the same read-as-recorded-requirement correction the 2026-07-28
      implementation-status sweep applied to conditions 14, 16 and 17. DIRECTION
      UNCHANGED and still ratified: dispatch-config-load under dispatch.config/
      IS the auto-close toggle's home. It was finalized this same day in
      tactic-worker-self-close-configurable's landed plan (draft → phase
      implement, 2026-07-29) as a new `worker-sessions` schema type carrying an
      `auto_close` boolean, with the DISPATCH_SELF_CLOSE_AUTO_CLOSE environment
      variable surviving only as the test seam and never as a second operator
      path — that plan is recorded intent, not landed code. Two consequences
      recorded for the implementing round. (a) A new loader type is a FOUR-PART
      edit, because every existing type carries all four parts: the type
      allowlist plus BOTH usage strings, a validator branch (the force-opus arm
      at dispatch-config-load:542 is the closest template, being a
      single-boolean schema), the header schema prose block, and a
      `<type>.example.json` sibling (eleven exist today). A type that lands with
      only the allowlist entry is silently unvalidated. (b) Sibling
      tactic-dispatch-pause-config-field extends the SAME loader with the SAME
      boolean-field shape, so the two are a likely textual conflict in the type
      case statement, and whichever lands second should inherit rather than
      re-invent the convention. This is a coordination note, not a hard
      dependency — neither tactic needs the other's behavior, so no blocked_by
      edge is warranted. Standing convention stated once here because it
      generalizes to every default-true boolean config field, pause included:
      the absent-key test must be `jq -r 'if has(\"<key>\") then .<key> else
      empty end'`, never `jq -r '.<key> // empty'`, because `//` treats a
      literal `false` as absent and so silently collapses an explicit operator
      opt-out into the default — the polarity trap that makes a default-ON
      toggle impossible to turn off. Finally, no amendment is owed on the
      reaping side of this tactic: the 2026-07-29 declared-vs-undeclared
      clarification already records that dispatch-self-close \"already
      implements\" the marker-presence test (it greps `^node=` and ignores
      `disposition=`), and that the keep-all toggle layers on top of the default
      \"whatever the default's discriminator\" — so the toggle must not
      re-introduce a disposition enumeration, a framing that has now gone stale
      twice."
  - question: The 2026-07-25 fingerprint-custody round recorded four clarifications
      (entries 102-105) as held-on-trust — Claude-recommended-and-adopted rather
      than author-ratified — and enrolled them for ratification at
      tactic-review-sitting-fingerprint-custody-2026-07-25, along with the
      round's two 95 boosts. What is the author's ruling?
    answer: >-
      (Recorded 2026-07-30 office-hours sitting; AUTHOR-RATIFIED.) The sitting
      was held with the author present and produced six rulings.


      (1) Entry 102 — the substance-scoped fingerprint target, carrier
      tactic-scope-fingerprint-plan-substance — is RATIFIED AS RECORDED. The
      plan-substance vs machinery-output body-section convention it presumes is
      accepted as permanent graph structure, not a provisional device: a
      machinery append is definitionally not plan substance, and the convention
      that makes that distinction expressible is the substantive design work the
      carrier owns.


      (2) Entry 103 — the fingerprint-bound phase-evidence invariant, carrier
      tactic-phase-evidence-fingerprint-bound — is RATIFIED. The binding is
      mechanical across all three evidence surfaces (the phase-log entry, the
      qa-done marker, and the QA PR comment); a re-entry that finds completion
      evidence at a different fingerprint must RE-RUN the phase rather than
      ratify it. The round's rejection of both rivals is ratified with it: (a)
      having the demotion strike or clear the phase-log, and (b) documenting the
      rule as prose in /qa-fix's re-entry preamble with no mechanism.


      (3) Entry 104 — the prospective-only reading — is RATIFIED AS RECORDED.
      The binding is PROSPECTIVE: unstamped evidence reads as unbound, not as
      mismatched, and stays ratifiable on re-entry. The author was offered, and
      explicitly DECLINED, the stricter retroactive reading that entry 104
      itself flagged as needing an author decision (an unbound qa-done forces a
      re-run), because it would force a re-QA of every in-flight node. The
      Fingerprint & Freeze net guarantee is therefore restored only for evidence
      produced after the binding lands, and the window closes as the in-flight
      tactics cycle.


      (4) Entry 105 — the boundary against the standing phase-progress condition
      (resume-as-input for in-progress residue; re-run only for completed-phase
      evidence at a differing fingerprint) — stays a CLARIFICATION NOTE. The
      author-owned phase-progress condition text is NOT to be edited to absorb
      it.


      (5) The two 95 boosts on tactic-transition-node-stamp-landed-body and
      tactic-phase-evidence-fingerprint-bound are CONFIRMED as priority intent,
      but the SEQUENCING IS REORDERED. tactic-transition-node-stamp-landed-body
      — the immediate refresh_stamp repair, PR #2973 — must land AHEAD OF
      tactic-scope-fingerprint-plan-substance — the greenfield target, PR #2974.
      This restores the 2026-07-25 round's own "immediate fix before sequenced
      target" framing, which commit d84eb5b2 (2026-07-27, "graph: serialize the
      qa-fix Step 3.6 overlapping tactics") inverted as a side effect when it
      chained the other three behind tactic-scope-fingerprint-plan-substance to
      stop concurrent writers colliding on the shared qa-fix Step 3.6 paragraph.
      The serialization intent stands; only its head changes. Attention VALUES
      are unchanged at 96/95/95/96 — this ruling changes blocked_by ordering
      only. Landed topology after this sitting:
      tactic-transition-node-stamp-landed-body (blocked_by []) is the head;
      tactic-scope-fingerprint-plan-substance and
      tactic-phase-evidence-fingerprint-bound both hang off it;
      tactic-demote-node-stale-local-read stays behind
      tactic-phase-evidence-fingerprint-bound.


      (6) tactic-scope-stamp-in-graph stays RAW AND UNBOOSTED for now. Entry 115
      (2026-07-27) found that entry 102's shape leaves the residual hole this
      tactic names — author documentation edits still trip the scope-custody
      gate, and the stamp stays out-of-graph either way — so the carrier's
      diagnosis is accepted. The author nonetheless declined to boost or chain
      it at this sitting, because four nodes are already serialized on this seam
      with nothing landed in five days, and adding a fifth to the queue would
      buy no throughput.


      Recorded honestly as part of the ratification: the 2026-07-25 round's
      ACTUAL AskUserQuestion prompts and option sets are NOT retrievable. That
      round's commit 2cd33a7e carries a one-line message and stores no
      transcript. What the author ratified at this sitting is the CONTENT AS
      RECORDED in entries 102-105, reconstructed from those entries' own
      "Adopted .../Rejected rivals ..." language — not a recovered interview
      log. The process caveat the enrolling node recorded (the 2026-07-25 round
      ran in a background session and the harness signalled mid-round that human
      input could not be confirmed) is therefore discharged by re-deciding the
      recorded content in the author's presence, not by recovering what was
      originally asked.


      Observed state at ratification time, recorded so a later reader can date
      the ruling against the machinery: PRs #2973, #2974, and #2975 are all
      still OPEN DRAFTS; #2975 is red on type-safety-sensor; and the
      refresh_stamp defect entries 102-103 describe is still LIVE on origin/main
      — transition-node:213 lands the write via graph-commit, refresh_stamp runs
      after at transition-node:225, and graph-commit's cleanup does `git reset
      --hard "$ORIG_HEAD"` at graph-commit:344. Nothing in this sitting changes
      code; it ratifies doctrine and reorders the queue.
  - question: Is a classifier-denial freeze a mechanical retry state (excluded by
      the 2026-07-25 mechanical-park-producers clarification, which forbids new
      automated park producers for retry states) or a human-required
      office_hours escalation?
    answer: "(Recorded 2026-07-31 /align-tactics round, tactic-mode drift review on
      tactic-denied-command-parks-node.) A session frozen by an auto-mode
      classifier denial is a HUMAN-REQUIRED park, not a mechanical retry hold,
      so it routes through park-node and not hold-node. Derivation, not a new
      author decision: (a) park-node's own header already names
      \"provision-failed, wrong-worktree, or any other environment error a
      node's provisioning/dispatch can hit\" as park-eligible, and a classifier
      denial is exactly such an environment error; (b) condition 14 requires a
      MANUAL operator reap of a session that has not declared a terminal
      disposition, and a denied session is blocked at a permission prompt that
      no autonomous actor can answer — so no autonomous path forward exists,
      which is precisely what a park asserts per the 2026-07-23 clarification;
      (c) the node's own recorded direction excludes retry as the remedy (\"Do
      not route around a denial. Escalation is the correct response; a standing
      permission rule or the author running the command are the correct
      remedies\") — both remedies are human acts. The 2026-07-25 retry-state
      carve-out (a merge conflict against a moving main \"frequently
      self-resolves\") does not reach this case: a denial's nondeterminism means
      a RETRY would likely succeed, but no autonomous retry can be issued while
      the frozen session holds the worktree. Note the residual mechanism
      latitude left to the plan: office_hours on the affected node (park-node)
      versus a born-parked review item plus a blocked_by edge (hold-node) are
      both doctrinally sound surfaces for a human-required hold; the choice is
      plan-level."
  - question: Does fixing tactic-denied-command-parks-node also require reconciling
      claude_agents_count_busy_workers's busy-only filter with
      worktree_has_live_session, or is that reconciliation out of this tactic's
      scope?
    answer: (Recorded 2026-07-31 /align-tactics round.) Reconciling
      claude_agents_count_busy_workers (status==busy, so a blocked/waiting
      worker stops counting against the pace budget) with
      worktree_has_live_session (name-keyed, so any session in the worktree
      keeps holding the node) is FAMILY-scope work, not
      tactic-denied-command-parks-node's scope. The node itself files it as the
      secondary "deeper item" and instructs that
      tactic-denied-command-parks-node,
      tactic-phase-terminal-requires-disposition,
      tactic-standdown-winner-liveness and
      tactic-router-spawn-window-duplicate-worker be read together. The
      busy-only filter is a deliberate, documented pace-budget choice
      (lib-claude-agents.sh:596-600), so a unilateral change from this one
      tactic would reverse recorded design intent; this tactic delivers
      detection + escalation + a greppable journal line and leaves the pace-gate
      predicate untouched, naming that boundary explicitly in its out-of-scope
      section.
  - question: When a sweep external to a frozen node's own session parks that node
      (as tactic-denied-command-parks-node's plan does), does the park free the
      concurrency slot or reap the frozen session?
    answer: (Recorded 2026-07-31 /align-tactics round.) When a sweep external to a
      frozen node's own session parks that node, the park surfaces the freeze
      but does not resolve it — park-node's trailing mark-node-terminal call
      no-ops under its ownership gate, so the frozen session is not reaped and
      its worktree claim persists. This is consistent with condition 14's
      accepted freeze-for-debug (an undeclared pass is kept until an operator
      manually reaps it) rather than an exception to it, and it means the park's
      office_hours.recommendation MUST name the manual reap and the denied
      command verbatim, per the standing park-recommendation condition. It also
      means this tactic does not by itself restore the lost concurrency slot;
      that is the family-scope predicate reconciliation above.
  - question: In /align-tactics tactic mode, does the plan agent receive the target
      node's full body and rationale, or only its statement — and what does that
      imply for plan fidelity?
    answer: "(Recorded 2026-07-31 /align-tactics round.) /align-tactics tactic mode
      drops the target node's authored body and rationale before the plan phase:
      only `statement` reaches buildPlanPrompt (align-tactics.js:952-962 builds
      planTactics from target_node.id/.statement only). Because the write path
      then REPLACES the node body with the returned body_markdown, a plan
      authored from the one-sentence statement silently clobbers the node's
      recorded Context, its transcript-mtime detection recipe, its \"read this
      with its three siblings\" family instruction, and its \"do not dedupe
      against tactic-stopped-session-blocks-node\" caveat. Until the Workflow
      injects target_node.body/rationale, the plan agent must read the node file
      directly and carry that substance forward into the finalized body. This is
      a harness gap in the align-tactics machinery (itself in scope for this
      strategy), adjacent to but distinct from condition 7, which governs the
      RECORDING round rather than the planning round. Tracked as
      tactic-align-tactics-per-node-clarifications (per the 2026-07-28
      clarification recording the same gap)."
  - question: Does tactic-denied-command-parks-node need to add its own
      held-for-debug session count, given tactic-frozen-session-debug-count
      already owns one?
    answer: "(Recorded 2026-07-31 /align-tactics round.) The held-for-debug count
      landing under tactic-frozen-session-debug-count already sweeps a
      denial-frozen session into its total (its predicate is the complement of
      busy/idle, and a denied session reports status waiting).
      tactic-denied-command-parks-node must not re-author that counter; its
      distinct contributions are the denial-specific detector (transcript-mtime
      staleness per the node body's own recipe, plus a last-assistant-turn
      denial signature modeled on dispatch-detect-transient-death), the
      office_hours write, and a greppable journal line following the
      `lib-reservation-ledger: reclaimed reservation <wt> (<reason>)` format
      that dispatch-reclaim-audit already mines."
  - question: Does the exit-11 conflict-lane fix's
      (tactic-node-worker-fresh-skill-body) correctness depend on the primary
      checkout being CURRENT, not merely on the main branch?
    answer: (Recorded 2026-07-31 /align-tactics round.) The exit-11 conflict-lane
      relocation to --cwd "$PROJECT_ROOT" depends on the primary checkout being
      current, not merely on the main branch. That currency is NOT supplied by
      strategy-autonomous-execution's on-main condition, which explicitly
      disclaims it; it is supplied by dispatch-select-tick Step 1, where a
      failed fetch or failed `merge --ff-only origin/main` is terminal for the
      tick (sync-failed / sync-broken, exit before selection), so no worker is
      spawned on an unsynced primary checkout. Residual staleness is one
      intra-tick window, against the 142- and 365-commit node worktrees the
      tactic removes.
  - question: Is the 'the Stop hook does not reliably fire the park after a session
      awaits a background Workflow' root-cause claim (recorded in
      tactic-phase-terminal-requires-disposition's rationale) verified against
      the hook's own source?
    answer: "(Recorded 2026-07-31 /align-tactics drift review of
      tactic-phase-terminal-requires-disposition.) The node-lane escalation path
      in /qa-fix, /qa-main, /review-fix and /fix-checks writes only
      $CLAUDE_JOB_DIR/office-hours-reason (plus -recommendation, -pr) and
      delegates the actual park to .claude/hooks/dispatch-stop.sh —
      .claude/skills/qa-fix/SKILL.md:190-192 is the pattern, and none of the
      four calls park-node in-session. On 2026-07-31 that delegation produced
      office_hours: null on origin/main for
      tactic-graph-commit-intentions-base-stale-restore even though the
      escalating session had written both office-hours-reason and
      office-hours-recommendation to its job directory. The OUTCOME is
      evidenced; the MECHANISM is not. The session's self-report — 'the Stop
      hook does not reliably fire the park after a session awaits a background
      Workflow' — is not reproducible from the hook source:
      dispatch-stop.sh:56-98 fires its park branch unconditionally on every Stop
      event, gated only on CLAUDE_JOB_DIR / state.json / node-file existence.
      Recorded so that no plan treats the stated mechanism as established fact:
      the fix shape that does NOT depend on the root-cause diagnosis already
      exists as the legacy issue lane's belt-and-suspenders precedent
      (dispatch-mark-deviation runs dispatch-apply-office-hours in-session
      FIRST, keeping the marker only as a Stop-hook fallback, per #2541), with
      .claude/skills/dispatch-conflict/SKILL.md:948-965 as the worked node-lane
      call shape for an in-session park-node invocation."
  - question: Who owns reconciling the four-member 'held vs being worked' family's
      shared family-scope predicate work (claude_agents_count_busy_workers's
      busy-only filter vs worktree_has_live_session), now that
      tactic-denied-command-parks-node has explicitly scoped it out of itself?
    answer: "(Recorded 2026-07-31 /align-tactics drift review.) The four-member
      'held vs being worked' family — tactic-denied-command-parks-node,
      tactic-phase-terminal-requires-disposition,
      tactic-standdown-winner-liveness,
      tactic-router-spawn-window-duplicate-worker — currently has no node owning
      its family-scope work. tactic-denied-command-parks-node's own 2026-07-31
      clarifications declared the reconciliation of
      claude_agents_count_busy_workers' busy-only pace filter
      (.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:590-628)
      with worktree_has_live_session's any-status name match
      (.claude/skills/dispatch-propagate/scripts/graph-select-target:665-673) to
      be FAMILY scope and explicitly out of its own scope, and the remaining two
      members are still status: raw / phase: null on origin/main. Observation
      only — it gates no individual member's plan — but as currently scoped no
      member will plan the family-scope predicate reconciliation, so it needs a
      home before the family is considered closed."
  - question: In a tactic-mode (per-node) /align-tactics round, does the drift
      phase's eligibility sanity check apply the strategy-round decomposability
      gates (no non-draft child already on its signal path, rounds.count < 2),
      or only the gates that bind at the per-node level?
    answer: "(Recorded 2026-07-31 /align-tactics per-node round on
      tactic-align-tactics-target-node-context-dropped.) In a tactic-mode
      (per-node) /align-tactics round the drift phase's ELIGIBILITY SANITY CHECK
      is answered against the per-node disposition, not against strategy-round
      decomposability. Two of its clauses — 'no non-draft child tactic already
      on its signal path' and 'rounds.count < 2' — are strategy-round concepts
      that references/tactic-target.md:16-24 explicitly excludes from the
      per-node flow ('no strategy decomposition, no draft sweep, and no rounds
      bump here'), and align-tactics.js skips the decompose phase outright under
      `mode !== 'tactic'`. Answering decomposable=false on those clauses in
      tactic mode reproduces the defect recorded on
      tactic-align-tactics-tactic-mode-drift-gate (PR 2982, phase review):
      driftProceed=false zeroes planTactics for BOTH modes, so the run returns
      body_markdown:null and disposition 'escalated' with drift.parks empty — no
      park, no office_hours reason, an unrecoverable dead end. This round
      therefore returned proceed=true on the strength of the applicable gates
      only (office_hours null, reading null, last_aligned null, rounds.count 0),
      which hold independently. Until PR 2982's mode-aware
      computePhaseGates(mode, drift) split lands, this reading is the doctrine a
      tactic-mode drift agent applies."
  - question: "Do any tactics serving this strategy carry `status: raw` together
      with a non-null `phase`, and if so what does that imply for
      align-tactics-census.ts's open-machinery-defect count?"
    answer: "(Observed 2026-07-31 /align-tactics per-node round.) Three tactic nodes
      serving this strategy carry `status: raw` together with a non-null `phase`
      — tactic-dispatch-stop-backstop-comment (raw/implement),
      tactic-graph-commit-staleness-silent-revert (raw/done), and
      tactic-review-sitting-fingerprint-custody-2026-07-25 (raw/done). Work
      proceeded on these without the node ever being promoted out of draft
      status, so they are simultaneously counted as unconsumed drafts by a
      corpus scan and as in-flight/complete by a phase scan. This matters to
      success_signal.sensor: align-tactics-census.ts enumerates 'the open
      machinery-defect population serving this strategy', and a status/phase
      inconsistency of this shape double-counts or under-counts that population
      depending on which field the census keys on. Immaterial to any single
      tactic's plan; recorded as an integrity observation about the census
      instrument, not a blocker."
  - question: Do multiple open tactics serving this strategy currently make
      overlapping edits to the same file (.claude/workflows/align-tactics.js),
      and if so does landing them safely require an author decision or just
      edit-region separation?
    answer: "(Observed 2026-07-31 /align-tactics per-node round.) Three open tactics
      now modify overlapping regions of the single file
      .claude/workflows/align-tactics.js:
      tactic-align-tactics-tactic-mode-drift-gate (phase review, PR 2982)
      rewrites the folded `driftProceed` plan gate into a mode-aware
      computePhaseGates(mode, drift) and threads `mode` into buildDriftPrompt;
      tactic-align-tactics-per-node-clarifications (status raw) widens
      DRIFT_SCHEMA.clarifications_to_add from {answer} to {question, answer} and
      edits buildDriftPrompt's instruction text; and
      tactic-align-tactics-target-node-context-dropped (this round's target)
      extends the tactic-mode planTactics literal and buildPlanPrompt. The three
      edits are separable by region (plan gate / drift schema+prompt / plan
      prompt+planTactics) but land in one file, so ordering is a merge-conflict
      concern rather than a design question — expressible as blocked_by edges
      among the tactics, requiring no author decision. Recorded so a later round
      does not re-derive the overlap from scratch."
  - question: Does the 2026-07-31 clarification's stated ground for
      tactic-denied-command-parks-node not authoring its own held-for-debug
      counter — that tactic-frozen-session-debug-count's counter 'already sweeps
      a denial-frozen session in' via a busy/idle complement predicate — hold
      against the shipped function?
    answer: (Recorded 2026-07-31 /align-tactics tactic-target round, drift review of
      tactic-claim-containment-durable-anchor.) The 2026-07-31 clarification
      asserting that the held-for-debug counter landing under
      tactic-frozen-session-debug-count already sweeps a
      classifier-denial-frozen session into its total — 'its predicate is the
      complement of busy/idle, and a denied session reports status waiting' — is
      contradicted by the shipped function. claude_agents_count_held_for_debug
      (.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1051-1116)
      keys on an explicit terminal-state enumeration
      (done|stopped|killed|failed|errored|error|cancelled|canceled|terminated),
      and its own comment at :1064-1069 records that a complement-of-busy/idle
      predicate was REJECTED specifically because it 'would ... count LIVE
      blocked sessions (waiting on input/permission) as held.' As shipped, a
      denial-frozen session (state blocked / status waiting) is therefore
      counted by NEITHER claude_agents_count_busy_workers (busy-only,
      :1040-1048) nor the held-for-debug counter — it is invisible to both
      surfaces. This does not reverse tactic-denied-command-parks-node's scoping
      decision, whose distinct contributions (the denial-specific detector, the
      office_hours write, the greppable journal line) are what make the case
      visible at all; it corrects the stated GROUND for that decision, which as
      recorded does not hold.
  - question: Was the 2026-07-28 office-hours ratification's option (b) — the drain
      skill calling mark-node-terminal with a new `park-clear` disposition
      member — actually implemented, on either side (mark-node-terminal's enum
      or dispatch-self-close's mirror)?
    answer: "(Recorded 2026-07-31 /align-tactics tactic-target round.) The
      2026-07-28 office-hours ratification records that option (b) was
      implemented with 'a new `park-clear` member added to that script's
      disposition enum (packages/intentionsutil/scripts/mark-node-terminal:67)'.
      It was not. On origin/main the enum at mark-node-terminal:73-79 still
      carries the original eight members
      (advance|demote|park|fix-attempt|align-round|no-claim|conflict-resolved|c\
      onflict-hold), dispatch-self-close:47-52 mirrors the same eight, and
      `park-clear` appears nowhere in .claude/skills/ or packages/ — only in
      intentions/*.md prose. No drain skill calls mark-node-terminal at all. So
      the ratified fix is unimplemented on BOTH sides, and the defect it
      resolved is still live: the office-hours drain's green-CI success path
      declares nothing, dispatch-self-close HOLDs the job, and the node it just
      unblocked stays frozen. A drain that called `mark-node-terminal <node>
      park-clear` today would exit 2 on the unknown disposition and write no
      marker at all. Condition 14 is unaffected — dispatch-self-close reads only
      `^node=`, so a missing member changes no doctrine — which is precisely why
      the gap went unnoticed. Carried in prose in
      tactic-office-hours-self-modification-skill (status raw, phase null); no
      node carries it as a planned unit."
  - question: Between a node's selection and its first phase transition, what
      durable evidence exists today that a pass has started — and does the
      daemon-registry sweep preserve or erase that evidence once a live session
      registers?
    answer: "(Recorded 2026-07-31 /align-tactics tactic-target round, drift review
      of tactic-claim-containment-durable-anchor.) As of this round the dispatch
      spawn path writes NO graph-side record that a node has been claimed.
      dispatch-graph-execute's only claim-time write is reservation_mark_spawned
      (:159) into the file ledger under
      <project-root>/tmp/dispatch-reservations; the node's next durable graph
      write is its first phase transition. Between selection and that
      transition, the only evidence a pass exists is the daemon registry plus
      that ledger — and reservation_sweep rule (a) ('live-worker-redundant',
      lib-reservation-ledger.sh:593-596) deliberately CLEARS the ledger marker
      the instant a live session registers under the worktree basename, handing
      sole authority to the registry. This is why the leak recorded in the
      2026-07-29 containment-durability clarification is total rather than
      partial: after a registry loss the node reads as never-claimed, not as
      claimed-and-stale, so no reconciler can currently tell the two apart.
      Recorded as the factual ground under that tactic's store question, not as
      an answer to it."
  - question: Is the drift phase's eligibility sanity check (buildDriftPrompt)
      mode-aware, and does its 'no non-draft child tactic already on its signal
      path' clause correctly gate a tactic-mode per-node round against this
      strategy's 64 non-draft children?
    answer: "(Recorded 2026-07-31 /align-tactics tactic-target round.) The drift
      phase's eligibility sanity check is stated mode-blind: buildDriftPrompt
      (.claude/workflows/align-tactics.js:541) receives only the strategy record
      and the gather evidence, never `mode`, so a tactic-mode round is handed
      the strategy-mode gate verbatim — including 'it has no non-draft child
      tactic already on its signal path'. strategy-graph-native-dispatch carries
      64 non-draft children, so a literal reading of that clause would park
      every per-node finalize round run on this strategy, even though
      align-tactics.js:907-912 skips the decompose phase entirely when mode is
      'tactic' and the clause exists only to prevent a redundant strategy-level
      decomposition. Read the clause as inoperative in tactic mode; the
      operative gates there are the strategy's office_hours, the fresh-reading
      gate, and rounds.count. This is a defect of the prompt builder, not of
      this strategy — adjacent to the recorded align-tactics harness gaps
      (tactic-align-tactics-target-node-context-dropped,
      tactic-align-tactics-per-node-clarifications), and a candidate unit for
      whichever of those owns buildDriftPrompt's inputs."
  - question: Does the 2026-07-29 pending-CI liveness clarification's 'or whose run
      is cancelled' case still need bounding, or is it already covered?
    answer: "(Recorded 2026-07-31 /align-tactics round, tactic-mode drift review on
      tactic-autonomous-ci-pending-liveness-bound.) The 2026-07-29 pending-CI
      liveness clarification's phrase \"or whose run is cancelled\" overstates
      the verified gap by one case. dispatch_classify_rollup already maps a
      CANCELLED check-run conclusion to \"failing\"
      (.claude/skills/dispatch-propagate/scripts/lib.sh:712), not to
      \"pending\", so a cancelled run is already actionable through the existing
      fix-interrupt path and is already bounded by FIX_ATTEMPT_CAP=3. The
      genuinely unbounded case is narrower than the record states: an EMPTY
      statusCheckRollup (checks never started, lib.sh:697-701) or a run that
      stays in-progress indefinitely — both classify as \"pending\" with no time
      dimension anywhere in the classifier. Every other gap site the 2026-07-29
      clarification named is confirmed verbatim against current code:
      graph-select-target:639-644 (sensor_gate qa|review arm, rc 1 -> echo
      ci-pending, return 1, no counter), provision-node-worktree:372-384 (exit
      10 \"not actionable yet\", no counter),
      reconcile-graph-review-stall:214-225 (pending -> VERDICT=unknown ->
      reviewStallRoute returns null -> silent no-op). This narrows the tactic's
      scope; it does not change the decision to bound the state."
  - question: Does a pending-CI liveness bound claim the reserved `no-progress`
      hold-kind slug, or must it mint its own?
    answer: "(Recorded 2026-07-31 /align-tactics round, tactic-mode drift review on
      tactic-autonomous-ci-pending-liveness-bound.) hold-node-decide.ts reserves
      an unclaimed hold-kind slug `no-progress` (RESERVED_KIND_SLUGS, ~line 87)
      with the doc comment \"RESERVED for a different tactic's future per-node
      no-progress fuse\". That reservation belongs to the terminal-trichotomy
      fuse breaker of the router-failure-containment condition (tracked as
      tactic-router-failure-fuses), not to a pending-CI liveness bound. This is
      a derivation from the record rather than a new author decision: the
      2026-07-29 liveness clarification already fixes that a tick-level skip
      \"spawns no session and declares nothing, so it falls outside the terminal
      trichotomy entirely\" and is expressly NOT redundant with the fuse
      breaker. A pending-CI bound must therefore mint its own hold kind (e.g.
      `ci-pending-stalled`) by extending HOLD_KINDS + KIND_SLUGS in
      hold-node-decide.ts, reusing the existing holdIdFor / find-or-create /
      born-parked-hold machinery, and must not claim the reserved slug."
  - question: Must a pending-CI liveness bound keep advancing under the
      paused-scheduling standing operating mode, and where does that constrain
      the counter's placement?
    answer: "(Recorded 2026-07-31 /align-tactics round, tactic-mode drift review on
      tactic-autonomous-ci-pending-liveness-bound.) A liveness bound must keep
      advancing in the paused-scheduling standing operating mode. This follows
      from that condition's own framing — pause is a supported STANDING mode,
      not a degraded or temporary state, and it gates worker spawning only —
      extended from ledger-consuming invariants to liveness bounds generally.
      Mechanically it constrains where the counter lives: a tick-counted
      pending-CI bound belongs in dispatch-select-tick's unconditional
      reconciliation sweep block (dispatch-select-tick:509-538, beside
      reconcile-graph-merged and reconcile-graph-review-stall, best-effort and
      not gated on OPEN_MAIN_RED), not solely in the selection gate
      (graph-select-target sensor_gate) or the provisioning gate
      (provision-node-worktree exit 10), neither of which runs while spawning is
      paused — a counter that only advances when workers spawn would never fire
      in exactly the mode where manual dispatch most needs the operator surface.
      A wall-clock age source (the PR's updatedAt) is the alternative that is
      pause-insensitive by construction. The choice between tick-count and
      wall-clock, and between a graph-state counter (execution field, survives
      worktree loss, costs a write per bump) and a fail-open sidecar counter
      (the dispatch-graph-execute .conflict-strikes convention), stays
      plan-level; recorded so a later round does not rediscover the pause
      interaction."
  - question: Does an ineffective Lane 3 dispatch-conflict session accumulate
      unbounded live-session claims (per-tick respawn), or does something else
      happen — and does that change tactic-conflict-lane-exit11-retry-bound's
      fix shape?
    answer: "(Recorded 2026-07-31 /align-tactics round, resolved from landed code —
      supersedes the 'needs production observation' note in
      tactic-conflict-lane-exit11-retry-bound's Provenance.) A Lane 3
      `/dispatch-conflict` session spawned by dispatch-graph-execute case 11
      (`dispatch-spawn-job --no-verify --name \"$id\" --cwd
      .claude/worktrees/$id`) that dies without writing a
      `$CLAUDE_JOB_DIR/node-terminal` marker HOLDS rather than respawning.
      dispatch-stop.sh discriminator 2 hands it to `dispatch-self-close --node
      <id>`, which keeps the job alive; `worktree_has_live_session` now reads
      the REGISTERED view (`claude agents --json --all` via
      claude_agents_list_registered, lib-claude-agents.sh:796-851, landed in
      a9df9d38 and 0f55a784) with no timeout by design; and
      graph-select-target:684 skips any node whose own-id worktree has a
      registered session. The node therefore becomes permanently unselectable
      after exactly ONE kick — there is no accumulation of repeated kicks and no
      second exit-11 observation. Consequence for
      tactic-conflict-lane-exit11-retry-bound: its recorded Recommended fix ('N
      consecutive exit-11 ticks ... reuse the existing
      `.claude/worktrees/<id>.conflict-strikes` sidecar or add a sibling')
      cannot ever fire, because exit 11 never re-fires for a frozen node. The
      bound must be an EXTERNAL detector over registered-but-undeclared
      node-worker sessions, never a selection-side per-tick counter. The
      tactic's ratified scope is unchanged; only the mechanism named in its
      Provenance was dead — its finalized plan builds the external sweep
      (lib-conflict-lane-hold.sh) instead."
  - question: Does tactic-graph-router-conflict-routing's future execution.conflict
      interrupt supersede tactic-conflict-lane-exit11-retry-bound, and where
      does the bound actually need to live?
    answer: "(Recorded 2026-07-31 /align-tactics round.) No. Because the exit-11
      retry bound must move out of the selection-side per-tick path,
      tactic-graph-router-conflict-routing's `execution.conflict` interrupt does
      NOT supersede tactic-conflict-lane-exit11-retry-bound: that interrupt is a
      second entry path into the same Lane 3 and is itself evaluated during
      selection, so it cannot observe a node that a registered session has
      frozen out of selection. The 'land the cap wherever that interrupt will
      enforce it rather than deepening the interim ladder' guidance in the
      tactic's Provenance, and the CONVERGENCE NOTE at
      dispatch-graph-execute:274-281, therefore do not constrain this tactic.
      Its finalized home is an external frozen-session sweep
      (lib-conflict-lane-hold.sh, wired into dispatch-tick on both cadences)
      built independently of tactic-denied-command-parks-node's own in-flight
      sweep (PR #2994, phase qa, not on origin/main as of this round — that
      sweep's detector is scoped to `state == \"blocked\"` and does not cover a
      stopped-but-registered undeclared exit, so no blocked_by dependency was
      taken)."
  - question: Which escalation primitive — hold-node or park-node — governs a frozen
      Lane 3 session of exit-11 lineage?
    answer: "(Recorded 2026-07-31 /align-tactics round.) `hold-node --kind
      provision-conflict`. Two standing clarifications point at different
      primitives for a frozen node in general (the 2026-07-25
      mechanical-park-producers rule routes provision-conflict states to
      `hold-node`, forbidding office_hours on the source; a later frozen-session
      sweep precedent calls park-node directly on the source). For
      exit-11-lineage freezes specifically, `hold-node --kind
      provision-conflict` is the resolved choice: it is already the exit-11
      backstop's own escalation call site in the same script
      (dispatch-graph-execute, also used by case 14), it satisfies the
      no-office_hours-on-source doctrine, and reusing the kind means this hold
      and the launch-failure backstop's hold resolve to the SAME id
      (`tactic-hold-conflict-<slug>`) rather than forking a second record.
      Either way the escalation must NOT reap the frozen session: consistent
      with the accepted freeze-for-debug doctrine and the standing
      park-recommendation condition, the recommendation text must name the
      manual `claude rm <session-id>` reap verbatim as the human's own action,
      and must carry the mandatory RESOLUTION_SENTENCE (hold-node-decide.ts)
      rather than a re-typed paraphrase."
  - question: "Does PR #2889 (tactic-align-skills-latest-graph-guard, merged
      2026-07-18) close the phase-skill entry-gate gap that
      tactic-phase-entry-selection-gate targets?"
    answer: "(Recorded 2026-07-31 /align-tactics per-node round on
      tactic-phase-entry-selection-gate.) PR #2889
      (tactic-align-skills-latest-graph-guard, merged 2026-07-18) does NOT close
      the phase-skill entry-gate gap, resolving the 'overlap to verify first'
      question that clarification 1 (2026-07-19) and the draft tactic's own
      first unit left open. Verified directly at HEAD 06c19a40: #2889's diff
      touches only the align-family SKILL.md Step-0 text plus
      .claude/skills/dispatch-propagate/scripts/assert-worktree-fresh, and that
      script is detect-only freshness (git fetch + behind-count vs origin/main)
      — it never calls check-node-selection.ts and never reads phase,
      office_hours, or any fingerprint. A tree-wide grep confirms
      packages/intentionsutil/scripts/check-node-selection.ts has exactly one
      functional call site: provision-node-worktree:125 (clarification 1 and the
      tactic body both cite ':87'; the file has grown, the call is unchanged).
      align-tactics/SKILL.md:113 and align-strategy/SKILL.md:96 still route
      re-entry through assert-worktree-fresh alone. So #2889 is a freshness
      layer, not a selection-validity layer: the tactic's verification unit
      resolves to 'no overlap — proceed with the explicit gate', and the tactic
      is not droppable."
  - question: What is the actual per-phase-skill-entry primitive in service today,
      and does it already run the mechanical selection-validity gate
      (check-node-selection.ts)?
    answer: (Recorded 2026-07-31 /align-tactics per-node round on
      tactic-phase-entry-selection-gate.) The per-phase-skill-entry primitive
      actually in service today is
      .claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target,
      wired into /implement, /qa-fix, /qa-main, /review-fix and /fix-checks via
      --expect-phase / --expect-fix-active. Its Step-5 gate (~lines 148-163)
      hand-rolls only a SUBSET of check-node-selection's checks — bare
      phase-string equality, or execution.fix non-null — and checks neither
      office_hours-parked, nor strategy_fingerprint staleness, nor
      align-eligibility, nor scope-chain staleness. /qa-fix bolts a second
      hand-rolled parked check on top (SKILL.md:96 and
      references/target-resolution.md:44-67), whose own comment concedes it
      'must agree with the canonical selection gate readParked
      (check-node-selection.ts:90-93)'; the other four skills lack even that
      partial copy. dispatch-derive-node-target already snapshots the node from
      origin/main and holds NODE_JSON/COMBINED_JSON in memory — the exact inputs
      the gate needs — so routing it through check-node-selection.ts reuses a
      read it already performs. Any implementation of the entry-gate requirement
      should collapse these duplicates through the canonical gate rather than
      add a sixth partial reimplementation, and should treat align-tactics
      separately since it uses assert-worktree-fresh, not this front door.
  - question: What complicates binding check-node-selection.ts uniformly across
      every align-family entry path?
    answer: "(Recorded 2026-07-31 /align-tactics per-node round on
      tactic-phase-entry-selection-gate.) check-node-selection.ts takes a
      required positional <selected-phase> and exits 12 when node.phase differs,
      so binding it to the align-family entry path requires deciding what phase
      argument a draft-tactic finalize passes — the target node itself is phase:
      null, and a router phase worker always has one while a manual
      /align-tactics invocation does not. The gate already models align-tactics'
      two selection shapes internally (strategy at null phase, frozen-tactic
      re-eval), so this is resolvable in code rather than by new doctrine, but
      the recorded requirement does not distinguish the draft-finalize case from
      a re-plan of an already-phased tactic and an implementing plan must.
      Relatedly, the gate cannot simply be folded into assert-worktree-fresh for
      all callers: align-strategy and grounding-research invoke that script with
      no phase concept at all. The requirement binds phase-skill entries, per
      its own wording — freshness first, selection-validity second, and only
      where a selected phase exists."
  - question: Do the strategy-main-health boost-100 write-path guard and the
      PR-title <node id> CI guard conditions have corroborating code today?
    answer: "(Observed 2026-07-31 /align-tactics per-node round; recorded as an
      observation, not a re-decision of an author-decided condition.) Two
      recorded conditions describe mechanisms that targeted searches could not
      corroborate at HEAD 06c19a40. (a) The strategy-main-health standing-boost
      condition says validate-graph/graph-commit 'refuses a commit that authors
      another boost or override at or above it, or that reduces it' —
      packages/intentionsutil/scripts/validate-graph.ts contains no occurrence
      of 'boost' at all; the only intentionsutil sources naming boost are
      src/attention.ts, src/goals.ts, src/officeHours.ts and src/schema.ts
      (ranking and schema) plus scripts/trace-decisions.ts (diff display). No
      write-path refusal was found. (b) The PR-title '<node id>: <short
      description>' condition says 'a CI guard rejects a title that is
      non-conforming or whose id does not resolve' — no title conformance check
      exists in .github/workflows/ or .github/scripts/, dispatch-open-pr still
      accepts a free-form --title, and the implementing tactic
      tactic-pr-title-node-id-convention is still status:raw / phase:null.
      Neither is treated as a failed condition on this evidence: both read as
      recorded doctrine awaiting implementation, and neither is a premise any
      plan of this round depends on. Flagged so a future author sitting can
      decide whether to arm the mechanisms or restate the conditions as target
      state."
  - question: What must a dispatch lane do when it cannot invoke its named instrument?
    answer: "(Recorded 2026-07-31 interview.) Fail the lane. A lane that cannot
      invoke its named instrument never substitutes an ad-hoc equivalent, and
      never reports substituted output under that instrument's name. This binds
      for every named instrument a lane delegates to — a vendor skill, one of
      our own scripts, an external service — not only for vendor instruments,
      because the failure mode is not vendor-specific: an agent directed to run
      one of our scripts can hand-roll it just as readily. Live instance: across
      18 review-fix runs (2026-07-27 to 07-31) every Skill(code-review) call was
      rejected with disable-model-invocation; the finder agent read the
      rejection, wrote \"I'll perform the review directly at max effort\", and
      ran roughly 39 tool calls of its own review, which the workflow then
      reported as the built-in's output. Nothing in the pipeline detected this
      for four days, and a strategy divergence was recorded on the strength of
      it (strategy-token-economy clarification 21). The doctrinal ground is
      virtue-progressive-detachment's floor — the capability to read, evaluate,
      and reason about what the delegatee produces is the floor under every
      recovery path. What failed was not skill atrophy but the absence of any
      check that the delegatee produced anything at all: an unexercised
      delegation is a hope, not a delegation. A lane failing this way parks with
      the rejection as its recorded reason, per the standing park-context
      condition, rather than proceeding on substituted output."
  - question: A main-qa verification test recorded by the qa phase always entered
      the dispatch queue first and parked to office-hours only after a worker
      had already analysed it. Where is a post-merge verification test's
      destination decided, and what is the routing unit?
    answer: "(Recorded 2026-07-28 /align-strategy interview.) Standing requirement:
      a post-merge (main-qa) verification test is sorted to its terminal queue
      AT RECORD TIME, by the qa phase that discovers it; a dispatch worker never
      boots to discover that a test needs the author. The record already
      asserted this invariant —
      .claude/skills/qa-fix/references/needs-main-followups.md, node lane:
      'verifiability is triaged here at record time ... This makes the legacy
      boot-then-reject waste structurally impossible on the node lane' — but the
      machinery could not deliver it, because the ROUTING UNIT was the source
      tactic and a source tactic has exactly one destination. /qa-fix appended a
      '## needs-main residue' section to the source's own body and advanced it
      review -> main-qa, so mixed residue could not be split, and an
      author-required item could not be parked at qa time without blocking the
      very merge its observation depends on. Live cost:
      tactic-execution-pr-merge-verification residue item 12 booted /qa-main,
      which analysed it and concluded 'not browser-verifiable — its url_path
      names a repo script, not a web page', parked 2026-07-28, and was then
      drained by human override. Greenfield design adopted: the sorting unit
      becomes the routing unit. At qa record time /qa-fix writes STANDALONE
      tactic-mainqa-* nodes — grouped by destination, at most two per source
      (one carrying all machine-verifiable items, one carrying all
      author-required items, either omitted when empty) — instead of a residue
      body section. Birth state IS the routing decision, reusing the shape
      already live on the migrated tactic-mainqa-* nodes: machine-verifiable ->
      phase main-qa, office_hours null, owner ai (dispatch queue);
      author-required -> phase main-qa, office_hours {reason, since,
      recommendation}, owner human (office-hours queue only — the selector's
      tactic eligibility requires office_hours null,
      packages/intentionsutil/src/router.ts:197, so it is never selectable).
      Both carry execution.pr (the deploy to check) and blocked_by [<source
      tactic>]: on the machine lane that is a merge gate, on the author lane it
      is the readiness advisory office-hours already surfaces as a
      signal-not-gate, and it self-clears correctly because pruning the done
      source strips inbound blocked_by in the same commit and absence reads as
      completion (inboundBlockers,
      packages/intentionsutil/src/transitions.ts:265-272). The source tactic
      then goes review -> done directly: no main-qa phase on the source, no
      residue body append. The sorting predicate is unchanged — the
      autonomous|human criteria already recorded in needs-main-followups.md
      section 1, uncertain -> author. main-qa remains a valid standing phase;
      only the SOURCE's use of it is retired. Measurement: the mis-sort rate —
      /qa-main cannot-verify parks on nodes born office_hours null, over all
      machine-sorted main-qa nodes; sensor is a graph census over parked main-qa
      nodes (a cannot-verify park on a machine-sorted node IS a mis-sort by
      construction, so this is a direct count, not a proxy); threshold at most 1
      in 20. Recorded honestly: the opposite direction — an author-sorted item
      Claude could have verified — is NOT mechanically observable and stays
      unmeasured. This measurement is recorded here rather than in
      success_signal because that slot carries this strategy's broader lifecycle
      signal, which still holds and is not displaced by a narrower one.
      Supersedes entry 22 (2026-07-04), whose answer located post-merge residue
      in a body section of the source node; amends the parenthetical in entry
      111 (2026-07-27) that 'main-qa is reachable only via review -> main-qa on
      needs-main residue' — under this design main-qa is reached by a
      verification node being BORN at it, while forwardPhase remains the single
      home of phase routing exactly as entry 111 requires. AMENDED 2026-07-31
      (/align-strategy): the clause \"The sorting predicate is unchanged — the
      autonomous|human criteria already recorded in needs-main-followups.md
      section 1\" NO LONGER HOLDS. That predicate sorts on browser-reachability,
      not on machine-verifiability, which is the defect
      tactic-qa-main-verifiability-sort-criterion exists to close; see the
      2026-07-31 entry recording the corrected predicate and the `owner` sort
      mark. The mis-sort measurement above is likewise restated on `owner: ai`
      rather than on birth-office_hours-null, because office_hours is cleared on
      drain and cannot carry the mark."
  - question: Condition 20 requires the machine-verifiable/author-required sort to
      be an explicitly recorded state, never inferred from whether office_hours
      is set — but entry 123 encodes it as exactly that inference. Where does
      the mark actually live, and is the sorting predicate itself correct?
    answer: >-
      (Recorded 2026-07-31 /align-strategy interview, ratifying the office_hours
      park on tactic-qa-main-verifiability-sort-criterion.) Two rulings.


      FIRST — WHERE THE SORT MARK LIVES. No new field and no schema change: the
      mark is the existing required-core `owner` field. Greenfield (entry 123's
      shape): each standalone tactic-mainqa-* node is single-class by
      construction — at most two per source, grouped by destination — so `owner:
      ai` IS the machine-verifiable mark and `owner: human` IS the
      author-required mark. This is already live and already consistent: of the
      13 tactic-mainqa-* nodes on origin/main at record time, 12 carry `owner:
      human` with non-null office_hours, and tactic-mainqa-record-time-routing
      carries `owner: ai` with office_hours null. office_hours is DERIVED from
      the mark, never its source. Verified at record time: clear-park does not
      touch `owner`, so draining an author-required node clears its office_hours
      WITHOUT erasing the sort — precisely what condition 20 asks for and
      exactly what the office_hours inference could not provide. Condition 20 is
      therefore SATISFIED by reading `owner`, and is amended in place to name
      that field rather than being narrowed to the measurement read. Entry 123's
      mis-sort measurement is restated on the same field: cannot-verify parks on
      `owner: ai` nodes, over all `owner: ai` main-qa nodes, threshold at most 1
      in 20.


      Interim, until entry 123's standalone-node shape is live: source tactics
      still carry a `## needs-main residue` body section (live on origin/main at
      record time — e.g. tactic-graph-tick-node-lane-auto-merge, ids 7-9), and
      one such node genuinely carries mixed-class items, which a single per-node
      `owner` cannot express. For those, each residue bullet carries an explicit
      `Verifiability:` sub-line valued MACHINE, AUTHOR or WAIT, alongside its
      existing `Expected outcome:` and `Finding:` lines; the node's office_hours
      is derived from those marks. This interim convention retires WITH the
      residue body section itself — it is not a second permanent mechanism.


      SECOND — THE PREDICATE ITSELF IS WRONG AND IS CORRECTED HERE. Entry 123's
      clause "The sorting predicate is unchanged — the autonomous|human criteria
      already recorded in needs-main-followups.md section 1" is AMENDED. That
      predicate sorts on BROWSER-REACHABILITY (an objective check /qa-main's
      read-only Claude-in-Chrome flow can perform), not on
      machine-verifiability, and that gap is the defect
      tactic-qa-main-verifiability-sort-criterion exists to close. The corrected
      predicate: an item is author-required ONLY IF it cannot be machine-checked
      AT ALL. A git, journal, log, shell or filesystem check that no browser can
      perform is MACHINE, not AUTHOR. A park reason citing browser-reachability
      — including the recurring "url_path names a repo script, not a web page"
      form — must be REJECTED by the lane rather than written. Evidence this is
      not theoretical: on 2026-07-31 four office_hours parks on four nodes all
      gave "not browser-verifiable", and all four were then machine-verified in
      a single session with journalctl, ls, jq, git show and grep, no browser
      and no author input; only 2 of the 7 items across them were genuinely
      author-required, so the predicate produced roughly 5 false author
      interrupts out of 7.


      Correcting the sort means editing the LIVE predicate sites — the
      hand-inlined prose at qa-main/SKILL.md:112-119 and
      qa-fix/references/needs-main-followups.md:32 and :65-72 — and NOT
      dispatch-main-qa-triage, which despite its own header is dead code on this
      lane (qa-main/SKILL.md:117 explicitly skips it, and its only remaining
      caller sits in the removed legacy issue lane).
  - question: The qa-main lane needs a third outcome besides pass and park — a
      not-yet-observed deploy-lag hold that must never wake a human. What shape
      does it take, what advances it, and what caps it?
    answer: >
      (Recorded 2026-07-31 /align-strategy interview, ratifying the office_hours
      park on tactic-qa-main-verifiability-sort-criterion.) A WAIT is a hold
      node born with `office_hours: null` and NO phase, carrying an attempt
      counter and a finite cap.


      Three mechanics make that shape work, each verified against origin/main at
      record time. officeHoursQueue admits EVERY non-null-office_hours node to
      the human queue (packages/intentionsutil/src/officeHours.ts, `if
      (n.office_hours === null) continue`), so an office_hours-null WAIT is
      absent from that queue BY CONSTRUCTION rather than filtered out of it —
      the "never wakes a human" property therefore cannot regress into waking
      the author. blockersComplete
      (packages/intentionsutil/src/router.ts:168-175) returns false for any
      blocker whose phase is not `done`, so a phase-less WAIT genuinely does
      hold its source. isDraft (router.ts:122) treats a null phase as draft, so
      the executable work loop at router.ts:301 skips it.


      ONE CODE CHANGE IS REQUIRED AND MUST NOT BE SKIPPED: router.ts:343-355
      DOES emit a phase-less, office_hours-null tactic as an /align-tactics
      candidate. Without an explicit exclusion there, the router would spawn an
      align worker on every WAIT node. Add that exclusion in the draft-candidate
      loop, in the same shape as the existing subtreeParentIds skip immediately
      above it. This was found by direct read during the ratification interview
      and is not recorded in the park text.


      ADVANCEMENT AND CAP. The WAIT is re-checked by the EXISTING tick sweep
      framework — the one landed by tactic-denied-command-parks-node as PR #2994
      — as one more predicate on that framework. Never a second sweep: this
      strategy's architectural rule is one sweep framework with several
      predicates, and a second implementation of a predicate is the failure that
      rule forbids. When the observation lands, the sweep sets the WAIT node
      `phase: done`, which clears the source's blocked_by through
      blockersComplete and returns the source to selection. When the cap is
      exhausted, the sweep writes office_hours onto the WAIT node, making it a
      genuine park that DOES reach the author — which is what satisfies
      condition 10's declared-finite-cap requirement. The cap is owned by the
      sweep, not by whoever authors the node.


      REJECTED ALTERNATIVE, recorded with its reason so it is not re-proposed:
      giving the WAIT a non-null office_hours with a new session_type filtered
      out of officeHoursQueue was declined because it would make "never wakes a
      human" depend on a filter that fails OPEN — if that filter ever regresses,
      every WAIT floods the office-hours queue. That is the same silent-failure
      class (a check whose failure mode is a silent PASS on the signal that
      matters) this strategy already tracks five members of, and an instrument
      must not be built on it.


      (Amended 2026-07-31, same-day second /align-strategy round.) ADVANCEMENT
      above is REFINED, not replaced. "When the observation lands" presumes a
      readable signal, and the deploy-lag case that motivated this very entry
      has none — detecting the observation IS running the test. For a WAIT whose
      event carries no already-readable signal the release predicate is CALENDAR
      TIME (attributes.wait_until), and the attempt counter's survival across a
      re-wait — which this entry left open — is settled by re-arming one node in
      place rather than re-minting. See the calendar-release clarification of
      this date for both, including the router.ts:343-355 exclusion this entry
      already requires, which now must cover a RE-ARMED node too (a re-arm
      returns the node to phase-less, so it re-enters the draft-candidate loop
      this exclusion guards).
  - question: Promoting the fleet watchdogs to systemd units removes their only
      operator surface. What replaces it, and may a fleet-level instrument halt
      dispatch?
    answer: >-
      (Recorded 2026-07-31 /align-strategy interview, ratifying the office_hours
      park on tactic-fleet-watchdogs-session-scoped.) Two rulings.


      ALARM SURFACE. An out-of-band fleet instrument's finding lands as a
      find-or-create graph node, reusing the proven dispatch-diagnose-main /
      tactic-main-red-<shortsha> pattern — never journald alone. A journald-only
      instrument has no counter, no hold, no park and no operator surface, which
      is the exact defect class these instruments exist to close; shipping it
      that way would add a new member to that class at the fix site. An UNKNOWN
      reading lands a node TOO, not only a positive finding: an instrument that
      cannot see must say so loudly, because silence on an unreadable input is
      indistinguishable from a healthy fleet. That clause is the load-bearing
      half of this ruling.


      NEVER FLEET-HALT. These instruments are explicitly EXCLUDED from tripping
      the condition-10 breaker. They report; they do not halt the fleet.
      Condition 10 is scoped to correlated dead claims (at least 3) and does not
      cover a stopped tick, so wiring fleet-level non-progression into it would
      halt ALL selection on a signal it was never scoped to — converting an
      instrument false-positive into a total dispatch outage. Given that every
      instrument in this pipeline has so far shipped with a silent-failure mode,
      a false halt is the likelier outcome than a true one.


      Scope note for the eventual plan, not a blocker: the checks this covers
      are the ones no in-band sweep can perform — tick staleness, daemon
      liveness, sustained BUSY=0, and auto-merge suppression. A check running
      INSIDE dispatch-tick structurally cannot report that dispatch-tick has
      stopped running. The defect is observed, not hypothetical: at record time
      both watchdogs were running, but heal-units.log's last line was `watchdog
      exiting; heals=23` at 2026-07-31T07:51:41Z — an 8.2h unwatched gap that
      nothing anywhere reported.
  - question: Can a fleet instrument tell a stalled fleet from a deliberately paused
      one, and which way should it fail when it cannot read pause state?
    answer: >-
      (Recorded 2026-07-31 /align-strategy interview, ratifying the office_hours
      park on tactic-fleet-watchdogs-session-scoped.) Tick-staleness and
      sustained-BUSY=0 stay QUIET during a standing pause. During a pause
      dispatch-tick exits before dispatch-select-tick runs, so both checks would
      otherwise fire continuously through a supported, standing operating mode
      and train the author to ignore them. Daemon-liveness does NOT go quiet: a
      paused fleet still has a live daemon, so a dead daemon remains a defect
      worth reporting even under pause.


      All three read the LIVE pause mechanism through ONE shared helper. The
      live mechanism is the sentinel file at
      $XDG_DATA_HOME/commons-dispatch/paused (dispatch-tick:291-292; the file
      was modified as recently as 2026-07-31), NOT the dispatch.config/*.json
      field that condition 16's 2026-07-26 amendment names — that field does not
      exist in the repo, and its owning node tactic-dispatch-pause-config-field
      is status raw / phase null. Routing every instrument through one helper
      makes the eventual migration a single edit. This does not amend condition
      16's intent: it records that the instruments track the mechanism that is
      actually live today, and follow condition 16 to the config field when
      tactic-dispatch-pause-config-field lands.


      CONDITION 16'S FAIL-CLOSED DEFAULT IS INVERTED FOR THESE INSTRUMENTS. For
      a GATE, an unreadable pause state reading as "paused" is the safe default
      — it declines to dispatch. For an INSTRUMENT it is not: silencing on an
      unreadable input is exactly the silent-PASS failure this work exists to
      close. So an unreadable pause state reports UNKNOWN and STILL EMITS; it
      never silently suppresses. This inversion is scoped to out-of-band
      instruments and does not weaken condition 16 anywhere it governs a gate.
  - question: What are the expected exception lanes for fleet scheduling — how far
      does a pace-exempt bypass reach, and what may a deliberate human dispatch
      override?
    answer: >-
      (Amended 2026-07-31 /align-strategy interview, author-dictated.) Two
      exception lanes, with one shared floor. AMENDS entry 14/76's clause that
      pace_exempt "admits ONE gate-exempt worker": it now fills to the ceiling.
      LANE 1 — pace_exempt lifts the pace GATE to the full
      max_concurrent_workers headroom and never past it. Whenever effective-live
      >= the pace target and tokens remain, the pace-exempt lane admits up to
      (max_concurrent_workers − effective_live) workers, not one. The rule is
      UNIFORM — it is not scoped to the paced-to-zero case — so there is no
      discontinuity at target 1 and no second regime. Worked example the author
      gave: weekly usage above the pace curve, queue containing only pace-exempt
      items, max_concurrent_workers 3 => three concurrently scheduled
      pace-exempt workers. LANE 2 — a deliberate human dispatch (bare /dispatch
      picking the highest-ranking available node, or dispatch <node-id>,
      including a substituted node per entry 132) launches exactly one worker
      ignoring BOTH the pace curve AND the ceiling. This lane is unchanged:
      entry 76 already recorded it and dispatch-select-tick already implements
      it (the --manual branch's SPAWN_N floor-of-1 re-asserts past the ceiling
      clamp at HEADROOM=0; the explicit-node branch skips both outright).
      Recorded here as confirmation, not as a change; no code is owed for lane
      2.


      THE RESULTING INVARIANT, which is the point of the pairing:
      max_concurrent_workers is ABSOLUTE for all autonomous scheduling —
      pace-exempt work included — and only a conscious human act may exceed it,
      by exactly one node. This restores entry 33's ceiling to its stated scope
      rather than weakening it.


      THE SHARED FLOOR IS UNCHANGED: genuine token exhaustion
      (dispatch-target-workers --exhausted — a weekly or 5-hour window at/near
      100% used with its reset still ahead) remains the one hard stop on EVERY
      lane, manual included. Exhaustion is neither the pace curve nor the
      ceiling: the curve and the ceiling are self-imposed throttles a human may
      override, while exhaustion means there are no tokens to spend. A worker
      launched into an exhausted window cannot complete a pass, and a pass that
      ends without declaring a disposition freezes its node until manually
      reaped — so overriding this floor would convert a sovereign act into a
      stuck node.


      LIVE DEFECT RECORDED AT RATIFICATION, CORRECTED 2026-07-31 (same-day
      author correction): dispatch-select-tick's autonomous block contains ZERO
      references to MAX_WORKERS (verified against the script at origin/main), so
      the at-cap pace-exempt bypass fires on effective-live >= pace-target with
      no ceiling check at all. Today's behavior is BOTH narrower than this
      clause (one worker per firing, via graph-select-target --pace-exempt-only
      --top 1) and wider than entry 33 (no ceiling check at all) -- but the wide
      half is NOT bounded to "max+1": the gate is re-evaluated fresh every tick
      with no memory of a prior bypass, and the newly spawned worker counts as
      busy on the very next tick, so effective-live stays >= pace-target
      (trivially so at a paced-to-zero curve, 0 >= 0) and the lane can fire
      again, admitting one MORE worker beyond whatever is currently live. The
      correct characterization is "one additional worker every time the gate
      fires, regardless of the current active count" -- compounding across
      ticks, bounded only by how many distinct selectable pace_exempt candidates
      exist (not by max_concurrent_workers, which this code path never reads).
      Both halves are defects against the record rather than design choices;
      tactic-pace-exempt-ceiling-fanout carries the fix.


      STEELMAN CONSIDERED AND DIVERGED FROM: the rival framing is that the
      one-worker bound was never an arbitrary throttle but a BOUND ON THE BLAST
      RADIUS OF A MISMARKED NODE — under fill-to-ceiling, pace_exempt stops
      meaning "one escape-hatch worker" and starts meaning "full-rate operation
      for the marked set", so once the weekly curve closes the marking
      discipline becomes the only remaining throttle on spend, and an
      over-marking mistake costs the whole ceiling indefinitely rather than one
      worker. Diverged from on the author's ruling, and a code-side bound on the
      marked set was rejected as re-introducing the removed cap under a new name
      with a tunable nobody can size. The risk is instead recorded as a FAILABLE
      condition (see the pace-exempt-marked-set condition added this round),
      reusing the machinery already carrying the maintenance-burden band: a
      marked set that grows without bound is that condition failing — which
      parks this strategy for an author decision — rather than a silently
      absorbed cost.
  - question: The ratified WAIT releases "when the observation lands" — but for
      deploy lag, detecting the observation IS running the test. What releases a
      WAIT whose event has no readable signal, and what survives a re-wait?
    answer: >
      (Recorded 2026-07-31 /align-strategy interview, second round of this date,
      extending the WAIT ratification recorded earlier the same day — read that
      entry first.) Calendar time is the WAIT's release predicate. The
      requirement that produced this entry ("graph nodes need a way to block on
      calendar time similar to how they can block on other nodes") is NOT a
      rival to the WAIT shape: it supplies the release predicate that shape left
      underspecified.


      SHAPE. The deadline lives as attributes.wait_until (ISO 8601) on the WAIT
      node, read by ONE MORE PREDICATE on the existing tick sweep framework —
      dispatch-sweep, which already reads nodeMinAgeSeconds from its config —
      never a second sweep, per this strategy's one-framework rule. When now >=
      wait_until the sweep sets the WAIT phase: done, which clears the source's
      blocked_by through blockersComplete (router.ts:168-175) and returns the
      source to selection. No schema field is added and no second selector
      eligibility gate is introduced.


      WHY NOT A blocked_until FIELD. A top-level blocked_until on every node,
      checked in the selector alongside blockersComplete, was offered as the
      literal peer of blocked_by the requirement's wording suggests, and
      DECLINED. Recorded with its reasons so it is not re-proposed: it is a
      second eligibility gate to maintain; it needs schema.ts and validate-graph
      work; it is authorable on nodes that have no use for it; and — decisively
      — it carries NO attempt counter, NO cap and NO escalation path, so a wait
      whose event never occurs would sit forever instead of parking to the
      author, failing condition 10's declared-finite-cap requirement. The
      WAIT-node shape inherits all three for free.


      THE PARENT'S BLOCKING DOCTRINE STANDS UNAMENDED, and this is load-bearing
      rather than incidental. strategy-graph-drives-dispatch's 2026-07-02
      clarification says the gate "releases itself as tactics close". Under the
      WAIT-node shape that remains literally true: a tactic (the WAIT) closes,
      and the gate releases. Wall-clock is only what the sweep READS to decide
      that closure — it is not a new release rule and not a new edge type. The
      declined blocked_until field WOULD have contradicted that clarification,
      which is a further reason it was declined. No edit to
      strategy-graph-drives-dispatch is owed by this round.


      THE COUNTER ACROSS A RE-WAIT. One WAIT node per source, with a
      deterministic id (tactic-wait-<source-id>), RE-ARMED IN PLACE and never
      re-minted: on a repeat not-yet-observed verdict the lane sets phase back
      to null, pushes wait_until forward, and increments attributes.attempts.
      The count survives because the node does, and source.blocked_by never
      churns. This is viable specifically because pruning is AGENT-driven via
      the owed-prune census, not script-driven (graph-commit:179-180), so a done
      WAIT is still present to re-arm. RECORDED RESIDUAL RISK, accepted not
      mitigated this round: a census that prunes between release and re-arm
      resets attempts to 1 and the cap becomes unreachable; the failure
      direction is a wait that retries too long, which the author eventually
      sees, not a silent pass.


      WHO SETS THE DURATION. The INITIAL wait_until is set by the qa phase at
      the moment it records the needs-main follow-up — birth-time metadata,
      consistent with this strategy's standing condition that an author-lane
      post-merge verification node carries at birth everything a fresh sitting
      needs — defaulting to 24h. /qa-main then REVISES it on each re-arm, since
      by then it has run the test and knows something the qa phase did not. The
      24h default is a stipulated starting value, not derived from a measured
      deploy cadence.


      STEELMAN, RESOLVED AS A DIVERGENCE WITH A BOUNDED CONCESSION.
      tradition-stoicism records the dichotomy of control as
      adopted-but-inverted — "where Epictetus contracts concern to what the will
      controls, the graph engineers the boundary outward". The rival reading: a
      calendar wait contracts the dispatch loop's concern away from the
      production behavior and back onto the clock, the one thing the loop
      already fully controls, and the faithful design would instead INSTRUMENT
      the observation (a deployed-version marker, a log line, a metric) and
      release on the signal. DIVERGED, because the clock never SUBSTITUTES for
      the observation — it only schedules when the observation is taken.
      /qa-main still runs the real test and still produces the real verdict;
      wait_until decides when to look, never what was seen. This strategy
      already tracks five members of the silent-pass class (a check whose
      failure mode is a silent PASS on the signal that matters) and a calendar
      wait is not a sixth. CONCESSION, recorded as a binding boundary: where a
      cheap readable signal ALREADY exists, reaching for the clock instead IS
      the retreat the inverted dichotomy names. The calendar wait is the default
      only for behaviors with no already-readable signal, and never licenses
      ignoring one that is.


      SCOPE — RECURRENCE IS OUT. A future jit engine may consume this primitive
      (author, this round), but nothing here is designed for recurrence: this
      round covers one-shot delay only. Recorded finding from the same round,
      because it is otherwise invisible: the project's legacy calendar mechanism
      is UNREACHABLE CODE. dispatch-jit-engine and dispatch-jit-calendar-import
      are still wired into dispatch-select-tick:844 and :938, but no jit.json
      exists in dispatch.config/ (only auto-merge.json and target-workers.json)
      and both file GitHub ISSUES, which are disabled repo-wide. So the
      graph-native model today has no calendar mechanism at all, and the one it
      inherited cannot run. Whether to retire that code or re-home it on
      wait_until is deliberately NOT decided here.


      DELEGATION EDGE CONSIDERED AND DECLINED. delegation-communications holds
      "calendars and scheduling" in its delegated scope, so a recovers edge was
      evaluated per the delegation-advice step and NOT added: this round's
      primitive is an owned timestamp in the graph with no coupling to Google
      Calendar, and the edge would overstate. It becomes warranted only if a
      future jit consumer re-enters that scope — the point at which
      dispatch-jit-calendar-import's Google Calendar dependency would actually
      be replaced rather than merely left dead.
  - question: Are the line-number citations that sibling nodes (e.g.
      tactic-qa-main-verifiability-sort-criterion) make into this strategy file
      durable across later same-day /align-strategy rounds?
    answer: "(Recorded 2026-07-31 /align-tactics tactic-target round on
      tactic-qa-main-verifiability-sort-criterion.) Line citations into this
      strategy file are NOT durable and must not be trusted by a planner. The
      citations tactic-qa-main-verifiability-sort-criterion makes in its
      rationale and its `## The seam` section -- :2224-2227, :2221, :2195-2200,
      :2192-2194, :2212-2229 and :3182-3188 -- are all stale; the file has grown
      through the later same-day /align-strategy rounds and every cited passage
      has shifted. Anchors verified in the worktree at this round: the
      VERIFIABILITY-cannot-verify vs deploy-lag distinction is at :2166; the
      corrected-predicate ruling and its list of live edit sites is at :3567,
      inside the :3511-3572 clarification; the WAIT ratification mechanics are
      at :3583-3616; the calendar-release amendment is at :3798 onward.
      Substance is unaffected -- every cited claim was found intact at its new
      location -- so this is a navigation correction, not a design change.
      Planning against this strategy re-greps for the text; it does not resolve
      a recorded line number. The same caution applies to the citations recorded
      inside sibling nodes, which were written against earlier revisions of this
      file."
  - question: Is the WAIT hold mechanism that
      tactic-qa-main-verifiability-sort-criterion's third outcome routes into
      already implemented, and what does that mean for sequencing?
    answer: "(Recorded 2026-07-31 /align-tactics tactic-target round on
      tactic-qa-main-verifiability-sort-criterion.) The WAIT hold mechanism this
      tactic's third outcome routes into is OWNED by
      tactic-wait-calendar-release, as already ratified -- but at this round it
      is not yet IMPLEMENTED, and the distinction matters for sequencing.
      Verified: tactic-wait-calendar-release is status raw, phase null,
      blocked_by [], office_hours null -- an unplanned draft; and the
      router.ts:343-355 draft-candidate exclusion that the WAIT design calls
      mandatory is confirmed ABSENT, the loop still gating only on office_hours
      null, blockersComplete and subtreeParentIds. The two mechanisms the WAIT
      shape relies on are live exactly as recorded: officeHours.ts:44 (`if
      (n.office_hours === null) continue`) keeps an office_hours-null WAIT out
      of the human queue by construction, and router.ts:168-175 blockersComplete
      returns false for any non-done blocker so a phase-less WAIT genuinely
      holds its source. Consequence for planning, not a change of scope:
      tactic-qa-main-verifiability-sort-criterion lands the MARK -- the
      per-bullet `Verifiability: WAIT` value on a `## needs-main residue` item,
      and the lane rule that a WAIT is never written as an office_hours park --
      while the node shape, attempt counter, cap, wait_until and release
      predicate remain tactic-wait-calendar-release's entire surface. A WAIT
      mark emitted before the sibling lands has no consumer, so the sort
      tactic's plan states the ordering between the two nodes explicitly rather
      than assuming the hold is already live."
  - question: Is there a live end-to-end fixture for the corrected
      verifiability-sort predicate, and does the lane's current state expose the
      mis-sort this round closes?
    answer: "(Recorded 2026-07-31 /align-tactics tactic-target round on
      tactic-qa-main-verifiability-sort-criterion.) The mis-sort class this
      tactic closes has a live instance standing in the office-hours queue right
      now, and it is the best available end-to-end fixture for the corrected
      predicate. tactic-mechanical-park-producers -- one of the four siblings
      the tactic names as carrying the same misroute -- is at phase main-qa with
      an office_hours park opened 2026-07-28 whose reason states that residue
      item #15 'is not browser-verifiable', that 'its url_path is the literal
      string \"current\", not a real page', and then describes the actual check
      as a week-over-week count of tactic-hold-conflict-* /
      tactic-hold-fix-cap-* node creations on origin/main against the ~5/week
      exit-11 baseline -- i.e. 'a graph/git-history query'. Under the corrected
      predicate that is MACHINE, not AUTHOR: git and graph history are
      machine-checkable at all, and no browser is needed. The same park
      additionally records that the plan's own week-long observation window does
      not close until 2026-08-02, which is a calendar WAIT, not an author
      interrupt. So this single park is simultaneously a browser-reachability
      mis-sort AND a deploy-lag/observation-window WAIT, and the corrected lane
      must re-sort it to MACHINE plus a calendar hold with no author woken. Two
      consequences recorded: use it as a replay fixture alongside the seven
      residue items already recorded on
      tactic-qa-main-verifiability-sort-criterion; and note that the lane is not
      quiescent -- at least one in-flight main-qa node is being evaluated under
      the old wording while the predicate sites are edited."
  - question: How large is the pace_exempt marked set relative to the worker
      ceiling, as measured during the 2026-08-04
      tactic-pace-exempt-ceiling-fanout finalize round?
    answer: "(Recorded 2026-08-04 /align-tactics round on
      tactic-pace-exempt-ceiling-fanout.) Measured input for the not-yet-armed
      pace-exempt marked-set containment condition, taken at HEAD of intentions/
      this round: 16 of 491 nodes carry `pace_exempt: true` in frontmatter — an
      earlier count of 18 was inflated by body-prose matches;
      strategy-graph-native-dispatch and strategy-main-health both carry
      `pace_exempt: false`. Of the 16, four are phase:done and one is an
      unplanned draft (phase:null), leaving 11 in working phases (10 main-qa, 1
      implement) and therefore router-selectable. Against the
      max_concurrent_workers default of 8 (dispatch.config/target-workers.json
      is machine-local and absent in a clean checkout; default documented at
      dispatch-target-workers:106), the live marked set already exceeds the
      ceiling in headcount — so once the fill-to-ceiling amendment of 2026-07-31
      is implemented, a closed weekly pace curve can keep the whole autonomous
      ceiling occupied by pace-exempt work indefinitely rather than admitting
      one worker. Recorded as an observation toward the author's eventual band
      declaration, not as a gate on the fan-out fix: the fix computes headroom,
      it does not change how many nodes are marked."
  - question: What does the autonomous at-cap pace-exempt lane do when
      dispatch-target-workers --max returns a non-numeric or unreadable ceiling?
    answer: (Observed 2026-08-04 /align-tactics round on
      tactic-pace-exempt-ceiling-fanout.) The autonomous at-cap pace-exempt lane
      fails CLOSED on an unreadable or non-numeric max_concurrent_workers —
      treat it as an internal error and select nothing, mirroring
      dispatch-select-tick's two existing sibling guards (the autonomous block's
      non-numeric TARGET_N exit 2 at :635-643, and the --manual branch's
      combined TARGET_N/MAX_WORKERS exit 2 at :767-774) — never fall open to a
      one-worker grant. Derived from the recorded rule that
      max_concurrent_workers is ABSOLUTE for all autonomous scheduling plus the
      pause condition's fail-closed posture on config read failure. Recorded
      because graph-select-target's separate --standalone path (:347-364) takes
      the opposite posture, failing open to --top 1 on a non-numeric ceiling;
      that divergence is scoped to that caller and is not license for the
      autonomous lane to do the same.
  - question: "Is the PR-title `<node id>: <description>` condition's CI guard
      already enforced at HEAD?"
    answer: "(Observed 2026-08-04 /align-tactics round.) The PR-title condition's
      enforcement half is recorded doctrine, not yet a holding invariant: no
      check under .github/workflows/ validates PR-title format or node-id
      resolution, and dispatch-open-pr still takes a free-form --title, so only
      the branch name carries the node id today. The open node
      tactic-pr-title-node-id-convention (status: raw, phase: null) is the
      change that would build the guard. Recorded so a future round reads the
      condition as declared-but-unenforced rather than as an existing CI gate."
  - question: Does the 2026-07-27 clarification's stated eligibility consequence --
      that the strategy is non-decomposable until the two done signal-path
      terminals (tactic-legacy-router-removal, tactic-phase-skill-node-targets)
      are pruned -- still hold against current router code?
    answer: "(Recorded 2026-08-04 /align-tactics round.) No -- superseded by code.
      router.ts:590-596 tests `children.some((t) => isOpenTactic(t) &&
      onPath.has(t.id))`, and its in-code comment declares the done-exclusion
      load-bearing precisely because reconcile-graph writes phase done and no
      longer prunes, and computeSignalPath does not filter by phase, so a
      completed child would otherwise sit on the signal path forever and
      permanently disqualify its serving strategy. Verified 2026-08-04 at
      origin/main: both on-path non-draft children are phase done, no OPEN
      non-draft child occupies the signal path, and this strategy passes that
      gate. Pruning the two done terminals remains graph hygiene but is not an
      eligibility precondition. The rest of the 2026-07-27 entry's owed
      reconciliation still stands -- reading is still null and rounds.count is
      still 0."
  - question: Is the round-cap guard (rounds.count < 2) and the fresh-reading gate
      (rounds.last_aligned) actually being enforced across this strategy's many
      re-evaluation rounds, given rounds.count still reads 0?
    answer: "(Observed 2026-08-04 /align-tactics round.) rounds.count is still 0 and
      rounds.last_aligned still null despite a dozen-plus documented
      re-evaluation rounds since 2026-07-03, so both halves of the round-cap
      guard recorded in this strategy's first clarification are inert on this
      node: every round reads 0 < 2 and passes the cap check no matter how many
      have actually run, and the fresh-reading gate is vacuously satisfied by a
      null last_aligned rather than by a fresh reading. This is an
      accounting-write gap in the align round path -- the rounds block is never
      stamped on completion -- not a doctrine change, and it gates no plan. It
      does mean 'burning rounds forever' is currently unguarded here in the only
      place the guard was supposed to bite."
  - question: What is the current baseline count of this strategy's serving tactics
      by classification, and can the align-tactics Workflow's own drift-gate
      on-path count be trusted?
    answer: "(Measured 2026-08-04 /align-tactics round.) Direct re-run of
      align-tactics-census.ts against origin/main: 178 tactics serve this
      strategy, classified 51 open / 11 born-parked / 44 done / 72 draft, i.e.
      106 non-draft children, of which exactly 2 sit on the computed
      success-signal path and both are phase done. An earlier round's trimmed
      sample stated 95 non-draft; treat these 2026-08-04 figures as the
      baseline. Separately, the align-tactics Workflow's own strategy-mode drift
      gate (buildDriftPrompt/driftProceed in .claude/workflows/align-tactics.js)
      has reported an inflated on-path blocking count for this strategy -- '92
      non-draft children already on its signal path' -- which produced born-park
      escalations on tactic-bounded-work-in-progress and
      tactic-office-hours-graph-type-passthrough; the fix sits at
      tactic-align-tactics-tactic-mode-drift-gate (PR #2982, unmerged), with a
      likely-duplicate rediscovery at
      tactic-align-tactics-workflow-tactic-mode-drift-gate (draft) that a future
      pass should dedup. Until #2982 lands, an on-path count reported by that
      gate must be re-derived directly rather than trusted."
  - question: Does trimming this strategy's 180-entry clarifications array for
      Workflow tool-call size limits violate the recording condition that /align
      records all context a fresh /align-tactics session needs?
    answer: "(Observed 2026-08-04 /align-tactics round.) This strategy's
      clarifications array has grown to 180 entries, and the align-tactics
      Workflow now inlines only about 3 of them into a round's args to stay
      inside tool-call size limits. This does not fail the recording condition
      ('/align records in the graph, at record time, all context a fresh
      /align-tactics session needs') -- the context is recorded on the node; the
      loss is delivery-side, at the round's arg-construction boundary. The
      practical consequence is that a round reasoning only over the inlined
      sample reasons over roughly 2% of the recorded substance, so drift review
      and decomposition must read intentions/strategy-graph-native-dispatch.md
      directly rather than treat the inlined subset as the record. Related
      in-flight work: tactic-align-tactics-target-node-context-dropped
      (main-qa)."
  - question: How does the router handle a node in a state its phase ladder cannot
      progress from — a terminal session holding its worktree claim, a
      silently-declined reap, a failed park — and what unifies these with the
      existing conflict and CI lanes?
    answer: "(Recorded 2026-08-04 /align interview, author-ratified.) Invalid states
      get ONE common lane: detect, then an optional mechanical-resolution tier,
      then an intervention skill session, then an office-hours park as the
      fallback — generalizing the ad-hoc precedents (the conflict lane's
      provision-exit-11 detect routing to dispatch-conflict is the worked
      example; the fix-checks lane and the defensive sweeps are the others).
      Detection happens at BOTH points: (a) the selection-time occupancy check
      discriminates occupied-by-terminal (an invalid state — route to the lane)
      from occupied-by-live (a valid skip), and (b) the existing defensive
      sweeps become the second detection point, routing to the same lane instead
      of minting ad-hoc parks. Guards ratified with the pattern: a per-node
      intervention-attempt cap that parks to office-hours at the cap (the
      fix-attempt-cap precedent); find-or-create dedup on any follow-ups the
      lane files; and every mechanical-tier gate fails toward keep/escalate.
      Fleet-level invalid states with no node to route (an unreadable config
      value, a red main) instead mint a find-or-create latch node — the
      tactic-main-red-* shape — that is simultaneously the alarm, the work item,
      and the dedup key. Implementation retained as drafts
      tactic-invalid-state-lane and
      tactic-invalid-state-transcript-intervention. (Amended 2026-08-05 /align
      interview: the 'intervention skill session' tier is ONE SKILL PER KIND,
      not one skill serving every kind — the router resolves its skill directory
      from --kind while the common ladder itself stays shared. A sixth kind,
      duplicate-session, is added by the same round. See the per-kind-skill and
      duplicate-session clarifications of that date.)"
  - question: Condition 14 keeps every undeclared terminal exit frozen until an
      operator manually reaps it because the live session is the only artifact
      of the failure — does the invalid-state lane change that, and who owns
      dispatch-self-close's reap line?
    answer: "(Amended 2026-08-04 /align interview, author-ratified.) Condition 14's
      keep-for-debug is amended: an undeclared terminal exit routes to the
      invalid-state lane, whose intervention session consumes the debugging
      artifact autonomously — it reviews the transcript, files the
      find-or-create root-cause follow-up, then reaps or parks — replacing the
      wait for a human debugger. The artifact is read, not erased, which is the
      purpose the freeze existed to serve; freeze-until-operator remains only as
      the fallback when the intervention itself parks. The declared-but-declined
      case (claude rm exits 0 while declining, the
      tactic-self-close-reap-silent-noop defect) needs no doctrine change —
      condition 14 already licenses that reap; the lane is the escalation when
      the mechanical reap cannot proceed. Ownership: dispatch-self-close KEEPS
      its reap as a best-effort fast path;
      tactic-worker-self-close-configurable's default-off keep-all gate lands on
      that call site as planned; the lane is the guaranteed net behind both.
      tactic-self-close-reap-silent-noop's recorded brownfield Step 2 (delete
      the reap line) is retired."
  - question: When a parked node's PR merges outside graph-auto-merge and the
      reconciler advances it to phase done while office_hours stays live — is
      done-but-parked a valid state?
    answer: "(Recorded 2026-08-04 /align interview, author ruling.) Yes — phase and
      office_hours are conceptually orthogonal dimensions: a park means a human
      owes a decision, and author escalation may be required even after the code
      lands by whatever means; the merge and the phase advance are orthogonal to
      that debt. The reconciler stays ungated (per
      tactic-graph-auto-merge-office-hours-gate Unit 2's design, ratified on PR
      #3033 item 10 as accepted-behavior). Greenfield consequence: the
      office-hours queue presents BOTH dimensions — parked entries annotate the
      node's phase (e.g. phase done, underlying work already merged) so
      decision-state and work-state read jointly. Presentation follow-up
      retained as draft tactic-office-hours-queue-phase-annotation."
  - question: Does the fleet's throughput dial (max_concurrent_workers) need
      self-expiring deviation machinery so a deliberately temporary throttle
      cannot silently become permanent?
    answer: "(Recorded 2026-08-04 /align interview, author ruling.) No — that
      machinery is unintentional bloat. A deliberate temporary throttle is an
      INTERVENTION by a session (e.g. a monitor healing the automation), and the
      graph — not config schema — is where interventions live: the intervening
      session mints a find-or-create restore node carrying the reason and an
      event-shaped restore signal (the 2026-08-01 occurrence's condition was an
      event — the blocking PR merges — not a clock), resolved by
      monitor/office-hours restoring the cap and closing the node. Config stays
      a bare standing value; the loader shape does not change; the fleet NEVER
      writes the operator's config file (read-time resolution only, upholding
      the 2026-07-11 human/machine config split). Provenance and
      deviation-detection come from the tactic-dispatch-config-instance-repo
      migration: the committed value is the standing value, so any local edit
      reads as a git diff. What remains code-scoped on
      tactic-worker-cap-config-durability: emit the cap into every select-tick
      routing decision, so a deviation shows as a deviation in the log."
  - question: The recorded success_signal.sensor no longer equals the registered
      LIFECYCLE_SENSOR_NAME, so this strategy's reading is permanently null.
      Which sensor shape closes the drift — one sensor or two?
    answer: "(Ratified 2026-08-05 /align interview; clears the first of the two
      premises that parked this strategy on 2026-08-04.) ONE sensor.
      readLifecycleReading is extended with a defect-backlog segment and
      LIFECYCLE_SENSOR_NAME (read-sensors.ts:443, used at :646) is re-pointed at
      the amended RECORDED string — the code moves to the record, not the record
      to the code. Verified this sitting: the record's sensor reads 'the
      intention store and the router's selection log — align-tactics-census.ts
      enumerates the open machinery-defect population serving this strategy; the
      selection log carries lifecycle completions' while the constant is only
      'the intention store and the router's selection log';
      SensorRegistry.resolve (sensors.ts:49-59) is exact-match and THROWS on an
      unregistered name with no fallback, so this node buckets as unregistered
      and its reading stays null no matter how many rounds run. TWO sensors was
      rejected on parsimony: success_signal.sensor is a single string, so a
      split leaves the second sensor unnamed by the signal and unreadable by the
      same exact-match mechanism that caused this defect; and the threshold's
      two terms (lifecycle continuity, backlog bounded) are facets of one
      observable, not two."
  - question: The maintenance-burden condition had no declared band, so it read as
      not-yet-armed. What band arms it, and is the band absolute or relative?
    answer: "(Ratified 2026-08-05 /align interview; clears the second of the two
      premises that parked this strategy on 2026-08-04.) A RATIO: the open
      machinery-defect population — open plus born-parked tactics serving this
      strategy — stays at or below 35% of all tactics serving this strategy.
      Measured at arming by parsing every node at origin/main: 59 of 197 =
      30.0%, against the recorded 2026-08-04 baseline of 62 of 178 = 34.8% — so
      the count FELL by 3 while the denominator GREW by 19 in a single day,
      which is exactly the case where an absolute ceiling and a ratio return
      opposite verdicts on the same trend. The absolute ceiling was rejected
      because continued healthy filing would trip it while the machinery is
      fine, forcing periodic re-declaration of the number. The ratio follows the
      body's derived-at-read-time, self-correcting doctrine."
  - question: The threshold's 'non-increasing across consecutive census samples'
      term needs a sample history nothing in the store keeps. Where do
      consecutive samples live?
    answer: (Ratified 2026-08-05 /align interview.) DERIVED from intentions/ git
      history at read time — never stored. No new state to write or maintain;
      every past sample is already reconstructible because the store versions
      every node; and it cannot drift from the graph. This follows the existing
      readTacticVelocity/readTokenEconomy precedent, which windows off git log
      rather than keeping a series, and the body's schema note that the seed
      rank is derived on read and NEVER stored. A committed samples file was
      rejected as stored state that can drift and needs its own writer; keeping
      the series on this node was rejected because it would turn the strategy
      record into its own telemetry store, cutting against the persistent layer
      being author-decided intent.
  - question: "R1 — should blocked_by gate on code-on-main rather than on phase: done?"
    answer: "(Ruled 2026-08-05 /align interview. ADOPTED as stated.)
      blockersComplete (packages/intentionsutil/src/router.ts:206-213) treats a
      blocker as satisfied ONLY at phase === 'done', so a merged node carrying
      needs-main residue sits at main-qa and gates every dependent on a
      VERIFICATION phase rather than on the thing the dependent actually depends
      on — the blocker's code being on main. Greenfield: a blocker is satisfied
      once its code is on main (execution.completion.mergedAt / mergeCommitSha,
      or a merged PR), and a distinct explicit edge kind carries the rare
      genuine 'await post-merge verification' dependency instead of that being
      the default. Measured this sitting on origin/main: 57 gated nodes, 5 gated
      SOLELY by main-qa blockers whose PRs are all merged (2780, 3020, 2904,
      2982) — down from 7 only because this same session removed two edges BY
      HAND, which is the argument: that hand-removal step exists solely because
      of this defect. Retires the recurring manual edge-removal."
  - question: R2 — must graph-write primitives be kill-safe, with the success
      verdict derived from remote state?
    answer: "(Ruled 2026-08-05 /align interview. ADOPTED as stated.) graph-commit /
      clear-park / park-node must land atomically or not at all; the success
      verdict must be read back from post-push REMOTE state; and a killed
      process must leave no orphan commit and no held lock. REPRODUCED DIRECTLY
      in this sitting, in both directions: a killed transition-node left an
      orphan commit (16da5f0a, 'transition tactic-invalid-state-lane to done')
      in the graph worktree while origin/main was unchanged — local state
      claiming a success the remote never saw, requiring git reset --hard and a
      detached retry; and independently the same session's /qa-main hit
      graph-commit's 'nothing staged but content differs' guard refusing to push
      a commit that HAD landed locally, misreporting it as a mis-pointed-repo
      error. Prior evidence: Finding 13 fired 3x in one session in both
      directions. Tracked by tactic-graph-commit-landing-signal-unreliable.
      Retires the standing 'exit 0 proves nothing' invariant and most of the
      'always run graph writes in the background' one."
  - question: R3 — must every graph read resolve from an explicit ref, never from
      cwd or script location?
    answer: "(Ruled 2026-08-05 /align interview. ADOPTED as stated.) Reads take the
      tree/ref as a REQUIRED argument: check-node-selection.ts reads origin/main
      rather than the main checkout's working tree; validate-graph.ts requires
      its intentions dir rather than defaulting cwd-relative; transition-node,
      write-node.ts and clear-park stop resolving their repo root from script
      location. Evidence, several of which bit this very session: a correct
      selection rejected as 'stale-selection: not-parked' because the checkout
      was one commit behind — the reason the fast-forward-the-main-checkout
      invariant exists at all, obeyed twice today; validate-graph printing 'ok —
      N nodes' against the wrong tree unless the dir is passed explicitly; and
      having to reason about WHICH COPY of transition-node was executing.
      Retires the freshly-fetched-state invariant, the fast-forward invariant,
      and the whole script-location-traps class. Scope acknowledged as broad:
      the full set of affected reads was not enumerated in this sitting. A
      FURTHER INSTANCE occurred while landing this very clarification: the
      recording session ran write-node.ts after cd-ing to the primary checkout,
      so the script resolved its repo root from THAT copy's location
      (import.meta.url, not cwd-independent in effect) and wrote the amended
      strategy into the shared main checkout instead of the align worktree —
      producing exactly the dirty tracked file in the primary checkout that this
      strategy's own operational directive calls a fleet-stalling defect. It was
      caught and reverted immediately. That the defect caught the session
      recording its own fix is the strongest available evidence that this is a
      design defect rather than a discipline problem."
  - question: R4 — must a terminal disposition be positively declared, never
      inferred against contrary evidence?
    answer: "(Ruled 2026-08-05 /align interview. ADOPTED as stated.) The sweep parks
      only when there is no terminal marker AND no completion evidence; contrary
      evidence — a merged PR, a landed graph write, an applied marker — defeats
      the inference. Today marker-absence ALONE is sufficient, which previously
      parked two nodes ~70s before their own PRs auto-merged, after their
      /review-fix had in fact completed. THREE further instances occurred in
      this sitting: (1) #3047's /review-fix completed and applied its 'reviewed'
      marker, then its session vanished — the node survived only because the
      marker landed first; (2) #3048's /qa-main reached a full PASS verdict and
      was then blocked by the auto-mode classifier from landing the transition,
      stopping with the work done and NO disposition written, so the verdict had
      to be re-verified and landed by hand; (3) #2990's /dispatch-conflict
      resolved the conflict, pushed the merge and exited without advancing the
      node. The narrower merged-PR-evidence-only variant was rejected because it
      would not have saved case (2), where the verdict was reached and nothing
      had landed yet."
  - question: R5 — must a primitive's diagnostics reach a durable log? (Posed with
      half its premise withdrawn.)
    answer: "(Ruled 2026-08-05 /align interview. NARROWED to the router half; the
      other half was WITHDRAWN as false before the ruling.) ADOPTED:
      dispatch-invalid-state-sweep:214 invokes the router as '>/dev/null 2>&1',
      discarding BOTH stdout and stderr, while dispatch-invalid-state-route
      carries 10 distinct 'exit 10' sites (not 9 as previously recorded) — so
      the only signal escaping the router is an exit code emitted from ten
      places and its rung is unidentifiable from outside. That must be fixed.
      WITHDRAWN: the claim that graph-select-target's skipped[] is not persisted
      ('0 of 5968 select-tick records'). Measured this sitting: that is true of
      routing-decisions.jsonl (10788 records, 0 with skipped[]) but misleading —
      per-node skips ARE persisted in graph-selection.jsonl, where 570 of 1861
      records carry a non-empty skipped[] across 10 distinct reasons
      (live-session 1360, pr-merged-awaiting-reconcile 215, fix-write-failed 94,
      no-pr 51, reserved 46, ci-pending 14, terminal-session 5...), while
      routing-decisions.jsonl carries a tick-level skip_reason instead. The two
      logs already cover per-node and tick-level separately, and this session
      USED the terminal-session record to verify #3048. Duplicating skipped[]
      into routing-decisions.jsonl was rejected as a second home for facts
      already well carried."
  - question: R6 — must needs-main residue be verifiable by construction? (Posed
      after its premise was found false.)
    answer: "(Ruled 2026-08-05 /align interview. RE-AIMED at the not-yet-observed
      class; the original premise was found FALSE and not recorded.) The
      proposal held that #3048's residue item 16 named five expected outcomes of
      which two were 'unobservable in any durable log by construction', forcing
      a park. The record does not support that: read at origin/main, item 16 is
      ONE item carrying 'Verifiability: WAIT — awaits a future tick episode...;
      no such episode has occurred yet', an explicitly planned deferral, whose
      expected_outcome names concrete artifacts and whose Check: line names the
      exact observation channel (a journalctl grep for 'invalid-state:' plus a
      matching decision-log record). It then RESOLVED TO A PASS during this
      sitting through precisely that channel, independently verified on three
      counts: the intervention skill is absent from main, the sweep journal
      shows escalate-deferred=1 then kept=1, and graph-selection.jsonl records
      reason 'terminal-session' for the node. Nothing was unobservable by
      construction; it was NOT-YET-OBSERVED. Adopted instead: every residue item
      must name a durable observation channel in its Check: line (item 16 did,
      and would have passed the proposed bar), and the not-yet-observed outcome
      is formalized as a third outcome that never parks — which the deploy-lag
      WAIT clarifications already call for. The real defect is that this WAIT
      had to be resolved by hand."
  - question: graph-auto-merge merges nodes that are withheld — should its admission
      gate consult mergeability, office_hours and blocked_by as one decision?
    answer: "(Ruled 2026-08-05 /align interview. ADOPTED — decide as ONE gate.)
      Auto-merge merged #3046 and #3048 within ~70s of each being PARKED,
      because its gate consults neither office_hours nor blocked_by. That is a
      single admission decision with three predicates — mergeability AND
      office_hours AND blocked_by — currently being fixed by two uncoordinated
      tactics racing the same gate surface
      (tactic-graph-auto-merge-office-hours-gate, in review, and
      tactic-graph-auto-merge-blocked-by-gate, raw). Those two are to be
      reconciled so they land coherently rather than each addressing one
      predicate and leaving the third unconsidered. Recorded as a standing
      invariant of the merge path: a withheld node is not merge-eligible,
      whatever the form of the withholding."
  - question: "The open-PR conflict backlog: is it a capacity decision, or a symptom
      of unbounded work-in-progress?"
    answer: "(Ruled 2026-08-05 /align interview. It is a SYMPTOM; drain it via the
      root-cause tactics, not by adding capacity.) Measured this sitting by
      forcing per-PR computation — the bulk mergeable query returns 31 of 33
      UNKNOWN, a FAILED READ that must never be mistaken for 'clean': 33 open
      PRs, 10 CONFLICTING, 23 MERGEABLE, improving from 15 of 31 on 2026-08-03.
      The cause is the one tactic-bounded-work-in-progress records: an open PR
      is a claim on decaying mergeability, and starting new work faster than
      finishing it is what makes PRs rot. That tactic was blocked until this
      session removed its main-qa gate edge and is now a live selector candidate
      for the first time; together with tactic-graph-router-conflict-routing it
      constitutes the drain. Adding worker capacity was rejected as treating the
      symptom — by the same rationale, more concurrent starts makes
      work-in-progress worse. Closing the stalest CONFLICTING PRs was rejected
      as discarding recorded work and its planning context."
  - question: "'Main Nix Validate' is permanently red because a nightly artifact's
      hash is pinned. File it or accept it?"
    answer: "(Ruled 2026-08-05 /align interview. FILE a tactic to de-pin.)
      nix/home/wezterm-pin.nix pins windowsZipHash for a NIGHTLY artifact
      republished under the same name, so the pin goes stale on upstream's
      schedule and bumping the hash only buys time until the next republish. A
      permanently-red REQUIRED check is corrosive in a specific way: it trains
      every session to read red-main as normal, which destroys exactly the
      signal strategy-main-health exists to keep meaningful — so this is filed
      against main health rather than tolerated. The fix is to stop pinning a
      moving target (pin a stable release, or drop the hash check for that
      input) so the check is green by construction rather than by periodic
      hash-chasing. Recorded caveat: the mechanism was taken from the plan and
      NOT re-verified in this sitting."
  - question: Why is rounds.count 0 on a strategy that has been aligned in a
      dozen-plus rounds — is that a defect?
    answer: "(Recorded 2026-08-05 /align interview. NO — it is correct and expected,
      and this entry exists so the misdiagnosis stops recurring.) This sitting
      opened intending to 'fix' rounds to reflect 188 clarifications across 27
      distinct dated days, and that repair was WITHDRAWN mid-sitting on reading
      the code. router.ts:616-618 documents the state directly: the
      fresh-reading gate is keyed off rounds.last_aligned, not the round
      counter, and 'born-parked reading children never prune, so rounds.count
      can stay 0 while the strategy has been aligned repeatedly'. stampRound
      (transitions.ts:376) bumps count ONLY when a strategy's last non-draft
      child reaches done and is pruned in that same commit — an event that has
      never occurred here. So rounds.count counts COMPLETED DECOMPOSITION
      ROUNDS, not /align interviews; 27 dated clarification days measures a
      different thing. Writing the 'real' values would have actively broken the
      node: router.ts:605-610 parks a strategy instead of granting a round once
      count >= 2, and :620-630 skips it as stale-reading whenever last_aligned
      is set while reading is null — which is this node's exact state while the
      sensor drift keeps reading null. Both guards would have latched shut
      permanently."
  - question: Where does the guard against concurrent sessions on one node live — in
      each dispatch skill, in the launch path, or in the fleet monitor?
    answer: "(Recorded 2026-08-05 /align interview, author-ratified.) Detection is
      centralized in the fleet-health watcher (dispatch-fleet-watch) as an
      additional predicate, never as prose guidance or a guard inside any
      dispatch phase skill: the watcher is already the fleet's single home for
      health predicates and already turns every finding into a graph node
      through dispatch-fleet-alarm, so a duplicate-session predicate reuses an
      existing detect-and-mint path rather than adding one. The launch path
      ADDITIONALLY refuses — dispatch-graph-execute gains its own claimed-set
      check — because the watcher can only detect a duplicate that already
      exists, up to a full watch interval of two concurrent workers on one node,
      whereas a launch-time refusal prevents most duplicates outright. Both live
      in owned script code and cost no model tokens; the token constraint that
      motivated this requirement binds the ESCALATION tier (an intervention
      session), not detection. Two ground corrections are recorded with this
      entry because the requirement was framed on both: dispatch-fleet-watch is
      COMPLETE and live — a one-shot on a five-minute systemd timer with five
      predicates, every one evaluated on every pass — not partially implemented;
      the gap was only that no predicate counted sessions per node. And no
      dispatch skill has ever carried a concurrency guard, so no token-wasting
      per-skill guard was removed by this decision. The pre-existing guard is
      graph-select-target's claimed-set check (reservation_exists, folding
      worktree_has_live_session in as fail-safe), which is script code and
      equally token-free."
  - question: Are two concurrent sessions on one node a cost problem or a
      correctness fault?
    answer: "(Diverged 2026-08-05 /align interview from the cost framing.) The
      strongest rival conception — that a duplicate is a benign, self-correcting
      race which merely burns tokens, and so belongs to strategy-token-economy
      rather than to this strategy's invalid-state machinery — is DIVERGED FROM.
      Ground for the divergence: the two sessions share ONE worktree (both are
      spawned with cwd .claude/worktrees/<node-id>, since liveness and isolation
      are both name-keyed on the node id) and both can write the graph. The
      failure mode is therefore lost updates and clobbered edits by two writers
      in one working tree, not doubled spend; the spend is a symptom of the
      fault, not the fault. Corroborating instance from the same session that
      produced this round: a graph-commit issued from a worktree while a second
      graph-commit was still running from that same worktree silently landed
      nothing — it pushed its staging branch, printed no failure worth stopping
      on, and left origin/main unchanged. Honest limit on that evidence, stated
      when the steelman was put to the author: this is ONE observed instance,
      not a measured rate, so the divergence rests on the structural argument (a
      shared writer with no mutual exclusion) with the instance as corroboration
      rather than proof."
  - question: What does the response to a detected duplicate actually do, and at
      what scope?
    answer: "(Recorded 2026-08-05 /align interview, author-ratified.) NODE-SCOPED,
      with no fleet latch: a node carrying a live session is already frozen —
      worktree_has_live_session is name-keyed on the node id, so the router will
      not re-select it — so no new pause mechanism is introduced and a single
      duplicate never halts the fleet. The mechanical tier resolves it: STOP THE
      NEWER SESSION AND LET THE OLDER ONE COMPLETE, reap the stopped session,
      then debug the root cause and track a structural fix. Age is the default
      discriminator but not the sole one, because age is not liveness: where the
      OLDER session is itself already detectable as frozen or terminal — both
      are existing invalid-state kinds with their own probes — the newer,
      healthy worker is kept instead, so the rule cannot kill a working session
      in order to preserve a wedged one. Consistent with the 2026-08-04 lane
      ratification's guard that every mechanical-tier gate fails toward keep: on
      any uncertainty about which session to stop, nothing is stopped and the
      case escalates."
  - question: How does mechanically stopping a live session avoid creating a second
      invalid state?
    answer: "(Recorded 2026-08-05 /align interview, author-ratified.) By DECLARING
      it. Under condition 14 a session that exits without declaring a
      disposition is KEPT — the Stop hook holds the job alive and
      worktree_has_live_session freezes the node — so a bare stop would convert
      a duplicate-session state into a terminal-session state and route straight
      back into the lane, a loop rather than a resolution. The stop therefore
      writes a node-terminal marker naming the node under a NEW disposition
      member (duplicate-stopped), so the stopped session is declared and reaps
      cleanly. Adding a member is explicitly sanctioned by condition 14's own
      text — the disposition member is 'the primitive's diagnostic detail, never
      doctrine: dispatch-self-close reads only ^node=, so adding a member never
      re-stales this condition' — so this is an additive change that does not
      amend that condition. Reusing the existing no-claim member was considered
      and rejected as semantically false here: no-claim means the session held
      no claim and did nothing, whereas the stopped session DID hold a claim and
      may have done work."
  - question: What happens to the stopped session's uncommitted work, given both
      sessions share one worktree?
    answer: "(Recorded 2026-08-05 /align interview, author-ratified.) It is
      CAPTURED, never discarded, and the tree is never auto-cleaned. The stopped
      session's uncommitted diff is recorded as evidence on the tracked
      follow-up node; no restore, checkout or clean runs, because the SURVIVING
      session is live in that same tree and any such write would race its
      in-flight edits. For the same reason the existing worktree-residue
      invalid-state kind must NOT fire on a tree occupied by a live session: a
      dirty tracked tree under a live worker is that worker's work in progress,
      not dead-session residue. This is the same hazard already recorded raw as
      tactic-provision-residue-live-session-check ('provision-node-worktree's
      exit-14 precondition guard must consult worktree_has_live_session before
      escalating a dirty tracked tree to a human-drained worktree-residue
      hold'), which this round gives a second caller and therefore a second
      reason to land."
  - question: Does each invalid-state kind get its own intervention skill, or does
      one skill serve every kind?
    answer: "(Recorded 2026-08-05 /align interview, author-ratified; amends the
      intervention-skill limb of the 2026-08-04 invalid-state-lane
      clarification.) ONE SKILL PER KIND. The router keeps --kind — it needs it
      for the mechanical tier and the escalation class — and the ONE common
      ladder (mechanical tier, then intervention session, then escalation) stays
      shared and written down exactly once, as that clarification requires. What
      splits is the intervention SKILL: dispatch-invalid-state-route resolves
      its skill directory from the kind rather than hardcoding a single path,
      and each kind carries its own skill body. Measured state at the time of
      the ruling: the router never passed --kind to the skill at all (the prompt
      is '/dispatch-invalid-state <node-id>') and the skill directory was a
      single hardcoded path, while that one skill's body is written wholly for
      terminal-session — its method is reading a DEAD session's transcript, and
      its own frontmatter states it is 'never invoked on a live claim'. A
      duplicate is two LIVE sessions, so serving it from that skill would have
      required one body to branch across contradictory preconditions. Today's
      skill becomes the terminal-session skill; duplicate-session gets its own."
  - question: Does the bootstrap exemption entitle a pace-ceiling bypass on
      graph-select-target --standalone?
    answer: "(Recorded 2026-08-05 /align interview, author-ratified.) NO — the
      ceiling governs for every unattended caller, monitor-run drains included,
      as graph-select-target already states: an interactive keystroke is
      sovereign, but a --standalone caller is unattended, so it is ceiling-gated
      like every other --standalone selection. Ruling 34 item 4's bootstrap
      exemption does not purchase a standing route past the weekly curve. The
      problem the question was raised against — that the only claim-safe manual
      launch path (--standalone) returns nothing whenever
      dispatch-target-workers reads 0, leaving a bare dispatch-graph-execute as
      the only usable route and that route holding no claim and checking none —
      is closed from the OTHER side, by the launch-path refusal recorded above:
      once dispatch-graph-execute performs its own claimed-set check, a direct
      launch is claim-safe without selecting at all, and no bypass is needed.
      Honest limit stated when the question was put to the author: what else
      depends on --standalone was not enumerated in this round."
  - question: The WAIT design names `dispatch-sweep` as the host for the wait_until
      release predicate, but that script reaps worktrees and sessions and writes
      no graph node state. Which sweep actually hosts the predicate, and do the
      design's line citations still resolve?
    answer: "(Recorded 2026-08-06 /align-tactics tactic-mode round on
      tactic-wait-calendar-release, re-verifying the WAIT design's cited
      evidence against origin/main HEAD.) The WAIT release predicate's HOST is
      the per-tick sweep family invoked from `dispatch-tick`, not the script
      literally named `dispatch-sweep`. The two recorded pointers disagree on
      the name: the WAIT ratification (2026-07-31, first round) names \"the
      EXISTING tick sweep framework — the one landed by
      tactic-denied-command-parks-node as PR #2994\", while the calendar-release
      entry of the same date names \"dispatch-sweep, which already reads
      nodeMinAgeSeconds from its config\". Both facts are individually true and
      they point at different scripts. `dispatch-sweep` does read
      `nodeMinAgeSeconds` (dispatch-sweep:139-152, sweep.example.json), but its
      job is reaping merged/closed worktrees and stranded worker SESSIONS, fired
      by the worker Stop-hook via dispatch-spawn-sweep and by the
      dispatch-sweep-periodic systemd timer (lib.sh:2840-3042); it performs no
      graph node phase/attributes write at all. The PR #2994 lineage is the set
      of predicates sourced into `dispatch-tick` and run before selection each
      tick — `reservation_sweep`, `standdown_recheck_sweep`,
      `stale_hold_recheck_sweep`, `frozen_session_sweep`,
      `terminal_without_disposition_sweep` (dispatch-tick:319-409 and 576-629) —
      each added with the same idempotent `declare -f` source-and-call idiom,
      which is exactly the \"one more predicate, never a second sweep\" shape
      this strategy's one-framework rule requires. `stale_hold_recheck_sweep`
      (lib-stale-hold-recheck.sh) is the direct analog: re-check a parked
      predicate, resolve through a dedicated CLI that owns fresh-origin/main +
      --base CAS, always return 0, never a gate. The plan therefore hosts the
      wait_until predicate there and amends this node's statement accordingly;
      no second sweep is created, so the strategy's rule is honored under either
      name. Also recorded so future rounds do not read them as errors: the line
      citations carried in the WAIT clarifications and node body have drifted
      with unrelated edits — `router.ts:168-175` (blockersComplete) is now
      ~237-241, `router.ts:343-355` (draft-candidate loop) is now ~518-573, and
      dispatch-select-tick's dispatch-jit-engine/dispatch-jit-calendar-import
      calls at :844/:938 are now ~:980/:993. Every mechanism they cite was
      re-verified as accurate in substance."
  - question: "Who owns the WAIT producer wiring — the qa-phase mint, the /qa-main
      re-arm, and flipping tactic-qa-main-verifiability-sort-criterion's interim
      park branch — and are the existing `Verifiability: WAIT` residue marks
      backfilled?"
    answer: "(Recorded 2026-08-06 /align-tactics tactic-mode round on
      tactic-wait-calendar-release.) The producer side of the WAIT mechanism is
      this node's work, and the boundary with the already-landed sort tactic is
      now explicit. tactic-qa-main-verifiability-sort-criterion is phase done /
      status codified: it landed the per-item `Verifiability:
      MACHINE|AUTHOR|WAIT` sub-line on `## needs-main residue` bullets and an
      INTERIM /qa-main WAIT branch that takes the same terminal action a
      deploy-lag cannot-verify takes (a park), stating in its own body that it
      must not mint WAIT hold nodes and that \"once that node lands, this branch
      emits a WAIT hold node instead of parking\". It never says who makes that
      edit; since it is done, this node does. So this node's plan covers three
      producer-side items beyond the sweep predicate and router exclusion: (a)
      the qa-phase mint that creates `tactic-wait-<source-id>` with the initial
      `attributes.wait_until` at needs-main-residue record time (default 24h)
      and adds the source's `blocked_by` edge, per the calendar-release
      clarification's placement; (b) /qa-main's re-arm write that revises
      `wait_until` and increments `attributes.attempts`; and (c) flipping the
      sibling's interim WAIT branch from park to hold-node emission, which is
      the only thing that gives a WAIT mark a consumer. Recorded corpus fact
      bearing on scope: about 20 nodes in intentions/ already carry live
      `Verifiability: WAIT` residue items (e.g.
      tactic-flake-preview-and-smoke-dpkg-lock, tactic-invalid-state-lane,
      tactic-terminal-disposition-sweep-park-without-cas), written before any
      hold mechanism existed and therefore carrying no WAIT node, no wait_until,
      and no blocked_by edge. They are not backfilled by this node — the
      mechanism applies to marks recorded after it lands, and the existing ones
      continue to drain through the interim park path. Most of them also await
      an EPISODE (N further CI runs, elapsed fleet runtime, a live tick
      observing a condition) rather than a deadline, which is precisely the case
      the calendar wait's recorded concession bounds: the clock schedules when
      the observation is taken and never substitutes for it."
  - question: Should the WAIT router exclusion and enumerator key on the
      deterministic `tactic-wait-` id prefix, as the hold precedent (holdIdFor /
      isCanonicalHoldId) suggests?
    answer: "(Recorded 2026-08-06 /align-tactics tactic-mode round on
      tactic-wait-calendar-release.) The WAIT exclusion and the WAIT enumerator
      key on `attributes.wait_until` presence together with a resolvable source
      node — never on a bare `tactic-wait-` id prefix. The hold precedent this
      design otherwise mirrors (packages/intentionsutil/src/holds.ts,
      `holdIdFor` / `isCanonicalHoldId`, whose doc comment makes id-derivation
      binding a security property) would suggest an id-keyed set, but the WAIT
      id scheme `tactic-wait-<source-id>` collides with this implementing node's
      own id: `tactic-wait-calendar-release` parses as a WAIT on a source named
      `calendar-release`, which does not exist. An id-prefix-keyed exclusion in
      the router's draft-candidate loop would therefore silently drop this node
      itself from /align-tactics candidacy, and an id-prefix-keyed enumerator
      would emit it as a WAIT candidate with an unresolvable source. Keying on
      the attribute plus source resolution avoids both and keeps the exclusion
      honest for a re-armed node (which returns to phase-null and re-enters that
      loop). Verified at HEAD this round: the draft-candidate loop
      (router.ts:565-586) still skips only `subtreeParentIds`, so the exclusion
      the WAIT design calls mandatory remains ABSENT; `officeHoursQueue`'s `if
      (n.office_hours === null) continue` (officeHours.ts:82, duplicated at
      :256) still keeps an office_hours-null WAIT out of the human queue by
      construction; and `blockersComplete` (router.ts:237-241) still returns
      false for any non-done blocker, so a phase-less WAIT genuinely holds its
      source and a `phase: done` write alone releases it."
  - question: Does the manual `dispatch <node-id>` lane (Lane 2) actually reach
      dispatch-graph-execute without a preceding origin/main sync, as
      tactic-graph-execute-fresh-main-read's original rationale premised?
    answer: "(Recorded 2026-08-09 /align-tactics drift sweep on
      tactic-graph-execute-fresh-main-read.) No — verified against HEAD
      7c3e2a99. `dispatch` and `dispatch <node-id>`
      (nix/packages/dispatch.nix:9-35) exec dispatch-tick, which runs
      dispatch-select-tick synchronously in-process (dispatch-tick:637-650)
      before routing the `graph` decision to dispatch-graph-execute
      (dispatch-tick:735-750); the only standalone dispatch-graph-execute
      invocations are test harnesses. A failed sync also does not leak a launch:
      on fetch/merge failure dispatch-select-tick emits
      `sync-failed`/`sync-broken` and exits before selection
      (dispatch-select-tick:379-429). The I17 exposure is real but sits
      elsewhere: (a) dispatch-select-tick:297-298 guards the whole Step 1
      fetch+merge on the invoking checkout being on `main`, so a `dispatch
      <node-id>` issued from any worktree skips the sync entirely, and (b)
      provision-node-worktree fetches origin/main (line 115) but hands the gate
      the un-merged main-checkout working tree (lines 129-130) rather than a
      snapshot of what it just fetched. The ratified 2026-08-09 design (explicit
      ref/sha/fetchedAt snapshot parameter on check-node-selection.ts,
      refuse-by-default on unprovable freshness, recorded --allow-stale
      override) is unchanged by this correction and is, if anything, better
      motivated by it. Planned as part of tactic-graph-execute-fresh-main-read."
  - question: Where does tactic-graph-execute-fresh-main-read's freshness-read scope
      sit relative to the two adjacent raw nodes tactic-explicit-ref-graph-reads
      and tactic-graph-execute-claimless-manual-launch?
    answer: "(Recorded 2026-08-09 /align-tactics drift sweep on
      tactic-graph-execute-fresh-main-read.)
      tactic-graph-execute-fresh-main-read is planned as the narrow
      check-node-selection.ts slice of the broader principle stated by
      tactic-explicit-ref-graph-reads (raw, no phase, \"every graph read
      resolves its tree from an explicit ref\") — strategy clarification R3
      (2026-08-05) is the adopted general form, and the 2026-08-09 office-hours
      ratification is the controlling, more specific direction for this one
      primitive, so the node is an instance with a cross-reference, not absorbed
      into or superseding the broader node. Separately,
      tactic-graph-execute-claimless-manual-launch (raw, no phase) edits the
      same file, dispatch-graph-execute, for a different concern (claim-safety
      on direct launches, not snapshot freshness) — the two are independent in
      substance; whichever lands second rebases onto the other, neither
      supersedes it. The ratified shape's production precedent (wrapper acquires
      provenance, pure function consumes it as an explicit parameter) does not
      depend on the still-unexercised sibling
      tactic-office-hours-select-fresh-main: the same split is already in
      production at transition-node:161,182,186 feeding compute-freshness.ts's
      explicit --snapshot argument."
  - question: Does any recorded attributes.conditions entry on
      strategy-graph-native-dispatch fail in a way that bears on the
      check-node-selection.ts freshness work
      (tactic-graph-execute-fresh-main-read), or leave any Side-A condition
      falsified?
    answer: "(Recorded 2026-08-09 /align-tactics drift sweep on
      tactic-graph-execute-fresh-main-read.) No condition was found to have
      failed in a way bearing on this work; the sweep is recorded for the author
      as non-blocking implementation-status observations. Conditions on
      thin/offline-testable composition, freshly-fetched-state reads for
      align-family sessions, and mechanical invalid-state handling all verified
      holding and support the ratified direction. Two adjacent
      implementation-status gaps were noted, neither a falsified premise: the
      node-assigned bounded-ancestry-projection condition is not yet true on
      origin/main (packages/intentionsutil/scripts/node-ancestry.ts does not
      exist there; its implementing tactic tactic-node-ancestry-context sits at
      phase implement on unmerged PR #2946 — an in-flight commitment); and the
      PR-title CI-guard condition has no in-repo implementation this sweep could
      find (.github/workflows/pr-checks.yml carries no title check,
      dispatch-open-pr passes --title through unvalidated) — recorded as an
      unverified gap (the guard may be GitHub-side branch protection invisible
      to a repo search), not a finding of absence."
  - question: (Drift review, 2026-08-10 /align-tactics strategy round.) Is the armed
      maintenance-burden band (35% ceiling, non-increasing) still holding, given
      the tactic population has churned substantially since the 2026-08-05
      arming sample?
    answer: "(Measured 2026-08-10 /align-tactics drift review.) The armed
      maintenance-burden band HOLDS. Direct re-run of `npx tsx
      packages/intentionsutil/scripts/align-tactics-census.ts
      strategy-graph-native-dispatch intentions` against origin/main (0c23faea):
      232 tactics serve this strategy, classified 50 open / 15 born-parked / 72
      done / 95 draft. Open plus born-parked = 65 of 232 = 28.0%, against the
      recorded 2026-08-05 arming sample of 59/197 = 30.0% and the 2026-08-04
      baseline of 62/178 = 34.8%. Both terms of the band are satisfied: at or
      below 35%, and non-increasing across the three consecutive samples (34.8%
      -> 30.0% -> 28.0%) while the denominator grew by 54 over six days. The
      condition is holding, not failing, and did not block this round. Recorded
      as dated provenance in the same form as the arming measurement — not as
      stored series state, which the 2026-08-05 sample-history ratification
      explicitly rejected in favor of derivation from intentions/ git history at
      read time."
  - question: (Drift review, 2026-08-10 /align-tactics strategy round.) Is the
      2026-08-05-ratified instrument work
      (tactic-graph-native-signal-instrument-arm) still live and does the
      adjacent in-flight census-scripted-tick work (tactic-census-scripted-tick)
      conflict with it?
    answer: "(Verified 2026-08-10 /align-tactics drift review.) Two checks on the
      instrument work ratified 2026-08-05
      (tactic-graph-native-signal-instrument-arm), both clear. (a) The sensor
      drift is STILL LIVE and the tactic is not a no-op: LIFECYCLE_SENSOR_NAME
      at packages/intentionsutil/scripts/read-sensors.ts:443 (used at :646) is
      still the short string \"the intention store and the router's selection
      log\", while this node's recorded success_signal.sensor carries the
      amended long string naming align-tactics-census.ts and the selection log —
      so SensorRegistry.resolve's exact match still fails and reading stays
      null. Note the file path recorded in the 2026-08-05 clarification and in
      the tactic's rationale is scripts/read-sensors.ts, not
      src/read-sensors.ts; no src/ copy exists. (b) The adjacent in-flight
      census work does NOT conflict with the recorded sensor:
      tactic-census-scripted-tick (open, qa) retires
      `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census` (the
      threshold-gated latch-birth wrapper) and adds census-tick.ts — it does not
      touch packages/intentionsutil/scripts/align-tactics-census.ts, which the
      recorded sensor names as its defect-population enumerator and which
      remains referenced by the /align-tactics skill and its
      idempotency/tactic-target references. The sensor implementer may reuse
      align-tactics-census.ts's classify() (draft/born-parked/open/done, lines
      23-30) without a pending-retirement hazard."
  - question: Does condition 10's 'Breaker state never lives outside the graph' bind
      the per-claim evidence anchor for a node's freeze, or only the
      tripped-breaker incident record? And where is the claim written?
    answer: "Ratified in the 2026-08-10 office-hours sitting, clearing the parks on
      tactic-claim-containment-durable-anchor (born-parked 2026-07-31) and
      tactic-session-reap-authorization-durability (parked 2026-08-09) with one
      answer. (i) IT BINDS THE PER-CLAIM ANCHOR. Condition 10's own closing text
      is the governing sentence: the containment holds only where 'the freeze
      must anchor on durable graph state rather than on a process-level session
      registry'. That is about the freeze anchor, not merely the tripped-breaker
      incident record. Consequence: a reservation-ledger anchor (option b of the
      2026-07-31 park) and a reconciler derived from worktree/branch/PR (option
      c) are both excluded — durable, but not graph state. Either may still be
      adopted later, but only as an AMENDMENT to this condition, never as a
      reading of it. (ii) THE CLAIM IS WRITTEN BATCHED, ONE graph-commit PER
      SELECTION TICK, ISSUED BEFORE THE SPAWNS — not per spawn in
      provision-node-worktree, which is the shape the 2026-08-09 sitting
      ratified without pricing. Measured 2026-08-10: provision-node-worktree
      performs no graph write today (only reservation_mark_spawned at
      dispatch-graph-execute:159); baseline ~92 landings/day (1293/14d, peak
      27/hour) against ~22 worker passes/day (312 transitions/14d), so a
      per-spawn write adds only ~24% to landing VOLUME but places a CI-stamped
      landing serialized behind the global refs/graph/landing-lock
      (graph-commit:355) on the spawn critical path, where an N-wide fan-out
      serializes into N landings. Batching makes the cost independent of fan-out
      width, which is what the contention condition's 'negligible at fleet
      concurrency' requires. Issuing the batch BEFORE spawning inverts the risk
      window to claimed-but-not-yet-spawned, which reservation_sweep already
      reconciles and which fails safe."
  - question: Graph retrieval, editing, and concurrency control consume more session
      effort than the content they carry. Does the mechanical-floor doctrine
      cover session-facing graph operations, or only router and workflow
      mechanics?
    answer: "(Recorded 2026-08-11 interview.) It covers them, and this round widens
      the doctrine to the session-facing graph-operation surface via a new
      condition following the shape of the invalid-state mechanical-floor
      condition. MEASUREMENT, over the 2026-08-10/11 transcript corpus read
      across every commons.systems project directory including the per-worktree
      ones (797 session transcripts, 164MB, 13,342 tool calls of which 8,728
      Bash, 9.4MB of model-authored tool input): stripping heredoc bodies out of
      Bash commands leaves 1,857KB of shell mechanics against 262KB of authored
      content — a 7.1x ratio of effort spent reaching and writing the graph over
      effort spent writing what goes in it. Ad-hoc node access (386 jq, 398
      sed/awk/grep over a node .md, 105 inline python/node one-offs = 889 calls)
      outnumbers the sanctioned node primitives (write-node.ts 65, dump-node.ts
      63 = 128 calls) about 7:1. 1,612 of 8,728 Bash calls restate a worktree
      path; 1,049 perform post-write git status/diff eyeball verification; 705
      calls invoke graph-commit across 1,113 occurrences, the excess being retry
      loops; 270 calls hand-roll `git show origin/main:intentions/<id>.md`. That
      last one has a STRUCTURAL cause, not a discipline cause: storeAtRef
      (packages/intentionsutil/scripts/lib-store-at-ref.ts) exists as a library
      helper with five script consumers but no CLI, while dump-node.ts resolves
      its store from import.meta.url and therefore reads the worktree copy — so
      the doctrine that repeatedly mandates reading at origin/main has no
      scripted path at all, and every doctrine-compliant read is necessarily
      hand-written shell. Sessions were observed writing full-graph scans as
      bash loops over `git ls-tree` plus per-node `git show` plus `sed`.
      ROUND-TRIP COST is first-class alongside per-call bytes (author addendum,
      same interview): 8,728 Bash calls produced 140 intentions/ commits in the
      window, roughly 62 Bash round-trips per landed graph commit. ADOPTED: the
      mechanical-floor framing — scripts carry what is mechanical, model spend
      carries what needs judgment — extended from
      selection/transition/provisioning and invalid-state to retrieval and
      query, editing, and concurrency control. DIVERGED from the strongest rival
      framing, that this overhead is appropriate generality and the hand-rolled
      escape hatch is precisely the point: the measured calls are uniform rather
      than diverse — all 270 origin/main reads are the same operation and the
      1,612 path restatements carry no information whatsoever — so this is the
      absence of a primitive for an already-uniform operation, not generality.
      The divergence is bounded by writing the condition as a floor rather than
      a ceiling."
  - question: Does moving mechanical graph labor into owned scripts warrant a
      recovers edge from this strategy to delegation-anthropic-claude?
    answer: (Recorded 2026-08-11 interview.) No — raised and declined on this
      round's basis, with the question retained rather than dropped. The
      mechanical-floor doctrine already lives in this strategy as the
      workflow-thin-composition condition and the invalid-state condition,
      neither of which carries such an edge; if the edge is warranted it was
      warranted for the whole doctrine, so newly adding it because this round
      widens the same doctrine would be inconsistent.
      delegation-anthropic-claude is additionally the pivotal delegation whose
      recovery substrate is open-weight and local inference, which makes an edge
      claim on it doctrinally heavy and wrong to let ride along on an efficiency
      amendment. recovers stays [delegation-github] this round. The question is
      retained as the draft tactic tactic-graph-ops-model-recovery-edge so a
      later round can decide it on its own terms.
  - question: What was this round's own freeze blast radius, and what does it say
      about the strategy soft-freeze?
    answer: "(Measured 2026-08-11 interview.) Effectively zero, corroborating
      tactic-strategy-fingerprint-stamp-coverage. Computed with the
      authoritative predicate (listNodes plus the per-child
      execution.strategy_fingerprint read and strategyFingerprint from
      packages/intentionsutil/src/router.ts), never a grep: 237 tactics serve
      this strategy, 47 of them open (phase set, neither done nor draft), and
      exactly ONE — tactic-strategy-fingerprint-stamp-coverage — carries a
      non-null strategy_fingerprint entry for this strategy. A text grep over
      the field would have counted 45 and inflated the estimate, which is the
      failure mode the measurement rule exists to prevent. That single stamp was
      ALREADY stale against the current strategyFingerprint before this round's
      edit, i.e. frozen by some earlier delta. It was therefore classified
      orthogonal to this round's delta but deliberately NOT re-stamped:
      re-stamping would have silently discharged a prior round's freeze that
      this session never classified. Leaving it untouched is the fail-closed
      choice. The re-measurement (47 open children, 1 stamped) updates the
      2026-08-03 finalize-time figure of 46 open and 0 keyed."
  - question: What gate reviews an /align round's drafted graph updates before they
      commit?
    answer: "(Recorded 2026-08-11 interview; amended same day from the bootstrap
      review's two rounds.) Every /align round whose graph-commit creates or
      modifies any strategy-* node field other than the router-owned ones
      (phase, execution, office_hours, reading, and attention stamps), or
      creates any new node file, runs a mandatory adversarial draft design
      review after drafting and before that commit — the predicate is the
      commit's own diff, mechanically checkable, never the session's
      self-judgment; it covers new-strategy rounds,
      statement/rationale/signal-only amendments, and draft-tactic-only rounds,
      while excluding the mechanical phase-transition writers, which touch only
      router-owned fields. The reviewer is an independent subagent (launched
      with an explicit model: opus parameter — the launch argument, not skill
      frontmatter, which is only confirmed honored for context: fork skills)
      executing /align-review with no drafting-session context. Its handoff pack
      is assembled by an owned script (assemble-review-pack) from on-disk
      artifacts, never composed as session narrative: the author's requirement
      text written verbatim at step 1, the dump-node base JSON and exact
      write-node input JSON for every edited node, each draft tactic's JSON and
      body, the design-proposals rule, origin/main renders of every touched node
      and of every file the round's carrier tactics will amend, and the round's
      freeze classification and delegation-sweep outcome — each written to the
      round's pack dir by the /align step that produces it, with the script
      failing closed when any is missing. Interview resolutions enter the pack
      as the drafted clarification entries themselves. The reviewer proposes
      alternate designs against both the author's original proposal and the
      draft, reconsiders assumptions in the existing graph — evaluating whether
      the draft is ideal greenfield design — and returns a verdict, a
      requirement-clause coverage table, and findings ranked MATERIAL/MINOR. The
      coverage table is the authoritative discharge of the record-completeness
      contract (condition 7): the reviewer reads only the pack, so it is a
      fresh-session proxy — the exact reader that contract is written for — and
      the skill's own coverage walk reconciles against the reviewer's table,
      escalating any clause the reviewer could not place; the reviewer
      additionally flags every fact it needed that is not in the material
      landing on origin/main (the write-node inputs and draft-tactic bodies) —
      that list is the round's condition-7 defect list. Disposition: MATERIAL
      findings — anything that changes WHAT the record says, including
      design-shape problems, contradictions with author-confirmed resolutions,
      and any challenge to recorded doctrine — go to the author through the
      interview's question mechanics (recommendation + boldness +
      accept-as-deferral; a deferred material finding enrolls a Mode-A
      born-parked review item per the deferral mechanics); MINOR findings are
      structurally incapable of carrying judgment — they change only HOW the
      record says something (typo, missing or wrong date, schema/format defect;
      a wrong-citation fix only when the intended referent is unambiguous and
      exists) — and fold into the draft, reported in the round summary. If
      disposition changes the draft's design shape (a new or removed unit, a
      changed carrier, changed condition semantics), the amended draft is
      re-reviewed — never for MINOR folds or wording — capped at two review
      rounds per bundle, after which the round surfaces the residue to the
      author and proceeds on the author's call. Enforcement floor: graph-commit
      refuses a gated commit (dedicated exit code) unless it carries --review
      <report-file> whose report names the node ids it reviewed and a digest of
      the exact write-node input JSON it was given — graph-commit recomputes the
      digest from the staged node files and refuses on mismatch, so a stale
      pre-disposition receipt fails mechanically — or an explicit --ack <reason>
      flag recorded as a commit trailer (the condition-14 escape-hatch idiom; a
      message-substring would have no author surface since graph-commit authors
      its own messages). Judgment stays in the review; the receipt check is
      mechanical, per the scripted-path condition of 2026-08-11. A multi-topic
      round reviews per strategy commit bundle. /align-review is also
      author-invocable standalone against any staged draft. Per-round cost — one
      opus subagent per gated bundle, at most two — is accepted and read by the
      token audit's by-node attribution. Arming: the gate as a whole reads
      not-yet-armed until tactic-align-review-skill lands the skill text, the
      pack script, and the receipt flag; the interim discharge is a general
      subagent carrying this clarification's pack spec inline — the proven
      bootstrap path (two live runs 2026-08-11) — and the interim expires when
      that tactic's PR merges, after which an inline-pack discharge is drift,
      not a sanctioned path. Scope is /align only (the author's directive names
      /align executions); extending the gate to /align-tactics' drafted plans is
      a recorded candidate — one --review flag, not a redesign. The gate changes
      no delegation record: the reviewer is itself Claude and material findings
      route to the author, so judgment stays author-held —
      delegation-anthropic-claude is unchanged and no recovers edge applies.
      Skill build tracked at tactic-align-review-skill."
  - question: Steelman — the interview is already the audit; does a second reviewer
      diffuse that responsibility?
    answer: "(Diverged 2026-08-11, reasons recorded.) The rival holds the interview
      solely responsible for design quality and reads a post-draft reviewer as
      institutionalizing rushed interviews while adding per-round cost; its
      softer form — the review as advisory, run at the session's discretion —
      was offered and rejected in this round's interview. Diverged: the live
      2026-08-11 precedent (the rsi-plan priorities round in this same session)
      ran exactly this review ad hoc at author direction and caught three
      material design-shape problems the completed interview had missed — an
      actuator set that could defeat the author's forcing mechanism, a
      mitigation with no recorded carrier, and a brownfield attribute split — at
      the bounded cost of one subagent. The gate strengthens rather than
      replaces the audit: findings route back through the interview's own
      question mechanics, so responsibility stays with the round; and the
      advisory alternative failed precisely because the precedent ran only by
      author direction — an optional gate is the one that does not run. The same
      argument closed the enforcement seam: an unenforced mandatory gate
      inherits the advisory flaw, so the graph-commit receipt floor (see the
      gate clarification) is part of the divergence's resolution, not an
      optional extra."
  - question: Is the interview still the audit once the draft review gate exists?
    answer: "(Recorded 2026-08-11, from the bootstrap review's findings.) Yes,
      amended: the interview is the audit; the draft review is the audit's
      second reader, not a substitute for it. A rushed interview is still a
      permanent gap — the reviewer sees only what the pack carries, so it can
      catch a mis-shaped design but not an unasked question — and the reviewer's
      material findings return to the interview's own question mechanics rather
      than replacing them. This entry is the doctrine's graph home: the align
      skill text previously asserted 'the interview is the audit... there is no
      downstream review step' citing a clarification on this node that does not
      exist (the phrase lived only in skill prose and a transient tactic node);
      the carrier tactic rewrites that skill paragraph to match this record and
      fixes the citation, and the tactic-graph-native-dispatch spec sentence is
      reconciled in this same commit."
  - question: What is /dispatch-emulate, why does the dispatch surface own a
      hand-driven emulation entry point, and what bounds it?
    answer: "(Recorded 2026-08-12 /align interview, post-hoc: the skill landed
      first, at 55d07b51 / PR #3069, and this entry records the requirement it
      was built to.) THE PROCEDURE. Drive ONE tactic node through the real
      dispatch phase ladder, one phase at a time, as spawned sessions running
      the real dispatch phase skills — align-tactics, implement, the fix and
      conflict interrupts, review, qa, main-qa. Nothing in it re-implements a
      phase. IT EXISTS FOR the case the tick structurally cannot reach: dispatch
      is paused and the fix is what would unpause it, or any other bootstrap
      deadlock the tick has no route into, or an author who wants one node
      driven under supervision. Before the extraction the procedure was written
      down only inside /rsi Step 4b, so reaching it meant running a full /rsi
      iteration with its claim, its plan render, its judgment step and its
      budget. WHY THE REQUIREMENT IS RECORDED HERE rather than on
      strategy-recursive-self-improvement, which built it: this strategy owns
      the dispatch skill surface, and it already carries the emulation doctrine
      this skill must obey — the clarifications on what a bootstrap-emulating
      session owes the qa phase and the review phase (2026-07-04, entries
      19-20). rsi keeps only what is rsi's: the budget, the attendedness, the
      judgment step, and pause authority; /rsi Step 4b is now a delegation to
      this skill, and rsi's own rsi-implement-contract clarification is amended
      to match in the same round. THE BOUND — recorded as a divergence, not an
      omission. The steelman put to the author: a user-invocable emulation skill
      IS the second orchestration surface strategy-recursive-self-improvement's
      condition 3 forbids, and giving it its own front door removes the three
      guards that bounded the 2026-08-10 divergence — attended, serialized,
      budget-bounded. DIVERGED 2026-08-12, reason recorded: the extraction moves
      no scheduling authority at all. graph-select-target --node owns every
      eligibility question — claim safety, the per-phase CI and PR sensor gates,
      the fix and conflict interrupts — and --node is a selection-ORDER
      override, never a gate bypass; dispatch-graph-execute owns provisioning,
      the phase-to-skill mapping, the spawn, the reservation handoff, and every
      park and hold disposition; the verdict comes from verify-landed against
      origin/main, never from a session's exit status. So there is one
      orchestration surface, now merely named. THE INVARIANT that keeps the
      divergence honest, and the thing to check any future edit against: THE TWO
      SCRIPTS DECIDE NOTHING. If a rule about when a node may run ever appears
      in dispatch-emulate-advance or dispatch-emulate-await, it is in the wrong
      place and belongs to the selector. Second half of the bound: the skill has
      NO attendedness and NO pace-exemption of its own — it is attended because
      its callers are, and it inherits nothing else. A STRATEGY ID IS REFUSED
      MECHANICALLY, not by prose: dispatch-emulate-advance gates on the
      selector's own kind, prints 'refused <id> strategy' and exits 2, before
      any reservation is written, because an /align-tactics pass on a strategy
      decomposes it into CHILD tactic ids rather than advancing the strategy up
      the ladder — so there is no single node for the loop to follow. A tactic
      whose selector rung is align-tactics is a legitimate starting point, since
      /align-tactics finalizes that same node in place. THE LOOP'S FINAL STEP is
      the implementation evaluation (author ruling, 2026-08-12), which /rsi
      inherits through the delegation rather than carrying separately; see
      strategy-recursive-self-improvement's condition 14 and
      tactic-rsi-implement-acceleration-review, re-targeted to this skill in the
      same round. (Amended 2026-08-12, same-day /align round — superseded in
      name and substrate. /dispatch-emulate is retired and replaced by
      /dispatch-ladder: a detached shell driver that carries the whole ladder to
      phase done, not a hand-driven per-phase loop. Everything recorded above
      survives unchanged — the procedure, the case it exists for, the divergence
      bound, the selector's ownership of every eligibility question, the
      mechanical strategy-id refusal, and the align-tactics rung as a legitimate
      start. What changes: the sequencing moves from skill prose into owned
      code, the run detaches from the calling session, and THE LOOP'S FINAL STEP
      named above is re-ruled — the closing implementation evaluation is now
      performed by the invoking session after it polls the detached run to
      terminus, because a shell driver cannot perform a judgment review. See the
      entry recorded the same day on what replaces /dispatch-emulate.)"
  - question: Who merges an emulated run's PR — the tick's merge lane, or the
      emulation loop itself?
    answer: "(Author-directed 2026-08-12, after the /align interview surfaced a
      false instruction shipped in the skill.) THE DEFECT. /dispatch-emulate's
      SKILL.md ships the rule 'Never hand-merge. The tick's merge lane runs even
      while dispatch is paused. Let it.' The second sentence is false as
      written, and this graph already knew it: graph-auto-merge is invoked only
      at dispatch-select-tick:505, and every dispatch-select-tick invocation
      sits past the pause short-circuit's exit 0 at dispatch-tick:415, so no
      node-lane PR merges while the pause sentinel exists. The sentence was
      inherited verbatim from /rsi's Step 4b during the extraction; note that
      the extraction REMOVED it from /rsi, so it has one home, not two. THE
      AUTHOR'S CHALLENGE, and the ruling: the loop delegates every other phase
      to the same scripts dispatch uses, then outsources the terminal step to
      the scheduler it exists to route around — a structural inconsistency, and
      it fails precisely when the loop is most needed. So the answer is not to
      patch the sentence but to make it unnecessary. GREENFIELD DESIGN, adopted:
      graph-auto-merge owns ALL of its admission gates — including the
      main-known-good check that today lives in dispatch-select-tick around the
      call site rather than inside the script — and takes an optional node-id
      filter, so a caller can merge one node rather than sweeping the queue;
      reconcile-graph-merged takes the same filter, because a merge the loop
      performs must also be absorbed or the node sits merged-but-stuck at phase
      review. Both the dispatch tick and /dispatch-emulate then call one
      fully-gated script, and the pause gates worker spawning only, exactly as
      this graph's pause doctrine already says it should. The emulation loop
      still decides nothing: it delegates the merge the same way it already
      delegates selection and launch. WHY THIS DOES NOT BREAK THE ONE-GATE
      INVARIANT of the 2026-08-05 admission-gate ruling (entry 197) — it extends
      it. Main health is a FOURTH predicate on the same single admission
      decision as mergeability, office_hours and blocked_by, and that ruling's
      named defect is uncoordinated tactics racing the same gate surface. So the
      main-health predicate is sequenced BEHIND the two gate tactics still open
      (tactic-graph-auto-merge-up-to-date-gate at implement,
      tactic-graph-auto-merge-office-hours-gate at main-qa) rather than opening
      a third racer. ACCEPTED CONSEQUENCES, named: two callers of one gated
      script can race when dispatch is unpaused — benign, because the second
      sense reads a non-OPEN PR and skips; and the pause stops meaning 'no
      merges', which is acceptable because the record already names an
      operator-run dispatch-tick --manual and an author hand-merge as legitimate
      escapes, so this formalizes an existing escape rather than inventing one.
      The skill's stated invariant that neither script makes a merge, a graph
      write, or a gh call is re-scoped accordingly: neither script makes a
      DECISION. SEQUENCE: (1) tactic-pause-disables-merge-lane (PR #3068, in
      flight at phase qa) makes the paused tick run the node-lane merge chain —
      verified this round to gate correctly on OPEN_MAIN_RED via
      dispatch-graph-main-red-sync and to run reconcile-graph-merged
      unconditionally; (2) tactic-graph-auto-merge-main-health-gate moves that
      gate into the script and adds the node filter, deleting BOTH call-site
      copies (#3068 adds a second one); (3) tactic-dispatch-emulate-owns-merge
      adds the node-scoped merge-and-absorb step to the loop and rewrites the
      false rule. An interim wording correction lands ahead of all three,
      because the false instruction is live on main while the queue is paused —
      the exact condition under which someone would read it. OPERATIONAL NOTE
      worth keeping: #3068 is itself stalled behind the bug it fixes, sitting at
      qa while the pause blocks worker spawning and blocks the merge that would
      land it — the same self-blocking loop this graph recorded for PR #3052.
      (Amended 2026-08-12, same-day /align round — the ruling stands, its third
      sequence item moves. Items (1) tactic-pause-disables-merge-lane and (2)
      tactic-graph-auto-merge-main-health-gate are unchanged and still gate the
      work. Item (3), tactic-dispatch-emulate-owns-merge, is superseded by
      tactic-dispatch-ladder-skill, which carries the node-scoped
      merge-and-absorb step into /dispatch-ladder's shell driver. The
      replacement also strengthens the ruling's own point: the ladder now runs
      THROUGH merge-and-absorb to phase done rather than leaving through idle,
      so the structural inconsistency named here — a loop that delegates every
      phase then outsources its terminal step to the scheduler it exists to
      route around — actually goes away rather than being narrowed. The accepted
      consequences named here are unchanged and are not re-litigated.)"
  - question: What replaces /dispatch-emulate — what is /dispatch-ladder, how much
      of the loop may the AI carry, and what bounds a detached driver?
    answer: "(Recorded 2026-08-12 /align interview, same day as the entries it
      amends.) THE REPLACEMENT. /dispatch-emulate is retired and replaced by
      /dispatch-ladder <node-id>. THE NAME: the author's prompt proposed
      /dispatch-workflow and the author then chose /dispatch-ladder instead,
      because 'workflow' already carries two other senses here — the harness
      Workflow tool, and 'the dispatch workflow' of strategy-distribute-workflow
      — and the substrate ruling below excludes the first sense, so the name
      would point a fresh clean session at the one implementation ruled out.
      'Ladder' is this record's own word for the phase sequence. 'Emulate'
      retires because the loop no longer emulates a tick: it runs the ladder
      and, once the merge step lands, completes the node itself. THE SPAN — what
      distinguishes it from the two existing entry points. The scheduled tick
      and the manual `dispatch [<node-id>]` lane each execute ONE phase or
      intervention per invocation; /dispatch-ladder progresses one node all the
      way, /align-tactics through /qa-main and on through the node-scoped
      merge-and-absorb. TERMINUS, ruled: run to terminal state — phase done, a
      halt disposition, or a throw — not 'stop after main-qa' as the author's
      prompt literally read, because stopping at main-qa leaves the loop
      outsourcing its last step to the scheduler it exists to route around, the
      exact structural inconsistency the same-day owns-merge ruling exists to
      close. THE NEW REQUIREMENT: sequencing and conditional logic move out of
      skill prose into owned code; the AI carries as little as possible.
      SUBSTRATE, ruled — a plain shell driver, NOT a Workflow-tool script. The
      deciding fact, put to the author because it inverts the obvious reading of
      'workflow script': a Workflow-tool script has NO filesystem or shell
      access, its only primitive is agent(), an AI subagent — so driving the
      phase primitives through it would ADD an AI layer to a loop that is
      already pure exit-code branching, achieving the opposite of the
      requirement. Compounding it, this graph already records that a Workflow
      launched by scriptPath dies unrecoverably when backgrounded. The precedent
      for a fully mechanical driver is dispatch-tick itself, a bash script that
      selects, launches and disposes with no AI at all. VERIFIED THIS ROUND,
      discharging a claim flagged as unproven when the recommendation was made:
      the loop's entire branch surface is exit codes and nothing in it needs
      judgment — advance gives 0 launched / 2 usage-or-strategy-refused / 10
      idle / 11 throw / 13 claimed, await gives 0 advanced-or-pruned / 11 throw
      / 12 stalled / 14 unknown-graph-read / 20 still-running. RUNTIME, ruled —
      detached. The measured phase durations on the superseded
      acceleration-review node (implement 14m10s, qa 15m59s, fix ~50m) put a
      full ladder at hours, while the Bash tool's ceiling is 600s. That ceiling
      is WHY today's skill has the model re-call await on exit 20 repeatedly,
      and that re-calling IS the AI sequencing being removed — a foreground
      driver would preserve the very defect. So the driver launches as a
      transient systemd-run --user unit, the pattern dispatch-spawn-tick already
      uses for the tick, logging to journald, with the calling session returning
      immediately. Rejected: a bounded-window foreground driver (thins the AI's
      role, does not remove it) and a background Bash tool call (dies with the
      session, which is the failure this loop hits most, since bootstrap
      deadlocks are long). THE STEELMAN, put to the author from this graph's own
      record, and the ruling. Rival framing: a detached, hours-long,
      self-sequencing node driver IS the second orchestration surface
      strategy-recursive-self-improvement condition 3 forbids, and detaching
      falsifies the second of the two claims the 2026-08-12 divergence rested on
      — that the skill is attended because its callers are. RULED: detached
      execution, attended judgment. The driver detaches the WAITING only. It
      never resolves a throw — exits 11, 12 and 14 halt the run unconditionally,
      with no retry, no auto-park, no resume without a person. Attendedness is
      preserved where it means something (judgment), not where it is only
      polling. The divergence's FIRST claim is untouched: graph-select-target
      --node still owns every eligibility question, dispatch-graph-execute still
      owns provisioning, the phase-to-skill mapping, the spawn, the reservation
      handoff and every park/hold disposition, and the verdict still comes from
      verify-landed against origin/main. THE INVARIANT, re-scoped. 'The two
      scripts decide nothing' becomes: the driver may SEQUENCE, never gate.
      Sequencing is not authority here — the driver only re-asks the selector
      what to do next, and every answer remains the selector's. THE CLOSING
      REVIEW — a problem detachment creates that the attended loop did not have.
      rsi condition 14 requires the acceleration review to run after terminus,
      never interleaved; a detached run reaches terminus with no session
      attached, and a shell script cannot perform a judgment review. RULED: the
      invoking session, or a later author-started one, polls a status script to
      terminus and then runs the review. Rejected: a terminus marker a later
      session owes (risks the review being owed and never paid — precisely the
      defect condition 14 names) and a driver-spawned review session (makes the
      driver spawn AI work, the autonomy declined above). RETIREMENT, ruled —
      full rename. dispatch-emulate-advance and dispatch-emulate-await become
      dispatch-ladder-advance and dispatch-ladder-await with their tests;
      .claude/skills/dispatch-emulate/ is deleted; /rsi Step 4b repoints by
      name. Rejected: keeping the script names (leaves the retired word embedded
      in the primitives and their tests) and folding the primitives into the
      driver (loses two independently-testable units and the ability to step one
      phase by hand). THE FOLDED NODES. tactic-dispatch-emulate-owns-merge (raw)
      and tactic-rsi-implement-acceleration-review (phase implement, in flight,
      already re-targeted once the same day) are both superseded by
      tactic-dispatch-ladder-skill, which carries their scope forward: the
      node-scoped merge-and-absorb step, the closing acceleration review, the
      await-window sizing, and the irreplaceable measured-durations table. The
      new node stays blocked_by tactic-graph-auto-merge-main-health-gate — the
      node-scoped merge can only be delegated once graph-auto-merge owns the
      main-health gate and takes a node filter. Rejected: letting the in-flight
      node land first (pays for the same implement work twice) and a third
      re-target of the same node (the record already names repeated re-targeting
      as a defect pattern). SERVES, and why it is two edges.
      tactic-dispatch-ladder-skill serves BOTH strategy-graph-native-dispatch —
      the artifact-owner rule of clarification 27, the changed artifact being
      this strategy's dispatch skill surface — and
      strategy-recursive-self-improvement, whose condition 14 is the requirement
      carried. The superseded node kept rsi alone, reasoning that a second edge
      'would be a ranking act with no ordering effect (band is max across
      distributors, and rsi resolves higher)'. That has inverted: rsi is the
      higher distributor, so dropping it would LOWER the rank, and keeping both
      PRESERVES the rank rather than granting one. DELEGATION ADVICE, Step 3
      finding. This round's substrate choice moves a real loop off proprietary,
      session-bound harness machinery (the Workflow executor) onto owned shell —
      concrete evidence for the recovers edge to delegation-anthropic-claude
      that tactic-graph-ops-model-recovery-edge owns. The edge is deliberately
      NOT added here, honoring that node's own recorded instruction that an edge
      claim on delegation-anthropic-claude is doctrinally heavy and must not be
      settled as a side effect of an efficiency amendment; the evidence is cited
      so the deciding round finds it. FREEZE BLAST RADIUS of this round,
      measured with readNode + isFingerprintStale rather than a grep: one
      stamped open child, tactic-strategy-fingerprint-stamp-coverage (phase qa),
      classified ORTHOGONAL — its plan is the router's stamp-write plumbing,
      untouched by ladder-driver doctrine — and re-stamped in this same commit.
      Every other open child serving this strategy is unstamped and freezes
      nothing."
  - question: Is a recording round answerable for the internal consistency of its
      own output, given that /align has no plan schema and refining tactical
      content is /align-tactics’ job?
    answer: "(Recorded 2026-08-12 /align interview, arising from a /dispatch-ladder
      closing acceleration review.) YES — with the boundary drawn at
      CONSISTENCY, never at plannability. DIVERGENCE, recorded with its reason:
      the rival framing holds that an /align-tactics park is the mechanism
      working, because the delegation economics deliberately move planning off
      the author’s present, expensive interview time onto a cheap autonomous
      session, so spending an autonomous session to discover unplannability is
      the correct trade rather than waste. That framing is adopted for
      plannability and diverged from for self-consistency: catching a
      contradiction between two things the SAME round wrote consumes no author
      judgment at all, so the economics argument does not reach it. Step 4’s
      retain-not-refine rule is preserved verbatim — no plan schema and no
      quality bar enter /align — and the duty asserted here is already implied
      by Step 2’s standing obligation to always surface graph-internal
      inconsistencies. EVIDENCE: commit 8249f664 (2026-08-12 14:22), an /align
      round on strategy-graph-drives-dispatch, created
      tactic-attention-namespaced-rank — whose body defers per-tier boost
      storage to tactic-attention-per-tier-boost-migration — and in the SAME
      commit gave that sibling blocked_by: [tactic-attention-namespaced-rank],
      ordering the dependency after its own dependent. A /dispatch-ladder run
      then spent roughly 13 minutes of Opus inside /align-tactics rediscovering
      that inversion and parked the node (2184103c) for author ratification. The
      defect was free to catch in the authoring round and cost a full autonomous
      session to catch downstream. The same census pass found at least three
      earlier parks naming an upstream recording round’s record gap as their
      cause, one stating outright that it was a record-completeness gap of the
      2026-07-02 /align-strategy round. SCOPE LIMIT: this does NOT make /align
      answerable for whether a recorded tactic is plannable. That remains
      /align-tactics’ sole judgment, and a park on genuine requirement ambiguity
      — including the 2184103c park itself, which turned on an unratified
      storage-shape ownership question — remains correct behavior. CAPTURE NOTE:
      the walk makes Claude the checker of Claude’s own output, the same
      self-audit shape strategy-graph-integrity records for its recurring
      /align-audit; the loop is controlled, not unwound — no recovers edge is
      added on that account. Mechanisms retained this round as draft tactics:
      tactic-align-round-self-consistency-walk (the Step 6 walk),
      tactic-validate-graph-ordering-inversion-lint (the mechanical backstop),
      and tactic-align-tactics-premise-preflight (early refusal, so an
      unplannable node parks cheaply). A fourth,
      tactic-park-cause-sensor-instrument, was filed by this same round after it
      measured that appending the park-cause sensor to success_signal.sensor
      recorded the observable but registered nothing — the census sensor counter
      read 19/53 with 45 unregistered both before and after the append, because
      read-sensors matches the entire success_signal.sensor string against
      registered Sensor names and this strategy’s prose was already
      unregistered. Filing it rather than deferring it is this condition applied
      to the round that recorded it."
  - question: Is a session orphaned by a daemon crash, restart, or version roll an
      invalid state?
    answer: "(Recorded 2026-08-13 /align interview, author-ratified.) No — and this
      is a ruling on the taxonomy, not a routing exception. An environmental
      failure is a legitimate, expected state whose casualties are ORTHOGONAL to
      the invalid-state dimension, the same shape as the 2026-08-04
      done-but-parked ruling that phase and office_hours are orthogonal
      dimensions. Clarification 185's detection design is a binary —
      occupied-by-terminal routes to the lane, occupied-by-live is a valid skip
      — and a daemon casualty is neither: the session is genuinely dead, yet the
      state is legitimate and expected. That binary is amended here: detection
      SUPPRESSES an environmental casualty, so no surface classifies it. Neither
      the dispatch tick's sweeps nor /dispatch-ladder may recognise an orphaned
      session as terminal-session or frozen-session; the lane never sees it and
      spends nothing on it. Recovery is the AUTHOR's, by restart. Orphaned
      background sessions are deliberately NOT proactively adopted when a new
      daemon generation starts — that behaviour is kept exactly as it is today
      and is not a defect to fix; the harness's own lazy re-adoption may still
      recover such a session, but no machinery recorded here is owed that
      outcome. Rejected alternative, the strongest rival framing put to the
      author: make environmental a sixth invalid-state kind whose intervention
      tier is notify-and-stop. It would preserve one uniform
      detect-resolve-escalate pipeline and give the casualty a durable record,
      but it spends lane machinery — a per-node attempt cap, a spawned model
      session, a follow-up node — on a state that needs none, and it would keep
      producing exactly the false positive this ruling exists to stop. Evidence:
      2026-08-13, node tactic-attention-namespaced-rank, session 40c253c4. The
      daemon crashed at 15:04:29Z (journald: \"Scheduled restart job, restart
      counter is at 1\"), then a deliberate stop/start rolled the CLI from
      2.1.227 to 2.1.231 at 15:12:56-15:13:01Z, killing an in-flight review-fix
      Workflow's finder agents mid-fan-out. dispatch-fleet-watch alarmed the
      outage correctly at 15:04:28Z and landed
      tactic-fleet-alarm-daemon-degraded at 15:05:38Z; dispatch-tick nonetheless
      routed the casualty to the invalid-state lane as terminal-session at
      15:16:12Z. The session was re-adopted at 16:37:08Z and its Workflow
      resumed and completed — an 84-minute stall with no work lost. One root
      event, classified twice: once correctly as environmental and author-owned,
      once wrongly as an invalid state and machinery-owned. Implementation
      retained as draft tactic-invalid-state-environmental-suppression."
  - question: What discriminates an environmental casualty from a genuine
      terminal-session, without racing the daemon's own recovery?
    answer: "(Recorded 2026-08-13 /align interview, author-ratified.) Classification
      consults the daemon's current GENERATION, never its current health. A
      health check races the recovery and fails silently: on 2026-08-13 the tick
      classified at 15:16:12Z when the daemon had already been healthy since
      15:13:01Z, so an \"is the daemon up now?\" gate would have answered yes
      and routed anyway. The generation test has no such window — it stays
      correct however long after the outage it runs. The chosen signal is
      systemd's ExecMainStartTimestamp on dispatch-claude-daemon.service: a
      session whose last activity predates the current generation's start
      belongs to a previous generation and is therefore an orphan. Applied to
      the incident, the session's agents last wrote at 15:04:27Z against a
      generation that started at 15:13:01Z. Chosen over stamping the daemon's
      InvocationID into session job state at spawn — which is exact and
      race-free by construction — because ExecMainStartTimestamp needs NO new
      write path: both values already exist today, and an InvocationID stamp
      would protect only sessions spawned after it ships, leaving a fallback
      needed anyway. The residual few-second race at a restart boundary biases
      toward suppression, which is the fail-toward-keep posture clarification
      185 already ratified for every mechanical-tier gate. NRestarts is NOT
      usable and must not be built on: it read 0 immediately after this
      incident, because the version roll's explicit Stop/Start reset it, even
      though journald had recorded \"restart counter is at 1\" for the crash
      minutes earlier. The check stays in owned script code with no per-node
      model spend, per condition 23: dispatch-daemon-liveness is already an
      owned, offline-testable script that dispatch-fleet-watch calls, while
      lib-frozen-session-park.sh — the classifier that routed this node, at its
      terminal-session route site — references it zero times today."
  - question: The author is the recovery mechanism for an environmental failure —
      what does the fleet alarm owe them?
    answer: "(Recorded 2026-08-13 /align interview, author-ratified.) The restart
      worklist. Because recovery is author-initiated by ruling (the
      environmental-casualty clarification of this same date), the alarm that
      reports the outage must also name what the outage stalled:
      tactic-fleet-alarm-daemon-degraded's body carries the in-flight nodes and
      /dispatch-ladder runs orphaned by the generation change, not merely the
      daemon fault. A fault the author cannot act on without first enumerating
      casualties by hand is not yet a signal — it names the cause and withholds
      the work. This is the condition that makes \"the author restarts on daemon
      failure\" a real recovery path rather than a hope: on 2026-08-13 the alarm
      fired correctly within four seconds of the crash and the stall still ran
      84 minutes, because nothing connected \"the daemon died\" to \"this ladder
      run is stalled, restart it\". Implementation retained as draft
      tactic-fleet-alarm-daemon-casualty-list. A sibling defect found in the
      same reading is retained separately as
      tactic-fleet-alarm-resolve-rollback-latch: dispatch-fleet-alarm --resolve
      --kind daemon-degraded failed on every pass after the daemon returned
      (11:05:52, 11:11:38 and 11:16:34 EDT, each logging \"resolve of
      tactic-fleet-alarm-daemon-degraded failed; the write was rolled back to
      origin/main\"), leaving the alarm latched open against a managed-live
      reading — an alarm that cannot clear stops being a signal in the other
      direction, and a latched alarm degrades the very channel this
      clarification makes load-bearing."
  - question: How is a finding recorded on the graph, and does the producer change
      the answer?
    answer: >-
      (Recorded 2026-08-14 /align round, widening this node's sole-issue-tracker
      condition from "the graph is the only place findings live" to "findings
      live there the same way".) No — the producer never changes the answer. A
      finding is an ordinary DRAFT TACTIC: phase null, serving the strategy that
      owns the artifact it touches, whoever produced it — an /align Step 4
      interview byproduct, a /review-fix follow-up, a /qa-main bug record, a
      /rsi phase evaluation, an /rsi-audit ranked opportunity. Three rules bind
      every producer equally. ONE, FIND BEFORE MINTING: search the open tactic
      set for the same root-cause defect and, on a match, record the recurrence
      on that existing node — a recurrence updates attributes.measured_impact
      and mints nothing. TWO, THE SEARCH SET IS THE WHOLE GRAPH, NEVER A
      NAMESPACE: no producer may scope the mint-or-reuse decision to an id
      prefix or to a class attribute of its own, because a duplicate minted
      outside that scope is structurally invisible to the search that is
      supposed to catch it. THREE, MEASUREMENTS ARE NOT PRUNED: a node carrying
      attributes.measured_impact is exempt from unreferenced-pruning regardless
      of who wrote it, because pruning it destroys the measurement, and a
      recurrence after retirement RESUMES the count rather than restarting at 1.


      This retires the evaluation-finding ledger as a distinct graph primitive —
      attributes.ledger_entry as a class marker, the tactic-eval-finding-*
      namespace as a membership test, and a per-producer private writer all go.
      It is not a theoretical tidy-up. The split it repairs is recorded with
      evidence on tactic-eval-finding-eval-finding-list-misses-nonledger: two
      nodes minted ten minutes apart for one defect, the shipped fix citing the
      node OUTSIDE the namespace while the recurrence count stayed stranded on
      the one inside it — an outcome a namespace-scoped search structurally
      could not have caught, and the exact outcome the merge discipline exists
      to prevent.


      The seam the class marker is often thought to carry — a record is not a
      task — is kept, not dissolved: phase null (draft) is the observation
      state, and the router emits drafts at the align-tactics rung where a
      decomposition session decides whether the observation is work. Carriers:
      tactic-eval-finding-ledger (retire the marker, re-key the prune exemption
      to attributes.measured_impact) and tactic-finding-search-all-producers
      (the find-before-minting step in each producer's skill). The observable
      that says this holds lives on strategy-recursive-self-improvement, where
      /rsi — the instrument that reads it — lives.
  - question: Must a /dispatch-ladder run carry its node all the way to a terminal
      state, or may it stop once the PR merges?
    answer: >-
      (Recorded 2026-08-14 /align interview.) Standing requirement: a
      /dispatch-ladder run may not report a terminal disposition until its
      node's work is TERMINAL — phase `done`, or legitimately excused. Merge is
      not a terminus. Exactly two excuses count: the work is parked to
      office-hours (`office_hours` non-null), or it is blocked on an awaited
      event it cannot yet observe. Nothing else — a halt, a drained budget, a
      reconciler error, or a phase left mid-flight is a violation, not a stop.


      WHY THIS IS NOT ALREADY SATISFIED BY THE RECORDED DESIGN. The code already
      intends it: `dispatch-ladder-run`'s exit-0 contract is "the node reached
      phase `done` at origin/main, or was pruned", and
      `dispatch-ladder-advance:239-245` describes the loop's job as "follow this
      node to main-qa". What the record ALSO says is that `review`'s clean
      completion arms auto-merge and the FLEET-WIDE reconciler sweep — not the
      ladder — writes the post-merge phase
      (packages/intentionsutil/src/transitions.ts:75-78). That split is the
      defect surface: the ladder's terminus depends on an actor it does not
      control. Live case, tactic-attention-namespaced-rank: PR #3075 merged
      2026-08-13T23:27:31Z; the ladder's own reconcile pass hard-errored at
      23:38:10Z (exit 11, `reconcile-graph-merged hard-errored (rc=1)`, itself
      the unrelated-dirty-main-checkout refusal recorded as
      tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt); the node
      reached `main-qa` only when the fleet sweep ran ~2.5h later (commit
      1817ac7f) and has sat there since. The ladder reported a halt; the merge
      looked like success; nothing carried the node on.


      THE DIVERGENCE THIS RESTS ON — STATE VERSUS LIVENESS. The strongest rival
      conception was put and DIVERGED from: it argues that this strategy's core
      claim is that orchestration state lives in the GRAPH, so terminal
      responsibility belongs to the reconciler reading origin/main, and an
      ephemeral driver that owns completion re-centralises control in exactly
      the place the strategy moved it away from — making #3075's stall a
      reconciler-availability bug, not a ladder-ownership bug. Diverged because
      STATE and LIVENESS are separable properties. The graph remains the sole
      home of orchestration state; the ladder owns only the guarantee that
      SOMEONE drives a node to terminal. A driver holding liveness reads no
      state the graph does not already hold and writes none the graph does not
      already own, so it does not re-centralise state. The rival is right that
      reconciler availability is also a defect — it is recorded separately — but
      availability of one absorbing actor is not a substitute for a run being
      answerable for its own node.


      PAUSE IS ORTHOGONAL, NOT AN EXCEPTION. (Author ruling, this interview,
      correcting the interviewer's framing.) The dispatch pause sentinel gates
      SCHEDULED dispatch ticks only. It does not gate /dispatch-ladder.
      /dispatch-ladder picks up wherever its target node stands — whether left
      mid-flight by scheduled dispatch, by a failed earlier ladder run, or by
      anything else — so a paused fleet neither excuses nor blocks this
      requirement. It is not an exception because it is not in scope. Corollary:
      a node stranded post-merge while the fleet is paused is recoverable by
      invoking /dispatch-ladder on it directly, and the five nodes counted below
      are recoverable that way today.


      THE REQUIREMENT FOLLOWS THE WORK, NOT THE NODE. The 2026-07-28
      clarification on this strategy adopted a greenfield in which the source
      tactic goes review -> done directly — "no main-qa phase on the source, no
      residue body append" — and post-merge work instead lives on standalone
      tactic-mainqa-* nodes carrying their own routing. Under that shape a
      source's ladder legitimately never touches main-qa, which would hollow
      this requirement out if it bound the node. It binds the WORK: a run may
      not report complete until the main-qa work it spawned is itself terminal
      or excused, whether that work sits on the source's own phase or on a
      standalone tactic-mainqa-* node it created. This is a real scope increase
      — it makes a run answerable across a node boundary, which no ladder code
      does today — and is the substance of the implementing tactic.


      MEASUREMENT. Observable: the merged-but-not-terminal count — a census over
      intentions/ at origin/main of nodes whose `execution.completion.mergedAt`
      is set but whose `phase` is not `done` and which carry neither
      `office_hours` nor a non-empty `blocked_by`. Sensor: graph census (the
      predicate is exactly the two recorded excuses, so this is a direct count,
      not a proxy). Threshold: 0. Measured 2026-08-14 at origin/main 206a6994:
      29 merged-not-done, 24 excused, 5 VIOLATIONS —
      tactic-align-tactics-mark-terminal-skipped (#3047),
      tactic-attention-namespaced-rank (#3075),
      tactic-dependency-justification-audit (#2875),
      tactic-graph-commit-landing-signal-unreliable (#3050),
      tactic-pause-disables-merge-lane (#3068). That 24 of 29 classify as
      excused is the evidence the two-excuse predicate discriminates rather than
      merely passing everything.


      KNOWN GAP IN THE PREDICATE, CARRIED INTO THE TACTIC. The second excuse is
      not machine-readable today. tactic-attention-namespaced-rank's own
      needs-main residue records "Verifiability: WAIT — awaited event:
      tactic-attention-per-tier-boost-migration lands", which IS an awaited
      event under this requirement — but it lives as prose in a body section,
      not as a `blocked_by` edge, so the census scores it a violation. Either
      such waits gain a structural edge or the sensor stays approximate;
      resolving that is in scope for the implementing tactic and must not be
      closed by loosening the census to accept prose.
  - question: Where does /align's own charter live after 2026-08-13, and what did
      that re-homing change here?
    answer: "The /align interview's charter — elicitation, capture-completeness, and
      the adversarial draft review — moved to a new child of
      strategy-explicit-intent, strategy-discovered-requirements, whose
      clarifications carry the boundary rule and the reasoning. This strategy
      keeps /align-tactics: it turns recorded intent into dispatchable work, so
      it is a dispatch phase worker and its defects are this strategy's
      machinery defects. Four things are recorded here rather than left to be
      re-derived. (1) serves membership is unchanged for
      tactic-align-review-skill and tactic-align-round-self-consistency-walk:
      both now name strategy-discovered-requirements FIRST and this strategy
      second, honestly, because both touch artifacts of both (graph-commit's
      --review flag here, the /align skill there) and because this strategy
      still holds the doctrine they implement — the draft-review gate condition
      and the self-consistency condition — which a node-assigned session
      receives only through its serves chain. So this node's backlog ratio does
      not move, and no signal reading is disturbed. (2) This node's
      success_signal is deliberately NOT edited. Its sensor string is the
      registry key that read-sensors.ts's LIFECYCLE_SENSOR_NAME mirrors
      character-for-character, guarded by
      packages/intentionsutil/test/lifecycle-sensor.test.ts; the round's first
      draft moved the sensor's park-cause clause to the new strategy and would
      have de-registered the lifecycle sensor and turned main red. Migrating
      that clause is owed and requires a paired code change landing outside
      intentions/, which graph-commit cannot carry. (3) The park-cause clause
      and its unimplemented instrument (tactic-park-cause-sensor-instrument)
      therefore stay here for now, even though they measure
      capture-completeness, which is the new strategy's charter. (4) Amending
      this node's clarifications changes its substance fingerprint, which
      soft-freezes exactly one stamped open child,
      tactic-strategy-fingerprint-stamp-coverage at phase qa; the freeze is
      benign — nothing in this amendment bears on that node's plan — and it
      clears on the next restamp. (Recorded 2026-08-13) (Amended 2026-08-14 by
      the author's ratifying round, which falsified three statements above.
      FIRST, this strategy no longer holds the doctrine those tactics implement:
      the draft-review gate and the self-consistency condition both moved to
      strategy-discovered-requirements, and the /align actuator tooling_goal
      moved with them. SECOND, serves membership did NOT stay unchanged —
      tactic-align-round-self-consistency-walk dropped its second edge to this
      node, because that edge existed only to deliver the condition that has now
      moved; tactic-align-review-skill keeps both edges, on the independent
      artifact ground that it builds graph-commit --review. THIRD, the backlog
      ratio therefore DID move, slightly: measured post-write with
      strategyBacklogBand, 58/275 (0.2109) against 58/276 (0.2101) before — the
      backlog count is unchanged because the dropped node classifies as a draft,
      and only the denominator falls by one. The reasoning recorded above was
      sound for the 2026-08-13 round it describes; it is superseded rather than
      wrong, and is kept as the history of how the re-homing was staged.)"
  - question: Where did the /align actuator goal, the draft-review gate and the
      self-consistency condition go, and why did they leave this node?
    answer: "Re-homed to strategy-discovered-requirements by the author's ratifying
      /align round (Recorded 2026-08-14). The author was asked directly what the
      draft-review gate and the self-consistency condition are about and
      answered: /align's output. That settles a placement this node had held
      since 2026-08-11 and 2026-08-12 respectively, and the record corroborates
      the answer rather than merely permitting it — the self-consistency
      condition's own text binds consistency \"ONLY and never plannability,
      which stays /align-tactics' sole judgment\", distinguishing the recording
      round from /align-tactics, and its cited incident is an inverted
      blocked_by authored by a recording round that then cost a downstream
      /align-tactics session ~13 minutes. The /align actuator tooling_goal
      followed them: a tooling_goal claims what a strategy builds, and this node
      would otherwise declare it builds /align while owning none of the tactics
      that improve it. What this node keeps is /align's role as the
      gh-replacement entry point — the condition that no new work enters via gh
      once /align is live is unchanged and still lives here; what moved is
      /align's charter and the quality of its interview. The /align-tactics and
      router-tick actuator goals are untouched, as is the lifecycle sensor goal.
      The gate was also SCOPED on the way over, not merely moved: it now covers
      an /align round's own output only, and a /align-tactics decomposition, a
      qa-fix finding node and a router transition are explicitly out of scope —
      so the receipt floor tactic-align-review-skill builds must not make
      graph-commit refuse every caller's write. That scoping is binding input to
      that tactic, decided while it is still unplanned. Freeze cost of this edit
      measured before it landed with readNode + isFingerprintStale rather than a
      grep over strategy_fingerprint: one open child,
      tactic-strategy-fingerprint-stamp-coverage, which was already stale from
      the 2026-08-13 round and is left stale. It was the only one of this node's
      46 open children carrying a non-null stamp at all — a fact that is itself
      the argument for that tactic. Also verified before landing, because the
      2026-08-13 round's first draft was caught de-registering a sensor this
      way: no code mirrors this node's conditions or tooling_goals verbatim. The
      only prose coupling is read-sensors.ts's LIFECYCLE_SENSOR_NAME to
      success_signal.sensor, which this round does not touch."
  - question: Is the find-before-minting rule discharged by each producer's skill
      stating it, or by one shared write surface every producer calls?
    answer: "(Recorded 2026-08-14 /align round, second round of this date, on author
      ruling; amending the same-day 'How is a finding recorded on the graph'
      ruling, which this strengthens rather than reverses.) By ONE SHARED WRITE
      SURFACE. That ruling named its carriers as tactic-eval-finding-ledger
      (retire the rsi-private marker and namespace) and
      tactic-finding-search-all-producers, described as 'the find-before-minting
      step in each producer's skill' — a rule installed as PROSE IN EACH of six
      producer skills. The author raised the bar to merged common logic, stating
      the goal as DRY/parsimony, and the reason it is the right bar is that six
      copies of one instruction is the same defect class as five scripts: it is
      precisely how the repo arrived at five private writers. MEASURED at record
      time: seven skills call five distinct private writers —
      dispatch-eval-finding, dispatch-invalid-state-followup (its own
      tactic-invalid-state-rc-<sha256> namespace, exactly the namespace-scoped
      search this ruling forbids), dispatch-security-followup with
      dispatch-followup-exists, dispatch-qa-needs-main-followup, and
      dispatch-fleet-alarm — and the RETIRED /file-issue is still cited as a
      caller. The three rules recorded earlier today are unchanged in substance;
      what changes is where they live: in the surface, not in six restatements
      of it. The surface takes an OPTIONAL deterministic key where a caller has
      a stable one (an invalid-state cause slug, a CI failure signature, a
      CodeQL rule id, an npm advisory id), runs the whole-graph similarity
      search in every case regardless, and records a key/search disagreement as
      a finding rather than resolving it silently — so neither the determinism
      the invalid-state lane deliberately built nor the whole-graph search set
      this ruling requires is dropped. CARRIER:
      tactic-finding-search-all-producers is REWRITTEN IN PLACE rather than
      superseded (it is phase null, a draft), which is this ruling's own merge
      discipline practised on itself, exactly as tactic-eval-finding-ledger was
      rewritten earlier today. Zero new nodes for this half. The contract that
      binds every producer lives on this strategy; the evaluator-side reasoning
      and the observable that reads it live on
      strategy-recursive-self-improvement, per the same-day split-by-owner
      ruling."
  - question: The four invalid-state intervention lanes become special cases of the
      evaluation core. What does that change on this strategy's surface?
    answer: "(Recorded 2026-08-14 /align round, second round of this date, on author
      ruling; the doctrine is recorded on strategy-recursive-self-improvement
      and this records only what this strategy owns.) The intervention SKILLS
      are dispatch-surface artifacts owned here —
      .claude/skills/dispatch-invalid-state, dispatch-conflict, fix-checks and
      dispatch-diagnose-main — and each becomes a thin selector over the shared
      evaluation core plus a closed remediation list declared in its own
      frontmatter. Three properties this strategy already fixes are UNCHANGED by
      the merge and must survive it: a lane session spawned with --name
      <node-id> is a graph-node worker in the Stop hook's eyes and owes exactly
      one mark-node-terminal disposition on every terminal path or it freezes
      the node it was sent to unfreeze; dispatch-invalid-state-route's exit-code
      contract (0 handled, 4 keep, 10 escalate, 1 router failure treated as
      escalate, 2 usage) and its per-node attempt cap stay the ROUTER's and are
      neither read nor written by the lane; and the kind table fixing
      terminal-session and frozen-session to the human class stays
      authoritative. So the merge changes what a lane's BODY is made of, never
      its session contract with the router.
      tactic-invalid-state-skill-per-kind's ruling — each invalid-state kind
      carries its own skill body while the shared three-tier ladder stays
      written down exactly once — is the same shape as this one and is subsumed
      by it rather than contradicted: the shared ladder and the shared core are
      the same 'written once' discipline applied at two layers. Carrier:
      tactic-rsi-intervention-special-cases."
  - question: A modified flake.lock — or unrelated dirt in any checkout — must not
      be able to cause graph integrity errors. What is the standing invariant,
      and does tactic-graph-ref-split discharge it?
    answer: >-
      (Recorded 2026-08-14 /align interview.) Two properties, stated

      mechanism-neutrally so any writer/reader design can be tested against them

      rather than one mechanism being mandated:


      (1) WRITE INDEPENDENCE — no working tree a human may have touched may
      affect

      whether a graph write succeeds, or what content lands in it.


      (2) READ COHERENCE — no reader may observe graph state older than a write
      it

      has already been told succeeded.


      Both were violated live on 2026-08-13/14, in opposite directions, by one

      partial migration. (1): graph-commit's assert_clean_outside_ids refused
      every

      write while the author's own modified flake.lock sat in the main checkout,
      so

      dispatch-eval-finding — the per-phase evaluator's ENTIRE write surface —
      lost

      every finding of every phase silently, the evaluator being fire-and-forget
      with

      a discarded transcript
      (tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt,

      since phase done). It was self-sustaining: graph-select-target --clear-fix
      leaked

      another dirty node file per tick on top, one leak per ~70s until a human
      cleared

      it (fixed at e6421e6c by lib-graph-rollback.sh). (2): PR #3090 gave

      dispatch-eval-finding a working-tree-free write via
      GRAPH_COMMIT_WRITER=plumbing

      but left its --list read on the checkout working tree, which the plumbing
      writer

      never moves — 7 stale rows, 28 lands without a HEAD move, duplicate slugs
      minted

      (tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land,
      open).


      Does tactic-graph-ref-split discharge the invariant? For (1) YES, and it
      remains

      the ratified greenfield (clarification 80's limb (a)): Unit 2's landing
      loop is

      pure plumbing — scratch GIT_INDEX_FILE against the worktree's own .git,
      read-tree

      from origin/graph-main, write-tree, commit-tree, plain fast-forward push
      as CAS —

      and it deletes ensure_intentions_only_base explicitly because the
      far-ahead-worktree

      rebuild hazard it exists for is structurally impossible once landing never
      touches a

      worktree's checkout; Unit 8 removes intentions/ from main altogether. For
      (2) NO —

      verified this round by reading all 1040 lines of that plan: its read side
      is a symlink

      to one shared long-lived GRAPH_WT refreshed by fetch + reset --hard at

      worktree-provisioning time and in the hooks (Unit 3, four call sites), and
      NO unit

      refreshes GRAPH_WT after a land. A session that lands and then reads
      through the

      symlink sees its own write missing — the 2026-08-14 regression surviving
      the cutover

      intact. That is a gap to fill in a sound plan, not grounds to reject the
      symlink: a

      materialized tree is a cache, and the defect is cache coherence, not the
      existence of

      a cache. Carried as tactic-graph-refsplit-read-coherence.


      Sequencing consequence, and the reason this is recorded now rather than
      deferred to

      ref-split: ref-split does not gate the fix. assert_clean_outside_ids sits
      in land(),

      not try_land(), and is already conditional on GRAPH_COMMIT_WRITER ==
      worktree

      (graph-commit:3502), so flipping that default makes it inert across every
      writer —

      one flag, no cutover, none of ref-split's 37 blockers (23 still open this
      round).

      ref-split stays the greenfield; it is not the critical path for this
      invariant.

      Carried as tactic-graph-commit-plumbing-default.


      Boldness recorded: the two violations, the guard call site and its gating,
      the absence

      of any post-land refresh in ref-split, and the blocker phase counts are
      all verified

      in-session against origin/main. The reading that ref-split's 37 blockers
      encode a

      quiescence wish rather than real dependencies is INFERENCE from the
      breadth of the

      list — the blockers were not read individually — and is carried as the
      open question

      tactic-graph-refsplit-blocker-audit, not as a settled finding.
  - question: What are the sanctioned ways a node enters the graph, and does the
      answer depend on the node's kind?
    answer: "(Recorded 2026-08-14 /align round, third round of this date, on author
      ruling; generalizing the same-day 'How is a finding recorded on the graph'
      and 'one shared write surface' rulings from findings to ALL node
      creation.) EXACTLY TWO WRITE SURFACES, AND THE SEAM IS BY KIND. Surface
      one is the /align interview record, and it is the only way a
      PERSISTENT-LAYER node — virtue, strategy, delegation, tradition — enters
      the graph; this generalizes strategy-discovered-requirements' existing
      claim that the /align interview is the only place an author's requirement
      enters. Surface two is the find-or-recur write surface
      (tactic-finding-search-all-producers), and it is the only way a TACTIC
      enters, whoever the caller is: /align Step 4 interview byproducts,
      /align-tactics decomposition, /review-fix, /qa-main, /rsi, /rsi-audit, the
      four invalid-state lanes and fleet sweeps all mint through it. The caller
      list needs no enumeration and is closed by nothing, because the rule binds
      the WRITE and not the caller — which is the whole point of the same-day
      one-shared-write-surface ruling. THE AUTHOR'S RULING NAMED /align-tactics
      EXPLICITLY: a decomposition that creates nodes does so USING the follow-up
      surface, so it is a CALLER and not a third surface. That is what makes
      'two' a fact about the design rather than a definitional collapse — the
      alternative framing put to the author, which counted /align-tactics as a
      third creation surface, was declined on exactly this ground. TWO CLAIMS
      THAT ARE OFTEN CONFLATED AND BOTH HOLD: graph-commit remains the only
      sanctioned write PATH — the mechanism that lands a commit, recorded across
      many nodes — while these two surfaces are the only sanctioned
      node-CREATION processes, which is a claim about what may author a node in
      the first place. Neither implies the other. BOLDNESS DISCLOSED BEFORE THE
      RULING: the by-kind seam follows directly from the author's own
      /align-tactics ruling and is lint-testable, which is what makes it worth
      recording; what was NOT verified at record time is whether any of the five
      extant private writers legitimately mints a non-tactic. None was found,
      but no exhaustive audit of their code paths was run. The carrier is told
      to establish that before designing around the seam. BOTH SURFACES RUN THE
      SAME COMMON ANALYSIS — see the shared-analysis clarification recorded this
      same round, which is the reason the seam is worth recording at all."
  - question: What common analysis do both node-creation surfaces run, and what does
      its supersession half do?
    answer: "(Recorded 2026-08-14 /align round, third round of this date, on author
      ruling.) TWO CHECKS, ONE SEARCH PASS, IN THE SHARED SURFACE — never
      restated as prose in each caller, per this strategy's same-day
      one-shared-write-surface ruling. CHECK ONE, DUPLICATE AND MERGE, is
      unchanged in substance from the find-before-minting rules recorded earlier
      today: an optional deterministic key where the caller has a stable one, a
      whole-graph similarity search in every case regardless, a match recording
      the recurrence on the existing node and minting nothing, and a key/search
      disagreement recorded as a finding rather than resolved silently. CHECK
      TWO, SUPERSESSION, IS NEW. The node being created is tested as a potential
      SUPERSEDER of existing nodes, so the graph does not implement one strategy
      or tactic and later attempt the one it supersedes. It is a CREATION-TIME
      check keyed on the NEW node, not a corpus sweep, which bounds its blast
      radius to one search per creation and is what makes it affordable in the
      shared surface. It absorbs the greenfield-relevance gate (clarification
      26), which until now ran only at /align-tactics finalization; see the
      stale-surface correction recorded this same round for why that was its
      only remaining carrier. DISPOSITION ORDER — REWRITE FIRST, CLOSE AS
      BACKSTOP. When the analysis finds an existing node the new one supersedes,
      the FIRST disposition offered is REWRITE-IN-PLACE: merge the new intent
      into the existing node and mint nothing. This is not a new discipline; it
      is the one this record practised on itself twice on 2026-08-14, when
      tactic-eval-finding-ledger and tactic-finding-search-all-producers were
      each rewritten rather than superseded. CLOSE-AS-SUPERSEDED is the backstop
      for what rewrite cannot reach: the existing node is non-draft
      (clarification 26's 'a raw draft never obsoletes live work' read in the
      other direction — a non-draft node carries live commitments a rewrite
      would silently discard), it is in flight, or its intent genuinely DIES
      rather than evolves. The rival framing — that a superseded node existing
      at all IS the defect, so a close disposition is cleanup for a discipline
      failure rather than a design — was put to the author and PARTLY ADOPTED:
      it wins on PRIORITY (rewrite is tried first), and is DIVERGED FROM on
      completeness, because a strategy superseded by a better strategy is not a
      duplicate and merging the two would produce an incoherent node. CLOSE
      AUTHORITY IS NOT THE PRODUCER'S. Closing a node terminates recorded work,
      so under strategy-recursive-self-improvement's declared-remediation-list
      condition a record-only producer may not do it, and a model similarity
      judgment must not sit on the destructive side — the record already
      documents that judgment being wrong, on
      tactic-eval-finding-eval-finding-list-misses-nonledger. So the unattended
      surface RECORDS: an edge naming the superseding node, on both nodes, plus
      an office_hours PARK on the superseded node whose recommendation is to
      close. The close itself is a DECLARED REMEDIATION, executed at an
      office-hours sitting or by a lane that declares it. PARK COLLISION, RULED
      BY THE AUTHOR: office_hours is single-valued, so an already-parked node is
      NEVER CLOBBERED — the park reason is UPDATED to carry BOTH the
      supersession AND the original reason, so the sitting reads why the node
      was parked twice rather than losing the first reason to an overwrite. TWO
      SUB-POINTS THE AUTHOR DID NOT RULE ON, derived here from rules already
      recorded and flagged plainly as Claude-derived rather than author-ruled.
      ONE: a node whose execution is non-null gets the edge but NO park —
      extending the skipped-in-flight refusal
      tactic-finding-search-all-producers already records for the dedup half,
      rather than inventing a second in-flight rule; the live-PR exposure this
      leaves open is the interim-live-risk exception clarification 26 already
      permits. TWO: only a FULLY superseded node is parked, with partial
      supersession keeping clarification 26's existing per-unit doomed-drop
      unchanged. A born-parked review item,
      tactic-review-supersession-derived-subpoints, enrolls both for
      ratification. OWNERSHIP SPLIT, per the same-day split-by-owner ruling: the
      binding contract is this strategy's; the observable that reads whether it
      holds lives on strategy-recursive-self-improvement, where the instrument
      lives. CARRIER: tactic-finding-search-all-producers is REWRITTEN IN PLACE
      again — it is phase null, a draft — which is this ruling's own merge
      discipline practised on itself for the third time on this date. Zero new
      nodes for the carrier half."
  - question: Clarification 26 binds the greenfield-relevance gate to
      '/align-tactics finalization and every /align-strategy improvement pass'.
      Does that second surface still exist?
    answer: "(Recorded 2026-08-14 /align round, third round of this date, correcting
      a stale cross-reference this round's evidence sweep found in this node's
      own body.) NO — it has not existed since 2026-08-04, and the loss was
      DELIBERATE rather than accidental, which is worth recording because the
      surviving prose reads as though the surface were live.
      tactic-align-entrypoint-consolidation Unit 2 deleted the whole no-prompt
      improvement pass — naming 'the greenfield-relevance-gate corpus sweep
      (strategy clarification 26)' in its own scope — and replaced it with the
      onboarding funnel; the 2026-07-23 office-hours sitting with the author
      present had already ruled both retained engines retire wholesale
      (tactic-align-audit-legacy-review). /align's own coverage matrix records
      the consequence plainly: 'Relevance — Retired with the improvement pass —
      no longer covered by this skill'. The doctrine-encoding carrier
      tactic-align-skills-greenfield-gate shipped as #2789 and was pruned as
      done on 2026-07-07. SO SINCE 2026-08-04 THE GATE HAS HAD EXACTLY ONE
      CARRIER: prose at .claude/skills/align-tactics/SKILL.md:322. That is
      precisely the instruction-copied-into-skill-bodies shape this strategy's
      same-day one-shared-write-surface ruling condemns, arrived at from the
      other direction — by attrition down to one copy rather than by copying up
      to six — and it is why the gate ran at decomposition time only and never
      at node creation. This node's body is corrected to name /align-tactics
      finalization alone, and the gate's substance moves into the shared surface
      per the shared-analysis clarification recorded this round, after which the
      surviving align-tactics prose reduces to naming the call. Worth naming for
      the next reader: tactic-align-audit-legacy-review's own clarification (b)
      already records the gate being SKIPPED in a round that was supposed to run
      it. A gate whose only carrier is prose in one skill is a gate that gets
      skipped; that is the argument for moving it into the shared surface,
      independent of the creation-time requirement."
  - question: On graph-commit’s fail-closed park path, what must SNAP_DIR/<id>.md
      hold for an id whose layer-3 merge RESOLVED earlier in the same multi-id
      invocation?
    answer: >-
      (Ruled 2026-08-15 author sitting, resolving the park on
      tactic-graph-commit-snap-dir-merge-clobbers-original.) Ruling (b): the
      writer's FROZEN pre-merge original, with the merged content beside it
      rather than over it. snapshot() writes $SNAP_DIR/<id>.md and never
      rewrites it; the merge paths write $SNAP_DIR/<id>.merged.md; every
      SNAP_DIR reader that wants "what this run intended to land" —
      ensure_intentions_only_base()'s replay and print_verdict — prefers
      .merged.md when it exists; park_write() names BOTH paths and labels which
      is the session's own original content and which is graph-commit's partial
      merge.


      This reverses the narrower contract PR #2989 landed, under which SNAP_DIR
      is authoritative for the reconciled intended-to-land content (defended in
      code at graph-commit:794-808, 919-935 and 2091-2098). The defect that
      forces the reversal: a multi-id batch fails closed as a unit, so when id
      A's layer-3 merge RESOLVED and id B's did not, park_write's recovery text
      points the human at SNAP_DIR/A.md claiming it holds their unlanded content
      when it actually holds graph-commit's blend of their edit with a
      concurrent writer's landed one. Because the concurrent writer chooses
      which field to touch, they choose which of the losing writer's ids lose
      their evidence — an accidental loss in the normal case, a targeted one if
      that writer is adversarial.


      BUILDABILITY WAS VERIFIED BEFORE RULING, correcting a contrary claim made
      in the park record itself. The fix does NOT require weakening any
      preserved regression guard, and .claude/rules/test-integrity.md is not
      engaged. test-graph-commit.sh case 48 — the self-described Unit 1
      regression guard, "far-ahead + stale --base: layer-3 merge survives the
      far-ahead rebuild, both fields land" — passes unchanged, because the
      far-ahead rebuild replays .merged.md, which carries exactly the merged
      content SNAP_DIR carries today. Case 22 (:1551-1581), which asserts
      SNAP_DIR retains the writer's original for an UNRESOLVED merge, is
      preserved by construction. Only a naive freeze WITHOUT the
      replay-preference half breaks them — the failure mode
      plans/dispatch-rsi-serialized-pr-plan.md already warns against in its
      work-to-skip list.


      ALL THREE clobber sites are in scope, including the third in
      build_commit_plumbing() (graph-commit:1650-1652), which is structurally
      identical, feeds the same park_write text, and is named by neither the
      node nor the serialized PR plan.


      REJECTED ALTERNATIVES. (a) Keep #2989's contract and dismiss the node —
      rejected: it accepts a park record that misattributes a concurrent
      writer's content to the losing writer, which is a correctness defect in
      the record, not merely a usability one. (c) Carry the losing writer's
      content into the node's own office_hours record instead of any
      machine-local pointer — NOT adopted here, but the concern behind it is
      real and stays open as a separate question: park_write's own text concedes
      the tmpdir is "this machine only — may not survive past this session"
      (graph-commit:2944-2952), which fails this strategy's recorded condition
      that a park whose context lives only in the parking session is a defect.
      (b) and (c) are complements, not substitutes; (c) should be filed as its
      own tactic rather than folded in.
  - question: How is the explicit-ref read-path scope partitioned across
      tactic-explicit-ref-graph-reads, tactic-demote-node-stale-local-read and
      tactic-graph-read-at-ref-cli, none of which clarification 194 enumerated?
    answer: >-
      (Ruled 2026-08-15 author sitting, resolving the park on
      tactic-explicit-ref-graph-reads.) Shape (a). Clarification 194 (R3,
      2026-08-05) adopted the general contract but recorded that its scope "was
      NOT enumerated in this sitting"; three co-extensive raw nodes then claimed
      overlapping files with no partition between them. The partition:


      - tactic-explicit-ref-graph-reads owns the required-explicit-argument
      CONTRACT plus exactly four files: validate-graph.ts, write-node.ts,
      dump-node.ts, clear-park. Its one bare executable caller,
      .claude/skills/align/scripts/validate-deployment.sh:53, invokes
      validate-graph.ts with no directory and MUST be updated in the same
      change; .github/workflows/graph-fast-path.yml:32 already passes intentions
      explicitly and needs no change.

      - tactic-demote-node-stale-local-read narrows to demote-node-to-implement
      alone. That script is therefore NOT in tactic-explicit-ref-graph-reads'
      scope and does NOT close with it.

      - tactic-graph-read-at-ref-cli adds a NEW CLI (storeAtRef) rather than
      editing these readers, so it is separable under any shape — recorded
      explicitly here rather than left implicit.

      - Out of scope under any shape: transition-node (claimed by
      tactic-graph-ref-split, phase implement) and graph-commit (a writer; its
      -C/cwd resolution is already the ratified correct shape, clarification
      86).


      Already converted, and not to be re-done: check-node-selection.ts:14-15
      (required --dir) and compute-freshness.ts (explicit --snapshot/--stamp,
      with transition-node as the acquiring wrapper). Still unconverted as of
      this sitting: validate-graph.ts:73, write-node.ts:18-22,
      dump-node.ts:35-40, clear-park:99-100.


      REJECTED. (b) tactic-demote-node-stale-local-read absorbing the whole
      root-resolution class under its own Ruling 27, with this node pruned as a
      duplicate — rejected because that node is blocked_by
      tactic-phase-evidence-fingerprint-bound, so absorbing the class would
      stall every reader in it behind an unrelated blocker. (c) the reverse
      split — no evidence favoured it.


      TWO CORRECTIONS TO THE RECORD, both verified against origin/main this
      sitting, neither previously noted:


      (1) tactic-demote-node-stale-local-read's defect 3 ("stale read,
      un-guarded write") is ALREADY FIXED. Commit 156ce3a1 gave
      demote-node-to-implement both the fresh origin/main read (it refreshes the
      node file from origin/main before computing the new one) and the --base
      compare-and-swap (graph-commit -C "$REPO_ROOT" --base
      "$NODE_ID=$FRESH_BLOB" --expect "$NODE_ID=$EXPECT_BLOB"). That node's body
      still describes both as missing, and its line citations (:36, :46, :115,
      :126-127) have all moved. Only defect 1 (script-location REPO_ROOT) and
      its consequence defect 2 (the scope-fingerprint stamp path inheriting that
      root) remain live. Any plan for that node must be re-derived from the
      current file, not from its body as written.


      (2) Consequently the serialized PR plan's instruction that PR1's Unit 8
      lift "exactly one bullet" from that node — its Greenfield item 3, the
      --base CAS — is void: that bullet is already implemented. Unit 8 must not
      re-implement it, and under this ruling Unit 8 does not touch
      demote-node-to-implement at all.
  - question: demote-node-to-implement both reads a node and writes one, so
      clarification 86’s writer shape and clarification 194’s reader shape both
      claim it. Which binds?
    answer: >-
      (Ruled 2026-08-15 author sitting, alongside clarification 242.)
      Clarification 194's READER shape binds: demote-node-to-implement takes the
      tree as a REQUIRED explicit argument, with no cwd default and no
      script-location default. Its caller transition-node — which today invokes
      it positionally and reads only its exit code — is updated in the same
      change to pass the tree.


      The collision is real because demote-node-to-implement is both: it reads
      the node it demotes and writes the demotion. Clarification 86 ratifies
      -C-or-cwd, never-script-location, for graph-commit; clarification 194
      requires an explicit argument on every graph read.


      Rationale for preferring the reader shape here: the cwd fallback is not
      merely weaker in this case, it is WRONG. transition-node runs inside the
      worker's worktree and invokes demote-node-to-implement from there, so the
      caller's cwd resolves to the worktree — the same wrong answer the script's
      own location gives today — while the demotion must act on the main
      checkout. This also means the remedy tactic-demote-node-stale-local-read
      prescribes for its defect 1, "resolve the repo root from the caller's
      cwd", does not fix its own defect; that node's Greenfield item 1 must be
      rewritten. resolve_project_root (parent of the git common dir, lib.sh)
      WOULD resolve correctly and is the shape transition-node itself uses, but
      it leaves the tree implicit, which is the property R3 was adopted to end —
      so it is rejected as the standing answer even though it would work.


      Clarification 86 is NOT narrowed by this: it continues to bind
      graph-commit, a pure writer for which -C-or-cwd is correct, and the
      general rule stands that a script's own on-disk location never determines
      the tree it acts on.


      Ownership: this work belongs to tactic-demote-node-stale-local-read per
      clarification 242, not to tactic-explicit-ref-graph-reads. It is blocked
      until tactic-phase-evidence-fingerprint-bound clears, and it is not part
      of PR1.
  - question: The 2026-08-14 clarification recording 'exactly two node-creation
      surfaces' asserted a by-kind seam and cited a five-writer census. An
      adversarial draft review and a measured census both refuted it. What is
      the corrected doctrine?
    answer: "(Corrected 2026-08-14, third round of this date, after the adversarial
      draft review that round skipped.) TWO THINGS WERE WRONG. (i) The by-kind
      seam claimed the /align interview is the only way a persistent-layer node
      enters the graph. kind-tradition.md's own creation rule refutes it — a
      tradition record is created only at the office-hours sitting that examines
      the candidate, i.e. /reading-review — and in the other direction /align
      cannot mint a virtue, a delegation or a kind-* node at all, so the claim
      asserted a creation path where there is a hole. (ii) The five-writer
      census was stale: a measured sweep found roughly twenty write sites across
      sixteen skill files and four scripts, including hold-node, resolve-hold,
      dispatch-diagnose-main, reading-review, context-chunks, qa-main,
      review-fix, fix-checks, dispatch-conflict and budget. THE CORRECTED FRAME:
      the DRY seam is not WHO writes but WHAT KIND OF WRITE it is. Three
      operations. CREATE mints a new node file — the duplicate and supersession
      checks bind to this operation and to no other. EDIT-SUBSTANCE changes what
      a node says. IT IS DEFINED NEGATIVELY, IN CODE, NOT BY ENUMERATION IN
      PROSE: schema.ts exports STATE_FIELDS — the router- and sensor-owned set
      (phase, execution, office_hours, reading, attention, rounds, status,
      blocked_by) — and EDIT-SUBSTANCE is EVERY field not in it. The enumerated
      form was drafted first and REPLACED on the author's ruling of 2026-08-15,
      after the adversarial draft review showed it fails OPEN: a positive list
      of substance fields silently exempts every field nobody thought to list,
      and the measured fallthrough was large — rationale, parent, recovers,
      validates, owner, pace_exempt, kind, and all of attributes except
      conditions. Three of those are load-bearing. rationale is named FIRST in
      the ratified doctrine that /dispatch-conflict reconciles against
      (virtue/strategy/tradition/delegation statement, rationale, clarification
      text), so a positive allowlist built from strategyFingerprint's six fields
      leaves unprotected the very field the guard exists for. attributes is
      graph-semantics-bearing — validateGraph rules key on
      attributes.goal_layer, attributes.status_vocabulary and attributes.tier —
      and is written onto durable nodes today by /grounding-research. owner and
      pace_exempt are authority fields, so an unrestricted EDIT-STATE reading
      would let an autonomous lane flip owner from human to ai unopposed. Under
      the negative definition a field added to the schema tomorrow defaults to
      SUBSTANCE, which is the fail-safe direction. The two fingerprints remain
      NARROWER readings layered on top: strategyFingerprint's six-field
      allowlist (packages/intentionsutil/src/router.ts:102-112) is what freezes
      CHILDREN, and tacticScopeFingerprint's pair, statement plus markdown body
      (router.ts:131-133), is what the chain-of-custody gate reads, because the
      body is the plan a worker executes. FREEZE COVERAGE IS THEREFORE NARROWER
      THAN SUBSTANCE, deliberately: a rationale edit is a substance write that
      no child freeze detects. The earlier draft claimed the freeze and re-stamp
      machinery exists for this operation and no other; that is FALSE and is
      corrected here — dispatch-graph-census overwrites a census tactic's
      markdown body wholesale on every autonomous run and contains no
      scope_fingerprint restamp at all, which is a recurring autonomous
      EDIT-SUBSTANCE with no freeze machinery attached. EDIT-STATE is a write
      confined to STATE_FIELDS: mechanical, freeze-inert, unrestricted on
      tactics. THE TAXONOMY IS DESCRIPTIVE, NOT INVENTED — the substance/state
      line is already drawn independently three times in existing code:
      strategyFingerprint's allowlist, tacticScopeFingerprint's pair, and
      node-merge.ts's LIST_FIELDS/SCALAR_FIELDS split. It names a boundary the
      code had but had not named. TWO ATTENDANCE CLASSES carry mint authority,
      and this is where the author's 'exactly two' becomes true of a real axis
      rather than by definitional fiat. ATTENDED means a human rules on the
      write at the moment it happens: /align, /reading-review, /budget, and the
      human's own write-node plus graph-commit following an office-hours
      disposition. An attended entry point may CREATE any kind and may
      EDIT-SUBSTANCE. NOTE, corrected 2026-08-15 by the adversarial review: the
      office-hours SKILL is read-only by its own contract — it produces words
      for a human and changes no state, it takes no chain or label action of its
      own, and it never un-parks. The earlier draft listed the skill itself as
      an attended CREATE surface, which named a non-writer as a write surface;
      the attended surface in that lane is the human's subsequent write.
      AUTONOMOUS means no human rules on it: /align-tactics, qa-fix, review-fix,
      fix-checks, dispatch-diagnose-main, dispatch-conflict,
      dispatch-eval-finding, dispatch-graph-census, hold-node, resolve-hold,
      resolve-park, hold-node-decide, qa-main, context-chunks,
      /grounding-research, transition-node, reconcile-graph and the tick sweeps.
      An autonomous entry point may CREATE tactics only, may EDIT-STATE freely,
      and may NOT EDIT-SUBSTANCE a durable-layer node (virtue, strategy,
      delegation, kind, tradition). The weaker reading of 'attended' — that a
      human merely typed the command — was considered and REJECTED by the
      author: under it nearly every lane counts as attended, including lanes
      where no human ever reads the resulting text, which is the opposite of
      what the rule is for. THE INVARIANT WAS AUDITED BEFORE BEING RECORDED, on
      the author's explicit ruling, precisely so this round would not repeat the
      previous round's defect of recording an unmeasured control. IT DOES NOT
      HOLD TODAY. Four violations, recorded here rather than papered over, each
      with its ruled disposition — see the sibling clarification 'Which lanes
      violate the autonomous-substance invariant today'. TWO HONEST LIMITS ON
      THIS CENSUS, both from the 2026-08-15 review. First, the author's ruling
      was to classify EVERY write-node call site as CREATE / EDIT-SUBSTANCE /
      EDIT-STATE; the sites are named above and the four violators are
      classified, but a per-site classification of all of them is NOT recorded
      here and is owed. Second, a prose census decays the day it lands — that is
      precisely the weakness that made the previous round's five-writer count
      wrong, and re-recording it as a longer prose list does not fix it. The
      durable form is a machine-readable roster mapping each write site to its
      operations and attendance class, linted against the actual write-node
      caller set so a new caller cannot be added silently. Both are carried as
      owed work on tactic-finding-search-all-producers rather than claimed as
      done."
  - question: Which lanes violate the autonomous-substance invariant today, and what
      is the disposition of each?
    answer: "(Measured and ruled 2026-08-14; extended to four 2026-08-15 after the
      pre-commit adversarial review.) FOUR. V1 — /align-tactics lands dated
      clarifications on strategy nodes autonomously, by design. Its two-sided
      drift review routes MATERIAL drift to a park for author ratification
      (correct, unchanged), but routes IMMATERIAL drift — an observation the
      plans do not depend on — to a direct clarifications write, instructed
      verbatim as 'land it as a dated clarification WITHOUT interrupting; do not
      park for it' (.claude/workflows/align-tactics.js Side-B block;
      .claude/skills/align-tactics/references/write-path.md, the
      immaterial-observation path). clarifications is allowlist member two, so
      this mutates strategyFingerprint and soft-freezes every open child of that
      strategy for an observation defined as gating nothing. Two further harms:
      it is a second requirement-entry surface, which
      strategy-discovered-requirements reserves to the /align interview; and a
      model-authored dated clarification is byte-indistinguishable from an
      author-ruled one, so provenance collapses irreversibly in the field that
      carries doctrine. AUTHOR RULING: redirect, do not carve out. The
      immaterial path mints ONE born-parked observation node serving the
      strategy — the same shape /align already mints for a deferral — instead of
      writing clarifications_to_add. proceed stays true and the round runs on
      uninterrupted, because non-interruption was only ever achieved by not
      parking the STRATEGY and never required writing TO it. A human promotes
      the worthwhile ones into clarifications at office hours through the
      attended surface. THIS RULING OVERTURNS A STANDING AUTHOR RULING ON THIS
      SAME NODE, and says so rather than leaving two live contradictory
      clarifications — see the 2026-07-28 /align-strategy clarification
      'Standing requirement: a per-node tactic-target session MAY append
      clarifications entries to the serving strategy', now amended in place with
      an OVERTURNED prefix pointing here. That earlier ruling was correct on its
      own premises. Its DECISIVE ARGUMENT was that the current doctrine leaves
      immaterial observations with NO LEGAL DESTINATION AT ALL — write-path.md
      says write them to the strategy, tactic-target.md forbids any strategy
      write, and the autonomy contract closes the park escape because an
      immaterial observation is none of its three park conditions. Faced with a
      forced choice between dropping the observation and writing the strategy,
      it chose writing. WHAT CHANGED IS THE PREMISE, NOT THE REASONING: the
      born-parked observation node IS a legal destination, so the forced choice
      dissolves. The redirect therefore SATISFIES the 2026-07-28 concern —
      nothing is dropped, the sole-carrier condition still holds — while
      removing the strategy write it had to concede. The earlier ruling's
      second, independent finding stands unaffected and is still owed:
      DRIFT_SCHEMA.clarifications_to_add declares items as {answer} only with
      additionalProperties:false, while the Clarification interface requires
      {question, answer}, so the instruction was never mechanically executable.
      The implementing node tactic-align-tactics-per-node-clarifications is
      PARKED by this round: its unit A widens the write authority this ruling
      removes and its unit B hardens a field this ruling deletes, so it is
      doomed work as written — the exact failure class this round exists to
      close, found on this round's own output. Carried by
      tactic-align-tactics-immaterial-drift-redirect. V2 — /dispatch-conflict's
      reconciliation lane builds an unconstrained jq filter from an opus
      subagent's output and sets whatever fields diverged, on any node kind; the
      skill explicitly names virtue/strategy/tradition/delegation doctrine
      fields as in scope. The only thing preventing a rewrite of a virtue's
      statement is a sentence in a prompt telling the subagent not to synthesize
      substance — no code refuses an allowlist field on a durable-layer id.
      AUTHOR RULING: replace the prompt-level guard with a MECHANICAL field
      check — refuse any write to a NON-STATE field when the target id is
      durable-layer, and park for a human instead. Ruled 2026-08-14 as a
      six-field allowlist and CORRECTED 2026-08-15 to the negative form after
      the adversarial review showed the six-field version misses rationale,
      which is the field the ratified reconciliation doctrine names FIRST, and
      also misses attributes, owner and parent. The check is not
      STATE_FIELDS.has(field), which is total by construction and needs no
      second list kept in sync. Carried by
      tactic-dispatch-conflict-substance-allowlist. Not measured: whether this
      has ever actually fired on a durable node; git history was not searched,
      so it is not known whether any landed doctrine text was model-reconciled
      without review. V3 — graph-commit's own layer-2 auto-merge unions
      clarifications and three-way merges statement on whatever ids are in the
      commit, inheriting the caller's lane, and on scalar divergence silently
      prefers theirs (packages/intentionsutil/src/node-merge.ts). It does not
      AUTHOR substance — it reconciles two already-authored values — so it is
      recorded as a known structural exception rather than assigned a fix. ALSO
      MEASURED, and not a violation: /budget writes only reading on its
      strategy, a STATE_FIELDS member and therefore EDIT-STATE. That case is
      what reframed the whole taxonomy from who-writes to what-kind-of-write:
      /budget EDITS a durable node without minting anything, so a surfaces-based
      seam could not classify it. V4 — /review-fix, ADDED 2026-08-15 by the
      adversarial review, correcting this round's own draft. The 2026-08-14
      draft excused it on the ground that it is mechanically fenced by a
      post-hoc porcelain guard reverting any modification to a pre-existing
      node. IT IS NOT: that guard exists only as prose in
      .claude/skills/review-fix/SKILL.md — a repository-wide search for its
      step5-baseline and step5-new markers finds that one file and no script, no
      hook, no workflow. This round condemned V2 forty lines earlier with the
      words a prompt is not a gate, then suspended that same standard for
      review-fix, and the suspension was the only thing keeping it off this
      list. Nothing mechanically confines review-fix to newly created nodes or
      to tactics; that confinement is an unverified property of a prompt. AUTHOR
      RULING: classify it as a violator pending a real guard, and promote the
      Step-5 porcelain checklist into a script — it is trivially scriptable, the
      SKILL.md already writes it as shell. Carried by
      tactic-review-fix-porcelain-guard-script. ONE FURTHER MEASURED FINDING,
      legal under the invariant but unmonitored: dispatch-graph-census
      overwrites a census tactic's markdown body wholesale on every autonomous
      run and carries no scope_fingerprint restamp. It is legal only because
      census nodes are tactics, which is luck rather than design, and it
      falsifies the draft claim that freeze machinery attaches to every
      EDIT-SUBSTANCE."
  - question: The same 2026-08-14 round argued the greenfield-relevance gate's only
      carrier is prose in one skill, and moved it into the shared creation
      surface. Is that argument sound?
    answer: "(Refuted and corrected 2026-08-14 by the adversarial draft review.) NO
      — the premise is false and the migration it justified was backwards. The
      gate's real carrier is code: .claude/workflows/align-tactics.js makes
      greenfield_drops a schema-REQUIRED member of the decomposer's output,
      typed additionalProperties:false with required target, superseded_by and
      reason. BE PRECISE ABOUT WHAT THAT ENFORCES — corrected 2026-08-15,
      because the 2026-08-14 draft answered an overstatement with an
      overstatement of its own. What is machine-enforced is the output SHAPE:
      the key is in DECOMPOSE_SCHEMA's required list, and each entry that
      appears must carry all three sub-fields. The JUDGMENT — check each unit's
      subject against non-draft nodes elsewhere that delete or supersede it — is
      prose in the prompt string, structurally the same kind of carrier the
      previous round was condemned for citing. greenfield_drops [] satisfies the
      schema on every run, so an empty result is INDISTINGUISHABLE from a search
      that never ran. The honest comparison is therefore that the gate has a
      typed output where the proposed replacement had none, not that it is
      enforced where the other is prose. The prose at align-tactics/SKILL.md is
      not a copy of the gate but a POINTER to clarification 26 — the shape the
      one-shared-write-surface ruling wants, not the shape it condemns. So the
      previous round moved a machine-enforced check into a prose-specified,
      unbuilt surface and justified it by calling the enforced carrier prose.
      THE REAL DEFECT IS DIFFERENT AND SMALLER: the validated supersession
      judgment is DISCARDED. align-tactics/references/write-path.md directs that
      greenfield_drops be recorded in the round's report; nothing lands on the
      graph. A model makes the judgment, a JSON schema validates it, and it dies
      with the session. AUTHOR RULING: PERSIST, do not relocate. On each drop,
      write superseded_by onto the named node in the round's existing
      graph-commit — greenfield_drops.superseded_by is already a validated
      supersession edge in flight. Keep the creation-time check as a SUPPLEMENT
      for the callers the workflow never sees: strategies, and every create site
      that is not an /align-tactics decomposition. This is a strict superset of
      the previous round's design and enforcement never drops. TWO ADDITIONS
      RULED 2026-08-15 after the adversarial review. (a) ONE EVALUATOR, TWO
      TRIGGERS. Persisting the gate where it is and adding a creation-time
      supplement leaves the same judgment — is X superseded by Y — implemented
      twice, once as workflow prompt prose and once in the create surface, with
      nothing keeping them agreeing. The author asked in terms for a
      parsimonious list of surfaces that is DRY, so the judgment is extracted
      ONCE as a pure function in packages/intentionsutil/src —
      supersedes(candidate, corpus) returning target, superseded_by and reason —
      and the two triggers CALL it: the decomposer per unit, the create surface
      per mint. The gate stays exactly where this ruling put it; it stops being
      a second specification asserted to agree with the first. (b) MAKE AN EMPTY
      RESULT DISTINGUISHABLE FROM AN ABSENT SEARCH. The decomposer emits,
      alongside the drops, a record of what was searched — corpus size and
      method — so greenfield_drops [] can be told apart from a judgment that
      never ran. This is the same principle the create surface already carries,
      where a disagreement between the two checks is itself a finding. Carried
      by tactic-persist-greenfield-drops."
  - question: The supersession doctrine names an edge to record and a close to
      recommend. Can the schema and the lifecycle express either?
    answer: "(Verified and ruled 2026-08-14.) NEITHER, as recorded. IntentionNode
      carries exactly five edge fields — parent, serves, recovers, validates,
      blocked_by — and no supersession edge; and validateNode DROPS UNKNOWN
      KEYS, stated verbatim in write-node.ts. So a superseded_by written today
      vanishes silently on write: the same defect class as the gap field that
      hundreds of nodes carry and that nothing reads. The observable recorded on
      strategy-recursive-self-improvement therefore reads an edge that cannot
      exist, and its claim that no new instrument is required is false — a limit
      the recording round disclosed for recall but not for representability.
      Separately the lifecycle admits ONE terminal, phase done, so executing the
      recommended close would record abandoned work as FINISHED — destroying
      exactly the distinction the requirement exists to preserve. AUTHOR RULING:
      add a first-class superseded_by to the schema, stored on the SUPERSEDED
      node; validate that the target resolves, as blocked_by is validated; and
      add a cycle check modelled on validateGraph RULE 15, the blocked_by cycle
      rule. THE TERMINAL IS CARRIED ON status, NOT ON phase. Ruled 2026-08-14 as
      a non-pruning superseded PHASE and CORRECTED 2026-08-15 after the
      pre-commit adversarial review falsified the reasoning behind it, on three
      independently verified counts. FIRST, THE PRUNING PREMISE IS RETIRED. The
      2026-08-14 draft argued that done launders abandoned work as finished
      because the node is pruned and absence reads as completion. Nothing prunes
      any more: reconcile-graph.ts states LEAVE the node present, no prune, and
      Nothing is pruned anymore. Done nodes are retained. The prose the ruling
      leaned on survives only as stale comments in router.ts and terminus.ts,
      both still asserting prune-on-done makes absence completion. The harm is
      real but its cause is the WORD done, not a deletion. SECOND, A NEW PHASE
      WOULD DEADLOCK THE LADDER. Thirty predicates across fourteen files spell
      terminal as phase equals done. The worst is blockersComplete, which counts
      a blocker complete only when it is ABSENT from the store or present at
      phase done; a non-pruning superseded node is neither, so every tactic
      blocked_by a superseded node would be blocked FOREVER and classifyTerminus
      would drain its dependents as excused-blocked, silently. THIRD, A PHASE
      CANNOT MARK A SUPERSEDED STRATEGY. validateGraph rule 10 confines phase,
      execution, blocked_by and validates to kind tactic, while the originating
      requirement said in terms that the graph must not implement one
      STRATEGY-or-tactic then later attempt the one it supersedes. A phase
      covers half the requirement. status has none of these problems: its
      vocabulary is already per-kind and already validated by rule 16, so it
      reaches every kind with no rule-10 exemption; no code branches on it, so
      the thirty predicates and blockersComplete are untouched. THE COST,
      STATED: a superseded node still sits at whatever phase it reached, so
      wherever the ladder currently reads phase alone to mean eligible it must
      also consult status — one predicate to add, against thirty to migrate.
      Carried by tactic-supersession-edge-and-terminal; until it lands, the RSI
      observable is NOT readable and says so on its own node. EDGE CASES:
      direction is ruled (store on the superseded node; derive the reverse by
      scanning, the way inbound blocked_by edges are found today — note that
      inboundBlockers is a prune-repair scan and not a maintained reverse index,
      so no index pattern is being reused here). Cycles are ruled (checked, per
      rule 15). ONE EDGE CASE IS OPENED BY THIS CORRECTION AND LEFT UNRULED:
      status is a STATE_FIELDS member, and EDIT-STATE is unrestricted, so on the
      letter of the invariant an autonomous lane could mark a STRATEGY
      superseded without a human. Retiring a strategy is a doctrine act.
      Recommendation, not a ruling: require attendance for a superseded status
      on a durable-layer node, the same way this round requires it for any other
      durable substance write. Enrolled on
      tactic-review-supersession-derived-subpoints alongside the
      partial-supersession question. PARTIAL supersession remains UNRULED — the
      existing workflow gate already handles it better than this doctrine does,
      dropping individual units and demoting to draft only when a tactic is
      FULLY superseded, whereas the creation-time check is whole-node. It stays
      enrolled on tactic-review-supersession-derived-subpoints."
  - question: A creation-time supersession check keyed on the new node cannot find
      supersessions that already happened. What closes that half?
    answer: "(Ruled 2026-08-14; the MECHANISM corrected 2026-08-15 after the
      pre-commit adversarial review.) A RETIREMENT-TIME SWEEP, paired with the
      creation-time check, because the creation-time check is structurally
      incapable of this class: keyed on the new node, it only finds cases where
      the NEW node is the superseder. THE SWEEP IS A WIDENING OF AN INSTRUMENT
      THAT ALREADY SHIPS, NOT A NEW ONE. The 2026-08-14 draft specified a fresh
      sweep fired by deletion events, and recorded that its live proof case was
      found by an adversarial reviewer rather than by any instrument. That is
      FALSE and is corrected here.
      .claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh
      exists and run-lint.sh calls it UNCONDITIONALLY, so it is already in CI on
      every commit. Its contract is to fail at the commit that orphans a
      fence-named path: for every non-done node it extracts the verify blocks
      and asserts that every path-like token in them still exists. It already
      has the trigger, the CI wiring, the done-node exclusion, a token rule
      tuned against false positives, and a test suite. IT MISSED THE PROOF CASE
      FOR ONE NARROW REASON, measured: the dead reference in
      tactic-node-ancestry-context is in a prose Scope bullet, while that node's
      verify fences begin hundreds of lines later, and the lint's scan window is
      fence-scoped rather than body-scoped. So the accurate finding is that the
      shipped guard's window is too narrow, not that no guard exists. AUTHOR
      RULING: widen it — add a second pass over non-fence body prose restricted
      to backticked path tokens under .claude and packages, and add a park lane
      so a match on an OPEN node parks it rather than only reddening CI. This
      also removes an undeclared dependency the fresh-sweep design carried:
      nothing in this repository emits a deletion event, and the shipped guard
      sidesteps that by running on every commit instead. LIVE PROOF IT IS
      NEEDED: tactic-node-ancestry-context sat at phase implement, status
      codified, with a plan whose unit B inserts a step into
      .claude/skills/align-strategy/SKILL.md — a skill deleted 2026-08-04. A
      worker selecting it could not have executed it. It was invisible to the
      observable this doctrine recorded, because that observable reads an edge
      no sweep ever wrote. This round parks it. Carried by
      tactic-supersession-retirement-sweep. Related residue the same sweep would
      catch, left standing and now visible:
      tactic-align-strategy-new-steps-revision, at phase null, is scoped
      entirely to editing the deleted skill. A second candidate,
      tactic-align-tactics-mechanical-floor, was named in the 2026-08-14 draft
      and is WITHDRAWN here: it is at phase done, and both the shipped lint and
      this sweep exclude done nodes by design, because done bodies are
      historical archives that may legitimately name paths that no longer exist.
      Naming it as evidence that the sweep is needed cited a case the sweep is
      built not to touch. If stale references inside done bodies are a problem
      worth solving, that is a different instrument with a different rationale
      and it is not ruled here."
  - question: "Clarification 232 binds a /dispatch-ladder run to the WORK it spawned
      rather than to its node. Under record-time main-qa routing the spawned
      node is open and independently dispatch-selectable at the instant the
      source reaches done — so what actually discharges the run's answerability:
      chain onto it, await it, or halt?"
    answer: >-
      (Recorded 2026-08-20, attended /align-tactics office-hours interview;
      author-ratified. AMENDS clarification 232's "THE REQUIREMENT FOLLOWS THE
      WORK, NOT THE NODE" paragraph — read them together.)


      NONE OF THE THREE. Answerability is discharged STRUCTURALLY, not
      temporally. Call the ruling DELEGATE. A run reports complete when (a) its
      SOURCE node is terminal or excused under clarification 232's existing
      predicate, AND (b) every node the run spawned exists, validates, and
      carries a durable structural provenance edge back to the node whose run
      minted it. The run is answerable for THE HANDOFF BEING RECORDED, not for
      waiting out the spawned work. The spawned node then carries its own
      terminus obligation in its own right, discharged by its own run under the
      same rule.


      WHY ALL THREE RECORDED OPTIONS WERE REJECTED. Each buys literal compliance
      with 232's sentence at the price of a property this strategy holds
      elsewhere. CHAIN (take a second sequential claim and walk the spawned node
      to terminal) extends a detached, hours-long run across another node's full
      main-qa cycle, against clarification 226's "progresses ONE NODE all the
      way" span, and leaves duration unbounded. AWAIT (block on the spawned
      node's terminus without claiming it) burns a detached run idling on work
      it does not own while the ordinary dispatch tick may be driving that same
      node concurrently — an unspecified concurrency story, and the same
      unbounded duration. HALT (end non-complete for a person) is safe and
      consistent with "throws always halt, never resolve", but residue-bearing
      runs are the common case, so halts would stop being the exception, against
      226's "detached execution, attended judgment". The shared defect is that
      all three treat answerability as a span of TIME the run must survive; the
      graph is the thing that persists, so the obligation belongs to the graph.


      A MEASURED CORRECTION TO THE QUESTION AS IT WAS FIRST PUT. The 2026-08-20
      park that raised this recorded that the spawned node "classifies as
      `violation`" at the instant the source reaches done. That is FALSE,
      measured at origin/main c281e300. classifyTerminus
      (packages/intentionsutil/src/terminus.ts:57-66) tests
      `execution.completion.mergedAt == null` FIRST and returns `not-merged`,
      and the minted node's `execution` is `{branch, pr, attempts, markers,
      strategy_fingerprint}` with NO `completion` key at all
      (tactic-mainqa-record-time-routing:152). So the spawned node classifies
      `not-merged` and sits OUTSIDE the census population entirely — invisible,
      never counted, not flagged. This STRENGTHENS the ruling rather than
      weakening it: the existing predicate cannot express "spawned work
      outstanding" in any form, so no tightening of the census alone could ever
      have discharged 232's cross-node clause. Some structural carrier is
      required, which is what DELEGATE supplies.


      WHAT THIS COSTS, STATED PLAINLY. Clarification 232's sentence — "a run may
      not report complete until the main-qa work it spawned is itself terminal
      or excused" — does NOT survive this ruling literally. Under DELEGATE the
      spawned work at the completion instant is neither terminal nor excused; it
      is merely RECORDED, with its own obligation pending. The implementing
      tactic's `statement` is rewritten to match. This is a deliberate narrowing
      of 232 ratified by the author in this sitting, not an implementation
      shortcut and not tactic drift, and it is recorded here so that no later
      reader reconciles the two texts by assuming the tactic wandered from its
      strategy.


      WHAT IS DELIBERATELY LEFT TO THE IMPLEMENTING TACTIC. The interview
      sketched a new `excused-delegated` classification on the SOURCE node. That
      may prove unnecessary and must not be treated as ruled: under record-time
      main-qa routing the source goes `review -> done` directly (the 2026-07-28
      greenfield on this strategy), so the source classifies `done` outright and
      needs no excuse. A source-side excuse is only wanted for the TRANSITIONAL
      shape, where forwardPhase still inserts `main-qa` on the source when
      residue is present. Whether to add the enum member, and whether the
      transitional window is long enough to be worth it, is an evidence question
      for the tactic, not doctrine. What IS ruled here is the principle:
      structural handoff, recorded at completion, verified thereafter by the
      graph rather than by the run.
  - question: Which spawn sites does a run's answerability cover, and what bounds
      the recursion when a spawned node's own /qa-main pass can mint further
      nodes?
    answer: >-
      (Recorded 2026-08-20, same attended /align-tactics office-hours sitting as
      the DELEGATE ruling immediately above; author-ratified. Together with it
      this amends clarification 232.)


      UNIVERSAL, NOT ENUMERATED — AND BOUNDED AT DEPTH 1. Every node minted
      during a run must carry a durable structural provenance edge to the node
      whose run minted it, uniformly and without regard to its id prefix:
      tactic-mainqa-*-{machine,author}, /qa-main's
      tactic-<source-id>-main-qa-regression nodes, and the deploy-lag
      tactic-wait-* holds alike. A run is answerable ONLY for its own DIRECT
      spawns. Each spawned node's own run is answerable for whatever IT spawns,
      under this same rule. Recursion is therefore bounded at depth 1 by
      construction, and no chain of any length can extend a detached run's
      duration.


      WHY NOT AN ENUMERATED LIST OF SPAWN SITES. Enumeration is precisely what
      produced the drift this ruling corrects. Clarification 232 named only "a
      standalone tactic-mainqa-* node it created". Measured at origin/main
      c281e300: /qa-main's broken branch
      (.claude/skills/qa-main/SKILL.md:310-350) mints
      tactic-<source-id>-main-qa-regression carrying `blocked_by: []` and
      `office_hours: null`, and records its provenance — "the source PR
      (`execution.pr`) and source node id" — as PROSE IN THE BODY, deliberately,
      because `body` is not a write-node.ts input field. There is no structural
      edge of any kind. Four live instances today:
      tactic-graph-review-exclusion-stall-recovery-,
      tactic-review-code-review-invocation-contract-,
      tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-, and
      tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression. A
      closed list re-opens this question at every new spawn site and silently
      leaves un-covered exactly the sites nobody remembered to add — which is
      the failure already on the ground, not a hypothetical.


      WHY DEPTH 1 LOSES NOTHING. The obvious objection is that grandchildren
      escape. They do not. The census walks the WHOLE graph, so a grandchild is
      covered by ITS parent's run under the same rule; depth 1 bounds what any
      ONE run must verify, not what the graph tracks. This is exactly the
      property that makes the structural discharge finite: a temporal discharge
      (CHAIN or AWAIT) would have needed an arbitrary numeric depth cap to bound
      run duration, and there is no non-arbitrary answer to "how many levels of
      spawned QA should one detached run sit through".


      TWO CONSEQUENCES THE IMPLEMENTING TACTIC MUST CARRY.


      (1) THE EDGE CANNOT BE `blocked_by`. The record-time-routing design
      already puts `blocked_by: [<source-id>]` on the minted node, but that is a
      BLOCKING edge, not provenance: prune-on-done deletes the source at `done`,
      and blockersComplete (packages/intentionsutil/src/router.ts) treats an
      ABSENT blocker as COMPLETE, so the relation stops meaning anything at
      exactly the moment provenance becomes interesting. Overloading it would
      also conflate "waiting on" with "came from" in a field the router reads to
      open dispatch gates. A dedicated carrier is needed, and — unlike every
      other edge in the schema — it must remain valid when its referent NO
      LONGER EXISTS, since prune-on-done is expected to delete the source. That
      survives-the-prune property is the constraint; the tactic chooses the
      carrier.


      (2) THE EDGE MUST SHIP WITH A CHECK — BUT THE CHECK IS NOT "WIDEN THE
      LADDER-TERMINUS CENSUS POPULATION". That mechanism was proposed in this
      sitting and is REJECTED on inspection, recorded here so it is not
      re-attempted. Admitting spawned nodes into the merged-but-not-terminal
      population would classify freshly-minted, perfectly healthy backlog as
      `violation`: a spawned node is not-done, not-parked, and — once its source
      is pruned — not-blocked, so it falls straight through classifyTerminus to
      the violation arm the moment it is created. Spawned work is honest backlog
      and is already dispatch-selectable; it is not stalled merged work, which
      is the only thing that census exists to catch. What the requirement
      actually needs is a check on the EDGE, not on the phase: a run-completion
      postcondition asserting that every node carrying a provenance edge to the
      node just completed validates, and/or a store-wide orphan check that fails
      when a node bearing a spawn-site shape carries no provenance edge (which
      would fail today on the four instances above). The tactic chooses the
      shape. What is ruled is that the edge must not ship without a check that
      fails when it is missing — an unchecked provenance field would record the
      handoff while proving nothing, which is worse than the status quo because
      it looks like coverage.
  - question: The armed maintenance-burden band is measured in breach — 40.5%
      against a 35% ceiling, and the sensor's series verdict reads "increasing".
      Is the condition failing, is the band re-declared, or is the breach
      accepted?
    answer: "(Ruled by the author 2026-08-28 in the sitting that cleared
      tactic-align-audit-legacy-review; ruling text in commit 751982b0, indexed
      in plans/dispatch-rsi-author-rulings.md, transcribed here 2026-08-29 under
      Ruling 5.) DISPOSITION (c) — ACCEPT THE BREACH WITH REMEDIATION. The 35%
      ceiling is KEPT as the target and is not re-declared; the remediation is
      the existing 13-position serialized drain plan, and the charter split
      ruled in the same sitting is the structural fix behind it. Re-measured at
      the sitting through classifyTactic/strategyBacklogBand over git archive
      origin/main intentions: 135/316 = 42.72%; the ceiling limb fails
      decisively and the non-increasing limb is WITHDRAWN as a ground (43.67% at
      76abc77a, 44.30% at a5ddeca1, 42.72% now at the same denominator).
      REJECTED: (a) re-affirming 35% as a halt, which keeps 82 parked nodes
      parked for the window; and (b) re-declaring the ceiling against the grown
      population, which re-baselines the signal on the same pooled denominator
      the charter split has just ruled unfit and would need re-doing after the
      split re-cuts it. UN-PARK CRITERION, a rule rather than an enumeration:
      every node parked SOLELY on the maintenance-burden band breach is
      un-parked on the drain plan. An enumerated list was declined deliberately
      — the parking round's own text named eleven nodes while 82 tactics serving
      this strategy are parked, so any hand-list goes stale immediately. THE
      PRECEDENT for applying it: tactic-graph-commit-park-content-durability was
      cleared on this same ruling (f093e607) only once ALL of its blockers were
      ruled, not on the band alone. A node carrying a second still-open blocker
      stays parked."
  - question: Is `dispatch <node-id>` valid usage, and does it walk the critical
      path to the named node, wait out in-flight CI, launch /fix-checks on red,
      and resolve merge conflicts?
    answer: "(Recorded 2026-07-29 /align-strategy interview; the author's
      four-clause description checked clause by clause against origin/main.)
      VALID USAGE — confirmed: `dispatch [<node-id>]` is the manual entry point.
      The nix-installed wrapper execs
      `.claude/skills/dispatch-propagate/scripts/dispatch-tick`; bare it passes
      `--manual` (the rank-first fan-out), with an argument it takes the
      explicit-node lane, and `dispatch-tick` rejects the two combined as
      semantically incompatible. CLAUSE-BY-CLAUSE VERDICT. (1) Critical-path
      walk — NOT current behavior; now adopted as a requirement. Today
      `graph-select-target --node <id>` filters the candidate list to exactly
      that id, and a tactic with an incomplete blocker (`blockersComplete`,
      packages/intentionsutil/src/router.ts) or a strategy with open on-path
      children is never a candidate at all, so a blocked or parent target yields
      `node-not-selectable <id>` and `dispatch-tick` exits 1. The lane's
      documented contract is \"a selection-order override, not a gate bypass\",
      and substitution is neither — it is a target substitution, a third
      category. (2) CI wait — NOT current behavior. The author's CONTRAST with
      the rank lane is accurate, but the explicit lane skips too, at two
      surfaces: selection-time (`sensor_gate`'s qa/review arm consults
      `dispatch-ci-ready`, rc 1 → skip reason `ci-pending` →
      `node-not-selectable`) and provision-time (`provision-node-worktree` exit
      10 `ci-waiting` → disposition `waiting <id>`, \"retry next tick\"). Under
      the standing paused/manual-only operating mode there IS no next tick, so
      the human gets a dead end and must re-run by hand — the asymmetry that
      justifies the clause: skipping is only cheap when something else comes
      back. Now adopted, bounded and lane-scoped. (3) Failing checks →
      /fix-checks — CONFIRMED, already implemented and already reached on this
      lane. Selection is the sole CI-routing authority: on CONCLUDED-RED at
      implement/qa/review the fix-interrupt gate writes `execution.fix` (via
      `apply-fix-state --set-fix` + `graph-commit`) and emits phase `fix`, which
      `dispatch-graph-execute` maps `tactic:fix` → `/fix-checks`. `--node` does
      not bypass `sensor_gate`, so the explicit lane gets this verbatim; a
      persistently-red PR past the fix-attempt cap lands a tracked `hold-node`
      hold with a `blocked_by` edge rather than retrying forever. (4) Merge
      conflicts — CONFIRMED, with two corrections the author accepted. The merge
      attempted is a FULL `git merge --no-edit origin/main` in
      `provision-node-worktree`, not `--ff-only`; on failure it runs `merge
      --abort` and exits 11, leaving the tree unmodified and the worktree/branch
      in place for the resolver. And the resolver is `/dispatch-conflict` Lane 3
      (\"an origin/main merge conflict on a graph node's own branch\"), kicked
      by `dispatch-graph-execute` case 11 as first responder — there is no
      script or skill named `dispatch-merge`. Only if that kick FAILS does it
      fall back to a consecutive-strike counter and then a tracked `hold-node`
      hold. Both corrections are description-only: the author declined changing
      provisioning to `--ff-only` (today's full merge succeeds where ff-only
      would refuse, for every node whose branch carries commits) and declined
      renaming Lane 3 (the skill handles conflicts, and \"merge\" would
      misdescribe its Lanes 1 and 2). WALK SEMANTICS (author, this round):
      compute the closure of the recursive union of the named node's
      `blocked_by` and its children (`parent`/`serves`), keep only members
      passing every existing gate verbatim (claim-safety, `sensor_gate`,
      `office_hours`, freeze), and dispatch the highest member by the SAME
      lexicographic (tier, rank) precedence the rank lane already uses. Print
      the substitution and its reason before launching; refuse only when the
      whole closure is undispatchable. Reusing the selector's own precedence
      rather than inventing a walk-specific order is the parsimony the record
      already paid for once: strategy-graph-drives-dispatch's 2026-07-13
      clarification superseded backward rank FLOW precisely because unrelated
      `blocked_by` compounding silently overtook intentionally top-ranked nodes,
      replacing it with a max-based precedence lift — blockers are RANKED
      higher, not boosted higher — and its 2026-07-18 extension generalized that
      lift to the (tier, rank) pair. Because that lift already makes the rank
      lane drain the critical path to a hot node first, this clause makes the
      explicit lane do targetedly what the rank lane does globally; a second
      ordering currency here would re-open the failure mode 2026-07-13 closed.
      Blockers-before-children and nearest-hop-first were both offered as walk
      orders and declined for the same reason. CI WAIT (author, this round): on
      the EXPLICIT-NODE LANE ONLY — never the autonomous path, never `--manual`
      — poll the CI verdict until it concludes, bounded by
      `DISPATCH_RESERVATION_STANDALONE_TTL_S` (default 600s), then fall back to
      today's skip with a message naming the PR. Lane-scoping is load-bearing:
      `dispatch-tick` is also the systemd/heartbeat entry point and a blocking
      wait there would stall the chain. The bound is TIED to the reservation TTL
      rather than given its own constant because selection writes the
      reservation marker BEFORE the wait, so the wait holds a concurrency slot
      for its whole duration; one constant governs both and they cannot drift
      apart, and if real check durations exceed it the fix is raising that one
      constant rather than adding a second. An unbounded wait (Ctrl-C as the
      bound) and a separate longer bound were both offered and declined.
      Recorded consequence, accepted not yet exercised: a manual `dispatch` can
      now hold a ledger slot for up to the TTL, which is exactly the
      ledger-consuming behavior the paused-scheduling condition requires to hold
      under manual-only operation — tying the bound to the TTL is how that
      condition is honored, not an exception to it. SOVEREIGNTY INHERITANCE
      (author, this round; extends entries 49 and 76): a node reached by
      SUBSTITUTION inherits the bypasses the named target would have had — the
      pace-curve override (entry 49) and the exactly-one-node ceiling bypass
      (entry 76). Entries 49 and 76 grant the bypass to a NAMED node and say
      nothing about a substituted one, because substitution did not exist when
      they were written; this extends their intent rather than restating their
      text, and the boldness was named to the author before endorsement. Failure
      scenario it closes: without inheritance, `dispatch <hot-id>` at the worker
      cap would substitute a blocker and then refuse it on the ceiling — the
      walk failing exactly when the fleet is busiest, which is when a human
      reaches for it. The narrow reading (a bypass attaches only to what a human
      literally typed, per entry 76's \"only conscious, bounded human action may
      exceed it by one\") was surfaced and diverged from: the substitution IS
      that conscious action, and the bounded-by-one guarantee is untouched.
      Splitting the two bypasses — inherit the pace curve but not the ceiling —
      was offered and declined. STEELMAN, on the walk: keep `dispatch <id>`
      literal, because naming a node means dispatching that node and a refusal
      is informative, while conflating \"run this\" with \"run whatever unblocks
      this\" makes the command's effect unpredictable — and it is what entry
      49's own recorded disposition implies, since the explicit lane already
      \"refuses a node already held rather than force-preempting\" rather than
      substituting. DIVERGED (author, this round) with the cost accepted
      explicitly: `dispatch <id>` no longer guarantees it ran `<id>`. The
      mitigation is the loud-substitution requirement above, not a separate
      surface — the third option offered, keeping bare `dispatch <id>` literal
      and adding `dispatch --path <id>`, was declined as one more thing to
      remember. FREEZE MEASUREMENT (this round; a worked example of the
      measure-with-the-predicate-never-a-grep rule): all 30 open (non-draft,
      non-done) tactics serving this strategy carry
      `execution.strategy_fingerprint: null`, which `isFingerprintStale` never
      treats as stale, so this entry freezes ZERO children and the
      materiality-scoped-freeze classification has an empty subject set — no
      re-stamps and no `blocked_by` additions are owed. A `grep -c` over
      `strategy_fingerprint` would have counted those 30 null-valued key lines
      and reported a 30-child blast radius. IMPLEMENTATION retained as draft
      tactic-dispatch-explicit-critical-path-walk and draft
      tactic-dispatch-explicit-ci-wait; the clause-(4) corrections carry no code
      change. No delegation edge changed — this strategy's `recovers:
      [delegation-github]` already covers the owned dispatch machinery and
      nothing this round shifts it. Nothing was held on trust: each
      recommendation's boldness was stated inside the question and the author
      endorsed each outright, so no born-parked review item is owed. AMENDED
      2026-08-29 (author batch-execution sitting; recorded in
      plans/dispatch-rsi-author-rulings.md §\"Ruling 3\"): the CI-WAIT paragraph
      above asserts as settled fact that \"selection writes the reservation
      marker BEFORE the wait\", and that premise was measured FALSE at the
      SELECTION-TIME surface — graph-select-target's ci-pending skip returns
      before any reservation_write, and the explicit lane invokes it without
      --standalone, so no marker is held. It is true at the PROVISION-TIME
      surface. Ruled: OPTION (a), MAKE THE PREMISE TRUE. The selection-time wait
      writes a PROVISIONAL reservation claim before it waits, so both surfaces
      genuinely hold a slot and the recorded consequence above (\"a manual
      dispatch can now hold a ledger slot for up to the TTL, which is exactly
      the ledger-consuming behavior the paused-scheduling condition requires\")
      actually obtains. The accepted cost is a new ledger write at a point that
      has none today, needing rollback-on-timeout semantics —
      graph-select-target's STANDALONE_CLAIMED EXIT trap is the existing
      precedent — and getting it wrong leaks a slot per failed explicit
      dispatch, precisely the failure the origin=explicit stamp was added to
      prevent. REJECTED: narrowing this entry to the provision-time surface
      only, where the recorded rationale holds verbatim and no new concurrency
      semantics are introduced. It was cheaper and needed no new semantics, but
      it leaves the qa|review phase pair — the very pair
      tactic-dispatch-explicit-ci-wait was raised for — still dead-ending on
      node-not-selectable, which is a real scope reduction rather than a
      shortcut. Also rejected: borrowing the TTL as a bare bound magnitude with
      no slot held, which keeps the constant while abandoning its stated
      reason."
  - question: May an executor clear an office_hours park itself when the park's
      premise is verifiably dead, or must every clear reach the author?
    answer: "(Ruled by the author 2026-08-29, batch-execution sitting; recorded in
      plans/dispatch-rsi-author-rulings.md §\"Ruling 4 — Park-clearing on a
      verifiably dead premise is delegated\".) DELEGATED. The executor may clear
      a park itself when the park's premise is verifiably dead, and separately
      may clear the office-hours parks that block the
      tactic-mainqa-record-time-routing Unit 7 `Verifiability: WAIT` migration
      from draining. Every clear is REPORTED AFTER THE FACT, with the evidence
      that killed the premise — reporting is the accountability, not
      pre-approval. The author's stated expectation for this batch is that no
      parked decision is waiting on them. WHY THE SECOND HALF WAS NEEDED:
      packages/intentionsutil/src/router.ts:482 and :529 skip any tactic with a
      non-null office_hours, so a parked source node can never drain to done; 12
      of the 17 WAIT-mark sources are parked, which deadlocks the migration
      chain for them (source never done -> blockersComplete never passes -> the
      minted machine node is never selectable either), and Unit 7's own spec
      never mentions office_hours. BOUND, and it is the whole of the delegation:
      a DEAD PREMISE is not a DEAD SCOPE. This entry authorizes clearing a park
      whose stated blocking premise no longer holds; it does NOT authorize
      making a node selectable whose SCOPE is dead or whose park is the only
      stop on a bad automated action. Where clear-park is the wrong instrument —
      a phase: null node whose work already shipped, which clear-park makes
      router-eligible rather than terminal — the correct act is the completion
      record (phase: done), never the clear."
  - question: How does the target-state disposition read under the
      intent/orchestration layer boundary (2026-08-31)?
    answer: "(Amended 2026-08-31 /align doctrine-alignment round; appends to, never
      rewrites, the ratified target-state clarification.) Ratified restatement:
      the INTENT LAYER always reflects target state; orchestration fields
      (phase, execution, office_hours and kin) are observed state and exempt by
      construction - the layer boundary is recorded on strategy-explicit-intent
      (2026-08-31). Full-frontier review upheld the one-layer target-state
      design rather than an explicit second current-state layer: the
      infrastructure-as-code tradition (declarative desired state plus
      reconciliation) independently converges on it, and a second layer would
      duplicate what sensors and orchestration fields already carry. (decision:
      author-ratified, 2026-08-31)"
  - question: How are brownfield migration paths maintained (projection principle,
      2026-08-31)?
    answer: "(Recorded 2026-08-31 /align doctrine-alignment round.) Ratified:
      brownfield migration paths are DERIVED PROJECTIONS between measured
      current state and recorded target state - never stored step lists, which
      stale the moment either end moves (the author's named pain: migration
      tactics growing stale and causing regressions when finally drained). Where
      the target is machine-checkable, the migration frontier is fully derived:
      target rules run in observe mode, the frontier they report IS the
      remaining migration recomputed on every read, drain means the frontier
      empties, and the ratchet then flips observe to enforce - the four-step
      migration contract mechanized (record target schema; open read-tolerance
      window; drain the derived frontier; ratchet). Where the target is prose,
      carrier tactics remain but must carry execution-time re-derivation (the
      drift re-evaluation gate pattern ratified 2026-08-31 on
      tactic-keystone-decomposition-reorg). DEPRECATION is a migration whose
      target is absence: the retirement disposition is the target state; the
      frontier reports every remaining live reference as the migration surface;
      the ratchet is deletion plus a lint refusing new references. Tradition
      references: Terraform plan / the IaC reconciliation loop (the bridge
      between current and desired state is derived at execution time, never
      stored). Frontier tooling delegated
      (tactic-migration-frontier-projection). The plans/ stop-gap mirror
      (strategy-explicit-intent, 2026-08-31) is a projection the graph should be
      deriving. (decision: author-ratified, 2026-08-31)"
  - question: What is the doctrine of implementation as incremental reconciliation,
      and where is the line between migration and implementation?
    answer: "(Recorded 2026-09-01, /align ladder-reconciliation round.) Ladder
      execution is incremental reconciliation between target state (the intent
      layer) and operational state (the repo at origin/main, PR state,
      evidence). Five sub-principles, each author-ratified: (1) UNIFICATION -
      there is no line in kind between implementation and migration:
      implementation is reconciliation whose diff creates structure; migration
      is reconciliation whose diff transforms or removes it (deprecation =
      migration-to-absence, per the 2026-08-31 projection disposition).
      Traditions: Terraform plan/apply draws no line between first and later
      applies; Kubernetes reconciles create and update identically. (2)
      PLAN-AS-PINNED-PROJECTION and the PERSISTENCE TEST - persist exactly what
      re-derivation cannot reconstruct (author decisions, sanctioned criteria,
      hazards known only from experience); everything reconstructible (path:line
      anchors, step order, reuse pointers, model picks) is projection: derived
      against a pin {base sha, strategy fingerprints}, regenerated on pin
      mismatch, never hand-reconciled. Mission-command vocabulary adopted
      (Auftragstaktik): the record carries commander's intent, end state, and
      constraints - never the scheme of maneuver. Traditions: Terraform
      saved-plan staleness; Auftragstaktik/commander's intent; the 2026
      spec-driven wave's agent-maintained ephemeral .plan.md artifacts (Tessl).
      (3) DERIVED POSITION - ladder position is derived, level-triggered, from
      append-only completion evidence carrying proof; the stored phase field is
      a projection/cache during migration. Position is an estimate and carries
      honest unknowns (the CiVerdict.unknown precedent). Traditions: Kubernetes
      status.conditions and level-triggered controllers; event sourcing;
      estimation theory. (4) LIFECYCLE SEPARATION (the cattle rule) - intent
      (interview-maintained), projection (regenerated), and evidence
      (append-only) have distinct lifecycles; no hand-maintained object may
      carry a projection; work records are minted mechanically and never edited
      - killed and re-minted on drift. The measured pain of standing tactic
      nodes (drift, deduplication, constant re-evaluation) is the cost of
      blending the three lifecycles in one hand-authored object. Traditions:
      pets-vs-cattle (immutable infrastructure); Kubernetes owned objects -
      nobody edits a Pod. (5) RATCHET - an acceptance check is born observe-tier
      (failing means frontier entry, not red CI) and promotes to gating by
      mechanical high-water mark: once it has ever passed on main, a later
      failure is a regression and gates. One-way, no ceremony. The observe tier
      is a declared tier with a promotion rule, not a skipped test - the
      test-integrity carve-out. Traditions: Nix/Hydra channel advance on green;
      CI ratcheting; the drain-then-ratchet mechanics of the 2026-08-31
      projection disposition, mechanized. (decision: author-ratified,
      2026-09-01)"
  - question: What is the greenfield target architecture for the dispatch ladder
      under the reconciliation doctrine?
    answer: "(Recorded 2026-09-01; author-ratified as target state, recorded while
      implementation lags, per doctrine.) STRATEGY-SCOPED RECONCILIATION. The
      strategy node carries target state (statement + criteria prose +
      registered machine checks) and an operational layer (append-only evidence
      log + live claim records). The author sanctions CRITERIA, never slices or
      step lists. There is no standing decomposition into tactics: the backlog
      is the derived FRONTIER (failing observe-tier checks + prose-gap
      assessments); decomposition into a session-sized bite happens at claim
      time - lot-size-one planning (Toyota one-piece flow, viable now that
      agents rebuild context per session regardless) - and the bite exists only
      for the claim window. AUTHOR NOTE (2026-09-01): only tactic-shelf
      decomposition dissolves; strategy topology and the decomposition/mount
      rules (keystone reorg, mount schema) remain intent structure serving other
      functions. TICK: select top-ranked (strategy, frontier) -> claim ->
      project (per-phase, execution-time planning) -> execute -> append evidence
      -> fold at merge; MAPE-K/blackboard shape. THE PR IS THE CLAIM-WINDOW WORK
      RECORD, with an authority split: the graph is authoritative for intent and
      holds only observed, derived evidence about work; the PR is authoritative
      for operational work state; the graph never stores expectations about PR
      content. Diff satisfying no criterion is an unmatched-evidence digest
      finding. CONCURRENCY (author directives, 2026-09-01, binding on the
      delegated design): ticks must be concurrency-safe and optimize
      shared-state operations - claim records one-file-per-claim (no shared hot
      file); evidence appends commutative and mergeable; folding serialized at
      the graph-commit landing lock (the sanctioned serialization point);
      orchestration writers never rewrite intent bodies (the layer boundary).
      MACHINE-SIGNAL MAXIMIZATION and PROSE-COST MITIGATION (author directives,
      binding): apply every tradition to produce machine-verifiable signals;
      prose evaluation is the expensive path, mitigated by (a) the check
      expressiveness ladder (example -> property-based -> invariant), raising
      the machine share of target state (refinement calculus made affordable by
      agents), and (b) ASSESSMENTS - memoized prose evaluations {subject,
      verdict, basis pin, date} expiring on pin mismatch, generalizing the
      existing reading freshness gate into a general judgment cache.
      EVIDENCE-LOG COMPACTION: journal-to-ledger folding (double-entry
      bookkeeping tradition) - the log folds to per-criterion current state at a
      target-size threshold (trigger family shared with materialized-context
      compaction); git history is the archive; one operation family with the
      clarifications consolidation. CONTROL LAYER RETAINED deliberately (the
      CodeCRDT caveat: observation-driven coordination alone has no convergence
      guarantee under concurrent stochastic writers): rank, serialized landing,
      claim records; pace mechanics are a WIP limit - the tick is a pull system
      (kanban). Tradition references recorded for this architecture:
      Kubernetes/Terraform/Nix reconciliation; loop engineering (Osmani 2026);
      spec-driven development and spec-as-source; stigmergy (adopted for backlog
      signaling, contradicted for concurrency control by CodeCRDT); blackboard
      systems (Hearsay-II); MAPE-K autonomic computing; Coase inversion
      (scrum-shaped process is a firm-shaped solution to human transaction
      costs; the governance layer is what survives); one-piece flow; refinement
      calculus; double-entry bookkeeping; speculative execution (cheap redo
      sanctions disposable parallel drafts); estimation theory. (decision:
      author-ratified, 2026-09-01; retirement of the tactic layer itself
      deferred to a post-viability interview)"
  - question: What is the brownfield path from the frozen tactic corpus and the
      batch plan to the reconciliation ladder?
    answer: "(Author-ruled 2026-09-01. Supersedes the plans-as-stop-gap-mirror
      arrangement and, for this migration, the drain-through-the-old-ladder
      default.) The incumbent tactic nodes are NOT drained through the old
      ladder: work is frozen in part because of the pain points those very nodes
      record. Completing the implementation scope of the incumbent tactics USING
      the greenfield reconciliation approach is the viability test of that
      approach. The plans/dispatch-rsi-*.md corpus and the batch session
      operating on it are ABANDONED - the stop-gap-mirror role ends; those files
      stop being maintained and carry no authority. A new bootstrapping
      operation replaces batch resumption, bootstrapping through the session
      priorities in order: (1) greenfield graph implementation (the
      strategy-scoped reconciliation architecture), then (2) long-horizon
      dispatch with rsi and token efficiency, without regressions in integrity,
      quality, or token efficiency. (decision: author-ratified, 2026-09-01)"
tooling_goals:
  - kind: actuator
    statement: /align-tactics <strategy-id> — break a strategy into PR-sized tactic
      nodes with clean-session plans, superseding /file-issue epic structuring
      and /plan-issue
  - kind: actuator
    statement: graph-native router tick — selects by resolved rank across strategies
      and tactics in owned deterministic code, executes the tick as a thin
      workflow fan-out (one agent per selected node), transitions persisted
      phase via direct-push writes — rebase-retry under the worktree writer,
      plumbing CAS with no rebase under GRAPH_COMMIT_WRITER=plumbing
      (2026-08-13), and CAS against graph-main once tactic-graph-ref-split lands
  - kind: sensor
    statement: lifecycle telemetry from the store itself — phase transition history
      and round counts readable from node state
success_signal:
  observable: "the owned graph-dispatch path is exercised, not merely built:
    tactics complete the full lifecycle — align-tactics breakdown, implement,
    qa, review, merge — with no GitHub label or issue required, and the
    machinery's own open defect population is visible in the graph as open
    tactics serving this strategy"
  sensor: the intention store and the router's selection log —
    align-tactics-census.ts enumerates the open machinery-defect population
    serving this strategy; the selection log carries lifecycle completions
  threshold: "the owned path carries tactics through the full lifecycle
    continuously, and the machinery's own open defect backlog — open (phase set,
    not done) plus born-parked tactics serving this strategy — stays at or below
    35% of all tactics serving this strategy and is non-increasing across
    consecutive samples derived from intentions/ git history at read time, and
    parks attributable to an upstream recording round’s own record gap trend to
    zero (Amended 2026-08-28: the 35% band is in accepted breach under
    disposition (c) — the ceiling is KEPT as the target and the drain plan is
    the remediation; see the maintenance-burden condition and the 2026-08-28
    clarification. A measured breach against this target does not make the
    signal falsified while the drain plan is in force.)"
  is_proxy: true
attention:
  boosts:
    "1": 5
  rationale: "Author-directed 2026-07-06: the graph-native dispatch router
    migration is the current focus — lift this strategy and its tactic subtree
    above derived-only ranks (derived terms cap at 2) so router selection works
    the migration first."
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
  last_aligned: 2026-08-10
attributes:
  queue_summary:
    date: 2026-08-11
    summary: "Paused (`dispatch_pause_state` reads `paused`) and static: origin/main
      advanced by exactly one commit since yesterday's render (0f2e1412 to
      65d8952d, the rsi iteration itself), and the phase table is byte-identical
      to it — 12 implement, 13 qa, 18 main-qa, 3 review. Backlog is 58/236 =
      24.6%, inside the recorded 35% band and non-increasing across the 28d
      series (47.6% then 38.2% then 31.4% then 24.6%) — but at this sample the
      band is measuring a queue that is not moving rather than one that is
      draining. The mass stays in verification: 31 of the 46 phase-set nodes sit
      in qa or main-qa against 12 in implement, so the binding constraint on
      resume is downstream of selection, not at it. Review holds three —
      tactic-graph-commit-landing-signal-unreliable,
      tactic-reap-safety-behind-branch-false-positive,
      tactic-wait-calendar-release. Resume remains gated on the recorded
      criteria, re-measured at the time of the decision."
  conditions:
    - the legacy gh router only drains existing issues; no new work enters via
      gh once the /align entry point (today /align-strategy, until
      tactic-align-entrypoint-consolidation lands) is live — the graph is the
      sole issue tracker, bug tracker included, with no side-channel work
      records
    - direct-push commits stay restricted to intentions/ paths; same-node
      contention resolves automatically through the serialization ladder (git
      merge → structural field-level merge → re-read/re-apply → scoped model
      reconciliation), with the author involved only at a true-conflict
      office_hours park; total resolution cost — retries plus model spend —
      stays negligible at fleet concurrency
    - strategy-graph-drives-dispatch holds — resolved rank from the graph orders
      execution
    - persistent-layer substance — virtues, strategies, traditions, delegations
      — stays human-decided in the /align interview (today /align-strategy); the
      skill records, it does not derive
    - workflow scripts stay thin composition — selection, transition, and
      provisioning mechanics live in owned, offline-testable code (tsx modules
      and primitive scripts) that workflow agents invoke; the Workflow executor
      orchestrates but never becomes the sole home of router logic; under Shape
      B (clarification 24 amended 2026-07-11) the router/launch layer is itself
      owned code and the Workflow executor is used only inside per-phase
      fan-outs, never as the router substrate
    - every office_hours park writes recoverable context into the node at park
      time — reason, a best-next-steps recommendation
      (office_hours.recommendation), and any state a fresh session needs;
      session attach/resume is not a supported recovery path, so a park whose
      context lives only in the parking session is a defect
    - /align (today /align-strategy) records in the graph, at record time, all
      context a fresh /align-tactics session needs to decompose or re-evaluate —
      strategy substance plus draft-tactic bodies; same-session /align-tactics
      execution is a bootstrap safety, not a carrier, and a decomposition
      blocked on unrecorded interview context is a defect of the recording round
    - a re-evaluation amendment reconciles the amended tactic's entire node —
      statement, rationale, context, every unit, and verification — against the
      full current strategy substance in the same round, and dispositions each
      open child from a full-body read (keyword grep only shortlists); a
      one-bullet delta that leaves sibling sections stale is a defect of the
      amending round
    - phase progress whose only home is the worker session is a defect — workers
      flush findings to durable state at natural boundaries (worktree commits,
      PR comments as produced, node body residue sections), and a re-selected
      worker treats pre-existing worktree and PR state as resume input rather
      than redoing the phase; session recovery (workflow resume, transcript
      reconstruction) is never router substrate
    - "router failure containment holds — every session pass over a claimed node
      ENDS by declaring exactly one of three dispositions: progression (a phase
      transition write), bounded retry-by-design (a retry against a declared
      finite cap, e.g. the fix-attempt cap), or a park. A pass declaring none of
      the three HAS NOT ENDED: its session is not reaped, so it stays live,
      worktree_has_live_session holds the node frozen, and no re-selection —
      therefore no unbounded iteration — occurs; the held session is the
      debugging artifact (see the reap-scope condition, whose freeze-for-debug
      is this mechanism rather than an exception to it). The fuse breaker covers
      the residual case ONLY: a pass that ends without declaring progression,
      retry, or park and whose session is nevertheless reaped, leaving the node
      selectable with nothing recorded. It fires on the FIRST occurrence — no
      second strike — and parks the node to office_hours, because a
      reap-without-declaration is a defect of the reaping path rather than a
      transient to absorb, and every recognized transient class is already
      contained without it (a session dying mid-pass declares nothing and so is
      not reaped; a session failing to launch consumes nothing). Correlated dead
      claims (at least 3, constituting the prior tick's selection) additionally
      trip a graph-recorded breaker incident tactic halting all selection until
      a human un-parks it. Breaker state never lives outside the graph. This
      condition governs SESSION PASSES only — a tick-level skip (ci-pending,
      reserved, blocked) spawns no session and declares nothing, so its liveness
      is a separate obligation. This condition holds only where two containment
      properties hold: the freeze must anchor on durable graph state rather than
      on a process-level session registry, and a terminal declaration must be
      verified against the graph write it asserts rather than standing as a
      decoupled job-dir marker. Where either property is absent the containment
      leaks and this condition reads as not-yet-holding on that limb. (Restated
      2026-08-05 /align interview as standing properties; the tactics tracking
      them when this was written were tactic-claim-containment-durable-anchor
      and tactic-terminal-declaration-verified-against-node, cited as dated
      provenance rather than as the condition's content, so the condition stays
      true once they land and are pruned.) (Amended 2026-07-29: replaces the
      prior two-consecutive-strikes no-progress park.)"
    - interactive graph-reading skills (/align — today /align-strategy —
      /align-tactics, and the office-hours review) begin analysis only against
      freshly-fetched origin/main state — cut the session worktree from
      origin/main or hard-fail a pre-analysis freshness check, with a fetch that
      cannot reach origin failing the session rather than proceeding on the
      local tree; a prose-only freshening step is a backstop, not the mechanism,
      and analyzing a stale local checkout (a session tree behind origin/main)
      is a defect — distinct from, and the inverse of, the content-staleness
      hazard on strategy-explicit-intent (the graph lagging reality)
    - every node-assigned session — router phase workers, /align-tactics
      workers, main-qa handlers, office-hours entry, and interactive align
      sessions editing a node — starts with the node plus a bounded ancestry
      projection (parent + serves chain to virtue roots) injected as read-only
      decision context; ancestry never substitutes for the node body's complete
      plan, and a plan-vs-ancestry conflict parks to office_hours with a
      recommendation rather than self-adjusting scope
    - the legacy drain state is monotonic — no dispatch surface re-enables a
      disabled GitHub feature (has_issues included); a skill whose spec requires
      a disabled feature is a defect of the skill, never license to re-enable
    - "strategy-main-health holds attributes.tier: 3, the top tier, and so
      outranks all other work structurally; enforced at the write path rather
      than by ranking logic (parsimony — the node is simply in the top tier, no
      specialized numeric treatment): validate-graph/graph-commit refuses a
      commit that authors an explicit attributes.tier: 3 on any other node, or
      that removes tier 3 from strategy-main-health, unless the node carries the
      ACK: main-health-dominance opt-out. Inheriting tier 3 down serves/parent
      is unguarded — that is how auto-created red-main fix tactics get their
      urgency. (amended 2026-07-31: was the standing boost 100 as the graph's
      top authored rank, with the guard on boosts/overrides at or above it;
      migrated to the tier model, same write-path posture and same ACK
      substring)"
    - "a node-worker session is auto-closed (reaped from the agents list via the
      foreground-safe self-close primitive — `claude rm`; interactive sessions
      exempt) iff its pass DECLARED a terminal disposition — the presence of the
      `$CLAUDE_JOB_DIR/node-terminal` marker naming that node, whatever its
      disposition member; every UNDECLARED terminal exit — a hard crash, an
      error, or a clean-but-silent no-progress exit — is KEPT (its job entry and
      node-id worktree both held) for local debugging until an operator manually
      reaps it, because such an exit wrote nothing durable saying what it did
      and the live session is its only debugging artifact (2026-07-19
      reap-scope-narrowing clarification, reframed 2026-07-29 from an
      enumeration of reapable dispositions to this presence test — see the
      declared-vs-undeclared clarification of that date). The disposition member
      (advance, demote, park, fix-attempt, align-round, no-claim,
      conflict-resolved, conflict-hold, park-clear) is the primitive's
      diagnostic detail, never doctrine: dispatch-self-close reads only
      `^node=`, so adding a member never re-stales this condition — which is
      precisely how the enumerated form went stale (the 2026-07-28 park-clear
      ratification added one member and left five unreconciled). A pass DECLARES
      as the LAST durable action of the pass, never earlier: `Stop` fires on
      every turn yield, not only terminal exit, so declaring early reaps the
      session out from under its own in-flight work (incident 2026-07-28, node
      tactic-graph-ref-split, session 36e64744); park-node's unconditional
      internal declaration call WAS a live instance of violating this when
      recorded (2026-07-31; tracked at that time in
      tactic-office-hours-self-modification-skill). Stated in the past tense as
      of 2026-08-05 so the condition stays true once that tactic lands and is
      pruned. Reaping a declared session loses nothing durable — by construction
      it recorded what it did (an advance moved the node's phase; a park wrote
      office_hours into the node; a park-clear landed the office_hours removal
      on origin/main; a fix-attempt landed and pushed its commits) — and a
      declared worker job left in `claude agents --json` is a defect UNLESS the
      default-off keep-all operator escape hatch (2026-07-19
      configurable-auto-close clarification) is enabled. A kept undeclared
      session holds worktree_has_live_session TRUE, so its node freezes (router
      will not re-select; no-progress fuse will not count re-selections) until
      manual reap — accepted freeze-for-debug over silent auto-retry on the
      failure path, but accepted ONLY for genuinely undeclared exits: a lane
      that completed its pass and merely omitted the declaration freezes its
      node with no failure to debug, which is a defect of that lane (confirmed
      live 2026-07-29 on /qa-fix's fix-finalize path). A minimal
      operator-visible count of held-for-debug sessions surfaces accumulation
      without re-coupling observability to session persistence (it reports only
      the count, never session content; it is not a recovery substrate or
      escalation channel — escalations still surface via the office-hours PARKED
      panel). Auto-close remains the doctrinal default for every declared
      terminal disposition, and the session is never router substrate"
    - "paused-scheduling with manual-only dispatch is a supported STANDING
      operating mode, not a degraded or temporary state — the pause sentinel
      gates worker spawning only, never reservation-ledger reconciliation — so
      every ledger-consuming invariant (e.g. the selection-time busy+reserved
      count) must hold in it without relying on the autonomous heartbeat's
      reaper (Amended 2026-07-26: the pause SENTINEL named in this condition is
      replaced by a dispatch.config/*.json boolean field as the sole mechanism —
      see the pause-field clarification of that date. Every clause of this
      condition carries over to the field unchanged, and pause evaluation
      additionally fails CLOSED: any config resolve/read/parse failure is
      treated as paused, never as not-paused.)"
    - "every new pull request opens with the title `<node id>: <short
      description>` — the literal node id verbatim, kind prefix included — and
      its head branch resolves to a real node in `intentions/`; the prefix is
      constructed by the opener from the node rather than hand-authored, and a
      CI guard rejects a title that is non-conforming or whose id does not
      resolve. There are no exemptions: the interim legacy gh-issue-lane
      carve-out was removed the day it was recorded (2026-07-25) once that queue
      drained and GitHub issues were confirmed disabled, and bot-authored PRs
      were never exempt. A new PR with no backing node is a defect, not an
      exception — this is the execution-surface expression of the
      sole-issue-tracker condition, and it binds at open time going forward,
      never retroactively"
    - "the owned dispatch machinery's maintenance burden stays inside a band the
      author declares — read as the open machinery-defect population serving
      this strategy together with the share of executed tactics that are
      machinery fixes rather than product work. A burden growing without bound
      is this condition FAILING (which parks the strategy for an author
      decision), not merely more work to do. Recorded 2026-07-28 as the adopted
      half of the alignment-of-attachments steelman. (ARMED 2026-08-05 /align
      interview — this condition no longer reads as not-yet-armed.) The declared
      band: the open machinery-defect population — open (phase set, not done)
      plus born-parked tactics serving this strategy — stays at or below 35% of
      all tactics serving this strategy, and is non-increasing across
      consecutive samples derived from intentions/ git history at read time.
      Measured at arming: 59 of 197 = 30.0% (the 2026-08-04 baseline was 62 of
      178 = 34.8%). A ratio rather than an absolute ceiling, so legitimate
      growth in the strategy's tactic population cannot trip it — only backlog
      growing faster than the strategy itself does. (AMENDED 2026-08-28, author
      sitting; ruling recorded in commit 751982b0 and indexed in
      plans/dispatch-rsi-author-rulings.md.) THE BAND IS IN BREACH AND THE
      BREACH IS ACCEPTED: disposition (c), ACCEPT THE BREACH WITH REMEDIATION.
      The 35% ceiling is KEPT as the target and is NOT re-declared —
      re-affirming it as a halt, and re-baselining it against the grown
      population, were both considered and declined (the first keeps 82 parked
      nodes parked for the whole window; the second re-baselines on the same
      pooled denominator the charter-split ruling has just declared unfit).
      Re-measured at the sitting over `git archive origin/main intentions`
      through classifyTactic and strategyBacklogBand: 135 of 316 = 42.72%. The
      CEILING limb fails decisively. The NON-INCREASING limb is WITHDRAWN as a
      ground: the series read 43.67% at 76abc77a and 44.30% at a5ddeca1 and is
      42.72% now at the same denominator of 316, so the numerator genuinely fell
      and the monotonic rise is broken — the machine reading's \"(increasing)\"
      verdict is computed over a 28-day sampling window and does not overturn
      this. THE REMEDIATION IS THE DRAIN PLAN, which already exists and is not
      newly authored: the serialized 13-position batch assigns 117 tactics, none
      twice, plus 11 deliberately unassigned and 13 absorbed by the overhang
      retirement; the charter split ruled in the same sitting is the structural
      remediation behind it. CONSEQUENCE FOR A DRIFT REVIEW, stated so it is not
      re-derived: while the drain plan is in force this condition READS AS
      HOLDING. A measured breach of the 35% target is NOT this condition failing
      and is NOT grounds for a Side-A park — the author has already made the
      decision the FAILING clause above exists to route to them, and re-parking
      on it adds one to the very numerator the condition measures. UN-PARK
      CRITERION, stated as a rule rather than an enumeration because any
      hand-list goes stale immediately: every node parked SOLELY on the
      maintenance-burden band breach is un-parked on the drain plan. A node
      carrying a second, still-open blocker is NOT un-parked by this."
    - an author-lane post-merge verification node carries, AT BIRTH, everything
      a fresh office-hours sitting needs — office_hours.reason,
      office_hours.recommendation, and the verification item's url_path /
      expected_outcome / finding — because a born-parked node otherwise shifts
      this strategy's park-context failure earlier rather than removing it; this
      is the standing park-recommendation condition applied at creation time
      instead of at park time
    - "the machine-verifiable / author-required sort is an explicitly recorded
      state on the verification node, never inferred from whether office_hours
      happens to be set — office_hours is cleared when the author drains the
      item, which would erase the very mark the mis-sort measurement reads; this
      extends strategy-verified-requirements' recorded condition that
      not-machine-verifiable is an explicit recorded state, never a silent
      omission — AMENDED 2026-07-31 (/align-strategy): the explicitly recorded
      state is the existing required-core `owner` field (`owner: ai` =
      machine-verifiable, `owner: human` = author-required), not a new field and
      not office_hours; clear-park does not touch `owner`, so the mark survives
      the drain that erases office_hours. While source-node `## needs-main
      residue` body sections remain live, a mixed-class source node instead
      carries a per-item `Verifiability:` sub-line (MACHINE|AUTHOR|WAIT) on each
      residue bullet, a convention that retires with that section."
    - "the pace-exempt marked set stays small enough that filling the worker
      ceiling from it is a deliberate choice rather than the default operating
      mode. Recorded 2026-07-31 as the adopted containment for the blast-radius
      steelman diverged from in the fleet-scheduling exception-lanes
      clarification of that date: pace_exempt now lifts the pace gate to the
      full max_concurrent_workers headroom, so once the weekly curve closes the
      marking discipline is the ONLY remaining throttle on spend, and an
      over-marked set costs the whole ceiling indefinitely rather than a single
      worker. A marked set growing without bound is this condition FAILING
      (which parks the strategy for an author decision), not merely more work in
      flight. No set-size value is declared yet, so until the author declares
      one this condition reads as not-yet-armed rather than as holding — the
      same posture as the maintenance-burden band condition."
    - "concurrent sessions on a single node are an invalid state, never a
      tolerated race — they are detected by the fleet-health watcher rather than
      by guards embedded in phase skills, every dispatch launch path refuses a
      node already covered by the claimed set, and a detected duplicate is
      resolved node-scoped without halting the fleet: stop the newer session
      unless it is the only healthy one, declare and reap it rather than leaving
      it undeclared, capture rather than discard its uncommitted work in the
      shared worktree, and track the root cause as a structural fix (Recorded
      2026-08-05)"
    - invalid-state detection and mechanical resolution stay in owned script
      code with no per-node model spend — only the escalation tier may cost a
      model session — and each invalid-state kind carries its own intervention
      skill rather than one skill body branching across kinds (Recorded
      2026-08-05)
    - "graph operations available to sessions — retrieval and query, node
      editing, and concurrency control — run through owned, offline-testable
      primitives rather than hand-rolled shell, and every operation the doctrine
      mandates has a scripted path: a read the doctrine requires at origin/main
      with no CLI able to perform it is a tooling defect, not a
      session-discipline problem. Round-trip count is a first-class cost
      alongside per-call bytes. This is a FLOOR, not a ceiling — ad-hoc shell
      stays available for genuinely novel graph questions, so the recovery path
      virtue-progressive-detachment protects stays open (Recorded 2026-08-11)"
    - /dispatch-ladder's driver decides nothing — it may SEQUENCE the phase
      ladder, never gate it. Every rule about when a node may run stays in
      graph-select-target, and any such rule appearing in the driver or in its
      advance/await primitives is in the wrong file. This is the re-scoped form
      of the 'two scripts decide nothing' invariant, extended to the driver that
      calls them, and it is the thing to check every future edit against.
    - node mutual exclusion on the /dispatch-ladder path stays the claim
      primitive — advance's exit 13, worktree-as-claim and the reservation
      marker. A systemd unit name may dedup identical launches as a convenience,
      but it is never the authority on whether a node is held, so detaching the
      run introduces no second detection mechanism beside the claim.
    - "/dispatch-ladder throws always halt, never resolve — advance/await exits
      11, 12 and 14 stop the run unconditionally, with no retry, no auto-park
      and no resume without a person. This is what preserves attendedness once
      the run is detached from the calling session: the waiting detaches, the
      judgment does not."
    - AI sequencing on the /dispatch-ladder path stays at zero — no model turn
      may be required to advance the ladder between phases. A change that
      reintroduces one (a re-invoke, a poll the model must perform, a branch the
      model must judge) is a regression against this requirement, not an
      implementation detail.
    - "an environmental failure — the managed dispatch daemon dying, restarting,
      or rolling to a new version — is never an invalid state: its orphaned
      sessions are not routed to the invalid-state lane by any surface (neither
      the tick's sweeps nor /dispatch-ladder), orphaned background sessions are
      deliberately NOT proactively adopted when a new daemon generation starts,
      and recovery is the author's by restart — signalled by the fleet's
      daemon-degraded alarm, which carries the list of nodes and ladder runs the
      outage stalled (Recorded 2026-08-13)"
    - /dispatch-ladder remains invocable independently of the scheduled dispatch
      tick and its pause sentinel — the recovery path for a node stranded
      post-merge is invoking /dispatch-ladder directly on it, so a paused fleet
      must never be the only actor that can carry a merged node to terminal
    - "a binding ruling recorded only in plan prose or in a commit message has
      not been recorded: the NODE BODY is the authority, and a clean session
      handed the node bodies alone builds the un-ruled design. Every author
      ruling is folded onto the node it governs — with its own dated provenance
      clause — in the same window it is made, and each transcription is listed
      with its exact wording for the author to confirm or overturn. The flag
      list is not optional: the acknowledged risk is that a plan sentence which
      was an EXECUTOR DRAFT rather than an author ruling gets canonized by the
      transcription, so an unsourced 'ruled' is struck rather than transcribed.
      (Recorded 2026-08-29 as author Ruling 5; see
      plans/dispatch-rsi-author-rulings.md, which is the index and audit trail
      and never the authority.)"
---

# Dispatch runs on the graph — orchestration state lives in intention nodes, worked through the align skill family

## Router Mechanism

This section holds the settled router and graph-mechanism rules moved down out of
the clarification history, per the body-function rule for strategy nodes
(intentions/kind-strategy.md, 2026-07-09): a strategy's body carries the design
document, and clarifications that have hardened into current mechanism belong in
prose organized by topic rather than as a running interview log. Each subsection
below states the current rule and folds the clarification entries that produced
it; the compressed `clarifications:` entries point here.

### Phase Transitions & Fix State

> **Target state (recorded 2026-07-28 /align-strategy, record-time main-qa
> routing).** The `→ main-qa` step below describes the ladder as `forwardPhase`
> implements it TODAY, and stays accurate until
> `tactic-mainqa-record-time-routing` lands. Target: the SOURCE tactic's ladder
> ends `review → done`, and `main-qa` is reached only by a standalone
> `tactic-mainqa-*` verification node BORN at that phase by the qa phase, with
> its queue fixed at birth (`office_hours` null → dispatch, set → office-hours).
> The `## needs-main residue` body section on the source is retired with it.
> `forwardPhase` remains the single home of phase routing (entry 111).

**Fix is orthogonal execution state, not a phase.** Current rule (from the
2026-07-18 encoding decision, entry 66): fix is a nullable orthogonal
`execution.fix = {since, attempt, pushed_sha}`, not a value of `phase`. `phase`
stays purely ladder-positional — implement → qa → review → main-qa → done — and
is never overwritten by a CI failure, so entering a fix no longer destroys ladder
position. The selector reads `execution.fix` directly: set (or a live red-CI
verdict) → dispatch fix-checks; otherwise → the phase worker for the preserved
phase. `execution.fix` also carries the pending-CI concurrency guard across ticks
when no session is live — the window between a fix worker pushing and CI
re-reporting — so a not-yet-green re-run is not misread as "resume the phase
worker." The one deliberate backward edge is a correctness move: when a fix
pushes code after review has completed (reviewed / merge-armed / main-qa), the
fix worker resets `phase → review` and disarms auto-merge, because new code must
be re-reviewed. Doctrine is preserved unchanged — fix remains a CI interrupt, and
unreviewed code must never reach merge after a fix; only the encoding changes. The
attention ordinal therefore drops fix: draft < align-tactics < implement < qa <
review < main-qa < done. Migration is backwards-incompatible (dropping the fix
enum value breaks any node at `phase:fix`) and sequenced — additive schema →
dual-read transitions/selector → one-time migration of live `phase:fix` nodes to
(preserved phase + `execution.fix` set) → remove fix from the Phase enum and
delete `fixInterrupt`/`resumeAfterFix`; the executable clean-session units live in
tactic-fix-interrupt-orthogonal-state.

History of this rule: entry 18 (2026-07-04) established fix as the CI-failure
interrupt — a tactic enters fix from any of implement, qa, or review when its
PR's CI verdict is failing and resumes the ladder once CI is green, distinct from
qa-fix and review-fix's own internal content-repair loops — but originally modeled
it as a phase value. Entry 22 (2026-07-04) added `main-qa` as a phase between merge
and done (post-merge needs-main residue lives in a body section of the node, not a
follow-up issue) and set the attention-ranking ladder, which then still listed fix.
Entry 52 (2026-07-11) made frozen tactics selectable and defined the tie-break
ordinal (ties break toward the more-progressed node), an ordinal that then still
listed fix. Entry 64 (2026-07-18) established that the `reviewed` marker terminates
review-worker candidacy and specified the interim red-CI marker-clear that made a
node re-enter review after fix → qa. Entry 66 supersedes the encoding for all of
them: `phase` is never overwritten by fix, every ordinal list drops fix, and the
marker-clear re-review is replaced by the direct `phase → review` reset plus
auto-merge disarm above.

**Re-alignment eligibility anchors on `rounds.last_aligned`.** Current rule (from
2026-07-16, entry 61): for a strategy whose signal is validated only by human work
(e.g. owner review at office-hours), /align-tactics re-eligibility keys off a
distinct `rounds.last_aligned` timestamp — stamped when an /align-tactics round
lands its tactics — rather than `rounds.last_completed`. Re-select for a further
round only when the strategy's reading is newer than `last_aligned` (a null
`last_aligned`, meaning never aligned, still passes, preserving first rounds),
applied regardless of count. This is needed because a round whose deliverable is
born-parked reading plus off-path tooling never prunes a child, so
`rounds.last_completed`/`rounds.count` never advance and the older gate never
fires — the strategy would be perpetually align-eligible. It supersedes only the
ANCHOR field of the earlier fresh-reading gate: `last_completed` keeps its
verified-in-prod meaning (entry 22), and the `count >= 2` hard cap still belongs
to entry 3. Implementation: tactic-graph-eligibility-last-aligned. History: entry 3
(2026-07-03) established the fresh-reading gate plus the two-round cap that stops
/align-tactics from burning rounds forever on an unvalidated signal, originally
anchored on `rounds.last_completed`; a null reading counts as not-validated, and a
strategy that cannot be measured must first buy its own instrument.

The following rules are settled and stand on their own:

Persisted `phase` is the state machine (Recorded 2026-07-03 interview, entry 1).
A tactic node stores an explicit `phase` field the router transitions; PR draft
state and CI are demoted from ground truth to sensors the router reads before
committing a transition. This deliberately reverses the gh-era router's "no
persisted state machine" principle — the graph is the state machine now.
Out-of-band gh events (a hand-merged PR) are absorbed by a reconciler sweep, not
by re-derivation.

Bootstrap-transition doctrine (Recorded 2026-07-03 from author review, entry 15).
Until tactic-graph-router-transitions and tactic-graph-commit are live, every
session completing a phase on a graph-native tactic must itself end the phase with
the transition write to origin/main — `phase` (advancing the ladder against the
CI-verdict and mergeability sensors, with the CI-fix interrupt handled orthogonally
per the fix-state rule above), `execution.pr` when the work PR opens, attempt
counters, and markers. Selection reads main, so a phase that ends without the write
schedules nothing. The write is a state-only `intentions/` commit, never part of
the work PR (the work PR merges at the end of the lifecycle; state must land on
main while it is still open); fields ride squatted `attributes.*` until
tactic-graph-dispatch-schema is on main. The doctrine retires when the transitions
tactic lands.

`execution.pr` stamps at the implement→qa write itself (Recorded 2026-07-10
interview, entry 48). Confirmed load-bearing at fleet scale: on tick +3 six nodes
reached qa with `execution.pr` null while an open draft PR existed, and each qa
worker had to backfill the stamp before it could key its CI-verdict and
mergeability sensors off the PR. The delivered transition writer must stamp
`execution.pr` at the implement→qa write, not at some later write; until it lands,
emulating sessions owe the stamp with the transition (bootstrap parity above).

Steady-state worker/tick split (Recorded 2026-07-11 interview, entry 53). The
phase worker — implement, qa, and review alike — marks its phase complete and does
NOT itself validate CI; the tick reconciler validates CI. Each tick reads the
node's PR CI verdict: a tick where CI is still in progress skips the node (no
forward transition, no failure — retried next tick); a green-CI tick with the node
ready performs the next transition and dispatches the next phase worker; a red-CI
tick routes to the fix interrupt. For review, the green-CI "next task" is the merge
itself: the tick auto-merges the reviewed PR without author intervention when green
CI + `mergeable==MERGEABLE` + the node's `reviewed` marker are all present, arming
once per tick under a fresh in-turn grant. This moves the merge/arm responsibility
off the transition writer and the review worker and onto the tick reconciler. It is
the steady state that the bootstrap-transition doctrine above emulates by hand, and
it retires when the router is live.

### Fingerprint & Freeze

Two fingerprint stamps keep a worker from executing scope the author has already
superseded: a strategy-substance fingerprint that soft-freezes a strategy's open
subtree when its substance is edited, and a tactic-local scope-custody stamp that
demotes a tactic whose own scope moved under it. Both began as blanket gates and
both are now materiality-scoped — an editing round pays exactly the materiality of
its change. (The CI-fix interrupt is orthogonal execution state, not part of this
machinery — see §Phase Transitions & Fix State, entry 66.)

**Strategy-substance soft freeze, materiality-scoped at the source.** Current rule
(from 2026-07-18, entries 70 and 73, scoping the 2026-07-03 soft-freeze mechanism of
entry 10): /align-tactics stamps a strategy's substance fingerprint — a hash over
statement, clarifications, conditions, serves, success_signal, and tooling_goals,
never the state fields (reading/gap/rounds/office_hours) sensors touch constantly —
on each tactic it plans, paired with the origin/main SHA the stamp was taken against
(`{hash, sha}`, so a stale child recovers the exact delta mechanically via `git diff
<sha>..origin/main -- intentions/<strategy-id>.md` rather than dated-clarification
archaeology). Materiality is decided at the source: the editing round — the one
session holding both the delta and the author — classifies each stamped open child
and re-stamps orthogonal children in the SAME graph-commit as the edit, so a freeze
never fires for a child the edit does not affect. A materially affected child is left
stale and freezes: the router stops new selections in that subtree, lets in-flight
phases finish their current phase, and re-evaluates the child at its own rank (a
dispatchable `/align-tactics <tactic-id>` session per entry 52's frozen-tactic
dispatch, highest-ranked stale child first) to amend, prune, or confirm and re-stamp.
/align-strategy's record-time step-5 soft-freeze warning becomes this
classify-and-re-stamp step. The rank-gate rival (freeze a stale child only when the
staling change out-ranks it) is rejected: rank is not a proxy for materiality — a
low-rank edit can still invalidate a high-rank child's plan — and rank incorporation
instead rides existing machinery (re-evaluation competes at the child's own rank, and
a must-land-first migration carrier acquires blocked_by edges whose backward
attention-compounding boosts it in proportion to what it blocks).

The same materiality principle extends to the tactic scope-custody stamp of the chain
below (entry 73): an author-present align round (/align-strategy or /align-tactics)
that classifies its own tactic-body edit as scope-inert re-stamps the worktree-local
`.claude/worktrees/<id>.scope-fingerprint` file to the post-edit fingerprint plus the
current origin/main SHA in the same round, recording the classification in the round's
record — mirroring the transition writer's machinery refresh rather than moving the
stamp into the node. This closes the seam in the chain-of-custody rule (entry 39)
between its intent ("if the re-evaluation confirms without amending, nothing re-runs")
and its mechanism (recording that confirmation is itself a body edit that would trip
the scope fingerprint and demote): a doctrine-mandated reconciliation note (entry 38)
no longer demotes a green, fully-reviewed node. Classification is fail-closed — only a
confident scope-inert verdict re-stamps; any doubt leaves the stamp untouched and
custody demotes as recorded, and phase workers, qa/review sessions, and the tick never
re-stamp. The net guarantee is unchanged: merge still requires an unbroken
implement → qa → review chain against the merge-time scope fingerprint — a re-stamp
asserts, under author presence, that the post-edit fingerprint IS that same scope.

**Correction (2026-07-25, entries 102–103): the machinery refresh this rule mirrors
is itself defective, and the net guarantee above is not currently enforced.**
`transition-node` calls `refresh_stamp` AFTER `graph-commit` (transition-node:178-183),
and `graph-commit`'s cleanup does `git reset --hard $ORIG_HEAD` (graph-commit:301-303)
to restore the far-ahead PR-branch tip it moved off to land an intentions/-only SHA —
so `refresh_stamp` hashes the REVERTED worktree body and stamps the pre-edit
fingerprint. It fires on every node-lane phase worker and is inert only in the main
checkout. The rule above ("phase workers, qa/review sessions, and the tick never
re-stamp") still stands as written; what is falsified is the premise that the machinery
refresh made that safe. Two consequences follow. First, /qa-fix's own `## needs-main
residue` body append lands in the same graph-commit as the qa → review transition, so
the next scope sweep reads stamp ≠ origin/main as drift and demotes the node, wiping
`execution.markers` and discarding completed QA custody — 33 of 37 demotions since
2026-07-05 hit nodes already at qa or review. Second, the surviving phase-log makes a
re-entry session read the wipe as "a prior session died before the terminal transition"
and ratify QA it never ran, so the chain is REPORTED unbroken while actually broken.
Carriers: tactic-transition-node-stamp-landed-body (repair the refresh),
tactic-scope-fingerprint-plan-substance (greenfield — fingerprint plan substance only,
so no machinery write can trip custody by construction), and
tactic-phase-evidence-fingerprint-bound (bind completion evidence to the fingerprint it
was produced under, which is what makes a GENUINE drift safe). Until those land, treat
the net guarantee as an intent, not an enforced invariant.

Ratified 2026-07-30 at an author office-hours sitting (entry 142): entries 102-103
stand as recorded, and the guarantee they restore is PROSPECTIVE per entry 104 —
evidence carrying no bound fingerprint reads as unbound, not mismatched, so the window
closes as the in-flight tactics cycle rather than by a corpus-wide forced re-QA. The
same sitting reordered the carriers so the immediate repair
(tactic-transition-node-stamp-landed-body) is sequenced AHEAD OF the greenfield target
(tactic-scope-fingerprint-plan-substance).

Migration is backwards-incompatible for stamp readers and sequenced (schema accepts
`string | {hash, sha}` → new stamps write the map form → bare-hash stamps migrate
opportunistically at each re-stamp → drop the bare-string form); the executable units
live in draft tactic-materiality-scoped-freeze, and the tactic-stamp re-stamp carrier
(script plus align-skill step) in draft tactic-scope-inert-restamp-primitive.

History: entry 10 (2026-07-03) established the soft freeze detected by a substance
fingerprint stamped per tactic, with any mismatch freezing the whole subtree; a
2026-07-11 amendment made the queued re-evaluation dispatchable at tactic granularity
(entry 52) rather than only as a strategy-level round. Entry 70 (2026-07-18) replaced
the blanket freeze with materiality scoping and widened the stamp from a bare hash to
`{hash, sha}`. Entry 73 (2026-07-18) extended the same materiality principle to the
tactic-local scope-custody stamp.

**Tactic scope-custody chain — a pre-merge phase runs only against the scope the
previous phase ran against.** Current rule (from 2026-07-06, entry 39, superseding
entries 34 and 36): two gates bracket every worker with no mid-run polling — a start
gate (the provisioning prelude re-validates the node against fresh origin/main: still
exists, persisted phase equals the selected phase, office_hours null, serving
strategy's substance fingerprint unchanged where stamped; a mismatch is a distinct
exit code that reports skipped and yields to the freeze) and a write gate (the
transition-time fingerprint check). Each phase records a tactic scope fingerprint — a
hash over statement plus node body, never frontmatter state fields (so
attempts/markers/residue/park writes cannot trip it), saved in a worktree-local file
beside the origin/main SHA it was read against, never a per-launch graph write. The
chain-of-custody rule: a pre-merge phase beyond implement (fix/qa/review) may run only
against the exact scope the previous phase ran against — the worker-start gate
compares the current fingerprint against the stamp the previous phase left before
overwriting it (implement skips the comparison; it always takes the latest scope and
re-establishes custody; main-qa is post-merge and validates against current intent by
design). Staleness at either gate writes the one owned backward transition, `phase :=
implement` — never a hold — so the re-selected implement worker roots in the same
worktree, reads the current node body as the whole target state, implements only the
delta, and qa and review re-run in order on fresh reads. Net guarantee: merge requires
an unbroken implement → qa → review chain all executed against the merge-time scope
fingerprint. Machinery body writes cannot break the chain — the transition writer
refreshes the stamp to the post-write fingerprint of the node it just committed, so
residue-section appends are harmless, leaving only author and re-evaluation edits able
to demote (and, per the scope-inert re-stamp above, not even a classified-inert author
annotation). The demoting writer names the absorbed range — `git log
<stamped-sha>..origin/main -- intentions/<id>.md` — in its commit message and on the
node's PR. A cascading strategy edit reaches this gate through the soft freeze above:
the strategy fingerprint holds transitions and queues re-evaluation; if that
re-evaluation amends the tactic's scope, the amendment trips the scope chain and
demotes; if it confirms without amending, nothing re-runs. Implementation:
tactic-graph-router-transitions Unit 1 (transition-time gate) and draft
tactic-worker-start-revalidation (start gate). A later timing change (entry 62) moves
the primary scope-staleness comparison ahead of selection into the tick's disposition
sweep, leaving the worker-start gate as the safety re-check; that folding lives in
§Execution Substrate.

History: entry 34 (2026-07-06) recorded the mid-flight-edit rule — an author edit to a
claimed tactic's scope lands freely mid-phase, the in-flight phase finishes against
the scope it started with, and "its transition write stands" (park-to-interrupt the
author's only stop lever). Entry 36 (same day) superseded that "transition write
stands" clause with the tactic-scope fingerprint gate: on mismatch, no forward
transition is written and no merge armed — the tactic held at its completed phase and
the next tick re-ran that one phase. Entry 39 (same day) superseded entry 36's "hold
and re-run the held phase" clause with the chain of custody above: staleness demotes
to `phase: implement` and forces the full implement → qa → review re-run, because
otherwise an edit landing after qa's fresh read could reach merge with only review
re-run — the new scope never receiving qa's independent user-acceptance validation.

**Known defect: freeze re-surface over-sweeps the subtree.** When a freeze
legitimately fires, suppression and re-surface still take the WHOLE open subtree into
`frozenTacticIds`, not just the stale-stamped children — so a null-stamped child a
sibling's staleness says nothing about can be swept into a re-evaluation and find no
work to do (observed 2026-07-18, entry 75: the top-ranked unclaimed child was
dispatched to /align-tactics and its session read a stale worktree and concluded no
work existed). This is a defect, not deliberate subtree-conservatism — the editing
round's per-child classification is the authority on who is affected, and a blanket
sweep re-litigates it. The fix (narrow both `frozenTacticIds` uses to stale-stamped
children only) is tracked in draft tactic-freeze-resurface-stale-children-only.

### Worktree Claiming & Liveness

**Claude Code native worktrees are the execution substrate for every worker.**
Current rule (from 2026-07-05, entry 23, superseding the mechanism half of entry
12): main is checked out at the project root, and every worker worktree is a
Claude Code-managed worktree at the harness default location,
`<project-root>/.claude/worktrees/<node-id>` — entered via `EnterWorktree` in
sessions, and provisioned by launch scripts as a plain `git worktree add` into
that same path. No graph-native machinery may assume the legacy layout: the
`.bare` shared common dir and the sibling `worktrees/` container persist only as
backward compatibility for the draining gh lane, and the WorktreeCreate hook's
git-common-dir anchoring, `<issue-num>-<slug>`-only name validation, and gh
identity stub are legacy-lane conventions that retire with it
(tactic-legacy-router-removal). The isolation commitment itself is unchanged
from when it was first recorded: one worktree per node id, liveness detected as
live session ⇔ worktree — only the substrate under that commitment changed.
History: entry 12 (2026-07-03) originally committed this one-worktree-per-tactic
isolation to the legacy `worktree-create.sh` hook and node-id naming under the
`.bare` + sibling `worktrees/` layout; entry 23 (2026-07-05) retired that
mechanism in favor of native worktrees while keeping the isolation rule itself.

**Physical `.bare` retirement — the harness-default claim corrected (amended
2026-07-21).** The "harness default location, entered via `EnterWorktree`" claim
above was aspirational: it holds only after the repo is de-bared. Under the
current bare-repo layout the harness keys the project on the git-common-dir
(`.bare`), so its actual managed worktree root is `<.bare>/.claude/worktrees/`,
while graph worktrees are provisioned at `<main-checkout>/.claude/worktrees/`.
The two diverge, so `EnterWorktree(path=…)` into a graph worktree is rejected as
"outside .claude/worktrees/" and prompts for a permission-root relocation
(harmless — approval relocates correctly). Descoping `.bare` from scripts does
not fix this. The greenfield therefore physically retires the bare-repo layout:
main becomes the standard git working root with `.git` inside it, and Claude
Code native worktrees under `<repo>/.claude/worktrees/` are the only worktree
surface — no `.bare` common dir, no sibling `worktrees/`. This widens
`tactic-legacy-router-removal`'s target (the legacy-lane hook conventions) to
include the physical layout itself, tracked as `tactic-retire-bare-layout`. gh
issues are now structurally disabled (`hasIssuesEnabled: false`), so the drain
gate is satisfied; gh pull requests remain the code-review/merge substrate by
design. Executed as a direct-to-main in-session hotfix under a manual fleet
quiesce, bypassing dispatch (see the 2026-07-21 clarifications).

**Uniform node-id claiming ledger covers both tactic and strategy sessions.**
(Entry 13, 2026-07-03 interview.) Concurrency is a first-class requirement, not
an inherited detail: the router runs up to the paced worker target in parallel
across eligible non-parked nodes of both kinds — tactic phase sessions and
strategy /align-tactics sessions. Claiming and isolation are uniform by node id:
every launched worker enters the one claimed set / reservation ledger under its
node id — strategy ids included, so an in-flight /align-tactics session claims
its strategy and closes the duplicate-spawn window while its tactics have not
yet landed on origin/main — and runs in a worktree keyed by that id, giving
liveness detection (live session ⇔ worktree) one rule for both kinds. Write
safety stays the single-node rebase-retry commit path.

**Human/interactive sessions join the same ledger; a base-version write check
makes read-freshness mechanical.** (Entry 29, 2026-07-06 interview.) Interactive
and human-invoked bg align sessions enter the same node-id reservation ledger as
router workers and author in worktrees, never the shared main checkout — the
ledger is uniform across launch modes. The editing flow records the origin/main
blob each node was read at, and graph-commit refuses a write whose base is
stale, making read-freshness mechanical rather than session discipline
(motivating near-miss: a stale dump of tactic-graph-commit-hardening nearly
clobbered its live `phase: qa` state). Semantic drift across different files has
no lock; the periodic /align-strategy improvement pass is the reconciler, and a
doctrine-recording session pauses the pace curve for its audit window. (Amended
2026-07-13: the failing-closed clause and the uniform claiming ledger are
narrowed — claiming is scheduling-dedup only and never blocks an edit; same-node
conflict resolves automatically, parking only true conflicts — see the
automatic-serialization clarification of that date.)

**Dedup keys on live-session liveness only, never worktree existence; reaping
is decoupled post-merge hygiene.** (Entry 72, 2026-07-18 interview.) The dedup /
claimed-set keys on liveness: a node is skipped only when a reservation-ledger
marker named by its id exists OR `worktree_has_live_session` reports a live
node-id-named session (`claude agents --json`) — never on worktree existence. A
bare or un-reaped `.claude/worktrees/<node-id>` whose session has ended does NOT
block selection (the #1474 change moved existence-keying to liveness-keying
precisely so an unreaped worktree cannot block the next worker). Worktree
reaping is decoupled post-merge disk hygiene — dispatch-sweep removes a worktree
after its PR merges and the tree is in-sync, guarding on
`worktree_has_live_session` first — never a selection gate; what makes a node's
next phase selectable is the transition write flipping phase on origin/main plus
the prior session ending (its claim clears). The office-hours lane shares this
exact mechanism: it runs in the node-id worktree for its session's life so its
live session is detectable, and that worktree is reaped like any worker's since
office-hours lands no commit; office-hours-select gains the same liveness dedup
so an untargeted (queue-head) launch skips a parked node that already has a live
office-hours session and returns the next-ranking parked node; an explicit
`/office-hours <node-id>` targeting a node with a live office-hours session
returns an error — a deliberate human target on an occupied node is a collision
to surface, not a silent fall-through. Consistency correction:
tactic-align-session-claiming's Unit 3 recorded prescription — "graph-select-target
treats ANY existing `.claude/worktrees/<node-id>` as a held claim"
(existence-keyed) — is superseded by this liveness mechanism (#1474),
contradicts its own Unit 1 (which states the liveness rule), and describes the
pre-#1474 worktree-walk that was deliberately replaced; the shipped code is
already liveness-keyed, only the recorded tactic text is stale (tracked by
draft tactic-align-session-claiming-liveness-correction).

**Subagent cwd is pinned to the primary checkout by the Agent tool — fixed by
passing the absolute worktree root plus a contamination guard.** (Entry 77,
2026-07-19 interview.) The Agent tool pins a spawned subagent's cwd at launch to
the primary checkout, not the launching worktree, so a subagent that writes via
a relative path silently lands its edits in the primary checkout while the
worktree keeps a clean git status — the entire unit is lost with no error
(observed live 2026-07-19 in Unit 1 of tactic-otel-sensor-substrate: the
implementation subagent wrote `otel-trial-notes.md` into the primary checkout's
`.claude/skills/`, requiring manual detection and relocation). The
subagent-worker execution contract therefore carries an implicit invariant it
does not enforce: subagents operate on the launching worktree, not the primary
checkout. The fix is prevention plus a backstop — the implementation-subagent
prompt contract passes the absolute worktree root and mandates absolute paths
under it, and /implement-unit adds a post-subagent contamination guard that
fails loudly when a subagent's writes land outside the worktree (tracked as
tactic-subagent-cwd-worktree-guard). This is distinct from the
primary-checkout-on-main invariant (tactic-primary-checkout-main-guard): that
keeps the primary checkout ON main; this keeps subagent WRITES OUT of it.

**The claimed set is enforced at SELECTION only, so a caller that skips
selection is unguarded — and a duplicate is an invalid state, not a race to
tolerate.** (Amended 2026-08-05 interview; extends entries 13 and 72, which
point here for the mechanism.) The claimed-set check described above lives
entirely in the SELECTOR: `graph-select-target` skips a node when
`reservation_exists` holds or `worktree_has_live_session` reports a live
node-id-named session. The launcher it feeds, `dispatch-graph-execute`, performs
no occupancy check of its own — it only HANDS OFF a claim it assumes its caller
already took (re-stamping the marker `origin=spawned` so the claim survives the
boot window, the 2026-07 spawn-window fix) and clears one outright on the
stale-selection and scope-stale dispositions. A caller that never went through
the selector therefore holds no claim and checks none, and the guard is
structurally absent in both race directions. Observed live 2026-08-05: a
park-clearing drain cleared a node's `office_hours` — which is precisely what
makes the node tick-selectable — the headless tick selected and launched it
three seconds later, and the drain's own direct `dispatch-graph-execute`
launched a second `/qa-main` into the SAME worktree nine seconds after that.
Both sessions were live, in one working tree, both able to write the graph.
Three consequences are recorded as doctrine by this round's clarifications:
detection of duplicates belongs to the fleet-health watcher rather than to any
phase skill; every launch path — not only the selector — refuses a node already
covered by the claimed set; and a detected duplicate is an invalid state
resolved node-scoped through the invalid-state lane (stop the newer session
unless it is the only healthy one, declare it so it reaps rather than freezing
the node afresh, capture rather than discard its uncommitted work in the shared
tree, and track the root cause). Note the asymmetry this closes: liveness
detection is name-keyed on the node id, which is exactly why the two sessions
shared one worktree — the isolation rule that gives each node its own tree also
guarantees that a duplicate lands two writers inside it.

### Pace, Backlog & Attention

**Deferred work stays recorded and selectable; its demotion is calculated at
read time, not stamped as a flag.** Current rule (from 2026-07-03, entry 11,
superseding the mechanism of entry 9 while keeping its principle): work off the
minimum path to validating a signal is never omitted — it lands as a
fully-planned, selectable tactic, demoted below on-path work. Entry 9 first
recorded this deferral and implemented the demotion as a manually-stamped
"backlog" flag `/align-tactics` wrote at decomposition, dropping such a node one
rank tier. Entry 11 superseded that mechanism on same-day author review: a flag
stored at plan time goes stale the moment a new signal justifies the deferred
node or competing work resolves, and a discrete band cannot absorb new attention
conditions without band arithmetic. In its place, attention is an extensible
weighted sum of terms each derived at read time by `resolveAttention`
(intentionsutil's attention module): explicit author attention (an authored
override pins absolutely; a boost is a weighted term derived terms cannot
silently overwhelm), signal satisfaction (a node is on-path iff it reaches a
`validates`-terminal of an unvalidated signal via `blocked_by`/`parent` chains,
so attention rises automatically when any new signal's path includes the node),
and capture resolution (from the `recovers` edges' divergence and
irreversibility axes). New conditions add as reviewed-PR terms with weights, and
strategy `/align-tactics` eligibility counts only on-path children — also
derived. The backlog flag is deleted: the current codebase has no such stored
field. On-path membership is computed from `validates` edges and structural
chains in `packages/intentionsutil/src/attention.ts`, and `schema.ts` states the
seed rank is derived on read and NEVER stored. Terminology note: entry 69
(2026-07-18) describes a backlog tactic as one "marked with the backlog flag
/align-tactics stamps at decomposition," which reads as if the flag still exists;
it does not. Entry 69 is using the retired entry-9 terminology as shorthand for
what is now the derived off-path (no-`validates`-edge) demotion of entry 11 — its
positional citations to clarifications 9 and 11 remain exactly correct, only the
implementing mechanism it names is historical.

**The legacy pace curve carries over unchanged; the worker ceiling is absolute
for autonomous scheduling, and only a deliberate human dispatch may exceed it —
by exactly one node.** Current rule (pace machinery from 2026-07-03, entry 14;
ceiling scoping and single-node bypass from 2026-07-18, entry 76, amending
entries 33 and 49; pace-exempt width amended 2026-07-31, entry 173). Pace parity
is full and lives outside the graph: dispatch-target-workers'
weekly cumulative pace curve stays the binary spend gate and the 5-hour linear
ramp decides how many concurrent workers (0..max_concurrent_workers); telemetry
and tunables stay operational config, since rate-limit state is machine state,
not intent. The legacy priority label maps to a first-class authored
`pace_exempt` flag on goal-layer nodes — orthogonal to attention ordering — that
lifts the pace GATE to the full `max_concurrent_workers` headroom and never past
it, without overriding the order or genuine token exhaustion (the `--exhausted`
hard floor). Entry 173 (2026-07-31) amends entry 14's original "admits one
gate-exempt worker" to this fill-to-ceiling width, and makes the rule uniform
rather than scoped to the paced-to-zero case: whenever effective-live reaches the
pace target and tokens remain, the lane admits up to
(`max_concurrent_workers` − effective_live) workers. So a queue holding only
pace-exempt items at a shut weekly curve runs the fleet at its full ceiling —
three concurrent workers at `max_concurrent_workers: 3` — and never at four.
Entry 33 fixed `max_concurrent_workers` (dispatch.config/target-workers.json,
default 8) as the one true global ceiling on dispatch-managed workers live at any
moment across all ticks, workflows, and lanes, enforced at selection so
overlapping autonomous ticks cannot compound past it. Entry 49 established that an
explicit human dispatch of a single node overrides the autonomous pace curve in
both lanes — a gate-bypass distinct from the standing `pace_exempt` flag — while
still honoring the node-id claim (it refuses a node already held rather than
force-preempting) and the `--exhausted` floor. Entry 76 amends both: a deliberate
human dispatch (bare `/dispatch` picking the highest-ranking available node, or
`dispatch <node-id>`) additionally bypasses the absolute ceiling for exactly one
node, launching it even when live == max, while fan-out WIDTH beyond that one
node still honors the ceiling. Entry 33's own text is amended in place to scope
the ceiling to *autonomously-selected* workers only — the human-launched worker
still enters the reservation ledger, so the next autonomous tick counts it and
the transient excess self-corrects. Entry 76 amends entry 33's ceiling scope
rather than fully superseding it: the ceiling remains the invariant against
autonomous runaway; only conscious, bounded human action may exceed it by one.
Amended 2026-07-29 (entry 132): `dispatch <node-id>` may SUBSTITUTE a different
node — the highest-precedence dispatchable node on the critical path to the named
one — and a substituted node INHERITS both bypasses, since the substitution is
itself the conscious human action and the exactly-one-node bound is unchanged.
Without inheritance the walk would fail precisely at the worker cap, which is when
a human reaches for it. The same entry adds a bounded CI wait on the explicit-node
lane only; the autonomous and `--manual` paths keep skipping unchanged, because
`dispatch-tick` is also the systemd entry point and must never block.

**`dispatch <node-id>` walks to the critical path rather than refusing, and waits
out in-flight CI on that lane only.** (Entry 132, 2026-07-29 interview.) The
explicit-node lane's disposition on a non-dispatchable target changes from REFUSE
to SUBSTITUTE-AND-ANNOUNCE: compute the closure of the recursive union of the
named node's `blocked_by` and its children (`parent`/`serves`), keep only members
passing every existing gate verbatim (claim-safety, `sensor_gate`, `office_hours`,
freeze), and dispatch the highest member by the SAME lexicographic (tier, rank)
precedence the rank lane already uses — printing the substitution and its reason
before launching, and refusing only when the whole closure is undispatchable. No
new ordering currency is introduced: strategy-graph-drives-dispatch already
records that a blocker's selection precedence lifts to the lexicographic max
(tier, rank) of what it blocks, so the rank lane already drains the critical path
to a hot node; this clause makes the explicit lane do targetedly what the rank
lane does globally. The CI wait is bounded by
`DISPATCH_RESERVATION_STANDALONE_TTL_S` (default 600s) rather than a constant of
its own, because selection writes the reservation marker BEFORE the wait — one
constant governs both the wait and the slot it holds, so they cannot drift apart.
(AMENDED 2026-08-30, and the sentence above is left standing as the ORIGINAL
reasoning rather than rewritten. That premise was measured FALSE at the
SELECTION-TIME surface: `graph-select-target`'s ci-pending skip returns before
any `reservation_write`, and the explicit lane invokes it without
`--standalone`, so no marker is held. It holds at the PROVISION-TIME surface
only. The clarification carrying this same reasoning was amended to OPTION (a)
— MAKE THE PREMISE TRUE, by having the selection-time wait write a PROVISIONAL
reservation claim before it waits. So the sentence above states the INTENDED
post-implementation behavior, NOT today's code. Do not cite it as a
description of current behavior.)

**A failing signal's resolution ranking is the owning node's authored boost — no
per-signal rank field.** (Entry 56, 2026-07-13 interview, author-dictated.)
Resolution work created for a failing signal attaches under the owner
(serves/parent) and inherits the owner's boost through the existing undecayed
downward attention flow; no new rank machinery is added, and an explicit
`resolution_rank` field on `success_signal` was considered and diverged from — it
would create a second ranking currency beside the attention model. The default is
no automatic elevation: a failing signal ranks wherever the owner's boost and
position put it (often near 0), deliberately low. Main-health is the one signal
whose owner carries a standing very-high boost (100), kept dominant by its
write-path guard condition.

### Serialization & Commit

**Same-node contention is serialized automatically by a five-rung resolution
ladder; the author is involved only at a true-conflict park.** Current rule (from
2026-07-13, entry 58, amending the fail-closed clause of entry 2). Every graph
edit is a single-node commit pushed directly to origin/main with a rebase-retry
loop, restricted to intentions/ paths (entry 2, 2026-07-03). Entry 2 originally
mapped a same-node race to a manual-merge park, failing closed; entry 58
supersedes that clause with the PR lane's fix-conflicts doctrine applied to node
writes — resolve mechanical conflicts autonomously, escalate only genuine
ambiguity. The ladder, in order: (1) git three-way rebase auto-merge for
non-overlapping edits; (2) a structure-aware field-level merge (frontmatter list
appends union, distinct-field edits combine); (3) a stale `--base` stops being
fatal — tooling re-reads fresh origin/main state and re-applies this writer's
field-level edit automatically; (4) surviving same-scalar-field divergence goes
to a model evaluation that attempts reconciliation, under a scope guard that lets
the model resolve only mechanical divergence on human-owned doctrine fields
(virtue/strategy/tradition/delegation statement, rationale, clarification text)
and full reconciliation on ai-owned tactic/state fields; (5) only a true conflict
— contrary author intentions the model cannot reconcile — parks to `office_hours`
with both divergent values and a recommendation. Node-id claiming narrows to
scheduling deduplication: the router still avoids spawning a duplicate worker for
a claimed node, but no session is ever blocked from *editing* a node by a claim —
write safety lives entirely at land time.

Entry 78 (2026-07-19) amends entry 58's implementation-vehicle assignment only,
not its ladder doctrine, which stands unamended. The ladder partitions across two
vehicles by what each can host: the `graph-commit` SCRIPT owns the deterministic
mechanical layers 1-3 (three-way rebase auto-merge exists today; the field-level
list-union merge and stale-base auto re-read/re-apply are net-new code, no such
helper exists in packages/intentionsutil/src, with test-graph-commit.sh
coverage), and the `dispatch-conflict` SKILL owns the model layers 4-5 (scoped
model reconciliation as a skill-thread opus subagent in the fix-conflicts
resolved/ambiguous verdict shape, plus the true-conflict park). The grounds: no
bash script in the repo performs a scoped model eval — model-resolution runs only
as SKILL.md-driven subagents — so the script cannot host layers 4-5, while
pushing layers 1-3 into the skill would hide deterministic, unit-testable merge
logic behind a model. The seam is a structured mechanical-unresolved exit state
from graph-commit (alongside landed and parked) that dispatch-conflict consumes,
and `tactic-dispatch-conflict-greenfield` is `blocked_by
tactic-graph-commit-auto-serialization` to encode the ordering.
tactic-claim-dedup-only (scheduling dedup) is orthogonal and unaffected.

**A SHA carrying the four required contexts may push directly to main via a
`graph/**` scratch-branch CI fast path.** (Entry 16, reviewed 2026-07-03,
tactic-intentions-branch-protection.) main has a single repository ruleset —
no-deletion, no-force-push, and four required status checks (acceptance,
preview-and-smoke, lint, unit-tests; non-strict) — and no pull-request
requirement, so GitHub accepts a direct push whenever the pushed SHA already
carries the four passing contexts. No settings change was made. The write path
pushes an intentions/-only commit to `graph/<node-id>`; a fast workflow
hard-fails unless the diff vs main is entirely under intentions/, runs graph
validation, and stamps the four required contexts green in about a minute; the
writer then fast-forwards the same SHA to main, rebasing and re-running on
reject. Heavy CI still guards any diff touching paths outside intentions/.

### Recovery & Session Lifecycle

**Re-selection from origin/main is the only recovery path, now fuse-bounded.**
Current rule (from 2026-07-07, entry 40). A dead tick, a parked node, a worker
that died mid-phase, or a scope change after selection is never recovered by
resuming a session — the router always re-selects from origin/main, because the
owned graph, not the harness's session machinery, is the recovery substrate.
Entries 24, 30, and 34 established this unconditional re-selection: dead ticks
recover by next-tick re-selection from origin/main; a human engages a parked node
through a NEW session recovered from the node's `office_hours` context (reason plus
a recorded best-next-steps recommendation), never by attaching to the parking
session; and a scope-or-state change after selection is caught by the fingerprint
gate (see §Fingerprint & Freeze). Entry 40 amends the unbounded reading of that
recovery — re-selection stays the only path, but two fuses written by the
reconciler sweep now bound it, each gating exactly its blast radius. The per-node
fuse increments a durable no-progress counter (an `execution.attempts` entry —
frontmatter state, never in the scope hash) whenever a claimed node's worker ends
with neither a transition write (forward or backward) nor a park; at 2 consecutive
no-progress cycles (legacy CAP=2 parity) the sweep parks that node to
`office_hours` carrying its failure history. Any successful transition resets the
counter, a start-gate skip is a correct yield rather than a strike, and the fuse is
node-local. The systemic breaker guards against a daemon crash-loop that would
false-trip every node's fuse at once: because a failing tick cannot classify
itself, classification runs in the NEXT tick's sweep before selection (sweep →
classify → gate → fan out), and when it finds correlated death — at least 3
simultaneously dead no-progress claims constituting the prior tick's selection — it
writes NO per-node strikes and instead trips the breaker, one incident tactic
written via graph-commit, born `office_hours`-parked, serving this strategy,
carrying the correlated-failure evidence and a next-steps recommendation. While an
unresolved breaker tactic exists, selection selects nothing — the only global gate.
Correlated death is also the signature of the daemon-down liveness trap, where a
dead daemon makes every claim look dead at once via the empty `claude agents` read
(see §Worktree Claiming & Liveness), so the discriminator converts exactly that
false-mass-park input into a single reviewable graph artifact. Reset is human-only
via the normal interactive un-park (auto-reset would resume the crash loop); no
`recovers` edge is added, since the fuse bounds executor-failure blast radius
without reducing executor reliance. Implementation retained as draft
tactic-router-failure-fuses.

The first-tick Workflow-script substrate decision that entry 24 also carries is a
substrate question, not a recovery one — see §Execution Substrate for its full
content; only its re-selection-recovery role is restated here.

**A self-modification drain session must explicitly dispose the park at
termination.** Current rule (from 2026-07-18, entry 65), refining — not replacing —
entry 4. Entry 4 (2026-07-03) established that parking is orthogonal queue state
cleared incidentally by any interactive-session commit that touches the parked
node's own frontmatter (the graph analog of the legacy UserPromptSubmit strip
hook), and that general rule still holds for the read-only human office-hours lane,
which drains nothing and legitimately never un-parks. But a self-modification drain
session's fix commit lands on the PR branch and never touches the node's
`office_hours` field, so nothing clears the park incidentally — the observed
park → drain → re-park → clear sequence on tactic-phase-standup-audit-lens. Entry
65 adds a drain-lane-specific terminal disposition on top of entry 4: the drain
lane must terminate with a MANDATORY explicit disposition through a single scripted
atomic primitive — `clear-park <node-id> [note]` on green CI (`office_hours → null`
landed on main via graph-commit) or a re-park via `park-node` with an updated
reason on red or blocked CI — and never leave a drained node ambiguously
still-parked. The disposition must be one scripted graph operation, the inverse of
`park-node`, not a hand-rolled read → `office_hours=null` → write → commit
sequence, precisely so it cannot be partially completed, skipped, or forgotten
between the fix push and session end. Implementation retained as draft
tactic-clear-park-primitive.

The following recovery and session-lifecycle rules are settled and stand on their
own:

Same-session `/align-tactics` during bootstrap is a safety net, never a carrier
(Recorded 2026-07-06 from author direction, entry 31). Bootstrap rounds run
`/align-tactics` in the same session as the `/align-strategy` edit, but nothing may
depend on that shared context. In the target design the soft-freeze re-evaluation
is a fresh `/align-tactics` session the router queues on a fingerprint mismatch and
the tick launches, and that session has only the graph — so `/align-strategy` owes
it a complete record: every interview decision, rationale, edge-case resolution,
and tactical byproduct lands in the graph at record time (strategy substance in the
node; tactical context as draft tactic bodies). A decomposition that cannot proceed
without unrecorded interview context is a defect of the round that produced it, the
same graph-recoverability principle that governs park writes; the
requirements-coverage check in `/align-strategy` is the skill-side discharge.
Same-session execution stays good bootstrap practice while no router exists to queue
the re-evaluation, but nothing may depend on it.

A dead worker is recovered only by re-selection, under a checkpoint-discipline
condition (Recorded 2026-07-06 interview, entry 37). When a worker dies mid-phase
(API error, session limit, system failure) while graph state and worktree survive,
neither workflow-session resume nor transcript reconstruction is used — re-selection
stays the only path. Resume is same-session-only (unavailable exactly when the tick
session is dead) and replays only completed `agent()` calls, so a mid-flight death
re-runs from scratch anyway; transcript reconstruction is negative expected value
and would make the harness's proprietary transcript format load-bearing for the
router. `recover-api-error` stays a human-invoked legacy-lane tool, never router
substrate. What a dead worker actually loses is reasoning-in-progress, bounded by
the checkpoint discipline (condition 9): phase progress whose only home is the
session is a defect, so workers flush findings to durable state at natural
boundaries — worktree commits for file work, PR comments for QA triage and review
findings as produced, node body sections for residue — and a re-selected worker,
rooting in the same node-id worktree, treats pre-existing worktree/PR state as
resume input (diff against the branch base, read prior phase comments before
redoing anything). This bounds a dead worker's redo cost to one checkpoint interval
with zero new harness coupling. Skill-side encoding retained as draft
tactic-phase-checkpoint-discipline.

Node-worker sessions are reaped from the agents list on terminal exit via a
foreground-safe self-close (Recorded 2026-07-16 interview, entry 60). Because
session persistence is already demoted — sessions are disposable executors that
live exactly as long as their one phase, session recovery is never router
substrate, and every park writes its recoverable context into the node rather than
the session — nothing durable lives in a terminated session, so `claude agents
--json` should hold only LIVE executors. The node-worker branch of the Stop hook
therefore calls the existing foreground-safe self-close primitive on terminal exit,
after the escalation-park backstop runs so the node's `office_hours` is durable
before the session is removed. Only managed background worker jobs are reaped;
interactive align and office-hours human sessions (CLAUDE_JOB_DIR-gated) are never
auto-removed. Escalations surface through the office-hours dashboard's PARKED panel
(which reads the node's `office_hours` field), so a lingering agents-list entry
would add no signal and merely re-couple observability to session persistence — the
coupling the disposable-session doctrine exists to reject. Implementation retained
as draft tactic-graph-node-session-reap. (The 2026-07-19 clarifications later made
reaping a configurable default-off escape hatch and narrowed the default to fire
only on a clean phase-transition or escalation-park — keeping a non-transitioned,
non-parked exit for debugging — see those entries for the full narrowing.)

### Review & QA Disposition

**Review findings disposition three ways — resolve-in-scope / defer / ignore —
with cost now a second resolve-in-scope trigger.** Current rule (entry 19
2026-07-04, as refined by entry 59 2026-07-13; entry 59 adds a trigger, it does not
replace the frame). Entry 19 fixed the three-way disposition, decided in the review
phase, keyed on verification × contract. Resolve in scope a finding that is
adversarially confirmed (survives the skeptic pass with a concrete failure
scenario) AND breaks the tactic's own stated contract — the deliverable its plan
claims, or the security/integrity of what the diff itself introduced ("no live
callers yet" never defers a contract violation of the delivered thing itself); the
review phase holds — no review → done — while a confirmed in-scope finding is open,
its internal content-fix loop resolving it locally before CI. Defer a real but
out-of-contract confirmed finding (a pre-existing surface the diff merely touched,
defense-in-depth where the design already fails closed) to a graph draft tactic
batched per component with finding provenance, selectable only once a later
`/align-tactics` round finalizes it. Ignore findings refuted by the skeptic pass,
unreachable scenarios, below-threshold pre-existing advisories, or fixes that would
add defensive fallbacks contrary to code-style; every disposition, refutations
included, is recorded once in the PR review comment as the audit trail. Entry 51
(2026-07-11) applied the same frame to `/code-review` and `/security-review`
themselves — the review phase trusts their built-in review-and-fix and dispositions
only the residue they do not auto-fix, through the same classify → defer → file
logic. Entry 59 refines both: cost becomes a second resolve-in-scope trigger — a
confirmed finding is resolved in scope when it EITHER breaks the contract (entry
19's original trigger, unchanged) OR is cheaper to fix than to defer, since
deferral carries real overhead (a draft-tactic body, a later finalization round, a
separate PR and its review). Only a confirmed out-of-contract finding that is
expensive to fix — a real refactor introducing new structure or a cross-cutting
change — still defers. Cost refines ONLY the resolve↔defer boundary: it never moves
a finding out of the ignore category, because fixing a non-finding is waste and a
defensive fallback violates code-style however cheap. A finding fixed in scope is
still recorded in the PR review comment, so "fixed cheaply in-PR" drops nothing.
Implementation retained as draft tactic-review-cheap-fix-disposition.

The following review and QA rules are settled and stand on their own:

QA is full independent user-acceptance validation, not a checklist re-run (Recorded
2026-07-04 from author direction, entry 20). Full parity with the legacy qa-fix
skill: merge origin/main first; author a genuine QA plan from the live context (a
triage classifying ordered items script-verifiable / needs-browser /
needs-human-judgment); validate the delivered behavior INDEPENDENTLY against the
tactic's stated intent and real data — the live store, deployed surfaces, public
seed data — never merely reproducing the implementer's claimed checks (the plan's
verify blocks are the floor, not the phase); classify residue on the four-class
axis (opus-fixable → the phase's bounded internal fix loop, needs-main → follow-up,
needs-human → office_hours park, already-satisfied → pass) and record the summary on
the PR. Precedent: PR #2752's first qa pass merely re-ran the author's checklist and
passed, while the independent pass against the real delegation records immediately
found a capture-term scoring bug (exact-match enum parsing vs the store's actual
free-text vocabulary). A bootstrap-emulating session owes these full semantics
before writing the qa → review transition; the write asserts the validation
happened, not that the checklist re-ran.

Review is the full /review-fix fan-out, and deferred findings land as graph draft
tactics (Recorded 2026-07-04 interview, entry 21). Review-phase parity binds like qa
parity: review is the full fan-out — surface-conditional finders in parallel → code
dedup → classify → adversarial verify with severity-scaled skeptics → the Opus fix
lane → disposition per the rule above, recorded in the PR review comment — not a
single-agent read-through, and never skippable. One seam is graph-native: deferred
findings land as draft tactic nodes batched per component, never gh follow-up issues
and no dispatch:review-followup label, inert until a later `/align-tactics` round
finalizes them (and that round validates the finding provenance against what
actually merged). A bootstrap-emulating session owes the full fan-out before writing
review → done; the write asserts the review ran, not that CI is green.

### Execution Substrate

**The router's launch layer is owned graph-native spawn code; the Workflow
primitive runs only inside per-phase fan-outs.** This is the settled shape after
two revisions. Selection, pacing, transitions, and claiming stay in owned
deterministic code that reads origin/main; the entries below record how the
tick's execution substrate was chosen and then corrected to Shape B.

Workflow-native tick execution was chosen for the execution layer only (Recorded
2026-07-06 interview, entry 24). The first emulated router tick ran as a
Workflow-tool script, and on greenfield terms the Workflow primitive beat the
legacy shell spawn chain for execution: schema-validated structured returns
replaced label/comment parsing and per-phase model/effort routing needed no
plumbing (12 eligible tactics fanned out, 6 draft PRs). Selection could not move
onto it — Workflow scripts have no filesystem or clock access, so eligibility,
ordering, pacing, and claiming stay in owned deterministic code reading
origin/main, and transitions stay graph-commit writes. The original design fanned
out one `agent()` per selected node from a thin tick workflow (directive mapping
strategy → /align-tactics, tactic phase → phase skill), and that fan-out was
retired in place on 2026-07-11: a Workflow-spawned subagent is not given the
Workflow tool, so a phase whose own logic is a workflow (/review-fix, /qa-fix)
could not run as the tick's nested `agent()` and parked at its Step 2 every time
(superseded by entry 50, below). The legacy spawn chain is not extended and not
kept as a fallback — it stays issue-lane-only and retires with the drain. Entry
24 also carries the dead-tick re-selection recovery semantics; that recovery role
is cross-referenced from §Recovery & Session Lifecycle, which restates it there.

The Workflow executor is bounded by a thin-script condition, not banned (Recorded
2026-07-06 interview, entry 25). To keep the proprietary, session-bound Workflow
executor from making the router itself a rented runtime against
strategy-owned-orchestration, workflow scripts stay thin composition: selection,
transition, and provisioning mechanics live in owned, offline-testable code
(intentionsutil tsx modules and primitives such as graph-commit and node-worktree
provisioning) that workflow agents invoke as single commands, and the Workflow
layer orchestrates but is never the sole home of router logic. This doubles as the
testability rule — a workflow script cannot execute without spending tokens, so
anything unit-testable lives below it — and the rented-executor capture cost is
recorded on delegation-anthropic-claude. Under Shape B (entry 50) the condition
strengthens rather than weakens: the router/launch layer no longer executes on the
Workflow primitive at all, and the executor is used only inside per-phase
fan-outs, a net reduction in rented-runtime surface reconciled on
delegation-anthropic-claude in the same commit.

The graph, not a workflow or session, is the long-horizon substrate (Recorded
2026-07-06 interview, entry 35). No kept-alive supervisor workflow or
self-rescheduling session backs long-horizon graph work: continuity is durable
state on origin/main (persisted phase, claims, plans, residue sections) re-entered
by the cron heartbeat, and dead ticks, dead workers, and dropped queues recover by
re-selection plus ledger sweep, never by resuming a session (workflow resume is
same-session-only). A kept-alive supervisor is rejected as router substrate —
session limits kill workflow subagents mid-flight (observed on both emulated
ticks), one session is a single point of failure, and it concentrates the router
into the rented executor the thin-script condition (entry 25) exists to bound. The
ban is the router-as-session, not long phases: a phase worker legitimately runs
exactly as long as its one phase under its node-id claim. This is the substrate
face of the §Recovery & Session Lifecycle doctrine, whose recovery mechanics live
there.

Shape B: an owned launch-per-phase primitive spawns each phase as its own
top-level session (Recorded 2026-07-11 interview, entry 50). Because a phase whose
own logic is a workflow (/review-fix, /qa-fix) cannot run as the tick's nested
`agent()` — a Workflow-spawned subagent is denied the Workflow tool, observed in
every park and not theorized — the launch layer is an owned graph-native
launch-per-phase primitive: it spawns each selected phase as its own top-level
session on sonnet, and that session holds the Workflow tool so the phase skill is
its own orchestrator, building its phase-specific fan-out and spawning opus
subagents only when the work calls for it (an implementation unit's Recommended
model, or an explicitly opus-instructed review such as /code-review max). The
`agent()`-per-node fan-out (`.claude/workflows/dispatch-graph-tick.js`) is retired.
No structured session return is needed — the phase writes its own transition via
graph-commit, so durable graph state is the outcome; the concurrency cap and
pacing stay in owned selection code; recovery is next-tick re-selection from
origin/main, and independent phase sessions mean a dead review session cannot kill
sibling phases. This resolves the entry-24 contradiction: entry 24 assumed
'tactic phase → phase skill' ran fine as a nested `agent()`, but /review-fix and
/qa-fix were built AS workflows requiring the Workflow tool, and the two could not
both hold.

The tick runs two ordered phases: all scriptable dispositions, then one
worker-group spawn (Recorded 2026-07-16 interview, entry 62). Scriptable non-worker
work and worker spawning never compete for the pace budget because a tick runs
phase 1 — ALL scriptable, non-worker dispositions to completion (the reconcile
sweep, scope-staleness demotes, out-of-band absorptions, parks, node reaps,
failure-fuse accounting, census births) — then phase 2, one worker-group
selection-and-spawn sized to the pace target against the state phase 1 produced.
SPAWN_N counts workers actually LAUNCHED, not selection slots a metadata write can
silently spend: the live failure was a manual tick that selected one node,
scope-stale-demoted it at launch (provision exit 13), and ended with 0 workers
though SPAWN_N=1 and headroom=5 — a phase-1 disposition had wrongly run in phase 2
and eaten the only budget slot. The fix is the timing change §Fingerprint & Freeze
forward-points to: the primary scope-staleness comparison moves ahead of selection
into the tick's disposition sweep, so a demotion is a phase-1 disposition and
phase-2 selection then spawns the demoted node at its new implement phase
(implement never re-demotes, so this terminates) or the next-ranked task. The
launch-time start gate stays as the safety re-check for state that moved AFTER the
sweep — a concurrent author/session edit between phase 1 and spawn — whose rare
skip falls to next-tick re-selection, not a routine under-fill. The contract binds
whenever SPAWN_N>0; at the pace target auto-mode selects and spawns nothing while
phase-1 dispositions still run. Implementation retained as draft
tactic-tick-scriptable-then-spawn.

### Other Settled Mechanism

The following router and graph rules are settled and stand on their own; they do
not group under the topical subsections above.

Tactic node bodies are the authoritative clean-session plan (Recorded 2026-07-03,
entry 5). The body doctrine is amended for tactics: a node body stays a cosmetic
render for virtues, strategies, and delegations, but is authoritative plan content
for a tactic — full context, path:line anchors, per-unit model tags per the
implement-unit heuristic. Plans are too long for frontmatter, and one file per node
keeps the plan and its execution state atomic under the rebase-retry write path.

Per-phase model/effort routing and transcript attribution carry over from the
legacy token economy (Recorded 2026-07-04 interview, entry 17). Beyond the pace
curve, two token-economy commitments migrate to the graph-native router. Routing
parity: the launch chain applies per-phase model and effort routing with the same
fail-closed demotable allowlist and audit-written policy file, and align-family
sessions get explicit routing. Attribution parity: every graph-native session
(align-family, router tick, tactic phase worker) stamps its node id and phase into
the transcript sidecar so the token audit gains a by-node join, without which
graph-native work lands in the audit's unattributed bucket. The durable home for
the requirements is strategy-token-economy; this records only what the migration
carries. Amended 2026-07-16: the dispatch-launched /align-tactics worker now runs a
Sonnet orchestrator delegating the decompose-to-signal judgment and per-tactic plan
authoring to an Opus subagent (the /align-strategy interview stays whole-session
Opus), and the audit-written policy file is now advisory (author-gated) rather than
auto-applied.

The greenfield-relevance gate checks each tactic against superseding non-draft
nodes at finalization (Recorded 2026-07-06 interview, entry 26). To keep work off
code the critical path deletes, a gate binds the align family: at /align-tactics
finalization, each candidate and open
tactic's subject is checked against non-draft nodes that delete or supersede it (a
raw draft never obsoletes live work). The check is per-unit — doomed units are
dropped from the plan body naming the superseding node, and only a fully-superseded
tactic demotes to draft; a tactic on doomed surface may stay selectable only as an
explicit interim-live-risk exception naming its expiry event (e.g. the gh-queue
drain).

**Amended 2026-08-14 (third /align round of that date), twice.** First, a
correction: this paragraph until now also bound the gate to "every
/align-strategy improvement pass". That surface has not existed since
2026-08-04, when `tactic-align-entrypoint-consolidation` Unit 2 deleted the
no-prompt improvement pass outright — naming this very gate in its own scope —
per the 2026-07-23 office-hours ruling that both retained engines retire
wholesale. The clause is struck rather than rewritten because there is nothing
to point it at. See the stale-surface clarification in frontmatter for the full
history and for why a gate whose only carrier is prose in one skill is a gate
that gets skipped.

Second, and consequently: the gate's substance **moves into the shared
find-or-recur write surface** (`tactic-finding-search-all-producers`), where it
runs at **node-creation time** on every creation rather than only at
`/align-tactics` finalization, and where its disposition order is
rewrite-in-place first and close-as-superseded as the backstop. The mechanics
above — per-unit doomed drops, "a raw draft never obsoletes live work", the
fully-superseded demotion, and the interim-live-risk exception — are preserved
by that move, not replaced. What is added there is the terminal disposition this
paragraph never had: an edge naming the superseding node, plus an `office_hours`
park recommending the close, with the close itself reserved as a declared
remediation. The surviving `/align-tactics` prose reduces to naming the call.
See the two-surfaces and shared-analysis clarifications recorded the same round.

Self-modifying tactics are detected at decomposition and born-parked (Recorded
2026-07-07 interview, entry 41). Scope touching agent-behavior config
(.claude/skills/**, .claude/hooks/**, settings) cannot be committed by auto-mode
workers, and self-modification is a supported, designed-for use case. Primary lane:
/align-tactics detects self-modifying scope at decomposition and encodes the tactic
born-parked (office_hours set from birth, recommendation naming the
self-modification office-hours skill) so it never launches an auto-mode worker.
Fallback lane: a tactic that slips through is attempted by the worker, which
completes all non-config work and parks on the commit denial with the branch
staged, for a mostly-automated office-hours drain where the human's only
interaction is approving the self-modification permission prompt.

Interactive-session worktrees are cut from freshly-fetched origin/main before
analysis (Recorded 2026-07-08 interview, entry 42). Every interactive
graph-reading session (/align-strategy, /align-tactics, /align-init, office-hours
review) must see origin/main state before its first analysis read — the read-side
complement to the single-write-path rebase discipline, and a distinct hazard from
content-staleness (here the graph is current but the local checkout lags it). The
2026-07-08 graph-function round hit it live, running an overlap grep against a
36-commit-behind tree and presenting superseded doctrine as current. The guarantee
is structural and non-skippable: greenfield, the interactive skills' worktree is
cut from freshly-fetched origin/main (the router's provision-node-worktree
primitive is the model) so analysis physically cannot begin on a stale tree, and a
fetch that cannot reach origin fails the session rather than proceeding on
unverified local state. Retained as tactic-align-skills-latest-graph-guard.

A bounded ancestry projection is injected read-only at session start (Recorded
2026-07-08 interview, entry 43). Every node-assigned session (tactic phase workers,
strategy /align-tactics workers, main-qa handlers, office-hours entry sessions,
interactive align sessions editing a node) receives the node plus a bounded
ancestry projection, uniformly by node id. Per ancestor on the parent + serves
chain up to virtue roots: statement, rationale, attributes.conditions,
success_signal, and attention rationale, plus the clarification questions as a
titles-only index pulled in full on demand — bounded (order-of-a-few-KB per chain)
for token-economy parity, never full clarification histories by default. Ancestry
is read-only decision context for in-scope judgment calls the plan under-determines
(review disposition needs unvalidated-signal-path membership, qa validates against
intent); the node body remains the sole work contract, and a perceived
plan-vs-ancestry conflict routes to an office_hours park, never self-expanded or
self-reduced scope. Mechanism via an owned ancestry-projection primitive at
provisioning/session Step 0, retained as draft tactic-node-ancestry-context.

The align family is records-only and /align-tactics moves to the dispatch-*
execution chain (Recorded 2026-07-09 interview, entry 45; boundary redrawn
2026-07-18 interview, entry 67). Entry 45 consolidated the interactive
persistent-layer entry point to a single /align <prompt> (folding in /align-strategy
and /align-init) and grouped /align-tactics inside that align recording family.
Entry 67 redraws the boundary at records-vs-executes: the align family is the
persistent-layer RECORDING interface (/align alone — virtues, strategies,
traditions, delegations), and a new uniform dispatch-<phase> namespace is the
EXECUTION chain (dispatch-plan, dispatch-implement, dispatch-fix, dispatch-qa,
dispatch-review, dispatch-main-qa, dispatch-conflict). Planning/decomposition is
execution, so /align-tactics becomes dispatch-plan and moves out of the align
family, and the deprecated /plan-issue is deleted (not renamed). OPEN DISCREPANCY
(verified 2026-07-19): the rename has NOT shipped — the skill directory is still
named `.claude/skills/align-tactics` and no `dispatch-plan` skill exists (only the
unrelated `dispatch-plan-finalize` script). Entry 67's boundary redraw is recorded
doctrine, not yet realized in the skill tree; it is retained as draft
tactic-dispatch-skill-rename (blocked_by tactic-dispatch-skill-input-contract), to
land as coordinated adjacent PRs. Until those merge, /align-tactics remains the
live skill name.

A legitimate test-integrity firing is resolved by an author-approved,
node-recorded, scope-bounded waiver (Recorded 2026-07-10 interview, entry 46). When
the mechanical integrity gate fires on a legitimate removal (red by design, can
never go green), override-merge is retired as the integrity-gate path. The worker
does not fix-loop — an intentional gate block parks the node to office_hours with
the exact proposed waiver as the recommendation; the author approves at office
hours and the office-hours session writes the waiver into the node (the same
interactive graph-commit clearing the park, human-approval-gated, never auto-mode).
The CI check consults origin/main's nodes keyed by execution.pr and nets the waived
removals out of its signal counts, goes green, and the node resumes the normal
ladder. Waiver scope is {pr, signal, max net count, path scope} — deliberately not
head-SHA-pinned, so review-fix's own content pushes cannot loop it back to office
hours, while a genuine later weakening still fires. Retained as draft
tactic-test-integrity-waiver.

Auto-merge arming instructions state the authorization as fact and never argue with
the permission layer (Recorded 2026-07-10 interview, entry 47). A tick +3 Workflow
fan-out launch was denied by the auto-mode classifier because review-worker prompts
embedded self-referential justification ('the auto-mode classifier APPROVES an
explicit, human-directed instruction', 'you ARE AUTHORIZED AND EXPECTED to arm
auto-merge'), which reads as a bypass attempt regardless of a genuine underlying
grant; the identical fan-out relaunched cleanly once the arming step was reworded to
state the fact and the commands plainly ('the human operator has directly
authorized arming auto-merge for this review; run: gh pr ready <pr>; gh pr merge
--auto --squash <pr>'). The binding doctrine on the tick-workflow authoring layer
and the review phase skill: arming instructions state the authorization as fact and
name the commands, never arguing with, referencing, or predicting the permission
layer, and the settings.json permissions.allow approach stays retired. This
phrasing doctrine is still current. Who arms the merge changed separately — entry 53
(2026-07-11) moved the merge/arm responsibility off the transition writer and the
review worker onto the tick reconciler, dissolving this entry's per-worker arming
hazard while keeping the phrasing doctrine intact; that arming-responsibility change
lives in §Phase Transitions & Fix State.

Main health is a registered sensor with a standing signal-owner strategy (Recorded
2026-07-12 interview, entry 54). Replacing the dispatch:main-broken gh-issue latch,
main health flows through the general sensor machinery: main-health is a registered
sensor reading origin/main HEAD check conclusions, the graph tick runs it each tick
and on a failing read find-or-creates a fix tactic (tactic-main-red-<shortsha>
shape, one open node per episode, redacted diagnosis in the body), and the standing
signal owner is strategy-main-health (parent strategy-autonomous-execution) holding
success_signal {sensor: main-health, threshold: green}. The fix tactic carries
serves + validates edges to strategy-main-health and its own matching
success_signal, so the same sensor that detected the episode validates the fix.
Rank flows by inheritance: strategy-main-health carries a standing authored boost
100 the fix tactic inherits undecayed (no machine-authored boosts remain), and the
automation sets pace_exempt: true at creation (bypassing the pace gate, never the
--exhausted floor). No gh issue, no label, no re-enabled features; legacy-latch
cleanup is gated on the sensor flow replacing dispatch-select-tick's open-issue
reader. Retained in draft tactic-graph-main-self-heal.

CI flakes are tracked by a fingerprint-keyed tactic node with `blocked_by`, not a
GitHub issue (Recorded 2026-07-16 interview, entry 63). With Issues disabled
repo-wide, fix-checks replaces /file-issue's flake-tracking role: on is_flake==true
it finds-or-creates a fingerprint-keyed tactic node (fingerprint, reproduce command,
and diagnosis in the body — the content the GH issue body used to carry) and sets
`blocked_by:[<that tactic>]` on the source tactic, with no office-hours escalation,
mirroring legacy's file + block + queue-skip flake path. The router's existing
blockersComplete gate re-surfaces the source tactic once the flake-fix tactic
reaches phase:done, so no new auto-resume mechanism is needed — only correct edge
modeling. A centralized flake registry was declined by parsimony until recurrence
shows volume. Retained as draft tactic-fix-checks-graph-native-flake-tracking.

Dispatch-phase skills split derivation from execution (Recorded 2026-07-18
interview, entry 68). Each dispatch-* skill splits derivation (node → params) from
execution (params → work): the skill core executes from explicit structured params
(testable in isolation) behind a thin front door that accepts a node id and runs a
derivation script emitting those params, replacing today's worktree-branch-name
inference. The router passes the computed params directly (it holds the node at
selection, saving the derivation round-trip); the node-id + derivation-script front
door is primarily the manual/author invocation path. /align-tactics, which already
takes an explicit node-id argument, is the model to generalize. Retained as draft
tactic-dispatch-skill-input-contract.

Backwards-incompatible migrations use a carrier tactic plus `blocked_by` edges, no
new schema (Recorded 2026-07-18 interview, entry 71). No first-class migration
structure is added — existing edges suffice. A backwards-incompatible change records
its greenfield target and ordered migration in the strategy and carries execution in
a carrier tactic: one atomic PR with ordered units in the tactic body when the
migration fits a single PR, or a parent tactic with children sequenced by
`blocked_by` edges when it spans PRs. The one real gap was the link from materially
affected in-flight tactics to the migration: the editing round adds a `blocked_by`
edge from each affected child to the carrier when the migration must land before
that child's work, which both gates selection and back-compounds attention onto the
carrier, pricing the migration by what it blocks. A first-class attributes.migration
record is declined by parsimony until a sensor needs machine-readable migration
state.

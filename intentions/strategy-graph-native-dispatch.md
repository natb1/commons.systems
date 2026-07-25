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
  matrix retained as draft content on tactic-graph-native-dispatch)."
reading: null
gap: null
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
    answer: Does the backlog band scale — and does it self-correct when the graph
      changes? — See body §Pace, Backlog & Attention for the full mechanism.
      Recorded 2026-07-03 interview.
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
      reap-scope-narrowing clarification.)"
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
      default per (d). Recorded 2026-07-19 interview."
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
      ledger fix is important but is not a red-main emergency."
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
      as draft tactic tactic-pr-title-node-id-convention."
tooling_goals:
  - kind: actuator
    statement: "/align — the single interactive entry point to the persistent layer:
      with a prompt, the recording interview (superseding /file-issue
      requirements definition; records or amends virtues, strategies,
      traditions, and delegations, retaining draft-tactic byproducts); with no
      prompt, onboarding — orientation, scripted deployment validation, and a
      walk to crafting the prompt, which the session then executes. Consolidates
      the former /align-strategy and /align-init"
  - kind: actuator
    statement: /align-tactics <strategy-id> — break a strategy into PR-sized tactic
      nodes with clean-session plans, superseding /file-issue epic structuring
      and /plan-issue
  - kind: actuator
    statement: graph-native router tick — selects by resolved rank across strategies
      and tactics in owned deterministic code, executes the tick as a thin
      workflow fan-out (one agent per selected node), transitions persisted
      phase via direct-push rebase-retry writes
  - kind: sensor
    statement: lifecycle telemetry from the store itself — phase transition history
      and round counts readable from node state
success_signal:
  observable: a tactic completes the full lifecycle — align-tactics breakdown,
    implement, qa, review, merge — with no GitHub label or issue required, and
    the legacy gh router is removed once its queue drains
  sensor: the intention store and the router's selection log
  threshold: legacy gh dispatch router deleted from the repo with the /file-issue
    and /plan-issue coverage matrix fully mapped to the align family
  is_proxy: false
attention:
  boost: 5
  override: null
  rationale: "Author-directed 2026-07-06: the graph-native dispatch router
    migration is the current focus — lift this strategy and its tactic subtree
    above derived-only ranks (derived terms cap at 2) so router selection works
    the migration first."
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
    - router failure containment holds — a worker ending a claimed node with
      neither a transition write nor a park strikes a durable no-progress
      counter and two consecutive strikes park that node to office_hours
      (node-local gate), while correlated dead claims (at least 3, constituting
      the prior tick's selection) trip a graph-recorded breaker incident tactic
      that halts all selection until a human un-parks it; no unbounded
      re-selection loop exists in either scope, and breaker state never lives
      outside the graph
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
    - "strategy-main-health's standing boost (100) stays the graph's top
      authored rank, enforced at the write path rather than by ranking logic
      (parsimony — the node is simply boosted, no specialized rank treatment):
      validate-graph/graph-commit refuses a commit that authors another boost or
      override at or above it, or that reduces it, unless the commit carries an
      explicit author override"
    - a node-worker session is auto-closed (reaped from the agents list via the
      foreground-safe self-close primitive — `claude rm`; interactive sessions
      exempt) ONLY on a clean phase-transition or an escalation-park; every
      other terminal exit — a hard crash, an error, or a
      clean-but-no-transition/no-progress exit — is KEPT (its job entry and
      node-id worktree both held) for local debugging until an operator manually
      reaps it, because such an exit was not parked to office-hours and the live
      session is its only debugging artifact (2026-07-19 reap-scope-narrowing
      clarification). Reaping a transitioned/parked session loses nothing
      durable (the transition advanced the node's phase; the park wrote
      office_hours into the node), and a transitioned/parked worker job left in
      `claude agents --json` is a defect UNLESS the default-off keep-all
      operator escape hatch (2026-07-19 configurable-auto-close clarification)
      is enabled. A kept failed session holds worktree_has_live_session TRUE, so
      its node freezes (router will not re-select; no-progress fuse will not
      count re-selections) until manual reap — accepted freeze-for-debug over
      silent auto-retry on the failure path. A minimal operator-visible count of
      held-for-debug sessions surfaces accumulation without re-coupling
      observability to session persistence (it reports only the count, never
      session content; it is not a recovery substrate or escalation channel —
      escalations still surface via the office-hours PARKED panel). Auto-close
      remains the doctrinal default for the two clean terminal states, and the
      session is never router substrate
    - paused-scheduling with manual-only dispatch is a supported STANDING
      operating mode, not a degraded or temporary state — the pause sentinel
      gates worker spawning only, never reservation-ledger reconciliation — so
      every ledger-consuming invariant (e.g. the selection-time busy+reserved
      count) must hold in it without relying on the autonomous heartbeat's
      reaper
    - "every new pull request opens with the title `<node id>: <short
      description>` — the literal node id verbatim, kind prefix included — and
      its head branch resolves to a real node in `intentions/`; the prefix is
      constructed by the opener from the node rather than hand-authored, and a
      CI guard rejects a title that is non-conforming or whose id does not
      resolve. The sole exemption is the draining legacy gh-issue lane, expiring
      when that queue drains (tactic-legacy-router-removal); bot-authored PRs
      are not exempt. A new PR with no backing node is a defect, not an
      exception — this is the execution-surface expression of the
      sole-issue-tracker condition, and it binds at open time going forward,
      never retroactively"
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

**The legacy pace curve carries over unchanged; a deliberate human dispatch
bypasses both the pace gate and — for exactly one node — the absolute worker
ceiling.** Current rule (pace machinery from 2026-07-03, entry 14; ceiling
scoping and single-node bypass from 2026-07-18, entry 76, amending entries 33 and
49). Pace parity is full and lives outside the graph: dispatch-target-workers'
weekly cumulative pace curve stays the binary spend gate and the 5-hour linear
ramp decides how many concurrent workers (0..max_concurrent_workers); telemetry
and tunables stay operational config, since rate-limit state is machine state,
not intent. The legacy priority label maps to a first-class authored
`pace_exempt` flag on goal-layer nodes — orthogonal to attention ordering — that
admits one gate-exempt worker past a paced-to-zero budget without overriding the
count, the order, or genuine token exhaustion (the `--exhausted` hard floor).
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
finalization and in every /align-strategy improvement pass, each candidate and open
tactic's subject is checked against non-draft nodes that delete or supersede it (a
raw draft never obsoletes live work). The check is per-unit — doomed units are
dropped from the plan body naming the superseding node, and only a fully-superseded
tactic demotes to draft; a tactic on doomed surface may stay selectable only as an
explicit interim-live-risk exception naming its expiry event (e.g. the gh-queue
drain).

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

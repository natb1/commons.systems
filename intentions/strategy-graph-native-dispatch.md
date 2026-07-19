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
    answer: >-
      Where does a tactic's execution state live — derived from PR/CI ground truth as today, or persisted in the node? — See body §Phase Transitions & Fix State for the full mechanism. Recorded 2026-07-03 interview.
  - question: How do concurrent sessions record graph edits safely, given a record
      must land on origin/main before it is schedulable?
    answer: "One write path: every graph edit — strategy records, tactic breakdowns,
      phase transitions, readings, parking — is a single-node commit pushed
      directly to main with a rebase-retry loop, restricted to intentions/
      paths. One file per node keeps concurrent-session conflicts rare, and a
      same-node race surfaces as a rebase conflict rather than a silent clobber.
      The strategy-substance audit that a PR checkpoint would have provided is
      supplied instead by the /align-strategy interview itself — substance is
      human-decided live, before the write. Recorded 2026-07-03 interview.
      (Amended 2026-07-13: a same-node race no longer fails closed to a
      manual-merge park — contention resolves automatically through the
      serialization ladder; see the automatic-serialization clarification of
      that date.)"
  - question: A strategy's tactics all complete but its signal is still unvalidated
      — what stops /align-tactics from burning rounds forever?
    answer: >-
      A strategy's tactics all complete but its signal is still unvalidated — what stops /align-tactics from burning rounds forever? — See body §Phase Transitions & Fix State. Recorded 2026-07-03 interview.
  - question: What replaces the dispatch:office-hours label?
    answer: A first-class parked field on goal-layer nodes (reason plus since),
      valid on strategies and tactics; the router skips parked nodes and their
      subtrees. An interactive-session commit touching the node — the graph
      analog of the UserPromptSubmit strip hook — clears it. status keeps
      meaning refinement maturity; parking is orthogonal queue state. Recorded
      2026-07-03 interview.
  - question: Where does a tactic's execution plan live, given node bodies are cosmetic?
    answer: "In the tactic node body, amending the doctrine: the body stays a
      cosmetic render for virtues, strategies, and delegations, but is
      authoritative plan content for tactics. Plans are written for a clean
      session — full context, path:line anchors, per-unit model tags per the
      implement-unit heuristic — and are too long for frontmatter; one file per
      node keeps the plan and its state atomic under the rebase-retry write
      path. Recorded 2026-07-03."
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
    answer: "Deferrals are recorded, not omitted: work off the minimum path to
      validating a signal lands as a backlog tactic — fully planned, selectable,
      demoted. The demotion is part of calculated attention: resolveAttention
      composes the authored boost/override with a derived signal-path factor,
      resolving a node one rank tier lower when it is not on any
      unvalidated-signal path. The on/off-path input is the membership
      /align-tactics stamps at decomposition (round tactics on-path, backlog
      tactics off-path via a backlog flag; a strategy is on-path while its own
      signal is unvalidated); the demotion itself derives at read time, so it
      self-corrects when signals validate. Backlog tactics, like drafts, do not
      block their strategy's /align-tactics eligibility — the rule is no
      non-draft, non-backlog child tactics. The graph-native analog of the
      enhancement label. Recorded 2026-07-03 interview. Amended 2026-07-11:
      drafts are no longer inert `/align-tactics` input only — a frozen/draft
      tactic is itself selectable for a per-node `/align-tactics <id>` session
      (see the 2026-07-11 frozen-tactic-dispatch clarification, clarification
      52). The eligibility-blocking rule stated here — a strategy is
      `/align-tactics`-eligible only with no non-draft, non-backlog on-path
      children — is unchanged; what changes is that a draft now carries a
      first-class selectable disposition rather than only being consumed by its
      strategy's round."
  - question: What happens when a strategy's substance is edited while it has open
      tactics?
    answer: "Soft freeze plus queued re-evaluation, detected by fingerprint:
      /align-tactics stamps the strategy's substance fingerprint (statement,
      clarifications, conditions, serves, success_signal, tooling_goals — never
      the state fields reading/gap/rounds/office_hours, which sensors touch
      constantly) on each tactic it plans. When the router sees a mismatch it
      stops new selections in that subtree, lets in-flight phases finish their
      current phase, and queues a re-evaluation /align-tactics session that
      amends, prunes, or confirms the open tactics and re-stamps.
      /align-strategy warns the author at record time that editing a strategy
      with open non-draft tactics queues this freeze. This session is the first
      instance: these clarifications made round 1's plans stale, and the
      re-evaluation was executed in the same change. Recorded 2026-07-03
      interview. Amended 2026-07-11: the queued re-evaluation is now
      dispatchable at tactic granularity, not only a strategy-level round — a
      soft-frozen tactic carries a ranking and is selected directly, running
      `/align-tactics <tactic-id>` to re-plan it (see the 2026-07-11
      frozen-tactic-dispatch clarification, clarification 52).
      Fingerprint-mismatch detection and the 'stop new selections in the
      subtree, let in-flight phases finish their current phase' behavior are
      unchanged; only the re-evaluation's dispatch granularity changes
      (highest-ranked soft-frozen node first, per the progression tiebreak).
      (Scoped 2026-07-18: the freeze becomes materiality-scoped at the source —
      the editing /align-strategy round, holding the delta and the author in
      hand, classifies each stamped open child and re-stamps orthogonal children
      in the same graph-commit, so a freeze fires only on materially affected
      children; each of those still re-evaluates at its own rank exactly as
      recorded here. See the materiality-scoped-freeze clarification and
      tactic-materiality-scoped-freeze.)"
  - question: Does the backlog band scale — and does it self-correct when the graph
      changes?
    answer: "No on both counts — superseded on same-day author review: the backlog
      flag was a judgment stored at plan time (stale the moment a new signal
      justifies the deferred node, or competing work resolves) and a discrete
      band cannot absorb new attention conditions without band arithmetic.
      Clarification 9's principle stands — deferrals are recorded, fully
      planned, and selectable, never omitted — but the mechanism is replaced:
      calculated attention is an extensible weighted sum of terms, each derived
      at read time. Terms: explicit author attention (an authored override pins
      absolutely; a boost is a weighted term that derived terms cannot silently
      overwhelm), signal satisfaction (structural: the tactics that validate a
      signal — produce its reading, meet its threshold — carry a factual
      validates edge; a node is on-path iff it reaches a validates-terminal of
      an unvalidated signal via blocked_by/parent chains, so attention rises
      automatically when any new signal's path includes the node), and capture
      resolution (from the recovers edges' delegation capture axes, divergence
      and irreversibility). New attention conditions add as terms with weights;
      terms and weights live in code (intentionsutil's attention module), so
      weight changes are reviewed PRs. The backlog flag is deleted; strategy
      eligibility counts only on-path children, also derived. Recorded
      2026-07-03 interview."
  - question: Does per-issue worktree isolation carry over — where does a
      graph-native tactic's worker execute?
    answer: "Yes — one worktree per tactic. When the router launches a worker for a
      tactic, it provisions a dedicated worktree keyed by the tactic's node id,
      the same isolation the legacy router gives each issue. This is the
      launch-side commitment behind worktree anchoring
      (tactic-graph-native-dispatch §3.4: <tactic-id> is the
      branch/worktree/reservation/session key) and the worktree-create.sh
      node-id naming unit (tactic-graph-router-selector unit 3). Until that unit
      lands, the hook still rejects node-id names — graph-native sessions must
      borrow a numeric anchor, which this requirement removes. Recorded
      2026-07-03 from author direction."
  - question: Can workers execute nodes concurrently — and what stops two workers
      claiming the same node?
    answer: "Concurrency is a first-class requirement, not an inherited detail: the
      router runs up to the paced worker target in parallel across eligible
      non-parked nodes of both kinds — tactic phase sessions and strategy
      /align-tactics sessions. Claiming and isolation are uniform by node id:
      every launched worker enters the one claimed set / reservation ledger
      under its node id — strategy ids included, so an in-flight /align-tactics
      session claims its strategy and closes the duplicate-spawn window while
      its tactics have not yet landed on origin/main — and runs in a worktree
      keyed by that id, giving liveness detection (live session ⇔ worktree) one
      rule for both kinds. Write safety stays the single-node rebase-retry
      commit path (clarification 2). Recorded 2026-07-03 interview."
  - question: Does the graph-native router keep the legacy pace function — and where
      does its priority override live?
    answer: "Full parity, machinery unchanged and outside the graph:
      dispatch-target-workers' weekly cumulative pace curve stays the binary
      spend gate (whether to spend) and the 5-hour linear ramp decides how many
      concurrent workers (0..max_concurrent_workers); telemetry
      (rate_limits.json) and tunables stay operational config — the graph
      records the requirement, not the machinery, since rate-limit telemetry is
      machine state, not intent. One pace budget spans both routers during
      coexistence and counts strategy sessions as workers. The legacy priority
      label maps to a first-class authored pace-exempt flag on goal-layer nodes
      (schema home: tactic-graph-dispatch-schema), deliberately orthogonal to
      attention ordering: it admits one gate-exempt worker past a paced-to-zero
      budget — it bypasses the gate, not the count or the order — and never
      overrides genuine token exhaustion (the --exhausted hard floor,
      main-broken parity). Recorded 2026-07-03 interview."
  - question: Before the transitions tactic lands, who advances a graph-native
      tactic's phase on main — how do QA, review, CI-gated fix, and merge
      workers get scheduled?
    answer: >-
      Before the transitions tactic lands, who advances a graph-native tactic's phase on main — how do QA, review, CI-gated fix, and merge workers get scheduled? — See body §Phase Transitions & Fix State for the full mechanism. Recorded 2026-07-03 from author review.
  - question: What did the author's branch-protection review find, and what
      mechanism lets intentions/-only commits land on main without a PR?
    answer: "Reviewed 2026-07-03 (tactic-intentions-branch-protection): main has a
      single repository ruleset — no-deletion, no-force-push, and four required
      status checks (acceptance, preview-and-smoke, lint, unit-tests;
      non-strict) — and no pull-request requirement. GitHub attaches check runs
      to the commit SHA, so a direct push is accepted whenever the pushed SHA
      already carries the four passing contexts. Decision: no settings change.
      The write path rides a graph/** scratch-branch CI fast path: push the
      intentions/-only commit to graph/<node-id>; a fast workflow hard-fails
      unless the diff vs main is entirely under intentions/, runs graph
      validation, and stamps the four required contexts green in about a minute;
      the writer then fast-forwards the same SHA to main, rebasing and
      re-running on reject. Heavy CI still guards any diff touching paths
      outside intentions/. Implementation is tactic-graph-commit Unit 2."
  - question: Beyond the pace curve (clarification 14), does the legacy router's
      token-optimization machinery carry over to the graph-native router?
    answer: "Yes — parity recorded 2026-07-04 (strategy-token-economy interview).
      Two commitments. Routing parity: the graph-native launch chain applies
      per-phase model and effort routing with the same fail-closed demotable
      allowlist and the audit-written policy file (legacy dispatch-phase-model /
      dispatch-phase-effort / phase-model-policy.json), and align-family
      sessions themselves get explicit routing — interview and decomposition
      sessions on Opus, their Explore fan-out on Sonnet or Haiku. Attribution
      parity: every graph-native session (align-family, router tick, tactic
      phase worker) stamps its node id and phase into the transcript sidecar so
      the token audit gains a by-node join; without it graph-native work lands
      in the audit's unattributed bucket — already the largest spend line in the
      2026-06-26→07-03 window — precisely as the queue migrates. The durable
      home for the requirements and their signal is strategy-token-economy; this
      clarification records only what the migration must carry. Recorded
      2026-07-04 interview. Amended 2026-07-16: the align-tactics decomposition
      session no longer runs whole-session on Opus — under
      strategy-token-economy clarification 10 the dispatch-launched
      /align-tactics worker runs a Sonnet orchestrator that delegates the
      decompose-to-signal judgment and per-tactic plan authoring to an Opus
      subagent; the /align-strategy interview stays whole-session Opus. The
      audit-written policy file is likewise now advisory (author-gated) rather
      than auto-applied, per the same clarification. Durable home remains
      strategy-token-economy."
  - question: Is the fix phase a linear step between implement and qa?
    answer: >-
      Is the fix phase a linear step between implement and qa? — See body §Phase Transitions & Fix State. Recorded 2026-07-04 from author direction.
  - question: Review findings beyond the tactic's plan — which are fixed in scope,
      which defer, which are ignored, and how do deferrals schedule?
    answer: "Three-way disposition by verification x contract, decided in the review
      phase. Resolve in scope: a finding that is adversarially confirmed
      (survives the skeptic pass with a concrete failure scenario) AND breaks
      the tactic's own stated contract — the deliverable its plan claims, or the
      security/integrity of what the diff itself introduced. 'No live callers
      yet' never defers a contract violation of the delivered thing itself
      (precedent: graph-commit's fail-closed conflict fix). The review phase
      holds — no review -> done transition — while a confirmed in-scope finding
      is open; its internal content-fix loop resolves them locally before CI.
      Defer: real but out-of-contract — confirmed findings on pre-existing
      surfaces the diff merely touched, defense-in-depth where the design
      already fails closed, robustness under conditions no unvalidated signal
      path exercises. Deferrals are recorded in the graph as draft tactics
      (retain-not-refine, clarification 6), batched per component with finding
      provenance (file:line, failure scenario, verdict, source PR) in the body;
      they become selectable only when a later /align-tactics round finalizes
      them, and once finalized they carry no validates edge to an unvalidated
      signal, so calculated attention's off-path demotion (clarification 11)
      ranks them below round tactics with no new machinery — and self-corrects
      upward if a new signal's path later includes the component. Ignore:
      refuted by the skeptic pass, unreachable failure scenarios, below the
      meaningfulness threshold (legacy parity: pre-existing moderate/low
      advisories), or fixes that would add defensive fallbacks contrary to
      code-style. Ignored findings are not graph-recorded; every disposition
      including refutation reasons is recorded once in the PR review comment as
      the audit trail. Recorded 2026-07-04 interview. (Amended 2026-07-13: cost
      now enters the resolve/defer boundary — a confirmed out-of-contract
      finding cheaper to fix than to defer is resolved in scope rather than
      deferred, and only expensive out-of-contract findings become draft
      tactics; the contract trigger and the ignore category are unchanged. See
      the fix-everything-cheap clarification of that date.)"
  - question: Is the qa phase a re-run of the automated checks — and what does a
      bootstrap-emulating session owe it?
    answer: "No — full parity with the legacy qa-fix skill
      (.claude/skills/qa-fix/SKILL.md), recorded 2026-07-04 from author
      direction after the first emulated qa run. QA is the autonomous half of
      user-acceptance QA, not an automated-test re-run: merge origin/main first;
      author a genuine QA plan from the live context (a triage that classifies
      ordered items script-verifiable / needs-browser / needs-human-judgment);
      validate the delivered behavior INDEPENDENTLY against the tactic's stated
      intent and real data — the live store, deployed surfaces, public seed data
      — never merely reproducing the implementer's claimed checks (the plan's
      verify blocks are the floor, not the phase); classify residue on the
      four-class disposition axis (opus-fixable -> the phase's bounded internal
      fix loop, needs-main -> follow-up, needs-human -> office_hours park,
      already-satisfied -> pass); record the summary on the PR. Precedent, same
      day: PR #2752's first qa pass re-ran the author's checklist and passed;
      the independent pass against the real delegation records immediately found
      the capture-term scoring bug (exact-match enum parsing vs the store's
      actual free-text vocabulary). A bootstrap-transition session
      (clarification 15) emulating qa owes these full semantics before writing
      the qa -> review transition; the transition write asserts the validation
      happened, not that the checklist re-ran."
  - question: Does review-phase parity bind like qa parity — what does an emulating
      session owe the review phase?
    answer: "Yes — the clarification-20 rule generalizes: review is the full
      /review-fix fan-out (surface-conditional finders in parallel -> code dedup
      -> classify -> adversarial verify with severity-scaled skeptics -> the
      Opus fix lane -> disposition per clarification 19, recorded in the PR
      review comment), not a single-agent read-through — and never skippable.
      Precedent: PRs #2750, #2748, and #2742 merged with no review phase at all
      under the bootstrap doctrine; the independent review ran retroactively a
      day later and its findings became the clarification-19 deferral drafts. A
      bootstrap-emulating session owes the full fan-out semantics before writing
      review -> done; the transition write asserts the review ran, not that CI
      is green. One seam is graph-native (clarification 19): deferred findings
      land as draft tactic nodes batched per component — never gh follow-up
      issues, no dispatch:review-followup label, and no orphan-retriage analog
      is needed: drafts are inert until a later /align-tactics round finalizes
      them, and that round validates the finding provenance against what
      actually merged. Recorded 2026-07-04 interview."
  - question: Where does a graph-native tactic's qa needs-main residue — post-merge
      verify-against-prod work — live?
    answer: >-
      Where does a graph-native tactic's qa needs-main residue — post-merge verify-against-prod work — live? — See body §Phase Transitions & Fix State. Recorded 2026-07-04 interview.
  - question: The repo was re-anchored — main checked out at the project root with
      Claude Code managing worktrees natively; do the worktree commitments still
      target the legacy .bare + sibling worktrees/ layout?
    answer: "No — Claude Code native worktrees are the substrate, recorded
      2026-07-05 from author direction. main is checked out at the project root
      (~/natb1/commons.systems) and every worker worktree is a Claude
      Code-managed worktree at the harness default location,
      <project-root>/.claude/worktrees/<node-id> — entered via the native
      worktree tooling (EnterWorktree) in sessions, and provisioned by launch
      scripts as a plain git worktree add into that same path. No graph-native
      machinery may assume the legacy layout: the .bare shared common dir and
      the sibling worktrees/ container persist only as backward compatibility
      for the draining gh lane, and the WorktreeCreate hook's git-common-dir
      anchoring, <issue-num>-<slug>-only name validation, and gh identity stub
      are legacy-lane conventions that retire with it
      (tactic-legacy-router-removal). This supersedes the mechanism half of
      clarification 12 (the worktree-create.sh node-id naming unit): the
      isolation commitment stands — one worktree per node id, liveness via live
      session ⇔ worktree — but a node-id worktree is a plain native worktree at
      the default location, never a hook-redirected path."
  - question: The first emulated router tick ran as a Workflow-tool script — is the
      Workflow primitive a better tick-execution substrate than the legacy shell
      spawn chain?
    answer: "Yes, for the execution layer only — workflow-native tick execution,
      chosen on greenfield terms. Selection cannot move: Workflow scripts have
      no filesystem or clock access, so eligibility gates, ordering, pacing, and
      claiming stay in owned deterministic code that reads origin/main and hands
      the tick a frozen selection set; transitions stay graph-commit writes.
      What moves is the launch layer: instead of extending
      dispatch-materialize-spawn / dispatch-launch-worker / dispatch-spawn-job
      to node ids, a thin tick workflow fans out one agent() per selected node —
      directive mapping (strategy → /align-tactics, tactic phase → phase skill)
      unchanged, and per-phase model/effort routing rides agent() options
      resolved from the persisted phase and the audit policy file. Evidence from
      the first emulated tick (12 eligible tactics fanned out, 6 draft PRs):
      schema-validated structured returns replace label/comment parsing,
      pipeline dataflow ran each tactic's completion check the moment its
      implement finished, and routing needed no plumbing. The legacy spawn chain
      is not extended and is not kept as a fallback (author direction: no legacy
      retained just in case) — it stays issue-lane-only and retires with the
      drain. Ticks are phase-granular: a tick executes only currently-eligible
      phases and exits; the transition write schedules the next phase next tick;
      CI waits happen between ticks. Recovery is honest about the primitive's
      limit: workflow resume is same-session only, so a dead tick is recovered
      by the next tick re-selecting from origin/main — the same idempotent
      re-selection semantics the legacy router has. Recorded 2026-07-06
      interview. Amended 2026-07-11 interview: the agent()-per-node fan-out is
      retired. Its fatal limit surfaced in practice — a workflow-spawned
      subagent is not given the Workflow tool, so a phase whose own logic is a
      workflow (/review-fix, /qa-fix, both `.claude/workflows/*.js`) cannot run
      as the tick's nested agent(); it parks at its Step 2 every time (the graph
      already carries these parks). The launch layer is revised to Shape B: an
      owned graph-native launch-per-phase primitive spawns each selected phase
      as its own top-level session, where the phase skill IS the orchestrator
      and holds the Workflow tool to build its own phase-specific fan-out. This
      walks back this clarification's own 'no legacy spawn chain kept as
      fallback' stance deliberately — a graph-native launch-per-phase is now the
      primary launch layer, not a fallback; the walk-back is sound because that
      stance was premised on agent()-per-node hosting every phase, which it
      cannot. Selection, pacing, and transitions stay in owned code
      (clarification 25 holds, strengthened); the phase's own graph-commit
      transition is the durable outcome, replacing the tick's schema-validated
      agent() return; recovery stays next-tick re-selection from origin/main,
      and a dead phase session no longer kills sibling phases. The in-tick
      pipelining this clarification valued is subsumed by the phase-granular
      tick it already committed to."
  - question: What keeps the Workflow executor — proprietary, session-bound harness
      machinery — from making the router itself a rented runtime, against
      strategy-owned-orchestration?
    answer: "A thin-script condition plus a recorded capture entry, not denial.
      Condition (attributes.conditions): workflow scripts stay thin composition
      — selection, transition, and provisioning mechanics live in owned,
      offline-testable code (intentionsutil tsx modules and primitive scripts
      such as graph-commit and node-worktree provisioning) that workflow agents
      invoke as single commands; the Workflow layer orchestrates but is never
      the sole home of router logic. This doubles as the testability answer: a
      workflow script cannot execute without spending tokens, so anything
      unit-testable must live below it. The capture cost lands on
      delegation-anthropic-claude — divergence.imported gains the
      orchestration-runtime item and review_trigger gains incompatible
      Workflow-semantics change or individual-scale gating — because the
      orchestration logic remains forkable in-repo JS/tsx while only the
      executor is rented, and the thin-script condition is what keeps re-hosting
      that executor bounded. Recorded 2026-07-06 interview. Amended 2026-07-11
      interview: under Shape B (clarification 24 as amended) the router/tick no
      longer executes on the Workflow primitive at all — the launch layer is
      owned spawn code. The Workflow executor is now used only INSIDE per-phase
      fan-outs (/review-fix, /qa-fix). This strengthens the thin-script
      condition rather than weakening it, and it REDUCES the imported capture
      surface at the router level: the capture entry on
      delegation-anthropic-claude is reconciled in the same commit —
      divergence.imported's orchestration-runtime item and review_trigger move
      from 'the dispatch tick's fan-out executes on Workflow' to 'per-phase
      review/qa fan-outs execute on Workflow; the router/launch layer is owned
      code', a net reduction in rented-runtime surface that serves
      strategy-owned-orchestration."
  - question: What keeps the graph's tactics aligned with the greenfield target —
      what prevents accumulating work on code the critical path deletes?
    answer: "A greenfield-relevance gate binding the align family: at /align-tactics
      finalization and in every /align-strategy improvement pass, each candidate
      and open tactic's subject is checked against non-draft nodes that delete
      or supersede it (a raw draft never obsoletes live work). The check is
      per-unit: doomed units are dropped from the plan body naming the
      superseding node; only a fully-superseded tactic demotes to draft. A
      tactic on doomed surface may stay selectable only as an explicit
      interim-live-risk exception naming its expiry event (e.g. the gh-queue
      drain). First application this round:
      tactic-dispatch-gh-api-interim-hardening demoted to draft (expiry:
      tactic-legacy-router-removal); tactic-dispatch-script-hardening kept,
      per-unit — already scoped to surviving scripts. Recorded 2026-07-06
      interview."
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
    answer: "Router-launched work is safe by construction — node-id claiming with
      worktree isolation, frozen-selection ticks, single-node rebase-retry
      writes failing closed on same-node conflict, and the substance-fingerprint
      soft freeze. Three commitments close the human-session gaps. Claiming:
      interactive and human-invoked bg align sessions enter the same node-id
      reservation ledger as router workers and author in worktrees, never the
      shared main checkout — the ledger is uniform across launch modes.
      Freshness: the write path gains a base-version check — the editing flow
      records the origin/main blob each node was read at, and graph-commit
      refuses a write whose base is stale, making read-fresh mechanical rather
      than session discipline (implementation: tactic-graph-commit-prune-support
      Unit 2; motivating near-miss: a stale dump of
      tactic-graph-commit-hardening nearly clobbered its live phase: qa state).
      Semantic drift: no lock covers doctrine-vs-content races across different
      files — the periodic /align-strategy improvement pass (now carrying the
      greenfield gate and placement doctrine) is the reconciler, and a
      doctrine-recording session pauses the pace curve for its audit window, as
      this round did. Recorded 2026-07-06 interview. (Amended 2026-07-13: the
      failing-closed clause and the uniform claiming ledger are narrowed —
      claiming is scheduling-dedup only and never blocks an edit; same-node
      conflict resolves automatically, parking only true conflicts. See the
      automatic-serialization clarification of that date.)"
  - question: Does the legacy office-hours entry's attach-to-parking-session
      behavior carry over — how does a human engage a parked node?
    answer: "No — graph recoverability replaces session recovery. Session recovery
      is not supported usage of the greenfield router: under workflow-native
      tick execution (clarification 24) phase workers are agent() subagents
      inside a tick workflow, not independently attachable daemon jobs, so a
      design premised on re-entering the parking session cannot be supported —
      and with the park write carrying full context, session persistence (daemon
      registry, transcripts, resume) stops being load-bearing: the owned graph,
      not the harness's session machinery, is the recovery substrate for parked
      work (no recovers edge recorded — the same strategy leans on the Workflow
      executor per clarification 25, so a strategy-level unwind claim would
      overstate). The park write is the recovery artifact: every office_hours
      park records recoverable context in the node at park time — the reason, a
      best-next-steps recommendation as a first-class
      office_hours.recommendation field beside reason/since (atomic with the
      park, cleared with the un-park; a schema follow-up, since
      tactic-graph-dispatch-schema is done), and any state a fresh session
      needs; a park whose context lives only in the parking session is a defect
      (condition 6). The graph-native entry always launches, and attaches the
      human to, a NEW session recovered from the graph: selection walks parked
      nodes in resolved-rank order (the router's own calculated-attention
      ordering; an explicit node-id argument targets one item); the session
      roots in the node-id worktree when one exists — in-flight working-tree
      state lands in front of the human, and the session claims the node id per
      the liveness rule (clarification 13) — else the main checkout; it surfaces
      office_hours.reason and the recorded recommendation as untrusted data,
      generates a recommendation via a read-only review subagent only when none
      was recorded, and stops. Read-only review-and-recommend parity holds: no
      phase transition, no un-park, no fixes — the park clears per clarification
      4 (an interactive-session commit touching the node). The legacy entry's
      attach/resume/provision verbs, its gh selector, and the strip hook retire
      with the drain (tactic-legacy-router-removal). Recorded 2026-07-06
      interview."
  - question: Bootstrap rounds run /align-tactics in the same session as the
      /align-strategy edit — is that same-session context load-bearing?
    answer: "No — it is a bootstrap safety, never a carrier, recorded from author
      direction. In the target design the soft-freeze re-evaluation is a fresh
      /align-tactics session the router queues on a fingerprint mismatch
      (clarification 10) and the tick launches (clarification 24), with the
      transition-time fingerprint gate holding every forward transition and
      merge arm until that session confirms or amends
      (tactic-graph-router-transitions Unit 1) and the autonomy contract parking
      to office_hours — reason plus recommendation — when author input is
      required. That fresh session has only the graph, so /align-strategy owes
      it a complete record: every fact a decomposition or re-evaluation needs —
      the interview's decisions, rationale, edge-case resolutions, and tactical
      byproducts — lands in the graph at record time (strategy substance:
      statement, clarifications, conditions, success_signal; tactical context:
      draft tactic bodies per clarification 6), never only in the recording
      session's context. A decomposition that cannot proceed without unrecorded
      interview context is a defect of the /align-strategy round that produced
      it, exactly as a park whose context lives only in the parking session is a
      defect (condition 6) — the same graph-recoverability principle applied to
      the strategy-record write instead of the park write. The /align-strategy
      requirements-coverage check (its step 6: every clause of the author's
      input maps to a recorded element) is the skill-side discharge of this
      condition. Same-session /align-tactics execution remains good practice
      during bootstrap while no router exists to queue the re-evaluation, but
      nothing may depend on it. Recorded 2026-07-06 from author direction."
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
    answer: "No as run, and the cap is global — recorded 2026-07-06 interview after
      the second emulated tick. The concurrency cap is a property of the one
      claimed set, never of a workflow: max_concurrent_workers
      (dispatch.config/target-workers.json, default 8) bounds the TOTAL of
      dispatch-managed workers live at any moment across all ticks, workflows,
      and lanes. The enforcement point is selection — the tick counts busy plus
      reserved from the ledger and liveness against the pace target and selects
      only the gap; per-workflow caps (dispatch-graph-tick's worker_cap, an
      emulated tick's semaphore) are local backstops, never the enforcement
      point (two overlapping workflows each locally capped at 8 would otherwise
      run 16). What makes overlapping ticks safe is claims spanning the overlap:
      a tick's lifetime ends at spawn — every selected node enters the
      reservation ledger at selection under the lock, the claim is carried by
      the node-id-named runner session for the phase's life, and a dead worker's
      claim is reconciled by the sweep; a concurrent tick re-selects only
      unclaimed nodes, so the global cap holds without serializing ticks. A
      single long-lived multi-node workflow is never the router mode: its
      subagents are invisible to node-id liveness, so it cannot carry claims —
      the second emulated tick's 12 workers in one workflow were exactly this,
      safe only because no overlapping tick fired. Bootstrap: an emulating
      session owes the router's claiming semantics like any other phase
      semantics (clarification 15) — write a ledger claim per selected node
      before fan-out and clear each with its transition write. (Amended
      2026-07-16: \"a tick's lifetime ends at spawn\" means the tick's FINAL
      spawn — a tick front-loads all scriptable non-worker dispositions before
      selection and then spawns the worker group against post-disposition state,
      so a metadata-only disposition never consumes a launch-budget slot; see
      the scriptable-then-spawn clarification of that date. Each spawn still
      enters the ledger under the selection lock, so the global cap and overlap
      safety are unchanged.) (Amended 2026-07-18: the cap bounds
      *autonomously-selected* workers — the tick/pace machinery must never
      select past it. A deliberate human dispatch may launch one node over it
      (clarification 76): a bounded, conscious, self-correcting act, not the
      autonomous runaway this invariant guards against. The overlap-safety
      property is unchanged — it concerns concurrent autonomous ticks, and the
      human-launched worker still enters the ledger, so no autonomous tick
      compounds on top of it.)"
  - question: A selected node’s scope or state changes after selection — before its
      worker starts, or while it runs. What closes the window?
    answer: "Two gates bracket the worker; no mid-run polling. Start gate: the
      provisioning prelude (provision-node-worktree) re-validates against fresh
      origin/main — the node still exists, its persisted phase equals the
      selected phase (passed as an argument; the directive is never re-derived),
      office_hours is null, and the serving strategy's substance fingerprint is
      unchanged where stamped — and any mismatch is a distinct exit code: the
      worker reports skipped, its claim clears, and the next tick re-selects
      from current state. This makes the soft freeze precise: a
      selected-but-unstarted worker counts as not started and yields to the
      freeze. Write gate: the transition-time fingerprint gate
      (tactic-graph-router-transitions Unit 1) holds the transition when
      substance moved mid-run. Changes landing mid-run are absorbed at the write
      gate plus the re-evaluation sweep — phase skills never poll the graph
      mid-phase. Author interactive edits to a claimed tactic's scope land
      freely and bind from the next selection: the in-flight phase finishes
      against the scope it started with and its transition write stands; an
      author who needs in-flight work stopped parks the node — the start gate
      blocks any queued or re-selected worker, and the interactive-commit rule
      un-parks. The base-version write check (tactic-graph-commit-prune-support
      Unit 2) keeps author and worker node-writes from clobbering each other.
      Start-gate implementation is retained as draft
      tactic-worker-start-revalidation (new scope — never an amendment to the
      in-flight selector PR). Recorded 2026-07-06 interview."
  - question: Does long-horizon graph work keep a workflow or session alive?
    answer: "No — the graph is the long-horizon substrate; sessions are disposable
      executors. This generalizes the office-hours-entry clarification
      (2026-07-06, 'how does a human engage a parked node' — graph
      recoverability replaces session recovery) from parked work to the router
      itself: continuity is durable state on origin/main (persisted phase,
      claims, plans, residue sections) re-entered by the cron heartbeat; dead
      ticks, dead workers, and dropped queues recover by re-selection plus
      ledger sweep, never by resuming a session (workflow resume is
      same-session-only). A kept-alive supervisor workflow or self-rescheduling
      session is rejected as router substrate: session limits kill workflow
      subagents mid-flight (observed on both emulated ticks), one session is a
      single point of failure, and it concentrates the router into the rented
      executor — the direction the thin-script condition (clarification 25)
      exists to bound. A phase worker may legitimately run long: it lives
      exactly as long as its one phase under its node-id claim. The ban is the
      router-as-session, not long phases. Recorded 2026-07-06 interview."
  - question: A tactic-only scope edit lands mid-review, or between review-pass and
      merge — the mid-flight-edit rule lets the transition write stand, so the
      PR merges against pre-edit scope. Is that window acceptable?
    answer: "No — closed by a tactic-scope fingerprint, superseding the 'its
      transition write stands' clause of the mid-flight-edit clarification
      recorded earlier the same day. The rest of that rule stands: edits to a
      claimed tactic land freely, bind from the next selection, and
      park-to-interrupt remains the author's stop lever; what changes is that a
      phase's forward transition no longer survives a scope edit that landed
      after the phase's fresh read. Mechanism, symmetric with the
      strategy-substance fingerprint (clarification 10) but tactic-local and
      worktree-scoped rather than stored in the node: the worker-start
      re-validation gate records the tactic's scope fingerprint — a hash over
      statement plus node body, never frontmatter state fields, so
      attempts/markers/residue/park writes cannot trip it
      (tacticScopeFingerprint beside strategyFingerprint in intentionsutil) — as
      part of taking its fresh read, saved beside the node's worktree, never a
      per-launch graph write. The transition writer re-checks it at every
      forward transition write, and specifically before arming auto-merge at
      clean review completion, exactly where the strategy-fingerprint gate
      already sits (tactic-graph-router-transitions Unit 1): on mismatch, no
      forward transition is written and no merge is armed — the tactic stays at
      its completed phase and the next tick re-runs that phase against the
      updated scope, whose worker takes a fresh read and a fresh stamp. Net
      guarantee: a tactic cannot reach done or merge until the phase that was in
      flight has completed a run whose fresh read postdates the last scope edit.
      Bootstrap parity: an emulating session owes the same scope re-check before
      writing its transition (clarification 15). The asymmetry that motivated
      this — the soft-freeze hash deliberately covers strategy substance only —
      remains by design; tactic scope gets its own local gate instead of joining
      the strategy hash. Recorded 2026-07-06 interview."
  - question: A worker session dies mid-phase (API error, session limit, system
      failure) while graph state and worktree survive — is the session state
      worth recovering, by workflow-session resume or by transcript
      reconstruction (the legacy recover-api-error pattern)?
    answer: "No on both mechanisms — re-selection stays the only recovery path,
      reaffirming the workflow-tick clarification (2026-07-06, dead ticks
      recover by re-selection) and the bootstrap-record clarification
      (2026-07-06, re-evaluation is a fresh session with only the graph), and
      the residual loss is closed by a durability rule, not a session mechanism.
      What a dead worker actually loses is reasoning-in-progress — findings not
      yet flushed to durable state; the node body's clean-session plan
      (condition 7), the node-id worktree with its commits and uncommitted edits
      (the re-selected worker roots in the same worktree, so in-flight file
      state lands in front of it per the office-hours-entry clarification's rule
      (2026-07-06)), and the PR with its phase comments all survive, and the
      ledger sweep already keeps a dead worker from blocking new selections.
      Workflow-session resume is technically unfit twice over: resume is
      same-session-only, unavailable exactly when the tick session is dead; and
      resume replays only completed agent() calls from cache — a worker that
      died mid-flight re-runs from scratch — so its best case equals
      re-selection at tighter coupling to the rented executor. Transcript
      reconstruction is negative expected value as router machinery: the node
      body already carries everything a fresh session needs, so the transcript's
      marginal information over plan + worktree diff + PR comments is small;
      reading a long transcript costs a significant fraction of redoing the
      reasoning and inherits whatever confused state killed the session; and it
      would make the harness's proprietary transcript format load-bearing for
      the router — reversing the office-hours-entry clarification's (2026-07-06)
      demotion of session persistence and running against the thin-script
      capture bound (clarification 25). recover-api-error stays a human-invoked
      legacy-lane tool and never becomes router substrate. The remaining gap —
      an expensive phase dying with its findings only in conversation — is
      closed by the checkpoint discipline (new condition 9): phase progress
      whose only home is the session is a defect; workers flush findings to
      durable state at natural boundaries (worktree commits for file work; PR
      comments for QA triage and review findings as produced, not only at phase
      end; node body sections for residue), and a re-selected worker treats
      pre-existing worktree/PR state as resume input — diff against the branch
      base and read prior phase comments before redoing anything. This bounds a
      dead worker's redo cost to one checkpoint interval with zero new harness
      coupling. Skill-side encoding retained as draft
      tactic-phase-checkpoint-discipline. Recorded 2026-07-06 interview."
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
    answer: "Yes to both, by amendment: scope staleness now demotes the tactic to
      phase implement instead of holding it in place — superseding the same-day
      scope-fingerprint clarification's 'stays at its completed phase and the
      next tick re-runs that phase' clause (its stamp/verify mechanism and
      everything else in that entry stand). As first recorded, the gate re-ran
      only the held phase, so an edit landing after qa's fresh read reached
      merge with only review re-run: review's contract check does route
      delivered-vs-current-scope gaps to its fix lane, so the code converged,
      but the new scope never received the qa phase's independent
      user-acceptance validation (clarification 20), and 'implement ran with
      latest scope' held only vicariously through fix loops. Amended rule —
      chain of custody: a pre-merge phase beyond implement may run only against
      the exact scope the previous phase ran against. The worker-start gate
      compares the current tacticScopeFingerprint against the existing stamp
      left by the previous phase before overwriting it (fix/qa/review; implement
      skips the comparison — it always takes the latest scope and re-establishes
      custody; main-qa is post-merge and validates against current intent by
      design); the transition-time gate keeps comparing against the running
      phase's own start stamp. Staleness at either point writes the backward
      transition phase := implement — the transition writer's one owned backward
      transition — never a hold: the re-selected implement worker roots in the
      same worktree, reads the current node body as the whole target state, and
      implements only the delta, after which qa and review re-run in order on
      fresh reads. Net guarantee, strengthened from the superseded clause: merge
      requires an unbroken implement -> qa -> review chain all executed against
      the merge-time scope fingerprint. Machinery body writes cannot break the
      chain: the transition writer refreshes the stamp to the post-write
      fingerprint of the node it just committed — residue sections DO change the
      body hash, so the superseded entry's claim that residue writes cannot trip
      the gate was wrong as written; the writer-side refresh is what makes
      machinery appends harmless — leaving only author and re-evaluation edits
      able to demote. A cascading strategy edit reaches this gate through the
      existing two stages: the strategy-substance fingerprint holds transitions
      and queues re-evaluation (clarification 10); if the re-evaluation amends
      the tactic's scope, that amendment trips the scope chain and demotes — if
      it confirms without amending, nothing re-runs, which is correct. Boundary:
      demotion is pre-merge only (implement/qa/review/fix); post-merge staleness
      routes per main-qa parity (clarification 22) — broken-in-prod becomes an
      implement-chain bug tactic, never an un-merge. A missing stamp fails open
      with a logged warning during bootstrap and fails closed (demote) once the
      stamp mechanism lands. Routing-back provenance is explicit, not
      archaeological: the stamp records the origin/main SHA beside the
      fingerprint, so the demoting writer names exactly what is being absorbed —
      git log <stamped-sha>..origin/main -- intentions/<id>.md — in the demotion
      commit message and as a comment on the node's PR when one exists; the
      re-run phases need no delta to be correct (the node body is the full
      target state, condition 7 — plan minus delivered worktree state is the
      work), so the named range is a focus aid and the audit trail. Bootstrap
      parity: an emulating session owes the chain re-check before each
      transition it writes, and owes the demotion write when it finds a post-qa
      scope edit (clarification 15). Recorded 2026-07-06 interview. (Amended
      2026-07-16: the primary scope-staleness comparison moves AHEAD of
      selection into the tick's disposition sweep, so a demotion is scriptable
      phase-1 work that no longer surprises the worker-launch step or consumes a
      budget slot; the worker-start gate described here stays as the safety
      re-check for staleness introduced after the sweep. See the
      scriptable-then-spawn clarification of that date.) (Scoped 2026-07-18: the
      'leaving only author and re-evaluation edits able to demote' clause is
      narrowed — an author-present align round that classifies its own
      tactic-body edit as scope-inert re-stamps the custody stamp in the same
      round, so such edits no longer demote; material and unsure edits still do.
      See the scope-inert-restamp clarification and draft
      tactic-scope-inert-restamp-primitive.)"
  - question: What guards the router against failure loops — a worker that
      repeatedly fails to make progress or park on a node, and a systemic
      executor failure (a daemon crash-loop) that would otherwise false-trip a
      per-node fuse across every selectable node?
    answer: "Two fuses, both written by the reconciler sweep, each gating exactly
      its blast radius. Per-node fuse: the sweep increments a durable
      no-progress counter (an execution.attempts entry — frontmatter state,
      never in the scope hash) whenever a claimed node's worker ends with
      neither a transition write (forward or backward) nor a park — the claim
      died silently; at 2 consecutive no-progress cycles (legacy CAP=2 parity)
      the sweep parks that node to office_hours carrying the failure history per
      condition 6. Any successful transition resets the counter; a start-gate
      skipped disposition is a correct yield, never a strike; the gate is
      node-local — a tripped node fuse blocks only that node. Systemic breaker:
      classification runs in the NEXT tick's sweep, before selection (sweep →
      classify → gate → fan out), because the failing tick cannot classify
      itself — the motivating scenario is a misconfigured fan-out exceeding
      memory and crashing the daemon or system, killing the tick and its workers
      together, where tick-end classification and a canary probe are both blind
      (a canary passes whenever the daemon has recovered enough to run it). When
      the sweep finds correlated death — at least 3 simultaneously dead
      no-progress claims constituting the prior tick's selection (all or quorum;
      below the floor, failures strike per-node and the cap-2 fuse still catches
      real loops) — it writes NO per-node strikes and instead trips the breaker:
      one incident tactic written via graph-commit, born office_hours-parked,
      serving this strategy, carrying the correlated-failure evidence and a
      next-steps recommendation. While an unresolved breaker tactic exists,
      selection selects nothing — the only global gate. Correlated death is also
      the signature of the daemon-down liveness trap (a dead daemon makes every
      claim look dead at once via the empty claude agents read), so the
      discriminator converts exactly the false-mass-park input into a single
      graph artifact. Reset is human-only via the normal interactive un-park
      (clarification 4): auto-reset would resume a crash loop, and a trip is by
      definition human-reviewed through the standard office-hours queue — no
      side channel (clarification 28), and no breaker state in dispatch.config,
      which keeps tunables only (quorum floor, caps); clarification 14's
      machine-state carve-out covers telemetry and tunables, not
      review-demanding events. Net: the crash-loop scenario is bounded to one
      crash, and this amends the unbounded reading of re-selection recovery
      (clarifications 24/30/34) — re-selection remains the only recovery path,
      now fuse-bounded in both scopes. No recovers edge is added (clarification
      26 precedent: the fuse bounds executor-failure blast radius; it does not
      reduce executor reliance). Bootstrap parity: an emulating session owes
      strike accounting and the pre-selection breaker check like any other phase
      semantics (clarification 15). Implementation retained as draft
      tactic-router-failure-fuses. Recorded 2026-07-07 interview."
  - question: Self-modifying tactics — scope touching agent-behavior config
      (.claude/skills/**, .claude/hooks/**, settings) — cannot be committed by
      auto-mode workers. Is self-modification a supported greenfield use case,
      and how does it flow?
    answer: "Supported and designed-for, not an error path. Primary lane:
      /align-tactics detects self-modifying scope at decomposition time and
      encodes the tactic born-parked — office_hours set from birth,
      recommendation naming the self-modification office-hours skill — so it
      never launches an auto-mode worker. Fallback lane: a self-mod tactic that
      slips through is attempted by the worker, which completes all non-config
      work and parks on the commit denial with the branch staged. Office-hours
      drain for these parks is a mostly-automated session documented as a common
      skill (draft tactic-office-hours-self-modification-skill): the session
      executes the parked recommendation end-to-end and the human's only
      interaction is approving the explicit self-modification permission prompt.
      Recorded 2026-07-07 interview."
  - question: The interactive align skills read the graph before acting — what
      guarantees they read the latest graph, not a stale local checkout?
    answer: "A non-skippable pre-analysis freshness guarantee — the read-side
      complement to the single-write-path discipline (the 2026-07-03
      concurrent-edit clarification). Just as every write rebases onto
      origin/main before it lands, every interactive graph-reading session
      (/align-strategy, /align-tactics, /align-init, the office-hours review)
      must see origin/main state before its first analysis read. This is a
      distinct hazard from strategy-explicit-intent's content-staleness
      condition (the graph lagging reality): here the graph is current but the
      session's local checkout lags it — the inverse. The 2026-07-08
      graph-function round hit it live, running step 1.2's overlap grep and the
      readNode of the edited node against a 36-commit-behind tree and presenting
      superseded doctrine as current until the author caught it. The headless
      router tick already freshens (git fetch origin main && git merge --ff-only
      origin/main on its worktree per dispatch-select-tick); the interactive
      skills did not, and the failure was not an absent method but that nothing
      forced one — a prose 'fetch first' step is skipped by the next session
      exactly as that one skipped it. So the guarantee is structural and
      non-skippable: greenfield, the interactive skills' worktree is cut from
      freshly-fetched origin/main so analysis physically cannot begin on a stale
      tree (the router's provision-node-worktree primitive is the model);
      SKILL.md prose is a documentation backstop, not the mechanism. A fetch
      that cannot reach origin fails the session rather than proceeding on
      unverified local state (clear error over defensive fallback). Mechanism
      retained as tactic-align-skills-latest-graph-guard. Recorded 2026-07-08
      interview."
  - question: Do node-assigned sessions receive the node's ancestry — the decision
      context above it — or only the node itself?
    answer: "Both — node plus a bounded ancestry projection, injected at session
      start for every node-assigned session uniformly: tactic phase workers,
      strategy /align-tactics workers, main-qa handlers, office-hours entry
      sessions, and interactive align sessions editing a node (uniform by node
      id, like claiming and liveness). Today only the node's own context reaches
      a session (the tick prompt carries id/kind/phase and the phase skill reads
      the node file, whose body is the plan per condition 7); ancestry is never
      loaded, yet phase semantics already owe ancestry facts — review
      disposition needs unvalidated-signal-path membership (clarification 19),
      qa validates independently against intent (clarification 20) — so a worker
      either resolves greedily or reads the graph ad hoc, the same
      unforced-method failure shape the read-side freshness guarantee closed.
      Doctrinal home: strategy-explicit-intent's periagoge clarification and its
      injection-lapse condition ('the delegatee-education claim holds only while
      the graph is actually injected into the delegatee's harness') — this is
      that condition's per-node materialization. Projection, per ancestor on the
      parent + serves chain up to virtue roots: statement, rationale,
      attributes.conditions, success_signal, and attention rationale, plus the
      clarification questions as a titles-only index the session pulls in full
      on demand — bounded (order-of-a-few-KB per chain) for token-economy parity
      (clarification 17), never the full clarification histories by default.
      Discipline, resolving the recorded steelman (complete-record purism:
      condition 7 plus the fingerprint gates already suffice): ancestry is
      read-only decision context for in-scope judgment calls; the node body
      remains the sole work contract, and condition 7 is unweakened — a plan
      that assumes the ancestry projection is still an incomplete record; a
      perceived plan-vs-ancestry conflict routes to an office_hours park with a
      recommendation, never self-expanded or self-reduced scope. The steelman is
      rejected because fingerprints guard against substance changes, not against
      judgment calls the plan under-determines at execution time, and the
      ancestry facts qa/review already owe are otherwise unforced. Mechanism per
      the thin-script condition (clarification 25): an owned ancestry-projection
      primitive invoked at provisioning / session Step 0, retained as draft
      tactic-node-ancestry-context. Recorded 2026-07-08 interview."
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
    answer: "/align. The name /align-strategy is a misnomer — the persistent layer
      the skill manipulates includes virtues, traditions, and delegations, not
      only strategies — and the /align name was freed when
      tactic-align-init-skill (PR #2781) deleted the legacy /align skill, its
      collision-avoidance rationale being migration-scoped and the migration
      complete. Consolidation, author-decided this round: (1) /align <prompt>
      replaces /align-strategy <prompt> and may record or amend anything in the
      persistent layer — virtue, strategy, tradition, or delegation nodes — plus
      draft-tactic byproducts; no separate virtue-review step exists. (2)
      /align-init is folded in and removed: /align with no prompt runs the
      onboarding funnel — orientation, scripted deployment validation, then a
      walk to crafting a prompt, which the session executes as /align <prompt>;
      the entry point funnels by whether the user already knows what to pass (a
      do-one-thing-name steelman, e.g. /align-graph, was put and rejected on
      these grounds). (3) The scheduled align jit and its rung-5 dialectic
      engine are retired — no scheduled periodic review remains — and the
      /align-strategy no-prompt improvement pass is retired with them rather
      than folded into the /align-audit draft now; both engines' content is
      retained in tactic-align-audit-legacy-review, an office-hours review
      sitting that decides their inclusion in /align-audit
      (tactic-align-audit-skill, strategy-graph-integrity) at a later date, and
      tactic-align-audit-skill itself is untouched this round. (4) /align
      creates and maintains the review curriculum through the universal-deferral
      mechanics on strategy-explicit-intent (reading chunks and office-hours
      review items); the curriculum runs with the reading-review skill at office
      hours — /align never runs a sitting. (5) Backward compatibility:
      implementation is a single-PR atomic rename
      (tactic-align-entrypoint-consolidation) — /align-strategy keeps working
      until that PR merges, and the emulated dispatch tick is uninterrupted (no
      live dispatch.config/jit.json exists; the example config and tick-script
      fixtures update in the same PR). (6) The doctrinal-consistency gate found
      the retirement touching strategy-explicit-intent's live
      re-derivation-cadence condition and the tactic-condition-review-sweep
      draft; the author accepted the successor-cadence amendments as a deferral,
      ratified or reworked at the tactic-align-audit-legacy-review sitting.
      Recorded 2026-07-09 interview."
  - question: A mechanical integrity gate (test-integrity) fires on a legitimate
      removal — the check is red by design and can never go green, so the node
      can neither clear fix nor reach merge. What is the supported workflow?
    answer: "An author-approved, node-recorded waiver: approval flows through office
      hours and the node then proceeds through the NORMAL ladder —
      override-merge is retired as the integrity-gate path. Flow: (1) the worker
      that determines the firing is intentional and legitimate (the residual
      class the check's two mechanical co-deletion exemptions deliberately
      bias-to-fire on — e.g. behavioral tests of deliberately deleted behavior
      on a surviving symbol) does not fix-loop: fix means CI-red on unintended
      breakage (clarification 18), while an intentional gate block parks the
      node to office_hours with the EXACT proposed waiver as the recommendation
      (condition 6). (2) The author approves at office hours — the approval is a
      live human decision, and the office-hours session (Claude) then writes the
      waiver into the node, the same interactive graph-commit clearing the park
      (clarification 4). The waiver write is human-approval-gated: an auto-mode
      worker never writes one. (3) The CI check consults origin/main's
      intentions/ nodes keyed by the PR number (execution.pr) and nets the
      waived removals out of its signal counts before evaluating; the check goes
      green and the node resumes the normal ladder — fix/qa/review with the
      standard auto-merge arm at clean review completion. Waiver scope is
      per-signal, count-and-path bounded — {pr, signal, max net count, path
      scope} — so a later genuine weakening pushed to the same PR still fires;
      deliberately NOT head-SHA-pinned, so review-fix's own content-fix pushes
      cannot invalidate the approval and loop the node back to office hours;
      anything exceeding the recorded scope fires as usual (bias-to-fire
      preserved). No legacy-lane carve-out is needed: the gh queue drain is
      complete (author-stated this round), so the node-keyed lookup covers every
      PR the router owns. CI reliance stays within the existing
      delegation-github lean — the check remains an owned script and only the
      executor is rented — so no recovers edge is added. Interim emulation until
      the check-side lookup lands: the author's office-hours approval is
      recorded on the node as the same waiver-shaped marker the greenfield check
      will read, qa and review run with full parity semantics treating the red
      check as author-waived, and the author's override-merge stands in for the
      auto-merge arm — first case tactic-analytics-vitals-delivery / PR #2835,
      approved this round. Implementation retained as draft
      tactic-test-integrity-waiver. Recorded 2026-07-10 interview."
  - question: Auto-merge arming is human-authorized, yet a tick +3 Workflow launch
      was denied by the auto-mode classifier — what does the launch layer owe
      arming instructions in worker prompts?
    answer: "Plain human-authorization framing with zero classifier meta-commentary.
      Evidence (tick +3, 2026-07-10): review-worker prompts embedding
      self-referential justification — 'the auto-mode classifier APPROVES an
      explicit, human-directed instruction' plus 'you ARE AUTHORIZED AND
      EXPECTED to arm auto-merge' — caused the classifier to deny the entire
      Workflow fan-out launch as a bypass attempt; the identical fan-out
      relaunched cleanly once the arming step was reworded to state the fact and
      the commands plainly ('the human operator has directly authorized arming
      auto-merge for this review; run: gh pr ready <pr>; gh pr merge --auto
      --squash <pr>'), after which 8 of 9 review PRs armed and merged
      autonomously. Doctrine, binding the tick-workflow authoring layer and the
      review phase skill: arming instructions state the authorization as fact
      and name the commands; they never argue with, reference, or predict the
      permission layer — text that argues for approval reads as a bypass attempt
      regardless of a genuine underlying grant. The settings.json
      permissions.allow approach stays retired: a static allow rule bypasses the
      judgment layer entirely and is the wrong tool for a judgment-gated action.
      Recorded 2026-07-10 interview."
  - question: Emulated implement→qa transitions repeatedly land phase:qa with
      execution.pr null while an open draft PR exists — is the PR stamp at the
      implement→qa write load-bearing?
    answer: >-
      Emulated implement→qa transitions repeatedly land phase:qa with execution.pr null while an open draft PR exists — is the PR stamp at the implement→qa write load-bearing? — See body §Phase Transitions & Fix State for the full mechanism. Recorded 2026-07-10 interview.
  - question: Does explicit human dispatch of a single node override the pace curve,
      and does the graph lane have an entrypoint for it?
    answer: "Yes — explicit human dispatch overrides the autonomous pace curve in
      both lanes, a gate-bypass path distinct from the pace_exempt flag
      (clarification 14). pace_exempt is a standing per-node flag the autonomous
      selector reads to admit one exempt worker past a paced-to-zero budget;
      explicit dispatch is an on-demand human action that skips the
      pace/concurrency gate for one invocation of any node, regardless of that
      flag. The issue lane already implements it: dispatch <issue-number>'s
      explicit-arg branch (dispatch-select-tick:778-818) resolves and exits
      before both the graph selector and the pace gate, so it skips the
      concurrency gate (dispatch-tick:30). The graph lane has no equivalent —
      dispatch-resolve-arg accepts positive integers only, so dispatch <node-id>
      errors and the only explicit path is invoking dispatch-graph-execute by
      hand. Closing that gap is tactic-graph-explicit-node-dispatch. Explicit
      dispatch overrides the pace gate ONLY: it still respects the uniform
      node-id live-session/worktree claim (it refuses a node already held rather
      than force-preempting into a graph-commit conflict), and never overrides
      genuine token exhaustion (the --exhausted hard floor), parity with
      clarification 14. It never edits dispatch.config/target-workers.json — it
      bypasses the gate at selection, it does not change the curve. Recorded
      2026-07-11 interview."
  - question: A phase whose own logic is a workflow (/review-fix, /qa-fix) cannot
      run as the tick's nested agent() — how does the router launch such a
      phase?
    answer: "Shape B — the phase skill is its own top-level orchestrator. An owned
      graph-native launch-per-phase primitive (a graph-lane sibling of the
      retired dispatch-launch-worker, or an extension of the pace-independent
      dispatch-graph-execute path) spawns each selected phase as its own
      top-level session on sonnet; that session holds the Workflow tool and the
      phase skill builds its own phase-specific fan-out, spawning opus subagents
      only when the work calls for it (an implementation unit's Recommended
      model, or an explicitly opus-instructed review such as /code-review max).
      The dispatch-graph-tick agent()-per-node fan-out
      (`.claude/workflows/dispatch-graph-tick.js`) is retired — it is the exact
      structure that cannot host a workflow-phase, because a workflow-spawned
      subagent is denied the Workflow tool (observed in every park, not
      theorized). No structured session return is needed: the phase writes its
      own phase transition via graph-commit (clarification 1,
      tactic-graph-router-transitions), so durable graph state is the outcome
      (condition 9 strengthened). Concurrency cap and pacing stay in owned
      selection code. Recovery is next-tick re-selection from origin/main;
      independent phase sessions mean a dead review session cannot kill sibling
      phases. This resolves a live graph-internal contradiction: clarification
      24 assumed 'tactic phase → phase skill' ran fine as a nested agent(), but
      /review-fix and /qa-fix were built AS workflows requiring the Workflow
      tool — the two could not both hold. Recorded 2026-07-11 interview."
  - question: Does the review phase re-wrap /code-review as a findings-only finder,
      or trust the review skills' own built-in review-and-fix?
    answer: "Trust the built-in review+fix. The review phase runs /code-review max
      and /security-review with their defaults, both on opus, and works with
      whatever they output and edit — the 'You are a findings-only code-review
      subagent' framing (`.claude/workflows/review-fix.js:324,335`) is dropped,
      along with the findings-only wrapper and the separate adversarial-verify →
      opus-fix pipeline FOR those two sources (they carry their own
      verification). Only the residue those skills do not auto-fix is handled:
      an opus subagent classifies it and files follow-ups through the
      pre-existing classify → defer → file logic. Dedup, deferred-filing, and
      the other review steps are untouched. This refines clarification 19's
      disposition mechanics for the code-review/security-review sources
      specifically; it does not change the three-way disposition doctrine
      itself. Recorded 2026-07-11 interview. (Amended 2026-07-13: the three-way
      disposition doctrine this clarification leaves intact was itself refined
      that day — the unfixed residue is now classified into cheap findings fixed
      in scope versus expensive out-of-contract findings deferred, not filed
      wholesale. See the fix-everything-cheap clarification.)"
  - question: Frozen (undecomposed or soft-frozen) tactics carry a ranking — are
      they selectable, and what runs when the dispatch script picks one?
    answer: >-
      Frozen (undecomposed or soft-frozen) tactics carry a ranking — are they selectable, and what runs when the dispatch script picks one? — See body §Phase Transitions & Fix State. Recorded 2026-07-11 interview.
  - question: After a phase completes cleanly (no variance/escalation), who
      validates CI and who advances the node — and does the post-review merge
      need author intervention?
    answer: >-
      After a phase completes cleanly (no variance/escalation), who validates CI and who advances the node — and does the post-review merge need author intervention? — See body §Phase Transitions & Fix State for the full mechanism. Recorded 2026-07-11 interview.
  - question: What replaces the dispatch:main-broken gh-issue latch when origin/main
      goes red — and does the announcement surface stay gh-based?
    answer: "Main health is a sensor, and the self-heal flows through the general
      sensor machinery, not bespoke tick gating. Author-dictated encoding: (1)
      main-health is a registered sensor (SensorRegistry, local-first —
      own-pipeline CI status per read-sensors.ts doctrine) reading origin/main
      HEAD check conclusions; (2) the graph tick — the greenfield workflow
      automation — runs it each tick, and on a failing read find-or-creates the
      fix tactic (tactic-main-red-<shortsha> shape, one open node per episode,
      redacted diagnosis in the body); (3) the standing signal owner is
      strategy-main-health (kind: strategy, parent:
      strategy-autonomous-execution), created 2026-07-13 as the persistent home
      of success_signal {sensor: main-health, threshold: green} — a strategy per
      the same-date persistent-layer doctrine (standing structure never lives on
      transient tactics); the fix tactic carries serves + validates edges to
      strategy-main-health and its own success_signal {sensor: main-health,
      threshold: green}, so the same sensor that detected the episode validates
      the fix: threshold-met completes the tactic, re-arming detection (the
      one-success_signal-per-node limit binds per node; two nodes may reference
      one sensor); (4) rank by inheritance: strategy-main-health carries a
      standing authored boost 100 the fix tactic inherits undecayed through the
      normal downward attention flow — superseding the earlier-same-date
      creation-time recompute-graph-max machine-authored boost (no
      machine-authored boosts remain in the model); the automation still sets
      pace_exempt: true on the fix tactic at creation (bypasses the pace gate,
      never the --exhausted floor). The former accepted edge — blocked_by
      compounding overtaking mid-episode — dissolves: blocking is orthogonal to
      boosting per the same-date clarification on strategy-graph-drives-dispatch
      (authored rank never flows backward; blockers serialize by max-based
      precedence). Dominance of the 100 boost is maintained by the write-path
      guard condition recorded alongside, never by recompute. Scope: a
      main-specific instance of the general signal-ranking rule (same-date
      signal-ranking clarification); strategy-signal failures keep routing to
      /align-tactics. No gh issue, no label, no re-enabled features. Supersedes
      tactic-dispatch-legacy-rewire Unit 1 recorded latitude on the announcement
      surface (steelman — a gh-issue notification mirror — considered and
      diverged from: re-enabling issues re-imports the dependency this strategy
      recovers; visibility is owned surfaces job). Sequencing hazard:
      dispatch-select-tick step 1c reads the open dispatch:main-broken issue as
      the live latch, so legacy-latch cleanup (close the latch issue, re-disable
      has_issues) is gated on the sensor flow replacing that reader. Mechanics
      retained in draft tactic-graph-main-self-heal. Recorded 2026-07-12
      interview; encoding refined and dictated by the author, recorded
      2026-07-13 interview; signal ownership moved to strategy-main-health with
      boost inheritance and the write-path guard (superseding the
      fix-tactic-only signal home and the recompute-max machine boost), recorded
      in a later 2026-07-13 interview."
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
    answer: "Yes, implicitly: a signal's resolution-ranking configuration IS the
      owning node's authored boost. Resolution work created for a failing signal
      attaches under the owner (serves/parent) and inherits the owner's boost
      through the existing undecayed downward attention flow — no new rank
      machinery and no per-signal rank field (steelman — an explicit
      resolution_rank field on success_signal — considered and diverged from: it
      would create a second ranking currency beside the attention model).
      Default: no automatic elevation — a failing signal's resolution ranks
      wherever the owning node's existing boost and position put it (often near
      0), deliberately lower priority; strategy-signal failures keep routing to
      /align-tactics, whose tactics inherit via serves, so the existing flow is
      the default implementation. Main-health is the one signal whose owner
      (strategy-main-health) carries a standing very-high boost (100), kept
      dominant by the write-path guard condition recorded alongside. Recorded
      2026-07-13 interview (author-dictated)."
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
    answer: "No — contention is serialized automatically by tooling; the author is
      involved only at a true-conflict park. This amends two recorded positions:
      the fail-closed clause of clarification 2 of 2026-07-03 (same-node
      conflict maps to a manual-merge park) and the 2026-07-06 round's 'failing
      closed on same-node conflict' plus its uniform claiming ledger, both of
      which conflated textual overlap with contrary intent. The amended doctrine
      is the PR lane's fix-conflicts doctrine applied to node writes: resolve
      mechanical conflicts autonomously, escalate only genuine ambiguity. The
      resolution ladder, in order: (1) git three-way rebase auto-merge —
      non-overlapping edits land as today; (2) a structure-aware field-level
      merge — frontmatter list appends union so both land, distinct-field edits
      combine; (3) a stale --base stops being fatal: tooling re-reads fresh
      origin/main state and re-applies this writer's field-level edit
      automatically (the 2026-07-06 near-miss guard survives as automatic
      re-application, not a manual 're-read and retry'); (4) surviving
      same-scalar-field divergence goes to a model evaluation that attempts
      reconciliation; (5) only a true conflict — two edits expressing contrary
      author intentions that the model cannot reconcile — parks to office_hours,
      the park record carrying both divergent values plus a recommendation per
      condition 6. Model scope guard (holds the human-authorship condition): on
      human-owned doctrine fields — virtue/strategy/tradition/delegation
      statement, rationale, clarification text — the model resolves only
      mechanical divergence (one side subsumes the other, reordering, same
      intent differently worded), never synthesizing new substance; genuine
      doctrine divergence parks directly. On ai-owned tactic content and state
      fields (phase, office_hours, execution), full reconciliation applies.
      Node-id claiming narrows to scheduling deduplication: the router still
      avoids spawning a duplicate worker for a claimed node (a token-spend
      concern), but no session is ever blocked from editing a node by a claim —
      write safety lives entirely at land time. Motivating episode: this round's
      own interview was halted at the align skill's stop-on-held-claim step by
      an unrelated diagnose-main background session squatting the strategy's
      worktree — a claim gate serializing the author where no overlapping work
      existed. Steelman resolved as divergence: pessimistic mutual-exclusion
      serialization (the prior doctrine) was put and rejected — it blocks
      concurrent sessions that have no true conflict; optimistic git-based
      resolution on the PR-merge precedent is adopted. Reliance note: the
      model-reconciliation layer deepens delegation-anthropic-claude — Claude
      adjudicating between two expressions of author intent is capture-relevant;
      the risk is held by the scope guard and the human-authorship condition,
      and no recovers edge is added (the work controls the delegation rather
      than unwinding it, the same reasoning as strategy-graph-integrity's
      declined edge). The success_signal is unchanged: serialization health is a
      mechanism condition (amended condition 2), not the strategy's end-state.
      Implementation is retained as draft tactics
      tactic-graph-commit-auto-serialization and tactic-claim-dedup-only.
      Recorded 2026-07-13 interview."
  - question: Clarification 19 disposes review findings by verification × contract
      alone — every confirmed out-of-contract finding defers to a draft tactic.
      Does the cost of the fix versus the cost of deferring it also bear on the
      disposition?
    answer: "Yes — cost is a second resolve-in-scope trigger, refining clarification
      19's resolve/defer boundary (the 'fix everything cheap' doctrine). A
      confirmed finding is resolved in the review phase's content-fix loop when
      it EITHER breaks the tactic's contract (clarification 19's original
      trigger, unchanged) OR is cheaper to fix than to defer; only a confirmed
      out-of-contract finding that is expensive to fix — a real refactor —
      defers to a draft tactic. Cheaper-to-fix-than-to-defer is the line:
      deferral carries real overhead (a draft-tactic body, a later
      /align-tactics finalization round, a separate PR and its review), so a
      localized low-risk edit whose diff and risk are smaller than that overhead
      — reuse an existing helper, consolidate a read, add input validation,
      tighten a regex — is fixed now; a fix that introduces new structure or is
      cross-cutting (an algorithmic rewrite, a memoization architecture) defers,
      its in-PR risk and scope exceeding the deferral overhead. Cost refines
      ONLY the resolve↔defer boundary: it never moves a finding out of the
      ignore category — refuted findings, unreachable scenarios, below-threshold
      pre-existing advisories, and fixes that would add defensive fallbacks
      contrary to code-style stay ignored however cheap, because fixing a
      non-finding is waste and a defensive fallback violates code-style
      regardless of cost. A finding fixed in scope is still recorded, satisfying
      the graph-as-sole-tracker rule (clarification 30) and clarification 19's
      own audit trail: the disposition and the fix land in the PR review
      comment, so 'fixed cheaply in-PR' drops nothing. Steelman resolved as
      divergence: strict contract-scoping — defer every out-of-contract finding,
      keeping the PR to its exact deliverable (clarification 19 as first
      recorded) — was put and diverged from: it pays the full deferral overhead
      for a sub-overhead fix and accumulates debt on surfaces the diff already
      touched, against the greenfield lens (fix it right, now) and the
      fold-don't-drop smallness doctrine (clarification 30). This refines
      clarification 19's disposition and the residue-handling of the
      trust-builtin clarification (the review skills' unfixed residue is now
      classified into fix-cheap / defer-expensive, not filed wholesale); the
      three-way structure and its adversarial-confirm requirement are otherwise
      unchanged. First application: PR #2865 (tactic-graph-digest-tooling) fixed
      4 confirmed correctness/hardening findings plus cheap
      reuse/efficiency/convention improvements in scope and deferred two large
      refactors (a near-duplicate O(n²) inverted index, closure memoization) to
      tactic-graph-digest-quality-followups. Implementation retained as draft
      tactic-review-cheap-fix-disposition. Recorded 2026-07-13 interview."
  - question: After a node worker terminates, is its session removed from the agents
      list — and does an escalation-parked session stay for the author to
      engage?
    answer: "Reaped on every terminal exit — clean advance and escalation-park
      alike. The legacy gh router's Stop hook removed a worker session that
      terminated without variance and needed no author follow-up (via
      dispatch-self-close — `claude rm <job-id>`, foreground-safe: a no-op for
      an interactive session) so it did not clog the agents list; the node-lane
      branch of that same Stop hook currently does nothing for a node worker
      'parked or clean' (dispatch-stop.sh), so completed and parked node-worker
      sessions accumulate in `claude agents --json`. The requirement carries
      over, and graph-native doctrine widens it: because session persistence is
      already demoted — sessions are disposable executors that live exactly as
      long as their one phase (the disposable-session clarification), session
      recovery is never router substrate (the worker-death clarification), and
      every office_hours park writes its recoverable context into the NODE, not
      the session (session attach/resume is not a supported recovery path) —
      nothing durable lives in a terminated session, so the agents list should
      hold only LIVE executors and an escalation-parked session is reaped too.
      This diverges from the rival session-as-observability framing (keep
      escalated sessions visible in the agents list as a live cue): escalations
      surface through the office-hours dashboard's PARKED panel, which reads the
      node's office_hours field, so a lingering agents-list entry adds no signal
      and re-couples observability to session persistence — the coupling the
      disposable-session clarification exists to reject. Mechanism (retained as
      draft tactic-graph-node-session-reap, 'stop hook or otherwise' per the
      requirement): the node-worker branch of the Stop hook calls the existing
      foreground-safe self-close primitive on its terminal exit, after the
      escalation-park backstop runs so the node's office_hours is durable before
      the session is removed. Edge cases resolved: (a) foreground-safe gate —
      only managed background worker jobs are reaped; interactive align and
      office-hours human sessions (CLAUDE_JOB_DIR-gated) are never auto-removed;
      (b) failure-containment consistency — reaping releases the node-id
      worktree claim (worktree_has_live_session goes false), which correctly
      makes the next phase selectable after a clean advance and lets the
      no-progress fuse count re-selections after a silent no-transition exit, so
      it does not weaken the router-failure-containment condition; (c) a worker
      that dies mid-phase without firing a clean Stop (a hard crash) is
      variance, out of scope for this self-reap — its orphaned job is reaped by
      the tick/sweep ledger pass that already GCs the stale worktree (retained
      in the draft tactic). Recorded 2026-07-16 interview. (Amended 2026-07-19:
      reaping remains the DEFAULT and the doctrinal behavior, but is now
      configurable via a default-off operator escape hatch that keeps a
      completed/parked session for local inspection — see the 2026-07-19
      configurable-auto-close clarification. \"Reaped on every terminal exit\"
      describes the default; when the keep-sessions toggle is ON, a kept session
      is intentional, not a clog, and its node-id claim is held until manual
      reap.)"
  - question: "A strategy whose signal is validated only by human work (sensor:
      owner review at office-hours) is re-selected for /align-tactics every tick
      — its rounds produce off-path tooling plus born-parked on-path reading
      chunks, never a claude-executable on-path tactic, so the coverage gate
      never trips and clarification 3's fresh-reading gate never fires. Why, and
      what is the fix?"
    answer: >-
      A strategy whose signal is validated only by human work (sensor: owner review at office-hours) is re-selected for /align-tactics every tick — its rounds produce off-path tooling plus born-parked on-path reading chunks, never a claude-executable on-path tactic, so the coverage gate never trips and clarification 3's fresh-reading gate never fires. Why, and what is the fix? — See body §Phase Transitions & Fix State for the full mechanism. Recorded 2026-07-16 interview.
  - question: A tick performs scriptable non-worker work (e.g. a scope-stale demote)
      and then ends having launched no worker — a SPAWN_N slot spent on a
      metadata write. What is a tick's completion contract when scriptable work
      and worker spawning would compete?
    answer: "They never compete: a tick runs in two ordered phases — (1) ALL
      scriptable, non-worker dispositions to completion, then (2) one
      worker-group selection-and-spawn sized to the pace target against the
      state phase 1 produced. Phase 1 is every graph-mutating disposition the
      tick owes with no live worker: the reconcile sweep, scope-staleness
      demotes, out-of-band absorptions, parks, node reaps, failure-fuse
      accounting, and census births. Phase 2 selects and spawns the worker
      group. Because scriptable work completes before selection, it never
      consumes the worker budget — SPAWN_N counts workers actually LAUNCHED, not
      selection slots a metadata write can silently spend. The live failure this
      fixes: a manual tick selected one node, that node scope-stale-demoted at
      launch (provision exit 13), and the tick ended with 0 workers though
      SPAWN_N=1 and headroom=5 — the demote, a phase-1 disposition, had wrongly
      run in phase 2 and eaten the only budget slot. Mechanism: the
      scope-staleness comparison moves ahead of selection into the sweep, so a
      demotion is a phase-1 disposition and phase-2 selection then spawns the
      demoted node at its new implement phase (implement never re-demotes, so
      this terminates) or the next-ranked task. The launch-time start gate (the
      two gates bracketing the worker) stays as the safety re-check for state
      that moved AFTER the sweep — a concurrent author/session edit between
      phase 1 and spawn — whose rare skip falls to next-tick re-selection, the
      death-recovery path, not a routine under-fill. Invariants unchanged:
      claim-lifetime 'ends at spawn' (now the tick's FINAL spawn), the
      reservation-ledger claim taken under the selection lock, and next-tick
      re-selection as the worker-DEATH recovery path. Boundary: the contract
      binds whenever SPAWN_N>0; auto-mode at the pace target selects and spawns
      nothing, and phase-1 dispositions still run. Implementation retained as
      draft tactic-tick-scriptable-then-spawn. Recorded 2026-07-16
      /align-strategy interview (author-confirmed contract: each tick performs
      all scriptable non-worker work, then spawns the next worker group)."
  - question: "Now that GitHub Issues are disabled repo-wide (has_issues: false),
      how does fix-checks track a CI flake and gate the source tactic on the
      fix, on the node lane?"
    answer: "A tactic node, not a GitHub issue, replaces /file-issue's
      flake-tracking role: on is_flake==true, fix-checks finds-or-creates a
      fingerprint-keyed tactic node (fingerprint, reproduce command, and
      diagnosis in the body — the same content the GH issue body used to carry)
      and sets blocked_by:[<that tactic>] on the source tactic. No office-hours
      escalation — this mirrors legacy's own flake path (file + block +
      queue-skip, no park), and the router's existing blocked_by-completeness
      gate (packages/intentionsutil/src/router.ts's blockersComplete: absence or
      phase:done completes a blocker) already re-surfaces the source tactic once
      the flake-fix tactic reaches phase:done — no new auto-resume mechanism is
      needed, only correct edge modeling. Steelman considered and declined: a
      centralized flake registry (tracking fingerprints as a set rather than N
      one-off tactics) would make recurrence more visible, but parsimony favors
      reusing the existing tactic+blocked_by primitive for a problem that hasn't
      yet shown volume — dispatch-flake-dedup's fingerprint-matching logic ports
      to search tactic nodes instead of gh issues without a new node kind;
      recurring volume is a future re-evaluation trigger, not something to
      pre-build for. This closes a coverage-matrix gap
      (tactic-graph-native-dispatch.md §4): the matrix mapped /file-issue's and
      /plan-issue's DIRECT callers, but fix-checks invokes /file-issue
      internally as a flake-tracking primitive — an uncovered indirect case,
      consistent with this strategy's own 'no dispatch surface re-enables a
      disabled GitHub feature' clarification (the legacy flake path's
      GitHub-Issues dependency is itself the defect, not license to re-enable
      Issues). Retained as tactic-fix-checks-graph-native-flake-tracking (draft,
      parent tactic-graph-native-dispatch) for a later /align-tactics planning
      pass — porting dispatch-flake-dedup's dedup logic, updating
      fix-checks/SKILL.md's Flake sub-path, and the flake-tactic id/slug
      convention are implementation decisions for that round. Applied
      immediately to PR #2880's own park as a worked example:
      tactic-baseline-proxy-float-tolerance (serves strategy-token-economy)
      tracks the concrete fix, and tactic-phase-standup-audit-lens's
      office_hours was cleared with blocked_by set to it. Recorded 2026-07-16
      interview."
  - question: "A node's `reviewed` marker is written but its PR is not yet merged
      (it sits at `phase: review` awaiting the tick's merge) — does the selector
      keep dispatching a review worker to it, and what is its remaining
      lifecycle?"
    answer: >-
      A node's `reviewed` marker is written but its PR is not yet merged (it sits at `phase: review` awaiting the tick's merge) — does the selector keep dispatching a review worker to it, and what is its remaining lifecycle? — See body §Phase Transitions & Fix State. Recorded 2026-07-18 interview.
  - question: An office-hours drain session fixed a parked node and pushed the fix,
      but the office_hours park was left set — the node was even re-parked
      before a later session finally cleared it
      (tactic-phase-standup-audit-lens, 2026-07). Clarification 4 says a park
      clears as a side effect of "any interactive-session commit touching the
      node." Why didn't that fire for the drain lane, and what must a drain
      session do at termination?
    answer: "Clarification 4's side-effect clear only fires when a commit touches
      the parked node's own frontmatter, but a self-modification drain session's
      fix commit lands on the PR branch and never touches the node's
      office_hours field — so nothing clears the park incidentally, and the
      separate clear-park graph-commit to main is not forced by session
      termination and was forgotten (the observed park -> drain -> re-park ->
      clear sequence on tactic-phase-standup-audit-lens). Requirement: the
      self-modification drain lane must terminate with a MANDATORY explicit park
      disposition executed through a scripted atomic primitive — clear-park
      <node-id> [note] on green CI (office_hours -> null landed on main via
      graph-commit), or re-park via park-node with an updated reason on red or
      blocked CI — and never leave a drained node in an ambiguous still-parked
      state. This refines clarification 4, it does not replace it: clarification
      4's incidental side-effect clear remains the mechanism for the read-only
      human office-hours lane (which drains nothing and legitimately never
      un-parks, per .claude/skills/office-hours/SKILL.md:374-378); the drain
      lane adds an explicit terminal disposition on top of it. The disposition
      must be a single scripted graph operation — the inverse of park-node — not
      a hand-rolled inline readNode -> office_hours=null -> writeNode ->
      graph-commit sequence, precisely so it cannot be partially completed,
      skipped, or forgotten between the fix push and session end. This
      generalizes the one-off manual clear-park sequence noted at
      tactic-tick-scriptable-then-spawn body (the clear-park inverse of
      park-node) into a first-class primitive. Implementation retained as draft
      tactic tactic-clear-park-primitive. Recorded 2026-07-18 interview."
  - question: How is the CI-fix interrupt modeled — as a `phase` enum value or as
      orthogonal execution state — and what is the migration off the phase-value
      encoding?
    answer: >-
      How is the CI-fix interrupt modeled — as a `phase` enum value or as orthogonal execution state — and what is the migration off the phase-value encoding? — See body §Phase Transitions & Fix State for the full mechanism. Recorded 2026-07-18 /align-strategy interview.
  - question: The dispatch phase-worker skills carry ad-hoc names (/align-tactics,
      /implement, /fix-checks, /qa-fix, /review-fix, /qa-main, /fix-conflicts) —
      what naming convention should they take, and how does renaming
      /align-tactics reconcile with its align-family membership (clarification
      45)?
    answer: "A uniform dispatch-<phase> namespace for every skill the dispatch
      script invokes: dispatch-plan (from /align-tactics), dispatch-implement
      (from /implement), dispatch-fix (from /fix-checks, the CI-red interrupt of
      clarification 18), dispatch-qa (from /qa-fix), dispatch-review (from
      /review-fix), dispatch-main-qa (from /qa-main), plus dispatch-conflict
      (from /fix-conflicts) — a graph-native conflict skill that auto-resolves
      MECHANICAL conflicts (any conflict decidable from existing graph
      requirements) and parks to office_hours only on conflicts requiring author
      input on INTENTION, upgrading today's graph-commit-parks-on-any-conflict
      behavior (retained as draft tactic-dispatch-conflict-greenfield). The
      apparent collision with clarification 45 — which grouped /align-tactics in
      the align family — is resolved by redrawing the family boundary at
      records-vs-executes: the align family is the persistent-layer RECORDING
      interface (/align alone — virtues, strategies, traditions, delegations),
      and the dispatch-* family is the EXECUTION chain (plan then implement then
      fix then qa then review then main-qa, plus conflict).
      Planning/decomposition is execution, so /align-tactics becomes
      dispatch-plan and its interactive strategy-decomposition role continues as
      manual dispatch-plan invocation. /plan-issue is deprecated — superseded by
      dispatch-plan — and is deleted, not renamed
      (tactic-legacy-router-removal). Steelman (the branch=node-id claim
      invariant already makes target resolution uniform, so the rename is
      cosmetic): DIVERGED — a self-describing surface where skill name = phase
      is a first-class requirement for its own sake, not cosmetic, and it rides
      cheaply on the same atomic PR the input-contract change (clarification 68)
      already touches. Both the naming and the contract change are legitimate
      but LOW RANK (clarification 69). Implementation retained as draft
      tactic-dispatch-skill-rename. Recorded 2026-07-18 interview. (Amended
      2026-07-18 same day: the rides-on-the-same-atomic-PR sentence is corrected
      — the leaf-tactic rule holds one PR per leaf, so the two changes land as
      coordinated adjacent PRs: tactic-dispatch-skill-input-contract first,
      tactic-dispatch-skill-rename blocked_by it and sweeping the restructured
      skills after. See the migration-sequencing clarification.)"
  - question: How do the dispatch phase skills receive their input — today they
      infer the target from the worktree branch name, and only /align-tactics
      takes an explicit node-id argument?
    answer: "Each dispatch-* skill splits derivation (node to params) from execution
      (params to work): the skill core executes from explicit structured params
      — testable in isolation — and a thin front door accepts a node id and runs
      a derivation script that emits those params, replacing today's
      worktree-branch-name inference. Division of labor by invoker: the router
      always passes the computed structured params directly (it holds the node
      at selection, so it saves the derivation round-trip); the node-id +
      derivation-script front door is primarily the manual/author invocation
      path. The model to generalize is /align-tactics, which already takes an
      explicit node-id argument. Value: removes the hidden branch-name coupling,
      makes derivation and execution independently testable, and makes each
      skill user-invocable with either explicit params or a bare node id.
      Implementation retained as draft tactic-dispatch-skill-input-contract.
      Recorded 2026-07-18 interview."
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
    answer: 'Greenfield: the freeze becomes materiality-scoped at the source, not
      rank-gated at the selector. Today’s freeze conflates two separable
      judgments: materiality (does this edit affect this child’s plan at all?)
      and urgency (when must an affected child stop and reconcile?). The editing
      round — the one session holding both the delta and the author — classifies
      each stamped open child: an orthogonal child is re-stamped in the SAME
      graph-commit as the edit, so no freeze ever fires for it; a materially
      affected child is left stale and freezes exactly as recorded in the
      soft-freeze clarification, re-evaluating at its own rank. The selector
      already runs re-evaluation at the child’s own rank (the frozen-candidate
      emission in router.ts), so a low-rank change never preempts higher-ranked
      work even today — the defect was only the orthogonal-child tax: one
      re-evaluation session per stamped child whose likely verdict is
      "unaffected, re-stamp". Delta provenance: the per-strategy stamp widens
      from a bare hash to {hash, sha}, where sha is the origin/main commit whose
      strategy content the stamp was taken against — mirroring the tactic
      scope-custody stamp (the scope-fingerprint chain-of-custody clarification)
      — so a stale child recovers the exact delta mechanically via git diff
      <sha>..origin/main -- intentions/<strategy-id>.md instead of relying on
      dated-clarification archaeology. Steelman (the author’s rank-gate
      proposal: freeze a stale child only when the staling change’s carrier
      out-ranks it, firing later if the carrier is boosted above it): DIVERGED —
      rank is not a proxy for materiality (a low-rank change can still
      invalidate a high-rank child’s plan: the skill rename renames the very
      skills tactic-align-skills-latest-graph-guard’s plan edits); an
      unconditional rank gate lets workers knowingly execute superseded scope;
      and attributing a bare hash mismatch to a ranked carrier needs the same
      provenance substrate anyway. Rank incorporation instead rides existing
      machinery: re-evaluation competes at the child’s own rank, and a
      must-land-first migration carrier acquires blocked_by edges from affected
      children (see the migration-sequencing clarification), whose backward
      attention-compounding boosts the carrier in proportion to what it blocks.
      Brownfield (backwards-incompatible for stamp readers, so sequenced;
      executable units live in draft tactic-materiality-scoped-freeze): (1)
      additive — schema accepts string | {hash, sha} as the map value, staleness
      reads the hash in either form; (2) new stamps write {hash, sha}; (3)
      bare-hash stamps migrate opportunistically at each re-stamp; (4) drop the
      bare-string form; skill-side, /align-strategy’s step-5 soft-freeze warning
      becomes the classification-and-re-stamp step. The three edits now
      accumulated on the 9 currently-stale children (fix-orthogonal,
      skill-rename, this round) reconcile via the author’s already-planned
      re-evaluation sweep — this doctrine applies from the next edit round on.
      Recorded 2026-07-18 /align-strategy interview. Corrected same-day
      2026-07-18: the motivating premise overstated the live blast radius — none
      of this strategy’s open children carry a map-form stamp yet (stamping
      starts as align rounds land it), and the selector’s live freeze events all
      trace to legacy bare-string stamps on OTHER strategies’ children, so the
      three 2026-07-18 edits froze zero children mechanically; until stamp
      coverage exists, the re-evaluation obligation on this strategy’s open
      subtree is doctrinal (the soft-freeze clarification), not stamp-enforced.
      The norm this correction demonstrates: prose-level record corrections are
      never deferred for freeze cost — the graph tracks greenfield state, prose
      included, and an editing round pays exactly the materiality of its change
      (this correction: zero freezes, one commit). A legacy bare-string stamp
      converts to map form only in a re-evaluation round of a strategy it
      actually serves, carrying the old string into the entries of the
      strategies that round did NOT reconcile so their freeze is preserved
      (absent-from-map would silently unfreeze them). Recorded 2026-07-18
      /align-strategy interview, same-day correction.'
  - question: Does the graph need first-class structure for sequencing brownfield
      migrations of backwards-incompatible changes, and how do in-flight tactics
      link to a migration that must land before their work?
    answer: "No new structure — existing edges suffice. A backwards-incompatible
      change records its greenfield target and ordered migration in the strategy
      (the fix-orthogonal-execution-state clarification is the pattern) and
      carries execution in a carrier tactic: one atomic PR with ordered units in
      the tactic body when the migration fits a single PR
      (tactic-fix-interrupt-orthogonal-state), or a parent tactic with children
      sequenced by blocked_by edges (validateGraph rules 6/13/15) when it spans
      PRs. The one real gap was the LINK from materially affected in-flight
      tactics to the migration: the editing round adds a blocked_by edge from
      each affected child to the carrier when the migration must land before
      that child’s work — which both gates selection and back-compounds
      attention onto the carrier, pricing the migration by what it blocks (the
      emergent rank incorporation of the materiality-scoped-freeze
      clarification). A first-class attributes.migration record is DECLINED by
      parsimony until a sensor needs machine-readable migration state. Recorded
      2026-07-18 /align-strategy interview."
  - question: Does dispatch's concurrency dedup key on live sessions or worktree
      existence, and does the office-hours lane share the mechanism
      (office-hours sessions safe for concurrent selection)?
    answer: "Live sessions, uniformly, for every launch mode including office-hours
      — confirmed 2026-07-18 as the target-state mechanism. The dedup /
      claimed-set keys on liveness: a node is skipped only when a
      reservation-ledger marker named by its id exists OR
      worktree_has_live_session reports a live node-id-named session (claude
      agents --json) — never on worktree existence. A bare or un-reaped
      .claude/worktrees/<node-id> whose session has ended does NOT block
      selection (the shipped graph-select-target behavior; the #1474 change
      moved existence-keying to liveness-keying precisely so an unreaped
      worktree cannot block the next worker). Worktree reaping is decoupled
      post-merge disk hygiene — dispatch-sweep removes a worktree after its PR
      merges and the tree is in-sync, guarding on worktree_has_live_session
      first — never a selection gate; what makes a node's next phase selectable
      is the transition write flipping phase on origin/main plus the prior
      session ending (its claim clears). The office-hours lane shares this exact
      mechanism: (a) the graph-native office-hours lane runs IN the node-id
      worktree for its session's life so its live session is detectable, and
      that worktree is disposable — reaped like any worker's, since office-hours
      lands no commit; (b) office-hours-select gains the same liveness dedup —
      an untargeted (queue-head) launch SKIPS a parked node that already has a
      live office-hours session and returns the next-ranking parked node (the
      concurrent-selection safety this round records); (c) an explicit
      /office-hours <node-id> targeting a node that already has a live
      office-hours session RETURNS AN ERROR — a deliberate human target on an
      occupied node is a collision to surface, not a silent fall-through.
      Consistency correction: tactic-align-session-claiming Unit 3's recorded
      prescription — 'graph-select-target treats ANY existing
      .claude/worktrees/<node-id> as a held claim' (existence-keyed) — is
      superseded by this liveness mechanism (#1474), contradicts its own Unit 1
      (which states the liveness rule), and describes the pre-#1474
      worktree-walk that was deliberately replaced; the shipped code is already
      liveness-keyed, only the recorded tactic text is stale (tracked by draft
      tactic-align-session-claiming-liveness-correction). Implementation
      retained as draft tactic-office-hours-concurrency-dedup. Recorded
      2026-07-18 interview."
  - question: A scope-inert align annotation on an in-flight tactic's body — the
      reconciliation notes amendment-completeness mandates — trips the tactic
      scope-custody gate and demotes the whole ladder. Does materiality-scoping
      extend to the scope-custody stamp, and by what mechanism?
    answer: "Yes — greenfield: the materiality principle ('an editing round pays
      exactly the materiality of its change', clarification 70) extends to the
      tactic scope-custody stamp, closing the seam in the chain-of-custody
      amendment (clarification 39) between its intent ('if the re-evaluation
      confirms without amending, nothing re-runs') and its mechanism: recording
      the confirmation is itself a body edit, so tacticScopeFingerprint trips
      and demotes. Observed 2026-07-18: an align round's scope-inert
      Interim-mechanism note on tactic-graph-selector-reviewed-exclusion demoted
      a fully-reviewed node (PR #2888, green CI) review -> implement; the tax is
      three phase sessions per annotation, since demote-to-implement discards qa
      and review custody. Mechanism — sanctioned re-stamp, worktree-locality
      preserved: the stamp stays a worktree-local file, never a per-launch graph
      write (clarification 39's design stands); an author-present align round
      (/align-strategy or /align-tactics — the interview holds both the delta
      and the author, the same classifier trust clarification 70 records) that
      classifies its own tactic-body edit as scope-inert re-stamps
      .claude/worktrees/<id>.scope-fingerprint to the post-edit
      tacticScopeFingerprint plus the current origin/main sha in the same round,
      recording the classification in the round's record — mirroring the
      transition writer's machinery refresh (which stands unchanged) rather than
      moving the stamp into the node. Fail-closed classification: only a
      confident scope-inert verdict re-stamps; any doubt leaves the stamp
      untouched and custody demotes as recorded, and a material edit is left
      stale exactly as today. Phase workers, qa/review sessions, and the tick
      never re-stamp. Steelman (keep the gate purely mechanical; accept the
      demotion tax as misclassification insurance): DIVERGED — the annotations
      are doctrine-mandated (clarification 38 records reconciliation in the
      node), so the tax recurs structurally, and the strategy-stamp side already
      rejected the same orthogonal tax with the same classifier. Net guarantee
      unchanged: merge still requires an unbroken implement -> qa -> review
      chain against the merge-time scope fingerprint — a re-stamp asserts, under
      author presence, that the post-edit fingerprint IS that same scope.
      Executable carrier: draft tactic-scope-inert-restamp-primitive (re-stamp
      script plus align-skill step); bootstrap until it lands: the round
      refreshes the stamp by hand — write '<tacticScopeFingerprint(statement,
      body)> <origin/main sha>' as the stamp file's one line, the 2026-07-18
      remediation's proven recipe. Recorded 2026-07-18 interview."
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
    answer: "Root cause, from the selection/routing logs and git history: the 20:57Z
      strategy edit (e7d20df0, the provenance-lint round) landed without the
      materiality classify-and-re-stamp step, staling the one map-stamped open
      child (tactic-graph-selector-reviewed-exclusion); the next tick's
      soft-freeze scan then swept ALL open children into frozenTacticIds — the
      re-surface set of the frozen-tactic-dispatch clarification is the whole
      subtree, not the stale children — and the top-ranked unclaimed child
      (tactic-review-phase-trust-builtin-review, own stamp null, plan untouched
      by the edit) was dispatched to /align-tactics; its session then read a
      stale worktree checkout and concluded no work existed. Coverage verdict,
      three-way split: (1) the freeze firing at all on an orthogonal edit is
      fixed by tactic-materiality-scoped-freeze (PR #2892) once editing rounds
      classify-and-re-stamp; (2) the stale-worktree worker read is fixed by
      tactic-align-skills-latest-graph-guard (PR #2889), whose Hole-2 closure
      routes align sessions through provision-node-worktree's fetch-and-merge
      re-entry; (3) not covered anywhere: when a freeze legitimately fires,
      suppression and re-surface still take the WHOLE subtree, contradicting the
      same-commit orthogonal classification and sweeping null-stamped children a
      sibling's staleness says nothing about — retained as draft
      tactic-freeze-resurface-stale-children-only (narrow both frozenTacticIds
      uses to stale-stamped children only). The subtree-conservatism rival
      framing (a materially drifted strategy makes every child's plan suspect,
      so the full sweep is deliberate) was put to the author and DIVERGED from:
      under the materiality doctrine the editing round's per-child
      classification is the authority on who is affected; a blanket sweep
      re-litigates it. Both fix carriers were boosted to the top of the
      discretionary frontier (boost 61, composed rank 66.33, above the then-max
      66.00) by author direction this round. This edit itself fired zero
      freezes: at c2a909c7 the strategy has no map-stamped open children (the
      stale stamp cleared when its carrier closed), so no classify-and-re-stamp
      was owed. Recorded 2026-07-18 /align-strategy interview."
  - question: Does a deliberate human dispatch — the bare /dispatch fan-out picking
      the highest-ranking available node, or an explicit dispatch <node-id> —
      bypass the absolute max_concurrent_workers ceiling, or only the pace
      curve?
    answer: "Yes, for exactly one node — a bounded single-node override. Human
      dispatch already overrides the pace curve (clarification 49); it
      additionally bypasses the absolute max_concurrent_workers ceiling
      (clarification 33) for the single highest-ranking *available* node (bare
      /dispatch) or the single named node (dispatch <node-id>), launching it
      even when live == max_concurrent_workers. Fan-out WIDTH beyond that one
      node still honors the ceiling: below the cap a bare /dispatch fills
      headroom as before; at or above the cap it degrades to launching exactly
      the one top-ranked available node (+1 over the ceiling), never a wider
      over-spawn. The two hard floors clarification 49 already names stay hard
      for the single-node guarantee too: it never preempts a node already
      claimed (it takes the next-highest available), and it never fires under
      genuine token exhaustion (the --exhausted floor). This aligns the graph
      lane with the issue lane, whose explicit dispatch <issue-number> path
      already resolves-and-exits before selection and so launches its one node
      without consulting the ceiling at all. Why bounded rather than a hard
      ceiling or an unbounded bypass: the ceiling's purpose (clarification 33)
      is to keep autonomous overlapping ticks from compounding to a runaway
      worker count — a property about autonomous selection, not about a
      conscious, low-frequency human act; and the excess is transient and
      self-correcting because the human-launched worker enters the reservation
      ledger like any other, so the next autonomous tick counts it and spawns
      nothing more until it drains. The steelman for an inviolable ceiling — a
      human should raise max_concurrent_workers or wait, never exceed it — was
      considered and diverged from: it would leave a saturated fleet unable to
      honor an explicit human priority, the exact moment the override exists
      for, and it is inconsistent with the issue lane, which already exceeds the
      ceiling for its one node. Repeated human invocations each floor to one
      node, so a deliberately-repeated dispatch can transiently reach max+N;
      this is accepted as deliberate human action, parity with repeated explicit
      issue-dispatch. Live gap: the #1458 bare-fan-out code
      (dispatch-select-tick) currently treats max_concurrent_workers as a hard
      ceiling and emits concurrency-cap at HEADROOM=0, contradicting this —
      tracked by tactic-manual-dispatch-single-node-headroom. Recorded
      2026-07-18 interview."
  - question: When a phase skill delegates a unit to a subagent (the main thread
      never edits files), what guarantees the subagent's writes land in the
      launching worktree rather than the primary checkout?
    answer: "Nothing currently — and the gap is load-bearing. The Agent tool pins a
      spawned subagent's cwd at launch to the primary checkout
      (~/natb1/commons.systems), not the launching worktree, so a subagent that
      writes via a relative path silently lands its edits in the primary
      checkout while the worktree keeps a clean git status — the entire unit is
      lost with no error (observed live 2026-07-19 in Unit 1 of
      tactic-otel-sensor-substrate: the implementation subagent wrote
      otel-trial-notes.md into the primary checkout's .claude/skills/, requiring
      manual detection and relocation). The subagent-worker execution contract
      therefore carries an implicit invariant it does not enforce: subagents
      operate on the launching worktree, not the primary checkout. The fix is
      prevention plus a backstop — the implementation-subagent prompt contract
      passes the absolute worktree root and mandates absolute paths under it,
      and /implement-unit adds a post-subagent contamination guard that fails
      loudly when a subagent's writes land outside the worktree — tracked as
      tactic-subagent-cwd-worktree-guard. This is distinct from the
      primary-checkout-on-main invariant (tactic-primary-checkout-main-guard):
      that keeps the primary checkout ON main; this keeps subagent WRITES OUT of
      it. Recorded 2026-07-19 interview."
  - question: Clarification 58 (2026-07-13) retained its 5-layer resolution ladder
      in tactic-graph-commit-auto-serialization as an in-script graph-commit
      upgrade, and clarification 67 (2026-07-18) retained
      tactic-dispatch-conflict-greenfield as a model-driven skill for the same
      conflict upgrade without referencing the earlier draft — which vehicle
      owns which ladder layer?
    answer: "The ladder partitions across both vehicles by what each can host —
      ratified by the author at the 2026-07-19 office-hours review that cleared
      both tactics' 2026-07-19 parks. graph-commit the SCRIPT owns the
      deterministic mechanical layers: (1) git three-way rebase auto-merge
      (exists today), (2) structural field-level / list-union frontmatter merge
      (net-new code — no merge or field-union helper exists in
      packages/intentionsutil/src — with test-graph-commit.sh coverage), (3)
      stale --base auto re-read/re-apply. The dispatch-conflict SKILL owns the
      model layers: (4) scoped model reconciliation as a skill-thread opus
      subagent in the fix-conflicts resolved/ambiguous verdict shape, under
      clarification 58's model scope guard verbatim, and (5) the true-conflict
      office_hours park carrying both divergent values plus a recommendation.
      The seam: when layers 1-3 cannot resolve, graph-commit exits with a
      structured mechanical-unresolved state (alongside landed and parked) that
      dispatch-conflict consumes; tactic-dispatch-conflict-greenfield is
      blocked_by tactic-graph-commit-auto-serialization to encode the ordering.
      Grounds for the vehicle split: no bash script in the repo performs a
      scoped model eval — model-resolution steps run only as SKILL.md-driven
      subagents (the fix-conflicts pattern) — so the script cannot host layers
      4-5 as the 2026-07-13 draft assumed; conversely, pushing layers 1-3 into
      the skill would move deterministic, unit-testable merge logic behind a
      model. Accordingly tactic-graph-commit-auto-serialization narrows to
      layers 1-3 (narrowed, not pruned: that scope is real net-new deterministic
      code distinct from the model layers) and
      tactic-dispatch-conflict-greenfield owns layers 4-5 on top of its rename
      scope; both parks clear in this round's commit. Clarification 58's ladder
      doctrine, scope guard, and claim-narrowing stand unamended — only the
      implementation-vehicle assignment is amended. This entry also cures the
      record-completeness defect (condition 7 / clarification 31) of the
      2026-07-18 round: clarification 67 re-derived the conflict upgrade without
      reconciling the 2026-07-13 draft, the gap that parked both tactics on
      2026-07-19. tactic-claim-dedup-only (scheduling dedup) is orthogonal to
      conflict resolution and unaffected. Recorded 2026-07-19 /align-strategy
      round."
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
      tactic-worker-self-close-configurable. Recorded 2026-07-19 interview."
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
    - a node-worker session is reaped from the agents list on every terminal
      exit — clean advance and escalation-park alike — via the foreground-safe
      self-close primitive (`claude rm`; interactive sessions exempt), because
      nothing durable lives in a terminated session (an office_hours park's
      context is written into the node, not the session); the agents list holds
      only live executors, escalations surface via the office-hours PARKED panel
      rather than a lingering session, and a completed or parked worker job left
      in `claude agents --json` is a defect UNLESS the default-off keep-sessions
      operator escape hatch (2026-07-19 configurable-auto-close clarification)
      is enabled, in which case a kept session is intentional and its node-id
      claim is held until manual reap; auto-close (reap on every terminal exit)
      is the default and doctrinal behavior, and the toggle is never router
      substrate
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

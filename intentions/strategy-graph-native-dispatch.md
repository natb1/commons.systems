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
  being); and the align skill family — /align-init for fork onboarding and
  virtue review (retiring the legacy /align skill), /align-strategy for
  recording strategy under interview, /align-tactics for breaking a strategy
  into executable tactic subtrees — supersedes /file-issue and /plan-issue as
  the interface for intent entering execution. The legacy gh router runs
  concurrently until the gh queue drains, then it is removed; full /file-issue
  and /plan-issue coverage is mapped into the align family before removal
  (coverage matrix retained as draft content on tactic-graph-native-dispatch)."
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
    answer: Persisted. The tactic node stores an explicit phase field the router
      transitions; PR draft state and CI are demoted from ground truth to
      sensors the router reads before committing a transition. This deliberately
      reverses the 'no persisted state machine' principle of the gh-era router —
      the graph is the state machine now. Out-of-band gh events (a hand-merged
      PR) are absorbed by a reconciler sweep, not by re-derivation. Recorded
      2026-07-03 interview.
  - question: How do concurrent sessions record graph edits safely, given a record
      must land on origin/main before it is schedulable?
    answer: "One write path: every graph edit — strategy records, tactic breakdowns,
      phase transitions, readings, parking — is a single-node commit pushed
      directly to main with a rebase-retry loop, restricted to intentions/
      paths. One file per node keeps concurrent-session conflicts rare, and a
      same-node race surfaces as a rebase conflict rather than a silent clobber.
      The strategy-substance audit that a PR checkpoint would have provided is
      supplied instead by the /align-strategy interview itself — substance is
      human-decided live, before the write. Recorded 2026-07-03 interview."
  - question: A strategy's tactics all complete but its signal is still unvalidated
      — what stops /align-tactics from burning rounds forever?
    answer: A fresh-reading gate plus a round cap. After a tactic round completes,
      the strategy is re-eligible only once its sensor produces a reading newer
      than the round's completion; after two rounds without validation it parks
      to office-hours with the round history as the why. A null reading counts
      as not-validated, but the first round must then include a tactic that
      makes the sensor runnable — a strategy that cannot be measured must first
      buy its own instrument. Recorded 2026-07-03 interview.
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
      enhancement label. Recorded 2026-07-03 interview."
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
      interview."
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
    answer: "Bootstrap-transition doctrine. Parity with the legacy router means the
      completing worker's state write to origin/main is what schedules the next
      phase worker (dispatch-complete-phase parity): selection reads main, so a
      phase that ends without the write schedules nothing. Until
      tactic-graph-router-transitions and tactic-graph-commit are live, every
      session completing a phase on a graph-native tactic must itself end the
      phase with the transition write to main — phase (implement -> fix/qa ->
      review -> done, per the CI-verdict and mergeability sensors), execution.pr
      when the work PR opens, attempt counters, and markers. The write is a
      state-only intentions/ commit, never part of the work PR (the work PR
      merges at the end of the lifecycle; state must land on main while it is
      still open): direct-pushed once tactic-intentions-branch-protection lands,
      delivered as a state-only PR the author merges until then. Fields ride
      squatted attributes.* until tactic-graph-dispatch-schema is on main, since
      main's validator gates the first-class shapes. Gap observed live
      2026-07-03: PR #2742 opened with the schema tactic still phase: implement
      on main, leaving qa/review/merge unscheduled. The doctrine retires when
      the transitions tactic lands. Recorded 2026-07-03 from author review."
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
      2026-07-04 interview."
  - question: Is the fix phase a linear step between implement and qa?
    answer: "No — fix is the CI-failure interrupt (it could be called ci-fix): a
      tactic enters fix from ANY of implement, qa, or review when its PR's CI
      verdict is failing, and once CI is green again the router resumes the
      ladder from where the tactic left off — it is not a station every tactic
      passes through between implement and qa. This is legacy parity:
      dispatch-phase checks mergeability and CI verdict BEFORE any phase-label
      logic, so a PR already past qa or review routes back to fix-checks on a CI
      regression. Distinct from the qa and review phases' own internal fix
      loops: qa-fix and review-fix repair QA/review-content findings locally
      (with their own attempt counters) before anything reaches CI, and those
      loops never pass through the fix phase — fix means exactly 'CI is red on
      this tactic's PR'. Recorded 2026-07-04 from author direction."
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
      the audit trail. Recorded 2026-07-04 interview."
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
    answer: "In the tactic's own lifecycle: main-qa is a phase of the source node,
      not a separate artifact (no gh carve-out — condition 1 holds absolutely).
      The legacy follow-up issue was a workaround for gh mechanics (issues close
      on merge, forcing a second artifact plus provenance markers plus orphan
      retriage); a persistent node with persisted phase needs none of it.
      Design: the Phase enum gains main-qa, between merge and done; qa records
      needs-main residue in a body section of the node instead of filing
      anything; the reconciler routes a merged tactic to main-qa when residue
      exists, else done; the router maps main-qa to the qa-main handler session
      under the uniform node-id machinery, gated on the prod deploy landing;
      outcomes keep qa-main parity — pass -> done (prune), broken -> an
      implement-chain bug tactic written via graph-commit then done,
      cannot-verify -> office_hours. Completion-prunes and round accounting move
      behind prod verification, so rounds.last_completed means verified-in-prod
      and the fresh-reading gate reflects verified reality. The phase ladder
      becomes main-qa -> review -> fix -> qa -> implement -> align-tactics.
      Rejected: a separate main-qa child tactic (recreates the two-artifact
      provenance/orphan problem and stamps rounds before verification),
      draft-and-finalize-later (unbounded verification latency; drafts are
      undecomposed context, this is fully-specified machine verification),
      sensor modeling (wrong altitude — signals measure the strategy's
      observable, not each shipped feature), and an implicit reconciler hold
      (hidden state, violates clarification 1). Recorded 2026-07-04 interview."
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
      interview."
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
      that executor bounded. Recorded 2026-07-06 interview."
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
      this round did. Recorded 2026-07-06 interview."
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
      before fan-out and clear each with its transition write."
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
      executors. This generalizes clarification 26 from parked work to the
      router itself: continuity is durable state on origin/main (persisted
      phase, claims, plans, residue sections) re-entered by the cron heartbeat;
      dead ticks, dead workers, and dropped queues recover by re-selection plus
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
      reaffirming clarifications 24/29 on greenfield re-evaluation, and the
      residual loss is closed by a durability rule, not a session mechanism.
      What a dead worker actually loses is reasoning-in-progress — findings not
      yet flushed to durable state; the node body's clean-session plan
      (condition 7), the node-id worktree with its commits and uncommitted edits
      (the re-selected worker roots in the same worktree, so in-flight file
      state lands in front of it per clarification 26's rule), and the PR with
      its phase comments all survive, and the ledger sweep already keeps a dead
      worker from blocking new selections. Workflow-session resume is
      technically unfit twice over: resume is same-session-only, unavailable
      exactly when the tick session is dead; and resume replays only completed
      agent() calls from cache — a worker that died mid-flight re-runs from
      scratch — so its best case equals re-selection at tighter coupling to the
      rented executor. Transcript reconstruction is negative expected value as
      router machinery: the node body already carries everything a fresh session
      needs, so the transcript's marginal information over plan + worktree diff
      + PR comments is small; reading a long transcript costs a significant
      fraction of redoing the reasoning and inherits whatever confused state
      killed the session; and it would make the harness's proprietary transcript
      format load-bearing for the router — reversing clarification 26's demotion
      of session persistence and running against the thin-script capture bound
      (clarification 25). recover-api-error stays a human-invoked legacy-lane
      tool and never becomes router substrate. The remaining gap — an expensive
      phase dying with its findings only in conversation — is closed by the
      checkpoint discipline (new condition 9): phase progress whose only home is
      the session is a defect; workers flush findings to durable state at
      natural boundaries (worktree commits for file work; PR comments for QA
      triage and review findings as produced, not only at phase end; node body
      sections for residue), and a re-selected worker treats pre-existing
      worktree/PR state as resume input — diff against the branch base and read
      prior phase comments before redoing anything. This bounds a dead worker's
      redo cost to one checkpoint interval with zero new harness coupling.
      Skill-side encoding retained as draft tactic-phase-checkpoint-discipline.
      Recorded 2026-07-06 interview."
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
      scope edit (clarification 15). Recorded 2026-07-06 interview."
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
tooling_goals:
  - kind: actuator
    statement: /align-strategy — interview-driven strategy recording, superseding
      /file-issue requirements definition
  - kind: actuator
    statement: /align-tactics <strategy-id> — break a strategy into PR-sized tactic
      nodes with clean-session plans, superseding /file-issue epic structuring
      and /plan-issue
  - kind: actuator
    statement: "/align-init — fork entrypoint: orient, validate deployment, review
      virtues, delegate to /align-strategy; retires the legacy /align skill"
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
attributes:
  conditions:
    - the legacy gh router only drains existing issues; no new work enters via
      gh once /align-strategy is live — the graph is the sole issue tracker, bug
      tracker included, with no side-channel work records
    - direct-push commits stay restricted to intentions/ paths and rebase-retry
      conflict cost stays negligible at fleet concurrency
    - strategy-graph-drives-dispatch holds — resolved rank from the graph orders
      execution
    - strategy substance stays human-decided in the /align-strategy interview;
      the skill records, it does not derive
    - workflow scripts stay thin composition — selection, transition, and
      provisioning mechanics live in owned, offline-testable code (tsx modules
      and primitive scripts) that workflow agents invoke; the Workflow executor
      orchestrates but never becomes the sole home of router logic
    - every office_hours park writes recoverable context into the node at park
      time — reason, a best-next-steps recommendation
      (office_hours.recommendation), and any state a fresh session needs;
      session attach/resume is not a supported recovery path, so a park whose
      context lives only in the parking session is a defect
    - /align-strategy records in the graph, at record time, all context a fresh
      /align-tactics session needs to decompose or re-evaluate — strategy
      substance plus draft-tactic bodies; same-session /align-tactics execution
      is a bootstrap safety, not a carrier, and a decomposition blocked on
      unrecorded interview context is a defect of the recording round
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
    - interactive graph-reading skills (/align-strategy, /align-tactics,
      /align-init, the office-hours review) begin analysis only against
      freshly-fetched origin/main state — cut the session worktree from
      origin/main or hard-fail a pre-analysis freshness check, with a fetch that
      cannot reach origin failing the session rather than proceeding on the
      local tree; a prose-only freshening step is a backstop, not the mechanism,
      and analyzing a stale local checkout (a session tree behind origin/main)
      is a defect — distinct from, and the inverse of, the content-staleness
      hazard on strategy-explicit-intent (the graph lagging reality)
---
# Dispatch runs on the graph — orchestration state lives in intention nodes, worked through the align skill family

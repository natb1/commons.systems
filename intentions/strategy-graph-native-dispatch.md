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
      and tactics, transitions persisted phase, direct-push rebase-retry writes
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
attributes:
  conditions:
    - the legacy gh router only drains existing issues; no new work enters via
      gh once /align-strategy is live
    - direct-push commits stay restricted to intentions/ paths and rebase-retry
      conflict cost stays negligible at fleet concurrency
    - strategy-graph-drives-dispatch holds — resolved rank from the graph orders
      execution
    - strategy substance stays human-decided in the /align-strategy interview;
      the skill records, it does not derive
---
# Dispatch runs on the graph — orchestration state lives in intention nodes, worked through the align skill family

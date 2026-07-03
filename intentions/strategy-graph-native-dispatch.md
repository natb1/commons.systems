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
  being); and the align skill family — /align for fork onboarding and virtue
  review, /align-strategy for recording strategy under interview, /align-tactics
  for breaking a strategy into executable tactic subtrees — supersedes
  /file-issue and /plan-issue as the interface for intent entering execution.
  The legacy gh router runs concurrently until the gh queue drains, then it is
  removed; full /file-issue and /plan-issue coverage is mapped into the align
  family before removal (coverage matrix retained as draft content on
  tactic-graph-native-dispatch)."
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
      the store, draft bodies are hand-maintained (safe interim: backfill never
      touches sourceless tactics). Recorded 2026-07-03; supersedes this record's
      own first draft, which parked the design outside the graph in
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
tooling_goals:
  - kind: actuator
    statement: /align-strategy — interview-driven strategy recording, superseding
      /file-issue requirements definition
  - kind: actuator
    statement: /align-tactics <strategy-id> — break a strategy into PR-sized tactic
      nodes with clean-session plans, superseding /file-issue epic structuring
      and /plan-issue
  - kind: actuator
    statement: "/align — fork entrypoint: orient, validate deployment, review
      virtues, delegate to /align-strategy"
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
attributes:
  rounds:
    count: 0
    last_completed: null
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

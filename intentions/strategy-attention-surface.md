---
id: strategy-attention-surface
kind: strategy
statement: Office hours runs on the graph — one local-first surface (status
  signals and goals exploration) allocates the author's strategic attention
owner: human
status: refining
parent: strategy-explicit-intent
rationale: "The office-hours surface was the materialization of several
  strategies' sensors — strategy-autonomous-execution names the dashboard as its
  observability surface, strategy-explicit-intent names the intention-tree view
  among its artifacts, strategy-graph-native-dispatch defines the office-hours
  queue as a projection over parked nodes — yet no node owned the surface
  itself. This strategy owns it: the place where the graph meets the author's
  attention. Two pages. STATUS is one attention-ranked queue of typed signals;
  every signal belongs to an owning graph node (a strategy's success_signal or a
  standing condition) and the surface renders readings it does not own: runway
  and dollar spend belong to strategy-financial-sustainability with the sensor
  supplied by strategy-recover-finance's budget pipeline; token spend reads
  against strategy-autonomous-execution's frontier-economy condition (pace
  telemetry stays operational config outside the graph); velocity and backlog
  growth belong to strategy-autonomous-execution's attention-economics signal,
  computed from the store's own history per the graph-native lifecycle sensor;
  marketing and adoption signals belong to
  strategy-promote-progressive-detachment and strategy-own-audience, sensed
  through the exports recorded in delegation-web-analytics. GOALS is direct
  graph exploration: virtue roots and their strategies, the shape and
  development of subtrees, where delegation and capture concentrate, where
  attention resolves, what the router is executing and queuing, and the
  office-hours queue. Local-first per the recovery strategies: the graph is read
  from the local repo clone, signals from non-versioned files on local disk and
  network shares; the surface is a read-only projection — acting on a signal
  (clearing a park, authoring attention) stays a session act through the graph
  write path. Artifacts in prose per kind-strategy: the office-hours app
  (redesigned), the design-system OfficeHours template with ContextPanel and
  BudgetPaceChart, the office-hours-snapshot local producer. The legacy
  gh-router work already migrating office-hours off hosted Firestore drains in
  parallel; this strategy consumes its output rather than duplicating it."
reading: null
serves:
  - virtue-alignment-of-attachments
recovers:
  - delegation-firebase
clarifications:
  - question: Is the office-hours redesign a new strategy, or edits to the
      strategies that already name the surface?
    answer: A new sub-strategy of strategy-explicit-intent. The surface is the
      cross-cutting materialization of several strategies' sensors and none
      owned it — no single node carried its success_signal, conditions, or
      recovers edge. Apps stay prose-named artifacts; the strategy is the
      standing posture that attention is allocated from one graph-backed
      surface. Recorded 2026-07-03 interview.
  - question: What is the status page's core shape — bespoke domain cards or a
      uniform list?
    answer: One attention-ranked queue of typed signals. Signals are of a type; each
      type is associated with a compact view (rendered in the list) and a
      context view (rendered in the context panel when the signal is selected).
      The design-system OfficeHours template's Budgets card rows generalize into
      signal rows; BudgetPaceChart becomes the context view of the budget signal
      types. Recorded 2026-07-03 interview.
  - question: Where do the example status-page signals live in the graph — are new
      strategies required?
    answer: "No new signal strategies. Runway and dollar-spend budgets:
      strategy-financial-sustainability's success_signal (projected runway),
      sensor supplied by strategy-recover-finance. Velocity (tactics created vs
      closed, backlog growth by subtree): strategy-autonomous-execution's
      attention-economics signal, raw data from the store's phase-transition
      history and selection log (the graph-native lifecycle sensor).
      Marketing/analytics/performance: strategy-promote-progressive-detachment
      (adoption with migration freedom) and strategy-own-audience (platform-free
      reach). The surface renders these strategies' readings; it owns only its
      own signal. Recorded 2026-07-03 interview."
  - question: Where does the token-spend budget signal live, given pace telemetry is
      deliberately outside the graph?
    answer: As the sensor for strategy-autonomous-execution's standing condition
      that frontier-agent access remains economical at individual scale.
      Conditions are standing review triggers; the status page reads the local
      pace telemetry files and attributes the signal to that condition.
      Telemetry and tunables stay operational config outside the graph per
      strategy-graph-native-dispatch clarification 14. Recorded 2026-07-03
      interview.
  - question: Does the surface write to the graph?
    answer: Read-only v1. The graph is read from the local clone (File System Access
      API over intentions/, per the existing local-first package), signals from
      network-share files. Acting on a signal — clearing an office_hours park,
      authoring an attention boost — stays a session/graph-commit act outside
      the browser, keeping a single writer implementation while graph-commit
      itself is still being built. Recorded 2026-07-03 interview.
  - question: Where do the legacy dashboard panels (History, Audit, Reminders,
      Queue, Parked, ProjectSignals) land in the two-page redesign?
    answer: Everything is represented as a signal or a view of the graph; that
      accounts for everything on the legacy second page, which ceases to exist
      as a concept. Reminders, project signals, and queue health become typed
      signals in the status queue; parked nodes, router now/queue, and
      history/audit become goals-page projections of the graph. Recorded
      2026-07-03 interview.
  - question: The browser cannot run git — where does the velocity series come from?
    answer: "Host-side: the office-hours-snapshot producer derives the
      created/closed/phase-transition series from the local clone's intentions/
      git history (the same derivation as the graph-native lifecycle sensor) and
      folds it into office-hours-current.benc; the surface reads it like any
      other snapshot signal. The clone-read layer renders only current node
      state; the browser never parses git history. Resolved 2026-07-03
      /align-tactics round 1 (immaterial drift: consistent with clarifications 3
      and 6)."
  - question: Is the analytics export drop an author task?
    answer: No — collection is automated end-to-end. The local snapshot producer
      collects GA4/Search Console/PageSpeed/GitHub signals directly, reusing the
      dependency-injected core of the collectProjectSignals Firebase function,
      under a new producer scope scheduled by the repo's nix-managed systemd
      timer (nix/nixos/office-hours.nix precedent); results fold into
      office-hours-current.benc like every other snapshot signal. The Firestore
      function and its capture hop retire with the hosted owner tier. No manual
      export drop exists. Recorded 2026-07-03 /align-tactics round 1 — author
      correction pruning the round's born-parked analytics-drop tactic in favor
      of tactic-attention-surface-analytics-collector.
  - question: How is the office-hours parked queue ordered when the author wants to
      defer whole classes of sittings — is pure attention rank sufficient?
    answer: "(Recorded 2026-07-23 /align-strategy interview.) No. Office-hours
      parked nodes carry a session-type label — office_hours.session_type, a
      closed schema-validated enum {requirement-discovery, curriculum-review,
      other}, defaulting to other when absent — and the office-hours selector
      (office-hours-select.ts / officeHours.ts) ranks type-aware with a soft
      penalty: requirement-discovery and curriculum-review parks rank at
      attention x 0.5 (one shared named, author-tunable constant), so they sink
      below other office-hours work while a sufficiently boosted node can still
      surface — a soft penalty, deliberately not a hard tier floor. This amends
      the pure attention-rank-descending ordering of the parked queue to
      attention-ranked-with-type-modifier; the STATUS page's signal queue is
      untouched. The label also enables selection BY type (requirement-discovery
      / curriculum-review / other sittings on demand). Motivating case:
      strategy-recover-attention re-surfaced at every tick demanding a direction
      decision the author wants held for a dedicated future session. Steelman
      considered and diverged from (2026-07-23): hand-authored per-node
      attention deboosts could sink individual recurring nodes with zero schema,
      but are hand-maintained hygiene, do not generalize to new parks of the
      same class, and cannot express filter-by-type selection — the type
      dimension is adopted for both ranking and selection. Implementation is
      drafted in tactic-office-hours-session-type."
  - question: Do the two deferrable session-type classes cover every whole class of
      sitting the author wants to defer, or is a third needed?
    answer: "(Recorded 2026-07-25, author direction at the close of an office-hours
      drain sweep. Amends the 2026-07-23 entry above by WIDENING its closed
      enum; the ranking and selection doctrine is unchanged.) A third class is
      needed: strategy-review. The enum becomes {requirement-discovery,
      curriculum-review, strategy-review, other}, still closed, still defaulting
      to other when absent. Its defining shape is that THE INPUT IS METRICS, NOT
      A QUESTION — the author reads numbers (budget figures, pace/velocity,
      attention distribution) and the output is a direction for strategy. That
      distinguishes it from requirement-discovery, where the blocker is an
      unanswered requirement question, and from curriculum-review, where the
      blocker is reading/comprehension work. It joins the PENALIZED group with
      the other two, sharing the same single named constant rather than
      introducing a second: it is author-scheduled, recurs, and should not
      compete at full attention rank with blocked execution work at every tick.
      Motivating case: strategy-recover-finance has carried reading: null and
      gap: null since it was codified — the owned budget pipeline was built and
      repeatedly fixed, but the numbers it produces have never been read back
      against the strategy that justified building it, and that reading is a
      distinct sitting from operating the pipeline. Born parked the same day as
      tactic-budget-strategy-review-reading, the first node in the class.
      Implementation note: the enum member is NOT yet on main —
      tactic-office-hours-session-type (PR #2961) introduces the field and is
      itself parked at its qa-fix attempt cap, so the widening is filed
      separately at tactic-office-hours-session-type-strategy-review, blocked_by
      it, which also backfills the parks labelled for this class in prose. Until
      then the class is recorded in park prose only, deliberately:
      validateOfficeHours reconstructs a park from exactly {reason, since,
      recommendation}, so a session_type key written today is silently dropped
      rather than rejected, which would make a structured label a false record."
  - question: Where does this surface end and strategy-rsi-plan-surface begin? Both
      name a surface, and both end up in the same office-hours application.
    answer: >-
      (Recorded 2026-08-11, by the /align round that created
      strategy-rsi-plan-surface; the same boundary is recorded on that node, and
      a session planning GUI work should read both.) Split by CONTENT, not by
      application. This strategy keeps the office-hours ritual, parked-node
      selection and its session-type ranking, and the SIGNALS queue —
      tactic-attention-surface-status-page's "one attention-ranked queue of
      typed signals with per-signal context panel", i.e. the things that trigger
      review. strategy-rsi-plan-surface owns the harness status and PRIORITY
      view — what the harness is doing, what comes next, and when — starting as
      rsi-plan.md and later migrating into a view inside this same application.
      The two therefore do not compete for the GUI; they occupy different
      content within it. The boundary was drawn because this node's statement
      ("status signals and goals exploration") and the rsi-plan.md contents
      contract (which records that the document "eventually integrates into the
      office-hours GUI project") both reached for the same destination, and a
      fresh session reading only one of them would plan the status view under
      the wrong owner. Practical test when a future round is unsure which node
      owns a proposed view: ask whether the content is a signal that should
      trigger the author to look, or a statement of what the harness is doing
      and in what order. The first is this node; the second is
      strategy-rsi-plan-surface.


      (AMENDED 2026-08-13 /align round. The routing half of this entry is
      SUPERSEDED; the content distinction it draws is retained as doctrine.)
      strategy-rsi-plan-surface was retired 2026-08-12 and pruned 2026-08-13, so
      the node this entry routes PRIORITY content to no longer exists. A fresh
      session reading the test above would send the harness status and priority
      view to a deleted id. That half is dead: the plan view is absorbed by THIS
      node, recorded in the plan-view clarification below. What survives is the
      practical test itself — signal-that-triggers-you-to-look versus
      statement-of-what-the-harness-is-doing — which is still the right question
      to ask when placing a view; both answers now resolve here, so the test
      discriminates page (STATUS versus the plan view) rather than owning
      strategy.
  - question: What was the freeze blast radius when this node's substance last
      changed, on 2026-08-11?
    answer: "(Recorded 2026-08-11 after adversarial review, filling a gap in the
      round that added the strategy-rsi-plan-surface boundary clarification.)
      That round changed this node's clarifications, which changes its
      strategyFingerprint (router.ts hashes statement, clarifications,
      conditions, serves, success_signal, tooling_goals). The round recorded its
      freeze classification only for strategy-recursive-self-improvement and
      asserted the second strategy in a commit message — which the
      record-completeness contract says is not the carrier, since the graph
      record is the sole carrier to a fresh session. Recorded here now, measured
      with strategyFingerprint plus isStrategyStale rather than a grep. Result:
      of 18 children, exactly ONE carries a non-null
      execution.strategy_fingerprint —
      tactic-attention-surface-analytics-collector — and it is STALE (stamped
      900e0568 against the current 41299978). It froze nothing, because it is a
      draft at phase null and the router does not gate a node with no phase. But
      it is born stale: the moment it is promoted to a phase it trips the
      chain-of-custody gate for a substance change it never executed against.
      This is a defect in the predicate the original round used, not only in its
      record — 'zero stamped OPEN children' passes while a stamped DRAFT sits
      stale underneath it. The widened predicate is 'any child carrying a
      non-null stamp', and it belongs in
      tactic-strategy-fingerprint-stamp-coverage; a round-level align_round
      provenance field, so a classification is recorded per edited strategy
      rather than once on the round's headline node, is proposed at
      tactic-align-review-skill."
  - question: The strategy that owned the harness priority view was pruned. Where
      does the plan view live, and why is it not called a priority view?
    answer: "(Recorded 2026-08-13 /align interview.) It lives HERE, on a single
      serves edge, and it is named the PLAN view / plan table at author
      direction — never the priority view. PLACEMENT follows the author's stated
      purpose: to see which parts of the graph dominate the focus of the author
      and the delegatees, and to track progress in those areas. That is an
      attention-concentration claim, which is this node's statement almost
      verbatim, and its goals-page tooling_goal already claims subtree shape and
      development, delegation and capture, resolved attention, and router
      now/queue. The rival owner considered and declined was
      strategy-rsi-delegated-prioritization, which records that both halves of
      its own signal read insufficient data for want of any surface from which
      delegated ordering can be audited. It was declined on that node's OWN
      recorded stay-vs-move test: its signal is (a) closure interval of
      front-loaded tactics and (b) inversion plus unlogged-write counts, and a
      read-only view reorders nothing, logs nothing and lints nothing, so it
      moves neither half — while it does move this node's threshold that the
      office-hours ritual runs on the redesigned surface. Artifact-owner
      placement (clarification 27) agrees: the artifact is the office-hours app,
      which this node owns. A multi-entry serves was considered and declined
      because under the greenfield rank key a serves edge is a parent edge, so
      adding one would make placement a ranking act. NAMING, recorded because
      'plan' is heavily overloaded in this repository and a fresh session will
      otherwise misread it: the plan view is the forward-looking schedule of
      graph work. It is NOT the clean-session plan carried in a tactic node's
      body, NOT the dispatch `plan` phase or its dispatch:plan comment, and NOT
      rsi-plan.md — which it supersedes. SUPERSESSION: this view answers the
      question strategy-rsi-plan-surface's retirement rationale deliberately
      left open ('they show findings and spend, not priorities or estimated
      delivery dates. Whether that is sufficient oversight is an open question
      for the author, recorded here rather than settled'). The author's answer
      is that it is not sufficient, and the successor surface is a view in this
      application rather than a rendered document."
  - question: What does the plan table inherit from the pruned rsi-plan contract,
      and what of it is deprecated?
    answer: "(Recorded 2026-08-13 /align interview; author direction was to treat
      the pruned requirements as deprecated but to mine them for gaps.)
      INHERITED. The ETA basis, unchanged: a row's ETA is today + (its 1-based
      position in the router's selection order / velocity), velocity being the
      dispatch queue's 28-day closure rate in closures per day, rendering
      honestly as unavailable at zero velocity rather than as a date. Verified
      unit-consistent this round rather than assumed: selectGraphTargets' two
      candidate loops are disjoint, so each tactic emits exactly ONE candidate
      per tick, and position therefore counts distinct tactics rather than
      selections. Also inherited: the row set — every non-done tactic, drafts
      included, parked rows included and MARKED, never dropped. DEPRECATED. The
      two independent `delegated` and `parked` COLUMNS collapse into chips in
      one labels column (author direction: the same two facts stay independent,
      carried by streamlined chip elements rather than by columns). The
      strategy-group header rows are gone — grouping is now the lineage column
      group described below. The markdown render, the six-section document
      structure, and the tier-band section headers are all moot with
      rsi-plan.md. ROW SET, measured on the live store 2026-08-13 and stated
      with the count as that contract required: 415 open tactics, of which 223
      are selectable and therefore carry a real ETA — 175 drafts emitted at the
      align-tactics directive rung plus 48 phase-set executable rows. The 192
      without a position are 144 parked, 45 blocked on incomplete blockers, and
      3 subtree-parent containers. Those three are DISTINCT reasons and the ETA
      cell renders the reason — 'unavailable — parked', 'unavailable — blocked
      by <id>', 'unavailable — container' — never a blank. Parked rows keep the
      inherited rule that they carry no position and are excluded from the
      position counter that feeds every other row's ETA. That 78% of the
      reachable queue is undecomposed drafts is a headline the view must show,
      not hide: a first draft of this design defaulted to a narrower
      scheduled-only row set on a MEASUREMENT ERROR (that drafts are
      unselectable), which the author corrected in interview. See the
      draft-selectability clarification below."
  - question: Filtering changes the visible row set, which changes position, which
      changes ETA. What does ETA mean under an active filter?
    answer: "(Recorded 2026-08-13 /align interview.) ETA is ABSOLUTE and never
      recomputes over the filtered set: a row's date is when the router will
      actually reach it, and hiding rows does not make the router arrive sooner.
      This falls directly out of the inherited basis, which defines position
      against the ROUTER's selection order rather than against the view. The
      failure it forecloses is concrete: under a recomputing ETA, filtering to
      `bug` would show every bug arriving next week because each is now near
      position 1, which is false. The hot-lineage panel deliberately does the
      OPPOSITE and recomputes its heat over the filtered window, because scoping
      the heat measure is the entire point of filtering. The asymmetry is
      intended, not an inconsistency: ETA is a forecast about the world and must
      not move with the view, while heat is a statement about the current
      selection and must."
  - question: Lineage is a DAG, not a tree. How is it rendered as columns, given
      that rowspan requires a laminar family?
    answer: "(Recorded 2026-08-13 /align interview; the author proposed recursive
      rowspanned columns over common parent subsets and asked for better options
      if any existed.) Three layers. ONE, SPINE COLUMNS — the author's sketch,
      made sound. Rowspan requires a LAMINAR family (any two blocks nested or
      disjoint), and ancestor sets in a DAG are not laminar: for adjacent rows
      with lineages {V,S1,S2} and {V,S2,S3} the common subset is {V,S2} but S1
      and S3 have no consistent column position, so spans must break and resume
      — reading as several things when they are one — and an ancestor shared
      with no neighbour gets no column at all. The fix is to render the one
      sub-DAG that IS a tree: each row's BAND SPINE, its band-defining parent,
      then that parent's band-defining parent, to a root. Spines are paths, so
      they nest exactly as the author drew, recursively, with spans growing
      leftward. The spine is not an arbitrary reduction — it is precisely the
      chain that set the row's rank. TWO, LANE GUTTER — the off-spine ancestors
      the spine drops (a second serves, a recovers delegation, a
      reverse-blocked_by blocker) render as vertical lanes painted per viewport
      rather than as table cells. This is where the DAG-ness survives: a lane
      repeats segments where an ancestor is non-contiguous, several lanes light
      on one row for a multi-parent node, and nothing needs a span extent.
      THREE, the hot-lineage panel, below. WHY THIS IS ONLY NOW SOUND: the
      pruned contract conceded that grouping by lineage DESTROYS rank order
      (measured then: one strategy's rows spanned up to 160 selection positions)
      and kept grouping only because the author asked for it. Under the
      greenfield key (tier, band, score, depth) band is the SECOND sort
      component, so band blocks are contiguous BY CONSTRUCTION and the
      concession dissolves. Two caveats carried to the implementer: contiguity
      holds on the band VALUE, not on the band-defining parent NODE, so distinct
      parents with equal scores share a block and blocks fragment on ties; and a
      span whose extent exceeds the loaded window must render as a STICKY HEADER
      rather than a literal growing rowspan, since a rowspan must know its
      extent at render time and infinite scroll cannot supply one — a span that
      mutates as rows stream causes layout thrash, and one that breaks at a page
      boundary shows a pagination artifact as though it were data. This applies
      to the tier column too."
  - question: What does the hot-lineage panel measure, and why is an aggregate panel
      needed at all when the lineage is already on every row?
    answer: "(Recorded 2026-08-13 /align interview.) Because the author's purpose —
      which parts of the graph dominate focus — is an AGGREGATE question, and
      the spine columns and gutter only let it be inferred. The panel answers it
      directly, scoped to the current filter and scroll window. MEASURE: score
      contribution. Under the greenfield model score is a DEDUPLICATED LINEAGE
      SUM — score_T(n) = boost_T(n) + the sum of boost_T(a) over every distinct
      ancestor a — so each ancestor's contribution to a rank region is an exact
      decomposition of the ranking rather than a proxy for it. Row-count share
      was considered and declined: it scores a large unweighted lineage and a
      small high-boost one as equally hot, which answers where the volume is
      rather than what dominates, and volume is not focus. TWO POPULATIONS: each
      ancestor's heat is shown twice, over UNDECOMPOSED descendants (the 175
      drafts awaiting an /align-tactics session) and over IN-FLIGHT descendants
      (the 48 phase-set rows being built), alongside a done/total progress
      readout that discharges the 'track progress in those areas' half of the
      purpose. The GAP is the signal: a lineage heavy in undecomposed and light
      in in-flight is accumulating intent faster than it is being delivered; the
      reverse is draining. This split is Claude's proposal, not the author's
      request, and was accepted in interview after being corrected once — an
      earlier cut at scheduled-versus-unscheduled was wrong because it rested on
      the draft-selectability error. Both populations are reachable work, which
      is what makes the gap a pipeline reading rather than an artifact of what
      happens to be parked. The /dataviz procedure governs the rendering and is
      not restated here beyond the two constraints that shaped the design: more
      than 8 ancestors fold to a '+ N others' row because a 9th categorical hue
      may never be generated, and the bars take ONE sequential hue because color
      must follow the entity and never its rank."
  - question: What do the row labels carry, and is the overlap between the tier
      column and the bug/security/outage chips duplication to be removed?
    answer: "(Recorded 2026-08-13 /align interview.) Six chips — bug, security,
      outage, parked, delegated, blocked — plus a compact 5-segment phase ladder
      pip carrying per-row progress inside the same labels column, so the
      author's specified column order (tier, lineage group, node id, labels,
      ETA) is unchanged. `blocked` was NOT in the author's requested set and was
      added on measurement: on the 415 open tactics it covers 73 nodes, 45 of
      which are unreachable because of it, against bug 4, security 1 and outage
      0. Without it the view could not show that a large share of the queue is
      dammed. It also coheres with the greenfield relation, where a blocker IS a
      lineage parent, so a blocked row already shows its blocker in the gutter
      and the chip merely names it. THE OVERLAP IS DELIBERATE AND MUST NOT BE
      'FIXED'. Tier is DERIVED from the marks the chips name: ownTier resolves 2
      from attributes.bug_fix or attributes.security, and tier 3 is
      strategy-main-health's exclusive reserve, so `outage` and 'tier 3' are the
      same fact. The chip is retained because it says WHY a row is tier-lifted,
      which the tier number alone does not. Recorded here so a later reviewer
      does not remove it as redundancy. Honest limit, stated rather than
      discovered: with 0 explicit tier-2/3 authored among open tactics, the tier
      column and the tier filter are near-vacuous TODAY — they earn their place
      structurally (tier is the outermost sort key and a tier-2 node outranks
      every tier-1 row) rather than empirically."
  - question: What has this design been specified against that has not landed, and
      what will read wrong until it does?
    answer: "(Recorded 2026-08-13 /align interview; author direction: 'we are
      building the table against greenfield ranking design in the graph'.) The
      plan view is specified against the GREENFIELD rank model, not the resolver
      on main. That model is the unified parent relation — a node's parents are
      its parent field, everything it serves, every delegation it recovers, and
      every node listing it in blocked_by — with the rank key (tier, band,
      score, depth), score a deduplicated lineage sum, and band the max parent
      score. The author's framing of lineage as 'strategies, delegations and
      blockers' is exactly that relation, and is NOT true of today's resolver,
      where blocked_by is deliberately excluded from the distributor relation
      and capture is a separate term. A session reading this clarification
      against main will therefore find the code disagrees; the graph is the
      specification here. CARRIERS AND THEIR STATE at recording:
      tactic-attention-namespaced-rank at phase review (PR 3075, reviewed) lands
      the key; its three siblings sit at phase null blocked on it. WHAT READS
      WRONG UNTIL THEY LAND: delegation lanes render heat 0 rather than low,
      because a recovers edge is a parent edge whose parent contributes boost 0
      until tactic-attention-delegation-scoring lands — the panel must say '0
      (until delegation-scoring)' rather than imply a delegation is cold. Band 0
      is a large degenerate bucket (74 of 248 candidates when last measured)
      until tactic-attention-per-tier-boost-migration reverts the 0.01 stopgap
      ladder, so spine blocks will over-merge at the bottom of the table. And
      the band derivation itself — band from the distributing node's RESOLVED
      rank — is held on trust by the author and enrolled at
      tactic-review-band-derivation-ratification; the plan view renders it and
      does not ratify it. SEPARATELY: the design system has no table primitive
      at all (Button, Badge, Card, Metric, Input, Select, Checkbox, Nav, the
      templates, BudgetPaceChart). Badge is the chip primitive; a virtualized
      data table with sticky spans is net-new DS work, tracked at
      tactic-ds-plan-table-primitive."
  - question: A round premise about draft tactics was wrong. What was the error,
      where did it come from, and what was done about it?
    answer: "(Recorded 2026-08-13, author correction in interview.) Claude asserted
      that draft tactics are not router-selectable and therefore carry no ETA,
      and sized the row set on it — reporting that only 77 of 415 open tactics
      could carry a date and recommending a narrower default view. The author
      challenged the claim and asked for it to be confirmed and the source
      corrected. IT IS FALSE. router.ts's frozen-tactic candidate loop emits
      draft/raw tactics as first-class candidates at the align-tactics directive
      rung, gated on office_hours null, blockers all done, and not being another
      tactic's parent. Corrected figure: 223 selectable, not 77. The
      recommendation was withdrawn and the inherited row set kept. THE SOURCE
      was /align's own Step 4 prose ('the router never selects a draft tactic'),
      a known defect already tracked at
      tactic-align-skill-draft-selectability-stale-prose since 2026-08-11 and
      still unexecuted. This round applied that fix rather than leaving it, and
      found a SECOND site the tracking node had not swept:
      intentions/tactic-graph-native-dispatch's body carried the same claim.
      Both are corrected in this round's commit. Worth stating as the general
      lesson, since it is the second time this class has bitten: a stale prose
      claim in a skill body is not inert documentation debt — it is an input a
      future session reasons FROM, and this round reached a wrong recommendation
      from it before the author caught it. The tracking node's own 'consequence
      if left' section predicted exactly this."
tooling_goals:
  - kind: actuator
    statement: status page — one attention-ranked queue of typed signals, each type
      carrying a compact list view and a context panel view
  - kind: actuator
    statement: "goals page — graph exploration views: virtue roots and strategies,
      subtree shape and development, delegation and capture, resolved attention,
      router now/queue, office-hours queue"
  - kind: actuator
    statement: browser graph read layer — File System Access API over the local
      clone's intentions/, client-side tree build and resolveAttention
  - kind: sensor
    statement: local signal adapters mapping non-versioned files (budget .benc,
      office-hours snapshot, pace telemetry, analytics exports) to their owning
      strategies' signals
  - kind: actuator
    statement: plan view — the rank-ordered table of every non-done tactic with tier
      and band-spine lineage columns, an off-spine ancestor lane gutter, label
      chips with a phase pip, position-derived ETA, tier/label filters, and a
      filter-scoped hot-lineage panel showing each ancestor's score contribution
      across undecomposed and in-flight work
success_signal:
  observable: office-hours sessions conducted from the surface, with every
    rendered signal tracing to a graph node (success_signal or condition) and a
    local data source
  sensor: owner review at office-hours plus the surface's own source-of-truth audit
  threshold: the office-hours ritual runs on the redesigned surface and the hosted
    Firestore owner tier is retired — all owner data local-first
  is_proxy: false
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-07: the office-hours script improvements —
    the snapshot producer/reader wire-contract fixes and the surface rebuild
    subtree — are the second priority, sequenced after
    strategy-graph-native-dispatch (boost 5): boost 3 ranks this strategy and
    its tactics above all derived-only ranks (cap 2) and below the dispatch
    migration."
  tier: 1
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
  queue_summary:
    date: 2026-08-11
    summary: "Unchanged from 2026-08-10: 156 parked, 6 rank-lifted from work they
      block, 16 live nodes held by a blocked_by edge onto a park — nothing
      cleared and nothing added, with dispatch paused and no office-hours
      session run in between. Two holds are unclaimed past 2.6 days with no
      autonomous re-attempt path (`list-unclaimed-hold-alerts`):
      tactic-hold-conflict-autonomous-ci-pending-liveness-bound
      (provision-conflict) and
      tactic-hold-fix-cap-qa-fix-node-terminal-declaration (fix-attempt-cap),
      both at rank 25.3 and parked 2026-08-09; a third,
      tactic-hold-conflict-scope-fingerprint-plan-substance, sits unlifted at
      5.3. Rank alone does not order this queue: the highest-ranked park,
      tactic-drain-disposition-diagnosis-cas at 90.3 since 2026-07-28, blocks
      nothing, while the lifted set that does release named work all ranks below
      it. Measured office-hours spend over the 7d window is 4.2% of price proxy
      against dispatch's 69.6%."
  conditions:
    - the local clone the surface reads stays fresh enough that attention and
      rank read from it track origin/main
    - signal files on local disk and network shares stay reachable from the
      browser host; when a source is unreachable the surface fails loudly rather
      than rendering stale signals
    - strategy-graph-native-dispatch holds — orchestration state (phases, parks,
      selection log) is readable from the store, so the router and queue views
      need no GitHub queries
    - the File System Access API, or an equivalent local read path, remains
      available in the author's browser
    - The office-hours session-type soft-penalty factor stays a named,
      author-tunable constant in the selector; changing its value is config, not
      doctrine.
    - Type-aware office-hours ranking holds while parked-node selection is
      driven by office-hours-select.ts / officeHours.ts; if selection moves to
      another surface, the session-type ranking moves with it.
    - the plan view reads rank and selection order from the resolver and
      selector the router itself uses, never a reimplementation — a table that
      computes its own order can drift from the queue it claims to show
      (Recorded 2026-08-13)
    - the plan view is specified against the greenfield rank key (tier, band,
      score, depth) and its unified parent relation, not the resolver on main;
      while the carriers are unlanded the view renders unavailable terms
      honestly rather than as low values (Recorded 2026-08-13)
---
# Office hours runs on the graph — one local-first surface (status signals and goals exploration) allocates the author's strategic attention

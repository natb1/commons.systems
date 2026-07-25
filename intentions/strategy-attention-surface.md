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
gap: null
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
---
# Office hours runs on the graph — one local-first surface (status signals and goals exploration) allocates the author's strategic attention

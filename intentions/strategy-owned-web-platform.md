---
id: strategy-owned-web-platform
kind: strategy
statement: Own the web platform substrate — prefer minimal owned implementations
  over framework dependencies, accepting the correctness burden
owner: human
status: raw
parent: null
rationale: "Recorded 2026-07-07 from the /align-strategy comprehensive code
  review, which found this doctrine applied consistently but stated nowhere: the
  web substrate is built, not bought. A ~160-line owned router serves both the
  React and vanilla apps (packages/router); static generation is a hand-rolled
  prerender plus critical-CSS pipeline instead of Next/Astro
  (packages/blog/src/prerender.ts, packages/criticalcssutil); internal packages
  export raw TypeScript source with no build or publish step; layering is
  machine-enforced by an eslint rule that derives the app list from the
  workspace manifest (packages/config/eslint.config.js); the server surface is
  two portable functions; offline tools are near-zero-dependency Go static
  binaries; transitive advisories are fixed by npm overrides pins. The same
  doctrine shapes the UI layer: packages/components is the deliberate
  framework-free path (fellspiral consumes the brand without React), theming is
  pure CSS light-dark() with no ThemeProvider, styling is semantic props plus
  tokens with no utility-class vocabulary, and fonts are self-hosted with no
  CDN. React (plus react-dom) is the one accepted framework dependency, and no
  app is forced into it. The accepted trade: owned correctness burden — the
  router XSS and prerender-injection defects were real — in exchange for freedom
  from framework lock-in and a fork that inherits no rented substrate. AMENDED
  2026-08-13 (/align, claude-artifact delivery round): the closing clause —
  freedom from framework lock-in and a fork that inherits no rented substrate —
  now carries a second named exception beside React. A class of production
  surface is delivered as a PUBLISHED CLAUDE ARTIFACT, hosted by Anthropic on
  claude.ai, which is rented substrate by construction. The exception is bounded
  by the conditions below rather than by the deliverable being local-first:
  source stays in-repo and canonical, and the substrate production vacates is
  retained with a live consumer. The fork still inherits no rented substrate —
  it inherits the source and the owned stack that can render it — but a fork
  that wants the hosted surface itself must rebuild it."
reading: "dependency-audit: 27 runtime deps, 0 unjustified, 1 dead-upstream"
serves:
  - virtue-progressive-detachment
recovers: []
clarifications:
  - question: Is packages/components legacy pending migration to the React design system?
    answer: "No — it is the deliberate framework-free parallel path, not a
      predecessor. Proof: fellspiral consumes components + style and never
      ds/React, and both paths draw the same ds CSS tokens. Collapsing it into
      ds would force React on every consumer; the 2026-07-07 code review itself
      briefly misread the duality as unintentional drift, which is exactly why
      this record exists. Recorded 2026-07-07 interview."
  - question: What is in scope — runtime substrate only, or the toolchain too?
    answer: "The doctrine's conditions bind the product/runtime substrate. The
      build-time toolchain (vite, vitest, tsc, eslint, storybook) and the
      Firebase client SDK were deliberately left out of the recorded conditions
      at the interview: the toolchain is reviewed by the same dependency audit
      without a standing condition, and the Firebase SDK's lifecycle rides
      delegation-firebase / strategy-firebase-demo-saas, not this strategy.
      Recorded 2026-07-07 interview."
  - question: What is the known unmaintained-upstream exposure the doctrine exists
      to avoid?
    answer: "Two load-bearing web-substrate dependencies have effectively dead
      upstreams: Critters (critical-CSS inliner, archived) and epubjs (print's
      EPUB renderer, patched around in-app). The dependency-justification audit
      reports upstream liveness alongside justification so these surface at
      office-hours instead of at breakage. Recorded 2026-07-07 code review."
  - question: What monorepo mechanics keep the substrate's boundaries from drifting?
    answer: "Boundary rules are machine-derived, never hand-maintained: apps are
      unscoped workspace roots and libraries are scoped @commons-systems/*
      leaves; the eslint no-restricted-imports layering rule and the root vitest
      project list are both generated from the workspace manifest (new apps are
      auto-covered); knip enforces a one-suppression-one-reason ratchet with
      baselined-not-bulk-deleted dead code. Recorded 2026-07-07 code review."
  - question: Which owned-substrate engineering contracts are load-bearing enough to
      name?
    answer: "Three, currently living only in code: the BoundedQuery type-level ban
      on unbounded Firestore scans (getDocs exists only on a bounded query;
      .unbounded(reason) requires a justification); the errorutil classification
      contract (programmer errors re-thrown never swallowed, one pluggable
      ErrorSink, ~15 consumers); and the prerender byte-match hydration
      contract, where the ds PageShell single-root path is intended to replace
      the legacy regex-injection path (drafted at
      tactic-prerender-single-injection-path). Recorded 2026-07-07 code review."
  - question: What is the ds-bundle design-canvas artifact and why is it gitignored?
    answer: "A derived, fully reproducible bundle built from packages/ds source by
      .design-sync/resync.mjs for the claude.ai/design canvas — source is the
      only canonical form, so the bundle stays out of git and a fresh sync
      regenerates it byte-for-byte from the repo. Known fragility: the
      converter's ts-morph component extraction keys off
      packages/ds/package.json's types field (\"types\": \"src/index.ts\"),
      which is inert for consumers (exports-based resolution ignores it) but
      load-bearing for sync — removing it silently degrades the sync to 0
      components, currently guarded only by a .design-sync/NOTES.md warning.
      Loud-failure guard drafted at tactic-design-sync-zero-component-guard.
      Recorded 2026-07-07 interview."
  - question: Does this strategy own the physical projects/ + packages/ repo layout,
      or only the logical apps-vs-libraries boundary?
    answer: 'Both — the physical layout is the logical boundary (clarification 4:
      apps are unscoped workspace roots, libraries are scoped @commons-systems/*
      leaves) materialized on disk. The 2026-06 repo reorg (former GitHub epic
      #2513) split the tree into packages/ (scoped leaves) and projects/
      (unscoped runnable units); Tier-1 landed (all shared libs to packages/,
      root go.work, projects/ with the low-coupling runnables). Tier-2 —
      relocating the 6 hosting apps + functions into projects/ and collapsing
      the workspaces glob to ["projects/*","packages/*"] — was deferred and,
      once planning moved to the graph, tracked nowhere; it is retained as
      tactic-projects-app-relocation under this strategy. Recorded 2026-07-08
      interview.'
  - question: What is a claude artifact here, and what does managing one as a
      production deliverable actually require?
    answer: "(Recorded 2026-08-13 /align interview.) A PUBLISHED CLAUDE ARTIFACT is
      a page deployed to claude.ai by the Claude Code Artifact tool —
      default-private, shareable at the author's choice, addressed by a URL the
      tool returns. It is a third artifact class beside the two this node
      already governs: the DERIVED ds-bundle canvas artifact (clarification 6 —
      gitignored, reproducible, source-canonical) and the ordinary BUILT
      artifacts of the apps. The practice, in five parts. (1) SOURCE IN A
      WORKSPACE: the page is never hand-authored HTML committed as-is; its
      source lives in a workspace package so the mechanisms that are keyed on
      the workspace manifest — the vitest project list, the eslint layering
      rule, knip, and detect-changes.sh path triggers — cover it automatically
      with no new registration. (2) DETERMINISTIC SINGLE-FILE BUILD: a build
      step emits ONE self-contained file with all CSS and JS inlined and assets
      as data: URIs, because the viewer enforces a strict CSP that blocks every
      external host. (3) CI VERIFIES, CI DOES NOT PUBLISH (see the CI
      clarification below). (4) A SESSION PUBLISHES, and records the returned
      URL on the owning intention node (see the orphaning clarification below).
      (5) THE PUBLISHED PAGE IS NEVER CANONICAL: it is an output, and a change
      made only to a published artifact is lost work. The first instance is the
      office-hours plan view (tactic-plan-view-table and siblings, serving
      strategy-attention-surface), deliberately scoped to one surface so the
      practice is taught by a real deliverable before it becomes a default."
  - question: Why is vendor-hosted delivery recorded on the OWN-the-substrate
      strategy rather than a strategy that names the trade in its statement?
    answer: "(Recorded 2026-08-13 /align interview, as the resolution of that
      round's steelman challenge.) This node is the substrate-CHOICE register,
      which includes choosing not to own — it already carries exactly one such
      named exception, React as the single accepted framework dependency
      (condition 2), and holding ownership and its exceptions in one node is
      what keeps the exceptions auditable rather than scattered. The rival
      framing, put to the author and DIVERGED FROM: a strategy whose statement
      is 'prefer minimal owned implementations' cannot also host 'ship the
      operator surface on a vendor's hosting' without the statement ceasing to
      describe the node, so the trade deserves its own strategy that names
      delivery velocity bought with hosting dependence. Diverged because a
      separate node would let the exception grow unobserved beside the doctrine
      it qualifies, which is the failure this node's single-register shape
      exists to prevent. The cost of the divergence is real and is recorded here
      rather than hidden: the statement now under-describes the node by one
      exception, and the amended rationale is what carries it."
  - question: What can a published artifact do at runtime, and what does that force
      on any surface built as one?
    answer: "(Recorded 2026-08-13 /align interview; capability surface read from the
      artifact-capabilities contract in-session, runtime contract 0.1.31, not
      assumed.) The complete capability set available to this account is
      `downloads` and `mcp` — nothing else — and the viewer enforces a strict
      CSP that blocks requests to ANY external host, fetch/XHR/WebSockets
      included. There is no File System Access path. THE CONSEQUENCE IS
      ABSOLUTE, not a tuning parameter: a published artifact cannot read
      intentions/, a local clone, a network share, or a remote URL at runtime by
      any route. All data is baked in at build time and the page is a SNAPSHOT.
      Two things follow. First, staleness must be shown, not implied: a baked
      page carries the origin/main sha and build timestamp it was built from,
      prominently, which is the same fail-loudly-rather-than-render-stale
      posture strategy-attention-surface already requires of its surfaces.
      Second, and unexpectedly in this substrate's favour: because the data is
      computed in Node at build time, a graph-reading artifact can run the
      router's OWN resolver and selector directly, which satisfies
      strategy-attention-surface's never-a-reimplementation condition strictly
      better than the browser path could — router.ts imports node:crypto and is
      not browser-safe, so the in-app path was forced into a reimplementation
      that the artifact path removes. `mcp` is the recorded future live-data
      path, adopted as 'snapshot now, mcp later', with two costs recorded so
      they are not rediscovered: the account's claude.ai connectors are
      Gmail/Calendar/Drive with no GitHub among them, so no connector can read
      this graph today; and a page that declares mcp cannot be shared publicly,
      so liveness and shareability are mutually exclusive under it."
  - question: Does artifact delivery integrate with the CI pipeline?
    answer: "(Recorded 2026-08-13 /align interview, answering the round's
      requirement text directly.) PARTIALLY, and the boundary is structural
      rather than unfinished work: there is no publish CLI — the Artifact tool
      exists only inside a Claude session — so no CI job can deploy an artifact
      the way prod-deploy.yml deploys a Firebase target. Everything UP TO
      publish is mechanizable, and the split is the practice. CI covers: the
      source, automatically, because it lives in a workspace (vitest project
      list, eslint layering, knip, and detect-changes.sh path triggers are all
      generated from the workspace manifest, so a new workspace is covered with
      no registration); an ARTIFACT CONTRACT CHECK over the built file — exactly
      one self-contained file, zero external-host references, at or under the
      16MB page cap, a <title> within the first 8KB, a favicon supplied at
      publish, and theme tokens defined on bare :root rather than only inside a
      prefers-color-scheme or [data-theme] block; and a HEADLESS FROM-DISK
      RENDER SMOKE, since a correctly built artifact opens from file:// with no
      network — playwright is already in the repo for this (with the recorded
      NixOS caveat that DS_CHROMIUM_PATH is required, not a fallback). Publish
      remains a one-line session action against a committed, CI-verified file.
      Note the shape this gives the pipeline: CI's job is to make the publish
      boring, not to perform it."
  - question: What stops a published artifact from being orphaned or silently duplicated?
    answer: "(Recorded 2026-08-13 /align interview.) The returned URL, and the
      runtime contract version it is pinned to, are recorded on the intention
      node that owns the surface. This is mechanically necessary, not
      bookkeeping: republishing WITHOUT passing the existing url creates a
      SEPARATE artifact at a new URL rather than updating in place, so a fresh
      session with no memory of the publishing round — which is the normal case
      under graph-native dispatch, where every worker starts clean — will
      silently orphan the live deliverable and hand back a second link.
      Recording it in the graph rather than anywhere else follows from
      strategy-graph-native-dispatch's sole-tracker condition: a URL held in
      session memory, a skill body, or a config file is a side channel. The same
      record is what a later round reads to decide whether to move the contract
      pin, which is a deliberate gesture and never a side effect of editing.
      This strategy's success_signal is deliberately NOT widened to cover
      artifact health — it reads dependency justification, a different
      observable — so artifact inventory is carried by the sensor tooling_goal
      added this round instead."
  - question: The word 'artifact' now names two different things in this graph.
      Which is which?
    answer: (Recorded 2026-08-13 /align interview.) BUILT ARTIFACT means the repo's
      own output — compiled apps, bundles, static sites — which is the sense
      delegation-anthropic-claude's irreversibility.recovery_path used when it
      read 'artifacts are local-first and keep running without any agent'.
      PUBLISHED ARTIFACT (equivalently CLAUDE ARTIFACT) means a page hosted on
      claude.ai by the Artifact tool. Left unreconciled, that recovery_path
      sentence would read as its own contradiction the moment this practice
      landed — asserting local-first independence about the very class of thing
      being delegated to vendor hosting — so it was reworded in this same
      round's commit rather than left for a reader to disambiguate. Prefer the
      qualified form in new prose; bare 'artifact' is acceptable only where the
      class is unambiguous from context. This is the same disambiguation hazard
      the 2026-08-13 plan-view round handled for the word 'plan' (the dispatch
      phase, a tactic-body plan, and the retired rsi-plan.md surface).
  - question: What happens to a substrate that production migrates away from?
    answer: "(Recorded 2026-08-13 /align interview, generalizing the author's own
      recovery argument; landed as condition 3 below, this clarification carries
      its reasoning.) It is RETAINED with a live consumer that exercises its
      primitives — never deleted, and never left as dead code. This is what
      makes accepting vendor-hosted delivery recoverable at all: recoverability
      is NOT a property of each deliverable being local-first (the reading this
      round considered and the author declined), it is a property of the owned
      stack still working when it is needed. strategy-firebase-demo-saas is the
      first and currently only instance — it already records the Firebase
      integration retiring into a maintained demo SaaS app, 'reference code with
      a live consumer, never dead code', preserving auth, storage, hosting and
      rules primitives that production surfaces have migrated off. Notably, that
      strategy ANTICIPATED this exact case before it arrived: its clarification
      1 records that there are no current plans to migrate off hosting, 'but the
      demo preserves the whole integration for if/when production does move'.
      This round is that case arriving, from an unanticipated direction — the
      surface moved to a vendor's hosting rather than to local-first rendering.
      The general rule is stated here and the Firebase instance stays where it
      is; its signal, conditions and tactics are Firebase-specific and do not
      generalize."
  - question: Does this strategy owe a recovers edge to delegation-anthropic-claude?
    answer: "(Recorded 2026-08-13 /align interview, discharging the delegation
      sweep.) NO, and the judgment is recorded explicitly rather than by
      omission, because this delegation has a live history of a no-edge-owed
      judgment being reversed within hours (see its 2026-08-11 clarification). A
      recovers edge records a strategy that UNWINDS or REDUCES RELIANCE ON a
      delegation, including partially. This strategy does the opposite on this
      axis: it widens the attachment by adopting the vendor as a runtime host
      for a class of production surface. Recording an edge here would invert the
      ledger's meaning and would mechanically feed this delegation's capture
      term into the attention of a strategy that increases capture. What the
      round DOES owe the delegation is an honest amendment on the delegation's
      own node — the widened `delegated` scope, the newly imported terms, the
      reworded recovery path, and refreshed review triggers — which landed in
      this same commit."
tooling_goals:
  - kind: sensor
    statement: a dependency-justification audit over the workspace manifests — every
      third-party runtime dependency carries a recorded justification, with
      upstream liveness reported alongside
  - kind: actuator
    statement: a workspace-resident artifact build emitting one self-contained page,
      plus a CI contract check (exactly one file, zero external-host references,
      size under the page cap, title, favicon, :root theme tokens) and a
      headless from-disk render smoke
  - kind: sensor
    statement: a published-artifact inventory — every published artifact resolves to
      an owning intention node recording its URL and contract pin, and every
      recorded URL still resolves
success_signal:
  observable: every third-party runtime dependency of the apps and shared packages
    carries a recorded justification, and the dependency count stays flat or
    falling
  sensor: dependency audit script over the workspace manifests (extending the knip
    ratchet), reviewed at office-hours
  threshold: zero unjustified runtime dependencies and no unreviewed dependency
    growth between office-hours reviews
  is_proxy: true
attention: null
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
  last_aligned: null
attributes:
  conditions:
    - the owned implementations' defect stream stays small enough for the
      autonomous chain to absorb — if owned-substrate defects start dominating
      office-hours, build-vs-buy is re-evaluated
    - React (plus react-dom) remains the single accepted framework dependency,
      and the framework-free components path stays maintained so no app is
      forced into React
    - "a substrate that production migrates away from is RETAINED with a live
      consumer exercising its primitives — never deleted, never left as dead
      code. This is the sole thing keeping vendor-hosted delivery recoverable:
      recovery is rebuilding the surface on the owned stack, so its cost stays
      bounded only while that stack is maintained and exercised, and grows
      without bound if it is allowed to rot. strategy-firebase-demo-saas is the
      first instance (Recorded 2026-08-13)"
    - "artifact SOURCE stays in-repo and canonical, and the published page stays
      a reproducible build output — a surface whose only current form is a page
      hosted on claude.ai is a defect, not a shortcut. This is what keeps the
      vendor delegation's irreversibility ungated: the recovery path runs from
      source we hold (Recorded 2026-08-13)"
    - the artifact runtime contract version each published surface is pinned to
      is recorded alongside its URL, and moving it is a deliberate, recorded
      gesture rather than a side effect of republishing — the runtime is
      versioned by the vendor and a silent upgrade changes how a shipped surface
      behaves (Recorded 2026-08-13)
  criteria:
    - id: fn-ds-token-drift
      statement: Net-new app-source CSS/TSX lines outside packages/ds use the
        design-system token vocabulary rather than re-deriving raw color,
        spacing, or radius literals the tokens already define, unless the line
        carries a ds-lint-disable-line escape
      class: functional
      authority: deferred
      recorded: 2026-09-01
---
# Own the web platform substrate — prefer minimal owned implementations over framework dependencies, accepting the correctness burden

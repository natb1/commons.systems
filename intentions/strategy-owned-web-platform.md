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
  from framework lock-in and a fork that inherits no rented substrate."
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
tooling_goals:
  - kind: sensor
    statement: a dependency-justification audit over the workspace manifests — every
      third-party runtime dependency carries a recorded justification, with
      upstream liveness reported alongside
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
---
# Own the web platform substrate — prefer minimal owned implementations over framework dependencies, accepting the correctness burden

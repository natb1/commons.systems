---
id: strategy-firebase-demo-saas
kind: strategy
statement: As user data migrates entirely to local-first storage, the firebase
  integration retires into a maintained demo SaaS application that supports
  service delivery — reference code with a live consumer, never dead code
owner: human
status: raw
parent: strategy-diversify-income
rationale: >-
  Minted 2026-07-07 at /align-strategy from the author's requirement: the repo
  carries a large firebase integration — Hosting for six apps, Functions (feed
  proxy, office-hours sync, queue metrics, project signals), Firestore backing
  office-hours/print/audio/blog, auth, app-check, security rules, and the shared
  firebaseutil/firestoreutil/authutil/rules-test packages — and all firebase
  production use is deprecated in direction as user data migrates entirely to
  local-first storage (packages/local-first; budget already effectively off
  Firestore onto IndexedDB plus encrypted .benc files; office-hours, print, and
  audio dual-source mid-migration). The author wants the integration kept for
  reference and for service delivery, and it cannot be left as dead code. The
  mechanism is a new purpose-built demo SaaS application that becomes the
  integration's live consumer: every retained firebase integration class stays
  exercised there, preserving the capability for if/when production surfaces
  (hosting, app-check — no current migration plans) also move.


  Why now: the local-first migration is already stranding firebase code paths
  (budget's Firestore layer is types-only today), so the dead-code condition
  arrives on its own schedule, not the author's; and the demo is a proof asset
  behind strategy-services-funnel's custom-software-development and
  AI-systems-integration lanes — hence parent strategy-diversify-income, where
  the funnel is the intake surface and this demo is evidence behind it. Carrying
  recovers: delegation-firebase records the partial unwind: production user-data
  reliance on Firestore/auth retires, while a bounded, automated demo use is
  deliberately retained — which also keeps the remaining recovery path warm in
  the spirit of strategy-exercise-recovery-paths. Capture risk weighed at the
  interview: the delegation record reads low divergence, ungated
  irreversibility, low recovery cost (the local-first design keeps user data out
  of any future migration entirely).
reading: firebase is production-active across the repo (hosting for six apps,
  functions, firestore for office-hours/print/audio/blog); the local-first
  migration is mid-flight (budget effectively off firestore;
  office-hours/print/audio dual-source); no demo app exists (code audit,
  2026-07-07)
gap: reading "firebase is production-active across the repo (hosting for six
  apps, functions, firestore for office-hours/print/audio/blog); the local-first
  migration is mid-flight (budget effectively off firestore;
  office-hours/print/audio dual-source); no demo app exists (code audit,
  2026-07-07)" does not meet threshold "the demo app is deployed and green in
  CI, and zero firebase-importing modules are unreachable from a live consumer"
serves: []
recovers:
  - delegation-firebase
clarifications:
  - question: What exactly is deprecated — the Firestore data layer only, or all
      firebase production use?
    answer: All firebase production use, including auth and app-check. There are no
      current plans to migrate off hosting or app-check (auth becomes mostly
      redundant with local-first), but the demo preserves the whole integration
      for if/when production does move. Recorded 2026-07-07 interview.
  - question: Where does the migration premise — "migrating entirely to local-first
      storage" — live, given no graph node records that decision?
    answer: "On this node: the \"migration proceeds\" condition plus this
      clarification. A dedicated migration strategy can be minted later if the
      migration needs its own success signal and tactics round. Until then
      delegation-firebase's statement that Firestore backs the
      office-hours/dispatch surfaces remains accurate. Recorded 2026-07-07
      interview."
  - question: What shape is the demo SaaS application?
    answer: A new purpose-built demo app — built on the existing firebase packages,
      seeded with synthetic data, deployed as its own hosting target — not a
      repurposed production surface. Concrete design is retained in draft
      tactic-firebase-demo-saas-app for /align-tactics. Recorded 2026-07-07
      interview.
  - question: Does the success signal measure service delivery?
    answer: "No — deliberately. It reads the no-dead-code invariant directly
      (dependency reachability plus demo CI); the service-delivery benefit is
      read by strategy-services-funnel's lane-attributable inquiry signal
      instead. is_proxy: true records that split. Recorded 2026-07-07
      interview."
  - question: Which Firebase project hosts the demo app?
    answer: "The existing commons-systems project (the single project in
      .firebaserc): clarification 3's own hosting target means a new hosting
      site inside that project, and condition 2 reads the demo's spend through
      the same Blaze billing the owned budget pipeline already watches. Demo
      Firestore data lives under its own demo/{env} namespace beside the
      production namespaces, synthetic only. Judged immaterial Side-B drift
      (recorded-by-implication in clarification 3 and condition 2); landed
      without interrupting the round. Recorded 2026-07-10 /align-tactics round."
tooling_goals:
  - kind: actuator
    statement: a purpose-built demo SaaS app exercising every retained firebase
      integration class (hosting, firestore, functions, auth, app-check,
      security rules), seeded with synthetic data, deployed as its own hosting
      target
  - kind: sensor
    statement: a firebase-import reachability audit distinguishing live consumers
      (production surface or demo) from dead code
success_signal:
  observable: every firebase-integration class the repo retains (hosting,
    firestore, functions, auth, app-check, security rules) is exercised by the
    deployed demo SaaS app, and no firebase-importing module lacks a live
    consumer (production surface or demo)
  sensor: dependency audit plus the demo's CI/acceptance run, reviewed at office-hours
  threshold: the demo app is deployed and green in CI, and zero firebase-importing
    modules are unreachable from a live consumer
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
attributes:
  conditions:
    - demand exists for SaaS-shaped client work at individual scale — the demo
      earns its maintenance by supporting service delivery (the per-lane form of
      strategy-diversify-income's condition)
    - firebase (Blaze) spend for a demo-only workload stays negligible under
      strategy-financial-sustainability's runway rule, kept visible by the owned
      budget pipeline
    - the local-first migration proceeds — production user-data surfaces
      actually move off firestore — otherwise the demo duplicates production
      instead of preserving a retired integration
    - the demo stays exercised by automation (CI/acceptance on seeded synthetic
      data), not manual upkeep — if keeping it green starts costing real
      attention, this strategy is re-evaluated
---
# As user data migrates entirely to local-first storage, the firebase integration retires into a maintained demo SaaS application that supports service delivery — reference code with a live consumer, never dead code

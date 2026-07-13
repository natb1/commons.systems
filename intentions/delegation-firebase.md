---
id: delegation-firebase
kind: delegation
statement: App hosting and backend delegated to Firebase
owner: human
status: codified
parent: null
rationale: "Firebase hosts the deployed apps and supplies the thin backend
  surface (hosting, Firestore, functions) behind them. The apps are deliberately
  local-first — user data lives in user-held files, not in the backend — so the
  delegation stays shallow by design: what Firebase holds is deployment
  convenience, not user capability. The easiest of the current infrastructure
  migrations. As with any paid vendor, the spend imports a minor capture —
  promoting the vendor's growth, not a virtue held here — kept visible by the
  owned budgeting pipeline (strategy-recover-finance)."
reading: null
gap: null
serves:
  - strategy-recover-author-autonomy
recovers: []
clarifications:
  - question: What makes the recorded low recovery cost true at the rules layer?
    answer: "Canonical data is client-write-denied everywhere — statements, media
      catalogs, posts, and metrics carry allow write: if false and enter only
      via owned Admin-SDK/operator tooling (budget-etl, upload-media, seeds);
      clients get key-enumerated clamped annotations (keys().hasOnly plus
      type/range checks), and a parallel world-readable seed-* tier gives
      unauthenticated visitors a working demo. The hosted tier is therefore a
      rebuildable projection of owned local data, never the source of truth —
      the premise behind this record's low recovery cost, and the design the
      strategy-firebase-demo-saas demo app inherits. Recorded 2026-07-07
      interview."
  - question: What is the environment and hosting topology?
    answer: One Firebase project serves every app and environment; isolation is by
      document path {app}/{env} (prod/demo/test/preview-pr-N/qa) with a branded
      Namespace type and a rules-level env allowlist on open-create collections.
      Six hosting sites map apps to *.commons.systems subdomains, each with a
      per-app default-src 'none' CSP block (duplicated across sites — drift is a
      watch item; a scaffold marker keeps generated rule blocks default-deny).
      The preview-pr env pattern is a cross-file contract between
      firestore.rules and the CI preview-channel workflow. Recorded 2026-07-07
      interview.
  - question: How does authorization work in the rules where clients may read shared
      data?
    answer: Email-based group membership denormalized onto each doc (memberEmails,
      because rules cannot join on list queries), with Storage mirroring it as
      comma-joined object metadata plus a legacy member_0..2 fallback pending
      migration. Email identity is provider-agnostic and portable off Firebase;
      the denormalized copies are the trade (membership changes fan out, PII
      replicates per doc). Residue cleanup is drafted at
      tactic-firebase-rules-residue-prune. Recorded 2026-07-07 interview.
  - question: What else does the client surface import from Google beyond hosting
      and Firestore?
    answer: App Check backed by reCAPTCHA Enterprise on every app (deferred to first
      interaction) — now listed in this record's imported divergence;
      strategy-firebase-demo-saas retains app-check as an exercised integration
      class with no current migration plan. Error telemetry is first-party
      (create-only rules-bounded Firestore collections, no Sentry), so
      observability rides this delegation rather than a second vendor. Recorded
      2026-07-07 interview.
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  delegatee: Firebase (Google)
  delegated: static hosting, Firestore for the office-hours/dispatch surfaces,
    scheduled functions
  origin: chosen
  divergence:
    level: low
    imported:
      - Blaze billing model
      - quota and service policies
      - promote the vendor's growth via spend
      - App Check / reCAPTCHA Enterprise script on every app
      - Google Fonts on the non-fellspiral apps (self-hosting drafted at
        tactic-selfhost-thirdparty-assets)
    contradictions: []
  irreversibility:
    recovery_path: re-host — static apps deploy anywhere; the Firestore surfaces are
      small and behind an abstraction; functions are portable Node
    recovery_cost: low; the local-first design keeps user data out of the migration entirely
    gated: false
    last_exercised: null
  classification: platform
  non_delegable_floor: user data never lives only in the backend — local-first
    files are the source of truth
  review_trigger: pricing or quota changes that break the runway rule; service deprecations
  last_assessed: 2026-07-02
  household:
    shared: false
    basis: Deployment convenience for the author's deployed apps; project
      infrastructure, not household-shared.
    consent: []
    preferences: []
---
# App hosting and backend delegated to Firebase

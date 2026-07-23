---
id: tactic-shallow-fork-docs
kind: tactic
statement: Shallow-fork documentation for the budget tool and a mechanism for
  standalone app extraction (vendor, publish, or scaffold the @commons-systems/*
  closure)
owner: ai
status: raw
parent: null
rationale: "Retained from gh #442 and #512 during the 2026-07-06 tier-gate
  interview. Materializes strategy-open-source-as-gift's threshold — each public
  artifact carries documentation sufficient for a shallow fork to stand alone.
  Gated with the practitioner tier because its shape is design-dependent: the
  graph-native harness distributes by whole-repo fork (per the 2026-07-04
  amendment to #512), so app extraction now serves only app-level forks such as
  the budget tool."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-tier3-entry-declaration
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Shallow-fork documentation for the budget tool and a mechanism for standalone app extraction (vendor, publish, or scaffold the @commons-systems/* closure)

## Retained concepts (from gh #442 and #512, migrated 2026-07-06)

From #442 — budget shallow-fork documentation, living in `budget/`:

- Scope: which directories and files constitute the budget tool, including
  the `@commons-systems/*` workspace packages it depends on (analyticsutil,
  authutil, errorutil, firebaseutil, firestoreutil, idbutil, router, style).
- Architecture: local-first design (IndexedDB storage, client-side
  computation, no server-side state); data flow from upload through
  processing to visualization.
- Deployment: separate Firebase project, hosting target configuration,
  required services.
- Dependencies: what each package provides; guidance on inlining or
  replacing them for a standalone build.
- Bank-format extension: `/budget-parser` documented as a distinct
  Claude-assisted workflow, not conflated with in-app modification.
- Acceptance: following only the documentation, a fresh clone builds; a user
  with Claude Code can fork, adapt, and deploy.

From #512 — the extraction mechanism:

- Options: (1) a vendoring script copying the transitive closure and
  rewriting imports; (2) npm publication of `@commons-systems/*`; (3)
  extending the scaffolding Go tool to emit standalone repos.
- Acceptance: a documented, repeatable, CI-testable mechanism producing a
  standalone buildable copy of any single app.
- The 2026-07-04 amendment stands: the harness itself distributes by
  whole-repo fork, so extraction serves app-level forks (like budget) only.

Full original text: gh #442, #512.

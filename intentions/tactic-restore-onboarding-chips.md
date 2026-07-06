---
id: tactic-restore-onboarding-chips
kind: tactic
statement: Restore the progressive-disclosure onboarding chips
  (easy/medium/hard) after tier-2 entry, each flow QA-walked end-to-end first
owner: ai
status: raw
parent: null
rationale: "Retained from gh #721 and #722 during the 2026-07-06 tier-gate
  interview, extended to cover the Easy chip that tactic-quiet-app-heroes
  removes. Gated on the tier-2 entry declaration on
  strategy-progressive-validation; each chip's flow is QA-walked end-to-end
  against the then-current design before it is re-lit."
reading: null
gap: null
serves:
  - strategy-user-onboarding
recovers: []
clarifications: []
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
attributes: {}
---
# Restore the progressive-disclosure onboarding chips (easy/medium/hard) after tier-2 entry, each flow QA-walked end-to-end first

## Retained QA scopes (from gh #721 and #722; Easy chip added 2026-07-06)

- Easy (analyze locally): re-QA the flow against the then-current app before
  re-lighting; formerly shipped, removed by tactic-quiet-app-heroes.
- Medium (`/budget-parser`, #721): fork on GitHub → open the fork in Claude
  Desktop → `/budget-parser <path>` against a genuinely unsupported format
  (not QFX/OFX/CSV) → parser + test generated under
  `budget-etl/internal/parse/`, registered in `detectFormat`, `go test`
  passes → usable `budget.json` via `/budget`. Restore the `panel-parser`
  chip, the Easy panel's inline chip link, and their unit/e2e tests.
- Hard (fork and host, #722): fork → representative change with Claude →
  `firebase deploy` reachable at a hosted URL. Cover the fork-to-deploy gap:
  instructions must cover creating and selecting the user's own Firebase
  project; flag anything in `firebase.json`/hosting config that assumes the
  upstream project. Restore the `panel-host` chip and its tests.
- print's former chips: reconsider against the then-current design rather
  than restoring verbatim.

Gate: tier-2 entry declared on strategy-progressive-validation; each flow
QA-walked end-to-end before its chip is re-lit. Full original text: gh #721,
#722.

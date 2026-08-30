---
id: tactic-mainqa-review-domain-lens-consolidation-machine
kind: tactic
statement: "Post-merge verification of tactic-review-domain-lens-consolidation
  (PR #3024) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-review-domain-lens-consolidation
  pr: 3024
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-domain-lens-consolidation
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-review-domain-lens-consolidation (PR #3024) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-review-domain-lens-consolidation` (PR #3024). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **15 — Merged domain-sweep agent returns per-lens-attributed findings on a live run**
  - Path: `current`
  - Expected outcome: One Opus agent produces findings indistinguishable in attribution from the prior three-agent arrangement; each finding carries a `Source` of exactly `secrets`, `auth`, or `data-exposure`, never a combined name, and validates against the unchanged enum.
  - Finding: Only a live model run can show whether the model honors the per-section `Source` instruction — a static prompt-string check proves the instruction is present, not that it is obeyed.
  - Verifiability: WAIT
  - Check: In that run's log, confirm `finders: wave 2 = launching 5 finder(s)` (down from 7) and a single `find:domain-sweep` agent where three ran before; confirm the PR comment's findings carry `Source` values among `secrets`/`auth`/`data-exposure` only. An empty domain-sweep result on a diff with an obvious secret is the failure signature to watch for.
- **16 — Fold delivers the claimed cost reduction without a yield drop**
  - Path: `current`
  - Expected outcome: Measured cost drops materially (one Opus agent deriving context once instead of three deriving it independently) while per-lens confirmed-finding yield holds at or above the 2-per-window baseline ($41.55 across `secrets`/`auth`/`data-exposure` for 2 confirmed findings over 18 runs, 2026-07-27 to 2026-07-31).
  - Finding: Requires an audit window of post-merge `/review-fix` runs; not assertable at merge time.
  - Verifiability: WAIT
  - Check: Compare the combined `find:domain-sweep` draw against the $41.55 three-agent baseline, and combined confirmed findings (joined by `Source`) against the 2-finding baseline. A combined confirmed count below 2 is the signal to revisit — the response is prompt strengthening (per-section reporting discipline), never a model-tier change without a measured A/B (author ruling above).

---
id: tactic-delegation-capture-visibility
kind: tactic
statement: Capture-visibility surface — the goals page ranks delegation records
  by divergence × irreversibility and last_assessed age for ad-hoc review
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round:
  review_window (cron-style review cadence) is retired from kind-delegation as
  flaky and impractical; the replacement is event-based review_triggers plus
  GOOD AD-HOC VISIBILITY — this tactic is the visibility half. Serves
  strategy-attention-surface as the artifact owner: its goals page already names
  'where delegation and capture concentrate' as a view."
reading: null
gap: null
serves:
  - strategy-attention-surface
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
# tactic-delegation-capture-visibility

## Context

Event-based delegation review (review_trigger; reading-program rounds;
requirement refinement) needs a surface that makes stale or deep attachments
easy to prioritize ad hoc, since no cron window forces review anymore.

## Scope

- A goals-page view (office-hours surface) over the delegation layer:
  records ranked by capture weight (divergence level × irreversibility:
  recovery cost + gated) and last_assessed age; declined records marked;
  fired-but-unactioned review_triggers surfaced if detectable.
- Reuses the capture-resolution scoring already in intentionsutil's attention
  module (and the derived classification helper once
  tactic-delegation-classification-derivation lands — enum axes make the
  ranking mechanical; free-text axes are the interim input).
- Read-only, local-first, per strategy-attention-surface's conditions.

## Verification

Prose: open the goals page against the live store; confirm the ranking
surfaces the known-deep records (attention-services, anthropic-claude) above
low/low tools, and that last_assessed ages render. Unit tests for the ranking
helper:
```verify
npx vitest run --project packages/intentionsutil --root .
```

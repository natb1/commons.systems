---
id: tactic-audit-routing-advisory-gate
kind: tactic
statement: Make the audit-written routing policy loop advisory — surface routing
  recommendations for explicit author approval, never auto-apply
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-16 /align-strategy interview
  (strategy-token-economy clarification 10). The author deprecated the
  align-family Opus floor in favour of a general rule: no audit-driven routing
  change is applied automatically. This tactic carries the actuator-side
  mechanism change, not yet in place."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 20
  rationale: "Author-directed 2026-08-03: prioritize progression of
    token-efficiency work ahead of bug-fix work and ahead of the undecomposed
    baseline. Matches the boost 20 already carried by the review-phase
    token-cost cluster (tactic-review-skill-body-decomposition and its
    siblings). Simulated over the live store before writing: 0 tier changes, 0
    value drift onto non-target nodes, resolves to 20.00."
phase: done
execution:
  branch: tactic-audit-routing-advisory-gate
  pr: 3029
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T01:32:07Z
    mergeCommitSha: df9bb84c51a05be6a97309130098d880833a575a
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Make the audit-written routing policy loop advisory — surface routing recommendations for explicit author approval, never auto-apply

## Context

`strategy-token-economy` clarification 10 (2026-07-16) and condition 3: the
audit-written routing policy loop must never apply **any** routing change
automatically — model demotion, promotion, or effort tuning alike. When the audit
finds a task can run on a cheaper model without compromising quality (or otherwise
warrants a routing change), it **must surface** the recommendation; implementation
waits for **explicit author approval**.

**Greenfield-relevance gate — the actuator-side auto-write half is already
superseded (dropped from this plan).** The original draft's core mechanism —
"change the routing actuator so it *reads* an author-approved policy rather than
auto-writing one" — is moot: PR **#2872** already retired the learned/adaptive
`phase-model-policy` (#2028) that auto-promoted the `qa`/`review` orchestrators on
a low hit-rate. `.claude/skills/dispatch-propagate/scripts/dispatch-phase-model`
is now a **static map** with an explicit design invariant ("there is deliberately
no learned/adaptive policy that can bump the orchestrator to Opus"), and
`/dispatch-token-audit` is already **report-only**. So condition 3's core — *no
auto-applied routing* — is already structurally satisfied: a routing change today
requires a human to read the audit and hand-edit the static map. That unit is
**dropped from this plan, naming #2872 as the superseding change.**

**Surviving residual.** What is *not* yet in place is a crisp, verified-yield
**recommendation surface**: today the audit ranks opportunities as prose by
magnitude across its lenses, but it emits no structured "task X: current model →
recommended model, justified by verified metric Y, with quality-preservation
evidence" output, and condition 3's grounding requirement ("routing
recommendations are grounded only on yield metrics whose accounting is verified —
the qa `fixes_applied` gap is open") is not mechanically enforced on that output.
This tactic delivers that surface and documents the manual approval-and-apply
convention. Off the success-signal path (no `validates`; unboosted — its priority
derives from the strategy, demoted as off-path work).

## Unit 1 — add a structured routing-recommendation output to /dispatch-token-audit

**Recommended model:** opus

Scope:
- `.claude/skills/dispatch-token-audit/scripts/audit-aggregate-writer.mjs` and
  `.claude/skills/dispatch-token-audit/SKILL.md`: add a `routing_recommendations`
  output — a list where each entry names the task/phase, its current model (from
  `dispatch-phase-model`'s static map), a recommended model or effort change, the
  **verified** yield metric that justifies it, and the quality-preservation
  evidence. A recommendation grounded on **unverified** accounting (e.g. the open
  `qa` `fixes_applied` gap, per condition 3 and clarification 5's per-phase
  metric-shape finding) must be tagged `untrusted` and excluded from the
  actionable set, not silently ranked.
- Keep the audit report-only: this output is a **recommendation**, never a write
  to `dispatch-phase-model`. The audit surfaces; the author disposes.

Reuse:
- The audit's existing per-phase yield/hit-rate computations in
  `audit-aggregate-writer.mjs` — the recommendation surface consumes them; it does
  not re-derive metrics.
- `dispatch-phase-model` — read the current static map to populate each
  recommendation's "current model"; **do not** write to it.
- The condition-3 verified-accounting rule and clarification 5's per-phase
  metric-shape guidance already recorded on the strategy.

## Unit 2 — document the manual approval-and-apply convention

**Recommended model:** sonnet

Scope:
- `.claude/skills/dispatch-token-audit/SKILL.md`: add a short "acting on routing
  recommendations" section stating the loop explicitly: the audit surfaces
  `routing_recommendations`; the author reviews them at office-hours; an approved
  change is applied by hand-editing the static map in
  `.claude/skills/dispatch-propagate/scripts/dispatch-phase-model` (and
  `dispatch-phase-effort` for effort changes); the edit's commit is the auditable
  record of the approved change. No automated path writes the map.
- Cross-reference condition 3 and the #2872 static-map invariant so a future
  reader does not re-introduce an auto-write policy.

Dependencies: Unit 2 depends on Unit 1 (documents the surface Unit 1 adds).

## Verification

```verify
.claude/skills/dispatch-token-audit/scripts/test-audit-aggregate-writer.sh
```

Manual: run `/dispatch-token-audit <window>` and confirm the report includes a
`routing_recommendations` section, each entry carrying current→recommended model,
the verified yield metric, and quality-preservation evidence — with any
recommendation resting on unverified accounting explicitly tagged `untrusted` and
excluded from the actionable set. Confirm the SKILL documents that changes apply
only via a hand edit to `dispatch-phase-model`/`dispatch-phase-effort`, never
automatically, and that no code path in the audit writes those files.

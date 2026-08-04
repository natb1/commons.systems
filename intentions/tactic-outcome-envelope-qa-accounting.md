---
id: tactic-outcome-envelope-qa-accounting
kind: tactic
statement: per-phase routing metric — qa routes on actionability, not hit_rate,
  so a triage-shaped phase is not promoted to Opus by a rate it cannot move
owner: ai
status: codified
parent: null
rationale: "Finalized from the 2026-07-04 interview draft by /align-tactics
  round 1, reframed by the round's drift review (strategy clarification 5):
  qa-fix's fix lane already maintains a landed-fix tally, so the defect is
  metric shape, not missing accounting."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Author-directed 2026-08-03: prioritize progression of
    token-efficiency work ahead of bug-fix work and ahead of the undecomposed
    baseline. Matches the boost 20 already carried by the review-phase
    token-cost cluster (tactic-review-skill-body-decomposition and its
    siblings). Simulated over the live store before writing: 0 tier changes, 0
    value drift onto non-target nodes, resolves to 20.00."
  tier: 1
phase: null
execution:
  branch: tactic-outcome-envelope-qa-accounting
  pr: 2774
  attempts:
    qa: 1
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 157bc07dd1dbc4a1c7a5095f7c3094ee88accf5879271bc6d2c4cd4794029848
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/align-tactics misrouted onto this node: it is not a draft. router.ts's
    isDraft (packages/intentionsutil/src/router.ts:147-149) treats any
    phase:null as a draft with no allowance for the pre-schema-migration
    attributes.phase squatter form. This node was lifted to first-class
    phase:review by tactic-schema-migration-backfill (234e52e7, 2026-07-07),
    then re-squatted three days later by commit 32078569 (2026-07-10, \"review
    -> main-qa squatter\") back into phase:null / attributes:{phase: main-qa} to
    represent it awaiting main-qa verification -- at that time schema.ts had no
    first-class main-qa phase to write. schema.ts's Phase enum gained a
    first-class 'main-qa' value the very next day (tactic-main-qa-phase, PR
    #2859, landed 2026-07-11) and the qa-main node-lane handler (its Unit 2) now
    expects real phase: main-qa nodes -- this node was never re-backfilled after
    that migration. PR #2774 (this tactic's own work) merged
    2026-07-10T16:52:57Z; execution.markers already carry qa-done+reviewed, and
    the body already carries a full finalized plan plus a '## main-qa residue'
    checklist (added at qa time). The selector's frozenTacticSelectable gate
    does not distinguish this stale squatter shape from a genuine draft, so it
    queued this node for align-tactics finalize/decompose -- which would be
    actively harmful here (re-planning or resetting phase:implement on
    already-shipped, reviewed, merged work). Declining to run the Workflow on
    this target. This is the same defect class already parked on sibling
    tactic-noncodegen-session-model-defaults (commit 9af38372, 2026-08-03) --
    that park's recommendation predicted more lingering attributes.phase
    squatters exist; this node is one of them."
  since: 2026-08-04
  recommendation: "Migrate this node's frontmatter directly to current schema
    (phase: main-qa, attributes: {}) via a standalone state-only graph-commit,
    mirroring precedent commit 234e52e7 -- no qa/review needed, it is a pure
    frontmatter fix restoring the shape this node already held once (phase:
    review) before the main-qa squatter round-trip. That unblocks the qa-main
    node-lane handler (tactic-main-qa-phase Unit 2,
    .claude/skills/qa-main/SKILL.md) to run the '## main-qa residue (qa
    2026-07-06)' checklist already recorded in this node's body and land it to
    done. Separately: this is the second sibling of this exact defect class
    found (after tactic-noncodegen-session-model-defaults, 9af38372) -- the grep
    sweep that park's recommendation called for (intentions/tactic-*.md for
    lingering 'attributes:\\n  phase:' squatters, plus hardening router.ts's
    isDraft to exclude legacy attributes.phase carriers) has not yet run; a
    future session should run it rather than let the selector keep misrouting
    these one at a time."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  phase: main-qa
---
# per-phase routing metric — qa routes on actionability, not hit_rate, so a triage-shaped phase is not promoted to Opus by a rate it cannot move

## Context

The routing policy generator
(`.claude/skills/dispatch-token-audit/scripts/generate-phase-model-policy.sh`)
routes both allowlisted phases (`qa`, `review`; line 84) on pooled
`hit_rate = fixes_applied / findings_surfaced`, floor 0.5, min sample 20
(lines 74-75, 91-99). qa-fix's accounting is correct — its fix lane keeps
a landed-fix tally incremented only when an `/implement-unit` invocation
hands control back with a landed commit (`.claude/skills/qa-fix/SKILL.md:866-881`),
guarded against a zero-fix `completed_with_fixes` (lines 890-900) — but
qa's designed output is triage and follow-ups: in the 2026-06-26→07-03
window it surfaced 108 findings, 93 actionable (0.86), filed 68
follow-ups, and applied 0 in-lane fixes across 84 sessions. Pooled
hit_rate is structurally 0, so the live
`dispatch.config/phase-model-policy.json` promotes qa to `claude-opus-4-8`
on a rate the phase cannot move. Strategy-token-economy's clarification 3
licenses exactly this remedy: route the phase on a metric it can move.

Review keeps hit_rate: its Workflow counts subagent-applied fixes into
`fixes_applied` directly (`review-fix/SKILL.md:824-838`;
`outcome-envelope.md:105-107`), so the rate is meaningful there.

## Unit 1 — per-phase metric selection in the policy generator

**Recommended model:** sonnet

Scope:
- `generate-phase-model-policy.sh` decision logic (lines 82-99): qa routes
  on `actionability` (`findings_actionable / findings_surfaced`, already
  pooled in `by_phase_outcome`) against its own env-overridable floor
  (`QA_ACTIONABILITY_FLOOR`, default 0.5); review keeps `hit_rate` against
  `HIT_RATE_FLOOR`. Keep `MIN_SAMPLE` shared. Record the metric name in
  each rationale entry (`{decision, metric, sessions, <rate>, cost_usd,
  price_proxy_usd}`) so a reader can see which rate drove the route.
- Preserve purity (no clock; `generated_at` from `window.until`, lines
  60-64) and the fail-closed two-phase allowlist (line 84).
- Update
  `.claude/skills/dispatch-token-audit/scripts/test-generate-phase-model-policy.sh`
  (cases at lines 75-129): the healthy fixture's qa decision now derives
  from actionability (window data: qa flips to `keep-cheap`); add a
  low-actionability promote case and a `QA_ACTIONABILITY_FLOOR` override
  case.
- Doc: `.claude/docs/outcome-envelope.md` — add a short note under the
  rate formulas (lines 120-130) naming which rate routes which phase and
  why (delegated fix lanes make hit_rate unmovable for qa).
- Out of scope: changing qa-fix's envelope emission
  (`dispatch-emit-outcome` contract unchanged) and the consumer
  `dispatch-phase-model` (route values are unchanged in shape).

## Dependencies

None.

## Reuse

- Pooled rates already computed in `by_phase_outcome`
  (`aggregate-usage.sh:682-714`) — no new aggregation needed.
- Test harness patterns in `test-generate-phase-model-policy.sh`.

## Verification

```verify
.claude/skills/dispatch-token-audit/scripts/test-generate-phase-model-policy.sh
```

Manual (operational, after merge): re-run the generator over a fresh
`tmp/usage-audit.json` and write the policy per the audit skill's step 7 —
qa's rationale shows `metric: actionability` and, on current data,
`decision: keep-cheap`, reverting the suspect Opus promotion.

## Implementation notes

Single unit; implement in a subagent with `model: sonnet`; supply this
Context and Scope; constrain to working-tree edits. Note: the doc edit
touches `.claude/docs/`, and skill-adjacent commits can hit the auto-mode
agent-behavior commit gate — expect a grant prompt rather than a failure.
`strategy_fingerprint` recipe (interim until tactic-graph-dispatch-schema
lands): sha256 hex of `JSON.stringify({statement, clarifications,
conditions, serves, success_signal, tooling_goals})` as loaded by
intentionsutil `listNodes`.

## main-qa residue (qa 2026-07-06)

- dispatch.config/phase-model-policy.json is a shared project-root artifact outside all worktrees, rewritten only by the next /dispatch-token-audit skill run (step 7), not by this PR's merge. I read the current live file and confirmed it still shows the pre-fix bug live (rationale.qa = {decision: promote, hit_rate: 0, sessions: 84} -- qa currently mis-routed to claude-opus-4-8). After the next /dispatch-token-audit run (no scheduler/cron wiring found for it in this repo -- appears user/session-invoked, so may need a manual trigger), verify the freshly-written dispatch.config/phase-model-policy.json shows routes.qa == "claude-sonnet-4-6", rationale.qa.metric == "actionability", rationale.qa.decision == "keep-cheap", reverting the live Opus mis-promotion.

---
id: tactic-review-api-cost-lens-merge
kind: tactic
statement: Merge the firebase and cost review lenses into one api-cost lens and
  widen its trigger so it samples every diff touching an API or query call site
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-31 review-fix token audit interview. Author
  ruled api-cost review a priority whose zero-finding windows read as sampling
  error, not zero yield; the lens fired on only 5 of 18 runs. Deliberately
  raises this lens's draw. See clarification 18 on strategy-token-economy.
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
  rationale: "Author-directed 2026-08-01: prioritize review-phase token/agent-cost
    reduction. Puts this tactic ahead of the undecomposed baseline and on par
    with other tier-2 improvement work, without contending with active
    reliability fixes (top-of-band ~55-61)."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Requirement ambiguity blocking finalize: the lens merge forces a
    security-classification decision the record does not answer. Live code:
    `firebase` is a SEC_SOURCE (review-fix.js:1354-1364), OWASP/STRIDE-filled
    (:775-781), so its findings can classify `Required`, are verify-eligible
    (:1398-1400), can reach the deviation gate, and fall back to `Out-of-scope`;
    `cost` is not a SEC_SOURCE, sets OWASP ''/STRIDE '' (:754-774), is never
    `Required`, never verify-eligible, and falls back to `Deferred` (:1374-1381)
    -- an invariant also documented at
    .claude/skills/review-fix/references/disposition-table.md:54-62. Collapsing
    both under one Source name forces one answer at all three sites, and each
    available answer is a change the author has not ruled on: (a) wholly
    advisory -- what this tactic's Scope line implies -- demotes firebase's
    Firestore-rules-permissiveness, emulator-code-on-production-paths, and
    API-key-exposure checks from merge-blocking security findings to
    non-blocking follow-ups, a detection and escalation reduction that the
    strategy's quality-preservation condition forbids as an efficiency lever;
    (b) wholly security-classified makes cost/scaling findings merge-blocking
    and verify-eligible, breaking cost's documented non-escalation invariant
    exactly as the trigger widens the lens's fire rate. Clarification 18
    authorizes retaining and widening the lens on expense and sampling grounds
    only and is silent on classification, so this is a record-completeness
    defect of the /align-strategy round that produced the strategy, not
    something this session should guess. Recommended resolution to ratify: keep
    the merge at the lens/trigger level and split classification by sub-pattern
    -- one api-cost finder emitting security-classified findings (OWASP/STRIDE
    filled, Required-eligible, verify-eligible) for rules-permissiveness /
    emulator-reachability / key-exposure, and advisory findings (OWASP/STRIDE
    empty, always Deferred, never verify-eligible) for query-cost / amplifier /
    N+1 -- preserving both detection and the cost non-escalation invariant. The
    'known defect to fix while here' (an api-cost-specific adversarial-skeptic
    brief, since the exploitability brief systematically refutes a cost finding)
    only becomes live under a classification that makes any api-cost finding
    verify-eligible, so it hangs on the same ruling. Filed on this tactic and
    not on strategy-token-economy per
    .claude/skills/align-tactics/references/tactic-target.md -- a per-node
    tactic-target session never edits the serving strategy. Everything else in
    the round is clean: office_hours null, signal unvalidated, rounds.count 0
    (no round-cap issue), no recorded condition failed, and the merge is
    confirmed unimplemented (agentFinderSet still pushes both 'firebase' and
    'cost' at review-fix.js:495). Recommend: get the author's classification
    ruling in office hours, land it as a new clarification on
    strategy-token-economy via an /align-strategy pass, then re-run
    /align-tactics tactic-review-api-cost-lens-merge to finalize -- and when
    planning, re-derive anchors, since the draft body's 489-511 / 513-517 /
    915-925 are stale after PR #3007; live sites are agentFinderSet
    review-fix.js:487-499, DOMAIN_PROMPTS :632-645, cost finderPrompt :754-774,
    skeptic briefs :1423-1461, plus the lockstep normative spec
    .claude/skills/dispatch-propagate/scripts/dispatch-review-finders and its
    test."
  since: 2026-08-03
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Merge the firebase and cost review lenses into one api-cost lens and widen its trigger so it samples every diff touching an API or query call site

## Context

Author ruling, 2026-07-31: api-cost review is a PRIORITY. A zero-finding
window is read as sampling error, not as zero yield, because an api-cost
overrun has high impact on overall goals. This lens is the standing exception
to the yield-per-draw ranking that governs every other lens — it is kept and
widened even though it found nothing in the measured window.

Measured over 18 review-fix runs, 2026-07-27 to 2026-07-31:

| lens | agents | draw | findings | fired on |
|---|---|---|---|---|
| `firebase` | 5 | $6.46 | 0 | 5 of 18 runs |
| `cost` | 5 | $7.32 | 5 | 5 of 18 runs |

Together 0.9% + 1.0% of review-fix spend. The zero-finding result is
uninformative precisely BECAUSE the lens only fired on 5 of 18 runs — that is
the sampling gap, and the correct response is more sampling, not less.

## Scope

- `.claude/workflows/review-fix.js`. Rename the `firebase` lens to
  `api-cost` (author instruction) and merge the separate `cost` finder into
  it — both already review API-usage economics. The `cost` prompt lives at
  lines 489-511 (`finderPrompt`), the domain lenses at 513-517 with their
  briefs in `DOMAIN_PROMPTS`.
- Preserve BOTH prompts' content verbatim as sections of the merged brief:
  the Firestore query/amplifier/N+1 patterns from `cost`, and the firebase
  domain brief. Dropping either loses coverage.
- Widen the trigger: `agentFinderSet(surface, app_or_rules)` currently
  surface-gates this lens to roughly a quarter of runs. It must fire on any
  diff touching an API or query call site.
- Keep the advisory/non-blocking disposition: cost findings set Source
  `cost`, OWASP `""`, STRIDE `""` and are never `Required`.
- EXPECTED OUTCOME IS INCREASED DRAW — from ~$14 toward ~$25-30 proxy per
  4-day window. That is the intent, not a regression.

## Known defect to fix while here

The adversarial skeptic prompt (review-fix.js:915-925) gives every
non-erosion finding the "FALSE POSITIVE / not-exploitable" brief. A cost or
api-cost finding is NEVER exploitable, so that brief would systematically
refute it — the same failure mode the `Source === 'erosion'` branch exists to
correct. If api-cost findings are ever routed to verify, they need their own
brief (argue the cost model is wrong), not the exploitability one. Today they
escape this only because advisory findings do not reach the gate.

## Verification

- The merged lens fires on materially more than 5 of 18 comparable runs.
- Both the Firestore-pattern checks and the firebase domain checks still
  appear in the merged brief.
- tactic-mainqa-review-cost-finder's observation checklist (a live review
  whose diff contains an unbounded Firestore scan) still passes against the
  merged lens.

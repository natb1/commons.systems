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
  rationale: "Author-directed 2026-08-01: prioritize review-phase token/agent-
    cost reduction. Puts this tactic ahead of the undecomposed baseline and on
    par with other tier-2 improvement work, without contending with active
    reliability fixes (top-of-band ~55-61)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
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

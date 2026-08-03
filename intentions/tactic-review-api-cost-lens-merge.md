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
  reason: "(/align-tactics tactic-target round, 2026-08-03.) Requirement
    ambiguity: this tactic's own trigger-widening requirement (\"samples every
    diff touching an API or query call site\") has no mechanism in the current
    review-fix.js classifier, and the strategy record fixes the intent and the
    target draw (~$14 toward ~$25-30 proxy per 4-day window) but not the
    mechanism. Verified at HEAD (post PR #3024,
    tactic-review-domain-lens-consolidation): firebase and cost already share
    one identical gate (`if (app_or_rules) { set.push('firebase', 'cost'); }`,
    review-fix.js:507, inside the `>>> domain sweep gate` sentinels sliced by
    review-fix-domain-sweep-probe.mjs) — merging the two lenses alone is
    therefore sampling-neutral, and the entire recorded draw increase must come
    from the trigger change alone. `app_or_rules`
    (.claude/skills/dispatch-propagate/scripts/dispatch-security-surface:88-111)
    is a path/extension predicate only (app-source extensions or
    firestore/storage.rules, excluding everything under `.claude/`) and never
    inspects diff content, so \"touches an API or query call site\" is not
    expressible in it today. Three candidate mechanisms surfaced, none clearly
    sanctioned by the record: (a) relax the shared app_or_rules path predicate
    (e.g. drop the `.claude/` exclusion, or fire on any surface==='code' diff) —
    cheap, but reaches roughly 18 of 18 runs (~3.6x current draw), overshooting
    the recorded ~2x target and mutating a classifier the whole finder roster
    shares; (b) add diff-content call-site detection
    (fetch/axios/getDocs/query/collection scans) — matches the statement's
    wording but is a new mechanism in a normative bash script mirrored in JS,
    with its own test suite and maintenance burden; (c) give api-cost its own
    gate inside agentFinderSet decoupled from the shared app_or_rules boolean —
    contains the blast radius to this lens but abandons the shared-surface
    framing. The recorded draw target rules out the cheapest option (a) as
    written, so this session cannot resolve the choice from the graph alone.
    Separately (non-blocking, folded into this park rather than a second one):
    the on-disk draft body predates the 2026-08-03 split-classification
    clarification on strategy-token-economy and still states the wholly-advisory
    disposition that ruling declined, and every code-anchor line number the
    draft cites is stale after the domain-sweep fold (commit 7deaf80b) — the
    finalize plan must carry the split (security-classified
    rules-permissiveness/emulator-reachability/key-exposure; advisory
    query-cost/amplifier/N+1) and re-locate current line numbers rather than
    trust the draft's citations."
  since: 2026-08-03
  recommendation: "At office-hours, rule on strategy-token-economy naming which
    trigger predicate the widened api-cost lens must use: (a) relax the shared
    app_or_rules path predicate (reaches ~18/18 runs, ~3.6x current draw,
    overshoots the recorded ~2x target, changes a classifier every finder
    shares), (b) add diff-content call-site detection
    (fetch/axios/getDocs/query/collection scans — matches the statement's
    wording, but is a new mechanism mirrored across a bash script and JS with
    its own test suite), or (c) a per-lens gate inside agentFinderSet decoupled
    from app_or_rules (contains the blast radius, abandons the shared-surface
    framing). Confirm whether ~3.6x draw is acceptable if (a) is chosen. Then
    re-run /align-tactics tactic-review-api-cost-lens-merge to finalize the plan
    against that ruling."
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

---
id: tactic-review-verify-per-file-batching
kind: tactic
statement: Batch the adversarial skeptic gate per (run, file) instead of per
  finding, preserving one independent adversarial read per file
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-31 review-fix token audit interview. Verify
  is the single largest allowance line at 31% of review-fix draw ($695 proxy,
  131 agents) spanning only 41 distinct file groups — a 3.2x reduction. Author
  rejected folding the call into classify because that would destroy the gate's
  independence. See clarification 19 on strategy-token-economy.
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Batch the adversarial skeptic gate per (run, file) instead of per finding, preserving one independent adversarial read per file

## Context

Measured over 18 review-fix runs, 2026-07-27 to 2026-07-31. The `verify`
phase is the single largest allowance line in review-fix: $695 price-proxy,
31.0% of the phase's total draw, from 131 Sonnet/effort-high subagents.

Each skeptic today judges exactly ONE finding and independently re-reads the
code to do it (avg peak context 72,583). Those 131 agents span only **41
distinct (run, file) groups** — findings-per-file measured at 1 file-group
with 8 findings, 2 with 7, 3 with 6, 3 with 5, 6 with 4, 5 with 3, 9 with 2,
and 11 with 1. So the same file is read up to 8 times for 8 separate
judgments.

## Scope

- `.claude/workflows/review-fix.js` `phase('verify')` block, lines 858-935.
  Today `verifyJobs` is a flat list over (finding x skeptic). Regroup it by
  the finding's file (the part of `f.Location` before the first `:`), so one
  agent judges every eligible finding on a file.
- Preserve the severity-scaled skeptic count: `f.Confidence === 'high'` gets
  2 skeptics, medium/low get 1, floor of 1 and NEVER 0 (a Required finding
  with 0 votes is treated as Unverified by `applyVerifyDrop` — dropped and
  filed, not fixed). Under batching this means a file group needs 2 rounds
  when it contains any high-confidence finding.
- Preserve the erosion branch: `f.Source === 'erosion'` takes the
  metric-misfired brief, never the exploitability brief. A mixed file group
  must not collapse those two briefs into one.
- The agent returns a verdict PER finding id, not one verdict for the group.
- Out of scope: changing verify ELIGIBILITY (which findings reach the gate).
  That stays `bucket === 'Required' || (Source === 'erosion' && bucket ===
  'Fixed')`, and see tactic-review-cross-lane-dedup which must not widen it.

## Invariant this must not break

The gate's value is an INDEPENDENT adversarial read. Folding the skeptic call
into the `classify` agent was considered and rejected by the author on
2026-07-31: classify has already bucketed every finding, so it would be
grading its own classification. Batching preserves independence (a separate
agent, reading the file itself); merging into classify does not. Agent count
is not the invariant — independence is.

Known residual risk, unmeasured: batching could let one weak finding anchor
judgment of its file-mates. If the refutation rate moves materially away from
the measured 69% baseline (91 refuted / 37 upheld) after this lands, that is
the signal to investigate.

## Verification

- Refutation rate stays near the 69% baseline on the next audit window.
- Skeptic agent count per run drops toward the 41/18 ~= 2.3 file-groups-per-run
  measured, from the current 131/18 ~= 7.3.
- No Required finding reaches the fix stage with zero votes.

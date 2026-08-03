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
office_hours:
  reason: "2026-08-03 /align-tactics tactic-target drift review: the strategy gate
    is otherwise clean (office_hours null, reading null, rounds.count 0 — not a
    round-cap issue), but two MATERIAL unrecorded premises need an author ruling
    before this tactic's plan can be authored. Both would land as amendments to
    strategy-token-economy clarifications 19/20 and both touch the
    detection-quality tradeoff condition 5 reserves to the author. (1) THE
    CODE-REVIEW RESIDUE SKEPTIC PRE-GATE POST-DATES THE RULING AND SPENDS THIS
    TACTIC'S BENEFIT ARITHMETIC. Clarification 20 (2026-07-31) rejected
    re-skepticizing Lane-A residue on an explicit cost premise: the '~103
    residue items measured per window would add roughly 100 agents and cancel
    the batching gain entirely'. Commit 7c772829 (2026-08-02, after that ruling)
    does exactly that for code-review-sourced residue — review-fix.js:1707-1775
    launches ONE Sonnet/effort-high adversarial skeptic per code-review residue
    item, un-batched, one file read per item, dropping refuted or unvoted items
    at :1760-1772 — and its own comment contradicts clarification 20's trust
    premise verbatim ('no instrument receipt, no internal verification survives
    the parse', :1695-1701). Those agents are labelled residue-verify:<i> under
    phase 'residue', not 'verify', so the 131-agent / 41-file-group / 3.2x
    baseline this tactic rests on is arithmetically intact — but the
    review-fix-wide agent-count reduction the tactic is JUSTIFIED by is not.
    Unrecorded: whether 'batch skeptics per (run, file)' covers the pre-gate's
    per-item fan-out too (preserving the recorded arithmetic, and requiring this
    node's Scope to include :1707-1775) or is verify-phase-local (in which case
    the benefit claim and Verification bounds must be restated as
    verify-phase-local and the un-batched residue fan-out becomes separate
    scope). This node's Scope line 'Out of scope: changing verify ELIGIBILITY
    ... see tactic-review-cross-lane-dedup which must not widen it' does not
    answer it, and the sibling tactic-review-cross-lane-dedup is itself
    office_hours-parked since 2026-08-03 on the same commit-7c772829 fact,
    unratified — so this tactic cannot assume the answer. (2) 'EACH FILE READ
    ONCE' vs THE PRESERVED 2-SKEPTIC TIER. Clarification 19 derives 3.2x from
    131 agents over 41 file groups 'with each file read once and one independent
    adversarial judgment per file preserved' — arithmetic that holds only at
    exactly one agent per file group. This node's Scope requires the opposite:
    preserve the severity-scaled count (high-confidence gets 2 skeptics, current
    source review-fix.js:1416-1422), so 'a file group needs 2 rounds when it
    contains any high-confidence finding'. Under that rule such a file IS read
    twice, the realized reduction falls below 3.2x by an unmeasured amount (the
    high-confidence-per-group distribution was never recorded), and this node's
    own Verification threshold ('agent count per run drops toward 41/18 ~= 2.3')
    is unreachable by construction. The alternative — one skeptic per group
    regardless of confidence — is a detection/precision change condition 5
    reserves to the author: applyVerifyDrop (review-fix.js:565-583) drops on
    refutedCount >= 1, so halving the high-confidence tier's votes makes drops
    strictly less likely, sends more Required findings to the Opus fix stage,
    and moves the refutation rate off the 69% baseline (91 refuted / 37 upheld)
    for structural reasons — corrupting the very signal this node's Verification
    section names as its regression detector. Ratify either way, with the 3.2x
    figure and this node's Verification thresholds restated to match. NOTE FOR
    WHOEVER RESUMES: this node's Scope anchors are stale. It cites
    phase('verify') at review-fix.js:858-935; the block is now :1393-1489
    (requiredFindings filter :1401-1403, severity-scaled skeptic count
    :1416-1422, erosion-vs-security prompt branch :1435-1462,
    votesById/rationalesById aggregation :1478-1486, applyVerifyDrop call
    :1489). At implementation, reuse filePath(location) (:1531-1535, already
    called at :1538 and :2069) rather than reimplementing Location-splitting,
    mirror the fix phase's per-file-group fan-out shape (:1536-1576), and add an
    array-shaped sibling to VERDICT_SCHEMA (:170-178) since one agent must now
    return a verdict per finding in its group. RECORD-COMPLETENESS NOTE (a
    tactic-target session never edits the serving strategy): one immaterial
    observation should land as a dated clarification on strategy-token-economy
    in a future strategy-target /align-tactics round or an /align-strategy
    session — the per-file grouping key is the file path and the erosion brief
    is source-keyed, so this tactic is insensitive to the Lane-B lens-set churn
    in flight (tactic-review-domain-lens-consolidation at implement,
    tactic-review-api-cost-lens-merge raw); the only cross-tactic coupling is
    file-location overlap in review-fix.js with
    tactic-review-skill-body-decomposition, a sequencing concern rather than a
    design premise. Recommend: run /office-hours
    tactic-review-verify-per-file-batching for the author to rule on both
    premises — ideally in the same sitting as the sibling
    tactic-review-cross-lane-dedup park, since premise (1) here and that
    sibling's premise (2) are the same commit-7c772829 fact — then re-invoke
    /align-tactics tactic-review-verify-per-file-batching to finalize the plan
    under the ratified rules."
  since: 2026-08-03
  recommendation: null
  session_type: other
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

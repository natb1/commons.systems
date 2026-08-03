---
id: tactic-review-cross-lane-dedup
kind: tactic
statement: Deduplicate built-in-lane residue against owned-lens findings for fix
  assignment only, leaving skeptic eligibility unchanged
owner: ai
status: raw
parent: null
rationale: 'Surfaced by the 2026-07-31 review-fix token audit interview.
  laneAResidue never enters the allFindings pool, so 7 of 27 confirmed findings
  per window were dispositioned and fixed twice by two different Opus agents —
  duplicate draw plus a concurrent-edit hazard on one file. See clarification 20
  on strategy-token-economy. Amended 2026-07-31 (second interview): the "7 of
  27" measurement describes overlap between two OWNED reviews, because the
  built-in never ran — see clarification 17. The defect this node fixes
  (laneAResidue never entering the allFindings pool) is unaffected and still
  real; only the magnitude is unmeasured against the real instrument, and the
  serialized post-fix ordering in clarification 24 removes part of the overlap
  structurally.'
reading: null
gap: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
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
  reason: "2026-08-03 /align-tactics finalize attempt (tactic-mode Workflow, run
    wf_7002ef10-a60): the gate was eligible (drift eligibility.decomposable=true
    — not a round-cap issue) and this run supplied clarifications 26 and 27,
    which ratified the two premises that parked this node's prior attempt
    (commit ea045077, cleared a15c52dd). But the two-sided drift review found
    those two clarifications do not fully settle the plan: a NEW material
    unrecorded premise blocks authoring. WHICH LANE-B TERMINAL DISPOSITIONS
    QUALIFY A FINDING TO ABSORB ITS LANE-A RESIDUE TWIN. Clarification 27 places
    the cross-lane merge at or after the code-review residue skeptic pre-gate;
    verified against the live file this round, that pre-gate sits at
    review-fix.js ~1694-1781, INSIDE the residue phase (phase('residue') ~1617),
    which is downstream of the shared pipeline's verify phase (~1394,
    applyVerifyDrop ~1489 splitting keptFindings vs refuted/unverified) and fix
    phase (~1524). So by the time the merge runs, every Lane-B finding already
    carries a terminal disposition — fixed, refuted, unverified, or (later, at
    ~2054) queued for deferred filing — and clarification 26 only rules that the
    Lane-B record is 'fixed exactly once', which presumes the twin was actually
    fixed. It is silent on the refuted/unverified case and the deferred case.
    Matching Lane-A residue against the full deduped pool would let a REFUTED
    Lane-B twin suppress a real Lane-A item, deleting it from the
    residue-disposition ledger — a detection loss condition 5 forbids. Matching
    only against actually-fixed Lane-B findings is detection-safe but leaves the
    Lane-A residue item double-handled against a Lane-B deferred follow-up on
    the same root, exactly the duplication clarification 20's dedup exists to
    remove — and honoring the deferred case requires computing deferred_filings
    (currently ~2054) before or during the residue phase instead of after it.
    PROPOSED FOR RATIFICATION: only a Lane-B finding that survived verify and
    was actually fixed absorbs its Lane-A twin (a Refuted/Unverified-dropped
    finding never absorbs — the Lane-A item stays in the residue ledger); the
    deferred case is the genuinely open half and needs an explicit author call —
    dedup-wins (absorb, at the cost of reordering/duplicating the
    deferred-filing computation) or ledger-completeness-wins (do not absorb,
    accepting one duplicate). Recommend co-scheduling this sitting with the
    still-parked sibling tactic-review-verify-per-file-batching, parked on the
    same commit-7c772829 fact and naming this tactic by id — clarifications 26
    and 27 settled only the cross-lane half of that coupling, not this
    terminal-disposition question. RECORD-COMPLETENESS NOTE (a tactic-target
    session never edits the serving strategy): this round's drift review also
    surfaced two immaterial observations that should land as dated
    clarifications on strategy-token-economy in a future strategy-target
    /align-tactics round or an /align-strategy session — (a) clarifications 26
    and 27 are NOT in tension: 27 fixes placement (the cross-lane pass is a
    late, one-directional suppression spliced between the pre-gate's
    laneAResidue filter at ~1780 and the residue-disposition prompt build at
    ~1784+), and under that placement 26's 'Lane-B record always survives'
    guarantee holds by construction — dedupMerge (~511-547) stays a Lane-B-only
    pre-classify collapse and needs no lane-aware tie-break; (b) condition 3's
    'the audit-written policy loop surfaces recommendations, it never
    auto-applies' describes a mechanism that no longer exists — PR #2872 (commit
    7fcbb7dd, 2026-07-14) deleted generate-phase-model-policy.sh and the live
    phase-model-policy.json; dispatch-phase-model is now a static map and
    routing is applied by hand per dispatch-token-audit/SKILL.md — condition 3
    is not failed, it holds more strongly (no auto-apply path exists at all);
    read it going forward as two live requirements (verified-yield-only
    grounding, explicit author approval) plus a historical reference to a
    retired loop. REUSE EVIDENCE (do not re-hunt):
    residueLocationFile/residueLocationInDiff (review-fix.js ~1144-1160) is a
    directly reusable path-normalization primitive for the cross-lane location
    key; the sentinel-delimited slice-and-probe convention used by
    review-fix-residue-death-probe.mjs / test-review-fix-residue-death.sh (and
    review-fix-instrument-probe.mjs / test-review-fix-instrument.sh) is the
    confirmed pattern for a new cross-lane-dedup unit's own pure
    merge/suppression function and its CI-wired probe/test pair. LIVE LINE
    ANCHORS as verified this round (re-confirm before use, code moves): dedup
    phase review-fix.js:1212, classify:1297, verify:1394 (applyVerifyDrop:1489),
    fix:1524, residue phase:1617, code-review residue skeptic
    pre-gate:~1694-1781, file phase:2030, deferred_filings computed:~2054.
    Recommend: run /office-hours tactic-review-cross-lane-dedup for the author
    to rule on the terminal-disposition-absorption premise, then re-invoke
    /align-tactics tactic-review-cross-lane-dedup to finalize the plan under the
    ratified rule."
  since: 2026-08-03
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Deduplicate built-in-lane residue against owned-lens findings for fix assignment only, leaving skeptic eligibility unchanged

## Context

The two review lanes never see each other. In
`.claude/workflows/review-fix.js`:

- `laneAResidue` is collected at line 636 and flows straight to the
  `phase('residue')` block at 1081.
- `allFindings` is built at 655-661 from the Lane B finder results plus
  `prescanned_findings`, and flows through dedup (676) -> classify (761) ->
  verify (858) -> fix (988).

`laneAResidue` is NEVER added to `allFindings`, so no deduplication happens
across the lanes.

Measured over 18 runs, 2026-07-27 to 2026-07-31: of 27 skeptic-upheld Lane B
findings, **9 sat at a location Lane A had also flagged, and reading the
descriptions confirmed 7 of those 9 were genuinely the same issue** (the
other 2 shared a source line but were distinct defects). File-level overlap
is heavier still: 31 of 40 Lane B (run, file) pairs were also flagged by
Lane A.

Consequence today: the same defect is dispositioned by the Opus residue agent
AND fixed by a separate Opus fix agent. That is duplicated draw, and because
`fix` fans out per file while `residue` also edits, it is a genuine
concurrent-edit hazard on one file.

## Scope

- Merge `laneAResidue` into the dedup pool so cross-lane duplicates collapse,
  and route each deduplicated group to exactly ONE fix owner.
- Carry a per-finding LANE TAG through the merged pool.

## The invariant this must not break

Verify eligibility must be unchanged by the merge. Lane A residue is never
routed to the adversarial skeptic stage. Two reasons, both binding:

1. The residue prompt (lines 1121-1130) states these findings are "ALREADY
   CONFIRMED by the built-ins' own internal verification... Do NOT re-run
   adversarial skepticism or try to refute them."
2. Arithmetic: ~103 Lane A residue items per window would add roughly 100
   skeptic agents, cancelling the entire gain from
   tactic-review-verify-per-file-batching.

So skeptic eligibility stays exactly `bucket === 'Required' || (Source ===
'erosion' && bucket === 'Fixed')`, evaluated on Lane B findings only. The
merge is for duplicate elimination and fix assignment ONLY. Author ruling,
2026-07-31.

## Dependency

Coordinate with tactic-review-verify-per-file-batching — both touch the pool
between classify and fix. Landing dedup without the lane tag would silently
widen verify eligibility, which is the failure mode this section exists to
prevent.

## Verification

- A defect found by both lanes at the same location produces exactly one
  applied fix, not two.
- Skeptic agent count does not rise after the merge.
- No file is edited by the residue agent and a fix agent in the same run.

## Reconciliation (2026-07-31, second interview)

The "7 of 27 confirmed findings dispositioned and fixed twice" measurement
describes overlap between **two owned reviews**: the built-in never ran, so
what this node calls "built-in-lane residue" was produced by a general-purpose
Opus agent (see `strategy-token-economy` clarification 17).

The defect is unaffected and still real — `laneAResidue` never enters the
`allFindings` pool (`.claude/workflows/review-fix.js:636` vs `:655`), so
whatever Lane A produces is dispositioned independently of Lane B. Only the
*magnitude* is unmeasured against the real instrument.

Note the interaction with clarification 24: serializing the built-in ahead of
the owned lenses, running the lenses against the post-fix tree, removes the
*fixed*-finding half of the overlap structurally. This node's remaining job is
the residue half — findings the built-in reports but does not fix.


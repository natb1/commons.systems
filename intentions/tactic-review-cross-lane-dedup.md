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
    wf_5ee0b8b7-437): the gate is eligible (not a strategy-round cap issue) but
    the two-sided drift review surfaced two MATERIAL unrecorded premises that
    both need an author ruling before this tactic's plan can be authored. Both
    amendments would land on strategy-token-economy clarification 20 and both
    touch the detection-quality tradeoff condition 5 reserves to the author. (1)
    MERGED-ENTRY LANE IDENTITY. Clarification 20's lane-tag mechanism presumes
    each finding carries exactly one lane, but cross-lane dedup's whole purpose
    is producing entries that are both Lane-A- and Lane-B-derived.
    review-fix.js:507-544's dedupMerge collapses a same-root group to ONE
    representative (`rep = ordered[0]` by Confidence desc, _idx asc;
    `Object.assign({}, rep, ...)`), so one lane's Source/id/bucket survives and
    the other's is discarded into the `sources` union. Unrecorded: which lane
    wins the slot, and whether an absorbed Lane-A item still appears in the
    residue-disposition ledger (:1727-1812). Lane-A-wins silently NARROWS
    skeptic coverage (a Lane-B Required finding loses its bucket and drops out
    of verify) — a detection reduction condition 5 forbids, and a direction the
    draft body never considered, guarding only against widening. Proposed for
    ratification: the Lane-B record is always the surviving representative, so
    verify eligibility (:566, :1399) is bit-for-bit unchanged and no
    Lane-A-derived entry can acquire bucket 'Required'; the absorbed item is
    recorded in `sources` and suppressed from the residue list so it is fixed
    exactly once. (2) THE SKEPTIC PRE-GATE POST-DATES THE RULING. Clarification
    20's ruling rests on 'the built-ins already apply their own internal
    verification' plus a ~100-extra-agent cost argument. Commit 7c772829
    (2026-08-02, after the 2026-07-31 ruling) states the opposite for
    code-review residue at review-fix.js:1637-1650 — 'no instrument receipt, no
    internal verification survives the parse' — and now routes every code-review
    residue item through one adversarial skeptic with the same
    refute-under-uncertainty bias Lane-B Required findings get, dropping refuted
    items at :1723. Both the trust premise and the cost premise the author ruled
    on are therefore partly spent. Proposed for ratification: 'never routed into
    the adversarial skeptic stage' means the VERIFY stage only; dedup runs at or
    after the :1723 filter so it never merges refuted items; a pre-gate-upheld
    item stays non-verify-eligible, keeping the merge asymmetric and the
    arithmetic intact. Parked on the node rather than the strategy deliberately:
    the ambiguity is local to this tactic's plan, and parking
    strategy-token-economy would freeze its seven other raw drafts for it. Note
    for whoever resumes: the draft body's line anchors (:636, :655-661, :676,
    :761, :858, :988, :1081, :1121-1130) have all drifted and must be
    re-anchored to :1169-1183, :1186-1194, :1211-1287, :1293-1388, :1392-1420,
    :1520-1538, :1727-1812; laneAResidue also uses lowercase
    location/description/severity fields against allFindings' capitalized
    Location/Description/Confidence/Source, so an explicit normalizer is new
    code. RECORD-COMPLETENESS NOTE (this tactic-target session never edits the
    serving strategy): the same Workflow run also surfaced three immaterial
    observations that should land as dated clarifications on
    strategy-token-economy in a future strategy-target /align-tactics round or
    an /align-strategy session — (a) clarification 24's 'removes part of the
    overlap structurally' claim is half pre-existing: the residue phase has run
    sequenced AFTER the fix fan-out since 2026-07-18 (commit d8937946), so only
    the fixed-finding half is newly attributable to clarification 24, not the
    concurrent-edit-avoidance half; (b) the routing condition's no-auto-apply
    half is now structurally satisfied outside any decomposition (PR #2872
    retired the learned/adaptive phase-model policy; dispatch-phase-model is a
    static map with an explicit no-auto-write invariant; /dispatch-token-audit
    is report-only) — no round should re-derive the auto-apply prohibition as
    new scope; (c) tactic-mainqa-review-cost-finder serves this strategy but is
    owner:human/status:delegated, so it never registers in the success signal's
    claude-eligible closure-velocity count — whether a claude-eligible
    counterpart is still needed is an open question for a future round, not a
    defect in the current signal definition. Recommend: run /office-hours
    tactic-review-cross-lane-dedup for the author to rule on both material
    premises (and, separately, land the three record-completeness notes above
    onto strategy-token-economy), then re-invoke /align-tactics
    tactic-review-cross-lane-dedup to finalize the plan under the ratified
    rules."
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


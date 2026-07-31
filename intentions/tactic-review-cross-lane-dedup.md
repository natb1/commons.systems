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


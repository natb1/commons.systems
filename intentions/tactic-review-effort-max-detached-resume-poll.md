---
id: tactic-review-effort-max-detached-resume-poll
kind: tactic
statement: "Raise the review phase's nested `/code-review` pre-stage from `low`
  to `max` effort, together with the detached/resume-poll invocation harness
  that makes a `max` run survivable — a measured `max` run on a real diff ran
  39m23s and was killed having produced ZERO bytes, because `claude -p` buffers
  all output until completion, so raising the effort constant alone converts
  every review into a total loss"
owner: ai
status: raw
parent: null
rationale: "Author-decided 2026-08-09 at the office-hours sitting that closed
  tactic-review-code-review-invocation-contract. That node's needs-main residue
  item 3 asked whether `low` is the right cost/quality point for the review
  phase; the author ruled that it is not, and directed `max`. This node exists
  because `max` CANNOT be reached by changing the effort argument — the coupling
  is a hard measured constraint, not a preference. MEASUREMENT (recorded in
  `.claude/skills/review-fix/references/code-review-invocation.md` section 1.2,
  taken 2026-07-31, and re-read at the sitting): `claude -p '/code-review max
  c06c7295~1..c06c7295' --permission-mode acceptEdits` ran 2363 s (39 m 23 s),
  produced no output, and was terminated with `exit=143`; captured
  `stdout+stderr` was 0 bytes. Structurally the run spawned one root
  `general-purpose` review subagent which fanned out 10 angle subagents at
  `spawnDepth: 1`; the 10 angles finished at ~24 min and the ROOT agent was
  still in synthesis/dedup at 39 min when killed. THREE CONSEQUENCES the
  reference doc records, all load-bearing here: (1) a `max` review of a real
  non-trivial diff exceeds the Bash tool's 600 000 ms cap AND the proposed
  `DISPATCH_CODE_REVIEW_TIMEOUT:-540`, falsifying the assumption that a `max`
  run fits in one Bash call; (2) `claude -p` buffers all output until the run
  completes, so a killed run yields zero bytes — the `rc == 124 -> exit 4` path
  is a TOTAL LOSS of a very expensive run, not a degraded result; (3) the doc's
  own conclusion is that the invocation must either run detached/backgrounded
  with a resume-poll or drop the effort level, and explicitly warns: `Design
  this deliberately; do not just raise the timeout constant.` The author chose
  the first branch. SCOPE COUPLING (deliberate, do not split): the effort raise
  and the detached resume-poll harness ship as ONE deliverable, so `max` can
  never land without the harness that makes it viable — splitting them would
  leave a window in which the review lane is deterministically broken. Target
  form per the reference doc: a range target (`<sha>..HEAD`), never a bare SHA —
  `dispatch-code-review` already rejects a non-range `--target` with exit 2,
  because a bare SHA reviews only the single commit at that SHA. Cost is NOT
  unattributed: section 5.2 confirms every assistant message in the review
  subagent transcripts carries `attributionSkill: \"code-review\"`, so the spend
  lands on a `code-review` phase line rather than in `<none>`."
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
  rationale: "Band 2 of the bootstrap three-band interim scale (50/20/10). A
    deliberate author-directed quality investment with a known, measured
    implementation constraint — not a defect and not an outage, so not band 1.
    Above baseline because it is the sole open remainder of a node the sitting
    otherwise closed, and because the review phase runs on every PR the fleet
    produces, so both the quality gain and the token cost compound across the
    whole lane."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# `max` review effort requires a detached resume-poll harness to be reachable

## The decision

The review phase's nested `/code-review` pre-stage currently runs at `low`. The
author ruled at the 2026-08-09 office-hours sitting that `low` is not the right
cost/quality point and directed `max`.

## Why this is not a one-word change

`max` was measured on a real diff and did not complete:

| | measured |
|---|---|
| wall time before kill | 2363 s (39 m 23 s) |
| exit | 143 (SIGTERM) |
| bytes of output recovered | **0** |
| Bash tool cap | 600 000 ms |
| proposed `DISPATCH_CODE_REVIEW_TIMEOUT` | 540 s |

Two properties combine badly. The run exceeds every available synchronous
budget, and `claude -p` buffers all output until the run completes — so a
timeout does not yield a partial review, it yields nothing at all. At `max`
pricing that makes the naive change strictly worse than `low`: maximum spend,
zero output, every time.

The run's internal shape explains the duration: one root `general-purpose`
subagent fans out 10 angle subagents. The angles finished around 24 minutes; the
root was still synthesizing and deduping at 39 minutes.

## Scope intent

Ship the effort raise and the detached/resume-poll invocation harness as one
unit. The harness runs the review detached and polls for completion rather than
blocking a single Bash call, so the result survives past any one call's cap.

Explicitly coupled on purpose: landing `max` without the harness leaves the
review lane deterministically broken, and landing the harness alone leaves the
author's decision unimplemented.

## Constraints a plan must respect

- **Range targets only.** `<sha>..HEAD`, never a bare SHA — a bare SHA reviews
  only the single commit at that SHA. `dispatch-code-review` already rejects a
  non-range `--target` with exit 2.
- **Do not just raise the timeout constant.** The reference doc calls this out
  directly; no timeout value makes a 39-minute buffered run fit a 600 s cap.
- **Attribution already works.** Every review-subagent message carries
  `attributionSkill: "code-review"`, so the new spend is measurable on its own
  phase line — a `/dispatch-token-audit` after the change can quantify the
  cost/quality trade the sitting declined to pre-judge.

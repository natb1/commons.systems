---
id: tactic-align-doc-completeness-over-commit-noise
kind: tactic
statement: In the align skills, record documentation where it is materially
  correct even when doing so enlarges the commit — never downgrade a warranted
  strategy clarification to a draft-tactic to keep the commit small; and measure
  any freeze/re-stamp cost via the authoritative predicate, not a grep
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-19: during the /align-strategy round recording the
  subagent-cwd invariant, Claude recommended draft-tactic-only over a strategy
  clarification to avoid a 'noisy' ~15-node re-stamp commit. The author
  corrected the priority: correct documentation on the strategy (where the
  subagent-worker contract is defined) outweighs commit tidiness. Compounding
  the misjudgement, the ~15-child re-stamp cost was itself a miscount — a grep
  of the strategy_fingerprint field key overcounted null stamps; the
  authoritative freeze predicate (readNode + isFingerprintStale) showed every
  child null-stamped, so the clarification actually froze nothing. Both lessons
  belong in /align-strategy so future rounds neither trade documentation
  correctness for commit size nor misjudge the trade on a bad measurement."
reading: null
gap: null
serves:
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
# Record documentation where it is materially correct, even when that enlarges the commit

## Context

Surfaced 2026-07-19 during the `/align-strategy` round that recorded the
subagent-cwd invariant (`tactic-subagent-cwd-worktree-guard`). Two linked
misjudgements the author corrected:

1. **Traded documentation correctness for commit tidiness.** Claude recommended
   recording the invariant as a *draft tactic only* — omitting the strategy
   clarification — to avoid a "noisy" commit that (it believed) would re-stamp
   ~15 orthogonal children. The author corrected the priority: the invariant
   belongs on `strategy-graph-native-dispatch`, where the subagent-worker
   contract is defined, and **correct documentation there outweighs a larger
   commit.** A warranted strategy clarification must never be downgraded to a
   draft tactic merely to keep the commit small.

2. **Misjudged the cost on a bad measurement.** The "~15 stamped children" figure
   was itself wrong — a `grep -c 'strategy_fingerprint'` counted the field *key*
   line (`strategy_fingerprint: null`) and so overcounted **null** stamps as real
   ones. The authoritative freeze predicate (`readNode` +
   `isFingerprintStale`, `packages/intentionsutil/src/transitions.ts`) showed
   **every** candidate child null-stamped, so `isFingerprintStale(null, …)`
   returns `false` and the clarification actually froze **nothing**. The commit
   was never noisy. (Memory `freeze-stamp-coverage-verify-via-selector` already
   recorded "verify freeze blast-radius via the selector, never grep; stamp
   coverage may be zero" — it predicted this exactly and was not applied.)

## The instruction to encode in `/align-strategy`

Fold both into `.claude/skills/align-strategy/SKILL.md` (Step 5, near the
materiality-scoped-freeze / re-stamp guidance):

- **Documentation-completeness dominates commit size.** When an interview outcome
  is materially a property of a strategy (an invariant of its contract, a
  resolved edge case, a doctrine correction), record it as a strategy
  clarification on that strategy — do **not** relocate it to a draft tactic to
  reduce commit size or re-stamp count. Commit size is never a reason to put
  documentation in the wrong place.

- **Measure freeze/re-stamp cost via the authoritative predicate, never a grep.**
  Before weighing a clarification's re-stamp burden, compute the actual frozen
  set with `readNode` + `isFingerprintStale` (or `strategyFingerprint` +
  the stamp read the selector uses), not a text `grep` of the
  `strategy_fingerprint` field — a null-valued key matches the grep but freezes
  nothing. A cost estimate that drives a recording decision must come from the
  same predicate the router uses.

## Reuse / anchors

- `packages/intentionsutil/src/router.ts` — `strategyFingerprint` (hashes
  `clarifications`, so adding one changes the fingerprint).
- `packages/intentionsutil/src/transitions.ts` — `isFingerprintStale`
  (`null` → not stale; bare string → stale iff `!==`; map → stale iff the
  strategy key's hash `!==`).
- `.claude/skills/align-strategy/SKILL.md` Step 5 — materiality-scoped-freeze /
  re-stamp guidance (where this instruction is folded in).
- Memory `freeze-stamp-coverage-verify-via-selector` — the pre-existing
  "verify via selector, never grep" rule this round failed to apply.

## Verification (prose)

The `/align-strategy` skill text names both rules (documentation-completeness
over commit size; measure freeze cost via the authoritative predicate) at Step 5,
and a subsequent round recording a strategy-level invariant records it as a
clarification without shrinking it to a draft tactic to save commit size.

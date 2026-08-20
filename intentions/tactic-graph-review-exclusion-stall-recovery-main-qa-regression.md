---
id: tactic-graph-review-exclusion-stall-recovery-main-qa-regression
kind: tactic
statement: "reconcile-graph-review-stall's fix-interrupt entry has no
  cross-cycle attempt cap: FIX_ATTEMPT_CAP only bounds attempts within one
  execution.fix episode, so a node that repeatedly enters the interrupt,
  resolves it (--clear-fix wipes execution.fix to null), and re-stalls gets a
  fresh attempt:1 budget every cycle and can thrash indefinitely"
owner: ai
status: raw
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-review-exclusion-stall-recovery-main-qa-regression
  pr: 3064
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# reconcile-graph-review-stall's fix-interrupt entry has no cross-cycle attempt cap: FIX_ATTEMPT_CAP only bounds attempts within one execution.fix episode, so a node that repeatedly enters the interrupt, resolves it (--clear-fix wipes execution.fix to null), and re-stalls gets a fresh attempt:1 budget every cycle and can thrash indefinitely

## Context

**Expected outcome (needs-main residue item 9 on
`tactic-graph-review-exclusion-stall-recovery`)**: a node that cycles through
`enter-fix -> clear-fix -> re-stall` repeatedly eventually stops retrying
rather than spamming state commits on `main` indefinitely, either via a cap
added to the reconciler or because the existing `/fix-checks` retry-budget
machinery already bounds it.

**Finding (verified by `/qa-main`, 2026-08-02, via code inspection —
`packages/intentionsutil/scripts/apply-fix-state.ts` on `origin/main`)**: it
does not. `applySet` (`--set-fix`) starts a fresh `{ attempt: 1, ... }` object
whenever `currentFix` is `null`; `applyClear` (`--clear-fix`) always writes
`fix: null` on resolution. So `FIX_ATTEMPT_CAP` / `--check-cap` only bounds
attempts *within* one `execution.fix` episode (the `/fix-checks` retry loop) —
it has no memory across episodes. A node that resolves an interrupt and later
re-enters it (via `reconcile-graph-review-stall` or the normal
`_gate_maybe_interrupt` gate) gets attempt `1` again, with no lifetime counter
anywhere. Neither `reconcile-graph-review-stall` nor
`needsReviewStallRoute`/`reviewStallRoute` (`transitions.ts`) tracks a
per-node cycle count either.

**Production evidence checked**: as of this verification only one node has
ever gone through the review-stall reconciler
(`tactic-fleet-alarm-mint-rollback-corruption`, PR #3014, recovered by commit
`85483a57` on 2026-08-01, `type-safety-sensor` check `FAILURE` confirmed via
`gh pr view 3014`), and it is still on its first cycle
(`execution.fix.attempt: 1`, `since: 2026-08-01`) — no thrash has actually
occurred yet. This bug tracks the structural gap the code inspection found,
not an observed production incident.

**Fix direction**: add a lifetime cycle counter (e.g. a small integer in
`execution` or a sidecar keyed like the CI-pending-strike sidecar
`lib.sh`/`lib-graph-worktree.sh` already use) that increments on each
`reconcile-graph-review-stall` (or gate) `--set-fix` entry and is *not* reset
by `--clear-fix`; once it exceeds a cap, route to a tracked hold (mirroring
the `ci-pending-stalled` hold `reconcile-graph-review-stall` already lands)
instead of re-entering the interrupt.

**Source**: needs-main residue item 9,
`tactic-graph-review-exclusion-stall-recovery` (merged PR #2920).

**Recommended model**: sonnet — a bounded, well-specified addition to an
existing sidecar/state-tracking pattern (`ci_pending_strike_bump`/
`ci_pending_strike_clear` in `lib.sh` is a directly reusable template) plus a
cap check mirroring `apply-fix-state.ts`'s existing `--check-cap`.

## Verification

No fixture reproduces a multi-cycle review-stall thrash today, so verify by
code inspection: after the fix, confirm a node that enters and clears the
fix-interrupt twice in a row (via two `--set-fix`/`--clear-fix` pairs in a
unit test) is routed to a hold on the second (or configured Nth) re-entry
instead of getting a fresh `attempt: 1` budget, and that
`packages/intentionsutil/test/transitions.test.ts` /
`test-reconcile-graph-review-stall.sh` gain a case covering it.

```verify
npx vitest run --project packages/intentionsutil --root .
```

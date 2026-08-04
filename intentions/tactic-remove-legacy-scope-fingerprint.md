---
id: tactic-remove-legacy-scope-fingerprint
kind: tactic
statement: Remove the transitional legacy whole-body acceptance from
  acceptableScopeFingerprints once no pre-merge scope stamp survives
owner: ai
status: raw
parent: null
rationale: "Tracked deletion follow-up for the transitional acceptance
  introduced by tactic-scope-fingerprint-plan-substance (PR #2974).
  acceptableScopeFingerprints() in packages/intentionsutil/src/router.ts accepts
  BOTH the new plan-substance fingerprint and the legacy whole-body one so
  stamps taken before that merge keep matching; without it the 19
  residue-carrying nodes would all read scope-stale on the first sweep after
  merge, re-firing the exact false demotion the parent tactic exists to stop.
  The acceptance is explicitly temporary and its deletion condition is a
  filesystem fact, not design work — this node exists so the condition is
  tracked in the graph rather than only in a code comment that outlives the
  condition it guards. Filed 2026-07-30 from the office-hours drain of the
  parent node's park (Branch A of its recommendation)."
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
blocked_by:
  - tactic-scope-fingerprint-plan-substance
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Remove the transitional legacy whole-body acceptance from acceptableScopeFingerprints once no pre-merge scope stamp survives

Draft — filed as the tracked deletion follow-up for the transitional acceptance
landed by `tactic-scope-fingerprint-plan-substance` (PR #2974). Nothing here
needs designing; the condition and the steps are both already fixed.

## Deletion condition

Every `<main-root>/.claude/worktrees/*.scope-fingerprint` file postdates PR
#2974's merge commit. Check with `ls -l` on that directory against the merge
commit date:

```
git -C <main-root> log -1 --format=%cI <merge-sha-of-PR-2974>
ls -l <main-root>/.claude/worktrees/*.scope-fingerprint
```

Stamps rotate on every worker provision
(`.claude/skills/dispatch-propagate/scripts/provision-node-worktree:83-100`) and
every transition (`.claude/skills/dispatch-propagate/scripts/transition-node:83-98`),
so the condition is met within days of the merge. Until it is met, this node is
not actionable — it is gated on a filesystem fact, not on design or urgency, so
it deliberately carries no `attention.boost`.

## Deletion steps

In `packages/intentionsutil/src/router.ts` (the transitional block and its
DELETION CONDITION comment are the single home of this):

- Drop the legacy entry from `acceptableScopeFingerprints`.
- Inline `tacticScopeFingerprint` into `scopeStampMatches`.
- Delete the module-private `legacyWholeBodyFingerprint` helper.
- Re-run the parent tactic's verify block:

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
npx vitest run --project packages/intentionsutil --root .
```

`blocked_by: tactic-scope-fingerprint-plan-substance` — the acceptance cannot be
removed before the change that introduced it has landed.

---
id: tactic-reconcile-merged-window-truncation
kind: tactic
statement: dispatch-reconcile-merged's merged-PR enumeration must not silently
  drop work off the end of its window — the creation-ordered 100-PR page becomes
  a page whose truncation is either eliminated (paginate/order by merge time) or
  made loud enough to act on, so a merged PR whose node never advanced cannot go
  unreconciled indefinitely
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-08-04 on the first post-resume dispatch-tick:
  `dispatch-reconcile-merged: warning: PR list hit the limit (100); oldest
  merged PRs in the window may be missing from this sweep — raise
  DISPATCH_RECONCILE_LIMIT`. The same defect was already recorded, unowned, by
  tactic-review-lows-automation's 'Open and unowned — no intention node tracks
  these' section as `dispatch-reconcile-merged:61 — creation-ordered window`;
  this node claims it. Two compounding problems. (1) The window is ordered by
  PR CREATION, not merge time, so a long-lived branch that merges today can sit
  outside a window sized for today's merges — the truncation is not simply
  'the oldest merges', it is arbitrary with respect to what actually needs
  reconciling. (2) The failure is a warning on a log line nobody reads, and its
  consequence is silence: a merged PR that never gets reconciled leaves its node
  parked at review/qa forever, which is indistinguishable from work genuinely
  still in flight. That is the sensors rule the strategy already carries — ask
  what an instrument prints when it cannot see; this one prints 'sweep
  complete'. It matters to the bootstrap's own goal because the reconciler is
  the mechanism by which merged work advances without a human, so a truncated
  window is a direct, silent cap on autonomous throughput."
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
# dispatch-reconcile-merged's merged-PR enumeration must not silently drop work off the end of its window

Detect: `journalctl --user -u 'dispatch-converge-*' | grep 'PR list hit the
limit'` — any hit means that sweep's coverage is unknown, not merely partial.

Cross-check that finds the actual damage (a merged PR whose node never
advanced), independent of the sweep's own reporting:

```
gh pr list --state merged --limit 200 --json number,headRefName,mergedAt
# for each headRefName that names a node id, assert the node's phase on
# origin/main is done (or a phase downstream of merge), not review/qa
```

Raising `DISPATCH_RECONCILE_LIMIT` is a mitigation, not the fix — it moves the
cliff without removing it, and leaves the creation-ordering mismatch
(`dispatch-reconcile-merged:61`) in place. The greenfield shape is to enumerate
by merge time and paginate to exhaustion, so "did this sweep see everything?"
has a yes/no answer rather than a limit-shaped maybe.

Related, distinct: `tactic-selection-ledger-accounting` mentions
`dispatch-reconcile-merged` only as a contrast case (the merged/closed-PR
analog of a different sweep) and does not own this defect.

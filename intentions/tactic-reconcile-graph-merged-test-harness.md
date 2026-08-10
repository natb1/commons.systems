---
id: tactic-reconcile-graph-merged-test-harness
kind: tactic
statement: Add a direct bash test harness for reconcile-graph-merged's PR-state
  classification (OPEN, merged past/within grace window, closed-unmerged,
  unrecognized state) and its edit-only GC_ARGS construction, which currently
  has no behavioral test coverage of its own
owner: ai
status: raw
parent: null
rationale: null
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
# Add a direct bash test harness for reconcile-graph-merged's PR-state classification (OPEN, merged past/within grace window, closed-unmerged, unrecognized state) and its edit-only GC_ARGS construction, which currently has no behavioral test coverage of its own

## Provenance

- **Source:** review-fix pass on PR #2965 (`tactic-execution-pr-merge-verification`), finding `deferred-filing` (code-review lane residue, prescanned).
- **Location:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`
- **Failure scenario:** `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` has no direct behavioral test. Its only mention in `test-dispatch-select-tick.sh` is the silent stdout fake used by the `dispatch-select-tick` wiring tests. The bash suite was extended by PR #2965 only for `gh_pr_view_rest`'s new `mergeCommitSha` projection — the actual behavior PR #2965 changed in `reconcile-graph-merged` itself (the state-classification loop restored to explicit `OPEN)`/`CLOSED|MERGED)`/`*)` arms, the `mergedAt`-based merge/closed discriminator, and the `GC_ARGS` construction dropping `--prune`) remains untested at the bash-script level.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — filed directly as an out-of-scope deferred finding (bucket `Deferred`, source `code-review`); it is a coverage gap, not a demonstrated defect.
- **Recommended fix:** Add a test section that stubs `gh_pr_view_rest` (and the node/tsx enumeration, `reconcile-graph.ts`, `graph-commit`, and the `git rev-parse`/`git show` snapshot calls) and asserts the `STATES` JSON built for: (a) an OPEN PR → absent from `STATES`; (b) a merged PR past the grace window → `{state:"merged", mergedAt, mergeCommitSha}`; (c) a merged PR inside the grace window → absent (still settling); (d) a closed-unmerged PR → `{state:"closed"}`; (e) an unrecognized state string → not reconciled, diagnostic on stderr, non-zero exit (the `HARD_ERROR` arm). Plus an assertion that `GC_ARGS` contains no `--prune` and that the snapshot loop reads only `.edit[]`.
- **Source PR:** #2965

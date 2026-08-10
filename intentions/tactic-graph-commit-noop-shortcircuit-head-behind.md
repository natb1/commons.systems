---
id: tactic-graph-commit-noop-shortcircuit-head-behind
kind: tactic
statement: graph-commit's no-op short-circuit (added by
  tactic-graph-commit-noop-landing-false-failure) fires only on strict
  HEAD==origin/main SHA equality, so a checkout strictly BEHIND origin/main with
  nothing staged still runs the full landing cycle even though content parity
  with origin/main is already proven — pure cost that holds the landing lock for
  no benefit
owner: ai
status: raw
parent: null
rationale: "Surfaced as a deferred code-review finding during the /review-fix
  pass on PR #2981 (tactic-graph-commit-noop-landing-false-failure). Classified
  out-of-scope for that PR: its Unit 2 explicitly scoped the short-circuit to
  the HEAD==FETCH_HEAD case and listed the HEAD-behind case under Out of scope
  for this unit."
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
# graph-commit's no-op short-circuit (added by tactic-graph-commit-noop-landing-false-failure) fires only on strict HEAD==origin/main SHA equality, so a checkout strictly BEHIND origin/main with nothing staged still runs the full landing cycle even though content parity with origin/main is already proven — pure cost that holds the landing lock for no benefit

## Finding

`packages/intentionsutil/scripts/graph-commit`'s no-op short-circuit (in
`main()`'s nothing-staged branch) fires only on strict SHA equality:

```sh
if [[ "$head_sha" == "$main_sha" ]]; then
```

A checkout that is strictly BEHIND `origin/main` — the common stale-worktree
retry — still falls through to the full landing cycle (landing-lock claim,
`graph/**` scratch push, `await_checks` poll window, push to main), even
though the per-id blob loop immediately above has already proven every target
node's content is byte-identical to `origin/main`. Nothing that run holds can
change main, so the cycle is pure cost and holds the global
`refs/graph/landing-lock` while it burns.

`ensure_intentions_only_base()` does not normalize this away: its three-dot
diff is empty when HEAD is an ancestor of `origin/main`, so it returns early
and HEAD stays behind.

## Recommended fix

Widen the guard from equality to ancestry —
`git merge-base --is-ancestor HEAD FETCH_HEAD` — keeping the current "HEAD is
already origin/main" wording for the equal case and reporting "HEAD is already
contained in origin/main" otherwise. Safe because the preceding per-id blob
comparison already guarantees content parity, and a HEAD that is an ancestor
of `origin/main` can contribute nothing to a push.

Add a `packages/intentionsutil/scripts/test-graph-commit.sh` case: a clone
reset one commit behind `origin/main`, node unchanged, asserting exit 0 with
`gh_calls == 0` and no scratch branch.

## Provenance

- **Location:** `packages/intentionsutil/scripts/graph-commit:1699`
- **Source PR:** #2981 (`tactic-graph-commit-noop-landing-false-failure`)
- **Adversarial verdict:** not independently verify-gated (code-review residue
  bucket: `Deferred`, not run through the adversarial-verify pipeline —
  Lane-A code-review findings are trusted from the built-in review directly).
- **Why deferred rather than fixed in the source PR:** the source tactic's
  Unit 2 explicitly scopes the short-circuit to `HEAD == FETCH_HEAD` and lists
  the HEAD-behind case under "Out of scope for this unit".
- **Obsolescence note:** this whole surface disappears if
  `tactic-graph-ref-split` lands first (it deletes the CI stamp cycle and
  `await_checks` entirely) — close this as obsolete in that case.

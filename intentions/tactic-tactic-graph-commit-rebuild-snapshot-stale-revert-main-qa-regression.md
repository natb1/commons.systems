---
id: tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression
kind: tactic
statement: "PR #2990's body cites the new test-graph-commit.sh regression cases
  proving the graph-commit rebuild-path fix as \"cases 36-40\", but an unrelated
  origin/main commit independently inserted its own cases 36-47 into
  test-graph-commit.sh after PR #2990's body text was written, shifting the PR's
  own five regression cases to case numbers 48-52. All five cases exist under
  their current numbers, correctly implement the described scenarios, and pass.
  The PR body itself was never corrected post-merge, and no comment on the PR
  confirms the stale citation is deliberately left as historical text."
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# PR #2990's body still cites the stale regression-case numbers

## Expected outcome

The merged PR #2990's body (or a follow-up doc fix) cites the correct
`test-graph-commit.sh` regression-case numbers for the five cases proving the
graph-commit rebuild-path fix, or a comment on the PR confirms the stale
citation is deliberately left as historical text.

## Observed (verified by /qa-main against the repo and the GitHub PR, 2026-08-09)

- `test-graph-commit.sh` (on `origin/main`) has the five described cases at
  numbers 48-52, not 36-40:
  - Case 48 — far-ahead + stale `--base`: the layer-3 merge survives the rebuild
  - Case 49 — far-ahead, no `--base`, disjoint field — both edits land
  - Case 50 — far-ahead, no `--base`, SAME field — parks, HEAD restored
  - Case 51 — far-ahead `--prune` racing a concurrent edit — park, node survives
  - Case 52 — far-ahead list-entry removal racing a concurrent edit
  - All five exist, correctly implement the scenarios, and pass.
- `gh pr view 2990 --json body` still reads: "Adds five new `test-graph-commit.sh`
  cases (36-40) that reproduce the silent revert against the pre-fix script and
  pass after the fix." — unchanged since merge.
- `gh pr view 2990 --json comments` shows the QA attempt-1 summary explaining the
  drift (unrelated `origin/main` churn inserted cases 36-47 first, shifting this
  PR's five cases to 48-52), but no comment states the citation is deliberately
  left as historical text, and the PR body itself was never edited to correct it.

## Context

- Source PR: #2990 (merged, `mergedAt: 2026-08-05T21:47:35Z`,
  merge commit `156ce3a18929dd0c85f80db6be4f35c32ad45a7d`).
- Source node: `tactic-graph-commit-rebuild-snapshot-stale-revert`.
- `url_path`: none — this is not a browser-observable outcome; it is a GitHub
  PR-body/comment text check.
- Fix options for the implementer: either `gh pr edit 2990 --body ...` to
  correct "cases 36-40" to "cases 48-52" (and note the renumbering happened
  because of unrelated churn), or post a `gh pr comment 2990` confirming the
  citation is deliberately left as historical text. Either satisfies the
  expected outcome above.

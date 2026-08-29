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
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr15-graph-commit-simplification
  pr: 3136
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-29T23:45:52Z
    mergeCommitSha: a4a964b8e80bcac307d089b001a5419b1ed46fd8
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# PR #2990's body still cites the stale regression-case numbers

**Recommended model**: sonnet — mechanical: edit a merged PR's body text (or
post a confirming comment) via `gh`; no code change.

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

## Verification

Pick one of the two fix options in Context and apply it with `gh`
(`dangerouslyDisableSandbox: true` — `gh` needs it per `.claude/rules/sandbox.md`):

```verify
gh pr view 2990 --json body --jq .body | grep -q 'cases 48-52\|48, 49, 50, 51, 52\|48-52' && echo "PR body corrected" || echo "PR body not corrected — check for a confirming comment instead"
```

Manual check: if the body wasn't edited, confirm a comment exists on PR #2990
stating the "cases 36-40" citation is deliberately left as historical text.

## What shipped — 2026-08-29, closed against the follow-up-doc-fix outcome

Landed in #3136 (merge commit `a4a964b8`), Position 2 of the dispatch/RSI
serialized window.

This node's Expected outcome is **disjunctive**: PR #2990's body *"(or a
follow-up doc fix)"* cites the correct case numbers. It is closed against the
second disjunct, and this section records exactly which, because that
distinction is not visible from the diff alone.

**What shipped in the repo.** `test-graph-commit.sh` gains a comment block above
the affected group recording that these are the five Unit 1 / Unit 2 regression
guards from #2990, that the PR body cited them as "cases 36-40", and that an
unrelated commit on main inserted its own new cases 36-47 ahead of them —
shifting the group to **48-52**. The block establishes the convention: cite cases
by assertion text, never by ordinal. Three in-file citations that used bare
ordinals were re-anchored to name their cases instead. All five cases exist at
48-52 with the described scenarios and pass.

**What was deliberately not changed.** #2990's merged body still reads "cases
36-40". Editing a merged PR body rewrites a historical record, so it is left as
written. Instead a comment was posted on that PR recording the correction, so the
stale text is self-correcting for any future reader who lands there:
https://github.com/natb1/commons.systems/pull/2990#issuecomment-5465593781

That comment is what makes this a clean close rather than a partial one. No
later section of `plans/dispatch-rsi-serialized-pr-plan.md` claims the
GitHub-side correction — the only references are inside PR15's own section — so
closing with nothing posted would have left it owed by nobody and dropped it
from the graph entirely.

### A trap in this node's own Verification fence

The fence reads, in effect:

```
gh pr view 2990 … | grep -q 'cases 48-52…' && echo "corrected" || echo "not corrected"
```

This **exits 0 either way**. It prints a different word but cannot fail, so it
is a vacuous gate and must not be cited as evidence of closure. The evidence is
the in-repo comment block and the posted PR comment above.

### Node body figures

Verified accurate and left as written: the five case headers exist at 48, 49,
50, 51 and 52 with exactly the described scenarios.

**Verification:** `test-graph-commit.sh` 124/0; `run-lint.sh` clean.

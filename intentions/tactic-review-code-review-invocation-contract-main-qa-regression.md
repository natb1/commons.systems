---
id: tactic-review-code-review-invocation-contract-main-qa-regression
kind: tactic
statement: "dispatch-code-review always passes --comment (review-fix SKILL.md
  Step 1b never passes --no-comment), and the built-in /code-review low --fix
  pre-stage does run to completion and does surface findings into the review-fix
  pipeline on real diffs, but across all 3 real /review-fix passes observed
  since PR #3007 merged (PR #3049, #2990, #3047), zero inline PR review comments
  and zero PR reviews were posted on any of them via gh's pulls/{n}/reviews or
  pulls/{n}/comments endpoints, even though code-review generated residue
  findings on at least 2 of the 3 (labeled code-review-residue-refuted-* /
  code-review Lane A residue in the review-fix disposition comments) that should
  have been commentable"
owner: ai
status: raw
parent: null
rationale: null
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# dispatch-code-review always passes --comment (review-fix SKILL.md Step 1b never passes --no-comment), and the built-in /code-review low --fix pre-stage does run to completion and does surface findings into the review-fix pipeline on real diffs, but across all 3 real /review-fix passes observed since PR #3007 merged (PR #3049, #2990, #3047), zero inline PR review comments and zero PR reviews were posted on any of them via gh's pulls/{n}/reviews or pulls/{n}/comments endpoints, even though code-review generated residue findings on at least 2 of the 3 (labeled code-review-residue-refuted-* / code-review Lane A residue in the review-fix disposition comments) that should have been commentable

## Context

**Expected outcome (needs-main residue item 2 on
`tactic-review-code-review-invocation-contract`)**: "`--comment` actually
posts the review as a PR comment" — deferred at PR #3007 QA time because no
real PR existed yet to exercise it (Unit 1's investigation recorded `--comment`
as "ignored. The branch has no commits ahead of main... there is no PR to
comment on", `references/code-review-invocation.md:274-289`). The deferral
named its own remedy: check on the PR's first real `/review-fix` pass.

**Finding (verified by `/qa-main`, 2026-08-05, via `gh api` against
`natb1/commons.systems` on origin/main)**: three real `/review-fix` passes have
since run against merged PRs — #3049, #2990, #3047, all merged 2026-08-05. Each
one's `<!-- dispatch:review-fix -->` disposition comment names the Step 1b
built-in `/code-review low --fix` pre-stage explicitly and shows its findings
flowing into the pipeline (PR #3049: `code-review-residue-refuted-0` /
`code-review-residue-refuted-2`; PR #2990: `code-review-residue-refuted-0`; PR
#3047: an informational finding sourced `(code-review, Lane A residue)`) — so
the pre-stage is unambiguously invoking, completing, and surfacing real
findings on real diffs. But:

```
gh api repos/natb1/commons.systems/pulls/<N>/comments --jq length   # inline review comments
gh api repos/natb1/commons.systems/pulls/<N>/reviews --jq length    # PR reviews
```

returned `0` and `0` for all three PRs (#3049, #2990, #3047), and
`gh api repos/natb1/commons.systems/issues/<N>/timeline` shows no `reviewed` /
`review_requested` event on any of them — only ordinary `commented` events from
`natb1` (the skill's own single Step 6 PR comment plus QA/fix-checks comments)
and `github-actions[bot]` (preview-deploy). `review-fix/SKILL.md` Step 1b calls
`dispatch-code-review` with no `--no-comment` flag, so `COMMENT_FLAG` defaults
to `--comment` in every real pass — the flag is being passed on every one of
these three runs, yet no inline comment or review of any kind reached any of
the three PRs.

**Not yet isolated**: whether the nested `claude -p '/code-review low --fix
--comment'` session's own `--comment` posting is silently failing, or whether
`--comment` at `low` effort simply produces no comment when it finds nothing
that survives past `--fix` cleanly enough to comment on (none of the three
observed passes clearly show a case where `--comment` had residue-worth-flagging
findings *and* still posted nothing — PR #3047's informational code-review
finding is the closest candidate and still produced no PR review/comment).

**Source**: needs-main residue item 2, `tactic-review-code-review-invocation-contract`
(source PR #3007, merged 2026-08-03T03:00:25Z).

**Recommended model**: sonnet — bounded investigation (re-run
`claude -p '/code-review low --fix --comment'` in a scratch worktree against a
real diff with residue-worthy findings, capture its full stdout/stderr and any
`gh` calls it shells, and either fix the posting path or narrow the contract
note in `references/code-review-invocation.md` to record the actual observed
behavior) plus whatever code change the finding requires.

## Verification

Re-run the built-in against a diff engineered to leave at least one finding
un-auto-fixed (so `--comment` has something to post), and confirm a real
inline PR review comment or PR review appears:

```verify
gh api repos/natb1/commons.systems/pulls/<test-pr>/reviews --jq length
```

should be non-zero after a pass with residue findings, where it was `0` on
PR #3049, #2990, and #3047 despite each of them producing residue findings.

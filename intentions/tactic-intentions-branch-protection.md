---
id: tactic-intentions-branch-protection
kind: tactic
statement: "Author: permit direct-push of intentions/-only commits to main
  (branch protection / ruleset review, ≤30 author-minutes)"
owner: human
status: codified
parent: tactic-graph-native-dispatch
rationale: "Not claude-eligible: GitHub repo settings need the author's admin
  access. Born parked per the strategy's write-path clarification — the
  direct-push rebase-retry lane cannot go live until main accepts
  intentions/-only pushes from worker sessions."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by: []
  office_hours:
    reason: author-only GitHub repo settings change; chunked to ≤30 author-minutes
    since: 2026-07-03
---
# Author: permit direct-push of intentions/-only commits to main (branch protection / ruleset review, ≤30 author-minutes)

## Context

The strategy's write path (clarification 2 on
`strategy-graph-native-dispatch`) direct-pushes `intentions/`-only commits
to main from worker sessions with rebase-retry. Whether main accepts a
non-interactive direct push is a GitHub repo-settings question only the
author can answer or change — so this tactic is born parked (`office_hours`
in frontmatter) and sized to ≤30 author-minutes.

## Author checklist (≤30 min)

1. Open Settings → Rules / Branches for `natb1/commons.systems`; note any
   protection on `main` (required checks, push restrictions, rulesets).
2. Decide the mechanism: nothing to do (no protection), a bypass allowance
   for the token worker sessions push with, or a ruleset arranged so
   `intentions/`-only pushes pass required checks quickly (pairs with the CI
   fast path in `tactic-graph-commit`).
3. Record the decision as a dated clarification on
   `intentions/strategy-graph-native-dispatch.md` (via
   `packages/intentionsutil/scripts/write-node.ts` until graph-commit
   lands).
4. Clear this node's parking by committing the outcome to the node — the
   interactive-commit-clears-park rule (strategy clarification 4).

## Verification

From a shell holding the worker credential: commit a whitespace-only change
to an `intentions/` file and `git push origin HEAD:main`; follow with a
revert commit. Success = the push is accepted without a PR.

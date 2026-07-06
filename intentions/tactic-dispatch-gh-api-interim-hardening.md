---
id: tactic-dispatch-gh-api-interim-hardening
kind: tactic
statement: "dispatch gh-API edge semantics: paginate gh_api_array (30-item cap
  wrongly closes epics / misclassifies leaves) and pin the merge expected-head
  SHA"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. gh_api_array is a single
  unpaginated call capped at 30 items, feeding resolve-epic (auto-closes an epic
  whose child #31+ is still open) and dispatch-trace-leaf (misclassifies a node
  with an open late child as a startable leaf) - a live data-integrity risk
  during the gh-queue drain. gh_pr_merge_rest also never passes the REST sha
  expected-head param, leaving a TOCTOU merge window. Serves
  strategy-autonomous-execution. Caveat: much of this legacy-gh surface is
  scheduled for deletion by tactic-legacy-router-removal; scope this to the
  interim-live risks (the 30-cap and the merge SHA) and drop any unit that
  legacy-router-removal makes moot."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# dispatch gh-API edge semantics: pagination + merge SHA

## Context

Two verified gh-API edge-semantics defects (2026-07-05) in the legacy dispatch
layer with live data-integrity impact during the gh-queue drain. Caveat: much
of this surface is scheduled for deletion by `tactic-legacy-router-removal`;
scope to the interim-live risks and drop any unit that migration makes moot.

## Unit 1 — paginate gh_api_array

**Recommended model:** sonnet

Scope:
- `.claude/skills/dispatch-propagate/scripts/lib.sh:267-292`: `gh_api_array`
  is a single unpaginated call capped at REST's default 30-per-page, feeding
  `issue-sub-issues` -> `dispatch-epic-resolved-candidate` (auto-closes an
  epic whose child #31+ is still open) and `dispatch-trace-leaf` (a node with
  an open late child read as a startable leaf). Add `--paginate` (the sibling
  `dispatch_ci_verdict_rest` already paginates the same endpoint - the house
  pattern).

## Unit 2 — pin the merge expected-head SHA

**Recommended model:** sonnet

Scope:
- `lib.sh:1555` (`gh_pr_merge_rest`) / `dispatch-auto-merge:117`: the merge
  never passes the REST `sha` expected-head param though `dispatch-auto-merge`
  already fetched and vetted `headRefOid`; a push between snapshot and merge
  lands an un-reviewed head. Pass `-f sha=$headRefOid`.

## Verification

- A synthetic epic with >30 children is not resolved while a late child is
  open; a merge with a shifted head is rejected by the API rather than
  landing. (Validate lib.sh helpers under `bash -c`, not zsh.)

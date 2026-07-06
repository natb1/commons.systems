---
id: tactic-review-lows-automation
kind: tactic
statement: "2026-07-05 review lows: dispatch/ops scripts + hooks (retained draft
  context; mostly legacy-gh surface — apply the greenfield-relevance gate per
  unit before promoting)"
owner: ai
status: raw
parent: null
rationale: Retained draft context, not selectable work. Split 2026-07-06 out of
  the deleted mixed sweep tactic-review-low-severity-sweep per the placement
  doctrine (strategy-graph-native-dispatch), so this strategy's /align-tactics
  rounds find their own residue. Findings are from the 2026-07-05 code review,
  each verified with an anchor.
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# 2026-07-05 review lows: dispatch/ops scripts + hooks (retained draft context)

## Context

Retained draft context, not selectable work. Split 2026-07-06 out of the
deleted mixed sweep `tactic-review-low-severity-sweep` per the placement
doctrine on `strategy-graph-native-dispatch`. Each line is a confirmed
finding from the 2026-07-05 review with an anchor. Mostly legacy-gh surface:
apply the greenfield-relevance gate per unit — check survival against
`tactic-legacy-router-removal` — before promoting anything here. A later
`/align-tactics` round on `strategy-autonomous-execution` finalizes, splits,
merges, or prunes.

## token audit

- `aggregate-usage.sh:168,174,846` local-time window vs UTC find (excludes
  recent |offset| hours). (Tracked by `tactic-token-audit-node-attribution`;
  the day-slice and double-count halves of this finding were promoted into
  that tactic's Unit 4.)

## CI / verification wrappers

- `run-typecheck.sh:117`, `run-lint.sh:56-59`: `set -e` / process-substitution
  patterns that can false-green a workspace.

## legacy dispatch scripts (check survival before fixing)

- `dispatch-reconcile-merged:61` creation-ordered "merged recently" window
  (misses old-PR-merged-today, the #2512 case); `dispatch-select-target:270`
  unpaginated main-broken check; `dispatch-find-owning-pr:92` treats any API
  error as 404; `dispatch-route:179,196,211,277-284` undiagnosed parks +
  stranded-push conflation; `dispatch-attempt-count` remove-then-add label
  bump; `gh_retry:125-151` retries non-idempotent POSTs (double-file risk).

## hooks

- `.claude/hooks/statusline.sh:28` divide-by-zero; `worktree-remove.sh:62-63`
  resolved-vs-unresolved path compare.

## duplication / dead code

- duplication belonging in lib.sh: `gh label create` idiom x8; the four
  marker-comment upsert copies (OBE via node-body plans);
  `dispatch-attempt-count`/`dispatch-qa-fix-attempt` near-clones;
  `api_error_reason` identical in fetch-analytics/fetch-psi.
- dead scripts (zero non-test refs): `issue-siblings`, `wait-for-url.sh`,
  `check-inbox-age`, `dispatch-reclaim-audit`.

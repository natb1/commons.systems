---
id: tactic-dispatch-script-hardening
kind: tactic
statement: "automation scripts: stop set -e/curl false-fails in
  run-smoke-tests.sh and run-pr-checks-wait.sh, fix identify-qfx.sh's dead error
  path and CRLF handling, quote TMPDIR expansions in budget-sync/apply, and
  paginate align's closed-issue context fetch"
owner: ai
status: codified
parent: null
rationale: Surfaced by the 2026-07-05 code review, previously misfiled in
  tactic-review-low-severity-sweep at higher severity than a low sweep warrants
  (identify-qfx.sh was rated high; the rest medium). These are automation-script
  reliability bugs spanning the dispatch, budget, and align skill tooling that
  supports the autonomous chain - not router-specific, so unlike several sibling
  ops findings they are not obsoleted by tactic-legacy-router-removal. Recorded
  under strategy-autonomous-execution as the nearest fit for 'the automation the
  author relies on behaves correctly'; the budget/align-skill units are
  cross-cutting with strategy-complete-ledger and strategy-graph-drives-dispatch
  respectively but are kept in one tactic since they share the same
  false-pass/false-fail defect class.
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-dispatch-script-hardening
  pr: 2840
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# automation scripts: false-pass/false-fail hardening across dispatch, budget, align

## Context

A cluster of automation-script reliability bugs (2026-07-05 review),
previously misfiled in the low-severity sweep at higher severity than a
"low" sweep warrants — `identify-qfx.sh` was rated high, the rest medium.
Unlike several sibling ops findings (`dispatch-reconcile-merged`,
`dispatch-select-target`, `dispatch-find-owning-pr`, `dispatch-route`),
none of these live in code `tactic-legacy-router-removal` deletes, so they
are not mooted by that migration.

## Unit 1 — dispatch CI wrapper false-pass/false-fail

**Recommended model:** sonnet

Scope:
- `.claude/skills/dispatch-propagate/scripts/run-pr-checks-wait.sh:63-76`:
  both `gh pr checks` calls are `|| true`'d and the verdict is
  `grep -q 'fail'` on the captured text. A gh/network failure whose error
  text lacks "fail" yields exit 0 = false green for `/fix-checks`;
  conversely any check *name* containing "fail" (e.g. a `fail-fast` job)
  or a "failed to…" diagnostic forces exit 1 on a green PR. Parse the
  actual check-run conclusions instead of grepping free text.
- `.claude/skills/dispatch-propagate/scripts/run-smoke-tests.sh:29`:
  `STATUS=$(curl -s -o … -w '%{http_code}' "$BASE_URL")` runs under
  `set -euo pipefail` inside the 30-attempt CDN-propagation wait loop, so
  a transport-level curl failure (DNS/connection-refused — precisely what
  early CDN propagation looks like) exits the whole script on attempt 1
  instead of retrying. Guard the curl call so a transport failure counts
  as a retry-eligible attempt, not a script abort.

## Unit 2 — identify-qfx.sh dead error path and CRLF handling

**Recommended model:** sonnet

Scope:
- `.claude/skills/budget/scripts/identify-qfx.sh:22,37`: under
  `set -euo pipefail`, `org=$(grep -oE '<ORG>…' "$file" | head -1 | sed …)`
  exits the whole script when a file lacks `<ORG>` (any CSV/PDF in the
  ingest set never contains it), so the intended
  "could not extract ORG" / `continue` error path is dead code and any
  non-OFX file in the ingest set aborts the entire statement ingest with
  an empty-stderr "unknown error" and no files moved. Guard the
  extraction so a missing `<ORG>` hits the intended per-file continue
  path instead of aborting the script.
- Same lines: CRLF-formatted OFX (a common bank export) leaves a trailing
  `\r` in the captured ORG/ACCTID, so the institution map lookup fails
  with an invisible-CR "unknown ORG" error. Strip `\r` before lookup.

## Unit 3 — quote TMPDIR expansions in budget-sync/apply

**Recommended model:** sonnet

Scope:
- `.claude/skills/budget/scripts/budget-sync:102` and
  `budget-apply:120,128,143,155,159`: `${TMPDIR:-/tmp}/…` expansions are
  unquoted, so a `TMPDIR` containing a space word-splits the
  `--report`/`--output`/`--input` arguments — these scripts explicitly
  target external users' machines and their own comments claim every path
  is quoted. Quote every expansion.

## Unit 4 — paginate align's closed-issue context fetch

**Recommended model:** sonnet

Scope:
- `.claude/skills/align/scripts/gather-context.sh:71` via
  `lib.sh:412-455`: `gh_issue_list_rest --state closed --limit 100`
  fetches one page of 100 *mixed* issues+PRs, then filters PRs out
  client-side. In this PR-dominated repo the "recent 100 closed issues"
  context section silently contains only a few dozen issues with no
  shortfall indicator (the paginate-then-slice path already used for
  `--limit > 100` doesn't have this defect — reuse it here). Route this
  call through the existing paginate-then-slice path.

## Verification

- A synthetic non-"fail"-containing gh error is not treated as green; a
  check named `fail-fast` on a green PR is not treated as red. A
  transport-level curl failure during the smoke-wait loop retries rather
  than aborting. A non-OFX file in the ingest directory is skipped with a
  clear per-file message, not an ingest-wide abort; a CRLF OFX fixture's
  ORG resolves correctly. A `TMPDIR` containing a space does not break
  budget-sync/apply. The align context section reports the true count
  when more than 100 closed issues+PRs exist.

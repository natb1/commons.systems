---
id: tactic-mainqa-strategy-fingerprint-stamp-coverage-machine
kind: tactic
statement: "Post-merge verification of
  tactic-strategy-fingerprint-stamp-coverage (PR #3023) — machine-verifiable
  items"
owner: ai
status: codified
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
phase: main-qa
execution:
  branch: tactic-strategy-fingerprint-stamp-coverage
  pr: 3023
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-strategy-fingerprint-stamp-coverage
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-strategy-fingerprint-stamp-coverage (PR #3023) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-strategy-fingerprint-stamp-coverage` (PR #3023). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **13 — Post-merge production proof that the producer actually fires and stamps a real node**
  - Path: `current`
  - Expected outcome: at least one previously-`nullStamp` tactic reads `keyed` after the first post-merge forward `transition-node` run on `origin/main`, with a `{hash, sha}` entry whose `hash` matches `strategy-fingerprint.ts` output for that serving strategy and whose `sha` resolves to a real commit (`git cat-file -t <sha>` → `commit`, not `blob`).
  - Finding: this is the node body's own Manual check 2 — explicitly documented as the only check that proves the producer fires in production, and it cannot run pre-merge (it depends on a real post-merge `transition-node` invocation on `origin/main`). All 12 pre-merge script-verifiable QA items passed independently in this qa-fix pass: the census runs correctly and reads plausible numbers (`47` open / `1` keyed — this tactic's own mint-time hand-stamp — / `0` bare-string / `46` null / `0` stale for `strategy-graph-native-dispatch`; graph-wide `bareString` unchanged at `30`), `transition-node`'s flag construction and `STRATEGY_STALE`-gating are correct by grep, the doctrine docs and CI wiring are correct by grep, and the full test suites are green (vitest 776/776, typecheck, lint, `test-transition-node.sh` 5/5 including both new stamp cases, `test-park-node.sh` 21/21, `test-strategy-stamp-doctrine.sh` 6/6). The Step 3.5 disposition Workflow's adversarial verify pass independently confirmed both design judgment calls (items 14/15 in the QA plan) are already resolved by the node body's own text and doctrine and required no human sign-off; this item alone remains genuinely non-assertable before merge.
  - Verifiability: WAIT
  - Check: `node --import tsx/esm packages/intentionsutil/scripts/strategy-stamp-census.ts` (graph-wide, or `--strategy <sid>` scoped) against a freshly-fetched `origin/main`, after any tactic has advanced through a forward `transition-node` transition post-merge; confirm that tactic moved `nullStamp → keyed` and that its recorded `sha` is a real commit (`git cat-file -t <sha>`).

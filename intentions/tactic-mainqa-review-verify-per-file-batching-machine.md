---
id: tactic-mainqa-review-verify-per-file-batching-machine
kind: tactic
statement: "Post-merge verification of tactic-review-verify-per-file-batching
  (PR #3027) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-review-verify-per-file-batching
  pr: 3027
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-verify-per-file-batching
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-review-verify-per-file-batching (PR #3027) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-review-verify-per-file-batching` (PR #3027). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **item-9 — Realized agent-count reduction shows up in the next token-audit window**
  - Path: `current`
  - Expected outcome: The verify-phase subagent count per review-fix run drops toward the distinct (brief × file) group count, confirming the batching produced the intended cost reduction rather than only restructuring prompts.
  - Finding: Not assertable at merge time — the pre-change baseline was 131 subagents across 41 distinct (run, file) groups over 18 runs (2026-07-31 audit), and the plan's own Verification section states the 3.2x figure is an upper bound, not a threshold, because the high-confidence-per-file-group distribution has never been measured. Requires real review-fix runs to accumulate post-merge.
  - Verifiability: WAIT
  - Check: run `/dispatch-token-audit` over the post-merge window; read the new `verify:`/`residue:` log lines review-fix now emits and compare observed subagent count per run against the pre-change baseline (131 agents / 41 (run, file) groups / 18 runs).
- **item-10 — Refutation rate and finding quality stay stable; no Required finding reaches fix with zero votes**
  - Path: `current`
  - Expected outcome: Refutation rate stays near the measured 69% baseline (91 refuted / 37 upheld), every Required finding carries its required vote count (floor 1, never 0) in real runs, and batched judgments show no anchoring drift where one strong finding pulls the verdicts of its file-mates.
  - Finding: Not assertable at merge time — the plan's Verification section lists refutation-rate stability, the zero-vote-absence check, and finding-quality preservation as observed-in-production prose checks requiring future windows of real review-fix runs. The mechanically-checkable invariants backing this (vote-parity, fail-closed dead-agent handling, brief-key separation) are already covered by the 32-case test suite, which passed 32/32 in this QA pass.
  - Verifiability: WAIT
  - Check: compare the skeptic refutation rate against the ~69% baseline and inspect `verify_report` blocks in future PR comments for `verdict: "unverified"` entries, via `/dispatch-token-audit` and PR-comment review.

---
id: tactic-mainqa-review-skill-body-decomposition-machine
kind: tactic
statement: "Post-merge verification of tactic-review-skill-body-decomposition
  (PR #3025) — machine-verifiable items"
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
  branch: tactic-review-skill-body-decomposition
  pr: 3025
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-skill-body-decomposition
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-review-skill-body-decomposition (PR #3025) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-review-skill-body-decomposition` (PR #3025). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **item-13-context-reduction-materializes — Parent-session context reduction actually materializes on live runs**
  - Path: `current`
  - Expected outcome: Parent-worker peak context drops materially below the 184,468-token baseline and the majority of post-merge `/review-fix` runs fall under 150k, with no offsetting blow-up in any subagent.
  - Finding: Cannot be measured pre-merge — no post-merge live `/review-fix` run exists yet. The tactic's own Verification section defers this to a multi-run `/dispatch-token-audit` re-baseline (the original baseline was 18 runs over 5 days).
  - Verifiability: WAIT
  - Check: `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh --days 7 --json-out tmp/audit.json` then `jq '[.sessions[] | select(.type=="worker" and (.phases|has("review-fix")))] | {n: length, avg_peak: (if length==0 then null else (([.[].peak_context]|add)/length|floor) end), over_150k: ([.[]|select(.peak_context>150000)]|length)}' tmp/audit.json` — target `avg_peak` materially below 184,468 and `over_150k` a minority of `n`.
- **item-14-resume-parity — Resume-after-interruption still works through the new subagent boundaries**
  - Path: `current`
  - Expected outcome: A `/review-fix` session interrupted mid-run (after the Workflow returns but before Step 6 completes) resumes cleanly: exactly one marker PR comment (no duplicate), exactly one set of follow-up nodes (no duplicate filing), and `graph-commit` landing once.
  - Finding: Requires a real interrupted session against a real PR — the tactic's own Verification section defers this to the next live `/review-fix` pass.
  - Verifiability: WAIT
  - Check: on the next such interruption, confirm exactly one `<!-- dispatch:review-fix -->` PR comment exists and exactly one set of follow-up draft tactic nodes was created (no duplicates from a resumed Step 5/6 subagent fork).
- **item-15-detection-parity — Detection parity: CodeQL and npm-audit findings identical pre/post extraction**
  - Path: `current`
  - Expected outcome: `dispatch-review-codeql` / `dispatch-review-npm-audit` surface the exact same findings the old inline blocks would have on a comparable diff — same alerts, same severity mapping, same `introduced_by_diff` classification, same omission of pre-existing moderate/low advisories.
  - Finding: Requires live CodeQL alerts and a real dependency-changing diff to compare against — the tactic's own Verification section defers this to the next live `/review-fix` pass on an `app_or_rules` surface.
  - Verifiability: WAIT
  - Check: on the next such run, diff the findings the two scripts emit against what the pre-decomposition inline blocks would have produced on the same alerts/advisories (manual comparison; no automated pre/post harness exists).

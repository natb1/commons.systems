---
id: tactic-dispatch-code-review-reject-pattern-self-match
kind: tactic
statement: dispatch-code-review's rejection-signature check greps the ENTIRE
  combined stdout+stderr of the nested claude -p session for literal reject
  strings with no structural scoping, so a built-in review that quotes or
  excerpts the literal rejection text (which this very PR's own diff embeds as
  fixture data) could false-positive-match and spuriously hard-stop a future
  review-fix pass even though the review ran successfully
owner: ai
status: raw
parent: null
rationale: "Surfaced by this session's own review-fix pass on PR #3007
  (tactic-review-code-review-invocation-contract) as prescanned finding
  review-3; the review Workflow classified it Deferred rather than auto-fixing
  it in this pass, since scoping the match correctly (e.g. requiring it on the
  first non-empty output line, or matching a real structural marker the CLI
  emits) needs to be verified against the built-in's actual, not-yet-stable
  output shape before landing."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# dispatch-code-review's rejection-signature check greps the ENTIRE combined stdout+stderr of the nested claude -p session for literal reject strings with no structural scoping, so a built-in review that quotes or excerpts the literal rejection text (which this very PR's own diff embeds as fixture data) could false-positive-match and spuriously hard-stop a future review-fix pass even though the review ran successfully

Draft finding, not yet decomposed — recorded per the standing rule that findings
land as graph nodes, never journald or plan prose alone.

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-code-review:190-193` (the `REJECT_PATTERNS` array and the subsequent grep over `$OUTPUT_CONTENT`).
- **Source PR**: #3007 (`tactic-review-code-review-invocation-contract`) — surfaced directly in this session's own `/review-fix` pass on that PR (prescanned finding `review-3`), then classified `Deferred` by the review Workflow.
- **Failure scenario**: The reject-pattern check greps the *entire* combined stdout+stderr of the nested `claude -p` run for literal strings, unscoped to any structural error marker. PR #3007's own diff embeds the literal string `'Skill code-review cannot be used with Skill tool due to disable-model-invocation'` as fixture/test data in `.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs:88` and `.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh`. If the built-in's own free-form findings-text prose quotes or excerpts that fixture string when discussing those files (plausible — `/code-review` often quotes the code it reviews), the unscoped grep will false-positive-match it as a genuine rejection signature, causing a future `/review-fix` pass over this same code to spuriously hard-stop at Step 1b (exit 3), claiming the instrument is unavailable even though it ran successfully.
- **Adversarial verdict**: Classified `Deferred` by the review Workflow's classify stage on PR #3007 — a plausible, code-grounded correctness risk, not yet independently re-verified by an adversarial skeptic pass (it did not clear the `Required` bar that triggers skeptic verification in that run).

## Shape of a fix (not yet decided — decompose in `/align-tactics`)

1. Scope the reject-pattern match more precisely — e.g. require the pattern to appear as the first non-empty line of `$OUTPUT_CONTENT`, or match a structural marker the CLI actually emits on rejection — rather than a bare substring search across the whole free-form review text.
2. Re-verify against the built-in's actual (not yet stable across runs, per `references/code-review-invocation.md`) output shape before landing, since a fix tuned to one observed shape could miss another.

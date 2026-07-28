---
id: tactic-workflow-launch-prose-lint
kind: tactic
statement: Lint net-new skill and plan prose that phrases a Workflow launch as a file path
owner: ai
status: raw
parent: null
rationale: The launch contract has no owned code home to generate restatements
  from, so its mechanical floor is a lint over the authored text — the layer
  where this defect actually entered (a plan body prescribing the broken form).
  Needs the canonical home to exist first so the failure message can point at
  it.
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
blocked_by:
  - tactic-workflow-launch-contract-home
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Lint net-new skill and plan prose that phrases a Workflow launch as a file path

Retained from the 2026-07-27 `/align-strategy` round. The mechanical-floor
placement — a prose lint rather than a PreToolUse guard at the call site, and
why — is recorded as a clarification on `strategy-graph-native-dispatch`; read
it before implementing, since it records the rejected alternative and the two
grounds for rejecting it.

## Context

This defect entered as authored prose in a plan body: `tactic-align-tactics-workflow`
Unit 2 prescribed the directive with the explicit parenthetical *"no `name:`, no
inline `script`"*, and it propagated to five skill sites. A prose launch
instruction has no test surface, so nothing caught it for two days and five
killed subagents.

Unlike phase routing (clarification 111 on the serving strategy, which puts
ladder prose under generation from `forwardPhase` with a CI drift check), a
Workflow launch is a model-level tool call with no owned code home to generate
from. The contract's home is itself prose, so the floor has to be a lint over
the text.

## Scope

`.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` — already CI-wired
through `run-lint.sh`, and already carrying two net-new-added-lines rules (the
`shell-json` echo-into-jq rule and the `gh-rest-porcelain` rule) whose structure
this one follows.

Two changes:

1. **Widen the file scope.** The linter currently diffs all files but gates both
   rules behind `is_shell_script` (from `lib.sh`). The new rule needs markdown —
   `.claude/skills/**/*.md` at minimum, and plan bodies in `intentions/*.md`,
   since that is where this one was authored.
2. **Add the rule.** Match net-new text that phrases a Workflow launch as a path:
   the `Invoke the Workflow tool on \`<path>.js\`` shape, and a bare `scriptPath`
   in skill or plan prose. Fail with the remediation inline, pointing at the
   canonical rule file, per the linter's existing convention.

Keep the net-new-added-lines-only discipline the existing rules use: pre-existing
sites are not retroactively flagged, so this can land before or after every site
is converted without a flag day.

**Dependencies:** `tactic-workflow-launch-contract-home` — the failure message
must point at the canonical home, so the home has to exist first.

**Out of scope:** a PreToolUse hook on the Workflow tool (deliberately rejected —
see the clarification); the upstream report.

## Verification

`.claude/skills/dispatch-propagate/scripts/` carries test scripts for its
siblings (e.g. `test-dispatch-graph-execute.sh`); add cases there covering a
positive match, a negative (a correct `name:`-form instruction), and the
pre-existing-line exemption. Then confirm CI's `run-lint.sh` picks the rule up on
a branch that adds a violating line.

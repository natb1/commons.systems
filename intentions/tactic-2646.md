---
id: tactic-2646
kind: tactic
statement: "budget: retire the /budget-etl skill and its dispatch config case"
owner: human
status: raw
parent: tactic-2642
rationale: >-
  - Delete `.claude/skills/budget-etl/`.

  - Remove the `budget-etl` case from `dispatch-config-load` (**KEEP** the
  `statements` case — `budget-parse-job` and `dispatch-statements-scan` depend
  on it); delete `budget-etl.example.json` and the budget-etl config tests in
  `test-dispatch-scripts.sh`.

  - Optionally delete `cmd/patch`/`cmd/dump` dirs (nothing runs `go run ./cmd/*`
  once the old skill is gone).

  - Rename `budget-etl` → `budget` skill references in
  `.claude/rules/sandbox.md`, `.claude/skills/digest/SKILL.md` (also refresh the
  now-stale plaintext `budget.json` mention),
  `.claude/skills/ref-issue-labels/SKILL.md`, `README.md`.
reading: null
gap: null
serves: []
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  source: github:natb1/commons.systems#2646
---
# budget: retire the /budget-etl skill and its dispatch config case

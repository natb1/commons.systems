---
name: ref-unit-test
description: Forked unit test loop — runs Step 4 in isolated context
context: fork
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Unit Test Loop (Forked)

Self-contained wiggum-loop for Step 4. Runs in isolated context — cannot invoke other skills.

## Sandbox

Use `dangerouslyDisableSandbox: true` for git write operations (`git add`, `git commit`, `git merge`, `git push`) and all `gh` CLI calls (`issue-state-write`, `post-pr-comment.sh`).

## Loop Mechanics

Iteration counter starts at 1. Each cycle:

### Execute

- Merge `origin/main` (dangerouslyDisableSandbox)
- Run unit tests and linting

### Evaluate

- All pass → go to Terminate
- Failures → go to Iterate

### Progress Report

- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation to `$(git rev-parse --show-toplevel)/tmp/unit-eval-<N>.txt`
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/unit-eval-<N>.txt"}' \
    > "$(git rev-parse --show-toplevel)/tmp/unit-subagent-state.json"
  ```

### Iterate

Fix failures. Commit fixes (dangerouslyDisableSandbox). Increment iteration counter. Return to Execute.

### Terminate

- Update issue state to step=5/phase=core:
  ```bash
  issue-state-write <issue-number> '{"version":1,"step":5,"step_label":"PR Creation","phase":"core","active_skills":["ref-memory-management","ref-pr-workflow","ref-create-pr"]}'
  ```
- Write final checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"terminate","last_eval_file":"tmp/unit-eval-<N>.txt"}' \
    > "$(git rev-parse --show-toplevel)/tmp/unit-subagent-state.json"
  ```

## Return Contract

Final output message must be valid JSON:

```json
{
  "status": "success",
  "step_completed": 4,
  "iterations": 3,
  "final_summary_file": null,
  "error": null
}
```

- `"success"`: Loop completed, all tests pass
- `"failure"`: Unrecoverable error — include details in `error`
- `"needs_user"`: Unexpected situation requiring user input

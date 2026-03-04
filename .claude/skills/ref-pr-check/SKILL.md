---
name: ref-pr-check
description: Forked verify loop — runs Steps 6 and 7 in isolated context
context: fork
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Verify Loop (Forked)

Self-contained wiggum-loop for Steps 6 (acceptance) and 7 (smoke). Runs in isolated context — cannot invoke other skills.

On load, read issue state via `issue-state-read` to determine entry point:
- step=6 → start at Phase 1 (acceptance)
- step=7 → start at Phase 2 (smoke)

## Sandbox

Use `dangerouslyDisableSandbox: true` for git write operations (`git add`, `git commit`, `git merge`, `git push`) and all `gh` CLI calls (`gh run list`, `gh run view`, `issue-state-write`, `post-pr-comment.sh`).

## Phase 1: Acceptance Tests (Step 6)

Iteration counter starts at 1.

### Execute

Run in a background Task (`run_in_background: true`). Note the `output_file` path:
```bash
gh run list --branch <branch> --limit 5
gh run view <run-id>
```
If the run is in progress, wait for it to complete before returning output.

### Evaluate

- All pass → go to Terminate
- Test failures → go to Iterate
- Infrastructure failures → set status to `"needs_user"`, go to Return

### Progress Report

- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation to `$(git rev-parse --show-toplevel)/tmp/acceptance-eval-<N>.txt`
- Post combined comment:
  ```bash
  post-pr-comment.sh <pr-num> <output_file> "$(git rev-parse --show-toplevel)/tmp/acceptance-eval-<N>.txt"
  ```
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/acceptance-eval-<N>.txt"}' \
    > "$(git rev-parse --show-toplevel)/tmp/acceptance-subagent-state.json"
  ```

### Iterate

Fix failures. Commit and push (dangerouslyDisableSandbox). Increment counter. Return to Execute.

### Terminate

- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/acceptance-final.txt`:
  ```
  # Acceptance Test Review - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## Conclusion

  All acceptance tests passed. Proceeding to smoke tests.
  ```
- Post:
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/acceptance-final.txt"
  ```
- Update issue state to step=7/phase=verify:
  ```bash
  issue-state-write <issue-number> '{"version":1,"step":7,"step_label":"Smoke Test Loop","phase":"verify","active_skills":["ref-memory-management","ref-pr-workflow"]}'
  ```
- Reset iteration counter to 1. Proceed to Phase 2.

## Phase 2: Smoke Tests (Step 7)

### Execute

Same as Phase 1 Execute (CI monitoring).

### Evaluate

- All pass → go to Terminate
- Smoke test failures → go to Iterate
- Deploy failures → set status to `"needs_user"`, go to Return

### Progress Report

- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation to `$(git rev-parse --show-toplevel)/tmp/smoke-eval-<N>.txt`
- Post combined comment:
  ```bash
  post-pr-comment.sh <pr-num> <output_file> "$(git rev-parse --show-toplevel)/tmp/smoke-eval-<N>.txt"
  ```
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/smoke-eval-<N>.txt"}' \
    > "$(git rev-parse --show-toplevel)/tmp/smoke-subagent-state.json"
  ```

### Iterate

Fix failures. Commit and push (dangerouslyDisableSandbox). Increment counter. Return to Execute.

### Terminate

- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/smoke-final.txt`:
  ```
  # Smoke Test Review - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## Conclusion

  Smoke tests passed. Preview deployment verified.
  ```
- Post:
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/smoke-final.txt"
  ```
- Update issue state to step=8/phase=qa:
  ```bash
  issue-state-write <issue-number> '{"version":1,"step":8,"step_label":"QA Review Loop","phase":"qa","active_skills":["ref-memory-management","ref-pr-workflow","ref-qa"]}'
  ```
- Go to Return with status `"success"`.

## Return Contract

Final output message must be valid JSON:

```json
{
  "status": "success",
  "step_completed": 7,
  "iterations": {"acceptance": 2, "smoke": 1},
  "final_summary_file": "tmp/smoke-final.txt",
  "error": null
}
```

- `"success"`: Both phases completed
- `"failure"`: Unrecoverable error — include details in `error`
- `"needs_user"`: Infrastructure/deploy failure requiring user input
